import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');

  return (
    <footer className="mt-16 hidden border-t border-ink-900/10 bg-white md:block">
      <div className="mx-auto max-w-7xl px-8 py-12">
        <div className="grid grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-arch bg-majorelle-600 text-xs font-bold text-white">
                M
              </span>
              <span className="font-display text-lg font-semibold text-ink-900">Medina</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">{t('tagline')}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink-900">{t('product')}</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li><Link href="/news" className="hover:text-majorelle-700">{nav('news')}</Link></li>
              <li><Link href="/services" className="hover:text-majorelle-700">{nav('services')}</Link></li>
              <li><Link href="/communities" className="hover:text-majorelle-700">{nav('communities')}</Link></li>
              <li><Link href="/meetings" className="hover:text-majorelle-700">{nav('meetings')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink-900">{t('legal')}</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li><Link href="/terms" className="hover:text-majorelle-700">{t('terms')}</Link></li>
              <li><Link href="/privacy" className="hover:text-majorelle-700">{t('privacy')}</Link></li>
              <li><Link href="/rules" className="hover:text-majorelle-700">{t('rules')}</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-xs text-ink-300">© {new Date().getFullYear()} Medina. {t('rights')}</p>
      </div>
    </footer>
  );
}
