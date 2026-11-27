/* ============ K-FIT KLIJENT — odstupanja od prehrane (slatko, alkohol…) ============
   Jedan unos po danu: log kind 'slip', id 'slip-YYYY-MM-DD', data {c:{kategorija:broj}, note, clean}.
   Klijent upisuje jednim dodirom; trener vidi isto u Napretku klijenta. */
const SLIPS=[['sweet','Slatko','','porcija'],['alc','Alkohol','','pića'],['fast','Brza hrana','','obroka'],['snack','Grickalice','','puta'],['soda','Sok / gazirano','','čaša'],['late','Kasni obrok','','puta'],['binge','Prejedanje','','puta']];
const slipOf=(d,L=LOGS)=>{const r=L.find(x=>x.kind=='slip'&&x.day==d);return r?r.data:null};
const slipTot=s=>s?Object.values(s.c||{}).reduce((a,b)=>a+(+b||0),0):0;
function slipRange(L,from,to){const o={},days=[];byKind('slip',L).filter(r=>r.day>=from&&r.day<=to).forEach(r=>{days.push(r);Object.entries(r.data.c||{}).forEach(([k,v])=>o[k]=(o[k]||0)+(+v||0))});return{by:o,tot:Object.values(o).reduce((a,b)=>a+b,0),clean:days.filter(r=>r.data.clean&&!slipTot(r.data)).length,days}}
function cleanRun(L){const ok=new Set(byKind('slip',L).filter(r=>r.data.clean&&!slipTot(r.data)).map(r=>r.day));let best=0,cur=0,prev=null;[...ok].sort().forEach(d=>{cur=prev&&addD(prev,1)==d?cur+1:1;best=Math.max(best,cur);prev=d});return best}

/* ---------- početni ekran ---------- */
let SLT;
function slipsCard(){const t=today(),s=slipOf(t)||{c:{}},tot=slipTot(s),wk=slipRange(LOGS,monday(),t);
 return `<div class="card"><div class="between" style="margin-bottom:10px"><div><div class="kick">Odstupanja od plana</div><div class="b" style="margin-top:2px">${tot?`Danas: ${tot}`:s.clean?'<span style="color:var(--ok)">Danas sve po planu</span>':'Danas još ništa'}</div></div><span class="xs mute" style="text-align:right">ovaj tjedan<br><b style="color:var(--ink);font-size:15px">${wk.tot}</b></span></div>
<div class="slips">${SLIPS.map(([k,l,e])=>{const v=(s.c||{})[k]||0;return `<button class="slip ${v?'on':''}" onclick="slipAdd('${k}')" aria-label="${l}: ${v}"><span class="sl">${l}</span>${v?`<span class="sn">${v}</span>`:''}</button>`}).join('')}</div>
<div class="row" style="margin-top:10px;gap:6px">${tot?`<button class="btn sm ghost" onclick="slipM()">${I('edit','sm')} Uredi / bilješka</button>`:`<button class="btn sm ${s.clean?'':'ghost'}" style="${s.clean?'background:var(--ok-soft);color:var(--ok)':''}" onclick="slipClean()">${I('check','sm')} Danas sve po planu</button>`}<span class="xs mute" style="margin-left:auto">dodir = +1</span></div></div>`}
function slipSave(d,data){const r={id:'slip-'+d,kind:'slip',day:d,data},i=LOGS.findIndex(x=>x.id==r.id);if(i>=0)LOGS[i]=r;else LOGS.unshift(r);clearTimeout(SLT);SLT=setTimeout(()=>put(r),600)}
function slipAdd(k){const t=today(),s=clone(slipOf(t)||{c:{}});s.c=s.c||{};s.c[k]=(s.c[k]||0)+1;s.clean=false;slipSave(t,s);if(navigator.vibrate)navigator.vibrate(10);
 const x=SLIPS.find(y=>y[0]==k);toast(`${x[1]}: ${s.c[k]} ${x[3]} danas`,1600);keepScroll(render)}
function slipClean(){const t=today(),s=clone(slipOf(t)||{c:{}});if(slipTot(s))return slipM();s.clean=!s.clean;slipSave(t,s);if(s.clean)toast('Dan po planu.');keepScroll(render)}
function slipM(d=today()){const s=clone(slipOf(d)||{c:{}});s.c=s.c||{};
 const o=sheet(`<div class="stack">${sheetHd('Odstupanja · '+(d==today()?'danas':fmt(d)))}<p class="s mute">Bez osuđivanja. Trener ovo koristi da prilagodi plan, ne da te kritizira.</p>
<div class="list" id="slm">${SLIPS.map(([k,l,e,u])=>`<div class="between"><span class="row" style="gap:10px"><span><span class="b s">${l}</span><br><span class="xs mute">${u}</span></span></span><span class="row" style="gap:6px"><button class="btn sm icon" data-k="${k}" data-d="-1" aria-label="Manje">${I('minus','sm')}</button><b class="tnum" style="min-width:22px;text-align:center" id="sv_${k}">${s.c[k]||0}</b><button class="btn sm icon" data-k="${k}" data-d="1" aria-label="Više">${I('plus','sm')}</button></span></div>`).join('')}</div>
<label class="f">Bilješka za trenera (nije obavezno)<textarea class="inp" id="slnote" placeholder="Npr. rođendan, poslovna večera, stres…">${esc(s.note||'')}</textarea></label><button class="btn acc" id="slok">Spremi</button></div>`);
 o.querySelector('#slm').onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;const k=b.dataset.k;s.c[k]=Math.max(0,(s.c[k]||0)+ +b.dataset.d);o.querySelector('#sv_'+k).textContent=s.c[k]};
 o.querySelector('#slok').onclick=()=>{s.note=o.querySelector('#slnote').value.trim();Object.keys(s.c).forEach(k=>{if(!s.c[k])delete s.c[k]});s.clean=!slipTot(s)&&s.clean;slipSave(d,s);close(o);toast('Spremljeno.');keepScroll(render)}}

/* ---------- Napredak (klijent i trener) ---------- */
function slipsSection(L,coach){const t=today(),mon=monday(),dIn=wdi(t),cur=slipRange(L,mon,t),prev=slipRange(L,addD(mon,-7),addD(mon,-7+dIn)),run=cleanRun(L);
 if(!byKind('slip',L).length)return `<div class="card"><h3>Odstupanja od plana</h3><p class="s mute" style="margin-top:6px">${coach?'Klijent još nije upisao odstupanja.':'Upisuj slatko, alkohol i ostalo na početnom ekranu, a ovdje vidiš kako ide kroz tjedne.'}</p></div>`;
 const weeks=[...Array(8)].map((_,i)=>{const m=addD(mon,-7*(7-i)),e=i==7?t:addD(m,6),r=slipRange(L,m,e);return{l:pd(m).getDate()+'.'+(pd(m).getMonth()+1)+'.',tip:'Tjedan od '+fmt(m),v:r.tot}});
 const d=cur.tot-prev.tot,notes=byKind('slip',L).filter(r=>r.data.note&&r.day>=addD(t,-13)).sort((a,b)=>b.day.localeCompare(a.day));
 const week7=[...Array(7)].map((_,i)=>addD(mon,i));
 return `<div class="card stack"><div class="between"><h3>Odstupanja od plana</h3><span class="xs b" style="color:${d>0?'var(--bad)':d<0?'var(--ok)':'var(--mute)'}">${d?`${d>0?'▲':'▼'} ${Math.abs(d)} u odnosu na prošli`:'kao prošli tjedan'}</span></div>
<div class="grid3"><div class="card flat" style="padding:10px"><div class="xs mute">Ovaj tjedan</div><div class="b" style="font-size:20px">${cur.tot}</div></div><div class="card flat" style="padding:10px"><div class="xs mute">Dana po planu</div><div class="b" style="font-size:20px">${cur.clean}</div></div><div class="card flat" style="padding:10px"><div class="xs mute">Najdulji niz</div><div class="b" style="font-size:20px">${run} d</div></div></div>
<div style="display:flex;gap:4px">${week7.map(d=>{const s=slipOf(d,L),n=slipTot(s);return `<div style="flex:1;text-align:center" title="${fmt(d)}: ${n}"><div style="height:30px;border-radius:8px;display:grid;place-items:center;font-size:14px;font-weight:700;background:${d>t?'var(--soft)':n?`color-mix(in srgb,var(--bad) ${Math.min(80,20+n*15)}%,var(--soft))`:s&&s.clean?'var(--ok-soft)':'var(--soft)'};color:${n?'var(--ink)':s&&s.clean?'var(--ok)':'var(--mute)'};opacity:${d>t?.4:1}">${d>t?'':n||(s&&s.clean?'✓':'·')}</div><span class="xs mute">${WD[wdi(d)][0]}</span></div>`}).join('')}</div>
${cur.tot?`<div class="chips">${SLIPS.filter(([k])=>cur.by[k]).sort((a,b)=>cur.by[b[0]]-cur.by[a[0]]).map(([k,l,e,u])=>`<span class="chip">${e} ${l} · <b style="color:var(--ink)">${cur.by[k]}</b> ${u}</span>`).join('')}</div>`:''}
<div><div class="kick" style="margin-bottom:6px">Po tjednima</div>${barSVG(weeks,{aria:'Odstupanja po tjednima',fmt:v=>v+' odstupanja',h:150})}</div>
${notes.length?`<div><div class="kick" style="margin-bottom:6px">Bilješke</div><div class="list">${notes.slice(0,4).map(r=>`<div class="s"><b>${fmt(r.day)}</b> · ${esc(r.data.note)} <span class="xs mute">(${slipTot(r.data)})</span></div>`).join('')}</div></div>`:''}
${coach?'':`<button class="btn sm ghost" onclick="slipM()">${I('edit','sm')} Uredi današnji unos</button>`}</div>`}

/* ============ Prehrana: cilj kalorija i makroa (dan treninga / dan odmora) ============
   Program: kT,pT,cT,fT (trening) · kR,pR,cR,fR (odmor) · foodNote. Unos: log 'food', id 'food-YYYY-MM-DD', data {kcal,p,c,f}. */
const FM=[['kcal','Kcal','k',''],['p','Proteini','p','g'],['c','UH','c','g'],['f','Masti','f','g']];
const hasFood=(P=PROG)=>!!(P&&(P.kT||P.kR));
function isTrainDay(d,P=PROG,L=LOGS){if(L.some(r=>r.kind=='workout'&&r.day==d))return true;const pw=planOf(monday(d),L,P);return(P.days||[]).some(x=>(pw?(pw[x.id]||[]):(x.wd||[])).includes(wdi(d)))}
function foodGoal(d,P=PROG,L=LOGS){const t=isTrainDay(d,P,L)&&(P.kT||!P.kR),s=t?'T':'R',g={kcal:+P['k'+s]||0,p:+P['p'+s]||0,c:+P['c'+s]||0,f:+P['f'+s]||0};return{train:t,...g}}
const foodOf=(d,L=LOGS)=>{const r=L.find(x=>x.kind=='food'&&x.day==d);return r?r.data:{}};
let FDT;
function foodCard(){if(!hasFood())return '';const t=today(),g=foodGoal(t),v=foodOf(t);
 return `<div class="card stack" style="gap:12px"><div class="between"><div><div class="kick">Prehrana danas</div><div class="b" style="margin-top:2px">${g.train?'Dan treninga':'Dan odmora'} · ${g.kcal?g.kcal.toLocaleString('hr')+' kcal':'—'}</div></div>${PROG.foodNote?`<button class="btn sm ghost" onclick="foodInfo()">${I('file','sm')} Upute</button>`:''}</div>
<div class="grid4" style="gap:8px">${FM.map(([k,l,,u])=>{const gv=g[k],x=v[k];const pc=gv&&x?Math.min(100,x/gv*100):0;return `<label class="f" style="gap:4px;font-size:14px">${l}<input class="inp tnum" style="min-height:42px;padding:0 8px;text-align:center" inputmode="numeric" placeholder="${gv||''}" value="${x??''}" oninput="foodSet('${k}',this.value)"><span style="height:4px;border-radius:2px;background:var(--soft);overflow:hidden"><i style="display:block;height:100%;width:${pc}%;background:${x>gv*1.08&&k=='kcal'?'var(--warn)':'var(--acc)'}"></i></span><span class="xs mute tnum">${gv?'cilj '+gv+u:''}</span></label>`}).join('')}</div>
<p class="xs mute">Upiši koliko si pojeo do sada. Dovoljno je kcal i proteini.</p></div>`}
function foodSet(k,val){const t=today(),d=clone(foodOf(t));const n=num(val);if(n==null||val==='')delete d[k];else d[k]=n;const r={id:'food-'+t,kind:'food',day:t,data:d},i=LOGS.findIndex(x=>x.id==r.id);if(i>=0)LOGS[i]=r;else LOGS.unshift(r);clearTimeout(FDT);FDT=setTimeout(()=>put(r),700)}
function foodInfo(){sheet(`<div class="stack">${sheetHd('Upute trenera za prehranu')}<div class="grid2">${[['T','Dan treninga'],['R','Dan odmora']].filter(([s])=>PROG['k'+s]).map(([s,l])=>`<div class="card flat" style="padding:12px"><div class="xs mute">${l}</div><div class="b" style="font-size:20px">${PROG['k'+s]} kcal</div><div class="xs mute">P ${PROG['p'+s]||'–'} g · UH ${PROG['c'+s]||'–'} g · M ${PROG['f'+s]||'–'} g</div></div>`).join('')}</div><p class="s" style="white-space:pre-line">${esc(PROG.foodNote||'')}</p></div>`)}
function foodSection(L,P,coach){if(!hasFood(P))return '';const t=today(),days=[...Array(7)].map((_,i)=>addD(t,i-6)),rows=days.map(d=>({d,g:foodGoal(d,P,L),v:foodOf(d,L)})),got=rows.filter(r=>r.v.kcal||r.v.p),avg=k=>got.length?Math.round(got.reduce((a,r)=>a+(+r.v[k]||0),0)/got.filter(r=>r.v[k]).length||0):0,pOk=got.filter(r=>r.v.p&&r.g.p&&r.v.p>=r.g.p*.9).length;
 return `<div class="card stack"><div class="between"><h3>Prehrana</h3><span class="xs mute">zadnjih 7 dana</span></div>
<div class="grid3"><div class="card flat" style="padding:10px"><div class="xs mute">Upisanih dana</div><div class="b" style="font-size:20px">${got.length}/7</div></div><div class="card flat" style="padding:10px"><div class="xs mute">Prosj. kcal</div><div class="b" style="font-size:20px">${avg('kcal')||'–'}</div></div><div class="card flat" style="padding:10px"><div class="xs mute">Proteini ≥ 90%</div><div class="b" style="font-size:20px">${pOk} d</div></div></div>
<div style="display:flex;gap:4px">${rows.map(r=>{const k=r.v.kcal,g=r.g.kcal,c=!k?'var(--soft)':Math.abs(k-g)<=g*.08?'var(--ok-soft)':'color-mix(in srgb,var(--warn) 30%,var(--soft))';return `<div style="flex:1;text-align:center" title="${fmt(r.d)}: ${k||'–'} / ${g} kcal"><div style="height:30px;border-radius:8px;display:grid;place-items:center;font-size:14px;font-weight:700;background:${c}">${k?Math.round(k/100)/10+'k':'·'}</div><span class="xs mute">${WD[wdi(r.d)][0]}${r.g.train?'•':''}</span></div>`}).join('')}</div>
<p class="xs mute">• = dan treninga. Zeleno = unutar ±8% cilja kalorija.</p></div>`}

/* ---------- dnevni ciljevi: obavijest kad klijent pogodi proteine, makrose, kalorije, vodu, korake ---------- */
function dayHits(d,P=PROG,L=LOGS){const g=foodGoal(d,P,L),v=foodOf(d,L),H=[],near=(x,t,tol)=>t&&x!=null&&x!==''&&Math.abs(+x-t)<=t*tol;
 if(hasFood()){if(g.p&&+v.p>=g.p*.95)H.push(['p','Proteini',`${v.p} / ${g.p} g`]);
  if(near(v.kcal,g.kcal,.07))H.push(['kcal','Kalorije',`${(+v.kcal).toLocaleString('hr')} / ${g.kcal.toLocaleString('hr')} kcal`]);
  if(near(v.c,g.c,.1))H.push(['c','Ugljikohidrati',`${v.c} / ${g.c} g`]);if(near(v.f,g.f,.1))H.push(['f','Masti',`${v.f} / ${g.f} g`])}
 const w=dayVal('water',d,'ml',L)||0,wg=+P.water||0;if(wg&&w>=wg)H.push(['water','Voda',`${(w/1000).toLocaleString('hr')} L`]);
 const s=dayVal('steps',d,'n',L)||0,sg=+P.steps||0;if(sg&&s>=sg)H.push(['steps','Koraci',s.toLocaleString('hr')]);
 const goals=(hasFood()?['p','kcal','c','f'].filter(k=>g[k]):[]).concat(wg?['water']:[],sg?['steps']:[]);
 return{H,goals,all:goals.length>1&&goals.every(k=>H.some(h=>h[0]==k)),macros:hasFood()&&['p','kcal','c','f'].filter(k=>g[k]).length>0&&['p','kcal','c','f'].filter(k=>g[k]).every(k=>H.some(h=>h[0]==k))}}
function goalCheck(){if(ROLE!='client'||!PROG)return;const t=today(),k='kfitk-hit-'+(CID||'')+'-'+t,seen=LS.get(k,[]),R=dayHits(t),nw=R.H.filter(h=>!seen.includes(h[0]));
 if(!nw.length&&(!R.all||seen.includes('all')))return;
 const ids=[...new Set([...seen,...R.H.map(h=>h[0])])];
 if(R.all&&!seen.includes('all')){ids.push('all');LS.set(k,ids);confetti();sheet(`<div class="stack">${sheetHd('Savršen dan')}<p>Pogodio si sve današnje ciljeve. Tako se gradi rezultat.</p><div class="list">${R.H.map(h=>`<div class="row">${I('check')}<div style="flex:1"><b>${h[1]}</b></div><span class="mute tnum">${h[2]}</span></div>`).join('')}</div><button class="btn acc full" data-x>Super</button></div>`);return}
 LS.set(k,ids);toast((nw.length==1?'Cilj pogođen: ':'Ciljevi pogođeni: ')+nw.map(h=>h[1]+' ('+h[2]+')').join(', '),3500)}

/* odstupanja na početnom ekranu: jedan redak, otvara se na dodir (manje gužve) */
let SLIPOPEN=false;
function slipsFold(){const c=slipsCard();if(!c)return'';const n=slipTot(slipOf(today())||{c:{}});
 return `<details class="fold card" style="padding:0" ${SLIPOPEN?'open':''} ontoggle="SLIPOPEN=this.open"><summary class="between" style="padding:16px 18px"><span class="row" style="gap:10px">${I('check','sm')}<span class="b s">Odstupanja od plana</span></span><span class="xs mute">${n?'danas '+n:'danas ništa'} ${I('chev','sm')}</span></summary><div style="padding:0 2px 2px">${c.replace(/^(\s*)<div class="card/,'$1<div class="slipin card')}</div></details>`}
