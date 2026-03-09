// FILE PATH: src/api/handlers/surcharges.api.ts

import api from '../axios.config';
import type {
  SurchargesListResponse,
  TestingFeesListResponse,
  UpdateSurchargePayload,
  UpdateTestingFeePayload,
} from '../../types/surcharge.types';

export const surchargesAPI = {
  // ==================== SURCHARGES ====================

  getSurcharges: async (params?: { search?: string }): Promise<SurchargesListResponse> => {
    try {
      const response = await api.get('/admin/surcharges', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to fetch surcharges');
    }
  },

  updateSurcharge: async (id: number, payload: UpdateSurchargePayload) => {
    try {
      const response = await api.post(`/admin/surcharges/${id}`, payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to update surcharge');
    }
  },

  toggleSurcharge: async (id: number) => {
    try {
      const response = await api.patch(`/admin/surcharges/${id}/toggle`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to toggle surcharge');
    }
  },

  deleteSurcharge: async (id: number) => {
    try {
      const response = await api.delete(`/admin/surcharges/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to delete surcharge');
    }
  },

  // ==================== TESTING FEES ====================

  getTestingFees: async (params?: { search?: string }): Promise<TestingFeesListResponse> => {
    try {
      const response = await api.get('/admin/testing-fees', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to fetch testing fees');
    }
  },

  updateTestingFee: async (id: number, payload: UpdateTestingFeePayload) => {
    try {
      const response = await api.post(`/admin/testing-fees/${id}`, payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to update testing fee');
    }
  },

  toggleTestingFee: async (id: number) => {
    try {
      const response = await api.patch(`/admin/testing-fees/${id}/toggle`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to toggle testing fee');
    }
  },

  deleteTestingFee: async (id: number) => {
    try {
      const response = await api.delete(`/admin/testing-fees/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to delete testing fee');
    }
  },
  getGeneralSurcharges: async (): Promise<{ success: boolean; data: import('../../types/surcharge.types').Surcharge[] }> => {
    try {
      const response = await api.get('/general-surcharges');
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to fetch surcharges');
    }
  },
};