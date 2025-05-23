// Detect if we're in development mode more reliably
const isDevelopment = import.meta.env.MODE === 'development' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.port === '5173' ||
                     window.location.port === '3000' ||
                     window.location.port === '80' || // Docker frontend port
                     window.location.protocol === 'http:';

// Set API URL based on environment
const getApiUrl = () => {
  // FIRST: Check if we're clearly in development - this takes priority
  if (isDevelopment) {
    // In development, always use local backend unless explicitly overridden
    const devApiUrl = import.meta.env.VITE_API_URL;
    
    // Only use the env var if it points to localhost/127.0.0.1
    if (devApiUrl && (devApiUrl.includes('localhost') || devApiUrl.includes('127.0.0.1'))) {
      return devApiUrl;
    }
    
    // Special case for Docker: if hostname is localhost but no specific API URL
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:5000/api';
    }
    
    // Default to local backend in development
    return 'http://localhost:5000/api';
  }
  
  // SECOND: For production, use environment variable if available
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // THIRD: Production domain detection
  if (window.location.hostname.includes('sql-analytics-platform.onrender.com')) {
    return 'https://sql-analytics-platform-api.onrender.com/api';
  }
  
  // FALLBACK: Default production API
  return 'https://sql-analytics-platform-api.onrender.com/api';
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