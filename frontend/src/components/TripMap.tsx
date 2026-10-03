import React, { useEffect, useRef, useState } from 'react';
import type { CanonicalItinerary } from '../types';
import { getPlaceImage } from '../utils/images';
import { MapPin, Navigation } from 'lucide-react';

interface TripMapProps {
  itinerary: CanonicalItinerary;
  selectedDayId: string;
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
}

export const TripMap: React.FC<TripMapProps> = ({
  itinerary,
  selectedDayId,
  selectedItemId,
  onSelectItem,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const polylineRef = useRef<any>(null);
  const [mapError, setMapError] = useState(false);

  const activeDay = itinerary.days.find(d => d.id === selectedDayId) || itinerary.days[0];
  const itemsWithCoords = activeDay ? activeDay.items.filter(it => it.lat && it.lng) : [];

  useEffect(() => {
    // Dynamically load leaflet inside effect to prevent SSR or DOM mismatch issues
    let isMounted = true;

    async function initMap() {
      try {
        const L = (window as any).L || (await import('leaflet')).default;
        if (!mapContainerRef.current || !isMounted) return;

        // If map already initialized, clear previous layers
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const centerLat = itemsWithCoords[0]?.lat || itinerary.trip.destination.lat || 15.49;
        const centerLng = itemsWithCoords[0]?.lng || itinerary.trip.destination.lng || 73.82;

        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom: 12,
          zoomControl: false,
        });

        // Add custom light minimalist tiles from OSM
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);
        mapInstanceRef.current = map;

        // Render Markers
        markersRef.current = {};
        const latLngs: [number, number][] = [];

        itemsWithCoords.forEach((item, index) => {
          const latLng: [number, number] = [item.lat, item.lng];
          latLngs.push(latLng);

          const isSelected = selectedItemId === item.id;
          const markerColor = isSelected ? '#905831' : '#1a1a1a';

          // Custom HTML Marker Icon
          const customIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
              <div style="
                background: ${markerColor};
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 11px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                border: 2px solid white;
                transform: translate(-14px, -14px);
                transition: transform 0.2s ease;
              ">
                ${index + 1}
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.marker(latLng, { icon: customIcon }).addTo(map);

          // Popup content
          const popupHtml = `
            <div style="font-family: 'Geist', sans-serif; width: 220px; overflow: hidden; border-radius: 12px;">
              <img src="${getPlaceImage(item.place_id, item.category)}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 8px 8px 0 0;" alt="${item.name}" />
              <div style="padding: 10px 12px; background: white;">
                <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #905831; margin-bottom: 2px;">
                  Stop ${index + 1} • ${item.category}
                </div>
                <div style="font-size: 13px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px;">
                  ${item.name}
                </div>
                <div style="font-size: 11px; color: #666; display: flex; gap: 8px;">
                  <span>⏰ ${item.start_time} - ${item.end_time}</span>
                  <span>₹${item.cost.amount}</span>
                </div>
              </div>
            </div>
          `;
          marker.bindPopup(popupHtml);

          marker.on('click', () => {
            onSelectItem(item.id);
          });

          markersRef.current[item.id] = marker;
        });

        // Draw Route Polyline
        if (latLngs.length > 1) {
          const polyline = L.polyline(latLngs, {
            color: '#905831',
            weight: 3.5,
            opacity: 0.8,
            dashArray: '6, 8',
          }).addTo(map);
          polylineRef.current = polyline;

          map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        } else if (latLngs.length === 1) {
          map.setView(latLngs[0], 13);
        }
      } catch (err) {
        console.warn('Leaflet map initialization fallback:', err);
        setMapError(true);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeDay?.id, itinerary.trip_id]);

  // When selectedItemId changes, pan to that marker and open popup
  useEffect(() => {
    if (!selectedItemId || !mapInstanceRef.current || !markersRef.current[selectedItemId]) return;
    const marker = markersRef.current[selectedItemId];
    const latLng = marker.getLatLng();
    mapInstanceRef.current.panTo(latLng, { animate: true, duration: 0.8 });
    marker.openPopup();
  }, [selectedItemId]);

  if (mapError) {
    return (
      <div className="w-full h-full min-h-[420px] rounded-3xl bg-neutral-900 text-white p-6 flex flex-col justify-center items-center text-center">
        <MapPin className="w-8 h-8 text-[#905831] mb-3" />
        <h3 className="font-bold text-lg mb-1">Route & Stops Overview</h3>
        <p className="text-xs text-neutral-400 mb-4 max-w-sm">
          Map tiles offline. Displaying geographic route schedule:
        </p>
        <div className="w-full max-w-md space-y-2 text-left">
          {itemsWithCoords.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#905831] text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <div className="text-xs font-bold text-white">{item.name}</div>
                  <div className="text-[10px] text-neutral-400">{item.start_time} - {item.end_time}</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-neutral-300">₹{item.cost.amount}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[440px] rounded-3xl overflow-hidden shadow-xl border border-white/50 bg-neutral-100">
      <div ref={mapContainerRef} className="w-full h-full min-h-[440px]" />

      {/* Floating Map Legend Overlay */}
      <div className="absolute top-4 left-4 z-20 liquid-glass rounded-2xl p-2.5 shadow-lg border border-white/60 text-xs">
        <div className="font-bold text-neutral-900 flex items-center gap-1.5 mb-1">
          <Navigation className="w-3.5 h-3.5 text-[#905831]" />
          <span>{activeDay?.theme || 'Day Route'}</span>
        </div>
        <div className="text-[10px] text-neutral-600 flex items-center gap-3">
          <span>{itemsWithCoords.length} Curated Stops</span>
          <span>•</span>
          <span>{activeDay?.totals.travel_minutes || 0} min transit</span>
        </div>
      </div>
    </div>
  );
};
