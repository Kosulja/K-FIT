/* ============ K-FIT KLIJENT v2 — napredak, mišići, baza vježbi ============ */
const MUS={chest:'Prsa',shoulders:'Ramena',biceps:'Biceps',triceps:'Triceps',forearms:'Podlaktice',abdominals:'Trbušnjaci',traps:'Trapez',lats:'Latisimus','middle back':'Srednja leđa','lower back':'Donja leđa',glutes:'Gluteusi',quadriceps:'Kvadricepsi',hamstrings:'Stražnja loža',adductors:'Aduktori',abductors:'Abduktori',calves:'Listovi',neck:'Vrat'};
const MUS_ALL=Object.keys(MUS);
const plural=(n,a,b,c)=>{const m=n%10,h=n%100;return m==1&&h!=11?a:m>=2&&m<=4&&(h<12||h>14)?b:c};
const EQ={barbell:'Šipka',dumbbell:'Bučice',cable:'Sajla',machine:'Sprava','body only':'Vlastita težina',kettlebells:'Girja',bands:'Gume','e-z curl bar':'EZ šipka','medicine ball':'Medicinka','exercise ball':'Pilates lopta','foam roll':'Valjak',other:'Ostalo'};
const CAT={strength:'Snaga',stretching:'Istezanje',plyometrics:'Pliometrija',strongman:'Strongman',powerlifting:'Powerlifting',cardio:'Kardio','olympic weightlifting':'Olimpijsko dizanje'};
const IMG='vjezbe/',IMGX='.webp'; /* vlastita kopija (public domain, free-exercise-db) */
let LIB=null,LIBP=null;
function loadLib(){if(LIB)return Promise.resolve(LIB);if(!LIBP)LIBP=fetch('exercises.json').then(r=>r.json()).then(a=>{LIB=a.map(x=>({id:x[0],n:x[1],cat:x[2],eq:x[3],mus:x[4],mus2:x[5],ins:x[6],hr:x[7]||x[1],force:x[8]||'',mech:x[9]||'',lvl:x[10]||''}));LIB.byId=Object.fromEntries(LIB.map(x=>[x.id,x]));return LIB}).catch(e=>{LIBP=null;throw e});return LIBP}
const libGet=id=>(LIB&&LIB.byId[id])||CUST.find(x=>x.id==id)||null;
/* naziv vježbe na odabranom jeziku; trenerov vlastiti naziv uvijek ima prednost */
const libN=(x,lang=LANG)=>x?(lang=='en'?x.n:(x.hr||x.n)):'';
function exName(e){if(!e)return'';if(e.custom||!e.lib)return e.n||'';const x=libGet(e.lib);if(x&&!x.own&&!String(x.id).startsWith('c_'))return e.n&&e.n!=x.n?e.n:libN(x);if(x)return x.n;return LANG=='hr'&&e.hr?e.hr:e.n||''}
const altName=e=>{if(!e||e.custom||!e.lib)return'';const x=LIB&&LIB.byId[e.lib];if(!x)return'';const o=libN(x,LANG=='en'?'hr':'en');return o!=exName(e)?o:''};
const thumb=(lib,cls='thumb')=>lib&&!String(lib).startsWith('c_')?`<img class="${cls}" loading="lazy" alt="" src="${IMG}${encodeURI(lib)}/0.webp" onerror="this.outerHTML='<span class=&quot;${cls} ph&quot;>'+I('dumb','sm')+'</span>'">`:`<span class="${cls} ph">${I('dumb','sm')}</span>`;

/* ============ 1RM ============ */
const e1=(kg,r)=>kg>0&&r>=1&&r<=12?(r==1?kg:kg*(1+r/30)):null;
function bestSet(sets){let b=null;(sets||[]).forEach(s=>{const v=e1(+s.kg,+s.r);if(v&&(!b||v>b.v))b={v,kg:+s.kg,r:+s.r}});return b}
const exKey=e=>e.lib||e.n;
function exHist(key,L=LOGS){return workouts(L).map(w=>{const e=(w.data.ex||[]).find(x=>exKey(x)==key);return e&&((e.sets&&e.sets.some(s=>s.r!==''&&s.r!=null||s.t))||e.cardio)?{day:w.day,w,e}:null}).filter(Boolean)}
const vol=r=>(r.data.ex||[]).reduce((s,e)=>s+(e.sets||[]).reduce((a,x)=>a+(+x.kg||0)*(+x.r||0),0),0);

