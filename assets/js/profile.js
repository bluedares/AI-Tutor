class PupilManager {
    constructor() {
        this.profileButton = document.getElementById('profile-button');
        this.profileSheet = document.getElementById('profile-sheet');
        this.closeSheet = document.getElementById('close-sheet');
        this.overlay = document.getElementById('overlay');
        this.profileForm = document.getElementById('profile-form');
        this.init();
    }

    init() {
        this.profileButton.addEventListener('click', () => this.toggleBottomSheet());
        this.closeSheet.addEventListener('click', () => this.closeBottomSheet());
        this.overlay.addEventListener('click', () => this.closeBottomSheet());
        this.profileForm.addEventListener('submit', (e) => this.savePupilData(e));
    }

    toggleBottomSheet() {
        this.profileSheet.classList.toggle('active');
        this.overlay.classList.toggle('active');
        if (this.profileSheet.classList.contains('active')) {
            this.loadPupilData();
        }
    }

    closeBottomSheet() {
        this.profileSheet.classList.remove('active');
        this.overlay.classList.remove('active');
    }

    loadPupilData() {
        const pupilData = JSON.parse(localStorage.getItem(CONFIG.storage.profile) || '{}');
        Object.keys(pupilData).forEach(key => {
            const input = document.getElementById(key);
            if (input) input.value = pupilData[key];
        });
    }

    savePupilData(e) {
        e.preventDefault();
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
    }
}
