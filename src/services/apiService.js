// services/apiService.js
import axios from "axios";

const API_URL = "https://b104bbcd6837.ngrok-free.app";

// Store token in memory
let authToken = null;

let accessToken = localStorage.getItem("dauth_tokens");

authToken = accessToken?.access_token;
// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Axios interceptor to add Authorization header to every request
apiClient.interceptors.request.use(
  (config) => {
    // Add token to Authorization header if available
    if (authToken) {
      console.log("Token set for API requests", authToken);
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Set the access token for API requests
 * Call this after getting tokens from DAuth SDK
 * @param {string} accessToken - The access token from DAuth
 */
export function setAuthToken(accessToken) {
  authToken = accessToken;
  // Also set in defaults for backward compatibility
  if (accessToken) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
    authToken = null;
  }
}

/**
 * Get current auth token (for debugging)
 * @returns {string|null} Current access token
 */
export function getAuthToken() {
  return authToken;
}

/**
 * Make authenticated API call to your backend
 * Token is automatically included in Authorization header
 * Format: Authorization: Bearer <token>
 * @param {string} endpoint - API endpoint (e.g., '/api/user/profile')
 * @param {object} options - Axios request options
 * @returns {Promise} Axios response
 */
export async function apiCall(endpoint, options = {}) {
  try {
    const response = await apiClient({
      url: endpoint,
      ...options,
    });
    return response;
  } catch (error) {
    // Handle errors (token expired, unauthorized, etc.)
    if (error.response?.status === 401) {
      // Token is invalid or expired
      // You might want to trigger logout here
      console.error("Unauthorized - token may be expired");
    }
    throw error;
  }
}

// Convenience methods
export const api = {
  get: (endpoint, config) => apiCall(endpoint, { method: "GET", ...config }),
  post: (endpoint, data, config) => apiCall(endpoint, { method: "POST", data, ...config }),
  put: (endpoint, data, config) => apiCall(endpoint, { method: "PUT", data, ...config }),
  delete: (endpoint, config) => apiCall(endpoint, { method: "DELETE", ...config }),
};

export default apiClient;

