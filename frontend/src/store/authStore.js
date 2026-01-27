import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      
      login: (accessToken, refreshToken, userData) => {
        set({
          token: accessToken,
          refreshToken: refreshToken,
          user: userData,
        });
      },
      
      logout: () => {
        set({
          token: null,
          refreshToken: null,
          user: null,
        });
      },
      
      updateUser: (userData) => {
        set({ user: userData });
      },
      
      updateToken: (accessToken) => {
        set({ token: accessToken });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
