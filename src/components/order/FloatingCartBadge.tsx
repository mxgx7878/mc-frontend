// src/components/order/FloatingCartBadge.tsx
import React, { useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, Package } from 'lucide-react';
import type { CartItem } from '../../types/order.types';
import Button from '../common/Buttons';

interface FloatingCartBadgeProps {
  itemCount: number;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onProceedToCheckout: () => void;
}

const FloatingCartBadge: React.FC<FloatingCartBadgeProps> = ({
  itemCount,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getImageUrl = (photo: string) => {
    return photo.startsWith('http')
      ? photo
      : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '/storage')}/${photo}`;
  };

  const handleProceed = () => {
    setIsOpen(false);
    onProceedToCheckout();
  };

  return (
    <>
      {/* Floating Badge Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-2xl hover:shadow-primary-300 transition-all hover:scale-110 active:scale-95"
        aria-label="View cart"
      >
        <ShoppingCart size={24} />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-white animate-bounce">
            {itemCount}
          </span>
        )}
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 animate-slideInRight overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="text-white" size={24} />
                <div>
                  <h3 className="text-white font-bold text-lg">Your Cart</h3>
                  <p className="text-primary-100 text-xs">{itemCount} item(s)</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center">
                    <Package className="text-secondary-400" size={40} />
                  </div>
                  <div>
                    <p className="font-semibold text-secondary-900">Your cart is empty</p>
                    <p className="text-sm text-secondary-600 mt-1">Add some products to get started</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.product_id}
                      className="bg-white border-2 border-secondary-200 rounded-xl p-3 hover:border-primary-300 transition-all"
                    >
                      <div className="flex gap-3">
                        {/* Product Image */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary-100 flex-shrink-0">
                          <img
                            src={getImageUrl(item.product_photo)}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                            }}
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-secondary-900 text-sm truncate">
                            {item.product_name}
                          </h4>
                          <p className="text-xs text-secondary-600">{item.product_type}</p>
                          <p className="text-xs text-primary-600 font-medium mt-1">
                            Unit: {item.unit_of_measure}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-secondary-100 hover:bg-secondary-200 flex items-center justify-center transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-10 text-center font-semibold text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg bg-primary-100 hover:bg-primary-200 flex items-center justify-center transition-colors text-primary-700"
                            >
                              <Plus size={14} />
                            </button>
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

                {/* Proceed Button */}
                <Button
                  onClick={handleProceed}
                  variant="primary"
                  fullWidth
                  className="py-3 text-base font-semibold"
                >
                  Proceed to Checkout →
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default FloatingCartBadge;