// FILE PATH: src/components/admin/Orders/OrderFilters.tsx

/**
 * Order Filters Component
 * Advanced filtering for admin orders list
 */

import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import type { AdminOrderFilters } from '../../../types/adminOrder.types';

interface FiltersProps {
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
    sort: string;
    dir: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  availableFilters: AdminOrderFilters | null;
}

const OrderFilters: React.FC<FiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  availableFilters,
}) => {
  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => value !== '' && key !== 'sort' && key !== 'dir' && key !== 'page'
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <X size={16} />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search PO Number
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Client */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
          <select
            value={filters.client_id}
            onChange={(e) => onFilterChange('client_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Clients</option>
            {availableFilters?.clients?.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {/* Project */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <select
            value={filters.project_id}
            onChange={(e) => onFilterChange('project_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Projects</option>
            {availableFilters?.projects?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Supplier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
          <select
            value={filters.supplier_id}
            onChange={(e) => onFilterChange('supplier_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Suppliers</option>
            {availableFilters?.suppliers?.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        {/* Workflow */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Status</label>
          <select
            value={filters.workflow}
            onChange={(e) => onFilterChange('workflow', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Workflows</option>
            {availableFilters?.workflows?.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
          <select
            value={filters.payment_status}
            onChange={(e) => onFilterChange('payment_status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            {availableFilters?.payment_statuses?.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Delivery Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
          <select
            value={filters.delivery_method}
            onChange={(e) => onFilterChange('delivery_method', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Methods</option>
            {availableFilters?.delivery_methods?.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        {/* Delivery Date From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery From</label>
          <input
            type="date"
            value={filters.delivery_date_from}
            onChange={(e) => onFilterChange('delivery_date_from', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Delivery Date To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery To</label>
          <input
            type="date"
            value={filters.delivery_date_to}
            onChange={(e) => onFilterChange('delivery_date_to', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Repeat Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Repeat Order</label>
          <select
            value={filters.repeat_order}
            onChange={(e) => onFilterChange('repeat_order', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        {/* Has Missing Supplier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Missing Supplier</label>
          <select
            value={filters.has_missing_supplier}
            onChange={(e) => onFilterChange('has_missing_supplier', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        {/* Supplier Confirms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Confirms</label>
          <select
            value={filters.supplier_confirms}
            onChange={(e) => onFilterChange('supplier_confirms', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            <option value="1">Confirmed</option>
            <option value="0">Pending</option>
          </select>
        </div>

        {/* Min Total */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Total</label>
          <input
            type="number"
            value={filters.min_total}
            onChange={(e) => onFilterChange('min_total', e.target.value)}
            placeholder="Min $"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Max Total */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Total</label>
          <input
            type="number"
            value={filters.max_total}
            onChange={(e) => onFilterChange('max_total', e.target.value)}
            placeholder="Max $"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
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
            <option value="customer_cost">Customer Cost</option>
            <option value="supplier_cost">Supplier Cost</option>
            <option value="admin_margin">Admin Margin</option>
            <option value="items_count">Items Count</option>
          </select>
        </div>

        {/* Sort Direction */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort Direction</label>
          <select
            value={filters.dir}
            onChange={(e) => onFilterChange('dir', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default OrderFilters;