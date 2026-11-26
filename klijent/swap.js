/* ============ K-FIT KLIJENT — zamjena vježbe i promjena redoslijeda ============
   Kad sprava nije dostupna: (1) odradi kasnije, (2) ista vježba i kut s drugom opremom,
   (3) druga vježba za iste mišiće pod istim kutem. Najviše ~30 % treninga po treningu. */
const SW_SHARE=.3;
/* vrsta pokreta iz naziva (EN) */
const PATTERNS=[['vpull',/pull-?down|pull-?up|pullup|chin/],['hpull',/\brow|rows\b|high row|iso row/],['fly',/fl(y|ye|yes)\b|crossover|butterfly|pec deck|iron cross/],['pullover',/pullover/],
 ['dip',/\bdips?\b/],['pushup',/push-?ups?|pushups/],['press',/press|bench|floor press|jm press|svend/],['curl',/curl/],['ext',/extension|pushdown|skull|kickback|tate/],
 ['raise',/raise|lateral|scaption|deltoid/],['shrug',/shrug/],['squat',/squat|leg press|hack/],['lunge',/lunge|step-?up|split/],['hinge',/deadlift|good morning|rdl|pull through|hyperextension/],
 ['glute',/hip thrust|glute|bridge|kickback|butt/],['calf',/calf|calves/],['core',/crunch|sit-?up|plank|twist|rollout|leg raise|knee raise|pallof|wood chop|jackknife|v-up|bicycle|flutter/],['carry',/walk|carry/]];
const ANGLES=[['incline',/incline/],['decline',/decline/],['overhead',/overhead|military|shoulder press|arnold|behind (the )?neck/],['seated',/seated/],['standing',/standing/],['lying',/lying|prone|supine/],
 ['bent',/bent[- ]over|bent-?over/],['front',/front/],['side',/side|lateral/],['rear',/rear|reverse fl|face pull/],['close',/close-?grip|narrow/],['wide',/wide/],['neutral',/hammer|neutral|palms?-in/],['under',/underhand|reverse grip|chin-?up|supinated/],['single',/one-?arm|one-?leg|single/]];
const ANG_KEY=['incline','decline','overhead','bent','front','side','rear','under'];
const ODD=/clean|snatch|jerk|jump|muscle up|rope climb|london|rocky|gironda|chair squat|sissy|body-up|bottoms|kipping|bradford|anti-gravity|halo|figure 8|pirate|car |atlas|keg|yoke|log lift|tire/i;
function exTags(x){const n=String(x.n||'').toLowerCase(),p=(PATTERNS.find(([,r])=>r.test(n))||['other'])[0],a=new Set(ANGLES.filter(([,r])=>r.test(n)).map(([k])=>k));
 if(p=='press'&&!['incline','decline','overhead'].some(k=>a.has(k))&&(x.mus||[])[0]=='chest')a.add('flat');return{p,a}}
const SKIP_CAT=new Set(['stretching','plyometrics','olympic weightlifting','strongman']);
/* kandidati: [{x,tier,why,score}] */
function swapOptions(orig){if(!LIB)return[];const o=libGet(orig.lib)||{n:orig.n,mus:orig.mus||[],mus2:orig.mus2||[],eq:'',cat:'strength'},T=exTags(o),m0=(o.mus||[])[0];if(!m0)return[];
 const key=k=>ANG_KEY.filter(a=>k.a.has(a)).sort().join(','),okey=key(T)+(T.a.has('flat')?'flat':'');
 const out=[];for(const y of LIB){if(y.id==o.id||SKIP_CAT.has(y.cat)&&y.cat!=o.cat)continue;if(o.cat=='cardio'?y.cat!='cardio':y.cat=='cardio')continue;
  if(!(y.mus||[]).includes(m0))continue;const Y=exTags(y),sameAng=key(Y)+(Y.a.has('flat')?'flat':'')==okey;
  let tier=0,why='';
  if(o.cat=='cardio'){tier=1;why='Druga kardio sprava'}
  else if(Y.p==T.p&&sameAng&&(y.mus||[])[0]==m0){tier=1;why=y.eq!=o.eq?'Isti pokret i kut · '+(EQ[y.eq]||y.eq):'Isti pokret i kut · varijanta'}
  else if(sameAng&&(!o.force||y.force==o.force)&&(!o.mech||y.mech==o.mech)&&(y.mus||[])[0]==m0){tier=2;why='Isti mišići i kut · '+(EQ[y.eq]||y.eq)}
  const dir=a=>['front','side','rear'].filter(k=>a.has(k)).join();
  if(!tier&&Y.p==T.p&&Y.p!='other'&&(y.mus||[])[0]==m0&&dir(Y.a)==dir(T.a)){tier=3;why='Isti pokret, drugi kut · '+(EQ[y.eq]||y.eq)}
  if(!tier)continue;
  const odd=ODD.test(y.n)&&!ODD.test(o.n||'');if(odd&&tier==2)continue;
  let sc=(odd?-6:0)+(y.lvl=='expert'?-4:y.lvl=='beginner'?1:0)+(y.eq!=o.eq?3:0)+((y.mus2||[]).filter(z=>(o.mus2||[]).includes(z)).length)+(y.mech==o.mech?1:0)+(Y.a.has('single')==T.a.has('single')?1:0)+(y.cat==o.cat?1:0)-(/with (bands|chains)|board|pin|reverse band|speed/i.test(y.n)?4:0);
  out.push({x:y,tier,why,score:sc})}
 out.sort((a,b)=>a.tier-b.tier||b.score-a.score);const keep=out.filter(c=>c.score>-2);out.length=0;out.push(...keep);
 /* najviše 4 po razini, bez ponavljanja iste opreme na vrhu prve razine */
 const res=[];[1,2,3].forEach(t=>{if(t==3&&res.length>=5)return;const seen={};out.filter(c=>c.tier==t).forEach(c=>{if(res.filter(r=>r.tier==t).length>=4)return;const k=c.x.eq;if(t==1&&seen[k]>=2)return;seen[k]=(seen[k]||0)+1;res.push(c)})});
 return res}

/* ---------- u treningu ---------- */
/* izmjena = zamijenjena vježba ili premještena vježba/superset (superset se broji kao jedna) */
const swBudget=dr=>Math.max(1,Math.round(dr.ex.length*SW_SHARE)),swUsed=dr=>{const g=new Set();dr.ex.forEach(e=>{if(e.swapFrom)g.add('s'+e.id);if(e.moved)g.add('m'+(e.ss||e.id))});return g.size};
async function swapM(ei){const dr=getDr(),e=dr.ex[ei];if(!e)return;
 if(e.type=='cardio'?e.cardio.ok:e.sets.some(x=>x.ok)){toast('Vježba je već započeta, zamjena je moguća samo prije prve serije.');return}
 const used=swUsed(dr),max=swBudget(dr),left=max-used;
 const o=sheet(`<div class="stack">${sheetHd('Nema sprave?')}<p class="s mute">${esc(exName(e))}</p><div class="empty">Tražim zamjene…</div></div>`);
 try{await loadLib()}catch(x){o.querySelector('.empty').textContent='Baza vježbi se ne može učitati bez interneta. Možeš je odraditi kasnije.'}
 const opts=swapOptions(e),t1=opts.filter(c=>c.tier==1),t2=opts.filter(c=>c.tier==2),t3=opts.filter(c=>c.tier==3),notLast=dr.ex.slice(ei+1).some(y=>y.type=='cardio'?!y.cardio.ok:y.sets.some(z=>!z.ok));
 const item=c=>`<button class="tap" data-sw="${esc(c.x.id)}">${thumb(c.x.id)}<div style="flex:1;min-width:0"><div class="b s ell">${esc(libN(c.x))}</div><div class="xs mute ell">${esc(c.why)}</div></div><span class="btn sm">Zamijeni</span></button>`;
 o.querySelector('.sheet').innerHTML=`<div class="stack">${sheetHd('Nema sprave?')}
<div class="between"><p class="s mute" style="min-width:0">${esc(exName(e))}${e.swapFrom?` · <span class="xs">zamjena za ${esc(exName({lib:e.swapFrom.lib,n:e.swapFrom.n}))}</span>`:''}</p><span class="chip ${left>0?'':'bad'}">izmjene ${used}/${max}</span></div>
${left<=0&&!e.swapFrom?`<div class="card flat" style="padding:12px;border-color:var(--warn)"><p class="s">Iskoristio si sve izmjene za ovaj trening (${max}). Trening treba ostati onakav kakav je trener složio. Ako baš ne ide, odradi što možeš i javi treneru u bilješci.</p></div>`:`
${notLast&&!e.moved&&left>0?`<button class="card tap" data-later>${I('clock')}<div style="flex:1"><div class="b">Sprava je zauzeta, odradi kasnije</div><p class="xs mute">Vježba ide na kraj treninga, ostalo ostaje isto.</p></div>${I('chev','sm')}</button>`:''}
<div><div class="kick" style="margin-bottom:8px">Najbliža zamjena · isti pokret i kut</div>${t1.length?`<div class="list">${t1.map(item).join('')}</div>`:'<p class="s mute">Nema iste vježbe s drugom opremom.</p>'}</div>
${t2.length?`<div><div class="kick" style="margin-bottom:8px">Ako ni to ne ide · isti mišići, isti kut</div><div class="list">${t2.map(item).join('')}</div></div>`:''}
${t3.length?`<div><div class="kick" style="margin-bottom:8px">Zadnja opcija · isti pokret, drugi kut</div><div class="list">${t3.map(item).join('')}</div></div>`:''}
${!t1.length&&!t2.length&&!t3.length?'<p class="s mute">Za ovu vježbu nema dobre zamjene u bazi. Odradi je kasnije ili javi treneru u bilješci.</p>':''}`}
${e.swapFrom||e.moved?`<button class="btn ghost sm" data-undo>${I('back','sm')} Vrati kako je trener složio</button>`:''}</div>`;
 o.querySelector('[data-x]').onclick=()=>close(o);
 const later=o.querySelector('[data-later]');if(later)later.onclick=()=>{close(o);postpone(ei)};
 const und=o.querySelector('[data-undo]');if(und)und.onclick=()=>{close(o);undoSwap(ei)};
 o.querySelectorAll('[data-sw]').forEach(b=>b.onclick=()=>{const y=LIB.byId[b.dataset.sw];close(o);doSwap(ei,y,opts.find(c=>c.x.id==y.id))})}
