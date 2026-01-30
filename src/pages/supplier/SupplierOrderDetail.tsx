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
  ChevronDown,
  ChevronUp,
  UserCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useSupplierOrderDetail } from '../../features/supplierOrders/hooks';
import DashboardLayout from '../../components/layout/DashboardLayout';
import OrderItemEditModal from '../../components/supplier/OrderItemEditModal';
import { supplierMenuItems } from '../../utils/menuItems';
import type { SupplierOrderItem } from '../../api/handlers/supplierOrders.api';

const SupplierOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const orderIdNumber = id ? parseInt(id, 10) : undefined;
  
  const { data, isLoading, refetch, error } = useSupplierOrderDetail(orderIdNumber);
  const [editingItem, setEditingItem] = useState<SupplierOrderItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

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

  const toggleItemExpansion = (itemId: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
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

  const formatTime = (timeString: string) => {
    if (!timeString) return '-';
    try {
      // Handle both full datetime and time-only strings
      const time = timeString.includes('T') 
        ? format(new Date(timeString), 'hh:mm a')
        : timeString;
      return time;
    } catch {
      return timeString;
    }
  };

  const calculateItemTotal = (item: SupplierOrderItem) => {
    const unitCost = parseFloat(item.supplier_unit_cost);
    const quantity = parseFloat(item.quantity);
    const discount = parseFloat(item.supplier_discount);
    const deliveryCost = parseFloat(item.delivery_cost);
    return (unitCost * quantity) - discount + deliveryCost;
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
                    <p className="text-sm font-medium text-gray-700">Primary Delivery Date</p>
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
                {order.load_size && (
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Load Size</p>
                      <p className="text-gray-900">{order.load_size}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Contact Person Information */}
              {(order.contact_person_name || order.contact_person_number) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-blue-600" />
                    Site Contact Person
                  </h3>
                  <div className="space-y-2">
                    {order.contact_person_name && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-900">{order.contact_person_name}</p>
                      </div>
                    )}
                    {order.contact_person_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a 
                          href={`tel:${order.contact_person_number}`}
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {order.contact_person_number}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {order.special_notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Special Notes</p>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                    {order.special_notes}
                  </p>
                </div>
              )}
            </div>

            {/* Your Items with Delivery Schedules */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Your Items ({supplier_items.length})
              </h2>
              <div className="space-y-4">
                {supplier_items.map((item) => {
                  const isExpanded = expandedItems.has(item.id);
                  const hasDeliveries = item.deliveries && item.deliveries.length > 0;

                  return (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Item Header */}
                      <div className="p-4 bg-gray-50">
                        <div className="flex items-start gap-4">
                          {item.product?.photo && (
                            <img
                              src={`${import.meta.env.VITE_IMG_URL}${item.product.photo}`}
                              alt={item.product.product_name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900">{item.product?.product_name}</h3>
                                <p className="text-sm text-gray-600">
                                  Total Quantity: {item.quantity} {item.product?.unit_of_measure}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {item.supplier_confirms ? (
                                  <span className="flex items-center gap-1 text-green-600 text-sm font-semibold px-3 py-1 bg-green-100 rounded-full border-2 border-green-300">
                                    <CheckCircle className="w-4 h-4" />
                                    Confirmed
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-orange-600 text-sm font-semibold px-3 py-1 bg-orange-100 rounded-full border-2 border-orange-300">
                                    <XCircle className="w-4 h-4" />
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Item Details Grid */}
                            <div className="mt-3 grid grid-cols-2 gap-4 text-sm bg-white rounded-lg p-3 border border-gray-200">
                              <div>
                                <p className="text-gray-600">Unit Cost</p>
                                <p className="font-medium text-gray-900">{formatCurrency(parseFloat(item.supplier_unit_cost))}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Delivery Cost</p>
                                <p className="font-medium text-gray-900">{formatCurrency(parseFloat(item.delivery_cost))}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Discount</p>
                                <p className="font-medium text-gray-900">{formatCurrency(parseFloat(item.supplier_discount))}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Delivery Type</p>
                                <p className="font-medium text-gray-900">{item.delivery_type || '--'}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-gray-600">Item Total</p>
                                <p className="font-bold text-blue-600 text-lg">{formatCurrency(calculateItemTotal(item))}</p>
                              </div>
                            </div>

                            {item.supplier_notes && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Notes:</span> {item.supplier_notes}
                                </p>
                              </div>
                            )}

                            {/* Delivery Schedule Toggle */}
                            {hasDeliveries && (
                              <button
                                onClick={() => toggleItemExpansion(item.id)}
                                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium border border-blue-200"
                              >
                                <Truck className="w-4 h-4" />
                                <span>
                                  {isExpanded ? 'Hide' : 'Show'} Delivery Schedule 
                                  ({item.deliveries?.length} {item.deliveries?.length === 1 ? 'delivery' : 'deliveries'})
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            )}

                            {/* Action Button */}
                            <div className="mt-4">
                              {!item.supplier_confirms ? (
                                <button
                                  onClick={() => handleEditItem(item)}
                                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit & Confirm Item
                                </button>
                              ) : (
                                <div className="text-sm text-gray-500 italic">
                                  This item has been confirmed and cannot be edited
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Schedule Details - Expandable */}
                      {hasDeliveries && isExpanded && (
                        <div className="bg-blue-50 border-t-2 border-blue-200 p-4">
                          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            Delivery Schedule Breakdown
                          </h4>
                          <div className="space-y-3">
                            {item.deliveries?.map((delivery: any, deliveryIndex: number) => (
                              <div
                                key={delivery.id}
                                className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-300 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded border border-blue-300">
                                        Delivery #{deliveryIndex + 1}
                                      </span>
                                      {item.supplier_confirms ? (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-300 flex items-center gap-1">
                                          <CheckCircle className="w-3 h-3" />
                                          Confirmed
                                        </span>
                                      ) : (
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-300 flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          Awaiting Confirmation
                                        </span>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                                      <div>
                                        <span className="text-xs text-gray-600 block mb-1">Quantity</span>
                                        <span className="text-sm font-bold text-gray-900">
                                          {delivery.quantity} {item.product?.unit_of_measure || 'units'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-xs text-gray-600 block mb-1">Delivery Date</span>
                                        <div className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3 text-gray-500" />
                                          <span className="text-sm font-bold text-gray-900">
                                            {formatDate(delivery.delivery_date)}
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-xs text-gray-600 block mb-1">Delivery Time</span>
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-gray-500" />
                                          <span className="text-sm font-bold text-gray-900">
                                            {formatTime(delivery.delivery_time)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Delivery Summary */}
                          <div className="mt-4 pt-4 border-t border-blue-200 bg-blue-100 rounded-lg p-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium text-gray-700">Total Deliveries:</span>
                              <span className="font-bold text-gray-900">{item.deliveries?.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-1">
                              <span className="font-medium text-gray-700">Total Quantity:</span>
                              <span className="font-bold text-gray-900">
                                {item.quantity} {item.product?.unit_of_measure || 'units'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-1">
                              <span className="font-medium text-gray-700">Confirmed Deliveries:</span>
                              <span className="font-bold text-green-700">
                                {item.supplier_confirms? item.deliveries?.length: 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                  <a 
                    href={`mailto:${order.client?.email}`}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {order.client?.email || 'N/A'}
                  </a>
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
                    <a 
                      href={`tel:${order.project.site_contact_phone}`}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {order.project.site_contact_phone}
                    </a>
                  </div>
                )}
                {order.project?.site_instructions && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Site Instructions</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                      {order.project.site_instructions}
                    </p>
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