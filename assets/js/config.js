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
        
        // Set the base URL
        window.CONFIG.api.baseUrl = baseUrl;
        console.log('Server URL initialized:', baseUrl);
        
        // Test the connection
        const healthResponse = await fetch(`${baseUrl}/health`);
        if (!healthResponse.ok) {
            throw new Error('Server health check failed');
        }
        
        // Dispatch success event
        window.dispatchEvent(new Event('configReady'));
        return window.CONFIG;
    } catch (error) {
        console.error('Failed to initialize server URL:', error);
        window.dispatchEvent(new CustomEvent('configError', { 
            detail: error.message 
        }));
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
