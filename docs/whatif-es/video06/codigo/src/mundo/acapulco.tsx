// Acapulco, Mexico (16,9 N) - capitulos 8 (tarde parada, 159,9-188,9) e 9 (noite que congela, 188,9-217,9) do video 6.
// Adaptacao de Santa Monica: a Bahia de Acapulco vista do alto, sobre a Costera (avenida), com o calcadao, a praia de areia,
// palmeiras, sombrillas e palapas, banhistas e vendedores; um muelle com feira e roda-gigante na ponta (LEDs a noite); a curva
// da baia com a fileira de hoteis altos e os morros verdes cheios de casas (luzes a noite); lanchas, um parasail e pelicanos.
// Noite: geada progressiva (mascara de ruido nas superficies voltadas para cima), a baia congelando a partir das bordas,
// "humo de mar" sobre a agua, as luzes da cidade e da roda falhando, as pessoas sumindo.
// Geometria (a do agente Ceu): y = cima, -z = mar (rumo 225 = sudoeste). Tudo e funcao de t (segundo do ORIGINAL).
// Reflexo do mar: espelho plano proprio (logica do Reflector do three, alvo de 8 bits no WebGL por software).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {Perfil} from '../look/Look';
import {camEm, ChaveCam} from '../roteiro';
import {CeuLugar, corHorizonte, luzEm, LuzTempo} from './ceu';
import {rnd, smooth} from './comum';
import {materialAreia, useAreiaPBR} from './ambiente';
import {Palmeiras, PalmeiraItem} from './palmeiras';
import {Estado3D, Multidao3D, Pessoa3D} from './pessoas';
import {ATLAS, Emissor, Flipbook} from './vfx';

// ================================================================ tempo
const NOITE = 188.9;
const geadaEm = (t: number) => Math.pow(smooth(195.5, 216, t), 0.75);      // areia, calcadao, pier
const geloEm = (t: number) => smooth(199, 217.9, t);                        // a baia congelando das bordas
const apagaEm = (t: number) => smooth(205, 217, t);                         // luzes da cidade falhando
const ventoEm = (t: number) => (t < NOITE ? 0.8 : 0.45 * (1 - smooth(197, 205, t)));

// ================================================================ geografia (JS e GLSL iguais)
// costa: reta em z = ZS ate x = X0, depois um arco (centro (X0, ZC), raio RC) que vira para o mar e segue reta em x = X0 + RC
// (a margem direita da baia, com os hoteis). Peninsula de las Playas a esquerda no fundo, ilha La Roqueta na boca da baia.
const X0 = 200, RC = 450, ZS = -45, ZC = ZS - RC;
const dA = (x: number, z: number) => (x <= X0 ? ZS - z : z >= ZC ? RC - Math.hypot(x - X0, z - ZC) : X0 + RC - x);
const sdTerra = (x: number, z: number) => Math.max(-dA(x, z), Math.min(-1100 + 250 * Math.sin(z * 0.0021) - x, -1900 - z), 260 - Math.hypot(x + 600, z + 2900));
const GEO = `
float dA_(vec2 p){ if (p.x <= ${X0}.0) return ${ZS}.0 - p.y; if (p.y >= ${ZC}.0) return ${RC}.0 - length(p - vec2(${X0}.0, ${ZC}.0)); return ${X0 + RC}.0 - p.x; }
float sdTerra(vec2 p){ return max(-dA_(p), max(min(-1100.0 + 250.0 * sin(p.y * 0.0021) - p.x, -1900.0 - p.y), 260.0 - length(p - vec2(-600.0, -2900.0)))); }
`;
const h2 = (i: number, j: number) => rnd(i * 157.31 + j * 311.77 + 0.5);
const n2 = (x: number, z: number) => {
  const i = Math.floor(x), j = Math.floor(z); let fx = x - i, fz = z - j; fx = fx * fx * (3 - 2 * fx); fz = fz * fz * (3 - 2 * fz);
  const a = h2(i, j), b = h2(i + 1, j), c = h2(i, j + 1), d = h2(i + 1, j + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
};
const crista = (x: number, z: number) => {
  let s = 0, a = 0.55, f = 1 / 650;
  for (let k = 0; k < 4; k++) { const n = n2(x * f + k * 17.3, z * f - k * 9.1); s += a * (1 - Math.abs(2 * n - 1)); a *= 0.5; f *= 2.1; }
  return s / 1.03;
};
// altura do chao (areia, fundo do mar, morros); a agua fica em y = 0 (linha d'agua em sdTerra = -13,3)
const H = (x: number, z: number) => {
  const s = sdTerra(x, z);
  if (s < 0) return Math.max(-28, 0.6 + 0.045 * s);
  const m = Math.max(smooth(380, 640, x), smooth(-1500, -1950, z));
  return 0.6 + 0.3 * smooth(0, 40, s) + smooth(60, 380, s) * m * (30 + 260 * crista(x, z));
};
const Y_CALC = 1.2, Y_RUA = 1.02;            // calcadao (z -6..8) e Costera (z 8..40)
const chao = (x: number, z: number) => (z > 8 ? Y_RUA : z > -6.2 ? Y_CALC : H(x, z));
const AREIA = {x0: -700, x1: 650, z0: -640, z1: -6};

// ================================================================ camera (mapa: pan continuo para a DIREITA)
type V3 = [number, number, number];
const alvoDe = (p: V3, yaw: number, pitch: number): V3 => {
  const y = (yaw * Math.PI) / 180, q = (pitch * Math.PI) / 180;
  return [p[0] + 300 * Math.sin(y) * Math.cos(q), p[1] + 300 * Math.sin(q), p[2] - 300 * Math.cos(y) * Math.cos(q)];
};
// as chaves ficam alem do capitulo: dentro dele o "ease" do camEm e quase linear (sem parar no meio)
const CAM_DIA: ChaveCam[] = [[150, [0, 10, 17], alvoDe([0, 10, 17], -30, -10.5), 50], [198, [5, 10.8, 23], alvoDe([5, 10.8, 23], 32, -9.5), 53]];
const CAM_NOITE: ChaveCam[] = [[180, [-22, 11.5, 12], alvoDe([-22, 11.5, 12], -17, -9), 50], [228, [-17, 12, 14], alvoDe([-17, 12, 14], 16, -8.5), 50]];

// ================================================================ utilitarios
type U_ = {uGeada: {value: number}; uTg: {value: number}; uNoite: {value: number}; uApaga: {value: number}};
const RUIDO = `
float hA(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
float nA(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hA(i), hA(i + vec3(1,0,0)), f.x), mix(hA(i + vec3(0,1,0)), hA(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hA(i + vec3(0,0,1)), hA(i + vec3(1,0,1)), f.x), mix(hA(i + vec3(0,1,1)), hA(i + vec3(1,1,1)), f.x), f.y), f.z); }
float h2A(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
float n2A(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2A(i), h2A(i + vec2(1,0)), f.x), mix(h2A(i + vec2(0,1)), h2A(i + vec2(1,1)), f.x), f.y); }
`;
// geada (tecnica do SnowSystemThreeJS, MIT): mascara fbm no mundo x normal para cima x geada(t); branco-frio, aspero e cintilante.
// 'cor' (GLSL) roda antes, com vGw/vGn disponiveis (azulejos, faixas, areia molhada); 'rug' ajusta a rugosidade.
const comGeada = <M extends THREE.MeshStandardMaterial>(m: M, U: U_, chave: string, o: {esc?: number; cor?: string; rug?: string; forca?: number} = {}) => {
  const anterior = m.onBeforeCompile;
  const esc = (o.esc ?? 1).toFixed(4), forca = (o.forca ?? 1).toFixed(3);
  m.onBeforeCompile = (sh, r) => {
    anterior.call(m, sh, r);
    sh.uniforms.uGeada = U.uGeada; sh.uniforms.uTg = U.uTg; sh.uniforms.uNoite = U.uNoite; sh.uniforms.uApaga = U.uApaga;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGw; varying vec3 vGn;')
      .replace('#include <project_vertex>', `#include <project_vertex>
  { mat4 mG = modelMatrix;
  #ifdef USE_INSTANCING
    mG = modelMatrix * instanceMatrix;
  #endif
    vGw = (mG * vec4(transformed, 1.0)).xyz; vGn = normalize(mat3(mG) * objectNormal); }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform float uGeada; uniform float uTg; uniform float uNoite; uniform float uApaga; varying vec3 vGw; varying vec3 vGn;
${RUIDO}${GEO}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
  ${o.cor ?? ''}
  float gMask = 0.0;
  if (uGeada > 0.001) {
    float gN = nA(vGw * 0.32 * ${esc}) * 0.5 + nA(vGw * 1.6 * ${esc}) * 0.32 + nA(vGw * 7.0 * ${esc}) * 0.18;
    float cima = smoothstep(0.12, 0.8, normalize(vGn).y);
    gMask = clamp(uGeada * 1.75 - 0.5 + (gN - 0.5) * 1.15, 0.0, 1.0) * cima * ${forca};
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.80, 0.87, 0.95), gMask);
  }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  ${o.rug ?? ''}
  roughnessFactor = mix(roughnessFactor, 0.82, gMask);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  if (gMask > 0.0) { vec3 celG = floor(vGw * 22.0); float hb = hA(celG);
    totalEmissiveRadiance += step(0.986, hb) * gMask * (0.55 + 0.45 * sin(uTg * 2.5 + hb * 60.0)) * vec3(1.1, 1.25, 1.5); }`);
  };
  m.customProgramCacheKey = () => chave;
  return m;
};
const mtx = (p: V3, r: V3 = [0, 0, 0], s: V3 = [1, 1, 1], ordem: THREE.EulerOrder = 'XYZ') =>
  new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0], r[1], r[2], ordem)), new THREE.Vector3(...s));
// cilindro unitario (raio 1, altura 1 em y) entre dois pontos
const entre = (a: THREE.Vector3, b: THREE.Vector3, raio: number) => {
  const d = b.clone().sub(a), L = d.length();
  return new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), new THREE.Vector3(raio, L, raio));
};
const instancias = (geo: THREE.BufferGeometry, mat: THREE.Material, ms: THREE.Matrix4[], cores?: THREE.Color[], sombra = false) => {
  const im = new THREE.InstancedMesh(geo, mat, Math.max(1, ms.length));
  ms.forEach((m, i) => im.setMatrixAt(i, m)); if (!ms.length) im.count = 0;
  cores?.forEach((c, i) => im.setColorAt(i, c));
  im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.frustumCulled = false; im.castShadow = sombra; im.receiveShadow = true;
  return im;
};
const srgb = (h: string) => new THREE.Color(h);
const GEO_CIL = new THREE.CylinderGeometry(1, 1, 1, 8);
const GEO_CAIXA = new THREE.BoxGeometry(1, 1, 1);
const GEO_CAIXA_BASE = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);

// brilho redondo (sprites dos postes e manchas de luz no chao)
let _brilho: THREE.Texture | null = null;
const texBrilho = () => {
  if (_brilho) return _brilho;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d')!;
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,0.55)'); g.addColorStop(0.5, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  _brilho = new THREE.CanvasTexture(cv); return _brilho;
};

// pontos de luz com tamanho em metros (minimo em pixels): LEDs, janelas distantes, lampadas, casas nos morros
const PONTOS_VS = `attribute vec3 aCor; uniform float uPx; uniform float uTam; uniform float uMin; uniform float uGanho; varying vec3 vC;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float px = uTam * uPx / max(0.5, -mv.z);
  gl_PointSize = min(max(px, uMin), 48.0); vC = aCor * uGanho * clamp(px / uMin, 0.3, 1.0); gl_Position = projectionMatrix * mv; }`;
const PONTOS_FS = `varying vec3 vC; void main(){ float r = length(gl_PointCoord - 0.5) * 2.0; if (r > 1.0) discard; float a = 1.0 - smoothstep(0.15, 1.0, r); gl_FragColor = vec4(vC * a, 1.0); }`;
const novosPontos = (pos: Float32Array, cor: Float32Array, tam: number, min = 1.5) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCor', new THREE.BufferAttribute(cor, 3));
  const m = new THREE.ShaderMaterial({vertexShader: PONTOS_VS, fragmentShader: PONTOS_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {uPx: {value: 500}, uTam: {value: tam}, uMin: {value: min}, uGanho: {value: 1}}});
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 6;
  return p;
};

