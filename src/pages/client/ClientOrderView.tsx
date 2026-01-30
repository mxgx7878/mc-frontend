// src/pages/client/ClientOrderView.tsx
// Updated with split delivery schedules display

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Truck,
  Package,
  RefreshCw,
  RotateCcw,
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
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  useClientOrderDetail, 
  useRepeatOrder, 
  useCancelOrder,
  canCancelOrder 
} from '../../features/clientOrders/hooks';
import DashboardLayout from '../../components/layout/DashboardLayout';
import RepeatOrderModal from '../../components/client/RepeatOrderModal';
import StripePayment from '../../components/client/StripePayment';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { clientMenuItems } from '../../utils/menuItems';

const ClientOrderView = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useClientOrderDetail(Number(orderId));
  const repeatOrderMutation = useRepeatOrder();
  const cancelOrderMutation = useCancelOrder();
  
  const [repeatOrderModalOpen, setRepeatOrderModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

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

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

  const getOrderStatusColor = (orderStatus: string) => {
    const statusColors: Record<string, string> = {
      'Draft': 'bg-gray-100 text-gray-800 border-gray-300',
      'Confirmed': 'bg-blue-100 text-blue-800 border-blue-300',
      'Scheduled': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'In Transit': 'bg-purple-100 text-purple-800 border-purple-300',
      'Delivered': 'bg-green-100 text-green-800 border-green-300',
      'Completed': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'Cancelled': 'bg-red-100 text-red-800 border-red-300',
    };
    return statusColors[orderStatus] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    const colors: Record<string, string> = {
      'Unpaid': 'bg-red-100 text-red-800 border-red-300',
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Paid': 'bg-green-100 text-green-800 border-green-300',
      'Partially Paid': 'bg-orange-100 text-orange-800 border-orange-300',
      'Failed': 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[paymentStatus] || 'bg-gray-100 text-gray-800 border-gray-300';
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

  const handleRefresh = () => {
    refetch();
    toast.success('Order refreshed');
  };

  const handleRepeatOrder = () => {
    if (data?.data) {
      setRepeatOrderModalOpen(true);
    }
  };

  const handleRepeatOrderSubmit = async (payload: { delivery_date: string; items: any[] }) => {
    if (!orderId) return;

    try {
      await repeatOrderMutation.mutateAsync({
        orderId: Number(orderId),
        payload: payload,
      });
      toast.success('Order repeated successfully!');
      setRepeatOrderModalOpen(false);
      navigate('/client/orders');
    } catch (error: any) {
      toast.error(error.message || 'Failed to repeat order');
    }
  };

  const handleCancelClick = () => {
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!orderId) return;

    try {
      await cancelOrderMutation.mutateAsync(Number(orderId));
      setCancelModalOpen(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleCancelModalClose = () => {
    if (!cancelOrderMutation.isPending) {
      setCancelModalOpen(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment completed successfully!');
    refetch();
  };

  if (isLoading) {
    return (
      <DashboardLayout menuItems={clientMenuItems}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data?.data) {
    return (
      <DashboardLayout menuItems={clientMenuItems}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h2>
            <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/client/orders')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
  // console.log(showPayment, order.workflow);
  const showCancelButton = canCancelOrder(order.order_status);

  return (
    <DashboardLayout menuItems={clientMenuItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/client/orders')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.po_number}</h1>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full border-2 ${getOrderStatusColor(
                    order.order_status
                  )}`}
                >
                  {order.order_status}
                </span>
                {order.repeat_order && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full border-2 border-purple-300 flex items-center gap-1">
                    <RefreshCw size={14} />
                    Repeat Order
                  </span>
                )}
              </div>
              {order.order_info && (
                <div className="flex items-center gap-2 mt-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-blue-600 font-medium">{order.order_info}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            
            {showCancelButton && (
              <button
                onClick={handleCancelClick}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors font-medium"
              >
                <XCircle className="w-4 h-4" />
                Cancel Order
              </button>
            )}
            
            <button
              onClick={handleRepeatOrder}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              Repeat Order
            </button>
          </div>
        </div>

        {/* Payment Section */}
        {showPayment && order.total_price && (
          <StripePayment
            orderId={Number(orderId)}
            totalAmount={Number(order.total_price) || 0}
            onSuccess={handlePaymentSuccess}
          />
        )}

        {/* Status & Basic Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Status Card */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Order Status
            </h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600 block mb-2">Current Status</span>
                <span
                  className={`inline-flex px-4 py-2 rounded-full text-sm font-bold border-2 ${getOrderStatusColor(
                    order.order_status
                  )}`}
                >
                  {order.order_status}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600 block mb-2">Payment Status</span>
                <span
                  className={`inline-flex px-4 py-2 rounded-full text-sm font-bold border-2 ${getPaymentStatusColor(
                    order.payment_status
                  )}`}
                >
                  {order.payment_status}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600 block mb-2">Order Date</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatDate(order.created_at)}
                </span>
              </div>
              {order.updated_at && order.updated_at !== order.created_at && (
                <div>
                  <span className="text-sm text-gray-600 block mb-2">Last Updated</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatDate(order.updated_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Project Details Card */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Project Details
            </h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600 block mb-2">Project Name</span>
                <span className="text-sm font-semibold text-gray-900">{order.project?.name || '-'}</span>
              </div>
              {order.project?.site_contact_name && (
                <div>
                  <span className="text-sm text-gray-600 block mb-2">Site Contact</span>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">
                      {order.project.site_contact_name}
                    </span>
                  </div>
                </div>
              )}
              {order.project?.site_contact_phone && (
                <div>
                  <span className="text-sm text-gray-600 block mb-2">Phone</span>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">
                      {order.project.site_contact_phone}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Delivery Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600 block mb-2">Delivery Address</span>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
                <span className="text-sm font-semibold text-gray-900">{order.delivery_address}</span>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-600 block mb-2">Primary Delivery Date & Time</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">
                  {formatDateTime(order.delivery_date, order.delivery_time)}
                </span>
              </div>
            </div>
            {order.delivery_method && (
              <div>
                <span className="text-sm text-gray-600 block mb-2">Delivery Method</span>
                <span className="text-sm font-semibold text-gray-900 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
                  {order.delivery_method}
                </span>
              </div>
            )}
          </div>
          {order.project?.site_instructions && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600 block mb-2">Site Instructions</span>
              <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                {order.project.site_instructions}
              </p>
            </div>
          )}
          {order.reason && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600 block mb-2">Special Notes</span>
              <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{order.reason}</p>
            </div>
          )}
          {(order.contact_person_name && order.contact_person_number) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600 block mb-2">Contact Person</span>
              <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                {order.contact_person_name} - {order.contact_person_number}
              </p>
            </div>
          )}
        </div>

        {/* Order Items with Delivery Schedules */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Order Items ({items?.length || 0})
          </h2>
          <div className="space-y-4">
            {items && items.length > 0 ? (
              items.map((item: any, index: number) => {
                const displayPrice = item.is_quoted === 1 && item.quoted_price
                  ? parseFloat(item.quoted_price) || 0
                  : parseFloat(item.supplier_unit_cost || 0) || 0;

                const itemTotal = displayPrice * (parseFloat(item.quantity || 0) || 0);
                const isExpanded = expandedItems.has(item.id);
                const hasDeliveries = item.deliveries && item.deliveries.length > 0;

                return (
                  <div
                    key={index}
                    className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors"
                  >
                    {/* Item Header */}
                    <div className="bg-gray-50 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-2">
                            {item.product?.product_name || 'Product'}
                          </h3>
                          {item.product?.specifications && (
                            <p className="text-xs text-gray-600 mb-2">{item.product.specifications}</p>
                          )}
                          {item.supplier && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="font-medium text-gray-700">
                                Supplier: {item.supplier.company_name}
                              </span>
                              {item.supplier_confirms === 1 && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border-2 border-green-300 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Confirmed
                                </span>
                              )}
                              {item.supplier_confirms === 0 && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border-2 border-yellow-300 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Pending
                                </span>
                              )}
                            </div>
                          )}
                          {!item.supplier && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle className="w-4 h-4" />
                              <span className="font-medium">Awaiting for confirmation</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right bg-white rounded-lg p-3 border-2 border-gray-200">
                          <div className="text-xs text-gray-600 mb-1">Total Quantity</div>
                          <div className="text-xl font-bold text-gray-900">{item.quantity}</div>
                          <div className="text-xs text-gray-500 mt-1">{item.product?.unit_of_measure || 'units'}</div>
                        </div>
                      </div>

                      {/* Pricing Summary */}
                      <div className="border-t border-gray-300 pt-3 space-y-2 bg-white rounded-lg p-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 font-medium">
                            {item.is_quoted === 1 ? 'Quoted Price:' : 'Unit Price:'}
                          </span>
                          <span className="font-bold text-gray-900">
                            {formatCurrency(displayPrice)}
                            {item.is_quoted === 1 && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded border-2 border-blue-300">
                                Custom Quote
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-base font-bold border-t pt-2">
                          <span className="text-gray-700">Item Total:</span>
                          <span className="text-blue-600">{formatCurrency(itemTotal)}</span>
                        </div>
                        {item.supplier_discount && parseFloat(item.supplier_discount) > 0 && (
                          <div className="flex justify-between text-sm text-green-600 font-semibold">
                            <span>Discount Applied:</span>
                            <span>-{formatCurrency(item.supplier_discount)}</span>
                          </div>
                        )}
                        {item.delivery_type && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Delivery Type:</span>
                            <span className="font-semibold">{item.delivery_type}</span>
                          </div>
                        )}
                      </div>

                      {/* Delivery Schedule Toggle Button */}
                      {hasDeliveries && (
                        <button
                          onClick={() => toggleItemExpansion(item.id)}
                          className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium border border-blue-200"
                        >
                          <Truck className="w-4 h-4" />
                          <span>
                            {isExpanded ? 'Hide' : 'Show'} Delivery Schedule 
                            ({item.deliveries.length} {item.deliveries.length === 1 ? 'delivery' : 'deliveries'})
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Delivery Schedule Details - Expandable */}
                    {hasDeliveries && isExpanded && (
                      <div className="bg-blue-50 border-t-2 border-blue-200 p-4">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          Delivery Schedule Breakdown
                        </h4>
                        <div className="space-y-3">
                          {item.deliveries.map((delivery: any, deliveryIndex: number) => (
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
                                    {delivery.supplier_confirms ? (
                                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-300 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Confirmed by Supplier
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-300 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Awaiting Confirmation
                                      </span>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
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
                            <span className="font-bold text-gray-900">{item.deliveries.length}</span>
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
                              {item.deliveries.filter((d: any) => d.supplier_confirms).length} / {item.deliveries.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">No items found</div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        {order.total_price && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-300 p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Order Summary
            </h2>
            <div className="space-y-3 bg-white rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items Cost:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(order.customer_item_cost || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Cost:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(order.customer_delivery_cost || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">GST (10%):</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(order.gst_tax || 0)}
                </span>
              </div>
              {order.discount && parseFloat(order.discount.toString()) > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-semibold">
                  <span>Discount:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.other_charges && parseFloat(order.other_charges.toString()) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Other Charges:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(order.other_charges)}
                  </span>
                </div>
              )}
              <div className="border-t-2 border-blue-300 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                  <span className="text-3xl font-bold text-blue-600">
                    {formatCurrency(order.total_price || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <RepeatOrderModal
          isOpen={repeatOrderModalOpen}
          onClose={() => setRepeatOrderModalOpen(false)}
          order={order && items ? { ...order, items } : null}
          onSubmit={handleRepeatOrderSubmit}
          isSubmitting={repeatOrderMutation.isPending}
        />

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