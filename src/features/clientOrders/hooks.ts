// FILE PATH: src/features/clientOrders/hooks.ts
// Client Orders Hooks - With Archive, Cancel, and Pay Invoice functionality

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { clientOrdersAPI } from '../../api/handlers/clientOrders.api';
import { paymentAPI } from '../../api/handlers/payment.api';
import type { ClientOrdersQueryParams } from '../../api/handlers/clientOrders.api';
import type { RepeatOrderPayload } from '../../types/clientOrder.types';

// Query Keys
export const clientOrdersKeys = {
  all: ['clientOrders'] as const,
  lists: () => [...clientOrdersKeys.all, 'list'] as const,
  list: (filters: ClientOrdersQueryParams) => [...clientOrdersKeys.lists(), filters] as const,
  details: () => [...clientOrdersKeys.all, 'detail'] as const,
  detail: (id: number) => [...clientOrdersKeys.details(), id] as const,
};

/**
 * Hook to fetch client orders list with filters
 */
export const useClientOrders = (params?: ClientOrdersQueryParams) => {
  return useQuery({
    queryKey: clientOrdersKeys.list(params || {}),
    queryFn: () => clientOrdersAPI.getOrders(params),
    staleTime: 30000,
  });
};

/**
 * Hook to fetch single order detail
 */
export const useClientOrderDetail = (orderId: number) => {
  return useQuery({
    queryKey: clientOrdersKeys.detail(orderId),
    queryFn: () => clientOrdersAPI.getOrderDetail(orderId),
    enabled: !!orderId,
    staleTime: 30000,
  });
};

/**
 * Hook to repeat an order
 */
export const useRepeatOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: number; payload: RepeatOrderPayload }) =>
      clientOrdersAPI.repeatOrder(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientOrdersKeys.lists() });
      toast.success('Order repeated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to repeat order');
    },
  });
};

/**
 * Hook to mark order as repeat
 */
export const useMarkRepeatOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => clientOrdersAPI.markRepeatOrder(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: clientOrdersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientOrdersKeys.detail(orderId) });
      toast.success('Order marked as repeat');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark as repeat order');
    },
  });
};

/**
 * Hook to archive (soft delete) an order
 */
export const useArchiveOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => clientOrdersAPI.archiveOrder(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: clientOrdersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientOrdersKeys.detail(orderId) });
      toast.success('Order deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete order');
    },
  });
};

/**
 * Hook to cancel an order
 */
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => clientOrdersAPI.cancelOrder(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: clientOrdersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientOrdersKeys.detail(orderId) });
      toast.success('Order cancelled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel order');
    },
  });
};

/**
 * Hook to mark an invoice as paid
 * Invalidates the order detail cache to refresh invoices + payment status
 */
export const usePayInvoice = (orderId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: number) => paymentAPI.payInvoice(invoiceId),
    onSuccess: (data) => {
      // Invalidate order detail to refresh invoices list and order payment_status
      queryClient.invalidateQueries({ queryKey: clientOrdersKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: clientOrdersKeys.lists() });
      toast.success(data.message || 'Invoice marked as paid');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to pay invoice');
    },
  });
};

// Helper constant for cancellable statuses
export const CANCELLABLE_STATUSES = ['Draft', 'Confirmed', 'Scheduled', 'In Transit'] as const;

/**
 * Check if an order can be cancelled based on its status
 */
export const canCancelOrder = (orderStatus: string): boolean => {
  return CANCELLABLE_STATUSES.includes(orderStatus as typeof CANCELLABLE_STATUSES[number]);
};