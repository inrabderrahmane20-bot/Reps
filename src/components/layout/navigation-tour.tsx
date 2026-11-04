'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import {
  CalendarDays,
  Layers,
  MapPin,
  MessageCircle,
  Newspaper,
  Search,
  SlidersHorizontal,
  Tag,
  Users,
  UserRound,
} from 'lucide-react';
import { usePathname } from '@/i18n/navigation';
import { hasLanguagePreference } from '@/lib/language-preference';

type TourStep = {
  key: string;
  target: string;
  icon: typeof Search;
  placement?: 'top';
};

const PAGE_TOURS: Record<string, TourStep[]> = {
  '/': [
    { key: 'homeSearch', target: 'home-search', icon: Search, placement: 'top' },
    { key: 'homeCategories', target: 'home-categories', icon: Tag },
  ],
  '/services': [
    { key: 'servicesSearch', target: 'services-search', icon: Search, placement: 'top' },
    { key: 'servicesFilters', target: 'services-filters', icon: SlidersHorizontal },
    { key: 'servicesResults', target: 'services-results', icon: Tag },
  ],
  '/places': [
    { key: 'placesFilters', target: 'places-filters', icon: SlidersHorizontal, placement: 'top' },
    { key: 'placesList', target: 'places-list', icon: MapPin },
  ],
  '/communities': [{ key: 'communitiesList', target: 'communities-list', icon: Users }],
  '/activities': [
    { key: 'activitiesFilters', target: 'activities-filters', icon: SlidersHorizontal, placement: 'top' },
    { key: 'activitiesList', target: 'activities-list', icon: CalendarDays },
  ],
  '/news': [
    { key: 'newsTopics', target: 'news-topics', icon: Newspaper, placement: 'top' },
    { key: 'newsList', target: 'news-list', icon: Newspaper },
  ],
  '/promotions': [
    { key: 'promotionsSearch', target: 'promotions-search', icon: Search, placement: 'top' },
    { key: 'promotionsFilters', target: 'promotions-filters', icon: SlidersHorizontal },
  ],
  '/sell': [{ key: 'sellCategories', target: 'sell-categories', icon: Tag }],
  '/map': [
    { key: 'mapZones', target: 'map-zones', icon: MapPin, placement: 'top' },
    { key: 'mapLayers', target: 'map-layers', icon: Layers },
  ],
  '/search': [
    { key: 'searchForm', target: 'search-form', icon: Search, placement: 'top' },
    { key: 'searchResults', target: 'search-results', icon: Tag },
  ],
  '/favorites': [{ key: 'favoritesSections', target: 'favorites-sections', icon: Tag }],
  '/meetings': [
    { key: 'meetingProfiles', target: 'meeting-profiles', icon: Users },
    { key: 'meetingRooms', target: 'meeting-rooms', icon: MessageCircle },
  ],
  '/messages': [
    { key: 'messageInbox', target: 'message-inbox', icon: MessageCircle },
    { key: 'messageComposer', target: 'message-composer', icon: MessageCircle },
  ],
  '/profile': [
    { key: 'profileDetails', target: 'profile-details', icon: UserRound },
    { key: 'profileEdit', target: 'profile-edit', icon: SlidersHorizontal },
  ],
  '/provider/dashboard': [
    { key: 'providerSummary', target: 'provider-summary', icon: Tag },
    { key: 'providerRequests', target: 'provider-requests', icon: Users },
  ],
};

function findVisibleTarget(target: string): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-tour-target="${target}"]`)).find((element) => {
    const rect = element.getBoundingClientRect();
    return element.getClientRects().length > 0 && rect.width > 0 && rect.height > 0;
  }) ?? null;
}

function getPageSteps(pathname: string): TourStep[] {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (
    ['/services/', '/activities/', '/news/', '/communities/'].some((prefix) => normalizedPath.startsWith(prefix))
  ) {
    return [];
  }
  return PAGE_TOURS[normalizedPath] ?? [];
}

type Spotlight = { top: number; left: number; width: number; height: number } | null;

export function NavigationTour() {
  const t = useTranslations('navigationTour');
  const locale = useLocale();
  const pathname = usePathname();
  const [languageReady, setLanguageReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState<Spotlight>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const pageKey = `${locale}:${pathname}`;
  const currentStep = steps[step];

  useEffect(() => {
    if (hasLanguagePreference()) setLanguageReady(true);

    const onLanguageSelectionDismissed = () => setLanguageReady(true);
    window.addEventListener('annabid:language-selection-dismissed', onLanguageSelectionDismissed);
    return () => window.removeEventListener('annabid:language-selection-dismissed', onLanguageSelectionDismissed);
  }, []);

  useEffect(() => {
    if (!languageReady) return;

    const availableSteps = getPageSteps(pathname).filter((item) => findVisibleTarget(item.target));
    setSteps(availableSteps);
    setStep(0);
    setOpen(availableSteps.length > 0);
  }, [languageReady, pageKey, pathname]);

  useLayoutEffect(() => {
    if (!open || !currentStep) return;

    const updateSpotlight = () => {
      const target = findVisibleTarget(currentStep.target);
      if (!target) {
        setSpotlight(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      const left = Math.max(8, rect.left);
      const top = Math.max(8, rect.top);
      const width = Math.max(0, Math.min(rect.width, window.innerWidth - left - 8));
      const visibleHeight = Math.max(0, Math.min(rect.height, window.innerHeight - top - 8));
      const height = Math.min(visibleHeight, 180);
      setSpotlight(width && height ? { top, left, width, height } : null);
    };

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);
    return () => {
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
    };
  }, [currentStep, open]);

  useEffect(() => {
    if (!open || !currentStep) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      } else if (event.key === 'Tab') {
        const buttons = document.querySelectorAll<HTMLButtonElement>('[data-navigation-tour] button');
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    nextButtonRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [currentStep, open, step]);

  useEffect(() => {
    if (!open || !currentStep || step === 0) return;
    findVisibleTarget(currentStep.target)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'center',
    });
  }, [currentStep, open, step]);

  if (!open || !currentStep) return null;

  const Icon = currentStep.icon;
  const isLastStep = step === steps.length - 1;
  const tour = (
    <div className={`navigation-tour-overlay${spotlight ? '' : ' navigation-tour-overlay-dim'}`} data-navigation-tour>
      {spotlight && (
        <div
          className="navigation-tour-spotlight"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
          aria-hidden="true"
        />
      )}
      <section
        className={`navigation-tour-card${currentStep.placement === 'top' ? ' navigation-tour-card-top' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="navigation-tour-title"
        aria-describedby="navigation-tour-description"
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="navigation-tour-icon" aria-hidden="true">
          <Icon size={34} strokeWidth={2.2} />
        </div>
        <p className="navigation-tour-count">{t('stepOf', { current: step + 1, total: steps.length })}</p>
        <h2 id="navigation-tour-title">{t(`${currentStep.key}.title`)}</h2>
        <p id="navigation-tour-description">{t(`${currentStep.key}.description`)}</p>
        <div className="navigation-tour-actions">
          <button type="button" className="navigation-tour-skip" onClick={() => setOpen(false)}>
            {t('skip')}
          </button>
          <button
            ref={nextButtonRef}
            type="button"
            className="navigation-tour-next"
            onClick={() => (isLastStep ? setOpen(false) : setStep((current) => current + 1))}
          >
            {isLastStep ? t('finish') : t('nextStep')}
          </button>
        </div>
      </section>
    </div>
  );

  return createPortal(tour, document.body);
}
