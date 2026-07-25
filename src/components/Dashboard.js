import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUserInfo, getDairyInfo, getWalletBalance, getCurrentMarketPrice, updateMarketPrice, getFilteredCollections, updateAddedMilkRateCollection, addMoneyToWallet, patchDairyInfo, getProRataRateChart, createProRataRateChart, updateProRataRateChart, getCustomers } from '../services/api';
import { removeToken } from '../services/tokenStorage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSignOutAlt,
  faPlus,
  faListAlt,
  faBoxOpen,
  faStore,
  faUser,
  faPhone,
  faHeadphones,
  faWallet,
  faCheck,
  faExclamationTriangle,
  faSpinner,
  faExclamationCircle,
  faTimes,
  faDollarSign,
  faCog,
  faBars,
  faUserCircle,
  faChevronDown,
  faTag,
  faArrowRight,
  faInfoCircle,
  faGift,
  faStar,
  faHome,
  faMoneyBillWave,
  faChartLine,
  faPlusCircle,
  faTrash,
  faSearch,
  faUserAlt,
  faFilter,
  faCalendarAlt,
  faSync,
  faClock,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';
import './Dashboard.css';
import './PreviewCollections.css';
import StandardReportGenerator from './StandardReportGenerator';
import ProRataReportGenerator from './ProRataReportGenerator';
import LanguageSwitcher from './LanguageSwitcher';
import ConfirmationModal from './ConfirmationModal';
import { useLanguage } from '../contexts/LanguageContext';
import classNames from "classnames";
import AddMoneyModal from './AddMoneyModal';

// Styles for the date filter type toggle
const styles = {
  filterTypeToggle: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '15px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  toggleOption: {
    flex: '1',
    padding: '8px 12px',
    textAlign: 'center',
    cursor: 'pointer',
    position: 'relative'
  },
  toggleInput: {
    position: 'absolute',
    opacity: '0',
    width: '100%',
    height: '100%',
    top: '0',
    left: '0',
    margin: '0',
    cursor: 'pointer'
  },
  activeToggle: {
    backgroundColor: '#4a90e2',
    color: 'white'
  },
  inactiveToggle: {
    backgroundColor: '#f5f5f5',
    color: '#333'
  }
};

