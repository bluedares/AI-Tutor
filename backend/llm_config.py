from openai import OpenAI
from typing import Dict, Optional, List
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LLMConfig:
    def __init__(self):
        self.models: Dict = {}
        self.test_mode = False
        self._initialize_models()

    def _initialize_models(self):
        """Initialize all available LLM models."""
        # Add test mode model
        self.models["test_mode"] = None  # Special handling for test mode

        # Initialize OpenAI models
        api_key = os.getenv("OPENAI_API_KEY")
        print(f"OpenAI API Key present: {bool(api_key)}")
        if api_key:
            try:
                print("Initializing OpenAI client...")
                self.client = OpenAI(api_key=api_key)
                self.models["gpt-3.5-turbo"] = "gpt-3.5-turbo"
                self.models["gpt-4"] = "gpt-4"
                print(f"Available models: {list(self.models.keys())}")
            except Exception as e:
                print(f"Error initializing OpenAI models: {e}")
        else:
            print("No OpenAI API key found in environment")

    def get_model(self, model_name: str) -> Optional[str]:
        """Get a specific model by name."""
        return self.models.get(model_name)

    def get_available_models(self) -> List[str]:
        """Get list of available models."""
        return list(self.models.keys())  # Return all models including test_mode

    def get_test_response(self, message: str) -> str:
        """Get a test response for development/testing."""
        return f"Test response to: {message}"

    def get_chat_completion(self, model_name: str, messages: List[Dict[str, str]]) -> str:
        """Get a chat completion from OpenAI."""
        try:
            if model_name == "test_mode":
                return self.get_test_response(messages[-1]["content"])

            response = self.client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error getting chat completion: {e}")
            raise

    async def get_chat_response(self, model_name: str, message: str) -> str:
        """Get a chat response for a single message."""
        messages = [{"role": "user", "content": message}]
        return self.get_chat_completion(model_name, messages)
