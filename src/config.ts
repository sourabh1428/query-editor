// Detect if we're in development mode more reliably
const isDevelopment = import.meta.env.MODE === 'development' || 
                     (window.location.hostname === 'localhost' && window.location.port === '3000') || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.port === '5173' ||
                     (window.location.hostname === 'localhost' && window.location.port === '80') || // Docker frontend port
                     (window.location.hostname === 'localhost' && window.location.protocol === 'http:');

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
    // Special case for Docker: if hostname is localhost but no specific API URL
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:5000';
    }
    
    // Default to local backend in development
    return 'http://localhost:5000';
  }
  
  // THIRD: Production domain detection
  if (window.location.hostname.includes('sql-analytics-platform.onrender.com')) {
    return 'https://sql-analytics-platform-api.onrender.com';
  }
  
  // FOURTH: Check for EC2 instance
  if (window.location.hostname === '15.207.114.204') {
    return 'http://15.207.114.204:5000';
  }
  
  // FALLBACK: Default production API
  return 'https://sql-analytics-platform-api.onrender.com';
};

export const API_URL = getApiUrl();

// Enhanced logging for debugging
console.log('🔧 Environment Debug Info:');
console.log('- MODE:', import.meta.env.MODE);
console.log('- Hostname:', window.location.hostname);
console.log('- Port:', window.location.port);
console.log('- Protocol:', window.location.protocol);
console.log('- Is Development:', isDevelopment);
console.log('- VITE_API_URL env var:', import.meta.env.VITE_API_URL);
console.log('- Final API URL:', API_URL);
console.log('🚀 Using API:', API_URL); 