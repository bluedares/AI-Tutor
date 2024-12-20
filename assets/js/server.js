async function getServerPort() {
    const ports = [8004, 8003, 8002, 8001, 8000];  // Prioritize newer ports first
    
    // Try all ports in parallel
    const portPromises = ports.map(port => 
        fetch(`http://localhost:${port}/health`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        })
        .then(async response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Health check response:', data);
            return port;
        })
        .catch(error => {
            console.warn(`Port ${port} check failed:`, error);
            return Promise.reject(error);
        })
    );

    try {
        // Use Promise.any to get the first successful port
        const port = await Promise.any(portPromises);
        console.log('Found server on port:', port);
        return port;
    } catch (error) {
        console.error('Port detection error:', error);
        throw new Error('Could not find running server on any common ports');
    }
}

async function getServerBaseUrl() {
    try {
        console.log('Getting server URL...');
        const port = await getServerPort();
        if (!port) {
            throw new Error('Could not determine server port');
        }
        const baseUrl = `http://localhost:${port}`;
        console.log('Server URL initialized:', baseUrl);
        
        // Verify the server is responding correctly
        const healthCheck = await fetch(`${baseUrl}/health`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        });
        
        if (!healthCheck.ok) {
            throw new Error('Server health check failed');
        }
        
        return baseUrl;
    } catch (error) {
        console.error('Error getting server URL:', error);
        throw new Error('Could not connect to server. Please ensure the backend is running.');
    }
}
