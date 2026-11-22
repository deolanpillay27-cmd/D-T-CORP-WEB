import {Check, Minus, Package, Plus, ShieldCheck, Truck, X} from 'lucide-react';
import {useEffect, useState} from 'react';
import type {Product} from '../../shared/catalog.ts';
import {formatZar} from '../lib/format.ts';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToBag: (productId: string, variantId: string, quantity: number) => void;
}

export function ProductDetailModal({product, onClose, onAddToBag}: ProductDetailModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (!product) {
      return;
    }
    setSelectedVariantId(product.variants[0]?.id ?? '');
    setQuantity(1);
    setImgFailed(false);

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
  }, [product, onClose]);

  if (!product) {
    return null;
  }

  const activeVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0];
  const unitPriceCents = product.priceCents + (activeVariant?.priceDeltaCents ?? 0);
  const maxQty = Math.min(20, Math.max(1, product.stock));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-5 py-3.5 backdrop-blur-sm sm:px-6">
          <span className="text-xs font-medium text-zinc-500">
            {product.categoryLabel} · <span className="font-mono">{activeVariant?.sku ?? product.sku}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product specifications"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-6">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
              {!imgFailed ? (
                <img
                  src={product.image}
                  alt={product.imageAlt}
                  width={800}
                  height={600}
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                  <Package className="h-10 w-10 text-zinc-400" aria-hidden="true" />
                  <p className="mt-2 text-sm font-medium text-zinc-700">{product.name}</p>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600">
              <div className="flex items-center gap-2 font-medium text-zinc-900">
                <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Free tracked SA courier delivery on orders over R 1,500</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-zinc-700" aria-hidden="true" />
                <span>{product.warranty}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between md:col-span-6">
            <div>
              <h2
                id="pdp-modal-title"
                className="font-display text-3xl font-extrabold tracking-tight text-zinc-950"
              >
                {product.name}
              </h2>
              <p className="mt-2 text-2xl font-bold text-zinc-950 tabular-nums">
                {formatZar(unitPriceCents)}{' '}
                <span className="text-xs font-normal text-zinc-500">Incl. 15% VAT</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">{product.description}</p>

              {/* Variant Selector */}
              <div className="mt-5">
                <p className="text-xs font-semibold text-zinc-900">Select Configuration</p>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {product.variants.map((variant) => {
                    const selected = variant.id === activeVariant?.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={`flex min-h-[44px] items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                          selected
                            ? 'border-zinc-950 bg-zinc-950 text-white'
                            : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                          <span>{variant.label}</span>
                        </span>
                        <span className="font-mono tabular-nums">
                          {formatZar(product.priceCents + variant.priceDeltaCents)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="mt-6">
                <p className="text-xs font-semibold text-zinc-900">Technical Specifications</p>
                <dl className="mt-2 divide-y divide-zinc-200 border-y border-zinc-200 text-xs">
                  {product.specs.map((spec) => (
                    <div key={spec.label} className="grid grid-cols-5 gap-2 py-2.5">
                      <dt className="col-span-2 font-medium text-zinc-500">{spec.label}</dt>
                      <dd className="col-span-3 font-medium text-zinc-900">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Contiguous Purchase Module */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-5">
              <div className="flex items-center rounded-lg border border-zinc-300">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="min-w-[2.5rem] text-center font-mono text-sm font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  aria-label="Increase quantity"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                disabled={product.stock <= 0 || !activeVariant}
                onClick={() => {
                  if (activeVariant) {
                    onAddToBag(product.id, activeVariant.id, quantity);
                    onClose();
                  }
                }}
                className="flex-1 min-h-[44px] rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 cursor-pointer"
              >
                {product.stock <= 0
                  ? 'Out of Stock'
                  : `Add to Bag — ${formatZar(unitPriceCents * quantity)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
