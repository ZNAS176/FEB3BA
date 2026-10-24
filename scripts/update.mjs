// Actualiza data.json con las actas finales del grupo B-A de Tercera FEB.
// Node 20+. Sin dependencias. Uso: node scripts/update.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FIRST = 2537025, FROM = 2537015, TO = 2537260; // rango de ids a explorar (7 partidos por jornada)
const FILE = new URL('../data.json', import.meta.url);
const UA = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36', 'Accept-Language': 'es-ES,es;q=0.9' };

const old = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : { games: [] };
const have = new Map(old.games.map((g) => [g.i, g]));

async function token(id) {
  const r = await fetch(`https://baloncestoenvivo.feb.es/partido/${id}`, { headers: UA });
  if (!r.ok) throw new Error(`página ${id}: HTTP ${r.status}`);
  const m = (await r.text()).match(/id="_ctl0_token"[^>]*value="([^"]+)"/);
  return m && m[1];
}
async function api(id, tk) {
  const r = await fetch(`https://intrafeb.feb.es/LiveStats.API/api/v1/BoxScore/${id}`, { headers: { ...UA, Authorization: `Bearer ${tk}`, Accept: 'application/json' } });
  if (r.status === 204 || r.status === 404) return null;
  if (!r.ok) throw new Error(`API ${id}: HTTP ${r.status}`);
  return r.json();
}
const num = (x) => Number(x) || 0;
const clean = (s) => String(s).replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
const arr = (x) => (Array.isArray(x) ? x : x == null ? [] : [x]);

function parseDate(s) { // "04-10-2026 - 12:00"
  const m = /(\d{2})-(\d{2})-(\d{4})/.exec(s || '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}
function side(team, hdr) {
  const T = team.TOTAL || {};
  const t = [T.p1m, T.p1a, T.p2m, T.p2a, T.p3m, T.p3a, T.ro, T.rd, T.assist, T.st, T.to, T.bs, T.tc, T.pf, T.rf, T.val, T.min].map(num);
  const acts = team.TEAMACTIONS || {};
  return {
    name: clean(hdr.name), pts: num(hdr.pts), t,
    teamReb: num(acts.rd ?? acts.reb ?? 0), teamTO: num(acts.to ?? 0),
    pl: arr(team.PLAYER).map((p) => [clean(p.name), String(p.no ?? ''), num(p.min), num(p.pts), num(p.p1m), num(p.p1a), num(p.p2m), num(p.p2a), num(p.p3m), num(p.p3a), num(p.ro), num(p.rd), num(p.assist), num(p.st), num(p.to), num(p.bs), num(p.pf), num(p.rf), num(p.val), num(p.pllss), p.inn ? 1 : 0])
  };
}
function convert(id, j) {
  const H = j.HEADER || {};
  if (!/TERCERA FEB/i.test(H.competition || '') || !/B-A/i.test(H.round || '') || !/FINISHED/i.test(H.statusText || '')) return null;
  const teams = arr(H.TEAM), box = arr(j.BOXSCORE?.TEAM);
  if (teams.length !== 2 || box.length !== 2) return null;
  return {
    i: id, d: parseDate(H.starttime),
    q: arr(H.QUARTERS?.QUARTER).map((q) => [num(q.scoreA), num(q.scoreB)]),
    h: side(box[0], teams[0]), a: side(box[1], teams[1])
  };
}

// Pool de peticiones limitado para no saturar la web
async function pool(items, n, fn) {
  const out = []; let k = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (k < items.length) { const x = items[k++]; out.push(await fn(x)); } }));
  return out;
}

const ids = [];
for (let id = FROM; id <= TO; id++) if (!have.has(id)) ids.push(id); // los ya terminados no cambian
console.log(`Partidos ya guardados: ${have.size}. A consultar: ${ids.length}`);

// El token es válido para toda la API: se obtiene una vez (y se renueva si caduca)
let tk = null, fails = 0, added = 0;
async function ensure() {
  for (let id = FIRST; id < FIRST + 20 && !tk; id++) { try { tk = await token(id); } catch (e) { console.warn(e.message); } }
  if (!tk) throw new Error('No se ha podido obtener el token de la FEB');
}
await ensure();

await pool(ids, 6, async (id) => {
  for (let tryN = 0; tryN < 2; tryN++) {
    try {
      let j = null;
      try { j = await api(id, tk); } catch (e) { if (/401|403/.test(e.message) && tryN === 0) { tk = null; await ensure(); continue; } throw e; }
      if (!j) return;
      const g = convert(id, j);
      if (g) { have.set(id, g); added++; console.log(`+ ${id} J${Math.floor((id - FIRST) / 7) + 1} ${g.h.name} ${g.h.pts}-${g.a.pts} ${g.a.name}`); }
      return;
    } catch (e) { if (tryN === 1) { fails++; console.warn(e.message); } }
  }
});

if (fails > ids.length / 2) { console.error('Demasiados fallos: no se modifica data.json'); process.exit(1); }
if (!have.size) { console.error('Sin datos'); process.exit(1); }
if (!added) { console.log('Sin partidos nuevos.'); process.exit(0); }

const games = [...have.values()].sort((a, b) => a.i - b.i);
writeFileSync(FILE, JSON.stringify({ updated: new Date().toISOString(), games }));
console.log(`data.json actualizado: ${games.length} partidos (+${added}).`);
