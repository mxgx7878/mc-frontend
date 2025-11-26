// src/components/client/ClientOrderFilters.tsx

import React from 'react';
import { X } from 'lucide-react';
import type { ProjectFilter } from '../../types/clientOrder.types';

interface ClientOrderFiltersProps {
  filters: {
    search: string;
    project_id: string;
    order_status: string;
    payment_status: string;
    delivery_date: string;
    delivery_method: string;
    repeat_order: string;
    sort: string;
    dir: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  projects: ProjectFilter[];
  availableFilters?: {
    order_statuses?: string[];
    payment_statuses?: string[];
    delivery_methods?: string[];
  };
}

const ClientOrderFilters: React.FC<ClientOrderFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  projects,
  availableFilters,
}) => {
  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) =>
      value !== '' &&
      key !== 'sort' &&
      key !== 'dir' &&
      key !== 'per_page' &&
      key !== 'page' &&
      key !== 'search'
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 font-medium"
          >
            <X size={16} />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Project Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <select
            value={filters.project_id}
            onChange={(e) => onFilterChange('project_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Order Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
          <select
            value={filters.order_status}
            onChange={(e) => onFilterChange('order_status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            {(availableFilters?.order_statuses || ['Draft', 'Confirmed', 'Scheduled', 'In Transit', 'Delivered', 'Completed', 'Cancelled']).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
          <select
            value={filters.payment_status}
            onChange={(e) => onFilterChange('payment_status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Payment Statuses</option>
            {(availableFilters?.payment_statuses || ['Unpaid', 'Partially Paid', 'Paid']).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Delivery Method Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
          <select
            value={filters.delivery_method}
            onChange={(e) => onFilterChange('delivery_method', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Methods</option>
            {(availableFilters?.delivery_methods || ['Tipper', 'Agitator', 'Pump', 'Ute', 'Other']).map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        {/* Delivery Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
          <input
            type="date"
            value={filters.delivery_date}
            onChange={(e) => onFilterChange('delivery_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Repeat Order Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Repeat Orders</label>
          <select
            value={filters.repeat_order}
            onChange={(e) => onFilterChange('repeat_order', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Orders</option>
            <option value="true">Repeat Orders Only</option>
            <option value="false">New Orders Only</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select
            value={filters.sort}
            onChange={(e) => onFilterChange('sort', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="created_at">Created Date</option>
            <option value="delivery_date">Delivery Date</option>
            <option value="po_number">PO Number</option>
            <option value="total_price">Total Amount</option>
          </select>
        </div>

        {/* Sort Direction */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
          <select
            value={filters.dir}
            onChange={(e) => onFilterChange('dir', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ClientOrderFilters;