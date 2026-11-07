const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const files=['index.html','login.html','style.css','experience.css','theme.css','reminders.css','app.js','auth.js','cloud.js','config.js','stats.js','quotes.js','theme.js','shader.js','reminder-engine.js','reminders.js','icon.svg','vendor/supabase.js','vendor/SUPABASE-LICENSE'];
const out=path.join(__dirname,'dist');
for(const file of files){const src=path.join(__dirname,file);if(file.endsWith('.js'))execFileSync(process.execPath,['--check',src],{stdio:'inherit'});const target=path.join(out,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(src,target)}
console.log(`Prepared ${files.length} public assets in dist.`);
