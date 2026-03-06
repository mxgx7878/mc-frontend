// FILE PATH: src/features/surcharges/hooks.ts

/**
 * React Query Hooks for Surcharges Management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { surchargesAPI } from '../../api/handlers/surcharges.api';
import { surchargeKeys } from './queryKeys';
import type {
  UpdateSurchargePayload,
  ToggleSurchargePayload,
} from '../../types/surcharge.types';
import toast from 'react-hot-toast';

// ==================== QUERIES ====================

/**
 * Fetch all surcharges (service fees + testing fees)
 */
export const useSurcharges = () => {
  return useQuery({
    queryKey: surchargeKeys.list(),
    queryFn: () => surchargesAPI.getSurcharges(),
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
};

// ==================== MUTATIONS ====================

/**
 * Update surcharge rates
 */
export const useUpdateSurcharge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      surchargeId,
      payload,
    }: {
      surchargeId: number;
      payload: UpdateSurchargePayload;
    }) => surchargesAPI.updateSurcharge(surchargeId, payload),
    onSuccess: () => {
      toast.success('Surcharge updated successfully');
      queryClient.invalidateQueries({ queryKey: surchargeKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update surcharge');
    },
  });
};

/**
 * Toggle surcharge active/inactive
 */
export const useToggleSurcharge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      surchargeId,
      payload,
    }: {
      surchargeId: number;
      payload: ToggleSurchargePayload;
    }) => surchargesAPI.toggleSurcharge(surchargeId, payload),
    onSuccess: (data) => {
      toast.success(data.message || 'Surcharge status updated');
      queryClient.invalidateQueries({ queryKey: surchargeKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to toggle surcharge');
    },
  });
};