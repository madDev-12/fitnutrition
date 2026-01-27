import api from './api';

const analyticsService = {
  // Get metabolism data (BMR & TDEE)
  getMetabolism: async () => {
    const response = await api.get('/analytics/metabolism/');
    return response.data;
  },

  // Get macro calculator
  getMacros: async (params = {}) => {
    const response = await api.get('/analytics/macros/', { params });
    return response.data;
  },

  // Get progress analysis
  getProgress: async (params = {}) => {
    const response = await api.get('/analytics/progress/', { params });
    return response.data;
  },

  // Get goal progress
  getGoalProgress: async () => {
    const response = await api.get('/analytics/goal-progress/');
    return response.data;
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/analytics/dashboard/');
    return response.data;
  },

  // Calculate calories
  calculateCalories: async (data) => {
    const response = await api.post('/analytics/calorie-calculator/', data);
    return response.data;
  },
};

// Add alias for backward compatibility
analyticsService.getDashboard = analyticsService.getDashboardStats;

export default analyticsService;
