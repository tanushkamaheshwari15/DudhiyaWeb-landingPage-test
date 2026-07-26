import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  generateProRataPurchaseReport,
  generateProRataPurchaseSummaryReport,
  generateProRataFullReport,
  generateProRataCustomerBills,
  getDairyInfo,
  getSuppliers,
  generateSupplierBillsReport,
  updateSupplier
} from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileAlt,
  faFileInvoice,
  faFileContract,
  faFilePdf,
  // faCalendarAlt, 
  faTimes,
  faSpinner,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import './ProRataReportGenerator.css';

const ProRataReportGenerator = ({ variant = 'dashboard' }) => {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dairyName, setDairyName] = useState('');
  const [includeBRate, setIncludeBRate] = useState(true);

  // Supplier bills state
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [showSupplierDetailsModal, setShowSupplierDetailsModal] = useState(false);
  const [isEditingSupplier, setIsEditingSupplier] = useState(false);
  const [editedSupplier, setEditedSupplier] = useState(null);

  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Report types
  const reportTypes = [
    { id: 'full', name: t('fullReportPro'), icon: faFileAlt, description: t('viewCompleteCollectionReport') },
    { id: 'purchase', name: t('purchaseReportDayWisePro'), icon: faFileInvoice, description: t('viewCollectionsByDate') },
    { id: 'summary', name: t('purchaseSummarySupplierWisePro'), icon: faFileContract, description: t('viewCollectionsAsPerSupplier') },
    { id: 'bills', name: t('allSupplierBillPro'), icon: faFilePdf, description: t('viewComprehensiveSupplierBills') },
    { id: 'supplier_bills', name: t('supplierBillsPro'), icon: faFilePdf, description: t('viewIndividualSupplierBills') }
  ];

  // Fetch dairy info when component mounts
  useEffect(() => {
    const fetchDairyInfo = async () => {
      try {
        const dairyInfo = await getDairyInfo();
        if (dairyInfo && dairyInfo.dairy_name) {
          // Convert to lowercase and replace spaces with underscores for filename
          setDairyName(dairyInfo.dairy_name.toLowerCase().replace(/\s+/g, '_'));
        }
      } catch (error) {
        console.error('Error fetching dairy info:', error);
        setDairyName('dairy');
      }
    };

    fetchDairyInfo();
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
    setSelectedReport(null);
    setShowDateFilter(false);
    setError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShowDateFilter(false);
    setSelectedReport(null);
    setFromDate('');
    setToDate('');
    setError(null);
    setIncludeBRate(true);
  };

  const handleSelectReport = (report) => {
    if (report.id === 'supplier_bills') {
      openSupplierModal();
    } else {
      setSelectedReport(report);
      setShowDateFilter(true);
    }
  };

  const backToReportSelection = () => {
    setSelectedReport(null);
    setShowDateFilter(false);
    setFromDate('');
    setToDate('');
    setError(null);
    setIncludeBRate(true);
  };

  const formatDateForAPI = (dateString) => {
    // Convert YYYY-MM-DD to DD-MM-YYYY for API
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  const formatDateForFilename = (dateString) => {
    // Convert YYYY-MM-DD to MonthName-Day format (e.g., April30)
    if (!dateString) return '';

    const date = new Date(dateString);
    const monthNames = [
      t('january'), t('february'), t('march'), t('april'), t('may'), t('june'),
      t('july'), t('august'), t('september'), t('october'), t('november'), t('december')
    ];

    const monthName = monthNames[date.getMonth()];
    const day = date.getDate();

    return `${monthName}${day}`;
  };

  const getReportTypeString = (reportId) => {
    switch (reportId) {
      case 'full':
        return 'full_report';
      case 'purchase':
        return 'purchase_report';
      case 'summary':
        return 'summary_report';
      case 'bills':
        return 'milk_bills';
      default:
        return reportId;
    }
  };

  const downloadReport = async () => {
    if (!fromDate || !toDate) {
      setError(t('pleaseSelectBothStartAndEndDates'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Format dates for API (DD-MM-YYYY)
      const formattedFromDateForAPI = formatDateForAPI(fromDate);
      const formattedToDateForAPI = formatDateForAPI(toDate);

      let response;

      switch (selectedReport.id) {
        case 'purchase':
          response = await generateProRataPurchaseReport(formattedFromDateForAPI, formattedToDateForAPI, includeBRate);
          break;
        case 'summary':
          response = await generateProRataPurchaseSummaryReport(formattedFromDateForAPI, formattedToDateForAPI, includeBRate);
          break;
        case 'full':
          response = await generateProRataFullReport(formattedFromDateForAPI, formattedToDateForAPI, includeBRate);
          break;
        case 'bills':
          response = await generateProRataCustomerBills(formattedFromDateForAPI, formattedToDateForAPI, includeBRate);
          break;
        default:
          throw new Error(t('invalidReportTypeSelected'));
      }

      // Create a blob from the response data
      const blob = new Blob([response.data], { type: 'application/pdf' });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;

      // Format dates for filename (MonthName-Day)
      const formattedFromDateForFilename = formatDateForFilename(fromDate);
      const formattedToDateForFilename = formatDateForFilename(toDate);
      const year = new Date(toDate).getFullYear();
      const reportType = getReportTypeString(selectedReport.id);

      // Set the download file name with format: dairy_name-report_type-FromDate-ToDate-Year
      const fileName = `${dairyName}-${reportType}-${formattedFromDateForFilename}-${formattedToDateForFilename}-${year}.pdf`;
      link.setAttribute('download', fileName);

      // Append the link to the document body
      document.body.appendChild(link);

      // Click the link to start the download
      link.click();

      // Clean up: remove the link element and revoke the blob URL
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Close the modal after successful download
      closeModal();
    } catch (err) {
      let errorMessage = t('failedToGenerateReport');

      if (err.error) {
        errorMessage = err.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Supplier-related functions
  const openSupplierModal = async () => {
    setShowSupplierModal(true);
    setLoadingSuppliers(true);
    try {
      const suppliersData = await getSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      setError(t('failedToLoadSuppliers'));
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const closeSupplierModal = () => {
    setShowSupplierModal(false);
    setSelectedSupplier(null);
  };

  const selectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setShowSupplierModal(false);
    setShowSupplierDetailsModal(true);
  };

  const closeSupplierDetailsModal = () => {
    setShowSupplierDetailsModal(false);
    setSelectedSupplier(null);
    setIsEditingSupplier(false);
    setEditedSupplier(null);
  };

  const startEditSupplier = () => {
    setIsEditingSupplier(true);
    setEditedSupplier({ ...selectedSupplier });
  };

  const cancelEditSupplier = () => {
    setIsEditingSupplier(false);
    setEditedSupplier(null);
  };

  const saveSupplierChanges = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call API to update supplier in backend
      await updateSupplier(editedSupplier.id, {
        name: editedSupplier.name,
        fathers_name: editedSupplier.fathers_name,
        phone: editedSupplier.phone,
        village: editedSupplier.village,
        address: editedSupplier.address
      });

      // Update local state with the changes
      const updatedSuppliers = suppliers.map(supplier =>
        supplier.id === editedSupplier.id ? editedSupplier : supplier
      );
      setSuppliers(updatedSuppliers);
      setSelectedSupplier(editedSupplier);
      setIsEditingSupplier(false);
      setEditedSupplier(null);
    } catch (error) {
      setError(error.error || error.message || t('failedToUpdateSupplierInformation'));
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierFieldChange = (field, value) => {
    setEditedSupplier(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const downloadSupplierReport = async () => {
    if (!fromDate || !toDate) {
      setError(t('pleaseSelectDateRangeForReport'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const s = formatDateForAPI(fromDate);
      const e = formatDateForAPI(toDate);
      const response = await generateSupplierBillsReport(selectedSupplier.id, s, e, includeBRate);

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fromName = formatDateForFilename(fromDate);
      const toName = formatDateForFilename(toDate);
      const year = new Date(toDate).getFullYear();
      link.setAttribute('download', `${dairyName}-pro_rata_supplier_bills_${selectedSupplier.name}-${fromName}-${toName}-${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      closeSupplierDetailsModal();
    } catch (err) {
      // Handle specific error cases
      if (err.error === 'The requested resource was not found.') {
        setError(t('noDataFoundForTheSelectedSupplierInTheSelectedDateRange'));
      } else {
        setError(err.error || err.message || t('failedToGenerateSupplierReport'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pro-rata-report-generator">
      {variant === 'inline' ? (
        <button className="filter-button pro-rata-button" onClick={openModal}>
          <FontAwesomeIcon icon={faFileAlt} />
          <span>{t('generateProRataReport')}</span>
        </button>
      ) : (
        <button
          className="premium-action-btn secondary-btn"
          onClick={openModal}
        >
          <FontAwesomeIcon icon={faFileAlt} />
          <span>{t('generateProRataReport')}</span>
        </button>
      )}

      {isModalOpen && ReactDOM.createPortal(
        <div className="modal-overlay">
          <div className="report-modal-content">
            <div className="report-modal-header">
              <h2>
                {showDateFilter
                  ? `${t('generateReport')}: ${selectedReport.name}`
                  : t('selectReportTypeProRata')}
              </h2>
              <button className="modal-close-button" onClick={closeModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {showDateFilter ? (
              <div className="report-date-filter-container">
                <div className="back-button-container">
                  <button className="back-to-reports-button" onClick={backToReportSelection}>
                    {t('backToReportSelection')}
                  </button>
                </div>

                <div className="report-info">
                  <FontAwesomeIcon icon={selectedReport.icon} className="report-icon" />
                  <div className="report-info-text">
                    <h3>{selectedReport.name}</h3>
                    <p>{selectedReport.description}</p>
                  </div>
                </div>

                <div className="date-inputs-container">
                  <div className="date-input-group">
                    <label>{t('fromDate')}</label>
                    <div className="date-input-wrapper" onClick={() => document.getElementById('from-date-input').showPicker()}>
                      {/* <FontAwesomeIcon icon={faCalendarAlt} className="date-icon" /> */}
                      <input
                        id="from-date-input"
                        type="date"
                        className="date-input"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="date-input-group">
                    <label>{t('toDate')}</label>
                    <div className="date-input-wrapper" onClick={() => document.getElementById('to-date-input').showPicker()}>
                      {/* <FontAwesomeIcon icon={faCalendarAlt} className="date-icon" /> */}
                      <input
                        id="to-date-input"
                        type="date"
                        className="date-input"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {selectedReport.id !== 'purchase' && selectedReport.id !== 'summary' && (
                  <div className="brate-toggle-container">
                    <label className="brate-toggle-label">
                      <input
                        type="checkbox"
                        className="brate-toggle-input"
                        checked={includeBRate}
                        onChange={(e) => setIncludeBRate(e.target.checked)}
                      />
                      <span className="brate-toggle-slider"></span>
                      <span className="brate-toggle-text">{t('includeMilkRateBRateColumn')}</span>
                    </label>
                  </div>
                )}

                {error && <div className="report-error-message">{error}</div>}

                <div className="report-actions">
                  <button
                    className="secondary-button-generate"
                    onClick={backToReportSelection}
                    disabled={loading}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    className="primary-button-generate"
                    onClick={downloadReport}
                    disabled={loading || !fromDate || !toDate}
                  >
                    {loading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                        {t('generating')}
                      </>
                    ) : (
                      t('generateReport')
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="report-selection-container">
                <div className="report-types-grid">
                  {reportTypes.map(report => (
                    <div
                      key={report.id}
                      className="report-type-card"
                      onClick={() => handleSelectReport(report)}
                    >
                      <FontAwesomeIcon icon={report.icon} className="report-icon" />
                      <h3>{report.name}</h3>
                      <p>{report.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Supplier Selection Modal */}
      {showSupplierModal && ReactDOM.createPortal(
        <div className="modal-overlay">
          <div className="report-modal-content">
            <div className="report-modal-header">
              <h2>{t('selectSupplierPro')}</h2>
              <button className="modal-close-button" onClick={closeSupplierModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="supplier-selection-container">
              {loadingSuppliers ? (
                <div className="loading-container">
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>{t('loadingSuppliers')}</span>
                </div>
              ) : (
                <>
                  {/* Search Input */}
                  <div className="supplier-search-container">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search suppliers..."
                      value={supplierSearchTerm}
                      onChange={(e) => setSupplierSearchTerm(e.target.value)}
                      className="supplier-search-input"
                    />
                  </div>

                  <div className="suppliers-grid">
                    {suppliers
                      .filter(supplier =>
                        supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
                        (supplier.customer_id && supplier.customer_id.toString().includes(supplierSearchTerm))
                      )
                      .map(supplier => (
                        <div key={supplier.id} className="supplier-card" onClick={() => selectSupplier(supplier)}>
                          <div className="supplier-info">
                            <h3>{supplier.name}</h3>
                            {/* <p><strong>Database ID:</strong> {supplier.id}</p> */}
                            <p><strong>{t('customerId')}:</strong> {supplier.customer_id}</p>
                            {/* <p><strong>{t('fathersName')}:</strong> {supplier.fathers_name || t('notSpecified')}</p> */}
                            <p><strong>{t('phone')}:</strong> {supplier.phone || t('notSpecified')}</p>
                            {/* <p><strong>Village:</strong> {supplier.village || 'Not specified'}</p> */}
                            {/* <p><strong>Address:</strong> {supplier.address || 'Not specified'}</p> */}
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
            {/* {error && <div className="report-error-message">{error}</div> */}
          </div>
        </div>,
        document.body
      )}

      {/* Supplier Details Modal */}
      {showSupplierDetailsModal && selectedSupplier && ReactDOM.createPortal(
        <div className="modal-overlay">
          <div className="report-modal-content">
            <div className="report-modal-header">
              <h2>{selectedSupplier.name} - {t('supplierBillsPro')}</h2>
              <button className="modal-close-button" onClick={closeSupplierDetailsModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {error && <div className="report-error-message">{error}</div>}
            <div className="supplier-details-container">
              <div className="supplier-info-section">
                <h3>{t('supplierInformation')}</h3>
                <div className="supplier-details">
                  {isEditingSupplier ? (
                    <div className='edit-supplier-report'>
                      {/* <div className="editable-field">
                        <label>{t('id')}:</label>
                        <input
                          type="text"
                          value={editedSupplier.id}
                          onChange={(e) => handleSupplierFieldChange('id', e.target.value)}
                          className="supplier-input"
                          disabled
                        />
                      </div> */}
                      <div className="editable-field">
                        <label>{t('name')}:</label>
                        <input
                          type="text"
                          value={editedSupplier.name}
                          onChange={(e) => handleSupplierFieldChange('name', e.target.value)}
                          className="supplier-input"
                        />
                      </div>
                      <div className="editable-field">
                        <label>{t('fathersName')}:</label>
                        <input
                          type="text"
                          value={editedSupplier.fathers_name || ''}
                          onChange={(e) => handleSupplierFieldChange('fathers_name', e.target.value)}
                          className="supplier-input"
                          placeholder={t('enterFatherName')}

                        />
                      </div>
                      <div className="editable-field">
                        <label>{t('phone')}:</label>
                        <input
                          type="text"
                          value={editedSupplier.phone || ''}
                          onChange={(e) => handleSupplierFieldChange('phone', e.target.value)}
                          className="supplier-input"
                          placeholder={t('enter10DigitPhone')}
                          maxLength="10"
                        />
                      </div>
                      <div className="editable-field">
                        <label>{t('village')}:</label>
                        <input
                          type="text"
                          value={editedSupplier.village || ''}
                          onChange={(e) => handleSupplierFieldChange('village', e.target.value)}
                          className="supplier-input"
                          placeholder={t('enterVillageName')}
                        />
                      </div>
                      <div className="editable-field full-width">
                        <label>{t('address')}:</label>
                        <textarea
                          value={editedSupplier.address || ''}
                          onChange={(e) => handleSupplierFieldChange('address', e.target.value)}
                          className="supplier-textarea"
                          placeholder={t('enterCompleteAddress')}
                          rows="3"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p><strong>{t('customerID')}:</strong> {selectedSupplier.customer_id}</p>
                      <p><strong>{t('name')}:</strong> {selectedSupplier.name}</p>
                      <p><strong>{t('fathersName')}:</strong> {selectedSupplier.fathers_name || t('notSpecified')}</p>
                      <p><strong>{t('phone')}:</strong> {selectedSupplier.phone || t('notSpecified')}</p>
                      {/* <p><strong>{t('village')}:</strong> {selectedSupplier.village || t('notSpecified')}</p> */}
                      {/* <p><strong>{t('address')}:</strong> {selectedSupplier.address || t('notSpecified')}</p> */}
                    </>
                  )}
                </div>
              </div>

              <div className="supplier-actions-section">
                {isEditingSupplier ? (
                  <>
                    <button className="cancel-edit-btn" onClick={cancelEditSupplier}>
                      <FontAwesomeIcon icon={faTimes} />
                      {t('cancel')}
                    </button>
                    <button className="save-supplier-btn" onClick={saveSupplierChanges}>
                      <FontAwesomeIcon icon={faFileInvoice} />
                      {t('save')}
                    </button>
                  </>
                ) : (
                  <>
                    <button className="edit-supplier-btn" onClick={startEditSupplier}>
                      <FontAwesomeIcon icon={faFileInvoice} />
                      {t('editSupplierInfo')}
                    </button>
                    <button className="download-supplier-report-btn" onClick={downloadSupplierReport} disabled={loading}>
                      {loading ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} spin />
                          <span>{t('generating')}</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faFilePdf} />
                          <span>{t('downloadReport')}</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

              {!isEditingSupplier && (
                <>
                  <div className="brate-toggle-container">
                    <label className="brate-toggle-label">
                      <input
                        type="checkbox"
                        className="brate-toggle-input"
                        checked={includeBRate}
                        onChange={(e) => setIncludeBRate(e.target.checked)}
                      />
                      <span className="brate-toggle-slider"></span>
                      <span className="brate-toggle-text">{t('includeMilkRateBRateColumn')}</span>
                    </label>
                  </div>
                  <div className="date-inputs-container">
                    <div className="date-input-group">
                      <label>{t('fromDate')}</label>
                      <div className="date-input-wrapper" onClick={() => document.getElementById('supplier-from-date').showPicker()}>
                        <input id="supplier-from-date" type="date" className="date-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="date-input-group">
                      <label>{t('toDate')}</label>
                      <div className="date-input-wrapper" onClick={() => document.getElementById('supplier-to-date').showPicker()}>
                        <input id="supplier-to-date" type="date" className="date-input" value={toDate} onChange={e => setToDate(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProRataReportGenerator;