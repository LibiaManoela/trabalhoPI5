import os
import torch

# Desativa o aviso de segurança de carregamento de pesos (.bin)
# Isso resolve o erro original de vulnerabilidade sem quebrar o transformers
torch.serialization.add_safe_globals([set])

# Evita conflitos de implementação do Protobuf
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

from llama_index.core.node_parser import SentenceSplitter

#adicionei o de cima

from typing import List, Tuple  # Importa tipos (List/Tuple) para anotações de tipo no Python
import os  # Importa utilitários do sistema operacional (ex.: verificar se arquivo existe)
import hashlib  # Importa funções de hash (usaremos para gerar IDs estáveis para os casos)
import re  # Importa regex (vamos usar para um reranking híbrido simples por termos)
import warnings  # Importa a biblioteca warnings para gerenciar avisos do Python
warnings.filterwarnings("ignore", category=UserWarning)  # Ignora UserWarnings (apenas para deixar a interface limpa)

import streamlit as st  # Importa a biblioteca Streamlit para criar interface web
import torch  # Importa PyTorch para operações tensoriais e uso de GPU (CUDA)
import chromadb  # Importa o ChromaDB (banco vetorial) para armazenar e buscar embeddings
from transformers import AutoTokenizer, AutoModel  # Importa tokenizer e modelo (BioBERTpt-clin) para gerar embeddings

import nest_asyncio  # Permite usar asyncio dentro do Streamlit sem conflito
import asyncio  # Importa asyncio para lidar com loops assíncronos

from llama_index.core.llms import ChatMessage  # Importa ChatMessage para estruturar mensagens no formato do LlamaIndex
from llama_index.llms.ollama import Ollama  # Importa o conector do LlamaIndex para o Ollama (modelo local)
from llama_index.core import Settings  # Importa Settings para definir o LLM padrão do LlamaIndex


# -----------------------------
# Async fix (Streamlit)
# -----------------------------
# O Streamlit pode executar o script múltiplas vezes e, dependendo do ambiente,
# um loop assíncrono pode já existir. Este bloco evita conflito com asyncio.
try:
    asyncio.get_running_loop()  # Tenta pegar o loop atual (se existir)
except RuntimeError:
    nest_asyncio.apply()  # Se não existir, aplica patch para permitir asyncio dentro do Streamlit


# -----------------------------
# Config
# -----------------------------
# Define configurações da página (título e layout mais largo para caber melhor no navegador)
st.set_page_config(page_title="Assistente de Triagem Clínica - HCI", layout="wide")
# Ajuste para pedaços de 512 caracteres com uma pequena sobreposição
Settings.node_parser = SentenceSplitter(chunk_size=512, chunk_overlap=50)

# Define constantes principais do sistema (nomes de coleção/pasta/arquivo/modelo)
COLLECTION_NAME = "triagem_hci"            # Nome da coleção do ChromaDB para armazenar os casos vetorizados
CHROMA_PATH = "./chroma_db"               # Pasta local onde o ChromaDB persistirá os dados
CASES_FILE = os.path.join(os.path.dirname(__file__), "..", "documentos", "meus_casos.txt")  # Arquivo de texto com casos simulados de triagem (um por linha)
EMBED_MODEL_NAME = "pucpr/biobertpt-clin"  # Modelo BioBERTpt-clin (Transformers) para gerar embeddings clínicos
TOP_K = 5                                 # Número de casos similares a recuperar no ChromaDB

# Parâmetros de controle do comportamento do RAG
# - O RAG é útil, mas não pode "sobrepor" os sintomas do novo caso.
# - Vamos instruir explicitamente o modelo e também aplicar um reranking híbrido simples.
LANGUAGE = "pt-br"  # Idioma desejado (usado apenas como convenção interna)


