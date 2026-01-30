// FILE PATH: src/pages/supplier/MyOffers.tsx

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  X,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  ArrowUpDown,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  supplierProductsAPI,
  getMyOffers,
  type SupplierOfferItem,
} from '../../api/handlers/supplierProducts.api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import OfferCard from '../../components/supplier/OfferCard';
import EditOfferModal from '../../components/supplier/EditOfferModal';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Buttons';
import ConfirmModal from '../../components/common/ConfirmModal';
import RequestProductModal from '../../components/supplier/RequestProductModal';
import { supplierMenuItems } from '../../utils/menuItems';

const PER_PAGE = 12;

const MyProducts = () => {
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<'created_at' | 'price' | 'updated_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Modal states
  // const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);


  // Selected items
  const [selectedOffer, setSelectedOffer] = useState<SupplierOfferItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Fetch my offers
  const { data: offersData, isLoading: isLoadingOffers } = useQuery({
    queryKey: ['my-offers', page, searchQuery, selectedProductType, statusFilter, sortBy, sortOrder],
    queryFn: () =>
      getMyOffers({
        page,
        per_page: PER_PAGE,
        search: searchQuery || undefined,
        product_type: selectedProductType,
        status: statusFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  // Fetch product types for filter
  const { data: productTypesData } = useQuery({
    queryKey: ['product-types'],
    queryFn: supplierProductsAPI.getProductTypes,
  });

   // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: supplierProductsAPI.getCategories,
  });
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: supplierProductsAPI.deleteSupplierOffer,
    onSuccess: () => {
      toast.success('Offer removed successfully');
      queryClient.invalidateQueries({ queryKey: ['my-offers'] });
      setShowDeleteModal(false);
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove offer');
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    const offers = offersData?.data || [];
    const total = offersData?.total || 0;
    const approved = offers.filter((o) => o.offer_status === 'Approved').length;
    const pending = offers.filter((o) => o.offer_status === 'Pending').length;
    const rejected = offers.filter((o) => o.offer_status === 'Rejected').length;

    return { total, approved, pending, rejected };
  }, [offersData]);

  // Modal handlers
  const handleEditOffer = (offer: SupplierOfferItem) => {
    setSelectedOffer(offer);
    setShowEditModal(true);
  };

  const handleRemoveOffer = (offerId: number, productName: string) => {
    setDeleteTarget({ id: offerId, name: productName });
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  const clearFilters = () => {
    setLocalSearch('');
    setSearchQuery('');
    setSelectedProductType(undefined);
    setStatusFilter(undefined);
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const hasFilters = searchQuery || selectedProductType || statusFilter;

  const pagination = {
    currentPage: offersData?.current_page || 1,
    lastPage: offersData?.last_page || 1,
    total: offersData?.total || 0,
    perPage: offersData?.per_page || PER_PAGE,
    from: offersData?.from || 0,
    to: offersData?.to || 0,
  };

  return (
    <DashboardLayout menuItems={supplierMenuItems}>
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 mb-2">My Products</h1>
            <p className="text-secondary-600 text-lg">
              View and manage your product & offers
            </p>
          </div>
          <Button
            onClick={() => setShowRequestModal(true)}
            variant="primary"
            fullWidth={false}
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus size={20} />
            Request New Product
        </Button>
        </div>
        

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Offers */}
          <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Package size={28} className="text-white" />
                </div>
                <TrendingUp size={20} className="text-white/60" />
              </div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Offers</p>
              <p className="text-white text-4xl font-bold">{stats.total}</p>
            </div>
          </div>

          {/* Approved */}
          <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <CheckCircle size={28} className="text-white" />
                </div>
                <TrendingUp size={20} className="text-white/60" />
              </div>
              <p className="text-green-100 text-sm font-medium mb-1">Approved</p>
              <p className="text-white text-4xl font-bold">{stats.approved}</p>
            </div>
          </div>

          {/* Pending */}
          <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Clock size={28} className="text-white" />
                </div>
                <TrendingUp size={20} className="text-white/60" />
              </div>
              <p className="text-amber-100 text-sm font-medium mb-1">Pending</p>
              <p className="text-white text-4xl font-bold">{stats.pending}</p>
            </div>
          </div>

          {/* Rejected */}
          <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <XCircle size={28} className="text-white" />
                </div>
                <TrendingUp size={20} className="text-white/60" />
              </div>
              <p className="text-red-100 text-sm font-medium mb-1">Rejected</p>
              <p className="text-white text-4xl font-bold">{stats.rejected}</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-md border border-secondary-100">
          <div className="p-6 space-y-6">
            {/* Search, Product Type, and Sort */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by product name..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-secondary-50 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white transition-all text-secondary-900 placeholder-secondary-400"
                />
              </div>

              {/* Product Type Filter */}
              <div className="relative">
                <Filter
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none"
                  size={20}
                />
                <select
                  value={selectedProductType || ''}
                  onChange={(e) => {
                    setSelectedProductType(e.target.value || undefined);
                    setPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3.5 bg-secondary-50 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white transition-all text-secondary-900 appearance-none cursor-pointer"
                >
                  <option value="">All Product Types</option>
                  {productTypesData?.data?.map((productType) => (
                    <option key={productType.product_type} value={productType.product_type}>
                      {productType.product_type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <DollarSign
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none"
                    size={20}
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as 'price' | 'created_at' | 'updated_at');
                      setPage(1);
                    }}
                    className="w-full pl-12 pr-4 py-3.5 bg-secondary-50 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white transition-all text-secondary-900 appearance-none cursor-pointer"
                  >
                    <option value="created_at">Sort by Date</option>
                    <option value="price">Sort by Price</option>
                    <option value="updated_at">Sort by Updated</option>
                  </select>
                </div>
                <button
                  onClick={toggleSortOrder}
                  className={`px-4 py-3.5 rounded-xl border-2 border-transparent bg-secondary-50 hover:bg-secondary-100 transition-all ${
                    sortOrder === 'desc' ? 'text-primary-600' : 'text-secondary-600'
                  }`}
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <ArrowUpDown size={20} className={sortOrder === 'asc' ? 'rotate-180' : ''} />
                </button>
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-secondary-700">Status:</span>

              <button
                onClick={() => {
                  setStatusFilter(undefined);
                  setPage(1);
                }}
                className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
                  !statusFilter
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-105'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                All Status
              </button>

              <button
                onClick={() => {
                  setStatusFilter('Approved');
                  setPage(1);
                }}
                className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
                  statusFilter === 'Approved'
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-105'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                Approved
              </button>

              <button
                onClick={() => {
                  setStatusFilter('Pending');
                  setPage(1);
                }}
                className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
                  statusFilter === 'Pending'
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                Pending
              </button>

              <button
                onClick={() => {
                  setStatusFilter('Rejected');
                  setPage(1);
                }}
                className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
                  statusFilter === 'Rejected'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                Rejected
              </button>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-2.5 rounded-full font-medium bg-error-100 text-error-700 hover:bg-error-200 transition-all duration-200 flex items-center gap-2"
                >
                  <X size={16} />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Offers Grid */}
        <div className="bg-white rounded-2xl shadow-md border border-secondary-100 p-6">
          {isLoadingOffers ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="animate-spin text-primary-500 mx-auto mb-4" size={48} />
                <p className="text-secondary-600 font-medium">Loading your offers...</p>
              </div>
            </div>
          ) : !offersData?.data || offersData.data.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-secondary-400" size={48} />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-2">No offers found</h3>
              <p className="text-secondary-600 text-lg mb-6">
                {hasFilters
                  ? 'Try adjusting your filters or search term'
                  : "You haven't added any product offers yet"}
              </p>
              {hasFilters && (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {offersData.data.map((offer) => (
                  <OfferCard
                    key={offer.offer_id}
                    offer={offer}
                    onEdit={handleEditOffer}
                    onRemove={handleRemoveOffer}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.total > 0 && (
                <div className="mt-8 pt-6 border-t border-secondary-200">
                  <Pagination
                    currentPage={pagination.currentPage}
                    lastPage={pagination.lastPage}
                    total={pagination.total}
                    perPage={pagination.perPage}
                    onPageChange={(newPage) => setPage(newPage)}
                    loading={isLoadingOffers}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Modal - Adapted to work with SupplierOfferItem */}
      {selectedOffer && (
        <EditOfferModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedOffer(null);
            queryClient.invalidateQueries({ queryKey: ['my-offers'] });
          }}
          product={{
            id: selectedOffer.master_product_id,
            product_name: selectedOffer.product_name,
            product_type: selectedOffer.product_type,
            unit_of_measure: selectedOffer.unit || '',
            specifications: selectedOffer.specifications || '',
            photo: selectedOffer.image_url || selectedOffer.image || '',
            category: selectedOffer.category || { id: 0, name: 'Uncategorized' },
            is_approved: selectedOffer.is_approved ? 1 : 0,
            suppliers: [],
            supplierOffersCount: 1,
            added_by: {
              id: 0,
              name: 'System',
              email: '',
              profile_image: null,
            },
            approved_by: selectedOffer.approved_by || null,
            slug: selectedOffer.slug || '',
            tech_doc: selectedOffer.tech_doc || null,
            created_at: selectedOffer.created_at,
            updated_at: selectedOffer.updated_at,
          }}
          offer={{
            id: selectedOffer.offer_id,
            supplier_id: 0,
            master_product_id: selectedOffer.master_product_id,
            price: String(selectedOffer.price),
            availability_status: selectedOffer.availability_status,
            status: selectedOffer.offer_status,
            isMe: true,
            created_at: selectedOffer.created_at,
            updated_at: selectedOffer.updated_at,
            supplier: {
              id: 0,
              name: '',
              email: '',
              profile_image: null,
              delivery_zones: [],
            },
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Remove Product Offer"
        message={`Are you sure you want to remove "${deleteTarget?.name}" from your offers? This action cannot be undone.`}
        confirmText="Remove"
        loading={deleteMutation.isPending}
      />

      <RequestProductModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        categories={categoriesData?.data || []}
      />
    </DashboardLayout>
  );
};

export default MyProducts;