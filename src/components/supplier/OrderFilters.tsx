// src/components/supplier/OrderFilters.tsx

import React from 'react';
import { Search, X } from 'lucide-react';
import type { ProductFilter } from '../../api/handlers/supplierOrders.api';

interface OrderFiltersProps {
  filters: {
    search: string;
    product_id: string;
    supplier_confirms: string;
    supplier_delivery_date: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  products: ProductFilter[];
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  products,
}) => {
  const hasActiveFilters =
    filters.search ||
    filters.product_id ||
    filters.supplier_confirms !== '' ||
    filters.supplier_delivery_date;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Product
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              placeholder="Search by product name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Product Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product
          </label>
          <select
            value={filters.product_id}
            onChange={(e) => onFilterChange('product_id', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Products</option>
            {products?.map((product) => (
              <option key={product.id} value={product.id}>
                {product.product_name}
              </option>
            ))}
          </select>
        </div>

        {/* Confirmation Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirmation Status
          </label>
          <select
            value={filters.supplier_confirms}
            onChange={(e) => onFilterChange('supplier_confirms', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="true">Confirmed</option>
            <option value="false">Pending</option>
          </select>
        </div>

        {/* Delivery Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Date
          </label>
          <input
            type="date"
            value={filters.supplier_delivery_date}
            onChange={(e) => onFilterChange('supplier_delivery_date', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderFilters;