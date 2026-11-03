/* ============ K-FIT KLIJENT — upitnik pri prvoj prijavi ============
   Klijent ga ispunjava jednom, prije ulaska u aplikaciju.
   Baza (kfit_onboard) od odgovora kreira novog klijenta u K-FIT evidenciji
   ili dopuni postojećeg (ako mu je trener već upisao email). */
const ALC=['Ne pijem','Rijetko (par puta mjesečno)','Vikendom','Više puta tjedno','Svaki dan'];
const TPW=['0','1','2','3','4','5','6+'];
const QF=[
 ['O tebi',[['f','Ime','text',1],['l','Prezime','text',1],['em','Email','email'],['tel','Broj telefona','tel',1],['bd','Datum rođenja','date',1],['loc','Lokacija / mjesto prebivališta','text',1]]],
 ['Tijelo i cilj',[['age','Dob','age'],['h','Visina (cm)','num',1],['kg','Težina (kg)','num',1],['goal','Cilj','area',1,'Npr. skinuti 8 kg do ljeta, ojačati leđa, pripremiti se za utrku…'],['inj','Imaš li kakve ozljede ili ograničenja?','area',0,'Npr. operirano koljeno, bol u donjim leđima… Ako nemaš, napiši „nemam”.']]],
 ['Mjere',[['waist','Struk (cm)','num'],['belly','Trbuh (cm)','num'],['hips','Bokovi (cm)','num'],['thigh','Bedro (cm)','num'],['arm','Ruka (cm)','num']],'Mjeri ujutro, prije doručka. Metar drži ravno i ne stišći. <b>Struk</b> – najuži dio trupa · <b>Trbuh</b> – u visini pupka · <b>Bokovi</b> – najširi dio stražnjice · <b>Bedro</b> – najširi dio desne noge · <b>Ruka</b> – sredina desne nadlaktice, opuštena. Nemaš metar? Ostavi prazno i pošalji kasnije.'],
 ['Prehrana i navike',[['meals','Koliko obroka dnevno jedeš?','num',1],['kcal','Koliko kalorija dnevno, otprilike?','num',0,'Ako ne znaš, ostavi prazno'],['sup','Suplementi, lijekovi ili sl.','area',0,'Npr. protein, kreatin, vitamin D…'],['alc','Piješ li alkohol, koliko često?','pick',1,ALC],['sleep','Koliko sati spavaš?','num',1],['stress','Razina stresa (1–10)','scale',1]]],
 ['Kretanje i trening',[['steps','Koliko se krećeš u danu (koraci, otprilike)?','num',0,'Mobitel to obično broji sam'],['tpw','Koliko treninga tjedno možeš?','pick',1,TPW]]]];
const PH=[['front','Sprijeda'],['back','Straga'],['side','S boka']];
const MEAS=[['waist','struk'],['belly','trbuh'],['hips','bokovi'],['thigh','bedro'],['arm','ruka']];
const QL=Object.fromEntries(QF.flatMap(s=>s[1]).map(f=>[f[0],f[1]]));
const ageOf=bd=>{if(!bd)return'';const b=pd(bd),n=new Date();let a=n.getFullYear()-b.getFullYear();if(n.getMonth()<b.getMonth()||(n.getMonth()==b.getMonth()&&n.getDate()<b.getDate()))a--;return a>0&&a<110?a:''};
function qNote(q){const L=[`UPITNIK — prva prijava u aplikaciju (${fmt(today())}.)`,
 q.loc&&'Lokacija: '+q.loc,[q.age&&'Dob: '+q.age,q.h&&'Visina: '+q.h+' cm',q.kg&&'Težina: '+q.kg+' kg'].filter(Boolean).join(' · '),
 MEAS.some(([k])=>q[k])&&'Mjere: '+MEAS.filter(([k])=>q[k]).map(([k,l])=>l+' '+q[k]).join(' · ')+' cm',
 q.goal&&'Cilj: '+q.goal,'Ozljede / ograničenja: '+(q.inj||'—'),
 [q.meals&&'Obroka: '+q.meals+' dnevno',q.kcal&&'cca '+q.kcal+' kcal'].filter(Boolean).join(' · '),
 q.sup&&'Suplementi / lijekovi: '+q.sup,q.alc&&'Alkohol: '+q.alc,[q.sleep&&'San: '+q.sleep+' h',q.stress&&'Stres: '+q.stress+'/10'].filter(Boolean).join(' · '),
 q.steps&&'Koraci: cca '+q.steps+' dnevno',q.tpw&&'Treninga tjedno: '+q.tpw];return L.filter(Boolean).join('\n')}

function onboardView(o={}){const dr=LS.get('kfitk-q',{}),v={...(o.pre||{}),...dr,em:o.email||''};Object.keys(v).forEach(k=>v[k]==null&&delete v[k]);
 const fld=([k,l,t,req,x])=>{const lab=`${esc(l)}${req?' <span style="color:var(--acc)">*</span>':''}`,val=esc(v[k]??''),ph=t!='pick'&&x?` placeholder="${esc(x)}"`:'';
  if(t=='area')return `<label class="f"><span>${lab}</span><textarea class="inp" name="${k}"${ph}>${val}</textarea></label>`;
  if(t=='age')return `<label class="f"><span>${lab}</span><input class="inp" name="age" id="qage" readonly value="${esc(ageOf(v.bd))}" placeholder="automatski" tabindex="-1" style="color:var(--mute)"></label>`;
  if(t=='scale')return `<div class="f" style="display:grid;gap:5px"><span class="xs b mute">${lab}</span><div class="scale" data-k="${k}" style="flex-wrap:wrap">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button type="button" class="${v[k]==n?'on':''}" data-n="${n}" style="flex:1 0 calc(20% - 6px)">${n}</button>`).join('')}</div><div class="xs mute between"><span>1 = opušteno</span><span>10 = pod velikim stresom</span></div></div>`;
  if(t=='pick')return `<div class="f" style="display:grid;gap:5px"><span class="xs b mute">${lab}</span><div class="chips" data-k="${k}">${x.map(c=>`<button type="button" class="chip ${v[k]==c?'on':''}" data-n="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>`;
  return `<label class="f"><span>${lab}</span><input class="inp" name="${k}" type="${t=='num'?'text':t}"${t=='num'?' inputmode="decimal"':''}${k=='em'?' readonly style="color:var(--mute)"':''} value="${val}"${ph} ${t=='text'&&k=='f'?'autocomplete="given-name"':t=='text'&&k=='l'?'autocomplete="family-name"':t=='tel'?'autocomplete="tel"':''}></label>`};
 const pair=fs=>{const out=[];for(let i=0;i<fs.length;i++){const f=fs[i],n=fs[i+1],short=x=>x&&['text','tel','date','num','age','email'].includes(x[2])&&!['loc','em'].includes(x[0])&&!/Koliko|kalorija/.test(x[1]);
  if(short(f)&&short(n)){out.push(`<div class="grid2">${fld(f)}${fld(n)}</div>`);i++}else out.push(fld(f))}return out.join('')};
 shell(`<form id="qf" class="stack" novalidate><div><div class="kick" style="color:var(--acc)">Dobrodošao u K-FIT</div><h1 style="margin-top:6px">Prije početka</h1>
<p class="mute" style="margin-top:8px">Ovo je jednokratni upitnik. Treba ti oko 3 minute. Na temelju odgovora trener ti slaže program — što iskrenije, to bolje.</p></div>
${QF.map(([t,fs,intro],i)=>`<div class="card stack"><div class="between"><h3>${t}</h3><span class="xs mute">${i+1}/${QF.length+1}</span></div>${intro?`<p class="xs mute">${intro}</p>`:''}${pair(fs)}</div>`).join('')}
<div class="card stack" id="qph"><div class="between"><h3>Fotografije <span style="color:var(--acc)">*</span></h3><span class="xs mute">${QF.length+1}/${QF.length+1}</span></div>${PH_HINT}<div id="phs">${photoTiles(PHS)}</div></div>
<label class="card row s" style="align-items:flex-start;gap:12px"><input type="checkbox" name="ok" ${v.ok=='da'?'checked':''} style="width:20px;height:20px;margin-top:2px;flex:none;accent-color:var(--acc)"><span>Pristajem da trener koristi ove podatke, uključujući one o zdravlju, isključivo za izradu i praćenje mog programa. <span style="color:var(--acc)">*</span></span></label>
<div id="qerr" class="s" style="color:var(--bad)"></div>
<button class="btn acc full" id="qsend">${I('check')} Pošalji i uđi u aplikaciju</button>
<button type="button" class="btn ghost sm" onclick="${o.demo?'qDemoExit()':'logout()'}">${o.demo?I('back','sm')+' Natrag u demo':I('out','sm')+' Odjava'}</button></form>`);
 bindTiles($('#phs'),PHS);
 const f=$('#qf'),pick={};QF.flatMap(s=>s[1]).filter(x=>x[2]=='scale'||x[2]=='pick').forEach(x=>{if(v[x[0]]!=null)pick[x[0]]=String(v[x[0]])});
 const collect=()=>{const q={};QF.flatMap(s=>s[1]).forEach(([k,,t])=>{if(t=='scale'||t=='pick')q[k]=pick[k]||'';else if(f[k])q[k]=f[k].value.trim()});q.age=String(ageOf(q.bd)||'');['h','kg','meals','kcal','sleep','steps'].forEach(k=>{if(q[k])q[k]=q[k].replace(',','.')});q.ok=f.ok.checked?'da':'';return q};
 const keep=()=>{const q=collect();delete q.em;LS.set('kfitk-q',q)};
 f.querySelectorAll('[data-k]').forEach(g=>g.onclick=e=>{const b=e.target.closest('[data-n]');if(!b)return;g.querySelectorAll('[data-n]').forEach(x=>x.classList.toggle('on',x==b));pick[g.dataset.k]=b.dataset.n;keep()});
 f.oninput=()=>{const a=$('#qage');if(a)a.value=ageOf(f.bd.value);keep()};
 f.onsubmit=async e=>{e.preventDefault();const q=collect(),err=$('#qerr');
  const miss=QF.flatMap(s=>s[1]).filter(([k,,t,req])=>req&&t!='age'&&!q[k]).map(x=>x[1].replace(/\?$/,''));
  const bad=[['h',100,250,'visina'],['kg',30,300,'težina'],['sleep',2,14,'san'],['meals',1,12,'broj obroka']].filter(([k,a,b])=>q[k]&&!(num(q[k])>=a&&num(q[k])<=b)).map(x=>x[3]);
  f.querySelectorAll('.inp,[data-k]').forEach(x=>x.style.outline='');QF.flatMap(s=>s[1]).filter(([k,,t,req])=>req&&t!='age'&&!q[k]).forEach(([k])=>{const el=f.querySelector(`[name="${k}"],[data-k="${k}"]`);if(el)el.style.outline='2px solid var(--bad)'});
  if(miss.length){err.textContent='Nedostaje: '+miss.join(', ')+'.';const el=f.querySelector('[style*="var(--bad)"]');if(el)el.scrollIntoView({block:'center',behavior:'smooth'});return}
  if(bad.length){err.textContent='Provjeri: '+bad.join(', ')+' (broj izgleda neobično).';return}
  const mp=PH.filter(([k])=>!PHS[k]).map(x=>x[1].toLowerCase());if(mp.length){err.textContent='Dodaj fotografije: '+mp.join(', ')+'.';$('#qph').style.outline='2px solid var(--bad)';$('#qph').scrollIntoView({block:'center',behavior:'smooth'});return}
  if(q.ok!='da'){err.textContent='Za nastavak označi privolu na dnu.';return}
  const b=$('#qsend');b.disabled=true;err.textContent='';
  let r;try{r=await API.onboard({...q,txt:qNote(q)})}
  catch(x){console.error(x);err.textContent='Slanje nije uspjelo: '+(x.message||'provjeri internet')+'. Odgovori su sačuvani, pokušaj ponovno.';b.disabled=false;return}
  LS.del('kfitk-q');VIEW='home';CID=r.client_id;let okp=true;
  try{b.innerHTML='Šaljem fotografije…';await sendPhotos(PHS,'start')}catch(x){console.error(x);okp=false}
  toast(!okp?'Upitnik je poslan, ali fotografije nisu. Pošalji ih s početnog ekrana.':r&&r.new?'Hvala! Tvoj profil je kreiran.':'Hvala! Podaci su poslani treneru.',3600);enter()};
 scrollTo(0,0)}
