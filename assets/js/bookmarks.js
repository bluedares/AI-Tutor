class BookmarkManager {
    constructor() {
        this.bookmarksSheet = document.getElementById('bookmarks-sheet');
        this.bookmarksList = document.getElementById('bookmarks-list');
        this.emptyState = document.getElementById('empty-bookmarks');
        this.bookmarksButton = document.getElementById('bookmarks-button');
        this.closeButton = this.bookmarksSheet.querySelector('.close-button');
        
        this.bookmarks = this.loadBookmarks();
        this.initializeEventListeners();
        this.updateBookmarksList();
    }

    initializeEventListeners() {
        this.bookmarksButton.addEventListener('click', () => this.toggleBookmarksSheet());
        this.closeButton.addEventListener('click', () => this.hideBookmarksSheet());
        
        // Close on click outside
        this.bookmarksSheet.addEventListener('click', (e) => {
            if (e.target === this.bookmarksSheet) {
                this.hideBookmarksSheet();
            }
        });
    }

    loadBookmarks() {
        const savedBookmarks = localStorage.getItem('bookmarks');
        return savedBookmarks ? JSON.parse(savedBookmarks) : [];
    }

    saveBookmarks() {
        localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));
        this.updateBookmarksList();
    }

    addBookmark(question, answer) {
        const bookmark = {
            id: Date.now(),
            question,
            answer,
            timestamp: new Date().toISOString()
        };
        
        this.bookmarks.unshift(bookmark);
        this.saveBookmarks();
        return bookmark;
    }

    removeBookmark(id) {
        this.bookmarks = this.bookmarks.filter(bookmark => bookmark.id !== id);
        this.saveBookmarks();
    }

    toggleBookmarksSheet() {
        this.bookmarksSheet.classList.toggle('show');
        this.updateBookmarksList();
    }

    hideBookmarksSheet() {
        this.bookmarksSheet.classList.remove('show');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    updateBookmarksList() {
        if (this.bookmarks.length === 0) {
            this.bookmarksList.style.display = 'none';
            this.emptyState.style.display = 'flex';
            return;
        }

        this.bookmarksList.style.display = 'block';
        this.emptyState.style.display = 'none';
        
        this.bookmarksList.innerHTML = this.bookmarks.map(bookmark => `
            <div class="bookmark-item" data-id="${bookmark.id}">
                <div class="bookmark-question">${bookmark.question}</div>
                <div class="bookmark-answer">${bookmark.answer}</div>
                <div class="bookmark-meta">
                    <span>${this.formatDate(bookmark.timestamp)}</span>
                    <button class="action-button" onclick="bookmarkManager.removeBookmark(${bookmark.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// Initialize bookmark manager
const bookmarkManager = new BookmarkManager();
