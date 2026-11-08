// Register independently of the install guide and account state on both entry pages.
(() => {
 'use strict';
 if(!('serviceWorker' in navigator)||!window.isSecureContext)return;
 const register=()=>navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'})
  .catch(error=>console.warn('专注一下：离线服务暂未启用。',error));
 if(document.readyState==='complete')register();
 else window.addEventListener('load',register,{once:true});
})();
