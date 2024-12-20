// test_bookmarks.js
const ChatManager = require('../assets/js/chat.js');
const BookmarkManager = require('../assets/js/bookmarks.js');

describe('Bookmark Functionality', () => {
    let chatManager;
    let bookmarkManager;
    let mockLocalStorage;
    let container;

    beforeEach(() => {
        // Mock DOM elements
        document.body.innerHTML = `
            <div id="chat-messages"></div>
            <div id="bookmarks-sheet">
                <button class="close-button"></button>
                <div id="bookmarks-list"></div>
                <div id="empty-bookmarks"></div>
            </div>
            <button id="bookmarks-button"></button>
            <select id="llm-selector"><option value="gpt-4">GPT-4</option></select>
        `;

        // Mock localStorage
        mockLocalStorage = {
            storage: {},
            getItem: function(key) {
                return this.storage[key] || null;
            },
            setItem: function(key, value) {
                this.storage[key] = value;
            }
        };
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });

        // Initialize managers
        chatManager = new ChatManager();
        bookmarkManager = new BookmarkManager();
        container = document.getElementById('chat-messages');
    });

    afterEach(() => {
        // Clean up
        document.body.innerHTML = '';
        mockLocalStorage.storage = {};
        jest.clearAllMocks();
    });

    test('should create message with correct structure', () => {
        chatManager.addMessage('Hello', 'user');
        
        const userMessage = container.querySelector('.message-wrapper.user');
        expect(userMessage).toBeTruthy();
        expect(userMessage.querySelector('.message-content').textContent).toBe('Hello');
    });

    test('should create assistant message with metadata', () => {
        chatManager.addMessage('Hi there!', 'assistant');
        
        const assistantMessage = container.querySelector('.message-wrapper.assistant');
        expect(assistantMessage).toBeTruthy();
        expect(assistantMessage.querySelector('.message-content').textContent).toBe('Hi there!');
        
        const metadata = assistantMessage.querySelector('.message-metadata');
        expect(metadata).toBeTruthy();
        expect(metadata.querySelector('.message-timestamp')).toBeTruthy();
        expect(metadata.querySelector('.message-model')).toBeTruthy();
    });

    test('should save conversation to bookmarks correctly', () => {
        // Add test messages
        chatManager.addMessage('Hello', 'user');
        chatManager.addMessage('Hi there!', 'assistant');

        // Save to bookmarks
        const result = chatManager.saveToBookmarks(container);
        expect(result).toBe(true);
        
        // Get saved bookmarks
        const savedBookmarks = JSON.parse(mockLocalStorage.getItem('chatBookmarks'));
        expect(savedBookmarks).toBeTruthy();
        expect(savedBookmarks.length).toBe(1);
        
        // Verify bookmark structure
        const bookmark = savedBookmarks[0];
        expect(bookmark.messages).toBeTruthy();
        expect(bookmark.messages.length).toBe(2);
        
        // Verify user message
        const userMessage = bookmark.messages[0];
        expect(userMessage.content).toBe('Hello');
        expect(userMessage.role).toBe('user');
        expect(userMessage.metadata).toBeNull();
        
        // Verify assistant message
        const assistantMessage = bookmark.messages[1];
        expect(assistantMessage.content).toBe('Hi there!');
        expect(assistantMessage.role).toBe('assistant');
        expect(assistantMessage.metadata).toBeTruthy();
        expect(assistantMessage.metadata.timestamp).toBeTruthy();
        expect(assistantMessage.metadata.model).toBeTruthy();
    });

    test('should display saved bookmarks correctly', () => {
        // Create a test bookmark
        const testBookmark = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            messages: [
                {
                    content: 'Test user message',
                    role: 'user',
                    metadata: null
                },
                {
                    content: 'Test assistant response',
                    role: 'assistant',
                    metadata: {
                        timestamp: new Date().toLocaleString(),
                        model: 'gpt-4'
                    }
                }
            ]
        };

        // Save test bookmark
        mockLocalStorage.setItem('chatBookmarks', JSON.stringify([testBookmark]));

        // Update bookmarks display
        bookmarkManager.updateBookmarksList();

        // Verify bookmark display
        const bookmarksList = document.getElementById('bookmarks-list');
        expect(bookmarksList.children.length).toBe(1);

        const bookmarkItem = bookmarksList.firstChild;
        expect(bookmarkItem.classList.contains('bookmark-item')).toBe(true);

        // Verify conversation container
        const conversationContainer = bookmarkItem.querySelector('.conversation-container');
        expect(conversationContainer).toBeTruthy();

        // Verify messages
        const messages = conversationContainer.querySelectorAll('.message-wrapper');
        expect(messages.length).toBe(2);

        // Verify user message
        const userMessage = messages[0];
        expect(userMessage.classList.contains('user')).toBe(true);
        expect(userMessage.querySelector('.message-content').textContent).toBe('Test user message');

        // Verify assistant message
        const assistantMessage = messages[1];
        expect(assistantMessage.classList.contains('assistant')).toBe(true);
        expect(assistantMessage.querySelector('.message-content').textContent).toBe('Test assistant response');
        expect(assistantMessage.querySelector('.message-model').textContent).toBe('Model: gpt-4');
    });
});
