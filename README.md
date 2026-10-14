# Kino Sports Live · MVP 0.1.1

Plugin comunitario para **En vivo** de KinoTV: usa una lista M3U que tengas autorización para reproducir y, opcionalmente, una guía XMLTV. No trae canales deportivos de terceros. Es una versión para revisión: las pruebas del SDK pasan; la reproducción en Kino Android está pendiente.

## Instalación y configuración

En Android: **Ajustes > Plugins > Agregar** (en algunas versiones, menú ☰ > Plugins > +).

1. Una vez aprobados e incorporados los cambios, escribe `Ericktz/kino-plugin-sports-live` > Agregar.
2. Para revisar este PR antes del merge, escribe `Ericktz/kino-plugin-sports-live@codex/sports-live-mvp`; comprueba que la hoja muestra **Deportes en vivo (M3U)**, versión **0.1.1**, antes de instalar. La rama principal todavía contiene la plantilla.
3. Lee la hoja de consentimiento y selecciona Instalar > Configurar.
4. En **URL de la lista M3U autorizada** (`m3uUrl`, obligatorio), escribe la dirección completa HTTP/HTTPS de tu proveedor autorizado. No uses credenciales `usuario:contraseña@host` ni fragmentos `#...`.
5. En **URL de la guía XMLTV** (`epgUrl`, opcional), escribe la guía autorizada o déjala vacía.
6. Guarda y abre **En vivo**. Kino descarga la lista, conserva nombres y grupos M3U y permite buscar los canales cargados. Todos los grupos quedan clasificados con el género Kino `deportes`; no filtra señales por nombre.

La instalación por nombre simple usa la rama predeterminada. Este trabajo no realiza merge ni publica una release. El topic `kino-plugin` ya estaba presente; el repositorio es público y no es fork.

## Permisos y privacidad

- `apiVersion: 3`, capacidades `home`, `resolve`, `channels`; un único `plugin.js` sin dependencias de runtime.
- `hosts: []` es válido desde apiVersion 2 cuando existe un ajuste `url`: los servidores que tú escribes se autorizan para esa instalación. El SDK oficial lo verifica.
- `liveStreamHosts: "any"` requiere aprobación con la línea roja **«Puede reproducir canales desde cualquier servidor que indique su lista»**. Permite streams en hosts públicos HTTP/HTTPS, sus segmentos y redirecciones. No autoriza descargas M3U/XMLTV desde hosts arbitrarios, la red local ajena, DRM ni licencias.
- Cada salto de redirección de lista/guía debe permanecer en un servidor autorizado. Prefiere las URL finales; un CDN distinto debe estar autorizado explícitamente (por ejemplo, la URL final en el ajuste correspondiente). No usamos `fetchHosts`, navegador oculto, cookies, claves ni telemetría.
- HTTP y una IP LAN son posibles para el servidor que escribes, con el esquema/puerto exactos. Loopback no representa tu servidor desde Android y Kino lo rechaza. Prefiere HTTPS fuera de una prueba local.
- El plugin no descarga, almacena ni registra tu lista o configuración. Kino gestiona las descargas y cachés. Los enlaces y cabeceras que ponga tu proveedor siguen siendo sensibles: no los pegues en issues, fixtures o logs públicos. El runner del SDK imprime las URL: revisa cualquier salida antes de compartirla.

## Qué funciona y qué queda pendiente

Kino analiza M3U, agrupa canales y consume XMLTV. `home()` devuelve `[]` porque la navegación es En vivo. `liveChannels({ categoryId, cursor })` devuelve una página vacía porque los grupos de playlist son proveedores nativos de Kino. `resolve()` rechaza refs arbitrarios: los canales de la lista se reproducen directamente (`resolve: false`). No exportamos `guide` ni `liveSearch` ficticios.

El MVP valida direcciones antes de declarar la playlist. La descarga ocurre después, en Kino: listas vacías, fallos HTTP, timeout, redirects y guías inválidas no pueden transformarse en errores personalizados dentro del plugin sin duplicar el lector. Las pruebas verifican la política del SDK y el troubleshooting explica cómo corregirlos. Una guía mal formada puede dar información parcial; un DOCTYPE se rechaza y no impide listar canales.

La compatibilidad de manifiesto/exports y la integración HTTP están probadas con el kit oficial de la plantilla (contrato máximo 7, plugin mínimo 3). No equivalen a reproducción real en QuickJS/Media3. No hay DRM ni fuentes de RojaDirecta integradas. La arquitectura futura está en [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md).

## Desarrollo y pruebas

Node >=18; no necesitas instalar dependencias.

```bash
node --version
node sdk/validate.mjs .
node --test test/*.test.mjs
node test/plugin.test.mjs
node test/integration.mjs
node sdk/run.mjs live playlist test/fixtures/channels.m3u --epg test/fixtures/guide.xml
```

Las pruebas offline usan datos ficticios `.example.org`, sin llamadas de red. La integración crea un servidor HTTP efímero, usa la IP LAN disponible y ejecuta los comandos reales del SDK contra una señal sintética. Necesita permisos de sockets y una interfaz IPv4 que no sea loopback. El archivo `test/fixtures.json` es `{}`: el plugin no llama `kino.fetch`, por lo que no hay respuestas que grabar/reproducir; M3U y XMLTV se prueban directamente con los lectores oficiales. No confundir `--record` de `kino.fetch` con las descargas nativas de playlist.

