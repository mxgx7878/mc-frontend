// FILE PATH: src/api/handlers/adminDashboard.api.ts

/**
 * Admin Dashboard API Handler
 * Handles all API calls for admin dashboard analytics
 */

import api from '../axios.config';

// ==================== TYPES ====================

export interface DashboardFilters {
  from?: string;
  to?: string;
  granularity?: 'day' | 'week' | 'month';
  client_id?: number;
  project_id?: number;
  supplier_id?: number;
  product_id?: number;
  workflow?: string;
  payment_status?: string;
  delivery_method?: string;
  tz?: string;
  charts?: string;
  buckets?: string;
}

export interface DashboardKPIs {
  // Primary metrics
  orders_total: number;
  orders_total_prev: number;
  orders_change: number;
  
  revenue: number;
  revenue_prev: number;
  revenue_change: number;
  
  avg_order_value: number;
  
  completed_orders: number;
  completed_orders_prev: number;
  completed_change: number;
  
  // Activity metrics
  active_clients: number;
  active_clients_prev: number;
  active_clients_change: number;
  
  active_suppliers: number;
  
  // Alerts & Actions
  awaiting_payment: number;
  supplier_missing: number;
  pending_supplier_approvals: number;
  
  // Performance
  cancellation_rate: number;
  repeat_client_rate: number;
  
  // System totals
  total_clients: number;
  total_suppliers: number;
}

export interface ChartSeries {
  name: string;
  data: string[];
}

export interface Chart {
  id: string;
  title: string;
  group_by: string;
  type?: string;
  labels: string[];
  series: ChartSeries[];
}

export interface TopClient {
  client_id: number;
  client_name: string;
  client_email: string;
  order_count: number;
  total_spend: number;
}

export interface TopSupplier {
  supplier_id: number;
  supplier_name: string;
  supplier_email: string;
  order_count: number;
  revenue: number;
}

export interface RecentActivity {
  id: number;
  type: string;
  order_id: number;
  po_number: string;
  client_name: string;
  project_name: string;
  amount: number;
  workflow: string;
  timestamp: string;
  time_ago: string;
}

export interface Alert {
  type: 'warning' | 'error' | 'info' | 'success';
  priority: 'high' | 'medium' | 'low';
  message: string;
  action_url: string;
}

export interface DashboardMetadata {
  generated_at: string;
  data_freshness: string;
  total_records_analyzed: number;
  period_days: number;
}

export interface DashboardResponse {
  filters: DashboardFilters & {
    group_by: null;
    metric: string;
    currency: string;
    charts: string[];
  };
  kpis: DashboardKPIs;
  charts: Chart[];
  tables: {
    top_clients_by_spend: TopClient[];
    top_suppliers_by_revenue: TopSupplier[];
    recent_activity: RecentActivity[];
  };
  alerts: Alert[];
  metadata: DashboardMetadata;
}

// ==================== API FUNCTIONS ====================

export const adminDashboardAPI = {
  /**
   * Get dashboard summary with KPIs, charts, and tables
   * @param filters - Dashboard filters
   * @returns Dashboard data
   */
  getSummary: async (filters?: DashboardFilters): Promise<DashboardResponse> => {
    try {
      const response = await api.get('/admin/dashboard/summary', { params: filters });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch dashboard data');
    }
  },
};
