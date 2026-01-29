// FILE PATH: src/components/supplier/OfferCard.tsx

import { useState, type FC } from 'react';
import {
  Package,
  DollarSign,
  Edit3,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Tag,
  Layers,
} from 'lucide-react';
import type { SupplierOfferItem } from '../../api/handlers/supplierProducts.api';

export interface OfferCardProps {
  offer: SupplierOfferItem;
  onEdit: (offer: SupplierOfferItem) => void;
  onRemove: (offerId: number, productName: string) => void;
}

const OfferCard: FC<OfferCardProps> = ({ offer, onEdit, onRemove }) => {
  const [imageError, setImageError] = useState(false);
  const imageBaseUrl = import.meta.env.VITE_IMG_URL || '';

  // Status badge configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Approved':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          border: 'border-green-200',
          icon: CheckCircle,
          label: 'Approved',
        };
      case 'Rejected':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          border: 'border-red-200',
          icon: XCircle,
          label: 'Rejected',
        };
      case 'Pending':
      default:
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-700',
          border: 'border-amber-200',
          icon: Clock,
          label: 'Pending',
        };
    }
  };

  // Availability badge configuration
  const getAvailabilityConfig = (availability: string) => {
    switch (availability) {
      case 'In Stock':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          dot: 'bg-emerald-500',
        };
      case 'Out of Stock':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          dot: 'bg-red-500',
        };
      case 'Limited':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-700',
          dot: 'bg-orange-500',
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          dot: 'bg-gray-500',
        };
    }
  };

  const statusConfig = getStatusConfig(offer.offer_status);
  const availabilityConfig = getAvailabilityConfig(offer.availability_status);
  const StatusIcon = statusConfig.icon;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="group bg-white rounded-2xl border border-secondary-200 shadow-sm hover:shadow-lg hover:border-primary-300 transition-all duration-300 overflow-hidden">
      {/* Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-secondary-100 to-secondary-50 overflow-hidden">
        {(offer.image_url || offer.image) && !imageError ? (
          <img
            src={`${imageBaseUrl}${offer.image_url || offer.image}`}
            alt={offer.product_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={64} className="text-secondary-300" />
          </div>
        )}

        {/* Status Badge - Top Left */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
          >
            <StatusIcon size={14} />
            {statusConfig.label}
          </span>
        </div>

        {/* Price Badge - Top Right */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold bg-white/95 backdrop-blur-sm text-primary-700 shadow-md">
            <DollarSign size={16} />
            {formatPrice(offer.price)}
          </span>
        </div>

        {/* Product Type Badge - Bottom Left */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-black/60 backdrop-blur-sm text-white">
            <Layers size={12} />
            {offer.product_type}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Product Name */}
        <h3 className="text-lg font-bold text-secondary-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
          {offer.product_name}
        </h3>

        {/* Category & Unit */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {offer.category && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-secondary-100 text-secondary-700">
              <Tag size={12} />
              {offer.category.name}
            </span>
          )}
          {offer.unit && (
            <span className="text-xs text-secondary-500">
              per {offer.unit}
            </span>
          )}
        </div>

        {/* Specifications */}
        {offer.specifications && (
          <p className="text-sm text-secondary-600 mb-4 line-clamp-2">
            {offer.specifications}
          </p>
        )}

        {/* Availability Status */}
        <div className="mb-4">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${availabilityConfig.bg} ${availabilityConfig.text}`}
          >
            <span className={`w-2 h-2 rounded-full ${availabilityConfig.dot} animate-pulse`} />
            {offer.availability_status}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-secondary-100 pt-4 mb-4">
          <p className="text-xs text-secondary-500">
            Added on {formatDate(offer.created_at)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(offer)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
          >
            <Edit3 size={16} />
            Edit Offer
          </button>
          <button
            onClick={() => onRemove(offer.offer_id, offer.product_name)}
            className="inline-flex items-center justify-center p-2.5 rounded-xl text-error-600 bg-error-50 hover:bg-error-100 transition-colors"
            title="Remove Offer"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferCard;