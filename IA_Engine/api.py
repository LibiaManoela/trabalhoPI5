import os
import torch

# Desativa o aviso de vulnerabilidade de carregamento de pesos
#torch.serialization.add_safe_globals([set])

# Evita conflitos de implementação do Protobuf
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

from llama_index.core.node_parser import SentenceSplitter

from typing import List, Tuple
import os
import hashlib
import re
import warnings
import logging
warnings.filterwarnings("ignore", category=UserWarning)

import torch
import chromadb
from transformers import AutoTokenizer, AutoModel

import asyncio

from llama_index.core.llms import ChatMessage
from llama_index.llms.ollama import Ollama
from llama_index.core import Settings

from fastapi import FastAPI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------------
# Config
# -----------------------------
Settings.node_parser = SentenceSplitter(chunk_size=512, chunk_overlap=50)

COLLECTION_NAME = "triagem_hci"
CHROMA_PATH = "./chroma_db"
CASES_FILE = os.path.join(os.path.dirname(__file__), "..", "documentos", "meus_casos.txt")
EMBED_MODEL_NAME = "pucpr/biobertpt-clin"
TOP_K = 5
LANGUAGE = "pt-br"

# -----------------------------
# LLM (Ollama)
# -----------------------------
def load_llm():
    # Em Docker no Windows, use localhost:11434 para acessar Ollama do host
    # Em localhost direto, use localhost:11434
    ollama_host = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
    llm = Ollama(model="mistral", base_url=ollama_host, request_timeout=420.0)
    Settings.llm = llm
    return llm

llm = load_llm()

# -----------------------------
# Device (GPU)
# -----------------------------
def get_device() -> torch.device:
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")

device = get_device()

# -----------------------------
# Chroma
# -----------------------------
def get_chroma_collection():
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = client.get_or_create_collection(name=COLLECTION_NAME)
    return collection

collection = get_chroma_collection()

# -----------------------------
# Load embedder
# -----------------------------
def load_embedder(model_name: str, device_str: str):
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)
    model.eval()
    model.to(device_str)

    if device_str.startswith("cuda"):
        torch.backends.cudnn.benchmark = True

    return tokenizer, model

tokenizer, model = load_embedder(EMBED_MODEL_NAME, str(device))

# -----------------------------
# Functions
# -----------------------------
def stable_id(text: str) -> str:
    h = hashlib.sha1(text.encode("utf-8")).hexdigest()
    return f"case_{h}"

def load_triagem_cases(filepath: str) -> List[str]:
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]

def mean_pool(last_hidden_state: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
    mask = attention_mask.unsqueeze(-1).type_as(last_hidden_state)
    summed = (last_hidden_state * mask).sum(dim=1)
    counts = mask.sum(dim=1).clamp(min=1e-9)
    return summed / counts

def embed_texts(texts: List[str], batch_size: int = 16) -> List[List[float]]:
    all_embs: List[List[float]] = []
    use_amp = torch.cuda.is_available()

    with torch.inference_mode():
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]

            enc = tokenizer(
                batch,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=256
            )

            enc = {k: v.to(device) for k, v in enc.items()}

            if use_amp:
                with torch.autocast(device_type="cuda", dtype=torch.float16):
                    out = model(**enc)
                    pooled = mean_pool(out.last_hidden_state, enc["attention_mask"])
            else:
                out = model(**enc)
                pooled = mean_pool(out.last_hidden_state, enc["attention_mask"])

            pooled = torch.nn.functional.normalize(pooled, p=2, dim=1)

            all_embs.extend(pooled.detach().cpu().tolist())

    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    return all_embs

def extract_keywords_for_rerank(text: str) -> List[str]:
    t = text.lower()

    critical_terms = [
        "dor torácica", "dor no peito", "peito",
        "irradia", "braço esquerdo", "mandíbula",
        "sudorese", "sudorese fria",
        "dispneia", "falta de ar", "saturação", "spo2", "89%", "88%", "90%",
        "confusão", "inconsciência", "desmaio", "convulsão",
        "hemorragia", "sangramento",
        "pa ", "pressão", "hipotensão", "hipertensão",
        "infarto", "iam", "avc", "sepse",
        "glicemia", "pressão alta", "tsh", "tontura", "palpitação"
    ]

    found = []
    for term in critical_terms:
        if term in t:
            found.append(term)

    return found


