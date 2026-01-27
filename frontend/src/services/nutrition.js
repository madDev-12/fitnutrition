import api from './api';

const nutritionService = {
  // Foods
  foods: {
    getAll: async (params = {}) => {
      const response = await api.get('/nutrition/foods/', { params });
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`/nutrition/foods/${id}/`);
      return response.data;
    },
    create: async (data) => {
      const response = await api.post('/nutrition/foods/', data);
      return response.data;
    },
    update: async (id, data) => {
      const response = await api.put(`/nutrition/foods/${id}/`, data);
      return response.data;
    },
    delete: async (id) => {
      const response = await api.delete(`/nutrition/foods/${id}/`);
      return response.data;
    },
    search: async (query) => {
      const response = await api.get('/nutrition/foods/', { params: { search: query } });
      return response.data;
    },
  },

  // Meals
  meals: {
    getAll: async (params = {}) => {
      const response = await api.get('/nutrition/meals/', { params });
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`/nutrition/meals/${id}/`);
      return response.data;
    },
    create: async (data) => {
      const response = await api.post('/nutrition/meals/', data);
      return response.data;
    },
    update: async (id, data) => {
      const response = await api.put(`/nutrition/meals/${id}/`, data);
      return response.data;
    },
    delete: async (id) => {
      const response = await api.delete(`/nutrition/meals/${id}/`);
      return response.data;
    },
    getToday: async () => {
      const response = await api.get('/nutrition/meals/today/');
      return response.data;
    },
    getStats: async (params = {}) => {
      const response = await api.get('/nutrition/meals/stats/', { params });
      return response.data;
    },
    removeItem: async (mealId, itemId) => {
      const response = await api.delete(`/nutrition/meals/${mealId}/remove_item/`, {
        data: { item_id: itemId }
      });
      return response.data;
    },
  },

  // Meal Plans
  mealPlans: {
    getAll: async (params = {}) => {
      const response = await api.get('/nutrition/meal-plans/', { params });
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`/nutrition/meal-plans/${id}/`);
      return response.data;
    },
    create: async (data) => {
      const response = await api.post('/nutrition/meal-plans/', data);
      return response.data;
    },
    update: async (id, data) => {
      const response = await api.put(`/nutrition/meal-plans/${id}/`, data);
      return response.data;
    },
    delete: async (id) => {
      const response = await api.delete(`/nutrition/meal-plans/${id}/`);
      return response.data;
    },
  },

  // Food Preferences
  preferences: {
    get: async () => {
      const response = await api.get('/nutrition/preferences/');
      return response.data;
    },
    update: async (data) => {
      const response = await api.put('/nutrition/preferences/', data);
      return response.data;
    },
  },

  // Favorites
  favorites: {
    getAll: async () => {
      // backend registers this viewset under 'favorite-foods'
      const response = await api.get('/nutrition/favorite-foods/');
      return response.data;
    },
    toggle: async (foodId) => {
      const response = await api.post('/nutrition/favorite-foods/toggle/', { food_id: foodId });
      return response.data;
    },
  },

  // Recipes
  recipes: {
    getAll: async (params = {}) => {
      const response = await api.get('/nutrition/recipes/', { params });
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`/nutrition/recipes/${id}/`);
      return response.data;
    },
    create: async (data) => {
      const response = await api.post('/nutrition/recipes/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    update: async (id, data) => {
      const response = await api.put(`/nutrition/recipes/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    delete: async (id) => {
      const response = await api.delete(`/nutrition/recipes/${id}/`);
      return response.data;
    },
    search: async (query) => {
      const response = await api.get('/nutrition/recipes/', { params: { search: query } });
      return response.data;
    },
  },
};

export default nutritionService;
