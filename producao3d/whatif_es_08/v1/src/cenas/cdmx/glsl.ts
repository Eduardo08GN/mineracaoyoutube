// GLSL das cidades: relevo + agua num so shader (linguagem da agua do Continente: cor por profundidade, espuma na borda,
// ondas atras da frente) e predios/casas com linha d'agua (escurece o molhado, espuma onde a agua toca a parede).
// Cada cidade injeta a sua funcao `estado(uv)` -> (altitude do chao, superficie da agua, idade da agua em s, 0).
import {GLSL_LUZ} from './comum';

export const GLSL_BASE = /* glsl */ `
uniform sampler2D uDem, uNiv, uAgua; uniform vec4 uX; uniform vec2 uTexel, uPx; uniform float uBase, uL, uT, uExag, uRef;
float vy(float alt) { return (alt - uRef) * uExag + uRef - uBase; }   // altitude -> y da cena (exagero vertical em torno de uRef)
vec2 uvDe(vec2 xz) { return vec2((xz.x - uX.x) / (uX.y - uX.x), (xz.y - uX.z) / (uX.w - uX.z)); }
float hsh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
${GLSL_LUZ}`;

// agua da cidade do Mexico: fora da bacia, o dado (nivel <= L); dentro, a frente que entra pelo passo norte e corre pelos lagos
// de 1519 (mapa de chegada T, Dijkstra na G4/PC) e depois se espalha pelo fundo do vale (distancia ao lago antigo)
export const ESTADO_CDMX = /* glsl */ `
uniform float uTent, uFk[6], uTk[6], uG0, uG1, uGmax;
float tChegA(float T) {
  for (int i = 1; i < 6; i++) if (T <= uFk[i]) return mix(uTk[i - 1], uTk[i], (T - uFk[i - 1]) / max(1e-3, uFk[i] - uFk[i - 1]));
  return 1e9;
}
vec4 estado(vec2 uv) {
  float dem = texture2D(uDem, uv).r + uBase, niv = texture2D(uNiv, uv).r + uBase;
  vec4 a = texture2D(uAgua, uv);
  float idade = -1.0, surf = uL;
  if (abs(niv - 2280.0) < 0.75 && a.r < 50000.0) {
    if (uL >= 2280.0) {
      float tA = (a.g < 0.0 || a.r < uTent) ? tChegA(a.r) : 1e9;
      float tB = a.g > uGmax ? 1e9 : uG0 + (uG1 - uG0) * clamp(a.g / uGmax, 0.0, 1.0);
      idade = uT - min(tA, tB);
    }
    surf = min(uL, dem + 0.6 + max(0.0, uL - dem) * (1.0 - exp(-max(idade, 0.0) / 2.0)));
  } else if (niv <= uL) idade = (uL - niv) / 3.0 + 0.001;
  return vec4(dem, surf, idade, 0.0);
}`;

// agua de La Paz: o dado puro (priority-flood fino semeado pelo nivel do video): a agua sobe pelo canion vinda do leste
export const ESTADO_LAPAZ = /* glsl */ `
vec4 estado(vec2 uv) {
  float dem = texture2D(uDem, uv).r + uBase, niv = texture2D(uNiv, uv).r + uBase;
  float idade = niv <= uL ? (uL - niv) / 3.0 + 0.001 : -1.0;
  return vec4(dem, uL, idade, 0.0);
}`;

export const TERRENO_V = (estado: string) => /* glsl */ `
${GLSL_BASE}
${estado}
varying vec2 vUv; varying vec3 vWp;
void main() {
  vUv = position.xz;
  vec4 e = estado(vUv);
  float h = e.z > 0.0 ? max(e.y, e.x) : e.x;
  vWp = vec3(mix(uX.x, uX.y, vUv.x), vy(h), mix(uX.z, uX.w, vUv.y));
  gl_Position = projectionMatrix * viewMatrix * vec4(vWp, 1.0);
}`;

// albedo do chao por cidade
export const ALB_CDMX = /* glsl */ `
vec3 albedo(float m, float inc, vec3 wp, vec2 uv) {
  vec3 c = vec3(0.60, 0.66, 0.38);
  c = mix(c, vec3(0.40, 0.56, 0.30), smoothstep(2350.0, 2700.0, m));
  c = mix(c, vec3(0.24, 0.44, 0.27), smoothstep(2700.0, 3200.0, m));            // bosque de pinos
  c = mix(c, vec3(0.58, 0.54, 0.46), smoothstep(3700.0, 4300.0, m));
  c = mix(c, vec3(0.97, 0.98, 1.0), smoothstep(4700.0, 5000.0, m));
  c = mix(c, vec3(0.62, 0.52, 0.42), smoothstep(0.35, 0.7, inc) * 0.5);         // encosta: terra
  // cidade: o fundo do vale e as encostas baixas viram quarteiroes (grade de ~110 m, ruas, telhados com tons variados)
  float urb = (1.0 - smoothstep(2330.0, 2420.0, m)) * (1.0 - smoothstep(0.10, 0.22, inc));
  vec2 q = wp.xz / 112.0; vec2 cel = floor(q), f = fract(q);
  float rua = 1.0 - 0.6 * step(0.88, max(f.x, f.y));
  float r = hsh(cel), r2 = hsh(floor(wp.xz / 23.0));
  vec3 tel = mix(vec3(0.80, 0.72, 0.62), vec3(0.74, 0.50, 0.40), step(0.55, r));
  tel = mix(tel, vec3(0.86, 0.84, 0.80), step(0.82, r)) * (0.86 + 0.22 * r2);
  if (r > 0.94) tel = vec3(0.42, 0.62, 0.36);                                     // parques
  vec3 cu = mix(vec3(0.50, 0.49, 0.50), tel, rua) * (0.9 + 0.2 * hsh(floor(wp.xz / 340.0)));
  return mix(c, cu, urb * 0.92);
}`;
export const ALB_LAPAZ = /* glsl */ `
vec3 albedo(float m, float inc, vec3 wp, vec2 uv) {
  vec3 c = vec3(0.62, 0.55, 0.38);                                                // vale seco
  c = mix(c, vec3(0.70, 0.60, 0.42), smoothstep(3300.0, 3700.0, m));
  c = mix(c, vec3(0.66, 0.62, 0.46), smoothstep(3800.0, 4100.0, m));             // puna
  c = mix(c, vec3(0.55, 0.50, 0.46), smoothstep(4500.0, 5100.0, m));
  c = mix(c, vec3(0.97, 0.98, 1.0), smoothstep(5050.0, 5400.0, m));             // neve (Illimani, Cordilheira Real)
  c = mix(c, vec3(0.74, 0.50, 0.36), smoothstep(0.45, 0.85, inc) * 0.55);        // barranco avermelhado do canion
  float r2 = hsh(floor(wp.xz / 31.0));
  return c * (0.94 + 0.1 * r2);
}`;

export const TERRENO_F = (estado: string, alb: string) => /* glsl */ `
${GLSL_BASE}
${estado}
${alb}
uniform sampler2D uAguaB; uniform float uLago, uIlha, uEsc, uFantasma;
varying vec2 vUv; varying vec3 vWp;
void main() {
  vec4 e = estado(vUv);
  float dem = e.x, surf = e.y, idade = e.z;
  float a = texture2D(uDem, vUv - vec2(uTexel.x, 0.0)).r, b = texture2D(uDem, vUv + vec2(uTexel.x, 0.0)).r;
  float c = texture2D(uDem, vUv - vec2(0.0, uTexel.y)).r, d = texture2D(uDem, vUv + vec2(0.0, uTexel.y)).r;
  vec3 n = normalize(vec3((a - b) * uExag / (2.0 * uPx.x), 1.0, (c - d) * uExag / (2.0 * uPx.y)));
  float inc = 1.0 - n.y;
  vec3 col = iluminar(albedo(dem, inc, vWp, vUv), n);
  float dist = length(vWp - cameraPosition);
  vec4 ag = texture2D(uAguaB, vUv);
  // lago antigo como fantasma no chao seco (hachura fina diagonal)
  float dentro = 1.0 - smoothstep(-uEsc, 0.0, ag.g);
  float hach = step(0.62, fract((vWp.x + vWp.z) / (uEsc * 3.0)));
  col = mix(col, vec3(0.55, 0.85, 0.95), dentro * uFantasma * (0.22 + 0.25 * hach));
  if (idade > 0.0) {
    float prof = max(surf - dem, 0.0);
    vec3 raso = vec3(0.36, 0.83, 0.90), medio = vec3(0.10, 0.52, 0.80), fundo = vec3(0.03, 0.17, 0.38);
    float k = 1.0 - exp(-prof / 26.0);
    vec3 w = mix(raso, medio, smoothstep(0.0, 0.45, k)); w = mix(w, fundo, smoothstep(0.45, 1.0, k));
    w = mix(mix(raso * 0.92, col * vec3(0.6, 0.9, 1.0), 0.3), w, smoothstep(0.0, 6.0, prof) * 0.85 + 0.15);   // o chao afogado aparece no raso
    // ondulacao + reflexo do ceu + brilho do sol (funcao de t)
    float amp = 1.0 - 0.85 * smoothstep(1200.0, 6000.0, dist);
    vec3 nw = normalize(vec3((sin(vWp.x * 0.021 + uT * 1.7) * 0.05 + sin(vWp.z * 0.033 - uT * 1.3) * 0.04) * amp, 1.0,
                              (cos(vWp.z * 0.027 + uT * 1.5) * 0.05 + sin((vWp.x + vWp.z) * 0.012 + uT) * 0.03) * amp));
    vec3 v = normalize(cameraPosition - vWp);
    float fres = pow(1.0 - max(dot(v, nw), 0.0), 4.0);
    w = mix(w, uCeuH, fres * 0.55);
    w += vec3(1.0, 0.95, 0.85) * pow(max(dot(reflect(-v, nw), uSol), 0.0), 120.0) * 0.6;
    // espuma: a frente (agua nova) e a margem rasa; faixas de onda atras da frente
    float esp = 1.0 - smoothstep(0.0, 0.05 + dist * 0.0000004, idade);
    esp = max(esp, 1.0 - smoothstep(0.0, 0.5 + dist * 0.000008, prof));
    float ondas = smoothstep(0.8, 1.0, sin(idade * 9.0 - uT * 2.0 + hsh(floor(vWp.xz / 40.0)) * 0.6)) * (1.0 - smoothstep(0.3, 2.2, idade));
    col = mix(w, vec3(0.97, 0.99, 1.0), clamp(esp * 0.9 + ondas * 0.22, 0.0, 1.0));
  } else {
    float molhado = 1.0 - smoothstep(0.0, 6.0, dem - surf);
    col *= 1.0 - 0.12 * molhado * step(dem, surf + 6.0) * step(2000.0, uL);
  }
  // tinta: contorno do lago de 1519 e de Tenochtitlan com as calcadas
  float lin = (1.0 - smoothstep(uEsc * 0.45, uEsc, abs(ag.g))) * uLago;
  col = mix(col, vec3(0.20, 0.13, 0.05), lin * 0.55);
  col = mix(col, vec3(1.0, 0.90, 0.62), (1.0 - smoothstep(uEsc * 0.2, uEsc * 0.55, abs(ag.g))) * uLago);
  float il = (1.0 - smoothstep(uEsc * 0.25, uEsc * 0.6, abs(ag.b))) * uIlha;
  col = mix(col, vec3(1.0, 0.52, 0.32), il);
  gl_FragColor = vec4(nevoa(col, dist, vWp, cameraPosition), 1.0);
}`;

// predios: casas instanciadas (aI = x, z, angulo, semente) ou pegadas extrudadas (aC = cx, cz, h, semente; position.y = 0/1).
// ALT: funcao altura(semente, xz) por cidade; COR: paleta(semente, xz)
export const PREDIO_V = (estado: string, cidade: string, instancia: boolean) => /* glsl */ `
${GLSL_BASE}
${estado}
${cidade}
${instancia ? 'attribute vec4 aI; uniform float uLarg; uniform vec2 uProf;' : 'attribute vec4 aC;'}
varying vec3 vWp, vN, vAlb; varying float vSurf, vIdade, vH, vChao, vJan;
void main() {
  vJan = 1.0;
  ${instancia ? `
  float s = aI.w; vec2 c0 = aI.xy;
  float w = uLarg * (0.78 + 0.18 * fract(s * 13.7)), dd = (uProf.x + uProf.y * fract(s * 7.31)) * 0.92, h = altura(s, c0);
  float co = cos(aI.z), sn = sin(aI.z);
  vec2 lp = vec2(position.x * w, position.z * dd);
  vec2 xz = c0 + vec2(lp.x * co - lp.y * sn, lp.x * sn + lp.y * co);
  vN = vec3(normal.x * co - normal.z * sn, normal.y, normal.x * sn + normal.z * co);
  float topo = position.y;` : `
  float s = aC.w; vec2 c0 = aC.xy; float h = aC.z; vec2 xz = position.xz; vN = normal; float topo = position.y;`}
  vec4 e = estado(uvDe(c0));
  float chao = vy(e.x);
  vWp = vec3(xz.x, chao - 8.0 + topo * (h + 8.0), xz.y);
  vSurf = vy(e.y); vIdade = e.z; vH = h; vChao = chao; vAlb = paleta(s, c0);
  gl_Position = projectionMatrix * viewMatrix * vec4(vWp, 1.0);
}`;

