import React, { useState, useEffect } from 'react';
import { getCustomers, createBulkCollections, getCurrentMarketPrice, updateMarketPrice, createCustomer } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrash,
  faSearch,
  faSpinner,
  faCheck,
  faExclamationTriangle,
  faEdit,
  faTimes,
  faSave
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import './BulkCollection.css';

const BulkCollection = () => {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomersList, setShowCustomersList] = useState(false);
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
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    father_name: '',
    phone: '',
    village: '',
    address: '',
  });


  useEffect(() => {
    // Fetch customers and current market price when component mounts
    fetchCustomers();
    fetchCurrentRate();
  }, []);

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

  // Handle customer search
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowCustomersList(query.length > 0);

    if (query.length > 0) {
      const filtered = customers.filter(customer => {
        const searchLower = query.toLowerCase();
        return (
          customer.customer_id?.toString().includes(searchLower) ||
          customer.name?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers([]);
    }
  };

  // Calculate SNF from CLR - Updated to match APK formula
  const calculateSnfFromClr = (clrValue, fatValue, conversionFactor = 0.14) => {
    // Ensure we have valid inputs
    if (!clrValue || !fatValue) {
      console.warn('Missing CLR or Fat for SNF calculation', { clrValue, fatValue });
      return null;
    }

    // Convert strings to numbers to ensure proper calculation
    const clr = parseFloat(clrValue);
    const fat = parseFloat(fatValue);

    // Additional validation for reasonable values
    if (isNaN(clr) || isNaN(fat) || clr <= 0 || fat <= 0) {
      console.warn('Invalid CLR or Fat values', { clrValue, fatValue });
      return null;
    }

    // SNF calculation formula from APK: SNF = (CLR / 4) + (fat × 0.20) + conversionFactor
    const calculatedSnf = (clr / 4) + (fat * 0.20) + conversionFactor;

    // Round to 2 decimal places for display
    return Math.round(calculatedSnf * 100) / 100;
  };

  // Calculate weight, fat_kg, snf_kg, and amount based on input values - Updated to match APK formulas
  const calculateDerivedValues = (collection, fatSnfRatio = '60/40', baseSnfPercentage = 9.0) => {
    const fat = parseFloat(collection.fat_percent) || 0;
    const snf = parseFloat(collection.snf_percent) || 0;
    const weight = parseFloat(collection.weight) || 0;
    const rate = parseFloat(collection.milk_rate) || currentRate || 0; // Use collection-specific rate

    // Get base SNF from collection or use default
    const collectionBaseSnf = parseFloat(collection.base_snf) || baseSnfPercentage;

    // Calculate fat_kg and snf_kg - APK formula
    const fatKg = Math.floor((weight * (fat / 100)) * 100) / 100;
    const snfKg = Math.floor((weight * (snf / 100)) * 100) / 100;

    // Get fat/SNF ratio percentages - APK formula
    const fatRatioPercent = fatSnfRatio === '60/40' ? 60 : 52;
    const snfRatioPercent = fatSnfRatio === '60/40' ? 40 : 48;

    // Calculate rates based on fat and SNF components - APK formula
    const fatRate = Math.floor((rate * fatRatioPercent / 6.5) * 100) / 100;
    const snfRate = Math.floor((rate * snfRatioPercent / collectionBaseSnf) * 100) / 100;

    // Calculate amount based on fat, snf rates and components - APK formula
    const amount = Math.round((fatKg * fatRate + snfKg * snfRate) * 100) / 100;

    // Calculate solid weight
    const solidWeight = (amount / rate).toFixed(3);

    return {
      fat_kg: fatKg,
      snf_kg: snfKg,
      fat_rate: fatRate,
      snf_rate: snfRate,
      solid_weight: solidWeight,
      amount: amount
    };
  };

  // Add a new empty collection form
  const addCollection = () => {
    // Get date from the most recent collection, or use current date if no collections exist
    const mostRecentDate = collections.length > 0
      ? collections[collections.length - 1].collection_date
      : new Date().toISOString().split('T')[0];

    // Get time from the most recent collection
    const mostRecentTime = collections.length > 0
      ? collections[collections.length - 1].collection_time
      : 'morning';

    // Get animal type from the most recent collection
    const mostRecentAnimalType = collections.length > 0
      ? collections[collections.length - 1].animal_type
      : 'cow';

    // Get base SNF from the most recent collection
    const mostRecentBaseSnf = collections.length > 0
      ? collections[collections.length - 1].base_snf
      : '9.0';

    const newCollection = {
      id: Date.now(), // temporary id for UI purposes
      customer: null,
      fat_percent: '',
      weight: '',
      snf_percent: '',
      clr: '',
      base_snf: mostRecentBaseSnf,
      collection_time: mostRecentTime,
      collection_date: mostRecentDate,
      animal_type: mostRecentAnimalType,
      milk_type: mostRecentAnimalType, // Adding required field
      measured: 'kg', // Adding required field
      liters: 0, // Will be calculated later
      kg: 0, // Will be calculated later
      fat_kg: 0, // Will be calculated later
      snf_kg: 0, // Will be calculated later
      milk_rate: currentRate || 0, // Custom rate, default to global rate
      amount: 0, // Will be calculated later
      isSnfFromClr: false // Flag to track if SNF is from CLR calculation
    };

    setCollections([...collections, newCollection]);
  };

  // Remove a collection form
  const removeCollection = (id) => {
    setCollections(collections.filter(c => c.id !== id));
  };

  // Handle customer selection for a specific collection
  const handleSelectCustomer = (collection, customer) => {
    const updatedCollections = collections.map(c => {
      if (c.id === collection.id) {
        return {
          ...c,
          customer: customer,
          customerDisplay: `${customer.customer_id} - ${customer.name}`
        };
      }
      return c;
    });

    setCollections(updatedCollections);
    setShowCustomersList(false);
    setSearchQuery('');
  };

  // Clear customer selection for a specific collection
  const handleClearCustomer = (collectionId) => {
    const updatedCollections = collections.map(c => {
      if (c.id === collectionId) {
        return {
          ...c,
          customer: null,
          customerDisplay: ''
        };
      }
      return c;
    });

    setCollections(updatedCollections);
  };

  // Handle form input changes
  const handleInputChange = (collectionId, field, value) => {
    const updatedCollections = collections.map(c => {
      if (c.id === collectionId) {
        let updatedCollection = { ...c, [field]: value };

        // Calculate SNF from CLR if CLR is updated
        if (field === 'clr' && value && c.fat_percent) {
          const calculatedSnf = calculateSnfFromClr(value, c.fat_percent);
          updatedCollection.snf_percent = calculatedSnf.toString();
          updatedCollection.isSnfFromClr = true; // Mark that SNF is calculated from CLR

          // Log the calculation for debugging
          console.log(`CLR: ${value}, Fat: ${c.fat_percent}, Calculated SNF: ${calculatedSnf}`);

          // Recalculate derived values if we have all necessary inputs
          if (updatedCollection.weight) {
            const derived = calculateDerivedValues(updatedCollection);
            updatedCollection = {
              ...updatedCollection,
              fat_kg: derived.fat_kg,
              snf_kg: derived.snf_kg,
              amount: derived.amount
            };
          }
        }

        // Recalculate SNF if fat is updated and CLR is present
        if (field === 'fat_percent' && value && c.clr) {
          const calculatedSnf = calculateSnfFromClr(c.clr, value);
          updatedCollection.snf_percent = calculatedSnf.toString();
          updatedCollection.isSnfFromClr = true; // Mark that SNF is calculated from CLR

          // Log the calculation for debugging
          console.log(`CLR: ${c.clr}, Fat: ${value}, Calculated SNF: ${calculatedSnf}`);

          // Recalculate derived values if we have all necessary inputs
          if (updatedCollection.weight) {
            const derived = calculateDerivedValues(updatedCollection);
            updatedCollection = {
              ...updatedCollection,
              fat_kg: derived.fat_kg,
              snf_kg: derived.snf_kg,
              amount: derived.amount
            };
          }
        }

        // If user manually changes SNF, reset the isSnfFromClr flag
        if (field === 'snf_percent') {
          updatedCollection.isSnfFromClr = false;

          // Recalculate derived values if we have all necessary inputs
          if (updatedCollection.fat_percent && updatedCollection.weight) {
            const derived = calculateDerivedValues(updatedCollection);
            updatedCollection = {
              ...updatedCollection,
              fat_kg: derived.fat_kg,
              snf_kg: derived.snf_kg,
              amount: derived.amount
            };
          }
        }

        // Update weight-related fields if weight changes
        if (field === 'weight' && value) {
          const weight = parseFloat(value);
          updatedCollection.kg = weight;
          updatedCollection.liters = weight; // Assuming 1:1 ratio for simplicity
        }

        // Special handling for milk_rate changes - always recalculate amount
        if (field === 'milk_rate') {
          const derived = calculateDerivedValues(updatedCollection);
          updatedCollection = {
            ...updatedCollection,
            amount: derived.amount
          };

          // Also update fat_kg and snf_kg if those values are available
          if (updatedCollection.fat_percent && updatedCollection.snf_percent && updatedCollection.weight) {
            updatedCollection = {
              ...updatedCollection,
              fat_kg: derived.fat_kg,
              snf_kg: derived.snf_kg
            };
          }
        }
        // Update dependent calculations if fat, snf, weight, or base_snf changes
        else if (['fat_percent', 'snf_percent', 'weight', 'base_snf'].includes(field) &&
          updatedCollection.fat_percent &&
          updatedCollection.snf_percent &&
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
      }
      return c;
    });

    setCollections(updatedCollections);

    // Clear any errors for this field
    if (formErrors[collectionId]?.[field]) {
      const updatedErrors = { ...formErrors };
      if (updatedErrors[collectionId]) {
        delete updatedErrors[collectionId][field];
      }
      setFormErrors(updatedErrors);
    }
  };

  // Validate a single collection
  const validateCollection = (collection, index) => {
    const errors = {};

    if (!collection.customer || !collection.customer.id) {
      errors.customer = 'Customer is required';
    }

    if (!collection.fat_percent) {
      errors.fat_percent = 'Fat percent is required';
    } else if (isNaN(collection.fat_percent) || parseFloat(collection.fat_percent) <= 0) {
      errors.fat_percent = 'Valid fat percent is required';
    }

    if (!collection.weight) {
      errors.weight = 'Weight is required';
    } else if (isNaN(collection.weight) || parseFloat(collection.weight) <= 0) {
      errors.weight = 'Valid weight is required';
    }

    // Only validate SNF if CLR is not provided
    const hasClr = collection.clr && !isNaN(parseFloat(collection.clr)) && parseFloat(collection.clr) > 0;

    if (!hasClr) {
      if (!collection.snf_percent) {
        errors.snf_percent = 'SNF percent is required';
      } else if (isNaN(collection.snf_percent) || parseFloat(collection.snf_percent) <= 0) {
        errors.snf_percent = 'Valid SNF percent is required';
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
      // Recalculate derived values to ensure accuracy
      const derived = calculateDerivedValues(collection);

      // Get fat and snf values
      const fat = parseFloat(collection.fat_percent) || 0;
      const snf = parseFloat(collection.snf_percent) || 0;
      const weight = parseFloat(collection.weight) || 0;
      const milkRate = parseFloat(collection.milk_rate) || 0;

      // Calculate fat_kg and snf_kg
      const fatKg = (weight * fat) / 100;
      const snfKg = (weight * snf) / 100;

      // Format milk_type correctly for API - use cow_buffalo instead of mixed
      const milk_type = collection.animal_type === 'cow+buffalo' ? 'cow_buffalo' : collection.animal_type;

      // Format the request payload to match the expected format exactly
      return {
        customer: collection.customer.id,
        collection_time: collection.collection_time,
        collection_date: collection.collection_date,
        animal_type: collection.animal_type,
        milk_type: milk_type,
        measured: 'kg',
        fat_percentage: fat,
        snf_percentage: snf,
        base_snf: collection.base_snf, // Include base SNF
        clr: parseFloat(collection.clr) || 0,  // Include CLR value
        weight: weight,
        kg: weight,
        liters: weight,  // Assuming 1:1 ratio for simplicity
        fat_kg: parseFloat(fatKg.toFixed(2)),
        snf_kg: parseFloat(snfKg.toFixed(2)),
        fat_rate: derived.fat_rate,
        snf_rate: derived.snf_rate,
        milk_rate: milkRate,
        amount: derived.amount,
        solid_weight: derived.solid_weight,
        is_pro_rata: false // Explicitly mark as regular collection (not pro-rata)
      };
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAllCollections()) {
      return;
    }

    setSubmitting(true);
    setSubmitError('');

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

      for (let i = 0; i < formattedCollections.length; i++) {
        try {
          // Submit a single collection
          await createBulkCollections([formattedCollections[i]]);

          // Increment success counter
          successCount++;

          // Remove submitted collection from state using captured snapshot
          setCollections(prevCollections => {
            // Find the collection with the matching ID from our captured snapshot
            const collectionToRemove = currentCollections[i];
            return prevCollections.filter(c => c.id !== collectionToRemove.id);
          });

          // Show success message using captured snapshot
          setCurrentSubmitMessage(`Collection for ${currentCollections[i].customerDisplay || 'customer'} submitted successfully!`);
          setSubmitSuccess(true);
          // Keep success message visible for a short time
          setTimeout(() => {
            setSubmitSuccess(false);
          }, 1000);

        } catch (error) {
          console.error(`Error submitting collection ${i + 1}:`, error);
          setSubmitError(`Failed to submit collection for ${currentCollections[i].customerDisplay || 'customer'}: ${error.error || 'Unknown error'}`);
          break; // Stop on first error
        }
      }

      if (successCount === formattedCollections.length) {
        // All collections were submitted successfully
        setSubmitError('');
        setSubmitSuccess(true);
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      }

    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(error.error || 'Failed to submit collections. Please try again.');
    } finally {
      setSubmitting(false);
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
          setSubmitError(error.error || 'Failed to update milk rate. Please try again.');
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

  // Handle custom rate input change
  const handleRateChange = (e) => {
    setCustomRate(e.target.value);
  };

  // Update amounts in all collections when global rate changes
  const updateCollectionAmounts = (newRate) => {
    if (collections.length === 0) return;

    const updatedCollections = collections.map(collection => {
      // Only update collections that don't have a custom rate set
      if (collection.milk_rate === currentRate) {
        const updatedCollection = {
          ...collection,
          milk_rate: newRate
        };
        const derived = calculateDerivedValues(updatedCollection);
        return {
          ...updatedCollection,
          fat_kg: derived.fat_kg,
          snf_kg: derived.snf_kg,
          amount: derived.amount
        };
      }
      return collection;
    });

    setCollections(updatedCollections);
  };

  // Handle creating a new customer
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

      // Select the new customer for the current collection
      if (response && currentCollection) {
        handleSelectCustomer(currentCollection, response);
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

      // Refresh customers list
      fetchCustomers();
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

  if (loading || isLoadingRate) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="bulk-collection-container">
      <header className="bulk-collection-header">
        {/* <button className="back-button" onClick={goBack}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>{t('backToDashboard')}</span>
        </button> */}
        <h1>{t('bulkCollection')}</h1>
        <div className="header-actions">
          <LanguageSwitcher />
        </div>
      </header>

      <div className="bulk-collection-content">
        {submitSuccess && (
          <div className="success-message">
            <FontAwesomeIcon icon={faCheck} />
            <span>{currentSubmitMessage || t('collectionsSubmittedSuccessfully')}</span>
          </div>
        )}

        {submitError && (
          <div className="error-message">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <span>{submitError}</span>
          </div>
        )}

        <div className="current-rate-info">
          {isEditingRate ? (
            <div className="rate-edit">
              <label htmlFor="rate-input">{t('milkRate')} ({t('currency')}): </label>
              <input
                id="rate-input-milk"
                type="number"
                step="0.1"
                min="0"
                value={customRate}
                onChange={handleRateChange}
                className="rate-input"
                autoFocus
                disabled={submitting}
              />
              <button
                type="button"
                onClick={toggleRateEdit}
                className="save-rate-button"
                disabled={submitting}
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
              <p>{t('currentMilkRate')}: {t('currency')}{currentRate || '0'}</p>
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

        <form onSubmit={handleSubmit}>
          <div className="collections-container">
            {collections.length === 0 ? (
              <div className="no-collections">
                <p>{t('noCollectionsAdded')}</p>
              </div>
            ) : (
              collections.map((collection, index) => (
                <div className="collection-form" key={collection.id}>
                  <div className="collection-header">
                    <h3>{t('bulkCollection')} #{index + 1}</h3>
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeCollection(collection.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('customer')}</label>
                      <div className="customer-search-container">
                        <input
                          type="text"
                          placeholder={t('searchCustomer')}
                          value={collection.customerDisplay || searchQuery}
                          onChange={handleSearch}
                          className={formErrors[collection.id]?.customer ? 'error' : ''}
                        />
                        {collection.customer ? (
                          <button
                            type="button"
                            className="clear-customer-button"
                            onClick={() => handleClearCustomer(collection.id)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        ) : (
                          <FontAwesomeIcon icon={faSearch} className="search-icon" />
                        )}

                        {showCustomersList && (
                          <div className="customers-dropdown">
                            {filteredCustomers.length > 0 ? (
                              <>
                                {filteredCustomers.map(customer => (
                                  <div
                                    key={customer.id}
                                    className="customer-item"
                                    onClick={() => handleSelectCustomer(collection, customer)}
                                  >
                                    {customer.customer_id} - {customer.name}
                                  </div>
                                ))}
                                <div
                                  className="customer-item add-new-customer"
                                  onClick={() => {
                                    setCurrentCollection(collection);
                                    setShowNewCustomerModal(true);
                                    setShowCustomersList(false);
                                  }}
                                >
                                  <FontAwesomeIcon icon={faPlus} /> {t('addNewCustomer')}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="no-results">{t('noCustomersFound')}</div>
                                <div
                                  className="customer-item add-new-customer"
                                  onClick={() => {
                                    setCurrentCollection(collection);
                                    setShowNewCustomerModal(true);
                                    setShowCustomersList(false);
                                  }}
                                >
                                  <FontAwesomeIcon icon={faPlus} /> {t('addNewCustomer')}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {formErrors[collection.id]?.customer && (
                        <span className="error-text">{formErrors[collection.id].customer}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('date')}</label>
                      <input
                        type="date"
                        value={collection.collection_date}
                        onChange={(e) => handleInputChange(collection.id, 'collection_date', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('time')}</label>
                      <select
                        value={collection.collection_time}
                        onChange={(e) => handleInputChange(collection.id, 'collection_time', e.target.value)}
                      >
                        <option value="morning">{t('morning')}</option>
                        <option value="evening">{t('evening')}</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>{t('animalType')}</label>
                      <select
                        value={collection.animal_type}
                        onChange={(e) => handleInputChange(collection.id, 'animal_type', e.target.value)}
                      >
                        <option value="cow">{t('cow')}</option>
                        <option value="buffalo">{t('buffalo')}</option>
                        <option value="cow+buffalo">{t('cowBuffalo')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('weight')}</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder={t('egTenPointFive')}
                        value={collection.weight}
                        onChange={(e) => handleInputChange(collection.id, 'weight', e.target.value)}
                        className={formErrors[collection.id]?.weight ? 'error' : ''}
                      />
                      {formErrors[collection.id]?.weight && (
                        <span className="error-text">{formErrors[collection.id].weight}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>{t('fatPercentage')}</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder={t('egThreePointFive')}
                        value={collection.fat_percent}
                        onChange={(e) => handleInputChange(collection.id, 'fat_percent', e.target.value)}
                        className={formErrors[collection.id]?.fat_percent ? 'error' : ''}
                      />
                      {formErrors[collection.id]?.fat_percent && (
                        <span className="error-text">{formErrors[collection.id].fat_percent}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>{t('clr')}</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder={t('egTwentySevenPointZero')}
                        value={collection.clr}
                        onChange={(e) => handleInputChange(collection.id, 'clr', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('snfPercentage')}</label>
                      <div className={`snf-input-container ${collection.isSnfFromClr ? 'calculated-snf' : ''}`}>
                        <input
                          type="number"
                          step="0.1"
                          placeholder={t('egEightPointFive')}
                          value={collection.snf_percent}
                          onChange={(e) => handleInputChange(collection.id, 'snf_percent', e.target.value)}
                          className={formErrors[collection.id]?.snf_percent ? 'error' : ''}
                        />
                        {collection.isSnfFromClr && (
                          <span className="snf-source-label">{t('fromCLR')}</span>
                        )}
                      </div>
                      {formErrors[collection.id]?.snf_percent && (
                        <span className="error-text">{formErrors[collection.id].snf_percent}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('baseSNF')}</label>
                      <select
                        value={collection.base_snf}
                        onChange={(e) => handleInputChange(collection.id, 'base_snf', e.target.value)}
                      >
                        <option value="9.0">9.0</option>
                        <option value="9.1">9.1</option>
                        <option value="9.2">9.2</option>
                        <option value="9.3">9.3</option>
                        <option value="9.4">9.4</option>
                        <option value="9.5">9.5</option>
                      </select>
                    </div>

                    <div className="form-group calculation-result">
                      <label>{t('fatKg')}</label>
                      <div className="calculated-value">
                        {collection.fat_kg ? collection.fat_kg.toFixed(2) : '0.00'}
                      </div>
                    </div>

                    <div className="form-group calculation-result">
                      <label>{t('snfKg')}</label>
                      <div className="calculated-value">
                        {collection.snf_kg ? collection.snf_kg.toFixed(2) : '0.00'}
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group calculation-result">
                      <label>{t('rate')}</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder={t('egFiftyFivePointZero')}
                        value={collection.milk_rate}
                        onChange={(e) => handleInputChange(collection.id, 'milk_rate', e.target.value)}
                        className="rate-input"
                      />
                    </div>

                    <div className="form-group calculation-result">
                      <label>{t('amount')}</label>
                      <div className="calculated-value amount">
                        {collection.amount ? collection.amount.toFixed(2) : '0.00'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="actions">
            <button
              type="button"
              className="add-collection-button"
              onClick={addCollection}
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>{t('addCollection')}</span>
            </button>

            {collections.length > 0 && (
              <button
                type="submit"
                className="submit-button"
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
                    <span>{t('submitAll')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

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
              <div className="form-group">
                <label htmlFor="customer-name">{t('name')} *</label>
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
                <label htmlFor="father-name">{t('fatherName')}</label>
                <input
                  id="father-name"
                  type="text"
                  value={newCustomer.father_name}
                  onChange={(e) => handleNewCustomerInputChange('father_name', e.target.value)}
                  placeholder={t('enterFatherName')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">{t('phoneNumber')}</label>
                <input
                  id="phone"
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => handleNewCustomerInputChange('phone', e.target.value)}
                  placeholder={t('enter10DigitPhone')}
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
    </div>
  );
};

export default BulkCollection; 