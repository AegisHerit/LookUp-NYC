"""List Wikimedia Commons photos for a few searches, with date, author, license and source.

Usage: python commons_search.py "query one" "query two" ...
Prints candidates only; nothing is downloaded or committed.
"""
import json, re, sys, urllib.parse, urllib.request

headers = {'User-Agent': 'LookUpNYC/1.0 (landmark guide; github.com/AegisHerit/LookUp-NYC)'}
def api(**params):
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({**params, 'format': 'json'})
    return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60).read())
strip = lambda s: re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', s or '')).strip()

for query in sys.argv[1:]:
    print(f'\n=== {query}')
    res = api(action='query', generator='search', gsrnamespace=6, gsrsearch=query, gsrlimit=15,
              prop='imageinfo', iiprop='extmetadata|size')
    pages = sorted((res.get('query') or {}).get('pages', {}).values(), key=lambda p: p.get('index', 0))
    for p in pages:
        info = (p.get('imageinfo') or [{}])[0]
        m = info.get('extmetadata', {})
        get = lambda k: strip(m.get(k, {}).get('value'))[:140]
        print(f"- {p['title']} | {info.get('width')}x{info.get('height')} | date: {get('DateTimeOriginal') or get('DateTime')} | "
              f"license: {get('LicenseShortName')} | author: {get('Artist')} | credit: {get('Credit')} | desc: {get('ImageDescription')}")
