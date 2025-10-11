// src/components/supplier/DeliveryZonesManagement.tsx - COMPLETE WITH JSX
import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  Map as MapIcon,
  Grid3X3,
  Loader2,
  AlertCircle,
  Save,
  X,
  Radius,
  Navigation
} from 'lucide-react';
import Autocomplete from 'react-google-autocomplete';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import DeliveryZonesMapView from './DeliveryZonesMapView';
import { zonesAPI } from '../../api/handlers/zones.api';

// ==================== TYPES ====================
interface DeliveryZone {
  address: string;
  lat: number;
  long: number;
  radius: number;
  id?: string;
}

interface ZoneFormData {
  address: string;
  lat: number | null;
  long: number | null;
  radius: number;
}

// ==================== UTILITY FUNCTIONS ====================
const calculateCoverageArea = (radius: number): string => {
  const area = Math.PI * radius * radius;
  return area.toFixed(0);
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// ==================== ZONE CARD COMPONENT ====================
const ZoneCard: React.FC<{
  zone: DeliveryZone;
  onEdit: (zone: DeliveryZone) => void;
  onDelete: (zone: DeliveryZone) => void;
}> = ({ zone, onEdit, onDelete }) => {
  const coverageArea = calculateCoverageArea(zone.radius);
  
  return (
    <div className="bg-white rounded-xl border-2 border-secondary-200 p-6 hover:border-primary-300 hover:shadow-lg transition-all">
      <div className="w-full h-32 bg-secondary-100 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-200 opacity-50"></div>
        <MapPin size={40} className="text-primary-600 relative z-10" />
      </div>
      
      <div className="space-y-3 mb-4">
        <div>
          <p className="text-xs text-secondary-500 mb-1">Address</p>
          <p className="font-semibold text-secondary-900 line-clamp-2">{zone.address}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-secondary-500 mb-1">Coordinates</p>
            <p className="text-sm font-medium text-secondary-700">
              {zone.lat.toFixed(4)}, {zone.long.toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-xs text-secondary-500 mb-1">Coverage</p>
            <p className="text-sm font-medium text-primary-600">~{coverageArea} km²</p>
          </div>
        </div>
        
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
          <Radius size={16} className="text-primary-600" />
          <span className="text-sm font-semibold text-primary-700">{zone.radius} km radius</span>
        </div>
      </div>
      
      <div className="flex gap-2 pt-4 border-t border-secondary-200">
        <button
          onClick={() => onEdit(zone)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg transition-colors font-medium"
        >
          <Edit2 size={16} />
          Edit
        </button>
        <button
          onClick={() => onDelete(zone)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-error-50 hover:bg-error-100 text-error-600 rounded-lg transition-colors font-medium"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
};

// ==================== ZONE MODAL COMPONENT ====================
const ZoneModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (zone: Omit<DeliveryZone, 'id'>) => void;
  editingZone?: DeliveryZone | null;
}> = ({ isOpen, onClose, onSave, editingZone }) => {
  const [formData, setFormData] = useState<ZoneFormData>({
    address: '',
    lat: null,
    long: null,
    radius: 20
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // ✅ NEW: Track if address input should be controlled
  const [addressValue, setAddressValue] = useState('');

  // ✅ FIXED: Reset form when modal opens or editingZone changes
  useEffect(() => {
    if (isOpen) {
      if (editingZone) {
        setFormData({
          address: editingZone.address,
          lat: editingZone.lat,
          long: editingZone.long,
          radius: editingZone.radius
        });
        setAddressValue(editingZone.address);
      } else {
        setFormData({
          address: '',
          lat: null,
          long: null,
          radius: 20
        });
        setAddressValue('');
      }
      setErrors({});
    }
  }, [editingZone, isOpen]);

  const handlePlaceSelected = useCallback((place: any) => {
    console.log('🗺️ Place Selected:', place);
    
    if (place.formatted_address) {
      setFormData(prev => ({ ...prev, address: place.formatted_address }));
      setAddressValue(place.formatted_address); // ✅ Update controlled value
    }
    
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      
      console.log('📍 Coordinates:', { lat, lng });
      
      setFormData(prev => ({
        ...prev,
        lat,
        long: lng
      }));
      
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.location;
        delete newErrors.address;
        return newErrors;
      });
    }
  }, []);

  // ✅ NEW: Handle manual address input changes
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddressValue(value);
    setFormData(prev => ({ ...prev, address: value }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.address) {
      newErrors.address = 'Address is required';
    }
    if (!formData.lat || !formData.long) {
      newErrors.location = 'Please select a valid address from Google suggestions';
    }
    if (formData.radius < 5) {
      newErrors.radius = 'Minimum radius is 5 km';
    }
    if (formData.radius > 200) {
      newErrors.radius = 'Maximum radius is 200 km';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    
    console.log('💾 Submitting zone data:', formData); // ✅ Debug log
    
    onSave({
      address: formData.address,
      lat: formData.lat!,
      long: formData.long!,
      radius: formData.radius
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">
              {editingZone ? 'Edit Delivery Zone' : 'Add Delivery Zone'}
            </h2>
            <p className="text-sm text-secondary-600 mt-1">
              Define your service area with address and radius
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-secondary-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Business Address <span className="text-error-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 text-secondary-400 z-10" size={20} />
              {/* ✅ FIXED: Added key prop to force re-render + value prop for controlled input */}
              <Autocomplete
                key={editingZone?.address || 'new'} // Force re-mount when switching zones
                apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                onPlaceSelected={handlePlaceSelected}
                options={{ 
                  types: ['address'],
                  componentRestrictions: { country: 'au' }
                }}
                defaultValue={addressValue} // Use state value
                onChange={handleAddressChange} // ✅ Handle manual typing
                className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all ${
                  errors.address || errors.location
                    ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
                    : 'border-secondary-200 focus:border-primary-500 focus:ring-primary-500'
                } focus:outline-none focus:ring-2 focus:ring-opacity-20`}
                placeholder="Start typing your business address..."
              />
            </div>
            {(errors.address || errors.location) && (
              <p className="text-sm text-error-500 mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.address || errors.location}
              </p>
            )}
            <p className="text-xs text-secondary-500 mt-2">
              💡 Type your address and select from Google suggestions
            </p>
          </div>

          {formData.lat && formData.long && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-4">
              <p className="text-sm font-medium text-success-900 mb-2 flex items-center gap-2">
                <MapPin size={16} />
                Location Confirmed ✓
              </p>
              <p className="text-xs text-success-700">
                Coordinates: {formData.lat.toFixed(6)}, {formData.long.toFixed(6)}
              </p>
              <p className="text-xs text-success-600 mt-1 line-clamp-2">
                Address: {formData.address}
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-secondary-700">
                Delivery Radius <span className="text-error-500">*</span>
              </label>
              <span className="text-lg font-bold text-primary-600">
                {formData.radius} km
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={formData.radius}
              onChange={(e) => {
                const newRadius = Number(e.target.value);
                console.log('🎚️ Radius changed to:', newRadius); // ✅ Debug log
                setFormData(prev => ({ ...prev, radius: newRadius }));
              }}
              className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-secondary-500 mt-1">
              <span>5 km</span>
              <span>200 km</span>
            </div>
            {errors.radius && (
              <p className="text-sm text-error-500 mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.radius}
              </p>
            )}
          </div>

          {formData.lat && formData.long && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <p className="text-sm font-medium text-primary-900 mb-2">
                📊 Coverage Information
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-primary-600">Coverage Area</p>
                  <p className="font-bold text-primary-900">
                    ~{calculateCoverageArea(formData.radius)} km²
                  </p>
                </div>
                <div>
                  <p className="text-primary-600">Radius</p>
                  <p className="font-bold text-primary-900">{formData.radius} km</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-secondary-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {editingZone ? 'Update Zone' : 'Add Zone'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const DeliveryZonesManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<'card' | 'map'>('card');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeliveryZone | null>(null);

  // ✅ DEBUG: Check API key
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    console.log('🔑 Google Maps API Key:', apiKey ? `Loaded (${apiKey.substring(0, 10)}...)` : 'Missing ❌');
  }, []);

  // ✅ Fetch zones using React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: zonesAPI.getZones,
  });

  const zones: DeliveryZone[] = data?.delivery_zones.map(zone => ({
    ...zone,
    id: generateId()
  })) || [];

  // ✅ Save zones mutation
  const saveZonesMutation = useMutation({
    mutationFn: zonesAPI.saveZones,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      toast.success('✅ ' + response.message);
    },
    onError: (error: any) => {
      toast.error('❌ ' + (error?.message || 'Failed to save zones'));
    },
  });

  const handleAddZone = (newZone: Omit<DeliveryZone, 'id'>) => {
    const allZones = [...zones.map(({ id, ...z }) => z), newZone];
    saveZonesMutation.mutate(allZones, {
      onSuccess: () => {
        setIsModalOpen(false);
        setEditingZone(null);
      }
    });
  };

  const handleEditZone = (updatedZone: Omit<DeliveryZone, 'id'>) => {
    if (!editingZone) return;
    
    // Map through zones and replace the one being edited
    const allZones = zones.map(zone => {
        if (zone.lat === editingZone.lat && zone.long === editingZone.long) {
        // Return the updated zone data (without frontend id)
        return {
            address: updatedZone.address,
            lat: updatedZone.lat,
            long: updatedZone.long,
            radius: updatedZone.radius,
        };
        }
        // Return other zones without their frontend id
        return {
        address: zone.address,
        lat: zone.lat,
        long: zone.long,
        radius: zone.radius,
        };
    });
  
    console.log('🔄 Updating zones:', allZones); // Debug log
    
    saveZonesMutation.mutate(allZones, {
        onSuccess: () => {
        setIsModalOpen(false);
        setEditingZone(null);
        }
    });
};

// ✅ FIXED: Delete Zone Handler
const handleDeleteZone = (zoneToDelete: DeliveryZone) => {
    // Filter out the deleted zone and clean the data
    console.log('🗑️ Deleting zone:', zoneToDelete); // Debug log
    const remainingZones = zones
        .filter(zone => (zone.lat !== zoneToDelete.lat && zone.long !== zoneToDelete.long))
        .map(zone => ({
        address: zone.address,
        lat: zone.lat,
        long: zone.long,
        radius: zone.radius,
        }));
    
    console.log('🗑️ Deleting zone, remaining:', remainingZones); // Debug log
    
    saveZonesMutation.mutate(remainingZones, {
        onSuccess: () => {
        setDeleteConfirm(null);
        }
    });
    };

  const openEditModal = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingZone(null);
    setIsModalOpen(true);
  };

  const isSaving = saveZonesMutation.isPending;

  return (
    <div className="min-h-screen bg-secondary-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 flex items-center gap-3">
              <MapPin size={32} className="text-primary-600" />
              Delivery Zones
            </h1>
            <p className="text-secondary-600 mt-2">
              Manage your service areas and delivery coverage
            </p>
          </div>
          <button
            onClick={openAddModal}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <Plus size={20} />
            Add Delivery Zone
          </button>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-xl border-2 border-secondary-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <MapPin size={24} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-600">Total Zones</p>
                <p className="text-2xl font-bold text-secondary-900">{zones.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-success-100 flex items-center justify-center">
                <Radius size={24} className="text-success-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-600">Total Coverage</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {zones.reduce((sum, z) => sum + parseFloat(calculateCoverageArea(z.radius)), 0).toFixed(0)} km²
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-warning-100 flex items-center justify-center">
                <Navigation size={24} className="text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-600">Avg. Radius</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {zones.length > 0 ? (zones.reduce((sum, z) => sum + z.radius, 0) / zones.length).toFixed(0) : 0} km
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="bg-white rounded-xl border-2 border-secondary-200 p-2 inline-flex gap-2">
          <button
            onClick={() => setActiveView('card')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
              activeView === 'card'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'text-secondary-600 hover:bg-secondary-50'
            }`}
          >
            <Grid3X3 size={20} />
            Card View
          </button>
          <button
            onClick={() => setActiveView('map')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
              activeView === 'map'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'text-secondary-600 hover:bg-secondary-50'
            }`}
          >
            <MapIcon size={20} />
            Map View
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="text-primary-600 animate-spin mb-4" />
            <p className="text-secondary-600">Loading delivery zones...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-xl p-6 text-center">
            <AlertCircle size={48} className="text-error-500 mx-auto mb-4" />
            <p className="text-error-700 font-medium">Failed to load zones</p>
            <p className="text-error-600 text-sm mt-2">{(error as Error).message}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && zones.length === 0 && (
          <div className="bg-white rounded-xl border-2 border-dashed border-secondary-300 p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-6">
              <MapPin size={48} className="text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-2">
              No Delivery Zones Yet
            </h3>
            <p className="text-secondary-600 mb-6 max-w-md mx-auto">
              Start by adding your first delivery zone to define where you can service customers.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <Plus size={20} />
              Add Your First Zone
            </button>
          </div>
        )}

        {/* Card View */}
        {!isLoading && !error && activeView === 'card' && zones.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zones.map((zone) => (
              <ZoneCard
                key={zone.id}
                zone={zone}
                onEdit={openEditModal}
                onDelete={(zone) => setDeleteConfirm(zone)}
              />
            ))}
          </div>
        )}

        {/* Map View */}
        {!isLoading && !error && activeView === 'map' && zones.length > 0 && (
          <DeliveryZonesMapView zones={zones} />
        )}

        {/* Add/Edit Modal */}
        <ZoneModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingZone(null);
          }}
          onSave={editingZone ? handleEditZone : handleAddZone}
          editingZone={editingZone}
        />

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="w-16 h-16 rounded-full bg-error-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-error-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 text-center mb-2">
                Delete Delivery Zone?
              </h3>
              <p className="text-secondary-600 text-center mb-6">
                Are you sure you want to remove this zone? This action cannot be undone.
              </p>
              <div className="bg-secondary-50 rounded-lg p-3 mb-6">
                <p className="text-sm text-secondary-700">
                  <span className="font-semibold">Zone:</span> {deleteConfirm.address}
                </p>
                <p className="text-sm text-secondary-700 mt-1">
                  <span className="font-semibold">Radius:</span> {deleteConfirm.radius} km
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 border-2 border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteZone(deleteConfirm)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-error-500 text-white rounded-lg hover:bg-error-600 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete Zone
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saving Overlay */}
        {isSaving && (
          <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl p-6 flex items-center gap-4">
              <Loader2 size={32} className="text-primary-600 animate-spin" />
              <span className="text-lg font-medium text-secondary-900">
                Saving changes...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryZonesManagement;