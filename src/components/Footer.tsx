import type {ProductCategory} from '../../shared/catalog.ts';

interface FooterProps {
  onSelectCategoryAnchor: (category: 'all' | ProductCategory) => void;
}

export function Footer({onSelectCategoryAnchor}: FooterProps) {
  return (
    <footer id="support" className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-2xl font-extrabold tracking-tight text-zinc-950">
              D&amp;T Corp South Africa
            </p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600">
              Everyday tech essentials and load-shedding backup power dispatched nationwide across South Africa.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-950">Shop</h3>
            <ul className="mt-3 space-y-2 text-xs text-zinc-600">
              <li>
                <a
                  href="#catalog"
                  onClick={() => onSelectCategoryAnchor('backup-power')}
                  className="hover:text-zinc-950 hover:underline underline-offset-4"
                >
                  Mini Router UPS &amp; Power Stations
                </a>
              </li>
              <li>
                <a
                  href="#catalog"
                  onClick={() => onSelectCategoryAnchor('audio-wearables')}
                  className="hover:text-zinc-950 hover:underline underline-offset-4"
                >
                  ANC Earbuds &amp; Smartwatches
                </a>
              </li>
              <li>
                <a
                  href="#catalog"
                  onClick={() => onSelectCategoryAnchor('home-streaming')}
                  className="hover:text-zinc-950 hover:underline underline-offset-4"
                >
                  4K UHD Streaming Sticks
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
              Customer Support
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-zinc-600">
              <li>Johannesburg Distribution Hub, Gauteng</li>
              <li>Mon–Fri · 08:00–17:00 SAST</li>
              <li>
                <a
                  href="mailto:support@dtcorpsa.co.za"
                  className="font-medium text-zinc-900 hover:underline underline-offset-4"
                >
                  support@dtcorpsa.co.za
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
              Checkout Standards
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-zinc-600">
              <li>All prices in ZAR incl. 15% VAT</li>
              <li>3D Secure Card, Instant EFT &amp; QR</li>
              <li>No Cash on Delivery</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-zinc-200 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center">
          <p>&copy; {new Date().getFullYear()} D&amp;T Corp South Africa. All rights reserved.</p>
          <p>ECTA Compliant · ICASA Approved Wireless Hardware</p>
        </div>
      </div>
    </footer>
  );
}
