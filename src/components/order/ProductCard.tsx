// src/components/order/ProductCard.tsx
import { ShoppingCart, Check, Eye } from 'lucide-react';
import type { Product } from '../../types/order.types';
import Button from '../common/Buttons';

interface ProductCardProps {
  product: Product;
  isInCart: boolean;
  onAddToCart: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

const ProductCard = ({ product, isInCart, onAddToCart, onViewDetails }: ProductCardProps) => {
  const imageUrl = product.photo.startsWith('http') 
    ? product.photo 
    : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '/storage')}/${product.photo}`;

  return (
    <div className="group bg-white rounded-xl border-2 border-secondary-200 hover:border-primary-300 hover:shadow-lg transition-all overflow-hidden">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary-100">
        <img
          src={imageUrl}
          alt={product.product_name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
          }}
        />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold text-primary-700 px-3 py-1 rounded-full shadow-sm">
            {product.category.name}
          </span>
        </div>

        {/* Quick Actions Overlay */}
        {onViewDetails && (
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

        {/* Unit of Measure */}
        <div className="flex items-center justify-between py-2 px-3 bg-secondary-50 rounded-lg">
          <span className="text-xs text-secondary-600 font-medium">Unit:</span>
          <span className="text-sm font-bold text-secondary-900">{product.unit_of_measure}</span>
        </div>

        {/* Specifications Preview */}
        <p className="text-xs text-secondary-600 line-clamp-2">
          {product.specifications}
        </p>

        {/* Add to Cart Button */}
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
      </div>
    </div>
  );
};

export default ProductCard;