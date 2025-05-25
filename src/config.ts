// Detect if we're in development mode more reliably
const isDevelopment = import.meta.env.MODE === 'development' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.port === '5173';

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
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://15.207.114.204:5000';
  }
  
  // FOURTH: Check for EC2 instance or localhost:3000
  if (window.location.hostname === '15.207.114.204' || 
      (window.location.hostname === 'localhost' && window.location.port === '3000')) {
    return 'https://15.207.114.204:5000';
  }
  
  // FALLBACK: Default to production API
  return 'https://15.207.114.204:5000';
};

export const API_URL = getApiUrl();

// Debug logging
console.log('Environment Detection:');
console.log('- Hostname:', window.location.hostname);
console.log('- Port:', window.location.port);
console.log('- Protocol:', window.location.protocol);
console.log('- Mode:', import.meta.env.MODE);
console.log('- VITE_API_URL env var:', import.meta.env.VITE_API_URL);
console.log('- Final API URL:', API_URL);
console.log('🚀 Using API:', API_URL); 