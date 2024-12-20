from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from llm_config import LLMConfig
from config import Config
from pathlib import Path

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Mount the .config directory
config_path = Path(__file__).parent.parent / '.config'
config_path.mkdir(exist_ok=True)
app.mount("/.config", StaticFiles(directory=str(config_path)), name="config")

# Initialize LLM configuration
llm_config = LLMConfig()

class ChatMessage(BaseModel):
    content: str
    role: str = "user"
    model: str = Config.DEFAULT_MODEL

class ChatResponse(BaseModel):
    content: str
    role: str = "assistant"
    model: str = Config.DEFAULT_MODEL

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "port": Config.PORT}

@app.get("/api/models")
async def get_available_models():
    """Get list of available LLM models."""
    try:
        models = llm_config.get_available_models()
        # Add test mode to available models
        if "test_mode" not in models:
            models.append("test_mode")
        return models
    except Exception as e:
        print(f"Error getting models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(message: ChatMessage):
    try:
        # Handle test mode
        if message.model == "test_mode":
            return ChatResponse(
                content=f"Test response to: {message.content}",
                model=message.model
            )
            
        # Get the requested model
        model = llm_config.get_model(message.model)
        
        if not model:
            raise HTTPException(
                status_code=400,
                detail=f"Model {message.model} not available. Available models: {llm_config.get_available_models()}"
            )

        # Create the message list
        messages = [
            {"role": "system", "content": "You are an AI Tutor, designed to help students learn effectively. Be patient, encouraging, and adapt your teaching style to the student's needs."},
            {"role": message.role, "content": message.content}
        ]
        
        # Get response from LLM
        try:
            response_content = llm_config.get_chat_completion(message.model, messages)
            return ChatResponse(content=response_content, model=message.model)
        except Exception as e:
            print(f"LLM error: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Error getting response from {message.model}: {str(e)}"
            )
            
    except HTTPException as he:
        raise he  # Re-raise HTTP exceptions
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
