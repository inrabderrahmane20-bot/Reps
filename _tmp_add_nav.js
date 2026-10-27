const fs = require('fs');
const langs = ['fr','en','ar'];
langs.forEach(function(l){
  const p = 'src/messages/' + l + '.json';
  const d = JSON.parse(fs.readFileSync(p));
  if(!d.nav) d.nav = {};
  if(l === 'fr') d.nav.favorites = 'Mes favoris';
  else if(l === 'en') d.nav.favorites = 'Favorites';
  else d.nav.favorites = 'المفضلة';
  fs.writeFileSync(p, JSON.stringify(d));
});
console.log('done');
