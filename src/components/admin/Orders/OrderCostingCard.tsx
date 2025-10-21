// FILE PATH: src/components/admin/Orders/OrderCostingCard.tsx

/**
 * Order Costing Card Component
 * Shows client and supplier costing breakdown
 */

import React from 'react';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import type { AdminOrderDetail } from '../../../types/adminOrder.types';
import { formatCurrency, getMarginColor, canShowPricing } from '../../../features/adminOrders/utils';

interface OrderCostingCardProps {
  order: AdminOrderDetail;
}

const OrderCostingCard: React.FC<OrderCostingCardProps> = ({ order }) => {
  const showPricing = canShowPricing(order.workflow);

  if (!showPricing) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign size={24} />
          Order Costing
        </h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <AlertCircle className="mx-auto text-blue-600 mb-2" size={32} />
          <p className="text-blue-800 font-medium">Pricing Not Available</p>
          <p className="text-sm text-blue-600 mt-1">
            Costing information will be available once payment is requested.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <DollarSign size={24} />
        Order Costing
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Costing */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-4 text-lg">Client Costing</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Subtotal:</span>
              <span className="font-medium text-green-900">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Fuel Levy:</span>
              <span className="font-medium text-green-900">{formatCurrency(order.fuel_levy)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">GST Tax:</span>
              <span className="font-medium text-green-900">{formatCurrency(order.gst_tax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Other Charges:</span>
              <span className="font-medium text-green-900">
                {formatCurrency(order.other_charges)}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span className="font-medium">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="pt-3 border-t-2 border-green-300">
              <div className="flex justify-between items-center">
                <span className="text-green-900 font-bold text-base">Total (Customer Cost):</span>
                <span className="text-green-900 font-bold text-xl">
                  {formatCurrency(order.customer_cost)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Costing */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-4 text-lg">Supplier Costing</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Items Total:</span>
              <span className="font-medium text-blue-900">
                {formatCurrency(
                  order.items.reduce(
                    (sum, item) => sum + (item.supplier_unit_cost || 0) * item.quantity,
                    0
                  )
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Delivery Cost:</span>
              <span className="font-medium text-blue-900">
                {formatCurrency(
                  order.items.reduce((sum, item) => sum + (item.supplier_delivery_cost || 0), 0)
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Discount:</span>
              <span className="font-medium text-blue-900">
                -{formatCurrency(
                  order.items.reduce((sum, item) => sum + (item.supplier_discount || 0), 0)
                )}
              </span>
            </div>
            <div className="pt-3 border-t-2 border-blue-300">
              <div className="flex justify-between items-center">
                <span className="text-blue-900 font-bold text-base">Total (Supplier Cost):</span>
                <span className="text-blue-900 font-bold text-xl">
                  {formatCurrency(order.supplier_cost)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Margin */}
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-purple-600" size={24} />
            <span className="text-purple-900 font-bold text-lg">Admin Margin:</span>
          </div>
          <div className="text-right">
            <p className={`font-bold text-2xl ${getMarginColor(order.admin_margin)}`}>
              {formatCurrency(order.admin_margin)}
            </p>
            <p className="text-sm text-gray-600">
              {((order.admin_margin / order.customer_cost) * 100).toFixed(1)}% margin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCostingCard;