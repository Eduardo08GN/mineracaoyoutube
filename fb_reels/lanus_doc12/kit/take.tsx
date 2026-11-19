import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, staticFile, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {cl} from './base';

/** Camada menor num terço lateral (alterna esq/dir por batida), ~36% da largura, fundo escuro translúcido */
export const SobreBox: React.FC<{Sobre: React.FC<any>; sp: any; idx?: number}> = ({Sobre, sp, idx = 0}) => {
  const f = useCurrentFrame();
  const esq = idx % 2 === 0;
  const sc = 0.36, w = 1920 * sc;
  const x = esq ? 60 : 1920 - w - 60;
  return (
    <AbsoluteFill style={{opacity: interpolate(f, [4, 16], [0, 1], cl)}}>
      <div style={{position: 'absolute', left: x - 16, top: 94, width: w + 32, height: 1080 * sc + 32, borderRadius: 20, background: 'rgba(10,12,16,0.62)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)'}} />
      <div style={{position: 'absolute', left: x, top: 110, width: 1920, height: 1080, transformOrigin: '0 0', transform: `scale(${sc}) translateY(${(1 - interpolate(f, [4, 16], [0, 1], cl)) * 40}px)`}}>
        <Sobre {...sp} />
      </div>
    </AbsoluteFill>
  );
};

export type PTake = {src: string; de?: number; dur?: number; sobre?: any; kicker?: string; _i?: number};

/** Vídeo real em tela cheia como cenário. Sem loop e sem espelho (proibido reaproveitar trecho):
 *  se a batida passa do fim do clipe (dur = duração do clipe em s, quando conhecida), congela o último quadro com push-in mais forte. */
export const Take: React.FC<PTake & {kit: Record<string, React.FC<any>>}> = ({src, de = 0, dur, sobre, kit, _i = 0}) => {
  const f = useCurrentFrame(); const {fps, durationInFrames} = useVideoConfig();
  const p = f / durationInFrames;
  const util = dur ? Math.max(1, Math.floor((dur - de) * fps) - 1) : Infinity; // quadros úteis do clipe
  const congelado = f >= util;
  const extra = congelado ? (f - util) / fps : 0; // segundos congelado
  const zoom = 1.04 + p * 0.1 + extra * 0.06; // push-in mais forte depois do congelamento
  const rot = Math.sin(f / 120) * 0.6 + p * 0.5;
  const video = <OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(de * fps)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />;
  const Sobre = sobre ? kit[sobre.tipo] : null;
  const {tipo, ...sp} = sobre ?? {};
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${zoom}) rotate(${rot}deg) translate(${-p * 24}px, ${p * 10}px)`, filter: 'sepia(0.28) saturate(1.08) contrast(1.1) brightness(0.78) hue-rotate(-8deg)'}}>
        {congelado ? <Freeze frame={util}>{video}</Freeze> : video}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,12,16,0.55) 0%, rgba(40,20,8,0.12) 45%, rgba(10,12,16,0.7) 100%)'}} />
      <AbsoluteFill style={{background: 'rgba(255,140,50,0.07)', mixBlendMode: 'screen'}} />
      {Sobre && <SobreBox Sobre={Sobre} sp={sp} idx={_i} />}
    </AbsoluteFill>
  );
};
