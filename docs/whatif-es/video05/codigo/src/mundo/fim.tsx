// Fim (dono: agente Fim) - 345 a 522 s do original: galaxias e estrelas se apagam, a ultima ana vermelha, escuridao,
// colisao de estrelas mortas, buraco negro (raymarching de Schwarzschild), o Sol morto vira luz, evaporacao Hawking,
// flash final e anel de choque, preto absoluto. Camera fixa olhando o ceu: tudo pendurado no quadro com relCam.
// Contrato: export const Fim: React.FC<{t}> e export const perfilFim(t): Perfil.
import React, {useMemo} from 'react';
import {Perfil} from '../look/Look';
import {TREF, quadro} from './fim_comum';
import {BrilhosFim, CeuFim, EstrelasFim, FlashFinal, GalaxiasFim, SolMorto} from './fim_camadas';
import {BuracoNegro} from './fim_buraco';

// perfis em cache (o Look remonta o compositor quando o objeto muda)
const P: Record<string, Perfil> = {
  ceu: {bloom: 0.75, limiar: 0.5, vinheta: 0.42, saturacao: 0.06, contraste: 0.06},
  colisao: {bloom: 1.0, limiar: 0.55, vinheta: 0.38, saturacao: 0.04, contraste: 0.05},
  buraco: {bloom: 0.9, limiar: 0.55, vinheta: 0.42, saturacao: 0.1, contraste: 0.07},
  evapora: {bloom: 1.0, limiar: 0.5, vinheta: 0.42, saturacao: 0.08, contraste: 0.06},
  flash: {bloom: 1.3, limiar: 0.7, vinheta: 0.3, saturacao: 0.0, contraste: 0.04},
  preto: {bloom: 0.4, limiar: 0.9, vinheta: 0.5, saturacao: 0.0, contraste: 0.0},
};
export const perfilFim = (t: number): Perfil =>
  t < 401.5 ? P.ceu : t < 410 ? P.colisao : t < 442 ? P.buraco : t < 505.4 ? P.evapora : t < 512.5 ? P.flash : P.preto;

export const Fim: React.FC<{t: number}> = ({t}) => {
  const base = useMemo(() => quadro(TREF), []);
  const agora = quadro(t);
  return (
    <>
      {/* ceu profundo: fixo no mundo (a inclinacao de 489,5-493 sobe o buraco negro no quadro, como no original) */}
      <group position={base.pos} quaternion={base.quat}>
        <CeuFim t={t} />
        <EstrelasFim t={t} />
        <GalaxiasFim t={t} />
        <BuracoNegro t={t} />
        <SolMorto t={t} />
        <BrilhosFim t={t} />
      </group>
      {/* flash final: preso a camera do instante (a camera ja comeca a voltar para a rua em 505,4) */}
      <group position={agora.pos} quaternion={agora.quat}>
        <FlashFinal t={t} />
      </group>
    </>
  );
};
