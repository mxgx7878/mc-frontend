// FILE PATH: src/features/adminOrders/utils.ts

/**
 * Utility functions for Admin Orders
 * Updated for new pricing logic
 */

import type { WorkflowStatus, PaymentStatus } from '../../types/adminOrder.types';

// ==================== STATUS BADGE COLORS ====================

export const getWorkflowBadgeClass = (workflow: WorkflowStatus): string => {
  const classes: Record<WorkflowStatus, string> = {
    'Requested': 'bg-blue-100 text-blue-800 border-2 border-blue-300',
    'Supplier Missing': 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300',
    'Supplier Assigned': 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300',
    'Payment Requested': 'bg-purple-100 text-purple-800 border-2 border-purple-300',
    'On Hold': 'bg-gray-100 text-gray-800 border-2 border-gray-300',
    'Delivered': 'bg-green-100 text-green-800 border-2 border-green-300',
  };
  return classes[workflow] || 'bg-gray-100 text-gray-800';
};

export const getPaymentBadgeClass = (status: PaymentStatus): string => {
  const classes: Record<PaymentStatus, string> = {
    'Pending': 'bg-gray-100 text-gray-700 border border-gray-300',
    'Requested': 'bg-yellow-100 text-yellow-700 border border-yellow-300',
    'Paid': 'bg-green-100 text-green-700 border border-green-300',
    'Partially Paid': 'bg-blue-100 text-blue-700 border border-blue-300',
    'Partial Refunded': 'bg-orange-100 text-orange-700 border border-orange-300',
    'Refunded': 'bg-red-100 text-red-700 border border-red-300',
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

// ==================== PROFIT/MARGIN CALCULATION ====================

export const getProfitColor = (profit: number): string => {
  if (profit > 0) return 'text-green-600';
  if (profit < 0) return 'text-red-600';
  return 'text-gray-600';
};

export const getMarginColor = (marginPercent: number): string => {
  if (marginPercent > 0) return 'text-green-600';
  if (marginPercent < 0) return 'text-red-600';
  return 'text-gray-600';
};

// Calculate profit percentage based on supplier total
export const calculateProfitPercentage = (profit: number, supplierTotal: number): string => {
  if (supplierTotal === 0) return '0%';
  const percentage = (profit / supplierTotal) * 100;
  return `${percentage.toFixed(2)}%`;
};

// ==================== ORDER STATUS HELPERS ====================

export const getOrderStatusSummary = (
  workflow: WorkflowStatus,
  paymentStatus: PaymentStatus,
  unassignedItems: number
): string => {
  if (workflow === 'Supplier Missing' && unassignedItems > 0) {
    return `Missing supplier for ${unassignedItems} item${unassignedItems > 1 ? 's' : ''}`;
  }
  if (workflow === 'Supplier Assigned') {
    return 'Awaiting supplier confirmation';
  }
  if (workflow === 'Payment Requested') {
    return `Payment ${paymentStatus.toLowerCase()}`;
  }
  if (workflow === 'Delivered') {
    return 'Order completed';
  }
  return workflow;
};

// ==================== VALIDATION ====================

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

export const isValidPrice = (price: number): boolean => {
  return typeof price === 'number' && !isNaN(price) && price >= 0;
};