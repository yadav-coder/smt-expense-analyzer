import pytest
from fastapi.testclient import TestClient
from jose import jwt

from app.main import app
from app.config.settings import settings

client = TestClient(app)

def create_test_token(user_id: str = "507f1f77bcf86cd799439011", email: str = "test@example.com") -> str:
    payload = {
        "id": user_id,
        "email": email
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_chat_unauthorized():
    response = client.post("/api/chat", json={"message": "How much did I spend this month?"})
    assert response.status_code == 401

def test_chat_authorized_success():
    token = create_test_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post(
        "/api/chat",
        headers=headers,
        json={"message": "What is the 50/30/20 rule?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "response" in data
    assert data["intent"] == "FINANCIAL_KNOWLEDGE"

def test_chat_message_too_long():
    token = create_test_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post(
        "/api/chat",
        headers=headers,
        json={"message": "A" * 601}
    )
    assert response.status_code == 422
