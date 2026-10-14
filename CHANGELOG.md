# Cambios

## 0.2.0 — Fase 2 experimental

- Adaptadores reales TV Más/EU/Kim auditados contra tres capturas privadas, normalización Markdown, mojibake, campos y URLs estructurados, ids/deduplicación con tiempos desconocidos explícitos.
- Lector informativo nativo paginado y filtrable en Ajustes, con sección resumen. API 6 justificada por UI de ajustes/sección; sin navegador oculto o backend.
- M3U ahora opcional globalmente; si está configurada, conserva playlist/XMLTV y reproducción directa de 0.1.1.
- Caché/limitación de frecuencia, errores tipados por fuente, URLs de opciones sin playback, widgets sociales separados de eventos.
- Scrapling y Crawl4AI instalados y ejecutados junto al baseline BeautifulSoup en todo el corpus; métricas y scripts reproducibles, sin LLM/JS/red en benchmark.
- Fixtures públicos sintéticos; nuevas pruebas CSS y HTTP, CI Node 18/24. HTML completo del usuario fuera de Git.
- Validación manual 0.1.1 confirmada por el usuario; pruebas Android de 0.2.0 pendientes. Sin merge/release.

## 0.1.1 — MVP para revisión

- Sustituye el runtime de la plantilla por el prototipo M3U auditado, con id propio y API mínima 3.
- Valida `m3uUrl` y `epgUrl`, sin registrar valores; consumo nativo M3U/XMLTV y reproducción directa.
- Corrige la página vacía de canales y confirma argumentos, exports, hosts y consentimiento con el SDK.
- Añade pruebas offline, integración HTTP/SDK y demo sintética HLS/XMLTV, CI Node 18/24.
- Documenta fuentes bloqueadas, autorización de medios de prueba, arquitectura futura, resultados y guía Android.
- Retira funcionalidades/medios del servidor multimedia de ejemplo que no pertenecen al MVP; conserva SDK/contrato/tipos/licencia.
- Sin release, merge ni declaración de estabilidad. Reproducción Android pendiente.

## 0.1.0 — Prototipo adjunto

- Declaración de playlist M3U configurable y XMLTV opcional.
- Pruebas simuladas reportadas en el encargo; no constituyen una validación SDK ni reproducción en Android.
