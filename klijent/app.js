/* ============ K-FIT KLIJENT v2 — jezgra ============
   Ista Supabase baza kao trenerska K-FIT app (../).
   Datoteke: app.js (jezgra, prijava, Danas, Ja) · stats.js (grafovi, mišići, baza vježbi)
             train.js (tjedan, progresija, vođeni trening) · coach.js (trener + pokretanje) */
const CFG={url:'https://jcxooxyrpahcwsvvzybo.supabase.co',key:'sb_publishable_FG7mdGIEQm_VkdBDayS9DA_fO59I82d',ig:'https://instagram.com/kosulja98'};

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jattr=v=>esc(JSON.stringify(v));
const uid=()=>Math.random().toString(36).slice(2,10);
const ds=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const pd=s=>{const[a,b,c]=s.split('-');return new Date(a,b-1,c)};
const today=()=>ds(new Date()),addD=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return ds(d)};
const daysTo=s=>Math.round((pd(s)-pd(today()))/864e5);
const fmt=s=>s?s.split('-').reverse().join('.'):'—';
const WD=['Pon','Uto','Sri','Čet','Pet','Sub','Ned'],wdi=s=>(pd(s).getDay()+6)%7;
const MJ=['sij','velj','ožu','tra','svi','lip','srp','kol','ruj','lis','stu','pro'];
const num=v=>{const n=parseFloat(String(v??'').replace(',','.'));return isFinite(n)?n:null};
const n1=v=>v==null||v===''?'—':(+v).toLocaleString('hr-HR',{maximumFractionDigits:1});
const mmss=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const clone=o=>JSON.parse(JSON.stringify(o));
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};