def validate_triagem_response(answer_text: str) -> Tuple[bool, str]:
    if not answer_text or not answer_text.strip():
        return False, "Resposta vazia do modelo."

    lower = answer_text.lower()
    if looks_english(answer_text):
        return False, "Resposta em inglês detectada."

    required_sections = ["classificação", "justificativa", "condutas"]
    missing = [section for section in required_sections if section not in lower]
    if missing:
        return False, f"Resposta incompleta ou sem as seções esperadas: {', '.join(missing)}."

    if len(answer_text.split()) < 30:
        return False, "Resposta muito curta para uma análise clínica adequada."

    if "novo caso" in lower and "caso mais próximo" in lower:
        return False, "Resposta parece estar repetindo o prompt em vez de gerar a análise."

    return True, ""


def clean_triagem_input(sintomas: str) -> str:
    if sintomas is None:
        return ""
    cleaned = sintomas.strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned


def rerank_pairs_hybrid(new_case_text: str, pairs_sorted_by_dist: List[Tuple[str, float]]) -> List[Tuple[str, float]]:
    # Proteção 1: Se a lista de pares estiver vazia, não faz nada
    if not pairs_sorted_by_dist:
        return []

    keywords = extract_keywords_for_rerank(new_case_text)
    
    # Proteção 2: Se não achar palavras-chave, mantém como está
    if not keywords:
        return pairs_sorted_by_dist

    def keyword_score(case_text: str) -> int:
        ct = case_text.lower()
        return sum(1 for k in keywords if k in ct)

    # Agora o max() é 100% seguro pois sabemos que a lista não é vazia
    best = max(
        pairs_sorted_by_dist,
        key=lambda x: (keyword_score(x[0]), -float(x[1]) if x[1] is not None else float("-inf"))
    )

    new_list = [best] + [p for p in pairs_sorted_by_dist if p != best]
    return new_list

def looks_english(text: str) -> bool:
    if not text:
        return False
    markers = ["given the", "according to", "the patient", "symptoms", "should be", "classify"]
    t = text.lower()
    return any(m in t for m in markers)

# Load and index cases
triagem_cases = load_triagem_cases(CASES_FILE)

def ensure_cases_indexed(cases: List[str]):
    existing = set(collection.get()["ids"])
    new_ids = []
    new_texts = []
    new_metas = []

    for c in cases:
        cid = stable_id(c)
        if cid not in existing:
            new_ids.append(cid)
            new_texts.append(c)
            new_metas.append({"content": c})

    if not new_texts:
        return

    embs = embed_texts(new_texts, batch_size=16)

    collection.upsert(
        ids=new_ids,
        embeddings=embs,
        metadatas=new_metas,
    )

if triagem_cases:
    ensure_cases_indexed(triagem_cases)

