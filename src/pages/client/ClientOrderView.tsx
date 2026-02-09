// src/pages/client/ClientOrderView.tsx
// Updated: Proper invoice view with From/To, no delivery costs, Mark as Paid

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
  Loader2,
  CreditCard,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  useClientOrderDetail,
  useCancelOrder,
  usePayInvoice,
  canCancelOrder,
} from '../../features/clientOrders/hooks';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { clientMenuItems } from '../../utils/menuItems';
import type { ClientInvoice, InvoiceStatus, ClientOrder } from '../../types/clientOrder.types';

// ==================== MATERIAL CONNECT COMPANY INFO ====================
// Update these when company details change
const COMPANY_INFO = {
  name: 'Material Connect',
  abn: '12 345 678 901',
  address: 'Sydney, NSW, Australia',
  phone: '1300 000 000',
  email: 'accounts@materialconnect.com.au',
  logo: 'https://demowebportals.com/material_connect/public/assets/img/logo-text.png',
};

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

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-700 border-gray-300',
    Confirmed: 'bg-blue-100 text-blue-700 border-blue-300',
    Scheduled: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    'In Transit': 'bg-amber-100 text-amber-700 border-amber-300',
    Delivered: 'bg-teal-100 text-teal-700 border-teal-300',
    Completed: 'bg-green-100 text-green-700 border-green-300',
    Cancelled: 'bg-red-100 text-red-700 border-red-300',
  };
  return map[status] || 'bg-gray-100 text-gray-700 border-gray-300';
};

const getPaymentStatusColor = (status: string) => {
  const map: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'Partially Paid': 'bg-orange-100 text-orange-700 border-orange-300',
    Paid: 'bg-green-100 text-green-700 border-green-300',
    Requested: 'bg-purple-100 text-purple-700 border-purple-300',
    Refunded: 'bg-red-100 text-red-700 border-red-300',
    'Partial Refunded': 'bg-orange-100 text-orange-700 border-orange-300',
  };
  return map[status] || 'bg-gray-100 text-gray-700 border-gray-300';
};

const getInvoiceStatusColor = (status: InvoiceStatus) => {
  const map: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-700 border-gray-300',
    Issued: 'bg-blue-100 text-blue-700 border-blue-300',
    Sent: 'bg-blue-100 text-blue-700 border-blue-300',
    Unpaid: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    Paid: 'bg-green-100 text-green-700 border-green-300',
    Overdue: 'bg-red-100 text-red-700 border-red-300',
    Cancelled: 'bg-gray-100 text-gray-500 border-gray-300',
    Void: 'bg-gray-100 text-gray-500 border-gray-300',
  };
  return map[status] || 'bg-gray-100 text-gray-700 border-gray-300';
};

// ==================== DETAIL ROW COMPONENT ====================
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

// ==================== GUIDELINES PANEL ====================
const GuidelinesPanel = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  const sections = [
    {
      title: 'Editing Your Order',
      color: 'blue',
      items: [
        { icon: <Pencil className="w-3.5 h-3.5" />, text: 'You can edit your order while it\'s in Draft or Confirmed status via the Edit button in the header.' },
        { icon: <Plus className="w-3.5 h-3.5" />, text: 'Use "Add New Item" in the edit page to search products and add them with delivery schedules.' },
        { icon: <Minus className="w-3.5 h-3.5" />, text: 'You can reduce item quantity but not below the already-delivered amount.' },
        { icon: <Trash2 className="w-3.5 h-3.5" />, text: 'Items can only be removed if none of their deliveries have been completed yet.' },
      ],
    },
    {
      title: 'Delivery Schedules',
      color: 'indigo',
      items: [
        { icon: <SplitSquareHorizontal className="w-3.5 h-3.5" />, text: 'Split deliveries allow you to receive parts of an item on different dates and times.' },
        { icon: <CalendarClock className="w-3.5 h-3.5" />, text: 'Delivery slots with a date before today are locked — they cannot be edited or removed.' },
        { icon: <Lock className="w-3.5 h-3.5" />, text: 'Delivered or completed deliveries are read-only. Only scheduled slots can be changed.' },
        { icon: <Calculator className="w-3.5 h-3.5" />, text: 'Total quantity across all delivery slots must equal the item quantity exactly.' },
      ],
    },
    {
      title: 'Order Rules',
      color: 'amber',
      items: [
        { icon: <XCircle className="w-3.5 h-3.5" />, text: 'Orders can be cancelled while in Draft, Confirmed, Scheduled, or In Transit status.' },
        { icon: <CheckCircle className="w-3.5 h-3.5" />, text: 'Each item requires supplier confirmation. Pending items are awaiting supplier acceptance.' },
        { icon: <DollarSign className="w-3.5 h-3.5" />, text: 'Payment is requested after admin confirms your order. A payment section will appear when due.' },
        { icon: <Clock className="w-3.5 h-3.5" />, text: 'Once an order is Completed or Cancelled, no further edits are possible.' },
      ],
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', icon: 'text-blue-600' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', icon: 'text-indigo-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', icon: 'text-amber-600' },
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          How to Manage Your Order
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((section) => {
          const colors = colorMap[section.color];
          return (
            <div key={section.title} className={`${colors.bg} ${colors.border} border rounded-lg p-3`}>
              <h4 className={`font-semibold ${colors.text} text-xs mb-2`}>{section.title}</h4>
              <div className="space-y-2">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className={`${colors.icon} mt-0.5 flex-shrink-0`}>{item.icon}</span>
                    <p className="text-xs text-gray-700 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== OVERVIEW TAB ====================
const OverviewTab = ({ order }: { order: any }) => (
  <div className="space-y-4">
    {order.order_info && (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-800 font-medium">{order.order_info}</p>
      </div>
    )}

    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-600" />
          Order Details
        </h3>
      </div>
      <table className="w-full">
        <tbody>
          <DetailRow label="PO Number" value={<span className="font-mono text-blue-600">{order.po_number}</span>} icon={<FileText className="w-3.5 h-3.5 text-gray-400" />} />
          <DetailRow label="Delivery Address" value={order.delivery_address} icon={<MapPin className="w-3.5 h-3.5 text-gray-400" />} />
          <DetailRow label="Delivery Date" value={formatDate(order.delivery_date)} icon={<Calendar className="w-3.5 h-3.5 text-gray-400" />} />
          <DetailRow label="Delivery Time" value={formatTime(order.delivery_time)} icon={<Clock className="w-3.5 h-3.5 text-gray-400" />} />
          {order.delivery_method && <DetailRow label="Delivery Method" value={order.delivery_method} icon={<Truck className="w-3.5 h-3.5 text-gray-400" />} />}
          <DetailRow label="Order Status" value={<span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(order.order_status)}`}>{order.order_status}</span>} />
          <DetailRow label="Payment Status" value={<span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getPaymentStatusColor(order.payment_status)}`}>{order.payment_status}</span>} />
          <DetailRow label="Order Date" value={formatDate(order.created_at)} icon={<Calendar className="w-3.5 h-3.5 text-gray-400" />} />
          {order.updated_at && order.updated_at !== order.created_at && (
            <DetailRow label="Last Updated" value={formatDate(order.updated_at)} icon={<Clock className="w-3.5 h-3.5 text-gray-400" />} />
          )}
        </tbody>
      </table>
    </div>

    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          Project & Contact
        </h3>
      </div>
      <table className="w-full">
        <tbody>
          <DetailRow label="Project" value={order.project?.name} icon={<Building2 className="w-3.5 h-3.5 text-gray-400" />} />
          {order.project?.site_contact_name && <DetailRow label="Site Contact" value={order.project.site_contact_name} icon={<User className="w-3.5 h-3.5 text-gray-400" />} />}
          {order.project?.site_contact_phone && (
            <DetailRow label="Site Phone" value={<a href={`tel:${order.project.site_contact_phone}`} className="text-blue-600 hover:underline">{order.project.site_contact_phone}</a>} icon={<Phone className="w-3.5 h-3.5 text-gray-400" />} />
          )}
          {order.contact_person_name && <DetailRow label="Contact Person" value={order.contact_person_name} icon={<User className="w-3.5 h-3.5 text-gray-400" />} />}
          {order.contact_person_number && (
            <DetailRow label="Contact Number" value={<a href={`tel:${order.contact_person_number}`} className="text-blue-600 hover:underline">{order.contact_person_number}</a>} icon={<Phone className="w-3.5 h-3.5 text-gray-400" />} />
          )}
          {order.project?.site_instructions && <DetailRow label="Site Instructions" value={order.project.site_instructions} icon={<Info className="w-3.5 h-3.5 text-gray-400" />} />}
        </tbody>
      </table>
    </div>
  </div>
);

// ==================== ITEMS TAB ====================
const ItemsTab = ({ items }: { items: any[] }) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900 mb-1">No Items</h3>
        <p className="text-sm text-gray-500">This order doesn't have any items yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item: any) => {
        const isExpanded = expandedItems.has(item.id);
        const deliveries = item.deliveries || [];

        return (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button onClick={() => toggleItem(item.id)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{item.product?.product_name || `Product #${item.product_id}`}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity} {item.product?.unit_of_measure || ''} · {deliveries.length} delivery{deliveries.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.supplier_confirms ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {item.supplier_confirms ? 'Confirmed' : 'Pending'}
                </span>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {isExpanded && deliveries.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Delivery Schedule</p>
                <div className="space-y-2">
                  {deliveries.map((del: any, idx: number) => (
                    <div key={del.id || idx} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-900">{formatDateTime(del.delivery_date, del.delivery_time)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">{del.quantity} {item.product?.unit_of_measure || ''}</span>
                        {del.status && (
                          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${del.status === 'Delivered' ? 'bg-green-100 text-green-700' : del.status === 'In Transit' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                            {del.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs text-purple-700 font-medium">
          {items.length} item{items.length !== 1 ? 's' : ''} · Total:{' '}
          <span className="font-bold text-gray-900">{items.reduce((s: number, i: any) => s + parseFloat(i.quantity || 0), 0)} units</span>
        </span>
        <span className="text-green-700 font-semibold text-xs">
          {items.every((i: any) => i.supplier_confirms) ? 'All confirmed' : 'Not all confirmed'}
        </span>
      </div>
    </div>
  );
};

// ==================== INVOICE VIEW MODAL (Proper Invoice Document) ====================
const InvoiceViewModal = ({
  invoice,
  order,
  isOpen,
  onClose,
}: {
  invoice: ClientInvoice | null;
  order: ClientOrder;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen || !invoice) return null;

  const client = order.client;
  const clientCompany = client?.company;

  // Calculate items subtotal (without delivery)
  const itemsSubtotal = invoice.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header (not part of invoice) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              Invoice {invoice.invoice_number}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getInvoiceStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Invoice Document */}
          <div className="p-8">
            {/* Company Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <img
                  src={COMPANY_INFO.logo}
                  alt={COMPANY_INFO.name}
                  className="h-8 mb-3"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <h2 className="text-xl font-bold text-gray-900">{COMPANY_INFO.name}</h2>
                {COMPANY_INFO.abn && (
                  <p className="text-sm text-gray-500 mt-0.5">ABN: {COMPANY_INFO.abn}</p>
                )}
                <p className="text-sm text-gray-500">{COMPANY_INFO.address}</p>
                <p className="text-sm text-gray-500">{COMPANY_INFO.phone}</p>
                <p className="text-sm text-gray-500">{COMPANY_INFO.email}</p>
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">INVOICE</h1>
                <p className="text-sm font-semibold text-blue-600 mt-1">{invoice.invoice_number}</p>
              </div>
            </div>

            {/* Bill To + Invoice Details */}
            <div className="flex justify-between mb-8 gap-8">
              {/* Bill To */}
              <div className="flex-1">
                <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider mb-2">Bill To</p>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  {clientCompany?.name && (
                    <p className="font-bold text-gray-900 text-sm">{clientCompany.name}</p>
                  )}
                  {client?.name && (
                    <p className="text-sm text-gray-700">{client.name}</p>
                  )}
                  {client?.email && (
                    <p className="text-sm text-gray-500">{client.email}</p>
                  )}
                  {(client?.phone || clientCompany?.phone) && (
                    <p className="text-sm text-gray-500">{client?.phone || clientCompany?.phone}</p>
                  )}
                  {clientCompany?.abn && (
                    <p className="text-sm text-gray-500 mt-1">ABN: {clientCompany.abn}</p>
                  )}
                  {clientCompany?.address && (
                    <p className="text-sm text-gray-500">{clientCompany.address}</p>
                  )}
                </div>

                {/* Deliver To */}
                <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider mb-2 mt-4">Deliver To</p>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{order.delivery_address || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="w-[220px] flex-shrink-0">
                <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider mb-2">Invoice Details</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Invoice Date:</span>
                    <span className="font-medium text-gray-900">{invoice.issued_date ? formatDate(invoice.issued_date) : '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Due Date:</span>
                    <span className="font-medium text-gray-900">{invoice.due_date ? formatDate(invoice.due_date) : '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">PO Number:</span>
                    <span className="font-medium text-gray-900">{order.po_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className={`font-semibold ${invoice.status === 'Paid' ? 'text-green-600' : 'text-amber-600'}`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-900">
                    <th className="text-left py-3 text-xs font-bold text-gray-900 uppercase tracking-wider">Item</th>
                    <th className="text-center py-3 text-xs font-bold text-gray-900 uppercase tracking-wider w-[80px]">Qty</th>
                    <th className="text-right py-3 text-xs font-bold text-gray-900 uppercase tracking-wider w-[120px]">Unit Price</th>
                    <th className="text-right py-3 text-xs font-bold text-gray-900 uppercase tracking-wider w-[120px]">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="py-3 pr-4">
                        <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                      </td>
                      <td className="py-3 text-center text-sm text-gray-700">
                        {item.quantity} {item.unit_of_measure}
                      </td>
                      <td className="py-3 text-right text-sm text-gray-700">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="py-3 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-6">
              <div className="w-[280px]">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatCurrency(itemsSubtotal)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Discount</span>
                      <span className="font-medium text-green-600">-{formatCurrency(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">GST (10%)</span>
                    <span className="font-medium text-gray-900">{formatCurrency(invoice.gst_tax)}</span>
                  </div>
                  <div className="border-t-2 border-gray-900 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800 font-medium">Delivery is included in this invoice.</p>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="border-t border-gray-200 pt-4 mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 pt-4 text-center">
              <p className="text-xs text-gray-400">
                Thank you for your business. &mdash; {COMPANY_INFO.name}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ==================== INVOICE CARD ====================
const InvoiceCard = ({
  invoice,
  onView,
  onPay,
  isPaying,
  payingInvoiceId,
}: {
  invoice: ClientInvoice;
  onView: (invoice: ClientInvoice) => void;
  onPay: (invoiceId: number) => void;
  isPaying: boolean;
  payingInvoiceId: number | null;
}) => {
  const canPay = invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && invoice.status !== 'Void';
  const isThisOnePaying = isPaying && payingInvoiceId === invoice.id;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left: Invoice info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            invoice.status === 'Paid' ? 'bg-green-100' : 'bg-amber-100'
          }`}>
            <Receipt className={`w-5 h-5 ${invoice.status === 'Paid' ? 'text-green-600' : 'text-amber-600'}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 text-sm">{invoice.invoice_number}</p>
              <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${getInvoiceStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {invoice.issued_date ? `Issued ${formatDate(invoice.issued_date)}` : 'No issue date'}
              {invoice.due_date && ` · Due ${formatDate(invoice.due_date)}`}
              {' · '}{invoice.items?.length || 0} item{(invoice.items?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Right: Amount + Actions */}
        <div className="flex items-center gap-3">
          <p className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</p>

          {/* View Invoice Button */}
          <button
            onClick={() => onView(invoice)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>

          {/* Mark as Paid / Paid Badge */}
          {canPay ? (
            <button
              onClick={() => onPay(invoice.id)}
              disabled={isPaying}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isThisOnePaying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5" />
                  Mark as Paid
                </>
              )}
            </button>
          ) : invoice.status === 'Paid' ? (
            <span className="flex items-center gap-1 text-xs text-green-600 font-semibold px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-3.5 h-3.5" />
              Paid
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ==================== INVOICES TAB ====================
const InvoicesTab = ({
  invoices,
  order,
  orderId,
}: {
  invoices: ClientInvoice[];
  order: ClientOrder;
  orderId: number;
}) => {
  const payInvoiceMutation = usePayInvoice(orderId);
  const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<ClientInvoice | null>(null);

  const handlePayClick = (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    setConfirmModalOpen(true);
  };

  const handleConfirmPay = async () => {
    if (!selectedInvoiceId) return;
    setPayingInvoiceId(selectedInvoiceId);
    setConfirmModalOpen(false);
    try {
      await payInvoiceMutation.mutateAsync(selectedInvoiceId);
    } finally {
      setPayingInvoiceId(null);
      setSelectedInvoiceId(null);
    }
  };

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  // Empty state
  if (!invoices || invoices.length === 0) {
    return (
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
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Invoices Yet</h3>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            Invoices will appear here once they are generated by the admin for your order.
          </p>
          <div className="mt-5 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] text-blue-700 font-medium">
              Invoices are created per delivery and will show up after supplier confirmation
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Summary stats
  const totalInvoices = invoices.length;
  const paidCount = invoices.filter((i) => i.status === 'Paid').length;
  const unpaidCount = totalInvoices - paidCount;
  const totalAmount = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const paidAmount = invoices.filter((i) => i.status === 'Paid').reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const outstandingAmount = totalAmount - paidAmount;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-[11px] text-gray-500 uppercase font-semibold">Total Invoices</p>
          <p className="text-xl font-bold text-gray-900">{totalInvoices}</p>
        </div>
        <div className="bg-white rounded-lg border border-green-200 p-3 text-center">
          <p className="text-[11px] text-green-600 uppercase font-semibold">Paid</p>
          <p className="text-xl font-bold text-green-700">{paidCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-amber-200 p-3 text-center">
          <p className="text-[11px] text-amber-600 uppercase font-semibold">Unpaid</p>
          <p className="text-xl font-bold text-amber-700">{unpaidCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-blue-200 p-3 text-center">
          <p className="text-[11px] text-blue-600 uppercase font-semibold">Outstanding</p>
          <p className="text-xl font-bold text-blue-700">{formatCurrency(outstandingAmount)}</p>
        </div>
      </div>

      {/* Invoice Cards */}
      {invoices.map((invoice) => (
        <InvoiceCard
          key={invoice.id}
          invoice={invoice}
          onView={(inv) => setViewingInvoice(inv)}
          onPay={handlePayClick}
          isPaying={payInvoiceMutation.isPending}
          payingInvoiceId={payingInvoiceId}
        />
      ))}

      {/* Invoice View Modal */}
      <InvoiceViewModal
        invoice={viewingInvoice}
        order={order}
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
      />

      {/* Pay Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => {
          if (!payInvoiceMutation.isPending) {
            setConfirmModalOpen(false);
            setSelectedInvoiceId(null);
          }
        }}
        onConfirm={handleConfirmPay}
        title="Confirm Payment"
        message={
          selectedInvoice
            ? `Are you sure you want to mark invoice "${selectedInvoice.invoice_number}" (${formatCurrency(selectedInvoice.total_amount)}) as paid?`
            : 'Are you sure you want to mark this invoice as paid?'
        }
        confirmText="Mark as Paid"
        variant="info"
        isLoading={payInvoiceMutation.isPending}
      />
    </div>
  );
};

// ==================== COSTING SIDEBAR ====================
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
        <span className="font-semibold text-gray-900">{formatCurrency(order.customer_item_cost || 0)}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">Delivery Cost</span>
        <span className="font-semibold text-gray-900">{formatCurrency(order.customer_delivery_cost || 0)}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">GST (10%)</span>
        <span className="font-semibold text-gray-900">{formatCurrency(order.gst_tax || 0)}</span>
      </div>
      {order.discount && parseFloat(order.discount.toString()) > 0 && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-green-600">Discount</span>
          <span className="font-semibold text-green-600">-{formatCurrency(order.discount)}</span>
        </div>
      )}
      {order.other_charges && parseFloat(order.other_charges.toString()) > 0 && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Other Charges</span>
          <span className="font-semibold text-gray-900">{formatCurrency(order.other_charges)}</span>
        </div>
      )}

      <div className="border-t-2 border-blue-200 pt-3 mt-1">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-gray-900">Total</span>
          <span className="text-xl font-bold text-blue-600">{formatCurrency(order.total_price || 0)}</span>
        </div>
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
            <button onClick={() => navigate('/client/orders')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              Back to Orders
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { order, items, invoices } = data.data;
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
      badge: invoices?.length || 0,
      activeClass: 'bg-amber-600 text-white border-amber-700 shadow-sm',
      inactiveClass: 'text-gray-600 hover:bg-gray-100 border-gray-200',
    },
  ];

  return (
    <DashboardLayout menuItems={clientMenuItems}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/client/orders')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">Order {order.po_number}</h1>
            <p className="text-xs text-gray-500">Created {formatDate(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.order_status)}`}>{order.order_status}</span>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getPaymentStatusColor(order.payment_status)}`}>{order.payment_status}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleRefresh} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          {['Draft', 'Confirmed'].includes(order.order_status) && (
            <button onClick={() => navigate(`/client/orders/${orderId}/edit`)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
              <Edit className="w-3.5 h-3.5" /> Edit Order
            </button>
          )}
          {showCancelButton && (
            <button onClick={handleCancelClick} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              <XCircle className="w-3.5 h-3.5" /> Cancel Order
            </button>
          )}
          <button
            onClick={() => setShowGuidelines(!showGuidelines)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
              showGuidelines ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> How to Manage Order
          </button>
        </div>

        {/* Guidelines */}
        <GuidelinesPanel isOpen={showGuidelines} onClose={() => setShowGuidelines(false)} />

        {/* Main Layout: Content + Costing Sidebar */}
        <div className="flex gap-5 items-start">
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
                      <span className={`px-1.5 py-0.5 text-[11px] rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {activeTab === 'overview' && <OverviewTab order={order} />}
            {activeTab === 'items' && <ItemsTab items={items || []} />}
            {activeTab === 'invoices' && (
              <InvoicesTab invoices={invoices || []} order={order} orderId={Number(orderId)} />
            )}
          </div>

          {/* Costing Sidebar */}
          <div className="hidden lg:block w-[280px] flex-shrink-0 sticky top-6">
            <CostingSidebar order={order} />
          </div>
        </div>

        {/* Mobile Costing */}
        <div className="lg:hidden">
          <CostingSidebar order={order} />
        </div>

        {/* Cancel Modal */}
        <ConfirmationModal
          isOpen={cancelModalOpen}
          onClose={handleCancelModalClose}
          onConfirm={handleCancelConfirm}
          title="Cancel Order"
          message={`Are you sure you want to cancel order "${order.po_number}"? This action cannot be undone.`}
          confirmText="Cancel Order"
          variant="danger"
          isLoading={cancelOrderMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
};

export default ClientOrderView;