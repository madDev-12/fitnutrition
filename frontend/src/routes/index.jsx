import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Layout
import Layout from '../components/layout/Layout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Main Pages
import Dashboard from '../pages/Dashboard';
import Measurements from '../pages/Measurements';
import Nutrition from '../pages/Nutrition';
import Workouts from '../pages/Workouts';
import Progress from '../pages/Progress';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { token } = useAuthStore();
  
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/measurements" element={
        <ProtectedRoute>
          <Measurements />
        </ProtectedRoute>
      } />
      <Route path="/nutrition" element={
        <ProtectedRoute>
          <Nutrition />
        </ProtectedRoute>
      } />
      <Route path="/workouts" element={
        <ProtectedRoute>
          <Workouts />
        </ProtectedRoute>
      } />
      <Route path="/progress" element={
        <ProtectedRoute>
          <Progress />
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />

      {/* Default Routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