/* ručno crtane ikone (iste na svakom mobitelu) */
const P={home:'<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',dumb:'<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/>',chart:'<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',drop:'<path d="M12 2.7s6 6.4 6 11.3a6 6 0 0 1-12 0c0-4.9 6-11.3 6-11.3z"/>',play:'<path d="M7 4v16l13-8z"/>',
plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',check:'<path d="m5 12 5 5 9-10"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',up:'<path d="m6 15 6-6 6 6"/>',down:'<path d="m6 9 6 6 6-6"/>',
chev:'<path d="m9 6 6 6-6 6"/>',back:'<path d="m15 6-6 6 6 6"/>',out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
steps:'<path d="M5 17c0-3 .6-8 3.2-8S10 13 10 15s-1 4-2.6 4S5 18.3 5 17zM19 12c0-3-.6-8-3.2-8S14 8 14 10s1 4 2.6 4S19 13.3 19 12z"/>',
scale:'<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 10a5 5 0 0 1 8 0l-3 2.5"/>',wallet:'<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',box:'<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .6 3.5 2.3 3.5 5.2"/>',
edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
msg:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',flame:'<path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 3-5 5-5 8a7 7 0 0 0 7 7z"/>',
copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',heart:'<path d="M12 20s-8-4.6-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.4 12 20 12 20z"/>',
link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
move:'<path d="M5 9 2 12l3 3M19 9l3 3-3 3M2 12h20"/>',skip:'<path d="m5 4 10 8-10 8zM19 5v14"/>',trophy:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
print:'<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
file:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
body:'<circle cx="12" cy="4.5" r="2.5"/><path d="M6 9h12M12 9v6M9 22l3-7 3 7"/>',run:'<circle cx="15" cy="4" r="2"/><path d="M6 21l3-6 3 2v4M9 15l2-6 4 3 3 1M11 9 7 10l-2 3"/>',
timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'};
P.refresh='<path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5"/>';
const I=(n,c='')=>`<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true">${P[n]||''}</svg>`;

let T0;function toast(m,ms){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(T0);T0=setTimeout(()=>t.classList.remove('on'),ms||2400)}

/* ============ POSTAVKE, TEME ============ */
const ACC={kfit:['#c9a54e','#86671d'],bakar:['#e0975c','#b4622a'],crvena:['#f07a6a','#c0392b'],narancasta:['#f59e42','#c2610c'],zlatna:['#e8c35a','#9a7400'],zelena:['#5fd08a','#15803d'],tirkiz:['#4fd1c5','#0f766e'],plava:['#6fa8f5','#1d5fc4'],ljubicasta:['#b18cf5','#6d3fd1']};
const ACCN={kfit:'K-FIT zlatna',bakar:'Bakar',crvena:'Crvena',narancasta:'Narančasta',zlatna:'Zlatna',zelena:'Zelena',tirkiz:'Tirkizna',plava:'Plava',ljubicasta:'Ljubičasta'};
const DEF_SET={lang:null,goalKg:null,effort:'rir',wake:true,theme:'auto',acc:'kfit',fig:'m',notif:false};
function applyTheme(s){const r=document.documentElement;if(!s.theme||s.theme=='auto')r.removeAttribute('data-theme');else r.dataset.theme=s.theme;const a=ACC[s.acc]||ACC.kfit;r.style.setProperty('--acc-d',a[0]);r.style.setProperty('--acc-l',a[1]);
 setTimeout(()=>{const m=document.querySelector('meta[name=theme-color]');if(m)m.content=getComputedStyle(document.body).backgroundColor},0)}
applyTheme(LS.get('kfitk-theme',{}));

/* ============ JEZIK (HR / EN) ============
   Bira se na prijavi; mijenja nazive vježbi i tekst prijave. */
let LANG=LS.get('kfitk-lang',null)||((navigator.language||'hr').toLowerCase().startsWith('en')?'en':'hr');
const T=(h,e)=>LANG=='en'?e:h;
const langSeg=(fn='setLang')=>`<div class="seg" style="width:112px" role="group" aria-label="Jezik / Language"><button type="button" class="${LANG=='hr'?'on':''}" onclick="${fn}('hr')">HR</button><button type="button" class="${LANG=='en'?'on':''}" onclick="${fn}('en')">EN</button></div>`;
function setLang(l){LANG=l;LS.set('kfitk-lang',l);document.documentElement.lang=l;if(ROLE=='client'){saveSet({lang:l});keepScroll(render)}else if(ROLE=='coach'){keepScroll(coachRender)}else loginView()}
document.documentElement.lang=LANG;

/* ============ PODACI ============ */
const PREVIEW=!!window.KFIT_PREVIEW; /* samo za pregled na linku: uvijek demo, bez baze */
const DEMO=PREVIEW||new URLSearchParams(location.search).has('demo')||LS.get('kfitk-demo-on',false);
let SB=null,ROLE=null,CID=null,ME=null,PROG=null,LOGS=[],VIEW='home',CUST=[];
let COACH={list:[],links:{},act:{},sel:null,tab:'prog',prog:null,logs:[]};
const EMPTY_PROG=()=>({msg:'',water:3000,glass:250,steps:8000,days:[]});
const setts=(L=LOGS)=>{const r=L.find(x=>x.kind=='settings');return{...DEF_SET,...(r?r.data:{})}};
async function saveSet(p,cid){const L=cid?COACH.logs:LOGS,s={...setts(L),...p},r={id:'settings',kind:'settings',day:today(),data:s};
 if(cid){const i=L.findIndex(x=>x.id=='settings');if(i>=0)L[i]=r;else L.push(r);try{await API.put(cid,r)}catch(e){toast('Spremanje nije uspjelo.')}return}
 await put(r);applyTheme(s);LS.set('kfitk-theme',{theme:s.theme,acc:s.acc})}

const API=DEMO?{
 async claim(){const ro=DROLE||LS.get('kfitk-demo-role','client');if(ro=='new')return{role:'new',email:'novi.klijent@primjer.hr'};return{role:ro,client_id:DB().cur||'c1',onboarded:true}},
 async onboard(q){const d=DB(),id='a'+uid(),t=today();const c={id,f:q.f,l:q.l||'',tel:q.tel||'',em:'novi.klijent@primjer.hr',bd:q.bd||'',sd:t,sv:'Online coaching',goal:q.goal||'',st:'Aktivan',photo:'',notes:[{ts:new Date().toISOString(),txt:q.txt}],upitnik:{...q,em:'novi.klijent@primjer.hr',ts:new Date().toISOString()}};delete c.upitnik.txt;
  d.clients.push(c);d.links.push({client_id:id,email:c.em});d.prog[id]=EMPTY_PROG();d.logs[id]=[...(q.kg?[{id:'weight-'+t,kind:'weight',day:t,data:{kg:num(q.kg)}}]:[]),...(['waist','belly','hips','thigh','arm'].some(k=>q[k])?[{id:'measure-'+t,kind:'measure',day:t,data:Object.fromEntries(['waist','belly','hips','thigh','arm'].filter(k=>q[k]).map(k=>[k,q[k]]))}]:[])];d.me[id]={client:{f:c.f,l:c.l,goal:c.goal,sd:t},packs:[],trainings:[]};d.cur=id;save(d);DROLE='client';return{role:'client',client_id:id,new:true}},
 async me(){return DB().me[CID]||null},
 async program(c){return DB().prog[c]||null},
 async saveProgram(c,p){const d=DB();d.prog[c]=p;save(d)},
 async logs(c,from){return(DB().logs[c]||[]).filter(r=>r.day>=from||r.kind=='settings').sort((a,b)=>b.day.localeCompare(a.day))},
 async put(c,r){const d=DB();d.logs[c]=(d.logs[c]||[]).filter(x=>x.id!=r.id);d.logs[c].push(clone(r));save(d)},
 async del(c,id){const d=DB();d.logs[c]=(d.logs[c]||[]).filter(x=>x.id!=id);save(d)},
 async clients(){return DB().clients},async packs(){return DB().packs||[]},async links(){return DB().links},
 async accCreate(cid,u,pw){const d=DB();if(d.links.some(l=>l.client_id==cid))throw new Error('Klijent već ima pristup.');d.links.push({client_id:cid,email:u+UDOM,created_at:new Date().toISOString()});save(d);return{username:u}},
 async accReset(cid,pw){return{}},async accRemove(cid){const d=DB();d.links=d.links.filter(l=>l.client_id!=cid);save(d);return{ok:true}},
 async activity(from){const d=DB(),o={};Object.entries(d.logs).forEach(([c,L])=>L.filter(r=>r.day>=from).forEach(r=>(o[c]=o[c]||[]).push(r)));return o},
 async unlink(c){const d=DB();d.links=d.links.filter(l=>l.client_id!=c);save(d)},
 async uploadPhoto(c,name,blob){const small=await shrink(blob,520,.72),url=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(small)}),d=DB(),p=c+'/'+name;d.files=d.files||{};d.files[p]=url;save(d);return p},
 async photoUrl(p){return(DB().files||{})[p]||''},
 async catalog(){return[{id:'on6',n:'Online coaching – 6 mj',p:700,t:0,d:180},{id:'on2',n:'Online coaching – 2 mj',p:250,t:0,d:60},{id:'in2_1',n:'Individualni 2x tjedno – 1 mj',p:320,t:8,d:30}]},
 async importAll(B){const d=DB();B.clients.forEach(c=>{const i=d.clients.findIndex(x=>x.id==c.id);if(i>=0)d.clients[i]=c;else d.clients.push(c)});d.packs=[...(d.packs||[]),...B.packs];d.pays=[...(d.pays||[]),...B.pays];
  B.progs.forEach(p=>{d.prog[p.c]=mergeProg(d.prog[p.c],p.p,p.mode)});B.weights.forEach(w=>{d.logs[w.c]=(d.logs[w.c]||[]).filter(x=>x.id!=w.r.id).concat([w.r])});save(d)}
}:{
 async claim(){const{data,error}=await SB.rpc('kfit_claim');if(error)throw error;return data},
 async onboard(q){const{data,error}=await SB.rpc('kfit_onboard',{q});if(error)throw error;return data},
 async me(){const{data,error}=await SB.rpc('kfit_me');if(error)throw error;return data},
 async program(c){const{data,error}=await SB.from('kfit_programs').select('data').eq('client_id',c).maybeSingle();if(error)throw error;return data?data.data:null},
 async saveProgram(c,p){const{error}=await SB.from('kfit_programs').upsert({client_id:c,data:p,updated_at:new Date().toISOString()});if(error)throw error},
 async logs(c,from){const out=[];for(let f=0;;f+=1000){const{data,error}=await SB.from('kfit_logs').select('id,kind,day,data').eq('client_id',c).or(`day.gte.${from},kind.eq.settings`).order('day',{ascending:false}).range(f,f+999);if(error)throw error;out.push(...data);if(data.length<1000)break}return out},
 async put(c,r){const{error}=await SB.from('kfit_logs').upsert({client_id:c,id:r.id,kind:r.kind,day:r.day,data:r.data,updated_at:new Date().toISOString()});if(error)throw error},
 async del(c,id){const{error}=await SB.from('kfit_logs').delete().eq('client_id',c).eq('id',id);if(error)throw error},
 async packs(){const{data,error}=await SB.from('kdocs').select('data').eq('col','packs');if(error)throw error;return data.map(r=>r.data)},
async clients(){const{data,error}=await SB.from('kdocs').select('id,data').eq('col','clients');if(error)throw error;return data.filter(r=>!r.data.ar).map(r=>({id:r.id,...r.data}))},
 async links(){const{data,error}=await SB.from('kfit_links').select('client_id,email,created_at');if(error)throw error;return data},
 async accCreate(cid,uname,pw){const{data,error}=await SB.rpc('kfit_acc_create',{cid,uname,pw});if(error)throw error;return data},
 async accReset(cid,pw){const{data,error}=await SB.rpc('kfit_acc_reset',{cid,pw});if(error)throw error;return data},
 async accRemove(cid){const{data,error}=await SB.rpc('kfit_acc_remove',{cid});if(error)throw error;return data},
 async activity(from){const{data,error}=await SB.from('kfit_logs').select('client_id,id,kind,day,data').gte('day',from).limit(5000);if(error)throw error;const o={};data.forEach(r=>(o[r.client_id]=o[r.client_id]||[]).push(r));return o},
 async unlink(c){const{error}=await SB.from('kfit_links').delete().eq('client_id',c);if(error)throw error},
 async uploadPhoto(c,name,blob){const p=c+'/'+name,{error}=await SB.storage.from('kfit-photos').upload(p,blob,{contentType:'image/jpeg',upsert:false});if(error)throw error;return p},
 async photoUrl(p){const{data,error}=await SB.storage.from('kfit-photos').createSignedUrl(p,3600);if(error)throw error;return data.signedUrl},
 async catalog(){const{data,error}=await SB.from('kdocs').select('data').eq('col','catalog');if(error)throw error;return data.map(r=>r.data).filter(x=>x&&x.a!==0)},
 async importAll(B){const now=new Date().toISOString(),rows=[...B.clients.map(d=>({col:'clients',id:d.id,data:d,updated_at:now})),...B.packs.map(d=>({col:'packs',id:d.id,data:d,updated_at:now})),...B.pays.map(d=>({col:'pays',id:d.id,data:d,updated_at:now}))];
  for(let i=0;i<rows.length;i+=200){const{error}=await SB.from('kdocs').upsert(rows.slice(i,i+200));if(error)throw error}
  if(B.log.length){const mon=today().slice(0,7),{data}=await SB.from('kdocs').select('data').eq('col','log').eq('id',mon).maybeSingle(),d=data&&data.data?data.data:{id:mon,e:[]};d.e=[...(d.e||[]),...B.log];const{error}=await SB.from('kdocs').upsert({col:'log',id:mon,data:d,updated_at:now});if(error)throw error}
  for(const p of B.progs){const old=await API.program(p.c);const{error}=await SB.from('kfit_programs').upsert({client_id:p.c,data:mergeProg(old,p.p,p.mode),updated_at:now});if(error)throw error}
  for(const w of B.weights){const{error}=await SB.from('kfit_logs').upsert({client_id:w.c,id:w.r.id,kind:w.r.kind,day:w.r.day,data:w.r.data,updated_at:now});if(error)throw error}}
};
/* postojeći program se ne briše: dodaju se samo dani kojih još nema (po nazivu) */
function mergeProg(old,neu,mode){if(!old||!(old.days||[]).length||mode=='replace')return neu;const have=new Set(old.days.map(d=>String(d.name).trim().toLowerCase()));return{...old,days:[...old.days,...neu.days.filter(d=>!have.has(String(d.name).trim().toLowerCase()))],updated:neu.updated}}
let MEMDB=null;const DB=()=>{let d=LS.get('kfitk-demo6',null)||MEMDB;if(!d){d=demoSeed();LS.set('kfitk-demo6',d)}MEMDB=d;return d};
const save=d=>{MEMDB=d;LS.set('kfitk-demo6',d)};

