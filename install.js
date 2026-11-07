(() => {
 let prompt;
 const button=document.querySelector('#install-app'),help=document.querySelector('#install-help');
 const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;
 function paint(){if(installed()){button.textContent='已添加到桌面';button.disabled=true}}
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event});
 window.addEventListener('appinstalled',()=>{prompt=null;paint()});
 button.onclick=async()=>{if(prompt){await prompt.prompt();await prompt.userChoice;prompt=null;paint();return}help.hidden=false;help.textContent=/iPhone|iPad|iPod/.test(navigator.userAgent)?'在浏览器分享菜单中选择“添加到主屏幕”。若从其他应用打开，请先用 Safari 打开本网站。':'在浏览器菜单中选择“安装应用”或“添加到主屏幕”。电脑也可使用地址栏的安装图标。'};
 paint();if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(()=>{});
})();