# -----------------------------
# LLM (Ollama)
# -----------------------------
# Carrega o modelo (Mistral) via Ollama apenas UMA vez e mantém em cache no Streamlit.
# Isso evita re-instanciar o LLM a cada interação/reexecução do script.
@st.cache_resource
def load_llm():
    # Inicializa o LLM do Ollama com timeout alto (útil para respostas longas)
    llm = Ollama(model="mistral", request_timeout=420.0)
    # Define este LLM como padrão para o LlamaIndex (boa prática)
    Settings.llm = llm
    return llm

llm = load_llm()  # Carrega o LLM (cached)


# -----------------------------
# Device (GPU)
# -----------------------------
# Determina se o PyTorch pode usar CUDA (GPU). Se não, usa CPU.
def get_device() -> torch.device:
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")

device = get_device()  # Define o dispositivo global


# Sidebar GPU diagnostics (PyTorch)
# Exibe um painel lateral para confirmar se embeddings estão usando GPU.
st.sidebar.subheader("Diagnóstico GPU (PyTorch)")
st.sidebar.write("CUDA disponível:", torch.cuda.is_available())
st.sidebar.write("Dispositivo:", str(device))

if torch.cuda.is_available():
    # Nome da GPU e uso de VRAM ajudam a confirmar que o modelo está realmente na GPU
    st.sidebar.write("GPU:", torch.cuda.get_device_name(0))
    st.sidebar.write("VRAM alocada (MB):", round(torch.cuda.memory_allocated(0) / 1024**2, 2))
    st.sidebar.write("VRAM reservada (MB):", round(torch.cuda.memory_reserved(0) / 1024**2, 2))
else:
    st.sidebar.warning("PyTorch está usando CPU para embeddings.")

# Observação importante: Ollama usa GPU de forma independente do PyTorch.
# Mesmo que PyTorch esteja em GPU, o Mistral via Ollama pode estar em CPU ou GPU.
st.sidebar.caption(
    "Obs.: GPU do Ollama é separada. Confirme com `nvidia-smi` vendo `ollama.exe`."
)


# -----------------------------
# Chroma (cache)
# -----------------------------
# Cria (ou carrega) a coleção do ChromaDB com persistência em disco.
# Mantemos em cache para não reabrir o banco a cada interação.
@st.cache_resource
def get_chroma_collection():
    client = chromadb.PersistentClient(path=CHROMA_PATH)  # Cliente persistente (salva/recupera do disco)
    # get_or_create: evita ter que verificar manualmente se existe ou não
    collection = client.get_or_create_collection(name=COLLECTION_NAME)
    return collection

collection = get_chroma_collection()  # Coleção do Chroma (cached)


# -----------------------------
# Load embedder once (cache)
# -----------------------------
# Carrega o tokenizer e o modelo de embeddings apenas uma vez.
# Move o modelo para GPU (se disponível) e coloca em modo avaliação (eval()).
@st.cache_resource
def load_embedder(model_name: str, device_str: str):
    tokenizer = AutoTokenizer.from_pretrained(model_name)  # Tokenizador do modelo clínico
    model = AutoModel.from_pretrained(model_name)          # Modelo (gera embeddings)
    model.eval()                                           # Modo avaliação: desliga dropout e estabiliza a inferência
    model.to(device_str)                                   # Move o modelo para o dispositivo (cuda ou cpu)

    # Otimização opcional: acelera kernels do cuDNN em algumas situações
    if device_str.startswith("cuda"):
        torch.backends.cudnn.benchmark = True

    return tokenizer, model

tokenizer, model = load_embedder(EMBED_MODEL_NAME, str(device))  # Carrega embedder (cached)


# -----------------------------
# Utils
# -----------------------------
def stable_id(text: str) -> str:
    """
    ID estável: evita duplicatas mesmo se reordenar casos.
    Gera um hash SHA1 do texto do caso e usa como identificador no ChromaDB.
    """
    h = hashlib.sha1(text.encode("utf-8")).hexdigest()
    return f"case_{h}"


@st.cache_data
def load_triagem_cases(filepath: str) -> List[str]:
    """
    Lê o arquivo de casos simulados (casos.txt).
    Retorna uma lista com cada linha não vazia como um caso.
    Usa cache_data para evitar reler o arquivo a cada interação.
    """
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]


def mean_pool(last_hidden_state: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
    """
    Mean pooling ponderado pela máscara (melhor do que mean() direto).

    last_hidden_state: [B, T, H] -> embeddings por token
    attention_mask:    [B, T]    -> 1 para tokens válidos, 0 para padding

    Isso evita que tokens de padding "contaminem" a média do embedding.
    """
    mask = attention_mask.unsqueeze(-1).type_as(last_hidden_state)  # [B, T, 1]
    summed = (last_hidden_state * mask).sum(dim=1)                  # [B, H]
    counts = mask.sum(dim=1).clamp(min=1e-9)                        # [B, 1] evita divisão por zero
    return summed / counts


def embed_texts(texts: List[str], batch_size: int = 16) -> List[List[float]]:
    """
    Converte uma lista de textos em embeddings (vetores) usando o BioBERTpt-clin.

    Otimizações:
    - Processa em batch (aproveita melhor a GPU)
    - Usa torch.inference_mode() (mais rápido e usa menos memória)
    - Usa autocast FP16 quando em CUDA (reduz VRAM e acelera)

    Retorna List[List[float]] compatível com ChromaDB.
    """
    all_embs: List[List[float]] = []
    use_amp = torch.cuda.is_available()  # Se CUDA estiver disponível, usamos mixed precision

    with torch.inference_mode():
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]

            # Tokeniza com padding/truncation (max_length controla custo e memória)
            enc = tokenizer(
                batch,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=256
            )

            # Move inputs para o device (cuda/cpu)
            enc = {k: v.to(device) for k, v in enc.items()}

            # Executa o modelo (com autocast FP16 na GPU)
            if use_amp:
                with torch.autocast(device_type="cuda", dtype=torch.float16):
                    out = model(**enc)
                    pooled = mean_pool(out.last_hidden_state, enc["attention_mask"])
            else:
                out = model(**enc)
                pooled = mean_pool(out.last_hidden_state, enc["attention_mask"])

            # Normaliza (opcional) para estabilizar similaridade (cosine-like)
            pooled = torch.nn.functional.normalize(pooled, p=2, dim=1)

            # Converte para lista (CPU) para armazenar no Chroma
            all_embs.extend(pooled.detach().cpu().tolist())

    # Opcional: libera cache CUDA (útil se processar muitos casos em sequência)
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    return all_embs


def extract_keywords_for_rerank(text: str) -> List[str]:
    """
    Extrai palavras/termos-chave simples para um reranking híbrido.

    Por que isso é necessário?
    - Você viu um caso real: o embedding retornou "febre/tosse" como MAIS similar
      para um caso de "dor torácica" (o que clinicamente é incoerente).
    - Então, além da distância vetorial, usamos um "sinal lexical" mínimo.

    Aqui listamos termos críticos típicos de alta gravidade (podem ser ajustados).
    """
    t = text.lower()

    # Lista de termos que, quando presentes no novo caso, queremos que apareçam também no caso similar escolhido.
    # (Você pode adicionar/remover termos conforme seu conjunto de casos.)
    critical_terms = [
        "dor torácica", "dor no peito", "peito",
        "irradia", "braço esquerdo", "mandíbula",
        "sudorese", "sudorese fria",
        "dispneia", "falta de ar", "saturação", "spo2", "89%", "88%", "90%",
        "confusão", "inconsciência", "desmaio", "convulsão",
        "hemorragia", "sangramento",
        "pa ", "pressão", "hipotensão", "hipertensão",
        "infarto", "iam", "avc", "sepse"
        "glicemia", "pressão alta", "TSH", "tontura", "palpitação"
    ]

    found = []
    for term in critical_terms:
        if term in t:
            found.append(term)

    return found


def rerank_pairs_hybrid(new_case_text: str, pairs_sorted_by_dist: List[Tuple[str, float]]) -> List[Tuple[str, float]]:
    """
    Reranking híbrido (distância + termos):
    - Começamos com a lista já ordenada por menor distância (mais similar).
    - Se o novo caso contém termos críticos, tentamos escolher como "best_case" um
      caso entre os TOP-K que também contenha o maior número desses termos.

    Isso ajuda a evitar a falha observada na prática:
    - Novo caso: dor torácica (IAM) -> deveria puxar um caso de dor torácica
    - Mas embedding puxou primeiro um caso de febre/tosse.

    Importante:
    - Isso não substitui um reranker clínico robusto, mas resolve o problema mais evidente
      sem adicionar bibliotecas ou modelos extras.
    """
    keywords = extract_keywords_for_rerank(new_case_text)

    # Se não há termos críticos, mantemos o ranking puramente por distância.
    if not keywords:
        return pairs_sorted_by_dist

    def keyword_score(case_text: str) -> int:
        ct = case_text.lower()
        return sum(1 for k in keywords if k in ct)

    # Escolhe o melhor caso pelo maior score lexical; em empate, menor distância.
    best = max(
        pairs_sorted_by_dist,
        key=lambda x: (keyword_score(x[0]), -float(x[1]) if x[1] is not None else float("-inf"))
    )

    # Reorganiza lista: best primeiro, mantendo os demais na ordem original (sem perder rastreabilidade).
    new_list = [best] + [p for p in pairs_sorted_by_dist if p != best]
    return new_list


def looks_english(text: str) -> bool:
    """
    Heurística simples para detectar resposta em inglês.
    Não é perfeito, mas suficiente para acionar um fallback automático.
    """
    if not text:
        return False
    markers = ["given the", "according to", "the patient", "symptoms", "should be", "classify"]
    low = text.lower()
    return any(m in low for m in markers)


# -----------------------------
# Indexação incremental no Chroma
# -----------------------------
def ensure_cases_indexed(cases: List[str]):
    """
    Garante que os casos do arquivo casos.txt estejam indexados no ChromaDB.
    Faz indexação incremental:
    - Busca IDs já existentes
    - Só cria embeddings e insere os casos que ainda não existem
    """
    if not cases:
        return

    # Busca IDs existentes no Chroma (barato o suficiente para coleções pequenas/médias)
    existing = set()
    try:
        data = collection.get(include=["ids"])
        existing = set(data.get("ids", []))
    except Exception:
        existing = set()

    new_texts: List[str] = []
    new_ids: List[str] = []
    new_metas: List[dict] = []

    for c in cases:
        cid = stable_id(c)
        if cid not in existing:
            new_ids.append(cid)
            new_texts.append(c)
            new_metas.append({"content": c})

    # Se não há nada novo, não faz nada
    if not new_texts:
        return

    # Gera embeddings só para os casos novos
    embs = embed_texts(new_texts, batch_size=16)

    # upsert: insere ou atualiza caso o ID já exista por concorrência/execução paralela
    collection.upsert(
        ids=new_ids,
        embeddings=embs,
        metadatas=new_metas,
    )


# Carrega e indexa casos apenas quando necessário
triagem_cases = load_triagem_cases(CASES_FILE)
if not triagem_cases:
    st.error("Arquivo 'casos.txt' não encontrado ou vazio.")
else:
    with st.spinner("Preparando base de casos (Chroma + embeddings)..."):
        ensure_cases_indexed(triagem_cases)


# -----------------------------
# UI
# -----------------------------
# Mostra o título da interface da aplicação no navegador
st.title("Assistente de Triagem Clínica - HCI")

# Exibe a imagem do Protocolo de Manchester na interface
st.image(
    "protocolo.png",
    caption="Protocolo de Manchester",
    width=300  # ajuste: 250, 300, 350, 400
)

# Campo onde o profissional de saúde descreve os sintomas do paciente
new_case = st.text_area(
    "Descreva os sintomas do paciente na triagem (em português)",
    height=120
)


