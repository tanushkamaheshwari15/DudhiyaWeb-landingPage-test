import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, createBulkRawCollections, getUserInfo, getDairyInfo, updateDairyInfo, getCurrentMarketPrice, updateMarketPrice, createCustomer, getWalletBalance } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// eslint-disable-next-line no-unused-vars
import {
  faPlus,
  faTrash,
  faArrowLeft,
  faSpinner,
  faCheck,
  faExclamationTriangle,
  faTimes,
  faUser,
  faPhone,
  faStore,
  faWallet,
  faEdit,
  faExchangeAlt,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import './BulkCollectionV1.css';

const AddRawCollection = () => {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [currentSubmitMessage, setCurrentSubmitMessage] = useState('');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [currentCollection, setCurrentCollection] = useState(null);
  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split('T')[0]);
  const [globalTime, setGlobalTime] = useState('morning');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  const [rowSearchQueries, setRowSearchQueries] = useState({});
  const [activeSearchRowIndex, setActiveSearchRowIndex] = useState(null);

  const [visibleDropdowns, setVisibleDropdowns] = useState({});

  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1);

  const [dairyInfo, setDairyInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const [userInfo, setUserInfo] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);

  const [currentRate, setCurrentRate] = useState(null);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [customRate, setCustomRate] = useState('');

  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [submissionTotal, setSubmissionTotal] = useState(0);

  const [rateType, setRateType] = useState('fat_snf');
  const [isEditingRateType, setIsEditingRateType] = useState(false);
  const [submittingRateType, setSubmittingRateType] = useState(false);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewCollections, setPreviewCollections] = useState([]);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    father_name: '',
    phone: '',
    village: '',
    address: '',
  });

  const customerInputRefs = useRef([]);
  const navigate = useNavigate();

  const initializeEmptyRows = useCallback((count) => {
    if (collections.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      setGlobalDate(today);
    }

    setCollections(() => {
      const timestamp = Date.now();
      return Array.from({ length: count }, (_, index) => ({
        id: `row_${timestamp}_${index}`,
        customer: null,
        customerDisplay: '',
        fat_percentage: '',
        weight: '',
        snf_percentage: '',
        clr: '',
        base_snf_percentage: '9.0',
        collection_time: globalTime,
        collection_date: globalDate,
        milk_type: 'cow',
        measured: 'kg',
        kg: 0,
        liters: 0,
        isSnfFromClr: false
      }));
    });

    console.log('Initialized', count, 'empty rows');
  }, [globalTime, globalDate, collections.length]);

  useEffect(() => {
    fetchCustomers();
    fetchUserAndDairyInfo();
    fetchCurrentRate();

    if (collections.length === 0) {
      initializeEmptyRows(15);
    }
  }, [initializeEmptyRows, collections.length]);

  const fetchCurrentRate = async () => {
    try {
      const response = await getCurrentMarketPrice();
      if (response && response.price) {
        setCurrentRate(response.price);
        setCustomRate(response.price.toString());
      }
    } catch (error) {
      setCurrentRate(0);
      setCustomRate('0');
      console.error('Error fetching current rate:', error);
    }
  };

  const fetchUserAndDairyInfo = async () => {
    try {
      setLoadingInfo(true);

      const userResponse = await getUserInfo();
      setUserInfo(userResponse);

      const dairyResponse = await getDairyInfo();
      setDairyInfo(dairyResponse);

      if (dairyResponse && dairyResponse.rate_type) {
        setRateType(dairyResponse.rate_type);
      }

      try {
        const walletResponse = await getWalletBalance();
        console.log('Wallet API response:', walletResponse);

        let balance = null;

        if (walletResponse && walletResponse.balance !== undefined) {
          balance = walletResponse.balance;
        } else if (walletResponse && walletResponse.amount !== undefined) {
          balance = walletResponse.amount;
        } else if (walletResponse && typeof walletResponse === 'number') {
          balance = walletResponse;
        } else if (walletResponse && typeof walletResponse === 'object') {
          console.log('Available wallet properties:', Object.keys(walletResponse));
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
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
      }

      setLoadingInfo(false);
    } catch (error) {
      console.error('Error fetching user/dairy info:', error);
      setLoadingInfo(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await getCustomers();
      setCustomers(response.results || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const calculateSnfFromClr = (clrValue, fatValue) => {
    if (!clrValue || !fatValue) {
      return '';
    }

    const clr = parseFloat(clrValue);
    const fat = parseFloat(fatValue);

    if (isNaN(clr) || isNaN(fat) || clr <= 0 || fat <= 0) {
      return '';
    }

    const calculatedSnf = Math.floor(((clr / 4) + (fat * 0.20) + 0.14) * 100) / 100;

    return calculatedSnf.toFixed(2);
  };

  const calculateKgToLiters = (kg) => {
    if (!kg) return 0;
    const weight = parseFloat(kg);
    if (isNaN(weight) || weight <= 0) return 0;

    return Math.floor((weight / 1.02249) * 100) / 100;
  };

  const addCollection = (count = 5) => {
    const lastCollection = collections.length > 0 ? collections[collections.length - 1] : null;

    const timestamp = Date.now();
    const newCollections = Array.from({ length: count }, (_, index) => ({
      id: `row_${timestamp}_${index}`,
      customer: null,
      customerDisplay: '',
      fat_percentage: '',
      weight: '',
      snf_percentage: '',
      clr: '',
      base_snf_percentage: '9.0',
      collection_time: globalTime,
      collection_date: globalDate,
      milk_type: lastCollection ? lastCollection.milk_type : 'cow',
      measured: 'kg',
      kg: 0,
      liters: 0,
      isSnfFromClr: false
    }));

    setCollections([...collections, ...newCollections]);
  };

  const rowHasData = (collection) => {
    return !!(
      (collection.fat_percentage && collection.fat_percentage.toString().trim() !== '') ||
      (collection.weight && collection.weight.toString().trim() !== '') ||
      (collection.snf_percentage && collection.snf_percentage.toString().trim() !== '') ||
      (collection.clr && collection.clr.toString().trim() !== '')
    );
  };

  const handleDeleteClick = (collection) => {
    if (rowHasData(collection)) {
      setRowToDelete(collection.id);
      setShowDeleteConfirmation(true);
    } else {
      setCollections(collections.filter(c => c.id !== collection.id));
    }
  };

  const handleSearch = (rowIndex, query) => {
    setRowSearchQueries(prev => ({
      ...prev,
      [rowIndex]: query.trim()
    }));

    setActiveSearchRowIndex(rowIndex);

    if (!query.trim()) {
      setFilteredCustomers([]);
      setSelectedCustomerIndex(-1);
      return;
    }

    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(query.toLowerCase()) ||
      (customer.customer_id && customer.customer_id.toString().includes(query)) ||
      (customer.phone && customer.phone.includes(query))
    );

    setFilteredCustomers(filtered);

    setVisibleDropdowns(prev => ({
      ...prev,
      [rowIndex]: true
    }));

    setSelectedCustomerIndex(filtered.length > 0 ? 0 : -1);

    setCurrentCollection(collections[rowIndex]);
  };

  const handleSelectCustomer = (rowIndex, customer) => {
    setCollections(collections.map((col, idx) => {
      if (idx === rowIndex) {
        return {
          ...col,
          customer: customer,
          customerDisplay: `${customer.customer_id || customer.id} - ${customer.name}`
        };
      }
      return col;
    }));

    setVisibleDropdowns(prev => ({
      ...prev,
      [rowIndex]: false
    }));

    setRowSearchQueries(prev => ({
      ...prev,
      [rowIndex]: ''
    }));

    setActiveSearchRowIndex(null);
    setSelectedCustomerIndex(-1);

    const nextCell = document.getElementById(`weight_${rowIndex}`);
    if (nextCell) {
      nextCell.focus();
    }
  };

  const handleCellFocus = (rowIndex, cellName) => {
    if (cellName === 'customerDisplay') {
      if (rowSearchQueries[rowIndex]) {
        setVisibleDropdowns(prev => ({
          ...prev,
          [rowIndex]: true
        }));
      }
    }
  };

  const handleCellBlur = (rowIndex, field, value) => {
    // Skip empty values
    if (!value || value.trim() === '') return;

    setTimeout(() => {
      setVisibleDropdowns(prev => ({
        ...prev,
        [rowIndex]: false
      }));

      // Special handling for fat_percentage
      if (field === 'fat_percentage') {
        // Try to convert the value if needed
        const processedValue = processDecimalInput(value, 'fat');

        if (processedValue !== value) {
          // Update the collection with the processed value
          setCollections(collections.map((col, idx) => {
            if (idx === rowIndex) {
              return { ...col, fat_percentage: processedValue };
            }
            return col;
          }));
        }

        // Validate the fat percentage is within acceptable range
        const numValue = parseFloat(processedValue);
        if (!isNaN(numValue)) {
          setFormErrors(prev => {
            const newErrors = { ...prev };

            // Clear any previous error for this field
            if (newErrors[rowIndex]) {
              delete newErrors[rowIndex].fat_percentage;
            }

            // If no errors remain for this collection, remove the collection entry
            if (newErrors[rowIndex] &&
              Object.keys(newErrors[rowIndex]).length === 0) {
              delete newErrors[rowIndex];
            }

            return newErrors;
          });
        }
      }

      // Special handling for snf_percentage
      else if (field === 'snf_percentage' && !collections[rowIndex].isSnfFromClr && rateType === 'fat_snf') {
        // Try to convert the value if needed
        const processedValue = processDecimalInput(value, 'snf');

        if (processedValue !== value) {
          // Update the collection with the processed value
          setCollections(collections.map((col, idx) => {
            if (idx === rowIndex) {
              return { ...col, snf_percentage: processedValue };
            }
            return col;
          }));
        }

        // Validate the SNF percentage is within acceptable range
        const numValue = parseFloat(processedValue);
        if (!isNaN(numValue)) {
          setFormErrors(prev => {
            const newErrors = { ...prev };

            // Clear any previous error for this field
            if (newErrors[rowIndex]) {
              delete newErrors[rowIndex].snf_percentage;
            }

            // If no errors remain for this collection, remove the collection entry
            if (newErrors[rowIndex] &&
              Object.keys(newErrors[rowIndex]).length === 0) {
              delete newErrors[rowIndex];
            }

            return newErrors;
          });
        }
      }

      // Special handling for CLR
      else if (field === 'clr' && rateType === 'fat_clr') {
        // Try to convert the value if needed
        const processedValue = processDecimalInput(value, 'clr');

        if (processedValue !== value) {
          // Update the collection with the processed value
          const updatedCollections = [...collections];
          const updatedCollection = { ...collections[rowIndex], clr: processedValue };

          // Recalculate SNF from CLR if fat is present
          if (collections[rowIndex].fat_percentage) {
            const snfValue = calculateSnfFromClr(processedValue, collections[rowIndex].fat_percentage);
            if (snfValue) {
              updatedCollection.snf_percentage = snfValue;
              updatedCollection.isSnfFromClr = true;
            }
          }

          updatedCollections[rowIndex] = updatedCollection;
          setCollections(updatedCollections);
        }

        // Validate the CLR value is within acceptable range
        const numValue = parseFloat(processedValue);
        if (!isNaN(numValue)) {
          setFormErrors(prev => {
            const newErrors = { ...prev };

            // Check if CLR is within acceptable range
            if (numValue < 13.1 || numValue > 34.0) {
              // Ensure the collection has an errors object
              if (!newErrors[rowIndex]) {
                newErrors[rowIndex] = {};
              }

              // Set error message based on range violation
              if (numValue < 13.1) {
                newErrors[rowIndex].clr = `CLR value ${numValue} is below the minimum (13.1)`;
              } else {
                newErrors[rowIndex].clr = `CLR value ${numValue} is above the maximum (34.0)`;
              }
            } else {
              // Clear any previous error for this field
              if (newErrors[rowIndex]) {
                delete newErrors[rowIndex].clr;
              }

              // If no errors remain for this collection, remove the collection entry
              if (newErrors[rowIndex] &&
                Object.keys(newErrors[rowIndex]).length === 0) {
                delete newErrors[rowIndex];
              }
            }

            return newErrors;
          });
        }
      }
    }, 100);
  };

  const handleInputChange = (rowIndex, field, value) => {
    if (field === 'customerDisplay') {
      handleSearch(rowIndex, value);
    }

    setCollections(collections.map((col, idx) => {
      if (idx === rowIndex) {
        const updatedCollection = { ...col };

        if (field === 'clr') {
          if (value === '') {
            updatedCollection[field] = value;
          } else {
            // For whole numbers, just validate they're numeric
            if (/^\d+$/.test(value)) {
              updatedCollection[field] = value;
            }
            // For decimal values, validate format (allow any value, don't cap)
            else if (/^\d*\.?\d{0,1}$/.test(value)) {
              updatedCollection[field] = value;
            } else {
              return col; // Invalid input, don't update
            }

            // Clear any errors for this field
            if (formErrors[rowIndex]?.clr) {
              setFormErrors(prev => {
                const newErrors = { ...prev };
                if (newErrors[rowIndex]) {
                  delete newErrors[rowIndex].clr;
                  if (Object.keys(newErrors[rowIndex]).length === 0) {
                    delete newErrors[rowIndex];
                  }
                }
                return newErrors;
              });
            }
          }
        }
        // Special handling for fat_percentage input
        else if (field === 'fat_percentage') {
          if (value === '') {
            updatedCollection[field] = value;
          } else {
            // For whole numbers, just validate they're numeric
            if (/^\d+$/.test(value)) {
              updatedCollection[field] = value;
            }
            // For decimal values, validate format (allow any value, don't cap)
            else if (/^\d*\.?\d{0,1}$/.test(value)) {
              updatedCollection[field] = value;
            } else {
              return col; // Invalid input, don't update
            }
          }
        }
        // Special handling for snf_percentage input
        else if (field === 'snf_percentage' && rateType === 'fat_snf') {
          if (value === '') {
            updatedCollection[field] = value;
          } else {
            // For whole numbers, just validate they're numeric
            if (/^\d+$/.test(value)) {
              updatedCollection[field] = value;
            }
            // For decimal values, validate format (allow any value, don't cap)
            else if (/^\d*\.?\d{0,1}$/.test(value)) {
              updatedCollection[field] = value;
            } else {
              return col; // Invalid input, don't update
            }
          }
        }
        else {
          updatedCollection[field] = value;
        }

        if ((field === 'clr' && value && col.fat_percentage && rateType === 'fat_clr') ||
          (field === 'fat_percentage' && col.clr && rateType === 'fat_clr')) {
          const snfValue = calculateSnfFromClr(
            field === 'clr' ? processDecimalInput(value, 'clr') : col.clr,
            field === 'fat_percentage' ? processDecimalInput(value, 'fat') : col.fat_percentage
          );
          if (snfValue) {
            updatedCollection.snf_percentage = snfValue;
            updatedCollection.isSnfFromClr = true;
          }
        }

        if (field === 'weight') {
          const liters = calculateKgToLiters(value);
          updatedCollection.liters = liters;
          updatedCollection.kg = parseFloat(value) || 0;
        }

        return updatedCollection;
      }
      return col;
    }));
  };

  const handleKeyDown = (e, rowIndex, cellName) => {
    if (cellName === 'customerDisplay' && visibleDropdowns[rowIndex] && filteredCustomers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCustomerIndex(prev => {
          if (prev === -1 || prev >= filteredCustomers.length - 1) {
            return 0;
          }
          return prev + 1;
        });
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCustomerIndex(prev => {
          if (prev === -1 || prev === 0) {
            return filteredCustomers.length - 1;
          }
          return prev - 1;
        });
        return;
      }

      if (e.key === 'Enter' && selectedCustomerIndex !== -1) {
        e.preventDefault();
        handleSelectCustomer(rowIndex, filteredCustomers[selectedCustomerIndex]);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setVisibleDropdowns(prev => ({
          ...prev,
          [rowIndex]: false
        }));
        return;
      }
    }

    const cellOrder = [
      'customerDisplay',
      'weight',
      'fat_percentage',
      'snf_percentage',
      'clr',
      'base_snf_percentage',
      'milk_type'
    ];

    const currentIndex = cellOrder.indexOf(cellName);

    const getNextCell = (currentIdx, direction = 1) => {
      let nextIdx = currentIdx + direction;

      while (nextIdx >= 0 && nextIdx < cellOrder.length) {
        const nextCellName = cellOrder[nextIdx];

        if (nextCellName === 'snf_percentage' && rateType === 'fat_clr') {
          nextIdx += direction;
          continue;
        }

        if (nextCellName === 'clr' && rateType === 'fat_snf') {
          nextIdx += direction;
          continue;
        }

        return nextIdx;
      }

      return null;
    };

    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();

      if (currentIndex === cellOrder.length - 1 && !e.shiftKey) {
        if (rowIndex < collections.length - 1) {
          const nextCell = document.getElementById(`${cellOrder[0]}_${rowIndex + 1}`);
          if (nextCell) {
            nextCell.focus();
          }
        } else {
          addCollection(1);
        }
        return;
      }

      if (currentIndex === 0 && e.shiftKey) {
        if (rowIndex > 0) {
          const prevCell = document.getElementById(`${cellOrder[cellOrder.length - 1]}_${rowIndex - 1}`);
          if (prevCell) {
            prevCell.focus();
          }
        }
        return;
      }

      const nextCellInfo = getNextCellIndex(cellName, e.shiftKey ? -1 : 1);
      if (nextCellInfo) {
        const targetRowIndex = rowIndex + nextCellInfo.rowOffset;

        if (targetRowIndex < 0 || targetRowIndex >= collections.length) {
          return;
        }

        const targetElement = document.getElementById(`${nextCellInfo.cell}_${targetRowIndex}`);
        if (targetElement) {
          targetElement.focus();
        }
      }
    }
    else if (e.key === 'ArrowDown' && !visibleDropdowns[rowIndex]) {
      e.preventDefault();
      if (rowIndex < collections.length - 1) {
        const nextCell = document.getElementById(`${cellName}_${rowIndex + 1}`);
        if (nextCell) {
          nextCell.focus();
        }
      }
    }
    else if (e.key === 'ArrowUp' && !visibleDropdowns[rowIndex]) {
      e.preventDefault();
      if (rowIndex > 0) {
        const prevCell = document.getElementById(`${cellName}_${rowIndex - 1}`);
        if (prevCell) {
          prevCell.focus();
        }
      }
    }
    else if (e.key === 'ArrowRight' && currentIndex !== -1) {
      e.preventDefault();
      const nextIdx = getNextCell(currentIndex);
      if (nextIdx !== null) {
        const nextCell = document.getElementById(`${cellOrder[nextIdx]}_${rowIndex}`);
        if (nextCell) {
          nextCell.focus();
        }
      }
    }
    else if (e.key === 'ArrowLeft' && currentIndex !== -1) {
      e.preventDefault();
      const prevIdx = getNextCell(currentIndex, -1);
      if (prevIdx !== null) {
        const prevCell = document.getElementById(`${cellOrder[prevIdx]}_${rowIndex}`);
        if (prevCell) {
          prevCell.focus();
        }
      }
    }
  };

  const getNextCellIndex = (currentCellName, direction = 1) => {
    const cellOrder = [
      'customerDisplay',
      'weight',
      'fat_percentage',
      'snf_percentage',
      'clr',
      'base_snf_percentage',
      'milk_type'
    ];

    const currentIndex = cellOrder.indexOf(currentCellName);
    if (currentIndex === -1) return null;

    let nextIndex = currentIndex;

    do {
      nextIndex += direction;

      if (nextIndex >= cellOrder.length) {
        return { cell: cellOrder[0], rowOffset: 1 };
      }

      if (nextIndex < 0) {
        return { cell: cellOrder[cellOrder.length - 1], rowOffset: -1 };
      }

      const cellName = cellOrder[nextIndex];

      if (cellName === 'snf_percentage' && rateType === 'fat_clr') {
        continue;
      }

      if (cellName === 'clr' && rateType === 'fat_snf') {
        continue;
      }

      break;

    } while (nextIndex >= 0 && nextIndex < cellOrder.length);

    return { cell: cellOrder[nextIndex], rowOffset: 0 };
  };

  const validateCollection = (collection, index) => {
    const errors = {};

    if (!collection.customer || (typeof collection.customer === 'object' && !collection.customer.id)) {
      errors.customer = 'Customer is required';
    }

    if (!collection.fat_percentage || isNaN(parseFloat(collection.fat_percentage))) {
      errors.fat_percentage = 'Fat percentage is required';
    } else if (parseFloat(collection.fat_percentage) <= 0) {
      errors.fat_percentage = 'Valid fat percentage is required';
    } else if (parseFloat(collection.fat_percentage) < 2.0) {
      errors.fat_percentage = 'Fat percentage must be at least 2.0%';
    } else if (parseFloat(collection.fat_percentage) > 13.1) {
      errors.fat_percentage = 'Fat percentage cannot exceed 13.1%';
    }

    if (!collection.weight || isNaN(parseFloat(collection.weight))) {
      errors.weight = 'Weight is required';
    } else if (parseFloat(collection.weight) <= 0) {
      errors.weight = 'Valid weight is required';
    }

    if (rateType === 'fat_snf') {
      if (!collection.snf_percentage || isNaN(parseFloat(collection.snf_percentage))) {
        errors.snf_percentage = 'SNF percentage is required';
      } else if (parseFloat(collection.snf_percentage) <= 0) {
        errors.snf_percentage = 'Valid SNF percentage is required';
      } else if (parseFloat(collection.snf_percentage) < 4.0) {
        errors.snf_percentage = 'SNF percentage must be at least 4.0%';
      } else if (parseFloat(collection.snf_percentage) > 11.0) {
        errors.snf_percentage = 'SNF percentage cannot exceed 11.0%';
      }
    } else if (rateType === 'fat_clr') {
      if (!collection.clr) {
        errors.clr = 'CLR is required';
      } else if (isNaN(collection.clr) || parseFloat(collection.clr) <= 0) {
        errors.clr = 'Valid CLR is required';
      } else {
        const clrValue = parseFloat(collection.clr);
        if (clrValue < 10) {
          errors.clr = `CLR value "${collection.clr}" is invalid. Must have at least 2 digits (e.g., 27.50)`;
        } else if (clrValue < 13.1) {
          errors.clr = `CLR value ${clrValue} is below the minimum (13.1)`;
        } else if (clrValue > 34.0) {
          errors.clr = `CLR value ${clrValue} is above the maximum (34.0)`;
        }
      }
    }

    if (!collection.base_snf_percentage || isNaN(parseFloat(collection.base_snf_percentage))) {
      errors.base_snf_percentage = 'Valid base SNF percentage is required';
    }

    return errors;
  };

  const validateAllCollections = () => {
    const allErrors = {};
    let hasErrors = false;

    collections.forEach((collection, index) => {
      if (!rowHasData(collection)) {
        return;
      }

      const errors = validateCollection(collection, index);
      if (Object.keys(errors).length > 0) {
        allErrors[index] = errors;
        hasErrors = true;
      }
    });

    setFormErrors(allErrors);
    return !hasErrors;
  };

  const formatCollectionsForSubmission = () => {
    return collections
      .filter(rowHasData)
      .map(collection => {
        const weight = parseFloat(collection.weight) || 0;
        const liters = collection.liters || calculateKgToLiters(weight);

        const customerId = collection.customer?.id || collection.customer;

        return {
          customer: customerId,
          collection_time: collection.collection_time,
          collection_date: collection.collection_date,
          milk_type: collection.milk_type,
          measured: 'kg',
          kg: weight,
          liters: liters,
          fat_percentage: parseFloat(collection.fat_percentage) || 0,
          snf_percentage: parseFloat(collection.snf_percentage) || 0,
          clr: parseFloat(collection.clr) || 0,
          base_snf_percentage: parseFloat(collection.base_snf_percentage) || 9.0
        };
      });
  };

  const handlePreview = async (e) => {
    if (e) e.preventDefault();

    const dataRows = collections.filter(rowHasData);
    if (dataRows.length === 0) {
      setSubmitError('Please add at least one collection');
      return;
    }

    // Check for warnings in cells and treat them as validation errors
    // eslint-disable-next-line no-unused-vars
    const hasWarnings = collections.some((collection, rowIndex) => {
      // Check for fat_percentage warnings
      if (collection.fat_percentage && parseFloat(collection.fat_percentage) < 2.0 && !formErrors[rowIndex]?.fat_percentage) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          if (!newErrors[rowIndex]) newErrors[rowIndex] = {};
          newErrors[rowIndex].fat_percentage = `Fat percentage ${parseFloat(collection.fat_percentage)} is below the minimum (2.0%)`;
          return newErrors;
        });
        return true;
      }

      if (collection.fat_percentage && parseFloat(collection.fat_percentage) > 13.1) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          if (!newErrors[rowIndex]) newErrors[rowIndex] = {};
          newErrors[rowIndex].fat_percentage = `Fat percentage ${parseFloat(collection.fat_percentage)} exceeds the maximum (13.1%)`;
          return newErrors;
        });
        return true;
      }

      // Check for snf_percentage warnings
      if (collection.snf_percentage && parseFloat(collection.snf_percentage) < 4.0 && !formErrors[rowIndex]?.snf_percentage && rateType === 'fat_snf') {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          if (!newErrors[rowIndex]) newErrors[rowIndex] = {};
          newErrors[rowIndex].snf_percentage = `SNF percentage ${parseFloat(collection.snf_percentage)} is below the minimum (4.0%)`;
          return newErrors;
        });
        return true;
      }

      if (collection.snf_percentage && parseFloat(collection.snf_percentage) > 11.0) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          if (!newErrors[rowIndex]) newErrors[rowIndex] = {};
          newErrors[rowIndex].snf_percentage = `SNF percentage ${parseFloat(collection.snf_percentage)} exceeds the maximum (11.0%)`;
          return newErrors;
        });
        return true;
      }

      // Check for clr warnings
      if (collection.clr && parseFloat(collection.clr) < 13.1 && !formErrors[rowIndex]?.clr && rateType === 'fat_clr') {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          if (!newErrors[rowIndex]) newErrors[rowIndex] = {};
          newErrors[rowIndex].clr = `CLR value ${parseFloat(collection.clr)} is below the minimum (13.1)`;
          return newErrors;
        });
        return true;
      }

      if (collection.clr && parseFloat(collection.clr) > 34.0 && rateType === 'fat_clr') {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          if (!newErrors[rowIndex]) newErrors[rowIndex] = {};
          newErrors[rowIndex].clr = `CLR value ${parseFloat(collection.clr)} exceeds the maximum (34.0)`;
          return newErrors;
        });
        return true;
      }

      return false;
    });

    // Re-validate after warning conversion
    if (!validateAllCollections()) {
      // Find collections with errors and show specific messages
      const fatErrorCollection = collections.findIndex((collection, idx) =>
        formErrors[idx]?.fat_percentage
      );

      const snfErrorCollection = collections.findIndex((collection, idx) =>
        formErrors[idx]?.snf_percentage
      );

      const clrErrorCollection = collections.findIndex((collection, idx) =>
        formErrors[idx]?.clr
      );

      // Scroll to and focus the first error field we find, prioritizing fat and snf
      if (fatErrorCollection >= 0) {
        // Show error message in the UI
        setSubmitError(formErrors[fatErrorCollection].fat_percentage);
        // Scroll to the row with error
        const errorRow = document.getElementById(`fat_percentage_${fatErrorCollection}`);
        if (errorRow) {
          errorRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorRow.focus();
        }
      } else if (snfErrorCollection >= 0) {
        // Show error message in the UI
        setSubmitError(formErrors[snfErrorCollection].snf_percentage);
        // Scroll to the row with error
        const errorRow = document.getElementById(`snf_percentage_${snfErrorCollection}`);
        if (errorRow) {
          errorRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorRow.focus();
        }
      } else if (clrErrorCollection >= 0) {
        // Show error message in the UI
        setSubmitError(formErrors[clrErrorCollection].clr);
        // Scroll to the row with error
        const errorRow = document.getElementById(`clr_${clrErrorCollection}`);
        if (errorRow) {
          errorRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorRow.focus();
        }
      } else {
        // Find any other error if no fat/snf/clr errors
        const firstErrorIndex = Object.keys(formErrors)[0];
        if (firstErrorIndex) {
          // Get the first error field
          const firstErrorField = Object.keys(formErrors[firstErrorIndex])[0];
          // Show error message in the UI
          setSubmitError(formErrors[firstErrorIndex][firstErrorField]);
          // Attempt to scroll to the row with error
          const errorRow = document.getElementById(`${firstErrorField}_${firstErrorIndex}`);
          if (errorRow) {
            errorRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorRow.focus();
          }
        } else {
          setSubmitError('Please fix the errors before submitting');
        }
      }
      return;
    }

    const formattedCollections = formatCollectionsForSubmission();

    setPreviewCollections(formattedCollections);
    setShowPreviewModal(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    setShowPreviewModal(false);
    setCurrentSubmitMessage('Processing raw collections...');

    try {
      const formattedCollections = formatCollectionsForSubmission();

      setSubmissionTotal(formattedCollections.length);
      setSubmissionProgress(0);

      if (formattedCollections.length > 10) {
        const batchSize = 5;
        const batches = [];

        for (let i = 0; i < formattedCollections.length; i += batchSize) {
          batches.push(formattedCollections.slice(i, i + batchSize));
        }

        let successCount = 0;
        let failureCount = 0;
        const allResults = [];

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          setCurrentSubmitMessage(`Processing batch ${i + 1} of ${batches.length}...`);

          const batchResponse = await createBulkRawCollections(batch);

          successCount += batchResponse.successCount || 0;
          failureCount += batchResponse.failureCount || 0;

          if (batchResponse.results) {
            allResults.push(...batchResponse.results);
          }

          setSubmissionProgress((i + 1) * batchSize > formattedCollections.length
            ? formattedCollections.length
            : (i + 1) * batchSize);
        }

        const response = {
          successCount,
          failureCount,
          results: allResults
        };

        console.log('Raw collections response:', response);

        if (response.successCount > 0) {
          setSubmitSuccess(true);
          setCurrentSubmitMessage(`Successfully submitted ${response.successCount} raw collections`);

          const successfulCollections = new Set();
          response.results.forEach(result => {
            if (result.success && result.data) {
              successfulCollections.add(JSON.stringify({
                customer: result.data.customer,
                collection_date: result.data.collection_date,
                collection_time: result.data.collection_time
              }));
            }
          });

          const remainingCollections = collections.filter(c => {
            if (!c.customer) return true;

            const key = JSON.stringify({
              customer: c.customer.id || c.customer,
              collection_date: c.collection_date,
              collection_time: c.collection_time
            });

            return !successfulCollections.has(key);
          });

          if (remainingCollections.length < 5) {
            const newEmptyRows = Array.from(
              { length: 5 - remainingCollections.length },
              (_, index) => ({
                id: `row_${Date.now()}_${index}`,
                customer: null,
                customerDisplay: '',
                fat_percentage: '',
                weight: '',
                snf_percentage: '',
                clr: '',
                base_snf_percentage: '9.0',
                collection_time: globalTime,
                collection_date: globalDate,
                milk_type: 'cow',
                measured: 'kg',
                kg: 0,
                liters: 0,
                isSnfFromClr: false
              })
            );

            setCollections([...remainingCollections, ...newEmptyRows]);
          } else {
            setCollections(remainingCollections);
          }
        }

        if (response.failureCount > 0) {
          setSubmitError(`Failed to submit ${response.failureCount} raw collections`);
          console.error('Failed submissions:',
            response.results.filter(r => !r.success)
          );
        }
      } else {
        const response = await createBulkRawCollections(formattedCollections);
        setSubmissionProgress(formattedCollections.length);

        console.log('Raw collections response:', response);

        if (response.successCount > 0) {
          setSubmitSuccess(true);
          setCurrentSubmitMessage(`Successfully submitted ${response.successCount} raw collections`);

          const successfulCollections = new Set();
          response.results.forEach(result => {
            if (result.success && result.data) {
              successfulCollections.add(JSON.stringify({
                customer: result.data.customer,
                collection_date: result.data.collection_date,
                collection_time: result.data.collection_time
              }));
            }
          });

          const remainingCollections = collections.filter(c => {
            if (!c.customer) return true;

            const key = JSON.stringify({
              customer: c.customer.id || c.customer,
              collection_date: c.collection_date,
              collection_time: c.collection_time
            });

            return !successfulCollections.has(key);
          });

          if (remainingCollections.length < 5) {
            const newEmptyRows = Array.from(
              { length: 5 - remainingCollections.length },
              (_, index) => ({
                id: `row_${Date.now()}_${index}`,
                customer: null,
                customerDisplay: '',
                fat_percentage: '',
                weight: '',
                snf_percentage: '',
                clr: '',
                base_snf_percentage: '9.0',
                collection_time: globalTime,
                collection_date: globalDate,
                milk_type: 'cow',
                measured: 'kg',
                kg: 0,
                liters: 0,
                isSnfFromClr: false
              })
            );

            setCollections([...remainingCollections, ...newEmptyRows]);
          } else {
            setCollections(remainingCollections);
          }
        }

        if (response.failureCount > 0) {
          setSubmitError(`Failed to submit ${response.failureCount} raw collections`);
          console.error('Failed submissions:',
            response.results.filter(r => !r.success)
          );
        }
      }
    } catch (error) {
      console.error('Error submitting raw collections:', error);
      setSubmitError(error.error || 'Failed to submit raw collections');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  const handleGlobalDateChange = (e) => {
    const newDate = e.target.value;
    setGlobalDate(newDate);

    setCollections(collections.map(col => ({
      ...col,
      collection_date: newDate
    })));
  };

  const handleGlobalTimeChange = (e) => {
    const newTime = e.target.value;
    setGlobalTime(newTime);

    setCollections(collections.map(col => ({
      ...col,
      collection_time: newTime
    })));
  };

  const toggleRateType = async () => {
    if (isEditingRateType) {
      try {
        setSubmittingRateType(true);

        const dairyData = {
          id: dairyInfo?.id,
          dairy_name: dairyInfo?.dairy_name || '',
          dairy_address: dairyInfo?.dairy_address || '',
          rate_type: rateType
        };

        await updateDairyInfo(dairyData);

        const updatedDairyInfo = await getDairyInfo();
        setDairyInfo(updatedDairyInfo);

        updateCollectionsForRateType(rateType);

        setSubmitSuccess(true);
        setCurrentSubmitMessage('Rate type updated successfully!');
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      } catch (error) {
        console.error('Error updating rate type:', error);
        setSubmitError(error.error || 'Failed to update rate type. Please try again.');
      } finally {
        setSubmittingRateType(false);
        setIsEditingRateType(false);
      }
    } else {
      setIsEditingRateType(true);
    }
  };

  const updateCollectionsForRateType = (newRateType) => {
    if (collections.length === 0) return;

    const updatedCollections = collections.map(collection => {
      let updatedCollection = { ...collection };

      if (newRateType === 'fat_clr' && collection.fat_percentage && collection.clr) {
        const calculatedSnf = calculateSnfFromClr(collection.clr, collection.fat_percentage);
        updatedCollection.snf_percentage = calculatedSnf;
        updatedCollection.isSnfFromClr = true;
      } else if (newRateType === 'fat_snf') {
        updatedCollection.isSnfFromClr = false;
      }

      return updatedCollection;
    });

    setCollections(updatedCollections);
  };

  const handleRateTypeChange = (e) => {
    const newRateType = e.target.value;
    setRateType(newRateType);

    updateCollectionsForRateType(newRateType);
  };

  const toggleRateEdit = async () => {
    if (isEditingRate) {
      const parsedRate = parseFloat(customRate);
      if (!isNaN(parsedRate) && parsedRate >= 0) {
        try {
          setSubmitting(true);
          await updateMarketPrice(parsedRate);
          setCurrentRate(parsedRate);
        } catch (error) {
          console.error('Error updating milk rate:', error);
          setSubmitError(error.error || 'Failed to update milk rate. Please try again.');
          setCustomRate(currentRate.toString());
        } finally {
          setSubmitting(false);
        }
      } else {
        setCustomRate(currentRate.toString());
      }
    }
    setIsEditingRate(!isEditingRate);
  };

  const handleRateChange = (e) => {
    setCustomRate(e.target.value);
  };

  const handleNewCustomerInputChange = (field, value) => {
    setNewCustomer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) {
      setSubmitError('Customer name is required');
      return;
    }

    try {
      setSubmitting(true);

      const formattedPhone = newCustomer.phone ? newCustomer.phone.replace(/^\+91/, '') : '';

      const customerData = {
        ...newCustomer,
        phone: formattedPhone
      };

      const response = await createCustomer(customerData);

      await fetchCustomers();

      if (response && currentCollection) {
        const index = collections.findIndex(c => c.id === currentCollection.id);
        if (index !== -1) {
          handleSelectCustomer(index, response);

          setRowSearchQueries(prev => ({
            ...prev,
            [index]: ''
          }));

          setVisibleDropdowns(prev => ({
            ...prev,
            [index]: false
          }));
        }
      }

      setNewCustomer({
        name: '',
        father_name: '',
        phone: '',
        village: '',
        address: ''
      });
      setShowNewCustomerModal(false);

      setSubmitSuccess(true);
      setCurrentSubmitMessage('Customer created successfully');
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error creating customer:', error);
      setSubmitError(error.error || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const processDecimalInput = (value, type) => {
    // If it's already in decimal format with a decimal point, return as is
    if (value.includes('.')) return value;

    // Convert whole numbers to decimal format
    if (/^\d+$/.test(value)) {
      // For fat and snf, we divide by 10 (e.g., 35 -> 3.5)
      if (type === 'fat' || type === 'snf') {
        return (parseInt(value, 10) / 10).toFixed(1);
      }
      // For CLR, we divide by 10 (e.g., 280 -> 28.0, 20 -> 2.0)
      else if (type === 'clr') {
        // Only process numbers that are likely supposed to be CLR values (above 100)
        const numValue = parseInt(value, 10);
        // If it's a two-digit or three-digit number, divide by 10 (e.g., 20 -> 2.0, 280 -> 28.0)
        if (numValue >= 10) {
          return (numValue / 10).toFixed(1);
        }
        // For single-digit values, add a decimal (e.g., 9 -> 9.0)
        else {
          return numValue.toFixed(1);
        }
      }
    }

    return value;
  };

  return (
    <div className="bulk-collection-v1-container">
      <div className="bulk-collection-content">
        <div className="bulk-collection-header">
          <button className="back-button" onClick={goBack}>
            <FontAwesomeIcon icon={faArrowLeft} /> {t('backToDashboard')}
          </button>
          <h1>{t('addCollection')}</h1>
          <div className="header-actions">
            <LanguageSwitcher />
          </div>
        </div>

        {submitError && (
          <div className="error-message">
            <FontAwesomeIcon icon={faExclamationTriangle} /> {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className="success-message">
            <FontAwesomeIcon icon={faCheck} /> {currentSubmitMessage}
          </div>
        )}

        <div className="dairy-info-container">
          <div className="dairy-info-content">
            <div className="dairy-details">
              {loadingInfo ? (
                <div className="info-loading">
                  <FontAwesomeIcon icon={faSpinner} spin /> {t('loadingDairyInformation')}
                </div>
              ) : (
                <>
                  <div className="info-item">
                    <FontAwesomeIcon icon={faStore} className="info-icon" />
                    <span className="info-label">{t('dairy')}:</span>
                    <span className="info-value">{dairyInfo?.dairy_name || t('notAvailable')}</span>
                  </div>
                  <div className="info-item">
                    <FontAwesomeIcon icon={faWallet} className="info-icon" />
                    <span className="info-label">{t('balance')}:</span>
                    <span className="info-value">
                      {walletBalance !== null && walletBalance !== undefined
                        ? `₹${parseFloat(walletBalance).toFixed(2)}`
                        : t('notAvailable')}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="owner-details">
              {loadingInfo ? (
                <div className="info-loading">
                  <FontAwesomeIcon icon={faSpinner} spin /> {t('loadingUserInformation')}
                </div>
              ) : (
                <>
                  <div className="info-item">
                    <FontAwesomeIcon icon={faUser} className="info-icon" />
                    <span className="info-label">{t('owner')}:</span>
                    <span className="info-value">{userInfo?.name || t('notAvailable')}</span>
                  </div>
                  <div className="info-item">
                    <FontAwesomeIcon icon={faPhone} className="info-icon" />
                    <span className="info-label">{t('phone')}:</span>
                    <span className="info-value">{userInfo?.phone_number || t('notAvailable')}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="current-rate-info">
          {isEditingRate ? (
            <div className="rate-edit">
              <label htmlFor="rate-input">{t('milkRate')}: </label>
              <input
                id="rate-input"
                type="number"
                className="rate-input"
                value={customRate}
                onChange={handleRateChange}
                min="0"
                step="0.01"
              />
              <button
                type="button"
                onClick={toggleRateEdit}
                className="save-rate-button"
              >
                {submitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>{t('saving')}</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} />
                    <span>{t('save')}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="rate-display">
              <p>Current Milk Rate: ₹{currentRate || '0'}</p>
              <button
                type="button"
                onClick={toggleRateEdit}
                className="edit-rate-button"
              >
                <FontAwesomeIcon icon={faEdit} />
                <span>{t('editRate')}</span>
              </button>
            </div>
          )}
        </div>

        <div className="rate-type-section">
          {isEditingRateType ? (
            <div className="rate-type-edit">
              <label htmlFor="rate-type-select">Rate Type: </label>
              <select
                id="rate-type-select"
                value={rateType}
                onChange={handleRateTypeChange}
                className="rate-type-select"
                disabled={submittingRateType}
              >
                <option value="fat_snf">FAT + SNF</option>
                <option value="fat_clr">FAT + CLR</option>
              </select>
              <button
                type="button"
                onClick={toggleRateType}
                className="save-rate-button"
                disabled={submittingRateType}
              >
                {submittingRateType ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>{t('saving')}</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} />
                    <span>{t('save')}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="rate-type-display">
              <p>Current Rate Type: {rateType === 'fat_snf' ? 'FAT + SNF' : 'FAT + CLR'}</p>
              <button
                type="button"
                onClick={toggleRateType}
                className="edit-rate-button"
              >
                <FontAwesomeIcon icon={faExchangeAlt} />
                <span>{t('changeType')}</span>
              </button>
            </div>
          )}
        </div>

        <div className="global-settings">
          <div className="global-settings-row">
            <div className="global-setting">
              <label>{t('collectionDate')}</label>
              <input
                type="date"
                className="global-input"
                value={globalDate}
                onChange={handleGlobalDateChange}
                onClick={(e) => e.target.showPicker()}
              />
            </div>
            <div className="global-setting">
              <label>{t('collectionTime')}</label>
              <select
                className="global-input"
                value={globalTime}
                onChange={handleGlobalTimeChange}
              >
                <option value="morning">{t('morning')}</option>
                <option value="evening">{t('evening')}</option>
              </select>
            </div>
            <div className="global-setting">
              <label>{t('customerManagement')}:</label>
              <button
                type="button"
                className="add-customer-button global-button"
                onClick={() => {
                  setCurrentCollection(null);
                  setShowNewCustomerModal(true);
                }}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>{t('addNewCustomer')}</span>
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handlePreview} noValidate>
          <div className="csv-grid-container">
            <div className="excel-toolbar">
              <div className="toolbar-left">
                <button
                  type="button"
                  className="add-row-button"
                  onClick={() => addCollection(1)}
                >
                  <FontAwesomeIcon icon={faPlus} /> {t('add1Row')}
                </button>
                <button
                  type="button"
                  className="add-row-button"
                  onClick={() => addCollection(5)}
                >
                  <FontAwesomeIcon icon={faPlus} /> {t('add5Rows')}
                </button>
              </div>

              {collections.length > 0 && (
                <button
                  type="submit"
                  className="preview-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin /> {t('processing')}
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faEye} /> {t('previewSubmit')}
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="excel-container">
              <table className="excel-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Weight (kg)</th>
                    <th>Fat%</th>
                    <th>SNF%</th>
                    <th>CLR</th>
                    <th>Base SNF%</th>
                    <th>Animal Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((collection, rowIndex) => (
                    <tr key={collection.id} className="data-row">
                      <td className="serial-number-cell">
                        {rowIndex + 1}
                      </td>
                      <td>
                        <div className="customer-search-cell">
                          <input
                            id={`customerDisplay_${rowIndex}`}
                            type="text"
                            className="excel-cell-input"
                            placeholder="Search customer..."
                            value={
                              (activeSearchRowIndex === rowIndex && rowSearchQueries[rowIndex] !== undefined) ?
                                rowSearchQueries[rowIndex] :
                                collection.customerDisplay || ''
                            }
                            onChange={(e) => handleInputChange(rowIndex, 'customerDisplay', e.target.value)}
                            onFocus={() => handleCellFocus(rowIndex, 'customerDisplay')}
                            onBlur={(e) => handleCellBlur(rowIndex, 'customerDisplay', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, 'customerDisplay')}
                            ref={el => customerInputRefs.current[rowIndex] = el}
                          />
                          {visibleDropdowns[rowIndex] && (
                            <div className="excel-dropdown">
                              {filteredCustomers.length > 0 ? (
                                <>
                                  {filteredCustomers.map((customer, customerIndex) => (
                                    <div
                                      key={customer.id}
                                      className={`dropdown-item ${customerIndex === selectedCustomerIndex ? 'selected' : ''}`}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelectCustomer(rowIndex, customer);
                                      }}
                                      onMouseEnter={() => setSelectedCustomerIndex(customerIndex)}
                                    >
                                      {customer.customer_id || customer.id} - {customer.name}
                                    </div>
                                  ))}
                                  <div
                                    className="dropdown-item add-new"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setCurrentCollection(collection);
                                      setShowNewCustomerModal(true);
                                      setVisibleDropdowns(prev => ({
                                        ...prev,
                                        [rowIndex]: false
                                      }));
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faPlus} /> Add New supplier
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="no-results">No supplier found</div>
                                  <div
                                    className="dropdown-item add-new"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setCurrentCollection(collection);
                                      setShowNewCustomerModal(true);
                                      setVisibleDropdowns(prev => ({
                                        ...prev,
                                        [rowIndex]: false
                                      }));
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faPlus} /> Add New Supplier
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        {formErrors[rowIndex]?.customer && (
                          <div className="cell-error">{formErrors[rowIndex].customer}</div>
                        )}
                      </td>
                      <td className={formErrors[rowIndex]?.weight ? 'has-error' : ''}>
                        <input
                          id={`weight_${rowIndex}`}
                          type="number"
                          className="excel-cell-input"
                          placeholder="e.g. 10.5"
                          step="0.1"
                          min="0"
                          value={collection.weight}
                          onChange={(e) => handleInputChange(rowIndex, 'weight', e.target.value)}
                          onFocus={() => handleCellFocus(rowIndex, 'weight')}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, 'weight')}
                        />
                        {formErrors[rowIndex]?.weight && (
                          <div className="cell-error">{formErrors[rowIndex].weight}</div>
                        )}
                      </td>
                      <td className={formErrors[rowIndex]?.fat_percentage ? 'has-error' : ''}>
                        <input
                          id={`fat_percentage_${rowIndex}`}
                          type="text"
                          className="excel-cell-input"
                          placeholder="e.g. 35 ➞ 3.5"
                          value={collection.fat_percentage}
                          onChange={(e) => handleInputChange(rowIndex, 'fat_percentage', e.target.value)}
                          onFocus={() => handleCellFocus(rowIndex, 'fat_percentage')}
                          onBlur={(e) => handleCellBlur(rowIndex, 'fat_percentage', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, 'fat_percentage')}
                        />
                        {formErrors[rowIndex]?.fat_percentage && (
                          <div className="cell-error">{formErrors[rowIndex].fat_percentage}</div>
                        )}
                        {collection.fat_percentage && parseFloat(collection.fat_percentage) < 2.0 && !formErrors[rowIndex]?.fat_percentage && (
                          <div className="cell-warning">{t('warningFatPercentBelowMinRaw').replace('{min}', '2.0')}</div>
                        )}
                        {collection.fat_percentage && parseFloat(collection.fat_percentage) > 13.1 && (
                          <div className="cell-warning">{t('warningFatPercentAboveMaxRaw').replace('{max}', '13.1')}</div>
                        )}
                      </td>
                      <td className={`${formErrors[rowIndex]?.snf_percentage ? 'has-error' : ''} ${collection.isSnfFromClr || rateType === 'fat_clr' ? 'calculated-cell' : ''}`}>
                        <input
                          id={`snf_percentage_${rowIndex}`}
                          type="text"
                          className={`excel-cell-input ${rateType === 'fat_clr' ? 'auto-calculated' : ''}`}
                          placeholder="e.g. 85 ➞ 8.5"
                          value={collection.snf_percentage}
                          onChange={(e) => handleInputChange(rowIndex, 'snf_percentage', e.target.value)}
                          onFocus={() => handleCellFocus(rowIndex, 'snf_percentage')}
                          onBlur={(e) => handleCellBlur(rowIndex, 'snf_percentage', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, 'snf_percentage')}
                          readOnly={collection.isSnfFromClr || rateType === 'fat_clr'}
                          disabled={rateType === 'fat_clr'}
                        />
                        {collection.isSnfFromClr && <span className="calc-indicator">*</span>}
                        {formErrors[rowIndex]?.snf_percentage && (
                          <div className="cell-error">{formErrors[rowIndex].snf_percentage}</div>
                        )}
                        {collection.snf_percentage && parseFloat(collection.snf_percentage) < 4.0 && !formErrors[rowIndex]?.snf_percentage && (
                          <div className="cell-warning">{t('warningSnfPercentBelowMinRaw').replace('{min}', '4.0')}</div>
                        )}
                        {collection.snf_percentage && parseFloat(collection.snf_percentage) > 11.0 && (
                          <div className="cell-warning">{t('warningSnfPercentAboveMaxRaw').replace('{max}', '11.0')}</div>
                        )}
                      </td>
                      <td className={`${rateType === 'fat_snf' ? 'disabled-field' : ''} ${formErrors[rowIndex]?.clr ? 'has-error' : ''}`}>
                        <input
                          id={`clr_${rowIndex}`}
                          type="text"
                          className={`excel-cell-input ${rateType === 'fat_snf' ? 'disabled-input' : ''}`}
                          placeholder="e.g. 275 ➞ 27.5"
                          value={collection.clr}
                          onChange={(e) => handleInputChange(rowIndex, 'clr', e.target.value)}
                          onFocus={() => handleCellFocus(rowIndex, 'clr')}
                          onBlur={(e) => handleCellBlur(rowIndex, 'clr', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, 'clr')}
                          disabled={rateType === 'fat_snf'}
                          readOnly={rateType === 'fat_snf'}
                        />
                        {rateType === 'fat_snf' && <span className="disabled-indicator">N/A</span>}
                        {formErrors[rowIndex]?.clr && (
                          <div className="cell-error">{formErrors[rowIndex].clr}</div>
                        )}
                        {collection.clr && parseFloat(collection.clr) < 13.1 && !formErrors[rowIndex]?.clr && (
                          <div className="cell-warning">{t('warningClrBelowMin').replace('{min}', '13.1')}</div>
                        )}
                        {collection.clr && parseFloat(collection.clr) > 34.0 && (
                          <div className="cell-warning">{t('warningClrAboveMax').replace('{max}', '34.0')}</div>
                        )}
                      </td>
                      <td className={formErrors[rowIndex]?.base_snf_percentage ? 'has-error' : ''}>
                        <select
                          id={`base_snf_percentage_${rowIndex}`}
                          className="excel-cell-select"
                          value={collection.base_snf_percentage}
                          onChange={(e) => handleInputChange(rowIndex, 'base_snf_percentage', e.target.value)}
                          onFocus={() => handleCellFocus(rowIndex, 'base_snf_percentage')}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, 'base_snf_percentage')}
                        >
                          <option value="9.0">9.0</option>
                          <option value="9.1">9.1</option>
                          <option value="9.2">9.2</option>
                          <option value="9.3">9.3</option>
                          <option value="9.4">9.4</option>
                          <option value="9.5">9.5</option>
                        </select>
                        {formErrors[rowIndex]?.base_snf_percentage && (
                          <div className="cell-error">{formErrors[rowIndex].base_snf_percentage}</div>
                        )}
                      </td>
                      <td>
                        <select
                          id={`milk_type_${rowIndex}`}
                          className="excel-cell-select"
                          value={collection.milk_type}
                          onChange={(e) => handleInputChange(rowIndex, 'milk_type', e.target.value)}
                          onFocus={() => handleCellFocus(rowIndex, 'milk_type')}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, 'milk_type')}
                        >
                          <option value="cow">{t('cow')}</option>
                          <option value="buffalo">{t('buffalo')}</option>
                          <option value="cow_buffalo">{t('cowBuffalo')}</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className="delete-row-btn"
                          onClick={() => handleDeleteClick(collection)}
                          title={t('deleteThisRow')}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {collections.length > 0 && (
                  <tfoot>
                    <tr className="total-row">
                      <td colSpan="2" className="total-label">{t('totalWeight')}</td>
                      <td className="total-value weight-total" colSpan="2">
                        {collections.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0).toFixed(2)} {t('kg')}
                      </td>
                      <td colSpan="2" className="total-label">{t('totalRecords')}</td>
                      <td className="total-value" colSpan="3">
                        {collections.filter(c => rowHasData(c)).length}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </form>

        {showDeleteConfirmation && (
          <div className="modal-overlay">
            <div className="confirmation-modal">
              <div className="modal-header">
                <h3>{t('confirmDeletion')}</h3>
              </div>
              <div className="modal-body">
                <p>{t('areYouSureDeleteRow')}</p>
                <p className="warning-text">{t('actionCannotBeUndone')}</p>
              </div>
              <div className="modal-footer">
                <button
                  className="cancel-button"
                  onClick={() => {
                    setShowDeleteConfirmation(false);
                    setRowToDelete(null);
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  className="delete-button"
                  onClick={() => {
                    setCollections(collections.filter(c => c.id !== rowToDelete));
                    setShowDeleteConfirmation(false);
                    setRowToDelete(null);
                  }}
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          </div>
        )}

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
                <div className="form-instructions">
                  {t('pleaseFillCustomerDetails')}
                </div>
                <div className="form-group">
                  <label htmlFor="customer-name">{t('customerName')}</label>
                  <input
                    id="customer-name"
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => handleNewCustomerInputChange('name', e.target.value)}
                    placeholder="Enter customer name"
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="father-name">{t('fatherName')}</label>
                  <input
                    id="father-name"
                    type="text"
                    value={newCustomer.father_name}
                    onChange={(e) => handleNewCustomerInputChange('father_name', e.target.value)}
                    placeholder="Enter father's name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">{t('phoneNumber')}</label>
                  <input
                    id="phone"
                    type="text"
                    value={newCustomer.phone}
                    onChange={(e) => handleNewCustomerInputChange('phone', e.target.value)}
                    placeholder="Enter 10-digit phone number"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="village">{t('village')}</label>
                  <input
                    id="village"
                    type="text"
                    value={newCustomer.village}
                    onChange={(e) => handleNewCustomerInputChange('village', e.target.value)}
                    placeholder="Enter village name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="address">{t('address')}</label>
                  <input
                    id="address"
                    type="text"
                    value={newCustomer.address}
                    onChange={(e) => handleNewCustomerInputChange('address', e.target.value)}
                    placeholder="Enter full address"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowNewCustomerModal(false)}
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  className="save-button"
                  onClick={handleCreateCustomer}
                  disabled={submitting || !newCustomer.name.trim()}
                >
                  {submitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      <span>{t('savingCustomer')}</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} />
                      <span>{t('createCustomer')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showPreviewModal && (
          <div className="modal-overlay">
            <div className="preview-modal">
              <div className="modal-header">
                <h2>{t('previewCollections')}</h2>
                <button
                  className="close-modal-button"
                  onClick={() => setShowPreviewModal(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="modal-body">
                <div className="preview-header">
                  <p className="preview-info">{t('pleaseReviewBeforeSubmit')}</p>
                </div>

                <div className="preview-table-container">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Weight</th>
                        <th>Fat %</th>
                        <th>CLR</th>
                        <th>SNF %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewCollections.map((collection, index) => {
                        // Find customer name for display
                        const customer = customers.find(c => c.id === collection.customer) || {};
                        const customerName = customer.name || collection.customerDisplay || "Unknown Customer";

                        return (
                          <tr key={index} className="preview-data-row">
                            <td>{index + 1}</td>
                            <td>{customerName}</td>
                            <td>{collection.collection_date}</td>
                            <td>{collection.collection_time === 'morning' ? 'Morning' : 'Evening'}</td>
                            <td className="text-right">{parseFloat(collection.kg).toFixed(2)} kg</td>
                            <td className="text-right">{parseFloat(collection.fat_percentage).toFixed(2)} %</td>
                            <td className="text-right">{collection.clr ? parseFloat(collection.clr).toFixed(2) : 'N/A'}</td>
                            <td className="text-right">{parseFloat(collection.snf_percentage).toFixed(2)} %</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="8" className="total-label" style={{ textAlign: 'left' }}>
                          Total Weight: <span className="total-value" style={{ display: 'inline' }}>{previewCollections.reduce((sum, c) => sum + (parseFloat(c.kg) || 0), 0).toFixed(2)} kg</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="cancel-button"
                  onClick={() => setShowPreviewModal(false)}
                >
                  {t('cancel')}
                </button>
                <button
                  className="confirm-button"
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
                      <span>{t('confirmSubmit')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {submitting && (
          <div className="submission-progress-overlay">
            <div className="submission-progress-container">
              <div className="submission-spinner"></div>
              <div className="submission-status">{t('submittingCollections')}</div>
              <div className="submission-message">{currentSubmitMessage}</div>
              {submissionTotal > 0 && (
                <>
                  <div className="submission-progress-bar">
                    <div
                      className="submission-progress-value"
                      style={{ width: `${(submissionProgress / submissionTotal) * 100}%` }}
                    ></div>
                  </div>
                  <div className="submission-count">
                    {t('processingCollections').replace('{current}', submissionProgress).replace('{total}', submissionTotal)}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddRawCollection; 