/* — spremanje s redom čekanja (teretana bez signala) — */
let OUT=LS.get('kfitk-out',{});
async function put(r){r.data=r.data||{};const i=LOGS.findIndex(x=>x.id==r.id);if(i>=0)LOGS[i]=r;else LOGS.unshift(r);if(r.day==today()&&/^(food|water|steps)$/.test(r.kind))setTimeout(()=>{try{goalCheck()}catch(e){console.error(e)}},150);
 try{await API.put(CID,r);delete OUT[r.id]}catch(e){OUT[r.id]={c:CID,r};toast('Spremljeno na mobitel. Poslat ću kad bude interneta.')}LS.set('kfitk-out',OUT)}
async function delLog(id){LOGS=LOGS.filter(x=>x.id!=id);delete OUT[id];LS.set('kfitk-out',OUT);try{await API.del(CID,id)}catch(e){}}
async function flush(){for(const[k,v]of Object.entries(OUT)){try{await API.put(v.c,v.r);delete OUT[k]}catch(e){break}}LS.set('kfitk-out',OUT)}
window.addEventListener('online',flush);

const byKind=(k,L=LOGS)=>L.filter(r=>r.kind==k);
const dayVal=(k,d,f,L=LOGS)=>{const r=L.find(x=>x.kind==k&&x.day==d);return r?r.data[f]:null};
const lastW=(L=LOGS)=>byKind('weight',L).sort((a,b)=>b.day.localeCompare(a.day))[0]||null;
const workouts=(L=LOGS)=>byKind('workout',L).sort((a,b)=>a.day.localeCompare(b.day));

/* ============ PRIJAVA ============ */
const app=$('#app');
function shell(inner,tabs){if(tabs===undefined&&ROLE=='coach'&&typeof coachTabs=='function')tabs=coachTabs();app.innerHTML=(DEMO?`<div class="demo-banner">Demo: izmišljeni podaci, spremaju se samo u ovom pregledniku ${PREVIEW?'':'· <button class="b" style="text-decoration:underline" onclick="exitDemo()">Izađi</button>'} · <button class="b" style="text-decoration:underline" onclick="resetDemo()">Resetiraj</button></div>`:'')+
`<header id="top"><div class="brand">K<b>-</b>FIT</div><span class="chip ${ROLE=='coach'?'acc':''}">${ROLE=='coach'?'Trener':'Klijent'}</span><div class="sp"></div>${DEMO?`<button class="btn sm ghost" onclick="demoSwitch()">${ROLE=='coach'?'Kao klijent':'Kao trener'}</button>`:''}</header><main id="main">${inner}</main>${tabs||''}`;afterRender()}
function exitDemo(){LS.set('kfitk-demo-on',false);location.href=location.pathname}
function resetDemo(){LS.del('kfitk-demo6');LS.del(DK);MEMDB=null;if(PREVIEW){VIEW='home';return enter()}location.reload()}
let DROLE=null;function demoSwitch(){DROLE=ROLE=='coach'?'client':'coach';LS.set('kfitk-demo-role',DROLE);if(PREVIEW){VIEW='home';COACH.sel=null;return enter()}location.reload()}
let AFTER=[];const after=f=>AFTER.push(f);function afterRender(){const a=AFTER;AFTER=[];a.forEach(f=>{try{f()}catch(e){console.error(e)}})}

