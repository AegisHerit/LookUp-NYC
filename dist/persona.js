// "I'm visiting" vs "I live here": small differences that follow the choice past the front page.
// Visitors get the famous hook and time hints for a day of sightseeing.
// Locals get the detail they've walked past, short loops, their progress, and history first.
(()=>{
  // One line per building for locals: the thing you've walked past without noticing.
  const LOCAL_HOOKS={
    flatiron:'Next time on 23rd, look up: the top flares out like a hat brim.',
    nypl:'Past the lions, a row of stone figures keeps watch over Fifth.',
    grandcentral:'Above the commuter rush, Mercury guards a Tiffany-glass clock.',
    plaza:'A French château that decided to grow 19 stories.',
    jefferson:'That clock tower was once a fire lookout.',
    washington:'Above the arch, Washington’s own words run across the top.',
    haughwout:'A clock set into the cast iron, still keeping Broadway on time.',
    puck:'A gilded Puck in a top hat, ready to mock you personally.',
    oldcathedral:'Decades older than the “new” St. Patrick’s. Find the round window.',
    germania:'That crown of green copper? Someone lives under it.',
    bayard:'Winged figures under the cornice. Most people never look up.',
    basquiat:'The arched window on the second floor was Basquiat’s studio.',
    publictheater:'Stone urns on the roof, over what were a library’s reading rooms.'
  };
  // Featured routes for locals when location is off: a short loop and a longer weekend walk.
  const LOCAL_PICKS=['castiron','plottwists'];

  function hint(w){const m=w.minutes;
    if(mode==='local')return m<=30?'A lunch-break loop':m<=75?'An after-work stroll':'A weekend wander';
    return m<=30?'A quick detour':m<=75?'Fits an afternoon':'Make a morning of it'}

  const basePlaceCard=placeCard,baseWalkCard=walkCard,baseFeatured=featuredRoutes;
  placeCard=function(p){const html=basePlaceCard(p),line=LOCAL_HOOKS[p.id];
    return mode==='local'&&line?html.replace(`<p>${p.teaser}</p>`,`<p class="local-hook"><span>Look up</span>${line}</p>`):html};
  walkCard=function(w){return baseWalkCard(w).replace(`${w.area} · SELF-GUIDED WALK`,`${w.area} · ${hint(w).toUpperCase()}`)};
  featuredRoutes=function(){if(locationPoint||mode!=='local')return baseFeatured();
    return LOCAL_PICKS.map(id=>WALKS.find(w=>w.id===id)).filter(Boolean)};

  // The first page was drawn before this file loaded; redraw card pages so they pick up the changes.
  if(['explore','routes','saved'].includes((location.hash.slice(1)||'explore').split('/')[0]))render();

  function routesWalked(){return WALKS.filter(w=>(progress[w.id]||[]).length===w.stops.length).length}

  function fillIn(){const [page,id]=(location.hash.slice(1)||'explore').split('/');if(mode!=='local')return;
    // Front page: how many routes you've walked, once you've walked one.
    if(page==='explore'){const grid=document.getElementById('explore-routes'),n=routesWalked();
      if(grid&&n&&!document.querySelector('.route-tally'))grid.insertAdjacentHTML('afterend',`<p class="route-tally">${icon('walk')}You’ve walked ${n} of ${WALKS.length} routes. <a class="text-link inline" href="#routes">Pick your next</a></p>`)}
    // Building page: what to spot and what it used to be, before the story you may already know.
    if(page==='place'){const body=document.querySelector('.detail-body');if(!body||body.dataset.local)return;
      const story=body.querySelector('.story-section'),looks=body.querySelector('.look-list')?.closest('.story-section'),then=body.querySelector('.then-section');
      if(!story||!looks)return;body.dataset.local='1';
      looks.querySelector('.eyebrow').textContent='NEXT TIME YOU PASS';looks.querySelector('h2').textContent='Three things you’ve walked past.';
      story.before(looks);if(then)story.before(then)}
  }
  new MutationObserver(fillIn).observe(document.getElementById('main'),{childList:true});fillIn();

  // Say what changed when someone switches, since most of it shows further down the page.
  document.addEventListener('click',e=>{const b=e.target.closest('[data-action="mode"]');if(!b)return;
    toast(b.dataset.mode==='local'?'For locals: the details you’ve walked past, and shorter loops.':'For visitors: the big stories, and walks that fit your day.')});
})();
