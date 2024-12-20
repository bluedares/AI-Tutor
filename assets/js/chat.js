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
        
        // Setup input and button styling
        this.messageInput.placeholder = 'Type your message...';
        this.messageInput.style.padding = '12px';
        this.messageInput.style.borderRadius = '8px';
        this.messageInput.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        this.messageInput.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        this.messageInput.style.color = '#fff';
        this.messageInput.style.fontSize = '14px';
        this.messageInput.style.lineHeight = '1.5';
        this.messageInput.style.resize = 'none';
        this.messageInput.style.transition = 'border-color 0.2s ease';
        
        this.sendButton.style.padding = '8px';
        this.sendButton.style.borderRadius = '8px';
        this.sendButton.style.border = 'none';
        this.sendButton.style.backgroundColor = 'rgb(66, 133, 244)';
        this.sendButton.style.color = '#fff';
        this.sendButton.style.cursor = 'pointer';
        this.sendButton.style.transition = 'background-color 0.2s ease';
        this.sendButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13"/>
                <path d="M22 2L15 22L11 13L2 9L22 2"/>
            </svg>
        `;
        
        // Add hover effect
        this.sendButton.addEventListener('mouseover', () => {
            this.sendButton.style.backgroundColor = 'rgb(86, 153, 255)';
        });
        this.sendButton.addEventListener('mouseout', () => {
            this.sendButton.style.backgroundColor = 'rgb(66, 133, 244)';
        });
        
        // Add focus effect for input
        this.messageInput.addEventListener('focus', () => {
            this.messageInput.style.borderColor = 'rgb(66, 133, 244)';
        });
        this.messageInput.addEventListener('blur', () => {
            this.messageInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        });
        
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
        // Clear existing options
        this.llmSelector.innerHTML = '';

        // Define model order priority
        const modelOrder = {
            'gpt-3.5-turbo': 1,
            'gpt-4': 2,
            'gemini': 3,
            'test_mode': 999 // Always last
        };

        // Sort models according to priority
        const sortedModels = [...this.availableModels].sort((a, b) => {
            const modelA = a.toLowerCase();
            const modelB = b.toLowerCase();
            
            // Handle test_mode specially
            if (modelA.includes('test_mode')) return 1;
            if (modelB.includes('test_mode')) return -1;
            
            // Get priority for each model
            const priorityA = modelOrder[modelA] || 
                            (modelA.includes('gpt') ? 4 : 5);
            const priorityB = modelOrder[modelB] || 
                            (modelB.includes('gpt') ? 4 : 5);
            
            // Sort by priority
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            
            // If same priority, sort alphabetically
            return a.localeCompare(b);
        });

        // Add options to selector
        let hasTestMode = false;
        sortedModels.forEach(model => {
            if (model.toLowerCase().includes('test_mode')) {
                hasTestMode = true;
                return;
            }
            const option = document.createElement('option');
            option.value = model;
            option.textContent = this.getModelDisplayName(model);
            this.llmSelector.appendChild(option);
        });

        // Add separator and test_mode if present
        if (hasTestMode) {
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '──────────';
            this.llmSelector.appendChild(separator);

            const testOption = document.createElement('option');
            testOption.value = 'test_mode';
            testOption.textContent = this.getModelDisplayName('test_mode');
            this.llmSelector.appendChild(testOption);
        }

        // Select first model by default if none selected
        if (!this.selectedModel && sortedModels.length > 0) {
            this.selectedModel = sortedModels[0];
            this.llmSelector.value = this.selectedModel;
        }

        // Enable selector if models are available
        this.llmSelector.disabled = sortedModels.length === 0;
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

        // Clear input and disable
        this.messageInput.value = '';
        this.messageInput.disabled = true;
        this.sendButton.disabled = true;
        this.sendButton.innerHTML = `
            <svg class="loading-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle class="spinner" cx="12" cy="12" r="10"/>
            </svg>
        `;

        try {
            // Add user message
            this.addMessage(message, 'user');

            // Add loading message
            const loadingContainer = document.createElement('div');
            loadingContainer.className = 'message-wrapper assistant';
            loadingContainer.innerHTML = `
                <div class="profile-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="9"/>
                        <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
                        <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
                        <path d="M9 15h6"/>
                        <path d="M7 8h10"/>
                    </svg>
                </div>
                <div class="message-container">
                    <div class="message-content">
                        <div class="loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            `;
            this.chatMessages.appendChild(loadingContainer);
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

            // Use first available model if none selected
            const model = this.llmSelector.value || this.availableModels[0] || 'gpt-3.5-turbo';
            
            // Record start time
            const startTime = Date.now();

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

            // Calculate response time
            const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

            // Remove loading message
            loadingContainer.remove();

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server error:', errorData);
                this.addMessage('Sorry, there was an error processing your request. Please try again.', 'assistant', {
                    timestamp: new Date().toLocaleString(),
                    model: model,
                    responseTime: responseTime + 's'
                });
                return;
            }

            const data = await response.json();
            this.addMessage(data.content, 'assistant', {
                timestamp: new Date().toLocaleString(),
                model: model,
                responseTime: responseTime + 's'
            });

        } catch (error) {
            console.error('Error:', error);
            this.addMessage('Sorry, there was an error processing your request. Please try again.', 'assistant', {
                timestamp: new Date().toLocaleString(),
                model: model || 'unknown',
                responseTime: 'error'
            });
        } finally {
            // Re-enable input and button
            this.messageInput.disabled = false;
            this.sendButton.disabled = false;
            this.sendButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 2L11 13"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2"/>
                </svg>
            `;
            this.messageInput.focus();
        }
    }

    addMessage(content, role, metadata = null) {
        // Check if we need to create a new conversation container
        let conversationContainer = this.chatMessages.querySelector('.conversation-container:last-child');
        const isNewConversation = !conversationContainer || 
            (role === 'user' && conversationContainer.querySelector('.message-wrapper.assistant'));

        if (isNewConversation) {
            conversationContainer = document.createElement('div');
            conversationContainer.className = 'conversation-container';
            this.chatMessages.appendChild(conversationContainer);
        }

        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${role}`;

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
        wrapper.appendChild(profileIcon);

        // Create message container
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';

        // Add content
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        messageContainer.appendChild(messageContent);

        // Add metadata for assistant messages
        if (role === 'assistant' && metadata) {
            const metadataEl = document.createElement('div');
            metadataEl.className = 'message-metadata';

            const metadataLeft = document.createElement('div');
            metadataLeft.className = 'metadata-left';

            const model = document.createElement('span');
            model.className = 'message-model';
            model.textContent = `Model: ${metadata.model}`;
            metadataLeft.appendChild(model);

            const separator1 = document.createElement('span');
            separator1.className = 'metadata-separator';
            separator1.textContent = ' • ';
            metadataLeft.appendChild(separator1);

            const timestamp = document.createElement('span');
            timestamp.className = 'message-timestamp';
            timestamp.textContent = metadata.timestamp;
            metadataLeft.appendChild(timestamp);

            if (metadata.responseTime) {
                const separator2 = document.createElement('span');
                separator2.className = 'metadata-separator';
                separator2.textContent = ' • ';
                metadataLeft.appendChild(separator2);

                const responseTime = document.createElement('span');
                responseTime.className = 'message-response-time';
                responseTime.textContent = `Response time: ${metadata.responseTime}`;
                metadataLeft.appendChild(responseTime);
            }

            metadataEl.appendChild(metadataLeft);

            const actions = document.createElement('div');
            actions.className = 'message-actions';

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

            // Copy button
            const copyBtn = document.createElement('button');
            copyBtn.className = 'action-button';
            copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2z"/><path d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"/></svg>';
            copyBtn.title = 'Copy message';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(content);
                copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
                setTimeout(() => {
                    copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2z"/><path d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"/></svg>';
                }, 2000);
            };
            actions.appendChild(copyBtn);

            // Save button
            const saveBtn = document.createElement('button');
            saveBtn.className = 'action-button';
            saveBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>';
            saveBtn.title = 'Save';
            saveBtn.onclick = () => {
                saveBtn.classList.toggle('active');
                if (saveBtn.classList.contains('active')) {
                    this.saveToBookmarks(wrapper.closest('.conversation-container'));
                }
            };
            actions.appendChild(saveBtn);

            metadataEl.appendChild(actions);
            messageContainer.appendChild(metadataEl);
        }

        wrapper.appendChild(messageContainer);
        conversationContainer.appendChild(wrapper);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    saveToBookmarks(container) {
        try {
            // If container is null, get the last conversation from chat messages
            if (!container) {
                container = this.chatMessages.querySelector('.conversation-container:last-child');
            }
            
            if (!container) {
                console.error('No conversation found to save');
                this.showNotification('No messages to save', 'error');
                return false;
            }

            // Get user and assistant messages
            const userMessage = container.querySelector('.message-wrapper.user');
            const assistantMessage = container.querySelector('.message-wrapper.assistant');
            
            if (!userMessage || !assistantMessage) {
                console.error('Incomplete conversation');
                this.showNotification('No complete conversation to save', 'error');
                return false;
            }

            // Get message contents
            const userContent = userMessage.querySelector('.message-content').textContent;
            const assistantContent = assistantMessage.querySelector('.message-content').textContent;
            
            // Get metadata
            const metadata = {
                timestamp: new Date().toISOString(),
                model: this.selectedModel || 'unknown'
            };

            // Create bookmark object
            const bookmark = {
                id: Date.now(),
                conversation: {
                    user: {
                        content: userContent,
                        role: 'user'
                    },
                    assistant: {
                        content: assistantContent,
                        role: 'assistant',
                        metadata: metadata
                    }
                }
            };

            // Get existing bookmarks
            const bookmarks = JSON.parse(localStorage.getItem('chatBookmarks') || '[]');
            
            // Check for duplicate
            const isDuplicate = bookmarks.some(b => 
                b.conversation.user.content === userContent &&
                b.conversation.assistant.content === assistantContent
            );

            if (isDuplicate) {
                console.log('Conversation already bookmarked');
                this.showNotification('Already saved to bookmarks', 'info');
                return false;
            }

            // Add new bookmark
            bookmarks.push(bookmark);
            localStorage.setItem('chatBookmarks', JSON.stringify(bookmarks));
            
            this.showNotification('Saved to bookmarks', 'success');
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

// Make ChatManager available globally
window.ChatManager = ChatManager;
