import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.config.settings import settings
from app.rag.document_loader import DocumentLoader
from app.rag.document_processor import DocumentProcessor
from app.rag.vector_store import ChromaVectorStore

def run_ingestion():
    print("=" * 60)
    print("Smart Finance AI - Knowledge Base Ingestion to ChromaDB")
    print("=" * 60)
    print(f"Loading knowledge documents from: {settings.KNOWLEDGE_BASE_PATH}")

    loader = DocumentLoader(settings.KNOWLEDGE_BASE_PATH)
    raw_docs = loader.load_documents()
    print(f"Loaded {len(raw_docs)} documents.")

    if not raw_docs:
        print("Warning: No documents found to ingest!")
        return

    processor = DocumentProcessor(chunk_size=400, chunk_overlap=40)
    chunks = processor.process(raw_docs)
    print(f"Generated {len(chunks)} text chunks.")

    print(f"Storing chunks in ChromaDB vector store at: {settings.CHROMA_DB_PATH} ...")
    vector_store = ChromaVectorStore(settings.CHROMA_DB_PATH)
    vector_store.add_chunks(chunks)

    print("Knowledge base ingestion completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    run_ingestion()
