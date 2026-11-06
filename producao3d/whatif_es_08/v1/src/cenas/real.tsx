// Familia "real": fechamento honesto (o que e real, o que e calculado, o que e imaginacao) sobre o oceano que cobriu tudo,
// com o Aconcagua ainda na tela; depois a pergunta para os comentarios. O fundo segue vivo (camera e agua andando).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Cena as Continente} from './cont';
import {CenaProps} from './tipos';
import {BRANCO, OURO, SANS, SERIF, SOMBRA, easeOut} from '../hud/base';

const Linha: React.FC<{cor: string; titulo: string; texto: string; idade: number}> = ({cor, titulo, texto, idade}) => {
  const e = easeOut(idade / 0.5);
  return <div style={{display: 'flex', gap: 22, alignItems: 'flex-start', opacity: e, transform: `translateX(${(1 - e) * 30}px)`}}>
    <div style={{width: 14, height: 14, borderRadius: 7, background: cor, marginTop: 14, boxShadow: `0 0 12px ${cor}`}} />
    <div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: '0.14em', color: cor}}>{titulo}</div>
      <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 32, color: BRANCO, maxWidth: 900, lineHeight: 1.3}}>{texto}</div>
    </div>
  </div>;
};
export const Cena: React.FC<CenaProps> = (p) => {
  const {beat, t} = p, i = t - beat.ini;
  return (
    <AbsoluteFill>
      <Continente {...p} beat={{...p.beat, familia: 'cont', reg: 'aconcagua_ilha', mov: 'orbita'}} />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(5,12,24,0.0) 30%, rgba(5,12,24,0.72) 62%)'}} />
      {beat.fase === 'cartao' ? (
        <div style={{position: 'absolute', right: 110, top: 250, display: 'flex', flexDirection: 'column', gap: 34, textShadow: SOMBRA}}>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 74, color: BRANCO, opacity: easeOut(i / 0.5)}}>¿Algo de esto es real?</div>
          <Linha cor="#7fe3f0" titulo="POSIBLE · 0 a 70 m" texto="Si se derritiera todo el hielo del planeta. En miles de años, no en uno." idade={i - 1.2} />
          <Linha cor={OURO} titulo="CALCULADO" texto="El orden de los países: relieve real (ETOPO 2022) y dónde vive cada persona (GHS-POP 2025)." idade={i - 4.5} />
          <Linha cor="#ff8f7a" titulo="IMAGINACIÓN" texto="Un mar que nunca deja de subir." idade={i - 8.0} />
        </div>
      ) : (
        <div style={{position: 'absolute', right: 120, top: 330, textAlign: 'right', textShadow: SOMBRA}}>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 92, color: BRANCO, opacity: easeOut(i / 0.5), transform: `translateY(${(1 - easeOut(i / 0.5)) * 20}px)`}}>¿En qué metro<br />cayó tu país?</div>
          <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: '0.16em', color: OURO, marginTop: 26, opacity: easeOut((i - 1.4) / 0.5)}}>TE LEO EN LOS COMENTARIOS</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