// ================================================================ terreno (morros, fundo do mar) e areia
const Terreno: React.FC<{U: U_}> = ({U}) => {
  const {geo, mat} = useMemo(() => {
    const g = new THREE.PlaneGeometry(7200, 5600, 220, 170); g.rotateX(-Math.PI / 2); g.translate(0, 0, -2100);
    const p = g.attributes.position, cor = new Float32Array(p.count * 3), c = new THREE.Color(), urb = new THREE.Color(), rocha = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), s = sdTerra(x, z);
      let y = H(x, z);
      if (x > AREIA.x0 + 12 && x < AREIA.x1 - 12 && z > AREIA.z0 + 12 && z < 60) y -= 3;
      p.setY(i, y);
      const n = n2(x / 90, z / 90);
      if (s < 0) c.setRGB(0.40, 0.38, 0.32, THREE.SRGBColorSpace);
      else if (y < 2.5) c.setRGB(0.74, 0.66, 0.52, THREE.SRGBColorSpace);
      else {
        c.setRGB(0.12 + 0.07 * n, 0.24 + 0.09 * n, 0.08 + 0.03 * n, THREE.SRGBColorSpace);
        const u = smooth(0.45, 0.75, n2(x / 260 + 3, z / 260)) * (1 - smooth(60, 210, y));
        urb.setRGB(0.62, 0.58, 0.52, THREE.SRGBColorSpace); c.lerp(urb, u * 0.55);
        rocha.setRGB(0.42, 0.38, 0.33, THREE.SRGBColorSpace); c.lerp(rocha, smooth(0.6, 0.9, n2(x / 40, z / 40)) * 0.35);
      }
      cor[i * 3] = c.r; cor[i * 3 + 1] = c.g; cor[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(cor, 3)); g.computeVertexNormals();
    const m = comGeada(new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.97}), U, 'aca_terreno', {esc: 0.15, forca: 0.8});
    return {geo: g, mat: m};
  }, [U]);
  return <mesh geometry={geo} material={mat} receiveShadow />;
};

const Areia: React.FC<{U: U_}> = ({U}) => {
  const pbr = useAreiaPBR(30);
  const {geo, mat} = useMemo(() => {
    const L = AREIA.x1 - AREIA.x0, P = AREIA.z1 - AREIA.z0;
    const g = new THREE.PlaneGeometry(L, P, 170, 80); g.rotateX(-Math.PI / 2); g.translate((AREIA.x0 + AREIA.x1) / 2, 0, (AREIA.z0 + AREIA.z1) / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, H(p.getX(i), p.getZ(i)));
    g.computeVertexNormals();
    const m = comGeada(materialAreia(pbr, L, P), U, 'aca_areia', {
      cor: `float sT = sdTerra(vGw.xz); float molh = smoothstep(-4.5, -11.5, sT);
  diffuseColor.rgb *= (1.0 - 0.42 * molh) * vec3(1.03, 1.0, 0.96);`,
      rug: 'roughnessFactor = mix(roughnessFactor, 0.32, molh);',
    });
    return {geo: g, mat: m};
  }, [pbr, U]);
  return <mesh geometry={geo} material={mat} receiveShadow />;
};

// ================================================================ calcadao (malecon), muro, Costera, postes, bancos
const XS_POSTE = Array.from({length: 46}, (_, k) => -398 + 22 * k);
const Calcadao: React.FC<{U: U_; t: number}> = ({U, t}) => {
  const noite = t >= NOITE;
  const pecas = useMemo(() => {
    const L = AREIA.x1 - AREIA.x0, cx = (AREIA.x0 + AREIA.x1) / 2;
    const calc = comGeada(new THREE.MeshStandardMaterial({roughness: 0.78}), U, 'aca_calcada', {
      cor: `vec2 q = vGw.xz / 1.2; vec2 fq = fract(q); vec2 iq = floor(q);
  float junta = 1.0 - step(0.035, fq.x) * step(fq.x, 0.965) * step(0.035, fq.y) * step(fq.y, 0.965);
  float tom = 0.9 + 0.14 * hA(vec3(iq, 1.0));
  float faixa = step(abs(vGw.z - 1.0), 1.25) + step(vGw.z, -4.6) + step(6.6, vGw.z);
  float onda = step(0.5, fract((vGw.x + sin(vGw.z * 1.4) * 1.2) / 4.8)) * step(abs(vGw.z - 1.0), 1.25);
  vec3 c1 = vec3(0.78, 0.72, 0.62), c2 = vec3(0.55, 0.30, 0.22), c3 = vec3(0.92, 0.90, 0.84);
  diffuseColor.rgb = mix(c1, mix(c2, c3, onda), clamp(faixa, 0.0, 1.0)) * tom * (1.0 - 0.32 * junta);`,
    });
    const muro = comGeada(new THREE.MeshStandardMaterial({color: '#cfc6b6', roughness: 0.9}), U, 'aca_muro');
    const asf = comGeada(new THREE.MeshStandardMaterial({roughness: 0.92}), U, 'aca_asfalto', {
      cor: `float nAs = nA(vGw * 1.7) * 0.5 + nA(vGw * 9.0) * 0.5;
  diffuseColor.rgb = vec3(0.075, 0.08, 0.09) * (0.85 + 0.3 * nAs);
  float tr = step(0.5, fract(vGw.x / 9.0)) * (step(abs(vGw.z - 14.0), 0.08) + step(abs(vGw.z - 26.0), 0.08));
  float am = step(abs(abs(vGw.z - 20.0) - 0.18), 0.07);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.85), tr); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.85, 0.62, 0.1), am);`,
    });
    const metal = comGeada(new THREE.MeshStandardMaterial({color: '#3c4448', roughness: 0.55, metalness: 0.6}), U, 'aca_metal');
    const madeira = comGeada(new THREE.MeshStandardMaterial({color: '#7a5636', roughness: 0.85}), U, 'aca_banco');
    const cabeca = new THREE.MeshStandardMaterial({color: '#2a2f33', roughness: 0.5, emissive: new THREE.Color('#ffb36b'), emissiveIntensity: 0});
    const postes: THREE.Matrix4[] = [], bracos: THREE.Matrix4[] = [], cabecas: THREE.Matrix4[] = [], bancos: THREE.Matrix4[] = [];
    for (const x of XS_POSTE) {
      postes.push(mtx([x, Y_CALC + 3.1, -4.6], [0, 0, 0], [0.09, 6.2, 0.09]));
      bracos.push(mtx([x, Y_CALC + 6.15, -5.25], [0, 0, 0], [0.07, 0.07, 1.4]));
      cabecas.push(mtx([x, Y_CALC + 6.05, -5.9], [0, 0, 0], [0.42, 0.16, 0.6]));
      bancos.push(mtx([x + 11, Y_CALC + 0.45, -3.6], [0, 0, 0], [2.0, 0.09, 0.55]), mtx([x + 11, Y_CALC + 0.75, -3.35], [0.25, 0, 0], [2.0, 0.5, 0.07]));
    }
    return {
      calc: new THREE.Mesh(new THREE.PlaneGeometry(L, 14.2).rotateX(-Math.PI / 2).translate(cx, Y_CALC, 0.9), calc),
      muro: new THREE.Mesh(new THREE.BoxGeometry(L, 0.9, 0.5).translate(cx, Y_CALC - 0.45, -6.25), muro),
      guia: new THREE.Mesh(new THREE.BoxGeometry(L, 0.25, 0.35).translate(cx, Y_CALC - 0.05, 8.1), muro),
      rua: new THREE.Mesh(new THREE.PlaneGeometry(L, 34).rotateX(-Math.PI / 2).translate(cx, Y_RUA, 25), asf),
      postes: instancias(GEO_CIL, metal, postes, undefined, true), bracos: instancias(GEO_CAIXA, metal, bracos), cab: instancias(GEO_CAIXA, cabeca, cabecas),
      bancos: instancias(GEO_CAIXA, madeira, bancos, undefined, true), cabeca,
    };
  }, [U]);
  for (const k of ['calc', 'muro', 'guia', 'rua'] as const) pecas[k].receiveShadow = true;
  pecas.cabeca.emissiveIntensity = noite ? 6 : 0;
  return <>
    <primitive object={pecas.calc} /><primitive object={pecas.muro} /><primitive object={pecas.guia} /><primitive object={pecas.rua} />
    <primitive object={pecas.postes} /><primitive object={pecas.bracos} /><primitive object={pecas.cab} /><primitive object={pecas.bancos} />
  </>;
};

// luz dos postes a noite: sprite de brilho (halo que cresce com os cristais de gelo), mancha no chao e luz pontual nos mais proximos
const PERTO = XS_POSTE.filter((x) => Math.abs(x + 20) < 50);   // conjunto fixo (trocar o numero de luzes recompila os shaders)
const LuzesPostes: React.FC<{t: number}> = ({t}) => {
  const tex = texBrilho();
  const g = geadaEm(t);
  const cor = new THREE.Color('#ffae5e').lerp(new THREE.Color('#ffe2c0'), g * 0.6);
  const halo = 2.2 + 1.8 * g;
  return <>
    {XS_POSTE.map((x) => (
      <group key={x}>
        <sprite position={[x, Y_CALC + 5.92, -5.9]} scale={[halo, halo, 1]} renderOrder={7}>
          <spriteMaterial map={tex} color={cor.clone().multiplyScalar(2.2)} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
        <mesh position={[x, H(x, -8) + 0.04, -8]} rotation-x={-Math.PI / 2} renderOrder={3}>
          <planeGeometry args={[15, 15]} />
          <meshBasicMaterial map={tex} color={cor.clone().multiplyScalar(0.32)} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    ))}
    {PERTO.map((x) => <pointLight key={'p' + x} position={[x, Y_CALC + 5.7, -5.9]} color={cor} intensity={38} distance={30} decay={1.7} />)}
  </>;
};

