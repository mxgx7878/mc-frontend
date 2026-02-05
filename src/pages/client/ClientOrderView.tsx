// src/pages/client/ClientOrderView.tsx
// Redesigned: persistent costing, practical guidelines, clean tabular layout

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Truck,
  Package,
  RefreshCw,
  Building2,
  Info,
  DollarSign,
  User,
  Phone,
  ClipboardList,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  Edit,
  FileText,
  Calculator,
  Receipt,
  BookOpen,
  X,
  Plus,
  Minus,
  Lock,
  Pencil,
  CalendarClock,
  Trash2,
  SplitSquareHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  useClientOrderDetail,
  useCancelOrder,
  canCancelOrder,
} from '../../features/clientOrders/hooks';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StripePayment from '../../components/client/StripePayment';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { clientMenuItems } from '../../utils/menuItems';

// ==================== TYPES ====================
type TabType = 'overview' | 'items' | 'invoices';

// ==================== HELPERS ====================
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch {
    return '-';
  }
};

const formatDateTime = (dateString: string, timeString?: string) => {
  if (!dateString) return '-';
  try {
    const date = format(new Date(dateString), 'MMM dd, yyyy');
    return timeString ? `${date} at ${timeString}` : date;
  } catch {
    return '-';
  }
};

const formatTime = (timeString: string) => {
  if (!timeString) return '-';
  try {
    return timeString.includes('T')
      ? format(new Date(timeString), 'hh:mm a')
      : timeString;
  } catch {
    return timeString;
  }
};

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  return `$${num.toFixed(2)}`;
};

const getOrderStatusColor = (orderStatus: string) => {
  const statusColors: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-800 border-gray-300',
    Confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
    Scheduled: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'In Transit': 'bg-purple-100 text-purple-800 border-purple-300',
    Delivered: 'bg-green-100 text-green-800 border-green-300',
    Completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Cancelled: 'bg-red-100 text-red-800 border-red-300',
  };
  return statusColors[orderStatus] || 'bg-gray-100 text-gray-800 border-gray-300';
};

const getPaymentStatusColor = (paymentStatus: string) => {
  const colors: Record<string, string> = {
    Unpaid: 'bg-red-100 text-red-800 border-red-300',
    Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Paid: 'bg-green-100 text-green-800 border-green-300',
    'Partially Paid': 'bg-orange-100 text-orange-800 border-orange-300',
    Failed: 'bg-red-100 text-red-800 border-red-300',
  };
  return colors[paymentStatus] || 'bg-gray-100 text-gray-800 border-gray-300';
};

// ==================== GUIDELINES PANEL ====================
const GuidelinesPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  const sections = [
    {
      title: 'Editing Your Order',
      color: 'blue',
      items: [
        {
          icon: <Pencil className="w-3.5 h-3.5" />,
          text: 'Click "Edit Order" to update contact info, add/remove items, and modify quantities.',
        },
        {
          icon: <Plus className="w-3.5 h-3.5" />,
          text: 'Use "Add New Item" in the edit page to search products and add them with delivery schedules.',
        },
        {
          icon: <Minus className="w-3.5 h-3.5" />,
          text: 'You can reduce item quantity but not below the already-delivered amount.',
        },
        {
          icon: <Trash2 className="w-3.5 h-3.5" />,
          text: 'Items can only be removed if none of their deliveries have been completed yet.',
        },
      ],
    },
    {
      title: 'Delivery Schedules',
      color: 'indigo',
      items: [
        {
          icon: <SplitSquareHorizontal className="w-3.5 h-3.5" />,
          text: 'Split deliveries allow you to receive parts of an item on different dates and times.',
        },
        {
          icon: <CalendarClock className="w-3.5 h-3.5" />,
          text: 'Delivery slots with a date before today are locked — they cannot be edited or removed.',
        },
        {
          icon: <Lock className="w-3.5 h-3.5" />,
          text: 'Delivered or completed deliveries are read-only. Only scheduled slots can be changed.',
        },
        {
          icon: <Calculator className="w-3.5 h-3.5" />,
          text: 'Total quantity across all delivery slots must equal the item quantity exactly.',
        },
      ],
    },
    {
      title: 'Order Rules',
      color: 'amber',
      items: [
        {
          icon: <XCircle className="w-3.5 h-3.5" />,
          text: 'Orders can be cancelled while in Draft, Confirmed, Scheduled, or In Transit status.',
        },
        {
          icon: <CheckCircle className="w-3.5 h-3.5" />,
          text: 'Each item requires supplier confirmation. Pending items are awaiting supplier acceptance.',
        },
        {
          icon: <DollarSign className="w-3.5 h-3.5" />,
          text: 'Payment is requested after admin confirms your order. A payment section will appear when due.',
        },
        {
          icon: <Clock className="w-3.5 h-3.5" />,
          text: 'Once an order is Completed or Cancelled, no further edits are possible.',
        },
      ],
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; title: string; iconBg: string }> = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      title: 'text-blue-900',
      iconBg: 'bg-blue-100 text-blue-600',
    },
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      title: 'text-indigo-900',
      iconBg: 'bg-indigo-100 text-indigo-600',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      title: 'text-amber-900',
      iconBg: 'bg-amber-100 text-amber-700',
    },
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-gray-700" />
          <h3 className="font-semibold text-gray-900 text-sm">How to Manage Your Order</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {sections.map((section, sIdx) => {
          const c = colorMap[section.color];
          return (
            <div key={sIdx} className={`${c.bg} rounded-lg border ${c.border} p-4`}>
              <h4 className={`text-sm font-bold ${c.title} mb-3`}>{section.title}</h4>
              <ul className="space-y-2.5">
                {section.items.map((item, iIdx) => (
                  <li key={iIdx} className="flex gap-2.5 text-xs text-gray-700 leading-relaxed">
                    <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${c.iconBg}`}>
                      {item.icon}
                    </span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== DETAIL ROW ====================
const DetailRow = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) => (
  <tr className="border-b border-gray-100 last:border-0">
    <td className="py-2.5 px-4 text-sm text-gray-500 font-medium w-[180px] whitespace-nowrap">
      <div className="flex items-center gap-2">
        {icon}
        {label}
      </div>
    </td>
    <td className="py-2.5 px-4 text-sm text-gray-900 font-medium">{value || '-'}</td>
  </tr>
);

// ==================== COSTING SIDEBAR (always visible) ====================
const CostingSidebar = ({ order }: { order: any }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600">
      <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
        <Calculator className="w-4 h-4" />
        Order Total
      </h3>
    </div>
    <div className="p-4 space-y-2.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">Items Cost</span>
        <span className="font-semibold text-gray-900">
          {formatCurrency(order.customer_item_cost || 0)}
        </span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">Delivery Cost</span>
        <span className="font-semibold text-gray-900">
          {formatCurrency(order.customer_delivery_cost || 0)}
        </span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">GST (10%)</span>
        <span className="font-semibold text-gray-900">
          {formatCurrency(order.gst_tax || 0)}
        </span>
      </div>
      {order.discount && parseFloat(order.discount.toString()) > 0 && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-green-600">Discount</span>
          <span className="font-semibold text-green-600">
            -{formatCurrency(order.discount)}
          </span>
        </div>
      )}
      {order.other_charges && parseFloat(order.other_charges.toString()) > 0 && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Other Charges</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(order.other_charges)}
          </span>
        </div>
      )}

      <div className="border-t-2 border-blue-200 pt-3 mt-1">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-gray-900">Total</span>
          <span className="text-xl font-bold text-blue-600">
            {formatCurrency(order.total_price || 0)}
          </span>
        </div>
      </div>

      <div
        className={`mt-3 px-3 py-2 rounded-lg border flex items-center justify-between ${
          order.payment_status === 'Paid'
            ? 'bg-green-50 border-green-200'
            : order.payment_status === 'Pending' || order.payment_status === 'Unpaid'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-gray-50 border-gray-200'
        }`}
      >
        <span className="text-xs text-gray-600">Payment</span>
        <span
          className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getPaymentStatusColor(
            order.payment_status
          )}`}
        >
          {order.payment_status}
        </span>
      </div>
    </div>
  </div>
);

// ==================== OVERVIEW TAB ====================
const OverviewTab = ({ order }: { order: any }) => (
  <div className="space-y-5">
    {/* Order Information */}
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-600" />
          Order Information
        </h3>
      </div>
      <table className="w-full">
        <tbody>
          <DetailRow
            label="PO Number"
            value={order.po_number}
            icon={<FileText className="w-3.5 h-3.5 text-gray-400" />}
          />
          <DetailRow
            label="Order Status"
            value={
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getOrderStatusColor(order.order_status)}`}>
                {order.order_status}
              </span>
            }
          />
          <DetailRow
            label="Payment Status"
            value={
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getPaymentStatusColor(order.payment_status)}`}>
                {order.payment_status}
              </span>
            }
          />
          <DetailRow
            label="Order Date"
            value={formatDate(order.created_at)}
            icon={<Calendar className="w-3.5 h-3.5 text-gray-400" />}
          />
          {order.updated_at && order.updated_at !== order.created_at && (
            <DetailRow
              label="Last Updated"
              value={formatDate(order.updated_at)}
              icon={<Clock className="w-3.5 h-3.5 text-gray-400" />}
            />
          )}
        </tbody>
      </table>
    </div>

    {/* Project & Contact */}
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          Project & Contact
        </h3>
      </div>
      <table className="w-full">
        <tbody>
          <DetailRow
            label="Project"
            value={order.project?.name}
            icon={<Building2 className="w-3.5 h-3.5 text-gray-400" />}
          />
          {order.project?.site_contact_name && (
            <DetailRow
              label="Site Contact"
              value={order.project.site_contact_name}
              icon={<User className="w-3.5 h-3.5 text-gray-400" />}
            />
          )}
          {order.project?.site_contact_phone && (
            <DetailRow
              label="Site Phone"
              value={
                <a href={`tel:${order.project.site_contact_phone}`} className="text-blue-600 hover:underline">
                  {order.project.site_contact_phone}
                </a>
              }
              icon={<Phone className="w-3.5 h-3.5 text-gray-400" />}
            />
          )}
          {order.contact_person_name && (
            <DetailRow
              label="Contact Person"
              value={order.contact_person_name}
              icon={<User className="w-3.5 h-3.5 text-gray-400" />}
            />
          )}
          {order.contact_person_number && (
            <DetailRow
              label="Contact Number"
              value={
                <a href={`tel:${order.contact_person_number}`} className="text-blue-600 hover:underline">
                  {order.contact_person_number}
                </a>
              }
              icon={<Phone className="w-3.5 h-3.5 text-gray-400" />}
            />
          )}
        </tbody>
      </table>
    </div>

    {/* Delivery Information */}
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-600" />
          Delivery Information
        </h3>
      </div>
      <table className="w-full">
        <tbody>
          <DetailRow
            label="Address"
            value={order.delivery_address}
            icon={<MapPin className="w-3.5 h-3.5 text-gray-400" />}
          />
          <DetailRow
            label="Delivery Date"
            value={formatDateTime(order.delivery_date, order.delivery_time)}
            icon={<Calendar className="w-3.5 h-3.5 text-gray-400" />}
          />
          {order.delivery_method && (
            <DetailRow
              label="Method"
              value={
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-200">
                  {order.delivery_method}
                </span>
              }
              icon={<Truck className="w-3.5 h-3.5 text-gray-400" />}
            />
          )}
        </tbody>
      </table>
      {order.project?.site_instructions && (
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-1">Site Instructions</p>
          <p className="text-sm text-gray-800 bg-gray-50 p-2.5 rounded-lg whitespace-pre-wrap">
            {order.project.site_instructions}
          </p>
        </div>
      )}
      {order.reason && (
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-1">Special Notes</p>
          <p className="text-sm text-gray-800 bg-amber-50 p-2.5 rounded-lg whitespace-pre-wrap border border-amber-100">
            {order.reason}
          </p>
        </div>
      )}
    </div>
  </div>
);

// ==================== ITEMS TAB ====================
const ItemsTab = ({ items }: { items: any[] }) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpand = (itemId: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  };

  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
        <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p className="font-medium text-sm">No items in this order</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Items Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            Order Items ({items.length})
          </h3>
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400" /> Confirmed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400" /> Pending
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/70">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Deliveries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item: any) => {
                const displayPrice =
                  item.is_quoted === 1 && item.quoted_price
                    ? parseFloat(item.quoted_price) || 0
                    : parseFloat(item.supplier_unit_cost || 0) || 0;
                const itemTotal = displayPrice * (parseFloat(item.quantity || 0) || 0);
                const hasDeliveries = item.deliveries && item.deliveries.length > 0;
                const isExpanded = expandedItems.has(item.id);

                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 text-sm">
                        {item.product?.product_name || 'Product'}
                      </p>
                      {item.product?.specifications && (
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{item.product.specifications}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.supplier ? (
                        <span className="text-sm text-gray-700">{item.supplier.company_name}</span>
                      ) : (
                        <span className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Awaiting
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-gray-900">{item.quantity}</span>
                      <span className="text-[11px] text-gray-400 ml-1">{item.product?.unit_of_measure || ''}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-gray-900">{formatCurrency(displayPrice)}</span>
                      {item.is_quoted === 1 && (
                        <span className="block text-[10px] text-blue-600 font-semibold">Quoted</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-gray-900">{formatCurrency(itemTotal)}</span>
                      {item.supplier_discount && parseFloat(item.supplier_discount) > 0 && (
                        <span className="block text-[10px] text-green-600">-{formatCurrency(item.supplier_discount)} disc.</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.supplier_confirms === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-[11px] font-bold rounded-full border border-green-200">
                          <CheckCircle className="w-3 h-3" /> Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-700 text-[11px] font-bold rounded-full border border-yellow-200">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {hasDeliveries ? (
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold rounded border border-blue-200 transition-colors"
                        >
                          <Truck className="w-3 h-3" />
                          {item.deliveries.length}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Delivery Schedules */}
      {items.map((item: any) => {
        if (!expandedItems.has(item.id) || !item.deliveries?.length) return null;
        return (
          <div key={`del-${item.id}`} className="bg-blue-50/60 rounded-xl border border-blue-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-blue-100/50 border-b border-blue-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-blue-900 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Delivery Schedule — {item.product?.product_name}
              </h4>
              <button onClick={() => toggleExpand(item.id)} className="text-blue-500 hover:text-blue-700 text-xs">
                Close
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-100/30">
                    <th className="px-4 py-2 text-xs font-semibold text-blue-700 uppercase text-left">#</th>
                    <th className="px-4 py-2 text-xs font-semibold text-blue-700 uppercase text-left">Quantity</th>
                    <th className="px-4 py-2 text-xs font-semibold text-blue-700 uppercase text-left">Date</th>
                    <th className="px-4 py-2 text-xs font-semibold text-blue-700 uppercase text-left">Time</th>
                    <th className="px-4 py-2 text-xs font-semibold text-blue-700 uppercase text-center">Confirmed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {item.deliveries.map((d: any, idx: number) => {
                    const isPast = d.delivery_date && new Date(d.delivery_date) < new Date(new Date().toDateString());
                    return (
                      <tr key={d.id} className={`${isPast ? 'bg-gray-50/80' : 'bg-white/60'} hover:bg-white transition-colors`}>
                        <td className="px-4 py-2.5">
                          <span className="text-xs font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">#{idx + 1}</span>
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-gray-900">
                          {d.quantity} {item.product?.unit_of_measure || ''}
                        </td>
                        <td className="px-4 py-2.5 text-gray-900">
                          <div className="flex items-center gap-1.5">
                            {formatDate(d.delivery_date)}
                            {isPast && (
                              <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded">PAST</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-gray-900">{formatTime(d.delivery_time)}</td>
                        <td className="px-4 py-2.5 text-center">
                          {d.supplier_confirms ? (
                            <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 bg-blue-100/30 border-t border-blue-200 flex items-center justify-between text-[11px] text-gray-600">
              <span>
                {item.deliveries.length} slot{item.deliveries.length > 1 ? 's' : ''} · Total:{' '}
                <span className="font-bold text-gray-900">{item.quantity} {item.product?.unit_of_measure || ''}</span>
              </span>
              <span className="text-green-700 font-semibold">
                {item.deliveries.filter((d: any) => d.supplier_confirms).length}/{item.deliveries.length} confirmed
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==================== INVOICES TAB ====================
const InvoicesTab = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
      <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
        <Receipt className="w-4 h-4 text-blue-600" />
        Invoices
      </h3>
    </div>
    <div className="flex flex-col items-center justify-center py-14 px-6">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Receipt className="w-8 h-8 text-gray-300" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Coming Soon</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        Invoice management is under development. You'll be able to view, download, and track all invoices here.
      </p>
      <div className="mt-5 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
        <Info className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-[11px] text-blue-700 font-medium">
          Invoices will be auto-generated after payment is processed
        </span>
      </div>
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================
const ClientOrderView = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useClientOrderDetail(Number(orderId));
  const cancelOrderMutation = useCancelOrder();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

  const handleRefresh = () => {
    refetch();
    toast.success('Order refreshed');
  };

  const handleCancelClick = () => setCancelModalOpen(true);

  const handleCancelConfirm = async () => {
    if (!orderId) return;
    try {
      await cancelOrderMutation.mutateAsync(Number(orderId));
      setCancelModalOpen(false);
    } catch {
      // handled by mutation
    }
  };

  const handleCancelModalClose = () => {
    if (!cancelOrderMutation.isPending) setCancelModalOpen(false);
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment completed successfully!');
    refetch();
  };

  // Loading
  if (isLoading) {
    return (
      <DashboardLayout menuItems={clientMenuItems}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading order...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Not found
  if (!data?.data) {
    return (
      <DashboardLayout menuItems={clientMenuItems}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Order not found</h2>
            <p className="text-gray-500 text-sm mb-4">This order doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/client/orders')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { order, items } = data.data;
  const showPayment = order.workflow === 'Payment Requested';
  const showCancelButton = canCancelOrder(order.order_status);

  const tabs: Array<{
    id: TabType;
    label: string;
    icon: React.ElementType;
    badge?: number;
    activeClass: string;
    inactiveClass: string;
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: FileText,
      activeClass: 'bg-blue-600 text-white border-blue-700 shadow-sm',
      inactiveClass: 'text-gray-600 hover:bg-gray-100 border-gray-200',
    },
    {
      id: 'items',
      label: 'Items & Delivery',
      icon: Package,
      badge: items?.length || 0,
      activeClass: 'bg-purple-600 text-white border-purple-700 shadow-sm',
      inactiveClass: 'text-gray-600 hover:bg-gray-100 border-gray-200',
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: Receipt,
      activeClass: 'bg-amber-600 text-white border-amber-700 shadow-sm',
      inactiveClass: 'text-gray-600 hover:bg-gray-100 border-gray-200',
    },
  ];

  return (
    <DashboardLayout menuItems={clientMenuItems}>
      <div className="space-y-4">
        {/* ===== HEADER ===== */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/client/orders')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900">Order #{order.po_number}</h1>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getOrderStatusColor(order.order_status)}`}>
                {order.order_status}
              </span>
              {order.order_info && (
                <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {order.order_info}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ===== ACTION BAR ===== */}
        <div className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate(`/client/orders/${orderId}/edit`)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
            >
              <Edit className="w-4 h-4" />
              Edit Order
            </button>
            {showCancelButton && (
              <button
                onClick={handleCancelClick}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                <XCircle className="w-4 h-4" />
                Cancel Order
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
          <button
            onClick={() => setShowGuidelines(!showGuidelines)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              showGuidelines
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            How to Edit
          </button>
        </div>

        {/* ===== GUIDELINES ===== */}
        <GuidelinesPanel isOpen={showGuidelines} onClose={() => setShowGuidelines(false)} />

        {/* ===== PAYMENT SECTION ===== */}
        {showPayment && order.total_price && (
          <StripePayment
            orderId={Number(orderId)}
            totalAmount={Number(order.total_price) || 0}
            onSuccess={handlePaymentSuccess}
          />
        )}

        {/* ===== MAIN LAYOUT: Content + Costing Sidebar ===== */}
        <div className="flex gap-5 items-start">
          {/* Left: Tabs + Content */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-center gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive ? tab.activeClass : tab.inactiveClass
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.badge !== undefined && (
                      <span className={`px-1.5 py-0.5 text-[11px] rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {activeTab === 'overview' && <OverviewTab order={order} />}
            {activeTab === 'items' && <ItemsTab items={items || []} />}
            {activeTab === 'invoices' && <InvoicesTab />}
          </div>

          {/* Right: Sticky Costing Sidebar (always visible on desktop) */}
          <div className="hidden lg:block w-[280px] flex-shrink-0 sticky top-6">
            <CostingSidebar order={order} />
          </div>
        </div>

        {/* Mobile: Costing at bottom */}
        <div className="lg:hidden">
          <CostingSidebar order={order} />
        </div>

        {/* ===== MODALS ===== */}
        <ConfirmationModal
          isOpen={cancelModalOpen}
          onClose={handleCancelModalClose}
          onConfirm={handleCancelConfirm}
          title="Cancel Order"
          message={`Are you sure you want to cancel order "${order.po_number}"? This action cannot be undone and the order status will be changed to Cancelled.`}
          confirmText="Yes, Cancel Order"
          cancelText="No, Keep Order"
          variant="danger"
          icon="cancel"
          isLoading={cancelOrderMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
};

export default ClientOrderView;