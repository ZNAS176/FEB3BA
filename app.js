'use strict';
/* FEB3 BA — estadísticas del grupo B-A de Tercera FEB.
   Lee data.json (actas finales de la FEB) y calcula todo en el navegador.
   Formato de data.json: { updated, games:[{ i, d, q, h, a }] }
   t  = [TLm,TLa,T2m,T2a,T3m,T3a,RO,RD,AS,BR,PE,TP,TC,FC,FR,VA,seg]
   pl = [nombre,dorsal,seg,PT,TLm,TLa,T2m,T2a,T3m,T3a,RO,RD,AS,BR,PE,TP,FC,FR,VA,+/-,titular] */

const VEN = 'EL VENTERO CBV';
const FIRST_ID = 2537025; // primer partido de la J1; 7 partidos por jornada
const SHORT = {
  'EL VENTERO CBV': 'El Ventero',
  'AG MOVIALSA QUALITYSPORT CRIPTANA': 'Criptana',
  'ARISTOS PARTIZÁN DE FUENLABRADA': 'Partizán Fuenlabrada',
  'BASKET GLOBALCAJA QUINTANAR': 'Quintanar',
  'C. D. MENSAJERO ISLA DE LA PALMA': 'Mensajero La Palma',
  'C.B. DADARMO DE GÜIMAR': 'Dadarmo Güímar',
  'C.B. LAS ROZAS': 'Las Rozas',
  'CB ARIDANE': 'Aridane',
  'CESUR DISTRITO OLIMPICO': 'Distrito Olímpico',
  'EB FELIPE ANTÓN': 'Felipe Antón',
  'FUNDACION GLOBALCAJA LA RODA': 'La Roda',
  'QUALIS C.B VILLA DE VALDEMORO': 'Valdemoro',
  'STOP BIOGÁS TOBARRA': 'Tobarra',
  'ZENTRO BASKET MADRID': 'Zentro Madrid'
};
const sh = (n) => SHORT[n] || n;
const tc = (s) => s.toLowerCase().replace(/(^|[\s\-.'])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
const norm = (s) => tc(s.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim().replace('P. ZENTRO ', 'P. '));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- formato ---------- */
const fmt = (x, d) => (x == null || !isFinite(x) ? '—' : x.toFixed(d == null ? 1 : d).replace('.', ','));
const pct = (x) => (x == null || !isFinite(x) ? '—' : x.toFixed(1).replace('.', ',') + '%');
const sgn = (x, d) => (x == null || !isFinite(x) ? '—' : (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(d == null ? 1 : d).replace('.', ','));
const mmss = (sec) => Math.floor(sec / 60) + ':' + String(Math.round(sec % 60)).padStart(2, '0');

/* ---------- cálculo ---------- */
function compute(G) {
  const KEYS = ['fgm', 'fga', 'p3m', 'p3a', 'p2m', 'p2a', 'ftm', 'fta', 'orb', 'drb', 'ast', 'stl', 'tov', 'blk', 'pf', 'poss', 'pts'];
  const blank = () => { const o = {}; KEYS.forEach((k) => { o[k] = 0; }); return o; };
  const calc = (s) => {
    const t = s.t, fga = t[3] + t[5];
    return { fgm: t[2] + t[4], fga, p3m: t[4], p3a: t[5], p2m: t[2], p2a: t[3], ftm: t[0], fta: t[1], orb: t[6], drb: t[7], ast: t[8], stl: t[9], tov: t[10], blk: t[11], pf: t[13], pts: s.pts, poss: fga - t[6] + t[10] + 0.44 * t[1], trb: t[6] + t[7] };
  };
  const T = {}, P = {}, games = [];
  const teamOf = (name) => T[name] || (T[name] = { name, short: sh(name), gp: 0, w: 0, l: 0, gm: 0, m: blank(), o: blank(), games: [], qg: [] });

  G.forEach((g) => {
    const gm = 40 + 5 * (g.q.length - 4);
    const j = Math.floor((g.i - FIRST_ID) / 7) + 1;
    const c = [calc(g.h), calc(g.a)], sides = [g.h, g.a];
    games.push({ i: g.i, j, d: g.d, gm, q: g.q, sides, c });
    [0, 1].forEach((k) => {
      const s = sides[k], me = c[k], op = c[1 - k], os = sides[1 - k];
      const t0 = teamOf(s.name), win = me.pts > op.pts;
      t0.gp += 1; t0.gm += gm; if (win) t0.w += 1; else t0.l += 1;
      KEYS.forEach((key) => { t0.m[key] += me[key]; t0.o[key] += op[key]; });
      t0.qg.push({ j, home: k === 0, rival: sh(os.name), win, d: g.q.slice(0, 4).map((x) => x[k] - x[1 - k]), f: g.q.slice(0, 4).map((x) => x[k]), c: g.q.slice(0, 4).map((x) => x[1 - k]) });
      t0.games.push({ j, home: k === 0, rival: sh(os.name), opp: os.name, score: me.pts + '–' + op.pts, win, ort: 100 * me.pts / me.poss, drt: 100 * op.pts / op.poss });
      const used = me.fga + 0.44 * me.fta + me.tov;
      s.pl.forEach((p) => {
        const name = norm(p[0]), key = s.name + '|' + name;
        const a = P[key] || (P[key] = {
          key, n: name, teamFull: s.name, team: sh(s.name), gp: 0, sec: 0, st: 0,
          pts: 0, p1m: 0, p1a: 0, p2m: 0, p2a: 0, p3m: 0, p3a: 0, orb: 0, drb: 0, ast: 0, stl: 0, tov: 0, blk: 0, pf: 0, val: 0, pm: 0, gmsc: 0,
          usedP: 0, usedDen: 0, astDen: 0, trbDen: 0, orbDen: 0, drbDen: 0, stlDen: 0, blkDen: 0, log: []
        });
        const mins = p[2] / 60, fr = mins / gm, fgm = p[6] + p[8], fga = p[7] + p[9];
        a.gp += 1; a.sec += p[2]; a.st += p[20];
        a.pts += p[3]; a.p1m += p[4]; a.p1a += p[5]; a.p2m += p[6]; a.p2a += p[7]; a.p3m += p[8]; a.p3a += p[9];
        a.orb += p[10]; a.drb += p[11]; a.ast += p[12]; a.stl += p[13]; a.tov += p[14]; a.blk += p[15]; a.pf += p[16]; a.val += p[18]; a.pm += p[19];
        a.gmsc += p[3] + 0.4 * fgm - 0.7 * fga - 0.4 * (p[5] - p[4]) + 0.7 * p[10] + 0.3 * p[11] + p[13] + 0.7 * p[12] + 0.7 * p[15] - 0.4 * p[16] - p[14];
        a.usedP += fga + 0.44 * p[5] + p[14];
        a.usedDen += fr * used;
        a.astDen += fr * me.fgm - fgm;
        a.trbDen += fr * (me.trb + op.trb);
        a.orbDen += fr * (me.orb + op.drb);
        a.drbDen += fr * (me.drb + op.orb);
        a.stlDen += fr * op.poss;
        a.blkDen += fr * op.p2a;
        a.log.push({ j, vs: k === 0 ? 'vs' : 'en', rival: sh(os.name), sec: p[2], pts: p[3], reb: p[10] + p[11], ast: p[12], val: p[18] });
      });
    });
  });

  const div = (x, y) => (y > 0 ? x / y : NaN);
  Object.values(T).forEach((t) => {
    const m = t.m, o = t.o;
    t.ppg = m.pts / t.gp; t.papg = o.pts / t.gp;
    t.ort = 100 * m.pts / m.poss; t.drt = 100 * o.pts / o.poss; t.net = t.ort - t.drt;
    t.pace = (m.poss + o.poss) / 2 * 40 / t.gm;
    t.efg = 100 * (m.fgm + 0.5 * m.p3m) / m.fga;
    t.ts = 100 * m.pts / (2 * (m.fga + 0.44 * m.fta));
    t.tov = 100 * m.tov / m.poss;
    t.orb = 100 * m.orb / (m.orb + o.drb);
    t.drb = 100 * m.drb / (m.drb + o.orb);
    t.ftr = 100 * m.fta / m.fga;
    t.p3 = 100 * m.p3m / m.p3a; t.p2 = 100 * m.p2m / m.p2a; t.ft = 100 * m.ftm / m.fta;
    t.astto = m.ast / m.tov;
    t.oefg = 100 * (o.fgm + 0.5 * o.p3m) / o.fga;
    t.otov = 100 * o.tov / o.poss;
    t.oorb = 100 * o.orb / (o.orb + m.drb);
    t.oftr = 100 * o.fta / o.fga;
  });

  Object.values(T).forEach((t) => {
    const n = t.qg.length;
    t.q = [0, 1, 2, 3].map((i) => {
      const f = t.qg.reduce((x, g) => x + g.f[i], 0) / n, c = t.qg.reduce((x, g) => x + g.c[i], 0) / n;
      const ds = t.qg.map((g) => g.d[i]), mean = (f - c);
      const sd = Math.sqrt(ds.reduce((x, v) => x + (v - mean) * (v - mean), 0) / Math.max(1, n - 1));
      return { f, c, d: mean, won: t.qg.filter((g) => g.d[i] > 0).length, lost: t.qg.filter((g) => g.d[i] < 0).length, se: sd / Math.sqrt(n) };
    });
    const avg = t.q.reduce((x, q) => x + q.d, 0) / 4;
    t.q.forEach((q) => { q.bias = q.d - avg; });
    t.qh1 = t.q[0].d + t.q[1].d; t.qh2 = t.q[2].d + t.q[3].d;
    const ord = t.q.map((q, i) => i).sort((a, b) => t.q[a].bias - t.q[b].bias);
    t.qworst = ord[0]; t.qbest = ord[3];
  });

  // Ajuste por rival (iterativo, con 3 partidos "medios" de regularización)
  const TL = Object.values(T);
  const lg = 100 * TL.reduce((s, t) => s + t.m.pts, 0) / TL.reduce((s, t) => s + t.m.poss, 0);
  TL.forEach((t) => { t.ao = lg; t.ad = lg; });
  for (let it = 0; it < 80; it++) {
    const no = {}, nd = {};
    TL.forEach((t) => {
      no[t.name] = (t.games.reduce((s, g) => s + g.ort - (T[g.opp].ad - lg), 0) + 3 * lg) / (t.games.length + 3);
      nd[t.name] = (t.games.reduce((s, g) => s + g.drt - (T[g.opp].ao - lg), 0) + 3 * lg) / (t.games.length + 3);
    });
    const mo = TL.reduce((s, t) => s + no[t.name], 0) / TL.length;
    const md = TL.reduce((s, t) => s + nd[t.name], 0) / TL.length;
    TL.forEach((t) => { t.ao = no[t.name] - mo + lg; t.ad = nd[t.name] - md + lg; });
  }
  TL.forEach((t) => {
    t.anet = t.ao - t.ad;
    t.sos = t.games.reduce((s, g) => s + (T[g.opp].ao - T[g.opp].ad), 0) / t.games.length;
  });

  Object.values(P).forEach((p) => {
    const g = p.gp, min = p.sec / 60;
    p.mpg = min / g;
    p.fgm = p.p2m + p.p3m; p.fga = p.p2a + p.p3a; p.reb = p.orb + p.drb;
    p.pts_g = p.pts / g; p.reb_g = p.reb / g; p.ast_g = p.ast / g; p.stl_g = p.stl / g; p.blk_g = p.blk / g; p.tov_g = p.tov / g; p.val_g = p.val / g; p.gmsc_g = p.gmsc / g;
    p.ts = 100 * p.pts / (2 * (p.fga + 0.44 * p.p1a));
    p.efg = 100 * (p.fgm + 0.5 * p.p3m) / p.fga;
    p.p2 = 100 * p.p2m / p.p2a; p.p3 = 100 * p.p3m / p.p3a; p.ft = 100 * p.p1m / p.p1a;
    p.usg = 100 * div(p.usedP, p.usedDen);
    p.astp = 100 * div(p.ast, p.astDen);
    p.rebp = 100 * div(p.reb, p.trbDen);
    p.orbp = 100 * div(p.orb, p.orbDen);
    p.drbp = 100 * div(p.drb, p.drbDen);
    p.stlp = 100 * div(p.stl, p.stlDen);
    p.blkp = 100 * div(p.blk, p.blkDen);
    p.tovp = 100 * div(p.tov, p.fga + 0.44 * p.p1a + p.tov);
    p.pm40 = 40 * p.pm / min;
    p.p40 = 40 * p.pts / min;
  });
  return { T, P, games };
}


/* ---------- jugada a jugada: quintetos por cuarto ---------- */
function addPbp(C, PB) {
  C.pbpN = 0;
  Object.values(C.T).forEach((t) => { t.pq = [0, 1, 2, 3].map(() => ({ sec: 0, pf: 0, pa: 0 })); t.pg = 0; });
  Object.values(C.P).forEach((p) => { p.pq = [0, 1, 2, 3].map(() => ({ sec: 0, pf: 0, pa: 0 })); });
  const gm = new Map(C.games.map((g) => [g.i, g]));
  Object.values((PB && PB.games) || {}).forEach((pg) => {
    const g = gm.get(pg.i);
    if (!g || !pg.r || !pg.k) return;
    C.pbpN += 1;
    const keys = [0, 1].map((s) => pg.r[s].map((n) => g.sides[s].name + '|' + norm(n)));
    [0, 1].forEach((s) => { C.T[g.sides[s].name].pg += 1; });
    pg.k.forEach((row) => {
      const q = row[0] - 1;
      if (q > 3) return; // las prórrogas no entran
      [0, 1].forEach((s) => {
        const t = C.T[g.sides[s].name], sec = row[3], pf = row[4 + 5 * s], pa = row[4 + 5 * (1 - s)];
        t.pq[q].sec += sec; t.pq[q].pf += pf; t.pq[q].pa += pa;
        keys[s].forEach((k, i) => {
          if (!(row[1 + s] & (1 << i))) return;
          const p = C.P[k];
          if (!p) return;
          p.pq[q].sec += sec; p.pq[q].pf += pf; p.pq[q].pa += pa;
        });
      });
    });
  });
}

/* ---------- definiciones de métricas ---------- */
const EQ = [
  { id: 'anet', label: 'Dif. neta aj.', get: (t) => t.anet, f: (x) => sgn(x), desc: true, hint: 'Diferencia neta corregida por la fuerza de los rivales que ha tenido cada equipo.' },
  { id: 'aort', label: 'Ataque aj.', get: (t) => t.ao, f: (x) => fmt(x), desc: true, hint: 'Puntos anotados por 100 posesiones, corregidos por la defensa de los rivales.' },
  { id: 'adrt', label: 'Defensa aj.', get: (t) => t.ad, f: (x) => fmt(x), desc: false, hint: 'Puntos recibidos por 100 posesiones, corregidos por el ataque de los rivales. Menos es mejor.' },
  { id: 'net', label: 'Dif. neta', get: (t) => t.net, f: (x) => sgn(x), desc: true, hint: 'Puntos de diferencia por 100 posesiones (ataque − defensa), sin ajustar.' },
  { id: 'ort', label: 'Ataque', get: (t) => t.ort, f: (x) => fmt(x), desc: true, hint: 'Puntos anotados por 100 posesiones.' },
  { id: 'drt', label: 'Defensa', get: (t) => t.drt, f: (x) => fmt(x), desc: false, hint: 'Puntos recibidos por 100 posesiones. Menos es mejor.' },
  { id: 'pace', label: 'Ritmo', get: (t) => t.pace, f: (x) => fmt(x), desc: true, hint: 'Posesiones por 40 minutos.' },
  { id: 'efg', label: 'eFG%', get: (t) => t.efg, f: pct, desc: true, hint: 'Acierto de tiro de campo ponderando los triples.' },
  { id: 'ts', label: 'TS%', get: (t) => t.ts, f: pct, desc: true, hint: 'Acierto real: incluye tiros libres.' },
  { id: 'tov', label: 'Pérdidas', get: (t) => t.tov, f: pct, desc: false, hint: 'Pérdidas por cada 100 posesiones. Menos es mejor.' },
  { id: 'orb', label: 'Rebote of.', get: (t) => t.orb, f: pct, desc: true, hint: 'Porcentaje de rebotes ofensivos capturados.' },
  { id: 'drb', label: 'Rebote def.', get: (t) => t.drb, f: pct, desc: true, hint: 'Porcentaje de rebotes defensivos capturados.' },
  { id: 'p3', label: 'Triples', get: (t) => t.p3, f: pct, desc: true, hint: 'Acierto en triples.' },
  { id: 'ppg', label: 'Puntos', get: (t) => t.ppg, f: (x) => fmt(x), desc: true, hint: 'Puntos por partido.' }
];
const JU = [
  { id: 'val', label: 'VAL', get: (p) => p.val_g, f: (x) => fmt(x), hint: 'Valoración FEB media por partido.' },
  { id: 'pts', label: 'Puntos', get: (p) => p.pts_g, f: (x) => fmt(x), hint: 'Puntos por partido.' },
  { id: 'reb', label: 'Rebotes', get: (p) => p.reb_g, f: (x) => fmt(x), hint: 'Rebotes por partido.' },
  { id: 'ast', label: 'Asistencias', get: (p) => p.ast_g, f: (x) => fmt(x), hint: 'Asistencias por partido.' },
  { id: 'stl', label: 'Robos', get: (p) => p.stl_g, f: (x) => fmt(x), hint: 'Robos por partido.' },
  { id: 'blk', label: 'Tapones', get: (p) => p.blk_g, f: (x) => fmt(x), hint: 'Tapones por partido.' },
  { id: 'gmsc', label: 'Game Score', get: (p) => p.gmsc_g, f: (x) => fmt(x), hint: 'Índice de impacto de Hollinger, media por partido.' },
  { id: 'ts', label: 'TS%', get: (p) => p.ts, f: pct, req: (p) => p.fga + 0.44 * p.p1a >= 12, hint: 'Acierto real de tiro (mín. 12 tiros equivalentes).' },
  { id: 'efg', label: 'eFG%', get: (p) => p.efg, f: pct, req: (p) => p.fga >= 10, hint: 'Acierto de campo con triples ponderados (mín. 10 tiros).' },
  { id: 'usg', label: 'USG%', get: (p) => p.usg, f: pct, hint: 'Porcentaje de posesiones del equipo que acaba con él en pista.' },
  { id: 'astp', label: 'AST%', get: (p) => p.astp, f: pct, hint: 'Porcentaje de canastas de sus compañeros que asiste.' },
  { id: 'rebp', label: 'REB%', get: (p) => p.rebp, f: pct, hint: 'Porcentaje de rebotes que captura estando en pista.' },
  { id: 'pm40', label: '+/− por 40', get: (p) => p.pm40, f: (x) => sgn(x), hint: 'Diferencia del equipo con él en pista, cada 40 minutos.' },
  { id: 'p3', label: 'Triples %', get: (p) => p.p3, f: pct, req: (p) => p.p3a >= 8, hint: 'Acierto en triples (mín. 8 intentos).' },
  { id: 'ft', label: 'Libres %', get: (p) => p.ft, f: pct, req: (p) => p.p1a >= 8, hint: 'Acierto en tiros libres (mín. 8 intentos).' },
  { id: 'tovp', label: 'Pérdidas %', get: (p) => p.tovp, f: pct, asc: true, req: (p) => p.fga + 0.44 * p.p1a + p.tov >= 20, hint: 'Pérdidas por cada 100 jugadas individuales (mín. 20 jugadas). Menos es mejor.' }
];
const GUIDE_TEAM = [
  ['Posesiones', 'Tiros de campo intentados − rebotes ofensivos + pérdidas + 0,44 × tiros libres intentados.'],
  ['Ataque y defensa (por 100)', 'Puntos anotados y recibidos por cada 100 posesiones. Permite comparar equipos que juegan a ritmos distintos.'],
  ['Diferencia neta', 'Ataque menos defensa. Es la mejor foto de lo bueno que es un equipo: suele predecir mejor que el balance de victorias.'],
  ['Ajuste por rival', 'Ataque y defensa se corrigen según los rivales que ha tenido cada equipo, de forma iterativa. Con pocos partidos el resultado se acerca a la media para no exagerar, y se afinará según avance la temporada.'],
  ['Ritmo', 'Posesiones por 40 minutos, con la media de las dos canastas.'],
  ['eFG% y TS%', 'eFG% da 1,5 veces el valor al triple. TS% añade los tiros libres: puntos / (2 × (tiros + 0,44 × libres)).'],
  ['Cuartos', 'Diferencia media de puntos de cada equipo en cada cuarto, y respecto a su propia media, para detectar un periodo débil o fuerte que se repite. Con pocos partidos puede ser ruido; el texto de cada equipo avisa cuando la diferencia aún es pequeña.'],
  ['Quién está en pista', 'A partir del jugada a jugada de cada partido se reconstruye qué cinco jugadores había en pista en cada momento, y se compara el marcador del equipo con y sin cada jugador en cada cuarto. Las prórrogas no se incluyen.'],
  ['Cuatro factores', 'Acierto (eFG%), pérdidas, rebote ofensivo y tiros libres. Se comparan con lo que consiguen los rivales contra ese equipo.']
];
const GUIDE_PLAYER = [
  ['VAL', 'Valoración oficial de la FEB tal como aparece en el acta.'],
  ['Game Score', 'Índice de Hollinger: puntos + aciertos y fallos de tiro ponderados + rebotes, robos, asistencias y tapones − faltas y pérdidas.'],
  ['USG%', 'Jugadas que acaba el jugador (tiros, libres, pérdidas) sobre las del equipo mientras está en pista.'],
  ['AST%, REB%, ROB%, TAP%', 'Porcentaje de las oportunidades disponibles que convierte mientras está en pista.'],
  ['+/− por 40', 'Diferencia de puntos del equipo con él en pista, ajustada a 40 minutos. Con pocos partidos es ruidosa.'],
  ['Filtro de minutos', 'Por defecto solo salen jugadores con 10 o más minutos por partido. Se puede cambiar a “Todos los minutos”.']
];

/* ---------- vista ---------- */
const S = { reT: VEN, paJ: null, shQ: 0, qSel: null, tab: 'eq', eqSort: 'anet', eqSel: null, juSort: 'val', juTeam: 'all', juMin: true, juSel: null, juLim: 25, paSel: null };
let DATA = null, C = null, SH = {};

const chip = (act, val, label, on) => `<button type="button" class="chip" data-a="${act}" data-v="${esc(val)}" aria-pressed="${on}">${esc(label)}</button>`;
const tbl = (cols, cells, cls) => `<div class="tr ${cls || ''}" style="--c:${cols}">${cells}</div>`;
const cell = (v, cls) => `<span class="${cls || ''}">${esc(v)}</span>`;
const tile = (l, v) => `<div class="tile"><b>${esc(v)}</b><i>${esc(l)}</i></div>`;
const vdChip = (win) => `<span class="chipvd ${win ? '' : 'd'}">${win ? 'V' : 'D'}</span>`;

function viewEq() {
  const def = EQ.find((e) => e.id === S.eqSort) || EQ[0];
  const teams = Object.values(C.T).sort((a, b) => (def.desc ? def.get(b) - def.get(a) : def.get(a) - def.get(b)));
  let h = `<div class="chips" role="group" aria-label="Ordenar equipos por">${EQ.map((e) => chip('eqSort', e.id, e.label, e.id === def.id)).join('')}</div>`;
  h += `<p class="hint">${esc(def.hint)} Toca un equipo para ver el detalle.</p><div class="list">`;
  teams.forEach((t, i) => {
    const open = S.eqSel === t.name;
    h += `<div class="card ${t.name === VEN ? 'v' : ''} ${open ? 'open' : ''}"><button type="button" class="rowb" data-a="eqSel" data-v="${esc(t.name)}" aria-expanded="${open}">
      <span class="rank">${i + 1}</span><span class="mid"><span class="nm">${esc(t.short)}</span><span class="sub">${t.w}–${t.l} · ${fmt(t.ppg)} a favor · ${fmt(t.papg)} en contra</span></span>
      <span class="big"><b>${esc(def.f(def.get(t)))}</b><i>${esc(def.label)}</i></span></button>`;
    if (open) h += teamDetail(t);
    h += '</div>';
  });
  return h + '</div>';
}

function teamDetail(t) {
  const tiles = [
    ['Dif. aj.', sgn(t.anet)], ['Ataque aj.', fmt(t.ao)], ['Defensa aj.', fmt(t.ad)], ['Rivales', sgn(t.sos)],
    ['Ataque', fmt(t.ort)], ['Defensa', fmt(t.drt)], ['Dif. neta', sgn(t.net)], ['Ritmo', fmt(t.pace)],
    ['eFG%', pct(t.efg)], ['TS%', pct(t.ts)], ['Pérdidas', pct(t.tov)], ['Reb. of.', pct(t.orb)],
    ['Reb. def.', pct(t.drb)], ['Tiro 3', pct(t.p3)], ['T. libres', pct(t.ft)], ['Asist./pérd.', fmt(t.astto, 2)]
  ];
  const nets = t.games.map((g) => g.ort - g.drt);
  const mx = Math.max(30, ...nets.map((x) => Math.abs(x)));
  const trend = t.games.map((g, k) => {
    const v = nets[k], w = Math.round(100 * Math.abs(v) / mx);
    return `<div class="trend"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc('J' + g.j + ' ' + (g.home ? 'vs' : 'en') + ' ' + g.rival)}</span>
      <span class="l"><em style="background:#FF9C1B;border-radius:3px 0 0 3px;width:${v < 0 ? w : 0}%"></em></span>
      <span class="rr"><em style="background:#1F4E78;border-radius:0 3px 3px 0;width:${v > 0 ? w : 0}%"></em></span>
      <b style="text-align:right">${esc(sgn(v, 0))}</b></div>`;
  }).join('');
  const better = (a, b, hi) => (hi ? a > b : a < b);
  const fac = (l, mine, theirs, f, hi) => { const w = better(mine, theirs, hi); return tbl('minmax(0,1fr) 64px 64px', cell(l) + cell(f(mine), 'r ' + (w ? 'b' : '')) + cell(f(theirs), 'r ' + (w ? '' : 'b'))); };
  const top = Object.values(C.P).filter((p) => p.teamFull === t.name).sort((a, b) => b.val_g - a.val_g).slice(0, 5);
  const cols = 'minmax(0,1fr) 38px 38px 38px 40px';
  return `<div class="det g2"><div class="tiles">${tiles.map(([l, v]) => tile(l, v)).join('')}</div>
    <div class="sec"><h3>Tendencia</h3><p>Diferencia neta en cada partido (por 100 posesiones). Azul: mejor que el rival; naranja: peor.</p>${trend}</div>
    <div class="sec"><h3>Cuatro factores</h3>${tbl('minmax(0,1fr) 64px 64px', cell('') + cell('Equipo', 'r') + cell('Rivales', 'r'), 'h')}
      ${fac('Acierto de tiro (eFG%)', t.efg, t.oefg, pct, true)}${fac('Pérdidas por posesión', t.tov, t.otov, pct, false)}${fac('Rebote ofensivo', t.orb, t.oorb, pct, true)}${fac('Tiros libres por tiro de campo', t.ftr, t.oftr, pct, true)}</div>
    <div class="sec"><h3>Jugadores clave</h3>${tbl(cols, cell('') + cell('PTS', 'r') + cell('REB', 'r') + cell('AST', 'r') + cell('VAL', 'r'), 'h')}
      ${top.map((p) => tbl(cols, cell(p.n, 'e') + cell(fmt(p.pts_g), 'r b') + cell(fmt(p.reb_g), 'r') + cell(fmt(p.ast_g), 'r') + cell(fmt(p.val_g), 'r'))).join('')}</div>
    <div class="sec"><h3>Partidos</h3>${t.games.map((g) => `<div class="gl">${vdChip(g.win)}<span>J${g.j} · ${g.home ? 'vs' : 'en'} ${esc(g.rival)}</span><strong>${esc(g.score)}</strong></div>`).join('')}</div></div>`;
}

function viewJu() {
  const def = JU.find((e) => e.id === S.juSort) || JU[0];
  const teams = Object.values(C.T).sort((a, b) => (a.name === VEN ? -1 : b.name === VEN ? 1 : a.short.localeCompare(b.short, 'es')));
  let pool = Object.values(C.P).filter((p) => (S.juTeam === 'all' || p.teamFull === S.juTeam) && (!S.juMin || p.mpg >= 10));
  if (def.req) pool = pool.filter(def.req);
  pool = pool.filter((p) => isFinite(def.get(p)));
  pool.sort((a, b) => (def.asc ? def.get(a) - def.get(b) : def.get(b) - def.get(a)));
  const shown = pool.slice(0, S.juLim), left = pool.length - shown.length;
  let h = `<div class="chips" role="group" aria-label="Filtrar por equipo">${chip('juTeam', 'all', 'Todos', S.juTeam === 'all')}${teams.map((t) => chip('juTeam', t.name, t.short, S.juTeam === t.name)).join('')}</div>`;
  h += `<div class="chips" role="group" aria-label="Ordenar jugadores por">${JU.map((e) => chip('juSort', e.id, e.label, e.id === def.id)).join('')}</div>`;
  h += `<div class="row2"><p class="hint" style="flex-grow:1">${esc(def.hint)}</p><button type="button" class="tg" data-a="juMin" aria-pressed="${S.juMin}">${S.juMin ? '10+ min' : 'Todos los min.'}</button></div><div class="list">`;
  shown.forEach((p, i) => {
    const open = S.juSel === p.key;
    h += `<div class="card ${p.teamFull === VEN ? 'v' : ''} ${open ? 'open' : ''}"><button type="button" class="rowb" data-a="juSel" data-v="${esc(p.key)}" aria-expanded="${open}">
      <span class="rank">${i + 1}</span><span class="mid"><span class="nm">${esc(p.n)}</span><span class="sub">${esc(p.team)} · ${p.gp} ${p.gp === 1 ? 'partido' : 'partidos'} · ${fmt(p.mpg)} min · ${fmt(p.pts_g)}/${fmt(p.reb_g)}/${fmt(p.ast_g)}</span></span>
      <span class="big"><b>${esc(def.f(def.get(p)))}</b><i>${esc(def.label)}</i></span></button>`;
    if (open) h += playerDetail(p);
    h += '</div>';
  });
  if (!pool.length) h += '<p class="empty">Ningún jugador cumple los filtros. Prueba con “Todos los minutos” o con otro equipo.</p>';
  h += '</div>';
  if (left > 0) h += `<button type="button" class="more" data-a="more">Mostrar más (${left})</button>`;
  return h;
}

function playerDetail(p) {
  const tiles = [
    ['Puntos', fmt(p.pts_g)], ['Rebotes', fmt(p.reb_g)], ['Asist.', fmt(p.ast_g)], ['VAL', fmt(p.val_g)],
    ['Robos', fmt(p.stl_g)], ['Tapones', fmt(p.blk_g)], ['Pérdidas', fmt(p.tov_g)], ['Faltas', fmt(p.pf / p.gp)],
    ['Tiro 2', pct(p.p2)], ['Tiro 3', pct(p.p3)], ['T. libres', pct(p.ft)], ['eFG%', pct(p.efg)],
    ['TS%', pct(p.ts)], ['USG%', pct(p.usg)], ['AST%', pct(p.astp)], ['REB%', pct(p.rebp)],
    ['REB of.%', pct(p.orbp)], ['REB def.%', pct(p.drbp)], ['ROB%', pct(p.stlp)], ['TAP%', pct(p.blkp)],
    ['Pérdidas%', pct(p.tovp)], ['Game Score', fmt(p.gmsc_g)], ['+/− por 40', sgn(p.pm40)], ['Puntos x40', fmt(p.p40)],
    ['Titular', p.st + '/' + p.gp], ['Min. totales', mmss(p.sec)]
  ];
  const cols = 'minmax(0,1fr) 38px 32px 32px 32px 36px';
  return `<div class="det"><div class="tiles">${tiles.map(([l, v]) => tile(l, v)).join('')}</div>
    <div class="sec"><h3>Partido a partido</h3>${tbl(cols, cell('') + cell('MIN', 'r') + cell('PT', 'r') + cell('RB', 'r') + cell('AS', 'r') + cell('VA', 'r'), 'h')}
    ${p.log.map((g) => tbl(cols, cell('J' + g.j + ' ' + g.vs + ' ' + g.rival, 'e') + cell(mmss(g.sec), 'r') + cell(g.pts, 'r b') + cell(g.reb, 'r') + cell(g.ast, 'r') + cell(g.val, 'r'))).join('')}</div></div>`;
}

function viewPa() {
  const js = [...new Set(C.games.map((g) => g.j))].sort((a, b) => b - a);
  const cur = js.includes(S.paJ) ? S.paJ : js[0];
  const gs = C.games.filter((g) => g.j === cur).sort((a, b) => a.i - b.i);
  let h = `<div class="chips" role="group" aria-label="Jornada">${js.map((j) => chip('paJ', j, 'J' + j, j === cur)).join('')}</div>`;
  h += '<div class="list">';
  gs.forEach((g) => {
    const open = S.paSel === g.i, [hh, aa] = g.sides, hw = hh.pts > aa.pts, d = g.d.split('-');
    h += `<div class="card ${open ? 'open' : ''}"><button type="button" class="gm" data-a="paSel" data-v="${g.i}" aria-expanded="${open}">
      <small>Jornada ${g.j} · ${d[2]}/${d[1]}</small>
      <div><span class="t ${hw ? 'w' : ''}">${esc(sh(hh.name))}</span><span class="s ${hw ? 'sw' : ''}">${hh.pts}</span></div>
      <div><span class="t ${hw ? '' : 'w'}">${esc(sh(aa.name))}</span><span class="s ${hw ? '' : 'sw'}">${aa.pts}</span></div></button>`;
    if (open) h += gameDetail(g);
    h += '</div>';
  });
  return h + '</div>';
}


function courtLines() {
  const l = 'fill="none" stroke="#8A94A0" stroke-width=".8"';
  return `<rect x=".5" y=".5" width="149" height="139" ${l}/>
    <rect x="50.5" y=".5" width="49" height="57.5" ${l}/>
    <path d="M57 58A18 18 0 0 0 93 58" ${l}/><path d="M57 58A18 18 0 0 1 93 58" ${l} stroke-dasharray="3 3"/>
    <path d="M62.5 15.75A12.5 12.5 0 0 0 87.5 15.75" ${l}/>
    <path d="M66 12H84" stroke="#8A94A0" stroke-width="1.4"/><circle cx="75" cy="15.75" r="2.25" ${l}/>
    <path d="M9 .5V29.9A67.5 67.5 0 0 0 141 29.9V.5" ${l}/>
    <path d="M57 140A18 18 0 0 1 93 140" ${l}/>`;
}
function courtSvg(sel, label, who) {
  const made = sel.filter((r) => r[5]).length;
  const pts = sel.slice().sort((a, b) => a[5] - b[5]).map((r) => {
    const cx = (r[4] * 1.5).toFixed(1), cy = (Math.min(r[3], 50) * 2.8).toFixed(1);
    const tt = who ? `<title>${esc(who(r))} · ${r[5] ? 'anotado' : 'fallado'}</title>` : '';
    return r[5] ? `<circle cx="${cx}" cy="${cy}" r="2.7" fill="#1F4E78" stroke="#fff" stroke-width=".7">${tt}</circle>`
      : `<path d="M${cx - 2} ${cy - 2}l4 4m0-4l-4 4" stroke="#E07B00" stroke-width="1.5" stroke-linecap="round" fill="none">${tt}</path>`;
  }).join('');
  return `<svg class="court" viewBox="0 0 150 140" role="img" aria-label="${esc(label)}: ${made} anotados de ${sel.length}">${courtLines()}${pts}</svg>`;
}
function shotSection(g) {
  const rows = SH[g.i];
  const head = '<h3>Gráfico de tiro</h3>';
  if (!rows) return `<div class="sec wide">${head}<p>El gráfico de tiro de este partido se publicará tras la próxima actualización automática.</p></div>`;
  const q = S.shQ, qs = [[0, 'Todos'], [1, '1º'], [2, '2º'], [3, '3º'], [4, '4º']];
  const chips = `<div class="chips" style="margin:0;padding:0" role="group" aria-label="Cuarto">${qs.map(([v, l]) => chip('shQ', v, l, v === q)).join('')}</div>`;
  const court = (t) => {
    const sel = rows.filter((r) => r[0] === t && (q === 0 || r[2] === q));
    const made = sel.filter((r) => r[5]).length, side = g.sides[t];
    const who = (r) => { const p = side.pl.find((x) => String(x[1]) === String(r[1])); return (p ? '#' + r[1] + ' ' + norm(p[0]) : '#' + r[1]) + ' · ' + r[2] + 'º cuarto'; };
    return `<div class="sec"><h3 style="font-size:15px">${esc(sh(side.name))}</h3>
      <p>${made}/${sel.length} tiros de campo${sel.length ? ' · ' + pct(100 * made / sel.length) : ''}</p>${courtSvg(sel, 'Tiros de ' + sh(side.name), who)}</div>`;
  };
  return `<div class="sec wide">${head}<p>● anotado · ✕ fallado. Todos los tiros se dibujan hacia el mismo aro; la línea de triple es la de la pista FIBA.</p>${chips}<div class="courts">${court(0)}${court(1)}</div></div>`;
}

function gameDetail(g) {
  const [hh, aa] = g.sides, [ch, ca] = g.c;
  const ot = g.q.length > 4;
  const qs = (i) => g.q.slice(0, 4).map((q) => q[i]).concat([ot ? g.q.slice(4).reduce((s, q) => s + q[i], 0) : '']);
  const qc = 'minmax(0,1fr) repeat(5,34px)';
  const efg = (c) => 100 * (c.fgm + 0.5 * c.p3m) / c.fga;
  const row = (l, hv, av, hb, ab, hs, as) => tbl('64px minmax(0,1fr) 64px', cell(hs != null ? hs : hv, hb ? 'b' : '') + `<span style="text-align:center;font-size:13px;color:var(--mut)">${esc(l)}</span>` + cell(as != null ? as : av, 'r ' + (ab ? 'b' : '')));
  const keys = [
    row('Posesiones', ch.poss, ca.poss, ch.poss > ca.poss, ca.poss > ch.poss, fmt(ch.poss, 0), fmt(ca.poss, 0)),
    row('Ataque (por 100)', 0, 0, ch.pts / ch.poss > ca.pts / ca.poss, ca.pts / ca.poss > ch.pts / ch.poss, fmt(100 * ch.pts / ch.poss), fmt(100 * ca.pts / ca.poss)),
    row('eFG%', 0, 0, efg(ch) > efg(ca), efg(ca) > efg(ch), pct(efg(ch)), pct(efg(ca))),
    row('Triples', 0, 0, ch.p3m > ca.p3m, ca.p3m > ch.p3m, ch.p3m + '/' + ch.p3a, ca.p3m + '/' + ca.p3a),
    row('Pérdidas', 0, 0, ch.tov < ca.tov, ca.tov < ch.tov, String(ch.tov), String(ca.tov)),
    row('Rebotes ofensivos', 0, 0, ch.orb > ca.orb, ca.orb > ch.orb, String(ch.orb), String(ca.orb)),
    row('Tiros libres', 0, 0, ch.ftm > ca.ftm, ca.ftm > ch.ftm, ch.ftm + '/' + ch.fta, ca.ftm + '/' + ca.fta),
    row('Asistencias', 0, 0, ch.ast > ca.ast, ca.ast > ch.ast, String(ch.ast), String(ca.ast)),
    row('Robos', 0, 0, ch.stl > ca.stl, ca.stl > ch.stl, String(ch.stl), String(ca.stl))
  ].join('');
  const pc = 'minmax(0,1fr) 38px 30px 30px 30px 34px 34px';
  const box = (s) => `<div class="sec"><h3>${esc(sh(s.name))}</h3>${tbl(pc, cell('') + ['MIN', 'PT', 'RB', 'AS', 'VA', '+/-'].map((x) => cell(x, 'r')).join(''), 'h')}
    ${s.pl.slice().sort((x, y) => y[3] - x[3] || y[2] - x[2]).map((p) => tbl(pc, cell(norm(p[0]), 'e') + cell(mmss(p[2]), 'r') + cell(p[3], 'r b') + cell(p[10] + p[11], 'r') + cell(p[12], 'r') + cell(p[18], 'r') + cell(p[19] > 0 ? '+' + p[19] : p[19], 'r'))).join('')}</div>`;
  return `<div class="det g2" style="padding-top:10px">
    <div class="sec">${tbl(qc, cell('Cuartos') + cell('1', 'r') + cell('2', 'r') + cell('3', 'r') + cell('4', 'r') + cell(ot ? 'Pr.' : '', 'r'), 'h')}
    ${tbl(qc, cell(sh(hh.name), 'e') + qs(0).map((x) => cell(x, 'r')).join(''))}${tbl(qc, cell(sh(aa.name), 'e') + qs(1).map((x) => cell(x, 'r')).join(''))}</div>
    <div class="sec"><h3>Claves del partido</h3>${tbl('64px minmax(0,1fr) 64px', cell(sh(hh.name)) + cell('') + cell(sh(aa.name), 'r'), 'h')}${keys}</div>
    ${shotSection(g)}${box(hh)}${box(aa)}<a class="wide" href="https://baloncestoenvivo.feb.es/partido/${g.i}" style="font-size:14px;font-weight:600">Acta completa en la FEB</a></div>`;
}


function qcol(v) {
  if (v == null || !isFinite(v)) return '';
  const a = Math.min(0.55, Math.abs(v) / 14);
  return v >= 0 ? `background:rgba(31,78,120,${a.toFixed(2)})${a > 0.35 ? ';color:#fff' : ''}` : `background:rgba(255,156,27,${a.toFixed(2)})`;
}
const qcell = (v, d) => `<span class="r qc" style="${qcol(v)}">${esc(sgn(v, d == null ? 1 : d))}</span>`;
const ord = (i) => (i + 1) + 'º';

function viewQ() {
  const teams = Object.values(C.T).sort((a, b) => b.anet - a.anet);
  const cols = 'minmax(0,1fr) repeat(4,44px)';
  let h = `<p class="hint">Diferencia media de puntos en cada cuarto (a favor − en contra). Azul: el equipo gana ese cuarto; naranja: lo pierde. Toca un equipo para ver el detalle y partido a partido.</p>`;
  h += `<div class="card" style="padding:10px 12px">${tbl(cols, cell('') + [1, 2, 3, 4].map((i) => cell(i + 'º', 'r')).join(''), 'h')}`;
  teams.forEach((t) => {
    h += tbl(cols, `<button type="button" class="qb ${t.name === VEN ? 'v' : ''}" data-a="qSel" data-v="${esc(t.name)}">${esc(t.short)}</button>` + t.q.map((q) => qcell(q.d)).join(''));
  });
  h += '</div>';
  h += '<div class="list">';
  teams.forEach((t) => {
    if (S.qSel !== t.name) return;
    h += `<div class="card open ${t.name === VEN ? 'v' : ''}"><div class="det g2" style="border:0;padding-top:12px"><h3 class="wide" style="font-family:Roboto,sans-serif;font-size:18px">${esc(t.short)}</h3>${qDetail(t)}</div></div>`;
  });
  return h + '</div>';
}


function pbpCalc(t) {
  const ng = t.pg, d10 = (pf, pa, sec) => (sec > 0 ? 10 * (pf - pa) / (sec / 60) : NaN);
  const tot = (p) => p.pq.reduce((x, q) => x + q.sec, 0);
  const pl = Object.values(C.P).filter((p) => p.teamFull === t.name && tot(p) > 0).sort((a, b) => tot(b) - tot(a)).slice(0, 9);
  const wq = t.qworst;
  const cand = pl.map((p) => {
    const q = p.pq[wq], tq = t.pq[wq];
    const on = d10(q.pf, q.pa, q.sec), off = d10(tq.pf - q.pf, tq.pa - q.pa, tq.sec - q.sec);
    return { p, on, off, gap: on - off, mins: q.sec / ng / 60 };
  }).filter((c) => c.mins >= 2.5 && isFinite(c.gap)).sort((a, b) => b.gap - a.gap);
  return { ng, d10, pl, wq, cand };
}
function pbpTxt(t, c) {
  let txt = `Datos de ${c.ng} ${c.ng === 1 ? 'partido' : 'partidos'} con jugada a jugada. `;
  if (c.cand.length >= 3) {
    const best = c.cand.slice(0, 2), worst = c.cand[c.cand.length - 1];
    const f = (x) => `${x.p.n} (${sgn(x.on, 0)} con él en pista, ${sgn(x.off, 0)} sin él)`;
    txt += `En el ${ord(c.wq)} cuarto, su periodo más flojo, el equipo rinde mejor con ${best.map(f).join(' y ')}, y peor con ${f(worst)}. Cifras por cada 10 minutos de juego.`;
  } else txt += 'Todavía hay pocos datos para comparar jugadores en su cuarto más flojo.';
  return txt;
}

function pbpSection(t) {
  if (!C.pbpN || !t.pg) return '<p class="hint">El jugada a jugada todavía no está descargado para este equipo. Aparecerá tras la próxima actualización automática.</p>';
  const c0 = pbpCalc(t), ng = c0.ng, d10 = c0.d10, pl = c0.pl, wq = c0.wq;
  const mc = 'minmax(0,1fr) repeat(4,40px)';
  let txt = pbpTxt(t, c0);
  txt += ' Es una correlación, no una causa: un jugador que comparte pista con los titulares, o con los suplentes rivales, parece mejor de lo que es.';
  const head = (l) => tbl(mc, cell(l) + [1, 2, 3, 4].map((i) => cell(i + 'º', 'r')).join(''), 'h');
  const minRows = pl.map((p) => tbl(mc, cell(p.n, 'e') + p.pq.map((q) => cell(fmt(q.sec / ng / 60), 'r')).join(''))).join('');
  const dRows = pl.map((p) => tbl(mc, cell(p.n, 'e') + p.pq.map((q) => (q.sec >= 60 * ng ? qcell(d10(q.pf, q.pa, q.sec), 0) : cell('—', 'r'))).join(''))).join('');
  const teamRow = tbl(mc, cell('Equipo', 'e b') + t.pq.map((q) => qcell(d10(q.pf, q.pa, q.sec), 0)).join(''));
  return `<div class="sec wide"><h3>¿Influye quién está en pista?</h3><p>${esc(txt)}</p></div>
    <div class="sec"><h3>Minutos por partido en cada cuarto</h3>${head('')}${minRows}</div>
    <div class="sec"><h3>Dif. del equipo con él en pista (por 10 min)</h3>${head('')}${teamRow}${dRows}<p>Se muestra solo si el jugador ha sumado al menos un minuto por partido en ese cuarto.</p></div>`;
}

function qDetail(t) {
  const n = t.qg.length, w = t.q[t.qworst], b = t.q[t.qbest];
  const clear = (q) => Math.abs(q.bias) >= 2 * Math.max(q.se, 1.5);
  let txt = `Con ${n} ${n === 1 ? 'partido' : 'partidos'}: su cuarto más fuerte es el ${ord(t.qbest)} (${sgn(b.d)} de media) y el más flojo el ${ord(t.qworst)} (${sgn(w.d)}). `;
  txt += clear(w) || clear(b) ? 'La diferencia con su media es notable.' : 'La diferencia con su propia media todavía es pequeña frente a la variación entre partidos: puede ser casualidad.';
  const cols = 'minmax(0,1fr) repeat(4,44px)';
  const rows = [
    ['A favor', t.q.map((q) => fmt(q.f)), false],
    ['En contra', t.q.map((q) => fmt(q.c)), false],
    ['Diferencia', t.q.map((q) => sgn(q.d)), true],
    ['Respecto a su media', t.q.map((q) => sgn(q.bias)), true],
    ['Cuartos ganados', t.q.map((q) => q.won + '/' + n), false],
    ['Cuartos perdidos', t.q.map((q) => q.lost + '/' + n), false]
  ];
  const gcols = 'minmax(0,1fr) repeat(4,38px)';
  return `<p class="hint wide">${esc(txt)}</p>
    <div class="sec">${tbl(cols, cell('') + [1, 2, 3, 4].map((i) => cell(i + 'º', 'r')).join(''), 'h')}
    ${rows.map(([l, vs, c]) => tbl(cols, cell(l) + vs.map((v, i) => c ? `<span class="r qc" style="${qcol(l === 'Diferencia' ? t.q[i].d : t.q[i].bias)}">${esc(v)}</span>` : cell(v, 'r')).join(''))).join('')}</div>
    <div class="sec"><h3>1ª parte vs 2ª parte</h3>${tbl('minmax(0,1fr) 70px 70px', cell('') + cell('1ª parte', 'r') + cell('2ª parte', 'r'), 'h')}${tbl('minmax(0,1fr) 70px 70px', cell('Diferencia por partido') + qcell(t.qh1) + qcell(t.qh2))}</div>
    <div class="sec"><h3>Partido a partido</h3>${tbl(gcols, cell('') + [1, 2, 3, 4].map((i) => cell(i + 'º', 'r')).join(''), 'h')}
    ${t.qg.map((g) => tbl(gcols, cell('J' + g.j + ' ' + (g.home ? 'vs' : 'en') + ' ' + g.rival, 'e') + g.d.map((v) => qcell(v, 0)).join(''))).join('')}</div>
    ${pbpSection(t)}`;
}

/* ---------- informe de equipo ---------- */
const RM = [
  { id: 'ao', l: 'Ataque ajustado', get: (t) => t.ao, hi: true, f: (x) => fmt(x), s: 'Ataque muy eficiente', w: 'Ataque poco eficiente', ts: 'Su ataque es de los mejores del grupo: hay que defender bien cada posesión.', tw: 'Le cuesta anotar: cualquier defensa ordenada le incomoda.' },
  { id: 'ad', l: 'Defensa ajustada', get: (t) => t.ad, hi: false, f: (x) => fmt(x), s: 'Defensa sólida', w: 'Defensa frágil', ts: 'Defiende muy bien: conviene tener paciencia y buscar buenos tiros.', tw: 'Su defensa concede mucho: merece la pena atacar rápido y con intención.' },
  { id: 'pace', l: 'Ritmo (pos./40 min)', get: (t) => t.pace, hi: true, f: (x) => fmt(x), neutral: true },
  { id: 'efg', l: 'eFG% (acierto)', get: (t) => t.efg, hi: true, f: pct, s: 'Mucho acierto de tiro', w: 'Poco acierto de tiro', ts: 'Tira con mucho acierto: hay que obligarle a tiros difíciles.', tw: '' },
  { id: 'oefg', l: 'eFG% que permite', get: (t) => t.oefg, hi: false, f: pct, s: 'Obliga a los rivales a tirar mal', w: 'Permite mucho acierto a los rivales', ts: '', tw: 'Concede tiros cómodos: los rivales anotan con facilidad contra él.' },
  { id: 'tov', l: 'Pérdidas (% pos.)', get: (t) => t.tov, hi: false, f: pct, s: 'Cuida el balón', w: 'Pierde muchos balones', ts: 'Pierde pocos balones: ganar el partido por robos será difícil.', tw: 'Pierde muchos balones: presionar la salida de balón puede dar frutos.' },
  { id: 'otov', l: 'Pérdidas que provoca', get: (t) => t.otov, hi: true, f: pct, s: 'Provoca muchas pérdidas rivales', w: 'Provoca pocas pérdidas rivales', ts: 'Provoca muchas pérdidas: hay que cuidar el balón y la circulación.', tw: '' },
  { id: 'orb', l: 'Rebote ofensivo', get: (t) => t.orb, hi: true, f: pct, s: 'Fuerte en rebote ofensivo', w: 'Flojo en rebote ofensivo', ts: 'Captura muchos rebotes de ataque: cerrar bien el rebote defensivo.', tw: '' },
  { id: 'drb', l: 'Rebote defensivo', get: (t) => t.drb, hi: true, f: pct, s: 'Fuerte en rebote defensivo', w: 'Flojo en rebote defensivo', ts: 'Casi no regala segundas oportunidades.', tw: 'Regala rebotes de ataque: merece la pena cargar el rebote ofensivo.' },
  { id: 'ftr', l: 'Libres / tiro campo', get: (t) => t.ftr, hi: true, f: pct, s: 'Llega mucho a la línea de libres', w: 'Llega poco a la línea de libres', ts: 'Provoca muchas faltas: evitar faltas innecesarias.', tw: '' },
  { id: 'oftr', l: 'Libres que concede', get: (t) => t.oftr, hi: false, f: pct, s: 'Concede pocos libres', w: 'Concede muchos libres', ts: '', tw: 'Concede muchas faltas: atacar el aro puede llevar a los rivales a la línea.' },
  { id: 'p3', l: 'Triples %', get: (t) => t.p3, hi: true, f: pct, s: 'Acierta de tres', w: 'Falla de tres', ts: 'Tira muy bien de tres: cerrar el perímetro.', tw: 'Falla de tres: se le puede dar espacio fuera.' },
  { id: 'p2', l: 'Tiros de 2 %', get: (t) => t.p2, hi: true, f: pct, s: 'Acierta de dos', w: 'Falla de dos', ts: '', tw: '' },
  { id: 'ft', l: 'Tiros libres %', get: (t) => t.ft, hi: true, f: pct, s: 'Buen tirador de libres', w: 'Flojo en libres', ts: '', tw: 'Flojo en libres: se puede apretar al final de los partidos.' },
  { id: 'astto', l: 'Asist. / pérdida', get: (t) => t.astto, hi: true, f: (x) => fmt(x, 2), s: 'Mucho juego colectivo', w: 'Poco juego colectivo', ts: '', tw: '' }
];
const rankOf = (t, m) => Object.values(C.T).slice().sort((a, b) => (m.hi ? m.get(b) - m.get(a) : m.get(a) - m.get(b))).findIndex((x) => x.name === t.name) + 1;
const zoneOf = (r) => { const d = Math.hypot(Math.min(r[3], 50) * 0.28 - 1.575, (r[4] - 50) * 0.15); return d < 2 ? 0 : d >= 6.4 ? 2 : 1; };
const ZN = ['Cerca del aro', 'Media distancia', 'Triples'];

function zonesFor(t) {
  const z = () => [0, 1, 2].map(() => ({ a: 0, m: 0 }));
  const own = z(), opp = z(), lg = z(), rowsOwn = [], rowsOpp = [];
  let n = 0;
  C.games.forEach((g) => {
    const rows = SH[g.i];
    if (!rows) return;
    rows.forEach((r) => { const k = zoneOf(r); lg[k].a += 1; lg[k].m += r[5]; });
    const s = g.sides.findIndex((x) => x.name === t.name);
    if (s < 0) return;
    n += 1;
    rows.forEach((r) => {
      const k = zoneOf(r), tgt = r[0] === s ? own : opp;
      tgt[k].a += 1; tgt[k].m += r[5];
      (r[0] === s ? rowsOwn : rowsOpp).push(r);
    });
  });
  return { own, opp, lg, rowsOwn, rowsOpp, n };
}

function viewRe() {
  const N = Object.keys(C.T).length;
  const teams = Object.values(C.T).sort((a, b) => (a.name === VEN ? -1 : b.name === VEN ? 1 : a.short.localeCompare(b.short, 'es')));
  const t = C.T[S.reT] || C.T[VEN] || teams[0];
  const all = Object.values(C.T);
  const rk = RM.map((m) => ({ m, v: m.get(t), r: rankOf(t, m), avg: all.reduce((x, y) => x + m.get(y), 0) / N }));
  const rA = rankOf(t, { get: (x) => x.anet, hi: true });
  const strong = rk.filter((x) => !x.m.neutral && x.r <= 3).sort((a, b) => a.r - b.r).slice(0, 5);
  const weak = rk.filter((x) => !x.m.neutral && x.r >= N - 2).sort((a, b) => b.r - a.r).slice(0, 5);
  const pace = rk.find((x) => x.m.id === 'pace');
  const paceWord = pace.r <= Math.ceil(N / 4) ? 'alto' : pace.r > N - Math.ceil(N / 4) ? 'bajo' : 'medio';
  const li = (x, k) => `<li><b>${esc(x.m[k])}</b> · ${esc(x.m.f(x.v))} <span class="rk">(puesto ${x.r} de ${N})</span></li>`;

  // resumen
  const resumen = `${t.short} suma ${t.w} ${t.w === 1 ? 'victoria' : 'victorias'} y ${t.l} ${t.l === 1 ? 'derrota' : 'derrotas'} en ${t.gp} partidos (${fmt(t.ppg)} puntos a favor y ${fmt(t.papg)} en contra por partido). Ocupa el puesto ${rA} de ${N} en diferencia neta ajustada por rival (${sgn(t.anet)} por 100 posesiones), con un ataque ajustado de ${fmt(t.ao)} (puesto ${rk[0].r}) y una defensa ajustada de ${fmt(t.ad)} (puesto ${rk[1].r}). Juega a ritmo ${paceWord}: ${fmt(t.pace)} posesiones por 40 minutos (puesto ${pace.r}). Sus rivales han tenido una fuerza media de ${sgn(t.sos)}.`;

  // forma reciente
  const last = t.games.slice().sort((a, b) => a.j - b.j).slice(-3);
  const lnet = last.reduce((x, g) => x + g.ort - g.drt, 0) / last.length;
  const lw = last.filter((g) => g.win).length;
  const trendWord = t.gp < 4 ? '' : lnet - t.net >= 5 ? ' Llega en alza.' : lnet - t.net <= -5 ? ' Llega a la baja.' : ' Se mantiene estable.';
  const forma = `Últimos ${last.length} partidos: ${lw} ${lw === 1 ? 'victoria' : 'victorias'} y ${last.length - lw} ${last.length - lw === 1 ? 'derrota' : 'derrotas'}, con una diferencia neta de ${sgn(lnet)} por 100 posesiones (en toda la temporada, ${sgn(t.net)}).${trendWord}`;

  // cuartos
  const wq = t.q[t.qworst], bq = t.q[t.qbest];
  const clear = (q) => Math.abs(q.bias) >= 2 * Math.max(q.se, 1.5);
  const cuartos = `Su cuarto más fuerte es el ${ord(t.qbest)} (${sgn(bq.d)} por partido) y el más flojo el ${ord(t.qworst)} (${sgn(wq.d)}). En la primera parte la diferencia media es ${sgn(t.qh1)} y en la segunda ${sgn(t.qh2)}. ` + (clear(wq) || clear(bq) ? 'La diferencia con su propia media es notable.' : 'Con los partidos disputados todavía puede ser casualidad.');
  const pc = C.pbpN && t.pg ? pbpCalc(t) : null;
  const enPista = pc ? pbpTxt(t, pc) + ' Es una correlación, no una causa.' : '';

  // jugadores
  const pl = Object.values(C.P).filter((p) => p.teamFull === t.name);
  const top = pl.slice().sort((a, b) => b.val_g - a.val_g).slice(0, 6);
  const byPts = pl.slice().sort((a, b) => b.pts - a.pts);
  const share = t.m.pts ? 100 * (byPts[0].pts + (byPts[1] ? byPts[1].pts : 0)) / t.m.pts : NaN;
  const secs = pl.reduce((x, p) => x + p.sec, 0), top5 = pl.slice().sort((a, b) => b.sec - a.sec).slice(0, 5).reduce((x, p) => x + p.sec, 0);
  const rot = pl.filter((p) => p.mpg >= 10).length;
  const jug = `${byPts[0].n} y ${byPts[1] ? byPts[1].n : '—'} anotan el ${pct(share)} de los puntos del equipo. Los cinco jugadores que más juegan suman el ${pct(100 * top5 / secs)} de los minutos y ${rot} jugadores superan los 10 minutos por partido.`;
  const pcols = 'minmax(0,1fr) 34px 38px 34px 34px 50px 38px';
  const tabJ = tbl(pcols, cell('') + ['MIN', 'PTS', 'REB', 'AST', 'TS%', 'VAL'].map((x) => cell(x, 'r')).join(''), 'h') +
    top.map((p) => tbl(pcols, cell(p.n, 'e') + cell(fmt(p.mpg, 0), 'r') + cell(fmt(p.pts_g), 'r b') + cell(fmt(p.reb_g), 'r') + cell(fmt(p.ast_g), 'r') + cell(pct(p.ts), 'r') + cell(fmt(p.val_g), 'r'))).join('');

  // tabla comparativa con la liga
  const tcols = 'minmax(0,1fr) 52px 50px 46px';
  const tabM = tbl(tcols, cell('') + cell('Valor', 'r') + cell('Liga', 'r') + cell('Puesto', 'r'), 'h') + rk.map((x) => {
    const good = x.m.neutral ? '' : x.r <= Math.ceil(N / 3) ? 'rp-g' : x.r > N - Math.ceil(N / 3) ? 'rp-b' : '';
    return tbl(tcols, cell(x.m.l, 'e') + cell(x.m.f(x.v), 'r b') + cell(x.m.f(x.avg), 'r') + `<span class="r"><span class="pill ${good}">${x.r}º</span></span>`);
  }).join('');

  // factores y tiro
  const fac = (l, mine, theirs, f, hi) => { const w = hi ? mine > theirs : mine < theirs; return tbl('minmax(0,1fr) 64px 64px', cell(l) + cell(f(mine), 'r ' + (w ? 'b' : '')) + cell(f(theirs), 'r ' + (w ? '' : 'b'))); };
  const factores = tbl('minmax(0,1fr) 64px 64px', cell('') + cell('Equipo', 'r') + cell('Rivales', 'r'), 'h') +
    fac('Acierto de tiro (eFG%)', t.efg, t.oefg, pct, true) + fac('Pérdidas por posesión', t.tov, t.otov, pct, false) + fac('Rebote ofensivo', t.orb, t.oorb, pct, true) + fac('Libres por tiro de campo', t.ftr, t.oftr, pct, true);

  let tiro = '<p>El gráfico de tiro de esta temporada se mostrará tras la próxima actualización automática.</p>';
  const Z = zonesFor(t);
  if (Z.n) {
    const tot = (a) => a.reduce((x, y) => x + y.a, 0);
    const zc = 'minmax(0,1fr) 50px 54px 50px';
    const zt = (arr, title) => `<div><h4>${title}</h4>` + tbl(zc, cell('Zona') + cell('Tiros', 'r') + cell('Acierto', 'r') + cell('Liga', 'r'), 'h') + arr.map((z, k) => tbl(zc, cell(ZN[k], 'e') + cell(pct(100 * z.a / tot(arr)), 'r') + cell(z.a ? pct(100 * z.m / z.a) : '—', 'r b') + cell(pct(100 * Z.lg[k].m / Z.lg[k].a), 'r'))).join('') + '</div>';
    tiro = `<p>Reparto de los tiros de campo por zonas y acierto en cada una, frente a la media de la liga (clasificación aproximada a partir de la posición del tiro). Datos de ${Z.n} ${Z.n === 1 ? 'partido' : 'partidos'}.</p>
      <div class="shotcols">${zt(Z.own, 'Sus tiros')}${zt(Z.opp, 'Tiros que permite')}</div>
      <div class="courts"><div class="sec"><h3 style="font-size:15px">Sus tiros</h3>${courtSvg(Z.rowsOwn, 'Tiros de ' + t.short)}</div><div class="sec"><h3 style="font-size:15px">Rivales</h3>${courtSvg(Z.rowsOpp, 'Tiros que permite ' + t.short)}</div></div><p class="rk">● anotado · ✕ fallado. Todos los tiros se dibujan hacia el mismo aro.</p>`;
  }

  // claves
  const tips = [];
  weak.forEach((x) => { if (x.m.tw) tips.push(x.m.tw + ` (puesto ${x.r} de ${N})`); });
  strong.forEach((x) => { if (x.m.ts) tips.push(x.m.ts + ` (puesto ${x.r} de ${N})`); });
  const claves = tips.slice(0, 6);

  const partidos = t.games.slice().sort((a, b) => a.j - b.j).map((g) => `<div class="gl">${vdChip(g.win)}<span>J${g.j} · ${g.home ? 'vs' : 'en'} ${esc(g.rival)}</span><strong>${esc(g.score)}</strong></div>`).join('');

  const chips = `<div class="chips noprint" role="group" aria-label="Equipo">${teams.map((x) => chip('reT', x.name, x.short, x.name === t.name)).join('')}</div>`;
  return `${chips}<article class="rp"><div class="rp-head"><div><h2>Informe · ${esc(t.short)}</h2><p class="rk">${esc(t.name)} · Tercera FEB, Grupo B-A · tras ${C.games.reduce((m, g) => Math.max(m, g.j), 0)} jornadas</p></div><button type="button" class="tg noprint" data-a="print">Imprimir / PDF</button></div>
    <div class="rgrid">
      <section class="box full"><h3>Resumen</h3><p>${esc(resumen)}</p><p>${esc(forma)}</p></section>
      <section class="box"><h3>Puntos fuertes</h3>${strong.length ? `<ul>${strong.map((x) => li(x, 's')).join('')}</ul>` : '<p>Ninguna métrica entre las tres mejores del grupo.</p>'}</section>
      <section class="box"><h3>Puntos débiles</h3>${weak.length ? `<ul>${weak.map((x) => li(x, 'w')).join('')}</ul>` : '<p>Ninguna métrica entre las tres peores del grupo.</p>'}</section>
      <section class="box full"><h3>Claves para jugar contra ellos</h3>${claves.length ? `<ul>${claves.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p>Perfil equilibrado: no hay ninguna métrica claramente extrema.</p>'}<p class="rk">Deducidas de las estadísticas; con pocos partidos pueden cambiar.</p></section>
      <section class="box"><h3>Comparación con la liga</h3>${tabM}</section>
      <section class="box"><h3>Cuatro factores</h3>${factores}<h4>Forma reciente</h4>${last.map((g) => `<div class="gl">${vdChip(g.win)}<span>J${g.j} · ${g.home ? 'vs' : 'en'} ${esc(g.rival)}</span><strong>${esc(g.score)}</strong></div>`).join('')}</section>
      <section class="box"><h3>Cuartos</h3><p>${esc(cuartos)}</p>${tbl('minmax(0,1fr) repeat(4,40px)', cell('Dif. media') + t.q.map((q) => qcell(q.d)).join(''))}${enPista ? `<p>${esc(enPista)}</p>` : ''}</section>
      <section class="box"><h3>Jugadores</h3><p>${esc(jug)}</p>${tabJ}</section>
      <section class="box full"><h3>Partidos</h3><div class="pgrid">${partidos}</div></section>
      <section class="box full shotpage"><h2 class="printonly">Informe · ${esc(t.short)} · Tiro</h2><h3>Información de tiro</h3>${tiro}</section>
    </div></article>`;
}

function viewGuide() {
  const lastJ = C.games.reduce((m, g) => Math.max(m, g.j), 0);
  const list = (arr) => arr.map(([t, d]) => `<div class="gd"><strong>${esc(t)}</strong><span>${esc(d)}</span></div>`).join('');
  return `<div class="gs"><h2>De dónde salen los datos</h2>
    <p>Todo se calcula a partir de las actas finales de la FEB de cada partido terminado del grupo B-A: ${C.games.length} partidos hasta la jornada ${lastJ}, con ${Object.keys(C.P).length} jugadores de ${Object.keys(C.T).length} equipos. Los partidos en juego no cuentan.</p>
    <p>Los datos se actualizan solos cada día; al terminar cada jornada aparecen en la app. Última actualización: ${esc(updatedLabel())}.</p>
    <p>Con pocos partidos las cifras se mueven mucho. Los porcentajes de tiro solo entran en la clasificación si hay un mínimo de intentos.</p></div>
    <div class="gs"><h2>Equipos</h2>${list(GUIDE_TEAM)}</div><div class="gs"><h2>Jugadores</h2>${list(GUIDE_PLAYER)}</div>
    <a href="https://baloncestoenvivo.feb.es" style="font-size:14px;font-weight:600">Fuente: baloncestoenvivo.feb.es</a>`;
}

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function updatedLabel() {
  const d = new Date(DATA.updated);
  if (isNaN(d)) return '—';
  return d.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const TABS = [['eq', 'Equipos'], ['ju', 'Jugadores'], ['qu', 'Cuartos'], ['pa', 'Partidos'], ['re', 'Informe'], ['gu', 'Guía']];
function render() {
  document.getElementById('tabs').innerHTML = TABS.map(([id, l]) => `<button type="button" data-a="tab" data-v="${id}" ${S.tab === id ? 'aria-current="page"' : ''}>${l}</button>`).join('');
  const lastJ = C.games.reduce((m, g) => Math.max(m, g.j), 0);
  const lastD = C.games.reduce((m, g) => (g.d > m ? g.d : m), '').split('-');
  document.getElementById('head-right').textContent = 'J' + lastJ + ' · ' + parseInt(lastD[2], 10) + ' ' + MES[parseInt(lastD[1], 10) - 1];
  const v = { eq: viewEq, ju: viewJu, qu: viewQ, pa: viewPa, re: viewRe, gu: viewGuide }[S.tab];
  document.getElementById('view').innerHTML = v();
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]');
  if (!el || !C) return;
  const a = el.dataset.a, v = el.dataset.v;
  const y = window.scrollY;
  if (a === 'print') { window.print(); return; }
  if (a === 'tab') { S.tab = v; window.scrollTo(0, 0); }
  else if (a === 'eqSort') S.eqSort = v;
  else if (a === 'eqSel') S.eqSel = S.eqSel === v ? null : v;
  else if (a === 'juSort') { S.juSort = v; S.juLim = 25; }
  else if (a === 'juTeam') { S.juTeam = v; S.juLim = 25; }
  else if (a === 'juMin') { S.juMin = !S.juMin; S.juLim = 25; }
  else if (a === 'juSel') S.juSel = S.juSel === v ? null : v;
  else if (a === 'more') S.juLim += 25;
  else if (a === 'reT') S.reT = v;
  else if (a === 'qSel') S.qSel = S.qSel === v ? null : v;
  else if (a === 'paJ') { S.paJ = Number(v); S.paSel = null; }
  else if (a === 'shQ') S.shQ = Number(v);
  else if (a === 'paSel') S.paSel = S.paSel === Number(v) ? null : Number(v);
  render();
  if (a !== 'tab') window.scrollTo(0, y);
});

fetch('data.json', { cache: 'no-cache' }).then((r) => r.json()).then((d) => fetch('pbp.json', { cache: 'no-cache' })
  .then((r) => (r.ok ? r.json() : { games: {} })).catch(() => ({ games: {} }))
  .then((pb) => fetch('shots.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : { games: {} })).catch(() => ({ games: {} }))
    .then((sj) => { SH = sj.games || {}; DATA = d; C = compute(d.games); addPbp(C, pb); render(); }))).catch(() => {
  document.getElementById('view').innerHTML = '<p class="empty">No se han podido cargar los datos. Comprueba la conexión e inténtalo de nuevo.</p>';
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
