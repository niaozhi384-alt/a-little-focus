(() => {
 const $=s=>document.querySelector(s),AudioClass=window.AudioContext||window.webkitAudioContext;
 const canVibrate=typeof navigator.vibrate==='function',engine=new FocusReminderEngine({AudioContext:AudioClass,vibrate:canVibrate?pattern=>navigator.vibrate(pattern):undefined});let key;
 function note(text){$('#reminder-feedback').textContent=text;$('#reminder-feedback').hidden=false}
 function draw(){const p=engine.preferences;$('#sound-enabled').checked=!!AudioClass&&p.sound;$('#vibration-enabled').checked=canVibrate&&p.vibration;$('#reminder-volume').value=p.volume;$('#reminder-volume-value').textContent=p.volume+'%';$('#reminder-volume').disabled=!AudioClass||!p.sound;$('#vibration-enabled').disabled=!canVibrate;$('#test-vibration').disabled=!canVibrate;$('#vibration-support').textContent=canVibrate?'结束时短暂震动，效果取决于设备支持。':'当前浏览器不支持震动，可使用铃声提醒。';$('#sound-enabled').disabled=!AudioClass;$('#test-sound').disabled=!AudioClass;if(!AudioClass)$('#sound-description').textContent='当前浏览器不支持铃声，结束时仍会显示提示。'}
 function persist(){window.dispatchEvent(new CustomEvent('focus-reminders-change',{detail:{...engine.preferences}}));try{localStorage.setItem(key,JSON.stringify(engine.preferences))}catch{note('本次设置已生效，浏览器暂时无法保存。')}}
 window.FocusReminders={
  init(storageKey){key=storageKey;try{const saved=JSON.parse(localStorage.getItem(key));if(saved&&typeof saved==='object')engine.configure(saved)}catch{}draw();
   $('#sound-enabled').onchange=()=>{engine.configure({sound:$('#sound-enabled').checked});persist();draw();if(engine.preferences.sound)void engine.prepare()};
   $('#vibration-enabled').onchange=()=>{engine.configure({vibration:$('#vibration-enabled').checked});persist();draw()};
   $('#reminder-volume').oninput=()=>{engine.configure({volume:Number($('#reminder-volume').value)});$('#reminder-volume-value').textContent=engine.preferences.volume+'%';persist()};
   $('#test-sound').onclick=async()=>{const button=$('#test-sound');button.disabled=true;try{const ready=await engine.prepare({force:true});const played=ready&&engine.playBell();note(played?'已播放一声清脆铃声，当前开关设置保持不变。':'浏览器暂未允许播放声音，请点击后重试并检查设备音量。')}finally{button.disabled=!AudioClass}};
   $('#test-vibration').onclick=()=>note(engine.vibrate()?'已请求短暂震动；实际效果以设备支持为准。':'此设备暂时无法震动，可选择铃声提醒。');
  },
  get preferences(){return {...engine.preferences}},
  apply(values){engine.configure(values);draw()},
  prepare(){if(engine.preferences.sound)void engine.prepare()},
  complete(endedAt){return engine.complete({late:Date.now()-endedAt>60000})}
 };
})();
