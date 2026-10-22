// Short vertical 1080x1920 a partir do video final 16:9 (sem re-render da cena): fundo desfocado do proprio video, video na largura
// toda sem a faixa das legendas gravadas, gancho no topo e legendas grandes embaixo do video.
import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as plex} from '@remotion/google-fonts/IBMPlexSans';
import {loadFont as serif} from '@remotion/google-fonts/SourceSerif4';
import {Short} from './shorts';

const {fontFamily: sans} = plex('normal', {weights: ['500', '600'], subsets: ['latin', 'latin-ext']});
const {fontFamily: num} = serif('normal', {weights: ['600'], subsets: ['latin', 'latin-ext']});
const {fontFamily: ital} = serif('italic', {weights: ['400'], subsets: ['latin', 'latin-ext']});
const cl = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const CORTE = 900;                    // altura util do quadro 16:9 (abaixo disso ficam as legendas gravadas)
const LARG = 1120;                    // largura do quadro 16:9 na tela (corta 20 px de cada lado; o HUD fica inteiro com margem)
const ALT = Math.round(LARG * CORTE / 1920), Y_VIDEO = 680;

export const ShortV: React.FC<{s: Short}> = ({s}) => {
  const f = useCurrentFrame(), {fps, durationInFrames} = useVideoConfig(), t = f / fps;
  const fade = interpolate(f, [0, 8, durationInFrames - 15, durationInFrames - 1], [0, 1, 1, 0], cl);
  const l = s.leg.find((x) => t >= x.s && t < x.e);
  const opL = l ? interpolate(t, [l.s, l.s + 0.25, l.e - 0.25, l.e], [0, 1, 1, 0], cl) : 0;
  const ganchoIn = interpolate(t, [0, 0.35], [0, 1], cl), ganchoY = interpolate(t, [0, 0.35], [24, 0], cl);
  return (
    <AbsoluteFill style={{backgroundColor: '#05070b', opacity: fade}}>
      {/* fundo: o proprio video ampliado, desfocado e escurecido */}
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <OffthreadVideo src={staticFile(s.arq)} muted style={{position: 'absolute', height: 1920, width: 3413, left: -1166, top: 0,
          filter: 'blur(38px) brightness(0.42) saturate(1.2)', transform: 'scale(1.1)'}} />
      </AbsoluteFill>
      {/* video na largura toda, sem a faixa de baixo */}
      <div style={{position: 'absolute', left: 0, top: Y_VIDEO, width: 1080, height: ALT, overflow: 'hidden', borderRadius: 18,
        boxShadow: '0 20px 60px rgba(0,0,0,.6)'}}>
        <OffthreadVideo src={staticFile(s.arq)} style={{position: 'absolute', left: -(LARG - 1080) / 2, top: 0, width: LARG, height: LARG * 9 / 16,}} />
      </div>
      {/* canal + gancho */}
      <div style={{position: 'absolute', top: 210, width: '100%', textAlign: 'center', fontFamily: sans, fontWeight: 600, fontSize: 30,
        letterSpacing: '0.18em', color: '#f2b45a'}}>¿QUÉ PASARÍA SI? 3D</div>
      <div style={{position: 'absolute', top: 290, left: 60, right: 60, textAlign: 'center', fontFamily: num, fontSize: 78, lineHeight: 1.12,
        color: 'white', whiteSpace: 'pre-line', opacity: ganchoIn, transform: `translateY(${ganchoY}px)`, textShadow: '0 4px 30px rgba(0,0,0,.7)'}}>{s.gancho}</div>
      {/* legenda grande embaixo do video */}
      {l && <div style={{position: 'absolute', top: Y_VIDEO + ALT + 70, left: 70, right: 70, textAlign: 'center', fontFamily: ital, fontSize: 60,
        lineHeight: 1.2, color: 'white', opacity: opL, textShadow: '0 3px 18px rgba(0,0,0,.8)'}}>{l.txt}</div>}
    </AbsoluteFill>
  );
};
