/**
 * Builds the enriched Places catalogue used by /[locale]/places.
 *
 * The 75 destinations are the ones the Places page has always shown (the
 * taxonomy's “Endroits à visiter” branches). For each one we look up the
 * matching Wikipedia article to obtain verified coordinates, a description in
 * French / English / Arabic and real photography from Wikimedia Commons.
 *
 * Run with: node scripts/build-places-catalogue.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ENTRIES = [
  // Jardins et nature
  { name: 'Jardin Majorelle', category: 'jardin', city: 'Marrakech' },
  { name: 'Jardin de la Ménara', category: 'jardin', city: 'Marrakech' },
  { name: "Jardins de l'Agdal", category: 'jardin', city: 'Marrakech' },
  { name: 'Le Jardin Secret', category: 'jardin', city: 'Marrakech' },
  { name: 'Cyber Park Arsat Moulay Abdeslam', category: 'jardin', city: 'Marrakech' },
  { name: 'Palmeraie de Marrakech', category: 'jardin', city: 'Marrakech' },
  { name: 'Parc Lalla Hasna', category: 'jardin', city: 'Marrakech' },
  { name: "Oliveraie de la Ménara", category: 'jardin', city: 'Marrakech' },

  // Monuments historiques et patrimoine
  { name: 'Koutoubia', category: 'monuments', city: 'Marrakech' },
  { name: 'Médersa Ben Youssef', category: 'monuments', city: 'Marrakech' },
  { name: 'Palais de la Bahia', category: 'monuments', city: 'Marrakech' },
  { name: 'Palais El Badiî', category: 'monuments', city: 'Marrakech' },
  { name: 'Tombeaux Saadiens', category: 'monuments', city: 'Marrakech' },
  { name: 'Bab Agnaou', category: 'monuments', city: 'Marrakech' },
  { name: 'Bab Boujloud', category: 'monuments', city: 'Fès' },
  { name: 'Musée de Marrakech', category: 'monuments', city: 'Marrakech' },
  { name: 'Musée de Mouassine', category: 'monuments', city: 'Marrakech' },
  { name: 'Dar El Bacha', category: 'monuments', city: 'Marrakech' },
  { name: 'Maison de la Photographie', category: 'monuments', city: 'Marrakech' },
  { name: 'Musée Dar Si Saïd', category: 'monuments', city: 'Marrakech' },
  { name: 'Musée de la Femme', category: 'monuments', city: 'Marrakech' },
  { name: 'Souk Semmarine', category: 'monuments', city: 'Marrakech' },
  { name: 'Souk des Teinturiers', category: 'monuments', city: 'Marrakech' },
  { name: 'Souk des Bijoutiers', category: 'monuments', city: 'Marrakech' },
  { name: 'Souk Haddadine', category: 'monuments', city: 'Marrakech' },
  { name: 'Place des Épices', category: 'monuments', city: 'Marrakech' },
  { name: 'Place des Ferblantiers', category: 'monuments', city: 'Marrakech' },
  { name: 'Quartier de la Kasbah', category: 'monuments', city: 'Marrakech' },
  { name: 'Quartier de Mouassine', category: 'monuments', city: 'Marrakech' },
  { name: 'Quartier Mellah', category: 'monuments', city: 'Marrakech' },
  { name: 'Synagogue Lazama', category: 'monuments', city: 'Marrakech' },

  // Musées et culture
  { name: 'Musée Yves Saint Laurent Marrakech', category: 'musees', city: 'Marrakech' },
  { name: 'Musée Mohammed VI pour la civilisation de l’eau au Maroc', category: 'musees', city: 'Marrakech' },
  { name: 'Musée des Confluences – Dar El Bacha', category: 'musees', city: 'Marrakech' },
  { name: 'Musée de Marrakech', category: 'musees', city: 'Marrakech' },
  { name: 'Maison de la Photographie', category: 'musees', city: 'Marrakech' },
  { name: 'Musée Dar Si Saïd', category: 'musees', city: 'Marrakech' },
  { name: 'Musée de la Femme de Marrakech', category: 'musees', city: 'Marrakech' },
  { name: 'Musée MACAAL', category: 'musees', city: 'Marrakech' },
  { name: 'Musée Tiskiwin', category: 'musees', city: 'Marrakech' },

  // Excursions et environs
  { name: "Désert d'Agafay", category: 'excursions', city: 'Marrakech' },
  { name: "Vallée de l'Ourika", category: 'excursions', city: 'Marrakech' },
  { name: 'Setti Fatma', category: 'excursions', city: 'Marrakech' },
  { name: "Cascades d'Ouzoud", category: 'excursions', city: 'Marrakech' },
  { name: 'Lac Lalla Takerkoust', category: 'excursions', city: 'Marrakech' },
  { name: 'Plateau du Kik', category: 'excursions', city: 'Marrakech' },
  { name: 'Imlil', category: 'excursions', city: 'Marrakech' },
  { name: 'Parc national du Toubkal', category: 'excursions', city: 'Marrakech' },
  { name: 'Asni', category: 'excursions', city: 'Marrakech' },
  { name: 'Ouirgane', category: 'excursions', city: 'Marrakech' },
  { name: 'Aït Ben Haddou', category: 'excursions', city: 'Ouarzazate' },
  { name: 'Ouarzazate', category: 'excursions', city: 'Ouarzazate' },
  { name: 'Vallée du Zat', category: 'excursions', city: 'Marrakech' },
  { name: 'Palmeraie de Marrakech', category: 'excursions', city: 'Marrakech' },
  { name: 'Circuit en quad dans la Palmeraie', category: 'excursions', city: 'Marrakech' },
  { name: 'Balade à dos de chameau', category: 'excursions', city: 'Marrakech' },
  { name: 'Vol en montgolfière autour de Marrakech', category: 'excursions', city: 'Marrakech' },
  { name: 'Excursion en buggy', category: 'excursions', city: 'Marrakech' },

  // Expériences à faire
  { name: 'Dîner traditionnel marocain', category: 'experiences', city: 'Marrakech' },
  { name: 'Spectacle de fantasia', category: 'experiences', city: 'Marrakech' },
  { name: 'Hammam marocain traditionnel', category: 'experiences', city: 'Marrakech' },
  { name: 'Rooftop avec vue sur la médina', category: 'experiences', city: 'Marrakech' },
  { name: 'Coucher de soleil à Jemaa el-Fna', category: 'experiences', city: 'Marrakech' },
  { name: "Dîner dans le désert d'Agafay", category: 'experiences', city: 'Marrakech' },
  { name: 'Balade en calèche', category: 'experiences', city: 'Marrakech' },
  { name: 'Spa traditionnel marocain', category: 'experiences', city: 'Marrakech' },
  { name: 'Dégustation de thé à la menthe', category: 'experiences', city: 'Marrakech' },
  { name: 'Découverte de la cuisine de rue de la médina', category: 'experiences', city: 'Marrakech' },
  { name: 'Balade nocturne dans la médina', category: 'experiences', city: 'Marrakech' },

  // Établissements et loisirs
  { name: 'Cafés', category: 'autres', city: 'Marrakech' },
  { name: 'Restaurants', category: 'autres', city: 'Marrakech' },
  { name: 'Parcs', category: 'autres', city: 'Marrakech' },
  { name: 'Piscines', category: 'autres', city: 'Marrakech' },
  { name: 'Hôtels', category: 'autres', city: 'Marrakech' },
  { name: 'Salles de sport (Karaté, Yoga, Musculation)', category: 'autres', city: 'Marrakech' },
];

/** Correct Wikipedia article titles where the destination name differs. */
const WIKI_TITLES = {
  'Jardin de la Ménara': 'Ménara (jardin)',
  'Jardins de l\'Agdal': 'Jardins de l\'Agdal',
  'Cyber Park Arsat Moulay Abdeslam': 'Jardin Arsat Moulay Abdessalam',
  'Palais El Badiî': 'Palais El Badi',
  'Dar El Bacha': 'Dar el Bacha',
  'Maison de la Photographie': 'Maison de la photographie de Marrakech',
  'Souk Semmarine': 'Souks de Marrakech',
  'Souk des Teinturiers': 'Souks de Marrakech',
  'Souk des Bijoutiers': 'Souks de Marrakech',
  'Souk Haddadine': 'Souks de Marrakech',
  'Place des Épices': 'Souks de Marrakech',
  'Quartier de la Kasbah': 'Kasbah de Marrakech',
  'Quartier de Mouassine': 'Mosquée El Mouassine',
  'Quartier Mellah': 'Mellah de Marrakech',
  'Oliveraie de la Ménara': 'Ménara (jardin)',
  'Synagogue Lazama': 'Synagogue Salat Al Azama (Marrakech)',
  'Musée Yves Saint Laurent Marrakech': 'Musée Yves-Saint-Laurent de Marrakech',
  'Musée Mohammed VI pour la civilisation de l’eau au Maroc': 'Musée Aman',
  'Musée des Confluences – Dar El Bacha': 'Dar el Bacha',
  'Musée MACAAL': 'Musée d\'Art contemporain africain Al-Maaden',
  'Musée Tiskiwin': 'Musée Bert-Flint',
  'Aït Ben Haddou': 'Ksar d\'Aït-ben-Haddou',
  'Lac Lalla Takerkoust': 'Lalla Takerkoust (ville)',
  'Vallée du Zat': 'Zat (rivière)',
  "Désert d'Agafay": 'Désert d\'Agafay',
  'Palmeraie de Marrakech': 'Palmeraie de Marrakech',
};

