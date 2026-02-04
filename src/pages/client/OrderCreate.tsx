// FILE PATH: src/pages/client/OrderCreate.tsx

/**
 * ORDER CREATE PAGE - 4-STEP WIZARD WITH SPLIT DELIVERIES
 * 
 * ARCHITECTURE:
 * Step 1: Product Selection (cart management)
 * Step 2: Project & Delivery Details (address, contact, primary date)
 * Step 3: Split Delivery Schedule (configure delivery slots)
 * Step 4: Review & Confirm (final review before submission)
 * 
 * KEY CHANGES FROM ORIGINAL:
 * - Added Step 3 for split delivery scheduling
 * - Step 2 simplified (removed time, special fields, added contact person)
 * - Step 4 shows grouped delivery schedule
 * - Backend payload includes delivery_slots per item
 * 
 * DATA FLOW:
 * 1. User adds products to cart (Step 1)
 * 2. User enters project + delivery info (Step 2)
 * 3. User configures delivery slots (Step 3)
 * 4. User reviews and confirms (Step 4)
 * 5. System submits order with items.*.delivery_slots
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
import Step3_SplitDelivery from '../../components/order/Step3_SplitDelivery';
import Step4_ReviewOrder from '../../components/order/Step4_ReviewOrder';
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

  // ==================== WIZARD STATE ====================
  const [currentStep, setCurrentStep] = useState(1);

  // ==================== CART STATE ====================
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // ==================== STEP 2 STATE ====================
  const [orderFormData, setOrderFormData] = useState<OrderFormValues | null>(null);

  // ==================== STEP 4 STATE ====================
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // ==================== PRODUCT SELECTION STATE ====================
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductType, setSelectedProductType] = useState<string | undefined>();
  const [showProductTypeDropdown, setShowProductTypeDropdown] = useState(false);

  // ==================== PRODUCT MODAL STATE ====================
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // ==================== LOAD CART FROM LOCALSTORAGE ====================
  useEffect(() => {
    setCartItems(cartUtils.getCart());
  }, []);

  // ==================== DATA FETCHING ====================

  // Fetch Product Types
  const { data: productTypesData } = useQuery({
    queryKey: ['product-types'],
    queryFn: () => ordersAPI.getProductTypes(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Products (only on Step 1)
  const {
    data: productsData,
    isLoading: loadingProducts,
    error: productsError,
  } = useQuery({
    queryKey: ['client-products', currentPage, searchTerm, selectedProductType],
    queryFn: () =>
      ordersAPI.getClientProducts({
        page: currentPage,
        per_page: 12,
        search: searchTerm || undefined,
        product_type: selectedProductType,
      }),
    enabled: currentStep === 1,
  });

  // Fetch Projects (only on Step 2)
  const { data: projectsData } = useQuery({
    queryKey: ['client-projects'],
    queryFn: () => projectsAPI.list({}),
    enabled: currentStep === 2,
  });

  // ==================== CREATE ORDER MUTATION ====================
  
  /**
   * Create order mutation
   * 
   * WHAT: Sends order data to backend with delivery_slots per item
   * WHY: Final step - user has confirmed all details
   * HOW: Transform cart items into API payload format
   */
  const createOrderMutation = useMutation({
    mutationFn: ordersAPI.createOrder,
    onSuccess: () => {
      toast.success('✅ Order created successfully!');
      cartUtils.clearCart();
      setCartItems([]);
      queryClient.invalidateQueries({ queryKey: ['client-orders'] });
      navigate('/client/dashboard');
    },
    onError: (error: any) => {
      const errorMsg =
        error?.response?.data?.message || error?.message || 'Failed to create order';
      toast.error('❌ ' + errorMsg);
    },
  });

  // ==================== CART ACTIONS ====================

  /**
   * Add product to cart
   * 
   * WHAT: Adds product with default delivery slot
   * WHY: User selected product in Step 1
   * NOTE: Delivery slots will be configured in Step 3
   */
  const handleAddToCart = (product: Product) => {
    const updated = cartUtils.addItem({
      product_id: product.id,
      product_name: product.product_name,
      product_photo: product.photo,
      product_type: product.product_type,
      unit_of_measure: product.unit_of_measure,
      quantity: 1,
    });
    setCartItems(updated);
    toast.success(`✅ ${product.product_name} added to cart`);
  };

  /**
   * Update cart item quantity
   * 
   * WHAT: Changes total quantity and scales delivery slots proportionally
   * WHY: User changed mind about order quantity
   */
  const handleUpdateQuantity = (productId: number, quantity: number) => {
    const updated = cartUtils.updateQuantity(productId, quantity);
    setCartItems(updated);
  };

  /**
   * Remove item from cart
   */
  const handleRemoveItem = (productId: number) => {
    const updated = cartUtils.removeItem(productId);
    setCartItems(updated);
    toast.success('Item removed from cart');
  };

  // ==================== WIZARD NAVIGATION ====================

  /**
   * Step 1 → Step 2
   */
  const handleProceedToStep2 = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty. Please add some products.');
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Step 2 → Back to Step 1
   */
  const handleBackToStep1 = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Step 2 → Step 3 (with form data)
   * 
   * WHAT: Saves order details and moves to split delivery scheduling
   * WHY: User has entered project + delivery information
   * HOW: Store orderFormData in state for later use
   */
  const handleStep2Submit = (formData: OrderFormValues) => {
    setOrderFormData(formData);

    // Find and save selected project for display in Step 4
    const project = projects.find((p) => p.id === formData.project_id);
    setSelectedProject(project || null);

    // Move to Step 3 (Split Delivery)
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Step 3 → Back to Step 2
   */
  const handleBackToStep2 = () => {
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Step 3 → Step 4 (with configured delivery slots)
   * 
   * WHAT: Updates cart items with user-configured delivery slots
   * WHY: User has finished splitting deliveries
   * HOW: Merge delivery_slots into cart state
   */
  const handleStep3Continue = (itemsWithSlots: CartItem[]) => {
    setCartItems(itemsWithSlots);
    
    // Save to localStorage
    itemsWithSlots.forEach(item => {
      cartUtils.updateDeliverySlots(item.product_id, item.delivery_slots || []);
    });

    // Move to Step 4 (Review)
    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Step 4 → Back to Step 3
   */
  const handleBackToStep3 = () => {
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Step 4 → Submit Order
   * 
   * WHAT: Transform cart + form data into API payload and submit
   * WHY: User has confirmed all details
   * HOW: Map cart items to items array with delivery_slots
   */
  const handleFinalOrderSubmit = () => {
    if (!orderFormData) return;

    const orderPayload = {
      ...orderFormData,
      items: cartItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        custom_blend_mix: item.custom_blend_mix || null,
        delivery_slots: (item.delivery_slots || []).map((slot) => ({
          quantity: slot.quantity,
          delivery_date: slot.delivery_date,
          delivery_time: slot.delivery_time,
        })),
      })),
    };

    createOrderMutation.mutate(orderPayload);
  };

  // ==================== PRODUCT FILTERS ====================

  const handleProductTypeSelect = (productType: string | undefined) => {
    setSelectedProductType(productType);
    setCurrentPage(1);
    setShowProductTypeDropdown(false);
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
  const productTypes = Array.isArray(productTypesData)
    ? productTypesData
    : productTypesData?.data || [];
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const today = new Date().toISOString().split('T')[0];

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
            {currentStep === 3 && 'Configure delivery schedule for each product'}
            {currentStep === 4 && 'Review your order before final submission'}
          </p>
        </div>

        {/* Wizard Progress - Updated to 4 steps */}
        <OrderWizard
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          steps={[
            { number: 1, title: 'Products' },
            { number: 2, title: 'Delivery Details' },
            { number: 3, title: 'Schedule' },
            { number: 4, title: 'Review' },
          ]}
        >
          {/* ==================== STEP 1: PRODUCT SELECTION ==================== */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Search & Filters */}
              <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400"
                      size={20}
                    />
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

                  {/* Product Type Filter */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      onClick={() => setShowProductTypeDropdown(!showProductTypeDropdown)}
                      className="w-full md:w-auto"
                    >
                      <Filter size={18} />
                      {selectedProductType
                        ? productTypes.find((p) => p.product_type === selectedProductType)
                            ?.product_type
                        : 'All Product Types'}
                    </Button>

                    {showProductTypeDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-secondary-200 rounded-lg shadow-lg z-50">
                        <button
                          onClick={() => handleProductTypeSelect(undefined)}
                          className={`w-full text-left px-4 py-2 hover:bg-secondary-50 transition-colors ${
                            !selectedProductType
                              ? 'bg-primary-50 text-primary-700 font-semibold'
                              : ''
                          }`}
                        >
                          All Product Types
                        </button>
                        {productTypes.map((type) => (
                          <button
                            key={type.product_type}
                            onClick={() => handleProductTypeSelect(type.product_type)}
                            className={`w-full text-left px-4 py-2 hover:bg-secondary-50 transition-colors border-t border-secondary-100 ${
                              selectedProductType === type.product_type
                                ? 'bg-primary-50 text-primary-700 font-semibold'
                                : ''
                            }`}
                          >
                            {type.product_type}
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
                      <h3 className="text-lg font-semibold text-secondary-900">
                        No products found
                      </h3>
                      <p className="text-sm text-secondary-600 mt-1">
                        {searchTerm || selectedProductType
                          ? 'Try adjusting your search or filters'
                          : 'No products available at the moment'}
                      </p>
                    </div>
                    {(searchTerm || selectedProductType) && (
                      <Button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedProductType(undefined);
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
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="px-4 py-2 text-sm text-secondary-600">
                          Page {currentPage} of {meta.last_page}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() =>
                            setCurrentPage((prev) => Math.min(meta.last_page, prev + 1))
                          }
                          disabled={currentPage === meta.last_page}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Proceed Button (Fixed at bottom on mobile) */}
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
              onCreateProject={undefined}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onUpdateCustomBlend={(productId, blend) => {
                const updated = cartUtils.updateCustomBlend(productId, blend);
                setCartItems(updated);
              }}
            />
          )}

          {/* ==================== STEP 3: SPLIT DELIVERY SCHEDULE ==================== */}
          {currentStep === 3 && orderFormData && (
            <Step3_SplitDelivery
              cartItems={cartItems}
              primaryDeliveryDate={today}
              onBack={handleBackToStep2}
              onContinue={handleStep3Continue}
            />
          )}

          {/* ==================== STEP 4: REVIEW ORDER ==================== */}
          {currentStep === 4 && orderFormData && (
            <Step4_ReviewOrder
              cartItems={cartItems}
              orderDetails={orderFormData}
              selectedProject={selectedProject}
              onBack={handleBackToStep3}
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