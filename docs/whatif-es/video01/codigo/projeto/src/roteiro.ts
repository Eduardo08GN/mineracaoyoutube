// Capitulos do video (mesmos tempos do original) e caminhos de camera, redesenhados a partir da leitura a 10 fps do original.
// Chave de camera: [fracao do capitulo, posicao, alvo, rolagem em rad (opcional), fov (opcional)]
// transicao: como o capitulo ENTRA (o original funde ~0,6 s entre mundos; corta seco em 0:04 e 7:15; 4:53 e continuo)
export type Chave = [number, [number, number, number], [number, number, number], number?, number?];
export type Cap = {id: string; s: number; e: number; mundo: 'costa' | 'oregon' | 'espaco' | 'texto'; local: string; lat: number; cam: Chave[];
  entrada?: 'funde' | 'corte' | 'continuo'};

export const CAPS: Cap[] = [
  {id: 'intro', s: 0, e: 4, mundo: 'espaco', local: 'LA TIERRA', lat: 0, entrada: 'corte',
    cam: [[0, [0, 1.3, 3.7], [0, 0.0, 0]], [1, [0, 1.22, 3.45], [0, 0.0, 0]]]},
  // aerea a ~20 m sobre o calcadao: praca redonda com chafariz no centro, palmeiras perto, carros embaixo, mar no terco de cima
  {id: 'orla', s: 4, e: 29, mundo: 'costa', local: 'EL ECUADOR', lat: 0, entrada: 'corte',
    cam: [[0, [-9, 19, 46], [3, 0, -10], 0, 50], [1, [-6, 17.5, 42], [4, 0, -12], 0, 50]]},
  // na areia, olhando o mar e a torre de salva-vidas; a agua sobe e a camera sobe junto
  {id: 'praia', s: 29, e: 60, mundo: 'costa', local: 'EL ECUADOR', lat: 0, entrada: 'funde',
    cam: [[0, [-20, 2.0, 0.5], [-38, -4, -60], 0, 50], [0.35, [-20, 2.1, 0], [-38, -4, -60], 0, 50], [1, [-20, 4.9, -1], [-38, -2, -60], 0, 50]]},
  {id: 'oregon', s: 60, e: 93, mundo: 'oregon', local: 'CANNON BEACH, OREGÓN', lat: 45.9, entrada: 'funde',
    cam: [[0, [-24, 9, 22], [4, 2, -60], 0, 50], [1, [-20, 9.5, 18], [6, 2, -60], 0, 50]]},
  {id: 'espaco1', s: 93, e: 122, mundo: 'espaco', local: 'LA TIERRA', lat: 0, entrada: 'funde',
    cam: [[0, [0, 0.35, 2.6], [0, 0, 0]], [1, [0, 0.3, 2.45], [0, 0, 0]]]},
  // mais alto, com a estrada e gente no primeiro plano; trilho para a direita e para baixo
  {id: 'terremoto', s: 122, e: 153, mundo: 'oregon', local: 'CANNON BEACH, OREGÓN', lat: 45.9, entrada: 'funde',
    cam: [[0, [-28, 11, 26], [-6, 1, -22], 0, 50], [1, [-14, 8.5, 22], [2, 1, -22], 0, 50]]},
  // aerea a ~90 m olhando a costa: avenida, calcadao, praca, mar
  {id: 'cidade', s: 153, e: 180, mundo: 'costa', local: 'EL ECUADOR', lat: 0, entrada: 'funde',
    cam: [[0, [70, 92, 118], [-50, 0, -40], 0, 50], [1, [30, 88, 104], [-100, 0, -50], 0, 50]]},
  // calcadao elevado olhando o mar, chafariz pequeno a esquerda
  {id: 'leve', s: 180, e: 209, mundo: 'costa', local: 'EL ECUADOR', lat: 0, entrada: 'funde',
    cam: [[0, [-22, 5.5, 26], [-8, 2.5, -40], 0, 52], [1, [-17, 5.5, 24], [-3, 2.5, -40], 0, 52]]},
  // acima do tabuleiro do pier, olhando ao longo dele; pan para a esquerda, recuo e rolagem moderada
  {id: 'santamonica', s: 209, e: 238, mundo: 'costa', local: 'SANTA MÓNICA', lat: 34, entrada: 'funde',
    cam: [[0, [6, 9, 15], [-24, 4, -70], 0, 50], [1, [10, 9.5, 18], [-36, 4, -70], -0.16, 50]]},
  // baixa, inclinando para cima para os 7 jatos
  {id: 'fonte', s: 238, e: 263, mundo: 'costa', local: 'EL ECUADOR', lat: 0, entrada: 'funde',
    cam: [[0, [5, 1.7, 27], [0, 9, 14], 0, 62], [1, [4, 1.6, 25], [0, 15, 13], 0, 62]]},
  // de volta a aerea da praca (mesma camera da orla) e o paredao no mesmo plano, sem corte
  {id: 'sempeso', s: 263, e: 293, mundo: 'costa', local: 'EL ECUADOR', lat: 0, entrada: 'funde',
    cam: [[0, [-9, 19, 46], [3, 0, -10], 0, 50], [1, [-10, 20, 46], [3, 1.5, -12], 0, 50]]},
  {id: 'paredao', s: 293, e: 318, mundo: 'costa', local: 'EL ECUADOR', lat: 0, entrada: 'continuo',
    cam: [[0, [-10, 20, 46], [3, 1.5, -12], 0, 50], [0.6, [-10, 21, 46], [3, 8, -30], 0, 50], [1, [-10, 15, 38], [3, 10, -40], 0, 50]]},
  {id: 'achata', s: 318, e: 347, mundo: 'espaco', local: 'LA TIERRA', lat: 0, entrada: 'funde',
    cam: [[0, [0, 0.3, 2.55], [0, 0, 0]], [1, [0, 0.75, 2.85], [0, -0.05, 0]]]},
  {id: 'anel', s: 347, e: 376, mundo: 'espaco', local: 'LA TIERRA', lat: 0, entrada: 'funde',
    cam: [[0, [0, 1.2, 4.6], [0, -0.1, 0]], [1, [0, 1.5, 5.1], [0, -0.15, 0]]]},
  {id: 'crosta', s: 376, e: 405, mundo: 'espaco', local: 'LO QUE QUEDA DE LA TIERRA', lat: 0, entrada: 'funde',
    cam: [[0, [0, 1.45, 4.9], [0, -0.12, 0]], [1, [0, 1.25, 4.4], [0, -0.1, 0]]]},
  // Lua enorme no primeiro plano a esquerda, Terra pequena ao longe com o disco de perfil; recuo lento
  {id: 'lua', s: 405, e: 435, mundo: 'espaco', local: 'LA LUNA', lat: 0, entrada: 'funde',
    cam: [[0, [-2.0, 0.12, 5.6], [0.35, 0, 0]], [1, [-2.15, 0.12, 6.2], [0.45, 0, 0]]]},
  {id: 'fim', s: 435, e: 457.5, mundo: 'texto', local: '', lat: 0, entrada: 'corte', cam: [[0, [0, 0, 5], [0, 0, 0]], [1, [0, 0, 5], [0, 0, 0]]]},
];
export const DURACAO = 457.5;
export const capDe = (t: number) => CAPS.find((c) => t >= c.s && t < c.e) ?? CAPS[CAPS.length - 1];
export const FUSAO = 0.6;
