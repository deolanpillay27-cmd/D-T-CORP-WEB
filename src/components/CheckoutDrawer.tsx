import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Landmark,
  Lock,
  Minus,
  Plus,
  QrCode,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import {useEffect, useId, useMemo, useState, type FormEvent} from 'react';
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  SA_PROVINCES,
  computeAuthoritativeQuote,
  type CartItemInput,
  type CheckoutQuote,
  type PaymentMethod,
  type SouthAfricaProvince,
} from '../../shared/catalog.ts';
import {
  createClientPaymentToken,
  detectCardBrand,
  formatCardNumberDisplay,
  formatZar,
  isValidCardExpiry,
  passesLuhnCheck,
  sanitizeCardDigits,
} from '../lib/format.ts';

interface ConfirmedOrderReceipt {
  orderNumber: string;
  createdAt: string;
  status: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    streetAddress: string;
    suburbCity: string;
    province: SouthAfricaProvince;
    postalCode: string;
  };
  paymentSummary: {
    method: PaymentMethod;
    methodLabel: string;
    reference: string;
    threeDSecureVerified: boolean;
  };
  quote: CheckoutQuote;
}

interface CheckoutDrawerProps {
  isOpen: boolean;
  items: readonly CartItemInput[];
  onClose: () => void;
  onUpdateQuantity: (productId: string, variantId: string, quantity: number) => void;
  onRemoveItem: (productId: string, variantId: string) => void;
  onOrderConfirmed: () => void;
}

type DrawerStep = 'bag' | 'checkout' | 'receipt';

const SA_BANKS = ['FNB', 'Standard Bank', 'Absa', 'Nedbank', 'Capitec', 'Investec'] as const;

