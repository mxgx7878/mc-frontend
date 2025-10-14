// FILE PATH: src/api/handlers/supplierProducts.api.ts
/**
 * SUPPLIER PRODUCTS API - UPDATED
 * 
 * CHANGES:
 * ✅ Added price to RequestProductPayload
 * ✅ Added availability_status to RequestProductPayload  
 * ✅ Updated requestMasterProduct function to send new fields
 */

import axiosInstance from '../axios.config';

// ==================== TYPE DEFINITIONS ====================

export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AddedBy {
  id: number;
  name: string;
  email: string;
  profile_image: string | null;
}

export interface ProductCategory {
  id: number;
  name: string;
}

export interface Supplier {
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
  isMe: boolean;
  supplier: Supplier;
  pivot?: {
    price: string;
    availability_status: string;
    is_active: boolean;
    admin_approval_status: string;
  };
}

export interface MasterProduct {
  id: number;
  added_by: AddedBy;
  is_approved: number;
  approved_by: AddedBy | null;
  slug: string;
  category: ProductCategory;
  product_name: string;
  product_type: string;
  specifications: string;
  unit_of_measure: string;
  tech_doc: string | null;
  photo: string;
  created_at: string;
  updated_at: string;
  supplierOffersCount: number;
  suppliers: SupplierOffer[];
}

export interface ProductsResponse {
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

export interface AddOfferPayload {
  master_product_id: number;
  price: number;
  availability_status: string;
}

export interface UpdateOfferPayload {
  price: number;
  availability_status: string;
}

// ========== UPDATED: Request Product Payload with NEW FIELDS ==========
export interface RequestProductPayload {
  product_name: string;
  product_type: string;
  category_id: number;
  specifications: string;
  unit_of_measure: string;
  price: string;                    // ✅ NEW FIELD
  availability_status: string;      // ✅ NEW FIELD
  photo?: File | null;
}

export interface OfferStatus {
  id: number;
  supplier_id: number;
  master_product_id: number;
  price: string;
  availability_status: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// ==================== API FUNCTIONS ====================

/**
 * Get all master products with supplier offers
 */
export const getProducts = async (params?: {
  page?: number;
  per_page?: number;
  search?: string;
  category_id?: number;
}): Promise<ProductsResponse> => {
  const response = await axiosInstance.get('/master-product-inventory', { params });
  return response.data;
};

/**
 * Get all categories
 */
export const getCategories = async (): Promise<CategoriesResponse> => {
  const response = await axiosInstance.get('/categories');
  return response.data;
};

/**
 * Add product to supplier offers
 */
export const addSupplierOffer = async (payload: AddOfferPayload): Promise<{ message: string }> => {
  const response = await axiosInstance.post('/supplier-offers', payload);
  return response.data;
};

/**
 * Update supplier offer (price/availability)
 */
export const updateSupplierOffer = async (
  offerId: number,
  payload: UpdateOfferPayload
): Promise<{ message: string }> => {
  const response = await axiosInstance.post(`/update-pricing/${offerId}`, payload);
  return response.data;
};

/**
 * Delete supplier offer
 */
export const deleteSupplierOffer = async (offerId: number): Promise<{ message: string }> => {
  const response = await axiosInstance.delete(`/supplier-offers/${offerId}`);
  return response.data;
};

/**
 * Request new master product - UPDATED WITH NEW FIELDS
 * 
 * WHAT: Submit request for new product to be added to master catalog
 * WHY: Suppliers can request products not in the system
 * HOW: Sends FormData with all fields including NEW price and availability_status
 */
export const requestMasterProduct = async (payload: RequestProductPayload): Promise<{ message: string }> => {
  const formData = new FormData();
  
  // Existing fields
  formData.append('product_name', payload.product_name);
  formData.append('product_type', payload.product_type);
  formData.append('category_id', payload.category_id.toString());
  formData.append('specifications', payload.specifications);
  formData.append('unit_of_measure', payload.unit_of_measure);
  
  // ✅ NEW FIELDS
  formData.append('price', payload.price);
  formData.append('availability_status', payload.availability_status);
  
  // Optional photo
  if (payload.photo) {
    formData.append('photo', payload.photo);
  }

  const response = await axiosInstance.post('/request-master-product', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

/**
 * Get supplier offer status
 */
export const getOfferStatus = async (): Promise<OfferStatus[]> => {
  const response = await axiosInstance.get('/supplier-offer-status');
  return response.data;
};

// Export as default object
export const supplierProductsAPI = {
  getProducts,
  getCategories,
  addSupplierOffer,
  updateSupplierOffer,
  deleteSupplierOffer,
  requestMasterProduct,
  getOfferStatus,
};