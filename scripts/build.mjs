// Serve the same buildless page and scripts on GitHub Pages and the live-score host.
import {mkdir, readFile, writeFile} from 'node:fs/promises';

const assets = {};
for (const name of ['index.html', 'rules-guide.js', 'live-table.js']) {
  assets[name] = await readFile(new URL('../' + name, import.meta.url), 'utf8');
}
const worker = await readFile(new URL('../worker.mjs', import.meta.url), 'utf8');
await mkdir('dist/server', {recursive:true});
await writeFile('dist/server/index.js', 'const ASSETS = ' + JSON.stringify(assets) + ';\n' + worker);
