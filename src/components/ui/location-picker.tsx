import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, X, Check, Target } from 'lucide-react';

// Fix default marker icons for Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LocationPickerProps {
  lat?: number;
  lng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  lat,
  lng,
  onLocationSelect,
  isOpen,
  onClose
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Default center (Dubai)
  const defaultCenter: [number, number] = [25.276987, 55.296249];
  const initialCenter: [number, number] = 
    (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) 
      ? [lat, lng] 
      : defaultCenter;

  // Initialize map when dialog opens
  useEffect(() => {
    if (!isOpen || !mapRef.current) {
      return;
    }

    // Clean up existing map
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
      markerRef.current = null;
    }

    // Reset state
    setSelectedCoords(null);
    setIsMapReady(false);

    // Create map after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      try {
        // Create the map
        const map = L.map(mapRef.current, {
          center: initialCenter,
          zoom: lat !== undefined && lng !== undefined ? 10 : 6,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          dragging: true,
          touchZoom: true,
          zoomControl: true
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add existing marker if coordinates are provided
        if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
          const existingMarker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`Current: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          markerRef.current = existingMarker;
        }

        // Handle map clicks
        map.on('click', (e: L.LeafletMouseEvent) => {
          const clickLat = parseFloat(e.latlng.lat.toFixed(6));
          const clickLng = parseFloat(e.latlng.lng.toFixed(6));

          // Remove existing marker
          if (markerRef.current) {
            map.removeLayer(markerRef.current);
          }

          // Add new marker
          const newMarker = L.marker([clickLat, clickLng])
            .addTo(map)
            .bindPopup(`Selected: ${clickLat}, ${clickLng}`)
            .openPopup();
          
          markerRef.current = newMarker;
          setSelectedCoords({ lat: clickLat, lng: clickLng });
        });

        // Ensure map renders correctly
        setTimeout(() => {
          map.invalidateSize();
          setIsMapReady(true);
        }, 100);

        leafletMapRef.current = map;

      } catch (error) {
        console.error('Error creating map:', error);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen, lat, lng]);

  const handleConfirm = () => {
    if (selectedCoords) {
      onLocationSelect(selectedCoords.lat, selectedCoords.lng);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedCoords(null);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <Card className="w-full max-w-4xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Select Location</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border-b">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              <strong>Click anywhere on the map</strong> to select coordinates. A marker will appear at the clicked location.
            </p>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 p-4">
          <div 
            ref={mapRef}
            className="w-full h-full rounded-lg border-2 border-gray-300 bg-gray-100 cursor-crosshair"
            style={{ minHeight: '400px' }}
          >
            {!isMapReady && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-gray-500">Loading map...</div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Coordinates Display & Actions */}
        <div className="p-4 border-t bg-gray-50">
          {selectedCoords ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Location Selected:</p>
                <p className="text-sm font-mono text-gray-600">
                  Latitude: {selectedCoords.lat} | Longitude: {selectedCoords.lng}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-1" />
                  Confirm Location
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Current: Lat {initialCenter[0].toFixed(4)}, Lng {initialCenter[1].toFixed(4)}
                </p>
                <p className="text-xs text-gray-500">Click on the map to select a new location</p>
              </div>
              <Button variant="outline" onClick={handleCancel}>
                Close
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LocationPicker;