// ============================================================================
// FILE: src/pages/client/ClientOrderView.tsx - COMPLETE VERSION
// ============================================================================

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
  FileText,
  Info,
  DollarSign,
  User,
  Phone,
  ClipboardList,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useClientOrderDetail, useRepeatOrder } from '../../features/clientOrders/hooks';
import DashboardLayout from '../../components/layout/DashboardLayout';
import RepeatOrderModal from '../../components/client/RepeatOrderModal';
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

  const getStatusColor = (workflow: string) => {
    const statusColors: Record<string, string> = {
      'Supplier Missing': 'bg-red-100 text-red-800 border-red-200',
      'Supplier Assigned': 'bg-blue-100 text-blue-800 border-blue-200',
      'Payment Requested': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Delivered': 'bg-green-100 text-green-800 border-green-200',
    };
    return statusColors[workflow] || 'bg-gray-100 text-gray-800 border-gray-200';
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
                <h1 className="text-3xl font-bold text-gray-900">{order.po_number}</h1>
                {order.repeat_order && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                    Repeat Order
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">Order Details</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRepeatOrder}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Repeat Order
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Order Info Alert */}
        {order.order_info && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Order Information</h3>
              <p className="text-sm text-blue-700">{order.order_info}</p>
            </div>
          </div>
        )}

        {/* Status & Basic Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Status Card */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Order Status
            </h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">Workflow Status</span>
                <div className="mt-2">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold inline-block border-2 ${getStatusColor(order.workflow)}`}>
                    {order.workflow}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <span className="text-sm text-gray-600">Created</span>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {formatDate(order.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Project Information Card */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Project Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm text-gray-600">Project Name</span>
                  <p className="text-sm font-medium text-gray-900">{order.project?.name || '-'}</p>
                </div>
              </div>
              
              {order.project?.site_contact_name && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-600">Site Contact</span>
                    <p className="text-sm font-medium text-gray-900">{order.project.site_contact_name}</p>
                  </div>
                </div>
              )}
              
              {order.project?.site_contact_phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-600">Contact Phone</span>
                    <p className="text-sm font-medium text-gray-900">{order.project.site_contact_phone}</p>
                  </div>
                </div>
              )}
              
              {order.project?.site_instructions && (
                <div className="flex items-start gap-3">
                  <ClipboardList className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-600">Site Instructions</span>
                    <p className="text-sm font-medium text-gray-900">{order.project.site_instructions}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Information Card */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-green-600" />
            Delivery Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm text-gray-600">Delivery Address</span>
                <p className="text-sm font-medium text-gray-900">{order.delivery_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm text-gray-600">Delivery Date & Time</span>
                <p className="text-sm font-medium text-gray-900">
                  {formatDateTime(order.delivery_date, order.delivery_time)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm text-gray-600">Delivery Method</span>
                <p className="text-sm font-medium text-gray-900">{order.delivery_method}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b-2 border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {item.product.photo ? (
                          <img
                            src={`${import.meta.env.VITE_IMG_URL}${item.product.photo}`}
                            alt={item.product.product_name}
                            className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{item.product.product_name}</p>
                          <p className="text-sm text-gray-600">{item.product.product_type}</p>
                          {item.custom_blend_mix && (
                            <p className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded inline-block">
                              {item.custom_blend_mix}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {parseFloat(item.quantity).toFixed(2)} {item.product.unit_of_measure}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        ${parseFloat(item.supplier_unit_cost).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        ${parseFloat(item.supplier_delivery_cost).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-green-600 font-medium">
                        -${parseFloat(item.supplier_discount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">
                        ${(
                          parseFloat(item.quantity) * parseFloat(item.supplier_unit_cost) +
                          parseFloat(item.supplier_delivery_cost) -
                          parseFloat(item.supplier_discount)
                        ).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Summary */}
          <div className="border-t-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white">
            <div className="px-6 py-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
              </div>
              
              <div className="space-y-3 max-w-md ml-auto">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${parseFloat(order.subtotal).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Fuel Levy</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${parseFloat(order.fuel_levy).toFixed(2)}
                  </span>
                </div>
                
                {parseFloat(order.other_charges) > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Other Charges</span>
                    <span className="text-sm font-medium text-gray-900">
                      ${parseFloat(order.other_charges).toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">GST/Tax</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${parseFloat(order.gst_tax).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3 bg-green-50 px-4 rounded-lg border-2 border-green-200">
                  <span className="text-base font-bold text-green-900">Total Amount</span>
                  <span className="text-xl font-bold text-green-600">
                    ${parseFloat(order.total_price).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Repeat Order Modal */}
        <RepeatOrderModal
          isOpen={repeatOrderModalOpen}
          onClose={() => setRepeatOrderModalOpen(false)}
          order={data?.data ? { ...order, items } : null}
          onSubmit={handleRepeatOrderSubmit}
          isSubmitting={repeatOrderMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
};

export default ClientOrderView;