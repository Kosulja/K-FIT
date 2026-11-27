/* ============ K-FIT KLIJENT v2 — tjedan, progresija, vođeni trening ============ */
const DK='kfitk-draft2';
const RULES={double:'Dvostruka (raspon ponavljanja)',linear:'Linearna',gs:'Greyskull LP',none:'Bez automatike'};
const TYPES={reps:'Ponavljanja',time:'Na vrijeme',cardio:'Kardio'};
const monday=(d=today())=>addD(d,-wdi(d));
const shortName=d=>{const m=String(d.name||'').match(/^(?:dan|trening|day)\s+(\S+)/i);return(m?m[1]:String(d.name||'?').split(/\s|–|-/)[0]).slice(0,6)};
const restSec=v=>{if(typeof v=='number')return v;const s=String(v||'');let m=s.match(/(\d+):(\d+)/);if(m)return+m[1]*60+ +m[2];m=s.match(/(\d+(?:[.,]\d+)?)\s*min/);if(m)return Math.round(num(m[1])*60);m=s.match(/\d+/);return m?+m[0]:90};
function estMin(day){return Math.round((day.ex||[]).reduce((s,e)=>s+(e.type=='cardio'?(+e.cmin||20)*60:(+e.s||1)*((e.type=='time'?(+e.t||30):40)+(e.ss?restSec(e.rest)/2:restSec(e.rest)))),0)/60)}

/* ============ TJEDAN + PREMJEŠTANJE ============ */
function weekItems(mon=monday(),L=LOGS,prog=PROG){const D=prog.days||[],mv=((L.find(x=>x.id=='move-'+mon)||{}).data||{}).map||{},items=[],pw=planOf(mon,L,prog),wdOf=day=>pw?(pw[day.id]||[]):(day.wd||[]);
 for(let i=0;i<7;i++){const d=addD(mon,i);D.forEach(day=>{if(wdOf(day).includes(i)){const k=d+'|'+day.id,to=mv[k];items.push(to==='skip'?{k,day,orig:d,date:null,skip:true}:{k,day,orig:d,date:to||d,moved:!!to&&to!=d})}})}
 const cnt={};byKind('workout',L).filter(r=>r.day>=mon&&r.day<=addD(mon,6)).forEach(r=>cnt[r.data.dayId]=(cnt[r.data.dayId]||0)+1);
 items.filter(x=>x.date).sort((a,b)=>a.date.localeCompare(b.date)).forEach(x=>{if(cnt[x.day.id]>0){x.done=true;cnt[x.day.id]--}});
 return items}
function todayPlan(){const t=today(),D=PROG.days||[],done=byKind('workout').find(r=>r.day==t);if(done)return{done};
 if(D.some(d=>(d.wd||[]).length)||planOf(monday())){const W=weekItems(),it=W.find(x=>x.date==t&&!x.done),nx=W.filter(x=>x.date&&x.date>t&&!x.done).sort((a,b)=>a.date.localeCompare(b.date))[0];return it?{day:it.day,moved:it.moved}:{next:nx}}
 if(!D.length)return{};const last=workouts().pop();if(!last)return{day:D[0]};const i=D.findIndex(d=>d.id==last.data.dayId);return{day:D[(i+1)%D.length]}}
async function moveItem(k,to){const mon=monday(),id='move-'+mon,r=LOGS.find(x=>x.id==id),map={...((r&&r.data.map)||{})};if(to==null)delete map[k];else map[k]=to;await put({id,kind:'move',day:mon,data:{map}});keepScroll(render)}
function weekStrip(){const W=weekItems(),mon=monday(),sk=W.filter(x=>x.skip);if(!(PROG.days||[]).some(d=>(d.wd||[]).length)&&!planOf(mon))return planCard();
 return `<div class="card"><div class="between" style="margin-bottom:10px"><h3>Ovaj tjedan</h3><span class="xs mute">dodirni trening za premještanje</span></div><div class="week">${WD.map((w,i)=>{const d=addD(mon,i),its=W.filter(x=>x.date==d);return `<div class="d ${d==today()?'today':''}"><span class="wn">${w}</span><span class="dn">${pd(d).getDate()}</span>${its.map(x=>`<button class="pill ${x.done?'done':d==today()?'plan':''} ${x.moved?'moved':''}" onclick="itemM('${x.k}')">${x.done?I('check','sm'):esc(shortName(x.day))}</button>`).join('')}</div>`}).join('')}</div>
${sk.length?`<p class="xs mute" style="margin-top:8px">Preskočeno ovaj tjedan: ${sk.map(x=>`<button class="b" style="text-decoration:underline" onclick="itemM('${x.k}')">${esc(x.day.name)}</button>`).join(', ')}</p>`:''}</div>`}
function itemM(k){const W=weekItems(),x=W.find(y=>y.k==k);if(!x)return;const mon=monday();
 const o=sheet(`<div class="stack">${sheetHd(esc(x.day.name))}<p class="s mute">Po planu: <b style="color:var(--ink)">${WD[wdi(x.orig)]} ${fmt(x.orig)}</b>${x.skip?' · <span class="chip warn">preskočeno</span>':x.moved?' · premješteno na <b style="color:var(--ink)">'+WD[wdi(x.date)]+' '+fmt(x.date)+'</b>':''}${x.done?' · <span class="chip ok">odrađeno</span>':''}</p>
${x.done?'':`<div><div class="kick" style="margin-bottom:8px">Premjesti na (samo ovaj tjedan, plan ostaje isti)</div><div class="week">${WD.map((w,i)=>{const d=addD(mon,i),past=d<today();return `<button class="d ${d==(x.date||'')?'today':''}" ${past?'disabled style="opacity:.35"':''} data-d="${d}"><span class="wn">${w}</span><span class="dn">${pd(d).getDate()}</span>${W.filter(y=>y.date==d&&y.k!=k).map(y=>`<span class="pill">${esc(shortName(y.day))}</span>`).join('')}</button>`}).join('')}</div></div>
<div class="grid2">${x.skip||x.moved?`<button class="btn ghost" data-a="reset">${I('back','sm')} Vrati na plan</button>`:`<button class="btn ghost" data-a="skip">${I('skip','sm')} Preskoči ovaj tjedan</button>`}<button class="btn acc" data-a="go">${I('play','sm')} Kreni sada</button></div>`}</div>`);
 o.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{const d=b.dataset.d;o.remove();moveItem(k,d==x.orig?null:d);toast(d==x.orig?'Vraćeno na plan.':'Premješteno na '+WD[wdi(d)]+' '+fmt(d)+'.')});
 o.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const a=b.dataset.a;o.remove();if(a=='go')return startW(x.day.id);moveItem(k,a=='skip'?'skip':null);toast(a=='skip'?'Preskočeno za ovaj tjedan.':'Vraćeno na plan.')})}

/* ============ TRENING TAB ============ */
function trainView(){const D=PROG.days||[],H=workouts().reverse();
 return `<div class="stack"><div class="between"><h1>Trening</h1><div class="row" style="gap:6px"><button class="btn sm ghost" onclick="libSheet()">${I('search','sm')} Baza vježbi</button><button class="btn sm ghost icon" aria-label="Ispiši plan" onclick="printPlan(PROG,(ME&&ME.client&&ME.client.f)||'')">${I('print','sm')}</button></div></div>
${weekStrip()}
${D.length?D.map(d=>{const last=H.find(r=>r.data.dayId==d.id),gs=groups(d.ex);return `<div class="card"><div class="between"><div style="min-width:0"><h3>${esc(d.name)}</h3><p class="xs mute" style="margin-top:3px">${(d.wd||[]).length?d.wd.map(i=>WD[i]).join(' · ')+' · ':''}${d.ex.length} vježbi · ~${estMin(d)} min${d.warm?' + zagrijavanje':''}${last?' · zadnje '+fmt(last.day):''}</p></div><button class="btn acc sm" onclick="startW('${d.id}')">${I('play','sm')} Start</button></div>
<div class="list" style="margin-top:12px">${gs.map(g=>g.map((e,j)=>`<button class="tap ${g.length>1?'ss':''}" onclick='exDetail(${jattr(exKey(e))},${jattr(e.lib||null)})'>${thumb(e.lib)}<div style="flex:1;min-width:0"><div class="b s ell">${g.length>1?`<span class="chip acc" style="margin-right:4px">${esc(e.ss)}${j+1}</span>`:''}${esc(exName(e))}</div><div class="xs mute">${planTxt(e)}</div></div>${I('chev','sm')}</button>`).join('')).join('')}</div></div>`}).join('')
:`<div class="card empty">Program još nije postavljen. Trener će ga dodati i pojavit će se ovdje.</div>`}
<h2 style="margin-top:8px">Povijest</h2>
<div class="card">${H.length?`<div class="list">${H.slice(0,30).map(r=>`<button class="tap" onclick="workoutDetail('${r.id}')"><div class="av" style="font-size:14px">${fmt(r.day).slice(0,5)}</div><div style="flex:1;min-width:0"><div class="b s ell">${esc(r.data.name)}</div><div class="xs mute">${r.data.dur||'—'} min · ${vol(r).toLocaleString('hr-HR')} kg${(r.data.prs||[]).length?' · <span class="pr">'+r.data.prs.length+' PR</span>':''}</div></div>${I('chev','sm')}</button>`).join('')}</div>`:`<div class="empty">Još nema odrađenih treninga.</div>`}</div></div>`}
const planTxt=e=>e.type=='cardio'?`${e.cmin||20} min kardio${e.kmh?' @ '+n1(e.kmh)+' km/h':''}`:e.type=='time'?`${e.s} × ${e.t||30} s${e.rest?' · odmor '+restSec(e.rest)+' s':''}`:`${e.s} × ${esc(e.r)}${e.rest?' · odmor '+restSec(e.rest)+' s':''}`;
function groups(ex){const G=[];(ex||[]).forEach(e=>{const g=G[G.length-1];if(e.ss&&g&&g[0].ss==e.ss)g.push(e);else G.push([e])});return G}

/* ============ PROGRESIJA ============ */
function parseR(r){const m=String(r??'').match(/(\d+)(?:\s*[–-]\s*(\d+))?/);if(!m)return{lo:null,hi:null};const lo=+m[1],hi=m[2]?+m[2]:lo;return{lo:Math.min(lo,hi),hi:Math.max(lo,hi)}}
const r05=x=>Math.round(x*2)/2;
function sessOk(h,n,need){const S=(h.e.sets||[]).filter(s=>s.r!==''&&s.r!=null);return S.length>=n&&S.slice(0,n).every((s,i)=>(+s.r||0)>=(Array.isArray(need)?(+need[i]||0):need))}
function target(ex,day){
 const type=ex.type||'reps',n=Math.max(1,+ex.s||1),H=exHist(exKey(ex)),last=H[H.length-1];
 const rule=type=='time'?'time':type=='cardio'?'none':(ex.rule||(day&&day.rule)||'double');
 const{lo,hi}=parseR(ex.r),inc=+ex.inc||2.5,bw=!!ex.bw;
 const o={rule,kg:'',reps:Array(n).fill(lo||''),t:+ex.t||30,why:'',amrap:rule=='gs'};
 if(type=='cardio'){o.cmin=+ex.cmin||20;const c=last&&last.e.cardio;if(c){o.kmh=c.kmh;o.min=c.min;o.why=`Prošli put ${n1(c.min)} min${c.kmh?' @ '+n1(c.kmh)+' km/h':''}. Probaj isto ili malo brže`}else o.why=`Cilj: ${o.cmin} min`;return o}
 if(!last){o.kg=ex.kg||'';o.why=type=='time'?`Prvi put: drži ${o.t} s`:ex.kg?'Početna težina koju je postavio trener':bw?'Vlastita težina, fokus na čistu tehniku':`Prvi put: odaberi težinu s kojom čisto napraviš ${hi||lo||''} ponavljanja`;return o}
 const S=(last.e.sets||[]).filter(s=>s.r!==''&&s.r!=null||s.t),lk=Math.max(0,...S.map(s=>+s.kg||0)),lt=last.e.tgt||{};
 o.kg=lk||'';
 if(type=='time'){const tg=lt.t||o.t,all=S.length>=n&&S.every(s=>(+s.t||0)>=tg);o.t=all?tg+5:tg;o.why=all?`Prošli put si izdržao ${tg} s u svim serijama → +5 s`:`Prošli put nisi izdržao ${tg} s u svim serijama → isto vrijeme`;return o}
 if(bw&&!lk){const tr=(lt.reps||[]).length?lt.reps:Array(n).fill(lo||8),ok=sessOk(last,n,tr);o.reps=Array.from({length:n},(_,i)=>(+tr[i]||lo||8)+(ok?1:0));o.kg='';
  o.why=ok?'Sva ponavljanja odrađena → +1 ponavljanje po seriji (vlastita težina napreduje u ponavljanjima)':'Isti cilj kao prošli put, probaj ga dostići';return o}
 const stalls=(()=>{let c=0;for(let i=H.length-1;i>=0;i--){const h=H[i],k=Math.max(0,...(h.e.sets||[]).map(s=>+s.kg||0));if(k!=lk)break;const t=(h.e.tgt||{}).reps||(rule=='double'?hi:hi);if(sessOk(h,n,rule=='double'?hi:t))break;c++}return c})();
 const fmtR=a=>a.every(x=>x==a[0])?n+'×'+a[0]:a.join('/');
 if(rule=='none'){o.reps=S.slice(0,n).map(s=>+s.r||lo);while(o.reps.length<n)o.reps.push(lo);o.why='Bez automatske progresije: težina i ponavljanja od zadnjeg puta';return o}
 if(rule=='linear'){const tr=hi||lo;o.reps=Array(n).fill(tr);
  if(sessOk(last,n,tr)){o.kg=r05(lk+inc);o.why=`Prošli put ${n}×${tr} s ${n1(lk)} kg → +${n1(inc)} kg`}
  else if(stalls>=3){o.kg=r05(lk*.9);o.why=`${stalls} treninga zaredom bez svih ponavljanja s ${n1(lk)} kg → deload 10 %`}
  else{o.why=`Prošli put nisi dobio sva ponavljanja (${fmtR(S.map(s=>+s.r||0))}) → ista težina${stalls==2?' (još jedan promašaj = deload)':''}`}return o}
 if(rule=='gs'){const tr=lo||5;o.reps=Array(n).fill(tr);const am=+(S[n-1]||S[S.length-1]||{}).r||0;
  if(sessOk(last,n,tr)){const dbl=am>=10;o.kg=r05(lk+inc*(dbl?2:1));o.why=dbl?`Zadnja serija (AMRAP) ${am} ponavljanja ≥ 10 → dupli skok +${n1(inc*2)} kg`:`Sve serije po ${tr}, AMRAP ${am} → +${n1(inc)} kg`}
  else{o.kg=r05(lk*.9);o.why=`Nisi dobio ${tr} u svim serijama → reset 10 % na ${n1(r05(lk*.9))} kg`}return o}
 /* dvostruka progresija */
 if(sessOk(last,n,hi)){o.kg=r05(lk+inc);o.reps=Array(n).fill(lo);o.why=`Prošli put sve serije ${hi} ponavljanja s ${n1(lk)} kg → +${n1(inc)} kg, krećeš opet od ${lo}`;return o}
 const tot=h=>(h.e.sets||[]).reduce((a,s)=>a+(+s.r||0),0);let flat=0;for(let i=H.length-1;i>0;i--){const a=H[i],b=H[i-1],ka=Math.max(0,...a.e.sets.map(s=>+s.kg||0)),kb=Math.max(0,...b.e.sets.map(s=>+s.kg||0));if(ka!=lk||kb!=lk)break;if(tot(a)<=tot(b))flat++;else break}
 if(flat>=3){o.kg=r05(lk*.9);o.reps=Array(n).fill(lo);o.why=`3 treninga bez više ponavljanja s ${n1(lk)} kg → deload 10 % pa ponovno gore`;return o}
 o.reps=Array.from({length:n},(_,i)=>Math.min(hi,Math.max(lo,(+(S[i]||{}).r||lo)+1)));
 o.why=`Ista težina (${n1(lk)} kg), cilj ${fmtR(o.reps)}. Kad sve serije dođu do ${hi}, dižemo težinu`;return o}

/* ============ VOĐENI TRENING ============ */
const getDr=()=>LS.get(DK,null),setDr=d=>LS.set(DK,d);
const upd=f=>{const d=getDr();f(d);setDr(d);return d};
async function startW(dayId){const d=(PROG.days||[]).find(x=>x.id==dayId);if(!d)return;if(getDr()){if(VIEW!='workout'&&await ask('Već imaš započet trening. Nastaviti njega?','Nastavi')){VIEW='workout';return render()}if(!await ask('Krenuti ispočetka s ovim treningom? Započeti se briše.','Kreni ispočetka',1))return}
 const w=lastW(),o=sheet(`<form class="stack">${sheetHd(esc(d.name))}<p class="s mute">Koliko imaš kila danas? Pomaže pratiti napredak i težinu na vježbama s vlastitom težinom.</p>
<label class="f">Tjelesna težina<div class="row"><input class="inp" name="bw" inputmode="decimal" value="${w&&w.day==today()?w.data.kg:''}" placeholder="${w?n1(w.data.kg):''}" style="font-size:22px;font-weight:700"><span class="mute b">kg</span></div></label>
<div class="grid2"><button type="button" class="btn ghost" data-skip>Preskoči</button><button class="btn acc">${I('play','sm')} Kreni</button></div></form>`);
 const f=o.querySelector('form'),go=bw=>{o.remove();if(bw){put({id:'weight-'+today(),kind:'weight',day:today(),data:{kg:bw}})}beginW(d,bw)};
 f.onsubmit=e=>{e.preventDefault();go(num(f.bw.value))};o.querySelector('[data-skip]').onclick=()=>go(null)}
function beginW(d,bw){const dr={id:'w-'+uid(),dayId:d.id,name:d.name,t0:Date.now(),bw:bw||null,rpe:null,note:'',prs:[],
 ex:d.ex.map(e=>{const t=target(e,d),n=Math.max(1,+e.s||1);return{id:e.id,lib:e.lib||null,n:e.n,custom:!!e.custom,hr:e.hr||'',type:e.type||'reps',mus:e.mus||[],mus2:e.mus2||[],ss:e.ss||'',rest:restSec(e.rest),bw:!!e.bw,r:e.r,note:e.note||'',v:e.v||'',tgt:t,
  sets:e.type=='cardio'?[]:Array.from({length:n},(_,i)=>({kg:t.kg===''?'':t.kg,r:'',t:'',e:'',ok:false,tr:t.reps[i]||'',tt:t.t})),cardio:e.type=='cardio'?{min:'',kmh:t.kmh||'',km:'',ok:false}:null}})};
 setDr(dr);liveSet(true,d.name);VIEW='workout';render();scrollTo(0,0);wake(true)}
/* nastavak već spremljenog treninga (npr. slučajno završen) */
async function resumeW(logId){const r=LOGS.find(x=>x.id==logId);if(!r)return;const d=(PROG.days||[]).find(x=>x.id==r.data.dayId);if(!d){toast('Taj dan više nije u programu.');return}
 if(getDr()&&!await ask('Već imaš započet trening. Zamijeniti ga ovim?','Zamijeni',1))return;
 const ix=LOGS.indexOf(r);LOGS.splice(ix,1);try{beginW(d,r.data.bw)}finally{LOGS.splice(ix,0,r)}const dr=getDr();dr.id=r.id;dr.t0=Date.now()-(+r.data.dur||0)*60000;dr.prs=r.data.prs||[];dr.note=r.data.note||'';dr.rpe=r.data.rpe||null;
 (r.data.ex||[]).forEach(le=>{const e=dr.ex.find(x=>x.id==le.id);if(!e)return;if(le.cn)e.cn=le.cn;if(e.type=='cardio'){if(le.cardio)e.cardio={min:le.cardio.min??'',kmh:le.cardio.kmh??'',km:le.cardio.km??'',ok:true};return}
  (le.sets||[]).forEach((s,i)=>{if(!e.sets[i])e.sets.push({kg:'',r:'',t:'',e:'',ok:false,tr:'',tt:''});Object.assign(e.sets[i],{kg:s.kg===0&&e.bw?'':String(s.kg??''),r:s.r!=null?String(s.r):'',t:s.t!=null?String(s.t):'',e:s.e!=null?String(s.e):'',ok:true})})});
 setDr(dr);render();toast('Nastavljaš gdje si stao.')}
async function liveSet(on,name){try{if(on)await API.put(CID,{id:'live',kind:'live',day:today(),data:{ts:Date.now(),name}});else await API.del(CID,'live')}catch(e){}}

/* — ekran budan — */
let WL=null;
async function wake(on){try{if(on&&setts().wake&&'wakeLock' in navigator&&!WL){WL=await navigator.wakeLock.request('screen');WL.addEventListener('release',()=>{WL=null})}else if(!on&&WL){const w=WL;WL=null;await w.release()}}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&getDr()&&VIEW=='workout')wake(true)});

/* — zvuk/vibracija — */
let AC=null;const unlockAudio=()=>{try{if(!AC)AC=new(window.AudioContext||window.webkitAudioContext)();if(AC.state=='suspended')AC.resume()}catch(e){}};
function beep(){try{if(!AC)return;[0,.22,.44].forEach((t,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=i==2?1180:880;g.gain.setValueAtTime(.0001,AC.currentTime+t);g.gain.exponentialRampToValueAtTime(.25,AC.currentTime+t+.02);g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+t+.18);o.connect(g).connect(AC.destination);o.start(AC.currentTime+t);o.stop(AC.currentTime+t+.2)})}catch(e){}}
async function notify(title,body){try{if(!('Notification' in window)||Notification.permission!='granted'||!document.hidden)return;const r=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();if(r)r.showNotification(title,{body,icon:'../icons/icon-192.png',tag:'kfit-rest',renotify:true,vibrate:[200,100,200]});else new Notification(title,{body})}catch(e){}}

/* — timer odmora — */
let RT=null,RTI=null;
function startRest(sec,next){if(!sec)return;RT={end:Date.now()+sec*1000,total:sec,next};const el=$('#rest');
 el.innerHTML=`<div class="in"><div style="flex:1;min-width:0"><div class="row" style="gap:8px"><span class="t tnum" id="rt"></span><div style="min-width:0"><div class="xs b" style="opacity:.7">ODMOR</div><div class="xs ell" id="rn"></div></div></div><div class="rb"><i id="rbar"></i></div></div><button onclick="restAdd(-15)">−15</button><button onclick="restAdd(15)">+15</button><button onclick="restDone(true)">Preskoči</button></div>`;
 el.classList.add('on');tickRest();clearInterval(RTI);RTI=setInterval(tickRest,250)}
function tickRest(){if(!RT)return;const left=(RT.end-Date.now())/1000;if(left<=0)return restDone();const t=$('#rt');if(!t)return;t.textContent=mmss(Math.ceil(left));$('#rn').textContent=RT.next?'Sljedeće: '+RT.next:'';$('#rbar').style.width=(100-left/RT.total*100)+'%'}
function restAdd(s){if(!RT)return;RT.end+=s*1000;RT.total=Math.max(RT.total,(RT.end-Date.now())/1000);tickRest()}
function restDone(skip){const n=RT&&RT.next;RT=null;clearInterval(RTI);const el=$('#rest');el.classList.remove('on');el.innerHTML='';if(!skip){if(navigator.vibrate)navigator.vibrate([200,100,200]);beep();if(document.hidden)notify('Odmor gotov',n?'Sljedeće: '+n:'Idemo!');else toast('Odmor gotov'+(n?'. Sljedeće: '+n:''))}}

/* — timer rada (vježbe na vrijeme) — */
function workTimer(ei,si){const d=getDr(),e=d.ex[ei],s=e.sets[si],tgt=+s.tt||+e.tgt.t||30,t0=Date.now();unlockAudio();let beeped=false;
 const o=sheet(`<div class="stack" style="text-align:center"><div class="kick">${esc(exName(e))} · serija ${si+1}</div><div class="timer-big" id="wt">0:00</div><div class="bar" style="height:10px"><i id="wb" style="width:0"></i></div><p class="s mute">Cilj: <b style="color:var(--ink)">${tgt} s</b>${s.kg?' · '+n1(s.kg)+' kg':''}</p><div class="grid2"><button class="btn ghost" data-wcancel>Odustani</button><button class="btn acc" data-wstop>${I('check','sm')} Stop i spremi</button></div></div>`);
 const iv=setInterval(()=>{const el=(Date.now()-t0)/1000,w=o.querySelector('#wt');if(!w)return clearInterval(iv);w.textContent=mmss(el);w.style.color=el>=tgt?'var(--ok)':'';o.querySelector('#wb').style.width=Math.min(100,el/tgt*100)+'%';if(el>=tgt&&!beeped){beeped=true;beep();if(navigator.vibrate)navigator.vibrate(200)}},200);
 o._onclose=()=>clearInterval(iv);o.onclick=null;
 o.querySelector("[data-wcancel]").onclick=()=>close(o);
 o.querySelector("[data-wstop]").onclick=()=>{const held=Math.round((Date.now()-t0)/1000);close(o);upd(d=>{d.ex[ei].sets[si].t=held});setOk(ei,si,true)}}

function workoutView(){const dr=getDr();if(!dr){VIEW='train';return render()}const st=setts(),eff=st.effort!='off'?st.effort:null;
 const done=dr.ex.reduce((s,e)=>s+(e.type=='cardio'?(e.cardio.ok?1:0):e.sets.filter(x=>x.ok).length),0),all=dr.ex.reduce((s,e)=>s+(e.type=='cardio'?1:e.sets.length),0);
 const G=[];dr.ex.forEach((e,i)=>{const g=G[G.length-1];if(e.ss&&g&&dr.ex[g[0]].ss==e.ss)g.push(i);else G.push([i])});
 const exHtml=(ei,lab)=>{const e=dr.ex[ei],t=e.tgt||{},fin=e.type=='cardio'?e.cardio.ok:e.sets.every(x=>x.ok);
  const cols=e.type=='time'?'28px 1fr 1fr 40px 40px':eff&&e.type=='reps'?'26px 1fr 1fr 62px 40px':'28px 1fr 1fr 40px';
  let body;
  if(e.type=='cardio'){const c=e.cardio;body=`<div class="sets" style="grid-template-columns:1fr 1fr 1fr 40px"><span class="h">Minute</span><span class="h">km/h</span><span class="h">km</span><span></span>
<input class="inp" inputmode="decimal" value="${esc(c.min)}" placeholder="${t.cmin||20}" data-e="${ei}" data-c="min"><input class="inp" inputmode="decimal" value="${esc(c.kmh)}" placeholder="${t.kmh?n1(t.kmh):'—'}" data-e="${ei}" data-c="kmh"><input class="inp" inputmode="decimal" value="${esc(c.km)}" placeholder="—" data-e="${ei}" data-c="km"><button class="ok-btn ${c.ok?'on':''}" aria-label="Gotovo" onclick="cardioOk(${ei})">${I('check','sm')}</button></div>`}
  else body=`<div class="sets" style="grid-template-columns:${cols}"><span class="h">#</span><span class="h">${e.bw?'+kg':'kg'}</span><span class="h">${e.type=='time'?'Sek.':'Ponav.'}</span>${e.type=='time'?'<span></span>':eff&&e.type=='reps'?`<span class="h">${eff.toUpperCase()}</span>`:''}<span></span>
${e.sets.map((x,si)=>`<span class="n">${t.amrap&&si==e.sets.length-1?'<span title="što više">A</span>':si+1}</span><input class="inp" inputmode="decimal" value="${esc(x.kg)}" placeholder="${e.bw?'0':'kg'}" data-e="${ei}" data-s="${si}" data-f="kg">${e.type=='time'?`<input class="inp" inputmode="numeric" value="${esc(x.t)}" placeholder="${x.tt||t.t}" data-e="${ei}" data-s="${si}" data-f="t"><button class="ok-btn go" aria-label="Pokreni timer" onclick="workTimer(${ei},${si})">${I('timer','sm')}</button>`
:`<input class="inp" inputmode="numeric" value="${esc(x.r)}" placeholder="${t.amrap&&si==e.sets.length-1?(x.tr||'')+'+':x.tr||''}" data-e="${ei}" data-s="${si}" data-f="r">${eff?`<select class="inp rir" data-e="${ei}" data-s="${si}" data-f="e" aria-label="${eff.toUpperCase()} serija ${si+1}">${['',...(eff=='rir'?['0','1','2','3','4','5']:['6','7','8','9','10'])].map(v=>`<option value="${v}" ${String(x.e)===v?'selected':''}>${v===''?'–':eff=='rir'&&v=='5'?'5+':v}</option>`).join('')}</select>`:''}`}<button class="ok-btn ${x.ok?'on':''}" aria-label="Serija gotova" onclick="setOk(${ei},${si})">${I('check','sm')}</button>${restTag(dr,ei,si)}`).join('')}</div>
<div class="row" style="margin-top:8px;gap:6px"><button class="btn sm ghost" onclick="addSet(${ei},1)">${I('plus','sm')} Serija</button>${e.sets.length>1?`<button class="btn sm ghost" onclick="addSet(${ei},-1)" aria-label="Makni seriju">${I('minus','sm')}</button>`:''}<button class="btn sm ghost" style="margin-left:auto${e.cn?';color:var(--acc)':''}" onclick="cnToggle(${ei})">${I('msg','sm')} ${e.cn?'Bilješka ✓':'Bilješka'}</button></div>${e.cnOpen?`<textarea class="inp" data-cn="${ei}" style="margin-top:8px;min-height:60px" placeholder="Za trenera: npr. zateže rame, prelagano, sprava zauzeta…">${esc(e.cn||'')}</textarea>`:''}`;
  const prs=(dr.prs||[]).filter(p=>p.k==exKey(e));
  return `<div${fin&&!lab?' style="opacity:.8"':''}><div class="hd" style="display:flex;gap:10px;align-items:flex-start"><button onclick='exDetail(${jattr(exKey(e))},${jattr(e.lib)})' aria-label="Detalji vježbe">${thumb(e.lib)}</button><div style="flex:1;min-width:0">${e.swapFrom||e.moved?`<div class="chip warn" style="margin-bottom:4px;white-space:normal;max-width:100%;line-height:1.3">${I(e.swapFrom?'move':'clock','sm')} ${e.swapFrom?'zamjena za '+esc(exName({lib:e.swapFrom.lib,n:e.swapFrom.n,custom:e.swapFrom.custom})):'premješteno na kraj'}</div>`:''}<h3>${lab?`<span class="chip acc" style="margin-right:4px;vertical-align:2px">${lab}</span>`:''}${esc(exName(e))}</h3>${altName(e)?`<p class="xs mute" style="margin-top:2px">${esc(altName(e))}</p>`:''}<p class="xs mute" style="margin-top:3px">${e.type=='cardio'?'Kardio':e.type=='time'?e.sets.length+' × '+(t.t||30)+' s':e.sets.length+' × '+esc(e.r)} · odmor ${e.ss&&!lab?'nakon para':e.rest+' s'}${t.rule&&t.rule!='time'&&t.rule!='none'?' · '+RULES[t.rule].split(' ')[0]:''}</p>
${t.why?`<div class="why">${I('bolt','sm')}<span>${esc(t.why)}</span></div>`:''}${e.note?`<div class="why" style="color:var(--mute)">${I('msg','sm')}<span>${esc(e.note)}</span></div>`:''}${prs.length?`<div class="why pr">${I('trophy','sm')}<span>${esc(prs[prs.length-1].t)}</span></div>`:''}</div><div class="row" style="gap:6px;flex:none;align-self:flex-start">${e.v?`<button class="btn sm icon" aria-label="Video" onclick='videoM(${jattr(exName(e))},${jattr(e.v)})'>${I('play','sm')}</button>`:''}${fin||(e.type!='cardio'&&e.sets.some(x=>x.ok))?'':`<button class="btn sm icon ghost" aria-label="Nema sprave: zamijeni ili odradi kasnije" title="Nema sprave?" onclick="swapM(${ei})">${I('move','sm')}</button>`}</div></div>${body}</div>`};
 app.innerHTML=`<header id="top"><button class="btn sm icon ghost" onclick="cancelW()" aria-label="Odustani">${I('x','sm')}</button><div style="min-width:0;flex:1"><div class="b ell">${esc(dr.name)}</div><div class="xs mute tnum"><span id="clk"></span> · ${done}/${all} serija${WL?' · '+I('sun','sm'):''}</div></div></header>
<main style="padding-bottom:calc(150px + env(safe-area-inset-bottom,0px))"><div class="stack">${(()=>{const wd=((PROG&&PROG.days)||[]).find(x=>x.id==dr.dayId);return wd&&wd.warm?`<details class="card warm" ${done?'':'open'}><summary class="between"><span class="row" style="gap:8px"><b>Zagrijavanje</b></span><span class="xs mute">prije prve serije</span></summary><p class="s" style="white-space:pre-line;margin-top:10px">${esc(wd.warm)}</p></details>`:''})()}${G.map(g=>g.length>1?`<div class="card ex stack" style="gap:16px"><div class="kick" style="color:var(--acc)">${I('link','sm')} Superset ${esc(dr.ex[g[0]].ss)}: serije naizmjence, odmor tek nakon para</div>${g.map((ei,j)=>exHtml(ei,dr.ex[ei].ss+(j+1))).join('<hr style="border:0;border-top:1px solid var(--line);margin:0">')}</div>`:`<div class="card ex">${exHtml(g[0])}</div>`).join('')}
<div class="card stack"><label class="f">Koliko je bilo teško? (RPE 1–10)<div class="scale" id="rpe">${[5,6,7,8,9,10].map(n=>`<button type="button" class="${dr.rpe==n?'on':''}" onclick="dSet('rpe',${n})">${n}</button>`).join('')}</div></label>
<label class="f">Bilješka za trenera<textarea class="inp" id="wnote" placeholder="Npr. bol u ramenu, povećati težinu…">${esc(dr.note||'')}</textarea></label></div></div></main>
<div class="wbar"><div class="in"><div style="flex:1"><div class="xs mute tnum" style="margin-bottom:6px">${done} / ${all} serija</div><div class="bar"><i style="width:${all?done/all*100:0}%"></i></div></div><button class="btn ${all&&done>=all?'acc':'ghost'}" onclick="finishW()">${I('check','sm')} Završi trening</button></div></div>`;
 $$('.sets .inp').forEach(i=>i.oninput=()=>upd(d=>{if(i.dataset.c)d.ex[i.dataset.e].cardio[i.dataset.c]=i.value;else d.ex[i.dataset.e].sets[i.dataset.s][i.dataset.f]=i.value}));
 $('#wnote').oninput=e=>upd(d=>d.note=e.target.value);
 $$('[data-cn]').forEach(t=>t.oninput=()=>upd(d=>d.ex[t.dataset.cn].cn=t.value));
 clearInterval(window.TICK);const tk=()=>{const c=$('#clk');if(!c){clearInterval(window.TICK);return}c.textContent=mmss((Date.now()-dr.t0)/1000)};tk();window.TICK=setInterval(tk,1000)}
/* — stvarni odmor: vrijeme od prethodne serije umanjeno za procjenu trajanja serije — */
function restBefore(d,ei,si){const e=d.ex[ei],x=e.sets[si];if(!x||!x.at||si==0)return null;let prev;
 if(e.ss){const G=d.ex.map((y,i)=>[y,i]).filter(([y])=>y.ss==e.ss);if(G[0][1]!=ei)return null;prev=Math.max(0,...G.map(([y])=>(y.sets[si-1]&&y.sets[si-1].at)||0))}else prev=e.sets[si-1].at;
 if(!prev)return null;const gap=(x.at-prev)/1000;if(gap>900||gap<0)return null;const work=e.type=='time'?(+x.t||30):Math.min(60,Math.max(15,(+x.r||8)*3));return Math.max(0,Math.round(gap-work))}
function restRec(d,ei){const e=d.ex[ei];if(!e.ss)return e.rest||0;return Math.max(...d.ex.filter(y=>y.ss==e.ss).map(y=>y.rest||0))}
function restSum(d,ei){const v=d.ex[ei].sets.map((_,si)=>restBefore(d,ei,si)).filter(x=>x!=null);return v.length?{rec:restRec(d,ei),avg:Math.round(v.reduce((a,b)=>a+b,0)/v.length),n:v.length}:{rec:restRec(d,ei)}}
function restTag(d,ei,si){const r=restBefore(d,ei,si);if(r==null)return'';const rec=restRec(d,ei),df=r-rec,big=rec&&Math.abs(df)>Math.max(15,rec*.25);
 return `<span class="rs" style="grid-column:2/-1;color:${!big?'var(--mute)':df>0?'var(--warn)':'var(--acc)'}">${I('clock','sm')} odmor ${mmss(r)}${rec?` · preporuka ${mmss(rec)}${big?` (${df>0?'+':'−'}${mmss(Math.abs(df))})`:''}`:''}</span>`}
function cnToggle(ei){upd(d=>{d.ex[ei].cnOpen=!d.ex[ei].cnOpen});keepScroll(workoutView);const t=document.querySelector(`[data-cn="${ei}"]`);if(t)t.focus()}
function dSet(k,v){upd(d=>d[k]=v);keepScroll(workoutView)}
function prCheck(e,s){const H=exHist(exKey(e));if(!H.length)return null;
 if(e.type=='time'){const b=Math.max(0,...H.flatMap(h=>(h.e.sets||[]).map(x=>+x.t||0)));return +s.t>b?`Novi rekord držanja: ${s.t} s (prije ${b} s)`:null}
 const mk=Math.max(0,...H.flatMap(h=>(h.e.sets||[]).map(x=>+x.kg||0))),b1=Math.max(0,...H.map(h=>(bestSet(h.e.sets)||{v:0}).v)),v=e1(+s.kg,+s.r);
 if(+s.kg>mk&&mk>0)return `Najveća težina dosad: ${n1(s.kg)} kg (prije ${n1(mk)})`;if(v&&b1&&v>b1+.05)return `Novi procijenjeni 1RM: ${n1(v)} kg (prije ${n1(b1)})`;
 if(e.bw&&!+s.kg){const mr=Math.max(0,...H.flatMap(h=>(h.e.sets||[]).map(x=>+x.r||0)));if(+s.r>mr&&mr>0)return `Najviše ponavljanja dosad: ${s.r}`}return null}
function setOk(ei,si,force){unlockAudio();let restS=0,next='',pr=null;
 const d=upd(d=>{const e=d.ex[ei],x=e.sets[si];if(force)x.ok=true;else{if(!x.ok&&x.r===''&&e.type!='time')x.r=String(x.tr||parseR(e.r).lo||'');if(!x.ok&&x.t===''&&e.type=='time')x.t=String(x.tt||e.tgt.t||'');x.ok=!x.ok}
  if(!x.ok)delete x.at;
  if(x.ok){x.at=Date.now();if(st().effort!='off'&&x.e!=='')x.es=st().effort;pr=prCheck(e,x);if(pr){d.prs=(d.prs||[]).filter(p=>p.k!=exKey(e));d.prs.push({k:exKey(e),n:e.n,t:pr})}
   const grp=e.ss?d.ex.map((y,i)=>[y,i]).filter(([y])=>y.ss==e.ss):[[e,ei]];
   const pairDone=grp.every(([y])=>!y.sets[si]||y.sets[si].ok);
   if(pairDone){restS=Math.max(...grp.map(([y])=>y.rest||0));const nx=grp.map(([y])=>y).find(y=>y.sets.some(z=>!z.ok))||d.ex.find(y=>y.type=='cardio'?!y.cardio.ok:y.sets.some(z=>!z.ok));next=nx?exName(nx):''}
   else{const ny=grp.map(([y])=>y).find(y=>y.sets[si]&&!y.sets[si].ok);next=ny?exName(ny):'';toast('→ '+next+' (bez odmora)',1600)}}});
 if(navigator.vibrate)navigator.vibrate(12);
 if(pr){toast('Novi rekord: '+pr,3200)}
 if(d.ex[ei].sets[si].ok&&restS)startRest(restS,next);else if(!d.ex[ei].sets[si].ok)restDone(true);
 keepScroll(workoutView)}
const st=()=>setts();
function cardioOk(ei){upd(d=>{const c=d.ex[ei].cardio;if(!c.ok&&c.min==='')c.min=String(d.ex[ei].tgt.cmin||'');c.ok=!c.ok});keepScroll(workoutView)}
function addSet(ei,n){upd(d=>{const S=d.ex[ei].sets;if(n>0){const p=S[S.length-1]||{};S.push({kg:p.kg||'',r:'',t:'',e:'',ok:false,tr:p.tr||'',tt:p.tt||''})}else if(S.length>1)S.pop()});keepScroll(workoutView)}
async function cancelW(){if(!await ask('Odustati od treninga? Upisani podaci neće se spremiti.','Odustani',1))return;LS.del(DK);clearInterval(window.TICK);restDone(true);wake(false);liveSet(false);go('train')}
async function finishW(){const d=getDr();{const tot=d.ex.reduce((a,e)=>a+(e.type=='cardio'?1:e.sets.length),0),dn=d.ex.reduce((a,e)=>a+(e.type=='cardio'?(e.cardio&&e.cardio.ok?1:0):e.sets.filter(x=>x.ok).length),0);if(dn<tot&&!await ask(`Odradio si ${dn} od ${tot} serija. Želiš li stvarno završiti trening? Ako samo čekaš odmor, odustani.`,'Završi trening',1))return}
 const ex=d.ex.map(e=>e.type=='cardio'?{id:e.id,lib:e.lib,n:e.n,custom:e.custom,type:'cardio',...(e.swapFrom?{swapFrom:{lib:e.swapFrom.lib,n:e.swapFrom.n},swapWhy:e.swapWhy}:{}),mus:e.mus,mus2:e.mus2,cardio:e.cardio.ok||e.cardio.min!==''?{min:num(e.cardio.min)||0,kmh:num(e.cardio.kmh),km:num(e.cardio.km)}:null,tgt:e.tgt}
  :{id:e.id,lib:e.lib,n:e.n,custom:e.custom,type:e.type,ss:e.ss,...(e.swapFrom?{swapFrom:{lib:e.swapFrom.lib,n:e.swapFrom.n,custom:e.swapFrom.custom},swapWhy:e.swapWhy}:{}),...(e.moved?{moved:true}:{}),mus:e.mus,mus2:e.mus2,tgt:{kg:e.tgt.kg,reps:e.tgt.reps,t:e.tgt.t,rule:e.tgt.rule},
   cn:(e.cn||'').trim(),rest:restSum(d,d.ex.indexOf(e)),
   sets:e.sets.map((x,si)=>({x,si})).filter(({x})=>x.ok||(e.type=='time'?x.t!=='':x.r!=='')).map(({x,si})=>{const o={kg:num(x.kg)||0};if(e.type=='time')o.t=+x.t||0;else o.r=+x.r||0;if(x.e!==''&&x.e!=null){o.e=num(x.e);o.es=x.es||setts().effort}const rs=restBefore(d,d.ex.indexOf(e),si);if(rs!=null)o.rs=rs;return o})}).filter(e=>e.type=='cardio'?e.cardio:e.sets.length);
 if(!ex.length&&!await ask('Nijedna serija nije upisana. Svejedno spremiti?','Spremi'))return;
 const r={id:d.id,kind:'workout',day:today(),data:{dayId:d.dayId,name:d.name,dur:Math.max(1,Math.round((Date.now()-d.t0)/60000)),hr:new Date(d.t0).getHours(),rpe:d.rpe||null,bw:d.bw,note:(d.note||'').trim(),prs:d.prs||[],ex}};
 clearInterval(window.TICK);LS.del(DK);restDone(true);wake(false);await put(r);liveSet(false);VIEW='home';render();scrollTo(0,0);summaryM(r)}
function summaryM(r){const d=r.data,sets=d.ex.reduce((a,e)=>a+(e.sets||[]).length,0);if(d.prs.length)setTimeout(confetti,250);
 sheet(`<div class="stack">${sheetHd('Trening spremljen')}<div class="grid3"><div class="card flat" style="padding:10px"><div class="xs mute">Trajanje</div><div class="b">${d.dur} min</div></div><div class="card flat" style="padding:10px"><div class="xs mute">Serije</div><div class="b">${sets}</div></div><div class="card flat" style="padding:10px"><div class="xs mute">Volumen</div><div class="b">${vol(r).toLocaleString('hr-HR')} kg</div></div></div>
${d.prs.length?`<div class="card flat" style="padding:12px;border-color:var(--warn)"><div class="row pr">${I('trophy','sm')} ${d.prs.length} ${d.prs.length==1?'rekord':'rekorda'}</div><ul class="s" style="margin:6px 0 0;padding-left:18px">${d.prs.map(p=>`<li><b>${esc(exName({lib:p.k==p.n?null:p.k,n:p.n}))}</b>: ${esc(p.t)}</li>`).join('')}</ul></div>`:''}
${(()=>{const nb=newBadges();if(nb.length)setTimeout(confetti,250);return nb.length?`<div class="card hero" style="padding:12px"><div class="kick" style="color:var(--acc)">Nova značka${nb.length>1?'e':''}!</div><div class="chips" style="margin-top:8px">${nb.map(b=>`<button type="button" class="chip acc" onclick="shareBadge('${b.id}')">${I(b.ic,'sm')} ${esc(b.t)} ${I('share','sm')}</button>`).join('')}</div><div class="xs mute" style="margin-top:6px">Dodirni značku da je podijeliš na Instagramu.</div></div>`:''})()}
<div><div class="kick" style="margin-bottom:6px">Što si danas trenirao</div>${bodyMap(muscleVol([r]),setts().fig,{untrained:false,ref:8})}</div><button class="btn acc" data-x>Super</button></div>`);afterRender()}

/* ============ ISPIS / DIJELJENJE PLANA ============ */
function printPlan(prog,who){const D=prog.days||[];if(!D.length){toast('Plan je prazan.');return}if(PREVIEW){toast('Ispis u PDF radi u pravoj aplikaciji, ne u ovom pregledu.',3200);return}
 $('#print').innerHTML=`<h1>K-FIT plan treninga${who?' — '+esc(who):''}</h1><div class="n">Ispisano ${fmt(today())}${prog.water?' · voda '+(prog.water/1000).toLocaleString('hr-HR')+' L/dan':''}${prog.steps?' · '+prog.steps.toLocaleString('hr-HR')+' koraka/dan':''}</div>
${D.map(d=>`<div class="day"><h2>${esc(d.name)}${(d.wd||[]).length?' · '+d.wd.map(i=>WD[i]).join(', '):''}</h2>${d.warm?`<p><b>Zagrijavanje:</b> ${esc(d.warm)}</p>`:''}<table><tr><th>#</th><th>Vježba</th><th>Serije × ponav.</th><th>Odmor</th><th>Napomena</th></tr>${d.ex.map((e,i)=>`<tr><td>${e.ss?esc(e.ss):i+1}</td><td><b>${esc(exName(e))}</b></td><td>${e.type=='cardio'?(e.cmin||20)+' min':e.type=='time'?e.s+' × '+(e.t||30)+' s':e.s+' × '+esc(e.r)}</td><td>${e.type=='cardio'?'—':restSec(e.rest)+' s'}</td><td class="n">${esc(e.note||'')}${e.ss?' (superset)':''}</td></tr>`).join('')}</table></div>`).join('')}
${prog.msg?`<p class="n" style="margin-top:16pt">${esc(prog.msg)}</p>`:''}`;setTimeout(()=>window.print(),50)}
async function sharePlan(prog,who){const data={format:'kfit-plan',v:1,ime:who||'',days:clone(prog.days||[])},name='kfit-plan'+(who?'-'+who.toLowerCase().replace(/[^a-z0-9]+/gi,'-'):'')+'.json',txt=JSON.stringify(data,null,1);
 try{const f=new File([txt],name,{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'K-FIT plan'});return}}catch(e){if(e.name=='AbortError')return}
 download(name,txt);toast('Datoteka plana preuzeta (bez treninga i vaganja).')}
