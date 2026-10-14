# Kino Sports Live · experimental 0.2.0

**M3U autorizada y XMLTV en En vivo**, más un lector informativo de catálogos deportivos. La versión 0.1.1 fue probada por el usuario en KinoTV Android: seis comprobaciones satisfactorias, incluyendo imagen, audio, categorías y guía. La interfaz de Fase 2 aún debe probarse en el teléfono.

No incluye señales de RojaDirecta. Sus enlaces de página, reproductor o emisora no tienen autorización de video verificada y no se convierten en canales reproducibles.

## Instalar la Fase 2 antes de los merges

En Android: **Ajustes > Plugins > Agregar** (según versión, menú ☰ > Plugins > +).

```text
Ericktz/kino-plugin-sports-live@codex/sports-live-phase2
```

Para fijar el código validado por CI: `Ericktz/kino-plugin-sports-live@99d579a74f518446afa24f349de2a52e7a0e063e`.

Comprueba **Deportes en vivo y agenda**, **0.2.0**. Para una prueba fijada, usa `Ericktz/kino-plugin-sports-live@SHA_DEL_COMMIT` con el SHA del PR. La rama principal aún contiene la plantilla. El PR de Fase 2 tiene base `codex/sports-live-mvp`; no se han fusionado los PR ni publicado releases.

La Fase 2 necesita **Kino 0.9.50 o superior**, porque utiliza ajustes con botones/estados y una sección informativa (API 6). Revisa la hoja de nuevos permisos antes de actualizar. Si Kino rechaza una segunda instalación con el mismo id, actualiza o cambia la fuente de tu instalación siguiendo las opciones de tu versión; anota tus URL en privado antes de desinstalar. No instales ambos plugins con el mismo id simultáneamente.

## Mantener los canales autorizados

En Configurar, conserva `m3uUrl` y `epgUrl` de la versión anterior. Abre **En vivo**: Kino descarga y agrupa la lista, busca los canales cargados y muestra XMLTV. La reproducción sigue siendo nativa (`resolve: false`); no hay un proxy de streams ni un extractor de video.

`m3uUrl` ahora es **opcional** para consultar solo catálogos. Vacío devuelve cero playlists; no impide Inicio o los ajustes. Si se escribe, la URL HTTP/HTTPS debe ser válida, sin credenciales `usuario:contraseña@host` ni fragmento. `epgUrl` continúa opcional. El género de los grupos M3U es `deportes`, como en 0.1.1; no se filtran automáticamente canales por nombre.

## Consultar y visualizar los catálogos

1. Abre **Ajustes > Deportes en vivo y agenda > Catálogo informativo**.
2. Elige **TV Más**, **RojaDirecta.eu** o **RojaDirecta.kim**.
3. Deja vacía **URL de catálogo de prueba** para consultar la portada real de esa fuente.
4. Pulsa **Consultar catálogo**. Es una petición a la portada, sin seguir enlaces de los registros ni ejecutar JavaScript. Lee **Estado de la fuente**.
5. Los campos **Registro uno/dos/tres** muestran título, fecha/hora cruda cuando existe, competición y número de enlaces. **Página siguiente/anterior** recorre el catálogo.
6. Escribe **Buscar título o competición** y/o elige un **Deporte del catálogo**, guarda y vuelve al lector. La búsqueda filtra título, competición y nombres de proveedores ya descargados. Sin resultados se indica «Sin registro»; el filtro no hace peticiones.
7. La sección **Agenda deportiva** ofrece tres pestañas y un resumen del catálogo guardado. El lector completo y sus botones están en los ajustes.

El contrato local no ofrece un tipo de tarjeta de evento sin reproducción. Por eso los metadatos se muestran como textos nativos de `status` y un banner de `section`; no se disfrazan de películas ni de canales `live`. Solo tu M3U proporciona canales a En vivo. Los tiempos sin zona **no se convierten a UTC** ni alimentan una guía de TV inventada.

**Caché:** quince minutos por fuente/URL configurada, con máximo una nueva tentativa por minuto y sin reintentos automáticos. El botón reutiliza el resultado positivo durante ese intervalo. Los registros guardados son compactos; no se almacenan HTML, URLs de opciones ni cookies. Un catálogo muy grande puede recortarse y el estado lo indica.

## Qué se comprobó en las capturas aportadas

