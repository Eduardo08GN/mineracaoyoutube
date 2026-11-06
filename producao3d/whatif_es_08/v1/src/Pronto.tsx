// Segura o quadro ate os dados reais carregarem e o React re-renderizar com eles (05/11: sem isso o quadro saia vazio).
import React, {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {DADOS, PRONTO} from './dados';
export const Pronto: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [ok, setOk] = useState(!!DADOS);
  const [h] = useState(() => (DADOS ? null : delayRender('cena espera os dados')));
  useEffect(() => { if (!ok) PRONTO.then(() => setOk(true)); }, [ok]);
  useEffect(() => { if (ok && h !== null) continueRender(h); }, [ok, h]);
  return ok ? <>{children}</> : null;
};
