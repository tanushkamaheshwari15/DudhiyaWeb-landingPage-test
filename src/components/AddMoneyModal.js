import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faTag,
  faSync,
  faInfoCircle,
  faSpinner,
  faArrowRight,
  faHeadphones,
  faPhone,
  faGift,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { addMoneyToWallet, getWalletBalance } from '../services/api';
import './AddMoneyModal.css';

export default function AddMoneyModal({
  isOpen,
  onClose,
  walletBalance: initialWalletBalance,
  refreshWalletBalance,
  isRefreshingBalance,
  userInfo,
  dairyInfo
}) {
  const { t } = useLanguage();

  // Internal states
  const [walletBalance, setWalletBalance] = useState(initialWalletBalance);
  const [addFundsAmount, setAddFundsAmount] = useState("1000");
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [addFundsError, setAddFundsError] = useState("");
  const [paymentFeedback, setPaymentFeedback] = useState({ type: '', message: '' });
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Sync initial wallet balance prop with local state
  useEffect(() => {
    setWalletBalance(initialWalletBalance);
  }, [initialWalletBalance]);

  // Handle balance refresh locally
  const handleLocalRefresh = async () => {
    if (refreshWalletBalance) {
      refreshWalletBalance();
    } else {
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
      }
    }
  };

  // Open Razorpay Checkout modal
  const openRazorpayCheckout = (orderId, keyId, amount) => {
    const options = {
      key: keyId,
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      name: dairyInfo?.dairy_name || 'Dudhiya',
      description: 'Add money to wallet',
      order_id: orderId,
      handler: async function (response) {
        console.log('Payment successful:', response);
        setPaymentFeedback({
          type: 'success',
          message: `✅ ${t('paymentSuccessful')}`
        });

        // Auto-close Razorpay modal after 2 seconds
        setTimeout(() => {
          try {
            const razorpayContainer = document.querySelector('[data-testid="razorpay-container"]') ||
              document.querySelector('.razorpay-modal') ||
              document.querySelector('.razorpay-checkout-modal');

            if (razorpayContainer) {
              razorpayContainer.remove();
            }

            const closeButton = document.querySelector('.razorpay-modal-close') ||
              document.querySelector('[data-testid="razorpay-close"]') ||
              document.querySelector('.modal-close');

            if (closeButton) {
              closeButton.click();
            }

            document.querySelectorAll('.razorpay-overlay, .razorpay-modal').forEach(el => el.remove());
          } catch (error) {
            console.warn('Could not auto-close Razorpay modal:', error);
          }
        }, 2000);

        // Wait 5 seconds for backend to process, then refresh balance
        setTimeout(async () => {
          await handleLocalRefresh();
          // Close modal and reload page on success
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 1000);
        }, 5000);
      },
      prefill: {
        name: userInfo?.name || '',
        contact: userInfo?.phone_number || ''
      },
      theme: {
        color: '#6200cc'
      },
      modal: {
        ondismiss: function () {
          setPaymentFeedback({
            type: 'error',
            message: t('paymentCancelled')
          });
          setIsRazorpayLoading(false);
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function (response) {
      console.error('Payment failed:', response.error);
      setPaymentFeedback({
        type: 'error',
        message: `${t('paymentFailed')}: ${response.error.description || t('paymentFailed')}`
      });
      setIsRazorpayLoading(false);
    });

    razorpay.open();
  };

  // Process Add Funds
  const handleAddFundsSubmit = async (amountInRupees) => {
    if (!amountInRupees || amountInRupees < 1) {
      setAddFundsError(t('enterValidAmount'));
      return;
    }

    try {
      setIsRazorpayLoading(true);
      setAddFundsError("");
      setPaymentFeedback({ type: '', message: '' });

      // Create payment link via API
      const response = await addMoneyToWallet(amountInRupees);

      if (response.payment_link) {
        let orderId = response.order_id || null;
        let razorpayKey = response.razorpay_key_id || response.key_id || null;

        // If Razorpay SDK is loaded, open checkout modal
        if (window.Razorpay && orderId && razorpayKey) {
          openRazorpayCheckout(orderId, razorpayKey, amountInRupees);
        } else {
          // Popup window fallback
          console.log('Opening payment link in popup:', response.payment_link);
          const width = 500;
          const height = 700;
          const left = (window.screen.width - width) / 2;
          const top = (window.screen.height - height) / 2;

          const paymentWindow = window.open(
            response.payment_link,
            'RazorpayPayment',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
          );

          if (paymentWindow) {
            const checkWindowClosed = setInterval(() => {
              if (paymentWindow.closed) {
                clearInterval(checkWindowClosed);
                setIsRazorpayLoading(false);

                // Check success by fetching balance
                setTimeout(async () => {
                  try {
                    const previousBalance = walletBalance || 0;
                    const walletResponse = await getWalletBalance();
                    let newBalance = null;
                    if (walletResponse && walletResponse.balance !== undefined) {
                      newBalance = walletResponse.balance;
                    } else if (walletResponse && walletResponse.amount !== undefined) {
                      newBalance = walletResponse.amount;
                    } else if (walletResponse && typeof walletResponse === 'number') {
                      newBalance = walletResponse;
                    }
                    setWalletBalance(newBalance);

                    const paymentAmount = parseFloat(amountInRupees);
                    const balanceDifference = parseFloat(newBalance || 0) - parseFloat(previousBalance);

                    if (balanceDifference >= paymentAmount * 0.95) {
                      setPaymentFeedback({
                        type: 'success',
                        message: t('paymentSuccessfulWithAmount', { amount: paymentAmount })
                      });
                      setTimeout(() => {
                        onClose();
                        window.location.reload();
                      }, 3000);
                    } else {
                      setPaymentFeedback({
                        type: 'error',
                        message: t('paymentCancelledOrIncomplete')
                      });
                      setTimeout(() => {
                        onClose();
                        window.location.reload();
                      }, 4000);
                    }
                  } catch (error) {
                    console.error('Error refreshing wallet balance:', error);
                    setPaymentFeedback({
                      type: 'error',
                      message: t('unableToVerifyPaymentStatus')
                    });
                    setTimeout(() => {
                      onClose();
                      window.location.reload();
                    }, 3000);
                  }
                }, 2000);
              }
            }, 1000);

            // Timeout safety
            setTimeout(() => {
              if (paymentWindow && !paymentWindow.closed) {
                paymentWindow.close();
                clearInterval(checkWindowClosed);
                setIsRazorpayLoading(false);
                setPaymentFeedback({
                  type: 'info',
                  message: t('paymentSessionTimedOut')
                });
                setTimeout(() => {
                  onClose();
                  window.location.reload();
                }, 4000);
              }
            }, 60000);
          } else {
            setPaymentFeedback({
              type: 'error',
              message: t('pleaseAllowPopups')
            });
            setIsRazorpayLoading(false);
          }
        }
      } else {
        setAddFundsError(t('failedToCreatePaymentLink'));
        setIsRazorpayLoading(false);
      }
    } catch (error) {
      console.error('Payment initialization failed:', error);
      setAddFundsError(t('failedToCreatePaymentLink'));
      setIsRazorpayLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="arm-modal-overlay">
        <div className="arm-modal-container">
          <div className="arm-modal-header">
            <h3 className="arm-modal-title">{t('addMoney')}</h3>
            <div className="arm-modal-header-actions">
              <button className="arm-offers-badge-btn" onClick={() => setShowOffersModal(true)}>
                <span>{t('offers')}</span>
                <FontAwesomeIcon icon={faTag} />
              </button>
              <button
                className="arm-modal-close-btn"
                onClick={() => {
                  onClose();
                  window.location.reload();
                }}
                aria-label={t('closeAddMoneyModal')}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>

          <div className="arm-modal-body">
            {/* Wallet Balance Display */}
            <div className="arm-wallet-balance-banner">
              <div className="arm-balance-label">
                {paymentFeedback.type === 'success' ? t('newBalance') : t('currentBalance')}:
              </div>
              <div className="arm-balance-value">
                {walletBalance !== null && walletBalance !== undefined
                  ? `₹${parseFloat(walletBalance).toFixed(2)}`
                  : t('notAvailable')}
              </div>
              <button
                className="arm-balance-refresh-btn"
                onClick={handleLocalRefresh}
                disabled={isRefreshingBalance}
                title={t('refreshBalance')}
              >
                <FontAwesomeIcon icon={faSync} spin={isRefreshingBalance} />
              </button>
            </div>

            {/* Payment Feedback Banner */}
            {paymentFeedback.message && (
              <div className={classNames('arm-payment-feedback-banner', paymentFeedback.type)}>
                {paymentFeedback.message}
              </div>
            )}

            {/* Alert Warning Box */}
            <div className="arm-alert-info-box">
              <FontAwesomeIcon icon={faInfoCircle} className="arm-alert-info-icon" />
              <div className="arm-alert-info-text">
                {t('moneyAddedToWalletMessage')}{' '}
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="arm-alert-refresh-link"
                >
                  {t('refreshPage')}
                </button>
              </div>
            </div>

            {/* Core Section: Two-Column layout */}
            <div className="arm-modal-core-layout">
              {/* Left Column: Input and Bonus Info */}
              <div className="arm-modal-left-column">
                <div className="arm-input-form-group">
                  <div className="arm-input-amount-wrapper">
                    <span className="arm-input-currency-symbol">₹</span>
                    <input
                      className={classNames('arm-amount-input-field', { 'arm-input-error-state': !!addFundsError })}
                      type="number"
                      min={1}
                      step={1}
                      autoComplete="off"
                      placeholder="0"
                      value={addFundsAmount}
                      aria-label="Enter amount to add to wallet"
                      onChange={e => {
                        const v = e.target.value.replace(/[^\d]/g, "");
                        setAddFundsAmount(v);
                        setAddFundsError("");
                      }}
                      disabled={isRazorpayLoading}
                      onBlur={() => {
                        if (addFundsAmount && parseInt(addFundsAmount) < 1) {
                          setAddFundsError(t('enterValidAmount'));
                        }
                      }}
                      onKeyDown={e => { if ([".", "-", "e"].includes(e.key)) e.preventDefault(); }}
                      onWheel={(e) => e.target.blur()}
                    />
                  </div>
                  {addFundsError && (
                    <div className="arm-input-error-label">
                      <FontAwesomeIcon icon={faExclamationTriangle} /> {addFundsError}
                    </div>
                  )}
                </div>

                {/* Bonus Reward Message */}
                {addFundsAmount && parseInt(addFundsAmount) >= 500 && (
                  <div className="arm-bonus-reward-card">
                    <span className="arm-bonus-gift-icon">🎁</span>
                    <span className="arm-bonus-gift-text">
                      {parseInt(addFundsAmount) >= 1000
                        ? t('rechargeBonusMessage10Percent').replace('{amount}', (parseInt(addFundsAmount) * 0.10).toFixed(2))
                        : t('rechargeBonusMessage5Percent').replace('{amount}', (parseInt(addFundsAmount) * 0.05).toFixed(2))
                      }
                    </span>
                  </div>
                )}
              </div>

              {/* Right Column: Quick Amount Chips */}
              <div className="arm-modal-right-column">
                <div className="arm-quick-chips-grid">
                  {['10', '50', '500', '1000'].map(amount => (
                    <button
                      key={amount}
                      type="button"
                      className={classNames('arm-quick-chip-btn', { 'arm-quick-chip-selected': addFundsAmount === amount })}
                      onClick={() => {
                        setAddFundsAmount(amount);
                        setAddFundsError('');
                      }}
                      disabled={isRazorpayLoading}
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <div className="arm-modal-action-wrapper">
              <button
                className="arm-pay-submit-btn"
                disabled={isRazorpayLoading || !addFundsAmount || parseInt(addFundsAmount) < 1}
                onClick={() => {
                  if (!addFundsAmount || parseInt(addFundsAmount) < 1) {
                    setAddFundsError(t('enterValidAmount'));
                  } else {
                    handleAddFundsSubmit(parseInt(addFundsAmount || '0'));
                  }
                }}
                aria-label="Continue to payment"
              >
                {isRazorpayLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '8px' }} />
                    {t('loading')}
                  </>
                ) : (
                  <>
                    {t('continueToPayment')}
                    <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: '8px' }} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Help & Support Footer */}
          <div className="arm-modal-footer-support">
            <span className="arm-support-prompt-text">{t('havingTroubleAddingMoney')}</span>
            <button
              className="arm-support-contact-btn"
              onClick={() => setShowSupportModal(true)}
            >
              <FontAwesomeIcon icon={faHeadphones} /> {t('contactUs')}
            </button>
          </div>
        </div>
      </div>

      {/* Nested Support Modal */}
      {showSupportModal && (
        <div className="arm-nested-modal-overlay" onClick={() => setShowSupportModal(false)}>
          <div className="arm-nested-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="arm-nested-modal-header">
              <h3>{t('contactSupport')}</h3>
              <button
                className="arm-nested-modal-close"
                onClick={() => setShowSupportModal(false)}
                aria-label="Close support modal"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="arm-nested-modal-body">
              <div className="arm-support-channels-list">
                <a
                  href="https://wa.me/917454860294"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="arm-support-channel whatsapp-channel"
                >
                  <div className="arm-channel-icon-bg">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </div>
                  <div className="arm-channel-info">
                    <h4>{t('whatsappSupport')}</h4>
                    <span className="arm-channel-detail">{t('supportNumber')}</span>
                  </div>
                </a>

                <a
                  href="tel:+917454860294"
                  className="arm-support-channel call-channel"
                >
                  <div className="arm-channel-icon-bg">
                    <FontAwesomeIcon icon={faPhone} />
                  </div>
                  <div className="arm-channel-info">
                    <h4>{t('callSupport')}</h4>
                    <span className="arm-channel-detail">{t('supportNumber')}</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nested Offers Modal */}
      {showOffersModal && (
        <div className="arm-nested-modal-overlay" onClick={() => setShowOffersModal(false)}>
          <div className="arm-nested-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="arm-nested-modal-header">
              <div className="arm-offers-title-block">
                <FontAwesomeIcon icon={faGift} className="arm-offers-title-icon" />
                <div>
                  <h3 style={{ margin: 0 }}>{t('rechargeOffers')}</h3>
                  <p className="arm-offers-subtitle">{t('getExtraBonusOnRecharge')}</p>
                </div>
              </div>
              <button
                className="arm-nested-modal-close"
                onClick={() => setShowOffersModal(false)}
                aria-label="Close offers modal"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="arm-nested-modal-body">
              <div className="arm-offers-list">
                <div className="arm-offer-item starter-offer">
                  <div className="arm-offer-badge">{t('starterBonusRange')}</div>
                  <div className="arm-offer-details">
                    <h4>{t('getExtra5PercentBonus')}</h4>
                    <p>{t('addBetween500And999')}</p>
                  </div>
                </div>

                <div className="arm-offer-item premium-offer">
                  <div className="arm-offer-badge">{t('premiumBonusRange')}</div>
                  <div className="arm-offer-details">
                    <h4>{t('getExtra10PercentBonus')}</h4>
                    <p>{t('add1000OrMore')}</p>
                  </div>
                </div>
              </div>

              <div className="arm-offers-support-footer">
                <p>{t('needHelpWithOffers')}</p>
                <button
                  className="arm-offers-contact-btn"
                  onClick={() => {
                    setShowOffersModal(false);
                    setShowSupportModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faPhone} /> {t('contactSupport')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
