# Arquitectura y evolución

El runtime es `plugin.js`, un módulo QuickJS de cuatro exports. La única fuente activa es la lista autorizada configurada. La función interna `configuredUrl` valida configuración; `liveCategories` construye la declaración nativa y Kino realiza red, parsing, agrupación, búsqueda local y guía. No hay parser paralelo, caché de tokens, scraper ni registro de proveedores ocultos.

`liveChannels({ categoryId, cursor })` es el punto de integración futuro para categorías que un adaptador real ofrezca. Hoy no recibe grupos de M3U: Kino los maneja como proveedores propios. `resolve` falla deliberadamente para refs porque el MVP reproduce entradas M3U directamente. No se debe convertirlo en un proxy de URL arbitrarias.

## Contrato propuesto para un futuro adaptador (aún no implementado)

Un proveedor autorizado podrá exponer internamente `categories()`, `channels({ categoryId, cursor })`, `events({ from, to })`, `search({ query })` y `resolve(ref)`. Publicar únicamente las funciones que realmente soporte. Cada adaptador debe aportar por separado evidencia de autorización de **metadatos** y de **stream**; una fuente solo de metadatos jamás inventa enlaces de reproducción.

Modelo de evento interno propuesto (no es una firma del SDK):

```json
{
  "id": "provider-event-unique",
  "title": "Evento de prueba",
  "sport": "football",
  "competition": "Competición de prueba",
  "start": 1791979200000,
  "end": 1791982800000,
  "channelIds": ["provider-channel-unique"]
}
```

Tiempos epoch en milisegundos y zona explícita al normalizar desde el proveedor. Deportes internos: `football`, `tennis`, `basketball`, `other`; títulos españoles Fútbol, Tenis, Básquet, Otros. No son valores válidos de `genre` Kino: todas las categorías deportivas usan `genre: "deportes"`. Identificadores estables con prefijo por proveedor; `ref` debe identificar el recurso, no una URL firmada que expire. XMLTV/M3U enlazan por `tvg-id` único y estable.

Los eventos solo pasan a `guide({ channelIds, from, to })` cuando correspondan a canales realmente reproducibles y se respete la ventana de 24 h y los máximos del contrato. Búsqueda futura puede usar `liveSearch({ query })`, manteniendo ids iguales a `liveChannels`; no exportarlo si solo devuelve una página vacía. Orden/paginación deterministas para conservar favoritos y evitar repetir cursors.

## Plan de próximos PR

1. Completar la matriz manual de Android; no declarar estable hasta revisión y reproducción real.
2. Obtener un acuerdo de integración de un proveedor deportivo, incluyendo territorio, hosts/CDN, redirecciones y política de actualización de datos.
3. Implementar un adaptador interno para ese proveedor, con fixtures autorizados, categorías y eventos; conservar una sola salida JS, bundlear solo si la complejidad lo requiere.
4. Probar paginación, búsqueda, ids estables, EPG con cambio de día/zona/DST y recuperación de red. Aumentar apiVersion solo si la función implementada lo requiere.
5. Investigar nuevamente los sitios de referencia cuando exista acceso permitido y evidencia de derechos. No comprometer fuentes, fechas de integración o compatibilidad sin esas pruebas.

SDK, contrato y tipos conservados. Se retiró la aplicación demo de servidor multimedia de la plantilla, sus tests/fixtures de login, icono y medios ajenos al MVP. Quedan únicamente tres segmentos sintéticos con licencia y un servidor de pruebas pequeño fuera del runtime del plugin. La historia Git conserva la plantilla original y su generador.