export const PREDIO_F = /* glsl */ `
${GLSL_BASE}
uniform float uJanelas;
varying vec3 vWp, vN, vAlb; varying float vSurf, vIdade, vH, vChao, vJan;
void main() {
  vec3 n = normalize(vN), alb = vAlb;
  float y = vWp.y - vChao;
  if (abs(n.y) < 0.5) {
    float an = fract(y / 3.3), cx = fract(dot(vWp.xz, vec2(n.z, -n.x)) / 3.6);
    float jan = step(0.38, an) * step(an, 0.82) * step(0.28, cx) * step(cx, 0.72) * step(1.5, y) * step(y, vH - 1.0);
    alb = mix(alb, alb * 0.38 + vec3(0.04, 0.06, 0.09), jan * 0.75 * uJanelas * vJan);
    alb *= mix(0.62, 1.0, smoothstep(-1.0, 5.0, y));                          // pe escuro (oclusao barata)
  } else alb *= 0.93;
  vec3 c = iluminar(alb, n);
  if (vIdade > 0.0) {
    float dy = vWp.y - vSurf;
    c = mix(c, vec3(0.04, 0.25, 0.40), 0.75 * step(dy, 0.0));
    c = mix(c, c * 0.55, (1.0 - smoothstep(0.0, 3.5, dy)) * step(0.0, dy));   // parede molhada logo acima
    c = mix(c, vec3(0.96, 0.99, 1.0), 1.0 - smoothstep(0.0, 1.0, abs(dy)));   // espuma onde a agua bate
  }
  gl_FragColor = vec4(nevoa(c, length(vWp - cameraPosition), vWp, cameraPosition), 1.0);
}`;

// anel de horizonte: relevo grosso do continente (dados do video) fora do recorte fino
export const ANEL_V = /* glsl */ `
uniform sampler2D uDemG, uNivG; uniform vec4 uBG, uJ; uniform float uL, uBase, uOlon, uOlat, uKx, uKz, uExag, uRef; uniform vec4 uFino;
varying vec3 vWp; varying vec2 vSt; varying float vAg;
void main() {
  float lon = mix(uJ.x, uJ.z, position.x), lat = mix(uJ.w, uJ.y, position.z);
  vec2 st = vec2((lon - uBG.x) / (uBG.z - uBG.x), (uBG.w - lat) / (uBG.w - uBG.y)); vSt = st;
  float dem = texture2D(uDemG, st).r, niv = texture2D(uNivG, st).r;
  float h = niv <= uL ? uL : dem; vAg = niv <= uL ? uL - dem : -1.0;
  vec3 p = vec3((lon - uOlon) * uKx, (h - uRef) * uExag + uRef - uBase, -(lat - uOlat) * uKz);
  if (p.x > uFino.x && p.x < uFino.y && p.z > uFino.z && p.z < uFino.w) p.y -= 400.0;   // por baixo do fino
  vWp = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
export const ANEL_F = (alb: string) => /* glsl */ `
uniform vec4 uFino; uniform sampler2D uDemG; uniform vec2 uTexelG; uniform float uKx, uKz, uExag;
${GLSL_LUZ}
float hsh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
${alb}
varying vec3 vWp; varying vec2 vSt; varying float vAg;
void main() {
  if (vWp.x > uFino.x && vWp.x < uFino.y && vWp.z > uFino.z && vWp.z < uFino.w) discard;
  float a = texture2D(uDemG, vSt - vec2(uTexelG.x, 0.0)).r, b = texture2D(uDemG, vSt + vec2(uTexelG.x, 0.0)).r;
  float c = texture2D(uDemG, vSt - vec2(0.0, uTexelG.y)).r, d = texture2D(uDemG, vSt + vec2(0.0, uTexelG.y)).r;
  vec3 n = normalize(vec3((a - b) * uExag / (2.0 * uTexelG.x * 84.0 * uKx), 1.0, (c - d) * uExag / (2.0 * uTexelG.y * 89.5 * uKz)));
  float dem = texture2D(uDemG, vSt).r;
  vec3 col = iluminar(albedo(dem, 1.0 - n.y, vWp * 0.0 + vec3(1e5), vSt), n);
  if (vAg > 0.0) { float k = 1.0 - exp(-vAg / 300.0); col = mix(mix(vec3(0.36, 0.83, 0.90), vec3(0.10, 0.52, 0.80), smoothstep(0.0, 0.45, k)), vec3(0.03, 0.17, 0.38), smoothstep(0.45, 1.0, k)); }
  gl_FragColor = vec4(nevoa(col, length(vWp - cameraPosition), vWp, cameraPosition), 1.0);
}`;
