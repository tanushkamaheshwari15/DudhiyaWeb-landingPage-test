import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, createBulkCollections, getCurrentMarketPrice, updateMarketPrice, createCustomer, updateCustomer, getUserInfo, getDairyInfo, getWalletBalance, updateDairyInfo, addMoneyToWallet, getProRataRateChart, createProRataRateChart, updateProRataRateChart, patchDairyInfo } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrash,
  faArrowLeft,
  faSpinner,
  faCheck,
  faExclamationTriangle,
  faEdit,
  faTimes,
  faSave,
  faEye,
  faStore,
  faUser,
  faUserCircle,
  faPhone,
  faHeadphones,
  faWallet,
  faExclamationCircle,
  faChartBar,
  faCog,
  faInfoCircle,
  faTag,
  faArrowRight,
  faGift,
  faStar,
  faMoneyBillWave,
  faPlusCircle,
  faSync
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import classNames from 'classnames';
import './ProRataCollection.css';
import ConfirmationModal from './ConfirmationModal';
import Navbar from './Navbar';
import AddMoneyModal from './AddMoneyModal';

const ProRataCollection = () => {
  const { t } = useLanguage();

  // Utility functions for decimal handling
  const sanitizeDecimal = (text) => {
    // Remove all characters except numbers and decimal point
    const sanitized = (text || '').replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');

    // Handle multiple decimal points (e.g., "6.5.7" -> "6.57")
    if (parts.length > 2) return parts[0] + '.' + parts.slice(1).join('').slice(0, 2);

    // Limit decimal places to 2 (e.g., "6.789" -> "6.78")
    if (parts[1] && parts[1].length > 2) return parts[0] + '.' + parts[1].slice(0, 2);

    return sanitized;
  };

  const trimDecimalString = (num) => {
    let s = num.toFixed(2);  // Always 2 decimal places first
    s = s.replace(/\.00$/, '');  // Remove ".00" -> "6"
    s = s.replace(/(\.\d)0$/, '$1');  // Remove trailing 0 -> "6.50" -> "6.5"
    return s;
  };

  const formatTo2Decimal = (value) => {
    if (value == null || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toFixed(2);  // Always show exactly 2 decimal places (e.g., 0.80, 1.00)
  };

  const [customers, setCustomers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [currentSubmitMessage, setCurrentSubmitMessage] = useState('');
  const [currentRate, setCurrentRate] = useState(null);
  const [isLoadingRate, setIsLoadingRate] = useState(true);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [customRate, setCustomRate] = useState('');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [currentCollection, setCurrentCollection] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [activeCell, setActiveCell] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [previewCollections, setPreviewCollections] = useState([]);
  const [previewData, setPreviewData] = useState(null); // Add preview data state
  // eslint-disable-next-line no-unused-vars
  const [fatStepUpThresholds, setFatStepUpThresholds] = useState([{ threshold: '6.5', rate: '0.80' }]); // Add threshold state
  // eslint-disable-next-line no-unused-vars
  const [snfStepDownThresholds, setSnfStepDownThresholds] = useState([{ threshold: '9.0', rate: '0.27' }]); // Add threshold state
  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split('T')[0]);
  const [globalTime, setGlobalTime] = useState('morning');
  const [globalAnimalType, setGlobalAnimalType] = useState(() => localStorage.getItem('default_animal_type') || 'cow');
  const [globalBaseSNF, setGlobalBaseSNF] = useState('9.00');
  const [activeWarning, setActiveWarning] = useState(null);

  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveWarning(null);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);
  const [isSingleDateShiftMode, setIsSingleDateShiftMode] = useState(true);
  // Add state for deletion confirmation
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  // Add row-specific search state to track search queries for each row
  const [rowSearchQueries, setRowSearchQueries] = useState({});
  const [activeSearchRowIndex, setActiveSearchRowIndex] = useState(null);

  // New state to track dropdown visibility per row
  const [visibleDropdowns, setVisibleDropdowns] = useState({});

  // New state to track the currently selected item in the customer dropdown
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1);

  // State for user and dairy information
  const [userInfo, setUserInfo] = useState(null);
  const [dairyInfo, setDairyInfo] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  // Add state for rate type editing
  const [isEditingRateType, setIsEditingRateType] = useState(false);
  const [rateType, setRateType] = useState('fat_snf'); // Default to fat_snf
  const [submittingRateType, setSubmittingRateType] = useState(false);
  const [rateTypeChanged, setRateTypeChanged] = useState(false); // Track if rate type has changed
  const [rateTypeUserChanged, setRateTypeUserChanged] = useState(false); // Track if user manually changed rate type
  // Add state for pro-rata rate adjustments
  const [fatStepUpRate, setFatStepUpRate] = useState('0.00'); // Default value
  const [snfStepDownRate, setSnfStepDownRate] = useState('0.00'); // Default value
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Rate Chart modal state
  const [showRateChartModal, setShowRateChartModal] = useState(false);
  const [fatStepUpRates, setFatStepUpRates] = useState([{ step: '6.50', rate: '0.80' }]);
  const [snfStepDownRates, setSnfStepDownRates] = useState([{ step: '9.00', rate: '0.27' }]);
  // State to track if rate chart was loaded from API
  const [rateChartLoaded, setRateChartLoaded] = useState(false);
  // State to track if rate chart is properly configured
  const [isRateChartConfigured, setIsRateChartConfigured] = useState(false);
  // State to track if rate chart warning modal is dismissed
  const [isRateChartWarningDismissed, setIsRateChartWarningDismissed] = useState(false);
  // State to track if rate chart required modal should show
  const [showRateChartRequiredModal, setShowRateChartRequiredModal] = useState(false);
  // Add state for low balance alert
  const [showLowBalanceAlert, setShowLowBalanceAlert] = useState(false);

  // Add state for rate change modal
  const [showRateChangeModal, setShowRateChangeModal] = useState(false);
  const [newMilkRate, setNewMilkRate] = useState('');

  // Add Money modal state
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  // Add state for fat/SNF ratio type
  const [fatSnfRatio, setFatSnfRatio] = useState('60_40'); // Default to 60% fat, 40% SNF

  // Profile dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Change Rates modal state
  const [showChangeRatesModal, setShowChangeRatesModal] = useState(false);
  const [baseSNF, setBaseSNF] = useState('9.00');
  const [clrConversionFactor, setClrConversionFactor] = useState('0.14');
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

  const getFatWarningText = (collection) => {
    if (!collection.fat_percent || formErrors[collection.id]?.fat_percent) return '';
    const val = parseFloat(collection.fat_percent);
    if (val < 2.00) return t('warningFatPercentBelowMin').replace('{min}', '2.0');
    if (val > 15.00) return t('warningFatPercentAboveMax').replace('{max}', '15.00');
    return '';
  };

  const getSnfWarningText = (collection) => {
    if (!collection.snf_percent || formErrors[collection.id]?.snf_percent || rateType === 'fat_clr') return '';
    const val = parseFloat(collection.snf_percent);
    if (val < 2.00) return t('warningSnfPercentBelowMin').replace('{min}', '2.00');
    if (val > 15.00) return t('warningSnfPercentAboveMax').replace('{max}', '15.00');
    return '';
  };

  const getClrWarningText = (collection) => {
    if (!collection.clr || formErrors[collection.id]?.clr || rateType === 'fat_snf') return '';
    const val = parseFloat(collection.clr);
    if (val < 15.0) return t('warningClrBelowMin').replace('{min}', '15.0');
    if (val > 35.0) return t('warningClrAboveMax').replace('{max}', '35.0');
    return '';
  };

  // Confirmation modal state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState({
    title: '',
    message: '',
    fieldValue: '',
    description: '',
    fieldToChange: '',
    newValue: ''
  });

  // Percentage Confirmation Modal state
  const [showPercentageConfirmation, setShowPercentageConfirmation] = useState(false);
  const [percentageConfirmationData, setPercentageConfirmationData] = useState({
    field: '',
    value: '',
    processedValue: '',
    type: 'low'
  });

  // Rate Chart state
  const [rateChartId, setRateChartId] = useState(null);
  const [loadingRateChart, setLoadingRateChart] = useState(false);
  const [savingRateChart, setSavingRateChart] = useState(false);
  const [savingDairyInfo, setSavingDairyInfo] = useState(false);

  // Track if user has manually changed CLR conversion factor
  const [clrConversionFactorUserChanged, setClrConversionFactorUserChanged] = useState(false);
  const [baseSNFUserChanged, setBaseSNFUserChanged] = useState(false);
  const [fatSnfRatioUserChanged, setFatSnfRatioUserChanged] = useState(false);

  const customerInputRefs = useRef([]);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  // New state variables for tracking submission progress
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [submissionTotal, setSubmissionTotal] = useState(0);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    father_name: '',
    phone: '',
    village: '',
    address: '',
  });

  // Edit Supplier modal state
  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState(null);
  const [editSupplierSearchQuery, setEditSupplierSearchQuery] = useState('');
  const [editSupplierData, setEditSupplierData] = useState({
    name: '',
    father_name: '',
    phone: '',
    village: '',
    address: '',
  });

  // Initialize empty rows - converted to useCallback to avoid dependency issues
  const initializeEmptyRows = useCallback((count) => {
    // Use the current rate from state if available, otherwise default to 0
    const rateToUse = currentRate || 0;
    console.log('Initializing rows with rate:', rateToUse);

    // Get default animal from global state or localStorage
    const defaultAnimal = globalAnimalType || localStorage.getItem('default_animal_type') || 'cow';

    // Create fresh collection array instead of updating existing one
    setCollections(() => {
      const timestamp = Date.now();
      return Array.from({ length: count }, (_, index) => ({
        id: `row_${timestamp}_${index}`, // More robust unique id format
        customer: null,
        customerDisplay: '',
        fat_percent: '',
        weight: '',
        snf_percent: '',
        clr: '',
        base_snf: baseSNF || '9.00',
        isManualBaseSnf: false,
        collection_time: globalTime, // Use global time
        collection_date: globalDate, // Use the current global date
        animal_type: defaultAnimal,
        milk_type: defaultAnimal,
        measured: 'kg',
        liters: 0,
        kg: 0,
        fat_kg: 0,
        snf_kg: 0,
        milk_rate: rateToUse,
        amount: 0,
        isSnfFromClr: false
      }));
    });

    console.log('Initialized', count, 'empty rows');
  }, [currentRate, globalTime, globalDate, globalAnimalType, baseSNF]);

  useEffect(() => {
    // Fetch customers and current market price when component mounts
    fetchCustomers();
    fetchCurrentRate();
  }, []);

  // Initialize rows after rate is loaded
  useEffect(() => {
    // Only initialize rows when rate loading is complete and collections is empty
    if (!isLoadingRate && collections.length === 0) {
      console.log('Initial load: Creating 15 empty rows');
      initializeEmptyRows(15);
    }
  }, [isLoadingRate, currentRate, initializeEmptyRows, collections.length]);

  // Fetch user and dairy information
  useEffect(() => {
    const fetchUserAndDairyInfo = async () => {
      try {
        setLoadingInfo(true);

        // Fetch user information
        const userResponse = await getUserInfo();
        setUserInfo(userResponse);

        // Fetch dairy information
        const dairyResponse = await getDairyInfo();
        console.log('DEBUG: Dairy info response:', dairyResponse);
        console.log('DEBUG: Dairy info ID:', dairyResponse?.id);
        console.log('DEBUG: Is dairy response an array?', Array.isArray(dairyResponse));

        let processedDairyResponse = dairyResponse;
        if (Array.isArray(dairyResponse) && dairyResponse.length > 0) {
          console.log('DEBUG: Using first dairy record from array:', dairyResponse[0]);
          processedDairyResponse = dairyResponse[0];
        }

        setDairyInfo(processedDairyResponse);

        if (processedDairyResponse) {
          // Set the rate type from dairy info if available
          if (processedDairyResponse.rate_type) {
            setRateType(processedDairyResponse.rate_type);
          }

          // Always update from server on initial load (ignore userChanged flags for initial load)
          if (processedDairyResponse.base_snf !== undefined) {
            // Normalize to match button values (8.50 or 9.00)
            const baseSnfValue = parseFloat(processedDairyResponse.base_snf).toFixed(2);
            console.log('DEBUG: Loading base_snf from server:', processedDairyResponse.base_snf, 'normalized to:', baseSnfValue);
            setBaseSNF(baseSnfValue);
            setBaseSNFUserChanged(false);
          }

          // Set fat/SNF ratio from dairy info if available
          if (processedDairyResponse.fat_snf_ratio) {
            // Convert "60/40" to "60_40" for internal state
            const ratio = processedDairyResponse.fat_snf_ratio.replace('/', '_');
            setFatSnfRatio(ratio);
            setFatSnfRatioUserChanged(false);
          }

          // Set CLR conversion factor from dairy info if available
          if (processedDairyResponse.clr_conversion_factor !== undefined) {
            // Normalize to match button values (0.14 or 0.50)
            const clrValue = parseFloat(processedDairyResponse.clr_conversion_factor).toFixed(2);
            console.log('DEBUG: Loading clr_conversion_factor from server:', processedDairyResponse.clr_conversion_factor, 'normalized to:', clrValue);
            setClrConversionFactor(clrValue);
            setClrConversionFactorUserChanged(false);
          }
        }

        // Fetch rate chart
        await fetchRateChart();

        // Fetch wallet balance with improved debugging
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
      } catch (error) {
        console.error('Error fetching user, dairy information, or wallet balance:', error);
      } finally {
        setLoadingInfo(false);
      }
    };

    fetchUserAndDairyInfo();
  }, []);

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

  // Real-time SNF calculation for FAT+CLR mode - matches APK logic
  useEffect(() => {
    if (rateType === 'fat_clr') {
      collections.forEach((collection, rowIndex) => {
        if (collection.clr && collection.fat_percent && !collection.isSnfFromClr) {
          // Calculate SNF from CLR and fat
          const snfValue = calculateSnfFromClr(collection.clr, collection.fat_percent);

          // Update the collection with calculated SNF
          setCollections(prevCollections =>
            prevCollections.map((col, idx) => {
              if (idx === rowIndex) {
                return {
                  ...col,
                  snf_percent: snfValue,
                  isSnfFromClr: true
                };
              }
              return col;
            })
          );
        }
      });
    }
  }, [rateType, collections.map(c => `${c.clr}-${c.fat_percent}`).join('|')]);

  // Update all collections when baseSNF changes (for real-time updates)
  useEffect(() => {
    if (baseSNF && collections.length > 0) {
      console.log(' ProRata Rate Settings baseSNF changed to:', baseSNF);
      console.log(' Current collections before update:', collections.map(c => ({ id: c.id, base_snf: c.base_snf, isManual: c.isManualBaseSnf })));

      setCollections(prevCollections =>
        prevCollections.map(collection => {
          // Always update all rows when Rate Settings change
          // Reset manual flag to ensure synchronization
          const updatedCollection = {
            ...collection,
            base_snf: baseSNF,
            isManualBaseSnf: false // Reset manual flag when Rate Settings change
          };

          // Recalculate derived values for the updated collection with new base SNF
          const derived = calculateDerivedValues(updatedCollection);
          updatedCollection.fat_kg = derived.fat_kg;
          updatedCollection.snf_kg = derived.snf_kg;
          updatedCollection.amount = derived.amount;
          updatedCollection.fat_rate = derived.fat_rate;
          updatedCollection.snf_rate = derived.snf_rate;
          updatedCollection.solid_weight = derived.solid_weight;

          return updatedCollection;
        })
      );
      console.log(' All ProRata rows updated to baseSNF:', baseSNF);
    }
  }, [baseSNF]);

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
        setRateTypeUserChanged(true);
        break;
      case 'baseSNF':
        setBaseSNF(confirmationData.newValue);
        setBaseSNFUserChanged(true);
        break;
      case 'fatSnfRatio':
        setFatSnfRatio(confirmationData.newValue);
        setFatSnfRatioUserChanged(true);
        break;
      case 'clrConversionFactor':
        setClrConversionFactor(confirmationData.newValue);
        setClrConversionFactorUserChanged(true);
        break;
      default:
        break;
    }
    handleConfirmationClose();
  };

  // Handle percentage confirmation modal
  const handlePercentageConfirmation = (confirmed) => {
    const { rowIndex, field, processedValue } = percentageConfirmationData;

    if (confirmed) {
      // User confirmed the value, proceed with validation
      const numValue = parseFloat(processedValue);
      if (!isNaN(numValue)) {
        setFormErrors(prev => {
          const newErrors = { ...prev };

          // Clear any previous error for this field
          if (newErrors[collections[rowIndex].id]) {
            delete newErrors[collections[rowIndex].id][field];
          }

          // If no errors remain for this collection, remove the collection entry
          if (newErrors[collections[rowIndex].id] &&
            Object.keys(newErrors[collections[rowIndex].id]).length === 0) {
            delete newErrors[collections[rowIndex].id];
          }

          return newErrors;
        });
      }
    } else {
      // User cancelled, revert the value to empty
      setCollections(collections.map((col, idx) => {
        if (idx === rowIndex) {
          return { ...col, [field]: '' };
        }
        return col;
      }));
    }

    // Close the popup
    setShowPercentageConfirmation(false);
    setPercentageConfirmationData({
      rowIndex: null,
      field: null,
      value: null,
      processedValue: null
    });
  };

  // Function to open rate settings modal and capture original values
  const openRateSettingsModal = useCallback(() => {
    const currentDefaultAnimal = localStorage.getItem('default_animal_type') || globalAnimalType || 'cow';
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
    setShowChangeRatesModal(true);
  }, [currentRate, rateType, baseSNF, clrConversionFactor, fatSnfRatio, globalAnimalType]);

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
        setTimeout(() => {
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
        setTimeout(() => {
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
        base_snf: baseSNF === '9.00' ? '9.0' : baseSNF.replace('.50', '.5'), // Normalize 9.00 to 9.0 and 8.50 to 8.5 for API
        fat_snf_ratio: fatSnfRatio.replace('_', '/'), // Convert 60_40 to 60/40 for API
        clr_conversion_factor: clrConversionFactor === '0.5' ? '0.50' : clrConversionFactor, // Normalize 0.5 to 0.50
      };

      console.log('Sending dairy data:', dairyData);

      // Call API to update dairy information
      await patchDairyInfo(dairyInfo.id, dairyData);
      console.log('Rate settings updated successfully:', { rateType, baseSNF, clrConversionFactor, fatSnfRatio });

      // Refresh dairy info after update
      const updatedDairyInfo = await getDairyInfo();
      setDairyInfo(updatedDairyInfo);

      // Save animal type to localStorage and global state
      localStorage.setItem('default_animal_type', animalType);
      setGlobalAnimalType(animalType);
      setCollections(prevCollections =>
        prevCollections.map(col => ({
          ...col,
          animal_type: animalType,
          milk_type: animalType
        }))
      );

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
      setShowChangeRatesModal(false);

      // Show success message
      let successMessage = t('rateSettingsSavedSuccessfully');
      if (milkRateChanged) {
        successMessage = t('milkRateXAndRateSettingsSavedSuccessfully', { rate: currentRate });
      }
      console.log('Final success message:', successMessage);
      setSuccessMessage(successMessage);
      setShowSuccessMessage(true);

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);

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
      }, 3000);
    } finally {
      setIsSavingRateSettings(false);
    }
  };

  // Update all collections when currentRate changes (for real-time updates)
  useEffect(() => {
    if (currentRate !== null && collections.length > 0) {
      setCollections(prevCollections =>
        prevCollections.map(collection => {
          const updatedCollection = {
            ...collection,
            milk_rate: currentRate
          };

          // Recalculate amount for the updated collection
          const derived = calculateDerivedValues(updatedCollection);
          updatedCollection.fat_kg = derived.fat_kg;
          updatedCollection.snf_kg = derived.snf_kg;
          updatedCollection.amount = derived.amount;
          updatedCollection.fat_rate = derived.fat_rate;
          updatedCollection.snf_rate = derived.snf_rate;
          updatedCollection.solid_weight = derived.solid_weight;

          return updatedCollection;
        })
      );
    }
  }, [currentRate]);

  // Update change detection when any rate setting changes
  useEffect(() => {
    if (showChangeRatesModal) {
      checkRateSettingsChanges();
    }
  }, [currentRate, rateType, baseSNF, clrConversionFactor, fatSnfRatio, animalType, showChangeRatesModal, checkRateSettingsChanges]);

  // Force preview modal re-render when rate settings change for real-time updates
  useEffect(() => {
    if (showPreviewModal && collections.length > 0) {
      // This will trigger re-render of preview modal with updated calculations
      console.log('Rate settings changed, updating preview modal calculations');
      // Force re-render by updating a dummy state or using a key
      setCollections(prevCollections => [...prevCollections]);
    }
  }, [currentRate, baseSNF, fatSnfRatio, clrConversionFactor, fatStepUpRate, snfStepDownRate, showPreviewModal]);

  // Recalculate SNF from CLR when clrConversionFactor changes (for FAT+CLR mode)
  useEffect(() => {
    if (rateType === 'fat_clr' && collections.length > 0) {
      setCollections(prevCollections =>
        prevCollections.map(collection => {
          // Only recalculate if we have both CLR and FAT values
          if (collection.clr && collection.fat_percent) {
            const newSnf = calculateSnfFromClr(collection.clr, collection.fat_percent);
            const updatedCollection = {
              ...collection,
              snf_percent: newSnf,
              isSnfFromClr: true
            };
            // Recalculate all derived values with new SNF
            const derived = calculateDerivedValues(updatedCollection);
            return {
              ...updatedCollection,
              fat_kg: derived.fat_kg,
              snf_kg: derived.snf_kg,
              fat_rate: derived.fat_rate,
              snf_rate: derived.snf_rate,
              amount: derived.amount,
              finalRate: derived.finalRate
            };
          }
          return collection;
        })
      );
    }
  }, [clrConversionFactor, rateType]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await getCustomers();
      setCustomers(response.results || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentRate = async () => {
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
  };

  const fetchRateChart = async () => {
    try {
      setLoadingRateChart(true);
      const response = await getProRataRateChart();

      // Debug: Log what data is being received from backend
      console.log('DEBUG: Rate chart data received from backend:', response);

      if (response) {
        // Set the rate chart ID for future updates
        setRateChartId(response.id);

        // Update fat step up rates - use defaults if empty or invalid
        if (response.fat_step_up_rates && Array.isArray(response.fat_step_up_rates) && response.fat_step_up_rates.length > 0) {
          const formattedFatRates = response.fat_step_up_rates.map(rate => {
            // Correct the rate if it's 0.05 (incorrect value) - should be 0.80
            const correctedRate = parseFloat(rate.rate) === 0.05 ? '0.80' : rate.rate.toString();
            return {
              step: formatTo2Decimal(rate.step),
              rate: formatTo2Decimal(correctedRate)
            };
          });
          setFatStepUpRates(formattedFatRates);
          console.log('DEBUG: Fat step-up rates set:', formattedFatRates);
        } else {
          // Use default if API returns empty or invalid data
          setFatStepUpRates([{ step: '6.50', rate: '0.80' }]);
          console.log('DEBUG: Using default fat step-up rates');
        }

        // Update SNF step down rates - use defaults if empty or invalid
        if (response.snf_step_down_rates && Array.isArray(response.snf_step_down_rates) && response.snf_step_down_rates.length > 0) {
          const formattedSnfRates = response.snf_step_down_rates.map(rate => ({
            step: formatTo2Decimal(rate.step),
            rate: formatTo2Decimal(Math.abs(parseFloat(rate.rate)))
          }));
          setSnfStepDownRates(formattedSnfRates);
          console.log('DEBUG: SNF step-down rates set:', formattedSnfRates);
        } else {
          // Use default if API returns empty or invalid data
          setSnfStepDownRates([{ step: '9.00', rate: '0.27' }]);
          console.log('DEBUG: Using default SNF step-down rates');
        }

        setRateChartLoaded(true);
        setIsRateChartConfigured(true); // Rate chart is properly configured
        console.log('Rate chart loaded successfully:', response);
      } else {
        // No rate chart exists, use defaults
        setFatStepUpRates([{ step: '6.50', rate: '0.80' }]);
        setSnfStepDownRates([{ step: '9.00', rate: '0.27' }]);
        setRateChartLoaded(true);
        setIsRateChartConfigured(false); // Rate chart is not configured
      }
    } catch (error) {
      console.error('Error fetching rate chart:', error);
      // Set default values if no rate chart exists
      setFatStepUpRates([{ step: '6.50', rate: '0.80' }]);
      setSnfStepDownRates([{ step: '9.00', rate: '0.27' }]);
      setRateChartLoaded(true);
      setIsRateChartConfigured(false); // Rate chart is not configured
    } finally {
      setLoadingRateChart(false);
    }
  };

  // Function to handle rate chart warning dismissal
  const handleRateChartWarningDismiss = () => {
    setIsRateChartWarningDismissed(true);
    // Auto-reappear after 15 seconds
    setTimeout(() => {
      setIsRateChartWarningDismissed(false);
    }, 15000); // 15 seconds
  };

  // Function to handle rate chart modal close and check if rate chart is now configured
  const handleRateChartModalClose = () => {
    setShowRateChartModal(false);
    // Check if rate chart is now configured after modal closes
    setTimeout(() => {
      fetchRateChart(); // Refresh rate chart data
    }, 500);
  };

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

  // Calculate SNF from CLR - Updated to match APK logic
  const calculateSnfFromClr = (clrValue, fatValue) => {
    // Ensure we have valid inputs
    if (!clrValue || !fatValue) {
      return 0;
    }

    // Convert strings to numbers to ensure proper calculation
    const clr = parseFloat(clrValue);
    const fat = parseFloat(fatValue);
    const conversionFactor = parseFloat(clrConversionFactor);

    // Additional validation for reasonable values
    if (isNaN(clr) || isNaN(fat) || isNaN(conversionFactor) || clr <= 0 || fat <= 0) {
      return 0;
    }

    // SNF calculation formula: SNF = (CLR / 4) + (0.20 * FAT) + ConversionFactor
    const calculatedSnf = Math.floor(((clr / 4) + (fat * 0.20) + conversionFactor) * 100) / 100;

    return calculatedSnf;
  };

  // NEW ADVANCED PRO RATA LOGIC - Helper function to resolve fat step up rate from thresholds
  const resolveRateFromFatThresholds = (fatPercent, thresholds) => {
    if (!Array.isArray(thresholds) || thresholds.length === 0) {
      return parseFloat(fatStepUpRate) || 0;
    }

    // Sort thresholds by threshold value (ascending) - APK Logic
    const sortedThresholds = thresholds
      .filter(t => !isNaN(parseFloat(t?.threshold || t?.step)) && !isNaN(parseFloat(t?.rate)))
      .sort((a, b) => parseFloat(a?.threshold || a?.step) - parseFloat(b?.threshold || b?.step));

    if (sortedThresholds.length === 0) return 0;

    // Find the highest threshold that the value meets or exceeds - APK Logic
    let applicableRate = 0;
    for (let i = 0; i < sortedThresholds.length; i++) {
      const threshold = parseFloat(sortedThresholds[i]?.threshold || sortedThresholds[i]?.step);
      const rate = parseFloat(sortedThresholds[i]?.rate);
      if (fatPercent >= threshold) {
        applicableRate = rate;
      } else {
        break;
      }
    }

    return applicableRate;
  };

  // NEW ADVANCED PRO RATA LOGIC - Helper function to resolve SNF step down rate from thresholds
  const resolveRateFromSnfThresholds = (snfPercent, thresholds) => {
    if (!Array.isArray(thresholds) || thresholds.length === 0) {
      return parseFloat(snfStepDownRate) || 0;
    }

    // Sort thresholds by threshold value (descending) for SNF step-down - APK Logic
    const sortedThresholds = thresholds
      .filter(t => !isNaN(parseFloat(t?.threshold || t?.step)) && !isNaN(parseFloat(t?.rate)))
      .sort((a, b) => parseFloat(b?.threshold || b?.step) - parseFloat(a?.threshold || a?.step));

    if (sortedThresholds.length === 0) return 0;

    // Find the applicable rate based on SNF threshold logic - APK Logic
    // Rate applies when value is BELOW the threshold
    let applicableRate = 0;
    for (let i = 0; i < sortedThresholds.length; i++) {
      const threshold = parseFloat(sortedThresholds[i]?.threshold || sortedThresholds[i]?.step);
      const rate = parseFloat(sortedThresholds[i]?.rate);
      if (snfPercent < threshold) {
        applicableRate = rate;
        break; // Take the first (highest) threshold that value is below
      }
    }

    return applicableRate;
  };

  // NEW ADVANCED PRO RATA LOGIC - Recalculate with new base SNF and threshold-based rates
  // eslint-disable-next-line no-unused-vars
  const recalculateWithNewBaseSnf = (newBaseSnf) => {
    if (!previewData) return;

    const fatKg = parseFloat(previewData.fat_kg);
    const snfKg = parseFloat(previewData.snf_kg);
    const baseRate = parseFloat(currentRate) || 0;
    const fatPercent = parseFloat(previewData.fat_percentage) || 0;
    const snfPercentVal = parseFloat(previewData.snf_percentage) || 0;
    const weightKg = parseFloat(previewData.kg) || 0;
    const baseSnfVal = parseFloat(newBaseSnf);

    // Guard against invalid base SNF values
    if (isNaN(baseSnfVal) || baseSnfVal <= 0) {
      return;
    }

    // Recompute component rates based on new base SNF and selected ratio
    const fatRatioPercent = fatSnfRatio === '60_40' ? 60 : 52;
    const snfRatioPercent = fatSnfRatio === '60_40' ? 40 : 48;
    const fatRate = (baseRate * fatRatioPercent / 6.5).toFixed(3);
    const snfRate = (baseRate * snfRatioPercent / baseSnfVal).toFixed(3);

    let effectiveRate = baseRate;
    let newAmountNum = 0;
    const isProRata = Array.isArray(fatStepUpThresholds) && fatStepUpThresholds.some(t => {
      const threshold = parseFloat(t?.threshold);
      return !isNaN(threshold) && !isNaN(fatPercent) && fatPercent >= threshold;
    });

    if (isProRata) {
      const appliedFatRate = resolveRateFromFatThresholds(fatPercent, fatStepUpThresholds);
      const appliedSnfRate = resolveRateFromSnfThresholds(snfPercentVal, snfStepDownThresholds);
      const fatStepUpRateValue = (parseFloat(appliedFatRate) * 10) || 0;
      const snfStepDownRateValue = (parseFloat(appliedSnfRate) * 10) || 0;
      const fatAdjustment = (fatPercent - 6.5) * fatStepUpRateValue;
      const snfAdjustment = (snfPercentVal - baseSnfVal) * snfStepDownRateValue;
      effectiveRate = baseRate + fatAdjustment + snfAdjustment;
      newAmountNum = Math.round(effectiveRate * weightKg);
    } else {
      const sum = (parseFloat(fatKg) * parseFloat(fatRate)) + (parseFloat(snfKg) * parseFloat(snfRate));
      newAmountNum = Math.round(sum);
    }

    setPreviewData({
      ...previewData,
      base_snf_percentage: newBaseSnf,
      fat_rate: fatRate,
      snf_rate: snfRate,
      milk_rate: baseRate.toString(),
      amount: newAmountNum.toFixed(2)
    });
  };

  // NEW ADVANCED PRO RATA LOGIC - Calculate derived values using threshold-based rates
  const calculateDerivedValues = (collection) => {
    const fat = parseFloat(collection.fat_percent) || 0;
    const snf = parseFloat(collection.snf_percent) || 0;
    const weight = parseFloat(collection.weight) || 0;
    const rate = parseFloat(collection.milk_rate) || currentRate || 0;
    const baseSnf = parseFloat(collection.base_snf) || 9.00;

    // Calculate fat_kg and snf_kg
    const fatKg = Math.floor((weight * (fat / 100)) * 100) / 100;
    const snfKg = Math.floor((weight * (snf / 100)) * 100) / 100;

    // Get fat/SNF ratio percentages based on selected option
    const fatRatioPercent = fatSnfRatio === '60_40' ? 60 : 52;
    const snfRatioPercent = fatSnfRatio === '60_40' ? 40 : 48;

    // Calculate component rates
    const fatRate = Math.floor((rate * fatRatioPercent / 6.5) * 100) / 100;
    const snfRate = Math.floor((rate * snfRatioPercent / baseSnf) * 100) / 100;

    let finalRate = rate;
    let amount = 0;

    // Check if pro rata applies using threshold-based logic
    const isProRata = Array.isArray(fatStepUpRates) && fatStepUpRates.some(t => {
      const threshold = parseFloat(t?.threshold || t?.step);
      return !isNaN(threshold) && !isNaN(fat) && fat >= threshold;
    });

    if (isProRata) {
      // Use threshold-based rate resolution for advanced pro rata
      const appliedFatRate = resolveRateFromFatThresholds(fat, fatStepUpRates);
      const appliedSnfRate = resolveRateFromSnfThresholds(snf, snfStepDownRates);
      const fatStepUpRateValue = (parseFloat(appliedFatRate) * 10) || 0;
      const snfStepDownRateValue = (parseFloat(appliedSnfRate) * 10) || 0;

      const fatAdjustment = (fat - 6.5) * fatStepUpRateValue;
      const snfAdjustment = (snf - baseSnf) * snfStepDownRateValue;

      finalRate = rate + fatAdjustment + snfAdjustment;
      amount = parseFloat((finalRate * weight).toFixed(2));
    } else {
      // Standard calculation for fat <= threshold
      const fatAmount = parseFloat(fatKg) * parseFloat(fatRate);
      const snfAmount = parseFloat(snfKg) * parseFloat(snfRate);
      amount = Math.round((fatAmount + snfAmount) * 100) / 100;
    }

    // Calculate solid weight
    const solidWeight = (amount / rate).toFixed(3);

    // Variables for logging
    const proRataApplied = isProRata;
    const input = { fat, snf, weight, rate, baseSnf };
    let fatStepUpRate, snfStepDownRate, fatStepUpRateValue, snfStepDownRateValue, fatAdjustment, snfAdjustment;

    if (isProRata) {
      fatStepUpRate = resolveRateFromFatThresholds(fat, fatStepUpRates);
      snfStepDownRate = resolveRateFromSnfThresholds(snf, snfStepDownRates);
      fatStepUpRateValue = (parseFloat(fatStepUpRate) * 10) || 0;
      snfStepDownRateValue = (parseFloat(snfStepDownRate) * 10) || 0;
      fatAdjustment = (fat - 6.5) * fatStepUpRateValue;
      snfAdjustment = (snf - baseSnf) * snfStepDownRateValue;
    }

    // Console logging for debugging
    console.log('=== Pro-Rata Calculation ===');
    console.log('Input:', input);
    console.log('Pro-Rata Applied:', proRataApplied);
    if (proRataApplied) {
      console.log('Fat Step-Up Rate:', fatStepUpRate, '→', fatStepUpRateValue);
      console.log('SNF Step-Down Rate:', snfStepDownRate, '→', snfStepDownRateValue);
      console.log('Fat Adjustment:', fatAdjustment);
      console.log('SNF Adjustment:', snfAdjustment);
      console.log('Final Rate:', finalRate);
    }
    console.log('Calculated Amount:', amount);
    console.log('Solid Weight:', solidWeight);
    console.log('==========================');

    return {
      fat_kg: fatKg,
      snf_kg: snfKg,
      fat_rate: fatRate,
      snf_rate: snfRate,
      solid_weight: solidWeight,
      amount: amount,
      finalRate: finalRate
    };
  };

  /* ============================================================================
     OLD CALCULATION LOGIC - COMMENTED OUT FOR REFERENCE
     This is the previous simple pro rata calculation that only checked fat > 6.5
     ============================================================================
   
  const calculateDerivedValuesOLD = (collection) => {
    const fat = parseFloat(collection.fat_percent) || 0;
    const snf = parseFloat(collection.snf_percent) || 0;
    const weight = parseFloat(collection.weight) || 0;
    const rate = parseFloat(collection.milk_rate) || currentRate || 0;
    const baseSnf = parseFloat(collection.base_snf) || 9.0;
   
    // Calculate fat_kg and snf_kg (same for both calculation methods)
    const fatKg = Math.floor((weight * (fat / 100)) * 100) / 100;
    const snfKg = Math.floor((weight * (snf / 100)) * 100) / 100;
   
    // Get fat/SNF ratio percentages based on selected option
    const fatRatioPercent = fatSnfRatio === '60_40' ? 60 : 52;
    const snfRatioPercent = fatSnfRatio === '60_40' ? 40 : 48;
   
    // Use the dynamic ratio percentages in the calculation
    const fatRate = Math.floor((rate * fatRatioPercent / 6.5) * 100) / 100;
    const snfRate = Math.floor((rate * snfRatioPercent / baseSnf) * 100) / 100;
   
    // Result variables
    let finalRate = rate;
    let amount = 0;
   
    // Pro-rata calculation logic when fat% > 6.5
    if (fat > 6.5) {
      // Parse the step rates
      const fatStepUpRateValue = (parseFloat(fatStepUpRate) * 10) || 0;
      const snfStepDownRateValue = (parseFloat(snfStepDownRate) * 10) || 0;
   
      // Calculate pro-rata adjustments
      const fatAdjustment = (fat - 6.5) * fatStepUpRateValue;
      const snfAdjustment = (snf - 9.0) * snfStepDownRateValue;
   
      // Calculate final rate with pro-rata adjustments
      finalRate = rate + fatAdjustment + snfAdjustment;
   
      // Calculate amount using the pro-rata rate
      amount = Math.floor((finalRate * weight) * 100) / 100;
    }
    // Original calculation logic for fat% <= 6.5
    else {
      // Calculate amount based on fat, snf rates and components
      amount = Math.floor(parseFloat(fatKg) * parseFloat(fatRate) * 100) / 100 +
        Math.floor(parseFloat(snfKg) * parseFloat(snfRate) * 100) / 100;
    }
   
    // Calculate solid weight (same for both methods)
    const solidWeight = (amount / rate).toFixed(3);
   
    return {
      fat_kg: fatKg,
      snf_kg: snfKg,
      fat_rate: fatRate,
      snf_rate: snfRate,
      solid_weight: solidWeight,
      amount: Math.round(amount),
      finalRate: finalRate
    };
  };
   
  ============================================================================ */

  // Add multiple rows at once
  const addCollection = (count = 5) => {
    // Get animal type from global animal type settings
    const animalTypeToUse = globalAnimalType || localStorage.getItem('default_animal_type') || 'cow';

    // Get base SNF from global Rate Settings
    const baseSnfValue = baseSNF || '9.00';

    // Use current rate from state
    const rateToUse = currentRate || 0;

    // Use functional update to ensure we're working with the latest state
    setCollections(prevCollections => {
      const timestamp = Date.now();
      const newCollections = Array.from({ length: count }, (_, index) => ({
        id: `row_${timestamp}_${index}`, // Ensuring unique IDs with timestamp
        customer: null,
        customerDisplay: '',
        fat_percent: '',
        weight: '',
        snf_percent: '',
        clr: '',
        base_snf: baseSnfValue,
        collection_time: globalTime,
        collection_date: globalDate,
        animal_type: animalTypeToUse,
        milk_type: animalTypeToUse,
        measured: 'kg',
        liters: 0,
        kg: 0,
        fat_kg: 0,
        snf_kg: 0,
        milk_rate: rateToUse,
        amount: 0,
        isSnfFromClr: false,
        isManualBaseSnf: false
      }));

      return [...prevCollections, ...newCollections];
    });

    console.log('Adding', count, 'rows to collections');
  };

  // Remove a collection row
  const removeCollection = (id) => {
    console.log('Attempting to remove collection with id:', id);
    console.log('Current collections before removal:', collections);

    // Use functional update to ensure we have the latest state
    setCollections(prevCollections => {
      console.log('Previous collections in functional update:', prevCollections);
      const filtered = prevCollections.filter(c => c.id !== id);
      console.log('Filtered collections after removal:', filtered);
      return filtered;
    });

    // Clear any form errors for this collection
    if (formErrors[id]) {
      setFormErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[id];
        return newErrors;
      });
    }

    console.log('Removal function completed for id:', id);
  };

  // Helper function to check if a row has any data entered
  const rowHasData = (collection) => {
    // Check if any important fields have data
    return !!(
      collection.customer ||
      collection.customerDisplay ||
      collection.fat_percent ||
      collection.weight ||
      collection.snf_percent ||
      collection.clr
    );
  };

  // Handle the delete button click
  const handleDeleteClick = (collection) => {
    // Check if row has data
    if (rowHasData(collection)) {
      // Show confirmation dialog if row has data
      setRowToDelete(collection.id);
      setShowDeleteConfirmation(true);
    } else {
      // Remove immediately if row is empty
      removeCollection(collection.id);
    }
  };

  // Handle customer search - update to use row-specific search queries
  const handleSearch = (rowIndex, query) => {
    // Update the row-specific search query
    setRowSearchQueries(prev => ({
      ...prev,
      [rowIndex]: query
    }));

    // Track the active search row
    setActiveSearchRowIndex(rowIndex);

    // Show the customer list if the query has content - make this row-specific
    setVisibleDropdowns(prev => ({
      ...prev,
      [rowIndex]: query.length > 0
    }));

    // Set the current collection for potential new customer creation
    setCurrentCollection(collections[rowIndex]);

    if (query.length > 0) {
      const filtered = customers.filter(customer => {
        const searchLower = query.toLowerCase();
        return (
          customer.customer_id?.toString().includes(searchLower) ||
          customer.name?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredCustomers(filtered);
      // Reset selected index to 0 (first item) when search results change
      setSelectedCustomerIndex(filtered.length > 0 ? 0 : -1);
    } else {
      setFilteredCustomers([]);
      setSelectedCustomerIndex(-1);
    }
  };

  // Handle customer selection - updated for clarity
  const handleSelectCustomer = (rowIndex, customer) => {
    const updatedCollections = [...collections];
    updatedCollections[rowIndex] = {
      ...updatedCollections[rowIndex],
      customer: customer,
      customerDisplay: `${customer.customer_id} - ${customer.name}`
    };

    setCollections(updatedCollections);

    // Clear search state for this row
    setRowSearchQueries(prev => ({
      ...prev,
      [rowIndex]: ''
    }));

    // Hide dropdown for this specific row
    setVisibleDropdowns(prev => ({
      ...prev,
      [rowIndex]: false
    }));

    setActiveSearchRowIndex(null);
    // Reset the selected customer index
    setSelectedCustomerIndex(-1);

    // Focus on the next cell (weight)
    if (collections.length > rowIndex) {
      const weightCell = document.getElementById(`weight-${rowIndex}`);
      if (weightCell) {
        weightCell.focus();
      }
    }
  };

  // Handle cell focus - updated to support search
  const handleCellFocus = (rowIndex, cellName) => {
    setActiveCell({ rowIndex, cellName });

    // If focusing on a customer cell, set the active search row
    if (cellName === 'customer') {
      setActiveSearchRowIndex(rowIndex);

      // Initialize search query for this row if it doesn't exist
      if (!rowSearchQueries[rowIndex] && !collections[rowIndex].customerDisplay) {
        setRowSearchQueries(prev => ({
          ...prev,
          [rowIndex]: ''
        }));
      } else if (collections[rowIndex].customerDisplay && !rowSearchQueries[rowIndex]) {
        // When focusing on a cell with an existing customer but no search query,
        // initialize the search query as empty to prevent display issues
        setRowSearchQueries(prev => ({
          ...prev,
          [rowIndex]: ''
        }));
      }

      // Show customer list if there's an active search query
      if (rowSearchQueries[rowIndex] && rowSearchQueries[rowIndex].length > 0) {
        handleSearch(rowIndex, rowSearchQueries[rowIndex]);
        // The handleSearch will set selectedCustomerIndex appropriately
      } else {
        // Reset selected index if no search in progress
        setSelectedCustomerIndex(-1);
      }
    } else {
      // If focusing on non-customer cell, hide the dropdown
      setVisibleDropdowns(prev => ({
        ...prev,
        [rowIndex]: false
      }));
      // Reset selected customer index
      setSelectedCustomerIndex(-1);
    }
  };

  // Handle cell blur event - process after user leaves a cell
  const handleCellBlur = (rowIndex, field, value) => {
    // Skip empty values
    if (!value || value.trim() === '') return;

    // Special handling for fat_percent
    if (field === 'fat_percent') {
      // Process the value using new logic
      const processedValue = processDecimalInput(value, 'fat');

      if (processedValue !== value) {
        // Update collection with processed value
        setCollections(collections.map((col, idx) => {
          if (idx === rowIndex) {
            return { ...col, fat_percent: processedValue };
          }
          return col;
        }));
      }

      // Validate the fat percentage and show confirmation for out-of-range values
      const numValue = parseFloat(processedValue);
      if (!isNaN(numValue)) {
        // Check if value is above maximum (15.00) and show confirmation popup
        if (numValue > 15.00) {
          setPercentageConfirmationData({
            rowIndex,
            field: 'fat_percent',
            value: value,
            processedValue: processedValue,
            type: 'high'
          });
          setShowPercentageConfirmation(true);
        }
        // Check if value is below minimum (2.00) and show confirmation popup
        else if (numValue < 2.00) {
          setPercentageConfirmationData({
            rowIndex,
            field: 'fat_percent',
            value: value,
            processedValue: processedValue,
            type: 'low'
          });
          setShowPercentageConfirmation(true);
        }
        else {
          // Clear any previous error for this field
          setFormErrors(prev => {
            const newErrors = { ...prev };

            // Clear any previous error for this field
            if (newErrors[collections[rowIndex].id]) {
              delete newErrors[collections[rowIndex].id].fat_percent;
            }

            // If no errors remain for this collection, remove collection entry
            if (newErrors[collections[rowIndex].id] &&
              Object.keys(newErrors[collections[rowIndex].id]).length === 0) {
              delete newErrors[collections[rowIndex].id];
            }

            return newErrors;
          });
        }
      }

      // Recalculate derived values if we have necessary inputs
      const hasSnf = collections[rowIndex].snf_percent;
      const hasClr = collections[rowIndex].clr;
      const hasWeight = collections[rowIndex].weight;
      const isFatSnf = rateType === 'fat_snf';
      const isFatClr = rateType === 'fat_clr';

      if (hasWeight && hasSnf && isFatSnf) {
        // For fat_snf mode with SNF and weight present
        const updatedCollection = {
          ...collections[rowIndex],
          fat_percent: processedValue
        };
        const derived = calculateDerivedValues(updatedCollection);

        setCollections(collections.map((col, idx) => {
          if (idx === rowIndex) {
            return {
              ...col,
              fat_percent: processedValue,
              fat_kg: derived.fat_kg,
              snf_kg: derived.snf_kg,
              amount: derived.amount,
              fat_rate: derived.fat_rate,
              snf_rate: derived.snf_rate,
              finalRate: derived.finalRate
            };
          }
          return col;
        }));
      } else if (isFatClr && hasClr) {
        // For fat_clr mode with CLR present - recalculate SNF from CLR + new FAT
        const snfValue = calculateSnfFromClr(hasClr, processedValue);
        const updatedCollection = {
          ...collections[rowIndex],
          fat_percent: processedValue,
          snf_percent: snfValue,
          isSnfFromClr: true
        };

        if (hasWeight) {
          // If weight present, calculate all derived values
          const derived = calculateDerivedValues(updatedCollection);
          setCollections(collections.map((col, idx) => {
            if (idx === rowIndex) {
              return {
                ...col,
                fat_percent: processedValue,
                snf_percent: snfValue,
                isSnfFromClr: true,
                fat_kg: derived.fat_kg,
                snf_kg: derived.snf_kg,
                amount: derived.amount,
                fat_rate: derived.fat_rate,
                snf_rate: derived.snf_rate,
                finalRate: derived.finalRate
              };
            }
            return col;
          }));
        } else {
          // Just update SNF without derived values (no weight yet)
          setCollections(collections.map((col, idx) => {
            if (idx === rowIndex) {
              return {
                ...col,
                fat_percent: processedValue,
                snf_percent: snfValue,
                isSnfFromClr: true
              };
            }
            return col;
          }));
        }
      }
    }

    // Special handling for snf_percent
    else if (field === 'snf_percent' && !collections[rowIndex].isSnfFromClr) {
      // Try to convert the value if needed
      const processedValue = processDecimalInput(value, 'snf');

      if (processedValue !== value) {
        // Update the collection with the processed value
        setCollections(collections.map((col, idx) => {
          if (idx === rowIndex) {
            return { ...col, snf_percent: processedValue };
          }
          return col;
        }));
      }

      // Validate the SNF percentage is within acceptable range
      const numValue = parseFloat(processedValue);
      if (!isNaN(numValue)) {
        if (numValue > 15.00) {
          setPercentageConfirmationData({
            rowIndex,
            field: 'snf_percent',
            value,
            processedValue,
            type: 'high'
          });
          setShowPercentageConfirmation(true);
        } else if (numValue < 2.00) {
          setPercentageConfirmationData({
            rowIndex,
            field: 'snf_percent',
            value,
            processedValue,
            type: 'low'
          });
          setShowPercentageConfirmation(true);
        } else {
          setFormErrors(prev => {
            const newErrors = { ...prev };

            // Clear any previous error for this field
            if (newErrors[collections[rowIndex].id]) {
              delete newErrors[collections[rowIndex].id].snf_percent;
            }

            // If no errors remain for this collection, remove the collection entry
            if (newErrors[collections[rowIndex].id] &&
              Object.keys(newErrors[collections[rowIndex].id]).length === 0) {
              delete newErrors[collections[rowIndex].id];
            }

            return newErrors;
          });
        }
      }
    }

    // Special handling for CLR
    else if (field === 'clr') {
      // Try to convert the value if needed
      const processedValue = processDecimalInput(value, 'clr');

      if (processedValue !== value) {
        // Update the collection with the processed value
        setCollections(collections.map((col, idx) => {
          if (idx === rowIndex) {
            return { ...col, clr: processedValue };
          }
          return col;
        }));
      }

      // Validate the CLR value and show confirmation for out-of-range values
      const numValue = parseFloat(processedValue);
      if (!isNaN(numValue)) {
        // Check if CLR is above maximum (35.0) and show confirmation popup
        if (numValue > 35.0) {
          setPercentageConfirmationData({
            rowIndex,
            field: 'clr',
            value: value,
            processedValue: processedValue,
            type: 'high'
          });
          setShowPercentageConfirmation(true);
        }
        // Check if CLR is below minimum (15.0) and show confirmation popup
        else if (numValue < 15.0) {
          setPercentageConfirmationData({
            rowIndex,
            field: 'clr',
            value: value,
            processedValue: processedValue,
            type: 'low'
          });
          setShowPercentageConfirmation(true);
        }
        else {
          // Clear any previous error for this field
          setFormErrors(prev => {
            const newErrors = { ...prev };

            // Clear any previous error for this field
            if (newErrors[collections[rowIndex].id]) {
              delete newErrors[collections[rowIndex].id].clr;
            }

            // If no errors remain for this collection, remove collection entry
            if (newErrors[collections[rowIndex].id] &&
              Object.keys(newErrors[collections[rowIndex].id]).length === 0) {
              delete newErrors[collections[rowIndex].id];
            }

            return newErrors;
          });
        }

        // If we have both CLR and fat, recalculate SNF
        if (collections[rowIndex].fat_percent) {
          // Calculate SNF from CLR and fat
          const snfValue = calculateSnfFromClr(processedValue, collections[rowIndex].fat_percent);

          // Update the collection with the calculated SNF value
          setCollections(collections.map((col, idx) => {
            if (idx === rowIndex) {
              return {
                ...col,
                clr: processedValue, // Ensure processed CLR value is stored
                snf_percent: snfValue,
                isSnfFromClr: true
              };
            }
            return col;
          }));
        }
      }
    }

    // For weight or price_per_unit, recalculate derived values if we have necessary inputs
    else if ((field === 'weight' || field === 'price_per_unit') &&
      collections[rowIndex].fat_percent &&
      ((rateType === 'fat_snf' && collections[rowIndex].snf_percent) ||
        (rateType === 'fat_clr' && collections[rowIndex].clr))) {

      // Recalculate derived values for this collection
      const updatedCollection = { ...collections[rowIndex], [field]: value };
      const derived = calculateDerivedValues(updatedCollection);

      // Update the collection with calculated values
      setCollections(collections.map((col, idx) => {
        if (idx === rowIndex) {
          return {
            ...col,
            fat_kg: derived.fat_kg,
            snf_kg: derived.snf_kg,
            amount: derived.amount
          };
        }
        return col;
      }));
    }
  };

  // Helper function to process decimal input for fat, snf and clr fields
  const processDecimalInput = (value, type) => {
    // For fat, apply the new comprehensive logic
    if (type === 'fat') {
      if (!value || value.trim() === '') return '';

      // Remove any non-digit characters except decimal point
      const cleanValue = value.replace(/[^\d.]/g, '');

      // Handle decimal input
      if (cleanValue.includes('.')) {
        const parts = cleanValue.split('.');
        const integerPart = parts[0] || '0';
        let decimalPart = parts[1] || '';

        // Limit decimal part to 2 digits
        decimalPart = decimalPart.substring(0, 2);

        let finalValue = parseFloat(cleanValue);

        return finalValue.toFixed(2);
      }

      // Handle whole number input - Count digits and apply rules
      if (/^\d+$/.test(cleanValue)) {
        const digitCount = cleanValue.length;
        const numValue = parseInt(cleanValue, 10);
        let finalValue;

        // Apply rules based on digit count
        if (digitCount === 1) {
          // If 1 digit → x.00
          finalValue = numValue;
        } else if (digitCount === 2) {
          // If 2 digits → x.y0
          finalValue = (numValue / 10);
        } else {
          // If 3+ digits → x / 100
          finalValue = (numValue / 100);

          // Special rule: if result < 2.00, multiply by 10
          if (finalValue < 2.00) {
            finalValue = finalValue * 10;
          }
        }

        // Apply range: 2.00 ≤ value ≤ 15.00 (only for validation, not auto-clamping)
        // finalValue = Math.max(2.00, Math.min(15.00, finalValue));

        return finalValue.toFixed(2);
      }

      return '';
    }
    // For snf, apply the original logic
    else if (type === 'snf') {
      // Check if it's a decimal number - keep as-is
      if (value.includes('.')) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          return numValue.toFixed(2);
        }
      }

      // Process whole numbers
      if (/^\d+$/.test(value)) {
        const numValue = parseInt(value, 10);

        // Single digit: convert to decimal (e.g., 6 -> 6.00)
        if (numValue < 10) {
          return numValue.toFixed(2);
        }
        // Two digits or more: divide by 10 (e.g., 61 -> 6.10)
        else {
          return (numValue / 10).toFixed(2);
        }
      }
    }
    // For CLR, we divide by 10 (e.g., 280 -> 28.0, 20 -> 2.0)
    else if (type === 'clr') {
      // If it's already in decimal format with a decimal point, return as is
      if (value.includes('.')) return value;

      // Convert whole numbers to decimal format
      if (/^\d+$/.test(value)) {
        const numValue = parseInt(value, 10);
        // If it's 10-99, keep as-is with one decimal (e.g., 10 -> 10.0, 36 -> 36.0)
        if (numValue >= 10 && numValue <= 99) {
          return numValue.toFixed(1);
        }
        // If it's 100 or more, divide by 10 (e.g., 280 -> 28.0, 100 -> 10.0)
        else if (numValue >= 100) {
          return (numValue / 10).toFixed(1);
        }
        // For single-digit values (1-9), add a decimal (e.g., 9 -> 9.0)
        else {
          return numValue.toFixed(1);
        }
      }
    }

    return value;
  };

  // Handle input changes for any cell
  const handleInputChange = (rowIndex, field, value) => {
    // Handle customer search input separately
    if (field === 'customer') {
      handleSearch(rowIndex, value);
      return;
    }

    setCollections(collections.map((col, idx) => {
      if (idx === rowIndex) {
        const updatedCollection = { ...col };

        // Special handling for fat_percent input
        if (field === 'fat_percent') {
          let cleanValue = value;
          if (value === '') {
            updatedCollection.fat_percent = value;
          } else {
            // Only allow numbers and decimal point
            cleanValue = value.replace(/[^\d.]/g, '');

            // Validate format: numbers with optional decimal (max 2 decimal places)
            if (/^\d*\.?\d{0,2}$/.test(cleanValue)) {
              updatedCollection.fat_percent = cleanValue;
            } else {
              return col; // Invalid input, don't update
            }
          }

          // In fat_clr mode, if we have CLR, recalculate SNF from CLR + new FAT value (APK Logic)
          if (rateType === 'fat_clr' && col.clr && cleanValue) {
            const snfValue = calculateSnfFromClr(col.clr, cleanValue);
            updatedCollection.snf_percent = snfValue;
            updatedCollection.isSnfFromClr = true;
          }
        }

        // Special handling for snf_percent input
        else if (field === 'snf_percent' && rateType === 'fat_snf') {
          if (value === '') {
            updatedCollection.snf_percent = value;
          } else {
            // For whole numbers, just validate they're numeric
            if (/^\d+$/.test(value)) {
              updatedCollection.snf_percent = value;
            }
            // For decimal values, validate format (up to 2 decimal places)
            else if (/^\d*\.?\d{0,2}$/.test(value)) {
              updatedCollection.snf_percent = value;
            } else {
              return col; // Invalid input, don't update
            }
          }
        }

        // Special handling for CLR input
        else if (field === 'clr' && rateType === 'fat_clr') {
          if (value === '') {
            updatedCollection.clr = value;

            // Clear any existing CLR errors for this row
            if (formErrors[col.id]?.clr) {
              setFormErrors(prev => {
                const newErrors = { ...prev };
                if (newErrors[col.id]) {
                  delete newErrors[col.id].clr;
                  if (Object.keys(newErrors[col.id]).length === 0) {
                    delete newErrors[col.id];
                  }
                }
                return newErrors;
              });
            }
          } else {
            // Allow up to 5 characters for decimal values like 25.5 or 23.33
            if (value.length > 5) {
              return col; // Don't update if more than 5 characters
            }

            // For whole numbers, just validate they're numeric
            if (/^\d+$/.test(value)) {
              updatedCollection.clr = value;
            }
            // For decimal values, validate format (up to 2 decimal places)
            else if (/^\d*\.?\d{0,2}$/.test(value)) {
              updatedCollection.clr = value;
            } else {
              return col; // Invalid input, don't update
            }

            // Check for valid CLR range if we have a complete number
            if (value && !value.endsWith('.')) {
              const clrValue = parseFloat(value);
              if (!isNaN(clrValue)) {
                if (clrValue < 13.1 || clrValue > 34.0) {
                  // Set error for CLR value outside acceptable range
                  const errorMessage = clrValue < 13.1 ?
                    `CLR value ${clrValue} is below the minimum (13.1)` :
                    `CLR value ${clrValue} is above the maximum (34.0)`;

                  setFormErrors(prev => {
                    const newErrors = { ...prev };
                    if (!newErrors[col.id]) {
                      newErrors[col.id] = {};
                    }
                    newErrors[col.id].clr = errorMessage;
                    return newErrors;
                  });
                } else {
                  // Clear the error if value is now valid
                  if (formErrors[col.id]?.clr) {
                    setFormErrors(prev => {
                      const newErrors = { ...prev };
                      if (newErrors[col.id]) {
                        delete newErrors[col.id].clr;
                        if (Object.keys(newErrors[col.id]).length === 0) {
                          delete newErrors[col.id];
                        }
                      }
                      return newErrors;
                    });
                  }
                }
              }
            }
          }

          // If we have both fat and CLR, calculate SNF
          if (value && updatedCollection.fat_percent) {
            const snfValue = calculateSnfFromClr(value, updatedCollection.fat_percent);
            updatedCollection.snf_percent = snfValue;
            updatedCollection.isSnfFromClr = true;
          }
        }
        // Special handling for Base SNF input
        else if (field === 'base_snf') {
          if (value === '') {
            updatedCollection.base_snf = value;
          } else {
            // Validate numeric input with 1 decimal place
            if (/^\d*\.?\d{0,1}$/.test(value)) {
              const baseSnfValue = parseFloat(value);
              // Validate range (8.0 to 10.0)
              if (baseSnfValue >= 8.0 && baseSnfValue <= 10.0) {
                updatedCollection.base_snf = value;

                console.log(' ProRata Base SNF changed via dropdown:', value, 'isManual:', true);

                // Mark as manually changed
                updatedCollection.isManualBaseSnf = true;
                console.log(' ProRata row marked as manual:', updatedCollection.id);

                // Clear any existing error
                if (formErrors[col.id]?.base_snf) {
                  setFormErrors(prev => {
                    const newErrors = { ...prev };
                    if (newErrors[col.id]) {
                      delete newErrors[col.id].base_snf;
                      if (Object.keys(newErrors[col.id]).length === 0) {
                        delete newErrors[col.id];
                      }
                    }
                    return newErrors;
                  });
                }
              } else {
                // Set error for out of range value
                setFormErrors(prev => {
                  const newErrors = { ...prev };
                  if (!newErrors[col.id]) {
                    newErrors[col.id] = {};
                  }
                  newErrors[col.id].base_snf = `Base SNF must be between 8.0 and 10.0`;
                  return newErrors;
                });
                return col; // Don't update with invalid value
              }
            } else {
              return col; // Invalid format, don't update
            }
          }
        }
        // All other fields
        else {
          updatedCollection[field] = value;
          if (field === 'animal_type') {
            updatedCollection.milk_type = value;
          }
        }

        // If we've updated weight, rate, fat_percent, snf_percent, or base_snf, recalculate derived values
        if ((field === 'weight' || field === 'price_per_unit' || field === 'fat_percent' ||
          field === 'snf_percent' || field === 'base_snf') && updatedCollection.fat_percent &&
          ((rateType === 'fat_snf' && updatedCollection.snf_percent) ||
            (rateType === 'fat_clr' && updatedCollection.clr))) {

          const derived = calculateDerivedValues(updatedCollection);

          updatedCollection.fat_kg = derived.fat_kg;
          updatedCollection.snf_kg = derived.snf_kg;
          updatedCollection.fat_rate = derived.fat_rate;
          updatedCollection.snf_rate = derived.snf_rate;
          updatedCollection.amount = derived.amount;
          updatedCollection.finalRate = derived.finalRate;
        }

        return updatedCollection;
      }
      return col;
    }));
  };

  // Handle key navigation in the grid
  const handleKeyDown = (e, rowIndex, cellName) => {
    // Updated cells array to include date and time
    const cells = ['collection_date', 'collection_time', 'customer', 'weight', 'fat_percent', 'snf_percent', 'clr', 'milk_rate', 'base_snf', 'animal_type'];
    const currentIndex = cells.indexOf(cellName);

    // Helper function to get the next available cell index (skipping disabled fields)
    const getNextCellIndex = (currentIdx, direction = 1) => {
      let nextIdx = currentIdx + direction;

      // Loop until we find an enabled cell or reach the end/beginning
      while (nextIdx >= 0 && nextIdx < cells.length) {
        const nextCellName = cells[nextIdx];

        // Skip date and time if in single date/shift mode
        if (isSingleDateShiftMode && (nextCellName === 'collection_date' || nextCellName === 'collection_time')) {
          nextIdx += direction;
          continue;
        }

        // Skip SNF field if rate type is fat_clr
        if (nextCellName === 'snf_percent' && rateType === 'fat_clr') {
          nextIdx += direction;
          continue;
        }

        // Skip CLR field if rate type is fat_snf
        if (nextCellName === 'clr' && rateType === 'fat_snf') {
          nextIdx += direction;
          continue;
        }

        // Found an enabled cell
        return nextIdx;
      }

      // If we went past the array boundaries, return the boundary
      return direction > 0 ? cells.length - 1 : 0;
    };

    // Handle customer dropdown navigation when dropdown is visible
    if (cellName === 'customer' && visibleDropdowns[rowIndex] && filteredCustomers.length > 0) {
      // Arrow down - move to next customer in dropdown
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCustomerIndex(prevIndex => {
          const newIndex = prevIndex < filteredCustomers.length - 1 ? prevIndex + 1 : 0;

          // Scroll the selected item into view
          setTimeout(() => {
            const dropdownElement = customerInputRefs.current[rowIndex]?.nextElementSibling;
            if (dropdownElement) {
              const selectedItem = dropdownElement.children[newIndex];
              if (selectedItem) {
                selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }
          }, 0);

          return newIndex;
        });
        return;
      }
      // Arrow up - move to previous customer in dropdown
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCustomerIndex(prevIndex => {
          const newIndex = prevIndex > 0 ? prevIndex - 1 : filteredCustomers.length - 1;

          // Scroll the selected item into view
          setTimeout(() => {
            const dropdownElement = customerInputRefs.current[rowIndex]?.nextElementSibling;
            if (dropdownElement) {
              const selectedItem = dropdownElement.children[newIndex];
              if (selectedItem) {
                selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }
          }, 0);

          return newIndex;
        });
        return;
      }
      // Enter - select the currently highlighted customer
      else if (e.key === 'Enter' && selectedCustomerIndex >= 0) {
        e.preventDefault();
        const selectedCustomer = filteredCustomers[selectedCustomerIndex];
        if (selectedCustomer) {
          handleSelectCustomer(rowIndex, selectedCustomer);
          setSelectedCustomerIndex(-1);
          return;
        }
      }
    }

    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();

      // Move to the next cell in the row, skipping disabled fields
      if (currentIndex < cells.length - 1) {
        const nextCellIndex = getNextCellIndex(currentIndex);
        if (nextCellIndex < cells.length) {
          const nextCell = document.getElementById(`${cells[nextCellIndex]}-${rowIndex}`);
          if (nextCell) {
            nextCell.focus();
          }
        }
      }
      // Move to the first cell in the next row
      else if (rowIndex < collections.length - 1) {
        const firstCellName = isSingleDateShiftMode ? 'customer' : cells[0];
        const nextCell = document.getElementById(`${firstCellName}-${rowIndex + 1}`);
        if (nextCell) {
          nextCell.focus();
        }
      }
      // Add a new row if we're at the last cell of the last row
      else if (rowIndex === collections.length - 1) {
        if (e.target && e.target.blur) e.target.blur();
        addCollection(1);
        setTimeout(() => {
          const firstCellName = isSingleDateShiftMode ? 'customer' : cells[0];
          const nextCell = document.getElementById(`${firstCellName}-${rowIndex + 1}`);
          if (nextCell) {
            nextCell.focus();
          }
        }, 50);
      }
    }
    else if (e.key === 'ArrowDown' && !visibleDropdowns[rowIndex]) {
      e.preventDefault();
      // Move to the same cell in the next row
      if (rowIndex < collections.length - 1) {
        const nextCell = document.getElementById(`${cellName}-${rowIndex + 1}`);
        if (nextCell) {
          nextCell.focus();
        }
      }
    }
    else if (e.key === 'ArrowUp' && !visibleDropdowns[rowIndex]) {
      e.preventDefault();
      // Move to the same cell in the previous row
      if (rowIndex > 0) {
        const prevCell = document.getElementById(`${cellName}-${rowIndex - 1}`);
        if (prevCell) {
          prevCell.focus();
        }
      }
    }
    else if (e.key === 'ArrowRight') {
      e.preventDefault();
      // Move to the next cell in the row, skipping disabled fields
      if (currentIndex < cells.length - 1) {
        const nextCellIndex = getNextCellIndex(currentIndex);
        if (nextCellIndex < cells.length) {
          const nextCell = document.getElementById(`${cells[nextCellIndex]}-${rowIndex}`);
          if (nextCell) {
            nextCell.focus();
          }
        }
      }
      // Move to the first cell in the next row
      else if (rowIndex < collections.length - 1) {
        const firstCellName = isSingleDateShiftMode ? 'customer' : cells[0];
        const nextCell = document.getElementById(`${firstCellName}-${rowIndex + 1}`);
        if (nextCell) {
          nextCell.focus();
        }
      }
      // Add a new row if we're at the last cell of the last row
      else if (rowIndex === collections.length - 1) {
        if (e.target && e.target.blur) e.target.blur();
        addCollection(1);
        setTimeout(() => {
          const firstCellName = isSingleDateShiftMode ? 'customer' : cells[0];
          const nextCell = document.getElementById(`${firstCellName}-${rowIndex + 1}`);
          if (nextCell) {
            nextCell.focus();
          }
        }, 50);
      }
    }
    else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      e.preventDefault();
      // Move to the previous cell in the row, skipping disabled fields
      const prevCellIndex = getNextCellIndex(currentIndex, -1);
      if (prevCellIndex >= 0) {
        const prevCell = document.getElementById(`${cells[prevCellIndex]}-${rowIndex}`);
        if (prevCell) {
          prevCell.focus();
        }
      }
    }
  };

  // Validate a single collection
  const validateCollection = (collection, index) => {
    const errors = {};

    if (!collection.customer || !collection.customer.id) {
      errors.customer = t('customerIsRequired');
    }

    if (!collection.fat_percent) {
      errors.fat_percent = t('fatPercentIsRequired');
    } else if (isNaN(collection.fat_percent) || parseFloat(collection.fat_percent) <= 0) {
      errors.fat_percent = t('validFatPercentIsRequired');
    }

    if (!collection.weight) {
      errors.weight = t('weightIsRequired');
    } else if (isNaN(collection.weight) || parseFloat(collection.weight) <= 0) {
      errors.weight = t('validWeightIsRequired');
    }

    // Validate based on rate type
    if (rateType === 'fat_snf') {
      // For fat_snf rate type, validate SNF
      if (!collection.snf_percent) {
        errors.snf_percent = t('snfPercentIsRequired');
      } else if (isNaN(collection.snf_percent) || parseFloat(collection.snf_percent) <= 0) {
        errors.snf_percent = t('validSnfPercentIsRequired');
      }
    } else if (rateType === 'fat_clr') {
      // For fat_clr rate type, validate CLR
      if (!collection.clr) {
        errors.clr = t('clrIsRequired');
      } else if (isNaN(collection.clr) || parseFloat(collection.clr) <= 0) {
        errors.clr = t('validClrIsRequired');
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // Validate all collections
  const validateAllCollections = () => {
    if (collections.length === 0) {
      setSubmitError(t('pleaseAddAtLeastOneCollection'));
      return false;
    }

    const newErrors = {};
    let hasErrors = false;

    collections.forEach((collection, index) => {
      const collectionErrors = validateCollection(collection, index);
      if (collectionErrors) {
        newErrors[collection.id] = collectionErrors;
        hasErrors = true;
      }
    });

    setFormErrors(newErrors);
    return !hasErrors;
  };

  // Format collections for API submission - ensure values are properly calculated
  const formatCollectionsForSubmission = (collectionsToFormat = collections) => {
    return collectionsToFormat.map(collection => {
      // First, ensure we have calculated derived values
      const derived = calculateDerivedValues(collection);

      // Always use freshly calculated derived values to ensure correctness
      const updatedCollection = {
        ...collection,
        fat_kg: derived.fat_kg,
        snf_kg: derived.snf_kg,
        amount: derived.amount,
        finalRate: derived.finalRate
      };

      // Use values from updated collection
      const fat = parseFloat(updatedCollection.fat_percent) || 0;
      const snf = parseFloat(updatedCollection.snf_percent) || 0;
      const weight = parseFloat(updatedCollection.weight) || 0;
      const milkRate = parseFloat(updatedCollection.milk_rate) || currentRate || 0;

      const liters = Math.floor((weight / 1.02249) * 100) / 100;

      // Use calculated values
      const fatKg = parseFloat(updatedCollection.fat_kg);
      const snfKg = parseFloat(updatedCollection.snf_kg);

      // Calculate fat_rate and snf_rate using same logic as calculateDerivedValues
      const fatRatioPercent = fatSnfRatio === '60_40' ? 60 : 52;
      const snfRatioPercent = fatSnfRatio === '60_40' ? 40 : 48;
      const baseSnf = parseFloat(updatedCollection.base_snf) || 9.00;

      const calculatedFatRate = Math.floor((milkRate * fatRatioPercent / 6.5) * 100) / 100;
      const calculatedSnfRate = Math.floor((milkRate * snfRatioPercent / baseSnf) * 100) / 100;

      // Format milk_type correctly for API - use cow_buffalo instead of mixed
      const milk_type = updatedCollection.animal_type === 'cow+buffalo' ? 'cow_buffalo' : updatedCollection.animal_type;

      // Use the properly calculated final rate and amount
      const effectiveRate = parseFloat(updatedCollection.finalRate) || milkRate;
      const finalAmount = parseFloat(updatedCollection.amount) || 0;

      // For ProRataCollection screen, always set is_pro_rata to true
      // so collections appear in PreviewProRataCollections instead of PreviewCollections
      const isProRata = true;

      // Resolve applied rates from thresholds (same as React Native)
      const appliedFatRate = resolveRateFromFatThresholds(fat, fatStepUpRates);
      const appliedSnfRate = resolveRateFromSnfThresholds(snf, snfStepDownRates);

      // Format the request payload to match React Native format exactly
      return {
        customer: updatedCollection.customer.id,
        collection_time: updatedCollection.collection_time,
        collection_date: updatedCollection.collection_date,
        animal_type: updatedCollection.animal_type,
        milk_type: milk_type,
        measured: 'kg',
        fat_percentage: fat,
        snf_percentage: snf,
        base_snf_percentage: updatedCollection.base_snf, // Include base SNF (use correct API field name)
        clr: parseFloat(updatedCollection.clr) || 0,  // Include CLR value
        clr_conversion_factor: clrConversionFactor, // Include CLR conversion factor used for calculation
        weight: weight,
        kg: weight,
        liters: liters,
        fat_kg: fatKg,
        snf_kg: snfKg,
        fat_rate: calculatedFatRate,
        snf_rate: calculatedSnfRate,
        milk_rate: Math.round(milkRate * 100) / 100, // Send base rate (NOT final calculated rate) - matches React Native
        fat_step_up_rate: parseFloat(appliedFatRate) || 0, // Use threshold-based rate (matches React Native)
        snf_step_down_rate: parseFloat(appliedSnfRate) || 0, // Use threshold-based rate (matches React Native)
        is_pro_rata: isProRata, // Always true for ProRataCollection screen collections
        amount: finalAmount, // Use properly calculated amount
        solid_weight: updatedCollection.solid_weight || (finalAmount / milkRate).toFixed(3)
      };
    });
  };

  // Handle preview before submission
  const handlePreview = (e) => {
    e.preventDefault();

    // Validate all collections first
    if (!validateAllCollections()) {
      // Find collections with errors (prioritize fat_percent and snf_percent errors first)
      const fatErrorCollection = collections.find(collection =>
        formErrors[collection.id]?.fat_percent
      );

      const snfErrorCollection = collections.find(collection =>
        formErrors[collection.id]?.snf_percent
      );

      const clrErrorCollection = collections.find(collection =>
        formErrors[collection.id]?.clr
      );

      // Scroll to and focus the first error field we find, prioritizing fat and snf
      if (fatErrorCollection) {
        // Show error message in the UI
        setSubmitError(formErrors[fatErrorCollection.id].fat_percent);
        // Scroll to the row with error
        const errorRow = document.getElementById(`fat_percent-${collections.indexOf(fatErrorCollection)}`);
        if (errorRow) {
          errorRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorRow.focus();
        }
      } else if (snfErrorCollection) {
        // Show error message in the UI
        setSubmitError(formErrors[snfErrorCollection.id].snf_percent);
        // Scroll to the row with error
        const errorRow = document.getElementById(`snf_percent-${collections.indexOf(snfErrorCollection)}`);
        if (errorRow) {
          errorRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorRow.focus();
        }
      } else if (clrErrorCollection) {
        // Show error message in the UI
        setSubmitError(formErrors[clrErrorCollection.id].clr);
        // Scroll to the row with error
        const errorRow = document.getElementById(`clr-${collections.indexOf(clrErrorCollection)}`);
        if (errorRow) {
          errorRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorRow.focus();
        }
      } else {
        // Find any other error if no fat/snf/clr errors
        const firstErrorCollection = collections.find(collection => formErrors[collection.id]);
        if (firstErrorCollection) {
          // Get the first error field
          const firstErrorField = Object.keys(formErrors[firstErrorCollection.id])[0];
          // Show error message in the UI
          setSubmitError(formErrors[firstErrorCollection.id][firstErrorField]);
          // Attempt to scroll to the row with error
          const rowIndex = collections.indexOf(firstErrorCollection);
          const errorRow = document.getElementById(`${firstErrorField}-${rowIndex}`);
          if (errorRow) {
            errorRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorRow.focus();
          }
        }
      }
      return;
    }

    // Ensure all collections have calculated values before showing preview
    const updatedCollections = collections.map(collection => {
      const derived = calculateDerivedValues(collection);
      return {
        ...collection,
        fat_kg: derived.fat_kg,
        snf_kg: derived.snf_kg,
        amount: derived.amount,
        finalRate: derived.finalRate,
        fat_rate: derived.fat_rate,
        snf_rate: derived.snf_rate,
        solid_weight: derived.solid_weight
      };
    });

    // Update collections state with calculated values
    setCollections(updatedCollections);

    // Show preview modal - it will use the updated collections state
    setShowPreviewModal(true);
  };

  // Handle final submission
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    setShowPreviewModal(false);

    try {
      // Capture current collections state at the start to prevent date changes during submission
      const currentCollections = [...collections];
      const formattedCollections = formatCollectionsForSubmission(currentCollections);

      // Log formatted collections for debugging
      console.log('Formatted collections for API:', formattedCollections);

      // Additional validation before submission
      const invalidCollections = formattedCollections.filter(
        c => !c.customer || !c.fat_percentage || !c.snf_percentage || !c.weight
      );

      if (invalidCollections.length > 0) {
        console.error('Invalid collections detected:', invalidCollections);
        setSubmitError(t('someCollectionsHaveInvalidData'));
        setSubmitting(false);
        return;
      }

      // Submit collections one by one
      let successCount = 0;

      // Set initial progress tracking
      setSubmissionTotal(formattedCollections.length);
      setSubmissionProgress(0);

      for (let i = 0; i < formattedCollections.length; i++) {
        try {
          // Submit a single collection
          await createBulkCollections([formattedCollections[i]]);

          // Increment success counter
          successCount++;

          // Update progress
          setSubmissionProgress(successCount);

          // Remove the submitted collection from the state using captured snapshot
          setCollections(prevCollections => {
            // Find the collection with the matching customer ID and remove it
            const collectionToRemove = currentCollections[i];
            return prevCollections.filter(c => c.id !== collectionToRemove.id);
          });

          // Update progress message only (not final success yet)
          setCurrentSubmitMessage(`${t('collection')} ${i + 1} ${t('of')} ${formattedCollections.length} ${t('submitted')}`);

        } catch (error) {
          console.error(`Error submitting collection ${i + 1}:`, error);
          setSubmitError(t('failedToSubmitCollection').replace('{customer}', currentCollections[i].customerDisplay || t('customer')).replace('{error}', error.error || 'Unknown error'));
          break; // Stop on first error
        }
      }

      if (successCount === formattedCollections.length) {
        // All collections were submitted successfully
        setSubmitError('');
        if (formattedCollections.length > 1) {
          setCurrentSubmitMessage(`${successCount} ${t('collectionsSubmittedSuccessfully')} (${successCount} entries)`);
        } else {
          const customerName = currentCollections[0]?.customerDisplay || t('customer');
          setCurrentSubmitMessage(`Collection for ${customerName} (1 entry) submitted successfully!`);
        }
        setSubmitSuccess(true);
        // Auto-refresh wallet balance after successful collection
        refreshWalletBalance();
        setTimeout(() => {
          setSubmitSuccess(false);
          // Page will not auto-refresh after successful collection
        }, 15000);
      }

    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(error.error || t('someCollectionsHaveInvalidData'));
    } finally {
      setSubmitting(false);
      // Reset progress tracking
      setSubmissionProgress(0);
      setSubmissionTotal(0);
    }
  };

  // Go back to dashboard
  const goBack = () => {
    navigate('/dashboard');
  };

  // Function to save individual milk rate in rate settings modal
  const saveIndividualMilkRateProRata = async () => {
    const parsedRate = parseFloat(currentRate);
    if (!isNaN(parsedRate) && parsedRate >= 0) {
      try {
        setSubmitting(true);
        console.log('Saving individual milk rate (Pro Rata Collection):', parsedRate);

        // Call API to update the rate in the backend
        await updateMarketPrice(parsedRate);

        console.log('Individual milk rate saved successfully (Pro Rata Collection):', parsedRate);

        // Show success message
        setSubmitSuccess(true);
        setCurrentSubmitMessage(t('milkRateUpdatedSuccessfully'));
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);

        // Exit editing mode
        setIsEditingRate(false);
      } catch (error) {
        console.error('Error updating milk rate (Pro Rata Collection):', error);
        setSubmitError(t('errorSavingMilkRate'));
        setTimeout(() => {
          setSubmitError('');
        }, 3000);
      } finally {
        setSubmitting(false);
      }
    } else {
      // If invalid, exit editing mode
      setIsEditingRate(false);
    }
  };

  // Handle rate edit toggle
  const toggleRateEdit = async () => {
    if (isEditingRate) {
      // Save the edited rate if it's valid
      const parsedRate = parseFloat(customRate);
      if (!isNaN(parsedRate) && parsedRate >= 0) {
        try {
          setSubmitting(true);
          // Call API to update the rate in the backend
          await updateMarketPrice(parsedRate);
          setCurrentRate(parsedRate);
          // Update all collection amounts with the new rate
          updateCollectionAmounts(parsedRate);
        } catch (error) {
          console.error('Error updating milk rate:', error);
          setSubmitError(error.error || t('failedToUpdateMilkRate'));
          // Revert to the previous rate
          setCustomRate(currentRate.toString());
        } finally {
          setSubmitting(false);
        }
      } else {
        // If invalid, revert to current rate
        setCustomRate(currentRate.toString());
      }
    }
    setIsEditingRate(!isEditingRate);
  };

  // Handle rate type toggle and update
  const toggleRateType = async () => {
    if (isEditingRateType) {
      try {
        setSubmittingRateType(true);

        // Call API to update only the rate type using PATCH
        const rateTypeData = {
          dairy_name: dairyInfo?.dairy_name || 'Default Dairy', // Include existing dairy name to avoid backend validation
          rate_type: rateType
        };
        console.log('DEBUG: Rate type data to save:', rateTypeData);
        const response = await patchDairyInfo(dairyInfo?.id, rateTypeData);

        // Update local state with response instead of refreshing
        setDairyInfo(response);

        // Update all collections based on the new rate type
        updateCollectionsForRateType(rateType);

        setSubmitSuccess(true);
        setCurrentSubmitMessage(t('rateTypeUpdatedSuccessfully'));
        setRateTypeChanged(false); // Reset the changed flag after successful submission
        setRateTypeUserChanged(false); // Reset user changed flag as well
        setIsEditingRateType(false); // Exit edit mode after successful submission
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      } catch (error) {
        console.error('Error updating rate type:', error);
        setSubmitError(error.error || t('failedToUpdateRateType'));
      } finally {
        setSubmittingRateType(false);
      }
    } else {
      setIsEditingRateType(true);
    }
  };

  // Update all collections when rate type changes
  const updateCollectionsForRateType = (newRateType) => {
    if (collections.length === 0) return;

    const updatedCollections = collections.map(collection => {
      let updatedCollection = { ...collection };

      // If changing to fat_clr, calculate SNF from CLR if possible
      if (newRateType === 'fat_clr' && collection.fat_percent && collection.clr) {
        const calculatedSnf = calculateSnfFromClr(collection.clr, collection.fat_percent);
        updatedCollection.snf_percent = calculatedSnf.toString();
        updatedCollection.isSnfFromClr = true;
      }
      // If changing to fat_snf, keep SNF as is but remove isSnfFromClr flag
      else if (newRateType === 'fat_snf') {
        updatedCollection.isSnfFromClr = false;
      }

      // Recalculate derived values if we have the necessary data
      if (updatedCollection.fat_percent &&
        ((newRateType === 'fat_snf' && updatedCollection.snf_percent) ||
          (newRateType === 'fat_clr' && updatedCollection.clr)) &&
        updatedCollection.weight) {

        const derived = calculateDerivedValues(updatedCollection);
        updatedCollection = {
          ...updatedCollection,
          fat_kg: derived.fat_kg,
          snf_kg: derived.snf_kg,
          amount: derived.amount
        };
      }

      return updatedCollection;
    });

    setCollections(updatedCollections);
  };

  // Handle custom rate input change
  const handleRateChange = (e) => {
    setCustomRate(e.target.value);
  };

  // Handle rate type selection change with auto-save AND manual submit support
  const handleRateTypeChange = async (e) => {
    const newRateType = e.target.value;
    setRateType(newRateType);
    setRateTypeChanged(true); // Enable submit button when rate type changes
    setRateTypeUserChanged(true);

    // Auto-save to backend
    setSubmittingRateType(true);

    try {
      // Prepare data for updating the dairy info
      const rateTypeData = {
        dairy_name: dairyInfo?.dairy_name || 'Default Dairy', // Include existing dairy name to avoid backend validation
        rate_type: newRateType
      };

      // Call API to update the rate type immediately (auto-save)
      const response = await patchDairyInfo(dairyInfo?.id, rateTypeData);

      // Update local state with response
      setDairyInfo(response);

      // Update all collections based on the new rate type
      updateCollectionsForRateType(newRateType);

      // Show success feedback for auto-save
      setSubmitSuccess(true);
      setCurrentSubmitMessage(t('rateTypeAutoSavedSuccessfully'));
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 2000);

      // Reset changed flag after successful auto-save
      setRateTypeChanged(false);
      setRateTypeUserChanged(false);
    } catch (error) {
      console.error('Error auto-saving rate type:', error);
      setSubmitError(error.error || t('failedToAutoSaveRateType'));
      // Don't revert on auto-save error - let user try manual submit
    } finally {
      setSubmittingRateType(false);
    }
  };

  // Handle fat/SNF ratio selection change
  // eslint-disable-next-line no-unused-vars
  const handleFatSnfRatioChange = (e) => {
    const newRatio = e.target.value;
    setFatSnfRatio(newRatio);

    // Update all collections with the new ratio if needed
    if (collections.length > 0) {
      updateCollectionAmountsWithProRata();
    }
  };

  // Update amounts in all collections when global rate changes
  const updateCollectionAmounts = (newRate) => {
    if (collections.length === 0) return;
    console.log('Updating collections with new rate:', newRate);

    const updatedCollections = collections.map(collection => {
      // For empty collections or ones that match the old rate, update to the new rate
      if (!collection.milk_rate || collection.milk_rate === currentRate || collection.milk_rate === '0') {
        const updatedCollection = {
          ...collection,
          milk_rate: newRate
        };

        // Only recalculate derived values if we have the required data
        if (updatedCollection.fat_percent && updatedCollection.snf_percent && updatedCollection.weight) {
          const derived = calculateDerivedValues(updatedCollection);
          return {
            ...updatedCollection,
            fat_kg: derived.fat_kg,
            snf_kg: derived.snf_kg,
            amount: derived.amount
          };
        }

        return updatedCollection;
      }
      return collection;
    });

    setCollections(updatedCollections);
  };

  // Handle creating a new customer - update to work with new search functionality
  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) {
      setSubmitError(t('customerNameRequired'));
      return;
    }

    try {
      setSubmitting(true);

      // Format phone number to remove any +91 prefix
      const formattedPhone = newCustomer.phone ? newCustomer.phone.replace(/^\+91/, '') : '';

      const customerData = {
        ...newCustomer,
        phone: formattedPhone
      };

      // Call API to create customer
      const response = await createCustomer(customerData);

      // Update customers list
      await fetchCustomers();

      // Select the new customer for the current collection
      if (response && currentCollection) {
        const index = collections.findIndex(c => c.id === currentCollection.id);
        if (index !== -1) {
          handleSelectCustomer(index, response);

          // Clear search query for this row
          setRowSearchQueries(prev => ({
            ...prev,
            [index]: ''
          }));

          // Ensure dropdown is hidden for this row
          setVisibleDropdowns(prev => ({
            ...prev,
            [index]: false
          }));
        }
      }

      // Reset form and close modal
      setNewCustomer({
        name: '',
        father_name: '',
        phone: '',
        village: '',
        address: '',
      });
      setShowNewCustomerModal(false);

      // Show success message
      setCurrentSubmitMessage(t('newCustomerCreatedSuccessfully').replace('{name}', response.name));
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error creating customer:', error);
      setSubmitError(error.error || t('failedToCreateCustomer'));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle new customer form input changes
  const handleNewCustomerInputChange = (field, value) => {
    setNewCustomer({
      ...newCustomer,
      [field]: value
    });
  };

  // Edit Supplier modal handlers
  const handleOpenEditSupplierModal = () => {
    setShowEditSupplierModal(true);
    setSelectedSupplierForEdit(null);
    setEditSupplierSearchQuery('');
    setEditSupplierData({
      name: '',
      father_name: '',
      phone: '',
      village: '',
      address: '',
    });
  };

  const handleSelectSupplierForEdit = (customer) => {
    setSelectedSupplierForEdit(customer);
    setEditSupplierData({
      name: customer.name || '',
      father_name: customer.father_name || '',
      phone: customer.phone || '',
      village: customer.village || '',
      address: customer.address || '',
    });
  };

  const handleEditSupplierInputChange = (field, value) => {
    setEditSupplierData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateSupplier = async () => {
    if (!selectedSupplierForEdit) return;

    if (!editSupplierData.name.trim()) {
      setSubmitError(t('supplierNameIsRequired'));
      return;
    }

    try {
      setSubmitting(true);

      const formattedPhone = editSupplierData.phone ? editSupplierData.phone.replace(/^\+91/, '') : '';

      const customerData = {
        name: editSupplierData.name,
        father_name: editSupplierData.father_name,
        phone: formattedPhone,
        village: editSupplierData.village,
        address: editSupplierData.address,
      };

      await updateCustomer(selectedSupplierForEdit.id, customerData);

      await fetchCustomers();

      setShowEditSupplierModal(false);
      setSelectedSupplierForEdit(null);
      setEditSupplierSearchQuery('');
      setEditSupplierData({
        name: '',
        father_name: '',
        phone: '',
        village: '',
        address: '',
      });

      setCurrentSubmitMessage(t('supplierXUpdatedSuccessfully', { name: customerData.name }));
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error updating supplier:', error);
      setSubmitError(error.error || t('failedToUpdateSupplier'));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle global date change - apply to all rows, while keeping rows individually editable
  const handleGlobalDateChange = (e) => {
    const newDate = e.target.value;
    setGlobalDate(newDate);

    // Update collection_date for all existing rows
    setCollections(prevCollections =>
      prevCollections.map(col => ({
        ...col,
        collection_date: newDate
      }))
    );
  };

  // Handle global time change - apply to all rows, while keeping rows individually editable
  const handleGlobalTimeChange = (e) => {
    const newTime = e.target.value;
    setGlobalTime(newTime);

    // Update collection_time for all existing rows
    setCollections(prevCollections =>
      prevCollections.map(col => ({
        ...col,
        collection_time: newTime
      }))
    );
  };

  // Handle global animal type change - apply to all rows, while keeping rows individually editable
  const handleGlobalAnimalTypeChange = (e) => {
    const newAnimalType = e.target.value;
    setGlobalAnimalType(newAnimalType);
    setAnimalType(newAnimalType); // Keep the modal state in sync
    localStorage.setItem('default_animal_type', newAnimalType);

    // Update animal_type and milk_type for all existing rows
    setCollections(prevCollections =>
      prevCollections.map(col => ({
        ...col,
        animal_type: newAnimalType,
        milk_type: newAnimalType
      }))
    );
  };

  // Handle global base SNF change - apply to all rows, while keeping rows individually editable
  const handleGlobalBaseSNFChange = (e) => {
    const newBaseSNF = e.target.value;
    setGlobalBaseSNF(newBaseSNF);

    // Update base_snf for all existing rows
    setCollections(prevCollections =>
      prevCollections.map(col => ({
        ...col,
        base_snf: newBaseSNF
      }))
    );
  };

  // Handle milk rate change modal
  const handleRateChangeSubmit = async () => {
    if (!newMilkRate || parseFloat(newMilkRate) <= 0) {
      setSubmitError(t('pleaseEnterAValidMilkRate'));
      return;
    }

    try {
      setSubmitting(true);

      // Update the market price in backend
      await updateMarketPrice(parseFloat(newMilkRate));

      // Update current rate state
      setCurrentRate(parseFloat(newMilkRate));

      // Update all collections with the new rate
      setCollections(prevCollections =>
        prevCollections.map(col => ({
          ...col,
          milk_rate: parseFloat(newMilkRate)
        }))
      );

      // Close modal and reset
      setShowRateChangeModal(false);
      setNewMilkRate('');
      setSubmitError('');

      // Show success message
      setCurrentSubmitMessage(t('milkRateUpdatedToXSuccessfully', { rate: newMilkRate }));
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error updating milk rate:', error);
      setSubmitError(error.error || t('failedToUpdateMilkRate'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRateChangeModalClose = () => {
    setShowRateChangeModal(false);
    setNewMilkRate('');
    setSubmitError('');
  };

  // Handle fat step up rate change
  // eslint-disable-next-line no-unused-vars
  const handleFatStepUpRateChange = (e) => {
    const newRate = e.target.value;
    setFatStepUpRate(newRate);

    // Update all collections with the new fat rate if needed
    if (collections.length > 0) {
      updateCollectionAmountsWithProRata();
    }
  };

  // Handle SNF step down rate change
  // eslint-disable-next-line no-unused-vars
  const handleSnfStepDownRateChange = (e) => {
    const newRate = e.target.value;
    setSnfStepDownRate(newRate);

    // Update all collections with the new SNF rate if needed
    if (collections.length > 0) {
      updateCollectionAmountsWithProRata();
    }
  };

  // Update all collections using the pro-rata calculation
  const updateCollectionAmountsWithProRata = () => {
    if (collections.length === 0) return;

    setCollections(prevCollections =>
      prevCollections.map(collection => {
        // Skip if we don't have both fat and SNF values
        if (!collection.fat_percent || (!collection.snf_percent && rateType === 'fat_snf')) {
          return collection;
        }

        // Recalculate derived values with the updated pro-rata rates
        const derived = calculateDerivedValues(collection);

        return {
          ...collection,
          fat_kg: derived.fat_kg,
          snf_kg: derived.snf_kg,
          amount: derived.amount
        };
      })
    );
  };

  // Update functions for rate chart inputs with 2-decimal formatting
  const updateFatThreshold = (index, field, value) => {
    const next = [...fatStepUpRates];

    if (field === 'step') {
      // Sanitize input for decimal handling
      const formattedValue = sanitizeDecimal(value);
      const numValue = parseFloat(formattedValue);

      // Allow empty value or continue typing
      if (formattedValue === '' || isNaN(numValue)) {
        next[index] = { ...next[index], [field]: formattedValue };
        setFatStepUpRates(next);
        return;
      }

      // Validation logic
      if (numValue > 12) {
        alert(t('fatStepCannotBeGreaterThan12'));
        return;
      }

      // Partial input handling while typing
      let isPartialInput = formattedValue.endsWith('.'); // "6." is partial
      if (formattedValue.length === 1 && !formattedValue.includes('.')) {
        isPartialInput = true; // Allow single digits while typing
      }

      if (!isPartialInput) {
        // Validate order (must be greater than existing thresholds)
        const existingThresholds = [];
        for (let i = 0; i < next.length; i++) {
          if (i !== index && next[i].step && next[i].step !== '') {
            const val = parseFloat(next[i].step);
            if (!isNaN(val)) {
              existingThresholds.push(val);
            }
          }
        }

        if (existingThresholds.length > 0) {
          const maxExisting = Math.max(...existingThresholds);
          if (numValue <= maxExisting) {
            alert(t('fatStepMustBeGreaterThanPreviousSteps'));
            return;
          }
        }
      }

      next[index] = { ...next[index], [field]: formattedValue };
    } else {
      // For rate field - apply sanitization
      next[index] = { ...next[index], [field]: sanitizeDecimal(value) };
    }

    setFatStepUpRates(next);
  };

  const updateSnfThreshold = (index, field, value) => {
    const next = [...snfStepDownRates];

    if (field === 'step') {
      const formattedValue = sanitizeDecimal(value);
      const numValue = parseFloat(formattedValue);

      // Allow empty value or continue typing
      if (formattedValue === '' || isNaN(numValue)) {
        next[index] = { ...next[index], [field]: formattedValue };
        setSnfStepDownRates(next);
        return;
      }

      // Validation logic
      if (numValue < 7 || numValue > 12) {
        alert(t('snfStepMustBeBetween7And12'));
        return;
      }

      // Partial input handling while typing
      let isPartialInput = formattedValue.endsWith('.'); // "9." is partial
      if (formattedValue.length === 1 && !formattedValue.includes('.')) {
        isPartialInput = true; // Allow single digits while typing
      }

      if (!isPartialInput) {
        // Validate order (must be less than existing thresholds for descending order)
        const existingThresholds = [];
        for (let i = 0; i < next.length; i++) {
          if (i !== index && next[i].step && next[i].step !== '') {
            const val = parseFloat(next[i].step);
            if (!isNaN(val)) {
              existingThresholds.push(val);
            }
          }
        }

        if (existingThresholds.length > 0) {
          const minExisting = Math.min(...existingThresholds);
          if (numValue >= minExisting) {
            alert(t('snfStepMustBeLessThanPreviousSteps'));
            return;
          }
        }
      }

      next[index] = { ...next[index], [field]: formattedValue };
    } else {
      // For rate field - apply sanitization
      next[index] = { ...next[index], [field]: sanitizeDecimal(value) };
    }

    setSnfStepDownRates(next);
  };

  if (loading || isLoadingRate) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="bulk-collection-v1-container">
      <Navbar
        title={t('proRataCollections')}
        onBack={goBack}
        showProfile={true}
        userInfo={userInfo}
        dairyInfo={dairyInfo}
        loadingInfo={loadingInfo}
        pageName="proRataCollection"
        onSupportClick={() => setShowSupportModal(true)}
      />

      <div className='wallet-rate-card'>
        {/* Wallet Info - Top Right */}
        <div>
          <div className="bulk-dairy-info-item" style={{ marginRight: "100px" }}>
            <div className="bulk-dairy-info-icon-wrapper">
              <FontAwesomeIcon icon={faStore} className="bulk-dairy-info-icon" />
            </div>
            <div className="bulk-dairy-info-content">
              {/* <div className="bulk-dairy-info-name">{t('dairyName')}:</div> */}
              <div className="bulk-dairy-info-value">{dairyInfo?.dairy_name || t('notAvailable')}</div>
            </div>
          </div>
          <div className="bulk-dairy-info-item">
            <div className="bulk-dairy-info-icon-wrapper">
              <FontAwesomeIcon icon={faUser} className="bulk-dairy-info-icon" />
            </div>
            <div className="bulk-dairy-info-content">
              {/* <div className="bulk-dairy-info-name">{t('ownerName')}:</div> */}
              <div className="bulk-dairy-info-value">{userInfo?.name || t('notAvailable')}</div>
            </div>
          </div>
          <div className="bulk-dairy-info-item">
            <div className="bulk-dairy-info-icon-wrapper">
              <FontAwesomeIcon icon={faPhone} className="bulk-dairy-info-icon" />
            </div>
            <div className="bulk-dairy-info-content">
              {/* <div className="bulk-dairy-info-name">{t('phoneNumber')}:</div> */}
              <div className="bulk-dairy-info-value">{userInfo?.phone_number || t('notAvailable')}</div>
            </div>
          </div>
          <div className="wallet-info">
            <FontAwesomeIcon icon={faWallet} className="icon-wallet" />
            <span className="wallet-recharge-link" onClick={() => setShowAddMoneyModal(true)}>{t('walletRecharge')}</span>
            <span className='wallet-amount'>{walletBalance !== null && walletBalance !== undefined
              ? `${t('currency')}${parseFloat(walletBalance).toFixed(2)}`
              : t('notAvailable')}</span>
          </div>
        </div>

        {/* Rate Settings and Rate Chart */}
        <div className="dairy-info-wrapper">
          {/* Rate Settings Card */}
          <div className="rate-settings-modern-ui-card" onClick={() => openRateSettingsModal()}>
            <div className="rate-settings-modern-header">
              <div className="rate-settings-title-section">
                <div className="rate-settings-icon-bg">
                  <FontAwesomeIcon icon={faCog} className="rate-settings-main-icon" />
                </div>
                <div>
                  <h3 className="rate-settings-modern-title">{t('rateSettings')}</h3>
                  <p className="rate-settings-subtitle">{t('configureYourMilkCalculationParameters')}</p>
                </div>
              </div>
              <button
                className="rate-settings-modern-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openRateSettingsModal();
                }}
              >
                <FontAwesomeIcon icon={faEdit} />
                <span>{t('edit')}</span>
              </button>
            </div>

            <div className="rate-settings-modern-content">
              <div className="dairy-info-row">
                <div className="dairy-info-modern-item">
                  <div className="dairy-info-icon-wrapper">
                    <FontAwesomeIcon icon={faCog} className="dairy-info-icon" />
                  </div>
                  <div className="dairy-info-content">
                    <div className="dairy-info-name">{t('baseSNF')}</div>
                    <div className="dairy-info-value">{baseSNF}</div>
                  </div>
                </div>
                <div className="dairy-info-modern-item">
                  <div className="dairy-info-icon-wrapper">
                    <FontAwesomeIcon icon={faArrowRight} className="dairy-info-icon" />
                  </div>
                  <div className="dairy-info-content">
                    <div className="dairy-info-name">{t('clrConversion')}</div>
                    <div className="dairy-info-value">{clrConversionFactor}</div>
                  </div>
                </div>
                <div className="dairy-info-modern-item">
                  <div className="dairy-info-icon-wrapper">
                    <FontAwesomeIcon icon={faChartBar} className="dairy-info-icon" />
                  </div>
                  <div className="dairy-info-content">
                    <div className="dairy-info-name">{t('fatSnfRatio')}</div>
                    <div className="dairy-info-value">{fatSnfRatio.replace('_', '/')}</div>
                  </div>
                </div>
                <div className="dairy-info-modern-item">
                  <div className="dairy-info-icon-wrapper">
                    <FontAwesomeIcon icon={faTag} className="dairy-info-icon" />
                  </div>
                  <div className="dairy-info-content">
                    <div className="dairy-info-name">{t('rateType')}</div>
                    <div className="dairy-info-value">{rateType === 'fat_snf' ? 'Fat & SNF' : rateType === 'fat_clr' ? 'Fat & CLR' : 'Fixed Rate'}</div>
                  </div>
                </div>
                <div className="dairy-info-modern-item">
                  <div className="dairy-info-icon-wrapper">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="dairy-info-icon" />
                  </div>
                  <div className="dairy-info-content">
                    <div className="dairy-info-name">{t('milkRate')}</div>
                    <div className="dairy-info-value highlight">₹{currentRate || '0.00'}</div>
                  </div>
                </div>
                <div className="dairy-info-modern-item">
                  <div className="dairy-info-icon-wrapper">
                    <FontAwesomeIcon icon={faTag} className="dairy-info-icon" />
                  </div>
                  <div className="dairy-info-content">
                    <div className="dairy-info-name">{t('animalType')}</div>
                    <div className="dairy-info-value">{animalType === 'cow' ? t('cow') : animalType === 'buffalo' ? t('buffalo') : t('mix')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* rate chart card */}
          <div className="rate-chart-modern-card">
            <div className="rate-chart-header">
              <div className="rate-chart-title-section">
                <div className="rate-chart-icon-wrapper">
                  <FontAwesomeIcon icon={faChartBar} style={{ color: '#fff' }} />
                </div>
                <div>
                  <p className="rate-chart-subtitle" style={{ color: '#dddddd' }}>{t('proRata')}</p>
                  <h3 className="rate-chart-title">{t('rateChart')}</h3>
                </div>
              </div>
              <button
                className="rate-settings-modern-btn"
                onClick={() => setShowRateChartModal(true)}
              >
                <FontAwesomeIcon icon={faChartBar} />
                <span>{t('set')}</span>
              </button>
            </div>
            <div className="rate-chart-list" onClick={() => setShowRateChartModal(true)}>
              <div className="rate-settings-single-row">
                {!isRateChartConfigured && (
                  <div className="rate-setting-modern-item rate-chart-warning-item">
                    <div className="setting-icon-wrapper">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="setting-icon warning-icon" />
                    </div>
                    <div className="setting-content">
                      <div className="setting-name">{t('status')}</div>
                      <div className="setting-modern-value warning-text-rate-chart">{t('setTheRateChart')}</div>
                    </div>
                  </div>
                )}
                <div className="rate-setting-modern-item">
                  <div className="setting-icon-wrapper">
                    <FontAwesomeIcon icon={faChartBar} className="setting-icon" />
                  </div>
                  <div className="setting-content">
                    <div className="setting-name">{t('fatStepUp')}</div>
                    <div className="setting-modern-value">{isRateChartConfigured && fatStepUpRates.length > 0 ? `${fatStepUpRates[0].step}% at ${formatTo2Decimal(fatStepUpRates[0].rate)}` : 'not set'}</div>
                  </div>
                </div>
                <div className="rate-setting-modern-item">
                  <div className="setting-icon-wrapper">
                    <FontAwesomeIcon icon={faChartBar} className="setting-icon" />
                  </div>
                  <div className="setting-content">
                    <div className="setting-name">{t('snfStepDown')}</div>
                    <div className="setting-modern-value">{isRateChartConfigured && snfStepDownRates.length > 0 ? `${snfStepDownRates[0].step}% at ${formatTo2Decimal(snfStepDownRates[0].rate)}` : 'not set'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Rate Chart Setup Warning */}
        {rateChartLoaded && !isRateChartConfigured && !isRateChartWarningDismissed && (
          <div className="modal-overlay" onClick={() => setShowRateChartModal(true)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="rate-chart-warning-container">
                <div className="rate-chart-warning-card">
                  <div className="warning-icon-wrapper">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="warning-icon" />
                  </div>
                  <div className="warning-content">
                    <h4 className="warning-title">{t('rateChartRequired')}</h4>
                    <p className="warning-message">
                      {t('pleaseSetUpYourRateChartFirst')}
                    </p>
                    <div className="warning-buttons">
                      <button
                        className="warning-action-button"
                        onClick={() => setShowRateChartModal(true)}
                      >
                        <FontAwesomeIcon icon={faChartBar} />
                        <span>{t('setUpRateChart')}</span>
                      </button>
                      <button
                        className="warning-cancel-button"
                        onClick={handleRateChartWarningDismiss}
                      >
                        <span>{t('cancel')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Low Balance Alert Popup */}
      {
        showLowBalanceAlert && (
          <div className="alert-popup-overlay">
            <div className="alert-popup">
              <div className="alert-popup-header">
                <FontAwesomeIcon icon={faExclamationCircle} className="alert-icon" />
                <h3>{t('lowWalletBalance')}</h3>
                <button
                  className="close-alert-button"
                  onClick={() => setShowLowBalanceAlert(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="alert-popup-body">
                <p>{t('walletBalanceLowMessage')}</p>
                <p className="alert-balance">{t('currentBalance')}:
                  <span className="low-balance-amount">
                    ₹{walletBalance !== null && walletBalance !== undefined
                      ? parseFloat(walletBalance).toFixed(2)
                      : '0.00'}
                  </span>
                </p>
              </div>
              <div className="alert-popup-footer">
                <button
                  className="close-alert-btn"
                  onClick={() => setShowLowBalanceAlert(false)}
                >
                  {t('dismiss')}
                </button>
              </div>
            </div>
          </div>
        )
      }

      <div className="bulk-collection-content">
        {submitSuccess && (
          <div className="success-message-centered">
            <FontAwesomeIcon icon={faCheck} />
            <span>{currentSubmitMessage || t('collectionsSubmittedSuccessfully')}</span>
            <button
              className="success-message-close-btn"
              onClick={() => setSubmitSuccess(false)}
              title="Close message"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        {submitError && (
          <div className="error-message">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <span>{submitError}</span>
            <button className="close-error" onClick={() => setSubmitError('')}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}


        <form onSubmit={handlePreview} noValidate>
          <div className={`csv-grid-container ${!isRateChartConfigured ? 'disabled-form' : ''}`}>
            {/* Excel-like toolbar */}
            <div className="excel-toolbar">
              <div className="toolbar-left">
                <button
                  type="button"
                  className="add-row-button"
                  onClick={() => {
                    console.log('Add 1 Row button clicked');
                    addCollection(1);
                  }}
                  disabled={!isRateChartConfigured}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>{t('add1Row')}</span>
                </button>

                <button
                  type="button"
                  className="add-row-button"
                  onClick={() => {
                    console.log('Add 5 Rows button clicked');
                    addCollection(5);
                  }}
                  disabled={!isRateChartConfigured}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>{t('add5Rows')}</span>
                </button>

                <div className="date-shift-toggle-group">
                  <button
                    type="button"
                    className={`date-shift-toggle-btn ${isSingleDateShiftMode ? 'active' : ''}`}
                    onClick={() => setIsSingleDateShiftMode(true)}
                    title="Skip Date and Shift columns when navigating"
                  >
                    {t('singleDateShift')}
                  </button>
                  <button
                    type="button"
                    className={`date-shift-toggle-btn ${!isSingleDateShiftMode ? 'active' : ''}`}
                    onClick={() => setIsSingleDateShiftMode(false)}
                    title="Stop at Date and Shift columns when navigating"
                  >
                    {t('multiDateShift')}
                  </button>
                </div>
              </div>

              {/* in bulk add date and time */}
              {/* <div className="toolbar-global-settings">
                <div className="global-setting">
                  <label>Collection Date (for all rows):</label>
                  <div className="date-input-wrapper">
                    <input
                      type="date"
                      value={globalDate}
                      onChange={handleGlobalDateChange}
                      className="global-input"
                      onClick={(e) => {
                        e.target.showPicker && e.target.showPicker();
                      }}
                    />
                  </div>
                </div>

                <div className="global-setting">
                  <label>Collection Time (for all rows):</label>
                  <select
                    value={globalTime}
                    onChange={handleGlobalTimeChange}
                    className="global-input"
                  >
                    <option value="morning">Morning</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>
              </div> */}

              <div className="toolbar-right">
                {/* <button
                  type="button"
                  className="add-customer-button global-button"
                  onClick={() => {
                    setCurrentCollection(null);
                    setShowNewCustomerModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>{t('addNewCustomer')}</span>
                </button> */}
                <button
                  type="button"
                  className="add-customer-button global-button edit-supplier-btn"
                  onClick={handleOpenEditSupplierModal}
                  style={{ marginLeft: '8px', backgroundColor: '#4CAF50' }}
                >
                  <FontAwesomeIcon icon={faEdit} />
                  <span>{t('editSupplier')}</span>
                </button>

              </div>


              {collections.length > 0 && (
                <button
                  type="submit"
                  className="mobile-submit-button"
                  disabled={submitting || !isRateChartConfigured}
                >
                  <FontAwesomeIcon icon={faEye} />
                  <span>{t('previewAndSubmit')}</span>
                </button>

              )}
            </div>

            {/* True Excel-style table */}
            <table className="excel-table">
              <thead>
                <tr>
                  {/* S.No column */}
                  <th>{t('serialNumber')}</th>
                  <th onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Create simple date input card
                    const existingCard = document.getElementById('date-input-card');
                    if (existingCard) {
                      document.body.removeChild(existingCard);
                      return;
                    }

                    const card = document.createElement('div');
                    card.id = 'date-input-card';
                    card.style.position = 'absolute';
                    card.style.background = 'white';
                    card.style.border = '2px solid #ccc';
                    card.style.borderRadius = '8px';
                    card.style.padding = '12px';
                    card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    card.style.zIndex = '1000';

                    const rect = e.currentTarget.getBoundingClientRect();
                    const isMobile = window.innerWidth <= 768;

                    // Position above header on both mobile and desktop
                    if (isMobile) {
                      // Center the card on mobile, closer to header
                      card.style.left = '50%';
                      card.style.transform = 'translateX(-50%)';
                      card.style.top = `500px`;
                      card.style.width = '80%';
                      card.style.maxWidth = '250px';
                      card.style.padding = '8px';
                    } else {
                      // Position above header on desktop, closer to header
                      card.style.left = `${rect.left}px`;
                      card.style.top = `${rect.top + window.scrollY - 70}px`;
                    }

                    const input = document.createElement('input');
                    input.type = 'date';
                    input.value = globalDate;
                    input.style.fontSize = isMobile ? '14px' : '16px';
                    input.style.padding = isMobile ? '6px' : '8px';
                    input.style.border = '1px solid #ddd';
                    input.style.borderRadius = '4px';
                    input.style.marginRight = '8px';

                    const applyBtn = document.createElement('button');
                    applyBtn.textContent = t('apply');
                    applyBtn.style.padding = isMobile ? '6px 12px' : '8px 16px';
                    applyBtn.style.background = '#007bff';
                    applyBtn.style.color = 'white';
                    applyBtn.style.border = 'none';
                    applyBtn.style.borderRadius = '4px';
                    applyBtn.style.cursor = 'pointer';
                    applyBtn.style.fontSize = isMobile ? '14px' : '16px';

                    applyBtn.onclick = () => {
                      const newDate = input.value;
                      if (newDate) {
                        setGlobalDate(newDate);
                        const updatedCollections = collections.map(collection => ({
                          ...collection,
                          collection_date: newDate
                        }));
                        setCollections(updatedCollections);
                      }
                      document.body.removeChild(card);
                    };

                    card.appendChild(input);
                    card.appendChild(applyBtn);
                    document.body.appendChild(card);
                    input.focus();

                    // Close on click outside
                    setTimeout(() => {
                      document.addEventListener('click', function closeCard(event) {
                        if (!card.contains(event.target)) {
                          if (document.body.contains(card)) {
                            document.body.removeChild(card);
                          }
                          document.removeEventListener('click', closeCard);
                        }
                      });
                    }, 100);
                  }} style={{ cursor: 'pointer', position: 'relative' }}>
                    <FontAwesomeIcon icon={faEdit} style={{ fontSize: '14px', marginRight: '8px', opacity: '0.7' }} />
                    {t('date')}
                  </th>
                  <th>
                    <select
                      onChange={handleGlobalTimeChange}
                      className="global-time-header-select"
                      aria-label="Select global time"
                      value=""
                      style={{ border: 'none', textDecoration: 'none' }}
                    >
                      <option value="" disabled>{t('shift')}</option>
                      <option value="morning">{t('morning')}</option>
                      <option value="evening">{t('evening')}</option>
                    </select>
                  </th>
                  <th>{t('supplier')}</th>
                  <th>{t('weightKg')}</th>
                  <th>{t('fatPercent')}</th>
                  <th>{t('snfPercent')}</th>
                  <th>{t('clr')}</th>
                  <th onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowRateChangeModal(true);
                  }} style={{ cursor: 'pointer', position: 'relative' }}>
                    <FontAwesomeIcon icon={faEdit} style={{ fontSize: '14px', marginRight: '8px', opacity: '0.7' }} />
                    {t('milkRate')}
                  </th>
                  <th>
                    <select
                      onChange={handleGlobalBaseSNFChange}
                      className="global-base-snf-header-select"
                      aria-label="Select global base SNF"
                      value=""
                      style={{ border: 'none', textDecoration: 'none' }}
                    >
                      <option value="" disabled>{t('baseSnf')}</option>
                      <option value="8.5">8.5</option>
                      <option value="9.0">9.0</option>
                      <option value="9.1">9.1</option>
                      <option value="9.2">9.2</option>
                      <option value="9.3">9.3</option>
                      <option value="9.4">9.4</option>
                      <option value="9.5">9.5</option>
                    </select>
                  </th>
                  <th>
                    <select
                      onChange={handleGlobalAnimalTypeChange}
                      className="global-animal-type-header-select"
                      aria-label="Select global animal type"
                      value=""
                      style={{ border: 'none', textDecoration: 'none' }}
                    >
                      <option value="" disabled>{t('animal')}</option>
                      <option value="cow">{t('cow')}</option>
                      <option value="buffalo">{t('buffalo')}</option>
                      <option value="cow+buffalo">{t('cowBuffalo')}</option>
                    </select>
                  </th>
                  <th>{t('delete')}</th>
                </tr>
              </thead>
              <tbody>
                {collections.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan="12" className="empty-message">
                      {t('noDataYetClickAddRow')}
                    </td>
                  </tr>
                ) : (
                  collections.map((collection, rowIndex) => (
                    <tr key={collection.id} className={`data-row ${!isRateChartConfigured ? 'disabled-row' : ''}`}>
                      {/* Serial Number */}
                      <td className="serial-number-cell">
                        {rowIndex + 1}
                      </td>

                      {/* Date */}
                      <td>
                        <div className="date-input-wrapper">
                          <input
                            id={`collection_date-${rowIndex}`}
                            type="date"
                            value={collection.collection_date}
                            onChange={(e) => handleInputChange(rowIndex, 'collection_date', e.target.value)}
                            onFocus={() => handleCellFocus(rowIndex, 'collection_date')}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, 'collection_date')}
                            className="excel-cell-input"
                            disabled={!isRateChartConfigured}
                            onClick={(e) => {
                              // Ensure event propagation and native date picker behavior
                              e.target.showPicker && e.target.showPicker();
                            }}
                          />
                        </div>
                      </td>

                      {/* Time */}
                      <td>
                        <select
                          id={`collection_time-${rowIndex}`}
                          value={collection.collection_time}
                          onChange={(e) => handleInputChange(rowIndex, 'collection_time', e.target.value)}
                          onFocus={() => handleCellFocus(rowIndex, 'collection_time')}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, 'collection_time')}
                          className="excel-cell-select"
                          disabled={!isRateChartConfigured}
                        >
                          <option value="morning">{t('morning')}</option>
                          <option value="evening">{t('evening')}</option>
                        </select>
                      </td>

                      {/* Customer */}
                      <td className={formErrors[collection.id]?.customer ? 'has-error' : ''}>
                        <div className="customer-search-cell">
                          <input
                            id={`customer-${rowIndex}`}
                            type="text"
                            value={
                              // If this row has an active search, show the search query
                              // Otherwise show the selected customer display name
                              (activeSearchRowIndex === rowIndex && rowSearchQueries[rowIndex] !== undefined) ?
                                rowSearchQueries[rowIndex] :
                                collection.customerDisplay || ''
                            }
                            onChange={(e) => handleSearch(rowIndex, e.target.value)}
                            onFocus={() => handleCellFocus(rowIndex, 'customer')}
                            onBlur={(e) => handleCellBlur(rowIndex, 'customer', e.target.value)}
                            placeholder={t('searchSupplier')}
                            className="excel-cell-input"
                            ref={el => customerInputRefs.current[rowIndex] = el}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, 'customer')}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                          />
                          {/* Use row-specific dropdown visibility */}
                          {visibleDropdowns[rowIndex] && (
                            <div className="excel-dropdown">
                              {filteredCustomers.length > 0 ? (
                                <>
                                  {filteredCustomers.map((customer, index) => (
                                    <div
                                      key={customer.id}
                                      className={`dropdown-item ${selectedCustomerIndex === index ? 'selected' : ''}`}
                                      onMouseDown={(e) => {
                                        // Using onMouseDown instead of onClick prevents blur before selection
                                        e.preventDefault();
                                        handleSelectCustomer(rowIndex, customer);
                                      }}
                                      // Add hover handler to update selected index
                                      onMouseEnter={() => setSelectedCustomerIndex(index)}
                                    >
                                      {customer.customer_id} - {customer.name}
                                    </div>
                                  ))}
                                  <div
                                    className="dropdown-item add-new"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setCurrentCollection(collection);
                                      setShowNewCustomerModal(true);
                                      // Hide dropdown for this specific row
                                      setVisibleDropdowns(prev => ({
                                        ...prev,
                                        [rowIndex]: false
                                      }));
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faPlus} /> {t('addNewSupplier')}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="no-results">{t('noSupplierFound')}</div>
                                  <div
                                    className="dropdown-item add-new"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setCurrentCollection(collection);
                                      setShowNewCustomerModal(true);
                                      // Hide dropdown for this specific row
                                      setVisibleDropdowns(prev => ({
                                        ...prev,
                                        [rowIndex]: false
                                      }));
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faPlus} /> {t('addNewSupplier')}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                          {formErrors[collection.id]?.customer && (
                            <div className="cell-error">{formErrors[collection.id].customer}</div>
                          )}
                        </div>
                      </td>

                      {/* Weight (kg) */}
                      <td className={formErrors[collection.id]?.weight ? 'has-error' : ''}>
                        <input
                          id={`weight-${rowIndex}`}
                          type="number"
                          step="0.1"
                          min="0"
                          value={collection.weight}
                          onChange={(e) => handleInputChange(rowIndex, 'weight', e.target.value)}
                          onFocus={() => handleCellFocus(rowIndex, 'weight')}
                          onBlur={(e) => handleCellBlur(rowIndex, 'weight', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, 'weight')}
                          placeholder="e.g. 10.5"
                          className="excel-cell-input"
                        />
                        {formErrors[collection.id]?.weight && (
                          <div className="cell-error">{formErrors[collection.id].weight}</div>
                        )}
                      </td>

                      <td className={formErrors[collection.id]?.fat_percent ? 'has-error' : ''}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input
                            id={`fat_percent-${rowIndex}`}
                            type="text"
                            value={collection.fat_percent}
                            onChange={(e) => handleInputChange(rowIndex, 'fat_percent', e.target.value)}
                            onFocus={() => handleCellFocus(rowIndex, 'fat_percent')}
                            onBlur={(e) => handleCellBlur(rowIndex, 'fat_percent', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, 'fat_percent')}
                            placeholder="e.g. 35 ➞ 3.5"
                            className="excel-cell-input"
                            style={{ paddingRight: getFatWarningText(collection) ? '24px' : '4px' }}
                          />
                          {getFatWarningText(collection) && (
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveWarning(activeWarning?.rowIndex === rowIndex && activeWarning?.field === 'fat_percent' ? null : { rowIndex, field: 'fat_percent' });
                              }}
                              style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', color: '#ff3b30', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center' }}
                            >
                              <FontAwesomeIcon icon={faExclamationTriangle} />
                            </span>
                          )}
                          {activeWarning && activeWarning.rowIndex === rowIndex && activeWarning.field === 'fat_percent' && getFatWarningText(collection) && (
                            <div 
                              onClick={(e) => e.stopPropagation()} 
                              style={{
                                position: 'absolute',
                                bottom: '100%',
                                right: '0',
                                marginBottom: '8px',
                                backgroundColor: '#ffffff',
                                color: '#212529',
                                border: '1px solid #ffc107',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                fontSize: '13px',
                                zIndex: 100,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                minWidth: '180px',
                                maxWidth: '240px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                                <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc3545', marginTop: '2px' }} />
                                <div style={{ flex: 1, fontWeight: '500', lineHeight: '1.4', textAlign: 'left' }}>
                                  {getFatWarningText(collection)}
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setActiveWarning(null); }}
                                  style={{ background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer', fontSize: '16px', padding: '0 4px', marginTop: '-4px' }}
                                >
                                  &times;
                                </button>
                              </div>
                              <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: '10px',
                                width: '0',
                                height: '0',
                                borderLeft: '6px solid transparent',
                                borderRight: '6px solid transparent',
                                borderTop: '6px solid #ffc107'
                              }} />
                              <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: '10px',
                                marginTop: '-1px',
                                width: '0',
                                height: '0',
                                borderLeft: '6px solid transparent',
                                borderRight: '6px solid transparent',
                                borderTop: '6px solid #ffffff'
                              }} />
                            </div>
                          )}
                        </div>
                        {formErrors[collection.id]?.fat_percent && (
                          <div className="cell-error">{formErrors[collection.id].fat_percent}</div>
                        )}
                      </td>

                      {/* SNF % */}
                      <td className={formErrors[collection.id]?.snf_percent ? 'has-error' : ''}>
                        <div className={collection.isSnfFromClr || rateType === 'fat_clr' ? 'calculated-cell' : ''} style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                          <input
                            id={`snf_percent-${rowIndex}`}
                            type="text"
                            value={collection.snf_percent}
                            onChange={(e) => handleInputChange(rowIndex, 'snf_percent', e.target.value)}
                            onFocus={() => handleCellFocus(rowIndex, 'snf_percent')}
                            onBlur={(e) => handleCellBlur(rowIndex, 'snf_percent', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, 'snf_percent')}
                            placeholder="e.g. 85 ➞ 8.5"
                            className={`excel-cell-input ${rateType === 'fat_clr' ? 'auto-calculated' : ''}`}
                            readOnly={collection.isSnfFromClr || rateType === 'fat_clr'}
                            disabled={rateType === 'fat_clr'}
                            style={{ paddingRight: getSnfWarningText(collection) ? '24px' : '4px' }}
                          />
                          {collection.isSnfFromClr && <span className="calc-indicator">*</span>}
                          {getSnfWarningText(collection) && (
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveWarning(activeWarning?.rowIndex === rowIndex && activeWarning?.field === 'snf_percent' ? null : { rowIndex, field: 'snf_percent' });
                              }}
                              style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', color: '#ff3b30', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center' }}
                            >
                              <FontAwesomeIcon icon={faExclamationTriangle} />
                            </span>
                          )}
                          {activeWarning && activeWarning.rowIndex === rowIndex && activeWarning.field === 'snf_percent' && getSnfWarningText(collection) && (
                            <div 
                              onClick={(e) => e.stopPropagation()} 
                              style={{
                                position: 'absolute',
                                bottom: '100%',
                                right: '0',
                                marginBottom: '8px',
                                backgroundColor: '#ffffff',
                                color: '#212529',
                                border: '1px solid #ffc107',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                fontSize: '13px',
                                zIndex: 100,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                minWidth: '180px',
                                maxWidth: '240px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                                <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc3545', marginTop: '2px' }} />
                                <div style={{ flex: 1, fontWeight: '500', lineHeight: '1.4', textAlign: 'left' }}>
                                  {getSnfWarningText(collection)}
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setActiveWarning(null); }}
                                  style={{ background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer', fontSize: '16px', padding: '0 4px', marginTop: '-4px' }}
                                >
                                  &times;
                                </button>
                              </div>
                              <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: '10px',
                                width: '0',
                                height: '0',
                                borderLeft: '6px solid transparent',
                                borderRight: '6px solid transparent',
                                borderTop: '6px solid #ffc107'
                              }} />
                              <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: '10px',
                                marginTop: '-1px',
                                width: '0',
                                height: '0',
                                borderLeft: '6px solid transparent',
                                borderRight: '6px solid transparent',
                                borderTop: '6px solid #ffffff'
                              }} />
                            </div>
                          )}
                        </div>
                        {formErrors[collection.id]?.snf_percent && (
                          <div className="cell-error">{formErrors[collection.id].snf_percent}</div>
                        )}
                      </td>

                      {/* CLR */}
                      <td className={formErrors[collection.id]?.clr ? 'has-error' : ''}>
                        <div className={rateType === 'fat_snf' ? 'disabled-field' : ''} style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                          <input
                            id={`clr-${rowIndex}`}
                            type="text"
                            value={collection.clr}
                            onChange={(e) => handleInputChange(rowIndex, 'clr', e.target.value)}
                            onFocus={() => handleCellFocus(rowIndex, 'clr')}
                            onBlur={(e) => handleCellBlur(rowIndex, 'clr', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, 'clr')}
                            placeholder="e.g. 27.5 (15.0 - 35.0)"
                            className={`excel-cell-input ${rateType === 'fat_snf' ? 'disabled-input' : ''}`}
                            disabled={rateType === 'fat_snf'}
                            readOnly={rateType === 'fat_snf'}
                            style={{ paddingRight: getClrWarningText(collection) ? '24px' : '4px' }}
                          />
                          {rateType === 'fat_snf' && <span className="disabled-indicator">N/A</span>}
                          {getClrWarningText(collection) && (
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveWarning(activeWarning?.rowIndex === rowIndex && activeWarning?.field === 'clr' ? null : { rowIndex, field: 'clr' });
                              }}
                              style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', color: '#ff3b30', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center' }}
                            >
                              <FontAwesomeIcon icon={faExclamationTriangle} />
                            </span>
                          )}
                          {activeWarning && activeWarning.rowIndex === rowIndex && activeWarning.field === 'clr' && getClrWarningText(collection) && (
                            <div 
                              onClick={(e) => e.stopPropagation()} 
                              style={{
                                position: 'absolute',
                                bottom: '100%',
                                right: '0',
                                marginBottom: '8px',
                                backgroundColor: '#ffffff',
                                color: '#212529',
                                border: '1px solid #ffc107',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                fontSize: '13px',
                                zIndex: 100,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                minWidth: '180px',
                                maxWidth: '240px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                                <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc3545', marginTop: '2px' }} />
                                <div style={{ flex: 1, fontWeight: '500', lineHeight: '1.4', textAlign: 'left' }}>
                                  {getClrWarningText(collection)}
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setActiveWarning(null); }}
                                  style={{ background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer', fontSize: '16px', padding: '0 4px', marginTop: '-4px' }}
                                >
                                  &times;
                                </button>
                              </div>
                              <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: '10px',
                                width: '0',
                                height: '0',
                                borderLeft: '6px solid transparent',
                                borderRight: '6px solid transparent',
                                borderTop: '6px solid #ffc107'
                              }} />
                              <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: '10px',
                                marginTop: '-1px',
                                width: '0',
                                height: '0',
                                borderLeft: '6px solid transparent',
                                borderRight: '6px solid transparent',
                                borderTop: '6px solid #ffffff'
                              }} />
                            </div>
                          )}
                        </div>
                        {formErrors[collection.id]?.clr && (
                          <div className="cell-error">{formErrors[collection.id].clr}</div>
                        )}
                      </td>

                      {/* Milk Rate */}
                      <td>
                        <input
                          id={`milk_rate-${rowIndex}`}
                          type="number"
                          step="0.1"
                          min="0"
                          value={collection.milk_rate || ''}
                          onChange={(e) => handleInputChange(rowIndex, 'milk_rate', e.target.value)}
                          onFocus={() => handleCellFocus(rowIndex, 'milk_rate')}
                          onBlur={(e) => handleCellBlur(rowIndex, 'milk_rate', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, 'milk_rate')}
                          placeholder="Rate"
                          className="excel-cell-input"
                          style={{
                            MozAppearance: 'textfield !important',
                            WebkitAppearance: 'none !important',
                            appearance: 'none !important'
                          }}
                          onWheel={(e) => e.target.blur()}
                        />
                      </td>

                      {/* Base SNF */}
                      <td>
                        <select
                          id={`base_snf-${rowIndex}`}
                          value={collection.base_snf}
                          onChange={(e) => handleInputChange(rowIndex, 'base_snf', e.target.value)}
                          onFocus={() => handleCellFocus(rowIndex, 'base_snf')}
                          onBlur={(e) => handleCellBlur(rowIndex, 'base_snf', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, 'base_snf')}
                          className="excel-cell-select"
                        >
                          <option value={baseSNF}>{baseSNF}</option>
                          <option value="8.5">8.5</option>
                          <option value="9.0">9.0</option>
                          <option value="9.1">9.1</option>
                          <option value="9.2">9.2</option>
                          <option value="9.3">9.3</option>
                          <option value="9.4">9.4</option>
                          <option value="9.5">9.5</option>
                        </select>
                      </td>

                      {/* Animal Type */}
                      <td>
                        <select
                          id={`animal_type-${rowIndex}`}
                          value={collection.animal_type}
                          onChange={(e) => handleInputChange(rowIndex, 'animal_type', e.target.value)}
                          onFocus={() => handleCellFocus(rowIndex, 'animal_type')}
                          onBlur={(e) => handleCellBlur(rowIndex, 'animal_type', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, 'animal_type')}
                          className="excel-cell-select"
                        >
                          <option value="cow">{t('cow')}</option>
                          <option value="buffalo">{t('buffalo')}</option>
                          <option value="cow+buffalo">{t('cowBuffalo')}</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td>
                        <button
                          type="button"
                          className="delete-row-btn"
                          onClick={() => handleDeleteClick(collection)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {
                collections.length > 0 && (() => {
                  const activeFatRows = collections.filter(c => c.fat_percent && !isNaN(parseFloat(c.fat_percent)));
                  const avgFatVal = activeFatRows.length > 0
                    ? (activeFatRows.reduce((sum, c) => sum + parseFloat(c.fat_percent), 0) / activeFatRows.length).toFixed(2)
                    : '0.00';

                  const activeSnfRows = collections.filter(c => c.snf_percent && !isNaN(parseFloat(c.snf_percent)));
                  const avgSnfVal = activeSnfRows.length > 0
                    ? (activeSnfRows.reduce((sum, c) => sum + parseFloat(c.snf_percent), 0) / activeSnfRows.length).toFixed(2)
                    : '0.00';

                  const avgFatLabel = t('avgFat') === 'avgFat' ? 'Avg Fat' : t('avgFat');
                  const avgSnfLabel = t('avgSnf') === 'avgSnf' ? 'Avg SNF' : t('avgSnf');

                  return (
                    <tfoot>
                      <tr className="total-row">
                        <td colSpan="4" className="total-label">{t('totalWeight')}</td>
                        <td className="total-value weight-total">
                          {collections.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0).toFixed(2)} kg
                        </td>
                        <td className="total-value" title={avgFatLabel} style={{ color: '#e67e22', backgroundColor: '#fdf6e2', textAlign: 'center', verticalAlign: 'middle', padding: '2px 4px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#1a252f', fontWeight: '800', lineHeight: '1.1' }}>{avgFatLabel}%</span>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2' }}>{avgFatVal}%</span>
                          </div>
                        </td>
                        <td className="total-value" title={avgSnfLabel} style={{ color: '#9b59b6', backgroundColor: '#f3e9f7', textAlign: 'center', verticalAlign: 'middle', padding: '2px 4px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#1a252f', fontWeight: '800', lineHeight: '1.1' }}>{avgSnfLabel}%</span>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2' }}>{avgSnfVal}%</span>
                          </div>
                        </td>
                        <td colSpan="2" className="total-label">{t('totalRecords')}</td>
                        <td className="total-value" colSpan="3">
                          {collections.filter(c => rowHasData(c)).length}
                        </td>
                      </tr>
                    </tfoot>
                  );
                })()
              }
            </table >
          </div >
        </form >
      </div >

      {/* Preview Modal */}
      {
        showPreviewModal && (
          <div className="probulk-modal-overlay">
            <div className="probulk-preview-modal">
              <div className="probulk-modal-header">
                <div>
                  <h2>{t('previewCollections')}</h2>
                  <p className="probulk-modal-subtitle">{dairyInfo?.dairy_name || 'Dairy'} - View Only</p>
                </div>
                <button
                  className="probulk-close-modal-button"
                  onClick={() => setShowPreviewModal(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="probulk-modal-body">
                <div className="probulk-preview-header">
                  <p className="probulk-preview-info">{t('pleaseReviewCollections')}</p>
                </div>

                <div className="probulk-preview-table-container">
                  <table className="probulk-preview-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Shift</th>
                        <th>Supplier</th>
                        <th>Weight</th>
                        <th>Fat %</th>
                        <th>SNF %</th>
                        <th>CLR</th>
                        <th>Fat KG</th>
                        <th>SNF KG</th>
                        <th>Rate</th>
                        <th>Base SNF</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collections.map((collection, index) => {
                        // Calculate derived values for accurate ProRata amounts
                        const calculatedValues = calculateDerivedValues(collection);

                        // eslint-disable-next-line no-unused-vars
                        const fat = parseFloat(collection.fat_percent) || 0;
                        // eslint-disable-next-line no-unused-vars
                        const snf = parseFloat(collection.snf_percent) || 0;
                        // Determine if pro-rata applies
                        const isProRata = collection.is_pro_rata;

                        return (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{collection.collection_date}</td>
                            <td>{collection.collection_time === 'morning' ? 'Morning' : 'Evening'}</td>
                            <td>{collections[index].customerDisplay}</td>
                            <td>{parseFloat(collection.weight).toFixed(2)} kg</td>
                            <td style={{ position: 'relative' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span>{parseFloat(collection.fat_percent).toFixed(2)}%</span>
                                {isProRata && (
                                  <span style={{
                                    color: '#0066cc',
                                    fontWeight: 'bold',
                                    fontSize: '11px',
                                  }}>*</span>
                                )}
                                {getFatWarningText(collection) && (
                                  <span 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveWarning(activeWarning?.rowIndex === index && activeWarning?.field === 'preview_fat' ? null : { rowIndex: index, field: 'preview_fat' });
                                    }}
                                    style={{ color: '#ff3b30', cursor: 'pointer' }}
                                  >
                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                  </span>
                                )}
                                {activeWarning && activeWarning.rowIndex === index && activeWarning.field === 'preview_fat' && getFatWarningText(collection) && (
                                  <div 
                                    onClick={(e) => e.stopPropagation()} 
                                    style={{
                                      position: 'absolute',
                                      bottom: '100%',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      marginBottom: '8px',
                                      backgroundColor: '#ffffff',
                                      color: '#212529',
                                      border: '1px solid #ffc107',
                                      borderRadius: '6px',
                                      padding: '8px 12px',
                                      fontSize: '13px',
                                      zIndex: 100,
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                      minWidth: '180px',
                                      maxWidth: '240px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                                      <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc3545', marginTop: '2px' }} />
                                      <div style={{ flex: 1, fontWeight: '500', lineHeight: '1.4', textAlign: 'left' }}>
                                        {getFatWarningText(collection)}
                                      </div>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setActiveWarning(null); }}
                                        style={{ background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer', fontSize: '16px', padding: '0 4px', marginTop: '-4px' }}
                                      >
                                        &times;
                                      </button>
                                    </div>
                                    <div style={{
                                      position: 'absolute',
                                      top: '100%',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      width: '0',
                                      height: '0',
                                      borderLeft: '6px solid transparent',
                                      borderRight: '6px solid transparent',
                                      borderTop: '6px solid #ffc107'
                                    }} />
                                    <div style={{
                                      position: 'absolute',
                                      top: '100%',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      marginTop: '-1px',
                                      width: '0',
                                      height: '0',
                                      borderLeft: '6px solid transparent',
                                      borderRight: '6px solid transparent',
                                      borderTop: '6px solid #ffffff'
                                    }} />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ position: 'relative' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span>{parseFloat(collection.snf_percent).toFixed(2)}%</span>
                                {getSnfWarningText(collection) && (
                                  <span 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveWarning(activeWarning?.rowIndex === index && activeWarning?.field === 'preview_snf' ? null : { rowIndex: index, field: 'preview_snf' });
                                    }}
                                    style={{ color: '#ff3b30', cursor: 'pointer' }}
                                  >
                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                  </span>
                                )}
                                {activeWarning && activeWarning.rowIndex === index && activeWarning.field === 'preview_snf' && getSnfWarningText(collection) && (
                                  <div 
                                    onClick={(e) => e.stopPropagation()} 
                                    style={{
                                      position: 'absolute',
                                      bottom: '100%',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      marginBottom: '8px',
                                      backgroundColor: '#ffffff',
                                      color: '#212529',
                                      border: '1px solid #ffc107',
                                      borderRadius: '6px',
                                      padding: '8px 12px',
                                      fontSize: '13px',
                                      zIndex: 100,
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                      minWidth: '180px',
                                      maxWidth: '240px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                                      <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc3545', marginTop: '2px' }} />
                                      <div style={{ flex: 1, fontWeight: '500', lineHeight: '1.4', textAlign: 'left' }}>
                                        {getSnfWarningText(collection)}
                                      </div>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setActiveWarning(null); }}
                                        style={{ background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer', fontSize: '16px', padding: '0 4px', marginTop: '-4px' }}
                                      >
                                        &times;
                                      </button>
                                    </div>
                                    <div style={{
                                      position: 'absolute',
                                      top: '100%',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      width: '0',
                                      height: '0',
                                      borderLeft: '6px solid transparent',
                                      borderRight: '6px solid transparent',
                                      borderTop: '6px solid #ffc107'
                                    }} />
                                    <div style={{
                                      position: 'absolute',
                                      top: '100%',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      marginTop: '-1px',
                                      width: '0',
                                      height: '0',
                                      borderLeft: '6px solid transparent',
                                      borderRight: '6px solid transparent',
                                      borderTop: '6px solid #ffffff'
                                    }} />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>{collection.clr ? parseFloat(collection.clr).toFixed(1) : '-'}</td>
                            <td>{parseFloat(calculatedValues.fat_kg).toFixed(2)} kg</td>
                            <td>{parseFloat(calculatedValues.snf_kg).toFixed(2)} kg</td>
                            <td>
                              {isProRata ? (
                                <div>
                                  <span style={{ color: '#0066cc', fontWeight: 'bold' }}>
                                    ₹{parseFloat(calculatedValues.finalRate).toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <>₹{parseFloat(collection.milk_rate).toFixed(2)}</>
                              )}
                            </td>
                            <td>{collection.base_snf ? parseFloat(collection.base_snf).toFixed(2) : '-'}</td>
                            <td>₹{parseFloat(calculatedValues.amount).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      {(() => {
                        const activeFatRows = collections.filter(c => c.fat_percent && !isNaN(parseFloat(c.fat_percent)));
                        const avgFatVal = activeFatRows.length > 0
                          ? (activeFatRows.reduce((sum, c) => sum + parseFloat(c.fat_percent), 0) / activeFatRows.length).toFixed(2)
                          : '0.00';

                        const activeSnfRows = collections.filter(c => c.snf_percent && !isNaN(parseFloat(c.snf_percent)));
                        const avgSnfVal = activeSnfRows.length > 0
                          ? (activeSnfRows.reduce((sum, c) => sum + parseFloat(c.snf_percent), 0) / activeSnfRows.length).toFixed(2)
                          : '0.00';

                        const avgFatLabel = t('avgFat') === 'avgFat' ? 'Avg Fat' : t('avgFat');
                        const avgSnfLabel = t('avgSnf') === 'avgSnf' ? 'Avg SNF' : t('avgSnf');

                        return (
                          <tr>
                            <td colSpan="4" className="total-label" style={{ textAlign: 'right', paddingRight: '15px' }}>Totals:</td>
                            <td className="total-value" style={{ fontWeight: 'bold' }}>
                              {collections.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0).toFixed(2)} kg
                            </td>
                            <td className="total-value" title={avgFatLabel} style={{ color: '#e67e22', backgroundColor: '#fdf6e2', textAlign: 'center', verticalAlign: 'middle', padding: '2px 4px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '10px', color: '#1a252f', fontWeight: '800', lineHeight: '1.1' }}>{avgFatLabel}%</span>
                                <span style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2' }}>{avgFatVal}%</span>
                              </div>
                            </td>
                            <td className="total-value" title={avgSnfLabel} style={{ color: '#9b59b6', backgroundColor: '#f3e9f7', textAlign: 'center', verticalAlign: 'middle', padding: '2px 4px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '10px', color: '#1a252f', fontWeight: '800', lineHeight: '1.1' }}>{avgSnfLabel}%</span>
                                <span style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2' }}>{avgSnfVal}%</span>
                              </div>
                            </td>
                            <td colSpan="5" className="total-label"></td>
                            <td className="total-value" style={{ fontWeight: 'bold' }}>
                              ₹{collections.reduce((sum, c) => {
                                const calculatedValues = calculateDerivedValues(c);
                                return sum + (parseFloat(calculatedValues.amount) || 0);
                              }, 0).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })()}
                    </tfoot>
                  </table>
                  {collections.some(c => c.is_pro_rata) && (
                    <div style={{
                      margin: '10px 0',
                      padding: '8px 12px',
                      backgroundColor: '#e8f4ff',
                      borderLeft: '3px solid #0066cc',
                      fontSize: '13px',
                      color: '#0066cc'
                    }}>
                      <strong>Note:</strong> {t('proRataCalculationNote').replace('{fatStepUpRate}', parseFloat(fatStepUpRate).toFixed(2)).replace('{snfStepDownRate}', parseFloat(snfStepDownRate).toFixed(2))}
                    </div>
                  )}

                  <div className="probulk-preview-ratio-info" style={{
                    margin: '10px 0',
                    padding: '8px 12px',
                    backgroundColor: '#f0f7ff',
                    borderLeft: '3px solid #4d90fe',
                    fontSize: '13px',
                    color: '#333'
                  }}>
                    <strong>Fat/SNF Ratio:</strong> {t('fatSnfRatioNote').replace('{ratio}', fatSnfRatio === '60_40' ? '60% Fat / 40% SNF' : '52% Fat / 48% SNF').replace('{fatPercent}', fatSnfRatio === '60_40' ? '60' : '52').replace('{snfPercent}', fatSnfRatio === '60_40' ? '40' : '48')}
                  </div>
                </div>
              </div>

              <div className="probulk-modal-footer">
                <div className="probulk-footer-left">
                  <button
                    type="button"
                    className="probulk-rate-chart-button"
                    onClick={() => {
                      setShowRateChartModal(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faChartBar} />
                    <span>{t('rateChart')}</span>
                  </button>
                  <button
                    type="button"
                    className="probulk-rate-settings-button"
                    onClick={() => {
                      openRateSettingsModal();
                    }}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    <span>{t('rateSettings')}</span>
                  </button>
                </div>

                <div className="probulk-footer-right">
                  <button
                    className="probulk-cancel-button"
                    onClick={() => setShowPreviewModal(false)}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    className="probulk-confirm-button"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin />
                        <span>{t('submitting')}</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCheck} />
                        <span>{t('confirmAndSubmit')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* New Customer Modal */}
      {
        showNewCustomerModal && (
          <div className="modal-overlay">
            <div className="new-customer-modal">
              <div className="modal-header">
                <h2>{t('addNewCustomer')}</h2>
                <button
                  className="close-modal-button"
                  onClick={() => setShowNewCustomerModal(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="modal-body">
                <p className="form-instructions">{t('pleaseFillCustomerDetails')}</p>

                <div className="form-group">
                  <label htmlFor="customer-name">{t('name')}</label>
                  <input
                    id="customer-name"
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => handleNewCustomerInputChange('name', e.target.value)}
                    placeholder={t('enterCustomerName')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="father-name">{t('fathersName')}</label>
                  <input
                    id="father-name"
                    type="text"
                    value={newCustomer.father_name}
                    onChange={(e) => handleNewCustomerInputChange('father_name', e.target.value)}
                    placeholder={t('enterFathersName')}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">{t('phoneNumber')}</label>
                  <input
                    id="phone"
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => handleNewCustomerInputChange('phone', e.target.value)}
                    placeholder={t('enter10DigitPhoneNumber')}
                    maxLength={10}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="village">{t('village')}</label>
                  <input
                    id="village"
                    type="text"
                    value={newCustomer.village}
                    onChange={(e) => handleNewCustomerInputChange('village', e.target.value)}
                    placeholder={t('enterVillageName')}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">{t('address')}</label>
                  <textarea
                    id="address"
                    value={newCustomer.address}
                    onChange={(e) => handleNewCustomerInputChange('address', e.target.value)}
                    placeholder={t('enterCompleteAddress')}
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="cancel-button"
                  onClick={() => setShowNewCustomerModal(false)}
                >
                  {t('cancel')}
                </button>
                <button
                  className="save-button"
                  onClick={handleCreateCustomer}
                  disabled={submitting || !newCustomer.name.trim()}
                >
                  {submitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      <span>{t('saving')}</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} />
                      <span>{t('saveCustomer')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Supplier Modal */}
      {
        showEditSupplierModal && (
          <div className="modal-overlay" onClick={() => setShowEditSupplierModal(false)}>
            <div className="edit-supplier-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{t('editSupplier')}</h2>
                <button
                  type="button"
                  className="add-customer-button global-button small"
                  onClick={() => {
                    setCurrentCollection(null);
                    setShowEditSupplierModal(false);
                    setShowNewCustomerModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>{t('addNewCustomer')}</span>
                </button>
                <button
                  className="close-modal-button"
                  onClick={() => setShowEditSupplierModal(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="modal-body">
                {!selectedSupplierForEdit ? (
                  // Step 1: Search and Select Supplier
                  <>
                    <div className="supplier-search-input-wrapper">
                      <input
                        id="supplier-search"
                        type="text"
                        value={editSupplierSearchQuery}
                        onChange={(e) => setEditSupplierSearchQuery(e.target.value)}
                        placeholder={t('searchSuppliers')}
                        autoFocus
                        className="supplier-search-input"
                      />
                    </div>

                    <div className="supplier-list-container-simple">
                      {customers.filter(customer => {
                        const searchLower = editSupplierSearchQuery.toLowerCase();
                        return (
                          customer.name?.toLowerCase().includes(searchLower) ||
                          customer.customer_id?.toString().includes(searchLower)
                        );
                      }).length > 0 ? (
                        <div className="supplier-list-simple">
                          {customers.filter(customer => {
                            const searchLower = editSupplierSearchQuery.toLowerCase();
                            return (
                              customer.name?.toLowerCase().includes(searchLower) ||
                              customer.customer_id?.toString().includes(searchLower)
                            );
                          }).map((customer) => (
                            <div
                              key={customer.id}
                              className="supplier-list-item-simple"
                              onClick={() => handleSelectSupplierForEdit(customer)}
                            >
                              <span className="supplier-name-simple">{customer.name}</span>
                              <span className="supplier-id-simple">{customer.customer_id}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-suppliers-found-simple">
                          {editSupplierSearchQuery ? t('noSuppliersFound') : t('typeToSearchSuppliers')}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // Step 2: Edit Supplier Form
                  <>
                    <div className="form-group">
                      <label htmlFor="edit-supplier-name">{t('nameRequired')}</label>
                      <input
                        id="edit-supplier-name"
                        type="text"
                        value={editSupplierData.name}
                        onChange={(e) => handleEditSupplierInputChange('name', e.target.value)}
                        placeholder={t('enterSupplierName')}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-father-name">{t('fathersName')}</label>
                      <input
                        id="edit-father-name"
                        type="text"
                        value={editSupplierData.father_name}
                        onChange={(e) => handleEditSupplierInputChange('father_name', e.target.value)}
                        placeholder={t('enterFathersName')}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-phone">{t('phoneNumber')}</label>
                      <input
                        id="edit-phone"
                        type="tel"
                        value={editSupplierData.phone}
                        onChange={(e) => handleEditSupplierInputChange('phone', e.target.value)}
                        placeholder={t('enter10DigitPhone')}
                        maxLength={10}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-village">{t('village')}</label>
                      <input
                        id="edit-village"
                        type="text"
                        value={editSupplierData.village}
                        onChange={(e) => handleEditSupplierInputChange('village', e.target.value)}
                        placeholder={t('enterVillageName')}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-address">{t('address')}</label>
                      <textarea
                        id="edit-address"
                        value={editSupplierData.address}
                        onChange={(e) => handleEditSupplierInputChange('address', e.target.value)}
                        placeholder={t('enterCompleteAddress')}
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                {!selectedSupplierForEdit ? (
                  <button
                    className="cancel-button"
                    onClick={() => setShowEditSupplierModal(false)}
                  >
                    {t('cancel')}
                  </button>
                ) : (
                  <>
                    <button
                      className="cancel-button"
                      onClick={() => setSelectedSupplierForEdit(null)}
                    >
                      {t('backToList')}
                    </button>
                    <button
                      className="save-button"
                      onClick={handleUpdateSupplier}
                      disabled={submitting || !editSupplierData.name.trim()}
                    >
                      {submitting ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} spin />
                          <span>{t('updating')}</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faSave} />
                          <span>{t('updateSupplier')}</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Confirmation Modal */}
      {
        showDeleteConfirmation && (
          <div className="modal-overlay">
            <div className="delete-confirmation-modal">
              <div className="warning-header">
                <FontAwesomeIcon icon={faExclamationTriangle} className="warning-icon" />
                <h2>{t('deleteCollectionRow')}</h2>
                <button
                  className="close-modal-button"
                  onClick={() => setShowDeleteConfirmation(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>


              <div className="modal-body">
                <div className="confirmation-icon-container">
                  <FontAwesomeIcon icon={faTrash} size="lg" style={{ color: '#e74c3c' }} />
                </div>
                <p className="warning-text">{t('rowWillBePermanentlyDeleted')}</p>
                <p>{t('areYouSureProceedDeletion')}</p>
              </div>

              <div className="modal-footer">
                <button
                  className="cancel-button"
                  onClick={() => setShowDeleteConfirmation(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                  <span>{t('cancel')}</span>
                </button>
                <button
                  className="delete-button"
                  onClick={() => {
                    removeCollection(rowToDelete);
                    setShowDeleteConfirmation(false);
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                  <span>{t('delete')}</span>
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Percentage Confirmation Modal */}
      {showPercentageConfirmation && (
        <div className="modal-overlay">
          <div className="delete-confirmation-modal">
            <div className="warning-header">
              <FontAwesomeIcon icon={faExclamationTriangle} className="warning-icon" />
              <h2>{percentageConfirmationData?.type === 'high' ? t('highPercentageValue') : t('lowPercentageValue')}</h2>
              <button
                className="close-modal-button"
                onClick={() => handlePercentageConfirmation(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <div className="confirmation-icon-container">
                <FontAwesomeIcon icon={faExclamationCircle} size="lg" style={{ color: '#f39c12' }} />
              </div>
              <p className="warning-text">
                {(() => {
                  let text = percentageConfirmationData?.type === 'high'
                    ? t('enteredValueGreaterThan').replace('{max}', percentageConfirmationData.field === 'clr' ? '35.0' : '15.00').replace('{field}',
                      percentageConfirmationData.field === 'fat_percent' ? 'Fat' :
                        percentageConfirmationData.field === 'clr' ? 'CLR' : 'SNF')
                    : t('enteredValueLessThan').replace('{min}', percentageConfirmationData.field === 'clr' ? '15.0' : '2.00').replace('{field}',
                      percentageConfirmationData.field === 'fat_percent' ? 'Fat' :
                        percentageConfirmationData.field === 'clr' ? 'CLR' : 'SNF');
                  if (percentageConfirmationData?.field === 'clr') {
                    text = text.replace('%', '');
                  }
                  return text;
                })()}
              </p>
              <p className="warning-details">
                {(() => {
                  let detail = t('enteredProcessed').replace('{entered}', percentageConfirmationData.value).replace('{processed}', percentageConfirmationData.processedValue);
                  if (percentageConfirmationData?.field === 'clr') {
                    detail = detail.replace('%', '');
                  }
                  return detail;
                })()}
              </p>
              {((percentageConfirmationData?.field === 'fat_percent' || percentageConfirmationData?.field === 'snf_percent') && percentageConfirmationData?.type !== 'high') && (
                <div style={{
                  backgroundColor: '#fff9db',
                  borderLeft: '4px solid #f59f00',
                  padding: '10px 14px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#8c5e00',
                  marginTop: '10px',
                  marginBottom: '15px',
                  textAlign: 'left',
                  fontWeight: '500',
                  lineHeight: '1.4'
                }}>
                  <strong>{t('tip')}:</strong> {t(percentageConfirmationData.field === 'fat_percent' ? 'fatInputTip' : 'snfInputTip').replace(/{val}/g, percentageConfirmationData.value)}
                </div>
              )}
              <p>{t('areYouSureProceedValue')}</p>
            </div>

            <div className="modal-footer" style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
              <button
                className="cancel-button"
                onClick={() => handlePercentageConfirmation(false)}
                style={{ flex: 1, margin: 0 }}
              >
                <FontAwesomeIcon icon={faTimes} />
                <span>{t('noChangeValue')}</span>
              </button>
              <button
                className="confirm-button"
                onClick={() => handlePercentageConfirmation(true)}
                style={{ flex: 1, margin: 0 }}
              >
                <FontAwesomeIcon icon={faCheck} />
                <span>{t('yesKeepValue')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      <AddMoneyModal
        isOpen={showAddMoneyModal}
        onClose={() => setShowAddMoneyModal(false)}
        walletBalance={walletBalance}
        refreshWalletBalance={refreshWalletBalance}
        isRefreshingBalance={isRefreshingBalance}
        userInfo={userInfo}
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
                    <span className="support-number">{t('supportNumber')}</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Rate Chart Modal */}
      {
        showRateChartModal && (
          <div className="modal-overlay" onClick={() => setShowRateChartModal(false)}>
            <div className="rate-chart-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rate-chart-header">
                <h3>{t('rateChart')}</h3>
                {/* <button
                className="modal-close-btn-ratechart"
                onClick={() => setShowRateChartModal(false)}
                aria-label="Close modal"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button> */}
              </div>

              <div className="rate-chart-body">
                {/* Fat Step-up Rates Section */}
                <div className="rate-chart-section">
                  <h4>{t('fatStepUpRates')}</h4>
                  <p className="rate-description">{t('rateAppliesWhenFatGreater')}</p>
                  {fatStepUpRates.map((item, index) => (
                    <div key={index} className="rate-row">
                      <div className="rate-input-group">
                        <label>Step (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.step}
                          onChange={(e) => updateFatThreshold(index, 'step', e.target.value)}
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
                            onChange={(e) => updateFatThreshold(index, 'rate', e.target.value)}
                            className="rate-input"
                          />
                        </div>
                      </div>
                      {fatStepUpRates.length > 1 && (
                        <button
                          type="button"
                          className="delete-rate-btn"
                          onClick={() => {
                            const newRates = fatStepUpRates.filter((_, i) => i !== index);
                            setFatStepUpRates(newRates);
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
                      setFatStepUpRates([...fatStepUpRates, { step: '', rate: '' }]);
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
                  {snfStepDownRates.map((item, index) => (
                    <div key={index} className="rate-row">
                      <div className="rate-input-group">
                        <label>Step (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.step}
                          onChange={(e) => updateSnfThreshold(index, 'step', e.target.value)}
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
                            onChange={(e) => updateSnfThreshold(index, 'rate', e.target.value)}
                            className="rate-input"
                          />
                        </div>
                      </div>
                      {snfStepDownRates.length > 1 && (
                        <button
                          type="button"
                          className="delete-rate-btn"
                          onClick={() => {
                            const newRates = snfStepDownRates.filter((_, i) => i !== index);
                            setSnfStepDownRates(newRates);
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
                      setSnfStepDownRates([...snfStepDownRates, { step: '', rate: '' }]);
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
                  onClick={() => setShowRateChartModal(false)}
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  className="modal-btn modal-btn-primary"
                  onClick={async () => {
                    try {
                      setSavingRateChart(true);

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
                        fat_step_up_rates: validateRateData(fatStepUpRates, "Fat Step-up Rates", false),
                        snf_step_down_rates: validateRateData(snfStepDownRates, "SNF Step-down Rates", true)
                      };

                      // Debug: Log what data is being sent
                      console.log('DEBUG: Rate chart data being sent to backend:', rateChartData);
                      console.log('DEBUG: Original fatStepUpRates:', fatStepUpRates);
                      console.log('DEBUG: Original snfStepDownRates:', snfStepDownRates);

                      // Check if at least one section has valid data
                      if (rateChartData.fat_step_up_rates.length === 0 && rateChartData.snf_step_down_rates.length === 0) {
                        throw new Error('Please enter at least one valid step and rate in either Fat Step-up Rates or SNF Step-down Rates');
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

                      // Format response back to 2 decimal places for UI
                      const updatedFat = Array.isArray(response?.fat_step_up_rates)
                        ? response.fat_step_up_rates.map((item) => ({
                          step: item.step ? parseFloat(item.step).toFixed(2) : '',
                          rate: item.rate ? parseFloat(Math.abs(item.rate)).toFixed(2) : '',
                          id: item.id,
                        }))
                        : fatStepUpRates;

                      const updatedSnf = Array.isArray(response?.snf_step_down_rates)
                        ? response.snf_step_down_rates.map((item) => ({
                          step: item.step ? parseFloat(item.step).toFixed(2) : '',
                          rate: item.rate ? parseFloat(Math.abs(item.rate)).toFixed(2) : '',
                          id: item.id,
                        }))
                        : snfStepDownRates;

                      // Update state with formatted values
                      setFatStepUpRates(updatedFat);
                      setSnfStepDownRates(updatedSnf);

                      // Update the fatStepUpRate and snfStepDownRate based on the first valid entry
                      const validFatRates = fatStepUpRates.filter(rate => !isNaN(parseFloat(rate.rate)));
                      const validSnfRates = snfStepDownRates.filter(rate => !isNaN(parseFloat(rate.rate)));

                      if (validFatRates.length > 0) {
                        setFatStepUpRate(validFatRates[0].rate);
                      }
                      if (validSnfRates.length > 0) {
                        setSnfStepDownRate(validSnfRates[0].rate);
                      }

                      // Update collections with new rates
                      updateCollectionAmountsWithProRata();

                      // Save the fat/SNF ratio if it was changed
                      if (fatSnfRatioUserChanged && dairyInfo && dairyInfo.id) {
                        try {
                          const ratioData = {
                            dairy_name: dairyInfo.dairy_name || 'Default Dairy',
                            fat_snf_ratio: fatSnfRatio.replace('_', '/')
                          };

                          await patchDairyInfo(dairyInfo.id, ratioData);
                          setFatSnfRatioUserChanged(false);
                        } catch (dairyError) {
                          console.error(t('errorSavingFatSnfRatio'), dairyError);
                          // Don't fail the entire operation for ratio save errors
                        }
                      }

                      // Show success message
                      setSuccessMessage(t('rateChartSavedSuccessfully'));
                      setShowSuccessMessage(true);
                      setTimeout(() => setShowSuccessMessage(false), 5000);

                      setShowRateChartModal(false);
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
        )
      }

      {/* Rate setting Modal */}
      {showChangeRatesModal && (
        <div className="modal-overlay" onClick={() => setShowChangeRatesModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="rate-settings-modal-header">
              <h2>{t('rateSettings')}</h2>
              <button
                className="rate-settings-modal-close-btn"
                onClick={() => setShowChangeRatesModal(false)}
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
                      MozAppearance: 'textfield !important',
                      WebkitAppearance: 'none !important',
                      appearance: 'none !important'
                    }}
                    onWheel={(e) => e.target.blur()}
                  />
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
                          newValue === 'fat_clr' ? t('fatClr') : '';
                        if (newValue !== rateType) {
                          showConfirmation(
                            t('changeRateType'),
                            t('confirmChangeRateType', { value: displayValue }),
                            displayValue,
                            t('rateTypeWillBeUsedForCalculations'),
                            'rateType',
                            newValue
                          );
                        }
                      }}
                    >
                      <option value="fat_snf">{t('fatSnf')}</option>
                      <option value="fat_clr">{t('fatClr')}</option>
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
                    className={`rate-settings-modal-option-btn ${fatSnfRatio === '60_40' ? 'active' : ''}`}
                    onClick={() => {
                      if (fatSnfRatio !== '60_40') {
                        showConfirmation(
                          t('changeFatSnfRatio'),
                          t('confirmChangeFatSnfRatio', { value: '60/40' }),
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
                    className={`rate-settings-modal-option-btn ${fatSnfRatio === '52_48' ? 'active' : ''}`}
                    onClick={() => {
                      if (fatSnfRatio !== '52_48') {
                        showConfirmation(
                          t('changeFatSnfRatio'),
                          t('confirmChangeFatSnfRatio', { value: '52/48' }),
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
                    className={`rate-settings-modal-option-btn ${baseSNF === '8.50' ? 'active' : ''}`}
                    onClick={() => {
                      if (baseSNF !== '8.50') {
                        showConfirmation(
                          t('changeBaseSnf'),
                          t('confirmChangeBaseSnf', { value: '8.50' }),
                          '8.50',
                          t('baseSnfWillBeUsedForCalculations'),
                          'baseSNF',
                          '8.50'
                        );
                      }
                    }}
                  >
                    8.50
                  </button>
                  <button
                    className={`rate-settings-modal-option-btn ${baseSNF === '9.00' ? 'active' : ''}`}
                    onClick={() => {
                      if (baseSNF !== '9.00') {
                        showConfirmation(
                          t('changeBaseSnf'),
                          t('confirmChangeBaseSnf', { value: '9.00' }),
                          '9.00',
                          t('baseSnfWillBeUsedForCalculations'),
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
                    className={`rate-settings-modal-option-btn ${clrConversionFactor === '0.14' ? 'active' : ''}`}
                    onClick={() => {
                      if (clrConversionFactor !== '0.14') {
                        showConfirmation(
                          t('changeClrConversionFactor'),
                          t('confirmChangeClrConversionFactor', { value: '0.14' }),
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
                    className={`rate-settings-modal-option-btn ${clrConversionFactor === '0.50' ? 'active' : ''}`}
                    onClick={() => {
                      if (clrConversionFactor !== '0.50') {
                        showConfirmation(
                          t('changeClrConversionFactor'),
                          t('confirmChangeClrConversionFactor', { value: '0.50' }),
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
                onClick={() => setShowChangeRatesModal(false)}
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
                    <span>{t('saving')}</span>
                  </>
                ) : (
                  <span>{t('saveSettings')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Change Modal */}
      {showRateChangeModal && (
        <div className="brc-modal-overlay">
          <div className="brc-modal-container">
            <div className="brc-modal-header">
              <h3 className="brc-modal-title">{t('changeMilkRate')}</h3>
              <button
                className="brc-modal-close-btn"
                onClick={handleRateChangeModalClose}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="brc-modal-body">
              <div className="brc-modal-form-group">
                <label className="brc-modal-label" htmlFor="milk-rate">{t('newMilkRate')}</label>
                <div className="brc-modal-input-wrapper">
                  <span className="brc-modal-currency-symbol">₹</span>
                  <input
                    id="milk-rate"
                    type="number"
                    step="0.1"
                    min="0"
                    value={newMilkRate}
                    onChange={(e) => setNewMilkRate(e.target.value)}
                    placeholder={t('enterNewMilkRate')}
                    className="brc-modal-input"
                    autoFocus
                    style={{
                      MozAppearance: 'textfield !important',
                      WebkitAppearance: 'none !important',
                      appearance: 'none !important'
                    }}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              </div>

              {submitError && (
                <div className="brc-modal-error-message">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <span>{submitError}</span>
                </div>
              )}
            </div>

            <div className="brc-modal-footer">
              <button
                className="brc-modal-cancel-btn"
                onClick={handleRateChangeModalClose}
                disabled={submitting}
              >
                {t('cancel')}
              </button>
              <button
                className="brc-modal-confirm-btn"
                onClick={handleRateChangeSubmit}
                disabled={submitting || !newMilkRate}
              >
                {submitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '0.5rem' }} />
                    {t('updating')}
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} style={{ marginRight: '0.5rem' }} />
                    {t('updateRate')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Success/Error Message Notification */}
      {
        showSuccessMessage && (
          <div className={`notification-toast ${successMessage.includes('Error') ? 'error' : ''}`}>
            <FontAwesomeIcon
              icon={successMessage.includes('Error') ? faTimes : faCheck}
              className="notification-icon"
            />
            <span className="notification-message">{successMessage}</span>
          </div>
        )
      }
    </div >
  );
};

export default ProRataCollection;