import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { catalogHarness, plain, manifest } from './catalog-harness.mjs';
import { checkOutput, checkSettingsOutput } from '../sdk/contract.mjs';
const fixture = site => readFileSync(new URL(`./fixtures/catalog/${site}.html`, import.meta.url), 'utf8');
const parse = (site, html = fixture(site)) => plain(catalogHarness().adapters.parseCatalog(site, html));

test('TV Más: verified cards give channels, empty menu requires dynamic agenda', () => {
  const result = parse('tvmas'); assert.equal(result.records.length, 2); assert.equal(result.status, 'requires_dynamic_content');
  assert.equal(result.agenda.eventsExtracted, 0); assert.match(result.agenda.script, /\/js\/index\.js\?v=1.9$/);
  assert.equal(result.records[0].options[0].kind, 'channel_page'); assert.equal(result.records[0].sport, 'unknown');
  assert.equal(result.records[0].timeRaw, null); assert.equal(result.records[0].playable, false);
});
test('TV Más Markdown transport becomes HTML before CSS parsing', () => {
  const html = fixture('tvmas').replaceAll('<', '\\<').replaceAll('>', '\\>').replace('href="/en-vivo/prueba"', 'href="[prueba](https://rojadirectatvmas.net/en-vivo/prueba)"');
  const markdown = html.split('\n').map(line => '| &#x20;' + line + ' |').join('\n');
  assert.deepEqual(parse('tvmas', markdown).records, parse('tvmas').records);
});
test('EU: sports, competition, provider/language/type and raw time; no invented UTC', () => {
  const r = parse('eu').records[0];
  assert.equal(r.title, 'Equipo Uno - Equipo Dos'); assert.equal(r.sport, 'football'); assert.equal(r.sportRaw, 'Fútbol');
  assert.equal(r.competition, 'Copa de prueba'); assert.equal(r.timeRaw, '14:00'); assert.equal(r.dateRaw, '2026-10-14T14:00');
  assert.equal(r.start, null); assert.equal(r.timezone, null); assert.equal(r.options[0].provider, 'Proveedor ficticio');
  assert.equal(r.options[0].language, 'es'); assert.equal(r.options[0].type, 'Html5');
  assert.equal(r.options[1].kind, 'official_page'); assert.equal(r.options[1].playable, false);
});
test('EU table fragments preserve td through innerHTML wrapping', () => {
  const r = parse('eu'); assert.equal(r.rawRecords, 2); assert.equal(r.optionCount, 3);
  assert.equal(r.records[1].options[0].kbps, '500');
});
test('UTF-8 and decoded ISO-8859-1 accents; targeted mojibake repair', () => {
  const { adapters } = catalogHarness();
  assert.equal(adapters.cleanCatalogText('FÃºtbol CrÃ­quet Español'), 'Fútbol Críquet Español');
  const latin = Buffer.from(fixture('eu').replace('FÃºtbol', 'Fútbol'), 'latin1').toString('latin1');
  assert.equal(parse('eu', latin).records[0].sportRaw, 'Fútbol');
  assert.equal(adapters.cleanCatalogText('Básquet Perú'), 'Básquet Perú');
});
test('Kim malformed links repaired, options grouped without merging different times', () => {
  const r = parse('kim'); assert.equal(r.rawRecords, 4); assert.equal(r.records.length, 3); assert.equal(r.uniqueTitles, 2);
  assert.equal(r.records[0].options.length, 2); assert.equal(r.records[0].options[0].kind, 'player_page');
  assert.equal(r.records[0].sport, 'football'); assert.equal(r.records[2].sport, 'basketball');
  assert.equal(r.records[0].dateRaw, null); assert.equal(r.records[0].timezone, null); assert.equal(r.records[0].start, null);
  assert.notEqual(r.records[0].id, r.records[1].id);
});
test('stable ids survive order, new mirror URL and harmless class changes', () => {
  const original = parse('kim');
  const changed = parse('kim', fixture('kim').replace('canal-test.php', 'canal-new.php'));
  assert.deepEqual(changed.records.map(r => r.id), original.records.map(r => r.id));
  assert.deepEqual(parse('tvmas', fixture('tvmas').replaceAll('class="card"', 'class="extra card"')).records, parse('tvmas').records);
});
test('source shape loss is parse_changed; explicit empty table is no_events', () => {
  for (const site of ['tvmas', 'eu', 'kim']) assert.equal(parse(site, '<html>empty unrelated page</html>').status, 'parse_changed');
  assert.equal(parse('kim', '<table id="my-table"><tbody></tbody></table>').status, 'no_events');
  assert.equal(parse('eu', '<table class="taboastreams"></table>').status, 'no_events');
  assert.equal(parse('tvmas', '<ul id="menu"></ul>').status, 'requires_dynamic_content');
});
test('no source link including media candidates becomes playable', () => {
  const { adapters } = catalogHarness();
  assert.equal(adapters.catalogLink('/player/test.php', 'https://rojadirecta.kim/').kind, 'player_page');
  const direct = adapters.catalogLink('https://media.example.org/demo.m3u8?example=value', 'https://example.org/');
  assert.equal(direct.kind, 'media_candidate'); assert.equal(direct.playable, false); assert.equal(direct.rights, 'unverified_rights');
  assert.equal(adapters.catalogLink('javascript:alert(1)', 'https://example.org/'), null);
  assert.equal(adapters.catalogLink('https://user:secret@example.org/a', 'https://example.org/'), null);
});
test('unsupported site and oversized snapshot fail safely', () => {
  assert.throws(() => parse('unknown', '<html/>'), e => e.code === 'not_found');
  assert.throws(() => parse('eu', 'a'.repeat(600001)), e => e.code === 'unavailable');
});
test('consult action fetches only catalog homepage, caches and never follows pages', async () => {
  const seen = [];
  const h = catalogHarness({ catalogSource: 'eu' }, async u => { seen.push(String(u)); return new Response(fixture('eu'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } }); });
  const a = await h.plugin.action('fetchCatalog'); assert.match(a.message, /2 registros/);
  await h.plugin.action('fetchCatalog'); assert.deepEqual(seen, ['http://www.rojadirecta.eu/']);
  const raw = h.kino.storage.get('catalog:eu'); assert.ok(!raw.includes('https://')); assert.ok(!raw.includes('example=private'));
  assert.equal(JSON.parse(raw).records[0].timezone, null);
});
test('native settings and section outputs stay within contract and offer no playable cards', async () => {
  const h = catalogHarness({ catalogSource: 'kim' }, async () => new Response(fixture('kim')));
  await h.plugin.action('fetchCatalog');
  const status = plain(await h.plugin.settingsStatus());
  assert.match(status.catalogEvent1, /Equipo A/); assert.ok(Object.values(status).every(x => x.length <= 200));
  assert.deepEqual(checkSettingsOutput('settingsStatus', status, manifest), status);
  const section = checkOutput('section', plain(await h.plugin.section({ tab: 'kim' })), manifest, h.servers);
  assert.deepEqual(section.drops, []); assert.deepEqual(section.value.rows, []);
  assert.match(section.value.hero.text, /Video sin derechos verificados/);
  const action = checkSettingsOutput('action', plain(await h.plugin.action('nextCatalog')), manifest);
  assert.equal(action.refresh, true);
  assert.deepEqual(plain(await h.plugin.liveChannels({ categoryId: 'kim' })), { items: [] });
});
test('paging and saved query/sport filters work without network', async () => {
  const records = fixture('kim').replace('</tbody>', '<tr><td>11:00</td><td></td><td>Liga de prueba <a href="player/new.php">Cuarto evento</a></td></tr></tbody>');
  const h = catalogHarness({ catalogSource: 'kim' }, async () => new Response(records));
  await h.plugin.action('fetchCatalog'); await h.plugin.settingsStatus();
  await h.plugin.action('nextCatalog'); assert.match((await h.plugin.settingsStatus()).catalogEvent1, /Cuarto evento/);
  await h.plugin.action('previousCatalog'); assert.match((await h.plugin.settingsStatus()).catalogEvent1, /Equipo A/);
  const filtered = catalogHarness({ catalogSource: 'kim', catalogQuery: 'NBA', catalogSport: 'basketball' }, async () => new Response(records));
  await filtered.plugin.action('fetchCatalog'); assert.match((await filtered.plugin.settingsStatus()).catalogStatus, /1 registros/);
  assert.match((await filtered.plugin.settingsStatus()).catalogEvent1, /básquet/);
});
for (const [code, status] of [[401, 'auth_required'], [403, 'blocked'], [429, 'rate_limited'], [451, 'blocked'], [503, 'unavailable']]) {
  test(`HTTP ${code}: ${status}, zero parsing and no retry storm`, async () => {
    let calls = 0;
    const h = catalogHarness({ catalogSource: 'eu' }, async () => { calls++; return new Response('Error or captcha', { status: code }); }, () => { throw new Error('must not parse'); });
    await h.plugin.action('fetchCatalog'); await h.plugin.action('fetchCatalog');
    assert.equal(calls, 1); assert.match((await h.plugin.settingsStatus()).catalogStatus, new RegExp(status));
    assert.deepEqual(plain(await h.plugin.home()), []);
  });
}
for (const code of ['timeout', 'network', 'host_not_allowed']) {
  test(`transport ${code} is reported without exposing request/error content`, async () => {
    const h = catalogHarness({}, async () => { throw Object.assign(new Error('private query secret'), { code }); });
    if (code !== 'network') h.kino.fetch = async () => { throw Object.assign(new Error('private query secret'), { code }); };
    const result = await h.plugin.action('fetchCatalog'); assert.ok(!result.message.includes('secret'));
    assert.match((await h.plugin.settingsStatus()).catalogStatus, new RegExp(code));
  });
}
test('JSON response is unsupported_page; unknown action is not_found', async () => {
  const h = catalogHarness({}, async () => new Response('{}', { headers: { 'content-type': 'application/json' } }));
  await h.plugin.action('fetchCatalog'); assert.match((await h.plugin.settingsStatus()).catalogStatus, /unsupported_page/);
  await assert.rejects(h.plugin.action('unknown'), e => e.code === 'not_found');
});
test('page iframe evidence is separate; social widgets are never video players', () => {
  const result = parse('eu', fixture('eu').replace('</body>', '<iframe src="https://platform.twitter.com/widgets/follow_button.html?screen_name=example"></iframe></body>'));
  assert.equal(result.embeds.length, 1); assert.equal(result.embeds[0].embedding, 'iframe');
  assert.equal(result.embeds[0].purpose, 'social_widget'); assert.equal(result.embeds[0].playable, false);
  assert.equal(result.optionCount, 3);
});
test('cache is isolated from changes to the explicitly configured catalog URL', async () => {
  const h = catalogHarness({ catalogSource: 'eu' }, async () => new Response(fixture('eu')));
  await h.plugin.action('fetchCatalog');
  const other = catalogHarness({ catalogSource: 'eu', catalogUrl: 'https://catalog.example.org/eu.html' });
  other.kino.storage.set('catalog:eu', h.kino.storage.get('catalog:eu'));
  assert.match((await other.plugin.settingsStatus()).catalogStatus, /not_loaded/);
});
test('redirect to undeclared catalog host is blocked before any second fetch', async () => {
  let calls = 0;
  const h = catalogHarness({ catalogSource: 'eu' }, async () => {
    calls++; return new Response(null, { status: 302, headers: { Location: 'https://foreign.example.org/event' } });
  });
  await h.plugin.action('fetchCatalog'); assert.equal(calls, 1);
  assert.match((await h.plugin.settingsStatus()).catalogStatus, /host_not_allowed/);
});
test('partially changed card shape keeps valid records and reports parse_changed', () => {
  const result = parse('tvmas', fixture('tvmas').replace('<h3>Otro canal</h3>', '<h4>Otro canal</h4>'));
  assert.equal(result.rawRecords, 2); assert.equal(result.records.length, 1); assert.equal(result.status, 'parse_changed');
});
test('official fetch shim decodes an ISO-8859-1 response before the adapter', async () => {
  const latin = Buffer.from(fixture('eu').replace('FÃºtbol', 'Fútbol'), 'latin1');
  const h = catalogHarness({ catalogSource: 'eu' }, async () => new Response(latin, { headers: { 'Content-Type': 'text/html; charset=ISO-8859-1' } }));
  await h.plugin.action('fetchCatalog');
  assert.equal(JSON.parse(h.kino.storage.get('catalog:eu')).records[0].sport, 'football');
});
