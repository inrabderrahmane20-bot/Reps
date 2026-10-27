var fs = require('fs');
var base = 'C:/Users/inrab/Documents/GitHub/Norsalem/src/messages/';
['fr','en','ar'].forEach(function(l){
  var p = base + l + '.json';
  var d = JSON.parse(fs.readFileSync(p));
  if(!d.nav) d.nav = {};
  if(l==='fr') d.nav.favorites = 'Mes favoris';
  if(l==='en') d.nav.favorites = 'Favorites';
  if(l==='ar') d.nav.favorites = 'المفضلة';
  fs.writeFileSync(p, JSON.stringify(d));
});
console.log('ok');
