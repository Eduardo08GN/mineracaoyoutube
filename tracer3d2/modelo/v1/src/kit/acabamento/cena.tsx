// Acabamento: camada opcional de acabamento visual em 3 niveis de custo, para cenas 3D do Tracer3D 2.0.
//   leve  : so pos-processo. Look com AgX, LUT de epoca (1870, gerada por codigo), grao, vinheta e bloom so nos emissivos. Custo ~0.
//   medio : leve + N8AO, nevoa de perspectiva aerea na cor do clima, ceu HDRI fotografico com luz de ambiente (IBL), sol medido no
//           HDRI e (opcional) detalhe PBR de chao (lama, grama, neve, pedra) sobre o terreno da cena.
//   heroi : medio + god rays. Os componentes pesados (<SoldadosRig>, <Arvores>, <Fumaca>) sao exportados a parte: a cena escolhe onde
//           usa-los (so nas poucas batidas escolhidas pelo planejador) e `nivelHeroi(nivel)` diz se deve.
// Uso mais simples (troca direta do `Bild` das ineditas):
//   <BildAcab nivel="medio" clima="inverno" chao="neve" {...mesmas props do Bild}> ...cena... </BildAcab>
// Dentro de um Canvas proprio: <Acabamento nivel clima sol ...> ...cena... </Acabamento>. nivel='off' devolve o `Bild` original.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Bild, BildProps, HIMMEL_TAG} from '../../welt/f_szene';
import {Himmel, Kamera, Leinwand, Sonne, Umgebung, V3} from '../../welt/t_szene';
import {LokalesClipping} from '../../welt/t_geschuetz';
import type {Perfil} from '../../look/Look';
import {CLIMAS, Clima, Nivel, dirSol, rotParaAzimute} from './clima';
import {lutEpoca} from './epoca';
import {LookAcab, PerfilAcab} from './look_acab';
import {CeuFoto} from './ceu';
import {DetalheNaCena, NomeChao, OpcChao} from './chao';

export type NivelAcab = Nivel | 'off';
export const nivelHeroi = (n: NivelAcab) => n === 'heroi';
export const nivelMedio = (n: NivelAcab) => n === 'medio' || n === 'heroi';

export type SolAcab = {azimut?: number; hoehe?: number; staerke?: number; farbe?: string};
export type OpcAcab = {
  nivel?: NivelAcab; clima?: Clima;
  sol?: SolAcab;                        // azimute (graus, norte = 0, horario) do sol; no medio/heroi a elevacao vem do HDRI (sol.hoehe forca outra)
  chao?: NomeChao | false; chaoOpc?: OpcChao;   // detalhe PBR sobre os terrenos da cena (medio/heroi)
  ao?: {raio?: number; forca?: number} | false; // N8AO (medio/heroi)
  raios?: number;                       // god rays (heroi); padrao = do clima
  grao?: number;                        // forca do grao (padrao = do clima; 0 desliga)
};

// perfil do Look: o da cena + o que o nivel acrescenta. Funcao pura.
export const perfilAcab = (nivel: NivelAcab, clima: Clima, p: Perfil = {}, o: OpcAcab = {}): PerfilAcab => {
  const C = CLIMAS[clima];
  const base: PerfilAcab = {...p, lut: lutEpoca(C.epoca), lutN: 17, lutForca: 1, grao: o.grao ?? C.grao, limiar: Math.max(p.limiar ?? 1.0, 1.0),
    vinheta: Math.max(p.vinheta ?? 0, C.vinheta * 0.9)};
  if (nivel === 'leve' || nivel === 'off') return base;
  const aoo = o.ao === false ? null : o.ao ?? {};
  const medio: PerfilAcab = {...base, ao: !!aoo, aoRaio: aoo?.raio ?? 3, aoForca: aoo?.forca ?? 1.6,
    nevoa: {cor: C.nevoa.cor, densidade: p.nevoa?.densidade ?? C.nevoa.densidade, max: p.nevoa?.max ?? C.nevoa.max}};
  if (nivel === 'medio') return medio;
  return {...medio, raios: o.raios ?? C.raios};
};

