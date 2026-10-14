// Actual HTTP + official SDK CLI. No private provider URLs or external streams.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import { startDemo } from './demo-server.mjs';
const address = Object.values(networkInterfaces()).flat().find(x => x.family === 'IPv4' && !x.internal)?.address;
assert.ok(address, 'SDK refuses loopback: an IPv4 LAN interface is required');
const server = await startDemo();
const base = `http://${address}:${server.address().port}`;
async function command(args, expected = 0, contains = null) {
  const result = await new Promise((ok, fail) => {
    const child = spawn(process.execPath, args, { cwd: new URL('../', import.meta.url), env: { ...process.env, NO_PROXY: address, no_proxy: address } });
    let output = '';
    child.stdout.on('data', b => output += b); child.stderr.on('data', b => output += b);
    child.once('error', fail); child.once('close', code => ok({ code, output }));
  });
  console.log(`$ node ${args.join(' ').replaceAll(base, '<DEMO_LAN>')}\nexit=${result.code}\n${result.output.replaceAll(base, '<DEMO_LAN>')}`);
  assert.equal(result.code, expected);
  if (contains) assert.match(result.output, contains);
}
try {
  await command(['--version']);
  await command(['sdk/validate.mjs', '.']);
  await command(['sdk/run.mjs', '.', 'home'], 2, /auth_required/);
  await command(['sdk/run.mjs', '.', 'live', 'categories'], 2, /auth_required/);
  const config = ['--config', `m3uUrl=${base}/channels.m3u`, '--config', `epgUrl=${base}/guide.xml`];
  await command(['sdk/run.mjs', ...config, '.', 'home'], 0, /\[\]/);
  await command(['sdk/run.mjs', ...config, '.', 'live', 'categories'], 0, /1 canales/);
  await command(['sdk/validate.mjs', '.', ...config, '--run', 'liveCategories'], 0, /Kino would accept/);
  await command(['sdk/validate.mjs', '.', ...config, '--run', 'home']);
  await command(['sdk/validate.mjs', '.', ...config, '--run', 'liveChannels', 'football']);
  await command(['sdk/run.mjs', 'live', 'playlist', `${base}/channels.m3u`, '--epg', `${base}/guide.xml`], 0, /Prueba autorizada/);
  await command(['sdk/run.mjs', 'live', 'playlist', 'test/fixtures/channels.m3u', '--epg', 'test/fixtures/guide.xml'], 0, /2 canales/);
  await command(['sdk/validate.mjs', '.', '--config', `m3uUrl=${base}/redirect.m3u`, '--run', 'liveCategories']);
  await command(['sdk/validate.mjs', '.', '--config', `m3uUrl=${base}/foreign.m3u`, '--run', 'liveCategories'], 1, /no es un host/);
  await command(['sdk/validate.mjs', '.', '--config', `m3uUrl=${base}/empty.m3u`, '--run', 'liveCategories'], 1, /0 canales/);
  await command(['sdk/run.mjs', 'live', 'playlist', `${base}/channels.m3u`, '--epg', `${base}/bad.xml`], 0, /DOCTYPE/);
  const playlist = await fetch(`${base}/live.m3u8`);
  assert.equal(playlist.status, 200);
  const hls = await playlist.text(); assert.ok(!hls.includes('#EXT-X-ENDLIST'));
  const paths = hls.split('\n').filter(l => l.startsWith('/segment/'));
  assert.equal(paths.length, 3);
  for (const path of paths) {
    const bytes = new Uint8Array(await (await fetch(base + path)).arrayBuffer());
    assert.ok(bytes.length > 0 && bytes.length % 188 === 0);
    assert.equal(bytes[0], 0x47); // MPEG-TS sync, no claim of decoded playback.
  }
  console.log('PASS: HTTP M3U/XMLTV/HLS and three MPEG-TS segments. Android playback pending.');
} finally { await new Promise(ok => server.close(ok)); }
