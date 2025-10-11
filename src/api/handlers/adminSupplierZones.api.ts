// src/api/handlers/adminSupplierZones.api.ts
import api from '../axios.config';

export interface DeliveryZone {
  address: string;
  lat: number;
  long: number;
  radius: number;
}

export interface SupplierWithZones {
  id: number;
  name: string;
  email: string;
  profile_image?: string;
  delivery_zones: DeliveryZone[];
}

export interface PaginatedSuppliersResponse {
  current_page: number;
  data: SupplierWithZones[];
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

export interface AdminSupplierZonesParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export const adminSupplierZonesAPI = {
  /**
   * Get all suppliers with their delivery zones (paginated)
   */
  getSuppliersWithZones: async (
    params: AdminSupplierZonesParams = {}
  ): Promise<PaginatedSuppliersResponse> => {
    try {
      const response = await api.get('/suppliers-with-zones', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.message || 'Failed to fetch suppliers with zones'
      );
    }
  },
};