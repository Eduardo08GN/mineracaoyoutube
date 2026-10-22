// Cena 3D: monta o mundo do capitulo. Cada mundo (src/mundo/<nome>.tsx, um dono por arquivo) controla a propria camera e o proprio
// ceu (CeuLugar de ./mundo/ceu) e exporta: componente <X t /> e perfilX(t) para o look.
import React from 'react';
import {Look, Perfil} from './look/Look';
import {Cap} from './roteiro';
import {Calcadao, perfilCalcadao} from './mundo/calcadao';
import {Praia, perfilPraia} from './mundo/praia';
import {Leito, perfilLeito} from './mundo/leito';
import {Gaztelugatxe, perfilGaztelugatxe} from './mundo/gaztelugatxe';
import {Madrid, perfilMadrid} from './mundo/madrid';
import {Globo, perfilGlobo} from './mundo/globo';
import {Panama, perfilPanama} from './mundo/panama';
import {Acapulco, perfilAcapulco} from './mundo/acapulco';
import {Take, perfilTake} from './mundo/take';
import {solDaCena} from './mundo/ceu';

const MUNDOS: Record<string, [React.FC<{t: number}>, (t: number) => Perfil]> = {
  calcadao: [Calcadao, perfilCalcadao], praia: [Praia, perfilPraia], leito: [Leito, perfilLeito], gaztelugatxe: [Gaztelugatxe, perfilGaztelugatxe],
  madrid: [Madrid, perfilMadrid], globo: [Globo, perfilGlobo], panama: [Panama, perfilPanama], acapulco: [Acapulco, perfilAcapulco],
};

export const Cena: React.FC<{t: number; cap: Cap; u?: number}> = ({t, cap, u = 0}) => {
  if (cap.mundo === 'take') return <><Take u={u} /><Look perfil={perfilTake(u)} /></>;
  const m = MUNDOS[cap.mundo];
  if (!m) return null;
  const [Mundo, perfil] = m;
  return <><Mundo t={t} /><Look perfil={perfil(t)} sol={solDaCena(t, cap.mundo)} /></>;
};
