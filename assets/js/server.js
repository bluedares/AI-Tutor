async function getServerPort() {
    const port = 8000;  // Fixed backend port
    
    try {
        console.log('Checking server on port:', port);
        const response = await fetch(`http://localhost:${port}/health`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            signal: AbortSignal.timeout(5000)  // 5 second timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.status !== 'ok') {
            throw new Error('Server reported unhealthy status');
        }

        console.log('Server is healthy on port:', port);
        return port;
    } catch (error) {
        console.error(`Server check failed on port ${port}:`, error);
        throw new Error('Could not connect to server. Please ensure the backend is running.');
    }
}

async function getServerBaseUrl() {
    try {
        const port = await getServerPort();
        const baseUrl = `http://localhost:${port}`;
        console.log('Using server URL:', baseUrl);
        return baseUrl;
    } catch (error) {
        console.error('Error getting server URL:', error);
        throw error;
    }
}

// Export functions to window object
window.ServerManager = {
    getServerPort,
    getServerBaseUrl
};