/**
 * Activities and a few places do not have usable coordinates on Wikipedia.
 * These anchors are the real place / neighbourhood where the activity happens,
 * so the marker sits where a visitor would actually go.
 */
const COORDINATES = {
  'Le Jardin Secret': [31.630875, -7.990053],
  'Parc Lalla Hasna': [31.623146, -7.995005],
  'Oliveraie de la Ménara': [31.6085, -8.0225],
  'Souk Semmarine': [31.627915, -7.988092],
  'Souk des Teinturiers': [31.630212, -7.988606],
  'Souk des Bijoutiers': [31.6286, -7.9887],
  'Souk Haddadine': [31.630729, -7.987834],
  'Place des Épices': [31.628868, -7.987206],
  'Place des Ferblantiers': [31.619807, -7.984871],
  'Quartier de la Kasbah': [31.6188, -7.9848],
  'Quartier de Mouassine': [31.6307, -7.9894],
  'Quartier Mellah': [31.6216, -7.9842],
  'Plateau du Kik': [31.4167, -7.9167],
  'Vallée du Zat': [31.3167, -7.6667],
  "Désert d'Agafay": [31.4374, -8.1436],
  'Aït Ben Haddou': [31.0472, -7.1319],
  'Circuit en quad dans la Palmeraie': [31.6693, -7.9536],
  'Balade à dos de chameau': [31.6555, -7.9634],
  'Vol en montgolfière autour de Marrakech': [31.6628, -7.9577],
  'Excursion en buggy': [31.6693, -7.9536],
  'Dîner traditionnel marocain': [31.6291, -7.9878],
  'Spectacle de fantasia': [31.6519, -7.9817],
  'Hammam marocain traditionnel': [31.6297, -7.9889],
  'Rooftop avec vue sur la médina': [31.6299, -7.9873],
  'Coucher de soleil à Jemaa el-Fna': [31.6258, -7.9891],
  "Dîner dans le désert d'Agafay": [31.4374, -8.1436],
  'Balade en calèche': [31.6255, -7.9895],
  'Spa traditionnel marocain': [31.6306, -7.9906],
  'Dégustation de thé à la menthe': [31.6298, -7.9872],
  'Découverte de la cuisine de rue de la médina': [31.6271, -7.9888],
  'Balade nocturne dans la médina': [31.6265, -7.9885],
};

/**
 * Editorial copy for destinations that have no Wikipedia article.
 * Written in the three site languages so every viewer has real content.
 */
const CUSTOM_COPY = {
  'Le Jardin Secret': {
    fr: "Au cœur de la médina, Le Jardin Secret réunit deux jardins historiques restaurés avec un soin rare : un jardin islamique structuré par l'eau et un jardin exotique luxuriant. Une pause de fraîcheur et de calme, ponctuée de vues sur les terrasses de Marrakech.",
    en: 'In the heart of the medina, Le Jardin Secret brings together two historic gardens restored with rare care: an Islamic garden shaped by water and a lush exotic garden. A cool, quiet pause with views over the rooftops of Marrakech.',
    ar: 'في قلب المدينة القديمة، يجمع «Le Jardin Secret» حديقتين تاريخيتين رُممتا بعناية فائقة: حديقة إسلامية يُشكّلها الماء وحديقة استوائية غنّاء. محطة هادئة ومنعشة تطل على أسطح مراكش.',
  },
  'Parc Lalla Hasna': {
    fr: "Vaste jardin public à l'ouest de la Koutoubia, le parc Lalla Hasna offre pelouses, bassins et allées ombragées face aux remparts. Un lieu apprécié des familles pour une pause au vert au sortir de la médina.",
    en: 'A large public garden west of the Koutoubia, Parc Lalla Hasna offers lawns, basins and shaded paths facing the ramparts. A family favourite for a green pause just outside the medina.',
    ar: 'حديقة عامة واسعة غرب جامع الكتبية، تضم مساحات خضراء وأحواض ماء وممرات مظللة مقابل الأسوار. مكان مفضل للعائلات للاستراحة في الهواء الطلق قرب المدينة القديمة.',
  },
  'Musée de la Femme': {
    fr: "Consacré aux savoir-faire et aux récits des femmes marocaines, ce musée de la médina présente costumes, bijoux, objets du quotidien et témoignages. Une visite intime qui éclaire une part essentielle de la culture du pays.",
    en: 'Dedicated to the crafts and stories of Moroccan women, this medina museum presents costumes, jewellery, everyday objects and personal testimonies. An intimate visit that illuminates an essential part of the country’s culture.',
    ar: 'متحف مخصص لحرف وحكايات المرأة المغربية، يعرض أزياء وحلياً وأدوات يومية وشهادات شخصية. زيارة حميمة تُضيء جانباً أساسياً من ثقافة البلاد.',
  },
  'Musée de la Femme de Marrakech': {
    fr: "Consacré aux savoir-faire et aux récits des femmes marocaines, ce musée de la médina présente costumes, bijoux, objets du quotidien et témoignages. Une visite intime qui éclaire une part essentielle de la culture du pays.",
    en: 'Dedicated to the crafts and stories of Moroccan women, this medina museum presents costumes, jewellery, everyday objects and personal testimonies. An intimate visit that illuminates an essential part of the country’s culture.',
    ar: 'متحف مخصص لحرف وحكايات المرأة المغربية، يعرض أزياء وحلياً وأدوات يومية وشهادات شخصية. زيارة حميمة تُضيء جانباً أساسياً من ثقافة البلاد.',
  },
  'Setti Fatma': {
    fr: "Village accroché aux contreforts du Haut Atlas, Setti Fatma est la porte d'entrée de la vallée de l'Ourika. Ses sept cascades, ses terrasses irriguées et ses cafés au bord de l'eau en font une escapade fraîche et vivante.",
    en: 'A village clinging to the High Atlas foothills, Setti Fatma is the gateway to the Ourika valley. Its seven waterfalls, irrigated terraces and riverside cafés make a cool, lively escape.',
    ar: 'قرية معلقة على سفوح الأطلس الكبير، تُعد ستي فاطمة بوابة وادي أوريكة. شلالاتها السبع ومدرجاتها المروية ومقاهيها على ضفة النهر تجعلها رحلة منعشة ونابضة.',
  },
  'Cyber Park Arsat Moulay Abdeslam': {
    en: 'A historic eight-hectare garden in the heart of Marrakech, Arsat Moulay Abdeslam is now a cyber park: shaded paths and hundred-year-old trees combined with free Wi-Fi. One of the city’s oldest green spaces, a few minutes from Jemaa el-Fna.',
  },
  'Maison de la Photographie': {
    en: 'Opened in 2009 in a restored medina house, the Maison de la Photographie holds a remarkable collection of Moroccan photography from the 1870s to the 1950s. Its rooftop café is one of the medina’s loveliest viewpoints.',
  },
  'Musée Mohammed VI pour la civilisation de l’eau au Maroc': {
    en: 'Also known as the Museum of Water, Musée Aman is dedicated to water and traditional hydraulic techniques in Morocco. At the northern entrance of Marrakech, in the Palmeraie, it tells the story of a vital resource through gardens, models and displays.',
  },
  'Musée Tiskiwin': {
    en: 'Housed in Bert Flint’s early-20th-century home near the Bahia Palace, the Tiskiwin museum displays Moroccan craft and the trans-Saharan links between Marrakech and West Africa. A small, atmospheric collection.',
  },
  "Désert d'Agafay": {
    en: 'A rocky reg about thirty kilometres from Marrakech, the Agafay desert spreads across rolling ochre hills at the foot of the High Atlas. Its stone desert, camel rides and starlit camps make an easy escape from the city.',
  },
  'Oliveraie de la Ménara': {
    fr: "L'oliveraie de la Ménara prolonge le célèbre jardin autour du grand bassin. Sous les oliviers centenaires, allées, canaux et petites parcelles dessinent un paysage agricole paisible aux portes de Marrakech.",
    en: 'The Menara olive grove surrounds the famous garden and its great basin. Beneath centenarian olive trees, paths, channels and small plots form a peaceful agricultural landscape at the edge of Marrakech.',
    ar: 'تمتد أوليفية المنارة حول الحديقة الشهيرة وحوضها الكبير. تحت أشجار الزيتون المعمّرة، ترسم الممرات والقنوات والقطع الزراعية الصغيرة مشهداً ريفياً هادئاً على أبواب مراكش.',
  },
  'Souk Semmarine': {
    fr: "Artère commerçante la plus animée de la médina, le souk Semmarine déroule ses étals de cuir, de lanternes, de tapis et de bijoux. Un dédale vivant où l'on flâne autant qu'on négocie.",
    en: 'The liveliest shopping artery in the medina, Souk Semmarine lines up stalls of leather, lanterns, rugs and jewellery. A living maze made for wandering as much as bargaining.',
    ar: 'أكثر شرايين المدينة القديمة حيوية، يصطف فيه باعة الجلود والفوانيس والزرابي والحلي. متاهة نابضة تدعو إلى التجول والمساومة.',
  },
  'Souk des Teinturiers': {
    fr: "Ici, les écheveaux de laine et de soie sèchent au-dessus des ruelles aux couleurs éclatantes. Le souk des Teinturiers perpétue un artisanat spectaculaire, entre cuves de pigments et façades ocre.",
    en: 'Here, skeins of wool and silk dry above the alleys in vivid colours. Souk des Teinturiers keeps a spectacular craft alive among pigment vats and ochre façades.',
    ar: 'هنا تُنشر خيوط الصوف والحرير فوق الأزقة بألوانها الزاهية. يحافظ سوق الصباغين على حرفة مذهلة بين أحواض الأصباغ والواجهات الترابية.',
  },
  'Souk des Bijoutiers': {
    fr: "Le souk des Bijoutiers concentre les ateliers et vitrines des orfèvres de la médina. Pièces d'or et d'argent, filigranes et parures traditionnelles s'y exposent dans une lumière dorée.",
    en: 'Souk des Bijoutiers gathers the medina’s goldsmith workshops and windows. Gold and silver pieces, filigree and traditional ornaments shine in a golden light.',
    ar: 'يجمع سوق الصاغة ورشات ونوافذ صاغة المدينة القديمة. قطع الذهب والفضة والتفاصيل الدقيقة والحلي التقليدية تلمع في ضوء ذهبي.',
  },
  'Souk Haddadine': {
    fr: "Le quartier des forgerons résonne du marteau sur le métal. Entre ateliers et échoppes, le souk Haddadine montre un artisanat du feu toujours en activité.",
    en: 'The blacksmiths’ quarter rings with hammers on metal. Between workshops and stalls, Souk Haddadine shows a craft of fire that is still very much alive.',
    ar: 'حي الحدادين يتردد فيه صوت المطرقة على المعدن. بين الورشات والدكاكين، يُظهر سوق الحدادين حرفة النار التي لا تزال حيّة.',
  },
  'Place des Épices': {
    fr: "Petite place ombragée au cœur des souks, la place des Épices embaume le cumin, le safran et la cannelle. Un carrefour idéal pour observer la vie du quartier autour d'un thé.",
    en: 'A small shaded square in the heart of the souks, Place des Épices smells of cumin, saffron and cinnamon. An ideal crossroads for watching neighbourhood life over a glass of tea.',
    ar: 'ساحة صغيرة مظللة في قلب الأسواق، تفوح منها رائحة الكمون والزعفران والقرفة. ملتقى مثالي لمشاهدة حياة الحي على كأس شاي.',
  },
  'Place des Ferblantiers': {
    fr: "La place des Ferblantiers borde la Kasbah et rassemble les artisans du métal. Lanternes, plateaux et objets en fer-blanc y dessinent des étals scintillants, à deux pas du palais de la Bahia.",
    en: 'Place des Ferblantiers borders the Kasbah and gathers metalworkers. Lanterns, trays and tin objects make glittering displays just steps from the Bahia Palace.',
    ar: 'تقع ساحة الصفارين قرب القصبة وتجمع حرفيي المعدن. الفوانيس والصواني والأواني المعدنية تشكّل عروضاً لامعة على بُعد خطوات من قصر الباهية.',
  },
  'Quartier de la Kasbah': {
    fr: "Ancien quartier fortifié au sud de la médina, la Kasbah abrite les tombeaux saadiens, la place des Ferblantiers et de vastes demeures. Ses ruelles calmes gardent la mémoire des dynasties marocaines.",
    en: 'An old fortified quarter south of the medina, the Kasbah shelters the Saadian tombs, Place des Ferblantiers and grand residences. Its quiet lanes keep the memory of Moroccan dynasties.',
    ar: 'حي محصّن قديم جنوب المدينة القديمة، يضم قبور السعديين وساحة الصفارين ومساكن واسعة. تحفظ أزقته الهادئة ذاكرة السلالات المغربية.',
  },
  'Quartier de Mouassine': {
    fr: "L'un des plus anciens quartiers de la médina, Mouassine s'organise autour de sa mosquée, de sa fontaine et de ses maisons à patio. Un dédale vivant de galeries, de riads et de cafés perchés.",
    en: 'One of the oldest quarters of the medina, Mouassine clusters around its mosque, fountain and patio houses. A lively maze of galleries, riads and rooftop cafés.',
    ar: 'من أقدم أحياء المدينة القديمة، يتجمّع حول مسجده ونافورته ومنازله ذات الأفنية. متاهة نابضة بالمعارض ودور الضيافة والمقاهي العلوية.',
  },
  'Quartier Mellah': {
    fr: "Ancien quartier juif de Marrakech, le Mellah se distingue par ses façades colorées, sa synagogue Lazama et son marché animé. Un lieu de mémoire au cœur de la ville.",
    en: 'The historic Jewish quarter of Marrakech, the Mellah stands out for its colourful façades, the Lazama synagogue and its lively market. A place of memory in the heart of the city.',
    ar: 'الحي اليهودي القديم في مراكش، يتميز بواجهاته الملونة وكنيس لازاما وسوقه النابض. مكان للذاكرة في قلب المدينة.',
  },
  'Plateau du Kik': {
    fr: "À une trentaine de kilomètres de Marrakech, le plateau du Kik ouvre sur les contreforts de l'Atlas et le lac Lalla Takerkoust. Un paysage minéral prisé des amateurs de VTT, de quad et de déjeuners en plein air.",
    en: 'About thirty kilometres from Marrakech, the Kik plateau opens onto the Atlas foothills and Lake Lalla Takerkoust. A mineral landscape loved by mountain bikers, quad riders and open-air lunches.',
    ar: 'على بعد نحو ثلاثين كيلومتراً من مراكش، يطل هضبة الكيك على سفوح الأطلس وبحيرة للا تاكركوست. مشهد صخري يعشقه هواة الدراجات والرباعيات والغداء في الهواء الطلق.',
  },
  'Vallée du Zat': {
    fr: "Moins fréquentée que l'Ourika, la vallée du Zat déroule villages berbères, terrasses cultivées et eaux vives au pied du Haut Atlas. Une échappée paisible pour randonner et découvrir la vie de montagne.",
    en: 'Less visited than the Ourika, the Zat valley unfolds Berber villages, cultivated terraces and rushing water at the foot of the High Atlas. A peaceful escape for walking and mountain life.',
    ar: 'أقل ازدحاماً من وادي أوريكة، يمتد وادي زات بين قرى أمازيغية ومدرجات زراعية ومياه جارية عند سفوح الأطلس الكبير. وجهة هادئة للمشي واكتشاف حياة الجبل.',
  },
  'Cafés': {
    fr: "Des terrasses ombragées de la médina aux cafés contemporains de Gueliz, Marrakech cultive l'art de la pause. Un café, un jus d'orange frais et le spectacle de la rue : une institution locale.",
    en: 'From shaded medina terraces to contemporary Gueliz cafés, Marrakech has turned the pause into an art. A coffee, a fresh orange juice and the street theatre: a local institution.',
    ar: 'من شرفات المدينة القديمة المظللة إلى مقاهي جيليز العصرية، تجعل مراكش من الاستراحة فناً. قهوة وعصير برتقال طازج ومشهد الشارع: طقس محلي أصيل.',
  },
  'Restaurants': {
    fr: "Tajines mijotés, couscous du vendredi, poissons grillés et cuisine de rue : Marrakech se découvre aussi à table. Des riads aux terrasses, chaque adresse raconte un terroir.",
    en: 'Slow-cooked tagines, Friday couscous, grilled fish and street food: Marrakech is also a city to taste. From riads to rooftops, every address tells a story of terroir.',
    ar: 'طواجن مطهوة ببطء، كسكس الجمعة، سمك مشوي وأطعمة الشارع: مراكش تُكتشف أيضاً على المائدة. من دور الضيافة إلى الشرفات، كل عنوان يحكي قصة أرض.',
  },
  'Parcs': {
    fr: "Entre les jardins historiques et les espaces verts contemporains, Marrakech offre de vraies respirations. Parcs ombragés, allées de palmiers et pelouses accueillent promenades et pique-niques.",
    en: 'Between historic gardens and contemporary green spaces, Marrakech offers real breathing room. Shaded parks, palm-lined paths and lawns welcome walks and picnics.',
    ar: 'بين الحدائق التاريخية والمساحات الخضراء المعاصرة، تمنح مراكش مساحات حقيقية للتنفس. حدائق مظللة وممرات نخيل ومساحات خضراء تستقبل التنزه والرحلات.',
  },
  'Piscines': {
    fr: "Riad, hôtel ou club : les piscines de Marrakech invitent à la fraîcheur entre deux visites. Eau turquoise, transats et palmiers composent une pause très locale.",
    en: 'Riad, hotel or club: Marrakech pools invite a cool pause between visits. Turquoise water, sun loungers and palms make a very local ritual.',
    ar: 'رياض أو فندق أو نادٍ: مسابح مراكش تدعو إلى الانتعاش بين الزيارات. مياه فيروزية وكراسي استلقاء ونخيل تصنع استراحة محلية بامتياز.',
  },
  'Hôtels': {
    fr: "Du riad caché dans la médina au resort des palmiers, Marrakech décline toutes les façons de séjourner. Patios, jardins et hospitalité marocaine composent une expérience à part entière.",
    en: 'From a hidden medina riad to a palm-grove resort, Marrakech offers every way to stay. Patios, gardens and Moroccan hospitality make the stay an experience in itself.',
    ar: 'من رياض مخفي في المدينة القديمة إلى منتجع وسط النخيل، تقدم مراكش كل طرق الإقامة. أفنية وحدائق وكرم ضيافة مغربي تجعل الإقامة تجربة بحد ذاتها.',
  },
  'Salles de sport (Karaté, Yoga, Musculation)': {
    fr: "Karaté, yoga, musculation : Marrakech compte de nombreuses salles et studios pour garder le rythme pendant le voyage. Une façon différente de rencontrer la ville et ses habitants.",
    en: 'Karate, yoga, weight training: Marrakech has plenty of gyms and studios to keep your routine while travelling. A different way to meet the city and its people.',
    ar: 'كاراتيه ويوغا وتمارين مقاومة: تضم مراكش العديد من القاعات والاستوديوهات للحفاظ على روتينك أثناء السفر. طريقة مختلفة للقاء المدينة وسكانها.',
  },
};

