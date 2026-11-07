// One short bell, optional vibration, and no automatic playback on page load.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FocusReminderEngine=factory()})(typeof window==='undefined'?globalThis:window,()=>{
 class ReminderEngine{
  constructor({AudioContext,vibrate}={}){this.AudioContext=AudioContext;this.vibrateDevice=vibrate;this.context=null;this.voices=new Set();this.preferences={sound:true,vibration:false,volume:35};}
  configure(next){const wasSound=this.preferences.sound,wasVibration=this.preferences.vibration;if(typeof next.sound==='boolean')this.preferences.sound=next.sound;if(typeof next.vibration==='boolean')this.preferences.vibration=next.vibration;if(Number.isFinite(Number(next.volume)))this.preferences.volume=Math.max(10,Math.min(70,Number(next.volume)));if(wasSound&&!this.preferences.sound)this.stopSound();if(wasVibration&&!this.preferences.vibration)this.stopVibration();}
  async prepare({force=false}={}){if((!this.preferences.sound&&!force)||!this.AudioContext)return false;try{if(!this.context||this.context.state==='closed')this.context=new this.AudioContext();if(this.context.state==='suspended')await this.context.resume();return this.context.state==='running'}catch{return false}}
  playBell(){const ctx=this.context;if(!ctx||ctx.state!=='running')return false;try{this.stopSound();const now=ctx.currentTime,volume=this.preferences.volume/100;for(const[ratio,strength,decay]of[[1,.48,1.15],[2.01,.15,.72],[2.76,.065,.45],[4.07,.025,.25]]){const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(1174.66*ratio,now);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(strength*volume,now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+decay);oscillator.connect(gain);gain.connect(ctx.destination);this.voices.add(oscillator);oscillator.onended=()=>{this.voices.delete(oscillator);oscillator.disconnect();gain.disconnect()};oscillator.start(now);oscillator.stop(now+1.3)}return true}catch{this.stopSound();return false}}
  vibrate(){if(!this.vibrateDevice)return false;try{return this.vibrateDevice([100,60,100])!==false}catch{return false}}
  complete({late=false}={}){if(late)return{sound:false,vibration:false};return{sound:this.preferences.sound?this.playBell():false,vibration:this.preferences.vibration?this.vibrate():false}}
  stopSound(){for(const voice of this.voices){try{voice.stop()}catch{}}this.voices.clear()}
  stopVibration(){if(this.vibrateDevice)try{this.vibrateDevice(0)}catch{}}
 }
 return ReminderEngine;
});
