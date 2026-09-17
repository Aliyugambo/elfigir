import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';

type LatLng = { lat: number; lng: number; label: string; address?: string };

type MapEmbedProps = {
  pickupLat?: number | null;
  pickupLng?: number | null;
  pickupLabel?: string;
  pickupAddress?: string;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  dropoffLabel?: string;
  dropoffAddress?: string;
  riderLat?: number | null;
  riderLng?: number | null;
  riderLabel?: string;
  height?: string;
};

function hasCoords(lat?: number | null, lng?: number | null): boolean {
  return lat != null && lng != null && lat !== 0 && lng !== 0;
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
    })}`,
  );

  if (!response.ok) return null;
  const results = (await response.json()) as Array<{ lat: string; lon: string }>;
  if (!results[0]) return null;

  return { lat: Number(results[0].lat), lng: Number(results[0].lon) };
}

function MapViewport({ locations }: { locations: LatLng[] }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;

    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], 15);
      return;
    }

    map.fitBounds(
      locations.map((location) => [location.lat, location.lng] as [number, number]),
      { padding: [36, 36] },
    );
  }, [locations, map]);

  return null;
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
  riderLat,
  riderLng,
  riderLabel = 'Rider',
  height = '320px',
}: MapEmbedProps) {
  const [mounted, setMounted] = useState(false);
  const [resolvedPickup, setResolvedPickup] = useState<{ lat: number; lng: number } | null>(null);
  const [resolvedDropoff, setResolvedDropoff] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<L.LatLngExpression[] | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;

    const resolveLocations = async () => {
      setIsResolving(true);
      setRoute(null);

      const [pickupResult, dropoffResult] = await Promise.all([
        hasCoords(pickupLat, pickupLng)
          ? Promise.resolve({ lat: pickupLat!, lng: pickupLng! })
          : pickupAddress
            ? geocodeAddress(pickupAddress).catch(() => null)
            : Promise.resolve(null),
        hasCoords(dropoffLat, dropoffLng)
          ? Promise.resolve({ lat: dropoffLat!, lng: dropoffLng! })
          : dropoffAddress
            ? geocodeAddress(dropoffAddress).catch(() => null)
            : Promise.resolve(null),
      ]);

      if (cancelled) return;
      setResolvedPickup(pickupResult);
      setResolvedDropoff(dropoffResult);
      setIsResolving(false);

      const currentRider = hasCoords(riderLat, riderLng)
        ? { lat: riderLat!, lng: riderLng! }
        : null;
      const routeStart = currentRider || pickupResult;
      if (!routeStart || !dropoffResult) return;

      const routeResponse = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${routeStart.lng},${routeStart.lat};${dropoffResult.lng},${dropoffResult.lat}?overview=full&geometries=geojson`,
      ).catch(() => null);
      if (!routeResponse?.ok || cancelled) return;

      const routeData = await routeResponse.json() as {
        routes?: Array<{ geometry?: { coordinates: Array<[number, number]> } }>;
      };
      const coordinates = routeData.routes?.[0]?.geometry?.coordinates;
      if (coordinates && !cancelled) {
        setRoute(coordinates.map(([lng, lat]) => [lat, lng]));
      }
    };

    resolveLocations();
    return () => {
      cancelled = true;
    };
  }, [pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng, riderLat, riderLng]);

  const rider = hasCoords(riderLat, riderLng)
    ? { lat: riderLat!, lng: riderLng!, label: riderLabel }
    : null;

  const { pickup, dropoff, center, zoom } = useMemo(() => {
    const hasPickup = resolvedPickup != null;
    const hasDropoff = resolvedDropoff != null;

    const p: LatLng | null = hasPickup
      ? { ...resolvedPickup!, label: pickupLabel, address: pickupAddress }
      : null;

    const d: LatLng | null = hasDropoff
      ? { ...resolvedDropoff!, label: dropoffLabel, address: dropoffAddress }
      : null;

    let center: L.LatLngExpression = [0, 0];
    let zoom = 13;

    const routeStart = rider || p;
    if (routeStart && d) {
      center = [
        (routeStart.lat + d.lat) / 2,
        (routeStart.lng + d.lng) / 2,
      ];
      zoom = 13;
    } else if (p) {
      center = [p.lat, p.lng];
      zoom = 15;
    } else if (d) {
      center = [d.lat, d.lng];
      zoom = 15;
    }

    return { pickup: p, dropoff: d, center, zoom };
  }, [dropoffAddress, dropoffLabel, pickupAddress, pickupLabel, resolvedDropoff, resolvedPickup, rider]);

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="w-full bg-cream rounded-lg border border-cream animate-pulse"
      />
    );
  }

  if (isResolving && !pickup && !dropoff) {
    return (
      <div style={{ height }} className="w-full bg-cream rounded-lg border border-cream flex items-center justify-center">
        <p className="text-charcoal-light text-sm">Finding delivery locations...</p>
      </div>
    );
  }

  if (!pickup && !dropoff) {
    return (
      <div
        style={{ height }}
        className="w-full bg-cream rounded-lg border border-cream flex items-center justify-center"
      >
        <p className="text-charcoal-light text-sm">No location data available for this order.</p>
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className="w-full rounded-lg overflow-hidden border border-cream"
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <MapViewport locations={[pickup, rider, dropoff].filter((location): location is LatLng => Boolean(location))} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pickup && (
          <Marker
            position={[pickup.lat, pickup.lng]}
            icon={getIcon(pickup.label) ?? undefined}
          >
            <Popup>{pickup.label}{pickup.address ? `: ${pickup.address}` : ''}</Popup>
          </Marker>
        )}

        {dropoff && (
          <Marker
            position={[dropoff.lat, dropoff.lng]}
            icon={getIcon(dropoff.label) ?? undefined}
          >
            <Popup>{dropoff.label}{dropoff.address ? `: ${dropoff.address}` : ''}</Popup>
          </Marker>
        )}

        {rider && (
          <Marker
            position={[rider.lat, rider.lng]}
            icon={getIcon(rider.label) ?? undefined}
          >
            <Popup>{rider.label} is here now</Popup>
          </Marker>
        )}

        {route && <Polyline positions={route} color="#D84A51" weight={5} />}
      </MapContainer>
    </div>
  );
}