/** Common localized copy for activities with no dedicated article. */
const EXPERIENCE_COPY = {
  'Circuit en quad dans la Palmeraie': {
    fr: "Cap sur les pistes de la Palmeraie pour un circuit en quad entre palmiers, villages et chemins de terre. Une aventure poussiéreuse et ludique, encadrée par des guides locaux.",
    en: 'Head for the Palmeraie tracks on a quad bike between palms, villages and dirt paths. A dusty, playful adventure led by local guides.',
    ar: 'انطلق على مسارات النخيل بدراجة رباعية بين النخيل والقرى والطرق الترابية. مغامرة ممتعة ومغبرة بإشراف مرشدين محليين.',
  },
  'Balade à dos de chameau': {
    fr: "Au rythme lent du dromadaire, la Palmeraie se découvre autrement. Une balade au coucher du soleil, entre palmiers et petites fermes, pour retrouver le calme du désert aux portes de la ville.",
    en: 'At a dromedary’s slow pace, the Palmeraie reveals itself differently. A sunset ride between palms and small farms, finding desert calm at the edge of the city.',
    ar: 'على إيقاع الجمل الهادئ، يُكتشف النخيل بطريقة أخرى. جولة عند الغروب بين النخيل والمزارع الصغيرة، لاستعادة سكينة الصحراء على أبواب المدينة.',
  },
  'Vol en montgolfière autour de Marrakech': {
    fr: "Au lever du jour, la montgolfière s'élève au-dessus de la Palmeraie et de l'Atlas. Une heure de vol silencieux, suivie d'un petit-déjeuner berbère : l'un des plus beaux points de vue sur Marrakech.",
    en: 'At dawn, the balloon rises above the Palmeraie and the Atlas. An hour of silent flight followed by a Berber breakfast: one of the finest views over Marrakech.',
    ar: 'عند الفجر، يرتفع المنطاد فوق النخيل والأطلس. ساعة من الطيران الصامت تليها فطور أمازيغي: من أجمل المناظر على مراكش.',
  },
  'Excursion en buggy': {
    fr: "Le buggy trace sa route dans les chemins de la Palmeraie et du désert d'Agafay. Sensations, poussière et grands espaces : une excursion idéale à partager entre amis.",
    en: 'The buggy carves its way through Palmeraie and Agafay desert tracks. Thrills, dust and wide open spaces: an excursion made for friends.',
    ar: 'يشق الباغي طريقه في مسارات النخيل وصحراء أكافاي. إثارة وغبار وفضاءات واسعة: رحلة مثالية مع الأصدقاء.',
  },
  'Dîner traditionnel marocain': {
    fr: "Un dîner marocain se vit comme un rituel : salades, tajine, couscous et pâtisseries au miel, servis dans un riad ou sous une tente. Musique, lanternes et hospitalité complètent l'expérience.",
    en: 'A Moroccan dinner is a ritual: salads, tagine, couscous and honey pastries served in a riad or beneath a tent. Music, lanterns and hospitality complete the experience.',
    ar: 'العشاء المغربي طقس بحد ذاته: سلطات وطاجين وكسكس وحلويات بالعسل، تُقدَّم في رياض أو تحت خيمة. الموسيقى والفوانيس وكرم الضيافة تكمل التجربة.',
  },
  'Spectacle de fantasia': {
    fr: "La fantasia fait revivre les traditions équestres marocaines : cavaliers en tenue traditionnelle, courses et salves de baroud. Un spectacle nocturne spectaculaire, souvent accompagné d'un dîner.",
    en: 'Fantasia brings Moroccan equestrian traditions to life: riders in traditional dress, charges and baroud salvoes. A spectacular night show, often paired with dinner.',
    ar: 'تُحيي الفانتازيا التقاليد الفروسية المغربية: فرسان بأزياء تقليدية وسباقات وطلقات بارود. عرض ليلي مبهر يرافقه غالباً عشاء.',
  },
  'Hammam marocain traditionnel': {
    fr: "Vapeur, savon noir, gant de kessa et huile d'argan : le hammam est un rituel de purification et de détente. Une expérience sensorielle incontournable, entre calme et chaleur.",
    en: 'Steam, black soap, kessa glove and argan oil: the hammam is a ritual of cleansing and relaxation. An essential sensory experience, warm and calming.',
    ar: 'بخار وصابون أسود وقفاز الكيس وزيت الأركان: الحمام طقس للتطهير والاسترخاء. تجربة حسية لا تُفوَّت بين الدفء والهدوء.',
  },
  'Rooftop avec vue sur la médina': {
    fr: "Depuis les terrasses de la médina, les minarets, les patios et l'Atlas se déploient à perte de vue. Un thé, la lumière du soir et le chant des oiseaux : Marrakech vue d'en haut.",
    en: 'From medina rooftops, minarets, patios and the Atlas unfold as far as the eye can see. Tea, evening light and birdsong: Marrakech from above.',
    ar: 'من أسطح المدينة القديمة، تمتد المآذن والأفنية وجبال الأطلس إلى أبعد مدى. شاي وضوء المساء وتغريد الطيور: مراكش من الأعلى.',
  },
  'Coucher de soleil à Jemaa el-Fna': {
    fr: "Quand le soleil descend, Jemaa el-Fna change de visage : conteurs, musiciens, cuisines ambulantes et fumées parfumées. Un moment suspendu, à vivre au milieu de la place.",
    en: 'As the sun goes down, Jemaa el-Fna changes face: storytellers, musicians, food stalls and fragrant smoke. A suspended moment at the heart of the square.',
    ar: 'عندما تغرب الشمس، يتغير وجه ساحة جامع الفنا: حكواتيون وموسيقيون ومطاعم متنقلة ودخان عطري. لحظة معلّقة تُعاش في قلب الساحة.',
  },
  "Dîner dans le désert d'Agafay": {
    fr: "À quarante minutes de Marrakech, le désert d'Agafay accueille des dîners sous les étoiles. Tables dressées, lanternes, musique et horizon minéral : une soirée hors du temps.",
    en: 'Forty minutes from Marrakech, the Agafay desert hosts dinners under the stars. Set tables, lanterns, music and a mineral horizon: an evening out of time.',
    ar: 'على بعد أربعين دقيقة من مراكش، تستقبل صحراء أكافاي عشاءً تحت النجوم. موائد وفوانيس وموسيقى وأفق صخري: أمسية خارج الزمن.',
  },
  'Balade en calèche': {
    fr: "La calèche est une manière douce de découvrir Marrakech : remparts, jardins, quartiers périphériques et retour par les grands boulevards. Un rythme lent pour observer la ville.",
    en: 'A horse-drawn calèche is a gentle way to discover Marrakech: ramparts, gardens, outer neighbourhoods and back along the boulevards. A slow pace for watching the city.',
    ar: 'العربة التي تجرها الخيول وسيلة هادئة لاكتشاف مراكش: الأسوار والحدائق والأحياء المحيطة والعودة عبر الشوارع الكبرى. إيقاع بطيء لمشاهدة المدينة.',
  },
  'Spa traditionnel marocain': {
    fr: "Massages à l'huile d'argan, gommages et soins à la rose : les spas de Marrakech prolongent le rituel du hammam dans un cadre raffiné. Une parenthèse de bien-être après une journée de visites.",
    en: 'Argan-oil massages, scrubs and rose treatments: Marrakech spas extend the hammam ritual in refined surroundings. A wellbeing pause after a day of visits.',
    ar: 'تدليك بزيت الأركان وتقشير وعلاجات بالورد: تمتد منتجعات مراكش الصحية بطقس الحمام في إطار أنيق. استراحة عافية بعد يوم من الزيارات.',
  },
  'Dégustation de thé à la menthe': {
    fr: "Le thé à la menthe est bien plus qu'une boisson : c'est un geste d'accueil. Versé de haut, sucré selon la tradition, il se partage sur une terrasse ou dans un riad, entre conversation et calme.",
    en: 'Mint tea is far more than a drink: it is a gesture of welcome. Poured from a height, sweetened by tradition, it is shared on a terrace or in a riad, between conversation and calm.',
    ar: 'الشاي بالنعناع أكثر من مجرد مشروب: إنه لفتة ترحيب. يُصبّ من علو ويُحلّى حسب التقليد، ويُشارك على شرفة أو في رياض بين الحديث والهدوء.',
  },
  'Découverte de la cuisine de rue de la médina': {
    fr: "Msemen, harira, brochettes, olives et jus frais : la cuisine de rue raconte Marrakech mieux qu'un menu. Un parcours gourmand dans les ruelles, à faire l'estomac vide et l'esprit curieux.",
    en: 'Msemen, harira, skewers, olives and fresh juice: street food tells the story of Marrakech better than any menu. A tasty walk through the alleys, best done hungry and curious.',
    ar: 'مسمن وحريرة وأسياخ وزيتون وعصير طازج: طعام الشارع يحكي مراكش أفضل من أي قائمة. جولة لذيذة في الأزقة، تُعاش بمعدة خاوية وفضول.',
  },
  'Balade nocturne dans la médina': {
    fr: "À la nuit tombée, la médina s'apaise et les lanternes s'allument. Une balade guidée entre places, fontaines et passages voûtés révèle une ville plus intime, loin de l'agitation du jour.",
    en: 'After dark, the medina quiets and lanterns glow. A guided walk between squares, fountains and vaulted passages reveals a more intimate city, far from the daytime bustle.',
    ar: 'بعد حلول الظلام، تهدأ المدينة القديمة وتضاء الفوانيس. جولة مرشدة بين الساحات والنوافير والممرات المقوّسة تكشف مدينة أكثر حميمية بعيداً عن صخب النهار.',
  },
};

