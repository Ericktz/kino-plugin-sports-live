# Encargo a Codex: Kino Sports Live (primer plugin comunitario)

Actúa como ingeniero senior de JavaScript, integraciones multimedia y plugins KinoTV. Tienes acceso al repositorio `Ericktz/kino-plugin-sports-live`, creado desde la plantilla oficial `kinotvapp/kino-plugin-own-server` (NO es un fork). Tu misión es obtener un MVP instalable, probado y documentado, y preparar cambios revisables mediante una rama de trabajo y un Pull Request. Trabaja de forma autónoma en investigación, implementación, pruebas y documentación; no publiques lanzamientos, no hagas merge a `main` ni borres datos o repositorios sin mi aprobación.

## Contexto

Se quiere un plugin comunitario de KinoTV para organizar y reproducir canales y eventos deportivos EN VIVO a partir de fuentes públicas y autorizadas. El objetivo funcional futuro se inspira en la experiencia de los catálogos de RojaDirecta, pero NO incluye saltar DRM, suscripciones, captchas, autenticación, controles de acceso o geobloqueos, ni incorporar retransmisiones sin derechos de distribución. Los sitios de referencia para examinar únicamente su estructura pública y viabilidad son:

- `http://www.rojadirecta.eu/`
- `https://rojadirectatvmas.net/`
- `https://rojadirecta.kim/`

Puede que algunos sean inalcanzables o redirijan a reproductores de terceros. No supongas que un iframe sea un stream ni que una URL HLS/DASH sea de uso permitido. No sigas enlaces de vídeo cuando no se haya verificado el permiso para integrarlos. Nunca descargues ni redistribuyas material protegido sin autorización. La integración con cualquiera de esos sitios queda en una **investigación de viabilidad** si no se puede verificar acceso autorizado. NO incluyas canales o URLs de esos sitios por defecto.

Existe un prototipo inicial `kino-plugin-sports-live-v0.1.0.zip` con `kino-plugin.json`, `plugin.js`, `README.md`, `INTEGRACION-FUENTES.md` y tests locales. Si esos archivos están en el repositorio, revísalos y reutiliza lo válido. Si no están, construye el MVP a partir de la plantilla oficial sin bloquearte ni inventar contenido; anota que el ZIP no estaba disponible. El prototipo previo pasó cuatro pruebas unitarias simuladas pero **no** ha pasado todavía el SDK oficial ni una prueba de reproducción en Kino.

## Documentación de lectura obligatoria (antes de tocar el código)

1. `https://kinotvapp.github.io/kino-plugins/AGENTS.md` (seguir las instrucciones del proyecto, en tanto no contradigan este encargo).
2. `https://kinotvapp.github.io/kino-plugins/llms-full.txt`.
3. `https://kinotvapp.github.io/kino-plugins/ai/`.
4. `https://kinotvapp.github.io/kino-plugins/live-channels/`.
5. `https://kinotvapp.github.io/kino-plugins/test-locally/`.
6. La plantilla `https://github.com/kinotvapp/kino-plugin-own-server`; confirmar también el `contract.json` y `kino.d.ts` en el repositorio.

Si no puedes acceder a una referencia, inspecciona primero los archivos oficiales disponibles en el repositorio y registra la limitación. Nunca inventes firmas de API, nombres de campos ni resultados de pruebas.

## Objetivo de la entrega v0.1.x (MVP)

- Plugin de Kino que se pueda instalar desde `Ericktz/kino-plugin-sports-live` una vez publicado y que aparezca en **En vivo**.
- Ajuste obligatorio `m3uUrl`: dirección de una lista M3U que la persona tenga autorización para usar. Ajuste opcional `epgUrl`: guía XMLTV.
- Kino debe poder leer la lista, agrupar canales, mostrar los nombres/grupos y reproducir una transmisión de prueba que cuente con permiso, sin que el plugin replique datos ni robe tokens.
- No incluir servidores, credenciales, URLs de contenido restringido, claves ni transmisiones deportivas ajenas en el código. Crear fixtures de prueba deterministas, usando datos sintéticos o vídeo de prueba cuyo uso esté autorizado.
- Usar el `apiVersion` mínimo realmente compatible (probablemente 3 para canales/M3U). `capabilities` necesita al menos `home` o `search`, `resolve`, y `channels` si se usan los canales nativos. Exports requeridos `liveCategories`, `liveChannels`; `guide` y `liveSearch` solo cuando hagan falta. `entry: "plugin.js"`, sin `./`. Un solo módulo JS para el sandbox QuickJS, sin APIs de Node ni `import` en runtime.
- Gestionar el caso de lista vacía/ausente, URL incorrecta, timeout, redirecciones, XMLTV no válido, y permisos de hosts con errores útiles. No imprimir datos sensibles.
- Declarar solo los permisos/hosts necesarios. Revisar explícitamente si `hosts: []` con URL aportada por la persona es válido y cómo se gestionan redirecciones, `liveStreamHosts: "any"` y avisos de consentimiento. Si una prueba del SDK contradice el prototipo, corregirla.
- Mantener nombres/descripciones en español, README claro, archivo `INTEGRACION-FUENTES.md`, `CHANGELOG.md`, `.gitignore`, tests y comandos reproducibles.

