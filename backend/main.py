from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from backend.llm_config import LLMConfig
from backend.config import Config
from pathlib import Path

# Load environment variables
load_dotenv()

app = FastAPI()

# Get the project root directory
ROOT_DIR = Path(__file__).parent.parent

# Configure CORS with specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8081",  # Adding our current frontend port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return JSONResponse(content={"status": "ok"}, status_code=200)

@app.get("/api/models")
async def get_available_models():
    """Get list of available LLM models."""
    try:
        models = llm_config.get_available_models()
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
            
        # Get response from model
        response = await llm_config.get_chat_response(message.model, message.content)
        
        return ChatResponse(
            content=response,
            model=message.model
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Serve index.html at root
@app.get("/")
async def read_root():
    return FileResponse(str(ROOT_DIR / "index.html"))

# Serve favicon.ico
@app.get("/favicon.ico")
async def get_favicon():
    return FileResponse(str(ROOT_DIR / "assets" / "img" / "favicon.ico"))

# Mount static files
app.mount("/assets", StaticFiles(directory=str(ROOT_DIR / "assets")), name="assets")
app.mount("/.config", StaticFiles(directory=str(ROOT_DIR / ".config")), name="config")
