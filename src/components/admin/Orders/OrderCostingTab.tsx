// FILE PATH: src/components/admin/Orders/OrderCostingTab.tsx

/**
 * Order Costing Tab Component - REBUILT
 * 
 * WHAT CHANGED:
 * - All costs now calculated BOTTOM-UP from items and their deliveries
 * - Per-item collapsible breakdown showing each delivery's cost
 * - delivery_cost lives on each ItemDelivery, not at item level
 * - Customer delivery cost = delivery_cost × (1 + DELIVERY_MARGIN 10%)
 * - No more reliance on order-level pre-calculated totals
 * 
 * CALCULATION LOGIC:
 * Supplier Side (per item):
 *   item_cost       = supplier_unit_cost × quantity
 *   discount        = supplier_discount
 *   delivery_total  = SUM(delivery.delivery_cost) across all deliveries
 *   item_total      = item_cost - discount + delivery_total
 * 
 * Customer Side (per item):
 *   If quoted:  item_cost = quoted_price (overrides margin calc)
 *   Else:       item_cost = supplier_unit_cost × quantity × (1 + ADMIN_MARGIN)
 *   delivery_total = SUM(delivery.delivery_cost × (1 + DELIVERY_MARGIN 10%))
 *   item_total     = item_cost + delivery_total
 * 
 * Order Totals:
 *   supplier_total     = SUM(all items supplier_total)
 *   customer_subtotal  = SUM(all items customer_total)
 *   gst                = customer_subtotal × GST_RATE
 *   grand_total        = customer_subtotal + gst - discount + other_charges
 *   profit             = customer_subtotal - supplier_total
 */

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Package,
  Truck,
  Eye,
  EyeOff,
  Lock,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import type { AdminOrderDetail, AdminOrderItem, ItemDelivery } from '../../../types/adminOrder.types';
import { formatCurrency } from '../../../features/adminOrders/utils';
import FormulaTooltip from '../../common/FormulaTooltip';
import { usePermissions } from '../../../hooks/usePermissions';
import PermissionGate, { CostPriceGate, ProfitMarginGate } from '../../common/PermissionGate';

// ==================== CONSTANTS ====================
const ADMIN_MARGIN = 0.50; // 50% - applied to item costs
const DELIVERY_MARGIN = 0.10; // 10% - applied to delivery costs
const GST_RATE = 0.10; // 10%

const TRUCK_TYPE_LABELS: Record<string, string> = {
  tipper_light: 'Tipper Light (3-6t)',
  tipper_medium: 'Tipper Medium (6-11t)',
  tipper_heavy: 'Tipper Heavy (11-14t)',
  light_rigid: 'Light Rigid (3.5t)',
  medium_rigid: 'Medium Rigid (7t)',
  heavy_rigid: 'Heavy Rigid (16-49t)',
  mini_body: 'Mini Body (8t)',
  body_truck: 'Body Truck (12t)',
  eight_wheeler: 'Eight-Wheeler (16t)',
  semi: 'Semi (28t)',
  truck_dog: 'Truck & Dog (38t)',
};

// ==================== TYPES ====================

interface ItemCostBreakdown {
  item: AdminOrderItem;
  // Supplier
  supplierItemCost: number;
  supplierDiscount: number;
  supplierDeliveryCost: number;
  supplierTotal: number;
  // Customer
  customerItemCost: number;
  customerDeliveryCost: number;
  customerTotal: number;
  // Flags
  isQuoted: boolean;
  hasDeliveries: boolean;
  deliveryBreakdowns: DeliveryCostRow[];
}

interface DeliveryCostRow {
  delivery: ItemDelivery;
  quantity: number;
  supplierDeliveryCost: number;
  customerDeliveryCost: number;
}

interface OrderCostingTabProps {
  order: AdminOrderDetail;
}

// ==================== HELPER: Parse number safely ====================
const toNum = (val: unknown, fallback = 0): number => {
  if (val === null || val === undefined) return fallback;
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  return Number.isFinite(n) ? n : fallback;
};

// ==================== HELPER: Format date ====================
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// ==================== CALCULATION ENGINE ====================

function calculateItemBreakdown(item: AdminOrderItem): ItemCostBreakdown {
  const qty = toNum(item.quantity, 0);
  const unitCost = toNum(item.supplier_unit_cost, 0);
  const discount = toNum(item.supplier_discount, 0);
  const isQuoted = item.is_quoted === 1 && item.quoted_price != null;
  const quotedPrice = toNum(item.quoted_price, 0);

  // Supplier item cost
  const supplierItemCost = unitCost * qty;

  // Delivery breakdowns from item.deliveries
  const deliveries = item.deliveries || [];
  const deliveryBreakdowns: DeliveryCostRow[] = deliveries.map((d) => {
    const dQty = toNum(d.quantity, 0);
    const dCost = toNum(d.delivery_cost, 0);
    return {
      delivery: d,
      quantity: dQty,
      supplierDeliveryCost: dCost,
      customerDeliveryCost: dCost * (1 + DELIVERY_MARGIN),
    };
  });

  const supplierDeliveryCost = deliveryBreakdowns.reduce(
    (sum, d) => sum + d.supplierDeliveryCost,
    0
  );

  const supplierTotal = supplierItemCost - discount + supplierDeliveryCost;

  // Customer item cost
  const customerItemCost = isQuoted ? quotedPrice : supplierItemCost * (1 + ADMIN_MARGIN);

  const customerDeliveryCost = deliveryBreakdowns.reduce(
    (sum, d) => sum + d.customerDeliveryCost,
    0
  );

  const customerTotal = customerItemCost + customerDeliveryCost;

  return {
    item,
    supplierItemCost,
    supplierDiscount: discount,
    supplierDeliveryCost,
    supplierTotal,
    customerItemCost,
    customerDeliveryCost,
    customerTotal,
    isQuoted,
    hasDeliveries: deliveries.length > 0,
    deliveryBreakdowns,
  };
}

// ==================== SUB-COMPONENTS ====================

/** Single delivery cost row inside expanded item */
const DeliveryRow: React.FC<{
  row: DeliveryCostRow;
  index: number;
  showSupplierCost: boolean;
}> = ({ row, index, showSupplierCost }) => {
  const { delivery } = row;
  const truckLabel = delivery.truck_type
    ? TRUCK_TYPE_LABELS[delivery.truck_type] || delivery.truck_type
    : null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg text-sm">
      {/* Index */}
      <span className="w-6 h-6 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full text-xs font-bold flex-shrink-0">
        {index + 1}
      </span>

      {/* Date */}
      <div className="flex items-center gap-1.5 min-w-[120px]">
        <Calendar size={13} className="text-gray-400" />
        <span className="text-gray-700">{formatDate(delivery.delivery_date)}</span>
      </div>

      {/* Quantity */}
      <div className="min-w-[70px]">
        <span className="text-gray-600">Qty:</span>{' '}
        <span className="font-semibold text-gray-900">{row.quantity}</span>
      </div>

      {/* Truck Type */}
      {truckLabel && (
        <div className="flex items-center gap-1 min-w-[140px]">
          <Truck size={13} className="text-gray-400" />
          <span className="text-gray-600 text-xs">{truckLabel}</span>
        </div>
      )}

      {/* Confirmed */}
      <div className="flex items-center gap-1">
        {delivery.supplier_confirms ? (
          <CheckCircle size={14} className="text-green-500" />
        ) : (
          <AlertCircle size={14} className="text-amber-400" />
        )}
      </div>

      {/* Costs - pushed right */}
      <div className="ml-auto flex items-center gap-4">
        {showSupplierCost && (
          <div className="text-right min-w-[90px]">
            <span className="text-xs text-gray-500 block">Supplier</span>
            <span className="font-semibold text-blue-700">
              {formatCurrency(row.supplierDeliveryCost)}
            </span>
          </div>
        )}
        <div className="text-right min-w-[90px]">
          <span className="text-xs text-gray-500 block">Customer</span>
          <span className="font-semibold text-green-700">
            {formatCurrency(row.customerDeliveryCost)}
          </span>
        </div>
      </div>
    </div>
  );
};

