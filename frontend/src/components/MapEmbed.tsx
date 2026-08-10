import { useMemo, useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from 'react-leaflet';
import L from 'leaflet';

type LatLng = { lat: number; lng: number; label: string };

type MapEmbedProps = {
  pickupLat?: number | null;
  pickupLng?: number | null;
  pickupLabel?: string;
  pickupAddress?: string;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  dropoffLabel?: string;
  dropoffAddress?: string;
  height?: string;
};

function hasCoords(lat?: number | null, lng?: number | null): boolean {
  return lat != null && lng != null && lat !== 0 && lng !== 0;
}

const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.7/images/marker-icon.png';
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.7/images/marker-shadow.png';

const getIcon = (label: string) => {
  const colorMap: Record<string, string> = {
    Restaurant: '#D84A51',
    Pickup: '#D84A51',
    Customer: '#FF6B35',
    'Drop-off': '#FF6B35',
  };
  const color = colorMap[label] || '#3388ff';

  if (typeof window === 'undefined') return null;

  const icon = L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        border-radius: 50%;
        width: 24px;
        height: 24px;
        border: 3px solid white;
        box-shadow: 0 0 6px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="white" viewBox="0 0 16 16">
          <path d="M8 0C4.4 0 1.2 3.2 1.2 7.2c0 2.8 2.4 4.8 5.6 7.2 1.2 1 1.9 1.6 2.4 2 0.5-0.4 1.2-1 2.4-2 3.2-2.4 5.6-4.4 5.6-7.2S11.6 0 8 0z"/>
        </svg>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
  return icon;
};

export default function MapEmbed({
  pickupLat,
  pickupLng,
  pickupLabel = 'Pickup',
  pickupAddress,
  dropoffLat,
  dropoffLng,
  dropoffLabel = 'Drop-off',
  dropoffAddress,
  height = '320px',
}: MapEmbedProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { pickup, dropoff, polyline, center, zoom } = useMemo(() => {
    const hasPickup = hasCoords(pickupLat, pickupLng);
    const hasDropoff = hasCoords(dropoffLat, dropoffLng);

    const p: LatLng | null = hasPickup
      ? { lat: pickupLat!, lng: pickupLng!, label: pickupLabel }
      : null;

    const d: LatLng | null = hasDropoff
      ? { lat: dropoffLat!, lng: dropoffLng!, label: dropoffLabel }
      : null;

    let poly: L.LatLngExpression[] | null = null;
    if (p && d) {
      poly = [[p.lat, p.lng], [d.lat, d.lng]];
    }

    let center: L.LatLngExpression = [0, 0];
    let zoom = 13;

    if (p && d) {
      center = [
        (p.lat + d.lat) / 2,
        (p.lng + d.lng) / 2,
      ];
      zoom = 13;
    } else if (p) {
      center = [p.lat, p.lng];
      zoom = 15;
    } else if (d) {
      center = [d.lat, d.lng];
      zoom = 15;
    }

    return { pickup: p, dropoff: d, polyline: poly, center, zoom };
  }, [pickupLat, pickupLng, pickupLabel, dropoffLat, dropoffLng, dropoffLabel]);

  const fallbackAddress = useMemo(() => {
    if (pickupAddress && !pickup && !dropoff) {
      return { address: pickupAddress, label: pickupLabel };
    }
    if (dropoffAddress && !dropoff) {
      return { address: dropoffAddress, label: dropoffLabel };
    }
    return null;
  }, [pickupAddress, dropoffAddress, pickup, dropoff, pickupLabel, dropoffLabel]);

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="w-full bg-gray-100 rounded-lg border border-gray-200 animate-pulse"
      />
    );
  }

  if (!pickup && !dropoff && !fallbackAddress) {
    return (
      <div
        style={{ height }}
        className="w-full bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center"
      >
        <p className="text-gray-500 text-sm">No location data available for this order.</p>
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className="w-full rounded-lg overflow-hidden border border-gray-200"
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pickup && (
          <Marker
            position={[pickup.lat, pickup.lng]}
            icon={getIcon(pickup.label) ?? undefined}
          >
            <Popup>{pickup.label}</Popup>
          </Marker>
        )}

        {dropoff && (
          <Marker
            position={[dropoff.lat, dropoff.lng]}
            icon={getIcon(dropoff.label) ?? undefined}
          >
            <Popup>{dropoff.label}</Popup>
          </Marker>
        )}

        {polyline && <Polyline positions={polyline} color="#D84A51" />}
      </MapContainer>
    </div>
  );
}
