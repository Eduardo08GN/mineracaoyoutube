// LUT 3D de epoca (1870), gerada por codigo e deterministica: dessatura, tinge as sombras de frio e as luzes de creme (virado de placa
// de colodio/albumina), levanta um pouco o preto e arredonda o contraste. N^3 * 3 valores 0..1, ordem r mais rapido, depois g, depois b
// (formato do `Perfil.lut` do Look). `calor` 0 = frio azulado, 1 = sepia quente; `sat` = quanto da saturacao original fica; `forca` mistura.
import type {DefClima} from './clima';

const sm = (a: number, b: number, x: number) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const CACHE = new Map<string, number[]>();

export const lutEpoca = (e: DefClima['epoca'], N = 17): number[] => {
  const k = `${e.sat}|${e.calor}|${e.forca}|${N}`;
  const c = CACHE.get(k); if (c) return c;
  const out: number[] = [];
  // tinta das sombras (frio) e das luzes (creme), interpoladas pelo calor
  const sombra = [0.90 + 0.06 * e.calor, 0.97, 1.05 - 0.10 * e.calor], luz = [1.05 + 0.04 * e.calor, 1.0, 0.90 - 0.08 * e.calor];
  for (let b = 0; b < N; b++) for (let g = 0; g < N; g++) for (let r = 0; r < N; r++) {
    const rgb = [r / (N - 1), g / (N - 1), b / (N - 1)];
    const L = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
    const w = sm(0.18, 0.82, L);
    const v = rgb.map((x, i) => {
      let y = L + (x - L) * e.sat;                      // dessatura
      y *= sombra[i] + (luz[i] - sombra[i]) * w;        // split-toning
      y = y * 0.965 + 0.018;                            // preto levantado (pelicula)
      y = y + 0.10 * (y - 0.5) * (1 - Math.abs(2 * y - 1)) * 1.0;   // S suave
      y = x + (y - x) * e.forca;                        // mistura com o original
      return Math.min(1, Math.max(0, y));
    });
    out.push(v[0], v[1], v[2]);
  }
  CACHE.set(k, out);
  return out;
};