/* ============ GRAFOVI ============ */
const CH={};
function chartSVG(pts,o={}){if(pts.length<2)return `<div class="empty">${o.empty||'Treba barem dva unosa za graf.'}</div>`;
 const id='ch'+uid(),W=600,H=o.h||190,pl=38,pr=14,pt=16,pb=26,xs=pts.map(p=>pd(p.d).getTime()),ys=pts.map(p=>p.v),g=o.goal;
 const all=g!=null?[...ys,g]:ys,mn=Math.min(...all),mx=Math.max(...all),pad=Math.max(.5,(mx-mn)*.12),lo=mn-pad,hi=mx+pad,x0=Math.min(...xs),x1=Math.max(...xs);
 const X=t=>pl+(t-x0)/(x1-x0||1)*(W-pl-pr),Y=v=>pt+(hi-v)/(hi-lo||1)*(H-pt-pb);
 const tk=[lo+pad,(lo+hi)/2,hi-pad];let seg='';
 for(let i=1;i<pts.length;i++){const a=ys[i-1],b=ys[i];let c='var(--acc)';if(o.colorize&&g!=null){const da=Math.abs(a-g),db=Math.abs(b-g);c=Math.abs(da-db)<.01?'var(--mute)':db<da?'var(--ok)':'var(--bad)'}
  seg+=`<line x1="${X(xs[i-1]).toFixed(1)}" y1="${Y(a).toFixed(1)}" x2="${X(xs[i]).toFixed(1)}" y2="${Y(b).toFixed(1)}" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`}
 const mid=pts[Math.floor(pts.length/2)];
 CH[id]={pts,X,Y,xs,W,H,unit:o.unit||'',lbl:o.lbl};
 after(()=>bindChart(id));
 return `<div class="chart" id="${id}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||'Graf')}">
${tk.map(v=>`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${pl-6}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="var(--mute)">${n1(v)}</text>`).join('')}
${g!=null?`<line x1="${pl}" x2="${W-pr}" y1="${Y(g)}" y2="${Y(g)}" stroke="var(--ok)" stroke-width="1.5" stroke-dasharray="6 5"/><text x="${W-pr}" y="${Y(g)-6}" text-anchor="end" font-size="12" font-weight="700" fill="var(--ok)">cilj ${n1(g)}</text>`:''}
${seg}${pts.length<=60?pts.map((p,i)=>`<circle cx="${X(xs[i])}" cy="${Y(p.v)}" r="2.6" fill="var(--card)" stroke="var(--ink)" stroke-opacity=".5" stroke-width="1"/>`).join(''):''}
<circle class="cur" r="5.5" fill="var(--acc)" stroke="var(--card)" stroke-width="2" style="display:none"/>
<text x="${pl}" y="${H-6}" font-size="11" fill="var(--mute)">${fmt(pts[0].d).slice(0,5)}</text><text x="${X(pd(mid.d).getTime())}" y="${H-6}" font-size="11" fill="var(--mute)" text-anchor="middle">${fmt(mid.d).slice(0,5)}</text><text x="${W-pr}" y="${H-6}" font-size="11" fill="var(--mute)" text-anchor="end">${fmt(pts[pts.length-1].d).slice(0,5)}</text></svg><div class="tip"></div></div>`}
function bindChart(id){const c=CH[id],el=document.getElementById(id);if(!c||!el)return;const svg=el.querySelector('svg'),tip=el.querySelector('.tip'),cur=svg.querySelector('.cur');
 const show=e=>{const r=svg.getBoundingClientRect(),sx=(e.clientX-r.left)/r.width*c.W;let bi=0,bd=1e9;c.xs.forEach((x,i)=>{const d=Math.abs(c.X(x)-sx);if(d<bd){bd=d;bi=i}});const p=c.pts[bi],px=c.X(c.xs[bi]),py=c.Y(p.v);
  cur.setAttribute('cx',px);cur.setAttribute('cy',py);cur.style.display='';tip.style.display='block';tip.style.left=(px/c.W*r.width)+'px';tip.style.top=(py/c.H*r.height)+'px';tip.textContent=fmt(p.d)+' · '+(c.lbl?c.lbl(p):n1(p.v)+' '+c.unit)};
 svg.addEventListener('pointermove',show);svg.addEventListener('pointerdown',show);svg.addEventListener('pointerleave',()=>{tip.style.display='none';cur.style.display='none'})}