async function enter(){
 app.innerHTML=`<div class="center empty">Učitavam…</div>`;
 let r;try{r=await API.claim()}catch(e){console.error(e);return loginView('Baza još nije pripremljena (pokreni supabase-klijenti.sql) ili nema interneta.')}
 ROLE=r.role;
 if(ROLE=='coach')return coachHome();
 if(ROLE=='new')return onboardView({email:r.email});
 if(ROLE=='expired')return expiredView(r);
 if(ROLE=='client'&&r.tmp)return setPwView(r);
 if(ROLE=='client'&&r.onboarded===false)return onboardView({email:r.email,pre:r.pre});
 if(ROLE=='client'){CID=r.client_id;UNTIL=r.until||null;return loadClient()}
 if(ROLE=='unconfirmed')return infoView('Potvrdi email','Poslali smo ti link za potvrdu na email. Klikni ga pa se vrati ovdje i prijavi.');
 if(ROLE=='none')return infoView('Račun još nije povezan',`Tvoj račun (<b>${esc(r.email)}</b>) još nije povezan s programom. Javi se treneru da upiše ovaj email u tvoj profil, a onda se samo ponovno prijavi.`);
 loginView();
}
let UNTIL=null;
/* istek paketa: podsjetnik 7 dana i 1 dan prije, na dan isteka pristup se zatvara (pravilo je u bazi) */
function expiredView(r){shell(`<div class="center card stack" style="max-width:440px">${I('clock')}<h1>Paket je istekao</h1><p class="mute">${r.f?esc(r.f)+', t':'T'}voj paket${r.ended?' je istekao '+fmt(r.ended):' nije aktivan'}, pa je pristup aplikaciji zatvoren. Tvoji podaci i napredak ostaju sačuvani.</p><p class="mute">Za nastavak suradnje javi se treneru. Čim produžiš paket, pristup se otvara sam.</p><a class="btn acc full" href="${CFG.ig}" target="_blank" rel="noopener">${I('msg')} Javi se treneru</a><button class="btn ghost full" onclick="enter()">Provjeri ponovno</button><button class="btn ghost full" onclick="logout()">Odjava</button></div>`)}
function expiryCard(){if(!UNTIL||DEMO)return'';const d=daysTo(UNTIL);if(d>7||d<1)return'';
 const t=d==1?`Paket ti ističe <b>sutra</b>. Od ${fmt(UNTIL)} pristup aplikaciji se zatvara dok ne produžiš suradnju.`:`Paket ti ističe za <b>${d} dana</b> (${fmt(UNTIL)}). Ako želiš nastaviti, javi se treneru za produženje.`;
 const k='kfitk-exp-'+UNTIL+'-'+d;if((d==7||d==1)&&!LS.get(k,0)){LS.set(k,1);after(()=>sheet(`<div class="stack">${sheetHd(d==1?'Paket ističe sutra':'Paket ističe za tjedan dana')}<p>${t}</p><a class="btn acc full" href="${CFG.ig}" target="_blank" rel="noopener">${I('msg')} Javi se treneru</a><button class="btn ghost full" data-x>U redu</button></div>`))}
 return `<div class="card" style="border-color:${d<=1?'var(--bad)':'var(--warn)'}"><div class="row" style="align-items:flex-start">${I('clock')}<div style="flex:1"><p style="margin:0">${t}</p><a class="btn sm ghost" style="margin-top:10px" href="${CFG.ig}" target="_blank" rel="noopener">${I('msg')} Javi se treneru</a></div></div></div>`}
function infoView(t,m){shell(`<div class="center card stack">${I('user')}<h1>${t}</h1><p class="mute">${m}</p><a class="btn ghost" href="${CFG.ig}" target="_blank" rel="noopener">${I('msg')} Javi se na Instagramu</a><button class="btn" onclick="enter()">Pokušaj ponovno</button><button class="btn ghost" onclick="logout()">${I('out')} Odjava</button></div>`)}
let AUTHMODE='in';
/* korisničko ime → interni email (trener otvara račun bez emaila) */
const UDOM='@k-fit.local';
const normUser=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/\s+/g,'.').replace(/[^a-z0-9._-]/g,'').replace(/^[._-]+/,'').slice(0,30);
const toLogin=s=>{s=String(s||'').trim();return s.includes('@')?s.toLowerCase():normUser(s)+UDOM};
const dispLogin=e=>String(e||'').endsWith(UDOM)?String(e).slice(0,-UDOM.length):String(e||'');
/* prva prijava: klijent postavlja svoju lozinku umjesto privremene */
function setPwView(r){shell(`<form class="center card stack" id="spf" style="max-width:420px">${I('lock')}<h1>Tvoja lozinka</h1><p class="mute">Dobio si privremenu lozinku od trenera. Sad postavi svoju, koju ćeš koristiti ubuduće.</p>
<div class="card flat" style="padding:12px 14px"><div class="xs mute">Korisničko ime</div><div class="b">${esc(dispLogin(r.email||''))}</div></div>
<label class="f">Nova lozinka<input class="inp" id="sp1" type="password" minlength="8" autocomplete="new-password" required></label>
<label class="f">Ponovi lozinku<input class="inp" id="sp2" type="password" minlength="8" autocomplete="new-password" required></label>
<p class="xs mute">Najmanje 8 znakova. Zapamti je ili spremi u mobitel kad te pita.</p><div id="spe" class="s" style="color:var(--bad)"></div>
<button class="btn acc full">Spremi i nastavi</button></form>`);
 const f=$('#spf');f.onsubmit=async e=>{e.preventDefault();const a=$('#sp1').value,b=$('#sp2').value,er=$('#spe'),bt=f.querySelector('button');
  if(a.length<8){er.textContent='Lozinka mora imati barem 8 znakova.';return}if(a!=b){er.textContent='Lozinke se ne podudaraju.';return}
  bt.disabled=true;const{error}=await SB.auth.updateUser({password:a,data:{tmp:false}});
  if(error){bt.disabled=false;er.textContent=/same|different/i.test(error.message)?'Nova lozinka mora biti drukčija od privremene.':error.message;return}
  toast('Lozinka spremljena.');enter()}}
function pwChangeM(){const o=sheet(`<form class="stack" id="pcf">${sheetHd('Promijeni lozinku')}<label class="f">Nova lozinka<input class="inp" id="pc1" type="password" minlength="8" autocomplete="new-password" required></label><label class="f">Ponovi lozinku<input class="inp" id="pc2" type="password" minlength="8" autocomplete="new-password" required></label><div id="pce" class="s" style="color:var(--bad)"></div><button class="btn acc">Spremi</button></form>`);
 o.querySelector('#pcf').onsubmit=async e=>{e.preventDefault();const a=o.querySelector('#pc1').value,b=o.querySelector('#pc2').value,er=o.querySelector('#pce');if(a!=b){er.textContent='Lozinke se ne podudaraju.';return}
  if(DEMO){close(o);toast('U demu se lozinka ne mijenja.');return}const{error}=await SB.auth.updateUser({password:a});if(error){er.textContent=error.message;return}close(o);toast('Lozinka promijenjena.')}}
