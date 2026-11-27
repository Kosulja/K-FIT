/* ============ PLAN TJEDNA: klijent sam bira dane, trener vidi plan ============ */
/* plan se sprema kao zapis 'plan-<ponedjeljak>' s mapom {dayId:[indeks dana u tjednu]} i zamjenjuje trenerove dane za taj tjedan */
const planRec=(mon,L=LOGS)=>L.find(x=>x.id=='plan-'+mon);
const planOf=(mon,L=LOGS,P=PROG)=>{if(P&&P.lockPlan)return null;const r=planRec(mon,L);return r&&r.data&&r.data.wd?r.data.wd:null};
const planTarget=()=>wdi(today())==6?addD(monday(),7):monday(); /* u nedjelju se planira sljedeći tjedan */
function planNeeded(){if(ROLE!='client'||!PROG||PROG.lockPlan||!(PROG.days||[]).length)return null;const m=planTarget();return planOf(m)?null:m}
function planCard(){const m=planNeeded();if(!m)return'';const nx=m!=monday();
 return `<div class="card hero"><div class="row" style="align-items:flex-start;gap:12px">${I('cal')}<div style="flex:1"><div class="b">Isplaniraj ${nx?'sljedeći':'ovaj'} tjedan</div><p class="s mute" style="margin:4px 0 12px">Odaberi dane kad stižeš trenirati, a aplikacija ti rasporedi treninge.</p><button class="btn acc" onclick="planM()">${I('cal','sm')} Složi plan</button></div></div></div>`}
/* jednom na dan ponudi planiranje: u nedjelju za sljedeći tjedan, inače ako ovaj tjedan nije isplaniran */
function planNudge(){const m=planNeeded(),k='kfitk-planask-'+(CID||'')+'-'+today();if(!m||DEMO&&!window.PLAN_TEST||LS.get(k,0))return;LS.set(k,1);setTimeout(()=>{if(!document.querySelector('.ov'))planM(m)},600)}
const dayMus=day=>new Set((day.ex||[]).flatMap(e=>(e.mus||[]).slice(0,1)));
function planWarn(sel,D){const W=[],s=[...sel].sort((a,b)=>a-b);let run=1;for(let i=1;i<s.length;i++){run=s[i]==s[i-1]+1?run+1:1;if(run==3)W.push(`${WD[s[i-2]]}, ${WD[s[i-1]]} i ${WD[s[i]]} su 3 dana zaredom bez odmora.`)}
 for(let i=1;i<s.length;i++)if(s[i]==s[i-1]+1&&D[i]&&D[i-1]){const a=dayMus(D[i-1]),b=dayMus(D[i]),sh=[...a].filter(x=>b.has(x));if(sh.length&&sh.length>=Math.min(a.size,b.size)*.5)W.push(`${D[i-1].name} i ${D[i].name} zaredom opterećuju iste mišiće (${sh.slice(0,3).map(m=>MUS[m]||m).join(', ')}).`)}
 return W}
/* redoslijed: nastavlja od zadnjeg odrađenog treninga; u tekućem tjednu preskače već odrađene */
function planOrder(mon){const A=PROG.days||[],W=workouts().filter(r=>r.day<=today()),last=W[W.length-1],i0=last?A.findIndex(d=>d.id==last.data.dayId)+1:0,R=A.map((_,k)=>A[(i0+k)%A.length]);
 if(mon!=monday())return R;const done=new Set(W.filter(r=>r.day>=mon).map(r=>r.data.dayId));return R.filter(d=>!done.has(d.id))}
