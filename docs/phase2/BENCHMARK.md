# Benchmark ejecutado · Fase 2

Fecha: 14 de octubre de 2026, America/Santiago. Python 3.12; Node v24.19.0. Se dispone de las **tres capturas del ZIP**. No se solicitó ni descargó video.

## Herramientas investigadas y ejecutadas

| Proyecto oficial | Licencia / versión verificada | Evaluación real y dependencias | Decisión |
| --- | --- | --- | --- |
| [Scrapling](https://github.com/D4Vinci/Scrapling) | BSD-3-Clause; instalado 0.4.15, release v0.4.15 | **EJECUTADO** Selector CSS, no adaptive storage ni fetchers. lxml/cssselect/bs4/w3lib/typing. | Mejor rendimiento estático medido; diagnóstico útil de DOM. No sustituye el parser nativo Kino. |
| [Crawl4AI](https://github.com/unclecode/crawl4ai) | Apache-2.0; instalado 0.9.5, release v0.9.5 | **EJECUTADO** JsonCssExtractionStrategy con listas anidadas. Sin Chromium, LLM o API cloud. Instala Playwright/patchright, parsers, NumPy/SciPy, LiteLLM/OpenAI y otras dependencias aunque no se usen. | Buen JSON declarativo; no mejora precisión aquí ni justifica cargarlo en runtime. Render JS NO PROBADO. |
| [Crawlee JS](https://github.com/apify/crawlee) | Apache-2.0; release v3.18.2 | README oficial revisado. **NO PROBADO**: no se instaló ni ejecutó; ya se ejecutaron los dos candidatos prioritarios. Orquestación de requests/colas, Cheerio y Playwright; navegador instalado aparte. | Harness futuro si hace falta crawling multi-página; no para estos snapshots simples. |
| [Playwright](https://github.com/microsoft/playwright) | Apache-2.0; release v1.64.1. Paquete Python 1.64.0 instalado por Crawl4AI | **NO PROBADO** como navegador/extractor: no se instaló ni lanzó Chromium. Instalar el paquete no demuestra render. | Candidato cuando exista acceso permitido al JS. No ejecuta en QuickJS. |
| [ScrapeGraphAI](https://github.com/ScrapeGraphAI/Scrapegraph-ai) | MIT; release v2.3.1 | README oficial revisado. **NO PROBADO**: no se instaló/corrió; no se configuró un modelo/API y el corpus se resuelve determinísticamente. Dependencias/operación de grafo+LLM para extracción semántica. | Sin ventaja demostrada; no inferir precisión ni coste de ejecución. |

[grrp/scrapling](https://github.com/grrp/scrapling) responde como **fork de D4Vinci/Scrapling**, no se trató como alias canónico ni como herramienta distinta. Licencias/releases verificadas con API GitHub; README descargados del repositorio oficial. Firecrawl y browser-use eran opcionales y no se instalaron ni evaluaron.

## Metodología y alcance

El script `tools/scraping/benchmark.py` carga los nombres exactos del kit y falla si falta uno. Normaliza la tabla Markdown A **antes** de medir. Cada combinación se ejecuta 8 veces: parseo completo, selección CSS, campos/listas de proveedores y canonicalización; mediana en ms. Importación, instalación, Markdown y red quedan fuera del reloj. El p95 por nearest-rank de 8 observaciones es el máximo de esas 8. No comparar directamente con el benchmark inicial del ZIP: sus tiempos medían otra ruta y el documento inicial incluía cifras distintas a su JSON. Las cifras de abajo son de esta ejecución.

El corpus no ejecuta JS ni recursos incrustados. **0 llamadas de red, 0 llamadas LLM** en cada combinación. El parser HTML tradicional se ejecuta con BeautifulSoup+lxml y BeautifulSoup+html.parser. Scrapling hace selección CSS real; Crawl4AI ejecuta su estrategia CSS→JSON real, no una comparación de README. Su renderizado, tolerancia a captcha/Cloudflare y red no se han probado.

Los resultados completos de campos de los cuatro motores coinciden con el baseline. Una muestra auditada manualmente verifica **14/14 campos por motor**: título/página de dos canales A; título/fecha de dos eventos B; título/hora/competición de dos filas C. No es anotación completa del corpus ni demuestra una precisión global del 100 %. Deporte/competiciones/proveedores detallados del runtime se verifican además con fixtures representativos y ejemplos del corpus.

## Medianas reales (ms)

| Motor instalado | TV Más: 20 | EU: 79 | Kim: 87 | Coincidencia de campos / muestra |
| --- | ---: | ---: | ---: | --- |
| lxml | 8.7 | 478.14 | 27.76 | Baseline coincidente; 14/14 campos manuales |
| html.parser | 11.62 | 409.18 | 31.13 | Baseline coincidente; 14/14 campos manuales |
| scrapling | 1.66 | 57.15 | 13.86 | Baseline coincidente; 14/14 campos manuales |
| crawl4ai | 13.38 | 415.09 | 35.23 | Baseline coincidente; 14/14 campos manuales |

Todos dan 20/79/87 registros, 20/371/66 URLs únicas, 480 opciones B, 44 títulos C y **0 URLs multimedia** en las opciones. Las 87 filas C se miden antes de la deduplicación del adaptador.

## Robustez y recursos

| Motor | Pico Python trazado KiB A / B / C | Cambio benigno | Selector eliminado | HTML 403 |
| --- | --- | --- | --- | --- |
| lxml | 568.5 / 9373.5 / 682.6 | Mismos campos en los tres sitios | Cero registros en los tres; sin autorrecuperación | Cero registros; extractor sin awareness de HTTP |
| html.parser | 576.4 / 9995.2 / 741.9 | Mismos campos en los tres sitios | Cero registros en los tres; sin autorrecuperación | Cero registros; extractor sin awareness de HTTP |
| scrapling | 15.5 / 258.2 / 54.8 | Mismos campos en los tres sitios | Cero registros en los tres; sin autorrecuperación | Cero registros; extractor sin awareness de HTTP |
| crawl4ai | 566.6 / 9375.5 / 684.5 | Mismos campos en los tres sitios | Cero registros en los tres; sin autorrecuperación | Cero registros; extractor sin awareness de HTTP |

Mutaciones benignas: clase adicional y comentario en tbody; destructivas: `card`, `SportsEvent`, `my-table` renombrados. No demuestra resistencia a cualquier cambio. La adaptación automática de Scrapling está **desactivada/no probada**: no se inventa su recuperación de selectores.

`tracemalloc` mide allocations Python de una extracción adicional, no memoria nativa de lxml/Scrapling/Chromium, RSS ni proceso total. Su cifra menor no demuestra por sí sola menor RAM total. El venv combinado ocupó **838 MiB** y `pip freeze` registró **99 distribuciones**; no es un footprint atribuible a cada herramienta. La extracción estática no necesitó navegador ni clave de pago.

Un HTML de error 403 se probó como texto local; los cuatro extractores dan vacío y no conocen el status HTTP. La política correcta es rechazar 403 **antes del parser**: la implementa el plugin, con tests de respuesta 401/403/429/451/503 y redirect no autorizado. El transporte HTTP de los frameworks no se benchmarkeó. Los 403 de acceso externo sí se registran en `access.json`; no se reintentó con modos de evasión.

## Errores reales durante la preparación

- Primer import Crawl4AI: `OSError: [Errno 30] Read-only file system: /home/agent/.crawl4ai`. Resuelto con su variable oficial `CRAWL4_AI_BASE_DIRECTORY=/workspace/scratch/fase2-crawl`. Luego se ejecutó con éxito.
- Primer npm install: cache home no escribible (`ENOENT /home/agent/.npm/_cacache`). Resuelto usando `--cache /workspace/scratch/npm-cache`; Cheerio 1.0.0 instalado y fijado en lockfile.
- Python global no tenía BeautifulSoup. Se creó un venv y se instaló la lista de dependencias. No se afirma que el Python base traiga esos frameworks.

## Evidencias y reproducción

Los hashes SHA-256 de las tres capturas están en `benchmark.json` y coinciden con `corpus-summary.json`. El HTML completo, el código de terceros incrustado y los registros completos permanecen en `/workspace/scratch/fase2-kit` y `/workspace/scratch/fase2-extracted`, fuera de Git. No se ejecuta ese código ni se sigue una URL de opción. Los JSON públicos incluyen conteos y dos ejemplos sin credenciales; no copias del HTML.

Comandos exactos ejecutados:

```bash
python -m venv /workspace/scratch/fase2-venv
/workspace/scratch/fase2-venv/bin/pip install beautifulsoup4 lxml scrapling crawl4ai
/workspace/scratch/fase2-venv/bin/python /workspace/scratch/fase2-kit/scripts/benchmark.py --dir /workspace/scratch/fase2-kit/capturas --output /workspace/scratch/fase2-baseline.json
CRAWL4_AI_BASE_DIRECTORY=/workspace/scratch/fase2-crawl /workspace/scratch/fase2-venv/bin/python tools/scraping/benchmark.py --dir /workspace/scratch/fase2-kit/capturas --output /workspace/scratch/fase2-benchmark-final.json
node tools/scraping/corpus.mjs /workspace/scratch/fase2-kit/capturas /workspace/scratch/fase2-extracted
```

La guía portable está en [tools/scraping/README.md](../../tools/scraping/README.md).

Salida real final:

```text
lxml tvmas 20 8.7 ms equal= True
lxml eu 79 478.14 ms equal= True
lxml kim 87 27.76 ms equal= True
html.parser tvmas 20 11.62 ms equal= True
html.parser eu 79 409.18 ms equal= True
html.parser kim 87 31.13 ms equal= True
scrapling tvmas 20 1.66 ms equal= True
scrapling eu 79 57.15 ms equal= True
scrapling kim 87 13.86 ms equal= True
crawl4ai tvmas 20 13.38 ms equal= True
crawl4ai eu 79 415.09 ms equal= True
crawl4ai kim 87 35.23 ms equal= True
```

## Recomendación

Runtime autónomo determinista con `kino.html.select`: suficiente para B/C y canales A. Scrapling resulta útil para diagnóstico local rápido; Crawl4AI para esquemas JSON y un eventual reconocimiento de JS cuando el acceso legítimo lo permita. No se incorpora ningún paquete Python/npm al plugin, ni se exige backend, API comercial o LLM en cada consulta.
