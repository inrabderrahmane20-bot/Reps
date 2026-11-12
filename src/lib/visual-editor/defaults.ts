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
export function servicesDefaultDocument(locale: Locale): Data {
  const messages = editorMessages[locale].services;
  const block = (type: string, content: Record<string,string> = {}, suffix = '') => ({ type, props: { id: `services-${type}${suffix}`, content, styleFields: {} } });
  return { root: { props: {} }, content: [
    block('ServicesHero', { heroKicker: messages.heroKicker, heroTitle: messages.heroTitle, heroSubtitle: messages.heroSubtitle, src: '/images/services/marrakech-hero-panoramic.jpg' }),
    { type: 'ServicesContent', props: { id: 'services-content', styleFields: {}, children: [
      block('ServicesSearch', { searchServices: messages.searchServices, searchButton: messages.searchButton, searchHint: messages.searchHint }),
      block('MoroccanDivider', {}, '1'),
      block('ServicesCategories', { exploreTitle: messages.exploreTitle, exploreSubtitle: messages.exploreSubtitle }),
      block('MoroccanDivider', {}, '2'),
      block('ServicesTree', { categories: messages.categories }),
      block('MoroccanDivider', {}, '3'),
      block('ServicesResults'),
    ] } },
  ] };
}
export const HOME_SECTION_FIELDS: Record<string,string[]> = {
  HomeHero: ['heroKicker','heroTitle','heroSubtitle','heroCtaSearch','searchPrompt','searchButton','heroStatProviders','heroStatPromotions','heroStatCategories'],
  HomeCategories: [],
  HomeBestRated: ['sectionBestRated','sectionBestRatedSubtitle','seeAll','emptyProvidersTitle','emptyProvidersBody'],
  HomeCommunities: ['sectionCommunities','sectionCommunitiesSubtitle','seeAll','emptyCommunitiesTitle','emptyCommunitiesBody'],
  HomePromotions: ['sectionPromotions','sectionPromotionsSubtitle','viewAllPromotions'],
  HomeAvailable: ['sectionAvailableNow','sectionAvailableNowSubtitle','seeAll'],
  HomeSponsored: ['sectionSponsored'],
};
export function homeDefaultDocument(locale: Locale): Data {
  const messages = editorMessages[locale].home as Record<string,string>;
  const blocks = Object.entries(HOME_SECTION_FIELDS).map(([type, keys]) => ({type, props: {id: `home-${type}`, content: { ...Object.fromEntries(keys.map(key => [key,messages[key]])), ...(type === 'HomeHero' ? {src:'/homepage_background.png'} : {}) }, styleFields: {}}}));
  return {root: {props:{}}, content:[blocks[0], {type:'HomeContent', props:{id:'home-content',styleFields:{},children:blocks.slice(1)}}]};
}
export const LEGAL_DEFAULTS: Record<string,{title:string;description:string;icon:string}> = {
  privacy: {title:'Privacy Policy',description:'How Medina collects, uses and protects your data will be published here.',icon:'ShieldCheck'},
  terms: {title:'Terms of Service',description:'Full legal terms will be published here before launch.',icon:'FileText'},
  rules: {title:'Community rules',description:'Guidelines every member agrees to when joining Medina.',icon:'BookOpen'},
};
export function defaultDocument(id: DocumentId, locale: Locale): Data {
  if (LEGAL_DEFAULTS[id]) return {root:{props:{}},content:[{type:'LegalIntro',props:{id:`${id}-intro`,content:LEGAL_DEFAULTS[id],styleFields:{}}}]};
  if (id === 'home') return homeDefaultDocument(locale);
  if (id === 'services') return servicesDefaultDocument(locale);
  return { root: { props: {} }, content: [{ type: id === 'navbar' ? 'Navbar' : 'Footer', props: {
    id: `${id}-default`, content: id === 'navbar' ? navbarDefaults(locale) : footerDefaults(locale), styleFields: {},
  } }] };
}
