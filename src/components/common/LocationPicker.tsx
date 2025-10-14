// src/components/common/LocationPicker.tsx
import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number } | null;
  error?: string;
}

const LocationPicker = ({ 
  onLocationSelect, 
  initialLocation = null,
  error 
}: LocationPickerProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(initialLocation);
  const mapRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   const initMap = async () => {
  //     try {
  //       const loader = new Loader({
  //         apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  //         version: 'weekly',
  //       });

  //       await loader.load();

  //       if (!mapRef.current) return;

  //       const mapInstance = new google.maps.Map(mapRef.current, {
  //         center: initialLocation || { lat: 24.8607, lng: 67.0011 }, // Karachi default
  //         zoom: 12,
  //         mapTypeControl: false,
  //       });

  //       setMap(mapInstance);

  //       // Add click listener
  //       mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
  //         if (e.latLng) {
  //           const lat = e.latLng.lat();
  //           const lng = e.latLng.lng();
  //           updateLocation(lat, lng, mapInstance);
  //         }
  //       });

  //       // Set initial marker if location provided
  //       if (initialLocation) {
  //         updateLocation(initialLocation.lat, initialLocation.lng, mapInstance);
  //       }

  //       setLoading(false);
  //     } catch (error) {
  //       console.error('Error loading Google Maps:', error);
  //       setLoading(false);
  //     }
  //   };

  //   initMap();
  // }, []);

    useEffect(() => {
      const initMap = async () => {
        try {
          // Dynamically load Maps JS API
          await google.maps.importLibrary('maps');

          if (!mapRef.current) return;

          const map = new google.maps.Map(mapRef.current, {
            center: initialLocation ?? { lat: 24.8607, lng: 67.0011 },
            zoom: 12,
            mapTypeControl: false,
          });

          setMap(map);
          setLoading(false);
        } catch (err) {
          console.error('Google Maps failed to load:', err);
          setLoading(false);
        }
      };

      initMap();
    }, []);

  const updateLocation = (lat: number, lng: number, mapInstance: google.maps.Map) => {
    // Remove old marker
    if (marker) {
      marker.setMap(null);
    }

    // Create new marker
    const newMarker = new google.maps.Marker({
      position: { lat, lng },
      map: mapInstance,
      draggable: true,
    });

    // Update marker drag
    newMarker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        setSelectedLocation({ lat: newLat, lng: newLng });
        onLocationSelect({ lat: newLat, lng: newLng });
      }
    });

    setMarker(newMarker);
    setSelectedLocation({ lat, lng });
    onLocationSelect({ lat, lng });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          if (map) {
            map.setCenter({ lat, lng });
            updateLocation(lat, lng, map);
          }
        },
        () => {
          alert('Could not get your location');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-secondary-700">
        Select Location on Map
        <span className="text-error-500 ml-1">*</span>
      </label>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-secondary-100 rounded-lg flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        )}
        
        <div 
          ref={mapRef}
          className="w-full h-64 rounded-lg border-2 border-secondary-200"
        />
        
        <button
          type="button"
          onClick={getCurrentLocation}
          className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-secondary-200"
        >
          <MapPin size={20} className="text-primary-500" />
        </button>
      </div>

      {selectedLocation && (
        <div className="text-sm text-secondary-600 bg-secondary-50 p-3 rounded-lg">
          <strong>Selected:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
        </div>
      )}

      {error && (
        <p className="text-sm text-error-500">{error}</p>
      )}
    </div>
  );
};

export default LocationPicker;