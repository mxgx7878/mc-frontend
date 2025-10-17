// src/components/supplier/OrderItemEditModal.tsx

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUpdateOrderItem } from '../../features/supplierOrders/hooks';
import type { SupplierOrderItem } from '../../api/handlers/supplierOrders.api';

interface OrderItemEditModalProps {
  item: SupplierOrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const OrderItemEditModal: React.FC<OrderItemEditModalProps> = ({ item, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    supplier_unit_cost: '',
    supplier_discount: '',
    supplier_delivery_date: '',
    supplier_notes: '',
    supplier_confirms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMutation = useUpdateOrderItem();

  useEffect(() => {
    if (item) {
      setFormData({
        supplier_unit_cost: item.supplier_unit_cost || '',
        supplier_discount: item.supplier_discount || '0',
        supplier_delivery_date: item.supplier_delivery_date?.split('T')[0] || '',
        supplier_notes: item.supplier_notes || '',
        supplier_confirms: item.supplier_confirms || false,
      });
    }
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error for this field
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

    if (!formData.supplier_delivery_date) {
      newErrors.supplier_delivery_date = 'Delivery date is required';
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

  if (!isOpen || !item) return null;

  const calculateItemTotal = () => {
    const unitCost = parseFloat(formData.supplier_unit_cost) || 0;
    const discount = parseFloat(formData.supplier_discount) || 0;
    return unitCost * parseFloat(item.quantity) - discount;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Order Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {item.product?.photo && (
              <img
                src={`${import.meta.env.VITE_IMG_URL}${item.product.photo}`}
                alt={item.product.product_name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {item.product?.product_name}
              </h3>
              <p className="text-sm text-gray-600">
                Quantity: {item.quantity} {item.product?.unit_of_measure}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Unit Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier Unit Cost <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="supplier_unit_cost"
              value={formData.supplier_unit_cost}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.supplier_unit_cost ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.supplier_unit_cost && (
              <p className="text-red-500 text-sm mt-1">{errors.supplier_unit_cost}</p>
            )}
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount
            </label>
            <input
              type="number"
              name="supplier_discount"
              value={formData.supplier_discount}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.supplier_discount ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.supplier_discount && (
              <p className="text-red-500 text-sm mt-1">{errors.supplier_discount}</p>
            )}
          </div>

          {/* Delivery Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="supplier_delivery_date"
              value={formData.supplier_delivery_date}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.supplier_delivery_date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.supplier_delivery_date && (
              <p className="text-red-500 text-sm mt-1">{errors.supplier_delivery_date}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="supplier_notes"
              value={formData.supplier_notes}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any special notes or instructions..."
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.supplier_notes.length}/500 characters
            </p>
          </div>

          {/* Item Total Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Item Total:</span>
              <span className="text-lg font-bold text-blue-600">
                ${calculateItemTotal().toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              ({item.quantity} × ${formData.supplier_unit_cost || 0}) - ${formData.supplier_discount || 0}
            </p>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="supplier_confirms"
              name="supplier_confirms"
              checked={formData.supplier_confirms}
              onChange={handleChange}
              disabled={item.supplier_confirms}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label htmlFor="supplier_confirms" className="text-sm text-gray-700">
              <span className="font-medium">I confirm this item</span>
              <p className="text-gray-500 mt-1">
                {item.supplier_confirms
                  ? 'This item has been confirmed and cannot be unconfirmed.'
                  : 'Once confirmed, you will not be able to unconfirm this item.'}
              </p>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderItemEditModal;