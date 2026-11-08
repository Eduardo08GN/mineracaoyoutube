// Nivel do mar L(t) amarrado as palavras da narracao (ancoras do plano.json): interpolacao geometrica entre ancoras
// (o mar acelera como no What If escalonado) e suave nas pontas. Funcao pura do tempo.
import plano from './plano.json';
const A = plano.ancoras as [number, number][];
export const nivelEm = (t: number) => {
  if (t <= A[0][0]) return A[0][1];
  for (let i = 1; i < A.length; i++) {
    const [ta, ma] = A[i - 1], [tb, mb] = A[i];
    if (t <= tb) {
      const u0 = (t - ta) / Math.max(1e-6, tb - ta), u = u0 * u0 * (3 - 2 * u0) * 0.35 + u0 * 0.65;   // leve ease, nunca para
      return Math.exp(Math.log(ma + 1) + (Math.log(mb + 1) - Math.log(ma + 1)) * u) - 1;
    }
  }
  return A[A.length - 1][1];
};
export const tDoNivel = (m: number) => { const fps = plano.fps; for (let f = 0; f <= plano.dauer * fps; f++) if (nivelEm(f / fps) >= m) return f / fps; return 1e9; };
