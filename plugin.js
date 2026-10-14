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
    throw kino.error("auth_required", "Revisa la dirección de " + (key === "m3uUrl" ? "la lista M3U." : "la guía XMLTV."));
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
  const url = configuredUrl("m3uUrl", true);
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
