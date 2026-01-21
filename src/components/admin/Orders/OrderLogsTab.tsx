// FILE PATH: src/components/admin/Orders/OrderLogsTab.tsx

/**
 * Order Logs Tab Component
 * Displays activity timeline/audit log for the order
 */

import React from 'react';
import {
  History,
  UserCircle,
  Package,
  Truck,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import type { OrderLog } from '../../../types/adminOrder.types';

interface OrderLogsTabProps {
  logs: OrderLog[];
}

// Map action types to icons and colors
const getActionConfig = (action: string) => {
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes('created')) {
    return { icon: Package, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-600', borderColor: 'border-blue-300' };
  }
  if (actionLower.includes('supplier') && actionLower.includes('assigned')) {
    return { icon: Truck, color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-600', borderColor: 'border-green-300' };
  }
  if (actionLower.includes('payment')) {
    return { icon: CreditCard, color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-600', borderColor: 'border-purple-300' };
  }
  if (actionLower.includes('delivered') || actionLower.includes('completed')) {
    return { icon: CheckCircle, color: 'emerald', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600', borderColor: 'border-emerald-300' };
  }
  if (actionLower.includes('cancelled') || actionLower.includes('refund')) {
    return { icon: AlertCircle, color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-600', borderColor: 'border-red-300' };
  }
  if (actionLower.includes('updated') || actionLower.includes('modified')) {
    return { icon: History, color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-600', borderColor: 'border-orange-300' };
  }
  
  // Default
  return { icon: Clock, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-600', borderColor: 'border-gray-300' };
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-AU', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }),
    time: date.toLocaleTimeString('en-AU', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }),
  };
};

const OrderLogsTab: React.FC<OrderLogsTabProps> = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-500 font-medium">No activity logs available</p>
        <p className="text-sm text-gray-400 mt-1">Order activity will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <History className="text-indigo-600" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Activity Timeline</h3>
          <p className="text-sm text-gray-500">{logs.length} event{logs.length !== 1 ? 's' : ''} recorded</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Log Items */}
        <div className="space-y-4">
          {logs.map((log, index) => {
            const config = getActionConfig(log.action);
            const Icon = config.icon;
            const { date, time } = formatDateTime(log.created_at);

            return (
              <div 
                key={log.id} 
                className="relative flex gap-4 pl-0"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Icon */}
                <div className={`
                  relative z-10 flex-shrink-0 w-12 h-12 rounded-full 
                  ${config.bgColor} border-2 ${config.borderColor}
                  flex items-center justify-center shadow-sm
                `}>
                  <Icon size={20} className={config.textColor} />
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Action Title */}
                      <h4 className="font-semibold text-gray-900">{log.action}</h4>
                      
                      {/* Details */}
                      <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                      
                      {/* User Info */}
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <UserCircle size={14} />
                        <span>User ID: {log.user_id}</span>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-gray-700">{date}</p>
                      <p className="text-xs text-gray-400">{time}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderLogsTab;