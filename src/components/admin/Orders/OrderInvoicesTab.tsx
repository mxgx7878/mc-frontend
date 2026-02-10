// FILE PATH: src/components/admin/Orders/OrderInvoicesTab.tsx

/**
 * Order Invoices Tab Component
 * Allows admin to:
 * 1. Select deliveries across items to invoice
 * 2. Preview calculated totals
 * 3. Generate invoices
 * 4. View existing invoices with status management
 *
 * UPDATED: Shows unit_cost & delivery_cost per delivery row,
 *          aggregated cost summary per item for selected deliveries
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Receipt,
  Package,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Truck,
  DollarSign,
  FileText,
  Plus,
  Eye,
  Loader2,
  Lock,
} from 'lucide-react';
import {
  useInvoiceableDeliveries,
  useOrderInvoices,
  useInvoicePreview,
  useCreateInvoice,
  useUpdateInvoiceStatus,
  useInvoiceDetail,
} from '../../../features/invoices/hooks';
import { formatCurrency, formatDate } from '../../../features/adminOrders/utils';
import type {
  InvoiceableItem,
  InvoiceableDelivery,
  InvoicePreviewData,
  InvoiceSummary,
  InvoiceStatus,
} from '../../../types/invoice.types';

interface OrderInvoicesTabProps {
  orderId: number;
}

// ==================== STATUS BADGE HELPER ====================
const getInvoiceStatusBadge = (status: InvoiceStatus): string => {
  const map: Record<InvoiceStatus, string> = {
    Draft: 'bg-gray-100 text-gray-700 border-gray-300',
    Sent: 'bg-blue-100 text-blue-700 border-blue-300',
    Paid: 'bg-green-100 text-green-700 border-green-300',
    'Partially Paid': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    Overdue: 'bg-red-100 text-red-700 border-red-300',
    Cancelled: 'bg-gray-100 text-gray-500 border-gray-300',
    Void: 'bg-red-50 text-red-500 border-red-200',
  };
  return map[status] || 'bg-gray-100 text-gray-700 border-gray-300';
};

const formatTime = (timeStr: string | null): string => {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
};

// ==================== INVOICE STATUS OPTIONS ====================
const INVOICE_STATUSES: InvoiceStatus[] = [
  'Draft',
  'Sent',
  'Paid',
  'Partially Paid',
  'Overdue',
  'Cancelled',
  'Void',
];

// ==================== MAIN COMPONENT ====================
const OrderInvoicesTab: React.FC<OrderInvoicesTabProps> = ({ orderId }) => {
  // State
  const [activeView, setActiveView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedDeliveries, setSelectedDeliveries] = useState<Set<number>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [previewData, setPreviewData] = useState<InvoicePreviewData | null>(null);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceDiscount, setInvoiceDiscount] = useState('');
  const [viewingInvoiceId, setViewingInvoiceId] = useState<number | null>(null);

  // Queries
  const { data: deliveriesData, isLoading: loadingDeliveries } = useInvoiceableDeliveries(orderId);
  const { data: invoicesData, isLoading: loadingInvoices } = useOrderInvoices(orderId);

  // Mutations
  const previewMutation = useInvoicePreview(orderId);
  const createMutation = useCreateInvoice();
  const statusMutation = useUpdateInvoiceStatus();

  // Computed
  const items = deliveriesData?.data?.items || [];
  const invoices = invoicesData?.data || [];

  const availableDeliveryCount = useMemo(() => {
    return items.reduce((count, item) => {
      return count + item.deliveries.filter((d) => !d.is_invoiced).length;
    }, 0);
  }, [items]);

  // ==================== HANDLERS ====================

  const toggleDelivery = useCallback((deliveryId: number) => {
    setSelectedDeliveries((prev) => {
      const next = new Set(prev);
      if (next.has(deliveryId)) {
        next.delete(deliveryId);
      } else {
        next.add(deliveryId);
      }
      return next;
    });
    setPreviewData(null);
  }, []);

  const toggleAllForItem = useCallback(
    (item: InvoiceableItem) => {
      const available = item.deliveries.filter((d) => !d.is_invoiced);
      const allSelected = available.every((d) => selectedDeliveries.has(d.id));

      setSelectedDeliveries((prev) => {
        const next = new Set(prev);
        available.forEach((d) => {
          if (allSelected) {
            next.delete(d.id);
          } else {
            next.add(d.id);
          }
        });
        return next;
      });
      setPreviewData(null);
    },
    [selectedDeliveries]
  );

  const selectAllAvailable = useCallback(() => {
    setSelectedDeliveries((prev) => {
      const next = new Set(prev);
      items.forEach((item) => {
        item.deliveries.forEach((d) => {
          if (!d.is_invoiced) next.add(d.id);
        });
      });
      return next;
    });
    setPreviewData(null);
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedDeliveries(new Set());
    setPreviewData(null);
  }, []);

  const toggleItemExpand = useCallback((itemId: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const handlePreview = useCallback(() => {
    if (selectedDeliveries.size === 0) return;
    previewMutation.mutate(
      { delivery_ids: Array.from(selectedDeliveries) },
      {
        onSuccess: (res) => {
          setPreviewData(res.data);
        },
      }
    );
  }, [selectedDeliveries, previewMutation]);

  const handleCreateInvoice = useCallback(() => {
    if (selectedDeliveries.size === 0) return;
    createMutation.mutate(
      {
        orderId,
        payload: {
          delivery_ids: Array.from(selectedDeliveries),
          notes: invoiceNotes || undefined,
          due_date: invoiceDueDate || undefined,
          discount: invoiceDiscount ? parseFloat(invoiceDiscount) : undefined,
        },
      },
      {
        onSuccess: () => {
          setSelectedDeliveries(new Set());
          setPreviewData(null);
          setInvoiceNotes('');
          setInvoiceDueDate('');
          setInvoiceDiscount('');
          setActiveView('list');
        },
      }
    );
  }, [selectedDeliveries, orderId, invoiceNotes, invoiceDueDate, invoiceDiscount, createMutation]);

  const handleStatusChange = useCallback(
    (invoiceId: number, newStatus: InvoiceStatus) => {
      statusMutation.mutate({
        invoiceId,
        orderId,
        payload: { status: newStatus },
      });
    },
    [orderId, statusMutation]
  );

  const handleViewInvoice = useCallback((invoiceId: number) => {
    setViewingInvoiceId(invoiceId);
    setActiveView('detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setViewingInvoiceId(null);
    setActiveView('list');
    setPreviewData(null);
  }, []);

  const handleStartCreate = useCallback(() => {
    setActiveView('create');
    setExpandedItems(new Set(items.map((i) => i.id)));
  }, [items]);

  // ==================== RENDER ====================
  if (loadingDeliveries || loadingInvoices) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600 mr-3" size={32} />
        <span className="text-gray-600 font-medium">Loading invoice data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Receipt size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Invoices</h2>
              <p className="text-emerald-100 text-sm mt-1">
                {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} created ·{' '}
                {availableDeliveryCount} deliveries available to invoice
              </p>
            </div>
          </div>

          {activeView === 'list' && availableDeliveryCount > 0 && (
            <button
              onClick={handleStartCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 rounded-lg font-bold hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <Plus size={18} />
              Create Invoice
            </button>
          )}

          {(activeView === 'create' || activeView === 'detail') && (
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors border border-white/20"
            >
              ← Back to Invoices
            </button>
          )}
        </div>
      </div>

      {/* Content based on active view */}
      {activeView === 'list' && (
        <InvoiceListView
          invoices={invoices}
          availableDeliveryCount={availableDeliveryCount}
          onViewInvoice={handleViewInvoice}
          onStatusChange={handleStatusChange}
          statusMutation={statusMutation}
          onStartCreate={handleStartCreate}
        />
      )}

      {activeView === 'create' && (
        <InvoiceCreateView
          items={items}
          selectedDeliveries={selectedDeliveries}
          expandedItems={expandedItems}
          previewData={previewData}
          invoiceNotes={invoiceNotes}
          invoiceDueDate={invoiceDueDate}
          invoiceDiscount={invoiceDiscount}
          previewLoading={previewMutation.isPending}
          createLoading={createMutation.isPending}
          onToggleDelivery={toggleDelivery}
          onToggleAllForItem={toggleAllForItem}
          onSelectAll={selectAllAvailable}
          onClearSelection={clearSelection}
          onToggleItemExpand={toggleItemExpand}
          onPreview={handlePreview}
          onCreate={handleCreateInvoice}
          onNotesChange={setInvoiceNotes}
          onDueDateChange={setInvoiceDueDate}
          onDiscountChange={setInvoiceDiscount}
        />
      )}

      {activeView === 'detail' && viewingInvoiceId && (
        <InvoiceDetailView invoiceId={viewingInvoiceId} orderId={orderId} />
      )}
    </div>
  );
};