# -----------------------------
# Triage function
# -----------------------------
def perform_triagem(sintomas: str) -> str:
    sintomas = clean_triagem_input(sintomas)
    if not sintomas:
        return "Sintomas não fornecidos."

    try:
        query_emb = embed_texts([sintomas], batch_size=1)[0]

        results = collection.query(
            query_embeddings=[query_emb],
            n_results=TOP_K,
            include=["metadatas", "distances"]
        )

        similar_cases = []
        distances = []
        best_case = "Nenhum caso histórico encontrado na base."
        best_dist = "N/A"
        other_cases_text = "- (nenhum)\n"

        if results.get("metadatas") and results["metadatas"][0]:
            raw_similar_cases = [m["content"] for m in results["metadatas"][0] if isinstance(m, dict) and "content" in m]
            raw_distances = results.get("distances", [[None] * len(raw_similar_cases)])[0]

            pairs: List[Tuple[str, float]] = [
                (case_text, dist) for case_text, dist in zip(raw_similar_cases, raw_distances)
                if case_text and dist is not None
            ]

            if pairs:
                pairs_sorted = sorted(pairs, key=lambda x: float(x[1]))
                pairs_sorted = rerank_pairs_hybrid(sintomas, pairs_sorted)

                similar_cases = [c for (c, d) in pairs_sorted]
                distances = [d for (c, d) in pairs_sorted]
                best_case = similar_cases[0]
                best_dist = distances[0]

                if len(similar_cases) > 1:
                    other_cases = similar_cases[1:]
                    other_dists = distances[1:]
                    other_cases_text = "\n".join([f"- dist={d}\n  {c}" for c, d in zip(other_cases, other_dists)])

        contexto_texto = "\n".join([f"- {c}" for c in similar_cases]) if similar_cases else "- (nenhum)"

        input_text = (
            "NOVO CASO (use como fonte principal; NÃO invente sintomas):\n"
            f"{sintomas}\n\n"
            "CASO MAIS PRÓXIMO (apenas como referência; pode ter sintomas diferentes):\n"
            f"- dist={best_dist}\n"
            f"- {best_case}\n\n"
            "OUTROS CASOS PRÓXIMOS (apenas apoio; podem conflitar):\n"
            f"{other_cases_text}"
            "CONTEXTO RECUPERADO (Casos Históricos e Diretrizes Técnicas):\n"
            f"{contexto_texto}\n\n"
            "INSTRUÇÃO:\n"
            "Se o contexto contiver diretrizes técnicas, use-as para sugerir a conduta.\n"
            "Se contiver casos parecidos, use-os para confirmar o diagnóstico.\n\n"
            "REGRAS IMPORTANTES:\n"
            "1) Responda OBRIGATORIAMENTE em PORTUGUÊS DO BRASIL.\n"
            "2) NÃO copie sintomas dos casos próximos.\n"
            "3) Se um caso próximo contiver sintomas que NÃO aparecem no novo caso, ignore esses sintomas.\n"
            "4) Classifique pelo Protocolo de Manchester: vermelha, laranja, amarela, verde ou azul.\n"
        )

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
            "- A distância (dist) indica similaridade vetorial: quanto menor a dist, mais similar é o caso.\n"
            "Você é um assistente de triagem especializado em doenças endócrinas e metabólicas. "
            "Ao receber sintomas, você deve comparar com os casos históricos fornecidos e, obrigatoriamente, verificar se há sinais de alerta para Diabetes (como polidipsia), Hipertensão ou Tireoide. "
            "Responda em português, separando em: 1) Possível Condição, 2) Gravidade e 3) Recomendação de Exames."
        )

        format_prompt = (
            "Responda exatamente em 3 blocos com títulos:\n"
            "1) Classificação\n"
            "2) Justificativa\n"
            "3) Condutas iniciais\n\n"
            "Escreva de forma objetiva e coerente com o NOVO CASO."
        )

        messages = [
            ChatMessage(role="system", content=system_prompt),
            ChatMessage(role="user", content=input_text),
            ChatMessage(role="user", content=format_prompt),
        ]

        resposta = llm.chat(messages)
        answer_text = (resposta.message.content or "").strip()

        valid, validation_message = validate_triagem_response(answer_text)
        if not valid:
            logger.warning("Resposta inválida do modelo: %s", validation_message)
            retry_messages = [
                ChatMessage(
                    role="system",
                    content=(
                        system_prompt
                        + "\nATENÇÃO EXTRA: Você DEVE responder somente em PT-BR. "
                          "Responda de forma completa em 3 seções claramente rotuladas.\n"
                    ),
                ),
                ChatMessage(role="user", content=input_text),
                ChatMessage(role="user", content=format_prompt),
            ]
            resposta2 = llm.chat(retry_messages)
            answer_text = (resposta2.message.content or "").strip()
            valid, validation_message = validate_triagem_response(answer_text)

        if not valid:
            logger.error("Falha ao gerar resposta válida do modelo: %s", validation_message)
            return (
                "Erro: não foi possível gerar uma resposta de triagem segura e formatada. "
                "Por favor, revise os sintomas e tente novamente."
            )

        return answer_text

    except Exception as e:
        logger.exception("Erro ao processar triagem")
        return f"Erro ao processar triagem: {e}"

# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI()

@app.post("/triagem")
async def triagem(data: dict):
    sintomas = data.get("sintomas", "")
    resposta = perform_triagem(sintomas)
    return {"resposta_final": resposta}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)