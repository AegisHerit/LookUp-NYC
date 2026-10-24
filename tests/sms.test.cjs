const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadData,normalizePhone,routeMessage,plain}=require('../server/message.js');
const {places,walks}=loadData();

test('US numbers in common formats get a 1 in front',()=>{
 for(const n of ['(212) 555-0123','212-555-0123','212.555.0123','2125550123','1 212 555 0123','+1 212 555 0123'])assert.equal(normalizePhone(n),'12125550123',n);
});
test('international numbers need a plus sign',()=>{assert.equal(normalizePhone('+44 20 7946 0958'),'442079460958');assert.equal(normalizePhone('442079460958'),null)});
test('junk is rejected',()=>{for(const n of ['','555-0123','abc','212555012','0125550123','<script>','+1234'])assert.equal(normalizePhone(n),null,n)});
test('every route makes a plain-text message with stops and a walking link',()=>{
 for(const w of walks){const m=routeMessage(w,places,'https://aegisherit.github.io/LookUp-NYC/');
  assert.match(m,/^LookUp NYC: /);assert.ok(m.includes('https://www.google.com/maps/dir/?api=1'),w.id);
  assert.ok(m.endsWith('#route/'+w.id),w.id);assert.ok(/^[\x20-\x7E\n]*$/.test(m),w.id+' has non-plain characters');
  assert.equal(m.split('\n').filter(l=>/^\d+\. /.test(l)).length,w.stops.length);}
});
test('fancy punctuation becomes plain',()=>{assert.equal(plain('Park → Square — it’s “here”…'),'Park to Square - it\'s "here"...')});