const PHS={};
const PH_HINT=`<p class="xs mute">Tri slike cijelog tijela: sprijeda, straga i s boka. Uska odjeća ili kupaći, dobro svjetlo, mobitel u visini prsa. Slike vidi <b>samo trener</b> — služe za usporedbu napretka.</p>`;
function photoTiles(S){return `<div class="grid3">${PH.map(([k,l])=>`<label class="phtile ${S[k]?'has':''}" for="ph_${k}">${S[k]?`<img alt="${l}" src="${S[k].url}">`:`${I('body')}<span class="xs b">${l}</span><span class="xs mute">dodaj sliku</span>`}<input type="file" id="ph_${k}" accept="image/*" data-ph="${k}" hidden></label>`).join('')}</div>`}
function bindTiles(box,S){box.querySelectorAll('[data-ph]').forEach(i=>i.onchange=async()=>{const f=i.files[0];if(!f)return;const k=i.dataset.ph;try{const bl=await shrink(f);if(S[k])URL.revokeObjectURL(S[k].url);S[k]={blob:bl,url:URL.createObjectURL(bl)};box.innerHTML=photoTiles(S);bindTiles(box,S);const q=$('#qph');if(q)q.style.outline=''}catch(e){toast('Ta slika se ne može otvoriti. Probaj drugu (JPG ili PNG).')}})}
async function shrink(file,max=1600,q=.82){const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(file)});const s=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*s);c.height=Math.round(img.naturalHeight*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(img.src);const b=await new Promise(r=>c.toBlob(r,'image/jpeg',q));if(!b)throw new Error('slika');return b}
async function sendPhotos(S,set){const data={set};for(const[k]of PH){if(!S[k])continue;data[k]=await API.uploadPhoto(CID,`${set}-${k}-${Date.now()}.jpg`,S[k].blob)}await put({id:'photos-'+set+(set=='start'?'':'-'+today()),kind:'photos',day:today(),data});PH.forEach(([k])=>{if(S[k]){URL.revokeObjectURL(S[k].url);delete S[k]}})}
/* — početni ekran: podsjetnik ako slike nisu stigle — */
function photosCard(){if(byKind('photos').length)return'';return `<button class="card tap" onclick="photosM()">${I('body')}<div style="flex:1"><div class="b">Pošalji početne fotografije</div><p class="s mute">Sprijeda, straga i s boka — trener ih treba za usporedbu napretka</p></div>${I('chev')}</button>`}
function photosM(set='start'){const S={};const o=sheet(`<div class="stack">${sheetHd(set=='start'?'Početne fotografije':'Nove fotografije napretka')}${PH_HINT}<div id="phm">${photoTiles(S)}</div><div id="pherr" class="s" style="color:var(--bad)"></div><button class="btn acc" id="phsend">${I('check')} Pošalji treneru</button></div>`);
 bindTiles(o.querySelector('#phm'),S);o.querySelector('#phsend').onclick=async e=>{const mp=PH.filter(([k])=>!S[k]).map(x=>x[1].toLowerCase());if(mp.length){o.querySelector('#pherr').textContent='Dodaj još: '+mp.join(', ')+'.';return}e.target.disabled=true;e.target.textContent='Šaljem…';
  try{await sendPhotos(S,set);close(o);toast('Fotografije poslane treneru.');keepScroll(render)}catch(x){console.error(x);o.querySelector('#pherr').textContent='Slanje nije uspjelo — provjeri internet i pokušaj ponovno.';e.target.disabled=false;e.target.innerHTML=I('check')+' Pošalji treneru'}}}
