// src/components/order/FloatingCartBadge.tsx
/**
 * CART SIDEBAR DRAWER
 *
 * UPDATED:
 * - Now controlled via isOpen/onClose props (parent manages open state)
 * - Floating circle button REMOVED (replaced by StickyCartBar)
 * - "Proceed to Checkout" → "Continue to Delivery Details"
 * - B2B-appropriate language throughout
 */

import React from 'react';
import { ShoppingCart, X, Trash2, Package } from 'lucide-react';
import type { CartItem } from '../../types/order.types';
import Button from '../common/Buttons';

interface FloatingCartBadgeProps {
  itemCount: number;
  cartItems: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onProceedToNext: () => void;
}

const FloatingCartBadge: React.FC<FloatingCartBadgeProps> = ({
  itemCount,
  cartItems,
  isOpen,
  onClose,
  onRemoveItem,
  onProceedToNext,
}) => {
  const getImageUrl = (photo: string | null | undefined) => {
    if (!photo) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }
    return photo.startsWith('http')
      ? photo
      : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '/storage')}/${photo}`;
  };

  const handleProceed = () => {
    onClose();
    onProceedToNext();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 animate-slideInRight overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="text-white" size={24} />
            <div>
              <h3 className="text-white font-bold text-lg">Your Order</h3>
              <p className="text-primary-100 text-xs">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
                <Package className="text-secondary-400" size={32} />
              </div>
              <h4 className="font-semibold text-secondary-900 mb-1">No products selected</h4>
              <p className="text-sm text-secondary-500">
                Add products from the catalog to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.product_id}
                  className="bg-secondary-50 rounded-xl p-3 border border-secondary-100"
                >
                  <div className="flex gap-3">
                    {/* Product Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-secondary-200">
                      <img
                        src={getImageUrl(item.product_photo)}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getImageUrl(null);
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-secondary-900 text-sm truncate">
                        {item.product_name}
                      </h4>
                      <p className="text-xs text-secondary-500 mt-0.5">
                        {item.product_type} · {item.unit_of_measure}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                          Qty: {item.quantity}
                        </span>
                        <button
                          onClick={() => onRemoveItem(item.product_id)}
                          className="ml-auto w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors text-red-600"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Custom Blend Note */}
                  {item.custom_blend_mix && (
                    <div className="mt-2 text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      <span className="font-semibold text-amber-900">Custom Mix:</span>
                      <span className="text-amber-800 ml-1">{item.custom_blend_mix}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-secondary-200 p-4 bg-secondary-50 space-y-3">
            {/* Pricing Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900 leading-relaxed">
                💡 <span className="font-semibold">Pricing:</span> Final costs will be
                calculated based on delivery location. You'll receive an invoice within
                20 minutes after placing your order.
              </p>
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleProceed}
              variant="primary"
              fullWidth
              className="py-3 text-base font-semibold"
            >
              Continue to Delivery Details →
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default FloatingCartBadge;