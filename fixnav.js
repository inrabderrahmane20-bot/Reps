const fs = require('fs');
['fr','en','ar'].forEach(l => {
  const p = 'src/messages/' + l + '.json';
  const d = JSON.parse(fs.readFileSync(p));
  if (l === 'fr') d.nav.favorites = 'Mes favoris';
  else if (l === 'en') d.nav.favorites = 'Favorites';
  else d.nav.favorites = 'المفضلة';
  fs.writeFileSync(p, JSON.stringify(d));
});
console.log('done');
