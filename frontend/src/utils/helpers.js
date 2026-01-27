// Format number with commas
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Format decimal number
export const formatDecimal = (num, decimals = 1) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toFixed(decimals);
};

// Calculate BMI
export const calculateBMI = (weight, height) => {
  if (!weight || !height) return null;
  // weight in kg, height in cm
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(1);
};

// Get BMI category
export const getBMICategory = (bmi) => {
  if (!bmi) return null;
  if (bmi < 18.5) return { label: '低体重', color: 'blue' };
  if (bmi < 25) return { label: '標準', color: 'green' };
  if (bmi < 30) return { label: '過体重', color: 'yellow' };
  return { label: '肥満', color: 'red' };
};

// Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
export const calculateBMR = (weight, height, age, gender) => {
  if (!weight || !height || !age || !gender) return null;
  
  let bmr;
  if (gender === 'male') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
  
  return Math.round(bmr);
};

// Calculate TDEE (Total Daily Energy Expenditure)
export const calculateTDEE = (bmr, activityLevel) => {
  if (!bmr || !activityLevel) return null;
  
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  
  return Math.round(bmr * (activityMultipliers[activityLevel] || 1.2));
};

// Calculate macros based on goal
export const calculateMacros = (calories, goal) => {
  let proteinPercent, carbsPercent, fatsPercent;
  
  switch (goal) {
    case 'weight_loss':
      proteinPercent = 0.35;
      carbsPercent = 0.35;
      fatsPercent = 0.30;
      break;
    case 'muscle_gain':
      proteinPercent = 0.30;
      carbsPercent = 0.45;
      fatsPercent = 0.25;
      break;
    case 'maintenance':
      proteinPercent = 0.30;
      carbsPercent = 0.40;
      fatsPercent = 0.30;
      break;
    default:
      proteinPercent = 0.30;
      carbsPercent = 0.40;
      fatsPercent = 0.30;
  }
  
  return {
    protein: Math.round((calories * proteinPercent) / 4), // 4 cal per gram
    carbs: Math.round((calories * carbsPercent) / 4), // 4 cal per gram
    fats: Math.round((calories * fatsPercent) / 9), // 9 cal per gram
  };
};

// Format date to display format
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('ja-JP', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Format datetime to display format
export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('ja-JP', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get relative time (e.g., "2 hours ago")
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) return 'たった今';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}時間前`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}日前`;
  
  return formatDate(date);
};

// Get week dates
export const getWeekDates = (date = new Date()) => {
  const curr = new Date(date);
  const first = curr.getDate() - curr.getDay() + 1; // Monday
  const dates = [];
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(curr.setDate(first + i));
    dates.push(day);
  }
  
  return dates;
};

// Check if date is today
export const isToday = (date) => {
  const today = new Date();
  const d = new Date(date);
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Get color for value based on range
export const getColorForValue = (value, min, max, reverse = false) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  if (reverse) {
    if (percentage < 33) return 'red';
    if (percentage < 66) return 'yellow';
    return 'green';
  }
  
  if (percentage < 33) return 'green';
  if (percentage < 66) return 'yellow';
  return 'red';
};

// Generate random color
export const generateColor = (seed) => {
  const colors = [
    '#4F46E5', '#7C3AED', '#10B981', '#F59E0B', 
    '#EF4444', '#3B82F6', '#EC4899', '#14B8A6'
  ];
  return colors[seed % colors.length];
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate password strength
export const getPasswordStrength = (password) => {
  if (!password) return { strength: 0, label: 'なし' };
  
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  const labels = ['弱い', '普通', '良い', '強い', '非常に強い'];
  return { strength, label: labels[strength - 1] || '弱い' };
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Sort array by key
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (order === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });
};

// Group array by key
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Convert snake_case to Title Case
export const snakeToTitle = (str) => {
  if (!str) return '';
  return str
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
};

// Download file
export const downloadFile = (data, filename, type = 'text/csv') => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

// Get error message from API response
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data) {
    const firstKey = Object.keys(error.response.data)[0];
    if (firstKey && Array.isArray(error.response.data[firstKey])) {
      return error.response.data[firstKey][0];
    }
  }
  if (error.message) {
    return error.message;
  }
  return '予期しないエラーが発生しました';
};
