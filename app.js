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
  const teamOf = (name) => T[name] || (T[name] = { name, short: sh(name), gp: 0, w: 0, l: 0, gm: 0, m: blank(), o: blank(), games: [] });

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
const S = { tab: 'eq', eqSort: 'anet', eqSel: null, juSort: 'val', juTeam: 'all', juMin: true, juSel: null, juLim: 25, paSel: null };
let DATA = null, C = null;

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
  return `<div class="det"><div class="tiles">${tiles.map(([l, v]) => tile(l, v)).join('')}</div>
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
  const gs = C.games.slice().sort((a, b) => b.i - a.i);
  let h = '<div class="list">';
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
  return `<div class="det" style="padding-top:10px">
    ${tbl(qc, cell('Cuartos') + cell('1', 'r') + cell('2', 'r') + cell('3', 'r') + cell('4', 'r') + cell(ot ? 'Pr.' : '', 'r'), 'h')}
    ${tbl(qc, cell(sh(hh.name), 'e') + qs(0).map((x) => cell(x, 'r')).join(''))}${tbl(qc, cell(sh(aa.name), 'e') + qs(1).map((x) => cell(x, 'r')).join(''))}
    <div class="sec"><h3>Claves del partido</h3>${tbl('64px minmax(0,1fr) 64px', cell(sh(hh.name)) + cell('') + cell(sh(aa.name), 'r'), 'h')}${keys}</div>
    ${box(hh)}${box(aa)}<a href="https://baloncestoenvivo.feb.es/partido/${g.i}" style="font-size:14px;font-weight:600">Acta completa en la FEB</a></div>`;
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

const TABS = [['eq', 'Equipos'], ['ju', 'Jugadores'], ['pa', 'Partidos'], ['gu', 'Guía']];
function render() {
  document.getElementById('tabs').innerHTML = TABS.map(([id, l]) => `<button type="button" data-a="tab" data-v="${id}" ${S.tab === id ? 'aria-current="page"' : ''}>${l}</button>`).join('');
  const lastJ = C.games.reduce((m, g) => Math.max(m, g.j), 0);
  const lastD = C.games.reduce((m, g) => (g.d > m ? g.d : m), '').split('-');
  document.getElementById('head-right').textContent = 'J' + lastJ + ' · ' + parseInt(lastD[2], 10) + ' ' + MES[parseInt(lastD[1], 10) - 1];
  const v = { eq: viewEq, ju: viewJu, pa: viewPa, gu: viewGuide }[S.tab];
  document.getElementById('view').innerHTML = v();
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]');
  if (!el || !C) return;
  const a = el.dataset.a, v = el.dataset.v;
  const y = window.scrollY;
  if (a === 'tab') { S.tab = v; window.scrollTo(0, 0); }
  else if (a === 'eqSort') S.eqSort = v;
  else if (a === 'eqSel') S.eqSel = S.eqSel === v ? null : v;
  else if (a === 'juSort') { S.juSort = v; S.juLim = 25; }
  else if (a === 'juTeam') { S.juTeam = v; S.juLim = 25; }
  else if (a === 'juMin') { S.juMin = !S.juMin; S.juLim = 25; }
  else if (a === 'juSel') S.juSel = S.juSel === v ? null : v;
  else if (a === 'more') S.juLim += 25;
  else if (a === 'paSel') S.paSel = S.paSel === Number(v) ? null : Number(v);
  render();
  if (a !== 'tab') window.scrollTo(0, y);
});

fetch('data.json', { cache: 'no-cache' }).then((r) => r.json()).then((d) => {
  DATA = d; C = compute(d.games); render();
}).catch(() => {
  document.getElementById('view').innerHTML = '<p class="empty">No se han podido cargar los datos. Comprueba la conexión e inténtalo de nuevo.</p>';
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
