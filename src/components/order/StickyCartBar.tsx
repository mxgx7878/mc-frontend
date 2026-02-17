// src/components/order/StickyCartBar.tsx
/**
 * STICKY CART BAR — Always-visible bottom action bar on Step 1
 *
 * WHY THIS EXISTS:
 * Client feedback: "Clicking the cart to progress isn't intuitive."
 * The floating cart icon buried the primary CTA behind two clicks.
 * This bar makes the "next step" action permanently visible.
 *
 * DESIGN:
 * - Sticks to bottom of viewport (above mobile nav if any)
 * - Shows: item count, quick summary, "Continue to Delivery Details →"
 * - Cart icon opens the FloatingCartBadge sidebar for editing items
 * - Slides up with animation when first item is added
 * - B2B language: "Continue to Delivery Details", NOT "Checkout"
 */

import React from 'react';
import { ShoppingCart, ArrowRight, Package } from 'lucide-react';
import type { CartItem } from '../../types/order.types';

interface StickyCartBarProps {
  cartItems: CartItem[];
  totalItems: number;
  onContinue: () => void;
  onOpenCart: () => void;
}

const StickyCartBar: React.FC<StickyCartBarProps> = ({
  cartItems,
  totalItems,
  onContinue,
  onOpenCart,
}) => {
  if (cartItems.length === 0) return null;

  const uniqueProducts = cartItems.length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 animate-slideUp">
      {/* Top shadow/gradient for visual separation */}
      <div className="h-6 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />

      {/* Bar */}
      <div className="bg-white border-t border-secondary-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-4">
            {/* Cart summary — clickable to open sidebar */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-secondary-50 hover:bg-secondary-100 border border-secondary-200 transition-all group"
            >
              <div className="relative">
                <ShoppingCart size={20} className="text-secondary-600 group-hover:text-primary-600 transition-colors" />
                <span className="absolute -top-2 -right-2.5 bg-primary-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-secondary-900">
                  {uniqueProducts} {uniqueProducts === 1 ? 'product' : 'products'}
                </p>
                <p className="text-xs text-secondary-500">Tap to view & edit</p>
              </div>
            </button>

            {/* Product pills (show first 3 on larger screens) */}
            <div className="hidden md:flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
              {cartItems.slice(0, 3).map((item) => (
                <span
                  key={item.product_id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-100 rounded-full text-xs font-medium text-primary-700 whitespace-nowrap"
                >
                  <Package size={12} />
                  {item.product_name}
                  <span className="text-primary-500">×{item.quantity}</span>
                </span>
              ))}
              {cartItems.length > 3 && (
                <span className="text-xs text-secondary-400 font-medium whitespace-nowrap">
                  +{cartItems.length - 3} more
                </span>
              )}
            </div>

            {/* Primary CTA */}
            <button
              onClick={onContinue}
              className="ml-auto flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-sm sm:text-base whitespace-nowrap"
            >
              Continue to Delivery Details
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyCartBar;