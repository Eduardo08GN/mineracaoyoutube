import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useLoader, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {C} from './base';
import {SobreBox} from './take';

export type PFoto25d = {img: string; depth: string; mov?: string; fx?: string; sobre?: any; kicker?: string; _i?: number};

const FOV = 40, D = 3, ESC = 0.35;
const planoH = 2 * D * Math.tan((FOV * Math.PI) / 360) * 1.45; // overscan 1.75 (>= 1.12) para a borda esticada nunca aparecer
const planoW = planoH * (16 / 9);
const rnd = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

const Cena: React.FC<{img: string; depth: string; mov: string; p: number; f: number}> = ({img, depth, mov, p, f}) => {
  const [tex, dep] = useLoader(THREE.TextureLoader, [staticFile(img), staticFile(depth)]) as THREE.Texture[];
  tex.colorSpace = THREE.SRGBColorSpace;
  const camera = useThree((s) => s.camera);
  const e = p * p * (3 - 2 * p); // ease
  let x = 0, y = 0, z = D;
  switch (mov) {
    case 'pull': z = 2.2 + e * 1.7; break;
    case 'lateral_esq': z = 2.9; x = 0.46 - e * 0.92; break;
    case 'lateral_dir': z = 2.9; x = -0.46 + e * 0.92; break;
    case 'sobe': z = 2.9; y = -0.45 + e * 0.9; break;
    case 'desce': z = 2.9; y = 0.45 - e * 0.9; break;
    case 'orbita': { const a = -0.32 + e * 0.64; x = Math.sin(a) * 2.9; z = Math.cos(a) * 2.9; y = Math.sin(e * 3.1) * 0.15; break; }
    default: z = 3.9 - e * 1.7; x = (e - 0.5) * 0.18; // push
  }
  z *= 1 - 0.03 * Math.max(0, 1 - f / 8); // soco de zoom nos primeiros 8 quadros
  camera.position.set(x, y, z);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  return (
    <mesh>
      <planeGeometry args={[planoW, planoH, 256, 144]} />
      <meshStandardMaterial color="#000000" emissive="#ffffff" emissiveMap={tex} displacementMap={dep} displacementScale={ESC} displacementBias={-ESC / 2} />
    </mesh>
  );
};

/** FX 2D animados por cima do plano */
const Fx: React.FC<{fx: string[]; f: number; p: number}> = ({fx, f, p}) => {
  const has = (k: string) => fx.includes(k);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {(has('fumaca') || has('poeira')) && (
        <svg width="1920" height="1080" style={{position: 'absolute', filter: `blur(${has('fumaca') ? 50 : 4}px)`, mixBlendMode: has('fumaca') ? 'normal' : 'screen'}}>
          {Array.from({length: has('fumaca') ? 9 : 50}).map((_, i) => {
            const t = ((f * (has('fumaca') ? 0.5 : 0.9) * (1 + (i % 3) * 0.4) + i * 97) % 1100) / 1100;
            const cx = (i * 311) % 1920 + Math.sin(f / 50 + i) * 60;
            return has('fumaca')
              ? <ellipse key={i} cx={cx} cy={1100 - t * 1000} rx={170 + t * 160} ry={120 + t * 100} fill="#6c7078" opacity={0.28 * Math.sin(Math.PI * t)} />
              : <circle key={i} cx={(cx + f * 0.6) % 1920} cy={1080 - t * 1080} r={1.5 + (i % 3)} fill="#d8cdb8" opacity={0.5 * Math.sin(Math.PI * t)} />;
          })}
        </svg>
      )}
      {has('gas') && (
        <svg width="1920" height="1080" style={{position: 'absolute', filter: 'blur(70px)'}}>
          {Array.from({length: 8}).map((_, i) => (
            <ellipse key={i} cx={240 * i + 100 + Math.sin(f / 45 + i) * 80} cy={900 - (i % 3) * 50 + Math.cos(f / 60 + i) * 20} rx={(240 + p * 260) * (0.8 + (i % 3) * 0.2)} ry={90 + p * 90} fill={i % 2 ? C.gas : '#a9c23a'} opacity={0.2 + 0.18 * p} />
          ))}
        </svg>
      )}
      {has('fogo') && (
        <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 45% at ${50 + Math.sin(f / 9) * 4}% 105%, rgba(255,120,30,${0.55 + 0.3 * rnd(f)}) 0%, rgba(255,60,10,${0.25 + 0.15 * rnd(f + 40)}) 40%, transparent 75%)`, mixBlendMode: 'screen'}} />
      )}
      {has('faiscas') && (
        <svg width="1920" height="1080" style={{position: 'absolute', mixBlendMode: 'screen'}}>
          {Array.from({length: 45}).map((_, i) => {
            const t = ((f * (1.6 + (i % 4) * 0.5) + i * 53) % 800) / 800;
            return <circle key={i} cx={(i * 211) % 1920 + Math.sin(f / 12 + i) * 40 * t} cy={1100 - t * 1000} r={2 + (i % 3)} fill="#ffb347" opacity={(1 - t) * (0.6 + 0.4 * rnd(f + i))} style={{filter: 'drop-shadow(0 0 6px #ff7a1a)'}} />;
          })}
        </svg>
      )}
      {has('chuva_cinzas') && (
        <svg width="1920" height="1080" style={{position: 'absolute'}}>
          {Array.from({length: 70}).map((_, i) => {
            const t = ((f * (2 + (i % 5) * 0.8) + i * 71) % 1200) / 1200;
            return <ellipse key={i} cx={((i * 277) % 1920 + Math.sin(f / 30 + i) * 50 + t * 120) % 1920} cy={-60 + t * 1200} rx={2 + (i % 4)} ry={1.5 + (i % 3)} fill="#9a9a9a" opacity={0.55 * Math.sin(Math.PI * t)} />;
          })}
        </svg>
      )}
    </AbsoluteFill>
  );
};

export const Foto25d: React.FC<PFoto25d & {kit: Record<string, React.FC<any>>}> = ({img, depth, mov = 'push', fx = '', sobre, kit, _i = 0}) => {
  const f = useCurrentFrame(); const {durationInFrames, fps} = useVideoConfig();
  const p = Math.min(1, f / Math.max(1, durationInFrames - 1));
  const Sobre = sobre ? kit[sobre.tipo] : null;
  const {tipo, ...sp} = sobre ?? {};
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: 'sepia(0.2) saturate(1.08) contrast(1.1) brightness(0.82)'}}>
        <ThreeCanvas width={1920} height={1080} camera={{fov: FOV, position: [0, 0, D], near: 0.1, far: 50}} gl={{toneMapping: THREE.NoToneMapping}}>
          <Cena img={img} depth={depth} mov={mov} p={p} f={f} />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,12,16,0.5) 0%, transparent 40%, rgba(10,12,16,0.7) 100%)'}} />
      <Fx fx={fx.split(',').map((s) => s.trim())} f={f} p={p} />
      {Sobre && <SobreBox Sobre={Sobre} sp={sp} idx={_i} />}
    </AbsoluteFill>
  );
};
