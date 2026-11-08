// Escrita a lápis (K16, 04/11): texto que se escreve letra a letra sobre um documento, com a ponta de um lápis 3D que
// acompanha, sublinhado/riscado que se desenham. Tudo função de t (determinístico).
// Fonte: Herr Von Muellerhoff (Sudtipos, SIL OFL 1.1, Google Fonts; caligrafia alemã do séc. XIX), embutida (fonte/*.bin).
// "→" não existe na fonte: vira uma seta traçada à mão (mesmo traço do sublinhado).
//
//   import {buildLapis} from './lapis.js';
//   const lp = buildLapis(scene, {fonte: fonteB64, fundos: {elbe: corB64}});   await lp.pronto;
//   no render (t = tempo LOCAL do take): const cam = lp.set(t, estado);  stage.frame(cam, 'epoca', cam.tgt, {ao: false, ...});
//   fora do take: lp.set(t, null)
// estado = {
//   fundo: 'papel' | 'diario' | <id de fundos>  (imagem: carta náutica etc.; recorte: [u0,v0,u1,v1] da imagem que vira a folha)
//   linhas:    [{texto, inicio_s, dur_s, x?, y?, tam?}]   x,y em 0..1 da folha (y = linha de base); tam = px da fonte (folha 2048 px)
//   sublinhar: [{linha, de, ate, inicio_s, dur_s?}]       de/ate = índices de caractere no texto da linha (ate exclusivo)
//   riscar:    [{linha, de, ate, inicio_s, dur_s?}]
//   foco?: [u0,v0,u1,v1] da folha para a câmera (padrão: a caixa do texto), dur? (s, dolly), grao?, vinheta?, sat?
// }
import * as THREE from 'three';
import {GLSL_COR, ligarACES} from './epoca.js';

export const ORIGEM_LAPIS = new THREE.Vector3(0, 3000, 0);
const PW = 16, PH = 10, CW = 2048, CH = 1280, EXT = 1.35;   // folha em unidades de cena e em px do canvas da grafite
const KEY = new THREE.Vector3(0.25, 1.0, 0.35).normalize();   // mesma luz-chave do stage.js (sombra falsa do lápis)
const REGUA = {ini: 0.3, passo: 0.1, margem: 0.12};          // pauta do diário (fração da altura da folha)
const EIXO = new THREE.Vector3(0.55, 0.72, 0.42).normalize(); // lápis de destro: sai da ponta para a direita, para cima e para a câmera
const COMP = 14.0;                                             // comprimento visível do lápis (unidades)

