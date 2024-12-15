class ChatManager {
    constructor() {
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.chatMessages = document.getElementById('chat-messages');
        this.activeMessage = null;
        this.currentQAContainer = null;
        this.init();
    }

    init() {
        this.sendButton.addEventListener('click', () => this.handleSendMessage());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (!e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            }
        });

        // Auto-resize textarea as user types
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = (this.messageInput.scrollHeight) + 'px';
        });

        // Add click event listener to the chat messages container
        this.chatMessages.addEventListener('click', (e) => {
            const messageContent = e.target.closest('.message-content');
            if (!messageContent) return;

            // If clicking the same message, do nothing
            if (messageContent === this.activeMessage) return;

            // Remove active class from previous message
            if (this.activeMessage) {
                this.activeMessage.classList.remove('active');
            }

            // Add active class to clicked message
            messageContent.classList.add('active');
            this.activeMessage = messageContent;
        });

        // Add click event listener to document to close active message
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.message-content') && this.activeMessage) {
                this.activeMessage.classList.remove('active');
                this.activeMessage = null;
            }
        });
    }

    createQAContainer() {
        const container = document.createElement('div');
        container.classList.add('qa-container');
        this.chatMessages.appendChild(container);
        return container;
    }

    addMessage(message, isUser = true) {
        // Create new QA container if this is a user message
        if (isUser) {
            this.currentQAContainer = this.createQAContainer();
        }

        const container = this.currentQAContainer || this.createQAContainer();

        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-container');

        // Create message content container
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        if (isUser) messageContent.classList.add('user-content');

        // Create avatar
        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        if (isUser) {
            avatar.classList.add('user-avatar');
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        } else {
            avatar.classList.add('ai-avatar');
            avatar.innerHTML = '<i class="fas fa-robot"></i>';
        }
        messageContent.appendChild(avatar);

        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('message-wrapper');
        if (isUser) messageWrapper.classList.add('user-wrapper');

        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(isUser ? 'user-message' : 'bot-message');
        messageElement.textContent = message;
        messageWrapper.appendChild(messageElement);

        if (!isUser) {
            this.addActionButtons(messageWrapper, message);
        }

        messageContent.appendChild(messageWrapper);
        messageContainer.appendChild(messageContent);
        container.appendChild(messageContainer);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        return messageContainer;
    }

    addLoadingMessage() {
        const container = this.currentQAContainer;
        if (!container) return null;

        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-container');

        // Create message content container
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');

        // Create avatar
        const avatar = document.createElement('div');
        avatar.classList.add('avatar', 'ai-avatar');
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
        messageContent.appendChild(avatar);

        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('message-wrapper');

        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'bot-message', 'loading');
        
        const loadingDots = document.createElement('div');
        loadingDots.classList.add('loading-dots');
        loadingDots.innerHTML = '<span></span><span></span><span></span>';
        
        messageElement.appendChild(loadingDots);
        messageWrapper.appendChild(messageElement);
        messageContent.appendChild(messageWrapper);
        
        messageContainer.appendChild(messageContent);
        container.appendChild(messageContainer);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        return messageContainer;
    }

    handleSendMessage() {
        const message = this.messageInput.value.trim();
        if (message) {
            // Add user message
            this.addMessage(message, true);
            
            // Clear input and reset height
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
            
            // Add loading message immediately
            const loadingMessage = this.addLoadingMessage();
            
            // Simulate bot response after 2 second delay
            setTimeout(() => {
                // Remove loading message
                if (loadingMessage) {
                    loadingMessage.remove();
                }
                
                // Add bot response
                this.addMessage('This is a sample response from the bot.', false);
                
                // Reset current QA container
                this.currentQAContainer = null;
                
                // Scroll to bottom
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            }, 2000);
        }
    }

    addActionButtons(messageWrapper, message) {
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('message-actions');
        
        const actions = [
            { icon: 'fa-thumbs-up', tooltip: 'Like', action: 'like' },
            { icon: 'fa-thumbs-down', tooltip: 'Dislike', action: 'dislike' },
            { icon: 'fa-copy', tooltip: 'Copy', action: 'copy' },
            { icon: 'fa-bookmark', tooltip: 'Bookmark', action: 'bookmark' }
        ];

        actions.forEach(({ icon, tooltip, action }) => {
            const button = document.createElement('button');
            button.classList.add('action-button');
            button.setAttribute('data-tooltip', tooltip);
            button.innerHTML = `<i class="fas ${icon}"></i>`;
            
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleAction(button, action, message, actionsDiv);
            });
            
            actionsDiv.appendChild(button);
        });

        messageWrapper.appendChild(actionsDiv);
    }

    handleAction(button, action, message, actionsDiv) {
        switch(action) {
            case 'copy':
                navigator.clipboard.writeText(message).then(() => {
                    button.classList.add('copied');
                    setTimeout(() => button.classList.remove('copied'), 2000);
                });
                break;
            case 'bookmark':
                const messageContainer = button.closest('.message-container');
                const qaContainer = messageContainer.closest('.qa-container');
                const question = qaContainer.querySelector('.user-message').textContent;
                const answer = qaContainer.querySelector('.bot-message').textContent;
                
                const bookmark = bookmarkManager.addBookmark(question, answer);
                if (bookmark) {
                    button.classList.add('bookmarked');
                    setTimeout(() => button.classList.remove('bookmarked'), 2000);
                }
                break;
            case 'like':
                button.classList.toggle('liked');
                if (button.classList.contains('liked')) {
                    const dislikeButton = actionsDiv.querySelector('[data-tooltip="Dislike"]');
                    if (dislikeButton) dislikeButton.classList.remove('disliked');
                }
                break;
            case 'dislike':
                button.classList.toggle('disliked');
                if (button.classList.contains('disliked')) {
                    const likeButton = actionsDiv.querySelector('[data-tooltip="Like"]');
                    if (likeButton) likeButton.classList.remove('liked');
                }
                break;
        }
    }
}
