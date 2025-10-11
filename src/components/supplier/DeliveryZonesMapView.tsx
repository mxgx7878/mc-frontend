// DeliveryZonesMapView.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, MapPin } from 'lucide-react';

interface DeliveryZone {
  address: string;
  lat: number;
  long: number;
  radius: number; // in km
  id?: string;
}

interface MapViewProps {
  zones: DeliveryZone[];
}

declare global {
  interface Window {
    google: any;
  }
}

const DeliveryZonesMapView: React.FC<MapViewProps> = ({ zones }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);

  const zoneColors = [
    '#EF4444', '#3B82F6', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  ];

  // --- Load script once and init when container exists
  useEffect(() => {
    const initWhenReady = () => {
      if (!mapRef.current) {
        requestAnimationFrame(initWhenReady);
        return;
      }
      if (!window.google || !window.google.maps) return;

      try {
        const defaultCenter = { lat: -33.8688, lng: 151.2093 }; // Sydney
        const center = zones.length
          ? { lat: zones[0].lat, lng: zones[0].long }
          : defaultCenter;

        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: zones.length ? 10 : 5,
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

    // already loaded
    if (window.google && window.google.maps) {
      initWhenReady();
      return;
    }

    // avoid duplicate script
    const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', initWhenReady, { once: true });
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Missing VITE_GOOGLE_MAPS_API_KEY');
      setLoading(false);
      return;
    }

    const s = document.createElement('script');
    s.id = 'google-maps-script';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    s.async = true;
    s.defer = true;
    s.onload = initWhenReady;
    s.onerror = () => {
      setError('Failed to load Google Maps. Check API key or network.');
      setLoading(false);
    };
    document.head.appendChild(s);

    return () => {
      // cleanup markers/circles on unmount
      markersRef.current.forEach(m => m.setMap(null));
      circlesRef.current.forEach(c => c.setMap(null));
    };
  }, []); // eslint-disable-line

  // --- Draw zones whenever data or map changes
  useEffect(() => {
    if (!map || !window.google) return;

    // clear old
    markersRef.current.forEach(m => m.setMap(null));
    circlesRef.current.forEach(c => c.setMap(null));
    markersRef.current = [];
    circlesRef.current = [];

    if (!zones.length) return;

    const bounds = new window.google.maps.LatLngBounds();

    zones.forEach((zone, idx) => {
      const pos = { lat: zone.lat, lng: zone.long };
      const color = zoneColors[idx % zoneColors.length];

      const marker = new window.google.maps.Marker({
        position: pos,
        map,
        title: zone.address,
        label: { text: String(idx + 1), color: 'white', fontWeight: 'bold' },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 3,
        },
      });

      const info = new window.google.maps.InfoWindow({
        content: `
          <div style="padding:8px;max-width:260px">
            <h3 style="margin:0 0 6px;font-weight:700;color:#111827">Zone ${idx + 1}</h3>
            <div style="font-size:13px;color:#374151">
              <div><strong>Address:</strong> ${zone.address}</div>
              <div><strong>Radius:</strong> ${zone.radius} km</div>
              <div><strong>Coverage:</strong> ~${(Math.PI * zone.radius * zone.radius).toFixed(0)} km²</div>
            </div>
          </div>
        `,
      });
      marker.addListener('click', () => info.open(map, marker));

      const circle = new window.google.maps.Circle({
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.15,
        map,
        center: pos,
        radius: zone.radius * 1000, // km -> m
      });

      markersRef.current.push(marker);
      circlesRef.current.push(circle);
      bounds.extend(pos);
    });

    if (zones.length > 1) map.fitBounds(bounds);
    else map.setCenter({ lat: zones[0].lat, lng: zones[0].long });
  }, [map, zones]);

  return (
    <div className="bg-white rounded-xl border-2 border-secondary-200 p-6">
      <div className="relative">
        {/* keep container in DOM always */}
        <div
          ref={mapRef}
          className="w-full h-[600px] rounded-lg overflow-hidden border border-secondary-200"
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="animate-spin" size={40} />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 p-6 text-center">
            <AlertCircle className="text-error-600 mb-2" size={28} />
            <p className="text-error-700 font-medium mb-1">Map Loading Error</p>
            <p className="text-sm text-secondary-600">{error}</p>
            <p className="text-xs text-secondary-500 mt-2">
              Ensure <code>VITE_GOOGLE_MAPS_API_KEY</code> is set.
            </p>
          </div>
        )}
      </div>

      {/* Optional legend */}
      {zones.length > 0 ? (
        <div className="mt-4 p-4 bg-secondary-50 rounded-lg">
          <p className="text-sm font-semibold text-secondary-900 mb-3">Delivery Zones</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {zones.map((z, i) => (
              <div key={z.id || i} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: zoneColors[i % zoneColors.length] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-secondary-900 truncate">Zone {i + 1}</p>
                  <p className="text-xs text-secondary-600">{z.radius} km radius</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-32 flex flex-col items-center justify-center text-secondary-600">
          <MapPin className="mb-2 text-secondary-400" size={20} />
          No zones to display
        </div>
      )}
    </div>
  );
};

export default DeliveryZonesMapView;
