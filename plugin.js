/// <reference path="./kino.d.ts" />
// One QuickJS module. Kino owns playlist downloads, grouping, search and XMLTV.
const read = (key) => String(kino.config.get(key) || "").trim();

// Synchronous helper: callers have already awaited (older QuickJS rejection trap).
function configuredUrl(key, required) {
  const value = read(key);
  if (!value) {
    if (required) throw kino.error("auth_required", "Configura la lista M3U autorizada en los ajustes.");
    return null;
  }
  let url;
  try { url = new URL(value); } catch {
    throw kino.error("auth_required", "Revisa la dirección de " + (key === "m3uUrl" ? "la lista M3U." : key === "epgUrl" ? "la guía XMLTV." : "el catálogo."));
  }
  // HTTP and LAN are allowed only because the person explicitly typed this URL.
  // Kino applies its stricter host/IP policy, including every redirect, at download.
  if (!/^https?:$/.test(url.protocol) || !url.hostname || url.username || url.password ||
      url.hash || /[\u0000-\u0020\u007f]/.test(value) || value.length > 2048) {
    throw kino.error("auth_required", "Usa una dirección HTTP o HTTPS sin credenciales integradas ni fragmento.");
  }
  return value;
}

export async function home() {
  await null;
  return [];
}

export async function resolve(ref) {
  await null;
  // Native M3U entries play directly: never turn an arbitrary ref into a stream.
  throw kino.error("not_found", "Abre los canales de esta lista desde En vivo.");
}

export async function liveCategories() {
  await null;
  const url = configuredUrl("m3uUrl", false);
  if (!url) return [];
  const epgUrl = configuredUrl("epgUrl", false);
  const playlist = { url, format: "m3u", genre: "deportes", refreshHours: 1, resolve: false };
  if (epgUrl) playlist.epg = { url: epgUrl, format: "xmltv" };
  return [{ playlist }];
}

export async function liveChannels({ categoryId, cursor } = {}) {
  await null;
  // Playlist groups are native Kino providers; no adapter-owned categories yet.
  return { items: [] };
}

// Catalog adapters use verified snapshot selectors, never a video extractor.
// No imports, browser automation, or requests to source/player links in runtime.
const CATALOGS = {
  tvmas: { label: "TV Más", url: "https://rojadirectatvmas.net/" },
  eu: { label: "RojaDirecta.eu", url: "http://www.rojadirecta.eu/" },
  kim: { label: "RojaDirecta.kim", url: "https://rojadirecta.kim/" },
};
const CACHE_MS = 15 * 60 * 1000;
const RETRY_MS = 60 * 1000;
const MAX_CATALOG_CHARS = 600000;
const PAGE_SIZE = 3;
const select = (body, css) => kino.html.select(body, css);
const first = (body, css) => select(body, css)[0] || null;
const valueText = (body, css) => first(body, css)?.text || "";
const valueAttr = (body, css, key) => first(body, css)?.attrs[key] || "";

