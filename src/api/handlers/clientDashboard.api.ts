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

export interface ClientDashboardResponse {
  success: boolean;
  data: {
    stats: ClientDashboardStats;
    todays_deliveries: TodayDelivery[];
    graphs: {
      deliveries_per_day: DeliveryPerDay[];
      delivery_statuses: DeliveryStatusBreakdown[];
    };
  };
}

export interface ClientDashboardParams {
  days?: number;
}

// ==================== API FUNCTIONS ====================

export const clientDashboardAPI = {
  /**
   * Get client dashboard data with stats, today's deliveries, and graph data
   * @param params - Optional params (days for graph range)
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