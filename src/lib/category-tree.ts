

export type SearchCategoryNode = {
  id: string;
  slug: string;
  labelKey?: string;
  labels?: Record<string, string>;
  children?: SearchCategoryNode[];
  type?: string;
  icon?: string;
  meta?: any;
};

const SERVICE_TREE: SearchCategoryNode = {
  id: 'root.services',
  slug: 'services',
  labels: { fr: 'Services', en: 'Services', ar: 'الخدمات' },
  type: 'services',
  children: [
    {
      id: 'services.technique',
      slug: 'technique',
      labels: { fr: 'Technique', en: 'Technical', ar: 'تقني' },
      children: [
        { id: 'services.electricien', slug: 'electricien', labels: { fr: 'Électricien', en: 'Electrician', ar: 'كهربائي' }, meta: { needsSpec: true, specs: [{ key: 'bien', labels: { fr: "Type d'intervention ou de bien", en: 'Type of intervention/property', ar: 'نوع التدخل أو العقار' }, options: ['Appartement','Maison','Immeuble','Automobile','Moto','Piscine'] }] } },
        { id: 'services.mecanicien', slug: 'mecanicien', labels: { fr: 'Mécanicien', en: 'Mechanic', ar: 'ميكانيكي' }, meta: { needsSpec: true, specs: [{ key: 'specialite', labels: { fr: 'Spécialité', en: 'Specialty', ar: 'التخصص' }, options: ['Automobile','Machines'] }] } },
        { id: 'services.soudeur', slug: 'soudeur', labels: { fr: 'Soudeur', en: 'Welder', ar: 'لحام' } },
        { id: 'services.reparateur-cycles', slug: 'reparateur-cycles', labels: { fr: 'Réparateur de cycles', en: 'Bicycle repair', ar: 'إصلاح الدراجات' } },
        { id: 'services.menuisier-aluminium', slug: 'menuisier-aluminium', labels: { fr: 'Menuisier aluminium', en: 'Aluminium carpenter', ar: 'نجار ألومنيوم' } },
        { id: 'services.menuisier-bois', slug: 'menuisier-bois', labels: { fr: 'Menuisier bois', en: 'Wood carpenter', ar: 'نجار خشب' } },
        { id: 'services.carrossier', slug: 'carrossier', labels: { fr: 'Carrossier-tôlier', en: 'Bodyworker/panel beater', ar: 'سمكري سيارات' }, meta: { needsSpec: true, specs: [{ key: 'vehicule', labels: { fr: 'Type de véhicule', en: 'Vehicle type', ar: 'نوع المركبة' }, options: ['Automobile','Moto'] }] } },
        { id: 'services.tapissier', slug: 'tapissier', labels: { fr: 'Tapissier', en: 'Upholsterer', ar: 'منجد' }, meta: { needsSpec: true, specs: [{ key: 'support', labels: { fr: 'Support', en: 'Support', ar: 'دعم' }, options: ['Automobile','Fauteuil'] }] } },
        { id: 'services.couturier', slug: 'couturier', labels: { fr: 'Couturier', en: 'Tailor', ar: 'خياط' }, meta: { needsSpec: true, specs: [{ key: 'specialite', labels: { fr: 'Spécialité', en: 'Specialty', ar: 'التخصص' }, options: ['Vêtements traditionnels pour homme','Vêtements traditionnels pour femme','Retouches et travaux de tailleur','Costumes'] }] } },
        { id: 'services.styliste', slug: 'styliste', labels: { fr: 'Styliste', en: 'Stylist', ar: 'مصمم أزياء' }, meta: { needsSpec: true, specs: [{ key: 'specialite', labels: { fr: 'Spécialité', en: 'Specialty', ar: 'التخصص' }, options: ['Homme','Femme','Enfant','Sacs','Vestes','Accessoires pour animaux'] }] } },
        { id: 'services.resiniste', slug: 'resiniste', labels: { fr: 'Résiniste', en: 'Resin worker', ar: 'عامل الراتنج' }, meta: { needsSpec: true, specs: [{ key: 'type', labels: { fr: 'Type de prestation', en: 'Service type', ar: 'نوع الخدمة' }, options: ['Création en résine','Réparation en résine'] }], conditional: [{ when: { specKey: 'type', value: 'Réparation en résine' }, nextSpec: { key: 'objet', labels: { fr: 'Objet à réparer', en: 'Item to repair', ar: 'عنصر الإصلاح' }, options: ['Réparation de résine automobile','Réparation de résine moto','Réparation de planche de surf'] } }] } },
        { id: 'services.serrurier', slug: 'serrurier', labels: { fr: 'Serrurier', en: 'Locksmith', ar: 'قفل' }, meta: { needsSpec: true, specs: [{ key: 'type', labels: { fr: 'Type de prestation', en: 'Service type', ar: 'نوع الخدمة' }, options: ['Serrurerie de porte métallique','Serrurerie de porte en bois','Serrure connectée ou intelligente','Serrurerie automobile','Serrurerie moto','Systèmes de sécurité','Coffres-forts'] }] } },
        { id: 'services.peintre', slug: 'peintre', labels: { fr: 'Peintre', en: 'Painter', ar: 'دهان' }, meta: { needsSpec: true, specs: [{ key: 'specialite', labels: { fr: 'Spécialité', en: 'Specialty', ar: 'التخصص' }, options: ['Peinture intérieure','Peinture extérieure','Peinture d\'immeubles','Peinture automobile','Peinture moto','Étanchéité et peinture de terrasse'] }] } },
        { id: 'services.plombier', slug: 'plombier', labels: { fr: 'Plombier', en: 'Plumber', ar: 'سباك' } },
      ],
    },
  ],
};

