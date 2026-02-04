// src/components/client/orderEdit/AddItemModal.tsx
/**
 * ADD ITEM MODAL
 * 
 * Modal for adding new products to an existing order:
 * - Search products by name
 * - Filter by product type
 * - Paginated product list
 * - Select product
 * - Set quantity
 * - Configure split deliveries
 * 
 * FLOW:
 * 1. Search/browse products
 * 2. Click product to select
 * 3. Set quantity
 * 4. Add delivery slots (split if needed)
 * 5. Validate and add to order
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Search,
  Package,
  Plus,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ordersAPI } from '../../../api/handlers/orders.api';
import type { AddItemPayload, EditDeliveryPayload } from '../../../types/orderEdit.types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: AddItemPayload) => void;
  existingProductIds: number[]; // Products already in order (to show warning)
}

interface LocalDelivery {
  localId: string;
  quantity: number;
  delivery_date: string;
  delivery_time: string;
}

type ModalStep = 'select' | 'configure';

/**
 * Format time for API (H:i format) or null
 */
const formatTimeForApi = (time: string | null | undefined): string | null => {
  if (!time || time.trim() === '') return null;
  const parts = time.split(':');
  if (parts.length >= 2) {
    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1].padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  return null;
};

const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingProductIds,
}) => {
  // Modal step state
  const [step, setStep] = useState<ModalStep>('select');
  
  // Product search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Selected product state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
  // Configuration state
  const [quantity, setQuantity] = useState<number>(1);
  const [deliveries, setDeliveries] = useState<LocalDelivery[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSearchTerm('');
      setDebouncedSearch('');
      setSelectedProductType('');
      setCurrentPage(1);
      setSelectedProduct(null);
      setQuantity(1);
      setDeliveries([]);
      setErrors([]);
    }
  }, [isOpen]);

  // Fetch product types
  const { data: productTypesData } = useQuery({
    queryKey: ['product-types'],
    queryFn: () => ordersAPI.getProductTypes(),
    staleTime: 5 * 60 * 1000,
    enabled: isOpen,
  });

  // Fetch products
  const { 
    data: productsData, 
    isLoading: loadingProducts,
    isFetching: fetchingProducts,
  } = useQuery({
    queryKey: ['client-products', currentPage, debouncedSearch, selectedProductType],
    queryFn: () =>
      ordersAPI.getClientProducts({
        page: currentPage,
        per_page: 8,
        search: debouncedSearch || undefined,
        product_type: selectedProductType || undefined,
      }),
    enabled: isOpen && step === 'select',
    staleTime: 30000,
  });

  const products = productsData?.data || [];
  const pagination = productsData?.meta;
  const productTypes = productTypesData?.data || [];

  // Allocation calculations
  const allocatedQty = useMemo(() => {
    return deliveries.reduce((sum, d) => sum + (d.quantity || 0), 0);
  }, [deliveries]);

  const remainingToAllocate = quantity - allocatedQty;
  const isAllocationValid = Math.abs(remainingToAllocate) < 0.01;

  // Get image URL
  const getImageUrl = (photo: string | null): string => {
    if (!photo) return '';
    return photo.startsWith('http')
      ? photo
      : `${import.meta.env.VITE_IMAGE_BASE_URL}storage/${photo}`;
  };

  // Handle product selection
  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setQuantity(1);
    // Initialize with one delivery slot
    setDeliveries([
      {
        localId: uuidv4(),
        quantity: 1,
        delivery_date: '',
        delivery_time: '08:00',
      },
    ]);
    setErrors([]);
    setStep('configure');
  };

  // Handle quantity change
  const handleQuantityChange = (newQty: number) => {
    if (newQty < 0.01) {
      setQuantity(0.01);
    } else {
      setQuantity(newQty);
    }
  };

  // Add delivery slot
  const handleAddDelivery = () => {
    const defaultQty = Math.max(0.01, remainingToAllocate);
    setDeliveries((prev) => [
      ...prev,
      {
        localId: uuidv4(),
        quantity: defaultQty > 0 ? defaultQty : 1,
        delivery_date: '',
        delivery_time: '08:00',
      },
    ]);
  };

  // Remove delivery slot
  const handleRemoveDelivery = (localId: string) => {
    if (deliveries.length <= 1) return;
    setDeliveries((prev) => prev.filter((d) => d.localId !== localId));
  };

  // Update delivery field
  const handleDeliveryChange = (
    localId: string,
    field: keyof LocalDelivery,
    value: string | number
  ) => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.localId === localId ? { ...d, [field]: value } : d
      )
    );
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!selectedProduct) {
      newErrors.push('Please select a product.');
    }

    if (quantity < 0.01) {
      newErrors.push('Quantity must be at least 0.01.');
    }

    if (!isAllocationValid) {
      if (remainingToAllocate > 0) {
        newErrors.push(
          `You have ${remainingToAllocate.toFixed(2)} unallocated. Please distribute all quantity.`
        );
      } else {
        newErrors.push(
          `Over-allocated by ${Math.abs(remainingToAllocate).toFixed(2)}. Please reduce delivery quantities.`
        );
      }
    }

    const hasEmptyDates = deliveries.some((d) => !d.delivery_date);
    if (hasEmptyDates) {
      newErrors.push('All delivery slots must have a delivery date.');
    }

    const hasZeroQty = deliveries.some((d) => !d.quantity || d.quantity <= 0);
    if (hasZeroQty) {
      newErrors.push('All delivery slots must have quantity greater than 0.');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Handle add
  const handleAdd = () => {
    if (!validateForm() || !selectedProduct) return;

    const deliveriesPayload: EditDeliveryPayload[] = deliveries.map((d) => ({
      id: null,
      quantity: d.quantity,
      delivery_date: d.delivery_date,
      delivery_time: formatTimeForApi(d.delivery_time),
    }));

    const item: AddItemPayload = {
      product_id: selectedProduct.id,
      quantity,
      deliveries: deliveriesPayload,
    };

    onAdd(item);
  };

  // Go back to product selection
  const handleBackToSelect = () => {
    setStep('select');
    setSelectedProduct(null);
    setErrors([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {step === 'configure' && (
                <button
                  onClick={handleBackToSelect}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {step === 'select' ? 'Add New Item' : 'Configure Item'}
                </h2>
                <p className="text-sm text-gray-600">
                  {step === 'select'
                    ? 'Search and select a product to add'
                    : `Set quantity and delivery schedule for ${selectedProduct?.product_name}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'select' ? (
            /* Product Selection Step */
            <div className="p-6">
              {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Product Type Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={selectedProductType}
                    onChange={(e) => {
                      setSelectedProductType(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 pr-8 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white min-w-[200px]"
                  >
                    <option value="">All Types</option>
                    {productTypes.map((type: any) => (
                      <option key={type.product_type} value={type.product_type}>
                        {type.product_type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Loading State */}
              {loadingProducts && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                  <span className="ml-3 text-gray-600">Loading products...</span>
                </div>
              )}

              {/* Products Grid */}
              {!loadingProducts && products.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {products.map((product: any) => {
                      const isExisting = existingProductIds.includes(product.id);
                      
                      return (
                        <button
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          className={`p-4 border-2 rounded-xl text-left transition-all hover:shadow-md ${
                            isExisting
                              ? 'border-amber-300 bg-amber-50 hover:border-amber-400'
                              : 'border-gray-200 bg-white hover:border-green-400 hover:bg-green-50'
                          }`}
                        >
                          {/* Product Image */}
                          <div className="w-full h-24 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                            {product.photo ? (
                              <img
                                src={getImageUrl(product.photo)}
                                alt={product.product_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-10 h-10 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <h4 className="font-semibold text-gray-900 text-sm truncate mb-1">
                            {product.product_name}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2">
                            {product.product_type}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {product.unit_of_measure}
                            </span>
                            {product.price && (
                              <span className="text-sm font-bold text-green-600">
                                {product.price}
                              </span>
                            )}
                          </div>

                          {/* Existing Warning */}
                          {isExisting && (
                            <div className="mt-2 px-2 py-1 bg-amber-100 rounded text-xs text-amber-700 font-medium">
                              Already in order
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.last_page > 1 && (
                    <div className="flex items-center justify-between border-t pt-4">
                      <span className="text-sm text-gray-600">
                        Page {pagination.current_page} of {pagination.last_page}
                        {' '}({pagination.total} products)
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1 || fetchingProducts}
                          className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                          disabled={currentPage === pagination.last_page || fetchingProducts}
                          className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {!loadingProducts && products.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
                  <p className="text-gray-600">
                    {debouncedSearch || selectedProductType
                      ? 'Try adjusting your search or filter'
                      : 'No products available'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Configuration Step */
            <div className="p-6 space-y-6">
              {/* Selected Product Info */}
              {selectedProduct && (
                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {selectedProduct.photo ? (
                      <img
                        src={getImageUrl(selectedProduct.photo)}
                        alt={selectedProduct.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{selectedProduct.product_name}</h3>
                    <p className="text-sm text-gray-600">{selectedProduct.product_type}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-gray-500">
                        Unit: {selectedProduct.unit_of_measure}
                      </span>
                      {selectedProduct.price && (
                        <span className="font-semibold text-green-600">
                          {selectedProduct.price} / {selectedProduct.unit_of_measure}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Selected</span>
                  </div>
                </div>
              )}

              {/* Quantity Input */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Order Quantity ({selectedProduct?.unit_of_measure || 'units'})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0.01)}
                  className="w-32 px-4 py-3 border-2 border-gray-200 rounded-lg text-lg font-bold focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Allocation Progress */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Delivery Allocation
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      isAllocationValid
                        ? 'text-green-600'
                        : remainingToAllocate > 0
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}
                  >
                    {allocatedQty.toFixed(2)} / {quantity.toFixed(2)} allocated
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      allocatedQty > quantity
                        ? 'bg-red-500'
                        : isAllocationValid
                        ? 'bg-green-500'
                        : 'bg-amber-500'
                    }`}
                    style={{
                      width: `${Math.min((allocatedQty / Math.max(quantity, 0.01)) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {isAllocationValid ? (
                    <span className="text-green-600">✓ Fully allocated</span>
                  ) : remainingToAllocate > 0 ? (
                    <span className="text-amber-600">
                      {remainingToAllocate.toFixed(2)} remaining to allocate
                    </span>
                  ) : (
                    <span className="text-red-600">
                      Over-allocated by {Math.abs(remainingToAllocate).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Slots */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    Delivery Schedule
                  </h4>
                  <button
                    onClick={handleAddDelivery}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium border border-green-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Slot
                  </button>
                </div>

                <div className="space-y-3">
                  {deliveries.map((delivery, index) => (
                    <div
                      key={delivery.localId}
                      className="p-4 bg-white rounded-lg border-2 border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        {/* Slot Number */}
                        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>

                        {/* Fields Grid */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Quantity */}
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min="1"
                              step="0.01"
                              value={delivery.quantity}
                              onChange={(e) =>
                                handleDeliveryChange(
                                  delivery.localId,
                                  'quantity',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>

                          {/* Date */}
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                              Delivery Date
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="date"
                                value={delivery.delivery_date}
                                onChange={(e) =>
                                  handleDeliveryChange(
                                    delivery.localId,
                                    'delivery_date',
                                    e.target.value
                                  )
                                }
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              />
                            </div>
                          </div>

                          {/* Time */}
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                              Time
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="time"
                                value={delivery.delivery_time}
                                onChange={(e) =>
                                  handleDeliveryChange(
                                    delivery.localId,
                                    'delivery_time',
                                    e.target.value
                                  )
                                }
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        {deliveries.length > 1 && (
                          <button
                            onClick={() => handleRemoveDelivery(delivery.localId)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            title="Remove slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800">Please fix the following:</p>
                      <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                        {errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={step === 'configure' ? handleBackToSelect : onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            {step === 'configure' ? 'Back' : 'Cancel'}
          </button>
          
          {step === 'configure' && (
            <button
              onClick={handleAdd}
              disabled={!isAllocationValid}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-colors ${
                isAllocationValid
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add to Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;