// ================================================================ muelle (pier) com feira na ponta
const PR = new THREE.Vector2(-95, -3), PE = new THREE.Vector2(-55, -172);
const PD = PE.clone().sub(PR).normalize(), PL = PE.distanceTo(PR), PLAT = PR.clone().addScaledVector(PD, PL + 22);
const PLAT_LAT = new THREE.Vector2(-PD.y, PD.x);   // lateral (direita de quem anda para o mar)
const PYAW = Math.atan2(PD.x, PD.y);                // gira o +z local para PD
const deckY = (s: number) => (s < 28 ? Y_CALC + (6 - Y_CALC) * smooth(0, 28, s) : 6);
const noPier = (s: number, lat: number): THREE.Vector3 => {
  const p = PR.clone().addScaledVector(PD, s).addScaledVector(PLAT_LAT, lat);
  return new THREE.Vector3(p.x, deckY(s), p.y);
};
const RODA = {x: PLAT.x - PLAT_LAT.x * 2, z: PLAT.y - PLAT_LAT.y * 2, y: 6, R: 12, Hh: 14};
const RODA_YAW = Math.atan2(0 - RODA.x, 24 - RODA.z) + 0.5;
const PER_LUZ = (() => {   // lampadas do pier e cordoes de luz da feira
  const pos: number[] = [], cor: number[] = [];
  for (let s = 20; s < PL; s += 16) for (const lat of [-5.3, 5.3]) { const p = noPier(s, lat); pos.push(p.x, p.y + 4.1, p.z); cor.push(1.0, 0.75, 0.45); }
  const cores = [[1, 0.25, 0.2], [1, 0.8, 0.2], [0.2, 0.9, 0.35], [0.3, 0.5, 1], [1, 0.4, 0.8]];
  const cantos = [[-15, -22], [15, -22], [15, 22], [-15, 22], [-15, -22]];
  let k = 0;
  for (let c = 0; c < 4; c++) {
    const [a1, b1] = cantos[c], [a2, b2] = cantos[c + 1];
    for (let i = 0; i < 26; i++) {
      const u = i / 26, lat = a1 + (a2 - a1) * u, al = b1 + (b2 - b1) * u, sag = 1.2 * Math.sin(Math.PI * ((u * 2) % 1));
      const p = PLAT.clone().addScaledVector(PLAT_LAT, lat).addScaledVector(PD, al);
      pos.push(p.x, 6 + 4.2 - sag, p.y); const cc = cores[k++ % cores.length]; cor.push(cc[0], cc[1], cc[2]);
    }
  }
  return {pos: new Float32Array(pos), cor: new Float32Array(cor)};
})();
const Pier: React.FC<{U: U_; t: number; px: number}> = ({U, t, px}) => {
  const noite = t >= NOITE;
  const p = useMemo(() => {
    const madeira = comGeada(new THREE.MeshStandardMaterial({color: '#8a6a4c', roughness: 0.82}), U, 'aca_tabuas', {
      cor: `float sD = dot(vGw.xz - vec2(${PR.x.toFixed(3)}, ${PR.y.toFixed(3)}), vec2(${PD.x.toFixed(5)}, ${PD.y.toFixed(5)}));
  float tab = smoothstep(0.0, 0.04, fract(sD / 0.32)) * (0.88 + 0.2 * hA(vec3(floor(sD / 0.32), 0.0, 3.0)));
  diffuseColor.rgb *= mix(0.55, 1.0, tab);`,
    });
    const pilar = comGeada(new THREE.MeshStandardMaterial({color: '#5a5048', roughness: 0.9}), U, 'aca_pilar');
    const branco = comGeada(new THREE.MeshStandardMaterial({color: '#e8e6e0', roughness: 0.5, metalness: 0.2}), U, 'aca_branco');
    const barraca = comGeada(new THREE.MeshStandardMaterial({roughness: 0.7, emissive: new THREE.Color('#ffcf8a'), emissiveIntensity: 0}), U, 'aca_barraca');
    const tabs: THREE.Matrix4[] = [], pil: THREE.Matrix4[] = [], cor: THREE.Matrix4[] = [], post: THREE.Matrix4[] = [];
    for (let s = 3; s < PL + 3; s += 6) {
      const a = noPier(s - 3, 0), b = noPier(s + 3, 0), c = a.clone().add(b).multiplyScalar(0.5), pitch = -Math.atan2(b.y - a.y, 6);
      tabs.push(mtx([c.x, c.y - 0.25, c.z], [pitch, PYAW, 0], [11, 0.5, 6.15], 'YXZ'));
      for (const lat of [-5.4, 5.4]) {
        const r = noPier(s, lat); cor.push(mtx([r.x, r.y + 1.05, r.z], [pitch, PYAW, 0], [0.1, 0.1, 6.1], 'YXZ'));
        for (const ds of [-2, 0, 2]) { const q = noPier(s + ds, lat); post.push(mtx([q.x, q.y + 0.52, q.z], [0, PYAW, 0], [0.09, 1.05, 0.09])); }
      }
      if (s > 10) for (const lat of [-4.6, 0, 4.6]) {
        const q = noPier(s, lat), fundo = Math.min(H(q.x, q.z), 0) - 1.5;
        pil.push(entre(new THREE.Vector3(q.x, fundo, q.z), new THREE.Vector3(q.x, q.y - 0.5, q.z), 0.28));
      }
    }
    for (let s = 20; s < PL; s += 16) for (const lat of [-5.3, 5.3]) { const q = noPier(s, lat); post.push(mtx([q.x, q.y + 2.05, q.z], [0, 0, 0], [0.09, 4.1, 0.09])); }
    // plataforma da feira
    const plat = mtx([PLAT.x, 5.7, PLAT.y], [0, PYAW, 0], [30, 0.6, 44]);
    for (let a = -12; a <= 12; a += 6) for (let b = -20; b <= 20; b += 8) {
      const q = PLAT.clone().addScaledVector(PLAT_LAT, a).addScaledVector(PD, b);
      pil.push(entre(new THREE.Vector3(q.x, Math.min(H(q.x, q.y), 0) - 1.5, q.y), new THREE.Vector3(q.x, 5.4, q.y), 0.32));
    }
    for (const [la, al, w, l] of [[0, -22, 30, 0.12], [0, 22, 30, 0.12], [-15, 0, 0.12, 44], [15, 0, 0.12, 44]]) {
      const q = PLAT.clone().addScaledVector(PLAT_LAT, la).addScaledVector(PD, al);
      cor.push(mtx([q.x, 7.05, q.y], [0, PYAW, 0], [w, 0.1, l]));
    }
    for (const [la, al] of [[-15, -22], [15, -22], [15, 22], [-15, 22]]) { const q = PLAT.clone().addScaledVector(PLAT_LAT, la).addScaledVector(PD, al); post.push(mtx([q.x, 8.2, q.y], [0, 0, 0], [0.12, 4.4, 0.12])); }
    // barracas da feira (lado direito) e o galpao de jogos (lado esquerdo, ao fundo)
    const barr: THREE.Matrix4[] = [], corB: THREE.Color[] = [], tolds: THREE.Matrix4[] = [], corT: THREE.Color[] = [];
    const paleta = ['#e84a3c', '#f4b829', '#2e9d5b', '#2f6fd6', '#e65fa8', '#ff8a2a'];
    for (let k = 0; k < 6; k++) {
      const q = PLAT.clone().addScaledVector(PLAT_LAT, 11).addScaledVector(PD, -17 + k * 6.6);
      barr.push(mtx([q.x, 6, q.y], [0, PYAW, 0], [4, 2.8, 4.6]).multiply(new THREE.Matrix4().makeTranslation(0, 0.5, 0)));
      corB.push(srgb('#efe6d4'));
      const q2 = PLAT.clone().addScaledVector(PLAT_LAT, 8.6).addScaledVector(PD, -17 + k * 6.6);
      tolds.push(mtx([q2.x, 8.9, q2.y], [0, PYAW, 0.35], [1.6, 0.08, 4.8], 'YXZ')); corT.push(srgb(paleta[k]));
    }
    const qg = PLAT.clone().addScaledVector(PLAT_LAT, -9).addScaledVector(PD, 13);
    barr.push(mtx([qg.x, 6, qg.y], [0, PYAW, 0], [9, 6, 12]).multiply(new THREE.Matrix4().makeTranslation(0, 0.5, 0))); corB.push(srgb('#d65b4a'));
    const luzes = novosPontos(PER_LUZ.pos, PER_LUZ.cor, 0.5, 1.6);
    return {
      tabs: instancias(GEO_CAIXA, madeira, [...tabs, plat]), pil: instancias(GEO_CIL, pilar, pil), cor: instancias(GEO_CAIXA, branco, cor), post: instancias(GEO_CAIXA, branco, post),
      barr: instancias(GEO_CAIXA, barraca, barr, corB), tolds: instancias(GEO_CAIXA, branco, tolds, corT), barraca, luzes,
    };
  }, [U]);
  p.barraca.emissiveIntensity = noite ? 0.9 * (1 - 0.6 * apagaEm(t)) : 0;
  (p.luzes.material as THREE.ShaderMaterial).uniforms.uGanho.value = noite ? 5 * (1 - 0.7 * apagaEm(t)) : 0;
  p.luzes.visible = noite; (p.luzes.material as THREE.ShaderMaterial).uniforms.uPx.value = px;
  return <>
    <primitive object={p.tabs} /><primitive object={p.pil} /><primitive object={p.cor} /><primitive object={p.post} />
    <primitive object={p.barr} /><primitive object={p.tolds} /><primitive object={p.luzes} />
  </>;
};

