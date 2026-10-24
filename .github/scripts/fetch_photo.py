"""Download landmark photos from Wikimedia Commons, save them as WebP, and add their credits.

Usage: python fetch_photo.py "<id>=<source>" ["<id>=<source>" ...]
A source is one of:
  Puck Building                  an English Wikipedia article (uses its main image)
  File:Some photo.jpg            a specific Commons file
  search:57 Great Jones Street   the first photo a Commons search finds
"""
import io, json, re, sys, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[2]
headers = {'User-Agent': 'LookUpNYC/1.0 (landmark guide; github.com/AegisHerit/LookUp-NYC)'}

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60).read()

def api(base, **params):
    return json.loads(get(base + '?' + urllib.parse.urlencode({**params, 'format': 'json'})))

def find_file(source):
    if source.startswith('File:'):
        return source[5:]
    if source.startswith('search:'):
        pages = api('https://commons.wikimedia.org/w/api.php', action='query', list='search', srnamespace=6,
                    srsearch=source[7:] + ' filetype:bitmap', srlimit=10)['query']['search']
        for p in pages:
            if re.search(r'\.(jpe?g|png)$', p['title'], re.I):
                return p['title'][5:]
        raise SystemExit(f'No Commons photo found for {source}')
    pages = api('https://en.wikipedia.org/w/api.php', action='query', titles=source, prop='pageimages', piprop='name', redirects=1)['query']['pages']
    page = next(iter(pages.values()))
    if 'pageimage' not in page:
        print(f'No main image on Wikipedia article {source}; searching Commons instead.')
        return find_file('search:' + source)
    return page['pageimage']

strip = lambda s: re.sub(r'<[^>]+>', '', s or '').strip()
credits_path = root / 'dist/credits.js'
text = credits_path.read_text()
credits = json.loads(text[text.index('{'):text.rindex('}') + 1])

failed = []
for spec in sys.argv[1:]:
    place_id, source = (s.strip() for s in spec.split('=', 1))
    try:
        file_name = find_file(source)
        info = next(iter(api('https://commons.wikimedia.org/w/api.php', action='query', titles='File:' + file_name,
                             prop='imageinfo', iiprop='url|extmetadata', iiurlwidth=1280)['query']['pages'].values()))['imageinfo'][0]
        meta = info['extmetadata']
        author = strip(meta.get('Artist', {}).get('value')) or 'Unknown'
        license_name = strip(meta.get('LicenseShortName', {}).get('value'))
        print(f'{place_id}: {file_name} | {author} | {license_name}')
        if not re.search(r'CC|Public domain|PD', license_name, re.I):
            raise SystemExit('not a free license')
        img = Image.open(io.BytesIO(get(info['thumburl']))).convert('RGB')
        img.thumbnail((1280, 1400))
        img.save(root / 'dist/assets' / f'{place_id}.webp', 'WEBP', quality=80, method=6)
        credits[place_id] = {'author': author, 'license': license_name, 'url': info['descriptionurl']}
    except BaseException as e:
        print(f'{place_id}: FAILED ({e})')
        failed.append(place_id)

credits_path.write_text('const CREDITS = ' + json.dumps(credits, indent=2, ensure_ascii=False) + ';\n')
if failed:
    print('Could not fetch:', ', '.join(failed))
