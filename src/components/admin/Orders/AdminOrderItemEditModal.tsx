// FILE PATH: src/components/admin/Orders/AdminOrderItemEditModal.tsx

/**
 * UPDATED: Removed delivery_type and delivery_cost fields
 * Backend no longer accepts these fields in updateOrderPricingAdmin
 * 
 * Fields remaining:
 * - quantity
 * - supplier_unit_cost
 * - supplier_discount
 * - supplier_notes
 * - supplier_confirms
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Package, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdminOrderItem } from '../../../types/adminOrder.types';
import { useAdminUpdateOrderItem } from '../../../features/adminOrders/hooks';

interface AdminOrderItemEditModalProps {
  item: AdminOrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminOrderItemEditModal: React.FC<AdminOrderItemEditModalProps> = ({
  item,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    supplier_unit_cost: '',
    supplier_discount: '',
    supplier_notes: '',
    supplier_confirms: false,
    quantity: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMutation = useAdminUpdateOrderItem();

  useEffect(() => {
    if (item) {
      setFormData({
        supplier_unit_cost: item.supplier_unit_cost?.toString() || '',
        supplier_discount: item.supplier_discount?.toString() || '0',
        supplier_notes: item.supplier_notes || '',
        supplier_confirms: Boolean(item.supplier_confirms),
        quantity: item.quantity?.toString() || '1',
      });
    }
  }, [item]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.supplier_unit_cost || parseFloat(formData.supplier_unit_cost) < 0) {
      newErrors.supplier_unit_cost = 'Unit cost must be a positive number';
    }

    if (parseFloat(formData.supplier_discount) < 0) {
      newErrors.supplier_discount = 'Discount cannot be negative';
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
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

    updateMutation.mutate(
      {
        orderItemId: item.id,
        payload: {
          supplier_unit_cost: parseFloat(formData.supplier_unit_cost),
          supplier_discount: parseFloat(formData.supplier_discount),
          supplier_notes: formData.supplier_notes,
          supplier_confirms: formData.supplier_confirms,
          quantity: parseFloat(formData.quantity),
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
    const qty = parseFloat(formData.quantity) || 1;
    const total = unitCost * qty - discount;
    return Math.max(0, total).toFixed(2);
  };

  if (!isOpen || !item) return null;

  const isConfirmed = Boolean(item.supplier_confirms);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border-2 border-orange-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Admin Edit Item</h3>
              <p className="text-orange-100 text-sm">Override pricing & details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Confirmed Warning */}
        {isConfirmed && (
          <div className="px-6 py-3 bg-yellow-50 border-b-2 border-yellow-200">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">
                This item is already confirmed. Confirmation cannot be undone.
              </span>
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
                  <span className="text-gray-600">Product:</span>
                  <span className="ml-2 font-bold text-gray-900">{item.product_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Supplier:</span>
                  <span className="ml-2 font-bold text-gray-900">
                    {item.supplier?.name || 'Not assigned'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Package size={16} className="text-purple-600" />
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                required
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.quantity ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="1.00"
              />
              {errors.quantity && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.quantity}
                </p>
              )}
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
                      : 'Check this to confirm all pricing details are final.'}
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
                    Unit Cost × {parseFloat(formData.quantity) || 1}:
                  </span>
                  <span className="font-medium text-gray-900">
                    $
                    {(
                      (parseFloat(formData.supplier_unit_cost) || 0) *
                      (parseFloat(formData.quantity) || 1)
                    ).toFixed(2)}
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
                <span className="animate-spin">⚙️</span>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderItemEditModal;