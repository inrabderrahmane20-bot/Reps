import json
for l in ['fr','en','ar']:
    p = 'src/messages/%s.json' % l
    d = json.load(open(p))
    if 'nav' not in d: d['nav'] = {}
    if l == 'fr': d['nav']['favorites'] = 'Mes favoris'
    elif l == 'en': d['nav']['favorites'] = 'Favorites'
    else: d['nav']['favorites'] = 'المفضلة'
    json.dump(d, open(p,'w'))
print('ok')
