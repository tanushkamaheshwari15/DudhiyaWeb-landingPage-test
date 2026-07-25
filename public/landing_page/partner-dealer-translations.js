// Partner Dealer Page Translation System
let partnerDealerTranslations = {};
let currentLanguage = 'hi';

// Load translations
async function loadPartnerDealerTranslations(lang) {
    try {
        const response = await fetch(`translations/partner-dealer-${lang}.json`);
        partnerDealerTranslations = await response.json();
        currentLanguage = lang;
        applyPartnerDealerTranslations();
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}

// Apply translations to page elements
function applyPartnerDealerTranslations() {
    const elements = document.querySelectorAll('[data-i18n-partner]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n-partner');
        if (partnerDealerTranslations[key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = partnerDealerTranslations[key];
            } else {
                element.innerHTML = partnerDealerTranslations[key];
            }
        }
    });

    // Update page title
    if (partnerDealerTranslations.page_title) {
        document.title = partnerDealerTranslations.page_title;
    }

    // Update meta description
    if (partnerDealerTranslations.meta_description) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = partnerDealerTranslations.meta_description;
        }
    }
}

// Initialize partner dealer translations
async function initPartnerDealerTranslations() {
    // Get saved language or default to Hindi
    const savedLang = localStorage.getItem('preferredLanguage') || 'hi';
    
    // Load translations
    await loadPartnerDealerTranslations(savedLang);
    
    // Set up language change listeners
    const langOptions = document.querySelectorAll('.language-dropdown a');
    if (langOptions) {
        langOptions.forEach(option => {
            option.addEventListener('click', async (e) => {
                e.preventDefault();
                const selectedLang = option.getAttribute('data-lang');
                
                // Update active state
                langOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Save preference
                localStorage.setItem('preferredLanguage', selectedLang);
                
                // Load and apply new translations
                await loadPartnerDealerTranslations(selectedLang);
                
                // Update display text
                const langText = option.textContent;
                const currentLangDisplayDesktop = document.getElementById('currentLangDesktop');
                const currentLangDisplayMobile = document.getElementById('currentLangMobile');
                
                if (currentLangDisplayDesktop) {
                    currentLangDisplayDesktop.textContent = langText;
                }
                if (currentLangDisplayMobile) {
                    currentLangDisplayMobile.textContent = langText;
                }
                
                // Close dropdowns
                const langDropdownDesktop = document.getElementById('langDropdownDesktop');
                const langDropdownMobile = document.getElementById('langDropdownMobile');
                
                if (langDropdownDesktop) {
                    langDropdownDesktop.classList.remove('show');
                }
                if (langDropdownMobile) {
                    langDropdownMobile.classList.remove('show');
                }
            });
        });
    }
}

// Export functions for global use
window.initPartnerDealerTranslations = initPartnerDealerTranslations;
window.applyPartnerDealerTranslations = applyPartnerDealerTranslations;