function loginView(msg){ROLE=null;const m={in:T('Prijavi se','Sign in'),up:T('Napravi račun','Create account'),re:T('Pošalji link','Send link')}[AUTHMODE];
app.innerHTML=`<div style="padding:16px"><form id="lg" class="center card stack" autocomplete="on">
<div class="between"><div class="brand" style="font-size:30px">K<b>-</b>FIT</div>${langSeg()}</div><p class="mute s">${T('Tvoj program, treninzi i napredak na jednom mjestu.','Your program, workouts and progress in one place.')}</p><p class="xs mute" style="margin-top:-6px">${T('Jezik naziva vježbi možeš promijeniti i kasnije u postavkama.','You can change the exercise name language later in settings.')}</p>
<div class="seg"><button type="button" class="${AUTHMODE=='in'?'on':''}" onclick="AUTHMODE='in';loginView()">${T('Prijava','Sign in')}</button><button type="button" class="${AUTHMODE=='up'?'on':''}" onclick="AUTHMODE='up';loginView()">${T('Registracija','Sign up')}</button></div>
${AUTHMODE=='up'?`<p class="xs mute">${T('Već treniraš s trenerom? Koristi <b>isti email</b> koji si mu dao. Novi si? Nakon potvrde emaila ispunjavaš kratki upitnik i tvoj profil se kreira sam.','Already training with the coach? Use the <b>same email</b> you gave him. New here? After confirming your email you fill in a short questionnaire and your profile is created automatically.')}</p>`:''}
<label class="f">${AUTHMODE=='in'?T('Korisničko ime ili email','Username or email'):'Email'}<input class="inp" id="lem" type="${AUTHMODE=='in'?'text':'email'}" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="username" required></label>
${AUTHMODE!='re'?`<label class="f">${T('Lozinka','Password')}<input class="inp" id="lpw" type="password" minlength="8" autocomplete="${AUTHMODE=='up'?'new-password':'current-password'}" required></label>`:''}
<div id="lerr" class="s" style="color:var(--bad)">${esc(msg||'')}</div>
<button class="btn acc" type="submit">${m}</button>
${AUTHMODE=='in'?`<button type="button" class="xs mute" onclick="AUTHMODE='re';loginView()">${T('Zaboravljena lozinka?','Forgot password?')}</button>`:AUTHMODE=='re'?`<button type="button" class="xs mute" onclick="AUTHMODE='in';loginView()">${T('Natrag na prijavu','Back to sign in')}</button>`:''}
<hr style="border:0;border-top:1px solid var(--line);width:100%;margin:4px 0"><button type="button" class="btn ghost sm" onclick="LS.set('kfitk-demo-on',true);location.reload()">${I('play','sm')} ${T('Pogledaj demo','View demo')}</button></form></div>`;
$('#lg').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button[type=submit]'),em=toLogin($('#lem').value),pw=$('#lpw')&&$('#lpw').value,err=$('#lerr');
 if(!SB){err.textContent='Nema veze s bazom.';return}b.disabled=true;err.textContent='';
 try{if(AUTHMODE=='in'){const{error}=await SB.auth.signInWithPassword({email:em,password:pw});if(error)throw error;enter()}
 else if(AUTHMODE=='up'){const{data,error}=await SB.auth.signUp({email:em,password:pw,options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw error;if(data.session)enter();else infoView(T('Provjeri email','Check your email'),T('Poslali smo link za potvrdu na <b>','We sent a confirmation link to <b>')+esc(em)+T('</b>. Nakon potvrde se prijavi ovdje.','</b>. After confirming, sign in here.'))}
 else{if(em.endsWith(UDOM))throw new Error(T('Za korisničko ime novu lozinku ti daje trener. Javi mu se.','For a username login, your coach sets a new password. Contact him.'));const{error}=await SB.auth.resetPasswordForEmail(em,{redirectTo:location.origin+location.pathname});if(error)throw error;err.style.color='var(--ok)';err.textContent=T('Link za novu lozinku je poslan na email.','A password reset link has been sent to your email.')}}
 catch(x){err.textContent=/Invalid login/i.test(x.message)?T('Pogrešno korisničko ime/email ili lozinka.','Wrong username/email or password.'):/registered/i.test(x.message)?T('Taj email već ima račun. Prijavi se.','That email already has an account. Sign in.'):x.message}b.disabled=false}}
function newPwView(){app.innerHTML=`<div style="padding:16px"><form id="np" class="center card stack"><h1>Nova lozinka</h1><label class="f">Nova lozinka<input class="inp" id="npw" type="password" minlength="8" autocomplete="new-password" required></label><div id="nerr" class="s" style="color:var(--bad)"></div><button class="btn acc">Spremi</button></form></div>`;
$('#np').onsubmit=async e=>{e.preventDefault();const{error}=await SB.auth.updateUser({password:$('#npw').value});if(error){$('#nerr').textContent=error.message;return}history.replaceState(null,'',location.pathname);toast('Lozinka promijenjena.');enter()}}
async function logout(){if(DEMO)return exitDemo();await SB.auth.signOut();AUTHMODE='in';loginView()}

/* ============ KLIJENT ============ */
async function loadClient(){
 try{[ME,PROG,LOGS]=await Promise.all([API.me(),API.program(CID),API.logs(CID,addD(today(),-400))]);}catch(e){console.error(e);toast('Greška učitavanja.')}
 PROG=PROG||EMPTY_PROG();LOGS=LOGS||[];
 Object.values(OUT).forEach(v=>{if(v.c==CID){const i=LOGS.findIndex(x=>x.id==v.r.id);if(i>=0)LOGS[i]=v.r;else LOGS.unshift(v.r)}});flush();
 const s=setts();applyTheme(s);LS.set('kfitk-theme',{theme:s.theme,acc:s.acc});
 if(s.lang&&s.lang!=LANG){LANG=s.lang;LS.set('kfitk-lang',LANG)}else if(!s.lang&&!DEMO)saveSet({lang:LANG});
 if(LS.get(DK,null))VIEW='workout';
 if(LS.get('kfitk-badges-'+CID,null)==null)try{newBadges()}catch(e){}
 render();
 loadLib().then(()=>{if(VIEW!='workout'&&ROLE=='client'&&!$('.ov'))keepScroll(render)}).catch(()=>{});
}
document.addEventListener('visibilitychange',async()=>{if(document.hidden||ROLE!='client'||VIEW=='workout'||DEMO||$('.ov'))return;try{PROG=(await API.program(CID))||PROG;ME=await API.me()||ME;render()}catch(e){}});

function tabs(){const T=[['home','home','Danas'],['train','dumb','Trening'],['prog','chart','Napredak'],['pack','user','Ja']];
return `<nav id="tabs"><div class="in">${T.map(([k,i,l])=>`<button class="${VIEW==k?'on':''}" onclick="go('${k}')">${I(i)}${l}</button>`).join('')}</div></nav>`}
function go(v){VIEW=v;const b=document.body;b.classList.add('enter');render();scrollTo(0,0);clearTimeout(go.t);go.t=setTimeout(()=>b.classList.remove('enter'),700)}
function render(){if(ROLE=='coach')return coachRender();
 if(VIEW=='workout')return workoutView();
 const V={home:homeView,train:trainView,prog:()=>progressView(),pack:packView}[VIEW]||homeView;shell(V(),tabs())}
function keepScroll(f){const y=scrollY;f();scrollTo(0,y)}

function streak(){let n=0,d=today();const has=x=>byKind('workout').some(r=>r.day==x)||(dayVal('water',x,'ml')||0)>=(PROG.water||3000);if(!has(d))d=addD(d,-1);while(has(d)){n++;d=addD(d,-1)}return n}
function nextSession(){return ME&&(ME.trainings||[]).filter(x=>x.s=='Zakazano'&&x.d>=today()).sort((a,b)=>(a.d+a.tm).localeCompare(b.d+b.tm))[0]}

function homeView(){const c=(ME&&ME.client)||{},h=new Date().getHours(),hi=h<11?'Dobro jutro':h<18?'Bok':'Dobra večer';
 const T=todayPlan(),wk=weekItems(),done=wk.filter(x=>x.done).length,plan=wk.filter(x=>x.date).length||(PROG.days||[]).length,st=streak(),nx=nextSession();
 const ciDue=!byKind('checkin').some(r=>r.day>=addD(today(),-6));
 let tw;
 if(T.done)tw=`<div class="between"><div style="min-width:0"><div class="kick">Današnji trening</div><h2 style="margin-top:4px">${esc(T.done.data.name)}</h2><p class="s mute">${T.done.data.dur||'—'} min · ${vol(T.done).toLocaleString('hr-HR')} kg${(T.done.data.prs||[]).length?' · <span class="pr">'+T.done.data.prs.length+' PR</span>':''}</p></div><span class="chip ok">${I('check','sm')} Gotovo</span></div><button class="btn ghost full" style="margin-top:12px" onclick="resumeW('${T.done.id}')">${I('play','sm')} Nastavi trening</button>`;
 else if(T.day)tw=`<div class="kick">Današnji trening${T.moved?' · premješten':''}</div><h2 style="margin:4px 0 2px">${esc(T.day.name)}</h2><p class="s mute">${T.day.ex.length} vježbi, ${T.day.ex.reduce((s,e)=>s+(+e.s||1),0)} serija, oko ${estMin(T.day)} min</p><button class="btn acc full" style="margin-top:12px" onclick="startW('${T.day.id}')">${I('play')} Kreni s treningom</button>`;
 else if((PROG.days||[]).length)tw=`<div class="kick">Danas</div><h2 style="margin-top:4px">Dan odmora</h2><p class="s mute">Šetnja, istezanje i dovoljno vode.${T.next?' Sljedeće: <b>'+esc(T.next.day.name)+'</b> ('+WD[wdi(T.next.date)]+')':''}</p><button class="btn ghost full" style="margin-top:12px" onclick="go('train')">Ipak treniraj ili premjesti trening</button>`;
 else tw=`<div class="kick">Program</div><h2 style="margin-top:4px">Uskoro stiže</h2><p class="s mute">Trener ti priprema program. Do tada možeš pratiti vodu, korake i težinu.</p>`;
 return `<div class="stack">
${expiryCard()}
<div><div class="kick">${new Date().toLocaleDateString('hr-HR',{weekday:'long',day:'numeric',month:'long'}).replace(/^./,x=>x.toUpperCase())}</div><h1 style="margin-top:4px">${hi}${c.f?', '+esc(c.f):''}</h1></div>
${PROG.msg?`<div class="card hero"><div class="row" style="align-items:flex-start">${I('msg')}<div><div class="kick" style="color:var(--acc)">Poruka trenera</div><p style="margin-top:4px;white-space:pre-line">${esc(PROG.msg)}</p></div></div></div>`:''}
<div class="card ${T.day&&!T.done?'hero':''}">${tw}</div>
${foodCard()}
${waterCard()}
${slipsCard()}
<div class="grid2">${statCard('steps','Koraci danas',dayVal('steps',today(),'n'),PROG.steps?'cilj '+PROG.steps.toLocaleString('hr-HR'):'','logSteps()')}${statCard('scale','Težina',lastW()?n1(lastW().data.kg)+' kg':null,goalLine(),'logWeight()')}</div>
<div class="card"><div class="between"><div><div class="kick">Ovaj tjedan</div><div class="big" style="margin-top:6px">${done}<span class="mute" style="font-size:20px"> / ${plan||'—'}</span></div><p class="xs mute">treninga</p></div>
<div style="text-align:right"><div class="kick">Niz</div><div class="big" style="margin-top:6px;color:var(--acc)">${st}</div><p class="xs mute">${st==1?'dan':'dana'} zaredom</p></div></div>
<div style="display:flex;gap:4px;margin-top:12px">${WD.map((w,i)=>{const d=addD(monday(),i),has=byKind('workout').some(r=>r.day==d),pl=wk.some(x=>x.date==d&&!x.done);return `<div style="flex:1;text-align:center"><i style="display:block;height:8px;border-radius:4px;background:${has?'var(--acc)':pl?'var(--acc-mid)':'var(--soft)'};opacity:${pl&&!has?.5:1}"></i><span class="xs mute">${w[0]}</span></div>`}).join('')}</div></div>
${nx?`<div class="card"><div class="row">${I('cal')}<div style="flex:1"><div class="kick">Sljedeći trening s trenerom</div><p class="b" style="margin-top:2px">${WD[wdi(nx.d)]} ${fmt(nx.d)} · ${esc(nx.tm||'')}</p></div><span class="chip">${daysTo(nx.d)==0?'danas':daysTo(nx.d)==1?'sutra':'za '+daysTo(nx.d)+' d'}</span></div></div>`:''}
${(PROG.days||[]).length?challengeCard():''}
${photosCard()}
${ciDue?`<button class="card tap" onclick="checkinM()">${I('heart')}<div style="flex:1"><div class="b">Tjedni check-in</div><p class="s mute">2 minute: san, energija, apetit, bilješka za trenera</p></div>${I('chev')}</button>`:''}
</div>`}
function goalLine(){const s=setts(),w=lastW();if(!w)return'';if(s.goalKg){const d=+w.data.kg-s.goalKg;return Math.abs(d)<.05?'cilj postignut!':'do cilja '+n1(Math.abs(d))+' kg'}return w.day==today()?'danas':fmt(w.day)}
function statCard(i,l,v,sub,fn){return `<button class="card tap" style="display:block" onclick="${fn}"><div class="between"><span class="kick">${l}</span>${I(i,'sm')}</div><div class="big" style="margin-top:8px;font-size:28px">${v==null?'<span class="mute">—</span>':typeof v=='number'?v.toLocaleString('hr-HR'):v}</div><p class="xs mute" style="margin-top:2px">${sub?sub+' · ':''}<span style="color:var(--acc)">upiši</span></p></button>`}
function waterCard(){const ml=dayVal('water',today(),'ml')||0,g=PROG.water||3000,gl=PROG.glass||250,p=Math.min(1,ml/g),C=2*Math.PI*42;
 return `<div class="card"><div class="water-wrap"><div class="ring"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="42" fill="none" stroke="var(--water-soft)" stroke-width="9"/><circle cx="48" cy="48" r="42" fill="none" stroke="var(--water)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-p)}" style="transition:stroke-dashoffset .4s"/></svg><div class="v"><div><div class="b tnum" style="font-size:20px">${(ml/1000).toLocaleString('hr-HR',{maximumFractionDigits:2})} L</div><div class="xs mute">od ${(g/1000).toLocaleString('hr-HR')} L</div></div></div></div>
<div style="flex:1;display:grid;gap:8px;min-width:0"><div class="row" style="color:var(--water)">${I('drop')}<span class="b" style="color:var(--ink)">Voda</span>${p>=1?'<span class="chip ok">Cilj!</span>':''}</div>
<div class="row" style="gap:6px"><button class="btn sm icon" aria-label="Manje" onclick="water(-${gl})">${I('minus','sm')}</button><button class="btn sm" style="flex:1;background:var(--water-soft);color:var(--water);padding:0 8px" onclick="water(${gl})">+ ${gl} ml</button><button class="btn sm" style="background:var(--water-soft);color:var(--water);padding:0 8px" onclick="water(500)">+ 0,5 L</button></div></div></div></div>`}
let WT;function water(d){const t=today(),ml=Math.max(0,(dayVal('water',t,'ml')||0)+d);const i=LOGS.findIndex(x=>x.id=='water-'+t),r={id:'water-'+t,kind:'water',day:t,data:{ml}};if(i>=0)LOGS[i]=r;else LOGS.unshift(r);keepScroll(render);
 if(navigator.vibrate)navigator.vibrate(8);clearTimeout(WT);WT=setTimeout(()=>put(r),700)}

/* — modal — */
function sheet(html,onMount){const o=document.createElement('div');o.className='ov';o.innerHTML=`<div class="sheet" role="dialog">${html}</div>`;o.onclick=e=>{if(e.target==o)close(o)};document.body.append(o);
 o.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>close(o));onMount&&onMount(o);return o}
function close(o){if(o._onclose)o._onclose();o.remove()}
/* potvrda unutar appa (umjesto preglednikovog confirm) */
function ask(msg,yes='Da',danger){return new Promise(res=>{const o=sheet(`<div class="stack"><p class="b" style="font-size:17px">${esc(msg)}</p><div class="grid2"><button class="btn ghost" data-n>Ne</button><button class="btn ${danger?'':'acc'}" style="${danger?'background:var(--bad);color:#fff':''}" data-y>${esc(yes)}</button></div></div>`);let v=false;o._onclose=()=>res(v);o.querySelector('[data-n]').onclick=()=>close(o);o.querySelector('[data-y]').onclick=()=>{v=true;close(o)}})}
const sheetHd=t=>`<div class="between" style="margin-bottom:4px"><h2>${t}</h2><button type="button" class="btn sm icon ghost" data-x aria-label="Zatvori">${I('x','sm')}</button></div>`;
function numM(title,label,val,unit,cb,extra){const o=sheet(`<form class="stack">${sheetHd(title)}<label class="f">${label}<div class="row"><input class="inp" name="v" inputmode="decimal" value="${val??''}" style="font-size:22px;font-weight:700"><span class="mute b">${unit}</span></div></label>${extra||''}<label class="f">Datum<input class="inp" type="date" name="d" value="${today()}" max="${today()}"></label><button class="btn acc">Spremi</button></form>`);
 const f=o.querySelector('form');setTimeout(()=>f.v.focus(),50);f.onsubmit=e=>{e.preventDefault();const v=num(f.v.value);if(v==null){toast('Upiši broj.');return}cb(v,f.d.value||today(),f);o.remove();keepScroll(render)}}
