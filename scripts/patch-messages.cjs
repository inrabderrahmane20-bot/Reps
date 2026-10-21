/* One-off helper used to add the new i18n namespaces to src/messages/*.json */
const fs = require('fs');

const CATEGORY_KEYS = {
  maisonBatiment: ['Maison & bâtiment', 'Home & building', 'المنزل والبناء'],
  nettoyageEntretien: ['Nettoyage & entretien', 'Cleaning & maintenance', 'التنظيف والصيانة'],
  jardinExterieur: ['Jardin & extérieur', 'Garden & outdoors', 'الحديقة والخارج'],
  automobileMoto: ['Automobile & moto', 'Cars & motorbikes', 'السيارات والدراجات النارية'],
  informatiqueTechnologie: [
    'Informatique & technologie',
    'Computing & technology',
    'الإعلام الآلي والتقنية',
  ],
  servicesDomicile: ['Services à domicile', 'Home services', 'خدمات منزلية'],
  beauteBienEtre: ['Beauté & bien-être', 'Beauty & wellness', 'الجمال والعناية'],
  modeArtisanat: ['Mode & artisanat', 'Fashion & craft', 'الأزياء والحرف اليدوية'],
  mariageEvenements: ['Mariage & événements', 'Weddings & events', 'الأعراس والمناسبات'],
  cuisineAlimentation: ['Cuisine & alimentation', 'Cooking & food', 'المطبخ والأغذية'],
  transportLogistique: ['Transport & logistique', 'Transport & logistics', 'النقل واللوجستيك'],
  securite: ['Sécurité', 'Security', 'الأمن'],
  educationFormation: ['Éducation & formation', 'Education & training', 'التعليم والتكوين'],
  animaux: ['Animaux', 'Pets', 'الحيوانات الأليفة'],
  locationMateriel: ['Location de matériel', 'Equipment rental', 'تأجير المعدات'],
  depannageUrgent: ['Dépannage urgent', 'Emergency repairs', 'الإصلاح العاجل'],
  serrurerieVitrerie: ['Serrurerie & vitrerie', 'Locksmith & glazing', 'الأقفال والزجاج'],
  electromenager: ['Électroménager', 'Home appliances', 'الأجهزة المنزلية'],
  meublesDecoration: ['Meubles & décoration', 'Furniture & decoration', 'الأثاث والديكور'],
  entreprisesProfessionnels: [
    'Entreprises & professionnels',
    'Businesses & professionals',
    'الشركات والمهنيون',
  ],
  autresServices: ['Autres services', 'Other services', 'خدمات أخرى'],
};

const LOCALES = ['fr', 'ar', 'en'];
const INDEX = { fr: 0, en: 1, ar: 2 };

const NAV = {
  fr: { brandHome: 'Medina — accueil', primaryNav: 'Navigation principale' },
  en: { brandHome: 'Medina — home', primaryNav: 'Primary navigation' },
  ar: { brandHome: 'مدينة — الرئيسية', primaryNav: 'التنقل الرئيسي' },
};

const PROMOTIONS_NAV = { fr: 'Promotions', en: 'Promotions', ar: 'العروض' };

const FLOATING_SEARCH = {
  fr: {
    placeholder: 'Rechercher un service, une catégorie, une actualité…',
    shortcut: 'Recherche',
    openLabel: 'Ouvrir la recherche',
    inputLabel: 'Recherche globale',
    clear: 'Effacer la recherche',
    cancel: 'Fermer la recherche',
    loading: 'Recherche en cours…',
    recentSearches: 'Recherches récentes',
    clearAll: 'Tout effacer',
    removeRecent: 'Retirer « {query} » des recherches récentes',
    noResultsTitle: 'Aucun résultat',
    noResultsBody: 'Essayez un autre mot-clé ou parcourez les catégories.',
    exploreCategories: 'Explorer les services',
    seeAllResults: 'Voir tous les résultats pour « {query} »',
    groupPromotions: 'Promotions',
    groupCategories: 'Catégories',
  },
  en: {
    placeholder: 'Search a service, a category, some news…',
    shortcut: 'Search',
    openLabel: 'Open search',
    inputLabel: 'Global search',
    clear: 'Clear search',
    cancel: 'Close search',
    loading: 'Searching…',
    recentSearches: 'Recent searches',
    clearAll: 'Clear all',
    removeRecent: 'Remove “{query}” from recent searches',
    noResultsTitle: 'No results',
    noResultsBody: 'Try a different keyword or browse the categories.',
    exploreCategories: 'Browse services',
    seeAllResults: 'See all results for “{query}”',
    groupPromotions: 'Promotions',
    groupCategories: 'Categories',
  },
  ar: {
    placeholder: 'ابحث عن خدمة أو فئة أو خبر…',
    shortcut: 'بحث',
    openLabel: 'فتح البحث',
    inputLabel: 'البحث الشامل',
    clear: 'مسح البحث',
    cancel: 'إغلاق البحث',
    loading: 'جارٍ البحث…',
    recentSearches: 'عمليات بحث سابقة',
    clearAll: 'مسح الكل',
    removeRecent: 'إزالة « {query} » من عمليات البحث السابقة',
    noResultsTitle: 'لا توجد نتائج',
    noResultsBody: 'جرّب كلمة أخرى أو تصفّح الفئات.',
    exploreCategories: 'استكشف الخدمات',
    seeAllResults: 'عرض كل النتائج لـ « {query} »',
    groupPromotions: 'العروض',
    groupCategories: 'الفئات',
  },
};

