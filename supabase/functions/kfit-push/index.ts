// K-FIT: push obavijesti klijentima.
// Poziva ga pg_cron svaki sat (zaglavlje x-cron); klijent ga može pozvati sa svojom prijavom za probnu obavijest ({test:true}).
import webpush from 'npm:web-push@3.6.7';

const URL_ = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const APP = 'https://kosulja.github.io/K-FIT/klijent/';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };

const q = async (p: string) => { const r = await fetch(`${URL_}/rest/v1/${p}`, { headers: H }); if (!r.ok) throw new Error(await r.text()); return await r.json(); };
const rpc = async (f: string, body: unknown) => { const r = await fetch(`${URL_}/rest/v1/rpc/${f}`, { method: 'POST', headers: H, body: JSON.stringify(body) }); return r.ok ? await r.json() : null; };
const addD = (d: string, n: number) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5);

function zagreb() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zagreb', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false, weekday: 'short' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  const today = `${p.year}-${p.month}-${p.day}`, wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday);
  return { today, hour: +p.hour % 24, wd, mon: addD(today, -wd) };
}

function plannedOn(day: string, prog: any, logs: any[]) {
  const wdi = (new Date(day + 'T12:00:00Z').getUTCDay() + 6) % 7, mon = addD(day, -wdi);
  const plan = prog.lockPlan ? null : logs.find((l) => l.id === 'plan-' + mon)?.data?.wd;
  const mv = logs.find((l) => l.id === 'move-' + mon)?.data?.map || {};
  const out: any[] = [];
  for (const d of prog.days || []) {
    const wds: number[] = plan ? (plan[d.id] || []) : (d.wd || []);
    for (const i of wds) { const orig = addD(mon, i), to = mv[orig + '|' + d.id]; if (to === 'skip') continue; if ((to || orig) === day) out.push(d); }
  }
  for (const k of Object.keys(mv)) { const [orig, id] = k.split('|'); if (mv[k] === day && orig !== day) { const d = (prog.days || []).find((x: any) => x.id === id); if (d && !out.includes(d)) out.push(d); } }
  return out;
}

