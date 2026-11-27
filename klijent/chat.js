/* ============ PORUKE: chat klijent ↔ trener (push obavijest primatelju) ============ */
let UNREAD=0;const UNREAD_BY={};
const CHAT={
 async list(cid){if(DEMO)return LS.get('kfitk-demo-chat-'+cid,[]);const{data,error}=await SB.from('kfit_msgs').select('id,from_coach,body,created_at,read_at').eq('client_id',cid).order('created_at',{ascending:true}).limit(300);if(error)throw error;return data},
 async send(cid,body){const coach=ROLE=='coach';if(DEMO){const L=LS.get('kfitk-demo-chat-'+cid,[]);L.push({id:Date.now(),from_coach:coach,body,created_at:new Date().toISOString(),read_at:null});LS.set('kfitk-demo-chat-'+cid,L);return}
  const{error}=await SB.from('kfit_msgs').insert({client_id:cid,from_coach:coach,body});if(error)throw error},
 async read(cid){if(DEMO){const L=LS.get('kfitk-demo-chat-'+cid,[]);L.forEach(m=>{if(m.from_coach!=(ROLE=='coach'))m.read_at=m.read_at||new Date().toISOString()});LS.set('kfitk-demo-chat-'+cid,L);return}await SB.rpc('kfit_msgs_read',{cid})},
 async unread(){if(DEMO)return[];const coach=ROLE=='coach';const{data,error}=await SB.from('kfit_msgs').select('client_id').is('read_at',null).eq('from_coach',!coach).limit(500);return error?[]:data}};
async function chatRefresh(){if(!(ROLE=='client'&&CID||ROLE=='coach'))return;try{const U=await CHAT.unread();Object.keys(UNREAD_BY).forEach(k=>delete UNREAD_BY[k]);U.forEach(x=>UNREAD_BY[x.client_id]=(UNREAD_BY[x.client_id]||0)+1);UNREAD=U.length;chatBadge()}catch(e){}}
function chatBadge(){const b=$('#chatbtn');if(!b)return;const n=ROLE=='coach'?UNREAD:UNREAD;b.querySelector('.cnt')?.remove();if(n)b.insertAdjacentHTML('beforeend',`<span class="cnt">${n>9?'9+':n}</span>`)}
function chatBtn(){if(!(ROLE=='client'||ROLE=='coach'))return'';return `<button id="chatbtn" class="btn sm icon ghost" aria-label="Poruke" onclick="${ROLE=='coach'?'coachInbox()':'chatM(CID)'}">${I('msg')}</button>`}
const chatTime=t=>{const d=new Date(t),td=today(),ds=d.toLocaleDateString('sv'),hm=d.toLocaleTimeString('hr-HR',{hour:'2-digit',minute:'2-digit'});return ds==td?hm:fmt(ds)+' '+hm};
let CHATO=null;
async function chatM(cid,title){if(!cid)return;const coach=ROLE=='coach';
 const o=sheet(`<div class="chatw">${sheetHd(title||(coach?'Poruke':'Poruke treneru'))}<div class="chatl" id="chl"><p class="xs mute" style="text-align:center">Učitavanje…</p></div>
<form class="chatf" id="chf"><textarea class="inp" id="cht" rows="1" maxlength="4000" placeholder="${coach?'Napiši poruku klijentu…':'Napiši treneru: pitanje, problem, kako je prošao trening…'}"></textarea><button class="btn acc icon" aria-label="Pošalji">${I('send')}</button></form></div>`);
 o.classList.add('chat-ov');CHATO={o,cid};o._onclose=()=>{CHATO=null;chatRefresh()};
 const l=o.querySelector('#chl'),ta=o.querySelector('#cht');
 const draw=async()=>{let L=[];try{L=await CHAT.list(cid)}catch(e){l.innerHTML='<p class="s" style="color:var(--bad)">Poruke se ne mogu učitati.</p>';return}
  l.innerHTML=L.length?L.map(m=>{const mine=m.from_coach==coach;return `<div class="msg ${mine?'me':'them'}"><div class="bub">${esc(m.body).replace(/\n/g,'<br>')}</div><div class="mt">${chatTime(m.created_at)}${mine&&m.read_at?' · pročitano':''}</div></div>`}).join(''):`<div class="empty" style="padding:18px 6px">${coach?'Još nema poruka. Napiši klijentu prvi.':'Ovdje pišeš treneru kad imaš pitanje ili problem. Trener dobiva obavijest i odgovara ti ovdje.'}</div>`;
  l.scrollTop=l.scrollHeight;try{await CHAT.read(cid)}catch(e){}};
 ta.oninput=()=>{ta.style.height='auto';ta.style.height=Math.min(140,ta.scrollHeight)+'px'};
 o.querySelector('#chf').onsubmit=async e=>{e.preventDefault();const t=ta.value.trim();if(!t)return;const b=e.target.querySelector('button');b.disabled=true;
  try{await CHAT.send(cid,t);ta.value='';ta.oninput();await draw()}catch(x){toast('Poruka nije poslana: '+(x.message||x))}b.disabled=false;ta.focus()};
 await draw();
 const iv=setInterval(()=>{if(!document.body.contains(o))return clearInterval(iv);if(!document.hidden)draw()},15000)}
/* trener: popis razgovora */
async function coachInbox(){const L=(COACH.list||[]).filter(c=>COACH.links&&COACH.links[c.id]);await chatRefresh();
 const rows=L.sort((a,b)=>(UNREAD_BY[b.id]||0)-(UNREAD_BY[a.id]||0)).map(c=>`<button class="row tap" style="width:100%;padding:12px 2px;gap:12px;border-bottom:1px solid var(--line);text-align:left" onclick="this.closest('.ov').remove();chatM('${c.id}','${esc((c.f+' '+(c.l||'')).trim()).replace(/'/g,'')}')"><div class="av">${esc((c.f||'?')[0])}${esc((c.l||'')[0]||'')}</div><div style="flex:1" class="b">${esc(c.f+' '+(c.l||''))}</div>${UNREAD_BY[c.id]?`<span class="chip acc">${UNREAD_BY[c.id]} nove</span>`:I('chev','sm')}</button>`).join('');
 sheet(`<div class="stack">${sheetHd('Poruke')}${rows||'<p class="s mute">Nijedan klijent još nema pristup aplikaciji.</p>'}</div>`)}
/* otvaranje iz obavijesti: #chat (klijent) ili #chat-<id> (trener) */
function chatFromHash(){const h=location.hash;if(!h.startsWith('#chat'))return;history.replaceState(null,'',location.pathname+location.search);
 if(ROLE=='client'&&CID)setTimeout(()=>chatM(CID),400);else if(ROLE=='coach'){const id=h.slice(6);setTimeout(()=>id?chatM(id,((COACH.list||[]).find(c=>c.id==id)||{}).f):coachInbox(),800)}}
addEventListener('visibilitychange',()=>{if(!document.hidden)chatRefresh()});
setInterval(()=>{if(!document.hidden)chatRefresh()},60000);
let CHATINIT=0;function chatInit(){chatBadge();if(CHATINIT||!(ROLE=='client'&&CID||ROLE=='coach'&&COACH.list))return;CHATINIT=1;chatRefresh();chatFromHash()}
addEventListener('load',()=>{const t=document.querySelector('#top .sp');if(t&&!document.querySelector('#chatbtn')&&(ROLE=='client'||ROLE=='coach'))t.insertAdjacentHTML('afterend',chatBtn());chatInit()});
