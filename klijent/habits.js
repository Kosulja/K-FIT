/* ============ K-FIT KLIJENT — odstupanja od prehrane (slatko, alkohol…) ============
   Jedan unos po danu: log kind 'slip', id 'slip-YYYY-MM-DD', data {c:{kategorija:broj}, note, clean}.
   Klijent upisuje jednim dodirom; trener vidi isto u Napretku klijenta. */
const SLIPS=[['sweet','Slatko','🍫','porcija'],['alc','Alkohol','🍺','pića'],['fast','Brza hrana','🍔','obroka'],['snack','Grickalice','🥨','puta'],['soda','Sok / gazirano','🥤','čaša'],['late','Kasni obrok','🌙','puta'],['binge','Prejedanje','🍽️','puta']];
const slipOf=(d,L=LOGS)=>{const r=L.find(x=>x.kind=='slip'&&x.day==d);return r?r.data:null};
const slipTot=s=>s?Object.values(s.c||{}).reduce((a,b)=>a+(+b||0),0):0;
function slipRange(L,from,to){const o={},days=[];byKind('slip',L).filter(r=>r.day>=from&&r.day<=to).forEach(r=>{days.push(r);Object.entries(r.data.c||{}).forEach(([k,v])=>o[k]=(o[k]||0)+(+v||0))});return{by:o,tot:Object.values(o).reduce((a,b)=>a+b,0),clean:days.filter(r=>r.data.clean&&!slipTot(r.data)).length,days}}
function cleanRun(L){const ok=new Set(byKind('slip',L).filter(r=>r.data.clean&&!slipTot(r.data)).map(r=>r.day));let best=0,cur=0,prev=null;[...ok].sort().forEach(d=>{cur=prev&&addD(prev,1)==d?cur+1:1;best=Math.max(best,cur);prev=d});return best}

/* ---------- početni ekran ---------- */
let SLT;
function slipsCard(){const t=today(),s=slipOf(t)||{c:{}},tot=slipTot(s),wk=slipRange(LOGS,monday(),t);
 return `<div class="card"><div class="between" style="margin-bottom:10px"><div><div class="kick">Odstupanja od plana</div><div class="b" style="margin-top:2px">${tot?`Danas: ${tot}`:s.clean?'<span style="color:var(--ok)">Danas sve po planu ✓</span>':'Danas još ništa'}</div></div><span class="xs mute" style="text-align:right">ovaj tjedan<br><b style="color:var(--ink);font-size:15px">${wk.tot}</b></span></div>
<div class="slips">${SLIPS.map(([k,l,e])=>{const v=(s.c||{})[k]||0;return `<button class="slip ${v?'on':''}" onclick="slipAdd('${k}')" aria-label="${l}: ${v}"><span class="se">${e}</span><span class="sl">${l}</span>${v?`<span class="sn">${v}</span>`:''}</button>`}).join('')}</div>
<div class="row" style="margin-top:10px;gap:6px">${tot?`<button class="btn sm ghost" onclick="slipM()">${I('edit','sm')} Uredi / bilješka</button>`:`<button class="btn sm ${s.clean?'':'ghost'}" style="${s.clean?'background:var(--ok-soft);color:var(--ok)':''}" onclick="slipClean()">${I('check','sm')} Danas sve po planu</button>`}<span class="xs mute" style="margin-left:auto">dodir = +1</span></div></div>`}
function slipSave(d,data){const r={id:'slip-'+d,kind:'slip',day:d,data},i=LOGS.findIndex(x=>x.id==r.id);if(i>=0)LOGS[i]=r;else LOGS.unshift(r);clearTimeout(SLT);SLT=setTimeout(()=>put(r),600)}
function slipAdd(k){const t=today(),s=clone(slipOf(t)||{c:{}});s.c=s.c||{};s.c[k]=(s.c[k]||0)+1;s.clean=false;slipSave(t,s);if(navigator.vibrate)navigator.vibrate(10);
 const x=SLIPS.find(y=>y[0]==k);toast(`${x[2]} ${x[1]}: ${s.c[k]} ${x[3]} danas`,1600);keepScroll(render)}
