from typing import List, Dict, Any
from app.rag.vector_store import ChromaVectorStore

class RAGRetriever:
    """
    Retrieves top relevant educational knowledge documents from ChromaDB.
    Sanitizes internal vector IDs and returns clean source metadata.
    """

    def __init__(self, vector_store: ChromaVectorStore = None):
        self.vector_store = vector_store or ChromaVectorStore()

    def retrieve(self, query: str, top_k: int = 3) -> Dict[str, Any]:
        raw_results = self.vector_store.query_similarity(query, top_k=top_k)

        contexts = []
        sources = []

        for item in raw_results:
            text = item.get("content", "")
            meta = item.get("metadata", {})
            contexts.append(text)

            source_info = {
                "title": meta.get("title", "Financial Knowledge"),
                "topic": meta.get("topic", "General"),
                "source": meta.get("source", "Educational Reference")
            }
            if source_info not in sources:
                sources.append(source_info)

        combined_context = "\n\n---\n\n".join(contexts)

        return {
            "query": query,
            "context_text": combined_context,
            "sources": sources,
            "count": len(contexts)
        }
