/* FILE: src/pages/client/projects/ProjectDetails.tsx */
// src/pages/client/projects/ProjectDetails.tsx
import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  ShoppingCart,
  Package,
  MapPin,
  User,
  Phone,
  FileText,
  TrendingUp,
  Loader2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import DashboardLayout from '../../../components/layout/DashboardLayout';
import { projectsAPI } from '../../../api/handlers/projects.api';
import type { ProjectDetailsResponse } from '../../../api/handlers/projects.api';
import { clientMenuItems } from '../../../utils/menuItems';

// Helper to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Helper to get order status badge color
const getOrderStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'Payment Requested': 'bg-amber-50 text-amber-700 border-amber-200',
    'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200',
    'Supplier Missing': 'bg-orange-50 text-orange-700 border-orange-200',
    'Supplier Assigned': 'bg-blue-50 text-blue-700 border-blue-200',
    'Requested': 'bg-violet-50 text-violet-700 border-violet-200',
    'Confirmed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'On Hold': 'bg-slate-50 text-slate-700 border-slate-200',
    'In Transit': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };
  return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
};

// Helper to get payment status badge color
const getPaymentStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'Paid': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Failed': 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
};

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState({
    quantity: '',
    delivery_date: '',
    delivery_time: '',
    po_number: '',
    delivery_method: 'Other',
    special_notes: '',
  });

  // Filters
  const order_status = searchParams.get('order_status') || '';
  const delivery_date_from = searchParams.get('delivery_date_from') || '';
  const delivery_date_to = searchParams.get('delivery_date_to') || '';

  // Fetch project details
  const { data, isLoading, error } = useQuery<ProjectDetailsResponse>({
    queryKey: ['project-details', id, { order_status, delivery_date_from, delivery_date_to }],
    queryFn: () => projectsAPI.getDetails(Number(id), { order_status, delivery_date_from, delivery_date_to }),
    enabled: !!id,
  });

  // Handle order now click
  const handleOrderNow = (product: any) => {
    setSelectedProduct(product);
    setOrderDetails({
      quantity: '',
      delivery_date: '',
      delivery_time: '',
      po_number: '',
      delivery_method: 'Other',
      special_notes: '',
    });
    setShowOrderModal(true);
  };

  // Handle order submission
  const handleSubmitOrder = async () => {
    if (!orderDetails.quantity || parseFloat(orderDetails.quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (!orderDetails.delivery_date) {
      toast.error('Please select a delivery date');
      return;
    }

    try {
      const payload = {
        project_id: Number(id),
        product_id: selectedProduct.product_id,
        order_item_id: selectedProduct.last_order_item_id, // NEW - Use the last order's pricing
        quantity: parseFloat(orderDetails.quantity),
        delivery_date: orderDetails.delivery_date,
        delivery_time: orderDetails.delivery_time || undefined,
        po_number: orderDetails.po_number || undefined,
        delivery_method: orderDetails.delivery_method,
        special_notes: orderDetails.special_notes || undefined,
      };

      await projectsAPI.reorderFromProject(payload);
      
      toast.success(`Order placed successfully for ${orderDetails.quantity} units of ${selectedProduct?.product_name}`);
      setShowOrderModal(false);
      setSelectedProduct(null);
      
      // Refresh project details
      queryClient.invalidateQueries({ queryKey: ['project-details', id] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout menuItems={clientMenuItems}>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout menuItems={clientMenuItems}>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Failed to load project details</p>
          <button
            onClick={() => navigate('/client/projects')}
            className="text-blue-600 hover:underline"
          >
            Back to Projects
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { project, analytics, orders, project_products } = data;

  return (
    <DashboardLayout menuItems={clientMenuItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/client/projects')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600 mt-1">Project Details & Orders</p>
            </div>
          </div>
        </div>

        {/* Project Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {project.delivery_address && (
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900">{project.delivery_address}</p>
                </div>
              </div>
            )}
            {project.site_contact_name && (
              <div className="flex items-start gap-3">
                <User size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="text-sm font-medium text-gray-900">{project.site_contact_name}</p>
                </div>
              </div>
            )}
            {project.site_contact_phone && (
              <div className="flex items-start gap-3">
                <Phone size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{project.site_contact_phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(project.created_at)}</p>
              </div>
            </div>
          </div>
          {project.site_instructions && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-start gap-3">
                <FileText size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Instructions</p>
                  <p className="text-sm text-gray-700 mt-1">{project.site_instructions}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <ShoppingCart size={20} className="text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Total Orders</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.total_orders}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <DollarSign size={20} className="text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Total Amount</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(analytics.total_order_amount)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-violet-50 rounded-lg">
                <TrendingUp size={20} className="text-violet-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Average Order</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(analytics.avg_order_value)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Package size={20} className="text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Products</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{project_products.length}</p>
          </div>
        </div>

        {/* Order Status Breakdown */}
        {Object.keys(analytics.by_order_status).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Status Breakdown</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(analytics.by_order_status).map(([status, count]) => (
                <span
                  key={status}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getOrderStatusColor(status)}`}
                >
                  {status}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'orders'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Orders ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'products'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Products ({project_products.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'orders' ? (
              // Orders Table
              <div className="overflow-x-auto">
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No orders found for this project</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          PO Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Delivery Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Payment
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Items
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <span className="font-medium text-gray-900">{order.po_number}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-700">{formatDate(order.delivery_date)}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getOrderStatusColor(order.order_status)}`}>
                              {order.order_status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(order.payment_status)}`}>
                              {order.payment_status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {order.items.map((item) => (
                                <div key={item.id} className="text-sm text-gray-700">
                                  {item.product_name} × {item.quantity}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(order.total_price)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              // Products Grid
              <div>
                {project_products.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No products found for this project</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {project_products.map((product) => (
                      <div
                        key={product.product_id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all"
                      >
                        {/* Product Image */}
                        <div className="aspect-video bg-gray-100 flex items-center justify-center">
                          {product.product_image ? (
                            <img
                              src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}storage/${product.product_image}`}
                              alt={product.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package size={48} className="text-gray-300" />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                          <div className="mb-3">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {product.product_name}
                            </h3>
                            <p className="text-xs text-gray-500">{product.product_type}</p>
                          </div>

                          {product.product_specifications && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {product.product_specifications}
                            </p>
                          )}

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Unit Price:</span>
                              <span className="font-semibold text-gray-900">
                                {formatCurrency(product.unit_price)}
                              </span>
                            </div>
                            {product.delivery_cost > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Delivery:</span>
                                <span className="font-semibold text-gray-900">
                                  {formatCurrency(product.delivery_cost)}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                              <span className="text-gray-600">Total Ordered:</span>
                              <span className="font-semibold text-blue-600">
                                {product.total_quantity} units
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Used in {product.orders_count} order{product.orders_count !== 1 ? 's' : ''}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleOrderNow(product)}
                            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                          >
                            Order Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Order Product</h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Product Info */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                {selectedProduct.product_image ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}storage/${selectedProduct.product_image}`}
                    alt={selectedProduct.product_name}
                    className="w-16 h-16 rounded object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center">
                    <Package size={32} className="text-gray-400" />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedProduct.product_name}</h4>
                  <p className="text-sm text-gray-500">{selectedProduct.product_type}</p>
                </div>
              </div>

              {/* Pricing Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Unit Price:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(selectedProduct.unit_price)}
                  </span>
                </div>
                {selectedProduct.delivery_cost > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Delivery Cost:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(selectedProduct.delivery_cost)}
                    </span>
                  </div>
                )}
              </div>

              {/* Order Form */}
              <div className="space-y-4">
                 {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    💡 This order will use the same pricing and supplier as your last order for this product.
                  </p>
                </div>
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={orderDetails.quantity}
                    onChange={(e) => setOrderDetails({ ...orderDetails, quantity: e.target.value })}
                    placeholder="Enter quantity"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Delivery Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Date *
                  </label>
                  <input
                    type="date"
                    value={orderDetails.delivery_date}
                    onChange={(e) => setOrderDetails({ ...orderDetails, delivery_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Delivery Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={orderDetails.delivery_time}
                    onChange={(e) => setOrderDetails({ ...orderDetails, delivery_time: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* PO Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PO Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderDetails.po_number}
                    onChange={(e) => setOrderDetails({ ...orderDetails, po_number: e.target.value })}
                    placeholder="Enter PO number"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Delivery Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Method
                  </label>
                  <select
                    value={orderDetails.delivery_method}
                    onChange={(e) => setOrderDetails({ ...orderDetails, delivery_method: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Other">Other</option>
                    <option value="Tipper">Tipper</option>
                    <option value="Agitator">Agitator</option>
                    <option value="Pump">Pump</option>
                    <option value="Ute">Ute</option>
                  </select>
                </div>

                {/* Special Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Notes (Optional)
                  </label>
                  <textarea
                    value={orderDetails.special_notes}
                    onChange={(e) => setOrderDetails({ ...orderDetails, special_notes: e.target.value })}
                    placeholder="Any special instructions..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Estimated Total */}
              {orderDetails.quantity && parseFloat(orderDetails.quantity) > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Item Cost:</span>
                    <span className="text-lg font-bold text-blue-700">
                      {formatCurrency(selectedProduct.unit_price * parseFloat(orderDetails.quantity))}
                    </span>
                  </div>
                  {selectedProduct.delivery_cost > 0 && (
                    <div className="flex items-center justify-between text-sm text-blue-800">
                      <span>+ Delivery:</span>
                      <span>{formatCurrency(selectedProduct.delivery_cost)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-200">
                    <span className="text-sm font-medium text-blue-900">Estimated Total:</span>
                    <span className="text-xl font-bold text-blue-700">
                      {formatCurrency(
                        (selectedProduct.unit_price * parseFloat(orderDetails.quantity)) + 
                        selectedProduct.delivery_cost
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    * Final price will be calculated with margins and taxes
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowOrderModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOrder}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ProjectDetails;