const Dashboard = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dairyInfo, setDairyInfo] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [currentRate, setCurrentRate] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [isLoadingRate, setIsLoadingRate] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [isEditingRate, setIsEditingRate] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [customRate, setCustomRate] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [isEditingRateType, setIsEditingRateType] = useState(false);
  const [rateType, setRateType] = useState('fat_snf'); // Default to fat_snf
  // eslint-disable-next-line no-unused-vars
  const [originalRateType, setOriginalRateType] = useState('fat_snf'); // Track original value
  const [submitting, setSubmitting] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [showLowBalanceAlert, setShowLowBalanceAlert] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentSubmitMessage, setCurrentSubmitMessage] = useState('');
  const messageTimeoutRef = useRef(null);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

   // Rate settings modal state
   const [showRateSettingsModal, setShowRateSettingsModal] = useState(false);
   const [baseSNF, setBaseSNF] = useState('9.00');
   const [clrConversionFactor, setClrConversionFactor] = useState('0.14'); // Changed default to match API choices
   const [fatSnfRatio, setFatSnfRatio] = useState('60_40');
   const [animalType, setAnimalType] = useState(localStorage.getItem('default_animal_type') || 'cow');
 
   // Track original values to detect changes
   const [originalRateSettings, setOriginalRateSettings] = useState({
     currentRate: 0,
     rateType: 'fat_snf',
     baseSNF: '9.00',
     clrConversionFactor: '0.14',
     fatSnfRatio: '60_40',
     animalType: 'cow'
   });

  // Track if any changes have been made
  const [hasRateSettingsChanges, setHasRateSettingsChanges] = useState(false);

  // Loading state for save operation
  const [isSavingRateSettings, setIsSavingRateSettings] = useState(false);

  // Success notification state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState({
    title: '',
    message: '',
    fieldValue: '',
    description: '',
    fieldToChange: '',
    newValue: ''
  });

  // Function to check if rate settings have changed
  const checkRateSettingsChanges = useCallback(() => {
    const hasChanges = (
      currentRate !== originalRateSettings.currentRate ||
      rateType !== originalRateSettings.rateType ||
      baseSNF !== originalRateSettings.baseSNF ||
      clrConversionFactor !== originalRateSettings.clrConversionFactor ||
      fatSnfRatio !== originalRateSettings.fatSnfRatio ||
      animalType !== originalRateSettings.animalType
    );
    setHasRateSettingsChanges(hasChanges);
  }, [currentRate, rateType, baseSNF, clrConversionFactor, fatSnfRatio, animalType, originalRateSettings]);

  // Confirmation modal handlers
  const showConfirmation = (title, message, fieldValue, description, fieldToChange, newValue) => {
    setConfirmationData({
      title,
      message,
      fieldValue,
      description,
      fieldToChange,
      newValue
    });
    setShowConfirmationModal(true);
  };

  const handleConfirmationClose = () => {
    setShowConfirmationModal(false);
    setConfirmationData({
      title: '',
      message: '',
      fieldValue: '',
      description: '',
      fieldToChange: '',
      newValue: ''
    });
  };

  const handleConfirmationConfirm = () => {
    // Apply the change based on fieldToChange
    switch (confirmationData.fieldToChange) {
      case 'rateType':
        setRateType(confirmationData.newValue);
        break;
      case 'baseSNF':
        setBaseSNF(confirmationData.newValue);
        break;
      case 'fatSnfRatio':
        setFatSnfRatio(confirmationData.newValue);
        break;
      case 'clrConversionFactor':
        setClrConversionFactor(confirmationData.newValue);
        break;
      default:
        break;
    }
    handleConfirmationClose();
  };

  // Function to open rate settings modal and capture original values
  const openRateSettingsModal = useCallback(() => {
    const currentDefaultAnimal = localStorage.getItem('default_animal_type') || 'cow';
    setAnimalType(currentDefaultAnimal);
    setOriginalRateSettings({
      currentRate: currentRate || 0,
      rateType: rateType,
      baseSNF: baseSNF,
      clrConversionFactor: clrConversionFactor,
      fatSnfRatio: fatSnfRatio,
      animalType: currentDefaultAnimal
    });
    setHasRateSettingsChanges(false);
    setShowRateSettingsModal(true);
  }, [currentRate, rateType, baseSNF, clrConversionFactor, fatSnfRatio]);

  // Function to save individual milk rate
  const saveIndividualMilkRate = async () => {
    const parsedRate = parseFloat(currentRate);
    if (!isNaN(parsedRate) && parsedRate >= 0) {
      try {
        setSubmitting(true);
        console.log('Saving individual milk rate:', parsedRate);

        // Call API to update the rate in the backend
        await updateMarketPrice(parsedRate);

        console.log('Individual milk rate saved successfully:', parsedRate);

        // Show success message
        setCurrentSubmitMessage(t('milkRateUpdatedSuccessfully'));
        setSubmitSuccess(true);
        messageTimeoutRef.current = setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);

        // Exit editing mode
        setIsEditingRate(false);
      } catch (error) {
        console.error('Error updating milk rate:', error);
        // Revert to the previous rate
        setCurrentRate(currentRate);
        setCurrentSubmitMessage(t('errorSavingMilkRate'));
        setSubmitSuccess(true);
        messageTimeoutRef.current = setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      } finally {
        setSubmitting(false);
      }
    } else {
      // If invalid, exit editing mode
      setIsEditingRate(false);
    }
  };

  // Function to save rate settings to backend
  const saveRateSettings = async () => {
    if (!dairyInfo?.id) {
      console.error('Dairy info ID not available');
      return;
    }

    setIsSavingRateSettings(true);

    // Check if milk rate has changed - declare outside try block for use in catch
    const milkRateChanged = currentRate !== originalRateSettings.currentRate;

    try {
      // Debug: Log current dairy info CLR conversion factor
      console.log('Current dairy info clr_conversion_factor:', dairyInfo?.clr_conversion_factor);
      console.log('Attempting to save clr_conversion_factor:', clrConversionFactor);

      // Save milk rate first if it has changed
      if (milkRateChanged && currentRate !== null && currentRate !== undefined) {
        console.log('Saving milk rate:', currentRate);
        await updateMarketPrice(currentRate);
        console.log('Milk rate saved successfully:', currentRate);

        // Update local state to reflect the saved rate
        setCurrentRate(currentRate);
        setCustomRate(currentRate.toString());
      }

      // Prepare data for API - normalize values to expected formats
      const dairyData = {
        dairy_name: dairyInfo?.dairy_name || '', // Include dairy_name to satisfy API validation
        rate_type: rateType,
        base_snf: baseSNF === '9.00' ? '9.0' : '8.5', // Send as string in API expected format
        fat_snf_ratio: fatSnfRatio.replace('_', '/'), // Convert 60_40 to 60/40 for API
        clr_conversion_factor: clrConversionFactor === '0.14' ? '0.14' : '0.50', // Send as string in API expected format
      };

      console.log('Sending dairy data:', dairyData);

      // Call API to update dairy information
      await patchDairyInfo(dairyInfo.id, dairyData);
      console.log('Rate settings updated successfully:', { rateType, baseSNF, clrConversionFactor, fatSnfRatio });

      // Refresh dairy info after update
      const updatedDairyInfo = await getDairyInfo();
      console.log('Updated dairy info from backend:', updatedDairyInfo);
      setDairyInfo(updatedDairyInfo);

      // Update local state with the refreshed values from backend
      if (updatedDairyInfo) {
        if (updatedDairyInfo.base_snf) {
          console.log('Updating baseSNF from backend:', updatedDairyInfo.base_snf);
          // Format base_snf to match API expected values (8.50 or 9.00)
          const baseSnfValue = parseFloat(updatedDairyInfo.base_snf);
          setBaseSNF(baseSnfValue === 8.5 ? '8.50' : '9.00');
        }
        if (updatedDairyInfo.clr_conversion_factor) {
          console.log('Updating clrConversionFactor from backend:', updatedDairyInfo.clr_conversion_factor);
          setClrConversionFactor(updatedDairyInfo.clr_conversion_factor.toString());
        }
        if (updatedDairyInfo.fat_snf_ratio) {
          console.log('Updating fatSnfRatio from backend:', updatedDairyInfo.fat_snf_ratio);
          setFatSnfRatio(updatedDairyInfo.fat_snf_ratio.replace('/', '_'));
        }
      }

      // Save animal type to localStorage
      localStorage.setItem('default_animal_type', animalType);

      // Update original values to reflect current state
      setOriginalRateSettings({
        currentRate: currentRate || 0,
        rateType: rateType,
        baseSNF: baseSNF,
        clrConversionFactor: clrConversionFactor,
        fatSnfRatio: fatSnfRatio,
        animalType: animalType
      });
      setHasRateSettingsChanges(false);

      // Close modal
      setShowRateSettingsModal(false);

      // Show success message
      let successMessage = t('rateSettingsSavedSuccessfully');
      if (milkRateChanged) {
        successMessage = t('milkRateAndRateSettingsSavedSuccessfully').replace('{currentRate}', currentRate);
      }
      console.log('Final success message:', successMessage);
      setSuccessMessage(successMessage);
      setShowSuccessMessage(true);

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);

      console.log('Rate settings saved successfully');
    } catch (error) {
      console.error('Error saving rate settings:', error);
      if (milkRateChanged) {
        console.error('Failed to save milk rate:', currentRate);
      }

      // Show error message
      let errorMessage = t('errorSavingRateSettings');
      if (milkRateChanged) {
        errorMessage = t('errorSavingMilkRateAndRateSettings');
      }
      setSuccessMessage(errorMessage);
      setShowSuccessMessage(true);

      // Auto-hide error message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    } finally {
      setIsSavingRateSettings(false);
    }
  };

  // Update change detection when any rate setting changes
  useEffect(() => {
    if (showRateSettingsModal) {
      checkRateSettingsChanges();
    }
  }, [currentRate, rateType, baseSNF, clrConversionFactor, fatSnfRatio, animalType, showRateSettingsModal, checkRateSettingsChanges]);

  // Milk rate functionality state
  const [showMilkRateModal, setShowMilkRateModal] = useState(false);
  const [showMilkRatePreviewModal, setShowMilkRatePreviewModal] = useState(false);
  const [milkRateFromDate, setMilkRateFromDate] = useState('');
  const [milkRateToDate, setMilkRateToDate] = useState('');
  const [milkRateSingleDateFilterMode, setMilkRateSingleDateFilterMode] = useState(false);
  const [milkRateSingleDate, setMilkRateSingleDate] = useState('');
  const [currentMilkRate, setCurrentMilkRate] = useState({ milk_rate: 50 });
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [originalCollections, setOriginalCollections] = useState([]); // Store original values
  const [isLoadingRatePreview, setIsLoadingRatePreview] = useState(false);
  const [isSubmittingRates, setIsSubmittingRates] = useState(false);
  const [ratePreviewError, setRatePreviewError] = useState(null);

  // Animal filter state for modal
  const [modalAnimalFilter, setModalAnimalFilter] = useState('all'); // 'all', 'cow', 'buffalo', 'cow_buffalo'

  // Bulk editing state for all collection fields
  const [bulkEditFields, setBulkEditFields] = useState({
    milk_rate: '',
    fat_percent: '',
    snf_percent: '',
    clr: '',
    base_snf: '',
    fat_snf_ratio: 'Select',
    clr_conversion: 'Select',
    milk_type: 'Select',
    rate_chart: false
  });
  const [activeBulkFields, setActiveBulkFields] = useState({
    milk_rate: false,
    fat_percent: false,
    snf_percent: false,
    clr: false,
    base_snf: false,
    fat_snf_ratio: false,
    clr_conversion: false,
    milk_type: false,
    rate_chart: false
  });

  // Bulk rate collection type selector state
  const [showBulkRateSelector, setShowBulkRateSelector] = useState(false);

  // Customer filter state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCollectionType, setSelectedCollectionType] = useState(null);

  // Rate chart modal state
  const [showRateChartModal, setShowRateChartModal] = useState(false);
  const [rateChartId, setRateChartId] = useState(null);
  const [savingRateChart, setSavingRateChart] = useState(false);
  const [fatStepUpRates, setFatStepUpRates] = useState([{ step: '', rate: '' }]);
  const [snfStepDownRates, setSnfStepDownRates] = useState([{ step: '', rate: '' }]);

  // Collection-specific rate chart state for bulk edit
  const [collectionFatStepUpRates, setCollectionFatStepUpRates] = useState([{ step: '', rate: '' }]);
  const [collectionSnfStepDownRates, setCollectionSnfStepDownRates] = useState([{ step: '', rate: '' }]);

  // Bulk Apply Confirmation Modal State
  const [showBulkApplyConfirmation, setShowBulkApplyConfirmation] = useState(false);


  const navigate = useNavigate();

  const handleLogout = useCallback((e) => {
    // Prevent event propagation to avoid dropdown closing before logout
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    console.log('Logout button clicked'); // Debug log
    // Remove token and redirect to login
    removeToken();
    navigate('/login');
  }, [navigate]);

  // Alternative logout handler for desktop
  const handleDesktopLogout = useCallback((e) => {
    console.log('Desktop logout button clicked'); // Debug log
    e.stopPropagation();
    e.preventDefault();
    // Close dropdown first
    setIsProfileDropdownOpen(false);
    // Then logout after a small delay to ensure dropdown closes
    setTimeout(() => {
      removeToken();
      navigate('/login');
    }, 100);
  }, [navigate]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleCloseMessage = () => {
    setSubmitSuccess(false);
    setCurrentSubmitMessage('');
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the profile dropdown
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        // Also check if the clicked element is not the logout button
        const clickedElement = event.target;
        if (!clickedElement.closest('.profile-logout-btn')) {
          setIsProfileDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Fetch user info when component mounts
    const fetchUserInfo = async () => {
      try {
        const response = await getUserInfo();
        setUser(response);
      } catch (error) {
        console.error('Error fetching user info:', error);
        // If there's an error fetching user info, logout
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [handleLogout]);

  // Fetch dairy information, wallet balance, and current rate
  useEffect(() => {
    const fetchDairyAndRateInfo = async () => {
      try {
        setLoadingInfo(true);

        // Fetch dairy information
        const dairyResponse = await getDairyInfo();
        setDairyInfo(dairyResponse);

        // Set the rate type from dairy info if available
        if (dairyResponse && dairyResponse.rate_type) {
          console.log('Setting rate type from dairy info:', dairyResponse.rate_type);
          setRateType(dairyResponse.rate_type);
          setOriginalRateType(dairyResponse.rate_type);
        } else {
          console.log('No rate type in dairy info, using default: fat_snf');
          // If no rate type in dairy info, set both to the same default value
          // but ensure the change detection works
          setRateType('fat_snf');
          setOriginalRateType('fat_snf');
        }

        // Set base SNF from dairy info if available
        if (dairyResponse && dairyResponse.base_snf) {
          console.log('Setting base SNF from dairy info:', dairyResponse.base_snf);
          // Format base_snf to match API expected values (8.50 or 9.00)
          const baseSnfValue = parseFloat(dairyResponse.base_snf);
          setBaseSNF(baseSnfValue === 8.5 ? '8.50' : '9.00');
        } else {
          console.log('No base SNF in dairy info, using default: 9.00');
          setBaseSNF('9.00');
        }

        // Set CLR conversion factor from dairy info if available
        if (dairyResponse && dairyResponse.clr_conversion_factor) {
          console.log('Setting CLR conversion factor from dairy info:', dairyResponse.clr_conversion_factor);
          setClrConversionFactor(dairyResponse.clr_conversion_factor.toString());
        } else {
          console.log('No CLR conversion factor in dairy info, using default: 0.14');
          setClrConversionFactor('0.14');
        }

        // Set fat/SNF ratio from dairy info if available
        if (dairyResponse && dairyResponse.fat_snf_ratio) {
          console.log('Setting fat/SNF ratio from dairy info:', dairyResponse.fat_snf_ratio);
          // Convert 60/40 to 60_40 for internal state
          const ratioValue = dairyResponse.fat_snf_ratio.replace('/', '_');
          setFatSnfRatio(ratioValue);
        } else {
          console.log('No fat/SNF ratio in dairy info, using default: 60_40');
          setFatSnfRatio('60_40');
        }

        // Fetch wallet balance
        try {
          const walletResponse = await getWalletBalance();
          console.log('Wallet API response:', walletResponse);

          let balance = null;

          // Check different possible properties for balance
          if (walletResponse && walletResponse.balance !== undefined) {
            balance = walletResponse.balance;
          } else if (walletResponse && walletResponse.amount !== undefined) {
            balance = walletResponse.amount;
          } else if (walletResponse && typeof walletResponse === 'number') {
            // In case the response is just the balance as a number
            balance = walletResponse;
          } else if (walletResponse && typeof walletResponse === 'object') {
            // Log all available properties
            console.log('Available wallet properties:', Object.keys(walletResponse));
            // Try to find a property that might contain the balance
            const possibleBalanceKeys = ['balance', 'amount', 'wallet_balance', 'value', 'total'];
            for (const key of possibleBalanceKeys) {
              if (walletResponse[key] !== undefined) {
                console.log(`Found balance in property: ${key} with value: ${walletResponse[key]}`);
                balance = walletResponse[key];
                break;
              }
            }
          }

          setWalletBalance(balance);

          // Check if balance is below threshold (50 rupees)
          if (balance !== null && balance !== undefined && parseFloat(balance) < 50) {
            setShowLowBalanceAlert(true);
          }
        } catch (error) {
          console.error('Error fetching wallet balance:', error);
        }

        // Fetch current market price
        try {
          setIsLoadingRate(true);
          const response = await getCurrentMarketPrice();
          if (response && response.price) {
            setCurrentRate(response.price);
            setCustomRate(response.price.toString()); // Initialize custom rate with current rate
          }
        } catch (error) {
          setCurrentRate(0);
          setCustomRate('0');
          console.error('Error fetching current rate:', error);
        } finally {
          setIsLoadingRate(false);
        }
      } catch (error) {
        console.error('Error fetching dairy information or wallet balance:', error);
      } finally {
        setLoadingInfo(false);
      }
    };

    fetchDairyAndRateInfo();
  }, []);

  // Watch for modal filter changes and refetch data when modal is open
  useEffect(() => {
    if (showMilkRatePreviewModal && !isLoadingRatePreview) {
      // Debounce the refetch to avoid rapid successive calls
      const timer = setTimeout(() => {
        handlePreviewMilkRates({
          customer: selectedCustomer,
          animalFilter: modalAnimalFilter,
          collectionType: selectedCollectionType
        });
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalAnimalFilter, selectedCustomer, showMilkRatePreviewModal, selectedCollectionType]);

  // Handle rate edit toggle


  // Utility functions for milk rate functionality
  const formatDateForInput = (date) => {
    const d = new Date(date);
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateString) => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const formatNumber = (number) => {
    if (number === undefined || number === null) return 'N/A';
    return Number(number).toFixed(2);
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'N/A';
    return `₹${Number(amount).toFixed(2)}`;
  };

  const formatDate = (dateString, time) => {
    if (!dateString) return 'N/A';
    const dateObj = new Date(dateString);
    const formattedDate = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
    let timeIndicator;
    if (time === 'morning' || (time && time.startsWith('06'))) {
      timeIndicator = 'AM';
    } else {
      timeIndicator = 'PM';
    }
    return `${formattedDate} (${timeIndicator})`;
  };

  // Milk rate modal functions
  const openMilkRateModal = () => {
    const today = new Date();
    if (!milkRateFromDate) {
      const defaultFromDate = new Date();
      defaultFromDate.setDate(defaultFromDate.getDate() - 7);
      setMilkRateFromDate(formatDateForInput(defaultFromDate));
    }
    if (!milkRateToDate) {
      setMilkRateToDate(formatDateForInput(today));
    }
    if (!milkRateSingleDate) {
      setMilkRateSingleDate(formatDateForInput(today));
    }
    setShowMilkRateModal(true);
  };

  const handlePreviewMilkRates = async (options = {}) => {
    const {
      customer = selectedCustomer,
      animalFilter = modalAnimalFilter,
      collectionType = selectedCollectionType
    } = options;

    setRatePreviewError(null);

    if (!currentMilkRate.milk_rate) {
      setRatePreviewError(t('pleaseEnterAValidMilkRate'));
      return;
    }

    if (milkRateSingleDateFilterMode) {
      if (!milkRateSingleDate) {
        setRatePreviewError(t('pleaseSelectADate'));
        return;
      }
    } else {
      if (!milkRateFromDate || !milkRateToDate) {
        setRatePreviewError(t('pleaseSelectBothFromAndToDates'));
        return;
      }
      if (new Date(milkRateToDate) < new Date(milkRateFromDate)) {
        setRatePreviewError(t('toDateCannotBeEarlierThanFromDate'));
        return;
      }
    }

    try {
      setIsLoadingRatePreview(true);
      setRatePreviewError(null);

      let params = {
        dateFrom: milkRateSingleDateFilterMode ? milkRateSingleDate : milkRateFromDate,
        dateTo: milkRateSingleDateFilterMode ? milkRateSingleDate : milkRateToDate
      };

      // Add customer filter if active (use passed param or state)
      const customerToUse = customer !== undefined ? customer : selectedCustomer;
      if (customerToUse) {
        params.customerId = customerToUse.id;
      }

      // Add animal filter if active (use passed param or state)
      if (animalFilter && animalFilter !== 'all') {
        params.milkType = animalFilter;
      }

      // Add collection type filter if selected
      const collectionTypeToUse = collectionType !== undefined ? collectionType : selectedCollectionType;
      if (collectionTypeToUse) {
        params.isProRata = collectionTypeToUse === 'prorata';
        params.pro_rata = collectionTypeToUse === 'prorata';
        params.collection_type = collectionTypeToUse;
        console.log('Collection type filter applied:', collectionTypeToUse, 'isProRata:', params.isProRata);
      }

      console.log('API call params:', params);
      const response = await getFilteredCollections(params);
      console.log('API response:', response);

      // Log collection types in response
      if (response && response.results) {
        console.log('Collections in response:');
        response.results.forEach((collection, index) => {
          console.log(`Collection ${index + 1}:`, {
            id: collection.id,
            name: collection.customer_name,
            is_pro_rata: collection.is_pro_rata,
            pro_rata: collection.pro_rata,
            collection_type: collection.collection_type
          });
        });

        // Apply client-side filtering if backend doesn't filter properly
        let filteredCollections = response.results;
        if (selectedCollectionType) {
          const shouldBeProRata = selectedCollectionType === 'prorata';
          filteredCollections = response.results.filter(collection => {
            const isProRata = collection.is_pro_rata === true;
            console.log(`Filtering collection ${collection.id}: is_pro_rata=${isProRata}, shouldBeProRata=${shouldBeProRata}`);
            return isProRata === shouldBeProRata;
          });
          console.log(`Filtered ${response.results.length} collections down to ${filteredCollections.length} for type: ${selectedCollectionType}`);
        }

        // Update response with filtered collections
        response.results = filteredCollections;
      }

      if (response && response.results) {
        // Calculate derived values for each collection to ensure correct amounts are displayed
        const processedCollections = response.results.map(collection => {
          const derived = calculateInitialDerivedValues(collection);
          return {
            ...collection,
            fat_kg: derived.fat_kg,
            snf_kg: derived.snf_kg,
            fat_rate: derived.fat_rate,
            snf_rate: derived.snf_rate,
            amount: derived.amount,
            solid_weight: derived.solid_weight
          };
        });
        setSelectedCollections(processedCollections);
        setOriginalCollections(JSON.parse(JSON.stringify(processedCollections))); // Deep copy original values
        setShowMilkRatePreviewModal(true);
        setShowMilkRateModal(false);
      } else {
        setRatePreviewError(t('noCollectionsFoundForSelectedDateRangeAndCollectionType'));
      }
    } catch (err) {
      console.error('Error fetching collections for milk rate preview:', err);
      setRatePreviewError(t('failedToLoadCollectionsForPreview'));
    } finally {
      setIsLoadingRatePreview(false);
    }
  };

  const handleMilkRateChange = (value) => {
    if (value === '') {
      setCurrentMilkRate({ milk_rate: '' });
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return;
    }

    setCurrentMilkRate({ milk_rate: numValue });

    const updatedCollections = selectedCollections.map(collection => {
      const updatedCollection = {
        ...collection,
        milk_rate: numValue
      };

      const fatKg = Math.floor((updatedCollection.kg * (updatedCollection.fat_percentage / 100)) * 100) / 100;
      const snfKg = Math.floor((updatedCollection.kg * (updatedCollection.snf_percentage / 100)) * 100) / 100;

      // Use dynamic fat/snf ratio
      const { fatRatio, snfRatio } = getFatSnfRatio();
      const fatRate = Math.floor((numValue * fatRatio / 6.5) * 100) / 100;
      const snfRate = Math.floor((numValue * snfRatio / updatedCollection.base_snf_percentage) * 100) / 100;

      const fatAmount = Math.floor(parseFloat(fatKg) * parseFloat(fatRate) * 100) / 100;
      const snfAmount = Math.floor(parseFloat(snfKg) * parseFloat(snfRate) * 100) / 100;
      const amount = parseFloat((fatAmount + snfAmount).toFixed(2));
      const solidWeight = parseFloat((amount / numValue).toFixed(3));

      return {
        ...updatedCollection,
        fat_kg: fatKg,
        snf_kg: snfKg,
        fat_rate: fatRate,
        snf_rate: snfRate,
        amount: amount,
        solid_weight: solidWeight
      };
    });

    setSelectedCollections(updatedCollections);
  };

  // Helper functions for ratio and conversion calculations
  const getFatSnfRatio = () => {
    // Only use bulk edit value if checkbox is active
    let ratio = '60/40';
    if (activeBulkFields.fat_snf_ratio && bulkEditFields.fat_snf_ratio && bulkEditFields.fat_snf_ratio !== 'Select') {
      ratio = bulkEditFields.fat_snf_ratio;
    }
    const [fatRatio, snfRatio] = ratio.split('/').map(Number);
    return { fatRatio, snfRatio };
  };

  // SNF Auto-Calculation (when CLR or Fat changes) - APK Logic
  const calculateSnfFromClr = (clrValue, fatValue, conversionFactor = 0.14) => {
    const clr = parseFloat(clrValue);
    const fat = parseFloat(fatValue);
    const factor = parseFloat(conversionFactor) || 0.14;
    const calculatedSnf = Math.floor(((clr / 4) + (fat * 0.20) + factor) * 100) / 100;
    return calculatedSnf;
  };

  // Helper to calculate derived values for initial collection load
  const calculateInitialDerivedValues = (collection) => {
    const fat = parseFloat(collection.fat_percentage) || 0;
    const snf = parseFloat(collection.snf_percentage) || 0;
    const weight = parseFloat(collection.kg) || 0;
    const rate = parseFloat(collection.milk_rate) || currentMilkRate?.milk_rate || 0;
    const baseSnf = parseFloat(collection.base_snf_percentage) || parseFloat(collection.base_snf) || 9.00;
    const fatSnfRatio = collection.fat_snf_ratio || '60/40';

    // Calculate fat_kg and snf_kg
    const fatKg = Math.floor((weight * (fat / 100)) * 100) / 100;
    const snfKg = Math.floor((weight * (snf / 100)) * 100) / 100;

    // Get fat/SNF ratio percentages
    const fatRatioPercent = fatSnfRatio === '52/48' ? 52 : 60;
    const snfRatioPercent = fatSnfRatio === '52/48' ? 48 : 40;

    // Calculate component rates
    const fatRate = Math.floor((rate * fatRatioPercent / 6.5) * 100) / 100;
    const snfRate = Math.floor((rate * snfRatioPercent / baseSnf) * 100) / 100;

    // Calculate amount
    const fatAmount = parseFloat(fatKg) * parseFloat(fatRate);
    const snfAmount = parseFloat(snfKg) * parseFloat(snfRate);
    const amount = Math.round((fatAmount + snfAmount) * 100) / 100;

    // Calculate solid weight
    const solidWeight = rate > 0 ? parseFloat((amount / rate).toFixed(3)) : 0;

    return {
      fat_kg: fatKg,
      snf_kg: snfKg,
      fat_rate: fatRate,
      snf_rate: snfRate,
      amount: amount,
      solid_weight: solidWeight
    };
  };
  const getCollectionMethod = (collection) => {
    const hasClr = collection.clr && parseFloat(collection.clr) > 0;
    const hasFat = collection.fat_percentage && parseFloat(collection.fat_percentage) > 0;
    const hasSnf = collection.snf_percentage && parseFloat(collection.snf_percentage) > 0;

    if (hasClr && hasFat) {
      return 'clr_based';
    } else if (hasFat && hasSnf) {
      return 'snf_based';
    }
    return 'unknown';
  };

  // Fat step-up: Find highest threshold that fat >= threshold
  const resolveRateFromFatThresholds = (fatPercent, thresholds) => {
    const sortedThresholds = [...thresholds].sort((a, b) =>
      parseFloat(b.step) - parseFloat(a.step));
    for (const threshold of sortedThresholds) {
      if (fatPercent >= parseFloat(threshold.step)) {
        return parseFloat(threshold.rate) || 0;
      }
    }
    return 0;
  };

  // SNF step-down: Find highest threshold that snf < threshold
  const resolveRateFromSnfThresholds = (snfPercent, thresholds) => {
    const sortedThresholds = [...thresholds].sort((a, b) =>
      parseFloat(a.step) - parseFloat(b.step));
    for (const threshold of sortedThresholds) {
      if (snfPercent < parseFloat(threshold.step)) {
        return Math.abs(parseFloat(threshold.rate) || 0);
      }
    }
    return 0;
  };

  const getClrConversion = () => {
    // Only use bulk edit value if checkbox is active
    if (activeBulkFields.clr_conversion && bulkEditFields.clr_conversion && bulkEditFields.clr_conversion !== 'Select') {
      return parseFloat(bulkEditFields.clr_conversion);
    }
    return 0.14;
  };

  // Real-time calculation helper for display - APK Logic
  const getRealTimeCalculations = (collection, shouldRecalculate = false) => {
    const weightKg = parseFloat(collection.kg) || 0;
    const fatPercentage = parseFloat(collection.fat_percentage) || 0;
    const clr = parseFloat(collection.clr) || 0;
    const milkRate = parseFloat(collection.milk_rate) || 0;
    const baseSnfPercentage = parseFloat(collection.base_snf_percentage || collection.base_snf) || 9.0;

    // Get CLR conversion factor - prioritize bulk edit if checkbox is active
    let clrConversionFactor;
    console.log('getRealTimeCalculations - activeBulkFields.clr_conversion:', activeBulkFields.clr_conversion);
    console.log('getRealTimeCalculations - bulkEditFields.clr_conversion:', bulkEditFields.clr_conversion);
    console.log('getRealTimeCalculations - collection.clr_conversion:', collection.clr_conversion);
    console.log('getRealTimeCalculations - collection.clr_conversion_factor:', collection.clr_conversion_factor);

    if (activeBulkFields.clr_conversion && bulkEditFields.clr_conversion && bulkEditFields.clr_conversion !== 'Select') {
      clrConversionFactor = parseFloat(bulkEditFields.clr_conversion);
      console.log('Using bulkEditFields.clr_conversion:', clrConversionFactor);
    } else {
      // Use the collection's actual CLR conversion factor, don't hardcode fallback
      if (collection.clr_conversion && collection.clr_conversion !== 'Select') {
        clrConversionFactor = parseFloat(collection.clr_conversion);
        console.log('Using collection.clr_conversion:', clrConversionFactor);
      } else if (collection.clr_conversion_factor) {
        clrConversionFactor = parseFloat(collection.clr_conversion_factor);
        console.log('Using collection.clr_conversion_factor:', clrConversionFactor);
      } else {
        // Only use 0.14 as absolute last resort if no CLR conversion data exists
        clrConversionFactor = 0.14;
        console.log('Using default 0.14');
      }
    }

    // Calculate SNF from CLR if CLR is provided, otherwise use SNF percentage directly
    let snfPercentage;
    if (clr > 0) {
      // SNF calculation formula: ((CLR/4) + (Fat×0.20) + ConversionFactor)
      // Use the appropriate conversion factor based on checkbox state
      snfPercentage = Math.floor(((clr / 4) + (fatPercentage * 0.20) + clrConversionFactor) * 100) / 100;
    } else {
      snfPercentage = parseFloat(collection.snf_percentage) || 0;
    }

    // Get fat/SNF ratio - prioritize bulk edit if checkbox is active
    let fatRatioPercent, snfRatioPercent;
    if (activeBulkFields.fat_snf_ratio && bulkEditFields.fat_snf_ratio && bulkEditFields.fat_snf_ratio !== 'Select') {
      // Use bulk edit value
      fatRatioPercent = bulkEditFields.fat_snf_ratio === '60/40' ? 60 : 52;
      snfRatioPercent = bulkEditFields.fat_snf_ratio === '60/40' ? 40 : 48;
    } else {
      // Use collection value
      const collectionFatSnfRatio = collection.fat_snf_ratio || '60/40';
      fatRatioPercent = collectionFatSnfRatio === '60_40' || collectionFatSnfRatio === '60/40' ? 60 : 52;
      snfRatioPercent = collectionFatSnfRatio === '60_40' || collectionFatSnfRatio === '60/40' ? 40 : 48;
    }

    // Calculate fat_kg and snf_kg
    const fatKg = Math.floor((weightKg * (fatPercentage / 100)) * 100) / 100;
    const snfKg = Math.floor((weightKg * (snfPercentage / 100)) * 100) / 100;

    // Calculate component rates
    const fatRate = Math.floor((milkRate * fatRatioPercent / 6.5) * 100) / 100;
    const snfRate = Math.floor((milkRate * snfRatioPercent / baseSnfPercentage) * 100) / 100;

    // Determine effective rate chart
    const collectionRateChart = collection.pro_rata_collection_rate_chart;
    let effectiveFatStepUpRates = fatStepUpRates;
    let effectiveSnfStepDownRates = snfStepDownRates;

    if (collectionRateChart) {
      effectiveFatStepUpRates = collectionRateChart.fat_step_up_rates || [];
      effectiveSnfStepDownRates = collectionRateChart.snf_step_down_rates || [];
    }

    // Check Pro-Rata applicability - APK Logic
    const isProRata = Array.isArray(effectiveFatStepUpRates) && effectiveFatStepUpRates.some((t) => {
      const threshold = parseFloat(t?.step || t?.threshold);
      const rate = parseFloat(t?.rate);
      return !isNaN(threshold) && !isNaN(rate) && !isNaN(fatPercentage) && fatPercentage >= threshold;
    });

    // Calculate amount
    let amount = 0;
    let finalRate = milkRate;

    if (isProRata) {
      if (shouldRecalculate) {
        // User modified fields - recalculate using pro-rata formula (same as ProRataCollection.js)
        const appliedFatRate = resolveRateFromFatThresholds(fatPercentage, effectiveFatStepUpRates);
        const appliedSnfRate = resolveRateFromSnfThresholds(snfPercentage, effectiveSnfStepDownRates);
        const fatStepUpRateValue = (parseFloat(appliedFatRate) * 10) || 0;
        const snfStepDownRateValue = (Math.abs(parseFloat(appliedSnfRate)) * 10) || 0;

        const fatAdjustment = (fatPercentage - 6.5) * fatStepUpRateValue;
        const snfAdjustment = (snfPercentage - baseSnfPercentage) * snfStepDownRateValue;

        finalRate = milkRate + fatAdjustment + snfAdjustment;
        amount = parseFloat((finalRate * weightKg).toFixed(2));

        console.log('🔍 Pro-Rata Recalculation (Fields Modified):');
        console.log('Applied Fat Rate:', appliedFatRate, 'Applied SNF Rate:', appliedSnfRate);
        console.log('Fat Step Up Rate Value:', fatStepUpRateValue, 'SNF Step Down Rate Value:', snfStepDownRateValue);
        console.log('Fat Adjustment:', fatAdjustment, 'SNF Adjustment:', snfAdjustment);
        console.log('Final Rate:', finalRate);
        console.log('Final Amount:', amount);
      } else {
        // No modifications - use API-calculated values directly
        amount = parseFloat(collection.amount) || 0;
        finalRate = weightKg > 0 ? parseFloat((amount / weightKg).toFixed(2)) : 0;

        console.log('🔍 Using API Calculated Values (No Modifications):');
        console.log('API Amount:', collection.amount);
        console.log('Calculated Final Rate:', finalRate);
      }
    } else {
      // Standard calculation
      const fatAmount = parseFloat(fatKg) * parseFloat(fatRate);
      const snfAmount = parseFloat(snfKg) * parseFloat(snfRate);
      amount = Math.round((fatAmount + snfAmount) * 100) / 100;
    }

    return {
      fat_kg: fatKg,
      snf_kg: snfKg,
      fat_rate: fatRate,
      snf_rate: snfRate,
      amount: amount,
      finalRate: finalRate,
      solid_weight: weightKg > 0 && milkRate > 0 ? (amount / milkRate).toFixed(3) : '0.000',
      is_pro_rata: isProRata,
      calculated_snf_percentage: snfPercentage
    };
  };

  // Handle bulk field changes
  const handleBulkFieldChange = (field, value) => {
    setBulkEditFields(prev => ({
      ...prev,
      [field]: value
    }));

    // Activate the field if it's not already active and has a value
    if (!activeBulkFields[field] && value && value !== 'Select') {
      setActiveBulkFields(prev => ({
        ...prev,
        [field]: true
      }));
    }

    // Only update collections when the field is active and has a valid value
    // This prevents applying changes when checkbox is not checked
    if (activeBulkFields[field] && value && value !== 'Select') {
      updateCollectionsWithFieldChange(field, value);
    }
  };

  // Update collections with field changes (extracted for reuse)
  const updateCollectionsWithFieldChange = (field, value) => {
    // Update selected collections with new value
    const updatedCollections = selectedCollections.map(collection => {
      let updatedCollection = { ...collection };

      // Always update the field for real-time preview (regardless of active state)
      // Update the specific field with correct field names
      if (field === 'fat_percent') {
        updatedCollection.fat_percentage = parseFloat(value) || 0;
      } else if (field === 'snf_percent') {
        updatedCollection.snf_percentage = parseFloat(value) || 0;
      } else if (field === 'base_snf' && value) {
        // Store original before changing
        if (!updatedCollection._originalBaseSnf) {
          updatedCollection._originalBaseSnf = updatedCollection.base_snf_percentage;
        }
        updatedCollection.base_snf = value;
        updatedCollection.base_snf_percentage = parseFloat(value) || 0;
      } else if (field === 'milk_rate' && value) {
        // Store original before changing
        if (!updatedCollection._originalMilkRate) {
          updatedCollection._originalMilkRate = updatedCollection.milk_rate;
        }
        updatedCollection.milk_rate = parseFloat(value) || 0;
      } else if (field === 'fat_snf_ratio' && value && value !== 'Select') {
        // Only apply Fat/SNF Ratio to SNF-based collections (Fat + SNF, not CLR-based)
        const collectionMethod = getCollectionMethod(updatedCollection);
        if (collectionMethod === 'snf_based') {
          // Store original before changing
          if (!updatedCollection._originalFatSnfRatio) {
            updatedCollection._originalFatSnfRatio = updatedCollection.fat_snf_ratio;
          }
          updatedCollection.fat_snf_ratio = value;
        }
      } else if (field === 'fat_snf_ratio' && (value === 'Select' || !value)) {
        // Restore original when 'Select' is chosen (only for SNF-based collections)
        const collectionMethod = getCollectionMethod(updatedCollection);
        if (collectionMethod === 'snf_based' && updatedCollection._originalFatSnfRatio !== undefined) {
          updatedCollection.fat_snf_ratio = updatedCollection._originalFatSnfRatio;
          delete updatedCollection._originalFatSnfRatio;
        }
      } else if (field === 'clr_conversion' && value && value !== 'Select') {
        // Only apply CLR Conversion to CLR-based collections (Fat + CLR)
        const collectionMethod = getCollectionMethod(updatedCollection);
        if (collectionMethod === 'clr_based') {
          console.log('Applying CLR conversion:', value, 'to collection:', updatedCollection.id);
          console.log('Current clr_conversion before change:', updatedCollection.clr_conversion);

          // Store original values before applying CLR conversion
          if (updatedCollection._originalSnfPercentage === undefined) {
            updatedCollection._originalSnfPercentage = updatedCollection.snf_percentage;
            console.log('Stored original SNF percentage:', updatedCollection._originalSnfPercentage);
          }
          // Only store _originalClrConversion if it hasn't been set yet, or if the current clr_conversion is 'Select'
          // This ensures we store the *actual* original value before any bulk edit was applied.
          if (updatedCollection._originalClrConversion === undefined || updatedCollection.clr_conversion === 'Select') {
            updatedCollection._originalClrConversion = updatedCollection.clr_conversion;
            console.log('Stored original CLR conversion:', updatedCollection._originalClrConversion);
          }
          updatedCollection.clr_conversion = value;
          updatedCollection.clr_conversion_factor = parseFloat(value);
          // Recalculate SNF from CLR using APK formula if CLR and fat are present
          if (updatedCollection.clr && updatedCollection.fat_percentage) {
            const calculatedSnf = calculateSnfFromClr(
              updatedCollection.clr,
              updatedCollection.fat_percentage,
              value
            );
            if (calculatedSnf !== null && !isNaN(calculatedSnf)) {
              updatedCollection.snf_percentage = calculatedSnf;
              console.log('Recalculated SNF from CLR:', calculatedSnf);
            }
          }
        }
      } else if (field === 'clr_conversion' && (value === 'Select' || !value)) {
        // Restore original SNF when 'Select' is chosen (only for CLR-based collections)
        const collectionMethod = getCollectionMethod(updatedCollection);
        if (collectionMethod === 'clr_based' && updatedCollection._originalSnfPercentage !== undefined) {
          // Restore original CLR conversion value if stored, otherwise use default
          if (updatedCollection._originalClrConversion !== undefined) {
            updatedCollection.clr_conversion = updatedCollection._originalClrConversion;
            updatedCollection.clr_conversion_factor = parseFloat(updatedCollection._originalClrConversion);
          } else {
            updatedCollection.clr_conversion = 'Select';
            updatedCollection.clr_conversion_factor = null;
          }
          updatedCollection.snf_percentage = updatedCollection._originalSnfPercentage;
          delete updatedCollection._originalSnfPercentage;
        }
      } else if (field === 'rate_chart') {
        // Store original rate chart and is_pro_rata before changing
        if (!updatedCollection._originalRateChart) {
          updatedCollection._originalRateChart = updatedCollection.pro_rata_collection_rate_chart;
        }
        if (!updatedCollection._originalIsProRata) {
          updatedCollection._originalIsProRata = updatedCollection.is_pro_rata;
        }
        // Note: The actual rate chart values are set when modal is saved
        // This just marks the field as active for bulk edit
      } else if (field === 'milk_type') {
        // For milk_type, we only store the original value for visual reference
        // We do NOT update collection.milk_type immediately because:
        // 1. It would cause filtered collections to disappear from the view
        // 2. The visual preview is handled by the table rendering logic using bulkEditFields
        if (value && value !== 'Select') {
          if (!updatedCollection._originalMilkType) {
            updatedCollection._originalMilkType = updatedCollection.milk_type;
          }
          // Note: We don't update updatedCollection.milk_type here
          // The new value is stored in bulkEditFields and shown via table rendering
        } else if (value === 'Select' || !value) {
          // When 'Select' is chosen, remove the stored original to cancel the preview
          if (updatedCollection._originalMilkType !== undefined) {
            delete updatedCollection._originalMilkType;
          }
        }
      } else {
        updatedCollection[field] = value;
      }

      // Always recalculate derived values for real-time preview
      // This ensures the table shows updated amounts immediately
      // Using the same calculation logic as individual edit modal for consistency
      if (['milk_rate', 'fat_percent', 'snf_percent', 'clr', 'base_snf', 'fat_snf_ratio', 'clr_conversion'].includes(field)) {
        const fat = parseFloat(updatedCollection.fat_percentage) || 0;
        const snf = parseFloat(updatedCollection.snf_percentage) || 0;
        const weight = parseFloat(updatedCollection.kg) || 0;
        const rate = parseFloat(updatedCollection.milk_rate) || 0;
        const baseSnf = parseFloat(updatedCollection.base_snf_percentage) || 9.00;

        // Calculate Fat and SNF in KG
        const fatKg = Math.floor((weight * (fat / 100)) * 100) / 100;
        const snfKg = Math.floor((weight * (snf / 100)) * 100) / 100;

        // IMPORTANT: Use collection-specific rate chart if available, otherwise fall back to global state
        const collectionRateChart = updatedCollection.pro_rata_collection_rate_chart;
        let effectiveFatStepUpRates = fatStepUpRates;  // Global fallback
        let effectiveSnfStepDownRates = snfStepDownRates;  // Global fallback

        if (collectionRateChart) {
          console.log('DEBUG: Using collection-specific rate chart in preview:', collectionRateChart);
          effectiveFatStepUpRates = collectionRateChart.fat_step_up_rates || [];
          effectiveSnfStepDownRates = collectionRateChart.snf_step_down_rates || [];
        } else {
          console.log('DEBUG: Using global rate chart state in preview');
        }

        // Check if pro-rata applies - use original collection status or calculate for new collections
        const isProRata = updatedCollection.is_pro_rata || (Array.isArray(effectiveFatStepUpRates) &&
          effectiveFatStepUpRates.some(t => {
            const threshold = parseFloat(t?.step);
            return !isNaN(threshold) && !isNaN(fat) && fat >= threshold;
          }));

        let amount, finalRate;

        if (isProRata) {
          // Find applicable rates from thresholds
          const appliedFatRate = resolveRateFromFatThresholds(fat, effectiveFatStepUpRates);
          const appliedSnfRate = resolveRateFromSnfThresholds(snf, effectiveSnfStepDownRates);

          // Convert to adjustment values (multiply by 10)
          const fatStepUpRateValue = (parseFloat(appliedFatRate) * 10) || 0;
          const snfStepDownRateValue = (parseFloat(appliedSnfRate) * 10) || 0;

          // Calculate adjustments
          const fatAdjustment = (fat - 6.5) * fatStepUpRateValue;
          const snfAdjustment = (snf - baseSnf) * snfStepDownRateValue;

          // Final rate and amount
          finalRate = rate + fatAdjustment + snfAdjustment;
          amount = Math.round(finalRate * weight);

          // Console logging for milk rate updates
          if (field === 'milk_rate') {
            console.log('=== PRO-RATA MILK RATE UPDATE ===');
            console.log('Collection ID:', updatedCollection.id);
            console.log('Weight:', weight, 'kg');
            console.log('Fat:', fat + '%', 'SNF:', snf + '%');
            console.log('New Milk Rate:', rate);
            console.log('Applied Fat Rate:', appliedFatRate, '→ Step-up Value:', fatStepUpRateValue);
            console.log('Applied SNF Rate:', appliedSnfRate, '→ Step-down Value:', snfStepDownRateValue);
            console.log('Fat Adjustment:', fatAdjustment, 'SNF Adjustment:', snfAdjustment);
            console.log('Final Rate:', finalRate);
            console.log('Final Amount:', amount);
            console.log('Rate Chart Source:', collectionRateChart ? 'Collection-Specific' : 'Global');
            console.log('=====================================');
          }

          // Calculate component rates for display - APK logic
          let ratioToUse = updatedCollection.fat_snf_ratio;
          // Only use bulk edit value if checkbox is active
          if (!ratioToUse && activeBulkFields.fat_snf_ratio && bulkEditFields.fat_snf_ratio !== 'Select') {
            ratioToUse = bulkEditFields.fat_snf_ratio;
          }
          if (!ratioToUse) {
            ratioToUse = '60/40';
          }
          const fatRatioPercent = ratioToUse === '60/40' ? 60 : 52;
          const snfRatioPercent = ratioToUse === '60/40' ? 40 : 48;
          const fatRate = Math.floor((rate * fatRatioPercent / 6.5) * 100) / 100;
          const snfRate = Math.floor((rate * snfRatioPercent / baseSnf) * 100) / 100;
          const solidWeight = rate > 0 ? parseFloat((amount / rate).toFixed(3)) : 0;

          updatedCollection = {
            ...updatedCollection,
            fat_kg: fatKg,
            snf_kg: snfKg,
            fat_rate: fatRate,
            snf_rate: snfRate,
            amount: amount,
            solid_weight: solidWeight,
            finalRate: finalRate
          };
        } else {
          // Standard calculation (non pro-rata) - APK logic
          let ratioToUse = updatedCollection.fat_snf_ratio;
          // Only use bulk edit value if checkbox is active
          if (!ratioToUse && activeBulkFields.fat_snf_ratio && bulkEditFields.fat_snf_ratio !== 'Select') {
            ratioToUse = bulkEditFields.fat_snf_ratio;
          }
          if (!ratioToUse) {
            ratioToUse = '60/40';
          }
          const fatRatioPercent = ratioToUse === '60/40' ? 60 : 52;
          const snfRatioPercent = ratioToUse === '60/40' ? 40 : 48;
          const fatRate = Math.floor((rate * fatRatioPercent / 6.5) * 100) / 100;
          const snfRate = Math.floor((rate * snfRatioPercent / baseSnf) * 100) / 100;
          const sum = (parseFloat(fatKg) * parseFloat(fatRate)) + (parseFloat(snfKg) * parseFloat(snfRate));
          amount = Math.round(sum * 100) / 100;
          const solidWeight = rate > 0 ? parseFloat((amount / rate).toFixed(3)) : 0;

          // Console logging for milk rate updates (standard calculation)
          if (field === 'milk_rate') {
            console.log('=== STANDARD MILK RATE UPDATE ===');
            console.log('Collection ID:', updatedCollection.id);
            console.log('Weight:', weight, 'kg');
            console.log('Fat:', fat + '%', 'SNF:', snf + '%');
            console.log('New Milk Rate:', rate);
            console.log('Fat Rate:', fatRate, 'SNF Rate:', snfRate);
            console.log('Sum:', sum);
            console.log('Final Amount:', amount);
            console.log('Calculation Type: Standard (Non Pro-Rata)');
            console.log('=====================================');
          }

          updatedCollection = {
            ...updatedCollection,
            fat_kg: fatKg,
            snf_kg: snfKg,
            fat_rate: fatRate,
            snf_rate: snfRate,
            amount: amount,
            solid_weight: solidWeight
          };
        }
      }

      return updatedCollection;
    });

    setSelectedCollections(updatedCollections);
  };

  // Toggle active bulk field
  const toggleBulkField = (field) => {
    setActiveBulkFields(prev => {
      const newState = !prev[field];
      const wasActive = prev[field];

      // If unchecking a field, restore original values
      if (wasActive && !newState) {
        const updatedCollections = selectedCollections.map(collection => {
          const updatedCollection = { ...collection };

          // Restore original values based on field type
          switch (field) {
            case 'clr_conversion':
              if (updatedCollection._originalSnfPercentage !== undefined) {
                updatedCollection.snf_percentage = updatedCollection._originalSnfPercentage;
                updatedCollection.snf_percent = updatedCollection._originalSnfPercentage;
                delete updatedCollection._originalSnfPercentage;
              }
              if (updatedCollection._originalClrConversion !== undefined) {
                console.log('Restoring CLR conversion from _originalClrConversion:', updatedCollection._originalClrConversion);
                updatedCollection.clr_conversion = updatedCollection._originalClrConversion;
                updatedCollection.clr_conversion_factor = parseFloat(updatedCollection._originalClrConversion);
                delete updatedCollection._originalClrConversion;
              } else {
                // If no original was stored, check if the collection already has a valid CLR conversion
                if (updatedCollection.clr_conversion && updatedCollection.clr_conversion !== 'Select') {
                  console.log('Keeping existing CLR conversion:', updatedCollection.clr_conversion);
                  // Keep the existing value, don't reset to Select
                } else {
                  console.log('No CLR conversion found, setting to Select');
                  updatedCollection.clr_conversion = 'Select';
                  updatedCollection.clr_conversion_factor = null;
                }
              }
              break;

            case 'fat_snf_ratio':
              if (updatedCollection._originalFatSnfRatio !== undefined) {
                updatedCollection.fat_snf_ratio = updatedCollection._originalFatSnfRatio;
                delete updatedCollection._originalFatSnfRatio;
              }
              break;

            case 'milk_rate':
              if (updatedCollection._originalMilkRate !== undefined) {
                updatedCollection.milk_rate = updatedCollection._originalMilkRate;
                delete updatedCollection._originalMilkRate;
              }
              break;

            case 'base_snf':
              if (updatedCollection._originalBaseSnf !== undefined) {
                updatedCollection.base_snf = updatedCollection._originalBaseSnf;
                updatedCollection.base_snf_percentage = updatedCollection._originalBaseSnf;
                delete updatedCollection._originalBaseSnf;
              }
              break;

            case 'milk_type':
              if (updatedCollection._originalMilkType !== undefined) {
                updatedCollection.milk_type = updatedCollection._originalMilkType;
                delete updatedCollection._originalMilkType;
              }
              break;

            case 'rate_chart':
              // Restore original rate chart if stored, otherwise keep current values
              if (updatedCollection._originalRateChart !== undefined) {
                updatedCollection.pro_rata_collection_rate_chart = updatedCollection._originalRateChart;
              }
              // Clean up the stored original
              delete updatedCollection._originalRateChart;

              // Also reset is_pro_rata to original or false
              if (updatedCollection._originalIsProRata !== undefined) {
                updatedCollection.is_pro_rata = updatedCollection._originalIsProRata;
                delete updatedCollection._originalIsProRata;
              }
              break;
          }

          // Recalculate derived values with restored values
          const calc = getRealTimeCalculations(updatedCollection);
          return {
            ...updatedCollection,
            fat_kg: calc.fat_kg,
            snf_kg: calc.snf_kg,
            fat_rate: calc.fat_rate,
            snf_rate: calc.snf_rate,
            amount: calc.amount,
            solid_weight: calc.solid_weight
          };
        });

        setSelectedCollections(updatedCollections);

        // Reset the bulk edit field value to default
        setBulkEditFields(prevFields => ({
          ...prevFields,
          [field]: field === 'fat_snf_ratio' || field === 'clr_conversion' || field === 'milk_type' ? 'Select' : ''
        }));
      }

      return {
        ...prev,
        [field]: newState
      };
    });

    // If activating field and there's a value (not 'Select'), update collections immediately
    if (!activeBulkFields[field]) {
      if (bulkEditFields[field] && bulkEditFields[field] !== '' && bulkEditFields[field] !== 'Select' && field !== 'rate_chart') {
        updateCollectionsWithFieldChange(field, bulkEditFields[field]);
      } else if (field === 'rate_chart') {
        // For rate_chart, always store original values when activating, even if no value set
        // This ensures we can restore original values when unchecking
        updateCollectionsWithFieldChange(field, true);
      }
    }
  };


  const handleApplyMilkRates = async () => {
    try {
      setIsSubmittingRates(true);
      setRatePreviewError(null);

      const successfulUpdates = [];
      const failedUpdates = [];

      // Filter collections by animal type if filter is active
      const collectionsToUpdate = selectedCollections.filter(c =>
        modalAnimalFilter === 'all' || c.milk_type === modalAnimalFilter
      );

      for (let i = 0; i < collectionsToUpdate.length; i++) {
        const collection = collectionsToUpdate[i];

        try {
          // Build update object with only active fields
          let updatedCollection = {};

          // Add fields that are active for bulk editing
          if (activeBulkFields.milk_rate && bulkEditFields.milk_rate) {
            updatedCollection.milk_rate = parseFloat(bulkEditFields.milk_rate);
          }
          if (activeBulkFields.fat_percent && bulkEditFields.fat_percent) {
            updatedCollection.fat_percentage = parseFloat(bulkEditFields.fat_percent);
          }
          if (activeBulkFields.snf_percent && bulkEditFields.snf_percent) {
            updatedCollection.snf_percentage = parseFloat(bulkEditFields.snf_percent);
          }
          if (activeBulkFields.clr && bulkEditFields.clr) {
            updatedCollection.clr = parseFloat(bulkEditFields.clr);
          }
          if (activeBulkFields.base_snf && bulkEditFields.base_snf) {
            updatedCollection.base_snf_percentage = parseFloat(bulkEditFields.base_snf);
          }
          if (activeBulkFields.fat_snf_ratio && bulkEditFields.fat_snf_ratio) {
            updatedCollection.fat_snf_ratio = bulkEditFields.fat_snf_ratio;
            // Recalculate fat_rate and snf_rate based on new ratio
            const ratio = bulkEditFields.fat_snf_ratio;
            const fatRatioPercent = ratio === '60/40' ? 60 : 52;
            const snfRatioPercent = ratio === '60/40' ? 40 : 48;
            const milkRate = parseFloat(collection.milk_rate) || 0;
            const baseSnf = parseFloat(collection.base_snf_percentage) || 9.0;
            const oldFatRate = collection.fat_rate;
            const oldSnfRate = collection.snf_rate;
            const oldAmount = collection.amount;
            updatedCollection.fat_rate = Math.floor((milkRate * fatRatioPercent / 6.5) * 100) / 100;
            updatedCollection.snf_rate = Math.floor((milkRate * snfRatioPercent / baseSnf) * 100) / 100;
            // Recalculate amount with new rates
            const fatKg = parseFloat(collection.fat_kg) || 0;
            const snfKg = parseFloat(collection.snf_kg) || 0;
            updatedCollection.amount = Math.round((fatKg * updatedCollection.fat_rate + snfKg * updatedCollection.snf_rate) * 100) / 100;
            console.log(`[BULK EDIT] Collection ${collection.id} - Fat/SNF Ratio Change:`);
            console.log(`  Ratio: ${ratio} (Fat: ${fatRatioPercent}%, SNF: ${snfRatioPercent}%)`);
            console.log(`  Old Values: fat_rate=${oldFatRate}, snf_rate=${oldSnfRate}, amount=${oldAmount}`);
            console.log(`  New Values: fat_rate=${updatedCollection.fat_rate}, snf_rate=${updatedCollection.snf_rate}, amount=${updatedCollection.amount}`);
            console.log(`  Saving to Backend: fat_snf_ratio=${updatedCollection.fat_snf_ratio}, fat_rate=${updatedCollection.fat_rate}, snf_rate=${updatedCollection.snf_rate}, amount=${updatedCollection.amount}`);
          }
          if (activeBulkFields.milk_type && bulkEditFields.milk_type && bulkEditFields.milk_type !== 'Select') {
            updatedCollection.milk_type = bulkEditFields.milk_type;
          }
          if (activeBulkFields.clr_conversion && bulkEditFields.clr_conversion && bulkEditFields.clr_conversion !== 'Select') {
            updatedCollection.clr_conversion_factor = String(bulkEditFields.clr_conversion);
            // Also include the recalculated SNF percentage since CLR conversion changes SNF
            if (collection.snf_percentage) {
              updatedCollection.snf_percentage = parseFloat(collection.snf_percentage);
            }
          }
          if (activeBulkFields.rate_chart) {
            // Add rate chart to the collection
            updatedCollection.pro_rata_collection_rate_chart = {
              fat_step_up_rates: collectionFatStepUpRates.filter(r => r.step && r.rate),
              snf_step_down_rates: collectionSnfStepDownRates.filter(r => r.step && r.rate)
            };
            updatedCollection.is_pro_rata = true;
          }

          // If no fields are active, skip this collection
          if (Object.keys(updatedCollection).length === 0) {
            continue;
          }

          // Preserve the original is_pro_rata status
          updatedCollection.is_pro_rata = collection.is_pro_rata;

          // Use the current collection values directly (as shown in preview table)
          // No recalculation - send exactly what's displayed
          // BUT only set these if they weren't already set by bulk edit calculations (e.g., fat_snf_ratio change)
          updatedCollection.fat_kg = collection.fat_kg;
          updatedCollection.snf_kg = collection.snf_kg;
          // Only overwrite fat_rate, snf_rate, and amount if they weren't calculated in the bulk edit above
          if (!updatedCollection.fat_rate) {
            updatedCollection.fat_rate = collection.fat_rate;
          }
          if (!updatedCollection.snf_rate) {
            updatedCollection.snf_rate = collection.snf_rate;
          }
          if (!updatedCollection.amount) {
            updatedCollection.amount = collection.amount;
          }
          updatedCollection.solid_weight = collection.solid_weight;

          await updateAddedMilkRateCollection(collection.id, updatedCollection);

          successfulUpdates.push({
            id: collection.id,
            name: collection.customer_name
          });
        } catch (error) {
          console.error(`Failed to update collection ID ${collection.id}:`, error);
          failedUpdates.push({
            id: collection.id,
            name: collection.customer_name,
            error: error.error || 'Unknown error'
          });
        }
      }

      const activeFieldsList = Object.keys(activeBulkFields).filter(field => activeBulkFields[field]);
      const fieldsText = activeFieldsList.length > 0 ? activeFieldsList.join(', ') : 'milk rate';

      if (failedUpdates.length > 0) {
        setCurrentSubmitMessage(t('updatedCollectionsWithFieldsPartially', { successful: successfulUpdates.length, failed: failedUpdates.length, fieldsText }));
      } else {
        setCurrentSubmitMessage(t('successfullyUpdatedCollectionsWithFields', { successful: successfulUpdates.length, fieldsText }));
      }
      setSubmitSuccess(true);
      // No auto-close for bulk edit success message - user must close manually

      // Close the confirmation modal after applying
      setShowBulkApplyConfirmation(false);

      // Reset bulk editing state after successful update
      resetBulkEditState();

      // Refresh collections after update to show edited data (keep modal open)
      await handlePreviewMilkRates();
    } catch (err) {
      console.error('Error applying bulk updates:', err);
      setRatePreviewError(t('failedToApplyBulkUpdates'));
    } finally {
      setIsSubmittingRates(false);
    }
  };

  // Handler to show bulk apply confirmation modal
  const handleShowBulkApplyConfirmation = () => {
    // Check if any bulk fields are active
    const hasActiveFields = Object.values(activeBulkFields).some(field => field === true);
    if (!hasActiveFields) {
      setRatePreviewError(t('pleaseSelectAtLeastOneFieldToUpdate'));
      return;
    }
    setShowBulkApplyConfirmation(true);
    setRatePreviewError(null);
  };

  // Handler to cancel bulk apply
  const handleCancelBulkApply = () => {
    setShowBulkApplyConfirmation(false);
  };

  // Reset bulk editing state
  const resetBulkEditState = () => {
    setBulkEditFields({
      milk_rate: '',
      base_snf: '',
      fat_snf_ratio: 'Select',
      clr_conversion: 'Select',
      milk_type: 'Select'
    });
    setActiveBulkFields({
      milk_rate: false,
      base_snf: false,
      fat_snf_ratio: false,
      clr_conversion: false,
      milk_type: false
    });
  };

  // Customer filter functions
  const openCustomerModal = async () => {
    setShowCustomerModal(true);
    await loadCustomers();
  };

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await getCustomers();
      const customersData = response.results || response;
      setCustomers(customersData);
      setFilteredCustomers(customersData);

      // Pre-select the current supplier if all collections have the same customer
      if (selectedCollections.length > 0) {
        const firstCustomerId = selectedCollections[0].customer_id;
        const allSameCustomer = selectedCollections.every(collection =>
          collection.customer_id === firstCustomerId
        );

        if (allSameCustomer) {
          const currentCustomer = customersData.find(customer => customer.id === firstCustomerId);
          if (currentCustomer) {
            setSelectedCustomer(currentCustomer);
            setCustomerSearchTerm(currentCustomer.name);
          }
        }
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const getAnimalName = (animalType, collectionIndex) => {
    if (!animalType) return '-';

    // Check if animal type is being bulk edited and use the edited value
    if (collectionIndex !== undefined && activeBulkFields.milk_type && bulkEditFields.milk_type) {
      return bulkEditFields.milk_type;
    }

    // Return animal type directly in English without translation
    return animalType;
  };

  const handleCustomerSearchChange = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setCustomerSearchTerm(searchTerm);

    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm) ||
      (customer.customer_id && customer.customer_id.toString().toLowerCase().includes(searchTerm))
    );
    setFilteredCustomers(filtered);
  };

  const selectCustomer = (customer) => {
    console.log('Selected customer:', customer);
    console.log('Collections before filter:', selectedCollections);

    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    setCustomerSearchTerm('');

    // Filter collections by selected customer ID from the already date-filtered collections
    // Use customer.customer_id if available, otherwise use customer.id
    const customerIdToMatch = customer.customer_id || customer.id;
    console.log('Using customer ID to match:', customerIdToMatch);

    const filteredCollections = selectedCollections.filter(collection => {
      console.log('Checking collection:', collection, 'against customer ID:', customerIdToMatch);
      return collection.customer_id === customerIdToMatch;
    });

    console.log('Collections after filter:', filteredCollections);
    setSelectedCollections(filteredCollections);
  };

  // Handle bulk rate button click - show collection type selector
  const handleBulkRateClick = () => {
    setShowBulkRateSelector(true);
    document.body.classList.add("modal-open");
  };

  // Handle collection type selection
  const handleCollectionTypeSelect = (type) => {
    setSelectedCollectionType(type);
    setShowBulkRateSelector(false);
    document.body.classList.remove("modal-open");

    // Open the appropriate modal based on selection
    if (type === 'standard') {
      openMilkRateModal();
    } else if (type === 'prorata') {
      // For Pro Rata, also open milk rate modal first for date selection
      openMilkRateModal();
    }
  };

  // Handle rate chart button click
  const handleRateChart = async () => {
    setShowRateChartModal(true);
    document.body.classList.add("modal-open");

    // Load existing rate chart data from backend
    try {
      const rateChartData = await getProRataRateChart();
      if (rateChartData && rateChartData.id) {
        setRateChartId(rateChartData.id);

        // Set fat step-up rates
        if (rateChartData.fat_step_up_rates && rateChartData.fat_step_up_rates.length > 0) {
          setFatStepUpRates(rateChartData.fat_step_up_rates.map(rate => ({
            step: rate.step.toString(),
            rate: rate.rate.toString()
          })));
        }

        // Set SNF step-down rates
        if (rateChartData.snf_step_down_rates && rateChartData.snf_step_down_rates.length > 0) {
          setSnfStepDownRates(rateChartData.snf_step_down_rates.map(rate => ({
            step: rate.step.toString(),
            rate: Math.abs(parseFloat(rate.rate)).toString()
          })));
        }
      }
    } catch (error) {
      console.log('No existing rate chart found or error loading:', error);
      // Keep default empty rates if no data exists
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Function to refresh wallet balance
  const refreshWalletBalance = async () => {
    setIsRefreshingBalance(true);
    try {
      const walletResponse = await getWalletBalance();
      let balance = null;
      if (walletResponse && walletResponse.balance !== undefined) {
        balance = walletResponse.balance;
      } else if (walletResponse && walletResponse.amount !== undefined) {
        balance = walletResponse.amount;
      } else if (walletResponse && typeof walletResponse === 'number') {
        balance = walletResponse;
      }
      setWalletBalance(balance);
    } catch (error) {
      console.error('Error refreshing wallet balance:', error);
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        {/* Desktop Layout */}
        <div className="desktop-header">
          <div className="logo-container">
            <img src="/Dudhiya-logo.png" alt="Dudhiya" className="logo" />
          </div>
          <div className="header-center">
            <h1>{dairyInfo?.dairy_name || t('appTitle')}</h1>
          </div>
          <div className="header-actions">
            <a href="/landing_page/" className="home-btn">
              <FontAwesomeIcon icon={faHome} />
              {t('home')}
            </a>
            <LanguageSwitcher />
            <button className="mobile-logout-btn" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} />
              {t('logout')}
            </button>
            <div className="profile-dropdown" ref={profileDropdownRef}>
              <button
                className="profile-button-dashboard"
                onClick={toggleProfileDropdown}
                aria-label="Profile"
              >
                <FontAwesomeIcon icon={faUserCircle} className="profile-icon-dashboard" />
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`profile-chevron ${isProfileDropdownOpen ? 'open' : ''}`}
                />
              </button>

              {isProfileDropdownOpen && (
                <div className="profile-menu">
                  <div className="profile-info">
                    <div className="profile-header-dashborad">
                      <FontAwesomeIcon icon={faUserCircle} className="profile-avatar" />
                      <div className="profile-details">
                        <div className="profile-name">{user?.name || 'User'}</div>
                        <div className="profile-role">{t('owner')}</div>
                      </div>
                    </div>
                    {user?.phone_number && (
                      <div className="profile-contact">
                        <FontAwesomeIcon icon={faPhone} className="contact-icon" />
                        <span>{user.phone_number.replace('+91', '')}</span>
                      </div>
                    )}
                    {dairyInfo?.dairy_name && (
                      <div className="profile-dairy">
                        <FontAwesomeIcon icon={faStore} className="dairy-icon" />
                        <span>{dairyInfo.dairy_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="profile-actions">
                    {/* <button className="profile-logout-btn" onClick={handleLogout}>
                      <FontAwesomeIcon icon={faSignOutAlt} className="logout-icon" />
                      <span>{t('logout')}</span>
                    </button> */}
                    {/* <button className="logout-button" onClick={handleLogout}>
                      <FontAwesomeIcon icon={faSignOutAlt} />
                      <span>{t('logout')}</span>
                    </button> */}
                    <button className="profile-logout-btn" onClick={handleDesktopLogout}>
                      <FontAwesomeIcon icon={faSignOutAlt} />
                      {t('logout')}
                    </button>

                    <div className="trouble-section">
                      {/* <span className="trouble-text">Having trouble adding money?</span> */}
                      <button
                        className="contact-us-btn"
                        onClick={() => setShowSupportModal(true)}
                      >
                        <FontAwesomeIcon icon={faHeadphones} /> {t('contactUs')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="mobile-header">
          <div className="mobile-header-top">
            <div className="logo-container-mobile">
              <img src="/Dudhiya-logo.png" alt="Dudhiya" className="logo" />
            </div>
            <h1 className="mobile-header-title">{dairyInfo?.dairy_name || t('appTitle')}</h1>
            <div className="mobile-header-actions">
              <LanguageSwitcher />
              <button
                className="mobile-menu-toggle"
                onClick={toggleMobileMenu}
                aria-label="Toggle mobile menu"
              >
                <FontAwesomeIcon icon={faBars} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      />

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-header">
          <div className="logo-container">
            <img src="/Dudhiya-logo.png" alt="Dudhiya" className="logo" />
          </div>
          <button
            className="mobile-menu-close"
            onClick={closeMobileMenu}
            aria-label="Close mobile menu"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="mobile-menu-content">
          <div className="mobile-user-info">
            <div className="mobile-user-name">
              <FontAwesomeIcon icon={faUser} className="user-icon" />
              {user?.name || 'User'}
            </div>
            {user?.phone_number && (
              <div className="mobile-user-phone">
                <FontAwesomeIcon icon={faPhone} className="phone-icon" />
                {user.phone_number.replace('+91', '')}
              </div>
            )}
          </div>

          <div className="mobile-menu-actions">
            <a href="/landing_page/" className="mobile-home-link">
              <FontAwesomeIcon icon={faHome} />
              {t('home')}
            </a>
            <div className="mobile-language-switcher">
              <LanguageSwitcher />
            </div>
            <button className="mobile-logout-btn" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} />
              {t('logout')}
            </button>
          </div>

          <div className="trouble-section">
            {/* <span className="trouble-text">Having trouble adding money?</span> */}
            <button
              className="contact-us-btn"
              onClick={() => setShowSupportModal(true)}
            >
              <FontAwesomeIcon icon={faHeadphones} /> {t('contactUs')}
            </button>
          </div>
        </div>
      </div>

      <main className="dashboard-content">
        {/* Premium Dashboard Header */}
        <div className="premium-dashboard-header">
          <div className="premium-stats-row">
            <div className="owner-info-vertical">
              <div className="owner-wallet-row">
                <div className={`owner-info-left ${user?.name && user.name.length > 12 ? 'long-name' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="owner-info">
                    <FontAwesomeIcon icon={faUser} className="icon-user" />
                    <span> {user?.name || t('notAvailable')}</span>
                  </div>
                  <div className="phone-info">
                    <FontAwesomeIcon icon={faPhone} className="icon-phone" />
                    <span>{user?.phone_number ? user.phone_number.replace('+91', '') : t('notAvailable')}</span>
                  </div>
                </div>

                <div className="wallet-action-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                  <div className="wallet-info">
                    <FontAwesomeIcon icon={faWallet} className="icon-wallet" />
                    <span className="wallet-recharge-link" onClick={() => setShowAddMoneyModal(true)}>{t('walletRecharge')}</span>
                    <span>{walletBalance !== null && walletBalance !== undefined
                      ? `${t('currency')}${parseFloat(walletBalance).toFixed(2)}`
                      : t('notAvailable')}</span>
                  </div>

                  {/* Hire Person Banner */}
                  <div className="hire-person-banner" onClick={() => setShowHireModal(true)}>
                    <div className="hire-person-content">
                      <h2 className="hire-person-heading">{t('hirePersonBannerHeading')}</h2>
                      <p className="hire-person-subheading">{t('hirePersonBannerSubheading')}</p>
                    </div>
                    <div className="hire-person-icon">
                      <FontAwesomeIcon icon={faArrowRight} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Rate Management Section */}
        <div className="premium-rate-management">
          {/* <div className="rate-management-header">
            <h3>Rate Management</h3>
            <p>Control your milk pricing and rate types</p>
          </div> */}

          <div className="premium-rate-cards">
            {/* Bulk Rate Card - First */}
            <div className="premium-rate-card bulk-rate-card">
              <div className="rate-card-header">
                <div className="rate-card-icon bulk-icon">
                  <FontAwesomeIcon icon={faDollarSign} />
                </div>
                <div className="rate-card-title">
                  <h4 className='heading-card-dashboard'>{t('bulkRateUpdate')}</h4>
                  <button
                    type="button"
                    onClick={handleBulkRateClick}
                    className="bulk-action-btn-milk-rate"
                    title={t('bulkRateUpdateTooltip')}
                  >
                    <FontAwesomeIcon icon={faDollarSign} />
                    {t('bulkRateUpdateBtn')}
                  </button>
                  {/* <p>Update rates for multiple collections</p> */}
                </div>

              </div>
              <div className="rate-card-content">

                <div className="bulk-rate-features">
                  <div className="feature-item">
                    <FontAwesomeIcon icon={faCheck} className="feature-check" />
                    <span>{t('updateMultipleCollectionsAtOnce')}</span>
                  </div>
                  <div className="feature-item">
                    <FontAwesomeIcon icon={faCheck} className="feature-check" />
                    <span>{t('applyToSpecificDateRanges')}</span>
                  </div>
                  <div className="feature-item">
                    <FontAwesomeIcon icon={faCheck} className="feature-check" />
                    <span>{t('previewBeforeApplyingChanges')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleBulkRateClick}
                  className="bulk-action-btn-milk-rate"
                  title="Change milk rate for multiple collections"
                >
                  <FontAwesomeIcon icon={faDollarSign} />
                  {t('bulkRateUpdateBtn')}
                </button>
              </div>
            </div>

            {/* Rate Settings Card */}
            <div className="premium-rate-card rate-settings-card">
              <div className="rate-card-header">
                <div className="rate-card-icon">
                  <FontAwesomeIcon icon={faCog} />
                </div>
                <div className="rate-card-title">
                  <h4 className='heading-card-dashboard'>{t('rateSettings')}</h4>
                  <div className="current-rate-box-dashboard" onClick={openRateSettingsModal} type="button">
                    <span className="rate-symbol">₹</span>
                    <span className="rate-amount">{currentRate || '0.00'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={openRateSettingsModal}
                    className="bulk-action-btn-rate"
                    title="Configure rate settings"
                  >
                    <FontAwesomeIcon icon={faCog} />
                    {t('rateSettings')}
                  </button>
                </div>
              </div>
              <div className="rate-card-content">
                <div className="rate-settings-features">
                  <div className="feature-item">
                    <FontAwesomeIcon
                      icon={currentRate === null || currentRate === 0 ? faExclamationTriangle : faCheck}
                      className={currentRate === null || currentRate === 0 ? 'feature-warning' : 'feature-check'}
                    />
                    <span className={currentRate === null || currentRate === 0 ? 'new-user-highlight' : ''}>
                      {t('setCurrentMilkRate')}
                      {(currentRate === null || currentRate === 0) && (
                        <span className="new-user-message"> - {t('setMilkRateNow')}</span>
                      )}
                    </span>
                  </div>
                  <div className="feature-item">
                    <FontAwesomeIcon icon={faCheck} className="feature-check" />
                    <span>{t('configureRateType')}</span>
                  </div>
                  <div className="feature-item">
                    <FontAwesomeIcon icon={faCheck} className="feature-check" />
                    <span>{t('managePricingParameters')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openRateSettingsModal}
                  className="bulk-action-btn-rate"
                  title="Configure rate settings"
                >
                  <FontAwesomeIcon icon={faCog} />
                  {t('rateSettings')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Success message for updates */}
        {submitSuccess && (
          <div className="success-message-dashboard">
            <FontAwesomeIcon icon={faCheck} />
            <span>{currentSubmitMessage}</span>
            <FontAwesomeIcon
              icon={faTimes}
              className="close-icon"
              onClick={handleCloseMessage}
              style={{
                marginLeft: 'auto',
                cursor: 'pointer',
                fontSize: '14px',
                opacity: '0.7',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '1'}
              onMouseLeave={(e) => e.target.style.opacity = '0.7'}
            />
          </div>
        )}

        {/* Low Balance Alert */}
        {showLowBalanceAlert && (
          <div className="low-balance-alert">
            <FontAwesomeIcon icon={faExclamationCircle} className="alert-icon" />
            <span>{t('walletBalanceBelowFifty')}</span>
          </div>
        )}

        {/* Add Money Modal */}
        <AddMoneyModal
          isOpen={showAddMoneyModal}
          onClose={() => setShowAddMoneyModal(false)}
          walletBalance={walletBalance}
          refreshWalletBalance={refreshWalletBalance}
          isRefreshingBalance={isRefreshingBalance}
          userInfo={user}
          dairyInfo={dairyInfo}
        />

        {/* Support Modal */}
        {showSupportModal && (
          <div className="modal-overlay" onClick={() => setShowSupportModal(false)}>
            <div className="support-modal" onClick={(e) => e.stopPropagation()}>
              <div className="support-modal-header">
                <h3>{t('contactSupport')}</h3>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowSupportModal(false)}
                  aria-label="Close support modal"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="support-modal-body">
                <div className="support-options">
                  <a
                    href="https://wa.me/917454860294"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="support-option whatsapp-support"
                  >
                    <div className="support-option-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    </div>
                    <div className="support-option-content">
                      <h4>{t('whatsappSupport')}</h4>
                      {/* <p>Chat with us on WhatsApp</p> */}
                      <span className="support-number">{t('supportNumber')}</span>
                    </div>
                  </a>

                  <a
                    href="tel:+917454860294"
                    className="support-option call-support"
                  >
                    <div className="support-option-icon">
                      <FontAwesomeIcon icon={faPhone} />
                    </div>
                    <div className="support-option-content">
                      <h4>{t('callSupport')}</h4>
                      {/* <p>Call us directly</p> */}
                      <span className="support-number">{t('supportNumber')}</span>
                    </div>
                  </a>
                </div>

                {/* <div className="support-website">
                  <p>Visit our website:</p>
                  <a
                    href="https://www.dudhiya.netpy.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="website-link"
                  >
                    www.dudhiya.netpy.in
                  </a>
                </div> */}
              </div>
            </div>
          </div>
        )}


        {/* Rate Settings Modal */}
        {showRateSettingsModal && (
          <div className="modal-overlay" onClick={() => setShowRateSettingsModal(false)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="rate-settings-modal-header">
                <h2>{t('rateSettings')}</h2>

                {/* Support Section */}
                <div className="rate-settings-support-section">
                  {/* <span className="rate-settings-support-text">Need help?</span> */}
                  <button
                    className="rate-settings-contact-btn"
                    onClick={() => {
                      setShowRateSettingsModal(false);
                      setShowSupportModal(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faHeadphones} /> {t('support')}
                  </button>
                </div>

                <button
                  className="rate-settings-modal-close-btn"
                  onClick={() => setShowRateSettingsModal(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="rate-settings-modal-body">
                {/* Milk Rate Section */}
                <div className="rate-settings-modal-section">
                  <h4 className="rate-settings-modal-heading">{t('milkRateHeading')}</h4>
                  <div className="rate-settings-modal-input-group-dashboard">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={currentRate || ''}
                      onChange={(e) => setCurrentRate(parseFloat(e.target.value) || 0)}
                      className="rate-settings-modal-input"
                      style={{
                        MozAppearance: 'textfield',
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      }}
                      onWheel={(e) => e.target.blur()}
                    />
                    {/* <span className="rate-settings-modal-label">{t('perKg')}</span> */}
                    <button
                      onClick={saveIndividualMilkRate}
                      className="rate-settings-modal-btn"
                      disabled={submitting}
                    >
                      <FontAwesomeIcon icon={faCheck} className="rate-settings-modal-icon-margin" />
                      {submitting ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '0.5rem' }} />
                          {t('saving')}
                        </>
                      ) : (
                        t('save')
                      )}
                    </button>
                  </div>
                </div>

                {/* Rate Type & Animal Type Section */}
                <div className="rate-settings-modal-row-dashboard" style={{ display: 'flex', gap: '16px', marginBottom: '15px' }}>
                  <div className="rate-settings-modal-section-dashboard edit-field" style={{ flex: 1, marginBottom: 0 }}>
                    <h4 className="rate-settings-modal-heading">{t('rateType')}</h4>
                    <div className="rate-settings-modal-input-group-dashboar">
                      <select
                        className="rate-settings-modal-dropdown"
                        value={rateType}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          const displayValue = newValue === 'fat_snf' ? t('fatSnf') :
                            newValue === 'fat_clr' ? t('fatClr') :
                              newValue === 'kg_only' ? t('weightKg') :
                                t('litersOnly');
                          if (newValue !== rateType) {
                            showConfirmation(
                              'Change Rate Type',
                              `Are you sure you want to change the Rate Type to ${displayValue}?`,
                              displayValue,
                              'This Rate Type will be used for calculations.',
                              'rateType',
                              newValue
                            );
                          }
                        }}
                      >
                        <option value="fat_snf">{t('fatSnf')}</option>
                        <option value="fat_clr">{t('fatClr')}</option>
                        <option value="kg_only">{t('weightKg')}</option>
                        <option value="liters_only">{t('litersOnly')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="rate-settings-modal-section-dashboard edit-field" style={{ flex: 1, marginBottom: 0 }}>
                    <h4 className="rate-settings-modal-heading">{t('animalType')}</h4>
                    <div className="rate-settings-modal-input-group-dashboar">
                      <select
                        className="rate-settings-modal-dropdown"
                        value={animalType}
                        onChange={(e) => {
                          setAnimalType(e.target.value);
                        }}
                      >
                        <option value="cow">{t('cow')}</option>
                        <option value="buffalo">{t('buffalo')}</option>
                        <option value="cow+buffalo">{t('mix')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Fat/SNF Ratio and Base SNF Section - Combined in single row */}
                <div className="rate-settings-modal-col edit-field">
                  <h4 className="rate-settings-modal-heading">{t('fatSnfRatio')}</h4>
                  <div className="rate-settings-modal-options">
                    <button
                      className={`rate-settings-modal-option-btn ${String(fatSnfRatio) === '60_40' ? 'active' : ''}`}
                      onClick={() => {
                        if (String(fatSnfRatio) !== '60_40') {
                          showConfirmation(
                            t('changeFatSnfRatio'),
                            t('areYouSureChangeFatSnfRatioTo').replace('{value}', '60/40'),
                            '60/40',
                            t('thisFatSnfRatioWillBeUsedForCalculations'),
                            'fatSnfRatio',
                            '60_40'
                          );
                        }
                      }}
                    >
                      60/40
                    </button>
                    <button
                      className={`rate-settings-modal-option-btn ${String(fatSnfRatio) === '52_48' ? 'active' : ''}`}
                      onClick={() => {
                        if (String(fatSnfRatio) !== '52_48') {
                          showConfirmation(
                            t('changeFatSnfRatio'),
                            t('areYouSureChangeFatSnfRatioTo').replace('{value}', '52/48'),
                            '52/48',
                            t('thisFatSnfRatioWillBeUsedForCalculations'),
                            'fatSnfRatio',
                            '52_48'
                          );
                        }
                      }}
                    >
                      52/48
                    </button>
                  </div>
                </div>

                {/* Base SNF Section */}
                <div className="rate-settings-modal-col edit-field">
                  <h4 className="rate-settings-modal-heading">{t('baseSNF')}</h4>
                  <div className="rate-settings-modal-options">
                    <button
                      className={`rate-settings-modal-option-btn ${String(baseSNF) === '8.50' || String(baseSNF) === '8.50' ? 'active' : ''}`}
                      onClick={() => {
                        if (String(baseSNF) !== '8.50') {
                          showConfirmation(
                            t('changeBaseSNF'),
                            t('areYouSureChangeBaseSNFTo').replace('{value}', '8.50'),
                            '8.50',
                            t('thisBaseSNFWillBeUsedForCalculations'),
                            'baseSNF',
                            '8.50'
                          );
                        }
                      }}
                    >
                      8.50
                    </button>
                    <button
                      className={`rate-settings-modal-option-btn ${String(baseSNF) === '9.00' || String(baseSNF) === '9' ? 'active' : ''}`}
                      onClick={() => {
                        if (String(baseSNF) !== '9.00' && String(baseSNF) !== '9') {
                          showConfirmation(
                            t('changeBaseSNF'),
                            t('areYouSureChangeBaseSNFTo').replace('{value}', '9.00'),
                            '9.00',
                            t('thisBaseSNFWillBeUsedForCalculations'),
                            'baseSNF',
                            '9.00'
                          );
                        }
                      }}
                    >
                      9.00
                    </button>
                  </div>
                </div>

                {/* CLR Conversion Factor Section */}
                <div className="rate-settings-modal-section edit-field">
                  <h4 className="rate-settings-modal-heading">{t('clrConversionFactor')}</h4>
                  <div className="rate-settings-modal-options">
                    <button
                      className={`rate-settings-modal-option-btn ${String(clrConversionFactor) === '0.14' || String(clrConversionFactor) === '0.14' ? 'active' : ''}`}
                      onClick={() => {
                        if (String(clrConversionFactor) !== '0.14') {
                          showConfirmation(
                            t('changeClrConversionFactor'),
                            t('areYouSureChangeClrConversionFactorTo').replace('{value}', '0.14'),
                            '0.14',
                            t('thisClrConversionFactorWillBeUsedForCalculations'),
                            'clrConversionFactor',
                            '0.14'
                          );
                        }
                      }}
                    >
                      0.14
                    </button>
                    <button
                      className={`rate-settings-modal-option-btn ${String(clrConversionFactor) === '0.50' || String(clrConversionFactor) === '0.5' ? 'active' : ''}`}
                      onClick={() => {
                        if (String(clrConversionFactor) !== '0.50' && String(clrConversionFactor) !== '0.5') {
                          showConfirmation(
                            t('changeClrConversionFactor'),
                            t('areYouSureChangeClrConversionFactorTo').replace('{value}', '0.50'),
                            '0.50',
                            t('thisClrConversionFactorWillBeUsedForCalculations'),
                            'clrConversionFactor',
                            '0.50'
                          );
                        }
                      }}
                    >
                      0.50
                    </button>
                  </div>
                </div>
              </div>

              <div className="rate-settings-modal-footer">
                <button
                  className="rate-settings-modal-cancel-btn"
                  onClick={() => setShowRateSettingsModal(false)}
                >
                  {t('cancel')}
                </button>
                <button
                  className="rate-settings-modal-save-btn"
                  onClick={saveRateSettings}
                  disabled={!hasRateSettingsChanges || isSavingRateSettings}
                  style={{
                    opacity: (hasRateSettingsChanges && !isSavingRateSettings) ? 1 : 0.5,
                    cursor: (hasRateSettingsChanges && !isSavingRateSettings) ? 'pointer' : 'not-allowed'
                  }}
                >
                  {isSavingRateSettings ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '0.5rem' }} />
                      {t('saving')}
                    </>
                  ) : (
                    t('saveSettings')
                  )}
                </button>


              </div>
            </div>
          </div>
        )}

        {/* Premium Action Sections */}
        <div className="premium-action-sections">
          {/* <div className="section-header">
            <h3>Collections & Reports</h3>
            <p>Manage your dairy collections and generate reports</p>
          </div> */}

          <div className="premium-action-grid">
            {/* Standard Collections Card */}
            <div className="premium-action-card">
              <div className="action-card-header">
                <div className="action-card-icon standard-icon">
                  <FontAwesomeIcon icon={faBoxOpen} />
                </div>
                <div className="action-card-title">
                  <h4>{t('standardCollections')}</h4>
                  <p>{t('regularMilkCollections')}</p>
                </div>
              </div>
              <div className="action-card-content">
                <Link to="/bulk-collection-v1" className="premium-action-btn primary-btn">
                  <FontAwesomeIcon icon={faPlus} />
                  {t('addCollection')}
                </Link>
                <Link to="/preview-collections" className="premium-action-btn secondary-btn">
                  <FontAwesomeIcon icon={faListAlt} />
                  {t('viewCollections')}
                </Link>
                <StandardReportGenerator />
              </div>
            </div>

            {/* Pro Rata Collections Card */}
            <div className={`premium-action-card ${rateType === 'kg_only' || rateType === 'liters_only' ? 'disabled-card' : ''}`}>
              <div className="action-card-header">
                <div className="action-card-icon prorata-icon">
                  <FontAwesomeIcon icon={faBoxOpen} />
                </div>
                <div className="action-card-title">
                  <h4>{t('proRataCollections')}</h4>
                  <p>{t('proportionalCollections')}</p>
                  {rateType === 'kg_only' || rateType === 'liters_only' ? (
                    <span className="disabled-badge">{t('notAvailableWithKGLitersRateType')}</span>
                  ) : null}
                </div>
              </div>
              <div className="action-card-content">
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Link
                    to="/pro-rata-collection"
                    className={`premium-action-btn primary-btn ${rateType === 'kg_only' || rateType === 'liters_only' ? 'disabled' : ''}`}
                    onClick={(e) => {
                      if (rateType === 'kg_only' || rateType === 'liters_only') {
                        e.preventDefault();
                      }
                    }}
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      left: '0px',
                      fontSize: '8px',
                      color: '#ff6b00',
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      padding: '1px 4px',
                      borderRadius: '7px',
                      zIndex: 1,
                      border: '1px solid #ff6b00'
                    }}>
                      {t('proRataBadge')}
                    </div>
                    <FontAwesomeIcon icon={faPlus} />
                    {t('bulkCollection')}
                  </Link>
                </div>
                <Link
                  to="/preview-pro-rata-collections"
                  className={`premium-action-btn secondary-btn ${rateType === 'kg_only' || rateType === 'liters_only' ? 'disabled' : ''}`}
                  onClick={(e) => {
                    if (rateType === 'kg_only' || rateType === 'liters_only') {
                      e.preventDefault();
                    }
                  }}
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '0px',
                    fontSize: '8px',
                    color: '#ff6b00',
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '1px 6px',
                    borderRadius: '7px',
                    zIndex: 1,
                    border: '1px solid #ff6b00',
                    minWidth: '45px',
                    whiteSpace: 'nowrap',
                    textAlign: 'center'
                  }}>
                    {t('proRataBadge')}
                  </div>
                  <FontAwesomeIcon icon={faListAlt} />
                  {t('viewCollections')}
                </Link>
                <div className="prorata-report-btn-wrapper" style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '0px',
                    fontSize: '8px',
                    color: '#ff6b00',
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '1px 6px',
                    borderRadius: '7px',
                    zIndex: 1,
                    border: '1px solid #ff6b00',
                    minWidth: '45px',
                    whiteSpace: 'nowrap',
                    textAlign: 'center'
                  }}>
                    {t('proRataBadge')}
                  </div>
                  <ProRataReportGenerator />
                </div>
              </div>
            </div>

            {/* Reports Card */}
            {/* <div className="premium-action-card">
              <div className="action-card-header">
                <div className="action-card-icon reports-icon">
                  <FontAwesomeIcon icon={faFileAlt} />
                </div>
                <div className="action-card-title">
                  <h4>{t('reports')}</h4>
                  <p>{t('generateDetailedReports')}</p>
                </div>
              </div>
              <div className="action-card-content">
                <StandardReportGenerator />
                <ProRataReportGenerator />
              </div>
            </div> */}
          </div>
        </div>

        {/* Collections Display Section removed per requirement */}
      </main >

      {/* Milk Date Selection Modal */}
      {
        showMilkRateModal && (
          <div className="modal-overlay">
            <div className="modal-content date-filter-modal">
              <div className="modal-header">
                <h2>{t('filterCollectionsForMilkRateUpdate')}</h2>
                <button
                  className="modal-close-button"
                  onClick={() => setShowMilkRateModal(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="date-filter-container">
                <div style={styles.filterTypeToggle}>
                  <label
                    style={{
                      ...styles.toggleOption,
                      ...(milkRateSingleDateFilterMode ? styles.inactiveToggle : styles.activeToggle)
                    }}
                  >
                    <input
                      type="radio"
                      name="milk-rate-date-filter-type"
                      checked={!milkRateSingleDateFilterMode}
                      onChange={() => setMilkRateSingleDateFilterMode(false)}
                      style={styles.toggleInput}
                    />
                    <span>{t('dateRange')}</span>
                  </label>
                  <label
                    style={{
                      ...styles.toggleOption,
                      ...(milkRateSingleDateFilterMode ? styles.activeToggle : styles.inactiveToggle)
                    }}
                  >
                    <input
                      type="radio"
                      name="milk-rate-date-filter-type"
                      checked={milkRateSingleDateFilterMode}
                      onChange={() => setMilkRateSingleDateFilterMode(true)}
                      style={styles.toggleInput}
                    />
                    <span>{t('singleDate')}</span>
                  </label>
                </div>

                {milkRateSingleDateFilterMode ? (
                  <div className="date-input-group">
                    <label htmlFor="milk-rate-single-date">{t('selectDate')}</label>
                    <input
                      id="milk-rate-single-date"
                      type="date"
                      className="date-input"
                      value={milkRateSingleDate}
                      onChange={(e) => setMilkRateSingleDate(e.target.value)}
                      onClick={(e) => e.target.showPicker()}
                    />
                  </div>
                ) : (
                  <>
                    <div className="date-input-group">
                      <label htmlFor="from-date">{t('fromDate')}</label>
                      <input
                        id="from-date"
                        type="date"
                        className="date-input"
                        value={milkRateFromDate}
                        onChange={(e) => setMilkRateFromDate(e.target.value)}
                        onClick={(e) => e.target.showPicker()}
                      />
                    </div>

                    <div className="date-input-group">
                      <label htmlFor="to-date">{t('toDate')}</label>
                      <input
                        id="to-date"
                        type="date"
                        className="date-input"
                        value={milkRateToDate}
                        onChange={(e) => setMilkRateToDate(e.target.value)}
                        onClick={(e) => e.target.showPicker()}
                      />
                    </div>
                  </>
                )}

                {ratePreviewError && (
                  <div className="error-message error-message-red">
                    {ratePreviewError}
                  </div>
                )}

                <div className="date-filter-actions">
                  <button
                    className="date-filter-button secondary"
                    onClick={() => setShowMilkRateModal(false)}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    className="date-filter-button primary"
                    onClick={handlePreviewMilkRates}
                  >
                    {isLoadingRatePreview ? (
                      <span>
                        <FontAwesomeIcon icon={faSpinner} spin />
                        <span style={{ marginLeft: '8px' }}>{t('loading')}</span>
                      </span>
                    ) : t('applyFilter')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Milk Rate Preview Modal */}
      {
        showMilkRatePreviewModal && (
          <div className="modal-overlay" onClick={() => { setShowMilkRatePreviewModal(false); setModalAnimalFilter('all'); }}>
            <div className="modal-content preview-modal" onClick={e => e.stopPropagation()} style={{ width: '96%', maxWidth: '1500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header" style={{ flexShrink: 0, padding: '6px 12px' }}>
                <h2 style={{ fontSize: '14px', margin: 0, fontWeight: '600' }}>{t('bulkEditCollections')}</h2>
                <button
                  className="close-modal-button close-btn-16px"
                  onClick={() => { setShowMilkRatePreviewModal(false); resetBulkEditState(); setModalAnimalFilter('all'); }}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="modal-body-flex">
                {ratePreviewError && (
                  <div className="edit-form-error">{ratePreviewError}</div>
                )}

                <div className="preview-header-blue">
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid rgba(25, 118, 210, 0.15)', paddingBottom: '6px' }}>
                    <h3 style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#1976d2', lineHeight: '1.2' }}>
                      {milkRateSingleDateFilterMode
                        ? `${t('collectionsOn')} ${formatDateForDisplay(milkRateSingleDate)}`
                        : `${t('collectionsFromToDate').replace('{fromDate}', formatDateForDisplay(milkRateFromDate)).replace('{toDate}', formatDateForDisplay(milkRateToDate))}`}
                    </h3>
                    <span style={{
                      backgroundColor: '#1976d2',
                      color: 'white',
                      padding: '1px 4px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      lineHeight: '1.2',
                      marginRight: '6px'
                    }}>
                      {selectedCollections.filter(c => modalAnimalFilter === 'all' || c.milk_type === modalAnimalFilter).length} {t('items')}
                    </span>

                    <button
                      className="filter-button customer-filter-button"
                      onClick={openCustomerModal}
                      style={{
                        padding: '1px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: '1px solid #81c784',
                        backgroundColor: '#e8f5e9',
                        color: '#2e7d32',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        minHeight: 'unset',
                        height: '24px',
                        boxShadow: 'none',
                        width: 'auto'
                      }}
                    >
                      <FontAwesomeIcon icon={faUserAlt} />
                      <span>{t('customer')}</span>
                    </button>

                    {/* Active Customer Clear Badge (Green) */}
                    {selectedCustomer && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '1px 6px',
                        backgroundColor: '#e8f5e9',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#2e7d32',
                        border: '1px solid #81c784',
                        height: '24px',
                        boxSizing: 'border-box'
                      }}>
                        <span>{selectedCustomer.name}</span>
                        <button
                          onClick={() => {
                            setSelectedCustomer(null);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2e7d32',
                            cursor: 'pointer',
                            padding: '0',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    )}

                    {/* Animal Filter Dropdown */}
                    <select
                      value={modalAnimalFilter}
                      onChange={(e) => {
                        const newFilter = e.target.value;
                        setModalAnimalFilter(newFilter);
                      }}
                      style={{
                        padding: '3px 6px',
                        border: '1px solid #1976d2',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        backgroundColor: modalAnimalFilter !== 'all' ? '#e3f2fd' : '#fff',
                        color: modalAnimalFilter !== 'all' ? '#1976d2' : '#424242',
                        outline: 'none',
                        minWidth: '90px'
                      }}
                    >
                      <option value="all">{t('allAnimals')}</option>
                      <option value="cow">{t('cow')}</option>
                      <option value="buffalo">{t('buffalo')}</option>
                      <option value="cow_buffalo">{t('cowBuffalo')}</option>
                    </select>

                    {/* Active Animal Filter Badge */}
                    {modalAnimalFilter !== 'all' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '1px 4px',
                        backgroundColor: '#fff3e0',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#e65100',
                        border: '1px solid #ff9800'
                      }}>
                        <span>{t(modalAnimalFilter)}</span>
                        <button
                          onClick={() => {
                            setModalAnimalFilter('all');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#e65100',
                            cursor: 'pointer',
                            padding: '0',
                            fontSize: '11px'
                          }}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
                    {/* Bulk Edit Fields Section */}
                    <div className="bulk-edit-fields-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'flex-start', flex: 1 }}>
                      {/* Milk Rate */}
                      <div className="bulk-edit-field-item" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <input
                          type="checkbox"
                          checked={activeBulkFields.milk_rate}
                          onChange={() => toggleBulkField('milk_rate')}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <label
                          style={{ fontWeight: '600', fontSize: '14px', color: '#000', cursor: 'pointer' }}
                          onClick={() => toggleBulkField('milk_rate')}
                        >
                          {t('milkRate')}
                        </label>
                        <input
                          type="number"
                          className="milk-rate-input"
                          placeholder="50"
                          value={bulkEditFields.milk_rate}
                          onChange={e => handleBulkFieldChange('milk_rate', e.target.value)}
                          onFocus={() => !activeBulkFields.milk_rate && toggleBulkField('milk_rate')}
                          disabled={!activeBulkFields.milk_rate}
                          step="0.1"
                          style={{
                            padding: '2px',
                            border: activeBulkFields.milk_rate ? '1px solid #1976d2' : '1px solid #ddd',
                            borderRadius: '3px',
                            width: '60px',
                            fontSize: '12px',
                            fontWeight: '600',
                            outline: 'none',
                            backgroundColor: activeBulkFields.milk_rate ? '#fff' : '#f5f5f5',
                            MozAppearance: 'textfield',
                            WebkitAppearance: 'none',
                            appearance: 'none'
                          }}
                          onWheel={(e) => e.target.blur()}
                        />
                      </div>

                      {/* Base SNF */}
                      <div className="bulk-edit-field-item" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <input
                          type="checkbox"
                          checked={activeBulkFields.base_snf}
                          onChange={() => toggleBulkField('base_snf')}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <label
                          style={{ fontWeight: '600', fontSize: '14px', color: '#000', cursor: 'pointer' }}
                          onClick={() => toggleBulkField('base_snf')}
                        >
                          {t('baseSNF')}
                        </label>
                        <input
                          type="number"
                          className="base-snf-input"
                          placeholder="9.0"
                          value={bulkEditFields.base_snf}
                          onChange={e => handleBulkFieldChange('base_snf', e.target.value)}
                          onFocus={() => !activeBulkFields.base_snf && toggleBulkField('base_snf')}
                          disabled={!activeBulkFields.base_snf}
                          step="0.1"
                          style={{
                            padding: '2px',
                            border: activeBulkFields.base_snf ? '1px solid #1976d2' : '1px solid #ddd',
                            borderRadius: '3px',
                            width: '50px',
                            fontSize: '12px',
                            fontWeight: '600',
                            outline: 'none',
                            backgroundColor: activeBulkFields.base_snf ? '#fff' : '#f5f5f5',
                            MozAppearance: 'textfield',
                            WebkitAppearance: 'none',
                            appearance: 'none'
                          }}
                          onWheel={(e) => e.target.blur()}
                        />
                      </div>

                      {/* Fat/SNF Ratio */}
                      <div className="bulk-edit-field-item" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <input
                          type="checkbox"
                          checked={activeBulkFields.fat_snf_ratio}
                          onChange={() => toggleBulkField('fat_snf_ratio')}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <label
                          style={{ fontWeight: '600', fontSize: '14px', color: '#000', cursor: 'pointer' }}
                          onClick={() => toggleBulkField('fat_snf_ratio')}
                        >
                          {t('fatSnfRatio')}
                        </label>
                        <select
                          disabled={!activeBulkFields.fat_snf_ratio}
                          onFocus={() => !activeBulkFields.fat_snf_ratio && toggleBulkField('fat_snf_ratio')}
                          onChange={e => handleBulkFieldChange('fat_snf_ratio', e.target.value)}
                          value={bulkEditFields.fat_snf_ratio}
                          style={{
                            padding: '2px 4px',
                            border: activeBulkFields.fat_snf_ratio ? '1px solid #1976d2' : '1px solid #ddd',
                            borderRadius: '3px',
                            fontSize: '12px',
                            fontWeight: '600',
                            outline: 'none',
                            backgroundColor: activeBulkFields.fat_snf_ratio ? '#fff' : '#f5f5f5',
                            width: '80px',
                            color: bulkEditFields.fat_snf_ratio === 'Select' ? '#999' : '#000',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 4px center',
                            paddingRight: '18px'
                          }}
                        >
                          <option value="Select" style={{ color: '#999' }}>{t('select')}</option>
                          <option value="60_40" style={{ color: '#000' }}>60/40</option>
                          <option value="50_50" style={{ color: '#000' }}>50/50</option>
                          <option value="100_0" style={{ color: '#000' }}>100 FAT</option>
                        </select>
                      </div>

                      {/* CLR Conversion */}
                      <div className="bulk-edit-field-item" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <input
                          type="checkbox"
                          checked={activeBulkFields.clr_conversion}
                          onChange={() => toggleBulkField('clr_conversion')}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <label
                          style={{ fontWeight: '600', fontSize: '14px', color: '#000', cursor: 'pointer' }}
                          onClick={() => toggleBulkField('clr_conversion')}
                        >
                          {t('clrConversion')}
                        </label>
                        <select
                          disabled={!activeBulkFields.clr_conversion}
                          onFocus={() => !activeBulkFields.clr_conversion && toggleBulkField('clr_conversion')}
                          onChange={e => handleBulkFieldChange('clr_conversion', e.target.value)}
                          value={bulkEditFields.clr_conversion}
                          style={{
                            padding: '2px 4px',
                            border: activeBulkFields.clr_conversion ? '1px solid #1976d2' : '1px solid #ddd',
                            borderRadius: '3px',
                            fontSize: '12px',
                            fontWeight: '600',
                            outline: 'none',
                            backgroundColor: activeBulkFields.clr_conversion ? '#fff' : '#f5f5f5',
                            width: '80px',
                            color: bulkEditFields.clr_conversion === 'Select' ? '#999' : '#000',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 4px center',
                            paddingRight: '18px'
                          }}
                        >
                          <option value="Select" style={{ color: '#999' }}>{t('select')}</option>
                          <option value="0.14" style={{ color: '#000' }}>0.14</option>
                          <option value="0.2" style={{ color: '#000' }}>0.2</option>
                          <option value="0.21" style={{ color: '#000' }}>0.21</option>
                          <option value="0.22" style={{ color: '#000' }}>0.22</option>
                          <option value="0.25" style={{ color: '#000' }}>0.25</option>
                          <option value="0.28" style={{ color: '#000' }}>0.28</option>
                          <option value="0.3" style={{ color: '#000' }}>0.3</option>
                        </select>
                      </div>

                      {/* Animal Type */}
                      <div className="bulk-edit-field-item" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <input
                          type="checkbox"
                          checked={activeBulkFields.milk_type}
                          onChange={() => toggleBulkField('milk_type')}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <label
                          style={{ fontWeight: '600', fontSize: '14px', color: '#000', cursor: 'pointer' }}
                          onClick={() => toggleBulkField('milk_type')}
                        >
                          {t('animalType')}
                        </label>
                        <select
                          disabled={!activeBulkFields.milk_type}
                          onFocus={() => !activeBulkFields.milk_type && toggleBulkField('milk_type')}
                          onChange={e => handleBulkFieldChange('milk_type', e.target.value)}
                          value={bulkEditFields.milk_type}
                          style={{
                            padding: '2px 4px',
                            border: activeBulkFields.milk_type ? '1px solid #1976d2' : '1px solid #ddd',
                            borderRadius: '3px',
                            fontSize: '12px',
                            fontWeight: '600',
                            outline: 'none',
                            backgroundColor: activeBulkFields.milk_type ? '#fff' : '#f5f5f5',
                            width: '80px',
                            color: bulkEditFields.milk_type === 'Select' ? '#999' : '#000',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 4px center',
                            paddingRight: '18px'
                          }}
                        >
                          <option value="Select" style={{ color: '#999' }}>{t('select')}</option>
                          <option value="cow" style={{ color: '#000' }}>{t('cow')}</option>
                          <option value="buffalo" style={{ color: '#000' }}>{t('buffalo')}</option>
                          <option value="cow_buffalo" style={{ color: '#000' }}>{t('cowBuffalo')}</option>
                        </select>
                      </div>

                      {/* Rate Chart - Only for Pro Rata */}
                      {selectedCollectionType === 'prorata' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <input
                            type="checkbox"
                            checked={activeBulkFields.rate_chart}
                            onChange={() => toggleBulkField('rate_chart')}
                            style={{ width: '16px', height: '16px' }}
                          />
                          <button
                            type="button"
                            className="rate-chart-button-edit-bulk"
                            onClick={() => {
                              // Find the first selected collection that has rate chart data
                              const collectionWithRateChart = selectedCollections.find(
                                c => c.pro_rata_collection_rate_chart &&
                                  (c.pro_rata_collection_rate_chart.fat_step_up_rates?.length > 0 ||
                                    c.pro_rata_collection_rate_chart.snf_step_down_rates?.length > 0)
                              );

                              if (collectionWithRateChart) {
                                // Load rates from the collection's rate chart
                                const rateChart = collectionWithRateChart.pro_rata_collection_rate_chart;
                                setCollectionFatStepUpRates(
                                  rateChart.fat_step_up_rates?.map(r => ({
                                    step: r.step?.toString() || '',
                                    rate: r.rate?.toString() || ''
                                  })) || [{ step: '6.50', rate: '0.80' }]
                                );
                                setCollectionSnfStepDownRates(
                                  rateChart.snf_step_down_rates?.map(r => ({
                                    step: r.step?.toString() || '',
                                    rate: Math.abs(parseFloat(r.rate || 0)).toString() || '0.27'
                                  })) || [{ step: '9.00', rate: '0.27' }]
                                );
                              } else {
                                // Use default rates if no collection has rate chart data
                                setCollectionFatStepUpRates([{ step: '6.50', rate: '0.80' }]);
                                setCollectionSnfStepDownRates([{ step: '9.00', rate: '0.27' }]);
                              }
                              setShowRateChartModal(true);
                            }}
                            disabled={!activeBulkFields.rate_chart}
                            title="View and manage rate chart"
                            style={{
                              opacity: activeBulkFields.rate_chart ? 1 : 0.5,
                              cursor: activeBulkFields.rate_chart ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              backgroundColor: '#4caf50',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}
                          >
                            <FontAwesomeIcon icon={faChartBar} />
                            <span>{t('rateChart')}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Total & Final Amount Summary */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      {(() => {
                        const totalAmount = selectedCollections.filter(c => modalAnimalFilter === 'all' || c.milk_type === modalAnimalFilter).reduce((sum, c) => {
                          const calc = getRealTimeCalculations(c);
                          return sum + calc.amount;
                        }, 0);
                        const finalAmount = Math.floor(totalAmount * 0.999);
                        return (
                          <div className="bulk-edit-summary">
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '12px', color: '#424242', fontWeight: '650', whiteSpace: 'nowrap' }}>{t('totalAmount')}</span>
                              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#2e7d32', whiteSpace: 'nowrap' }}>
                                {formatCurrency(totalAmount)}
                              </span>
                            </div>
                            <div className="bulk-edit-summary-divider" style={{ width: '1px', height: '12px', backgroundColor: '#ccc', alignSelf: 'center' }}></div>
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '12px', color: '#424242', fontWeight: '650', whiteSpace: 'nowrap' }}>{t('finalAmount')}</span>
                              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e8e3e', whiteSpace: 'nowrap' }}>
                                {formatCurrency(finalAmount)}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="preview-table-container" style={{
                  overflowX: 'auto',
                  overflowY: 'auto',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  minHeight: '200px',
                  maxHeight: '300px',
                  marginBottom: '12px'
                }}>
                  <table className="preview-table-bulk" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '11px', lineHeight: '1.2' }}>{t('dateTime')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '11px', lineHeight: '1.2' }}>{t('milkRate')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '11px', lineHeight: '1.2' }}>{t('customer')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '11px', lineHeight: '1.2' }}>{t('weightKg')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '11px', lineHeight: '1.2' }}>{t('fatPercent')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '11px', lineHeight: '1.2' }}>{t('snfPercent')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '11px', lineHeight: '1.2' }}>{t('clr')}</th>
                        {selectedCollectionType === 'prorata' && (
                          <>
                            <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '11px', lineHeight: '1.2' }}>FAT Step Up</th>
                            <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '11px', lineHeight: '1.2' }}>SNF Step Down</th>
                          </>
                        )}
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '11px', lineHeight: '1.2' }}>{t('animal')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '11px', lineHeight: '1.2' }}>{t('baseSnf')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '11px', lineHeight: '1.2' }}>{t('amount')}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedCollections
                        .filter(collection => {
                          if (modalAnimalFilter === 'all') return true;
                          return collection.milk_type === modalAnimalFilter;
                        })
                        .filter(collection => {
                          if (selectedCollectionType !== 'prorata') return true;
                          const hasRateChart = collection.pro_rata_collection_rate_chart &&
                            collection.pro_rata_collection_rate_chart.fat_step_up_rates &&
                            collection.pro_rata_collection_rate_chart.fat_step_up_rates.length > 0;
                          return collection.is_pro_rata === true || hasRateChart;
                        })
                        .map((collection, index) => {
                          const calculations = getRealTimeCalculations(collection, true);
                          const fatKg = calculations.fat_kg;
                          const snfKg = calculations.snf_kg;

                          const rowStyle = {
                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                          };

                          const cellStyle = {
                            padding: '8px 12px',
                            textAlign: 'center',
                            borderBottom: '1px solid #e0e0e0',
                            whiteSpace: 'nowrap',
                            fontSize: '13px',
                            color: '#212529',
                            lineHeight: '1.3'
                          };

                          return (
                            <tr key={collection.id || index} style={rowStyle}>
                              <td style={cellStyle}>
                                {formatDate(collection.collection_date, collection.collection_time)}
                              </td>
                              <td style={cellStyle}>
                                {formatNumber(collection.milk_rate)}
                              </td>
                              <td style={{ ...cellStyle, textAlign: 'left' }}>
                                <div style={{ fontWeight: '600', display: 'flex', flexDirection: 'row' }}><div style={{ fontSize: '12px', color: '#000', marginRight: '5px' }}>{collection.customer_id}</div> {collection.customer_name || 'Unknown'}</div>
                              </td>
                              <td style={cellStyle}>
                                {formatNumber(collection.kg)}
                              </td>
                              <td style={cellStyle}>
                                {formatNumber(collection.fat_percentage)}
                              </td>
                              <td style={cellStyle}>
                                {formatNumber(calculations.calculated_snf_percentage || collection.snf_percentage)}
                              </td>
                              <td style={cellStyle}>
                                {formatNumber(collection.clr)}
                              </td>
                              {selectedCollectionType === 'prorata' && (
                                <>
                                  <td style={{ ...cellStyle, fontSize: '11px', lineHeight: '1.4' }}>
                                    {collection.pro_rata_collection_rate_chart?.fat_step_up_rates?.map((item, idx, arr) => (
                                      <span key={idx}>
                                        {parseFloat(item.step).toFixed(2)} | {parseFloat(item.rate).toFixed(2)}
                                        {idx < arr.length - 1 && <br />}
                                      </span>
                                    ))}
                                  </td>
                                  <td style={{ ...cellStyle, fontSize: '11px', lineHeight: '1.4' }}>
                                    {collection.pro_rata_collection_rate_chart?.snf_step_down_rates?.map((item, idx, arr) => (
                                      <span key={idx}>
                                        {parseFloat(item.step).toFixed(2)} | {parseFloat(Math.abs(item.rate)).toFixed(2)}
                                        {idx < arr.length - 1 && <br />}
                                      </span>
                                    ))}
                                  </td>
                                </>
                              )}
                              {/* <td style={cellStyle}>
                              {formatNumber(fatKg)}
                              </td> */}
                              {/* <td style={cellStyle}>
                              {formatNumber(snfKg)}
                              </td> */}
                              {/* <td style={cellStyle}>
                              {formatNumber(collection.fat_rate)}
                              </td> */}
                              {/* <td style={cellStyle}>
                              {formatNumber(collection.snf_rate)}
                              </td> */}

                              <td style={cellStyle}>
                                {activeBulkFields.milk_type && bulkEditFields.milk_type && bulkEditFields.milk_type !== 'Select' ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                    <span style={{
                                      fontSize: '10px',
                                      color: '#999',
                                      textDecoration: 'line-through'
                                    }}>
                                      {collection.milk_type || '-'}
                                    </span>
                                    <span style={{
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      color: '#1976d2',
                                      backgroundColor: '#e3f2fd',
                                      padding: '1px 4px',
                                      borderRadius: '3px'
                                    }}>
                                      {bulkEditFields.milk_type}
                                    </span>
                                  </div>
                                ) : (
                                  collection.milk_type || '-'
                                )}
                              </td>
                              <td style={cellStyle}>
                                {formatNumber(collection.base_snf_percentage)}
                              </td>
                              <td style={{ ...cellStyle, fontWeight: '600', color: '#2e7d32' }}>
                                {formatCurrency(calculations.amount)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>

                  </table>
                </div>

                {/* Collection Summary Section */}
                <div className="preview-summary" style={{
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  overflow: 'hidden',
                  backgroundColor: '#fff'
                }}>

                  {(() => {
                    const bulkFilteredCols = selectedCollections.filter(c => modalAnimalFilter === 'all' || c.milk_type === modalAnimalFilter);
                    const activeFatRows = bulkFilteredCols.filter(c => c.fat_percentage && !isNaN(parseFloat(c.fat_percentage)));
                    const avgFatPercent = activeFatRows.length > 0
                      ? (activeFatRows.reduce((sum, c) => sum + parseFloat(c.fat_percentage), 0) / activeFatRows.length).toFixed(2)
                      : '0.00';
                    const activeSnfRows = bulkFilteredCols.filter(c => c.snf_percentage && !isNaN(parseFloat(c.snf_percentage)));
                    const avgSnfPercent = activeSnfRows.length > 0
                      ? (activeSnfRows.reduce((sum, c) => sum + parseFloat(c.snf_percentage), 0) / activeSnfRows.length).toFixed(2)
                      : '0.00';

                    return (
                      <div className="bulk-edit-stats-panel" style={{
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        padding: '10px 12px',
                        backgroundColor: '#f8f9fa',
                        borderBottom: '1px solid #e0e0e0',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        <div className="bulk-edit-stats-item" style={{ textAlign: 'center', minWidth: '70px', flex: '1 1 auto' }}>
                          <div style={{ fontSize: '12px', color: '#000', marginBottom: '3px', fontWeight: '500' }}>Weight</div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1976d2', lineHeight: '1.2' }}>
                            {formatNumber(bulkFilteredCols.reduce((sum, c) => sum + parseFloat(c.kg || 0), 0))} kg
                          </div>
                        </div>
                        <div className="bulk-edit-stats-divider" style={{ width: '1px', height: '25px', backgroundColor: '#dee2e6', flexShrink: 0 }}></div>
                        <div className="bulk-edit-stats-item" style={{ textAlign: 'center', minWidth: '70px', flex: '1 1 auto' }}>
                          <div style={{ fontSize: '12px', color: '#000', marginBottom: '3px', fontWeight: '500' }}>Fat Kg</div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1976d2', lineHeight: '1.2' }}>
                            {formatNumber(bulkFilteredCols.reduce((sum, c) => {
                              const calc = getRealTimeCalculations(c, true);
                              return sum + calc.fat_kg;
                            }, 0))} kg
                          </div>
                        </div>
                        <div className="bulk-edit-stats-divider" style={{ width: '1px', height: '25px', backgroundColor: '#dee2e6', flexShrink: 0 }}></div>
                        <div className="bulk-edit-stats-item" style={{ textAlign: 'center', minWidth: '70px', flex: '1 1 auto' }}>
                          <div style={{ fontSize: '12px', color: '#000', marginBottom: '3px', fontWeight: '500' }}>Snf Kg</div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1976d2', lineHeight: '1.2' }}>
                            {formatNumber(bulkFilteredCols.reduce((sum, c) => {
                              const calc = getRealTimeCalculations(c, true);
                              return sum + calc.snf_kg;
                            }, 0))} kg
                          </div>
                        </div>
                        <div className="bulk-edit-stats-divider" style={{ width: '1px', height: '25px', backgroundColor: '#dee2e6', flexShrink: 0 }}></div>
                        <div className="bulk-edit-stats-item" style={{ textAlign: 'center', minWidth: '70px', flex: '1 1 auto' }}>
                          <div style={{ fontSize: '12px', color: '#000', marginBottom: '3px', fontWeight: '500' }}>Solid Weight</div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1976d2', lineHeight: '1.2' }}>
                            {formatNumber(bulkFilteredCols.reduce((sum, c) => {
                              const calc = getRealTimeCalculations(c, true);
                              return sum + parseFloat(calc.solid_weight || 0);
                            }, 0))} kg
                          </div>
                        </div>
                        <div className="bulk-edit-stats-divider" style={{ width: '1px', height: '25px', backgroundColor: '#dee2e6', flexShrink: 0 }}></div>
                        <div className="bulk-edit-stats-item" style={{ textAlign: 'center', minWidth: '70px', flex: '1 1 auto' }}>
                          <div style={{ fontSize: '12px', color: '#000', marginBottom: '3px', fontWeight: '500' }}>Avg Fat%</div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e67e22', lineHeight: '1.2' }}>
                            {avgFatPercent}%
                          </div>
                        </div>
                        <div className="bulk-edit-stats-divider" style={{ width: '1px', height: '25px', backgroundColor: '#dee2e6', flexShrink: 0 }}></div>
                        <div className="bulk-edit-stats-item" style={{ textAlign: 'center', minWidth: '70px', flex: '1 1 auto' }}>
                          <div style={{ fontSize: '12px', color: '#000', marginBottom: '3px', fontWeight: '500' }}>Avg SNF%</div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#9b59b6', lineHeight: '1.2' }}>
                            {avgSnfPercent}%
                          </div>
                        </div>
                        <div className="bulk-edit-stats-divider" style={{ width: '1px', height: '25px', backgroundColor: '#dee2e6', flexShrink: 0 }}></div>
                        <div className="bulk-edit-stats-item" style={{ textAlign: 'center', minWidth: '80px', flex: '1 1 auto' }}>
                          <div style={{ fontSize: '12px', color: '#000', marginBottom: '3px', fontWeight: '600' }}>{t('totalAmt')}</div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2e7d32', lineHeight: '1.2' }}>
                            {formatCurrency(bulkFilteredCols.reduce((sum, c) => {
                              const calc = getRealTimeCalculations(c, true);
                              return sum + calc.amount;
                            }, 0))}
                          </div>
                        </div>
                        <div className="bulk-edit-stats-divider" style={{ width: '1px', height: '25px', backgroundColor: '#dee2e6', flexShrink: 0 }}></div>
                        <div className="bulk-edit-stats-item" style={{ textAlign: 'center', minWidth: '80px', flex: '1 1 auto' }}>
                          <div style={{ fontSize: '12px', color: '#000', marginBottom: '3px', fontWeight: '600' }}>{t('finalAmount')}</div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e8e3e', lineHeight: '1.2' }}>
                            {(() => {
                              const totalAmt = bulkFilteredCols.reduce((sum, c) => {
                                const calc = getRealTimeCalculations(c, true);
                                return sum + calc.amount;
                              }, 0);
                              return formatCurrency(Math.floor(totalAmt * 0.999));
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="modal-footer-bulk modal-footer-bulk-update" style={{
                flexShrink: 0,
                borderTop: '1px solid #e0e0e0',
                backgroundColor: '#fafafa',
                width: '100%'
              }}>
                <button
                  className="cancel-button cancel-button-bulk-update"
                  onClick={() => { setShowMilkRatePreviewModal(false); resetBulkEditState(); setModalAnimalFilter('all'); }}
                  style={{
                    border: '1px solid #e0e0e0',
                    backgroundColor: '#fff',
                    color: '#424242',
                    cursor: 'pointer',
                    borderRadius: '8px'
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  className="confirm-button confirm-button-bulk-update"
                  onClick={handleShowBulkApplyConfirmation}
                  disabled={isSubmittingRates || !Object.values(activeBulkFields).some(field => field === true)}
                  style={{
                    border: 'none',
                    background: isSubmittingRates ? '#90caf9' : '#1976d2',
                    color: '#fff',
                    cursor: isSubmittingRates ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  {isSubmittingRates ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '12px', marginRight: '6px' }} />
                      <span>{t('applying')}</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} style={{ fontSize: '12px', marginRight: '6px' }} />
                      <span>{t('applyBulkChanges')}</span>
                    </>
                  )}
                </button>
                {/* {selectedCollectionType === 'prorata' && (
                  <button
                    className="confirm-button"
                    onClick={handleRateChart}
                    disabled={isSubmittingRates}
                    style={{
                      padding: '6px 4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      borderRadius: '5px',
                      border: 'none',
                      backgroundColor: '#4caf50',
                      color: '#fff',
                      cursor: isSubmittingRates ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      width: '200px'
                    }}
                  >
                    <FontAwesomeIcon icon={faChartLine} style={{ fontSize: '11px' }} />
                    <span>{t('rateChart')}</span>
                  </button>
                )} */}
              </div>
            </div>
          </div>
        )
      }

      {/* Bulk Apply Confirmation Modal */}
      {showBulkApplyConfirmation && (
        <div className="modal-overlay" onClick={handleCancelBulkApply}>
          <div className="confirmation-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header" style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1976d2' }}>
                <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '8px', color: '#ff9800' }} />
                {t('confirmBulkUpdate')}
              </h3>
              <button
                className="modal-close-button"
                onClick={handleCancelBulkApply}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#666' }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '16px' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#424242' }}>
                {t('areYouSureApplyBulkChanges')}
              </p>
              <div style={{
                backgroundColor: '#f5f5f5',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '12px'
              }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#1976d2' }}>
                  {t('collectionsToUpdate')}: {selectedCollections.filter(c => modalAnimalFilter === 'all' || c.milk_type === modalAnimalFilter).length}
                </p>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {activeBulkFields.milk_rate && bulkEditFields.milk_rate && (
                    <p style={{ margin: '4px 0' }}>• {t('milkRate')}: <strong>{bulkEditFields.milk_rate}</strong></p>
                  )}
                  {activeBulkFields.base_snf && bulkEditFields.base_snf && (
                    <p style={{ margin: '4px 0' }}>• {t('baseSNF')}: <strong>{bulkEditFields.base_snf}</strong></p>
                  )}
                  {activeBulkFields.fat_snf_ratio && bulkEditFields.fat_snf_ratio !== 'Select' && (
                    <p style={{ margin: '4px 0' }}>• {t('fatSnfRatio')}: <strong>{bulkEditFields.fat_snf_ratio}</strong></p>
                  )}
                  {activeBulkFields.milk_type && bulkEditFields.milk_type !== 'Select' && (
                    <p style={{ margin: '4px 0' }}>• {t('animalType')}: <strong>{t(bulkEditFields.milk_type)}</strong></p>
                  )}
                  {activeBulkFields.clr_conversion && bulkEditFields.clr_conversion !== 'Select' && (
                    <p style={{ margin: '4px 0' }}>• {t('clrConversion')}: <strong>{bulkEditFields.clr_conversion}</strong></p>
                  )}
                  {activeBulkFields.rate_chart && (
                    <div style={{ margin: '4px 0' }}>
                      <p style={{ margin: '4px 0' }}>• {t('rateChart')}:</p>
                      <div style={{ marginLeft: '12px', fontSize: '11px' }}>
                        {collectionFatStepUpRates.filter(r => r.step && r.rate).map((rate, idx) => (
                          <p key={`fat-${idx}`} style={{ margin: '2px 0' }}>
                            Fat ≥ {rate.step}%: +₹{rate.rate}
                          </p>
                        ))}
                        {collectionSnfStepDownRates.filter(r => r.step && r.rate).map((rate, idx) => (
                          <p key={`snf-${idx}`} style={{ margin: '2px 0' }}>
                            SNF ≤ {rate.step}%: -₹{rate.rate}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="warning-text" style={{
                margin: '0',
                fontSize: '12px',
                color: '#d32f2f',
                fontStyle: 'italic'
              }}>
                {t('thisBulkUpdateCannotBeUndone')}
              </p>
            </div>
            <div className="modal-footer-bulk-edit" style={{
              padding: '12px 16px',
              borderTop: '1px solid #e0e0e0',
              gap: '12px',
              width: '100%',
              display: 'flex',
              flexDirection: 'row'
            }}>
              <button
                className="cancel-button-bulk-edit"
                onClick={handleCancelBulkApply}
                disabled={isSubmittingRates}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#fff',
                  color: '#424242',
                  cursor: isSubmittingRates ? 'not-allowed' : 'pointer',
                  width: '50%'
                }}
              >
                {t('cancel')}
              </button>
              <button
                className="confirm-button-bulk-edit"
                onClick={handleApplyMilkRates}
                disabled={isSubmittingRates}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: isSubmittingRates ? '#90caf9' : '#1976d2',
                  color: '#fff',
                  cursor: isSubmittingRates ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  width: '50%',
                }}
              >
                {isSubmittingRates ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '12px' }} />
                    <span>{t('applying')}</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} style={{ fontSize: '12px' }} />
                    <span>{t('confirm')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Rate Collection Type Selector Modal */}
      {
        showBulkRateSelector && (
          <div className="modal-overlay" onClick={() => {
            setShowBulkRateSelector(false);
            document.body.classList.remove("modal-open");
          }}>
            <div className="bulk-rate-selector-modal" onClick={(e) => e.stopPropagation()}>
              <div className="bulk-modal-header">
                <h2 className='bulk-header-text'>{t('selectCollectionType')}</h2>
                <button
                  className="close-modal-button"
                  onClick={() => {
                    setShowBulkRateSelector(false);
                    document.body.classList.remove("modal-open");
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="modal-body">
                <div className="collection-type-options">
                  <button
                    className="collection-type-btn"
                    onClick={() => handleCollectionTypeSelect('standard')}
                  >
                    {t('standardCollection')}
                  </button>

                  <button
                    className="collection-type-btn"
                    onClick={() => handleCollectionTypeSelect('prorata')}
                  >
                    {t('proRataCollection')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }



      {/* Success/Error Message Notification */}
      {
        showSuccessMessage && (
          <div className={`notification-toast ${successMessage.includes('Error') ? 'error' : ''}`}>
            <FontAwesomeIcon
              icon={successMessage.includes('Error') ? faTimes : faCheck}
              style={{ fontSize: '1.1rem' }}
            />
            {successMessage}
          </div>
        )
      }

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={handleConfirmationClose}
        onConfirm={handleConfirmationConfirm}
        title={confirmationData.title}
        message={confirmationData.message}
        fieldValue={confirmationData.fieldValue}
        description={confirmationData.description}
      />

      {/* Rate Chart Modal */}
      {showRateChartModal && (
        <div className="modal-overlay" onClick={() => {
          setShowRateChartModal(false);
          document.body.classList.remove("modal-open");
        }}>
          <div className="rate-chart-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rate-chart-header">
              <h3>{t('rateChart')}</h3>
            </div>

            <div className="rate-chart-body">
              {/* Fat Step-up Rates Section */}
              <div className="rate-chart-section">
                <h4>{t('fatStepUpRates')}</h4>
                <p className="rate-description">{t('rateAppliesWhenFatGreater')}</p>
                {(activeBulkFields.rate_chart ? collectionFatStepUpRates : fatStepUpRates).map((item, index) => (
                  <div key={index} className="rate-row">
                    <div className="rate-input-group">
                      <label>Step (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={item.step}
                        onChange={(e) => {
                          if (activeBulkFields.rate_chart) {
                            const newRates = [...collectionFatStepUpRates];
                            newRates[index].step = e.target.value;
                            setCollectionFatStepUpRates(newRates);
                          } else {
                            const newRates = [...fatStepUpRates];
                            newRates[index].step = e.target.value;
                            setFatStepUpRates(newRates);
                          }
                        }}
                        className="rate-input"
                      />
                    </div>
                    <div className="rate-input-group">
                      <label>Rate</label>
                      <div className="rate-input-with-icon">
                        <span className="rate-icon">+</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.rate === '' ? '' : item.rate}
                          onChange={(e) => {
                            if (activeBulkFields.rate_chart) {
                              const newRates = [...collectionFatStepUpRates];
                              newRates[index].rate = e.target.value;
                              setCollectionFatStepUpRates(newRates);
                            } else {
                              const newRates = [...fatStepUpRates];
                              newRates[index].rate = e.target.value;
                              setFatStepUpRates(newRates);
                            }
                          }}
                          className="rate-input"
                        />
                      </div>
                    </div>
                    {(activeBulkFields.rate_chart ? collectionFatStepUpRates : fatStepUpRates).length > 1 && (
                      <button
                        type="button"
                        className="delete-rate-btn"
                        onClick={() => {
                          if (activeBulkFields.rate_chart) {
                            const newRates = collectionFatStepUpRates.filter((_, i) => i !== index);
                            setCollectionFatStepUpRates(newRates);
                          } else {
                            const newRates = fatStepUpRates.filter((_, i) => i !== index);
                            setFatStepUpRates(newRates);
                          }
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-step-btn"
                  onClick={() => {
                    if (activeBulkFields.rate_chart) {
                      setCollectionFatStepUpRates([...collectionFatStepUpRates, { step: '', rate: '' }]);
                    } else {
                      setFatStepUpRates([...fatStepUpRates, { step: '', rate: '' }]);
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>{t('addStep')}</span>
                </button>
              </div>

              {/* SNF Step-down Rates Section */}
              <div className="rate-chart-section">
                <h4>{t('snfStepDownRates')}</h4>
                <p className="rate-description">{t('rateAppliesWhenSnfLess')}</p>
                {(activeBulkFields.rate_chart ? collectionSnfStepDownRates : snfStepDownRates).map((item, index) => (
                  <div key={index} className="rate-row">
                    <div className="rate-input-group">
                      <label>Step (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={item.step}
                        onChange={(e) => {
                          if (activeBulkFields.rate_chart) {
                            const newRates = [...collectionSnfStepDownRates];
                            newRates[index].step = e.target.value;
                            setCollectionSnfStepDownRates(newRates);
                          } else {
                            const newRates = [...snfStepDownRates];
                            newRates[index].step = e.target.value;
                            setSnfStepDownRates(newRates);
                          }
                        }}
                        className="rate-input"
                      />
                    </div>
                    <div className="rate-input-group">
                      <label>Rate</label>
                      <div className="rate-input-with-icon">
                        <span className="rate-icon">-</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.rate === '' ? '' : item.rate}
                          onChange={(e) => {
                            if (activeBulkFields.rate_chart) {
                              const newRates = [...collectionSnfStepDownRates];
                              newRates[index].rate = e.target.value;
                              setCollectionSnfStepDownRates(newRates);
                            } else {
                              const newRates = [...snfStepDownRates];
                              newRates[index].rate = e.target.value;
                              setSnfStepDownRates(newRates);
                            }
                          }}
                          className="rate-input"
                        />
                      </div>
                    </div>
                    {(activeBulkFields.rate_chart ? collectionSnfStepDownRates : snfStepDownRates).length > 1 && (
                      <button
                        type="button"
                        className="delete-rate-btn"
                        onClick={() => {
                          if (activeBulkFields.rate_chart) {
                            const newRates = collectionSnfStepDownRates.filter((_, i) => i !== index);
                            setCollectionSnfStepDownRates(newRates);
                          } else {
                            const newRates = snfStepDownRates.filter((_, i) => i !== index);
                            setSnfStepDownRates(newRates);
                          }
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-step-btn"
                  onClick={() => {
                    if (activeBulkFields.rate_chart) {
                      setCollectionSnfStepDownRates([...collectionSnfStepDownRates, { step: '', rate: '' }]);
                    } else {
                      setSnfStepDownRates([...snfStepDownRates, { step: '', rate: '' }]);
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>{t('addStep')}</span>
                </button>
              </div>
            </div>

            <div className="rate-chart-footer">
              <button
                type="button"
                style={{ color: "black" }}
                className="modal-btn modal-btn-secondary"
                onClick={() => {
                  setShowRateChartModal(false);
                  document.body.classList.remove("modal-open");
                }}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className="modal-btn modal-btn-primary"
                onClick={async () => {
                  try {
                    setSavingRateChart(true);

                    // Determine which rates to use based on mode
                    const isBulkEditMode = activeBulkFields.rate_chart;
                    const currentFatRates = isBulkEditMode ? collectionFatStepUpRates : fatStepUpRates;
                    const currentSnfRates = isBulkEditMode ? collectionSnfStepDownRates : snfStepDownRates;

                    // Validate and prepare the rate chart data
                    const validateRateData = (rates, sectionName, isSnfStepDown = false) => {
                      const validRates = rates.filter(rate => {
                        const step = parseFloat(rate.step);
                        const rateValue = parseFloat(rate.rate);
                        return !isNaN(step) && !isNaN(rateValue) && step > 0 && rateValue >= 0;
                      });

                      return validRates.map(rate => ({
                        step: parseFloat(rate.step),
                        rate: isSnfStepDown ? -Math.abs(parseFloat(rate.rate)) : parseFloat(rate.rate)
                      }));
                    };

                    const rateChartData = {
                      fat_step_up_rates: validateRateData(currentFatRates, "Fat Step-up Rates", false),
                      snf_step_down_rates: validateRateData(currentSnfRates, "SNF Step-down Rates", true)
                    };

                    // Debug: Log what data is being sent
                    console.log('DEBUG: Rate chart data being sent to backend:', rateChartData);
                    console.log('DEBUG: Current fatStepUpRates:', currentFatRates);
                    console.log('DEBUG: Current snfStepDownRates:', currentSnfRates);
                    console.log('DEBUG: Is bulk edit mode:', isBulkEditMode);

                    // Check if at least one section has valid data
                    if (rateChartData.fat_step_up_rates.length === 0 && rateChartData.snf_step_down_rates.length === 0) {
                      throw new Error('Please enter at least one valid step and rate in either Fat Step-up Rates or SNF Step-down Rates');
                    }

                    // If in bulk edit mode, update collections with rate chart for real-time preview
                    if (isBulkEditMode) {
                      console.log('Bulk edit mode: Rate chart data saved to state for later application');

                      // Update selected collections with the new rate chart for real-time calculation
                      const updatedCollections = selectedCollections.map(collection => ({
                        ...collection,
                        pro_rata_collection_rate_chart: {
                          fat_step_up_rates: rateChartData.fat_step_up_rates,
                          snf_step_down_rates: rateChartData.snf_step_down_rates
                        },
                        is_pro_rata: true
                      }));
                      setSelectedCollections(updatedCollections);

                      setShowRateChartModal(false);
                      document.body.classList.remove("modal-open");
                      setSuccessMessage('Rate chart values set for bulk update!');
                      setShowSuccessMessage(true);
                      setTimeout(() => setShowSuccessMessage(false), 3000);
                      return;
                    }

                    let response;
                    if (rateChartId) {
                      // Update existing rate chart
                      response = await updateProRataRateChart(rateChartId, rateChartData);
                    } else {
                      // Create new rate chart
                      response = await createProRataRateChart(rateChartData);
                      setRateChartId(response.id);
                    }

                    console.log('Rate chart saved successfully:', response);

                    // Show success message
                    setSuccessMessage('Rate chart saved successfully!');
                    setShowSuccessMessage(true);
                    setTimeout(() => setShowSuccessMessage(false), 3000);
                    setShowRateChartModal(false);
                    document.body.classList.remove("modal-open");
                  } catch (error) {
                    console.error('Error saving rate chart:', error);
                    setSuccessMessage(`Error saving rate chart: ${error.message}`);
                    setShowSuccessMessage(true);
                    setTimeout(() => setShowSuccessMessage(false), 5000);
                  } finally {
                    setSavingRateChart(false);
                  }
                }}
                disabled={savingRateChart}
              >
                {savingRateChart ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span style={{ marginLeft: '8px' }}>Saving...</span>
                  </>
                ) : (
                  t('save')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Filter Modal */}
      {showCustomerModal && (
        <div className="modal-overlay">
          <div className="modal-content customer-modal">
            <div className="modal-header">
              <h2>{t('selectSupplier')}</h2>
              <button
                className="modal-close-button"
                onClick={() => setShowCustomerModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="customer-search-container">
              <div className="search-wrapper">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  placeholder={t('searchSuppliersPlaceholder')}
                  className="search-input"
                  value={customerSearchTerm}
                  onChange={handleCustomerSearchChange}
                  autoFocus
                />
              </div>
            </div>

            <div className="customers-list">
              {loadingCustomers ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>{t('loadingSuppliers')}</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="no-customers">
                  <p>{t('noSuppliersFound')}</p>
                </div>
              ) : (
                filteredCustomers.map(customer => (
                  <div
                    key={customer.id}
                    className="customer-item"
                    onClick={() => selectCustomer(customer)}
                  >
                    <div className="customer-name">{customer.name}</div>
                    <div className="customer-code">{customer.customer_id || customer.id || 'No ID'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="dashboard-footer">
        <p>&copy; 2026 Dudhiya (Milk Collection Management System). {t('allRightsReserved')}.</p>
        <img src="/Powered-By-Netpy-Technologies.png" className="footer-logo" alt={`${t('poweredBy')} Netpy Technologies`} />
        {/* Having trouble adding money section */}
        <div className="trouble-section">
          {/* <span className="trouble-text">Having trouble adding money?</span> */}
          <button
            className="contact-us-btn"
            onClick={() => setShowSupportModal(true)}
          >
            <FontAwesomeIcon icon={faHeadphones} /> {t('contactUs')}
          </button>
          {/* <button className="hire-btn" onClick={() => setShowHireModal(true)}>
            Hire Personnel
          </button> */}
        </div>
      </footer>

      {/* Hire Person Modal */}
      {showHireModal && (
        <div className="modal-overlay">
          <div className="modal-content hire-modal-content">
            <div className="modal-header">
              <h2>{t('hirePersonModalTitle')}</h2>
              <button className="close-button" onClick={() => setShowHireModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body hire-modal-body">
              <div className="hire-info-section">
                <h3>{t('hirePersonCostEstimate')}</h3>
                <p>
                  {t('hirePersonCostEstimateDesc')}
                </p>
              </div>
              <div className="hire-info-section">
                <h3>{t('hirePersonContactNetpy')}</h3>
                <p>{t('hirePersonContactNetpyDesc')}</p>
                <div className="contact-details-card">
                  <a href="tel:+917454860294" className="contact-link call-link">
                    <div className="contact-row">
                      <div className="contact-icon-wrapper">
                        <FontAwesomeIcon icon={faPhone} />
                      </div>
                      <div className="contact-text-group">
                        {/* <span className="contact-label">{t('hirePersonCallNetpy')}</span> */}
                        <span className="contact-number">+917454860294</span>
                      </div>
                    </div>
                  </a>
                  <a href="https://wa.me/917454860294" target="_blank" rel="noopener noreferrer" className="contact-link whatsapp-link">
                    <div className="contact-row">
                      <div className="contact-icon-wrapper">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                      </div>
                      <div className="contact-text-group">
                        {/* <span className="contact-label">{t('hirePersonWhatsAppNetpy')}</span> */}
                        <span className="contact-number">+917454860294</span>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            {/* <div className="modal-footer-hire">
              <button className="btn-secondary" onClick={() => setShowHireModal(false)}>
                Close
              </button>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
