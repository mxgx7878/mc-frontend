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

// ==================== QUERIES ====================

/**
 * Fetch orders list with filters
 */
export const useAdminOrders = (params: AdminOrdersQueryParams) => {
  return useQuery({
    queryKey: adminOrdersKeys.list(params),
    queryFn: () => adminOrdersAPI.getOrders(params),
    staleTime: 30000,
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

// ==================== MUTATIONS ====================

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
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.detail(variables.orderId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update order');
    },
  });
};

/**
 * Assign supplier to item mutation
 */
export const useAssignSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      order_id: number;
      item_id: number;
      supplier: number;
      offer_id?: number;
    }) => adminOrdersAPI.assignSupplier(payload),
    onSuccess: (_, variables) => {
      toast.success('Supplier assigned successfully');
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.detail(variables.order_id) });
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign supplier');
    },
  });
};

/**
 * Set quoted price for item mutation
 */
export const useSetQuotedPrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      itemId,
      quotedPrice,
    }: {
      orderId: number;
      itemId: number;
      quotedPrice: number | null;
    }) => adminOrdersAPI.setItemQuotedPrice(orderId, itemId, quotedPrice),
    onSuccess: (_, variables) => {
      toast.success(
        variables.quotedPrice === null
          ? 'Quoted price cleared'
          : 'Quoted price set successfully'
      );
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.detail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to set quoted price');
    },
  });
};

/**
 * Mark item as paid mutation
 */
export const useMarkItemAsPaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      itemId,
      isPaid,
    }: {
      orderId: number;
      itemId: number;
      isPaid: boolean;
    }) => adminOrdersAPI.markItemAsPaid(orderId, itemId, isPaid),
    onSuccess: (_, variables) => {
      toast.success(
        variables.isPaid ? 'Item marked as paid' : 'Payment status updated'
      );
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.detail(variables.orderId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update payment status');
    },
  });
};


/**
 * Admin update order item mutation
 * For editing supplier pricing, delivery, and confirmation
 */
export const useAdminUpdateOrderItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderItemId,
      payload,
    }: {
      orderItemId: number;
      payload: {
        supplier_unit_cost?: number;
        supplier_discount?: number;
        delivery_cost?: number;
        delivery_type?: 'Included' | 'Supplier' | 'ThirdParty' | 'Fleet' | 'None';
        supplier_delivery_date?: string;
        supplier_confirms?: boolean;
        supplier_notes?: string;
        quantity:number;
      };
    }) => adminOrdersAPI.adminUpdateOrderItem(orderItemId, payload),
    onSuccess: () => {
      // Since we don't have orderId in the response, invalidate all order details
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.details() });
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.lists() });
    },
    onError: (error: Error) => {
      // Error handling is done in the component
      console.error('Failed to update order item:', error);
    },
  });
};


/**
 * Update payment status mutation
 */
export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      paymentStatus,
    }: {
      orderId: number;
      paymentStatus: string;
    }) => adminOrdersAPI.updatePaymentStatus(orderId, paymentStatus),
    onSuccess: (data, variables) => {
      toast.success(data.message || 'Payment status updated successfully');
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.detail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update payment status');
    },
  });
};