function planM(mon=planTarget()){const D=planOrder(mon),N=D.length,cur=planRec(mon),prev=planOf(addD(mon,-7)),tPast=mon==monday()?wdi(today()):-1,doneN=(PROG.days||[]).length-N;
 if(!N){toast('Ovaj tjedan si već odradio sve treninge.');return}
 const fromMap=m=>D.flatMap(d=>(m&&m[d.id])||[]).sort((a,b)=>a-b);
 let sel=new Set(cur?fromMap(cur.data.wd):prev?fromMap(prev):D.flatMap(d=>d.wd||[]).slice(0,N));[...sel].forEach(i=>{if(i<tPast)sel.delete(i)});
 let tm=(cur&&cur.data.tm)||LS.get('kfitk-plantm','18:00');
 const o=sheet('<div id="pl"></div>'),box=o.querySelector('#pl');
 const draw=()=>{const s=[...sel].sort((a,b)=>a-b),W=planWarn(s,D);
  box.innerHTML=`<div class="stack">${sheetHd(mon==monday()?'Plan za ovaj tjedan':'Plan za sljedeći tjedan')}
<p class="s mute" style="margin:0">${fmt(mon)} – ${fmt(addD(mon,6))}. ${doneN?`Već si odradio ${doneN}, ostaje ti <b style="color:var(--ink)">${N} ${N==1?'trening':'treninga'}</b>.`:`Program ima <b style="color:var(--ink)">${N} ${N==1?'trening':'treninga'}</b> tjedno.`} Odaberi ${N==1?'dan':'dane'} kad stižeš.</p>
<div class="week plan-pick">${WD.map((w,i)=>{const d=addD(mon,i),past=i<tPast,on=sel.has(i);return `<button type="button" class="d ${on?'on':''}" ${past?'disabled':''} data-i="${i}"><span class="wn">${w}</span><span class="dn">${pd(d).getDate()}</span><span class="pk">${on?I('check','sm'):''}</span></button>`}).join('')}</div>
<div class="between"><span class="s ${s.length==N?'':'mute'}">Odabrano <b>${s.length} / ${N}</b></span>${prev&&!cur?`<button type="button" class="btn sm ghost" data-same>Isto kao prošli tjedan</button>`:''}</div>
${s.length?`<div class="list">${s.map((i,k)=>`<div class="row" style="gap:12px"><div class="av" style="font-size:13px">${WD[i]}</div><div style="flex:1;min-width:0"><div class="b s ell">${esc(D[k].name)}</div><div class="xs mute">${fmt(addD(mon,i))} · oko ${estMin(D[k])} min</div></div></div>`).join('')}</div>`:''}
${s.length<N&&s.length?`<p class="xs mute" style="margin:0">Neraspoređeno: ${D.slice(s.length).map(d=>esc(d.name)).join(', ')}. Možeš ih odraditi kad stigneš.</p>`:''}
${W.map(t=>`<div class="card flat row" style="padding:10px 12px;border-color:var(--warn);gap:10px">${I('info','sm')}<span class="s">${t}</span></div>`).join('')}
<label class="f">U koliko sati obično treniraš? (za kalendar)<input class="inp" type="time" id="pltm" value="${tm}"></label>
<button type="button" class="btn acc full" data-save ${s.length?'':'disabled'}>${I('check','sm')} Spremi plan</button></div>`;
  box.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(sel.has(i))sel.delete(i);else{if(sel.size>=N){toast(`Program ima ${N} treninga tjedno. Prvo makni jedan dan.`);return}sel.add(i)}draw()});
  const sm=box.querySelector('[data-same]');if(sm)sm.onclick=()=>{sel=new Set(fromMap(prev).filter(i=>i>=tPast));draw()};
  box.querySelector('#pltm').onchange=e=>{tm=e.target.value||'18:00'};
  box.querySelector('[data-save]').onclick=async()=>{const s=[...sel].sort((a,b)=>a-b),wd={};(PROG.days||[]).forEach(d=>wd[d.id]=[]);D.forEach((d,k)=>{if(k<s.length)wd[d.id]=[s[k]]});LS.set('kfitk-plantm',tm);
   await put({id:'plan-'+mon,kind:'plan',day:mon,data:{wd,tm,ts:new Date().toISOString()}});o.remove();render();planDoneM(mon)}};
 draw()}
