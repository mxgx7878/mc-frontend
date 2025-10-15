// src/components/order/ProductDetailModal.tsx
import React from 'react';
import { X, Package, Tag, Ruler, FileText, Info } from 'lucide-react';
import type { Product } from '../../types/order.types';
import Button from '../common/Buttons';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  isInCart: boolean;
  onAddToCart: (product: Product) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  isInCart,
  onAddToCart,
}) => {
  if (!isOpen || !product) return null;

  const getImageUrl = (photo: string) => {
    return photo.startsWith('http')
      ? photo
      : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '/storage')}/${photo}`;
  };

  const getTechDocUrl = (techDoc: string | null) => {
    if (!techDoc) return null;
    return techDoc.startsWith('http')
      ? techDoc
      : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/${techDoc}`;
  };

  const handleAddToCart = () => {
    onAddToCart(product);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Product Details</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Left: Image */}
            <div className="space-y-4">
              <div className="aspect-square rounded-xl overflow-hidden bg-secondary-100 border-2 border-secondary-200">
                <img
                  src={getImageUrl(product.photo)}
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                  }}
                />
              </div>

              {/* Category Badge */}
              <div className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">
                <Tag className="text-primary-600" size={18} />
                <span className="text-sm font-medium text-primary-700">
                  {product.category.name}
                </span>
              </div>
            </div>

            {/* Right: Details */}
            <div className="space-y-6">
              {/* Product Name */}
              <div>
                <h3 className="text-2xl font-bold text-secondary-900 mb-2">
                  {product.product_name}
                </h3>
                <div className="flex items-center gap-2 text-secondary-600">
                  <Package size={18} />
                  <span className="font-medium">{product.product_type}</span>
                </div>
              </div>

              {/* Unit of Measure */}
              <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
                <div className="flex items-center gap-2 mb-1">
                  <Ruler className="text-secondary-600" size={18} />
                  <span className="text-sm font-semibold text-secondary-700">
                    Unit of Measure
                  </span>
                </div>
                <p className="text-lg font-bold text-secondary-900 ml-7">
                  {product.unit_of_measure}
                </p>
              </div>

              {/* Specifications */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Info className="text-secondary-600" size={20} />
                  <h4 className="font-semibold text-secondary-900">Specifications</h4>
                </div>
                <p className="text-secondary-700 leading-relaxed bg-secondary-50 rounded-lg p-4 border border-secondary-200">
                  {product.specifications}
                </p>
              </div>

              {/* Technical Documentation */}
              {product.tech_doc && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="text-blue-600" size={18} />
                    <span className="text-sm font-semibold text-blue-900">
                      Technical Documentation
                    </span>
                  </div>
                  <a
                    href={getTechDocUrl(product.tech_doc) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Download Technical Specifications →
                  </a>
                </div>
              )}

              {/* Pricing Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900 leading-relaxed">
                  <span className="font-semibold">📋 Note:</span> Final pricing will be 
                  calculated after order placement based on delivery location and supplier 
                  availability. You'll receive a detailed invoice within 20 minutes of 
                  order confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-secondary-200 px-6 py-4 bg-secondary-50">
          <div className="flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              fullWidth={false}
              className="px-6"
            >
              Close
            </Button>
            <Button
              type="button"
              variant={isInCart ? 'outline' : 'primary'}
              onClick={handleAddToCart}
              disabled={isInCart}
              fullWidth={false}
              className="px-8"
            >
              {isInCart ? '✓ Already in Cart' : '+ Add to Cart'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;