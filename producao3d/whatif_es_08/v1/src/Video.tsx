// Video 08 completo: cada batida do plano.json e uma Sequence com a cena da sua familia; por cima, o HUD global
// (nivel do mar, paises em pe, gente debaixo d'agua, comparacao dourada), o cartao do pais que cai (em fila) e a frase cinetica.
import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import plano from './plano.json';
import {CENAS} from './cenas';
import {Beat} from './cenas/tipos';
import {lugarDe} from './cenas/cont';
import {DADOS, emPe} from './dados';
import {nivelEm, tDoNivel} from './nivel';
import {CartaoPais, Frase, Lugar, Painel} from './hud/HudMar';
import {Pronto} from './Pronto';

for (const C of [typeof WebGL2RenderingContext !== 'undefined' ? WebGL2RenderingContext : null]) {
  if (!C || (C.prototype as any).__semParalelo) continue;
  const orig = C.prototype.getExtension;
  (C.prototype as any).getExtension = function (this: WebGLRenderingContext, nome: string) { return nome === 'KHR_parallel_shader_compile' ? null : orig.call(this, nome); };
  (C.prototype as any).__semParalelo = true;
}
const FPS = plano.fps, BEATS = plano.beats as Beat[];
const LUGAR_CIDADE: Record<string, string> = {salinas: 'SALINAS, ECUADOR', bsas: 'BUENOS AIRES', cdmx: 'CIUDAD DE MÉXICO', lapaz: 'LA PAZ · EL ALTO', eureka_gelo: 'LA ANTÁRTIDA', eureka_ar: 'LOS ANDES, EN CORTE', real: 'LATINOAMÉRICA'};
// onde resistem os ultimos de cada pais (refugios calculados na G4: celulas mais povoadas acima do nivel de 99%)
const ULTIMOS: Record<string, string> = {URY: 'los últimos, en Rivera y Tacuarembó', CUB: 'los últimos, en las montañas del oriente', PRY: 'los últimos, en Pedro Juan Caballero',
  DOM: 'los últimos, en Constanza', SLV: 'los últimos, en Apaneca', NIC: 'los últimos, en Jinotega', PAN: 'los últimos, en Cerro Punta', BRA: 'los últimos, en la meseta de Brasilia',
  ARG: 'los últimos, en Jujuy y la Puna', HTI: 'los últimos, en las montañas del centro', VEN: 'los últimos, en Mérida', HND: 'los últimos, en La Esperanza', CRI: 'los últimos, en Cartago',
  CHL: 'los últimos, en Calama', MEX: 'los últimos, en Toluca', COL: 'los últimos, en el altiplano de Bogotá', GTM: 'los últimos, en los pueblos altos de San Marcos',
  ECU: 'los últimos, en los Andes al sur de Quito', BOL: 'los últimos, en El Alto y Potosí', PER: 'los últimos, en Cerro de Pasco y La Rinconada'};
const LEG = plano.legendas as {ini: number; fim: number; texto: string}[];

const Hud: React.FC = () => {
  const frame = useCurrentFrame(), t = frame / FPS, d = DADOS!;
  const L = nivelEm(t), La = nivelEm(Math.max(0, t - 1 / FPS));
  const b = BEATS.find((x) => t < x.fim) ?? BEATS[BEATS.length - 1];
  // cartoes em fila: cada pais no instante em que o nivel cruza os seus 99% (>= 1,9 s entre um e outro)
  const fila: {k: string; ini: number}[] = [];
  Object.keys(d.paises).filter((k) => k !== 'PRI').map((k) => ({k, tc: tDoNivel(d.paises[k].l99)})).filter((c) => c.tc < 1e8).sort((a, b) => a.tc - b.tc)
    .forEach((c) => fila.push({k: c.k, ini: Math.max(c.tc, fila.length ? fila[fila.length - 1].ini + 1.9 : 0)}));
  const foco = fila.filter((c) => c.ini <= t && t - c.ini < 2.6).pop();
  const posicao = foco ? emPe(d, d.paises[foco.k].l99 - 0.01).length : 0;
  // frase cinetica: so as frases curtas (a narracao carrega as longas); entra com a voz e sai antes da proxima
  const fr = LEG.find((x) => t >= x.ini - 0.1 && t < x.fim + 0.6 && x.texto.split(' ').length <= 9);
  const eureka = b.familia.startsWith('eureka');
  return (
    <>
      <div style={{opacity: eureka ? 0.0 : 1}}><Painel L={L} Lant={La} tVideo={t} tTroca={tDoNivel} /></div>
      <Lugar texto={b.familia === 'cont' ? lugarDe(b.reg) : LUGAR_CIDADE[b.familia] ?? ''} idade={t - b.ini} />
      {foco && <CartaoPais k={foco.k} idade={t - foco.ini} posicao={posicao} lugar={ULTIMOS[foco.k] ?? ''} />}
      {fr && b.familia !== 'real' && <Frase texto={fr.texto} idade={t - fr.ini + 0.1} dur={fr.fim - fr.ini + 0.7} heroi={[]} />}
    </>
  );
};

export const Video: React.FC = () => (
  <Pronto>
    <AbsoluteFill style={{background: '#0b1a2e'}}>
      {BEATS.map((b) => {
        const C = CENAS[b.familia], f0 = Math.round(b.ini * FPS), f1 = Math.round(b.fim * FPS);
        return (
          <Sequence key={b.id} from={f0} durationInFrames={Math.max(1, f1 - f0)} layout="none">
            <Quadro b={b} C={C} />
          </Sequence>
        );
      })}
      <Hud />
    </AbsoluteFill>
  </Pronto>
);
// cada batida le o tempo GLOBAL (a Sequence zera o quadro local)
const Quadro: React.FC<{b: Beat; C: React.FC<any>}> = ({b, C}) => {
  const fl = useCurrentFrame(), t = b.ini + fl / FPS, u = Math.min(1, Math.max(0, (t - b.ini) / (b.fim - b.ini)));
  return <AbsoluteFill><C beat={b} t={t} u={u} L={nivelEm(t)} Lant={nivelEm(t - 1 / FPS)} /></AbsoluteFill>;
};
