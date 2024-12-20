# AI Tutor Chat Application

A modern chat interface for interacting with an AI tutor, featuring a clean UI with dark/light mode support and bookmark functionality.

## Features

- 💬 Clean and modern chat interface
- 🌓 Dark/Light mode toggle
- 📚 Bookmark important conversations
- 👍 Reaction system for responses
- 📱 Responsive design for all devices
- 🤖 Multiple AI model support
- 🔒 Secure API key handling

## Getting Started

### Prerequisites

- Python 3.8 or higher
- Node.js (for development)
- OpenAI API key (for GPT models)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/ai-tutor.git
cd ai-tutor
```

2. Install Python dependencies
```bash
pip install -r requirements.txt
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your API keys
```

### Running the Application

1. Start the backend server
```bash
cd backend
python -m uvicorn main:app --reload
```

2. Start the frontend server
```bash
python -m http.server 8088
```

3. Open in your browser
```
http://localhost:8088/index.html
```

## Project Structure

```
ai-tutor/
├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── chat.js
│       ├── config.js
│       └── bookmarks.js
├── backend/
│   ├── main.py
│   ├── llm_config.py
│   ├── requirements.txt
│   └── tests/
├── index.html
└── README.md
```

## Development

### Backend API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/models` - Get available AI models
- `POST /api/chat` - Send a message to the AI

### Testing

Run the test suite:
```bash
cd backend
python -m pytest
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
