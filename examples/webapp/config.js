// InSystem Model Hub - Google AI Studio inspired UI
// Configuration for deployment
const CONFIG = {
  // Automatically detect backend
  // For production: Set BACKEND_URL environment variable or update here
  API_BASE: window.location.hostname === 'localhost' 
    ? 'http://localhost:8080/api/v1'
    : (window.BACKEND_URL || 'http://localhost:8080/api/v1'), // Will use local backend
  
  // For development
  DEV_MODE: window.location.hostname === 'localhost'
};

const API_BASE = CONFIG.API_BASE;
let allModels = [];
let activeFilters = {
  task: 'all',
  platform: null,
  search: ''
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initFilters();
  checkGatewayHealth();
  loadModels();
  loadPlaygroundModels();
  initSliders();
});
