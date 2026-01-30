// FILE PATH: src/components/order/MapPinModal.tsx

/**
 * MapPinModal Component - FIXED VERSION
 * 
 * Fixed Issues:
 * - Removed LoadScript wrapper (API already loaded globally)
 * - Google Maps API now loads without conflicts
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, MapPin, Loader2, Navigation, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { GoogleMap, Marker } from '@react-google-maps/api';

interface MapPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: string, lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}

// Default center (Sydney, Australia)
const DEFAULT_CENTER = {
  lat: -33.8688,
  lng: 151.2093,
};

// Map container style
const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const MapPinModal: React.FC<MapPinModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
  initialAddress,
}) => {
  // State management
  const [markerPosition, setMarkerPosition] = useState({
    lat: initialLat || DEFAULT_CENTER.lat,
    lng: initialLng || DEFAULT_CENTER.lng,
  });
  const [address, setAddress] = useState(initialAddress || '');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);

  // Refs
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /**
   * Reverse geocode coordinates to get address
   */
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    setGeocodingError('');

    try {
      // Check if google is available
      if (!window.google || !window.google.maps) {
        throw new Error('Google Maps not loaded');
      }
  
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({
        location: { lat, lng },
      });

      if (response.results && response.results.length > 0) {
        const formattedAddress = response.results[0].formatted_address;
        setAddress(formattedAddress);
      } else {
        setGeocodingError('Could not find address for this location');
        setAddress(`Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodingError('Failed to fetch address. Please try again.');
      setAddress(`Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  /**
   * Handle marker drag end
   */
  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPosition({ lat, lng });
        reverseGeocode(lat, lng);
      }
    },
    [reverseGeocode]
  );

  /**
   * Handle map click
   */
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPosition({ lat, lng });
        reverseGeocode(lat, lng);
      }
    },
    [reverseGeocode]
  );

  /**
   * Get user's current location
   */
  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMarkerPosition({ lat, lng });
        
        // Pan map to new location
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(15);
        }

        reverseGeocode(lat, lng);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please ensure location permissions are enabled.');
        setIsLoadingLocation(false);
      }
    );
  }, [reverseGeocode]);

  /**
   * Handle search place selection
   */
  const handlePlaceSelect = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();

      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMarkerPosition({ lat, lng });
        setAddress(place.formatted_address || '');

        // Pan map to new location
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(15);
        }

        // Clear search input
        setSearchValue('');
      }
    }
  }, []);

  /**
   * Initialize autocomplete after map loads
   */
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setIsMapReady(true);

    // Initialize autocomplete if search input exists
    if (searchInputRef.current && !autocompleteRef.current && window.google) {
      try {
        autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
          componentRestrictions: { country: 'au' },
          fields: ['formatted_address', 'geometry', 'name'],
        });

        autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    }
  }, [handlePlaceSelect]);

  /**
   * Handle confirm button click
   */
  const handleConfirm = () => {
    if (!address || isGeocoding) {
      return;
    }
    onConfirm(address, markerPosition.lat, markerPosition.lng);
  };

  /**
   * Initialize with initial coordinates on mount
   */
  useEffect(() => {
    if (isOpen && initialLat && initialLng && !address) {
      reverseGeocode(initialLat, initialLng);
    }
  }, [isOpen, initialLat, initialLng, address, reverseGeocode]);

  /**
   * Reset state when modal closes
   */
  useEffect(() => {
    if (!isOpen) {
      setIsMapReady(false);
      setGeocodingError('');
      setSearchValue('');
    }
  }, [isOpen]);

  // Don't render if modal is closed
  if (!isOpen) return null;

  // Check if Google Maps is available
  const isGoogleMapsLoaded = typeof window !== 'undefined' && window.google && window.google.maps;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl transform transition-all flex flex-col" style={{ maxHeight: '90vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <MapPin size={20} className="text-primary-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-secondary-900">Pin Location on Map</h3>
                <p className="text-sm text-secondary-600">Click or drag the marker to select a location</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search for a location..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button
                onClick={handleGetCurrentLocation}
                disabled={isLoadingLocation || !isMapReady}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                title="Use my current location"
              >
                {isLoadingLocation ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Navigation size={18} />
                )}
                <span className="hidden sm:inline">My Location</span>
              </button>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative" style={{ height: '500px' }}>
            {!isGoogleMapsLoaded ? (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="text-center p-6">
                  <Loader2 size={48} className="mx-auto mb-4 text-primary-600 animate-spin" />
                  <p className="text-gray-700 font-medium">Loading Google Maps...</p>
                  <p className="text-sm text-gray-600 mt-2">Please wait a moment</p>
                </div>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={markerPosition}
                zoom={15}
                onClick={handleMapClick}
                onLoad={onMapLoad}
                options={{
                  streetViewControl: false,
                  mapTypeControl: true,
                  fullscreenControl: false,
                  zoomControl: true,
                }}
              >
                <Marker
                  position={markerPosition}
                  draggable={true}
                  onDragEnd={handleMarkerDragEnd}
                  animation={window.google?.maps?.Animation?.DROP}
                />
              </GoogleMap>
            )}

            {/* Geocoding Loader Overlay */}
            {isGeocoding && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-10">
                <Loader2 size={16} className="animate-spin text-primary-600" />
                <span className="text-sm text-gray-700">Fetching address...</span>
              </div>
            )}
          </div>

          {/* Address Display & Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            {/* Selected Address */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Selected Address
              </label>
              <div className="flex items-start gap-3 p-3 bg-white border border-gray-300 rounded-lg">
                {geocodingError ? (
                  <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm text-secondary-900 font-medium">{address || 'No address selected'}</p>
                  <p className="text-xs text-secondary-500 mt-1">
                    Coordinates: {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
                  </p>
                  {geocodingError && (
                    <p className="text-xs text-red-600 mt-1">{geocodingError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!address || isGeocoding}
                className="flex-1 px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGeocoding ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Confirm Location
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPinModal;