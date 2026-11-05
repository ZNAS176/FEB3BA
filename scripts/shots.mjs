// Convierte la respuesta ShotChart de la FEB en una lista compacta de tiros, todos orientados
// hacia el mismo aro (la canasta que ataca cada equipo en cada parte queda a la izquierda).
// Fila: [equipo (0 local, 1 visitante), dorsal, cuarto, x (0-50, largo de la pista en %), y (0-100, ancho en %), anotado (1/0)]
const med = (a) => { const s = a.slice().sort((p, q) => p - q); return s[s.length >> 1]; };
const r1 = (v) => Math.round(v * 10) / 10;

export function buildShots(j) {
  const S = j && j.SHOTCHART && j.SHOTCHART.SHOTS;
  if (!S) return null;
  const sh = Object.values(S).filter((s) => s && s.x != null && s.y != null).map((s) => ({
    t: Number(s.team) || 0, no: Number(s.player) || 0, q: Number(s.quarter) || 1, x: Number(s.x), y: Number(s.y), m: Number(s.m) === 1 ? 1 : 0
  }));
  if (!sh.length) return null;
  const half = (q) => (q <= 2 ? 0 : q <= 4 ? 1 : q);
  const right = new Map(); // `${equipo}|${parte}` -> ataca la canasta de la derecha
  for (const t of [0, 1]) {
    for (const h of new Set(sh.filter((s) => s.t === t).map((s) => half(s.q)))) {
      const xs = sh.filter((s) => s.t === t && half(s.q) === h).map((s) => s.x);
      if (xs.length >= 3) right.set(t + '|' + h, med(xs) > 50);
    }
  }
  const side = (t, q) => {
    const h = half(q);
    if (right.has(t + '|' + h)) return right.get(t + '|' + h);
    if (h <= 1 && right.has(t + '|' + (1 - h))) return !right.get(t + '|' + (1 - h));
    const o = 1 - t; // el rival ataca el aro contrario
    if (right.has(o + '|' + h)) return !right.get(o + '|' + h);
    return false;
  };
  return sh.map((s) => [s.t, s.no, s.q, r1(side(s.t, s.q) ? 100 - s.x : s.x), r1(s.y), s.m]);
}
