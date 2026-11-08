// Dados reais do video 08 (G4: GHS-POP 2025 + ETOPO 2022 + Natural Earth). Carregados uma vez, antes do primeiro quadro.
// nivel/dem chegam em float16 cru (o PNG de 16 bits cai para 8 bits no navegador e a costa andaria em degraus de ~27 m).
import * as THREE from 'three';
import {continueRender, delayRender, staticFile} from 'remotion';

export type Pais = {nome: string; pop: number; l50: number; l99: number; pico_m: number; ultimos: {lon: number; lat: number; pop: number; nivel: number}[]};
export type Dados = {
  tex: {nivel: THREE.DataTexture; dem: THREE.DataTexture; sombra: THREE.Texture; pais: THREE.Texture};
  bounds: [number, number, number, number]; tw: number; th: number; ordem: string[];
  paises: Record<string, Pais>; latam: {niveis: number[]; pop: number[]; terra: number[]; pessoas_abs: number[]; pop_total: number};
  pontos: {lon: number[]; lat: number[]; nivel: number[]; pais: number[]};
  cumes: Record<string, {lon: number; lat: number; m: number}>;
  cidades: {nome: string; pais: string; lat: number; lon: number; nivel: number; dem: number}[];
};
export let DADOS: Dados | null = null;
let avisar: () => void = () => {};
export const PRONTO = new Promise<void>((ok) => { avisar = ok; });   // o componente re-renderiza quando os dados chegam

const bin = async (arq: string, w: number, h: number) => {
  const buf = await (await fetch(staticFile(arq))).arrayBuffer();
  const t = new THREE.DataTexture(new Uint16Array(buf), w, h, THREE.RedFormat, THREE.HalfFloatType);
  t.magFilter = t.minFilter = THREE.LinearFilter; t.flipY = false; t.needsUpdate = true; return t;
};
const png = (arq: string, filtro: THREE.MagnificationTextureFilter) => new Promise<THREE.Texture>((ok, erro) =>
  new THREE.TextureLoader().load(staticFile(arq), (t) => { t.magFilter = filtro; t.minFilter = filtro === THREE.NearestFilter ? THREE.NearestFilter : THREE.LinearMipmapLinearFilter; t.flipY = false; t.colorSpace = THREE.NoColorSpace; ok(t); }, undefined, erro));
const js = async (arq: string) => (await fetch(staticFile(arq))).json();

if (typeof window !== 'undefined') {
  const h = delayRender('dados do mar', {timeoutInMilliseconds: 120000});
  (async () => {
    const t = await js('dados/texturas.json');
    const [nivel, dem, sombra, pais, res, pontos, cumes] = await Promise.all([
      bin('dados/nivel.f16.bin', t.tw, t.th), bin('dados/dem.f16.bin', t.tw, t.th), png('dados/sombra.png', THREE.LinearFilter), png('dados/pais.png', THREE.NearestFilter),
      js('dados/resultado.json'), js('dados/pontos.json'), js('dados/cumes.json')]);
    // cumes reais: a media da celula de ~1 km (ETOPO 30") deixa o Aconcagua em ~6.650 m; o cume medido e 6.961 m (IGN Argentina).
    // Sobe so os pixels do pico (cone de ~2 px) para a "ultima roca" existir ate o nivel que a narracao diz.
    const CUMES: [number, number, number][] = [[-70.011, -32.653, 6961], [-68.541, -27.109, 6893], [-68.773, -27.756, 6793], [-77.604, -9.122, 6768], [-68.88, -18.106, 6542]];
    for (const tex of [dem, nivel]) {
      const a = tex.image.data as Uint16Array, W = t.tw, H = t.th, [O, S, Lo, N] = t.bounds;
      for (const [lon, lat, m] of CUMES) {
        const cx = ((lon - O) / (Lo - O)) * W, cy = ((N - lat) / (N - S)) * H;
        for (let y = Math.floor(cy) - 3; y <= Math.ceil(cy) + 3; y++) for (let x = Math.floor(cx) - 3; x <= Math.ceil(cx) + 3; x++) {
          const r = Math.hypot(x + 0.5 - cx, y + 0.5 - cy), i = y * W + x, v = THREE.DataUtils.fromHalfFloat(a[i]);
          const alvo = m - r * r * 120; if (alvo > v) a[i] = THREE.DataUtils.toHalfFloat(alvo);
        }
      }
      tex.needsUpdate = true;
    }
    DADOS = {tex: {nivel, dem, sombra, pais}, bounds: t.bounds, tw: t.tw, th: t.th, ordem: t.ordem_pais, paises: res.paises, latam: res.latam, pontos, cumes, cidades: res.cidades};
    avisar(); continueRender(h);
  })().catch((e) => { console.error('DADOS_FALHOU', e); throw e; });
}

// ---------------------------------------------------------------- projecao (sinusoidal: area igual, a Patagonia nao estica)
export const LON0 = -76;
export const EXAG = 14;                         // exagero vertical do relevo (32 virava agulha nos Andes, 05/11)
export const UM = EXAG / 111000;                // metros -> unidades (1 unidade = 1 grau de latitude)
export const xy = (lon: number, lat: number): [number, number] => [(lon - LON0) * Math.cos((lat * Math.PI) / 180), -lat];
export const mundo = (lon: number, lat: number, m: number): [number, number, number] => { const [x, z] = xy(lon, lat); return [x, Math.max(0, m) * UM, z]; };

// fracao (0..1) da populacao/terra da America Latina debaixo d'agua no nivel L (interpolada nas curvas da G4)
export const curva = (arr: number[], niveis: number[], L: number) => {
  if (L <= niveis[0]) return arr[0];
  for (let i = 1; i < niveis.length; i++) if (L <= niveis[i]) { const u = (L - niveis[i - 1]) / (niveis[i] - niveis[i - 1]); return arr[i - 1] + (arr[i] - arr[i - 1]) * u; }
  return arr[arr.length - 1];
};
// paises ainda em pe no nivel L (Puerto Rico fica fora da contagem: territorio, nao pais)
export const CONTA = (d: Dados) => d.ordem.filter((k) => k !== 'PRI' && d.paises[k]);
export const emPe = (d: Dados, L: number) => CONTA(d).filter((k) => d.paises[k].l99 > L);
