// Composicao final (dono: agente HUD): cena 3D (fusao de 0,6 s entre capitulos) + painel + legendas + titulo + take + telas finais.
// tv = segundo do video; t = tOrig(tv) = segundo do original (o take de 30 s pausa a historia em 244,9 s).
// Cortes secos em 4,1 (cold open -> varanda), 97,8 e 383,3 (dentro dos mundos; em 383,3 um quadro escuro como no original) e 390,1
// (telas finais). Painel: some no cold open e nas telas finais, entra em 4,1-4,3 e sai/volta com fusao de 0,6 s no take.
import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, getInputProps, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Cena} from './Cena';
import {CAP_TAKE, Cap, DUR_INS, FUSAO, INS, capDe, noTake, tOrig} from './roteiro';
import {Abertura, Fim, LEGENDAS, LEG_TAKE, Legenda, Painel} from './hud';

for (const C of [typeof WebGL2RenderingContext !== 'undefined' ? WebGL2RenderingContext : null, typeof WebGLRenderingContext !== 'undefined' ? WebGLRenderingContext : null]) {
  if (!C || (C.prototype as any).__semParalelo) continue;
  const orig = C.prototype.getExtension;
  (C.prototype as any).getExtension = function (this: WebGLRenderingContext, nome: string) { return nome === 'KHR_parallel_shader_compile' ? null : orig.call(this, nome); };
  (C.prototype as any).__semParalelo = true;
}
(globalThis as any).__dbg = String((getInputProps() as any).dbg ?? '');

const cl = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const Canvas3D: React.FC<{t: number; cap: Cap; u: number; opacidade?: number}> = ({t, cap, u, opacidade = 1}) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{opacity: opacidade}}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 50, near: 0.1, far: 2e6, position: [0, 2, 10]}}
        gl={{antialias: false, toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace}}>
        <Cena t={t} cap={cap} u={u} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
// cena (capitulo + tempo) num instante do video
export const cenaEm = (tv: number): {cap: Cap; t: number} => noTake(tv) ? {cap: CAP_TAKE, t: tv} : {cap: capDe(tOrig(tv)), t: tOrig(tv)};

const FIM_HUD = 390.1;
// opacidade do painel (tv: segundo do video; t: do original)
const opPainel = (tv: number, t: number) => {
  if (noTake(tv)) return interpolate(tv, [INS, INS + FUSAO, INS + DUR_INS - FUSAO, INS + DUR_INS], [1, 0, 0, 1], cl);
  if (t < 4.1 || t >= FIM_HUD) return 0;
  return interpolate(t, [4.1, 4.3], [0, 1], cl);
};

export const Video: React.FC = () => {
  const tv = useCurrentFrame() / 30;
  const {cap, t} = cenaEm(tv);
  const take = cap.id === 'take';
  const ini = take ? INS : cap.s < INS ? cap.s : cap.s + DUR_INS;
  const fundindo = cap.entrada === 'funde' && tv - ini < FUSAO && tv >= ini;
  const ant = fundindo ? cenaEm(ini - 1 / 30) : null;
  const fu = fundindo ? interpolate(tv - ini, [0, FUSAO], [1, 0]) : 0;
  const to = tOrig(tv);                       // no take: 244,9 (painel congelado)
  const telas = cap.mundo === 'telas';
  const escuro = !take && to >= 383.3 && to < 383.3 + 1 / 30;   // 1 quadro escuro no corte da onda
  return (
    <AbsoluteFill style={{backgroundColor: '#05070b'}}>
      {!telas && <Canvas3D t={t} cap={cap} u={tv - INS} />}
      {ant && ant.cap.mundo !== 'telas' && <Canvas3D t={ant.t} cap={ant.cap} u={ini - 1 / 30 - INS} opacidade={fu} />}
      {escuro && <AbsoluteFill style={{backgroundColor: '#03080c', opacity: 0.9}} />}
      {telas ? <Fim t={to} /> : (
        <>
          <Painel t={to} opacidade={opPainel(tv, to)} />
          {!take && to < 7.5 && <Abertura t={to} />}
          {take ? <Legenda t={tv - INS} lista={LEG_TAKE} /> : <Legenda t={to} lista={LEGENDAS} />}
        </>
      )}
    </AbsoluteFill>
  );
};