/** Collapsible item card showing cost breakdown */
const ItemCostCard: React.FC<{
  breakdown: ItemCostBreakdown;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  showSupplierCost: boolean;
}> = ({ breakdown, index, isExpanded, onToggle, showSupplierCost }) => {
  const { item } = breakdown;
  const hasSupplier = item.supplier?.name;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Item Header - always visible, clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Index */}
        <span className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold flex-shrink-0">
          {index + 1}
        </span>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900 truncate">{item.product_name}</h4>
            {breakdown.isQuoted && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full border border-purple-200">
                QUOTED
              </span>
            )}
            {item.is_paid === 1 && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full border border-green-200">
                PAID
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            <span>Qty: {item.quantity}</span>
            {hasSupplier && (
              <span className="flex items-center gap-1">
                <Package size={11} />
                {item.supplier?.name}
              </span>
            )}
            {breakdown.hasDeliveries && (
              <span className="flex items-center gap-1">
                <Truck size={11} />
                {breakdown.deliveryBreakdowns.length} delivery
                {breakdown.deliveryBreakdowns.length !== 1 ? 'ies' : 'y'}
              </span>
            )}
          </div>
        </div>

        {/* Cost Summary Chips */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {showSupplierCost && (
            <div className="text-right">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Supplier</span>
              <span className="text-sm font-bold text-blue-700">
                {formatCurrency(breakdown.supplierTotal)}
              </span>
            </div>
          )}
          <div className="text-right">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Customer</span>
            <span className="text-sm font-bold text-green-700">
              {formatCurrency(breakdown.customerTotal)}
            </span>
          </div>
        </div>

        {/* Expand Icon */}
        {isExpanded ? (
          <ChevronUp size={18} className="text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
        )}
      </button>

      {/* Expanded Detail */}
      {isExpanded && (
        <div className="border-t-2 border-gray-100 px-5 py-4 space-y-4 bg-gray-50/50">
          {/* Cost Grid: Supplier | Customer side-by-side */}
          <div className={`grid gap-4 ${showSupplierCost ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Supplier Cost Card */}
            {showSupplierCost && (
              <div className="bg-white border border-blue-200 rounded-lg p-4">
                <h5 className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <DollarSign size={13} />
                  Supplier Cost
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Unit Cost × {item.quantity}
                      <span className="text-gray-400 ml-1">
                        ({formatCurrency(toNum(item.supplier_unit_cost))} ea)
                      </span>
                    </span>
                    <span className="font-semibold">{formatCurrency(breakdown.supplierItemCost)}</span>
                  </div>
                  {breakdown.supplierDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span className="font-semibold">-{formatCurrency(breakdown.supplierDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Total</span>
                    <span className="font-semibold">{formatCurrency(breakdown.supplierDeliveryCost)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-100 font-bold text-blue-800">
                    <span>Item Total</span>
                    <span>{formatCurrency(breakdown.supplierTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Cost Card */}
            <div className="bg-white border border-green-200 rounded-lg p-4">
              <h5 className="text-xs font-bold text-green-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <TrendingUp size={13} />
                Customer Price
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {breakdown.isQuoted ? (
                      <>Quoted Price</>
                    ) : (
                      <>
                        Item Cost
                        {showSupplierCost && (
                          <span className="text-gray-400 ml-1">
                            (+ {ADMIN_MARGIN * 100}% margin)
                          </span>
                        )}
                      </>
                    )}
                  </span>
                  <span className="font-semibold">{formatCurrency(breakdown.customerItemCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Delivery Total
                    {showSupplierCost && (
                      <span className="text-gray-400 ml-1">(+ {DELIVERY_MARGIN * 100}% margin)</span>
                    )}
                  </span>
                  <span className="font-semibold">{formatCurrency(breakdown.customerDeliveryCost)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-100 font-bold text-green-800">
                  <span>Item Total</span>
                  <span>{formatCurrency(breakdown.customerTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Rows */}
          {breakdown.hasDeliveries && (
            <div>
              <h5 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Truck size={13} />
                Delivery Schedule ({breakdown.deliveryBreakdowns.length})
              </h5>
              <div className="space-y-1.5">
                {breakdown.deliveryBreakdowns.map((row, i) => (
                  <DeliveryRow
                    key={row.delivery.id}
                    row={row}
                    index={i}
                    showSupplierCost={showSupplierCost}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Deliveries Warning */}
          {!breakdown.hasDeliveries && (
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 rounded-lg border border-amber-200 text-sm text-amber-700">
              <AlertCircle size={16} />
              No delivery schedule configured for this item
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const OrderCostingTab: React.FC<OrderCostingTabProps> = ({ order }) => {
  const { canViewCostPrice, isReadOnly } = usePermissions();
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // ===== BOTTOM-UP CALCULATIONS =====
  const itemBreakdowns = useMemo(
    () => order.items.map(calculateItemBreakdown),
    [order.items]
  );

  const totals = useMemo(() => {
    const supplierItemCost = itemBreakdowns.reduce((s, b) => s + b.supplierItemCost, 0);
    const supplierDiscount = itemBreakdowns.reduce((s, b) => s + b.supplierDiscount, 0);
    const supplierDeliveryCost = itemBreakdowns.reduce((s, b) => s + b.supplierDeliveryCost, 0);
    const supplierTotal = itemBreakdowns.reduce((s, b) => s + b.supplierTotal, 0);

    const customerItemCost = itemBreakdowns.reduce((s, b) => s + b.customerItemCost, 0);
    const customerDeliveryCost = itemBreakdowns.reduce((s, b) => s + b.customerDeliveryCost, 0);
    const customerSubtotal = customerItemCost + customerDeliveryCost;

    const gst = customerSubtotal * GST_RATE;
    const discount = toNum(order.discount, 0);
    const otherCharges = toNum(order.other_charges, 0);
    const grandTotal = customerSubtotal + gst - discount + otherCharges;

    const profitAmount = customerSubtotal - supplierTotal;
    const profitMarginPercent = supplierTotal > 0 ? (profitAmount / supplierTotal) * 100 : 0;

    const quotedItemsCount = itemBreakdowns.filter((b) => b.isQuoted).length;
    const totalDeliveries = itemBreakdowns.reduce((s, b) => s + b.deliveryBreakdowns.length, 0);

    return {
      supplierItemCost,
      supplierDiscount,
      supplierDeliveryCost,
      supplierTotal,
      customerItemCost,
      customerDeliveryCost,
      customerSubtotal,
      gst,
      discount,
      otherCharges,
      grandTotal,
      profitAmount,
      profitMarginPercent,
      quotedItemsCount,
      totalDeliveries,
    };
  }, [itemBreakdowns, order.discount, order.other_charges]);

  // ===== EXPAND/COLLAPSE =====
  const toggleItem = (itemId: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedItems(new Set(order.items.map((i) => i.id)));
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  return (
    <div className="space-y-6">
      {/* ==================== HEADER ==================== */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Calculator size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Cost Breakdown</h3>
              <p className="text-blue-100 text-sm mt-1">
                Bottom-up calculation from {order.items.length} item
                {order.items.length !== 1 ? 's' : ''} · {totals.totalDeliveries} deliver
                {totals.totalDeliveries !== 1 ? 'ies' : 'y'}
              </p>
            </div>
          </div>

          {/* Permission Indicators */}
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

        {/* Quick Stats Row */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/20 text-sm">
          <CostPriceGate fallback={null}>
            <div>
              <span className="text-blue-200">Supplier Total: </span>
              <span className="font-bold">{formatCurrency(totals.supplierTotal)}</span>
            </div>
          </CostPriceGate>
          <div>
            <span className="text-blue-200">Customer Total: </span>
            <span className="font-bold">{formatCurrency(totals.grandTotal)}</span>
          </div>
          <ProfitMarginGate fallback={null}>
            <div>
              <span className="text-blue-200">Profit: </span>
              <span className={`font-bold ${totals.profitAmount >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {formatCurrency(totals.profitAmount)} ({totals.profitMarginPercent.toFixed(1)}%)
              </span>
            </div>
          </ProfitMarginGate>
          {totals.quotedItemsCount > 0 && (
            <div className="px-2.5 py-1 bg-purple-500/30 rounded-lg">
              <span className="text-purple-100 font-medium">
                {totals.quotedItemsCount} quoted item{totals.quotedItemsCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ==================== PER-ITEM BREAKDOWNS ==================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package size={20} className="text-indigo-600" />
            Item-Level Breakdown
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {itemBreakdowns.map((breakdown, i) => (
            <ItemCostCard
              key={breakdown.item.id}
              breakdown={breakdown}
              index={i}
              isExpanded={expandedItems.has(breakdown.item.id)}
              onToggle={() => toggleItem(breakdown.item.id)}
              showSupplierCost={canViewCostPrice}
            />
          ))}
        </div>
      </div>

      {/* ==================== ORDER SUMMARY ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SUPPLIER TOTAL */}
        <CostPriceGate
          fallback={
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 text-gray-500">
                <Lock size={20} />
                <div>
                  <h4 className="font-bold text-gray-600">Supplier Cost</h4>
                  <p className="text-xs text-gray-500">Permission required</p>
                </div>
              </div>
            </div>
          }
        >
          <div className="bg-white border-2 border-blue-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="text-blue-600" size={18} />
              </div>
              <h4 className="font-bold text-blue-900">Supplier Total</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Items</span>
                <span className="font-medium">{formatCurrency(totals.supplierItemCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery</span>
                <span className="font-medium">{formatCurrency(totals.supplierDeliveryCost)}</span>
              </div>
              {totals.supplierDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discounts</span>
                  <span className="font-medium">-{formatCurrency(totals.supplierDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t-2 border-blue-200 text-base font-bold text-blue-800">
                <span>Total</span>
                <span>{formatCurrency(totals.supplierTotal)}</span>
              </div>
            </div>
          </div>
        </CostPriceGate>

        {/* CUSTOMER TOTAL */}
        <div className="bg-white border-2 border-green-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={18} />
            </div>
            <h4 className="font-bold text-green-900">Customer Total</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Items</span>
              <span className="font-medium">{formatCurrency(totals.customerItemCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery</span>
              <span className="font-medium">{formatCurrency(totals.customerDeliveryCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center gap-1">
                GST ({GST_RATE * 100}%)
                <FormulaTooltip formula={`(Items + Delivery) × ${GST_RATE * 100}%\n= ${formatCurrency(totals.customerSubtotal)} × ${GST_RATE}\n= ${formatCurrency(totals.gst)}`} />
              </span>
              <span className="font-medium">{formatCurrency(totals.gst)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount</span>
                <span className="font-medium">-{formatCurrency(totals.discount)}</span>
              </div>
            )}
            {totals.otherCharges > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Other Charges</span>
                <span className="font-medium">{formatCurrency(totals.otherCharges)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t-2 border-green-200 text-base font-bold text-green-800">
              <span>Grand Total</span>
              <span>{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* PROFIT */}
        <ProfitMarginGate
          fallback={
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 text-gray-500">
                <Lock size={20} />
                <div>
                  <h4 className="font-bold text-gray-600">Profit & Margin</h4>
                  <p className="text-xs text-gray-500">Permission required</p>
                </div>
              </div>
            </div>
          }
        >
          <div className="bg-white border-2 border-purple-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600" size={18} />
              </div>
              <h4 className="font-bold text-purple-900">Profit & Margin</h4>
            </div>

            {/* Big Profit Number */}
            <div className="text-center py-3 mb-3 bg-purple-50 rounded-lg border border-purple-100">
              <p className={`text-3xl font-bold ${totals.profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totals.profitAmount)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Margin:{' '}
                <span className={`font-bold ${totals.profitMarginPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totals.profitMarginPercent.toFixed(2)}%
                </span>
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 flex items-center gap-1">
                  Formula
                  <FormulaTooltip
                    formula={`Profit = Customer Subtotal - Supplier Total\n= ${formatCurrency(totals.customerSubtotal)} - ${formatCurrency(totals.supplierTotal)}\n= ${formatCurrency(totals.profitAmount)}\n\nMargin % = Profit / Supplier Total × 100`}
                  />
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-gray-700 space-y-1">
                <span className="block">• Quoted prices override margin calculation</span>
                <span className="block">• Discount reduces grand total, not profit directly</span>
                <span className="block">• GST excluded from profit (pass-through)</span>
                {totals.supplierDiscount > 0 && (
                  <span className="block text-green-700">
                    • Supplier discounts ({formatCurrency(totals.supplierDiscount)}) increase profit
                  </span>
                )}
              </p>
            </div>
          </div>
        </ProfitMarginGate>
      </div>

      {/* ==================== MARGIN & RATES INFO ==================== */}
      <PermissionGate permission="pricing.view_cost_price">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs">
              Item Margin: {ADMIN_MARGIN * 100}%
            </span>
            <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs">
              Delivery Margin: {DELIVERY_MARGIN * 100}%
            </span>
            <span className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-bold text-xs">
              GST Rate: {GST_RATE * 100}%
            </span>
            <span className="text-gray-500 text-xs ml-auto">
              All costs calculated bottom-up from item and delivery data
            </span>
          </div>
        </div>
      </PermissionGate>
    </div>
  );
};

export default OrderCostingTab;