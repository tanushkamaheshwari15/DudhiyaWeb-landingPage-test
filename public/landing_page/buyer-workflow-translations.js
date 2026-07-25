// Buyer Workflow Page Translations
class BuyerWorkflowTranslations {
    constructor() {
        this.translations = {};
        this.currentLanguage = localStorage.getItem('preferredLanguage') || 'hi';
        this.init();
    }

    async init() {
        await this.loadTranslations();
        this.setupLanguageChangeHandler();
        this.applyTranslations();
    }

    async loadTranslations() {
        try {
            const languages = ['en', 'hi', 'pa', 'kn'];
            this.translations = {};

            for (const lang of languages) {
                try {
                    const response = await fetch(`translations/buyer-workflow/${lang}.json`);
                    if (response.ok) {
                        this.translations[lang] = await response.json();
                    } else {
                        console.warn(`Failed to load ${lang} translations for buyer workflow`);
                    }
                } catch (error) {
                    console.warn(`Error loading ${lang} translations:`, error);
                }
            }
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    }

    setupLanguageChangeHandler() {
        // Listen for language change events
        window.addEventListener('languageChanged', (event) => {
            const { language } = event.detail;
            this.currentLanguage = language;
            this.applyTranslations();
        });

        // Listen for DOM content loaded to apply initial translations
        document.addEventListener('DOMContentLoaded', () => {
            this.applyTranslations();
        });
    }

    applyTranslations() {
        if (!this.translations[this.currentLanguage]) {
            console.warn(`No translations available for language: ${this.currentLanguage}`);
            return;
        }

        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key);

            if (translation && translation !== key) {
                // Handle different element types
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else if (element.tagName === 'TITLE') {
                    element.textContent = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        // Update page title if it has data-i18n attribute
        const titleElement = document.querySelector('title[data-i18n]');
        if (titleElement) {
            const titleKey = titleElement.getAttribute('data-i18n');
            const titleTranslation = this.getTranslation(titleKey);
            if (titleTranslation && titleTranslation !== titleKey) {
                document.title = titleTranslation;
            }
        }

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLanguage;
    }

    getTranslation(key) {
        const translation = this.translations[this.currentLanguage];
        return translation && translation[key] ? translation[key] : key;
    }

    // Method to change language programmatically
    setLanguage(language) {
        if (this.translations[language]) {
            this.currentLanguage = language;
            localStorage.setItem('preferredLanguage', language);
            this.applyTranslations();

            // Dispatch language change event
            window.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language }
            }));
        } else {
            console.warn(`Language ${language} not available`);
        }
    }

    // Method to get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // Method to get available languages
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }
}

// Initialize translations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.buyerWorkflowTranslations = new BuyerWorkflowTranslations();
});

// Make it available globally for manual language switching
window.switchBuyerWorkflowLanguage = (language) => {
    if (window.buyerWorkflowTranslations) {
        window.buyerWorkflowTranslations.setLanguage(language);
    }
};

// Export for global access to update language without triggering events (used after navbar load)
window.updateBuyerWorkflowLanguage = async (language) => {
    if (window.buyerWorkflowTranslations) {
        window.buyerWorkflowTranslations.currentLanguage = language;
        await window.buyerWorkflowTranslations.loadTranslations();
        window.buyerWorkflowTranslations.applyTranslations();
    }
};