function bars7(kind,field,goal,col,L=LOGS){const ds7=[...Array(7)].map((_,i)=>addD(today(),i-6)),v=ds7.map(d=>dayVal(kind,d,field,L)||0),mx=Math.max(goal||0,...v,1);
 return `<div style="display:flex;gap:6px;align-items:flex-end;height:90px">${ds7.map((d,i)=>`<div style="flex:1;display:grid;gap:4px;justify-items:center;height:100%;align-content:end"><div style="width:100%;max-width:28px;height:${Math.max(3,v[i]/mx*64)}px;border-radius:6px;background:${goal&&v[i]>=goal?col:`color-mix(in srgb,${col} 45%,var(--soft))`}" title="${v[i].toLocaleString('hr-HR')}"></div><span class="xs mute">${WD[wdi(d)][0]}</span></div>`).join('')}</div>`}

/* ============ MAPA MIŠIĆA ============ */
function muscleVol(ws){const v={};ws.forEach(w=>(w.data.ex||[]).forEach(e=>{if(e.type=='cardio')return;const n=(e.sets||[]).filter(s=>s.r!==''&&s.r!=null||s.t).length;(e.mus||[]).forEach(m=>v[m]=(v[m]||0)+n);(e.mus2||[]).forEach(m=>v[m]=(v[m]||0)+n*.5)}));return v}
function planVol(day){const v={};(day.ex||[]).forEach(e=>{if(e.type=='cardio')return;const n=+e.s||1;(e.mus||[]).forEach(m=>v[m]=(v[m]||0)+n);(e.mus2||[]).forEach(m=>v[m]=(v[m]||0)+n*.5)});return v}
const BMAP={chest:['chest'],shoulders:['deltoids'],biceps:['biceps'],triceps:['triceps'],forearms:['forearm'],abdominals:['abs','obliques'],traps:['trapezius'],lats:['lats'],'middle back':['mid','trapezius'],'lower back':['lower-back'],glutes:['gluteal'],quadriceps:['quadriceps'],hamstrings:['hamstring'],adductors:['adductors'],abductors:['gluteal'],calves:['calves','tibialis'],neck:['neck']};
const BNEU=new Set(['head','hair','hands','feet','ankles','knees']),BVB={mf:'0 0 724 1448',mb:'724 0 724 1448',ff:'-50 -40 734 1538',fb:'756 0 774 1448'};
function bodyMap(V,fig,o={}){const g=fig=='f'?'f':'m',mx=Math.max(o.ref||6,...Object.values(V)),L={},who={};
 for(const m in V)for(const s of BMAP[m]||[]){const v=V[m]/mx;if(v>(L[s]||0)){L[s]=v;who[s]=m}}
 const tip=s=>who[s]?`<title>${MUS[who[s]]}: ${n1(V[who[s]])} serija</title>`:'';
 const fill=(s)=>{if(BNEU.has(s))return'var(--b-neu)';const v=L[s]||0;return v?`color-mix(in srgb,var(--b-hi) ${Math.round(18+82*Math.min(1,v))}%,var(--b-lo))`:'var(--b-base)'};
 const side=(k,lab)=>`<figure><svg viewBox="${BVB[g+k]}" role="img" aria-label="Mapa mišića, ${lab.toLowerCase()}">${(typeof BODY!='undefined'?BODY[g+k]:[]).map(([s,ps])=>{const v=L[s]||0;return `<g style="fill:${fill(s)}"${v>=.85?' class="glow"':''}>${tip(s)}${ps.map(d=>`<path d="${d}"/>`).join('')}</g>`}).join('')}</svg><figcaption>${lab}</figcaption></figure>`;
 const un=MUS_ALL.filter(m=>!V[m]);
 return `<div class="body2">${side('f','Sprijeda')}${side('b','Straga')}</div>
${o.list===false?'':`<div class="chips" style="margin-top:10px">${MUS_ALL.filter(m=>V[m]).sort((a,b)=>V[b]-V[a]).map(m=>`<span class="chip acc">${MUS[m]} · ${n1(V[m])}</span>`).join('')}</div>
${un.length&&o.untrained!==false?`<p class="xs mute" style="margin-top:10px"><b style="color:var(--ink)">Netrenirano${o.period?' '+o.period:''}:</b> ${un.map(m=>MUS[m]).join(', ')}</p>`:''}`}`}

/* ============ HEATMAPA ============ */
function heatmap(L=LOGS){const end=today(),start=addD(end,-364-wdi(addD(end,-364))),min={};workouts(L).forEach(w=>{min[w.day]=(min[w.day]||0)+(+w.data.dur||45)});
 let cells='',labels='',col=0,lastM=-1,days=0,tot=0;
 for(let d=start;d<=end;d=addD(d,1)){const m=min[d]||0,l=!m?0:m<30?1:m<50?2:m<70?3:4;if(m){days++;tot+=m}cells+=`<i class="l${l}" title="${fmt(d)}${m?' · '+m+' min':''}"></i>`;
  if(wdi(d)==0){const mo=pd(d).getMonth();if(mo!=lastM){labels+=`<span style="grid-column:${col+1}/span 3" class="xs mute">${MJ[mo]}</span>`;lastM=mo}col++}}
 for(let i=wdi(end)+1;i<7;i++)cells+='<i class="x"></i>';
 const id='hm'+uid();after(()=>{const e=document.getElementById(id);if(e)e.scrollLeft=e.scrollWidth});
 return `<div class="heat" id="${id}"><div style="display:grid;grid-template-columns:repeat(${col},11px);gap:3px;width:max-content;margin-bottom:4px">${labels}</div><div class="g">${cells}</div></div>
<div class="between xs mute" style="margin-top:8px"><span><b style="color:var(--ink)">${days}</b> dana treninga · <b style="color:var(--ink)">${Math.round(tot/60)}</b> h u godini</span><span class="legend">manje <i style="background:var(--soft)"></i><i class="l1" style="background:color-mix(in srgb,var(--acc) 30%,var(--soft))"></i><i style="background:color-mix(in srgb,var(--acc) 55%,var(--soft))"></i><i style="background:color-mix(in srgb,var(--acc) 80%,var(--soft))"></i><i style="background:var(--acc)"></i> više</span></div>`}

/* ============ NAPREDAK ============ */
let PV={wr:90,mp:'w'};
const rr=()=>ROLE=='coach'?keepScroll(coachClient):keepScroll(render);
function strength(L){const m={};workouts(L).forEach(w=>(w.data.ex||[]).forEach(e=>{if(e.type&&e.type!='reps')return;const b=bestSet(e.sets);if(!b)return;const k=exKey(e);if(!m[k]||b.v>m[k].b.v)m[k]={k,n:e.n,lib:e.lib,custom:e.custom,b,day:w.day,last:w.day};m[k].last=w.day}));return Object.values(m).sort((a,b)=>b.last.localeCompare(a.last))}
/* — kalkulator 1RM — */
function calcM(kg,r){const o=sheet(`<div class="stack">${sheetHd('Kalkulator 1RM')}<p class="s mute">Upiši seriju koju nisi radio (ili jesi). Procjena je po Epleyu. Iznad 12 ponavljanja ne procjenjujem jer postaje nepouzdano.</p>
<div class="grid2"><label class="f">Težina (kg)<input class="inp" id="ck" inputmode="decimal" value="${kg||''}"></label><label class="f">Ponavljanja<input class="inp" id="cr" inputmode="numeric" value="${r||''}"></label></div><div id="cout"></div></div>`);
 const up=()=>{const k=num(o.querySelector('#ck').value),n=+o.querySelector('#cr').value,v=e1(k,n),out=o.querySelector('#cout');
  if(n>12){out.innerHTML=`<div class="card flat" style="padding:12px;color:var(--warn)">Iznad 12 ponavljanja procjena nije pouzdana.</div>`;return}
  if(!v){out.innerHTML='';return}out.innerHTML=`<div class="card hero" style="text-align:center"><div class="kick">Procijenjeni 1RM</div><div class="big" style="margin-top:6px">${n1(v)} kg</div></div><table class="pt" style="margin-top:10px"><tr><th>Ponav.</th><th>Težina</th><th>% 1RM</th></tr>${[1,2,3,4,5,6,8,10,12].map(x=>`<tr><td>${x}</td><td class="b">${n1(Math.round(v/(x==1?1:1+x/30)*2)/2)} kg</td><td class="mute">${Math.round(100/(x==1?1:1+x/30))} %</td></tr>`).join('')}</table>`};
 o.querySelectorAll('input').forEach(i=>i.oninput=up);up()}

