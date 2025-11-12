// FILE PATH: src/components/admin/Orders/OrderMapTab.tsx

/**
 * Order Map Tab Component (FIXED VERSION)
 * Shows client location and supplier zones on Google Maps
 * 
 * FIX: Added requestAnimationFrame to ensure DOM is ready before map initialization
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

  // Load Google Maps - FIXED VERSION
  useEffect(() => {
    console.log('[OrderMapTab] Initializing map...', { deliveryLat, deliveryLong, itemsCount: items.length });
    
    // ✅ FIX: Use requestAnimationFrame to ensure DOM is ready
    const initWhenReady = () => {
      if (!mapRef.current) {
        console.log('[OrderMapTab] Map container not ready, retrying...');
        requestAnimationFrame(initWhenReady);
        return;
      }
      
      console.log('[OrderMapTab] Map container ready');
      
      if (!window.google || !window.google.maps) {
        console.log('[OrderMapTab] Google Maps API not loaded yet');
        return;
      }

      console.log('[OrderMapTab] Google Maps API available, creating map...');

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

        console.log('[OrderMapTab] Map created successfully');
        setMap(mapInstance);
        setLoading(false);
      } catch (e) {
        console.error('[OrderMapTab] Failed to initialize map:', e);
        setError('Failed to initialize map');
        setLoading(false);
      }
    };

    // Check if Google Maps already loaded
    if (window.google && window.google.maps) {
      console.log('[OrderMapTab] Google Maps already loaded');
      initWhenReady();
      return;
    }

    // Check for existing script
    const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null;
    if (existing) {
      console.log('[OrderMapTab] Script tag exists, waiting for load...');
      existing.addEventListener('load', initWhenReady, { once: true });
      return;
    }

    // Load script
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    console.log('[OrderMapTab] API Key present:', !!apiKey);
    
    if (!apiKey) {
      console.error('[OrderMapTab] Missing Google Maps API key');
      setError('Missing Google Maps API key');
      setLoading(false);
      return;
    }

    console.log('[OrderMapTab] Creating script tag...');
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('[OrderMapTab] Script loaded successfully');
      initWhenReady();
    };
    script.onerror = () => {
      console.error('[OrderMapTab] Failed to load Google Maps script');
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
    if (!map || !window.google) {
      console.log('[OrderMapTab] Skipping markers - map not ready');
      return;
    }

    console.log('[OrderMapTab] Drawing markers and zones...', { 
      hasDeliveryCoords: !!(deliveryLat && deliveryLong),
      itemsCount: items.length 
    });

    // Clear old markers and circles
    markersRef.current.forEach(m => m.setMap(null));
    circlesRef.current.forEach(c => c.setMap(null));
    markersRef.current = [];
    circlesRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasMarkers = false;

    // Add client marker (green)
    if (deliveryLat && deliveryLong) {
      console.log('[OrderMapTab] Adding client marker at:', { deliveryLat, deliveryLong });
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
        },
      });

      markersRef.current.push(clientMarker);
      bounds.extend(clientPos);
      hasMarkers = true;
    }

    // Add supplier markers and zones
    items.forEach((item, idx) => {
      const supplier = item.supplier;
      if (!supplier || !supplier.delivery_zones) {
        console.log(`[OrderMapTab] Item ${idx}: No supplier or zones`);
        return;
      }

      let zones: DeliveryZone[] = [];
      try {
        zones = typeof supplier.delivery_zones === 'string'
          ? JSON.parse(supplier.delivery_zones)
          : supplier.delivery_zones;
        console.log(`[OrderMapTab] Item ${idx}: Found ${zones.length} zones for supplier ${supplier.id}`);
      } catch (e) {
        console.error('[OrderMapTab] Failed to parse zones for supplier:', supplier.id, e);
        return;
      }

      zones.forEach((zone: DeliveryZone, zoneIdx: number) => {
        console.log(`[OrderMapTab] Drawing zone ${zoneIdx} for supplier ${supplier.id}:`, zone);
        const zonePos = { lat: zone.lat, lng: zone.long };

        // Supplier marker (blue if confirmed, yellow if pending)
        const isConfirmed = item.supplier_id !== null;
        const supplierMarker = new window.google.maps.Marker({
          position: zonePos,
          map,
          title: supplier.name || 'Supplier',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: isConfirmed ? '#3B82F6' : '#F59E0B',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
          label: {
            text: 'S',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '12px',
          },
        });

        markersRef.current.push(supplierMarker);

        // Delivery zone circle
        const circle = new window.google.maps.Circle({
          center: zonePos,
          radius: zone.radius * 1000, // Convert km to meters
          map,
          fillColor: isConfirmed ? '#3B82F6' : '#F59E0B',
          fillOpacity: 0.1,
          strokeColor: isConfirmed ? '#3B82F6' : '#F59E0B',
          strokeOpacity: 0.5,
          strokeWeight: 2,
        });

        circlesRef.current.push(circle);
        bounds.extend(zonePos);
        hasMarkers = true;
      });
    });

    // Fit map to show all markers
    if (hasMarkers) {
      console.log('[OrderMapTab] Fitting bounds to show all markers');
      map.fitBounds(bounds);
      
      // Prevent over-zooming when there's only one marker
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 15) {
          console.log('[OrderMapTab] Limiting zoom to 15');
          map.setZoom(15);
        }
        window.google.maps.event.removeListener(listener);
      });
    } else {
      console.log('[OrderMapTab] No markers to display');
    }
  }, [map, deliveryLat, deliveryLong, items]);

  return (
    <div className="space-y-4">
      {/* Map Container - ALWAYS RENDERED */}
      <div className="relative">
        <div 
          ref={mapRef} 
          className="w-full h-[600px] rounded-lg border border-gray-200 overflow-hidden"
        />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <div className="text-center">
              <Loader2 size={40} className="text-primary-600 animate-spin mb-2" />
              <p className="text-gray-600 font-medium">Loading map...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 p-6 text-center z-10">
            <AlertCircle size={28} className="text-error-600 mb-2" />
            <p className="text-error-700 font-medium mb-1">Map Loading Error</p>
            <p className="text-sm text-gray-600">{error}</p>
            <p className="text-xs text-gray-500 mt-2">
              Ensure <code className="bg-gray-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> is set.
            </p>
          </div>
        )}
      </div>

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