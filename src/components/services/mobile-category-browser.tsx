'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getCategoryLabel, type SearchCategoryNode } from '@/lib/category-tree';
import { categoryPath } from '@/lib/service-selection';
import { serviceCategoryHref } from '@/lib/services-browser';
import { servicesCopy } from '@/lib/services-copy';
import { CategoryPhoto } from './category-photo';
import { CategoryMobileIcon, useCategoryAppearance } from '@/components/category-appearance';

/** A separate presentation keeps the desktop directory and its controls intact. */
export function MobileCategoryBrowser({ roots, activeId, onBrowse, onSelect }: {
  roots: SearchCategoryNode[];
  activeId: string | null;
  onBrowse: (id: string | null) => void;
  onSelect: (node: SearchCategoryNode) => void;
}) {
  const locale = useLocale();
  const appearance = useCategoryAppearance();
  const copy = servicesCopy(locale);
  const [expanded, setExpanded] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousId = useRef(activeId);
  const path = categoryPath(roots, activeId ?? '') ?? [];
  const current = path.at(-1);
  const wrapper = current?.children?.length === 1 && current.children[0].children?.length
    ? current.children[0] : null;
  const choices = current ? wrapper?.children ?? current.children ?? [] : roots;
  const parent = path.at(-2);
  const grandparent = path.at(-3);
  const backTarget = grandparent?.children?.length === 1 && grandparent.children[0].id === parent?.id
    ? grandparent : parent;

  useEffect(() => {
    if (previousId.current === activeId) return;
    previousId.current = activeId;
    setExpanded(false);
    // Only move focus for the visible mobile presentation, including keyboard use.
    if (headingRef.current?.getClientRects().length) {
      headingRef.current.focus({ preventScroll: true });
      headingRef.current.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }, [activeId]);

  return <section className="svc-mobile-browser" aria-labelledby="svc-mobile-heading">
    {current && <button type="button" className="svc-mobile-back" onClick={() => onBrowse(backTarget?.id ?? null)}>
      <ArrowLeft size={18} className="flip-rtl" aria-hidden />{copy.back}
      <span>{backTarget ? getCategoryLabel(backTarget, locale) : copy.categories}</span>
    </button>}
    <h2 id="svc-mobile-heading" ref={headingRef} tabIndex={-1}>
      {current ? getCategoryLabel(current, locale) : copy.choose}
    </h2>
    <p className="svc-mobile-intro">{current ? choices.length ? copy.mobileRefine : copy.mobileReady : copy.mobileChoose}</p>
    {current && <button type="button" className="svc-browse-apply svc-mobile-apply" onClick={() => onSelect(current)}>
      {copy.professionals}<ArrowRight size={18} className="flip-rtl" aria-hidden />
    </button>}
    {choices.length > 0 && <div className="svc-mobile-choices">
      {(expanded ? choices : choices.slice(0, 6)).map(node => <Link
        key={node.id}
        href={serviceCategoryHref(roots, node.id)}
        className="svc-mobile-choice"
        data-category-id={node.id}
        data-mobile-size={appearance.get(node.id)?.mobileSize ?? 'regular'}
        onClick={event => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          onBrowse(node.id);
        }}
      >
        <span className="svc-mobile-photo"><CategoryPhoto node={node} fallbackKey={path[0]?.slug} alt="" sizes="56px" /></span>
        <CategoryMobileIcon categoryId={node.id} />
        <span className="svc-mobile-choice-label">{getCategoryLabel(node, locale)}</span>
        <ChevronRight size={18} className="flip-rtl" aria-hidden />
      </Link>)}
    </div>}
    {choices.length > 6 && <button type="button" className="svc-mobile-more" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
      {expanded ? copy.showLess : `${copy.showMore} (${choices.length - 6})`}
    </button>}
  </section>;
}
