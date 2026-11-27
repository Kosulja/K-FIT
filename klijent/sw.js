const V='kfit-klijent-v40',SHELL=['./','../fonts/fonts.css','instaliraj.html','privatnost.html','index.html','app.js','body.js','stats.js','train.js','plan.js','swap.js','import.js','coach.js','onboard.js','analytics.js','habits.js','exercises.json','manifest.webmanifest','../icons/icon-192.png','../lib/supabase.js','../lib/591.supabase.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('kfit-klijent-')&&x!==V&&x!=='kfit-klijent-img').map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.hostname.endsWith('supabase.co')||u.hostname.includes('youtube'))return;
 if(u.origin===location.origin){e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(V).then(h=>h.put(r,c));return x}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('index.html'))));return}
 const box=u.hostname=='raw.githubusercontent.com'?'kfit-klijent-img':V;
 e.respondWith(caches.match(r).then(m=>m||fetch(r).then(x=>{if(x.ok||x.type==='opaque'){const c=x.clone();caches.open(box).then(h=>h.put(r,c))}return x})))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window'}).then(w=>w.length?w[0].focus():self.clients.openWindow('./')))});
/* push obavijesti s K-FIT servera */
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(x){d={title:'K-FIT',body:e.data&&e.data.text()}}
 e.waitUntil(self.registration.showNotification(d.title||'K-FIT',{body:d.body||'',tag:d.tag||'kfit',icon:'../icons/icon-192.png',badge:'../icons/icon-192.png',data:{url:d.url||'./'}}))});
