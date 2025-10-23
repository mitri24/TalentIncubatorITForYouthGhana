// API Service Configuration
// Centralized API client with interceptors for authentication and error handling
//
// TODO for co-programmers:
// - Add request/response logging for development
// - Implement retry logic for failed requests
// - Add request timeout configuration
// - Implement request caching for GET requests
// - Add request queue for offline mode
// - Implement proper error response handling with user-friendly messages
// - Add API versioning support
// - Implement request/response transformation if needed
// - Add performance monitoring for API calls

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api