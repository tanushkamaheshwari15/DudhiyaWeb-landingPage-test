import React, { createContext, useContext, useState } from 'react';
import { translations, defaultLanguage } from '../translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    // Get saved language from localStorage or use default
    return localStorage.getItem('dudhiya_language') || defaultLanguage;
  });

  const changeLanguage = (languageCode) => {
    setCurrentLanguage(languageCode);
    localStorage.setItem('dudhiya_language', languageCode);
  };

  const t = (key, values = {}) => {
    const keys = key.split('.');
    let value = translations[currentLanguage];

    for (const k of keys) {
      value = value?.[k];
    }

    // Fallback to English if translation not found
    if (!value && currentLanguage !== 'en') {
      value = translations.en;
      for (const k of keys) {
        value = value?.[k];
      }
    }

    let result = value || key;

    // Replace placeholders with actual values
    Object.keys(values).forEach(placeholder => {
      const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
      result = result.replace(regex, values[placeholder]);
    });

    return result;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    translations: translations[currentLanguage]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