async function send(subs: any[], msg: { title: string; body: string; tag: string; url?: string }) {
  let n = 0;
  for (const s of subs) {
    try { await webpush.sendNotification(s.sub, JSON.stringify({ url: APP, ...msg }), { TTL: 3600 }); n++; }
    catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await fetch(`${URL_}/rest/v1/kfit_push?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: 'DELETE', headers: H }); }
  }
  return n;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const S = Object.fromEntries((await q('kfit_secrets?select=k,v')).map((x: any) => [x.k, x.v]));
    webpush.setVapidDetails('mailto:domo.kosuljandic98@gmail.com', S.vapid_public, S.vapid_private);
    const body = await req.json().catch(() => ({}));

    // probna obavijest: klijent sa svojom prijavom
    if (body.test) {
      const u = await fetch(`${URL_}/auth/v1/user`, { headers: { apikey: KEY, Authorization: req.headers.get('authorization') || '' } });
      if (!u.ok) return new Response('Nisi prijavljen.', { status: 401, headers: CORS });
      const uid = (await u.json()).id, L = await q(`kfit_links?user_id=eq.${uid}&select=client_id`), Co = await q(`kfit_coaches?user_id=eq.${uid}&select=user_id`);
      const cid = Co.length ? '__coach' : L[0]?.client_id;
      if (!cid) return new Response('Nema klijenta.', { status: 404, headers: CORS });
      const subs = await q(`kfit_push?client_id=eq.${encodeURIComponent(cid)}&select=endpoint,sub`);
      const n = await send(subs, { title: 'K-FIT', body: 'Obavijesti rade. Javit ćemo ti se kad nešto bude važno.', tag: 'test' });
      return new Response(JSON.stringify({ sent: n }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    if (req.headers.get('x-cron') !== S.cron) return new Response('Zabranjeno.', { status: 403 });

    // nova poruka u chatu → obavijest primatelju
    if (body.msg) {
      const M = await q(`kfit_msgs?id=eq.${+body.msg}&select=client_id,from_coach,body`);
      if (!M.length) return new Response('{}');
      const m = M[0], txt = String(m.body).replace(/\s+/g, ' ').slice(0, 140);
      let subs: any[], title: string;
      if (m.from_coach) { subs = await q(`kfit_push?client_id=eq.${encodeURIComponent(m.client_id)}&select=endpoint,sub`); title = 'Poruka od trenera'; }
      else { subs = await q('kfit_push?client_id=eq.__coach&select=endpoint,sub'); const C = await q(`kdocs?col=eq.clients&id=eq.${encodeURIComponent(m.client_id)}&select=data`); const d = C[0]?.data || {}; title = `Poruka: ${[d.f, d.l].filter(Boolean).join(' ') || 'klijent'}`; }
      const n = await send(subs, { title, body: txt, tag: 'chat-' + m.client_id, url: APP + (m.from_coach ? '#chat' : '#chat-' + m.client_id) } as any);
      return new Response(JSON.stringify({ sent: n }), { headers: { 'Content-Type': 'application/json' } });
    }
    const Z = zagreb(), force = body.hour != null ? +body.hour : Z.hour;
    const subs = await q('kfit_push?select=endpoint,client_id,sub');
    const byC: Record<string, any[]> = {};
    subs.forEach((s: any) => (byC[s.client_id] ||= []).push(s));
    let sent = 0;
    for (const cid of Object.keys(byC)) {
      const until = await rpc('kfit_until', { cid });
      if (!until) continue; // paket istekao: bez obavijesti
      const [P, logs] = await Promise.all([
        q(`kfit_programs?client_id=eq.${encodeURIComponent(cid)}&select=data`),
        q(`kfit_logs?client_id=eq.${encodeURIComponent(cid)}&day=gte.${addD(Z.mon, -7)}&day=lte.${addD(Z.mon, 13)}&select=id,kind,day,data`),
      ]);
      const prog = P[0]?.data || {}, t = Z.today;
      const doneToday = logs.some((l: any) => l.kind === 'workout' && l.day === t);
      const plan = plannedOn(t, prog, logs), ptx = plan[0]?.name;
      const msgs: { title: string; body: string; tag: string }[] = [];

      if (force === 9 && ptx && !doneToday) msgs.push({ title: 'Danas je trening', body: `${ptx}. Sretno, javi kako je prošlo!`, tag: 'trening' });
      if (force === 18) {
        const water = +(logs.find((l: any) => l.kind === 'water' && l.day === t)?.data?.ml || 0), steps = logs.find((l: any) => l.kind === 'steps' && l.day === t);
        const food = logs.find((l: any) => l.kind === 'food' && l.day === t), hasFood = ['kT', 'pT', 'kR', 'pR'].some((k) => +prog[k] > 0);
        const miss = [prog.water && water < +prog.water ? 'vodu' : '', prog.steps && !steps ? 'korake' : '', hasFood && !food ? 'prehranu' : ''].filter(Boolean);
        const list = miss.length > 1 ? miss.slice(0, -1).join(', ') + ' i ' + miss[miss.length - 1] : miss[0];
        if (ptx && !doneToday) msgs.push({ title: 'Trening te još čeka', body: `${ptx} je danas na planu.${list ? ' Upiši i ' + list + '.' : ''}`, tag: 'vecer' });
        else if (list) msgs.push({ title: 'Kasniš s unosom', body: `Još nisi upisao ${list} za danas. Treba ti pola minute.`, tag: 'vecer' });
      }
      if (force === 10 && Z.wd === 6 && !prog.lockPlan && (prog.days || []).length && !logs.some((l: any) => l.id === 'plan-' + addD(Z.mon, 7)))
        msgs.push({ title: 'Isplaniraj tjedan', body: 'Odaberi dane za treninge sljedeći tjedan. Traje 20 sekundi.', tag: 'plan' });
      if (force === 10) { const d = daysBetween(t, until); if (d === 7 || d === 1) msgs.push({ title: d === 1 ? 'Paket ističe sutra' : 'Paket ističe za tjedan dana', body: 'Za nastavak suradnje javi se treneru.', tag: 'paket' }); }

      for (const m of msgs) sent += await send(byC[cid], m);
    }
    return new Response(JSON.stringify({ hour: force, clients: Object.keys(byC).length, sent }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response('Greška: ' + (e as Error).message, { status: 500, headers: CORS });
  }
});
