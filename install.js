(() => {
 const $=selector=>document.querySelector(selector);
 const button=$('#install-app'),dialog=$('#install-dialog');
 if(!button||!dialog)return;
 const nativeButton=$('#install-native'),status=$('#install-status'),steps=$('#install-steps');
 const ua=navigator.userAgent;
 const ios=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const inApp=/MicroMessenger|QQ\/|FBAN|FBAV|Instagram|DingTalk|Weibo/i.test(ua);
 let platform=ios?'ios':/Android/i.test(ua)?'android':'desktop';
 let installPrompt=null,busy=false,installedEvent=false;
 const standalone=matchMedia('(display-mode: standalone)');
 const installed=()=>installedEvent||standalone.matches||navigator.standalone===true;
 const instructions={
  android:[['打开浏览器菜单','点地址栏旁边或底部的“⋮”或“≡”。'],['选择添加到桌面','也可能叫“添加到主屏幕”“安装应用”或“安装并创建快捷方式”。'],['按提示确认添加','回到手机桌面，找到“专注一下”的图标。']],
  ios:[['用系统浏览器打开网站','如果从其他应用进入，请先用系统自带的浏览器打开。'],['打开分享菜单','点击方框向上箭头的分享按钮；部分版本需先打开“更多”菜单。'],['选择添加到主屏幕','向下找到“添加到主屏幕”，按提示确认添加。']],
  desktop:[['打开浏览器菜单','点击地址栏旁边的“⋮”或“…”菜单。'],['选择安装此网站','也可能叫“安装应用”，或位于“应用”“保存和分享”菜单中。'],['确认后从桌面打开','支持安装的浏览器，也会在地址栏显示安装图标。']]
 };
 function paint(){
  const done=installed();
  button.textContent=done?'已添加到桌面':'添加到主屏幕';
  button.disabled=done;
  nativeButton.hidden=done||!installPrompt;
  nativeButton.disabled=busy;
  if(done)status.textContent='已添加。下次从桌面图标打开，就能进入专注。';
 }
 function renderSteps(){
  steps.replaceChildren();
  for(const [title,detail] of instructions[platform]){
   const item=document.createElement('li'),heading=document.createElement('b'),text=document.createElement('p');
   heading.textContent=title;text.textContent=detail;item.append(heading,text);steps.append(item);
  }
  document.querySelectorAll('[data-install-platform]').forEach(tab=>tab.setAttribute('aria-pressed',String(tab.dataset.installPlatform===platform)));
  $('#install-browser-note').textContent=inApp?'当前可能在应用内打开。请先从右上角菜单选择“在浏览器打开”，再添加到桌面。':platform==='android'?'菜单名称因浏览器而异。若没有添加或安装选项，可换用支持网站安装的浏览器打开。':'安装需要在浏览器菜单中确认，网站不能自动替你添加。';
 }
 function openGuide(){
  renderSteps();paint();
  status.textContent=installed()?'已添加。下次从桌面图标打开，就能进入专注。':installPrompt?'当前浏览器支持直接安装，也可以按下方步骤添加。':'按下面三步添加到桌面；需要在浏览器菜单里完成最后确认。';
  if(!dialog.open)dialog.showModal();
 }
 async function requestInstall(){
  if(busy)return;
  if(!installPrompt){openGuide();return}
  const event=installPrompt;installPrompt=null;busy=true;paint();
  status.textContent='请在浏览器弹出的安装窗口中确认。没有弹窗时，可按下方步骤添加。';
  try{
   await event.prompt();
   const choice=await event.userChoice;
   if(!installed())status.textContent=choice?.outcome==='accepted'?'已确认安装，请稍等并查看桌面图标。':'你取消了安装。需要时可以从浏览器菜单继续添加。';
  }catch{
   status.textContent='浏览器未能打开安装窗口。请按下方步骤，从浏览器菜单添加。';
  }finally{busy=false;paint()}
 }
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();installPrompt=event;paint();
  if(dialog.open&&!busy)status.textContent='当前浏览器已准备好，点击“立即安装”继续。';
 });
 window.addEventListener('appinstalled',()=>{installedEvent=true;installPrompt=null;paint()});
 standalone.addEventListener?.('change',paint);
 button.addEventListener('click',()=>{openGuide();if(installPrompt)requestInstall()});
 nativeButton.addEventListener('click',requestInstall);
 $('#close-install').addEventListener('click',()=>dialog.close());
 $('#install-done').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const rect=dialog.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
 });
 document.querySelectorAll('[data-install-platform]').forEach(tab=>tab.addEventListener('click',()=>{platform=tab.dataset.installPlatform;renderSteps()}));
 const address=$('#install-address');address.value=location.origin+'/';
 $('#install-copy').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(address.value);status.textContent='网址已复制，可以粘贴到手机浏览器中打开。'}
  catch{address.focus();address.select();status.textContent='请长按上方网址复制，再粘贴到手机浏览器中打开。'}
 });
 paint();
})();
