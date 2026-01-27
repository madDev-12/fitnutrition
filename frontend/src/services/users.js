import api from './api';

const usersService = {
  // Get current user profile
  getCurrentUser: async () => {
    const response = await api.get('/profile/');
    return response.data;
  },

  // Get user profile (alias for getCurrentUser for compatibility)
  getProfile: async () => {
    const response = await api.get('/profile/');
    return response;
  },

  // Update user profile
  updateProfile: async (data) => {
    const response = await api.put('/profile/', data);
    return response.data;
  },

  // Get user profile details
  getProfileDetails: async () => {
    const response = await api.get('/profile/details/');
    return response.data;
  },

  // Update user profile details
  updateProfileDetails: async (data) => {
    const response = await api.put('/profile/details/', data);
    return response.data;
  },

  // Create user profile
  createProfile: async (data) => {
    const response = await api.post('/profile/create/', data);
    return response.data;
  },

  // Get user stats
  getUserStats: async () => {
    const response = await api.get('/profile/stats/');
    return response.data;
  },

  // Get food preferences
  getFoodPreferences: async () => {
    const response = await api.get('/profile/food-preferences/');
    return response.data;
  },

  // Update food preferences
  updateFoodPreferences: async (data) => {
    const response = await api.put('/profile/food-preferences/', data);
    return response.data;
  },

  // Get user preferences
  getPreferences: async () => {
    const response = await api.get('/profile/preferences/');
    return response;
  },

  // Update user preferences
  updatePreferences: async (data) => {
    const response = await api.put('/profile/preferences/', data);
    return response.data;
  },

  // Change password
  changePassword: async (data) => {
    const response = await api.post('/profile/change-password/', {
      old_password: data.old_password,
      new_password: data.new_password,
      new_password2: data.new_password,
    });
    return response.data;
  },

  // Delete account
  deleteAccount: async () => {
    const response = await api.delete('/profile/');
    return response.data;
  },

  // Upload profile picture
  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    const response = await api.post('/profile/upload-picture/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default usersService;
