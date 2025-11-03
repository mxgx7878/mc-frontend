// FILE PATH: src/components/admin/Orders/OrderOverviewTab.tsx

/**
 * Order Overview Tab Component
 * Displays basic order information
 */

import React from 'react';
import {
  FileText,
  Calendar,
  MapPin,
  Truck,
  User,
  Briefcase,
  Clock,
  Package,
} from 'lucide-react';
import type { AdminOrderDetail } from '../../../types/adminOrder.types';
import { formatDate } from '../../../features/adminOrders/utils';

interface OrderOverviewTabProps {
  order: AdminOrderDetail;
}

const OrderOverviewTab: React.FC<OrderOverviewTabProps> = ({ order }) => {
  const infoCards = [
    {
      icon: User,
      label: 'Client',
      value: order.client,
      color: 'blue',
    },
    {
      icon: Briefcase,
      label: 'Project',
      value: order.project,
      color: 'purple',
    },
    {
      icon: MapPin,
      label: 'Delivery Address',
      value: order.delivery_address,
      color: 'green',
    },
    {
      icon: Calendar,
      label: 'Delivery Date',
      value: formatDate(order.delivery_date),
      color: 'orange',
    },
    {
      icon: Clock,
      label: 'Delivery Time',
      value: order.delivery_time,
      color: 'pink',
    },
    {
      icon: Truck,
      label: 'Delivery Method',
      value: order.delivery_method || 'Not specified',
      color: 'yellow',
    },
    {
      icon: Package,
      label: 'Total Items',
      value: `${order.items.length} item${order.items.length !== 1 ? 's' : ''}`,
      color: 'indigo',
    },
    {
      icon: FileText,
      label: 'PO Number',
      value: order.po_number,
      color: 'cyan',
    },
  ];

  const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-200' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200' },
    pink: { bg: 'bg-pink-50', icon: 'text-pink-600', border: 'border-pink-200' },
    yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-200' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-200' },
    cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', border: 'border-cyan-200' },
  };

  return (
    <div className="space-y-6">
      {/* Order Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {infoCards.map((card) => {
          const Icon = card.icon;
          const colors = colorClasses[card.color];
          return (
            <div
              key={card.label}
              className={`${colors.bg} border-2 ${colors.border} rounded-xl p-5 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 ${colors.bg} rounded-lg border ${colors.border}`}>
                  <Icon className={colors.icon} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.label}</p>
                  <p className="text-lg font-bold text-gray-900 break-words">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Special Notes */}
      {order.special_notes && (
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg border border-amber-300">
              <FileText className="text-amber-600" size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-amber-900 mb-2">Special Notes</h4>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {order.special_notes}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Location Coordinates (if available) */}
      {order.delivery_lat && order.delivery_long && (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-bold text-gray-700 mb-3">GPS Coordinates</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-lg border border-gray-300">
              <div className="text-xs text-gray-600">Latitude</div>
              <div className="text-sm font-mono font-bold text-gray-900">
                {order.delivery_lat.toFixed(6)}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-300">
              <div className="text-xs text-gray-600">Longitude</div>
              <div className="text-sm font-mono font-bold text-gray-900">
                {order.delivery_long.toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderOverviewTab;