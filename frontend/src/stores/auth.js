import { defineStore } from 'pinia';

import { apiClient } from '../api/client';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    checked: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
  },

  actions: {
    /** Prüft die Session beim App-Start via GET /api/auth/me. */
    async fetchCurrentUser() {
      try {
        const data = await apiClient.get('/auth/me');
        this.user = data ?? null;
      } catch {
        this.user = null;
      } finally {
        this.checked = true;
      }
      return this.user;
    },

    async login(username, password) {
      const data = await apiClient.post('/auth/login', { username, password });
      this.user = data ?? null;
      this.checked = true;
      return this.user;
    },

    async logout() {
      await apiClient.post('/auth/logout');
      this.user = null;
    },

    async register(inviteCode, username, password) {
      return apiClient.post('/auth/register', { inviteCode, username, password });
    },

    async resetPassword(resetCode, newPassword) {
      return apiClient.post('/auth/reset-password', { resetCode, newPassword });
    },
  },
});
