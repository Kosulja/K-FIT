/* ============ K-FIT KLIJENT — analitika i motivacija ============
   Napredak: Pregled · Snaga · Tijelo · Značke (isti prikaz vidi i trener za klijenta).
   Početni ekran: tjedni izazov. Nakon treninga: nove značke uz proslavu. */
PV.tab=PV.tab||'pre';PV.vm=PV.vm||'vol';PV.em=PV.em||'1rm';PV.ms=PV.ms||'waist';PV.pa=PV.pa||'front';

/* ---------- interaktivni stupčasti graf ---------- */
const BC={};
function barSVG(items,o={}){if(!items.length||items.every(x=>!x.v))return `<div class="empty">${o.empty||'Još nema podataka.'}</div>`;
 const id='bc'+uid(),W=600,H=o.h||180,pl=40,pr=10,pt=14,pb=26,n=items.length,mx=Math.max(o.goal||0,...items.map(x=>x.v))*1.08||1,bw=(W-pl-pr)/n,Y=v=>pt+(1-v/mx)*(H-pt-pb);
 const step=Math.ceil(n/7),tk=[0,mx/2,mx/1.08].map(v=>Math.round(v));
 BC[id]={items,bw,pl,W,H,fmt:o.fmt||(v=>n1(v))};after(()=>bindBars(id));
 return `<div class="chart" id="${id}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||'Graf')}">
${tk.map(v=>`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${pl-6}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="var(--mute)">${o.short?o.short(v):n1(v)}</text>`).join('')}
${o.goal?`<line x1="${pl}" x2="${W-pr}" y1="${Y(o.goal)}" y2="${Y(o.goal)}" stroke="var(--ok)" stroke-dasharray="6 5" stroke-width="1.5"/>`:''}
${items.map((x,i)=>{const h=Math.max(x.v?3:0,(H-pt-pb)-(Y(x.v)-pt));return `<rect data-i="${i}" x="${pl+i*bw+bw*.16}" y="${H-pb-h}" width="${bw*.68}" height="${h}" rx="4" fill="${i==n-1?'var(--acc)':`color-mix(in srgb,var(--acc) 48%,var(--soft))`}"/>`}).join('')}
${items.map((x,i)=>i%step==0||i==n-1?`<text x="${pl+i*bw+bw/2}" y="${H-7}" text-anchor="middle" font-size="11" fill="var(--mute)">${esc(x.l)}</text>`:'').join('')}
</svg><div class="tip"></div></div>`}
function bindBars(id){const c=BC[id],el=document.getElementById(id);if(!c||!el)return;const svg=el.querySelector('svg'),tip=el.querySelector('.tip'),R=[...svg.querySelectorAll('rect[data-i]')];
 const show=e=>{const r=svg.getBoundingClientRect(),sx=(e.clientX-r.left)/r.width*c.W,i=Math.max(0,Math.min(c.items.length-1,Math.floor((sx-c.pl)/c.bw))),x=c.items[i],rc=R[i];
  R.forEach((b,j)=>b.style.opacity=j==i?1:.55);tip.style.display='block';tip.style.left=((+rc.getAttribute('x')+ +rc.getAttribute('width')/2)/c.W*r.width)+'px';tip.style.top=(+rc.getAttribute('y')/c.H*r.height)+'px';tip.textContent=(x.tip||x.l)+' · '+c.fmt(x.v)};
 svg.addEventListener('pointermove',show);svg.addEventListener('pointerdown',show);svg.addEventListener('pointerleave',()=>{tip.style.display='none';R.forEach(b=>b.style.opacity=1)})}

/* ---------- izračuni ---------- */
const kK=v=>v>=1000?(v/1000).toLocaleString('hr-HR',{maximumFractionDigits:1})+' t':Math.round(v)+' kg';
function weekStats(L,mon,end){const W=byKind('workout',L).filter(r=>r.day>=mon&&r.day<=end),days=[];for(let d=mon;d<=end;d=addD(d,1))days.push(d);
 const avg=(k,f)=>{const v=days.map(d=>dayVal(k,d,f,L)).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null};
 return{n:W.length,vol:W.reduce((a,r)=>a+vol(r),0),min:W.reduce((a,r)=>a+(+r.data.dur||0),0),prs:W.reduce((a,r)=>a+(r.data.prs||[]).length,0),water:avg('water','ml'),steps:avg('steps','n')}}
