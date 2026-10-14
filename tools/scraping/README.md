# Herramientas offline de Fase 2

Los HTML completos están en el ZIP privado del usuario, nunca en Git. No ejecutar los scripts incrustados ni seguir enlaces de medios. Estas herramientas son de desarrollo, no dependencias del plugin.

```bash
python3 -m venv /tmp/kino-scraping-venv
/tmp/kino-scraping-venv/bin/pip install -r tools/scraping/requirements.txt
CRAWL4_AI_BASE_DIRECTORY=/tmp/kino-crawl4ai /tmp/kino-scraping-venv/bin/python tools/scraping/benchmark.py --dir /RUTA/AL/KIT/capturas --output /tmp/benchmark.json
npm ci
node tools/scraping/corpus.mjs /RUTA/AL/KIT/capturas /tmp/catalogos-extraidos
```

La carpeta debe contener exactamente `Markdown pegado.md`, `Texto pegado (2).txt` y `Texto pegado (3).txt`. Si falta un archivo, el script termina con error. No sustituir capturas reales por fixtures y presentar sus cifras como el benchmark del usuario.

El benchmark ejecuta BeautifulSoup+lxml, BeautifulSoup+html.parser, Scrapling Selector y Crawl4AI JsonCssExtractionStrategy. Mediana de 8 ejecuciones con parseo+extracción+normalización de registros; la normalización de transporte Markdown se hace antes del reloj. No renderiza JS, no utiliza modelos, no hace llamadas HTTP. Compara todos los campos al baseline y 14 campos de una pequeña muestra inspeccionada manualmente, no un gold completo de todos los eventos. Prueba mutaciones benignas, pérdida de selectores y HTML de error 403; no evalúa transporte ni evasión anti-bot de los frameworks.

`corpus.mjs` ejecuta los adaptadores que contiene el verdadero `plugin.js`; Cheerio sustituye **solo en desarrollo** a `kino.html.select` (Jsoup). Guarda los registros completos localmente y resume cifras, deportes, datos ausentes, tipos de URL e iframes. Esa aproximación no acredita el comportamiento exacto de Jsoup/QuickJS en Android.

No instalar Chromium para un benchmark estático: los motores CSS trabajan sobre las capturas locales, sin ejecutar JS externo. Scrapling se ejecuta sin adaptación persistente ni modos de evasión. Crawl4AI no usa su navegador ni una API cloud. El error inicial por directorio home de solo lectura se resolvió con la variable oficial `CRAWL4_AI_BASE_DIRECTORY`; no se cambió HOME.

Versiones del entorno ejecutado en `docs/phase2/python-environment.txt`; los resultados en `docs/phase2/benchmark.json`. El lock Python completo es evidencia de esta plataforma, no requisito del CI Node. Los ejemplos y fixtures públicos son sintéticos; evita publicar capturas, HTML normalizado o URL privadas en nuevas pruebas.