// ================================================================ roda-gigante (gerador proprio; ~26 m, 20 gondolas, ~760 LEDs)
const angRoda = (t: number) => {
  const w = (Math.PI * 2) / 75;
  if (t < 202) return w * (t - 150);
  const tau = Math.min(t - 202, 5);
  return w * 52 + w * (tau - (tau * tau) / 10);   // congela: desacelera ate parar (202-207)
};
const LEDS = (() => {
  const {R} = RODA, pos: number[] = [], info: number[] = [];   // info: angulo local, raio 0..1, lado, tipo (0 aro, 1 raio, 2 cubo)
  for (const lado of [-1.3, 1.3]) for (let i = 0; i < 120; i++) { const a = (i / 120) * Math.PI * 2; pos.push(R * Math.cos(a), R * Math.sin(a), lado); info.push(a, 1, lado, 0); }
  for (const lado of [-1.3, 1.3]) for (let j = 0; j < 24; j++) {
    const a = (j / 24) * Math.PI * 2 + (lado > 0 ? Math.PI / 24 : 0);
    for (let k = 0; k < 9; k++) { const r = 1.6 + ((R - 2.2) * k) / 8; pos.push(r * Math.cos(a), r * Math.sin(a), lado); info.push(a, r / R, lado, 1); }
  }
  for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; pos.push(1.25 * Math.cos(a), 1.25 * Math.sin(a), 1.9); info.push(a, 0.1, 1.9, 2); }
  return {pos: new Float32Array(pos), info, n: pos.length / 3};
})();
const hsl = (h: number, s: number, l: number): [number, number, number] => { const c = new THREE.Color().setHSL(((h % 1) + 1) % 1, s, l); return [c.r, c.g, c.b]; };
// padroes de LED que trocam a cada ~4 s (acao em cena); depois do gelo, azul-frio e falhando
const corLed = (t: number, th: number, a: number, r: number, lado: number, i: number): [number, number, number] => {
  const aw = a + th;
  let c: [number, number, number];
  if (t < 193) { const v = 0.45 + 0.55 * Math.max(0, Math.cos(aw * 6 - t * 4)); c = [1.0 * v, 0.82 * v, 0.58 * v]; }
  else if (t < 197) c = hsl(a / (Math.PI * 2) + t * 0.15, 1, 0.55);
  else if (t < 201) { const v = 0.5 + 0.5 * Math.sin(r * 11 - t * 7); c = lado > 0 ? [0.2 + 0.8 * v, 0.3 * v, 1.0] : [0.1, 0.8 * v + 0.2, 1.0 * v]; }
  else if (t < 205) {
    const k = Math.floor((((a + t * 0.6) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / ((Math.PI * 2) / 3));
    c = k === 0 ? [0.0, 0.62, 0.25] : k === 1 ? [1, 1, 1] : [0.95, 0.06, 0.1];    // verde, branco e vermelho
  } else { const v = 0.55 + 0.35 * Math.sin(t * 1.5 + r * 2); c = [0.5 * v, 0.78 * v, 1.0 * v]; }
  const falha = smooth(207, 216.5, t) * 0.7, h = rnd(i * 1.37 + 5);
  if (h < falha) return [0, 0, 0];
  if (h < falha + 0.06) { const f = 0.5 + 0.5 * Math.sin(t * 23 + i * 1.7); return [c[0] * f, c[1] * f, c[2] * f]; }
  return c;
};
const Roda: React.FC<{U: U_; t: number; px: number}> = ({U, t, px}) => {
  const noite = t >= NOITE;
  const r = useMemo(() => {
    const {R, Hh} = RODA;
    const branco = comGeada(new THREE.MeshStandardMaterial({color: '#f2f1ec', roughness: 0.45, metalness: 0.25}), U, 'aca_roda');
    const gira = new THREE.Group();
    const aros = [-1.3, 1.3].flatMap((z) => [R, R * 0.42].map((rr) => { const m = new THREE.Mesh(new THREE.TorusGeometry(rr, rr === R ? 0.17 : 0.1, 6, 120), branco); m.position.z = z; return m; }));
    aros.forEach((m) => gira.add(m));
    const raios: THREE.Matrix4[] = [];
    for (const lado of [-1.3, 1.3]) for (let j = 0; j < 24; j++) {
      const a = (j / 24) * Math.PI * 2 + (lado > 0 ? Math.PI / 24 : 0);
      raios.push(entre(new THREE.Vector3(0.9 * Math.cos(a), 0.9 * Math.sin(a), lado * 0.7), new THREE.Vector3(R * Math.cos(a), R * Math.sin(a), lado), 0.06));
    }
    for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2; raios.push(entre(new THREE.Vector3(R * Math.cos(a), R * Math.sin(a), -1.3), new THREE.Vector3(R * Math.cos(a), R * Math.sin(a), 1.3), 0.07)); }
    for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2, b = ((k + 1) / 48) * Math.PI * 2, z = k % 2 ? 1.3 : -1.3;
      raios.push(entre(new THREE.Vector3(R * Math.cos(a), R * Math.sin(a), z), new THREE.Vector3(R * Math.cos(b), R * Math.sin(b), -z), 0.045)); }
    gira.add(instancias(GEO_CIL, branco, raios));
    const cubo = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 3.8, 16).rotateX(Math.PI / 2), branco); gira.add(cubo);
    const leds = novosPontos(LEDS.pos, new Float32Array(LEDS.n * 3), 0.42, 1.4); gira.add(leds);
    gira.position.set(0, Hh, 0);
    // cavalete em A dos dois lados, com contraventamento
    const pernas: THREE.Matrix4[] = [];
    for (const z of [-1, 1]) {
      const topo = new THREE.Vector3(0, Hh, z * 2.0);
      for (const x of [-1, 1]) pernas.push(entre(new THREE.Vector3(x * 7.5, 0, z * 3.6), topo, 0.3));
      pernas.push(entre(new THREE.Vector3(-5.2, 4.5, z * 3.1), new THREE.Vector3(5.2, 4.5, z * 3.1), 0.16));
      pernas.push(entre(new THREE.Vector3(-2.9, 9.0, z * 2.6), new THREE.Vector3(2.9, 9.0, z * 2.6), 0.13));
    }
    pernas.push(entre(new THREE.Vector3(0, Hh, -2.2), new THREE.Vector3(0, Hh, 2.2), 0.35));
    const est = instancias(GEO_CIL, branco, pernas, undefined, true);
    // gondolas (penduradas no aro, sempre na vertical, com balanco pequeno)
    const corG = ['#e8402f', '#f6b51e', '#1f8fd6', '#2fae5a', '#ff7a1a', '#8a4fd1', '#e54b9a', '#16b3b3', '#f2e14c', '#d63f7a'];
    const matG = comGeada(new THREE.MeshStandardMaterial({roughness: 0.5, emissive: new THREE.Color('#fff2d0'), emissiveIntensity: 0}), U, 'aca_gondola');
    const gond = instancias(GEO_CAIXA, matG, Array.from({length: 20}, () => new THREE.Matrix4()), Array.from({length: 20}, (_, k) => srgb(corG[k % corG.length])), true);
    const teto = instancias(GEO_CAIXA, branco, Array.from({length: 20}, () => new THREE.Matrix4()));
    return {gira, leds, est, gond, teto, matG};
  }, [U]);
  // quadro
  const th = angRoda(t);
  r.gira.rotation.z = th;
  const ca = (r.leds.geometry.attributes.aCor as THREE.BufferAttribute);
  if (noite) {
    for (let i = 0; i < LEDS.n; i++) { const [a, rr, lado] = [LEDS.info[i * 4], LEDS.info[i * 4 + 1], LEDS.info[i * 4 + 2]]; const c = corLed(t, th, a, rr, lado, i); ca.setXYZ(i, c[0], c[1], c[2]); }
    ca.needsUpdate = true;
  }
  r.leds.visible = noite;
  (r.leds.material as THREE.ShaderMaterial).uniforms.uGanho.value = 4.2; (r.leds.material as THREE.ShaderMaterial).uniforms.uPx.value = px;
  r.matG.emissiveIntensity = noite ? 0.35 * (1 - apagaEm(t)) : 0;
  const m4 = new THREE.Matrix4(), mt = new THREE.Matrix4();
  for (let g = 0; g < 20; g++) {
    const a = th + (g / 20) * Math.PI * 2, px = RODA.R * Math.cos(a), py = RODA.Hh + RODA.R * Math.sin(a);
    const bal = 0.05 * Math.sin(t * 1.3 + g) * (1 - smooth(203, 208, t));
    m4.compose(new THREE.Vector3(px, py - 1.05, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, bal)), new THREE.Vector3(1.55, 1.35, 1.35));
    r.gond.setMatrixAt(g, m4);
    mt.compose(new THREE.Vector3(px, py - 0.3, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, bal)), new THREE.Vector3(1.8, 0.14, 1.6));
    r.teto.setMatrixAt(g, mt);
  }
  r.gond.instanceMatrix.needsUpdate = true; r.teto.instanceMatrix.needsUpdate = true;
  return (
    <group position={[RODA.x, RODA.y, RODA.z]} rotation-y={RODA_YAW}>
      <primitive object={r.gira} /><primitive object={r.est} /><primitive object={r.gond} /><primitive object={r.teto} />
    </group>
  );
};

// ================================================================ hoteis da Costera (a curva da baia) e casas nos morros
type Hotel = {x: number; z: number; ry: number; w: number; d: number; h: number; cor: string};
const HOTEIS: Hotel[] = (() => {
  const out: Hotel[] = [], cores = ['#eeeae0', '#e9dcc0', '#dcc7a1', '#e8b99a', '#c98f6e', '#b9cbd6', '#f2efe8', '#d9d2c4'];
  for (let k = 0; k < 11; k++) {      // no arco
    const a = 0.32 + k * 0.118, r = RC + 62 + rnd(k * 3 + 1) * 22, x = X0 + r * Math.sin(a), z = ZC + r * Math.cos(a);
    out.push({x, z, ry: Math.atan2(X0 - x, ZC - z), w: 24 + rnd(k + 5) * 16, d: 15 + rnd(k + 9) * 6, h: 28 + rnd(k + 13) * 55, cor: cores[k % cores.length]});
  }
  for (let k = 0; k < 44; k++) {      // na reta da margem direita (Zona Dorada): mais altos
    const z = -540 - k * 52 - rnd(k + 21) * 10, x = X0 + RC + 58 + rnd(k + 23) * 26;
    const alto = rnd(k + 29) < 0.2 ? 60 : 0;
    out.push({x, z, ry: -Math.PI / 2, w: 26 + rnd(k + 31) * 18, d: 16 + rnd(k + 37) * 6, h: 40 + rnd(k + 41) * 85 + alto, cor: cores[(k * 3) % cores.length]});
  }
  for (let k = 0; k < 12; k++) {      // Peninsula de las Playas (centro antigo): baixos
    const z = -1960 - k * 34, x = -1120 + 250 * Math.sin(z * 0.0021) - 40 - rnd(k + 51) * 60;
    out.push({x, z, ry: Math.PI / 2, w: 18 + rnd(k + 53) * 12, d: 14, h: 12 + rnd(k + 57) * 22, cor: cores[(k * 5) % cores.length]});
  }
  return out;
})();
const Hoteis: React.FC<{U: U_}> = ({U}) => {
  const im = useMemo(() => {
    const m = comGeada(new THREE.MeshStandardMaterial({roughness: 0.8}), U, 'aca_hotel', {
      cor: `float fach = 1.0 - step(0.5, abs(vNl.y));
  float uF = abs(vNl.x) > 0.5 ? vLoc.z * vEsc.z : vLoc.x * vEsc.x;
  float vF = vLoc.y * vEsc.y;
  vec2 celJ = vec2(floor(uF / 3.4), floor(vF / 3.1)); vec2 fJ = vec2(fract(uF / 3.4), fract(vF / 3.1));
  float jan = fach * step(0.14, fJ.x) * step(fJ.x, 0.86) * step(0.3, fJ.y) * step(fJ.y, 0.86) * step(4.5, vF) * step(vF, vEsc.y - 2.0);
  float laje = fach * (1.0 - step(0.17, fJ.y)) * step(4.5, vF);
  diffuseColor.rgb = mix(diffuseColor.rgb, min(diffuseColor.rgb * 1.15 + 0.05, vec3(1.0)), laje);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.09, 0.13, 0.18) + 0.07 * hA(vec3(celJ, vSem * 31.0)), jan);
  float hJ = hA(vec3(celJ * 1.7, vSem * 97.0 + abs(vNl.x) * 13.0));`,
      rug: 'roughnessFactor = mix(roughnessFactor, 0.15, jan);',
    });
    const antes = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLoc; varying vec3 vNl; varying vec3 vEsc; varying float vSem;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  vLoc = position; vNl = normal;
  #ifdef USE_INSTANCING
    vEsc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
    vSem = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
  #else
    vEsc = vec3(1.0); vSem = 0.0;
  #endif`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLoc; varying vec3 vNl; varying vec3 vEsc; varying float vSem;');
      antes.call(m, sh, r);
      sh.fragmentShader = sh.fragmentShader.replace('if (gMask > 0.0) { vec3 celG', `{ float acesa = jan * step(hJ, 0.6 * (1.0 - uApaga * hA(vec3(celJ, vSem * 7.3 + 2.0)))) * uNoite;
    vec3 corJ = mix(vec3(1.0, 0.62, 0.30), vec3(0.95, 0.88, 0.75), step(0.75, hA(vec3(celJ, 3.1))));
    totalEmissiveRadiance += acesa * corJ * (0.55 + 0.8 * hA(vec3(celJ, 9.7)));
    totalEmissiveRadiance += fach * (1.0 - step(4.5, vF)) * uNoite * (1.0 - uApaga * 0.85) * vec3(1.0, 0.75, 0.45) * 0.9; }
  if (gMask > 0.0) { vec3 celG`);
    };
    const ms = HOTEIS.map((h) => mtx([h.x, H(h.x, h.z) - 1.5, h.z], [0, h.ry, 0], [h.w, h.h + 1.5, h.d]));
    return instancias(GEO_CAIXA_BASE, m, ms, HOTEIS.map((h) => srgb(h.cor)));
  }, [U]);
  return <primitive object={im} />;
};

const CASAS = (() => {
  const pos: number[] = [], cor: number[] = [], sem: number[] = [];
  const past = [[0.95, 0.93, 0.88], [0.92, 0.82, 0.68], [0.85, 0.62, 0.5], [0.75, 0.82, 0.88], [0.95, 0.88, 0.6], [0.88, 0.55, 0.55]];
  for (let i = 0; i < 60000 && pos.length < 7500 * 3; i++) {
    const x = -3500 + rnd(i * 2.13 + 1) * 7100, z = -4700 + rnd(i * 3.71 + 2) * 4900, s = sdTerra(x, z);
    if (s < 45) continue;
    if (Math.max(smooth(380, 640, x), smooth(-1500, -1950, z)) < 0.6) continue;
    const y = H(x, z);
    if (y > 240 || rnd(i * 5.3 + 3) > 1.25 - y / 220) continue;
    if (x > AREIA.x0 && x < AREIA.x1 && z > AREIA.z0 && z < 60) continue;
    pos.push(x, y + 2.5, z); const c = past[Math.floor(rnd(i * 7.7) * past.length)]; cor.push(c[0], c[1], c[2]); sem.push(rnd(i * 9.1 + 4));
  }
  return {pos: new Float32Array(pos), cor: new Float32Array(cor), sem: new Float32Array(sem)};
})();
const CASAS_VS = `attribute vec3 aCor; attribute float aSem; uniform float uPx; uniform float uNoite; uniform float uApaga; uniform float uLuz;
varying vec3 vC; varying float vA;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float px = 6.0 * uPx / max(1.0, -mv.z);
  gl_PointSize = clamp(px, 1.2, 9.0);
  float acesa = step(aSem, 0.5 * (1.0 - uApaga * fract(aSem * 7.13 + 0.3)));
  vec3 noite = mix(aCor * 0.012, mix(vec3(1.0, 0.55, 0.22), vec3(1.0, 0.85, 0.6), step(0.8, fract(aSem * 3.7))) * (0.7 + 1.1 * fract(aSem * 13.7)), acesa);
  vC = mix(aCor * uLuz, noite, uNoite); vA = clamp(px / 1.3, 0.4, 1.0);
  gl_Position = projectionMatrix * mv; }`;
