class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('theme-toggle');
        this.themeIcon = this.themeToggle.querySelector('i');
        this.init();
    }

    init() {
        this.loadTheme();
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', newTheme);
        this.updateIcon(newTheme);
        this.saveTheme(newTheme);
    }

    updateIcon(theme) {
        this.themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    loadTheme() {
        const savedTheme = localStorage.getItem(CONFIG.storage.theme) || CONFIG.defaultTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateIcon(savedTheme);
    }

    saveTheme(theme) {
        localStorage.setItem(CONFIG.storage.theme, theme);
    }
}
