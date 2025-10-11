// src/components/common/LocationPickerSimple.tsx
import { MapPin } from 'lucide-react';
import { useEffect } from 'react';

interface LocationPickerSimpleProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number } | null;
  error?: string;
  currentLat?: number;
  currentLng?: number;
}

const LocationPickerSimple = ({ 
  onLocationSelect, 
  initialLocation = null,
  error,
  currentLat,
  currentLng
}: LocationPickerSimpleProps) => {
  
  // Update parent when initial location changes
  useEffect(() => {
    if (initialLocation) {
      onLocationSelect(initialLocation);
    }
  }, [initialLocation]);

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lat = parseFloat(e.target.value);
    if (!isNaN(lat)) {
      onLocationSelect({ 
        lat, 
        lng: currentLng || initialLocation?.lng || 0 
      });
    }
  };

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lng = parseFloat(e.target.value);
    if (!isNaN(lng)) {
      onLocationSelect({ 
        lat: currentLat || initialLocation?.lat || 0, 
        lng 
      });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          onLocationSelect({ lat, lng });
        },
        () => {
          alert('Could not get your location. Please check location permissions.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const displayLat = currentLat || initialLocation?.lat || '';
  const displayLng = currentLng || initialLocation?.lng || '';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-secondary-700">
        Business Location Coordinates
        <span className="text-error-500 ml-1">*</span>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-secondary-600 mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            placeholder="24.8607"
            value={displayLat}
            onChange={handleLatChange}
            className={`
              w-full px-4 py-3 rounded-lg border-2 transition-all
              ${error 
                ? 'border-error-500 focus:border-error-500 focus:ring-error-500' 
                : 'border-secondary-200 focus:border-primary-500 focus:ring-primary-500'
              }
              focus:outline-none focus:ring-2 focus:ring-opacity-20
            `}
          />
        </div>

        <div>
          <label className="block text-xs text-secondary-600 mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            placeholder="67.0011"
            value={displayLng}
            onChange={handleLngChange}
            className={`
              w-full px-4 py-3 rounded-lg border-2 transition-all
              ${error 
                ? 'border-error-500 focus:border-error-500 focus:ring-error-500' 
                : 'border-secondary-200 focus:border-primary-500 focus:ring-primary-500'
              }
              focus:outline-none focus:ring-2 focus:ring-opacity-20
            `}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={getCurrentLocation}
        className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
      >
        <MapPin size={16} />
        Use My Current Location
      </button>

      {error && (
        <p className="text-sm text-error-500">{error}</p>
      )}

      {displayLat && displayLng && (
        <div className="bg-success-50 border border-success-200 rounded-lg p-3">
          <p className="text-xs text-success-700 font-medium">
            ✓ Location Set: {displayLat}, {displayLng}
          </p>
        </div>
      )}

      <p className="text-xs text-secondary-500">
        💡 Tip: Select your address above and coordinates will auto-fill, or use "Use My Current Location"
      </p>
    </div>
  );
};

export default LocationPickerSimple;