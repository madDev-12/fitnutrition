import api from './api';

const workoutsService = {
  // Exercises
  exercises: {
    getAll: async (params = {}) => {
      const response = await api.get('/workouts/exercises/', { params });
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`/workouts/exercises/${id}/`);
      return response.data;
    },
    create: async (data) => {
      const response = await api.post('/workouts/exercises/', data);
      return response.data;
    },
    update: async (id, data) => {
      const response = await api.put(`/workouts/exercises/${id}/`, data);
      return response.data;
    },
    delete: async (id) => {
      const response = await api.delete(`/workouts/exercises/${id}/`);
      return response.data;
    },
    getTypes: async () => {
      const response = await api.get('/workouts/exercises/types/');
      return response.data;
    },
    getEquipment: async () => {
      const response = await api.get('/workouts/exercises/equipment_list/');
      return response.data;
    },
    getMuscleGroups: async () => {
      const response = await api.get('/workouts/exercises/muscle_groups/');
      return response.data;
    },
  },

  // Workout Plans
  workoutPlans: {
    getAll: async (params = {}) => {
      const response = await api.get('/workouts/workout-plans/', { params });
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`/workouts/workout-plans/${id}/`);
      return response.data;
    },
    create: async (data) => {
      const response = await api.post('/workouts/workout-plans/', data);
      return response.data;
    },
    update: async (id, data) => {
      const response = await api.put(`/workouts/workout-plans/${id}/`, data);
      return response.data;
    },
    delete: async (id) => {
      const response = await api.delete(`/workouts/workout-plans/${id}/`);
      return response.data;
    },
    schedule: async (id, startDate) => {
      const response = await api.post(`/workouts/workout-plans/${id}/schedule/`, { start_date: startDate });
      return response.data;
    },
  },

  // Workouts
  workouts: {
    getAll: async (params = {}) => {
      const response = await api.get('/workouts/workouts/', { params });
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`/workouts/workouts/${id}/`);
      return response.data;
    },
    create: async (data) => {
      const response = await api.post('/workouts/workouts/', data);
      return response.data;
    },
    update: async (id, data) => {
      const response = await api.put(`/workouts/workouts/${id}/`, data);
      return response.data;
    },
    delete: async (id) => {
      const response = await api.delete(`/workouts/workouts/${id}/`);
      return response.data;
    },
    getToday: async () => {
      const response = await api.get('/workouts/workouts/today/');
      return response.data;
    },
    getThisWeek: async () => {
      const response = await api.get('/workouts/workouts/this_week/');
      return response.data;
    },
    getStats: async (params = {}) => {
      const response = await api.get('/workouts/workouts/stats/', { params });
      return response.data;
    },
    complete: async (id) => {
      const response = await api.post(`/workouts/workouts/${id}/complete/`);
      return response.data;
    },
    updateProgress: async (id, progressData) => {
      const response = await api.patch(`/workouts/workouts/${id}/`, progressData);
      return response.data;
    },
    addExercise: async (id, exerciseData) => {
      const response = await api.post(`/workouts/workouts/${id}/add_exercise/`, exerciseData);
      return response.data;
    },
  },

  // Schedules
  schedules: {
    getAll: async (params = {}) => {
      const response = await api.get('/workouts/schedules/', { params });
      return response.data;
    },
    getActive: async () => {
      const response = await api.get('/workouts/schedules/active/');
      return response.data;
    },
    deactivate: async (id) => {
      const response = await api.post(`/workouts/schedules/${id}/deactivate/`);
      return response.data;
    },
  },

  // Favorites
  favorites: {
    getAll: async () => {
      const response = await api.get('/workouts/favorites/');
      return response.data;
    },
    toggle: async (exerciseId) => {
      const response = await api.post('/workouts/favorites/toggle/', { exercise_id: exerciseId });
      return response.data;
    },
  },

  // Exercise Media
  deleteExerciseMedia: async (mediaId) => {
    const response = await api.delete(`/workouts/exercise-media/${mediaId}/`);
    return response.data;
  },
};

export default workoutsService;
