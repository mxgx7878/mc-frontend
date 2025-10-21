// FILE PATH: src/components/admin/Orders/OrderMapTab.tsx

/**
 * Order Map Tab Component
 * Shows client location and supplier zones on Google Maps
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import type { AdminOrderItem, DeliveryZone } from '../../../types/adminOrder.types';

interface OrderMapTabProps {
  deliveryLat: number | null;
  deliveryLong: number | null;
  items: AdminOrderItem[];
}

declare global {
  interface Window {
    google: any;
  }
}

const OrderMapTab: React.FC<OrderMapTabProps> = ({ deliveryLat, deliveryLong, items }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);

  // Load Google Maps
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google?.maps) return;

      try {
        const defaultCenter = { lat: -33.8688, lng: 151.2093 }; // Sydney
        const center = deliveryLat && deliveryLong
          ? { lat: deliveryLat, lng: deliveryLong }
          : defaultCenter;

        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: deliveryLat && deliveryLong ? 10 : 5,
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

    // Check if script already loaded
    if (window.google?.maps) {
      initMap();
      return;
    }

    // Check for existing script
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      existing.addEventListener('load', initMap, { once: true });
      return;
    }

    // Load script
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Missing Google Maps API key');
      setLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    script.onerror = () => {
      setError('Failed to load Google Maps');
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      markersRef.current.forEach(m => m.setMap(null));
      circlesRef.current.forEach(c => c.setMap(null));
    };
  }, [deliveryLat, deliveryLong]);

  // Draw markers and zones
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear old markers and circles
    markersRef.current.forEach(m => m.setMap(null));
    circlesRef.current.forEach(c => c.setMap(null));
    markersRef.current = [];
    circlesRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasMarkers = false;

    // Add client marker (green)
    if (deliveryLat && deliveryLong) {
      const clientPos = { lat: deliveryLat, lng: deliveryLong };

      const clientMarker = new window.google.maps.Marker({
        position: clientPos,
        map,
        title: 'Delivery Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 3,
        },
        label: {
          text: 'C',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '12px',
        },
      });

      const clientInfo = new window.google.maps.InfoWindow({
        content: `
          <div style="padding:8px">
            <h3 style="margin:0 0 6px;font-weight:700;color:#10B981">Client Delivery Location</h3>
            <div style="font-size:13px;color:#374151">
              <div><strong>Lat:</strong> ${deliveryLat.toFixed(6)}</div>
              <div><strong>Lng:</strong> ${deliveryLong.toFixed(6)}</div>
            </div>
          </div>
        `,
      });

      clientMarker.addListener('click', () => clientInfo.open(map, clientMarker));
      markersRef.current.push(clientMarker);
      bounds.extend(clientPos);
      hasMarkers = true;
    }

    // Add supplier markers and zones
    const processedSuppliers = new Set<number>();

    items.forEach((item) => {
      if (!item.supplier?.id || processedSuppliers.has(item.supplier.id)) return;
      processedSuppliers.add(item.supplier.id);

      const supplier = item.supplier;
      const zones: DeliveryZone[] = supplier.delivery_zones || [];
      if (zones.length === 0) return;

      const isConfirmed = item.supplier_confirms === 1;
      const color = isConfirmed ? '#3B82F6' : '#F59E0B'; // Blue for confirmed, Yellow for pending

      zones.forEach((zone, idx) => {
        const pos = { lat: zone.lat, lng: zone.long };

        // Create marker
        const marker = new window.google.maps.Marker({
          position: pos,
          map,
          title: `${supplier.name} - Zone ${idx + 1}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
          },
          label: {
            text: 'S',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '11px',
          },
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding:8px;max-width:260px">
              <h3 style="margin:0 0 6px;font-weight:700;color:${color}">${supplier.name}</h3>
              <div style="font-size:13px;color:#374151">
                <div><strong>Zone ${idx + 1}</strong></div>
                <div><strong>Address:</strong> ${zone.address}</div>
                <div><strong>Radius:</strong> ${zone.radius} km</div>
                <div><strong>Status:</strong> ${isConfirmed ? '✓ Confirmed' : '⏳ Pending'}</div>
              </div>
            </div>
          `,
        });

        marker.addListener('click', () => infoWindow.open(map, marker));

        // Create circle zone
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
        hasMarkers = true;
      });
    });

    // Fit bounds
    if (hasMarkers) {
      map.fitBounds(bounds);
    }
  }, [map, deliveryLat, deliveryLong, items]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-2" size={40} />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <AlertCircle className="text-red-600 mx-auto mb-2" size={40} />
          <p className="text-red-700 font-medium mb-1">Map Loading Error</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-96 rounded-lg border border-gray-200" />

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MapPin size={16} />
          Map Legend
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
            <span className="text-gray-700">Client Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
            <span className="text-gray-700">Supplier (Confirmed)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white" />
            <span className="text-gray-700">Supplier (Pending)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderMapTab;