// src/components/client/orderEdit/AddItemModal.tsx
/**
 * ADD ITEM MODAL
 * 
 * UPDATED: Added truck_type and delivery_cost per delivery slot
 * - truck_type: visible to all users (admin + client)
 * - delivery_cost: visible to admin only (via isAdmin prop)
 * 
 * FLOW:
 * 1. Search/browse products
 * 2. Click product to select
 * 3. Set quantity
 * 4. Add delivery slots with truck type (+ delivery cost for admin)
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
  Truck,
  DollarSign,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ordersAPI } from '../../../api/handlers/orders.api';
import type { AddItemPayload, EditDeliveryPayload } from '../../../types/orderEdit.types';

// ==================== TRUCK TYPES ====================
const TRUCK_TYPES = [
  { value: 'tipper_light', label: 'Tipper Truck Light (3-6 tonnes)' },
  { value: 'tipper_medium', label: 'Tipper Truck Medium (6-11 tonnes)' },
  { value: 'tipper_heavy', label: 'Tipper Truck Heavy (11-14 tonnes)' },
  { value: 'light_rigid', label: 'Light Rigid Truck (3.5 tonnes)' },
  { value: 'medium_rigid', label: 'Medium Rigid Trucks (7 tonnes)' },
  { value: 'heavy_rigid', label: 'Heavy Rigid Trucks (16-49 tonnes)' },
  { value: 'mini_body', label: 'Mini Body Truck (8 tonnes)' },
  { value: 'body_truck', label: 'Body Truck (12 tonnes)' },
  { value: 'eight_wheeler', label: 'Eight-Wheeler Body Truck (16 tonnes)' },
  { value: 'semi', label: 'Semi (28 tonnes)' },
  { value: 'truck_dog', label: 'Truck and Dog (38 tonnes)' },
];

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: AddItemPayload) => void;
  existingProductIds: number[];
  isAdmin?: boolean; // NEW: controls delivery_cost visibility
}

interface LocalDelivery {
  localId: string;
  quantity: number;
  delivery_date: string;
  delivery_time: string;
  truck_type: string;       // NEW
  delivery_cost: number;    // NEW (admin only)
  load_size: string;
  time_interval: string;
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
  isAdmin = false,
}) => {
  // Product selection state
  const [step, setStep] = useState<ModalStep>('select');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  // Configuration state
  const [quantity, setQuantity] = useState(1);
  const [deliveries, setDeliveries] = useState<LocalDelivery[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['add-item-products', debouncedSearch, page, selectedType],
    queryFn: () =>
      ordersAPI.getClientProducts({
        page,
        search: debouncedSearch || undefined,
        product_type: selectedType,
      }),
    enabled: isOpen && step === 'select',
  });

  // Fetch product types
  const { data: productTypesData } = useQuery({
    queryKey: ['product-types'],
    queryFn: () => ordersAPI.getProductTypes(),
    enabled: isOpen,
  });

  const products = productsData?.data || [];
  const meta = productsData?.meta;
  const productTypes = Array.isArray(productTypesData) ? productTypesData : [];

  // Calculate allocation
  const allocatedQuantity = useMemo(
    () => deliveries.reduce((sum, d) => sum + (d.quantity || 0), 0),
    [deliveries]
  );
  const remainingToAllocate = useMemo(
    () => parseFloat((quantity - allocatedQuantity).toFixed(4)),
    [quantity, allocatedQuantity]
  );
  const isAllocationValid = useMemo(
    () => Math.abs(remainingToAllocate) < 0.01,
    [remainingToAllocate]
  );

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setSelectedProduct(null);
      setSearchTerm('');
      setPage(1);
      setSelectedType(undefined);
      setQuantity(1);
      setDeliveries([]);
      setErrors([]);
    }
  }, [isOpen]);

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
    setDeliveries([
      {
        localId: uuidv4(),
        quantity: 1,
        delivery_date: '',
        delivery_time: '08:00',
        truck_type: 'tipper_light',
        delivery_cost: 0,
        load_size: '',
        time_interval: '',
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
        truck_type: 'tipper_light',
        delivery_cost: 0,
        load_size: '',
        time_interval: '',
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

    const hasNoTruckType = deliveries.some((d) => !d.truck_type);
    if (hasNoTruckType) {
      newErrors.push('All delivery slots must have a truck type selected.');
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
      truck_type: d.truck_type || null,
      load_size: d.load_size || null,
      time_interval: d.time_interval || null,
      ...(isAdmin ? { delivery_cost: d.delivery_cost || 0 } : {}),
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'select' ? (
            /* ==================== STEP: SELECT PRODUCT ==================== */
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    autoFocus
                  />
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowTypeFilter(!showTypeFilter)}
                    className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    {selectedType || 'All Types'}
                  </button>
                  {showTypeFilter && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      <button
                        onClick={() => {
                          setSelectedType(undefined);
                          setShowTypeFilter(false);
                          setPage(1);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        All Types
                      </button>
                      {productTypes.map((type: string) => (
                        <button
                          key={type}
                          onClick={() => {
                            setSelectedType(type);
                            setShowTypeFilter(false);
                            setPage(1);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Product List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">No products found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {products.map((product: any) => {
                    const isExisting = existingProductIds.includes(product.id);
                    return (
                      <button
                        key={product.id}
                        onClick={() => handleSelectProduct(product)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                          isExisting
                            ? 'border-yellow-300 bg-yellow-50 hover:border-yellow-400'
                            : 'border-gray-200 bg-white hover:border-green-400'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {product.photo ? (
                              <img
                                src={getImageUrl(product.photo)}
                                alt={product.product_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900">{product.product_name}</p>
                            <p className="text-sm text-gray-600">
                              {product.product_type} · Unit: {product.unit_of_measure}
                            </p>
                          </div>
                          {product.price && (
                            <span className="text-green-600 font-bold">
                              {product.price} / {product.unit_of_measure}
                            </span>
                          )}
                          {isExisting && (
                            <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded-full">
                              Already in order
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border-2 border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {meta.last_page}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                    disabled={page === meta.last_page}
                    className="p-2 rounded-lg border-2 border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ==================== STEP: CONFIGURE ITEM ==================== */
            <div className="space-y-6">
              {/* Selected Product Info */}
              {selectedProduct && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-gray-200">
                      {selectedProduct.photo ? (
                        <img
                          src={getImageUrl(selectedProduct.photo)}
                          alt={selectedProduct.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-7 h-7 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{selectedProduct.product_name}</p>
                      <p className="text-sm text-gray-600">
                        {selectedProduct.product_type}
                      </p>
                      <p className="text-sm text-gray-600">
                        Unit: {selectedProduct.unit_of_measure}
                        {selectedProduct.price && (
                          <span className="ml-3 text-green-700 font-semibold">
                            ${parseFloat(selectedProduct.price).toFixed(2)} / {selectedProduct.unit_of_measure}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-green-700 font-medium">
                    <CheckCircle className="w-5 h-5" />
                    Selected
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Order Quantity ({selectedProduct?.unit_of_measure || 'units'})
                </label>
                <input
                  type="number"
                  min="0.20"
                  step="0.20"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
                  className="w-32 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-medium"
                />
              </div>

              {/* Delivery Allocation Bar */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900">Delivery Allocation</span>
                  <span
                    className={`text-sm font-bold ${
                      isAllocationValid ? 'text-green-600' : 'text-orange-600'
                    }`}
                  >
                    {allocatedQuantity.toFixed(2)} / {quantity.toFixed(2)} allocated
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isAllocationValid
                        ? 'bg-green-500'
                        : allocatedQuantity > quantity
                        ? 'bg-red-500'
                        : 'bg-orange-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (allocatedQuantity / quantity) * 100)}%`,
                    }}
                  />
                </div>
                {isAllocationValid && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Fully allocated
                  </p>
                )}
              </div>

              {/* Delivery Schedule */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <h3 className="font-bold text-gray-900">Delivery Schedule</h3>
                  </div>
                  <button
                    onClick={handleAddDelivery}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 border-2 border-blue-300 rounded-lg hover:bg-blue-50 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Slot
                  </button>
                </div>

                <div className="space-y-3">
                  {deliveries.map((delivery, index) => (
                    <div
                      key={delivery.localId}
                      className="p-4 rounded-lg border-2 bg-white border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        {/* Slot Number */}
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>

                        {/* Fields */}
                        <div className="flex-1 space-y-3">
                          {/* Row 1: Quantity + Truck Type */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Quantity */}
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">Quantity</label>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={delivery.quantity}
                                onChange={(e) =>
                                  handleDeliveryChange(
                                    delivery.localId,
                                    'quantity',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>

                            {/* Truck Type */}
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                Truck Type
                              </label>
                              <select
                                value={delivery.truck_type}
                                onChange={(e) =>
                                  handleDeliveryChange(delivery.localId, 'truck_type', e.target.value)
                                }
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              >
                                <option value="">Select truck type...</option>
                                {TRUCK_TYPES.map((t) => (
                                  <option key={t.value} value={t.value}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Row 2: Date + Time + Delivery Cost (admin) */}
                          <div className={`grid grid-cols-1 gap-3 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                            {/* Delivery Date */}
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Delivery Date
                              </label>
                              <input
                                type="date"
                                value={delivery.delivery_date}
                                onChange={(e) =>
                                  handleDeliveryChange(delivery.localId, 'delivery_date', e.target.value)
                                }
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>

                            {/* Time */}
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Time
                              </label>
                              <input
                                type="time"
                                value={delivery.delivery_time}
                                onChange={(e) =>
                                  handleDeliveryChange(delivery.localId, 'delivery_time', e.target.value)
                                }
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>

                            {/* Delivery Cost (Admin Only) */}
                            {isAdmin && (
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  Delivery Cost
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={delivery.delivery_cost}
                                  onChange={(e) =>
                                    handleDeliveryChange(
                                      delivery.localId,
                                      'delivery_cost',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  placeholder="0.00"
                                />
                              </div>
                            )}
                          </div>

                          {/* Row 3: Load Size + Time Interval */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                Load Size per Trip
                                <span className="text-gray-400 font-normal ml-1">optional</span>
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max={delivery.quantity}
                                placeholder="e.g. 0.2"
                                value={delivery.load_size || ''}
                                onChange={(e) =>
                                  handleDeliveryChange(delivery.localId, 'load_size', e.target.value)
                                }
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Time Between Loads
                                <span className="text-gray-400 font-normal ml-1">optional</span>
                              </label>
                              <select
                                value={delivery.time_interval || ''}
                                onChange={(e) =>
                                  handleDeliveryChange(delivery.localId, 'time_interval', e.target.value)
                                }
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              >
                                <option value="">No interval (single delivery)</option>
                                <option value="30">30 minutes</option>
                                <option value="60">1 hour</option>
                                <option value="90">1.5 hours</option>
                                <option value="120">2 hours</option>
                                <option value="150">2.5 hours</option>
                                <option value="180">3 hours</option>
                                <option value="240">4 hours</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        {deliveries.length > 1 && (
                          <button
                            onClick={() => handleRemoveDelivery(delivery.localId)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
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
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  {errors.map((error, i) => (
                    <p key={i} className="text-sm text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={step === 'configure' ? handleBackToSelect : onClose}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
          >
            {step === 'configure' ? 'Back' : 'Cancel'}
          </button>
          {step === 'configure' && (
            <button
              onClick={handleAdd}
              className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md"
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