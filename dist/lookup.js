// Look Up mode: hands-free arrival on a walk.
// One tap turns on live location, unlocks audio, and keeps the screen awake. When you've stood
// near a stop for a few seconds, a full-screen "Look up" view shows exactly where to look,
// with the detail circled on the photo, then reads the cue and the place's story aloud.
// Builds on app.js (live location, progress, places) and audio-ui.js (launchAudio, player).
const LookUp=(()=>{
  const RANGE_MILES=0.03;   // about 50 meters, the same as the regular arrival card
  const DWELL_MS=5000;      // stay this long in range, so walking past doesn't count
  const SPOT_KEY='lookup-spotted',SAFETY_KEY='lookup-safety-seen';
  let on=false,walkId=null,wake=null,audioCtx=null,dwell=null,dwellTimer=null;
  const shown=new Set();
  // Demo mode, for showing the app without walking: turn on with ?demo=1 (off with ?demo=0)
  // or the switch in the About panel. Location isn't used; an "Arrive" button stands in for walking.
  const DEMO_KEY='lookup-demo';
  {const q=new URLSearchParams(location.search).get('demo');if(q==='1')putStore(DEMO_KEY,true);if(q==='0')putStore(DEMO_KEY,false)}
  const demo=()=>readStore(DEMO_KEY,false)===true;
  const walk=()=>WALKS.find(w=>w.id===walkId);
  const still=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Details people have spotted, kept on this device.
  function spotted(){const v=readStore(SPOT_KEY,[]);return Array.isArray(v)?v.filter(x=>x&&byId(x.id)&&byId(x.id).lookUp):[]}
  const isSpotted=id=>spotted().some(x=>x.id===id);
  function toggleSpotted(id){const list=spotted(),had=list.some(x=>x.id===id);putStore(SPOT_KEY,had?list.filter(x=>x.id!==id):[...list,{id,at:Date.now()}]);return !had}

  // Browsers only allow sound after a tap, so open the audio paths during the start tap.
  function unlockAudio(){
    try{const AC=window.AudioContext||window.webkitAudioContext;if(AC){audioCtx=audioCtx||new AC();audioCtx.resume()}}catch{}
    try{if(window.speechSynthesis){const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u)}}catch{}
  }
  function chime(){if(!audioCtx)return;try{const t=audioCtx.currentTime;[[880,0],[1320,.16]].forEach(([f,d])=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.18,t+d+.02);g.gain.exponentialRampToValueAtTime(.001,t+d+.6);o.connect(g).connect(audioCtx.destination);o.start(t+d);o.stop(t+d+.65)})}catch{}}

  // Keep the screen on while walking. Not every browser supports this; that's fine.
  async function keepAwake(){if(!on||wake||!('wakeLock' in navigator))return;try{wake=await navigator.wakeLock.request('screen');wake.addEventListener('release',()=>{wake=null})}catch{wake=null}}
  document.addEventListener('visibilitychange',()=>{if(on&&document.visibilityState==='visible')keepAwake()});

  function start(id){if(!WALKS.some(w=>w.id===id))return;if(readStore(SAFETY_KEY,false)===true)begin(id);else safety(id)}
  function begin(id){
    on=true;walkId=id;dwell=null;unlockAudio();keepAwake();
    if(demo())shown.clear();else if(watchId===null)startLive();
    bar();refreshButtons();toast(demo()?'Demo mode: tap Arrive to stand at each stop.':'Look Up mode is on. Walk to the first stop; we’ll tell you when to look up.');
    if(locationPoint)onFix();
  }
  function end(){
    on=false;walkId=null;clearTimeout(dwellTimer);dwell=null;
    try{window.speechSynthesis&&speechSynthesis.cancel()}catch{}
    try{player.stop()}catch{}
    if(wake){wake.release().catch(()=>{});wake=null}
    if(watchId!==null)stopLive();else if(demo()){locationPoint=null;refreshLive(true)}
    document.getElementById('lookup-bar')?.remove();closeView();refreshButtons();toast('Look Up mode is off.');
  }

  // One-time reminder before the first start.
  function safety(id){
    const d=document.createElement('div');d.className='lookup-safety';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','lookup-safety-title');
    d.innerHTML=`<div class="lookup-safety-card"><span class="lookup-safety-icon" aria-hidden="true">↑</span><h2 id="lookup-safety-title">Eyes up, feet aware.</h2><p>We’ll tell you when to look up. Please stop somewhere safe first: never while crossing a street or walking through traffic.</p><button class="button" data-lookup-ok>Got it, start</button><button class="text-link" data-lookup-cancel>Not now</button></div>`;
    document.body.appendChild(d);d.querySelector('[data-lookup-ok]').focus();
    d.querySelector('[data-lookup-ok]').onclick=()=>{putStore(SAFETY_KEY,true);d.remove();begin(id)};
    d.querySelector('[data-lookup-cancel]').onclick=()=>d.remove();
  }

  // Small status bar while the mode is on.
  function nextStop(){const w=walk();if(!w)return null;const done=demo()?[]:progress[w.id]||[];const id=w.stops.find(s=>!done.includes(s)&&!shown.has(s));return id?byId(id):null}
  function bar(){
    if(!on)return;let el=document.getElementById('lookup-bar');
    if(!el){el=document.createElement('div');el.id='lookup-bar';el.className='lookup-bar';el.setAttribute('role','status');document.body.appendChild(el)}
    const n=nextStop(),d=n&&locationPoint?` · ${LookUpRoutes.distanceText(distance(n))}`:'';
    const waiting=dwell&&byId(dwell.id),line=waiting?`Arriving at ${esc(waiting.name)}… hold still`:n?`Next: ${esc(n.name)}${d}`:(locationPoint||demo())?'Every stop visited. Nicely done.':'Finding your location…';
    el.innerHTML=`<span class="lookup-bar-arrow" aria-hidden="true">↑</span><span class="lookup-bar-text"><strong>Look Up mode${demo()?' · Demo':''}</strong><span>${line}</span></span>${demo()&&n&&!waiting?`<button class="lookup-demo" data-lookup="demo-arrive">Arrive ▸</button>`:''}<button data-lookup="end">End</button>`;
  }

  // Called by checkArrival() on every location update while the mode is on.
  function onFix(){
    if(!on)return;bar();const w=walk();if(!w||!locationPoint)return;
    const near=w.stops.map(byId).filter(p=>!shown.has(p.id)&&distance(p)<=RANGE_MILES).sort((a,b)=>distance(a)-distance(b))[0];
    if(!near){clearTimeout(dwellTimer);dwell=null;return}
    if(dwell&&dwell.id===near.id)return;
    clearTimeout(dwellTimer);dwell={id:near.id};bar();
    dwellTimer=setTimeout(()=>{const p=byId(dwell&&dwell.id);if(on&&p&&locationPoint&&distance(p)<=RANGE_MILES)arrive(p);else dwell=null},DWELL_MS);
  }

  function arrive(p){
    shown.add(p.id);dwell=null;const w=walk();let finished=false;
    if(w&&!(progress[w.id]||[]).includes(p.id)){progress[w.id]=[...(progress[w.id]||[]),p.id];putStore('lookup-progress',progress);if(location.hash==='#route/'+w.id){const y=scrollY;render();scrollTo(0,y)}finished=progress[w.id].length===w.stops.length}
    chime();if(navigator.vibrate)navigator.vibrate([90,60,90]);
    document.getElementById('arrival')?.remove();showView(p);bar();speak(p);
    // The story waits until this view is closed. In demo mode a finished route can be replayed,
    // so there it shows once every stop has been reached this time.
    if((finished||(demo()&&w&&w.stops.every(s=>shown.has(s))))&&typeof Story!=='undefined')Story.open(w.id);
  }
  // Read the cue, then play the place's story (recording or device voice).
  function speak(p){
    try{player.stop()}catch{}
    const story=()=>{if(on&&document.getElementById('lookup-view'))launchAudio(p.id)};
    if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){story();return}
    try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance('Look up. '+p.lookUp);u.lang='en-US';u.onend=story;u.onerror=story;speechSynthesis.speak(u)}catch{story()}
  }

  function photo(p,cls){const c=p.lookUpCrop;return `<span class="${cls}"><img src="assets/${p.id}.webp" alt="${esc(p.name)}">${c?`<span class="lookup-ring" style="--x:${c.x}%;--y:${c.y}%;--r:${c.r}%"></span>`:''}</span>`}
  function spotButton(p){const s=isSpotted(p.id);return `<button class="button ${s?'secondary':''}" data-lookup="spot" data-id="${p.id}" aria-pressed="${s}">${s?'Spied ✓':'I spy it ✓'}</button>`}
  function showView(p){
    closeView();const w=walk(),i=w?w.stops.indexOf(p.id):-1;
    const v=document.createElement('div');v.id='lookup-view';v.className='lookup-view';v.setAttribute('role','dialog');v.setAttribute('aria-modal','true');v.setAttribute('aria-labelledby','lookup-cue');
    v.innerHTML=`<div class="lookup-inner"><div class="lookup-top"><span class="lookup-up" aria-hidden="true">↑</span><span class="eyebrow">LOOK UP${i>=0?` · STOP ${i+1} OF ${w.stops.length}`:''}</span><button class="lookup-close" data-lookup="close" aria-label="Close">×</button></div>
     <h2 class="lookup-name">${esc(p.name)}</h2><p class="lookup-cue" id="lookup-cue">${esc(p.lookUp)}</p>
     <figure class="lookup-photo">${photo(p,'lookup-frame')}</figure>
     <div class="lookup-actions">${spotButton(p)}<button class="button secondary" data-lookup="replay" data-id="${p.id}">Hear it again</button><a class="text-link" href="#place/${p.id}" data-lookup="story">Read the story</a></div>
     ${demo()?`<button class="button lookup-skip" data-lookup="demo-skip">${nextStop()?'Skip to next stop ▸':'Finish route ▸'}</button>`:''}
     <button class="lookup-end" data-lookup="end">End Look Up mode</button></div>`;
    document.body.appendChild(v);document.body.classList.add('lookup-open');v.querySelector('[data-lookup="spot"]').focus({preventScroll:true});
  }
  function closeView(){document.getElementById('lookup-view')?.remove();document.body.classList.remove('lookup-open')}

  // The start/end button on route pages.
  function button(w){return on&&walkId===w.id?`<button class="button lookup-start on" data-lookup="end">End Look Up mode</button>`:`<button class="button lookup-start" data-lookup="start" data-walk="${w.id}"><span aria-hidden="true">↑</span>Start Look Up mode</button>`}
  function refreshButtons(){document.querySelectorAll('.lookup-start').forEach(b=>{const id=b.dataset.walk||walkId||location.hash.split('/')[1];const w=WALKS.find(x=>x.id===id);if(w)b.outerHTML=button(w)})}

  // The "I Spy" collection on the Saved page.
  function savedSection(){
    const list=spotted().sort((a,b)=>b.at-a.at);if(!list.length)return '';
    return `<section class="spotted-section"><span class="eyebrow">LOOK UP MODE</span><h2>I Spy</h2><p class="spotted-sub">Details you’ve found on your walks.</p><div class="spotted-grid">${list.map(({id,at})=>{const p=byId(id),c=p.lookUpCrop||{x:50,y:50,r:30};
      return `<a class="spotted-card" href="#place/${id}"><span class="spot-thumb"><img src="assets/${id}.webp" alt="" loading="lazy" style="--x:${c.x};--y:${c.y};--r:${c.r}"></span><span class="spot-copy"><strong>${esc(p.name)}</strong><span>${esc(p.lookUp)}</span><small>Spied ${new Date(at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</small></span></a>`}).join('')}</div></section>`;
  }

  document.addEventListener('click',e=>{const b=e.target.closest('[data-lookup]');if(!b)return;const a=b.dataset.lookup;
    if(a==='start'){e.preventDefault();start(b.dataset.walk)}
    else if(a==='end'){e.preventDefault();end()}
    else if(a==='close'){closeView()}
    else if(a==='story'){closeView()}
    else if(a==='demo-skip'){try{speechSynthesis.cancel()}catch{}try{player.stop()}catch{}clearTimeout(dwellTimer);dwell=null;closeView();const n=nextStop();if(n){locationPoint={lat:n.lat,lng:n.lng};arrive(n)}else bar()}
    else if(a==='demo-arrive'){const n=nextStop();if(n){locationPoint={lat:n.lat,lng:n.lng};onFix()}}
    else if(a==='replay'){const p=byId(b.dataset.id);if(p)speak(p)}
    else if(a==='spot'){const p=byId(b.dataset.id);if(!p)return;const now=toggleSpotted(p.id);b.outerHTML=spotButton(p);toast(now?'Nice eye. Added to your I Spy collection.':'Removed from your I Spy collection.')}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('lookup-view'))closeView()});

  // The first page is drawn before this file loads; add our pieces if they're missing.
  function fillIn(){const [page,id]=(location.hash.slice(1)||'explore').split('/');
    if(page==='route'){const a=document.querySelector('.route-actions'),w=WALKS.find(x=>x.id===id);if(a&&w&&!a.querySelector('.lookup-start'))a.insertAdjacentHTML('afterbegin',button(w))}
    if(page==='saved'&&!document.querySelector('.spotted-section'))main.insertAdjacentHTML('beforeend',savedSection())}
  fillIn();
  {const about=document.getElementById('about-dialog');if(about&&!about.querySelector('.demo-switch')){
    about.insertAdjacentHTML('beforeend',`<label class="demo-switch"><input type="checkbox" ${demo()?'checked':''}><span><strong>Demo mode</strong>Show Look Up mode and route stories without walking.</span></label>`);
    about.querySelector('.demo-switch input').addEventListener('change',e=>{putStore(DEMO_KEY,e.target.checked);toast(e.target.checked?'Demo mode on. Start Look Up mode on any route.':'Demo mode off.');if(on)bar()})}}

  return {active:()=>on,onFix,button,savedSection,start,end};
})();
