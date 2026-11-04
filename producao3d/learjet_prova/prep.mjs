// Prepara os 3 modelos da prova NA G4 (gltf-transform), a partir dos prontos:
//  learjet.glb : Learjet 45 do Sketchfab (KarimFatatry, CC-BY 4.0) sem interior nem trem, só o mapa normal da fuselagem;
//  cidade.glb  : prédios do OSM2World de Greenacres (OSM ODbL), um material, poucas malhas (join);
//  chao.glb    : duas fotos aéreas NAIP (USGS, domínio público) como chão georreferenciado, origem = cratera, x = leste, z = -norte.
// Uso: node prep.mjs <pasta_bruta> <pasta_saida>
import fs from 'fs';
import {Document, NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup, flatten, join, prune} from '@gltf-transform/functions';

const [, , SRC, OUT] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const kill = (n) => {
  for (const c of n.listChildren()) kill(c);
  n.dispose();
};

// ---------------------------------------------------------------- Learjet
{
  const doc = await io.read(`${SRC}/learjet/scene.gltf`);
  const KEEP = /^(Airplane|Wings|Turbine|Fins|Rudder|Windows|WindowsGlass|DoorsUnderpart|DoorsUpperpart|Cockpit|CockpitWall|WallToCockpit|GearFlapBottomLeft|GearFlapBottomRight|GearFlapLeft|GearFlapRight|NoseGearFlapLeft|NoseGearFlapRight)_low$/; // portas do trem fechadas: sem elas a barriga mostra o buraco
  for (const n of doc.getRoot().listNodes()) {
    const nm = n.getName() || '';
    if (/_low$/.test(nm) && !KEEP.test(nm)) kill(n);
  }
  for (const m of doc.getRoot().listMaterials()) {
    // 04/11: a fuselagem MANTÉM a textura de cor (o para-brisa escuro e as linhas estão pintados nela)
    if (m.getName() !== 'Body') m.setBaseColorTexture(null).setNormalTexture(null);
    m.setMetallicRoughnessTexture(null).setEmissiveTexture(null).setOcclusionTexture(null);
  }
  await doc.transform(prune(), dedup());
  await io.write(`${OUT}/learjet.glb`, doc);
}

// ---------------------------------------------------------------- cidade (só prédios)
{
  const doc = await io.read(`${SRC}/greenacres_2km.glb`);
  const root = doc.getRoot().listScenes()[0];
  for (const top of root.listChildren())
    for (const n of top.listChildren()) if (!(n.getName() || '').startsWith('Building')) kill(n);
  const mat = doc.createMaterial('Predio');
  for (const mesh of doc.getRoot().listMeshes())
    for (const p of mesh.listPrimitives()) {
      p.setMaterial(mat);
      for (const s of p.listSemantics()) if (s !== 'POSITION' && s !== 'NORMAL') p.setAttribute(s, null);
    }
  await doc.transform(prune(), flatten(), join({keepNamed: false}), prune());
  await io.write(`${OUT}/cidade.glb`, doc);
}

// ---------------------------------------------------------------- chão NAIP
{
  const doc = new Document();
  const buf = doc.createBuffer();
  const scene = doc.createScene();
  const plane = (name, img, [x0, z0, x1, z1], y) => {
    const pos = doc.createAccessor().setType('VEC3').setBuffer(buf).setArray(new Float32Array([x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1]));
    const nor = doc.createAccessor().setType('VEC3').setBuffer(buf).setArray(new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]));
    // glTF: v = 0 no topo da imagem = norte = z mínimo
    const uv = doc.createAccessor().setType('VEC2').setBuffer(buf).setArray(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]));
    const idx = doc.createAccessor().setType('SCALAR').setBuffer(buf).setArray(new Uint16Array([0, 2, 1, 0, 3, 2]));
    const tex = doc.createTexture(name).setImage(fs.readFileSync(img)).setMimeType('image/jpeg');
    const mat = doc.createMaterial(name).setBaseColorTexture(tex).setRoughnessFactor(1).setMetallicFactor(0);
    const prim = doc.createPrimitive().setAttribute('POSITION', pos).setAttribute('NORMAL', nor).setAttribute('TEXCOORD_0', uv).setIndices(idx).setMaterial(mat);
    scene.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)));
  };
  const Q = JSON.parse(fs.readFileSync(`${SRC}/naip_queda.json`, 'utf8'));
  plane('naip3km', `${SRC}/naip_greenacres_3km.jpg`, [-1500, -1500, 1500, 1500], 0);
  plane('naipQueda', `${SRC}/naip_queda.jpg`, Q, -1.5);
  await io.write(`${OUT}/chao.glb`, doc);
}
for (const f of ['learjet.glb', 'cidade.glb', 'chao.glb']) console.log(f, (fs.statSync(`${OUT}/${f}`).size / 1e6).toFixed(1), 'MB');
console.log('PREP_OK');