/* — trener: prikaz fotografija — */
function photosBlock(L){const P=byKind('photos',L).sort((a,b)=>b.day.localeCompare(a.day));if(!P.length)return `<div class="card"><h3>Fotografije</h3><p class="s mute" style="margin-top:6px">Klijent još nije poslao fotografije.</p></div>`;
 after(()=>$$('img[data-path]').forEach(async im=>{try{im.src=await API.photoUrl(im.dataset.path)}catch(e){im.alt='Slika se ne može učitati'}}));
 return P.map(r=>`<div class="card stack"><div class="between"><h3>Fotografije${r.data.set=='start'?' · početak':''}</h3><span class="xs mute">${fmt(r.day)}</span></div><div class="grid3">${PH.filter(([k])=>r.data[k]).map(([k,l])=>`<button class="phtile has" onclick="photoBig(this)" aria-label="${l}"><img alt="${l}" data-path="${esc(r.data[k])}"><span class="cap">${l}</span></button>`).join('')}</div></div>`).join('')}
function photoBig(b){const im=b.querySelector('img');if(!im||!im.src)return;sheet(`<div class="stack">${sheetHd(esc(im.alt))}<img src="${im.src}" alt="${esc(im.alt)}" style="width:100%;border-radius:12px;max-height:75vh;object-fit:contain;background:#000"></div>`)}
function qDemoExit(){LS.del('kfitk-q');DROLE='client';enter()}

/* — trener: pregled upitnika — */
function upitnikView(c){const q=c&&c.upitnik;if(!q)return photosBlock(COACH.logs)+ `<div class="card empty">${esc(c&&c.f||'Klijent')} još nije ispunio upitnik. Ispunjava ga pri prvoj prijavi u aplikaciju.</div>`;
 return `<div class="card stack"><div class="between"><h3>Upitnik</h3><span class="xs mute">${q.ts?fmt(q.ts.slice(0,10)):''}</span></div>${QF.map(([t,fs])=>`<div><div class="kick" style="margin-bottom:6px">${t}</div><div class="list">${fs.filter(([k])=>k!='ok').map(([k,l,t2])=>`<div class="between" style="align-items:flex-start"><span class="s mute" style="flex:0 0 45%">${esc(l.replace(/\?$/,'').replace(/ \((cm|kg)\)$/,''))}</span><span class="s b" style="text-align:right;white-space:pre-wrap;min-width:0">${esc(q[k]?(k=='bd'?fmt(q[k]):k=='kg'||k=='sleep'?n1(q[k]):q[k])+(k=='h'?' cm':k=='kg'?' kg':k=='sleep'?' h':k=='stress'?' / 10':MEAS.some(m=>m[0]==k)?' cm':''):'—')}</span></div>`).join('')}</div></div>`).join('')}</div>${photosBlock(COACH.logs)}`}
