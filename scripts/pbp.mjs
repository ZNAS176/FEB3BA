// Convierte la respuesta KeyFacts de la FEB (jugada a jugada + plantillas) en un resumen compacto
// de "quintetos": para cada cuarto y cada combinación de jugadores en pista, cuánto tiempo estuvo
// y qué hizo cada equipo (puntos, tiros de campo, tiros libres, rebotes ofensivos y pérdidas).
//
// Salida: { i, r:[[nombres local],[nombres visitante]], k:[[cuarto, mascaraLocal, mascaraVisitante, seg,
//           pts,fga,fta,orb,tov (local), pts,fga,fta,orb,tov (visitante)], ...] }
// Las máscaras son bits sobre la posición del jugador en r[equipo].
const num = (x) => Number(x) || 0;
const clock = (s) => { const m = /(\d+):(\d+)/.exec(s || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : 0; };
const popc = (m) => { let c = 0; while (m) { c += m & 1; m >>>= 1; } return c; };

export function buildPbp(j, id) {
  const sb = j.SCOREBOARD && j.SCOREBOARD.TEAM, lines = j.PLAYBYPLAY && j.PLAYBYPLAY.LINES;
  if (!sb || sb.length !== 2 || !lines || !lines.length) return null;
  const arr = (x) => (Array.isArray(x) ? x : x == null ? [] : [x]);
  const clean = (s) => String(s).replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
  const roster = sb.map((t) => arr(t.PLAYER).map((p) => ({ id: String(p.id), name: clean(p.name) })));
  const idx = new Map();
  roster.forEach((r, t) => r.forEach((p, i) => idx.set(String(p.id), [t, i])));
  const evs = lines.slice().sort((a, b) => num(a.num) - num(b.num));
  const mask = [0, 0], cnt = [0, 0];
  const agg = new Map();
  let last = 0, lastMiss = -1, bad = 0, lost = 0;
  const pts = [0, 0];

  const base = (q) => (q <= 4 ? (q - 1) * 600 : 2400 + (q - 5) * 300);
  const len = (q) => (q <= 4 ? 600 : 300);
  let cur = null;
  const open = (q) => {
    if (popc(mask[0]) !== 5 || popc(mask[1]) !== 5) return null;
    const key = q + '|' + mask[0] + '|' + mask[1];
    let a = agg.get(key);
    if (!a) { a = [q, mask[0], mask[1], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; agg.set(key, a); }
    return a;
  };

  for (const e of evs) {
    const q = num(e.quarter) || 1;
    const t = base(q) + (len(q) - clock(e.time));
    const act = e.action;
    if (cur && t > last) cur[3] += t - last;
    last = Math.max(last, t);
    if (act !== 'subst' && (!cur || cur[0] !== q)) cur = open(q);
    const team = e.team === '1' ? 0 : e.team === '2' ? 1 : -1;
    if (act === 'subst') {
      const hit = idx.get(String(e.idPlayer));
      if (!hit) { bad++; continue; }
      const [tt, i] = hit, bit = 1 << i;
      if (/Entra/i.test(e.text)) mask[tt] |= bit; else mask[tt] &= ~bit;
      cur = open(q);
      continue;
    }
    if (team < 0) continue;
    if (!cur && /shoot|fthrow|lose|rebound/.test(act)) lost++;
    const o = 4 + team * 5; // posición de las 5 estadísticas del equipo
    if (act === 'shoot') {
      if (cur) cur[o + 1] += 1;
      if (/ANOTADO/i.test(e.text)) { const v = /TIRO DE 3/i.test(e.text) ? 3 : 2; if (cur) cur[o] += v; pts[team] += v; lastMiss = -1; }
      else lastMiss = team;
    } else if (act === 'fthrow') {
      if (cur) cur[o + 2] += 1;
      if (/ANOTADO/i.test(e.text)) { if (cur) cur[o] += 1; pts[team] += 1; }
      else lastMiss = team;
    } else if (act === 'rebound') {
      if (lastMiss === team && cur) cur[o + 3] += 1;
      lastMiss = -1;
    } else if (act === 'lose') {
      if (cur) cur[o + 4] += 1;
    }
  }
  const k = [...agg.values()].filter((a) => a[3] > 0 || a.slice(4).some((x) => x));
  return { i: id, r: roster.map((r) => r.map((p) => p.name)), k, chk: { pts, bad, lost } };
}
