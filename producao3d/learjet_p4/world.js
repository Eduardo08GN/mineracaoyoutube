// O mundo, em metros. Origem = cratera; x = leste, y = cima, z = -norte (a mesma convenção do adsb.js e do chao.glb).
//  jet: o Learjet 60 construído por código (learjet60.js, método teardown), nariz para -x; o profundor esquerdo em 3 pedaços;
//  cidade: prédios do OSM2World com o telhado tirado da própria foto NAIP; chão NAIP de 3 km e de 32 km;
//  fumaça: coluna de sprites, simulada em fórmula fechada de t; rota: trilha ADS-B real em 3D com cortina até o chão.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {rng} from 'teardown-kit/util.js';
import {PTS} from './adsb.js';
import {buildLearjet60} from './learjet60.js';

const b64buf = (s) => {
  const bin = atob(s);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u.buffer;
};
export const loadGlb = (b64) => new Promise((ok, err) => new GLTFLoader().parse(b64buf(b64), '', ok, err));

export function buildWorld({cidadeGltf, chaoGltf, jetGltf = null}) {
  const root = new THREE.Group();

  // ------------------------------------------------------------------ o avião: Learjet 60 construído por código (learjet60.js)
  const jet = new THREE.Group();
  jet.rotation.order = 'YZX'; // rolagem (x) primeiro, depois arfagem (z), depois proa (y)
  let model, elev = [], elevMat = new THREE.MeshStandardMaterial();
  if (jetGltf) {
    // Learjet 45 SIMPLES (rammgraffic, CC-BY; o mesmo que o Reconstructed credita). Sem ajuste fino: orienta, escala,
    // esconde o trem baixado e pinta liso; atlas chapado de duas cores (janela = disco cinza).
    const raw = jetGltf.scene;
    const TREM = /^(rueda|eje_ruedas|base_suspension|cable_l|point\.01[23]|suspension|cubierta_tren)/i; // trem baixado e portas abertas
    const paint = new THREE.MeshStandardMaterial({color: '#c3c1bd', metalness: 0.35, roughness: 0.45, envMapIntensity: 1.1});
    raw.traverse((o) => {
      if (!o.isMesh) return;
      const n = o.material?.name || '';
      if (TREM.test(n)) { o.visible = false; return; }
      const m = paint.clone();
      m.userData.nome = n;
      // atlas chapado (assets/learjet45_chapado): pintura + cinza-escuro, janela = disco; cor vem toda da textura
      if (o.material.map) { m.map = o.material.map; m.color.set('#ffffff'); }
      if (/^led/.test(n)) m.emissive = new THREE.Color('#ff2a1a').multiplyScalar(1.5);
      o.material = m;
      o.castShadow = o.receiveShadow = true;
    });
    // orientar: comprimento no eixo x, nariz para -x (estabilizador horizontal 'ala_cola' em +x), comprimento real 17,68 m
    const caixa = (obj) => { // só malhas visíveis (o trem escondido não entra no centro)
      const b = new THREE.Box3();
      obj.traverse((o) => { if (o.isMesh && o.visible) b.expandByObject(o); });
      return b;
    };
    const holder = new THREE.Group();
    holder.add(raw);
    holder.updateMatrixWorld(true);
    const sz = caixa(holder).getSize(new THREE.Vector3());
    if (sz.z > sz.x) holder.rotation.y = Math.PI / 2;
    holder.updateMatrixWorld(true);
    const estab = [];
    raw.traverse((o) => { if (o.isMesh && /^ala_cola/i.test(o.material.userData.nome || '')) estab.push(o); });
    const cx = caixa(holder).getCenter(new THREE.Vector3()).x;
    if (estab.length && caixa(estab[0]).getCenter(new THREE.Vector3()).x < cx) holder.rotation.y += Math.PI;
    holder.updateMatrixWorld(true);
    const bb3 = caixa(holder), L = bb3.getSize(new THREE.Vector3()).x;
    model = new THREE.Group();
    model.add(holder);
    model.scale.setScalar(17.68 / L);
    const c3 = bb3.getCenter(new THREE.Vector3());
    holder.position.set(-c3.x, -c3.y, -c3.z);
    jet.add(model);
    // profundor esquerdo = o estabilizador do lado esquerdo do piloto (+z com o nariz em -x): acende e se solta na tomada D
    jet.updateMatrixWorld(true);
    const esq = estab.sort((a, b) => caixa(b).getCenter(new THREE.Vector3()).z - caixa(a).getCenter(new THREE.Vector3()).z)[0];
    if (esq) {
      const piv = new THREE.Group();
      piv.position.copy(jet.worldToLocal(caixa(esq).getCenter(new THREE.Vector3())));
      jet.add(piv);
      piv.updateMatrixWorld(true);
      piv.attach(esq);
      elevMat = esq.material;
      elevMat.emissive = new THREE.Color('#ff1a0e').multiplyScalar(3.0);
      elevMat.emissiveIntensity = 0;
      piv.userData.sempre = true;
      piv.userData.home = piv.position.clone();
      elev = [piv];
    }
  } else {
    const LJ = buildLearjet60();
    model = LJ.root;
    jet.add(model);
    // o profundor esquerdo acende em vermelho SÓ quando é nomeado (cor = a da pintura; o vermelho é emissivo)
    elevMat = LJ.elev[0].children[0].material;
    elevMat.emissive = new THREE.Color('#ff1a0e').multiplyScalar(3.0);
    elevMat.emissiveIntensity = 0;
    for (const p of LJ.elev) p.children[0].material = elevMat;
    elev = LJ.elev;
  }
  root.add(jet);

  // ------------------------------------------------------------------ chão NAIP e cidade
  const chao = chaoGltf.scene;
  const naip = {};
  chao.traverse((o) => {
    if (!o.isMesh) return;
    const map = o.material.map;
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    naip[o.name] = map;
    o.material = new THREE.MeshBasicMaterial({map, color: '#e9e9e9'});
    o.receiveShadow = false;
  });
  root.add(chao);
  const predio = new THREE.MeshStandardMaterial({color: '#cfccc5', roughness: 0.9, metalness: 0});
  predio.onBeforeCompile = (sh) => {
    sh.uniforms.uNaip = {value: naip.naip3km};
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWp; varying vec3 vWn;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz; vWn = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uNaip; varying vec3 vWp; varying vec3 vWn;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity );\nif (vWn.y > 0.5) diffuseColor.rgb = texture2D(uNaip, vec2(vWp.x / 3000.0 + 0.5, 0.5 - vWp.z / 3000.0)).rgb * 1.05;');
  };
  const cidade = cidadeGltf.scene;
  cidade.position.set(-973.1, 0, 391.8); // origem do OSM2World -> cratera (cena_learjet.py da parte 2)
  cidade.traverse((o) => o.isMesh && (o.material = predio));
  root.add(cidade);

  // ------------------------------------------------------------------ fumaça: sprites com ruído, subindo e inclinando ao leste
  const smokeTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const r = rng(7);
    for (let i = 0; i < 26; i++) {
      const x = 128 + (r() - 0.5) * 110, y = 128 + (r() - 0.5) * 110, rad = 40 + r() * 60;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, 'rgba(255,255,255,0.22)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 256, 256);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const smoke = [];
  {
    const r = rng(11);
    for (let i = 0; i < 140; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({map: smokeTex, color: '#3f4145', transparent: true, depthWrite: false}));
      s.userData = {ph: r(), dx: (r() - 0.5) * 2, dz: (r() - 0.5) * 2, rot: r() * 6.28, sp: 0.85 + r() * 0.3};
      s.material.rotation = s.userData.rot;
      root.add(s);
      smoke.push(s);
    }
  }
  const setSmoke = (t, on) => {
    for (const s of smoke) {
      const u = s.userData;
      const life = (t * 0.06 * u.sp + u.ph) % 1;
      const y = 15 + life * 950;
      const rad = 30 + life * 190;
      s.visible = on;
      s.position.set(y * 0.33 + u.dx * rad * 0.6, y, u.dz * rad * 0.6);
      s.scale.setScalar(rad * 2.2);
      s.material.opacity = Math.pow(1 - life, 1.3) * 0.34 * Math.min(1, life * 10);
    }
  };

  // ------------------------------------------------------------------ a rota ADS-B real em 3D
  const P = PTS.map((p) => new THREE.Vector3(p[1], p[3], p[2]));
  const curve = new THREE.CatmullRomCurve3(P, false, 'centripetal');
  const SEG = 900;
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, SEG, 80, 10, false), new THREE.MeshBasicMaterial({color: new THREE.Color(0.05, 0.13, 0.42)}));
  const cur = (() => {
    const pos = [];
    for (let i = 0; i <= SEG; i++) {
      const p = curve.getPointAt(i / SEG);
      pos.push(p.x, p.y, p.z, p.x, 0, p.z);
    }
    const idx = [];
    for (let i = 0; i < SEG; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    return new THREE.Mesh(g, new THREE.MeshBasicMaterial({color: new THREE.Color(0.06, 0.12, 0.3), transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false}));
  })();
  const crater = new THREE.Mesh(new THREE.RingGeometry(260, 380, 48), new THREE.MeshBasicMaterial({color: new THREE.Color(0.5, 0.04, 0.03), transparent: true}));
  crater.rotation.x = -Math.PI / 2;
  crater.position.y = 8;
  // o avião na ponta da trilha, ampliado 55x para ser lido a 30 km
  const icon = model.clone(true);
  icon.scale.setScalar(55);
  const iconG = new THREE.Group();
  iconG.add(icon);
  root.add(tube, cur, crater, iconG);
  const LEN = curve.getLengths(4000);
  const arcAt = (f) => {
    const x = f * 4000, j = Math.min(3999, Math.floor(x));
    return (LEN[j] + (LEN[j + 1] - LEN[j]) * (x - j)) / LEN[4000];
  };
  // tempo real (s desde 17:47:02.8Z) -> fração do comprimento da curva, pelos próprios pontos
  const tAt = (u) => {
    const tt = PTS[PTS.length - 1][0] * u;
    let i = 0;
    while (i < PTS.length - 2 && PTS[i + 1][0] <= tt) i++;
    const k = (tt - PTS[i][0]) / Math.max(1e-6, PTS[i + 1][0] - PTS[i][0]);
    return {i, k, tt};
  };
  const setRoute = (prog, on) => {
    tube.visible = cur.visible = iconG.visible = on;
    crater.visible = on && prog > 0.985;
    if (!on) return null;
    const {i, k, tt} = tAt(prog);
    // a curva passa pelo ponto i em t = i/(n-1) (parâmetro de índice); tubo e cortina são amostrados por comprimento de arco
    const f = (i + k) / (PTS.length - 1);
    const s = Math.min(0.999, arcAt(f));
    tube.geometry.setDrawRange(0, Math.floor(s * SEG) * 10 * 6);
    cur.geometry.setDrawRange(0, Math.floor(s * SEG) * 6);
    const p = curve.getPointAt(s);
    const d = curve.getTangentAt(s);
    iconG.position.copy(p);
    iconG.rotation.set(0, Math.atan2(d.z, -d.x), 0, 'YZX');
    iconG.rotation.z = Math.atan2(-d.y, Math.hypot(d.x, d.z));
    const a = PTS[i], b = PTS[i + 1];
    const mix = (j) => (a[j] == null || b[j] == null ? a[j] ?? b[j] : a[j] + (b[j] - a[j]) * k);
    return {tt, altFt: mix(4), vz: mix(5), pos: p};
  };

  const anchors = {elev: () => (elev[1] ? elev[1].localToWorld(new THREE.Vector3(0.25, 0, 0)) : elev[0] ? elev[0].localToWorld(new THREE.Vector3()) : jet.localToWorld(new THREE.Vector3(7.6, 2.6, 1.2))), crater: () => new THREE.Vector3(0, 0, 0)};
  return {root, jet, model, elev, elevMat, chao, cidade, setSmoke, setRoute, anchors, crater};
}
