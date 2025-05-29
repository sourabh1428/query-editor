// Force development mode in local environment
const isDevelopment = true; // Force development mode

// Set API URL based on environment
const getApiUrl = () => {
  // Force localhost in development
  console.log('Development mode detected, forcing localhost:5000');
  return 'http://localhost:5000/';
};

export const API_URL = getApiUrl();

// Debug logging
console.log('Environment Detection:');
console.log('- Hostname:', window.location.hostname);
console.log('- Port:', window.location.port);
console.log('- Protocol:', window.location.protocol);
console.log('- Mode:', import.meta.env.MODE);
console.log('- Development Mode:', isDevelopment);
console.log('- VITE_API_URL env var:', import.meta.env.VITE_API_URL);
console.log('- Final API URL:', API_URL);
console.log('🚀 Using API:', API_URL); 