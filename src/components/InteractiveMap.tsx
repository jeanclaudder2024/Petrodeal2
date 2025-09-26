import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Ship, Anchor, Factory, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MapData {
  vessels: any[];
  ports: any[];
  refineries: any[];
}

interface InteractiveMapProps {
  data: MapData;
  height?: string;
  showRoutes?: boolean;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ data, height = "400px", showRoutes = true }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize the map with proper bounds and constraints
    const map = L.map(mapRef.current, {
      center: [30, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true,
      maxBounds: [[-90, -180], [90, 180]],
      maxBoundsViscosity: 1.0
    });

    // Add OpenStreetMap tiles with better world wrapping
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
      minZoom: 2,
      noWrap: false
    }).addTo(map);

    mapInstanceRef.current = map;

    // Custom icon creation function with proper icons
    const createCustomIcon = (color: string, iconType: 'vessel' | 'port' | 'refinery' | 'company') => {
      let iconSvg = '';
      
      switch (iconType) {
        case 'vessel':
          iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9-.5 2.5-1"/>
            <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
            <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
            <path d="M12 10v4"/>
            <path d="M12 2v3"/>
          </svg>`;
          break;
        case 'port':
          iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 12h.01"/>
            <path d="M12 12h.01"/>
            <path d="M16 12h.01"/>
            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Z"/>
            <path d="M8 8h8"/>
            <path d="M8 16h8"/>
          </svg>`;
          break;
        case 'refinery':
          iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
            <path d="M17 18h1"/>
            <path d="M12 18h1"/>
            <path d="M7 18h1"/>
          </svg>`;
          break;
        case 'company':
          iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
            <path d="M10 6h4"/>
            <path d="M10 10h4"/>
            <path d="M10 14h4"/>
            <path d="M10 18h4"/>
          </svg>`;
          break;
      }
      
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">${iconSvg}</div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });
    };

    // Add vessels to map with route lines
    console.log('Total vessels in data:', data.vessels?.length);
    console.log('Sample vessel data:', data.vessels?.[0]);
    
    data.vessels?.forEach((vessel: any, index: number) => {
      // Check multiple coordinate fields to ensure we capture all vessels
      const lat = vessel.current_lat || vessel.departure_lat || vessel.destination_lat || vessel.lat;
      const lng = vessel.current_lng || vessel.departure_lng || vessel.destination_lng || vessel.lng;
      
      console.log(`Vessel ${index + 1} (${vessel.name}):`, {
        current_lat: vessel.current_lat,
        current_lng: vessel.current_lng,
        departure_lat: vessel.departure_lat,
        departure_lng: vessel.departure_lng,
        destination_lat: vessel.destination_lat,
        destination_lng: vessel.destination_lng,
        lat: vessel.lat,
        lng: vessel.lng,
        finalLat: lat,
        finalLng: lng
      });
      
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        console.log(`Adding vessel ${vessel.name} to map at [${lat}, ${lng}]`);
        
        const marker = L.marker([lat, lng], {
          icon: createCustomIcon('#3b82f6', 'vessel')
        }).addTo(map);

        // Find destination port if available
        let destinationPort = null;
        if (vessel.destination_port) {
          destinationPort = data.ports?.find(port => port.id === vessel.destination_port);
        }

        // Add route line to destination if showRoutes is enabled and destination exists
        if (showRoutes && destinationPort && destinationPort.lat && destinationPort.lng) {
          // Create animated route line
          const routeLine = L.polyline([
            [lat, lng],
            [destinationPort.lat, destinationPort.lng]
          ], {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10',
            className: 'vessel-route-line'
          }).addTo(map);

          // Add arrow marker at the end of the route
          const arrowIcon = L.divIcon({
            className: 'route-arrow',
            html: `
              <div style="
                background-color: #3b82f6;
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-bottom: 12px solid #3b82f6;
                transform: rotate(${calculateBearing(lat, lng, destinationPort.lat, destinationPort.lng)}deg);
              "></div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });

          L.marker([destinationPort.lat, destinationPort.lng], {
            icon: arrowIcon
          }).addTo(map);
        }
        
        const popupContent = `
          <div class="p-4 min-w-[300px]">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
              <h3 class="font-bold text-lg text-blue-600">${vessel.name || 'Unknown Vessel'}</h3>
            </div>
            <div class="space-y-2 text-sm">
              <div class="grid grid-cols-2 gap-2">
                <div><strong>MMSI:</strong> ${vessel.mmsi || 'N/A'}</div>
                <div><strong>IMO:</strong> ${vessel.imo || 'N/A'}</div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div><strong>Type:</strong> ${vessel.vessel_type || 'N/A'}</div>
                <div><strong>Flag:</strong> ${vessel.flag || 'N/A'}</div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div><strong>Status:</strong> ${vessel.status || 'N/A'}</div>
                <div><strong>Speed:</strong> ${vessel.speed || 'N/A'} knots</div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div><strong>Heading:</strong> ${vessel.course || 'N/A'}°</div>
                <div><strong>ETA:</strong> ${vessel.eta || 'N/A'}</div>
              </div>
              ${destinationPort ? `
                <div class="mt-3 p-2 bg-blue-50 rounded-lg">
                  <strong>🎯 Destination:</strong><br>
                  <span class="text-blue-600">${destinationPort.name} (${destinationPort.country})</span><br>
                  <small class="text-gray-500">Distance: ${calculateDistance(lat, lng, destinationPort.lat, destinationPort.lng).toFixed(1)} nm</small>
                </div>
              ` : ''}
              ${vessel.cargo_type ? `<div><strong>Cargo:</strong> ${vessel.cargo_type}</div>` : ''}
              ${vessel.deadweight ? `<div><strong>Deadweight:</strong> ${vessel.deadweight} DWT</div>` : ''}
              ${vessel.built ? `<div><strong>Built:</strong> ${vessel.built}</div>` : ''}
            </div>
            <div class="mt-4 pt-3 border-t border-gray-200">
              <button 
                onclick="window.dispatchEvent(new CustomEvent('navigate', {detail: '/vessels/${vessel.id}'}))"
                class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M7 17L17 7M17 7H7M17 7V17"/>
                </svg>
                View Vessel Details
              </button>
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent, {
          maxWidth: 350,
          className: 'custom-popup'
        });
      } else {
        console.log(`Skipping vessel ${vessel.name} - no valid coordinates:`, {
          lat,
          lng,
          latValid: lat && !isNaN(lat),
          lngValid: lng && !isNaN(lng)
        });
      }
    });

    console.log('Vessels processing complete');

    // Helper function to calculate bearing between two points
    function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const lat1Rad = lat1 * Math.PI / 180;
      const lat2Rad = lat2 * Math.PI / 180;
      
      const y = Math.sin(dLng) * Math.cos(lat2Rad);
      const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
      
      let bearing = Math.atan2(y, x) * 180 / Math.PI;
      return (bearing + 360) % 360;
    }

    // Helper function to calculate distance between two points in nautical miles
    function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
      const R = 3440.065; // Earth's radius in nautical miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }

    // Add ports to map
    data.ports?.forEach((port: any) => {
      if (port.lat && port.lng) {
        const marker = L.marker([port.lat, port.lng], {
          icon: createCustomIcon('#10b981', 'port')
        }).addTo(map);
        
        const popupContent = `
          <div class="p-4 min-w-[300px]">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-4 h-4 bg-green-500 rounded-full"></div>
              <h3 class="font-bold text-lg text-green-600">${port.name || 'Unknown Port'}</h3>
            </div>
            <div class="space-y-2 text-sm">
              <div class="grid grid-cols-2 gap-2">
                <div><strong>Country:</strong> ${port.country || 'N/A'}</div>
                <div><strong>City:</strong> ${port.city || 'N/A'}</div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div><strong>Type:</strong> ${port.port_type || 'N/A'}</div>
                <div><strong>Status:</strong> ${port.status || 'Active'}</div>
              </div>
              ${port.capacity ? `<div><strong>Capacity:</strong> ${port.capacity.toLocaleString()} tons</div>` : ''}
              ${port.berth_count ? `<div><strong>Berths:</strong> ${port.berth_count}</div>` : ''}
              ${port.max_vessel_length ? `<div><strong>Max Vessel Length:</strong> ${port.max_vessel_length}m</div>` : ''}
              ${port.services ? `<div><strong>Services:</strong> ${port.services}</div>` : ''}
            </div>
            <div class="mt-4 pt-3 border-t border-gray-200">
              <button 
                onclick="window.dispatchEvent(new CustomEvent('navigate', {detail: '/ports/${port.id}'}))"
                class="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M7 17L17 7M17 7H7M17 7V17"/>
                </svg>
                View Port Details
              </button>
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent, {
          maxWidth: 350,
          className: 'custom-popup'
        });
      }
    });

    // Add refineries to map
    data.refineries?.forEach((refinery: any) => {
      if (refinery.lat && refinery.lng) {
        const marker = L.marker([refinery.lat, refinery.lng], {
          icon: createCustomIcon('#f97316', 'refinery')
        }).addTo(map);
        
        const popupContent = `
          <div class="p-4 min-w-[300px]">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-4 h-4 bg-orange-500 rounded-full"></div>
              <h3 class="font-bold text-lg text-orange-600">${refinery.name || 'Unknown Refinery'}</h3>
            </div>
            <div class="space-y-2 text-sm">
              <div class="grid grid-cols-2 gap-2">
                <div><strong>Country:</strong> ${refinery.country || 'N/A'}</div>
                <div><strong>Owner:</strong> ${refinery.owner || 'N/A'}</div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div><strong>Status:</strong> ${refinery.status || 'Active'}</div>
                <div><strong>Type:</strong> ${refinery.type || 'N/A'}</div>
              </div>
              ${refinery.capacity ? `<div><strong>Capacity:</strong> ${refinery.capacity.toLocaleString()} bpd</div>` : ''}
              ${refinery.processing_capacity ? `<div><strong>Processing:</strong> ${refinery.processing_capacity.toLocaleString()} bpd</div>` : ''}
              ${refinery.complexity ? `<div><strong>Complexity:</strong> ${refinery.complexity}</div>` : ''}
              ${refinery.fuel_types ? `<div><strong>Fuel Types:</strong> ${refinery.fuel_types}</div>` : ''}
            </div>
            <div class="mt-4 pt-3 border-t border-gray-200">
              <button 
                onclick="window.dispatchEvent(new CustomEvent('navigate', {detail: '/refineries/${refinery.id}'}))"
                class="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M7 17L17 7M17 7H7M17 7V17"/>
                </svg>
                View Refinery Details
              </button>
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent, {
          maxWidth: 350,
          className: 'custom-popup'
        });
      }
    });


    // Listen for navigation events from popups
    const handleNavigation = (event: any) => {
      navigate(event.detail);
    };
    
    window.addEventListener('navigate', handleNavigation);

    return () => {
      window.removeEventListener('navigate', handleNavigation);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [data]);

  return (
    <div 
      style={{ height, width: '100%' }} 
      className="relative rounded-lg overflow-hidden shadow-lg z-10"
    >
      <div 
        ref={mapRef} 
        style={{ height: '100%', width: '100%' }} 
        className="relative z-10"
      />
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1001]">
        <h4 className="font-semibold text-sm mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Vessels ({data.vessels?.length || 0})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Ports ({data.ports?.length || 0})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Refineries ({data.refineries?.length || 0})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;