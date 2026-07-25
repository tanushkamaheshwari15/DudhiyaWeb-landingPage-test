import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCollections, getCustomerCollections, getCustomers, getCollectionsByDateRange, getFilteredCollections, updateCollection, updateAddedMilkRateCollection, convertProRataToRegular, deleteCollection, getDairyInfo, getUserInfo, getProRataRateChart, createProRataRateChart, updateProRataRateChart, patchDairyInfo } from '../services/api';
import { removeToken } from '../services/tokenStorage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faArrowLeft, faSearch, faTimes, faUserAlt, faFilter, faCalendarAlt, faEdit, faEye, faCheck, faCheckCircle, faSpinner, faSortAmountDown, faSortAmountUp, faTrash, faDollarSign, faCog, faChartBar, faPlus, faClock, faChartLine, faExclamationTriangle, faChevronDown, faInfoCircle, faRupeeSign, faPercentage, faVial, faLightbulb, faSave, faHeadphones, faPhone, faAngleDown, faTag } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import Navbar from './Navbar';
import './PreviewCollections.css';
import { toast } from 'react-toastify';
import ProRataReportGenerator from './ProRataReportGenerator';

// Simple toast helper with autoClose
const showToast = (message, type = 'info') => {
  const options = {
    position: 'top-center',
    autoClose: 8000,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: false
  };

  switch (type) {
    case 'success':
      return toast.success(message, options);
    case 'error':
      return toast.error(message, options);
    case 'warning':
      return toast.warning(message, options);
    case 'info':
    default:
      return toast.info(message, options);
  }
};

// Additional styles for the date filter type toggle
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

const PreviewProRataCollections = () => {
  const { t } = useLanguage();
  const [collections, setCollections] = useState([]);
  const [filteredCollections, setFilteredCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [success, setSuccess] = useState(null); // Add success state for notifications
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // Changed from 10 to 50
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  // Modal-specific customer filter state (separate from main page filter)
  const [modalSelectedCustomer, setModalSelectedCustomer] = useState(null);

  // Modal-specific animal filter state
  const [modalAnimalFilter, setModalAnimalFilter] = useState('all');

  // Date filter state
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [singleDateFilterMode, setSingleDateFilterMode] = useState(false);
  const [singleDate, setSingleDate] = useState('');

  // Shift filter state
  const [shiftFilter, setShiftFilter] = useState('all'); // 'all', 'morning', 'evening'

  // Animal filter state for page
  const [animalFilter, setAnimalFilter] = useState('all'); // 'all', 'cow', 'buffalo', 'cow_buffalo'

  // Add sort order state - default to descending (newest first)
  const [sortOrder, setSortOrder] = useState('desc');



  // Edit collection state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [originalCollection, setOriginalCollection] = useState(null);
  const [editFormErrors, setEditFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasModifiedFields, setHasModifiedFields] = useState(false); // Track if user modified any field

  // Preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewCollection, setPreviewCollection] = useState(null);

  // Rate chart modal state for collection-specific rates
  const [showRateChartModal, setShowRateChartModal] = useState(false);
  const [collectionFatStepUpRates, setCollectionFatStepUpRates] = useState([{ step: '', rate: '' }]);
  const [collectionSnfStepDownRates, setCollectionSnfStepDownRates] = useState([{ step: '', rate: '' }]);

  // Add state for the edit customer modal
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editCustomerSearchTerm, setEditCustomerSearchTerm] = useState('');
  const [filteredEditCustomers, setFilteredEditCustomers] = useState([]);

  // Support modal state
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Add state for milk rate changes
  const [showAddMilkRateModal, setShowAddMilkRateModal] = useState(false);
  const [showMilkRatePreviewModal, setShowMilkRatePreviewModal] = useState(false);
  const [milkRateFromDate, setMilkRateFromDate] = useState('');
  const [milkRateToDate, setMilkRateToDate] = useState('');
  const [currentMilkRate, setCurrentMilkRate] = useState({ milk_rate: 50 });
  const [currentBaseSnf, setCurrentBaseSnf] = useState(() => {
    const savedBaseSnf = localStorage.getItem('currentBaseSnf');
    return savedBaseSnf ? { base_snf: parseFloat(savedBaseSnf) } : { base_snf: 9.0 };
  });
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [originalCollections, setOriginalCollections] = useState([]); // Store original values for reverting
  const [isLoadingRatePreview, setIsLoadingRatePreview] = useState(false);
  const [isSubmittingRates, setIsSubmittingRates] = useState(false);
  const [ratePreviewError, setRatePreviewError] = useState(null);
  const [convertedCollectionIds, setConvertedCollectionIds] = useState([]);
  // Add state for rate settings modal
  const [showRateSettingsModal, setShowRateSettingsModal] = useState(false);

  // Rate Chart state
  const [rateChartId, setRateChartId] = useState(null);
  const [loadingRateChart, setLoadingRateChart] = useState(false);
  const [savingRateChart, setSavingRateChart] = useState(false);
  const [fatStepUpRates, setFatStepUpRates] = useState([{ step: '6.50', rate: '0.80' }]);
  const [snfStepDownRates, setSnfStepDownRates] = useState([{ step: '9.00', rate: '0.27' }]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Success message state for updates
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentSubmitMessage, setCurrentSubmitMessage] = useState('');

  // Handle close message function
  const handleCloseMessage = () => {
    setSubmitSuccess(false);
    setCurrentSubmitMessage('');
  };
  const [fatSnfRatioUserChanged, setFatSnfRatioUserChanged] = useState(false);
  const [rateChartLoaded, setRateChartLoaded] = useState(false);

  // Add state for rate chart and settings
  const [fatSnfRatio, setFatSnfRatio] = useState(() => {
    const savedRatio = localStorage.getItem('fatSnfRatio');
    return savedRatio || '60_40';
  });
  const [fatStepUpRate, setFatStepUpRate] = useState('0.80');
  const [snfStepDownRate, setSnfStepDownRate] = useState('0.27');

  // Add new state variables for milk rate single date filtering
  const [milkRateSingleDateFilterMode, setMilkRateSingleDateFilterMode] = useState(false);
  const [milkRateSingleDate, setMilkRateSingleDate] = useState('');

  // Add state for collection type (for rate chart functionality)
  const [selectedCollectionType, setSelectedCollectionType] = useState('prorata');

  // Bulk Edit State Variables for Milk Rate Preview Modal
  const [bulkEditFields, setBulkEditFields] = useState({
    milk_rate: '',
    base_snf: '',
    fat_snf_ratio: 'Select',
    clr_conversion: 'Select',
    milk_type: 'Select'
  });

  const [activeBulkFields, setActiveBulkFields] = useState({
    milk_rate: false,
    base_snf: false,
    fat_snf_ratio: false,
    clr_conversion: false,
    milk_type: false,
    rate_chart: false
  });

  // Add state variables for delete functionality
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Add state for bulk update rate & SNF/CLR modal
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [bulkUpdateMilkRate, setBulkUpdateMilkRate] = useState('');
  const [bulkUpdateSnfPercentage, setBulkUpdateSnfPercentage] = useState('');
  const [bulkUpdateClr, setBulkUpdateClr] = useState('');
  const [isSubmittingBulkUpdate, setIsSubmittingBulkUpdate] = useState(false);
  const [bulkUpdateError, setBulkUpdateError] = useState(null);
  const [showBulkUpdateRateTypeModal, setShowBulkUpdateRateTypeModal] = useState(false);
  const [bulkUpdateRateType, setBulkUpdateRateType] = useState(fatSnfRatio || '60_40');

  // Bulk update confirmation modal states
  const [showBulkUpdateConfirmation, setShowBulkUpdateConfirmation] = useState(false);
  const [showFinalSubmitConfirmation, setShowFinalSubmitConfirmation] = useState(false);
  const [bulkUpdatePreview, setBulkUpdatePreview] = useState([]);
  const [bulkUpdatePreviewData, setBulkUpdatePreviewData] = useState([]);
  const [bulkUpdateConfirmationError, setBulkUpdateConfirmationError] = useState(null);

  // State for bulk apply confirmation modal
  const [showBulkApplyConfirmation, setShowBulkApplyConfirmation] = useState(false);

  // State for navbar user info
  const [userInfo, setUserInfo] = useState(null);
  const [dairyInfo, setDairyInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  // Fetch user and dairy information for navbar
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
      } catch (error) {
        console.error('Error fetching user and dairy info:', error);
      } finally {
        setLoadingInfo(false);
      }
    };

    fetchUserAndDairyInfo();
  }, []);

  // Update fetchCollectionsBasedOnFilters for date filter
  const fetchCollectionsBasedOnFilters = useCallback(async (initialLoad = false) => {
    setLoading(true);
    setError(null);

    try {
      if (initialLoad) {
        setCollections([]);
        setFilteredCollections([]);
      }

      let response;

      // Determine which API call to use based on active filters
      if (selectedCustomer && dateFilterActive) {
        // Both customer and date filters are active - use getFilteredCollections
        const options = {
          customerId: selectedCustomer.id,
          ordering: sortOrder === 'asc' ? 'created_at' : '-created_at', // Add ordering parameter based on sortOrder
          isProRata: true // Filter for pro-rata collections only
        };

        if (singleDateFilterMode) {
          options.dateFrom = singleDate;
          options.dateTo = singleDate;
          console.log(`Fetching pro-rata collections for customer ${selectedCustomer.name} on ${singleDate}`);
        } else {
          options.dateFrom = fromDate;
          options.dateTo = toDate;
          console.log(`Fetching pro-rata collections for customer ${selectedCustomer.name} from ${fromDate} to ${toDate}`);
        }

        response = await getFilteredCollections(options);
        console.log('Fetched filtered collections:', response);

        let collectionsData = [];
        if (Array.isArray(response)) {
          collectionsData = response;
        } else if (response && response.results) {
          collectionsData = response.results;
        }

        // Client-side filter: Show collections with rate charts OR is_pro_rata=true
        const proRataCollections = collectionsData.filter(collection => {
          const hasRateChart = collection.pro_rata_collection_rate_chart &&
            collection.pro_rata_collection_rate_chart.fat_step_up_rates &&
            collection.pro_rata_collection_rate_chart.fat_step_up_rates.length > 0;
          const isProRata = collection.is_pro_rata === true || hasRateChart;
          console.log(`Filtering collection ${collection.id}: is_pro_rata=${collection.is_pro_rata}, hasRateChart=${hasRateChart}, keep=${isProRata}`);
          return isProRata;
        });
        console.log(`Filtered ${collectionsData.length} collections down to ${proRataCollections.length} pro-rata collections`);

        // Update collections with calculated finalRate
        const updatedCollections = proRataCollections.map(collection => {
          const derived = calculateDerivedValues(collection);
          return {
            ...collection,
            ...derived  // This includes fat_kg, snf_kg, fat_rate, snf_rate, amount, finalRate, etc.
          };
        });

        setCollections(updatedCollections);
        setFilteredCollections(updatedCollections); // No need to sort again as API handles ordering
        setHasMore(false);
      } else if (dateFilterActive) {
        // Only date filter active
        let ordering = sortOrder === 'asc' ? 'created_at' : '-created_at';

        if (singleDateFilterMode) {
          console.log(`DIRECT API CALL: Fetching ALL pro-rata collections on ${singleDate} ordered by ${ordering}`);
          // Using only date parameters with isProRata filter
          response = await getCollectionsByDateRange(singleDate, singleDate, ordering, { isProRata: true });
        } else {
          console.log(`DIRECT API CALL: Fetching ALL pro-rata collections from ${fromDate} to ${toDate} ordered by ${ordering}`);
          // Using only date parameters with isProRata filter
          response = await getCollectionsByDateRange(fromDate, toDate, ordering, { isProRata: true });
        }

        // Log the response format to debug
        console.log(`Response type: ${typeof response}`);
        if (Array.isArray(response)) {
          console.log(`Received array with ${response.length} collections`);
        } else if (response && typeof response === 'object') {
          if (response.results) {
            console.log(`Received object with ${response.results.length} collections`);
          } else {
            console.log('Received object without results property:', Object.keys(response));
          }
        } else {
          console.log('Unexpected response format:', response);
        }

        // Safety check for response format
        let collectionsData = [];
        if (Array.isArray(response)) {
          collectionsData = response;
        } else if (response && response.results) {
          collectionsData = response.results;
        }

        // Client-side filter: Show collections with rate charts OR is_pro_rata=true
        const proRataCollections = collectionsData.filter(collection => {
          const hasRateChart = collection.pro_rata_collection_rate_chart &&
            collection.pro_rata_collection_rate_chart.fat_step_up_rates &&
            collection.pro_rata_collection_rate_chart.fat_step_up_rates.length > 0;
          const isProRata = collection.is_pro_rata === true || hasRateChart;
          console.log(`Filtering collection ${collection.id}: is_pro_rata=${collection.is_pro_rata}, hasRateChart=${hasRateChart}, keep=${isProRata}`);
          return isProRata;
        });
        console.log(`Filtered ${collectionsData.length} collections down to ${proRataCollections.length} pro-rata collections`);

        // Set the data with calculated finalRate
        const updatedCollections = proRataCollections.map(collection => {
          const derived = calculateDerivedValues(collection);
          return {
            ...collection,
            ...derived  // This includes fat_kg, snf_kg, fat_rate, snf_rate, amount, finalRate, etc.
          };
        });

        setCollections(updatedCollections);
        setFilteredCollections(updatedCollections); // No need to sort again as API handles ordering
        setHasMore(false);
      } else if (selectedCustomer) {
        // Only customer filter active
        console.log(`Fetching all pro-rata collections for customer ID ${selectedCustomer.id} ordered by ${sortOrder === 'asc' ? 'created_at' : '-created_at'}`);
        response = await getCustomerCollections(selectedCustomer.id, {
          ordering: sortOrder === 'asc' ? 'created_at' : '-created_at',
          isProRata: true
        });
        console.log('Fetched pro-rata collections for customer:', selectedCustomer.name);

        // Similarly process the customer filter response
        let collectionsData = [];
        if (Array.isArray(response)) {
          collectionsData = response;
        } else if (response && response.results) {
          collectionsData = response.results;
        }

        // Client-side filter: Show collections with rate charts OR is_pro_rata=true
        const proRataCollections = collectionsData.filter(collection => {
          const hasRateChart = collection.pro_rata_collection_rate_chart &&
            collection.pro_rata_collection_rate_chart.fat_step_up_rates &&
            collection.pro_rata_collection_rate_chart.fat_step_up_rates.length > 0;
          const isProRata = collection.is_pro_rata === true || hasRateChart;
          console.log(`Filtering collection ${collection.id}: is_pro_rata=${collection.is_pro_rata}, hasRateChart=${hasRateChart}, keep=${isProRata}`);
          return isProRata;
        });
        console.log(`Filtered ${collectionsData.length} collections down to ${proRataCollections.length} pro-rata collections`);

        // Update collections with calculated finalRate
        const updatedCollections = proRataCollections.map(collection => {
          const derived = calculateDerivedValues(collection);
          return {
            ...collection,
            ...derived  // This includes fat_kg, snf_kg, fat_rate, snf_rate, amount, finalRate, etc.
          };
        });

        setCollections(updatedCollections);
        setFilteredCollections(updatedCollections); // No need to sort again as API handles ordering
        setHasMore(false);
      } else {
        // No filters active - use normal pagination
        console.log('🔍 PreviewProRataCollections: Fetching PRO-RATA collections only ()');
        const params = {
          page: page,
          limit: pageSize,
          ordering: sortOrder === 'asc' ? 'created_at' : '-created_at',
          isProRata: true
        };
        console.log('📋 API params for pro-rata collections:', params);

        response = await getCollections(params);
        console.log('📊 API response for pro-rata collections:', response);

        let newCollections = response.results || [];

        // Client-side filter: Show collections with rate charts OR is_pro_rata=true
        const proRataCollections = newCollections.filter(collection => {
          const hasRateChart = collection.pro_rata_collection_rate_chart &&
            collection.pro_rata_collection_rate_chart.fat_step_up_rates &&
            collection.pro_rata_collection_rate_chart.fat_step_up_rates.length > 0;
          const isProRata = collection.is_pro_rata === true || hasRateChart;
          console.log(`Filtering collection ${collection.id}: is_pro_rata=${collection.is_pro_rata}, hasRateChart=${hasRateChart}, keep=${isProRata}`);
          return isProRata;
        });
        console.log(`Filtered ${newCollections.length} collections down to ${proRataCollections.length} pro-rata collections`);

        // Use collections directly without recalculation
        const updatedCollections = proRataCollections.map(collection => ({
          ...collection
        }));

        // If first page or initialLoad, replace the collections
        // Otherwise append the new collections
        setCollections((prevCollections) => {
          if (page === 1 || initialLoad) {
            return updatedCollections;
          }
          return [...prevCollections, ...updatedCollections];
        });

        // Apply the filtered collections
        if (page === 1 || initialLoad) {
          setFilteredCollections(updatedCollections);
        } else {
          setFilteredCollections(prev => [...prev, ...updatedCollections]);
        }

        // Check if there's more data to load
        setHasMore(response.next !== null);
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
      let errorMessage = t('failedToLoadCollections');

      if (selectedCustomer && dateFilterActive) {
        if (singleDateFilterMode) {
          errorMessage = t('failedToLoadCollectionsForCustomerOnDate', {
            customerName: selectedCustomer.name,
            date: formatDateForDisplay(singleDate)
          });
        } else {
          errorMessage = t('failedToLoadCollectionsForCustomerBetweenDates', {
            customerName: selectedCustomer.name,
            fromDate: formatDateForDisplay(fromDate),
            toDate: formatDateForDisplay(toDate)
          });
        }
      } else if (selectedCustomer) {
        errorMessage = t('failedToLoadCollectionsForCustomer', {
          customerName: selectedCustomer.name
        });
      } else if (dateFilterActive) {
        if (singleDateFilterMode) {
          errorMessage = t('failedToLoadCollectionsOnDate', {
            date: formatDateForDisplay(singleDate)
          });
        } else {
          errorMessage = t('failedToLoadCollectionsBetweenDates', {
            fromDate: formatDateForDisplay(fromDate),
            toDate: formatDateForDisplay(toDate)
          });
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer, dateFilterActive, fromDate, toDate, singleDate, singleDateFilterMode, page, pageSize, sortOrder]);

  // Effect to fetch collections based on filters and pagination
  useEffect(() => {
    console.log('Fetching collections based on filters and pagination', {
      dateFilterActive,
      selectedCustomer,
      page,
      singleDateFilterMode,
      singleDate,
      fromDate,
      toDate
    });

    fetchCollectionsBasedOnFilters();
  }, [fetchCollectionsBasedOnFilters, dateFilterActive, fromDate, page, selectedCustomer, singleDate, singleDateFilterMode, toDate]);

  // Reset to page 1 when filters change
  useEffect(() => {
    console.log('Filters changed, resetting to page 1');
    setPage(1);
  }, [selectedCustomer, dateFilterActive, fromDate, toDate, singleDate, singleDateFilterMode]);

  // Ensure page starts from top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Mobile-specific scroll positioning fix
  useEffect(() => {
    // Force scroll to top on mobile devices
    const scrollToTop = () => {
      // Check if mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

      if (isMobile) {
        // Multiple scroll methods for better compatibility
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Additional scroll methods for mobile browsers
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;

        // Force scroll to top using scrollIntoView
        const firstElement = document.querySelector('.collections-container');
        if (firstElement) {
          firstElement.scrollIntoView({ top: 0, behavior: 'instant' });
        }
      }
    };

    // Scroll to top immediately
    scrollToTop();

    // Scroll to top after multiple delays to handle async loading
    const timeouts = [
      setTimeout(scrollToTop, 50),
      setTimeout(scrollToTop, 100),
      setTimeout(scrollToTop, 200),
      setTimeout(scrollToTop, 500)
    ];

    return () => timeouts.forEach(timeout => clearTimeout(timeout));
  }, []);

  // Handle orientation change on mobile
  useEffect(() => {
    const handleOrientationChange = () => {
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);

  // Use a separate useEffect to handle search filtering
  useEffect(() => {
    console.log('Search term or collections changed, applying search filter');

    if (!collections || collections.length === 0) {
      return;
    }

    let filtered = collections;

    // Apply search filter if needed
    if (searchTerm.trim() !== '') {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = collections.filter(collection =>
        (collection.customer_name && collection.customer_name.toLowerCase().includes(lowercasedSearch)) ||
        (collection.customer_id && String(collection.customer_id).includes(lowercasedSearch)) ||
        (collection.customer_code && String(collection.customer_code).includes(lowercasedSearch))
      );
      console.log(`Found ${filtered.length} collections matching search "${searchTerm}"`);
    }

    // Apply shift filter if needed
    if (shiftFilter !== 'all') {
      filtered = filtered.filter(collection => {
        if (collection.collection_time === 'morning') {
          return shiftFilter === 'morning';
        } else if (collection.collection_time === 'evening') {
          return shiftFilter === 'evening';
        } else {
          // If collection_time is not 'morning' or 'evening', it's likely a numeric time value
          const hourNumber = parseInt(collection.collection_time.split(':')[0]);
          return shiftFilter === 'morning' ? hourNumber < 12 : hourNumber >= 12;
        }
      });
      console.log(`Found ${filtered.length} collections matching shift filter "${shiftFilter}"`);
    }

    // Apply animal filter if needed
    if (animalFilter !== 'all') {
      filtered = filtered.filter(collection => {
        const animalType = collection.animal_type || 'cow'; // Default to cow if not set
        if (animalFilter === 'cow_buffalo') {
          return animalType === 'cow_buffalo' || animalType === 'mix' || animalType === 'cow+buffalo';
        }
        return animalType === animalFilter;
      });
      console.log(`Found ${filtered.length} collections matching animal filter "${animalFilter}"`);
    }

    // Sort the filtered results using created_at field as per API documentation
    const sortedFiltered = [...filtered].sort((a, b) => {
      // Primary sort by created_at timestamp
      const createdAtA = new Date(a.created_at);
      const createdAtB = new Date(b.created_at);

      return sortOrder === 'asc' ? createdAtA - createdAtB : createdAtB - createdAtA;
    });

    setFilteredCollections(sortedFiltered);
  }, [searchTerm, collections, sortOrder, shiftFilter, animalFilter]);

  // Update the load more button to be hidden when filters are active
  const showLoadMoreButton = !loading && hasMore && !dateFilterActive && !selectedCustomer;

  // When filters change, make sure to reset collections if needed
  useEffect(() => {
    if (dateFilterActive || selectedCustomer) {
      // Reset to page 1 and set hasMore to false when filters are active
      setPage(1);
      setHasMore(false);

      // If the user had a filter active and then changed it, we need to re-fetch
      // This will trigger fetchCollectionsBasedOnFilters through the dependency
      console.log('Filter changed, new fetch will be triggered with reset state');
    }
  }, [dateFilterActive, selectedCustomer, fromDate, toDate, singleDate, singleDateFilterMode]);

  // Load dairy information and set Base SNF from server
  useEffect(() => {
    const loadDairyInfo = async () => {
      try {
        console.log('Loading dairy information...');
        const dairyResponse = await getDairyInfo();
        console.log('DEBUG: PreviewProRata dairy data:', dairyResponse);

        // Set base SNF from dairy info if available
        if (dairyResponse && dairyResponse.base_snf !== undefined) {
          const baseSnfValue = parseFloat(dairyResponse.base_snf);
          console.log('DEBUG: Loading base_snf from server:', dairyResponse.base_snf, 'setting to:', baseSnfValue);
          setCurrentBaseSnf({ base_snf: baseSnfValue });
          localStorage.setItem('currentBaseSnf', baseSnfValue.toString());
        }

        // Set fat/SNF ratio from dairy info if available
        if (dairyResponse && dairyResponse.fat_snf_ratio) {
          // Convert "60/40" to "60_40" for internal state
          const ratio = dairyResponse.fat_snf_ratio.replace('/', '_');
          console.log('DEBUG: Loading fat_snf_ratio from server:', dairyResponse.fat_snf_ratio, 'setting to:', ratio);
          setFatSnfRatio(ratio);
          localStorage.setItem('fatSnfRatio', ratio);
        }

        // Set CLR conversion factor from dairy info if available
        if (dairyResponse && dairyResponse.clr_conversion_factor !== undefined) {
          // Normalize to match button values (0.14 or 0.50)
          const clrValue = parseFloat(dairyResponse.clr_conversion_factor).toFixed(2);
          console.log('DEBUG: Loading clr_conversion_factor from server:', dairyResponse.clr_conversion_factor, 'normalized to:', clrValue);
          // You might want to add state for CLR conversion factor if needed
        }
      } catch (error) {
        console.error('Error loading dairy information:', error);
        // Keep existing values if loading fails
      }
    };

    loadDairyInfo();
  }, []); // Run once on component mount

  // Load rate chart data when modal opens
  useEffect(() => {
    if (showRateChartModal && !rateChartLoaded) {
      const loadRateChart = async () => {
        try {
          setLoadingRateChart(true);
          const response = await getProRataRateChart();

          if (response && response.fat_step_up_rates && response.snf_step_down_rates) {
            setFatStepUpRates(response.fat_step_up_rates);
            setSnfStepDownRates(response.snf_step_down_rates);
            setRateChartId(response.id);

            // Set the first rates for backward compatibility
            if (response.fat_step_up_rates.length > 0) {
              setFatStepUpRate(response.fat_step_up_rates[0].rate);
            }
            if (response.snf_step_down_rates.length > 0) {
              setSnfStepDownRate(response.snf_step_down_rates[0].rate);
            }
          }
        } catch (error) {
          console.error('Error loading rate chart:', error);
          // Keep default values if loading fails
        } finally {
          setLoadingRateChart(false);
        }
      };

      loadRateChart();
    }
  }, [showRateChartModal, rateChartLoaded]);

  // Fetch all customers when modal opens
  const openCustomerModal = async () => {
    setShowCustomerModal(true);
    setCustomerSearchTerm('');

    try {
      setLoadingCustomers(true);
      const response = await getCustomers();
      setCustomers(response.results || response);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(t('failedToLoadCustomers'));
    } finally {
      setLoadingCustomers(false);
    }
  };

  const openDateFilterModal = () => {
    const today = new Date();

    // Initialize with current date if not set
    if (!fromDate) {
      const defaultFromDate = new Date();
      defaultFromDate.setDate(defaultFromDate.getDate() - 7); // Default to 7 days ago
      setFromDate(formatDateForInput(defaultFromDate));
    }

    if (!toDate) {
      setToDate(formatDateForInput(today));
    }

    if (!singleDate) {
      setSingleDate(formatDateForInput(today));
    }

    setShowDateFilterModal(true);
  };

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

  // Apply date filter directly without any pagination
  const applyDateFilter = () => {
    if (singleDateFilterMode) {
      if (!singleDate) {
        alert(t('pleaseSelectDate'));
        return;
      }

      // First close the modal
      setShowDateFilterModal(false);

      console.log('APPLYING SINGLE DATE FILTER:', singleDate);

      // Show loading
      setLoading(true);

      // Clear collections first
      setCollections([]);
      setFilteredCollections([]);

      // Then set filter as active
      setDateFilterActive(true);
      setPage(1);
      setHasMore(false);
    } else {
      if (!fromDate || !toDate) {
        alert(t('pleaseSelectBothFromAndToDates'));
        return;
      }

      // Validate date range
      if (new Date(toDate) < new Date(fromDate)) {
        alert(t('toDateCannotBeEarlierThanFromDate'));
        return;
      }

      // First close the modal
      setShowDateFilterModal(false);

      console.log('APPLYING DATE RANGE FILTER:', fromDate, 'to', toDate);

      // Show loading
      setLoading(true);

      // Clear collections first
      setCollections([]);
      setFilteredCollections([]);

      // Then set filter as active
      setDateFilterActive(true);
      setPage(1);
      setHasMore(false);
    }
  };

  const clearDateFilter = () => {
    // Reset all date filter state
    setDateFilterActive(false);
    setFromDate('');
    setToDate('');
    setSingleDate('');

    // Reset to page 1 to fetch first page of unfiltered data
    setPage(1);

    // This will trigger the fetchCollectionsBasedOnFilters through useEffect dependencies
    console.log('Date filter cleared, fetching unfiltered data');
  };

  const selectCustomer = (customer) => {
    console.log('Selected customer:', customer);
    console.log('Collections before filter:', selectedCollections);

    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    setCustomerSearchTerm('');

    // This will trigger the fetchCollectionsBasedOnFilters through useEffect dependencies
    console.log('Customer selected, fetching filtered data');
  };

  const selectModalCustomer = (customer) => {
    console.log('Selected modal customer:', customer);

    setModalSelectedCustomer(customer);
    setShowCustomerModal(false);
    setCustomerSearchTerm('');

    // Refresh the preview with the new customer filter
    handlePreviewMilkRates(customer);
  };

  // Wrapper function to handle customer selection based on context
  const handleCustomerSelection = (customer) => {
    if (showMilkRatePreviewModal) {
      selectModalCustomer(customer);
    } else {
      selectCustomer(customer);
    }
  };

  const clearCustomerFilter = () => {
    setSelectedCustomer(null);
    setPage(1); // Explicitly reset to page 1
  };

  // Update loadMoreCollections to always load 50 more by default
  const loadMoreCollections = () => {
    if (!loading && hasMore) {
      console.log(`Loading more collections, incrementing page from ${page} to ${page + 1}`);

      // Always load 50 records at a time
      setPageSize(50);

      setPage(prevPage => prevPage + 1);
    } else {
      console.log('Cannot load more:', { loading, hasMore });
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleCustomerSearchChange = (e) => {
    setCustomerSearchTerm(e.target.value);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.customer_id?.toString().includes(customerSearchTerm) ||
    customer.customer_code?.toString().includes(customerSearchTerm)
  );

  const formatDate = (dateString, time) => {
    if (!dateString) return 'N/A';

    // Parse the dateString into a Date object
    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) return dateString; // Return as-is if format unexpected

    const dateObj = new Date(dateString);

    // Format date as DD MMM YY
    const formattedDate = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });

    // Add AM/PM based on collection time
    // Handle both formats: time values ('06:00') and text values ('morning')
    let timeIndicator;
    if (time === 'morning' || (time && time.startsWith('06'))) {
      timeIndicator = 'AM';
    } else {
      timeIndicator = 'PM';
    }

    return `${formattedDate} (${timeIndicator})`;
  };

  // Format number to 2 decimal places
  const formatNumber = (number) => {
    if (number === undefined || number === null) return 'N/A';
    return Number(number).toFixed(2);
  };

  // Format currency
  const formatCurrency = (amount, truncate = false) => {
    if (amount === undefined || amount === null) return 'N/A';
    if (truncate) {
      // Truncate to 3rd digit instead of rounding
      const truncated = Math.floor(amount * 100) / 100;
      return `₹${truncated.toFixed(2)}`;
    }
    return `₹${Number(amount).toFixed(2)}`;
  };

  // Get active filter description for display purposes
  // This function is used in the UI to display current active filters
  // eslint-disable-next-line no-unused-vars
  const getActiveFilterDescription = () => {
    let description = '';

    if (selectedCustomer && dateFilterActive) {
      if (singleDateFilterMode) {
        description = `${selectedCustomer.name}'s collections on ${formatDateForDisplay(singleDate)}`;
      } else {
        description = `${selectedCustomer.name}'s collections from ${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)}`;
      }
    } else if (selectedCustomer) {
      description = `${selectedCustomer.name}'s collections`;
    } else if (dateFilterActive) {
      if (singleDateFilterMode) {
        description = `Collections on ${formatDateForDisplay(singleDate)}`;
      } else {
        description = `Collections from ${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)}`;
      }
    } else if (searchTerm) {
      description = `Collections matching "${searchTerm}"`;
    } else {
      description = 'All collections';
    }

    // Update the sort order description to be explicit about using created_at
    description += ` (sorted by ${sortOrder === 'desc' ? 'newest' : 'oldest'} creation time)`;

    return description;
  };

  // Calculate SNF from CLR - same as in BulkCollectionV1
  const calculateSnfFromClr = (clrValue, fatValue, clrConversionFactor = 0.14) => {
    // Ensure we have valid inputs
    if (!clrValue || !fatValue) {
      return null; // Return null instead of 0
    }

    // Convert strings to numbers to ensure proper calculation
    const clr = parseFloat(clrValue);
    const fat = parseFloat(fatValue);
    const conversionFactor = parseFloat(clrConversionFactor) || 0.14;

    // Additional validation for reasonable values
    if (isNaN(clr) || isNaN(fat) || clr <= 0 || fat <= 0) {
      return null; // Return null instead of 0
    }

    // SNF calculation formula: SNF = (CLR / 4) + (0.20 * FAT) + conversionFactor
    const calculatedSnf = Math.floor(((clr / 4) + (fat * 0.20) + conversionFactor) * 100) / 100;

    return calculatedSnf;
  };

  // Helper function to resolve fat step up rate from thresholds (APK Logic)
  const resolveRateFromFatThresholds = (fatPercent, thresholds) => {
    if (!Array.isArray(thresholds) || thresholds.length === 0) {
      return parseFloat(fatStepUpRate) || 0;
    }

    // Sort thresholds ascending to find highest applicable threshold (APK Logic)
    const sortedThresholds = [...thresholds]
      .filter(t => !isNaN(parseFloat(t.step)) && !isNaN(parseFloat(t.rate)))
      .sort((a, b) => parseFloat(a.step) - parseFloat(b.step));

    // Find highest threshold that value meets or exceeds
    let applicableRate = 0;
    for (let i = 0; i < sortedThresholds.length; i++) {
      const threshold = parseFloat(sortedThresholds[i].step);
      const rate = parseFloat(sortedThresholds[i].rate);
      if (fatPercent >= threshold) {
        applicableRate = rate;
      } else {
        break;
      }
    }

    return applicableRate;
  };

  // Helper function to resolve SNF step down rate from thresholds (APK Logic)
  const resolveRateFromSnfThresholds = (snfPercent, thresholds) => {
    if (!Array.isArray(thresholds) || thresholds.length === 0) {
      return parseFloat(snfStepDownRate) || 0;
    }

    // Sort thresholds descending for SNF step-down (APK Logic)
    const sortedThresholds = [...thresholds]
      .filter(t => !isNaN(parseFloat(t.step)) && !isNaN(parseFloat(t.rate)))
      .sort((a, b) => parseFloat(b.step) - parseFloat(a.step));

    // Rate applies when value is BELOW the threshold
    let applicableRate = 0;
    for (let i = 0; i < sortedThresholds.length; i++) {
      const threshold = parseFloat(sortedThresholds[i].step);
      const rate = parseFloat(sortedThresholds[i].rate);
      if (snfPercent < threshold) {
        applicableRate = rate;
        break; // Take first (highest) threshold that value is below
      }
    }

    return Math.abs(applicableRate);
  };


  // Update functions for rate chart inputs
  const updateFatThreshold = (index, field, value) => {
    const next = [...fatStepUpRates];

    if (field === 'step') {
      // Allow empty value or continue typing
      if (value === '' || isNaN(parseFloat(value))) {
        next[index] = { ...next[index], [field]: value };
        setFatStepUpRates(next);
        return;
      }

      const numValue = parseFloat(value);

      // Validation logic
      if (numValue > 12) {
        alert(t('fatStepCannotBeGreaterThan12'));
        return;
      }

      // Partial input handling while typing
      let isPartialInput = value.endsWith('.');
      if (value.length === 1 && !value.includes('.')) {
        isPartialInput = true;
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

      next[index] = { ...next[index], [field]: value };
    } else {
      // For rate field
      next[index] = { ...next[index], [field]: value };
    }

    setFatStepUpRates(next);
  };

  const updateSnfThreshold = (index, field, value) => {
    const next = [...snfStepDownRates];

    if (field === 'step') {
      // Allow empty value or continue typing
      if (value === '' || isNaN(parseFloat(value))) {
        next[index] = { ...next[index], [field]: value };
        setSnfStepDownRates(next);
        return;
      }

      const numValue = parseFloat(value);

      // Validation logic
      if (numValue < 7 || numValue > 12) {
        alert(t('snfStepMustBeBetween7And12'));
        return;
      }

      // Partial input handling while typing
      let isPartialInput = value.endsWith('.');
      if (value.length === 1 && !value.includes('.')) {
        isPartialInput = true;
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

      next[index] = { ...next[index], [field]: value };
    } else {
      // For rate field
      next[index] = { ...next[index], [field]: value };
    }

    setSnfStepDownRates(next);
  };


  // Calculate derived values - Match ProRataCollection.js Logic
  const calculateDerivedValues = (collection) => {
    // Parse values with proper fallbacks - use same field names as ProRataCollection.js
    const fat = parseFloat(collection.fat_percent || collection.fat_percentage || 0);
    const snf = parseFloat(collection.snf_percent || collection.snf_percentage || 0);
    const weight = parseFloat(collection.weight || collection.kg || 0);
    const rate = parseFloat(collection.milk_rate || 0);
    const baseSnf = parseFloat(collection.base_snf || collection.base_snf_percentage || 9.00);

    // Get fat/SNF ratio percentages based on selected option - handle both formats
    const collectionFatSnfRatio = collection.fat_snf_ratio || fatSnfRatio;
    const fatRatioPercent = collectionFatSnfRatio === '60_40' || collectionFatSnfRatio === '60/40' ? 60 : 52;
    const snfRatioPercent = collectionFatSnfRatio === '60_40' || collectionFatSnfRatio === '60/40' ? 40 : 48;

    // Calculate fat_kg and snf_kg - Same as ProRataCollection.js
    const fatKg = Math.floor((weight * (fat / 100)) * 100) / 100;
    const snfKg = Math.floor((weight * (snf / 100)) * 100) / 100;

    // Calculate component rates - Same as ProRataCollection.js
    const fatRate = Math.floor((rate * fatRatioPercent / 6.5) * 100) / 100;
    const snfRate = Math.floor((rate * snfRatioPercent / baseSnf) * 100) / 100;

    let finalRate = rate;
    let amount = 0;

    // Check if pro rata applies using threshold-based logic - APK Logic
    const collectionRateChart = collection.pro_rata_collection_rate_chart;
    const effectiveFatStepUpRates = collectionRateChart?.fat_step_up_rates || fatStepUpRates;
    const effectiveSnfStepDownRates = collectionRateChart?.snf_step_down_rates || snfStepDownRates;

    // APK Logic: Check if fat percentage meets any threshold with valid rate
    const isProRata = Array.isArray(effectiveFatStepUpRates) && effectiveFatStepUpRates.some((t) => {
      const threshold = parseFloat(t?.step || t?.threshold);
      const rate = parseFloat(t?.rate);
      return !isNaN(threshold) && !isNaN(rate) && !isNaN(fat) && fat >= threshold;
    });

    if (isProRata) {
      // APK Logic: Use adjustment method like APK
      const appliedFatRate = resolveRateFromFatThresholds(fat, effectiveFatStepUpRates);
      const appliedSnfRate = resolveRateFromSnfThresholds(snf, effectiveSnfStepDownRates);
      const fatStepUpRateValue = (parseFloat(appliedFatRate) * 10) || 0;
      const snfStepDownRateValue = (Math.abs(parseFloat(appliedSnfRate)) * 10) || 0;

      // APK Logic: Calculate adjustments
      const fatAdjustment = (fat - 6.5) * fatStepUpRateValue;
      const snfAdjustment = (snf - baseSnf) * snfStepDownRateValue;

      // APK Logic: Apply adjustments to base rate
      finalRate = rate + fatAdjustment + snfAdjustment;
      amount = parseFloat((finalRate * weight).toFixed(2));
    } else {
      // Standard calculation for fat <= threshold - Same as ProRataCollection.js
      const fatAmount = parseFloat(fatKg) * parseFloat(fatRate);
      const snfAmount = parseFloat(snfKg) * parseFloat(snfRate);
      amount = Math.round((fatAmount + snfAmount) * 100) / 100;
    }

    // Calculate solid weight
    const solidWeight = (amount / rate).toFixed(3);

    return {
      fat_kg: fatKg,
      snf_kg: snfKg,
      fat_rate: fatRate,
      snf_rate: snfRate,
      solid_weight: solidWeight,
      amount: amount,
      finalRate: finalRate,
      is_pro_rata: isProRata
    };
  };

  // Update all collections using the pro-rata calculation
  const updateCollectionAmountsWithProRata = () => {
    if (collections.length === 0) return;

    setCollections(prevCollections =>
      prevCollections.map(collection => {
        // Skip if we don't have both fat and SNF values
        if (!collection.fat_percent || !collection.snf_percentage) {
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

  // Format collection for API submission with consistent calculations
  const formatCollectionForAPI = (editingCollection, customerId) => {
    // Make sure customer is sent as a number
    const customerIdNum = typeof customerId === 'string' && !isNaN(parseInt(customerId))
      ? parseInt(customerId)
      : customerId;

    // Handle CLR - use 0 instead of null, like in BulkCollectionV1
    const finalClrValue = parseFloat(editingCollection.clr) || 0;

    // Get base values
    const weight = parseFloat(editingCollection.kg) || 0;
    const fat = parseFloat(editingCollection.fat_percentage) || 0;
    const snf = parseFloat(editingCollection.snf_percentage) || 0; // Ensure snf is a number
    const milkRate = parseFloat(editingCollection.milk_rate) || 0;

    // Ensure base_fat_percentage is valid (use fat percentage as base)
    const baseFatPercentage = 6.5;

    // Calculate liters from kg using the same formula as BulkCollectionV1
    const liters = Math.floor((weight / 1.02249) * 100) / 100;

    // Handle milk_type consistently with animal_type selection
    const animalType = editingCollection.animal_type || 'cow';
    const milkType = animalType === 'mix' ? 'cow_buffalo' : animalType;

    // Get base SNF percentage value - use base_snf_percentage which is the correct API field name
    let baseSnfPercentage = 9.0;
    if (editingCollection.base_snf_percentage && editingCollection.base_snf_percentage !== '') {
      baseSnfPercentage = parseFloat(editingCollection.base_snf_percentage);
    } else if (editingCollection.base_snf && editingCollection.base_snf !== '') {
      // Fall back to base_snf if base_snf_percentage is not available, but this shouldn't happen
      baseSnfPercentage = parseFloat(editingCollection.base_snf);
      console.warn('Using base_snf instead of base_snf_percentage. This should be fixed in the code.');
    }
    console.log('Using base_snf_percentage for API:', baseSnfPercentage);

    // Use stored values from collection object instead of making separate API calls
    const collectionFatSnfRatio = editingCollection.fat_snf_ratio?.replace('_', '/') || '60/40'; // Convert to API format
    const collectionClrConversionFactor = editingCollection.clr_conversion || editingCollection.clr_conversion_factor || '0.14'; // Send as string to match backend choices
    const collectionProRataRateChart = editingCollection.pro_rata_collection_rate_chart || null; // Use stored chart or null

    // Get fat/SNF ratio percentages based on stored collection value
    const fatRatioPercent = collectionFatSnfRatio === '60/40' ? 60 : 52;
    const snfRatioPercent = collectionFatSnfRatio === '60/40' ? 40 : 48;

    // Calculate amount using the same logic as getRealTimeCalculations (Pro-Rata aware)
    const derivedValues = getRealTimeCalculations(editingCollection);
    const amount = derivedValues.amount;
    const fatRate = derivedValues.fat_rate || calculateDerivedValues(editingCollection).fat_rate;
    const snfRate = derivedValues.snf_rate || calculateDerivedValues(editingCollection).snf_rate;
    const fatKg = derivedValues.fat_kg;
    const snfKg = derivedValues.snf_kg;

    // Determine pro-rata applicability using threshold system (same as React Native)
    const fatValForGate = fat;
    const isProRata = Array.isArray(collectionFatStepUpRates) && collectionFatStepUpRates.some(t => {
      const threshold = parseFloat(t?.step);
      return !isNaN(threshold) && !isNaN(fatValForGate) && fatValForGate >= threshold;
    });

    // Resolve applied rates from thresholds (same as React Native)
    const resolveRateFromFatThresholds = (value, thresholds) => {
      if (!Array.isArray(thresholds) || thresholds.length === 0) return 0;
      const val = parseFloat(value);
      if (isNaN(val)) return 0;
      const sortedThresholds = thresholds
        .filter(t => !isNaN(parseFloat(t.step)) && !isNaN(parseFloat(t.rate)))
        .sort((a, b) => parseFloat(a.step) - parseFloat(b.step));
      if (sortedThresholds.length === 0) return 0;
      if (val < parseFloat(sortedThresholds[0].step)) return 0;
      let applicableRate = 0;
      for (let i = 0; i < sortedThresholds.length; i++) {
        const threshold = parseFloat(sortedThresholds[i].step);
        const rate = parseFloat(sortedThresholds[i].rate);
        if (val >= threshold) {
          applicableRate = rate;
        } else {
          break;
        }
      }
      return applicableRate;
    };

    const resolveRateFromSnfThresholds = (value, thresholds) => {
      if (!Array.isArray(thresholds) || thresholds.length === 0) return 0;
      const val = parseFloat(value);
      if (isNaN(val)) return 0;
      const sortedThresholds = thresholds
        .filter(t => !isNaN(parseFloat(t.threshold)) && !isNaN(parseFloat(t.rate)))
        .sort((a, b) => parseFloat(b.threshold) - parseFloat(a.threshold));
      if (sortedThresholds.length === 0) return 0;
      let applicableRate = 0;
      for (let i = 0; i < sortedThresholds.length; i++) {
        const threshold = parseFloat(sortedThresholds[i].threshold);
        const rate = parseFloat(sortedThresholds[i].rate);
        if (val < threshold) {
          applicableRate = rate;
          break;
        }
      }
      return applicableRate;
    };

    // Get thresholds from collection rate chart or use empty arrays
    const fatThresholds = collectionProRataRateChart?.fat_step_up_rates || [];
    const snfThresholds = collectionProRataRateChart?.snf_step_down_rates || [];

    // Resolve applied rates from thresholds
    const appliedFatRate = resolveRateFromFatThresholds(fat, fatThresholds);
    const appliedSnfRate = resolveRateFromSnfThresholds(snf, snfThresholds);

    // Calculate solid weight consistently
    const solidWeight = parseFloat((amount / milkRate).toFixed(3));

    // Prepare collection data for API using only valid fields from API docs
    const formattedCollection = {
      customer: customerIdNum,
      customer_name: editingCollection.customer_name || '', // Add customer_name for display in the preview
      collection_date: editingCollection.collection_date,
      collection_time: editingCollection.collection_time, // "morning" or "evening"
      milk_type: milkType,
      animal_type: editingCollection.animal_type || 'cow', // Add animal_type
      clr_conversion: editingCollection.clr_conversion || '0.14', // Add clr_conversion
      measured: 'kg',
      kg: weight,
      liters: liters,
      fat_percentage: fat,
      snf_percentage: snf,
      base_snf_percentage: baseSnfPercentage, // Only use base_snf_percentage, which is the correct API field
      clr: finalClrValue,
      fat_kg: fatKg,
      snf_kg: snfKg,
      fat_rate: fatRate,
      snf_rate: snfRate,
      milk_rate: Math.round(milkRate * 100) / 100, // Send base rate (NOT final calculated rate) - matches React Native
      fat_step_up_rate: parseFloat(appliedFatRate) || 0, // Use threshold-based rate (matches React Native)
      snf_step_down_rate: parseFloat(appliedSnfRate) || 0, // Use threshold-based rate (matches React Native)
      amount: amount, // Round to 2 decimal places
      solid_weight: solidWeight,
      base_fat_percentage: baseFatPercentage,
      is_pro_rata: true, // Always true for Pro Rata page entries
      // Include stored values from collection object
      fat_snf_ratio: collectionFatSnfRatio,
      clr_conversion_factor: collectionClrConversionFactor,
      pro_rata_collection_rate_chart: collectionProRataRateChart
    };

    // eslint-disable-next-line no-unused-vars
    const customerName = editingCollection.customer_name;

    // Ensure all numeric values are actual numbers, not strings
    Object.keys(formattedCollection).forEach(key => {
      if (typeof formattedCollection[key] === 'number' && isNaN(formattedCollection[key])) {
        if (['fat_percentage', 'base_fat_percentage'].includes(key)) {
          formattedCollection[key] = 6.5;
        } else if (['snf_percentage', 'base_snf_percentage'].includes(key)) {
          formattedCollection[key] = 9.0;
        } else if (['fat_rate', 'snf_rate', 'fat_kg', 'snf_kg', 'solid_weight'].includes(key)) {
          formattedCollection[key] = 0;
        } else if (key === 'milk_rate') {
          formattedCollection[key] = 50.0;
        } else if (key === 'amount') {
          formattedCollection[key] = 0;
        }
      }
    });

    return formattedCollection;
  };

  // Handle edit button click
  const handleEditClick = (collection) => {
    console.log('Collection data from API:', JSON.stringify(collection, null, 2));

    // We need to fetch the actual customer database ID - it might be in different places
    // depending on how the API returns the data
    let customerId = null;

    // Check all possible places where the customer ID might be
    if (collection.customer_db_id) {
      // If the API explicitly returns a customer_db_id field
      customerId = collection.customer_db_id;
      console.log('Found customer database ID in customer_db_id field:', customerId);
    } else if (typeof collection.customer === 'object' && collection.customer && collection.customer.id) {
      // If customer is an object with an id field
      customerId = collection.customer.id;
      console.log('Found customer database ID in customer object:', customerId);
    } else if (typeof collection.customer === 'number' || (typeof collection.customer === 'string' && !isNaN(parseInt(collection.customer)))) {
      // If customer is a number or numeric string
      customerId = typeof collection.customer === 'number' ? collection.customer : parseInt(collection.customer);
      console.log('Found customer database ID in customer field:', customerId);
    } else {
      // If none of the above, we'll need to use the ID from the customers list
      // We'll need to look up the customer by customer_id or name
      console.log('No direct customer database ID found, will need to fetch from customers API');

      // Since we don't have the database ID immediately, we'll try to fetch it
      // based on the customer_id (display ID) or name
      const fetchCustomerId = async () => {
        try {
          const response = await getCustomers();
          const customersData = response.results || response;

          // Try to find the customer by customer_id first
          const foundCustomer = customersData.find(c =>
            c.customer_id === collection.customer_id ||
            c.id === collection.customer_id ||
            c.name === collection.customer_name
          );

          if (foundCustomer) {
            console.log('Found matching customer in API:', foundCustomer);
            return foundCustomer.id; // Use the database ID
          } else {
            console.error('Could not find matching customer in customers list');
            return null;
          }
        } catch (err) {
          console.error('Error fetching customers to find ID:', err);
          return null;
        }
      };

      // Try to get the customer ID asynchronously
      // For now, we'll set it to null and try to resolve it later
      fetchCustomerId().then(id => {
        if (id) {
          console.log('Retrieved customer database ID from API:', id);
          setEditingCollection(prev => ({
            ...prev,
            customer: id // Update with the actual database ID
          }));
        }
      });
    }

    // Determine collection time - handle both string ('06:00') and label formats ('morning')
    let collectionTimeValue = 'morning'; // Default

    if (collection.collection_time) {
      if (collection.collection_time === 'morning' || collection.collection_time === 'evening') {
        collectionTimeValue = collection.collection_time;
      } else if (typeof collection.collection_time === 'string') {
        // If it's a time string like '06:00' or '18:00'
        const hourNumber = parseInt(collection.collection_time.split(':')[0]);
        collectionTimeValue = hourNumber < 12 ? 'morning' : 'evening';
      }
    }

    // Parse numeric values ensuring they're not NaN while preserving decimal places
    const parseNumericValue = (value, field = '') => {
      if (value === undefined || value === null) return '';
      // Check if it's a string with decimal places to preserve them
      if (typeof value === 'string') {
        // If it contains a decimal point, preserve the exact format
        if (value.includes('.')) {
          const parsed = parseFloat(value);
          if (isNaN(parsed)) return '';
          // For kg field, limit to 2 decimal places
          if (field === 'kg') {
            return parsed.toFixed(2);
          }
          return value; // Return original string to preserve decimal places
        }
      }
      const parsed = parseFloat(value);
      return isNaN(parsed) ? '' : parsed.toString();
    };

    // Parse CLR value preserving exact input without rounding
    const parseClrValue = (value) => {
      if (value === undefined || value === null) return '';
      if (value === '') return '';

      const parsed = parseFloat(value);
      if (isNaN(parsed)) return '';

      // Preserve exact input without rounding - ensure max 2 decimal places
      const strValue = parsed.toString();
      const decimalIndex = strValue.indexOf('.');

      if (decimalIndex === -1) {
        // No decimal point, add .00
        return strValue + '.00';
      }

      const decimalPart = strValue.substring(decimalIndex + 1);
      if (decimalPart.length === 0) {
        // Decimal point but no decimals, add .00
        return strValue + '00';
      } else if (decimalPart.length === 1) {
        // One decimal place, add one more zero
        return strValue + '0';
      } else if (decimalPart.length === 2) {
        // Already has 2 decimal places, return as-is
        return strValue;
      } else {
        // More than 2 decimal places, truncate to 2
        return strValue.substring(0, decimalIndex + 3);
      }
    };
    const parseBaseSnfValue = (value) => {
      if (value === undefined || value === null) return '';
      if (value === '') return '';

      const parsed = parseFloat(value);
      if (isNaN(parsed)) return '';

      // Preserve exact input without rounding - ensure max 2 decimal places
      const strValue = parsed.toString();
      const decimalIndex = strValue.indexOf('.');

      if (decimalIndex === -1) {
        // No decimal point, add .00
        return strValue + '.00';
      }

      const decimalPart = strValue.substring(decimalIndex + 1);
      if (decimalPart.length === 0) {
        // Decimal point but no decimals, add .00
        return strValue + '00';
      } else if (decimalPart.length === 1) {
        // One decimal place, add one more zero
        return strValue + '0';
      } else if (decimalPart.length === 2) {
        // Already has 2 decimal places, return as-is
        return strValue;
      } else {
        // More than 2 decimal places, truncate to 2
        return strValue.substring(0, decimalIndex + 3);
      }
    };

    // Get base SNF value - prioritize base_snf_percentage, then fall back to base_snf
    let baseSnfPercentage = '9.0'; // Default value
    if (collection.base_snf_percentage !== undefined && collection.base_snf_percentage !== null) {
      baseSnfPercentage = parseBaseSnfValue(collection.base_snf_percentage);
    } else if (collection.base_snf !== undefined && collection.base_snf !== null) {
      baseSnfPercentage = parseBaseSnfValue(collection.base_snf);
      console.warn('Using base_snf as fallback for base_snf_percentage. This should be fixed in the data.');
    }
    console.log('Loading base_snf_percentage into form:', baseSnfPercentage);

    const formattedCollection = {
      ...collection,
      // Ensure proper data types for form inputs
      customer_name: collection.customer_name || '',
      customer_id: collection.customer_id, // Store the customer_id (reference number) for display
      customer: customerId, // Store the actual database ID for API
      collection_date: collection.collection_date,
      collection_time: collectionTimeValue, // Store as 'morning' or 'evening' for the form
      fat_percentage: parseNumericValue(collection.fat_percentage),
      snf_percentage: parseNumericValue(collection.snf_percentage),
      clr: collection.clr ? parseClrValue(collection.clr) : '',
      kg: parseNumericValue(collection.kg, 'kg'),
      base_snf_percentage: baseSnfPercentage, // Use the correct field name
      milk_rate: parseNumericValue(collection.milk_rate),
      is_pro_rata: collection.is_pro_rata !== undefined ? collection.is_pro_rata : true, // Preserve pro rata status
      fat_snf_ratio: collection.fat_snf_ratio || fatSnfRatio,
      fat_step_up_rate: collection.fat_step_up_rate || fatStepUpRate,
      snf_step_down_rate: collection.snf_step_down_rate || snfStepDownRate,
      animal_type: collection.animal_type || (collection.milk_type === 'cow_buffalo' ? 'mix' : collection.milk_type) || 'cow', // Derive animal_type from milk_type if not set
      // Prioritize the actual CLR conversion factor used when collection was added
      clr_conversion: collection.clr_conversion || (collection.clr_conversion_factor ? parseFloat(collection.clr_conversion_factor).toFixed(2) : '0.14'), // Use stored value or convert from numeric with proper formatting
      clr_conversion_factor: collection.clr_conversion_factor || parseFloat(collection.clr_conversion) || 0.14, // Store numeric version for calculations
      // IMPORTANT: Preserve the original rate chart data
      pro_rata_collection_rate_chart: collection.pro_rata_collection_rate_chart || null
    };

    console.log('Editing collection with customer database ID:', customerId);
    console.log('DEBUG: Collection rate chart data:', collection.pro_rata_collection_rate_chart);
    console.log('DEBUG: CLR conversion (string) from API:', collection.clr_conversion);
    console.log('DEBUG: CLR conversion factor (numeric) from API:', collection.clr_conversion_factor);
    console.log('DEBUG: Final CLR conversion for dropdown:',
      formattedCollection.clr_conversion ||
      (formattedCollection.clr_conversion_factor ? parseFloat(formattedCollection.clr_conversion_factor).toFixed(2) : '0.14')
    );

    // Save the original collection for change detection
    setOriginalCollection(formattedCollection);
    setEditingCollection(formattedCollection);
    setHasUnsavedChanges(false);
    setHasModifiedFields(false); // Reset modified fields flag when opening edit modal
    setEditFormErrors({});
    setShowEditModal(true);
  };

  // Handle form input changes - NO real-time calculations during editing
  const handleEditInputChange = (field, value) => {
    // Validate numeric inputs
    if (['fat_percentage', 'snf_percentage', 'clr', 'kg', 'base_snf_percentage', 'milk_rate', 'fat_step_up_rate', 'snf_step_down_rate', 'clr_conversion'].includes(field)) {
      // Allow empty value for clearing the field
      if (value === '') {
        // Allow empty input
      }
      // For all numeric fields, only block invalid characters (non-numeric, multiple dots)
      else {
        // Check for multiple decimal points
        const dotCount = (value.match(/\./g) || []).length;
        if (dotCount > 1) return;

        // Allow numbers with optional decimal point and digits
        const regex = /^\d*\.?\d*$/;
        if (!regex.test(value)) return;
      }
    }

    const updatedCollection = { ...editingCollection, [field]: value };

    // Handle case where the form field is still called base_snf but we need to update base_snf_percentage
    if (field === 'base_snf') {
      updatedCollection.base_snf_percentage = value;
      console.log('Updated base_snf_percentage to:', value);
    }

    // If CLR conversion factor is changed and CLR is present, recalculate SNF
    if (field === 'clr_conversion') {
      updatedCollection.clr_conversion = value;
      updatedCollection.clr_conversion_factor = parseFloat(value);

      // Recalculate SNF if CLR is present
      if (updatedCollection.clr && updatedCollection.fat_percentage) {
        const calculatedSnf = calculateSnfFromClr(updatedCollection.clr, updatedCollection.fat_percentage, value);
        if (calculatedSnf !== null) {
          updatedCollection.snf_percentage = calculatedSnf.toString();
        }
      }
    }

    // If CLR is changed and fat is present, calculate SNF (this is a dependency, not a rate calculation)
    if (field === 'clr' && value && updatedCollection.fat_percentage) {
      const clrConversionFactor = updatedCollection.clr_conversion_factor || updatedCollection.clr_conversion || '0.14';
      const calculatedSnf = calculateSnfFromClr(value, updatedCollection.fat_percentage, clrConversionFactor);
      if (calculatedSnf !== null) {
        updatedCollection.snf_percentage = calculatedSnf.toString();
      }
    }

    // If fat is changed and CLR is present, recalculate SNF
    if (field === 'fat_percentage' && value !== '' && updatedCollection.clr) {
      const clrConversionFactor = updatedCollection.clr_conversion_factor || updatedCollection.clr_conversion || '0.14';
      const calculatedSnf = calculateSnfFromClr(updatedCollection.clr, value, clrConversionFactor);
      if (calculatedSnf !== null) {
        updatedCollection.snf_percentage = calculatedSnf.toString();
      }
    }

    setEditingCollection(updatedCollection);
    setHasUnsavedChanges(true);

    // Mark fields as modified if they affect calculation (weight, fat, snf, milk_rate, etc.)
    const calculationFields = ['kg', 'fat_percentage', 'snf_percentage', 'milk_rate', 'base_snf_percentage', 'base_snf', 'clr', 'clr_conversion', 'fat_snf_ratio'];
    if (calculationFields.includes(field)) {
      setHasModifiedFields(true);
    }

    // Check if there are any changes compared to original
    if (originalCollection) {
      const hasChanges = JSON.stringify(updatedCollection) !== JSON.stringify(originalCollection);
      setHasUnsavedChanges(hasChanges);
    }

    // Clear any errors for this field
    if (editFormErrors[field]) {
      const updatedErrors = { ...editFormErrors };
      delete updatedErrors[field];
      setEditFormErrors(updatedErrors);
    }
  };

  // Calculate all derived values - called ONLY when clicking Preview/Save
  const calculateAllValues = (collection) => {
    // Step 1: Parse Input Values
    const weightKg = parseFloat(collection.kg) || 0;
    const fatPercentage = parseFloat(collection.fat_percentage) || 0;
    const snfPercentage = parseFloat(collection.snf_percentage) || 0;
    const milkRate = parseFloat(collection.milk_rate) || 0;
    const baseSnfPercentage = parseFloat(collection.base_snf_percentage || collection.base_snf) || 9.0;
    const clrValue = parseFloat(collection.clr) || 0;
    const clrConversion = parseFloat(collection.clr_conversion) || 0.14;

    // Get fat/SNF ratio from collection or fallback to global state - handle both formats
    const collectionFatSnfRatio = collection.fat_snf_ratio || fatSnfRatio;
    const fatRatioPercent = collectionFatSnfRatio === '60_40' || collectionFatSnfRatio === '60/40' ? 60 : 52;
    const snfRatioPercent = collectionFatSnfRatio === '60_40' || collectionFatSnfRatio === '60/40' ? 40 : 48;

    // Step 2: Calculate Basic Conversions
    const fatKg = Math.floor((weightKg * (fatPercentage / 100)) * 100) / 100;
    const snfKg = Math.floor((weightKg * (snfPercentage / 100)) * 100) / 100;

    // Step 3: Calculate Component Rates
    const fatRate = Math.floor((milkRate * fatRatioPercent / 6.5) * 100) / 100;
    const snfRate = Math.floor((milkRate * snfRatioPercent / baseSnfPercentage) * 100) / 100;

    // Step 4: Determine effective rate chart (collection-specific or global)
    const collectionRateChart = collection.pro_rata_collection_rate_chart;
    let effectiveFatStepUpRates = fatStepUpRates;
    let effectiveSnfStepDownRates = snfStepDownRates;

    if (collectionRateChart) {
      effectiveFatStepUpRates = collectionRateChart.fat_step_up_rates || [];
      effectiveSnfStepDownRates = collectionRateChart.snf_step_down_rates || [];
    }

    // Step 5: Check Pro-Rata Applicability - APK Logic
    const isProRata = Array.isArray(effectiveFatStepUpRates) && effectiveFatStepUpRates.some((t) => {
      const threshold = parseFloat(t?.step || t?.threshold);
      const rate = parseFloat(t?.rate);
      return !isNaN(threshold) && !isNaN(rate) && !isNaN(fatPercentage) && fatPercentage >= threshold;
    });

    // Step 6: Final Amount Calculation
    let amount = 0;
    let finalRate = milkRate;

    if (isProRata) {
      // Recalculate using pro-rata formula (same as getRealTimeCalculations)
      const appliedFatRate = resolveRateFromFatThresholds(fatPercentage, effectiveFatStepUpRates);
      const appliedSnfRate = resolveRateFromSnfThresholds(snfPercentage, effectiveSnfStepDownRates);
      const fatStepUpRateValue = (parseFloat(appliedFatRate) * 10) || 0;
      const snfStepDownRateValue = (Math.abs(parseFloat(appliedSnfRate)) * 10) || 0;

      const fatAdjustment = (fatPercentage - 6.5) * fatStepUpRateValue;
      const snfAdjustment = (snfPercentage - baseSnfPercentage) * snfStepDownRateValue;

      finalRate = milkRate + fatAdjustment + snfAdjustment;
      amount = parseFloat((finalRate * weightKg).toFixed(2));

      console.log('🔍 Pro-Rata Recalculation (calculateAllValues):');
      console.log('Applied Fat Rate:', appliedFatRate, 'Applied SNF Rate:', appliedSnfRate);
      console.log('Fat Step Up Rate Value:', fatStepUpRateValue, 'SNF Step Down Rate Value:', snfStepDownRateValue);
      console.log('Fat Adjustment:', fatAdjustment, 'SNF Adjustment:', snfAdjustment);
      console.log('Final Rate:', finalRate);
      console.log('Final Amount:', amount);
    } else {
      // Standard calculation
      const fatAmount = parseFloat(fatKg) * parseFloat(fatRate);
      const snfAmount = parseFloat(snfKg) * parseFloat(snfRate);
      amount = Math.round((fatAmount + snfAmount) * 100) / 100;
    }

    // Step 7: Calculate Solid Weight
    const solidWeight = (amount / milkRate).toFixed(3);

    return {
      fat_kg: fatKg,
      snf_kg: snfKg,
      fat_rate: fatRate,
      snf_rate: snfRate,
      amount: amount,
      finalRate: finalRate,
      solid_weight: solidWeight,
      is_pro_rata: isProRata,
    };
  };

  // Real-time calculation helper for display in edit modal
  const getRealTimeCalculations = (collection, shouldRecalculate = false) => {
    const weightKg = parseFloat(collection.kg) || 0;
    const fatPercentage = parseFloat(collection.fat_percentage) || 0;
    const clr = parseFloat(collection.clr) || 0;
    const milkRate = parseFloat(collection.milk_rate) || 0;
    const baseSnfPercentage = parseFloat(collection.base_snf_percentage || collection.base_snf) || 9.0;
    const clrConversionFactor = parseFloat(collection.clr_conversion || collection.clr_conversion_factor || 0.14);

    // Calculate SNF from CLR if CLR is provided, otherwise use SNF percentage directly
    let snfPercentage;
    if (clr > 0) {
      // SNF calculation formula: ((CLR/4) + (Fat×0.20) + ConversionFactor)
      snfPercentage = Math.floor(((clr / 4) + (fatPercentage * 0.20) + clrConversionFactor) * 100) / 100;
    } else {
      snfPercentage = parseFloat(collection.snf_percentage) || 0;
    }

    // Get fat/SNF ratio - handle both "60/40" and "60_40" formats
    const collectionFatSnfRatio = collection.fat_snf_ratio || fatSnfRatio;
    const fatRatioPercent = collectionFatSnfRatio === '60_40' || collectionFatSnfRatio === '60/40' ? 60 : 52;
    const snfRatioPercent = collectionFatSnfRatio === '60_40' || collectionFatSnfRatio === '60/40' ? 40 : 48;

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

    return { fat_kg: fatKg, snf_kg: snfKg, amount: amount, calculated_snf_percentage: snfPercentage, is_pro_rata: isProRata, finalRate: finalRate, solid_weight: weightKg > 0 ? (amount / milkRate).toFixed(3) : '0.000' };
  };

  // Validate the edited collection
  const validateEditForm = () => {
    const errors = {};

    if (!editingCollection.customer_name) {
      errors.customer_name = t('customerNameRequired');
    }

    if (!editingCollection.collection_date) {
      errors.collection_date = t('collectionDateRequired');
    }

    if (!editingCollection.fat_percentage) {
      errors.fat_percentage = t('fatPercentRequired');
    } else if (isNaN(editingCollection.fat_percentage) || parseFloat(editingCollection.fat_percentage) <= 0) {
      errors.fat_percentage = t('validFatPercentRequired');
    } else if (parseFloat(editingCollection.fat_percentage) > 15) {
      errors.fat_percentage = t('fatPercentCannotExceed15');
    }

    if (!editingCollection.kg) {
      errors.kg = t('weightRequired');
    } else if (isNaN(editingCollection.kg) || parseFloat(editingCollection.kg) <= 0) {
      errors.kg = t('validWeightRequired');
    }

    if (!editingCollection.snf_percentage) {
      errors.snf_percentage = t('snfPercentRequired');
    } else if (isNaN(editingCollection.snf_percentage) || parseFloat(editingCollection.snf_percentage) <= 0) {
      errors.snf_percentage = t('validSnfPercentRequired');
    } else if (parseFloat(editingCollection.snf_percentage) > 15) {
      errors.snf_percentage = t('snfPercentCannotExceed15');
    }

    // CLR is optional, but if provided and not zero, it should be valid
    if (editingCollection.clr && editingCollection.clr.trim() !== '' && parseFloat(editingCollection.clr) !== 0) {
      if (isNaN(editingCollection.clr) || parseFloat(editingCollection.clr) < 0) {
        errors.clr = t('validClrRequired');
      } else {
        // Check if CLR has at least 2 digits before decimal
        const clrValue = parseFloat(editingCollection.clr);
        if (clrValue < 10) {
          errors.clr = t('clrValueInvalid', { value: editingCollection.clr });
        }
      }
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle preview before submission
  const handlePreview = async () => {
    if (!validateEditForm()) {
      return;
    }

    // Ensure we have a valid customer ID - if not, try to find it
    let customerId = editingCollection.customer;

    if (!customerId) {
      console.warn('No customer ID found, attempting to fetch it from API');

      try {
        setIsSubmitting(true);
        const response = await getCustomers();
        const customersData = response.results || response;

        // Try to find by customer_id first, then by name
        const foundCustomer = customersData.find(c =>
          c.customer_id === editingCollection.customer_id ||
          c.id === editingCollection.customer_id ||
          c.name === editingCollection.customer_name
        );

        if (foundCustomer) {
          console.log('Found matching customer in API:', foundCustomer);
          customerId = foundCustomer.id;

          // Update the editing collection with the found customer ID
          setEditingCollection(prev => ({
            ...prev,
            customer: customerId
          }));
        } else {
          console.error('Error: Could not find matching customer in customers list');
          setEditFormErrors({
            customer_name: t('customerNotFoundInSystem'),
            submit: t('pleaseSelectValidCustomerBeforeContinuing')
          });
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
        setEditFormErrors({
          submit: t('failedToVerifyCustomer')
        });
        setIsSubmitting(false);
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    if (!customerId) {
      console.error('Error: No customer ID found in editing collection:', editingCollection);
      setEditFormErrors({
        customer_name: t('customerSelectionIsRequired'),
        submit: t('pleaseSelectValidCustomerBeforeContinuing')
      });
      return;
    }

    // Calculate all derived values before preview - use same function as edit modal
    const calculatedValues = getRealTimeCalculations(editingCollection, true);

    // Update editingCollection with calculated values for preview
    const collectionWithCalculations = {
      ...editingCollection,
      fat_kg: calculatedValues.fat_kg,
      snf_kg: calculatedValues.snf_kg,
      fat_rate: calculatedValues.fat_rate,
      snf_rate: calculatedValues.snf_rate,
      amount: calculatedValues.amount,
      solid_weight: calculatedValues.solid_weight,
      final_rate: calculatedValues.finalRate,
      is_pro_rata: calculatedValues.is_pro_rata
    };

    // Use the formatCollectionForAPI function to get formatted data
    const formattedCollection = formatCollectionForAPI(collectionWithCalculations, customerId);

    console.log('Previewing with customer database ID:', customerId);
    console.log('Calculated values:', calculatedValues);

    setPreviewCollection(formattedCollection);
    setShowPreviewModal(true);
  };

  // Save the edited collection
  const handleSaveEdit = async (e) => {
    // Prevent any default form submission behavior
    if (e) {
      e.preventDefault();
    }

    setIsSubmitting(true);

    try {
      // Ensure we have a valid customer ID - if not, try to find it
      let customerId = editingCollection.customer;

      if (!customerId) {
        console.warn('No customer ID found for save, attempting to fetch it from API');

        try {
          const response = await getCustomers();
          const customersData = response.results || response;

          // Try to find by customer_id first, then by name
          const foundCustomer = customersData.find(c =>
            c.customer_id === editingCollection.customer_id ||
            c.id === editingCollection.customer_id ||
            c.name === editingCollection.customer_name
          );

          if (foundCustomer) {
            console.log('Found matching customer in API for save:', foundCustomer);
            customerId = foundCustomer.id;
          } else {
            console.error('Error: Could not find matching customer in customers list for save');
            setEditFormErrors({
              customer_name: t('customerNotFoundInSystem'),
              submit: t('pleaseSelectValidCustomerBeforeSaving')
            });
            return;
          }
        } catch (err) {
          console.error('Error fetching customers for save:', err);
          setEditFormErrors({
            submit: t('failedToVerifyCustomer')
          });
          return;
        }
      }

      if (!customerId) {
        console.error('Error: No customer ID found for saving:', editingCollection);
        setEditFormErrors({
          customer_name: t('customerSelectionIsRequired'),
          submit: t('pleaseSelectValidCustomerBeforeSaving')
        });
        return;
      }

      // Calculate all derived values before saving
      const calculatedValues = calculateAllValues(editingCollection);

      // IMPORTANT: Always set is_pro_rata to true to keep collection on Pro Rata page
      const isProRata = true;

      // Update editingCollection with calculated values for saving
      const collectionWithCalculations = {
        ...editingCollection,
        fat_kg: calculatedValues.fat_kg,
        snf_kg: calculatedValues.snf_kg,
        fat_rate: calculatedValues.fat_rate,
        snf_rate: calculatedValues.snf_rate,
        amount: calculatedValues.amount,
        solid_weight: calculatedValues.solid_weight,
        final_rate: calculatedValues.finalRate,
        is_pro_rata: isProRata
      };

      // Use the formatCollectionForAPI function to get formatted data
      const collectionData = formatCollectionForAPI(collectionWithCalculations, customerId);

      console.log('Sending update with customer database ID:', customerId);
      console.log('Calculated values:', calculatedValues);
      console.log('Full data being sent to API:', JSON.stringify(collectionData, null, 2));

      // Send update to API
      const response = await updateCollection(editingCollection.id, collectionData);

      // Show success message from backend, fallback to frontend translation if not available
      const successMessage = response?.message || response?.detail || t('collectionUpdatedSuccessfully');
      showToast(successMessage, 'success');

      // Close modals and reset state
      setShowPreviewModal(false);
      setShowEditModal(false);
      setHasUnsavedChanges(false);
      setOriginalCollection(null);

      // Refresh collection data
      fetchCollectionsBasedOnFilters();

    } catch (err) {
      console.error('Error updating collection:', err);
      setEditFormErrors({
        submit: err.message || t('failedToUpdateCollection')
      });
      setShowPreviewModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to open the customer selection modal for editing
  const openEditCustomerModal = async () => {
    setShowEditCustomerModal(true);
    setEditCustomerSearchTerm('');

    try {
      setLoadingCustomers(true);
      const response = await getCustomers();
      const customersData = response.results || response;

      // Log a sample customer to understand the structure
      if (customersData.length > 0) {
        console.log('Sample customer structure:', JSON.stringify(customersData[0], null, 2));
      }

      setCustomers(customersData);
      setFilteredEditCustomers(customersData);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(t('failedToLoadCustomers'));
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Handle customer search in edit modal
  const handleEditCustomerSearchChange = (e) => {
    const query = e.target.value;
    setEditCustomerSearchTerm(query);

    if (query.trim() === '') {
      setFilteredEditCustomers(customers);
    } else {
      const searchLower = query.toLowerCase();
      const filtered = customers.filter(customer => {
        return (
          (customer.name && customer.name.toLowerCase().includes(searchLower)) ||
          (customer.customer_id && customer.customer_id.toString().includes(searchLower)) ||
          (customer.id && customer.id.toString().includes(searchLower))
        );
      });
      setFilteredEditCustomers(filtered);
    }
  };

  // Handle customer selection in edit modal
  const selectEditCustomer = (customer) => {
    console.log('Selected customer:', JSON.stringify(customer, null, 2));

    // Ensure we're using the database ID (from the 'id' field)
    const customerId = customer.id;

    if (!customerId) {
      console.error('Warning: Customer object does not have an ID property:', customer);
    }

    const updatedCollection = {
      ...editingCollection,
      customer: customerId, // Store the actual database ID
      customer_id: customer.customer_id || customerId, // This is for display/reference
      customer_name: customer.name
    };

    console.log('Updated collection with customer ID:', customerId);

    setEditingCollection(updatedCollection);
    setShowEditCustomerModal(false);

    // Check if there are any changes compared to the original collection
    if (originalCollection) {
      const hasChanges = JSON.stringify(updatedCollection) !== JSON.stringify(originalCollection);
      setHasUnsavedChanges(hasChanges);
    }

    // Clear any customer name validation errors
    if (editFormErrors.customer_name) {
      const updatedErrors = { ...editFormErrors };
      delete updatedErrors.customer_name;
      setEditFormErrors(updatedErrors);
    }
  };

  const calculateTotals = useCallback(() => {
    if (!filteredCollections.length) return null;

    return filteredCollections.reduce((totals, collection) => {
      return {
        count: totals.count + 1,
        totalQuantity: totals.totalQuantity + (parseFloat(collection.kg || 0) || 0),
        totalFatKg: totals.totalFatKg + (parseFloat(collection.fat_kg || 0) || 0),
        totalSnfKg: totals.totalSnfKg + (parseFloat(collection.snf_kg || 0) || 0),
        totalSolidWeight: totals.totalSolidWeight + (parseFloat(collection.solid_weight || 0) || 0),
        totalAmount: totals.totalAmount + (parseFloat(collection.amount || 0) || 0),
        totalFatPercent: totals.totalFatPercent + (parseFloat(collection.fat_percentage || collection.fat_percent || 0) || 0),
        totalSnfPercent: totals.totalSnfPercent + (parseFloat(collection.snf_percentage || collection.snf_percent || 0) || 0)
      };
    }, { count: 0, totalQuantity: 0, totalFatKg: 0, totalSnfKg: 0, totalSolidWeight: 0, totalAmount: 0, totalFatPercent: 0, totalSnfPercent: 0 });
  }, [filteredCollections]);

  // Add openAddMilkRateModal function
  const openAddMilkRateModal = () => {
    const today = new Date();

    // Initialize with current date if not set
    if (!milkRateFromDate) {
      const defaultFromDate = new Date();
      defaultFromDate.setDate(defaultFromDate.getDate() - 7); // Default to 7 days ago
      setMilkRateFromDate(formatDateForInput(defaultFromDate));
    }

    if (!milkRateToDate) {
      setMilkRateToDate(formatDateForInput(today));
    }

    if (!milkRateSingleDate) {
      setMilkRateSingleDate(formatDateForInput(today));
    }

    setShowAddMilkRateModal(true);
  };

  // Add handlePreviewMilkRates function
  const handlePreviewMilkRates = async (customerOverride = undefined) => {
    setRatePreviewError(null);

    // Validate milk rate
    if (!currentMilkRate.milk_rate) {
      setRatePreviewError(t('pleaseEnterValidMilkRate'));
      return;
    }

    // Validate date selection
    if (milkRateSingleDateFilterMode) {
      if (!milkRateSingleDate) {
        setRatePreviewError(t('pleaseSelectDate'));
        return;
      }
    } else {
      if (!milkRateFromDate || !milkRateToDate) {
        setRatePreviewError(t('pleaseSelectBothFromAndToDates'));
        return;
      }

      // Validate date range
      if (new Date(milkRateToDate) < new Date(milkRateFromDate)) {
        setRatePreviewError(t('toDateCannotBeEarlierThanFromDate'));
        return;
      }
    }

    try {
      setIsLoadingRatePreview(true);

      let params = {};

      // Set date parameters based on filter mode
      if (milkRateSingleDateFilterMode) {
        params = {
          dateFrom: milkRateSingleDate,
          dateTo: milkRateSingleDate,
          isProRata: true  // Filter for pro-rata collections only
        };
      } else {
        params = {
          dateFrom: milkRateFromDate,
          dateTo: milkRateToDate,
          isProRata: true  // Filter for pro-rata collections only
        };
      }

      // Add customer filter if active
      // Priority: customerOverride > modalSelectedCustomer > selectedCustomer
      const customerToUse = customerOverride !== undefined ? customerOverride :
        (modalSelectedCustomer || selectedCustomer);
      if (customerToUse) {
        params.customerId = customerToUse.id;
      }

      // Add animal filter if active
      if (modalAnimalFilter && modalAnimalFilter !== 'all') {
        params.milkType = modalAnimalFilter;
      }

      // Fetch collections for preview
      const response = await getFilteredCollections(params);

      if (response && response.results) {
        // Filter: Show collections with rate charts OR is_pro_rata=true
        const proRataCollections = response.results.filter(collection => {
          const hasRateChart = collection.pro_rata_collection_rate_chart &&
            collection.pro_rata_collection_rate_chart.fat_step_up_rates &&
            collection.pro_rata_collection_rate_chart.fat_step_up_rates.length > 0;
          return collection.is_pro_rata === true || hasRateChart;
        });
        console.log(`API returned ${response.results.length} collections, filtered to ${proRataCollections.length} pro-rata collections`);

        // Preserve local rate chart changes when re-fetching
        // Only preserve for collections matching the current animal filter
        const mergedCollections = proRataCollections.map(newCollection => {
          const existingCollection = selectedCollections.find(c => c.id === newCollection.id);
          // Only preserve rate chart if collection matches current filter
          const matchesFilter = modalAnimalFilter === 'all' || newCollection.milk_type === modalAnimalFilter;
          if (matchesFilter && existingCollection && existingCollection.pro_rata_collection_rate_chart) {
            // Keep the locally updated rate chart only for filtered collections
            return {
              ...newCollection,
              pro_rata_collection_rate_chart: existingCollection.pro_rata_collection_rate_chart,
              is_pro_rata: existingCollection.is_pro_rata,
              fat_kg: existingCollection.fat_kg,
              snf_kg: existingCollection.snf_kg,
              amount: existingCollection.amount
            };
          }
          return newCollection;
        });

        setSelectedCollections(mergedCollections);
        setOriginalCollections(JSON.parse(JSON.stringify(mergedCollections))); // Store deep copy of original values
        setShowMilkRatePreviewModal(true);
        setShowAddMilkRateModal(false);
      } else {
        setRatePreviewError(t('noProRataCollectionsFoundForSelectedDateRange'));
      }
    } catch (err) {
      console.error('Error fetching pro-rata collections for milk rate preview:', err);
      setRatePreviewError(t('failedToLoadProRataCollectionsForPreview'));
    } finally {
      setIsLoadingRatePreview(false);
    }
  };

  // Add handleMilkRateChange function
  const handleMilkRateChange = (value) => {
    // Update the state even when input is empty
    if (value === '') {
      setCurrentMilkRate({ milk_rate: '' });
      return;
    }

    // Parse the input value
    const numValue = parseFloat(value);

    // If it's not a valid number, return without updating
    if (isNaN(numValue)) {
      return;
    }

    // Accept any number (including 0)
    setCurrentMilkRate({ milk_rate: numValue });

    // Recalculate collections with new milk rate
    const updatedCollections = selectedCollections.map(collection => {
      // Create updated collection with new milk rate and current rate settings
      const updatedCollection = {
        ...collection,
        milk_rate: numValue,
        fat_snf_ratio: fatSnfRatio,
        fat_step_up_rate: fatStepUpRate,
        snf_step_down_rate: snfStepDownRate
      };

      // Use calculateDerivedValues to get all calculated values
      const derived = calculateDerivedValues(updatedCollection);

      // Return the updated collection with all recalculated values
      return {
        ...updatedCollection,
        fat_kg: derived.fat_kg,
        snf_kg: derived.snf_kg,
        fat_rate: derived.fat_rate,
        snf_rate: derived.snf_rate,
        amount: derived.amount,
        solid_weight: derived.solid_weight
      };
    });

    console.log('Updated pro-rata collections after milk rate change:', updatedCollections[0]);
    setSelectedCollections(updatedCollections);
  };

  // Add handleBaseSnfChange function
  const handleBaseSnfChange = (value) => {
    // Update the state even when input is empty
    if (value === '') {
      setCurrentBaseSnf({ base_snf: '' });
      return;
    }

    // Parse the input value
    const numValue = parseFloat(value);

    // If it's not a valid number, return without updating
    if (isNaN(numValue)) {
      return;
    }

    // Accept any number (including 0)
    setCurrentBaseSnf({ base_snf: numValue });

    // Save to localStorage for persistence
    localStorage.setItem('currentBaseSnf', numValue.toString());

    // Recalculate collections with new base SNF
    const updatedCollections = selectedCollections.map(collection => {
      // Create updated collection with new base SNF and current rate settings
      const updatedCollection = {
        ...collection,
        base_snf_percentage: numValue,
        fat_snf_ratio: fatSnfRatio,
        fat_step_up_rate: fatStepUpRate,
        snf_step_down_rate: snfStepDownRate
      };

      // Use calculateDerivedValues to get all calculated values
      const derived = calculateDerivedValues(updatedCollection);

      // Return the updated collection with all recalculated values
      return {
        ...updatedCollection,
        fat_kg: derived.fat_kg,
        snf_kg: derived.snf_kg,
        fat_rate: derived.fat_rate,
        snf_rate: derived.snf_rate,
        amount: derived.amount,
        solid_weight: derived.solid_weight
      };
    });

    console.log('Updated pro-rata collections after base SNF change:', updatedCollections[0]);
    setSelectedCollections(updatedCollections);
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
  const handleApplyMilkRates = async () => {
    try {
      setIsSubmittingRates(true);
      setRatePreviewError(null);

      // Collect success and failure information
      const successfulUpdates = [];
      const failedUpdates = [];

      // Filter collections by animal type if filter is active
      const collectionsToUpdate = selectedCollections.filter(c =>
        modalAnimalFilter === 'all' || c.milk_type === modalAnimalFilter
      );

      // Track progress for reporting
      const totalCollections = collectionsToUpdate.length;

      console.log(`Applying milk rate ${currentMilkRate.milk_rate} and base SNF ${currentBaseSnf.base_snf} to ${totalCollections} pro-rata collections (filtered by: ${modalAnimalFilter})`);
      console.log('Active bulk fields:', activeBulkFields);
      console.log('First collection has rate chart:', collectionsToUpdate[0]?.pro_rata_collection_rate_chart);

      for (let i = 0; i < collectionsToUpdate.length; i++) {
        const collection = collectionsToUpdate[i];

        try {
          // Build update object with only active fields
          let updatedCollection = {};

          // Add fields that are active for bulk editing
          if (activeBulkFields.milk_rate && bulkEditFields.milk_rate) {
            updatedCollection.milk_rate = parseFloat(bulkEditFields.milk_rate);
          }
          if (activeBulkFields.base_snf && bulkEditFields.base_snf) {
            updatedCollection.base_snf_percentage = parseFloat(bulkEditFields.base_snf);
          }
          if (activeBulkFields.fat_snf_ratio && bulkEditFields.fat_snf_ratio) {
            updatedCollection.fat_snf_ratio = bulkEditFields.fat_snf_ratio;
          }
          if (activeBulkFields.milk_type && bulkEditFields.milk_type) {
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
            // Use the new rates from the modal, not the old collection rates
            updatedCollection.pro_rata_collection_rate_chart = {
              fat_step_up_rates: collectionFatStepUpRates.filter(r => r.step && r.rate),
              snf_step_down_rates: collectionSnfStepDownRates.filter(r => r.step && r.rate)
            };
            updatedCollection.is_pro_rata = true;
            console.log(`Collection ${collection.id}: Adding NEW rate chart to update`, {
              fat_step_up_rates: collectionFatStepUpRates.filter(r => r.step && r.rate),
              snf_step_down_rates: collectionSnfStepDownRates.filter(r => r.step && r.rate)
            });
          }

          // If no fields are active, skip this collection
          if (Object.keys(updatedCollection).length === 0) {
            console.log(`Collection ${collection.id}: Skipping - no active fields to update`);
            continue;
          }

          // Add existing calculated values and preserve pro-rata status
          updatedCollection = {
            ...updatedCollection,
            fat_kg: collection.fat_kg,
            snf_kg: collection.snf_kg,
            fat_rate: collection.fat_rate,
            snf_rate: collection.snf_rate,
            amount: collection.amount,
            solid_weight: collection.solid_weight,
            is_pro_rata: true,  // Keep as pro-rata collection
            is_milk_rate: true
          };

          console.log(`Updating pro-rata collection ID ${collection.id} with milk rate ${currentMilkRate.milk_rate} and base SNF ${currentBaseSnf.base_snf}, API payload:`, updatedCollection);

          // Use the dedicated conversion function to update milk rate and convert to regular collection
          console.log(`🔧 Using convertProRataToRegular for collection ${collection.id}`);
          const response = await convertProRataToRegular(collection.id, updatedCollection);

          // Enhanced logging to clearly show is_pro_rata status
          console.log(`🔄 Collection ${collection.id} update status:`);
          console.log(`   - Before update: is_pro_rata = true`);
          console.log(`   - API Response is_pro_rata: ${response?.is_pro_rata}`);
          console.log(`   - Expected is_pro_rata: true (preserving pro-rata status)`);
          console.log(`   - Pro-rata status preserved: ${response?.is_pro_rata === true ? 'YES' : 'NO'}`);

          // Check if the backend preserved the pro-rata status
          if (response && response.is_pro_rata !== true) {
            console.warn(`❌ Collection ${collection.id} has is_pro_rata: ${response.is_pro_rata} after update (backend didn't preserve pro-rata status)`);
          } else {
            console.log(`✅ Collection ${collection.id} successfully updated with pro-rata status preserved: true`);
          }

          // Track successful update
          successfulUpdates.push({
            id: collection.id,
            name: collection.customer_name
          });

          // Add to converted collection IDs for immediate filtering
          setConvertedCollectionIds(prev => [...prev, collection.id]);
        } catch (error) {
          console.error(`Failed to update pro-rata collection ID ${collection.id}:`, error);

          // Track failed update
          failedUpdates.push({
            id: collection.id,
            name: collection.customer_name,
            error: error.error || 'Unknown error'
          });
        }
      }

      // Close the confirmation modal after applying
      setShowBulkApplyConfirmation(false);

      // Don't close the modal - keep it open to show updated data
      // Refresh the collections data within the modal, preserving the modal customer filter
      await handlePreviewMilkRates(modalSelectedCustomer);

      // Show result message using inline success message
      if (failedUpdates.length > 0) {
        setCurrentSubmitMessage(t('updatedProRataCollectionsWithMilkRate', { successful: successfulUpdates.length, failed: failedUpdates.length }));
        setSubmitSuccess(true);
      } else if (successfulUpdates.length > 0) {
        // Determine what was actually updated to show correct message
        let updateMessage = '';
        if (activeBulkFields.rate_chart && !activeBulkFields.milk_rate && !activeBulkFields.base_snf && !activeBulkFields.fat_snf_ratio && !activeBulkFields.milk_type) {
          // Only rate chart was updated
          updateMessage = t('successfullyUpdatedProRataCollectionsWithRateChart', { count: successfulUpdates.length });
        } else if (activeBulkFields.milk_rate && bulkEditFields.milk_rate) {
          // Milk rate was updated (possibly with other fields)
          const appliedMilkRate = bulkEditFields.milk_rate || currentMilkRate.milk_rate;
          updateMessage = t('successfullyUpdatedProRataCollectionsWithMilkRate', { count: successfulUpdates.length, rate: appliedMilkRate });
        } else {
          // Other fields were updated
          updateMessage = t('successfullyUpdatedProRataCollections', { count: successfulUpdates.length });
        }
        setCurrentSubmitMessage(updateMessage);
        setSubmitSuccess(true);
        // Reset all bulk edit checkboxes after successful update
        resetBulkEditState();
      } else {
        // No collections were found or updated
        setCurrentSubmitMessage(t('noProRataCollectionsFoundToUpdate'));
        setSubmitSuccess(true);
      }

      // Refresh main page collections to show updated data instantly
      setTimeout(() => {
        fetchCollectionsBasedOnFilters();
      }, 100);
    } catch (err) {
      console.error('Error applying milk rates and base SNF to pro-rata collections:', err);
      setRatePreviewError(t('failedToApplyMilkRatesAndBaseSnf'));
    } finally {
      setIsSubmittingRates(false);
    }
  };

  // Bulk Edit Functions for Milk Rate Preview Modal
  const toggleBulkField = (fieldName) => {
    const newActiveState = !activeBulkFields[fieldName];
    setActiveBulkFields(prev => ({
      ...prev,
      [fieldName]: newActiveState
    }));

    if (newActiveState) {
      // If activating field and there's a value (not 'Select'), update collections
      if (bulkEditFields[fieldName] && bulkEditFields[fieldName] !== 'Select') {
        handleBulkFieldChange(fieldName, bulkEditFields[fieldName]);
      }
    } else {
      // If deactivating field, revert collections to original values
      revertCollectionsToOriginal(fieldName);
      // Reset the bulk edit field value to default
      setBulkEditFields(prevFields => ({
        ...prevFields,
        [fieldName]: fieldName === 'fat_snf_ratio' || fieldName === 'clr_conversion' || fieldName === 'milk_type' ? 'Select' : ''
      }));
    }
  };

  // Revert collections to original values for a specific field
  const revertCollectionsToOriginal = (field) => {
    const revertedCollections = selectedCollections.map((collection, index) => {
      const originalCollection = originalCollections[index];
      if (!originalCollection) return collection;

      const reverted = { ...collection };

      // Revert the specific field to its original value
      switch (field) {
        case 'milk_rate':
          reverted.milk_rate = originalCollection.milk_rate;
          break;
        case 'base_snf':
          reverted.base_snf = originalCollection.base_snf;
          reverted.base_snf_percentage = originalCollection.base_snf_percentage;
          break;
        case 'fat_snf_ratio':
          reverted.fat_snf_ratio = originalCollection.fat_snf_ratio;
          break;
        case 'clr_conversion':
          reverted.clr_conversion = originalCollection.clr_conversion;
          reverted.clr_conversion_factor = originalCollection.clr_conversion_factor;
          // Restore original SNF values
          reverted.snf_percentage = originalCollection.snf_percentage;
          reverted.snf_percent = originalCollection.snf_percent;
          break;
        case 'milk_type':
          reverted.milk_type = originalCollection.milk_type;
          break;
        case 'rate_chart':
          reverted.pro_rata_collection_rate_chart = originalCollection.pro_rata_collection_rate_chart;
          reverted.is_pro_rata = originalCollection.is_pro_rata;
          break;
        default:
          break;
      }

      // Recalculate amount with original values
      const derived = calculateDerivedValues(reverted);
      reverted.amount = derived.amount;
      reverted.fat_kg = derived.fat_kg;
      reverted.snf_kg = derived.snf_kg;
      reverted.fat_rate = derived.fat_rate;
      reverted.snf_rate = derived.snf_rate;
      reverted.solid_weight = derived.solid_weight;
      reverted.finalRate = derived.finalRate;

      return reverted;
    });

    setSelectedCollections(revertedCollections);
  };

  const handleBulkFieldChange = (fieldName, value) => {
    setBulkEditFields(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Recalculate selected collections with new bulk edit values
    const updatedCollections = selectedCollections.map(collection => {
      const updatedCollection = { ...collection };

      // Apply bulk edit changes
      if (fieldName === 'milk_rate' && value) {
        updatedCollection.milk_rate = parseFloat(value);
      }
      if (fieldName === 'base_snf' && value) {
        updatedCollection.base_snf = parseFloat(value);
        updatedCollection.base_snf_percentage = parseFloat(value);
      }
      if (fieldName === 'fat_snf_ratio' && value && value !== 'Select') {
        updatedCollection.fat_snf_ratio = value;
      }
      // When "Select" is chosen for fat_snf_ratio, restore original
      if (fieldName === 'fat_snf_ratio' && (value === 'Select' || !value)) {
        if (updatedCollection._originalFatSnfRatio !== undefined) {
          updatedCollection.fat_snf_ratio = updatedCollection._originalFatSnfRatio;
          delete updatedCollection._originalFatSnfRatio;
        }
      }
      if (fieldName === 'clr_conversion' && value && value !== 'Select') {
        // Store original SNF before applying CLR conversion (if not already stored)
        if (!updatedCollection._originalSnfPercentage) {
          updatedCollection._originalSnfPercentage = updatedCollection.snf_percentage || updatedCollection.snf_percent;
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
          if (calculatedSnf !== null) {
            updatedCollection.snf_percentage = calculatedSnf.toString();
            updatedCollection.snf_percent = calculatedSnf.toString();
          }
        }
      }
      // When "Select" is chosen for clr_conversion, restore original
      if (fieldName === 'clr_conversion' && (value === 'Select' || !value)) {
        updatedCollection.clr_conversion = 'Select';
        updatedCollection.clr_conversion_factor = null;
        if (updatedCollection._originalSnfPercentage !== undefined) {
          updatedCollection.snf_percentage = updatedCollection._originalSnfPercentage;
          updatedCollection.snf_percent = updatedCollection._originalSnfPercentage;
          delete updatedCollection._originalSnfPercentage;
        }
      }
      // NOTE: milk_type is NOT immediately updated in collections
      // to prevent filtered collections from disappearing.
      // The pending change is shown visually in the table via activeBulkFields check.
      // if (fieldName === 'milk_type' && value && value !== 'Select') {
      //   // Store original before changing
      //   if (!updatedCollection._originalMilkType) {
      //     updatedCollection._originalMilkType = updatedCollection.milk_type;
      //   }
      //   updatedCollection.milk_type = value;
      // }
      // // When "Select" is chosen for milk_type, restore original
      // if (fieldName === 'milk_type' && (value === 'Select' || !value)) {
      //   if (updatedCollection._originalMilkType !== undefined) {
      //     updatedCollection.milk_type = updatedCollection._originalMilkType;
      //     delete updatedCollection._originalMilkType;
      //   }
      // }

      // IMPORTANT: Preserve is_pro_rata = true for collections that are already pro-rata
      // This prevents collections from disappearing during bulk updates
      const preserveProRataStatus = collection.is_pro_rata === true;

      // Recalculate derived values using pro-rata calculation logic
      const derived = calculateDerivedValues(updatedCollection);

      // If collection was originally pro-rata, keep it as pro-rata regardless of fat changes
      if (preserveProRataStatus) {
        derived.is_pro_rata = true;
      }

      return {
        ...updatedCollection,
        fat_kg: derived.fat_kg,
        snf_kg: derived.snf_kg,
        fat_rate: derived.fat_rate,
        snf_rate: derived.snf_rate,
        amount: derived.amount,
        solid_weight: derived.solid_weight,
        is_pro_rata: derived.is_pro_rata // Preserve original pro-rata status
      };
    });

    setSelectedCollections(updatedCollections);
  };

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
      milk_type: false,
      rate_chart: false
    });
  };

  // Helper function to get animal name
  const getAnimalName = (animalType, index) => {
    if (!animalType) return 'Cow';

    switch (animalType.toLowerCase()) {
      case 'cow':
        return 'Cow';
      case 'buffalo':
        return 'Buffalo';
      case 'mix':
        return 'Mix';
      case 'cow+buffalo':
        return 'Cow+Buffalo';
      default:
        return animalType;
    }
  };

  // Handle rate chart functionality
  const handleRateChart = () => {
    // Close the current modal
    setShowMilkRatePreviewModal(false);

    // Open rate chart modal for pro-rata collections
    setShowRateChartModal(true);
  };

  // Add a function to toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prevOrder => prevOrder === 'desc' ? 'asc' : 'desc');
    console.log(`Sort order changed to: ${sortOrder === 'desc' ? 'asc' : 'desc'} (by creation time)`);
  };

  // Handle delete button click
  const handleDeleteClick = (collection) => {
    setCollectionToDelete(collection);
    setShowDeleteConfirmation(true);
    setDeleteError(null);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!collectionToDelete || !collectionToDelete.id) {
      setDeleteError(t('invalidCollectionSelectedForDeletion'));
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteCollection(collectionToDelete.id);

      // Close the delete confirmation modal
      setShowDeleteConfirmation(false);
      setCollectionToDelete(null);

      // Refresh the collections to update the UI
      fetchCollectionsBasedOnFilters();

      // Show a success message (optional)
      showToast(t('collectionDeletedSuccessfully'), 'success');
    } catch (err) {
      console.error('Error deleting collection:', err);
      setDeleteError(err.message || t('failedToDeleteCollection'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle bulk update of rate & SNF/CLR
  const handleBulkUpdate = async () => {
    console.log('DEBUG: handleBulkUpdate called with:', {
      bulkUpdateMilkRate,
      bulkUpdateSnfPercentage,
      bulkUpdateClr
    });

    if (!bulkUpdateMilkRate && !bulkUpdateSnfPercentage && !bulkUpdateClr) {
      setBulkUpdateError(t('pleaseEnterAtLeastOneValueToUpdate'));
      return;
    }

    try {
      setIsSubmittingBulkUpdate(true);
      setBulkUpdateError(null);

      // Get collections to update (filtered collections or all collections if no filters)
      const collectionsToUpdate = filteredCollections.length > 0 ? filteredCollections : collections;

      if (collectionsToUpdate.length === 0) {
        setBulkUpdateError(t('noCollectionsFoundToUpdate'));
        return;
      }

      // Generate preview data for confirmation
      const previewData = await Promise.all(collectionsToUpdate.map(async (collection) => {
        // Extract customer ID
        let customerId = null;

        if (collection.customer !== undefined && collection.customer !== null) {
          if (typeof collection.customer === 'number') {
            customerId = collection.customer;
          } else if (typeof collection.customer === 'string' && !isNaN(parseInt(collection.customer))) {
            customerId = parseInt(collection.customer);
          } else if (typeof collection.customer === 'object' && collection.customer.id) {
            customerId = collection.customer.id;
          }
        }

        if (!customerId && collection.customer_db_id !== undefined && collection.customer_db_id !== null) {
          customerId = collection.customer_db_id;
        }

        if (!customerId && collection.customer_id !== undefined && collection.customer_id !== null) {
          customerId = collection.customer_id;
        }

        // If we only have display customer_id, fetch the actual database customer ID
        if (customerId && (typeof customerId === 'number' || typeof customerId === 'string')) {
          try {
            const customersResponse = await getCustomers();
            const customersData = customersResponse.results || customersResponse;

            const foundCustomer = customersData.find(c =>
              c.customer_id === customerId ||
              c.id === customerId ||
              c.name === collection.customer_name
            );

            if (foundCustomer) {
              customerId = foundCustomer.id;
            }
          } catch (fetchError) {
            console.error('Error fetching customers to find database ID:', fetchError);
          }
        }

        // Calculate new values
        const currentMilkRate = parseFloat(collection.milk_rate) || 0;
        const currentSnfPercentage = parseFloat(collection.snf_percentage) || 0;
        const currentClr = parseFloat(collection.clr) || 0;
        const collectionMethod = getCollectionMethod(collection);

        const newMilkRate = bulkUpdateMilkRate ? parseFloat(bulkUpdateMilkRate) : currentMilkRate;
        let newSnfPercentage = currentSnfPercentage;
        let newClr = currentClr;

        // Update SNF% or CLR based on what's provided and collection method
        if (bulkUpdateSnfPercentage && collectionMethod === 'snf') {
          // Only update SNF for SNF-based collections
          newSnfPercentage = parseFloat(bulkUpdateSnfPercentage);
          // If updating SNF directly, also calculate CLR from SNF and fat
          // CLR formula: CLR = (SNF - 0.5 - fat * conversionFactor) * 4
          const conversionFactor = parseFloat(collection.clr_conversion) || 0.14;
          const fat = parseFloat(collection.fat_percentage) || 0;
          if (fat > 0) {
            newClr = parseFloat(((newSnfPercentage - 0.5 - fat * conversionFactor) * 4).toFixed(2));
          }
        }

        if (bulkUpdateClr && collectionMethod === 'clr') {
          // Only update CLR for CLR-based collections
          newClr = parseFloat(bulkUpdateClr);
          // If CLR is updated and we have fat percentage, recalculate SNF
          if (collection.fat_percentage) {
            const clrConversionFactor = collection.clr_conversion || '0.14';
            newSnfPercentage = calculateSnfFromClr(newClr, parseFloat(collection.fat_percentage), clrConversionFactor);
          }
        }

        // If nothing actually changed (empty or same as current), use current amount
        const milkRateChanged = bulkUpdateMilkRate && parseFloat(bulkUpdateMilkRate) !== currentMilkRate;
        const snfChanged = bulkUpdateSnfPercentage && collectionMethod === 'snf' && parseFloat(bulkUpdateSnfPercentage) !== currentSnfPercentage;
        const clrChanged = bulkUpdateClr && collectionMethod === 'clr' && parseFloat(bulkUpdateClr) !== currentClr;
        const snfOrClrChanged = snfChanged || clrChanged;

        // If nothing changed at all, use current amount
        if (!milkRateChanged && !snfOrClrChanged) {
          return {
            id: collection.id,
            customer_name: collection.customer_name,
            customer_id: customerId,
            collection_date: collection.collection_date,
            collection_time: collection.collection_time,
            milk_type: collection.milk_type,
            kg: parseFloat(collection.kg) || 0,
            fat_percentage: parseFloat(collection.fat_percentage) || 0,
            snf_percentage: currentSnfPercentage,
            clr: currentClr,
            collection_method: collectionMethod,
            current_milk_rate: currentMilkRate,
            current_snf_percentage: currentSnfPercentage,
            current_clr: currentClr,
            current_amount: parseFloat(collection.amount) || 0,
            new_milk_rate: newMilkRate,
            new_snf_percentage: newSnfPercentage,
            new_clr: newClr,
            new_amount: parseFloat(collection.amount) || 0
          };
        }

        // Calculate new amount using the same logic as edit modal
        // (Always recalculate if milk rate changed, even if SNF/CLR unchanged)
        const weight = parseFloat(collection.kg) || 0;
        const fat = parseFloat(collection.fat_percentage) || 0;
        const snf = newSnfPercentage;

        // Get rate settings from collection or fall back to component state
        const collectionFatSnfRatio = collection.fat_snf_ratio || fatSnfRatio || '60_40';
        const baseSnfPercentage = parseFloat(collection.base_snf_percentage) || 9.0;

        // Get effective rate chart (collection-specific or global)
        const collectionRateChart = collection.pro_rata_collection_rate_chart;
        let effectiveFatStepUpRates = fatStepUpRates;
        let effectiveSnfStepDownRates = snfStepDownRates;

        if (collectionRateChart) {
          effectiveFatStepUpRates = collectionRateChart.fat_step_up_rates || [];
          effectiveSnfStepDownRates = collectionRateChart.snf_step_down_rates || [];
        }

        // Get fat/SNF ratio percentages based on selected option
        const fatRatioPercent = collectionFatSnfRatio === '60_40' ? 60 : 52;
        const snfRatioPercent = collectionFatSnfRatio === '60_40' ? 40 : 48;

        // Calculate component rates
        const fatRate = Math.floor((newMilkRate * fatRatioPercent / 6.5 / 100) * 100) / 100;
        const snfRate = Math.floor((newMilkRate * snfRatioPercent / baseSnfPercentage / 100) * 100) / 100;

        const fatKg = Math.floor((weight * (fat / 100)) * 100) / 100;
        const snfKg = Math.floor((weight * (snf / 100)) * 100) / 100;

        // Check Pro-Rata applicability using rate chart thresholds
        const isProRata = Array.isArray(effectiveFatStepUpRates) && effectiveFatStepUpRates.some(t => {
          const threshold = parseFloat(t?.step);
          return !isNaN(threshold) && !isNaN(fat) && fat >= threshold;
        });

        // Apply pro-rata logic
        let newAmount = 0;
        let finalRate = newMilkRate;
        let fatAmount = 0;
        let snfAmount = 0;

        if (isProRata) {
          // Get rates from Rate Chart thresholds
          const appliedFatRate = resolveRateFromFatThresholds(fat, effectiveFatStepUpRates);
          const appliedSnfRate = resolveRateFromSnfThresholds(snf, effectiveSnfStepDownRates);

          // Only apply step rates if they are valid numbers and not null/undefined
          const fatStepUpRateValue = (appliedFatRate && !isNaN(appliedFatRate) ? parseFloat(appliedFatRate) * 10 : 0);
          const snfStepDownRateValue = (appliedSnfRate && !isNaN(appliedSnfRate) ? parseFloat(appliedSnfRate) * 10 : 0);

          // Only apply adjustments if fat is above threshold (not equal)
          const fatAdjustment = fat > 6.5 ? (fat - 6.5) * fatStepUpRateValue : 0;
          // SNF step-down only applies when SNF > base SNF (reduces rate for higher SNF)
          const snfAdjustment = snf > baseSnfPercentage ? (snf - baseSnfPercentage) * snfStepDownRateValue : 0;

          finalRate = newMilkRate + fatAdjustment + snfAdjustment;
          newAmount = parseFloat((finalRate * weight).toFixed(2));
        } else {
          // Standard calculation for fat <= threshold
          fatAmount = parseFloat(fatKg) * parseFloat(fatRate);
          snfAmount = parseFloat(snfKg) * parseFloat(snfRate);
          newAmount = Math.round((fatAmount + snfAmount) * 100) / 100;
        }

        console.log('=== BULK UPDATE CALCULATION ===', {
          collection_id: collection.id,
          collection_name: collection.customer_name,
          collection_method: collectionMethod,
          weight,
          fat,
          snf,
          newMilkRate,
          newSnfPercentage,
          isProRata,
          fatRate,
          snfRate,
          fatKg,
          snfKg,
          finalRate,
          newAmount
        });

        return {
          id: collection.id,
          customer_name: collection.customer_name,
          customer_id: customerId,
          collection_date: collection.collection_date,
          collection_time: collection.collection_time,
          milk_type: collection.milk_type,
          kg: weight,
          fat_percentage: fat,
          snf_percentage: snf,
          clr: collectionMethod === 'clr' ? newClr : collection.clr,
          collection_method: collectionMethod,
          current_milk_rate: currentMilkRate,
          current_snf_percentage: currentSnfPercentage,
          current_clr: currentClr,
          current_amount: parseFloat(collection.amount) || 0,
          new_milk_rate: newMilkRate,
          new_snf_percentage: newSnfPercentage,
          new_clr: newClr,
          new_amount: newAmount,
          fat_snf_ratio: collectionFatSnfRatio,
          fat_step_up_rate: effectiveFatStepUpRates,
          snf_step_down_rate: effectiveSnfStepDownRates,
          pro_rata_collection_rate_chart: collectionRateChart
        };
      }));

      setBulkUpdatePreviewData(previewData);
      setShowBulkUpdateConfirmation(true);
      setShowBulkUpdateModal(false);

    } catch (err) {
      console.error('Error generating bulk update preview:', err);
      setBulkUpdateError(err.message || t('failedToGeneratePreview'));
    } finally {
      setIsSubmittingBulkUpdate(false);
    }
  };

  // Handle confirmation of bulk update
  const handleConfirmBulkUpdate = async () => {
    try {
      setIsSubmittingBulkUpdate(true);
      setBulkUpdateConfirmationError(null);

      // Update each collection
      const updatePromises = bulkUpdatePreviewData.map(async (previewItem) => {
        const updateData = {};

        // Include customer ID
        updateData.customer = previewItem.customer_id;

        // Preserve the is_pro_rata flag
        updateData.is_pro_rata = true;

        // Include rate settings in update
        updateData.fat_snf_ratio = (previewItem.fat_snf_ratio || fatSnfRatio).replace('_', '/');

        // Use collection-specific rate chart if available, otherwise fall back to global
        const collectionRateChart = previewItem.pro_rata_collection_rate_chart;
        if (collectionRateChart) {
          updateData.fat_step_up_rate = collectionRateChart.fat_step_up_rates || [];
          updateData.snf_step_down_rate = collectionRateChart.snf_step_down_rates || [];
        } else {
          updateData.fat_step_up_rate = fatStepUpRate || [];
          updateData.snf_step_down_rate = snfStepDownRate || [];
        }

        // Only include fields that have values
        if (bulkUpdateMilkRate) {
          updateData.milk_rate = previewItem.new_milk_rate;
        }

        // Update SNF% or CLR based on collection method and what was provided
        if (previewItem.collection_method === 'snf' && bulkUpdateSnfPercentage) {
          updateData.snf_percentage = previewItem.new_snf_percentage;
        } else if (previewItem.collection_method === 'clr' && bulkUpdateClr) {
          updateData.clr = previewItem.new_clr;
          // If CLR is updated, also update SNF% since it will be recalculated
          updateData.snf_percentage = previewItem.new_snf_percentage;
        }

        // Include the calculated new amount to match the confirmation table
        if (previewItem.new_amount !== undefined && previewItem.new_amount !== null) {
          updateData.amount = previewItem.new_amount;
        }

        return updateCollection(previewItem.id, updateData);
      });

      await Promise.all(updatePromises);

      // Close confirmation modal and reset form
      setShowBulkUpdateConfirmation(false);
      setShowFinalSubmitConfirmation(false);
      setBulkUpdateMilkRate('');
      setBulkUpdateSnfPercentage('');
      setBulkUpdateClr('');
      setBulkUpdateError(null);
      setBulkUpdatePreviewData([]);

      // Refresh collections
      await fetchCollectionsBasedOnFilters();

      // Show success message
      showToast(t('successfullyUpdatedCollections', { count: bulkUpdatePreviewData.length }), 'success');
    } catch (err) {
      console.error('Error in bulk update:', err);
      setBulkUpdateConfirmationError(err.message || t('failedToUpdateCollections'));
    } finally {
      setIsSubmittingBulkUpdate(false);
    }
  };

  // Handle cancel of bulk update confirmation
  const handleCancelBulkUpdate = () => {
    setShowBulkUpdateConfirmation(false);
    setBulkUpdatePreviewData([]);
    setBulkUpdateConfirmationError(null);
  };

  // Live recalculation when milk rate, SNF%, or CLR changes
  useEffect(() => {
    if (showBulkUpdateConfirmation && bulkUpdatePreviewData.length > 0 && (bulkUpdateMilkRate || bulkUpdateSnfPercentage || bulkUpdateClr)) {
      const updatedPreviewData = bulkUpdatePreviewData.map((item) => {
        // Use new values if provided, otherwise use current values
        const newMilkRate = bulkUpdateMilkRate ? parseFloat(bulkUpdateMilkRate) : item.current_milk_rate;
        let newSnfPercentage = item.current_snf_percentage;
        let newClr = item.current_clr;

        // Update SNF% or CLR based on collection method
        if (item.collection_method === 'snf' && bulkUpdateSnfPercentage) {
          newSnfPercentage = parseFloat(bulkUpdateSnfPercentage);
        } else if (item.collection_method === 'clr' && bulkUpdateClr) {
          newClr = parseFloat(bulkUpdateClr);
          // If CLR is updated and we have fat percentage, recalculate SNF
          if (item.fat_percentage) {
            const clrConversionFactor = item.clr_conversion || '0.14';
            newSnfPercentage = calculateSnfFromClr(newClr, parseFloat(item.fat_percentage), clrConversionFactor);
          }
        }

        // Recalculate with new values
        const weight = item.kg;
        const fat = item.fat_percentage;
        const snf = newSnfPercentage;

        // Get rate settings from collection or fall back to component state
        const collectionFatSnfRatio = item.fat_snf_ratio || fatSnfRatio || '60_40';
        const baseSnfPercentage = item.base_snf_percentage || 9.0;

        // Get effective rate chart (collection-specific or global)
        const collectionRateChart = item.pro_rata_collection_rate_chart;
        let effectiveFatStepUpRates = fatStepUpRates;
        let effectiveSnfStepDownRates = snfStepDownRates;

        if (collectionRateChart) {
          effectiveFatStepUpRates = collectionRateChart.fat_step_up_rates || [];
          effectiveSnfStepDownRates = collectionRateChart.snf_step_down_rates || [];
        }

        // Get fat/SNF ratio percentages based on selected option
        const fatRatioPercent = collectionFatSnfRatio === '60_40' ? 60 : 52;
        const snfRatioPercent = collectionFatSnfRatio === '60_40' ? 40 : 48;

        // Calculate fat_kg and snf_kg
        const fatKg = Math.floor((weight * (fat / 100)) * 100) / 100;
        const snfKg = Math.floor((weight * (snf / 100)) * 100) / 100;

        // Calculate component rates
        const fatRate = Math.floor((newMilkRate * fatRatioPercent / 6.5) * 100) / 100;
        const snfRate = Math.floor((newMilkRate * snfRatioPercent / baseSnfPercentage) * 100) / 100;

        // Check Pro-Rata applicability
        const isProRata = Array.isArray(effectiveFatStepUpRates) && effectiveFatStepUpRates.some(t => {
          const threshold = parseFloat(t?.step);
          return !isNaN(threshold) && !isNaN(fat) && fat >= threshold;
        });

        // Calculate amount with Pro-Rata logic
        let newAmount = 0;
        let newRateDisplay = newMilkRate;

        if (isProRata) {
          // Get rates from Rate Chart thresholds
          const appliedFatRate = resolveRateFromFatThresholds(fat, effectiveFatStepUpRates);
          const appliedSnfRate = resolveRateFromSnfThresholds(snf, effectiveSnfStepDownRates);
          const fatStepUpRateValue = (appliedFatRate * 10) || 0;
          const snfStepDownRateValue = (appliedSnfRate * 10) || 0;

          // Adjustments
          const fatAdjustment = (fat - 6.5) * fatStepUpRateValue;
          // SNF step-down only applies when SNF > base SNF
          const snfAdjustment = snf > baseSnfPercentage ? (snf - baseSnfPercentage) * snfStepDownRateValue : 0;

          // Final calculations
          newRateDisplay = newMilkRate + fatAdjustment + snfAdjustment;
          newAmount = parseFloat((newRateDisplay * weight).toFixed(2));
        } else {
          // Standard calculation
          const fatAmount = parseFloat(fatKg) * parseFloat(fatRate);
          const snfAmount = parseFloat(snfKg) * parseFloat(snfRate);
          newAmount = Math.round((fatAmount + snfAmount) * 100) / 100;
        }

        return {
          ...item,
          new_milk_rate: newMilkRate,
          new_snf_percentage: newSnfPercentage,
          new_clr: newClr,
          new_amount: newAmount,
          is_pro_rata: isProRata
        };
      });

      setBulkUpdatePreviewData(updatedPreviewData);
    }
  }, [bulkUpdateMilkRate, bulkUpdateSnfPercentage, bulkUpdateClr]);

  // Get summary info for bulk update modal
  const getBulkUpdateSummary = () => {
    const collectionsCount = filteredCollections.length > 0 ? filteredCollections.length : collections.length;
    let customerInfo = 'All customers';
    let dateRangeInfo = '';

    if (selectedCustomer) {
      customerInfo = `Customer: ${selectedCustomer.name}`;
    }

    if (dateFilterActive) {
      if (singleDateFilterMode) {
        dateRangeInfo = `Date: ${formatDateForDisplay(singleDate)}`;
      } else {
        dateRangeInfo = `Date Range: ${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)}`;
      }
    }

    return { collectionsCount, customerInfo, dateRangeInfo };
  };

  // Helper function to determine if collection uses CLR or SNF method
  const getCollectionMethod = (collection) => {
    // First check if the collection has isSnfFromClr flag (set when creating collection)
    if (collection.isSnfFromClr === true) {
      return 'clr';
    }
    if (collection.isSnfFromClr === false) {
      return 'snf';
    }

    // Fallback: Check based on values
    const clrValue = collection.clr;
    const snfValue = collection.snf_percentage;

    // Parse values to check if they are meaningful (greater than 0)
    const clrNum = parseFloat(clrValue);
    const snfNum = parseFloat(snfValue);

    const hasClr = !isNaN(clrNum) && clrNum > 0;
    const hasSnf = !isNaN(snfNum) && snfNum > 0;

    // If CLR has a valid value (typical CLR range 20-35 for milk) and SNF is present,
    // it's likely CLR-based (SNF was calculated from CLR)
    if (hasClr && clrNum >= 20 && clrNum <= 35) {
      return 'clr';
    }

    // If only SNF has a valid value and CLR is missing or 0, it's SNF-based
    if (hasSnf && snfNum >= 8 && (!hasClr || clrNum === 0)) {
      return 'snf';
    }

    // If both are present, check typical ranges
    if (hasClr && hasSnf) {
      // CLR-based collections typically have CLR in 20-35 range
      // and calculated SNF in 8-10.5 range
      if (clrNum >= 20 && clrNum <= 35 && snfNum >= 8 && snfNum <= 10.5) {
        return 'clr';
      }

      // If CLR is very low (< 20) but SNF is valid, it's likely SNF-based
      if (clrNum < 20 && snfNum >= 8) {
        return 'snf';
      }
    }

    // Default to SNF if we can't determine
    return hasClr ? 'clr' : 'snf';
  };

  // Get summary of collection methods for the bulk update
  const getBulkUpdateMethodSummary = () => {
    const collectionsToUpdate = filteredCollections.length > 0 ? filteredCollections : collections;
    const clrCollections = collectionsToUpdate.filter(c => getCollectionMethod(c) === 'clr').length;
    const snfCollections = collectionsToUpdate.filter(c => getCollectionMethod(c) === 'snf').length;

    return { clrCollections, snfCollections };
  };

  return (
    <div className="collections-container">
      <style>{`
        .collections-table td.customer-name-cell,
        .collections-table td:nth-child(3) {
          text-align: left !important;
        }
      `}</style>
      <Navbar
        title={t('proRataCollections')}
        onBack={() => navigate('/dashboard')}
        userInfo={userInfo}
        dairyInfo={dairyInfo}
        loadingInfo={loadingInfo}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onClearSearch={clearSearch}
        searchPlaceholder={t('searchCustomerOrId')}
        onSupportClick={() => setShowSupportModal(true)}
      />

      <main className="collections-content">
        {error ? (
          <div className="error-message" style={{ position: 'relative', paddingRight: '40px' }}>
            <p>{error}</p>
            <button onClick={fetchCollectionsBasedOnFilters}>Retry</button>
            <button
              onClick={() => setError(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                color: '#dc3545',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                padding: '0',
                lineHeight: '1'
              }}
              title="Close"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        ) : success ? (
          <div className="success-message">
            <p>{success}</p>
          </div>
        ) : (
          <>
            <div className="collections-filters">

              <div className="filter-card">
                <div className="filter-card-header">
                  <div>
                    <h3>{t('proRataFiltersAndActions')}</h3>
                    <p>{t('targetCollectionsAndUpdateProRataRatesFaster')}</p>
                  </div>
                  {/* <div className="filter-card-badge">
                    {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                  </div> */}
                </div>

                <div className="filter-options">
                  <button
                    className="filter-button customer-filter-button"
                    onClick={openCustomerModal}
                  >
                    <FontAwesomeIcon icon={faUserAlt} />
                    <span>{t('filterByCustomer')}</span>
                  </button>

                  <button
                    className="filter-button date-filter-button"
                    onClick={openDateFilterModal}
                  >
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>{t('filterByDate')}</span>
                  </button>

                  {/* Shift Filter Button */}
                  <div className="filter-button shift-filter-dropdown">
                    <FontAwesomeIcon icon={faClock} />
                    <span className="shift-filter-text">
                      {shiftFilter === 'all' ? t('allShifts') :
                        shiftFilter === 'morning' ? t('morningAm') :
                          shiftFilter === 'evening' ? t('eveningPm') : t('allShifts')}
                    </span>
                    <FontAwesomeIcon icon={faAngleDown} className="shift-filter-icon" />
                    <select
                      value={shiftFilter}
                      onChange={(e) => setShiftFilter(e.target.value)}
                      className="shift-filter-select"
                      style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                    >
                      <option value="all" style={{ cursor: 'pointer' }}>{t('allShifts')}</option>
                      <option value="morning" style={{ cursor: 'pointer' }}>{t('morningAm')}</option>
                      <option value="evening" style={{ cursor: 'pointer' }}>{t('eveningPm')}</option>
                    </select>
                  </div>

                  {/* Animal Filter Dropdown */}
                  <div className="filter-button animal-filter-dropdown">
                    <FontAwesomeIcon icon={faTag} />
                    <span className="animal-filter-text">
                      {animalFilter === 'all' ? t('allAnimals') :
                        animalFilter === 'cow' ? t('cow') :
                          animalFilter === 'buffalo' ? t('buffalo') :
                            animalFilter === 'cow_buffalo' ? t('cowBuffalo') : t('allAnimals')}
                    </span>
                    <FontAwesomeIcon icon={faAngleDown} className="animal-filter-icon" />
                    <select
                      value={animalFilter}
                      onChange={(e) => setAnimalFilter(e.target.value)}
                      className="animal-filter-select"
                      style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                    >
                      <option value="all">{t('allAnimals')}</option>
                      <option value="cow">{t('cow')}</option>
                      <option value="buffalo">{t('buffalo')}</option>
                      <option value="cow_buffalo">{t('cowBuffalo')}</option>
                    </select>
                  </div>

                  {/* Add a Sort Order button */}
                  <button
                    className="filter-button sort-order-button"
                    onClick={toggleSortOrder}
                    title={sortOrder === 'desc' ? t('sortTooltipOldestFirst') : t('sortTooltipNewestFirst')}
                  >
                    <FontAwesomeIcon icon={sortOrder === 'desc' ? faSortAmountDown : faSortAmountUp} />
                    <span>{sortOrder === 'desc' ? t('oldestFirst') : t('newestFirst')}</span>
                  </button>



                  {/* Show Bulk Update button only when both customer and date filters are active */}
                  {/* {selectedCustomer && dateFilterActive && (
                    <button
                      className="filter-button bulk-update-button"
                      onClick={() => setShowBulkUpdateModal(true)}
                    >
                      <FontAwesomeIcon icon={faCog} />
                      <span>{t('bulkUpdateRateAndBaseSNF')}</span>
                    </button>
                  )} */}

                  <div className='pro-shift-right'>
                    <button
                      className="filter-button milk-rate-button"
                      onClick={openAddMilkRateModal}
                    >
                      <FontAwesomeIcon icon={faDollarSign} />
                      <span>{t('bulkRateUpdate')}</span>
                    </button>

                    {/* Add Pro-Rata Report Generator Component */}
                    <div className="report-button-wrapper">
                      <ProRataReportGenerator variant="inline" />
                    </div>
                  </div>

                </div>
              </div>

              {(selectedCustomer || dateFilterActive) && (
                <div className="active-filters-summary">
                  <p>
                    <strong>{t('activeFilters')}</strong>{' '}
                    {selectedCustomer && dateFilterActive
                      ? singleDateFilterMode
                        ? t('showingCollectionsForOn').replace('{name}', selectedCustomer.name).replace('{date}', formatDateForDisplay(singleDate))
                        : t('showingCollectionsForFromTo').replace('{name}', selectedCustomer.name).replace('{fromDate}', formatDateForDisplay(fromDate)).replace('{toDate}', formatDateForDisplay(toDate))
                      : selectedCustomer
                        ? t('showingCollectionsFor').replace('{name}', selectedCustomer.name)
                        : dateFilterActive
                          ? singleDateFilterMode
                            ? t('showingAllCollectionsOn').replace('{date}', formatDateForDisplay(singleDate))
                            : t('showingAllCollectionsFromTo').replace('{fromDate}', formatDateForDisplay(fromDate)).replace('{toDate}', formatDateForDisplay(toDate))
                          : ''}
                  </p>

                  <p>
                    <span title="Current sort order">
                      <strong>{t('sorting')}</strong> {sortOrder === 'desc' ? t('newestFirst') : t('oldestFirst')} {t('byCreationTime')}
                    </span>
                  </p>

                  <p className="filter-action-buttons">
                    {selectedCustomer && (
                      <button
                        className="clear-filter-button"
                        onClick={clearCustomerFilter}
                        title="Clear supplier filter"
                        style={{
                          backgroundColor: '#ff5252',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <FontAwesomeIcon icon={faTimes} /> {t('clearSupplier')}
                      </button>
                    )}

                    {dateFilterActive && (
                      <button
                        className="clear-filter-button"
                        onClick={clearDateFilter}
                        title="Clear date filter"
                        style={{
                          backgroundColor: '#ff5252',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <FontAwesomeIcon icon={faTimes} /> {t('clearDates')}
                      </button>
                    )}
                  </p>
                </div>
              )}

              {/* Show sort order info even when no other filters are active */}
              {!selectedCustomer && !dateFilterActive && filteredCollections.length > 0 && (
                <div className="active-filters-summary">
                  <p>
                    <span title="Current sort order">
                      <strong>{t('sorting')}</strong> {sortOrder === 'desc' ? t('newestFirst') : t('oldestFirst')} {t('byCreationTime')}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {filteredCollections.length === 0 && !loading ? (
              <div className="no-collections">
                {searchTerm || selectedCustomer || dateFilterActive ? (
                  <p>
                    {t('noCollectionsFound')}
                    {searchTerm && ` matching "${searchTerm}"`}
                    {selectedCustomer && ` for customer "${selectedCustomer.name}"`}
                    {dateFilterActive && singleDateFilterMode
                      ? ` on ${formatDateForDisplay(singleDate)}`
                      : dateFilterActive
                        ? ` between ${formatDateForDisplay(fromDate)} and ${formatDateForDisplay(toDate)}`
                        : ''}.
                  </p>
                ) : (
                  <p>{t('noCollectionsFound')}</p>
                )}
              </div>
            ) : (
              <>
                {(searchTerm || selectedCustomer || dateFilterActive) && filteredCollections.length > 0 && (() => {
                  const totals = calculateTotals();
                  if (!totals) return null;

                  const avgFatPercent = totals.count > 0 ? (totals.totalFatPercent / totals.count) : 0;
                  const avgSnfPercent = totals.count > 0 ? (totals.totalSnfPercent / totals.count) : 0;
                  const avgFatLabel = t('avgFat') === 'avgFat' ? 'Avg Fat' : t('avgFat');
                  const avgSnfLabel = t('avgSnf') === 'avgSnf' ? 'Avg SNF' : t('avgSnf');

                  return (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderLeft: '4px solid #0066cc',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      marginBottom: '15px',
                      gap: '12px',
                      flexWrap: 'wrap',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <span style={{ fontWeight: '600', fontSize: '13px', color: '#5f6368' }}>{t('collectionSummary')}:</span>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ fontSize: '13px', color: '#333' }}>
                          Total Qty: <strong>{formatNumber(totals.totalQuantity)} kg</strong>
                        </div>
                        <div style={{ width: '1px', height: '14px', backgroundColor: '#ccc' }}></div>
                        <div style={{ fontSize: '13px', color: '#333' }}>
                          Total Fat: <strong>{formatNumber(totals.totalFatKg)} kg</strong> <span style={{ color: '#e67e22', fontWeight: '600', marginLeft: '4px' }}>({avgFatLabel}: {formatNumber(avgFatPercent)}%)</span>
                        </div>
                        <div style={{ width: '1px', height: '14px', backgroundColor: '#ccc' }}></div>
                        <div style={{ fontSize: '13px', color: '#333' }}>
                         Total SNF: <strong>{formatNumber(totals.totalSnfKg)} kg</strong> <span style={{ color: '#9b59b6', fontWeight: '600', marginLeft: '4px' }}>({avgSnfLabel}: {formatNumber(avgSnfPercent)}%)</span>
                        </div>
                        <div style={{ width: '1px', height: '14px', backgroundColor: '#ccc' }}></div>
                        <div style={{ fontSize: '13px', color: '#333' }}>
                          Total Solid Weight: <strong>{formatNumber(totals.totalSolidWeight)} kg</strong>
                        </div>
                        <div style={{ width: '1px', height: '14px', backgroundColor: '#ccc' }}></div>
                        <div style={{ fontSize: '13px', color: '#333' }}>
                         Total Amt: <strong style={{ color: '#2e7d32' }}>{formatCurrency(totals.totalAmount)}</strong>
                        </div>
                        <div style={{ width: '1px', height: '14px', backgroundColor: '#ccc' }}></div>
                        <div style={{ fontSize: '13px', color: '#333' }}>
                         Total Final Amt: <strong style={{ color: '#0066cc' }}>{formatCurrency(Math.floor(totals.totalAmount * 0.999))}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="collections-table-container">
                <table className="collections-table">
                  <thead>
                    <tr>
                      <th>{t('sNo')}</th>
                      <th>{t('date')}</th>
                      <th>{t('name')}</th>
                      <th>{t('qtyKg')}</th>
                      <th>{t('fatPercent')}</th>
                      <th>{t('snfPercent')}</th>
                      <th>{t('clr')}</th>
                      <th>{t('fatKg')}</th>
                      <th>{t('snfKg')}</th>
                      <th>{t('fatStepUp')}</th>
                      <th>{t('snfStepDown')}</th>
                      {/* <th>{t('fatRate')}</th> */}
                      {/* <th>{t('snfRate')}</th> */}
                      <th>{t('bRate')}</th>
                      <th>{t('rate')}</th>
                      <th>{t('baseSnf')}</th>
                      <th>{t('animalType')}</th>
                      <th>{t('amount')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCollections.map((collection, index) => {
                      // Calculate values to show updated data after bulk updates
                      const calculatedValues = getRealTimeCalculations(collection, true);
                      return (
                        <tr
                          className="collection-row clickable-row"
                          key={collection.id}
                          onClick={() => handleEditClick(collection)}
                          title="Click to edit collection"
                        >
                          <td>{index + 1}</td>
                          <td>{formatDate(collection.collection_date, collection.collection_time)}</td>
                          <td className="customer-name-cell">
                            <div style={{ textAlign: 'left', display: 'block', width: '100%' }}>
                              <span className="customer-id-span" style={{ fontSize: '15px' }}>{collection.customer_id || 'N/A'}</span> - {collection.customer_name || 'N/A'}
                            </div>
                          </td>
                          <td>{formatNumber(collection.kg)}</td>
                          <td>{formatNumber(collection.fat_percentage)}</td>
                          <td
                            style={{
                              opacity: parseFloat(collection.snf_percentage) > 0 ? '1' : '0.5',
                              backgroundColor: parseFloat(collection.snf_percentage) > 0 ? '#e6f7ff' : 'inherit'
                            }}
                          >
                            {formatNumber(collection.snf_percentage)}
                          </td>
                          <td
                            style={{
                              opacity: parseFloat(collection.clr) > 0 ? '1' : '0.5',
                              backgroundColor: parseFloat(collection.clr) > 0 ? '#e6f7ff' : 'inherit'
                            }}
                          >
                            {formatNumber(collection.clr)}
                          </td>
                          <td>{formatNumber(calculatedValues.fat_kg)}</td>
                          <td>{formatNumber(calculatedValues.snf_kg)}</td>
                          <td>
                            <div className="step-rates-container">
                              {collection.pro_rata_collection_rate_chart?.fat_step_up_rates?.map((item, idx) => (
                                <span className="step-rate-badge fat-badge" key={idx}>
                                  {parseFloat(item.step).toFixed(1)}: +{parseFloat(item.rate).toFixed(2)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div className="step-rates-container">
                              {collection.pro_rata_collection_rate_chart?.snf_step_down_rates?.map((item, idx) => (
                                <span className="step-rate-badge snf-badge" key={idx}>
                                  {parseFloat(item.step).toFixed(1)}: -{parseFloat(Math.abs(item.rate)).toFixed(2)}
                                </span>
                              ))}
                            </div>
                          </td>
                          {/* <td>{formatNumber(collection.fat_rate)}</td> */}
                          {/* <td>{formatNumber(collection.snf_rate)}</td> */}
                          <td>{formatNumber(collection.milk_rate)}</td>
                          <td>
                            {formatNumber(calculatedValues.amount / collection.kg)}
                          </td>
                          <td>{formatNumber(collection.base_snf_percentage || collection.base_snf)}</td>
                          <td>{collection.animal_type === 'cow' ? t('cow') : collection.animal_type === 'buffalo' ? t('buffalo') : collection.animal_type === 'mix' || collection.animal_type === 'cow_buffalo' || collection.animal_type === 'cow+buffalo' ? t('mix') : t('cow')}</td>
                          <td>{formatCurrency(calculatedValues.amount, true)}</td>
                          <td className="actions-cell">
                            <button
                              className="edit-button"
                              onClick={() => handleEditClick(collection)}
                              title="Edit collection"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              className="delete-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(collection);
                              }}
                              title="Delete collection"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
            )}

            {(searchTerm || selectedCustomer || dateFilterActive) && filteredCollections.length > 0 && (
              <div className="collection-summary-stats">
                <div className="summary-header">
                  <h3>{t('collectionSummary')}</h3>
                </div>

                {(() => {
                  const totals = calculateTotals();
                  if (!totals) return null;

                  const avgFatPercent = totals.count > 0 ? (totals.totalFatPercent / totals.count) : 0;
                  const avgSnfPercent = totals.count > 0 ? (totals.totalSnfPercent / totals.count) : 0;
                  const avgFatLabel = t('avgFat') === 'avgFat' ? 'Avg Fat' : t('avgFat');
                  const avgSnfLabel = t('avgSnf') === 'avgSnf' ? 'Avg SNF' : t('avgSnf');

                  return (
                    <>
                      <div className="stats-container">
                        <div className="stat-item">
                          <div className="stat-label">{t('totalQuantity')}</div>
                          <div className="stat-value">{formatNumber(totals.totalQuantity)} kg</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">{t('totalFat')}</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                            <div className="stat-value">{formatNumber(totals.totalFatKg)} kg</div>
                            <div className="stat-average" style={{ fontSize: '17px', color: '#166534', fontWeight: '600' }}>
                              {avgFatLabel}%: {formatNumber(avgFatPercent)}%
                            </div>
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">{t('totalSnf')}</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                            <div className="stat-value">{formatNumber(totals.totalSnfKg)} kg</div>
                            <div className="stat-average" style={{ fontSize: '17px', color: '#9a3412', fontWeight: '600' }}>
                              {avgSnfLabel}%: {formatNumber(avgSnfPercent)}%
                            </div>
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">{t('totalSolidWeight')}</div>
                          <div className="stat-value">{formatNumber(totals.totalSolidWeight)} kg</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">{t('totalAmount')}</div>
                          <div className="stat-value">{formatCurrency(totals.totalAmount)}</div>
                        </div>
                      </div>

                      <div className="stat-footer">
                        <span>Final Amount: </span>
                        <span className="final-amount">{formatCurrency(Math.floor(totals.totalAmount * 0.999))}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {loading && (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>{t('loadingCollections')}</p>
              </div>
            )}

            {showLoadMoreButton && (
              <div className="load-more">
                <button onClick={() => loadMoreCollections()} className="load-more-button">
                  {t('loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {showCustomerModal && (
        <div className="modal-overlay">
          <div className="modal-content customer-modal">
            <div className="modal-header">
              <h2>{t('selectCustomer')}</h2>
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
                  placeholder="Search customers..."
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
                  <p>{t('loadingCustomers')}</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="no-customers">
                  <p>{t('noCustomersFound')}</p>
                </div>
              ) : (
                filteredCustomers.map(customer => (
                  <div
                    key={customer.id}
                    className="customer-item"
                    onClick={() => handleCustomerSelection(customer)}
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

      {showDateFilterModal && (
        <div className="modal-overlay">
          <div className="modal-content date-filter-modal">
            <div className="modal-header">
              <h2>{t('filterByDate')}</h2>
              <button
                className="modal-close-button"
                onClick={() => setShowDateFilterModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="date-filter-container">
              <div style={styles.filterTypeToggle}>
                <label
                  style={{
                    ...styles.toggleOption,
                    ...(singleDateFilterMode ? styles.inactiveToggle : styles.activeToggle)
                  }}
                >
                  <input
                    type="radio"
                    name="date-filter-type"
                    checked={!singleDateFilterMode}
                    onChange={() => setSingleDateFilterMode(false)}
                    style={styles.toggleInput}
                  />
                  <span>{t('dateRangeLabel')}</span>
                </label>
                <label
                  style={{
                    ...styles.toggleOption,
                    ...(singleDateFilterMode ? styles.activeToggle : styles.inactiveToggle)
                  }}
                >
                  <input
                    type="radio"
                    name="date-filter-type"
                    checked={singleDateFilterMode}
                    onChange={() => setSingleDateFilterMode(true)}
                    style={styles.toggleInput}
                  />
                  <span>{t('singleDate')}</span>
                </label>
              </div>

              {singleDateFilterMode ? (
                <div className="date-input-group">
                  <label htmlFor="single-date">{t('selectDate')}</label>
                  <input
                    id="single-date"
                    type="date"
                    className="date-input"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
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
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      onClick={(e) => e.target.showPicker()}
                    />
                  </div>

                  <div className="date-input-group">
                    <label htmlFor="to-date">{t('toDate')}</label>
                    <input
                      id="to-date"
                      type="date"
                      className="date-input"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      onClick={(e) => e.target.showPicker()}
                    />
                  </div>
                </>
              )}

              <div className="date-filter-actions">
                <button
                  className="date-filter-button secondary"
                  onClick={() => setShowDateFilterModal(false)}
                >
                  {t('cancel')}
                </button>
                <button
                  className="date-filter-button primary"
                  onClick={applyDateFilter}
                >
                  {t('applyFilter')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingCollection && (
        <div className="modal-overlay">
          <div className="modal-content edit-collection-modal">
            <div className="modal-header">
              <h1>{t('proRataCollectionsModal')}</h1>
              <button
                className="modal-close-button"
                onClick={() => setShowEditModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="edit-collection-container">
              {editFormErrors.submit && (
                <div className="edit-form-error" style={{ position: 'relative', paddingRight: '30px' }}>
                  <p>{editFormErrors.submit}</p>
                  <button
                    onClick={() => setEditFormErrors(prev => ({ ...prev, submit: null }))}
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: 'none',
                      border: 'none',
                      color: '#c62828',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      padding: '0',
                      lineHeight: '1'
                    }}
                    title="Close"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              )}

              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label htmlFor="customer-name" className='edit-text'>{t('supplier')}:</label>
                  <div className="customer-select-container">
                    <input
                      id="customer-name"
                      type="text"
                      value={editingCollection.customer_name || ''}
                      readOnly
                      className={`edit-form-input ${editFormErrors.customer_name ? 'error' : ''}`}
                    />
                    <button
                      type="button"
                      className="customer-select-button"
                      onClick={openEditCustomerModal}
                    >
                      <FontAwesomeIcon icon={faUserAlt} />
                      <span>{t('select')}</span>
                    </button>
                  </div>
                  {editFormErrors.customer_name && <div className="edit-input-error">{editFormErrors.customer_name}</div>}
                </div>

                <div className="edit-form-group">
                  <label htmlFor="collection-date" className='edit-text'>{t('collectionDateEdit')}:</label>
                  <input
                    id="collection-date"
                    type="date"
                    value={editingCollection.collection_date || ''}
                    onChange={(e) => handleEditInputChange('collection_date', e.target.value)}
                    className={`edit-form-input ${editFormErrors.collection_date ? 'error' : ''}`}
                    onClick={(e) => e.target.showPicker()}
                  />
                  {editFormErrors.collection_date && <div className="edit-input-error">{editFormErrors.collection_date}</div>}
                </div>
                <div className="edit-form-group">
                  <label htmlFor="edit-time" className='edit-text'>{t('collectionTimeEdit')}:</label>
                  <select
                    id="edit-time"
                    value={editingCollection.collection_time === 'morning' ? 'morning' : 'evening'}
                    onChange={(e) => handleEditInputChange('collection_time', e.target.value)}
                    className="edit-form-input"
                  >
                    <option value="morning">{t('morning')}</option>
                    <option value="evening">{t('evening')}</option>
                  </select>
                </div>
              </div>

              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label htmlFor="edit-kg" className='edit-text'>{t('weight')}:</label>
                  <input
                    id="edit-kg"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editingCollection.kg}
                    onChange={(e) => handleEditInputChange('kg', e.target.value)}
                    onWheel={(e) => {
                      e.preventDefault();
                      e.target.blur();
                    }}
                    onFocus={(e) => e.target.addEventListener('wheel', function handler(e) {
                      e.preventDefault();
                      e.target.blur();
                    }, { passive: false })}
                    className={`no-spinners edit-form-input ${editFormErrors.kg ? 'error' : ''}`}
                  />
                  {editFormErrors.kg && <div className="edit-input-error">{editFormErrors.kg}</div>}
                </div>

                <div className="edit-form-group">
                  <label htmlFor="edit-fat" className='edit-text'>{t('fatPercentage')}:</label>
                  <input
                    id="edit-fat"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="15"
                    value={editingCollection.fat_percentage || ''}
                    onChange={(e) => handleEditInputChange('fat_percentage', e.target.value)}
                    onWheel={(e) => {
                      e.preventDefault();
                      e.target.blur();
                    }}
                    onFocus={(e) => e.target.addEventListener('wheel', function handler(e) {
                      e.preventDefault();
                      e.target.blur();
                    }, { passive: false })}
                    className={`no-spinners edit-form-input ${editFormErrors.fat_percentage ? 'error' : ''}`}
                  />
                  {editFormErrors.fat_percentage && <div className="edit-input-error">{editFormErrors.fat_percentage}</div>}
                </div>
                <div className="edit-form-group">
                  <label htmlFor="edit-clr" className='edit-text'>CLR:</label>
                  <input
                    id="edit-clr"
                    type="text"
                    value={editingCollection.clr}
                    onChange={(e) => handleEditInputChange('clr', e.target.value)}
                    className={`edit-form-input ${editFormErrors.clr ? 'error' : ''}`}
                  />
                  {editFormErrors.clr && <div className="edit-input-error">{editFormErrors.clr}</div>}
                </div>
              </div>

              <div className="edit-form-row">


                <div className="edit-form-group">
                  <label htmlFor="edit-snf" className='edit-text'>{t('snfPercentage')}:</label>
                  <input
                    id="edit-snf"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="15"
                    value={editingCollection.snf_percentage || ''}
                    onChange={(e) => handleEditInputChange('snf_percentage', e.target.value)}
                    onWheel={(e) => {
                      e.preventDefault();
                      e.target.blur();
                    }}
                    onFocus={(e) => e.target.addEventListener('wheel', function handler(e) {
                      e.preventDefault();
                      e.target.blur();
                    }, { passive: false })}
                    className={`no-spinners edit-form-input ${editFormErrors.snf_percentage ? 'error' : ''}`}
                  />
                  {editFormErrors.snf_percentage && <div className="edit-input-error">{editFormErrors.snf_percentage}</div>}
                </div>

                <div className="edit-form-group">
                  <label htmlFor="edit-base-snf" className='edit-text'>Base SNF %:</label>
                  <input
                    id="edit-base-snf"
                    type="number"
                    step="0.1"
                    min="8.0"
                    max="10.0"
                    value={editingCollection.base_snf_percentage || editingCollection.base_snf}
                    onChange={(e) => handleEditInputChange('base_snf_percentage', e.target.value)}
                    onWheel={(e) => {
                      e.preventDefault();
                      e.target.blur();
                    }}
                    onFocus={(e) => e.target.addEventListener('wheel', function handler(e) {
                      e.preventDefault();
                      e.target.blur();
                    }, { passive: false })}
                    className="edit-form-input no-spinners"
                  />
                </div>
                <div className="edit-form-group">
                  <label htmlFor="edit-rate" className='edit-text'>{t('milkRate')}:</label>
                  <input
                    id="edit-rate"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editingCollection.milk_rate || ''}
                    onChange={(e) => handleEditInputChange('milk_rate', e.target.value)}
                    onWheel={(e) => {
                      e.preventDefault();
                      e.target.blur();
                    }}
                    onFocus={(e) => e.target.addEventListener('wheel', function handler(e) {
                      e.preventDefault();
                      e.target.blur();
                    }, { passive: false })}
                    className="edit-form-input no-spinners"

                  />
                </div>
              </div>

              <div className="edit-form-row">

                <div className="edit-form-group">
                  <label htmlFor="fat-snf-ratio" className='edit-text'>{t('fatSnfRatio')}:</label>
                  <select
                    id="fat-snf-ratio"
                    value={editingCollection.fat_snf_ratio?.replace('_', '/') || fatSnfRatio?.replace('_', '/') || '60/40'}
                    onChange={(e) => handleEditInputChange('fat_snf_ratio', e.target.value.replace('/', '_'))}
                    className="edit-form-input"
                  >
                    <option value="60/40">60/40</option>
                    <option value="52/48">52/48</option>
                  </select>
                </div>
                <div className="edit-form-group">
                  <label htmlFor="animal-type" className='edit-text'>{t('animalType')}:</label>
                  <select
                    id="animal-type"
                    value={editingCollection.animal_type || 'cow'}
                    onChange={(e) => handleEditInputChange('animal_type', e.target.value)}
                    className="edit-form-input"
                  >
                    <option value="cow">{t('cow')}</option>
                    <option value="buffalo">{t('buffalo')}</option>
                    <option value="mix">{t('cowBuffalo')}</option>
                  </select>
                </div>
                <div className="edit-form-group">
                  <label htmlFor="clr-conversion" className='edit-text'>{t('clrConversionFactor')}:</label>
                  <select
                    id="clr-conversion"
                    value={editingCollection.clr_conversion || (editingCollection.clr_conversion_factor ? parseFloat(editingCollection.clr_conversion_factor).toFixed(2) : '0.14')}
                    onChange={(e) => handleEditInputChange('clr_conversion', e.target.value)}
                    className="edit-form-input"
                  >
                    <option value="0.14">0.14</option>
                    <option value="0.50">0.50</option>
                  </select>
                </div>
              </div>


              <div className="edit-form-row">
                <div className="edit-form-group-rate-chart">
                  <button
                    type="button"
                    className="rate-chart-button-edit"
                    onClick={() => {
                      // Extract collection-specific rate chart data
                      const collectionChart = editingCollection?.pro_rata_collection_rate_chart;

                      console.log('DEBUG: Opening rate chart modal with collection data:', editingCollection);
                      console.log('DEBUG: Collection rate chart:', collectionChart);

                      if (collectionChart) {
                        // Extract FAT step-up rates from collection
                        const fatRates = Array.isArray(collectionChart.fat_step_up_rates)
                          ? collectionChart.fat_step_up_rates.map((item) => ({
                            step: item.step ? parseFloat(item.step).toFixed(2) : '',
                            rate: item.rate ? parseFloat(item.rate).toFixed(2) : ''
                          }))
                          : [{ step: '6.50', rate: '0.80' }];

                        // Extract SNF step-down rates from collection
                        const snfRates = Array.isArray(collectionChart.snf_step_down_rates)
                          ? collectionChart.snf_step_down_rates.map((item) => ({
                            step: item.step ? parseFloat(item.step).toFixed(2) : '',
                            rate: item.rate ? parseFloat(Math.abs(item.rate)).toFixed(2) : ''
                          }))
                          : [{ step: '9.00', rate: '0.27' }];

                        console.log('DEBUG: Extracted fat rates:', fatRates);
                        console.log('DEBUG: Extracted snf rates:', snfRates);

                        setCollectionFatStepUpRates(fatRates);
                        setCollectionSnfStepDownRates(snfRates);
                      } else {
                        console.log('DEBUG: No collection rate chart found, using default rates');
                        // Use default rates if no collection-specific chart
                        setCollectionFatStepUpRates([{ step: '6.50', rate: '0.80' }]);
                        setCollectionSnfStepDownRates([{ step: '9.00', rate: '0.27' }]);
                      }

                      setShowRateChartModal(true);
                    }}
                    title="View and manage rate chart"
                  >
                    <FontAwesomeIcon icon={faChartBar} />
                    <span>{t('rateChart')}</span>
                  </button>
                </div>
              </div>

              <div className="edit-form-row calculation-results">
                {(() => {
                  const calculations = getRealTimeCalculations(editingCollection, true);
                  return (
                    <>
                      <div className="calculation-item">
                        <label>{t('fatKg')}:</label>
                        <span>{formatNumber(calculations.fat_kg)}</span>
                      </div>

                      <div className="calculation-item">
                        <label>{t('snfKg')}:</label>
                        <span>{formatNumber(calculations.snf_kg)}</span>
                      </div>

                      <div className="calculation-item">
                        <label>{t('amount')}:</label>
                        <span>{formatCurrency(calculations.amount)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="edit-form-actions">
                <button
                  className="edit-form-button cancel"
                  onClick={() => {
                    setShowEditModal(false);
                    setHasUnsavedChanges(false);
                    setOriginalCollection(null);
                  }}
                  disabled={isSubmitting}
                >
                  {t('cancel')}
                </button>
                <button
                  className="edit-form-button preview"
                  onClick={handlePreview}
                  disabled={isSubmitting || !hasUnsavedChanges}
                >
                  <FontAwesomeIcon icon={faEye} />
                  {t('previewChanges')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* preview edit modal  */}
      {showPreviewModal && previewCollection && (
        <div className="modal-overlay">
          <div className="preview-modal" style={{ width: '95%', maxWidth: '1400px', height: 'fit-content' }}>
            <div className="modal-header">
              <h2>{t('previewChanges')}</h2>
              <button
                className="close-modal-button"
                onClick={() => setShowPreviewModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <div className="preview-header">
                <p className="preview-info">{t('pleaseReviewBeforeSave')}:</p>
              </div>

              <div className="preview-table-container" style={{ maxWidth: '100%', overflowX: 'auto', marginTop: '15px' }}>
                <table className="preview-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 2px', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: '600', color: '#444' }}>{t('date')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: '600', color: '#444' }}>{t('shift')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: '600', color: '#444' }}>{t('supplier')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: '600', color: '#444' }}>{t('weightKg')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: '600', color: '#444' }}>Fat %</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: '600', color: '#444' }}>SNF %</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: '600', color: '#444' }}>CLR</th>
                      {/* <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: '600', color: '#444' }}>Fat KG</th> */}
                      {/* <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: '600', color: '#444' }}>SNF KG</th> */}
                      {/* <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: '600', color: '#444' }}>Fat Rate</th> */}
                      {/* <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: '600', color: '#444' }}>SNF Rate</th> */}
                      <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: '600', color: '#444' }}>{t('clrConversion')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: '600', color: '#444' }}>{t('milkRate')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: '600', color: '#444' }}>Base SNF %</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: '600', color: '#444' }}>{t('animalType')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: '600', color: '#444' }}>{t('amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{formatDate(previewCollection.collection_date, previewCollection.collection_time)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{previewCollection.collection_time === 'morning' ? 'Morning' : 'Evening'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{editingCollection.customer_name}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{formatNumber(previewCollection.kg)}</td>

                      <td style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{formatNumber(previewCollection.fat_percentage)}%</td>
                      <td style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e0e0e0',
                        whiteSpace: 'nowrap',
                        opacity: parseFloat(previewCollection.snf_percentage) > 0 ? '1' : '0.5',
                        backgroundColor: parseFloat(previewCollection.snf_percentage) > 0 ? '#e6f7ff' : 'inherit'
                      }}>{formatNumber(previewCollection.snf_percentage)}
                      </td>
                      <td style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e0e0e0',
                        whiteSpace: 'nowrap',
                        opacity: parseFloat(previewCollection.clr) > 0 ? '1' : '0.5',
                        backgroundColor: parseFloat(previewCollection.clr) > 0 ? '#e6f7ff' : 'inherit'
                      }}>{formatNumber(previewCollection.clr)}
                      </td>

                      {/* <td style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{formatNumber(previewCollection.fat_kg)}</td> */}
                      {/* <td style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{formatNumber(previewCollection.snf_kg)}</td> */}
                      {/* <td style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{formatNumber(previewCollection.fat_rate)}</td> */}
                      {/* <td style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{formatNumber(previewCollection.snf_rate)}</td> */}
                      <td style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                        {previewCollection.clr_conversion === '0.14' ? '0.14' : previewCollection.clr_conversion === '0.50' ? '0.50' : previewCollection.clr_conversion || '0.14'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{formatNumber(previewCollection.milk_rate)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{formatNumber(previewCollection.base_snf_percentage || previewCollection.base_snf || 9.0)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                        {previewCollection.animal_type === 'cow' ? 'Cow' : previewCollection.animal_type === 'buffalo' ? 'Buffalo' : previewCollection.animal_type === 'mix' ? 'Cow+Buffalo' : previewCollection.animal_type || 'Cow'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', fontWeight: '600' }}>
                        {formatCurrency(getRealTimeCalculations(previewCollection, true).amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer-preview">
              <button
                className="cancel-button-preview"
                onClick={() => setShowPreviewModal(false)}
              >
                {t('backToEdit')}
              </button>
              {/* <button
                className="rate-settings-btn-preview"
                onClick={() => setShowRateSettingsModal(true)}
                title="Open Rate Settings"
              >
                <FontAwesomeIcon icon={faCog} />
                {t('rateSettings')}
              </button> */}
              <button
                className="confirm-button-preview"
                type="button"
                onClick={(e) => handleSaveEdit(e)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>{t('saving')}</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} />
                    <span>{t('confirmSave')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Settings Modal */}
      {showRateSettingsModal && (
        <div className="modal-overlay">
          <div className="rate-settings-modal">
            <div className="modal-header">
              <h2>{t('rateSettings')}</h2>
              <button
                className="close-modal-button"
                onClick={() => setShowRateSettingsModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <div className="change-rates-section">
                <h4>{t('fatSnfRatio')}</h4>
                <p className="section-description">{t('selectTheFatToSnfRatioForRateCalculations')}</p>
                <div className="option-buttons">
                  <button
                    className={`option-btn ${fatSnfRatio === '60_40' ? 'active' : ''}`}
                    onClick={() => {
                      setFatSnfRatio('60_40');
                      localStorage.setItem('fatSnfRatio', '60_40');
                    }}
                  >
                    60/40
                  </button>
                  <button
                    className={`option-btn ${fatSnfRatio === '52_48' ? 'active' : ''}`}
                    onClick={() => {
                      setFatSnfRatio('52_48');
                      localStorage.setItem('fatSnfRatio', '52_48');
                    }}
                  >
                    52/48
                  </button>
                </div>
              </div>

              <div className="change-rates-section">
                <h4>{t('baseSNF')}</h4>
                <p className="section-description">{t('setTheBaseSnfPercentageForCalculations')}</p>
                <div style={{
                  background: '#e3f2fd',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  marginBottom: '12px',
                  fontSize: '14px',
                  color: '#1976d2',
                  fontWeight: '500'
                }}>
                  Current Selected: {currentBaseSnf.base_snf}%
                </div>
                <div className="option-buttons">
                  <button
                    className={`option-btn ${parseFloat(currentBaseSnf.base_snf) === 8.5 ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentBaseSnf({ base_snf: 8.5 });
                      localStorage.setItem('currentBaseSnf', '8.5');
                    }}
                  >
                    8.5%
                  </button>
                  <button
                    className={`option-btn ${parseFloat(currentBaseSnf.base_snf) === 9.0 ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentBaseSnf({ base_snf: 9.0 });
                      localStorage.setItem('currentBaseSnf', '9.0');
                    }}
                  >
                    9.0%
                  </button>
                  <button
                    className={`option-btn ${parseFloat(currentBaseSnf.base_snf) === 9.1 ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentBaseSnf({ base_snf: 9.1 });
                      localStorage.setItem('currentBaseSnf', '9.1');
                    }}
                  >
                    9.1%
                  </button>
                  <button
                    className={`option-btn ${parseFloat(currentBaseSnf.base_snf) === 9.2 ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentBaseSnf({ base_snf: 9.2 });
                      localStorage.setItem('currentBaseSnf', '9.2');
                    }}
                  >
                    9.2%
                  </button>
                  <button
                    className={`option-btn ${parseFloat(currentBaseSnf.base_snf) === 9.3 ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentBaseSnf({ base_snf: 9.3 });
                      localStorage.setItem('currentBaseSnf', '9.3');
                    }}
                  >
                    9.3%
                  </button>
                  <button
                    className={`option-btn ${parseFloat(currentBaseSnf.base_snf) === 9.4 ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentBaseSnf({ base_snf: 9.4 });
                      localStorage.setItem('currentBaseSnf', '9.4');
                    }}
                  >
                    9.4%
                  </button>
                  <button
                    className={`option-btn ${parseFloat(currentBaseSnf.base_snf) === 9.5 ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentBaseSnf({ base_snf: 9.5 });
                      localStorage.setItem('currentBaseSnf', '9.5');
                    }}
                  >
                    9.5%
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="save-button"
                onClick={() => {
                  // Save settings and close modal
                  setShowRateSettingsModal(false);
                }}
              >
                {t('save')}
              </button>
              <button
                className="cancel-button"
                onClick={() => setShowRateSettingsModal(false)}
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditCustomerModal && (
        <div className="modal-overlay">
          <div className="modal-content customer-modal">
            <div className="modal-header">
              <h2>{t('selectCustomer')}</h2>
              <button
                className="modal-close-button"
                onClick={() => setShowEditCustomerModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="customer-search-container">
              <div className="search-wrapper">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  className="search-input"
                  value={editCustomerSearchTerm}
                  onChange={handleEditCustomerSearchChange}
                  autoFocus
                />
              </div>
            </div>

            <div className="customers-list">
              {loadingCustomers ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>{t('loadingCustomers')}</p>
                </div>
              ) : filteredEditCustomers.length === 0 ? (
                <div className="no-customers">
                  <p>{t('noCustomersFound')}</p>
                </div>
              ) : (
                filteredEditCustomers.map(customer => (
                  <div
                    key={customer.id}
                    className="customer-item"
                    onClick={() => selectEditCustomer(customer)}
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

      {showAddMilkRateModal && (
        <div className="modal-overlay">
          <div className="modal-content date-filter-modal">
            <div className="modal-header">
              <h2>{t('filterCollectionsForMilkRateUpdate')}</h2>
              <button
                className="modal-close-button"
                onClick={() => setShowAddMilkRateModal(false)}
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
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      onClick={(e) => e.target.showPicker()}
                    />
                  </div>
                </>
              )}

              {ratePreviewError && (
                <div className="error-message" style={{ color: 'red', margin: '10px 0', position: 'relative', paddingRight: '30px' }}>
                  {ratePreviewError}
                  <button
                    onClick={() => setRatePreviewError(null)}
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      padding: '0',
                      lineHeight: '1'
                    }}
                    title="Close"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              )}

              <div className="date-filter-actions">
                <button
                  className="date-filter-button secondary"
                  onClick={() => setShowAddMilkRateModal(false)}
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
      )}

      {/* Milk Rate Preview Modal */}
      {
        showMilkRatePreviewModal && (
          <div className="modal-overlay" onClick={() => {
            setShowMilkRatePreviewModal(false);
            setModalAnimalFilter('all');
          }}>
            <div className="modal-content preview-modal" onClick={e => e.stopPropagation()} style={{ width: '96%', maxWidth: '1500px', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header" style={{ flexShrink: 0, padding: '6px 12px' }}>
                <h2 style={{ fontSize: '14px', margin: 0, fontWeight: '600' }}>{t('bulkEditCollections')}</h2>
                <button
                  className="close-modal-button close-btn-16px"
                  onClick={() => {
                    setShowMilkRatePreviewModal(false);
                    resetBulkEditState();
                    setModalSelectedCustomer(null);
                    setOriginalCollections([]);
                    setModalAnimalFilter('all');
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="modal-body-flex">
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

                {ratePreviewError && (
                  <div className="edit-form-error" style={{ position: 'relative', paddingRight: '30px' }}>
                    {ratePreviewError}
                    <button
                      onClick={() => setRatePreviewError(null)}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: 'none',
                        border: 'none',
                        color: '#c62828',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        padding: '0',
                        lineHeight: '1'
                      }}
                      title="Close"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
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

                    {/* Customer Filter Button */}
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
                    {modalSelectedCustomer && (
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
                        <span>{modalSelectedCustomer.name}</span>
                        <button
                          onClick={() => {
                            setModalSelectedCustomer(null);
                            // Restore the date-filtered collections (not all original collections)
                            // Pass null explicitly to skip customer filter since state hasn't updated yet
                            handlePreviewMilkRates(null);
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
                        // Re-fetch collections with new animal filter
                        handlePreviewMilkRates();
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
                            // Re-fetch collections without animal filter
                            setTimeout(() => handlePreviewMilkRates(), 0);
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'flex-start', flex: 1 }}>
                      {/* Milk Rate */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
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

                      {/* Rate Chart Checkbox */}
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
                            // Always use default rates in bulk edit modal
                            setCollectionFatStepUpRates([{ step: '6.50', rate: '0.80' }]);
                            setCollectionSnfStepDownRates([{ step: '9.00', rate: '0.27' }]);
                            setShowRateChartModal(true);
                          }}
                          disabled={!activeBulkFields.rate_chart}
                          title="View and manage rate chart"
                          style={{
                            opacity: activeBulkFields.rate_chart ? 1 : 0.5,
                            cursor: activeBulkFields.rate_chart ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <FontAwesomeIcon icon={faChartBar} />
                          <span>{t('rateChart')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Total & Final Amount Summary */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      {(() => {
                        const totalAmount = selectedCollections.filter(c => modalAnimalFilter === 'all' || c.milk_type === modalAnimalFilter).reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
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
                  <table className="preview-table" style={{ minWidth: '1300px', width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('dateTime')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('milkRate')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('customer')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('weightKg')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('fatPercent')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('snfPercent')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('clr')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>FAT Step Up</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>SNF Step Down</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('baseSnf')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>Animal</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('amount')}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedCollections
                        .filter(collection => {
                          if (modalAnimalFilter === 'all') return true;
                          return collection.milk_type === modalAnimalFilter;
                        })
                        .filter(collection => {
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
                            padding: '10px 12px',
                            textAlign: 'center',
                            borderBottom: '1px solid #e0e0e0',
                            whiteSpace: 'nowrap',
                            fontSize: '14.5px',
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
                                {formatNumber(collection.snf_percentage)}
                              </td>
                              <td style={cellStyle}>
                                {formatNumber(collection.clr)}
                              </td>
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
                              {/* <td style={cellStyle}>
                                {formatNumber(fatKg)}
                              </td>
                              <td style={cellStyle}>
                                {formatNumber(snfKg)}
                              </td>
                              <td style={cellStyle}>
                                {formatNumber(collection.fat_rate)}
                              </td>
                              <td style={cellStyle}>
                                {formatNumber(collection.snf_rate)}
                              </td> */}
                              <td style={cellStyle}>
                                {formatNumber(collection.base_snf_percentage)}
                              </td>
                              <td style={cellStyle}>
                                {activeBulkFields.milk_type && bulkEditFields.milk_type !== 'Select' ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                    <span style={{
                                      fontSize: '10px',
                                      color: '#999',
                                      textDecoration: 'line-through'
                                    }}>
                                      {getAnimalName(collection.milk_type, index)}
                                    </span>
                                    <span style={{
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      color: '#1976d2',
                                      backgroundColor: '#e3f2fd',
                                      padding: '1px 4px',
                                      borderRadius: '3px'
                                    }}>
                                      {getAnimalName(bulkEditFields.milk_type, index)}
                                    </span>
                                  </div>
                                ) : (
                                  getAnimalName(collection.milk_type, index)
                                )}
                              </td>
                              <td style={{ ...cellStyle, fontWeight: '600', color: '#2e7d32' }}>
                                {formatCurrency(getRealTimeCalculations(collection, true).amount)}
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

                  {/* Horizontal Summary Bar */}
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
                  onClick={() => {
                    setShowMilkRatePreviewModal(false);
                    resetBulkEditState();
                    // Clear modal customer filter when modal is closed
                    setModalSelectedCustomer(null);
                    setOriginalCollections([]);
                    // Reset animal filter
                    setModalAnimalFilter('all');
                  }}
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
                  {activeBulkFields.clr_conversion && bulkEditFields.clr_conversion !== 'Select' && (
                    <p style={{ margin: '4px 0' }}>• {t('clrConversion')}: <strong>{bulkEditFields.clr_conversion}</strong></p>
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
              // display: 'flex',
              // justifyContent: 'flex-end',
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

      {showDeleteConfirmation && collectionToDelete && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <div className="modal-header">
              <h3>{t('confirmDeletion')}</h3>
              <button
                className="modal-close-button"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setCollectionToDelete(null);
                  setDeleteError(null);
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <p>{t('areYouSureDeleteCollection')}</p>
              <div className="collection-delete-info">
                <p><strong>{t('supplier')}:</strong> {collectionToDelete.customer_name}</p>
                <p><strong>{t('date')}:</strong> {formatDateForDisplay(collectionToDelete.collection_date)}</p>
                <p><strong>{t('time')}:</strong> {collectionToDelete.collection_time === 'morning' ? t('morning') : t('evening')}</p>
                <p><strong>{t('weight')}:</strong> {parseFloat(collectionToDelete.kg).toFixed(2)} kg</p>
              </div>
              <p className="warning-text">{t('thisActionCannotBeUndone')}</p>
              {deleteError && (
                <div className="error-message" style={{ position: 'relative', paddingRight: '30px' }}>
                  {deleteError}
                  <button
                    onClick={() => setDeleteError(null)}
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      padding: '0',
                      lineHeight: '1'
                    }}
                    title="Close"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setCollectionToDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
              >
                {t('cancel')}
              </button>
              <button
                className="delete-button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="button-spinner"></div>
                    {t('deleting')}
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk edit modal */}
      {/* {showBulkUpdateModal && (
        <div className="modal-overlay">
          <div className="modal-content bulk-update-modal">
            <div className="modal-header-bulk">
              <h2 className='heading-bulk-update'>{t('bulkUpdateRateAndBaseSNF')}</h2>
              <button
                className="rate-type-selector-btn"
                onClick={() => setShowBulkUpdateRateTypeModal(true)}
              >
                <FontAwesomeIcon icon={faCog} />
                <span>{bulkUpdateRateType === '60_40' ? 'Fat + SNF' : 'Fat + CLR'}</span>
       
              </button>
              <button
                className="modal-close-button"
                onClick={() => {
                  setShowBulkUpdateModal(false);
                  setBulkUpdateMilkRate('');
                  setBulkUpdateSnfPercentage('');
                  setBulkUpdateClr('');
                  setBulkUpdateError(null);
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              {(() => {
                const summary = getBulkUpdateSummary();
                const methodSummary = getBulkUpdateMethodSummary();
                return (
                  <div className="bulk-update-summary">
                    <p><strong>{t('updatingCollections').replace('{count}', summary.collectionsCount)}</strong></p>
                    <p><b>{summary.customerInfo}</b></p>
                    {summary.dateRangeInfo && <p>{summary.dateRangeInfo}</p>}
                    <div className="method-summary">
                     
                    </div>
                  </div>
                );
              })()}

              <div>
                {bulkUpdateError && (
                  <div className="error-message" style={{ position: 'relative', paddingRight: '30px' }}>
                    {bulkUpdateError}
                    <button
                      onClick={() => setBulkUpdateError(null)}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        padding: '0',
                        lineHeight: '1'
                      }}
                      title="Close"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="bulk-milk-rate">{t('milkRate')}</label>
                  <input
                    id="bulk-milk-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input no-spinners"
                    placeholder="50.00"
                    value={bulkUpdateMilkRate}
                    onChange={(e) => setBulkUpdateMilkRate(e.target.value)}
                    onWheel={(e) => {
                      e.preventDefault();
                      e.target.blur();
                    }}
                    onFocus={(e) => e.target.addEventListener('wheel', function handler(e) {
                      e.preventDefault();
                      e.target.blur();
                    }, { passive: false })}
                  />
                </div>

                <div className="bulk-update-field">
                  <div className="form-group" >
                    <label htmlFor="bulk-snf-percentage">{t('snfPercentage')}</label>
                    <input
                      id="bulk-snf-percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="15"
                      className="form-input no-spinners"
                      placeholder="9.00"
                      value={bulkUpdateSnfPercentage}
                      onChange={(e) => setBulkUpdateSnfPercentage(e.target.value)}
                      onWheel={(e) => {
                        e.preventDefault();
                        e.target.blur();
                      }}
                      onFocus={(e) => e.target.addEventListener('wheel', function handler(e) {
                        e.preventDefault();
                        e.target.blur();
                      }, { passive: false })}
                      disabled={bulkUpdateRateType === '52_48'}
                      title={bulkUpdateRateType === '52_48' ?
                        "Rate type is Fat + CLR. SNF% cannot be edited." :
                        "Edit SNF% for SNF-based collections"}
                    />
                    {(() => {
                      const methodSummary = getBulkUpdateMethodSummary();
                      return methodSummary.clrCollections > 0 && methodSummary.snfCollections > 0 && (
                        <small className="field-hint">SNF-based: {methodSummary.snfCollections} collections</small>
                      );
                    })()}
                  </div>

                  <div className="form-group">
                    <label htmlFor="bulk-clr">CLR:</label>
                    <input
                      id="bulk-clr"
                      type="number"
                      step="0.01"
                      min="0"
                      max="50"
                      className="form-input no-spinners"
                      placeholder="15.00-35.00"
                      value={bulkUpdateClr}
                      onChange={(e) => setBulkUpdateClr(e.target.value)}
                      onWheel={(e) => {
                        e.preventDefault();
                        e.target.blur();
                      }}
                      onFocus={(e) => e.target.addEventListener('wheel', function handler(e) {
                        e.preventDefault();
                        e.target.blur();
                      }, { passive: false })}
                      disabled={bulkUpdateRateType === '60_40'}
                      title={bulkUpdateRateType === '60_40' ?
                        "Rate type is Fat + SNF. CLR cannot be edited." :
                        "Edit CLR for CLR-based collections"}
                    />
                    {(() => {
                      const methodSummary = getBulkUpdateMethodSummary();
                      return methodSummary.snfCollections > 0 && methodSummary.clrCollections > 0 && (
                        <small className="field-hint">CLR-based: {methodSummary.clrCollections} collections</small>
                      );
                    })()}
                  </div>
                </div>
              </div>


            </div>

            <div className="modal-footer-bulk-update">
              <button
                className="cancel-button"
                onClick={() => {
                  setShowBulkUpdateModal(false);
                  setBulkUpdateMilkRate('');
                  setBulkUpdateSnfPercentage('');
                  setBulkUpdateClr('');
                  setBulkUpdateError(null);
                }}
                disabled={isSubmittingBulkUpdate}
              >
                {t('cancel')}
              </button>
              <button
                className="update-button"
                onClick={handleBulkUpdate}
                disabled={isSubmittingBulkUpdate}
              >
                {isSubmittingBulkUpdate ? (
                  <>
                    <div className="button-spinner"></div>
                    {t('updating')}
                  </>
                ) : (
                  t('updateCollections')
                )}
              </button>
            </div>
          </div>
        </div>
      )} */}

      {/* Bulk Update Confirmation Modal */}
      {/* {showBulkUpdateConfirmation && (
        <div className="modal-overlay-prorata">
          <div className="modal-content-new prorata-confirmation-modal">
            <div className="modal-header-bulk">
              <h2>{t('confirmBulkUpdate')}</h2>
              <button
                className="modal-close-button"
                onClick={handleCancelBulkUpdate}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="confirmation-summary">
                <p>
                  <strong>{t('updatingCollectionsCount', { count: bulkUpdatePreviewData.length })}</strong>
                </p>
                {bulkUpdateMilkRate && (
                  <p>{t('newMilkRate')}: ₹{bulkUpdateMilkRate}/kg</p>
                )}
                {bulkUpdateSnfPercentage && (
                  <p>{t('newSnfPercentage')}: {bulkUpdateSnfPercentage}%</p>
                )}
                {bulkUpdateClr && (
                  <p>{t('newClr')}: {bulkUpdateClr}</p>
                )}
              </div>

              {bulkUpdateConfirmationError && (
                <div className="error-message" style={{ position: 'relative', paddingRight: '30px' }}>
                  {bulkUpdateConfirmationError}
                  <button
                    onClick={() => setBulkUpdateConfirmationError(null)}
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      padding: '0',
                      lineHeight: '1'
                    }}
                    title="Close"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              )}

              <div className="confirmation-table-wrapper">
                <table className="confirmation-table">
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Date</th>
                      <th>Weight (kg)</th>
                      <th>Fat %</th>
                      <th>CLR</th>
                      <th>SNF %</th>
                      <th>Fat Kg</th>
                      <th>SNF Kg</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkUpdatePreviewData.map((item) => {
                    
                      const collectionMethod = getCollectionMethod(item);

                    
                      let displaySnf = parseFloat(item.new_snf_percentage) || 0;
                      if (bulkUpdateClr && collectionMethod === 'clr') {
                        const clrConversionFactor = item.clr_conversion || '0.14';
                        const calculatedSnf = calculateSnfFromClr(bulkUpdateClr, parseFloat(item.fat_percentage), clrConversionFactor);
                        displaySnf = calculatedSnf || 0;
                      }

                      return (
                        <tr key={item.id}>
                          <td>{item.customer_name}</td>
                          <td>{item.collection_date} ({item.collection_time})</td>
                          <td>{item.kg}</td>
                          <td>{item.fat_percentage.toFixed(2)}%</td>
                          <td className={bulkUpdateClr && collectionMethod === 'clr' ? "highlight-new" : ""}>
                            {bulkUpdateClr && collectionMethod === 'clr' ? bulkUpdateClr : (item.clr || '0.00')}
                          </td>
                          <td className={bulkUpdateSnfPercentage && collectionMethod === 'snf' ? "highlight-new" : ""}>
                            {(bulkUpdateSnfPercentage && collectionMethod === 'snf' ? item.new_snf_percentage :
                              (bulkUpdateClr && collectionMethod === 'clr' ? displaySnf : item.snf_percentage)).toFixed(2)}%
                          </td>
                          <td>{(parseFloat(item.kg) * (parseFloat(item.fat_percentage) / 100)).toFixed(2)}</td>
                          <td>{(parseFloat(item.kg) * (displaySnf / 100)).toFixed(2)}</td>
                          <td className={bulkUpdateMilkRate ? "highlight-new" : ""}>₹{(bulkUpdateMilkRate ? item.new_milk_rate : item.current_milk_rate).toFixed(2)}</td>
                          <td className="highlight-new">₹{item.new_amount.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer-bulk-update">
              <button
                className="cancel-button-bulk-update"
                onClick={handleCancelBulkUpdate}
                disabled={isSubmittingBulkUpdate}
              >
                {t('cancel')}
              </button>
              <button
                className="confirm-button-bulk-update"
                onClick={() => setShowFinalSubmitConfirmation(true)}
                disabled={isSubmittingBulkUpdate}
              >
                {isSubmittingBulkUpdate ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>{t('updating')}</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} />
                    <span>{t('confirmAndUpdate')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )} */}

      {/* Final Submit Confirmation Modal */}
      {/* {showFinalSubmitConfirmation && (
        <div className="modal-overlay">
          <div className="bulk-final-confirmation-modal">
            <div className="modal-header-confirmation">
              <h2>⚠️ {t('importantConfirmation')}</h2>
            </div>

            <div className="modal-body-confirmation-card">
              <div className="bulk-final-confirmation-content">
                <div className="bulk-final-confirmation-icon">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                </div>

                <h3 className="bulk-final-confirmation-title">
                  {t('irreversibleChangesWarning')}
                </h3>

                <ul className="bulk-final-confirmation-changes">
                  {bulkUpdateMilkRate && (
                    <li>
                      ✓ {t('milkRate')}: <strong>₹{bulkUpdateMilkRate}/kg</strong>
                    </li>
                  )}
                  {bulkUpdateSnfPercentage && (
                    <li>
                      ✓ {t('snfPercent')}: <strong>{bulkUpdateSnfPercentage}%</strong>
                    </li>
                  )}
                  {bulkUpdateClr && (
                    <li>
                      ✓ {t('clr')}: <strong>{bulkUpdateClr}</strong>
                    </li>
                  )}
                </ul>

                <div className="bulk-final-confirmation-warning">
                  <strong>⚠️ {t('pleaseBeAware')}</strong>
                  <p>
                    {t('irreversibleChangesWarningText')}
                  </p>
                </div>

                <p className="bulk-final-confirmation-question">
                  {t('areYouAbsolutelySureYouWantToProceed')}
                </p>
              </div>
            </div>

            <div className="bulk-final-confirmation-footer">
              <button
                className="bulk-cancel-button-confirmation"
                onClick={() => setShowFinalSubmitConfirmation(false)}
                disabled={isSubmittingBulkUpdate}
              >
                {t('cancel')}
              </button>
              <button
                className="bulk-submit-button-confirmation"
                onClick={handleConfirmBulkUpdate}
                disabled={isSubmittingBulkUpdate}
              >
                {isSubmittingBulkUpdate ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>{t('updating')}</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} />
                    <span>{t('submitChanges')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )} */}

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
                  {collectionFatStepUpRates.map((item, index) => (
                    <div key={index} className="rate-row">
                      <div className="rate-input-group">
                        <label>Step (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.step}
                          onChange={(e) => {
                            const newRates = [...collectionFatStepUpRates];
                            newRates[index].step = e.target.value;
                            setCollectionFatStepUpRates(newRates);
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
                              const newRates = [...collectionFatStepUpRates];
                              newRates[index].rate = e.target.value;
                              setCollectionFatStepUpRates(newRates);
                            }}
                            className="rate-input"
                          />
                        </div>
                      </div>
                      {collectionFatStepUpRates.length > 1 && (
                        <button
                          type="button"
                          className="delete-rate-btn"
                          onClick={() => {
                            const newRates = collectionFatStepUpRates.filter((_, i) => i !== index);
                            setCollectionFatStepUpRates(newRates);
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
                      setCollectionFatStepUpRates([...collectionFatStepUpRates, { step: '', rate: '' }]);
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
                  {collectionSnfStepDownRates.map((item, index) => (
                    <div key={index} className="rate-row">
                      <div className="rate-input-group">
                        <label>Step (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.step}
                          onChange={(e) => {
                            const newRates = [...collectionSnfStepDownRates];
                            newRates[index].step = e.target.value;
                            setCollectionSnfStepDownRates(newRates);
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
                              const newRates = [...collectionSnfStepDownRates];
                              newRates[index].rate = e.target.value;
                              setCollectionSnfStepDownRates(newRates);
                            }}
                            className="rate-input"
                          />
                        </div>
                      </div>
                      {collectionSnfStepDownRates.length > 1 && (
                        <button
                          type="button"
                          className="delete-rate-btn"
                          onClick={() => {
                            const newRates = collectionSnfStepDownRates.filter((_, i) => i !== index);
                            setCollectionSnfStepDownRates(newRates);
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
                      setCollectionSnfStepDownRates([...collectionSnfStepDownRates, { step: '', rate: '' }]);
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

                      // Validate and prepare the rate chart data from collection-specific states
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
                        fat_step_up_rates: validateRateData(collectionFatStepUpRates, "Fat Step-up Rates", false),
                        snf_step_down_rates: validateRateData(collectionSnfStepDownRates, "SNF Step-down Rates", true)
                      };

                      // Debug: Log what data is being prepared
                      console.log('DEBUG: Collection-specific rate chart data:', rateChartData);
                      console.log('DEBUG: Original collectionFatStepUpRates:', collectionFatStepUpRates);
                      console.log('DEBUG: Original collectionSnfStepDownRates:', collectionSnfStepDownRates);

                      // Check if at least one section has valid data
                      if (rateChartData.fat_step_up_rates.length === 0 && rateChartData.snf_step_down_rates.length === 0) {
                        throw new Error(t('pleaseEnterAtLeastOneValidStep'));
                      }

                      // Update editingCollection with new rate chart for this specific entry only
                      if (editingCollection) {
                        const updatedEditingCollection = {
                          ...editingCollection,
                          pro_rata_collection_rate_chart: rateChartData
                        };

                        // Recalculate derived values with new rate chart
                        const recalculatedValues = getRealTimeCalculations(updatedEditingCollection);

                        setEditingCollection({
                          ...updatedEditingCollection,
                          fat_kg: recalculatedValues.fat_kg,
                          snf_kg: recalculatedValues.snf_kg,
                          amount: recalculatedValues.amount,
                          is_pro_rata: recalculatedValues.is_pro_rata
                        });

                        // Mark as having unsaved changes so preview shows updated values
                        setHasUnsavedChanges(true);

                        console.log('DEBUG: Updated editingCollection with collection-specific rate chart:', rateChartData);
                        console.log('DEBUG: Recalculated values:', recalculatedValues);
                      }

                      // Also update selectedCollections in bulk edit modal with new rate chart
                      if (selectedCollections && selectedCollections.length > 0) {
                        const updatedSelectedCollections = selectedCollections.map(collection => {
                          // Create updated collection with new rate chart
                          const updatedCollection = {
                            ...collection,
                            pro_rata_collection_rate_chart: rateChartData,
                            is_pro_rata: true
                          };

                          // Recalculate derived values with new rate chart
                          const derived = getRealTimeCalculations(updatedCollection);

                          return {
                            ...updatedCollection,
                            fat_kg: derived.fat_kg,
                            snf_kg: derived.snf_kg,
                            amount: derived.amount
                          };
                        });

                        setSelectedCollections(updatedSelectedCollections);
                        console.log('DEBUG: Updated selectedCollections with new rate chart and recalculated values');
                      }

                      // Show success message
                      setSuccessMessage(t('rateChartSavedSuccessfully'));
                      setShowSuccessMessage(true);
                      setTimeout(() => setShowSuccessMessage(false), 5000);

                      setShowRateChartModal(false);
                    } catch (error) {
                      console.error('Error saving rate chart:', error);
                      setSuccessMessage(t('errorSavingRateChart', { message: error.message }));
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

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="success-message" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: successMessage.includes('Error') ? '#ef4444' : '#10b981',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <FontAwesomeIcon icon={successMessage.includes('Error') ? faExclamationTriangle : faCheckCircle} />
          <span>{successMessage}</span>
          <button
            onClick={() => setShowSuccessMessage(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              padding: '0',
              lineHeight: '1',
              display: 'flex',
              alignItems: 'center'
            }}
            title={t('close')}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
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
                    onClick={() => handleCustomerSelection(customer)}
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

      <footer className="collections-footer">
        <p>&copy; 2025 Dudhiya. All rights reserved.</p>
        <img src="/Powered-By-Netpy-Technologies.png" style={{ width: '170px' }} alt="Powered by Netpy Technologies" />
      </footer>

      {/* Bulk Update Rate Type Selection Modal */}
      {showBulkUpdateRateTypeModal && (
        <div className="modal-overlay">
          <div className="modal-content rate-type-selection-modal">
            <div className="modal-header">
              <h3>{t('selectRateType')}</h3>
              <button
                className="modal-close-button"
                onClick={() => setShowBulkUpdateRateTypeModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body-rate-type">
              <div className="rate-type-options">
                <button
                  className={`rate-type-option ${bulkUpdateRateType === '60_40' ? 'active' : ''}`}
                  onClick={() => {
                    setBulkUpdateRateType('60_40');
                    setShowBulkUpdateRateTypeModal(false);
                  }}
                >
                  <FontAwesomeIcon icon={faChartBar} />
                  <span>Fat + SNF</span>
                </button>

                <button
                  className={`rate-type-option ${bulkUpdateRateType === '52_48' ? 'active' : ''}`}
                  onClick={() => {
                    setBulkUpdateRateType('52_48');
                    setShowBulkUpdateRateTypeModal(false);
                  }}
                >
                  <FontAwesomeIcon icon={faChartLine} />
                  <span>Fat + CLR</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default PreviewProRataCollections;
