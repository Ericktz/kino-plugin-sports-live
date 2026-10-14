// Actual runtime adapter audit on private, user-supplied captures (never committed).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { catalogHarness, plain } from '../../test/catalog-harness.mjs';
const dir = process.argv[2]; const out = process.argv[3];
if (!dir || !out) throw new Error('usage: node tools/scraping/corpus.mjs <capture dir> <private output dir>');
mkdirSync(out, { recursive: true });
const inputs = { tvmas: 'Markdown pegado.md', eu: 'Texto pegado (2).txt', kim: 'Texto pegado (3).txt' };
const summary = {};
const { adapters } = catalogHarness();
for (const [site, filename] of Object.entries(inputs)) {
  const bytes = readFileSync(resolve(dir, filename));
  const begin = performance.now();
  const result = plain(adapters.parseCatalog(site, bytes.toString('utf8')));
  const links = result.records.flatMap(r => r.options);
  summary[site] = { sha256: createHash('sha256').update(bytes).digest('hex'), inputBytes: bytes.length,
    adapter_ms: +(performance.now() - begin).toFixed(2), rawRecords: result.rawRecords, records: result.records.length,
    uniqueTitles: result.uniqueTitles, optionCount: result.optionCount, uniqueLinks: new Set(links.map(x => x.url)).size,
    status: result.status, urlKinds: Object.fromEntries([...new Set(links.map(x => x.kind))].map(kind => [kind, links.filter(x => x.kind === kind).length])),
    sports: Object.fromEntries([...new Set(result.records.map(x => x.sport))].map(s => [s, result.records.filter(x => x.sport === s).length])),
    missingFields: Object.fromEntries([...new Set(result.records.flatMap(x => x.missing))].map(s => [s, result.records.filter(x => x.missing.includes(s)).length])),
    playable: result.records.filter(x => x.playable).length, epochTimes: result.records.filter(x => x.start !== null).length,
    networkCalls: 0, iframeCount: result.embeds.length, iframePurposes: result.embeds.map(x => x.purpose), examples: result.records.slice(0, 2) };
  writeFileSync(resolve(out, site + '.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(site, result.rawRecords, result.records.length, result.optionCount, summary[site].uniqueLinks, result.status);
}
writeFileSync(resolve(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
