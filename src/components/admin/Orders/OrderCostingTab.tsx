// FILE PATH: src/components/admin/Orders/OrderCostingTab.tsx

/**
 * Order Costing Tab Component - WITH PERMISSION-BASED VISIBILITY
 * Shows detailed cost breakdown with hover tooltips for formulas
 * HIDES supplier cost and profit sections based on user permissions
 */

import React from 'react';
import { Calculator, TrendingUp, DollarSign, Package, Truck, Eye, EyeOff, Lock } from 'lucide-react';
import type { AdminOrderDetail } from '../../../types/adminOrder.types';
import { formatCurrency } from '../../../features/adminOrders/utils';
import FormulaTooltip from '../../common/FormulaTooltip';
import { usePermissions } from '../../../hooks/usePermissions';
import PermissionGate, { CostPriceGate, ProfitMarginGate } from '../../common/PermissionGate';

interface OrderCostingTabProps {
  order: AdminOrderDetail;
}

const OrderCostingTab: React.FC<OrderCostingTabProps> = ({ order }) => {
  // Get permissions
  const { canViewCostPrice, isReadOnly } = usePermissions();

  // Constants from pricing logic
  const ADMIN_MARGIN = 0.50; // 50%
  const GST_RATE = 0.10; // 10%

  // Calculate supplier totals
  const supplierItemTotal = order.supplier_item_cost || 0;
  const supplierDeliveryTotal = order.supplier_delivery_cost || 0;
  const supplierDiscountTotal = order.items.reduce(
    (sum, item) => sum + (item.supplier_discount || 0),
    0
  );
  const supplierGrandTotal = order.supplier_item_cost + order.supplier_delivery_cost;

  // Calculate customer totals
  const customerItemTotal = order.customer_item_cost || 0;
  const customerDeliveryTotal = order.customer_delivery_cost || 0;
  const gstAmount = order.gst_tax || 0;
  const discountAmount = order.discount || 0;
  const otherCharges = order.other_charges || 0;
  const customerGrandTotal = order.total_price || order.customer_cost || 0;

  // Profit calculations
  const profitAmount = order.profit_amount || 0;
  const profitMarginPercent = order.profit_margin_percent * 100 || 0;

  // Count quoted items
  const quotedItemsCount = order.items.filter((item) => item.is_quoted === 1).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Calculator size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Cost Breakdown & Calculations</h3>
              <p className="text-blue-100 text-sm mt-1">
                Detailed pricing analysis based on Material Connect pricing logic
              </p>
            </div>
          </div>
          
          {/* Permission Indicator */}
          <div className="flex items-center gap-2">
            {isReadOnly && (
              <span className="px-3 py-1.5 bg-white/20 rounded-lg text-sm font-medium flex items-center gap-2">
                <Eye size={16} />
                Read Only
              </span>
            )}
            {!canViewCostPrice && (
              <span className="px-3 py-1.5 bg-yellow-500/20 rounded-lg text-sm font-medium flex items-center gap-2">
                <EyeOff size={16} />
                Cost Hidden
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* SUPPLIER COST SECTION - Permission Protected */}
      {/* ============================================ */}
      <CostPriceGate
        fallback={
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 text-gray-500">
              <div className="p-3 bg-gray-200 rounded-lg">
                <Lock size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-600">Supplier Cost</h4>
                <p className="text-sm text-gray-500">
                  You don't have permission to view supplier cost information
                </p>
              </div>
            </div>
          </div>
        }
      >
        <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-600 rounded-lg shadow-sm">
              <DollarSign className="text-white" size={24} />
            </div>
            <div>
              <h4 className="text-xl font-bold text-blue-900">Supplier Cost</h4>
              <p className="text-sm text-blue-600">What we pay to suppliers</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Items Cost */}
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-blue-600" />
                <span className="text-gray-700 font-medium">Items Cost</span>
                <FormulaTooltip formula="Sum of (Unit Cost × Quantity) for all items" />
              </div>
              <span className="font-bold text-gray-900 text-lg">
                {formatCurrency(supplierItemTotal)}
              </span>
            </div>

            {/* Delivery Cost */}
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-blue-600" />
                <span className="text-gray-700 font-medium">Delivery Cost</span>
                <FormulaTooltip formula="Sum of supplier delivery fees for all items" />
              </div>
              <span className="font-bold text-gray-900 text-lg">
                {formatCurrency(supplierDeliveryTotal)}
              </span>
            </div>

            {/* Supplier Discounts */}
            {supplierDiscountTotal > 0 && (
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <span className="text-green-700 font-medium">Supplier Discounts</span>
                  <FormulaTooltip formula="Total discounts provided by suppliers" />
                </div>
                <span className="font-bold text-green-700 text-lg">
                  -{formatCurrency(supplierDiscountTotal)}
                </span>
              </div>
            )}

            {/* Total Supplier Cost */}
            <div className="flex justify-between items-center p-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg border-2 border-blue-800 shadow-md mt-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">Total Supplier Cost</span>
                <FormulaTooltip
                  formula="Item Cost + Delivery Cost - Supplier Discounts"
                  className="text-white"
                />
              </div>
              <span className="font-bold text-2xl">{formatCurrency(supplierGrandTotal)}</span>
            </div>
          </div>
        </div>
      </CostPriceGate>

      {/* ============================================ */}
      {/* CUSTOMER PRICE SECTION - Always Visible */}
      {/* ============================================ */}
      <div className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-600 rounded-lg shadow-sm">
            <TrendingUp className="text-white" size={24} />
          </div>
          <div>
            <h4 className="text-xl font-bold text-green-900">Customer Price</h4>
            <p className="text-sm text-green-600">What client pays</p>
          </div>
        </div>

        {/* System Constants Info - Only show if can view cost price */}
        <PermissionGate permission="pricing.view_cost_price">
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-bold text-sm">
                  Admin Margin: {ADMIN_MARGIN * 100}%
                </div>
                <div className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-bold text-sm">
                  GST Rate: {GST_RATE * 100}%
                </div>
              </div>
              {quotedItemsCount > 0 && (
                <div className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg font-bold text-sm border border-purple-300">
                  {quotedItemsCount} item{quotedItemsCount > 1 ? 's' : ''} with quoted prices
                </div>
              )}
            </div>
          </div>
        </PermissionGate>

        <div className="space-y-3">
          {/* Customer Item Cost */}
          <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-green-600" />
              <span className="text-gray-700 font-medium">Item Cost</span>
              <PermissionGate permission="pricing.view_cost_price">
                <FormulaTooltip
                  formula={`Base Material × (1 + ${ADMIN_MARGIN * 100}%)\nOR Quoted Price if set (overrides calculation)`}
                />
              </PermissionGate>
            </div>
            <span className="font-bold text-gray-900 text-lg">
              {formatCurrency(customerItemTotal)}
            </span>
          </div>

          {/* Customer Delivery Cost */}
          <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-green-600" />
              <span className="text-gray-700 font-medium">Delivery Cost</span>
              <PermissionGate permission="pricing.view_cost_price">
                <FormulaTooltip formula="Supplier Delivery × (1 + Admin Margin)" />
              </PermissionGate>
            </div>
            <span className="font-bold text-gray-900 text-lg">
              {formatCurrency(customerDeliveryTotal)}
            </span>
          </div>

          {/* GST */}
          <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">GST ({GST_RATE * 100}%)</span>
              <FormulaTooltip formula="(Item Cost + Delivery Cost) × 10%" />
            </div>
            <span className="font-bold text-gray-900 text-lg">
              {formatCurrency(gstAmount)}
            </span>
          </div>

          {/* Other Charges */}
          {otherCharges > 0 && (
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <span className="text-gray-700 font-medium">Other Charges</span>
                <FormulaTooltip formula="Additional fees and charges" />
              </div>
              <span className="font-bold text-gray-900 text-lg">
                {formatCurrency(otherCharges)}
              </span>
            </div>
          )}

          {/* Admin Discount */}
          {discountAmount > 0 && (
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <span className="text-red-700 font-medium">Admin Discount</span>
                <FormulaTooltip formula="Discount applied by admin (reduces final total)" />
              </div>
              <span className="font-bold text-red-700 text-lg">
                -{formatCurrency(discountAmount)}
              </span>
            </div>
          )}

          {/* Total Customer Price */}
          <div className="flex justify-between items-center p-5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg border-2 border-green-800 shadow-md mt-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">Total Customer Price</span>
              <FormulaTooltip
                formula="Item Cost + Delivery + GST - Discount + Other Charges"
                className="text-white"
              />
            </div>
            <span className="font-bold text-2xl">{formatCurrency(customerGrandTotal)}</span>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* PROFIT ANALYSIS SECTION - Permission Protected */}
      {/* ============================================ */}
      <ProfitMarginGate
        fallback={
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 text-gray-500">
              <div className="p-3 bg-gray-200 rounded-lg">
                <Lock size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-600">Profit Analysis</h4>
                <p className="text-sm text-gray-500">
                  You don't have permission to view profit analysis
                </p>
              </div>
            </div>
          </div>
        }
      >
        <div className="bg-white border-2 border-purple-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-sm">
              <TrendingUp className="text-white" size={24} />
            </div>
            <div>
              <h4 className="text-xl font-bold text-purple-900">Profit Analysis</h4>
              <p className="text-sm text-purple-600">Revenue and margins</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profit Amount */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-purple-700">Profit Amount</span>
                <FormulaTooltip formula="Total Customer - Total Supplier - GST" />
              </div>
              <div
                className={`text-4xl font-bold mb-2 ${
                  profitAmount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(profitAmount)}
              </div>
              <p className="text-xs text-gray-600">
                Customer price minus supplier cost and GST
              </p>
            </div>

            {/* Profit Margin */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-purple-700">Profit Margin</span>
                <FormulaTooltip formula="(Profit Amount / Supplier Total) × 100%" />
              </div>
              <div
                className={`text-4xl font-bold mb-2 ${
                  profitMarginPercent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {profitMarginPercent.toFixed(2)}%
              </div>
              <p className="text-xs text-gray-600">
                Profit as percentage of supplier cost
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-900 font-medium mb-2">
              💡 Profit Calculation Notes:
            </p>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• Quoted prices override standard margin calculations for individual items</li>
              <li>• Admin discount reduces profit margin dollar-for-dollar</li>
              <li>• GST is excluded from profit calculation (passed through to government)</li>
              <li>• Supplier discounts increase profit margin</li>
            </ul>
          </div>
        </div>
      </ProfitMarginGate>
    </div>
  );
};

export default OrderCostingTab;