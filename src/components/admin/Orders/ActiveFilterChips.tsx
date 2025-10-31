// FILE PATH: src/components/admin/Orders/ActiveFilterChips.tsx

/**
 * Active Filter Chips Component
 * Shows active filters as removable chips
 */

import React from 'react';
import { X } from 'lucide-react';
import type { AdminOrderFilters } from '../../../types/adminOrder.types';

interface ActiveFilterChipsProps {
  filters: {
    search: string;
    client_id: string;
    project_id: string;
    supplier_id: string;
    workflow: string;
    payment_status: string;
    delivery_method: string;
    delivery_date_from: string;
    delivery_date_to: string;
    repeat_order: string;
    has_missing_supplier: string;
    supplier_confirms: string;
    min_total: string;
    max_total: string;
  };
  onFilterChange: (key: string, value: string) => void;
  availableFilters: AdminOrderFilters | null;
}

const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  onFilterChange,
  availableFilters,
}) => {
  const activeFilters: { key: string; label: string; value: string }[] = [];

  // Helper to get label from ID
  const getClientName = (id: string) =>
    availableFilters?.clients?.find((c) => c.id === parseInt(id))?.name || id;
  const getProjectName = (id: string) =>
    availableFilters?.projects?.find((p) => p.id === parseInt(id))?.name || id;
  const getSupplierName = (id: string) =>
    availableFilters?.suppliers?.find((s) => s.id === parseInt(id))?.name || id;

  // Build active filters array
  if (filters.search) {
    activeFilters.push({ key: 'search', label: 'Search', value: filters.search });
  }
  if (filters.client_id) {
    activeFilters.push({ key: 'client_id', label: 'Client', value: getClientName(filters.client_id) });
  }
  if (filters.project_id) {
    activeFilters.push({ key: 'project_id', label: 'Project', value: getProjectName(filters.project_id) });
  }
  if (filters.supplier_id) {
    activeFilters.push({ key: 'supplier_id', label: 'Supplier', value: getSupplierName(filters.supplier_id) });
  }
  if (filters.workflow) {
    activeFilters.push({ key: 'workflow', label: 'Workflow', value: filters.workflow });
  }
  if (filters.payment_status) {
    activeFilters.push({ key: 'payment_status', label: 'Payment', value: filters.payment_status });
  }
  if (filters.delivery_method) {
    activeFilters.push({ key: 'delivery_method', label: 'Delivery', value: filters.delivery_method });
  }
  if (filters.delivery_date_from) {
    activeFilters.push({ key: 'delivery_date_from', label: 'From Date', value: filters.delivery_date_from });
  }
  if (filters.delivery_date_to) {
    activeFilters.push({ key: 'delivery_date_to', label: 'To Date', value: filters.delivery_date_to });
  }
  if (filters.repeat_order) {
    activeFilters.push({ key: 'repeat_order', label: 'Repeat', value: filters.repeat_order === 'true' ? 'Yes' : 'No' });
  }
  if (filters.has_missing_supplier) {
    activeFilters.push({ key: 'has_missing_supplier', label: 'Missing Supplier', value: filters.has_missing_supplier === 'true' ? 'Yes' : 'No' });
  }
  if (filters.supplier_confirms) {
    activeFilters.push({ key: 'supplier_confirms', label: 'Supplier Confirms', value: filters.supplier_confirms === '1' ? 'Confirmed' : 'Pending' });
  }
  if (filters.min_total) {
    activeFilters.push({ key: 'min_total', label: 'Min Total', value: `$${filters.min_total}` });
  }
  if (filters.max_total) {
    activeFilters.push({ key: 'max_total', label: 'Max Total', value: `$${filters.max_total}` });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-600">Active Filters:</span>
      {activeFilters.map((filter) => (
        <div
          key={filter.key}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200 hover:bg-blue-200 transition-colors group"
        >
          <span className="font-semibold">{filter.label}:</span>
          <span className="max-w-[120px] truncate">{filter.value}</span>
          <button
            onClick={() => onFilterChange(filter.key, '')}
            className="ml-1 p-0.5 hover:bg-blue-300 rounded-full transition-colors"
            title={`Remove ${filter.label} filter`}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ActiveFilterChips;