function adherence(L,prog,weeks=4){const out=[];for(let i=weeks;i>=1;i--){const mon=addD(monday(),-7*i),it=weekItems(mon,L,prog).filter(x=>!x.skip),pl=it.length,dn=it.filter(x=>x.done).length;if(pl)out.push({mon,pl,dn})}return out}
function maxStreak(L,prog){const ok=new Set([...byKind('workout',L).map(r=>r.day),...byKind('water',L).filter(r=>(+r.data.ml||0)>=((prog&&prog.water)||3000)).map(r=>r.day)]);let best=0,cur=0,prev=null;[...ok].sort().forEach(d=>{cur=prev&&addD(prev,1)==d?cur+1:1;best=Math.max(best,cur);prev=d});return best}
function waterRun(L,prog){const g=(prog&&prog.water)||3000,ok=byKind('water',L).filter(r=>(+r.data.ml||0)>=g).map(r=>r.day).sort();let best=0,cur=0,prev=null;ok.forEach(d=>{cur=prev&&addD(prev,1)==d?cur+1:1;best=Math.max(best,cur);prev=d});return best}

/* ---------- značke ---------- */
function badges(L=LOGS,prog=PROG){const W=workouts(L),nW=W.length,prs=W.reduce((a,r)=>a+(r.data.prs||[]).length,0),s=setts(L),Wt=byKind('weight',L).sort((a,b)=>a.day.localeCompare(b.day));
 const maxVol=Math.max(0,...W.map(vol)),stepsMax=Math.max(0,...byKind('steps',L).map(r=>+r.data.n||0)),ci=byKind('checkin',L).length,ad=adherence(L,prog,26),perfect=ad.filter(w=>w.dn>=w.pl).length;
 let goalP=0;if(s.goalKg&&Wt.length){const a=+Wt[0].data.kg,b=+Wt[Wt.length-1].data.kg,tot=a-s.goalKg;goalP=Math.abs(tot)<.05?1:Math.max(0,Math.min(1,(a-b)/tot))}
 const B=[['first','Prvi korak','Prvi odrađeni trening','play',nW,1],['w10','Zagrijan','10 treninga','dumb',nW,10],['w25','Redovit','25 treninga','dumb',nW,25],['w50','Neumoran','50 treninga','dumb',nW,50],['w100','Legenda','100 treninga','trophy',nW,100],
  ['streak7','Tjedan bez pauze','7 dana zaredom s treningom ili ispunjenom vodom','flame',maxStreak(L,prog),7],['perfect','Savršen tjedan','Svi planirani treninzi u tjednu','check',perfect,1],['perfect4','Mjesec discipline','4 savršena tjedna','check',perfect,4],
  ['pr1','Prvi rekord','Prvi osobni rekord','trophy',prs,1],['pr10','Lovac na rekorde','10 osobnih rekorda','trophy',prs,10],['ton','5 tona','5 000 kg volumena u jednom treningu','bolt',maxVol,5000],
  ['water7','Hidriran','Cilj vode 7 dana zaredom','drop',waterRun(L,prog),7],['steps10k','10k dan','10 000 koraka u danu','steps',stepsMax,10000],['checkin4','Iskreno','4 tjedna check-ina','heart',ci,4],['clean7','Tjedan po planu','7 dana zaredom bez odstupanja','check',cleanRun(L),7],
  ['goalhalf','Pola puta','Pola puta do ciljane težine','scale',goalP,.5],['goal','Cilj!','Ciljana težina postignuta','scale',goalP,1]];
 return B.map(([id,t,d,ic,v,need])=>({id,t,d,ic,p:Math.min(1,(v||0)/need),v,need,on:(v||0)>=need}))}
