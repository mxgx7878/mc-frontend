// FILE PATH: src/features/clientOrders/hooks.ts
// Updated Client Orders Hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { clientOrdersAPI } from '../../api/handlers/clientOrders.api';
import type { ClientOrdersQueryParams } from '../../api/handlers/clientOrders.api';
import type {RepeatOrderPayload} from '../../types/clientOrder.types'

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