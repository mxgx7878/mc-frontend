// FILE PATH: src/api/handlers/invoices.api.ts

/**
 * Invoices API Handler
 * Handles all API calls for invoice generation and management
 */

import api from '../axios.config';
import type {
  InvoiceableDeliveriesResponse,
  InvoicePreviewResponse,
  InvoicePreviewPayload,
  InvoiceCreatePayload,
  InvoiceCreateResponse,
  InvoiceListResponse,
  InvoiceDetailResponse,
  InvoiceStatusPayload,
  InvoiceStatusUpdateResponse,
} from '../../types/invoice.types';

export const invoicesAPI = {
  /**
   * Get all invoiceable deliveries for an order
   */
  getInvoiceableDeliveries: async (orderId: number): Promise<InvoiceableDeliveriesResponse> => {
    try {
      const response = await api.get(`/admin/orders/${orderId}/invoiceable-deliveries`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch invoiceable deliveries');
    }
  },

  /**
   * Preview invoice calculation before creating
   */
  previewInvoice: async (
    orderId: number,
    payload: InvoicePreviewPayload
  ): Promise<InvoicePreviewResponse> => {
    try {
      const response = await api.post(`/admin/orders/${orderId}/invoice-preview`, payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to generate invoice preview');
    }
  },

  /**
   * Create a new invoice
   */
  createInvoice: async (
    orderId: number,
    payload: InvoiceCreatePayload
  ): Promise<InvoiceCreateResponse> => {
    try {
      const response = await api.post(`/admin/orders/${orderId}/invoices`, payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to create invoice');
    }
  },

  /**
   * List all invoices for an order
   */
  getOrderInvoices: async (orderId: number): Promise<InvoiceListResponse> => {
    try {
      const response = await api.get(`/admin/orders/${orderId}/invoices`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch invoices');
    }
  },

  /**
   * Get single invoice detail
   */
  getInvoiceDetail: async (invoiceId: number): Promise<InvoiceDetailResponse> => {
    try {
      const response = await api.get(`/admin/invoices/${invoiceId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch invoice detail');
    }
  },

  /**
   * Update invoice status
   */
  updateInvoiceStatus: async (
    invoiceId: number,
    payload: InvoiceStatusPayload
  ): Promise<InvoiceStatusUpdateResponse> => {
    try {
      const response = await api.post(`/admin/invoices/${invoiceId}/status`, payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to update invoice status');
    }
  },
};