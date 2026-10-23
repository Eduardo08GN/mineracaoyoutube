// confere se cada pacote do node_modules tem o arquivo de entrada (main/module/exports ".") — npm install truncado (23/10/2026)
import fs from 'fs'; import path from 'path';
const NM = process.argv[2]; const ruins = [];
const pkgs = [];
for (const d of fs.readdirSync(NM)) {
  if (d.startsWith('.')) continue;
  if (d.startsWith('@')) for (const e of fs.readdirSync(path.join(NM, d))) pkgs.push(path.join(d, e)); else pkgs.push(d);
}
for (const p of pkgs) {
  const pj = path.join(NM, p, 'package.json');
  if (!fs.existsSync(pj)) { ruins.push(p + ' (sem package.json)'); continue; }
  let j; try { j = JSON.parse(fs.readFileSync(pj, 'utf8')); } catch { ruins.push(p + ' (package.json invalido)'); continue; }
  const ent = [];
  if (j.main) ent.push(j.main); if (j.module) ent.push(j.module);
  const ex = j.exports && (typeof j.exports === 'string' ? j.exports : j.exports['.']);
  const pega = (x) => typeof x === 'string' ? ent.push(x) : x && typeof x === 'object' && Object.values(x).forEach(pega);
  pega(ex);
  for (const e of ent) {
    const f = path.join(NM, p, e);
    if (!fs.existsSync(f) && !fs.existsSync(f + '.js') && !fs.existsSync(path.join(f, 'index.js'))) { ruins.push(`${p} -> ${e}`); break; }
  }
}
console.log(pkgs.length, 'pacotes;', ruins.length, 'com entrada faltando'); console.log(ruins.slice(0, 60).join('\n'));
