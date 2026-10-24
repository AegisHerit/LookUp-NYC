(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.CitysideAudio=factory();
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  function sentences(text){return (String(text).match(/[^.!?]+(?:[.!?]+[”’"']?|$)/g)||[]).map(s=>s.trim()).filter(Boolean)}
  class Narrator {
    constructor({synth,Utterance,onChange=()=>{},onError=()=>{},setTimer=setTimeout,clearTimer=clearTimeout}){
      Object.assign(this,{synth,Utterance,onChange,onError,setTimer,clearTimer});
      this.guide=null;this.chapter=0;this.sentence=0;this.phase='idle';this.rate=1;this.voiceURI='';this.generation=0;this.timer=null;this.utterance=null;
    }
    get supported(){return !!(this.synth&&this.Utterance)}
    state(){
      const chapters=this.guide?.chapters||[],current=chapters[this.chapter];
      const total=chapters.reduce((n,c)=>n+c.sentences.length,0);
      const completed=chapters.slice(0,this.chapter).reduce((n,c)=>n+c.sentences.length,0)+this.sentence;
      return {guide:this.guide,chapter:this.chapter,sentence:this.sentence,phase:this.phase,rate:this.rate,voiceURI:this.voiceURI,total,completed:this.phase==='ended'?total:completed,text:current?.sentences[this.sentence]||''};
    }
    emit(){this.onChange(this.state())}
    clearWatch(){if(this.timer!==null)this.clearTimer(this.timer);this.timer=null}
    cancel(){this.generation++;this.clearWatch();this.utterance=null;if(this.synth){this.synth.cancel();this.synth.resume()}}
    watch(token){this.clearWatch();this.timer=this.setTimer(()=>{if(token===this.generation&&this.phase==='loading')this.fail('Your browser could not start a narration voice. Try another voice or browser, or read the transcript.');},8000)}
    fail(message){this.cancel();this.phase='error';this.emit();this.onError(message)}
    load(guide,chapter=0){
      if(!this.supported){this.onError('Audio narration is unavailable in this browser. You can read every section in the transcript.');return}
      this.cancel();this.guide={...guide,chapters:guide.chapters.map(c=>({...c,sentences:sentences(c.text)})).filter(c=>c.sentences.length)};
      this.chapter=Math.max(0,Math.min(chapter,this.guide.chapters.length-1));this.sentence=0;
      if(!this.guide.chapters.length){this.phase='idle';this.emit();return}
      this.speak();
    }
    speak(){
      const c=this.guide?.chapters[this.chapter];
      if(!c||this.sentence>=c.sentences.length){this.finishSentence();return}
      const token=++this.generation,u=new this.Utterance(c.sentences[this.sentence]);this.utterance=u;
      u.lang='en-US';u.rate=this.rate;
      const voice=this.synth.getVoices().find(v=>v.voiceURI===this.voiceURI);if(voice){u.voice=voice;u.lang=voice.lang}
      this.phase='loading';this.emit();this.watch(token);
      u.onstart=()=>{if(token!==this.generation)return;this.clearWatch();if(this.phase==='paused'){this.synth.pause();return}this.phase='playing';this.emit()};
      u.onresume=()=>{if(token!==this.generation||this.phase==='paused')return;this.clearWatch();this.phase='playing';this.emit()};
      u.onend=()=>{if(token!==this.generation)return;this.clearWatch();this.utterance=null;this.finishSentence()};
      u.onerror=e=>{if(token!==this.generation)return;this.fail(e.error==='not-allowed'?'Tap Play to allow narration, then check your browser’s audio settings.':'Your device could not play this voice. Choose another voice or use the transcript.')};
      try{this.synth.speak(u)}catch{this.fail('Narration could not start. You can read the transcript below.')}
    }
    finishSentence(){
      const paused=this.phase==='paused';this.sentence++;
      if(this.sentence>=(this.guide?.chapters[this.chapter]?.sentences.length||0)){this.chapter++;this.sentence=0}
      if(this.chapter>=(this.guide?.chapters.length||0)){this.chapter=Math.max(0,this.guide.chapters.length-1);this.sentence=this.guide.chapters[this.chapter].sentences.length;this.phase='ended';this.emit();return}
      if(paused){this.phase='paused';this.emit()}else this.speak();
    }
    toggle(){
      if(!this.guide)return;
      if(this.phase==='playing'||this.phase==='loading'){this.clearWatch();this.phase='paused';this.synth.pause();this.emit();return}
      if(this.phase==='paused'&&this.utterance){this.phase='loading';this.emit();this.synth.resume();if(this.synth.speaking&&!this.synth.paused){this.phase='playing';this.emit()}else this.watch(this.generation);return}
      if(this.phase==='ended'||this.phase==='error'){this.sentence=0;if(this.phase==='ended')this.chapter=0}
      this.speak();
    }
    skip(chapter){if(!this.guide)return;this.cancel();this.chapter=Math.max(0,Math.min(chapter,this.guide.chapters.length-1));this.sentence=0;this.speak()}
    restart(){if(this.guide)this.skip(this.chapter)}
    configure({rate=this.rate,voiceURI=this.voiceURI}={}){
      const allowed=[.8,1,1.2,1.5];if(!allowed.includes(Number(rate)))return;
      const active=['playing','loading'].includes(this.phase),paused=this.phase==='paused';
      if(active||paused)this.cancel();this.rate=Number(rate);this.voiceURI=voiceURI;
      if(active)this.speak();else{if(paused)this.phase='paused';this.emit()}
    }
    stop(){this.cancel();this.guide=null;this.chapter=0;this.sentence=0;this.phase='idle';this.emit()}
  }
  return {Narrator,sentences};
});