function newBadges(){const B=badges().filter(b=>b.on).map(b=>b.id),k='kfitk-badges-'+(CID||''),seen=LS.get(k,null);LS.set(k,B);if(!seen)return[];return badges().filter(b=>b.on&&!seen.includes(b.id))}
function badgeGrid(L,prog){const B=badges(L,prog),on=B.filter(b=>b.on).length,next=B.filter(b=>!b.on).sort((a,b)=>b.p-a.p)[0];
 return `<div class="card hero"><div class="between"><div><div class="kick">Značke</div><div class="big" style="margin-top:6px">${on}<span class="mute" style="font-size:20px"> / ${B.length}</span></div></div>${next?`<div style="text-align:right;max-width:60%"><div class="xs mute">Najbliža sljedeća</div><div class="b s">${esc(next.t)}</div><div class="bar" style="margin-top:6px"><i style="width:${next.p*100}%"></i></div></div>`:'<span class="chip ok">Sve otključano!</span>'}</div></div>
<div class="badges">${B.map(b=>`<div class="badge ${b.on?'on':''}" title="${esc(b.d)}"><div class="bi">${I(b.ic)}</div><div class="b xs" style="margin-top:6px">${esc(b.t)}</div><div class="xs mute" style="line-height:1.25">${esc(b.d)}</div>${b.on?'':`<div class="bar" style="height:5px;margin-top:6px"><i style="width:${b.p*100}%"></i></div>`}</div>`).join('')}</div>`}
function confetti(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const c=document.createElement('canvas');c.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:70';document.body.append(c);const x=c.getContext('2d'),dpr=devicePixelRatio||1;c.width=innerWidth*dpr;c.height=innerHeight*dpr;x.scale(dpr,dpr);
 const col=[getComputedStyle(document.documentElement).getPropertyValue('--acc').trim()||'#e0975c','#5fd08a','#e8bd4f','#6fb3e8','#f08585'],P=Array.from({length:120},()=>({x:innerWidth/2,y:innerHeight*.35,vx:(Math.random()-.5)*11,vy:-Math.random()*11-3,s:4+Math.random()*5,r:Math.random()*6,c:col[Math.floor(Math.random()*col.length)]}));let t=0;
 (function f(){x.clearRect(0,0,innerWidth,innerHeight);P.forEach(p=>{p.vy+=.32;p.x+=p.vx;p.y+=p.vy;p.r+=.2;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6);x.restore()});if(++t<110)requestAnimationFrame(f);else c.remove()})()}

/* ---------- tjedni izazov (početni ekran) ---------- */
function challengeCard(){const mon=monday(),it=weekItems().filter(x=>x.date),pl=it.length,dn=it.filter(x=>x.done).length,g=PROG.water||3000,days=wdi(today())+1;
 const wd=[...Array(7)].map((_,i)=>addD(mon,i)).filter(d=>d<=today()&&(dayVal('water',d,'ml')||0)>=g).length,ci=byKind('checkin').some(r=>r.day>=mon),sg=PROG.steps||0,sd=sg?[...Array(7)].map((_,i)=>addD(mon,i)).filter(d=>(dayVal('steps',d,'n')||0)>=sg).length:0;
 const T=[[`Treninzi po planu`,dn,pl||3,'dumb'],[`Voda ${(g/1000).toLocaleString('hr-HR')} L — 5 dana`,wd,5,'drop'],...(sg?[[`${sg.toLocaleString('hr-HR')} koraka — 4 dana`,sd,4,'steps']]:[]),['Tjedni check-in',ci?1:0,1,'heart']];
 const done=T.filter(t=>t[1]>=t[2]).length;
 return `<div class="card"><div class="between" style="margin-bottom:10px"><div><div class="kick">Tjedni izazov</div><div class="b" style="margin-top:2px">${done==T.length?'Tjedan je tvoj! 🔥':`${done} od ${T.length} ispunjeno`}</div></div><span class="xs mute">još ${7-days} ${7-days==1?'dan':'dana'}</span></div>
<div class="stack" style="gap:10px">${T.map(([l,v,n,ic])=>{const ok=v>=n;return `<div><div class="between s"><span class="row" style="gap:8px;${ok?'color:var(--ok)':''}">${I(ok?'check':ic,'sm')}<span style="color:var(--ink)">${l}</span></span><b class="tnum">${Math.min(v,n)}/${n}</b></div><div class="bar" style="height:6px;margin-top:5px"><i style="width:${Math.min(1,v/n)*100}%;${ok?'background:var(--ok)':''}"></i></div></div>`}).join('')}</div></div>`}

