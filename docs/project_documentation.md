# AI Tutor Project Documentation

## Project Overview
AI Tutor is a web-based chat application that provides an interactive interface for users to communicate with various AI models. The application features a modern UI, real-time chat functionality, and bookmark management.

## Architecture

### Frontend
- **Technology Stack**: HTML5, CSS3, JavaScript (ES6+)
- **Entry Point**: `index.html`
- **Asset Structure**:
  ```
  assets/
  ├── css/
  │   └── styles.css
  ├── js/
  │   ├── chat.js
  │   └── bookmarks.js
  ```

### Backend
- **Technology Stack**: Python, FastAPI
- **Main Components**: `backend/main.py`
- **Dependencies**: See `requirements.txt`

## Core Features

### 1. Chat Interface (`chat.js`)
- **Chat Manager Class**
  - Handles real-time chat interactions
  - Manages message history
  - Supports multiple AI models
  - Features:
    - Message sending/receiving
    - Model selection
    - Message formatting
    - Error handling
    - Loading states
    - Action buttons (Like, Dislike, Copy, Save)

### 2. Bookmark System (`bookmarks.js`)
- **Bookmark Manager Class**
  - Manages saved conversations
  - Features:
    - Save/Delete bookmarks
    - Display in reverse chronological order
    - Copy conversation content
    - Metadata display (model, timestamp)
    - Persistent storage using localStorage
    - Migration support for older formats

### 3. UI Components
- **Message Display**
  - User messages (blue background)
  - Assistant messages (dark background)
  - Loading indicators
  - Error states
  - Action buttons

- **Input Area**
  - Text input with auto-resize
  - Send button with loading state
  - Model selector dropdown
  - Keyboard shortcuts (Enter to send, Shift+Enter for new line)

### 4. Backend API (`main.py`)
- **Endpoints**:
  - `/api/chat`: Handle chat messages
  - `/api/models`: Get available models
  - `/health`: Health check endpoint

- **Features**:
  - Model management
  - Request validation
  - Error handling
  - Configuration management

## Data Models

### Message Format
```javascript
{
  content: string,
  role: 'user' | 'assistant',
  metadata: {
    timestamp: string,
    model: string,
    responseTime?: string
  }
}
```

### Bookmark Format
```javascript
{
  id: number,
  conversation: {
    user: {
      content: string,
      role: 'user'
    },
    assistant: {
      content: string,
      role: 'assistant',
      metadata: {
        timestamp: string,
        model: string
      }
    }
  }
}
```

## Key Functions

### Chat Management
- `handleSendMessage()`: Process and send user messages
- `addMessage()`: Add messages to the chat interface
- `loadAvailableModels()`: Load and display available AI models

### Bookmark Management
- `saveToBookmarks()`: Save conversations to bookmarks
- `updateBookmarksList()`: Update and display bookmarks
- `createBookmarkElement()`: Create bookmark UI elements
- `removeBookmark()`: Delete bookmarks

## Styling

### Theme Colors
- Primary Blue: rgb(66, 133, 244)
- Dark Background: rgb(45, 45, 45)
- Text Color: #fff
- Metadata Color: rgb(163, 163, 163)

### UI Elements
- Rounded corners (8px)
- Smooth transitions
- Responsive layout
- Hover effects
- Loading animations

## Event Handling
- Message submission
- Model selection
- Bookmark management
- Error handling
- Storage events
- Keyboard shortcuts

## Storage
- Local Storage for bookmarks
- Session management
- Data migration support

## Error Handling
- Network errors
- Model loading errors
- Invalid message formats
- Storage errors
- API response errors

## Future Considerations
1. **Performance Optimization**
   - Message pagination
   - Lazy loading
   - Cache management

2. **Feature Extensions**
   - Message search
   - Export conversations
   - Additional model support
   - Rich text formatting

3. **Security**
   - Input sanitization
   - Rate limiting
   - API key management

## Testing
- Jest for JavaScript
- Pytest for Python
- Test files in `__tests__` and `tests` directories

## Build and Deployment
- Build script: `build.sh`
- Run script: `run.sh`
- Development server port: 8004 (configurable)

## Dependencies
- See `requirements.txt` for Python dependencies
- See `package.json` for Node.js dependencies

## License
MIT License - See LICENSE file for details
