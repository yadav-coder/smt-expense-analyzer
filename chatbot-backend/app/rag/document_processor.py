from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter

class DocumentProcessor:
    """
    Chunks knowledge documents into coherent text segments with metadata preservation.
    """

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def process(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        chunks = []
        chunk_counter = 0

        for doc in documents:
            text = doc["content"]
            metadata = doc["metadata"]
            split_texts = self.splitter.split_text(text)

            for i, chunk_text in enumerate(split_texts):
                chunk_counter += 1
                chunk_meta = dict(metadata)
                chunk_meta["chunk_id"] = f"{metadata.get('topic', 'doc')}_{i}"

                chunks.append({
                    "id": f"doc_chunk_{chunk_counter}",
                    "text": chunk_text,
                    "metadata": chunk_meta
                })

        return chunks
