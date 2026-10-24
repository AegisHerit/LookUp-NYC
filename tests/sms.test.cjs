const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadData,normalizePhone,routeMessage,plain,clientIp,createLimiter}=require('../server/message.js');
const {places,walks}=loadData();

test('US numbers in common formats get a 1 in front',()=>{
 for(const n of ['(212) 555-0123','212-555-0123','212.555.0123','2125550123','1 212 555 0123','+1 212 555 0123'])assert.equal(normalizePhone(n),'12125550123',n);
});
test('international numbers are refused unless allowed',()=>{
 assert.equal(normalizePhone('+44 20 7946 0958'),null);
 assert.equal(normalizePhone('+44 20 7946 0958',{allowInternational:true}),'442079460958');
 assert.equal(normalizePhone('442079460958',{allowInternational:true}),null);
});
test('premium-rate, service and junk numbers are rejected',()=>{
 for(const n of ['','555-0123','abc','212555012','0125550123','<script>','+1234','1 900 555 0123','(976) 555-0123','411 555 0123','212 055 0123'])assert.equal(normalizePhone(n),null,n);
});
test('every route makes a short plain-text message with its stops and one link',()=>{
 for(const w of walks){const m=routeMessage(w,places,'https://aegisherit.github.io/LookUp-NYC/');
  assert.match(m,/^LookUp NYC: /);assert.ok(m.endsWith('#route/'+w.id),w.id);assert.ok(!m.includes('google.com'),w.id);
  assert.ok(/^[\x20-\x7E\n]*$/.test(m),w.id+' has non-plain characters');
  assert.ok(m.length<=306,`${w.id} is ${m.length} characters, more than 2 SMS parts`);
  assert.equal(m.split('\n').filter(l=>/^\d+\. /.test(l)).length,w.stops.length);}
});
test('fancy punctuation becomes plain',()=>{assert.equal(plain('Park → Square — it’s “here”…'),'Park to Square - it\'s "here"...')});
test('rate limits use the address the proxy added, not one the caller sent',()=>{
 const req=(xff,remote)=>({headers:xff?{'x-forwarded-for':xff}:{},socket:{remoteAddress:remote}});
 assert.equal(clientIp(req('1.1.1.1, 9.9.9.9','10.0.0.1'),true),'9.9.9.9');
 assert.equal(clientIp(req('1.1.1.1','10.0.0.1'),false),'10.0.0.1');
 assert.equal(clientIp(req('','10.0.0.1'),true),'10.0.0.1');
});
test('limits cap hits per window and reset after it',()=>{
 let t=0;const limited=createLimiter(()=>t);
 assert.equal(limited('a',2,1000),false);assert.equal(limited('a',2,1000),false);assert.equal(limited('a',2,1000),true);
 assert.equal(limited('b',2,1000),false);t=1001;assert.equal(limited('a',2,1000),false);
});
