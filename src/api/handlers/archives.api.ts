// FILE PATH: src/api/handlers/archives.api.ts

/**
 * Archives API Handler
 * Handles all API calls for admin archives management
 */

import api from '../axios.config';

// ==================== TYPES ====================

export interface ArchivedOrder {
  id: number;
  po_number: string;
  project?: {
    id: number;
    name: string;
  };
  client?: {
    id: number;
    name: string;
  };
  total_price: number;
  order_status: string;
  payment_status: string;
  archived_by?: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

export interface ArchivedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  company?: {
    id: number;
    name: string;
  };
  contact_number?: string;
  isDeleted: number;
  created_at: string;
  updated_at: string;
}

export interface ArchivedProject {
  id: number;
  name: string;
  added_by?: {
    id: number;
    name: string;
  };
  delivery_address: string;
  is_archived: number;
  archived_by?: number;
  created_at: string;
  updated_at: string;
}

export interface PaginationData {
  data: any[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ArchivesResponse {
  success: boolean;
  data: {
    orders: PaginationData & { data: ArchivedOrder[] };
    users: PaginationData & { data: ArchivedUser[] };
    projects: PaginationData & { data: ArchivedProject[] };
  };
}

export interface ArchiveOrderResponse {
  success: boolean;
  message: string;
  order: {
    id: number;
    is_archived: number;
  };
}

export interface ArchiveParams {
  orders_per_page?: number;
  users_per_page?: number;
  projects_per_page?: number;
  orders_page?: number;
  users_page?: number;
  projects_page?: number;
}

// ==================== API FUNCTIONS ====================

export const archivesAPI = {
  /**
   * Get all archived items (orders, users, projects)
   * @param params - Pagination parameters for each type
   */
  getArchives: async (params?: ArchiveParams): Promise<ArchivesResponse> => {
    try {
      const response = await api.get('/admin/archives', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch archives');
    }
  },

  /**
   * Archive (soft delete) an order
   * @param orderId - Order ID to archive
   */
  archiveOrder: async (orderId: number): Promise<ArchiveOrderResponse> => {
    try {
      const response = await api.delete(`/admin/delete-order/${orderId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to archive order');
    }
  },

  /**
   * Restore an archived order (optional - if you add this endpoint later)
   * @param orderId - Order ID to restore
   */
  restoreOrder: async (orderId: number): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post(`/admin/archives/orders/${orderId}/restore`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to restore order');
    }
  },

  /**
   * Restore an archived user (optional - if you add this endpoint later)
   * @param userId - User ID to restore
   */
  restoreUser: async (userId: number): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post(`/admin/archives/users/${userId}/restore`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to restore user');
    }
  },

  /**
   * Restore an archived project (optional - if you add this endpoint later)
   * @param projectId - Project ID to restore
   */
  restoreProject: async (projectId: number): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post(`/admin/archives/projects/${projectId}/restore`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to restore project');
    }
  },
};