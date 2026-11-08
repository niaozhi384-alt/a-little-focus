/* Motion direction informed by Unslop (Damir Sokolovsky, CC BY 4.0),
   TASTE and Impeccable. Implementation is specific to this application. */
(() => {
 'use strict';
 const $=selector=>document.querySelector(selector);
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const ease='cubic-bezier(.16,1,.3,1)';
 const play=(node,frames,options={})=>{
  if(reduced()||!node?.animate)return null;
  return node.animate(frames,{duration:280,easing:ease,...options});
 };
 const previousNumbers=new WeakMap();
 function numbers(nodes){
  for(const node of nodes){
   const value=node.textContent,previous=previousNumbers.get(node);
   previousNumbers.set(node,value);
   if(previous===undefined||previous===value||reduced())continue;
   node.getAnimations().forEach(animation=>animation.cancel());
   play(node,[{transform:'translateY(35%)',opacity:.25},{transform:'translateY(0)',opacity:1}],{duration:320});
  }
 }
 function goals(total,done,completedId){
  const ring=$('#goal-ring-progress'),summary=$('#goal-progress');
  ring.style.strokeDashoffset=75.4*(1-(total?done/total:0));
  summary.setAttribute('aria-label',`已完成 ${done} / ${total} 个目标`);
  $('.tasks-card').classList.toggle('goals-complete',total>0&&total===done);
  if(completedId){
   const row=[...document.querySelectorAll('.task')].find(item=>item.dataset.taskId===completedId);
   if(row){row.classList.add('just-completed');play(row,[{background:'var(--theme-soft)'},{background:'transparent'}],{duration:600})}
  }
 }
 const completions=new WeakMap();
 async function complete(button){
  if(reduced())return;
  const token=Symbol();completions.set(button,token);
  const content=document.createElement('span'),fill=document.createElement('i'),particles=[];
  content.className='completion-content';fill.className='completion-fill';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','m5 12 4 4L19 6');svg.append(path);
  content.append(svg);button.classList.add('completion-button');button.append(fill,content);
  const morph=play(fill,[{clipPath:'inset(0 0 round 10px)'},{clipPath:'inset(0 calc(50% - 23px) round 23px)'}],{duration:240,fill:'forwards'});
  play(path,[{strokeDashoffset:24},{strokeDashoffset:0}],{duration:240,delay:100,fill:'both'});
  for(let i=0;i<6;i++){
   const particle=document.createElement('i');particle.className='completion-particle';button.append(particle);particles.push(particle);
   const angle=i*Math.PI/3;
   play(particle,[{transform:'translate(-50%,-50%) scale(0)',opacity:0},{offset:.3,opacity:1},{transform:`translate(calc(-50% + ${Math.cos(angle)*44}px),calc(-50% + ${Math.sin(angle)*38}px)) scale(.4)`,opacity:0}],{duration:440,delay:80,fill:'both'});
  }
  try{await morph?.finished;await new Promise(resolve=>setTimeout(resolve,180))}catch{}
  if(completions.get(button)===token){button.classList.remove('completion-button');completions.delete(button)}
  fill.remove();content.remove();particles.forEach(node=>node.remove());
 }
 let activeTransition,navigation=0;
 function navigate(update,event){
  const token=++navigation;
  activeTransition?.skipTransition();
  if(reduced()||!document.startViewTransition){update();return}
  const source=event?.currentTarget?.getBoundingClientRect();
  const x=event?.clientX||source?.x+(source?.width||0)/2||innerWidth/2;
  const y=event?.clientY||source?.y+(source?.height||0)/2||innerHeight/2;
  const radius=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
  try{
   const transition=document.startViewTransition(()=>{if(token===navigation)update()});activeTransition=transition;
   transition.ready.then(()=>{
    if(token!==navigation)return;
    document.documentElement.animate({clipPath:[`circle(0px at ${x}px ${y}px)`,`circle(${radius}px at ${x}px ${y}px)`]},
     {duration:420,easing:ease,pseudoElement:'::view-transition-new(root)'});
   }).catch(()=>{});
   transition.finished.catch(()=>{}).finally(()=>{if(activeTransition===transition)activeTransition=null});
  }catch{update()}
 }
 // Folded favorites remain one readable card; the hidden cards cannot receive focus.
 const deck=$('#saved-quotes'),deckButton=$('#quote-stack-toggle');
 function applyDeck(expanded,animate=false){
  const cards=[...deck.querySelectorAll('.saved-quote')];
  const before=animate?cards.slice(0,3).map(card=>card.getBoundingClientRect()):[];
  deck.dataset.expanded=String(expanded);deckButton.setAttribute('aria-expanded',String(expanded));
  deckButton.textContent=expanded?'叠回收藏':'展开收藏';
  cards.forEach((card,index)=>{card.hidden=!expanded&&index>2;card.inert=!expanded&&index>0;card.setAttribute('aria-hidden',String(!expanded&&index>0));card.style.setProperty('--card-index',Math.min(index,2))});
  if(animate)cards.slice(0,3).forEach((card,index)=>{
   if(card.hidden)return;const after=card.getBoundingClientRect(),from=before[index];
   if(!from?.width||!after.width)return;
   const end=getComputedStyle(card).transform;
   play(card,[{transform:`translate(${from.x-after.x}px,${from.y-after.y}px) scale(${from.width/after.width},${from.height/after.height})`},{transform:end==='none'?'none':end}],{duration:360});
  });
 }
 function quotes(){
  const count=deck.querySelectorAll('.saved-quote').length;
  deck.classList.toggle('quote-deck',count>1);deckButton.hidden=count<2;
  applyDeck(deck.dataset.expanded==='true');
 }
 deckButton.addEventListener('click',()=>applyDeck(deck.dataset.expanded!=='true',true));
 // Native scrolling supplies touch inertia and snapping; keyboard and direct entry stay available.
 const wheelDialog=$('#duration-dialog'),wheel=$('#duration-wheel'),wheelTitle=$('#duration-title'),wheelUse=$('#duration-use');
 let durationInput,value=25,maxValue=180,wheelFrame,visibleOptions=[];
 function paintWheel(){
  value=Math.max(1,Math.min(maxValue,Math.round(wheel.scrollTop/44)+1));
  visibleOptions.forEach(option=>{option.classList.remove('wheel-near');option.style.removeProperty('--wheel-distance')});visibleOptions=[];
  for(let number=Math.max(1,value-3);number<=Math.min(maxValue,value+3);number++){
   const option=wheel.children[number-1];option.classList.add('wheel-near');option.style.setProperty('--wheel-distance',(number-1)-wheel.scrollTop/44);visibleOptions.push(option);
  }
  wheel.querySelector('[aria-selected=true]')?.setAttribute('aria-selected','false');
  wheel.children[value-1].setAttribute('aria-selected','true');wheel.setAttribute('aria-activedescendant','duration-option-'+value);
  wheelUse.textContent=`使用 ${value} 分钟`;
 }
 function selectDuration(number,behavior=reduced()?'instant':'smooth'){
  wheel.scrollTo({top:(Math.max(1,Math.min(maxValue,number))-1)*44,behavior});
 }
 function openDuration(field){
  durationInput=field;maxValue=Number(field.max);value=Math.max(1,Math.min(maxValue,Number(field.value)||25));
  wheelTitle.textContent=field.id==='focus-duration'?'留多久给专注':field.id==='short-duration'?'短暂歇一会儿':'给自己一段长休息';
  wheel.replaceChildren();
  for(let number=1;number<=maxValue;number++){
   const option=document.createElement('div');option.className='duration-option';option.id='duration-option-'+number;option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.textContent=number;
   option.addEventListener('click',()=>selectDuration(number));wheel.append(option);
  }
  wheelDialog.showModal();selectDuration(value,'instant');paintWheel();wheel.focus({preventScroll:true});
 }
 document.querySelectorAll('[data-duration-picker]').forEach(button=>button.addEventListener('click',()=>openDuration(document.getElementById(button.dataset.durationPicker))));
 wheel.addEventListener('scroll',()=>{cancelAnimationFrame(wheelFrame);wheelFrame=requestAnimationFrame(paintWheel)},{passive:true});
 wheel.addEventListener('keydown',event=>{
  const next={ArrowUp:value-1,ArrowDown:value+1,PageUp:value-5,PageDown:value+5,Home:1,End:maxValue}[event.key];
  if(next!==undefined){event.preventDefault();selectDuration(next,'instant');paintWheel()}
  if(event.key==='Enter'){event.preventDefault();wheelUse.click()}
 });
 $('#duration-close').addEventListener('click',()=>wheelDialog.close());
 wheelUse.addEventListener('click',()=>{paintWheel();durationInput.value=value;durationInput.dispatchEvent(new Event('change',{bubbles:true}));play(durationInput,[{background:'var(--theme-soft)'},{background:'transparent'}]);wheelDialog.close()});
 // Timeline drawing happens after scrolling settles, rather than on every scroll frame.
 const history=$('#history-list');let settleTimer;
 function settleTimeline(){
  const rows=[...history.querySelectorAll('.record-row')];if(rows.length<3)return;
  const box=history.getBoundingClientRect(),center=box.y+box.height/2;
  let selected=0,distance=Infinity;
  rows.forEach((row,index)=>{const r=row.getBoundingClientRect(),d=Math.abs(r.y+r.height/2-center);if(d<distance){distance=d;selected=index}});
  rows.forEach((row,index)=>{row.classList.toggle('timeline-current',index===selected);row.classList.toggle('timeline-passed',index<=selected)});
 }
 function timeline(){
  const rows=[...history.querySelectorAll('.record-row')],enabled=rows.length>=3;
  history.classList.toggle('snap-timeline',enabled);$('#timeline-hint').hidden=!enabled;
  rows.forEach(row=>row.tabIndex=enabled?0:-1);history.scrollTop=0;
  if(enabled)requestAnimationFrame(settleTimeline);
 }
 history.addEventListener('scroll',()=>{clearTimeout(settleTimer);settleTimer=setTimeout(settleTimeline,120)},{passive:true});
 history.addEventListener('scrollend',settleTimeline);
 history.addEventListener('keydown',event=>{
  if(!history.classList.contains('snap-timeline')||!['ArrowUp','ArrowDown'].includes(event.key))return;
  const rows=[...history.querySelectorAll('.record-row')],index=rows.indexOf(document.activeElement),next=Math.max(0,Math.min(rows.length-1,index+(event.key==='ArrowDown'?1:-1)));
  event.preventDefault();const row=rows[next];if(!row)return;
  row.focus({preventScroll:true});
  const item=row.getBoundingClientRect(),container=history.getBoundingClientRect();
  history.scrollTo({top:history.scrollTop+item.top-container.top-(history.clientHeight-item.height)/2,behavior:reduced()?'instant':'smooth'});
 });
 new MutationObserver(timeline).observe(history,{childList:true});
 window.FocusMotion={numbers,goals,complete,navigate,quotes};
})();
