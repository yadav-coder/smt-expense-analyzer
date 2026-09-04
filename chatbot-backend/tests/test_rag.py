import pytest
from app.rag.retriever import RAGRetriever

def test_rag_retrieval():
    retriever = RAGRetriever()
    result = retriever.retrieve("What is the 50/30/20 rule?", top_k=2)

    assert result["count"] > 0
    assert "50/30/20" in result["context_text"]
    assert len(result["sources"]) > 0
    # Ensure source metadata structure
    first_source = result["sources"][0]
    assert "title" in first_source
    assert "topic" in first_source
    assert "source" in first_source

def test_rag_retrieval_emergency_fund():
    retriever = RAGRetriever()
    result = retriever.retrieve("emergency fund savings", top_k=2)
    assert result["count"] > 0
    assert "emergency" in result["context_text"].lower()
