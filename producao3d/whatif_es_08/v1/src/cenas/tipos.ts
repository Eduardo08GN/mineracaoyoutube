// Interface comum das cenas do video 08. Cada familia exporta `Cena: React.FC<CenaProps>` em src/cenas/<familia>.tsx,
// desenha o quadro INTEIRO (ThreeCanvas proprio + rotulos proprios) e e funcao pura de (beat, t, u, L): render em 48 Chromes.
// O HUD global (Video.tsx) fica por cima: painel no canto superior esquerdo (x 60..900, y 50..430), lugar no canto superior
// direito, cartao do pais embaixo no centro (y > 860) e legenda acima dele. O assunto da cena vai no centro/direita.
export type Beat = {id: string; cap: string; familia: string; ini: number; fim: number; fim_fala: number; frases: number[];
  reg?: string; mov?: string; cam?: string; fase?: string};
export type CenaProps = {
  beat: Beat;
  t: number;      // tempo global do video (s)
  u: number;      // progresso dentro da batida (0..1), para a camera: NUNCA parar (dolly continuo do inicio ao fim)
  L: number;      // nivel do mar global agora (m, dado real; ver nivel.ts)
  Lant: number;   // nivel no quadro anterior
};
