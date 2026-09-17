'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/order.service';
import { FaLocationArrow, FaRegClock, FaRoute } from 'react-icons/fa';
import { toast } from 'sonner';

const MapEmbed = dynamic(() => import('@/components/MapEmbed'), { ssr: false });

type LiveDeliveryMapProps = {
  orderId: string;
  isRider?: boolean;
  pickup: { lat?: number | null; lng?: number | null; label: string; address?: string };
  dropoff: { lat?: number | null; lng?: number | null; label: string; address?: string };
};

function formatDistance(meters?: number | null) {
  if (meters == null) return 'Calculating distance';
  return meters < 1000 ? `${meters} m away` : `${(meters / 1000).toFixed(1)} km away`;
}

function formatEta(seconds?: number | null) {
  if (seconds == null) return 'Calculating ETA';
  if (seconds < 60) return 'Arriving now';
  return `${Math.ceil(seconds / 60)} min ETA`;
}

export default function LiveDeliveryMap({ orderId, isRider = false, pickup, dropoff }: LiveDeliveryMapProps) {
  const queryClient = useQueryClient();
  const [locationError, setLocationError] = useState<string | null>(null);
  const arrivalAlertShown = useRef(false);

  const { data: tracking } = useQuery({
    queryKey: ['delivery-tracking', orderId],
    queryFn: () => orderService.getDeliveryTracking(orderId),
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  useEffect(() => {
    if (!isRider || typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    const watcher = navigator.geolocation.watchPosition(
      async (position) => {
        setLocationError(null);
        try {
          await orderService.updateDeliveryLocation(orderId, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: position.coords.heading ?? undefined,
            speed: position.coords.speed ?? undefined,
          });
          queryClient.invalidateQueries({ queryKey: ['delivery-tracking', orderId] });
        } catch {
          setLocationError('Location update failed. Keep this page open while delivering.');
        }
      },
      () => setLocationError('Allow location access so the customer can follow your trip.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, [isRider, orderId, queryClient]);

  const live = tracking?.tracking;
  const arrived = Boolean(live?.arrivedAt);

  useEffect(() => {
    if (arrived && !arrivalAlertShown.current) {
      arrivalAlertShown.current = true;
      toast.success(isRider ? 'You have reached the delivery destination.' : 'Your rider has reached the delivery destination.');
    }
  }, [arrived, isRider]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <div className="rounded-lg bg-cream px-3 py-2">
          <div className="flex items-center gap-2 text-charcoal-light"><FaRoute /> Distance</div>
          <strong className="text-charcoal">{formatDistance(live?.distanceMeters)}</strong>
        </div>
        <div className="rounded-lg bg-cream px-3 py-2">
          <div className="flex items-center gap-2 text-charcoal-light"><FaRegClock /> ETA</div>
          <strong className="text-charcoal">{formatEta(live?.etaSeconds)}</strong>
        </div>
        <div className="rounded-lg bg-cream px-3 py-2 col-span-2">
          <div className="flex items-center gap-2 text-charcoal-light"><FaLocationArrow /> Status</div>
          <strong className={arrived ? 'text-green-700' : 'text-charcoal'}>
            {arrived ? 'Rider has arrived' : live ? 'Rider is on the way' : 'Waiting for rider location'}
          </strong>
        </div>
      </div>

      <MapEmbed
        pickupLat={pickup.lat}
        pickupLng={pickup.lng}
        pickupLabel={pickup.label}
        pickupAddress={pickup.address}
        dropoffLat={dropoff.lat}
        dropoffLng={dropoff.lng}
        dropoffLabel={dropoff.label}
        dropoffAddress={dropoff.address}
        riderLat={live?.latitude}
        riderLng={live?.longitude}
        riderLabel={isRider ? 'Your location' : 'Rider'}
        height="420px"
      />

      <p className="text-xs text-charcoal-light">
        {live?.lastUpdatedAt
          ? `Last updated ${new Date(live.lastUpdatedAt).toLocaleTimeString()}`
          : 'Live tracking starts when the rider allows location access.'}
      </p>
      {locationError && isRider && <p className="text-sm text-red-700">{locationError}</p>}
      {arrived && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          The rider has reached the delivery destination.
        </div>
      )}
    </div>
  );
}
