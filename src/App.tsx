import {Suspense, lazy, useCallback, useEffect, useMemo, useState} from 'react';
import {
  CATALOG,
  type CartItemInput,
  type Product,
  type ProductCategory,
} from '../shared/catalog.ts';
import {DeliveryAndSupport} from './components/DeliveryAndSupport.tsx';
import {Footer} from './components/Footer.tsx';
import {Header} from './components/Header.tsx';
import {HeroSection} from './components/HeroSection.tsx';
import {ProductCatalog} from './components/ProductCatalog.tsx';
import {loadSavedBag, saveBagToStorage} from './lib/format.ts';

const ProductDetailModal = lazy(() =>
  import('./components/ProductDetailModal.tsx').then((m) => ({default: m.ProductDetailModal})),
);
const CheckoutDrawer = lazy(() =>
  import('./components/CheckoutDrawer.tsx').then((m) => ({default: m.CheckoutDrawer})),
);

export default function App() {
  const [products, setProducts] = useState<readonly Product[]>(CATALOG);
  const [activeCategory, setActiveCategory] = useState<'all' | ProductCategory>('all');
  const [bagItems, setBagItems] = useState<CartItemInput[]>(() => loadSavedBag());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [justAddedProductId, setJustAddedProductId] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const refreshProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as {products?: Product[]};
      if (Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products);
      }
    } catch {
      // Keep bundled catalog during offline/initial paint
    }
  }, []);

  useEffect(() => {
    void refreshProducts();
  }, [refreshProducts]);

  useEffect(() => {
    saveBagToStorage(bagItems);
  }, [bagItems]);

  const bagCount = useMemo(
    () => bagItems.reduce((total, item) => total + item.quantity, 0),
    [bagItems],
  );

  const handleAddToBag = useCallback(
    (productId: string, variantId: string, quantity: number) => {
      const product = products.find((p) => p.id === productId);
      if (!product || product.stock <= 0) {
        return;
      }

      setBagItems((prev) => {
        const existingIndex = prev.findIndex(
          (entry) => entry.productId === productId && entry.variantId === variantId,
        );
        if (existingIndex === -1) {
          return [...prev, {productId, variantId, quantity: Math.min(20, quantity)}];
        }
        return prev.map((entry, idx) =>
          idx === existingIndex
            ? {...entry, quantity: Math.min(20, entry.quantity + quantity)}
            : entry,
        );
      });

      setJustAddedProductId(productId);
      setLiveAnnouncement(`Added ${quantity} ${product.name} to your shopping bag.`);
      window.setTimeout(() => {
        setJustAddedProductId((current) => (current === productId ? null : current));
      }, 1400);
    },
    [products],
  );

  const handleQuickAdd = useCallback(
    (product: Product) => {
      const defaultVariant = product.variants[0];
      if (defaultVariant) {
        handleAddToBag(product.id, defaultVariant.id, 1);
      }
    },
    [handleAddToBag],
  );

  const handleUpdateQuantity = useCallback(
    (productId: string, variantId: string, nextQuantity: number) => {
      if (nextQuantity <= 0) {
        setBagItems((prev) =>
          prev.filter(
            (entry) => !(entry.productId === productId && entry.variantId === variantId),
          ),
        );
        return;
      }
      const clamped = Math.min(20, nextQuantity);
      setBagItems((prev) =>
        prev.map((entry) =>
          entry.productId === productId && entry.variantId === variantId
            ? {...entry, quantity: clamped}
            : entry,
        ),
      );
    },
    [],
  );

  const handleRemoveItem = useCallback((productId: string, variantId: string) => {
    setBagItems((prev) =>
      prev.filter((entry) => !(entry.productId === productId && entry.variantId === variantId)),
    );
    setLiveAnnouncement('Removed item from your shopping bag.');
  }, []);

  const handleOrderConfirmed = useCallback(() => {
    setBagItems([]);
    setLiveAnnouncement('Order confirmed. Your South African tax receipt is ready.');
    void refreshProducts();
  }, [refreshProducts]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-zinc-950 focus:px-4 focus:py-2.5 focus:text-xs focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      <div aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      <Header
        bagCount={bagCount}
        onOpenBag={() => setBagOpen(true)}
        onSelectCategoryAnchor={setActiveCategory}
      />

      <main id="main-content" className="flex-1">
        <HeroSection onShopBackupPower={() => setActiveCategory('backup-power')} />

        <ProductCatalog
          products={products}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onSelectProduct={setSelectedProduct}
          onQuickAdd={handleQuickAdd}
          justAddedProductId={justAddedProductId}
        />

        <DeliveryAndSupport />
      </main>

      <Footer onSelectCategoryAnchor={setActiveCategory} />

      <Suspense fallback={null}>
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToBag={handleAddToBag}
          />
        )}

        {bagOpen && (
          <CheckoutDrawer
            isOpen={bagOpen}
            items={bagItems}
            onClose={() => setBagOpen(false)}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onOrderConfirmed={handleOrderConfirmed}
          />
        )}
      </Suspense>
    </div>
  );
}
