'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Predictable scroll behaviour for client-side navigation:
 *
 * - Opening a new page (link click, `router.push`, locale switch) starts at
 *   the top of the page instead of inheriting the previous page's scroll.
 * - Going back or forward in the browser history returns the visitor to the
 *   place they left, instead of dropping them at the top.
 *
 * Next.js' built-in handling relies on browser heuristics that are skipped in
 * some situations (fixed/sticky page roots, scroll-locked overlays, restored
 * pages, mobile browsers), so the two cases are handled explicitly here.
 */

type ScrollPosition = { x: number; y: number };

const TOP_RETRY_MS = 800;
const RESTORE_RETRY_MS = 2000;
const RESTORE_TOLERANCE = 2;

// `useLayoutEffect` warns during SSR, so fall back to `useEffect` on the server.
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

function locationKey(): string {
  return `${window.location.pathname}${window.location.search}`;
}

export function ScrollManager() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const positions = useRef(new Map<string, ScrollPosition>());
  // URL the browser is navigating to through back/forward. Set on `popstate`,
  // consumed by the layout effect once the new route has rendered.
  const popTarget = useRef<string | null>(null);
  const restoring = useRef(false);
  const stopAnimation = useRef<(() => void) | null>(null);

  useEffect(() => {
    let frame = 0;

    const savePosition = () => {
      frame = 0;
      if (restoring.current) return;
      positions.current.set(locationKey(), {
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    // Scroll events fire constantly while the visitor moves, so coalesce them
    // into one write per frame.
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(savePosition);
    };

    const onPopState = () => {
      popTarget.current = locationKey();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('popstate', onPopState);
    // Capture the position the browser may already have restored on a reload.
    savePosition();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('popstate', onPopState);
      stopAnimation.current?.();
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    // A newer navigation supersedes any scroll animation still in flight.
    stopAnimation.current?.();
    stopAnimation.current = null;

    const key = locationKey();
    const isPop = popTarget.current === key;
    popTarget.current = null;

    // Deep links keep the browser's (or Next.js') anchor scrolling.
    if (window.location.hash) return;

    const finish = () => {
      restoring.current = false;
      stopAnimation.current = null;
    };

    if (isPop) {
      const saved = positions.current.get(key);
      if (!saved) return;

      restoring.current = true;
      const startedAt = performance.now();
      let frame = 0;
      let done = false;

      const stop = () => {
        if (done) return;
        done = true;
        window.cancelAnimationFrame(frame);
        window.removeEventListener('wheel', stop);
        window.removeEventListener('touchstart', stop);
        window.removeEventListener('keydown', stop);
        finish();
      };
      stopAnimation.current = stop;

      const step = () => {
        if (done) return;
        window.scrollTo(saved.x, saved.y);
        const maxY = document.documentElement.scrollHeight - window.innerHeight;
        const reached =
          maxY >= saved.y && Math.abs(window.scrollY - saved.y) <= RESTORE_TOLERANCE;
        if (reached || performance.now() - startedAt > RESTORE_RETRY_MS) {
          stop();
          return;
        }
        // Content (data, images) can still be growing, so keep retrying for a
        // moment instead of stopping at a clamped position.
        frame = window.requestAnimationFrame(step);
      };

      // Never fight a visitor who starts scrolling during the restore.
      window.addEventListener('wheel', stop, { passive: true });
      window.addEventListener('touchstart', stop, { passive: true });
      window.addEventListener('keydown', stop);
      step();
      return;
    }

    // Forward navigation: always land at the top. Retry briefly because a
    // scroll-locked overlay may still be closing while the route commits.
    restoring.current = true;
    const startedAt = performance.now();
    let frame = 0;
    let done = false;

    const stop = () => {
      if (done) return;
      done = true;
      window.cancelAnimationFrame(frame);
      finish();
    };
    stopAnimation.current = stop;

    const step = () => {
      if (done) return;
      window.scrollTo(0, 0);
      if (window.scrollY <= 0 || performance.now() - startedAt > TOP_RETRY_MS) {
        stop();
        return;
      }
      frame = window.requestAnimationFrame(step);
    };

    step();
  }, [pathname]);

  return null;
}
