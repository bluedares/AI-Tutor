// Application Configuration
window.CONFIG = {
    defaultTheme: 'dark',  // 'light' or 'dark'
    appName: 'AI Tutor',
    botResponseDelay: 1000,  // milliseconds
    storage: {
        theme: 'theme',
        profile: 'profileData'
    },
    api: {
        baseUrl: null,  // Will be set dynamically
        endpoints: {
            chat: '/api/chat',
            models: '/api/models',
            health: '/health'
        }
    }
};

// Initialize API base URL
async function initConfig() {
    // Only initialize once
    if (window.CONFIG.api.baseUrl) {
        console.log('Config already initialized with URL:', window.CONFIG.api.baseUrl);
        window.dispatchEvent(new Event('configReady'));
        return window.CONFIG;
    }

    try {
        console.log('Initializing server configuration...');
        const baseUrl = await getServerBaseUrl();
        window.CONFIG.api.baseUrl = baseUrl;
        console.log('Server configuration initialized:', window.CONFIG);
        window.dispatchEvent(new Event('configReady'));
        return window.CONFIG;
    } catch (error) {
        console.error('Failed to initialize server URL:', error);
        // Show a user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #ff5252; color: white; padding: 10px 20px; border-radius: 4px; z-index: 9999;';
        errorMessage.textContent = 'Could not connect to server. Please ensure the backend is running.';
        document.body.appendChild(errorMessage);
        
        // Remove the message after 5 seconds
        setTimeout(() => errorMessage.remove(), 5000);
        
        throw error;
    }
}

// Initialize configuration and retry if needed
(async function initializeWithRetry() {
    let attempts = 0;
    const maxAttempts = 3;
    const retryDelay = 1000; // 1 second

    while (attempts < maxAttempts) {
        try {
            await initConfig();
            console.log('Configuration initialized successfully');
            return;
        } catch (error) {
            attempts++;
            console.log(`Initialization attempt ${attempts} failed:`, error.message);
            
            if (attempts < maxAttempts) {
                console.log(`Retrying in ${retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }
    
    console.error('Failed to initialize after', maxAttempts, 'attempts');
})();
