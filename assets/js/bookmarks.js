// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    class BookmarkManager {
        constructor() {
            console.log('Initializing BookmarkManager...');
            
            // Get DOM elements
            this.bookmarksSheet = document.getElementById('bookmarks-sheet');
            this.bookmarksList = document.getElementById('bookmarks-list');
            this.emptyState = document.getElementById('empty-bookmarks');
            this.bookmarksButton = document.getElementById('bookmarks-button');
            
            // Log DOM elements status
            console.log('DOM Elements found:', {
                bookmarksSheet: !!this.bookmarksSheet,
                bookmarksList: !!this.bookmarksList,
                emptyState: !!this.emptyState,
                bookmarksButton: !!this.bookmarksButton
            });

            if (!this.bookmarksSheet || !this.bookmarksList || !this.emptyState || !this.bookmarksButton) {
                console.error('Missing required DOM elements');
                return;
            }

            this.closeButton = this.bookmarksSheet.querySelector('.close-button');
            console.log('Close button found:', !!this.closeButton);
            
            // Add test bookmark if none exist
            this.initializeTestBookmark();
            
            // Initialize
            this.initializeEventListeners();
            
            // Initial update
            console.log('Performing initial update of bookmarks list...');
            this.updateBookmarksList();
        }

        initializeTestBookmark() {
            console.log('Checking for existing bookmarks...');
            const existingBookmarks = localStorage.getItem('chatBookmarks');
            console.log('Existing bookmarks:', existingBookmarks);
            
            if (!existingBookmarks) {
                const testBookmark = {
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                    conversation: {
                        user: {
                            content: "What is the capital of France?",
                            role: "user"
                        },
                        assistant: {
                            content: "The capital of France is Paris. It is also the largest city in France and serves as the country's major cultural, economic, and political center.",
                            role: "assistant",
                            metadata: {
                                timestamp: new Date().toLocaleString(),
                                model: "GPT-4"
                            }
                        }
                    }
                };
                
                localStorage.setItem('chatBookmarks', JSON.stringify([testBookmark]));
                console.log('Added test bookmark to localStorage');
            }
        }

        initializeEventListeners() {
            // Toggle bookmarks panel
            this.bookmarksButton.addEventListener('click', () => {
                console.log('Bookmark button clicked');
                this.toggleBookmarksSheet();
            });

            // Close panel
            if (this.closeButton) {
                this.closeButton.addEventListener('click', () => {
                    console.log('Close button clicked');
                    this.hideBookmarksSheet();
                });
            }

            // Close on outside click
            this.bookmarksSheet.addEventListener('click', (e) => {
                if (e.target === this.bookmarksSheet) {
                    console.log('Outside click detected');
                    this.hideBookmarksSheet();
                }
            });

            // Listen for storage changes
            window.addEventListener('storage', (e) => {
                if (e.key === 'chatBookmarks') {
                    console.log('Storage changed, updating bookmarks');
                    this.updateBookmarksList();
                }
            });
        }

        toggleBookmarksSheet() {
            console.log('Toggling bookmarks sheet...');
            const wasHidden = !this.bookmarksSheet.classList.contains('show');
            this.bookmarksSheet.classList.toggle('show');
            console.log('Bookmarks sheet visibility:', this.bookmarksSheet.classList.contains('show'));
            
            if (wasHidden) {
                this.updateBookmarksList();
            }
        }

        hideBookmarksSheet() {
            this.bookmarksSheet.classList.remove('show');
        }

        updateBookmarksList() {
            try {
                console.log('Starting updateBookmarksList...');
                
                // Get bookmarks from localStorage
                const bookmarksJson = localStorage.getItem('chatBookmarks');
                console.log('Raw bookmarks from storage:', bookmarksJson);
                
                // Parse bookmarks
                const bookmarks = bookmarksJson ? JSON.parse(bookmarksJson) : [];
                console.log('Parsed bookmarks:', bookmarks);
                
                // Clear current list
                this.bookmarksList.innerHTML = '';
                console.log('Cleared bookmarks list');
                
                // Show empty state if no bookmarks
                if (!bookmarks || bookmarks.length === 0) {
                    console.log('No bookmarks found, showing empty state');
                    this.emptyState.style.display = 'flex';
                    this.bookmarksList.style.display = 'none';
                    return;
                }

                // Show bookmarks
                console.log(`Found ${bookmarks.length} bookmarks, hiding empty state`);
                this.emptyState.style.display = 'none';
                this.bookmarksList.style.display = 'block';

                // Create bookmark elements
                bookmarks.forEach((bookmark, index) => {
                    try {
                        console.log(`Processing bookmark ${index}:`, bookmark);
                        const bookmarkEl = this.createBookmarkElement(bookmark);
                        if (bookmarkEl) {
                            this.bookmarksList.appendChild(bookmarkEl);
                            console.log(`Added bookmark ${index + 1} to DOM`);
                        } else {
                            console.error(`Failed to create element for bookmark ${index}`);
                        }
                    } catch (err) {
                        console.error(`Error processing bookmark ${index}:`, err);
                    }
                });
                
                console.log('Finished updating bookmarks list');
            } catch (error) {
                console.error('Error in updateBookmarksList:', error);
                this.bookmarksList.innerHTML = '<div class="error-state">Failed to load bookmarks</div>';
            }
        }

        createBookmarkElement(bookmark) {
            console.log('Creating bookmark element for:', bookmark);
            
            if (!this.isValidBookmark(bookmark)) {
                return null;
            }

            const bookmarkItem = document.createElement('div');
            bookmarkItem.className = 'bookmark-item';
            bookmarkItem.style.position = 'relative';
            bookmarkItem.style.background = 'var(--container-bg)';
            bookmarkItem.style.borderRadius = '8px';
            bookmarkItem.style.marginBottom = '0.75rem';
            bookmarkItem.style.border = '1px solid var(--border-color)';

            const conversation = document.createElement('div');
            conversation.className = 'conversation-container';
            conversation.style.display = 'flex';
            conversation.style.flexDirection = 'column';
            conversation.style.gap = '0.5rem';
            conversation.style.background = 'var(--container-bg)';

            const userMessage = this.createMessageElement(
                bookmark.conversation.user.content,
                'user'
            );
            conversation.appendChild(userMessage);

            const assistantMessage = this.createMessageElement(
                bookmark.conversation.assistant.content,
                'assistant',
                bookmark.conversation.assistant.metadata
            );
            conversation.appendChild(assistantMessage);

            bookmarkItem.appendChild(conversation);
            console.log('Successfully created bookmark element');
            return bookmarkItem;
        }

        createMessageElement(content, role, metadata = null) {
            const wrapper = document.createElement('div');
            wrapper.className = `message-wrapper ${role}`;
            wrapper.style.display = 'flex';
            wrapper.style.gap = '0.75rem';
            wrapper.style.padding = '0.75rem';
            wrapper.style.color = 'var(--text-color)';
            wrapper.style.borderRadius = '6px';
            
            // Set background color based on role and theme
            if (role === 'user') {
                wrapper.style.background = 'var(--message-user-bg)'; // Light: #dcf8c6, Dark: #1e3a5f
            } else {
                wrapper.style.background = 'var(--message-bot-bg)'; // Light: #e8e8e8, Dark: #424242
            }

            // Add profile icon with reduced size
            const profileIcon = document.createElement('div');
            profileIcon.className = 'profile-icon';
            profileIcon.style.width = '28px';
            profileIcon.style.height = '28px';
            profileIcon.style.flexShrink = '0';
            profileIcon.style.color = 'var(--text-color)';
            profileIcon.style.background = role === 'user' ? 'var(--message-user-bg)' : 'var(--message-bot-bg)';
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

            // Create message content container
            const messageContainer = document.createElement('div');
            messageContainer.className = 'message-container';
            messageContainer.style.flex = '1';
            messageContainer.style.display = 'flex';
            messageContainer.style.flexDirection = 'column';
            messageContainer.style.gap = '0.375rem';

            // Create message content
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.textContent = content;
            messageContent.style.whiteSpace = 'pre-wrap';
            messageContent.style.wordBreak = 'break-word';
            messageContent.style.fontSize = '0.9375rem';
            messageContent.style.color = 'var(--text-color)';
            messageContainer.appendChild(messageContent);

            // Add metadata and actions only for assistant messages
            if (role === 'assistant' && metadata) {
                const metadataEl = document.createElement('div');
                metadataEl.className = 'message-metadata';
                metadataEl.style.display = 'flex';
                metadataEl.style.justifyContent = 'space-between';
                metadataEl.style.alignItems = 'center';
                metadataEl.style.marginTop = '0.375rem';
                metadataEl.style.paddingTop = '0.375rem';
                metadataEl.style.borderTop = '1px solid var(--border-color)';

                const metadataLeft = document.createElement('div');
                metadataLeft.className = 'metadata-left';
                metadataLeft.style.display = 'flex';
                metadataLeft.style.alignItems = 'center';
                metadataLeft.style.gap = '0.375rem';
                metadataLeft.style.color = 'var(--metadata-color)';
                metadataLeft.style.fontSize = '0.8125rem';

                const model = document.createElement('span');
                model.className = 'message-model';
                model.textContent = `Model: ${metadata.model || 'default'}`;
                metadataLeft.appendChild(model);

                const separator = document.createElement('span');
                separator.className = 'metadata-separator';
                separator.textContent = ' • ';
                metadataLeft.appendChild(separator);

                const timestamp = document.createElement('span');
                timestamp.className = 'message-timestamp';
                timestamp.textContent = metadata.timestamp;
                metadataLeft.appendChild(timestamp);

                metadataEl.appendChild(metadataLeft);

                const actions = document.createElement('div');
                actions.className = 'message-actions';
                actions.style.display = 'flex';
                actions.style.gap = '0.375rem';

                const copyBtn = document.createElement('button');
                copyBtn.className = 'action-button';
                copyBtn.style.background = 'none';
                copyBtn.style.border = 'none';
                copyBtn.style.padding = '0.25rem';
                copyBtn.style.cursor = 'pointer';
                copyBtn.style.color = 'var(--action-button-color)';
                copyBtn.style.borderRadius = '4px';
                copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>';
                copyBtn.title = 'Copy';
                copyBtn.onmouseover = () => {
                    copyBtn.style.background = 'var(--action-button-hover)';
                };
                copyBtn.onmouseout = () => {
                    copyBtn.style.background = 'none';
                };
                copyBtn.onclick = () => {
                    navigator.clipboard.writeText(content);
                    copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"></path></svg>';
                    setTimeout(() => {
                        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>';
                    }, 2000);
                };
                actions.appendChild(copyBtn);

                metadataEl.appendChild(actions);
                messageContainer.appendChild(metadataEl);
            }

            wrapper.appendChild(messageContainer);
            return wrapper;
        }

        isValidBookmark(bookmark) {
            const valid = bookmark 
                && bookmark.conversation
                && bookmark.conversation.user
                && bookmark.conversation.user.content
                && bookmark.conversation.assistant
                && bookmark.conversation.assistant.content
                && bookmark.conversation.assistant.metadata
                && bookmark.conversation.assistant.metadata.model
                && bookmark.conversation.assistant.metadata.timestamp;
                
            if (!valid) {
                console.error('Invalid bookmark structure:', {
                    hasBookmark: !!bookmark,
                    hasConversation: !!bookmark?.conversation,
                    hasUser: !!bookmark?.conversation?.user,
                    hasUserContent: !!bookmark?.conversation?.user?.content,
                    hasAssistant: !!bookmark?.conversation?.assistant,
                    hasAssistantContent: !!bookmark?.conversation?.assistant?.content,
                    hasMetadata: !!bookmark?.conversation?.assistant?.metadata,
                    hasModel: !!bookmark?.conversation?.assistant?.metadata?.model,
                    hasTimestamp: !!bookmark?.conversation?.assistant?.metadata?.timestamp
                });
            }
            
            return valid;
        }

        removeBookmark(id) {
            console.log('Removing bookmark:', id);
            let bookmarks = JSON.parse(localStorage.getItem('chatBookmarks') || '[]');
            bookmarks = bookmarks.filter(b => b.id !== id);
            localStorage.setItem('chatBookmarks', JSON.stringify(bookmarks));
            this.updateBookmarksList();
        }
    }

    // Initialize bookmark manager and make it globally available
    console.log('Creating BookmarkManager instance...');
    const bookmarkManager = new BookmarkManager();
    window.bookmarkManager = bookmarkManager;
    console.log('BookmarkManager initialized and attached to window');
});
