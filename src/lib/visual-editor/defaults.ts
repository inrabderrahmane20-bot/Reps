import type { Data } from '@measured/puck';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import ar from '@/messages/ar.json';
import type { Locale } from '@/i18n/config';
import type { DocumentId, FooterContent, NavbarContent } from './types';

export const editorMessages = { en, fr, ar };
export function navbarDefaults(locale: Locale): NavbarContent {
  const { nav } = editorMessages[locale];
  return { brandName: 'Annabid', arabicName: 'النابض', brandImage: '', links: [
    { href: '/promotions', label: nav.promotions, hot: true },
    { href: '/search', label: nav.search, opensSearch: true, hiddenOnDesktop: true },
    { href: '/services', label: nav.services }, { href: '/places', label: nav.places },
    { href: '/communities', label: nav.communities }, { href: '/sell', label: nav.sell }, { href: '/map', label: nav.map },
  ], mobileLinks: [ { href: '/', label: nav.home }, { href: '/discover', label: nav.discover }, { href: '/map', label: nav.map }, { href: '/favorites', label: nav.favorites } ],
  mobileMoreLinks: [ { href: '/news', label: nav.news }, { href: '/activities', label: nav.activities }, { href: '/meetings', label: nav.meetings } ] };
}
export function footerDefaults(locale: Locale): FooterContent {
  const { footer, nav, common } = editorMessages[locale];
  return { brandName: 'Annabid', arabicName: 'النابض', brandImage: '', tagline: footer.tagline, footerNote: footer.footerNote, languageLabel: footer.language, rights: footer.rights, columns: [
    { title: footer.explore, links: [ { href: '/services', label: nav.services }, { href: '/promotions', label: nav.promotions }, { href: '/news', label: nav.news }, { href: '/communities', label: nav.communities }, { href: '/activities', label: nav.activities }, { href: '/meetings', label: nav.meetings }, { href: '/map', label: nav.map } ] },
    { title: footer.community, links: [ { href: '/news', label: nav.news }, { href: '/communities', label: nav.communities }, { href: '/activities', label: nav.activities }, { href: '/meetings', label: nav.meetings } ] },
    { title: footer.account, links: [ { href: '/login', label: common.login }, { href: '/register', label: nav.joinAnnabid }, { href: '/profile', label: common.myAccount }, { href: '/provider/dashboard', label: common.providerDashboard }, { href: '/search', label: nav.search } ] },
  ] };
}
export function defaultDocument(id: DocumentId, locale: Locale): Data {
  return { root: { props: {} }, content: [{ type: id === 'navbar' ? 'Navbar' : 'Footer', props: {
    id: `${id}-default`, content: id === 'navbar' ? navbarDefaults(locale) : footerDefaults(locale), styleFields: {},
  } }] };
}
