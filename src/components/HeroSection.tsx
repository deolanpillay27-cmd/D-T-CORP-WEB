import {ArrowRight} from 'lucide-react';
import {useState} from 'react';
import {HERO_IMAGE_PATH} from '../../shared/catalog.ts';

interface HeroSectionProps {
  onShopBackupPower: () => void;
}

export function HeroSection({onShopBackupPower}: HeroSectionProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section id="top" aria-labelledby="hero-heading" className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col justify-center lg:col-span-6">
            <p className="text-xs font-semibold tracking-wide text-zinc-500">
              D&amp;T Corp South Africa · Load-Shedding &amp; Everyday Tech
            </p>
            <h1
              id="hero-heading"
              className="mt-3 font-display text-[clamp(2.5rem,5vw,4.15rem)] font-extrabold leading-[0.95] tracking-tight text-zinc-950"
            >
              Stay Powered Through Every Stage.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
              Direct-to-door backup power and everyday electronics curated for South African homes and remote workspaces. Free tracked courier delivery nationwide on orders over R 1,500.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#catalog"
                onClick={onShopBackupPower}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 whitespace-nowrap shrink-0"
              >
                <span>Shop Backup Power</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </a>
              <a
                href="#catalog"
                className="inline-flex min-h-[44px] items-center rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 whitespace-nowrap shrink-0"
              >
                Browse Full Store
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
              <span>Dispatched from Johannesburg</span>
              <span aria-hidden="true">·</span>
              <span>3D Secure Online Payments Only</span>
              <span aria-hidden="true">·</span>
              <span>12-Month Local Warranty</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 lg:aspect-auto lg:h-full lg:min-h-[360px]">
              {!imgFailed ? (
                <img
                  src={HERO_IMAGE_PATH}
                  alt="D&T Corp portable power station and Mini Router UPS keeping a South African home office laptop and Wi-Fi router running"
                  width={1280}
                  height={720}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-100 p-8 text-center">
                  <p className="font-display text-2xl font-bold text-zinc-900">
                    D&amp;T Corp Backup Power &amp; Tech
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Mini Router UPS · 300W &amp; 600W LiFePO4 Power Stations
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Store Guarantee Strip */}
      <div className="border-t border-zinc-200 bg-zinc-50">
        <dl className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-zinc-200 px-4 sm:grid-cols-2 sm:divide-y-0 sm:divide-x sm:px-6 lg:grid-cols-4">
          <div className="py-4 sm:pr-6">
            <dt className="text-xs font-semibold text-zinc-950">Nationwide SA Courier</dt>
            <dd className="mt-0.5 text-xs text-zinc-600">1–3 business days · Free over R 1,500</dd>
          </div>
          <div className="py-4 sm:px-6">
            <dt className="text-xs font-semibold text-zinc-950">Online Payments Only</dt>
            <dd className="mt-0.5 text-xs text-zinc-600">3D Secure Card, Instant EFT &amp; QR</dd>
          </div>
          <div className="py-4 sm:pr-6 lg:px-6">
            <dt className="text-xs font-semibold text-zinc-950">12-Month Local Warranty</dt>
            <dd className="mt-0.5 text-xs text-zinc-600">Direct South African swap-out support</dd>
          </div>
          <div className="py-4 sm:pl-6">
            <dt className="text-xs font-semibold text-zinc-950">15% VAT Included</dt>
            <dd className="mt-0.5 text-xs text-zinc-600">Official ZAR tax invoice with every order</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