const CATEGORY_FALLBACK_IMAGE = {
  jardin: '/images/categories/jardins-et-nature.jpg',
  monuments: '/images/categories/monuments-historiques-patrimoine.jpg',
  musees: '/images/categories/musees-et-culture.jpg',
  excursions: '/images/categories/excursions.jpg',
  experiences: '/images/categories/experiences-a-faire.jpg',
  autres: '/images/categories/places.jpg',
};

/** Specific fallback photography for the generic establishment entries. */
const GENERIC_IMAGES = {
  Cafés: ['/images/categories/cafes.jpg', '/images/categories/places.jpg'],
  Restaurants: ['/images/categories/restaurants.jpg', '/images/categories/places.jpg'],
  Parcs: ['/images/categories/parcs.jpg', '/images/categories/places.jpg'],
  Piscines: ['/images/categories/piscines.jpg', '/images/categories/places.jpg'],
  Hôtels: ['/images/categories/hotels.jpg', '/images/categories/places.jpg'],
  'Salles de sport (Karaté, Yoga, Musculation)': [
    '/images/categories/salles-de-sport.jpg',
    '/images/categories/places.jpg',
  ],
};

/** Real Wikimedia Commons photography for places and activities Wikipedia does not illustrate. */
const COMMONS_QUERIES = {
  'Le Jardin Secret': 'Le Jardin Secret Marrakech',
  'Parc Lalla Hasna': 'Parc Lalla Hasna Marrakech',
  'Oliveraie de la Ménara': 'Menara olive grove Marrakech',
  'Musée de la Femme': 'Hafida Zizi musée de la femme Marrakech',
  'Musée de la Femme de Marrakech': 'Hafida Zizi musée de la femme Marrakech',
  'Souk Semmarine': 'Souk Semmarine Marrakech',
  'Souk des Teinturiers': 'dyers souk Marrakech',
  'Souk des Bijoutiers': 'Souk bijoutiers Marrakech',
  'Souk Haddadine': 'Souk Haddadine Marrakech',
  'Place des Épices': 'Place des épices Marrakech',
  'Place des Ferblantiers': 'Place des Ferblantiers Marrakech',
  'Quartier de Mouassine': 'Mouassine Marrakech',
  'Setti Fatma': 'Setti Fatma Ourika',
  'Plateau du Kik': 'Lalla Takerkoust lake',
  'Vallée du Zat': 'Vallée du Zat',
  'Circuit en quad dans la Palmeraie': 'Quad bike Palmeraie Marrakech',
  'Balade à dos de chameau': 'Camel Palmeraie Marrakech',
  'Vol en montgolfière autour de Marrakech': 'Hot air balloon Marrakech',
  'Excursion en buggy': 'Agafay desert',
  'Dîner traditionnel marocain': 'Moroccan tagine',
  'Spectacle de fantasia': 'Fantasia Morocco horse',
  'Hammam marocain traditionnel': 'Hammam Marrakech',
  'Rooftop avec vue sur la médina': 'Marrakech rooftop medina',
  'Coucher de soleil à Jemaa el-Fna': 'Jemaa el-Fna sunset',
  "Dîner dans le désert d'Agafay": 'Agafay desert',
  'Balade en calèche': 'Calèche Marrakech',
  'Spa traditionnel marocain': 'Spa Marrakech',
  'Dégustation de thé à la menthe': 'Moroccan mint tea',
  'Découverte de la cuisine de rue de la médina': 'Moroccan street food Marrakech',
  'Balade nocturne dans la médina': 'Marrakech medina night',
};

