// FILE PATH: src/components/supplier/ProductCard.tsx
import { Package, Edit, Trash2, Plus, AlertCircle } from 'lucide-react';
import { MasterProduct, SupplierOffer } from '../../api/handlers/supplierProducts.api';
import Button from '../common/Buttons';
import StatusBadge from '../common/StatusBadge';

interface ProductCardProps {
  product: MasterProduct;
  onAddOffer: (product: MasterProduct) => void;
  onEditOffer: (product: MasterProduct, offer: SupplierOffer) => void;
  onRemoveOffer: (offerId: number, productName: string) => void;
}

const ProductCard = ({ product, onAddOffer, onEditOffer, onRemoveOffer }: ProductCardProps) => {
  const imageUrl = product.photo 
    ? `${import.meta.env.VITE_IMAGE_BASE_URL}storage/${product.photo}`
    : null;

  // Find if current supplier has an offer for this product
  const myOffer = product.suppliers.find(s => s.isMe === true);
  const hasOffer = !!myOffer;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-secondary-100">
      <div className="flex gap-4 p-6">
        {/* Product Image */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={product.product_name}
              className="w-24 h-24 object-cover rounded-lg border border-secondary-200"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UzZTNlMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
              }}
            />
          ) : (
            <div className="w-24 h-24 bg-secondary-100 rounded-lg flex items-center justify-center">
              <Package size={32} className="text-secondary-400" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                {product.product_name}
              </h3>
              <div className="flex items-center gap-3 text-sm text-secondary-600 mb-2">
                <span className="flex items-center gap-1">
                  <Package size={14} />
                  {product.category.name}
                </span>
                <span className="text-secondary-300">•</span>
                <span>{product.unit_of_measure}</span>
              </div>
              
              {product.specifications && (
                <p className="text-sm text-secondary-600 line-clamp-2 mb-3">
                  {product.specifications}
                </p>
              )}

              {/* Offer Status */}
              {hasOffer && myOffer ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-secondary-700">Price:</span>
                    <span className="text-lg font-bold text-primary-600">
                      ${parseFloat(myOffer.price).toFixed(2)}
                    </span>
                    <span className="text-sm text-secondary-500">
                      per {product.unit_of_measure}
                    </span>
                  </div>
                  
                  <StatusBadge 
                    status={myOffer.availability_status === 'In Stock' ? 'active' : 'inactive'}
                    label={myOffer.availability_status}
                  />

                  {myOffer.status === 'Pending' && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      <AlertCircle size={14} />
                      Pending Admin Approval
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-secondary-500">
                  <Plus size={16} />
                  <span className="text-sm font-medium">Not in your offers</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {hasOffer && myOffer ? (
                <>
                  <Button
                    onClick={() => onEditOffer(product, myOffer)}
                    variant="outline"
                    fullWidth={false}
                    className="!px-3 !py-2"
                  >
                    <Edit size={16} />
                    Edit
                  </Button>
                  <Button
                    onClick={() => onRemoveOffer(myOffer.id, product.product_name)}
                    variant="danger"
                    fullWidth={false}
                    className="!px-3 !py-2"
                  >
                    <Trash2 size={16} />
                    Remove
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => onAddOffer(product)}
                  variant="primary"
                  fullWidth={false}
                  className="!px-4 !py-2"
                >
                  <Plus size={16} />
                  Add to Offers
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;