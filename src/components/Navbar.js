import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUserCircle, faStore, faUser, faPhone, faSearch, faTimes, faSignOutAlt, faHeadphones } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { removeToken } from '../services/tokenStorage';
import LanguageSwitcher from './LanguageSwitcher';
import './Navbar.css';

const Navbar = ({
  title,
  onBack,
  showProfile = true,
  userInfo,
  dairyInfo,
  loadingInfo,
  showSearch = false,
  searchTerm = '',
  onSearchChange = () => { },
  onClearSearch = () => { },
  searchPlaceholder = 'Search...',
  pageName = '',
  onSupportClick = () => { }
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const profileDropdownRef = useRef(null);
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Handle logout
  const handleLogout = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    removeToken();
    navigate('/login');
  };

  // Handle window resize to detect mobile screen
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Determine if profile should be shown based on page and screen size
  const shouldShowProfile = () => {
    if (!showProfile) return false;

    // For bulkCollection page, show profile only on mobile
    if (pageName === 'bulkCollection') {
      return isMobile;
    }

    // For proRataCollection page, show profile only on mobile
    if (pageName === 'proRataCollection') {
      return isMobile;
    }

    // For all other pages, show profile as per showProfile prop
    return showProfile;
  };

  // Determine if logout button should be shown based on page and screen size
  const shouldShowLogout = () => {
    // For bulkCollection page, hide logout on mobile
    if (pageName === 'bulkCollection') {
      return !isMobile;
    }

    // For proRataCollection page, hide logout on mobile
    if (pageName === 'proRataCollection') {
      return !isMobile;
    }

    // For all other pages, show logout button
    return true;
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search expansion on mobile
  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };

  // Handle search clear and collapse on mobile
  const handleSearchClear = () => {
    onClearSearch();
    if (window.innerWidth <= 768) {
      setIsSearchExpanded(false);
    }
  };

  // Close search on mobile when clicking outside
  useEffect(() => {
    const handleClickOutsideSearch = (event) => {
      const searchElement = document.querySelector('.navbar-search');
      if (searchElement && !searchElement.contains(event.target) && window.innerWidth <= 768) {
        setIsSearchExpanded(false);
      }
    };

    if (isSearchExpanded) {
      document.addEventListener('mousedown', handleClickOutsideSearch);
      return () => {
        document.removeEventListener('mousedown', handleClickOutsideSearch);
      };
    }
  }, [isSearchExpanded]);

  return (
    <header className="navbar-header">
      <button className="navbar-back-button" onClick={onBack}>
        <FontAwesomeIcon icon={faArrowLeft} />
        <span>{t('backToDashboard')}</span>
      </button>
      <h1 className="navbar-title">{title}</h1>

      {showSearch && (
        <div className="navbar-search">
          {/* Desktop search - always visible */}
          <div className="navbar-search-container navbar-search-desktop">
            <FontAwesomeIcon icon={faSearch} className="navbar-search-icon" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="navbar-search-input"
              value={searchTerm}
              onChange={onSearchChange}
            />
            {searchTerm && (
              <FontAwesomeIcon
                icon={faTimes}
                className="navbar-clear-search-icon"
                onClick={handleSearchClear}
              />
            )}
          </div>

          {/* Mobile search - icon only, expands on click */}
          <div className="navbar-search-mobile">
            {!isSearchExpanded ? (
              <button
                className="navbar-search-toggle"
                onClick={handleSearchToggle}
                aria-label="Open search"
              >
                <FontAwesomeIcon icon={faSearch} className="navbar-search-icon" />
              </button>
            ) : (
              <div className="navbar-search-container navbar-search-expanded">
                <FontAwesomeIcon icon={faSearch} className="navbar-search-icon" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  className="navbar-search-input"
                  value={searchTerm}
                  onChange={onSearchChange}
                  autoFocus
                />
                {searchTerm && (
                  <FontAwesomeIcon
                    icon={faTimes}
                    className="navbar-clear-search-icon"
                    onClick={handleSearchClear}
                  />
                )}
                <button
                  className="navbar-search-close"
                  onClick={() => setIsSearchExpanded(false)}
                  aria-label="Close search"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="navbar-header-actions">
        <LanguageSwitcher />

        {/* Desktop Support Section */}
        <div className="navbar-support-section-desktop">
          <button
            className="navbar-support-btn"
            onClick={onSupportClick}
            aria-label="Support"
          >
            <FontAwesomeIcon icon={faHeadphones} />
            <span className="navbar-support-text">{t('support')}</span>
          </button>
        </div>

        {shouldShowLogout() && (
          <button
            className="navbar-logout-button"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span className="navbar-logout-text">{t('logout')}</span>
          </button>
        )}
        {shouldShowProfile() && (
          <div className="navbar-profile-dropdown" ref={profileDropdownRef}>
            <button
              className="navbar-profile-button"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              aria-label="Profile"
            >
              <FontAwesomeIcon icon={faUserCircle} className="navbar-profile-icon" />
            </button>
            {showProfileDropdown && (
              <div className="navbar-profile-dropdown-menu">
                <div className="navbar-profile-header">
                  <h4>{t('dairyAndOwnerInfo')}</h4>
                </div>
                {loadingInfo ? (
                  <div className="navbar-info-loading">{t('loadingInformation')}</div>
                ) : (
                  <div className="navbar-profile-content">
                    <div className="navbar-info-item">
                      <FontAwesomeIcon icon={faStore} className="navbar-info-icon" />
                      <span className="navbar-info-label">{t('dairyName')}:</span>
                      <span className="navbar-info-value">{dairyInfo?.dairy_name || t('notAvailable')}</span>
                    </div>
                    <div className="navbar-info-item">
                      <FontAwesomeIcon icon={faUser} className="navbar-info-icon" />
                      <span className="navbar-info-label">{t('owner')}:</span>
                      <span className="navbar-info-value">{userInfo?.name || t('notAvailable')}</span>
                    </div>
                    <div className="navbar-info-item">
                      <FontAwesomeIcon icon={faPhone} className="navbar-info-icon" />
                      <span className="navbar-info-label">{t('phone')}:</span>
                      <span className="navbar-info-value">{userInfo?.phone_number || t('notAvailable')}</span>
                    </div>
                  </div>
                )}
                <div className="navbar-profile-actions">
                  <button className="navbar-profile-logout-btn" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faSignOutAlt} />
                    {t('logout')}
                  </button>
                  <button
                    className="rate-settings-contact-btn"
                    onClick={onSupportClick}
                  >
                    <FontAwesomeIcon icon={faHeadphones} /> {t('support')}
                  </button>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