/** Editorial copy that is more useful to a visitor than the encyclopaedic extract. */
const PREFER_CUSTOM = new Set([
  'Le Jardin Secret',
  'Parc Lalla Hasna',
  'Musée de la Femme',
  'Musée de la Femme de Marrakech',
  'Setti Fatma',
  'Oliveraie de la Ménara',
  'Souk Semmarine',
  'Souk des Teinturiers',
  'Souk des Bijoutiers',
  'Souk Haddadine',
  'Place des Épices',
  'Place des Ferblantiers',
  'Quartier de Mouassine',
  'Plateau du Kik',
  'Vallée du Zat',
]);

/** Names whose Wikipedia match is misleading; keep them editorial-only. */
const NO_WIKI = new Set(['Musée de la Femme', 'Musée de la Femme de Marrakech']);

const GENERIC_NAMES = new Set([
  'Cafés',
  'Restaurants',
  'Parcs',
  'Piscines',
  'Hôtels',
  'Salles de sport (Karaté, Yoga, Musculation)',
]);

const WIKI = {
  fr: 'https://fr.wikipedia.org',
  en: 'https://en.wikipedia.org',
  ar: 'https://ar.wikipedia.org',
};

const HEADERS = { 'user-agent': 'AnnabidPlacesCatalogue/1.0 (contact: dev@annabid.com)' };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function json(url, attempt = 0) {
  try {
    const response = await fetch(url, { headers: HEADERS });
    if (response.ok) return await response.json();
    if (response.status === 404) return null;
    if (response.status === 429 || response.status >= 500) {
      if (attempt >= 4) return null;
      await sleep(2500 * (attempt + 1));
      return json(url, attempt + 1);
    }
    return null;
  } catch {
    if (attempt >= 3) return null;
    await sleep(1500 * (attempt + 1));
    return json(url, attempt + 1);
  }
}

