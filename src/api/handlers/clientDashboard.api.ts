// FILE PATH: src/api/handlers/clientDashboard.api.ts

/**
 * Client Dashboard API Handler
 * Handles all API calls for client dashboard analytics
 */

import api from '../axios.config';

// ==================== TYPES ====================

export interface ClientDashboardStats {
  total_orders: number;
  open_orders: number;
  todays_deliveries_count: number;
  todays_deliveries_qty: number;
  range_days: number;
  range_from: string;
  range_to: string;
}

export interface TodayDelivery {
  id: number;
  order_id: number;
  po_number: string | null;
  project: { id: number; name: string } | null;
  delivery_date: string;
  delivery_time: string | null;
  delivery_address: string | null;
  qty: number;
  status: string;
  product: { id: number; product_name: string } | null;
  supplier: { id: number; company_name: string } | null;
}

export interface DeliveryPerDay {
  date: string;
  deliveries_count: number;
  total_qty: number;
}

export interface DeliveryStatusBreakdown {
  status: string;
  count: number;
}

// NEW: Monthly types
export interface MonthlySummary {
  month: string;
  month_label: string;
  total_deliveries: number;
  total_qty: number;
  confirmed_count: number;
  unconfirmed_count: number;
  delivered_count: number;
  scheduled_count: number;
  cancelled_count: number;
}

export interface MonthlyPerDay {
  date: string;
  total_deliveries: number;
  total_qty: number;
  confirmed: number;
  unconfirmed: number;
}

export interface MonthlyDelivery {
  id: number;
  order_id: number;
  order_item_id: number;
  po_number: string | null;
  project: { id: number; name: string } | null;
  product: { id: number; product_name: string; unit_of_measure: string | null } | null;
  supplier: { id: number; company_name: string } | null;
  delivery_date: string;
  delivery_time: string | null;
  qty: number;
  status: string;
  supplier_confirmed: boolean;
  delivery_address: string | null;
}

// NEW: Recent order type
export interface RecentOrder {
  id: number;
  po_number: string | null;
  project: { id: number; name: string } | null;
  order_status: string;
  payment_status: string;
  delivery_date: string | null;
  delivery_address: string | null;
  total_price: number;
  items_count: number;
  products: { product_name: string; quantity: number }[];
  delivery_slots_total: number;
  delivery_slots_confirmed: number;
  repeat_order: boolean;
  created_at: string;
}

export interface ClientDashboardResponse {
  success: boolean;
  data: {
    stats: ClientDashboardStats;
    todays_deliveries: TodayDelivery[];
    graphs: {
      deliveries_per_day: DeliveryPerDay[];
      delivery_statuses: DeliveryStatusBreakdown[];
    };
    monthly: {
      summary: MonthlySummary;
      per_day: MonthlyPerDay[];
      deliveries: MonthlyDelivery[];
    };
    recent_orders: RecentOrder[];
  };
}

export interface ClientDashboardParams {
  days?: number;
  month?: string; // "YYYY-MM" format
}

// ==================== API FUNCTIONS ====================

export const clientDashboardAPI = {
  /**
   * Get client dashboard data with stats, today's deliveries, graph data,
   * monthly deliveries, and recent orders
   * @param params - Optional params (days for graph range, month for monthly view)
   * @returns Dashboard data
   */
  getDashboard: async (params?: ClientDashboardParams): Promise<ClientDashboardResponse> => {
    try {
      const response = await api.get('/client-dashboard-data', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch dashboard data');
    }
  },
};