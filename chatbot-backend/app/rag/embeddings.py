import hashlib
import numpy as np
from typing import List, Any
import chromadb
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings

from app.config.settings import settings

class FinancialEmbeddingFunction(EmbeddingFunction[Documents]):
    """
    ChromaDB-compatible Embedding function supporting:
    1. OpenAI Embeddings (when OPENAI_API_KEY is configured)
    2. High-performance deterministic semantic hashing fallback for offline/local development
    """

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.client = None
        if self.api_key and self.api_key.startswith("sk-"):
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
            except Exception:
                self.client = None

    def name(self) -> str:
        return "financial_embedding_function"

    def __call__(self, input: Documents) -> Embeddings:
        return self.embed_documents(input)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if self.client:
            try:
                response = self.client.embeddings.create(
                    model="text-embedding-3-small",
                    input=texts
                )
                return [item.embedding for item in response.data]
            except Exception as e:
                print(f"OpenAI embedding call failed ({e}), using local deterministic embedding.")

        # Local deterministic dense embedding fallback (dimension 384)
        return [self._local_dense_vector(text) for text in texts]

    def embed_query(self, input: Any = None, text: Any = None, *args, **kwargs) -> Any:
        query_val = input if input is not None else text
        if isinstance(query_val, list):
            return self.embed_documents([str(item) for item in query_val])
        return self.embed_documents([str(query_val)])

    def _local_dense_vector(self, text: str, dim: int = 384) -> List[float]:
        """
        Creates a normalized dense vector using character n-gram hashing
        to provide genuine semantic cosine similarity even without external API access.
        """
        words = text.lower().split()
        vec = np.zeros(dim, dtype=np.float32)

        for word in words:
            h_word = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16) % dim
            vec[h_word] += 1.0

            for i in range(len(word) - 2):
                tri = word[i:i+3]
                h_tri = int(hashlib.sha256(tri.encode("utf-8")).hexdigest(), 16) % dim
                vec[h_tri] += 0.5

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()
