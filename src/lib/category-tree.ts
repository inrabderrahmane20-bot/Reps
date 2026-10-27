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

function makeNode(id: string, slug: string, fr: string, children?: SearchCategoryNode[], meta?: any): SearchCategoryNode {
  return {
    id,
    slug,
    labels: { fr, en: fr, ar: fr },
    children,
    meta,
  };
}

const SERVICE_TECHNIQUE: SearchCategoryNode = makeNode('services.technique', 'technique', 'TECHNIQUE', [
  makeNode('services.electricien', 'electricien', 'ÉLECTRICIEN', [
    makeNode('services.electricien.appartement', 'appartement', 'Appartement'),
    makeNode('services.electricien.maison', 'maison', 'Maison'),
    makeNode('services.electricien.immeuble', 'immeuble', 'Immeuble'),
    makeNode('services.electricien.automobile', 'automobile', 'Automobile'),
    makeNode('services.electricien.moto', 'moto', 'Moto'),
    makeNode('services.electricien.piscine', 'piscine', 'Piscine'),
  ]),
  makeNode('services.mecanicien', 'mecanicien', 'MÉCANICIEN', [
    makeNode('services.mecanicien.automobile', 'automobile', 'Automobile'),
    makeNode('services.mecanicien.machine', 'machine', 'Machine'),
  ]),
  makeNode('services.soudeur', 'soudeur', 'SOUDEUR'),
  makeNode('services.cycliste', 'cycliste', 'CYCLISTE'),
  makeNode('services.menuisier-aluminium', 'menuisier-aluminium', 'MENUISIER ALUMINIUM'),
  makeNode('services.menuisier-bois', 'menuisier-bois', 'MENUISIER BOIS'),
  makeNode('services.carrossier-tolier', 'carrossier-tolier', 'CARROSSIER-TÔLIER', [
    makeNode('services.carrossier-tolier.automobile', 'automobile', 'Automobile'),
    makeNode('services.carrossier-tolier.moto', 'moto', 'Moto'),
  ]),
  makeNode('services.tapissier', 'tapissier', 'TAPISSIER', [
    makeNode('services.tapissier.automobile', 'automobile', 'Automobile'),
    makeNode('services.tapissier.fauteuil', 'fauteuil', 'Fauteuil'),
  ]),
  makeNode('services.couturier', 'couturier', 'COUTURIER', [
    makeNode('services.couturier.traditionnelle-homme', 'traditionnelle-homme', 'Traditionnelle pour homme'),
    makeNode('services.couturier.traditionnelle-femme', 'traditionnelle-femme', 'Traditionnelle pour femme'),
    makeNode('services.couturier.retouche-tailleur', 'retouche-tailleur', 'Retouche / tailleur'),
    makeNode('services.couturier.costume', 'costume', 'Costume'),
  ]),
  makeNode('services.styliste', 'styliste', 'STYLISTE', [
    makeNode('services.styliste.homme', 'homme', 'Homme'),
    makeNode('services.styliste.femme', 'femme', 'Femme'),
    makeNode('services.styliste.enfant', 'enfant', 'Enfant'),
    makeNode('services.styliste.sac', 'sac', 'Sac'),
    makeNode('services.styliste.jaquette', 'jaquette', 'Jaquette'),
    makeNode('services.styliste.animal', 'animal', 'Animal'),
  ]),
  makeNode('services.resiniste', 'resiniste', 'RÉSINISTE', [
    makeNode('services.resiniste.createur', 'createur-resine', 'Créateur résine'),
    makeNode('services.resiniste.reparateur', 'reparateur-resine', 'Réparateur résine', [
      makeNode('services.resiniste.reparateur.voiture', 'reparation-voiture', 'Réparation de voiture'),
      makeNode('services.resiniste.reparateur.moto', 'reparation-moto', 'Réparation de moto'),
      makeNode('services.resiniste.reparateur.planche', 'reparation-planche-surf', 'Réparation de planche de surf'),
    ]),
  ]),
  makeNode('services.serrurier', 'serrurier', 'SERRURIER', [
    makeNode('services.serrurier.porte-metal', 'porte-metal', 'Porte en métal'),
    makeNode('services.serrurier.porte-bois', 'porte-bois', 'Porte en bois'),
    makeNode('services.serrurier.porte-smart', 'porte-intelligente', 'Porte intelligente (Smart)'),
    makeNode('services.serrurier.voiture', 'serrurier-voiture', 'Serrurier voiture'),
    makeNode('services.serrurier.moto', 'serrurier-moto', 'Serrurier moto'),
    makeNode('services.serrurier.securisation', 'systeme-securisation', 'Système de sécurisation'),
    makeNode('services.serrurier.coffre-fort', 'coffre-fort', 'Coffre-fort'),
  ]),
  makeNode('services.peintre', 'peintre', 'PEINTRE', [
    makeNode('services.peintre.interieur', 'interieur-maison', "Intérieur de maison"),
    makeNode('services.peintre.exterieur', 'exterieur-maison', "Extérieur de maison"),
    makeNode('services.peintre.immeuble', 'peintre-immeuble', "Peintre d'immeuble"),
    makeNode('services.peintre.voiture', 'peintre-voiture', "Peintre de voiture"),
    makeNode('services.peintre.moto', 'peintre-moto', "Peintre de moto"),
    makeNode('services.peintre.terrasse', 'terrasse-etanche', "Terrasse étanche"),
  ]),
]);

