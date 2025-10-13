// FILE PATH: src/pages/supplier/ProductManagement.tsx
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Home, 
  Package, 
  DollarSign, 
  MapPin, 
  Settings, 
  User,
  Search,
  Plus,
  Filter,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  supplierProductsAPI, 
  MasterProduct, 
  SupplierOffer 
} from '../../api/handlers/supplierProducts.api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ProductCard from '../../components/supplier/ProductCard';
import AddOfferModal from '../../components/supplier/AddOfferModal';
import EditOfferModal from '../../components/supplier/EditOfferModal';
import RequestProductModal from '../../components/supplier/RequestProductModal';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Buttons';
import ConfirmModal from '../../components/common/ConfirmModal';

const PER_PAGE = 10;

const ProductManagement = () => {
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<'all' | 'my_offers' | 'not_added'>('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Selected items
  const [selectedProduct, setSelectedProduct] = useState<MasterProduct | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<SupplierOffer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Fetch products
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['supplier-products', page, searchQuery, selectedCategory],
    queryFn: () => supplierProductsAPI.getProducts({
      page,
      per_page: PER_PAGE,
      search: searchQuery || undefined,
      category_id: selectedCategory,
    }),
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
      toast.success('Product removed from your offers');
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      setShowDeleteModal(false);
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove product');
    },
  });

  // Menu items
  const menuItems = [
    { label: 'Dashboard', path: '/supplier/dashboard', icon: <Home size={20} /> },
    { label: 'My Products', path: '/supplier/products', icon: <Package size={20} /> },
    { label: 'Orders', path: '/supplier/orders', icon: <DollarSign size={20} /> },
    { label: 'Delivery Zones', path: '/supplier/zones', icon: <MapPin size={20} /> },
    { label: 'Profile', path: '/supplier/profile', icon: <User size={20} /> },
    { label: 'Settings', path: '/supplier/settings', icon: <Settings size={20} /> },
  ];

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!productsData?.data) return [];
    
    let filtered = productsData.data;

    if (statusFilter === 'my_offers') {
      filtered = filtered.filter(p => p.suppliers.some(s => s.isMe));
    } else if (statusFilter === 'not_added') {
      filtered = filtered.filter(p => !p.suppliers.some(s => s.isMe));
    }

    return filtered;
  }, [productsData?.data, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredProducts.length;
    const myOffers = filteredProducts.filter(p => p.suppliers.some(s => s.isMe)).length;
    const notAdded = filteredProducts.filter(p => !p.suppliers.some(s => s.isMe)).length;

    return { total, myOffers, notAdded };
  }, [filteredProducts]);

  // Modal handlers
  const handleAddOffer = (product: MasterProduct) => {
    setSelectedProduct(product);
    setShowAddModal(true);
  };

  const handleEditOffer = (product: MasterProduct, offer: SupplierOffer) => {
    setSelectedProduct(product);
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
    setSelectedCategory(undefined);
    setStatusFilter('all');
    setPage(1);
  };

  const hasFilters = searchQuery || selectedCategory || statusFilter !== 'all';

  // ✅ FIX: Proper pagination data with fallbacks
  const pagination = {
    currentPage: productsData?.current_page || 1,
    lastPage: productsData?.last_page || 1,
    total: productsData?.total || 0,
    perPage: productsData?.per_page || PER_PAGE,
    from: productsData?.from || 0,
    to: productsData?.to || 0,
  };

  return (
    <DashboardLayout menuItems={menuItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">Product Management</h1>
            <p className="text-secondary-600 mt-1">
              Manage your product offers and request new products
            </p>
          </div>
          <Button
            onClick={() => setShowRequestModal(true)}
            variant="primary"
            fullWidth={false}
          >
            <Plus size={20} />
            Request Product
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-secondary-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-secondary-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-secondary-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 mb-1">My Offers</p>
                <p className="text-3xl font-bold text-success-600">{stats.myOffers}</p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <Package size={24} className="text-success-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-secondary-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 mb-1">Not Added</p>
                <p className="text-3xl font-bold text-secondary-500">{stats.notAdded}</p>
              </div>
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <Package size={24} className="text-secondary-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col gap-4">
            {/* Search and Category */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-secondary-200 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory || ''}
                onChange={(e) => {
                  setSelectedCategory(e.target.value ? Number(e.target.value) : undefined);
                  setPage(1);
                }}
                className="px-4 py-3 border-2 border-secondary-200 rounded-lg focus:outline-none focus:border-primary-500"
              >
                <option value="">All Categories</option>
                {categoriesData?.data.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { setStatusFilter('all'); setPage(1); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                All Products
              </button>
              <button
                onClick={() => { setStatusFilter('my_offers'); setPage(1); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'my_offers'
                    ? 'bg-success-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                My Offers
              </button>
              <button
                onClick={() => { setStatusFilter('not_added'); setPage(1); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'not_added'
                    ? 'bg-error-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                Not Added
              </button>
              
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 rounded-lg font-medium bg-secondary-100 text-secondary-700 hover:bg-secondary-200 transition-colors flex items-center gap-2"
                >
                  <X size={16} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {isLoadingProducts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary-500" size={32} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto text-secondary-400 mb-4" size={48} />
              <p className="text-secondary-600 text-lg">No products found</p>
              <p className="text-secondary-500 text-sm mt-2">
                Try adjusting your filters or search term
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddOffer={handleAddOffer}
                    onEditOffer={handleEditOffer}
                    onRemoveOffer={handleRemoveOffer}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.total > 0 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={pagination.currentPage}
                    lastPage={pagination.lastPage}
                    total={pagination.total}
                    perPage={pagination.perPage}
                    onPageChange={(newPage) => setPage(newPage)}
                    loading={isLoadingProducts}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddOfferModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      <EditOfferModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
          setSelectedOffer(null);
        }}
        product={selectedProduct}
        offer={selectedOffer}
      />

      <RequestProductModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        categories={categoriesData?.data || []}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Remove Product from Offers"
        message={`Are you sure you want to remove "${deleteTarget?.name}" from your offers? This action cannot be undone.`}
        confirmText="Remove"
        isLoading={deleteMutation.isPending}
      />
    </DashboardLayout>
  );
};

export default ProductManagement;