inicio_producao: 2026-11-04 (noite; tema/radar 19h, roteiro ~21h, cena ~22h)

## Registro
- Stack nova (1º vídeo): three.js/teardown/GSAP, marcadores, 2.5D, acabamento. Peças construídas aqui são investimento de uma vez (mar.js, navio.js, mapa escuro, marcadores).
- Medir: início/fim, horas de G4, tokens; comparar com o vídeo seguinte.

## Entrega (04/11/2026)
- `entrega/warum_griff_frankreichs_flotte_1870_nie_an.mp4`: 12 min 5 s, 2560×1440, H.264 10 bits, AAC 256k, voz a −14 LUFS, sem música. Também 3 miniaturas, títulos/descrição e SRT (1ª versão: ~25% acima de 17 caracteres/s).
- 149 batidas: mapa 38%, anatomia 29%, época 20%, lápis 13%.
- Render final: 24 fatias em paralelo, 325 s para o vídeo inteiro. GPU com média de 58% de utilização (pico 100%) e 35% de VRAM (pico 43%).
- Lições:
  - **design system do canal = creme + escrita do telégrafo do K15** (o K16 saiu escuro por exceção);
  - o lápis certo é o traço do K15;
  - captura com `| tail` escondia falha (corrigido com pipefail);
  - uma constante local com o mesmo nome de um import (FONTE) travava a página;
  - 1º vídeo na stack nova: o tempo maior veio de construir mapa, época, lápis e motor, peças que o próximo vídeo reaproveita.
