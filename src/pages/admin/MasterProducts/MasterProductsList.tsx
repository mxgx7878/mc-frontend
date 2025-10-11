// FILE PATH: src/pages/admin/MasterProducts/MasterProductsList.tsx

/**
 * Master Products List Component
 * 
 * Main listing page for Master Products with:
 * - Paginated table display
 * - Active/Inactive status toggle
 * - Search functionality
 * - Category filter
 * - View/Edit/Delete actions
 * - Stats cards (Total, Approved, Pending)
 * - Image preview
 * 
 * What's happening here:
 * 1. On mount, we fetch products from API with pagination
 * 2. Status toggle updates 'is_approved' field via API
 * 3. Confirmation modal appears before status change
 * 4. Search/filters trigger new API calls with query params
 * 5. Navigation to Add/Edit/View pages via React Router
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  masterProductsAPI, 
  MasterProduct, 
  PaginatedMasterProductsResponse,
  MasterProductsFilters 
} from '../../../api/handlers/masterProducts.api';
import StatusBadge from '../../../components/common/StatusBadge';
import Pagination from '../../../components/common/Pagination';
import ConfirmModal from '../../../components/common/ConfirmModal';

const MasterProductsList = () => {
  const navigate = useNavigate();

  // State management with proper TypeScript types
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(''); // 'approved', 'pending', or ''

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    productId: number | null;
    currentStatus: boolean | null;
    loading: boolean;
  }>({
    isOpen: false,
    productId: null,
    currentStatus: null,
    loading: false,
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
  });

  /**
   * Fetch products from API
   * WHY: We need to get paginated data with filters applied
   * HOW: Call API service with current page and filters
   */
  const fetchProducts = async (page: number = 1) => {
    setLoading(true);
    try {
      const filters: MasterProductsFilters = {
        page,
        per_page: pagination.perPage,
      };
      
      // Add filters if they exist
      if (searchQuery) filters.search = searchQuery;
      if (categoryFilter) filters.category = categoryFilter;
      if (statusFilter) filters.is_approved = statusFilter === 'approved' ? 1 : 0;

      const response: PaginatedMasterProductsResponse = await masterProductsAPI.getAll(filters);
      
      setProducts(response.data);
      setPagination({
        currentPage: response.current_page,
        lastPage: response.last_page,
        total: response.total,
        perPage: response.per_page,
      });

      // Calculate stats
      calculateStats(response.data);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error(error.message || 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate statistics from products data
   * WHY: To show quick stats cards at the top
   */
  const calculateStats = (productsData: MasterProduct[]) => {
    const total = productsData.length;
    const approved = productsData.filter(p => p.is_approved === 1).length;
    const pending = productsData.filter(p => p.is_approved === 0).length;

    setStats({ total, approved, pending });
  };

  /**
   * Handle status toggle
   * WHY: Admin needs to activate/deactivate products
   * HOW: Show confirmation modal, then call API to update is_approved field
   */
  const handleStatusToggle = (productId: number, currentStatus: boolean) => {
    setConfirmModal({
      isOpen: true,
      productId,
      currentStatus,
      loading: false,
    });
  };

  /**
   * Confirm status change
   * WHY: Execute the actual API call after user confirmation
   */
  const confirmStatusChange = async () => {
    const { productId, currentStatus } = confirmModal;
    
    if (!productId) return;
    
    const newStatus = !currentStatus;

    setConfirmModal(prev => ({ ...prev, loading: true }));

    try {
      await masterProductsAPI.toggleApproval(productId, newStatus);
      
      // Update local state to reflect change
      setProducts(prev => 
        prev.map(product => 
          product.id === productId 
            ? { ...product, is_approved: newStatus ? 1 : 0 }
            : product
        )
      );

      toast.success(`Product ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      setConfirmModal({ isOpen: false, productId: null, currentStatus: null, loading: false });
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast.error(error.message || 'Failed to update product status. Please try again.');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  /**
   * Handle search input change
   * WHY: User wants to filter products by name/type
   * HOW: Debounce search to avoid excessive API calls
   */
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchProducts(1); // Reset to page 1 when searching
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, categoryFilter, statusFilter]);

  // Initial load
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    fetchProducts(page);
  };

  /**
   * Handle delete (placeholder for now)
   */
  const handleDelete = (productId: number) => {
    toast('Delete functionality coming soon!', { icon: '🚧' });
    // We'll implement this later
  };

  /**
   * Get image URL
   * WHY: Laravel stores images with relative paths, we need full URL
   */
  const getImageUrl = (photoPath: string | null): string => {
    if (!photoPath) return '/placeholder-image.png'; // Fallback image
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://127.0.0.1:8000';
    return `${baseUrl}/storage/${photoPath}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Master Products</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage all master products and their supplier offers
              </p>
            </div>
            <Link
              to="/admin/master-products/add"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Products</p>
                <p className="text-2xl font-semibold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Approval</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Products
              </label>
              <input
                type="text"
                placeholder="Search by name or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="approved">Active</option>
                <option value="pending">Inactive</option>
              </select>
            </div>

            {/* Category Filter - Will be populated from API */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {/* TODO: Fetch and populate categories dynamically */}
                <option value="1">Cats</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new product.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Added By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier Offers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        {/* Product Info */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              <img
                                className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                                src={getImageUrl(product.photo)}
                                alt={product.product_name}
                                onError={(e) => {
                                  e.target.src = '/placeholder-image.png';
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.product_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.unit_of_measure}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.product_type}</div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            {product.category?.name || 'N/A'}
                          </span>
                        </td>

                        {/* Added By */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.added_by?.name}</div>
                          <div className="text-sm text-gray-500">{product.added_by?.email}</div>
                        </td>

                        {/* Supplier Offers Count */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {product.supplierOffersCount || 0}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge
                            isApproved={product.is_approved === 1}
                            onToggle={() => handleStatusToggle(product.id, product.is_approved === 1)}
                          />
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate(`/admin/master-products/view/${product.id}`)}
                              className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                              title="View Details"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => navigate(`/admin/master-products/edit/${product.id}`)}
                              className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-colors"
                              title="Edit Product"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                              title="Delete Product (Coming Soon)"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={pagination.currentPage}
                lastPage={pagination.lastPage}
                total={pagination.total}
                perPage={pagination.perPage}
                onPageChange={handlePageChange}
                loading={loading}
              />
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, productId: null, currentStatus: null, loading: false })}
        onConfirm={confirmStatusChange}
        title={`${confirmModal.currentStatus ? 'Deactivate' : 'Activate'} Product`}
        message={`Are you sure you want to ${confirmModal.currentStatus ? 'deactivate' : 'activate'} this product? This will change its approval status.`}
        confirmText={confirmModal.currentStatus ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        isDanger={confirmModal.currentStatus}
        loading={confirmModal.loading}
      />
    </div>
  );
};

export default MasterProductsList;