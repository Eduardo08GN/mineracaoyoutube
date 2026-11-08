// Otimiza os GLB dos pacotes do Fab para o Eddie3D (three 0.180 / drei useGLTF) e gera o catalogo.
//   node otimizar.mjs lista_glb.json saida/catalogo.json
// lista_glb.json: [{pacote, entrada, saida, escala?, tex?, licenca, autor, fab_uid, titulo}]
// Passos (todos de @gltf-transform/functions, ferramenta pronta): dedup -> prune -> weld -> escala para METROS (raiz nova)
// -> center (pe no chao, x/z no centro) -> texturas redimensionadas (sharp, <= tex px, formato original) -> meshopt.
// O three carrega meshopt sozinho pelo useGLTF do drei (decoder embutido, sem rede). Draco NAO: o decoder vem de CDN.
import fs from 'node:fs';
import path from 'node:path';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup, prune, weld, center, meshopt, getBounds} from '@gltf-transform/functions';
import {MeshoptEncoder, MeshoptDecoder} from 'meshoptimizer';
import sharp from 'sharp';

const [, , listaArq, catArq] = process.argv;
const lista = JSON.parse(fs.readFileSync(listaArq, 'utf8'));
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder});

const r3 = (v) => v.map((x) => Math.round(x * 1000) / 1000);
const triangulos = (mesh) => mesh.listPrimitives().reduce((s, p) => {
  const idx = p.getIndices(), pos = p.getAttribute('POSITION');
  const n = idx ? idx.getCount() : pos ? pos.getCount() : 0;
  return s + (p.getMode() === 4 ? n / 3 : 0);
}, 0);

const catalogo = fs.existsSync(catArq) ? JSON.parse(fs.readFileSync(catArq, 'utf8')) : {gerado: '', itens: []};
const porArquivo = new Map(catalogo.itens.map((i) => [i.arquivo, i]));

for (const it of lista) {
  try {
    const doc = await io.read(it.entrada);
    const root = doc.getRoot(), cena = root.getDefaultScene() ?? root.listScenes()[0];
    await doc.transform(dedup(), prune(), weld());
    // escala para metros: uma raiz nova com a escala, acima dos filhos da cena
    const esc = it.escala ?? 1;
    if (esc !== 1) {
      const raiz = doc.createNode('raiz_escala').setScale([esc, esc, esc]);
      for (const n of cena.listChildren()) { cena.removeChild(n); raiz.addChild(n); }
      cena.addChild(raiz);
    }
    await doc.transform(center({pivot: 'below'}));
    const b = getBounds(cena);
    const nos = [];
    cena.traverse((n) => {
      const m = n.getMesh();
      if (!m) return;
      const bn = getBounds(n);
      nos.push({no: n.getName(), malha: m.getName(), tris: triangulos(m), bbox_min: r3(bn.min), bbox_max: r3(bn.max),
        materiais: [...new Set(m.listPrimitives().map((p) => p.getMaterial()?.getName() ?? ''))]});
    });
    const texAntes = root.listTextures().map((t) => t.getSize());
    // reducao das texturas com sharp direto (o textureCompress do gltf-transform 4.5 quebra com o libvips desta maquina:
    // "colourspace: parameter space not set"); mesmo formato, lado maior <= it.tex
    const lim = it.tex ?? 1024;
    for (const t of root.listTextures()) {
      const sz = t.getSize(), img = t.getImage();
      if (!sz || !img || Math.max(sz[0], sz[1]) <= lim) continue;
      const s = sharp(Buffer.from(img)).resize(lim, lim, {fit: 'inside'});
      const out = t.getMimeType() === 'image/png' ? await s.png({compressionLevel: 9}).toBuffer() : await s.jpeg({quality: 88, mozjpeg: true}).toBuffer();
      t.setImage(new Uint8Array(out));
    }
    await doc.transform(prune(), meshopt({encoder: MeshoptEncoder, level: 'medium'}));
    fs.mkdirSync(path.dirname(it.saida), {recursive: true});
    await io.write(it.saida, doc);
    const tam = [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];
    const anim = root.listAnimations().map((a) => a.getName());
    const reg = {
      pacote: it.pacote, titulo: it.titulo, autor: it.autor, licenca: it.licenca, fab_uid: it.fab_uid,
      arquivo: path.relative(path.dirname(catArq), it.saida).replaceAll('\\', '/'),
      origem: it.entrada.replaceAll('\\', '/'), escala_aplicada: esc,
      tamanho_m: r3(tam), bbox_min: r3(b.min), bbox_max: r3(b.max),
      triangulos: nos.reduce((s, n) => s + n.tris, 0), n_nos: nos.length,
      texturas: root.listTextures().map((t, k) => ({de: texAntes[k], para: t.getSize(), tipo: t.getMimeType()})),
      animacoes: anim, kb: Math.round(fs.statSync(it.saida).size / 1024),
      nos: nos.length > 60 ? nos.slice(0, 60).concat([{no: `... +${nos.length - 60} nos`}]) : nos,
    };
    porArquivo.set(reg.arquivo, reg);
    console.log('OK', reg.arquivo, reg.tamanho_m.join(' x '), 'm', reg.triangulos, 'tris', reg.kb, 'KB');
  } catch (e) {
    console.log('ERRO', it.entrada, e.message);
  }
}
catalogo.gerado = new Date().toISOString().slice(0, 10);
catalogo.itens = [...porArquivo.values()].sort((a, b) => a.arquivo.localeCompare(b.arquivo));
fs.writeFileSync(catArq, JSON.stringify(catalogo, null, 1));
console.log('catalogo:', catalogo.itens.length, 'itens');
