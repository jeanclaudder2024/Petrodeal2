import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface VesselMapProps {
  vessel: {
    latitude?: number;
    longitude?: number;
    departure_port_lat?: number;
    departure_port_lng?: number;
    destination_port_lat?: number;
    destination_port_lng?: number;
    departure_port?: string;
    destination_port?: string;
    name?: string;
  };
  height?: string;
}

const VesselMap: React.FC<VesselMapProps> = ({ vessel, height = '400px' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    });

    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Vessel icon
    const vesselIcon = L.divIcon({
      html: `
        <div style="
          width: 24px; 
          height: 24px; 
          background: hsl(var(--primary)); 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
            <path d="M12 2L22 22H2L12 2Z"/>
          </svg>
        </div>
      `,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Port icon
    const portIcon = L.divIcon({
      html: `
        <div style="
          width: 20px; 
          height: 20px; 
          background: hsl(var(--accent)); 
          border-radius: 4px; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          <svg width="10" height="10" fill="white" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          </svg>
        </div>
      `,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const markers: L.Marker[] = [];
    const bounds = L.latLngBounds([]);

    // Add vessel marker
    if (vessel.latitude && vessel.longitude) {
      const vesselMarker = L.marker([vessel.latitude, vessel.longitude], { icon: vesselIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif;">
            <strong>${vessel.name || 'Vessel'}</strong><br/>
            Position: ${vessel.latitude.toFixed(4)}, ${vessel.longitude.toFixed(4)}
          </div>
        `);
      
      markers.push(vesselMarker);
      bounds.extend([vessel.latitude, vessel.longitude]);
    }

    // Add departure port marker
    if (vessel.departure_port_lat && vessel.departure_port_lng) {
      const departureMarker = L.marker([vessel.departure_port_lat, vessel.departure_port_lng], { icon: portIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif;">
            <strong>Departure Port</strong><br/>
            ${vessel.departure_port || 'Unknown Port'}
          </div>
        `);
      
      markers.push(departureMarker);
      bounds.extend([vessel.departure_port_lat, vessel.departure_port_lng]);
    }

    // Add destination port marker
    if (vessel.destination_port_lat && vessel.destination_port_lng) {
      const destinationMarker = L.marker([vessel.destination_port_lat, vessel.destination_port_lng], { icon: portIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif;">
            <strong>Destination Port</strong><br/>
            ${vessel.destination_port || 'Unknown Port'}
          </div>
        `);
      
      markers.push(destinationMarker);
      bounds.extend([vessel.destination_port_lat, vessel.destination_port_lng]);
    }

    // Draw route line
    if (vessel.latitude && vessel.longitude && vessel.destination_port_lat && vessel.destination_port_lng) {
      const routeLine = L.polyline([
        [vessel.latitude, vessel.longitude],
        [vessel.destination_port_lat, vessel.destination_port_lng]
      ], {
        color: 'hsl(var(--primary))',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 5'
      }).addTo(map);

      bounds.extend(routeLine.getBounds());
    }

    // Fit map to bounds or set default view
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    } else {
      map.setView([0, 0], 2);
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [vessel]);

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%' }}
      className="rounded-lg border border-border shadow-sm"
    />
  );
};

export default VesselMap;