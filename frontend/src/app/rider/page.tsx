'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { orderService } from '@/services/order.service';
import { AdminOrder } from '@/services/admin.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { FaMotorcycle, FaCheckCircle, FaMapMarkerAlt, FaEye } from 'react-icons/fa';

const MapEmbed = dynamic(() => import('@/components/MapEmbed'), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full bg-cream rounded-lg border border-cream animate-pulse flex items-center justify-center">
      <span className="text-charcoal-light text-sm">Loading map...</span>
    </div>
  ),
});

const statusStyles: Record<string, string> = {
  READY_FOR_PICKUP: 'bg-mustard/10 text-maroon',
  OUT_FOR_DELIVERY: 'bg-mustard/20 text-maroon',
  DELIVERED: 'bg-mustard/10 text-maroon',
  COMPLETED: 'bg-mustard/10 text-maroon',
};

export default function RiderPortalPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (user?.role !== 'DELIVERY') {
      router.replace('/');
    }
  }, [isAuthenticated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['rider-orders'],
    queryFn: () => orderService.getStaffOrders({ page: 1, limit: 50 }),
    enabled: isAuthenticated && user?.role === 'DELIVERY',
    retry: false,
    refetchInterval: 3000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      orderService.updateStatus(id, { status }),
    onSuccess: () => {
      toast.success('Order updated');
      queryClient.invalidateQueries({ queryKey: ['rider-orders'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Update failed'),
  });

  const orders: AdminOrder[] = data?.orders ?? [];
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const pickUp = (id: string) => updateMutation.mutate({ id, status: 'OUT_FOR_DELIVERY' });
  const markDelivered = (id: string) => updateMutation.mutate({ id, status: 'DELIVERED' });

  const restaurantCoords = (order: AdminOrder) => ({
    lat: order.restaurant?.latitude,
    lng: order.restaurant?.longitude,
    label: order.restaurant?.name,
    address: order.restaurant?.address,
  });

  const customerCoords = (order: AdminOrder) => ({
    lat: order.deliveryLat,
    lng: order.deliveryLng,
    label: `${order.user?.firstName ?? ''} ${order.user?.lastName ?? ''}`.trim() || 'Customer',
    address: order.deliveryAddress,
  });

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Rider Portal</h1>
            <p className="text-charcoal-light mt-1">Dispatch orders that are ready for delivery.</p>
          </div>
          <Link href="/" className="btn-outline px-4 py-2 rounded-lg">
            Back to Home
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-lg bg-white animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg bg-white border border-cream p-10 text-center text-charcoal-light">
            No orders to dispatch today.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const pickup = restaurantCoords(order);
              const dropoff = customerCoords(order);
              const showMap =
                order.status === 'READY_FOR_PICKUP' || order.status === 'OUT_FOR_DELIVERY';
              const showDirections =
                order.status === 'OUT_FOR_DELIVERY' && dropoff.lat && dropoff.lng;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg border border-cream p-6 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-sm text-charcoal-light">Order {order.orderNumber}</p>
                      <p className="font-semibold text-charcoal">
                        {order.user.firstName} {order.user.lastName}
                      </p>
                      <p className="text-sm text-charcoal-light mt-1 flex items-center gap-1">
                        <FaMapMarkerAlt /> {order.restaurant.name}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold ${
                        statusStyles[order.status] ?? 'bg-cream text-charcoal'
                      }`}
                    >
                      <span>{order.status.replace(/_/g, ' ')}</span>
                    </span>
                  </div>

                  <div className="mt-4 border-t border-cream pt-4">
                    <ul className="space-y-1 text-sm text-charcoal">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between">
                          <span>
                            {item.menuItem.name} x{item.quantity}
                          </span>
                          <span>₦{(item.quantity * item.price).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-right font-bold text-primary">
                      ₦{order.totalAmount.toFixed(0)}
                    </p>
                  </div>

                  {order.deliveryAddress && (
                    <div className="mt-3 text-sm text-charcoal-light">
                      <span className="font-medium">Delivery:</span> {order.deliveryAddress}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {order.status === 'READY_FOR_PICKUP' && (
                      <button
                        onClick={() => pickUp(order.id)}
                        disabled={updateMutation.isPending}
                        className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <FaMotorcycle /> <span>Pick Up & Out for Delivery</span>
                      </button>
                    )}
                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => markDelivered(order.id)}
                        disabled={updateMutation.isPending}
                        className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <FaCheckCircle /> <span>Mark Delivered</span>
                      </button>
                    )}
                    {order.status === 'DELIVERED' && (
                      <span className="text-sm text-maroon font-semibold">
                        Delivered.
                      </span>
                    )}
                    <button
                      onClick={() =>
                        setExpandedOrderId(
                          expandedOrderId === order.id ? null : order.id,
                        )
                      }
                      className="btn-outline px-4 py-2 rounded-lg flex items-center space-x-2 text-sm"
                    >
                      <FaEye /> <span>{showMap && expandedOrderId === order.id ? 'Hide Map' : 'Show Map'}</span>
                    </button>
                  </div>

                  {expandedOrderId === order.id && showMap && (
                    <div className="mt-4 space-y-3">
                      {showDirections && (
                        <MapEmbed
                          pickupLat={pickup.lat}
                          pickupLng={pickup.lng}
                          pickupLabel={pickup.label}
                          pickupAddress={pickup.address}
                          dropoffLat={dropoff.lat}
                          dropoffLng={dropoff.lng}
                          dropoffLabel={dropoff.label}
                          dropoffAddress={dropoff.address}
                        />
                      )}
                      {!showDirections && (
                        <div className="text-sm text-charcoal-light mb-2">
                          Navigate to: <strong>{pickup.label}</strong>
                          <MapEmbed
                            pickupLat={pickup.lat}
                            pickupLng={pickup.lng}
                            pickupLabel={pickup.label}
                            pickupAddress={pickup.address}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
