// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Activity Levels
export const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: '座りがち', description: 'ほとんど運動しない' },
  { value: 'light', label: '軽い活動', description: '週1-3日の軽い運動' },
  { value: 'moderate', label: '中程度の活動', description: '週3-5日の中程度の運動' },
  { value: 'very', label: '活発', description: '週6-7日の激しい運動' },
  { value: 'extra', label: '非常に活発', description: '非常に激しい運動と肉体労働' },
];

// Fitness Goals
export const FITNESS_GOALS = [
  { value: 'weight_loss', label: '減量', icon: '📉' },
  { value: 'muscle_gain', label: '筋肉増強', icon: '💪' },
  { value: 'maintenance', label: '維持', icon: '⚖️' },
  { value: 'endurance', label: '持久力', icon: '🏃' },
  { value: 'flexibility', label: '柔軟性', icon: '🧘' },
];

// Gender Options
export const GENDER_OPTIONS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
];

// Exercise Types
export const EXERCISE_TYPES = [
  { value: 'strength', label: '筋力トレーニング' },
  { value: 'cardio', label: '有酸素運動' },
  { value: 'flexibility', label: '柔軟性' },
  { value: 'balance', label: 'バランス' },
  { value: 'sports', label: 'スポーツ' },
];

// Difficulty Levels
export const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: '初心者', color: 'green' },
  { value: 'intermediate', label: '中級者', color: 'yellow' },
  { value: 'advanced', label: '上級者', color: 'red' },
];

// Meal Types
export const MEAL_TYPES = [
  { value: 'breakfast', label: '朝食', icon: '🌅' },
  { value: 'lunch', label: '昼食', icon: '☀️' },
  { value: 'dinner', label: '夕食', icon: '🌙' },
  { value: 'snack', label: '間食', icon: '🍎' },
];

// Equipment Types
export const EQUIPMENT_TYPES = [
  'barbell', 'dumbbell', 'kettlebell', 'machine', 'cable',
  'bodyweight', 'resistance_band', 'medicine_ball', 'other'
];

// Muscle Groups
export const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'abs', 'obliques', 'quads', 'hamstrings',
  'glutes', 'calves', 'traps', 'lats'
];

// Date Formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const DISPLAY_DATE_FORMAT = 'MMM DD, YYYY';
export const DISPLAY_DATETIME_FORMAT = 'MMM DD, YYYY HH:mm';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Chart Colors
export const CHART_COLORS = {
  primary: '#4F46E5',
  secondary: '#7C3AED',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

// BMI Categories
export const BMI_CATEGORIES = [
  { min: 0, max: 18.5, label: '低体重', color: 'blue' },
  { min: 18.5, max: 25, label: '標準', color: 'green' },
  { min: 25, max: 30, label: '過体重', color: 'yellow' },
  { min: 30, max: 100, label: '肥満', color: 'red' },
];

// Dietary Restrictions
export const DIETARY_RESTRICTIONS = [
  'vegetarian', 'vegan', 'gluten_free', 'dairy_free',
  'nut_free', 'halal', 'kosher', 'low_carb', 'keto'
];

// Common Allergies
export const COMMON_ALLERGIES = [
  'peanuts', 'tree_nuts', 'milk', 'eggs', 'wheat',
  'soy', 'fish', 'shellfish', 'sesame'
];

// Toast Duration
export const TOAST_DURATION = 3000;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  PROFILE_SETUP: '/profile/setup',
  MEASUREMENTS: '/measurements',
  NUTRITION: '/nutrition',
  WORKOUTS: '/workouts',
  PROGRESS: '/progress',
  SETTINGS: '/settings',
};
