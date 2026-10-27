const fs=require('fs');
['fr','en','ar'].forEach(l=>{
  const p='src/messages/'+l+'.json';
  const d=JSON.parse(fs.readFileSync(p));
  if(!d.favorites){
    if(l==='fr') d.favorites={title:'Mes favoris',subtitle:'Retrouvez vos prestataires, annonces, lieux et activités favoris',providers:'Prestataires',listings:'Annonces',places:'Lieux',activities:'Activités',communities:'Communautés et partenaires',invitations:'Invitations',savedSearches:'Recherches enregistrées',emptySection:'Aucun élément pour le moment'};
    else if(l==='en') d.favorites={title:'My favorites',subtitle:'Find your favorite providers, listings, places and activities',providers:'Providers',listings:'Listings',places:'Places',activities:'Activities',communities:'Communities & partners',invitations:'Invitations',savedSearches:'Saved searches',emptySection:'No items yet'};
    else d.favorites={title:'المفضلة',subtitle:'اعثر على مقدمي الخدمات والإعلانات والأماكن والأنشطة المفضلة لديك',providers:'مقدمو الخدمات',listings:'الإعلانات',places:'الأماكن',activities:'الأنشطة',communities:'المجتمعات والشركاء',invitations:'الدعوات',savedSearches:'عمليات البحث المحفوظة',emptySection:'لا توجد عناصر بعد'};
    fs.writeFileSync(p, JSON.stringify(d));
    console.log(l);
  }
});