export type AcabamentoProps = OpcAcab & Pick<BildProps, 'sonne' | 'himmel' | 'hemi' | 'env' | 'schatten' | 'mitte' | 'radius' | 'strahlen'> & {perfil?: Perfil; children?: React.ReactNode};

export const Acabamento: React.FC<AcabamentoProps> = ({nivel = 'medio', clima = 'nublado', sol, chao, chaoOpc, ao, raios, grao, perfil = {}, sonne, himmel, hemi, env = 0.35,
  schatten = false, mitte = [0, 0, 0], radius = 140, strahlen = true, children}) => {
  const C = CLIMAS[clima], medio = nivelMedio(nivel);
  const az = sol?.azimut ?? sonne?.azimut ?? 235;
  const elev = medio ? (sol?.hoehe ?? C.elevLuz) : (sonne?.hoehe ?? 36);
  const dir = useMemo(() => dirSol(az, elev) as V3, [az, elev]);
  const forca = medio ? (sol?.staerke ?? C.sol.forca) : (sonne?.staerke ?? 3.2);
  const cor = medio ? (sol?.farbe ?? C.sol.cor) : (sonne?.farbe ?? '#ffe2bd');
  const pf = useMemo(() => perfilAcab(nivel, clima, perfil, {ao, raios, grao}), [nivel, clima, JSON.stringify(perfil), ao === false ? -1 : ao?.raio, ao === false ? -1 : ao?.forca, raios, grao]);   // eslint-disable-line react-hooks/exhaustive-deps
  const dbg = String((globalThis as any).__dbg ?? '');   // testes: semCeu | semDet | semSol | semHemi
  const hm = medio ? C.hemi : (hemi ?? ['#8d9aa6', '#4a4a40', 0.5]);
  return (
    <>
      {medio && !dbg.includes('semCeu') ? <CeuFoto clima={clima} rot={rotParaAzimute(clima, az)} /> : himmel && <Himmel {...himmel} sonne={sonne ? dir : himmel.sonne} />}
      {sonne !== null && !dbg.includes('semSol') && <Sonne richtung={dir} staerke={forca} farbe={cor} mitte={mitte} radius={radius} schatten={schatten} aufloesung={2048} />}
      <hemisphereLight args={[hm[0], hm[1], hm[2]]} />
      {!medio && env > 0 && <Umgebung staerke={env} />}
      {children}
      {medio && chao !== false && !dbg.includes('semDet') && <DetalheNaCena nome={chao || C.chao} {...chaoOpc} />}
      <LookAcab perfil={pf} sol={(sonne !== null) && strahlen && pf.raios ? new THREE.Vector3(...dir) : undefined} />
    </>
  );
};

export type BildAcabProps = BildProps & OpcAcab;
// substitui o `Bild` das ineditas: mesmas props (+ nivel, clima, sol, chao...). nivel='off' = `Bild` original, sem nenhuma mudanca.
export const BildAcab: React.FC<BildAcabProps> = ({nivel = 'medio', clima = 'nublado', sol, chao, chaoOpc, ao, raios, grao, ...b}) => {
  if (nivel === 'off') return <Bild {...b} />;
  const dbg = (globalThis as any).__fdbg;
  const kam = dbg && dbg.pos ? {...b.kam, ...dbg} : b.kam;
  return (
    <Leinwand schatten={b.schatten} hintergrund={b.hintergrund ?? '#0d0f12'}>
      <Kamera k={kam} />
      {b.clipping && <LokalesClipping />}
      <Acabamento nivel={nivel} clima={clima} sol={sol} chao={chao} chaoOpc={chaoOpc} ao={ao} raios={raios} grao={grao} perfil={b.perfil}
        sonne={b.sonne === undefined ? {azimut: 235, hoehe: 36} : b.sonne} himmel={b.himmel === undefined ? HIMMEL_TAG : b.himmel ?? undefined} hemi={b.hemi} env={b.env} schatten={b.schatten} mitte={b.mitte} radius={b.radius} strahlen={b.strahlen}>
        {b.children}
      </Acabamento>
    </Leinwand>
  );
};
