# FEB3 BA

Estadísticas avanzadas de equipos y jugadores del grupo B-A de Tercera FEB, calculadas a partir de las actas finales de la FEB.

- App web instalable (PWA) con el logo de la competición como icono.
- `scripts/update.mjs` descarga las actas nuevas y actualiza `data.json`.
- `.github/workflows/update.yml` lo ejecuta de forma automática tras los partidos del fin de semana y publica en GitHub Pages.

## Puesta en marcha
1. Settings → Pages → Source: **GitHub Actions**.
2. Actions → "Actualizar datos y publicar" → Run workflow.
3. Abre la URL de Pages en el móvil y usa "Añadir a pantalla de inicio".

## Dos bloques

- **Estadística**: Equipos, Jugadores, Cuartos, Partidos, Informe, Comparar y Guía.
- **Liga** (seguimiento): Mi equipo (próximo partido, último resultado, cambios de horario), Calendario,
  Resultados por jornada (tocar un partido abre su estadística), Clasificación (calculada con las actas) y
  Vs liga (equipo frente a la media del grupo y ranking por métrica).
- `calendario.json` guarda el calendario completo (26 jornadas). `scripts/calendario.mjs` revisa a diario
  los partidos de los próximos 12 días y anota los cambios de fecha u hora.
