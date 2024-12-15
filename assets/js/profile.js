class PupilManager {
    constructor() {
        this.profileButton = document.querySelector('#profile-button');
        this.profileSheet = document.querySelector('#profile-sheet');
        this.closeSheet = document.querySelector('#close-sheet');
        this.overlay = document.querySelector('#overlay');
        this.profileForm = document.querySelector('#profile-form');

        if (!this.profileButton) console.error('Profile button not found');
        if (!this.profileSheet) console.error('Profile sheet not found');
        if (!this.closeSheet) console.error('Close button not found');
        if (!this.overlay) console.error('Overlay not found');
        if (!this.profileForm) console.error('Profile form not found');

        this.init();
        console.log('Profile manager initialized');
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        if (this.profileButton) {
            this.profileButton.onclick = (e) => {
                e.preventDefault();
                this.toggleBottomSheet();
            };
        }

        if (this.closeSheet) {
            this.closeSheet.onclick = (e) => {
                e.preventDefault();
                this.closeBottomSheet();
            };
        }

        if (this.overlay) {
            this.overlay.onclick = (e) => {
                if (e.target === this.overlay) {
                    this.closeBottomSheet();
                }
            };
        }

        if (this.profileForm) {
            this.profileForm.onsubmit = (e) => {
                e.preventDefault();
                this.savePupilData(e);
            };
        }
    }

    toggleBottomSheet() {
        console.log('Toggling bottom sheet');
        if (this.profileSheet && this.overlay) {
            this.profileSheet.classList.toggle('show');
            this.overlay.classList.toggle('show');
            if (this.profileSheet.classList.contains('show')) {
                this.loadPupilData();
            }
        }
    }

    closeBottomSheet() {
        console.log('Closing bottom sheet');
        if (this.profileSheet && this.overlay) {
            this.profileSheet.classList.remove('show');
            this.overlay.classList.remove('show');
        }
    }

    loadPupilData() {
        try {
            const pupilData = JSON.parse(localStorage.getItem(CONFIG.storage.profile) || '{}');
            Object.keys(pupilData).forEach(key => {
                const input = document.getElementById(key);
                if (input) input.value = pupilData[key];
            });
        } catch (error) {
            console.error('Error loading pupil data:', error);
        }
    }

    savePupilData(e) {
        try {
            const formData = {
                name: document.getElementById('name').value,
                age: document.getElementById('age').value,
                class: document.getElementById('class').value,
                school: document.getElementById('school').value,
                'parent-name': document.getElementById('parent-name').value,
                'parent-number': document.getElementById('parent-number').value
            };
            localStorage.setItem(CONFIG.storage.profile, JSON.stringify(formData));
            this.closeBottomSheet();
        } catch (error) {
            console.error('Error saving pupil data:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing pupil manager');
    window.pupilManager = new PupilManager();
});
