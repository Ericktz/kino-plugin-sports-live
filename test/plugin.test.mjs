import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validate } from '../sdk/validate.mjs';
import { validateManifest, checkOutput, playlistUrlAllowed, liveStreamUrlAllowed } from '../sdk/contract.mjs';
import { createKino } from '../sdk/kino-shim.mjs';
import { download, loadPlaylist, parseXmltv, summarisePlaylist } from '../sdk/live-playlist.mjs';
import * as plugin from '../plugin.js';
const root = new URL('../', import.meta.url).pathname;
const manifestText = readFileSync(new URL('../kino-plugin.json', import.meta.url), 'utf8');
const manifest = validateManifest(manifestText).manifest;
const url = 'https://lists.example.org/channels.m3u';
const config = { m3uUrl: url };
const fixture = readFileSync(new URL('./fixtures/channels.m3u', import.meta.url));
function setup(values = {}) {
  const k = createKino(manifest, { config: values, fetchImpl: () => { throw new Error('unexpected network'); } });
  globalThis.kino = k.kino; return k;
}
const failure = code => e => { assert.equal(e.code, code); return true; };

test('official validator accepts minimum API and exports offline', async () => {
  const r = await validate(root, { replay: new URL('./fixtures.json', import.meta.url).pathname });
  assert.deepEqual(r.problems, []);
  assert.equal(manifest.apiVersion, 3);
  assert.deepEqual(Object.keys(plugin).sort(), ['home', 'liveCategories', 'liveChannels', 'resolve']);
});
test('missing and whitespace configuration return auth_required', async () => {
  for (const value of [undefined, '', '  ']) {
    setup({ m3uUrl: value }); await assert.rejects(plugin.liveCategories(), failure('auth_required'));
  }
});
test('invalid addresses fail without exposing the configured value', async () => {
  for (const value of ['invalid-secret', 'ftp://lists.example.org/a', 'https://user:secret@lists.example.org/a', url + '#secret', url + '\nsecret', 'https://']) {
    setup({ m3uUrl: value });
    await assert.rejects(plugin.liveCategories(), e => { assert.equal(e.code, 'auth_required'); assert.ok(!e.message.includes('secret')); return true; });
  }
});
test('native playlist with optional guide passes actual output contract', async () => {
  const k = setup({ m3uUrl: ` ${url} `, epgUrl: 'https://guide.example.org/guide.xml' });
  const checked = checkOutput('liveCategories', await plugin.liveCategories(), manifest, k.servers);
  assert.deepEqual(checked.drops, []);
  assert.equal(checked.value.playlists[0].url, url);
  assert.equal(checked.value.playlists[0].epgUrl, 'https://guide.example.org/guide.xml');
  assert.equal(checked.value.playlists[0].resolve, false);
  assert.equal(checked.value.playlists[0].genre, 'deportes');
});
test('blank optional XMLTV is omitted; invalid XMLTV address is controlled', async () => {
  setup(config); assert.equal((await plugin.liveCategories())[0].playlist.epg, undefined);
  setup({ ...config, epgUrl: 'not-a-url' }); await assert.rejects(plugin.liveCategories(), failure('auth_required'));
});
test('home and native-only channels are empty; arbitrary resolve is refused', async () => {
  setup(config); assert.deepEqual(await plugin.home(), []);
  assert.deepEqual(await plugin.liveChannels({ categoryId: 'football', cursor: null }), { items: [] });
  await assert.rejects(plugin.resolve('https://untrusted.example.org/a.m3u8'), failure('not_found'));
});
test('SDK groups valid channels and discards invalid/missing URLs', () => {
  const s = summarisePlaylist(fixture, { allow: liveStreamUrlAllowed(manifest, [url]) });
  assert.equal(s.channels, 2); assert.equal(s.skipped, 2);
  assert.deepEqual(s.categories, [{ title: 'Fútbol', count: 1 }, { title: 'Tenis', count: 1 }]);
});
test('XMLTV matches channel id and uses timezone-aware epoch times', () => {
  const g = parseXmltv(readFileSync(new URL('./fixtures/guide.xml', import.meta.url)), { from: Date.UTC(2026,9,14,12), to: Date.UTC(2026,9,14,14) });
  assert.equal(g.programmes['test-football'][0].title, 'Partido sintético');
  assert.equal(g.programmes['test-football'][0].end - g.programmes['test-football'][0].start, 3600000);
});
test('XMLTV DOCTYPE is refused and malformed guide offers no programmes', () => {
  const options = { from: 0, to: Date.now() };
  assert.equal(parseXmltv('<!DOCTYPE tv><tv/>', options).refused, true);
  assert.deepEqual(parseXmltv('this is not XMLTV', options).programmes, {});
});
test('any live streams does not permit playlist or guide hosts', () => {
  const allow = playlistUrlAllowed(manifest, [url]);
  assert.equal(allow(url), true); assert.equal(allow('https://foreign.example.org/a'), false);
  assert.equal(liveStreamUrlAllowed(manifest, [url])('https://media.example.org/live/a.m3u8'), true);
  assert.equal(liveStreamUrlAllowed(manifest, [url])('http://127.0.0.1/a'), false);
});
test('SDK follows same-host redirect and blocks foreign destination before fetch', async () => {
  const seen = [];
  const fetchImpl = async u => {
    seen.push(u);
    return u === url ? new Response(null, { status: 302, headers: { Location: '/final.m3u' } }) : new Response(fixture);
  };
  const s = await loadPlaylist({ url }, { manifest, servers: [url], fetchImpl });
  assert.equal(s.channels, 2); assert.equal(seen.length, 2);
  seen.length = 0;
  await assert.rejects(loadPlaylist({ url }, { manifest, servers: [url], fetchImpl: async u => {
    seen.push(u); return new Response(null, { status: 302, headers: { Location: 'https://foreign.example.org/a' } });
  } }), /no es un host/);
  assert.deepEqual(seen, [url]);
});
test('SDK distinguishes empty playlist, HTTP failure and transport timeout', async () => {
  assert.equal((await loadPlaylist({ url }, { manifest, servers: [url], fetchImpl: async () => new Response('#EXTM3U\n') })).channels, 0);
  await assert.rejects(loadPlaylist({ url }, { manifest, servers: [url], fetchImpl: async () => new Response('', { status: 503 }) }), /503/);
  await assert.rejects(download(url, { maxBytes: 100, fetchImpl: async () => { throw Object.assign(new Error('transport timeout'), { code: 'timeout' }); } }), e => e.code === 'timeout');
});
test('SDK validator fails for empty configured list', async () => {
  const result = await validate(root, { run: 'liveCategories', config, fetchImpl: async () => new Response('#EXTM3U\n') });
  assert.ok(result.problems.length > 0);
});
test('runtime stays inside single-module QuickJS globals', () => {
  const source = readFileSync(new URL('../plugin.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(?:import|require|process|Buffer|setTimeout|setInterval|AbortController|Intl)\b/);
  assert.doesNotMatch(source, /\b(?:fetch|storage|log)\s*\(/);
});
