// FILE PATH: src/pages/admin/Orders/AdminOrderView.tsx

/**
 * Admin Order View Page
 * Detailed view of a single order with map, items, costing, and update form
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Truck, FileText, Loader2 } from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import OrderItemsSection from '../../../components/admin/Orders/OrderItemsSection';
import OrderCostingCard from '../../../components/admin/Orders/OrderCostingCard';
import OrderMapTab from '../../../components/admin/Orders/OrderMapTab';
import OrderUpdateForm from '../../../components/admin/Orders/OrderUpdateForm';
import { useAdminOrderDetail } from '../../../features/adminOrders/hooks';
import { adminMenuItems } from '../../../utils/menuItems';
import {
  getWorkflowBadgeClass,
  getPaymentBadgeClass,
  formatDate,
} from '../../../features/adminOrders/utils';

const AdminOrderView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'details' | 'map'>('details');

  const { data, isLoading, error } = useAdminOrderDetail(parseInt(id || '0'));

  if (isLoading) {
    return (
      <DashboardLayout menuItems={adminMenuItems}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data?.data) {
    return (
      <DashboardLayout menuItems={adminMenuItems}>
        <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
          <p className="text-red-600 mb-4">{(error as Error)?.message || 'Order not found'}</p>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Back to Orders
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const order = data.data;

  return (
    <DashboardLayout menuItems={adminMenuItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Orders
          </button>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 text-sm font-semibold rounded-full ${getWorkflowBadgeClass(
                order.workflow
              )}`}
            >
              {order.workflow}
            </span>
            <span
              className={`px-3 py-1.5 text-sm font-semibold rounded-full ${getPaymentBadgeClass(
                order.payment_status
              )}`}
            >
              {order.payment_status}
            </span>
          </div>
        </div>

        {/* Order Header Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order #{order.po_number}
              </h1>
              <p className="text-gray-600 mt-1">Order details and management</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Info & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Client</p>
                    <p className="font-semibold text-gray-900">{order.client}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <FileText className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Project</p>
                    <p className="font-semibold text-gray-900">{order.project}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <MapPin className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Address</p>
                    <p className="font-semibold text-gray-900">{order.delivery_address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Calendar className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Date & Time</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(order.delivery_date)} at {order.delivery_time}
                    </p>
                  </div>
                </div>

                {order.delivery_method && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-50 rounded-lg">
                      <Truck className="text-yellow-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Delivery Method</p>
                      <p className="font-semibold text-gray-900">{order.delivery_method}</p>
                    </div>
                  </div>
                )}
              </div>

              {order.special_notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Special Notes</p>
                  <p className="text-gray-900 bg-gray-50 rounded-lg p-3">{order.special_notes}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <OrderItemsSection items={order.items} workflow={order.workflow} />

            {/* Order Costing */}
            <OrderCostingCard order={order} />
          </div>

          {/* Right Column - Tabs & Update Form */}
          <div className="space-y-6">
            {/* Tabs Card */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Tab Headers */}
              <div className="border-b border-gray-200 flex">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'details'
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'map'
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Map
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'details' ? (
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600">Order ID</p>
                      <p className="font-semibold text-gray-900">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">PO Number</p>
                      <p className="font-semibold text-gray-900">{order.po_number}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Workflow Status</p>
                      <span
                        className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${getWorkflowBadgeClass(
                          order.workflow
                        )}`}
                      >
                        {order.workflow}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-600">Payment Status</p>
                      <span
                        className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${getPaymentBadgeClass(
                          order.payment_status
                        )}`}
                      >
                        {order.payment_status}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-600">Items Count</p>
                      <p className="font-semibold text-gray-900">{order.items.length}</p>
                    </div>
                  </div>
                ) : (
                  <OrderMapTab
                    deliveryLat={order.delivery_lat}
                    deliveryLong={order.delivery_long}
                    items={order.items}
                  />
                )}
              </div>
            </div>

            {/* Update Form */}
            <OrderUpdateForm order={order} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrderView;