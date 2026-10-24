// "Then": historic images on a building's page.
// Every image is public domain, from Wikimedia Commons scans of the Library of Congress,
// the New York Public Library, and old publications. Licenses and links are in credits.js.
const HISTORIC={
  puck:[
    {img:'historic-puck-1',year:'1893',caption:'The Puck Building at East Houston and Mulberry Streets, a few years before Lafayette Street was cut through and the west front was rebuilt.',source:'King’s Handbook of New York City'},
    {img:'historic-puck-2',year:'1893',caption:'“Put up before Hunt’s time,” a Puck cover by Louis Dalrymple. The magazine’s color pages were printed in this building.',source:'Library of Congress'}
  ],
  oldcathedral:[
    {img:'historic-oldcathedral-1',year:'1830',caption:'The cathedral as first built, with the steeple it had then, drawn by Alexander Jackson Davis decades before the 1866 fire.',source:'New York Public Library'},
    {img:'historic-oldcathedral-3',year:'1893',caption:'St. Patrick’s at Mott and Prince Streets, rebuilt after the fire.',source:'King’s Handbook of New York City'}
  ],
  publictheater:[
    {img:'historic-publictheater-7',year:'1852',caption:'The library as first drawn, two years before it opened. This one building is today’s south third; two matching wings came later.',source:'Gleason’s Pictorial'},
    {img:'historic-publictheater-1',year:'1854',caption:'Inside the Astor Library the year it opened: a skylit reading hall ringed by galleries of books.',source:'Gleason’s Pictorial'},
    {img:'historic-publictheater-3',year:'c. 1870',caption:'The library on Lafayette Place, then a quiet, tree-lined street.',source:'New York Public Library'},
    {img:'historic-publictheater-5',year:'1875',caption:'The South Hall. Nothing could be borrowed: you asked at the desk and read under the skylight.',source:'Wikimedia Commons'},
    {img:'historic-publictheater-6',year:'1892',caption:'A cartoonist mocks the library’s famously short hours: “open every other Monday from 9.58 to 10 a.m.”',source:'Cartoon by “Chip”'},
    {img:'historic-publictheater-4',year:'1893',caption:'The finished building, all three sections, before it became a theater.',source:'King’s Handbook of New York City'}
  ],
  bayard:[
    {img:'historic-bayard-1',year:'1970',caption:'The top of the building and its winged figures, photographed for the Historic American Buildings Survey.',source:'Library of Congress · Cervin Robinson'},
    {img:'historic-bayard-4',year:'1970',caption:'The full Bleecker Street front, seen from the southeast, with its plain neighbors on either side.',source:'Library of Congress · Cervin Robinson'},
    {img:'historic-bayard-2',year:'1970',caption:'The Bleecker Street entrance and its arch of terra-cotta ornament.',source:'Library of Congress · Cervin Robinson'},
    {img:'historic-bayard-3',year:'1970',caption:'A close look at the cornice, where Sullivan’s ornament is at its most lace-like.',source:'Library of Congress · Cervin Robinson'}
  ]
};

(()=>{
  function section(p){
    const items=(HISTORIC[p.id]||[]).filter(h=>CREDITS[h.img]);if(!items.length)return '';
    return `<section class="story-section then-section"><span class="eyebrow">THEN</span><h2>Before it was this.</h2>
      <div class="then-rail">${items.map((h,i)=>{const c=CREDITS[h.img];return `<figure class="then-card"><button class="then-open" data-then="${p.id}" data-i="${i}" aria-label="Enlarge: ${esc(h.caption)}"><img src="assets/${h.img}.webp" alt="${esc(h.caption)}" loading="lazy"><span class="then-year">${h.year}</span></button>
        <figcaption>${h.caption}<a href="${c.url}" target="_blank" rel="noopener noreferrer">${esc(h.source)} · ${esc(c.license)} ↗</a></figcaption></figure>`}).join('')}</div></section>`;
  }
  // Add the section to a building's page, just before the visit notes.
  function fillIn(){const [page,id]=(location.hash.slice(1)||'explore').split('/');if(page!=='place')return;const p=byId(id);
    const note=document.querySelector('.detail-body > .visit-note');if(!p||!note||document.querySelector('.then-section'))return;
    note.insertAdjacentHTML('beforebegin',section(p))}
  new MutationObserver(fillIn).observe(document.getElementById('main'),{childList:true});fillIn();

  // Tap an image to see it large.
  function open(id,i){const h=HISTORIC[id][i],c=CREDITS[h.img];if(!h)return;
    const v=document.createElement('div');v.className='then-view';v.setAttribute('role','dialog');v.setAttribute('aria-modal','true');v.setAttribute('aria-label',h.caption);
    v.innerHTML=`<button class="then-close" aria-label="Close">×</button><img src="assets/${h.img}.webp" alt="${esc(h.caption)}"><p><strong>${h.year}</strong> ${h.caption}<br><a href="${c.url}" target="_blank" rel="noopener noreferrer">${esc(h.source)} · ${esc(c.license)} ↗</a></p>`;
    const close=()=>{v.remove();document.removeEventListener('keydown',esc_)};const esc_=e=>{if(e.key==='Escape')close()};
    v.addEventListener('click',e=>{if(!e.target.closest('a'))close()});document.addEventListener('keydown',esc_);document.body.appendChild(v);v.querySelector('.then-close').focus()}
  document.addEventListener('click',e=>{const b=e.target.closest('[data-then]');if(b)open(b.dataset.then,Number(b.dataset.i))});
})();
