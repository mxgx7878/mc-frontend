// FILE PATH: src/pages/admin/Orders/AdminOrderView.tsx

/**
 * Admin Order View Page
 * Comprehensive order details with tabbed interface
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Package,
  Calculator,
  MapPin,
  Settings,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import OrderOverviewTab from '../../../components/admin/Orders/OrderOverviewTab';
import OrderItemsTab from '../../../components/admin/Orders/OrderItemsTab';
import OrderCostingTab from '../../../components/admin/Orders/OrderCostingTab';
import OrderMapTab from '../../../components/admin/Orders/OrderMapTab';
import OrderAdminUpdateTab from '../../../components/admin/Orders/OrderAdminUpdateTab';
import { useAdminOrderDetail } from '../../../features/adminOrders/hooks';
import { adminMenuItems } from '../../../utils/menuItems';
import {
  getWorkflowBadgeClass,
  getPaymentBadgeClass,
} from '../../../features/adminOrders/utils';

type TabType = 'overview' | 'items' | 'costing' | 'map' | 'admin';

const AdminOrderView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { data, isLoading, error } = useAdminOrderDetail(parseInt(id || '0'));

  // Loading State
  if (isLoading) {
    return (
      <DashboardLayout menuItems={adminMenuItems}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
            <p className="text-gray-600 font-medium">Loading order details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error State
  if (error || !data?.data) {
    return (
      <DashboardLayout menuItems={adminMenuItems}>
        <div className="bg-white rounded-xl border-2 border-red-200 p-8 text-center">
          <AlertCircle className="mx-auto text-red-600 mb-4" size={48} />
          <p className="text-red-600 font-bold text-lg mb-4">
            {(error as Error)?.message || 'Order not found'}
          </p>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-2 font-bold"
          >
            <ArrowLeft size={18} />
            Back to Orders
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const order = data.data;

  // Tab Configuration
  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Overview',
      icon: FileText,
      color: 'blue',
    },
    {
      id: 'items' as TabType,
      label: 'Items',
      icon: Package,
      color: 'purple',
      badge: order.items.length,
    },
    {
      id: 'costing' as TabType,
      label: 'Costing & Calculations',
      icon: Calculator,
      color: 'green',
    },
    {
      id: 'map' as TabType,
      label: 'Map',
      icon: MapPin,
      color: 'orange',
    },
    {
      id: 'admin' as TabType,
      label: 'Admin Controls',
      icon: Settings,
      color: 'red',
    },
  ];

  const tabColorClasses: Record<string, { active: string; inactive: string }> = {
    blue: {
      active: 'bg-blue-600 text-white border-blue-700',
      inactive: 'text-blue-700 hover:bg-blue-50 border-blue-200',
    },
    purple: {
      active: 'bg-purple-600 text-white border-purple-700',
      inactive: 'text-purple-700 hover:bg-purple-50 border-purple-200',
    },
    green: {
      active: 'bg-green-600 text-white border-green-700',
      inactive: 'text-green-700 hover:bg-green-50 border-green-200',
    },
    orange: {
      active: 'bg-orange-600 text-white border-orange-700',
      inactive: 'text-orange-700 hover:bg-orange-50 border-orange-200',
    },
    red: {
      active: 'bg-red-600 text-white border-red-700',
      inactive: 'text-red-700 hover:bg-red-50 border-red-200',
    },
  };

  return (
    <DashboardLayout menuItems={adminMenuItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            Back to Orders
          </button>
          <div className="flex items-center gap-2">
            <span
              className={`px-4 py-2 text-sm font-bold rounded-lg border-2 ${getWorkflowBadgeClass(
                order.workflow
              )}`}
            >
              {order.workflow}
            </span>
            <span
              className={`px-4 py-2 text-sm font-bold rounded-lg border-2 ${getPaymentBadgeClass(
                order.payment_status
              )}`}
            >
              {order.payment_status}
            </span>
          </div>
        </div>

        {/* Order Header Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Order #{order.po_number}</h1>
              <div className="flex items-center gap-4 text-blue-100">
                <span className="font-medium">{order.client}</span>
                <span>•</span>
                <span className="font-medium">{order.project}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-2 shadow-sm overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const colors = tabColorClasses[tab.color];

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all border-2
                    ${isActive ? colors.active : colors.inactive}
                  `}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`
                        px-2 py-0.5 rounded-full text-xs font-bold
                        ${isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-700'}
                      `}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          {activeTab === 'overview' && <OrderOverviewTab order={order} />}
          {activeTab === 'items' && (
            <OrderItemsTab items={order.items} workflow={order.workflow} orderId={order.id} />
          )}
          {activeTab === 'costing' && <OrderCostingTab order={order} />}
          {activeTab === 'map' && (
            <OrderMapTab
              deliveryLat={order.delivery_lat}
              deliveryLong={order.delivery_long}
              items={order.items}
            />
          )}
          {activeTab === 'admin' && <OrderAdminUpdateTab order={order} />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrderView;