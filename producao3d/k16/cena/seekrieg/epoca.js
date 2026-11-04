// Época 2.5D (K16, 04/11): pintura/foto de época com paralaxe pela profundidade (Depth Anything V2 Small, Apache-2.0,
// em lote na G4: cena/prof_lote.py -> assets/epoca/prof/<nome>_prof8.png + <nome>_2k.jpg).
// Plano subdividido 512 x N deslocado em z pelo mapa; o deslocamento cai a 0 nas bordas (a malha não rasga) e o quadro fica
// sempre dentro de 90% da imagem. A câmera orbita devagar em volta do ponto de foco (a paralaxe nasce daí) e se aproxima até
// o retângulo `foco`. Cor: dessatura de leve, pretos levantados, brancos contidos, tom frio da paleta. Sem moldura, sem cartão.
//
//   import {buildEpoca} from './epoca.js';
//   const ep = buildEpoca(scene, {stoewer: {cor: corB64, prof: profB64}});   // cor = <nome>_2k.jpg importado como .bin
//   await ep.pronto;
//   no render (t = tempo LOCAL do take): const cam = ep.set(t, {imagem: 'stoewer', foco: [u0, v0, u1, v1], zoom, paralaxe, dur});
//   stage.frame(cam, 'epoca', cam.tgt, {ao: false, t, ...subquadro});   // 'epoca' = clima neutro registrado aqui; sem AO
//   fora do take: ep.set(t, null)  (esconde)
// estado: imagem (id); foco [u0,v0,u1,v1] em 0..1 da imagem, v de cima para baixo; zoom 0..1 (0 = imagem inteira, 1 = foco;
//   omitido = acompanha o take); paralaxe 0..1 (amplitude do relevo e da órbita, padrão 0.7); dur (s, padrão 6);
//   grao (padrão 0.03), vinheta (padrão 0.28); lado (+1/-1: para que lado a câmera orbita).
import * as THREE from 'three';
import {CLIMA} from './stage.js';

// clima neutro para os takes de época/lápis: sem névoa, sem céu visível, correção de cor feita no próprio material
CLIMA.epoca ??= {fundoInt: 0, envInt: 0.8, rim: 0, grade: [1, 1, [1, 1, 1]], top: '#121518', hor: '#121518', bot: '#121518', streak: 0, fog: 0};

const ALTURA = 10;   // altura do plano em unidades de cena
export const ORIGEM_EPOCA = new THREE.Vector3(0, 2000, 0);   // longe do navio/mar (que ficam na origem)

// O OutputPass aplica ACES na cena inteira; a imagem de época precisa sair com os valores dela. O material desfaz o ACES
// do three (mesmas matrizes e o mesmo ajuste RRT+ODT) quando o renderer estiver em ACES; em NoToneMapping não faz nada.
export const GLSL_COR = /* glsl */ `
  uniform float uACES; uniform float uExpo;
  vec3 srgb2lin(vec3 c){ return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
  vec3 invRRT(vec3 x){
    const float a = 0.0245786, b = 0.000090537, c = 0.983729, d = 0.4329510, e = 0.238081;
    vec3 A = 1.0 - x * c, B = a - x * d, C = -(b + x * e);
    return (-B + sqrt(max(B * B - 4.0 * A * C, 0.0))) / (2.0 * A);
  }
  vec3 desfazACES(vec3 lin){
    if (uACES < 0.5) return lin;
    const mat3 IN = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
    const mat3 OUT = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
    vec3 v = clamp(inverse(OUT) * clamp(lin, 0.0, 0.985), 0.0, 1.0);
    v = inverse(IN) * invRRT(v);
    return max(v, 0.0) * 0.6 / uExpo;
  }
  float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  // paleta do vídeo: dessatura, tom frio leve, pretos em ~3,5% e brancos em ~93% (nada estourado), grão e vinheta na tela
  vec3 gradeEpoca(vec3 c, float sat, vec2 scr, float grao, float vin, float t){
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(l), c, sat) * vec3(0.975, 0.99, 1.02);
    c = 0.035 + c * (0.93 - 0.035);
    c *= 1.0 - vin * smoothstep(0.45, 1.05, length((scr - 0.5) * vec2(1.25, 1.0)) * 1.3);
    c += (hash12(scr * vec2(1600.0, 900.0) + fract(t * 7.13) * 97.0) - 0.5) * grao;
    return c;
  }`;

export function ligarACES(mesh, uniforms) {
  mesh.onBeforeRender = (renderer) => {
    uniforms.uACES.value = renderer.toneMapping === THREE.ACESFilmicToneMapping ? 1 : 0;
    uniforms.uExpo.value = renderer.toneMappingExposure;
  };
}

const VERT = /* glsl */ `uniform sampler2D uProf; uniform float uAmp; uniform float uRef; varying vec2 vUv; varying vec4 vClip;
  void main(){
    vUv = uv;
    float d = textureLod(uProf, uv, 2.0).r;   // mip 2: rampas suaves nas quinas de profundidade (menos rasgo)
    float borda = smoothstep(0.0, 0.07, uv.x) * smoothstep(1.0, 0.93, uv.x) * smoothstep(0.0, 0.07, uv.y) * smoothstep(1.0, 0.93, uv.y);
    vec3 p = position; p.z += (d - uRef) * uAmp * borda;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); vClip = gl_Position;
  }`;
const FRAG = /* glsl */ `uniform sampler2D uCor; uniform float uGrao; uniform float uVin; uniform float uT; uniform float uSat; varying vec2 vUv; varying vec4 vClip;
  ${GLSL_COR}
  void main(){
    vec3 c = texture2D(uCor, vUv).rgb;   // valores sRGB crus (textura sem conversão)
    vec2 scr = vClip.xy / vClip.w * 0.5 + 0.5;
    c = gradeEpoca(c, uSat, scr, uGrao, uVin, uT);
    gl_FragColor = vec4(desfazACES(srgb2lin(clamp(c, 0.0, 1.0))), 1.0);
  }`;

const carregar = (src, mime) => new Promise((ok, erro) => {
  const im = new Image();
  im.onload = () => ok(im);
  im.onerror = erro;
  im.src = src.startsWith('data:') || src.startsWith('url:') ? src.replace(/^url:/, '') : `data:${mime};base64,${src}`;
});
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

export function buildEpoca(scene, imagens = {}) {
  const grupo = new THREE.Group();
  grupo.position.copy(ORIGEM_EPOCA);
  grupo.visible = false;
  scene.add(grupo);
  const uniforms = {uCor: {value: null}, uProf: {value: null}, uAmp: {value: 0}, uRef: {value: 0.5}, uGrao: {value: 0.03}, uVin: {value: 0.28},
    uT: {value: 0}, uSat: {value: 0.8}, uACES: {value: 1}, uExpo: {value: 0.85}};
  const mat = new THREE.ShaderMaterial({vertexShader: VERT, fragmentShader: FRAG, uniforms, fog: false, toneMapped: false});
  const malhas = {};   // geometria por proporção da imagem
  const reg = {};
  const pronto = Promise.all(Object.entries(imagens).map(async ([id, {cor, prof}]) => {
    const [ic, ip] = await Promise.all([carregar(cor, 'image/jpeg'), carregar(prof, 'image/png')]);
    const tc = new THREE.Texture(ic);
    tc.colorSpace = THREE.NoColorSpace;
    tc.anisotropy = 8;
    tc.generateMipmaps = true;
    tc.minFilter = THREE.LinearMipmapLinearFilter;
    tc.needsUpdate = true;
    const tp = new THREE.Texture(ip);
    tp.colorSpace = THREE.NoColorSpace;
    tp.generateMipmaps = true;
    tp.minFilter = THREE.LinearMipmapLinearFilter;
    tp.needsUpdate = true;
    // a profundidade também na CPU: o ponto de foco fica parado (a órbita gira em volta dele)
    const cv = document.createElement('canvas');
    cv.width = ip.width; cv.height = ip.height;
    const cx = cv.getContext('2d', {willReadFrequently: true});
    cx.drawImage(ip, 0, 0);
    const px = cx.getImageData(0, 0, ip.width, ip.height).data;
    const profAt = (u, v) => px[(Math.min(ip.height - 1, Math.max(0, Math.round(v * (ip.height - 1)))) * ip.width + Math.min(ip.width - 1, Math.max(0, Math.round(u * (ip.width - 1))))) * 4] / 255;
    const asp = ic.width / ic.height;
    const ch = asp.toFixed(3);
    if (!malhas[ch]) {
      const nx = 512, ny = Math.max(256, Math.round(512 / asp));
      const m = new THREE.Mesh(new THREE.PlaneGeometry(ALTURA * asp, ALTURA, nx, ny), mat);
      m.frustumCulled = false;
      ligarACES(m, uniforms);
      grupo.add(m);
      malhas[ch] = m;
    }
    reg[id] = {tc, tp, asp, prof: profAt, malha: malhas[ch]};
  }));

  const W = new THREE.Vector3();
  // retângulo 16:9 dentro da imagem (u,v em 0..1) -> centro e altura em unidades de cena
  const ret169 = (r, asp, [u0, v0, u1, v1]) => {
    let w = (u1 - u0) * asp * ALTURA, h = (v1 - v0) * ALTURA;
    if (w / h > 16 / 9) h = w * 9 / 16; else w = h * 16 / 9;
    const W0 = asp * ALTURA * 0.9, H0 = ALTURA * 0.9;   // nunca sair dos 90% centrais
    const k = Math.min(1, W0 / w, H0 / h);
    w *= k; h *= k;
    let cx = ((u0 + u1) / 2 - 0.5) * asp * ALTURA, cy = (0.5 - (v0 + v1) / 2) * ALTURA;
    cx = Math.max(-(W0 - w) / 2, Math.min((W0 - w) / 2, cx));
    cy = Math.max(-(H0 - h) / 2, Math.min((H0 - h) / 2, cy));
    return {cx, cy, h};
  };

  const set = (t, e) => {
    grupo.visible = !!e;
    if (!e) return null;
    const r = reg[e.imagem];
    if (!r) throw new Error(`epoca: imagem desconhecida ${e.imagem}`);
    for (const m of Object.values(malhas)) m.visible = m === r.malha;
    uniforms.uCor.value = r.tc;
    uniforms.uProf.value = r.tp;
    const dur = e.dur ?? 6, s = Math.min(1, Math.max(0, t / dur));
    const par = e.paralaxe ?? 0.7, fov = e.fov ?? 30, lado = e.lado ?? 1;
    const z = e.zoom ?? ease(s);
    const A = ret169(r, r.asp, [0, 0, 1, 1]);
    const B = e.foco ? ret169(r, r.asp, e.foco) : A;
    // zoom em escala logarítmica (velocidade de aproximação constante); o centro anda junto
    const h = Math.exp(Math.log(A.h) + (Math.log(B.h) - Math.log(A.h)) * z);
    const kz = A.h === B.h ? 0 : (A.h - h) / (A.h - B.h);
    const cx = A.cx + (B.cx - A.cx) * kz, cy = A.cy + (B.cy - A.cy) * kz;
    // relevo proporcional ao que está no quadro: no close a paralaxe continua visível sem esticar a malha no plano geral
    const amp = 0.12 * ALTURA * par * Math.pow(h / ALTURA, 0.5);
    const u = cx / (r.asp * ALTURA) + 0.5, v = 0.5 - cy / ALTURA;
    const ref = r.prof(u, v);
    uniforms.uAmp.value = amp;
    uniforms.uRef.value = ref;   // o ponto de foco fica no plano z=0: a câmera gira em volta dele
    uniforms.uGrao.value = e.grao ?? 0.02;
    uniforms.uVin.value = e.vinheta ?? 0.28;
    uniforms.uSat.value = e.sat ?? 0.8;
    uniforms.uT.value = t;
    const dist = (h / 2) / Math.tan((fov * Math.PI) / 360) * (1.0 - 0.08 * s);   // dolly leve, sempre andando
    const ang = lado * par * 0.22 * (s - 0.5), angY = par * 0.05 * (s - 0.5);    // órbita lenta (rad)
    const tgt = W.set(cx, cy, 0).add(ORIGEM_EPOCA).toArray();
    const pos = [tgt[0] + Math.sin(ang) * dist, tgt[1] + Math.sin(angY) * dist, tgt[2] + Math.cos(ang) * Math.cos(angY) * dist];
    return {pos, tgt, fov, near: dist * 0.2, far: dist * 4};
  };
  return {pronto, set, grupo};
}
