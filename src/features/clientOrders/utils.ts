// src/features/clientOrders/utils.ts

import type { OrderStatus, PaymentStatus } from '../../types/clientOrder.types';

export const getOrderStatusBadgeClass = (status: OrderStatus): string => {
  const classes: Record<OrderStatus, string> = {
    'Draft': 'bg-gray-100 text-gray-800 border-2 border-gray-300',
    'Confirmed': 'bg-blue-100 text-blue-800 border-2 border-blue-300',
    'Scheduled': 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300',
    'In Transit': 'bg-purple-100 text-purple-800 border-2 border-purple-300',
    'Delivered': 'bg-green-100 text-green-800 border-2 border-green-300',
    'Completed': 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300',
    'Cancelled': 'bg-red-100 text-red-800 border-2 border-red-300',
  };
  return classes[status] || 'bg-gray-100 text-gray-800 border-2 border-gray-300';
};

export const getPaymentStatusBadgeClass = (status: PaymentStatus): string => {
  const classes: Record<PaymentStatus, string> = {
    'Pending': 'bg-gray-100 text-gray-800 border-2 border-gray-300',
    'Partially Paid': 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300',
    'Paid': 'bg-green-100 text-green-800 border-2 border-green-300',
    'Partial Refunded': 'bg-orange-100 text-orange-800 border-2 border-orange-300',
    'Refunded': 'bg-blue-100 text-blue-800 border-2 border-blue-300',
    'Requested': 'bg-purple-100 text-purple-800 border-2 border-purple-300'
  };
  return classes[status] || 'bg-gray-100 text-gray-800 border-2 border-gray-300';
};

export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
};