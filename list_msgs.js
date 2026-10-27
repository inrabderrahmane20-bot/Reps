const fs = require('fs');
const files = fs.readdirSync('src/messages');
files.forEach(f=>{ console.log('===',f); try { const j=JSON.parse(fs.readFileSync('src/messages/'+f)); if(j.nav) console.log(JSON.stringify(j.nav)); } catch(e){console.log('ERR');} });
