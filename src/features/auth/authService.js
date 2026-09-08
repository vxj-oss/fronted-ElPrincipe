import { apiRequest } from '../../utils/api';

export const authService = {
  async login(nombre_usuario, password) {
    return await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nombre_usuario, password }),
    });
  },

  async getMe() {
    return await apiRequest('/auth/me');
  },

  async register(userData) {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
};