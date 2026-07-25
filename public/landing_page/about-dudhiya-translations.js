// About Dudhiya Page Translations
class AboutDudhiyaTranslations {
  constructor() {
    this.translations = {};
    this.currentLanguage = 'hi';
    this.init();
  }

  async init() {
    // Load initial translations
    await this.loadTranslations(this.currentLanguage);

    // Apply translations to the page immediately
    this.applyTranslations();

    // Listen for language change events
    window.addEventListener('languageChanged', (event) => {
      this.updateLanguage(event.detail.language);
    });

    // Apply saved language preference
    const savedLang = localStorage.getItem('preferredLanguage') || 'hi';
    if (savedLang !== this.currentLanguage) {
      this.updateLanguage(savedLang);
    }
  }

  async loadTranslations(language) {
    try {
      const response = await fetch(`translations/about-dudhiya/${language}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${language}`);
      }
      this.translations = await response.json();
      this.currentLanguage = language;
    } catch (error) {
      console.error('Error loading translations:', error);
      // Fallback to English if current language fails
      if (language !== 'en') {
        await this.loadTranslations('en');
      }
    }
  }

  async updateLanguage(language) {
    if (language === this.currentLanguage) return;

    await this.loadTranslations(language);
    this.applyTranslations();

    // Update page title
    const titleElement = document.querySelector('title[data-i18n="page_title"]');
    if (titleElement) {
      titleElement.textContent = this.translations.page_title || titleElement.textContent;
    }
  }

  applyTranslations() {
    // Find all elements with data-i18n attributes
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.getTranslation(key);

      if (translation) {
        // Handle different element types
        if (element.tagName === 'INPUT' && element.type === 'text') {
          element.placeholder = translation;
        } else if (element.tagName === 'INPUT' && element.type === 'submit') {
          element.value = translation;
        } else {
          element.textContent = translation;
        }
      }
    });
  }

  getTranslation(key) {
    // Support nested keys with dot notation
    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return value;
  }

  // Helper method to get current language
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // Helper method to get all available languages
  getAvailableLanguages() {
    return ['en', 'hi', 'pa', 'kn'];
  }
}

// Initialize translations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.aboutDudhiyaTranslations = new AboutDudhiyaTranslations();
});

// Export for global access
window.updateAboutDudhiyaLanguage = async (language) => {
  if (window.aboutDudhiyaTranslations) {
    await window.aboutDudhiyaTranslations.updateLanguage(language);
  }
};
