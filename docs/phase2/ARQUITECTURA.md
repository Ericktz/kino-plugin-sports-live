# Fase 2: catálogo autónomo, informativo y separado del video

## Runtime

Un solo `plugin.js`, sin imports: tres adaptadores privados `parseTvmas`, `parseEu`, `parseKim`. Los datos crudos pasan por normalización de transporte y reparación textual acotada, después por `kino.html.select` (Jsoup). No se evalúa código del documento. Se envuelve inner HTML de las filas en `<table><tbody><tr>` al volver a seleccionar sus celdas, porque el contrato entrega inner HTML y un parser de documento puede descartar `td` sin contexto.

Cada registro contiene `id`, `site`, `kind` interno (`channel`/`event`), `title`, `sport`, `competition`, `dateRaw`, `timeRaw`, `timezone: null`, `start: null`, `missing`, `options`, `rights: unverified_rights`, `playable: false`. No son `KinoItem`: el modelo interno evita prometer una acción de video. Las opciones incluyen URL, clasificación, proveedor, idioma y tipo; EU conserva además P2P/kbps como metadatos, nunca ejecuta P2P.

IDs: SHA-256 de tipo+título+competición+fecha cruda+hora cruda, con prefijo de fuente. Un cambio de URL de mirror no cambia el id; un cambio de hora sí diferencia la ocurrencia. Kim da 47 claves y 44 títulos: agrupar solo por título pierde diferencias de hora/competición. Las opciones se deduplican por URL+proveedor+idioma+tipo; los iframes externos a eventos se devuelven aparte. Los dos widgets Twitter de EU no se etiquetan como video.

Deportes: vocabulario interno `football`, `tennis`, `basketball`, `other`, `unknown`; se reconoce texto de deporte o competiciones explícitas conocidas (UEFA, MLS…), no se deduce por el equipo o por cualquier clase CSS. No se interpreta `ch`, `us`, `arg` como códigos deportivos sin evidencia. TV Más no aporta deporte por canal y conserva `unknown`. Categorías M3U mantienen `genre: deportes`, distinto del vocabulario interno.

## Red, caché y diagnósticos

Consultar es una acción explícita: una sola petición `kino.fetch` a portada/URL de captura configurada, timeout 10 s, `cookies: false`; HTTP 401→auth_required, 403/451→blocked, 429→rate_limited, otros fallos→unavailable. No se siguen opciones de video. El gate oficial de Kino verifica cada redirect. La lista de hosts no incluye mirrors, widgets ni CDNs de opciones; la URL de prueba usa el permiso del ajuste URL.

Una forma reconocida vacía devuelve `no_events`; ausencia o pérdida parcial de estructura devuelve `parse_changed`; menú vacío TV Más devuelve `requires_dynamic_content`. El resultado tiene estado de catálogo y, por separado, `unverified_rights`: `ok` no acredita derechos o reproducción.

Caché positiva 15 min, negativa 1 min, máximo una tentativa por minuto por fuente, sin reintentos automáticos. No descarga al abrir Home/section/status. Scope con hash del origen configurado, independiente por fuente; un cambio de URL no enseña datos del origen anterior. Se guardan solo títulos, competición, tiempos crudos, deporte, conteos y proveedores acotados. URLs de opciones/HTML/cookies no se persisten. Máximo conservador 35.000 caracteres por fuente (tres fuentes dentro del store 256 KiB); se informa recorte. Consultas/filtros usan hashes para resetear paginación al cambiar criterio, no guardan la búsqueda en claro fuera del ajuste que Kino administra.

## Visualización oficial

API 6, requerida por `settingsStatus`, `action`, `section`; mínimo Kino 0.9.50. `settingsStatus` produce cinco estados de máximo 200 caracteres: diagnóstico, aviso de derechos y tres registros. Botones de consulta y paginación; filtros de fuente, texto y deporte. `section({ tab })` devuelve pestañas y banner de máximo 300 caracteres, sin filas de tarjetas. Su render real aún necesita Android.

El contrato local máximo 7 no tiene un tipo de tarjeta de evento informativo. `live` abre el reproductor y `movie`/`series` serían semánticamente incorrectos. `catalogOnly` en guías posteriores describe plugins sin playback y no se aplica a este plugin mixto que conserva M3U; no se añade un campo ignorado por el SDK local para prometer una UI inexistente. Este límite se documenta y se ofrece un lector nativo verificable.

`home` vacío, `liveCategories` entrega únicamente M3U/XMLTV configurados, `liveChannels` sigue sin categorías propias, `resolve` rechaza refs arbitrarios. No se exportan `guide` ni `liveSearch` ficticios. Sin `m3uUrl` se admite uso informativo; con URL, mismos campos y reproducción nativa del MVP validado.

## Agenda TV Más y futuro

La captura demuestra un `<ul id=menu>` vacío, src `/js/index.js?v=1.9`, además de jQuery/Luxon/menu.js. `/agenda` y el JS dieron 403 en el proxy. No se conoce su endpoint ni su esquema, y no hay agenda JS ejecutada en este trabajo. No se añade navegador oculto por comodidad. Si se obtiene el script y permiso de consulta, primero identificar una API pública; solo si hace falta ejecutar JS se evaluará `kino.browser.page` y su consentimiento. `capture` exige reproducción expresamente autorizada; no se utiliza aquí.

Scrapling/Crawl4AI/Cheerio son herramientas de desarrollo. No es necesaria una API backend ni un servicio cloud para el plugin. Cualquier proveedor multimedia futuro requiere un PR separado con permiso verificable, hosts reales, fixtures y resolución al reproducir; ninguna clasificación `official_page` o `media_candidate` basta para habilitarlo.
