import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCollections, getCustomerCollections, getCustomers, getCollectionsByDateRange, getFilteredCollections, updateCollection, updateAddedMilkRateCollection, deleteCollection, getUserInfo, getDairyInfo } from '../services/api';
import { removeToken } from '../services/tokenStorage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faArrowLeft, faSearch, faTimes, faUserAlt, faFilter, faCalendarAlt, faEdit, faEye, faCheck, faSpinner, faSortAmountDown, faSortAmountUp, faTrash, faDollarSign, faClock, faChartLine, faCog, faExclamationTriangle, faChartBar, faHeadphones, faPhone, faAngleDown, faTag } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import Navbar from './Navbar';
import './PreviewCollections.css';
import { toast } from 'react-toastify';
import StandardReportGenerator from './StandardReportGenerator';

// Simple toast helper with autoClose
const showToast = (message, type = 'info') => toast[type](message, { position: 'top-center', autoClose: 8000, closeOnClick: false, pauseOnHover: true, draggable: false });

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

const PreviewCollections = () => {
  const { t } = useLanguage();
  const [collections, setCollections] = useState([]);
  const [filteredCollections, setFilteredCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // Changed from 10 to 50
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [modalSelectedCustomer, setModalSelectedCustomer] = useState(null);

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

  // Animal filter state for modal
  const [modalAnimalFilter, setModalAnimalFilter] = useState('all'); // 'all', 'cow', 'buffalo', 'cow_buffalo'

  // Add sort order state - default to descending (newest first)
  const [sortOrder, setSortOrder] = useState('desc');

  // Edit collection state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [originalCollection, setOriginalCollection] = useState(null);
  const [editFormErrors, setEditFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewCollection, setPreviewCollection] = useState(null);

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
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [isLoadingRatePreview, setIsLoadingRatePreview] = useState(false);
  const [isSubmittingRates, setIsSubmittingRates] = useState(false);
  const [ratePreviewError, setRatePreviewError] = useState(null);

  // Add state for rate settings
  const [fatSnfRatio, setFatSnfRatio] = useState('60_40');

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
    milk_type: false
  });

  // Add state for bulk apply confirmation
  const [showBulkApplyConfirmation, setShowBulkApplyConfirmation] = useState(false);

  // Add state for rate chart step rates
  const [collectionFatStepUpRates, setCollectionFatStepUpRates] = useState([{ step: '', rate: '' }]);
  const [collectionSnfStepDownRates, setCollectionSnfStepDownRates] = useState([{ step: '', rate: '' }]);

  // Add new state variables for milk rate single date filtering
  const [milkRateSingleDateFilterMode, setMilkRateSingleDateFilterMode] = useState(false);
  const [milkRateSingleDate, setMilkRateSingleDate] = useState('');

  // Add state for collection type (for rate chart functionality)
  const [selectedCollectionType, setSelectedCollectionType] = useState('standard');

  // Add state variables for delete functionality
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Bulk update state variables
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [bulkMilkRate, setBulkMilkRate] = useState('');
  const [bulkBaseSnf, setBulkBaseSnf] = useState('');
  const [isSubmittingBulkUpdate, setIsSubmittingBulkUpdate] = useState(false);
  const [bulkUpdateError, setBulkUpdateError] = useState(null);
  const [showBulkUpdateConfirmation, setShowBulkUpdateConfirmation] = useState(false);
  const [bulkUpdatePreview, setBulkUpdatePreview] = useState([]);
  const [showBulkUpdateRateTypeModal, setShowBulkUpdateRateTypeModal] = useState(false);
  const [bulkUpdateRateType, setBulkUpdateRateType] = useState('60_40');
  const [bulkUpdateMilkRate, setBulkUpdateMilkRate] = useState('');
  const [bulkUpdateSnfPercentage, setBulkUpdateSnfPercentage] = useState('');
  const [bulkUpdateClr, setBulkUpdateClr] = useState('');
  const [showFinalSubmitConfirmation, setShowFinalSubmitConfirmation] = useState(false);
  const [bulkUpdateConfirmationError, setBulkUpdateConfirmationError] = useState(null);

  // State for navbar user info
  const [userInfo, setUserInfo] = useState(null);
  const [dairyInfo, setDairyInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Success message state for updates
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentSubmitMessage, setCurrentSubmitMessage] = useState('');

  // Handle close message function
  const handleCloseMessage = () => {
    setSubmitSuccess(false);
    setCurrentSubmitMessage('');
  };

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
          isProRata: false // Filter for standard collections only (exclude pro-rata)
        };

        if (singleDateFilterMode) {
          options.dateFrom = singleDate;
          options.dateTo = singleDate;
          console.log(`Fetching standard collections for customer ${selectedCustomer.name} on ${singleDate}`);
        } else {
          options.dateFrom = fromDate;
          options.dateTo = toDate;
          console.log(`Fetching standard collections for customer ${selectedCustomer.name} from ${fromDate} to ${toDate}`);
        }

        response = await getFilteredCollections(options);
        console.log('Fetched filtered collections:', response);

        let collectionsData = [];
        if (Array.isArray(response)) {
          collectionsData = response;
        } else if (response && response.results) {
          collectionsData = response.results;
        }

        // Client-side filter to ensure only standard collections (is_pro_rata: false)
        collectionsData = collectionsData.filter(collection => collection.is_pro_rata === false);
        console.log(`After filtering: ${collectionsData.length} standard collections`);

        const processedCollections = processCollectionsWithDerivedValues(collectionsData);
        setCollections(processedCollections);
        setFilteredCollections(processedCollections); // No need to sort again as API handles ordering
        setHasMore(false);
      } else if (dateFilterActive) {
        // Only date filter active
        let ordering = sortOrder === 'asc' ? 'created_at' : '-created_at';

        if (singleDateFilterMode) {
          console.log(`DIRECT API CALL: Fetching ALL standard collections on ${singleDate} ordered by ${ordering}`);
          // Using only date parameters with extremely large limit to get ALL records
          response = await getCollectionsByDateRange(singleDate, singleDate, ordering, { is_pro_rata: false });
        } else {
          console.log(`DIRECT API CALL: Fetching ALL standard collections from ${fromDate} to ${toDate} ordered by ${ordering}`);
          // Using only date parameters with extremely large limit to get ALL records
          response = await getCollectionsByDateRange(fromDate, toDate, ordering, { is_pro_rata: false });
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

        // Client-side filter to ensure only standard collections (is_pro_rata: false)
        collectionsData = collectionsData.filter(collection => collection.is_pro_rata === false);
        console.log(`After filtering: ${collectionsData.length} standard collections`);

        // Set the data
        const processedCollections = processCollectionsWithDerivedValues(collectionsData);
        setCollections(processedCollections);
        setFilteredCollections(processedCollections); // No need to sort again as API handles ordering
        setHasMore(false);
      } else if (selectedCustomer) {
        // Only customer filter active
        console.log(`Fetching all standard collections for customer ID ${selectedCustomer.id} ordered by ${sortOrder === 'asc' ? 'created_at' : '-created_at'}`);
        response = await getCustomerCollections(selectedCustomer.id, {
          ordering: sortOrder === 'asc' ? 'created_at' : '-created_at',
          is_pro_rata: false
        });
        console.log('Fetched standard collections for customer:', selectedCustomer.name);

        // Similarly process the customer filter response
        let collectionsData = [];
        if (Array.isArray(response)) {
          collectionsData = response;
        } else if (response && response.results) {
          collectionsData = response.results;
        }

        // Client-side filter to ensure only standard collections (is_pro_rata: false)
        collectionsData = collectionsData.filter(collection => collection.is_pro_rata === false);
        console.log(`After filtering: ${collectionsData.length} standard collections`);

        const processedCollections = processCollectionsWithDerivedValues(collectionsData);
        setCollections(processedCollections);
        setFilteredCollections(processedCollections); // No need to sort again as API handles ordering
        setHasMore(false);
      } else {
        // No filters active - use normal pagination
        console.log('🔍 PreviewCollections: Fetching STANDARD collections only (is_pro_rata: false)');
        const params = {
          page: page,
          limit: pageSize,
          ordering: sortOrder === 'asc' ? 'created_at' : '-created_at', // Add ordering parameter
          is_pro_rata: false // Filter for standard collections only (exclude pro-rata)
        };
        console.log('📋 API params for standard collections:', params);

        response = await getCollections(params);
        console.log('📊 API response for standard collections:', response);

        let newCollections = response.results || [];

        // Client-side filter to ensure only standard collections (is_pro_rata: false)
        newCollections = newCollections.filter(collection => collection.is_pro_rata === false);
        console.log(`After filtering: ${newCollections.length} standard collections`);

        // Process collections with derived values
        const processedNewCollections = processCollectionsWithDerivedValues(newCollections);

        // If first page or initialLoad, replace the collections
        // Otherwise append the new collections
        setCollections((prevCollections) => {
          if (page === 1 || initialLoad) {
            return processedNewCollections;
          }
          return [...prevCollections, ...processedNewCollections];
        });

        // Apply the filtered collections
        if (page === 1 || initialLoad) {
          setFilteredCollections(processedNewCollections);
        } else {
          setFilteredCollections(prev => [...prev, ...processedNewCollections]);
        }

        // Check if there's more data to load
        const hasMorePages = response.next !== null;
        setHasMore(hasMorePages);

        // Auto-fetch next page if current page is empty after filtering but more pages exist
        if (processedNewCollections.length === 0 && hasMorePages) {
          console.log(`Page ${page} returned empty after filtering, auto-fetching page ${page + 1}`);
          setPage(prevPage => prevPage + 1);
        }
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
      let errorMessage = t('failedToLoadCollections');

      if (selectedCustomer && dateFilterActive) {
        if (singleDateFilterMode) {
          errorMessage = t('failedToLoadCollectionsForCustomerOnDate', { customerName: selectedCustomer.name, date: formatDateForDisplay(singleDate) });
        } else {
          errorMessage = t('failedToLoadCollectionsForCustomerBetweenDates', { customerName: selectedCustomer.name, fromDate: formatDateForDisplay(fromDate), toDate: formatDateForDisplay(toDate) });
        }
      } else if (selectedCustomer) {
        errorMessage = t('failedToLoadCollectionsForCustomer', { customerName: selectedCustomer.name });
      } else if (dateFilterActive) {
        if (singleDateFilterMode) {
          errorMessage = t('failedToLoadCollectionsOnDate', { date: formatDateForDisplay(singleDate) });
        } else {
          errorMessage = t('failedToLoadCollectionsBetweenDates', { fromDate: formatDateForDisplay(fromDate), toDate: formatDateForDisplay(toDate) });
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer, dateFilterActive, fromDate, toDate, singleDate, singleDateFilterMode, page, pageSize, sortOrder]);

  // Effect to fetch collections when filters change (resets collections)
  useEffect(() => {
    fetchCollectionsBasedOnFilters(true);
  }, [selectedCustomer, dateFilterActive, fromDate, toDate, singleDate, singleDateFilterMode, sortOrder]);

  // Effect to fetch collections when page changes (appends to collections)
  useEffect(() => {
    // Only fetch if we have no active filters and page > 1 (pagination mode)
    if (!dateFilterActive && !selectedCustomer && page > 1) {
      fetchCollectionsBasedOnFilters(false);
    }
  }, [page]);

  // Watch for modal filter changes and refetch data when modal is open
  useEffect(() => {
    if (showMilkRatePreviewModal && !isLoadingRatePreview) {
      // Debounce the refetch to avoid rapid successive calls
      const timer = setTimeout(() => {
        handlePreviewMilkRates({
          customer: modalSelectedCustomer,
          animalFilter: modalAnimalFilter
        });
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalAnimalFilter, modalSelectedCustomer, showMilkRatePreviewModal]);

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
        const milkType = collection.milk_type || 'cow'; // Default to cow if not set
        if (animalFilter === 'cow_buffalo') {
          return milkType === 'cow_buffalo' || milkType === 'mix' || milkType === 'cow+buffalo';
        }
        return milkType === animalFilter;
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
    const d = new Date(dateString);
    const day = `${d.getDate()}`.padStart(2, '0');
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateForDisplayWithSlash = (dateString) => {
    const d = new Date(dateString);
    const day = `${d.getDate()}`.padStart(2, '0');
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Apply date filter directly without any pagination
  const applyDateFilter = () => {
    if (singleDateFilterMode) {
      if (!singleDate) {
        alert(t('pleaseSelectADateForFilter'));
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
        alert(t('pleaseSelectBothFromAndToDatesForFilter'));
        return;
      }

      // Validate date range
      if (new Date(toDate) < new Date(fromDate)) {
        alert(t('toDateCannotBeEarlierThanFromDateForFilter'));
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

  const clearCustomerFilter = () => {
    setSelectedCustomer(null);
    setPage(1); // Explicitly reset to page 1
  };

  // Separate customer selection function for the modal
  const selectModalCustomer = (customer) => {
    console.log('Selected modal customer:', customer);

    setModalSelectedCustomer(customer);
    setShowCustomerModal(false);
    setCustomerSearchTerm('');
    // useEffect will handle the refetch with new customer filter
  };

  // Wrapper function to handle customer selection based on context
  const handleCustomerSelection = (customer) => {
    if (showMilkRatePreviewModal) {
      selectModalCustomer(customer);
    } else {
      selectCustomer(customer);
    }
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

  // Function to fix report amounts by updating collections with accurate calculations
  const fixReportAmounts = async () => {
    if (!window.confirm(t('confirmUpdateAllCollectionsWithAccurateAmounts'))) {
      return;
    }

    setLoading(true);
    let updatedCount = 0;
    let errorCount = 0;

    try {
      // Get all collections (bypass pagination)
      const allCollections = await getCollections({ limit: 10000 });

      console.log(`Processing ${allCollections.results?.length || 0} collections for amount correction...`);

      for (const collection of allCollections.results || []) {
        try {
          // Calculate accurate amount
          const accurateValues = calculateDerivedValues(collection);

          // Prepare update data with accurate amount
          const updateData = {
            amount: accurateValues.amount,
            fat_kg: accurateValues.fat_kg,
            snf_kg: accurateValues.snf_kg,
            fat_rate: accurateValues.fat_rate,
            snf_rate: accurateValues.snf_rate,
            solid_weight: accurateValues.solid_weight
          };

          // Update the collection
          await updateCollection(collection.id, updateData);
          updatedCount++;

          // Log progress every 10 collections
          if (updatedCount % 10 === 0) {
            console.log(`Updated ${updatedCount} collections...`);
          }
        } catch (error) {
          console.error(`Error updating collection ${collection.id}:`, error);
          errorCount++;
        }
      }

      alert(t('successfullyUpdatedCollectionsWithAccurateAmounts', { updatedCount, errorCount }));

      // Refresh collections data
      fetchCollectionsBasedOnFilters();

    } catch (error) {
      console.error('Error fixing report amounts:', error);
      alert(t('errorFixingReportAmounts'));
    } finally {
      setLoading(false);
    }
  };

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

  // Format number to specified decimal places
  const formatNumber = (number, decimalPlaces = 2) => {
    if (number === undefined || number === null) return 'N/A';
    return Number(number).toFixed(decimalPlaces);
  };

  // Format currency - show accurate value without rounding
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'N/A';
    // Show accurate value with more decimal places if needed
    const numAmount = Number(amount);
    // Check if amount has decimal places beyond 2
    if (numAmount % 1 !== 0) {
      // Show actual decimal places up to 4, then trim trailing zeros
      return `₹${numAmount.toFixed(4).replace(/\.?0+$/, '')}`;
    }
    return `₹${numAmount}`;
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

    return description;
  };

  // Calculate SNF from CLR - same as in BulkCollectionV1
  const calculateSnfFromClr = (clrValue, fatValue, conversionFactor = 0.14) => {
    // Ensure we have valid inputs
    if (!clrValue || !fatValue) {
      return null; // Return null instead of 0
    }

    // Convert strings to numbers to ensure proper calculation
    const clr = parseFloat(clrValue);
    const fat = parseFloat(fatValue);

    // Additional validation for reasonable values
    if (isNaN(clr) || isNaN(fat) || clr <= 0 || fat <= 0) {
      return null; // Return null instead of 0
    }

    // SNF calculation formula: SNF = (CLR / 4) + (0.20 * FAT) + conversionFactor
    const factor = parseFloat(conversionFactor) || 0.14;
    const calculatedSnf = Math.floor(((clr / 4) + (fat * 0.20) + factor) * 100) / 100;

    return calculatedSnf;
  };

  // Helper function to process collections with derived values
  const processCollectionsWithDerivedValues = (collectionsData) => {
    return collectionsData.map(collection => {
      // Check if backend already provided calculated values
      const hasBackendCalculations = collection.amount !== undefined &&
        collection.fat_kg !== undefined &&
        collection.snf_kg !== undefined &&
        collection.snf_rate !== undefined;

      if (hasBackendCalculations) {
        // Use ALL backend-calculated values exactly as stored
        console.log(`Using ALL backend values for collection ${collection.id}`);
        return {
          ...collection,
          fat_kg: collection.fat_kg,
          snf_kg: collection.snf_kg,
          fat_rate: collection.fat_rate,
          snf_rate: collection.snf_rate,
          solid_weight: collection.solid_weight,
          amount: collection.amount // Use backend amount directly
        };
      } else {
        // Calculate locally only if backend didn't provide values
        console.log(`Calculating amount locally for collection ${collection.id}`);
        const derived = calculateDerivedValues(collection);
        return {
          ...collection,
          fat_kg: derived.fat_kg,
          snf_kg: derived.snf_kg,
          fat_rate: derived.fat_rate,
          snf_rate: derived.snf_rate,
          solid_weight: derived.solid_weight,
          amount: derived.amount
        };
      }
    });
  };

  // Mobile APK amount calculation logic - matches exactly how mobile calculates amounts
  const calculateAmountMobileAPKStyle = (fatKg, snfKg, fatRate, snfRate) => {
    // Match mobile APK logic: calculate each component separately with floor
    const fatAmount = Math.floor(parseFloat(fatKg) * parseFloat(fatRate) * 100) / 100;
    const snfAmount = Math.floor(parseFloat(snfKg) * parseFloat(snfRate) * 100) / 100;
    return parseFloat((fatAmount + snfAmount).toFixed(2)); // Mobile APK logic: sum of floored components
  };

  // Calculate derived values - Updated to match APK formulas
  const calculateDerivedValues = (collection, fatSnfRatio = '60/40', baseSnfPercentage = 9.0) => {
    const fat = parseFloat(collection.fat_percent || collection.fat_percentage || 0);
    const snf = parseFloat(collection.snf_percent || collection.snf_percentage || 0);
    const weight = parseFloat(collection.weight || collection.kg || 0);
    const rate = parseFloat(collection.milk_rate || 0);

    // Get base SNF from collection or use default
    const collectionBaseSnf = parseFloat(collection.base_snf || collection.base_snf_percentage || baseSnfPercentage);

    // Use stored values from collection object instead of making separate API calls
    const collectionFatSnfRatio = collection.fat_snf_ratio?.replace('_', '/') || fatSnfRatio;
    const collectionClrConversionFactor = collection.clr_conversion || collection.clr_conversion_factor || 0.14;

    const fatKg = Math.floor((weight * (fat / 100)) * 100) / 100;
    const snfKg = Math.floor((weight * (snf / 100)) * 100) / 100;

    // Get fat/SNF ratio percentages - APK formula
    const fatRatioPercent = collectionFatSnfRatio === '60/40' ? 60 : 52;
    const snfRatioPercent = collectionFatSnfRatio === '60/40' ? 40 : 48;

    // Calculate rates based on fat and SNF components - APK formula
    const fatRate = Math.floor((rate * fatRatioPercent / 6.5) * 100) / 100;
    const snfRate = Math.floor((rate * snfRatioPercent / collectionBaseSnf) * 100) / 100;

    // Always use standard calculation for consistency with preview modal
    // Use mobile APK logic: calculate each component separately with floor
    const amount = calculateAmountMobileAPKStyle(fatKg, snfKg, fatRate, snfRate);

    // Calculate solid weight
    const solidWeight = (amount / rate).toFixed(3);

    return {
      fat_kg: fatKg,
      snf_kg: snfKg,
      fat_rate: fatRate,
      snf_rate: snfRate,
      solid_weight: solidWeight,
      amount: amount,
      finalRate: rate,
      fat_snf_ratio: collectionFatSnfRatio,
      clr_conversion_factor: collectionClrConversionFactor
    };
  };

  // Format collection for API submission with consistent calculations
  const formatCollectionForAPI = (editingCollection, customerId) => {
    // Make sure customer is sent as a number
    const customerIdNum = typeof customerId === 'string' && !isNaN(parseInt(customerId))
      ? parseInt(customerId)
      : customerId;

    // Handle CLR - use 0 instead of null, like in BulkCollectionV1
    const finalClrValue = parseFloat(editingCollection.clr) || 0;

    // Get base values with proper parsing
    const weight = parseFloat(editingCollection.kg) || 0;
    const fat = parseFloat(editingCollection.fat_percentage) || 0;
    const snf = parseFloat(editingCollection.snf_percentage) || 0;
    const milkRate = parseFloat(editingCollection.milk_rate) || 0;

    // Ensure base_fat_percentage is valid (use fat percentage as base)
    const baseFatPercentage = 6.5;

    // Calculate liters from kg using the same formula as BulkCollectionV1
    const liters = Math.floor((weight / 1.02249) * 100) / 100;

    // Calculate fat_kg and snf_kg to ensure consistency
    const fatKg = Math.floor((weight * (fat / 100)) * 100) / 100;
    const snfKg = Math.floor((weight * (snf / 100)) * 100) / 100;

    // Handle milk_type consistently with BulkCollectionV1
    const milkType = editingCollection.milk_type === 'cow_buffalo' || editingCollection.milk_type === 'mix' ? 'cow_buffalo' : editingCollection.milk_type || 'cow';

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
    const collectionFatSnfRatio = (editingCollection.fat_snf_ratio || '60/40').replace('_', '/');
    // Normalize clr_conversion_factor to match API choices: "0.14" or "0.50"
    let clrFactor = editingCollection.clr_conversion || editingCollection.clr_conversion_factor;
    if (clrFactor !== undefined && clrFactor !== null && clrFactor !== '') {
      // Parse and format to ensure it matches API expected format
      const parsed = parseFloat(clrFactor);
      if (!isNaN(parsed)) {
        // Round to 2 decimal places and ensure we get "0.14" or "0.50"
        clrFactor = parsed.toFixed(2);
      } else {
        clrFactor = '0.14';
      }
    } else {
      clrFactor = '0.14';
    }
    const collectionClrConversionFactor = clrFactor;

    // Get fat/SNF ratio percentages based on stored collection value
    const fatRatioPercent = collectionFatSnfRatio === '60/40' ? 60 : 52;
    const snfRatioPercent = collectionFatSnfRatio === '60/40' ? 40 : 48;

    // Calculate rates based on fat and SNF components using stored ratio
    const fatRate = Math.floor((milkRate * fatRatioPercent / 6.5) * 100) / 100;
    const snfRate = Math.floor((milkRate * snfRatioPercent / baseSnfPercentage) * 100) / 100;

    // Calculate amount accurately without rounding for API
    // Use mobile APK logic: calculate each component separately with floor
    const fatAmount = Math.floor(parseFloat(fatKg) * parseFloat(fatRate) * 100) / 100;
    const snfAmount = Math.floor(parseFloat(snfKg) * parseFloat(snfRate) * 100) / 100;
    const amount = parseFloat((fatAmount + snfAmount).toFixed(2));

    // Calculate solid weight consistently
    const solidWeight = parseFloat((amount / milkRate).toFixed(3));

    // Prepare collection data for API using ONLY valid fields expected by the backend
    const formattedCollection = {
      customer: customerIdNum,
      collection_date: editingCollection.collection_date,
      collection_time: editingCollection.collection_time, // "morning" or "evening"
      milk_type: milkType,
      animal_type: editingCollection.animal_type || 'cow',
      measured: editingCollection.measured || 'kg',
      kg: weight,
      liters: liters,
      fat_percentage: fat,
      snf_percentage: snf,
      base_snf_percentage: baseSnfPercentage,
      clr: finalClrValue,
      fat_kg: fatKg,
      snf_kg: snfKg,
      fat_rate: fatRate,
      snf_rate: snfRate,
      milk_rate: milkRate,
      amount: amount,
      solid_weight: solidWeight,
      base_fat_percentage: baseFatPercentage,
      fat_snf_ratio: collectionFatSnfRatio,
      clr_conversion_factor: String(collectionClrConversionFactor), // Ensure it's sent as string
      is_pro_rata: false // Ensure collection remains standard
    };

    // Ensure all numeric values are actual numbers, not strings
    Object.keys(formattedCollection).forEach(key => {
      if (['fat_percentage', 'snf_percentage', 'base_snf_percentage', 'base_fat_percentage',
        'fat_rate', 'snf_rate', 'milk_rate', 'fat_kg', 'snf_kg', 'solid_weight'].includes(key)) {
        formattedCollection[key] = parseFloat(formattedCollection[key]) || 0;
      }
    });

    console.log('Final formatted collection for API:', JSON.stringify(formattedCollection, null, 2));
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

    // Parse base SNF percentage preserving exact input without rounding
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

    // Get base SNF value - prioritize base_snf_percentage, then fall back to base_snf
    let baseSnfPercentage = '9.0'; // Default value
    if (collection.base_snf_percentage !== undefined && collection.base_snf_percentage !== null) {
      baseSnfPercentage = parseBaseSnfValue(collection.base_snf_percentage);
    } else if (collection.base_snf !== undefined && collection.base_snf !== null) {
      baseSnfPercentage = parseBaseSnfValue(collection.base_snf);
      console.warn('Using base_snf as fallback for base_snf_percentage. This should be fixed in the data.');
    }
    console.log('Loading base_snf_percentage into form:', baseSnfPercentage);

    let clr = '';
    if (collection.clr !== undefined && collection.clr !== null) {
      clr = parseClrValue(collection.clr);
    }

    console.log('Editing collection with customer database ID:', customerId);

    // Create the formatted collection object
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
      fat_snf_ratio: collection.fat_snf_ratio?.replace('_', '/') || '60/40'
    };

    // Save the original collection for change detection
    setOriginalCollection(formattedCollection);
    setEditingCollection(formattedCollection);
    setHasUnsavedChanges(false);
    setEditFormErrors({});

    // Debug: Log the data being set
    console.log('Setting editing collection with data:', {
      fat_percentage: formattedCollection.fat_percentage,
      snf_percentage: formattedCollection.snf_percentage,
      milk_rate: formattedCollection.milk_rate
    });

    setShowEditModal(true);
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditingCollection(null);
    setOriginalCollection(null);
    setHasUnsavedChanges(false);
    setEditFormErrors({});
  };

  // Handle form input changes
  const handleEditInputChange = (field, value) => {
    // Validate numeric inputs
    if (['fat_percentage', 'snf_percentage', 'clr', 'kg', 'base_snf_percentage', 'milk_rate', 'clr_conversion'].includes(field)) {
      // Allow empty value for clearing the field
      if (value === '') {
        // Allow empty input
      }
      // For CLR field, we only allow numbers with up to 2 decimal places
      else if (field === 'clr') {
        const regex = /^\d*\.?\d{0,2}$/;
        if (!regex.test(value)) return;
      }
      // For all other numeric fields, only block invalid characters (non-numeric, multiple dots)
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

    // If CLR is changed and fat is present, calculate SNF
    if (field === 'clr' && value && updatedCollection.fat_percentage) {
      const conversionFactor = updatedCollection.clr_conversion || updatedCollection.clr_conversion_factor || 0.14;
      const calculatedSnf = calculateSnfFromClr(value, updatedCollection.fat_percentage, conversionFactor);
      // Only update SNF if calculation returned a valid value
      if (calculatedSnf !== null) {
        updatedCollection.snf_percentage = calculatedSnf.toString();
      }

      // Recalculate derived values if all required fields are present
      if (updatedCollection.kg && updatedCollection.snf_percentage) {
        const derived = calculateDerivedValues(updatedCollection);
        updatedCollection.fat_kg = derived.fat_kg;
        updatedCollection.snf_kg = derived.snf_kg;
        updatedCollection.amount = derived.amount;
        updatedCollection.fat_rate = derived.fat_rate;
        updatedCollection.snf_rate = derived.snf_rate;
      }
    }

    // If fat is changed and CLR is present, recalculate SNF
    // Only recalculate if fat has an actual value (not empty)
    if (field === 'fat_percentage' && value !== '' && updatedCollection.clr) {
      const conversionFactor = updatedCollection.clr_conversion || updatedCollection.clr_conversion_factor || 0.14;
      const calculatedSnf = calculateSnfFromClr(updatedCollection.clr, value, conversionFactor);
      // Only update SNF if calculation returned a valid value
      if (calculatedSnf !== null) {
        updatedCollection.snf_percentage = calculatedSnf.toString();
      }

      // Recalculate derived values if weight is present
      if (updatedCollection.kg && updatedCollection.snf_percentage) {
        const derived = calculateDerivedValues(updatedCollection);
        updatedCollection.fat_kg = derived.fat_kg;
        updatedCollection.snf_kg = derived.snf_kg;
        updatedCollection.amount = derived.amount;
        updatedCollection.fat_rate = derived.fat_rate;
        updatedCollection.snf_rate = derived.snf_rate;
      }
    }

    // Update dependent calculations if fat, snf, weight, base_snf_percentage, milk_rate, fat_snf_ratio, or clr_conversion changes
    // Only do this if we have all the required values (non-empty)
    if (['fat_percentage', 'snf_percentage', 'kg', 'base_snf', 'base_snf_percentage', 'milk_rate', 'fat_snf_ratio', 'clr_conversion'].includes(field) &&
      updatedCollection.fat_percentage && updatedCollection.fat_percentage !== '' &&
      updatedCollection.snf_percentage && updatedCollection.snf_percentage !== '' &&
      updatedCollection.kg && updatedCollection.kg !== '') {

      console.log(`Recalculating due to ${field} change:`, updatedCollection);
      const derived = calculateDerivedValues(updatedCollection);
      console.log('New calculated values:', derived);

      updatedCollection.fat_kg = derived.fat_kg;
      updatedCollection.snf_kg = derived.snf_kg;
      updatedCollection.amount = derived.amount;
      updatedCollection.fat_rate = derived.fat_rate;
      updatedCollection.snf_rate = derived.snf_rate;

      console.log('Updated collection amount:', updatedCollection.amount);
    }

    // Special handling for clr_conversion field change
    if (field === 'clr_conversion' && updatedCollection.clr && updatedCollection.fat_percentage) {
      const conversionFactor = value || 0.14;
      const calculatedSnf = calculateSnfFromClr(updatedCollection.clr, updatedCollection.fat_percentage, conversionFactor);
      // Only update SNF if calculation returned a valid value
      if (calculatedSnf !== null) {
        updatedCollection.snf_percentage = calculatedSnf.toString();
      }

      // Recalculate derived values if all required fields are present
      if (updatedCollection.kg && updatedCollection.snf_percentage) {
        const derived = calculateDerivedValues(updatedCollection);
        updatedCollection.fat_kg = derived.fat_kg;
        updatedCollection.snf_kg = derived.snf_kg;
        updatedCollection.amount = derived.amount;
        updatedCollection.fat_rate = derived.fat_rate;
        updatedCollection.snf_rate = derived.snf_rate;
      }
    }

    setEditingCollection(updatedCollection);

    // Check if there are any changes compared to the original collection
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
      errors.fat_percentage = t('fatPercentCannotExceed');
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
      errors.snf_percentage = t('snfPercentCannotExceed');
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

    // Use the formatCollectionForAPI function to get formatted data
    const formattedCollection = formatCollectionForAPI(editingCollection, customerId);

    console.log('Previewing with customer database ID:', customerId);

    setPreviewCollection(formattedCollection);
    setShowPreviewModal(true);
  };

  // Save the edited collection
  const handleSaveEdit = async () => {
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

      // Use the formatCollectionForAPI function to get formatted data
      const collectionData = formatCollectionForAPI(editingCollection, customerId);

      console.log('Sending update with customer database ID:', customerId);
      console.log('Full data being sent to API:', JSON.stringify(collectionData, null, 2));

      // Send update to API
      await updateCollection(editingCollection.id, collectionData);

      // Show success message using toast
      showToast(t('collectionUpdatedSuccessfully'), 'success');

      // Close modals
      setShowPreviewModal(false);
      handleEditModalClose();

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

  // Add handlePreviewMilkRates function - updated to accept explicit filter params
  const handlePreviewMilkRates = async (options = {}) => {
    const {
      customer = modalSelectedCustomer,
      animalFilter = modalAnimalFilter
    } = options;

    setRatePreviewError(null);

    // Validate milk rate
    if (!currentMilkRate.milk_rate) {
      setRatePreviewError(t('pleaseEnterAValidMilkRate'));
      return;
    }

    // Validate date selection
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
          isProRata: false
        };
      } else {
        params = {
          dateFrom: milkRateFromDate,
          dateTo: milkRateToDate,
          isProRata: false
        };
      }

      // Add customer filter if active (use passed param or state)
      const customerToUse = customer !== undefined ? customer : modalSelectedCustomer;
      if (customerToUse) {
        params.customerId = customerToUse.id;
      }

      // Add animal filter if active (use passed param or state)
      if (animalFilter && animalFilter !== 'all') {
        params.milkType = animalFilter;
      }

      // Fetch collections for preview
      const response = await getFilteredCollections(params);

      if (response && response.results) {
        // Process collections to calculate derived values
        // IMPORTANT: Preserve the original customer database ID from API
        const processedCollections = response.results
          .filter(collection => collection.is_pro_rata === false || collection.is_pro_rata === undefined || collection.is_pro_rata === null)
          .map(collection => {
            const derived = calculateDerivedValues(collection);

            // Debug: Log the customer fields to understand the data structure
            console.log('Collection ID:', collection.id, 'Customer fields:', {
              customer: collection.customer,
              customer_id: collection.customer_id,
              customer_db_id: collection.customer_db_id,
              customer_obj: collection.customer
            });

            return {
              ...collection,
              // Preserve the original customer database ID - don't convert to customer_id
              original_customer_db_id: collection.customer,
              fat_kg: derived.fat_kg,
              snf_kg: derived.snf_kg,
              fat_rate: derived.fat_rate,
              snf_rate: derived.snf_rate,
              solid_weight: derived.solid_weight,
              amount: derived.amount
            };
          });
        setSelectedCollections(processedCollections);
        setShowMilkRatePreviewModal(true);
        setShowAddMilkRateModal(false);
      } else {
        setRatePreviewError(t('noCollectionsFoundForTheSelectedDateRange'));
      }
    } catch (err) {
      console.error('Error fetching collections for milk rate preview:', err);
      setRatePreviewError(t('failedToLoadCollectionsForPreview'));
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
      // Create updated collection with new milk rate and current fat_snf_ratio
      const updatedCollection = {
        ...collection,
        milk_rate: numValue,
        fat_snf_ratio: collection.fat_snf_ratio?.replace('_', '/') || '60/40'
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

    console.log('Updated collections after milk rate change:', updatedCollections[0]);
    setSelectedCollections(updatedCollections);
  };

  // Add handleApplyMilkRates function
  const handleApplyMilkRates = async () => {
    try {
      setIsSubmittingRates(true);
      setRatePreviewError(null);

      // Collect success and failure information
      const successfulUpdates = [];
      const failedUpdates = [];

      // Filter collections based on active filters (animal filter)
      const filteredCollections = selectedCollections.filter(c => {
        // Check animal filter
        if (modalAnimalFilter !== 'all' && c.milk_type !== modalAnimalFilter) return false;
        return true;
      });

      // Track progress for reporting
      const totalCollections = filteredCollections.length;

      console.log(`Applying milk rate ${currentMilkRate.milk_rate} to ${totalCollections} collections`);

      // Fetch customers list once for all collections
      let customersData = [];
      try {
        const response = await getCustomers();
        customersData = response.results || response;
        console.log('Fetched customers list for ID lookup:', customersData.length, 'customers');
      } catch (err) {
        console.error('Failed to fetch customers list:', err);
      }

      for (let i = 0; i < filteredCollections.length; i++) {
        const collection = filteredCollections[i];

        try {
          // Extract customer ID with comprehensive fallback logic
          let customerId = null;

          // Priority 1: Use the preserved original customer database ID from API
          if (collection.original_customer_db_id) {
            customerId = collection.original_customer_db_id;
            console.log('Using preserved original_customer_db_id:', customerId);
          }

          // Priority 2: Direct customer field
          if (!customerId && collection.customer !== undefined && collection.customer !== null) {
            if (typeof collection.customer === 'number') {
              customerId = collection.customer;
            } else if (typeof collection.customer === 'string' && !isNaN(parseInt(collection.customer))) {
              customerId = parseInt(collection.customer);
            } else if (typeof collection.customer === 'object' && collection.customer.id) {
              customerId = collection.customer.id;
            }
          }

          // Priority 3: customer_db_id field
          if (!customerId && collection.customer_db_id) {
            customerId = collection.customer_db_id;
          }

          // Priority 4: Look up from customers API using customer_id or customer_name
          if (!customerId && customersData.length > 0) {
            const foundCustomer = customersData.find(c =>
              c.customer_id === collection.customer_id ||
              c.id === collection.customer_id ||
              c.name === collection.customer_name
            );
            if (foundCustomer) {
              customerId = foundCustomer.id;
              console.log('Found customer database ID from API lookup:', customerId, 'for customer:', collection.customer_name);
            }
          }

          if (!customerId) {
            console.error('No customer ID found in collection:', collection);
            throw new Error('Customer ID is required but not found in collection data');
          }

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

          // Always include customer ID
          updatedCollection.customer = customerId;

          // If no fields are active, skip this collection
          if (Object.keys(updatedCollection).length === 1) { // Only customer field
            continue;
          }

          // Add existing calculated values with proper rounding
          updatedCollection = {
            ...updatedCollection,
            fat_kg: collection.fat_kg,
            snf_kg: collection.snf_kg,
            fat_rate: collection.fat_rate,
            snf_rate: collection.snf_rate,
            amount: Math.round(collection.amount * 100) / 100, // Round to 2 decimal places
            solid_weight: collection.solid_weight,
            is_pro_rata: false // Ensure collection remains standard
          };

          console.log(`Updating collection ID ${collection.id} with milk rate ${currentMilkRate.milk_rate}, API payload:`, updatedCollection);

          // Call the API to update the collection
          await updateCollection(collection.id, updatedCollection);

          // Track successful update
          successfulUpdates.push({
            id: collection.id,
            name: collection.customer_name
          });
        } catch (error) {
          console.error(`Failed to update collection ID ${collection.id}:`, error);

          // Track failed update
          failedUpdates.push({
            id: collection.id,
            name: collection.customer_name,
            error: error.error || 'Unknown error'
          });
        }
      }

      // Close the confirmation modal after successful update
      setShowBulkApplyConfirmation(false);

      // Show result message using inline success message (before refresh to ensure it shows even if refresh fails)
      if (failedUpdates.length > 0) {
        setCurrentSubmitMessage(t('updatedCollectionsWithMilkRatePartially', { successful: successfulUpdates.length, failed: failedUpdates.length }));
        setSubmitSuccess(true);
      } else if (successfulUpdates.length > 0) {
        // Only show milk rate in message if milk rate field was actually active
        if (activeBulkFields.milk_rate && bulkEditFields.milk_rate) {
          setCurrentSubmitMessage(t('successfullyUpdatedCollectionsWithMilkRate', { count: successfulUpdates.length, rate: bulkEditFields.milk_rate }));
        } else {
          setCurrentSubmitMessage(t('successfullyUpdatedCollections', { count: successfulUpdates.length }));
        }
        setSubmitSuccess(true);
        // Reset all bulk edit checkboxes after successful update
        resetBulkEditState();
      } else {
        setCurrentSubmitMessage(t('noCollectionsWereUpdated'));
        setSubmitSuccess(true);
      }

      // Refresh main page collections to show updated data instantly
      fetchCollectionsBasedOnFilters();

      // Refresh the collections data within the modal, preserving the modal customer filter
      // Only pass customer filter if it's valid to avoid null reference errors
      if (modalSelectedCustomer && modalSelectedCustomer.id) {
        await handlePreviewMilkRates({ customer: modalSelectedCustomer });
      } else {
        await handlePreviewMilkRates();
      }
    } catch (err) {
      console.error('Error applying milk rates:', err);
      setRatePreviewError(t('failedToApplyMilkRates'));
    } finally {
      // ...
      setIsSubmittingRates(false);
    }
  };

  // Handler to show bulk apply confirmation
  const handleShowBulkApplyConfirmation = () => {
    setShowBulkApplyConfirmation(true);
  };

  // Handler to cancel bulk apply
  const handleCancelBulkApply = () => {
    setShowBulkApplyConfirmation(false);
  };

  // Bulk Edit Functions for Milk Rate Preview Modal
  const toggleBulkField = (fieldName) => {
    setActiveBulkFields(prev => {
      const newState = !prev[fieldName];
      const wasActive = prev[fieldName];

      // If checking a field for the first time, store original values
      if (!wasActive && newState) {
        const updatedCollections = selectedCollections.map(collection => {
          const updatedCollection = { ...collection };

          // Store original values before any bulk changes
          switch (fieldName) {
            case 'base_snf':
              if (updatedCollection._originalBaseSnf === undefined) {
                updatedCollection._originalBaseSnf = updatedCollection.base_snf ?? updatedCollection.base_snf_percentage;
              }
              break;

            case 'milk_rate':
              if (updatedCollection._originalMilkRate === undefined) {
                updatedCollection._originalMilkRate = updatedCollection.milk_rate;
              }
              break;

            case 'fat_snf_ratio':
              if (updatedCollection._originalFatSnfRatio === undefined) {
                updatedCollection._originalFatSnfRatio = updatedCollection.fat_snf_ratio;
              }
              break;

            case 'clr_conversion':
              if (updatedCollection._originalSnfPercentage === undefined) {
                updatedCollection._originalSnfPercentage = updatedCollection.snf_percentage || updatedCollection.snf_percent;
              }
              break;

            case 'milk_type':
              if (updatedCollection._originalMilkType === undefined) {
                updatedCollection._originalMilkType = updatedCollection.milk_type;
              }
              break;
          }

          return updatedCollection;
        });

        setSelectedCollections(updatedCollections);
      }

      // If unchecking a field, restore original values
      if (wasActive && !newState) {
        const updatedCollections = selectedCollections.map(collection => {
          const updatedCollection = { ...collection };

          // Restore original values based on field type
          switch (fieldName) {
            case 'clr_conversion':
              if (updatedCollection._originalSnfPercentage !== undefined) {
                updatedCollection.snf_percentage = updatedCollection._originalSnfPercentage;
                updatedCollection.snf_percent = updatedCollection._originalSnfPercentage;
                delete updatedCollection._originalSnfPercentage;
              }
              updatedCollection.clr_conversion = 'Select';
              updatedCollection.clr_conversion_factor = null;
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
          }

          // Recalculate derived values with restored values
          const derived = calculateDerivedValues(updatedCollection);
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

        setSelectedCollections(updatedCollections);

        // Reset the bulk edit field value to default
        setBulkEditFields(prevFields => ({
          ...prevFields,
          [fieldName]: fieldName === 'fat_snf_ratio' || fieldName === 'clr_conversion' ? 'Select' :
            fieldName === 'milk_type' ? 'Select' : ''
        }));
      }

      return {
        ...prev,
        [fieldName]: newState
      };
    });
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
        // Store original before changing
        if (!updatedCollection._originalMilkRate) {
          updatedCollection._originalMilkRate = updatedCollection.milk_rate;
        }
        updatedCollection.milk_rate = parseFloat(value);
      }
      if (fieldName === 'base_snf' && value) {
        // Store original before changing
        if (!updatedCollection._originalBaseSnf) {
          updatedCollection._originalBaseSnf = updatedCollection.base_snf;
        }
        updatedCollection.base_snf = parseFloat(value);
        updatedCollection.base_snf_percentage = parseFloat(value);
      }
      if (fieldName === 'fat_snf_ratio' && value && value !== 'Select') {
        // Store original before changing
        if (!updatedCollection._originalFatSnfRatio) {
          updatedCollection._originalFatSnfRatio = updatedCollection.fat_snf_ratio;
        }
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

        // Recalculate SNF from CLR using APK formula if collection has CLR and fat
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
      // When "Select" is chosen for clr_conversion, restore original SNF values
      if (fieldName === 'clr_conversion' && (value === 'Select' || !value)) {
        updatedCollection.clr_conversion = 'Select';
        updatedCollection.clr_conversion_factor = null;

        // Restore original SNF if it was stored
        if (updatedCollection._originalSnfPercentage !== undefined) {
          updatedCollection.snf_percentage = updatedCollection._originalSnfPercentage;
          updatedCollection.snf_percent = updatedCollection._originalSnfPercentage;
          delete updatedCollection._originalSnfPercentage;
        }
      }
      // Note: milk_type bulk edit should NOT immediately change the collection's milk_type
      // because it would cause the collection to disappear from the filtered view.
      // The milk_type change will be applied when the user clicks "Apply Bulk Changes".
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

      // Recalculate derived values
      const derived = calculateDerivedValues(updatedCollection);
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
      milk_type: false
    });
  };

  // Helper function to get animal name
  const getAnimalName = (milkType, index) => {
    if (!milkType) return 'Cow';

    switch (milkType.toLowerCase()) {
      case 'cow':
        return 'Cow';
      case 'buffalo':
        return 'Buffalo';
      case 'mix':
        return 'Mix';
      case 'cow+buffalo':
        return 'Cow+Buffalo';
      default:
        return milkType;
    }
  };

  // Handle rate chart functionality
  const handleRateChart = () => {
    // Close the current modal
    setShowMilkRatePreviewModal(false);

    // Navigate to rate chart or open rate chart modal
    // For now, we'll just show a toast message
    showToast(t('rateChartFunctionalityWillBeImplementedSoon'), 'info');
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

  // Bulk update functions
  const openBulkUpdateModal = () => {
    setBulkMilkRate('');
    setBulkBaseSnf('');
    setBulkUpdateError(null);
    setShowBulkUpdateModal(true);
  };

  const closeBulkUpdateModal = () => {
    setShowBulkUpdateModal(false);
    setShowBulkUpdateConfirmation(false);
    setBulkUpdatePreview([]);
    setBulkUpdateMilkRate('');
    setBulkUpdateSnfPercentage('');
    setBulkUpdateClr('');
    setBulkUpdateError(null);
  };

  const handleBulkUpdate = async () => {
    if (!bulkUpdateMilkRate && !bulkUpdateSnfPercentage && !bulkUpdateClr) {
      setBulkUpdateError(t('pleaseEnterAtLeastMilkRateSnfOrClrToUpdate'));
      return;
    }

    // Generate preview data for confirmation
    const previewData = filteredCollections.map(collection => {
      const currentAmount = parseFloat(collection.amount) || 0;
      const currentRate = parseFloat(collection.milk_rate) || 1;
      const newRate = bulkUpdateMilkRate ? parseFloat(bulkUpdateMilkRate) : currentRate;

      // Get collection method for this item
      const collectionMethod = getCollectionMethod(collection);

      // For standard collections, SNF percentage should be updated directly
      let newSnfPercentage = bulkUpdateSnfPercentage ? parseFloat(bulkUpdateSnfPercentage) : (collection.snf_percentage || collection.snf_percent || 0);
      const newBaseSnf = collection.base_snf_percentage || collection.base_snf || 9.0;

      // If CLR is being updated for CLR-based collection, recalculate SNF from CLR
      if (bulkUpdateClr && collectionMethod === 'clr') {
        const clrConversionFactor = collection.clr_conversion_factor || 0.14;
        const calculatedSnf = calculateSnfFromClr(bulkUpdateClr, parseFloat(collection.fat_percentage), clrConversionFactor);
        newSnfPercentage = calculatedSnf || 0;
      }

      const editLimitReached = collection.edit_count >= 2;

      const updatedCollection = {
        ...collection,
        milk_rate: newRate,
        snf_percentage: newSnfPercentage,
        base_snf: newBaseSnf,
        base_snf_percentage: newBaseSnf,
        // Also update CLR if provided
        ...(bulkUpdateClr && { clr: parseFloat(bulkUpdateClr) })
      };

      const derived = calculateDerivedValues(updatedCollection);
      const newAmount = parseFloat(derived.amount) || currentAmount;

      return {
        ...collection,
        new_milk_rate: newRate,
        new_amount: newAmount,
        new_base_snf: newBaseSnf,
        new_snf_percentage: newSnfPercentage,
        current_milk_rate: currentRate,
        current_amount: currentAmount,
        current_base_snf: collection.base_snf_percentage || collection.base_snf || 9.0,
        edit_limit_reached: editLimitReached
      };
    });

    setBulkUpdatePreview(previewData);
    setShowBulkUpdateConfirmation(true);
  };

  const handleConfirmBulkUpdate = async () => {
    setIsSubmittingBulkUpdate(true);
    setBulkUpdateError(null);
    setShowBulkUpdateConfirmation(false);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const collection of filteredCollections) {
        try {
          // Check if collection has reached edit limit
          if (collection.edit_count >= 2) {
            console.warn(`Skipping collection ID ${collection.id} - edit limit reached (${collection.edit_count}/2)`);
            showToast(t('collectionReachedMaximumEditLimitWithCount', { id: collection.id, editCount: collection.edit_count }), 'warning');
            errorCount++;
            continue;
          }

          // Extract customer ID with comprehensive fallback logic
          let customerId = null;

          // Priority 1: Direct customer field
          if (collection.customer !== undefined && collection.customer !== null) {
            if (typeof collection.customer === 'number') {
              customerId = collection.customer;
            } else if (typeof collection.customer === 'string' && !isNaN(parseInt(collection.customer))) {
              customerId = parseInt(collection.customer);
            } else if (typeof collection.customer === 'object' && collection.customer.id) {
              customerId = collection.customer.id;
            }
          }

          // Priority 2: customer_db_id field
          if (!customerId && collection.customer_db_id !== undefined && collection.customer_db_id !== null) {
            customerId = collection.customer_db_id;
          }

          // Priority 3: customer_id field
          if (!customerId && collection.customer_id !== undefined && collection.customer_id !== null) {
            customerId = collection.customer_id;
          }

          // If still no customer ID, we can't proceed
          if (!customerId) {
            console.error(`No valid customer ID found for collection ID ${collection.id}:`, collection);
            throw new Error(`Customer ID is required for bulk update (Collection ID: ${collection.id})`);
          }

          const updateData = {};
          // Use the filtered customer ID if available, otherwise fall back to collection's customer ID
          updateData.customer = selectedCustomer?.id || customerId;

          // Only include fields that are being updated
          if (bulkUpdateMilkRate) {
            updateData.milk_rate = parseFloat(bulkUpdateMilkRate);
            // For milk rate updates, we need to recalculate amount
            const updatedCollection = {
              ...collection,
              milk_rate: parseFloat(bulkUpdateMilkRate),
              // Keep existing SNF values for calculation
              snf_percentage: collection.snf_percentage || collection.snf_percent || 0,
              base_snf: collection.base_snf_percentage || collection.base_snf || 9.0,
              base_snf_percentage: collection.base_snf_percentage || collection.base_snf || 9.0
            };
            const derived = calculateDerivedValues(updatedCollection);
            updateData.amount = Math.round(parseFloat(derived.amount) * 100) / 100;
          }

          if (bulkUpdateSnfPercentage) {
            updateData.snf_percentage = parseFloat(bulkUpdateSnfPercentage);
            // For SNF updates, we need to recalculate amount
            const updatedCollection = {
              ...collection,
              snf_percentage: parseFloat(bulkUpdateSnfPercentage),
              milk_rate: collection.milk_rate,
              base_snf: collection.base_snf_percentage || collection.base_snf || 9.0,
              base_snf_percentage: collection.base_snf_percentage || collection.base_snf || 9.0
            };
            const derived = calculateDerivedValues(updatedCollection);
            updateData.amount = Math.round(parseFloat(derived.amount) * 100) / 100;
          }

          if (bulkUpdateClr) {
            updateData.clr = parseFloat(bulkUpdateClr);

            // For CLR updates, we need to recalculate SNF and amount
            const collectionMethod = getCollectionMethod(collection);
            if (collectionMethod === 'clr') {
              const clrConversionFactor = collection.clr_conversion_factor || 0.14;
              const calculatedSnf = calculateSnfFromClr(bulkUpdateClr, parseFloat(collection.fat_percentage), clrConversionFactor);
              updateData.snf_percentage = parseFloat(calculatedSnf);

              // Recalculate amount with new SNF
              const updatedCollection = {
                ...collection,
                clr: parseFloat(bulkUpdateClr),
                snf_percentage: parseFloat(calculatedSnf),
                milk_rate: collection.milk_rate,
                base_snf: collection.base_snf_percentage || collection.base_snf || 9.0,
                base_snf_percentage: collection.base_snf_percentage || collection.base_snf || 9.0
              };
              const derived = calculateDerivedValues(updatedCollection);
              updateData.amount = Math.round(parseFloat(derived.amount) * 100) / 100;
            }
          }

          await updateCollection(collection.id, updateData);
          console.log(`=== Backend Update Data for Collection ID ${collection.id} ===`);
          console.log('Update Data:', JSON.stringify(updateData, null, 2));
          console.log(`=== End Backend Data ===\n`);
          successCount++;
        } catch (error) {
          console.error(`Failed to update collection ID ${collection.id}:`, error);

          if (error.message && error.message.includes('Edit limit exceeded')) {
            showToast(t('collectionReachedMaximumEditLimit', { id: collection.id, message: error.message }), 'error');
          } else {
            showToast(t('failedToUpdateCollection', { id: collection.id, message: error.message }), 'error');
          }

          errorCount++;
        }
      }

      if (successCount > 0) {
        showToast(t('successfullyUpdatedCollections', { count: successCount }), 'success');
        fetchCollectionsBasedOnFilters();
      }

      if (errorCount > 0) {
        showToast(t('failedToUpdateCollections', { count: errorCount }), 'error');
      }

      // Close all bulk update modals
      setShowBulkUpdateModal(false);
      setShowFinalSubmitConfirmation(false);
      setShowBulkUpdateConfirmation(false);
      setBulkUpdatePreview([]);
    } catch (error) {
      console.error('Bulk update failed:', error);
      setBulkUpdateError(t('bulkUpdateFailed'));
    } finally {
      setIsSubmittingBulkUpdate(false);
    }
  };

  // Helper functions for bulk update summary
  const getBulkUpdateSummary = () => {
    const collectionsToUpdate = filteredCollections;
    const customerSet = new Set(collectionsToUpdate.map(c => c.customer_name));
    const dates = [...new Set(collectionsToUpdate.map(c => c.collection_date))].sort();

    // Show specific customer name if customer filter is active, otherwise show count
    let customerInfo;
    if (selectedCustomer) {
      customerInfo = selectedCustomer.name;
    } else {
      customerInfo = `${customerSet.size} customer${customerSet.size !== 1 ? 's' : ''}`;
    }

    // Format dates in dd/mm/yyyy format
    const formattedDates = dates.map(date => formatDateForDisplayWithSlash(date));

    return {
      collectionsCount: collectionsToUpdate.length,
      customerInfo: customerInfo,
      dateRangeInfo: formattedDates.length > 1 ? `${formattedDates[0]} to ${formattedDates[formattedDates.length - 1]}` : formattedDates[0] || 'N/A'
    };
  };

  const getBulkUpdateMethodSummary = () => {
    const collectionsToUpdate = filteredCollections;
    const clrCollections = collectionsToUpdate.filter(c => getCollectionMethod(c) === 'clr').length;
    const snfCollections = collectionsToUpdate.filter(c => getCollectionMethod(c) === 'snf').length;

    return {
      clrCollections,
      snfCollections
    };
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

  // Helper functions for bulk update confirmation
  const handleCancelBulkUpdate = () => {
    setShowBulkUpdateConfirmation(false);
    setBulkUpdatePreview([]);
    setBulkUpdateConfirmationError(null);
  };

  // Create a computed variable for bulkUpdatePreviewData to match the modal usage
  const bulkUpdatePreviewData = bulkUpdatePreview;

  return (
    <div className="collections-container">
      <style>{`
        .collections-table td.customer-name-cell,
        .collections-table td:nth-child(3) {
          text-align: left !important;
        }
      `}</style>
      <Navbar
        title={t('viewCollections')}
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
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchCollectionsBasedOnFilters}>{t('retry')}</button>
          </div>
        ) : (
          <>
            <div className="collections-filters">
              <div className="filter-card">
                <div className="filter-card-header">
                  <div>
                    <h3>{t('quickFiltersAndActions')}</h3>
                    <p>{t('refineCollectionsAndManageRatesInstantly')}</p>
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
                    >
                      <option value="all">{t('allShifts')}</option>
                      <option value="morning">{t('morningAm')}</option>
                      <option value="evening">{t('eveningPm')}</option>
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

                  {/* Bulk Update Button - Only show when both date and customer filters are active */}
                  {/* {selectedCustomer && dateFilterActive && (
                    <button
                      className="filter-button bulk-update-button"
                      onClick={openBulkUpdateModal}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      <span>{t('bulkUpdateRateAndSnf')}</span>
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

                    {/* Add Standard Report Generator Component */}
                    <div className="report-button-wrapper">
                      <StandardReportGenerator variant="inline" />
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
                  const totals = filteredCollections.reduce((totals, collection) => {
                    return {
                      count: totals.count + 1,
                      totalQuantity: totals.totalQuantity + (parseFloat(collection.kg || collection.weight || 0) || 0),
                      totalFatKg: totals.totalFatKg + (parseFloat(collection.fat_kg || 0) || 0),
                      totalSnfKg: totals.totalSnfKg + (parseFloat(collection.snf_kg || 0) || 0),
                      totalSolidWeight: totals.totalSolidWeight + (parseFloat(collection.solid_weight || 0) || 0),
                      totalAmount: totals.totalAmount + (parseFloat(collection.amount || 0) || 0)
                    };
                  }, { count: 0, totalQuantity: 0, totalFatKg: 0, totalSnfKg: 0, totalSolidWeight: 0, totalAmount: 0 });

                  const avgFatPercent = totals.totalQuantity > 0 ? (totals.totalFatKg / totals.totalQuantity * 100) : 0;
                  const avgSnfPercent = totals.totalQuantity > 0 ? (totals.totalSnfKg / totals.totalQuantity * 100) : 0;
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
                      borderLeft: '4px solid #1976d2',
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
                          Total Final Amt: <strong style={{ color: '#1565c0' }}>{formatCurrency(Math.floor(totals.totalAmount * 0.999))}</strong>
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
                      <th>{t('dateAndShift')}</th>
                      <th>{t('name')}</th>
                      <th>{t('qtyKg')}</th>
                      <th>{t('fatPercent')}</th>
                      <th>{t('snfPercent')}</th>
                      <th>{t('clr')}</th>
                      <th>{t('fatKg')}</th>
                      <th>{t('snfKg')}</th>
                      <th>{t('fatRate')}</th>
                      <th>{t('snfRate')}</th>
                      <th>{t('milkRate')}</th>
                      <th>{t('baseSnf')}</th>
                      <th>{t('animalType')}</th>
                      <th>{t('amount')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCollections.map((collection, index) => (
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
                        <td>{formatNumber(collection.kg || collection.weight)}</td>
                        <td>{formatNumber(collection.fat_percentage || collection.fat_percent)}</td>
                        <td
                          style={{
                            opacity: parseFloat(collection.snf_percentage || collection.snf_percent) > 0 ? '1' : '0.5',
                            backgroundColor: parseFloat(collection.snf_percentage || collection.snf_percent) > 0 ? '#e6f7ff' : 'inherit'
                          }}
                        >
                          {formatNumber(collection.snf_percentage || collection.snf_percent)}
                        </td>
                        <td
                          style={{
                            opacity: parseFloat(collection.clr) > 0 ? '1' : '0.5',
                            backgroundColor: parseFloat(collection.clr) > 0 ? '#e6f7ff' : 'inherit'
                          }}
                        >
                          {formatNumber(collection.clr)}
                        </td>
                        <td>{formatNumber(collection.fat_kg)}</td>
                        <td>{formatNumber(collection.snf_kg)}</td>
                        <td>{formatNumber(collection.fat_rate)}</td>
                        <td>{formatNumber(collection.snf_rate)}</td>
                        <td>{formatNumber(collection.milk_rate)}</td>
                        <td>{formatNumber(collection.base_snf || collection.base_snf_percentage || 9.0)}</td>
                        <td>{collection.milk_type === 'cow' ? t('cow') : collection.milk_type === 'buffalo' ? t('buffalo') : collection.milk_type === 'mix' || collection.milk_type === 'cow_buffalo' || collection.milk_type === 'cow+buffalo' ? t('mix') : t('cow')}</td>
                        <td>{formatNumber(collection.amount, 2)}</td>
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
                    ))}
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
                  const calculateTotals = () => {
                    return filteredCollections.reduce((totals, collection) => {
                      return {
                        count: totals.count + 1,
                        totalQuantity: totals.totalQuantity + (parseFloat(collection.kg || collection.weight || 0) || 0),
                        totalFatKg: totals.totalFatKg + (parseFloat(collection.fat_kg || 0) || 0),
                        totalSnfKg: totals.totalSnfKg + (parseFloat(collection.snf_kg || 0) || 0),
                        totalSolidWeight: totals.totalSolidWeight + (parseFloat(collection.solid_weight || 0) || 0),
                        totalAmount: totals.totalAmount + (parseFloat(collection.amount || 0) || 0)
                      };
                    }, { count: 0, totalQuantity: 0, totalFatKg: 0, totalSnfKg: 0, totalSolidWeight: 0, totalAmount: 0 });
                  };
 
                  const totals = calculateTotals();
                  if (!totals) return null;
 
                  const avgFatPercent = totals.totalQuantity > 0 ? (totals.totalFatKg / totals.totalQuantity * 100) : 0;
                  const avgSnfPercent = totals.totalQuantity > 0 ? (totals.totalSnfKg / totals.totalQuantity * 100) : 0;
                  const avgFatLabel = t('avgFat') === 'avgFat' ? 'Avg Fat' : t('avgFat');
                  const avgSnfLabel = t('avgSnf') === 'avgSnf' ? 'Avg SNF' : t('avgSnf');
 
                  return (
                    <>
                      <div className="stats-container">
                        <div className="stat-item">
                          <div className="stat-label">Total Quantity</div>
                          <div className="stat-value">{formatNumber(totals.totalQuantity)} kg</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">Total Fat</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                            <div className="stat-value">{formatNumber(totals.totalFatKg)} kg</div>
                            <div className="stat-average" style={{ fontSize: '17px', color: '#166534', fontWeight: '600' }}>
                              {avgFatLabel}%: {formatNumber(avgFatPercent)}%
                            </div>
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">Total SNF</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                            <div className="stat-value">{formatNumber(totals.totalSnfKg)} kg</div>
                            <div className="stat-average" style={{ fontSize: '17px', color: '#9a3412', fontWeight: '600' }}>
                              {avgSnfLabel}%: {formatNumber(avgSnfPercent)}%
                            </div>
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">Total Solid Weight</div>
                          <div className="stat-value">{formatNumber(totals.totalSolidWeight)} kg</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">Total Amount</div>
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
                  <p>{t('loadingSuppliers')}</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="no-customers">
                  <p>{t('noSupplierFound')}</p>
                </div>
              ) : (
                filteredCustomers.map(customer => (
                  <div
                    key={customer.id}
                    className="customer-item"
                    onClick={() => handleCustomerSelection(customer)}
                  >
                    <div className="customer-name">{customer.name}</div>
                    <div className="customer-code">{customer.customer_id || customer.id || t('noId')}</div>
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
                  <span>{t('dateRange')}</span>
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
              <h2>{t('editCollection')}</h2>
              <button
                className="modal-close-button"
                onClick={handleEditModalClose}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="edit-collection-container">
              {editFormErrors.submit && (
                <div className="edit-form-error">
                  <p>{editFormErrors.submit}</p>
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
                    value={editingCollection.fat_snf_ratio?.replace('_', '/') || '60/40'}
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
                    value={editingCollection.milk_type || 'cow'}
                    onChange={(e) => handleEditInputChange('milk_type', e.target.value)}
                    className="edit-form-input"
                  >
                    <option value="cow">{t('cow')}</option>
                    <option value="buffalo">{t('buffalo')}</option>
                    <option value="cow_buffalo">{t('cowBuffalo')}</option>
                  </select>
                </div>

                <div className="edit-form-group">
                  <label htmlFor="clr-conversion" className='edit-text'>{t('clrConversionFactor')}:</label>
                  <select
                    id="clr-conversion"
                    value={editingCollection.clr_conversion || parseFloat(editingCollection.clr_conversion_factor || 0.14).toFixed(2) || '0.14'}
                    onChange={(e) => handleEditInputChange('clr_conversion', e.target.value)}
                    className="edit-form-input"
                  >
                    <option value="0.14">0.14</option>
                    <option value="0.50">0.50</option>
                  </select>
                </div>
              </div>

              <div className="edit-form-row calculation-results">
                <div className="calculation-item">
                  <label>{t('fatKg')}:</label>
                  <span>{formatNumber(editingCollection.fat_kg)}</span>
                </div>

                <div className="calculation-item">
                  <label>{t('snfKg')}:</label>
                  <span>{formatNumber(editingCollection.snf_kg)}</span>
                </div>

                <div className="calculation-item">
                  <label>{t('amount')}:</label>
                  <span>{formatCurrency(editingCollection.amount)}</span>
                </div>
              </div>

              <div className="edit-form-actions">
                <button
                  className="edit-form-button cancel"
                  onClick={handleEditModalClose}
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

      )
      }

      {/* preview edit modal */}
      {
        showPreviewModal && previewCollection && (
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
                          {previewCollection.milk_type === 'cow' ? 'Cow' : previewCollection.milk_type === 'buffalo' ? 'Buffalo' : previewCollection.milk_type === 'mix' ? 'Cow+Buffalo' : previewCollection.milk_type || 'Cow'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', fontWeight: '600' }}>{formatCurrency(previewCollection.amount)}</td>
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
                <button
                  className="confirm-button-preview"
                  onClick={handleSaveEdit}
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
        )
      }

      {
        showEditCustomerModal && (
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
                    placeholder={t('searchCustomersPlaceholder')}
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
                      <div className="customer-code">{customer.customer_id || customer.id || t('noId')}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      }

      {
        showAddMilkRateModal && (
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
                        value={milkRateToDate}
                        onChange={(e) => setMilkRateToDate(e.target.value)}
                        onClick={(e) => e.target.showPicker()}
                      />
                    </div>
                  </>
                )}

                {ratePreviewError && (
                  <div className="error-message" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'red',
                    margin: '10px 0',
                    padding: '8px 12px',
                    backgroundColor: '#ffebee',
                    border: '1px solid #f44336',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}>
                    <span>{ratePreviewError}</span>
                    <button
                      onClick={() => setRatePreviewError(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#c62828',
                        cursor: 'pointer',
                        padding: '2px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        borderRadius: '2px',
                        marginLeft: '8px'
                      }}
                      title="Close error message"
                    >
                      ×
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
        )
      }

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
                  <div className="edit-form-error" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: '#ffebee',
                    border: '1px solid #f44336',
                    borderRadius: '4px',
                    color: '#c62828',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    <span>{ratePreviewError}</span>
                    <button
                      onClick={() => setRatePreviewError(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#c62828',
                        cursor: 'pointer',
                        padding: '2px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        borderRadius: '2px',
                        marginLeft: '8px'
                      }}
                      title="Close error message"
                    >
                      ×
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
                            console.log('Clearing modal customer filter');
                            setModalSelectedCustomer(null);
                            // useEffect will handle the refetch
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
                        // useEffect will handle the refetch with new animal filter
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
                            // useEffect will handle the refetch
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
                  <table className="preview-table-bulk" style={{ minWidth: '1300px', width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('dateTime')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('milkRate')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('customer')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('weightKg')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('fatPercent')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('snfPercent')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('clr')}</th>
                        {/* <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('fatKg')}</th> */}
                        {/* <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('snfKg')}</th> */}
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('fatRate')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('snfRate')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('animal')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('baseSnf')}</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', backgroundColor: '#1976d2', fontWeight: '600', color: '#fff', borderBottom: '2px solid #0d47a1', fontSize: '13px', lineHeight: '1.2' }}>{t('amount')}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedCollections
                        .filter(collection => {
                          if (modalAnimalFilter === 'all') return true;
                          return collection.milk_type === modalAnimalFilter;
                        })
                        .map((collection, index) => {
                          const fatKg = parseFloat(collection.fat_kg) ||
                            (parseFloat(collection.kg) * parseFloat(collection.fat_percentage) / 100);
                          const snfKg = parseFloat(collection.snf_kg) ||
                            (parseFloat(collection.kg) * parseFloat(collection.snf_percentage) / 100);

                          const rowStyle = {
                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                          };

                          const cellStyle = {
                            padding: '8px 10px',
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
                              {/* <td style={cellStyle}>
                              {formatNumber(fatKg)}
                            </td>
                            <td style={cellStyle}>
                              {formatNumber(snfKg)}
                            </td> */}
                              <td style={cellStyle}>
                                {formatNumber(collection.fat_rate)}
                              </td>
                              <td style={cellStyle}>
                                {formatNumber(collection.snf_rate)}
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

                              <td style={cellStyle}>
                                {formatNumber(collection.base_snf || collection.base_snf_percentage)}
                              </td>

                              <td style={{ ...cellStyle, fontWeight: '600', color: '#2e7d32' }}>
                                {formatCurrency(collection.amount)}
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
                              const fatKg = parseFloat(c.fat_kg) ||
                                (parseFloat(c.kg) * parseFloat(c.fat_percentage) / 100);
                              return sum + fatKg;
                            }, 0))} kg
                          </div>
                        </div>
                        <div className="bulk-edit-stats-divider" style={{ width: '1px', height: '25px', backgroundColor: '#dee2e6', flexShrink: 0 }}></div>
                        <div className="bulk-edit-stats-item" style={{ textAlign: 'center', minWidth: '70px', flex: '1 1 auto' }}>
                          <div style={{ fontSize: '12px', color: '#000', marginBottom: '3px', fontWeight: '500' }}>Snf Kg</div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1976d2', lineHeight: '1.2' }}>
                            {formatNumber(bulkFilteredCols.reduce((sum, c) => {
                              const snfKg = parseFloat(c.snf_kg) ||
                                (parseFloat(c.kg) * parseFloat(c.snf_percentage) / 100);
                              return sum + snfKg;
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
                            {formatNumber(bulkFilteredCols.reduce((sum, c) =>
                              sum + parseFloat(c.solid_weight || 0), 0))} kg
                          </div>
                        </div>
                        <div className="bulk-edit-stats-divider" style={{ width: '1px', height: '25px', backgroundColor: '#dee2e6', flexShrink: 0 }}></div>
                        <div className="bulk-edit-stats-item" style={{ textAlign: 'center', minWidth: '80px', flex: '1 1 auto' }}>
                          <div style={{ fontSize: '12px', color: '#000', marginBottom: '3px', fontWeight: '600' }}>{t('totalAmt')}</div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2e7d32', lineHeight: '1.2' }}>
                            {formatCurrency(bulkFilteredCols.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0))}
                          </div>
                        </div>
                        <div className="bulk-edit-stats-divider" style={{ width: '1px', height: '25px', backgroundColor: '#dee2e6', flexShrink: 0 }}></div>
                        <div className="bulk-edit-stats-item" style={{ textAlign: 'center', minWidth: '80px', flex: '1 1 auto' }}>
                          <div style={{ fontSize: '12px', color: '#000', marginBottom: '3px', fontWeight: '600' }}>{t('finalAmount')}</div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e8e3e', lineHeight: '1.2' }}>
                            {(() => {
                              const totalAmt = bulkFilteredCols.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
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
                  disabled={isSubmittingRates || !Object.values(activeBulkFields).some(Boolean)}
                  style={{
                    border: 'none',
                    background: isSubmittingRates || !Object.values(activeBulkFields).some(Boolean) ? '#90caf9' : '#1976d2',
                    color: '#fff',
                    cursor: isSubmittingRates || !Object.values(activeBulkFields).some(Boolean) ? 'not-allowed' : 'pointer',
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
                      <FontAwesomeIcon icon={faCheck} style={{ fontSize: '12px', marginRight: '2px' , marginLeft: '5px'}} />
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

      {
        showDeleteConfirmation && collectionToDelete && (
          <div className="modal-overlay">
            <div className="confirmation-modal">
              <div className="modal-header">
                <h3>{t('confirmDeleteCollection')}</h3>
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
                  <p><strong>{t('customer')}:</strong> {collectionToDelete.customer_name}</p>
                  <p><strong>{t('date')}:</strong> {formatDateForDisplay(collectionToDelete.collection_date)}</p>
                  <p><strong>{t('time')}:</strong> {collectionToDelete.collection_time === 'morning' ? t('morning') : t('evening')}</p>
                  <p><strong>{t('weight')}:</strong> {parseFloat(collectionToDelete.kg).toFixed(2)} kg</p>
                </div>
                <p className="warning-text">{t('actionCannotBeUndone')}</p>
                {deleteError && (
                  <div className="error-message">
                    {deleteError}
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
                    t('delete')
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }




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
                    <div className="customer-code">{customer.customer_id || customer.id || t('noId')}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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


      <footer className="collections-footer">
        <p>&copy; 2025 Dudhiya. All rights reserved.</p>
        <img src="/Powered-By-Netpy-Technologies.png" style={{ width: '170px' }} alt="Powered by Netpy Technologies" />
      </footer>


    </div >
  );
};

export default PreviewCollections;