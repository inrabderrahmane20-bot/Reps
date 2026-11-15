'use client';

import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function OverlayPortal({ children }: { children: ReactNode }) {
  const host = useRef<HTMLElement | null>(null);
  if (!host.current && typeof document !== 'undefined') host.current = document.body;

  // The portal is only rendered from interaction state, so `document` always
  // exists by the time this branch is reached. Keep the guard for safety.
  if (!host.current) return null;
  return createPortal(children, host.current);
}

/**
 * Locks page scroll, traps focus, closes on Escape and restores focus to the
 * trigger when the overlay unmounts. `onEscape` is stored in a ref so callers
 * can pass an inline callback without re-running the effect on every render.
 */
export function useDialogBehavior(
  open: boolean,
  containerRef: RefObject<HTMLElement>,
  onEscape: () => void,
) {
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    const container = containerRef.current;
    const focusFirst = () => {
      if (!container) return;
      const target =
        container.querySelector<HTMLElement>('[data-autofocus]') ||
        container.querySelector<HTMLElement>(FOCUSABLE) ||
        container;
      target.focus({ preventScroll: true });
    };
    const timer = window.setTimeout(focusFirst, 40);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        escapeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !container) return;
      const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) =>
          element.getClientRects().length > 0 &&
          !element.hasAttribute('disabled') &&
          element.getAttribute('aria-hidden') !== 'true',
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      if (previous && previous.isConnected) {
        try {
          previous.focus({ preventScroll: true });
        } catch {
          // The trigger may belong to a chapter that has been unmounted.
        }
      }
    };
  }, [open, containerRef]);
}
