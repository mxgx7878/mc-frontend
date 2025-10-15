// src/pages/client/OrderCreate.tsx
/**
 * REDESIGNED ORDER CREATE PAGE - MULTI-STEP WIZARD
 * 
 * Architecture:
 * - Step 1: Product Selection (with floating cart + product detail modal)
 * - Step 2: Project & Delivery Details (smart form with auto-fill)
 * - Step 3: Review & Confirm (order summary before submission)
 * 
 * Key Features:
 * ✅ Multi-step wizard with progress indicator
 * ✅ Product detail modal for full specifications
 * ✅ Floating cart badge with slide-in sidebar
 * ✅ Smart project selection with search
 * ✅ Mobile-first responsive design
 * ✅ LocalStorage cart persistence
 * ✅ Professional UX matching e-commerce standards
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, Filter, Loader2, AlertCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';

import DashboardLayout from '../../components/layout/DashboardLayout';
import OrderWizard from '../../components/order/OrderWizard';
import ProductCard from '../../components/order/ProductCard';
import ProductDetailModal from '../../components/order/ProductDetailModal';
import FloatingCartBadge from '../../components/order/FloatingCartBadge';
import Step2_ProjectDelivery from '../../components/order/Step2_ProjectDelivery';
import Step3_ReviewOrder from '../../components/order/Step3_ReviewOrder';
import Button from '../../components/common/Buttons';
import { ordersAPI } from '../../api/handlers/orders.api';
import { projectsAPI } from '../../api/handlers/projects.api';
import { cartUtils } from '../../utils/cartUtils';
import type { CartItem, Product, Project } from '../../types/order.types';
import type { OrderFormValues } from '../../utils/validators';
import { clientMenuItems } from '../../utils/menuItems';

const OrderCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 2 & 3 State
  const [orderFormData, setOrderFormData] = useState<OrderFormValues | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Product Selection State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Product Detail Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    setCartItems(cartUtils.getCart());
  }, []);

  // ==================== DATA FETCHING ====================

  // Fetch Categories
  const { data: categoriesData } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => ordersAPI.getCategories(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch Products
  const { data: productsData, isLoading: loadingProducts, error: productsError } = useQuery({
    queryKey: ['client-products', currentPage, searchTerm, selectedCategory],
    queryFn: () => ordersAPI.getClientProducts({
      page: currentPage,
      per_page: 12,
      search: searchTerm || undefined,
      category: selectedCategory,
    }),
    enabled: currentStep === 1, // Only fetch when on product selection step
  });

  // Fetch Projects
  const { data: projectsData } = useQuery({
    queryKey: ['client-projects'],
    queryFn: () => projectsAPI.list({}),
    enabled: currentStep === 2, // Only fetch when on project/delivery step
  });

  // Create Order Mutation
  const createOrderMutation = useMutation({
    mutationFn: ordersAPI.createOrder,
    onSuccess: () => {
      toast.success('✅ Order created successfully!');
      cartUtils.clearCart();
      setCartItems([]);
      queryClient.invalidateQueries({ queryKey: ['client-orders'] });
      
      // Redirect to dashboard
      navigate('/client/dashboard');
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to create order';
      toast.error('❌ ' + errorMsg);
    },
  });

  // ==================== CART ACTIONS ====================

  const handleAddToCart = (product: Product) => {
    const updated = cartUtils.addItem({
      id: product.id,
      product_name: product.product_name,
      photo: product.photo,
      product_type: product.product_type,
      unit_of_measure: product.unit_of_measure,
    });
    setCartItems(updated);
    toast.success(`✅ ${product.product_name} added to cart`);
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    const updated = cartUtils.updateQuantity(productId, quantity);
    setCartItems(updated);
  };

  const handleRemoveItem = (productId: number) => {
    const updated = cartUtils.removeItem(productId);
    setCartItems(updated);
    toast.success('Item removed from cart');
  };

  

  // ==================== WIZARD NAVIGATION ====================

  const handleProceedToStep2 = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty. Please add some products.');
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStep2 = () => {
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep2Submit = (formData: OrderFormValues) => {
    // Save form data and move to review step (Step 3)
    setOrderFormData(formData);
    
    // Find and save selected project
    const project = projects.find(p => p.id === formData.project_id);
    setSelectedProject(project || null);
    
    // Move to Step 3 (Review)
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalOrderSubmit = () => {
    if (!orderFormData) return;
    
    const orderPayload = {
      ...orderFormData,
      items: cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        custom_blend_mix: item.custom_blend_mix || null,
      })),
    };
    createOrderMutation.mutate(orderPayload);
  };

  // ==================== FILTERS ====================

  const handleCategorySelect = (categoryId: number | undefined) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    setShowCategoryDropdown(false);
  };

  // ==================== PRODUCT MODAL ====================

  const handleViewProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  // ==================== DATA PREPARATION ====================

  const products = productsData?.data || [];
  const meta = productsData?.meta;
  const projects = projectsData?.data || [];

  // Get categories from API
  const categories = categoriesData?.data || [];

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // ==================== RENDER ====================

  return (
    <DashboardLayout menuItems={clientMenuItems}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Create Order</h1>
          <p className="text-secondary-600 mt-1">
            {currentStep === 1 && 'Select products and add them to your cart'}
            {currentStep === 2 && 'Enter project and delivery details'}
            {currentStep === 3 && 'Review your order before final submission'}
          </p>
        </div>

        {/* Wizard Progress */}
        <OrderWizard currentStep={currentStep} onStepChange={setCurrentStep}>
          
          {/* ==================== STEP 1: PRODUCT SELECTION ==================== */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Search & Filters */}
              <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search products by name or type..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-10 py-3 rounded-lg border-2 border-secondary-200 focus:border-primary-500 focus:outline-none transition-colors"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setCurrentPage(1);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>

                  {/* Category Filter Dropdown */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="w-full md:w-auto"
                    >
                      <Filter size={18} />
                      {selectedCategory 
                        ? categories.find(c => c.id === selectedCategory)?.name 
                        : 'All Categories'}
                    </Button>

                    {showCategoryDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-secondary-200 rounded-lg shadow-lg z-50">
                        <button
                          onClick={() => handleCategorySelect(undefined)}
                          className={`w-full text-left px-4 py-2 hover:bg-secondary-50 transition-colors ${
                            !selectedCategory ? 'bg-primary-50 text-primary-700 font-semibold' : ''
                          }`}
                        >
                          All Categories
                        </button>
                        {categories.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => handleCategorySelect(category.id)}
                            className={`w-full text-left px-4 py-2 hover:bg-secondary-50 transition-colors border-t border-secondary-100 ${
                              selectedCategory === category.id ? 'bg-primary-50 text-primary-700 font-semibold' : ''
                            }`}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {loadingProducts ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="animate-spin text-primary-600 mb-4" size={48} />
                  <p className="text-secondary-600">Loading products...</p>
                </div>
              ) : productsError ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                  <div>
                    <p className="font-semibold text-red-900">Failed to load products</p>
                    <p className="text-sm text-red-700 mt-1">
                      {(productsError as any)?.message || 'Please try refreshing the page'}
                    </p>
                  </div>
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-12">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-100 rounded-full">
                      <Package className="text-secondary-400" size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900">No products found</h3>
                      <p className="text-sm text-secondary-600 mt-1">
                        {searchTerm || selectedCategory 
                          ? 'Try adjusting your search or filters' 
                          : 'No products available at the moment'}
                      </p>
                    </div>
                    {(searchTerm || selectedCategory) && (
                      <Button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedCategory(undefined);
                        }}
                        variant="outline"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        isInCart={cartUtils.isInCart(product.id)}
                        onAddToCart={handleAddToCart}
                        onViewDetails={handleViewProductDetails}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {meta && meta.last_page > 1 && (
                    <div className="flex justify-center mt-8">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="px-4 py-2 text-sm text-secondary-600">
                          Page {currentPage} of {meta.last_page}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.min(meta.last_page, prev + 1))}
                          disabled={currentPage === meta.last_page}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Proceed to Next Step Button (Fixed at bottom on mobile) */}
              {cartItems.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 lg:relative bg-white border-t border-secondary-200 p-4 shadow-xl lg:shadow-none z-30">
                  <div className="max-w-7xl mx-auto">
                    <Button
                      onClick={handleProceedToStep2}
                      variant="primary"
                      fullWidth
                      className="py-4 text-lg font-semibold"
                    >
                      Continue to Delivery Details ({totalCartItems} items) →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== STEP 2: PROJECT & DELIVERY ==================== */}
          {currentStep === 2 && (
            <Step2_ProjectDelivery
              cartItems={cartItems}
              projects={projects}
              onSubmit={handleStep2Submit}
              onBack={handleBackToStep1}
              isSubmitting={false}
            />
          )}

          {/* ==================== STEP 3: REVIEW ORDER ==================== */}
          {currentStep === 3 && orderFormData && (
            <Step3_ReviewOrder
              cartItems={cartItems}
              orderDetails={orderFormData}
              selectedProject={selectedProject}
              onBack={handleBackToStep2}
              onConfirm={handleFinalOrderSubmit}
              isSubmitting={createOrderMutation.isPending}
            />
          )}

        </OrderWizard>

        {/* Floating Cart Badge (Only on Step 1) */}
        {currentStep === 1 && (
          <FloatingCartBadge
            itemCount={totalCartItems}
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onProceedToCheckout={handleProceedToStep2}
          />
        )}

        {/* Product Detail Modal */}
        <ProductDetailModal
          isOpen={showProductModal}
          onClose={handleCloseProductModal}
          product={selectedProduct}
          isInCart={selectedProduct ? cartUtils.isInCart(selectedProduct.id) : false}
          onAddToCart={handleAddToCart}
        />
      </div>
    </DashboardLayout>
  );
};

export default OrderCreate;