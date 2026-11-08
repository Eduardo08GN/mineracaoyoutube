// Composicao do batedor: cena 3D (Malecon + Look) e HUD por cima. Tudo pelo quadro (useCurrentFrame).
import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, getInputProps, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Look} from './look/Look';
import {Malecon, perfilMalecon, luzDoP} from './mundo/malecon';
import {FONTE, IDX_VOCE, PESSOAS, Y_MAL, alturaJato, estadoGente, linhaAgua, nivelMar} from './mundo/dados';
import {estadoQuadro, FPS} from './roteiro';
import {Ancora, FraseCinetica, Leitura, Lugar, Painel, RotulosPresos} from './hud/Hud';
import {fmtDec, pesoKg} from './fisica';

// o Chrome do render compila shaders em paralelo e o primeiro quadro de cada aba saia sem materiais (licao do video 6)
for (const C of [typeof WebGL2RenderingContext !== 'undefined' ? WebGL2RenderingContext : null, typeof WebGLRenderingContext !== 'undefined' ? WebGLRenderingContext : null]) {
  if (!C || (C.prototype as any).__semParalelo) continue;
  const orig = C.prototype.getExtension;
  (C.prototype as any).getExtension = function (this: WebGLRenderingContext, nome: string) { return nome === 'KHR_parallel_shader_compile' ? null : orig.call(this, nome); };
  (C.prototype as any).__semParalelo = true;
}
(globalThis as any).__dbg = String((getInputProps() as any).dbg ?? '');

// rotulos presos por plano (ancoras = mesmas contas do mundo)
const ancoras = (id: string, tw: number, p: number): Ancora[] => {
  const n = nivelMar(p);
  const voce = estadoGente(PESSOAS[IDX_VOCE], tw, p);
  const kg = Math.floor(pesoKg(p) + 0.125);   // o mesmo inteiro que o odometro do painel mostra
  if (id === 'A') {
    const zl = Math.min(-1, linhaAgua(p));
    return [
      {id: 'mar', pos: [16, n, zl], titulo: 'NIVEL DEL MAR', valor: `+${fmtDec(n - 0.04, 2)} m`, dx: 150, dy: -120, ini: 0.6},
      {id: 'fuente', pos: [FONTE[0], Y_MAL + 1.4 + alturaJato(p), FONTE[1]], titulo: 'EL CHORRO DE LA FUENTE', valor: `${fmtDec(alturaJato(p), 1)} m`, dx: -190, dy: -70, ini: 1.6},
    ];
  }
  if (id === 'B') {
    return [
      {id: 'voce', pos: [voce.x, voce.y + 1.95, voce.z], titulo: 'TÚ', valor: `${kg} kg`, dx: 120, dy: -150, ini: 0.5},
      {id: 'agua', pos: [-6, Math.max(n, Y_MAL), 0.4], titulo: n > Y_MAL ? 'EL AGUA SOBRE EL MALECÓN' : 'EL MAR SUBE', valor: n > Y_MAL ? `${fmtDec(n - Y_MAL, 2)} m` : `+${fmtDec(n - 0.04, 2)} m`, dx: -170, dy: 120, ini: 1.2},
    ];
  }
  return [
    {id: 'fuente', pos: [FONTE[0], Y_MAL + 1.4 + Math.min(alturaJato(p), 6.5), FONTE[1]], titulo: 'EL AGUA SUBE', valor: `${fmtDec(alturaJato(p), 1)} m`, dx: -200, dy: -40, ini: 0.3},
    {id: 'voce', pos: [voce.x, voce.y + 1.95, voce.z], titulo: 'TÚ PESAS', valor: `${kg} kg`, dx: 150, dy: -110, ini: 0.9},
  ];
};

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const q = estadoQuadro(frame), qa = estadoQuadro(Math.max(0, frame - 1));
  const semHud = String((getInputProps() as any).hud ?? '1') === '0';
  return (
    <AbsoluteFill style={{backgroundColor: '#05070b'}}>
      <AbsoluteFill>
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 50, near: 0.2, far: 6000, position: [0, 20, -40]}}
          gl={{antialias: false, toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace}}>
          <Malecon tw={q.tw} p={q.p} plano={q.plano} u={q.u} />
          <Look perfil={perfilMalecon(q.p, q.plano)} sol={luzDoP(q.p).sol} />
        </ThreeCanvas>
      </AbsoluteFill>
      {!semHud && (
        <>
          <Leitura />
          <RotulosPresos plano={q.plano} u={q.u} tPlano={q.tPlano} lista={ancoras(q.plano.id, q.tw, q.p)} />
          <Painel p={q.p} pAnt={qa.p} tVideo={q.t} />
          <Lugar tVideo={q.t} />
          <FraseCinetica tVideo={q.t} />
        </>
      )}
    </AbsoluteFill>
  );
};
export {FPS};
