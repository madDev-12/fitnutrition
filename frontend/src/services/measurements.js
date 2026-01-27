import api from './api';

const measurementsService = {
  // Get all measurements
  getAll: async (params = {}) => {
    const response = await api.get('/measurements/', { params });
    return response.data;
  },

  // Get measurement by ID
  getById: async (id) => {
    const response = await api.get(`/measurements/${id}/`);
    return response.data;
  },

  // Create new measurement
  create: async (data) => {
    const response = await api.post('/measurements/', data);
    return response.data;
  },

  // Update measurement
  update: async (id, data) => {
    const response = await api.put(`/measurements/${id}/`, data);
    return response.data;
  },

  // Delete measurement
  delete: async (id) => {
    const response = await api.delete(`/measurements/${id}/`);
    return response.data;
  },

  // Get latest measurement
  getLatestMeasurement: async () => {
    const response = await api.get('/measurements/latest/');
    return response.data;
  },

  // Alias for getMeasurements (used in Measurements.jsx)
  getMeasurements: async (params = {}) => {
    const response = await api.get('/measurements/', { params });
    return response.data;
  },

  // Get measurement history
  getHistory: async (params = {}) => {
    const response = await api.get('/measurements/history/', { params });
    return response.data;
  },

  // Get statistics
  getStats: async (params = {}) => {
    const response = await api.get('/measurements/stats/', { params });
    return response.data;
  },

  // Get progress comparison
  getProgress: async (params = {}) => {
    const response = await api.get('/measurements/progress/', { params });
    return response.data;
  },
};

// Additional aliases for backward compatibility
measurementsService.createMeasurement = measurementsService.create;
measurementsService.updateMeasurement = measurementsService.update;
measurementsService.deleteMeasurement = measurementsService.delete;

export default measurementsService;