const HOME = {
  fr: {
    heroCtaSearch: 'Trouver un prestataire',
    heroCtaPromotions: 'Voir les promotions',
    heroTrust: 'Prestataires vérifiés · Promotions réelles · Vie locale de Marrakech',
    heroPromoKicker: 'Offre du moment',
    sectionCategories: 'Explorer par catégorie',
    sectionCategoriesSubtitle: 'Les métiers disponibles à Marrakech, classés par famille.',
    exploreAllCategories: 'Explorer toutes les catégories',
    sectionBestRated: 'Les mieux notés',
    sectionBestRatedSubtitle: 'Classement établi à partir des avis des clients.',
    sectionAvailableNow: 'Disponibles maintenant',
    sectionAvailableNowSubtitle: 'Prestataires disponibles en ce moment.',
    sectionPromotionsSubtitle: 'Offres actives des prestataires de Marrakech.',
    sectionCommunitiesSubtitle: 'Rejoignez les groupes de votre quartier.',
    promoValidUntil: 'Jusqu’au {date}',
    categoryCount: '{count} métiers',
    heroStatProviders: 'prestataires vérifiés',
    heroStatPromotions: 'promotions actives',
    heroStatCategories: 'catégories de services',
  },
  en: {
    heroCtaSearch: 'Find a provider',
    heroCtaPromotions: 'See the promotions',
    heroTrust: 'Verified providers · Real promotions · Local life in Marrakech',
    heroPromoKicker: 'Offer of the moment',
    sectionCategories: 'Explore by category',
    sectionCategoriesSubtitle: 'The trades available in Marrakech, grouped by family.',
    exploreAllCategories: 'Explore all categories',
    sectionBestRated: 'Best rated',
    sectionBestRatedSubtitle: 'Ranked from customer reviews.',
    sectionAvailableNow: 'Available now',
    sectionAvailableNowSubtitle: 'Providers who are available right now.',
    sectionPromotionsSubtitle: 'Active offers from Marrakech providers.',
    sectionCommunitiesSubtitle: 'Join the groups of your neighbourhood.',
    promoValidUntil: 'Until {date}',
    categoryCount: '{count} services',
    heroStatProviders: 'verified providers',
    heroStatPromotions: 'active promotions',
    heroStatCategories: 'service categories',
  },
  ar: {
    heroCtaSearch: 'ابحث عن مزوّد',
    heroCtaPromotions: 'شاهد التخفيضات',
    heroTrust: 'مزوّدون موثّقون · تخفيضات حقيقية · الحياة المحلية في مراكش',
    heroPromoKicker: 'عرض اللحظة',
    sectionCategories: 'استكشف حسب الفئة',
    sectionCategoriesSubtitle: 'الحرف المتاحة في مراكش، مجمّعة حسب العائلة.',
    exploreAllCategories: 'استكشف كل الفئات',
    sectionBestRated: 'الأعلى تقييماً',
    sectionBestRatedSubtitle: 'الترتيب مبني على آراء العملاء.',
    sectionAvailableNow: 'متاحون الآن',
    sectionAvailableNowSubtitle: 'مزوّدون متاحون في هذه اللحظة.',
    sectionPromotionsSubtitle: 'عروض نشطة من مزوّدي مراكش.',
    sectionCommunitiesSubtitle: 'انضم إلى مجموعات حيك.',
    promoValidUntil: 'حتى {date}',
    categoryCount: '{count} خدمة',
    heroStatProviders: 'مزوّداً موثّقاً',
    heroStatPromotions: 'تخفيضات نشطة',
    heroStatCategories: 'فئة من الخدمات',
  },
};

const FOOTER = {
  fr: {
    explore: 'Explorer',
    account: 'Compte',
    language: 'Langue',
    community: 'Vie locale',
    becomeProvider: 'Devenir prestataire',
    contact: 'Contact',
    footerNote: 'La plateforme locale de Marrakech.',
  },
  en: {
    explore: 'Explore',
    account: 'Account',
    language: 'Language',
    community: 'Local life',
    becomeProvider: 'Become a provider',
    contact: 'Contact',
    footerNote: 'The local platform for Marrakech.',
  },
  ar: {
    explore: 'استكشف',
    account: 'الحساب',
    language: 'اللغة',
    community: 'الحياة المحلية',
    becomeProvider: 'كن مزوّدًا',
    contact: 'اتصل بنا',
    footerNote: 'المنصة المحلية لمراكش.',
  },
};

const SEARCH_EXTRA = {
  fr: { categoryCount: '{count} métiers' },
  en: { categoryCount: '{count} services' },
  ar: { categoryCount: '{count} خدمة' },
};

const PROMOTIONS = {
  fr: {
    title: 'Promotions',
    subtitle: 'Les offres actives des prestataires de Marrakech',
  },
  en: {
    title: 'Promotions',
    subtitle: 'The active offers from Marrakech providers',
  },
  ar: {
    title: 'التخفيضات',
    subtitle: 'العروض النشطة من مزوّدي مراكش',
  },
};

for (const locale of LOCALES) {
  const file = `src/messages/${locale}.json`;
  const raw = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(raw);
  const i = INDEX[locale];

  data.nav = { ...data.nav, ...NAV[locale] };
  data.nav.promotions = PROMOTIONS_NAV[locale];

  data.floatingSearch = { ...(data.floatingSearch ?? {}), ...FLOATING_SEARCH[locale] };
  data.home = { ...data.home, ...HOME[locale] };
  data.footer = { ...data.footer, ...FOOTER[locale] };
  data.search = { ...data.search, ...SEARCH_EXTRA[locale] };
  data.promotions = { ...data.promotions, ...PROMOTIONS[locale] };

  data.categories = {};
  for (const [key, values] of Object.entries(CATEGORY_KEYS)) {
    data.categories[key] = values[i];
  }

  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('updated', file);
}
