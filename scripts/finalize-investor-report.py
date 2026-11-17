"""Validate and replace the investor PDF, retaining the previous edition locally."""
from pathlib import Path
import json
import shutil
import sys

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / '.local-data/pdf-tools'))
import fitz

work = root / '.local-data/investor-update'
target = root / 'reports/investor-2026-11-16/ANNABID_PLATFORM_ANALYSIS.pdf'
checks = json.loads((work / 'layout-check.json').read_text(encoding='utf-8'))
assert len(checks) == 25 and not any(row['overlap'] for row in checks)
document = fitz.open(work / 'ANNABID_UPDATED.pdf')
assert len(document) == 25
for number, page in enumerate(document, 1):
    assert len(page.get_text()) > 250, f'Empty page {number}'
    for block in page.get_text('dict')['blocks']:
        if block.get('type') != 0:
            continue
        for line in block['lines']:
            for span in line['spans']:
                x0, y0, x1, y1 = span['bbox']
                assert x0 >= 0 and y0 >= 0 and x1 <= page.rect.width + 1 and y1 <= page.rect.height + 1, f'Text clipped on page {number}'
document.set_metadata({'title': 'Annabid — Dossier investisseurs — 17 novembre 2026', 'author': 'Analyse du projet Annabid', 'subject': 'Objectifs, produit, trafic, performance, sécurité et capacité de montée en charge', 'keywords': 'Annabid, Marrakech, investisseurs, analyse, architecture, sécurité', 'creator': 'Rapport HTML et captures réelles du site', 'producer': 'Chromium / PyMuPDF'})
document.set_toc([[1, row['title'].replace('\n', ' '), row['page']] for row in checks])
backup = work / 'ANNABID_PLATFORM_ANALYSIS.before-update.pdf'
if target.exists() and not backup.exists():
    shutil.copy2(target, backup)
document.save(target, garbage=4, deflate=True)
document.close()
check = fitz.open(target)
assert len(check) == 25 and len(check.get_toc()) == 25
print(json.dumps({'file': str(target), 'pages': len(check), 'bookmarks': len(check.get_toc()), 'bytes': target.stat().st_size, 'text_characters': sum(len(p.get_text()) for p in check)}))