const VERT = /* glsl */ `varying vec2 vUv; varying vec4 vClip; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); vClip = gl_Position; }`;
const FRAG = /* glsl */ `uniform sampler2D uFundo; uniform sampler2D uTinta; uniform float uModo; uniform vec4 uRec;
  uniform vec3 uPonta; uniform vec2 uSomb; uniform float uGrao; uniform float uVin; uniform float uT; uniform float uSat;
  uniform vec3 uRegua; varying vec2 vUv; varying vec4 vClip;
  ${GLSL_COR}
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * n2(p); p = p * 2.03 + 1.7; a *= 0.5; } return s; }
  float segDist(vec2 p, vec2 a, vec2 b, out float h){ vec2 pa = p - a, ba = b - a; h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
  void main(){
    vec2 uv = (vUv - 0.5) * ${EXT.toFixed(2)} + 0.5;   // a malha é maior que a folha: a borda nunca entra no quadro
    vec3 c;
    if (uModo > 1.5) {
      c = texture2D(uFundo, vec2(mix(uRec.x, uRec.z, uv.x), mix(uRec.w, uRec.y, uv.y))).rgb;   // carta/imagem (sRGB cru)
    } else {
      // papel de trapo envelhecido: base creme, manchas largas, fibras, pontos de foxing, bordas mais escuras
      c = vec3(0.90, 0.865, 0.78);
      c *= 0.94 + 0.08 * fbm(uv * vec2(6.0, 4.0));
      c *= 0.97 + 0.04 * fbm(uv * vec2(90.0, 260.0));
      float fox = smoothstep(0.78, 0.86, fbm(uv * 14.0 + 3.1));
      c = mix(c, c * vec3(0.86, 0.76, 0.62), fox * 0.5);
      float bd = min(min(uv.x, 1.0 - uv.x) * 1.6, min(uv.y, 1.0 - uv.y)) + 0.1;
      c *= mix(0.8, 1.0, smoothstep(0.0, 0.12, bd + 0.03 * fbm(uv * 20.0)));
      if (uModo > 0.5) {   // pauta do diário de bordo: linhas azul-acinzentadas desbotadas e margem vermelha
        float y = 1.0 - uv.y;
        float k = (y - uRegua.x) / uRegua.y;
        float dl = abs(fract(k + 0.5) - 0.5) * uRegua.y;
        float lin = (k > -0.5) ? 1.0 - smoothstep(0.0006, 0.0016, dl) : 0.0;
        c = mix(c, vec3(0.55, 0.62, 0.7), lin * 0.45 * (0.8 + 0.2 * n2(uv * 300.0)));
        float mg = 1.0 - smoothstep(0.0, 0.0018, abs(uv.x - uRegua.z));
        c = mix(c, vec3(0.72, 0.38, 0.33), mg * 0.55);
      }
    }
    // grafite: dente do papel quebra o traço (fixo na folha, não na tela)
    float tinta = texture2D(uTinta, uv).a;
    float dente = 0.62 + 0.38 * hash12(floor(uv * vec2(2600.0, 1625.0)));
    c = mix(c, vec3(0.2, 0.205, 0.22), clamp(tinta * 0.9 * dente, 0.0, 1.0));
    // sombra falsa do lápis: segmento do eixo projetado pela luz-chave, penumbra que abre com a altura
    vec2 p = vec2((uv.x - 0.5) * ${PW.toFixed(1)}, (0.5 - uv.y) * ${PH.toFixed(1)});
    if (uPonta.z >= 0.0) {
      vec2 a = uPonta.xy - vec2(0.25, 0.35) * uPonta.z;
      vec2 b = a + uSomb * ${COMP.toFixed(1)};
      float h; float d = segDist(p, a, b, h);
      float alt = uPonta.z + h * ${COMP.toFixed(1)} * ${EIXO.y.toFixed(3)};
      float larg = 0.22 + alt * 0.06;
      float s = (1.0 - smoothstep(larg * 0.4, larg * 1.6, d)) * (0.42 - 0.22 * clamp(alt / 6.0, 0.0, 1.0));
      c *= 1.0 - s;
    }
    vec2 scr = vClip.xy / vClip.w * 0.5 + 0.5;
    c = gradeEpoca(c, uSat, scr, uGrao, uVin, uT);
    gl_FragColor = vec4(desfazACES(srgb2lin(clamp(c, 0.0, 1.0))), 1.0);
  }`;

const b64bytes = (b64) => Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
const carregar = (src) => new Promise((ok, erro) => {
  const im = new Image();
  im.onload = () => ok(im);
  im.onerror = erro;
  im.src = `data:image/jpeg;base64,${src}`;
});
const cl = (x) => Math.min(1, Math.max(0, x));
const ss = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export function buildLapis(scene, {fonte, fundos = {}} = {}) {
  const grupo = new THREE.Group();
  grupo.position.copy(ORIGEM_LAPIS);
  grupo.visible = false;
  scene.add(grupo);
  const tinta = document.createElement('canvas');
  tinta.width = CW; tinta.height = CH;
  const tx = tinta.getContext('2d');
  const texTinta = new THREE.CanvasTexture(tinta);
  texTinta.colorSpace = THREE.NoColorSpace;
  texTinta.anisotropy = 8;
  const uniforms = {uFundo: {value: null}, uTinta: {value: texTinta}, uModo: {value: 0}, uRec: {value: new THREE.Vector4(0, 0, 1, 1)},
    uPonta: {value: new THREE.Vector3(0, 0, -1)}, uSomb: {value: new THREE.Vector2()}, uGrao: {value: 0.03}, uVin: {value: 0.28}, uT: {value: 0},
    uSat: {value: 0.85}, uRegua: {value: new THREE.Vector3(REGUA.ini, REGUA.passo, REGUA.margem)}, uACES: {value: 1}, uExpo: {value: 0.85}};
  const folha = new THREE.Mesh(new THREE.PlaneGeometry(PW * EXT, PH * EXT), new THREE.ShaderMaterial({vertexShader: VERT, fragmentShader: FRAG, uniforms, fog: false, toneMapped: false}));
  folha.rotation.x = -Math.PI / 2;
  folha.frustumCulled = false;
  ligarACES(folha, uniforms);
  grupo.add(folha);

  // o lápis: corpo sextavado laqueado verde-escuro, cone de madeira apontado, ponta de grafite; a ponta fica na origem do grupo
  const lapis = new THREE.Group();
  const R = 0.3;
  const grafite = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.012, 0.2, 20), new THREE.MeshStandardMaterial({color: '#2b2c30', roughness: 0.35, metalness: 0.4}));
  grafite.position.y = 0.1;
  const madeira = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.97, 0.07, 1.0, 24, 1, true), new THREE.MeshStandardMaterial({color: '#d2ad82', roughness: 0.85}));
  madeira.position.y = 0.2 + 0.5;
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(R, R, COMP, 6), new THREE.MeshStandardMaterial({color: '#203a2d', roughness: 0.42, metalness: 0.05, flatShading: true}));
  corpo.position.y = 1.2 + COMP / 2;
  lapis.add(grafite, madeira, corpo);
  const eixoQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), EIXO);
  grupo.add(lapis);
  uniforms.uSomb.value.set(EIXO.x - KEY.x / KEY.y * EIXO.y, EIXO.z - KEY.z / KEY.y * EIXO.y);   // direção da sombra no plano (x, z)

  const fundoTex = {};
  const pronto = (async () => {
    if (fonte) {
      const face = new FontFace('LapisHand', b64bytes(fonte));
      await face.load();
      document.fonts.add(face);
    }
    await Promise.all(Object.entries(fundos).map(async ([id, b64]) => {
      const im = await carregar(b64);
      const t = new THREE.Texture(im);
      t.colorSpace = THREE.NoColorSpace;
      t.anisotropy = 8;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.needsUpdate = true;
      fundoTex[id] = {t, asp: im.width / im.height};
    }));
  })();

  // ---- layout de uma linha: texto cacheado num canvas, posições x de cada caractere, setas desenhadas ----
  const layouts = new Map();
  const layout = (L, i, modo) => {
    const tam = L.tam ?? 150;
    const chave = `${L.texto}|${tam}`;
    let lay = layouts.get(chave);
    if (!lay) {
      const m = document.createElement('canvas').getContext('2d');
      m.font = `${tam}px LapisHand`;
      const partes = L.texto.split(/(→)/);
      const xs = [];   // x (a partir do início) de cada caractere
      let x = 0;
      const pecas = [];
      for (const p of partes) {
        if (!p) continue;
        if (p === '→') { xs.push(x); pecas.push({seta: true, x, w: tam * 0.62}); x += tam * 0.62; continue; }
        for (let k = 0; k < p.length; k++) xs.push(x + m.measureText(p.slice(0, k)).width);
        pecas.push({texto: p, x});
        x += m.measureText(p).width;
      }
      xs.push(x);
      const pad = Math.round(tam * 0.5), h = Math.round(tam * 1.7), base = Math.round(tam * 1.1);
      const cv = document.createElement('canvas');
      cv.width = Math.ceil(x + 2 * pad); cv.height = h;
      const c = cv.getContext('2d');
      c.font = `${tam}px LapisHand`;
      c.fillStyle = c.strokeStyle = '#000';
      c.lineJoin = c.lineCap = 'round';
      for (const p of pecas) {
        if (p.seta) {   // seta à mão: haste levemente curva e cabeça de dois traços
          const y = base - tam * 0.17, x0 = pad + p.x + tam * 0.1, x1 = pad + p.x + p.w - tam * 0.1;
          c.lineWidth = tam * 0.03;
          c.beginPath(); c.moveTo(x0, y + tam * 0.02); c.quadraticCurveTo((x0 + x1) / 2, y - tam * 0.03, x1, y); c.stroke();
          c.beginPath(); c.moveTo(x1 - tam * 0.16, y - tam * 0.1); c.lineTo(x1, y); c.lineTo(x1 - tam * 0.15, y + tam * 0.11); c.stroke();
        } else {
          c.fillText(p.texto, pad + p.x, base);
          c.lineWidth = tam * 0.016;   // engrossa o traço fino da caligrafia até a espessura de uma grafite
          c.strokeText(p.texto, pad + p.x, base);
        }
      }
      lay = {cv, xs, w: x, pad, h, base, tam};
      layouts.set(chave, lay);
    }
    const reg = modo === 'diario';
    const y = (L.y ?? (reg ? REGUA.ini + REGUA.passo * (i + 1) - 0.012 : 0.32 + 0.16 * i)) * CH;
    const x = (L.x ?? (reg ? REGUA.margem + 0.03 : 0.12)) * CW;
    return {...lay, x0: x, y0: y};   // (x0, y0) = início da linha de base no canvas
  };

  // um traço (sublinhado/risco/seta) como polilinha determinística com tremor de mão
  const traco = (a, b, y, semente) => {
    const pts = [];
    for (let k = 0; k <= 40; k++) {
      const u = k / 40;
      pts.push([a + (b - a) * u, y - (b - a) * 0.012 * u + Math.sin(u * 7 + semente * 5) * 2.2 + Math.sin(u * 23 + semente) * 0.9]);
    }
    return pts;
  };
  const noPonto = (pts, p) => {
    const f = cl(p) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), k = f - i;
    return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
  };

  const ponta = new THREE.Vector3();
  let assinatura = '';
  const set = (t, e) => {
    grupo.visible = !!e;
    if (!e) return null;
    const modo = e.fundo === 'papel' || e.fundo === 'diario' ? e.fundo : 'imagem';
    uniforms.uModo.value = modo === 'papel' ? 0 : modo === 'diario' ? 1 : 2;
    if (modo === 'imagem') {
      const f = fundoTex[e.fundo];
      if (!f) throw new Error(`lapis: fundo desconhecido ${e.fundo}`);
      uniforms.uFundo.value = f.t;
      // recorte da imagem que vira a folha (cobre a folha 16:10 sem deformar)
      let [u0, v0, u1, v1] = e.recorte || [0, 0, 1, 1];
      const asp = ((u1 - u0) * f.asp) / (v1 - v0), alvo = PW / PH;
      if (asp > alvo) { const d = (u1 - u0) * (1 - alvo / asp) / 2; u0 += d; u1 -= d; } else { const d = (v1 - v0) * (1 - asp / alvo) / 2; v0 += d; v1 -= d; }
      uniforms.uRec.value.set(u0, 1 - v0, u1, 1 - v1);   // em uv da textura (flipY): y de baixo para cima
    }
    uniforms.uGrao.value = e.grao ?? 0.03;
    uniforms.uVin.value = e.vinheta ?? 0.28;
    uniforms.uSat.value = e.sat ?? 0.85;
    uniforms.uT.value = t;

    // traços em ordem de tempo: cada um sabe onde está a ponta em p (0..1)
    const linhas = (e.linhas || []).map((L, i) => ({L, ...layout(L, i, modo)}));
    const tracos = [];
    for (const li of linhas) {
      const {L, w, x0, y0, tam} = li;
      tracos.push({t0: L.inicio_s, t1: L.inicio_s + L.dur_s, desenha: (p) => {
        const rw = li.pad + p * w;
        tx.drawImage(li.cv, 0, 0, rw, li.h, x0 - li.pad, y0 - li.base, rw, li.h);
        if (p < 1) { tx.globalAlpha = 0.45; tx.drawImage(li.cv, rw, 0, tam * 0.05, li.h, x0 - li.pad + rw, y0 - li.base, tam * 0.05, li.h); tx.globalAlpha = 1; }
      }, onde: (p) => {
        const x = x0 + p * w;   // a ponta sobe e desce no corpo das letras enquanto avança
        return [x + Math.sin(p * w * 0.05) * tam * 0.04, y0 - tam * (0.1 + 0.12 * (0.5 + 0.5 * Math.sin(p * w * 0.11)))];
      }});
    }
    const marca = (lista, desl, esp) => (lista || []).forEach((s, j) => {
      const li = linhas[s.linha];
      if (!li) return;
      const a = li.x0 + li.xs[Math.max(0, s.de ?? 0)] - li.tam * 0.06, b = li.x0 + li.xs[Math.min(li.xs.length - 1, s.ate ?? li.xs.length - 1)] + li.tam * 0.06;
      const pts = traco(a, b, li.y0 + li.tam * desl, j + desl * 10);
      const dur = s.dur_s ?? Math.max(0.35, (b - a) / 1400);
      tracos.push({t0: s.inicio_s, t1: s.inicio_s + dur, desenha: (p) => {
        tx.lineWidth = li.tam * esp;
        tx.lineCap = tx.lineJoin = 'round';
        tx.strokeStyle = '#000';
        tx.beginPath();
        const n = Math.max(1, Math.round(p * (pts.length - 1)));
        tx.moveTo(...pts[0]);
        for (let k = 1; k <= n; k++) tx.lineTo(...(k === n ? noPonto(pts, p) : pts[k]));
        tx.stroke();
      }, onde: (p) => noPonto(pts, p)});
    });
    marca(e.sublinhar, 0.2, 0.03);
    marca(e.riscar, -0.17, 0.028);
    tracos.sort((a, b) => a.t0 - b.t0);

    // grafite: redesenha só quando muda (o canvas sobe para a GPU a cada mudança)
    const ps = tracos.map((k) => cl((t - k.t0) / (k.t1 - k.t0)));
    const sig = `${e.fundo}|${ps.map((p) => p.toFixed(4)).join(',')}|${linhas.length}`;
    if (sig !== assinatura) {
      assinatura = sig;
      tx.clearRect(0, 0, CW, CH);
      tracos.forEach((k, i) => { if (ps[i] > 0) k.desenha(ps[i]); });
      texTinta.needsUpdate = true;
    }

    // onde está a ponta: escrevendo (no traço), viajando entre traços (arco no ar), chegando ou saindo de cena
    let px, py, alt = 0;
    const ativo = tracos.findIndex((k) => t >= k.t0 && t <= k.t1);
    if (ativo >= 0) [px, py] = tracos[ativo].onde(ps[ativo]);
    else {
      const prox = tracos.findIndex((k) => k.t0 > t);
      const ant = prox < 0 ? tracos.length - 1 : prox - 1;
      const fora = [CW * 1.15, CH * 1.1], ALT_FORA = 3.5;
      const de = ant >= 0 ? [...tracos[ant].onde(1), 0] : [...fora, ALT_FORA];
      if (prox >= 0) {
        const ate = tracos[prox].onde(0);
        const ta = ant >= 0 ? tracos[ant].t1 : tracos[prox].t0 - 0.9;
        const k = ss((t - ta) / Math.max(0.05, tracos[prox].t0 - ta));
        px = de[0] + (ate[0] - de[0]) * k; py = de[1] + (ate[1] - de[1]) * k;
        alt = de[2] * (1 - k) + Math.sin(Math.PI * k) * Math.min(1.0, 0.25 + Math.hypot(ate[0] - de[0], ate[1] - de[1]) / 900);
      } else if (ant >= 0) {   // terminou: levanta e se afasta um pouco
        const k = ss((t - tracos[ant].t1) / 0.8);
        px = de[0] + k * 90; py = de[1] + k * 40; alt = k * 1.2;
      } else { [px, py] = fora; alt = ALT_FORA; }
    }
    const wx = (px / CW - 0.5) * PW, wz = (py / CH - 0.5) * PH;
    lapis.position.set(wx, alt, wz);
    lapis.quaternion.copy(eixoQ);
    lapis.rotateY(Math.sin(t * 2.1) * 0.05);   // a mão gira o lápis de leve
    uniforms.uPonta.value.set(wx, wz, alt);
    ponta.set(wx, alt, wz).add(ORIGEM_LAPIS);

    // câmera: enquadra a caixa do texto (ou foco), inclinada ~24°, dolly lento, puxada de leve para a ponta
    let bx0, by0, bx1, by1;
    if (e.foco) [bx0, by0, bx1, by1] = [e.foco[0] * CW, e.foco[1] * CH, e.foco[2] * CW, e.foco[3] * CH];
    else {
      bx0 = Math.min(...linhas.map((l) => l.x0)) - 120; bx1 = Math.max(...linhas.map((l) => l.x0 + l.w)) + 120;
      by0 = Math.min(...linhas.map((l) => l.y0 - l.tam)) - 90; by1 = Math.max(...linhas.map((l) => l.y0 + l.tam * 0.45)) + 90;
    }
    let w = (bx1 - bx0) / CW * PW, h = (by1 - by0) / CH * PH;
    if (w / h > 16 / 9) h = w * 9 / 16;
    const fov = e.fov ?? 30, dur = e.dur ?? 6, s = cl(t / dur);
    const cx = ((bx0 + bx1) / 2 / CW - 0.5) * PW, cz = ((by0 + by1) / 2 / CH - 0.5) * PH;
    const tgt = new THREE.Vector3(cx + (s - 0.5) * w * 0.06, 0, cz).add(ORIGEM_LAPIS);   // sem seguir a ponta (saltos de linha davam borrão)
    const dist = (h / 2) / Math.tan((fov * Math.PI) / 360) * 1.08 * (1.04 - 0.08 * s);
    const tilt = (24 - 4 * s) * Math.PI / 180, giro = (s - 0.5) * 0.06;
    const pos = [tgt.x + Math.sin(giro) * Math.sin(tilt) * dist, tgt.y + Math.cos(tilt) * dist, tgt.z + Math.cos(giro) * Math.sin(tilt) * dist];
    return {pos, tgt: tgt.toArray(), fov, near: dist * 0.1, far: dist * 6, ponta: ponta.toArray()};
  };
  return {pronto, set, grupo};
}
