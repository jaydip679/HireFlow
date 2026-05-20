import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  accessToken: null, // Stored strictly in-memory (XSS protection)

  setAccessToken: (accessToken) => set({ accessToken }),

  login: (user, accessToken) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, accessToken });
  },

  logout: () => {
    localStorage.removeItem('user');
    set({ user: null, accessToken: null });
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));
