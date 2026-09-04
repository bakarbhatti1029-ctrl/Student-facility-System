// Central API base URL utility
// All API calls should use this instead of hardcoded localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export default API_BASE_URL;
