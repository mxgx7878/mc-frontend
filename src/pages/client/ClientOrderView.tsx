// FILE PATH: src/pages/client/ClientOrderView.tsx

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
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useClientOrderDetail, useRepeatOrder } from '../../features/clientOrders/hooks';
import DashboardLayout from '../../components/layout/DashboardLayout';
import RepeatOrderModal from '../../components/client/RepeatOrderModal';
import StripePayment from '../../components/client/StripePayment';
import { clientMenuItems } from '../../utils/menuItems';

const ClientOrderView = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useClientOrderDetail(Number(orderId));
  const repeatOrderMutation = useRepeatOrder();
  const [repeatOrderModalOpen, setRepeatOrderModalOpen] = useState(false);

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

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

  const getStatusColor = (workflow: string) => {
    const statusColors: Record<string, string> = {
      'Supplier Missing': 'bg-red-100 text-red-800 border-red-200',
      'Supplier Assigned': 'bg-blue-100 text-blue-800 border-blue-200',
      'Payment Requested': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Delivered': 'bg-green-100 text-green-800 border-green-200',
      'On Hold': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return statusColors[workflow] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    const colors: Record<string, string> = {
      'Pending': 'bg-gray-100 text-gray-700 border-gray-300',
      'Paid': 'bg-green-100 text-green-700 border-green-300',
      'Partially Paid': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Failed': 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[paymentStatus] || 'bg-gray-100 text-gray-700 border-gray-300';
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

  const handleRepeatOrderSubmit = async (items: any[]) => {
    if (!orderId) return;

    try {
      await repeatOrderMutation.mutateAsync({
        orderId: Number(orderId),
        payload: { items },
      });
      toast.success('Order repeated successfully!');
      setRepeatOrderModalOpen(false);
      navigate('/client/orders');
    } catch (error: any) {
      toast.error(error.message || 'Failed to repeat order');
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
  const showPayment =
    order.workflow === 'Payment Requested' &&
    (order.payment_status === 'Pending' || order.payment_status === 'Partially Paid');

  return (
    <DashboardLayout menuItems={clientMenuItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/client/orders')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.po_number}</h1>
                {order.repeat_order && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full border border-purple-300">
                    Repeat Order
                  </span>
                )}
              </div>
              {order.order_info && (
                <div className="flex items-center gap-2 mt-1">
                  <Info className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-blue-600">{order.order_info}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleRepeatOrder}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Order Status
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 block mb-1">Current Status</span>
                <span
                  className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold border-2 ${getStatusColor(
                    order.workflow
                  )}`}
                >
                  {order.workflow}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600 block mb-1">Payment Status</span>
                <span
                  className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold border-2 ${getPaymentStatusColor(
                    order.payment_status
                  )}`}
                >
                  {order.payment_status}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600 block mb-1">Order Date</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(order.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Project Details Card */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Project Details
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 block mb-1">Project Name</span>
                <span className="text-sm font-medium text-gray-900">{order.project?.name || '-'}</span>
              </div>
              {order.project?.site_contact_name && (
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Site Contact</span>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {order.project.site_contact_name}
                    </span>
                  </div>
                </div>
              )}
              {order.project?.site_contact_phone && (
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Phone</span>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {order.project.site_contact_phone}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Delivery Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600 block mb-1">Delivery Address</span>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="text-sm font-medium text-gray-900">{order.delivery_address}</span>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-600 block mb-1">Delivery Date & Time</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {formatDateTime(order.delivery_date, order.delivery_time)}
                </span>
              </div>
            </div>
            {order.delivery_method && (
              <div>
                <span className="text-sm text-gray-600 block mb-1">Delivery Method</span>
                <span className="text-sm font-medium text-gray-900">{order.delivery_method}</span>
              </div>
            )}
          </div>
          {order.project?.site_instructions && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600 block mb-2">Site Instructions</span>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {order.project.site_instructions}
              </p>
            </div>
          )}
          {order.reason && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600 block mb-2">Special Notes</span>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{order.reason}</p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Items ({items?.length || 0})
          </h2>
          <div className="space-y-4">
            {items && items.length > 0 ? (
              items.map((item: any, index: number) => {
                const displayPrice = item.is_quoted === 1 && item.quoted_price
                  ? parseFloat(item.quoted_price) || 0
                  : parseFloat(item.supplier_unit_cost || 0) || 0;

                const itemTotal = displayPrice * (parseInt(item.quantity || 0) || 0);

                return (
                  <div
                    key={index}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.product?.product_name || 'Product'}
                        </h3>
                        {item.supplier && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {item.supplier_confirms === 1 && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-300">
                                Confirmed
                              </span>
                            )}
                            {item.supplier_confirms === 0 && (
                              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full border border-yellow-300">
                                Pending
                              </span>
                            )}
                          </div>
                        )}
                        {!item.supplier && (
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>--</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">Quantity</div>
                        <div className="text-lg font-bold text-gray-900">{item.quantity}</div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.is_quoted === 1 ? 'Quoted Price:' : 'Unit Price:'}
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(displayPrice)}
                          {item.is_quoted === 1 && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded border border-blue-300">
                              Custom Quote
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-gray-700">Item Total:</span>
                        <span className="text-gray-900">{formatCurrency(itemTotal)}</span>
                      </div>
                      {item.supplier_discount && parseFloat(item.supplier_discount) > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount Applied:</span>
                          <span>-{formatCurrency(item.supplier_discount)}</span>
                        </div>
                      )}
                      {item.delivery_type && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Delivery Type:</span>
                          <span className="font-medium">{item.delivery_type}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">No items found</div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        {(order.workflow === 'Payment Requested' || order.workflow === 'Delivered') && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Order Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items Cost:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(order.customer_item_cost || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Cost:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(order.customer_delivery_cost || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">GST (10%):</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(order.gst_tax || 0)}
                </span>
              </div>
              {order.discount && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span className="font-medium">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.other_charges && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Other Charges:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(order.other_charges)}
                  </span>
                </div>
              )}
              <div className="border-t-2 border-blue-300 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(order.total_price || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Repeat Order Modal */}
        <RepeatOrderModal
          isOpen={repeatOrderModalOpen}
          onClose={() => setRepeatOrderModalOpen(false)}
          order={order && items ? { ...order, items } : null}
          onSubmit={handleRepeatOrderSubmit}
          isSubmitting={repeatOrderMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
};

export default ClientOrderView;