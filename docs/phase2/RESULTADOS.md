# Resultados verificables · Fase 2

Fecha: 14 de octubre de 2026, America/Santiago. Base **codex/sports-live-mvp**, commit `db027ba8cefa3824a0a6055a82b11ea8f375bf9a`. Rama **codex/sports-live-phase2**, versión experimental **0.2.0**.

## Estado del trabajo

- Encargo `INSTRUCCIONES_CODEX.md` del ZIP leído íntegramente. Tres capturas presentes, hashes registrados; no se publican los HTML de terceros.
- Auditoría e investigación: ejecutadas sobre capturas reales y documentación oficial de los cinco frameworks solicitados. Baseline del usuario repetido; dos frameworks prioritarios instalados y ejecutados.
- Adaptadores y UI: tres adaptadores específicos y lector informativo paginado/filtrable implementados dentro del módulo QuickJS. M3U/XMLTV conservados; m3uUrl opcional permite catálogo sin lista.
- Diagnóstico/pruebas: offline, HTTP y validador oficial completados. CI Node 18/24 configurado para esta fase; su resultado remoto se registra al preparar el PR.
- GitHub: PR apilado borrador, base `codex/sports-live-mvp`; no merge/release. API 6 necesita Kino 0.9.50+. La Fase 2 permanece experimental hasta pruebas Android.

## Extracción, visualización y reproducción son evidencias distintas

| Fuente | Extracción en corpus | Opciones / URLs únicas | Visualización implementada | Reproducción autorizada |
| --- | --- | --- | --- | --- |
| tvmas | 20 filas/cards originales → 20 registros, 20 títulos | 20 / 20 | Textos de Ajustes con filtro/páginas y banner informativo; contrato probado, Android pendiente | **0** opciones habilitadas |
| eu | 79 filas/cards originales → 79 registros, 78 títulos | 480 / 371 | Textos de Ajustes con filtro/páginas y banner informativo; contrato probado, Android pendiente | **0** opciones habilitadas |
| kim | 87 filas/cards originales → 47 registros, 44 títulos | 87 / 66 | Textos de Ajustes con filtro/páginas y banner informativo; contrato probado, Android pendiente | **0** opciones habilitadas |

TV Más: canales, no eventos; menú vacío→`requires_dynamic_content`. B: tiempos locales con fecha pero sin offset, `start=null`/`timezone=null`; competición ausente en un evento, sin rellenarla a partir del título. C: 44 títulos pero 47 combinaciones título+hora+competición; 87 opciones conservadas, sin falsificar que haya solo 44 ocurrencias. Algunos horarios/competiciones cambian para un mismo título. Los tipos de URL se documentan en `corpus-summary.json`.

EU tiene 472 opciones de página y 8 opciones en dominios oficiales reconocidos. Kim: 80 opciones `/player/*.php`, 7 otras páginas. Cero opciones multimedia directas. Se detectan dos iframes sociales Twitter en B, externos a los eventos. No se consideran reproductores ni se cargan sus URLs. Datos de proveedor/idioma/tipo/P2P/kbps solo vienen de las tablas B. A/C no los inventan.

Las URLs de opciones sirven de evidencia local, nunca se siguen. La clasificación `official_page` usa una lista acotada de dominios reconocidos, no certifica su licencia ni cubre todas las emisoras. Cada registro/opción lleva `unverified_rights` y `playable=false`, incluyendo futuros nombres de archivo HLS/DASH/MP4 que pueda traer una captura. No hay `resolve` para estas páginas.

El usuario confirmó seis comprobaciones Android **0.1.1** satisfactorias, incluyendo imagen/audio/categorías/XMLTV. Eso se conserva como evidencia reportada por el usuario, sin inventar modelo/versión/logs. En **0.2.0** se comprobó transporte/SDK y se sirve la misma señal sintética autorizada; **no se reprodujo 0.2.0 en un dispositivo por Codex**.

