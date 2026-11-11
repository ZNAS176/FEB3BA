// Revisa fecha y hora de los partidos pendientes de los próximos días (una vez al día)
// y las guarda en calendario.json. Los cambios se anotan en "prev" (horario anterior).
// Es tolerante: si la FEB no devuelve la fecha de un partido, se deja como está.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FILE = new URL('../calendario.json', import.meta.url);

function offset(date) {
  const s = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', timeZoneName: 'longOffset' }).formatToParts(date).find((x) => x.type === 'timeZoneName').value;
  return s === 'GMT' ? '+00:00' : s.replace('GMT', '');
}
// "04-10-2026 - 12:00" (hora de Madrid) -> "2026-10-04T12:00:00+02:00"
export function febToISO(txt) {
  const m = /(\d{2})[-/](\d{2})[-/](\d{4})\s*-?\s*(\d{1,2}):(\d{2})/.exec(txt || '');
  if (!m) return null;
  const local = `${m[3]}-${m[2]}-${m[1]}T${m[4].padStart(2, '0')}:${m[5]}:00`;
  for (const off of ['+01:00', '+02:00']) if (offset(new Date(local + off)) === off) return local + off;
  return local + '+01:00';
}

export async function updateCalendar(getJson) {
  if (!existsSync(FILE)) return false;
  const C = JSON.parse(readFileSync(FILE, 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  if (C.checked === today) { console.log('Calendario: ya revisado hoy.'); return false; }
  const now = Date.now(), DAY = 864e5;
  const all = C.jornadas.flatMap((J) => J.matches);
  const todo = all.filter((m) => { const t = new Date(m.ko).getTime(); return t > now - DAY && t < now + 12 * DAY; });
  let changed = 0, read = 0;
  for (const m of todo) {
    let j = null;
    try { j = await getJson(m.p); } catch (e) { console.warn('Calendario', m.p, e.message); }
    const ko = febToISO(j && j.HEADER && j.HEADER.starttime);
    if (!ko) continue;
    read++;
    const dif = Math.abs(new Date(ko) - new Date(m.ko));
    if (dif > 60000 && dif < 90 * DAY) { m.prev = m.prev || m.ko; m.ko = ko; changed++; console.log(`Calendario: ${m.p} ahora ${ko}`); }
  }
  C.checked = today;
  if (changed) C.updated = new Date().toISOString();
  writeFileSync(FILE, JSON.stringify(C));
  console.log(`Calendario: ${todo.length} partidos revisados (${read} con fecha), ${changed} cambios.`);
  return true;
}
