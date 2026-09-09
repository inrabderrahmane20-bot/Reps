import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');

  return (
    <footer className="mt-20 hidden bg-majorelle-800 md:block">
      <div className="mx-auto max-w-7xl px-8 py-16">
        <div className="grid grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-arch bg-saffron-400 text-sm font-bold text-majorelle-900">
                M
              </span>
              <span className="font-display text-xl font-semibold text-white">Medina</span>
            </div>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-majorelle-100/70">{t('tagline')}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-majorelle-100">{t('product')}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-majorelle-100/70">
              <li><Link href="/news" className="transition-colors hover:text-saffron-400">{nav('news')}</Link></li>
              <li><Link href="/services" className="transition-colors hover:text-saffron-400">{nav('services')}</Link></li>
              <li><Link href="/communities" className="transition-colors hover:text-saffron-400">{nav('communities')}</Link></li>
              <li><Link href="/meetings" className="transition-colors hover:text-saffron-400">{nav('meetings')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-majorelle-100">{t('legal')}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-majorelle-100/70">
              <li><Link href="/terms" className="transition-colors hover:text-saffron-400">{t('terms')}</Link></li>
              <li><Link href="/privacy" className="transition-colors hover:text-saffron-400">{t('privacy')}</Link></li>
              <li><Link href="/rules" className="transition-colors hover:text-saffron-400">{t('rules')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-xs text-majorelle-100/50">© {new Date().getFullYear()} Medina. {t('rights')}</p>
        </div>
      </div>
    </footer>
  );
}