function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function CheckoutDrawer({
  isOpen,
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onOrderConfirmed,
}: CheckoutDrawerProps) {
  const titleId = useId();
  const [step, setStep] = useState<DrawerStep>('bag');
  const [province, setProvince] = useState<SouthAfricaProvince>('Gauteng');
  const [serverQuote, setServerQuote] = useState<CheckoutQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Customer & Shipping state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [suburbCity, setSuburbCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Online-only payment state (card fields stay strictly in component memory & are tokenized before transmit)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [eftBank, setEftBank] = useState<string>('FNB');
  const [qrWallet, setQrWallet] = useState<'SnapScan' | 'Zapper'>('SnapScan');

  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateIdempotencyKey());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ConfirmedOrderReceipt | null>(null);

  // Fallback local calculation while authoritative server quote resolves
  const previewQuote = useMemo(() => {
    const res = computeAuthoritativeQuote(items, province);
    return res.ok ? res.quote : null;
  }, [items, province]);

  const activeQuote = serverQuote ?? previewQuote;

  // Lock body scroll & close on Escape when open
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset step to bag if reopened after empty or completed
  useEffect(() => {
    if (isOpen && step === 'receipt' && !receipt) {
      setStep('bag');
    }
  }, [isOpen, step, receipt]);

  // Fetch authoritative server quote whenever items or province changes
  useEffect(() => {
    if (!isOpen || items.length === 0 || step === 'receipt') {
      setServerQuote(null);
      return;
    }

    let cancelled = false;
    setQuoteLoading(true);
    fetch('/api/checkout/quote', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({items, province}),
    })
      .then(async (res) => {
        const data = (await res.json()) as {quote?: CheckoutQuote; error?: string};
        if (!cancelled && res.ok && data.quote) {
          setServerQuote(data.quote);
        }
      })
      .catch(() => {
        // Keep previewQuote if transient network error occurs
      })
      .finally(() => {
        if (!cancelled) {
          setQuoteLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, items, province, step]);

  if (!isOpen) {
    return null;
  }

  const handleCheckoutSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (items.length === 0) {
      setFormError('Your shopping bag is empty.');
      return;
    }

    if (fullName.trim().length < 2) {
      setFormError('Please enter the recipient’s full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    if (!/^(?:\+27|0)[1-8]\d{8}$/.test(cleanPhone)) {
      setFormError('Please enter a valid South African phone number (e.g., 082 555 0142).');
      return;
    }
    if (streetAddress.trim().length < 5 || suburbCity.trim().length < 2) {
      setFormError('Please enter your complete street address and suburb or city.');
      return;
    }
    if (!/^\d{4}$/.test(postalCode.trim())) {
      setFormError('South African postal codes must be 4 digits.');
      return;
    }

    let paymentPayload: Record<string, unknown>;
    if (paymentMethod === 'card') {
      const digits = sanitizeCardDigits(cardNumber);
      if (cardholderName.trim().length < 2) {
        setFormError('Please enter the cardholder name.');
        return;
      }
      if (!passesLuhnCheck(digits)) {
        setFormError('Please enter a valid Visa or Mastercard number.');
        return;
      }
      if (!isValidCardExpiry(cardExpiry)) {
        setFormError('Please enter a valid future card expiry date (MM/YY).');
        return;
      }
      if (!/^\d{3,4}$/.test(cardCvc.trim())) {
        setFormError('Please enter a valid 3- or 4-digit CVC security code.');
        return;
      }
      const last4 = digits.slice(-4);
      const brand = detectCardBrand(digits);
      paymentPayload = {
        method: 'card',
        token: createClientPaymentToken(last4),
        last4,
        brand,
      };
    } else if (paymentMethod === 'instant_eft') {
      paymentPayload = {
        method: 'instant_eft',
        bank: eftBank,
      };
    } else {
      paymentPayload = {
        method: 'scan_to_pay',
        wallet: qrWallet,
      };
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/checkout/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          idempotencyKey,
          items,
          customer: {
            fullName: fullName.trim(),
            email: email.trim(),
            phone: cleanPhone,
          },
          shippingAddress: {
            streetAddress: streetAddress.trim(),
            suburbCity: suburbCity.trim(),
            province,
            postalCode: postalCode.trim(),
          },
          payment: paymentPayload,
        }),
      });

      const data = (await response.json()) as {order?: ConfirmedOrderReceipt; error?: string};
      if (!response.ok || !data.order) {
        setFormError(data.error ?? 'Unable to complete checkout. Please check your details.');
        return;
      }

      // Immediately purge sensitive card fields from client memory
      setCardNumber('');
      setCardExpiry('');
      setCardCvc('');
      setReceipt(data.order);
      setStep('receipt');
      setIdempotencyKey(generateIdempotencyKey());
      onOrderConfirmed();
    } catch {
      setFormError('Network error while confirming your order. Your card was not charged.');
    } finally {
      setSubmitting(false);
    }
  };

  const progressRatio = activeQuote
    ? Math.min(100, Math.round((activeQuote.subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100))
    : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex justify-end bg-zinc-950/60 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-xl">
        {/* Sticky Drawer Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setStep('bag');
                }}
                aria-label="Back to shopping bag"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            <div>
              <h2 id={titleId} className="font-display text-2xl font-extrabold tracking-tight text-zinc-950">
                {step === 'bag'
                  ? 'Your Shopping Bag'
                  : step === 'checkout'
                    ? 'Secure Online Checkout'
                    : 'Order Confirmed'}
              </h2>
              <p className="text-xs text-zinc-500">
                {step === 'checkout'
                  ? '256-bit TLS encrypted · Online payments only'
                  : step === 'receipt'
                    ? 'Official South African VAT Receipt'
                    : 'D&T Corp South Africa'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag and checkout drawer"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {step === 'bag' && (
            <>
              {!activeQuote || activeQuote.items.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center">
                  <p className="text-base font-semibold text-zinc-900">Your shopping bag is empty</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Add a Mini Router UPS, portable power station, or everyday tech essential to start checkout.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-5 inline-flex min-h-[44px] items-center rounded-lg bg-zinc-950 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Free Shipping Progress */}
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs font-medium text-zinc-800">
                      {activeQuote.freeShippingApplied
                        ? 'Your order qualifies for free nationwide South African courier delivery.'
                        : `Add ${formatZar(activeQuote.amountToFreeShippingCents)} more for free nationwide courier delivery.`}
                    </p>
                    <div
                      aria-hidden="true"
                      className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200"
                    >
                      <div
                        className="h-full bg-zinc-950 transition-all duration-200"
                        style={{width: `${progressRatio}%`}}
                      />
                    </div>
                  </div>

                  {/* Line Items */}
                  <ul className="divide-y divide-zinc-200 border-y border-zinc-200">
                    {activeQuote.items.map((line) => (
                      <li key={`${line.productId}-${line.variantId}`} className="flex gap-4 py-4">
                        <img
                          src={line.image}
                          alt={line.name}
                          width={96}
                          height={72}
                          referrerPolicy="no-referrer"
                          className="h-20 w-24 shrink-0 rounded-lg border border-zinc-200 bg-zinc-100 object-cover"
                        />
                        <div className="flex flex-1 flex-col justify-between">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-zinc-950">{line.name}</p>
                              <p className="mt-0.5 text-xs text-zinc-500">
                                {line.variantLabel} · <span className="font-mono">{line.sku}</span>
                              </p>
                            </div>
                            <p className="text-sm font-bold text-zinc-950 tabular-nums">
                              {formatZar(line.lineTotalCents)}
                            </p>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center rounded-lg border border-zinc-300">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateQuantity(line.productId, line.variantId, line.quantity - 1)
                                }
                                aria-label={`Decrease quantity of ${line.name}`}
                                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                              >
                                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                              <span className="min-w-[2rem] text-center font-mono text-xs font-semibold tabular-nums">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateQuantity(line.productId, line.variantId, line.quantity + 1)
                                }
                                aria-label={`Increase quantity of ${line.name}`}
                                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => onRemoveItem(line.productId, line.variantId)}
                              aria-label={`Remove ${line.name} from bag`}
                              className="inline-flex min-h-[40px] items-center gap-1 rounded-md px-2 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-red-700 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Province Shipping Estimate Selector */}
                  <div>
                    <label htmlFor="bag-province" className="block text-xs font-semibold text-zinc-900">
                      Delivery Province (South Africa)
                    </label>
                    <select
                      id="bag-province"
                      value={province}
                      onChange={(e) => setProvince(e.target.value as SouthAfricaProvince)}
                      className="mt-1.5 min-h-[44px] w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                    >
                      {SA_PROVINCES.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'checkout' && activeQuote && (
            <form id="secure-checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-6" noValidate>
              {formError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800"
                >
                  {formError}
                </div>
              )}

              {/* Step 1: Recipient Contact */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-zinc-950">1. Contact &amp; Tax Invoice Details</legend>
                <div>
                  <label htmlFor="chk-name" className="block text-xs font-medium text-zinc-700">
                    Full Name
                  </label>
                  <input
                    id="chk-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Thabo Mokoena"
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="chk-email" className="block text-xs font-medium text-zinc-700">
                      Email Address
                    </label>
                    <input
                      id="chk-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.co.za"
                      className="mt-1 min-h-[44px] w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="chk-phone" className="block text-xs font-medium text-zinc-700">
                      SA Mobile Number
                    </label>
                    <input
                      id="chk-phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="082 555 0142"
                      className="mt-1 min-h-[44px] w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                    />
                  </div>
                </div>
              </fieldset>

              {/* Step 2: South African Delivery Address */}
              <fieldset className="space-y-3 border-t border-zinc-200 pt-5">
                <legend className="text-sm font-semibold text-zinc-950">2. South African Courier Address</legend>
                <div>
                  <label htmlFor="chk-street" className="block text-xs font-medium text-zinc-700">
                    Street Address / Estate / Unit
                  </label>
                  <input
                    id="chk-street"
                    type="text"
                    required
                    autoComplete="street-address"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="14 Rivonia Road, Sandhurst"
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <label htmlFor="chk-suburb" className="block text-xs font-medium text-zinc-700">
                      Suburb / City
                    </label>
                    <input
                      id="chk-suburb"
                      type="text"
                      required
                      autoComplete="address-level2"
                      value={suburbCity}
                      onChange={(e) => setSuburbCity(e.target.value)}
                      placeholder="Sandton"
                      className="mt-1 min-h-[44px] w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label htmlFor="chk-province" className="block text-xs font-medium text-zinc-700">
                      Province
                    </label>
                    <select
                      id="chk-province"
                      value={province}
                      onChange={(e) => setProvince(e.target.value as SouthAfricaProvince)}
                      className="mt-1 min-h-[44px] w-full rounded-lg border border-zinc-300 bg-white px-2.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                    >
                      {SA_PROVINCES.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <label htmlFor="chk-postal" className="block text-xs font-medium text-zinc-700">
                      Postal Code
                    </label>
                    <input
                      id="chk-postal"
                      type="text"
                      required
                      autoComplete="postal-code"
                      inputMode="numeric"
                      maxLength={4}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="2196"
                      className="mt-1 min-h-[44px] w-full rounded-lg border border-zinc-300 px-3 font-mono text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                    />
                  </div>
                </div>
              </fieldset>

              {/* Step 3: Online Payment Only */}
              <fieldset className="space-y-3 border-t border-zinc-200 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <legend className="text-sm font-semibold text-zinc-950">3. Online Payment Method</legend>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>No Cash on Delivery</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    aria-pressed={paymentMethod === 'card'}
                    className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>3D Secure Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('instant_eft')}
                    aria-pressed={paymentMethod === 'instant_eft'}
                    className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      paymentMethod === 'instant_eft'
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50'
                    }`}
                  >
                    <Landmark className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Instant EFT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('scan_to_pay')}
                    aria-pressed={paymentMethod === 'scan_to_pay'}
                    className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      paymentMethod === 'scan_to_pay'
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50'
                    }`}
                  >
                    <QrCode className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Scan to Pay</span>
                  </button>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <div>
                      <label htmlFor="chk-card-name" className="block text-xs font-medium text-zinc-700">
                        Name on Card
                      </label>
                      <input
                        id="chk-card-name"
                        type="text"
                        autoComplete="cc-name"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        placeholder="Thabo Mokoena"
                        className="mt-1 min-h-[44px] w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="chk-card-num" className="block text-xs font-medium text-zinc-700">
                        Card Number (Tokenized in Browser)
                      </label>
                      <input
                        id="chk-card-num"
                        type="text"
                        autoComplete="cc-number"
                        inputMode="numeric"
                        value={formatCardNumberDisplay(cardNumber)}
                        onChange={(e) => setCardNumber(sanitizeCardDigits(e.target.value))}
                        placeholder="4532 •••• •••• 0366"
                        className="mt-1 min-h-[44px] w-full rounded-lg border border-zinc-300 bg-white px-3 font-mono text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="chk-card-exp" className="block text-xs font-medium text-zinc-700">
                          Expiry (MM/YY)
                        </label>
                        <input
                          id="chk-card-exp"
                          type="text"
                          autoComplete="cc-exp"
                          inputMode="numeric"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setCardExpiry(
                              digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits,
                            );
                          }}
                          placeholder="08/29"
                          className="mt-1 min-h-[44px] w-full rounded-lg border border-zinc-300 bg-white px-3 font-mono text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="chk-card-cvc" className="block text-xs font-medium text-zinc-700">
                          CVC
                        </label>
                        <input
                          id="chk-card-cvc"
                          type="password"
                          autoComplete="cc-csc"
                          inputMode="numeric"
                          maxLength={4}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="•••"
                          className="mt-1 min-h-[44px] w-full rounded-lg border border-zinc-300 bg-white px-3 font-mono text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                        />
                      </div>
                    </div>
                    <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-zinc-700" aria-hidden="true" />
                      <span>
                        Card numbers are validated and tokenized locally; raw card details are never transmitted or stored.
                      </span>
                    </p>
                  </div>
                )}

                {paymentMethod === 'instant_eft' && (
                  <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <label htmlFor="chk-eft-bank" className="block text-xs font-medium text-zinc-700">
                      Select South African Bank
                    </label>
                    <select
                      id="chk-eft-bank"
                      value={eftBank}
                      onChange={(e) => setEftBank(e.target.value)}
                      className="min-h-[44px] w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                    >
                      {SA_BANKS.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-zinc-600">
                      Instant EFT clears immediately with zero proof-of-payment email delays.
                    </p>
                  </div>
                )}

                {paymentMethod === 'scan_to_pay' && (
                  <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs font-medium text-zinc-700">Select Mobile QR Wallet</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['SnapScan', 'Zapper'] as const).map((wallet) => (
                        <button
                          key={wallet}
                          type="button"
                          onClick={() => setQrWallet(wallet)}
                          className={`min-h-[44px] rounded-lg border px-3 text-xs font-semibold cursor-pointer ${
                            qrWallet === wallet
                              ? 'border-zinc-950 bg-zinc-950 text-white'
                              : 'border-zinc-300 bg-white text-zinc-800'
                          }`}
                        >
                          {wallet}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </fieldset>
            </form>
          )}

          {step === 'receipt' && receipt && (
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">{receipt.status}</p>
                    <p className="mt-1 text-xs text-emerald-800">
                      Order <span className="font-mono font-bold">{receipt.orderNumber}</span> confirmed. Save your order number to check courier progress at any time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-4 text-xs">
                <p className="font-semibold text-zinc-950">Delivery &amp; Payment Verification</p>
                <dl className="mt-3 space-y-2 text-zinc-600">
                  <div className="flex justify-between gap-4">
                    <dt>Recipient</dt>
                    <dd className="text-right font-medium text-zinc-950">{receipt.customer.fullName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Address</dt>
                    <dd className="text-right font-medium text-zinc-950">
                      {receipt.shippingAddress.streetAddress}, {receipt.shippingAddress.suburbCity},{' '}
                      {receipt.shippingAddress.province} {receipt.shippingAddress.postalCode}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Payment Method</dt>
                    <dd className="text-right font-medium text-zinc-950">
                      {receipt.paymentSummary.methodLabel}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Verification Ref</dt>
                    <dd className="font-mono font-medium text-zinc-950">
                      {receipt.paymentSummary.reference}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Courier Window</dt>
                    <dd className="text-right font-medium text-zinc-950">
                      {receipt.quote.estimatedDeliveryWindow}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs">
                <p className="font-semibold text-zinc-950">Tax Invoice Summary (ZAR)</p>
                <ul className="mt-3 divide-y divide-zinc-200">
                  {receipt.quote.items.map((line) => (
                    <li key={`${line.productId}-${line.variantId}`} className="flex justify-between py-2">
                      <span className="text-zinc-700">
                        {line.quantity}x {line.name} ({line.variantLabel})
                      </span>
                      <span className="font-semibold text-zinc-950 tabular-nums">
                        {formatZar(line.lineTotalCents)}
                      </span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 space-y-1.5 border-t border-zinc-200 pt-3 text-zinc-600">
                  <div className="flex justify-between">
                    <dt>Courier Delivery</dt>
                    <dd className="font-medium text-zinc-950 tabular-nums">
                      {receipt.quote.shippingCents === 0
                        ? 'Free'
                        : formatZar(receipt.quote.shippingCents)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Included 15% VAT</dt>
                    <dd className="tabular-nums">{formatZar(receipt.quote.vatIncludedCents)}</dd>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-zinc-950">
                    <dt>Total Paid</dt>
                    <dd className="tabular-nums">{formatZar(receipt.quote.totalCents)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer Summary & Primary Action */}
        <div className="border-t border-zinc-200 bg-white px-4 py-4 sm:px-6">
          {step === 'bag' && activeQuote && activeQuote.items.length > 0 && (
            <div className="space-y-3">
              <dl className="space-y-1 text-xs text-zinc-600">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="font-medium text-zinc-950 tabular-nums">
                    {formatZar(activeQuote.subtotalCents)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Courier ({province})</dt>
                  <dd className="font-medium text-zinc-950 tabular-nums">
                    {quoteLoading
                      ? 'Calculating...'
                      : activeQuote.shippingCents === 0
                        ? 'Free'
                        : formatZar(activeQuote.shippingCents)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-2 text-sm font-bold text-zinc-950">
                  <dt>Total (Incl. 15% VAT)</dt>
                  <dd className="tabular-nums">{formatZar(activeQuote.totalCents)}</dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setStep('checkout');
                }}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 cursor-pointer"
              >
                <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Proceed to Secure Checkout</span>
              </button>
            </div>
          )}

          {step === 'checkout' && activeQuote && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span>
                  Authoritative Server Total ({activeQuote.estimatedDeliveryWindow})
                </span>
                <span className="text-base font-bold text-zinc-950 tabular-nums">
                  {formatZar(activeQuote.totalCents)}
                </span>
              </div>
              <button
                type="submit"
                form="secure-checkout-form"
                disabled={submitting}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:bg-zinc-400 cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {submitting
                    ? 'Verifying & Confirming Order...'
                    : `Pay ${formatZar(activeQuote.totalCents)} Securely`}
                </span>
              </button>
            </div>
          )}

          {step === 'receipt' && (
            <button
              type="button"
              onClick={() => {
                setReceipt(null);
                setStep('bag');
                onClose();
              }}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 cursor-pointer"
            >
              Return to Storefront
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
