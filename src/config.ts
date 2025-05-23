// In development, use the relative path. In production on Render, use the explicit backend URL
export const API_URL = import.meta.env.VITE_API_URL || 
    (window.location.hostname === 'localhost' ? '/api' : 'https://sql-analytics-platform-api.onrender.com/api'); 