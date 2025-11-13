/* FILE: src/api/handlers/projects.api.ts */
// --- src/api/handlers/projects.api.ts ---
import api from '../axios.config';

export interface ProjectDTO {
  id: number;
  name: string;
  site_contact_name?: string | null;
  site_contact_phone?: string | null;
  site_instructions?: string | null;
  delivery_address: string;
  delivery_lat: number;
  delivery_long: number
  added_by: number;
  created_at: string;
  updated_at: string;
  
  // Analytics fields (optional - may not be present in listing)
  total_orders: number;
  total_order_amount: number;
  avg_order_value?: number;
  order_status_breakdown?: Record<string, number>;
  payment_status_breakdown?: Record<string, number>;
  pending_payment_amount?: number;
  paid_amount?: number;
  first_order_date?: string | null;
  last_order_date?: string | null;
  days_since_last_order?: number | null;
  top_products?: Array<{
    product_id: number;
    product_name: string;
    product_image: string | null;
    total_quantity: number;
    order_count: number;
  }>;
  has_incomplete_orders?: boolean;
  incomplete_orders_count?: number;
}

export interface ProjectOrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string | null;
  product_type: string;
  product_specifications: string;
  quantity: number;
  is_quoted: number;
  quoted_price: string;
  supplier_unit_cost: string;
  supplier_delivery_cost: string;
  display_unit_price: number;
  supplier_name: string | null;
  custom_blend_mix: string | null;
}

export interface ProjectOrder {
  id: number;
  po_number: string;
  delivery_date: string;
  delivery_time: string;
  delivery_method: string;
  order_status: string;
  payment_status: string;
  total_price: number;
  items: ProjectOrderItem[];
}

export interface ProjectProduct {
  product_id: number;
  product_name: string;
  product_image: string | null;
  product_type: string;
  product_specifications: string;
  unit_price: number;
  delivery_cost: number;
  total_quantity: number;
  orders_count: number;
  first_order_id: number;
  last_order_id: number;
  last_order_item_id: number; // NEW
}

export interface ProjectAnalytics {
  total_orders: number;
  total_order_amount: number;
  avg_order_value: number;
  by_order_status: Record<string, number>;
  first_order_date: string | null;
  last_order_date: string | null;
}

export interface ProjectDetailsResponse {
  project: ProjectDTO;
  analytics: ProjectAnalytics;
  orders: ProjectOrder[];
  project_products: ProjectProduct[];
}

export interface Paginated<T> { data: T[]; meta: { page: number; per_page: number; total: number } }

export type ProjectCreateInput = {
  name: string;
  site_contact_name?: string | null;
  site_contact_phone?: string | null;
  site_instructions?: string | null;
  delivery_address: string;
  delivery_lat: number;
  delivery_long: number;
};


export interface ReorderFromProjectPayload {
  project_id: number;
  product_id: number;
  order_item_id: number; // NEW - Required for pricing consistency
  quantity: number;
  po_number?: string;
  delivery_date: string;
  delivery_time?: string;
  delivery_method?: string;
  special_notes?: string;
  custom_blend_mix?: string;
}

export type ProjectUpdateInput = Partial<ProjectCreateInput> & { id: number };

const BASE = '/projects';

export const projectsAPI = {
  list: (params: Record<string, unknown>) => api.get<Paginated<ProjectDTO>>(BASE, { params }).then(r => r.data),
  get:  (id: number) => api.get<ProjectDTO>(`${BASE}/${id}`).then(r => r.data),
  getDetails: (id: number, params?: Record<string, unknown>) => 
    api.get<ProjectDetailsResponse>(`/project-details/${id}`, { params }).then(r => r.data),
  create: (payload: ProjectCreateInput) => api.post<ProjectDTO>(BASE, payload).then(r => r.data),
  update: ({ id, ...payload }: ProjectUpdateInput) => api.post<ProjectDTO>(`${BASE}/${id}`, payload).then(r => r.data),
  remove: (id: number) => api.delete(`${BASE}/${id}`).then(r => r.data),
  reorderFromProject: (payload: ReorderFromProjectPayload) => 
    api.post<{message: string; order: any}>('/reorder-from-project', payload).then(r => r.data),
};