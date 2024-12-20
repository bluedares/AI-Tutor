// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    window = {
        CONFIG: {
            api: {
                baseUrl: 'http://localhost:8004',
                endpoints: {
                    chat: '/api/chat',
                    models: '/api/models',
                    health: '/health'
                }
            }
        }
    };
    document = {
        getElementById: () => ({
            addEventListener: () => {},
            getElementsByClassName: () => [],
            appendChild: () => {},
            innerHTML: '',
            value: '',
            style: {}
        })
    };
}

class ChatManager {
    constructor() {
        this.chatMessages = document.getElementById('chat-messages');
        this.llmSelector = document.getElementById('llm-selector');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        
        // Initialize with default state
        this.isModelLoading = true;
        this.availableModels = [];
        this.selectedModel = null;
        
        // Set initial UI state
        this.messageInput.disabled = false;
        this.sendButton.disabled = false;
        
        // Add event listeners
        this.sendButton.addEventListener('click', () => this.handleSendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
        
        // Initialize configuration
        this.initializeChat();
    }

    async initializeChat() {
        try {
            // Wait for config in background
            await this.waitForConfig();
            
            // Try to load models in background
            this.loadAvailableModels().catch(error => {
                console.error('Error loading models:', error);
                this.llmSelector.innerHTML = '<option value="">Error loading models</option>';
                this.llmSelector.disabled = true;
            });
        } catch (error) {
            console.error('Error initializing chat:', error);
            // Don't block UI, just show error in model selector
            this.llmSelector.innerHTML = '<option value="">Error loading models</option>';
            this.llmSelector.disabled = true;
        }
    }

    async waitForConfig() {
        return new Promise((resolve, reject) => {
            if (window.CONFIG?.api?.baseUrl) {
                resolve(window.CONFIG);
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Configuration initialization timed out'));
            }, 5000);

            window.addEventListener('configReady', () => {
                clearTimeout(timeout);
                resolve(window.CONFIG);
            }, { once: true });

            window.addEventListener('configError', (event) => {
                clearTimeout(timeout);
                reject(new Error(event.detail || 'Configuration initialization failed'));
            }, { once: true });
        });
    }

    async loadAvailableModels() {
        try {
            const response = await fetch(`${window.CONFIG.api.baseUrl}${window.CONFIG.api.endpoints.models}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                console.error('Failed to load models:', response.status);
                this.llmSelector.innerHTML = '<option value="">Error loading models</option>';
                this.llmSelector.disabled = true;
                throw new Error('Failed to load models');
            }
            
            const data = await response.json();
            console.log('Models loaded:', data);
            
            this.availableModels = data;
            this.updateModelSelector();
            this.isModelLoading = false;
            
            return this.availableModels;
        } catch (error) {
            this.isModelLoading = false;
            this.llmSelector.innerHTML = '<option value="">Error loading models</option>';
            this.llmSelector.disabled = true;
            console.error('Error loading models:', error);
            throw error;
        }
    }

    updateModelSelector() {
        this.llmSelector.innerHTML = '';
        this.availableModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = this.getModelDisplayName(model);
            this.llmSelector.appendChild(option);
        });
        
        if (this.availableModels.length > 0) {
            this.selectedModel = this.availableModels[0];
            this.llmSelector.value = this.selectedModel;
        }
    }

    getModelDisplayName(model) {
        // Format model names for display
        if (model === 'gpt-3.5-turbo') return 'GPT-3.5';
        return model.split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    async handleSendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        try {
            // Add user message immediately
            this.addMessage(message, 'user');
            this.messageInput.value = '';

            // If models aren't loaded yet, try to load them
            if (this.availableModels.length === 0 && !this.isModelLoading) {
                await this.loadAvailableModels();
            }

            // Use first available model if none selected
            const model = this.llmSelector.value || this.availableModels[0] || 'gpt-3.5-turbo';
            
            const response = await fetch(`${window.CONFIG.api.baseUrl}${window.CONFIG.api.endpoints.chat}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify({
                    content: message,
                    role: 'user',
                    model: model
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server error:', errorData);
                throw new Error(errorData.detail || 'Failed to send message');
            }

            const data = await response.json();
            this.addMessage(data.content, 'assistant');
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage(`Error: ${error.message}. Please try again.`, 'error');
        }
    }

    addMessage(content, role) {
        let conversationContainer;
        
        if (role === 'user') {
            // Create new conversation container for user message
            conversationContainer = document.createElement('div');
            conversationContainer.className = 'conversation-container';
            this.chatMessages.appendChild(conversationContainer);
        } else {
            // Get the last conversation container for assistant/error message
            conversationContainer = this.chatMessages.lastElementChild;
        }

        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message-wrapper ${role}`;

        // Add profile icon
        const profileIcon = document.createElement('div');
        profileIcon.className = 'profile-icon';
        if (role === 'user') {
            profileIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';
        } else if (role === 'assistant') {
            profileIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="9"/>
                <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
                <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
                <path d="M9 15h6"/>
                <path d="M7 8h10"/>
            </svg>`;
        }
        messageWrapper.appendChild(profileIcon);

        // Create message content container
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';

        // Create message content
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        messageContainer.appendChild(messageContent);

        // Add metadata and actions only for assistant messages
        if (role === 'assistant') {
            // Create metadata container
            const metadata = document.createElement('div');
            metadata.className = 'message-metadata';
            
            // Create left side container for timestamp and model
            const metadataLeft = document.createElement('div');
            metadataLeft.className = 'metadata-left';

            // Add model name first
            const model = document.createElement('span');
            model.className = 'message-model';
            model.textContent = `Model: ${this.llmSelector.value || 'default'}`;
            metadataLeft.appendChild(model);

            // Add bullet separator
            const separator = document.createElement('span');
            separator.className = 'metadata-separator';
            separator.textContent = ' • ';
            metadataLeft.appendChild(separator);

            // Add timestamp
            const timestamp = document.createElement('span');
            timestamp.className = 'message-timestamp';
            const now = new Date();
            timestamp.textContent = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
            metadataLeft.appendChild(timestamp);

            metadata.appendChild(metadataLeft);

            // Add action buttons container
            const actions = document.createElement('div');
            actions.className = 'message-actions';
            metadata.appendChild(actions);

            // Like button
            const likeBtn = document.createElement('button');
            likeBtn.className = 'action-button';
            likeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>';
            likeBtn.title = 'Like';
            likeBtn.onclick = () => {
                likeBtn.classList.toggle('active');
                if (likeBtn.classList.contains('active')) {
                    dislikeBtn.classList.remove('active');
                }
            };
            actions.appendChild(likeBtn);

            // Dislike button
            const dislikeBtn = document.createElement('button');
            dislikeBtn.className = 'action-button';
            dislikeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>';
            dislikeBtn.title = 'Dislike';
            dislikeBtn.onclick = () => {
                dislikeBtn.classList.toggle('active');
                if (dislikeBtn.classList.contains('active')) {
                    likeBtn.classList.remove('active');
                }
            };
            actions.appendChild(dislikeBtn);

            // Save/Bookmark button
            const saveBtn = document.createElement('button');
            saveBtn.className = 'action-button';
            saveBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>';
            saveBtn.title = 'Save to Bookmarks';
            saveBtn.onclick = () => {
                saveBtn.classList.toggle('active');
                this.saveToBookmarks(this.chatMessages);
            };
            actions.appendChild(saveBtn);

            // Copy button
            const copyBtn = document.createElement('button');
            copyBtn.className = 'action-button';
            copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>';
            copyBtn.title = 'Copy';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(content);
                copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"></path></svg>';
                setTimeout(() => {
                    copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>';
                }, 2000);
            };
            actions.appendChild(copyBtn);

            messageContainer.appendChild(metadata);
        }

        messageWrapper.appendChild(messageContainer);
        conversationContainer.appendChild(messageWrapper);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    saveToBookmarks(container) {
        try {
            // Get the latest conversation
            const latestConversation = container.querySelector('.conversation-container:last-child');
            if (!latestConversation) {
                console.error('No conversation found to save');
                this.showNotification('No messages to save', 'error');
                return false;
            }

            // Get user and assistant messages
            const userMessage = latestConversation.querySelector('.message-wrapper.user');
            const assistantMessage = latestConversation.querySelector('.message-wrapper.assistant');
            
            if (!userMessage || !assistantMessage) {
                console.error('Incomplete conversation');
                this.showNotification('No complete conversation to save', 'error');
                return false;
            }

            // Extract content and metadata
            const userContent = userMessage.querySelector('.message-content').textContent;
            const assistantContent = assistantMessage.querySelector('.message-content').textContent;
            const model = assistantMessage.querySelector('.message-model').textContent.replace('Model: ', '');
            const timestamp = assistantMessage.querySelector('.message-timestamp').textContent;

            // Create bookmark object
            const bookmark = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                conversation: {
                    user: {
                        content: userContent,
                        role: 'user'
                    },
                    assistant: {
                        content: assistantContent,
                        role: 'assistant',
                        metadata: {
                            timestamp: timestamp,
                            model: model
                        }
                    }
                }
            };

            // Save to localStorage
            const existingBookmarks = localStorage.getItem('chatBookmarks');
            let bookmarks = existingBookmarks ? JSON.parse(existingBookmarks) : [];
            bookmarks.unshift(bookmark);
            localStorage.setItem('chatBookmarks', JSON.stringify(bookmarks));

            console.log('Saved bookmark:', bookmark);
            console.log('All bookmarks:', bookmarks);

            this.showNotification('Conversation saved to bookmarks', 'success');

            // Update bookmarks display if panel is open
            const bookmarksSheet = document.getElementById('bookmarks-sheet');
            if (bookmarksSheet && bookmarksSheet.classList.contains('show')) {
                if (window.bookmarkManager) {
                    window.bookmarkManager.updateBookmarksList();
                }
            }

            return true;
        } catch (error) {
            console.error('Error saving bookmark:', error);
            this.showNotification('Failed to save bookmark', 'error');
            return false;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
}

// Make ChatManager available in both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatManager;
} else if (typeof window !== 'undefined') {
    window.ChatManager = ChatManager;
}
