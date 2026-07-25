import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../contexts/LanguageContext';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    fieldValue,
    description
}) => {
    const { t } = useLanguage();
    if (!isOpen) return null;

    return (
        <div className="confirmation-modal-overlay" onClick={onClose}>
            <div className="confirmation-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="confirmation-modal-header">
                    <h3>{title}</h3>
                    <button className="confirmation-modal-close-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <div className="confirmation-modal-body">
                    <p className="confirmation-modal-message">{message}</p>
                    <div className="confirmation-modal-value-display">
                        {fieldValue}
                    </div>
                    <p className="confirmation-modal-description">{description}</p>
                </div>
                <div className="confirmation-modal-footer">
                    <button className="confirmation-modal-cancel-btn" onClick={onClose}>
                        {t('cancel')}
                    </button>
                    <button className="confirmation-modal-confirm-btn" onClick={onConfirm}>
                        {t('confirm')}
                    </button>
                </div>
            </div>
        </div>

    );
};

export default ConfirmationModal;
