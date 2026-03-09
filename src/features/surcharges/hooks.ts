// FILE PATH: src/features/surcharges/hooks.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { surchargesAPI } from '../../api/handlers/surcharges.api';
import type { UpdateSurchargePayload, UpdateTestingFeePayload } from '../../types/surcharge.types';

export const surchargeKeys = {
  surcharges: (search?: string) => ['surcharges', search] as const,
  testingFees: (search?: string) => ['testing-fees', search] as const,
};

export const useSurcharges = (search?: string) => {
  return useQuery({
    queryKey: surchargeKeys.surcharges(search),
    queryFn: () => surchargesAPI.getSurcharges({ search }),
    staleTime: 30000,
  });
};

export const useTestingFees = (search?: string) => {
  return useQuery({
    queryKey: surchargeKeys.testingFees(search),
    queryFn: () => surchargesAPI.getTestingFees({ search }),
    staleTime: 30000,
  });
};

export const useUpdateSurcharge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateSurchargePayload }) =>
      surchargesAPI.updateSurcharge(id, payload),
    onSuccess: () => {
      toast.success('Surcharge updated successfully');
      queryClient.invalidateQueries({ queryKey: ['surcharges'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update surcharge'),
  });
};

export const useToggleSurcharge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => surchargesAPI.toggleSurcharge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surcharges'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to toggle surcharge'),
  });
};

export const useUpdateTestingFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTestingFeePayload }) =>
      surchargesAPI.updateTestingFee(id, payload),
    onSuccess: () => {
      toast.success('Testing fee updated successfully');
      queryClient.invalidateQueries({ queryKey: ['testing-fees'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update testing fee'),
  });
};

export const useToggleTestingFee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => surchargesAPI.toggleTestingFee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testing-fees'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to toggle testing fee'),
  });
};