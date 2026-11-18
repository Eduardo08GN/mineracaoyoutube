# Batedor da refação do vídeo 14 do Kriegsmomente ("Moltke mit 69 / 45 Tage"): um take por agente

- **Projeto:** `D:\kriegschronik\tracer3d_14b_moltke_refacao`. Cópia do v14, com o áudio aprovado.
- **Vídeo atual de comparação:** `D:\kriegschronik\tracer3d_14_moltke\entrega\warum_besiegte_moltke_napoleon_45_tage.mp4`.
- **Leia primeiro:**
  - `D:\pesquisa_nichos\kriegsmomente_stack\REFACAO_v14.md`: o diagnóstico e as §3, §4 e §6;
  - `roteiro/skript_de.json`;
  - `roteiro/fakten.md`: só números de lá, com "ca." onde for aproximado.

## O que o Eduardo reprovou no v14
- 57% do vídeo é mapa, sempre a mesma base inclinada.
- Cartões vazios no ar.
- Texto cortado na borda.
- Sobreposições, cinza sobre preto e setas encavaladas.
- Nenhum "como funciona".

Ele quer **takes de simulação e animação explicativa/esquemática**, intercalados, que **ensinem**.

## Regras (todas obrigatórias)
1. **Pronto antes de construir.** Reaproveite os componentes do kit que já existem no projeto:
   - `v1/src/welt`: g_bahn/g2_bahn (trens), k9_batterie, k7_feuer_sedan, k6_waffen_geschuetz (Krupp C/64), k9_armeen, Tropa;
   - `v1/src/kit/premium` (API.md): Timeline, CompareBars, Arrow com perfect-arrows + evolvePath, LeaderLabel, HudPair;
   - `@remotion/paths`, `@remotion/google-fonts`.

   Componente novo à mão, só se nada disso servir. Registre o motivo.
2. **Takes únicos:** câmera e ação próprias. **A câmera nunca para**: dolly em um eixo com easing, menos de 10% de quadros parados. A ação acontece **dentro do plano**.
3. **Esquema = diagrama que se constrói com a fala**, com eixos, partes e fluxos. Não é frase grande no centro.
   - Conteúdo visível já em s + 0,5 s.
   - Nada fora do quadro (margem de segurança de 96 px).
   - Nenhuma caixa sobre outra.
   - Opacidade final 1; contraste ≥ 4,5:1.
   - No máximo 2 elementos de texto fora de tabela.
   - Rótulos em alemão.
4. **Setas:** ponta calculada (perfect-arrows / evolvePath). As pontas nunca se tocam.
5. **Look de época escuro-médio**, mais próximo do Elapsed:
   - exposição sem lavar (p50 de luminância ≈ 85–115);
   - nada de bege infinito no fundo;
   - primeiro plano com objeto de escala.
6. **Sem marca d'água e sem créditos na imagem.**

## Como montar o batedor (sem G4; tudo local, no D:, com TEMP=D:/tmp)
- **Componente:** `v1/src/welt/k14b_<take>.tsx`.
- **Entrada própria** (para não colidir com os outros agentes): `v1/src/batedor_<take>/entry.tsx`, com `registerRoot` e uma `<Composition id="B_<take>">` de 1920 × 1080, 30 fps.
- **Stills:** `npx remotion still v1/src/batedor_<take>/entry.tsx B_<take> render/batedor_<take>/q<frame>.png --frame=<n>`, rodado de dentro de `v1`. São 3 quadros: começo, meio e fim do take, com duração de 8–15 s.
- **Folha:** `render/batedor_<take>/FOLHA.jpg`. Em cima, os 3 stills novos; embaixo, 3 quadros do vídeo 14 ATUAL no mesmo trecho da fala (ache os tempos em `D:\kriegschronik\tracer3d_14_moltke\v1\src\plano.json` pelo capítulo). Cada quadro leva um rótulo.
- **Não mexa** em `v1/src/beats`, `index.tsx`, `Video.tsx` nem nos arquivos dos outros agentes. Mate só processos seus.

## Entrega (≤ 150 palavras)
- o que veio pronto e o que foi construído;
- o caminho da folha;
- as fraquezas honestas.

## ADENDO (03/11, orientação de stack do Eduardo via suporte, depois da leitura do Reconstructed: `D:/pesquisa_nichos/leitura_reconstructed_0311/ANALISE.md`)
O Reconstructed é BÁSICO e em tempo real, mas tem **149 takes distintos em 12 min**, só 3% repetidos. O que vale é a variedade de takes e o que acontece DENTRO deles, não o fotorrealismo.

1. **Render em tempo real** (Remotion + three.js). Blender só para exceção.
2. **Um modelo por assunto, recolorido para a paleta do vídeo:**
   - fundo e terreno cinza-azulados;
   - acentos só em **azul prussiano** e **vermelho francês**.
3. **≥ 5 ângulos distintos por take no batedor.** O componente expõe `angulo` com presets:
   - close de peça;
   - lateral;
   - de cima;
   - frente ou trás;
   - pequeno no terreno imenso;
   - travelling;
   - grua subindo;
   - push-in;
   - pull-out;
   - corte do interior.

   Os presets variam lente, distância, altura e direção. **O objeto sempre se move em relação à câmera**: trem andando, canhão recuando, coluna marchando.
4. **Camada de dados ao vivo, sincronizada com a fala:**
   - contador de dias e de efetivo, trens por dia;
   - o trajeto se desenhando sobre o relevo, com os nomes surgindo quando são ditos.
5. **Explicação SOBRE o 3D:**
   - setas de força e movimento no próprio objeto;
   - a peça que importa destacada em cor;
   - corte do interior;
   - fantasma da posição anterior.
6. **Terreno barato** (relevo ou OSM com textura de mapa de época). Nada fotorreal.
7. **Folha:**
   - em cima, os ≥ 5 ângulos do take novo;
   - no meio, 3 quadros do v14 atual;
   - embaixo, 3 quadros do Reconstructed: recorte de `D:/pesquisa_nichos/leitura_reconstructed_0311/folha_0*.jpg`.

## ADENDO 2: TERRENO (03/11, cobrança direta do Eduardo: "melhore esses terrenos quando for fazer esquema")
O terreno bege e liso do kit (Karte/relevo inclinado) está REPROVADO, também nos esquemas. Use só peças prontas:
- **Relevo real:** Copernicus DEM GLO-30, já usado nos vídeos 8, 12 e 14 em `v1/public/geo` (procure os `.png`/`.bin` de altura). A sombra vem do relevo com luz rasante (hillshade + AO) e precisa ler como colinas de verdade, com o vale do Maas/Mosel visível.
- **Cor do chão** (nesta ordem):
  1. satélite EOX s2cloudless 2016/2017 (CC BY), já baixado em `v1/public/geo`;
  2. ou mapa topográfico de época (Generalstab/Kriegsgeschichte 1870, domínio público no Wikimedia), recortado e colado sobre o relevo;
  3. a paleta cinza-azulada entra por gradação de cor, não por chão chapado.
- **Detalhe que dá escala:**
  - rios em azul escuro;
  - estradas e ferrovias em linha fina clara;
  - florestas (OSM landuse=forest), em textura escura ou instâncias de árvore CC0;
  - aldeias como pontos ou blocos baixos.
- **Atmosfera:** neblina por distância e horizonte que some na neblina. Nada de borda do mapa flutuando no vazio.
- **O esquema** (setas, blocos de tropa, rótulos) fica POR CIMA desse terreno, com contraste ≥ 4,5:1 e rótulos com halo.
- **Folha:** mostre pelo menos um quadro do terreno novo ao lado do terreno antigo do v14.

## ADENDO 3 (03/11, Eduardo): esquemas explicativos
Todo mecanismo, evento ou fenômeno que a fala explica ganha um esquema gráfico próprio. Referência: o Fault Lines, "Inside a thunderstorm".
- **Formas:** corte simplificado, fluxo, escala, anatomia, comparação lado a lado.
- **Construção:** o esquema se monta com a fala.
- **Visual:** fundo escuro, linhas finas, eixos e unidades, poucos rótulos.
- **Selo:** "Prinzipskizze · nicht maßstabsgetreu" quando for princípio geral.

No v14 refeito, exemplos:
- o perfil da via férrea (simples × dupla, cruzamento só na estação);
- o corte de uma estação de embarque (rampa, cavalos, vagão);
- o esquema do ciclo de mobilização (Wehrkreis → depósito → regimento → trem);
- o corte da culatra de cunha Krupp × carregamento pela boca;
- o alcance (anéis) das baterias em Sedan.

## ADENDO 4 (03/11, APROVADO pelo Eduardo): correções da revisão (itens 2–5) + regra do instrumento vivo
**Revisão** (`D:/pesquisa_nichos/kriegsmomente_stack/REVISAO_BATEDOR_v14b.md`). O item 1, modelos baixados, NÃO foi aprovado: os objetos continuam os do kit.
- **(2) Closes:** chão PBR com sombra de contato + HDRI de céu nublado de verão (Poly Haven CC0). Nenhum objeto flutua na névoa.
- **(3) Luz e cor:**
  - mediana de luminância ≥ 100 nos planos abertos (Sedan estava em 74);
  - o mundo dessaturado, com o azul prussiano e o vermelho francês preservados.
- **(4) Árvores e casas:** prontas (Quaternius/Poly Haven CC0 ou as do disco), no lugar dos cones e das caixas. A biblioteca está em `roteiro/BIBLIOTECA_OBJETOS.md` e em `v1/public/objetos/`.
- **(5) Prova:**
  - `ferramentas/camera.py` mede a % de quadros com câmera parada por take, com meta ≤ 10%;
  - um juiz independente (agente que não produziu) dá nota 0–10 a cada still-chave; só passa ≥ 8,5;
  - close abaixo de 8,5 só por causa do modelo do kit vai para plano médio.
- **Menores:**
  - trens: fica o (c) Gleisprofil; o (a) Bildfahrplan só entra se houver frase de capacidade agregada;
  - comando: eixo em "Tag 1/2/3" ou sem eixo, nunca hora inventada;
  - Saar: o recorte certo, não Metz como dublê.

**Regra do instrumento vivo, nos blocos de mecanismo:** simulação contínua, com o número citado como instrumento ao vivo sobre ela.
- **Painel:** ≤ 3 grandezas em cor de sinal, relógio com compressão de tempo declarada e 1 barra amostrada no objeto. Tudo entra e sai com a fala.
- **Legenda de ação:** 1 linha.
- **Cartão preto:** ≤ 10% e ≤ 3 s.
- **Trens:** o diorama roda "Tag 1 … Tag 18", com o painel "Züge heute · eingleisig/zweigleisig · Truppen am Rhein" e "1 Tag ≈ 1 s"; a curva de chegada se desenha no canto e cruza a previsão no Tag 18.
- **Sedan:** painel grande 774 × 564 nas cores de cada facção, relógio "1. Sept 05:00 → 11:00 · 20×" e barra "im Feuer / außer Reichweite" amostrada sobre o vale enquanto os anéis se desenham.
