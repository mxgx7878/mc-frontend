// FILE PATH: src/features/adminOrders/utils.ts

/**
 * Utility functions for Admin Orders
 */

import type { WorkflowStatus, PaymentStatus } from '../../types/adminOrder.types';

// ==================== STATUS BADGE COLORS ====================

export const getWorkflowBadgeClass = (workflow: WorkflowStatus): string => {
  const classes: Record<WorkflowStatus, string> = {
    'Requested': 'bg-blue-100 text-blue-800 border border-blue-200',
    'Supplier Missing': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    'Supplier Assigned': 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    'Payment Requested': 'bg-purple-100 text-purple-800 border border-purple-200',
    'On Hold': 'bg-gray-100 text-gray-800 border border-gray-200',
    'Delivered': 'bg-green-100 text-green-800 border border-green-200',
  };
  return classes[workflow] || 'bg-gray-100 text-gray-800';
};

export const getPaymentBadgeClass = (status: PaymentStatus): string => {
  const classes: Record<PaymentStatus, string> = {
    'Pending': 'bg-gray-100 text-gray-700',
    'Requested': 'bg-yellow-100 text-yellow-700',
    'Paid': 'bg-green-100 text-green-700',
    'Partially Paid': 'bg-blue-100 text-blue-700',
    'Partial Refunded': 'bg-orange-100 text-orange-700',
    'Refunded': 'bg-red-100 text-red-700',
  };
  return classes[status] || 'bg-gray-100 text-gray-700';
};

// ==================== PRICING CHECKS ====================

export const canShowPricing = (workflow: WorkflowStatus): boolean => {
  return workflow === 'Payment Requested' || workflow === 'Delivered';
};

export const canEditOrder = (workflow: WorkflowStatus): boolean => {
  return workflow !== 'Delivered';
};

// ==================== FORMATTING ====================

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ==================== IMAGE URL HELPER ====================

export const getProfileImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http')) return imagePath;
  
  // Build full URL using the image base URL
  const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL;
  return `${baseUrl}${imagePath}`;
};

// ==================== MARGIN CALCULATION ====================

export const getMarginColor = (margin: number): string => {
  if (margin > 0) return 'text-green-600';
  if (margin < 0) return 'text-red-600';
  return 'text-gray-600';
};

export const getMarginPercentage = (customerCost: number, supplierCost: number): string => {
  if (customerCost === 0) return '0%';
  const percentage = ((customerCost - supplierCost) / customerCost) * 100;
  return `${percentage.toFixed(1)}%`;
};