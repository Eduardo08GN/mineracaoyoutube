// Capitulos (tempos do ORIGINAL, mapa_acoes.json) e a camera POV. Voce fica parado de pe na calcada o video inteiro:
// a camera so gira (guinada/inclinacao/rolagem) e muda de altura quando o chao sobe (gelo, montanha).
// Mundo: olho em (0, 1,7, 0). Guinada 0 = olhando ao longo da calcada para -z (oeste: o Sol se poe a frente, atras do skyline).
// Guinada positiva = vira para a ESQUERDA (-x, sul: banco e gramado). Direita (+x, norte): a rua e as casas do outro lado.
// Take inedito de 30 s inserido em 386,5 s do original (escuridao depois da ultima estrela): ver INS e tOrig.
import * as THREE from 'three';

export type Mundo = 'cosmos' | 'rua' | 'terra' | 'fim' | 'take';
export type Cap = {id: string; s: number; e: number; mundo: Mundo};

// ---------- take inedito ----------
export const INS = 386.5;
export const DUR_INS = 30;
export const tOrig = (t: number) => (t < INS ? t : t < INS + DUR_INS ? INS : t - DUR_INS);
export const noTake = (t: number) => t >= INS && t < INS + DUR_INS;

export const CAPS: Cap[] = [
  {id: 'abertura', s: 0, e: 6.4, mundo: 'cosmos'},        // ceu de gigante vermelha (cold open) + preto 5,9-6,4
  {id: 'rua', s: 6.4, e: 24.8, mundo: 'rua'},
  {id: 'noite1', s: 24.8, e: 41, mundo: 'rua'},
  {id: 'listra', s: 41, e: 64.5, mundo: 'rua'},
  {id: 'estacoes', s: 64.5, e: 90, mundo: 'rua'},
  {id: 'megacidade', s: 90, e: 116, mundo: 'rua'},
  {id: 'floresta', s: 116, e: 129, mundo: 'terra'},
  {id: 'gelo', s: 129, e: 150.5, mundo: 'terra'},
  {id: 'estrela', s: 150.5, e: 162.5, mundo: 'terra'},
  {id: 'canion', s: 162.5, e: 187.2, mundo: 'terra'},
  {id: 'montanha', s: 187.2, e: 202.5, mundo: 'terra'},
  {id: 'deserto', s: 202.5, e: 230, mundo: 'terra'},
  {id: 'morta', s: 230, e: 260, mundo: 'terra'},
  {id: 'semar', s: 260, e: 297, mundo: 'terra'},           // chao morto + Andromeda (camadas do cosmos por cima)
  {id: 'fusao', s: 297, e: 309.3, mundo: 'terra'},
  {id: 'gigante', s: 309.3, e: 328.4, mundo: 'cosmos'},    // lava, gigante vermelha, dentro do Sol, flutuando
  {id: 'nebulosa', s: 328.4, e: 345, mundo: 'cosmos'},
  {id: 'galaxias', s: 345, e: 384.5, mundo: 'fim'},
  {id: 'escuro', s: 384.5, e: 410, mundo: 'fim'},
  {id: 'buraco', s: 410, e: 442, mundo: 'fim'},
  {id: 'evapora', s: 442, e: 505.4, mundo: 'fim'},
  {id: 'ultimo', s: 505.4, e: 522, mundo: 'fim'},
  {id: 'volta', s: 522, e: 537.2, mundo: 'rua'},
];
export const CAP_TAKE: Cap = {id: 'take', s: INS, e: INS + DUR_INS, mundo: 'take'};
export const DURACAO_ORIG = 537.2;
export const DURACAO = DURACAO_ORIG + DUR_INS;
export const capDe = (to: number) => CAPS.find((c) => to >= c.s && to < c.e) ?? CAPS[CAPS.length - 1];