Para probar tu lista privada (sin subirla), sustituye el valor solo en tu terminal:

```bash
node sdk/run.mjs --config m3uUrl=<URL_AUTORIZADA> . live categories
node sdk/validate.mjs . --config m3uUrl=<URL_AUTORIZADA> --run liveCategories
```

`run.mjs` acepta `--config` antes del directorio; `validate.mjs` acepta la opción después. Ambos rechazan una configuración obligatoria vacía. Los resultados y salidas reales están en [docs/RESULTADOS.md](docs/RESULTADOS.md).

## Prueba manual en Kino Android (pendiente)

1. En un equipo de tu LAN, ejecuta `node test/demo-server.mjs` (puerto 18097 por defecto; `PORT` permite otro). Permite ese puerto en el firewall solo para tu LAN. El servidor de demostración no tiene autenticación: no lo expongas a internet.
2. Conecta Android a la misma red. Usa la IP LAN del equipo, **no** `localhost`, `127.0.0.1` ni la IP de este entorno cloud.
3. Instala la rama del PR como se indica arriba; verifica nombre y versión. Aprueba canales y el permiso de servidores públicos de la lista.
4. Configura `m3uUrl` como `http://IP_LAN:18097/channels.m3u` y `epgUrl` como `http://IP_LAN:18097/guide.xml`.
5. Abre En vivo: debe aparecer el grupo **Fútbol**, con **Señal sintética de prueba**. Busca «sintética»; verifica el resultado y guárdalo como favorito.
6. La guía debe mostrar **Prueba autorizada** a la hora actual (el servidor genera fechas UTC; Kino muestra tu zona horaria). Abre el canal: comprueba imagen de prueba en movimiento, audio de tono y reproducción al menos 30 segundos. Registra modelo, versión Android/Kino, resultado y tiempo hasta imagen.
7. Quita `epgUrl`: después de refrescar/caché debe seguir reproduciéndose sin guía. Repite con `/bad.xml`: se rechaza la guía DOCTYPE y los canales deben mantenerse.
8. Cambia la lista a `/redirect.m3u`: debe funcionar en el mismo servidor. `/empty.m3u`: no hay canales; `/foreign.m3u`: el nuevo host no está autorizado; una URL inválida debe conducir a configuración. No concedas permisos a hosts desconocidos para la prueba negativa.
9. Detén el servidor: registra el comportamiento de error/reintento de Kino; restaura la lista y comprueba recuperación tras refrescar. Verifica favorito y guía tras reiniciar Kino.
10. Apaga el servidor con Ctrl+C. Si compartes un registro de Kino, elimina direcciones privadas y credenciales. Estas comprobaciones **no se han ejecutado en un dispositivo**.

## Solución de problemas

| Síntoma | Acción |
| --- | --- |
| Pide configurar | Revisa que `m3uUrl` no esté vacío y sea HTTP/HTTPS válido; no pongas usuario/contraseña en la autoridad de la URL. |
| No aparecen canales | Comprueba que la respuesta sea M3U, no una página de login/HTML, y tenga `#EXTINF` seguido de una URL autorizada. Una lista de cero canales no crea grupos. |
| Host no permitido | Usa la URL final autorizada; `liveStreamHosts` no permite nuevas direcciones de lista/guía. Revisa esquema y puerto. |
| Timeout o error HTTP | Comprueba conectividad y estado del proveedor. No evade límites, login, captcha ni bloqueo regional. El timeout de transporte simulado no demuestra el plazo real de Android. |
| Canal visible sin guía | Revisa XMLTV, fechas/zona horaria y `tvg-id` correspondiente. Evita DOCTYPE/ENTITY. Guía inválida no significa que el canal esté caído. |
| Canal visible sin video | Un catálogo/iframe no es una transmisión; revisa URL HLS/DASH y permisos del proveedor. La prueba SDK no decodifica video. |
| Cambios que tardan | Playlist: refresco declarado 1 hora; categorías/canales: caché nativa 1 hora; guía: 30 minutos según documentación. Usa refresco disponible o espera la caché. |
| Sale «Tu servidor» | Estás instalando `main` antes de revisar/incorporar el PR. Prueba la rama explícita. |

## Colaborar

Abre un PR pequeño con evidencia del permiso para usar la fuente, hosts/redirects documentados, fixtures sintéticos y comandos reproducibles. Nunca adjuntes cuentas, tokens, cookies o URLs privadas. Conserva SDK, `contract.json` y `kino.d.ts`; no eleves apiVersion por funcionalidades que aún no existen. Antes de incorporar cualquier catálogo real hay que verificar condiciones de uso y derechos por separado del funcionamiento técnico.

Consulta [INTEGRACION-FUENTES.md](INTEGRACION-FUENTES.md), [CHANGELOG.md](CHANGELOG.md) y [docs/RESULTADOS.md](docs/RESULTADOS.md). Código y señal sintética bajo Apache-2.0; atribución en `NOTICE`.
