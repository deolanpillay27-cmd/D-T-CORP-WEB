export type ProductCategory = 'backup-power' | 'audio-wearables' | 'home-streaming';

export type PaymentMethod = 'card' | 'instant_eft' | 'scan_to_pay';

export type SouthAfricaProvince =
  | 'Gauteng'
  | 'Western Cape'
  | 'KwaZulu-Natal'
  | 'Eastern Cape'
  | 'Free State'
  | 'Limpopo'
  | 'Mpumalanga'
  | 'North West'
  | 'Northern Cape';

export const SA_PROVINCES: readonly SouthAfricaProvince[] = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
] as const;

export const FREE_SHIPPING_THRESHOLD_CENTS = 150_000; // R 1,500.00
export const VAT_RATE = 0.15; // 15% South African VAT included in retail prices

export const HERO_IMAGE_PATH = '/src/assets/images/hero_power_backup_1795352770602.jpg';

export interface ProductVariant {
  id: string;
  label: string;
  sku: string;
  priceDeltaCents: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  categoryLabel: string;
  shortSpec: string;
  description: string;
  priceCents: number;
  stock: number;
  image: string;
  imageAlt: string;
  warranty: string;
  badge?: string;
  variants: ProductVariant[];
  specs: ProductSpec[];
}

export const CATALOG: readonly Product[] = [
  {
    id: 'mini-router-ups',
    sku: 'DT-UPS-104',
    name: 'Mini Router UPS 10400mAh',
    category: 'backup-power',
    categoryLabel: 'Backup Power',
    shortSpec: 'DC 5V / 9V / 12V · Up to 8h runtime',
    description:
      'Zero-switchover DC battery backup engineered for South African fibre ONTs and dual-band Wi-Fi routers through Stage 6 load-shedding.',
    priceCents: 79_900,
    stock: 34,
    image: '/src/assets/images/product_mini_ups_1795352769103.jpg',
    imageAlt: 'Matte-black Mini Router DC UPS 10400mAh with braided DC output cable and LED battery indicators',
    warranty: '12-month D&T Corp SA local swap warranty',
    badge: 'Best Seller',
    variants: [
      {id: 'ups-10400', label: '10400mAh Standard', sku: 'DT-UPS-104', priceDeltaCents: 0},
      {id: 'ups-18000', label: '18000mAh Extended (Dual Router)', sku: 'DT-UPS-180', priceDeltaCents: 35_000},
    ],
    specs: [
      {label: 'Battery Capacity', value: '10,400mAh Li-Ion (38.5Wh)'},
      {label: 'DC Outputs', value: '5V USB + 9V / 12V selectable DC barrel'},
      {label: 'Switchover Time', value: '0ms uninterrupted online pass-through'},
      {label: 'Protection', value: 'Surge, over-charge, short-circuit & thermal'},
    ],
  },
  {
    id: 'power-station-300',
    sku: 'DT-PWR-300',
    name: '300W Portable Power Station',
    category: 'backup-power',
    categoryLabel: 'Backup Power',
    shortSpec: '288Wh LiFePO4 · SA 3-Pin AC + 65W USB-C',
    description:
      'Compact pure sine wave power station with South African 230V AC outlet and fast USB-C PD to run laptops, monitors, and home office fibre.',
    priceCents: 449_900,
    stock: 14,
    image: '/src/assets/images/product_power_station_1795352770042.jpg',
    imageAlt: 'Matte charcoal and brushed aluminium 300W Portable Power Station with digital wattage readout',
    warranty: '12-month D&T Corp SA warranty (3,000+ LiFePO4 cycles)',
    variants: [
      {id: 'ps300-unit', label: '300W Unit Only', sku: 'DT-PWR-300', priceDeltaCents: 0},
      {id: 'ps300-solar', label: '300W + 60W Folding Solar Panel', sku: 'DT-PWR-300S', priceDeltaCents: 120_000},
    ],
    specs: [
      {label: 'Cell Chemistry', value: 'LiFePO4 (3,000+ charge cycles)'},
      {label: 'AC Output', value: '300W continuous (600W surge), 230V 50Hz pure sine'},
      {label: 'Fast Charging', value: 'USB-C PD 65W bi-directional + 18V DC solar input'},
      {label: 'Weight', value: '3.6 kg with anodised carry handle'},
    ],
  },
  {
    id: 'power-station-600',
    sku: 'DT-PWR-600',
    name: '600W Pro Backup Power Station',
    category: 'backup-power',
    categoryLabel: 'Backup Power',
    shortSpec: '528Wh LiFePO4 · 1h Fast AC Recharge',
    description:
      'High-output backup power for multi-screen workstations, TVs, and CPAP devices with 1-hour rapid grid top-up between load-shedding blocks.',
    priceCents: 789_900,
    stock: 6,
    image: '/src/assets/images/product_power_station_pro_1795352769247.jpg',
    imageAlt: 'Heavy-duty 600W Pro Backup Power Station with dual AC outlets and solar input port',
    warranty: '12-month D&T Corp SA priority courier swap warranty',
    badge: 'Low Stock',
    variants: [
      {id: 'ps600-unit', label: '600W / 528Wh Standard', sku: 'DT-PWR-600', priceDeltaCents: 0},
      {id: 'ps600-solar', label: '600W + 100W Solar Kit', sku: 'DT-PWR-600S', priceDeltaCents: 185_000},
    ],
    specs: [
      {label: 'Cell Chemistry', value: '528Wh Automotive-grade LiFePO4'},
      {label: 'AC Output', value: '600W continuous (1,200W peak) pure sine wave'},
      {label: 'Grid Recharge', value: '0% to 80% in 55 minutes via direct AC'},
      {label: 'Solar Input', value: 'MPPT 12–30V up to 200W'},
    ],
  },
  {
    id: 'studio-anc-earbuds',
    sku: 'DT-AUD-380',
    name: 'Studio ANC Wireless Earbuds',
    category: 'audio-wearables',
    categoryLabel: 'Audio & Wearables',
    shortSpec: '38dB Active Noise Cancellation · 32h Case',
    description:
      'Hybrid noise-cancelling true wireless earbuds with quad-mic call clarity for remote meetings, commutes, and focus blocks.',
    priceCents: 119_900,
    stock: 28,
    image: '/src/assets/images/product_anc_earbuds_1795352770208.jpg',
    imageAlt: 'Matte graphite Studio ANC Wireless Earbuds beside an open black USB-C charging case',
    warranty: '12-month D&T Corp SA warranty · ICASA approved',
    variants: [
      {id: 'anc-graphite', label: 'Matte Graphite', sku: 'DT-AUD-380G', priceDeltaCents: 0},
      {id: 'anc-sand', label: 'Warm Stone', sku: 'DT-AUD-380S', priceDeltaCents: 0},
    ],
    specs: [
      {label: 'Noise Control', value: '38dB Hybrid ANC + Transparency Mode'},
      {label: 'Battery Life', value: '8h buds + 24h USB-C case (32h total)'},
      {label: 'Connectivity', value: 'Bluetooth 5.3 multipoint pairing'},
      {label: 'Weather Rating', value: 'IPX5 sweat and rain resistant'},
    ],
  },
  {
    id: 'amoled-rugged-watch',
    sku: 'DT-WRB-510',
    name: 'AMOLED Rugged Smartwatch',
    category: 'audio-wearables',
    categoryLabel: 'Audio & Wearables',
    shortSpec: '1.43" AMOLED · 14-Day Battery · 5ATM',
    description:
      'Titanium-bezel fitness and notification watch built for outdoor durability with two-week battery endurance and crisp sunlight readability.',
    priceCents: 169_900,
    stock: 19,
    image: '/src/assets/images/product_smartwatch_1795352769839.jpg',
    imageAlt: 'Rugged AMOLED Smartwatch with brushed titanium bezel and charcoal strap',
    warranty: '12-month D&T Corp SA warranty · ICASA approved',
    variants: [
      {id: 'watch-charcoal', label: 'Titanium / Charcoal Strap', sku: 'DT-WRB-510C', priceDeltaCents: 0},
      {id: 'watch-olive', label: 'Titanium / Trail Olive Strap', sku: 'DT-WRB-510O', priceDeltaCents: 0},
    ],
    specs: [
      {label: 'Display', value: '1.43" 466x466 AMOLED Always-On (1,000 nits)'},
      {label: 'Battery Endurance', value: 'Up to 14 days typical use'},
      {label: 'Sensors', value: 'Optical HR, SpO2, GPS/GLONASS, barometric altimeter'},
      {label: 'Water Resistance', value: '5ATM (50m swim-ready)'},
    ],
  },
  {
    id: 'uhd-tv-stick-4k',
    sku: 'DT-STR-400',
    name: '4K UHD Android TV Streaming Stick',
    category: 'home-streaming',
    categoryLabel: 'Home Streaming',
    shortSpec: '4K HDR10+ · Dual-Band Wi-Fi · Voice Remote',
    description:
      'Plug-and-play HDMI streaming stick certified for 4K playback on Showmax, Netflix, YouTube, and DStv Stream with low-power USB operation.',
    priceCents: 94_900,
    stock: 41,
    image: '/src/assets/images/product_tv_stick_1795352769902.jpg',
    imageAlt: 'Slim 4K UHD HDMI streaming stick next to matte charcoal Bluetooth voice remote',
    warranty: '12-month D&T Corp SA warranty · ICASA approved',
    variants: [
      {id: 'tv-16gb', label: '16GB Storage (Standard)', sku: 'DT-STR-400', priceDeltaCents: 0},
      {id: 'tv-ethernet', label: '16GB + USB Ethernet Adapter', sku: 'DT-STR-400E', priceDeltaCents: 18_000},
    ],
    specs: [
      {label: 'Video Output', value: '4K 60fps UHD, HDR10+, AV1 hardware decode'},
      {label: 'Wireless', value: 'Wi-Fi 5 dual-band (2.4GHz / 5GHz) + Bluetooth 5.0'},
      {label: 'Audio', value: 'Dolby Audio & DTS passthrough'},
      {label: 'Power Draw', value: '5V / 1A USB-powered (runs off Mini UPS or TV USB)'},
    ],
  },
] as const;

export interface CartItemInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface QuoteLineItem {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  variantLabel: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  image: string;
}

export interface CheckoutQuote {
  items: QuoteLineItem[];
  subtotalCents: number;
  shippingCents: number;
  vatIncludedCents: number;
  totalCents: number;
  freeShippingApplied: boolean;
  amountToFreeShippingCents: number;
  estimatedDeliveryWindow: string;
}

const MAJOR_METRO_PROVINCES = new Set<SouthAfricaProvince>([
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
]);

export function calculateShippingCents(subtotalCents: number, province: SouthAfricaProvince): number {
  if (subtotalCents <= 0 || subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) {
    return 0;
  }
  return MAJOR_METRO_PROVINCES.has(province) ? 9_500 : 13_500;
}

export function getEstimatedDeliveryWindow(province: SouthAfricaProvince): string {
  if (MAJOR_METRO_PROVINCES.has(province)) {
    return '1–2 business days via tracked courier';
  }
  return '2–4 business days via regional SA courier';
}

export function computeAuthoritativeQuote(
  rawItems: readonly CartItemInput[],
  province: SouthAfricaProvince = 'Gauteng',
  stockOverrides?: ReadonlyMap<string, number>,
): {ok: true; quote: CheckoutQuote} | {ok: false; error: string} {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return {ok: false, error: 'Your shopping bag is empty.'};
  }
  if (rawItems.length > 25) {
    return {ok: false, error: 'Maximum 25 distinct line items per order.'};
  }

  const merged = new Map<string, CartItemInput>();
  for (const entry of rawItems) {
    if (!entry || typeof entry.productId !== 'string' || typeof entry.variantId !== 'string') {
      return {ok: false, error: 'Invalid item selection in bag.'};
    }
    const qty = Number(entry.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
      return {ok: false, error: 'Item quantity must be a whole number between 1 and 20.'};
    }
    const key = `${entry.productId}::${entry.variantId}`;
    const existing = merged.get(key);
    if (existing) {
      const nextQty = existing.quantity + qty;
      if (nextQty > 20) {
        return {ok: false, error: 'Maximum 20 units per product variant per order.'};
      }
      existing.quantity = nextQty;
    } else {
      merged.set(key, {productId: entry.productId, variantId: entry.variantId, quantity: qty});
    }
  }

  const productQtyTotals = new Map<string, number>();
  const lineItems: QuoteLineItem[] = [];
  let subtotalCents = 0;

  for (const item of merged.values()) {
    const product = CATALOG.find((p) => p.id === item.productId);
    if (!product) {
      return {ok: false, error: 'One or more selected products are no longer available.'};
    }
    const variant = product.variants.find((v) => v.id === item.variantId);
    if (!variant) {
      return {ok: false, error: `Selected option for ${product.name} is invalid.`};
    }

    const totalForProduct = (productQtyTotals.get(product.id) ?? 0) + item.quantity;
    productQtyTotals.set(product.id, totalForProduct);

    const availableStock = stockOverrides?.get(product.id) ?? product.stock;
    if (totalForProduct > availableStock) {
      return {
        ok: false,
        error: `Only ${availableStock} unit(s) of ${product.name} are currently in stock.`,
      };
    }

    const unitPriceCents = product.priceCents + variant.priceDeltaCents;
    const lineTotalCents = unitPriceCents * item.quantity;
    subtotalCents += lineTotalCents;

    lineItems.push({
      productId: product.id,
      variantId: variant.id,
      sku: variant.sku,
      name: product.name,
      variantLabel: variant.label,
      unitPriceCents,
      quantity: item.quantity,
      lineTotalCents,
      image: product.image,
    });
  }

  const shippingCents = calculateShippingCents(subtotalCents, province);
  const totalCents = subtotalCents + shippingCents;
  const vatIncludedCents = Math.round((totalCents * VAT_RATE) / (1 + VAT_RATE));
  const freeShippingApplied = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;
  const amountToFreeShippingCents = freeShippingApplied
    ? 0
    : FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents;

  return {
    ok: true,
    quote: {
      items: lineItems,
      subtotalCents,
      shippingCents,
      vatIncludedCents,
      totalCents,
      freeShippingApplied,
      amountToFreeShippingCents,
      estimatedDeliveryWindow: getEstimatedDeliveryWindow(province),
    },
  };
}
