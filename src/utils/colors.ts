// FILE PATH: src/utils/colors.ts

/**
 * Professional Color Palette
 * Consistent colors used across the admin order view
 */

export const COLORS = {
  // Primary - Blue (for main actions, info)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Success - Green (for positive states, confirmed, paid)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Warning - Amber (for pending states, attention needed)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Danger - Red (for errors, negative states)
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Purple - For special features (quoted prices, profit)
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
  
  // Indigo - For secondary actions
  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  
  // Gray - For neutral elements
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

/**
 * Workflow Status Colors
 */
export const WORKFLOW_COLORS = {
  'Requested': {
    bg: COLORS.primary[50],
    text: COLORS.primary[700],
    border: COLORS.primary[300],
  },
  'Supplier Missing': {
    bg: COLORS.warning[50],
    text: COLORS.warning[700],
    border: COLORS.warning[300],
  },
  'Supplier Assigned': {
    bg: COLORS.indigo[50],
    text: COLORS.indigo[700],
    border: COLORS.indigo[300],
  },
  'Payment Requested': {
    bg: COLORS.purple[50],
    text: COLORS.purple[700],
    border: COLORS.purple[300],
  },
  'On Hold': {
    bg: COLORS.gray[100],
    text: COLORS.gray[700],
    border: COLORS.gray[300],
  },
  'Delivered': {
    bg: COLORS.success[50],
    text: COLORS.success[700],
    border: COLORS.success[300],
  },
};

/**
 * Payment Status Colors
 */
export const PAYMENT_COLORS = {
  'Pending': {
    bg: COLORS.gray[100],
    text: COLORS.gray[700],
    border: COLORS.gray[300],
  },
  'Requested': {
    bg: COLORS.warning[50],
    text: COLORS.warning[700],
    border: COLORS.warning[300],
  },
  'Paid': {
    bg: COLORS.success[50],
    text: COLORS.success[700],
    border: COLORS.success[300],
  },
  'Partially Paid': {
    bg: COLORS.indigo[50],
    text: COLORS.indigo[700],
    border: COLORS.indigo[300],
  },
  'Partial Refunded': {
    bg: COLORS.purple[50],
    text: COLORS.purple[700],
    border: COLORS.purple[300],
  },
  'Refunded': {
    bg: COLORS.danger[50],
    text: COLORS.danger[700],
    border: COLORS.danger[300],
  },
};

/**
 * Tab Colors
 */
export const TAB_COLORS = {
  overview: {
    active: `bg-blue-600 text-white border-blue-700`,
    inactive: `text-blue-700 hover:bg-blue-50 border-blue-200`,
    icon: COLORS.primary[600],
  },
  items: {
    active: `bg-purple-600 text-white border-purple-700`,
    inactive: `text-purple-700 hover:bg-purple-50 border-purple-200`,
    icon: COLORS.purple[600],
  },
  costing: {
    active: `bg-green-600 text-white border-green-700`,
    inactive: `text-green-700 hover:bg-green-50 border-green-200`,
    icon: COLORS.success[600],
  },
  map: {
    active: `bg-orange-600 text-white border-orange-700`,
    inactive: `text-orange-700 hover:bg-orange-50 border-orange-200`,
    icon: '#ea580c', // orange-600
  },
  admin: {
    active: `bg-indigo-600 text-white border-indigo-700`,
    inactive: `text-indigo-700 hover:bg-indigo-50 border-indigo-200`,
    icon: COLORS.indigo[600],
  },
};

/**
 * Get workflow badge classes
 */
export const getWorkflowBadgeClass = (workflow: string): string => {
  const colors = WORKFLOW_COLORS[workflow as keyof typeof WORKFLOW_COLORS];
  if (!colors) return 'bg-gray-100 text-gray-700 border-gray-300';
  
  return `bg-[${colors.bg}] text-[${colors.text}] border-[${colors.border}]`;
};

/**
 * Get payment badge classes
 */
export const getPaymentBadgeClass = (status: string): string => {
  const colors = PAYMENT_COLORS[status as keyof typeof PAYMENT_COLORS];
  if (!colors) return 'bg-gray-100 text-gray-700 border-gray-300';
  
  return `bg-[${colors.bg}] text-[${colors.text}] border-[${colors.border}]`;
};