| Fuente | Extracción real offline | Enlaces | Visualización implementada | Video autorizado |
| --- | --- | --- | --- | --- |
| TV Más | 20 canales; agenda vacía en DOM requiere JS | 20 páginas de canal | Lector y resumen; horarios/deporte no se inventan | Ninguno |
| EU | 79 eventos, con deporte/competición/proveedores/idioma/tipo | 480 opciones, 371 URLs únicas; 8 opciones en dominios oficiales reconocidos | Lector con filtros y horarios sin offset | Ninguno |
| Kim | 87 filas, 44 títulos, **47 claves título+hora+competición** | 87 opciones, 66 URLs únicas; 80 páginas `/player/*.php` | Agrupación de opciones sin fusionar horarios distintos | Ninguno |

Los dos iframes de EU son widgets sociales de Twitter, externos a los eventos; no son reproductores. No aparecen URLs multimedia directas en las opciones extraídas. «Dominio oficial» es una clasificación técnica y no una licencia. Las páginas reales y la agenda JS devolvieron 403 en este entorno; estas cifras proceden **de las capturas**, no de una consulta exitosa en vivo.

## Prueba manual Android de Fase 2 (pendiente)

Para probar aun si un sitio está bloqueado, usa nuestro servidor **sintético autorizado**, sin publicar las capturas del usuario:

```bash
node test/demo-server.mjs
```

En un equipo de tu LAN abre el puerto 18097 solo a tu LAN; no expongas esta demo sin autenticación a internet. Android debe estar en la misma red. En todos los ejemplos, sustituye `IP_LAN` por la IP real de ese equipo, nunca `localhost`/loopback ni la IP cloud.

1. Instala la rama/commit experimental y verifica nombre, versión y nuevos permisos. Anota versión Kino/Android y modelo del teléfono.
2. Conserva la lista autorizada real o configura `m3uUrl = http://IP_LAN:18097/channels.m3u`, `epgUrl = http://IP_LAN:18097/guide.xml`.
3. Repite las comprobaciones de En vivo: grupo Fútbol, búsqueda, favoritos, programa **Prueba autorizada**, imagen y audio al menos 30 segundos. Confirma que el catálogo no cambia esta reproducción.
4. Elige TV Más y configura `catalogUrl = http://IP_LAN:18097/catalog/tvmas.html`. Pulsa Consultar: espera **2 registros**, **requires_dynamic_content**, dos canales informativos y cero eventos de agenda JS.
5. Elige EU; cambia `catalogUrl` a `/catalog/eu.html` en el mismo servidor y guarda. Espera **2 eventos**, deporte Fútbol/Tenis, «Copa de prueba», proveedor/idioma/tipo extraídos, horario sin zona. No debe aparecer ningún canal EU en En vivo.
6. Elige Kim; cambia `catalogUrl` a `/catalog/kim.html`. Espera **3 registros** procedentes de 4 filas: el primer evento tiene dos opciones; su aparición a otra hora permanece separada. Filtra por «NBA»/Básquet y comprueba un resultado. Borra el filtro para recuperar los demás.
7. Verifica el resumen en las pestañas de Agenda deportiva. La sección depende de cómo tu versión de Kino muestre un banner con filas vacías; los registros completos siempre se consultan en Ajustes. Registra si el banner no aparece.
8. Vuelve a pulsar Consultar: debe reutilizar caché. Cambiar la URL de prueba no debe mostrar el catálogo anterior de esa fuente. Recorrer páginas o filtrar no debe pedir red.
9. Detén el servidor y, pasada la caché o con una URL de prueba nueva, consulta: registra el error de red. Después restaura la URL y espera el intervalo de un minuto. M3U sigue independiente del fallo del catálogo.
10. Para fuentes reales, deja `catalogUrl` vacío y consulta una por vez. Si aparece `blocked`, `timeout`, `host_not_allowed` o `parse_changed`, registra solo código/fuente/versión. No intentes superar captcha, suscripción o bloqueo. Nunca pulses enlaces de video como parte de estas pruebas.
11. Termina con Ctrl+C. No marques PASS la Fase 2 hasta comprobarla en el teléfono. El PASS manual comunicado por el usuario pertenece a **0.1.1**.

## Permisos, seguridad y limitaciones

