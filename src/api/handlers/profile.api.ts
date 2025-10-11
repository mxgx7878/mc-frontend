// src/api/handlers/profile.api.ts
import api from '../axios.config';

interface UpdateProfileData {
  name?: string;
  email?: string;
  contact_name?: string;
  contact_number?: string;
  company_name?: string;
  profile_image?: File;
  
  // Client-specific
  shipping_address?: string;
  billing_address?: string;
  lat?: number;
  long?: number;
  
  // Supplier-specific
  location?: string;
  delivery_radius?: number;
}

interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export const profileAPI = {
  /**
   * Update user profile - only sends changed fields
   * @param data - Partial profile data (only dirty fields)
   */
  updateProfile: async (data: UpdateProfileData) => {
    try {
      const formData = new FormData();
      
      // Append only the fields that are present in data object
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'profile_image' && value instanceof File) {
            formData.append('profile_image', value);
          } else if (typeof value === 'number') {
            formData.append(key, String(value));
          } else {
            formData.append(key, value as string);
          }
        }
      });

      const response = await api.post('/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 
        error?.message || 
        'Failed to update profile'
      );
    }
  },

  /**
   * Change user password
   * @param data - Current and new password
   * @returns response with message and new token
   */
  changePassword: async (data: ChangePasswordData) => {
    try {
      const response = await api.post('/change-password', data);
      return response.data; // { message: "Password updated", token: "..." }
    } catch (error: any) {
      // Handle structured error from backend
      if (error?.response?.data?.error) {
        const errors = error.response.data.error;
        
        // Check if it's a validation error object
        if (typeof errors === 'object') {
          const firstError = Object.values(errors)[0];
          throw new Error(
            Array.isArray(firstError) ? firstError[0] : String(firstError)
          );
        }
        
        throw new Error(String(errors));
      }
      
      throw new Error(
        error?.message || 
        'Failed to change password'
      );
    }
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/user');
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 
        error?.message || 
        'Failed to fetch user data'
      );
    }
  },
};