(() => {
 const recoveryRequested=new URLSearchParams(location.hash.slice(1)).get('type')==='recovery';
 // Keep the original Supabase URL so existing session storage and recovery links stay valid.
 // HTTPS deployments relay only this project's Auth and REST traffic through Vercel.
 const transport={};
 if(location.protocol==='https:'){
  const upstream=new URL(FOCUS_CONFIG.url),nativeFetch=window.fetch.bind(window);
  transport.fetch=async(input,init={})=>{
   const isRequest=typeof Request!=='undefined'&&input instanceof Request;
   const url=new URL(isRequest?input.url:input);
   if(url.origin!==upstream.origin||!/^\/(auth|rest)\/v1(?:\/|$)/.test(url.pathname))return nativeFetch(input,init);
   const target=location.origin+(FOCUS_CONFIG.proxyPath||'/api/focus')+url.pathname+url.search;
   let options={...init};
   if(isRequest){
    const request=new Request(input,init);
    options={method:request.method,headers:request.headers,signal:request.signal,referrerPolicy:request.referrerPolicy,integrity:request.integrity,keepalive:request.keepalive};
    if(request.method!=='GET'&&request.method!=='HEAD')options.body=await request.arrayBuffer();
   }
   // Preserve JSON as a string. Rebuilding a Request with another Request as init
   // turns its body into a stream, which fails on HTTP/1 and some mobile browsers.
   const callerSignal=options.signal;
   const controller=new AbortController(),abort=()=>controller.abort();
   if(callerSignal?.aborted)abort();else callerSignal?.addEventListener('abort',abort,{once:true});
   const timeout=setTimeout(abort,15000);
   try{return await nativeFetch(target,{...options,signal:controller.signal,cache:'no-store',credentials:'omit',redirect:'error'})}
   finally{clearTimeout(timeout);callerSignal?.removeEventListener('abort',abort)}
  };
 }
 const client=window.supabase.createClient(FOCUS_CONFIG.url,FOCUS_CONFIG.key,{global:transport,auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const cloud=window.FocusCloud={client,user:null,known:new Set(),busy:false,recoveryRequested};
 function applyDataReset(account){
  const revision=account.app_metadata?.focus_data_reset_at;
  if(typeof revision!=='string'||!revision)return;
  try{
   const marker='focus-data-reset-'+account.id;
   if(localStorage.getItem(marker)===revision)return;
   const base='a-little-focus-user-'+account.id;
   for(const key of [base,base+'-reminders','focus-preferences-'+account.id,'focus-quote-history-'+account.id,'focus-quotes-'+account.id])localStorage.removeItem(key);
   localStorage.setItem(marker,revision);
  }catch{}
 }
 cloud.ready=client.auth.getSession().then(async({data,error})=>{if(error)throw error;if(!data.session)return null;const verified=await client.auth.getUser();if(verified.error)return null;const check=await client.rpc('focus_session_info');if(check.error)throw check.error;if(!check.data){await client.auth.signOut({scope:'local'});return null}applyDataReset(verified.data.user);cloud.user=verified.data.user;cloud.expiresAt=Date.parse(check.data);return cloud.user}).catch(()=>null);
 cloud.pull=async()=>{if(!cloud.user)return[];let rows=[],offset=0;while(true){const {data,error}=await client.from('focus_events').select('id,kind,occurred_at,minutes,task_label').eq('user_id',cloud.user.id).order('occurred_at',{ascending:true}).order('id',{ascending:true}).range(offset,offset+999);if(error)throw error;rows.push(...data);if(data.length<1000)break;offset+=1000}rows.forEach(r=>cloud.known.add(r.id));return rows};
 cloud.push=async(state)=>{if(!cloud.user||cloud.busy)return;const rows=[...state.sessions.map(s=>({id:s.id,kind:'focus',occurred_at:new Date(s.at).toISOString(),minutes:s.minutes,task_label:''})),...(state.completions||[]).map(c=>({id:c.id,kind:'task',occurred_at:new Date(c.at).toISOString(),minutes:0,task_label:c.text||''}))].filter(r=>!cloud.known.has(r.id));if(!rows.length)return;cloud.busy=true;try{for(let i=0;i<rows.length;i+=200){const batch=rows.slice(i,i+200).map(r=>({...r,user_id:cloud.user.id}));const {error}=await client.from('focus_events').upsert(batch,{onConflict:'user_id,id',ignoreDuplicates:true});if(error)throw error;batch.forEach(r=>cloud.known.add(r.id))}}finally{cloud.busy=false}};
 client.auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY')cloud.recoveryRequested=true;if(event==='SIGNED_OUT'&&cloud.user)location.replace('./');if(event==='SIGNED_IN'&&cloud.user&&session?.user.id!==cloud.user.id)location.reload()});
})();
