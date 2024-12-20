from fastapi.testclient import TestClient
import pytest
import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = str(Path(__file__).parent.parent)
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from main import app
from llm_config import LLMConfig

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    response_json = response.json()
    assert response_json["status"] == "ok"
    assert "port" in response_json

def test_get_available_models():
    response = client.get("/api/models")
    assert response.status_code == 200
    # Should at least have test_mode
    assert "test_mode" in response.json()
    # If OpenAI key is set, should have GPT models
    if os.getenv("OPENAI_API_KEY"):
        assert "gpt-3.5-turbo" in response.json()

def test_chat_with_test_mode():
    test_message = "Hello, test mode!"
    response = client.post(
        "/api/chat",
        json={"content": test_message, "model": "test_mode"}
    )
    assert response.status_code == 200
    assert "content" in response.json()
    assert "model" in response.json()
    assert response.json()["model"] == "test_mode"

def test_chat_with_invalid_model():
    response = client.post(
        "/api/chat",
        json={"content": "test", "model": "invalid-model"}
    )
    assert response.status_code == 400

@pytest.mark.skipif(not os.getenv("OPENAI_API_KEY"), reason="OpenAI API key not set")
def test_chat_with_gpt():
    test_message = "What is 2+2?"
    response = client.post(
        "/api/chat",
        json={"content": test_message, "model": "gpt-3.5-turbo"}
    )
    assert response.status_code == 200
    assert "content" in response.json()
    assert response.json()["model"] == "gpt-3.5-turbo"

def test_llm_config():
    config = LLMConfig()
    # Test model availability
    assert config.get_model("test_mode") is None  # test_mode should be available but return None
    assert "test_mode" in config.models
    # Test getting test response
    test_response = config.get_test_response("test")
    assert isinstance(test_response, str)
    assert len(test_response) > 0
