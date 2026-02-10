// FILE PATH: src/pages/client/OrderCreate.tsx

/**
 * ORDER CREATE PAGE - 4-STEP WIZARD WITH SPLIT DELIVERIES
 * 
 * ARCHITECTURE:
 * Step 1: Location + Product Selection (location picker + cart management)
 * Step 2: Project & Delivery Details (address, contact, primary date)
 * Step 3: Split Delivery Schedule (configure delivery slots)
 * Step 4: Review & Confirm (final review before submission)
 * 
 * UPDATED: Step 1 now includes a location selector bar
 * - User can select an existing project (uses project's lat/long)
 * - Or enter a custom delivery address via Google Autocomplete
 * - Location is sent to backend → products show is_available badge
 * - Products with is_available=false are dimmed and can't be added to cart
 * 
 * DATA FLOW:
 * 1. User optionally sets delivery location (Step 1 - top bar)
 * 2. Products load with availability based on location
 * 3. User adds available products to cart (Step 1)
 * 4. User enters project + delivery info (Step 2)
 * 5. User configures delivery slots (Step 3)
 * 6. User reviews and confirms (Step 4)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, Filter, Loader2, AlertCircle, Package, MapPin, Building2, Navigation, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Autocomplete from 'react-google-autocomplete';

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

  // ==================== STEP 1 LOCATION STATE ====================
  /**
   * NEW: Location state for Step 1 product availability
   * - locationSource: 'none' | 'project' | 'custom'
   * - deliveryLat/Long: coordinates sent to API
   * - selectedLocationProject: project chosen for location
   * - locationLabel: display text for selected location
   */
  const [locationSource, setLocationSource] = useState<'none' | 'project' | 'custom'>('none');
  const [deliveryLat, setDeliveryLat] = useState<number | undefined>(undefined);
  const [deliveryLong, setDeliveryLong] = useState<number | undefined>(undefined);
  const [selectedLocationProject, setSelectedLocationProject] = useState<Project | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showCustomAddress, setShowCustomAddress] = useState(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [addressKey, setAddressKey] = useState(0); // Force re-render autocomplete

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

  // Fetch Projects (needed on Step 1 for location picker AND Step 2 for form)
  const { data: projectsData } = useQuery({
    queryKey: ['client-projects'],
    queryFn: () => projectsAPI.list({}),
    enabled: currentStep === 1 || currentStep === 2,
  });

  // Fetch Products (only on Step 1) — NOW includes location params
  const {
    data: productsData,
    isLoading: loadingProducts,
    error: productsError,
  } = useQuery({
    queryKey: ['client-products', currentPage, searchTerm, selectedProductType, deliveryLat, deliveryLong],
    queryFn: () =>
      ordersAPI.getClientProducts({
        page: currentPage,
        per_page: 12,
        search: searchTerm || undefined,
        product_type: selectedProductType,
        delivery_lat: deliveryLat,     // NEW: pass location
        delivery_long: deliveryLong,   // NEW: pass location
      }),
    enabled: currentStep === 1,
  });

  // ==================== CREATE ORDER MUTATION ====================

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

  // ==================== LOCATION HANDLERS (Step 1) ====================

  /**
   * Handle project selection for location
   * Uses the project's saved delivery coordinates
   */
  const handleLocationProjectSelect = (project: Project) => {
    if (project.delivery_lat && project.delivery_long) {
      setLocationSource('project');
      setDeliveryLat(Number(project.delivery_lat));
      setDeliveryLong(Number(project.delivery_long));
      setSelectedLocationProject(project);
      setLocationLabel(project.delivery_address || project.name);
      setShowProjectPicker(false);
      setShowCustomAddress(false);
      setProjectSearchTerm('');
      setCurrentPage(1); // Reset pagination when location changes
    } else {
      toast.error('This project has no saved location. Please select another or enter a custom address.');
    }
  };

  /**
   * Handle Google Autocomplete place selection for custom location
   */
  const handleCustomPlaceSelected = (place: any) => {
    if (place.geometry?.location) {
      const lat = Number(place.geometry.location.lat());
      const lng = Number(place.geometry.location.lng());
      setLocationSource('custom');
      setDeliveryLat(lat);
      setDeliveryLong(lng);
      setSelectedLocationProject(null);
      setLocationLabel(place.formatted_address || 'Custom location');
      setShowCustomAddress(false);
      setCurrentPage(1);
    }
  };

  /**
   * Clear location — products will show without availability info
   */
  const handleClearLocation = () => {
    setLocationSource('none');
    setDeliveryLat(undefined);
    setDeliveryLong(undefined);
    setSelectedLocationProject(null);
    setLocationLabel('');
    setShowProjectPicker(false);
    setShowCustomAddress(false);
    setAddressKey((prev) => prev + 1);
    setCurrentPage(1);
  };

  // ==================== CART ACTIONS ====================

  const handleAddToCart = (product: Product) => {
    // Prevent adding unavailable products
    if (product.is_available === false) {
      toast.error('This product is not available at the selected location.');
      return;
    }

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

  const handleStep2Submit = (formData: OrderFormValues) => {
    setOrderFormData(formData);

    const project = projects.find((p) => p.id === formData.project_id);
    setSelectedProject(project || null);

    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStep2 = () => {
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep3Continue = (itemsWithSlots: CartItem[]) => {
    setCartItems(itemsWithSlots);

    itemsWithSlots.forEach((item) => {
      cartUtils.updateDeliverySlots(item.product_id, item.delivery_slots || []);
    });

    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStep3 = () => {
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
          truck_type: slot.truck_type,
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
  const productTypes = Array.isArray(productTypesData) ? productTypesData : productTypesData?.data || [];
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const today = new Date().toISOString().split('T')[0];

  // Filter projects for location picker dropdown
  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
      (p.delivery_address && p.delivery_address.toLowerCase().includes(projectSearchTerm.toLowerCase()))
  );

  // ==================== RENDER ====================

  return (
    <DashboardLayout menuItems={clientMenuItems}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Create Order</h1>
          <p className="text-secondary-600 mt-1">
            {currentStep === 1 && 'Set your delivery location and select products'}
            {currentStep === 2 && 'Enter project and delivery details'}
            {currentStep === 3 && 'Configure delivery schedule for each product'}
            {currentStep === 4 && 'Review your order before final submission'}
          </p>
        </div>

        {/* Wizard Progress - 4 steps */}
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
          {/* ==================== STEP 1: LOCATION + PRODUCT SELECTION ==================== */}
          {currentStep === 1 && (
            <div className="space-y-6">

              {/* ===== LOCATION SELECTOR BAR ===== */}
              <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="text-primary-600" size={20} />
                  <h3 className="font-semibold text-secondary-900 text-sm">Delivery Location</h3>
                  <span className="text-xs text-secondary-500">(optional — filters product availability)</span>
                </div>

                {/* Location is SET — show selected location with clear button */}
                {locationSource !== 'none' && (
                  <div className="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {locationSource === 'project' ? (
                        <Building2 size={16} className="text-primary-600 flex-shrink-0" />
                      ) : (
                        <Navigation size={16} className="text-primary-600 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        {locationSource === 'project' && selectedLocationProject && (
                          <p className="text-xs text-primary-600 font-medium">
                            {selectedLocationProject.name}
                          </p>
                        )}
                        <p className="text-sm text-primary-800 font-semibold truncate">
                          {locationLabel}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleClearLocation}
                      className="flex-shrink-0 p-1.5 hover:bg-primary-100 rounded-lg transition-colors"
                      title="Clear location"
                    >
                      <X size={16} className="text-primary-600" />
                    </button>
                  </div>
                )}

                {/* Location NOT set — show selection options */}
                {locationSource === 'none' && !showProjectPicker && !showCustomAddress && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setShowProjectPicker(true);
                        setShowCustomAddress(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-secondary-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-all text-secondary-600 hover:text-primary-700"
                    >
                      <Building2 size={18} />
                      <span className="font-medium text-sm">Select Project</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomAddress(true);
                        setShowProjectPicker(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-secondary-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-all text-secondary-600 hover:text-primary-700"
                    >
                      <Navigation size={18} />
                      <span className="font-medium text-sm">Enter Custom Address</span>
                    </button>
                  </div>
                )}

                {/* Project Picker Dropdown */}
                {showProjectPicker && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400"
                          size={16}
                        />
                        <input
                          type="text"
                          placeholder="Search projects..."
                          value={projectSearchTerm}
                          onChange={(e) => setProjectSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-secondary-200 rounded-lg focus:outline-none focus:border-primary-500 transition-colors"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => {
                          setShowProjectPicker(false);
                          setProjectSearchTerm('');
                        }}
                        className="p-2.5 hover:bg-secondary-100 rounded-lg transition-colors"
                      >
                        <X size={16} className="text-secondary-500" />
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-secondary-200 rounded-lg divide-y divide-secondary-100">
                      {filteredProjects.length === 0 ? (
                        <div className="p-4 text-center text-sm text-secondary-500">
                          No projects found
                        </div>
                      ) : (
                        filteredProjects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => handleLocationProjectSelect(project)}
                            className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors"
                          >
                            <p className="font-medium text-sm text-secondary-900">{project.name}</p>
                            {project.delivery_address ? (
                              <p className="text-xs text-secondary-500 mt-0.5 truncate">
                                📍 {project.delivery_address}
                              </p>
                            ) : (
                              <p className="text-xs text-red-400 mt-0.5">No address saved</p>
                            )}
                          </button>
                        ))
                      )}
                    </div>

                    {/* Switch to custom address */}
                    <button
                      onClick={() => {
                        setShowProjectPicker(false);
                        setShowCustomAddress(true);
                        setProjectSearchTerm('');
                      }}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Or enter a custom address instead →
                    </button>
                  </div>
                )}

                {/* Custom Address Input */}
                {showCustomAddress && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <MapPin
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 z-10"
                          size={16}
                        />
                        <Autocomplete
                          key={addressKey}
                          apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                          onPlaceSelected={handleCustomPlaceSelected}
                          options={{
                            types: ['address'],
                            componentRestrictions: { country: 'au' },
                          }}
                          className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-secondary-200 rounded-lg focus:outline-none focus:border-primary-500 transition-colors"
                          placeholder="Start typing delivery address..."
                        />
                      </div>
                      <button
                        onClick={() => {
                          setShowCustomAddress(false);
                          setAddressKey((prev) => prev + 1);
                        }}
                        className="p-2.5 hover:bg-secondary-100 rounded-lg transition-colors"
                      >
                        <X size={16} className="text-secondary-500" />
                      </button>
                    </div>

                    {/* Switch to project picker */}
                    <button
                      onClick={() => {
                        setShowCustomAddress(false);
                        setShowProjectPicker(true);
                        setAddressKey((prev) => prev + 1);
                      }}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Or select from your projects instead →
                    </button>
                  </div>
                )}
              </div>

              {/* ===== SEARCH & FILTERS ===== */}
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
                      className="w-full pl-10 pr-4 py-3 border-2 border-secondary-200 rounded-lg focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>

                  {/* Product Type Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowProductTypeDropdown(!showProductTypeDropdown)}
                      className="flex items-center gap-2 px-4 py-3 border-2 border-secondary-200 rounded-lg hover:border-primary-400 transition-colors bg-white min-w-[200px]"
                    >
                      <Filter size={18} className="text-secondary-500" />
                      <span className="text-sm font-medium text-secondary-700 flex-1 text-left">
                        {selectedProductType || 'All Types'}
                      </span>
                      <ChevronDown size={16} className="text-secondary-400" />
                    </button>

                    {showProductTypeDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowProductTypeDropdown(false)}
                        />
                        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-secondary-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                          <button
                            onClick={() => handleProductTypeSelect(undefined)}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors ${
                              !selectedProductType ? 'bg-primary-50 text-primary-700 font-medium' : ''
                            }`}
                          >
                            All Types
                          </button>
                          {productTypes.map((type: any) => (
                            <button
                              key={type.product_type}
                              onClick={() => handleProductTypeSelect(type.product_type)}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors ${
                                selectedProductType === type.product_type
                                  ? 'bg-primary-50 text-primary-700 font-medium'
                                  : ''
                              }`}
                            >
                              {type.product_type}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Active filters info */}
                {locationSource !== 'none' && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-secondary-500">
                    <MapPin size={12} />
                    <span>Showing availability for: <strong className="text-secondary-700">{locationLabel}</strong></span>
                  </div>
                )}
              </div>

              {/* ===== PRODUCTS GRID ===== */}
              {loadingProducts ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                  <p className="mt-4 text-secondary-600 text-sm">Loading products...</p>
                </div>
              ) : productsError ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <AlertCircle className="mx-auto text-red-500 mb-3" size={32} />
                  <p className="text-red-700 font-medium">Failed to load products</p>
                  <p className="text-red-600 text-sm mt-1">Please try again later</p>
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-12">
                  <div className="flex flex-col items-center text-center">
                    <Package className="text-secondary-400 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">No Products Found</h3>
                    <p className="text-secondary-600 text-sm mb-4">
                      {searchTerm || selectedProductType
                        ? 'Try adjusting your search or filters'
                        : 'No products available at the moment'}
                    </p>
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
              // Pre-fill from Step 1 location selection
              prefillProject={locationSource === 'project' ? selectedLocationProject : null}
              prefillLocation={
                locationSource === 'custom' && deliveryLat && deliveryLong
                  ? { address: locationLabel, lat: deliveryLat, long: deliveryLong }
                  : null
              }
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