// FILE PATH: src/components/admin/Orders/OrderItemsSection.tsx

/**
 * Order Items Section Component
 * Displays items with workflow-specific logic
 */

import React from 'react';
import { Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdminOrderItem, WorkflowStatus } from '../../../types/adminOrder.types';
import { formatCurrency } from '../../../features/adminOrders/utils';

interface OrderItemsSectionProps {
  items: AdminOrderItem[];
  workflow: WorkflowStatus;
}

const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({ items, workflow }) => {
  const handleSupplierSelect = (itemId: number, supplierId: number, supplierName: string) => {
    console.log(itemId, supplierId, supplierName)
    toast('Functionality coming soon', {
      icon: '🚧',
      duration: 2000,
    });
  };

  const renderSupplierMissingItem = (item: AdminOrderItem) => (
    <div key={item.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Package size={18} className="text-gray-600" />
            <h4 className="font-semibold text-gray-900">{item.product_name}</h4>
          </div>
          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
        </div>
        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded-full">
          Missing Supplier
        </span>
      </div>

      {/* Supplier Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Supplier
        </label>
        <select
          onChange={(e) => {
            const selected = item.eligible_suppliers?.find(
              (s) => s.supplier_id === parseInt(e.target.value)
            );
            if (selected) {
              handleSupplierSelect(item.id, selected.supplier_id, selected.name);
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          defaultValue=""
        >
          <option value="" disabled>
            Choose a supplier...
          </option>
          {item.eligible_suppliers?.map((supplier) => (
            <option key={supplier.supplier_id} value={supplier.supplier_id}>
              {supplier.name}
              {supplier.distance !== null && ` - ${supplier.distance.toFixed(1)} km`}
            </option>
          ))}
        </select>
        {item.eligible_suppliers && item.eligible_suppliers.length === 0 && (
          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle size={14} />
            No eligible suppliers found for this product
          </p>
        )}
      </div>
    </div>
  );

  const renderSupplierAssignedItem = (item: AdminOrderItem) => (
    <div
      key={item.id}
      className={`border rounded-lg p-4 ${
        item.supplier_confirms === 1
          ? 'border-green-200 bg-green-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Package size={18} className="text-gray-600" />
            <h4 className="font-semibold text-gray-900">{item.product_name}</h4>
          </div>
          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
        </div>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
            item.supplier_confirms === 1
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {item.supplier_confirms === 1 ? (
            <>
              <CheckCircle size={14} />
              Confirmed
            </>
          ) : (
            <>
              <Clock size={14} />
              Pending Confirmation
            </>
          )}
        </span>
      </div>

      {/* Supplier Info */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <div className="flex items-center gap-3">
          {item.supplier?.profile_image ? (
            <img
              src={`${import.meta.env.VITE_IMAGE_BASE_URL}${item.supplier.profile_image}`}
              alt={item.supplier.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {item.supplier?.name?.charAt(0) || 'S'}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{item.supplier?.name}</p>
            <p className="text-xs text-gray-500">Assigned Supplier</p>
          </div>
        </div>

        {/* Initial Pricing (if available) */}
        {item.supplier_unit_cost && (
          <div className="mt-3 pt-3 border-t border-gray-200 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Unit Cost:</span>
              <span className="font-medium">{formatCurrency(item.supplier_unit_cost)}</span>
            </div>
            {item.supplier_delivery_cost && item.supplier_delivery_cost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Cost:</span>
                <span className="font-medium">
                  {formatCurrency(item.supplier_delivery_cost)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderPricedItem = (item: AdminOrderItem) => (
    <div key={item.id} className="border border-gray-200 bg-white rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Package size={18} className="text-gray-600" />
            <h4 className="font-semibold text-gray-900">{item.product_name}</h4>
          </div>
          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
        </div>
      </div>

      {/* Supplier Info */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <div className="flex items-center gap-3 mb-3">
          {item.supplier?.profile_image ? (
            <img
              src={item.supplier.profile_image}
              alt={item.supplier.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {item.supplier?.name?.charAt(0) || 'S'}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{item.supplier?.name}</p>
            <p className="text-xs text-gray-500">Supplier</p>
          </div>
        </div>

        {/* Detailed Pricing */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Unit Cost:</span>
            <span className="font-medium">{formatCurrency(item.supplier_unit_cost || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Quantity:</span>
            <span className="font-medium">×{item.quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">
              {formatCurrency((item.supplier_unit_cost || 0) * item.quantity)}
            </span>
          </div>
          {item.supplier_delivery_cost && item.supplier_delivery_cost > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Cost:</span>
              <span className="font-medium">{formatCurrency(item.supplier_delivery_cost)}</span>
            </div>
          )}
          {item.supplier_discount && item.supplier_discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span className="font-medium">-{formatCurrency(item.supplier_discount)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Package size={24} />
        Order Items ({items.length})
      </h2>

      <div className="space-y-4">
        {items.map((item) => {
          if (workflow === 'Supplier Missing') {
            return renderSupplierMissingItem(item);
          } else if (workflow === 'Supplier Assigned') {
            return renderSupplierAssignedItem(item);
          } else if (workflow === 'Payment Requested' || workflow === 'Delivered') {
            return renderPricedItem(item);
          } else {
            return renderSupplierAssignedItem(item);
          }
        })}
      </div>
    </div>
  );
};

export default OrderItemsSection;