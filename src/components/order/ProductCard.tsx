// FILE PATH: src/components/order/ProductCard.tsx

/**
 * Product Card Component
 * 
 * UPDATED: Shows availability badge when location is set
 * - is_available === true  → Green "Available" badge
 * - is_available === false → Red "Not Available" badge + dimmed card
 * - is_available === null  → No badge (no location set)
 */

import { ShoppingCart, Check, Eye, MapPin, MapPinOff } from 'lucide-react';
import type { Product } from '../../types/order.types';
import Button from '../common/Buttons';

interface ProductCardProps {
  product: Product;
  isInCart: boolean;
  onAddToCart: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

const ProductCard = ({ product, isInCart, onAddToCart, onViewDetails }: ProductCardProps) => {
  /**
   * Safely construct image URL with null checking
   */
  const getImageUrl = () => {
    if (!product.photo) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    }

    if (product.photo.startsWith('http://') || product.photo.startsWith('https://')) {
      return product.photo;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
    return `${baseUrl}/storage/${product.photo}`;
  };

  const imageUrl = getImageUrl();

  // Determine if product is unavailable (explicitly false, not null)
  const isUnavailable = product.is_available === false;

  return (
    <div
      className={`group bg-white rounded-xl border-2 transition-all overflow-hidden relative ${
        isUnavailable
          ? 'border-secondary-200 opacity-60'
          : 'border-secondary-200 hover:border-primary-300 hover:shadow-lg'
      }`}
    >
      {/* ===== AVAILABILITY BADGE (top-right corner) ===== */}
      {product.is_available === true && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
            <MapPin size={12} />
            Available
          </span>
        </div>
      )}
      {product.is_available === false && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
            <MapPinOff size={12} />
            Not in Area
          </span>
        </div>
      )}

      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary-100">
        <img
          src={imageUrl}
          alt={product.product_name}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isUnavailable ? '' : 'group-hover:scale-110'
          }`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src =
              'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
          }}
        />

        {/* Quick Actions Overlay */}
        {onViewDetails && !isUnavailable && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
            <button
              onClick={() => onViewDetails(product)}
              className="bg-white hover:bg-primary-50 text-primary-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform"
            >
              <Eye size={16} />
              View Details
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-secondary-900 text-lg truncate">
            {product.product_name}
          </h3>
          <p className="text-sm text-secondary-600">{product.product_type}</p>
        </div>

        {/* Price */}
        <div className="text-xl font-bold text-primary-600">
          {product.price ? product.price : 'N/A'}
        </div>

        {/* Unit of Measure */}
        <div className="flex items-center justify-between py-2 px-3 bg-secondary-50 rounded-lg">
          <span className="text-xs text-secondary-600 font-medium">Unit:</span>
          <span className="text-sm font-bold text-secondary-900">{product.unit_of_measure}</span>
        </div>

        {/* Specifications Preview */}
        <p className="text-xs text-secondary-600 line-clamp-2">{product.specifications}</p>

        {/* Add to Cart Button */}
        {isUnavailable ? (
          <div className="mt-3 text-center py-2.5 px-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-600">Not available at this location</p>
          </div>
        ) : (
          <Button
            onClick={() => !isInCart && onAddToCart(product)}
            disabled={isInCart}
            variant={isInCart ? 'outline' : 'primary'}
            fullWidth
            className="mt-3"
          >
            {isInCart ? (
              <>
                <Check size={18} />
                In Cart
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                Add to Cart
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;