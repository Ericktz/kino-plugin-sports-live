// Actual HTTP and official kino.fetch shim; CSS is the DEVELOPMENT Cheerio stand-in.
// This checks the UI contract, not Android's native Jsoup/QuickJS rendering.
import assert from 'node:assert/strict';
import { networkInterfaces } from 'node:os';
import { catalogHarness, plain, manifest } from './catalog-harness.mjs';
import { checkOutput, checkSettingsOutput } from '../sdk/contract.mjs';
import { loadPlaylist } from '../sdk/live-playlist.mjs';
import { startDemo } from './demo-server.mjs';
const address = Object.values(networkInterfaces()).flat().find(x => x.family === 'IPv4' && !x.internal)?.address;
assert.ok(address);
const server = await startDemo(); const base = `http://${address}:${server.address().port}`;
try {
  for (const [site, expected] of [['tvmas', 2], ['eu', 2], ['kim', 3]]) {
    const config = { catalogSource: site, catalogUrl: `${base}/catalog/${site}.html`, m3uUrl: `${base}/channels.m3u`, epgUrl: `${base}/guide.xml` };
    const h = catalogHarness(config, globalThis.fetch);
    const result = checkSettingsOutput('action', plain(await h.plugin.action('fetchCatalog')), manifest);
    assert.match(result.message, new RegExp(`${expected} registros`));
    const state = checkSettingsOutput('settingsStatus', plain(await h.plugin.settingsStatus()), manifest);
    assert.match(state.catalogStatus, new RegExp(`${expected} registros`));
    const section = checkOutput('section', plain(await h.plugin.section({ tab: site })), manifest, h.servers);
    assert.deepEqual(section.drops, []); assert.equal(section.value.tab, site); assert.deepEqual(section.value.rows, []);
    const categories = checkOutput('liveCategories', plain(await h.plugin.liveCategories()), manifest, h.servers).value;
    const m3u = await loadPlaylist(categories.playlists[0], { manifest, servers: h.servers });
    assert.equal(m3u.channels, 1); assert.equal(categories.playlists[0].epgUrl, `${base}/guide.xml`);
    await assert.rejects(h.plugin.resolve(site + '-any-page'), e => e.code === 'not_found');
    console.log(`PASS HTTP ${site}: ${expected} catalog records, UI output accepted, authorized M3U preserved, page playback refused`);
  }
} finally { await new Promise(ok => server.close(ok)); }
