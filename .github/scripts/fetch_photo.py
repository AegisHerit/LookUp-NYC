"""Download a landmark photo from Wikimedia Commons, save it as WebP, and add its credit.

Usage: python fetch_photo.py <place-id> <Wikipedia article title> [Commons file name]
"""
import io, json, re, sys, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[2]
place_id, article = sys.argv[1], sys.argv[2]
file_name = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else None
headers = {'User-Agent': 'LookUpNYC/1.0 (landmark guide; github.com/AegisHerit/LookUp-NYC)'}

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60).read()

def api(base, **params):
    return json.loads(get(base + '?' + urllib.parse.urlencode({**params, 'format': 'json'})))

if not file_name:
    pages = api('https://en.wikipedia.org/w/api.php', action='query', titles=article, prop='pageimages', piprop='name')['query']['pages']
    file_name = next(iter(pages.values()))['pageimage']
print('File:', file_name)

info = next(iter(api('https://commons.wikimedia.org/w/api.php', action='query', titles='File:' + file_name,
                     prop='imageinfo', iiprop='url|extmetadata', iiurlwidth=1280)['query']['pages'].values()))['imageinfo'][0]
meta = info['extmetadata']
strip = lambda s: re.sub(r'<[^>]+>', '', s or '').strip()
author = strip(meta.get('Artist', {}).get('value')) or 'Unknown'
license_name = strip(meta.get('LicenseShortName', {}).get('value'))
print('Author:', author, '| License:', license_name)
if not re.search(r'CC|Public domain|PD', license_name, re.I):
    sys.exit('Not a free license, stopping.')

img = Image.open(io.BytesIO(get(info['thumburl']))).convert('RGB')
img.thumbnail((1280, 1400))
img.save(root / 'dist/assets' / f'{place_id}.webp', 'WEBP', quality=80, method=6)
print('Saved', img.size)

credits_path = root / 'dist/credits.js'
text = credits_path.read_text()
credits = json.loads(text[text.index('{'):text.rindex('}') + 1])
credits[place_id] = {'author': author, 'license': license_name, 'url': info['descriptionurl']}
credits_path.write_text('const CREDITS = ' + json.dumps(credits, indent=2, ensure_ascii=False) + ';\n')
