(() => {
 const cloud=FocusCloud,allowed=new Set(['theme','focus','short','long','sound','vibration','volume']);
 let user,key,values={},pending={},busy=false,timer;
 const read=k=>{try{return JSON.parse(localStorage.getItem(k))||{}}catch{return{}}};
 const emit=()=>window.dispatchEvent(new CustomEvent('focus-preferences-ready',{detail:{...values}}));
 function persist(){try{localStorage.setItem(key,JSON.stringify({values,pending}))}catch{}}
 async function flush(){if(!user||busy||!Object.keys(pending).length)return;busy=true;const batch={...pending};try{const {error}=await cloud.client.from('focus_preferences').upsert(Object.entries(batch).map(([key,value])=>({user_id:user.id,key,value,updated_at:new Date().toISOString()})),{onConflict:'user_id,key'});if(error)throw error;for(const k of Object.keys(batch))if(JSON.stringify(pending[k])===JSON.stringify(batch[k]))delete pending[k];persist()}finally{busy=false;if(Object.keys(pending).length&&navigator.onLine)timer=setTimeout(()=>flush().catch(()=>{}),10000)}}
 async function pull(){if(!user)return;await flush();const {data,error}=await cloud.client.from('focus_preferences').select('key,value').eq('user_id',user.id);if(error)throw error;for(const row of data)if(!(row.key in pending)&&allowed.has(row.key))values[row.key]=row.value;persist();emit()}
 const prefs=window.FocusPreferences={get:(k,fallback)=>values[k]??fallback,set(k,value){if(!allowed.has(k)||values[k]===value)return;values[k]=value;pending[k]=value;persist();clearTimeout(timer);if(user)timer=setTimeout(()=>flush().catch(()=>{}),500)},pull,flush};
 prefs.ready=cloud.ready.then(async account=>{user=account;key='focus-preferences-'+(user?.id||'guest');const saved=read(key);values=saved.values||{};pending=saved.pending||{};if(user)try{await pull()}catch{}emit();return prefs});
 window.addEventListener('online',()=>pull().catch(()=>{}));
 window.addEventListener('focus-theme-change',event=>{if(key&&event.detail.persist)prefs.set('theme',event.detail.id)});
 window.addEventListener('focus-reminders-change',event=>{for(const k of ['sound','vibration','volume'])prefs.set(k,event.detail[k])});
 window.addEventListener('focus-preferences-ready',()=>{const theme=values.theme;if(theme)FocusTheme.set(theme);if(window.FocusReminders)FocusReminders.apply({sound:values.sound,vibration:values.vibration,volume:values.volume})});
})();