function planDoneM(mon){const W=weekItems(mon).filter(x=>x.date).sort((a,b)=>a.date.localeCompare(b.date));
 sheet(`<div class="stack">${sheetHd('Plan spremljen')}<div class="list">${W.map(x=>`<div class="row" style="gap:12px"><div class="av" style="font-size:13px">${WD[wdi(x.date)]}</div><div style="flex:1"><div class="b s">${esc(x.day.name)}</div><div class="xs mute">${fmt(x.date)}</div></div></div>`).join('')}</div>
<p class="s mute" style="margin:0">Trener vidi tvoj plan. Ako nešto iskrsne, trening možeš premjestiti u kartici Trening.</p>
${pushState()!='on'&&pushState()!='no'?`<button class="btn acc full" onclick="pushOn()">${I('bell','sm')} Uključi obavijesti</button>`:''}<button class="btn ${pushState()!='on'&&pushState()!='no'?'ghost':'acc'} full" onclick="calM()">${I('cal','sm')} Dodaj u kalendar mobitela</button><button class="btn ghost full" data-x>Gotovo</button></div>`)}
/* pretplata na kalendar: Apple (webcal) i Google; kalendar se sam osvježava i podsjeća */
let CALTOK=null;
async function calM(){if(DEMO){sheet(`<div class="stack">${sheetHd('Kalendar mobitela')}<p class="s mute">U pravoj aplikaciji ovdje se treninzi jednim dodirom dodaju u Apple ili Google kalendar, zajedno s podsjetnikom za planiranje svake nedjelje.</p><button class="btn ghost full" data-x>U redu</button></div>`);return}
 try{if(!CALTOK)CALTOK=await API.calToken()}catch(e){toast('Kalendar trenutno nije dostupan.');return}
 const http=`${CFG.url}/functions/v1/kfit-cal?t=${CALTOK}`,web=http.replace(/^https:/,'webcal:'),g='https://calendar.google.com/calendar/r?cid='+encodeURIComponent(web),ios=/iPhone|iPad|Mac/.test(navigator.userAgent);
 sheet(`<div class="stack">${sheetHd('Dodaj u kalendar')}<p class="s mute" style="margin:0">Treninzi iz plana pojave se u tvom kalendaru, s podsjetnikom sat prije. Svake nedjelje u 10 h stiže podsjetnik da isplaniraš tjedan. Kalendar se sam osvježava kad promijeniš plan.</p>
<a class="btn ${ios?'acc':'ghost'} full" href="${web}">${I('cal','sm')} Apple kalendar (iPhone)</a><a class="btn ${ios?'ghost':'acc'} full" href="${g}" target="_blank" rel="noopener">${I('cal','sm')} Google kalendar</a>
<p class="xs mute" style="margin:0">Na Androidu odaberi Google kalendar i potvrdi „Dodaj”. Promjene plana u kalendaru se pojave za nekoliko sati, ovisno o mobitelu.</p><button class="btn ghost full" data-x>Zatvori</button></div>`)}

/* trener: plan klijenta za ovaj i sljedeći tjedan */
function coachPlanCard(L,P){const rows=[0,7].map(o=>{const mon=addD(monday(),o),r=planRec(mon,L),W=weekItems(mon,L,P);
 return `<div><div class="between" style="margin-bottom:8px"><span class="b s">${o?'Sljedeći tjedan':'Ovaj tjedan'} <span class="xs mute">${pd(mon).getDate()}.${pd(mon).getMonth()+1}. – ${pd(addD(mon,6)).getDate()}.${pd(addD(mon,6)).getMonth()+1}.</span></span><span class="xs ${r?'mute':''}" style="${r?'':'color:var(--warn)'}">${P.lockPlan?'raspored zadaješ ti':r?'isplanirao '+fmt(r.data.ts.slice(0,10)):'nije isplanirano'}</span></div>
<div class="week">${WD.map((w,i)=>{const d=addD(mon,i),its=W.filter(x=>x.date==d);return `<div class="d ${d==today()?'today':''}"><span class="wn">${w}</span><span class="dn">${pd(d).getDate()}</span>${its.map(x=>`<span class="pill ${x.done?'done':''} ${x.moved?'moved':''}">${x.done?I('check','sm'):esc(shortName(x.day))}</span>`).join('')}</div>`}).join('')}</div></div>`}).join('<div style="height:14px"></div>');
 return `<div class="card"><h3 style="margin-bottom:12px">Plan treninga</h3>${rows}</div>`}
