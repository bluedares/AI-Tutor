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
        if os.getenv("OPENAI_API_KEY"):
            try:
                self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
                self.models["gpt-3.5-turbo"] = "gpt-3.5-turbo"
                self.models["gpt-4"] = "gpt-4"
            except Exception as e:
                print(f"Error initializing OpenAI models: {e}")

    def get_model(self, model_name: str) -> Optional[str]:
        """Get a specific model by name."""
        return self.models.get(model_name)

    def get_available_models(self) -> List[str]:
        """Get list of available models."""
        return [model for model in self.models.keys() if model != "test_mode"]

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
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error in chat completion: {e}")
            raise e
