import axios from 'axios';
import { getToken, removeToken } from './tokenStorage';

// Development mode flag - set to true to bypass OTP
export const DEV_MODE = false;

// API Base path - now using a relative URL which will work with the proxy in package.json
const BASE_URL = process.env.REACT_APP_API_BASE_URL || "/api";

// API Endpoints
const ENDPOINTS = {
  LOGIN: '/login/',
  USER_INFO: '/user-info/',
  CUSTOMERS: '/collector/customers/',
  COLLECTIONS: '/collector/collections/',
  ANIMALS: '/collector/animals/',
  MARKET_PRICES: '/collector/market-milk-prices/',
  DAIRY_INFO: '/collector/dairy-information/',
  WALLET: '/wallet/',
  WALLET_ADD_MONEY: '/wallet/add_money/',  // for creating payment links
  WALLET_TRANSACTIONS: '/wallet/transactions/',  // for fetching wallet transactions
  TRANSACTIONS: '/transactions/',   // for general transactions management
  RAW_COLLECTIONS: '/collector/raw-collections/',
  PRO_RATA_RATE_CHART: '/collector/pro-rata-rate-chart/',
  // Standard Collection Report Endpoints
  PURCHASE_REPORT_JSON: '/collector/collections/purchase_report/',
  PURCHASE_SUMMARY_JSON: '/collector/collections/purchase-summary-report/',
  GENERATE_PURCHASE_REPORT: '/collector/collections/generate_purchase_report/',
  GENERATE_PURCHASE_SUMMARY_REPORT: '/collector/collections/generate_purchase_summary_report/',
  GENERATE_FULL_REPORT: '/collector/collections/generate_full_report/',
  GENERATE_FULL_CUSTOMER_REPORT: '/collector/collections/generate_full_customer_report/',
  GENERATE_CUSTOMER_REPORT: '/collector/collections/generate_customer_report/',
  // Pro-Rata Report Endpoints
  PRO_RATA_PURCHASE_REPORT: '/collector/pro-rata-reports/purchase-report/',
  PRO_RATA_PURCHASE_SUMMARY_REPORT: '/collector/pro-rata-reports/purchase-summary-report/',
  PRO_RATA_FULL_REPORT: '/collector/pro-rata-reports/full-report/',
  PRO_RATA_CUSTOMER_BILLS: '/collector/pro-rata-reports/customer-bills/',
  PRO_RATA_CUSTOMER_REPORT: '/collector/pro-rata-reports/customer-report/',
  PRO_RATA_PURCHASE_SUMMARY_DATA: '/collector/pro-rata-reports/purchase-summary-data/',
  // Supplier Bills Endpoints (using customers as suppliers for now)
  SUPPLIERS: '/collector/customers/',
  SUPPLIER_BILLS: '/collector/supplier-bills/',
  GENERATE_SUPPLIER_BILLS: '/collector/supplier-bills/generate/',
};

// Create axios instance with optimized settings
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add authorization token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle common response errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle CORS errors specifically
    if (error.message === 'Network Error' || !error.response) {
      console.error('Network Error Details:', error);
      // Create a more helpful error message for debugging
      let errorMessage = 'Network connection error. Please check your internet connection.';

      // If we're in development, provide more detailed information
      if (DEV_MODE) {
        errorMessage += ' This might be a CORS issue or certificate problem.';
      }

      return Promise.reject({
        error: errorMessage
      });
    }

    switch (error.response.status) {
      case 401: {
        // Handle unauthorized - clear token and return to login
        // But do NOT force-redirect if user is on public landing routes
        const pathname = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
        const onPublicLanding = pathname === '/' || pathname.startsWith('/landing_page');
        if (!onPublicLanding) {
          removeToken();
          window.location.href = '/login';
        }
        return Promise.reject({
          error: 'Your session has expired. Please login again.'
        });
      }
      case 404:
        return Promise.reject({
          error: 'The requested resource was not found.'
        });
      case 500:
        return Promise.reject({
          error: 'Server error. Please try again later.'
        });
      default:
        return Promise.reject(error.response?.data || {
          error: `Network error occurred (${error.response?.status || 'unknown'})`
        });
    }
  }
);

