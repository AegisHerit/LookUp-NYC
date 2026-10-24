// "Text me this route": sends the open route to the visitor's phone through the LookUp NYC SMS server.
// The server address comes from <meta name="lookup-sms-api"> in index.html. Leave it empty to hide the feature.
(function(){
  'use strict';
  const API=(document.querySelector('meta[name="lookup-sms-api"]')?.content||'').trim().replace(/\/$/,'');
  if(!API)return;
  const main=document.getElementById('main');
  const say=m=>typeof toast==='function'?toast(m):alert(m);
  const chat='<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 1-2zM8 9h8M8 12.5h5"/></svg>';

  function routeId(){const [page,id]=(location.hash.slice(1)||'').split('/');return page==='route'?id:null}

  function addControls(){
    const id=routeId(),actions=main.querySelector('.route-actions');
    if(!id||!actions||actions.querySelector('[data-sms-toggle]'))return;
    actions.insertAdjacentHTML('beforeend',`<button type="button" class="button secondary" data-sms-toggle aria-expanded="false" aria-controls="sms-form">${chat}Text me this route</button>`);
    actions.insertAdjacentHTML('afterend',`<form class="sms-form" id="sms-form" hidden novalidate>
      <label for="sms-phone">Your phone number</label>
      <div class="sms-row"><input id="sms-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(212) 555-0123" required>
      <button class="button orange" type="submit">Send</button></div>
      <p class="sms-note" id="sms-status" role="status" aria-live="polite">We’ll text the stops and a Google Maps walking link. Your number is used only to send this text. Message rates may apply.</p>
    </form>`);
  }

  main.addEventListener('click',e=>{
    const b=e.target.closest('[data-sms-toggle]');if(!b)return;
    const form=document.getElementById('sms-form'),open=form.hidden;
    form.hidden=!open;b.setAttribute('aria-expanded',open);
    if(open)form.querySelector('input').focus();
  });

  main.addEventListener('submit',async e=>{
    const form=e.target.closest('.sms-form');if(!form)return;
    e.preventDefault();
    const input=form.querySelector('input'),button=form.querySelector('[type=submit]'),status=form.querySelector('#sms-status');
    const phone=input.value.trim(),digits=phone.replace(/\D/g,'');
    if(digits.length<10){status.textContent='Enter a 10-digit US number, or + and your country code.';input.focus();return}
    button.disabled=true;button.textContent='Sending…';
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);
    try{
      const res=await fetch(API+'/api/send-route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,routeId:routeId()}),signal:ctrl.signal});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data.error||'The text couldn’t be sent right now.');
      status.textContent=`Sent to the number ending in ${data.last4}. Open the link on your phone when you’re ready to walk.`;
      say('Route sent. Check your messages.');
      input.value='';
    }catch(err){
      status.textContent=err.name==='AbortError'||err instanceof TypeError?'We couldn’t reach the text service. Check your connection and try again.':err.message;
    }finally{clearTimeout(timer);button.disabled=false;button.textContent='Send'}
  });

  // Route pages are redrawn when a stop is marked visited, so watch for that too.
  new MutationObserver(addControls).observe(main,{childList:true});
  addControls();
})();
