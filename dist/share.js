// "Share this route": opens the phone's share sheet (Messages, WhatsApp, Mail...) with the
// route's name, stops and link. Free and needs no server. Where sharing isn't available
// (most desktop browsers), the link is copied instead.
(()=>{
  const main=document.getElementById('main');
  const routeId=()=>{const [page,id]=(location.hash.slice(1)||'').split('/');return page==='route'?id:null};
  function addButton(){const id=routeId(),actions=main.querySelector('.route-actions');
    if(!id||!actions||actions.querySelector('[data-share-route]'))return;
    const maps=actions.querySelector('[data-maps-route]');
    const html=`<button type="button" class="button secondary" data-share-route>${icon('share')}Share this route</button>`;
    if(maps)maps.insertAdjacentHTML('afterend',html);else actions.insertAdjacentHTML('beforeend',html)}
  async function share(){
    const w=WALKS.find(x=>x.id===routeId());if(!w)return;
    const url=location.origin+location.pathname+'#route/'+w.id;
    const text=`${w.title}: ${w.stops.length} stops, about ${w.miles} mi. ${w.stops.map(id=>byId(id).name).join(' → ')}`;
    if(navigator.share){try{await navigator.share({title:`${w.title} · LookUp NYC`,text,url});return}catch(e){if(e.name==='AbortError')return}}
    try{await navigator.clipboard.writeText(`${text}\n${url}`);toast('Route link copied. Paste it into a message.')}
    catch{prompt('Copy this link:',url)}
  }
  main.addEventListener('click',e=>{if(e.target.closest('[data-share-route]'))share()});
  new MutationObserver(addButton).observe(main,{childList:true});addButton();
})();