- Un solo `plugin.js` de QuickJS: `kino.fetch`, `kino.html.select`, `kino.storage`, funciones del contrato oficial. **Sin Python/Node/npm en runtime**, backend obligatorio, navegador oculto, LLM ni telemetría.
- API 6 está justificada por `settingsStatus`, `action`, `section`. No se elevó por los scrapers de laboratorio. SDK, contrato y tipos originales sin editar.
- Solo se declaran hosts de las tres portadas. EU conserva su URL HTTP verificada en la captura: consentimiento rojo **«Conexión sin cifrar con www.rojadirecta.eu»**. No se asume que HTTPS o un nuevo redirect funcione. Los redirects deben permanecer en hosts autorizados; no se declaran proveedores/player/CDN externos.
- `liveStreamHosts: "any"` mantiene el consentimiento rojo del MVP para los streams de tu lista. No libera `kino.fetch` ni M3U/XMLTV, DRM, licencias o redes privadas ajenas. Los ajustes URL permiten tus servidores explícitos con esquema/puerto exactos.
- La agenda de TV Más depende de `/js/index.js?v=1.9`; ese recurso y `/agenda` están bloqueados aquí. No inventamos una API ni añadimos `browser: "pages"` sin comprobar que aporte un dato real. Los 20 canales no equivalen a 20 eventos.
- Ninguna opción de catálogo se devuelve desde `resolve`, `liveChannels` o una fila reproducible. Las páginas oficiales y archivos multimedia candidatos también llevan `unverified_rights` y `playable: false`.
- La prueba HTTP usa la API `kino.fetch` del SDK y un sustituto CSS de desarrollo. No verifica Jsoup/QuickJS/Media3 del dispositivo. Los frameworks avanzados se ejecutaron solo en modo estático sobre las capturas privadas.

## Desarrollo

Node >=18. Las pruebas CSS requieren Cheerio **solo de desarrollo**, con lockfile:

```bash
npm ci
node sdk/validate.mjs .
node --test test/*.test.mjs
node test/plugin.test.mjs
node test/catalog.test.mjs
node test/integration.mjs
node test/catalog-integration.mjs
node sdk/run.mjs . settingsStatus
node sdk/run.mjs . section eu
```

El benchmark Python se reproduce con [tools/scraping/README.md](tools/scraping/README.md); no se necesita para instalar el plugin. Los HTML completos del ZIP y los registros extraídos completos permanecen fuera del repositorio. Fixtures públicos ficticios en `test/fixtures/catalog/`.

## Problemas frecuentes

| Síntoma | Acción |
| --- | --- |
| Sale «Tu servidor» o 0.1.1 | Instala la rama Fase 2 explícita y verifica el manifiesto. |
| Dice «necesita una versión más nueva» | API 6 requiere Kino 0.9.50+. |
| Catálogo `not_loaded` | Elige fuente y pulsa Consultar; no se consulta automáticamente al abrir Inicio. |
| `requires_dynamic_content` | Hay canales de TV Más, pero la agenda necesita JS que no fue accesible; no significa agenda vacía. |
| `parse_changed` | El HTML no coincide con la estructura verificada, falta parte de ella o el selector de desarrollo no está disponible en SDK. En Android enviar código y versión sin URLs privadas. |
| `blocked` / `auth_required` | La fuente rechazó el acceso. No se hacen intentos de evasión. Usa capturas sintéticas o una lista autorizada. |
| Catálogo visible pero sin video | Es información; ningún enlace de esas fuentes está autorizado para reproducirse en esta entrega. |
| Sin canales M3U | Revisa lista/configuración/red/redirect. Una lista vacía crea cero grupos. |
| Sin guía | Revisa XMLTV, `tvg-id`, fechas y zona; DOCTYPE/ENTITY se rechazan y el canal se conserva. |
| Consulta repetida no cambia | Espera la caché de quince minutos; categorías/canales M3U y XMLTV mantienen sus propios cachés nativos. |

Resultados, comandos y fuentes: [docs/phase2/RESULTADOS.md](docs/phase2/RESULTADOS.md), [docs/phase2/BENCHMARK.md](docs/phase2/BENCHMARK.md), [docs/phase2/ARQUITECTURA.md](docs/phase2/ARQUITECTURA.md), [CHANGELOG.md](CHANGELOG.md). Los documentos de Fase 1 se conservan como historial. Código y señal sintética bajo Apache-2.0; atribución en `NOTICE`.