// ---------- trilho da camera POV ----------
// [t, guinada, inclinacao, rolagem] em graus. Entre chaves: suave (smoothstep). Chicotes = chaves proximas.
type Chave = [number, number, number, number];
export const TRILHO: Chave[] = [
  [0, 0, 22, 0], [6.4, 0, 22, 0],                      // abertura: ceu inteiro
  [6.41, 0, -3, 0], [27.4, 0, -3, 0], [28.2, 0, 55, 0], [29.8, 0, 55, 0], [30.0, 0, -3, 0],
  [30.6, -180, 2, 0], [31.0, -180, 2, 0], [33.0, -180, 32, 6],      // chicote para tras (nascer do Sol) e segue o Sol
  [33.6, 0, -3, 0], [64.5, 0, -3, 0], [66.5, -72, -3, 0],           // volta; pan a direita ate a casa do outro lado
  [73, -72, -3, 0], [75, 0, -3, 0], [80, 34, -2, 0], [84, 34, -2, 0], [87.5, 34, -2, 0], [89.5, 8, -2, 0], [90.5, 12, -2, 0],
  [94, 12, -2, 0], [97, 12, 5, 5], [99, 12, 6, 5], [101, 12, 14, 10], [105.4, 12, 14, 10], [105.7, 12, -2, 0],
  [119.4, 12, -2, 0], [120.5, -80, 44, 0], [123.5, -80, 44, 0], [124, -40, 22, 0], [126.5, -20, 22, 0], [127, 0, -2, 0],
  [137.5, 0, -2, 0], [138.2, 0, -72, 0], [140.8, 0, -72, 0], [141.4, 0, -2, 0],     // olha os pes no gelo
  [150.5, 0, -2, 0], [152.5, 30, 16, 0], [155.5, 30, 16, 0], [156.5, -10, -2, 0], [159.5, -10, -2, 0], [162.5, -10, -32, 0],
  [166.2, -10, -32, 0], [167, -10, 74, 0], [174.3, -10, 74, 0], [174.8, -10, -14, 0], [187.5, -10, -10, 0], [189.5, -10, -8, 0],
  [202.5, -10, -2, 0], [208, -10, -2, 0], [210, -18, -2, 0], [216, -18, -2, 0], [217, -18, 8, 0], [229, -18, 8, 0], [230, -18, 0, 0],
  [260, -18, 0, 0], [261, -18, 68, 0], [274, -18, 68, 0], [275.5, -18, 0, 0], [283.5, -18, 0, 0], [284.5, -18, 48, 0],
  [309.3, -18, 48, 0], [310.5, -18, 6, 0], [321.4, -18, 6, 0], [325.2, -18, 10, 0], [325.5, -18, -78, 0], [328.3, -18, -78, 0],
  [328.8, -18, 28, 0], [489.5, -18, 28, 0], [490, -18, 22, 0], [492.3, -18, 22, 0], [493, -18, 28, 0], [505.4, -18, 28, 0],
  [522, 0, -3, 0], [535.5, 0, -3, 0], [536, -7, -3, 0],
];
// altura do olho (m acima do nivel da rua): o gelo te levanta ~1 km (134-137,5) e a terra te leva ao cume (187,5-189,5)
const ALTURA: [number, number][] = [
  [0, 1.7], [129, 1.7], [134, 60], [137.5, 1000], [141.4, 1000], [141.8, 1.7], [143, 1.7], [143.4, 900], [144.1, 1.7],
  [147.1, 1.7], [147.3, 900], [147.9, 1.7], [149.2, 1.7], [149.4, 900], [150.3, 1.7],
  [187.5, 1.7], [189.5, 3200], [196, 3200], [201.5, 300], [202.5, 120], [522, 120], [522.01, 1.7],
];
const ease = (u: number) => u * u * (3 - 2 * u);
const interp = <T extends number[]>(K: T[], t: number, n: number) => {
  let i = 0;
  while (i < K.length - 2 && t > K[i + 1][0]) i++;
  const a = K[i], b = K[i + 1];
  const u = ease(Math.min(1, Math.max(0, (t - a[0]) / Math.max(1e-6, b[0] - a[0]))));
  return Array.from({length: n}, (_, k) => a[k + 1] + (b[k + 1] - a[k + 1]) * u);
};
export const alturaOlho = (t: number) => interp(ALTURA, t, 1)[0];

export type PoseCam = {pos: THREE.Vector3; quat: THREE.Quaternion; dir: THREE.Vector3; guinada: number; inclinacao: number; rolagem: number;
  velAng: number};   // velAng: graus/s (borrao nos chicotes)
export const poseCamera = (t: number): PoseCam => {
  const [g, p, r] = interp(TRILHO, t, 3);
  const [g2, p2] = interp(TRILHO, t + 1 / 30, 2);
  const e = new THREE.Euler((p * Math.PI) / 180, (g * Math.PI) / 180, (r * Math.PI) / 180, 'YXZ');
  const quat = new THREE.Quaternion().setFromEuler(e);
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
  return {pos: new THREE.Vector3(0, alturaOlho(t), 0), quat, dir, guinada: g, inclinacao: p, rolagem: r, velAng: Math.hypot(g2 - g, p2 - p) * 30};
};
// ponto relativo a camera no instante t: dx para a direita, dy para cima (em unidades de tela a 'dist' metros), dist a frente.
// Use para pendurar objetos do ceu profundo "no quadro" (galaxias, buraco negro) sem depender da guinada.
export const relCam = (t: number, dx: number, dy: number, dist: number) => {
  const c = poseCamera(t);
  return new THREE.Vector3(dx, dy, -dist).applyQuaternion(c.quat).add(c.pos);
};
