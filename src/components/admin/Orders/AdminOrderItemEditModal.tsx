// FILE PATH: src/components/admin/Orders/AdminOrderItemEditModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Truck, Package, DollarSign, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdminOrderItem } from '../../../types/adminOrder.types';
import { useAdminUpdateOrderItem } from '../../../features/adminOrders/hooks';

interface AdminOrderItemEditModalProps {
  item: AdminOrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type DeliveryType = 'Included' | 'Supplier' | 'ThirdParty' | 'Fleet' | 'None';

const DELIVERY_TYPE_OPTIONS: Array<{ value: DeliveryType; label: string; description: string }> = [
  { value: 'Included', label: 'Included in Price', description: 'Delivery cost included in item price' },
  { value: 'Supplier', label: 'Supplier Delivery', description: 'Supplier handles delivery' },
  { value: 'ThirdParty', label: 'Third Party', description: 'External delivery service' },
  { value: 'Fleet', label: 'Fleet', description: 'Company fleet delivery' },
  { value: 'None', label: 'No Delivery', description: 'Pickup only, no delivery' },
];

const AdminOrderItemEditModal: React.FC<AdminOrderItemEditModalProps> = ({
  item,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    supplier_unit_cost: '',
    supplier_discount: '',
    delivery_cost: '',
    delivery_type: 'Supplier' as DeliveryType,
    supplier_delivery_date: '',
    supplier_notes: '',
    supplier_confirms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMutation = useAdminUpdateOrderItem();

  useEffect(() => {
    if (item) {
      setFormData({
        supplier_unit_cost: item.supplier_unit_cost?.toString() || '',
        delivery_cost: item.delivery_cost?.toString() || '',
        delivery_type: (item.delivery_type as DeliveryType) || 'Supplier',
        supplier_discount: item.supplier_discount?.toString() || '0',
        supplier_delivery_date: item.supplier_delivery_date?.split('T')[0] || '',
        supplier_notes: item.supplier_notes || '',
        supplier_confirms: Boolean(item.supplier_confirms),
      });
    }
  }, [item]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === 'delivery_type' && (value === 'None' || value === 'Included')) {
      setFormData((prev) => ({
        ...prev,
        delivery_type: value as DeliveryType,
        delivery_cost: '0',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const shouldShowDeliveryCost = () => {
    return formData.delivery_type !== 'None' && formData.delivery_type !== 'Included';
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.supplier_unit_cost || parseFloat(formData.supplier_unit_cost) < 0) {
      newErrors.supplier_unit_cost = 'Unit cost must be a positive number';
    }

    if (parseFloat(formData.supplier_discount) < 0) {
      newErrors.supplier_discount = 'Discount cannot be negative';
    }

    if (!formData.supplier_delivery_date) {
      newErrors.supplier_delivery_date = 'Delivery date is required';
    }

    if (!formData.delivery_type) {
      newErrors.delivery_type = 'Delivery type is required';
    }

    if (shouldShowDeliveryCost()) {
      if (!formData.delivery_cost || parseFloat(formData.delivery_cost) < 0) {
        newErrors.delivery_cost = 'Delivery cost must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    if (!item) return;

    const deliveryCost = shouldShowDeliveryCost() ? parseFloat(formData.delivery_cost) : 0;

    updateMutation.mutate(
      {
        orderItemId: item.id,
        payload: {
          supplier_unit_cost: parseFloat(formData.supplier_unit_cost),
          supplier_discount: parseFloat(formData.supplier_discount),
          delivery_cost: deliveryCost,
          delivery_type: formData.delivery_type,
          supplier_delivery_date: formData.supplier_delivery_date,
          supplier_notes: formData.supplier_notes,
          supplier_confirms: formData.supplier_confirms,
        },
      },
      {
        onSuccess: () => {
          toast.success('Order item updated successfully');
          onSuccess();
          onClose();
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Failed to update order item');
        },
      }
    );
  };

  const calculateItemTotal = () => {
    const unitCost = parseFloat(formData.supplier_unit_cost) || 0;
    const discount = parseFloat(formData.supplier_discount) || 0;
    const deliveryCost = shouldShowDeliveryCost() ? parseFloat(formData.delivery_cost) || 0 : 0;
    const quantity = item?.quantity || 1;
    return (unitCost * quantity - discount + deliveryCost).toFixed(2);
  };

  if (!isOpen || !item) return null;

  const isConfirmed = Boolean(item.supplier_confirms);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Admin Edit Item</h2>
                <p className="text-orange-100 text-sm">{item.product_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} className="text-white" />
            </button>
          </div>

          {/* Warning for confirmed items */}
          {isConfirmed && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-6 mt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-bold text-yellow-900">Item Already Confirmed</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This item has been confirmed. Once confirmed, it cannot be unconfirmed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="space-y-6">
              {/* Item Info */}
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Quantity:</span>
                    <span className="ml-2 font-bold text-gray-900">{item.quantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Supplier:</span>
                    <span className="ml-2 font-bold text-gray-900">
                      {item.supplier?.name || 'Not assigned'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Supplier Unit Cost */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <DollarSign size={16} className="text-blue-600" />
                  Supplier Unit Cost *
                </label>
                <input
                  type="number"
                  name="supplier_unit_cost"
                  value={formData.supplier_unit_cost}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.supplier_unit_cost ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.supplier_unit_cost && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.supplier_unit_cost}
                  </p>
                )}
              </div>

              {/* Supplier Discount */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <DollarSign size={16} className="text-green-600" />
                  Supplier Discount
                </label>
                <input
                  type="number"
                  name="supplier_discount"
                  value={formData.supplier_discount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.supplier_discount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.supplier_discount && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.supplier_discount}
                  </p>
                )}
              </div>

              {/* Delivery Type */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Truck size={16} className="text-purple-600" />
                  Delivery Type *
                </label>
                <select
                  name="delivery_type"
                  value={formData.delivery_type}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white ${
                    errors.delivery_type ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  {DELIVERY_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
                {errors.delivery_type && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.delivery_type}
                  </p>
                )}
              </div>

              {/* Delivery Cost - Conditional */}
              {shouldShowDeliveryCost() && (
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Truck size={16} className="text-indigo-600" />
                    Delivery Cost *
                  </label>
                  <input
                    type="number"
                    name="delivery_cost"
                    value={formData.delivery_cost}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required={shouldShowDeliveryCost()}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.delivery_cost ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.delivery_cost && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.delivery_cost}
                    </p>
                  )}
                </div>
              )}

              {/* Supplier Delivery Date */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-teal-600" />
                  Delivery Date *
                </label>
                <input
                  type="date"
                  name="supplier_delivery_date"
                  value={formData.supplier_delivery_date}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.supplier_delivery_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.supplier_delivery_date && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.supplier_delivery_date}
                  </p>
                )}
              </div>

              {/* Supplier Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Supplier Notes
                </label>
                <textarea
                  name="supplier_notes"
                  value={formData.supplier_notes}
                  onChange={handleChange}
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Add any notes about this item..."
                />
                <p className="text-gray-500 text-xs mt-1">
                  {formData.supplier_notes.length}/500 characters
                </p>
              </div>

              {/* Supplier Confirms */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="supplier_confirms"
                    checked={formData.supplier_confirms}
                    onChange={handleChange}
                    disabled={isConfirmed}
                    className="mt-1 w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-gray-900 block">
                      Confirm Item Pricing & Details
                    </span>
                    <span className="text-sm text-gray-600 block mt-1">
                      {isConfirmed
                        ? 'This item is already confirmed and cannot be unconfirmed.'
                        : 'Check this to confirm all pricing and delivery details are final.'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Total Preview */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-4">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Item Total Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Unit Cost × {item.quantity}:
                    </span>
                    <span className="font-medium text-gray-900">
                      ${((parseFloat(formData.supplier_unit_cost) || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  {parseFloat(formData.supplier_discount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span className="font-medium">
                        -${parseFloat(formData.supplier_discount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {shouldShowDeliveryCost() && parseFloat(formData.delivery_cost) > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Delivery:</span>
                      <span className="font-medium">
                        +${parseFloat(formData.delivery_cost).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-bold text-lg text-blue-600">
                      ${calculateItemTotal()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-200 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminOrderItemEditModal;