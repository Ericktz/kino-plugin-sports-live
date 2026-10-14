// Test-only Node server. Generates a rolling HLS manifest over the template's
// Apache-2.0 synthetic card/tone segments; never a third-party broadcast.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
export function startDemo({ host = '0.0.0.0', port = 0 } = {}) {
  const segments = [0, 1, 2].map(n => readFileSync(new URL(`../media/live/canal-1/seg${n}.ts`, import.meta.url)));
  const server = createServer((req, res) => {
    const base = `http://${req.headers.host}`;
    const send = (type, body, status = 200) => {
      res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body);
    };
    const catalog = /^\/catalog\/(tvmas|eu|kim)\.html$/.exec(req.url);
    if (catalog) return send('text/html; charset=utf-8', readFileSync(new URL(`./fixtures/catalog/${catalog[1]}.html`, import.meta.url)));
    if (req.url === '/channels.m3u') return send('audio/x-mpegurl',
      `#EXTM3U\n#EXTINF:-1 tvg-id="demo" group-title="Fútbol",Señal sintética de prueba\n${base}/live.m3u8\n`);
    if (req.url === '/guide.xml') {
      const date = ms => new Date(ms).toISOString().replace(/[-:T]/g, '').slice(0, 14) + ' +0000';
      const start = Math.floor(Date.now() / 3600000) * 3600000;
      return send('application/xml', `<tv><channel id="demo"><display-name>Señal sintética de prueba</display-name></channel><programme channel="demo" start="${date(start)}" stop="${date(start + 3600000)}"><title>Prueba autorizada</title></programme></tv>`);
    }
    if (req.url === '/live.m3u8') {
      const seq = Math.floor(Date.now() / 2000);
      let body = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:2\n#EXT-X-MEDIA-SEQUENCE:${seq}\n`;
      for (let i = 0; i < 3; i++) body += `#EXT-X-DISCONTINUITY\n#EXTINF:2.000,\n/segment/${seq + i}.ts\n`;
      return send('application/vnd.apple.mpegurl', body);
    }
    const segment = /^\/segment\/(\d+)\.ts$/.exec(req.url);
    if (segment) return send('video/mp2t', segments[Number(segment[1]) % 3]);
    if (req.url === '/empty.m3u') return send('audio/x-mpegurl', '#EXTM3U\n');
    if (req.url === '/bad.xml') return send('application/xml', '<!DOCTYPE tv><tv/>');
    if (req.url === '/redirect.m3u') { res.writeHead(302, { Location: '/channels.m3u' }); return res.end(); }
    if (req.url === '/foreign.m3u') { res.writeHead(302, { Location: 'https://undeclared.example.org/channels.m3u' }); return res.end(); }
    return send('text/plain', 'No encontrado', 404);
  });
  return new Promise((ok, fail) => { server.once('error', fail); server.listen(port, host, () => ok(server)); });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await startDemo({ port: Number(process.env.PORT || 18097) });
  console.log(`Demo sintética en puerto ${server.address().port}. Usa la IP LAN del equipo en Android.`);
}
