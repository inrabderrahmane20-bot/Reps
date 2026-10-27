const fs=require('fs');
var d=JSON.parse(fs.readFileSync('src/messages/fr.json'));
if(!d.nav.favorites){d.nav.favorites='Mes favoris';fs.writeFileSync('src/messages/fr.json',JSON.stringify(d));}
d=JSON.parse(fs.readFileSync('src/messages/en.json'));
if(!d.nav.favorites){d.nav.favorites='Favorites';fs.writeFileSync('src/messages/en.json',JSON.stringify(d));}
d=JSON.parse(fs.readFileSync('src/messages/ar.json'));
if(!d.nav.favorites){d.nav.favorites='المفضلة';fs.writeFileSync('src/messages/ar.json',JSON.stringify(d));}
console.log('ok');
