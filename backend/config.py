import os
from dotenv import load_dotenv
from utils.port_finder import get_server_port

# Load environment variables
load_dotenv()

class Config:
    # Server settings
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 0)) or get_server_port()
    
    # CORS settings
    CORS_ORIGINS = [
        "http://localhost:*",      # Any localhost port
        "http://127.0.0.1:*",     # Any 127.0.0.1 port
        "file://"                 # Local file system
    ]
    
    # API settings
    API_PREFIX = "/api"
    
    # Endpoints
    ENDPOINTS = {
        'chat': f"{API_PREFIX}/chat",
        'models': f"{API_PREFIX}/models",
        'health': "/health"
    }
    
    # Model settings
    DEFAULT_MODEL = "gpt-3.5-turbo"
    
    # API Keys
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
