// Detect if we're in development mode
const isDevelopment = import.meta.env.MODE === 'development' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

// Set API URL based on environment
const getApiUrl = () => {
  // First check for explicit environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // If in development, use local backend
  if (isDevelopment) {
    return 'http://localhost:5000/api';
  }
  
  // Production: Check if we're on the main Render domain
  if (window.location.hostname.includes('sql-analytics-platform.onrender.com')) {
    return 'https://sql-analytics-platform-api.onrender.com/api';
  }
  
  // Fallback for any other production deployment
  return 'https://sql-analytics-platform-api.onrender.com/api';
};

export const API_URL = getApiUrl();

// Only log in development
if (isDevelopment) {
  console.log('Environment:', import.meta.env.MODE);
  console.log('Is Development:', isDevelopment);
  console.log('API URL:', API_URL);
} 