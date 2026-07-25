import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../translations';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="language-switcher" ref={dropdownRef}>
      <button
        className="lang-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change Language"
      >
        <FontAwesomeIcon icon={faGlobe} className="lang-icon" />
        <span className="lang-text">
          {currentLang?.name === 'Hindi' ? 'भाषा' :
            currentLang?.name === 'Punjabi' ? 'ਭਾਸ਼ਾ' :
              currentLang?.name === 'Kannada' ? 'ಭಾಷೆ' : 'Language'}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`lang-chevron ${isOpen ? 'open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="lang-menu">
          {languages.map((language) => (
            <button
              key={language.code}
              className={`lang-item ${currentLanguage === language.code ? 'active' : ''}`}
              onClick={() => handleLanguageChange(language.code)}
            >
              <span className="language-native">{language.nativeName}</span>
              <span className="language-english">({language.name})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
