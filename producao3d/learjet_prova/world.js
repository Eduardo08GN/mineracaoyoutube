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
    // teste A/B: o Learjet 45 do Sketchfab (KarimFatatry, CC-BY 4.0), o mesmo do Reconstructed, com a receita nova
    model = jetGltf.scene;
    model.scale.setScalar(8.84);
    const paint = new THREE.MeshStandardMaterial({color: '#c3c1bd', metalness: 0.35, roughness: 0.45, envMapIntensity: 1.1}); // acetinado perolado, sem estouro (2ª análise do sócio, 04/11)
    const glass = new THREE.MeshStandardMaterial({color: '#07090c', metalness: 0.0, roughness: 0.06, envMapIntensity: 1.0}); // vidro escuro que reflete o céu
    model.traverse((o) => {
      if (!o.isMesh) return;
      let a = o;
      while (a && !/_low$/.test(a.name || '')) a = a.parent;
      const n = (a?.name || '').replace(/_low$/, '');
      o.castShadow = o.receiveShadow = true;
      if (n === 'Airplane') {
        const m = paint.clone();
        m.normalMap = o.material.normalMap;
        // a textura original da fuselagem traz o para-brisa escuro e as linhas; a cor cinza quente tinge por cima
        // da textura original usa-se SÓ o alfa: o para-brisa é transparente nela e deixa ver a cabine preta;
        // a cor (com as faixas da pintura original) é descartada, fica o cinza quente
        if (o.material.map) {
          m.map = o.material.map;
          // onde a textura é transparente (para-brisa), vira vidro escuro e liso, com reflexo — o preto do Reconstructed
          m.onBeforeCompile = (sh) => {
            sh.fragmentShader = sh.fragmentShader
              .replace('#include <map_fragment>', 'float ta = texture2D( map, vMapUv ).a;\ndiffuseColor.rgb = mix(vec3(0.02, 0.025, 0.032), diffuseColor.rgb, smoothstep(0.35, 0.65, ta));')
              .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.05, roughnessFactor, smoothstep(0.35, 0.65, ta));');
          };
        }
        o.material = m;
      } else o.material = n === 'Windows' || n === 'WindowsGlass' || /^Cockpit|^WallToCockpit/.test(n) ? glass : paint;
    });
    jet.add(model);
    {
      let wings = null;
      model.traverse((o) => { if (o.isMesh && /^Wings/.test(o.parent?.name || '')) wings = o; });
      if (wings) {
        const p = wings.geometry.attributes.position;
        let zl = -1e9, zr = 1e9, tl = null, tr = null;
        for (let i = 0; i < p.count; i++) {
          const z = p.getZ(i);
          if (z > zl) (zl = z), (tl = [p.getX(i), p.getY(i), z]);
          if (z < zr) (zr = z), (tr = [p.getX(i), p.getY(i), z]);
        }
        for (const [c, at] of [['#ff2a1a', tl], ['#1aff5a', tr]]) {
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.006, 12, 8), new THREE.MeshBasicMaterial({color: new THREE.Color(c).multiplyScalar(1.6)}));
          m.position.set(...at);
          model.add(m);
        }
      }
    }
    // profundor esquerdo: bordo de fuga do estabilizador medido no modelo (x 0,953 em z 0,10 -> 0,986 em z 0,28; y 0,237)
    elevMat = paint.clone();
    elevMat.emissive = new THREE.Color('#ff1a0e').multiplyScalar(3.0);
    elevMat.emissiveIntensity = 0;
    const xte = (z) => 0.953 + ((0.986 - 0.953) * (z - 0.1)) / 0.18, sweep = Math.atan((0.986 - 0.953) / 0.18), Z = [0.035, 0.12, 0.205, 0.29];
    for (let i = 0; i < 3; i++) {
      const zc = (Z[i] + Z[i + 1]) / 2;
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.0055, (Z[i + 1] - Z[i]) / Math.cos(sweep) - 0.002), elevMat);
      const piv = new THREE.Group();
      piv.position.set((xte(zc) - 0.021) * 8.84, 0.2375 * 8.84, zc * 8.84);
      piv.rotation.y = sweep;
      m.scale.setScalar(8.84);
      piv.add(m);
      piv.userData.home = piv.position.clone();
      jet.add(piv);
      elev.push(piv);
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
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, SEG, 150, 10, false), new THREE.MeshBasicMaterial({color: new THREE.Color(0.05, 0.13, 0.42)}));
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

  const anchors = {elev: () => (elev[1] ? elev[1].localToWorld(new THREE.Vector3(0.25, 0, 0)) : jet.localToWorld(new THREE.Vector3(7.6, 2.6, 1.2))), crater: () => new THREE.Vector3(0, 0, 0)};
  return {root, jet, model, elev, elevMat, chao, cidade, setSmoke, setRoute, anchors};
}
