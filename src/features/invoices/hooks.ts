// FILE PATH: src/features/invoices/hooks.ts

/**
 * React Query Hooks for Invoice Management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesAPI } from '../../api/handlers/invoices.api';
import { adminOrdersKeys } from '../adminOrders/hooks';
import type {
  InvoicePreviewPayload,
  InvoiceCreatePayload,
  InvoiceStatusPayload,
} from '../../types/invoice.types';
import toast from 'react-hot-toast';

// ==================== QUERY KEYS ====================
export const invoiceKeys = {
  all: ['invoices'] as const,
  deliveries: (orderId: number) => [...invoiceKeys.all, 'deliveries', orderId] as const,
  orderInvoices: (orderId: number) => [...invoiceKeys.all, 'order', orderId] as const,
  detail: (invoiceId: number) => [...invoiceKeys.all, 'detail', invoiceId] as const,
};

// ==================== QUERIES ====================

/**
 * Fetch invoiceable deliveries for an order
 */
export const useInvoiceableDeliveries = (orderId: number) => {
  return useQuery({
    queryKey: invoiceKeys.deliveries(orderId),
    queryFn: () => invoicesAPI.getInvoiceableDeliveries(orderId),
    staleTime: 15000,
    enabled: !!orderId,
  });
};

/**
 * Fetch all invoices for an order
 */
export const useOrderInvoices = (orderId: number) => {
  return useQuery({
    queryKey: invoiceKeys.orderInvoices(orderId),
    queryFn: () => invoicesAPI.getOrderInvoices(orderId),
    staleTime: 15000,
    enabled: !!orderId,
  });
};

/**
 * Fetch single invoice detail
 */
export const useInvoiceDetail = (invoiceId: number) => {
  return useQuery({
    queryKey: invoiceKeys.detail(invoiceId),
    queryFn: () => invoicesAPI.getInvoiceDetail(invoiceId),
    staleTime: 15000,
    enabled: !!invoiceId,
  });
};

// ==================== MUTATIONS ====================

/**
 * Preview invoice pricing
 */
export const useInvoicePreview = (orderId: number) => {
  return useMutation({
    mutationFn: (payload: InvoicePreviewPayload) =>
      invoicesAPI.previewInvoice(orderId, payload),
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate preview');
    },
  });
};

/**
 * Create invoice
 */
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: number;
      payload: InvoiceCreatePayload;
    }) => invoicesAPI.createInvoice(orderId, payload),
    onSuccess: (data, variables) => {
      toast.success(data.message || 'Invoice created successfully');
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: invoiceKeys.deliveries(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.orderInvoices(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.detail(variables.orderId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invoice');
    },
  });
};

/**
 * Update invoice status
 */
export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      payload,
    }: {
      invoiceId: number;
      orderId: number;
      payload: InvoiceStatusPayload;
    }) => invoicesAPI.updateInvoiceStatus(invoiceId, payload),
    onSuccess: (data, variables) => {
      toast.success(data.message || 'Invoice status updated');
      queryClient.invalidateQueries({ queryKey: invoiceKeys.orderInvoices(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.deliveries(variables.orderId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update invoice status');
    },
  });
};