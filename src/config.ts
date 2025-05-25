// Detect if we're in development mode more reliably
const isDevelopment = import.meta.env.MODE === 'development' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.port === '5173';

// Get the current protocol and hostname
const protocol = window.location.protocol;
const hostname = window.location.hostname;

// Set API URL based on environment
const getApiUrl = () => {
  // FIRST: Always check for explicit environment variable
  if (import.meta.env.VITE_API_URL) {
    const baseUrl = import.meta.env.VITE_API_URL;
    // Remove trailing slash if present
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }
  
  // SECOND: Check if we're clearly in development
  if (isDevelopment) {
    return 'http://localhost:5000';
  }
  
  // THIRD: Production domain detection
  if (hostname === '15.207.114.204' || 
      (hostname === 'localhost' && window.location.port === '3000')) {
    return `${protocol}//15.207.114.204:5000`;
  }
  
  // FALLBACK: Default to production API
  return `${protocol}//15.207.114.204:5000`;
};

export const API_URL = getApiUrl();

// Debug logging
console.log('Environment Detection:');
console.log('- Hostname:', hostname);
console.log('- Port:', window.location.port);
console.log('- Protocol:', protocol);
console.log('- Mode:', import.meta.env.MODE);
console.log('- VITE_API_URL env var:', import.meta.env.VITE_API_URL);
console.log('- Final API URL:', API_URL);
console.log('🚀 Using API:', API_URL); 