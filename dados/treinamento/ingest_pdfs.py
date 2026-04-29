from llama_index.core import SimpleDirectoryReader, StorageContext, VectorStoreIndex
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb
from llama_index.core import Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

# Força o LlamaIndex a usar o BioBERTpt-clin que o professor escolheu
Settings.embed_model = HuggingFaceEmbedding(
    model_name="pucpr/biobertpt-clin", device="cuda" # "cuda" usa sua RTX 3060!
)

def vetorizar_pdfs(caminho_pasta, caminho_chroma):
    # 1. Carrega os documentos da pasta
    documentos = SimpleDirectoryReader(caminho_pasta).load_data()
    
    # 2. Conecta ao mesmo banco que o professor usou
    db = chromadb.PersistentClient(path=caminho_chroma)
    chroma_collection = db.get_or_create_collection("triagem_hci") # Mesmo nome do arquivo do professor
    
    # 3. Configura o armazenamento vetorial
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    
    # 4. Cria o índice (isso gera os embeddings e salva no Chroma)
    index = VectorStoreIndex.from_documents(
        documentos, storage_context=storage_context
    )
    print("Vetorização concluída e salva no ChromaDB!")

# Execução
vetorizar_pdfs("./documentos", "./chroma_db")