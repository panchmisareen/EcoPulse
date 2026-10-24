import api from './api';
import type { TokenResponse, User } from '../types';

export const authService = {
  async demoLogin(): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/auth/demo-login');
    return data;
  },

  async login(email: string, password: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/auth/login', { email, password });
    return data;
  },

  async register(email: string, password: string, username: string, full_name: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/auth/register', { email, password, username, full_name });
    return data;
  },

  setToken(token: string) {
    localStorage.setItem('eco_token', token);
  },

  setUser(user: User) {
    localStorage.setItem('eco_user', JSON.stringify(user));
  },

  getToken(): string | null {
    return localStorage.getItem('eco_token');
  },

  getUser(): User | null {
    const raw = localStorage.getItem('eco_user');
    return raw ? JSON.parse(raw) : null;
  },

  logout() {
    localStorage.removeItem('eco_token');
    localStorage.removeItem('eco_user');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('eco_token');
  },
};
