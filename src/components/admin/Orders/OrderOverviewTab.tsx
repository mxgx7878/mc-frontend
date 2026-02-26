// FILE PATH: src/components/admin/Orders/OrderOverviewTab.tsx

/**
 * Order Overview Tab Component - REDESIGNED
 * Clean table-based layout with properly formatted fields
 */

import React from 'react';
import {
  FileText,
  Calendar,
  MapPin,
  User,
  Briefcase,
  Clock,
  Package,
  Phone,
  UserCircle,
  Hash,
  RefreshCw,
  CalendarClock,
  Info,
} from 'lucide-react';
import type { AdminOrderDetail } from '../../../types/adminOrder.types';
import { formatDate, formatDateTime, getWorkflowBadgeClass, getPaymentBadgeClass } from '../../../features/adminOrders/utils';

interface OrderOverviewTabProps {
  order: AdminOrderDetail;
}


// ── Detail Row ──
const DetailRow = ({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) => (
  <tr className="border-b border-gray-100 last:border-0">
    <td className="py-3 pr-4 w-[200px]">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
    </td>
    <td className={`py-3 text-sm font-medium text-gray-900 ${valueClass || ''}`}>{value || '—'}</td>
  </tr>
);

const OrderOverviewTab: React.FC<OrderOverviewTabProps> = ({ order }) => {
  return (
    <div className="space-y-5">
      {/* Order Info Banner (if exists) */}
      {order.order_info && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">{order.order_info}</p>
        </div>
      )}

      {/* ── Section 1: Order Details ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Order Details
          </h3>
        </div>
        <div className="px-5">
          <table className="w-full">
            <tbody>
              <DetailRow
                icon={<Hash className="w-3.5 h-3.5 text-gray-400" />}
                label="PO Number"
                value={
                  order.po_number ? (
                    <span className="font-mono text-blue-600 font-bold">{order.po_number}</span>
                  ) : (
                    <span className="text-gray-400 italic">Not assigned</span>
                  )
                }
              />
              <DetailRow
                icon={<MapPin className="w-3.5 h-3.5 text-gray-400" />}
                label="Delivery Address"
                value={order.delivery_address}
              />
              
              <DetailRow
                icon={<Package className="w-3.5 h-3.5 text-gray-400" />}
                label="Total Items"
                value={
                  <span className="font-bold">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </span>
                }
              />
              <DetailRow
                icon={<RefreshCw className="w-3.5 h-3.5 text-gray-400" />}
                label="Repeat Order"
                value={
                  order.repeat_order ? (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-green-50 text-green-700 rounded-full border border-green-200">
                      Yes
                    </span>
                  ) : (
                    'No'
                  )
                }
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 2: Project & Contact ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-purple-600" />
            Project & Contact
          </h3>
        </div>
        <div className="px-5">
          <table className="w-full">
            <tbody>
              <DetailRow
                icon={<User className="w-3.5 h-3.5 text-gray-400" />}
                label="Client"
                value={<span className="font-bold">{order.client}</span>}
              />
              <DetailRow
                icon={<Briefcase className="w-3.5 h-3.5 text-gray-400" />}
                label="Project"
                value={order.project}
              />
              {order.contact_person_name && (
                <DetailRow
                  icon={<UserCircle className="w-3.5 h-3.5 text-gray-400" />}
                  label="Site Contact"
                  value={order.contact_person_name}
                />
              )}
              {order.contact_person_number && (
                <DetailRow
                  icon={<Phone className="w-3.5 h-3.5 text-gray-400" />}
                  label="Site Phone"
                  value={
                    <a
                      href={`tel:${order.contact_person_number}`}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {order.contact_person_number}
                    </a>
                  }
                />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 3: Status & Dates ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-green-600" />
            Status & Timeline
          </h3>
        </div>
        <div className="px-5">
          <table className="w-full">
            <tbody>
              <DetailRow
                icon={<Info className="w-3.5 h-3.5 text-gray-400" />}
                label="Order Status"
                value={
                  <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${getWorkflowBadgeClass(order.workflow)}`}>
                    {order.workflow}
                  </span>
                }
              />
              <DetailRow
                icon={<Info className="w-3.5 h-3.5 text-gray-400" />}
                label="Payment Status"
                value={
                  <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${getPaymentBadgeClass(order.payment_status)}`}>
                    {order.payment_status}
                  </span>
                }
              />
              <DetailRow
                icon={<Calendar className="w-3.5 h-3.5 text-gray-400" />}
                label="Order Date"
                value={formatDate(order.created_at)}
              />
              <DetailRow
                icon={<Clock className="w-3.5 h-3.5 text-gray-400" />}
                label="Last Updated"
                value={formatDateTime(order.updated_at)}
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 4: Special Notes (if any) ── */}
      {order.special_notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-900 mb-1">Special Notes</h4>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {order.special_notes}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 5: GPS Coordinates (if available) ── */}
      {order.delivery_lat && order.delivery_long && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">GPS Coordinates</h4>
          <div className="flex gap-4">
            <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <span className="text-gray-500">Lat:</span>{' '}
              <span className="font-mono font-semibold text-gray-900">{order.delivery_lat.toFixed(6)}</span>
            </div>
            <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <span className="text-gray-500">Lng:</span>{' '}
              <span className="font-mono font-semibold text-gray-900">{order.delivery_long.toFixed(6)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderOverviewTab;