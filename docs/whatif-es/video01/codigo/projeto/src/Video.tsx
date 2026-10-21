// Composicao final: cena 3D com look cinematografico + painel (UN DÍA DURA) + legendas + telas finais.
// Transicoes como no original: fusao de 0,6 s entre mundos (dois canvases sobrepostos so nesse trecho), corte seco em 0:04 e 7:15,
// e o paredao continua o plano do "sin peso".
import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, getInputProps, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {loadFont as plex} from '@remotion/google-fonts/IBMPlexSans';
import {loadFont as serif} from '@remotion/google-fonts/SourceSerif4';
import {Cena} from './Cena';
import {CAPS, Cap, FUSAO, capDe} from './roteiro';
import {comparaTxt, diaMin, fmtDia, pesoTxt, velTxt, fatorPeso} from './fisica';
import LEG from './legendas.json';

// Sem compilacao paralela de shaders (ver erros-pipeline.md, item 40).
for (const C of [typeof WebGL2RenderingContext !== 'undefined' ? WebGL2RenderingContext : null, typeof WebGLRenderingContext !== 'undefined' ? WebGLRenderingContext : null]) {
  if (!C || (C.prototype as any).__semParalelo) continue;
  const orig = C.prototype.getExtension;
  (C.prototype as any).getExtension = function (this: WebGLRenderingContext, nome: string) { return nome === 'KHR_parallel_shader_compile' ? null : orig.call(this, nome); };
  (C.prototype as any).__semParalelo = true;
}

// chaves de depuracao vindas de --props (ex.: {"dbg":"semFonte,semBloom"})
(globalThis as any).__dbg = String((getInputProps() as any).dbg ?? '');

const {fontFamily: sans} = plex('normal', {weights: ['400', '500'], subsets: ['latin', 'latin-ext']});
const {fontFamily: num} = serif('normal', {weights: ['400'], subsets: ['latin', 'latin-ext']});
const {fontFamily: ital} = serif('italic', {weights: ['400'], subsets: ['latin', 'latin-ext']});
const ITAL = {fontFamily: ital, fontStyle: 'italic' as const};

const TITULO = '¿Qué pasaría si la Tierra girara\ncada vez más rápido y no pudiera parar?';
const op = (t: number, a: number, b: number, f = 0.35) => interpolate(t, [a, a + f, b - f, b], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const inclinacao = (m: number, lat: number) => {
  const ac = 0.0339 * (1440 / m) ** 2, f = (lat * Math.PI) / 180;
  return Math.round((Math.atan2(ac * Math.sin(f), Math.max(0.01, 9.81 - ac * Math.cos(f))) * 180) / Math.PI);
};

const Painel: React.FC<{t: number}> = ({t}) => {
  const cap = capDe(t);
  if (cap.mundo === 'texto' || t < 4) return null;
  const T = diaMin(t);
  const espaco = cap.mundo === 'espaco';
  let l2 = espaco ? velTxt(T) : pesoTxt(T, cap.lat);
  if (cap.id === 'santamonica') l2 += ` · EL SUELO SE SIENTE INCLINADO ${inclinacao(T, cap.lat)}°`;
  const l4 = espaco && fatorPeso(T) <= 0 ? comparaTxt(T).replace('EL ECUADOR SE MUEVE ', '') : comparaTxt(T);
  return (
    <div style={{position: 'absolute', left: 92, top: 82, color: 'white', textShadow: '0 1px 14px rgba(0,0,0,.5)'}}>
      <div style={{fontFamily: sans, fontSize: 21, letterSpacing: 4.5, fontWeight: 500}}>UN DÍA DURA</div>
      <div style={{fontFamily: num, fontSize: 96, lineHeight: 1.05, marginTop: 4, fontVariantNumeric: 'tabular-nums'}}>{fmtDia(T)}</div>
      <div style={{fontFamily: sans, fontSize: 19, letterSpacing: 3.4, marginTop: 28, opacity: 0.92}}>{l2}</div>
      <div style={{fontFamily: sans, fontSize: 19, letterSpacing: 3.4, marginTop: 11, opacity: 0.92}}>{cap.local}</div>
      <div style={{fontFamily: sans, fontSize: 19, letterSpacing: 3.4, marginTop: 11, color: '#f2b45a', maxWidth: 1150}}>{l4}</div>
    </div>
  );
};

const Legenda: React.FC<{t: number}> = ({t}) => {
  const l = (LEG as {s: number; e: number; txt: string}[]).find((x) => t >= x.s && t < x.e);
  if (!l) return null;
  return (
    <div style={{position: 'absolute', width: '100%', bottom: 66, textAlign: 'center', opacity: op(t, l.s, l.e)}}>
      <span style={{...ITAL, fontSize: 44, color: 'white', padding: '14px 44px', borderRadius: 40,
        background: 'radial-gradient(ellipse, rgba(14,16,22,.5) 0%, rgba(14,16,22,0) 72%)', textShadow: '0 2px 12px rgba(0,0,0,.6)'}}>{l.txt}</span>
    </div>
  );
};

const Centro: React.FC<{t: number; a: number; b: number; children: React.ReactNode; tam?: number; top?: string; fade?: number; fonte?: object}> =
  ({t, a, b, children, tam = 48, top = '45%', fade = 0.5, fonte = ITAL}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center', opacity: op(t, a, b, fade)}}>
    <div style={{...fonte, fontSize: tam, color: 'white', textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.25, padding: '18px 60px', borderRadius: 30,
      background: 'radial-gradient(ellipse, rgba(10,12,18,.55) 0%, rgba(10,12,18,0) 70%)', textShadow: '0 2px 24px rgba(0,0,0,.55)'}}>{children}</div>
  </div>
);

// telas finais como no original: corte seco, textos no alto (o terco de baixo fica livre para os cards do YouTube)
const Fim: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{background: '#0b0d12'}}>
    <Centro t={t} a={435} b={439.3} tam={60} top="45%" fade={0.01} fonte={{fontFamily: num}}>Empezaste con un día de 24 horas.</Centro>
    <div style={{position: 'absolute', left: 0, right: 0, top: '22%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, opacity: op(t, 439.5, 447.5, 0.4), padding: '0 300px'}}>
      <div style={{fontFamily: num, fontSize: 52, color: 'white'}}>¿Algo de esto es real?</div>
      <div style={{fontFamily: sans, fontSize: 25, lineHeight: 1.6, color: 'rgba(255,255,255,.85)', textAlign: 'center', opacity: interpolate(t, [440.8, 442], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
        Los números son reales: hoy el ecuador gira a 1.670 km/h; con un día de 84 minutos no pesarías nada y con unos 60 minutos
        el suelo iría más rápido que la velocidad de escape. Lo que no es real: nada puede acelerar así la Tierra. La velocidad del agua,
        los terremotos y el final son una suposición. En realidad, el día se alarga 1,8 milisegundos por siglo.
      </div>
      <div style={{fontFamily: sans, fontSize: 24, fontWeight: 500, color: 'white', opacity: interpolate(t, [442.5, 443.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
        ¿Qué «qué pasaría si» hacemos ahora? Dínoslo en los comentarios.
      </div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: '18%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: op(t, 447.8, 457.5, 0.4)}}>
      <div style={{fontFamily: num, fontSize: 56, color: 'white', textAlign: 'center', lineHeight: 1.25}}>Ahora mira qué pasaría<br />si te volvieras más pesado.</div>
      <div style={{fontFamily: sans, fontSize: 19, letterSpacing: 4, color: '#a9b6ff'}}>SUSCRÍBETE PARA MÁS «QUÉ PASARÍA SI»</div>
    </div>
  </AbsoluteFill>
);

const Canvas3D: React.FC<{t: number; cap: Cap; opacidade?: number}> = ({t, cap, opacidade = 1}) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{opacity: opacidade}}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 55, near: 0.1, far: 9000, position: [0, 2, 10]}}
        gl={{antialias: false, toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace}}>
        <Cena t={t} cap={cap} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const cap = capDe(t);
  const i = CAPS.indexOf(cap), ant = i > 0 ? CAPS[i - 1] : null;
  const fundindo = !!ant && cap.entrada === 'funde' && ant.mundo !== 'texto' && t - cap.s < FUSAO;
  const fu = fundindo ? interpolate(t - cap.s, [0, FUSAO], [1, 0]) : 0;
  // camera engolida pelo paredao (5:12 em diante): luz azulada de dentro da agua
  const agua = cap.id === 'paredao' ? interpolate(t, [311.5, 313], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#05070b'}}>
      {cap.mundo !== 'texto' && <Canvas3D t={t} cap={cap} />}
      {fundindo && <Canvas3D t={t} cap={ant!} opacidade={fu} />}
      {agua > 0 && <AbsoluteFill style={{opacity: agua * 0.92, background: 'radial-gradient(ellipse at 50% 0%, rgba(150,220,230,.85) 0%, rgba(40,130,150,.9) 45%, rgba(10,55,75,.97) 100%)'}} />}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 14% 14%, rgba(6,9,15,.55) 0%, rgba(6,9,15,0) 36%)'}} />
      <Painel t={t} />
      {t < 4 && <Centro t={t} a={0.4} b={3.9} tam={56} top="44%">En 7 minutos, esto es la Tierra.</Centro>}
      <Centro t={t} a={4.4} b={7.9} tam={52} top="45%" fonte={{fontFamily: num}}>{TITULO}</Centro>
      <Legenda t={t} />
      {cap.mundo === 'texto' && <Fim t={t} />}
    </AbsoluteFill>
  );
};
