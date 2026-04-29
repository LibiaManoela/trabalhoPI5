# Projeto de Triagem Clínica com IA

Este projeto implementa um sistema de triagem clínica assistida por inteligência artificial, utilizando um backend em Node.js para gerenciar requisições e uma API em Python para processar triagens médicas baseadas em sintomas descritos pelo usuário.

## Descrição do Projeto

O sistema permite que usuários descrevam sintomas clínicos e recebam uma triagem automatizada, incluindo classificação por protocolo de Manchester (vermelha, laranja, amarela, verde ou azul), justificativa e condutas iniciais. A IA utiliza um modelo de linguagem local (Mistral via Ollama), embeddings clínicos (BioBERTpt-clin) e um banco vetorial (ChromaDB) para recuperar casos similares históricos.

O projeto foi desenvolvido para fins educacionais e de demonstração, integrando frontend web simples, backend API e motor de IA.

## Linguagens e Ferramentas Utilizadas

### Linguagens
- **JavaScript**: Para o backend Node.js e frontend (HTML/CSS/JS).
- **Python**: Para o motor de IA e API de triagem.

### Ferramentas e Tecnologias
- **Node.js**: Runtime para executar JavaScript no servidor.
- **Docker**: Para containerizar o backend Node.js (usando imagem node:24-alpine).
- **Python Virtual Environment (.venv)**: Para isolar dependências Python.
- **Ollama**: Para executar modelos de linguagem localmente (Mistral).
- **ChromaDB**: Banco vetorial para armazenar e consultar embeddings de casos clínicos.
- **Streamlit**: Para a interface original de debug da IA (não usada na integração final).
- **Git**: Controle de versão.

### Bibliotecas e Dependências

#### Node.js (backend-chatAI/package.json)
- **express**: Framework web para criar APIs REST.
- **cors**: Middleware para permitir requisições cross-origin.
- **dotenv**: Para carregar variáveis de ambiente.

#### Python (instaladas via pip no .venv)
- **fastapi**: Framework para criar APIs web assíncronas.
- **uvicorn**: Servidor ASGI para FastAPI.
- **llama-index**: Framework para integração com LLMs e RAG (Retrieval-Augmented Generation).
- **chromadb**: Cliente para ChromaDB.
- **transformers**: Biblioteca para modelos de Hugging Face (usado para BioBERTpt-clin).
- **torch**: PyTorch para operações de deep learning e GPU.
- **streamlit**: Para interfaces web rápidas (usado no app original).
- **nest-asyncio**: Para permitir asyncio em ambientes interativos.
- **hashlib**: Para gerar IDs únicos (padrão do Python).
- **re**: Para expressões regulares (padrão do Python).
- **warnings**: Para gerenciar avisos (padrão do Python).

Outros: ollama (executável externo), torch.serialization (para compatibilidade).

## Estrutura do Projeto

```
trabalhoPI5/
├── backend-chatAI/          # Backend Node.js
│   ├── main.js             # Servidor Express com rota /chat
│   ├── package.json        # Dependências Node.js
│   └── package-lock.json   # Lockfile das dependências
├── IA_Engine/              # Motor de IA em Python
│   ├── api.py              # API FastAPI para triagem (/triagem)
│   ├── app-bd-clin-debug.py # App Streamlit original (debug)
│   ├── ingest_pdfs.py      # Script para ingestão de dados (não usado)
│   └── chroma_db/          # Banco vetorial persistente
│       ├── chroma.sqlite3
│       └── [outras pastas]
├── frontend-chatAI/         # Frontend web
│   ├── html/               # Páginas HTML
│   ├── css/                # Estilos CSS
│   └── js/                 # Scripts JavaScript
├── documentos/             # Dados e scripts de limpeza
│   ├── Healthcare.csv      # Dataset de saúde
│   ├── limpeza.py          # Script de limpeza de dados
│   └── meus_casos.txt      # Casos simulados para triagem
├── .venv/                  # Ambiente virtual Python
└── README.md               # Este arquivo
```

## Como as Coisas se Conectam

