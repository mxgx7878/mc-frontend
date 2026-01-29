// FILE PATH: src/components/supplier/ProductCard.tsx
import { Package, Edit, Trash2, Plus, AlertCircle, Layers, CheckCircle2 } from 'lucide-react';
import type { MasterProduct , SupplierOffer} from '../../api/handlers/supplierProducts.api';
import ApproveStatusBadge from '../common/ApproveStatusBadge';
import type { BadgeStatus } from '../common/ApproveStatusBadge';



interface ProductCardProps {
  product: MasterProduct;
  onAddOffer: (product: MasterProduct) => void;
  onEditOffer: (product: MasterProduct, offer: SupplierOffer) => void;
  onRemoveOffer: (offerId: number, productName: string) => void;
}

const toBadgeStatus = (s: string): BadgeStatus => {
  switch ((s || "").toLowerCase()) {
    case "approved": return "Approved";
    case "rejected": return "Rejected";
    case "pending": default: return "Pending";
  }
};

const ProductCard = ({ product, onAddOffer, onEditOffer, onRemoveOffer }: ProductCardProps) => {
  const imageUrl = product.photo 
    ? `${import.meta.env.VITE_IMAGE_BASE_URL}storage/${product.photo}`
    : null;

  // Find if current supplier has an offer for this product
  const myOffer = product.suppliers.find(s => s.isMe === true);
  const hasOffer = !!myOffer;

  return (
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-secondary-100 hover:border-primary-200 relative">
      {/* Status Badge - Top Right */}
      {hasOffer && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            Active Offer
          </div>
        </div>
      )}

      {/* Approval Status - Top Left */}
      {!product.is_approved && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md flex items-center gap-1.5 border border-yellow-200">
            <AlertCircle size={14} />
            Pending Approval
          </div>
        </div>
      )}

      {/* Image Section */}
      <div className="relative h-56 bg-gradient-to-br from-secondary-100 to-secondary-50 overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={product.product_name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Package size={64} className="text-secondary-300 mx-auto mb-2" />
              <p className="text-secondary-400 text-sm font-medium">No Image</p>
            </div>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-4">
        {/* Product Name & Category */}
        <div>
          <h3 className="text-xl font-bold text-secondary-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.product_name}
          </h3>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Badge
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium border border-primary-100">
              <Tag size={12} />
              {product.category?.name || 'Uncategorized'}
            </span> */}
            
            {/* Product Type Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100">
              <Layers size={12} />
              {product.product_type}
            </span>
          </div>
        </div>

        {/* Specifications */}
        {product.specifications && (
          <div className="bg-secondary-50 rounded-xl p-4 border border-secondary-100">
            <p className="text-sm text-secondary-700 line-clamp-3 leading-relaxed">
              {product.specifications}
            </p>
          </div>
        )}

        {/* Unit of Measure */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-secondary-500 font-medium">Unit:</span>
          <span className="px-3 py-1 bg-secondary-100 text-secondary-900 rounded-lg font-semibold">
            {product.unit_of_measure}
          </span>
        </div>

        {/* My Offer Details (if exists) */}
        {hasOffer && myOffer && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-900">Your Offer</span>
              <ApproveStatusBadge status={toBadgeStatus(myOffer.status)} />
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-700">
                ${parseFloat(myOffer.price).toFixed(2)}
              </span>
              <span className="text-sm text-green-600">
                per {product.unit_of_measure}
              </span>
            </div>

            {/* Action Buttons for Offer */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => onEditOffer(product, myOffer)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-all font-medium shadow-sm hover:shadow-md"
              >
                <Edit size={16} />
                Edit
              </button>
              
              <button
                onClick={() => onRemoveOffer(myOffer.id, product.product_name)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-error-300 text-error-700 rounded-lg hover:bg-error-50 transition-all font-medium shadow-sm hover:shadow-md"
              >
                <Trash2 size={16} />
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Add to Offers Button (if no offer) */}
        {!hasOffer && (
          <div className="pt-2">
            <button
              onClick={() => onAddOffer(product)}
              disabled={!product.is_approved}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all shadow-md ${
                product.is_approved
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 hover:shadow-xl hover:scale-105'
                  : 'bg-secondary-200 text-secondary-500 cursor-not-allowed'
              }`}
            >
              <Plus size={20} />
              {product.is_approved ? 'Add to Offers' : 'Awaiting Approval'}
            </button>
          </div>
        )}
      </div>

      {/* Card Border Indicator */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 transition-all duration-300 ${
        hasOffer ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-primary-500 to-blue-500 opacity-0 group-hover:opacity-100'
      }`} />
    </div>
  );
};

export default ProductCard;