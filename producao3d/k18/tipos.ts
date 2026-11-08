// Interface comum das cenas do K18 (Königgrätz). Cada familia exporta `Cena: React.FC<CenaProps>` em src/cenas/<familia>.tsx
// (modulos auxiliares em src/cenas/<familia>/), desenha o quadro INTEIRO e e funcao pura de (beat, t, u): render em 48 Chromes.
// DESIGN SYSTEM (Kriegsmomente, decisao do Eduardo): CREME (papel antigo ~#e7ddca), serifa italica de epoca (IM Fell English
// Italic) que se ESCREVE na tela, linha-guia fina terminada em ponto, graficos tracados a tinta (marrom-escuro), no maximo UM
// acento de tinta vermelha/laranja. Unidades no estilo Brockhaus 1866: retangulo cheio pequeno, AZUL = Preussen, VERMELHO =
// Oesterreich, verde-escuro = Sachsen, numerado, nome em italico. HUD global (Video.tsx) por cima: relogio/painel no canto
// superior esquerdo (x 60..760, y 50..330), lugar no canto superior direito, legenda embaixo (y > 900).
export type Beat = {id: string; cap: string; familia: string; ini: number; fim: number; fim_fala: number; frases: number[];
  reg?: string; mov?: string; dest?: string[]; h0?: string; h1?: string; d0?: string; d1?: string; fase?: string; motivo?: string};
export type CenaProps = {beat: Beat; t: number; u: number};
