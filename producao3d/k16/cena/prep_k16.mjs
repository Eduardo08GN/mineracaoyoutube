// K16: prepara os prontos brutos na G4 (gltf-transform). Uso: node prep_k16.mjs <brutos> <saida>
//  navio.glb: HDMS Danmark (martyn169, CC-BY 4.0) sem texturas (vai ser pintado chapado), sem as linhas de aresta do SketchUp.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune} from '@gltf-transform/functions';
import fs from 'node:fs';

const [SRC, OUT] = process.argv.slice(2);
fs.mkdirSync(OUT, {recursive: true});
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(`${SRC}/navio/scene.gltf`);
for (const t of doc.getRoot().listTextures()) t.dispose();
for (const mesh of doc.getRoot().listMeshes())
  for (const p of mesh.listPrimitives()) if (p.getMode() === 1 || p.getMode() === 3) p.dispose(); // LINES / LINE_STRIP
await doc.transform(prune());   // sem dedup: ele fundiria materiais e apagaria os nomes que dão os papéis
await io.write(`${OUT}/navio.glb`, doc);
console.log('navio.glb', (fs.statSync(`${OUT}/navio.glb`).size / 1e6).toFixed(1), 'MB');
