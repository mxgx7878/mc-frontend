// FILE PATH: src/features/clientOrders/hooks.ts
// Client Orders Hooks - With Archive and Cancel functionality

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { clientOrdersAPI } from '../../api/handlers/clientOrders.api';
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
    staleTime: 30000, // 30 seconds
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
    staleTime: 30000, // 30 seconds
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
      // Invalidate orders list to show new order
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
      // Update both list and detail cache
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
 * Used in order listing table
 */
export const useArchiveOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => clientOrdersAPI.archiveOrder(orderId),
    onSuccess: (_, orderId) => {
      // Invalidate orders list to remove archived order
      queryClient.invalidateQueries({ queryKey: clientOrdersKeys.lists() });
      // Also invalidate the detail cache if it exists
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
 * Only works for orders with status: Draft, Confirmed, Scheduled, In Transit
 * Used in order detail view
 */
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => clientOrdersAPI.cancelOrder(orderId),
    onSuccess: (_, orderId) => {
      // Invalidate both list and detail to reflect new status
      queryClient.invalidateQueries({ queryKey: clientOrdersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientOrdersKeys.detail(orderId) });
      toast.success('Order cancelled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel order');
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