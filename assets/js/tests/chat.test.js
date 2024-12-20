// Mock window and document before importing ChatManager
global.window = {
    CONFIG: {
        api: {
            baseUrl: 'http://localhost:8004',
            endpoints: {
                chat: '/api/chat',
                models: '/api/models',
                health: '/health'
            }
        }
    },
    isTestEnvironment: true,
    dispatchEvent: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

// Set up our document body
document.body.innerHTML = `
    <div id="chat-messages"></div>
    <select id="llm-selector"></select>
    <textarea id="message-input"></textarea>
    <button id="send-button">Send</button>
`;

// Import ChatManager class
const ChatManager = require('../chat.js');

describe('ChatManager', () => {
    let chatManager;
    let consoleErrorSpy;
    
    beforeEach(() => {
        // Reset window.CONFIG
        window.CONFIG = {
            api: {
                baseUrl: 'http://localhost:8004',
                endpoints: {
                    chat: '/api/chat',
                    models: '/api/models',
                    health: '/health'
                }
            }
        };
        
        // Reset event handlers
        jest.spyOn(window, 'addEventListener');
        jest.spyOn(window, 'removeEventListener');
        jest.spyOn(window, 'dispatchEvent');
        
        // Spy on console.error
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Reset DOM
        document.body.innerHTML = `
            <div id="chat-messages"></div>
            <select id="llm-selector"></select>
            <textarea id="message-input"></textarea>
            <button id="send-button">Send</button>
        `;
        
        // Mock fetch
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(['gpt-3.5-turbo', 'test_mode'])
            })
        );

        // Initialize ChatManager
        chatManager = new ChatManager();
    });

    afterEach(() => {
        // Restore all mocks
        jest.restoreAllMocks();
    });

    test('UI is not blocked during initialization', () => {
        expect(chatManager.messageInput.disabled).toBe(false);
        expect(chatManager.sendButton.disabled).toBe(false);
    });

    test('loadAvailableModels loads and displays models', async () => {
        await chatManager.loadAvailableModels();
        expect(chatManager.availableModels.length).toBe(2);
        expect(chatManager.availableModels).toContain('gpt-3.5-turbo');
        expect(chatManager.availableModels).toContain('test_mode');
    });

    test('handleSendMessage works without models loaded', async () => {
        // Mock fetch for chat response
        global.fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                content: 'Test response',
                role: 'assistant',
                model: 'gpt-3.5-turbo'
            })
        }));

        // Set message and send
        chatManager.messageInput.value = 'Test message';
        await chatManager.handleSendMessage();

        // Check if message was sent and response displayed
        const conversations = chatManager.chatMessages.children;
        expect(conversations.length).toBe(1);
        
        const conversation = conversations[0];
        expect(conversation.className).toBe('conversation-container');

        const messages = conversation.children;
        expect(messages.length).toBe(2); // User message and bot response
        
        const userMessage = messages[0].querySelector('.message-content');
        expect(userMessage.textContent).toBe('Test message');
        
        const assistantMessage = messages[1].querySelector('.message-content');
        expect(assistantMessage.textContent).toBe('Test response');
    });

    test('handles API errors gracefully', async () => {
        // Mock failed API response
        global.fetch.mockImplementationOnce(() => Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ detail: 'Server error' })
        }));

        // Expect the load to fail but handle it gracefully
        await expect(chatManager.loadAvailableModels()).rejects.toThrow('Failed to load models');
        
        // Verify error handling
        expect(chatManager.llmSelector.innerHTML).toContain('Error loading models');
        expect(chatManager.llmSelector.disabled).toBe(true);
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('getModelDisplayName formats model names correctly', () => {
        expect(chatManager.getModelDisplayName('gpt-3.5-turbo')).toBe('GPT-3.5');
        expect(chatManager.getModelDisplayName('test_mode')).toBe('Test Mode');
        expect(chatManager.getModelDisplayName('unknown-model')).toBe('Unknown Model');
    });

    test('chat remains functional when models fail to load', async () => {
        // Mock failed model load first
        global.fetch.mockImplementationOnce(() => Promise.reject('Network error'));

        // Try to load models (should fail)
        await chatManager.loadAvailableModels().catch(() => {});

        // Mock successful chat response
        global.fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                content: 'Response with default model',
                role: 'assistant',
                model: 'gpt-3.5-turbo'
            })
        }));

        // Send a message
        chatManager.messageInput.value = 'Test message';
        await chatManager.handleSendMessage();

        // Check if chat still works
        const conversations = chatManager.chatMessages.children;
        expect(conversations.length).toBe(1);
        
        const conversation = conversations[0];
        expect(conversation.className).toBe('conversation-container');

        const messages = conversation.children;
        expect(messages.length).toBe(2);
        
        const userMessage = messages[0].querySelector('.message-content');
        expect(userMessage.textContent).toBe('Test message');
        
        const assistantMessage = messages[1].querySelector('.message-content');
        expect(assistantMessage.textContent).toBe('Response with default model');
    });

    test('handles successful chat message and response', async () => {
        // Mock successful model loading
        global.fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(['gpt-3.5-turbo', 'test_mode'])
        }));

        // Mock successful chat response
        global.fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                content: 'Test response to: Hello, how are you?',
                role: 'assistant',
                model: 'test_mode'
            })
        }));

        // Load models first
        await chatManager.loadAvailableModels();
        expect(chatManager.availableModels).toContain('test_mode');

        // Set test message and model
        chatManager.messageInput.value = 'Hello, how are you?';
        chatManager.llmSelector.value = 'test_mode';

        // Send message
        await chatManager.handleSendMessage();

        // Verify message was sent with correct format
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:8004/api/chat',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    content: 'Hello, how are you?',
                    role: 'user',
                    model: 'test_mode'
                })
            })
        );

        // Verify conversation container exists
        const conversations = chatManager.chatMessages.children;
        expect(conversations.length).toBe(1);
        
        const conversation = conversations[0];
        expect(conversation.className).toBe('conversation-container');

        // Verify messages within conversation
        const messages = conversation.children;
        expect(messages.length).toBe(2);

        // Check user message
        const userMessage = messages[0];
        expect(userMessage.querySelector('.message-content').textContent).toBe('Hello, how are you?');
        expect(userMessage.className).toContain('message-wrapper user');
        expect(userMessage.querySelector('.message-metadata')).toBeNull();
        expect(userMessage.querySelector('.message-actions')).toBeNull();

        // Check assistant message
        const assistantMessage = messages[1];
        expect(assistantMessage.querySelector('.message-content').textContent).toBe('Test response to: Hello, how are you?');
        expect(assistantMessage.className).toContain('message-wrapper assistant');
        expect(assistantMessage.querySelector('.message-metadata')).toBeTruthy();
        expect(assistantMessage.querySelector('.message-actions')).toBeTruthy();
        expect(assistantMessage.querySelectorAll('.action-button').length).toBe(4); // Like, Dislike, Save, Copy

        // Verify input was cleared
        expect(chatManager.messageInput.value).toBe('');
    });

    test('handles chat error response correctly', async () => {
        // Mock successful model loading
        global.fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(['gpt-3.5-turbo', 'test_mode'])
        }));

        // Mock failed chat response
        global.fetch.mockImplementationOnce(() => Promise.resolve({
            ok: false,
            json: () => Promise.resolve({
                detail: 'Model not available'
            })
        }));

        // Load models first
        await chatManager.loadAvailableModels();

        // Set test message
        chatManager.messageInput.value = 'Hello';
        chatManager.llmSelector.value = 'invalid-model';

        // Send message
        await chatManager.handleSendMessage();

        // Verify conversation container exists
        const conversations = chatManager.chatMessages.children;
        expect(conversations.length).toBe(1);
        
        const conversation = conversations[0];
        expect(conversation.className).toBe('conversation-container');

        // Verify messages within conversation
        const messages = conversation.children;
        expect(messages.length).toBe(2);
        
        // Check user message
        const userMessage = messages[0];
        expect(userMessage.querySelector('.message-content').textContent).toBe('Hello');
        expect(userMessage.className).toContain('message-wrapper user');

        // Check error message
        const errorMessage = messages[1];
        expect(errorMessage.querySelector('.message-content').textContent).toBe('Error: Model not available. Please try again.');
        expect(errorMessage.className).toContain('message-wrapper error');
    });
});
