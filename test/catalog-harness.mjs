// DEVELOPMENT ONLY: Cheerio replaces the SDK's unavailable Jsoup selector.
// Kino runs the original plugin.js with its own native kino.html.select.
import { load } from 'cheerio';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createKino } from '../sdk/kino-shim.mjs';
import { validateManifest } from '../sdk/contract.mjs';
export const manifest = validateManifest(readFileSync(new URL('../kino-plugin.json', import.meta.url), 'utf8')).manifest;
export function htmlSelect(html, css) {
  const $ = load(String(html).slice(0, 2000000));
  return $(css).toArray().slice(0, 500).map(node => ({ text: $(node).text().replace(/\s+/g, ' ').trim(), html: $(node).html() || '', attrs: { ...node.attribs } }));
}
export function catalogHarness(config = {}, fetchImpl = () => { throw new Error('network disabled'); }, selector = htmlSelect) {
  const { kino: nativeKino, servers } = createKino(manifest, { config, fetchImpl });
  const kino = { ...nativeKino, html: { select: selector } };
  const context = vm.createContext({ kino, URL, TextDecoder, TextEncoder, console });
  const code = readFileSync(new URL('../plugin.js', import.meta.url), 'utf8').replace(/export async function/g, 'async function');
  vm.runInContext(code + '\nglobalThis.plugin = { home, resolve, liveCategories, liveChannels, settingsStatus, action, section }; globalThis.adapters = { parseCatalog, catalogLink, cleanCatalogText, normaliseCatalogHtml };', context);
  return { kino, servers, plugin: context.plugin, adapters: context.adapters };
}
export const plain = value => JSON.parse(JSON.stringify(value));
