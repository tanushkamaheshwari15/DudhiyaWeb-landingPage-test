import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { getCustomers, createBulkCollections, getCurrentMarketPrice, updateMarketPrice, createCustomer, updateCustomer, getUserInfo, getDairyInfo, getWalletBalance, updateDairyInfo, patchDairyInfo, addMoneyToWallet } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrash,
  faSpinner,
  faCheck,
  faExclamationTriangle,
  faEdit,
  faTimes,
  faSave,
  faEye,
  faWallet,
  faExclamationCircle,
  faCog,
  faTag,
  faArrowRight,
  faChartBar,
  faStore,
  faUser,
  faPhone,
  faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../contexts/LanguageContext';
import './BulkCollectionV1.css';
import ConfirmationModal from './ConfirmationModal';
import Navbar from './Navbar';
import AddMoneyModal from './AddMoneyModal';

const BulkCollectionV1 = () => {
  const { t } = useLanguage();
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
  // eslint-disable-next-line no-unused-vars
  const [isEditingRate, setIsEditingRate] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [customRate, setCustomRate] = useState('');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [currentCollection, setCurrentCollection] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [activeCell, setActiveCell] = useState(null);
  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split('T')[0]);
  const [globalTime, setGlobalTime] = useState('morning');
  const [globalAnimalType, setGlobalAnimalType] = useState(() => localStorage.getItem('default_animal_type') || 'cow');
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
  const [globalBaseSNF, setGlobalBaseSNF] = useState('9.00');
  const [isSingleDateShiftMode, setIsSingleDateShiftMode] = useState(true);
  // Add state for deletion confirmation
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  // Add state for rate change modal
  const [showRateChangeModal, setShowRateChangeModal] = useState(false);
  const [newMilkRate, setNewMilkRate] = useState('');
  // Add state for fat/SNF ratio type
  const [fatSnfRatio, setFatSnfRatio] = useState('60_40'); // Default to 60% fat, 40% SNF

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
  const [rateType, setRateType] = useState('fat_snf'); // Default to fat_snf
  // eslint-disable-next-line no-unused-vars
  const [submittingRateType, setSubmittingRateType] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [rateTypeChanged, setRateTypeChanged] = useState(false); // Track if rate type has changed
  const [loadingInfo, setLoadingInfo] = useState(true);
  // Add state for low balance alert
  const [, setShowLowBalanceAlert] = useState(false);

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

  // Add Money modal state
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  const getFatWarningText = (collection) => {
    if (!collection.fat_percent || formErrors[collection.id]?.fat_percent || rateType === 'kg_only' || rateType === 'liters_only') return '';
    const val = parseFloat(collection.fat_percent);
    if (val < 2.00) return t('warningFatPercentBelowMin').replace('{min}', '2.00');
    if (val > 15.0) return t('warningFatPercentAboveMax').replace('{max}', '15.0');
    return '';
  };

  const getSnfWarningText = (collection) => {
    if (!collection.snf_percent || formErrors[collection.id]?.snf_percent || rateType === 'fat_clr' || rateType === 'kg_only' || rateType === 'liters_only') return '';
    const val = parseFloat(collection.snf_percent);
    if (val < 2.0) return t('warningSnfPercentBelowMin').replace('{min}', '2.0');
    if (val > 15.0) return t('warningSnfPercentAboveMax').replace('{max}', '15.0');
    return '';
  };

  const getClrWarningText = (collection) => {
    if (!collection.clr || formErrors[collection.id]?.clr || rateType === 'fat_snf' || rateType === 'kg_only' || rateType === 'liters_only') return '';
    const val = parseFloat(collection.clr);
    if (val < 15.0) return t('warningClrBelowMin').replace('{min}', '15.0');
    if (val > 35.0) return t('warningClrAboveMax').replace('{max}', '35.0');
    return '';
  };

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

  // Change Rates modal state
  const [showChangeRatesModal, setShowChangeRatesModal] = useState(false);
  const [baseSNF, setBaseSNF] = useState('9.00');
  const [clrConversionFactor, setClrConversionFactor] = useState('0.14');
  const [animalType, setAnimalType] = useState(localStorage.getItem('default_animal_type') || 'cow');

  // Add state for fat/snf percentage confirmation popup
  const [showPercentageConfirmation, setShowPercentageConfirmation] = useState(false);
  const [percentageConfirmationData, setPercentageConfirmationData] = useState({
    rowIndex: null,
    field: null,
    value: null,
    processedValue: null
  });

  // Profile dropdown state
  // eslint-disable-next-line no-unused-vars
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

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
        collection_time: globalTime, // Use global time
        collection_date: globalDate, // Use the current global date
        animal_type: defaultAnimal,
        milk_type: defaultAnimal,
        measured: 'kg',
        liters: '',
        kg: 0,
        fat_kg: 0,
        snf_kg: 0,
        milk_rate: rateToUse,
        amount: 0,
        fat_snf_ratio: fatSnfRatio, // Add current global fat/SNF ratio
        isSnfFromClr: false,
        isManualBaseSnf: false
      }));
    });

    console.log('Initialized', count, 'empty rows');
  }, [currentRate, globalTime, globalDate, globalAnimalType, baseSNF, fatSnfRatio]);

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
        console.log('DEBUG: Raw dairy response from API:', dairyResponse);
        console.log('DEBUG: Is dairy response an array?', Array.isArray(dairyResponse));

        let processedDairyResponse = dairyResponse;
        if (Array.isArray(dairyResponse) && dairyResponse.length > 0) {
          console.log('DEBUG: Using first dairy record from array:', dairyResponse[0]);
          processedDairyResponse = dairyResponse[0];
        }

        setDairyInfo(processedDairyResponse);

        // Set the rate type from dairy info if available
        if (processedDairyResponse && processedDairyResponse.rate_type) {
          setRateType(processedDairyResponse.rate_type);
        }

        // Set base SNF from dairy info if available
        if (processedDairyResponse && processedDairyResponse.base_snf !== undefined) {
          // Normalize to match button values (8.50 or 9.00)
          const baseSnfValue = parseFloat(processedDairyResponse.base_snf).toFixed(2);
          console.log('DEBUG: Loading base_snf from server:', processedDairyResponse.base_snf, 'normalized to:', baseSnfValue);
          setBaseSNF(baseSnfValue);
        }

        // Set fat/SNF ratio from dairy info if available
        if (processedDairyResponse && processedDairyResponse.fat_snf_ratio) {
          // Convert "60/40" to "60_40" for internal state
          const ratio = processedDairyResponse.fat_snf_ratio.replace('/', '_');
          console.log('DEBUG: Loading fat_snf_ratio from server:', processedDairyResponse.fat_snf_ratio, 'setting to:', ratio);
          setFatSnfRatio(ratio);
        }

        // Set CLR conversion factor from dairy info if available
        if (processedDairyResponse && processedDairyResponse.clr_conversion_factor !== undefined) {
          // Normalize to match button values (0.14 or 0.50)
          const clrValue = parseFloat(processedDairyResponse.clr_conversion_factor).toFixed(2);
          console.log('DEBUG: Loading clr_conversion_factor from server:', processedDairyResponse.clr_conversion_factor, 'normalized to:', clrValue);
          setClrConversionFactor(clrValue);
        }

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
        setCurrentSubmitMessage('Milk rate updated successfully!');
        setSubmitSuccess(true);
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 8000);

        // Exit editing mode
        setIsEditingRate(false);
      } catch (error) {
        console.error('Error updating milk rate:', error);
        // Revert to the previous rate
        setCurrentRate(currentRate);
        setCurrentSubmitMessage('Error saving milk rate. Please try again.');
        setSubmitSuccess(true);
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 8000);
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
      console.log('Updated dairy info from backend:', updatedDairyInfo);
      setDairyInfo(updatedDairyInfo);

      // Update local state with the refreshed values from backend
      if (updatedDairyInfo) {
        if (updatedDairyInfo.base_snf) {
          console.log('Updating baseSNF from backend:', updatedDairyInfo.base_snf);
          // Normalize to match button values (8.50 or 9.00)
          const baseSnfValue = parseFloat(updatedDairyInfo.base_snf).toFixed(2);
          setBaseSNF(baseSnfValue);
        }
        if (updatedDairyInfo.clr_conversion_factor) {
          console.log('Updating clrConversionFactor from backend:', updatedDairyInfo.clr_conversion_factor);
          setClrConversionFactor(updatedDairyInfo.clr_conversion_factor.toString());
        }
        if (updatedDairyInfo.fat_snf_ratio) {
          console.log('Updating fatSnfRatio from backend:', updatedDairyInfo.fat_snf_ratio);
          const ratioValue = updatedDairyInfo.fat_snf_ratio.replace('/', '_');
          setFatSnfRatio(ratioValue);
        }
        if (updatedDairyInfo.rate_type) {
          console.log('Updating rateType from backend:', updatedDairyInfo.rate_type);
          setRateType(updatedDairyInfo.rate_type);
        }
      }

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
      let successMessage = 'Rate settings saved successfully!';
      if (milkRateChanged) {
        successMessage = `Milk rate ₹${currentRate}/kg and rate settings saved successfully!`;
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
      let errorMessage = 'Error saving rate settings. Please try again.';
      if (milkRateChanged) {
        errorMessage = 'Error saving milk rate and rate settings. Please try again.';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRate]);

  // Update all collections when baseSNF changes (for real-time updates)
  useEffect(() => {
    if (baseSNF && collections.length > 0) {
      console.log('🔄 Rate Settings baseSNF changed to:', baseSNF);
      console.log('📊 Current collections before update:', collections.map(c => ({ id: c.id, base_snf: c.base_snf, isManual: c.isManualBaseSnf })));

      setCollections(prevCollections =>
        prevCollections.map(collection => {
          // Always update all rows when Rate Settings change
          // Reset manual flag to ensure synchronization
          const updatedCollection = {
            ...collection,
            base_snf: baseSNF,
            isManualBaseSnf: false // Reset manual flag when Rate Settings change
          };

          // Recalculate amount for the updated collection with new base SNF
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

      console.log('✅ All rows updated to baseSNF:', baseSNF);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseSNF]);

  // Update change detection when any rate setting changes
  useEffect(() => {
    if (showChangeRatesModal) {
      checkRateSettingsChanges();
    }
  }, [currentRate, rateType, baseSNF, clrConversionFactor, fatSnfRatio, animalType, showChangeRatesModal, checkRateSettingsChanges]);

  // Recalculate all collections when fat/SNF ratio changes
  useEffect(() => {
    console.log('Fat/SNF Ratio changed to:', fatSnfRatio, 'rateType:', rateType, 'collections count:', collections.length);
    if ((rateType === 'fat_snf' || rateType === 'fat_clr') && collections.length > 0) {
      setCollections(prevCollections =>
        prevCollections.map(collection => {
          // Update collection with new fat/SNF ratio
          const updatedCollection = {
            ...collection,
            fat_snf_ratio: fatSnfRatio
          };
          const derived = calculateDerivedValues(updatedCollection);
          console.log('Recalculating collection:', collection.id, 'with new ratio:', fatSnfRatio, 'New rates - FAT:', derived.fat_rate, 'SNF:', derived.snf_rate, 'Amount:', derived.amount);
          return {
            ...collection,
            fat_snf_ratio: fatSnfRatio,
            fat_kg: derived.fat_kg,
            snf_kg: derived.snf_kg,
            fat_rate: derived.fat_rate,
            snf_rate: derived.snf_rate,
            amount: derived.amount,
            solid_weight: derived.solid_weight
          };
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fatSnfRatio]);

  // Recalculate all collections when CLR conversion factor changes for fat_clr rate type
  useEffect(() => {
    console.log('CLR Conversion Factor changed to:', clrConversionFactor, 'rateType:', rateType, 'collections count:', collections.length);
    if (rateType === 'fat_clr' && collections.length > 0) {
      setCollections(prevCollections =>
        prevCollections.map(collection => {
          // Only recalculate if collection has CLR and fat values
          if (collection.clr && collection.fat_percent && collection.weight) {
            console.log('Recalculating collection:', collection.id, 'with CLR:', collection.clr, 'FAT:', collection.fat_percent, 'old SNF%:', collection.snf_percent, 'old SNF_KG:', collection.snf_kg);
            const updatedCollection = {
              ...collection,
              clr_conversion_factor: clrConversionFactor
            };
            const derived = calculateDerivedValues(updatedCollection);
            console.log('New calculated values - SNF%:', derived.snf_percent, 'SNF_KG:', derived.snf_kg, 'Amount:', derived.amount);
            return {
              ...collection,
              snf_percent: derived.snf_percent.toString(),
              snf_kg: derived.snf_kg,
              fat_kg: derived.fat_kg,
              fat_rate: derived.fat_rate,
              snf_rate: derived.snf_rate,
              amount: derived.amount,
              solid_weight: derived.solid_weight,
              clr_conversion_factor: clrConversionFactor
            };
          }
          return collection;
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Refresh wallet balance
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

  // Calculate SNF from CLR
  const calculateSnfFromClr = (clrValue, fatValue) => {
    // Ensure we have valid inputs
    if (!clrValue || !fatValue) {
      return 0;
    }

    // Convert strings to numbers to ensure proper calculation
    const clr = parseFloat(clrValue);
    const fat = parseFloat(fatValue);

    // Additional validation for reasonable values
    if (isNaN(clr) || isNaN(fat) || clr <= 0 || fat <= 0) {
      return 0;
    }

    // SNF calculation formula: SNF = (CLR / 4) + (0.20 * FAT) + clrConversionFactor
    const factor = parseFloat(clrConversionFactor) || 0.14;
    const calculatedSnf = Math.floor(((clr / 4) + (fat * 0.20) + factor) * 100) / 100;

    // Format to exactly 2 decimal places and ensure it matches the step of 0.01
    // Round to nearest 0.01 using Math.round to avoid browser validation issues
    //return Math.floor(calculatedSnf * 100) / 100;
    return calculatedSnf;
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'N/A';
    return `₹${Number(amount).toFixed(2)}`;
  };

  // Format number to 2 decimal places
  const formatNumber = (number) => {
    if (number === undefined || number === null) return 'N/A';
    return Number(number).toFixed(2);
  };

  // Calculate weight, fat_kg, snf_kg, and amount based on input values - Updated to match APK formulas
  const calculateDerivedValues = (collection) => {
    const fat = parseFloat(collection.fat_percent) || 0;
    let snf = parseFloat(collection.snf_percent) || 0;
    const weight = parseFloat(collection.weight) || 0;
    const rate = parseFloat(collection.milk_rate) || currentRate || 0; // Use collection-specific rate
    const baseSnf = parseFloat(collection.base_snf) || 9.00;

    // Use stored values from collection object instead of making separate API calls
    const collectionFatSnfRatio = collection.fat_snf_ratio?.replace('_', '/') || '60/40'; // Convert to API format
    const collectionClrConversionFactor = collection.clr_conversion_factor || clrConversionFactor || 0.14; // Use collection's factor first, then global

    // For fat_clr rate type, calculate SNF from CLR using the standard formula
    // SNF = (CLR / 4) + (0.20 * FAT) + clrConversionFactor
    if (rateType === 'fat_clr' && collection.clr && collection.fat_percent) {
      const clr = parseFloat(collection.clr) || 0;
      const fat = parseFloat(collection.fat_percent) || 0;
      const factor = parseFloat(collectionClrConversionFactor) || 0.14;
      snf = Math.floor(((clr / 4) + (fat * 0.20) + factor) * 100) / 100;
      console.log('calculateDerivedValues - CLR:', clr, 'FAT:', fat, 'Factor:', factor, 'Calculated SNF:', snf);
    }

    // For kg_only and liters_only rate types, calculate amount as weight * rate
    if (rateType === 'kg_only' || rateType === 'liters_only') {
      const amount = (weight * rate).toFixed(3);
      const solidWeight = (amount / rate).toFixed(3);

      return {
        fat_kg: 0,
        snf_kg: 0,
        fat_rate: 0,
        snf_rate: 0,
        solid_weight: solidWeight,
        amount: parseFloat(amount),
        // Include stored values for reference
        fat_snf_ratio: collectionFatSnfRatio,
        clr_conversion_factor: collectionClrConversionFactor
      };
    }

    // Calculate fat_kg and snf_kg for fat_snf and fat_clr rate types - APK formula
    const fatKg = Math.floor((weight * (fat / 100)) * 100) / 100;
    const snfKg = Math.floor((weight * (snf / 100)) * 100) / 100;

    // Calculate rates based on fat and SNF components with dynamic fat/SNF ratio - APK formula
    // Get fat/SNF ratio percentages based on stored collection value
    const fatRatioPercent = collectionFatSnfRatio === '60/40' ? 60 : 52;
    const snfRatioPercent = collectionFatSnfRatio === '60/40' ? 40 : 48;

    const fatRate = Math.floor((rate * fatRatioPercent / 6.5) * 100) / 100;
    const snfRate = Math.floor((rate * snfRatioPercent / baseSnf) * 100) / 100;

    // Calculate amount based on fat, snf rates and components - APK formula
    // APK: Math.floor(fatKg * fatRate * 100) / 100 + Math.floor(snfKg * snfRate * 100) / 100
    const fatAmount = Math.floor((fatKg * fatRate) * 100) / 100;
    const snfAmount = Math.floor((snfKg * snfRate) * 100) / 100;
    const amount = parseFloat((fatAmount + snfAmount).toFixed(3));

    // Calculate solid weight
    const solidWeight = (amount / rate).toFixed(3);

    return {
      fat_kg: fatKg,
      snf_kg: snfKg,
      snf_percent: snf,
      fat_rate: fatRate,
      snf_rate: snfRate,
      solid_weight: solidWeight,
      amount: amount,
      // Include stored values for reference
      fat_snf_ratio: collectionFatSnfRatio,
      clr_conversion_factor: collectionClrConversionFactor
    };
  };

  // Add multiple rows at once
  const addCollection = (count = 5) => {
    // Get animal type from global animal type settings
    const animalTypeToUse = globalAnimalType || localStorage.getItem('default_animal_type') || 'cow';

    // Get base SNF from global Rate Settings (single source of truth)
    const baseSnfValue = baseSNF || '9.00';

    // Use current rate from state
    const rateToUse = currentRate || 0;

    // Use current CLR conversion factor from rate settings
    const clrConversionFactorValue = clrConversionFactor || '0.14';

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
        liters: '',
        kg: 0,
        fat_kg: 0,
        snf_kg: 0,
        milk_rate: rateToUse,
        amount: 0,
        clr_conversion_factor: clrConversionFactorValue,
        fat_snf_ratio: fatSnfRatio, // Add current global fat/SNF ratio
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
          // Clear any form errors since we now handle validation automatically
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

      // For fat_clr mode with CLR present, recalculate SNF from CLR
      if (isFatClr && hasClr) {
        const snfValue = calculateSnfFromClr(hasClr, processedValue);
        const updatedCollection = {
          ...collections[rowIndex],
          fat_percent: processedValue,
          snf_percent: snfValue,
          isSnfFromClr: true
        };

        // If we also have weight, calculate all derived values
        if (hasWeight) {
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
                solid_weight: derived.solid_weight
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
      } else if (hasWeight && ((isFatSnf && hasSnf) || (isFatClr && hasClr))) {
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
              solid_weight: derived.solid_weight
            };
          }
          return col;
        }));
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

      // Check if processed value is out of range and show confirmation popup
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
          return; // Don't proceed with validation until user confirms
        } else if (numValue < 2.00) {
          setPercentageConfirmationData({
            rowIndex,
            field: 'snf_percent',
            value,
            processedValue,
            type: 'low'
          });
          setShowPercentageConfirmation(true);
          return; // Don't proceed with validation until user confirms
        }
      }

      // Validate the SNF percentage is within acceptable range
      if (!isNaN(numValue)) {
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

      // Recalculate derived values if we have necessary inputs (same logic as CLR field)
      if (collections[rowIndex].fat_percent && collections[rowIndex].weight) {
        const updatedCollection = {
          ...collections[rowIndex],
          snf_percent: processedValue
        };
        const derived = calculateDerivedValues(updatedCollection);

        setCollections(collections.map((col, idx) => {
          if (idx === rowIndex) {
            return {
              ...col,
              snf_percent: processedValue,
              fat_kg: derived.fat_kg,
              snf_kg: derived.snf_kg,
              amount: derived.amount,
              fat_rate: derived.fat_rate,
              snf_rate: derived.snf_rate,
              solid_weight: derived.solid_weight
            };
          }
          return col;
        }));
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

        // If we have both CLR and fat, recalculate SNF and derived values
        if (collections[rowIndex].fat_percent && collections[rowIndex].weight) {
          // Calculate SNF from CLR and fat
          const snfValue = calculateSnfFromClr(processedValue, collections[rowIndex].fat_percent);

          // Create updated collection with processed CLR and calculated SNF
          const updatedCollection = {
            ...collections[rowIndex],
            clr: processedValue,
            snf_percent: snfValue,
            isSnfFromClr: true
          };

          // Calculate all derived values
          const derived = calculateDerivedValues(updatedCollection);

          // Update the collection with all calculated values
          setCollections(collections.map((col, idx) => {
            if (idx === rowIndex) {
              return {
                ...col,
                clr: processedValue,
                snf_percent: snfValue,
                isSnfFromClr: true,
                fat_kg: derived.fat_kg,
                snf_kg: derived.snf_kg,
                amount: derived.amount,
                fat_rate: derived.fat_rate,
                snf_rate: derived.snf_rate,
                solid_weight: derived.solid_weight
              };
            }
            return col;
          }));
        } else if (collections[rowIndex].fat_percent) {
          // Only have fat, calculate SNF but can't calculate amount yet
          const snfValue = calculateSnfFromClr(processedValue, collections[rowIndex].fat_percent);

          setCollections(collections.map((col, idx) => {
            if (idx === rowIndex) {
              return {
                ...col,
                clr: processedValue,
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
      ((rateType === 'kg_only' || rateType === 'liters_only') ||
        (collections[rowIndex].fat_percent &&
          ((rateType === 'fat_snf' && collections[rowIndex].snf_percent) ||
            (rateType === 'fat_clr' && collections[rowIndex].clr))))) {

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
            snf_percent: rateType === 'fat_clr' ? derived.snf_percent : col.snf_percent,
            amount: derived.amount
          };
        }
        return col;
      }));
    }
  };

  // Handle input changes for any cell
  const handleInputChange = (rowIndex, field, value, isManual = false) => {
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
          if (value === '') {
            updatedCollection.fat_percent = value;
          } else {
            // Only allow numbers and decimal point
            const cleanValue = value.replace(/[^\d.]/g, '');

            // Validate format: numbers with optional decimal (max 2 decimal places)
            if (/^\d*\.?\d{0,2}$/.test(cleanValue)) {
              updatedCollection.fat_percent = cleanValue;
            } else {
              return col; // Invalid input, don't update
            }
          }

          // If rateType is fat_clr and we have CLR, recalculate SNF in real-time
          if (rateType === 'fat_clr' && updatedCollection.clr && value) {
            const snfValue = calculateSnfFromClr(updatedCollection.clr, value);
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
            // For decimal values, validate format (up to 1 decimal place)
            else if (/^\d*\.?\d{0,1}$/.test(value)) {
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
                if (clrValue < 15.0 || clrValue > 35.0) {
                  // Set error for CLR value outside acceptable range
                  const errorMessage = clrValue < 15.0 ?
                    `CLR value ${clrValue} is below the minimum (15.0)` :
                    `CLR value ${clrValue} is above the maximum (35.0)`;

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

                console.log(' Base SNF changed via dropdown:', value, 'isManual:', isManual);

                // Mark as manually changed if isManual is true
                if (isManual) {
                  updatedCollection.isManualBaseSnf = true;
                  console.log(' Row marked as manual:', updatedCollection.id);
                }

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

        // If we've updated any field that affects amount calculation, recalculate derived values
        const shouldRecalculate = (
          field === 'weight' ||
          field === 'price_per_unit' ||
          field === 'fat_percent' ||
          field === 'snf_percent' ||
          field === 'clr' ||
          field === 'milk_rate' ||
          field === 'base_snf'
        ) && (
            // Always recalculate for kg_only and liters_only rate types
            (rateType === 'kg_only' || rateType === 'liters_only') ||
            // For fat_snf and fat_clr, recalculate if we have the necessary values OR if milk_rate changed
            (field === 'milk_rate') ||
            (updatedCollection.fat_percent &&
              ((rateType === 'fat_snf' && updatedCollection.snf_percent) ||
                (rateType === 'fat_clr' && updatedCollection.clr)))
          );

        if (shouldRecalculate) {
          const derived = calculateDerivedValues(updatedCollection);

          updatedCollection.fat_kg = derived.fat_kg;
          updatedCollection.snf_kg = derived.snf_kg;
          updatedCollection.amount = derived.amount;
          updatedCollection.fat_rate = derived.fat_rate;
          updatedCollection.snf_rate = derived.snf_rate;
          updatedCollection.solid_weight = derived.solid_weight;
        }

        return updatedCollection;
      }
      return col;
    }));
  };

  // Handle key navigation in the grid
  const handleKeyDown = (e, rowIndex, cellName) => {
    // Updated cells array with date and time (added base_snf back since it's now editable)
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
      errors.customer = 'Customer is required';
    }

    // Only validate fat_percent for fat_snf and fat_clr rate types
    if (rateType === 'fat_snf' || rateType === 'fat_clr') {
      if (!collection.fat_percent) {
        errors.fat_percent = 'Fat percent is required';
      } else if (isNaN(collection.fat_percent) || parseFloat(collection.fat_percent) <= 0) {
        errors.fat_percent = 'Valid fat percent is required';
      }
    }

    // Validate weight/liters
    const weightValue = rateType === 'liters_only' ? collection.liters : collection.weight;
    if (!weightValue) {
      errors.weight = rateType === 'liters_only' ? 'Liters is required' : 'Weight is required';
    } else if (isNaN(weightValue) || parseFloat(weightValue) <= 0) {
      errors.weight = rateType === 'liters_only' ? 'Valid liters is required' : 'Valid weight is required';
    }

    // Validate based on rate type
    if (rateType === 'fat_snf') {
      // For fat_snf rate type, validate SNF
      if (!collection.snf_percent) {
        errors.snf_percent = 'SNF percent is required';
      } else if (isNaN(collection.snf_percent) || parseFloat(collection.snf_percent) <= 0) {
        errors.snf_percent = 'Valid SNF percent is required';
      }
    } else if (rateType === 'fat_clr') {
      // For fat_clr rate type, validate CLR
      if (!collection.clr) {
        errors.clr = 'CLR is required';
      } else if (isNaN(collection.clr) || parseFloat(collection.clr) <= 0) {
        errors.clr = 'Valid CLR is required';
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // Validate all collections
  const validateAllCollections = () => {
    if (collections.length === 0) {
      setSubmitError('Please add at least one collection');
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

  // Format collections for API submission
  const formatCollectionsForSubmission = (collectionsToFormat = collections) => {
    return collectionsToFormat.map(collection => {
      // Use ALL stored values directly from collection state (same as shown in preview)
      const fat = parseFloat(collection.fat_percent) || 0;
      const snf = parseFloat(collection.snf_percent) || 0;
      const weight = parseFloat(collection.weight) || 0;
      const milkRate = parseFloat(collection.milk_rate) || 0;

      const liters = Math.floor((weight / 1.02) * 100) / 100;

      // Use stored values directly from collection - NO recalculation
      const fatKg = collection.fat_kg || 0;
      const snfKg = collection.snf_kg || 0;

      // Format milk_type correctly for API - use cow_buffalo instead of mixed
      const milk_type = collection.animal_type === 'cow+buffalo' ? 'cow_buffalo' : collection.animal_type;

      // Format the request payload using EXACT stored values from preview
      return {
        customer: collection.customer.id,
        collection_time: collection.collection_time,
        collection_date: collection.collection_date,
        animal_type: collection.animal_type,
        milk_type: milk_type,
        measured: rateType === 'liters_only' ? 'liters' : 'kg',
        fat_percentage: rateType === 'kg_only' || rateType === 'liters_only' ? 0 : fat,
        snf_percentage: rateType === 'kg_only' || rateType === 'liters_only' ? 0 : snf,
        base_snf_percentage: collection.base_snf,
        clr: parseFloat(collection.clr) || 0,
        weight: weight,
        kg: weight,
        liters: liters,
        fat_kg: fatKg,
        snf_kg: snfKg,
        fat_rate: collection.fat_rate || 0,
        snf_rate: collection.snf_rate || 0,
        milk_rate: milkRate,
        base_rate: milkRate,
        effective_rate: milkRate,
        amount: collection.amount || 0,
        solid_weight: collection.solid_weight || 0,
        is_pro_rata: false
      };
    });
  };

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
        return;
      }
    }

    // Show preview modal - it will use the current collections state directly
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
        setSubmitError('Some collections have invalid data. Please check all fields and try again.');
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

          // Remove the submitted collection from the state using the captured snapshot
          setCollections(prevCollections => {
            // Find the collection with the matching ID from our captured snapshot
            const collectionToRemove = currentCollections[i];
            return prevCollections.filter(c => c.id !== collectionToRemove.id);
          });

          // Show success message using the captured snapshot (translated)
          const customerName = currentCollections[i].customerDisplay || t('customer');
          setCurrentSubmitMessage(t('collectionForCustomerSubmitted', { customer: customerName }) + ` (1 entry)`);
          setSubmitSuccess(true);
          // Keep success message visible for a short time
          setTimeout(() => {
            setSubmitSuccess(false);
          }, 8000);

        } catch (error) {
          console.error(`Error submitting collection ${i + 1}:`, error);
          setSubmitError(`Failed to submit collection for ${currentCollections[i].customerDisplay || 'customer'}: ${error.error || 'Unknown error'}`);
          break; // Stop on first error
        }
      }

      if (successCount === formattedCollections.length) {
        // All collections were submitted successfully
        setSubmitError('');
        if (formattedCollections.length > 1) {
          setCurrentSubmitMessage(`${successCount} Collections submitted successfully! (${successCount} entries)`);
        } else {
          const customerName = currentCollections[0]?.customerDisplay || t('customer');
          setCurrentSubmitMessage(t('collectionForCustomerSubmitted', { customer: customerName }) + ` (1 entry)`);
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
      setSubmitError(error.error || 'Failed to submit collections. Please try again.');
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

  // Update all collections when rate type changes
  // eslint-disable-next-line no-unused-vars
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
          (newRateType === 'fat_clr' && updatedCollection.clr) ||
          (newRateType === 'kg_only' || newRateType === 'liters_only'))) {
        const derived = calculateDerivedValues(updatedCollection);
        updatedCollection.fat_kg = derived.fat_kg;
        updatedCollection.snf_kg = derived.snf_kg;
        updatedCollection.amount = derived.amount;
        updatedCollection.solid_weight = derived.solid_weight;
      }

      return updatedCollection;
    });

    setCollections(updatedCollections);
  };

  // Update amounts in all collections when global rate changes
  // eslint-disable-next-line no-unused-vars
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
      setSubmitError('Customer name is required');
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
      setCurrentSubmitMessage(`New customer ${response.name} created successfully!`);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error creating customer:', error);
      setSubmitError(error.error || 'Failed to create customer. Please try again.');
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

  // Handle percentage confirmation popup
  const handlePercentageConfirmation = (confirmed) => {
    const { rowIndex, field, processedValue } = percentageConfirmationData;

    if (confirmed) {
      // User confirmed the low value, proceed with validation
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

  // Handle global date change
  const handleGlobalDateChange = (e) => {
    const newDate = e.target.value;
    setGlobalDate(newDate);

    // Update all collections with the new date
    const updatedCollections = collections.map(collection => ({
      ...collection,
      collection_date: newDate
    }));

    setCollections(updatedCollections);
  };

  // Handle global time change
  const handleGlobalTimeChange = (e) => {
    const newTime = e.target.value;
    setGlobalTime(newTime);

    // Update all collections with new time, preserving all other fields
    const updatedCollections = collections.map(collection => ({
      ...collection,
      collection_time: newTime
    }));

    setCollections(updatedCollections);
  };

  // Handle global animal type change
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

  // Handle global base SNF change
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
      setSubmitError('Please enter a valid milk rate');
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
      setCurrentSubmitMessage(`Milk rate updated to ₹${newMilkRate}/L successfully!`);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error updating milk rate:', error);
      setSubmitError(error.error || 'Failed to update milk rate. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRateChangeModalClose = () => {
    setShowRateChangeModal(false);
    setNewMilkRate('');
    setSubmitError('');
  };

  // Handle Edit Supplier modal open
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

  // Handle supplier selection for editing
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

  // Handle edit supplier input changes
  const handleEditSupplierInputChange = (field, value) => {
    setEditSupplierData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle update supplier
  const handleUpdateSupplier = async () => {
    if (!selectedSupplierForEdit) {
      setSubmitError('Please select a supplier to edit');
      return;
    }

    if (!editSupplierData.name.trim()) {
      setSubmitError('Supplier name is required');
      return;
    }

    try {
      setSubmitting(true);

      // Format phone number to remove any +91 prefix
      const formattedPhone = editSupplierData.phone ? editSupplierData.phone.replace(/^\+91/, '') : '';

      const customerData = {
        ...editSupplierData,
        phone: formattedPhone
      };

      // Call API to update customer
      await updateCustomer(selectedSupplierForEdit.id, customerData);

      // Refresh customers list
      await fetchCustomers();

      // Reset form and close modal
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

      // Show success message
      setCurrentSubmitMessage(`Supplier ${editSupplierData.name} updated successfully!`);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error updating supplier:', error);
      setSubmitError(error.error || 'Failed to update supplier. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter customers for edit supplier search
  const filteredSuppliersForEdit = customers.filter(customer => {
    const searchLower = editSupplierSearchQuery.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.customer_id?.toString().includes(searchLower) ||
      customer.phone?.includes(searchLower) ||
      customer.village?.toLowerCase().includes(searchLower)
    );
  });

  if (loading || isLoadingRate) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="bulk-collection-v1-container">
      <Navbar
        title={t('bulkCollection')}
        onBack={goBack}
        showProfile={true}
        userInfo={userInfo}
        dairyInfo={dairyInfo}
        loadingInfo={loadingInfo}
        pageName="bulkCollection"
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

        {/* Rate Settings */}
        <div className="bulk-dairy-info-wrapper">
          <div className="bulk-rate-settings-card" onClick={() => openRateSettingsModal()}>
            <div className="bulk-rate-settings-header">
              <div className="bulk-rate-settings-title-section">
                <div className="bulk-rate-settings-icon-bg">
                  <FontAwesomeIcon icon={faCog} className="bulk-rate-settings-main-icon" />
                </div>
                <div>
                  <h3 className="bulk-rate-settings-title">{t('rateSettings')}</h3>
                  <p className="bulk-rate-settings-subtitle">{t('configureYourMilkCalculationParameters')}</p>
                </div>
              </div>
              <button
                className="bulk-rate-settings-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openRateSettingsModal();
                }}
              >
                <FontAwesomeIcon icon={faEdit} />
                <span>{t('edit')}</span>
              </button>
            </div>
            <div className="bulk-rate-settings-content">
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
                    <div className="dairy-info-value">{rateType === 'fat_snf' ? t('fatAndSNF') : rateType === 'fat_clr' ? 'Fat & CLR' : rateType === 'kg_only' ? t('weightKg') : rateType === 'liters_only' ? t('litersOnly') : t('fixedRate')}</div>
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
        </div>

      </div>

      <div className="bulk-collection-content">
        {submitSuccess && (
          <div className="success-message-centered">
            <FontAwesomeIcon icon={faCheck} />
            <span>{currentSubmitMessage || 'Collections submitted successfully!'}</span>
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
          <div className="csv-grid-container">
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

              {/* 
              <div className="global-setting">
                <label>{t('customerManagement')}:</label>
                <button
                  type="button"
                  className="mobile-add-customer-button"
                  onClick={() => {
                    setCurrentCollection(null);
                    setShowNewCustomerModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>{t('addNewCustomer')}</span>
                </button>

              </div> */}

              <button
                type="button"
                className="mobile-add-customer-button edit-supplier-btn"
                onClick={handleOpenEditSupplierModal}
                style={{ marginLeft: '8px', backgroundColor: '#4CAF50' }}
              >
                <FontAwesomeIcon icon={faEdit} />
                <span>{t('editSupplier')}</span>
              </button>


              {/* <div className="toolbar-right">
                <div className="collection-date-time-controls">
                  <div className="collection-date-control">
                    <label>{t('collectionDate')}</label>
                    <input
                      type="date"
                      value={globalDate}
                      onChange={handleGlobalDateChange}
                      className="collection-date-input"
                      onClick={(e) => {
                        e.target.showPicker && e.target.showPicker();
                      }}
                    />
                  </div>
                  <div className="collection-time-control">
                    <label>{t('collectionTime')}</label>
                    <select
                      value={globalTime}
                      onChange={handleGlobalTimeChange}
                      className="collection-time-input"
                    >
                      <option value="morning">{t('morning')}</option>
                      <option value="evening">{t('evening')}</option>
                    </select>
                  </div>
                </div>
              </div> */}

              {collections.length > 0 && (
                <button
                  type="submit"
                  className="submit-preview-button"
                  disabled={submitting}
                >
                  <FontAwesomeIcon icon={faEye} />
                  <span>{t('previewSubmit')}</span>
                </button>
              )}
            </div>

            {/* True Excel-style table */}
            <table className="bulk-data-table">
              <thead>
                <tr>
                  {/* S.No column */}
                  <th>#</th>
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
                  <th>{rateType === 'liters_only' ? t('litersOnly') : t('weightKg')}</th>
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
                      <option value="cow+buffalo">{t('mix')}</option>
                    </select>
                  </th>
                  <th>{t('delete')}</th>
                </tr>
              </thead>

              <tbody>
                {collections.length === 0 ? (
                  <tr className="bulk-empty-row">
                    <td colSpan="11" className="bulk-empty-message">
                      {t('noDataYet')}
                    </td>
                  </tr>
                ) : (
                  collections.map((collection, rowIndex) => (
                    <tr key={collection.id} className="bulk-data-row">
                      {/* Serial Number */}
                      <td className="bulk-serial-cell">
                        {rowIndex + 1}
                      </td>

                      {/* Date */}
                      <td >
                        <div className="bulk-date-input-wrapper">
                          <input
                            id={`collection_date-${rowIndex}`}
                            type="date"
                            value={collection.collection_date}
                            onChange={(e) => handleInputChange(rowIndex, 'collection_date', e.target.value)}
                            onFocus={() => handleCellFocus(rowIndex, 'collection_date')}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, 'collection_date')}
                            className="bulk-text-input"
                            onClick={(e) => {
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
                          className="bulk-select-input"
                        >
                          <option value="morning">{t('morning')}</option>
                          <option value="evening">{t('evening')}</option>
                        </select>
                      </td>

                      {/* Customer */}
                      <td className={formErrors[collection.id]?.customer ? 'has-error' : ''}>
                        <div className="bulk-customer-search-cell">
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
                            placeholder={t('searchSuppliers')}
                            className="bulk-text-input"
                            ref={el => customerInputRefs.current[rowIndex] = el}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, 'customer')}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                          />
                          {/* Use row-specific dropdown visibility */}
                          {visibleDropdowns[rowIndex] && (
                            <div className="bulk-collection-dropdown">
                              {filteredCustomers.length > 0 ? (
                                <>
                                  {filteredCustomers.map((customer, index) => (
                                    <div
                                      key={customer.id}
                                      className={`bulk-collection-dropdown-item ${selectedCustomerIndex === index ? 'bulk-collection-selected' : ''}`}
                                      onMouseDown={(e) => {
                                        // Using onMouseDown instead of onClick prevents blur before selection
                                        e.preventDefault();
                                        handleSelectCustomer(rowIndex, customer);
                                      }}
                                      // Add hover handler to update selected index
                                      onMouseEnter={() => setSelectedCustomerIndex(index)}
                                    >
                                      {customer.customer_id} - <strong>{customer.name}</strong>
                                    </div>
                                  ))}
                                  <div
                                    className="bulk-collection-dropdown-item-add-new"
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
                                    <FontAwesomeIcon icon={faPlus} /> {t('addNewCustomer')}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="bulk-collection-no-results">{t('noSuppliersFound')}</div>
                                  <div
                                    className="bulk-collection-dropdown-item-add-new"
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
                                    <FontAwesomeIcon icon={faPlus} /> {t('addNewCustomer')}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                          {formErrors[collection.id]?.customer && (
                            <div className="bulk-collection-cell-error">{formErrors[collection.id].customer}</div>
                          )}
                        </div>
                      </td>

                      {/* Weight (kg/liters) */}
                      <td className={formErrors[collection.id]?.weight ? 'bulk-collection-has-error' : ''}>
                        <input
                          id={`weight-${rowIndex}`}
                          type="text"
                          step="0.1"
                          min="0"
                          value={rateType === 'liters_only' ? (collection.liters !== undefined && collection.liters !== null ? collection.liters : '') : collection.weight}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (rateType === 'liters_only') {
                              setCollections(prevCollections => {
                                const updatedCollections = [...prevCollections];
                                updatedCollections[rowIndex] = {
                                  ...updatedCollections[rowIndex],
                                  liters: value,
                                  weight: value
                                };
                                return updatedCollections;
                              });
                            } else {
                              handleInputChange(rowIndex, 'weight', value);
                            }
                          }}
                          onFocus={() => handleCellFocus(rowIndex, 'weight')}
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (rateType === 'liters_only') {
                              setCollections(prevCollections => {
                                const updatedCollections = [...prevCollections];
                                const collection = updatedCollections[rowIndex];
                                const derived = calculateDerivedValues({
                                  ...collection,
                                  weight: value
                                });
                                updatedCollections[rowIndex] = {
                                  ...collection,
                                  liters: value,
                                  weight: value,
                                  amount: derived.amount
                                };
                                return updatedCollections;
                              });
                            } else {
                              handleCellBlur(rowIndex, 'weight', value);
                            }
                          }}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, 'weight')}
                          placeholder={rateType === 'liters_only' ? "e.g. 10.5" : "e.g. 10.5 kg"}
                          className="bulk-collection-excel-cell-input"
                        />
                        {formErrors[collection.id]?.weight && (
                          <div className="bulk-collection-cell-error">{formErrors[collection.id].weight}</div>
                        )}
                      </td>

                      {/* Fat % */}
                      <td className={formErrors[collection.id]?.fat_percent ? 'bulk-collection-has-error' : ''}>
                        <div className={rateType === 'kg_only' || rateType === 'liters_only' ? 'bulk-collection-disabled-field' : ''} style={{ position: 'relative' }}>
                          <input
                            id={`fat_percent-${rowIndex}`}
                            type="text"
                            value={rateType === 'kg_only' || rateType === 'liters_only' ? '' : collection.fat_percent}
                            onChange={(e) => handleInputChange(rowIndex, 'fat_percent', e.target.value)}
                            onFocus={() => handleCellFocus(rowIndex, 'fat_percent')}
                            onBlur={(e) => handleCellBlur(rowIndex, 'fat_percent', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, 'fat_percent')}
                            placeholder="e.g. 35 ➞ 3.5"
                            className={`bulk-collection-text-input ${rateType === 'kg_only' || rateType === 'liters_only' ? 'bulk-collection-disabled-input' : ''}`}
                            disabled={rateType === 'kg_only' || rateType === 'liters_only'}
                            readOnly={rateType === 'kg_only' || rateType === 'liters_only'}
                            style={{ paddingRight: getFatWarningText(collection) ? '24px' : '4px' }}
                          />
                          {(rateType === 'kg_only' || rateType === 'liters_only') && <span className="bulk-collection-disabled-indicator">N/A</span>}
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
                          <div className="bulk-collection-cell-error">{formErrors[collection.id].fat_percent}</div>
                        )}
                      </td>

                      {/* SNF % */}
                      <td className={formErrors[collection.id]?.snf_percent ? 'bulk-collection-has-error' : ''}>
                        <div className={(collection.isSnfFromClr || rateType === 'fat_clr' || rateType === 'kg_only' || rateType === 'liters_only') ? 'bulk-collection-calculated-cell' : ''} style={{ position: 'relative' }}>
                          <input
                            id={`snf_percent-${rowIndex}`}
                            type="text"
                            value={collection.snf_percent}
                            onChange={(e) => handleInputChange(rowIndex, 'snf_percent', e.target.value)}
                            onFocus={() => handleCellFocus(rowIndex, 'snf_percent')}
                            onBlur={(e) => handleCellBlur(rowIndex, 'snf_percent', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, 'snf_percent')}
                            placeholder="e.g. 85 ➞ 8.5"
                            className={`bulk-collection-text-input ${rateType === 'fat_clr' || rateType === 'kg_only' || rateType === 'liters_only' ? 'bulk-collection-auto-calculated' : ''}`}
                            readOnly={collection.isSnfFromClr || rateType === 'fat_clr' || rateType === 'kg_only' || rateType === 'liters_only'}
                            disabled={collection.isSnfFromClr || rateType === 'fat_clr' || rateType === 'kg_only' || rateType === 'liters_only'}
                            style={{ paddingRight: getSnfWarningText(collection) ? '24px' : '4px' }}
                          />
                          {(collection.isSnfFromClr || rateType === 'kg_only' || rateType === 'liters_only') && <span className="bulk-collection-calc-indicator">*</span>}
                          {(rateType === 'kg_only' || rateType === 'liters_only') && <span className="bulk-collection-disabled-indicator">N/A</span>}
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
                          <div className="bulk-collection-cell-error">{formErrors[collection.id].snf_percent}</div>
                        )}
                      </td>

                      {/* CLR */}
                      <td className={formErrors[collection.id]?.clr ? 'bulk-collection-has-error' : ''}>
                        <div className={rateType === 'fat_snf' || rateType === 'kg_only' || rateType === 'liters_only' ? 'bulk-collection-disabled-field' : ''} style={{ position: 'relative' }}>
                          <input
                            id={`clr-${rowIndex}`}
                            type="text"
                            value={collection.clr}
                            onChange={(e) => handleInputChange(rowIndex, 'clr', e.target.value)}
                            onFocus={() => handleCellFocus(rowIndex, 'clr')}
                            onBlur={(e) => handleCellBlur(rowIndex, 'clr', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, 'clr')}
                            placeholder="e.g. 27.5 (15.0 - 35.0)"
                            className={`bulk-collection-text-input ${rateType === 'fat_snf' || rateType === 'kg_only' || rateType === 'liters_only' ? 'bulk-collection-disabled-input' : ''}`}
                            disabled={rateType === 'fat_snf' || rateType === 'kg_only' || rateType === 'liters_only'}
                            readOnly={rateType === 'fat_snf' || rateType === 'kg_only' || rateType === 'liters_only'}
                            style={{ paddingRight: getClrWarningText(collection) ? '24px' : '4px' }}
                          />
                          {(rateType === 'fat_snf' || rateType === 'kg_only' || rateType === 'liters_only') && <span className="bulk-collection-disabled-indicator">N/A</span>}
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
                          <div className="bulk-collection-cell-error">{formErrors[collection.id].clr}</div>
                        )}
                      </td>

                      {/* Milk Rate */}
                      <td>
                        {/* Using milk_rate: {collection.milk_rate}, currentRate: {currentRate} */}
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
                          className="bulk-collection-excel-cell-input"
                          style={{
                            MozAppearance: 'textfield !important',
                            WebkitAppearance: 'none !important',
                            appearance: 'none !important'
                          }}
                          onWheel={(e) => e.target.blur()}
                        />
                      </td>

                      {/* Base SNF */}
                      <td className={formErrors[collection.id]?.base_snf ? 'bulk-collection-has-error' : ''}>
                        <div className="bulk-collection-editable-field">
                          <select
                            id={`base_snf-${rowIndex}`}
                            value={collection.base_snf}
                            onChange={(e) => handleInputChange(rowIndex, 'base_snf', e.target.value, false)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, 'base_snf')}
                            className="bulk-collection-excel-cell-input"
                            title="Select Base SNF"
                          >
                            {/* Dynamic options based on Rate Settings */}
                            <option value={baseSNF}>{baseSNF}</option>
                            <option value="8.5">8.5</option>
                            <option value="9.0">9.0</option>
                            <option value="9.1">9.1</option>
                            <option value="9.2">9.2</option>
                            <option value="9.3">9.3</option>
                            <option value="9.4">9.4</option>
                            <option value="9.5">9.5</option>
                          </select>

                          {formErrors[collection.id]?.base_snf && (
                            <div className="bulk-collection-cell-error">{formErrors[collection.id].base_snf}</div>
                          )}
                        </div>
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
                          className="bulk-collection-excel-cell-select"
                        >
                          <option value="cow">{t('cow')}</option>
                          <option value="buffalo">{t('buffalo')}</option>
                          <option value="cow+buffalo">{t('mix')}</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td>
                        <button
                          type="button"
                          className="bulk-collection-delete-btn"
                          onClick={() => handleDeleteClick(collection)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {collections.length > 0 && (() => {
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
                    <tr className="bulk-collection-total-row">
                      <td colSpan="4" className="bulk-collection-total-label">{rateType === 'liters_only' ? 'Total Liters:' : 'Total Weight:'}</td>
                      <td className="bulk-collection-total-value bulk-collection-weight-total">
                        {rateType === 'liters_only'
                          ? collections.reduce((sum, c) => sum + (parseFloat(c.liters) || 0), 0).toFixed(2) + ' liters'
                          : collections.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0).toFixed(2) + ' kg'
                        }
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
                      <td colSpan="5" className="bulk-total-label">Total Records: <span>{collections.filter(c => rowHasData(c)).length}</span></td>
                    </tr>
                  </tfoot>
                );
              })()}
            </table>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="bulk-modal-overlay">
          <div className="bulk-preview-modal">
            <div className="bulk-modal-header">
              <h2 className="bulk-modal-title">{t('previewCollections')}</h2>
              <button
                className="bulk-close-modal-button"
                onClick={() => setShowPreviewModal(false)}
                aria-label="Close preview"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="bulk-modal-body">
              <div className="bulk-preview-header">
                <p className="bulk-preview-info">{t('pleaseReviewCollections')}</p>
              </div>

              <div className="bulk-preview-table-container">
                <div className="bulk-table-wrapper">
                  <table className="bulk-preview-table">
                    <thead className="bulk-table-header">
                      <tr className="bulk-header-row">
                        <th className="bulk-cell bulk-cell-number">#</th>
                        <th className="bulk-cell bulk-cell-date">Date</th>
                        <th className="bulk-cell bulk-cell-time">Shift</th>
                        <th className="bulk-cell bulk-cell-customer">Supplier</th>
                        <th className="bulk-cell bulk-cell-quantity">{rateType === 'liters_only' ? 'Liters' : 'Weight'}</th>
                        <th className="bulk-cell bulk-cell-fat">Fat %</th>
                        <th className="bulk-cell bulk-cell-snf">SNF %</th>
                        <th className="bulk-cell bulk-cell-clr">CLR</th>
                        <th className="bulk-cell bulk-cell-fat-kg">Fat KG</th>
                        <th className="bulk-cell bulk-cell-snf-kg">SNF KG</th>
                        <th className="bulk-cell bulk-cell-rate">Rate</th>
                        <th className="bulk-cell bulk-cell-base-snf">Base SNF</th>
                        <th className="bulk-cell bulk-cell-amount">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bulk-table-body">
                      {collections.map((collection, index) => {
                        // Use stored calculated values from collection state
                        const displayCollection = collection;

                        return (
                          <tr key={collection.id} className="bulk-data-row">
                            <td className="bulk-cell bulk-cell-number">{index + 1}</td>
                            <td className="bulk-cell bulk-cell-date">{displayCollection.collection_date}</td>
                            <td className="bulk-cell bulk-cell-time">{displayCollection.collection_time === 'morning' ? 'Morning' : 'Evening'}</td>
                            <td className="bulk-cell bulk-cell-customer" title={displayCollection.customerDisplay}>{displayCollection.customerDisplay}</td>
                            <td className="bulk-cell bulk-cell-quantity">
                              <span className="bulk-quantity-value">
                                {rateType === 'liters_only' ? (parseFloat(displayCollection.liters).toFixed(2) + ' L') : (parseFloat(displayCollection.weight).toFixed(2) + ' kg')}
                              </span>
                            </td>
                            <td className="bulk-cell bulk-cell-fat" style={{ position: 'relative' }}>
                              {rateType === 'kg_only' || rateType === 'liters_only' ? '-' : (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span>{displayCollection.fat_percent ? parseFloat(displayCollection.fat_percent).toFixed(2) + '%' : '-'}</span>
                                  {getFatWarningText(displayCollection) && (
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
                                  {activeWarning && activeWarning.rowIndex === index && activeWarning.field === 'preview_fat' && getFatWarningText(displayCollection) && (
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
                                          {getFatWarningText(displayCollection)}
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
                              )}
                            </td>
                            <td className="bulk-cell bulk-cell-snf" style={{ position: 'relative' }}>
                              {rateType === 'kg_only' || rateType === 'liters_only' ? '-' : (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span>{displayCollection.snf_percent ? parseFloat(displayCollection.snf_percent).toFixed(2) + '%' : '-'}</span>
                                  {getSnfWarningText(displayCollection) && (
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
                                  {activeWarning && activeWarning.rowIndex === index && activeWarning.field === 'preview_snf' && getSnfWarningText(displayCollection) && (
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
                                          {getSnfWarningText(displayCollection)}
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
                              )}
                            </td>
                            <td className="bulk-cell bulk-cell-clr" style={{ position: 'relative' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span>{displayCollection.clr ? parseFloat(displayCollection.clr).toFixed(1) : '-'}</span>
                                {getClrWarningText(displayCollection) && (
                                  <span 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveWarning(activeWarning?.rowIndex === index && activeWarning?.field === 'preview_clr' ? null : { rowIndex: index, field: 'preview_clr' });
                                    }}
                                    style={{ color: '#ff3b30', cursor: 'pointer' }}
                                  >
                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                  </span>
                                )}
                                {activeWarning && activeWarning.rowIndex === index && activeWarning.field === 'preview_clr' && getClrWarningText(displayCollection) && (
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
                                        {getClrWarningText(displayCollection)}
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
                            <td className="bulk-cell bulk-cell-fat-kg">{rateType === 'kg_only' || rateType === 'liters_only' ? '-' : (displayCollection.fat_kg ? parseFloat(displayCollection.fat_kg).toFixed(2) : ((parseFloat(displayCollection.weight) * parseFloat(displayCollection.fat_percent) / 100).toFixed(2)))} {rateType !== 'kg_only' && rateType !== 'liters_only' && 'kg'}</td>
                            <td className="bulk-cell bulk-cell-snf-kg">{rateType === 'kg_only' || rateType === 'liters_only' ? '-' : (displayCollection.snf_kg ? parseFloat(displayCollection.snf_kg).toFixed(2) : ((parseFloat(displayCollection.weight) * parseFloat(displayCollection.snf_percent) / 100).toFixed(2)))} {rateType !== 'kg_only' && rateType !== 'liters_only' && 'kg'}</td>
                            <td className="bulk-cell bulk-cell-rate">
                              <span className="bulk-rate-value">₹{displayCollection.milk_rate ? (Number.isInteger(parseFloat(displayCollection.milk_rate)) ? parseInt(displayCollection.milk_rate) : displayCollection.milk_rate) : '0'}</span>
                            </td>
                            <td className="bulk-cell bulk-cell-base-snf">{displayCollection.base_snf ? parseFloat(displayCollection.base_snf).toFixed(1) : '-'}</td>
                            <td className="bulk-cell bulk-cell-amount">
                              <span className="bulk-amount-value">{formatNumber(displayCollection.amount)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bulk-table-footer">
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
                          <tr className="bulk-footer-row">
                            <td colSpan="4" className="bulk-total-label">{rateType === 'liters_only' ? 'Total Liters:' : 'Total Weight:'}</td>
                            <td className="bulk-total-value bulk-total-quantity">
                              {rateType === 'liters_only'
                                ? collections.reduce((sum, c) => sum + (parseFloat(c.liters) || 0), 0).toFixed(2) + ' L'
                                : collections.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0).toFixed(2) + ' kg'
                              }
                            </td>
                            <td className="bulk-total-value" title={avgFatLabel} style={{ color: '#e67e22', backgroundColor: '#fdf6e2', textAlign: 'center', verticalAlign: 'middle', padding: '2px 4px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '10px', color: '#1a252f', fontWeight: '800', lineHeight: '1.1' }}>{avgFatLabel}%</span>
                                <span style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2' }}>{avgFatVal}%</span>
                              </div>
                            </td>
                            <td className="bulk-total-value" title={avgSnfLabel} style={{ color: '#9b59b6', backgroundColor: '#f3e9f7', textAlign: 'center', verticalAlign: 'middle', padding: '2px 4px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '10px', color: '#1a252f', fontWeight: '800', lineHeight: '1.1' }}>{avgSnfLabel}%</span>
                                <span style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2' }}>{avgSnfVal}%</span>
                              </div>
                            </td>
                            <td colSpan="5" className="bulk-total-label" style={{ textAlign: 'right', paddingRight: '15px' }}>Total Amount:</td>
                            <td className="bulk-total-value bulk-total-amount" style={{ color: '#2ecc71', fontSize: '14px', fontWeight: 'bold' }}>
                              {formatCurrency(collections.reduce((sum, c) => {
                                return sum + (parseFloat(c.amount) || 0);
                              }, 0))}
                            </td>
                          </tr>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="bulk-modal-footer">
              <div className="bulk-footer-actions">
                <button
                  className="bulk-preview-settings-button"
                  onClick={() => openRateSettingsModal()}
                  title="Open Rate Settings"
                >
                  <FontAwesomeIcon icon={faCog} />
                  <span>{t('rateSettings')}</span>
                </button>

                <div className="bulk-action-buttons">
                  <button
                    className="bulk-cancel-button"
                    onClick={() => setShowPreviewModal(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                    <span>{t('cancel')}</span>
                  </button>

                  <button
                    className="bulk-confirm-button"
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
        </div>
      )}

      {/* Rate Settings Modal */}
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
                  {/* <span className="rate-settings-modal-label">/kg</span> */}
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

              {/* Rate Type Section */}
              <div className="rate-settings-modal-section-dashboard edit-field">
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
                          t('areYouSureChangeFatSnfRatioTo').replace('{value}', '60/40'),
                          '60/40',
                          t('thisFatSnfRatioWillBeUsed'),
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
                          t('areYouSureChangeFatSnfRatioTo').replace('{value}', '52/48'),
                          '52/48',
                          t('thisFatSnfRatioWillBeUsed'),
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
                          t('changeBaseSNF'),
                          t('areYouSureChangeBaseSNFTo').replace('{value}', '8.50'),
                          '8.50',
                          t('thisBaseSNFWillBeUsed'),
                          'baseSNF',
                          '8.50'
                        );
                      }
                    }}
                  >
                    8.5
                  </button>
                  <button
                    className={`rate-settings-modal-option-btn ${baseSNF === '9.00' ? 'active' : ''}`}
                    onClick={() => {
                      if (baseSNF !== '9.00') {
                        showConfirmation(
                          t('changeBaseSNF'),
                          t('areYouSureChangeBaseSNFTo').replace('{value}', '9.00'),
                          '9.00',
                          t('thisBaseSNFWillBeUsed'),
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
                    className={`rate-settings-modal-option-btn ${parseFloat(clrConversionFactor) === 0.14 ? 'active' : ''}`}
                    onClick={() => {
                      if (clrConversionFactor !== '0.14') {
                        showConfirmation(
                          t('changeClrConversionFactor'),
                          t('areYouSureChangeClrConversionFactorTo').replace('{value}', '0.14'),
                          '0.14',
                          t('thisClrConversionFactorWillBeUsed'),
                          'clrConversionFactor',
                          '0.14'
                        );
                      }
                    }}
                  >
                    0.14
                  </button>
                  <button
                    className={`rate-settings-modal-option-btn ${parseFloat(clrConversionFactor) === 0.50 ? 'active' : ''}`}
                    onClick={() => {
                      if (clrConversionFactor !== '0.50') {
                        showConfirmation(
                          t('changeClrConversionFactor'),
                          t('areYouSureChangeClrConversionFactorTo').replace('{value}', '0.50'),
                          '0.50',
                          t('thisClrConversionFactorWillBeUsed'),
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


      {/* New Customer Modal */}
      {showNewCustomerModal && (
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
      )}

      {/* Edit Supplier Modal */}
      {showEditSupplierModal && (
        <div className="modal-overlay">
          <div className="new-customer-modal edit-supplier-modal">
            <div className="modal-header">
              <h2>{t('editSupplier')}</h2>
              <button
                type="button"
                className="mobile-add-customer-button"
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
                    {/* <FontAwesomeIcon icon={faSearch} className="search-icon" /> */}
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
                    {filteredSuppliersForEdit.length > 0 ? (
                      <div className="supplier-list-simple">
                        {filteredSuppliersForEdit.map((customer) => (
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
                  <p className="form-instructions">
                    Editing supplier: <strong>{selectedSupplierForEdit.customer_id} - {selectedSupplierForEdit.name}</strong>
                  </p>

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
                      id="edit-supplier-father"
                      type="text"
                      value={editSupplierData.father_name}
                      onChange={(e) => handleEditSupplierInputChange('father_name', e.target.value)}
                      placeholder={t('enterFathersName')}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-phone">{t('phoneNumber')}</label>
                    <input
                      id="edit-supplier-phone"
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
                      id="edit-supplier-village"
                      type="text"
                      value={editSupplierData.village}
                      onChange={(e) => handleEditSupplierInputChange('village', e.target.value)}
                      placeholder={t('enterVillageName')}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-address">{t('address')}</label>
                    <textarea
                      id="edit-supplier-address"
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
              <button
                className="cancel-button"
                onClick={() => {
                  if (selectedSupplierForEdit) {
                    setSelectedSupplierForEdit(null);
                    setEditSupplierData({
                      name: '',
                      father_name: '',
                      phone: '',
                      village: '',
                      address: '',
                    });
                  } else {
                    setShowEditSupplierModal(false);
                  }
                }}
              >
                {selectedSupplierForEdit ? t('backToList') : t('cancel')}
              </button>

              {selectedSupplierForEdit && (
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submission Loading Overlay */}
      {submitting && !showPreviewModal && !showNewCustomerModal && (
        <div className="submission-overlay">
          <div className="submission-spinner"></div>
          <div className="submission-message">{t('submittingCollectionsToServer')}</div>
          {submissionTotal > 0 && (
            <div className="submission-progress">
              {t('progress').replace('{progress}', submissionProgress).replace('{total}', submissionTotal)}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
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
      )}

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

      {/* Change Rates Modal */}
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
                    className={`rate-settings-modal-option-btn ${fatSnfRatio === '60_40' ? 'active' : ''}`}
                    onClick={() => {
                      if (fatSnfRatio !== '60_40') {
                        showConfirmation(
                          t('changeFatSnfRatio'),
                          t('areYouSureChangeFatSnfRatioTo').replace('{value}', '60/40'),
                          '60/40',
                          t('thisFatSnfRatioWillBeUsed'),
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
                          t('areYouSureChangeFatSnfRatioTo').replace('{value}', '52/48'),
                          '52/48',
                          t('thisFatSnfRatioWillBeUsed'),
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
                          t('changeBaseSNF'),
                          t('areYouSureChangeBaseSNFTo').replace('{value}', '8.50'),
                          '8.50',
                          t('thisBaseSNFWillBeUsed'),
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
                          t('changeBaseSNF'),
                          t('areYouSureChangeBaseSNFTo').replace('{value}', '9.00'),
                          '9.00',
                          t('thisBaseSNFWillBeUsed'),
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
                    className={`rate-settings-modal-option-btn ${parseFloat(clrConversionFactor) === 0.14 ? 'active' : ''}`}
                    onClick={() => {
                      if (clrConversionFactor !== '0.14') {
                        showConfirmation(
                          t('changeClrConversionFactor'),
                          t('areYouSureChangeClrConversionFactorTo').replace('{value}', '0.14'),
                          '0.14',
                          t('thisClrConversionFactorWillBeUsed'),
                          'clrConversionFactor',
                          '0.14'
                        );
                      }
                    }}
                  >
                    0.14
                  </button>
                  <button
                    className={`rate-settings-modal-option-btn ${parseFloat(clrConversionFactor) === 0.50 ? 'active' : ''}`}
                    onClick={() => {
                      if (clrConversionFactor !== '0.50') {
                        showConfirmation(
                          t('changeClrConversionFactor'),
                          t('areYouSureChangeClrConversionFactorTo').replace('{value}', '0.50'),
                          '0.50',
                          t('thisClrConversionFactorWillBeUsed'),
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
            {/* <button
              className="notification-close"
              onClick={() => setShowSuccessMessage(false)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button> */}
          </div>
        )
      }
    </div>
  );
};

export default BulkCollectionV1; 