/* ---------- mjere ---------- */
const MS=[['waist','Struk'],['belly','Trbuh'],['hips','Bokovi'],['thigh','Bedro'],['arm','Ruka']];
function measureSeries(L,k){const m={};byKind('measure',L).forEach(r=>{if(r.data[k]!=null&&r.data[k]!=='')m[r.day]=num(r.data[k])});if(k=='waist')byKind('checkin',L).forEach(r=>{if(r.data.waist&&m[r.day]==null)m[r.day]=num(r.data.waist)});return Object.entries(m).filter(([,v])=>v).sort().map(([d,v])=>({d,v}))}
function measureM(){const last={};MS.forEach(([k])=>{const s=measureSeries(LOGS,k);if(s.length)last[k]=s[s.length-1].v});
 const o=sheet(`<form class="stack">${sheetHd('Nove mjere')}<p class="xs mute">Mjeri ujutro, prije doručka. Metar ravno, bez stiskanja. Upiši samo ono što si izmjerio.</p><div class="grid2">${MS.map(([k,l])=>`<label class="f">${l} (cm)<input class="inp" name="${k}" inputmode="decimal" placeholder="${last[k]?'prošli put '+n1(last[k]):''}"></label>`).join('')}<label class="f">Datum<input class="inp" type="date" name="d" value="${today()}" max="${today()}"></label></div><button class="btn acc">Spremi</button></form>`);
 const f=o.querySelector('form');f.onsubmit=e=>{e.preventDefault();const data={};MS.forEach(([k])=>{const v=num(f[k].value);if(v)data[k]=v});if(!Object.keys(data).length){toast('Upiši barem jednu mjeru.');return}const d=f.d.value||today();put({id:'measure-'+d,kind:'measure',day:d,data});o.remove();toast('Mjere spremljene.');keepScroll(render)}}

/* ---------- usporedba fotografija ---------- */
async function photoCompare(L){const P=byKind('photos',L).sort((a,b)=>a.day.localeCompare(b.day)),box=document.getElementById('phcmp');if(!box||P.length<2)return;
 const A=P[0],B=P[P.length-1],ang=PH.find(x=>A.data[x[0]]&&B.data[x[0]]&&x[0]==PV.pa)||PH.find(x=>A.data[x[0]]&&B.data[x[0]]);if(!ang)return;
 try{const[ua,ub]=await Promise.all([API.photoUrl(A.data[ang[0]]),API.photoUrl(B.data[ang[0]])]);if(!document.getElementById('phcmp'))return;
  box.innerHTML=`<div class="cmp"><img alt="Prije" src="${ua}"><div class="cmp-b" style="clip-path:inset(0 0 0 50%)"><img alt="Sada" src="${ub}"></div><div class="cmp-l" style="left:50%"></div><span class="cap" style="left:8px">${fmt(A.day)}</span><span class="cap" style="right:8px;left:auto">${fmt(B.day)}</span></div><input type="range" min="0" max="100" value="50" class="cmp-r" aria-label="Pomakni za usporedbu">`;
  const r=box.querySelector('.cmp-r'),b=box.querySelector('.cmp-b'),l=box.querySelector('.cmp-l');r.oninput=()=>{b.style.clipPath=`inset(0 0 0 ${r.value}%)`;l.style.left=r.value+'%'}}catch(e){box.innerHTML='<div class="empty">Slike se trenutno ne mogu učitati.</div>'}}

/* ============ NAPREDAK ============ */
function progressView(L=LOGS,prog=PROG){const coach=L!==LOGS,tabs=[['pre','Pregled'],['sna','Snaga'],['tij','Tijelo'],['zna','Značke']];
 const body={pre:pvOverview,sna:pvStrength,tij:pvBody,zna:()=>badgeGrid(L,prog)}[PV.tab]||pvOverview;
 return `<div class="stack">${coach?'':'<h1>Napredak</h1>'}<div class="seg" role="tablist">${tabs.map(([k,l])=>`<button role="tab" aria-selected="${PV.tab==k}" class="${PV.tab==k?'on':''}" onclick="PV.tab='${k}';rr()">${l}</button>`).join('')}</div>${body(L,prog,coach)}</div>`}

