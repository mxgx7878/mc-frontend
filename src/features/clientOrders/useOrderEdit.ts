// src/features/clientOrders/useOrderEdit.ts
/**
 * React Query Hook for Order Editing
 * 
 * Provides mutation for editing orders with:
 * - Automatic cache invalidation
 * - Toast notifications
 * - Error handling
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { orderEditAPI } from '../../api/handlers/orderEdit.api';
import { clientOrdersKeys } from './hooks';
import type { EditOrderPayload, EditOrderResponse } from '../../types/orderEdit.types';

/**
 * Hook to edit an order
 * 
 * @example
 * const editMutation = useEditOrder();
 * 
 * // Update contact info
 * editMutation.mutate({
 *   orderId: 123,
 *   payload: {
 *     order: {
 *       contact_person_name: "Ali Khan",
 *       contact_person_number: "0300-1234567"
 *     }
 *   }
 * });
 */
export const useEditOrder = () => {
  const queryClient = useQueryClient();

  return useMutation<
    EditOrderResponse,
    Error & { errors?: Record<string, string[]> },
    { orderId: number; payload: EditOrderPayload }
  >({
    mutationFn: ({ orderId, payload }) => orderEditAPI.editOrder(orderId, payload),
    
    onSuccess: (data, variables) => {
      // Invalidate order detail cache to refetch updated data
      queryClient.invalidateQueries({ 
        queryKey: clientOrdersKeys.detail(variables.orderId) 
      });
      
      // Invalidate orders list cache
      queryClient.invalidateQueries({ 
        queryKey: clientOrdersKeys.lists() 
      });
      
      toast.success(data.message || 'Order updated successfully');
    },
    
    onError: (error) => {
      // Handle validation errors
      if (error.errors) {
        // Get first error message from validation errors
        const firstError = Object.values(error.errors)[0]?.[0];
        toast.error(firstError || error.message || 'Failed to update order');
      } else {
        toast.error(error.message || 'Failed to update order');
      }
    },
  });
};

/**
 * Hook specifically for updating contact information
 * Convenience wrapper around useEditOrder
 * 
 * @example
 * const updateContact = useUpdateContactInfo();
 * 
 * updateContact.mutate({
 *   orderId: 123,
 *   contactInfo: {
 *     contact_person_name: "Ali Khan",
 *     contact_person_number: "0300-1234567",
 *     site_instructions: "Call before arrival"
 *   }
 * });
 */
export const useUpdateContactInfo = () => {
  const queryClient = useQueryClient();

  return useMutation<
    EditOrderResponse,
    Error & { errors?: Record<string, string[]> },
    {
      orderId: number;
      contactInfo: {
        contact_person_name?: string;
        contact_person_number?: string;
        site_instructions?: string;
      };
    }
  >({
    mutationFn: ({ orderId, contactInfo }) => 
      orderEditAPI.updateContactInfo(orderId, contactInfo),
    
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: clientOrdersKeys.detail(variables.orderId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: clientOrdersKeys.lists() 
      });
      
      toast.success('Contact information updated successfully');
    },
    
    onError: (error) => {
      if (error.errors) {
        const firstError = Object.values(error.errors)[0]?.[0];
        toast.error(firstError || error.message || 'Failed to update contact info');
      } else {
        toast.error(error.message || 'Failed to update contact info');
      }
    },
  });
};