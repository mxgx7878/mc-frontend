// src/components/client/orderEdit/AddItemModal.tsx
/**
 * ADD ITEM MODAL
 *
 * UPDATED:
 * - Load size per trip is now REQUIRED
 * - Truck type auto-selects based on load_size (falls back to quantity)
 * - Auto / Manual toggle per delivery slot
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
import { getTruckTypesForUnit, autoSelectTruckType } from '../../../utils/truckTypes';

const TIME_INTERVAL_OPTIONS = [
  { value: '', label: 'No interval (single delivery)' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
  { value: '150', label: '2.5 hours' },
  { value: '180', label: '3 hours' },
  { value: '240', label: '4 hours' },
];

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: AddItemPayload) => void;
  existingProductIds: number[];
  isAdmin?: boolean;
}

interface LocalDelivery {
  localId: string;
  quantity: number;
  delivery_date: string;
  delivery_time: string;
  truck_type: string;
  delivery_cost: number;
  load_size: string;
  time_interval: string;
}

type ModalStep = 'select' | 'configure';

const formatTimeForApi = (time: string | null | undefined): string | null => {
  if (!time || time.trim() === '') return null;
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
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
  // 'auto' = truck driven by load_size/qty | 'manual' = user picks freely
  const [truckModes, setTruckModes] = useState<Record<string, 'auto' | 'manual'>>({});

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
      setTruckModes({});
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
    const newId = uuidv4();
    setDeliveries([
      {
        localId: newId,
        quantity: 1,
        delivery_date: '',
        delivery_time: '08:00',
        truck_type: autoSelectTruckType(1, product.unit_of_measure || ''),
        delivery_cost: 0,
        load_size: '',
        time_interval: '',
      },
    ]);
    setTruckModes({ [newId]: 'auto' });
    setErrors([]);
    setStep('configure');
  };

  // Handle quantity change
  const handleQuantityChange = (newQty: number) => {
    setQuantity(newQty < 0.01 ? 0.01 : newQty);
  };

  // Add delivery slot
  const handleAddDelivery = () => {
    const defaultQty = Math.max(0.01, remainingToAllocate);
    const unitOfMeasure = selectedProduct?.unit_of_measure || '';
    const newId = uuidv4();
    setTruckModes((p) => ({ ...p, [newId]: 'auto' }));
    setDeliveries((prev) => [
      ...prev,
      {
        localId: newId,
        quantity: defaultQty > 0 ? defaultQty : 1,
        delivery_date: '',
        delivery_time: '08:00',
        truck_type: autoSelectTruckType(defaultQty > 0 ? defaultQty : 1, unitOfMeasure),
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
    const unitOfMeasure = selectedProduct?.unit_of_measure || '';
    const mode = truckModes[localId] ?? 'auto';

    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.localId !== localId) return d;
        const updated = { ...d, [field]: value };

        if (mode === 'auto') {
          if (field === 'load_size') {
            const loadVal = parseFloat(value.toString()) || 0;
            updated.truck_type = autoSelectTruckType(
              loadVal > 0 ? loadVal : updated.quantity,
              unitOfMeasure
            );
          } else if (field === 'quantity') {
            const loadVal = parseFloat(d.load_size || '0') || 0;
            updated.truck_type = autoSelectTruckType(
              loadVal > 0 ? loadVal : parseFloat(value.toString()) || 0,
              unitOfMeasure
            );
          }
        }

        return updated;
      })
    );
  };

  // Toggle auto/manual truck mode
  const handleToggleTruckMode = (localId: string) => {
    const current = truckModes[localId] ?? 'auto';
    const next = current === 'auto' ? 'manual' : 'auto';
    const unitOfMeasure = selectedProduct?.unit_of_measure || '';
    setTruckModes((p) => ({ ...p, [localId]: next }));

    if (next === 'auto') {
      setDeliveries((prev) =>
        prev.map((d) => {
          if (d.localId !== localId) return d;
          const loadVal = parseFloat(d.load_size || '0') || 0;
          return {
            ...d,
            truck_type: autoSelectTruckType(
              loadVal > 0 ? loadVal : d.quantity,
              unitOfMeasure
            ),
          };
        })
      );
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!selectedProduct) newErrors.push('Please select a product.');
    if (quantity < 0.01) newErrors.push('Quantity must be at least 0.01.');

    if (!isAllocationValid) {
      if (remainingToAllocate > 0) {
        newErrors.push(`You have ${remainingToAllocate.toFixed(2)} unallocated. Please distribute all quantity.`);
      } else {
        newErrors.push(`Over-allocated by ${Math.abs(remainingToAllocate).toFixed(2)}. Please reduce delivery quantities.`);
      }
    }

    if (deliveries.some((d) => !d.delivery_date)) {
      newErrors.push('All delivery slots must have a delivery date.');
    }
    if (deliveries.some((d) => !d.quantity || d.quantity <= 0)) {
      newErrors.push('All delivery slots must have quantity greater than 0.');
    }

    const missingLoadSize = deliveries.some((d) => !d.load_size || parseFloat(d.load_size) <= 0);
    if (missingLoadSize) {
      newErrors.push('All delivery slots must have a load size per trip.');
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
      ...(isAdmin ? { delivery_cost: d.delivery_cost || null } : {}),
    }));

    onAdd({
      product_id: selectedProduct.id,
      quantity,
      deliveries: deliveriesPayload,
    });

    onClose();
  };

  if (!isOpen) return null;

  // ==================== RENDER ====================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {step === 'configure' && (
              <button
                type="button"
                onClick={() => setStep('select')}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={18} className="text-gray-600" />
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-900">
              {step === 'select' ? 'Add Product' : 'Configure Delivery'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* ===== STEP: SELECT PRODUCT ===== */}
          {step === 'select' && (
            <div className="space-y-4">
              {/* Search + Filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTypeFilter(!showTypeFilter)}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
                  >
                    <Filter size={15} />
                    {selectedType || 'All Types'}
                  </button>
                  {showTypeFilter && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                      <button
                        type="button"
                        onClick={() => { setSelectedType(undefined); setShowTypeFilter(false); }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        All Types
                      </button>
                      {productTypes.map((type: string) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => { setSelectedType(type); setShowTypeFilter(false); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Products list */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-blue-600" size={28} />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package size={40} className="mx-auto mb-2 text-gray-300" />
                  <p>No products found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {products.map((product: any) => {
                    const alreadyAdded = existingProductIds.includes(product.id);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => !alreadyAdded && handleSelectProduct(product)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                          alreadyAdded
                            ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                        }`}
                      >
                        {product.photo ? (
                          <img
                            src={getImageUrl(product.photo)}
                            alt={product.product_name}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <Package size={18} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{product.product_name}</p>
                          <p className="text-xs text-gray-500">{product.product_type} · {product.unit_of_measure}</p>
                        </div>
                        {alreadyAdded && (
                          <span className="text-xs text-gray-400 flex-shrink-0">Already added</span>
                        )}
                        {!alreadyAdded && (
                          <CheckCircle size={18} className="text-blue-400 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span className="text-xs text-gray-500">Page {page} of {meta.last_page}</span>
                  <button
                    type="button"
                    disabled={page >= meta.last_page}
                    onClick={() => setPage((p) => p + 1)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===== STEP: CONFIGURE ===== */}
          {step === 'configure' && selectedProduct && (
            <div className="space-y-5">
              {/* Selected product summary */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                {selectedProduct.photo ? (
                  <img
                    src={getImageUrl(selectedProduct.photo)}
                    alt={selectedProduct.product_name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Package size={18} className="text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{selectedProduct.product_name}</p>
                  <p className="text-xs text-gray-500">{selectedProduct.product_type} · {selectedProduct.unit_of_measure}</p>
                </div>
              </div>

              {/* Total Quantity */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Total Quantity ({selectedProduct.unit_of_measure})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <div className="mt-1 flex justify-between text-xs">
                  <span className={isAllocationValid ? 'text-green-600' : 'text-amber-600'}>
                    Allocated: {allocatedQuantity.toFixed(2)} / {quantity}
                  </span>
                  {!isAllocationValid && (
                    <span className={remainingToAllocate > 0 ? 'text-amber-600' : 'text-red-600'}>
                      {remainingToAllocate > 0
                        ? `${remainingToAllocate.toFixed(2)} remaining`
                        : `${Math.abs(remainingToAllocate).toFixed(2)} over`}
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Slots */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Delivery Slots</p>
                {deliveries.map((delivery, index) => {
                  const mode = truckModes[delivery.localId] ?? 'auto';
                  return (
                    <div
                      key={delivery.localId}
                      className="p-4 rounded-lg border-2 bg-white border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
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
                                  handleDeliveryChange(delivery.localId, 'quantity', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>

                            {/* Truck Type */}
                            <div>
                              <label className="text-xs text-gray-600 mb-1 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Truck className="w-3 h-3" /> Truck Type
                                </span>
                                <span className="flex items-center gap-0.5 bg-gray-200 rounded-full p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleTruckMode(delivery.localId)}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                                      mode === 'auto'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                  >
                                    Auto
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleTruckMode(delivery.localId)}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                                      mode === 'manual'
                                        ? 'bg-gray-700 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                  >
                                    Manual
                                  </button>
                                </span>
                              </label>
                              <select
                                value={delivery.truck_type}
                                disabled={mode === 'auto'}
                                onChange={(e) =>
                                  handleDeliveryChange(delivery.localId, 'truck_type', e.target.value)
                                }
                                className={`w-full px-3 py-2 border-2 rounded-lg text-sm transition-colors ${
                                  mode === 'auto'
                                    ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                                    : 'border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer'
                                }`}
                              >
                                {getTruckTypesForUnit(selectedProduct?.unit_of_measure || '').map((t) => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Row 2: Date + Time + Delivery Cost (admin) */}
                          <div className={`grid grid-cols-1 gap-3 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                            <div>
                              <label className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Date
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
                            <div>
                              <label className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Time
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
                            {isAdmin && (
                              <div>
                                <label className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" /> Delivery Cost
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={delivery.delivery_cost}
                                  onChange={(e) =>
                                    handleDeliveryChange(delivery.localId, 'delivery_cost', parseFloat(e.target.value) || 0)
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
                              <label className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                Load Size per Trip
                                <span className="text-red-400 ml-0.5">*</span>
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
                              <label className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Time Between Loads
                                <span className="text-gray-400 font-normal ml-1">optional</span>
                              </label>
                              <select
                                value={delivery.time_interval || ''}
                                onChange={(e) =>
                                  handleDeliveryChange(delivery.localId, 'time_interval', e.target.value)
                                }
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                              >
                                {TIME_INTERVAL_OPTIONS.map((t) => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Remove button */}
                        {deliveries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDelivery(delivery.localId)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add slot */}
                <button
                  type="button"
                  onClick={handleAddDelivery}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Plus size={16} /> Add Another Delivery Slot
                </button>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                  {errors.map((err, i) => (
                    <div key={i} className="flex items-center gap-2 text-red-700 text-sm">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      {err}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'configure' && (
          <div className="border-t border-gray-200 p-4 flex gap-3">
            <button
              type="button"
              onClick={() => setStep('select')}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Add to Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddItemModal;