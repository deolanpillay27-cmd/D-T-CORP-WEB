import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import express, {type NextFunction, type Request, type Response} from 'express';
import {
  CATALOG,
  SA_PROVINCES,
  computeAuthoritativeQuote,
  type CartItemInput,
  type CheckoutQuote,
  type PaymentMethod,
  type SouthAfricaProvince,
} from './shared/catalog.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

// Authoritative in-memory inventory and order registry
const liveStock = new Map<string, number>(CATALOG.map((p) => [p.id, p.stock]));

interface StoredOrder {
  orderNumber: string;
  createdAt: string;
  status: 'Confirmed — Preparing SA Courier Dispatch';
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

const ordersByNumber = new Map<string, StoredOrder>();
const idempotencyCache = new Map<string, StoredOrder>();

// Lightweight sliding-window rate limiter for checkout endpoints
const rateWindowMs = 60_000;
const rateMaxRequests = 40;
const ipHits = new Map<string, {count: number; resetAt: number}>();

function checkoutRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = ipHits.get(ip);

  if (!record || now > record.resetAt) {
    ipHits.set(ip, {count: 1, resetAt: now + rateWindowMs});
    next();
    return;
  }

  if (record.count >= rateMaxRequests) {
    res.status(429).json({
      error: 'Too many checkout requests. Please wait a moment before trying again.',
    });
    return;
  }

  record.count += 1;
  next();
}

function isValidProvince(value: unknown): value is SouthAfricaProvince {
  return typeof value === 'string' && (SA_PROVINCES as readonly string[]).includes(value);
}

function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Accepts South African mobile/landline formats: +27XXXXXXXXX or 0XXXXXXXXX (9 digits after prefix)
const SA_PHONE_REGEX = /^(?:\+27|0)[1-8]\d{8}$/;
const SA_POSTAL_CODE_REGEX = /^\d{4}$/;

function normalizeSaPhone(raw: string): string {
  return raw.replace(/[\s\-()]/g, '');
}

const ALLOWED_ONLINE_METHODS = new Set<PaymentMethod>(['card', 'instant_eft', 'scan_to_pay']);

