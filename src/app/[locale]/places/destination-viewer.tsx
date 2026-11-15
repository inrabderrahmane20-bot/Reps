'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  CATEGORY_META,
  getLocalized,
  getSourceUrl,
  getSummary,
  mapsUrl,
  thumbnailUrl,
  type Destination,
  type PlaceLocale,
} from '@/lib/places-catalogue';
import { OverlayPortal, useDialogBehavior } from './overlay';

export type ViewerSource = 'list' | 'map';

interface DestinationViewerProps {
  place: Destination;
  sequence: Destination[];
  source: ViewerSource;
  locale: PlaceLocale;
  returnToChapter: boolean;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

interface SwipeState {
  x: number;
  y: number;
}

function isRtl(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
}

export function DestinationViewer({
  place,
  sequence,
  source,
  locale,
  returnToChapter,
  onNavigate,
  onClose,
}: DestinationViewerProps) {
  const t = useTranslations('places');
  const shellRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<number | null>(null);
  const transitionTimer = useRef<number | null>(null);
  const closingRef = useRef(false);
  const dragRef = useRef<{ startY: number; startHeight: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const gallerySwipe = useRef<SwipeState | null>(null);
  const headSwipe = useRef<SwipeState | null>(null);
  const headMoved = useRef(false);
  const didSwipeRef = useRef(false);

  const [imageIndex, setImageIndex] = useState(0);
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const images = useMemo(() => {
    const list = place.images.length ? place.images : [CATEGORY_META[place.category].image];
    return list.length ? list : [CATEGORY_META.autres.image];
  }, [place.images, place.category]);

  const fallbackImage = CATEGORY_META[place.category].image;
  const index = Math.max(
    0,
    sequence.findIndex((item) => item.id === place.id),
  );
  const canNavigate = source === 'list' && sequence.length > 1;
  const canGoPrev = canNavigate && index > 0;
  const canGoNext = canNavigate && index < sequence.length - 1;
  const safeImageIndex = Math.min(imageIndex, images.length - 1);
  const description =
    getLocalized(place.description, locale) || getSummary(place, locale) || t('mapPreviewHint');
  const sourceUrl = getSourceUrl(place, locale);
  const googleMapsUrl = mapsUrl(place);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, 240);
  }, [onClose]);

  useDialogBehavior(true, shellRef, requestClose);

  const goTo = useCallback(
    (target: number) => {
      if (!canNavigate || transitioning) return;
      if (target < 0 || target >= sequence.length || target === index) return;
      setDirection(target > index ? 1 : -1);
      setTransitioning(true);
      transitionTimer.current = window.setTimeout(() => {
        onNavigate(target);
        setImageIndex(0);
        setTransitioning(false);
      }, 170);
    },
    [canNavigate, index, onNavigate, sequence.length, transitioning],
  );

  useEffect(() => {
    setImageIndex(0);
    setSheetExpanded(false);
    setPanelHeight(null);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [place.id]);

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
      if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!canNavigate) return;
    const rtl = isRtl();
    const handleKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const forward = rtl ? event.key === 'ArrowLeft' : event.key === 'ArrowRight';
      event.preventDefault();
      goTo(index + (forward ? 1 : -1));
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [canNavigate, goTo, index]);

  useEffect(() => {
    const handleResize = () => setPanelHeight(null);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const markLoaded = useCallback((url: string) => {
    setLoaded((previous) => {
      if (previous.has(url)) return previous;
      const next = new Set(previous);
      next.add(url);
      return next;
    });
  }, []);

  const markFailed = useCallback((url: string) => {
    setFailed((previous) => {
      if (previous.has(url)) return previous;
      const next = new Set(previous);
      next.add(url);
      return next;
    });
  }, []);

  const goPhoto = (delta: number) => {
    if (images.length < 2) return;
    setImageIndex((current) => (current + delta + images.length) % images.length);
  };

  const galleryPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    gallerySwipe.current = { x: event.clientX, y: event.clientY };
    didSwipeRef.current = false;
  };

  const galleryPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = gallerySwipe.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) didSwipeRef.current = true;
  };

  const galleryPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = gallerySwipe.current;
    gallerySwipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      goPhoto(dx < 0 ? 1 : -1);
    }
    window.setTimeout(() => {
      didSwipeRef.current = false;
    }, 0);
  };

  const galleryPointerCancel = () => {
    gallerySwipe.current = null;
    didSwipeRef.current = false;
  };

  const handleTap = (delta: number) => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    goPhoto(delta);
  };

  const headPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    headSwipe.current = { x: event.clientX, y: event.clientY };
    headMoved.current = false;
  };

  const headPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = headSwipe.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) headMoved.current = true;
  };

  const headPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = headSwipe.current;
    headSwipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (canNavigate && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      goTo(index + (dx < 0 ? 1 : -1));
      return;
    }
    if (!headMoved.current) setSheetExpanded((value) => !value);
  };

  const handleDragDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const height = panelRef.current?.getBoundingClientRect().height || 0;
    dragRef.current = { startY: event.clientY, startHeight: height, moved: false };
    suppressClickRef.current = false;
  };

  const handleDragMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const delta = event.clientY - drag.startY;
    if (Math.abs(delta) > 6) {
      drag.moved = true;
      suppressClickRef.current = true;
    }
    const min = 168;
    const max = window.innerHeight - 24;
    setPanelHeight(Math.min(max, Math.max(min, drag.startHeight - delta)));
  };

  const handleDragEnd = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 350);
    if (!drag.moved) {
      setSheetExpanded((value) => !value);
      setPanelHeight(null);
      return;
    }
    const height = panelRef.current?.getBoundingClientRect().height || drag.startHeight;
    setSheetExpanded(height > window.innerHeight * 0.6);
    setPanelHeight(null);
  };

  const handleButtonClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setSheetExpanded((value) => !value);
    setPanelHeight(null);
  };

  return (
    <OverlayPortal>
      <div className="dv-root" data-closing={closing ? 'true' : 'false'}>
        <button
          type="button"
          className="dv-backdrop"
          tabIndex={-1}
          aria-label={t('close')}
          onClick={requestClose}
        />

        <div
          ref={shellRef}
          className="dv-shell"
          role="dialog"
          aria-modal="true"
          aria-labelledby="destination-viewer-title"
          data-transitioning={transitioning ? 'true' : 'false'}
          style={{ '--dir': direction } as CSSProperties}
        >
          <div
            className="dv-media"
            role="group"
            aria-label={t('galleryRegion')}
            onPointerDown={galleryPointerDown}
            onPointerMove={galleryPointerMove}
            onPointerUp={galleryPointerUp}
            onPointerCancel={galleryPointerCancel}
          >
            <div
              key={place.id}
              className="dv-track"
              dir="ltr"
              style={{ transform: `translate3d(-${safeImageIndex * 100}%, 0, 0)` }}
            >
              {images.map((url, imagePosition) => {
                const failedImage = failed.has(url);
                const resolved = failedImage ? fallbackImage : url;
                const isLoaded = loaded.has(resolved);
                const isActive = imagePosition === safeImageIndex;
                return (
                  <figure
                    key={`${url}-${imagePosition}`}
                    className="dv-slide"
                    data-active={isActive ? 'true' : 'false'}
                    aria-hidden={isActive ? undefined : 'true'}
                  >
                    {!isLoaded ? <span className="dv-slide-shimmer" aria-hidden /> : null}
                    <img
                      src={thumbnailUrl(resolved, 1920)}
                      alt={isActive ? place.name : ''}
                      loading={imagePosition === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      draggable={false}
                      onLoad={() => markLoaded(resolved)}
                      onError={() => {
                        if (failedImage && resolved === fallbackImage) return;
                        if (resolved === fallbackImage) {
                          markFailed(fallbackImage);
                          return;
                        }
                        markFailed(url);
                      }}
                    />
                  </figure>
                );
              })}
            </div>
            <span className="dv-media-shade" aria-hidden />

            {images.length > 1 ? (
              <>
                <span className="dv-photo-counter" aria-live="polite">
                  {t('photoCounter', {
                    current: safeImageIndex + 1,
                    total: images.length,
                  })}
                </span>
                <button
                  type="button"
                  className="dv-photo-arrow dv-photo-prev"
                  onClick={() => goPhoto(-1)}
                  aria-label={t('previousPhoto')}
                >
                  <ChevronLeft size={20} aria-hidden />
                </button>
                <button
                  type="button"
                  className="dv-photo-arrow dv-photo-next"
                  onClick={() => goPhoto(1)}
                  aria-label={t('nextPhoto')}
                >
                  <ChevronRight size={20} aria-hidden />
                </button>
                <button
                  type="button"
                  className="dv-tap-zone dv-tap-prev"
                  onClick={() => handleTap(-1)}
                  aria-label={t('previousPhoto')}
                  tabIndex={-1}
                />
                <button
                  type="button"
                  className="dv-tap-zone dv-tap-next"
                  onClick={() => handleTap(1)}
                  aria-label={t('nextPhoto')}
                  tabIndex={-1}
                />
                <span className="dv-gallery-hint">{t('viewerPhotoHint')}</span>
              </>
            ) : null}
          </div>

          <div
            ref={panelRef}
            className="dv-panel"
            data-expanded={sheetExpanded ? 'true' : 'false'}
            data-dragging={panelHeight !== null ? 'true' : 'false'}
            style={panelHeight !== null ? { height: `${panelHeight}px` } : undefined}
          >
            <div className="dv-sheet-head">
              <button
                type="button"
                className="dv-grab"
                aria-label={sheetExpanded ? t('sheetCollapse') : t('sheetExpand')}
                aria-expanded={sheetExpanded}
                onPointerDown={handleDragDown}
                onPointerMove={handleDragMove}
                onPointerUp={handleDragEnd}
                onPointerCancel={handleDragEnd}
                onClick={handleButtonClick}
              >
                <span aria-hidden />
              </button>

              <div className="dv-head-row">
                <p className="dv-kicker">
                  <span>{t(place.category)}</span>
                  <span aria-hidden>·</span>
                  <span>{place.city}</span>
                </p>
                <div className="dv-sheet-nav" onPointerDown={(event) => event.stopPropagation()}>
                  {canNavigate ? (
                    <>
                      <button
                        type="button"
                        onClick={() => goTo(index - 1)}
                        disabled={!canGoPrev}
                        aria-label={t('previousPlace')}
                      >
                        <ChevronLeft size={16} aria-hidden />
                      </button>
                      <span aria-live="polite">
                        {t('destinationCounter', {
                          current: index + 1,
                          total: sequence.length,
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => goTo(index + 1)}
                        disabled={!canGoNext}
                        aria-label={t('nextPlace')}
                      >
                        <ChevronRight size={16} aria-hidden />
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className="dv-sheet-toggle"
                    onClick={() => {
                      setSheetExpanded((value) => !value);
                      setPanelHeight(null);
                    }}
                    aria-label={sheetExpanded ? t('sheetCollapse') : t('sheetExpand')}
                    aria-expanded={sheetExpanded}
                  >
                    {sheetExpanded ? (
                      <Minimize2 size={15} aria-hidden />
                    ) : (
                      <Maximize2 size={15} aria-hidden />
                    )}
                  </button>
                </div>
              </div>

              <div
                className="dv-head-copy"
                onPointerDown={headPointerDown}
                onPointerMove={headPointerMove}
                onPointerUp={headPointerUp}
                onPointerCancel={() => {
                  headSwipe.current = null;
                  headMoved.current = false;
                }}
              >
                <h2 id="destination-viewer-title">{place.name}</h2>
                {canNavigate ? <p className="dv-swipe-hint">{t('swipeDestinations')}</p> : null}
              </div>
            </div>

            <div ref={scrollRef} className="dv-scroll">
              <p className="dv-description">{description}</p>

              <div className="dv-actions">
                <a
                  className="dv-maps-link"
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <MapPin size={16} aria-hidden />
                  {t('openInMaps')}
                  <ExternalLink size={14} aria-hidden />
                </a>
                {!place.lat || !place.lng ? (
                  <span className="dv-unmapped">{t('unmappedNote')}</span>
                ) : null}
              </div>

              {!sheetExpanded ? (
                <button
                  type="button"
                  className="dv-readmore"
                  onClick={() => {
                    setSheetExpanded(true);
                    setPanelHeight(null);
                  }}
                >
                  {t('readMore')}
                </button>
              ) : null}

              <p className="dv-credit">
                <span>{t('sourceCredit')}</span>
                {sourceUrl ? (
                  <a href={sourceUrl} target="_blank" rel="noreferrer noopener">
                    {t('sourceLink')}
                    <ExternalLink size={12} aria-hidden />
                  </a>
                ) : null}
              </p>
            </div>
          </div>

          <div className="dv-topbar">
            {returnToChapter ? (
              <button type="button" className="dv-back" onClick={requestClose}>
                <ArrowLeft size={17} aria-hidden />
                {t('backToChapter')}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="dv-close"
              onClick={requestClose}
              aria-label={t('close')}
              data-autofocus
            >
              <X size={20} aria-hidden />
            </button>
          </div>

          {canNavigate ? (
            <>
              <button
                type="button"
                className="dv-dest-nav dv-dest-prev"
                onClick={() => goTo(index - 1)}
                disabled={!canGoPrev}
                aria-label={t('previousPlace')}
              >
                <ChevronLeft size={26} aria-hidden />
              </button>
              <button
                type="button"
                className="dv-dest-nav dv-dest-next"
                onClick={() => goTo(index + 1)}
                disabled={!canGoNext}
                aria-label={t('nextPlace')}
              >
                <ChevronRight size={26} aria-hidden />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </OverlayPortal>
  );
}
