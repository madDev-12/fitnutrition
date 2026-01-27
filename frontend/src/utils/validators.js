// Email validation
export const validateEmail = (email) => {
  if (!email) {
    return 'メールアドレスは必須です';
  }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    return '有効なメールアドレスを入力してください';
  }
  return null;
};

// Password validation
export const validatePassword = (password) => {
  if (!password) {
    return 'パスワードは必須です';
  }
  if (password.length < 8) {
    return 'パスワードは8文字以上である必要があります';
  }
  if (!/[a-z]/.test(password)) {
    return 'パスワードには小文字を1文字以上含める必要があります';
  }
  if (!/[A-Z]/.test(password)) {
    return 'パスワードには大文字を1文字以上含める必要があります';
  }
  if (!/\d/.test(password)) {
    return 'パスワードには数字を1文字以上含める必要があります';
  }
  return null;
};

// Confirm password validation
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return 'パスワードの確認を入力してください';
  }
  if (password !== confirmPassword) {
    return 'パスワードが一致しません';
  }
  return null;
};

// Name validation
export const validateName = (name, fieldName = '名前') => {
  if (!name) {
    return `${fieldName}は必須です`;
  }
  if (name.length < 2) {
    return `${fieldName}は2文字以上である必要があります`;
  }
  if (name.length > 50) {
    return `${fieldName}は50文字以内である必要があります`;
  }
  return null;
};

// Number validation
export const validateNumber = (value, fieldName = '値', min = null, max = null) => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName}は必須です`;
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    return `${fieldName}は有効な数値である必要があります`;
  }
  
  if (min !== null && num < min) {
    return `${fieldName}は${min}以上である必要があります`;
  }
  
  if (max !== null && num > max) {
    return `${fieldName}は${max}以下である必要があります`;
  }
  
  return null;
};

// Weight validation (kg)
export const validateWeight = (weight) => {
  return validateNumber(weight, '体重', 20, 300);
};

// Height validation (cm)
export const validateHeight = (height) => {
  return validateNumber(height, '身長', 100, 250);
};

// Age validation
export const validateAge = (age) => {
  return validateNumber(age, '年齢', 13, 120);
};

// Body fat percentage validation
export const validateBodyFat = (bodyFat) => {
  if (!bodyFat) return null; // Optional field
  return validateNumber(bodyFat, '体脂肪率', 3, 60);
};

// Date validation
export const validateDate = (date, fieldName = '日付') => {
  if (!date) {
    return `${fieldName}は必須です`;
  }
  
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return `有効な${fieldName}を入力してください`;
  }
  
  // Check if date is not in the future
  if (d > new Date()) {
    return `${fieldName}は未来の日付にできません`;
  }
  
  return null;
};

// Required field validation
export const validateRequired = (value, fieldName = 'フィールド') => {
  if (value === null || value === undefined || value === '' || 
      (Array.isArray(value) && value.length === 0)) {
    return `${fieldName}は必須です`;
  }
  return null;
};

// Select validation
export const validateSelect = (value, fieldName = 'フィールド') => {
  if (!value || value === '') {
    return `${fieldName}を選択してください`;
  }
  return null;
};

// Calories validation
export const validateCalories = (calories) => {
  return validateNumber(calories, 'カロリー', 0, 10000);
};

// Macros validation
export const validateMacros = (value, macroName) => {
  return validateNumber(value, macroName, 0, 1000);
};

// Exercise sets validation
export const validateSets = (sets) => {
  return validateNumber(sets, 'セット数', 1, 20);
};

// Exercise reps validation
export const validateReps = (reps) => {
  return validateNumber(reps, '回数', 1, 100);
};

// Exercise weight validation
export const validateExerciseWeight = (weight) => {
  if (!weight) return null; // Optional for bodyweight exercises
  return validateNumber(weight, '重量', 0, 500);
};

// Duration validation (minutes)
export const validateDuration = (duration) => {
  return validateNumber(duration, '時間', 1, 480);
};

// URL validation
export const validateURL = (url) => {
  if (!url) return null; // Optional field
  
  try {
    new URL(url);
    return null;
  } catch {
    return '有効なURLを入力してください';
  }
};

// Phone number validation
export const validatePhone = (phone) => {
  if (!phone) return null; // Optional field
  
  const re = /^[\d\s\-\+\(\)]+$/;
  if (!re.test(phone)) {
    return '有効な電話番号を入力してください';
  }
  
  if (phone.replace(/\D/g, '').length < 10) {
    return '電話番号は10桁以上である必要があります';
  }
  
  return null;
};

// Form validation helper
export const validateForm = (values, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = values[field];
    
    if (rule.required) {
      const error = validateRequired(value, rule.label || field);
      if (error) {
        errors[field] = error;
        return;
      }
    }
    
    if (rule.type === 'email') {
      const error = validateEmail(value);
      if (error) errors[field] = error;
    }
    
    if (rule.type === 'password') {
      const error = validatePassword(value);
      if (error) errors[field] = error;
    }
    
    if (rule.type === 'number') {
      const error = validateNumber(value, rule.label, rule.min, rule.max);
      if (error) errors[field] = error;
    }
    
    if (rule.type === 'date') {
      const error = validateDate(value, rule.label);
      if (error) errors[field] = error;
    }
    
    if (rule.custom) {
      const error = rule.custom(value, values);
      if (error) errors[field] = error;
    }
  });
  
  return errors;
};

// Check if form has errors
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

// Get first error message
export const getFirstError = (errors) => {
  const keys = Object.keys(errors);
  return keys.length > 0 ? errors[keys[0]] : null;
};