function pvOverview(L,prog,coach){const mon=monday(),t=today(),dIn=wdi(t),cur=weekStats(L,mon,t),prev=weekStats(L,addD(mon,-7),addD(mon,-7+dIn)),full=weekStats(L,addD(mon,-7),addD(mon,-1));
 const dl=(a,b,f,good=1)=>{if(a==null||b==null||(!a&&!b))return'<span class="xs mute">—</span>';const d=a-b;if(Math.abs(d)<1e-9)return'<span class="xs mute">kao prošli</span>';const up=d>0,c=(up?good:-good)>0?'var(--ok)':'var(--bad)';return `<span class="xs b" style="color:${c}">${up?'▲':'▼'} ${f(Math.abs(d))}</span>`};
 const tile=(k,v,d)=>`<div class="card flat" style="padding:12px"><div class="kick">${k}</div><div class="b" style="font-size:20px;margin-top:4px">${v}</div>${d}</div>`;
 const ad=adherence(L,prog,4),adP=ad.length?Math.round(ad.reduce((a,w)=>a+Math.min(w.dn,w.pl),0)/ad.reduce((a,w)=>a+w.pl,0)*100):null;
 const weeks=[...Array(12)].map((_,i)=>{const m=addD(mon,-7*(11-i)),e=i==11?t:addD(m,6),s=weekStats(L,m,e);return{l:pd(m).getDate()+'.'+(pd(m).getMonth()+1)+'.',tip:'Tjedan od '+fmt(m),v:PV.vm=='vol'?s.vol:PV.vm=='n'?s.n:s.min}});
 const ms=t.slice(0,8)+'01',W=workouts(L).filter(r=>r.day>=ms),Wt=byKind('weight',L).filter(r=>r.day>=addD(ms,-1)).sort((a,b)=>a.day.localeCompare(b.day)),wch=Wt.length>1?+Wt[Wt.length-1].data.kg-+Wt[0].data.kg:null;
 const C=2*Math.PI*36;
 return `<div class="card"><div class="between" style="margin-bottom:10px"><h3>Ovaj tjedan</h3><span class="xs mute">u odnosu na isti dio prošlog</span></div><div class="grid2">
${tile('Treninzi',cur.n,dl(cur.n,prev.n,v=>v))}${tile('Volumen',kK(cur.vol),dl(cur.vol,prev.vol,kK))}${tile('Voda / dan',cur.water!=null?(cur.water/1000).toLocaleString('hr-HR',{maximumFractionDigits:1})+' L':'—',dl(cur.water,prev.water,v=>(v/1000).toLocaleString('hr-HR',{maximumFractionDigits:1})+' L'))}${tile('Koraci / dan',cur.steps!=null?Math.round(cur.steps).toLocaleString('hr-HR'):'—',dl(cur.steps,prev.steps,v=>Math.round(v).toLocaleString('hr-HR')))}</div>
<p class="xs mute" style="margin-top:10px">Cijeli prošli tjedan: ${full.n} treninga · ${kK(full.vol)} · ${full.prs} PR</p></div>
<div class="card"><div class="row" style="gap:16px"><div class="ring" style="width:84px;height:84px"><svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="36" fill="none" stroke="var(--soft)" stroke-width="8"/><circle cx="42" cy="42" r="36" fill="none" stroke="${adP>=80?'var(--ok)':adP>=50?'var(--acc)':'var(--bad)'}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-(adP||0)/100)}"/></svg><div class="v"><b style="font-size:20px">${adP==null?'—':adP+'%'}</b></div></div>
<div style="flex:1;min-width:0"><h3>Redovitost</h3><p class="s mute" style="margin-top:4px">${adP==null?'Kad trener postavi dane u tjednu, ovdje vidiš koliko treninga odradiš od planiranih.':`Zadnja ${ad.length} tjedna: ${ad.reduce((a,w)=>a+Math.min(w.dn,w.pl),0)} od ${ad.reduce((a,w)=>a+w.pl,0)} planiranih treninga.`}</p>
<div class="row" style="gap:4px;margin-top:8px">${ad.map(w=>`<span class="chip ${w.dn>=w.pl?'ok':w.dn?'':'bad'}" title="Tjedan od ${fmt(w.mon)}">${w.dn}/${w.pl}</span>`).join('')}</div></div></div></div>
<div class="card stack"><h3>Po tjednima</h3><div class="seg">${[['vol','Volumen'],['n','Treninzi'],['min','Minute']].map(([k,l])=>`<button class="${PV.vm==k?'on':''}" onclick="PV.vm='${k}';rr()">${l}</button>`).join('')}</div>
${barSVG(weeks,{aria:'Tjedni pregled',fmt:PV.vm=='vol'?kK:PV.vm=='n'?v=>v+' treninga':v=>v+' min',short:PV.vm=='vol'?v=>v>=1000?Math.round(v/1000)+'t':v:v=>v,empty:'Nakon prvih treninga ovdje vidiš tjedni ritam.'})}<p class="xs mute">Dodirni stupac za detalje.</p></div>
<div class="card"><div class="between" style="margin-bottom:10px"><h3>${['Siječanj','Veljača','Ožujak','Travanj','Svibanj','Lipanj','Srpanj','Kolovoz','Rujan','Listopad','Studeni','Prosinac'][pd(t).getMonth()]} do sada</h3>${I('cal','sm')}</div><div class="grid2">
${tile('Treninzi',W.length,'<span class="xs mute">'+W.reduce((a,r)=>a+(+r.data.dur||0),0)+' min</span>')}${tile('Volumen',kK(W.reduce((a,r)=>a+vol(r),0)),'<span class="xs mute">ukupno podignuto</span>')}${tile('Rekordi',W.reduce((a,r)=>a+(r.data.prs||[]).length,0),'<span class="xs mute">osobnih rekorda</span>')}${tile('Težina',wch==null?'—':(wch>0?'+':'')+n1(wch)+' kg','<span class="xs mute">promjena u mjesecu</span>')}</div></div>
${slipsSection(L,coach)}
<div class="card"><h3 style="margin-bottom:10px">Aktivnost u godini</h3>${heatmap(L)}</div>
<div class="card"><div class="between" style="margin-bottom:10px"><h3>Voda — 7 dana</h3><span class="xs mute">cilj ${((prog.water||3000)/1000).toLocaleString('hr-HR')} L</span></div>${bars7('water','ml',prog.water||3000,'var(--water)',L)}</div>
<div class="card"><div class="between" style="margin-bottom:10px"><h3>Koraci — 7 dana</h3><span class="xs mute">${prog.steps?'cilj '+prog.steps.toLocaleString('hr-HR'):''}</span></div>${bars7('steps','n',prog.steps,'var(--acc)',L)}</div>`}