// Authentication APIs
export const loginUser = async (phoneNumber) => {
  try {
    console.log('Login attempt:', {
      endpoint: ENDPOINTS.LOGIN,
      fullUrl: `${BASE_URL}${ENDPOINTS.LOGIN}`,
      phoneNumber: phoneNumber.replace('+91', '')
    });

    const response = await api.post(ENDPOINTS.LOGIN, {
      phone_number: phoneNumber.replace('+91', '') // Remove +91 prefix if present
    });

    console.log('Login response:', response);
    return response.data;
  } catch (error) {
    console.error('Login API Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
};

// OTP verification API (second step of login)
// Tries the canonical verify endpoint. Backend should respond with a token on success.
export const verifyOtp = async (phoneNumber, otpCode, options = {}) => {
  try {
    const payload = {
      phone_number: phoneNumber.replace('+91', ''),
      otp: String(otpCode).trim(),
    };
    // Attach optional session identifiers if backend provides them
    if (options.session_id) payload.session_id = options.session_id;
    if (options.transaction_id) payload.transaction_id = options.transaction_id;
    // Some backends require a verificationId from step 1
    if (options.verificationId) payload.verificationId = options.verificationId;
    // For compatibility with backends expecting 'code' instead of 'otp'
    payload.code = payload.otp;

    const response = await api.post('/verify-otp/', payload);
    return response.data;
  } catch (error) {
    // Surface a friendlier message if the verify endpoint is not found
    if (error?.response?.status === 404) {
      console.error('OTP verify endpoint not found at /verify-otp/.');
    }
    console.error('Verify OTP API Error:', error);
    throw error;
  }
};

export const loginWithPassword = async (phoneNumber, password) => {
  try {
    const response = await api.post('/login/password/', {
      phone_number: phoneNumber.replace('+91', ''),
      password: password
    });
    return response.data;
  } catch (error) {
    console.error('Password Login API Error:', error);
    throw error;
  }
};

export const registerUser = async (fullName, phoneNumber, password) => {
  try {
    const response = await api.post('/register/', {
      full_name: fullName,
      phone_number: phoneNumber.replace('+91', ''),
      password: password
    });
    return response.data;
  } catch (error) {
    console.error('Register API Error:', error);
    throw error;
  }
};

export const getUserInfo = async () => {
  try {
    const response = await api.get(ENDPOINTS.USER_INFO);
    return response.data;
  } catch (error) {
    console.error('Error getting user info:', error);
    throw error;
  }
};

// Customer APIs
export const getCustomers = async (params = {}) => {
  try {
    // Create params with pagination bypass to get ALL customers
    const queryParams = {
      fetch_all: true,
      page_size: 10000,
      limit: 10000,
      no_pagination: true,
      ...params // Merge with any provided params
    };

    // Log explicit attempt to bypass limits
    console.log('BYPASSING PAGINATION LIMITS: Fetching ALL customers');
    console.log('Filter params:', queryParams);

    const response = await api.get(ENDPOINTS.CUSTOMERS, { params: queryParams });

    // Log details of what we received
    if (response.data) {
      const dataCount = response.data.results?.length || (Array.isArray(response.data) ? response.data.length : 0);
      console.log(`Received ${dataCount} customers from API`);
      console.log(`Response type: ${Array.isArray(response.data) ? 'Array' : 'Object with results'}`);

      if (response.data.next) {
        console.warn('WARNING: There are more customers available - increase page_size!');
      }
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

// Create customer API
export const createCustomer = async (customerData) => {
  try {
    // Validate phone number if provided
    if (customerData.phone && !/^\d{10}$/.test(customerData.phone)) {
      throw new Error('Phone number must be exactly 10 digits');
    }

    const response = await api.post(ENDPOINTS.CUSTOMERS, customerData);
    return response.data;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

// Update customer API
export const updateCustomer = async (customerId, customerData) => {
  try {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    // Validate phone number if provided
    if (customerData.phone && !/^\d{10}$/.test(customerData.phone)) {
      throw new Error('Phone number must be exactly 10 digits');
    }

    const response = await api.patch(`${ENDPOINTS.CUSTOMERS}${customerId}/`, customerData);
    return response.data;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

// Market price API
export const getCurrentMarketPrice = async () => {
  try {
    const response = await api.get(ENDPOINTS.MARKET_PRICES);
    return response.data;
  } catch (error) {
    console.error('Error fetching market price:', error);
    throw error;
  }
};

// Update market price API
export const updateMarketPrice = async (price) => {
  try {
    // Validate that price is a positive number
    if (isNaN(price) || price < 0) {
      throw new Error('Price must be a positive number');
    }

    const response = await api.post(ENDPOINTS.MARKET_PRICES, { price });
    return response.data;
  } catch (error) {
    console.error('Error updating market price:', error);
    throw error;
  }
};

// Collection APIs
export const getCollections = async (params = {}) => {
  try {
    const response = await api.get(ENDPOINTS.COLLECTIONS, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
};

// Animal APIs
export const getAnimals = async () => {
  try {
    const response = await api.get(ENDPOINTS.ANIMALS);
    return response.data;
  } catch (error) {
    console.error('Error fetching animals:', error);
    throw error;
  }
};

// Get collections filtered by date range
export const getCollectionsByDateRange = async (dateFrom, dateTo, ordering = null, params = {}) => {
  try {
    // Create params with EXPLICIT instructions to bypass all pagination
    const queryParams = {
      date_from: dateFrom,
      date_to: dateTo,
      fetch_all: true,
      page_size: 10000,
      limit: 10000,
      no_pagination: true
    };

    // Add ordering parameter if provided
    if (ordering) {
      queryParams.ordering = ordering;
    }

    // Add any additional params
    Object.assign(queryParams, params);

    // Log explicit attempt to bypass limits
    console.log('BYPASSING PAGINATION LIMITS: Fetching ALL collections by date range');
    console.log('Filter params:', queryParams);

    const response = await api.get(ENDPOINTS.COLLECTIONS, { params: queryParams });

    // Log details of what we received
    if (response.data) {
      const dataCount = response.data.results?.length || (Array.isArray(response.data) ? response.data.length : 0);
      console.log(`Received ${dataCount} records from API`);
      console.log(`Response type: ${Array.isArray(response.data) ? 'Array' : 'Object with results'}`);

      if (response.data.next) {
        console.warn('WARNING: There are more records available - increase page_size!');
      }
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching collections by date range:', error);
    throw error;
  }
};

// Get collections for a specific customer
export const getCustomerCollections = async (customerId, params = {}) => {
  try {
    // Create params object with very large page size
    const queryParams = {
      customer: customerId,
      fetch_all: true,
      page_size: 10000 // Use an extremely large page size to ensure we get ALL records
    };

    // Add any additional params like ordering
    Object.assign(queryParams, params);

    console.log('Fetching ALL collections for customer with params:', queryParams);
    const response = await api.get(ENDPOINTS.COLLECTIONS, { params: queryParams });
    return response.data;
  } catch (error) {
    console.error('Error fetching customer collections:', error);
    throw error;
  }
};

// Get collections filtered by both customer and date range
export const getFilteredCollections = async (options = {}) => {
  const { customerId, dateFrom, dateTo, ordering, isProRata } = options;

  // Create params with EXPLICIT instructions to bypass all pagination
  const params = {
    fetch_all: true,
    page_size: 10000,
    limit: 10000,
    no_pagination: true
  };

  // Add customer filter if provided
  if (customerId) {
    params.customer = customerId;
  }

  // Add date filters if provided
  if (dateFrom) {
    params.date_from = dateFrom;
  }

  if (dateTo) {
    params.date_to = dateTo;
  }

  // Add ordering if provided
  if (ordering) {
    params.ordering = ordering;
  }

  // Add pro-rata filter if provided
  if (isProRata !== undefined) {
    params.is_pro_rata = isProRata;
  }

  // Log explicit attempt to bypass limits
  console.log('BYPASSING PAGINATION LIMITS: Fetching ALL filtered collections');
  console.log('Filter params:', params);

  try {
    const response = await api.get(ENDPOINTS.COLLECTIONS, { params });

    // Log details of what we received
    if (response.data) {
      const dataCount = response.data.results?.length || (Array.isArray(response.data) ? response.data.length : 0);
      console.log(`Received ${dataCount} records from API`);
      console.log(`Response type: ${Array.isArray(response.data) ? 'Array' : 'Object with results'}`);

      if (response.data.next) {
        console.warn('WARNING: There are more records available - increase page_size!');
      }
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching filtered collections:', error);
    throw error;
  }
};

export const createCollection = async (collectionData) => {
  try {
    const response = await api.post(ENDPOINTS.COLLECTIONS, collectionData);
    return response.data;
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
};

export const updateCollection = async (collectionId, collectionData) => {
  try {
    if (!collectionId) {
      throw new Error('Collection ID is required');
    }

    if (!collectionData.customer) {
      console.error('Error: Customer ID is missing in the collection data', collectionData);
      throw new Error('Customer ID is required');
    }

    // Log the structure of data being sent to the API
    console.log('Update collection API call with:');
    console.log('- Collection ID:', collectionId);
    console.log('- Customer ID:', collectionData.customer);
    console.log('- Full data:', JSON.stringify(collectionData, null, 2));

    // Make sure customer is sent as a number if it's stored as a string
    if (typeof collectionData.customer === 'string' && !isNaN(parseInt(collectionData.customer))) {
      collectionData.customer = parseInt(collectionData.customer);
    }

    const response = await api.patch(`${ENDPOINTS.COLLECTIONS}${collectionId}/`, collectionData);
    console.log('Update collection success response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating collection:', error);

    // Enhance the error with more detail if available
    if (error.response && error.response.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));

      // Handle specific edit limit error
      if (error.response.data.error && error.response.data.error.includes('Maximum allowed edits')) {
        const errorMessage = `Edit limit exceeded: ${error.response.data.error}`;
        throw new Error(errorMessage);
      }

      const errorMessage = error.response.data.detail ||
        error.response.data.error ||
        'Failed to update collection';
      throw new Error(errorMessage);
    }

    throw new Error(error.message || 'Failed to update collection');
  }
};

// Delete a collection
export const deleteCollection = async (collectionId) => {
  try {
    if (!collectionId) {
      throw new Error('Collection ID is required');
    }

    console.log('Delete collection API call with ID:', collectionId);
    const response = await api.delete(`${ENDPOINTS.COLLECTIONS}${collectionId}/`);
    console.log('Delete collection success response:', response);
    return response.data;
  } catch (error) {
    console.error('Error deleting collection:', error);

    // Enhance the error with more detail if available
    if (error.response && error.response.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      const errorMessage = error.response.data.detail ||
        error.response.data.error ||
        'Failed to delete collection';
      throw new Error(errorMessage);
    }

    throw new Error(error.message || 'Failed to delete collection');
  }
};

// Update added milk rate collection API
export const updateAddedMilkRateCollection = async (collectionId, collectionData) => {
  try {
    const response = await api.patch(`${ENDPOINTS.COLLECTIONS}${collectionId}/`, collectionData);
    return response.data;
  } catch (error) {
    console.error('Error updating added milk rate collection:', error);
    throw error;
  }
};

// Convert pro-rata collection to regular collection API
export const convertProRataToRegular = async (collectionId, collectionData) => {
  try {
    console.log(`Converting pro-rata collection ${collectionId} to regular collection`);

    // Create conversion payload with is_pro_rata explicitly set to false
    const conversionData = {
      ...collectionData,
      is_pro_rata: true,
      is_milk_rate: true
    };

    console.log('Conversion payload:', conversionData);

    // Use standard PATCH endpoint but with conversion-specific payload
    const response = await api.patch(`${ENDPOINTS.COLLECTIONS}${collectionId}/`, conversionData);
    console.log('Conversion successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error converting pro-rata collection to regular:', error);
    throw error;
  }
};

// Bulk collection API
export const createBulkCollections = async (collectionsArray) => {
  try {
    // Log the data being sent for debugging
    console.log('Sending collection data:', JSON.stringify(collectionsArray, null, 2));

    if (!Array.isArray(collectionsArray) || collectionsArray.length === 0) {
      throw new Error('No collections to submit');
    }

    // For single collection submission
    if (collectionsArray.length === 1) {
      const response = await api.post(ENDPOINTS.COLLECTIONS, collectionsArray[0]);
      return [response.data];
    }

    // For multiple collections, create an array of promises for each collection
    const createPromises = collectionsArray.map(collection =>
      api.post(ENDPOINTS.COLLECTIONS, collection)
    );

    // Execute all requests and wait for them to complete
    const responses = await Promise.all(createPromises);

    // Return array of response data
    return responses.map(response => response.data);
  } catch (error) {
    console.error('Error creating bulk collections:', error);
    // Provide more detailed error information
    if (error.response && error.response.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      const errorMessage = error.response.data.detail || error.response.data.error || 'Database Error';
      const customError = new Error(errorMessage);
      customError.detail = error.response.data;
      throw customError;
    }
    throw error;
  }
};

// Add dairy information endpoints
export const getDairyInfo = async () => {
  try {
    const response = await api.get(ENDPOINTS.DAIRY_INFO);

    // Handle case where API returns an array of dairy records
    if (Array.isArray(response.data) && response.data.length > 0) {
      // Return the first (active) dairy record
      return response.data[0];
    }

    // Handle case where API returns a single object
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }

    // If we get here, the response is in an unexpected format
    console.warn('Unexpected dairy info response format:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      const errorMessage = 'No dairy information found. Please set up your dairy first.';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    console.error('Error fetching dairy information:', error);
    throw error;
  }
};

// Add function to update dairy information
export const updateDairyInfo = async (dairyData, dairyInfoId = null) => {
  try {
    // Basic validation
    if (!dairyData.dairy_name || !dairyData.dairy_name.trim()) {
      throw new Error('Dairy name is required');
    }

    // Ensure rate_type is a valid value
    if (dairyData.rate_type && !['kg_only', 'liters_only', 'fat_only', 'fat_snf', 'fat_clr'].includes(dairyData.rate_type)) {
      throw new Error('Invalid rate type. Must be one of: kg_only, liters_only, fat_only, fat_snf, fat_clr');
    }

    // Validate base_snf if provided
    if (dairyData.base_snf && (isNaN(parseFloat(dairyData.base_snf)) || parseFloat(dairyData.base_snf) <= 0)) {
      throw new Error('Base SNF must be a positive number');
    }

    // Validate fat_snf_ratio if provided
    if (dairyData.fat_snf_ratio && !['60/40', '52/48'].includes(dairyData.fat_snf_ratio)) {
      throw new Error('Invalid fat/SNF ratio. Must be either 60/40 or 52/48');
    }

    // Validate clr_conversion_factor if provided
    if (dairyData.clr_conversion_factor && (isNaN(parseFloat(dairyData.clr_conversion_factor)) || parseFloat(dairyData.clr_conversion_factor) < 0)) {
      throw new Error('CLR conversion factor must be a non-negative number');
    }

    let response;
    if (dairyInfoId) {
      // Update existing dairy information using PUT
      response = await api.put(`${ENDPOINTS.DAIRY_INFO}${dairyInfoId}/`, dairyData);
    } else {
      // Create new dairy information using POST (deactivates any existing active record)
      response = await api.post(ENDPOINTS.DAIRY_INFO, dairyData);
    }

    return response.data;
  } catch (error) {
    console.error('Error updating dairy information:', error);
    throw error;
  }
};

// Add function to patch dairy information (for partial updates)
export const patchDairyInfo = async (dairyInfoId, dairyData) => {
  try {
    if (!dairyInfoId) {
      throw new Error('Dairy information ID is required for patch operation');
    }

    // Validate the data being patched
    if (dairyData.rate_type && !['kg_only', 'liters_only', 'fat_only', 'fat_snf', 'fat_clr'].includes(dairyData.rate_type)) {
      throw new Error('Invalid rate type. Must be one of: kg_only, liters_only, fat_only, fat_snf, fat_clr');
    }

    if (dairyData.base_snf && (isNaN(parseFloat(dairyData.base_snf)) || parseFloat(dairyData.base_snf) <= 0)) {
      throw new Error('Base SNF must be a positive number');
    }

    if (dairyData.fat_snf_ratio && !['60/40', '52/48'].includes(dairyData.fat_snf_ratio)) {
      throw new Error('Invalid fat/SNF ratio. Must be either 60/40 or 52/48');
    }

    if (dairyData.clr_conversion_factor && (isNaN(parseFloat(dairyData.clr_conversion_factor)) || parseFloat(dairyData.clr_conversion_factor) < 0)) {
      throw new Error('CLR conversion factor must be a non-negative number');
    }

    const response = await api.patch(`${ENDPOINTS.DAIRY_INFO}${dairyInfoId}/`, dairyData);
    return response.data;
  } catch (error) {
    console.error('Error patching dairy information:', error);
    throw error;
  }
};

// Add wallet balance endpoint
export const getWalletBalance = async () => {
  try {
    const response = await api.get(ENDPOINTS.WALLET);
    console.log('Raw wallet API response:', response);

    // Return the data from the response
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);

    // Provide a more detailed error message with status code
    if (error.response) {
      console.error(`Wallet API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }

    // Return null instead of throwing to prevent breaking the app
    return null;
  }
};

// Raw Collection APIs
export const getRawCollections = async (params = {}) => {
  try {
    // If we have filters and no explicit pagination, fetch all records
    const queryParams = { ...params };

    // Set fetch_all parameter when filters are applied but no pagination is explicitly requested
    if ((params.customer || params.date_from || params.date_to) && !params.page && !params.page_size) {
      queryParams.fetch_all = true;
    }

    const response = await api.get(ENDPOINTS.RAW_COLLECTIONS, { params: queryParams });
    return response.data;
  } catch (error) {
    console.error('Error fetching raw collections:', error);
    throw error;
  }
};

export const getRawCollectionDetails = async (id) => {
  try {
    const response = await api.get(`${ENDPOINTS.RAW_COLLECTIONS}${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching raw collection details:', error);
    throw error;
  }
};

export const createRawCollection = async (collectionData) => {
  try {
    const response = await api.post(ENDPOINTS.RAW_COLLECTIONS, collectionData);
    return response.data;
  } catch (error) {
    console.error('Error creating raw collection:', error);
    throw error;
  }
};

export const updateRawCollection = async (id, collectionData) => {
  try {
    const response = await api.patch(`${ENDPOINTS.RAW_COLLECTIONS}${id}/`, collectionData);
    return response.data;
  } catch (error) {
    console.error('Error updating raw collection:', error);
    throw error;
  }
};

export const deleteRawCollection = async (id) => {
  try {
    if (!id) {
      throw new Error('Collection ID is required');
    }

    const response = await api.delete(`${ENDPOINTS.RAW_COLLECTIONS}${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting raw collection:', error);

    // Enhance the error with more detail if available
    if (error.response && error.response.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      const errorMessage = error.response.data.detail ||
        error.response.data.error ||
        'Failed to delete raw collection';
      throw new Error(errorMessage);
    }

    throw new Error(error.message || 'Failed to delete raw collection');
  }
};

export const addMilkRateToRawCollection = async (id, rateData) => {
  try {
    const response = await api.patch(`${ENDPOINTS.RAW_COLLECTIONS}${id}/add-milk-rate/`, rateData);
    return response.data;
  } catch (error) {
    console.error('Error adding milk rate to raw collection:', error);
    throw error;
  }
};

export const createBulkRawCollections = async (collectionsArray) => {
  try {
    // Create a copy of the array to avoid modifying the original
    const collectionsToSubmit = [...collectionsArray];

    // Process each collection individually
    const responses = [];
    for (const collection of collectionsToSubmit) {
      try {
        const response = await createRawCollection(collection);
        responses.push({
          success: true,
          data: response,
          message: 'Raw collection created successfully'
        });
      } catch (error) {
        responses.push({
          success: false,
          error: error.error || 'Failed to create raw collection',
          collection
        });
      }
    }

    return {
      results: responses,
      successCount: responses.filter(r => r.success).length,
      failureCount: responses.filter(r => !r.success).length
    };
  } catch (error) {
    console.error('Error in bulk raw collections creation:', error);
    throw error;
  }
};

// Pro-Rata Report APIs
export const generateProRataPurchaseReport = async (startDate, endDate, includeBRate = true) => {
  try {
    // Format DD-MM-YYYY expected by the API
    const response = await api.get(ENDPOINTS.PRO_RATA_PURCHASE_REPORT, {
      params: {
        start_date: startDate,
        end_date: endDate,
        include_brate: includeBRate
      },
      responseType: 'blob', // Important: to handle PDF response
    });

    return response;
  } catch (error) {
    console.error('Error generating pro-rata purchase report:', error);
    throw error;
  }
};

export const generateProRataPurchaseSummaryReport = async (startDate, endDate, includeBRate = true) => {
  try {
    const response = await api.get(ENDPOINTS.PRO_RATA_PURCHASE_SUMMARY_REPORT, {
      params: {
        start_date: startDate,
        end_date: endDate,
        include_brate: includeBRate
      },
      responseType: 'blob', // Important: to handle PDF response
    });

    return response;
  } catch (error) {
    console.error('Error generating pro-rata purchase summary report:', error);
    throw error;
  }
};

export const generateProRataFullReport = async (startDate, endDate, includeBRate = true) => {
  try {
    const response = await api.get(ENDPOINTS.PRO_RATA_FULL_REPORT, {
      params: {
        start_date: startDate,
        end_date: endDate,
        include_brate: includeBRate
      },
      responseType: 'blob', // Important: to handle PDF response
    });

    return response;
  } catch (error) {
    console.error('Error generating pro-rata full report:', error);
    throw error;
  }
};

export const generateProRataCustomerBills = async (startDate, endDate, includeBRate = true) => {
  try {
    const response = await api.get(ENDPOINTS.PRO_RATA_CUSTOMER_BILLS, {
      params: {
        start_date: startDate,
        end_date: endDate,
        include_brate: includeBRate
      },
      responseType: 'blob', // Important: to handle PDF response
    });

    return response;
  } catch (error) {
    console.error('Error generating pro-rata customer bills:', error);
    throw error;
  }
};

export const generateProRataCustomerReport = async (startDate, endDate, customerIds, includeBRate = true) => {
  try {
    const response = await api.get(ENDPOINTS.PRO_RATA_CUSTOMER_REPORT, {
      params: {
        start_date: startDate,
        end_date: endDate,
        customer_ids: customerIds.join(','), // Convert array to comma-separated string
        include_brate: includeBRate
      },
      responseType: 'blob', // Important: to handle PDF response
    });

    return response;
  } catch (error) {
    console.error('Error generating pro-rata customer report:', error);
    throw error;
  }
};

export const getProRataPurchaseSummaryData = async (startDate, endDate) => {
  try {
    const response = await api.get(ENDPOINTS.PRO_RATA_PURCHASE_SUMMARY_DATA, {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching pro-rata purchase summary data:', error);
    throw error;
  }
};

// ===== STANDARD REPORT API FUNCTIONS =====
export const getPurchaseReportJson = async (params = {}) => {
  try {
    const response = await api.get(ENDPOINTS.PURCHASE_REPORT_JSON, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching purchase report JSON:', error);
    throw error;
  }
};

export const getPurchaseSummaryJson = async (startDate, endDate) => {
  try {
    const response = await api.get(ENDPOINTS.PURCHASE_SUMMARY_JSON, {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching purchase summary JSON:', error);
    throw error;
  }
};

export const generatePurchaseReport = async (startDate, endDate) => {
  try {
    const response = await api.get(ENDPOINTS.GENERATE_PURCHASE_REPORT, {
      params: { start_date: startDate, end_date: endDate },
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error('Error generating purchase report (standard):', error);
    throw error;
  }
};

export const generatePurchaseSummaryReport = async (startDate, endDate) => {
  try {
    const response = await api.get(ENDPOINTS.GENERATE_PURCHASE_SUMMARY_REPORT, {
      params: { start_date: startDate, end_date: endDate },
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error('Error generating purchase summary report (standard):', error);
    throw error;
  }
};

export const generateFullReport = async (startDate, endDate) => {
  try {
    const response = await api.get(ENDPOINTS.GENERATE_FULL_REPORT, {
      params: { start_date: startDate, end_date: endDate },
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error('Error generating full report (standard):', error);
    throw error;
  }
};

export const generateFullCustomerReport = async (startDate, endDate) => {
  try {
    const response = await api.get(ENDPOINTS.GENERATE_FULL_CUSTOMER_REPORT, {
      params: { start_date: startDate, end_date: endDate },
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error('Error generating full customer report (standard):', error);
    throw error;
  }
};

export const generateCustomerReport = async (startDate, endDate, customerIds) => {
  try {
    const response = await api.get(ENDPOINTS.GENERATE_CUSTOMER_REPORT, {
      params: { start_date: startDate, end_date: endDate, customer_ids: Array.isArray(customerIds) ? customerIds.join(',') : customerIds },
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error('Error generating customer report (standard):', error);
    throw error;
  }
};

// ===== WALLET API FUNCTIONS =====

// Add money to wallet - creates Razorpay payment link
export const addMoneyToWallet = async (amount) => {
  try {
    if (!amount || amount < 0.01) {
      throw new Error('Amount must be at least ₹0.01');
    }

    const response = await api.post(ENDPOINTS.WALLET_ADD_MONEY, {
      amount: parseFloat(amount),
      return_order_details: true  // Request order_id and key for embedded checkout
    });

    return response.data;
  } catch (error) {
    console.error('Error adding money to wallet:', error);

    // Handle specific error cases
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      if (errorData.amount) {
        throw new Error(`Invalid amount: ${errorData.amount[0]}`);
      }
    }

    if (error.response?.status === 429) {
      throw new Error('Too many requests. Please try again in a minute.');
    }

    throw error;
  }
};

// Update wallet balance directly (PATCH /api/wallet/)
export const updateWalletBalance = async (balance) => {
  try {
    if (balance < 0) {
      throw new Error('Balance cannot be negative');
    }

    const response = await api.patch(ENDPOINTS.WALLET, {
      balance: parseFloat(balance)
    });

    return response.data;
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    throw error;
  }
};

// Get wallet transactions (paginated)
export const getWalletTransactions = async (params = {}) => {
  try {
    const response = await api.get(ENDPOINTS.WALLET_TRANSACTIONS, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    throw error;
  }
};

// Get all transactions (from /api/transactions/)
export const getTransactions = async (params = {}) => {
  try {
    const response = await api.get(ENDPOINTS.TRANSACTIONS, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

// Create a transaction (CREDIT or DEBIT)
export const createTransaction = async (transactionData) => {
  try {
    // Validate required fields
    if (!transactionData.wallet) {
      throw new Error('Wallet ID is required');
    }
    if (!transactionData.amount || transactionData.amount < 0.01) {
      throw new Error('Amount must be at least ₹0.01');
    }
    if (!['CREDIT', 'DEBIT'].includes(transactionData.transaction_type)) {
      throw new Error('Transaction type must be CREDIT or DEBIT');
    }
    if (!['PENDING', 'SUCCESS', 'FAILED'].includes(transactionData.status)) {
      throw new Error('Status must be PENDING, SUCCESS, or FAILED');
    }

    const response = await api.post(ENDPOINTS.TRANSACTIONS, {
      wallet: transactionData.wallet,
      amount: parseFloat(transactionData.amount),
      transaction_type: transactionData.transaction_type,
      status: transactionData.status,
      description: transactionData.description || ''
    });

    return response.data;
  } catch (error) {
    console.error('Error creating transaction:', error);

    // Handle specific validation errors
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      if (errorData.detail && errorData.detail.includes('insufficient balance')) {
        throw new Error('Insufficient wallet balance for this transaction.');
      }
    }

    throw error;
  }
};

// Update a transaction (PATCH /api/transactions/{id}/)
export const updateTransaction = async (transactionId, updateData) => {
  try {
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    const response = await api.patch(`${ENDPOINTS.TRANSACTIONS}${transactionId}/`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

// ===== PRO RATA RATE CHART API FUNCTIONS =====

// Get current active pro-rata rate chart
export const getProRataRateChart = async () => {
  try {
    const response = await api.get(ENDPOINTS.PRO_RATA_RATE_CHART);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      const errorMessage = 'No pro-rata rate chart found. Please set up your rate chart first.';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    console.error('Error fetching pro-rata rate chart:', error);
    throw error;
  }
};

// Create new pro-rata rate chart
export const createProRataRateChart = async (rateChartData) => {
  try {
    // Validate the rate chart data structure
    if (!rateChartData.fat_step_up_rates || !Array.isArray(rateChartData.fat_step_up_rates)) {
      throw new Error('Fat step up rates array is required');
    }
    if (!rateChartData.snf_step_down_rates || !Array.isArray(rateChartData.snf_step_down_rates)) {
      throw new Error('SNF step down rates array is required');
    }

    // Validate each rate entry
    rateChartData.fat_step_up_rates.forEach((rate, index) => {
      if (!rate.step || isNaN(parseFloat(rate.step))) {
        throw new Error(`Invalid step value at fat_step_up_rates[${index}]`);
      }
      if (!rate.rate || isNaN(parseFloat(rate.rate))) {
        throw new Error(`Invalid rate value at fat_step_up_rates[${index}]`);
      }
    });

    rateChartData.snf_step_down_rates.forEach((rate, index) => {
      if (!rate.step || isNaN(parseFloat(rate.step))) {
        throw new Error(`Invalid step value at snf_step_down_rates[${index}]`);
      }
      if (!rate.rate || isNaN(parseFloat(rate.rate))) {
        throw new Error(`Invalid rate value at snf_step_down_rates[${index}]`);
      }
    });

    const response = await api.post(ENDPOINTS.PRO_RATA_RATE_CHART, rateChartData);
    return response.data;
  } catch (error) {
    console.error('Error creating pro-rata rate chart:', error);
    throw error;
  }
};

// Update existing pro-rata rate chart
export const updateProRataRateChart = async (chartId, rateChartData) => {
  try {
    if (!chartId) {
      throw new Error('Rate chart ID is required');
    }

    // Validate the rate chart data structure (same validation as create)
    if (!rateChartData.fat_step_up_rates || !Array.isArray(rateChartData.fat_step_up_rates)) {
      throw new Error('Fat step up rates array is required');
    }
    if (!rateChartData.snf_step_down_rates || !Array.isArray(rateChartData.snf_step_down_rates)) {
      throw new Error('SNF step down rates array is required');
    }

    const response = await api.patch(`${ENDPOINTS.PRO_RATA_RATE_CHART}${chartId}/`, rateChartData);
    return response.data;
  } catch (error) {
    console.error('Error updating pro-rata rate chart:', error);
    throw error;
  }
};

// Delete pro-rata rate chart (soft delete)
export const deleteProRataRateChart = async (chartId) => {
  try {
    if (!chartId) {
      throw new Error('Rate chart ID is required');
    }

    const response = await api.delete(`${ENDPOINTS.PRO_RATA_RATE_CHART}${chartId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting pro-rata rate chart:', error);
    throw error;
  }
};

// ===== SUPPLIER API FUNCTIONS =====

// Get all suppliers (using customers as suppliers for now)
export const getSuppliers = async () => {
  try {
    const response = await api.get(ENDPOINTS.SUPPLIERS, {
      params: {
        fetch_all: true,
        page_size: 10000,
        limit: 10000,
        no_pagination: true
      }
    });

    // Map customer data to supplier format
    const customersData = response.data.results || response.data || [];
    const suppliersData = customersData.map(customer => ({
      id: customer.id,  // Use actual database ID for API calls
      customer_id: customer.customer_id,  // Keep customer_id for display
      name: customer.name || customer.customer_name || '',
      fathers_name: customer.fathers_name || customer.father_name || '',
      phone: customer.phone || '',
      village: customer.village || '',
      address: customer.address || ''
    }));

    return suppliersData;
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw error;
  }
};

// Update supplier information (using customer update endpoint)
export const updateSupplier = async (supplierId, supplierData) => {
  try {
    // Find the original customer ID from suppliers list
    const suppliers = await getSuppliers();
    const supplier = suppliers.find(s => s.id === supplierId);

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Get the actual database ID for the customer
    const customersData = await api.get(ENDPOINTS.SUPPLIERS, {
      params: {
        fetch_all: true,
        page_size: 10000,
        no_pagination: true
      }
    });

    const customers = customersData.data.results || customersData.data || [];
    const originalCustomer = customers.find(c =>
      c.id === supplierId || c.customer_id === supplierId
    );

    if (!originalCustomer) {
      throw new Error('Original customer not found');
    }

    // Update the customer using the database ID
    const response = await api.patch(`${ENDPOINTS.SUPPLIERS}${originalCustomer.id}/`, {
      name: supplierData.name,
      father_name: supplierData.fathers_name,
      phone: supplierData.phone,
      village: supplierData.village,
      address: supplierData.address
    });

    return response.data;
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
};

// Get supplier bills (using customer collections as fallback for now)
export const getSupplierBills = async (supplierId, startDate, endDate) => {
  // For now, return empty data since supplier bills endpoint doesn't exist
  // This will be implemented when backend adds supplier functionality
  return [];
};

// Generate supplier bills report (individual supplier)
export const generateSupplierBillsReport = async (supplierId, startDate, endDate, includeBRate = true) => {
  try {
    // Use pro-rata customer report endpoint with query parameters built manually like the example
    const url = `${ENDPOINTS.PRO_RATA_CUSTOMER_REPORT}?start_date=${startDate}&end_date=${endDate}&customer_ids=${encodeURIComponent(supplierId)}&include_brate=${includeBRate}`;
    const response = await api.get(url, { responseType: 'arraybuffer' });
    return response;
  } catch (error) {
    console.error('Error generating supplier bills report:', error);
    throw error;
  }
};

// Generate standard supplier bills report (using working endpoint)
export const generateStandardSupplierBillsReport = async (supplierId, startDate, endDate) => {
  try {
    // Use pro-rata customer bills endpoint which actually exists
    const response = await api.get(ENDPOINTS.PRO_RATA_CUSTOMER_BILLS, {
      params: {
        start_date: startDate,
        end_date: endDate,
        customer_ids: supplierId
      },
      responseType: 'arraybuffer'
    });
    return response;
  } catch (error) {
    console.error('Error generating standard supplier bills report:', error);
    throw error;
  }
};