export const SEARCH_CATEGORIES: SearchCategoryNode[] = [
  SERVICE_TREE,
  {
    id: 'root.immobilier',
    slug: 'immobilier',
    labels: { fr: 'Immobilier', en: 'Real Estate', ar: 'عقارات' },
    type: 'real_estate',
    children: [
      {
        id: 'immobilier.transaction',
        slug: 'transaction',
        labels: { fr: 'Type de transaction', en: 'Transaction type', ar: 'نوع المعاملة' },
        children: [
          { id: 'immobilier.acheter', slug: 'acheter', labels: { fr: 'Acheter', en: 'Buy', ar: 'شراء' } },
          { id: 'immobilier.louer', slug: 'louer', labels: { fr: 'Louer', en: 'Rent', ar: 'إيجار' } },
        ],
      },
      {
        id: 'immobilier.type',
        slug: 'type-bien',
        labels: { fr: 'Type de bien', en: 'Property type', ar: 'نوع العقار' },
        children: [
          { id: 'immobilier.appartement', slug: 'appartement', labels: { fr: 'Appartement', en: 'Apartment', ar: 'شقة' } },
          { id: 'immobilier.maison', slug: 'maison', labels: { fr: 'Maison', en: 'House', ar: 'منزل' } },
          { id: 'immobilier.villa', slug: 'villa', labels: { fr: 'Villa', en: 'Villa', ar: 'فيلا' } },
          { id: 'immobilier.terrain', slug: 'terrain', labels: { fr: 'Terrain', en: 'Land', ar: 'أرض' } },
          { id: 'immobilier.riad', slug: 'riad', labels: { fr: 'Riad', en: 'Riad', ar: 'رياض' } },
        ],
      },
    ],
  },
  {
    id: 'root.mobility',
    slug: 'mobilite-vehicules',
    labels: { fr: 'Mobilité et véhicules', en: 'Mobility & vehicles', ar: 'التنقل والمركبات' },
    type: 'mobility',
    children: [
      { id: 'mobility.type', slug: 'type', labels: { fr: 'Type', en: 'Type', ar: 'نوع' }, children: [
        { id: 'mobility.voiture', slug: 'voiture', labels: { fr: 'Voiture', en: 'Car', ar: 'سيارة' } },
        { id: 'mobility.moto', slug: 'moto', labels: { fr: 'Moto', en: 'Motorcycle', ar: 'دراجة نارية' } },
        { id: 'mobility.velo', slug: 'velo', labels: { fr: 'Vélo', en: 'Bike', ar: 'دراجة' } },
      ]},
      { id: 'mobility.action', slug: 'action', labels: { fr: 'Action ou besoin', en: 'Action/need', ar: 'إجراء أو حاجة' }, children: [
        { id: 'mobility.acheter', slug: 'acheter', labels: { fr: 'Acheter', en: 'Buy', ar: 'شراء' } },
        { id: 'mobility.louer', slug: 'louer', labels: { fr: 'Louer', en: 'Rent', ar: 'إيجار' } },
        { id: 'mobility.reparateur', slug: 'trouver-reparateur', labels: { fr: 'Trouver un réparateur', en: 'Find a repairer', ar: 'البحث عن مصلح' } },
        { id: 'mobility.pieces', slug: 'pieces', labels: { fr: 'Trouver des pièces', en: 'Find parts', ar: 'البحث عن قطع الغيار' } },
      ]},
    ],
  },
  {
    id: 'root.events',
    slug: 'evenements',
    labels: { fr: 'Événements', en: 'Events', ar: 'فعاليات' },
    type: 'events',
    children: [
      { id: 'events.besoin', slug: 'besoin', labels: { fr: 'Type de besoin', en: 'Need type', ar: 'نوع الحاجة' }, children: [
        { id: 'events.sonorisation', slug: 'sonorisation', labels: { fr: 'Éclairage et sonorisation', en: 'Lighting & sound', ar: 'الإضاءة والصوت' } },
        { id: 'events.decoration', slug: 'decoration', labels: { fr: 'Décoration', en: 'Decoration', ar: 'ديكور' } },
        { id: 'events.photographe', slug: 'photographe', labels: { fr: 'Photographe', en: 'Photographer', ar: 'مصور' } },
        { id: 'events.negafa', slug: 'negafa', labels: { fr: 'Negafa', en: 'Negafa', ar: 'نقافة' } },
        { id: 'events.lieu', slug: 'lieu-reception', labels: { fr: 'Lieu de réception', en: 'Reception venue', ar: 'مكان الاستقبال' } },
      ]},
      { id: 'events.decoration-occasion', slug: 'decoration-occasion', labels: { fr: 'Occasion', en: 'Occasion', ar: 'مناسبة' }, children: [
        { id: 'events.fiançailles', slug: 'fiancailles', labels: { fr: 'Fiançailles', en: 'Engagement', ar: 'خطوبة' } },
        { id: 'events.mariage', slug: 'mariage', labels: { fr: 'Mariage', en: 'Wedding', ar: 'زفاف' } },
        { id: 'events.naissance', slug: 'naissance', labels: { fr: 'Naissance', en: 'Birth', ar: 'ولادة' } },
      ]},
      { id: 'events.lieu-type', slug: 'lieu-type', labels: { fr: 'Type', en: 'Type', ar: 'نوع' }, children: [
        { id: 'events.salle', slug: 'salle-fetes', labels: { fr: 'Salle des fêtes', en: 'Party hall', ar: 'قاعة الحفلات' } },
        { id: 'events.villa-evenement', slug: 'villa-evenement', labels: { fr: 'Villa pour événements', en: 'Villa for events', ar: 'فيلا للفعاليات' } },
        { id: 'events.chapiteau', slug: 'chapiteau', labels: { fr: 'Chapiteau de mariage', en: 'Wedding marquee', ar: 'خيمة الزفاف' } },
      ]},
    ],
  },
  {
    id: 'root.communities',
    slug: 'communautes',
    labels: { fr: 'Communautés', en: 'Communities', ar: 'المجتمعات' },
    type: 'communities',
    children: [
      { id: 'communities.partenaires', slug: 'partenaires-activite', labels: { fr: "Partenaires d'activité", en: 'Activity partners', ar: 'شركاء النشاط' }, children: [
        { id: 'communities.demenagement', slug: 'aide-demenagement', labels: { fr: 'Aide au déménagement', en: 'Moving help', ar: 'مساعدة في النقل' } },
        { id: 'communities.entraînement', slug: 'partenaire-entrainement', labels: { fr: "Recherche d'un partenaire d'entraînement", en: 'Find a workout partner', ar: 'البحث عن شريك تمرين' } },
        { id: 'communities.linguistique', slug: 'partenaire-linguistique', labels: { fr: 'Recherche d\'un partenaire linguistique', en: 'Language exchange partner', ar: 'شريك تبادل لغوي' } },
        { id: 'communities.football', slug: 'tournoi-football', labels: { fr: 'Tournoi de football', en: 'Football tournament', ar: 'بطولة كرة القدم' } },
        { id: 'communities.basketball', slug: 'tournoi-basketball', labels: { fr: 'Tournoi de basketball', en: 'Basketball tournament', ar: 'بطولة كرة السلة' } },
        { id: 'communities.tennis', slug: 'partenaire-tennis', labels: { fr: "Recherche d'un partenaire de tennis", en: 'Tennis partner', ar: 'شريك تنس' } },
        { id: 'communities.velo', slug: 'partenaire-velo', labels: { fr: "Recherche d'un compagnon de vélo", en: 'Cycling partner', ar: 'شريك ركوب الدراجات' } },
      ]},
      { id: 'communities.garde', slug: 'garde-enfants', labels: { fr: "Garde d'enfants", en: 'Childcare', ar: 'رعاية الأطفال' }, children: [
        { id: 'communities.garderie', slug: 'garderie', labels: { fr: 'Garderie', en: 'Daycare', ar: 'حضانة' } },
        { id: 'communities.parc-jeux', slug: 'parc-jeux', labels: { fr: 'Parc de jeux', en: 'Playground', ar: 'ملعب أطفال' } },
        { id: 'communities.garde-domicile', slug: 'garde-domicile', labels: { fr: "Service de garde d'enfants à domicile", en: 'In-home childcare', ar: 'رعاية منزلية للأطفال' } },
      ]},
      { id: 'communities.classes', slug: 'classes-ateliers', labels: { fr: 'Classes et ateliers', en: 'Classes & workshops', ar: 'دروس وورش عمل' }, children: [
        { id: 'communities.jardinage', slug: 'cours-jardinage', labels: { fr: 'Cours de jardinage gratuit', en: 'Free gardening course', ar: 'دورة زراعة مجانية' } },
        { id: 'communities.fiscale', slug: 'cours-preparation-fiscale', labels: { fr: 'Cours de préparation fiscale', en: 'Tax preparation course', ar: 'دورة إعداد الضرائب' } },
        { id: 'communities.cuisine', slug: 'cours-cuisine-marocaine', labels: { fr: 'Cours de cuisine marocaine', en: 'Moroccan cooking class', ar: 'دورة الطبخ المغربي' } },
        { id: 'communities.poterie', slug: 'atelier-poterie', labels: { fr: 'Atelier de création de poterie', en: 'Pottery workshop', ar: 'ورشة الفخار' } },
        { id: 'communities.parfum', slug: 'atelier-parfum', labels: { fr: 'Atelier de création de parfum personnalisé', en: 'Custom perfume workshop', ar: 'ورشة العطور المخصصة' } },
      ]},
      { id: 'communities.evenements-com', slug: 'evenements', labels: { fr: 'Événements', en: 'Events', ar: 'فعاليات' }, children: [
        { id: 'communities.conferences', slug: 'conferences', labels: { fr: 'Conférences', en: 'Conferences', ar: 'مؤتمرات' } },
        { id: 'communities.theatre', slug: 'theatre', labels: { fr: 'Théâtre', en: 'Theater', ar: 'مسرح' } },
        { id: 'communities.encheres', slug: 'ventes-encheres', labels: { fr: 'Ventes aux enchères', en: 'Auctions', ar: 'مزادات' } },
        { id: 'communities.annuels', slug: 'evenements-annuels', labels: { fr: 'Événements annuels', en: 'Annual events', ar: 'فعاليات سنوية' } },
        { id: 'communities.golf', slug: 'festival-golf', labels: { fr: 'Festival annuel de golf', en: 'Annual golf festival', ar: 'مهرجان الجولف السنوي' } },
        { id: 'communities.airshow', slug: 'marrakech-air-show', labels: { fr: 'Marrakech Air Show', en: 'Marrakech Air Show', ar: 'معرض مراكش الجوي' } },
      ]},
    ],
  },
  {
    id: 'root.activities',
    slug: 'activites-sorties',
    labels: { fr: 'Activités et sorties', en: 'Activities & outings', ar: 'الأنشطة والرحلات' },
    type: 'activities',
    children: [],
  },
  {
    id: 'root.places',
    slug: 'endroits-visiter',
    labels: { fr: 'Endroits à visiter', en: 'Places to visit', ar: 'أماكن للزيارة' },
    type: 'places',
    children: [
      { id: 'places.jardin', slug: 'jardin-nature', labels: { fr: 'Jardin et nature', en: 'Garden & nature', ar: 'حدائق وطبيعة' }, children: [
        { id: 'places.majorelle', slug: 'jardin-majorelle', labels: { fr: 'Jardin Majorelle', en: 'Majorelle Garden', ar: 'حديقة ماجوريل' } },
        { id: 'places.menara', slug: 'jardin-menara', labels: { fr: 'Jardin de la Ménara', en: 'Menara Gardens', ar: 'حدائق المنارة' } },
        { id: 'places.agdal', slug: 'jardins-agdal', labels: { fr: 'Jardins de l\'Agdal', en: 'Agdal Gardens', ar: 'حدائق أكدال' } },
        { id: 'places.secret', slug: 'jardin-secret', labels: { fr: 'Jardin Secret', en: 'Secret Garden', ar: 'الحديقة السرية' } },
        { id: 'places.arsat', slug: 'cyber-park-arsat', labels: { fr: 'Cyber Park Arsat Moulay Abdeslam', en: 'Cyber Park Arsat Moulay Abdeslam', ar: 'حديقة أرسات مولاي عبد السلام' } },
        { id: 'places.palmeraie', slug: 'palmeraie-marrakech', labels: { fr: 'Palmeraie de Marrakech', en: 'Palm Grove of Marrakech', ar: 'نخيل مراكش' } },
        { id: 'places.lallahhasna', slug: 'parc-lalla-hasna', labels: { fr: 'Parc Lalla Hasna', en: 'Lalla Hasna Park', ar: 'حديقة للا حسناء' } },
        { id: 'places.oliveraie', slug: 'oliveraie-menara', labels: { fr: 'Oliveraie de la Ménara', en: 'Menara Olive Grove', ar: 'بستان الزيتون بالمنارة' } },
      ]},
      { id: 'places.monuments', slug: 'monuments-patrimoine', labels: { fr: 'Monuments historiques et patrimoine', en: 'Historic monuments & heritage', ar: 'المعالم التاريخية والتراث' }, children: [
        { id: 'places.koutoubia', slug: 'koutoubia', labels: { fr: 'Koutoubia', en: 'Koutoubia', ar: 'الكوتوبية' } },
        { id: 'places.benyoussef', slug: 'medersa-ben-youssef', labels: { fr: 'Médersa Ben Youssef', en: 'Ben Youssef Madrasa', ar: 'مدرسة بن يوسف' } },
        { id: 'places.bahia', slug: 'palais-bahia', labels: { fr: 'Palais de la Bahia', en: 'Bahia Palace', ar: 'قصر الباهية' } },
        { id: 'places.elbadii', slug: 'palais-el-badii', labels: { fr: 'Palais El Badiî', en: 'El Badi Palace', ar: 'قصر البديع' } },
        { id: 'places.saadiens', slug: 'tombeaux-sadiens', labels: { fr: 'Tombeaux Saadiens', en: 'Saadian Tombs', ar: 'ضريح السعديين' } },
        { id: 'places.babagnaou', slug: 'bab-agnaou', labels: { fr: 'Porte Bab Agnaou', en: 'Bab Agnaou Gate', ar: 'باب اكناو' } },
        { id: 'places.babboujloud', slug: 'bab-boujloud', labels: { fr: 'Bab Boujloud', en: 'Bab Boujloud', ar: 'باب بوجلود' } },
      ]},
      { id: 'places.musees', slug: 'musees-culture', labels: { fr: 'Musées et culture', en: 'Museums & culture', ar: 'متاحف وثقافة' }, children: [
        { id: 'places.ysl', slug: 'musee-ysl', labels: { fr: 'Musée Yves Saint Laurent Marrakech', en: 'Yves Saint Laurent Museum Marrakech', ar: 'متحف إيف سان لوران مراكش' } },
        { id: 'places.macaal', slug: 'musee-macaal', labels: { fr: 'Musée MACAAL', en: 'MACAAL Museum', ar: 'متحف ماكال' } },
        { id: 'places.tiskiwin', slug: 'musee-tiskiwin', labels: { fr: 'Musée Tiskiwin', en: 'Tiskiwin Museum', ar: 'متحف تيسكيوين' } },
      ]},
      { id: 'places.excursions', slug: 'excursions', labels: { fr: 'Excursions autour de la ville', en: 'Excursions around the city', ar: 'رحلات حول المدينة' }, children: [
        { id: 'places.agafay', slug: 'desert-agafay', labels: { fr: 'Désert d\'Agafay', en: 'Agafay Desert', ar: 'صحراء أكافاي' } },
        { id: 'places.ourika', slug: 'vallee-ourika', labels: { fr: 'Vallée de l\'Ourika', en: 'Ourika Valley', ar: 'وادي أوريكا' } },
        { id: 'places.ouzoud', slug: 'cascades-ouzoud', labels: { fr: 'Cascades d\'Ouzoud', en: 'Ouzoud Falls', ar: 'شلالات أوزود' } },
        { id: 'places.imlil', slug: 'imlil', labels: { fr: 'Imlil', en: 'Imlil', ar: 'إمليل' } },
        { id: 'places.aitbenhaddou', slug: 'ait-benhaddou', labels: { fr: 'Aït Ben Haddou', en: 'Aït Ben Haddou', ar: 'آيت بن حدو' } },
      ]},
      { id: 'places.experiences', slug: 'experiences', labels: { fr: 'Expériences à vivre', en: 'Experiences', ar: 'تجارب للعيش' }, children: [
        { id: 'places.hammam', slug: 'hammam-traditionnel', labels: { fr: 'Hammam marocain traditionnel', en: 'Traditional Moroccan hammam', ar: 'حمام مغربي تقليدي' } },
        { id: 'places.fantasia', slug: 'spectacle-fantasia', labels: { fr: 'Spectacle de fantasia', en: 'Fantasia show', ar: 'عرض الفانتازيا' } },
        { id: 'places.diner-desert', slug: 'diner-desert-agafay', labels: { fr: 'Dîner dans le désert d\'Agafay', en: 'Dinner in Agafay desert', ar: 'عشاء في صحراء أكافاي' } },
        { id: 'places.balloon', slug: 'montgolfiere', labels: { fr: 'Vol en montgolfière', en: 'Hot air balloon', ar: 'بالون هوائي' } },
      ]},
      { id: 'places.autres', slug: 'autres', labels: { fr: 'Autres', en: 'Others', ar: 'أخرى' }, children: [
        { id: 'places.cafes', slug: 'cafes', labels: { fr: 'Cafés', en: 'Cafes', ar: 'مقاهي' } },
        { id: 'places.restaurants', slug: 'restaurants', labels: { fr: 'Restaurants', en: 'Restaurants', ar: 'مطاعم' } },
        { id: 'places.parcs', slug: 'parcs', labels: { fr: 'Parcs', en: 'Parks', ar: 'حدائق' } },
        { id: 'places.piscines', slug: 'piscines', labels: { fr: 'Piscines', en: 'Pools', ar: 'مسابح' } },
        { id: 'places.hotels', slug: 'hotels', labels: { fr: 'Hôtels', en: 'Hotels', ar: 'فنادق' } },
        { id: 'places.salles-sport', slug: 'salles-sport', labels: { fr: 'Salles de sport', en: 'Gyms', ar: 'صالات رياضية' }, children: [
          { id: 'places.karate', slug: 'karate', labels: { fr: 'Karaté', en: 'Karate', ar: 'كاراتيه' } },
          { id: 'places.yoga', slug: 'yoga', labels: { fr: 'Yoga', en: 'Yoga', ar: 'يوغا' } },
          { id: 'places.musculation', slug: 'musculation', labels: { fr: 'Musculation', en: 'Fitness', ar: 'لياقة بدنية' } },
        ]},
      ]},
    ],
  },
  {
    id: 'root.vendre',
    slug: 'a-vendre',
    labels: { fr: 'À vendre', en: 'For sale', ar: 'للبيع' },
    type: 'marketplace',
    children: [
      { id: 'vendre.voitures', slug: 'voitures', labels: { fr: 'Voitures', en: 'Cars', ar: 'سيارات' }, children: [
        { id: 'vendre.voitures-annonces', slug: 'voitures-annonces', labels: { fr: 'Voitures', en: 'Cars', ar: 'سيارات' } },
        { id: 'vendre.voitures-pieces', slug: 'pieces-voiture', labels: { fr: 'Pièces de voiture', en: 'Car parts', ar: 'قطع غيار السيارات' } },
        { id: 'vendre.voitures-roues', slug: 'roues-pneus-voiture', labels: { fr: 'Roues et pneus de voiture', en: 'Wheels & tires', ar: 'إطارات وعجلات' } },
      ]},
      { id: 'vendre.motos', slug: 'motos', labels: { fr: 'Motos', en: 'Motorcycles', ar: 'دراجات نارية' }, children: [
        { id: 'vendre.motos-annonces', slug: 'motos-annonces', labels: { fr: 'Motos', en: 'Motorcycles', ar: 'دراجات نارية' } },
        { id: 'vendre.motos-pieces', slug: 'pieces-moto', labels: { fr: 'Pièces de moto', en: 'Motorcycle parts', ar: 'قطع غيار الدراجات النارية' } },
        { id: 'vendre.motos-roues', slug: 'roues-pneus-moto', labels: { fr: 'Roues et pneus de moto', en: 'Motorcycle wheels & tires', ar: 'إطارات ودراجات نارية' } },
      ]},
      { id: 'vendre.velos', slug: 'velos', labels: { fr: 'Vélos', en: 'Bikes', ar: 'دراجات' }, children: [
        { id: 'vendre.velos-annonces', slug: 'velos-annonces', labels: { fr: 'Vélos', en: 'Bikes', ar: 'دراجات' } },
        { id: 'vendre.velos-pieces', slug: 'pieces-velo', labels: { fr: 'Pièces de vélo', en: 'Bike parts', ar: 'قطع غيار الدراجات' } },
        { id: 'vendre.velos-roues', slug: 'roues-pneus-velo', labels: { fr: 'Roues et pneus de vélo', en: 'Bike wheels & tires', ar: 'إطارات الدراجات' } },
      ]},
      { id: 'vendre.camions', slug: 'camions-remorques', labels: { fr: 'Camions et remorques', en: 'Trucks & trailers', ar: 'الشاحنات والمقطورات' }, children: [
        { id: 'vendre.camions-annonces', slug: 'camions', labels: { fr: 'Camions', en: 'Trucks', ar: 'شاحنات' } },
        { id: 'vendre.remorques', slug: 'remorques', labels: { fr: 'Remorques', en: 'Trailers', ar: 'مقطورات' } },
        { id: 'vendre.camions-pieces', slug: 'pieces-accessoires', labels: { fr: 'Pièces et accessoires', en: 'Parts & accessories', ar: 'قطع الغيار والإكسسوارات' } },
      ]},
    ],
  },
];

export function getCategoryLabel(node: SearchCategoryNode, locale: string) {
  if (node.labels && node.labels[locale]) return node.labels[locale];
  if (node.labels && node.labels.fr) return node.labels.fr;
  return node.slug;
}
