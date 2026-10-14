# Resultados reales de la sesión

Fecha: 14 de octubre de 2026 (America/Santiago). Base local/remota revisada: `c48558c50783f6aa39628370c9726ca37a6f9561`, rama original `work`; rama de trabajo `codex/sports-live-mvp`.

## Estado por fase

| Fase | Estado y evidencia |
| --- | --- |
| A · auditoría | Completada. Checkout limpio al empezar, Node v24.19.0. Repositorio aún tenía la plantilla; ZIP disponible y auditado. Contrato/tipos coinciden byte a byte con la plantilla oficial y SDK sin cambios. |
| B · fuentes | Investigación documentada con limitación: los tres dominios no se pudieron inspeccionar por acceso 403 en este entorno. Estructura, metadatos y derechos no verificados. Alternativa autorizada: demo sintética Apache-2.0. |
| C · MVP | Implementado. API 3, id `sports-live-community`, versión 0.1.1, dos ajustes URL, declaración nativa playlist/XMLTV, sin URLs predeterminadas ni scraper. |
| D · automatización | Completada para SDK/Node: validación, suite offline y HTTP con señal sintética. Android/QuickJS real pendiente; no hay dispositivo disponible. |
| E · GitHub | Repositorio público/no fork, topic `kino-plugin` ya presente; rama y [PR borrador #1](https://github.com/Ericktz/kino-plugin-sports-live/pull/1) creados para revisión. Sin merge/release. |

## Comandos y resultados

`<DEMO_LAN>` en la salida es la URL efímera HTTP local reemplazada para no publicar la dirección del entorno; no es una lista de terceros. `test/integration.mjs` registra cada comando, valida códigos y crea/cierra el servidor automáticamente.

| Comando | Resultado real |
| --- | --- |
| `git status --short --branch` inicial | `## work`, limpio |
| `node --version` | PASS, salida `v24.19.0`, código 0 |
| `node sdk/validate.mjs .` | PASS, código 0, «Kino would accept this plugin» |
| `node --test test/*.test.mjs` | PASS, código 0; este entorno mostró un subtest del archivo completo |
| `node test/plugin.test.mjs` | PASS, 14 tests, 14 pass, 0 fail/skip; salida detallada abajo |
| `node sdk/run.mjs . home` sin configuración | RECHAZO ESPERADO, código **2**, `auth_required: set m3uUrl…`; runner impide llamar incluso a home cuando falta un ajuste obligatorio |
| `node sdk/run.mjs . live categories` sin configuración | RECHAZO ESPERADO, código **2**, `auth_required`; no fallo del plugin |
| `node sdk/run.mjs --config m3uUrl=<DEMO_LAN>/channels.m3u --config epgUrl=<DEMO_LAN>/guide.xml . home` | PASS, código 0, `[]` |
| `node sdk/run.mjs --config m3uUrl=<DEMO_LAN>/channels.m3u --config epgUrl=<DEMO_LAN>/guide.xml . live categories` | PASS, código 0, 1 canal/1 categoría, cero descartados |
| `node sdk/validate.mjs . --config m3uUrl=<DEMO_LAN>/channels.m3u --config epgUrl=<DEMO_LAN>/guide.xml --run liveCategories` | PASS, código 0 |
| Validador con la misma configuración, `--run home` y `--run liveChannels football` | PASS, código 0 en ambos casos; respuesta vacía intencional |
| `node sdk/run.mjs live playlist <DEMO_LAN>/channels.m3u --epg <DEMO_LAN>/guide.xml` | PASS, código 0; 1 canal, grupo Fútbol, programa «Prueba autorizada» |
| `node sdk/run.mjs live playlist test/fixtures/channels.m3u --epg test/fixtures/guide.xml` | PASS, código 0; 2 canales, 2 categorías, 2 descartados; programa fuera de la hora actual, «sin guía» esperado |
| Validador `--run liveCategories` con `/redirect.m3u` | PASS, código 0, redirección relativa autorizada |
| Validador `--run liveCategories` con `/foreign.m3u` | RECHAZO ESPERADO, código 1, nuevo host no declarado; no se solicita contenido a ese host |
| Validador `--run liveCategories` con `/empty.m3u` | RECHAZO ESPERADO, código 1, `0 canales` |
| Runner `live playlist` con `--epg <DEMO_LAN>/bad.xml` | PASS con guía rechazada, código 0; mensaje DOCTYPE, canal conservado sin guía |
| `node test/integration.mjs` | PASS, código 0; todos los comandos y descarga real HTTP HLS + 3 segmentos TS |
| `ffprobe -v error -show_entries stream=codec_name,profile,width,height -of json media/live/canal-1/seg0.ts` | PASS, código 0; H.264 Constrained Baseline, 320×180; AAC LC. Inspección de codecs, no reproducción Android |
| `git diff --check` | PASS, código 0 |
| `gh auth status` | FAIL, token inyectado de CLI no válido; no se pidieron tokens. Operaciones GitHub hechas con el conector autenticado |
| Reproducción real Kino Android | NO EJECUTADA; guía manual en README |
| CI remoto Node 18/24 | PASS, ambos jobs (`test (18)`, `test (24)`) y sus tres pasos de validación/test/integración completados con `success` en [run 38505945072](https://github.com/Ericktz/kino-plugin-sports-live/actions/runs/38505945072), commit `2599c64972e546abe9de00de56586b49849077e1` |

Durante el primer intento del script de integración, una aserción esperaba código 1 para configuración vacía. El SDK real produjo 2. Se corrigió la expectativa del test y se repitió la integración completa con éxito; el SDK no se modificó. La prueba de timeout es una excepción de transporte **simulada**, no un timeout medido en Android.

`liveCategories --run` valida y descarga M3U, pero no prueba por sí solo el XMLTV; el comando independiente `live playlist --epg` y las pruebas offline cubren la guía. La entrega distingue estas rutas.

## Suite offline (salida real)

```text
✔ official validator accepts minimum API and exports offline (5.009156ms)
✔ missing and whitespace configuration return auth_required (1.465128ms)
✔ invalid addresses fail without exposing the configured value (1.663424ms)
✔ native playlist with optional guide passes actual output contract (1.218597ms)
✔ blank optional XMLTV is omitted; invalid XMLTV address is controlled (0.588676ms)
✔ home and native-only channels are empty; arbitrary resolve is refused (0.423111ms)
✔ SDK groups valid channels and discards invalid/missing URLs (2.12054ms)
✔ XMLTV matches channel id and uses timezone-aware epoch times (2.150865ms)
✔ XMLTV DOCTYPE is refused and malformed guide offers no programmes (0.510345ms)
✔ any live streams does not permit playlist or guide hosts (0.589443ms)
✔ SDK follows same-host redirect and blocks foreign destination before fetch (26.801319ms)
✔ SDK distinguishes empty playlist, HTTP failure and transport timeout (1.078808ms)
✔ SDK validator fails for empty configured list (2.097915ms)
✔ runtime stays inside single-module QuickJS globals (0.597023ms)
ℹ tests 14
ℹ suites 0
ℹ pass 14
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 56.982717
```

## Integración SDK / HTTP (salida real normalizada)

```text
$ node --version
exit=0
v24.19.0

$ node sdk/validate.mjs .
exit=0
Consent sheet:
  · Se conectará a los servidores que escribas en su configuración
  · Agrega canales en vivo a la pestaña En vivo
  ! Puede reproducir canales desde cualquier servidor que indique su lista (en rojo)
✓ Kino would accept this plugin

$ node sdk/run.mjs . home
exit=2
auth_required: set m3uUrl with --config key=value or sdk/config.json

$ node sdk/run.mjs . live categories
exit=2
auth_required: set m3uUrl with --config key=value or sdk/config.json

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
  ! Puede reproducir canales desde cualquier servidor que indique su lista (en rojo)
✓ Kino would accept this plugin

$ node sdk/validate.mjs . --config m3uUrl=<DEMO_LAN>/channels.m3u --config epgUrl=<DEMO_LAN>/guide.xml --run home
exit=0
Consent sheet:
  · Se conectará a los servidores que escribas en su configuración
  · Agrega canales en vivo a la pestaña En vivo
  ! Puede reproducir canales desde cualquier servidor que indique su lista (en rojo)
✓ Kino would accept this plugin

$ node sdk/validate.mjs . --config m3uUrl=<DEMO_LAN>/channels.m3u --config epgUrl=<DEMO_LAN>/guide.xml --run liveChannels football
exit=0
Consent sheet:
  · Se conectará a los servidores que escribas en su configuración
  · Agrega canales en vivo a la pestaña En vivo
  ! Puede reproducir canales desde cualquier servidor que indique su lista (en rojo)
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
  ! Puede reproducir canales desde cualquier servidor que indique su lista (en rojo)
✓ Kino would accept this plugin

$ node sdk/validate.mjs . --config m3uUrl=<DEMO_LAN>/foreign.m3u --run liveCategories
exit=1
Consent sheet:
  · Se conectará a los servidores que escribas en su configuración
  · Agrega canales en vivo a la pestaña En vivo
  ! Puede reproducir canales desde cualquier servidor que indique su lista (en rojo)
✗ playlist <DEMO_LAN>/foreign.m3u: not downloaded: undeclared.example.org no es un host declarado ni un servidor escrito

$ node sdk/validate.mjs . --config m3uUrl=<DEMO_LAN>/empty.m3u --run liveCategories
exit=1
Consent sheet:
  · Se conectará a los servidores que escribas en su configuración
  · Agrega canales en vivo a la pestaña En vivo
  ! Puede reproducir canales desde cualquier servidor que indique su lista (en rojo)
✗ playlist <DEMO_LAN>/empty.m3u: 0 canales (0 entradas descartadas, 0 ocultas)

$ node sdk/run.mjs live playlist <DEMO_LAN>/channels.m3u --epg <DEMO_LAN>/bad.xml
exit=0
1 canales en 1 categorías; 0 entradas descartadas; 0 ocultas (adultos)
La guía declara un DOCTYPE; Kino la rechaza por seguridad
categoría Fútbol (1)

Fútbol › Señal sintética de prueba  <DEMO_LAN>/live.m3u8
    sin guía

PASS: HTTP M3U/XMLTV/HLS and three MPEG-TS segments. Android playback pending.
```

## Auditoría del prototipo y de la plantilla

El ZIP 0.1.0 acertaba en API 3, `hosts: []`, declaración nativa de playlist, `home` vacío y resolución directa. Faltaban validación de direcciones, evidencia de política de hosts/redirects, pruebas oficiales y reproducción real; `next: null` se sustituye por omisión en la página vacía. Se conservan id propio y el diseño pequeño; se explicita `resolve: false`. No se usan APIs nuevas por estar documentadas en una guía posterior.

La plantilla exponía funciones de servidor multimedia hasta API 7, credenciales demostrativas de login, VOD, subtítulos, tracking y firma por solicitud que no son parte del objetivo. Se retiran runtime/tests/fixtures de esa aplicación y sus medios (incluido material VOD de terceros). Solo se retienen los tres segmentos sintéticos de canal-1. Se conserva Apache-2.0/NOTICE, `sdk/`, `contract.json` y `kino.d.ts`.

Archivos añadidos/modificados: `plugin.js`, `kino-plugin.json`, `package.json`, `.gitignore`, `README.md`, `INTEGRACION-FUENTES.md`, `CHANGELOG.md`, `NOTICE`, el encargo `CODEX_TAREA_KINO_SPORTS_LIVE.md`, `docs/ARQUITECTURA.md`, este informe, `test/plugin.test.mjs`, `test/fixtures.json`, `test/fixtures/channels.m3u`, `test/fixtures/guide.xml`, `test/demo-server.mjs`, `test/integration.mjs`, `.github/workflows/test.yml`. Se retiran `server.mjs`, `artwork.mjs`, `GUIDE.md`, `icon.png`, `media/make-live.mjs` y medios de plantilla salvo `media/live/canal-1/seg{0,1,2}.ts`.

Criterios 1–3 y 5 verificados en ámbito SDK/fixtures. Criterio 4: lista autorizada sintética procesada y su HLS servido/descargado; reproducción en dispositivo aún pendiente. Criterio 6: matriz con limitaciones y evidencias de acceso, sin compatibilidad inventada. Criterio 7: documentación y PR para revisión, sin declarar estable.
