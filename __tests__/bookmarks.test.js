// bookmarks.test.js
const fs = require('fs');
const path = require('path');

// Mock fetch API
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ models: ['gpt-4'] })
    })
);

// Set up DOM environment
document.body.innerHTML = `
    <div id="chat-messages"></div>
    <div id="llm-selector">
        <option value="gpt-4">GPT-4</option>
    </div>
    <div id="message-input"></div>
    <div id="send-button"></div>
    <div id="bookmarks-sheet">
        <button class="close-button"></button>
        <div id="bookmarks-list"></div>
        <div id="empty-bookmarks"></div>
    </div>
    <button id="bookmarks-button"></button>
`;

// Mock CONFIG
window.CONFIG = {
    api: {
        baseUrl: 'http://localhost:8000',
        endpoints: {
            chat: '/api/chat',
            models: '/api/models'
        }
    }
};

// Read the source files
const chatJsPath = path.join(__dirname, '../assets/js/chat.js');
const bookmarksJsPath = path.join(__dirname, '../assets/js/bookmarks.js');

const chatJs = fs.readFileSync(chatJsPath, 'utf8');
const bookmarksJs = fs.readFileSync(bookmarksJsPath, 'utf8');

// Create modules from the source code
const ChatManager = eval(`(function() { 
    ${chatJs}
    return ChatManager;
})()`);

const BookmarkManager = eval(`(function() {
    ${bookmarksJs}
    return BookmarkManager;
})()`);

describe('Bookmark Functionality', () => {
    let chatManager;
    let bookmarkManager;
    let mockLocalStorage;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="chat-messages"></div>
            <div id="llm-selector">
                <option value="gpt-4">GPT-4</option>
            </div>
            <div id="message-input"></div>
            <div id="send-button"></div>
            <div id="bookmarks-sheet">
                <button class="close-button"></button>
                <div id="bookmarks-list"></div>
                <div id="empty-bookmarks"></div>
            </div>
            <button id="bookmarks-button"></button>
        `;

        // Mock localStorage
        mockLocalStorage = {
            storage: {},
            getItem: function(key) {
                return this.storage[key] || null;
            },
            setItem: function(key, value) {
                this.storage[key] = value;
            },
            clear: function() {
                this.storage = {};
            }
        };
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage
        });

        // Clear localStorage before each test
        mockLocalStorage.clear();

        chatManager = new ChatManager();
        chatManager.availableModels = ['gpt-4'];
        chatManager.selectedModel = 'gpt-4';
        chatManager.llmSelector.value = 'gpt-4';
        
        bookmarkManager = new BookmarkManager();
        window.bookmarkManager = bookmarkManager;
    });

    afterEach(() => {
        // Clear localStorage after each test
        mockLocalStorage.clear();
    });

    test('should save chat messages to bookmarks', async () => {
        // Add messages to chat
        chatManager.addMessage('Hello', 'user');
        chatManager.addMessage('Hi there!', 'assistant');

        // Get the chat messages container
        const container = document.getElementById('chat-messages');
        
        // Trigger save to bookmarks
        chatManager.saveToBookmarks(container);

        // Get saved bookmarks
        const savedBookmarks = JSON.parse(localStorage.getItem('chatBookmarks') || '[]');
        
        // Verify bookmark structure
        expect(savedBookmarks).toHaveLength(1);
        expect(savedBookmarks[0].messages).toHaveLength(2);
        
        // Verify user message
        expect(savedBookmarks[0].messages[0]).toEqual({
            content: 'Hello',
            role: 'user',
            metadata: null
        });
        
        // Verify assistant message
        const assistantMessage = savedBookmarks[0].messages[1];
        expect(assistantMessage.content).toBe('Hi there!');
        expect(assistantMessage.role).toBe('assistant');
        expect(assistantMessage.metadata).toBeDefined();
        expect(assistantMessage.metadata.model).toBe('gpt-4');
        expect(assistantMessage.metadata.timestamp).toBeDefined();
    });

    test('should display saved bookmarks correctly', async () => {
        // Add and save messages
        chatManager.addMessage('Test user message', 'user');
        chatManager.addMessage('Test assistant response', 'assistant');
        chatManager.saveToBookmarks(document.getElementById('chat-messages'));

        // Update bookmarks display
        await bookmarkManager.updateBookmarksList();

        // Get bookmarks container
        const bookmarksList = document.getElementById('bookmarks-list');
        
        // Verify bookmark display
        const bookmarkItems = bookmarksList.getElementsByClassName('bookmark-item');
        expect(bookmarkItems.length).toBe(1);
        
        // Verify message content display
        const userMessage = bookmarkItems[0].querySelector('.user.message-wrapper');
        const assistantMessage = bookmarkItems[0].querySelector('.assistant.message-wrapper');
        
        expect(userMessage.querySelector('.message-content').textContent).toBe('Test user message');
        expect(assistantMessage.querySelector('.message-content').textContent).toBe('Test assistant response');
        
        // Verify metadata display for assistant message
        const metadata = assistantMessage.querySelector('.message-metadata');
        expect(metadata).toBeDefined();
        expect(metadata.querySelector('.message-timestamp')).toBeDefined();
        expect(metadata.querySelector('.message-model').textContent).toContain('gpt-4');
    });
});
