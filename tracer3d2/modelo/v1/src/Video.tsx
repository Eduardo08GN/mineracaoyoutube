// Sequenciador (Tracer3D 2.0): em cada quadro acha a batida do plano e desenha; fusao de 0,4 s com a anterior (a menos que a batida seja corte seco).
// Batida sem componente ainda = cartao provisorio com a descricao (so durante a producao).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BEATS} from './beats';
import {CENAS, KIT} from './kit';
import {Beat, PLAN} from './tempo';
import {C, F, fase, Kanal} from './ui/basis';

for (const Cl of [typeof WebGL2RenderingContext !== 'undefined' ? WebGL2RenderingContext : null, typeof WebGLRenderingContext !== 'undefined' ? WebGLRenderingContext : null]) {
  if (!Cl || (Cl.prototype as any).__semParalelo) continue;
  const orig = Cl.prototype.getExtension;
  (Cl.prototype as any).getExtension = function (this: WebGLRenderingContext, nome: string) { return nome === 'KHR_parallel_shader_compile' ? null : orig.call(this, nome); };
  (Cl.prototype as any).__semParalelo = true;
}

export const UEB = 0.4;
const SEM_SELO = new Set<string>(['06_15', '06_18', '07_10', '07_11', '07_12', '08_16', '09_01', '10_02', '10_08', '10_10', '10_11', '10_13', '10_14', '10_17', '10_18', '10_19', '11_13', '11_15', '11_20', '01_11', '05_23', '09_12', '09_13', '10_09', '11_05']);   // batidas so com foto de arquivo real: sem selo (preencher)
// ilustracoes e cartoes editoriais (nao simulacao): selo ILLUSTRATION
const ILLU = new Set<string>(['03_04', '10_06']);   // ilustracoes/cartoes editoriais: selo ILLUSTRATION (preencher)
const Provisorio: React.FC<{b: Beat; t: number}> = ({b, t}) => (
  <AbsoluteFill style={{background: C.grund2, padding: 80, color: C.papier, fontFamily: F.text, fontSize: 34}}>
    <div style={{fontFamily: F.mono, color: C.signal}}>{b.id} · {b.dono} · {t.toFixed(1)} / {(b.e - b.s).toFixed(1)} s</div>
    <div style={{marginTop: 30, maxWidth: 1500, lineHeight: 1.4}}>{b.bild}</div>
  </AbsoluteFill>
);
// ordem: cena do kit (cenas/*.json) > componente proprio (beats/) > cartao provisorio
const Zeige: React.FC<{b: Beat; tv: number}> = ({b, tv}) => {
  const cena = CENAS[b.id];
  if (cena && KIT[cena.comp]) { const K = KIT[cena.comp].C; return <K t={tv - b.s} d={b.e - b.s} b={b} p={cena.props || {}} />; }
  if (cena) return <Provisorio b={{...b, bild: `KIT: cena '${cena.comp}' nao existe no registro. ` + b.bild}} t={tv - b.s} />;
  const Comp = BEATS[b.id];
  return Comp ? <Comp t={tv - b.s} d={b.e - b.s} s={b.s} id={b.id} kap={b.kap} /> : <Provisorio b={b} t={tv - b.s} />;
};

// creditos obrigatorios dos dados (ODbL, CC BY 4.0, Copernicus) no fim do video
const Abspann: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'absolute', left: 0, right: 0, bottom: 74, textAlign: 'center', fontFamily: F.mono, fontSize: 15, lineHeight: '22px',
    color: 'rgba(233,225,207,0.55)', opacity: fase(t, 1, 2)}}>
    Daten: © OpenStreetMap-Mitwirkende (ODbL) · EOxCloudless 2017 by EOX IT Services GmbH (CC BY 4.0, enthält modifizierte Copernicus-Sentinel-Daten 2017)<br />
    Orthophotos 2021 © SPW (Service public de Wallonie), CC BY 4.0, zugeschnitten und neu komprimiert · Copernicus WorldDEM-30 © DLR e.V. 2010–2014, © Airbus Defence and Space GmbH 2014–2018, bereitgestellt von EU und ESA<br />
    NASA Blue Marble NG (R. Stöckli) · Natural Earth · historische Fotos/Pläne: gemeinfrei (Wikimedia Commons) · Texturen: Poly Haven (CC0)
  </div>
);

export const beatIndex = (tv: number) => {
  const bs = PLAN.beats;
  let i = 0;
  while (i < bs.length - 1 && bs[i + 1].s <= tv) i++;
  return i;
};

export const Video: React.FC = () => {
  const tv = useCurrentFrame() / PLAN.fps;
  const i = beatIndex(tv);
  const b = PLAN.beats[i];
  const vor = i > 0 && !b.schnitt && tv - b.s < UEB ? PLAN.beats[i - 1] : null;
  return (
    <AbsoluteFill style={{backgroundColor: C.grund}}>
      {vor && <Zeige b={vor} tv={tv} />}
      <AbsoluteFill style={{opacity: vor ? fase(tv - b.s, 0, UEB) : 1}}><Zeige b={b} tv={tv} /></AbsoluteFill>
      {/* marca d'agua: so '@<canal>' (KANAL em ui/basis), sem 'SIMULATION' (pedidos de 24/10/2026) */}
      <Kanal />
      {b === PLAN.beats[PLAN.beats.length - 1] && <Abspann t={tv - b.s} />}
    </AbsoluteFill>
  );
};