## Etapas de trabajo

**Fase A — Auditoría y preparación.** Revisar la rama y estructura real. Usar `git status` y comprobar Node (>=18). Conservar `sdk/`, `contract.json`, `kino.d.ts`. Revisar el manifiesto y el prototipo. Crear una rama de trabajo si la tarea se ejecuta fuera de la gestión de ramas de Codex. No romper ni borrar el SDK.

**Fase B — Viabilidad de fuentes.** Examinar únicamente las páginas y APIs públicas pertinentes de los tres sitios citados, según sus condiciones de uso y disponibilidad. Construir una matriz por dominio: disponibilidad verificable, tipo de catálogo, metadatos de eventos, acceso autorizado a vídeo (sí/no/no verificado), tipos de URL, obstáculos técnicos, y recomendación. No afirmar compatibilidad por ver una página o iframe. Investigar fuentes alternativas con licencias claras, por ejemplo transmisiones oficiales gratuitas que permitan integración o listas del usuario. Documentar fecha de revisión y URLs fuente. Implementar únicamente lo autorizado.

**Fase C — Plugin.** Implementar un MVP sólido de lista M3U configurable que Kino descargue por sí mismo, EPG XMLTV opcional y funciones de canales del SDK. Si el catálogo externo permite acceder legalmente a metadatos, diseñar una interfaz/adaptador separado para futuras fuentes, sin añadir streams no autorizados. No aumentar apiVersion por características que todavía no se usen. Organizar el código para futuras categorías (fútbol, tenis, básquet, otros), búsqueda y horarios.

**Fase D — Pruebas automatizadas.** Ejecutar, guardar salidas y corregir todos los errores de:

```bash
node --version
node sdk/validate.mjs .
node --test test/*.test.mjs
node sdk/run.mjs . home
node sdk/run.mjs . live categories
```

La ejecución de `live categories` **sin** `m3uUrl` debe producir el error controlado `auth_required`; no lo contabilices como fallo del plugin. Realizar también pruebas con `--config m3uUrl=<URL_DE_LISTA_AUTORIZADA>` sin subir URLs privadas al repositorio:

```bash
node sdk/run.mjs . --config m3uUrl=<URL_DE_LISTA_AUTORIZADA> live categories
node sdk/validate.mjs . --run liveCategories
node sdk/run.mjs live playlist <URL_O_FIXTURE_M3U>
```

Verifica la sintaxis y la posición correcta de `--config` y `--run` en la versión real del SDK antes de utilizarlos. Usa listas y fixtures legales. Graba/reproduce fixtures con el SDK donde corresponda y confirma que los tests offline pasan. El kit de Node no garantiza reproducción en Android: deja una lista de pasos manuales verificables dentro de Kino y **marca como pendiente** lo que no puedas ejecutar.

**Fase E — GitHub y entrega.** Crear README con instalación en Kino (Ajustes > Plugins > Agregar > `Ericktz/kino-plugin-sports-live`), configuración, permisos, limitaciones, capturas opcionales, ejemplos legales, troubleshooting y guía para colaborar. Configurar topic `kino-plugin` si tienes permiso y previa revisión de la configuración; preparar PR con cambios del MVP. No hagas merge ni etiquetes como estable sin revisión. Si necesitas permisos GitHub adicionales, documenta la operación precisa sin solicitar contraseñas ni tokens en el chat.

## Criterios de aceptación

1. `node sdk/validate.mjs .` termina con código 0.
2. El contrato y los exports coinciden, con apiVersion mínimo.
3. Los tests automatizados pasan, incluyendo configuración vacía, lista válida, entradas descartadas y XMLTV opcional.
4. Una lista autorizada de prueba se procesa correctamente con las herramientas del SDK, con al menos un stream de prueba cuya autorización esté documentada; en caso contrario declara claramente el impedimento sin falsificar la prueba.
5. Ninguna credencial, cookie, token, clave, video protegido ni URL de retransmisión sin permiso aparece en el código o fixtures.
6. Se entrega comparación documentada de los sitios de referencia, con evidencias y sin prometer que funcionan.
7. El PR incluye README, pruebas, plan de próximos pasos y resultados reales de los comandos, sin afirmar prueba en Android si no ocurrió.

## Forma de trabajar y respuesta final

Avanza de forma autónoma por fases sin detenerte para preguntas menores: decide valores técnicos razonables y explícitalos. No cambies de objetivo si un dominio de referencia falla: completa el MVP con M3U autorizada y deja integraciones externas como backlog. Pide autorización solo antes de operaciones irreversibles, publicación de release, merge a la rama principal o incorporación de fuentes con derechos no confirmados.

Entrega al terminar: resumen ejecutivo, archivos modificados, estado de cada fase, resultado exacto de cada comando de prueba (PASS/FAIL/NO EJECUTADO), lista de fuentes verificadas con URLs y fecha, URL de la rama o PR si se creó, limitaciones, y pasos de instalación y validación manual en Kino Android. Distingue claramente entre pruebas simuladas, pruebas SDK y reproducción real en dispositivo.
