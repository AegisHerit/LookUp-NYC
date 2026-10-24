const {test}=require('node:test');
const assert=require('node:assert/strict');
const {RecordedPlayer}=require('../dist/audio-engine.js');
function fixture(){
 const made=[],errors=[];
 const createAudio=src=>{const el={src,currentTime:0,duration:90,readyState:1,playbackRate:1,paused:true,listeners:{},
  play(){this.paused=false;return Promise.resolve()},pause(){this.paused=true},addEventListener(n,f){this.listeners[n]=f}};made.push(el);return el};
 const p=new RecordedPlayer({createAudio,onError:m=>errors.push(m)});
 return {p,made,errors,el:()=>made.at(-1)};
}
const guide={id:'puck',title:'Puck',src:'a.mp3',duration:90,chapters:[{title:'One',start:0,text:'a'},{title:'Two',start:30,text:'b'},{title:'Three',start:60,text:'c'}]};
test('loads, plays, and tracks chapters by time',()=>{const f=fixture();f.p.load(guide);assert.equal(f.p.phase,'loading');f.el().onplaying();assert.equal(f.p.phase,'playing');f.el().currentTime=45;f.el().ontimeupdate();assert.equal(f.p.chapter,1);assert.equal(f.p.state().completed,45);assert.equal(f.p.state().total,90)});
test('skip seeks to the chapter start',()=>{const f=fixture();f.p.load(guide);f.p.skip(2);assert.equal(f.el().currentTime,60);assert.equal(f.p.chapter,2);f.p.skip(9);assert.equal(f.p.chapter,2)});
test('seeks after metadata when the file is not loaded yet',()=>{const f=fixture();f.p.load({...guide});const el=f.el();el.readyState=0;f.p.skip(1);el.currentTime=0;el.ontimeupdate();assert.equal(f.p.chapter,1);el.listeners.loadedmetadata();assert.equal(el.currentTime,30)});
test('pause, resume, end, and replay',()=>{const f=fixture();f.p.load(guide);f.el().onplaying();f.p.toggle();assert.equal(f.p.phase,'paused');assert.equal(f.el().paused,true);f.p.toggle();assert.equal(f.el().paused,false);f.el().onended();assert.equal(f.p.phase,'ended');assert.equal(f.p.state().completed,90);f.p.toggle();assert.equal(f.el().currentTime,0);assert.equal(f.p.chapter,0)});
test('speed applies to the recording',()=>{const f=fixture();f.p.load(guide);f.p.configure({rate:1.5});assert.equal(f.el().playbackRate,1.5);f.p.configure({rate:3});assert.equal(f.el().playbackRate,1.5)});
test('stop ignores late events from the old recording',()=>{const f=fixture();f.p.load(guide);const old=f.el();f.p.stop();old.onended&&old.onended();assert.equal(f.p.guide,null);assert.equal(f.p.phase,'idle')});
test('reports playback errors',()=>{const f=fixture();f.p.load(guide);f.el().onerror();assert.equal(f.p.phase,'error');assert.equal(f.errors.length,1)});
