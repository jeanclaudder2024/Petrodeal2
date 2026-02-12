import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';

interface MapData {
  vessels: any[];
  ports: any[];
  refineries: any[];
  companies?: any[];
}

interface InteractiveMapProps {
  data: MapData;
  height?: string;
  showRoutes?: boolean;
  theme?: 'light' | 'dark';
}

const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

const InteractiveMap: React.FC<InteractiveMapProps> = ({ data, height = "400px", showRoutes = true, theme = 'dark' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const navigate = useNavigate();

  const isDark = theme === 'dark';

  // Helper functions
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3440.065;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const createCustomIcon = useCallback((color: string, iconType: 'vessel' | 'port' | 'refinery' | 'company') => {
    let iconSvg = '';
    switch (iconType) {
      case 'vessel':
        iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9-.5 2.5-1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/><path d="M12 2v3"/></svg>`;
        break;
      case 'port':
        iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 8h8"/><path d="M8 16h8"/></svg>`;
        break;
      case 'refinery':
        iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>`;
        break;
      case 'company':
        iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/></svg>`;
        break;
    }
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color:${color};width:18px;height:18px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">${iconSvg}</div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  }, []);

  // Map initialization (runs once)
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Cleanup previous instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      center: [30, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true,
      maxBounds: [[-90, -180], [90, 180]],
      maxBoundsViscosity: 1.0
    });

    tileLayerRef.current = L.tileLayer(isDark ? DARK_TILES : LIGHT_TILES, {
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 18,
      minZoom: 2,
      noWrap: false
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

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
  }, []); // Only run once on mount

  // Theme change effect - swap tiles without recreating map
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    
    tileLayerRef.current.setUrl(isDark ? DARK_TILES : LIGHT_TILES);
  }, [isDark]);

  // Data/marker update effect - clears and re-adds markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const popupBg = isDark ? '#1E293B' : '#FFFFFF';
    const popupText = isDark ? '#E2E8F0' : '#1E293B';
    const popupSubtext = isDark ? '#94A3B8' : '#64748B';
    const popupAccentBg = isDark ? '#0F172A' : '#F1F5F9';
    const popupBorder = isDark ? '#334155' : '#E2E8F0';

    // Add vessels
    data.vessels?.forEach((vessel: any) => {
      const lat = vessel.current_lat || vessel.departure_lat || vessel.destination_lat || vessel.lat;
      const lng = vessel.current_lng || vessel.departure_lng || vessel.destination_lng || vessel.lng;
      
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        const marker = L.marker([lat, lng], {
          icon: createCustomIcon('#3b82f6', 'vessel')
        });
        layerGroup.addLayer(marker);

        let destinationPort = null;
        if (vessel.destination_port) {
          destinationPort = data.ports?.find(port => port.id === vessel.destination_port);
        }

        if (showRoutes && destinationPort && destinationPort.lat && destinationPort.lng) {
          const cargoType = (vessel.cargo_type || '').toLowerCase();
          let routeColor = '#3b82f6';
          if (cargoType.includes('crude') || cargoType.includes('oil')) routeColor = '#F59E0B';
          else if (cargoType.includes('lng') || cargoType.includes('gas')) routeColor = '#22D3EE';

          const volume = vessel.deadweight || vessel.cargo_capacity || 50000;
          const weight = Math.max(2, Math.min(6, volume / 50000));

          const routeLine = L.polyline([
            [lat, lng],
            [destinationPort.lat, destinationPort.lng]
          ], {
            color: routeColor,
            weight: weight,
            opacity: 0.7,
            dashArray: '10, 10'
          });
          layerGroup.addLayer(routeLine);
        }
        
        const popupContent = `
          <div class="p-4 min-w-[300px]" style="background:${popupBg};color:${popupText};border-radius:8px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <div style="width:10px;height:10px;background:#22D3EE;border-radius:50%;"></div>
              <h3 style="font-weight:700;font-size:16px;">${vessel.name || 'Unknown Vessel'}</h3>
            </div>
            <div style="font-size:13px;line-height:1.8;">
              <div><strong style="color:${popupSubtext};">IMO:</strong> ${vessel.imo || 'N/A'} | <strong style="color:${popupSubtext};">MMSI:</strong> ${vessel.mmsi || 'N/A'}</div>
              <div><strong style="color:${popupSubtext};">Type:</strong> ${vessel.vessel_type || 'N/A'} | <strong style="color:${popupSubtext};">Flag:</strong> ${vessel.flag || 'N/A'}</div>
              <div><strong style="color:${popupSubtext};">Speed:</strong> ${vessel.speed || 'N/A'} knots | <strong style="color:${popupSubtext};">Status:</strong> ${vessel.status || 'N/A'}</div>
              ${vessel.cargo_type ? `<div><strong style="color:${popupSubtext};">Cargo:</strong> <span style="color:#F59E0B;">${vessel.cargo_type}</span></div>` : ''}
              ${vessel.deadweight ? `<div><strong style="color:${popupSubtext};">Volume:</strong> ${vessel.deadweight} DWT</div>` : ''}
              ${destinationPort ? `
                <div style="margin-top:8px;padding:8px;background:${popupAccentBg};border-radius:6px;border:1px solid ${popupBorder};">
                  <strong style="color:#22D3EE;">Destination:</strong> ${destinationPort.name} (${destinationPort.country})<br>
                  <small style="color:${popupSubtext};">Distance: ${calculateDistance(lat, lng, destinationPort.lat, destinationPort.lng).toFixed(1)} nm</small>
                </div>
              ` : ''}
            </div>
            <div style="margin-top:12px;padding-top:8px;border-top:1px solid ${popupBorder};">
              <button onclick="window.dispatchEvent(new CustomEvent('navigate', {detail: '/vessels/${vessel.id}'}))"
                style="width:100%;background:#22D3EE;color:#0F172A;font-weight:600;padding:8px;border-radius:6px;border:none;cursor:pointer;">
                View Vessel Details
              </button>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent, { maxWidth: 350, className: 'custom-popup' });
      }
    });

    // Add ports
    data.ports?.forEach((port: any) => {
      if (port.lat && port.lng) {
        const marker = L.marker([port.lat, port.lng], {
          icon: createCustomIcon('#10b981', 'port')
        });
        layerGroup.addLayer(marker);
        
        const popupContent = `
          <div class="p-4 min-w-[280px]" style="background:${popupBg};color:${popupText};border-radius:8px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <div style="width:10px;height:10px;background:#10b981;border-radius:50%;"></div>
              <h3 style="font-weight:700;font-size:16px;">${port.name || 'Unknown Port'}</h3>
            </div>
            <div style="font-size:13px;line-height:1.8;">
              <div><strong style="color:${popupSubtext};">Country:</strong> ${port.country || 'N/A'}</div>
              <div><strong style="color:${popupSubtext};">Type:</strong> ${port.port_type || 'N/A'}</div>
              ${port.capacity ? `<div><strong style="color:${popupSubtext};">Capacity:</strong> ${port.capacity.toLocaleString()} tons</div>` : ''}
            </div>
            <div style="margin-top:12px;padding-top:8px;border-top:1px solid ${popupBorder};">
              <button onclick="window.dispatchEvent(new CustomEvent('navigate', {detail: '/ports/${port.id}'}))"
                style="width:100%;background:#10b981;color:white;font-weight:600;padding:8px;border-radius:6px;border:none;cursor:pointer;">
                View Port Details
              </button>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent, { maxWidth: 350, className: 'custom-popup' });
      }
    });

    // Add refineries
    data.refineries?.forEach((refinery: any) => {
      if (refinery.lat && refinery.lng) {
        const marker = L.marker([refinery.lat, refinery.lng], {
          icon: createCustomIcon('#f97316', 'refinery')
        });
        layerGroup.addLayer(marker);
        
        const popupContent = `
          <div class="p-4 min-w-[280px]" style="background:${popupBg};color:${popupText};border-radius:8px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <div style="width:10px;height:10px;background:#f97316;border-radius:50%;"></div>
              <h3 style="font-weight:700;font-size:16px;">${refinery.name || 'Unknown Refinery'}</h3>
            </div>
            <div style="font-size:13px;line-height:1.8;">
              <div><strong style="color:${popupSubtext};">Country:</strong> ${refinery.country || 'N/A'}</div>
              <div><strong style="color:${popupSubtext};">Owner:</strong> ${refinery.owner || 'N/A'}</div>
              ${refinery.capacity ? `<div><strong style="color:${popupSubtext};">Capacity:</strong> ${refinery.capacity.toLocaleString()} bpd</div>` : ''}
            </div>
            <div style="margin-top:12px;padding-top:8px;border-top:1px solid ${popupBorder};">
              <button onclick="window.dispatchEvent(new CustomEvent('navigate', {detail: '/refineries/${refinery.id}'}))"
                style="width:100%;background:#f97316;color:white;font-weight:600;padding:8px;border-radius:6px;border:none;cursor:pointer;">
                View Refinery Details
              </button>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent, { maxWidth: 350, className: 'custom-popup' });
      }
    });

    // Add companies
    data.companies?.forEach((company: any) => {
      let lat = company.lat || company.headquarters_lat;
      let lng = company.lng || company.headquarters_lng;
      
      if (!lat || !lng) {
        const countryCoords: Record<string, { lat: number; lng: number }> = {
          'United Arab Emirates': { lat: 25.2, lng: 55.3 },
          'UAE': { lat: 25.2, lng: 55.3 },
          'Saudi Arabia': { lat: 24.7, lng: 46.7 },
          'Qatar': { lat: 25.3, lng: 51.5 },
          'Kuwait': { lat: 29.4, lng: 47.9 },
          'USA': { lat: 29.8, lng: -95.4 },
          'United States': { lat: 29.8, lng: -95.4 },
          'UK': { lat: 51.5, lng: -0.1 },
          'United Kingdom': { lat: 51.5, lng: -0.1 },
          'Singapore': { lat: 1.3, lng: 103.8 },
          'China': { lat: 31.2, lng: 121.5 },
          'Japan': { lat: 35.7, lng: 139.8 },
          'Netherlands': { lat: 51.9, lng: 4.5 },
          'Norway': { lat: 59.9, lng: 10.7 },
        };
        const coords = countryCoords[company.country] || countryCoords[company.registration_country];
        if (coords) {
          lat = coords.lat + (Math.random() * 0.5 - 0.25);
          lng = coords.lng + (Math.random() * 0.5 - 0.25);
        }
      }
      
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        const vesselCount = company.vessel_count || 0;
        const companyIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="position:relative;background-color:#8b5cf6;width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/></svg>
              ${vesselCount > 0 ? `<div style="position:absolute;top:-8px;right:-8px;background:#ef4444;color:white;font-size:10px;font-weight:bold;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;">${vesselCount}</div>` : ''}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([lat, lng], { icon: companyIcon });
        layerGroup.addLayer(marker);
        
        const popupContent = `
          <div class="p-4 min-w-[280px]" style="background:${popupBg};color:${popupText};border-radius:8px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <div style="width:10px;height:10px;background:#8b5cf6;border-radius:50%;"></div>
              <h3 style="font-weight:700;font-size:16px;">${company.name || 'Unknown Company'}</h3>
            </div>
            <div style="font-size:13px;line-height:1.8;">
              <div><strong style="color:${popupSubtext};">Country:</strong> ${company.country || 'N/A'}</div>
              <div><strong style="color:${popupSubtext};">Vessels:</strong> ${vesselCount}</div>
            </div>
            <div style="margin-top:12px;padding-top:8px;border-top:1px solid ${popupBorder};">
              <button onclick="window.dispatchEvent(new CustomEvent('navigate', {detail: '/companies/${company.id}'}))"
                style="width:100%;background:#8b5cf6;color:white;font-weight:600;padding:8px;border-radius:6px;border:none;cursor:pointer;">
                View Company Details
              </button>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent, { maxWidth: 350, className: 'custom-popup' });
      }
    });

  }, [data, showRoutes, isDark, createCustomIcon, calculateDistance]);

  const legendBg = isDark ? 'bg-slate-800/95 text-slate-200' : 'bg-white/95 text-slate-800';

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
      <div className={`absolute bottom-4 left-4 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1001] ${legendBg}`}>
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
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Companies ({data.companies?.length || 0})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
