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
            
            // Migrate old bookmarks if needed
            this.migrateBookmarks();
            
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
                    conversation: {
                        user: {
                            content: "What is the capital of France?",
                            role: "user"
                        },
                        assistant: {
                            content: "The capital of France is Paris. It is also the largest city in France and serves as the country's major cultural, economic, and political center.",
                            role: "assistant",
                            metadata: {
                                timestamp: new Date().toISOString(),
                                model: "gpt-3.5-turbo"
                            }
                        }
                    }
                };
                
                localStorage.setItem('chatBookmarks', JSON.stringify([testBookmark]));
                console.log('Added test bookmark:', testBookmark);
            }
        }

        migrateBookmarks() {
            try {
                const bookmarksStr = localStorage.getItem('chatBookmarks');
                if (!bookmarksStr) return;

                const bookmarks = JSON.parse(bookmarksStr);
                if (!Array.isArray(bookmarks)) return;

                const migratedBookmarks = bookmarks.map(bookmark => {
                    // Check if bookmark is already in new format
                    if (bookmark.conversation) {
                        return bookmark;
                    }

                    // Convert old format to new format
                    if (bookmark.messages && Array.isArray(bookmark.messages)) {
                        const userMessage = bookmark.messages.find(m => m.role === 'user');
                        const assistantMessage = bookmark.messages.find(m => m.role === 'assistant');

                        if (userMessage && assistantMessage) {
                            return {
                                id: bookmark.id || Date.now(),
                                conversation: {
                                    user: {
                                        content: userMessage.content,
                                        role: 'user'
                                    },
                                    assistant: {
                                        content: assistantMessage.content,
                                        role: 'assistant',
                                        metadata: {
                                            timestamp: bookmark.timestamp || new Date().toISOString(),
                                            model: assistantMessage.model || 'unknown'
                                        }
                                    }
                                }
                            };
                        }
                    }
                    return null;
                }).filter(Boolean); // Remove any null entries

                // Save migrated bookmarks
                localStorage.setItem('chatBookmarks', JSON.stringify(migratedBookmarks));
                console.log('Migrated bookmarks:', migratedBookmarks);
            } catch (error) {
                console.error('Error migrating bookmarks:', error);
                // If migration fails, clear bookmarks to prevent further errors
                localStorage.removeItem('chatBookmarks');
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
                const bookmarks = this.getBookmarks();
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

                // Sort bookmarks by timestamp in reverse chronological order
                const sortedBookmarks = bookmarks.sort((a, b) => {
                    const timeA = new Date(a.conversation.assistant.metadata.timestamp).getTime();
                    const timeB = new Date(b.conversation.assistant.metadata.timestamp).getTime();
                    return timeB - timeA; // Reverse chronological order
                });

                // Create bookmark elements
                sortedBookmarks.forEach((bookmark, index) => {
                    if (this.isValidBookmark(bookmark)) {
                        const bookmarkElement = this.createBookmarkElement(bookmark);
                        this.bookmarksList.appendChild(bookmarkElement);
                    } else {
                        console.error('Invalid bookmark found:', bookmark);
                    }
                });
                
                console.log('Finished updating bookmarks list');
            } catch (error) {
                console.error('Error in updateBookmarksList:', error);
                this.bookmarksList.innerHTML = '<div class="error-state">Failed to load bookmarks</div>';
            }
        }

        createBookmarkElement(bookmark) {
            try {
                if (!this.isValidBookmark(bookmark)) {
                    console.error('Failed to create element for bookmark', bookmark.id);
                    return null;
                }

                const bookmarkElement = document.createElement('div');
                bookmarkElement.className = 'conversation-container';
                bookmarkElement.setAttribute('data-bookmark-id', bookmark.id);

                // User message
                const userWrapper = document.createElement('div');
                userWrapper.className = 'message-wrapper user';
                userWrapper.style.backgroundColor = 'rgb(66, 133, 244)';

                // User profile icon
                const userProfileIcon = document.createElement('div');
                userProfileIcon.className = 'profile-icon';
                userProfileIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';
                userWrapper.appendChild(userProfileIcon);

                // User message container
                const userMessageContainer = document.createElement('div');
                userMessageContainer.className = 'message-container';
                const userContent = document.createElement('div');
                userContent.className = 'message-content';
                userContent.textContent = bookmark.conversation.user.content;
                userContent.style.color = '#ffffff';
                userMessageContainer.appendChild(userContent);
                userWrapper.appendChild(userMessageContainer);

                // Assistant message
                const assistantWrapper = document.createElement('div');
                assistantWrapper.className = 'message-wrapper assistant';
                assistantWrapper.style.backgroundColor = 'rgb(45, 45, 45)';

                // Assistant profile icon
                const assistantProfileIcon = document.createElement('div');
                assistantProfileIcon.className = 'profile-icon';
                assistantProfileIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="9"/>
                    <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
                    <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
                    <path d="M9 15h6"/>
                    <path d="M7 8h10"/>
                </svg>`;
                assistantWrapper.appendChild(assistantProfileIcon);

                // Assistant message container
                const assistantMessageContainer = document.createElement('div');
                assistantMessageContainer.className = 'message-container';
                
                // Assistant content
                const assistantContent = document.createElement('div');
                assistantContent.className = 'message-content';
                assistantContent.textContent = bookmark.conversation.assistant.content;
                assistantContent.style.color = '#ffffff';
                assistantMessageContainer.appendChild(assistantContent);

                // Metadata section
                const metadataEl = document.createElement('div');
                metadataEl.className = 'message-metadata';
                metadataEl.style.color = 'rgb(163, 163, 163)';
                metadataEl.style.display = 'flex';
                metadataEl.style.justifyContent = 'space-between';
                metadataEl.style.alignItems = 'center';
                metadataEl.style.marginTop = '8px';
                metadataEl.style.paddingTop = '8px';
                metadataEl.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';

                // Metadata left section
                const metadataLeft = document.createElement('div');
                metadataLeft.className = 'metadata-left';
                metadataLeft.style.display = 'flex';
                metadataLeft.style.gap = '8px';
                metadataLeft.style.alignItems = 'center';
                metadataLeft.style.fontSize = '14px';

                // Model info
                const model = document.createElement('span');
                model.className = 'message-model';
                model.textContent = `Model: ${bookmark.conversation.assistant.metadata.model}`;
                metadataLeft.appendChild(model);

                // Separator
                const separator = document.createElement('span');
                separator.textContent = '•';
                separator.style.color = 'rgb(163, 163, 163)';
                metadataLeft.appendChild(separator);

                // Timestamp
                const timestamp = document.createElement('span');
                timestamp.className = 'message-timestamp';
                const date = new Date(bookmark.conversation.assistant.metadata.timestamp);
                timestamp.textContent = date.toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }).replace(',', '');
                metadataLeft.appendChild(timestamp);

                metadataEl.appendChild(metadataLeft);

                // Action buttons
                const actions = document.createElement('div');
                actions.className = 'message-actions';
                actions.style.display = 'flex';
                actions.style.gap = '8px';

                // Copy button
                const copyBtn = document.createElement('button');
                copyBtn.className = 'action-button';
                copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2z"/><path d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"/></svg>';
                copyBtn.title = 'Copy conversation';
                copyBtn.onclick = () => {
                    const text = `User: ${bookmark.conversation.user.content}\n\nAssistant: ${bookmark.conversation.assistant.content}`;
                    navigator.clipboard.writeText(text);
                    copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
                    setTimeout(() => {
                        copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2z"/><path d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"/></svg>';
                    }, 2000);
                };
                actions.appendChild(copyBtn);

                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'action-button';
                deleteBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
                deleteBtn.title = 'Delete bookmark';
                deleteBtn.onclick = () => {
                    this.removeBookmark(bookmark.id);
                };
                actions.appendChild(deleteBtn);

                metadataEl.appendChild(actions);
                assistantMessageContainer.appendChild(assistantContent);
                assistantMessageContainer.appendChild(metadataEl);
                assistantWrapper.appendChild(assistantMessageContainer);

                // Add all elements to bookmark
                bookmarkElement.appendChild(userWrapper);
                bookmarkElement.appendChild(assistantWrapper);

                return bookmarkElement;
            } catch (error) {
                console.error('Error creating bookmark element:', error);
                return null;
            }
        }

        isValidBookmark(bookmark) {
            try {
                if (!bookmark || typeof bookmark !== 'object') {
                    console.error('Bookmark is not an object:', bookmark);
                    return false;
                }

                if (!bookmark.id || !bookmark.conversation) {
                    console.error('Bookmark missing required fields:', bookmark);
                    return false;
                }

                const { user, assistant } = bookmark.conversation;

                if (!user || !assistant) {
                    console.error('Bookmark missing user or assistant:', bookmark.conversation);
                    return false;
                }

                if (!user.content || user.role !== 'user') {
                    console.error('Invalid user message:', user);
                    return false;
                }

                if (!assistant.content || assistant.role !== 'assistant' || !assistant.metadata) {
                    console.error('Invalid assistant message:', assistant);
                    return false;
                }

                const { metadata } = assistant;
                if (!metadata.timestamp || !metadata.model) {
                    console.error('Invalid metadata:', metadata);
                    return false;
                }

                return true;
            } catch (error) {
                console.error('Error validating bookmark:', error);
                return false;
            }
        }

        removeBookmark(id) {
            console.log('Removing bookmark:', id);
            let bookmarks = this.getBookmarks();
            bookmarks = bookmarks.filter(b => b.id !== id);
            localStorage.setItem('chatBookmarks', JSON.stringify(bookmarks));
            this.updateBookmarksList();
        }

        getBookmarks() {
            try {
                const bookmarks = JSON.parse(localStorage.getItem('chatBookmarks') || '[]');
                return Array.isArray(bookmarks) ? bookmarks : [];
            } catch (error) {
                console.error('Error getting bookmarks:', error);
                return [];
            }
        }
    }

    // Initialize bookmark manager and make it globally available
    console.log('Creating BookmarkManager instance...');
    const bookmarkManager = new BookmarkManager();
    window.bookmarkManager = bookmarkManager;
    console.log('BookmarkManager initialized and attached to window');
});