1. **Frontend**: Interface web (HTML/JS) envia requisições POST para `http://localhost:3000/chat` com sintomas do usuário.
2. **Backend Node.js**: Recebe a requisição, faz fetch para a API Python em `http://host.docker.internal:8000/triagem` (quando rodando em Docker) ou `http://localhost:8000/triagem` (local).
3. **API Python**: Processa os sintomas:
   - Gera embedding com BioBERTpt-clin.
   - Consulta ChromaDB para casos similares.
   - Aplica reranking híbrido (distância + termos críticos).
   - Monta prompt para o LLM (Mistral via Ollama).
   - Retorna resposta estruturada (classificação, justificativa, condutas).
4. **Resposta**: Volta pelo Node.js para o frontend, exibindo a triagem.

O sistema usa RAG para contextualizar respostas com casos históricos, evitando alucinações.

## Como Rodar o Projeto

### Pré-requisitos
- **Python 3.8+**: Para o motor de IA.
- **Node.js 18+**: Para o backend (ou Docker).
- **Docker**: Para containerizar o Node.js (opcional, mas recomendado).
- **Ollama**: Instalar e baixar o modelo `mistral` (`ollama pull mistral`).
- **Git**: Para clonar o repositório (se aplicável).

### Passo 1: Clonar ou Preparar o Projeto
Certifique-se de que o projeto esteja na pasta `c:\Projetos Facul\trabalhoPI5` (ou equivalente).

### Passo 2: Configurar Ambiente Python
1. Ativar o ambiente virtual:
   ```
   cd c:\Projetos Facul\trabalhoPI5
   .venv\Scripts\Activate.ps1  # No PowerShell
   ```
2. Instalar dependências (se não estiverem instaladas):
   ```
   pip install fastapi uvicorn
   ```
   (Outras dependências já estão no .venv se o projeto foi configurado).

### Passo 3: Rodar a API Python (Motor de IA)
1. Navegar para a pasta IA_Engine:
   ```
   cd IA_Engine
   ```
2. Executar a API:
   ```
   python api.py
   ```
   - A API ficará rodando em `http://localhost:8000`.
   - Carrega modelos e banco vetorial na primeira execução (pode demorar).

### Passo 4: Configurar e Rodar o Backend Node.js
#### Opção 1: Usando Docker (Recomendado)
1. Instalar Docker Desktop.
2. Puxar a imagem:
   ```
   docker pull node:24-alpine
   ```
3. Instalar dependências no container:
   ```
   docker run --rm -v "c:\Projetos Facul\trabalhoPI5:/app" -w /app/backend-chatAI node:24-alpine npm install
   ```
4. Rodar o servidor:
   ```
   docker run -d --name node-backend -v "c:\Projetos Facul\trabalhoPI5:/app" -w /app/backend-chatAI -p 3000:3000 node:24-alpine node main.js
   ```
   - O backend ficará em `http://localhost:3000`.

#### Opção 2: Localmente (Sem Docker)
1. Instalar Node.js.
2. Navegar para backend-chatAI:
   ```
   cd backend-chatAI
   ```
3. Instalar dependências:
   ```
   npm install
   ```
4. Alterar `main.js`: Trocar `host.docker.internal` por `localhost` na linha do fetch.
5. Rodar:
   ```
   node main.js
   ```

### Passo 5: Acessar o Frontend
1. Abrir um navegador.
2. Navegar para `frontend-chatAI/html/index.html` (ou qualquer página HTML).
3. Usar a interface para enviar sintomas via JavaScript (chamando `/chat`).

### Teste da Integração
- Enviar POST para `http://localhost:3000/chat` com JSON `{"message": "sintomas aqui"}`.
- Exemplo com PowerShell:
  ```
  Invoke-WebRequest -Uri http://localhost:3000/chat -Method POST -Headers @{ "Content-Type" = "application/json" } -Body '{"message":"sede excessiva e tontura"}' -UseBasicParsing
  ```
- Deve retornar uma resposta JSON com a triagem.

### Notas Importantes
- **GPU**: Se disponível, PyTorch usa CUDA para embeddings. Verifique com `nvidia-smi`.
- **Ollama**: Certifique-se de que está rodando (`ollama serve`) e o modelo `mistral` está baixado.
- **Portas**: 3000 (Node.js), 8000 (Python). Não conflitar com outros serviços.
- **Debug**: Use o app Streamlit (`streamlit run IA_Engine/app-bd-clin-debug.py`) para testar a IA isoladamente.
- **Limpeza**: Execute `python documentos/limpeza.py` se precisar processar dados.

Se houver problemas, verifique logs dos terminais ou containers.