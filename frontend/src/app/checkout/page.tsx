'use client';

import { Suspense } from 'react';

import { motion } from 'framer-motion';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { orderService } from '@/services/order.service';
import { restaurantService } from '@/services/restaurant.service';
import Link from 'next/link';
import { FaArrowLeft, FaCreditCard, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'sonner';

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');
  const orderId = searchParams.get('orderId');

  const { items, getSubtotal } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [transferConfirmed, setTransferConfirmed] = useState(false);

  const subtotal = getSubtotal();
  const tax = subtotal * 0.005;
  const total = subtotal + tax;

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!restaurantId) return;
      try {
        const data = await restaurantService.getRestaurantById(restaurantId);
        setRestaurant(data);
        setBankDetails({
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          accountName: data.accountName,
        });
      } catch (error) {
        console.error('Failed to fetch restaurant details', error);
      }
    };

    fetchRestaurant();
  }, [restaurantId]);

  useEffect(() => {
    const checkTransferStatus = async () => {
      if (!orderId) return;
      try {
        const order = await orderService.getOrder(orderId);
        setPaymentMethod(order.paymentMethod);
        setTransferConfirmed(order.paymentStatus === 'PROCESSING' || order.paymentStatus === 'COMPLETED');
      } catch (error) {
        console.error('Failed to fetch order', error);
      }
    };

    checkTransferStatus();
  }, [orderId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const scriptId = 'paystack-inline';
    const script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.src = 'https://js.paystack.co/v1/inline.js';
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  const openPaystackModal = (orderId: string, amount: number) => {
    const paystack = (window as any).PaystackPop;
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

    if (!paystack || !publicKey) {
      toast.error('Paystack is not configured');
      return;
    }

    const handler = paystack.setup({
      key: publicKey,
      email: user?.email || '',
      amount: amount * 100,
      ref: `ELFIJR-${orderId}-${Date.now()}`,
      currency: 'NGN',
      callback: (response: any) => {
        setIsVerifyingPayment(true);
        orderService
          .verifyPaystackPayment(orderId, response.reference)
          .then(() => {
            toast.success('Payment successful!');
            router.push(`/orders/${orderId}`);
          })
          .catch((error) => {
            toast.error('Payment verification failed');
            console.error(error);
          })
          .finally(() => {
            setIsVerifyingPayment(false);
          });
      },
      onClose: () => {
        toast.error('Payment cancelled');
      },
    });

    handler.openIframe();
  };

  const handleCheckout = async () => {
    if (!deliveryAddress.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }

    setIsLoading(true);
    try {
      const orderData = {
        restaurantId,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          addOns: item.addOns.map((a) => a.id),
          specialNote: item.specialNote,
        })),
        deliveryAddress,
        paymentMethod,
        specialInstructions,
      };

      const response = await orderService.createOrder(orderData);

      if (paymentMethod === 'PAYSTACK') {
        openPaystackModal(response.id, total);
        return;
      }

      toast.success('Order placed successfully!');
      router.push(`/orders/${response.id}`);
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!orderId) return;

    setIsLoading(true);
    try {
      await orderService.confirmTransfer(orderId);
      setTransferConfirmed(true);
      toast.success('Transfer confirmed! Admin will verify your payment.');
    } catch (error) {
      toast.error('Failed to confirm transfer. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-charcoal mb-4">Sign in to checkout</h1>
        <p className="text-charcoal-light mb-8">You need to be logged in to place an order</p>
        <Link href="/login" className="btn-primary">
          Sign In
        </Link>
      </div>
    );
  }

  if (items.length === 0 && !orderId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-charcoal mb-4">Your cart is empty</h1>
        <Link href="/" className="btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/" className="flex items-center space-x-2 text-primary hover:text-primary-dark mb-4">
            <FaArrowLeft />
            <span>Back</span>
          </Link>
          <h1 className="text-3xl font-bold text-charcoal">{orderId ? 'Order Details' : 'Checkout'}</h1>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-8"
          >
            {!orderId && (
              <>
                {/* Delivery Address */}
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-cream">
                  <h2 className="text-lg sm:text-xl font-bold text-charcoal mb-3 sm:mb-4">Delivery Address</h2>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your delivery address..."
                    className="input-field"
                    rows={4}
                  />
                </div>

                {/* Special Instructions */}
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-cream">
                  <h2 className="text-lg sm:text-xl font-bold text-charcoal mb-3 sm:mb-4">Special Instructions</h2>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Add any special requests (e.g., no onions, extra spice)..."
                    className="input-field"
                    rows={3}
                  />
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-cream">
                  <h2 className="text-lg sm:text-xl font-bold text-charcoal mb-3 sm:mb-4">Payment Method</h2>
                  <div className="space-y-3">
                    <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition ${paymentMethod === 'BANK_TRANSFER' ? 'border-primary bg-primary/5' : 'border-cream hover:border-cream'}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="BANK_TRANSFER"
                        checked={paymentMethod === 'BANK_TRANSFER'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <FaCreditCard className="w-5 h-5 ml-3 text-primary" />
                      <span className="ml-3 font-semibold text-charcoal">Bank Transfer</span>
                    </label>
                    <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition ${paymentMethod === 'PAYSTACK' ? 'border-primary bg-primary/5' : 'border-cream hover:border-cream'}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="PAYSTACK"
                        checked={paymentMethod === 'PAYSTACK'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <FaCreditCard className="w-5 h-5 ml-3 text-primary" />
                      <span className="ml-3 font-semibold text-charcoal">Paystack</span>
                    </label>
                  </div>

                  {paymentMethod === 'BANK_TRANSFER' && bankDetails && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-charcoal mb-2">Bank Transfer Details</h3>
                      <p className="text-sm text-charcoal-light">Bank: {bankDetails.bankName || 'GT BANK'}</p>
                      <p className="text-sm text-charcoal-light">Account Name: {bankDetails.accountName || 'SQUAD ELFIJR KITCHEN LTD'}</p>
                      <p className="text-sm text-charcoal-light">Account Number: {bankDetails.accountNumber || '5000530466'}</p>
                    </div>
                  )}

                  {paymentMethod === 'PAYSTACK' && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-charcoal-light">You will be redirected to Paystack to complete your payment securely using card, bank transfer, or mobile money.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {orderId && paymentMethod === 'BANK_TRANSFER' && !transferConfirmed && (
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-cream">
                <h2 className="text-lg sm:text-xl font-bold text-charcoal mb-3 sm:mb-4">Confirm Bank Transfer</h2>
                {bankDetails && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-charcoal mb-2">Bank Transfer Details</h3>
                    <p className="text-sm text-charcoal-light">Bank: {bankDetails.bankName || 'GT BANK'}</p>
                    <p className="text-sm text-charcoal-light">Account Name: {bankDetails.accountName || 'SQUAD ELFIJR KITCHEN LTD'}</p>
                    <p className="text-sm text-charcoal-light">Account Number: {bankDetails.accountNumber || '5000530466'}</p>
                  </div>
                )}
                <p className="text-sm text-charcoal-light mb-4">
                  Please transfer the exact amount to the account above. Once you have made the transfer, click the button below to notify the admin.
                </p>
                <button
                  onClick={handleConfirmTransfer}
                  disabled={isLoading}
                  className="btn-primary py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Confirming...' : "I've Made the Transfer"}
                </button>
              </div>
            )}

            {orderId && transferConfirmed && (
                   <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-primary/20">
                <div className="flex items-center gap-3">
                   <FaCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-maroon" />
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-charcoal">Transfer Confirmed</h2>
                    <p className="text-sm text-charcoal-light">Admin will verify your payment shortly.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            {items.length > 0 && (
               <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-cream">
                 <h2 className="text-lg sm:text-xl font-bold text-charcoal mb-3 sm:mb-4">Order Summary</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-cream">
                      <div>
                        <p className="font-semibold text-charcoal">{item.menuItem.name}</p>
                        <p className="text-sm text-charcoal-light">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-charcoal">
                        ₦{(item.menuItem.price * item.quantity).toFixed(0)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Checkout Summary */}
          {!orderId && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-lg shadow-sm border border-cream p-4 sm:p-6 sticky top-24">
                <h3 className="text-base sm:text-lg font-bold text-charcoal mb-4 sm:mb-6">Order Total</h3>

                 <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-charcoal-light">Subtotal</span>
                    <span className="text-charcoal font-semibold">₦{subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-charcoal-light">Tax (0.5%)</span>
                    <span className="text-charcoal font-semibold">₦{tax.toFixed(0)}</span>
                  </div>

                  <div className="border-t border-cream pt-4 flex justify-between">
                    <span className="font-bold text-charcoal">Total</span>
                    <span className="font-bold text-primary text-xl">₦{total.toFixed(0)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isLoading || isVerifyingPayment}
                  className="w-full btn-primary py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : isVerifyingPayment ? 'Verifying Payment...' : 'Place Order'}
                </button>

                <p className="text-xs text-charcoal-light text-center mt-4">
                  By placing this order, you agree to our terms and conditions
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