function cleanExtract(text, max = 1500) {
  if (!text) return '';
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  const slice = normalized.slice(0, max);
  const lastStop = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('。'));
  return lastStop > max * 0.5 ? slice.slice(0, lastStop + 1) : `${slice.trimEnd()}…`;
}

function shortFrom(text, max = 190) {
  if (!text) return '';
  const firstStop = text.search(/[.!?。]\s/);
  const sentence = firstStop > 40 ? text.slice(0, firstStop + 1) : text;
  if (sentence.length <= max) return sentence;
  const slice = sentence.slice(0, max);
  return `${slice.slice(0, Math.max(slice.lastIndexOf(' '), max - 30)).trimEnd()}…`;
}

function cleanImageUrl(url) {
  if (!url) return '';
  return url.split('?')[0];
}

/**
 * Files that matched a Wikipedia article by accident (artworks, maps, an
 * unrelated French lake…) and must never become a destination hero image.
 */
const BLOCKED_IMAGE_PATTERNS = [
  /david_face/i,
  /venus_botticelli/i,
  /john_duke_of_burgundy/i,
  /adriaen_matham/i,
  /mondrianlike/i,
  /terra\.png/i,
  /tensift_basin_osm/i,
  /barrage_couvagnac/i,
  /dl2a---club-med/i,
  /fonte-ix/i,
  /femme_europ/i,
];

function isUsefulImage(fileName) {
  const decoded = (() => {
    try {
      return decodeURIComponent(fileName);
    } catch {
      return fileName;
    }
  })();
  const lower = decoded.toLowerCase();
  if (!/\.(jpe?g|png|webp)$/i.test(lower)) return false;
  if (BLOCKED_IMAGE_PATTERNS.some((pattern) => pattern.test(decoded))) return false;
  return !/(logo|icon|map\b|carte|plan\b|blason|flag|drapeau|commons|wikimedia|panneau|arrow|fleche|symbol|seal|montage|collage|banner|entete|entête|nuvola|emblem)/i.test(
    lower,
  );
}

/** Wikimedia now rejects arbitrary thumbnail widths; 1280 is an official step. */
function scaledThumb(url, width = 1280) {
  return cleanImageUrl(url || '').replace(/\/\d+px-/, `/${width}px-`);
}

/** Same photograph requested at two widths should only appear once. */
function imageKey(url) {
  const decoded = (() => {
    try {
      return decodeURIComponent(url.split('?')[0]);
    } catch {
      return url.split('?')[0];
    }
  })();
  const file = decoded.split('/').pop() || decoded;
  return file.replace(/^\d+px-/, '').toLowerCase();
}

