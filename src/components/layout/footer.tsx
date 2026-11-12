'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { FooterContent } from '@/lib/visual-editor/types';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { locales, localeLabel, type Locale } from '@/i18n/config';
import { BrandMark } from './brand';

export function Footer({ content, style, visualId, previewPath }: { content?: FooterContent; style?: CSSProperties; visualId?: string; previewPath?: string } = {}) {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');
  const common = useTranslations('common');
  const currentPathname = usePathname();
  const pathname = previewPath ?? currentPathname;
  const isHome = pathname === '/';
  const locale = useLocale() as Locale;

  return (
    <footer style={style} data-visual-block={visualId} className={isHome ? 'home-footer' : 'site-footer mt-20 hidden bg-wine-900 md:block'}>
      <div className="mx-auto max-w-[1720px] px-6 py-14 xl:px-8">
        <div className={isHome ? 'home-footer-grid grid' : 'grid grid-cols-12 gap-10'}>
          {/* Brand */}
          <div className="col-span-12 lg:col-span-4">
            <div className="annabid-footer-brand">
              <span className="annabid-footer-mark" aria-hidden>
                {content?.brandImage ? <Image src={content.brandImage} alt={content.brandName} width={64} height={32} className="annabid-footer-logo object-contain" /> : <BrandMark className="annabid-footer-logo" />}
              </span>
              <span className="annabid-footer-wordmark">
                <span className="annabid-footer-name">{content?.brandName ?? 'Annabid'}</span>
                <span lang="ar" dir="rtl" className="annabid-footer-arabic">
                  {content?.arabicName ?? '\u0627\u0644\u0646\u0627\u0628\u0636'}
                </span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/80">{content?.tagline ?? t('tagline')}</p>
            <p className="mt-4 text-[13px] font-medium text-wine-200">{content?.footerNote ?? t('footerNote')}</p>
          </div>

          {content ? content.columns.map((column, index) => (
            <div key={index} className={index === 1 ? 'col-span-6 sm:col-span-4 lg:col-span-2' : 'col-span-6 sm:col-span-4 lg:col-span-3'}>
              <h3 className="text-sm font-semibold text-white">{column.title}</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-white/75">
                {column.links.map((link, linkIndex) => <li key={linkIndex}><Link href={link.href || '/'} className="transition-colors hover:text-wine-200">{link.label}</Link></li>)}
              </ul>
            </div>
          )) : <>
          {/* Explore */}
          <div className="col-span-6 sm:col-span-4 lg:col-span-3">
            <h3 className="text-sm font-semibold text-white">{t('explore')}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/75">
              <li><Link href="/services" className="transition-colors hover:text-wine-200">{nav('services')}</Link></li>
              <li><Link href="/promotions" className="transition-colors hover:text-wine-200">{nav('promotions')}</Link></li>
              <li><Link href="/news" className="transition-colors hover:text-wine-200">{nav('news')}</Link></li>
              <li><Link href="/communities" className="transition-colors hover:text-wine-200">{nav('communities')}</Link></li>
              <li><Link href="/activities" className="transition-colors hover:text-wine-200">{nav('activities')}</Link></li>
              <li><Link href="/meetings" className="transition-colors hover:text-wine-200">{nav('meetings')}</Link></li>
              <li><Link href="/map" className="transition-colors hover:text-wine-200">{nav('map')}</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div className="col-span-6 sm:col-span-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-white">{t('community')}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/75">
              <li><Link href="/news" className="transition-colors hover:text-wine-200">{nav('news')}</Link></li>
              <li><Link href="/communities" className="transition-colors hover:text-wine-200">{nav('communities')}</Link></li>
              <li><Link href="/activities" className="transition-colors hover:text-wine-200">{nav('activities')}</Link></li>
              <li><Link href="/meetings" className="transition-colors hover:text-wine-200">{nav('meetings')}</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div className="col-span-6 sm:col-span-4 lg:col-span-3">
            <h3 className="text-sm font-semibold text-white">{t('account')}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/75">
              <li><Link href="/login" className="transition-colors hover:text-wine-200">{common('login')}</Link></li>
              <li><Link href="/register" className="transition-colors hover:text-wine-200">{nav('joinAnnabid')}</Link></li>
              <li><Link href="/profile" className="transition-colors hover:text-wine-200">{common('myAccount')}</Link></li>
              <li><Link href="/provider/dashboard" className="transition-colors hover:text-wine-200">{common('providerDashboard')}</Link></li>
              <li><Link href="/search" className="transition-colors hover:text-wine-200">{nav('search')}</Link></li>
            </ul>
          </div>
          </>}
        </div>

        {/* Language row */}
        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-6">
          <span className="text-[13px] font-semibold text-white/80">{content?.languageLabel ?? t('language')}</span>
          {locales.map((l) => (
            <Link
              key={l}
              href={pathname || '/'}
              locale={l}
              className={`text-[13px] text-white/75 transition-colors hover:text-wine-200 ${
                isHome && locale === l ? 'home-footer-lang-active' : ''
              }`}
            >
              {localeLabel[l]}
            </Link>
          ))}
          <span className="ms-auto text-[13px] text-white/70">
            © {new Date().getFullYear()} {content?.brandName ?? 'Annabid'} · {content?.rights ?? t('rights')}
          </span>
        </div>
      </div>
    </footer>
  );
}
