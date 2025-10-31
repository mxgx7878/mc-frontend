// FILE PATH: src/components/admin/Orders/OrderFiltersPanel.tsx

/**
 * Order Filters Panel Component
 * Slide-in panel from right side with overlay
 */

import React from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import type { AdminOrderFilters } from '../../../types/adminOrder.types';

interface FiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
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

const OrderFiltersPanel: React.FC<FiltersPanelProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onClearFilters,
  availableFilters,
}) => {
  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => value !== '' && key !== 'sort' && key !== 'dir' && key !== 'page' && key !== 'search'
  );

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sliding Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Filter className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Filters</h3>
              <p className="text-xs text-gray-600">Refine your search</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Filters Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Client */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Client
              </label>
              <select
                value={filters.client_id}
                onChange={(e) => onFilterChange('client_id', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project
              </label>
              <select
                value={filters.project_id}
                onChange={(e) => onFilterChange('project_id', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Supplier
              </label>
              <select
                value={filters.supplier_id}
                onChange={(e) => onFilterChange('supplier_id', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Workflow Status
              </label>
              <select
                value={filters.workflow}
                onChange={(e) => onFilterChange('workflow', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                value={filters.payment_status}
                onChange={(e) => onFilterChange('payment_status', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Delivery Method
              </label>
              <select
                value={filters.delivery_method}
                onChange={(e) => onFilterChange('delivery_method', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All Methods</option>
                {availableFilters?.delivery_methods?.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.delivery_date_from}
                  onChange={(e) => onFilterChange('delivery_date_from', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.delivery_date_to}
                  onChange={(e) => onFilterChange('delivery_date_to', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Min Total ($)
                </label>
                <input
                  type="number"
                  value={filters.min_total}
                  onChange={(e) => onFilterChange('min_total', e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Total ($)
                </label>
                <input
                  type="number"
                  value={filters.max_total}
                  onChange={(e) => onFilterChange('max_total', e.target.value)}
                  placeholder="999999"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Additional Filters */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Repeat Order
              </label>
              <select
                value={filters.repeat_order}
                onChange={(e) => onFilterChange('repeat_order', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Missing Supplier
              </label>
              <select
                value={filters.has_missing_supplier}
                onChange={(e) => onFilterChange('has_missing_supplier', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Supplier Confirmation
              </label>
              <select
                value={filters.supplier_confirms}
                onChange={(e) => onFilterChange('supplier_confirms', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All</option>
                <option value="1">Confirmed</option>
                <option value="0">Pending</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Sort Options</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sort}
                    onChange={(e) => onFilterChange('sort', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="created_at">Created Date</option>
                    <option value="delivery_date">Delivery Date</option>
                    <option value="po_number">PO Number</option>
                    <option value="total_price">Total Price</option>
                    <option value="profit_amount">Profit Amount</option>
                    <option value="profit_margin_percent">Profit Margin %</option>
                    <option value="items_count">Items Count</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Direction
                  </label>
                  <select
                    value={filters.dir}
                    onChange={(e) => onFilterChange('dir', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClearFilters}
              disabled={!hasActiveFilters}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <RotateCcw size={18} />
              Clear All
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderFiltersPanel;