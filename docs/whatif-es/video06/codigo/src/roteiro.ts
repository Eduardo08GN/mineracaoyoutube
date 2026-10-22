// Capitulos do video 6 (tempos do ORIGINAL, mapa_acoes.md). Nao ha POV fixo: cada capitulo e um lugar, ligado ao seguinte por fusao
// de 0,6 s (cortes secos so em 4,1, 97,8 e 383,3). Cada mundo controla a PROPRIA camera (useThree) e recebe t do original.
// Adaptacao cultural: Cannon Beach -> San Juan de Gaztelugatxe (Espanha, 43,4 N); Nova York/Times Square -> Madrid, Gran Via/Callao
// (40,4 N); San Francisco/Golden Gate -> Cidade do Panama, Puente de las Americas sobre o Canal (8,9 N); Santa Monica -> Acapulco (16,9 N).
// Take inedito de 30 s inserido em 244,9 s do original (entre "mas lento que una bicicleta" e "De vuelta en el ecuador").
export type Mundo = 'calcadao' | 'praia' | 'leito' | 'gaztelugatxe' | 'madrid' | 'globo' | 'panama' | 'acapulco' | 'take' | 'telas';
export type Cap = {id: string; s: number; e: number; mundo: Mundo; local: string; entrada: 'funde' | 'corte'};

export const INS = 244.9;
export const DUR_INS = 30;
export const tOrig = (t: number) => (t < INS ? t : t < INS + DUR_INS ? INS : t - DUR_INS);
export const noTake = (t: number) => t >= INS && t < INS + DUR_INS;
export const FUSAO = 0.6;

export const CAPS: Cap[] = [
  {id: 'abertura', s: 0, e: 4.1, mundo: 'calcadao', local: '', entrada: 'corte'},
  {id: 'varanda', s: 4.1, e: 29.9, mundo: 'praia', local: 'EL ECUADOR', entrada: 'corte'},
  {id: 'recua', s: 29.9, e: 60.9, mundo: 'leito', local: 'EL ECUADOR', entrada: 'funde'},
  {id: 'gaztelugatxe', s: 60.9, e: 74.9, mundo: 'gaztelugatxe', local: 'SAN JUAN DE GAZTELUGATXE, ESPAÑA', entrada: 'funde'},
  {id: 'madrid', s: 74.9, e: 103.9, mundo: 'madrid', local: 'MADRID', entrada: 'funde'},
  {id: 'globo1', s: 103.9, e: 132.9, mundo: 'globo', local: 'LA TIERRA', entrada: 'funde'},
  {id: 'panama', s: 132.9, e: 159.9, mundo: 'panama', local: 'CIUDAD DE PANAMÁ', entrada: 'funde'},
  {id: 'tarde', s: 159.9, e: 188.9, mundo: 'acapulco', local: 'ACAPULCO, MÉXICO', entrada: 'funde'},
  {id: 'noite', s: 188.9, e: 217.9, mundo: 'acapulco', local: 'ACAPULCO, MÉXICO', entrada: 'funde'},
  {id: 'globo2', s: 217.9, e: 244.9, mundo: 'globo', local: 'LA TIERRA', entrada: 'funde'},
  {id: 'solpara', s: 244.9, e: 271.7, mundo: 'praia', local: 'EL ECUADOR', entrada: 'funde'},
  {id: 'solvolta', s: 271.7, e: 300.9, mundo: 'praia', local: 'EL ECUADOR', entrada: 'funde'},
  {id: 'globo3', s: 300.9, e: 329.9, mundo: 'globo', local: 'LA TIERRA', entrada: 'funde'},
  {id: 'oeste', s: 329.9, e: 357.0, mundo: 'calcadao', local: 'EL ECUADOR', entrada: 'funde'},
  {id: 'onda', s: 357.0, e: 390.1, mundo: 'praia', local: 'EL ECUADOR', entrada: 'funde'},
  {id: 'telas', s: 390.1, e: 412.0, mundo: 'telas', local: '', entrada: 'corte'},
];
export const CAP_TAKE: Cap = {id: 'take', s: INS, e: INS + DUR_INS, mundo: 'take', local: '', entrada: 'funde'};
export const DURACAO_ORIG = 412.0;
export const DURACAO = DURACAO_ORIG + DUR_INS;
// tolerancia de 1e-6: quadro/30 da 274,8999... e a troca de capitulo caia 1 quadro antes (o globo piscava na saida do take)
export const capDe = (to: number) => { const x = to + 1e-6; return CAPS.find((c) => x >= c.s && x < c.e) ?? CAPS[CAPS.length - 1]; };

// utilitario de camera para os mundos: chaves [t, pos, alvo, fov?] interpoladas com suavizacao
export type ChaveCam = [number, [number, number, number], [number, number, number], number?];
const ease = (u: number) => u * u * (3 - 2 * u);
export const camEm = (K: ChaveCam[], t: number) => {
  let i = 0;
  while (i < K.length - 2 && t > K[i + 1][0]) i++;
  const a = K[i], b = K[i + 1] ?? K[i];
  const u = ease(Math.min(1, Math.max(0, (t - a[0]) / Math.max(1e-6, b[0] - a[0]))));
  const L = (x: number, y: number) => x + (y - x) * u;
  return {pos: [L(a[1][0], b[1][0]), L(a[1][1], b[1][1]), L(a[1][2], b[1][2])] as [number, number, number],
    alvo: [L(a[2][0], b[2][0]), L(a[2][1], b[2][1]), L(a[2][2], b[2][2])] as [number, number, number], fov: L(a[3] ?? 50, b[3] ?? 50)};
};