function dedupeImages(images) {
  const seen = new Set();
  return images.filter((url) => {
    if (!url) return false;
    const key = imageKey(url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Entries where Commons search is more reliable than the article gallery. */
const COMMONS_FIRST = new Set([
  'Parc Lalla Hasna',
  'Souk Semmarine',
  'Souk des Teinturiers',
  'Quartier de Mouassine',
]);

/** Hero-image preferences when a gallery contains a better entrance shot. */
const IMAGE_PRIORITY = {
  'Musée Tiskiwin': /entr[eé]e_mus[eé]e_tiskiwin/i,
};

function orderImages(name, images) {
  const priority = IMAGE_PRIORITY[name];
  if (!priority) return images;
  const first = images.filter((url) => priority.test((() => {
    try {
      return decodeURIComponent(url);
    } catch {
      return url;
    }
  })()));
  const rest = images.filter((url) => !first.includes(url));
  return [...first, ...rest];
}

async function fetchSummary(lang, title) {
  if (!title) return null;
  const slug = encodeURIComponent(title.replace(/ /g, '_'));
  const data = await json(`${WIKI[lang]}/api/rest_v1/page/summary/${slug}`);
  if (!data || data.type === 'disambiguation' || !data.title) return null;
  return data;
}

async function fetchLanglinks(lang, title) {
  if (!title) return { ar: '', en: '' };
  const api = `${WIKI[lang]}/w/api.php?action=query&format=json&redirects=1&prop=langlinks&lllimit=500&titles=${encodeURIComponent(title)}`;
  const data = await json(api);
  const pages = data?.query?.pages;
  if (!pages) return { ar: '', en: '' };
  const page = Object.values(pages)[0];
  const links = page?.langlinks || [];
  const result = { ar: '', en: '' };
  for (const link of links) {
    if (link.lang === 'ar') result.ar = link['*'];
    if (link.lang === 'en') result.en = link['*'];
  }
  return result;
}

async function fetchGallery(lang, title, skipUrls = []) {
  if (!title) return [];
  const api = `${WIKI[lang]}/w/api.php?action=query&format=json&redirects=1&prop=images&imlimit=40&titles=${encodeURIComponent(title)}`;
  const data = await json(api);
  const pages = data?.query?.pages;
  if (!pages) return [];
  const page = Object.values(pages)[0];
  const files = (page?.images || [])
    .map((image) => image.title)
    .filter((file) => isUsefulImage(file))
    .slice(0, 10);
  if (!files.length) return [];

  const infoApi = `${WIKI[lang]}/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=1280&titles=${encodeURIComponent(
    files.join('|'),
  )}`;
  const info = await json(infoApi);
  const infoPages = info?.query?.pages;
  if (!infoPages) return [];
  const urls = [];
  for (const pageInfo of Object.values(infoPages)) {
    const url = cleanImageUrl(pageInfo?.imageinfo?.[0]?.thumburl || pageInfo?.imageinfo?.[0]?.url);
    if (!url || skipUrls.includes(url) || urls.includes(url)) continue;
    urls.push(url);
  }
  return urls;
}

async function fetchCommonsImages(query, limit = 4) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=${limit + 5}&gsrsearch=${encodeURIComponent(
    query,
  )}&prop=imageinfo&iiprop=url&iiurlwidth=1280`;
  const data = await json(api);
  const pages = data?.query?.pages;
  if (!pages) return [];
  const urls = [];
  for (const pageInfo of Object.values(pages)) {
    const title = pageInfo?.title || '';
    if (!isUsefulImage(title)) continue;
    const url = cleanImageUrl(pageInfo?.imageinfo?.[0]?.thumburl || pageInfo?.imageinfo?.[0]?.url);
    if (url && !urls.includes(url)) urls.push(url);
    if (urls.length >= limit) break;
  }
  return urls;
}

async function buildDestination(entry, cache) {
  const isGeneric = GENERIC_NAMES.has(entry.name);
  const skipWiki = isGeneric || NO_WIKI.has(entry.name);
  const wikiTitle = WIKI_TITLES[entry.name] || entry.name;
  let record = cache.get(entry.name);

  if (!record) {
    if (skipWiki) {
      record = { fr: null, en: null, ar: null, primary: null, primaryLang: null, langlinks: null };
    } else {
      let fr = await fetchSummary('fr', wikiTitle);
      let en = null;
      if (!fr) en = await fetchSummary('en', wikiTitle);
      const primaryLang = fr ? 'fr' : en ? 'en' : null;
      const primary = fr || en;
      record = { fr, en, ar: null, primary, primaryLang, langlinks: null };
      if (primary) {
        record.langlinks = await fetchLanglinks(primaryLang, primary.title);
        if (record.langlinks?.en && primaryLang !== 'en') {
          record.en = await fetchSummary('en', record.langlinks.en);
        }
        record.ar = await fetchSummary('ar', record.langlinks?.ar);
      }
    }
    cache.set(entry.name, record);
    await sleep(450);
  }

  const { fr, en, ar, primary, primaryLang } = record;
  const override = COORDINATES[entry.name];
  const lat = override ? override[0] : primary?.coordinates?.lat;
  const lng = override ? override[1] : primary?.coordinates?.lon;

  let images = [];

  // Some article galleries are noisy; lead with a targeted Commons search.
  if (COMMONS_QUERIES[entry.name] && COMMONS_FIRST.has(entry.name)) {
    images = await fetchCommonsImages(COMMONS_QUERIES[entry.name], 3);
    await sleep(400);
  }

  if (primary) {
    const main = scaledThumb(primary.thumbnail?.source);
    if (main) images.push(main);
    const gallery = await fetchGallery(primaryLang, primary.title, images);
    images = images.concat(gallery).slice(0, COMMONS_FIRST.has(entry.name) ? 4 : 3);
    await sleep(400);
  }

  // Places and activities without Wikipedia photography still deserve real
  // images: look them up on Wikimedia Commons with a targeted query.
  if (COMMONS_QUERIES[entry.name] && !COMMONS_FIRST.has(entry.name)) {
    const commons = await fetchCommonsImages(COMMONS_QUERIES[entry.name], 3);
    for (const url of commons) {
      if (!images.includes(url)) images.push(url);
      if (images.length >= 4) break;
    }
    await sleep(400);
  } else if (!images.length && !isGeneric) {
    images = await fetchCommonsImages(`${entry.name} Marrakech`, 3);
    await sleep(400);
  }

  if (GENERIC_IMAGES[entry.name]) {
    images = GENERIC_IMAGES[entry.name].slice();
  }

  images = orderImages(entry.name, dedupeImages(images));

  // One category photograph is a useful second slide when only one real
  // photograph exists; with two or more real shots, keep the gallery authentic.
  const fallbackImage = CATEGORY_FALLBACK_IMAGE[entry.category] || '/images/categories/places.jpg';
  const realImages = images.filter((url) => url.startsWith('http'));
  if (!images.length) images = [fallbackImage];
  else if (realImages.length === 1 && !images.some((url) => url.startsWith('/'))) images.push(fallbackImage);
  else if (realImages.length >= 2) images = realImages;

  const custom = CUSTOM_COPY[entry.name] || EXPERIENCE_COPY[entry.name];
  const preferCustom = custom && (PREFER_CUSTOM.has(entry.name) || !primary);
  const descriptions = {
    fr: cleanExtract(
      preferCustom
        ? custom.fr
        : fr?.extract || (primaryLang === 'fr' ? primary?.extract : '') || custom?.fr || '',
    ),
    en: cleanExtract(
      preferCustom
        ? custom.en
        : en?.extract || (primaryLang === 'en' ? primary?.extract : '') || custom?.en || '',
    ),
    ar: cleanExtract(
      preferCustom ? custom.ar : ar?.extract || custom?.ar || '',
    ),
  };

  return {
    name: entry.name,
    category: entry.category,
    city: entry.city,
    ...(typeof lat === 'number' && typeof lng === 'number'
      ? { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }
      : {}),
    images,
    description: descriptions,
    short: {
      fr: shortFrom(descriptions.fr),
      en: shortFrom(descriptions.en),
      ar: shortFrom(descriptions.ar),
    },
    source: {
      fr: fr?.content_urls?.desktop?.page || primary?.content_urls?.desktop?.page || '',
      en: en?.content_urls?.desktop?.page || '',
      ar: ar?.content_urls?.desktop?.page || '',
    },
    wikipediaTitle: primary?.title || '',
  };
}

async function main() {
  const cache = new Map();
  const results = [];
  for (let index = 0; index < ENTRIES.length; index += 1) {
    const entry = ENTRIES[index];
    process.stdout.write(`[${index + 1}/${ENTRIES.length}] ${entry.name}\n`);
    try {
      results.push(await buildDestination(entry, cache));
    } catch (error) {
      console.error(`  ! ${entry.name}: ${error.message}`);
      const fallback = CATEGORY_FALLBACK_IMAGE[entry.category] || '/images/categories/places.jpg';
      results.push({
        ...entry,
        images: [fallback],
        description: { fr: '', en: '', ar: '' },
        short: { fr: '', en: '', ar: '' },
        source: {},
      });
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    attribution: 'Descriptions and photographs from Wikipedia and Wikimedia Commons (CC BY-SA).',
    destinations: results,
  };
  const target = path.join(process.cwd(), 'src', 'data', 'place-destinations.json');
  fs.writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  const mapped = results.filter((place) => typeof place.lat === 'number').length;
  const photographed = results.filter((place) => place.images.length > 1).length;
  const described = results.filter((place) => place.description?.fr || place.description?.en).length;
  const localized = results.filter((place) => place.description?.ar).length;
  console.log(`\nWrote ${results.length} destinations to ${target}`);
  console.log(`mapped: ${mapped}, photographed: ${photographed}, described: ${described}, arabic: ${localized}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