/* ============ DETALJ VJEŽBE ============ */
async function exDetail(key,libId,coach){const L=coach?COACH.logs:LOGS;try{await loadLib()}catch(e){}
 const lib=libId?libGet(libId):null,H=exHist(key,L),name=(lib&&!lib.desc&&!String(lib.id).startsWith('c_')?libN(lib):lib&&lib.n)||(H[0]&&exName(H[0].e))||key,alt=lib&&!String(lib.id).startsWith('c_')?libN(lib,LANG=='en'?'hr':'en'):'',pe=findProgEx(key,coach?COACH.prog:PROG);
 const pts=H.map(h=>{const b=bestSet(h.e.sets);return b?{d:h.day,v:b.v,b}:null}).filter(Boolean),best=pts.reduce((a,p)=>!a||p.v>a.v?p:a,null);
 const isT=H.some(h=>h.e.type=='time'),isC=H.some(h=>h.e.type=='cardio');
 const o=sheet(`<div class="stack">${sheetHd(esc(name))}${alt&&alt!=name?`<p class="xs mute" style="margin-top:-6px">${esc(alt)}</p>`:''}
${lib&&!String(lib.id).startsWith('c_')?`<div class="demo" id="dm"><img alt="" onerror="var d=this.closest('.demo');if(d)d.remove()" src="${IMG}${encodeURI(lib.id)}/0.webp"><img alt="" onerror="var d=this.closest('.demo');if(d)d.classList.add('one');this.remove()" src="${IMG}${encodeURI(lib.id)}/1.webp"></div>`:lib&&lib.desc?`<div class="card flat" style="padding:12px"><p class="s">${esc(lib.desc)}</p></div>`:''}
${lib?`<div class="chips">${(lib.mus||[]).map(m=>`<span class="chip acc">${MUS[m]||m}</span>`).join('')}${(lib.mus2||[]).map(m=>`<span class="chip">${MUS[m]||m}</span>`).join('')}${lib.eq?`<span class="chip">${EQ[lib.eq]||lib.eq}</span>`:''}</div>`:''}
${pe&&pe.v?`<button class="btn ghost" onclick='videoM(${jattr(name)},${jattr(pe.v)})'>${I('play')} Video trenera</button>`:''}
${pe&&pe.note?`<div class="why">${I('msg','sm')}<span>${esc(pe.note)}</span></div>`:''}
${best?`<div class="grid2"><div class="card flat" style="padding:12px"><div class="kick">Procijenjeni 1RM</div><div class="big" style="font-size:28px;margin-top:4px">${n1(best.v)} kg</div><div class="xs mute">iz ${n1(best.b.kg)} kg × ${best.b.r} (${fmt(best.d)})</div></div><button class="card flat tap" style="padding:12px;display:block" onclick="calcM(${best.b.kg},${best.b.r})"><div class="kick">Kalkulator</div><p class="s" style="margin-top:6px">Izračunaj za drugu seriju ${I('chev','sm')}</p></button></div>
<div><div class="kick" style="margin-bottom:6px">1RM kroz vrijeme</div>${chartSVG(pts,{unit:'kg',h:160,aria:'Procijenjeni 1RM',lbl:p=>n1(p.v)+' kg (iz '+n1(p.b.kg)+'×'+p.b.r+')',empty:'Treba barem dva treninga za krivulju.'})}</div>`:''}
${H.length?`<div><div class="kick" style="margin-bottom:6px">Zadnji treninzi</div><div class="list">${H.slice(-6).reverse().map(h=>`<div class="between"><span class="s b">${fmt(h.day)}</span><span class="s mute tnum" style="text-align:right">${setsTxt(h.e)}</span></div>`).join('')}</div></div>`:'<p class="s mute">Još nema upisanih serija za ovu vježbu.</p>'}
${lib&&lib.ins&&lib.ins.length?`<details class="card flat" style="padding:12px"><summary class="b s">Koraci izvedbe (engleski) ${I('down','sm')}</summary><ol class="s" style="margin:10px 0 0;padding-left:18px;display:grid;gap:6px">${lib.ins.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></details>`:''}</div>`);
 const dm=o.querySelector('#dm');if(dm){const t=setInterval(()=>dm.classList.toggle('f'),900);o._onclose=()=>clearInterval(t)}
 afterRender()}
function findProgEx(key,prog){for(const d of (prog&&prog.days)||[])for(const e of d.ex)if(exKey(e)==key)return e;return null}
function setsTxt(e){if(e.type=='cardio'&&e.cardio)return `${n1(e.cardio.min)} min${e.cardio.kmh?' · '+n1(e.cardio.kmh)+' km/h':''}${e.cardio.km?' · '+n1(e.cardio.km)+' km':''}`;
 return (e.sets||[]).map(x=>e.type=='time'?(x.kg?n1(x.kg)+' kg · ':'')+(x.t||0)+' s':`${x.kg?n1(x.kg):'VT'}×${x.r}${x.e?` <span class="xs">@${x.es=='rpe'?'RPE':'RIR'} ${x.e}</span>`:''}`).join(' · ')||'—'}
function ytId(u){const m=String(u||'').match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);return m?m[1]:null}
function videoM(name,url){const id=ytId(url);if(!id||PREVIEW){sheet(`<div class="stack">${sheetHd(esc(name))}<a class="btn acc" href="${esc(url)}" target="_blank" rel="noopener">${I('play')} Otvori video</a><p class="xs mute">${PREVIEW?'U pregledu se video otvara u novoj kartici; u pravoj aplikaciji svira ovdje.':''}</p></div>`);return}
 sheet(`<div class="stack">${sheetHd(esc(name))}<div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1" allow="autoplay;encrypted-media;picture-in-picture" allowfullscreen></iframe></div></div>`)}

