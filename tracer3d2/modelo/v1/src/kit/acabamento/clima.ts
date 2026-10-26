// Climas do Acabamento: tudo o que muda com o clima de guerra (HDRI, sol, nevoa, tom de epoca, chao). Funcoes puras, sem relogio.
// HDRIs: Poly Haven (CC0), versoes "puresky" (so ceu, sem chao): arquivos em public/acabamento/hdri (<raiz>/assets\polyhaven\hdri).
// elev/azim = sol medido no pico de luminancia do .hdr (convencao luzDe do Eddie3D: sol = (cos e sin a, sin e, cos e cos a)).
export type Nivel = 'leve' | 'medio' | 'heroi';
export type Clima = 'nublado' | 'entardecer' | 'inverno';

export type DefClima = {
  hdr: string; fundo: string; elev: number; azim: number;   // elev/azim: sol FOTOGRAFADO no HDRI (rad)
  elevLuz: number;                         // elevacao (graus) da luz direta da cena: >= a do HDRI quando o sol rasante apagaria o terreno todo
  sol: {forca: number; cor: string};       // luz direta (diretional light)
  ibl: number;                             // intensidade da luz de ambiente do HDRI
  exposicao: number;                       // exposicao do fundo (JPG tonemapped)
  hemi: [string, string, number];          // luz hemisferica extra (ceu, chao, forca)
  nevoa: {cor: string; densidade: number; max: number};
  raios: number;                           // god rays (so no heroi; 0 = sem)
  epoca: {sat: number; calor: number; forca: number};  // LUT de 1870: saturacao mantida, calor (0 frio .. 1 quente), mistura
  saturacao: number; contraste: number; brilho: number; vinheta: number; grao: number;
  chao: 'lama' | 'grama' | 'neve' | 'pedra';  // textura PBR sugerida
  fumaca: {cor: string; luz: number};      // cor e luz da fumaca em flipbook neste clima
};

export const CLIMAS: Record<Clima, DefClima> = {
  // dia encoberto de agosto/setembro: luz difusa, sombras suaves, tudo cinza-oliva
  nublado: {
    hdr: 'acabamento/hdri/overcast_soil_puresky_1k.hdr', fundo: 'acabamento/hdri/overcast_soil_puresky_6k.jpg', elev: 0.611, azim: 1.764, elevLuz: 35,
    sol: {forca: 1.5, cor: '#f1efe9'}, ibl: 0.9, exposicao: 0.95, hemi: ['#b9c0c6', '#6b6a58', 0.5],
    nevoa: {cor: '#b4b9bb', densidade: 1 / 2600, max: 0.82},
    raios: 0, epoca: {sat: 0.55, calor: 0.45, forca: 0.7}, saturacao: -0.12, contraste: 0.1, brilho: -0.02, vinheta: 0.5, grao: 0.045, chao: 'lama',
    fumaca: {cor: '#cfcdc4', luz: 0.95},
  },
  // fim de tarde (St. Privat, Sedan): sol baixo e alaranjado, contraluz, poeira e fumaca acesas
  entardecer: {
    hdr: 'acabamento/hdri/industrial_sunset_puresky_1k.hdr', fundo: 'acabamento/hdri/industrial_sunset_puresky_6k.jpg', elev: 0.071, azim: 0.936, elevLuz: 20,
    sol: {forca: 3.4, cor: '#ffb67e'}, ibl: 0.55, exposicao: 0.9, hemi: ['#9aa4b8', '#6b5a48', 0.8],
    nevoa: {cor: '#c9a98c', densidade: 1 / 2200, max: 0.78},
    raios: 0.3, epoca: {sat: 0.62, calor: 0.8, forca: 0.7}, saturacao: -0.06, contraste: 0.14, brilho: -0.03, vinheta: 0.58, grao: 0.05, chao: 'grama',
    fumaca: {cor: '#d8c3a8', luz: 1.15},
  },
  // inverno de 1870/71 (Jura, Orleans, Paris sitiada): neve, ceu de chumbo, azul frio
  inverno: {
    hdr: 'acabamento/hdri/snow_field_puresky_1k.hdr', fundo: 'acabamento/hdri/snow_field_puresky_6k.jpg', elev: 0.304, azim: 0.825, elevLuz: 20,
    sol: {forca: 1.9, cor: '#f3efe8'}, ibl: 0.85, exposicao: 0.95, hemi: ['#aebdd2', '#6c727c', 0.55],
    nevoa: {cor: '#b8c2cd', densidade: 1 / 1700, max: 0.86},
    raios: 0, epoca: {sat: 0.45, calor: 0.2, forca: 0.7}, saturacao: -0.2, contraste: 0.12, brilho: -0.03, vinheta: 0.55, grao: 0.05, chao: 'neve',
    fumaca: {cor: '#d6d8da', luz: 1.0},
  },
};

// sol do HDRI na convencao compass da cena (azimute em graus, norte = 0, horario) e elevacao em graus
export const solDoClima = (c: Clima) => ({elev: CLIMAS[c].elev * 180 / Math.PI, azim: CLIMAS[c].azim});
// direcao do sol (vetor unitario) dado o azimute compass A (graus) e elevacao (graus): mesma de `sonnenRichtung` do t_szene
export const dirSol = (azGrad: number, hoeheGrad: number): [number, number, number] => {
  const a = azGrad * Math.PI / 180, h = hoeheGrad * Math.PI / 180;
  return [Math.sin(a) * Math.cos(h), Math.sin(h), -Math.cos(a) * Math.cos(h)];
};
// rotacao (em voltas) do panorama para o sol do HDRI cair no azimute compass `azGrad` da cena
export const rotParaAzimute = (c: Clima, azGrad: number) => {
  const u0 = (Math.PI / 2 - CLIMAS[c].azim) / (2 * Math.PI) + 0.5;
  const uT = (azGrad * Math.PI / 180 - Math.PI / 2) / (2 * Math.PI) + 0.5;
  return ((u0 - uT) % 1 + 1) % 1;
};
