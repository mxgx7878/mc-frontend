// FILE PATH: src/api/handlers/masterProducts.api.ts

/**
 * Master Products API Handler
 * 
 * Following the project's pattern:
 * - Uses centralized axios config
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
  created_at?: string;
  updated_at?: string;
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
  master_product_id: number;
  price: string;
  availability_status: string;
  status: string;
  created_at: string;
  updated_at: string;
  supplier: {
    id: number;
    name: string;
    email: string;
    profile_image: string | null;
    delivery_zones: Array<{
      address: string;
      lat: number;
      long: number;
      radius: number;
    }>;
  };
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

export interface CategoriesResponse {
  current_page: number;
  data: Category[];
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
  specifications: string;
  unit_of_measure: string;
  category: number;
  photo?: File | null;
  tech_doc?: File | null;
}

export interface UpdateMasterProductPayload extends Partial<CreateMasterProductPayload> {}

export interface ApproveRejectOfferPayload {
  status: 'Approved' | 'Rejected' | 'Pending';
}

// ===========================
// API Handler
// ===========================

export const masterProductsAPI = {
  /**
   * Get paginated list of master products
   */
  getAll: async (filters: MasterProductsFilters = {}): Promise<PaginatedMasterProductsResponse> => {
    try {
      const response = await api.get('/master-products', { params: filters });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch master products');
    }
  },

  /**
   * Get single master product by ID with supplier offers
   */
  getById: async (id: number): Promise<MasterProductWithOffers> => {
    try {
      const response = await api.get(`/master-products/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || `Failed to fetch product with ID ${id}`);
    }
  },

  /**
   * Get all categories
   */
  getCategories: async (): Promise<CategoriesResponse> => {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch categories');
    }
  },

  /**
   * Create new master product
   */
  create: async (payload: CreateMasterProductPayload): Promise<{ message: string; product: MasterProduct }> => {
    try {
      const formData = new FormData();
      
      formData.append('product_name', payload.product_name);
      formData.append('product_type', payload.product_type);
      formData.append('specifications', payload.specifications);
      formData.append('unit_of_measure', payload.unit_of_measure);
      formData.append('category', payload.category.toString());
      
      if (payload.photo) formData.append('photo', payload.photo);
      if (payload.tech_doc) formData.append('tech_doc', payload.tech_doc);

      const response = await api.post('/master-products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to create product');
    }
  },

  /**
   * Update existing master product
   */
  update: async (id: number, payload: UpdateMasterProductPayload): Promise<{ message: string; product: MasterProduct }> => {
    try {
      const formData = new FormData();
      
      if (payload.product_name) formData.append('product_name', payload.product_name);
      if (payload.product_type) formData.append('product_type', payload.product_type);
      if (payload.specifications) formData.append('specifications', payload.specifications);
      if (payload.unit_of_measure) formData.append('unit_of_measure', payload.unit_of_measure);
      if (payload.category) formData.append('category', payload.category.toString());
      
      if (payload.photo) formData.append('photo', payload.photo);
      if (payload.tech_doc) formData.append('tech_doc', payload.tech_doc);

      const response = await api.post(`/master-products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || `Failed to update product with ID ${id}`);
    }
  },

  /**
   * Approve or Reject master product
   */
  toggleApproval: async (id: number): Promise<{ message: string; is_approved: boolean }> => {
    try {
      const response = await api.get(`/approve-reject-master-product/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || `Failed to toggle approval for product ID ${id}`);
    }
  },

  /**
   * Delete master product
   */
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/master-products/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || `Failed to delete product with ID ${id}`);
    }
  },

  /**
   * Approve or Reject supplier offer
   */
  approveRejectOffer: async (
    offerId: number, 
    payload: ApproveRejectOfferPayload
  ): Promise<{ message: string; status: string }> => {
    try {
      const response = await api.post(`/approve-reject-supplier-offer/${offerId}`, payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || `Failed to update supplier offer status`);
    }
  },
};