/* ============ BAZA VJEŽBI ============ */
async function libSheet(opt={}){const o=sheet(`<div class="stack">${sheetHd(opt.pick?'Dodaj vježbu':'Baza vježbi')}<div class="empty">Učitavam bazu vježbi…</div></div>`);if(opt.onclose)o._onclose=opt.onclose;
 try{await loadLib()}catch(e){o.querySelector('.empty').textContent='Baza vježbi se ne može učitati bez interneta.';return}
 const F={q:'',m:'',eq:'',lim:40},ALL=()=>[...CUST.map(x=>({...x,own:1})),...LIB];
 const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
 const match=(x,f)=>(!f.q||norm(x.n).includes(norm(f.q))||norm(x.hr||'').includes(norm(f.q))||(x.mus||[]).some(m=>norm(MUS[m]||'').includes(norm(f.q))))&&(!f.m||(x.mus||[]).includes(f.m))&&(!f.eq||(x.eq||'other')==f.eq);
 o.querySelector('.sheet').innerHTML=`<div class="stack">${sheetHd(opt.pick?'Dodaj vježbu':'Baza vježbi')}
<div class="row" style="position:relative"><input class="inp" id="lq" placeholder="Traži vježbu ili mišić (npr. squat, prsa)" autocomplete="off"></div>
<div class="chips scroll" id="lm"></div><div class="chips scroll" id="le"></div>
${opt.pick?`<button class="btn ghost sm" id="lown">${I('plus','sm')} Vlastita vježba</button>`:''}
<div class="xs mute" id="lc"></div><div class="list" id="ll"></div></div>`;
 o.querySelector('[data-x]').onclick=()=>close(o);
 const dn=x=>x.own?x.n:libN(x);
 const draw=()=>{const A=ALL(),R=A.filter(x=>match(x,F)).sort((a,b)=>(b.own?1:0)-(a.own?1:0)||dn(a).localeCompare(dn(b),LANG));
  const ms=new Set(A.filter(x=>match(x,{...F,m:''})).flatMap(x=>x.mus||[])),es=new Set(A.filter(x=>match(x,{...F,eq:''})).map(x=>x.eq||'other'));
  o.querySelector('#lm').innerHTML=`<button class="chip ${!F.m?'on':''}" data-m="">Svi mišići</button>`+MUS_ALL.filter(m=>ms.has(m)||F.m==m).map(m=>`<button class="chip ${F.m==m?'on':''}" data-m="${m}">${MUS[m]}</button>`).join('');
  o.querySelector('#le').innerHTML=`<button class="chip ${!F.eq?'on':''}" data-e="">Sva oprema</button>`+Object.keys(EQ).filter(e=>es.has(e)||F.eq==e).map(e=>`<button class="chip ${F.eq==e?'on':''}" data-e="${e}">${EQ[e]}</button>`).join('');
  o.querySelector('#lc').textContent=R.length+' '+plural(R.length,'vježba','vježbe','vježbi')+(R.length>F.lim?' · prikazujem '+F.lim:'');
  o.querySelector('#ll').innerHTML=R.slice(0,F.lim).map(x=>`<button class="tap" data-id="${esc(x.id)}">${thumb(x.own?null:x.id)}<div style="flex:1;min-width:0"><div class="b s ell">${esc(x.own?x.n:libN(x))}${x.own?' <span class="chip acc" style="margin-left:4px">vlastita</span>':''}</div><div class="xs mute ell">${!x.own&&libN(x,LANG=='en'?'hr':'en')!=libN(x)?esc(libN(x,LANG=='en'?'hr':'en'))+' · ':''}${(x.mus||[]).map(m=>MUS[m]||m).join(', ')} · ${EQ[x.eq||'other']||''}</div></div>${opt.pick?`<span class="btn sm icon">${I('plus','sm')}</span>`:I('chev','sm')}</button>`).join('')+(R.length>F.lim?`<button class="btn ghost" id="lmore">Prikaži još</button>`:'')+(R.length?'':`<div class="empty">Nema vježbi za ove filtere.</div>`);
  const mb=o.querySelector('#lmore');if(mb)mb.onclick=()=>{F.lim+=60;draw()}};
 o.querySelector('#lq').oninput=e=>{F.q=e.target.value.trim();F.lim=40;draw()};
 o.querySelector('#lm').onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;F.m=b.dataset.m;F.lim=40;draw()};
 o.querySelector('#le').onclick=e=>{const b=e.target.closest('[data-e]');if(!b)return;F.eq=b.dataset.e;F.lim=40;draw()};
 o.querySelector('#ll').onclick=e=>{const b=e.target.closest('[data-id]');if(!b)return;const x=ALL().find(y=>y.id==b.dataset.id);if(!x)return;
  if(opt.pick){opt.pick(x);b.querySelector('.btn').innerHTML=I('check','sm');b.querySelector('.btn').style.background='var(--ok)';toast('Dodano: '+(x.own?x.n:libN(x)))}else exDetail(x.id,x.id)};
 const ow=o.querySelector('#lown');if(ow)ow.onclick=()=>ownExM(x=>{opt.pick(x);draw()});
 draw()}

