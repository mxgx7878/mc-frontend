// src/components/admin/SupplierZoneCard.tsx
import React, { useState } from 'react';
import { MapPin, Mail, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import type { SupplierWithZones } from '../../api/handlers/adminSupplierZones.api';

interface SupplierZoneCardProps {
  supplier: SupplierWithZones;
  color: string;
}

const SupplierZoneCard: React.FC<SupplierZoneCardProps> = ({ supplier, color }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalCoverage = supplier.delivery_zones.reduce((sum, zone) => {
    return sum + (Math.PI * zone.radius * zone.radius);
  }, 0);

  const hasZones = supplier.delivery_zones.length > 0;

  return (
    <div 
      className="bg-white rounded-xl border-2 hover:border-primary-300 hover:shadow-lg transition-all overflow-hidden"
      style={{ borderLeftColor: color, borderLeftWidth: '6px' }}
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          {/* Profile Image */}
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 border-4"
            style={{ borderColor: color + '40' }}
          >
            {supplier.profile_image ? (
              <img
                src={`${import.meta.env.VITE_IMAGE_BASE_URL}${supplier.profile_image}`}
                alt={supplier.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div 
                className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: color }}
              >
                {supplier.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Supplier Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-secondary-900 truncate mb-1">
              {supplier.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-secondary-600 mb-2">
              <Mail size={14} />
              <span className="truncate">{supplier.email}</span>
            </div>
            
            {/* Zone Stats */}
            <div className="flex items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1 text-secondary-700">
                <MapPin size={14} />
                <strong>{supplier.delivery_zones.length}</strong> Zone{supplier.delivery_zones.length !== 1 ? 's' : ''}
              </span>
              {hasZones && (
                <span className="inline-flex items-center gap-1 text-secondary-700">
                  <Layers size={14} />
                  <strong>~{totalCoverage.toFixed(0)}</strong> km²
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Zone Summary */}
        {!hasZones ? (
          <div className="bg-secondary-50 rounded-lg p-4 text-center">
            <p className="text-sm text-secondary-600">No delivery zones configured</p>
          </div>
        ) : (
          <>
            {/* Show first 2 zones */}
            <div className="space-y-2">
              {supplier.delivery_zones.slice(0, isExpanded ? undefined : 2).map((zone, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-secondary-50 rounded-lg"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 line-clamp-2 mb-1">
                      {zone.address}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-secondary-600">
                      <span>📍 {zone.lat.toFixed(4)}, {zone.long.toFixed(4)}</span>
                      <span className="font-semibold text-primary-600">{zone.radius} km radius</span>
                    </div>
                    <p className="text-xs text-secondary-500 mt-1">
                      Coverage: ~{(Math.PI * zone.radius * zone.radius).toFixed(0)} km²
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Expand/Collapse Button */}
            {supplier.delivery_zones.length > 2 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={16} />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    Show {supplier.delivery_zones.length - 2} More Zone{supplier.delivery_zones.length - 2 > 1 ? 's' : ''}
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SupplierZoneCard;