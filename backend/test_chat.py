from fastapi.testclient import TestClient
import pytest
from main import app
import json

client = TestClient(app)

def test_health_check():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "port" in data
    assert data["status"] == "ok"

def test_get_models():
    """Test getting available models"""
    response = client.get("/api/models")
    assert response.status_code == 200
    models = response.json()
    assert isinstance(models, list)
    assert "gpt-3.5-turbo" in models
    assert "test_mode" in models

def test_chat_endpoint():
    """Test the chat endpoint with different models"""
    # Test with GPT-3.5-turbo
    response = client.post(
        "/api/chat",
        json={
            "content": "Hello, can you help me with a simple math problem?",
            "model": "gpt-3.5-turbo"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert "role" in data
    assert data["role"] == "assistant"
    assert data["model"] == "gpt-3.5-turbo"

    # Test with test_mode
    response = client.post(
        "/api/chat",
        json={
            "content": "Test message",
            "model": "test_mode"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert "Test" in data["content"]

def test_invalid_model():
    """Test chat endpoint with invalid model"""
    response = client.post(
        "/api/chat",
        json={
            "content": "Hello",
            "model": "invalid_model"
        }
    )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "not available" in data["detail"]

def test_empty_message():
    """Test chat endpoint with empty message"""
    response = client.post(
        "/api/chat",
        json={
            "content": "",
            "model": "gpt-3.5-turbo"
        }
    )
    assert response.status_code == 200

if __name__ == "__main__":
    print("Running backend tests...")
    pytest.main([__file__, "-v"])
