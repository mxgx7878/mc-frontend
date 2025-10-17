// src/features/supplierOrders/hooks.ts

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supplierOrdersAPI } from '../../api/handlers/supplierOrders.api';
import type {
  SupplierOrdersResponse,
  OrderDetailResponse,
  UpdateOrderItemPayload,
  SupplierOrderFilters,
} from '../../api/handlers/supplierOrders.api';
import { supplierOrderKeys } from './queryKeys';

/**
 * Hook to fetch supplier orders list with filters
 */
export const useSupplierOrders = (filters: SupplierOrderFilters, includeDetails: boolean = false) =>
  useQuery<SupplierOrdersResponse>({
    queryKey: supplierOrderKeys.list(filters as Record<string, unknown>),
    queryFn: () => supplierOrdersAPI.getOrders(filters, includeDetails),
    placeholderData: keepPreviousData,
  });

/**
 * Hook to fetch single order details
 */
export const useSupplierOrderDetail = (orderId?: number) => {
  console.log('useSupplierOrderDetail called with orderId:', orderId, 'type:', typeof orderId);
  
  const isValidId = orderId !== undefined && !isNaN(orderId) && orderId > 0;
  console.log('Is valid ID:', isValidId);
  
  return useQuery<OrderDetailResponse>({
    queryKey: isValidId ? supplierOrderKeys.detail(orderId) : ['supplierOrders', 'detail', 'idle'],
    queryFn: async () => {
      console.log('Fetching order details for ID:', orderId);
      const result = await supplierOrdersAPI.getOrderDetails(orderId!);
      console.log('API result:', result);
      return result;
    },
    enabled: isValidId,
  });
};

/**
 * Hook to update order item
 */
export const useUpdateOrderItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderItemId, payload }: { orderItemId: number; payload: UpdateOrderItemPayload }) =>
      supplierOrdersAPI.updateOrderItem(orderItemId, payload),
    onSuccess: (_) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.lists() });
      // We don't have direct access to orderId here, so invalidate all details
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.details() });
    },
  });
};