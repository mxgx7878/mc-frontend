// src/components/admin/AdminSupplierZonesMapView.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, MapPin } from 'lucide-react';
import { SupplierWithZones } from '../../api/handlers/adminSupplierZones.api';

interface MapViewProps {
  suppliers: SupplierWithZones[];
  supplierColors: Map<number, string>;
}

declare global {
  interface Window {
    google: any;
  }
}

const AdminSupplierZonesMapView: React.FC<MapViewProps> = ({ suppliers, supplierColors }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const [visibleSuppliers, setVisibleSuppliers] = useState<Set<number>>(
    new Set(suppliers.map(s => s.id))
  );

  // Initialize map
  useEffect(() => {
    const initWhenReady = () => {
      if (!mapRef.current) {
        requestAnimationFrame(initWhenReady);
        return;
      }
      if (!window.google || !window.google.maps) return;

      try {
        const defaultCenter = { lat: -25.2744, lng: 133.7751 }; // Australia center
        
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 4,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        setMap(mapInstance);
        setLoading(false);
      } catch (e) {
        setError('Failed to initialize map');
        setLoading(false);
      }
    };

    // Check if already loaded
    if (window.google && window.google.maps) {
      initWhenReady();
      return;
    }

    // Check for existing script
    const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', initWhenReady, { once: true });
      return;
    }

    // Load script
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Missing VITE_GOOGLE_MAPS_API_KEY');
      setLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initWhenReady;
    script.onerror = () => {
      setError('Failed to load Google Maps');
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      markersRef.current.forEach(m => m.setMap(null));
      circlesRef.current.forEach(c => c.setMap(null));
    };
  }, []);

  // Draw zones on map
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear old markers and circles
    markersRef.current.forEach(m => m.setMap(null));
    circlesRef.current.forEach(c => c.setMap(null));
    markersRef.current = [];
    circlesRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasZones = false;

    suppliers.forEach((supplier) => {
      if (!visibleSuppliers.has(supplier.id)) return;
      if (supplier.delivery_zones.length === 0) return;

      const color = supplierColors.get(supplier.id) || '#3B82F6';

      supplier.delivery_zones.forEach((zone, zoneIdx) => {
        const pos = { lat: zone.lat, lng: zone.long };

        // Create marker
        const marker = new window.google.maps.Marker({
          position: pos,
          map,
          title: `${supplier.name} - Zone ${zoneIdx + 1}`,
          label: {
            text: String(zoneIdx + 1),
            color: 'white',
            fontWeight: 'bold',
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 3,
          },
        });

        // Create InfoWindow
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding:12px;max-width:280px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <div style="width:12px;height:12px;border-radius:50%;background-color:${color}"></div>
                <h3 style="margin:0;font-weight:700;color:#111827;font-size:16px">${supplier.name}</h3>
              </div>
              <div style="font-size:13px;color:#374151;line-height:1.6">
                <div style="margin-bottom:4px"><strong>Zone ${zoneIdx + 1}</strong></div>
                <div style="margin-bottom:4px">📍 ${zone.address}</div>
                <div style="margin-bottom:4px"><strong>Radius:</strong> ${zone.radius} km</div>
                <div style="margin-bottom:4px"><strong>Coverage:</strong> ~${(Math.PI * zone.radius * zone.radius).toFixed(0)} km²</div>
                <div style="color:#6B7280;font-size:11px;margin-top:6px">
                  ${zone.lat.toFixed(6)}, ${zone.long.toFixed(6)}
                </div>
              </div>
            </div>
          `,
        });

        marker.addListener('click', () => infoWindow.open(map, marker));

        // Create circle
        const circle = new window.google.maps.Circle({
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: color,
          fillOpacity: 0.15,
          map,
          center: pos,
          radius: zone.radius * 1000, // km to meters
        });

        markersRef.current.push(marker);
        circlesRef.current.push(circle);
        bounds.extend(pos);
        hasZones = true;
      });
    });

    // Fit bounds
    if (hasZones) {
      map.fitBounds(bounds);
    }
  }, [map, suppliers, supplierColors, visibleSuppliers]);

  const toggleSupplierVisibility = (supplierId: number) => {
    setVisibleSuppliers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(supplierId)) {
        newSet.delete(supplierId);
      } else {
        newSet.add(supplierId);
      }
      return newSet;
    });
  };

  const showAllSuppliers = () => {
    setVisibleSuppliers(new Set(suppliers.map(s => s.id)));
  };

  const hideAllSuppliers = () => {
    setVisibleSuppliers(new Set());
  };

  const suppliersWithZones = suppliers.filter(s => s.delivery_zones.length > 0);

  return (
    <div className="bg-white rounded-xl border-2 border-secondary-200 p-6">
      <div className="relative">
        {/* Map Container */}
        <div
          ref={mapRef}
          className="w-full h-[600px] rounded-lg overflow-hidden border border-secondary-200"
        />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <div className="text-center">
              <Loader2 className="animate-spin text-primary-600 mx-auto mb-2" size={40} />
              <p className="text-secondary-600">Loading map...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 p-6 text-center z-10">
            <AlertCircle className="text-error-600 mb-2" size={28} />
            <p className="text-error-700 font-medium mb-1">Map Loading Error</p>
            <p className="text-sm text-secondary-600">{error}</p>
          </div>
        )}
      </div>

      {/* Legend */}
      {suppliersWithZones.length > 0 ? (
        <div className="mt-4 p-4 bg-secondary-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-secondary-900">Supplier Legend</p>
            <div className="flex gap-2">
              <button
                onClick={showAllSuppliers}
                className="text-xs px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors"
              >
                Show All
              </button>
              <button
                onClick={hideAllSuppliers}
                className="text-xs px-3 py-1 bg-secondary-200 text-secondary-700 rounded hover:bg-secondary-300 transition-colors"
              >
                Hide All
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto">
            {suppliersWithZones.map((supplier) => {
              const color = supplierColors.get(supplier.id) || '#3B82F6';
              const isVisible = visibleSuppliers.has(supplier.id);

              return (
                <button
                  key={supplier.id}
                  onClick={() => toggleSupplierVisibility(supplier.id)}
                  className={`flex items-center gap-2 p-2 rounded border-2 transition-all text-left ${
                    isVisible
                      ? 'border-secondary-300 bg-white hover:border-primary-300'
                      : 'border-secondary-200 bg-secondary-100 opacity-50 hover:opacity-75'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-secondary-900 truncate">
                      {supplier.name}
                    </p>
                    <p className="text-xs text-secondary-600">
                      {supplier.delivery_zones.length} zone{supplier.delivery_zones.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="h-32 flex flex-col items-center justify-center text-secondary-600 mt-4">
          <MapPin className="mb-2 text-secondary-400" size={20} />
          <p className="text-sm">No delivery zones to display</p>
        </div>
      )}
    </div>
  );
};

export default AdminSupplierZonesMapView;