function pvStrength(L,prog,coach){const ST=strength(L),s=setts(L);if(!PV.ex||!ST.some(x=>x.k==PV.ex))PV.ex=ST[0]&&ST[0].k;
 const per={w:[addD(today(),-6),'ovaj tjedan'],m:[addD(today(),-29),'zadnjih 30 dana'],a:['0000','do sada']}[PV.mp],mv=muscleVol(byKind('workout',L).filter(r=>r.day>=per[0]));
 let chart='<div class="empty">Nakon prvih treninga s težinom ovdje pratiš napredak po vježbi.</div>',info='';
 if(PV.ex){const H=exHist(PV.ex,L),sel=ST.find(x=>x.k==PV.ex);
  const pts=H.map(h=>{const S=(h.e.sets||[]).filter(x=>+x.r);if(!S.length)return null;const b=bestSet(S),top=Math.max(...S.map(x=>+x.kg||0)),v=S.reduce((a,x)=>a+(+x.kg||0)*(+x.r||0),0),reps=S.reduce((a,x)=>a+(+x.r||0),0);
   const val={'1rm':b&&b.v,kg:top,vol:v,reps}[PV.em];return val?{d:h.day,v:val,b,top,reps}:null}).filter(Boolean);
  const unit={'1rm':'kg',kg:'kg',vol:'kg',reps:'pon.'}[PV.em],f=pts[0],l=pts[pts.length-1],ch=f&&l?l.v-f.v:0,pct=f&&f.v?Math.round(ch/f.v*100):0;
  chart=chartSVG(pts,{unit,h:200,aria:'Napredak vježbe',lbl:p=>n1(p.v)+' '+unit+(PV.em=='1rm'&&p.b?' (iz '+n1(p.b.kg)+'×'+p.b.r+')':''),empty:'Treba barem dva treninga s ovom vježbom.'});
  info=pts.length>1?`<div class="grid3"><div class="card flat" style="padding:10px"><div class="xs mute">Početak</div><div class="b">${n1(f.v)} ${unit}</div></div><div class="card flat" style="padding:10px"><div class="xs mute">Sada</div><div class="b">${n1(l.v)} ${unit}</div></div><div class="card flat" style="padding:10px"><div class="xs mute">Napredak</div><div class="b" style="color:${ch>=0?'var(--ok)':'var(--bad)'}">${ch>=0?'+':''}${pct} %</div></div></div>`:'';
  info+=sel?`<button class="btn sm ghost" onclick='exDetail(${jattr(sel.k)},${jattr(sel.lib||null)},${coach})'>${I('chart','sm')} Detalji i kalkulator</button>`:''}
 return `<div class="card stack"><h3>Napredak po vježbi</h3>
${ST.length?`<select class="inp" onchange="PV.ex=this.value;rr()" aria-label="Odaberi vježbu">${ST.map(x=>`<option value="${esc(x.k)}" ${x.k==PV.ex?'selected':''}>${esc(exName(x))}</option>`).join('')}</select>
<div class="seg">${[['1rm','1RM'],['kg','Najveća kg'],['vol','Volumen'],['reps','Ponav.']].map(([k,l])=>`<button class="${PV.em==k?'on':''}" onclick="PV.em='${k}';rr()">${l}</button>`).join('')}</div>`:''}
${chart}${info}</div>
<div class="card"><div class="between" style="margin-bottom:8px"><h3>Procijenjeni 1RM</h3><button class="btn sm ghost" onclick="calcM()">${I('grid','sm')} Kalkulator</button></div>
${ST.length?`<div class="list">${ST.slice(0,10).map(x=>`<button class="tap" onclick="PV.ex=${esc(JSON.stringify(x.k))};rr();scrollTo({top:0,behavior:'smooth'})">${thumb(x.lib)}<div style="flex:1;min-width:0"><div class="b s ell">${esc(exName(x))}</div><div class="xs mute">iz ${n1(x.b.kg)} kg × ${x.b.r} · ${fmt(x.day)}</div></div><div style="text-align:right"><div class="b">${n1(x.b.v)} kg</div><div class="xs mute">1RM</div></div></button>`).join('')}</div>`:'<div class="empty">Još nema serija s težinom.</div>'}</div>
<div class="card stack"><div class="between"><h3>Mišići</h3><div class="seg" style="width:190px">${[['w','Tjedan'],['m','Mjesec'],['a','Sve']].map(([v,l])=>`<button class="${PV.mp==v?'on':''}" onclick="PV.mp='${v}';rr()">${l}</button>`).join('')}</div></div>
${bodyMap(mv,s.fig,{period:per[1],ref:PV.mp=='w'?12:PV.mp=='m'?40:120})}</div>`}

function pvBody(L,prog,coach){const cid=coach?COACH.sel:null,s=setts(L);
 const Wall=byKind('weight',L).sort((a,b)=>a.day.localeCompare(b.day)),Wr=PV.wr?Wall.filter(r=>r.day>=addD(today(),-PV.wr)):Wall,pts=Wr.map(r=>({d:r.day,v:+r.data.kg}));
 const last=pts[pts.length-1],toGoal=s.goalKg&&last?last.v-s.goalKg:null;
 let goalBox='';if(s.goalKg&&Wall.length){const a=+Wall[0].data.kg,b=+Wall[Wall.length-1].data.kg,tot=a-s.goalKg,p=Math.abs(tot)<.05?1:Math.max(0,Math.min(1,(a-b)/tot));
  goalBox=`<div><div class="between s"><span class="mute">${n1(a)} kg → <b style="color:var(--ink)">${n1(s.goalKg)} kg</b></span><b>${Math.round(p*100)} %</b></div><div class="bar" style="height:10px;margin-top:6px"><i style="width:${p*100}%;background:var(--ok)"></i></div></div>`}
 const mser=measureSeries(L,PV.ms),mf=mser[0],ml=mser[mser.length-1],latest=MS.map(([k,l])=>{const sr=measureSeries(L,k);return sr.length?{k,l,v:sr[sr.length-1].v,d:sr.length>1?sr[sr.length-1].v-sr[0].v:null}:null}).filter(Boolean);
 const P=byKind('photos',L),CI=byKind('checkin',L).sort((a,b)=>b.day.localeCompare(a.day));
 if(P.length>1)after(()=>photoCompare(L));
 return `<div class="card stack"><div class="between"><h3>Tjelesna težina</h3><div class="row" style="gap:6px"><button class="btn sm ghost" onclick="goalM(${cid?`'${cid}'`:''})">${I('flame','sm')} ${s.goalKg?'Cilj '+n1(s.goalKg):'Postavi cilj'}</button>${coach?'':`<button class="btn sm" onclick="logWeight()" aria-label="Upiši težinu">${I('plus','sm')}</button>`}</div></div>
${goalBox}<div class="seg">${[[30,'30 d'],[90,'90 d'],[365,'1 god'],[0,'Sve']].map(([v,l])=>`<button class="${PV.wr==v?'on':''}" onclick="PV.wr=${v};rr()">${l}</button>`).join('')}</div>
${chartSVG(pts,{goal:s.goalKg,colorize:true,unit:'kg',aria:'Graf tjelesne težine',empty:'Upiši težinu barem dva puta da se pojavi graf.'})}
${s.goalKg&&pts.length>1?`<div class="row xs mute" style="gap:14px;flex-wrap:wrap"><span><b style="color:var(--ok)">━</b> prema cilju</span><span><b style="color:var(--bad)">━</b> od cilja</span>${toGoal!=null?`<span style="margin-left:auto">${Math.abs(toGoal)<.05?'Cilj postignut!':'Do cilja: <b style="color:var(--ink)">'+n1(Math.abs(toGoal))+' kg</b>'}</span>`:''}</div>`:''}</div>
<div class="card stack"><div class="between"><h3>Mjere</h3>${coach?'':`<button class="btn sm" onclick="measureM()">${I('plus','sm')} Upiši</button>`}</div>
${latest.length?`<div class="mgrid">${latest.map(m=>`<button class="card flat ${PV.ms==m.k?'sel':''}" style="padding:10px;text-align:left" onclick="PV.ms='${m.k}';rr()"><div class="xs mute">${m.l}</div><div class="b">${n1(m.v)} cm</div><div class="xs" style="color:${m.d==null?'var(--mute)':m.d<=0?'var(--ok)':'var(--warn)'}">${m.d==null?'—':(m.d>0?'+':'')+n1(m.d)+' cm'}</div></button>`).join('')}</div>
${chartSVG(mser,{unit:'cm',h:160,aria:'Graf mjera',empty:'Za graf treba barem dva mjerenja.'})}${mf&&ml&&mser.length>1?`<p class="xs mute">${MS.find(x=>x[0]==PV.ms)[1]}: ${n1(mf.v)} → ${n1(ml.v)} cm od ${fmt(mf.d)}</p>`:''}`:`<div class="empty">${coach?'Klijent još nije upisao mjere.':'Upiši mjere jednom mjesečno — centimetri često pokažu napredak i kad vaga stoji.'}</div>`}</div>
<div class="card stack"><div class="between"><h3>Fotografije</h3>${coach?'':`<button class="btn sm" onclick="photosM('progress')">${I('plus','sm')} Nove</button>`}</div>
${P.length>1?`<div class="seg">${PH.map(([k,l])=>`<button class="${PV.pa==k?'on':''}" onclick="PV.pa='${k}';rr()">${l}</button>`).join('')}</div><div id="phcmp"><div class="empty">Učitavam…</div></div><p class="xs mute">Povuci klizač — lijevo prva, desno zadnja fotografija.</p>`
:`<div class="empty">${P.length?'Pošalji nove fotografije za mjesec dana pa ih ovdje usporedi s prvima.':'Još nema fotografija.'}</div>`}</div>
<div class="card"><div class="between" style="margin-bottom:6px"><h3>Check-in</h3>${coach?'':`<button class="btn sm" onclick="checkinM()">${I('plus','sm')} Novi</button>`}</div>
${CI.length?`<div class="list">${CI.slice(0,8).map(r=>`<div><div class="between" style="align-items:flex-start"><span class="b s">${fmt(r.day)}</span><span class="xs mute tnum" style="text-align:right">San ${r.data.sleep}/${r.data.sc||5} · Energija ${r.data.energy}/${r.data.sc||5} · Glad ${r.data.hunger}/${r.data.sc||5} · Stres ${r.data.stress}/${r.data.sc||5}${r.data.waist?' · struk '+n1(r.data.waist)+' cm':''}</span></div>${r.data.note?`<p class="s" style="margin-top:4px">${esc(r.data.note)}</p>`:''}</div>`).join('')}</div>`:`<div class="empty">Još nema check-ina.</div>`}</div>`}
