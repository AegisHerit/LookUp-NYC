// Route story: a shareable "I walked it" card when a route is finished.
// Builds a 1080×1920 image (the phone-story shape) on the device: a Polaroid with the
// walker's selfie (or the route's photo), the route's stats, and a sketch of the route.
// Nothing is uploaded; sharing uses the phone's own share sheet.
const Story=(()=>{
  const W=1080,H=1920,C={bg:'#f2f5ff',aqua:'#def5f3',ink:'#17264d',muted:'#5b6884',accent:'#3452ed',mint:'#85f6e5',line:'#d8e0f1'};
  const SPIRE='M16 1v6M13 7h6v4h-6zM11 11h10v19H11zM7 30h18M14 15v3M18 15v3M14 22v3M18 22v3';
  let walkId=null,selfie=null,canvas=null,blob=null,waiting=null;
  const walk=()=>WALKS.find(w=>w.id===walkId);
  const loadImg=src=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src});

  // Open after a route is finished. If the Look Up view is showing, wait until it's closed.
  function open(id){if(!WALKS.some(w=>w.id===id))return;clearInterval(waiting);
    if(document.getElementById('lookup-view')){waiting=setInterval(()=>{if(!document.getElementById('lookup-view')){clearInterval(waiting);show(id)}},600);return}
    show(id)}
  function close(){document.getElementById('story-view')?.remove();document.body.classList.remove('story-open');if(selfie&&selfie.src.startsWith('blob:'))URL.revokeObjectURL(selfie.src);selfie=null;blob=null}

  function show(id){
    close();walkId=id;const w=walk(),s=LookUpRoutes.routeSteps(w,byId);
    const v=document.createElement('div');v.id='story-view';v.className='story-view';v.setAttribute('role','dialog');v.setAttribute('aria-modal','true');v.setAttribute('aria-labelledby','story-title');
    v.innerHTML=`<div class="story-inner"><button class="story-close" data-story-act="close" aria-label="Close">×</button>
      <span class="eyebrow">ROUTE COMPLETE ✓</span><h2 id="story-title">You walked it.</h2>
      <p class="story-sub">${esc(w.title)} · ${s.total.toLocaleString('en-US')} steps · ${w.stops.length} stories</p>
      <div class="story-preview"><img alt="Your route story card" id="story-img"><span class="story-loading">Making your story…</span></div>
      <div class="story-actions"><label class="button secondary story-selfie">${icon('camera')}<span>Add a selfie</span><input type="file" accept="image/*" capture="user" hidden></label>
      <button class="button" data-story-act="share">${icon('share')}Share story</button></div>
      <button class="text-link story-save" data-story-act="save">Save image</button>
      <p class="story-note">Your photo stays on this phone.</p></div>`;
    document.body.appendChild(v);document.body.classList.add('story-open');
    v.querySelector('input[type=file]').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(!f)return;loadImg(URL.createObjectURL(f)).then(img=>{selfie=img;v.querySelector('.story-selfie span').textContent='Change photo';draw()}).catch(()=>toast('That photo couldn’t be opened. Try another one.'))});
    v.querySelector('[data-story-act="share"]').focus({preventScroll:true});draw();
  }

  // Fill a box with an image, cropping the overflow (like object-fit: cover).
  function cover(ctx,img,x,y,w,h){const r=Math.max(w/img.naturalWidth,h/img.naturalHeight),sw=w/r,sh=h/r;ctx.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,x,y,w,h)}
  function spire(ctx,x,y,size,color){ctx.save();ctx.translate(x,y);ctx.scale(size/32,size/32);ctx.strokeStyle=color;ctx.lineWidth=2.6;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke(new Path2D(SPIRE));ctx.restore()}

  async function draw(){
    const w=walk();if(!w)return;const s=LookUpRoutes.routeSteps(w,byId);
    try{await Promise.all(['400 40px "DM Sans"','600 40px "DM Sans"'].map(f=>document.fonts.load(f)))}catch{}
    const photo=selfie||await loadImg(`assets/${w.image}.webp`).catch(()=>null);
    const stopPhotos=(await Promise.all(w.stops.map(id=>loadImg(`assets/${id}.webp`).catch(()=>null)))).filter(Boolean);
    canvas=canvas||document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');
    // Background: the app's soft blue fading to aqua.
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,C.bg);g.addColorStop(1,C.aqua);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    collage(ctx,stopPhotos);
    // Brand.
    spire(ctx,90,104,58,C.accent);ctx.fillStyle=C.accent;ctx.font='600 50px "DM Sans", system-ui, sans-serif';ctx.fillText('LookUp NYC.',160,150);
    ctx.fillStyle=C.accent;ctx.font='600 26px "DM Sans", system-ui, sans-serif';ctx.save();ctx.letterSpacing='6px';ctx.fillText('ROUTE COMPLETE ✓',92,236);ctx.restore();
    // Polaroid, slightly tilted.
    const pw=780,ph=900,px=W/2,py=760,date=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
    ctx.save();ctx.translate(px,py);ctx.rotate(-0.045);
    ctx.shadowColor='rgba(21,36,76,.22)';ctx.shadowBlur=50;ctx.shadowOffsetY=22;ctx.fillStyle='#fff';ctx.fillRect(-pw/2,-ph/2,pw,ph);ctx.shadowColor='transparent';
    const inset=44,side=pw-inset*2;
    if(photo)cover(ctx,photo,-pw/2+inset,-ph/2+inset,side,side);else{ctx.fillStyle=C.aqua;ctx.fillRect(-pw/2+inset,-ph/2+inset,side,side)}
    ctx.fillStyle=C.ink;ctx.font='italic 52px Georgia, "Times New Roman", serif';ctx.textAlign='center';
    ctx.fillText(fit(ctx,w.title,side),0,ph/2-92);
    ctx.fillStyle=C.muted;ctx.font='400 28px "DM Sans", system-ui, sans-serif';ctx.fillText(date,0,ph/2-44);
    ctx.restore();ctx.textAlign='left';
    // Stats.
    const stats=[[s.total.toLocaleString('en-US'),'steps'],[w.miles,'miles'],[String(w.stops.length),'stories']],col=W/3;
    stats.forEach(([n,label],i)=>{const cx=col*i+col/2;ctx.textAlign='center';ctx.fillStyle=i?C.ink:C.accent;ctx.font='72px Georgia, "Times New Roman", serif';ctx.fillText(n,cx,1350);ctx.fillStyle=C.muted;ctx.font='400 28px "DM Sans", system-ui, sans-serif';ctx.fillText(label,cx,1396)});
    ctx.textAlign='left';
    // Route sketch: stops scaled into a box, joined by a dashed line.
    drawRoute(ctx,w,{x:160,y:1470,w:760,h:280});
    // Footer.
    ctx.fillStyle=C.muted;ctx.font='400 26px "DM Sans", system-ui, sans-serif';ctx.textAlign='center';ctx.fillText('Look up. New York is talking.  ·  aegisherit.github.io/LookUp-NYC',W/2,1836);ctx.textAlign='left';
    blob=null;const img=document.getElementById('story-img');if(img){img.src=canvas.toDataURL('image/jpeg',.85);img.closest('.story-preview').classList.add('ready')}
  }
  // The route's buildings fill the background, softened under a wash of the app's colors.
  function collage(ctx,imgs){if(!imgs.length)return;
    const cols=imgs.length<3?1:2,rows=Math.ceil(imgs.length/cols),ch=H/rows;
    imgs.forEach((img,i)=>{const r=Math.floor(i/cols),inRow=Math.min(cols,imgs.length-r*cols),cw=W/inRow,c=i-r*cols;cover(ctx,img,c*cw,r*ch,cw,ch)});
    const wash=ctx.createLinearGradient(0,0,0,H);wash.addColorStop(0,'rgba(242,245,255,.90)');wash.addColorStop(.45,'rgba(242,245,255,.78)');wash.addColorStop(1,'rgba(222,245,243,.92)');
    ctx.fillStyle=wash;ctx.fillRect(0,0,W,H)}
  function fit(ctx,text,max){if(ctx.measureText(text).width<=max)return text;let t=text;while(t.length>3&&ctx.measureText(t+'…').width>max)t=t.slice(0,-1);return t+'…'}
  function drawRoute(ctx,w,box){
    const pts=w.stops.map(byId),lat=pts.map(p=>p.lat),lng=pts.map(p=>p.lng),k=Math.cos(40.73*Math.PI/180);
    const minX=Math.min(...lng)*k,maxX=Math.max(...lng)*k,minY=Math.min(...lat),maxY=Math.max(...lat),sx=(maxX-minX)||1e-6,sy=(maxY-minY)||1e-6;
    const scale=Math.min(box.w/sx,box.h/sy),ox=box.x+(box.w-sx*scale)/2,oy=box.y+(box.h-sy*scale)/2;
    const xy=pts.map(p=>[ox+(p.lng*k-minX)*scale,oy+(maxY-p.lat)*scale]);
    // Stops a block apart would overlap at this size, so nudge them apart a little.
    const gap=56;for(let n=0;n<40;n++)for(let i=0;i<xy.length;i++)for(let j=i+1;j<xy.length;j++){const dx=xy[j][0]-xy[i][0],dy=xy[j][1]-xy[i][1],d=Math.hypot(dx,dy)||0.01;if(d<gap){const m=(gap-d)/2,ux=d>0.01?dx/d:1,uy=d>0.01?dy/d:0;xy[i][0]-=ux*m;xy[i][1]-=uy*m;xy[j][0]+=ux*m;xy[j][1]+=uy*m}}
    ctx.save();ctx.strokeStyle=C.accent;ctx.globalAlpha=.75;ctx.lineWidth=5;ctx.setLineDash([12,14]);ctx.lineCap='round';ctx.beginPath();xy.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.restore();
    xy.forEach(([x,y],i)=>{ctx.beginPath();ctx.arc(x,y,24,0,Math.PI*2);ctx.fillStyle=C.accent;ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#fff';ctx.stroke();ctx.fillStyle='#fff';ctx.font='600 24px "DM Sans", system-ui, sans-serif';ctx.textAlign='center';ctx.fillText(String(i+1),x,y+8)});ctx.textAlign='left';
  }

  const toBlob=()=>blob?Promise.resolve(blob):new Promise(ok=>canvas.toBlob(b=>{blob=b;ok(b)},'image/png'));
  const fileName=()=>`lookup-nyc-${walkId}.png`;
  async function share(){
    if(!canvas)return;const b=await toBlob(),file=new File([b],fileName(),{type:'image/png'}),w=walk();
    if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'I walked '+w.title,text:`I walked ${w.title} with LookUp NYC.`})}catch(e){if(e.name!=='AbortError')save()}}
    else save();
  }
  async function save(){if(!canvas)return;const b=await toBlob(),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=fileName();document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);toast('Story saved. Look for it in your downloads or photos.')}

  // The "Make your route story" button on finished route pages.
  function button(w){return `<button class="button story-start" data-story="${w.id}">${icon('camera')}Make your route story</button>`}
  function fillIn(){const [page,id]=(location.hash.slice(1)||'explore').split('/');if(page!=='route')return;const w=WALKS.find(x=>x.id===id),box=document.getElementById('walk-progress');
    if(w&&box&&(progress[w.id]||[]).length===w.stops.length&&!box.querySelector('.story-start'))box.insertAdjacentHTML('beforeend',button(w))}
  // Route pages are redrawn in a few ways, so watch the page and add the button when it's missing.
  new MutationObserver(fillIn).observe(document.getElementById('main'),{childList:true});fillIn();

  document.addEventListener('click',e=>{const s=e.target.closest('[data-story]');if(s){open(s.dataset.story);return}
    const b=e.target.closest('[data-story-act]');if(!b)return;const a=b.dataset.storyAct;if(a==='close')close();else if(a==='share')share();else if(a==='save')save()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('story-view'))close()});

  return {open};
})();
