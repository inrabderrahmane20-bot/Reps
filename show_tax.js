const fs = require('fs');
const t = JSON.parse(fs.readFileSync('src/data/category-taxonomy.json','utf8'));
console.log(JSON.stringify(t, null, 2));
