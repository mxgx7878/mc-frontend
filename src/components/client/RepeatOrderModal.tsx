// ============================================================================
// FILE: src/components/client/RepeatOrderModal.tsx
// ============================================================================

import { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';

const RepeatOrderModal = ({ isOpen, onClose, order, onSubmit, isSubmitting }: any) => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (order && order.items) {
      setItems(
        order.items.map((item: any) => ({
          product_id: item.product_id,
          product_name: item.product.product_name,
          quantity: parseFloat(item.quantity),
          unit_of_measure: item.product.unit_of_measure,
          custom_blend_mix: item.custom_blend_mix || '',
          has_custom_blend: !!item.custom_blend_mix,
        }))
      );
    }
  }, [order]);

  const handleQuantityChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].quantity = parseFloat(value) || 0;
    setItems(newItems);
  };

  const handleCustomBlendChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].custom_blend_mix = value;
    setItems(newItems);
  };

  const handleSubmit = () => {
    const payload = items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      ...(item.has_custom_blend && item.custom_blend_mix && { custom_blend_mix: item.custom_blend_mix }),
    }));
    onSubmit(payload);
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Repeat Order</h2>
              <p className="text-sm text-gray-600">Update quantities for {order.po_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                    <p className="text-sm text-gray-600">Unit: {item.unit_of_measure}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>

                  {item.has_custom_blend && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Blend/Mix
                      </label>
                      <input
                        type="text"
                        value={item.custom_blend_mix}
                        onChange={(e) => handleCustomBlendChange(index, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 32MPa, 20mm agg, slump 80"
                        disabled={isSubmitting}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              'Submit Repeat Order'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepeatOrderModal;