// FILE PATH: src/pages/supplier/ProductManagement.tsx
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  Search,
  Plus,
  Filter,
  Loader2,
  AlertCircle,
  X,
  TrendingUp,
  Grid3X3,
  Layers,
} from 'lucide-react';

import { 
  supplierProductsAPI, 
} from '../../api/handlers/supplierProducts.api';
import type { MasterProduct } from '../../api/handlers/supplierProducts.api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ProductCard from '../../components/supplier/ProductCard';
import AddOfferModal from '../../components/supplier/AddOfferModal';
import RequestProductModal from '../../components/supplier/RequestProductModal';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Buttons';
import { supplierMenuItems } from '../../utils/menuItems';

const PER_PAGE = 12;

const ProductManagement = () => {
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<string | undefined>();
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  // Selected items
  const [selectedProduct, setSelectedProduct] = useState<MasterProduct | null>(null);

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
    queryKey: ['supplier-products', page, searchQuery, selectedProductType],
    queryFn: () => supplierProductsAPI.getProducts({
      page,
      per_page: PER_PAGE,
      search: searchQuery || undefined,
      product_type: selectedProductType,
    }),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: supplierProductsAPI.getCategories,
  });

  // Fetch product types
  const { data: productTypesData } = useQuery({
    queryKey: ['product-types'],
    queryFn: supplierProductsAPI.getProductTypes,
  });

  // Filter products - ONLY show products NOT added by supplier
  const filteredProducts = useMemo(() => {
    if (!productsData?.data) return [];
    return productsData.data.filter(p => !p.suppliers.some(s => s.isMe));
  }, [productsData?.data]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!productsData?.data) return { total: 0, available: 0, productTypes: 0 };
    
    const allProducts = productsData.data;
    const available = allProducts.filter(p => !p.suppliers.some(s => s.isMe)).length;
    
    // Count unique product types
    const uniqueTypes = new Set(allProducts.map(p => p.product_type));
    
    return { 
      total: productsData.total || 0,
      available,
      productTypes: uniqueTypes.size,
    };
  }, [productsData]);

  // Modal handlers
  const handleAddOffer = (product: MasterProduct) => {
    setSelectedProduct(product);
    setShowAddModal(true);
  };

  const clearFilters = () => {
    setLocalSearch('');
    setSearchQuery('');
    setSelectedProductType(undefined);
    setPage(1);
  };

  const hasFilters = searchQuery || selectedProductType;

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
            <h1 className="text-4xl font-bold text-secondary-900 mb-2">Platform Products</h1>
            <p className="text-secondary-600 text-lg">
              Browse available products and add them to your offers
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Platform Products */}
          <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Grid3X3 size={28} className="text-white" />
                </div>
                <TrendingUp size={20} className="text-white/60" />
              </div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Platform Products</p>
              <p className="text-white text-4xl font-bold">{stats.total}</p>
            </div>
          </div>

          {/* Available to Add */}
          <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Package size={28} className="text-white" />
                </div>
                <TrendingUp size={20} className="text-white/60" />
              </div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Available to Add</p>
              <p className="text-white text-4xl font-bold">{stats.available}</p>
            </div>
          </div>

          {/* Product Types */}
          <div className="relative bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Layers size={28} className="text-white" />
                </div>
                <TrendingUp size={20} className="text-white/60" />
              </div>
              <p className="text-violet-100 text-sm font-medium mb-1">Product Types</p>
              <p className="text-white text-4xl font-bold">{stats.productTypes}</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-md border border-secondary-100">
          <div className="p-6 space-y-6">
            {/* Search and Product Type Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Search products by name or specifications..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-secondary-50 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white transition-all text-secondary-900 placeholder-secondary-400"
                />
              </div>

              {/* Product Type Filter */}
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={20} />
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
            </div>

            {/* Active Filters Display */}
            {hasFilters && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-secondary-700">Active filters:</span>
                
                {searchQuery && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium">
                    Search: "{searchQuery}"
                    <button
                      onClick={() => { setLocalSearch(''); setSearchQuery(''); }}
                      className="hover:text-primary-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                )}
                
                {selectedProductType && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
                    Type: {selectedProductType}
                    <button
                      onClick={() => setSelectedProductType(undefined)}
                      className="hover:text-violet-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                )}
                
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 rounded-full font-medium bg-error-100 text-error-700 hover:bg-error-200 transition-all duration-200 flex items-center gap-2 text-sm"
                >
                  <X size={14} />
                  Clear All
                </button>
              </div>
            )}
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
              <h3 className="text-2xl font-bold text-secondary-900 mb-2">
                {hasFilters ? 'No products found' : 'All products added!'}
              </h3>
              <p className="text-secondary-600 text-lg mb-6">
                {hasFilters 
                  ? 'Try adjusting your filters or search term'
                  : "You've added all available products to your offers. Request a new product if you need something specific."}
              </p>
              {hasFilters ? (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => setShowRequestModal(true)} variant="primary">
                  <Plus size={18} />
                  Request New Product
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="mb-6">
                <p className="text-secondary-600">
                  Showing <span className="font-semibold text-secondary-900">{filteredProducts.length}</span> products available to add
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddOffer={handleAddOffer}
                    onEditOffer={() => {}}  // Not used - products shown have no offers
                    onRemoveOffer={() => {}} // Not used - products shown have no offers
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
          queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
        }}
        product={selectedProduct}
      />

      <RequestProductModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        categories={categoriesData?.data || []}
      />
    </DashboardLayout>
  );
};

export default ProductManagement;