function logWeight(){const w=lastW();numM('Težina','Jutarnja težina, natašte',w&&w.day==today()?w.data.kg:'','kg',(v,d)=>{put({id:'weight-'+d,kind:'weight',day:d,data:{kg:v}});toast('Težina spremljena.')})}
function logSteps(){numM('Koraci','Broj koraka',dayVal('steps',today(),'n')||'','koraka',(v,d)=>{put({id:'steps-'+d,kind:'steps',day:d,data:{n:Math.round(v)}});toast('Koraci spremljeni.')})}
function goalM(cid){const L=cid?COACH.logs:LOGS,s=setts(L);numM('Ciljana težina','Cilj',s.goalKg||'','kg',async v=>{await saveSet({goalKg:v},cid);toast('Cilj postavljen.');if(cid)coachClient()})}
function checkinM(){const q=[['sleep','San'],['energy','Energija'],['hunger','Glad / apetit'],['stress','Stres']],v={sleep:5,energy:5,hunger:5,stress:5};
 const o=sheet(`<form class="stack">${sheetHd('Tjedni check-in')}<p class="s mute">Ocijeni od 1 do 10. San i energija: 10 = odlično. Glad i stres: 10 = jako izraženo.</p>
${q.map(([k,l])=>`<div><div class="xs b mute" style="margin-bottom:5px">${l}</div><div class="scale" data-k="${k}" style="flex-wrap:wrap">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button type="button" class="${n==5?'on':''}" data-n="${n}" style="flex:1 0 calc(20% - 6px)">${n}</button>`).join('')}</div></div>`).join('')}
<div class="grid2"><label class="f">Težina (kg)<input class="inp" name="kg" inputmode="decimal" value="${lastW()&&lastW().day==today()?lastW().data.kg:''}"></label><label class="f">Opseg struka (cm)<input class="inp" name="waist" inputmode="decimal"></label></div>
<label class="f">Kako je prošao tjedan? Što je bilo teško?<textarea class="inp" name="note"></textarea></label><button class="btn acc">Pošalji treneru</button></form>`);
 o.querySelectorAll('.scale').forEach(s=>s.onclick=e=>{const b=e.target.closest('button');if(!b)return;s.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x==b));v[s.dataset.k]=+b.dataset.n});
 const f=o.querySelector('form');f.onsubmit=e=>{e.preventDefault();const t=today(),kg=num(f.kg.value);put({id:'ci-'+t,kind:'checkin',day:t,data:{...v,sc:10,waist:num(f.waist.value),kg,note:f.note.value.trim()}});if(kg)put({id:'weight-'+t,kind:'weight',day:t,data:{kg}});o.remove();toast('Check-in poslan. Bravo!');render()}}

/* — Ja: paket + postavke — */
function packView(){const c=(ME&&ME.client)||{},P=(ME&&ME.packs)||[],t=today(),act=P.filter(k=>k.e>=t&&(!k.t||k.used<k.t)),old=P.filter(k=>!act.includes(k)),TR=((ME&&ME.trainings)||[]).filter(x=>x.d>=t&&x.s=='Zakazano'),s=setts();
 const row=(ic,l,sub,ctl)=>`<div class="between"><div class="row" style="min-width:0">${I(ic)}<div style="min-width:0"><div class="b s">${l}</div>${sub?`<div class="xs mute">${sub}</div>`:''}</div></div>${ctl}</div>`;
 const tg=(on,fn)=>`<button class="tgl ${on?'on':''}" role="switch" aria-checked="${on}" onclick="${fn}"></button>`;
 return `<div class="stack"><div class="row"><div class="av" style="width:52px;height:52px;font-size:22px">${esc((c.f||'?')[0])}${esc((c.l||'')[0]||'')}</div><div><h1>${esc((c.f||'')+' '+(c.l||''))}</h1>${c.goal?`<p class="s mute">Cilj: ${esc(c.goal)}</p>`:''}</div></div>
<h2 style="margin-top:6px">Moj paket</h2>
${act.length?act.map(k=>{const dl=daysTo(k.e),tot=Math.max(1,daysTo(k.e)-daysTo(k.s));return `<div class="card hero"><div class="between"><h3>${esc(k.n)}</h3><span class="chip ${dl<=7?'warn':'ok'}">Aktivan</span></div>
${k.t?`<div style="margin-top:12px"><div class="between s"><span class="mute">Iskorišteno treninga</span><b class="tnum">${k.used} / ${k.t}</b></div><div class="bar" style="margin-top:6px"><i style="width:${k.used/k.t*100}%"></i></div><p class="xs mute" style="margin-top:6px">Preostalo: <b style="color:var(--ink)">${k.t-k.used}</b></p></div>`:''}
<div style="margin-top:12px"><div class="between s"><span class="mute">${fmt(k.s)} – ${fmt(k.e)}</span><b>${dl} ${dl==1?'dan':'dana'}</b></div><div class="bar" style="margin-top:6px"><i style="width:${Math.min(100,Math.max(0,(1-dl/tot)*100))}%"></i></div></div></div>`}).join('')
:`<div class="card empty">Nema aktivnog paketa. Za produljenje se javi treneru.</div>`}
${TR.length?`<div class="card"><h3 style="margin-bottom:10px">Zakazani treninzi s trenerom</h3><div class="list">${TR.map(x=>`<div class="between"><span class="b s">${WD[wdi(x.d)]} ${fmt(x.d)}</span><span class="s mute tnum">${esc(x.tm||'')}${x.du?' · '+x.du+' min':''}</span></div>`).join('')}</div></div>`:''}
${old.length?`<details class="card"><summary class="b s">Prijašnji paketi (${old.length})</summary><div class="list" style="margin-top:10px">${old.map(k=>`<div class="between s"><span>${esc(k.n)}</span><span class="mute">${fmt(k.s)} – ${fmt(k.e)}</span></div>`).join('')}</div></details>`:''}
<h2 style="margin-top:6px">Postavke</h2>
<div class="card"><div class="list">
${DEMO?`<div class="between"><div class="row" style="min-width:0">${I('file')}<div><div class="b s">Upitnik za nove klijente</div><div class="xs mute">samo u demu: vidi što novi klijent ispunjava</div></div></div><button class="btn sm acc" onclick="DROLE='new';enter()">Pogledaj</button></div>`:''}
${row('msg','Jezik naziva vježbi','HR ili EN. Drugi naziv je sitno ispod',langSeg())}
${row('scale','Ciljana težina',s.goalKg?n1(s.goalKg)+' kg':'nije postavljena',`<button class="btn sm" onclick="goalM()">${s.goalKg?'Promijeni':'Postavi'}</button>`)}
${row('sun','Ekran ostaje upaljen','dok traje trening',tg(s.wake,"saveSet({wake:!setts().wake}).then(()=>keepScroll(render))"))}
${row('bolt','Težina serije','RIR ili RPE kao dodatni stupac',`<select class="inp" style="width:auto;min-height:36px" onchange="saveSet({effort:this.value}).then(()=>keepScroll(render))">${[['off','Isključeno'],['rir','RIR'],['rpe','RPE']].map(([v,l])=>`<option value="${v}" ${s.effort==v?'selected':''}>${l}</option>`).join('')}</select>`)}
${row('bell','Obavijest za kraj odmora','zvuk + vibracija + obavijest',tg(s.notif,'toggleNotif()'))}
${row('body','Figura na mapi mišića','',`<div class="seg" style="width:120px"><button class="${s.fig!='f'?'on':''}" onclick="saveSet({fig:'m'}).then(()=>keepScroll(render))">M</button><button class="${s.fig=='f'?'on':''}" onclick="saveSet({fig:'f'}).then(()=>keepScroll(render))">Ž</button></div>`)}
<div><div class="row" style="margin-bottom:10px">${I('sun')}<div class="b s">Tema</div></div><div class="seg">${[['auto','Auto'],['dark','Tamna'],['light','Svijetla']].map(([v,l])=>`<button class="${s.theme==v?'on':''}" onclick="saveSet({theme:'${v}'}).then(()=>keepScroll(render))">${l}</button>`).join('')}</div>
<div class="accs" style="margin-top:12px">${Object.keys(ACC).map(k=>`<button class="${s.acc==k?'on':''}" style="background:${ACC[k][0]}" title="${ACCN[k]}" aria-label="${ACCN[k]}" onclick="saveSet({acc:'${k}'}).then(()=>keepScroll(render))"></button>`).join('')}</div></div>
</div></div>
<div class="card stack"><a class="btn ghost" href="${CFG.ig}" target="_blank" rel="noopener">${I('msg')} Poruka treneru</a><button class="btn ghost" onclick="exportData()">${I('file')} Izvezi moje podatke (JSON)</button><button class="btn ghost" onclick="installHelp()">${I('down')} Dodaj na početni zaslon</button><a class="btn ghost" href="privatnost.html" target="_blank">${I('file')} Privatnost i uvjeti</a><button class="btn ghost" onclick="pwChangeM()">${I('edit')} Promijeni lozinku</button><button class="btn ghost" onclick="logout()">${I('out')} Odjava</button></div></div>`}
async function toggleNotif(){const s=setts();if(!s.notif&&'Notification' in window&&Notification.permission!='granted'){const p=await Notification.requestPermission();if(p!='granted')toast('Obavijesti nisu dopuštene. Ostaju zvuk i vibracija.')}await saveSet({notif:!s.notif});keepScroll(render)}
function download(name,text,type='application/json'){const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
function exportData(){download('kfit-moji-podaci-'+today()+'.json',JSON.stringify({izvoz:new Date().toISOString(),program:PROG,unosi:LOGS},null,1));toast('Datoteka preuzeta.')}
let BIP=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();BIP=e});
function installHelp(){if(BIP){BIP.prompt();BIP=null;return}sheet(`<div class="stack">${sheetHd('Instaliraj app')}<p><b>iPhone (Safari):</b> tipka Dijeli → „Dodaj na početni zaslon”.</p><p><b>Android (Chrome):</b> izbornik ⋮ → „Instaliraj aplikaciju”.</p><a class="btn ghost sm" href="instaliraj.html" target="_blank">Detaljne upute s koracima</a></div>`)}
