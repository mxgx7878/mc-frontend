// FILE PATH: src/pages/admin/MasterProducts/ViewMasterProduct.tsx

import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  ChevronRight, 
  Edit, 
  Trash2, 
  Loader2, 
  Package, 
  FileText,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

import DashboardLayout from '../../../components/layout/DashboardLayout';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { adminMenuItems } from '../../../utils/menuItems';
import { masterProductsAPI } from '../../../api/handlers/masterProducts.api';

const ViewMasterProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [deleteModal, setDeleteModal] = useState(false);
  const [offerModal, setOfferModal] = useState<{
    isOpen: boolean;
    offerId: number | null;
    action: 'Approved' | 'Rejected' | 'Pending' | null;
    loading: boolean;
  }>({
    isOpen: false,
    offerId: null,
    action: null,
    loading: false,
  });

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: ['masterProduct', id],
    queryFn: () => masterProductsAPI.getById(Number(id)),
    enabled: !!id,
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: () => masterProductsAPI.delete(Number(id)),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      navigate('/admin/master-products');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete product');
    },
  });

  // Approve/Reject offer mutation
  const offerStatusMutation = useMutation({
    mutationFn: ({ offerId, status }: { offerId: number; status: 'Approved' | 'Rejected' | 'Pending' }) =>
      masterProductsAPI.approveRejectOffer(offerId, { status }),
    onSuccess: () => {
      toast.success('Offer status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['masterProduct', id] });
      setOfferModal({ isOpen: false, offerId: null, action: null, loading: false });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update offer status');
      setOfferModal(prev => ({ ...prev, loading: false }));
    },
  });

  const handleOfferAction = (offerId: number, action: 'Approved' | 'Rejected' | 'Pending') => {
    setOfferModal({ isOpen: true, offerId, action, loading: false });
  };

  const confirmOfferAction = () => {
    if (offerModal.offerId && offerModal.action) {
      setOfferModal(prev => ({ ...prev, loading: true }));
      offerStatusMutation.mutate({ 
        offerId: offerModal.offerId, 
        status: offerModal.action 
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'Rejected':
        return <XCircle size={18} className="text-red-500" />;
      default:
        return <Clock size={18} className="text-yellow-500" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout menuItems={adminMenuItems}>
        <div className="flex items-center justify-center h-96">
          <Loader2 size={48} className="animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout menuItems={adminMenuItems}>
        <div className="text-center py-12">
          <p className="text-gray-600">Product not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const baseURL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';

  return (
    <DashboardLayout menuItems={adminMenuItems}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link to="/admin/master-products" className="hover:text-blue-600 transition-colors">
                  Master Products
                </Link>
              </li>
              <li>
                <ChevronRight size={16} />
              </li>
              <li className="text-gray-900 font-medium">{product.product_name}</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.product_name}</h1>
              <p className="text-gray-600 mt-2">Product Details & Supplier Offers</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to={`/admin/master-products/edit/${id}`}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Edit size={18} />
                <span>Edit</span>
              </Link>
              <button
                onClick={() => setDeleteModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Product Details Card */}
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Product Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Product Image */}
              <div className="md:col-span-1">
                {product.photo ? (
                  <img
                    src={`${baseURL}/storage/${product.photo}`}
                    alt={product.product_name}
                    className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package size={64} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Product Type</label>
                    <p className="text-gray-900 mt-1">{product.product_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="text-gray-900 mt-1">{product.category.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Unit of Measure</label>
                    <p className="text-gray-900 mt-1">{product.unit_of_measure}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Approval Status</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.is_approved === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_approved === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Specifications</label>
                  <p className="text-gray-900 mt-1">{product.specifications}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Added By</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <User size={16} className="text-gray-400" />
                      <p className="text-gray-900">{product.added_by.name}</p>
                    </div>
                  </div>
                  {product.approved_by && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Approved By</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <User size={16} className="text-gray-400" />
                        <p className="text-gray-900">{product.approved_by.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {product.tech_doc && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Technical Document</label>
                    <a
                      href={`${baseURL}/storage/${product.tech_doc}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 mt-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <FileText size={18} />
                      <span>View Document</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Supplier Offers Section */}
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Supplier Offers ({product.supplierOffers?.length || 0})
              </h2>
            </div>

            {product.supplierOffers && product.supplierOffers.length > 0 ? (
              <div className="space-y-4">
                {product.supplierOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      {/* Supplier Info */}
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                          {offer.supplier.profile_image ? (
                            <img
                              src={`${baseURL}/${offer.supplier.profile_image}`}
                              alt={offer.supplier.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User size={32} className="text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{offer.supplier.name}</h3>
                          <p className="text-sm text-gray-500">{offer.supplier.email}</p>
                          
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div>
                              <label className="text-xs font-medium text-gray-500">Price</label>
                              <p className="text-lg font-bold text-blue-600">${offer.price}</p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500">Availability</label>
                              <p className="text-sm text-gray-900">{offer.availability_status}</p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500">Status</label>
                              <div className="flex items-center space-x-2 mt-1">
                                {getStatusIcon(offer.status)}
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(offer.status)}`}>
                                  {offer.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Delivery Zones */}
                          {offer.supplier.delivery_zones && offer.supplier.delivery_zones.length > 0 && (
                            <div className="mt-4">
                              <label className="text-xs font-medium text-gray-500 flex items-center space-x-1">
                                <MapPin size={14} />
                                <span>Delivery Zones</span>
                              </label>
                              <div className="mt-2 space-y-2">
                                {offer.supplier.delivery_zones.map((zone, idx) => (
                                  <div key={idx} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded">
                                    <p className="font-medium">{zone.address}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Radius: {zone.radius} km
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => handleOfferAction(offer.id, 'Approved')}
                          disabled={offer.status === 'Approved'}
                          className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleOfferAction(offer.id, 'Rejected')}
                          disabled={offer.status === 'Rejected'}
                          className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleOfferAction(offer.id, 'Pending')}
                          disabled={offer.status === 'Pending'}
                          className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Pending
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Package size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No supplier offers available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.product_name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />

      {/* Offer Status Confirmation Modal */}
      <ConfirmModal
        isOpen={offerModal.isOpen}
        onClose={() => setOfferModal({ isOpen: false, offerId: null, action: null, loading: false })}
        onConfirm={confirmOfferAction}
        title={`${offerModal.action} Supplier Offer`}
        message={`Are you sure you want to set this supplier offer to ${offerModal.action?.toLowerCase()}?`}
        confirmText={offerModal.action || 'Confirm'}
        loading={offerModal.loading}
      />
    </DashboardLayout>
  );
};

export default ViewMasterProduct;