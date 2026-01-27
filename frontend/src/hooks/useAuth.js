import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, token, login, logout, register, updateProfile } = useAuthStore();

  const handleLogin = async (credentials) => {
    try {
      await login(credentials);
      navigate(ROUTES.DASHBOARD);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const handleRegister = async (userData) => {
    try {
      await register(userData);
      navigate(ROUTES.PROFILE_SETUP);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || 'Registration failed' 
      };
    }
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const isAuthenticated = !!token;

  return {
    user,
    token,
    isAuthenticated,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProfile,
  };
};
