// Initialize all managers when the DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize config first
        await initConfig();
        
        // Then initialize managers
        const themeManager = new ThemeManager();
        const pupilManager = new PupilManager();
        const chatManager = new ChatManager();
    } catch (error) {
        console.error('Error initializing application:', error);
        // Show error to user if needed
        document.getElementById('chat-messages').innerHTML = `
            <div class="error-message">
                <p>Error initializing application: ${error.message}</p>
                <p>Please refresh the page or contact support if the problem persists.</p>
            </div>
        `;
    }
});