## Fuentes externas y agenda JavaScript

| URL investigada | Resultado de esta sesión | Qué permite concluir |
| --- | --- | --- |
| `https://rojadirectatvmas.net/js/index.js?v=1.9` | `Tunnel connection failed: 403 Forbidden` | Script declarado en captura, contenido/API de agenda no verificables. |
| `https://rojadirectatvmas.net/agenda` | `Tunnel connection failed: 403 Forbidden` | No se obtuvo HTML renderizado ni agenda. No se supone un endpoint. |
| `http://www.rojadirecta.eu/` | `HTTP Error 403: Forbidden` | No afirmar actualización de catálogo en vivo ni atribuir el bloqueo al origen sin evidencia. |
| `https://rojadirecta.kim/` | `Tunnel connection failed: 403 Forbidden` | La estructura procede de la captura; no prueba disponibilidad hoy. |

La política de red del proxy es restrictiva. No se modificó ni se intentó rodearla. Ningún framework se usó para evadir anti-bot. Evidencias exactas en `access.json`. El lector puede consultar las portadas en Android si el acceso legítimo es posible; si no, prueba las capturas sintéticas mediante el ajuste URL. Derechos/términos de video no comprobados, ni se autoriza reproducción por ser metadatos públicos.

Proyectos y README oficiales investigados: [Scrapling](https://github.com/D4Vinci/Scrapling), [Crawl4AI](https://github.com/unclecode/crawl4ai), [Crawlee](https://github.com/apify/crawlee), [Playwright](https://github.com/microsoft/playwright), [ScrapeGraphAI](https://github.com/ScrapeGraphAI/Scrapegraph-ai). Licencias/releases/dependencias y qué se ejecutó en [BENCHMARK.md](BENCHMARK.md). `grrp/scrapling` es un fork de D4Vinci, no una segunda biblioteca distinta.

Contratos oficiales usados: `kino.fetch` (headers/status/charset/timeout/hosts), `kino.html.select` (inner HTML, máximo 500 matches), `kino.storage` (256 KiB), `settingsStatus`/`action`/`section` (API 6) y playlist M3U/XMLTV/channels (API 3). SDK, `contract.json`, `kino.d.ts` sin modificar. Se revisaron además la guía de HTML/API y los ejemplos oficiales de settings/section de own-server ya descargados en Fase 1. No se asumen APIs posteriores ausentes del contrato local.

## Comandos y resultados reales

| Comando | Resultado |
| --- | --- |
| `node --version` | PASS: v24.19.0 |
| Instalación pip en venv | PASS; 99 distribuciones, Scrapling 0.4.15 / Crawl4AI 0.9.5 instalados. Import inicial Crawl4AI falló por home read-only; corregido con variable oficial. |
| Benchmark original del kit con `--dir .../capturas` | PASS; 20 / 79 / 87 registros, sin tráfico de red/media. |
| `tools/scraping/benchmark.py` (4 motores, 8 iteraciones) | PASS; campos coincidentes y 14/14 campos de muestra manual por motor. No es precisión global anotada. |
| `node tools/scraping/corpus.mjs <capturas> <salida_privada>` | PASS; runtime real con selector de desarrollo, 20/79/47 registros, raw 20/79/87. |
| `npm ci --cache /workspace/scratch/npm-cache --ignore-scripts --offline` | PASS, código 0, 22 paquetes; Cheerio 1.0.0 solo desarrollo, nunca para QuickJS. |
| `node sdk/validate.mjs .` | PASS, código 0, manifiesto/exports/API/consentimiento aceptados. |
| `node --test test/*.test.mjs` | PASS, código 0; este entorno informa dos archivos/subtests. Las suites directas detallan el total de 41 tests. |
| `node test/plugin.test.mjs` | PASS: **14/14** pruebas del MVP conservadas, con expectativas ajustadas a API 6 y M3U opcional. |
| `node test/catalog.test.mjs` | PASS: **27/27** pruebas de adaptadores/UI/errores/cache/charset y rechazo de reproducción. |
| `node test/integration.mjs` | PASS, código 0: comandos SDK, M3U/XMLTV/HLS reales HTTP, redirects/lista vacía/guía DOCTYPE. |
| `node test/catalog-integration.mjs` | PASS, código 0: tres catálogos sintéticos HTTP, gate kino.fetch del SDK, UI aceptada, M3U intacta. Selector CSS Cheerio de desarrollo. |
| `node sdk/run.mjs . home` sin M3U | PASS: código 0, `[]`; cambio intencional frente al auth_required de 0.1.1. |
| `node sdk/run.mjs . live categories` sin M3U | PASS: código 0, categorías/playlists vacías. |
| `node sdk/run.mjs . settingsStatus` | PASS: cinco textos nativos, estado inicial `not_loaded`. |
| `node sdk/run.mjs . section eu` | PASS: pestañas, banner informativo, filas vacías. No cards reproducibles. |
| `git diff --check` | PASS, código 0. |
| CI remoto Node 18/24 | Configurado; resultado del PR se registra al crear la entrega. |
| Playwright Chromium/render JS/agenda A | **NO PROBADO**; JS remoto inaccesible. Paquete Playwright instalado no equivale a navegador ejecutado. |
| Crawlee / ScrapeGraphAI | **NO PROBADO**, investigación de documentación; razones en benchmark. |
| Kino Android 0.2.0 | **PENDIENTE**; pasos exactos en README. |

En la implementación inicial de tests se intentó asignar el selector sobre el objeto congelado del SDK; se corrigió el harness usando una copia de desarrollo, sin modificar SDK. El SDK convierte errores de fetchImpl a `network` salvo su propio timeout; por eso timeout/host_not_allowed tipados se prueban como errores Kino simulados, y además se prueba un redirect real denegado por el gate. HTTP 403 es una respuesta simulada antes del parsing. La prueba ISO-8859-1 usa el decodificador real del shim con bytes Latin-1 y charset de respuesta. Estas pruebas no demuestran renderizado/timeout/charset exacto de Android.

## Salidas reales de validación y pruebas

```text
Consent sheet:
  · Se conectará a los servidores que escribas en su configuración
  · Agrega canales en vivo a la pestaña En vivo
  ! Conexión sin cifrar con www.rojadirecta.eu (en rojo)
  ! Puede reproducir canales desde cualquier servidor que indique su lista (en rojo)
· apiVersion 6: requiere Kino 0.9.50 o superior; las versiones anteriores lo rechazan con «Este plugin necesita una versión más nueva de Kino»
✓ Kino would accept this plugin
```

```text
✔ official validator accepts minimum API and exports offline (5.335249ms)
✔ optional empty and whitespace M3U allows informational catalog use (0.758664ms)
✔ invalid addresses fail without exposing the configured value (1.449883ms)
✔ native playlist with optional guide passes actual output contract (1.222261ms)
✔ blank optional XMLTV is omitted; invalid XMLTV address is controlled (0.645884ms)
✔ home and native-only channels are empty; arbitrary resolve is refused (0.422845ms)
✔ SDK groups valid channels and discards invalid/missing URLs (1.789748ms)
✔ XMLTV matches channel id and uses timezone-aware epoch times (2.197944ms)
✔ XMLTV DOCTYPE is refused and malformed guide offers no programmes (0.51904ms)
✔ any live streams does not permit playlist or guide hosts (0.47762ms)
✔ SDK follows same-host redirect and blocks foreign destination before fetch (27.956249ms)
✔ SDK distinguishes empty playlist, HTTP failure and transport timeout (0.980795ms)
✔ SDK validator fails for empty configured list (2.463034ms)
✔ runtime stays inside single-module QuickJS globals (0.609791ms)
ℹ tests 14
ℹ suites 0
ℹ pass 14
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 55.996974
```

```text
✔ TV Más: verified cards give channels, empty menu requires dynamic agenda (20.145635ms)
✔ TV Más Markdown transport becomes HTML before CSS parsing (11.562158ms)
✔ EU: sports, competition, provider/language/type and raw time; no invented UTC (14.812807ms)
✔ EU table fragments preserve td through innerHTML wrapping (9.463342ms)
✔ UTF-8 and decoded ISO-8859-1 accents; targeted mojibake repair (9.611748ms)
✔ Kim malformed links repaired, options grouped without merging different times (4.541736ms)
✔ stable ids survive order, new mirror URL and harmless class changes (14.50751ms)
✔ source shape loss is parse_changed; explicit empty table is no_events (8.777729ms)
✔ no source link including media candidates becomes playable (1.671044ms)
✔ unsupported site and oversized snapshot fail safely (3.755488ms)
✔ consult action fetches only catalog homepage, caches and never follows pages (26.564389ms)
✔ native settings and section outputs stay within contract and offer no playable cards (7.475759ms)
✔ paging and saved query/sport filters work without network (10.794736ms)
✔ HTTP 401: auth_required, zero parsing and no retry storm (1.75531ms)
✔ HTTP 403: blocked, zero parsing and no retry storm (1.556286ms)
✔ HTTP 429: rate_limited, zero parsing and no retry storm (1.592981ms)
✔ HTTP 451: blocked, zero parsing and no retry storm (1.434123ms)
✔ HTTP 503: unavailable, zero parsing and no retry storm (1.836211ms)
✔ transport timeout is reported without exposing request/error content (1.358985ms)
✔ transport network is reported without exposing request/error content (1.286663ms)
✔ transport host_not_allowed is reported without exposing request/error content (1.214503ms)
✔ JSON response is unsupported_page; unknown action is not_found (2.344537ms)
✔ page iframe evidence is separate; social widgets are never video players (5.83153ms)
✔ cache is isolated from changes to the explicitly configured catalog URL (10.307374ms)
✔ redirect to undeclared catalog host is blocked before any second fetch (2.109815ms)
✔ partially changed card shape keeps valid records and reports parse_changed (3.33381ms)
✔ official fetch shim decodes an ISO-8859-1 response before the adapter (5.934494ms)
ℹ tests 27
ℹ suites 0
ℹ pass 27
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 194.944525
```

```text
PASS HTTP tvmas: 2 catalog records, UI output accepted, authorized M3U preserved, page playback refused
PASS HTTP eu: 2 catalog records, UI output accepted, authorized M3U preserved, page playback refused
PASS HTTP kim: 3 catalog records, UI output accepted, authorized M3U preserved, page playback refused
```

La salida detallada de la integración SDK, con dirección LAN efímera normalizada (no una URL privada de proveedor):

```text
$ node --version
exit=0
v24.19.0

$ node sdk/validate.mjs .
exit=0
Consent sheet:
  · Se conectará a los servidores que escribas en su configuración
  · Agrega canales en vivo a la pestaña En vivo
  ! Conexión sin cifrar con www.rojadirecta.eu (en rojo)
  ! Puede reproducir canales desde cualquier servidor que indique su lista (en rojo)
· apiVersion 6: requiere Kino 0.9.50 o superior; las versiones anteriores lo rechazan con «Este plugin necesita una versión más nueva de Kino»
✓ Kino would accept this plugin

$ node sdk/run.mjs . home
exit=0
[]

$ node sdk/run.mjs . live categories
exit=0
{
  "categories": [],
  "playlists": []
}

$ node sdk/run.mjs --config m3uUrl=<DEMO_LAN>/channels.m3u --config epgUrl=<DEMO_LAN>/guide.xml . home
exit=0
[]

$ node sdk/run.mjs --config m3uUrl=<DEMO_LAN>/channels.m3u --config epgUrl=<DEMO_LAN>/guide.xml . live categories
exit=0
{
  "categories": [],
  "playlists": [
    {
      "url": "<DEMO_LAN>/channels.m3u",
      "headers": {},
      "epgUrl": "<DEMO_LAN>/guide.xml",
      "refreshHours": 1,
      "hideGroups": [],
      "resolve": false,
      "streamHeaders": {},
      "genre": "deportes"
    }
  ]
}
playlist <DEMO_LAN>/channels.m3u:
  1 canales en 1 categorías; 0 entradas descartadas; 0 ocultas (adultos)
  categoría Fútbol (1)

$ node sdk/validate.mjs . --config m3uUrl=<DEMO_LAN>/channels.m3u --config epgUrl=<DEMO_LAN>/guide.xml --run liveCategories
exit=0
Consent sheet:
  · Se conectará a los servidores que escribas en su configuración
  · Agrega canales en vivo a la pestaña En vivo
  ! Conexión sin cifrar con www.rojadirecta.eu (en rojo)
  ! Puede reproducir canales desde cualquier servidor que indique su lista (en rojo)
· apiVersion 6: requiere Kino 0.9.50 o superior; las versiones anteriores lo rechazan con «Este plugin necesita una versión más nueva de Kino»
✓ Kino would accept this plugin

$ node sdk/validate.mjs . --config m3uUrl=<DEMO_LAN>/channels.m3u --config epgUrl=<DEMO_LAN>/guide.xml --run home
exit=0
Consent sheet:
  · Se conectará a los servidores que escribas en su configuración
  · Agrega canales en vivo a la pestaña En vivo
  ! Conexión sin cifrar con www.rojadirecta.eu (en rojo)
  ! Puede reproducir canales desde cualquier servidor que indique su lista (en rojo)
· apiVersion 6: requiere Kino 0.9.50 o superior; las versiones anteriores lo rechazan con «Este plugin necesita una versión más nueva de Kino»
✓ Kino would accept this plugin

$ node sdk/validate.mjs . --config m3uUrl=<DEMO_LAN>/channels.m3u --config epgUrl=<DEMO_LAN>/guide.xml --run liveChannels football
exit=0
Consent sheet:
  · Se conectará a los servidores que escribas en su configuración
  · Agrega canales en vivo a la pestaña En vivo
  ! Conexión sin cifrar con www.rojadirecta.eu (en rojo)
  ! Puede reproducir canales desde cualquier servidor que indique su lista (en rojo)
· apiVersion 6: requiere Kino 0.9.50 o superior; las versiones anteriores lo rechazan con «Este plugin necesita una versión más nueva de Kino»
✓ Kino would accept this plugin

$ node sdk/run.mjs live playlist <DEMO_LAN>/channels.m3u --epg <DEMO_LAN>/guide.xml
exit=0
1 canales en 1 categorías; 0 entradas descartadas; 0 ocultas (adultos)
categoría Fútbol (1)

Fútbol › Señal sintética de prueba  <DEMO_LAN>/live.m3u8
    ahora: Prueba autorizada

$ node sdk/run.mjs live playlist test/fixtures/channels.m3u --epg test/fixtures/guide.xml
exit=0
2 canales en 2 categorías; 2 entradas descartadas; 0 ocultas (adultos)
categoría Fútbol (1)
categoría Tenis (1)

Fútbol › Fútbol de prueba  https://media.example.org/live/football.m3u8
    sin guía
Tenis › Tenis de prueba  https://media.example.org/live/tennis.m3u8
    sin guía

$ node sdk/validate.mjs . --config m3uUrl=<DEMO_LAN>/redirect.m3u --run liveCategories
exit=0
Consent sheet:
  · Se conectará a los servidores que escribas en su configuración
  · Agrega canales en vivo a la pestaña En vivo
  ! Conexión sin cifrar con www.rojadirecta.eu (en rojo)
  ! Puede reproducir canales desde cualquier servidor que indique su lista (en rojo)
· apiVersion 6: requiere Kino 0.9.50 o superior; las versiones anteriores lo rechazan con «Este plugin necesita una versión más nueva de Kino»
✓ Kino would accept this plugin

$ node sdk/validate.mjs . --config m3uUrl=<DEMO_LAN>/foreign.m3u --run liveCategories
exit=1
Consent sheet:
  · Se conectará a los servidores que escribas en su configuración
  · Agrega canales en vivo a la pestaña En vivo
  ! Conexión sin cifrar con www.rojadirecta.eu (en rojo)
  ! Puede reproducir canales desde cualquier servidor que indique su lista (en rojo)
✗ playlist <DEMO_LAN>/foreign.m3u: not downloaded: undeclared.example.org no es un host declarado ni un servidor escrito
· apiVersion 6: requiere Kino 0.9.50 o superior; las versiones anteriores lo rechazan con «Este plugin necesita una versión más nueva de Kino»

$ node sdk/validate.mjs . --config m3uUrl=<DEMO_LAN>/empty.m3u --run liveCategories
exit=1
Consent sheet:
  · Se conectará a los servidores que escribas en su configuración
  · Agrega canales en vivo a la pestaña En vivo
  ! Conexión sin cifrar con www.rojadirecta.eu (en rojo)
  ! Puede reproducir canales desde cualquier servidor que indique su lista (en rojo)
✗ playlist <DEMO_LAN>/empty.m3u: 0 canales (0 entradas descartadas, 0 ocultas)
· apiVersion 6: requiere Kino 0.9.50 o superior; las versiones anteriores lo rechazan con «Este plugin necesita una versión más nueva de Kino»

$ node sdk/run.mjs live playlist <DEMO_LAN>/channels.m3u --epg <DEMO_LAN>/bad.xml
exit=0
1 canales en 1 categorías; 0 entradas descartadas; 0 ocultas (adultos)
La guía declara un DOCTYPE; Kino la rechaza por seguridad
categoría Fútbol (1)

Fútbol › Señal sintética de prueba  <DEMO_LAN>/live.m3u8
    sin guía

PASS: HTTP M3U/XMLTV/HLS and three MPEG-TS segments. Android playback pending.
```

## Archivos de entrega y siguientes pruebas

Runtime/manifiesto/package/lock: `plugin.js`, `kino-plugin.json`, `package.json`, `package-lock.json`. UI sin modelos ni backend. Tests: harness CSS de desarrollo, `catalog.test.mjs`, `catalog-integration.mjs`, fixtures sintéticos tvmas/eu/kim, servidor demo ampliado; tests MVP adaptados y conservados. CI agrega `npm ci` e integración de catálogo. Documentación: README, CHANGELOG, notas históricas de Fase 1, esta carpeta (benchmark, corpus-summary, entorno Python, investigación, arquitectura). Herramientas: `tools/scraping/{benchmark.py,corpus.mjs,requirements.txt,README.md}`.

Los HTML completos privados nunca se añaden a Git. Registros completos extraídos localmente en `/workspace/scratch/fase2-extracted/{tvmas,eu,kim}.json` para revisión del usuario; no ejecutarlos como código ni asumir autorización de sus enlaces. Los fixtures públicos son ficticios y solo conservan la estructura observada.

Próximos pasos: ejecutar matriz Android de 0.2.0 con la demo, comprobar banner y lectura paginada real, después probar portadas donde el acceso esté permitido. Obtener JS/condiciones de agenda A y evidencia de permisos antes de implementar API/dynamic browser. Si aparece una fuente multimedia autorizada, proponer resolución separada con sus hosts y licencia. Tras el merge autorizado de PR #1, cambiar la base del PR Fase 2 a main; no hacerlo ahora.
