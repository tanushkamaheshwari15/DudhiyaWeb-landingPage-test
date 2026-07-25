import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, verifyOtp, loginWithPassword, registerUser } from '../services/api';
import { storeToken, getToken } from '../services/tokenStorage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPhone,
  faLock,
  faEye,
  faEyeSlash,
  faSpinner,
  faMessage,
  faUserPlus,
  faUser,
  faCheck,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import './Login.css';
import { useLanguage } from '../contexts/LanguageContext';

const loginTranslations = {
  en: {
    welcomeBack: "Welcome Back!",
    loginSubtitle: "Login to access your dashboard",
    login: "Login",
    signUp: "Sign Up",
    phonePlaceholder: "Enter 10-digit phone number",
    loginWith: "Login With",
    otp: "OTP",
    password: "Password",
    downloadMobile: "Download for Mobile",
    backToHome: "Back to Home",
    fullName: "Full Name",
    fullNamePlaceholder: "Enter your full name",
    enterPassword: "Enter password",
    verifyOtp: "Verify OTP",
    enterOtpSubtitle: "Enter the OTP sent to your phone",
    enterOtpPlaceholder: "Enter OTP",
    verifyAndLogin: "Verify & Login",
    submitting: "Submitting...",
    verifying: "Verifying...",
    chooseLanguage: "Choose Language",
    createAccount: "Create Account",
    signUpSubtitle: "Sign up to get started",
    setPasswordPlaceholder: "Set a strong password",
    sendOtpAndRegister: "Send OTP & Register",
    enterYourPassword: "Enter your password",
    backToLogin: "Back to Login",
    resendOtp: "Resend OTP"
  },
  hi: {
    welcomeBack: "आपका स्वागत है!",
    loginSubtitle: "अपने डैशबोर्ड तक पहुँचने के लिए लॉगिन करें",
    login: "लॉगिन",
    signUp: "साइन अप",
    phonePlaceholder: "10-अंकीय फोन नंबर दर्ज करें",
    loginWith: "लॉगिन विधि",
    otp: "ओटीपी",
    password: "पासवर्ड",
    downloadMobile: "मोबाइल के लिए डाउनलोड करें",
    backToHome: "होम पर वापस जाएं",
    fullName: "पूरा नाम",
    fullNamePlaceholder: "अपना पूरा नाम दर्ज करें",
    enterPassword: "पासवर्ड दर्ज करें",
    verifyOtp: "ओटीपी सत्यापित करें",
    enterOtpSubtitle: "आपके फोन पर भेजा गया ओटीपी दर्ज करें",
    enterOtpPlaceholder: "ओटीपी दर्ज करें",
    verifyAndLogin: "सत्यापित करें और लॉगिन करें",
    submitting: "प्रस्तुत किया जा रहा है...",
    verifying: "सत्यापित किया जा रहा है...",
    chooseLanguage: "भाषा चुनें",
    createAccount: "खाता बनाएं",
    signUpSubtitle: "शुरू करने के लिए साइन अप करें",
    setPasswordPlaceholder: "एक मजबूत पासवर्ड सेट करें",
    sendOtpAndRegister: "ओटीपी भेजें और रजिस्टर करें",
    enterYourPassword: "अपना पासवर्ड दर्ज करें",
    backToLogin: "लॉगिन पर वापस जाएं",
    resendOtp: "ओटीपी पुनः भेजें"
  },
  pa: {
    welcomeBack: "ਜੀ ਆਇਆਂ ਨੂੰ!",
    loginSubtitle: "ਆਪਣੇ ਡੈਸ਼ਬੋਰਡ ਤੱਕ ਪਹੁੰਚਣ ਲਈ ਲੌਗਇਨ ਕਰੋ",
    login: "ਲੌਗਇਨ",
    signUp: "ਸਾਈਨ ਅੱਪ",
    phonePlaceholder: "10-ਅੰਕ ਦਾ ਫੋਨ ਨੰਬਰ ਦਰਜ ਕਰੋ",
    loginWith: "ਲੌਗਇਨ ਵਿਧੀ",
    otp: "ਓਟੀਪੀ",
    password: "ਪਾਸਵਰਡ",
    downloadMobile: "ਮੋਬਾਈਲ ਲਈ ਡਾਊਨਲੋਡ ਕਰੋ",
    backToHome: "ਹੋਮ ਪੇਜ 'ਤੇ ਵਾਪਸ ਜਾਓ",
    fullName: "ਪੁਰਾ ਨਾਮ",
    fullNamePlaceholder: "ਆਪਣਾ ਪੂਰਾ ਨਾਮ ਦਰਜ ਕਰੋ",
    enterPassword: "ਪਾਸਵਰਡ ਦਰਜ ਕਰੋ",
    verifyOtp: "ਓਟੀਪੀ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ",
    enterOtpSubtitle: "ਤੁਹਾਡੇ ਫੋਨ 'ਤੇ ਭੇਜਿਆ ਓਟੀਪੀ ਦਰਜ ਕਰੋ",
    enterOtpPlaceholder: "ਓਟੀਪੀ ਦਰਜ ਕਰੋ",
    verifyAndLogin: "ਪੁਸ਼ਟੀ ਕਰੋ ਅਤੇ ਲੌਗਇਨ ਕਰੋ",
    submitting: "ਜਮ੍ਹਾਂ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ...",
    verifying: "ਪੁਸ਼ਟੀ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ...",
    chooseLanguage: "ਭਾਸ਼ਾ ਚੁਣੋ",
    createAccount: "ਖਾਤਾ ਬਣਾਓ",
    signUpSubtitle: "ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਸਾਈਨ ਅੱਪ ਕਰੋ",
    setPasswordPlaceholder: "ਇੱਕ ਮਜ਼ਬੂਤ ਪਾਸਵਰਡ ਸੈੱਟ ਕਰੋ",
    sendOtpAndRegister: "ਓਟੀਪੀ ਭੇਜੋ ਅਤੇ ਰਜਿਸਟਰ ਕਰੋ",
    enterYourPassword: "ਆਪਣਾ ਪਾਸਵਰਡ ਦਰਜ ਕਰੋ",
    backToLogin: "ਲੌਗਇਨ ਤੇ ਵਾਪਸ ਜਾਓ",
    resendOtp: "ਓਟੀਪੀ ਦੁਬਾਰਾ ਭੇਜੋ"
  },
  kn: {
    welcomeBack: "ಸ್ವಾಗತ!",
    loginSubtitle: "ನಿಮ್ಮ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪ್ರವೇಶಿಸಲು ಲಾಗಿನ್ ಮಾಡಿ",
    login: "ಲಾಗಿನ್",
    signUp: "ಸೈನ್ ಅಪ್",
    phonePlaceholder: "10-ಅಂಕಿಯ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ",
    loginWith: "ಲಾಗಿನ್ ವಿಧಾನ",
    otp: "ಒಟಿಪಿ",
    password: "ಪಾಸ್‌ವರ್ಡ್",
    downloadMobile: "ಮೊಬೈಲ್‌ಗಾಗಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    backToHome: "ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ",
    fullName: "ಪೂರ್ಣ ಹೆಸರು",
    fullNamePlaceholder: "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ",
    enterPassword: "ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ",
    verifyOtp: "ಒಟಿಪಿ ಪರಿಶೀಲಿಸಿ",
    enterOtpSubtitle: "ನಿಮ್ಮ ಫೋನ್‌ಗೆ ಕಳುಹಿಸಲಾದ ಒಟಿಪಿ ನಮೂದಿಸಿ",
    enterOtpPlaceholder: "ಒಟಿಪಿ ನಮೂದಿಸಿ",
    verifyAndLogin: "ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಲಾಗಿನ್ ಮಾಡಿ",
    submitting: "ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...",
    verifying: "ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...",
    chooseLanguage: "ಭಾಷೆಯನ್ನು ಆರಿಸಿ",
    createAccount: "ಖಾತೆ ರಚಿಸಿ",
    signUpSubtitle: "ಪ್ರಾರಂಭಿಸಲು ಸೈನ್ ಅಪ್ ಮಾಡಿ",
    setPasswordPlaceholder: "ಬಲವಾದ ಪಾಸ್‌ವರ್ಡ್ ಹೊಂದಿಸಿ",
    sendOtpAndRegister: "ಒಟಿಪಿ ಕಳುಹಿಸಿ ಮತ್ತು ನೋಂದಾಯಿಸಿ",
    enterYourPassword: "ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ",
    backToLogin: "ಲಾಗಿನ್‌ಗೆ ಹಿಂತಿರುಗಿ",
    resendOtp: "ಒಟಿಪಿ ಮರುಕಳುಹಿಸಿ"
  }
};

