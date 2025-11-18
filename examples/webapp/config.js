// InSystem Model Hub - Google AI Studio inspired UI
// Configuration for deployment
const CONFIG = {
  // Change this to your backend URL when deploying
  API_BASE: window.location.hostname === 'localhost' 
    ? 'http://localhost:8080/api/v1'
    : 'https://your-backend-url.com/api/v1', // Update this after deploying backend
  
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
