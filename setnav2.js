const fs=require('fs');
const path='C:/Users/inrab/Documents/GitHub/Norsalem/src/messages/';
['fr','en','ar'].forEach(function(l){
  var p=path+l+'.json';
  var d=JSON.parse(fs.readFileSync(p));
  if(!d.nav)d.nav={};
  if(l==='fr') d.nav.favorites='Mes favoris';
  else if(l==='en') d.nav.favorites='Favorites';
  else d.nav.favorites='المفضلة';
  fs.writeFileSync(p, JSON.stringify(d));
});
console.log('ok');
