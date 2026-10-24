const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Narrator}=require('../dist/audio-engine.js');
function fixture(){
 const spoken=[],errors=[],timers=new Map();let next=0;
 const synth={speaking:false,paused:false,cancel(){this.speaking=false},pause(){this.paused=true},resume(){this.paused=false},getVoices(){return [{voiceURI:'test',lang:'en-US'}]},speak(u){spoken.push(u)}};
 class Utterance{constructor(text){this.text=text}}
 const n=new Narrator({synth,Utterance,onError:m=>errors.push(m),setTimer:fn=>{timers.set(++next,fn);return next},clearTimer:id=>timers.delete(id)});
 const start=()=>{synth.speaking=true;spoken.at(-1).onstart()};
 return {n,synth,spoken,errors,timers,start};
}
const guide={id:'first',title:'A place',chapters:[{title:'Story',text:'First sentence. Second sentence.'},{title:'Look',text:'Look up.'}]};
test('plays ordered sentences and sections, then reports complete',()=>{const f=fixture();f.n.load(guide);for(const text of ['First sentence.','Second sentence.','Look up.']){assert.equal(f.spoken.at(-1).text,text);f.start();f.spoken.at(-1).onend()}assert.equal(f.n.phase,'ended');assert.equal(f.n.state().completed,3);assert.equal(f.timers.size,0);f.n.toggle();assert.equal(f.spoken.at(-1).text,'First sentence.')});
test('callbacks from cancelled sections cannot alter the new section',()=>{const f=fixture();f.n.load(guide);const stale=f.spoken[0];f.n.skip(1);stale.onend();stale.onerror({error:'interrupted'});assert.equal(f.n.chapter,1);assert.equal(f.spoken.length,2);assert.equal(f.errors.length,0)});
test('pause and asynchronous resume preserve the utterance',()=>{const f=fixture();f.n.load(guide);f.start();f.n.toggle();assert.equal(f.n.phase,'paused');f.synth.resume=()=>{};f.n.toggle();assert.equal(f.n.phase,'loading');f.spoken[0].onresume();assert.equal(f.n.phase,'playing');assert.equal(f.spoken.length,1);assert.equal(f.timers.size,0)});
test('late start after pause never reports playing',()=>{const f=fixture();f.n.load(guide);f.n.toggle();f.start();assert.equal(f.n.phase,'paused');assert.equal(f.synth.paused,true)});
test('changing speed restarts only the current sentence',()=>{const f=fixture();f.n.load(guide);f.start();f.spoken[0].onend();const stale=f.spoken[1];f.n.configure({rate:1.5,voiceURI:'test'});assert.equal(f.spoken.at(-1).text,'Second sentence.');assert.equal(f.spoken.at(-1).rate,1.5);assert.equal(f.spoken.at(-1).voice.voiceURI,'test');stale.onend();assert.equal(f.n.chapter,0);assert.equal(f.n.sentence,1)});
test('changing preferences while paused stays paused until requested',()=>{const f=fixture();f.n.load(guide);f.start();f.n.toggle();f.n.configure({rate:.8});assert.equal(f.n.phase,'paused');assert.equal(f.spoken.length,1);f.n.toggle();assert.equal(f.spoken.length,2);assert.equal(f.spoken.at(-1).rate,.8)});
test('stopping ignores outstanding completion callbacks',()=>{const f=fixture();f.n.load(guide);const old=f.spoken[0];f.n.stop();old.onend();assert.equal(f.n.guide,null);assert.equal(f.n.phase,'idle');assert.equal(f.timers.size,0)});
test('failed or unavailable voices never report fake playback',()=>{const f=fixture();f.n.load(guide);assert.equal(f.n.phase,'loading');[...f.timers.values()][0]();assert.equal(f.n.phase,'error');assert.equal(f.errors.length,1);const errors=[];const n=new Narrator({onError:e=>errors.push(e)});n.load(guide);assert.equal(n.phase,'idle');assert.equal(errors.length,1)});
