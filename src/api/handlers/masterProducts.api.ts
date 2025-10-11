// FILE PATH: src/api/handlers/masterProducts.api.ts

/**
 * Master Products API Handler
 * 
 * This service handles all API calls related to Master Products.
 * Following the project's pattern:
 * - Uses centralized axios config from src/api/axios.config.ts
 * - TypeScript interfaces for type safety
 * - Structured error handling
 * - Returns response.data directly
 */

import api from '../axios.config';

// ===========================
// TypeScript Interfaces
// ===========================

export interface Category {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  profile_image?: string | null;
}

export interface MasterProduct {
  id: number;
  added_by: User;
  is_approved: 0 | 1;
  approved_by: User | null;
  slug: string;
  category: Category;
  product_name: string;
  product_type: string;
  specifications: string;
  unit_of_measure: string;
  tech_doc: string | null;
  photo: string | null;
  created_at: string;
  updated_at: string;
  supplierOffersCount: number;
}

export interface SupplierOffer {
  id: number;
  supplier_id: number;
  supplier: User;
  master_product_id: number;
  price: number;
  // Add other fields as needed
}

export interface MasterProductWithOffers extends MasterProduct {
  supplierOffers: SupplierOffer[];
}

export interface PaginatedMasterProductsResponse {
  current_page: number;
  data: MasterProduct[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface MasterProductsFilters {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  is_approved?: 0 | 1;
}

export interface CreateMasterProductPayload {
  product_name: string;
  product_type: string;
  specifications?: string;
  unit_of_measure?: string;
  tech_doc?: File;
  photo?: File;
  is_approved?: boolean;
  category?: string;
}

export interface UpdateMasterProductPayload extends Partial<CreateMasterProductPayload> {}

// ===========================
// API Handler
// ===========================

export const masterProductsAPI = {
  /**
   * Get paginated list of master products
   * 
   * WHY: Fetch all products with pagination and optional filters
   * HOW: Sends GET request to /master-products with query params
   * 
   * @param filters - Pagination and filter options
   * @returns Paginated product list
   */
  getAll: async (filters: MasterProductsFilters = {}): Promise<PaginatedMasterProductsResponse> => {
    try {
      const response = await api.get('/master-products', { params: filters });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.message || 'Failed to fetch master products'
      );
    }
  },

  /**
   * Get single master product by ID
   * 
   * WHY: Fetch detailed product info including supplier offers
   * HOW: Sends GET request to /master-products/{id}
   * 
   * @param id - Product ID
   * @returns Product details with supplier offers
   */
  getById: async (id: number): Promise<MasterProductWithOffers> => {
    try {
      const response = await api.get(`/master-products/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.message || `Failed to fetch product with ID ${id}`
      );
    }
  },

  /**
   * Create new master product
   * 
   * WHY: Add new product to the system
   * HOW: Converts payload to FormData and sends POST request
   * 
   * @param payload - Product data
   * @returns Created product data
   */
  create: async (payload: CreateMasterProductPayload): Promise<{ message: string; product: MasterProduct }> => {
    try {
      const formData = new FormData();
      
      // Append all fields to FormData
      formData.append('product_name', payload.product_name);
      formData.append('product_type', payload.product_type);
      
      if (payload.specifications) formData.append('specifications', payload.specifications);
      if (payload.unit_of_measure) formData.append('unit_of_measure', payload.unit_of_measure);
      if (payload.category) formData.append('category', payload.category);
      if (payload.is_approved !== undefined) formData.append('is_approved', payload.is_approved ? '1' : '0');
      
      // Append files if present
      if (payload.tech_doc) formData.append('tech_doc', payload.tech_doc);
      if (payload.photo) formData.append('photo', payload.photo);

      const response = await api.post('/master-products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.message || 'Failed to create product'
      );
    }
  },

  /**
   * Update existing master product
   * 
   * WHY: Modify product details
   * HOW: Converts payload to FormData and sends POST to /master-products/{id}
   *      (Laravel uses POST for file uploads with _method spoofing)
   * 
   * @param id - Product ID
   * @param payload - Updated product data (only changed fields)
   * @returns Updated product data
   */
  update: async (id: number, payload: UpdateMasterProductPayload): Promise<{ message: string; product: MasterProduct }> => {
    try {
      const formData = new FormData();
      
      // Append only provided fields
      if (payload.product_name) formData.append('product_name', payload.product_name);
      if (payload.product_type) formData.append('product_type', payload.product_type);
      if (payload.specifications) formData.append('specifications', payload.specifications);
      if (payload.unit_of_measure) formData.append('unit_of_measure', payload.unit_of_measure);
      if (payload.category) formData.append('category', payload.category);
      if (payload.is_approved !== undefined) formData.append('is_approved', payload.is_approved ? '1' : '0');
      
      // Append files if present
      if (payload.tech_doc) formData.append('tech_doc', payload.tech_doc);
      if (payload.photo) formData.append('photo', payload.photo);

      const response = await api.post(`/master-products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.message || `Failed to update product with ID ${id}`
      );
    }
  },

  /**
   * Toggle product approval status (Active/Inactive)
   * 
   * WHY: Admin needs to activate/deactivate products
   * HOW: Sends partial update with only is_approved field
   * 
   * @param id - Product ID
   * @param isApproved - New approval status
   * @returns Updated product data
   */
  toggleApproval: async (id: number, isApproved: boolean): Promise<{ message: string; product: MasterProduct }> => {
    try {
      const formData = new FormData();
      formData.append('is_approved', isApproved ? '1' : '0');
      
      const response = await api.post(`/master-products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.message || `Failed to toggle approval for product ID ${id}`
      );
    }
  },

  /**
   * Delete master product
   * 
   * WHY: Remove product from system
   * HOW: Sends DELETE request to /master-products/{id}
   * 
   * @param id - Product ID
   * @returns Success message
   */
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/master-products/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.message || `Failed to delete product with ID ${id}`
      );
    }
  },
};