async function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Baseline security headers (never set X-Frame-Options because AI Studio preview uses an iframe)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use(express.json({limit: '32kb'}));

  app.get('/api/health', (_req, res) => {
    res.json({status: 'ok', store: 'D&T Corp South Africa', currency: 'ZAR'});
  });

  app.get('/api/products', (_req, res) => {
    const products = CATALOG.map((product) => ({
      ...product,
      stock: liveStock.get(product.id) ?? product.stock,
    }));
    res.setHeader('Cache-Control', 'no-cache');
    res.json({products});
  });

  app.post('/api/checkout/quote', checkoutRateLimit, (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const body = req.body as {items?: CartItemInput[]; province?: unknown} | undefined;
    const province: SouthAfricaProvince = isValidProvince(body?.province)
      ? body.province
      : 'Gauteng';

    const result = computeAuthoritativeQuote(body?.items ?? [], province, liveStock);
    if (!result.ok) {
      res.status(400).json({error: result.error});
      return;
    }
    res.json({quote: result.quote, province});
  });

  app.post('/api/checkout/orders', checkoutRateLimit, (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    const idempotencyKeyRaw =
      req.header('Idempotency-Key') ||
      (typeof req.body?.idempotencyKey === 'string' ? req.body.idempotencyKey : '');
    const idempotencyKey = sanitizeText(idempotencyKeyRaw, 80);

    if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
      const existing = idempotencyCache.get(idempotencyKey)!;
      res.status(200).json({order: existing, deduplicated: true});
      return;
    }

    const body = req.body ?? {};
    const fullName = sanitizeText(body.customer?.fullName, 80);
    const email = sanitizeText(body.customer?.email, 120).toLowerCase();
    const phone = normalizeSaPhone(sanitizeText(body.customer?.phone, 24));

    const streetAddress = sanitizeText(body.shippingAddress?.streetAddress, 140);
    const suburbCity = sanitizeText(body.shippingAddress?.suburbCity, 80);
    const provinceRaw = body.shippingAddress?.province;
    const postalCode = sanitizeText(body.shippingAddress?.postalCode, 10);

    if (fullName.length < 2) {
      res.status(400).json({error: 'Please enter the recipient’s full name.'});
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({error: 'Please enter a valid email address for your tax invoice.'});
      return;
    }
    if (!SA_PHONE_REGEX.test(phone)) {
      res.status(400).json({
        error: 'Please enter a valid South African phone number (e.g., 082 555 0142 or +27825550142).',
      });
      return;
    }
    if (streetAddress.length < 5 || suburbCity.length < 2) {
      res.status(400).json({error: 'Please provide a complete South African street address and suburb/city.'});
      return;
    }
    if (!isValidProvince(provinceRaw)) {
      res.status(400).json({error: 'Please select a valid South African province.'});
      return;
    }
    if (!SA_POSTAL_CODE_REGEX.test(postalCode)) {
      res.status(400).json({error: 'South African postal codes must be exactly 4 digits.'});
      return;
    }

    // Enforce online payments only (reject COD or unknown methods)
    const paymentMethod = body.payment?.method;
    if (typeof paymentMethod !== 'string' || !ALLOWED_ONLINE_METHODS.has(paymentMethod as PaymentMethod)) {
      res.status(400).json({
        error: 'Online payment is required (3D Secure Card, Instant EFT, or Scan to Pay). Cash on delivery is not supported.',
      });
      return;
    }

    // Reject raw PAN or CVV fields if a tampered client tries to transmit them
    if (body.payment?.cardNumber !== undefined || body.payment?.cvv !== undefined) {
      res.status(400).json({
        error: 'Direct raw card numbers are not accepted by this endpoint. Use tokenized payment details only.',
      });
      return;
    }

    let paymentSummary: StoredOrder['paymentSummary'];
    if (paymentMethod === 'card') {
      const token = sanitizeText(body.payment?.token, 64);
      const last4 = sanitizeText(body.payment?.last4, 4);
      const brand = sanitizeText(body.payment?.brand, 24) || 'Card';
      if (!token.startsWith('tok_sa_') || !/^\d{4}$/.test(last4)) {
        res.status(400).json({error: 'Please complete your 3D Secure card payment details.'});
        return;
      }
      paymentSummary = {
        method: 'card',
        methodLabel: `${brand} ending in ${last4}`,
        reference: `3DS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        threeDSecureVerified: true,
      };
    } else if (paymentMethod === 'instant_eft') {
      const bank = sanitizeText(body.payment?.bank, 40);
      const allowedBanks = new Set(['FNB', 'Standard Bank', 'Absa', 'Nedbank', 'Capitec', 'Investec']);
      if (!allowedBanks.has(bank)) {
        res.status(400).json({error: 'Please select a supported South African bank for Instant EFT.'});
        return;
      }
      paymentSummary = {
        method: 'instant_eft',
        methodLabel: `Instant EFT (${bank})`,
        reference: `EFT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        threeDSecureVerified: true,
      };
    } else {
      const wallet = sanitizeText(body.payment?.wallet, 30);
      if (wallet !== 'SnapScan' && wallet !== 'Zapper') {
        res.status(400).json({error: 'Please select SnapScan or Zapper for QR payment.'});
        return;
      }
      paymentSummary = {
        method: 'scan_to_pay',
        methodLabel: `${wallet} QR Online Payment`,
        reference: `QR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        threeDSecureVerified: true,
      };
    }

    // Recompute authoritative pricing & verify inventory on server
    const quoteResult = computeAuthoritativeQuote(body.items ?? [], provinceRaw, liveStock);
    if (!quoteResult.ok) {
      res.status(400).json({error: quoteResult.error});
      return;
    }

    // Deduct stock atomically inside single-threaded event loop
    const productQuantityMap = new Map<string, number>();
    for (const line of quoteResult.quote.items) {
      productQuantityMap.set(
        line.productId,
        (productQuantityMap.get(line.productId) ?? 0) + line.quantity,
      );
    }
    for (const [productId, qty] of productQuantityMap.entries()) {
      const current = liveStock.get(productId) ?? 0;
      liveStock.set(productId, Math.max(0, current - qty));
    }

    const orderNumber = `DT-SA-${10400 + ordersByNumber.size + 1}`;
    const order: StoredOrder = {
      orderNumber,
      createdAt: new Date().toISOString(),
      status: 'Confirmed — Preparing SA Courier Dispatch',
      customer: {
        fullName,
        email,
        phone,
      },
      shippingAddress: {
        streetAddress,
        suburbCity,
        province: provinceRaw,
        postalCode,
      },
      paymentSummary,
      quote: quoteResult.quote,
    };

    ordersByNumber.set(orderNumber, order);
    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, order);
    }

    res.status(201).json({order});
  });

  // Protected order lookup: requires both orderNumber and matching customer email to prevent IDOR enumeration
  app.get('/api/checkout/orders/:orderNumber', checkoutRateLimit, (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const orderNumber = sanitizeText(req.params.orderNumber, 32).toUpperCase();
    const emailQuery = sanitizeText(req.query.email, 120).toLowerCase();

    if (!orderNumber || !EMAIL_REGEX.test(emailQuery)) {
      res.status(400).json({error: 'Both order number and the checkout email address are required.'});
      return;
    }

    const order = ordersByNumber.get(orderNumber);
    if (!order || order.customer.email !== emailQuery) {
      res.status(404).json({error: 'No matching order was found for that order number and email.'});
      return;
    }

    res.json({order});
  });

  if (!isProduction) {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    const distAssetsDir = path.resolve(distDir, 'src/assets');
    if (fs.existsSync(distAssetsDir)) {
      app.use('/src/assets', express.static(distAssetsDir, {maxAge: '7d'}));
    }
    app.use(express.static(distDir, {maxAge: '1h'}));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`D&T Corp South Africa storefront running on http://0.0.0.0:${PORT}`);
  });
}

createApp().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
