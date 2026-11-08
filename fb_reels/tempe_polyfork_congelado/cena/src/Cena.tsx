// Cena 3D do batedor: ThreeCanvas 1080x1920, Look (AO, nevoa, bloom, AgX, DoF, cor seletiva) e os tres estagios. Funcao pura do estagio.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {ContactShadows, AccumulativeShadows, RandomizedLight} from '@react-three/drei';
import {Look, Perfil} from './mundo/look';
import {PathLook} from './mundo/pt';
import modo from './modo.json';
import {Ambiente, Ceu, Luz, Nuvens} from './mundo/ceu';
import {Agua, AguaCfg, Chao, Chuva, Respingos} from './mundo/terra';
import {Acampamento, Alamo, Deserto, Vizinhas} from './mundo/props';
import {Homem} from './mundo/homem';
import {AGUA_B, AGUA_C, Estagio, GALHO, TX, TZ} from './mundo/estagios';

const CamDoQuadro: React.FC<{E: Estagio}> = ({E}) => {
  const {camera, size} = useThree(); const c = camera as THREE.PerspectiveCamera;
  c.fov = E.cam.fov; c.aspect = size.width / size.height; c.position.set(...E.cam.pos); c.lookAt(...E.cam.alvo); c.updateProjectionMatrix(); c.updateMatrixWorld();
  return null;
};

// agua por estagio: B = barrenta azul-noite com frente de espuma; C = marrom larguissima, dessaturada
const AGUA: Record<'B' | 'C', AguaCfg> = {
  B: {nivel: AGUA_B, fundo: '#16100b', meio: '#2a1f16', crista: '#54432f', espuma: '#f1ead6', amp: 0.32, comp: 1.5, fluxo: 0.4, espumaLim: 0.74, ana: {bandas: 2.0, stream: 1.0, anel: 1.0, ph: 1.3, lmin: 0.45}, vesp: [TX, TZ], rough: 0.62, env: 0.25,
    circulos: [[TX, TZ, 2.1], [TX + 1.05, TZ + 0.25, 0.8], [-6.2, -0.4, 2.0], [-5.5, -1.0, 1.4], [-2.6, -4.2, 1.3], [-3.6, -2.5, 1.3], [0.8, -6.2, 1.3], [-3.0, 0.6, 1.0], [3.8, -4.0, 0.9]], esteiras: [[-6.2, -0.4, 1.8], [-5.5, -1.0, 1.4], [-2.6, -4.2, 1.2], [-3.6, -2.5, 1.2], [0.8, -6.2, 1.2], [-3.0, 0.6, 0.9], [3.8, -4.0, 0.8]], frente: {z: -6.0, larg: 1.1}},
  C: {nivel: AGUA_C, fundo: '#58391f', meio: '#764f2c', crista: '#97703f', espuma: '#e9dcc0', amp: 0.5, comp: 2.6, fluxo: 0.4, espumaLim: 0.94, ana: {bandas: 2.2, stream: 0.3, anel: 0.8, ph: 0.4, lmin: 1.3}, vesp: [TX, TZ], rough: 0.78, env: 0.1,
    circulos: [[TX, TZ, 2.6], [-17, -12, 2.2], [14, -16, 2.2], [-9, -26, 2.2], [30, -5, 2.2], [-28, -6, 2.2]]},
};

const PT = modo.gi === 'pt';

export const Cena: React.FC<{E: Estagio}> = ({E}) => {
  const {width, height} = useVideoConfig();
  const foco = useMemo(() => new THREE.Vector3(...(E.id === 'A' ? [0.4, 0.8, -1.4] : E.id === 'B' ? [0.2, 2.6, -3.1] : [GALHO[0], GALHO[1] + 0.5, GALHO[2]]) as [number, number, number]), [E]);
  const camV = new THREE.Vector3(...E.cam.pos);
  const perfil: Perfil = {ao: true, bloom: E.look.bloom, limiar: E.look.limiar, saturacao: E.look.sat, contraste: E.look.contraste, brilho: E.look.brilho, vinheta: E.look.vinheta,
    nevoa: {cor: E.look.nevoa, densidade: E.look.nevoaD, max: E.look.nevoaMax}, raios: E.look.raios ?? 0, dof: E.look.dof, seletiva: E.look.seletiva};
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: E.cam.fov, near: 0.15, far: 20000, position: E.cam.pos}}
        gl={{antialias: false, toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace, preserveDrawingBuffer: PT}}>
        <CamDoQuadro E={E} />
        <Ambiente E={E} />
        <Ceu E={E} />
        <Nuvens E={E} />
        <Luz E={E} foco={foco} area={E.id === 'C' ? 16 : 14} />
        <Chao />
        <Deserto submerso={0} tint={E.id === 'B' ? '#2f3f6e' : undefined} evita={E.id === 'B' ? E.cam.pos : undefined} />
        <Alamo ver={E.id} />
        <Vizinhas caidas={E.id === 'C'} />
        <Acampamento ver={E.id} />
        {E.id === 'A' && <Homem modo="sentado" pos={[0.9, 0, 0.1]} rotY={Math.PI + 0.35} quadrilY={0.58} />}
        {E.id === 'B' && <Homem modo="abraco" pos={[TX + 0.85, 0, TZ + 0.2]} rotY={-1.88} quadrilY={AGUA_B + 1.4} />}
        {E.id === 'C' && <Homem modo="galho" pos={[GALHO[0], 0, GALHO[2]]} rotY={Math.PI} quadrilY={GALHO[1] + 0.13} />}
        {E.id !== 'A' && <Agua c={AGUA[E.id]} />}
        {E.chuva > 0 && <Chuva centro={camV} eixo="x" />}
        {E.id === 'B' && <><Respingos c={AGUA.B} n={70} x={[-6, 2.2]} z={[-5.5, -0.8]} />
        {/* luz de recorte no homem do B: quente (brilho da cidade) de um lado, fria (lua) do outro, sem sombra */}
        <pointLight position={[0.9, 3.9, -4.6]} color="#ff9a55" intensity={8} distance={7} decay={2} />
        <pointLight position={[1.6, 4.1, -1.9]} color="#8fb8ff" intensity={7} distance={7} decay={2} /></>}
        {PT ? <PathLook E={E} perfil={{bloom: E.look.bloom, limiar: E.look.limiar, sat: E.look.sat, contraste: E.look.contraste, brilho: E.look.brilho, vinheta: E.look.vinheta, seletiva: E.look.seletiva, grao: 0.1}} /> : (
          <>
            {/* plano B (modo.json gi = "barato"): sombra de contato acumulada e suave no lugar do path tracer; n8ao e o resto estao no Look */}
            <AccumulativeShadows temporal={false} frames={48} alphaTest={0.9} scale={26} position={[foco.x, 0.03, foco.z]} color={E.id === 'B' ? '#050912' : '#2a1a10'} opacity={0.85}>
              <RandomizedLight amount={8} radius={5} ambient={0.45} intensity={1} position={[E.key.dir[0] * 20, E.key.dir[1] * 20 + 6, E.key.dir[2] * 20]} bias={0.001} />
            </AccumulativeShadows>
            <ContactShadows position={[foco.x, 0.04, foco.z]} scale={20} blur={2.2} far={4} opacity={0.5} resolution={1024} />
            <Look perfil={perfil} sol={E.sol ? new THREE.Vector3(...E.sol) : undefined} />
          </>
        )}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
