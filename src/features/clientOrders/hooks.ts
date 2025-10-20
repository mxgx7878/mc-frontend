// ============================================================================
// FILE: src/features/clientOrders/hooks.ts - UPDATED WITH MARK REPEAT
// ============================================================================

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { clientOrdersAPI } from '../../api/handlers/clientOrders.api';
import { clientOrderKeys } from './queryKeys';

export const useClientOrders = (filters: any, includeDetails: boolean = false) =>
  useQuery({
    queryKey: clientOrderKeys.list(filters),
    queryFn: () => clientOrdersAPI.getOrders(filters, includeDetails),
    placeholderData: keepPreviousData,
  });

export const useClientOrderDetail = (orderId?: number) =>
  useQuery({
    queryKey: clientOrderKeys.detail(orderId!),
    queryFn: () => clientOrdersAPI.getOrderDetails(orderId!),
    enabled: !!orderId,
  });

export const useRepeatOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: number; payload: any }) =>
      clientOrdersAPI.repeatOrder(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientOrderKeys.lists() });
    },
  });
};

export const useMarkRepeatOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderId: number) => clientOrdersAPI.markRepeatOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientOrderKeys.lists() });
    },
  });
};