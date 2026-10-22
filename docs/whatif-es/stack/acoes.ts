// Mapa de acoes do original (mapa_acoes.json, lido a 10 fps) transformado em encenacao: cada figurante e cada acontecimento
// da praia (0:04-3:04) acontece no mesmo segundo do original e no mesmo lugar do quadro.
// Posicoes relativas a camera num instante de referencia: [segundo, lateral (m, + = direita), frente (m)].
// Regra do canal (PRODUCAO.md 4.4): legenda = acao; nada parado por mais de ~4 s.
import {EU, TRILHO, TRILHO_AGUA, trilho} from './roteiro';

export type Modo = 'anda' | 'corre' | 'deitado' | 'parado' | 'carbonizado' | 'carbonizado_deitado';
export type Figurante = {
  id: number; camisa?: string; calca?: string; curta?: boolean; fem?: boolean;
  ref: number;                                 // segundo cuja pose de camera define o referencial
  pontos: [number, number, number][];          // [t, lateral, frente] — o boneco anda/corre entre os pontos
  levanta?: number;                            // estava deitado ate este segundo e levanta em 0,7 s
  modo?: Modo; some?: number;                  // some depois deste segundo
};

// pose da camera da praia (posicao e direcao no chao) num segundo do original
export const poseCamera = (t: number) => {
  const r = trilho(t < 122.5 ? TRILHO : TRILHO_AGUA, t);
  const fx = r.alvo[0] - r.pos[0], fz = r.alvo[2] - r.pos[2], n = Math.hypot(fx, fz) || 1;
  return {x: r.pos[0], z: r.pos[2], fx: fx / n, fz: fz / n};
};
// [lateral, frente] no referencial da camera em ref -> [x, z] do mundo
export const relMundo = (ref: number, lat: number, frente: number): [number, number] => {
  const c = poseCamera(ref);
  const rx = -c.fz, rz = c.fx;   // direita da camera no chao
  return [c.x + c.fx * frente + rx * lat, c.z + c.fz * frente + rz * lat];
};

// ---------- figurantes (cores e trajetos do original) ----------
export const FIGURANTES: Figurante[] = [
  {id: 1, camisa: '#c0392b', calca: '#6b4a2f', ref: 4, pontos: [[4, 0.5, 9], [13, 2.5, 20]], some: 13.5},                        // vermelho se afasta para a agua
  {id: 2, camisa: '#f1f1ee', calca: '#6b4a2f', ref: 12, pontos: [[10.4, 6, 6.5], [18.7, -5, 6.5]]},                               // branco atravessa D->E a ~6 m
  {id: 3, camisa: '#e67e22', calca: '#2c2f36', curta: true, ref: 22, pontos: [[16, 7, 18], [25.4, 1.2, 2.2], [27, -2.5, 1.5]]},  // laranja vem e passa colado
  {id: 4, camisa: '#48c9b0', calca: '#6b4a2f', ref: 26, pontos: [[26.5, -1.2, 1.8], [30.5, 2.5, 6.5]]},                          // verde-agua surge colado a esquerda
  {id: 5, camisa: '#3b8f3b', calca: '#6b4a2f', ref: 36, pontos: [[32.5, -7, 12], [41, 4, 9]]},                                    // verde atravessa E->D
  {id: 6, camisa: '#7d5ba6', calca: '#f1f1ee', fem: true, ref: 38, pontos: [[34, 6, 17], [44, -2, 13]]},                          // roxo perto da agua
  {id: 7, camisa: '#2f6fd0', calca: '#e8c9a0', curta: true, ref: 22, pontos: [[0, -1.2, 3.4], [65.7, -1.2, 3.4], [69.3, -3.4, -0.5]], levanta: 65.0}, // banhista deitado levanta e corre
  {id: 8, camisa: '#f2c230', calca: '#1f3f8f', ref: 56, pontos: [[54.8, -4, 2.2], [58.3, 6, 2.6]], modo: 'corre'},               // amarelo corre colado E->D
  {id: 9, camisa: '#c0392b', calca: '#6b4a2f', ref: 64, pontos: [[63.5, 1, 12], [65, 3, 12]]},
  {id: 10, camisa: '#2f6fd0', calca: '#2c2f36', ref: 64, pontos: [[63.5, 2, 6], [65, -1, 6]]},
  {id: 11, camisa: '#3b8f3b', calca: '#6b4a2f', fem: true, ref: 64, pontos: [[63.5, 2.8, 6.6], [65, -0.4, 6.6]]},
  // grupo de ~8 corre para a esquerda sob o muelle (68,5-72,5)
  ...Array.from({length: 8}, (_, k): Figurante => ({id: 20 + k, camisa: ['#2f6fd0', '#f1f1ee', '#e67e22', '#f2c230', '#2f6fd0', '#c0392b', '#f1f1ee', '#48c9b0'][k],
    calca: ['#6b4a2f', '#2c2f36', '#1f3f8f'][k % 3], fem: k % 3 === 1, curta: k % 2 === 0, ref: 70,
    pontos: [[68.5 + k * 0.12, -2 - k * 0.6, 15 + (k % 3) * 1.4], [72.5 + k * 0.12, -15 - k * 0.6, 17 + (k % 3) * 1.4]], modo: 'corre'})),
  {id: 30, ref: 70, pontos: [[66, -7.5, 16.5]], modo: 'carbonizado'},                                                             // vulto carbonizado sentado
  {id: 31, camisa: '#48c9b0', calca: '#6b4a2f', curta: true, ref: 74, pontos: [[73.1, 6, 10], [75.8, -6, 10]], modo: 'corre'},   // menino corre D->E
  {id: 32, camisa: '#e67e22', calca: '#2c2f36', ref: 74, pontos: [[70, 0.5, 12], [75, 0.5, 12]], modo: 'parado'},
  {id: 33, ref: 74, pontos: [[66, 4, 14]], modo: 'carbonizado_deitado'},                                                          // monte preto perto da agua
  {id: 34, camisa: '#c0392b', calca: '#7f8c8d', ref: 76.3, pontos: [[75.1, 7, 6], [77.7, -7, 6]], modo: 'corre'},                // vermelho cruza o chicote
  // 78,3-83: ~10 corredores entram pela direita e correm para a esquerda
  ...[[78.3, '#2f6fd0'], [78.5, '#f1f1ee'], [78.7, '#e67e22'], [80.5, '#f2c230'], [81.5, '#2f6fd0'], [81.7, '#e67e22'], [81.9, '#f2c230'], [82.1, '#c0392b'], [82.3, '#f1f1ee']]
    .map(([t0, cor], k): Figurante => ({id: 40 + k, camisa: cor as string, calca: ['#6b4a2f', '#2c2f36'][k % 2], fem: k % 3 === 2, ref: 80,
      pontos: [[t0 as number, 9, 11 + (k % 3) * 1.5], [(t0 as number) + 4.2, -8, 11 + (k % 3) * 1.5]], modo: 'corre'})),
  // 84-90: figuras pequenas correndo D->E no alto (longe)
  ...Array.from({length: 7}, (_, k): Figurante => ({id: 60 + k, camisa: ['#e67e22', '#c0392b', '#2f6fd0', '#f2c230'][k % 4], calca: '#2c2f36', ref: 87,
    pontos: [[84 + k * 0.7, 12, 24 + k], [90 + k * 0.7, -12, 24 + k]], modo: 'corre'})),
  {id: 70, ref: 104, pontos: [[96, -4, 13]], modo: 'carbonizado_deitado'},                                                        // corpo carbonizado perto da agua
  {id: 71, ref: 145.1, pontos: [[140, 0, 6]], modo: 'carbonizado_deitado'},                                                       // monte preto no chicote
];

// ---------- acontecimentos de objetos (fogo, fumaca) ----------
export type Foco = {x: number; y?: number; z: number; s: number; t0: number; t1?: number};
const foco = (ref: number, lat: number, frente: number, s: number, t0: number, y = 0, t1?: number): Foco => {
  const [x, z] = relMundo(ref, lat, frente); return {x, y, z, s, t0, t1};
};
// toalha aos pes pega fogo em 48,2 (baixo-direita), queima ate ~63
export const TOALHA = relMundo(50, 1.0, 2.6);
export const FOGO_TOALHA: Foco[] = [foco(50, 0.85, 2.5, 0.55, 48.2, 0, 63.5), foco(50, 1.15, 2.7, 0.45, 48.3, 0, 63.5), foco(50, 1.0, 2.9, 0.4, 48.5, 0, 63.5), foco(50, 1.3, 2.45, 0.35, 48.4, 0, 63.5)];
export const FUMACA_TOALHA: Foco[] = [foco(50, 1.0, 2.7, 0.9, 48.4, 0.6, 63.5)];
// primeiros focos: areia (67,4), base do muelle (68), areia sob o muelle (69)
export const FOCOS_INICIAIS: Foco[] = [
  foco(67.4, -5, 25, 0.9, 67.4), foco(70, -6.5, 17.5, 0.8, 69), foco(70, -9, 18.5, 0.9, 69.3), foco(70, -4.5, 19, 0.7, 69.6), foco(70, -11, 17, 0.8, 69.9),
  foco(74, 4.6, 14, 0.7, 73.6), foco(74, 3.4, 14.4, 0.6, 73.8), foco(104, -4.4, 13, 0.7, 101.5), foco(104, -3.5, 13.4, 0.6, 101.7),
  foco(145.1, 0.4, 6, 0.7, 140), foco(70, -7.5, 16.5, 0.6, 66.5),
];
export const FOGO_BASE_MUELLE: Foco[] = Array.from({length: 6}, (_, k) => ({x: -12 + [-4, 0, 4][k % 3], y: 0.4, z: -14 - k * 5, s: 1.2, t0: 68 + k * 0.4}));
// as copas das palmeiras da frente explodem juntas em 75,4 (as de longe vao pegando depois)
export const T_COPAS = 75.4;
// gaivotas 10,5-14 (centro-direita do ceu)
export const GAIVOTAS = {t0: 10.5, t1: 14.5, ref: 12, n: 4};
export const EU_ = EU;
