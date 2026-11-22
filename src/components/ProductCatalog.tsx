import {Check, Package, Plus, Search, X} from 'lucide-react';
import {useMemo, useState} from 'react';
import type {Product, ProductCategory} from '../../shared/catalog.ts';
import {formatZar} from '../lib/format.ts';

interface ProductCatalogProps {
  products: readonly Product[];
  activeCategory: 'all' | ProductCategory;
  onCategoryChange: (category: 'all' | ProductCategory) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  justAddedProductId: string | null;
}

const CATEGORY_TABS: readonly {id: 'all' | ProductCategory; label: string}[] = [
  {id: 'all', label: 'All Essentials'},
  {id: 'backup-power', label: 'Backup Power'},
  {id: 'audio-wearables', label: 'Audio & Wearables'},
  {id: 'home-streaming', label: 'Home Streaming'},
];

export function ProductCatalog({
  products,
  activeCategory,
  onCategoryChange,
  onSelectProduct,
  onQuickAdd,
  justAddedProductId,
}: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
      if (!matchesCategory) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        product.name.toLowerCase().includes(q) ||
        product.shortSpec.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q)
      );
    });
  }, [products, activeCategory, searchQuery]);

  return (
    <section id="catalog" aria-labelledby="catalog-heading" className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 border-b border-zinc-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-zinc-500">South African Storefront</p>
            <h2
              id="catalog-heading"
              className="mt-1 font-display text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl"
            >
              Everyday Tech &amp; Backup Power
            </h2>
          </div>

          <div className="w-full md:w-72">
            <label htmlFor="catalog-search" className="sr-only">
              Search products by name, wattage, or SKU
            </label>
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-zinc-400" aria-hidden="true" />
              <input
                id="catalog-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search UPS, 600W, ANC, 4K..."
                className="min-h-[44px] w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-9 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear product search"
                  className="absolute right-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="Product categories"
          className="mt-6 flex flex-wrap items-center gap-2"
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onCategoryChange(tab.id)}
                className={`min-h-[44px] rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-zinc-950 text-white'
                    : 'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50 p-10 text-center">
            <p className="text-base font-semibold text-zinc-900">No matching products found</p>
            <p className="mt-1 text-sm text-zinc-600">
              Clear your search filter or switch to All Essentials to view the complete catalogue.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                onCategoryChange('all');
              }}
              className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-zinc-950 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {filteredProducts.map((product) => {
              const isAdded = justAddedProductId === product.id;
              const isOutOfStock = product.stock <= 0;
              const imgHasFailed = Boolean(failedImages[product.id]);

              return (
                <article
                  key={product.id}
                  className="group flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 transition-transform duration-150 hover:-translate-y-0.5 hover:border-zinc-300"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      aria-label={`View details for ${product.name}`}
                      className="block w-full overflow-hidden rounded-lg bg-zinc-100 text-left cursor-pointer"
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden">
                        {!imgHasFailed ? (
                          <img
                            src={product.image}
                            alt={product.imageAlt}
                            width={800}
                            height={600}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedImages((prev) => ({...prev, [product.id]: true}))
                            }
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-100 p-4 text-center">
                            <Package className="h-8 w-8 text-zinc-400" aria-hidden="true" />
                            <span className="mt-2 text-xs font-medium text-zinc-600">
                              {product.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>

                    <div className="mt-4 flex items-center justify-between gap-2 text-xs text-zinc-500">
                      <span>
                        {product.categoryLabel} · <span className="font-mono">{product.sku}</span>
                      </span>
                      <span
                        className={`font-medium tabular-nums ${
                          isOutOfStock
                            ? 'text-red-700'
                            : product.stock <= 8
                              ? 'text-amber-700'
                              : 'text-zinc-600'
                        }`}
                      >
                        {isOutOfStock
                          ? 'Out of stock'
                          : product.stock <= 8
                            ? `Only ${product.stock} left`
                            : 'In stock'}
                      </span>
                    </div>

                    <h3 className="mt-1.5 text-base font-semibold leading-snug text-zinc-950">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product)}
                        className="text-left hover:underline underline-offset-4 cursor-pointer"
                      >
                        {product.name}
                      </button>
                    </h3>

                    <p className="mt-1 text-xs font-medium text-zinc-500">{product.shortSpec}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-zinc-100 pt-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-lg font-bold tracking-tight text-zinc-950 tabular-nums">
                        {formatZar(product.priceCents)}
                      </span>
                      <span className="text-xs text-zinc-500">Incl. VAT</span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product)}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 whitespace-nowrap cursor-pointer"
                      >
                        Specs &amp; Options
                      </button>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => onQuickAdd(product)}
                        className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 ${
                          isAdded
                            ? 'bg-emerald-700 text-white'
                            : 'bg-zinc-950 text-white hover:bg-zinc-800'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>Add to Bag</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
