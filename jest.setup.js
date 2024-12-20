// Mock browser globals
global.CONFIG = {
    api: {
        baseUrl: 'http://localhost:8000',
        endpoints: {
            chat: '/api/chat',
            models: '/api/models',
            health: '/health'
        }
    }
};

// Mock DOM methods
global.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock fetch if not already mocked
if (!global.fetch) {
    global.fetch = jest.fn();
}