# Quando o botão é clicado, o sistema começa a análise
if st.button("Classificar e gerar conduta"):
    if not new_case.strip():
        st.warning("Por favor, insira os sintomas do paciente.")
    else:
        with st.spinner("Classificando..."):
            try:
                # Embedding do caso novo (batch de 1) - roda no BioBERT (GPU se disponível)
                query_emb = embed_texts([new_case], batch_size=1)[0]

                # Consulta no ChromaDB os TOP_K casos mais semelhantes ao caso informado
                results = collection.query(
                    query_embeddings=[query_emb],
                    n_results=TOP_K,
                    include=["metadatas", "distances"]
                )

                # Extrai os textos (conteúdos) dos casos similares e suas distâncias
                # IMPORTANTE:
                # - No Chroma, "dist" menor significa "mais similar"
                # - Porém, por robustez e clareza, vamos ordenar explicitamente por dist crescente.
                raw_similar_cases = [m["content"] for m in results["metadatas"][0]]
                raw_distances = results.get("distances", [[None] * len(raw_similar_cases)])[0]

                # Junta (case, dist) e ordena por menor distância (mais similar primeiro)
                pairs: List[Tuple[str, float]] = list(zip(raw_similar_cases, raw_distances))
                pairs_sorted = sorted(
                    pairs,
                    key=lambda x: float(x[1]) if x[1] is not None else float("inf")
                )

                # APLICA RERANKING HÍBRIDO (distância + termos críticos)
                # Isso reduz bastante o risco de escolher como "best" um caso incoerente clinicamente.
                pairs_sorted = rerank_pairs_hybrid(new_case, pairs_sorted)

                # Agora separamos novamente em listas já ordenadas
                similar_cases = [c for (c, d) in pairs_sorted]
                distances = [d for (c, d) in pairs_sorted]

                # Caso mais priorizado após reranking — será a principal referência do RAG
                best_case = similar_cases[0] if similar_cases else ""
                best_dist = distances[0] if distances else None

                # Casos adicionais (contexto secundário)
                other_cases = similar_cases[1:] if len(similar_cases) > 1 else []
                other_dists = distances[1:] if len(distances) > 1 else []

                # Monta um prompt "anti-erro":
                # 1) FORÇA PT-BR
                # 2) PROÍBE inventar sintomas não presentes no novo caso
                # 3) DEFINE que os casos similares são só referência (não para copiar sintomas)
                # 4) Deixa explícito que a decisão deve partir do NOVO CASO
                other_cases_text = (
                    "\n".join([f"- dist={d}\n  {c}" for c, d in zip(other_cases, other_dists)])
                    if other_cases else "- (nenhum)\n"
                )

                input_text = (
                    "NOVO CASO (use como fonte principal; NÃO invente sintomas):\n"
                    f"{new_case}\n\n"
                    "CASO MAIS PRÓXIMO (apenas como referência; pode ter sintomas diferentes):\n"
                    f"- dist={best_dist}\n"
                    f"- {best_case}\n\n"
                    "OUTROS CASOS PRÓXIMOS (apenas apoio; podem conflitar):\n"
                    f"{other_cases_text}"
                    "SINTOMAS DO PACIENTE ATUAL:\n"
                    "CONTEXTO RECUPERADO (Casos Históricos e Diretrizes Técnicas):\n"
                    f"{similar_cases}\n\n"
                    "INSTRUÇÃO:\n"
                    "Se o contexto contiver diretrizes técnicas, use-as para sugerir a conduta.\n"
                    "Se contiver casos parecidos, use-os para confirmar o diagnóstico.\n\n"
                    "REGRAS IMPORTANTES:\n"
                    "1) Responda OBRIGATORIAMENTE em PORTUGUÊS DO BRASIL.\n"
                    "2) NÃO copie sintomas dos casos próximos.\n"
                    "3) Se um caso próximo contiver sintomas que NÃO aparecem no novo caso, ignore esses sintomas.\n"
                    "4) Classifique pelo Protocolo de Manchester: vermelha, laranja, amarela, verde ou azul.\n"
                )

                # System prompt forte (idioma + regras clínicas + evitar alucinação por contexto)
                system_prompt = (
                    "Você é um profissional de saúde responsável pela triagem clínica no Hospital de Clínicas de Ijuí.\n\n"
                    "RESPONDA OBRIGATORIAMENTE EM PORTUGUÊS DO BRASIL.\n"
                    "NUNCA responda em inglês.\n\n"
                    "TAREFA:\n"
                    "- Analisar o NOVO CASO e classificar pelo Protocolo de Manchester "
                    "(vermelha, laranja, amarela, verde ou azul).\n"
                    "- Justificar e sugerir condutas iniciais.\n\n"
                    "REGRAS DE SEGURANÇA/CONSISTÊNCIA:\n"
                    "- NÃO invente sintomas, sinais vitais ou exame físico que não estejam no NOVO CASO.\n"
                    "- Casos similares servem apenas como exemplos e podem conter sintomas diferentes.\n"
                    "- A decisão deve ser baseada principalmente no NOVO CASO.\n\n"
                    "NOTA TÉCNICA:\n"
                    "- A distância (dist) indica similaridade vetorial: quanto menor a dist, mais similar é o caso.\n" \
                    "Você é um assistente de triagem especializado em doenças endócrinas e metabólicas. "
                    "Ao receber sintomas, você deve comparar com os casos históricos fornecidos e, obrigatoriamente, verificar se há sinais de alerta para Diabetes (como polidipsia), Hipertensão ou Tireoide. "
                    "Responda em português, separando em: 1) Possível Condição, 2) Gravidade e 3) Recomendação de Exames."
                )

                # Prompt de formato (para padronizar saída)
                format_prompt = (
                    "Responda exatamente em 3 blocos com títulos:\n"
                    "1) Classificação\n"
                    "2) Justificativa\n"
                    "3) Condutas iniciais\n\n"
                    "Escreva de forma objetiva e coerente com o NOVO CASO."
                )

                # Cria a sequência de mensagens para enviar ao modelo de linguagem (Mistral via Ollama)
                messages = [
                    ChatMessage(role="system", content=system_prompt),
                    ChatMessage(role="user", content=input_text),
                    ChatMessage(role="user", content=format_prompt),
                ]

                # Executa a consulta ao LLM (via Ollama)
                resposta = llm.chat(messages)

                # Extraímos apenas o texto final (evita aparecer "assistant:" e metadados do objeto)
                answer_text = (resposta.message.content or "").strip()

                # FALLBACK AUTOMÁTICO:
                # Se mesmo assim a resposta vier em inglês, fazemos uma segunda chamada mais "dura"
                # (isso ocorre ocasionalmente em modelos locais dependendo do estado/contexto interno).
                if looks_english(answer_text):
                    retry_messages = [
                        ChatMessage(
                            role="system",
                            content=(
                                system_prompt
                                + "\nATENÇÃO EXTRA: Você DEVE responder somente em PT-BR. "
                                  "Se você responder em outro idioma, a resposta será considerada inválida.\n"
                            ),
                        ),
                        ChatMessage(role="user", content=input_text),
                        ChatMessage(role="user", content=format_prompt),
                    ]
                    resposta2 = llm.chat(retry_messages)
                    answer_text = (resposta2.message.content or "").strip()

                # Exibe o resultado na interface
                st.subheader("Resultado da Triagem")
                st.markdown(answer_text if answer_text else "Não foi possível obter uma resposta do modelo.")

                # Debug opcional: mostrar distâncias e casos recuperados do ChromaDB
                with st.expander("Debug: similaridade (distâncias do Chroma)"):
                    for c, d in zip(similar_cases, distances):
                        st.write({"dist": d, "case": c})

            except Exception as e:
                st.error(f"Erro ao consultar o modelo: {e}")