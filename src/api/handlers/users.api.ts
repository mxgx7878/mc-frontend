// src/api/handlers/users.api.ts
import api from '../axios.config';

export interface UserFilters {
  role?: string;
  company_id?: string;
  contact_name?: string;
  location?: string;
  lat?: number;
  long?: number;
  isDeleted?: boolean;
  page?: number;
  per_page?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'client' | 'supplier';
  company_id?: number;
  company?: {
    id: number;
    name: string;
  };
  contact_name?: string;
  contact_number?: string;
  location?: string;
  lat?: number;
  long?: number;
  delivery_radius?: number;
  shipping_address?: string;
  billing_address?: string;
  client_public_id?: string;
  profile_image?: string;
  isDeleted: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedUsers {
  current_page: number;
  data: User[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export const usersAPI = {
  /**
   * Get paginated list of users with filters
   */
  getUsers: async (params: UserFilters): Promise<PaginatedUsers> => {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch users');
    }
  },

  /**
   * Get single user by ID
   */
  getUser: async (id: number): Promise<User> => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch user details');
    }
  },

  /**
   * Create new user
   */
  createUser: async (data: FormData) => {
    try {
      const response = await api.post('/users', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to create user');
    }
  },

  /**
   * Update existing user
   */
  updateUser: async (id: number, data: FormData) => {
    try {
      const response = await api.post(`/users/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to update user');
    }
  },

  /**
   * Soft delete or restore user (toggle)
   */
  deleteRestoreUser: async (id: number) => {
    try {
      const response = await api.get(`/user-delete-restore/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to update user status');
    }
  },

  /**
   * Check if company exists
   */
  checkCompany: async (companyName: string) => {
    try {
      const response = await api.post('/check-company', { company_name: companyName });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to check company');
    }
  },
};

/**
 * Companies API - separate concern
 */
export const companiesAPI = {
  /**
   * Get all companies (no pagination from your backend)
   */
  getAll: async () => {
    try {
      const response = await api.get('/companies');
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch companies');
    }
  },
};