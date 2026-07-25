// Token storage key
const TOKEN_KEY = 'auth_token';

/**
 * Store authentication token in localStorage
 * @param {string} token - JWT token to store
 */
export const storeToken = (token) => {
  if (!token) {
    throw new Error('Invalid token');
  }
  
  localStorage.setItem(TOKEN_KEY, token);
  
  // Verify token was stored correctly
  const verifyToken = localStorage.getItem(TOKEN_KEY);
  if (verifyToken !== token) {
    throw new Error('Token verification failed');
  }
};

/**
 * Retrieve authentication token from localStorage
 * @returns {string|null} The stored token or null if not found
 */
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Remove authentication token from localStorage
 */
export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

/**
 * Check if user is authenticated (has a token)
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!getToken();
}; 