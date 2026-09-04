from pathlib import Path
from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config.settings import settings
from app.rag.embeddings import FinancialEmbeddingFunction

class ChromaVectorStore:
    """
    Manages local persistent vector storage using ChromaDB.
    Ensures embeddings are stored persistently on disk in chroma_db/
    """

    COLLECTION_NAME = "financial_knowledge"

    def __init__(self, db_path: str = None):
        self.db_path = Path(db_path or settings.CHROMA_DB_PATH)
        self.db_path.mkdir(parents=True, exist_ok=True)
        self.embedding_fn = FinancialEmbeddingFunction()

        self.client = chromadb.PersistentClient(
            path=str(self.db_path),
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self.collection = self.client.get_or_create_collection(
            name=self.COLLECTION_NAME,
            embedding_function=self.embedding_fn
        )

    def add_chunks(self, chunks: List[Dict[str, Any]]):
        if not chunks:
            return

        ids = [c["id"] for c in chunks]
        texts = [c["text"] for c in chunks]
        metadatas = [c["metadata"] for c in chunks]

        # Upsert chunks to avoid duplicate key errors on repeated ingestion
        self.collection.upsert(
            ids=ids,
            documents=texts,
            metadatas=metadatas
        )

    def query_similarity(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k
        )

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0] if results.get("distances") else []

        formatted = []
        for i in range(len(documents)):
            formatted.append({
                "content": documents[i],
                "metadata": metadatas[i] if i < len(metadatas) else {},
                "score": distances[i] if i < len(distances) else None
            })

        return formatted
