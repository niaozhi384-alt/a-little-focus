(async() => {
 'use strict';
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const cloud=FocusCloud,user=await cloud.ready;
 const KEY=user?'a-little-focus-user-'+user.id:'a-little-focus-v1', defaults={settings:{focus:25,short:5,long:15},tasks:[],sessions:[],round:0,timer:null};
 FocusReminders.init(KEY+'-reminders');
 let data;try{data=JSON.parse(localStorage.getItem(KEY))}catch{};
 if(!data||!data.settings||!Array.isArray(data.tasks)||!Array.isArray(data.sessions))data=structuredClone(defaults);
 data.round=Number.isFinite(data.round)?data.round:0;
 for(const [k,max] of [['focus',180],['short',60],['long',90]])data.settings[k]=Math.max(1,Math.min(max,Number(data.settings[k])||defaults.settings[k]));
 const labels={focus:'专注',short:'短休息',long:'长休息'};
 let mode='focus',remaining=data.settings.focus*60,running=false,deadline=0,toastTimer,syncTimer,syncing=false,lastPull=0;
 const saved=data.timer;if(saved&&labels[saved.mode]&&Number.isFinite(saved.remaining)){mode=saved.mode;remaining=Math.max(0,Math.min(data.settings[mode]*60,saved.remaining));running=!!saved.running&&Number.isFinite(saved.deadline);deadline=saved.deadline||0;}
 function save(){data.sessions.forEach(s=>s.id=s.id||crypto.randomUUID());data.timer={mode,remaining,running,deadline};try{localStorage.setItem(KEY,JSON.stringify(data))}catch{toast('浏览器存储不可用，本次数据仅临时保留')}if(user){clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncCloud(),500)}}
 function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500)}
 const dayKey=d=>{const date=new Date(d);return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`};
 async function syncCloud(pull=false){if(!user||syncing)return;syncing=true;$('#sync-status').textContent='同步中';try{if(Date.now()>=cloud.expiresAt){await cloud.client.auth.signOut({scope:'local'});location.replace('login.html');return}data.sessions.forEach(s=>s.id=s.id||crypto.randomUUID());await cloud.push(data);if(pull){const rows=await cloud.pull(),sessions=new Map(data.sessions.map(s=>[s.id,s])),tasks=new Map(data.completions.map(s=>[s.id,s]));for(const r of rows){const item={id:r.id,at:Date.parse(r.occurred_at)};if(r.kind==='focus')sessions.set(r.id,{...item,minutes:r.minutes});else tasks.set(r.id,{...item,text:r.task_label})}data.sessions=[...sessions.values()];data.completions=[...tasks.values()];lastPull=Date.now();try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}renderStats()}$('#sync-status').textContent='已同步';$('#records-status').textContent='学习记录已保存至你的账号，支持多设备同步。'}catch{$('#sync-status').textContent=navigator.onLine?'同步待重试':'离线待同步';$('#records-status').textContent='记录暂存在此设备，联网后点击同步重试。'}finally{syncing=false}}
 function celebrate(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const root=$('#celebration');root.replaceChildren();for(let i=0;i<30;i++){const p=document.createElement('i');p.style.setProperty('--x',`${Math.random()*100}vw`);p.style.setProperty('--spin',`${Math.random()*700}deg`);p.style.setProperty('--delay',`${Math.random()*.5}s`);p.style.background=['#baa0ff','#8e86ec','#e0c2e9','#a3cbb7'][i%4];root.append(p)}setTimeout(()=>root.replaceChildren(),3000)}
 if(user){const name=user.user_metadata?.display_name||user.email?.split('@')[0]||'我的空间';$('#account-name').textContent=name.slice(0,20);$('.avatar').textContent=name.slice(0,1);$('#account-link').href='#';$('#account-link').onclick=e=>{e.preventDefault();setView('stats')};$('#space-name').textContent='个人空间';$('#sign-out').hidden=false;$('#sync-now').hidden=false;$('#sign-out').onclick=async()=>{$('#sign-out').disabled=true;await syncCloud();const{error}=await cloud.client.auth.signOut({scope:'local'});if(error){$('#sign-out').disabled=false;toast('退出未完成，请检查网络后重试');return}location.replace('./')};$('#sync-now').onclick=()=>syncCloud(true)}
 function paint(){
 const min=Math.floor(remaining/60).toString().padStart(2,'0'),sec=(remaining%60).toString().padStart(2,'0');
 $('#time-display').innerHTML=`${min}<span>:</span>${sec}`;
 document.title=running?`${min}:${sec} · ${labels[mode]}中`:'专注一下 · 找回自己的节奏';
 $('.ring-progress').style.strokeDashoffset=917.35*(1-remaining/(data.settings[mode]*60));
 $('.mode-tabs').style.setProperty('--tab-index',['focus','short','long'].indexOf(mode));
 $$('.mode-tabs button').forEach(b=>{const selected=b.dataset.mode===mode;b.classList.toggle('selected',selected);b.setAttribute('aria-selected',String(selected))});
 $('#clock-caption').textContent=mode==='focus'?'保持专注，让心安静下来':mode==='short'?'放松一下，让灵感透透气':'休息久一点，重新积蓄能量';
 $('#clock-state').textContent=running?(mode==='focus'?'只做眼前这一件事':'站起来，伸个懒腰'):remaining===data.settings[mode]*60?'准备好，就开始吧':'暂停一下，也没关系';
 $('#play-icon').textContent=running?'Ⅱ':'▶';$('#start-label').textContent=running?'暂停计时':remaining===data.settings[mode]*60?`开始${labels[mode]}`:'继续计时';
 document.body.classList.toggle('running',running);
 $$('.round').forEach((r,i)=>r.classList.toggle('active',i<=data.round%4));$('#round-label').textContent=`第 ${data.round%4+1} / 4 轮`;
 }
 function selectMode(next){if(next===mode)return;mode=next;running=false;remaining=data.settings[mode]*60;deadline=0;save();paint()}
 function toggle(){if(running){remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));running=false}else{FocusReminders.prepare();deadline=Date.now()+remaining*1000;running=true}save();paint()}
 function finish(){const completedMode=mode;const endedAt=deadline||Date.now();FocusReminders.complete(endedAt);running=false;if(completedMode==='focus'){data.sessions.push({id:crypto.randomUUID(),at:endedAt,minutes:data.settings.focus});celebrate();data.round++;mode=data.round%4===0?'long':'short';toast(`完成一轮专注！休息 ${data.settings[mode]} 分钟吧。`)}else{mode='focus';toast('休息结束，准备好再开始下一轮。')}remaining=data.settings[mode]*60;deadline=0;save();paint();renderStats();}
 function tick(){if(!running)return;remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));if(!remaining)finish();else paint()}
 $('#start').onclick=toggle;$('#reset').onclick=()=>{running=false;remaining=data.settings[mode]*60;deadline=0;save();paint();toast('计时已重置')};
 $$('.mode-tabs button').forEach(b=>b.onclick=()=>selectMode(b.dataset.mode));
 document.addEventListener('keydown',e=>{if(e.code==='Escape'){document.body.classList.remove('immersive');updateExpand()}if(e.code==='Space'&&!['INPUT','TEXTAREA','BUTTON'].includes(e.target.tagName)&&!$('dialog[open]')){e.preventDefault();toggle()}});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick();renderStats();if(user&&Date.now()-lastPull>30000)syncCloud(true)}});window.addEventListener('online',()=>syncCloud(true));window.addEventListener('pagehide',()=>save());
 const dialog=$('#settings-dialog');function openSettings(){for(const k of ['focus','short','long'])$(`#${k}-duration`).value=data.settings[k];dialog.showModal()}
 $('#settings-nav').onclick=openSettings;$('#timer-settings').onclick=openSettings;$('#close-settings').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
 $('#settings-form').onsubmit=e=>{e.preventDefault();for(const k of ['focus','short','long'])data.settings[k]=Number($(`#${k}-duration`).value);remaining=data.settings[mode]*60;running=false;deadline=0;save();paint();dialog.close();toast('已保存你的专注节奏')};
 function updateExpand(){const active=document.body.classList.contains('immersive');$('#expand').setAttribute('aria-label',active?'退出沉浸模式':'进入沉浸模式');$('#expand').title=active?'退出沉浸模式 · 按退出键返回':'进入沉浸模式'}$('#expand').onclick=()=>{document.body.classList.toggle('immersive');updateExpand()};
 function renderTasks(){const list=$('#task-list');list.replaceChildren();const pending=data.tasks.filter(t=>!t.done).length;$('#task-count').textContent=`${pending} 项待办`;$('#completed-count').textContent=`已完成 ${data.tasks.length-pending} 项`;
 if(!data.tasks.length){const empty=document.createElement('div');empty.className='empty-tasks';empty.innerHTML='<span>✧</span>留一点空间给重要的事<br>从一个小目标开始';list.append(empty)}
 for(const task of data.tasks){const row=document.createElement('div');row.className=`task${task.done?' done':''}`;const check=document.createElement('button');check.className='task-check';check.setAttribute('aria-label',`${task.done?'取消完成':'完成'}：${task.text}`);check.setAttribute('aria-pressed',String(task.done));check.innerHTML='<svg><use href="#i-check"/></svg>';check.onclick=()=>{task.done=!task.done;task.completedAt=task.done?Date.now():null;save();renderTasks();renderStats();if(task.done)toast('又完成了一件事，做得很好。')};const text=document.createElement('span');text.className='task-text';text.textContent=task.text;const del=document.createElement('button');del.className='task-delete';del.textContent='×';del.setAttribute('aria-label',`删除：${task.text}`);del.onclick=()=>{data.tasks=data.tasks.filter(t=>t.id!==task.id);save();renderTasks();renderStats()};row.append(check,text,del);list.append(row)} }
 $('#task-form').onsubmit=e=>{e.preventDefault();const input=$('#task-input'),text=input.value.trim();if(!text)return;data.tasks.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),text,done:false,completedAt:null});input.value='';save();renderTasks();input.focus()};
 $('#clear-done').onclick=()=>{data.tasks=data.tasks.filter(t=>!t.done);save();renderTasks()};
 function renderStats(){const today=dayKey(Date.now()),sessions=data.sessions.filter(s=>dayKey(s.at)===today);$('#today-minutes').textContent=sessions.reduce((n,s)=>n+s.minutes,0);
 // Keep completion events independently so clearing tasks does not erase today's progress.
 $('#today-tasks').textContent=(data.completions||[]).filter(c=>dayKey(c.at)===today).length;
 if(!$('#stats-view').hidden)FocusStats.render(data);
 $('#date-label').textContent=new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'});
 }
 // Completion events survive task cleanup; toggling a task twice counts it once per day.
 data.completions=data.completions||data.tasks.filter(t=>t.done&&t.completedAt).map(t=>({id:t.id+'-'+dayKey(t.completedAt),taskId:t.id,at:t.completedAt,text:t.text}));
 $('#task-list').addEventListener('click',e=>{if(!e.target.closest('.task-check'))return;for(const t of data.tasks)if(t.done&&!data.completions.some(c=>c.taskId===t.id&&dayKey(c.at)===dayKey(Date.now())))data.completions.push({id:t.id+'-'+dayKey(t.completedAt),taskId:t.id,at:t.completedAt,text:t.text});save();renderStats()});
 function setView(view){$('#timer-view').hidden=view!=='timer';$('#stats-view').hidden=view!=='stats';$$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('#page-label').textContent=view==='timer'?'专注计时':'专注统计';if(view==='stats'){renderStats();if(user&&Date.now()-lastPull>30000)syncCloud(true)}}
 $$('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('#view-stats').onclick=()=>setView('stats');
 $('.timer-card').addEventListener('pointermove',e=>{const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--mouse-x',`${(e.clientX-r.left)/r.width*100}%`);e.currentTarget.style.setProperty('--mouse-y',`${(e.clientY-r.top)/r.height*100}%`)});
 renderTasks();renderStats();tick();paint();setInterval(tick,250);if(user)syncCloud(true);
})();