const CASAS_FS = `varying vec3 vC; varying float vA; void main(){ float r = length(gl_PointCoord - 0.5) * 2.0; if (r > 1.0) discard; gl_FragColor = vec4(vC, vA * (1.0 - smoothstep(0.5, 1.0, r))); }`;
const Casas: React.FC<{t: number; px: number; l: LuzTempo}> = ({t, px, l}) => {
  const p = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(CASAS.pos, 3)); g.setAttribute('aCor', new THREE.BufferAttribute(CASAS.cor, 3)); g.setAttribute('aSem', new THREE.BufferAttribute(CASAS.sem, 1));
    const m = new THREE.ShaderMaterial({vertexShader: CASAS_VS, fragmentShader: CASAS_FS, transparent: true, depthWrite: false,
      uniforms: {uPx: {value: 500}, uNoite: {value: 0}, uApaga: {value: 0}, uLuz: {value: 1}}});
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 5;
    return pts;
  }, []);
  const u = (p.material as THREE.ShaderMaterial).uniforms;
  u.uPx.value = px; u.uNoite.value = t >= NOITE ? 1 : 0; u.uApaga.value = apagaEm(t);
  u.uLuz.value = 0.05 + 0.75 * l.dia * Math.min(1.4, l.intensidade / 2.5 + 0.3);
  return <primitive object={p} />;
};

// ================================================================ mar: espelho + ondas + espuma + gelo das bordas
const AGUA_VS = `uniform mat4 mTex; varying vec4 vR; varying vec3 vW;
void main(){ vR = mTex * vec4(position, 1.0); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const AGUA_FS = `
uniform sampler2D tRef; uniform float uT; uniform vec3 uSol; uniform vec3 uCorSol; uniform float uSolI; uniform float uDia;
uniform vec3 uCeuH; uniform vec3 uLuzGelo; uniform float uGelo; uniform float uCalma;
varying vec4 vR; varying vec3 vW;
${RUIDO}${GEO}
float hW(vec2 q){ return n2A(q * 0.055 + vec2(uT * 0.09, uT * 0.035)) + n2A(q * 0.16 - vec2(uT * 0.12, -uT * 0.06)) * 0.45
  + n2A(q * 0.48 + vec2(uT * 0.28, uT * 0.17)) * 0.17 + n2A(q * 1.5 + vec2(-uT * 0.45, uT * 0.38)) * 0.06; }
void main(){
  vec2 p = vW.xz; float s = sdTerra(p); float dW = -s; float prof = max(0.0, 0.045 * dW - 0.6);
  float dist = length(vW - cameraPosition);
  // gelo: avanca da linha d'agua para o mar, borda recortada por ruido; placas com rachaduras
  float alcance = 13.3 + uGelo * (95.0 + (n2A(p * 0.018) - 0.5) * 60.0) + (n2A(p * 0.09) - 0.5) * 9.0 * uGelo;
  float gelo = uGelo > 0.001 ? smoothstep(alcance, alcance - 3.0, dW) : 0.0;
  float calma = (1.0 - uCalma * 0.85) * (1.0 - gelo);
  float e = 0.3 + dist * 0.003, amp = 5.5 * calma / (1.0 + dist * 0.0012);
  vec3 N = normalize(vec3(-(hW(p + vec2(e, 0.0)) - hW(p - vec2(e, 0.0))) / (2.0 * e) * amp, 1.0, -(hW(p + vec2(0.0, e)) - hW(p - vec2(0.0, e))) / (2.0 * e) * amp));
  vec3 V = normalize(cameraPosition - vW);
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec4 r = vR; r.xy += N.xz * 0.9 * r.w * 0.06;
  vec3 refl = texture2DProj(tRef, r).rgb;
  vec3 raso = vec3(0.04, 0.30, 0.28), fundo = vec3(0.008, 0.05, 0.075);
  vec3 corpo = mix(raso, fundo, smoothstep(0.0, 7.0, prof)) * (0.06 + 0.94 * uDia) + vec3(0.0, 0.012, 0.016) * (1.0 - uDia);
  vec3 col = mix(corpo, refl, clamp(fres * 1.15 + 0.08, 0.0, 1.0));
  vec3 R = reflect(-V, N);
  col += pow(max(dot(R, normalize(uSol)), 0.0), 380.0) * uSolI * uCorSol * 7.0 * (1.0 - gelo);
  // espuma: arrebentacao na linha d'agua e ondas chegando (param com o gelo)
  float d = dW - 13.3, f = smoothstep(1.4, 0.0, d);
  for (int k = 0; k < 3; k++) { float fk = float(k); float ph = fract(uT * 0.085 + fk / 3.0); float bd = mix(20.0, 0.3, ph);
    f += smoothstep(0.7, 0.0, abs(d - bd)) * (0.55 + 0.45 * sin(p.x * 0.19 + fk * 2.1)) * (1.0 - ph * 0.4); }
  f = clamp(f, 0.0, 1.0) * smoothstep(0.3, 0.62, n2A(p * 0.6 + vec2(uT * 0.4, 0.0)) + 0.25) * (1.0 - uCalma * 0.9);
  vec3 corEsp = mix(vec3(0.10, 0.36, 0.38), vec3(0.92), uDia) * (0.35 + 0.65 * uDia) + vec3(0.02, 0.05, 0.06);
  col = mix(col, corEsp, f * (1.0 - gelo));
  // gelo: branco-azulado, aspero, rachado, com cintilacao; reflete pouco
  float rach = smoothstep(0.035, 0.0, abs(n2A(p * 0.12) - 0.5)) + smoothstep(0.02, 0.0, abs(n2A(p * 0.41 + 7.0) - 0.5)) * 0.6;
  vec3 gAlb = mix(vec3(0.50, 0.68, 0.80), vec3(0.80, 0.89, 0.96), n2A(p * 0.05) * 0.6 + smoothstep(alcance - 25.0, alcance - 60.0, dW) * 0.4);
  vec3 gCol = gAlb * uLuzGelo * (1.0 - 0.5 * clamp(rach, 0.0, 1.0)) + refl * 0.25;
  float cint = step(0.992, h2A(floor(p * 4.0))) * (0.5 + 0.5 * sin(uT * 3.0 + h2A(floor(p * 4.0)) * 50.0));
  gCol += cint * vec3(1.2, 1.35, 1.6) * gelo * 0.8;
  col = mix(col, gCol, gelo);
  float a = mix(0.5, 1.0, smoothstep(0.0, 2.2, prof));
  a = max(a, max(f * 0.95, gelo));
  gl_FragColor = vec4(col, a);
}`;
const Agua: React.FC<{t: number; l: LuzTempo}> = ({t, l}) => {
  const {gl, size} = useThree();
  const soft = useMemo(() => {
    const ctx = gl.getContext(), ext = ctx.getExtension('WEBGL_debug_renderer_info');
    const rend = ext ? String(ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    return /swiftshader|llvmpipe|software/i.test(rend) || String((globalThis as any).__dbg ?? '').includes('fb8');
  }, [gl]);
  const a = useMemo(() => {
    const rt = new THREE.WebGLRenderTarget(512, 288, {type: soft ? THREE.UnsignedByteType : THREE.HalfFloatType, samples: 0});
    const mat = new THREE.ShaderMaterial({vertexShader: AGUA_VS, fragmentShader: AGUA_FS, transparent: true,
      uniforms: {tRef: {value: rt.texture}, mTex: {value: new THREE.Matrix4()}, uT: {value: 0}, uSol: {value: new THREE.Vector3(0, 1, 0)}, uCorSol: {value: new THREE.Color()},
        uSolI: {value: 1}, uDia: {value: 1}, uCeuH: {value: new THREE.Color()}, uLuzGelo: {value: new THREE.Color()}, uGelo: {value: 0}, uCalma: {value: 0}}});
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(40000, 40000), mat);
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(0, 0, -6000); mesh.renderOrder = 1; mesh.frustumCulled = false;
    // espelho plano (logica do Reflector do three): camera virtual refletida + plano de corte obliquo
    const camV = new THREE.PerspectiveCamera(), n = new THREE.Vector3(0, 1, 0), p0 = new THREE.Vector3(0, 0, 0);
    const plano = new THREE.Plane(), clip = new THREE.Vector4(), q = new THREE.Vector4(), rot = new THREE.Matrix4();
    const vista = new THREE.Vector3(), alvo = new THREE.Vector3(), olhar = new THREE.Vector3(), camPos = new THREE.Vector3();
    let ocupado = false;
    mesh.onBeforeRender = (renderer, scene, camera) => {
      if (ocupado) return;
      camPos.setFromMatrixPosition(camera.matrixWorld);
      if (camPos.y <= 0.05) return;
      ocupado = true;
      vista.subVectors(p0, camPos).reflect(n).negate().add(p0);
      rot.extractRotation(camera.matrixWorld);
      olhar.set(0, 0, -1).applyMatrix4(rot).add(camPos);
      alvo.subVectors(p0, olhar).reflect(n).negate().add(p0);
      camV.position.copy(vista); camV.up.set(0, 1, 0).applyMatrix4(rot).reflect(n); camV.lookAt(alvo);
      camV.far = (camera as THREE.PerspectiveCamera).far; camV.near = (camera as THREE.PerspectiveCamera).near;
      camV.updateMatrixWorld(); camV.projectionMatrix.copy(camera.projectionMatrix);
      const mT = mat.uniforms.mTex.value as THREE.Matrix4;
      mT.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
      mT.multiply(camV.projectionMatrix); mT.multiply(camV.matrixWorldInverse); mT.multiply(mesh.matrixWorld);
      plano.setFromNormalAndCoplanarPoint(n, p0); plano.applyMatrix4(camV.matrixWorldInverse);
      clip.set(plano.normal.x, plano.normal.y, plano.normal.z, plano.constant);
      const P = camV.projectionMatrix.elements;
      q.x = (Math.sign(clip.x) + P[8]) / P[0]; q.y = (Math.sign(clip.y) + P[9]) / P[5]; q.z = -1; q.w = (1 + P[10]) / P[14];
      clip.multiplyScalar(2 / clip.dot(q));
      P[2] = clip.x; P[6] = clip.y; P[10] = clip.z + 1 - 0.003; P[14] = clip.w;
      mesh.visible = false;
      const atual = renderer.getRenderTarget(), auto = renderer.shadowMap.autoUpdate;
      renderer.shadowMap.autoUpdate = false;
      renderer.setRenderTarget(rt); renderer.state.buffers.depth.setMask(true);
      if (renderer.autoClear === false) renderer.clear();
      renderer.render(scene, camV);
      renderer.shadowMap.autoUpdate = auto; renderer.setRenderTarget(atual);
      const vp = (camera as any).viewport; if (vp !== undefined) renderer.state.viewport(vp);
      mesh.visible = true; ocupado = false;
    };
    return {mesh, mat, rt};
  }, [soft]);
  const buf = gl.getDrawingBufferSize(new THREE.Vector2());
  const w = Math.max(64, Math.round(buf.x * 0.5)), h = Math.max(36, Math.round(buf.y * 0.5));
  if (a.rt.width !== w || a.rt.height !== h) a.rt.setSize(w, h);
  void size;
  const u = a.mat.uniforms, g = geloEm(t), noite = t >= NOITE;
  u.uT.value = t; u.uSol.value.copy(l.sol).normalize(); (u.uCorSol.value as THREE.Color).copy(l.corSol); u.uSolI.value = noite ? 0.12 : Math.min(1.3, l.intensidade / 2.5);
  u.uDia.value = l.dia; u.uGelo.value = g; u.uCalma.value = noite ? smooth(197, 214, t) : 0;
  (u.uLuzGelo.value as THREE.Color).copy(l.ambiente).multiplyScalar(l.ambienteForca * 0.9).add(new THREE.Color(0.04, 0.05, 0.08)).add(l.corSol.clone().multiplyScalar(l.intensidade * 0.35));
  return <primitive object={a.mesh} />;
};

// ================================================================ praia: sombrillas, palapas, cadeiras, toalhas, salva-vidas
type Sombrilla = {x: number; z: number; palapa: boolean; cor: string; fecha?: number};
const SOMBRILLAS: Sombrilla[] = (() => {
  const cores = ['#e8402f', '#f6b51e', '#1f8fd6', '#2fae5a', '#ff7a1a', '#e54b9a', '#16b3b3'];
  const fechas: Record<string, number> = {'-16': 167.5, '8': 171, '20': 175.2, '32': 179, '44': 180.5, '56': 184.2, '2': 172.5, '38': 181.8};
  const out: Sombrilla[] = [];
  for (let k = 0; k < 13; k++) { const x = -52 + 12 * k; out.push({x, z: -24 + (k % 2) * 0.8, palapa: k % 3 === 0, cor: cores[k % cores.length], fecha: fechas[String(x)]}); }
  for (let k = 0; k < 12; k++) { const x = -46 + 12 * k; out.push({x, z: -36.5 - (k % 2), palapa: k % 3 === 1, cor: cores[(k + 3) % cores.length], fecha: fechas[String(x)]}); }
  return out;
})();
const Praia: React.FC<{U: U_; t: number}> = ({U, t}) => {
  const p = useMemo(() => {
    const lona = comGeada(new THREE.MeshStandardMaterial({roughness: 0.75, side: THREE.DoubleSide}), U, 'aca_lona', {
      cor: `float listra = step(0.5, fract(atan(vLonaL.z, vLonaL.x) / 6.2831853 * 8.0));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.94, 0.9), listra * vLonaP);`,
    });
    const antes = lona.onBeforeCompile;
    lona.onBeforeCompile = (sh, r) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLonaL; varying float vLonaP; attribute float aPalapa;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLonaL = position; vLonaP = 1.0 - aPalapa;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLonaL; varying float vLonaP;');
      antes.call(lona, sh, r);
    };
    const geoCopa = new THREE.ConeGeometry(1, 1, 16, 1, true).translate(0, -0.5, 0);
    const pal = new Float32Array(SOMBRILLAS.length);
    SOMBRILLAS.forEach((s, i) => { pal[i] = s.palapa ? 1 : 0; });
    geoCopa.setAttribute('aPalapa', new THREE.InstancedBufferAttribute(pal, 1));
    const copa = instancias(geoCopa, lona, SOMBRILLAS.map(() => new THREE.Matrix4()), SOMBRILLAS.map((s) => srgb(s.palapa ? '#b89a62' : s.cor)), true);
    const madeira = comGeada(new THREE.MeshStandardMaterial({color: '#8d7350', roughness: 0.9}), U, 'aca_mastro');
    const mastros = instancias(GEO_CIL, madeira, SOMBRILLAS.map((s) => mtx([s.x, H(s.x, s.z) + 1.3, s.z], [0, 0, 0], s.palapa ? [0.11, 2.6, 0.11] : [0.035, 2.6, 0.035])), undefined, true);
    // cadeiras de plastico e toalhas
    const plast = comGeada(new THREE.MeshStandardMaterial({color: '#f1f1ee', roughness: 0.5}), U, 'aca_cadeira');
    const cad: THREE.Matrix4[] = [];
    const toalhas: THREE.Matrix4[] = [], corT: THREE.Color[] = [];
    for (const pp of PESSOAS_DIA) {
      if (pp.pose === 'sentado') { const y = H(pp.x, pp.z); cad.push(mtx([pp.x, y + 0.42, pp.z], [0, pp.rot, 0], [0.5, 0.05, 0.5]), mtx([pp.x + Math.sin(pp.rot) * -0.25, y + 0.7, pp.z + Math.cos(pp.rot) * -0.25], [0, pp.rot, 0], [0.5, 0.55, 0.05])); for (const [dx, dz] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) cad.push(mtx([pp.x + dx, y + 0.2, pp.z + dz], [0, 0, 0], [0.04, 0.42, 0.04])); }
      if (pp.pose === 'deitado') { toalhas.push(mtx([pp.x, H(pp.x, pp.z) + 0.02, pp.z], [0, pp.rot, 0], [1.0, 0.025, 2.0])); corT.push(srgb(['#e84a3c', '#2f6fd6', '#f4b829', '#2e9d5b', '#e65fa8'][pp.i % 5])); }
    }
    const tecido = new THREE.MeshStandardMaterial({roughness: 0.95});
    // torre de salva-vidas
    const torre = new THREE.Group();
    const corT1 = comGeada(new THREE.MeshStandardMaterial({color: '#f4f2ec', roughness: 0.6}), U, 'aca_torre');
    const corT2 = new THREE.MeshStandardMaterial({color: '#d63a2f', roughness: 0.6});
    const ty = H(46, -45);
    for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) { const m = new THREE.Mesh(GEO_CIL, corT1); m.position.set(46 + dx, ty + 1.3, -45 + dz); m.scale.set(0.08, 2.6, 0.08); torre.add(m); }
    const cab = new THREE.Mesh(GEO_CAIXA, corT2); cab.position.set(46, ty + 3.4, -45); cab.scale.set(2.4, 1.7, 2.4); cab.castShadow = true; torre.add(cab);
    const tt = new THREE.Mesh(GEO_CAIXA, corT1); tt.position.set(46, ty + 4.35, -45); tt.scale.set(2.9, 0.2, 2.9); torre.add(tt);
    return {copa, mastros, cad: instancias(GEO_CAIXA, plast, cad, undefined, true), toalhas: instancias(GEO_CAIXA, tecido, toalhas, corT), torre};
  }, [U]);
  const m4 = new THREE.Matrix4();
  SOMBRILLAS.forEach((s, i) => {
    const k = s.palapa ? 0 : t >= NOITE ? 1 : s.fecha ? smooth(s.fecha, s.fecha + 1.3, t) : 0;
    const raio = (s.palapa ? 2.3 : 1.35) * (1 - 0.86 * k), alt = (s.palapa ? 0.95 : 0.5) * (1 + 1.5 * k);
    m4.compose(new THREE.Vector3(s.x, H(s.x, s.z) + (s.palapa ? 2.75 : 2.62) - 0.15 * k, s.z), new THREE.Quaternion(), new THREE.Vector3(raio, alt, raio));
    p.copa.setMatrixAt(i, m4);
  });
  p.copa.instanceMatrix.needsUpdate = true;
  return <><primitive object={p.copa} /><primitive object={p.mastros} /><primitive object={p.cad} /><primitive object={p.toalhas} /><primitive object={p.torre} /></>;
};

const PALMEIRAS: PalmeiraItem[] = (() => {
  const out: PalmeiraItem[] = [];
  for (let k = 0; k < 64; k++) { const x = -392 + 16 * k + (rnd(k * 3.1) - 0.5) * 5; out.push({x, z: -8.6 - rnd(k * 5.3) * 2.5, y: H(x, -9), variante: rnd(k * 7.7) < 0.55 ? 'reta' : rnd(k * 7.7) < 0.8 ? 'curva' : 'dupla', escala: 0.95 + rnd(k * 2.9) * 0.3}); }
  const soltas: [number, number, number][] = [[-30, -17, 4], [-6, -46, 1], [17, -16, 2], [52, -18, 4], [75, -44, 1], [-62, -40, 0], [98, -20, 2], [128, -30, 1], [-90, -20, 3]];
  soltas.forEach(([x, z, v], i) => out.push({x, z, y: H(x, z), variante: v, escala: 0.9 + rnd(i + 99) * 0.25}));
  return out;
})();

// ================================================================ pessoas (Multidao3D com estado proprio: ficam, levantam e vao embora)
type PA = Pessoa3D & {tSai?: number; rota?: [number, number][]; v?: number; tEntra?: number; fica?: boolean};
const PASSADA: Record<string, number> = {Walk_Loop: 1.45, Jog_Fwd_Loop: 2.6, Sprint_Loop: 3.9};
const PI = Math.PI;
const vai = (x: number, z: number, saida: number, xFim: number): [number, number][] => [[x + 2, -8.5], [x + 3, saida], [xFim, saida]];
const PESSOAS_DIA: PA[] = [
  {i: 1, x: -15, z: -27, rot: 0.4, pose: 'deitado', tSai: 166.5, rota: vai(-15, -27, 2, -95), v: 1.3},
  {i: 2, x: -13, z: -28.6, rot: 0.2, pose: 'deitado', fem: true, tSai: 166.9, rota: vai(-14, -27, 2.8, -95), v: 1.3},
  {i: 3, x: -17.6, z: -25.6, rot: PI, pose: 'sentado', tSai: 167.2, rota: vai(-16, -26, 3.4, -95), v: 1.25},
  {i: 4, x: 7, z: -26, rot: PI, pose: 'sentado', fem: true, tSai: 170, rota: [[8, -9], [17.5, -5.5]], v: 1.2, fica: true},
  {i: 5, x: 10, z: -29, rot: -2.4, pose: 'conversando', tSai: 170.4, rota: [[10, -9], [19.5, -5.2]], v: 1.25, fica: true},
  {i: 6, x: 1, z: -38.5, rot: 1.0, pose: 'deitado', tSai: 172, rota: vai(1, -38, 2.2, -80), v: 1.35},
  {i: 7, x: 14, z: -82, rot: 0.3, pose: 'nadando', tSai: 173, rota: [[14, -52], ...vai(15, -40, 1.6, 95)], v: 1.2},
  {i: 8, x: 18.5, z: -86, rot: -0.4, pose: 'nadando', fem: true, tSai: 173.6, rota: [[18, -52], ...vai(19, -40, 2.4, 95)], v: 1.2},
  {i: 9, x: 23, z: -80, rot: 0.1, pose: 'nadando', tSai: 174.3, rota: [[23, -52], ...vai(23, -40, 3.2, 95)], v: 1.25},
  {i: 10, x: 27, z: -55, rot: PI, pose: 'parado', tSai: 175.5, rota: vai(26, -40, 1.8, 110), v: 1.3},
  {i: 11, x: 33, z: -44, rot: 0.8, pose: 'conversando', tSai: 177.8, rota: vai(34, -44, 2.6, 120), v: 1.3},
  {i: 12, x: 35, z: -45.5, rot: -0.6, pose: 'conversando', fem: true, tSai: 178.2, rota: vai(35, -44, 3.4, 120), v: 1.3},
  {i: 13, x: 37, z: -43.8, rot: -2.2, pose: 'parado', tSai: 178.6, rota: vai(37, -44, 1.8, 120), v: 1.3},
  {i: 14, x: 42, z: -39, rot: 2.2, pose: 'deitado', fem: true, tSai: 179.5, rota: vai(42, -39, 2.6, 130), v: 1.3},
  {i: 15, x: 55.4, z: -25.6, rot: PI, pose: 'sentado', tSai: 182.5, rota: vai(55, -26, 1.8, 140), v: 1.3},
  {i: 16, x: 57, z: -28.4, rot: 0.6, pose: 'deitado', fem: true, tSai: 183, rota: vai(57, -28, 2.8, 140), v: 1.3},
  {i: 17, x: 61, z: -84, rot: 0, pose: 'nadando', tSai: 181, rota: [[61, -52], ...vai(62, -40, 3.6, 150)], v: 1.3},
  {i: 18, x: -25, z: 1.6, rot: PI / 2, pose: 'parado', tSai: 165, rota: [[140, 1.6]], v: 1.25, camisa: '#f4f1ea', calca: '#2c2f36'},   // paletero
  {i: 19, x: -80, z: 0.2, rot: PI / 2, pose: 'andando', tSai: 150, rota: [[160, 0.2]], v: 1.4},
  {i: 20, x: 60, z: -2, rot: -PI / 2, pose: 'andando', fem: true, tSai: 150, rota: [[-160, -2]], v: 1.3},
  {i: 21, x: -60, z: 4.2, rot: PI / 2, pose: 'andando', tSai: 160, rota: [[200, 4.2]], v: 2.9},
  {i: 22, x: -44, z: -30, rot: -0.5, pose: 'deitado', tSai: 168.5, rota: vai(-44, -30, 2.4, -120), v: 1.3},
  {i: 23, x: -38, z: -58, rot: PI, pose: 'parado', fem: true, tSai: 169, rota: vai(-38, -45, 3.0, -120), v: 1.3},
  {i: 24, x: 68, z: -24, rot: PI, pose: 'sentado', tSai: 185.5, rota: vai(68, -24, 2.0, 150), v: 1.3},
  {i: 25, x: 45, z: -2.5, rot: PI / 2, pose: 'andando', tSai: 176, tEntra: 176, rota: [[160, -2.5]], v: 1.3},
];
const PESSOAS_NOITE: PA[] = [
  {i: 31, x: -75, z: -1, rot: PI / 2, pose: 'andando', tSai: 188, rota: [[60, -1]], v: 1.7, camisa: '#2c2f36', calca: '#1f3f8f'},
  {i: 32, x: -40, z: -30, rot: 0, pose: 'parado', tSai: 189.5, rota: [[-38, -8.5], [-36, 1], [60, 1]], v: 1.5, camisa: '#7d5ba6', calca: '#2c2f36'},
  {i: 33, x: -38.6, z: -31, rot: 0, pose: 'parado', fem: true, tSai: 189.8, rota: [[-37, -8.5], [-35, 1.8], [60, 1.8]], v: 1.5, camisa: '#c0392b', calca: '#2c2f36'},
  {i: 34, x: -30, z: -3, rot: 0.3, pose: 'parado', tSai: 195.5, rota: [[-140, -3]], v: 1.6, camisa: '#16a085', calca: '#2c2f36'},
  {i: 35, x: -60, z: 3, rot: PI / 2, pose: 'andando', tSai: 197, tEntra: 197, rota: [[60, 3]], v: 3.2, camisa: '#e67e22', calca: '#2c2f36'},
  {i: 36, x: -12, z: -2, rot: -PI / 2, pose: 'andando', tSai: 188, rota: [[-150, -2]], v: 1.55, fem: true, camisa: '#f4f1ea', calca: '#6b4a2f'},
];
const estadoAca = (p: PA, t: number): Estado3D => {
  const some: Estado3D = {x: 0, y: 0, z: 0, ry: 0, clipe: 'Idle_Loop', tempo: 0, visivel: false};
  if (p.tEntra !== undefined && t < p.tEntra) return some;
  const sem = rnd(p.i * 13 + 1) * 5;
  if (p.tSai === undefined || t < p.tSai) {
    const y = chao(p.x, p.z);
    if (p.pose === 'deitado') return {x: p.x, y: y + 0.04, z: p.z, ry: p.rot, clipe: 'Death01', tempo: 99};
    if (p.pose === 'sentado') return {x: p.x, y: y, z: p.z, ry: p.rot, clipe: 'Sitting_Idle_Loop', tempo: t + sem};
    if (p.pose === 'nadando') return {x: p.x, y: -1.15 + 0.08 * Math.sin(t * 1.4 + sem), z: p.z, ry: p.rot, clipe: 'Swim_Idle_Loop', tempo: t + sem};
    if (p.pose === 'conversando') return {x: p.x, y, z: p.z, ry: p.rot, clipe: 'Idle_Talking_Loop', tempo: t + sem};
    return {x: p.x, y, z: p.z, ry: p.rot, clipe: 'Idle_Loop', tempo: t + sem};
  }
  const lev = p.pose === 'deitado' ? 0.9 : p.pose === 'sentado' ? 1.0 : 0, tt = t - p.tSai;
  if (tt < lev) {
    const y = chao(p.x, p.z);
    if (p.pose === 'deitado') return {x: p.x, y, z: p.z, ry: p.rot, clipe: 'Death01', tempo: -(0.001 + (tt / lev) * 2.3)};
    return {x: p.x, y, z: p.z, ry: p.rot, clipe: 'Sitting_Exit', tempo: tt};
  }
  const v = p.v ?? 1.3, pts: [number, number][] = [[p.x, p.z], ...(p.rota ?? [])];
  let d = v * (tt - lev), x = p.x, z = p.z, ry = p.rot, k = 1;
  for (; k < pts.length; k++) {
    const [xa, za] = pts[k - 1], [xb, zb] = pts[k], L = Math.hypot(xb - xa, zb - za);
    ry = Math.atan2(xb - xa, zb - za);
    if (d <= L) { x = xa + ((xb - xa) * d) / L; z = za + ((zb - za) * d) / L; break; }
    d -= L; x = xb; z = zb;
  }
  if (k >= pts.length) {
    if (!p.fica) return some;
    return {x, y: chao(x, z), z, ry: ry + PI * 0.8, clipe: 'Idle_Talking_Loop', tempo: t + sem};
  }
  const clipe = v > 3.6 ? 'Sprint_Loop' : v > 1.9 ? 'Jog_Fwd_Loop' : 'Walk_Loop';
  const y = Math.max(chao(x, z), -1.0);
  return {x, y, z, ry, clipe, tempo: (v * (tt - lev)) / PASSADA[clipe]};
};
const Pessoas: React.FC<{t: number}> = ({t}) => {
  const lista = t < NOITE ? PESSOAS_DIA : PESSOAS_NOITE;
  return <Multidao3D lista={lista} t={t} de={[0, 0]} estadoDe={(p, _k, tt) => estadoAca(p as PA, tt)} />;
};
// carrinho do paletero (empurrado pela pessoa 18)
const Carrinho: React.FC<{t: number}> = ({t}) => {
  const e = estadoAca(PESSOAS_DIA[17], t);
  if (t >= NOITE || e.visivel === false) return null;
  const fx = Math.sin(e.ry), fz = Math.cos(e.ry);
  return (
    <group position={[e.x + fx * 0.95, Y_CALC, e.z + fz * 0.95]} rotation-y={e.ry}>
      <mesh position={[0, 0.75, 0]} castShadow><boxGeometry args={[0.75, 0.75, 1.1]} /><meshStandardMaterial color="#f4f2ee" roughness={0.5} /></mesh>
      <mesh position={[0, 0.8, 0.56]}><boxGeometry args={[0.6, 0.35, 0.02]} /><meshStandardMaterial color="#e8402f" roughness={0.6} /></mesh>
      <mesh position={[0, 1.95, 0]}><cylinderGeometry args={[0.025, 0.025, 1.6, 6]} /><meshStandardMaterial color="#888" /></mesh>
      <mesh position={[0, 2.7, 0]} castShadow><coneGeometry args={[0.9, 0.35, 12, 1, true]} /><meshStandardMaterial color="#1f8fd6" side={THREE.DoubleSide} roughness={0.7} /></mesh>
      {[-0.3, 0.3].map((dx) => <mesh key={dx} position={[dx, 0.18, -0.35]} rotation-z={PI / 2}><cylinderGeometry args={[0.18, 0.18, 0.06, 12]} /><meshStandardMaterial color="#222" /></mesh>)}
    </group>
  );
};

// ================================================================ Costera: carros (taxis azul e branco) so de dia
const CARROS = [
  {x0: -120, v: 11, z: 12, cor: '#f2f2f0', teto: '#1f5fbf'}, {x0: 20, v: 11.5, z: 12.5, cor: '#c23b2f', teto: '#c23b2f'}, {x0: 150, v: 10.5, z: 12, cor: '#f2f2f0', teto: '#1f5fbf'},
  {x0: 60, v: -10, z: 16, cor: '#9aa3ab', teto: '#9aa3ab'}, {x0: -40, v: -10.5, z: 16.5, cor: '#f2f2f0', teto: '#1f5fbf'}, {x0: 200, v: -9.5, z: 16, cor: '#2c2f36', teto: '#2c2f36'},
];
const Carros: React.FC<{t: number}> = ({t}) => {
  if (t >= NOITE) return null;
  return <>{CARROS.map((c, i) => {
    const x = ((((c.x0 + c.v * (t - 150)) + 250) % 500) + 500) % 500 - 250;
    return (
      <group key={i} position={[x, Y_RUA, c.z]} rotation-y={c.v > 0 ? 0 : PI}>
        <mesh position={[0, 0.62, 0]} castShadow><boxGeometry args={[4.1, 0.8, 1.75]} /><meshStandardMaterial color={c.cor} roughness={0.35} metalness={0.3} /></mesh>
        <mesh position={[-0.2, 1.25, 0]}><boxGeometry args={[2.2, 0.55, 1.6]} /><meshStandardMaterial color={c.teto} roughness={0.3} metalness={0.3} /></mesh>
        <mesh position={[-0.2, 1.24, 0]}><boxGeometry args={[2.0, 0.42, 1.64]} /><meshStandardMaterial color="#1a2430" roughness={0.1} metalness={0.5} /></mesh>
        {[[-1.3, -0.85], [1.3, -0.85], [-1.3, 0.85], [1.3, 0.85]].map(([dx, dz], k) => <mesh key={k} position={[dx, 0.33, dz]} rotation-x={PI / 2}><cylinderGeometry args={[0.33, 0.33, 0.22, 12]} /><meshStandardMaterial color="#111" /></mesh>)}
      </group>
    );
  })}</>;
};

// ================================================================ lanchas, esteira e parasail
type Lancha = {pts: [number, number, number][]; cor: string; para?: boolean};
const LANCHAS: Lancha[] = [
  {pts: [[150, -260, -380], [196, 320, -470]], cor: '#1f8fd6', para: true},
  {pts: [[160, -38, -214], [163, -36, -222], [184, 125, -540], [200, 220, -760]], cor: '#e8402f'},
  {pts: [[168, 230, -700], [172, 150, -560], [190, -18, -250], [195, -30, -232]], cor: '#2fae5a'},
  {pts: [[0, 70, -118]], cor: '#f6b51e'}, {pts: [[0, 118, -142]], cor: '#16b3b3'}, {pts: [[0, -42, -150]], cor: '#ff7a1a'}, {pts: [[0, -31, -158]], cor: '#e54b9a'},
];
const posLancha = (L: Lancha, t: number) => {
  const P = L.pts;
  if (P.length === 1) return {x: P[0][1], z: P[0][2], hx: Math.cos(P[0][1] * 0.37), hz: Math.sin(P[0][1] * 0.37), v: 0};
  let k = 0; while (k < P.length - 2 && t > P[k + 1][0]) k++;
  const a = P[k], b = P[k + 1], u = Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0])));
  const dx = b[1] - a[1], dz = b[2] - a[2], L2 = Math.hypot(dx, dz) || 1, v = t < a[0] || t > b[0] ? 0 : L2 / (b[0] - a[0]);
  return {x: a[1] + dx * u, z: a[2] + dz * u, hx: dx / L2, hz: dz / L2, v};
};
const ESTEIRA_FS = `varying vec2 vUv; uniform float uT; uniform float uLuz; uniform float uForca;
float hh(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5); }
float nn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hh(i), hh(i + vec2(1,0)), f.x), mix(hh(i + vec2(0,1)), hh(i + vec2(1,1)), f.x), f.y); }
void main(){ float u = vUv.y, v = (vUv.x - 0.5) * 2.0;
  float braco = smoothstep(0.07, 0.0, abs(abs(v) - u * 0.95)) * step(0.02, u);
  float centro = smoothstep(0.1 + 0.25 * u, 0.0, abs(v)) * (1.0 - u * 0.6);
  float n = nn(vec2(v * 9.0, u * 30.0 - uT * 6.0));
  float a = clamp(braco * 0.8 + centro * (0.5 + 0.5 * n), 0.0, 1.0) * (1.0 - smoothstep(0.55, 1.0, u)) * uForca;
  gl_FragColor = vec4(vec3(0.92) * uLuz, a * smoothstep(0.25, 0.6, n + 0.3)); }`;
const Lanchas: React.FC<{U: U_; t: number; l: LuzTempo}> = ({U, t, l}) => {
  const r = useMemo(() => {
    const s = new THREE.Shape(), L = 7, B = 2.4;
    s.moveTo(-L / 2, -B / 2); s.lineTo(L * 0.12, -B / 2); s.quadraticCurveTo(L * 0.42, -B * 0.42, L / 2, 0); s.quadraticCurveTo(L * 0.42, B * 0.42, L * 0.12, B / 2); s.lineTo(-L / 2, B / 2); s.lineTo(-L / 2, -B / 2);
    const casco = new THREE.ExtrudeGeometry(s, {depth: 1.0, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 2, curveSegments: 10});
    casco.rotateX(-PI / 2); casco.translate(0, -0.55, 0);
    const branco = comGeada(new THREE.MeshStandardMaterial({color: '#f4f4f1', roughness: 0.35}), U, 'aca_casco');
    const esteira = new THREE.ShaderMaterial({vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: ESTEIRA_FS, transparent: true, depthWrite: false, uniforms: {uT: {value: 0}, uLuz: {value: 1}, uForca: {value: 1}}});
    const geoEst = new THREE.PlaneGeometry(26, 60).rotateX(-PI / 2).translate(0, 0.06, 0);
    // parasail: copa em domo listrada + pessoa + cabos
    const copa = new THREE.SphereGeometry(6, 24, 6, 0, PI * 2, 0, PI * 0.33); copa.scale(1.5, 0.75, 1.0);
    const cc = new Float32Array(copa.attributes.position.count * 3), cs = [[0.95, 0.15, 0.1], [1, 0.8, 0.1], [0.1, 0.45, 0.95], [1, 1, 1]];
    for (let i = 0; i < copa.attributes.position.count; i++) { const a = Math.atan2(copa.attributes.position.getZ(i), copa.attributes.position.getX(i)); const k = Math.floor(((a + PI) / (PI * 2)) * 12) % 4; const c = new THREE.Color().setRGB(cs[k][0], cs[k][1], cs[k][2], THREE.SRGBColorSpace); cc.set([c.r, c.g, c.b], i * 3); }
    copa.setAttribute('color', new THREE.BufferAttribute(cc, 3));
    const matCopa = new THREE.MeshStandardMaterial({vertexColors: true, side: THREE.DoubleSide, roughness: 0.7});
    const cabos = new THREE.BufferGeometry(); cabos.setAttribute('position', new THREE.BufferAttribute(new Float32Array(5 * 2 * 3), 3));
    return {casco, branco, esteira, geoEst, copa, matCopa, cabos};
  }, [U]);
  r.esteira.uniforms.uT.value = t; r.esteira.uniforms.uLuz.value = 0.15 + 0.85 * l.dia;
  const g = geloEm(t);
  return <>{LANCHAS.map((L, i) => {
    if (t >= NOITE && L.pts.length > 1) return null;
    const p = posLancha(L, t), yaw = Math.atan2(-p.hz, p.hx);
    const dW = -sdTerra(p.x, p.z), preso = t >= NOITE ? smooth(-3, 3, 13.3 + g * 95 - dW) : 0;
    const bal = 1 - preso, plan = Math.min(1, p.v / 12);
    const y = (0.06 * Math.sin(t * 1.7 + i) + 0.12 * plan) * bal + 0.05 * preso;
    const pitch = (0.035 * Math.sin(t * 1.1 + i * 2) + 0.07 * plan) * bal, roll = 0.045 * Math.sin(t * 1.3 + i * 3) * bal;
    let para: React.ReactNode = null;
    if (L.para) {
      const cx = p.x - p.hx * 58, cz = p.z - p.hz * 58, cy = 36 + 1.5 * Math.sin(t * 0.7);
      const pos = r.cabos.attributes.position as THREE.BufferAttribute;
      const pes = [cx, cy - 7.5, cz];
      pos.setXYZ(0, p.x - p.hx * 3, 1.2, p.z - p.hz * 3); pos.setXYZ(1, pes[0], pes[1], pes[2]);
      const lat = [-p.hz, p.hx];
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b], k) => { pos.setXYZ(2 + k * 2, pes[0], pes[1] + 0.8, pes[2]); pos.setXYZ(3 + k * 2, cx + lat[0] * a * 7.5 + p.hx * b * 2.5, cy - 1.2, cz + lat[1] * a * 7.5 + p.hz * b * 2.5); });
      pos.needsUpdate = true;
      para = <>
        <mesh geometry={r.copa} material={r.matCopa} position={[cx, cy - 4.2, cz]} rotation={[0, yaw + PI / 2, -0.25]} />
        <mesh position={pes as V3}><capsuleGeometry args={[0.28, 0.9, 4, 8]} /><meshStandardMaterial color="#e8402f" /></mesh>
        <lineSegments geometry={r.cabos}><lineBasicMaterial color="#222" /></lineSegments>
      </>;
    }
    return (
      <group key={i}>
        <group position={[p.x, y, p.z]} rotation={[roll, yaw, pitch]}>
          <mesh geometry={r.casco} material={r.branco} castShadow />
          <mesh position={[-0.4, 0.62, 0]}><boxGeometry args={[6.2, 0.12, 2.5]} /><meshStandardMaterial color={L.cor} roughness={0.4} /></mesh>
          <mesh position={[0.4, 1.0, 0]}><boxGeometry args={[1.0, 0.8, 1.0]} /><meshStandardMaterial color="#e8e8e4" roughness={0.4} /></mesh>
          <mesh position={[0.95, 1.35, 0]} rotation-z={0.5}><boxGeometry args={[0.05, 0.5, 1.2]} /><meshStandardMaterial color="#223040" roughness={0.05} metalness={0.6} /></mesh>
          <mesh position={[-0.6, 2.05, 0]}><boxGeometry args={[2.0, 0.06, 2.1]} /><meshStandardMaterial color={L.cor} roughness={0.6} /></mesh>
          {[[-1.5, -0.95], [-1.5, 0.95], [0.3, -0.95], [0.3, 0.95]].map(([dx, dz], k) => <mesh key={k} position={[dx, 1.35, dz]}><cylinderGeometry args={[0.025, 0.025, 1.4, 5]} /><meshStandardMaterial color="#bbb" metalness={0.6} roughness={0.3} /></mesh>)}
          <mesh position={[-3.65, 0.35, 0]}><boxGeometry args={[0.5, 0.9, 0.6]} /><meshStandardMaterial color="#1b1b1b" roughness={0.4} /></mesh>
        </group>
        {p.v > 1 && <mesh geometry={r.geoEst} material={r.esteira} position={[p.x - p.hx * 30, 0, p.z - p.hz * 30]} rotation-y={Math.atan2(p.hx, p.hz)} renderOrder={2} />}
        {para}
      </group>
    );
  })}</>;
};

// ================================================================ pelicanos (bando em V cruzando a praia, 181-190)
const Pelicanos: React.FC<{t: number}> = ({t}) => {
  if (t < 180.5 || t > 191 || t >= NOITE) return null;
  const u = (t - 181) / 9, bx = -40 + 135 * u, bz = -30 + 10 * u, by = 13 + 2 * u;
  return <>{Array.from({length: 7}, (_, k) => {
    const fila = Math.ceil(k / 2), lado = k === 0 ? 0 : k % 2 ? 1 : -1;
    const x = bx - fila * 2.6, z = bz + lado * fila * 2.2, y = by - fila * 0.15 + 0.3 * Math.sin(t * 0.9 + k);
    const bate = Math.sin(t * 2 * PI * 1.4 + k * 0.9), plana = smooth(0.2, 0.6, Math.sin(t * 0.8 + k * 0.5) * 0.5 + 0.5);
    const asa = (0.45 * bate) * (1 - plana) + 0.05;
    return (
      <group key={k} position={[x, y, z]} rotation-y={Math.atan2(-10, 135)}>
        <mesh scale={[1.15, 0.28, 0.3]}><sphereGeometry args={[0.5, 10, 6]} /><meshStandardMaterial color="#6d6458" roughness={0.9} /></mesh>
        <mesh position={[0.62, 0.08, 0]} scale={[0.45, 0.08, 0.09]}><boxGeometry /><meshStandardMaterial color="#c9a25c" roughness={0.8} /></mesh>
        {[1, -1].map((s) => (
          <group key={s} rotation-x={s * asa}>
            <mesh position={[0, 0, s * 1.05]} scale={[0.42, 0.03, 2.1]}><boxGeometry /><meshStandardMaterial color="#544c42" roughness={0.9} /></mesh>
          </group>
        ))}
      </group>
    );
  })}</>;
};

// ================================================================ "humo de mar" (o ar gelado sobre a agua ainda morna), 197-212
const FUMACA: Emissor[] = Array.from({length: 18}, (_, k) => ({x: -80 + k * 12 + rnd(k * 3.3) * 6, y: 0.5, z: -72 - rnd(k * 5.1) * 70, s: 13 + rnd(k * 7.7) * 7,
  t0: 196.5 + rnd(k * 1.9) * 2.5, t1: 208.5 + rnd(k * 2.3) * 3.5}));

// ================================================================ mundo
// nevoa na cor do horizonte do ceu; a cor muda devagar e o Look arredonda o perfil a 2 algarismos: amostrada em degraus de 4 s
// (cada troca recompila a cadeia do Look; a tarde parada e a noite mudam pouco, entao quase nao ha troca)
const corNevoa = (t: number) => { const ta = Math.floor(t / 4) * 4 + 2, c = corHorizonte(Math.max(t < NOITE ? 160 : NOITE + 0.1, ta), 'acapulco'); return '#' + c.getHexString(); };
export const perfilAcapulco = (t: number): Perfil => t < NOITE
  ? {bloom: 0.32, limiar: 0.95, saturacao: 0.02, contraste: 0.06, vinheta: 0.34, nevoa: {cor: corNevoa(t), densidade: 0.00042, max: 0.62}, raios: 0.18}
  : {bloom: 0.85, limiar: 0.72, saturacao: -0.04, contraste: 0.08, vinheta: 0.48, nevoa: {cor: corNevoa(t), densidade: 0.0006, max: 0.55}};

export const Acapulco: React.FC<{t: number}> = ({t}) => {
  const {camera, gl} = useThree();
  const noite = t >= NOITE;
  // camera (pan continuo para a direita, como no mapa)
  const c = camEm(noite ? CAM_NOITE : CAM_DIA, t);
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...c.pos); cam.lookAt(...c.alvo); cam.near = 0.4; cam.far = 40000; cam.fov = c.fov; cam.updateProjectionMatrix();
  const l = luzEm(t, 'acapulco');
  // uniformes compartilhados (geada, cintilacao, noite, apagao)
  const U = useMemo<U_>(() => ({uGeada: {value: 0}, uTg: {value: 0}, uNoite: {value: 0}, uApaga: {value: 0}}), []);
  U.uGeada.value = noite ? geadaEm(t) : 0; U.uTg.value = t; U.uNoite.value = noite ? 1 : 0; U.uApaga.value = noite ? apagaEm(t) : 0;
  // a luz de ambiente (IBL) e o reflexo do PBR vem do proprio ceu (CeuLugar com env, padrao)
  const px = gl.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan((cam.fov * Math.PI) / 360));
  const geada = noite ? geadaEm(t) : 0;
  return (
    <>
      <CeuLugar t={t} lugar="acapulco" sombra={72} />
      <Terreno U={U} />
      <Areia U={U} />
      <Agua t={t} l={l} />
      <Calcadao U={U} t={t} />
      {noite && <LuzesPostes t={t} />}
      <Pier U={U} t={t} px={px} />
      <Roda U={U} t={t} px={px} />
      <Hoteis U={U} />
      <Casas t={t} px={px} l={l} />
      <Praia U={U} t={t} />
      <Palmeiras lista={PALMEIRAS} t={t} vento={ventoEm(t)} geada={geada} sol={noite ? undefined : l.sol} corSol={l.corSol} ventoDir={[1, 0.4]} />
      <Pessoas t={t} />
      <Carrinho t={t} />
      <Carros t={t} />
      <Lanchas U={U} t={t} l={l} />
      <Pelicanos t={t} />
      {noite && t > 196 && <Flipbook atlas={ATLAS.fiapo} emissores={FUMACA} t={t} porEmissor={3} vida={7} sobe={0.55} cresce={1.3} cor="#9fb4cc" forca={0.3} fumaca luz={0.55} espalha={0.6} />}
    </>
  );
};
