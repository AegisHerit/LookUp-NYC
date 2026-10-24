import urllib.request, urllib.parse, json, concurrent.futures, os, re
from pathlib import Path
base=str(Path(__file__).resolve().parent)
headers={'User-Agent':'Cityside/1.0 (educational landmark guide)'}
def get(u):
 return urllib.request.urlopen(urllib.request.Request(u,headers=headers),timeout=40).read()
d=json.load(open(base+'/image-metadata.json'))['query']['pages']
ids={'Flatiron Building':'flatiron','Grand Central Terminal':'grandcentral','New York Public Library Main Branch':'nypl','Jefferson Market Library':'jefferson','Washington Square Arch':'washington','Plaza Hotel':'plaza','E. V. Haughwout Building':'haughwout'}
def dl(p):
 if 'thumbnail' not in p:return
 slug=ids[p['title']]
 try:
  b=get(p['thumbnail']['source'].split('?')[0]);open(base+'/dist/assets/'+slug+'.jpg','wb').write(b)
  print(slug,len(b),flush=True)
 except Exception as e:print(slug,str(e),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=7) as ex:list(ex.map(dl,d.values()))
files=['File:'+p['pageimage'] for p in d.values() if 'pageimage' in p]
u='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode({'action':'query','titles':'|'.join(files),'prop':'imageinfo','iiprop':'extmetadata','format':'json'})
try:
 meta=json.loads(get(u));json.dump(meta,open(base+'/image-credits.json','w'),indent=2)
 print('credits saved',flush=True)
except Exception as e:print(e,flush=True)