function slipClean(){const t=today(),s=clone(slipOf(t)||{c:{}});if(slipTot(s))return slipM();s.clean=!s.clean;slipSave(t,s);if(s.clean)toast('Bravo — dan po planu!');keepScroll(render)}
function slipM(d=today()){const s=clone(slipOf(d)||{c:{}});s.c=s.c||{};
 const o=sheet(`<div class="stack">${sheetHd('Odstupanja · '+(d==today()?'danas':fmt(d)))}<p class="s mute">Bez osuđivanja — trener ovo koristi da prilagodi plan, ne da te kritizira.</p>
<div class="list" id="slm">${SLIPS.map(([k,l,e,u])=>`<div class="between"><span class="row" style="gap:10px"><span style="font-size:22px">${e}</span><span><span class="b s">${l}</span><br><span class="xs mute">${u}</span></span></span><span class="row" style="gap:6px"><button class="btn sm icon" data-k="${k}" data-d="-1" aria-label="Manje">${I('minus','sm')}</button><b class="tnum" style="min-width:22px;text-align:center" id="sv_${k}">${s.c[k]||0}</b><button class="btn sm icon" data-k="${k}" data-d="1" aria-label="Više">${I('plus','sm')}</button></span></div>`).join('')}</div>
<label class="f">Bilješka za trenera (nije obavezno)<textarea class="inp" id="slnote" placeholder="Npr. rođendan, poslovna večera, stres…">${esc(s.note||'')}</textarea></label><button class="btn acc" id="slok">Spremi</button></div>`);
 o.querySelector('#slm').onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;const k=b.dataset.k;s.c[k]=Math.max(0,(s.c[k]||0)+ +b.dataset.d);o.querySelector('#sv_'+k).textContent=s.c[k]};
 o.querySelector('#slok').onclick=()=>{s.note=o.querySelector('#slnote').value.trim();Object.keys(s.c).forEach(k=>{if(!s.c[k])delete s.c[k]});s.clean=!slipTot(s)&&s.clean;slipSave(d,s);close(o);toast('Spremljeno.');keepScroll(render)}}

/* ---------- Napredak (klijent i trener) ---------- */
function slipsSection(L,coach){const t=today(),mon=monday(),dIn=wdi(t),cur=slipRange(L,mon,t),prev=slipRange(L,addD(mon,-7),addD(mon,-7+dIn)),run=cleanRun(L);
 if(!byKind('slip',L).length)return `<div class="card"><h3>Odstupanja od plana</h3><p class="s mute" style="margin-top:6px">${coach?'Klijent još nije upisao odstupanja.':'Upisuj slatko, alkohol i ostalo na početnom ekranu — ovdje vidiš kako ide kroz tjedne.'}</p></div>`;
 const weeks=[...Array(8)].map((_,i)=>{const m=addD(mon,-7*(7-i)),e=i==7?t:addD(m,6),r=slipRange(L,m,e);return{l:pd(m).getDate()+'.'+(pd(m).getMonth()+1)+'.',tip:'Tjedan od '+fmt(m),v:r.tot}});
 const d=cur.tot-prev.tot,notes=byKind('slip',L).filter(r=>r.data.note&&r.day>=addD(t,-13)).sort((a,b)=>b.day.localeCompare(a.day));
 const week7=[...Array(7)].map((_,i)=>addD(mon,i));
 return `<div class="card stack"><div class="between"><h3>Odstupanja od plana</h3><span class="xs b" style="color:${d>0?'var(--bad)':d<0?'var(--ok)':'var(--mute)'}">${d?`${d>0?'▲':'▼'} ${Math.abs(d)} u odnosu na prošli`:'kao prošli tjedan'}</span></div>
<div class="grid3"><div class="card flat" style="padding:10px"><div class="xs mute">Ovaj tjedan</div><div class="b" style="font-size:20px">${cur.tot}</div></div><div class="card flat" style="padding:10px"><div class="xs mute">Dana po planu</div><div class="b" style="font-size:20px">${cur.clean}</div></div><div class="card flat" style="padding:10px"><div class="xs mute">Najdulji niz</div><div class="b" style="font-size:20px">${run} d</div></div></div>
<div style="display:flex;gap:4px">${week7.map(d=>{const s=slipOf(d,L),n=slipTot(s);return `<div style="flex:1;text-align:center" title="${fmt(d)}: ${n}"><div style="height:30px;border-radius:8px;display:grid;place-items:center;font-size:12px;font-weight:700;background:${d>t?'var(--soft)':n?`color-mix(in srgb,var(--bad) ${Math.min(80,20+n*15)}%,var(--soft))`:s&&s.clean?'var(--ok-soft)':'var(--soft)'};color:${n?'var(--ink)':s&&s.clean?'var(--ok)':'var(--mute)'};opacity:${d>t?.4:1}">${d>t?'':n||(s&&s.clean?'✓':'·')}</div><span class="xs mute">${WD[wdi(d)][0]}</span></div>`}).join('')}</div>
${cur.tot?`<div class="chips">${SLIPS.filter(([k])=>cur.by[k]).sort((a,b)=>cur.by[b[0]]-cur.by[a[0]]).map(([k,l,e,u])=>`<span class="chip">${e} ${l} · <b style="color:var(--ink)">${cur.by[k]}</b> ${u}</span>`).join('')}</div>`:''}
<div><div class="kick" style="margin-bottom:6px">Po tjednima</div>${barSVG(weeks,{aria:'Odstupanja po tjednima',fmt:v=>v+' odstupanja',h:150})}</div>
${notes.length?`<div><div class="kick" style="margin-bottom:6px">Bilješke</div><div class="list">${notes.slice(0,4).map(r=>`<div class="s"><b>${fmt(r.day)}</b> · ${esc(r.data.note)} <span class="xs mute">(${slipTot(r.data)})</span></div>`).join('')}</div></div>`:''}
${coach?'':`<button class="btn sm ghost" onclick="slipM()">${I('edit','sm')} Uredi današnji unos</button>`}</div>`}