function groupIdx(dr,ei){const e=dr.ex[ei];return e.ss?dr.ex.map((y,i)=>y.ss==e.ss?i:-1).filter(i=>i>=0):[ei]}
function postpone(ei){upd(d=>{const g=groupIdx(d,ei),moved=g.map(i=>d.ex[i]);moved.forEach(x=>x.moved=true);d.ex=d.ex.filter((_,i)=>!g.includes(i)).concat(moved)});toast('Premješteno na kraj treninga.');keepScroll(workoutView)}
function doSwap(ei,y,c){const dr=getDr(),e=dr.ex[ei],day=(PROG.days||[]).find(x=>x.id==dr.dayId)||{};
 const def={id:e.id,lib:y.id,n:y.n,hr:y.hr,type:e.type=='cardio'?'cardio':e.type,s:e.sets.length||1,r:e.r,t:e.tgt&&e.tgt.t,cmin:e.tgt&&e.tgt.cmin,rest:e.rest,inc:2.5,bw:y.eq=='body only',mus:y.mus,mus2:y.mus2,rule:''};
 const t=target(def,day),n=Math.max(1,def.s);
 upd(d=>{const o=d.ex[ei],from=o.swapFrom||{lib:o.lib,n:o.n,custom:o.custom,v:o.v,note:o.note,mus:o.mus,mus2:o.mus2,bw:o.bw};
  d.ex[ei]={...o,lib:y.id,n:y.n,hr:y.hr,custom:false,mus:y.mus||[],mus2:y.mus2||[],bw:def.bw,v:'',note:'',tgt:t,swapFrom:from,swapWhy:c?c.why:'',
   sets:o.type=='cardio'?[]:Array.from({length:n},(_,i)=>({kg:t.kg===''?'':t.kg,r:'',t:'',e:'',ok:false,tr:t.reps[i]||'',tt:t.t})),cardio:o.type=='cardio'?{min:'',kmh:t.kmh||'',km:'',ok:false}:null}});
 toast('Zamijenjeno: '+libN(y));keepScroll(workoutView)}
function undoSwap(ei){const dr=getDr(),e=dr.ex[ei];if(e.swapFrom){const f=e.swapFrom,day=(PROG.days||[]).find(x=>x.id==dr.dayId)||{},def={...e,lib:f.lib,n:f.n,custom:f.custom,bw:f.bw,mus:f.mus,mus2:f.mus2,rule:''},t=target(def,day);
  upd(d=>{const o=d.ex[ei];d.ex[ei]={...o,lib:f.lib,n:f.n,custom:f.custom,v:f.v,note:f.note,mus:f.mus,mus2:f.mus2,bw:f.bw,tgt:t,swapFrom:null,swapWhy:'',sets:o.type=='cardio'?[]:o.sets.map((s,i)=>({...s,kg:t.kg===''?'':t.kg,tr:t.reps[i]||'',r:'',ok:false})),cardio:o.cardio}})}
 else upd(d=>{d.ex[ei].moved=false});toast('Vraćeno.');keepScroll(workoutView)}