function cleanCatalogText(value) {
  const fixes = { "Ã¡": "á", "Ã©": "é", "Ã­": "í", "Ã³": "ó", "Ãº": "ú", "Ã±": "ñ", "Ã¼": "ü", "Ã‘": "Ñ", "Â ": " " };
  let text = String(value || "");
  for (const [bad, good] of Object.entries(fixes)) text = text.split(bad).join(good);
  return text.replace(/\s+/g, " ").trim();
}
function normaliseCatalogHtml(body, site) {
  let html = String(body);
  if (html.length > MAX_CATALOG_CHARS) throw kino.error("unavailable", "El catálogo excede el tamaño permitido.");
  if (site === "tvmas" && html.includes("\\<")) {
    // Snapshot transport only: do not evaluate HTML or its inline JavaScript.
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_, label, url) => url)
      .replace(/\\([<>/])/g, "$1").replace(/&#x20;|&#32;/gi, " ")
      .split("\n").map(line => line.replace(/^\s*\|\s?|\s*\|\s*$/g, "")).join("\n");
  }
  return html;
}
function catalogLink(value, base, role = "event_page") {
  try {
    const u = new URL(value, base);
    if (!/^https?:$/.test(u.protocol) || u.username || u.password || !value) return null;
    // URLs remain evidence only. Neither a filename nor an official name proves rights.
    const kind = /\.(m3u8|mpd|mp4)(?:$)/i.test(u.pathname) ? "media_candidate" :
      /\/player\/[^/]+\.php$/i.test(u.pathname) ? "player_page" :
      ["www.rtve.es", "rtve.es", "auvio.rtbf.be", "www.uefa.tv", "uefa.tv"].includes(u.hostname) ? "official_page" : role;
    u.hash = "";
    return { url: u.toString(), kind, rights: "unverified_rights", playable: false };
  } catch { return null; }
}
function sportOf(text) {
  const s = cleanCatalogText(text).toLowerCase();
  if (/fútbol|futbol|football|soccer|uefa|libertadores|sudamericana|premier league|\bmls\b|la liga|liga española|serie a/.test(s)) return "football";
  if (/tenis|tennis/.test(s)) return "tennis";
  if (/baloncesto|básquet|basquet|basketball|\bnba\b|eurobkb|\bbkb\b/.test(s)) return "basketball";
  if (/cycling|ciclismo|cricket|críquet|handball|balonmano|hockey|volleyball|voleibol|baseball|béisbol|\bmlb\b|rugby|motor|boxing|boxeo|\bnfl\b/.test(s)) return "other";
  return "unknown";
}
function catalogId(site, identity) {
  return site + "-" + kino.crypto.hash("sha256", identity).slice(0, 24);
}
function catalogRecord(site, fields) {
  return { ...fields, id: catalogId(site, [fields.kind, fields.title, fields.competition || "", fields.dateRaw || "", fields.timeRaw || ""].join("|")),
    site, start: null, timezone: null, rights: "unverified_rights", playable: false };
}
function mergeCatalogRecords(records) {
  const unique = new Map();
  for (const record of records) {
    if (!unique.has(record.id)) unique.set(record.id, { ...record, rowCount: 0, options: [] });
    const target = unique.get(record.id); target.rowCount++;
    for (const option of record.options) {
      if (!target.options.some(x => x.url === option.url && x.provider === option.provider && x.language === option.language && x.type === option.type)) target.options.push(option);
    }
  }
  return [...unique.values()];
}
function parseTvmas(html) {
  const records = [];
  const cards = select(html, "article.card");
  for (const card of cards) {
    const title = cleanCatalogText(valueText(card.html, "h3"));
    const option = catalogLink(valueAttr(card.html, "a.btn-watch[href]", "href"), CATALOGS.tvmas.url, "channel_page");
    if (!title || !option) continue;
    records.push(catalogRecord("tvmas", { kind: "channel", title, sport: "unknown", competition: null, timeRaw: null, dateRaw: null,
      logo: catalogLink(valueAttr(card.html, "img[src]", "src"), CATALOGS.tvmas.url, "image")?.url || null,
      missing: ["sport", "competition", "date", "time", "timezone", "authorized_stream"], options: [{ ...option, provider: title, language: null, type: null }] }));
  }
  const menu = first(html, "#menu");
  const dynamic = !!menu && !first("<ul>" + menu.html + "</ul>", "li");
  // Actual verified src; no hard-coded inference of an API behind the script.
  const agendaScript = select(html, "script[src]").map(x => catalogLink(x.attrs.src, CATALOGS.tvmas.url, "script"))
    .find(x => x && /\/js\/index\.js$/.test(new URL(x.url).pathname))?.url || null;
  const status = records.length ? (records.length < cards.length ? "parse_changed" : dynamic ? "requires_dynamic_content" : "ok") : cards.length ? "parse_changed" : menu ? "requires_dynamic_content" : "parse_changed";
  return { records: mergeCatalogRecords(records), rawRecords: cards.length, status, agenda: { status: "requires_dynamic_content", script: agendaScript, eventsExtracted: 0 } };
}
function parseEu(html) {
  const records = [];
  const nodes = select(html, '[itemtype*="SportsEvent"]');
  for (const node of nodes) {
    const header = first(node.html, ".menutitle");
    const title = cleanCatalogText(valueText(node.html, '[itemprop="name"]'));
    if (!header || !title) continue;
    const dateRaw = valueAttr(node.html, '[itemprop="startDate"]', "content") || null;
    const prefix = cleanCatalogText(header.text).split(": ").slice(0, -1).join(": ") || cleanCatalogText(header.text);
    const competition = /\(([^)]+)\)/.exec(prefix)?.[1] || null;
    const sportRaw = cleanCatalogText(valueText(header.html, ".es") || valueText(header.html, ".en") || prefix.replace(/^\d{2}:\d{2}\s*/, "").split("(")[0]);
    const timeRaw = dateRaw?.match(/T(\d{2}:\d{2})/)?.[1] || cleanCatalogText(valueText(header.html, ".t")) || null;
    const options = [];
    for (const row of select(node.html, "table.taboastreams tr")) {
      // Kino returns INNER HTML. Wrap table fragments so Jsoup retains td elements.
      const fragment = "<table><tbody><tr>" + row.html + "</tr></tbody></table>";
      const cells = select(fragment, "td");
      const link = catalogLink(valueAttr(fragment, "a[href]", "href"), CATALOGS.eu.url);
      if (!link) continue;
      options.push({ ...link, provider: cleanCatalogText(cells[1]?.text), language: cleanCatalogText(cells[2]?.text),
        type: cleanCatalogText(cells[3]?.text), p2p: cleanCatalogText(cells[0]?.text), kbps: cleanCatalogText(cells[4]?.text) });
    }
    const missing = ["timezone", "authorized_stream"];
    if (!dateRaw) missing.push("date"); if (!timeRaw) missing.push("time"); if (!competition) missing.push("competition"); if (sportOf(sportRaw) === "unknown") missing.push("sport");
    records.push(catalogRecord("eu", { kind: "event", title, sport: sportOf(sportRaw), sportRaw, competition, dateRaw, timeRaw, missing, options }));
  }
  return { records: mergeCatalogRecords(records), rawRecords: nodes.length, status: records.length ? (records.length < nodes.length ? "parse_changed" : "ok") : first(html, "table.taboastreams") ? "no_events" : "parse_changed" };
}
function parseKim(html) {
  const records = [];
  const rows = select(html, "#my-table tbody tr");
  for (const row of rows) {
    const fragment = "<table><tbody><tr>" + row.html + "</tr></tbody></table>";
    const cells = select(fragment, "td");
    if (cells.length < 3) continue;
    const a = first(cells[2].html, "a[href]");
    const title = cleanCatalogText(a?.text);
    const link = catalogLink(a?.attrs.href || "", CATALOGS.kim.url);
    if (!title || !link) continue;
    const competition = cleanCatalogText(cells[2].text).replace(title, "").trim() || null;
    const timeRaw = cleanCatalogText(cells[0].text) || null;
    const sportRaw = valueAttr(cells[1].html, "span.evento", "class");
    // Unverified icon classes do not identify a sport; NBA/bkb are explicit labels.
    const sport = sportOf(sportRaw + " " + competition);
    records.push(catalogRecord("kim", { kind: "event", title, competition, sport, timeRaw, dateRaw: null,
      missing: ["date", "timezone", "authorized_stream", ...(sport === "unknown" ? ["sport"] : [])],
      options: [{ ...link, provider: null, language: null, type: null }] }));
  }
  return { records: mergeCatalogRecords(records), rawRecords: rows.length, status: records.length ? (records.length < rows.length ? "parse_changed" : "ok") : first(html, "#my-table") ? "no_events" : "parse_changed" };
}
function parseCatalog(site, body) {
  const html = normaliseCatalogHtml(body, site);
  const result = site === "tvmas" ? parseTvmas(html) : site === "eu" ? parseEu(html) : site === "kim" ? parseKim(html) : null;
  if (!result) throw kino.error("not_found", "Fuente de catálogo desconocida.");
  const embeds = select(html, "iframe[src]").map(node => {
    const link = catalogLink(node.attrs.src, CATALOGS[site].url, "embedded_page");
    if (!link) return null;
    const u = new URL(link.url);
    return { ...link, embedding: "iframe", purpose: u.hostname === "platform.twitter.com" && u.pathname.startsWith("/widgets/") ? "social_widget" : "unknown" };
  }).filter(Boolean);
  return { ...result, site, embeds, uniqueTitles: new Set(result.records.map(r => r.title)).size,
    optionCount: result.records.reduce((n, r) => n + r.options.length, 0), rights: "unverified_rights" };
}

