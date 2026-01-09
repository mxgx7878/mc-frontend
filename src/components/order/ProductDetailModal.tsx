// src/components/order/ProductDetailModal.tsx
import React from 'react';
import { X, Tag, Ruler, FileText, Info, Download, ShoppingCart, Check } from 'lucide-react';
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

  /**
   * WHAT: Safely construct image URL with null checking
   * WHY: product.photo can be null, causing .startsWith() to throw error
   * HOW: Check if photo exists first, then determine URL type
   */
  const getImageUrl = (photo: string | null): string => {
    // If no photo, return placeholder
    if (!photo) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    }

    // Check if it's already a full URL
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }

    // Otherwise, construct storage URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
    return `${baseUrl}/storage/${photo}`;
  };

  /**
   * WHAT: Safely construct tech document URL with null checking
   * WHY: tech_doc can be null, need to handle gracefully
   * HOW: Return null if no doc, otherwise construct URL
   */
  const getTechDocUrl = (techDoc: string | null): string | null => {
    if (!techDoc) return null;

    // Check if it's already a full URL
    if (techDoc.startsWith('http://') || techDoc.startsWith('https://')) {
      return techDoc;
    }

    // Otherwise, construct storage URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
    return `${baseUrl}/${techDoc}`;
  };

  const handleAddToCart = () => {
    onAddToCart(product);
    onClose();
  };

  const techDocUrl = getTechDocUrl(product.tech_doc);

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
              <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-lg">
                <Tag className="text-primary-600" size={18} />
                <span className="text-sm font-semibold text-primary-700">
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
                <p className="text-secondary-600">{product.product_type}</p>
              </div>

              {/* Info Cards */}
              <div className="space-y-3">
                {/* Unit of Measure */}
                <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <Ruler className="text-primary-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-secondary-600 font-medium">Unit of Measure</p>
                    <p className="text-sm font-bold text-secondary-900">{product.unit_of_measure}</p>
                  </div>
                </div>

                {/* Specifications */}
                <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <Info className="text-primary-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-secondary-600 font-medium mb-2">Specifications</p>
                      <p className="text-sm text-secondary-700 leading-relaxed">
                        {product.specifications}
                      </p>
                    </div>
                  </div>
                </div>

               {/* Technical Document */}
                {techDocUrl && (
                  <a
                    href={techDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <FileText className="text-blue-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-blue-600 font-medium">Technical Documentation</p>
                      <p className="text-sm font-semibold text-blue-700">View Document</p>
                    </div>
                    <Download className="text-blue-600 group-hover:translate-y-0.5 transition-transform" size={18} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-secondary-100 px-6 py-4 flex items-center justify-between bg-secondary-50">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6"
          >
            Close
          </Button>
          
          <Button
            onClick={handleAddToCart}
            disabled={isInCart}
            variant={isInCart ? 'outline' : 'primary'}
            className="px-6"
          >
            {isInCart ? (
              <>
                <Check size={18} />
                Already in Cart
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
    </div>
  );
};

export default ProductDetailModal;