/* — detalj treninga — */
function workoutDetail(id,L=LOGS,canDel=true){const r=L.find(x=>x.id==id);if(!r)return;const d=r.data;
 const o=sheet(`<div class="stack"><div class="between"><div><div class="kick">${WD[wdi(r.day)]} · ${fmt(r.day)}</div><h2 style="margin-top:4px">${esc(d.name)}</h2></div><button class="btn sm icon ghost" data-x>${I('x','sm')}</button></div>
<div class="grid3"><div class="card flat" style="padding:10px"><div class="xs mute">Trajanje</div><div class="b">${d.dur||'—'} min</div></div><div class="card flat" style="padding:10px"><div class="xs mute">Volumen</div><div class="b">${vol(r).toLocaleString('hr-HR')} kg</div></div><div class="card flat" style="padding:10px"><div class="xs mute">${d.bw?'Težina':'Napor'}</div><div class="b">${d.bw?n1(d.bw)+' kg':d.rpe?d.rpe+'/10':'—'}</div></div></div>
${(d.prs||[]).length?`<div class="card flat" style="padding:12px;border-color:var(--warn)"><div class="row pr">${I('trophy','sm')} Rekordi</div><ul class="s" style="margin:6px 0 0;padding-left:18px">${d.prs.map(p=>`<li><b>${esc(exName({lib:p.k==p.n?null:p.k,n:p.n}))}</b>: ${esc(p.t)}</li>`).join('')}</ul></div>`:''}
${(d.ex||[]).map(e=>`<div><div class="b s">${e.ss?`<span class="chip acc" style="margin-right:4px">${esc(e.ss)}</span>`:''}${esc(exName(e))}</div>${e.swapFrom?`<div class="xs" style="color:var(--warn)">${I('move','sm')} umjesto: ${esc(exName(e.swapFrom))}${e.swapWhy?' · '+esc(e.swapWhy.split(' · ')[0].toLowerCase()):''}</div>`:''}${e.moved?`<div class="xs" style="color:var(--warn)">${I('clock','sm')} odrađeno kasnije (sprava zauzeta)</div>`:''}<div class="s mute tnum">${setsTxt(e)}</div>${e.rest&&e.rest.avg!=null?(()=>{const df=e.rest.avg-e.rest.rec,big=e.rest.rec&&Math.abs(df)>Math.max(15,e.rest.rec*.25);return `<div class="xs" style="color:${big?(df>0?'var(--warn)':'var(--acc)'):'var(--mute)'}">Odmor ⌀ ${mmss(e.rest.avg)}${e.rest.rec?' · preporuka '+mmss(e.rest.rec)+(big?' ('+(df>0?'dulje':'kraće')+')':''):''}</div>`})():''}${e.cn?`<div class="why" style="margin-top:4px">${I('msg','sm')}<span>${esc(e.cn)}</span></div>`:''}</div>`).join('')}
${d.note?`<div class="card flat" style="padding:12px"><div class="xs mute">Bilješka</div><p>${esc(d.note)}</p></div>`:''}
<div class="card flat" style="padding:12px"><div class="b s" style="margin-bottom:10px">Mišići na ovom treningu</div>${bodyMap(muscleVol([r]),setts(L).fig,{untrained:false,ref:8})}</div>
${canDel?`<button class="btn ghost sm" style="color:var(--bad)" data-del>${I('trash','sm')} Obriši trening</button>`:''}</div>`);
 const dl=o.querySelector('[data-del]');if(dl)dl.onclick=async()=>{if(!await ask('Obrisati ovaj trening?','Obriši',1))return;await delLog(id);o.remove();render()}}
