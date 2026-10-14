# Cambios

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
