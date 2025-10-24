// FILE PATH: src/pages/supplier/ProductManagement.tsx
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  Search,
  Plus,
  Filter,
  Loader2,
  AlertCircle,
  X,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  supplierProductsAPI, 
   
} from '../../api/handlers/supplierProducts.api';
import type { SupplierOffer, MasterProduct } from '../../api/handlers/supplierProducts.api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ProductCard from '../../components/supplier/ProductCard';
import AddOfferModal from '../../components/supplier/AddOfferModal';
import EditOfferModal from '../../components/supplier/EditOfferModal';
import RequestProductModal from '../../components/supplier/RequestProductModal';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Buttons';
import ConfirmModal from '../../components/common/ConfirmModal';
import {supplierMenuItems} from '../../utils/menuItems';

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

  const pagination = {
    currentPage: productsData?.current_page || 1,
    lastPage: productsData?.last_page || 1,
    total: productsData?.total || 0,
    perPage: productsData?.per_page || PER_PAGE,
    from: productsData?.from || 0,
    to: productsData?.to || 0,
  };

  return (
    <DashboardLayout menuItems={supplierMenuItems}>
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 mb-2">Product Management</h1>
            <p className="text-secondary-600 text-lg">
              Manage your product offers and request new products
            </p>
          </div>
          <Button
            onClick={() => setShowRequestModal(true)}
            variant="primary"
            fullWidth={false}
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus size={20} />
            Request Product
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Products */}
          <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Package size={28} className="text-white" />
                </div>
                <TrendingUp size={20} className="text-white/60" />
              </div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Products</p>
              <p className="text-white text-4xl font-bold">{stats.total}</p>
            </div>
          </div>

          {/* My Offers */}
          <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <CheckCircle size={28} className="text-white" />
                </div>
                <TrendingUp size={20} className="text-white/60" />
              </div>
              <p className="text-green-100 text-sm font-medium mb-1">My Active Offers</p>
              <p className="text-white text-4xl font-bold">{stats.myOffers}</p>
            </div>
          </div>

          {/* Not Added */}
          <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <XCircle size={28} className="text-white" />
                </div>
                <TrendingUp size={20} className="text-white/60" />
              </div>
              <p className="text-orange-100 text-sm font-medium mb-1">Available to Add</p>
              <p className="text-white text-4xl font-bold">{stats.notAdded}</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-md border border-secondary-100">
          <div className="p-6 space-y-6">
            {/* Search and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Search products by name, type, or specifications..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-secondary-50 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white transition-all text-secondary-900 placeholder-secondary-400"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={20} />
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value ? Number(e.target.value) : undefined);
                    setPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3.5 bg-secondary-50 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white transition-all text-secondary-900 appearance-none cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categoriesData?.data.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-secondary-700">Filter by:</span>
              
              <button
                onClick={() => { setStatusFilter('all'); setPage(1); }}
                className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
                  statusFilter === 'all'
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-105'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                All Products
              </button>
              
              <button
                onClick={() => { setStatusFilter('my_offers'); setPage(1); }}
                className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
                  statusFilter === 'my_offers'
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-105'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                My Offers
              </button>
              
              <button
                onClick={() => { setStatusFilter('not_added'); setPage(1); }}
                className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
                  statusFilter === 'not_added'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                Not Added
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

        {/* Products Grid */}
        <div className="bg-white rounded-2xl shadow-md border border-secondary-100 p-6">
          {isLoadingProducts ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="animate-spin text-primary-500 mx-auto mb-4" size={48} />
                <p className="text-secondary-600 font-medium">Loading products...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-secondary-400" size={48} />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-2">No products found</h3>
              <p className="text-secondary-600 text-lg mb-6">
                {hasFilters 
                  ? 'Try adjusting your filters or search term'
                  : 'No products available at the moment'}
              </p>
              {hasFilters && (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
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
                <div className="mt-8 pt-6 border-t border-secondary-200">
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
        loading={deleteMutation.isPending}
      />
    </DashboardLayout>
  );
};

export default ProductManagement;