// ==================== INVOICE LIST VIEW ====================
interface InvoiceListViewProps {
  invoices: InvoiceSummary[];
  availableDeliveryCount: number;
  onViewInvoice: (id: number) => void;
  onStatusChange: (id: number, status: InvoiceStatus) => void;
  statusMutation: any;
  onStartCreate: () => void;
}

const InvoiceListView: React.FC<InvoiceListViewProps> = ({
  invoices,
  availableDeliveryCount,
  onViewInvoice,
  onStatusChange,
  statusMutation,
  onStartCreate,
}) => {
  if (invoices.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Receipt className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Invoices Yet</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Create your first invoice by selecting deliveries from order items. You can create
          multiple partial invoices for different delivery batches.
        </p>
        {availableDeliveryCount > 0 && (
          <button
            onClick={onStartCreate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Create First Invoice
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors shadow-sm"
        >
          <div className="flex items-start justify-between">
            {/* Left: Invoice info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-lg font-bold text-gray-900">{invoice.invoice_number}</h4>
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${getInvoiceStatusBadge(
                    invoice.status
                  )}`}
                >
                  {invoice.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Issued: {invoice.issued_date ? formatDate(invoice.issued_date) : '—'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Due: {invoice.due_date ? formatDate(invoice.due_date) : '—'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  {invoice.items_count} line item{invoice.items_count !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  By {invoice.created_by}
                </span>
              </div>
            </div>

            {/* Right: Amount + Actions */}
            <div className="text-right flex flex-col items-end gap-3">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(invoice.total_amount)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={invoice.status}
                  onChange={(e) => onStatusChange(invoice.id, e.target.value as InvoiceStatus)}
                  disabled={statusMutation.isPending}
                  className="text-xs border-2 border-gray-200 rounded-lg px-2 py-1.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {INVOICE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => onViewInvoice(invoice.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border-2 border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <Eye size={14} />
                  View
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
            <span>Subtotal: {formatCurrency(invoice.subtotal)}</span>
            <span>Delivery: {formatCurrency(invoice.delivery_total)}</span>
            <span>GST: {formatCurrency(invoice.gst_tax)}</span>
            {invoice.discount > 0 && (
              <span className="text-red-600">Discount: -{formatCurrency(invoice.discount)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== INVOICE CREATE VIEW ====================
interface InvoiceCreateViewProps {
  items: InvoiceableItem[];
  selectedDeliveries: Set<number>;
  expandedItems: Set<number>;
  previewData: InvoicePreviewData | null;
  invoiceNotes: string;
  invoiceDueDate: string;
  invoiceDiscount: string;
  previewLoading: boolean;
  createLoading: boolean;
  onToggleDelivery: (id: number) => void;
  onToggleAllForItem: (item: InvoiceableItem) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onToggleItemExpand: (id: number) => void;
  onPreview: () => void;
  onCreate: () => void;
  onNotesChange: (v: string) => void;
  onDueDateChange: (v: string) => void;
  onDiscountChange: (v: string) => void;
}

const InvoiceCreateView: React.FC<InvoiceCreateViewProps> = ({
  items,
  selectedDeliveries,
  expandedItems,
  previewData,
  invoiceNotes,
  invoiceDueDate,
  invoiceDiscount,
  previewLoading,
  createLoading,
  onToggleDelivery,
  onToggleAllForItem,
  onSelectAll,
  onClearSelection,
  onToggleItemExpand,
  onPreview,
  onCreate,
  onNotesChange,
  onDueDateChange,
  onDiscountChange,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT: Delivery Selection (2 cols) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Selection Controls */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Select Deliveries to Invoice</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {selectedDeliveries.size} delivery{selectedDeliveries.size !== 1 ? 'es' : ''}{' '}
                selected
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onSelectAll}
                className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Select All Available
              </button>
              {selectedDeliveries.size > 0 && (
                <button
                  onClick={onClearSelection}
                  className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Items with Deliveries */}
        {items.map((item) => {
          const isExpanded = expandedItems.has(item.id);
          const availableDeliveries = item.deliveries.filter((d) => !d.is_invoiced);
          const invoicedDeliveries = item.deliveries.filter((d) => d.is_invoiced);
          const allAvailableSelected =
            availableDeliveries.length > 0 &&
            availableDeliveries.every((d) => selectedDeliveries.has(d.id));
          const someSelected = availableDeliveries.some((d) => selectedDeliveries.has(d.id));

          // Calculate selected totals for this item
          const selectedForItem = item.deliveries.filter((d) => selectedDeliveries.has(d.id));
          const selectedQty = selectedForItem.reduce((sum, d) => sum + d.quantity, 0);
          const selectedItemCost = selectedForItem.reduce(
            (sum, d) => sum + d.quantity * d.unit_cost,
            0
          );
          const selectedDeliveryCost = selectedForItem.reduce(
            (sum, d) => sum + d.delivery_cost,
            0
          );
          const selectedTotal = selectedItemCost + selectedDeliveryCost;

          return (
            <div
              key={item.id}
              className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden"
            >
              {/* Item Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onToggleItemExpand(item.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Select All Checkbox for this item */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleAllForItem(item);
                    }}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${
                      allAvailableSelected
                        ? 'bg-emerald-600 border-emerald-600'
                        : someSelected
                        ? 'bg-emerald-100 border-emerald-400'
                        : 'border-gray-300 hover:border-emerald-400'
                    }`}
                  >
                    {allAvailableSelected && (
                      <CheckCircle size={14} className="text-white" />
                    )}
                    {someSelected && !allAvailableSelected && (
                      <div className="w-2 h-2 rounded-sm bg-emerald-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-gray-500 flex-shrink-0" />
                      <h4 className="font-bold text-gray-900 truncate">{item.product_name}</h4>
                      {item.is_quoted === 1 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full border border-purple-200 flex-shrink-0">
                          QUOTED
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      <p className="text-xs text-gray-500">
                        {item.supplier_name} · {item.quantity} {item.unit_of_measure} total ·{' '}
                        {availableDeliveries.length} available, {invoicedDeliveries.length} invoiced
                      </p>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        Unit: {formatCurrency(item.unit_cost)}/{item.unit_of_measure}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {someSelected && (
                    <span className="px-2 py-1 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full">
                      {selectedForItem.length} selected
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Selected Cost Summary Bar - only when deliveries are selected */}
              {selectedForItem.length > 0 && (
                <div className="mx-4 mb-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-emerald-800">
                      Selected Summary ({selectedForItem.length} delivery{selectedForItem.length !== 1 ? 'es' : ''}, {selectedQty} {item.unit_of_measure})
                    </p>
                    <p className="text-sm font-bold text-emerald-800">
                      {formatCurrency(selectedTotal)}
                    </p>
                  </div>
                  <div className="flex gap-4 mt-1 text-[11px] text-emerald-700">
                    <span>
                      Items: {formatCurrency(selectedItemCost)}
                      <span className="text-emerald-500 ml-1">
                        ({selectedQty} × {formatCurrency(item.unit_cost)})
                      </span>
                    </span>
                    <span>Delivery: {formatCurrency(selectedDeliveryCost)}</span>
                  </div>
                </div>
              )}

              {/* Expanded Deliveries */}
              {isExpanded && (
                <div className="border-t-2 border-gray-100 p-4 bg-gray-50">
                  <div className="space-y-2">
                    {item.deliveries.map((delivery, idx) => (
                      <DeliveryRow
                        key={delivery.id}
                        delivery={delivery}
                        index={idx}
                        isSelected={selectedDeliveries.has(delivery.id)}
                        onToggle={() => onToggleDelivery(delivery.id)}
                        unitOfMeasure={item.unit_of_measure}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center">
            <AlertCircle className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-gray-600 font-medium">No items found for this order.</p>
          </div>
        )}
      </div>

      {/* RIGHT: Preview & Create (1 col) */}
      <div className="lg:col-span-1">
        <div className="sticky top-6 space-y-4">
          {/* Preview Button */}
          <button
            onClick={onPreview}
            disabled={selectedDeliveries.size === 0 || previewLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {previewLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <DollarSign size={18} />
                Preview Invoice ({selectedDeliveries.size} deliveries)
              </>
            )}
          </button>

          {/* Preview Results */}
          {previewData && (
            <div className="bg-white border-2 border-emerald-200 rounded-xl p-5 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Receipt size={18} className="text-emerald-600" />
                Invoice Preview
              </h4>

              {/* Line Items Summary */}
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {previewData.line_items.map((line, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{line.product_name}</p>
                      <p className="text-xs text-gray-500">
                        {line.quantity} units · {line.delivery_date || '—'}
                      </p>
                      {line.delivery_cost > 0 && (
                        <p className="text-[10px] text-gray-400">
                          Item: {formatCurrency(line.unit_price * line.quantity)} + Del: {formatCurrency(line.delivery_cost)}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-gray-900 ml-3">
                      {formatCurrency(line.line_total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t-2 border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(previewData.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-medium">{formatCurrency(previewData.delivery_total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST (10%)</span>
                  <span className="font-medium">{formatCurrency(previewData.gst_tax)}</span>
                </div>
                {parseFloat(invoiceDiscount) > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(parseFloat(invoiceDiscount))}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-emerald-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-emerald-700">
                    {formatCurrency(
                      previewData.total_amount - (parseFloat(invoiceDiscount) || 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Options */}
          {previewData && (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="font-bold text-gray-900 text-sm">Invoice Options</h4>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={invoiceDueDate}
                  onChange={(e) => onDueDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Discount ($)
                </label>
                <input
                  type="number"
                  value={invoiceDiscount}
                  onChange={(e) => onDiscountChange(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notes</label>
                <textarea
                  value={invoiceNotes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="Optional notes for this invoice..."
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Create Invoice Button */}
          {previewData && (
            <button
              onClick={onCreate}
              disabled={createLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {createLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Invoice...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Create Invoice
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== DELIVERY ROW ====================
interface DeliveryRowProps {
  delivery: InvoiceableDelivery;
  index: number;
  isSelected: boolean;
  onToggle: () => void;
  unitOfMeasure: string;
}

const DeliveryRow: React.FC<DeliveryRowProps> = ({ delivery, index, isSelected, onToggle, unitOfMeasure }) => {
  const isInvoiced = delivery.is_invoiced;
  const itemSubtotal = delivery.quantity * delivery.unit_cost;
  const rowTotal = itemSubtotal + delivery.delivery_cost;

  return (
    <div
      onClick={!isInvoiced ? onToggle : undefined}
      className={`flex flex-col gap-2 p-3 rounded-lg transition-all ${
        isInvoiced
          ? 'bg-gray-100 opacity-60 cursor-not-allowed'
          : isSelected
          ? 'bg-emerald-50 border-2 border-emerald-300 cursor-pointer'
          : 'bg-white border-2 border-gray-200 cursor-pointer hover:border-emerald-200'
      }`}
    >
      {/* Top Row: Checkbox, Date, Time, Qty, Status */}
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
            isInvoiced
              ? 'border-gray-300 bg-gray-200'
              : isSelected
              ? 'bg-emerald-600 border-emerald-600'
              : 'border-gray-300'
          }`}
        >
          {isInvoiced ? (
            <Lock size={12} className="text-gray-400" />
          ) : isSelected ? (
            <CheckCircle size={14} className="text-white" />
          ) : null}
        </div>

        {/* Delivery Info */}
        <div className="flex-1 flex items-center gap-4 flex-wrap">
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded border border-blue-200">
            #{index + 1}
          </span>

          <div className="flex items-center gap-1.5 text-sm">
            <Calendar size={13} className="text-gray-400" />
            <span className="font-medium text-gray-900">
              {delivery.delivery_date ? formatDate(delivery.delivery_date) : '—'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-sm">
            <Clock size={13} className="text-gray-400" />
            <span className="text-gray-600">{formatTime(delivery.delivery_time)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-sm">
            <Truck size={13} className="text-gray-400" />
            <span className="font-medium text-gray-900">
              {delivery.quantity} {unitOfMeasure}
            </span>
          </div>

          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
              delivery.status === 'Delivered'
                ? 'bg-green-100 text-green-700 border-green-200'
                : delivery.status === 'Scheduled'
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : delivery.status === 'Cancelled'
                ? 'bg-red-100 text-red-700 border-red-200'
                : 'bg-gray-100 text-gray-700 border-gray-200'
            }`}
          >
            {delivery.status}
          </span>

          {delivery.supplier_confirms && (
            <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
          )}
        </div>

        {/* Invoiced Label */}
        {isInvoiced && (
          <span className="px-2 py-1 text-[10px] font-bold bg-amber-100 text-amber-700 rounded border border-amber-200 flex-shrink-0">
            INVOICED
          </span>
        )}
      </div>

      {/* Bottom Row: Cost Breakdown */}
      {!isInvoiced && (
        <div className="flex items-center gap-4 ml-8 text-xs">
          <span className="text-gray-500">
            <DollarSign size={11} className="inline -mt-0.5" />
            Unit: {formatCurrency(delivery.unit_cost)}/{unitOfMeasure}
          </span>
          <span className="text-gray-500">
            Items: {formatCurrency(itemSubtotal)}
            <span className="text-gray-400 ml-1">
              ({delivery.quantity} × {formatCurrency(delivery.unit_cost)})
            </span>
          </span>
          {delivery.delivery_cost > 0 && (
            <span className="text-gray-500">
              <Truck size={11} className="inline -mt-0.5 mr-0.5" />
              Delivery: {formatCurrency(delivery.delivery_cost)}
            </span>
          )}
          <span className="font-bold text-gray-700 ml-auto">
            Total: {formatCurrency(rowTotal)}
          </span>
        </div>
      )}
    </div>
  );
};

// ==================== INVOICE DETAIL VIEW ====================
interface InvoiceDetailViewProps {
  invoiceId: number;
  orderId: number;
}

const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({ invoiceId, orderId }) => {
  const { data, isLoading } = useInvoiceDetail(invoiceId);
  const statusMutation = useUpdateInvoiceStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-emerald-600 mr-3" size={32} />
        <span className="text-gray-600 font-medium">Loading invoice...</span>
      </div>
    );
  }

  const invoice = data?.data;
  if (!invoice) {
    return (
      <div className="bg-white border-2 border-red-200 rounded-xl p-8 text-center">
        <AlertCircle className="mx-auto text-red-500 mb-3" size={40} />
        <p className="text-red-600 font-medium">Invoice not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Invoice Header Card */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h3>
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${getInvoiceStatusBadge(
                  invoice.status
                )}`}
              >
                {invoice.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">Created by {invoice.created_by}</p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-600">Change Status:</label>
            <select
              value={invoice.status}
              onChange={(e) =>
                statusMutation.mutate({
                  invoiceId: invoice.id,
                  orderId,
                  payload: { status: e.target.value as InvoiceStatus },
                })
              }
              disabled={statusMutation.isPending}
              className="text-sm border-2 border-gray-200 rounded-lg px-3 py-1.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {INVOICE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Order</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{invoice.order.po_number}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Client</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{invoice.order.client_name}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Issued</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">
              {invoice.issued_date ? formatDate(invoice.issued_date) : '—'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Due</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">
              {invoice.due_date ? formatDate(invoice.due_date) : '—'}
            </p>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs font-bold text-yellow-800 mb-0.5">Notes</p>
            <p className="text-sm text-yellow-900">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Line Items Table */}
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Package size={16} className="text-emerald-600" />
            Line Items ({invoice.items.length})
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Product
                </th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Delivery Date
                </th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Qty
                </th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Unit Price
                </th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Delivery
                </th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Line Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{item.unit_of_measure}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-gray-400" />
                      {item.delivery_date ? formatDate(item.delivery_date) : '—'}
                    </div>
                    {item.delivery_time && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatTime(item.delivery_time)}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">
                    {formatCurrency(item.delivery_cost)}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-gray-900">
                    {formatCurrency(item.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Footer */}
        <div className="border-t-2 border-gray-200 bg-gray-50 px-5 py-4">
          <div className="max-w-xs ml-auto space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery</span>
              <span className="font-medium">{formatCurrency(invoice.delivery_total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">GST (10%)</span>
              <span className="font-medium">{formatCurrency(invoice.gst_tax)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount</span>
                <span>-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-gray-300">
              <span className="text-gray-900">Total Amount</span>
              <span className="text-emerald-700">{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderInvoicesTab;