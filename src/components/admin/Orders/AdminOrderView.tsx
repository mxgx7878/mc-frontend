// FILE PATH: src/pages/admin/Orders/AdminOrderView.tsx

/**
 * Admin Order View Page - IMPROVED
 * Comprehensive order details with professional tabbed interface
 * Updated with consistent color scheme and improved UX
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
        <div className="bg-white rounded-xl border-2 border-red-200 p-8 text-center shadow-lg">
          <AlertCircle className="mx-auto text-red-600 mb-4" size={48} />
          <p className="text-red-600 font-bold text-lg mb-4">
            {(error as Error)?.message || 'Order not found'}
          </p>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-2 font-bold transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Orders
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const order = data.data;

  // Get workflow badge color
  const getWorkflowColor = (workflow: string) => {
    const colorMap: Record<string, string> = {
      'Requested': 'bg-blue-100 text-blue-700 border-blue-300',
      'Supplier Missing': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Supplier Assigned': 'bg-indigo-100 text-indigo-700 border-indigo-300',
      'Payment Requested': 'bg-purple-100 text-purple-700 border-purple-300',
      'On Hold': 'bg-gray-200 text-gray-700 border-gray-400',
      'Delivered': 'bg-green-100 text-green-700 border-green-300',
    };
    return colorMap[workflow] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  // Get payment status badge color
  const getPaymentColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'Pending': 'bg-gray-200 text-gray-700 border-gray-400',
      'Requested': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Paid': 'bg-green-100 text-green-700 border-green-300',
      'Partially Paid': 'bg-indigo-100 text-indigo-700 border-indigo-300',
      'Partial Refunded': 'bg-purple-100 text-purple-700 border-purple-300',
      'Refunded': 'bg-red-100 text-red-700 border-red-300',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  // Tab Configuration with consistent colors
  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Overview',
      icon: FileText,
      activeClass: 'bg-blue-600 text-white border-blue-700 shadow-md',
      inactiveClass: 'text-blue-700 hover:bg-blue-50 border-blue-200',
    },
    {
      id: 'items' as TabType,
      label: 'Items',
      icon: Package,
      badge: order.items.length,
      activeClass: 'bg-purple-600 text-white border-purple-700 shadow-md',
      inactiveClass: 'text-purple-700 hover:bg-purple-50 border-purple-200',
    },
    {
      id: 'costing' as TabType,
      label: 'Costing',
      icon: Calculator,
      activeClass: 'bg-green-600 text-white border-green-700 shadow-md',
      inactiveClass: 'text-green-700 hover:bg-green-50 border-green-200',
    },
    {
      id: 'map' as TabType,
      label: 'Map',
      icon: MapPin,
      activeClass: 'bg-orange-600 text-white border-orange-700 shadow-md',
      inactiveClass: 'text-orange-700 hover:bg-orange-50 border-orange-200',
    },
    {
      id: 'admin' as TabType,
      label: 'Admin Controls',
      icon: Settings,
      activeClass: 'bg-indigo-600 text-white border-indigo-700 shadow-md',
      inactiveClass: 'text-indigo-700 hover:bg-indigo-50 border-indigo-200',
    },
  ];

  return (
    <DashboardLayout menuItems={adminMenuItems}>
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Orders
          </button>
          
          {/* Status Badges */}
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 text-sm font-bold rounded-lg border-2 ${getWorkflowColor(order.workflow)} transition-colors`}>
              {order.workflow}
            </span>
            <span className={`px-4 py-2 text-sm font-bold rounded-lg border-2 ${getPaymentColor(order.payment_status)} transition-colors`}>
              {order.payment_status}
            </span>
          </div>
        </div>

        {/* Order Header Card */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Package size={32} />
                </div>
                <h1 className="text-4xl font-bold">Order #{order.po_number}</h1>
              </div>
              <div className="flex items-center gap-4 text-blue-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="font-medium">{order.client}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="font-medium">{order.project}</span>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-xs text-blue-100 mb-1">Total Items</p>
                <p className="text-2xl font-bold">{order.items.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-xs text-blue-100 mb-1">Total Value</p>
                <p className="text-2xl font-bold">
                  ${(order.total_price || order.customer_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-2 shadow-sm">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all border-2 whitespace-nowrap
                    ${isActive ? tab.activeClass : tab.inactiveClass}
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
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm min-h-[400px]">
          {activeTab === 'overview' && <OrderOverviewTab order={order} />}
          {activeTab === 'items' && (
            <OrderItemsTab items={order.items} workflow={order.workflow} orderId={order.id} paymentStatus={order.payment_status} />
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
