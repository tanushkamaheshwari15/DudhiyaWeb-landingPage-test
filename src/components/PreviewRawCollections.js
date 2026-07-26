import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getRawCollections, getCustomers, updateRawCollection, deleteRawCollection } from '../services/api';
import { removeToken } from '../services/tokenStorage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faArrowLeft, faSearch, faTimes, faUserAlt, faCalendarAlt, faEdit, faCheck, faSortAmountDown, faSortAmountUp, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../contexts/LanguageContext';
import './PreviewRawCollections.css';
import { toast } from 'react-toastify';

// Toggle styles for date filter radio buttons
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

const PreviewRawCollections = () => {
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
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  // Date filter state
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [singleDateFilterMode, setSingleDateFilterMode] = useState(false);
  const [singleDate, setSingleDate] = useState('');

  // Add sort order state - default to descending (newest first)
  const [sortOrder, setSortOrder] = useState('desc');

  // Edit collection state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [editFormErrors, setEditFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Milk Rate state
  const [showAddMilkRateModal, setShowAddMilkRateModal] = useState(false);
  const [showMilkRatePreviewModal, setShowMilkRatePreviewModal] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [milkRateFromDate, setMilkRateFromDate] = useState('');
  const [milkRateToDate, setMilkRateToDate] = useState('');
  const [isLoadingRatePreview, setIsLoadingRatePreview] = useState(false);
  const [currentMilkRate, setCurrentMilkRate] = useState({ milk_rate: 50 });
  const [ratePreviewError, setRatePreviewError] = useState(null);
  const [isSubmittingRates, setIsSubmittingRates] = useState(false);
  const [milkRateSingleDateFilterMode, setMilkRateSingleDateFilterMode] = useState(false);
  const [milkRateSingleDate, setMilkRateSingleDate] = useState('');

  // Add state variables for delete functionality
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Add state variables for editing customer
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editCustomerSearchTerm, setEditCustomerSearchTerm] = useState('');
  const [editFilteredCustomers, setEditFilteredCustomers] = useState([]);

  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const fetchCollectionsBasedOnFilters = useCallback(async (initialLoad = false) => {
    setLoading(true);
    setError(null);

    // Add detailed logging about our current filters
    console.log('======= FETCH COLLECTIONS BASED ON FILTERS =======');
    console.log('Current filter state:', {
      customerFilter: selectedCustomer ? {
        id: selectedCustomer.id,
        name: selectedCustomer.name,
        customer_id: selectedCustomer.customer_id
      } : 'None',
      dateFilter: dateFilterActive ? (
        singleDateFilterMode ?
          `Single date: ${singleDate}` :
          `Range: ${fromDate} to ${toDate}`
      ) : 'None',
      pageInfo: `Page ${page}, Size ${pageSize}`,
      sortOrder: sortOrder
    });

    try {
      if (initialLoad) {
        setCollections([]);
        setFilteredCollections([]);
      }

      let response;

      // Create ordering parameter based on sortOrder
      const ordering = sortOrder === 'asc' ? 'created_at' : '-created_at';
      console.log(`Using ordering parameter: ${ordering} for sorting by creation time`);

      // Modified logic to separate the cases similar to PreviewCollections.js
      // Handle three cases: both filters, only customer filter, only date filter, or no filters
      if (selectedCustomer && dateFilterActive) {
        // Both customer and date filters are active
        console.log('Both customer and date filters active - fetching matching raw collections');

        // Make sure we're using the correct parameter names that match the API documentation
        const apiParams = {
          // According to the API docs, we should use customer_name for filtering
          customer_name: selectedCustomer.name,
          // Keep the original parameters as fallback
          customer: selectedCustomer.id,
          customer_id: selectedCustomer.customer_id,
          from_date: singleDateFilterMode ? singleDate : fromDate,
          to_date: singleDateFilterMode ? singleDate : toDate,
          fetch_all: true,
          page_size: 1000,
          ordering: ordering // Add ordering parameter
        };

        console.log('Modified API params being sent for combined filters:', apiParams);
        response = await getRawCollections(apiParams);

        // Add more detailed logging for debugging
        console.log('===== COMBINED FILTERS API RESPONSE =====');
        console.log('Response type:', typeof response);
        console.log('Is array?', Array.isArray(response));
        console.log('Has results property?', response && response.results ? 'Yes' : 'No');
        console.log('Response structure:', Object.keys(response || {}));
        if (response && response.results) {
          console.log('Results count:', response.results.length);
          if (response.results.length > 0) {
            console.log('First result sample:', response.results[0]);
          }
        }

        console.log(`Received ${response.results?.length || response.length || 0} raw collections from API`);

        // Process the response data
        let collectionsData = [];
        if (Array.isArray(response)) {
          collectionsData = response;
        } else if (response && response.results) {
          collectionsData = response.results;
        } else {
          console.error('Unexpected API response format:', response);
          throw new Error('Unexpected API response format');
        }

        // Set the collections data
        setCollections(collectionsData);

        // Sort and set the filtered collections based on created_at
        const sortedCollections = [...collectionsData].sort((a, b) => {
          const dateA = new Date(a.created_at || a.collection_date);
          const dateB = new Date(b.created_at || b.collection_date);

          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        setFilteredCollections(sortedCollections);
        setHasMore(false);
      } else if (dateFilterActive) {
        // Only date filter active
        console.log('Only date filter active - fetching all matching raw collections');

        let params = {
          fetch_all: true,
          page_size: 1000 // Use a large value
        };

        // Add date filters
        if (singleDateFilterMode) {
          console.log(`Date filter applied: single date ${singleDate}`);
          params.from_date = singleDate;
          params.to_date = singleDate;
        } else {
          console.log(`Date filter applied: range from ${fromDate} to ${toDate}`);
          params.from_date = fromDate;
          params.to_date = toDate;
        }

        console.log('API params being sent for date filter:', params);

        // Similar to the other cases, make sure we're using the correct parameter names
        const apiParams = {
          from_date: singleDateFilterMode ? singleDate : fromDate,
          to_date: singleDateFilterMode ? singleDate : toDate,
          fetch_all: true,
          page_size: 1000,
          ordering: ordering // Add ordering parameter
        };

        console.log('Modified API params being sent for date filter:', apiParams);
        response = await getRawCollections(apiParams);

        // Add more detailed logging for debugging
        console.log('===== DATE FILTER API RESPONSE =====');
        console.log('Response type:', typeof response);
        console.log('Is array?', Array.isArray(response));
        console.log('Has results property?', response && response.results ? 'Yes' : 'No');
        console.log('Response structure:', Object.keys(response || {}));
        if (response && response.results) {
          console.log('Results count:', response.results.length);
          if (response.results.length > 0) {
            console.log('First result sample:', response.results[0]);
          }
        }

        let collectionsData = [];
        if (Array.isArray(response)) {
          collectionsData = response;
        } else if (response && response.results) {
          collectionsData = response.results;
        } else {
          console.error('Unexpected API response format:', response);
          throw new Error('Unexpected API response format');
        }

        // Set the collections data
        setCollections(collectionsData);

        // Sort and set the filtered collections based on created_at
        const sortedCollections = [...collectionsData].sort((a, b) => {
          const dateA = new Date(a.created_at || a.collection_date);
          const dateB = new Date(b.created_at || b.collection_date);

          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        setFilteredCollections(sortedCollections);
        setHasMore(false);
      } else if (selectedCustomer) {
        // Only customer filter active
        console.log('Only customer filter active - fetching all matching raw collections');

        // According to the API docs, we should use customer_name for filtering
        const apiParams = {
          customer_name: selectedCustomer.name,
          // Keep the original parameters as fallback
          customer: selectedCustomer.id,
          customer_id: selectedCustomer.customer_id,
          fetch_all: true,
          page_size: 1000,
          ordering: ordering // Add ordering parameter
        };

        console.log('Modified API params being sent for customer filter:', apiParams);
        response = await getRawCollections(apiParams);

        // Add more detailed logging for debugging
        console.log('===== CUSTOMER FILTER API RESPONSE =====');
        console.log('Response type:', typeof response);
        console.log('Is array?', Array.isArray(response));
        console.log('Has results property?', response && response.results ? 'Yes' : 'No');
        console.log('Response structure:', Object.keys(response || {}));
        if (response && response.results) {
          console.log('Results count:', response.results.length);
          if (response.results.length > 0) {
            console.log('First result sample:', response.results[0]);
          }
        }

        let collectionsData = [];
        if (Array.isArray(response)) {
          collectionsData = response;
        } else if (response && response.results) {
          collectionsData = response.results;
        } else {
          console.error('Unexpected API response format:', response);
          throw new Error('Unexpected API response format');
        }

        // Set the collections data
        setCollections(collectionsData);

        // Sort and set the filtered collections based on created_at
        const sortedCollections = [...collectionsData].sort((a, b) => {
          const dateA = new Date(a.created_at || a.collection_date);
          const dateB = new Date(b.created_at || b.collection_date);

          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        setFilteredCollections(sortedCollections);
        setHasMore(false);
      } else {
        // No filters active - use pagination
        console.log(`Fetching raw collections with pagination for page ${page}`);

        // Only include pagination params if no filters are active
        let params = {
          page,
          page_size: pageSize,
          ordering: ordering // Add ordering parameter
        };

        console.log('API params being sent:', params);
        response = await getRawCollections(params);

        console.log(`Received ${response.results?.length || 0} raw collections for page ${page}`);

        // Handle paginated API response
        if (page === 1) {
          setCollections(response.results || []);
        } else {
          setCollections(prevCollections =>
            [...prevCollections, ...(response.results || [])]
          );
        }

        // Sort the collections based on created_at
        const sortedCollections = [...(response.results || [])].sort((a, b) => {
          const dateA = new Date(a.created_at || a.collection_date);
          const dateB = new Date(b.created_at || b.collection_date);

          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        if (page === 1) {
          setFilteredCollections(sortedCollections);
        } else {
          // For pagination, add to existing filtered collections
          setFilteredCollections(prevFiltered => {
            const combined = [...prevFiltered, ...(response.results || [])];
            return combined.sort((a, b) => {
              const dateA = new Date(a.created_at || a.collection_date);
              const dateB = new Date(b.created_at || b.collection_date);

              return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            });
          });
        }

        // Check if there are more pages
        setHasMore(response.next !== null);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);

      // Provide more informative error messages based on active filters
      let errorMessage = 'Failed to fetch collections. Please try again later.';

      if (selectedCustomer && dateFilterActive) {
        if (singleDateFilterMode) {
          errorMessage = `Failed to load collections for ${selectedCustomer.name} on ${formatDateForDisplay(singleDate)}.`;
        } else {
          errorMessage = `Failed to load collections for ${selectedCustomer.name} between ${formatDateForDisplay(fromDate)} and ${formatDateForDisplay(toDate)}.`;
        }
      } else if (selectedCustomer) {
        errorMessage = `Failed to load collections for ${selectedCustomer.name}.`;
      } else if (dateFilterActive) {
        if (singleDateFilterMode) {
          errorMessage = `Failed to load collections on ${formatDateForDisplay(singleDate)}.`;
        } else {
          errorMessage = `Failed to load collections between ${formatDateForDisplay(fromDate)} and ${formatDateForDisplay(toDate)}.`;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, selectedCustomer, dateFilterActive, singleDateFilterMode, singleDate, fromDate, toDate, sortOrder]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchCollectionsBasedOnFilters();
  }, [fetchCollectionsBasedOnFilters, page]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // When filter values change, fetch with initialLoad=true to reset collections
    if (page === 1) {
      fetchCollectionsBasedOnFilters(true);
    } else {
      // If we're on another page, reset to page 1 and the useEffect for page change will handle the fetch
      console.log('Filters changed, resetting to page 1');
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomer, dateFilterActive, fromDate, toDate, singleDate, singleDateFilterMode, sortOrder]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      // Sort the collections by created_at date
      const sortedCollections = [...collections].sort((a, b) => {
        const dateA = new Date(a.created_at || a.collection_date);
        const dateB = new Date(b.created_at || b.collection_date);

        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });

      setFilteredCollections(sortedCollections);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = collections.filter(collection =>
        (collection.customer_name && collection.customer_name.toLowerCase().includes(lowercasedSearch)) ||
        (collection.customer_id && collection.customer_id.toString().includes(lowercasedSearch))
      );

      // Sort the filtered results by created_at date
      const sortedFiltered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.created_at || a.collection_date);
        const dateB = new Date(b.created_at || b.collection_date);

        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });

      setFilteredCollections(sortedFiltered);
    }
  }, [searchTerm, collections, sortOrder]);

  const openCustomerModal = async () => {
    setShowCustomerModal(true);
    setCustomerSearchTerm('');

    try {
      setLoadingCustomers(true);
      const response = await getCustomers();
      if (response && (response.results || Array.isArray(response))) {
        const customerData = response.results || response;

        // Ensure every customer has all the id fields we might need
        const processedCustomers = customerData.map(customer => ({
          ...customer,
          id: customer.id,
          customer_id: customer.customer_id || customer.id,
          name: customer.name
        }));

        console.log('Processed customer data:', processedCustomers[0]);
        setCustomers(processedCustomers);
        setFilteredCustomers(processedCustomers);
      } else {
        console.error('Unexpected response format from getCustomers:', response);
        setError('Failed to load customers: Unexpected response format');
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again later.');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const openDateFilterModal = () => {
    // Clear any previous errors
    setError(null);

    const today = new Date();

    // Initialize dates if not already set
    if (!fromDate) {
      // Default to first day of current month
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const formattedFromDate = formatDateForInput(firstDayOfMonth);
      console.log('Setting default from date:', formattedFromDate);
      setFromDate(formattedFromDate);
    }

    if (!toDate) {
      const formattedToDate = formatDateForInput(today);
      console.log('Setting default to date:', formattedToDate);
      setToDate(formattedToDate);
    }

    if (!singleDate) {
      const formattedSingleDate = formatDateForInput(today);
      console.log('Setting default single date:', formattedSingleDate);
      setSingleDate(formattedSingleDate);
    }

    setShowDateFilterModal(true);
  };

  const formatDateForInput = (date) => {
    if (!date) return '';

    try {
      // Handle both Date objects and date strings
      const d = new Date(date);

      // Check if date is valid
      if (isNaN(d.getTime())) {
        console.error('Invalid date value for input:', date);
        return '';
      }

      // Format as YYYY-MM-DD for HTML date input
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date for input:', error, date);
      return '';
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Invalid date string for display:', dateString);
        return dateString;
      }

      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date for display:', error);
      return dateString;
    }
  };

  const applyDateFilter = () => {
    if (singleDateFilterMode) {
      if (!singleDate) {
        setError('Please select a date');
        return;
      }

      try {
        const singleDateObj = new Date(singleDate);

        // Validate date object
        if (isNaN(singleDateObj.getTime())) {
          setError('Invalid date format. Please select a valid date.');
          return;
        }

        console.log('Applying single date filter:', { singleDate });
        setDateFilterActive(true);
        setPage(1); // Reset to page 1 when applying filter
        setShowDateFilterModal(false);
        // Fetch will be triggered by useEffect due to dateFilterActive change
      } catch (error) {
        console.error('Error applying single date filter:', error);
        setError('An error occurred while applying the date filter');
      }
    } else {
      if (!fromDate || !toDate) {
        setError('Please select both from and to dates');
        return;
      }

      try {
        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(toDate);

        // Validate date objects
        if (isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
          setError('Invalid date format. Please select valid dates.');
          return;
        }

        // Validate that to date is not before from date
        if (toDateObj < fromDateObj) {
          setError('To date cannot be earlier than from date');
          return;
        }

        console.log('Applying date range filter:', { fromDate, toDate });
        setDateFilterActive(true);
        setPage(1); // Reset to page 1 when applying filter
        setShowDateFilterModal(false);
        // Fetch will be triggered by useEffect due to dateFilterActive change
      } catch (error) {
        console.error('Error applying date filter:', error);
        setError('An error occurred while applying the date filter');
      }
    }
  };

  const clearDateFilter = () => {
    setDateFilterActive(false);
    setFromDate('');
    setToDate('');
    setSingleDate('');
    setPage(1); // Reset to page 1 when clearing date filter
    setError(null); // Clear any error messages
    console.log('Date filter cleared');
    // Fetch will be triggered by useEffect due to dateFilterActive change
  };

  const selectCustomer = (customer) => {
    console.log('Selected customer for filtering:', JSON.stringify(customer, null, 2));

    // Make sure we have all necessary customer details
    if (!customer.id) {
      console.error('Warning: Customer object does not have an ID property:', customer);
    }

    if (!customer.name) {
      console.error('Warning: Customer object does not have a name property:', customer);
    }

    // Ensure all required fields are available, with special attention to customer name
    // which is used for filtering according to the API docs
    const customerToSet = {
      ...customer,
      id: customer.id, // Database ID
      customer_id: customer.customer_id || customer.id, // Display ID or fallback to DB ID
      name: customer.name || 'Unknown Customer' // Name is essential for API filtering
    };

    console.log('Setting selected customer with standardized fields:', JSON.stringify(customerToSet, null, 2));
    setSelectedCustomer(customerToSet);
    setPage(1); // Explicitly reset to page 1
    setShowCustomerModal(false);

    // If date filter is also active, log that we're about to query with both filters
    if (dateFilterActive) {
      console.log('Both customer and date filters will be active after this selection', {
        customer_name: customerToSet.name, // Log the customer name which we'll use for filtering
        customer_id: customerToSet.id,
        date_filter: singleDateFilterMode ? singleDate : `${fromDate} to ${toDate}`
      });
    }
  };

  const clearCustomerFilter = () => {
    setSelectedCustomer(null);
    setPage(1); // Explicitly reset to page 1
    // Fetch will be triggered by useEffect due to selectedCustomer change
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
    const searchText = e.target.value;
    setCustomerSearchTerm(searchText);

    if (searchText.trim()) {
      const filtered = customers.filter(customer =>
        (customer.name && customer.name.toLowerCase().includes(searchText.toLowerCase())) ||
        (customer.customer_id && customer.customer_id.toString().includes(searchText))
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  };

  const formatDate = (dateString, time) => {
    if (!dateString) return 'N/A';

    const options = {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };

    try {
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString('en-IN', options);

      let timeDisplay = '';
      if (time === 'morning') {
        timeDisplay = '(AM)';
      } else if (time === 'evening') {
        timeDisplay = '(PM)';
      }

      return `${formattedDate} ${timeDisplay}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const formatNumber = (number) => {
    if (number === null || number === undefined) return 'N/A';

    return parseFloat(number).toFixed(2);
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';

    return `₹${parseFloat(amount).toFixed(2)}`;
  };

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

    // Add sort order info to the description
    description += ` (${sortOrder === 'desc' ? 'newest first' : 'oldest first'} by creation time)`;

    return description;
  };

  // Calculate SNF from CLR (copied from BulkCollectionV1)
  const calculateSnfFromClr = (clrValue, fatValue) => {
    // Convert strings to numbers to ensure proper calculation
    const clr = parseFloat(clrValue);
    const fat = parseFloat(fatValue);

    // Ensure we have valid inputs with positive values
    // CLR should be explicitly > 0, as per requirement
    if (isNaN(clr) || isNaN(fat) || clr <= 0 || fat <= 0) {
      return null;
    }

    // SNF calculation formula: SNF = (CLR / 4) + (0.20 * FAT) + 0.14
    const calculatedSnf = Math.floor(((clr / 4) + (fat * 0.20) + 0.14) * 100) / 100;

    return calculatedSnf;
  };

  // Update the calculateDerivedValues function to include rate calculations
  const calculateDerivedValues = (collection) => {
    console.log('calculateDerivedValues input:', collection);

    // Make copy of collection data to avoid mutating original
    const updatedCollection = { ...collection };

    // Convert all inputs to numbers
    const fat = parseFloat(collection.fat_percentage) || 0;
    const snf = collection.snf_percentage || 0;
    const weight = parseFloat(collection.kg) || 0;
    const rate = parseFloat(collection.milk_rate) || currentMilkRate.milk_rate || 50; // Default if not set
    const baseSnf = parseFloat(collection.base_snf_percentage) || 9.0;

    console.log('Input values for calculation:', { fat, snf, weight, rate, baseSnf });

    const liters = Math.floor((weight / 1.02249) * 100) / 100;
    updatedCollection.liters = liters;

    // Always recalculate fat_kg and snf_kg to ensure they're correct
    updatedCollection.fat_kg = Math.floor((weight * (fat / 100)) * 100) / 100;
    updatedCollection.snf_kg = Math.floor((weight * (snf / 100)) * 100) / 100;

    // Calculate fat_rate and snf_rate based on BulkCollectionV1 logic
    updatedCollection.fat_rate = Math.floor((rate * 60 / 6.5) * 100) / 100;
    updatedCollection.snf_rate = Math.floor((rate * 40 / baseSnf) * 100) / 100;

    // Calculate amount based on fat, snf rates and components
    const fatAmount = Math.floor(parseFloat(updatedCollection.fat_kg) * parseFloat(updatedCollection.fat_rate) * 100) / 100;
    const snfAmount = Math.floor(parseFloat(updatedCollection.snf_kg) * parseFloat(updatedCollection.snf_rate) * 100) / 100;
    updatedCollection.amount = Math.round((fatAmount + snfAmount) * 100) / 100;

    // Calculate solid weight
    updatedCollection.solid_weight = parseFloat((parseFloat(updatedCollection.amount) / rate).toFixed(3));

    console.log('calculateDerivedValues results:', {
      fat_kg: updatedCollection.fat_kg,
      snf_kg: updatedCollection.snf_kg,
      fat_rate: updatedCollection.fat_rate,
      snf_rate: updatedCollection.snf_rate,
      amount: updatedCollection.amount,
      solid_weight: updatedCollection.solid_weight
    });

    return updatedCollection;
  };

  const handleEditClick = (collection) => {
    console.log('Original collection data:', collection);

    // Make sure we're consistently using kg instead of weight
    const collectionWithConsistentFields = {
      ...collection,
      // Ensure kg field is set
      kg: collection.kg || collection.weight
    };

    const calculatedCollection = calculateDerivedValues(collectionWithConsistentFields);
    console.log('Processed collection data for edit form:', calculatedCollection);

    setEditingCollection(calculatedCollection);
    setEditFormErrors({});
    setShowEditModal(true);
  };

  const handleEditInputChange = (field, value) => {
    console.log(`Changing ${field} to:`, value);

    setEditingCollection(prev => {
      // First update the field value
      let updated = { ...prev, [field]: value };

      // Convert weight field to kg if used
      if (field === 'weight') {
        updated.kg = value;
        field = 'kg'; // Treat it as kg for derived calculations
      }

      // Recalculate fat_kg and snf_kg when relevant fields change
      if (['kg', 'fat_percentage', 'snf_percentage'].includes(field)) {
        const kg = parseFloat(updated.kg) || 0;
        const fatPercentage = parseFloat(updated.fat_percentage) || 0;
        const snfPercentage = parseFloat(updated.snf_percentage) || 0;

        // Update fat_kg and snf_kg based on new values
        if (field === 'kg' || field === 'fat_percentage') {
          updated.fat_kg = Math.floor((kg * (fatPercentage / 100)) * 100) / 100;
        }

        if (field === 'kg' || field === 'snf_percentage') {
          updated.snf_kg = Math.floor((kg * (snfPercentage / 100)) * 100) / 100;
        }
      }

      // Only handle CLR-based SNF calculation
      if (['clr', 'fat_percentage'].includes(field)) {
        // If updating CLR and CLR > 0, calculate SNF (unless SNF is being directly edited)
        if (field === 'clr' && parseFloat(value) > 0 && updated.fat_percentage && field !== 'snf_percentage') {
          const calculatedSnf = calculateSnfFromClr(value, updated.fat_percentage);
          if (calculatedSnf !== null) {
            console.log('Setting SNF from CLR:', calculatedSnf);
            updated.snf_percentage = calculatedSnf;

            // Also update snf_kg based on the new snf_percentage
            const kg = parseFloat(updated.kg) || 0;
            updated.snf_kg = Math.floor((kg * (calculatedSnf / 100)) * 100) / 100;
          }
        }

        // If updating fat and CLR exists with CLR > 0, recalculate SNF
        if (field === 'fat_percentage' && value && updated.clr && parseFloat(updated.clr) > 0 && field !== 'snf_percentage') {
          const calculatedSnf = calculateSnfFromClr(updated.clr, value);
          if (calculatedSnf !== null) {
            console.log('Setting SNF from CLR after fat change:', calculatedSnf);
            updated.snf_percentage = calculatedSnf;

            // Also update snf_kg based on the new snf_percentage
            const kg = parseFloat(updated.kg) || 0;
            updated.snf_kg = Math.floor((kg * (calculatedSnf / 100)) * 100) / 100;
          }
        }
      }

      return updated;
    });

    // Clear any errors for this field
    if (editFormErrors[field]) {
      setEditFormErrors(prevErrors => {
        const updatedErrors = { ...prevErrors };
        delete updatedErrors[field];
        return updatedErrors;
      });
    }
  };

  const validateEditForm = () => {
    const errors = {};

    if (!editingCollection.fat_percentage || isNaN(parseFloat(editingCollection.fat_percentage))) {
      errors.fat_percentage = 'Fat percentage is required';
    } else if (parseFloat(editingCollection.fat_percentage) <= 0) {
      errors.fat_percentage = 'Valid fat percentage is required';
    }

    if (!editingCollection.kg || isNaN(parseFloat(editingCollection.kg))) {
      errors.kg = 'Qty. is required';
    } else if (parseFloat(editingCollection.kg) <= 0) {
      errors.kg = 'Valid weight is required';
    }

    // Only validate CLR if it has a non-empty value and is not 0
    if (editingCollection.clr && editingCollection.clr !== '0' && editingCollection.clr !== 0) {
      if (isNaN(parseFloat(editingCollection.clr))) {
        errors.clr = 'CLR must be a valid number';
      }
    }

    if (!editingCollection.snf_percentage && !editingCollection.clr) {
      errors.snf_percentage = 'SNF percentage or CLR is required';
    } else if (editingCollection.snf_percentage && (isNaN(parseFloat(editingCollection.snf_percentage)) || parseFloat(editingCollection.snf_percentage) <= 0)) {
      errors.snf_percentage = 'Valid SNF percentage is required';
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!validateEditForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Handle CLR value - allow it to be 0 or null
      let clrValue = null;
      if (editingCollection.clr !== undefined && editingCollection.clr !== '') {
        clrValue = parseFloat(editingCollection.clr);
        // Make sure NaN becomes null
        if (isNaN(clrValue)) clrValue = null;
      }

      // Convert values to numbers for calculation
      const kg = parseFloat(editingCollection.kg) || 0;
      const fatPercentage = parseFloat(editingCollection.fat_percentage) || 0;
      const snfPercentage = parseFloat(editingCollection.snf_percentage) || 0;

      // Use the fat_kg and snf_kg directly from the editing collection
      // If they don't exist, fall back to calculating them
      const fatKg = parseFloat(editingCollection.fat_kg) || Math.floor((kg * (fatPercentage / 100)) * 100) / 100;
      const snfKg = parseFloat(editingCollection.snf_kg) || Math.floor((kg * (snfPercentage / 100)) * 100) / 100;

      // Prepare data for API
      const updateData = {
        customer: editingCollection.customer,
        collection_date: editingCollection.collection_date,
        collection_time: editingCollection.collection_time,
        milk_type: editingCollection.milk_type,
        kg: kg,
        fat_percentage: fatPercentage,
        snf_percentage: snfPercentage,
        clr: clrValue,
        base_snf_percentage: parseFloat(editingCollection.base_snf_percentage) || 9.0,
        // Explicitly include fat_kg and snf_kg
        fat_kg: fatKg,
        snf_kg: snfKg
      };

      // Calculate derived values to include other calculated fields
      const calculatedValues = calculateDerivedValues(updateData);

      // Add the other calculated values to the update data
      updateData.fat_rate = calculatedValues.fat_rate;
      updateData.snf_rate = calculatedValues.snf_rate;
      updateData.liters = calculatedValues.liters;

      // Include milk_rate if it exists in the editing collection
      if (editingCollection.milk_rate) {
        updateData.milk_rate = parseFloat(editingCollection.milk_rate);
        updateData.amount = calculatedValues.amount;
        updateData.solid_weight = calculatedValues.solid_weight;
        updateData.is_milk_rate = true;
      }

      console.log('Sending data to API:', updateData);
      await updateRawCollection(editingCollection.id, updateData);

      // Refresh collections
      await fetchCollectionsBasedOnFilters();

      setShowEditModal(false);
      setEditingCollection(null);
    } catch (err) {
      console.error('Error updating raw collection:', err);
      setEditFormErrors(prev => ({
        ...prev,
        form: err.message || 'Failed to update collection. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMilkRateChange = (value) => {
    // If the input is empty, don't update the calculations
    if (value === '') {
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
      // Make sure we update the milk_rate in the collection first
      const updatedCollection = {
        ...collection,
        milk_rate: numValue
      };

      // Calculate all derived values based on this new milk rate
      return calculateDerivedValues(updatedCollection);
    });

    console.log('Updated collections after milk rate change:', updatedCollections);
    setSelectedCollections(updatedCollections);
  };

  const handleApplyMilkRates = async () => {
    setIsSubmittingRates(true);
    setRatePreviewError(null);

    try {
      // Create an array to track successful updates
      const successfulUpdates = [];
      const failedUpdates = [];

      // Process each collection one by one
      for (const collection of selectedCollections) {
        try {
          // Prepare the data to be sent to the API
          const updateData = {
            milk_rate: parseFloat(currentMilkRate.milk_rate) || 0,
            fat_rate: parseFloat(collection.fat_rate) || 0,
            snf_rate: parseFloat(collection.snf_rate) || 0,
            fat_kg: parseFloat(collection.fat_kg) || 0,
            snf_kg: parseFloat(collection.snf_kg) || 0,
            amount: parseFloat(collection.amount) || 0,
            solid_weight: parseFloat(collection.solid_weight) || 0
          };

          // Call the API to update the collection
          const response = await updateRawCollection(collection.id, updateData);
          console.log(`Updated collection ${collection.id}:`, response);

          successfulUpdates.push({
            id: collection.id,
            name: collection.customer_name || 'Unknown'
          });
        } catch (error) {
          console.error(`Failed to update collection ${collection.id}:`, error);

          failedUpdates.push({
            id: collection.id,
            name: collection.customer_name || 'Unknown',
            error: error.message || 'Unknown error'
          });
        }
      }

      // Show the summary of results
      if (failedUpdates.length > 0) {
        setError(`Updated ${successfulUpdates.length} collections but failed to update ${failedUpdates.length}. Please try again later.`);
      } else {
        setError(null);
        alert(`Successfully updated ${successfulUpdates.length} collections with milk rate ${currentMilkRate.milk_rate}.`);
      }

      // Reset all filters and refresh collections
      setRatePreviewError(null);
      // eslint-disable-next-line no-undef
      setShowMilkRatePreviewModal(false);

      // Reset page to get fresh data
      setPage(1);

      // Refresh the collection data with the appropriate filters
      // Check if we need to maintain current filtering
      if (milkRateSingleDateFilterMode && milkRateSingleDate) {
        // If we were filtering by a single date for milk rates, apply that filter
        setFromDate('');
        setToDate('');
        setSingleDate(milkRateSingleDate);
        setSingleDateFilterMode(true);
        setDateFilterActive(true);

        // This will trigger the useEffect to fetch collections
      } else if (milkRateFromDate && milkRateToDate) {
        // If we were filtering by date range for milk rates, apply that filter
        setFromDate(milkRateFromDate);
        setToDate(milkRateToDate);
        setSingleDate('');
        setSingleDateFilterMode(false);
        setDateFilterActive(true);

        // This will trigger the useEffect to fetch collections
      }

      // Clear the milk rate states
      setCurrentMilkRate({ milk_rate: 50 });
      setSelectedCollections([]);
    } catch (error) {
      console.error('Error applying milk rates:', error);
      setRatePreviewError(`Failed to apply milk rates: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmittingRates(false);
    }
  };

  const calculateTotals = useCallback(() => {
    if (!filteredCollections.length) return null;

    return filteredCollections.reduce((totals, collection) => {
      // Calculate fat_kg if not present
      const fatKg = parseFloat(collection.fat_kg) ||
        (parseFloat(collection.kg || 0) * parseFloat(collection.fat_percentage || 0) / 100);

      // Calculate snf_kg if not present
      const snfKg = parseFloat(collection.snf_kg) ||
        (parseFloat(collection.kg || 0) * parseFloat(collection.snf_percentage || 0) / 100);

      // Calculate solid_weight if not present
      const solidWeight = parseFloat(collection.solid_weight) || 0;

      return {
        count: totals.count + 1,
        totalQuantity: totals.totalQuantity + (parseFloat(collection.kg || 0) || 0),
        totalFatKg: totals.totalFatKg + fatKg,
        totalSnfKg: totals.totalSnfKg + snfKg,
        totalSolidWeight: totals.totalSolidWeight + solidWeight
      };
    }, { count: 0, totalQuantity: 0, totalFatKg: 0, totalSnfKg: 0, totalSolidWeight: 0 });
  }, [filteredCollections]);

  // Add toggle sort order function
  const toggleSortOrder = () => {
    console.log(`Changing sort order from ${sortOrder} to ${sortOrder === 'desc' ? 'asc' : 'desc'} (sorting by creation time)`);
    setSortOrder(prevOrder => prevOrder === 'desc' ? 'asc' : 'desc');
  };

  // Update the load more button to be hidden when filters are active
  const showLoadMoreButton = !loading && hasMore && !dateFilterActive && !selectedCustomer;

  const openAddMilkRateModal = () => {
    // Clear any previous errors
    setRatePreviewError(null);

    // Initialize milk rate if not already set
    setCurrentMilkRate({
      milk_rate: 50
    });

    const today = new Date();

    // Initialize dates if not already set
    if (!milkRateFromDate) {
      // Default to first day of current month
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const formattedFromDate = formatDateForInput(firstDayOfMonth);
      setMilkRateFromDate(formattedFromDate);
    }

    if (!milkRateToDate) {
      const formattedToDate = formatDateForInput(today);
      setMilkRateToDate(formattedToDate);
    }

    if (!milkRateSingleDate) {
      const formattedSingleDate = formatDateForInput(today);
      setMilkRateSingleDate(formattedSingleDate);
    }

    // eslint-disable-next-line no-undef
    setShowAddMilkRateModal(true);
  };

  const handlePreviewMilkRates = async () => {
    // Validate date selection
    if (milkRateSingleDateFilterMode) {
      if (!milkRateSingleDate) {
        setRatePreviewError('Please select a date');
        return;
      }
    } else {
      if (!milkRateFromDate || !milkRateToDate) {
        setRatePreviewError('Please select both from and to dates');
        return;
      }

      try {
        const fromDateObj = new Date(milkRateFromDate);
        const toDateObj = new Date(milkRateToDate);

        // Validate date objects
        if (isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
          setRatePreviewError('Invalid date format. Please select valid dates.');
          return;
        }

        // Validate that to date is not before from date
        if (toDateObj < fromDateObj) {
          setRatePreviewError('To date cannot be earlier than from date');
          return;
        }
      } catch (error) {
        console.error('Date validation error:', error);
        setRatePreviewError('An error occurred while validating dates.');
        return;
      }
    }

    try {
      // Fetch collections for selected date range
      setIsLoadingRatePreview(true);

      // Initialize array to hold all collections
      let allCollections = [];
      let currentPage = 1;
      let hasMorePages = true;

      // Fetch all pages of data
      while (hasMorePages) {
        try {
          let params = {
            page_size: 100,  // Use a reasonable page size
            page: currentPage,
            is_milk_rate: false  // Only get collections without milk rate
          };

          // Add date parameters based on filter mode
          if (milkRateSingleDateFilterMode) {
            params.from_date = milkRateSingleDate;
            params.to_date = milkRateSingleDate;
            console.log(`Fetching raw collections for single date ${milkRateSingleDate}`);
          } else {
            params.from_date = milkRateFromDate;
            params.to_date = milkRateToDate;
            console.log(`Fetching raw collections from ${milkRateFromDate} to ${milkRateToDate}`);
          }

          console.log(`Fetching raw collections page ${currentPage} for milk rate preview`);
          const response = await getRawCollections(params);

          // Get results from current page
          const collectionsFromPage = response.results || response;

          console.log(`Received ${collectionsFromPage.length} collections on page ${currentPage}`);

          // Add to our collection array
          if (collectionsFromPage.length > 0) {
            allCollections = [...allCollections, ...collectionsFromPage];
          }

          // Check if there are more pages
          if (response.next) {
            currentPage++;
          } else {
            hasMorePages = false;
          }

          // Safety check - if the API doesn't provide next/previous, but returns an empty array
          if (collectionsFromPage.length === 0) {
            hasMorePages = false;
          }
        } catch (err) {
          console.error(`Error fetching page ${currentPage}:`, err);
          hasMorePages = false; // Stop on error
        }
      }

      console.log(`Total raw collections fetched: ${allCollections.length}`);

      if (allCollections.length === 0) {
        setRatePreviewError('No collections found for the selected date range that need milk rates added.');
        setIsLoadingRatePreview(false);
        return;
      }

      // Process collections for preview using calculateDerivedValues
      const processedCollections = allCollections.map(collection => {
        // Ensure we have numeric values for all needed fields
        const cleanCollection = {
          ...collection,
          fat_percentage: parseFloat(collection.fat_percentage) || 0,
          snf_percentage: parseFloat(collection.snf_percentage) || 0,
          kg: parseFloat(collection.kg) || 0,
          milk_rate: currentMilkRate.milk_rate,
          base_snf_percentage: parseFloat(collection.base_snf_percentage) || 9.0,
          clr: parseFloat(collection.clr) || 0
        };

        // Use calculateDerivedValues to get all calculated fields
        const calculatedCollection = calculateDerivedValues(cleanCollection);

        // Ensure calculatedCollection has all necessary fields
        if (!calculatedCollection.fat_kg || !calculatedCollection.snf_kg) {
          console.error('Missing calculated values for collection:', calculatedCollection);
        }

        return calculatedCollection;
      });

      console.log('First processed collection details:',
        JSON.stringify(processedCollections[0], null, 2)
      );

      setSelectedCollections(processedCollections);
      // eslint-disable-next-line no-undef
      setShowAddMilkRateModal(false);
      // eslint-disable-next-line no-undef
      setShowMilkRatePreviewModal(true);
    } catch (err) {
      console.error('Error fetching collections for milk rate preview:', err);
      setRatePreviewError('Failed to load collections. Please try again later.');
    } finally {
      setIsLoadingRatePreview(false);
    }
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
      setDeleteError('Invalid collection selected for deletion');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteRawCollection(collectionToDelete.id);

      // Close the delete confirmation modal
      setShowDeleteConfirmation(false);
      setCollectionToDelete(null);

      // Refresh the collections to update the UI
      fetchCollectionsBasedOnFilters();

      // Show a success toast message
      toast.success('Collection deleted successfully');
    } catch (err) {
      console.error('Error deleting collection:', err);
      setDeleteError(err.message || 'Failed to delete the collection. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Add function to open customer selection modal for editing
  const openEditCustomerModal = async () => {
    setShowEditCustomerModal(true);
    setEditCustomerSearchTerm('');

    try {
      setLoadingCustomers(true);
      const response = await getCustomers();
      if (response && (response.results || Array.isArray(response))) {
        const customerData = response.results || response;

        // Ensure every customer has all the id fields we might need
        const processedCustomers = customerData.map(customer => ({
          ...customer,
          id: customer.id,
          customer_id: customer.customer_id || customer.id,
          name: customer.name
        }));

        console.log('Processed customer data for edit:', processedCustomers[0]);
        setCustomers(processedCustomers);
        setEditFilteredCustomers(processedCustomers);
      } else {
        console.error('Unexpected response format from getCustomers:', response);
        setError('Failed to load customers: Unexpected response format');
      }
    } catch (err) {
      console.error('Error fetching customers for edit:', err);
      setError('Failed to load customers. Please try again later.');
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Add function to handle customer search in edit modal
  const handleEditCustomerSearchChange = (e) => {
    const searchText = e.target.value;
    setEditCustomerSearchTerm(searchText);

    if (searchText.trim()) {
      const filtered = customers.filter(customer =>
        (customer.name && customer.name.toLowerCase().includes(searchText.toLowerCase())) ||
        (customer.customer_id && customer.customer_id.toString().includes(searchText))
      );
      setEditFilteredCustomers(filtered);
    } else {
      setEditFilteredCustomers(customers);
    }
  };

  // Add function to select customer in edit form
  const selectEditCustomer = (customer) => {
    console.log('Selected customer for editing:', JSON.stringify(customer, null, 2));

    // Make sure we have all necessary customer details
    if (!customer.id) {
      console.error('Warning: Customer object does not have an ID property:', customer);
    }

    if (!customer.name) {
      console.error('Warning: Customer object does not have a name property:', customer);
    }

    // Update the editing collection with new customer information
    setEditingCollection(prev => ({
      ...prev,
      customer: customer.id,
      customer_id: customer.customer_id || customer.id,
      customer_name: customer.name || 'Unknown Customer'
    }));

    setShowEditCustomerModal(false);
  };

  return (
    <div className="collections-container">
      <div className="collections-header">
        <div className="header-left">
          <Link to="/dashboard" className="back-button">
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Dashboard</span>
          </Link>
        </div>
        <h1>Raw Milk Collections</h1>
        <div className="header-right">
          <button className="logout-button" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="collections-content">
        <div className="collections-search">
          <div className="search-wrapper">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search by customer name or ID..."
              className="search-input"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <FontAwesomeIcon
                icon={faTimes}
                className="clear-search-icon"
                onClick={clearSearch}
              />
            )}
          </div>
        </div>

        <div className="collections-filters">
          <div className="filter-options">
            <button
              className="filter-button customer-filter-button"
              onClick={openCustomerModal}
            >
              <FontAwesomeIcon icon={faUserAlt} />
              <span>Filter by Customer</span>
            </button>

            <button
              className="filter-button date-filter-button"
              onClick={openDateFilterModal}
            >
              <FontAwesomeIcon icon={faCalendarAlt} />
              <span>Filter by Date</span>
            </button>

            {/* Add a Sort Order button */}
            <button
              className="filter-button sort-order-button"
              onClick={toggleSortOrder}
              title={sortOrder === 'desc' ? 'Newest first by creation time (Change to oldest first)' : 'Oldest first by creation time (Change to newest first)'}
            >
              <FontAwesomeIcon icon={sortOrder === 'desc' ? faSortAmountDown : faSortAmountUp} />
              <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>

            {/* Add Milk Rate button */}
            <button
              className="add-milk-rate-button"
              onClick={openAddMilkRateModal}
              style={{ marginLeft: 'auto' }}
            >
              Add Milk Rate
            </button>
          </div>

          {(selectedCustomer || dateFilterActive) && (
            <div className="filters-summary">
              <p>
                <strong>Active Filters:</strong>{' '}
                {selectedCustomer && dateFilterActive
                  ? singleDateFilterMode
                    ? `Showing collections for ${selectedCustomer.name} on ${formatDateForDisplay(singleDate)}`
                    : `Showing collections for ${selectedCustomer.name} from ${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)}`
                  : selectedCustomer
                    ? `Showing collections for ${selectedCustomer.name}`
                    : dateFilterActive
                      ? singleDateFilterMode
                        ? `Showing all collections on ${formatDateForDisplay(singleDate)}`
                        : `Showing all collections from ${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)}`
                      : ''}
                {' • '}
                <span title="Current sort order">
                  Sorting: <strong>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</strong> by creation time
                </span>
              </p>
            </div>
          )}

          {/* Show sort order info even when no other filters are active */}
          {!selectedCustomer && !dateFilterActive && filteredCollections.length > 0 && (
            <div className="filters-summary">
              <p>
                <span title="Current sort order">
                  <strong>Sorting:</strong> {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'} by creation time
                </span>
              </p>
            </div>
          )}

          {selectedCustomer && (
            <button
              className="clear-filter-button"
              onClick={clearCustomerFilter}
              title="Clear customer filter"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}

          {dateFilterActive && (
            <div className="active-filter">
              <span>
                {singleDateFilterMode
                  ? `Date: ${formatDateForDisplay(singleDate)}`
                  : `Date: ${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)}`}
              </span>
              <button
                className="clear-filter-button"
                onClick={clearDateFilter}
                title="Clear date filter"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        {loading && page === 1 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading raw collections...</p>
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="no-collections">
            <p>
              No collections found
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedCustomer && ` for customer "${selectedCustomer.name}"`}
              {dateFilterActive && singleDateFilterMode
                ? ` on ${formatDateForDisplay(singleDate)}`
                : dateFilterActive
                  ? ` between ${formatDateForDisplay(fromDate)} and ${formatDateForDisplay(toDate)}`
                  : ''}.
            </p>
          </div>
        ) : (
          <div className="collections-table-container">
            <table className="collections-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date & Time</th>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Qty.</th>
                  <th>Fat %</th>
                  <th>SNF %</th>
                  <th>CLR</th>
                  <th>Base SNF %</th>
                  <th>Animal</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCollections.map((collection, index) => (
                  <tr key={collection.id}>
                    <td>{index + 1}</td>
                    <td>{formatDate(collection.collection_date, collection.collection_time)}</td>
                    <td>{collection.customer_id}</td>
                    <td>
                      {collection.customer_name || 'Unknown'}
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
                      {collection.clr ? formatNumber(collection.clr) : 'N/A'}
                    </td>
                    <td>{formatNumber(collection.base_snf_percentage)}</td>
                    <td>
                      {collection.milk_type === 'cow' ? 'Cow' :
                        collection.milk_type === 'buffalo' ? 'Buffalo' :
                          'Cow+Buffalo'}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="edit-button"
                        onClick={() => handleEditClick(collection)}
                        title="Edit this collection"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteClick(collection)}
                        title="Delete this collection"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Show Total Qty whenever there are collections to display */}
        {filteredCollections.length > 0 && (
          <div className="collection-summary-stats" style={{ marginTop: '15px', backgroundColor: '#f0f7ff', border: '1px solid #d0e5ff', borderRadius: '4px' }}>
            <div className="stats-container" style={{ padding: '0' }}>
              {(() => {
                const totals = calculateTotals();
                if (!totals) return null;

                return (
                  <span className="stat-item" style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'right',
                    padding: '12px 20px',
                    backgroundColor: 'transparent',
                    color: '#0366d6',
                    fontWeight: '500',
                    fontSize: '18px'
                  }}>
                    <strong style={{ marginRight: '8px', fontSize: '18px' }}>Total Qty:</strong>
                    {formatNumber(totals.totalQuantity)}
                    <span style={{ marginLeft: '3px', fontSize: '16px', color: '#666' }}>kg</span>
                  </span>
                );
              })()}
            </div>
          </div>
        )}

        {showLoadMoreButton && (
          <div className="load-more-container">
            <button className="load-more-button" onClick={loadMoreCollections} disabled={loading}>
              {loading && page > 1 ? (
                <>
                  <div className="spinner"></div>
                  <span>Loading...</span>
                </>
              ) : (
                'Load More'
              )}
            </button>
          </div>
        )}
      </div>

      {showCustomerModal && (
        <div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
          <div className="modal-content customer-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Customer</h2>
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
                <div className="loading-container" style={{ padding: '40px 20px' }}>
                  <div className="spinner"></div>
                  <p>Loading customers...</p>
                </div>
              ) : customerSearchTerm.trim() ? (
                filteredCustomers.length > 0 ? (
                  filteredCustomers.map(customer => (
                    <div
                      key={customer.id}
                      className="customer-item"
                      onClick={() => selectCustomer(customer)}
                    >
                      <div className="customer-name">{customer.name}</div>
                      {customer.customer_id && (
                        <div className="customer-code">ID: {customer.customer_id}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-customers">No customers found matching "{customerSearchTerm}"</div>
                )
              ) : (
                filteredCustomers.map(customer => (
                  <div
                    key={customer.id}
                    className="customer-item"
                    onClick={() => selectCustomer(customer)}
                  >
                    <div className="customer-name">{customer.name}</div>
                    {customer.customer_id && (
                      <div className="customer-code">ID: {customer.customer_id}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showDateFilterModal && (
        <div className="modal-overlay" onClick={() => setShowDateFilterModal(false)}>
          <div className="modal-content date-filter-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Filter by Date</h2>
              <button
                className="modal-close-button"
                onClick={() => setShowDateFilterModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="date-filter-container">
              {error && (
                <div className="edit-form-error" style={{ marginBottom: '15px' }}>{error}</div>
              )}

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
                  <span>Date Range</span>
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
                  <span>Single Date</span>
                </label>
              </div>

              {singleDateFilterMode ? (
                <div className="date-input-group">
                  <label htmlFor="single-date">Select Date</label>
                  <input
                    id="single-date"
                    type="date"
                    className="date-input"
                    value={singleDate}
                    onChange={e => setSingleDate(e.target.value)}
                    required
                    onClick={(e) => e.target.showPicker()}
                  />
                </div>
              ) : (
                <>
                  <div className="date-input-group">
                    <label htmlFor="from-date">From Date</label>
                    <input
                      id="from-date"
                      type="date"
                      className="date-input"
                      value={fromDate}
                      onChange={e => setFromDate(e.target.value)}
                      required
                      onClick={(e) => e.target.showPicker()}
                    />
                  </div>

                  <div className="date-input-group">
                    <label htmlFor="to-date">To Date</label>
                    <input
                      id="to-date"
                      type="date"
                      className="date-input"
                      value={toDate}
                      onChange={e => setToDate(e.target.value)}
                      required
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
                  Cancel
                </button>
                <button
                  className="date-filter-button primary"
                  onClick={applyDateFilter}
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingCollection && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content edit-collection-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Raw Collection</h2>
              <button
                className="modal-close-button"
                onClick={() => setShowEditModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="edit-collection-container">
              {editFormErrors.form && (
                <div className="edit-form-error">{editFormErrors.form}</div>
              )}

              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label>Customer</label>
                  <div className="customer-select-container">
                    <input
                      type="text"
                      className="edit-form-input"
                      value={editingCollection.customer_name || ''}
                      readOnly
                    />
                    <button
                      className="customer-select-button"
                      type="button"
                      onClick={openEditCustomerModal}
                    >
                      <FontAwesomeIcon icon={faUser} />
                      <span>Change</span>
                    </button>
                  </div>
                </div>

                <div className="edit-form-group">
                  <label>Collection Date</label>
                  <input
                    type="date"
                    className="edit-form-input"
                    value={editingCollection.collection_date || ''}
                    onChange={e => handleEditInputChange('collection_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label>Collection Time</label>
                  <select
                    className="edit-form-input"
                    value={editingCollection.collection_time || 'morning'}
                    onChange={e => handleEditInputChange('collection_time', e.target.value)}
                  >
                    <option value="morning">Morning (AM)</option>
                    <option value="evening">Evening (PM)</option>
                  </select>
                </div>

                <div className="edit-form-group">
                  <label>Animal Type</label>
                  <select
                    className="edit-form-input"
                    value={editingCollection.milk_type || 'cow'}
                    onChange={e => handleEditInputChange('milk_type', e.target.value)}
                  >
                    <option value="cow">Cow</option>
                    <option value="buffalo">Buffalo</option>
                    <option value="cow_buffalo">Cow + Buffalo</option>
                  </select>
                </div>
              </div>

              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label>Qty.</label>
                  <input
                    type="number"
                    className={`edit-form-input ${editFormErrors.kg ? 'error' : ''}`}
                    value={editingCollection.kg || ''}
                    onChange={e => handleEditInputChange('kg', e.target.value)}
                    step="0.1"
                    min="0"
                  />
                  {editFormErrors.kg && (
                    <div className="edit-input-error">{editFormErrors.kg}</div>
                  )}
                </div>

                <div className="edit-form-group">
                  <label>Fat %</label>
                  <input
                    type="number"
                    className={`edit-form-input ${editFormErrors.fat_percentage ? 'error' : ''}`}
                    value={editingCollection.fat_percentage || ''}
                    onChange={e => handleEditInputChange('fat_percentage', e.target.value)}
                    step="0.1"
                    min="0"
                  />
                  {editFormErrors.fat_percentage && (
                    <div className="edit-input-error">{editFormErrors.fat_percentage}</div>
                  )}
                </div>
              </div>

              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label>SNF %</label>
                  <input
                    type="number"
                    className={`edit-form-input ${editFormErrors.snf_percentage ? 'error' : ''}`}
                    value={editingCollection.snf_percentage !== undefined ? editingCollection.snf_percentage : ''}
                    onChange={e => handleEditInputChange('snf_percentage', e.target.value)}
                    step="0.01"
                    min="0"
                  />
                  {editFormErrors.snf_percentage && (
                    <div className="edit-input-error">{editFormErrors.snf_percentage}</div>
                  )}
                </div>

                <div className="edit-form-group">
                  <label>CLR</label>
                  <input
                    type="number"
                    className={`edit-form-input ${editFormErrors.clr ? 'error' : ''}`}
                    value={editingCollection.clr || ''}
                    onChange={e => handleEditInputChange('clr', e.target.value)}
                    step="0.01"
                    min="0"
                  />
                  {editFormErrors.clr && (
                    <div className="edit-input-error">{editFormErrors.clr}</div>
                  )}
                </div>
              </div>

              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label>Base SNF %</label>
                  <input
                    type="number"
                    className="edit-form-input"
                    value={editingCollection.base_snf_percentage || '9.0'}
                    onChange={e => handleEditInputChange('base_snf_percentage', e.target.value)}
                    step="0.1"
                    min="0"
                  />
                </div>
              </div>

              <div className="edit-form-actions">
                <button
                  className="edit-form-button cancel"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  className="edit-form-button save"
                  onClick={handleSaveEdit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="button-spinner"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Milk Rate Modal */}
      {/* eslint-disable-next-line no-undef */}
      {showAddMilkRateModal && (
        // eslint-disable-next-line no-undef
        <div className="modal-overlay" onClick={() => setShowAddMilkRateModal(false)}>
          <div className="modal-content date-filter-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Milk Rate - Select Date</h2>
              <button
                className="modal-close-button"
                // eslint-disable-next-line no-undef
                onClick={() => setShowAddMilkRateModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="date-filter-container">
              {ratePreviewError && (
                <div className="edit-form-error" style={{ marginBottom: '15px' }}>{ratePreviewError}</div>
              )}

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
                  <span>Date Range</span>
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
                  <span>Single Date</span>
                </label>
              </div>

              {milkRateSingleDateFilterMode ? (
                <div className="date-input-group">
                  <label htmlFor="milk-rate-single-date">Select Date</label>
                  <input
                    id="milk-rate-single-date"
                    type="date"
                    className="date-input"
                    value={milkRateSingleDate}
                    onChange={e => setMilkRateSingleDate(e.target.value)}
                    required
                    onClick={(e) => e.target.showPicker()}
                  />
                </div>
              ) : (
                <>
                  <div className="date-input-group">
                    <label htmlFor="milk-rate-from-date">From Date</label>
                    <input
                      id="milk-rate-from-date"
                      type="date"
                      className="date-input"
                      value={milkRateFromDate}
                      onChange={e => setMilkRateFromDate(e.target.value)}
                      required
                      onClick={(e) => e.target.showPicker()}
                    />
                  </div>

                  <div className="date-input-group">
                    <label htmlFor="milk-rate-to-date">To Date</label>
                    <input
                      id="milk-rate-to-date"
                      type="date"
                      className="date-input"
                      value={milkRateToDate}
                      onChange={e => setMilkRateToDate(e.target.value)}
                      required
                      onClick={(e) => e.target.showPicker()}
                    />
                  </div>
                </>
              )}

              <div className="date-filter-actions">
                <button
                  className="date-filter-button secondary"
                  // eslint-disable-next-line no-undef
                  onClick={() => setShowAddMilkRateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="date-filter-button primary"
                  onClick={handlePreviewMilkRates}
                  disabled={isLoadingRatePreview}
                >
                  {isLoadingRatePreview ? (
                    <>
                      <div className="button-spinner"></div>
                      Loading...
                    </>
                  ) : (
                    'Next'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* eslint-disable-next-line no-undef */}
      {showMilkRatePreviewModal && (
        // eslint-disable-next-line no-undef
        <div className="modal-overlay" onClick={() => setShowMilkRatePreviewModal(false)}>
          <div className="modal-content preview-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Preview Milk Rate Calculations</h2>
              <button
                className="modal-close-button"
                // eslint-disable-next-line no-undef
                onClick={() => setShowMilkRatePreviewModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              {ratePreviewError && (
                <div className="edit-form-error" style={{ marginBottom: '15px' }}>{ratePreviewError}</div>
              )}

              <div className="preview-header">
                <h3 style={{ marginBottom: '2px' }}>
                  {milkRateSingleDateFilterMode
                    ? `Collections on ${formatDateForDisplay(milkRateSingleDate)}`
                    : `Collections from ${formatDateForDisplay(milkRateFromDate)} to ${formatDateForDisplay(milkRateToDate)}`}
                  <span className="collections-count">{selectedCollections.length} items</span>
                </h3>

                <div className="rate-settings" style={{ marginTop: '1px' }}>
                  <div className="rate-input-group">
                    <label>Milk Rate</label>
                    <input
                      type="number"
                      className="rate-input"
                      placeholder="e.g: 50"
                      onChange={e => handleMilkRateChange(e.target.value)}
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Customer</th>
                      <th>Qty.</th>
                      <th>Fat %</th>
                      <th>SNF %</th>
                      <th>CLR</th>
                      <th>Fat Kg</th>
                      <th>SNF Kg</th>
                      <th>Fat Rate</th>
                      <th>SNF Rate</th>
                      <th>Milk Rate</th>
                      <th>Base SNF</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCollections.map((collection, index) => {
                      // Double-check calculation of values
                      // eslint-disable-next-line no-unused-vars
                      const fatKg = parseFloat(collection.fat_kg) ||
                        (parseFloat(collection.kg) * parseFloat(collection.fat_percentage) / 100);

                      // eslint-disable-next-line no-unused-vars
                      const snfKg = parseFloat(collection.snf_kg) ||
                        (parseFloat(collection.kg) * parseFloat(collection.snf_percentage) / 100);

                      return (
                        <tr key={collection.id}>
                          <td>{formatDate(collection.collection_date, collection.collection_time)}</td>
                          <td style={{ textAlign: 'center' }}>
                            {collection.customer_name || 'Unknown'}
                            <div style={{ fontSize: '13px', color: '#666' }}>ID: {collection.customer_id}</div>
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
                            {collection.clr ? formatNumber(collection.clr) : 'N/A'}
                          </td>
                          <td>{formatNumber(collection.fat_kg)}</td>
                          <td>{formatNumber(collection.snf_kg)}</td>
                          <td>{formatNumber(collection.fat_rate)}</td>
                          <td>{formatNumber(collection.snf_rate)}</td>
                          <td>{formatNumber(collection.milk_rate)}</td>
                          <td>{formatNumber(collection.base_snf_percentage)}</td>
                          <td>{formatCurrency(collection.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="2"><strong>Totals</strong></td>
                      <td>{formatNumber(selectedCollections.reduce((sum, c) => sum + parseFloat(c.kg || 0), 0))}</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td>{formatNumber(selectedCollections.reduce((sum, c) => {
                        const fatKg = parseFloat(c.fat_kg) ||
                          (parseFloat(c.kg) * parseFloat(c.fat_percentage) / 100);
                        return sum + fatKg;
                      }, 0))}</td>
                      <td>{formatNumber(selectedCollections.reduce((sum, c) => {
                        const snfKg = parseFloat(c.snf_kg) ||
                          (parseFloat(c.kg) * parseFloat(c.snf_percentage) / 100);
                        return sum + snfKg;
                      }, 0))}</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td>{formatCurrency(selectedCollections.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="preview-summary" style={{
                marginBottom: '0px',
                padding: '20px',
                borderRadius: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}>
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '8px 15px',
                  borderBottom: '1px solid #e9ecef',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{ margin: '0', fontSize: '14px', color: '#495057' }}>Collection Summary</h3>
                  <span style={{ marginLeft: '10px', fontSize: '14px', color: '#181818' }}>{selectedCollections.length} items</span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: '#fff'
                }}>
                  <div className="summary-card" style={{
                    padding: '8px 10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    borderLeft: '3px solid #28a745'
                  }}>
                    <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '2px' }}>Weight</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#212529' }}>
                      {formatNumber(selectedCollections.reduce((sum, c) => sum + parseFloat(c.kg || 0), 0))} kg
                    </div>
                  </div>

                  <div className="summary-card" style={{
                    padding: '8px 10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    borderLeft: '3px solid #fd7e14'
                  }}>
                    <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '2px' }}>Fat</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#212529' }}>
                      {formatNumber(selectedCollections.reduce((sum, c) => {
                        const fatKg = parseFloat(c.fat_kg) ||
                          (parseFloat(c.kg) * parseFloat(c.fat_percentage) / 100);
                        return sum + fatKg;
                      }, 0))} kg
                    </div>
                  </div>

                  <div className="summary-card" style={{
                    padding: '8px 10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    borderLeft: '3px solid #17a2b8'
                  }}>
                    <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '2px' }}>SNF</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#212529' }}>
                      {formatNumber(selectedCollections.reduce((sum, c) => {
                        const snfKg = parseFloat(c.snf_kg) ||
                          (parseFloat(c.kg) * parseFloat(c.snf_percentage) / 100);
                        return sum + snfKg;
                      }, 0))} kg
                    </div>
                  </div>

                  <div className="summary-card" style={{
                    padding: '8px 10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    borderLeft: '3px solid #6f42c1'
                  }}>
                    <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '2px' }}>Solid</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#212529' }}>
                      {formatNumber(selectedCollections.reduce((sum, c) =>
                        sum + parseFloat(c.solid_weight || 0), 0))} kg
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '10px 15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  backgroundColor: '#f8f9fa',
                  borderTop: '1px solid #e9ecef',
                }}>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6c757d' }}>Total Amount</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#212529' }}>
                        {formatCurrency(selectedCollections.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0))}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#155724' }}>Final Amount</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#155724' }}>
                        {formatCurrency(Math.floor(selectedCollections.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) * 0.999))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                // eslint-disable-next-line no-undef
                onClick={() => setShowMilkRatePreviewModal(false)}
              >
                Cancel
              </button>

              <button
                className="confirm-button"
                onClick={handleApplyMilkRates}
                disabled={isSubmittingRates}
              >
                {isSubmittingRates ? (
                  <>
                    <div className="button-spinner"></div>
                    Applying...
                  </>
                ) : (
                  'Apply Milk Rates'
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      <footer className="collections-footer">
        <p>&copy; 2025 Dudhiya. All rights reserved.</p>
        <img src="/Powered-By-Netpy-Technologies.png" style={{ width: '170px' }} alt="Powered by Netpy Technologies" />
      </footer>

      {/* Add the delete confirmation modal */}
      {showDeleteConfirmation && collectionToDelete && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
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
              <p>Are you sure you want to delete this collection?</p>
              <div className="collection-delete-info">
                <p><strong>Customer:</strong> {collectionToDelete.customer_name}</p>
                <p><strong>Date:</strong> {formatDateForDisplay(collectionToDelete.collection_date)}</p>
                <p><strong>Time:</strong> {collectionToDelete.collection_time === 'morning' ? 'Morning' : 'Evening'}</p>
                <p><strong>Weight:</strong> {formatNumber(collectionToDelete.kg)} kg</p>
              </div>
              <p className="warning-text">This action cannot be undone.</p>
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
                Cancel
              </button>
              <button
                className="delete-button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="button-spinner"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add customer selection modal for edit form */}
      {showEditCustomerModal && (
        <div className="modal-overlay" onClick={() => setShowEditCustomerModal(false)}>
          <div className="modal-content customer-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Customer</h2>
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
                <div className="loading-container" style={{ padding: '40px 20px' }}>
                  <div className="spinner"></div>
                  <p>Loading customers...</p>
                </div>
              ) : editCustomerSearchTerm.trim() ? (
                editFilteredCustomers.length > 0 ? (
                  editFilteredCustomers.map(customer => (
                    <div
                      key={customer.id}
                      className="customer-item"
                      onClick={() => selectEditCustomer(customer)}
                    >
                      <div className="customer-name">{customer.name}</div>
                      {customer.customer_id && (
                        <div className="customer-code">ID: {customer.customer_id}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-customers">No customers found matching "{editCustomerSearchTerm}"</div>
                )
              ) : (
                editFilteredCustomers.map(customer => (
                  <div
                    key={customer.id}
                    className="customer-item"
                    onClick={() => selectEditCustomer(customer)}
                  >
                    <div className="customer-name">{customer.name}</div>
                    {customer.customer_id && (
                      <div className="customer-code">ID: {customer.customer_id}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default PreviewRawCollections; 