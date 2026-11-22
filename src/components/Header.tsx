import {Menu, ShoppingBag, X} from 'lucide-react';
import {useState} from 'react';
import type {ProductCategory} from '../../shared/catalog.ts';

interface HeaderProps {
  bagCount: number;
  onOpenBag: () => void;
  onSelectCategoryAnchor: (category: 'all' | ProductCategory) => void;
}

export function Header({bagCount, onOpenBag, onSelectCategoryAnchor}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (category?: 'all' | ProductCategory) => {
    if (category) {
      onSelectCategoryAnchor(category);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:gap-8 sm:px-6">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#top"
          className="font-display text-2xl font-extrabold tracking-tight text-zinc-950 whitespace-nowrap shrink-0"
        >
          D&amp;T Corp
        </a>

        {/* Zone 2: Clean Single-Line Navigation Links (Desktop) */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600">
          <a
            href="#catalog"
            onClick={() => handleNavClick('backup-power')}
            className="hover:text-zinc-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Backup Power
          </a>
          <a
            href="#catalog"
            onClick={() => handleNavClick('audio-wearables')}
            className="hover:text-zinc-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Audio &amp; Smart
          </a>
          <a
            href="#delivery"
            onClick={() => handleNavClick()}
            className="hover:text-zinc-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Delivery
          </a>
          <a
            href="#support"
            onClick={() => handleNavClick()}
            className="hover:text-zinc-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Support
          </a>
        </nav>

        {/* Zone 3: Single Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenBag}
            aria-label={`Open shopping bag, ${bagCount} ${bagCount === 1 ? 'item' : 'items'}`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Bag</span>
            <span className="font-mono tabular-nums">({bagCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-site-nav"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-zinc-200 text-zinc-900 hover:bg-zinc-100 md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Collapsible Mobile Navigation */}
      {mobileMenuOpen && (
        <nav
          id="mobile-site-nav"
          aria-label="Mobile"
          className="border-t border-zinc-200 bg-white px-4 py-3 md:hidden"
        >
          <ul className="flex flex-col gap-1 text-sm font-medium text-zinc-800">
            <li>
              <a
                href="#catalog"
                onClick={() => handleNavClick('backup-power')}
                className="flex min-h-[44px] items-center rounded-md px-3 hover:bg-zinc-100"
              >
                Backup Power
              </a>
            </li>
            <li>
              <a
                href="#catalog"
                onClick={() => handleNavClick('audio-wearables')}
                className="flex min-h-[44px] items-center rounded-md px-3 hover:bg-zinc-100"
              >
                Audio &amp; Smart
              </a>
            </li>
            <li>
              <a
                href="#delivery"
                onClick={() => handleNavClick()}
                className="flex min-h-[44px] items-center rounded-md px-3 hover:bg-zinc-100"
              >
                SA Delivery &amp; Warranty
              </a>
            </li>
            <li>
              <a
                href="#support"
                onClick={() => handleNavClick()}
                className="flex min-h-[44px] items-center rounded-md px-3 hover:bg-zinc-100"
              >
                Order Lookup &amp; Support
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
