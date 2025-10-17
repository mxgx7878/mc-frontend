// src/pages/supplier/SupplierOrderDetail.tsx

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Truck,
  User,
  Phone,
  Mail,
  Edit,
  CheckCircle,
  XCircle,
  Package,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useSupplierOrderDetail } from '../../features/supplierOrders/hooks';
import DashboardLayout from '../../components/layout/DashboardLayout';
import OrderItemEditModal from '../../components/supplier/OrderItemEditModal';
import { supplierMenuItems } from '../../utils/menuItems';
import type { SupplierOrderItem } from '../../api/handlers/supplierOrders.api';

const SupplierOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  console.log('SupplierOrderDetail - orderId from params:', orderId);
  
  const { data, isLoading, refetch, error } = useSupplierOrderDetail(Number(orderId));
  const [editingItem, setEditingItem] = useState<SupplierOrderItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log('Order detail data:', data);
  console.log('Loading state:', isLoading);
  console.log('Error:', error);

  const handleEditItem = (item: SupplierOrderItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleUpdateSuccess = () => {
    refetch();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      // Handle ISO format with timezone
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy');
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

  const getStatusColor = (workflow: string) => {
    const colors: Record<string, string> = {
      'Requested': 'bg-gray-100 text-gray-800',
      'Supplier Assigned': 'bg-blue-100 text-blue-800',
      'Supplier Missing': 'bg-red-100 text-red-800',
      'Payment Requested': 'bg-yellow-100 text-yellow-800',
      'Paid': 'bg-green-100 text-green-800',
      'In Transit': 'bg-purple-100 text-purple-800',
      'Delivered': 'bg-green-100 text-green-800',
    };
    return colors[workflow] || 'bg-gray-100 text-gray-800';
  };

  const calculateItemTotal = (item: SupplierOrderItem) => {
    const unitCost = parseFloat(item.supplier_unit_cost);
    const quantity = parseFloat(item.quantity);
    const discount = parseFloat(item.supplier_discount);
    return (unitCost * quantity) - discount;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <DashboardLayout menuItems={supplierMenuItems}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data?.data) {
    return (
      <DashboardLayout menuItems={supplierMenuItems}>
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order Not Found</h3>
          {error && (
            <p className="text-red-600 mb-4">{(error as Error).message}</p>
          )}
          <p className="text-gray-600 mb-4">
            Order ID: {orderId} | Data: {JSON.stringify(data)}
          </p>
          <button
            onClick={() => navigate('/supplier/orders')}
            className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { order, supplier_items } = data.data;

  return (
    <DashboardLayout menuItems={supplierMenuItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/supplier/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Orders
          </button>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.workflow)}`}>
            {order.workflow}
          </span>
        </div>

        {/* Order Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order #{order.po_number || order.id}</h1>
              <p className="text-gray-600 mt-1">Order details and your items</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Delivery Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Address</p>
                    <p className="text-gray-900">{order.delivery_address || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Delivery Date</p>
                    <p className="text-gray-900">{formatDateTime(order.delivery_date, order.delivery_time)}</p>
                  </div>
                </div>
                {order.delivery_window && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Delivery Window</p>
                      <p className="text-gray-900">{order.delivery_window}</p>
                    </div>
                  </div>
                )}
                {order.delivery_method && (
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Delivery Method</p>
                      <p className="text-gray-900">{order.delivery_method}</p>
                    </div>
                  </div>
                )}
              </div>
              {order.special_notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Special Notes</p>
                  <p className="text-gray-600 text-sm">{order.special_notes}</p>
                </div>
              )}
            </div>

            {/* Your Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Your Items
              </h2>
              <div className="space-y-4">
                {supplier_items.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {item.product?.photo && (
                        <img
                          src={item.product.photo}
                          alt={item.product.product_name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.product?.product_name}</h3>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity} {item.product?.unit_of_measure}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.supplier_confirms ? (
                              <span className="flex items-center gap-1 text-green-600 text-sm">
                                <CheckCircle className="w-4 h-4" />
                                Confirmed
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-orange-600 text-sm">
                                <XCircle className="w-4 h-4" />
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Unit Cost</p>
                            <p className="font-medium text-gray-900">{formatCurrency(parseFloat(item.supplier_unit_cost))}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Discount</p>
                            <p className="font-medium text-gray-900">{formatCurrency(parseFloat(item.supplier_discount))}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Delivery Date</p>
                            <p className="font-medium text-gray-900">{formatDate(item.supplier_delivery_date)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Item Total</p>
                            <p className="font-bold text-blue-600">{formatCurrency(calculateItemTotal(item))}</p>
                          </div>
                        </div>
                        {item.supplier_notes && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Notes:</span> {item.supplier_notes}
                            </p>
                          </div>
                        )}
                        <div className="mt-4">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Item
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Client & Project Info */}
          <div className="space-y-6">
            {/* Client Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Client Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{order.client?.name || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{order.client?.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Project Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Project Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Project Name</p>
                  <p className="font-medium text-gray-900">{order.project?.name || 'N/A'}</p>
                </div>
                {order.project?.site_contact_name && (
                  <div>
                    <p className="text-sm text-gray-600">Site Contact</p>
                    <p className="text-gray-900">{order.project.site_contact_name}</p>
                  </div>
                )}
                {order.project?.site_contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{order.project.site_contact_phone}</p>
                  </div>
                )}
                {order.project?.site_instructions && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Site Instructions</p>
                    <p className="text-sm text-gray-600">{order.project.site_instructions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <OrderItemEditModal
        item={editingItem}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleUpdateSuccess}
      />
    </DashboardLayout>
  );
};

export default SupplierOrderDetail;