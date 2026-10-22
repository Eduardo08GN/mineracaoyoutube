// Composicao final (dono: agente HUD): cena 3D + painel + legendas + titulo + take inedito.
// tv = segundo do video; t = tOrig(tv) = segundo do original (o take de 30 s pausa a historia em 386,5 s).
// Transicoes do original: preto 0-0,4 com fade; corte seco para preto 5,9-6,4; fade-in da rua 6,4-7,0. Fusao de 0,6 s na entrada e na
// saida do take. Borrao direcional da cena nos chicotes (velAng da camera acima de ~60 graus/s). Sem telas finais: termina na rua.
import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, getInputProps, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Cena} from './Cena';
import {CAP_TAKE, Cap, DUR_INS, INS, capDe, noTake, poseCamera, tOrig} from './roteiro';
import {LEGENDAS, LEG_TAKE, Legenda, Painel, Titulo} from './hud';
import {claro} from './hud_dados';

for (const C of [typeof WebGL2RenderingContext !== 'undefined' ? WebGL2RenderingContext : null, typeof WebGLRenderingContext !== 'undefined' ? WebGLRenderingContext : null]) {
  if (!C || (C.prototype as any).__semParalelo) continue;
  const orig = C.prototype.getExtension;
  (C.prototype as any).getExtension = function (this: WebGLRenderingContext, nome: string) { return nome === 'KHR_parallel_shader_compile' ? null : orig.call(this, nome); };
  (C.prototype as any).__semParalelo = true;
}
(globalThis as any).__dbg = String((getInputProps() as any).dbg ?? '');

const cl = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const FUSAO = 0.6;

const Canvas3D: React.FC<{t: number; cap: Cap; u: number; estilo?: React.CSSProperties}> = ({t, cap, u, estilo}) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={estilo}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 55, near: 0.1, far: 2e6, position: [0, 1.7, 0]}}
        gl={{antialias: false, toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace}}>
        <Cena t={t} cap={cap} u={u} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// borrao dos chicotes: desvio padrao (px, em 1080p) na horizontal e na vertical, pela velocidade angular da camera
const borrao = (t: number): [number, number] => {
  const a = poseCamera(t);
  if (a.velAng < 60) return [0, 0];
  const b = poseCamera(t + 1 / 30);
  const dg = Math.abs(b.guinada - a.guinada) * 30, dp = Math.abs(b.inclinacao - a.inclinacao) * 30;
  const k = Math.min(18, (a.velAng - 60) / 22), tot = Math.max(1e-6, dg + dp);
  return [k * dg / tot, k * dp / tot];
};

// preto do original sobre a cena (o painel fica por cima)
const preto = (t: number) => (t < 0.4 ? 1 - t / 0.4 : t >= 5.9 && t < 6.4 ? 1 : t >= 6.4 && t < 7 ? 1 - (t - 6.4) / 0.6 : 0);

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const tv = frame / 30, take = noTake(tv), t = tOrig(tv), u = tv - INS;
  const capO = capDe(t);
  // camadas da cena: no take, fusao de 0,6 s com a escuridao do original (386,5) na entrada e na saida
  const camadas: React.ReactNode[] = [];
  if (take) {
    if (u < FUSAO) {
      camadas.push(<Canvas3D key="take" t={t} cap={CAP_TAKE} u={u} />);
      camadas.push(<Canvas3D key="orig" t={INS} cap={capDe(INS)} u={0} estilo={{opacity: 1 - u / FUSAO}} />);
    } else if (u > DUR_INS - FUSAO) {
      camadas.push(<Canvas3D key="orig" t={INS} cap={capDe(INS)} u={0} />);
      camadas.push(<Canvas3D key="take" t={t} cap={CAP_TAKE} u={u} estilo={{opacity: (DUR_INS - u) / FUSAO}} />);
    } else camadas.push(<Canvas3D key="take" t={t} cap={CAP_TAKE} u={u} />);
  } else {
    const [sx, sy] = borrao(t);
    const filtro = sx + sy > 0.15 ? 'url(#chicote)' : undefined;
    camadas.push(<Canvas3D key="orig" t={t} cap={capO} u={u} estilo={filtro ? {filter: filtro} : undefined} />);
    if (filtro) camadas.push(
      <svg key="f" style={{position: 'absolute', width: 0, height: 0}}>
        <defs>
          <filter id="chicote" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${sx.toFixed(2)} ${sy.toFixed(2)}`} edgeMode="duplicate" />
          </filter>
        </defs>
      </svg>,
    );
  }
  const pr = take ? 0 : preto(t);
  // painel: some no preto do inicio, no corte 5,9-6,4 e durante o take (congelado em 386,5, fusao de 0,6 s)
  const opPainel = take
    ? interpolate(tv, [INS, INS + FUSAO, INS + DUR_INS - FUSAO, INS + DUR_INS], [1, 0, 0, 1], cl)
    : t < 0.4 ? t / 0.4 : t >= 5.9 && t < 6.4 ? 0 : t < 6.7 && t >= 6.4 ? (t - 6.4) / 0.3 : 1;
  const esc = take ? 0 : claro(t);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {camadas}
      {pr > 0 && <AbsoluteFill style={{backgroundColor: '#000', opacity: pr}} />}
      <Painel t={t} opacidade={opPainel} />
      {!take && <Titulo t={t} />}
      {take ? <Legenda t={u} lista={LEG_TAKE} /> : <Legenda t={t} lista={LEGENDAS} escuro={esc} reto={t < 5.9} />}
    </AbsoluteFill>
  );
};
