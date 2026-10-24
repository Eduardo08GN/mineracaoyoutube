// Tracer3D 2.0 - stills quentes na G4: Chrome aberto a sessao inteira, bundle refeito so quando src/ muda.
// Roda dentro do projeto (para achar node_modules): node /content/t2/vm/stills_quente.mjs <projeto>
// POST 127.0.0.1:8766/render {quadros:[...], escala, tag} -> {feitos:[jpg...], falhas:[...], seg, bundle_s}
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {execSync} from 'node:child_process';
import {createRequire} from 'node:module';

const PROJ = path.resolve(process.argv[2] || '.');
const req = createRequire(path.join(PROJ, 'package.json'));
const {openBrowser, selectComposition, renderStill} = req('@remotion/renderer');
const GL = {gl: 'angle-egl'};
const PARALELO = 8;
let browser, comp, assinatura = '', fila = Promise.resolve();

const assinar = (d) => fs.readdirSync(d, {recursive: true}).sort()
	.map((f) => { const s = fs.statSync(path.join(d, f)); return s.isFile() ? `${f}:${s.size}:${s.mtimeMs}` : ''; }).join('|');

async function garantirBundle() {
	const a = assinar(path.join(PROJ, 'src'));
	if (a === assinatura && comp) return 0;
	const t0 = Date.now();
	execSync('npx remotion bundle src/index.tsx --out-dir=bundle_q', {cwd: PROJ, stdio: 'pipe'});
	comp = await selectComposition({serveUrl: path.join(PROJ, 'bundle_q'), id: 'Video', puppeteerInstance: browser, chromiumOptions: GL, logLevel: 'error'});
	assinatura = a;
	return (Date.now() - t0) / 1000;
}

async function render({quadros, escala = 0.5, tag = String(Date.now())}) {
	const bundle_s = await garantirBundle();
	const dir = `/content/t2/st/${tag}`; fs.mkdirSync(dir, {recursive: true});
	const t0 = Date.now(), feitos = [], falhas = [], pend = [...quadros];
	await Promise.all(Array.from({length: Math.min(PARALELO, pend.length)}, async () => {
		while (pend.length) {
			const q = pend.shift(), out = `${dir}/${q}.jpg`;
			try {
				await renderStill({composition: comp, serveUrl: path.join(PROJ, 'bundle_q'), output: out, frame: q, imageFormat: 'jpeg',
					jpegQuality: 88, scale: escala, puppeteerInstance: browser, chromiumOptions: GL, timeoutInMilliseconds: 240000, logLevel: 'error'});
				feitos.push(out);
			} catch (e) { falhas.push({q, erro: String(e).slice(0, 400)}); }
		}
	}));
	return {feitos, falhas, seg: (Date.now() - t0) / 1000, bundle_s};
}

browser = await openBrowser('chrome', {chromiumOptions: GL, chromeMode: 'chrome-for-testing', logLevel: 'error'});
await garantirBundle();
fs.writeFileSync('/content/t2/stills.pronto', String(Date.now()));
console.log('STILLS_QUENTE_PRONTO');

http.createServer((rq, rs) => {
	let b = '';
	rq.on('data', (c) => (b += c));
	rq.on('end', () => {
		// um pedido por vez no bundle (dois rebundles ao mesmo tempo se atropelam); os quadros de cada pedido vao em paralelo
		fila = fila.then(() => render(JSON.parse(b || '{}')))
			.then((r) => { rs.writeHead(200, {'Content-Type': 'application/json'}); rs.end(JSON.stringify(r)); })
			.catch((e) => { rs.writeHead(500); rs.end(JSON.stringify({erro: String(e).slice(0, 800)})); });
	});
}).listen(8766, '127.0.0.1');
