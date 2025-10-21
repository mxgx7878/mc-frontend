// FILE PATH: src/features/adminOrders/hooks.ts

/**
 * React Query Hooks for Admin Orders
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminOrdersAPI } from '../../api/handlers/adminOrders.api';
import type {
  AdminOrdersQueryParams,
  AdminOrderUpdatePayload,
} from '../../types/adminOrder.types';
import toast from 'react-hot-toast';

// ==================== QUERY KEYS ====================
export const adminOrdersKeys = {
  all: ['admin', 'orders'] as const,
  lists: () => [...adminOrdersKeys.all, 'list'] as const,
  list: (params: AdminOrdersQueryParams) => [...adminOrdersKeys.lists(), params] as const,
  details: () => [...adminOrdersKeys.all, 'detail'] as const,
  detail: (id: number) => [...adminOrdersKeys.details(), id] as const,
};

// ==================== HOOKS ====================

/**
 * Fetch orders list with filters
 */
export const useAdminOrders = (params: AdminOrdersQueryParams) => {
  return useQuery({
    queryKey: adminOrdersKeys.list(params),
    queryFn: () => adminOrdersAPI.getOrders(params),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};

/**
 * Fetch single order detail
 */
export const useAdminOrderDetail = (orderId: number) => {
  return useQuery({
    queryKey: adminOrdersKeys.detail(orderId),
    queryFn: () => adminOrdersAPI.getOrderDetail(orderId),
    staleTime: 30000,
    refetchOnWindowFocus: false,
    enabled: !!orderId,
  });
};

/**
 * Update order mutation
 */
export const useUpdateAdminOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: number;
      payload: AdminOrderUpdatePayload;
    }) => adminOrdersAPI.updateOrder(orderId, payload),
    onSuccess: (_, variables) => {
      toast.success('Order updated successfully');
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.detail(variables.orderId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update order');
    },
  });
};