// FILE PATH: src/api/handlers/adminDashboard.api.ts

/**
 * Admin Dashboard API Handler
 * Handles all API calls for admin dashboard analytics
 * 
 * UPDATED: Revenue is now invoice-driven (total_invoiced, paid_amount, outstanding)
 * Tables changed: top_clients_by_invoiced, top_suppliers_by_cost, recent_invoices
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
  // Orders
  orders_total: number;
  orders_total_prev: number;
  orders_change: number;

  completed_orders: number;
  completed_orders_prev: number;
  completed_change: number;

  // Revenue — invoice-based
  invoice_count: number;
  total_invoiced: number;
  total_invoiced_prev: number;
  invoiced_change: number;

  paid_amount: number;
  paid_amount_prev: number;
  paid_change: number;

  outstanding_amount: number;
  overdue_count: number;
  avg_invoice_value: number;
  collection_rate: number;

  // Clients / Suppliers
  active_clients: number;
  active_clients_prev: number;
  active_clients_change: number;
  active_suppliers: number;

  // Alerts
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
  data: (number | string)[];
}

export interface Chart {
  id: string;
  title: string;
  group_by: string;
  type?: string;
  labels: string[];
  series: ChartSeries[] | number[];
  amounts?: number[];
}

export interface TopClient {
  client_id: number;
  client_name: string;
  client_email: string;
  invoice_count: number;
  total_invoiced: number;
  paid_amount: number;
}

export interface TopSupplier {
  supplier_id: number;
  supplier_name: string;
  supplier_email: string;
  order_count: number;
  total_cost: number;
}

export interface RecentInvoice {
  invoice_id: number;
  invoice_number: string;
  client_name: string;
  po_number: string;
  total_amount: number;
  status: string;
  issued_date: string;
  due_date: string;
  paid_at: string | null;
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
  period_days: number;
  total_orders_analyzed: number;
  total_invoices_analyzed: number;
}

export interface DashboardResponse {
  filters: DashboardFilters & {
    currency: string;
    charts: string[];
  };
  kpis: DashboardKPIs;
  charts: Chart[];
  tables: {
    top_clients_by_invoiced: TopClient[];
    top_suppliers_by_cost: TopSupplier[];
    recent_invoices: RecentInvoice[];
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