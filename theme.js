(() => {
 const themes=[
  {id:'violet',name:'暮紫',hue:254,saturation:78,rgb:[.68,.57,.95]},
  {id:'blue',name:'雾蓝',hue:211,saturation:78,rgb:[.39,.68,.96]},
  {id:'mint',name:'薄荷',hue:158,saturation:48,rgb:[.37,.79,.65]},
  {id:'amber',name:'暖杏',hue:31,saturation:75,rgb:[.94,.66,.38]},
  {id:'rose',name:'蔷薇',hue:337,saturation:64,rgb:[.91,.48,.67]},
  {id:'cyan',name:'青池',hue:184,saturation:58,rgb:[.34,.76,.81]}
 ];
 let current=themes[0];try{current=themes.find(t=>t.id===localStorage.getItem('focus-theme'))||current}catch{}
 function apply(theme,persist=false){current=theme;const root=document.documentElement;root.dataset.theme=theme.id;root.style.setProperty('--theme-h',theme.hue);root.style.setProperty('--theme-s',theme.saturation+'%');
  document.querySelectorAll('[data-theme-preset]').forEach(button=>{const selected=button.dataset.themePreset===theme.id;button.setAttribute('aria-pressed',String(selected));button.classList.toggle('selected',selected)});
  document.querySelectorAll('[data-theme-name]').forEach(el=>el.textContent=theme.name);if(persist)try{localStorage.setItem('focus-theme',theme.id)}catch{}
  window.dispatchEvent(new CustomEvent('focus-theme-change',{detail:{id:theme.id,rgb:theme.rgb}}));
 }
 window.FocusTheme={get rgb(){return current.rgb},get name(){return current.name}};apply(current);
 document.addEventListener('DOMContentLoaded',()=>{
  const dialog=document.createElement('dialog');dialog.id='theme-dialog';dialog.innerHTML='<div class="section-heading"><h2>换一种心情</h2><button type="button" class="icon-button" data-theme-close aria-label="关闭主题设置">×</button></div><p class="section-description">选一个此刻喜欢的颜色，让这个空间更像你。</p><div class="theme-options" data-theme-options role="group" aria-label="主题配色"></div><p class="theme-save-note"><span class="theme-saved-dot"></span><span data-theme-name></span> · 已自动保存</p>';
  document.body.append(dialog);document.querySelectorAll('[data-theme-options]').forEach(group=>{for(const theme of themes){const button=document.createElement('button');button.type='button';button.className='theme-option';button.dataset.themePreset=theme.id;button.setAttribute('aria-label',theme.name+'主题');button.style.setProperty('--swatch',`hsl(${theme.hue} ${theme.saturation}% 72%)`);const swatch=document.createElement('span');swatch.className='theme-swatch';swatch.setAttribute('aria-hidden','true');const text=document.createElement('span');text.textContent=theme.name;button.append(swatch,text);group.append(button)}});
  document.querySelectorAll('[data-theme-open]').forEach(button=>button.addEventListener('click',()=>dialog.showModal()));
  document.addEventListener('click',event=>{const preset=event.target.closest('[data-theme-preset]');if(preset){apply(themes.find(t=>t.id===preset.dataset.themePreset),true);return}if(event.target.closest('[data-theme-close]'))dialog.close()});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()});apply(current);
 });
 window.addEventListener('storage',event=>{if(event.key==='focus-theme')apply(themes.find(t=>t.id===event.newValue)||themes[0])});
})();
