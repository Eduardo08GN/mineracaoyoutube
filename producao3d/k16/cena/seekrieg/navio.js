// O couraçado: HDMS Danmark (martyn169, CC-BY 4.0; fragata couraçada de bateria lateral de 1864, cópia da Gloire), o
// modelo pronto da classe e época certas mais próximo (busca de 30 min, 04/11). Assinatura nova: chapado, sem cordame,
// COM vergas (corta-se detalhe, nunca silhueta). Os papéis de cada material saem do still de diagnóstico (modo 'diag').
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const b64buf = (s) => {
  const bin = atob(s);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u.buffer;
};
export const loadGlb = (b64) => new Promise((ok, err) => new GLTFLoader().parse(b64buf(b64), '', ok, err));

// fora sempre: arestas de desenho do SketchUp, cordame e vidro
const FORA = /^(edge_color|Brown_Rope|Glass_Blue)/;

// cor de diagnóstico: matiz pelo índice do material (ângulo de ouro), bem distintas entre si
const PALETA = new Map();
const corDiag = (nome) => {
  if (!PALETA.has(nome)) PALETA.set(nome, new THREE.Color().setHSL((PALETA.size * 0.618034) % 1, 0.9, 0.5));
  return PALETA.get(nome);
};

// papel → cor chapada (preenchido depois do diagnóstico); material ausente cai em 'casco'
// (diagnóstico 2, 04/11): Color_M08 junta costado + mastros + vergas + chaminé; separa-se pela altura (acima do convés = mastreação)
export const PAPEIS = {
  Color_A07: 'vivas', Color_M08: 'casco', Wood_Deck__medium_Whither: 'conves', material: 'portinhola',
  '0136_Charcoal': 'metal', Color_D05: 'metal', Color_M09: 'metal', Color_D01: 'metal', '0cpxg10w': 'metal',
  '0132_LightGray': 'fora', Navel_Grey__Generic: 'fora',   // os botes: detalhe sem história
};
const TONS = {casco: '#1e2226', vivas: '#4a2c28', conves: '#9a8a70', mastro: '#2e2924', portinhola: '#0f1113', metal: '#2a2e32'};
const CONVES_Y = 8.6;
// destaque por faixa de altura (mundo): a cinta blindada em volta da linha d'água, as obras vivas etc. Laranja-sinal = a peça da história
export const DESTAQUE = {y0: {value: 0}, y1: {value: 0}, x0: {value: -1e4}, x1: {value: 1e4}, amt: {value: 0}, cor: {value: new THREE.Color('#ff7a1f')}};
const comDestaque = (m) => {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uDY0 = DESTAQUE.y0; sh.uniforms.uDY1 = DESTAQUE.y1; sh.uniforms.uDX0 = DESTAQUE.x0; sh.uniforms.uDX1 = DESTAQUE.x1; sh.uniforms.uDAmt = DESTAQUE.amt; sh.uniforms.uDCor = DESTAQUE.cor;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
varying float vWY; varying float vWX;`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
vec4 wpD = modelMatrix * vec4(transformed, 1.0); vWY = wpD.y; vWX = wpD.x;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying float vWY; varying float vWX; uniform float uDY0; uniform float uDY1; uniform float uDX0; uniform float uDX1; uniform float uDAmt; uniform vec3 uDCor;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
float dB = step(uDY0, vWY) * step(vWY, uDY1) * step(uDX0, vWX) * step(vWX, uDX1) * uDAmt;
diffuseColor.rgb = mix(diffuseColor.rgb, uDCor, dB * 0.92);
totalEmissiveRadiance += uDCor * dB * 0.5;`);
  };
  return m;
};   // m (escala real): mesh de Color_M08 inteiramente acima disto é mastreação

export function buildNavio(gltf, {diag = false, comprimento = 82, proa = -1} = {}) {
  const raw = gltf.scene;
  const legenda = new Map();
  raw.traverse((o) => {
    if (o.isLine || o.isLineSegments || o.isPoints) { o.visible = false; return; }
    if (!o.isMesh) return;
    const nome = o.material?.name || '';
    o.userData.nomeMat = nome;
    if (FORA.test(nome)) { o.visible = false; return; }
    if (diag) {
      const c = corDiag(nome);
      legenda.set(nome, '#' + c.getHexString());
      o.material = new THREE.MeshStandardMaterial({color: c, roughness: 0.6, metalness: 0.0});
    } else {
      const papel = PAPEIS[nome] || 'casco';
      if (papel === 'fora') { o.visible = false; return; }
      o.userData.papel = papel;
    }
    o.castShadow = o.receiveShadow = true;
  });
  // orientar: comprimento no eixo x, proa para -x (proa=-1) ou +x; escala pelo comprimento real; quilha em y=0
  const caixa = (obj) => {
    const b = new THREE.Box3();
    obj.updateMatrixWorld(true);
    obj.traverse((o) => { if (o.isMesh && o.visible) b.expandByObject(o); });
    return b;
  };
  const holder = new THREE.Group();
  holder.add(raw);
  let sz = caixa(holder).getSize(new THREE.Vector3());
  if (sz.z > sz.x) holder.rotation.y = Math.PI / 2;
  if (proa > 0) holder.rotation.y += Math.PI;
  const b = caixa(holder);
  sz = b.getSize(new THREE.Vector3());
  const c = b.getCenter(new THREE.Vector3());
  holder.position.set(-c.x, -b.min.y, -c.z);
  const navio = new THREE.Group();
  navio.add(holder);
  navio.scale.setScalar(comprimento / sz.x);
  const esc = comprimento / sz.x;
  navio.updateMatrixWorld(true);
  const faixa = new Map();
  navio.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    const bb = new THREE.Box3().setFromObject(o), n = o.userData.nomeMat;
    const f = faixa.get(n) || [1e9, -1e9, 0];
    faixa.set(n, [Math.min(f[0], bb.min.y), Math.max(f[1], bb.max.y), f[2] + 1]);
  });
  if (!diag) {
    const mats = {};
    const mat = (p) => (mats[p] ||= ((m) => (p === 'casco' || p === 'vivas' ? comDestaque(m) : m))(new THREE.MeshStandardMaterial({color: TONS[p], roughness: p === 'conves' ? 0.8 : 0.55, metalness: p === 'metal' ? 0.4 : 0.1, envMapIntensity: 0.9})));
    navio.traverse((o) => {
      if (!o.isMesh || !o.visible) return;
      let p = o.userData.papel;
      if (p === 'casco' && new THREE.Box3().setFromObject(o).min.y > CONVES_Y) p = 'mastro';
      o.material = mat(p); o.userData.papel = p;
    });
  }
  for (const [n, c] of legenda) { const f = faixa.get(n); if (f) legenda.set(n, `${c}|y ${f[0].toFixed(1)}–${f[1].toFixed(1)} m · ${f[2]} malhas`); }
  const linhaDagua = faixa.get('Color_A07')?.[1] ?? 4.7;   // topo das obras vivas = linha d'água
  return {navio, legenda, altura: sz.y * esc, linhaDagua};
}

// navio fundido: uma malha por papel (para a frota de 49 cópias sem milhares de draw calls). Recebe o grupo já pintado.
export function fundir(grupo) {
  grupo.updateMatrixWorld(true);
  const porMat = new Map();
  grupo.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    const l = porMat.get(o.material) || []; l.push(g.index ? g.toNonIndexed() : g); porMat.set(o.material, l);
  });
  const out = new THREE.Group();
  for (const [m, gs] of porMat) out.add(new THREE.Mesh(mergeGeometries(gs), m));
  return out;
}
