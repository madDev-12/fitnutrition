import api from './api'

export const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData)
    return response.data
  },

  // Login user
  login: async (credentials) => {
    // Support both object and separate parameters
    const loginData = typeof credentials === 'object' 
      ? credentials 
      : { email: credentials, password: arguments[1] }
    
    const response = await api.post('/auth/login/', loginData)
    return response.data
  },

  // Logout user
  logout: async () => {
    const response = await api.post('/auth/logout/')
    return response.data
  },

  // Get current user profile
  getCurrentUser: async () => {
    const response = await api.get('/auth/me/')
    return response.data
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/token/refresh/', { refresh: refreshToken })
    return response.data
  },

  // Change password
  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    })
    return response.data
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/password-reset/', { email })
    return response.data
  },

  // Confirm password reset
  confirmPasswordReset: async (token, newPassword) => {
    const response = await api.post('/auth/password-reset-confirm/', {
      token,
      new_password: newPassword,
    })
    return response.data
  },
}

export default authService