export const SEARCH_CATEGORIES: SearchCategoryNode[] = [
  SERVICE_TECHNIQUE,
  makeNode('root.immobilier', 'immobilier', 'IMMOBILIER', [
    makeNode('immobilier.acheter', 'acheter', 'ACHETER', [
      makeNode('immobilier.acheter.appartement', 'appartement', 'Appartement'),
      makeNode('immobilier.acheter.maison', 'maison', 'Maison'),
      makeNode('immobilier.acheter.villa', 'villa', 'Villa'),
      makeNode('immobilier.acheter.terrain', 'terrain', 'Terrain'),
      makeNode('immobilier.acheter.riad', 'riad', 'Riad'),
    ]),
    makeNode('immobilier.louer', 'louer', 'LOUER', [
      makeNode('immobilier.louer.appartement', 'appartement', 'Appartement'),
      makeNode('immobilier.louer.maison', 'maison', 'Maison'),
      makeNode('immobilier.louer.villa', 'villa', 'Villa'),
      makeNode('immobilier.louer.terrain', 'terrain', 'Terrain'),
      makeNode('immobilier.louer.riad', 'riad', 'Riad'),
    ]),
  ]),
  makeNode('root.mobilite', 'mobilite', 'MOBILITÉ', [
    makeNode('mobilite.voiture', 'voiture', 'Voiture'),
    makeNode('mobilite.moto', 'moto', 'Moto'),
    makeNode('mobilite.velo', 'velo', 'Vélo'),
  ]),
  makeNode('root.evenement', 'evenement', 'ÉVÉNEMENT', [
    makeNode('evenement.lumiere', 'lumiere', 'Lumière'),
    makeNode('evenement.decoration', 'decoration', 'Décoration', [
      makeNode('evenement.decoration.fiancailles', 'fiancailles', 'Fiançailles'),
      makeNode('evenement.decoration.mariage', 'mariage', 'Mariage'),
      makeNode('evenement.decoration.naissance', 'naissance', 'Naissance'),
    ]),
    makeNode('evenement.photographe', 'photographe', 'Photographe'),
    makeNode('evenement.negafa', 'negafa', 'Negafa'),
    makeNode('evenement.local', 'local', 'Local', [
      makeNode('evenement.local.salle', 'salle-fetes', 'Salle des fêtes'),
      makeNode('evenement.local.villa', 'villa-fetes', 'Villa des fêtes'),
      makeNode('evenement.local.chapiteau', 'chapiteau', 'Chapiteau de mariage'),
    ]),
  ]),
  makeNode('root.communaute', 'communaute', 'COMMUNAUTÉ', [
    makeNode('communaute.partenaire', "partenaire-d-activite", "PARTENAIRE D'ACTIVITÉ", [
      makeNode('communaute.partenaire.demenagement', 'aide-demenagement', 'Aide au déménagement'),
      makeNode('communaute.partenaire.entrainement', "partenaire-d-entrainement", "Partenaire d'entraînement"),
      makeNode('communaute.partenaire.linguistique', 'partenaire-linguistique', 'Partenaire linguistique', [
        makeNode('communaute.partenaire.linguistique.neerlandais', 'neerlandais', 'Néerlandais'),
        makeNode('communaute.partenaire.linguistique.italien', 'italien', 'Italien'),
        makeNode('communaute.partenaire.linguistique.anglais', 'anglais', 'Anglais'),
        makeNode('communaute.partenaire.linguistique.autres', 'autres-langues', 'Autres langues'),
      ]),
      makeNode('communaute.partenaire.football', 'tournoi-football', 'Tournoi de football'),
      makeNode('communaute.partenaire.basketball', 'tournoi-basketball', 'Tournoi de basketball'),
      makeNode('communaute.partenaire.tennis', 'partenaire-tennis', 'Partenaire de tennis'),
      makeNode('communaute.partenaire.velo', 'compagnon-velo', 'Compagnon de vélo'),
    ]),
    makeNode('communaute.garde', "garde-d-enfant", "GARDE D'ENFANT", [
      makeNode('communaute.garde.garderie', 'garderie', 'Garderie'),
      makeNode('communaute.garde.parc', 'parc-jeux', 'Parc de jeux'),
      makeNode('communaute.garde.domicile', "garde-d-enfant-a-domicile", "Garde d'enfant à domicile"),
    ]),
    makeNode('communaute.classes', 'classes', 'CLASSES', [
      makeNode('communaute.classes.jardinage', 'cours-jardinage', 'Cours de jardinage gratuit'),
      makeNode('communaute.classes.fiscale', 'cours-preparation-fiscale', 'Cours de préparation fiscale'),
      makeNode('communaute.classes.cuisine', 'cours-cuisine-marocaine', 'Cours de cuisine marocaine'),
      makeNode('communaute.classes.poterie', 'creation-poterie', 'Création de poterie'),
      makeNode('communaute.classes.parfum', 'creation-parfum', 'Création de son propre parfum'),
    ]),
    makeNode('communaute.evenements', 'evenements', 'ÉVÉNEMENTS', [
      makeNode('communaute.evenements.conference', 'conference', 'Conférence'),
      makeNode('communaute.evenements.theatre', 'theatre', 'Théâtre'),
      makeNode('communaute.evenements.encheres', 'ventes-encheres', 'Vente aux enchères'),
      makeNode('communaute.evenements.golf', 'festival-golf', 'Festival annuel de golf'),
      makeNode('communaute.evenements.airshow', 'marrakech-air-show', 'Marrakech Air Show'),
    ]),
  ]),
  makeNode('root.endroits', 'endroits', 'ENDROITS', [
    makeNode('endroits.visiter', 'endroits-a-visiter', 'ENDROITS À VISITER', [
      makeNode('endroits.visiter.jardins', 'jardins-nature', 'JARDINS ET NATURE', [
        makeNode('endroits.visiter.jardins.majorelle', 'jardin-majorelle', 'Jardin Majorelle'),
        makeNode('endroits.visiter.jardins.menara', 'jardin-menara', 'Jardin de la Ménara'),
        makeNode('endroits.visiter.jardins.agdal', 'jardins-agdal', "Jardins de l'Agdal"),
        makeNode('endroits.visiter.jardins.secret', 'jardin-secret', 'Jardin Secret'),
        makeNode('endroits.visiter.jardins.arsat', 'cyber-park-arsat', 'Cyber Park Arsat Moulay Abdeslam'),
        makeNode('endroits.visiter.jardins.palmeraie', 'palmeraie-marrakech', 'Palmeraie de Marrakech'),
        makeNode('endroits.visiter.jardins.lallahhasna', 'parc-lalla-hasna', 'Parc Lalla Hasna'),
        makeNode('endroits.visiter.jardins.oliveraie', 'oliveraie-menara', 'Oliveraie de la Ménara'),
      ]),
      makeNode('endroits.visiter.monuments', 'monuments-patrimoine', 'MONUMENTS HISTORIQUES ET PATRIMOINE', [
        makeNode('endroits.visiter.monuments.koutoubia', 'koutoubia', 'Koutoubia'),
        makeNode('endroits.visiter.monuments.benyoussef', 'medersa-ben-youssef', 'Médersa Ben Youssef'),
        makeNode('endroits.visiter.monuments.bahia', 'palais-bahia', 'Palais de la Bahia'),
        makeNode('endroits.visiter.monuments.elbadii', 'palais-el-badii', 'Palais El Badiî'),
        makeNode('endroits.visiter.monuments.saadiens', 'tombeaux-sadiens', 'Tombeaux Saadiens'),
        makeNode('endroits.visiter.monuments.babagnaou', 'bab-agnaou', 'Porte Bab Agnaou'),
        makeNode('endroits.visiter.monuments.babboujloud', 'bab-boujloud', 'Bab Boujloud'),
        makeNode('endroits.visiter.monuments.museemarrakech', 'musee-de-marrakech', 'Musée de Marrakech'),
        makeNode('endroits.visiter.monuments.museemouassine', 'musee-de-mouassine', 'Musée de Mouassine'),
        makeNode('endroits.visiter.monuments.jardinsecret', 'jardin-secret-2', 'Jardin Secret'),
        makeNode('endroits.visiter.monuments.darelbacha', 'dar-el-bacha', 'Dar El Bacha'),
        makeNode('endroits.visiter.monuments.photographie', 'maison-de-la-photographie', 'Maison de la Photographie'),
        makeNode('endroits.visiter.monuments.darsisaid', 'musee-dar-si-said', 'Musée Dar Si Saïd'),
        makeNode('endroits.visiter.monuments.femme', 'musee-de-la-femme', 'Musée de la Femme'),
        makeNode('endroits.visiter.monuments.semmarine', 'souk-semmarine', 'Souk Semmarine'),
        makeNode('endroits.visiter.monuments.teinturiers', 'souk-des-teinturiers', 'Souk des Teinturiers'),
        makeNode('endroits.visiter.monuments.bijoutiers', 'souk-des-bijoutiers', 'Souk des Bijoutiers'),
        makeNode('endroits.visiter.monuments.haddadine', 'souk-haddadine', 'Souk Haddadine'),
        makeNode('endroits.visiter.monuments.epices', 'place-des-epices', 'Place des Épices (Rahba Kedima)'),
        makeNode('endroits.visiter.monuments.ferblantiers', 'place-des-ferblantiers', 'Place des Ferblantiers'),
        makeNode('endroits.visiter.monuments.kasbah', 'quartier-de-la-kasbah', 'Quartier de la Kasbah'),
        makeNode('endroits.visiter.monuments.mouassine', 'quartier-de-mouassine', 'Quartier de Mouassine'),
        makeNode('endroits.visiter.monuments.mellah', 'quartier-mellah', 'Quartier Mellah'),
        makeNode('endroits.visiter.monuments.lazama', 'synagogue-lazama', 'Synagogue Lazama'),
      ]),
      makeNode('endroits.visiter.musees', 'musees-culture', 'MUSÉES ET CULTURE', [
        makeNode('endroits.visiter.musees.ysl', 'musee-ysl', 'Musée Yves Saint Laurent Marrakech'),
        makeNode('endroits.visiter.musees.mohammedvi', 'musee-mohammed-vi', "Musée Mohammed VI pour la civilisation de l'eau"),
        makeNode('endroits.visiter.musees.confluences', 'musee-confluences', 'Musée des Confluences – Dar El Bacha'),
        makeNode('endroits.visiter.musees.marrakech', 'musee-marrakech', 'Musée de Marrakech'),
        makeNode('endroits.visiter.musees.photographie', 'maison-photographie', 'Maison de la Photographie'),
        makeNode('endroits.visiter.musees.darsisaid', 'musee-dar-si-said', 'Musée Dar Si Saïd'),
        makeNode('endroits.visiter.musees.femme', 'musee-femme', 'Musée de la Femme de Marrakech'),
        makeNode('endroits.visiter.musees.macaal', 'musee-macaal', 'Musée MACAAL'),
        makeNode('endroits.visiter.musees.tiskiwin', 'musee-tiskiwin', 'Musée Tiskiwin'),
      ]),
      makeNode('endroits.visiter.excursions', 'excursions', 'EXCURSIONS AUTOUR DE LA VILLE', [
        makeNode('endroits.visiter.excursions.agafay', 'desert-agafay', "Désert d'Agafay"),
        makeNode('endroits.visiter.excursions.ourika', 'vallee-ourika', "Vallée de l'Ourika"),
        makeNode('endroits.visiter.excursions.settifatma', 'setti-fatma', 'Setti Fatma'),
        makeNode('endroits.visiter.excursions.ouzoud', 'cascades-ouzoud', "Cascades d'Ouzoud"),
        makeNode('endroits.visiter.excursions.lallatakerkoust', 'lac-lalla-takerkoust', 'Lac Lalla Takerkoust'),
        makeNode('endroits.visiter.excursions.kik', 'plateau-kik', 'Plateau du Kik'),
        makeNode('endroits.visiter.excursions.imlil', 'imlil', 'Imlil'),
        makeNode('endroits.visiter.excursions.toubkal', 'parc-toubkal', 'Parc national du Toubkal'),
        makeNode('endroits.visiter.excursions.asni', 'asni', 'Asni'),
        makeNode('endroits.visiter.excursions.ouirgane', 'ouirgane', 'Ouirgane'),
        makeNode('endroits.visiter.excursions.aitbenhaddou', 'ait-ben-haddou', 'Aït Ben Haddou'),
        makeNode('endroits.visiter.excursions.ouarzazate', 'ouarzazate', 'Ouarzazate'),
        makeNode('endroits.visiter.excursions.zat', 'vallee-zat', 'Vallée du Zat'),
        makeNode('endroits.visiter.excursions.palmeraie', 'palmeraie-marrakech', 'Palmeraie de Marrakech'),
        makeNode('endroits.visiter.excursions.quad', 'quad-palmeraie', 'Circuit en quad dans la Palmeraie'),
        makeNode('endroits.visiter.excursions.chameau', 'balade-chameau', 'Balade à dos de chameau'),
        makeNode('endroits.visiter.excursions.montgolfiere', 'montgolfiere', 'Vol en montgolfière autour de Marrakech'),
        makeNode('endroits.visiter.excursions.buggy', 'excursion-buggy', 'Excursion en buggy'),
      ]),
      makeNode('endroits.visiter.experiences', 'experiences', 'EXPÉRIENCES À FAIRE', [
        makeNode('endroits.visiter.experiences.diner', 'diner-traditionnel', 'Dîner traditionnel marocain'),
        makeNode('endroits.visiter.experiences.fantasia', 'spectacle-fantasia', 'Spectacle de fantasia'),
        makeNode('endroits.visiter.experiences.hammam', 'hammam-traditionnel', 'Hammam marocain traditionnel'),
        makeNode('endroits.visiter.experiences.rooftop', 'rooftop', 'Rooftop avec vue sur la médina'),
        makeNode('endroits.visiter.experiences.coucher', 'coucher-soleil', "Coucher de soleil à Jemaa el-Fna"),
        makeNode('endroits.visiter.experiences.dinerdesert', 'diner-desert', "Dîner dans le désert d'Agafay"),
        makeNode('endroits.visiter.experiences.caleche', 'balade-caleche', 'Balade en calèche'),
        makeNode('endroits.visiter.experiences.spa', 'spa-traditionnel', 'Spa traditionnel marocain'),
        makeNode('endroits.visiter.experiences.the', 'degustation-the', 'Dégustation de thé à la menthe'),
        makeNode('endroits.visiter.experiences.ruerue', 'cuisine-de-rue', 'Cuisine de rue de la médina'),
        makeNode('endroits.visiter.experiences.nocturne', 'balade-nocturne', 'Balade nocturne dans la médina'),
      ]),
      makeNode('endroits.visiter.cafes', 'cafes', 'Cafés'),
      makeNode('endroits.visiter.restaurants', 'restaurants', 'Restaurants'),
      makeNode('endroits.visiter.parcs', 'parcs', 'Parcs'),
      makeNode('endroits.visiter.piscines', 'piscines', 'Piscines'),
      makeNode('endroits.visiter.hotels', 'hotels', 'Hôtels'),
      makeNode('endroits.visiter.sport', 'salles-sport', 'SALLES DE SPORT', [
        makeNode('endroits.visiter.sport.karate', 'karate', 'Karaté'),
        makeNode('endroits.visiter.sport.yoga', 'yoga', 'Yoga'),
        makeNode('endroits.visiter.sport.musculation', 'musculation', 'Musculation'),
      ]),
    ]),
  ]),
  makeNode('root.vendre', 'a-vendre', 'À VENDRE', [
    makeNode('vendre.vehicules', 'vehicules', 'VÉHICULES', [
      makeNode('vendre.vehicules.voiture', 'voiture', 'VOITURE', [
        makeNode('vendre.vehicules.voiture.annonces', 'voiture-annonces', 'Voiture'),
        makeNode('vendre.vehicules.voiture.pieces', 'pieces-voiture', 'Pièces de voiture'),
        makeNode('vendre.vehicules.voiture.roues', 'roues-pneus-voiture', 'Roues et pneus de voiture'),
      ]),
      makeNode('vendre.vehicules.moto', 'moto', 'MOTO', [
        makeNode('vendre.vehicules.moto.annonces', 'moto-annonces', 'Moto'),
        makeNode('vendre.vehicules.moto.pieces', 'pieces-moto', 'Pièces de moto'),
        makeNode('vendre.vehicules.moto.roues', 'roues-pneus-moto', 'Roues et pneus de moto'),
      ]),
      makeNode('vendre.vehicules.velo', 'velo', 'VÉLO', [
        makeNode('vendre.vehicules.velo.annonces', 'velo-annonces', 'Vélo'),
        makeNode('vendre.vehicules.velo.pieces', 'pieces-velo', 'Pièces de vélo'),
        makeNode('vendre.vehicules.velo.roues', 'roues-pneus-velo', 'Roues et pneus de vélo'),
      ]),
      makeNode('vendre.vehicules.camion', 'camion', 'CAMION', [
        makeNode('vendre.vehicules.camion.camion', 'camion-annonces', 'Camion'),
        makeNode('vendre.vehicules.camion.remorque', 'remorque', 'Remorque'),
      ]),
    ]),
    makeNode('vendre.entikiter', 'entikiter', 'ENTIKITER', [
      makeNode('vendre.entikiter.preciser', 'a-preciser', 'À préciser'),
    ]),
  ]),
];

export function getCategoryLabel(node: SearchCategoryNode, locale: string) {
  if (node.labels && node.labels[locale]) return node.labels[locale];
  if (node.labels && node.labels.fr) return node.labels.fr;
  return node.slug;
}