const Login = () => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const lt = (key) => {
    return loginTranslations[currentLanguage]?.[key] || loginTranslations['hi']?.[key] || loginTranslations['en']?.[key] || key;
  };

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' | 'password'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [sessionInfo, setSessionInfo] = useState({});
  const [serverMsg, setServerMsg] = useState('');
  const [registrationData, setRegistrationData] = useState(null); // { fullName, password }
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const token = getToken();
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handlePhoneNumberChange = (e) => {
    const phone = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(phone);
  };

  const validatePhoneNumber = (phone) => {
    return /^\d{10}$/.test(phone);
  };

  // Login with OTP flow
  const handleOtpLogin = async (e) => {
    e.preventDefault();
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError('');
    setServerMsg('');
    try {
      const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
      const response = await loginUser(formattedPhone);
      if (response && response.token) {
        await storeToken(response.token);
        navigate('/dashboard');
      } else {
        const requiresOtp = response?.requires_otp || response?.otp_required || !response?.token;
        if (requiresOtp) {
          setStep('otp');
          setServerMsg(response?.message || 'OTP has been sent to your phone.');
          const sess = {};
          if (response?.session_id) sess.session_id = response.session_id;
          if (response?.transaction_id) sess.transaction_id = response.transaction_id;
          if (response?.verificationId) sess.verificationId = response.verificationId;
          if (response?.verification_id) sess.verificationId = response.verification_id;
          setSessionInfo(sess);
        } else {
          setError('Login failed. Invalid response from server.');
        }
      }
    } catch (error) {
      setError(error.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Login with password
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (!password || password.length < 6) {
      setError('Please enter your password (minimum 6 characters)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
      const response = await loginWithPassword(formattedPhone, password);
      if (response && response.token) {
        await storeToken(response.token);
        navigate('/dashboard');
      } else {
        setError(response?.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setError(error.error || error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification - Step 2: Verify OTP and complete action
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setError('Please enter the OTP sent to your phone');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
      const response = await verifyOtp(formattedPhone, otpCode, sessionInfo);
      if (registrationData) {
        // Registration flow: OTP verified, now complete registration
        if (response && response.token) {
          try {
            // Complete registration with verified phone
            const regResponse = await registerUser(registrationData.fullName, formattedPhone, registrationData.password);
            if (regResponse && regResponse.token) {
              await storeToken(regResponse.token);
              setServerMsg('Registration successful! Redirecting...');
              setRegistrationData(null);
              setTimeout(() => navigate('/dashboard'), 1500);
            } else {
              // If register doesn't return token but OTP gave token, use OTP token
              await storeToken(response.token);
              setServerMsg('Registration successful! Redirecting...');
              setRegistrationData(null);
              setTimeout(() => navigate('/dashboard'), 1500);
            }
          } catch (regError) {
            // Registration API failed but OTP verified - use OTP token if available
            if (response.token) {
              await storeToken(response.token);
              setServerMsg('Account verified! Redirecting...');
              setRegistrationData(null);
              setTimeout(() => navigate('/dashboard'), 1500);
            } else {
              setError(regError.error || 'Registration failed after OTP verification.');
            }
          }
        } else {
          setError(response?.error || 'Invalid OTP. Please try again.');
        }
      } else {
        // Normal login flow
        if (response && response.token) {
          await storeToken(response.token);
          navigate('/dashboard');
        } else {
          setError(response?.error || 'Invalid OTP. Please try again.');
        }
      }
    } catch (err) {
      setError(err?.error || err?.message || 'OTP verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Handle user registration - Step 1: Request OTP
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setLoading(true);
    setError('');
    setServerMsg('');
    try {
      const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
      // Store registration data for later use after OTP verification
      setRegistrationData({ fullName, password });
      // Request OTP by calling login endpoint (backend sends OTP to phone)
      const response = await loginUser(formattedPhone);
      if (response && (response.requires_otp || response.otp_required || response.session_id || response.verificationId || response.message)) {
        setStep('otp');
        setServerMsg(response?.message || 'OTP has been sent to your phone for registration.');
        const sess = {};
        if (response?.session_id) sess.session_id = response.session_id;
        if (response?.transaction_id) sess.transaction_id = response.transaction_id;
        if (response?.verificationId) sess.verificationId = response.verificationId;
        if (response?.verification_id) sess.verificationId = response.verification_id;
        setSessionInfo(sess);
      } else if (response?.token) {
        // Unexpected: got token directly - login instead
        await storeToken(response.token);
        navigate('/dashboard');
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      setError(error.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const code = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(code);
  };

  const resetForm = () => {
    setStep('form');
    setPhoneNumber('');
    setPassword('');
    setOtpCode('');
    setFullName('');
    setError('');
    setServerMsg('');
    setShowPassword(false);
    setRegistrationData(null);
  };

  return (
    <div className="login-container">
      {/* Laptop top-left home button */}
      <a href="/" target="_top" className="laptop-top-home-btn" title={lt('backToHome')}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </a>

      {/* Language Selector Dropdown (Top-Right) */}
      <div className="login-lang-selector">
        <select 
          value={currentLanguage} 
          onChange={(e) => changeLanguage(e.target.value)}
          className="lang-select-dropdown"
        >
          <option value="hi">हिन्दी</option>
          <option value="en">English</option>
          <option value="pa">ਪੰਜਾਬੀ</option>
          <option value="kn">ಕನ್ನಡ</option>
        </select>
      </div>

      <div className="login-card">
        {/* Left Side - Branding */}
        <div className="login-left">
          <div className="logo-container-login">
            <img src="/landing_page/assets/Dudhiya-welcome.png" alt="Dudhiya Logo" className="logo-image" />
          </div>
          <h2 className="login-title">Dudhiya Collection</h2>
          <p className="login-subtitle">Smart Dairy Management Solution</p>
          <a
            href="https://play.google.com/store/apps/details?id=com.elusifataehyung.MilkManagementApp&pcampaignid=web_share"
            target="_blank"
            rel="noopener noreferrer"
            className="download-app-btn"
          >
            <svg className="play-icon" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
              <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z" fill="#00c6ff" />
              <path d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" fill="#ff3a44" />
              <path d="M20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81Z" fill="#ffe000" />
              <path d="M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" fill="#00e575" />
            </svg>
            <span>{lt('downloadMobile')}</span>
          </a>
          <a href="/" target="_top" className="back-to-home">
            <FontAwesomeIcon icon={faArrowLeft} /> {lt('backToHome')}
          </a>
        </div>

        {/* Right Side - Form */}
        <div className="login-right">
          {/* Messages */}
          {error && <div className="error-message">{error}</div>}
          {serverMsg && !error && <div className="info-message">{serverMsg}</div>}

          {/* OTP Verification Step */}
          {step === 'otp' ? (
            <>
              <div className="login-right-header">
                <h3>{lt('verifyOtp')}</h3>
                <p>{lt('enterOtpSubtitle')}</p>
              </div>
              <form onSubmit={handleVerifyOtp} className="otp-form">
                <div className="input-group">
                  <FontAwesomeIcon icon={faMessage} className="input-icon" />
                  <input
                     type="tel"
                     value={otpCode}
                     onChange={handleOtpChange}
                     placeholder={lt('enterOtpPlaceholder')}
                     disabled={verifying}
                     required
                  />
                </div>
                <button
                  type="submit"
                  className="login-button"
                  disabled={verifying || otpCode.length < 4}
                >
                  {verifying ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    lt('verifyAndLogin')
                  )}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={verifying}
                  onClick={resetForm}
                >
                  {lt('backToLogin')}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="login-right-header">
                <h3>{activeTab === 'login' ? lt('welcomeBack') : lt('createAccount')}</h3>
                <p>{activeTab === 'login' ? lt('loginSubtitle') : lt('signUpSubtitle')}</p>
              </div>

              {/* Tab Toggle */}
              <div className="auth-tabs">
                <button
                  type="button"
                  className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('login'); resetForm(); }}
                >
                  <FontAwesomeIcon icon={faUser} /> {lt('login')}
                </button>
                <button
                  type="button"
                  className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('signup'); resetForm(); }}
                >
                  <FontAwesomeIcon icon={faUserPlus} /> {lt('signUp')}
                </button>
              </div>

              {/* Login Form */}
              {activeTab === 'login' && (
                <form onSubmit={loginMethod === 'otp' ? handleOtpLogin : handlePasswordLogin}>
                  {/* Phone Number */}
                  <div className="input-group">
                    <FontAwesomeIcon icon={faPhone} className="input-icon" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      placeholder={lt('phonePlaceholder')}
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Login Method Selection */}
                  <div className="login-method-label">{lt('loginWith')}</div>
                  <div className="login-method-toggle">
                    <button
                      type="button"
                      className={`method-btn ${loginMethod === 'otp' ? 'active' : ''}`}
                      onClick={() => setLoginMethod('otp')}
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faMessage} /> {lt('otp')}
                    </button>
                    <button
                      type="button"
                      className={`method-btn ${loginMethod === 'password' ? 'active' : ''}`}
                      onClick={() => setLoginMethod('password')}
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faLock} /> {lt('password')}
                    </button>
                  </div>

                  {/* Password Input (when password method selected) */}
                  {loginMethod === 'password' && (
                    <div className="input-group">
                      <FontAwesomeIcon icon={faLock} className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={lt('enterYourPassword')}
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                      </button>
                    </div>
                  )}

                  {/* Login Button */}
                  <button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                  >
                    {loading ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      lt('login')
                    )}
                  </button>
                </form>
              )}

              {/* Sign Up Form */}
              {activeTab === 'signup' && (
                <form onSubmit={handleRegister}>
                  {/* Full Name */}
                  <div className="input-group">
                    <FontAwesomeIcon icon={faUser} className="input-icon" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={lt('fullNamePlaceholder')}
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="input-group">
                    <FontAwesomeIcon icon={faPhone} className="input-icon" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      placeholder={lt('phonePlaceholder')}
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Create Password */}
                  <div className="input-group">
                    <FontAwesomeIcon icon={faLock} className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={lt('setPasswordPlaceholder')}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                    </button>
                  </div>

                  {/* Register Button */}
                  <button
                    type="submit"
                    className="login-button signup-button"
                    disabled={loading}
                  >
                    {loading ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <><FontAwesomeIcon icon={faCheck} /> {lt('sendOtpAndRegister')}</>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login; 