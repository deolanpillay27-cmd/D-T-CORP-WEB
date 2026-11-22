import {Lock, Search, ShieldCheck, Truck} from 'lucide-react';
import {useState, type FormEvent} from 'react';
import type {CheckoutQuote, PaymentMethod, SouthAfricaProvince} from '../../shared/catalog.ts';
import {formatZar} from '../lib/format.ts';

interface LookedUpOrder {
  orderNumber: string;
  createdAt: string;
  status: string;
  shippingAddress: {
    suburbCity: string;
    province: SouthAfricaProvince;
    postalCode: string;
  };
  paymentSummary: {
    method: PaymentMethod;
    methodLabel: string;
    reference: string;
  };
  quote: CheckoutQuote;
}

export function DeliveryAndSupport() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundOrder, setFoundOrder] = useState<LookedUpOrder | null>(null);

  const handleLookup = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setFoundOrder(null);

    const trimmedOrder = orderNumber.trim().toUpperCase();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedOrder || !trimmedEmail) {
      setError('Enter both your order number and the email used at checkout.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/checkout/orders/${encodeURIComponent(trimmedOrder)}?email=${encodeURIComponent(trimmedEmail)}`,
      );
      const data = (await response.json()) as {order?: LookedUpOrder; error?: string};
      if (!response.ok || !data.order) {
        setError(data.error ?? 'Order could not be verified.');
      } else {
        setFoundOrder(data.order);
      }
    } catch {
      setError('Unable to reach order verification right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="delivery"
      aria-labelledby="delivery-heading"
      className="border-t border-zinc-200 bg-zinc-50 py-12 sm:py-16"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-zinc-500">
            South African Fulfillment &amp; Security
          </p>
          <h2
            id="delivery-heading"
            className="mt-1 font-display text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl"
          >
            Nationwide Delivery &amp; Verified Online Checkout
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 sm:text-base">
            Every D&amp;T Corp order ships from our Johannesburg warehouse via insured courier with online-only payment verification for customer and driver safety.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <Truck className="h-5 w-5 text-zinc-950" aria-hidden="true" />
            <h3 className="mt-4 text-base font-semibold text-zinc-950">
              All 9 Provinces Covered
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              1–2 business days to Gauteng, Western Cape, and KwaZulu-Natal metros (R 95); 2–4 business days to regional towns (R 135). Orders from R 1,500 ship free.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <Lock className="h-5 w-5 text-zinc-950" aria-hidden="true" />
            <h3 className="mt-4 text-base font-semibold text-zinc-950">
              Secure Online Payments Only
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Pay safely with 3D Secure Visa or Mastercard, South African Instant EFT, or SnapScan / Zapper QR. Cash on delivery is never accepted.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <ShieldCheck className="h-5 w-5 text-zinc-950" aria-hidden="true" />
            <h3 className="mt-4 text-base font-semibold text-zinc-950">
              12-Month Local Swap Warranty
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              All Mini Router UPS units, LiFePO4 power stations, and ICASA-approved tech carry a direct 12-month South African replacement warranty.
            </p>
          </div>
        </div>

        {/* Order Status Verification Utility */}
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <h3 className="text-lg font-semibold text-zinc-950">Verify an Existing Order</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Enter your D&amp;T Corp order number and checkout email address to check dispatch status and your VAT receipt.
              </p>
            </div>

            <form
              onSubmit={handleLookup}
              className="grid grid-cols-1 gap-3 sm:grid-cols-12 lg:col-span-7"
              noValidate
            >
              <div className="sm:col-span-4">
                <label htmlFor="lookup-order-number" className="sr-only">
                  Order number
                </label>
                <input
                  id="lookup-order-number"
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Order # (e.g. DT-SA-10401)"
                  className="min-h-[44px] w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-5">
                <label htmlFor="lookup-order-email" className="sr-only">
                  Checkout email address
                </label>
                <input
                  id="lookup-order-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Checkout email address"
                  autoComplete="email"
                  className="min-h-[44px] w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:bg-zinc-400 cursor-pointer"
                >
                  <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{loading ? 'Checking...' : 'Check Order'}</span>
                </button>
              </div>
            </form>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          {foundOrder && (
            <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
                <div>
                  <span className="font-mono font-semibold text-zinc-950">
                    {foundOrder.orderNumber}
                  </span>
                  <span className="mx-2 text-zinc-400" aria-hidden="true">
                    ·
                  </span>
                  <span className="font-medium text-emerald-800">{foundOrder.status}</span>
                </div>
                <span className="font-bold text-zinc-950 tabular-nums">
                  {formatZar(foundOrder.quote.totalCents)}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-zinc-600 sm:grid-cols-3">
                <div>
                  <span className="font-semibold text-zinc-900">Destination:</span>{' '}
                  {foundOrder.shippingAddress.suburbCity}, {foundOrder.shippingAddress.province}{' '}
                  {foundOrder.shippingAddress.postalCode}
                </div>
                <div>
                  <span className="font-semibold text-zinc-900">Payment:</span>{' '}
                  {foundOrder.paymentSummary.methodLabel}
                </div>
                <div>
                  <span className="font-semibold text-zinc-900">Estimated Courier:</span>{' '}
                  {foundOrder.quote.estimatedDeliveryWindow}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