function sourceKey() { const key = read("catalogSource"); return CATALOGS[key] ? key : "tvmas"; }
function catalogScope(site) { return kino.crypto.hash("sha256", read("catalogUrl") || CATALOGS[site].url); }
function cachedCatalog(site) {
  const raw = kino.storage.get("catalog:" + site);
  if (!raw) return { site, status: "not_loaded", records: [], fetchedAt: null };
  try { const data = JSON.parse(raw); return data.scope === catalogScope(site) ? data : { site, status: "not_loaded", records: [] }; } catch { return { site, status: "parse_changed", records: [] }; }
}
function storeCatalog(site, data) {
  // Do not persist third-party URLs, query tokens, HTML or settings. Compact metadata only.
  const records = data.records.map(r => ({ id: r.id, title: r.title.slice(0, 160), kind: r.kind, sport: r.sport,
    competition: r.competition?.slice(0, 120) || null, dateRaw: r.dateRaw, timeRaw: r.timeRaw, timezone: null,
    optionCount: r.options.length, languages: [...new Set(r.options.map(x => x.language).filter(Boolean))].slice(0, 3).join(", ").slice(0, 20),
    types: [...new Set(r.options.map(x => x.type).filter(Boolean))].slice(0, 2).join(", ").slice(0, 30), providers: [...new Set(r.options.map(x => x.provider).filter(Boolean))].slice(0, 3).join(", ").slice(0, 80) }));
  const compact = { site, scope: catalogScope(site), status: data.status, fetchedAt: Date.now(), rawRecords: data.rawRecords, uniqueTitles: data.uniqueTitles,
    optionCount: data.optionCount, records, rights: "unverified_rights" };
  // Conservative bound for three sources inside Kino's 256 KiB shared store.
  while (JSON.stringify(compact).length > 35000 && compact.records.length) { compact.records.pop(); compact.truncated = true; }
  kino.storage.set("catalog:" + site, JSON.stringify(compact), { ttlMs: CACHE_MS });
  return compact;
}
function filteredCatalog(data) {
  const query = cleanCatalogText(read("catalogQuery")).toLowerCase();
  const sport = read("catalogSport") || "all";
  return data.records.filter(r => (sport === "all" || r.sport === sport) &&
    (!query || cleanCatalogText(r.title + " " + (r.competition || "") + " " + (r.providers || "")).toLowerCase().includes(query)));
}
function visibleCatalog(site) {
  const data = cachedCatalog(site); const records = filteredCatalog(data);
  const scope = kino.crypto.hash("sha256", read("catalogQuery") + "|" + read("catalogSport"));
  if (kino.storage.get("catalog-filter:" + site) !== scope) {
    kino.storage.set("catalog-filter:" + site, scope); kino.storage.set("catalog-page:" + site, "0");
  }
  const page = Math.max(0, Math.min(Number(kino.storage.get("catalog-page:" + site)) || 0, Math.max(0, Math.ceil(records.length / PAGE_SIZE) - 1)));
  return { data, records, page, entries: records.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) };
}
function recordLine(r) {
  if (!r) return "Sin registro en esta página.";
  const time = [r.dateRaw?.split("T")[0], r.timeRaw].filter(Boolean).join(" ") || "Horario no indicado";
  return (time + " · " + r.title + (r.competition ? " · " + r.competition : "") +
    " · " + r.optionCount + " páginas" + (r.providers ? " · " + r.providers : "") +
    (r.languages ? " [" + r.languages + "]" : "") + (r.types ? " · " + r.types : "") + " · sin zona").slice(0, 200);
}
export async function settingsStatus() {
  await null;
  const site = sourceKey(); const { data, records, page, entries } = visibleCatalog(site);
  return { catalogStatus: (CATALOGS[site].label + ": " + data.status + "; " + records.length + " registros; página " + (page + 1) + "/" + Math.max(1, Math.ceil(records.length / PAGE_SIZE)) + (data.truncated ? "; recortado" : "")).slice(0, 200),
    catalogNotice: "Solo información. Derechos de video no verificados; las páginas del catálogo no se reproducen. Caché de consulta: quince minutos.",
    catalogEvent1: recordLine(entries[0]), catalogEvent2: recordLine(entries[1]), catalogEvent3: recordLine(entries[2]) };
}
export async function action(key) {
  await null;
  const site = sourceKey();
  if (key === "nextCatalog" || key === "previousCatalog") {
    const { records, page } = visibleCatalog(site);
    const next = Math.max(0, Math.min(page + (key === "nextCatalog" ? 1 : -1), Math.max(0, Math.ceil(records.length / PAGE_SIZE) - 1)));
    kino.storage.set("catalog-page:" + site, String(next));
    return { message: "Catálogo informativo: página " + (next + 1) + ".", refresh: true };
  }
  if (key !== "fetchCatalog") throw kino.error("not_found", "Acción desconocida.");
  const saved = cachedCatalog(site);
  if (saved.fetchedAt && Date.now() - saved.fetchedAt < CACHE_MS) return { message: "Se muestra el catálogo en caché. La consulta se renueva después de quince minutos.", refresh: true };
  const last = Number(kino.storage.get("catalog-attempt:" + site)) || 0;
  if (Date.now() - last < RETRY_MS) return { message: "Espera un minuto antes de volver a consultar esta fuente.", refresh: true };
  kino.storage.set("catalog-attempt:" + site, String(Date.now()));
  let status;
  try {
    const url = configuredUrl("catalogUrl", false) || CATALOGS[site].url;
    const response = await kino.fetch(url, { timeoutMs: 10000, cookies: false });
    if (response.status === 401) status = "auth_required";
    else if (response.status === 403 || response.status === 451) status = "blocked";
    else if (response.status === 429) status = "rate_limited";
    else if (!response.ok) status = "unavailable";
    else {
      const body = response.text();
      // JS files, JSON and challenge/error pages are not accepted as an empty catalog.
      const type = response.headers["content-type"] || "";
      if (type && !/html|text\/plain/i.test(type)) status = "unsupported_page";
      else {
        const parsed = parseCatalog(site, body);
        storeCatalog(site, parsed); kino.storage.set("catalog-page:" + site, "0");
        return { message: "Catálogo informativo actualizado: " + parsed.records.length + " registros. Video sin autorización verificada.", refresh: true };
      }
    }
  } catch (e) {
    status = ["timeout", "network", "host_not_allowed", "too_large", "unavailable", "auth_required"].includes(e.code) ? e.code : "parse_changed";
  }
  // Negative result expires too; no retries/hidden browser/captcha automation.
  kino.storage.set("catalog:" + site, JSON.stringify({ site, scope: catalogScope(site), status, records: [], fetchedAt: null }), { ttlMs: RETRY_MS });
  return { message: "La consulta no pudo completarse: " + status + ". Puedes seguir usando tu lista autorizada.", refresh: true };
}
export async function section({ tab } = {}) {
  await null;
  const site = CATALOGS[tab] ? tab : sourceKey();
  const { data, entries } = visibleCatalog(site);
  // The contract has no non-playable event item. Show an informational banner,
  // with the complete paged/filterable reader in the plugin's native settings.
  return { tabs: Object.entries(CATALOGS).map(([id, source]) => ({ id, label: source.label })), tab: site,
    hero: { title: "Agenda informativa · " + CATALOGS[site].label,
      text: (data.status + ". Consulta y filtra en Ajustes de este plugin. Video sin derechos verificados. " + entries.map(r => r.title).join("; ")).slice(0, 300) }, rows: [] };
}
