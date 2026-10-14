# Investigación de fuentes

**Histórico Fase 1.** Fase 2 ya audita capturas proporcionadas por el usuario; ver [resultados actuales](docs/phase2/RESULTADOS.md) y [benchmark ejecutado](docs/phase2/BENCHMARK.md). El bloqueo de acceso en vivo permanece; no se habilitaron streams.

Revisión: **14 de octubre de 2026, America/Santiago** (sesión técnica 14 de octubre UTC). Solo se solicitaron páginas públicas de referencia; no se siguieron enlaces de video ni reproductores. La instrucción principal del usuario autoriza investigar e implementar fuentes autorizadas; el documento adjunto detalla sus fases. Un ejemplo de una documentación no acredita derechos de una transmisión.

## Evidencia de acceso y viabilidad

El entorno cloud impone una lista de destinos HTTP. Con la conectividad de shell habilitada, los intentos públicos dieron:

| Dominio / página exacta | Resultado observado | Catálogo / metadatos de eventos | Reproductor / URL de transmisión | Video autorizado | Obstáculo / recomendación |
| --- | --- | --- | --- | --- | --- |
| [www.rojadirecta.eu](http://www.rojadirecta.eu/) | `HTTP Error 403: Forbidden` | No verificables aquí | No verificados; solo se probó la URL HTTP de portada | No verificado | No atribuir el 403 al origen sin más evidencia; entorno restringido. No implementar. |
| [rojadirectatvmas.net](https://rojadirectatvmas.net/) | `Tunnel connection failed: 403 Forbidden` | No verificables aquí | No verificados | No verificado | El proxy impidió el túnel. No prueba que el sitio esté caído. Investigación externa pendiente. |
| [rojadirecta.kim](https://rojadirecta.kim/) | `Tunnel connection failed: 403 Forbidden` | No verificables aquí | No verificados | No verificado | El proxy impidió el túnel. Investigación externa pendiente; continuar MVP. |

No hay evidencia que permita clasificar catálogos, horarios, deportes, iframes, CDN, HLS/DASH o APIs reales de esos dominios. No se inventan selectores ni endpoints. Tampoco se comprobaron términos/licencias. Ninguna URL de estos sitios se incorpora a manifiesto, plugin o fixtures. No se modificó la política de red ni se intentó rodear la denegación.

**Catálogo:** nombres de partidos/canales, deporte, competición, fecha y zona horaria. Poder leerlo técnicamente no acredita permiso para reutilizarlo.

**Reproductor:** página HTML, embed o iframe que ejecuta una interfaz. Su dirección no es un stream que pueda devolver `resolve()`.

**Transmisión:** manifiesto HLS/DASH o archivo multimedia, más sus segmentos y dependencias. Debe comprobarse su autorización por separado de que la URL responda. La integración queda pendiente si requiere DRM, captcha, suscripción, geobloqueo o controles de acceso que el usuario no ha autorizado usar por el camino legítimo.

Para reabrir la investigación: registrar fecha, respuesta del origen, condiciones aplicables, permiso de metadatos y video, URL final/hosts y prueba SDK. No seguir un enlace de video antes de verificar permiso. Proponer PR separado; no suponer estabilidad por una sola respuesta.

## Fuentes alternativas y alcance autorizado

| Fuente | Evidencia / permiso | Uso en este MVP |
| --- | --- | --- |
| Lista del usuario/proveedor | El usuario debe tener autorización expresa para acceder e integrar sus señales; no se proporcionó ninguna lista privada real | Configuración M3U/XMLTV sin servidores predeterminados. No se puede certificar una lista que aún no fue aportada. |
| [Plantilla oficial own-server](https://github.com/kinotvapp/kino-plugin-own-server) | `LICENSE`: Apache-2.0; `NOTICE`: copyright kinotvapp. `media/make-live.mjs` genera tarjetas, movimiento y tonos de prueba con FFmpeg, no partidos reales | Conservados los 3 segmentos de `canal-1`. Servidor de prueba HTTP propio, M3U, XMLTV y HLS rodante. Proceso SDK y transporte verificados; Android pendiente. |
| Fixtures propios | Nombres/programas ficticios y direcciones reservadas `example.org`, creados para pruebas | Offline; no representan streams reales y nunca se descargan. |
| Emisoras deportivas oficiales gratuitas | No se verificó un proveedor con autorización de integración en esta sesión | Backlog: obtener licencia/permiso y términos por territorio. «Gratis» no significa permiso de redistribución. |

## Documentación obligatoria

Las cinco URL del sitio `kinotvapp.github.io` (AGENTS.md, llms-full.txt, ai/, live-channels/, test-locally/) devolvieron `Tunnel connection failed: 403 Forbidden`. Se usaron las fuentes del **repositorio oficial**, accesible por GitHub:

- [AGENTS.md](https://github.com/kinotvapp/kino-plugins/blob/00063803c9967386e8a46e7cd468d9a690e9f002/AGENTS.md).
- [Guía IA](https://github.com/kinotvapp/kino-plugins/blob/00063803c9967386e8a46e7cd468d9a690e9f002/docs/ai.md), [Canales](https://github.com/kinotvapp/kino-plugins/blob/00063803c9967386e8a46e7cd468d9a690e9f002/docs/live-channels.md), [Pruebas](https://github.com/kinotvapp/kino-plugins/blob/00063803c9967386e8a46e7cd468d9a690e9f002/docs/test-locally.md).
- `llms-full.txt` se genera al construir el sitio, no estaba en el checkout. Se consultaron las páginas fuente de contrato, manifiesto, API, límites, pruebas locales, publicación, firma y cambios siguiendo la alternativa explícita de AGENTS.md. No se afirma haber descargado ese archivo generado.
- Plantilla oficial revisada en commit `1c12290fcb9f83bf3c1c31870519a957a003d8a3`. Los `contract.json` y `kino.d.ts` locales coinciden byte a byte con esa plantilla. Se conserva el SDK sin editar.
- La guía actual contiene APIs posteriores al contrato 7 de la plantilla. No se toman esas APIs nuevas como si existieran en el SDK local: este MVP usa solo campos confirmados para API 3.

Las fuentes oficiales confirman `hosts: []` con ajustes URL, `channels` desde API 3, argumentos de `liveChannels` como objeto, consumo nativo M3U/XMLTV y el consentimiento de `liveStreamHosts: "any"`. El prototipo no tenía evidencia de validador oficial: esta entrega la añade.
