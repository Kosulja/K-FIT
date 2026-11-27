// K-FIT: kalendar klijenta (iCal pretplata za Apple i Google kalendar)
// Pristup samo uz tajni token klijenta (?t=...). Vraća planirane treninge i nedjeljni podsjetnik za planiranje.
const URL_ = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP = 'https://kosulja.github.io/K-FIT/klijent/';

async function q(path: string) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(await r.text());
  return await r.json();
}
const pad = (n: number) => String(n).padStart(2, '0');
const addD = (d: string, n: number) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const esc = (s: string) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const fold = (l: string) => { const o: string[] = []; let s = l; const len = (x: string) => new TextEncoder().encode(x).length; while (len(s) > 73) { let i = 73; while (len(s.slice(0, i)) > 73) i--; o.push(s.slice(0, i)); s = ' ' + s.slice(i); } o.push(s); return o.join('\r\n'); };
const dt = (d: string, hm: string, addMin = 0) => { const [h, m] = (hm || '18:00').split(':').map(Number); let t = h * 60 + m + addMin, day = d; while (t >= 1440) { t -= 1440; day = addD(day, 1); } return day.replace(/-/g, '') + 'T' + pad(Math.floor(t / 60)) + pad(t % 60) + '00'; };
const TZ = ['BEGIN:VTIMEZONE', 'TZID:Europe/Zagreb', 'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT', 'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD', 'END:VTIMEZONE'];

Deno.serve(async (req) => {
  try {
    const t = new URL(req.url).searchParams.get('t') || '';
    if (!/^[a-f0-9]{32,48}$/.test(t)) return new Response('Neispravan link.', { status: 404 });
    const L = await q(`kfit_links?cal_token=eq.${t}&select=client_id`);
    if (!L.length) return new Response('Neispravan link.', { status: 404 });
    const cid = L[0].client_id;
    const today = new Date().toISOString().slice(0, 10), from = addD(today, -21), to = addD(today, 70);
    const [P, logs] = await Promise.all([
      q(`kfit_programs?client_id=eq.${encodeURIComponent(cid)}&select=data`),
      q(`kfit_logs?client_id=eq.${encodeURIComponent(cid)}&kind=in.(plan,move)&day=gte.${from}&day=lte.${to}&select=id,kind,day,data`),
    ]);
    const days: any[] = (P[0]?.data?.days) || [];
    const name = (id: string) => (days.find((d) => d.id === id) || {}).name || 'Trening';
    const exN = (id: string) => ((days.find((d) => d.id === id) || {}).ex || []).length;
    const ev: string[] = [];
    const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    for (const r of logs.filter((x: any) => x.kind === 'plan')) {
      const mon = r.day, tm = r.data?.tm || '18:00', wd = r.data?.wd || {};
      const mv = (logs.find((x: any) => x.id === 'move-' + mon)?.data?.map) || {};
      for (const id of Object.keys(wd)) for (const i of wd[id] || []) {
        const orig = addD(mon, i), k = orig + '|' + id, m = mv[k];
        if (m === 'skip') continue;
        const d = m || orig, dur = Math.max(45, Math.min(120, exN(id) * 10 + 15));
        ev.push('BEGIN:VEVENT', `UID:kfit-${cid}-${orig}-${id}@k-fit`, `DTSTAMP:${stamp}`, `DTSTART;TZID=Europe/Zagreb:${dt(d, tm)}`, `DTEND;TZID=Europe/Zagreb:${dt(d, tm, dur)}`,
          fold(`SUMMARY:${esc('K-FIT: ' + name(id))}`), fold(`DESCRIPTION:${esc('Otvori trening u aplikaciji: ' + APP)}`), `URL:${APP}`,
          'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-PT1H', fold(`DESCRIPTION:${esc('Za sat vremena: ' + name(id))}`), 'END:VALARM', 'END:VEVENT');
      }
    }
    // nedjeljni podsjetnik za planiranje (10:00)
    let sun = today; while (new Date(sun + 'T12:00:00Z').getUTCDay() !== 0) sun = addD(sun, 1);
    ev.push('BEGIN:VEVENT', `UID:kfit-${cid}-planiranje@k-fit`, `DTSTAMP:${stamp}`, `DTSTART;TZID=Europe/Zagreb:${dt(sun, '10:00')}`, `DTEND;TZID=Europe/Zagreb:${dt(sun, '10:00', 15)}`, 'RRULE:FREQ=WEEKLY;BYDAY=SU',
      fold(`SUMMARY:${esc('K-FIT: isplaniraj tjedan')}`), fold(`DESCRIPTION:${esc('Odaberi dane za treninge ovaj tjedan: ' + APP)}`), `URL:${APP}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT0M', 'DESCRIPTION:Isplaniraj treninge za tjedan', 'END:VALARM', 'END:VEVENT');
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//K-FIT//Treninzi//HR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:K-FIT treninzi', 'X-WR-TIMEZONE:Europe/Zagreb', 'REFRESH-INTERVAL;VALUE=DURATION:PT2H', 'X-PUBLISHED-TTL:PT2H', ...TZ, ...ev, 'END:VCALENDAR'].join('\r\n') + '\r\n';
    return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'inline; filename="k-fit.ics"', 'Cache-Control': 'no-cache' } });
  } catch (_e) {
    return new Response('Greška kalendara.', { status: 500 });
  }
});
