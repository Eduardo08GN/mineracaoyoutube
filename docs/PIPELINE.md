# PIPELINE de produção: documento-mestre (memória de longo prazo)

> **Regra (Eduardo, 04/11/2026):** toda decisão de pipeline é documentada aqui e sobe para o GitHub **na hora**. Este arquivo é o índice. Os detalhes ficam nos documentos linkados e o código, em `producao3d/`. Atualize o registro no fim deste arquivo a cada iteração.

Branch: `producao/stack-3d-baseline`. Repositório público: nada de chave, token, e-mail, ID de canal ou link de notebook. Tudo o que é secreto fica no `.env` local.

---

## ★ DESIGN SYSTEM DO KRIEGSMOMENTE (canal alemão) — decisão do Eduardo, 04/11/2026
- **Tema CREME**, nunca o escuro. O viewport tem fundo creme/bege de papel antigo (~`#e7ddca`), com sombras suaves.
- **A escrita do take do telégrafo do K15** ("Ems – Berlin, den 13. Juli 1870"): serifa itálica de época escrita progressivamente na tela, rótulos com linha-guia fina terminada em ponto e gráficos traçados a tinta.
- Vale para mapa, modelos/teardown e textos. O K16 (Seekrieg) saiu escuro por exceção: já tinha começado assim, e não é o padrão.

---

## ★ DIRETIVA DO PRÓXIMO VÍDEO (lições da leitura óptica do K16, 04/11; o K16 foi publicado sem retroagir)

**Medição do K16 contra o AiTelly** (diferença entre quadros a 24 fps, mesma régua):

| Métrica | K16 | AiTelly |
|---|---|---|
| Movimento médio por quadro | 1,68 | 4,24 |
| Quadros quase parados | 26% | 15% |
| Mediana de duração do plano | 7,0 s | 4,4 s |
| Movimento nos planos do navio | ~0,55 | — |

**Os planos do modelo foram os mais mortos do vídeo.**

0. **Design system: CREME + a escrita do telégrafo do K15** (seção acima). Nada de tema escuro.
1. **Usar a SKILL teardown inteira, não só o motor de render** (`D:/pesquisa_nichos/teardown/SKILL.md`):
   - referência real primeiro, comparada quadro a quadro;
   - números reais de uma fonte só, e uma entrada move tudo;
   - **a peça que trabalha se abre** (isolar, cortar, raio-X): uma câmera que entra vale mais que dez órbitas;
   - estúdio claro com um acento;
   - máquina em 60–70% do quadro e rótulo ≥ 34 px;
   - nada morto (um elemento sempre vivo);
   - easing de entrada `cubic-bezier(0.16,1,0.3,1)` e de saída `cubic-bezier(0.6,0,0.9,0.35)`;
   - ciclo de revisão `--stills beats` + `sheet.mjs` até uma passada não achar nada.
2. **Modelo/objeto vivo:**
   - câmera sempre andando (passagem, aproximação, órbita, entrar);
   - nada abaixo de 15% da altura do quadro por mais de 3 s;
   - o objeto se recorta contra o claro.
   - No caso de navio: vergas perpendiculares ao mastro e linha d'água opaca (água translúcida só no corte).
   - **Meta de movimento:** média ≥ 3 na régua de diferença entre quadros, e nenhum plano parado por mais de 3 s.
3. **O take do mecanismo explica com os DOIS números lado a lado:**
   - exemplo: o calado do navio ao lado da profundidade da água, com fonte;
   - cada grandeza com cor/forma própria (calado ≠ carvão);
   - texto nunca vaza da caixa;
   - o corte planejado no batedor tem que aparecer no vídeo;
   - mecanismo com raio-X, passos numerados, setas, como no AiTelly.
4. **Abertura:** 3D em movimento nos primeiros 5 s, e o gancho do título no mesmo quadro (ex.: 49 vs 5 lado a lado).
5. **Repetição:**
   - escrita/lápis no máximo 3–4 vezes;
   - **nenhuma gravura repetida**;
   - multidões entram em contagem (não clones parados) e não são reaproveitadas.
6. **Uma linguagem visual só:** a do design system creme. Nada de papel com textura realista.
7. **Mapa: voltar ao kit/karten do Tracer3D** (Karte via `cenas/karten.json`):
   - `grund: "auto"` com relevo;
   - territórios com `geojson`/`flaeche`;
   - nomes de região com `gebiet`;
   - movimento com `pfeil`, `linie`, `front`, `lineal` (com contador), `zahl` com `zaehlt`, `datum` e `zeitleiste`;
   - câmera **sempre** com `drift` ou voo por keyframes (nenhum mapa parado);
   - rótulos sem sobreposição;
   - lugares como Paris e Cherbourg sobre terra visível.
8. **Legendas:** cortadas por frase, no mínimo 1,5 s na tela, nenhuma palavra órfã ("Bundes.", "Hause.").
9. **Título coerente com o vídeo:** nada de absoluto que o próprio vídeo desmente (o K16 dizia "nie an" e mostrava Havana).
10. **Técnico:** entregar em H.264 **8 bits** com grão (ou HEVC/AV1 em 10 bits). O H.264 de 10 bits não abre em vários players/editores.

---

## 0. Princípios (valem mais que qualquer ferramenta)
- **O produto é a compreensão do espectador.** A ordem é: roteiro > desenho da informação > animação > acabamento. A pergunta de corte é "ajuda a entender?" (`docs/principio-producao-multidimensional.md`).
- **Recurso barato e inteligente sempre.** Antes de construir, perguntar: "qual o recurso mais barato que já temos e que dá a mesma leitura?" (`docs/stack-producao-3d.md`).
- **Assinatura nova.** Objeto pronto chapado + mundo em camadas 2.5D + marcadores que tornam o dado visível + câmera sempre andando. O que não serve a uma dessas quatro coisas não entra.
- **Corta-se detalhe, nunca silhueta.** Exemplo: navio de 1870 sem cordame, mas com as vergas.
- **Filosofia, não literalidade.** Das referências (AiTelly, Reconstructed, agregadores BR) tira-se o princípio, não o recurso.
- **Energia na composição, não no modelo nem no ambiente.** Nada de hiperfoco em modelo ultrarrealista. Nada de cena de objeto interagindo com física de ambiente (oceano, tempestade simulada): o 3D mostra a anatomia da máquina, e o clima vem das imagens de época 2.5D e do mapa.

## 1. Tema e título (canal alemão Kriegsmomente)
- Radar de temas pela API (demanda EN × oferta DE, lacunas, outliers, corrida do ouro em 90 dias): `docs/pipeline-temas-kriegsmomente.md` (branch `docs/pipeline-temas-kriegsmomente`).
- Varredura de virais EN/DE em 12 meses: `radar_virais_0411.py` (local, D:). Mede views/inscritos e a corrida de 90 dias.
- **Título.** A recomendação do sócio de **forçar** o nome da guerra e o duelo Preußen×Frankreich em todo título **foi abandonada** (04/11). O título nasce do paradoxo verdadeiro do tema, como o viral "Warum verlor Frankreich 1870 – obwohl es das bessere Gewehr hatte?".
- **Leitura da API do canal (04/11):**

  | Molde | Views/dia |
  |---|---|
  | Paradoxo com Y **técnico, concreto e novo** | 6.434 (o viral) |
  | Mesmo Y repetido (mitrailleuse) | 152 (fadiga) |
  | Perda + tempo | 1.329 |
  | Crônica "Stunde für Stunde" | 1.174 |
  | "Im Inneren" / "nachgerechnet" | 110–177 (morto) |

  Mantenha um registro dos Y já usados e nunca repita o tipo de Y.
- **Concorrência:** um canal copiou nosso ângulo em 1 dia e fez 105 mil. A embalagem dele era melhor:
  - miniatura coerente com o título (o objeto + emoção + 2–4 palavras);
  - âncora famosa no título ("Sedan 1870");
  - superlativo;
  - 8 minutos.

  Nossa defesa: publicar rápido nas ondas EN e explicar a máquina em 3D.

## 2. Roteiro
- 8 princípios de condução, tirados de 35 vídeos (Aviões e Músicas, Manual do Mundo, Space Today, Reconstructed, AiTelly): `docs/roteiro/honeyspot-roteiro.md`.
- Dossiê de fatos com fonte para cada número antes do roteiro. O título só leva número conferido.
- Números escritos por extenso para a voz (TTS); na legenda, voltam a algarismos.
- Checagem medida: frase de 10–14 palavras, 13–21% de fragmentos curtos, ≤ 3,5 números/min, 1 re-gancho a cada 60–90 s, contexto ≤ 2 min antes do relógio.

## 3. Take explicativo e marcadores
- Tornar visível o abstrato, com as dimensões conectadas no mesmo take: `docs/take-explicativo.md`.
- Pipeline oficial de marcadores (8 tipos, JSON na palavra): `docs/marcadores.md`.
- Toda batida declara **o que muda de estado** e as **dimensões**. Sem isso, volta.

## 4. Produção 3D (stack nova)
- **Motor:** teardown (three.js, `render(t)` puro e determinístico) + GSAP com `seek(t)`. Render na G4 (Colab RTX PRO 6000, 96 GB).
- **Modelo:** o pronto mais simples da classe e época certas, com prazo de **30 minutos** de busca. Sem achar, modela-se pelo perfil. Atlas/pintura chapada de 2–4 tons e congelado depois.
- **Ambiente:**
  - Céu em camadas 2.5D (`stage.js`: `camadas`; paleta por clima).
  - Palco neutro escuro para a anatomia (`palco`).
  - Névoa em camadas presa à câmera (`nevoa.js`; ideia do AiTelly).
- **Acabamento:** 24 fps, obturador de 180° com N subquadros (o mesmo obturador no vídeo inteiro, só N varia), grão, vinheta, x264 10 bits (`docs/stack-producao-3d.md` §5b).
- **Famílias de batida (vídeo K16):**

  | Família | Arquivo | O que faz |
  |---|---|---|
  | `anat` | `anat.js` | anatomia: 25 câmeras, chegada e saída, zoom, troca de ângulo, destaque por faixa (cinta, vivas, bateria, máquina, bunker), régua do calado, fatia explodida, frota de silhuetas |
  | `mapa` | `mapa.js` | mapa escuro: costa Natural Earth, profundidade ETOPO/EMODnet, trilhas, anéis, rótulos, ícones de navio |
  | `epoca` | `epoca.js` | pintura/foto de época 2.5D (profundidade Depth Anything V2 **Small**, Apache; Base/Large são NC e o DepthFlow é AGPL, ambos proibidos) |
  | `lapis` | `lapis.js` | escrita à mão sobre documento. **K16 usa fonte manuscrita com lápis 3D. A partir do próximo vídeo, o padrão é o traço do K15:** riscos, sublinhados, ✓ e círculos desenhados progressivamente em laranja sobre o documento impresso (estilo rough-notation / `WortDiff` do K15) |

- **Estrutura padrão para MODELOS / teardown (Eduardo, 04/11): a do K15** (cena do telégrafo "Ems – Berlin, den 13. Juli 1870"):
  - viewport de **fundo creme/bege** (papel antigo, ~`#e7ddca`), sombras suaves no chão;
  - **texto em serifa itálica de época escrito progressivamente** (título + subtítulo no alto; legendas como "verschlüsselt in Zahlengruppen" que se escrevem);
  - rótulos com **linha-guia fina terminada em ponto** até a peça;
  - **gráficos traçados a tinta** (ex.: "Strom in der Leitung" an/aus).

  **O creme é o DESIGN SYSTEM do canal alemão** e tem prioridade em todo vídeo. O K16 termina no tema escuro porque já começou nele (decisão do Eduardo, 04/11).
  O "lápis" que o Eduardo quer é ESTE: a escrita que vai acontecendo na tela + os traços desenhados. Vale para todo modelo a partir de agora. O K16 (navio) saiu no palco escuro, um esquecimento.
- **Plano de batidas** (`roteiro/plano.json`), gerado por `ferramentas/plano_k16.py`:
  - frase → batida, e frase longa (> 7 s) vira duas;
  - medidas: % de cada família e a maior sequência de uma mesma família;
  - referência: mapa ≤ ~35–38%, anatomia ≥ 25%, época ~20%, lápis ~10–13%; nenhuma família com mais de 6 batidas seguidas.

## 5. Voz, alinhamento, áudio, legendas
- Narração no AI Studio (Gemini TTS, voz alemã "Riko"), por capítulo: `voz/narrar.py`. Só um processo por vez (PID lock).
- Alinhamento na G4 com stable-ts large-v3 em alemão (tempo por palavra e WER por capítulo): `ferramentas/g4_alinhar.py`.
- Frases com tempo global, com a pausa de 0,45 s entre capítulos: `ferramentas/frases.py`.
- Voz mixada na G4: concat + loudnorm −14 LUFS, TP −1 dBTP. **Kriegsmomente sem música.**
- Legendas DE: `ferramentas/legendas_k16.py`. Regras: ≤ 17 caracteres/s, ≥ 1,2 s na tela, ≤ 2 linhas de 42 caracteres, números em algarismos.

## 6. G4: paralelismo e uso
- Fila paralela `infra/fila_g4.py`:
  - o servidor da VM já roda vários jobs, então o PC lança vários e acompanha todos;
  - faixas 3d=10, ia=2, video=4, com dependências entre jobs;
  - `fatias()` faz o render fatiado (provado quadro a quadro, 384 = 384);
  - um medidor de VRAM e utilização roda por lote.
- **Meta: ≥ 80% da placa em uso nas janelas de produção, PELO NÚMERO DE TAREFAS SIMULTÂNEAS, não pela resolução** (Eduardo, 04/11: resolução não faz o canal viralizar; o interesse é velocidade). Resolução fixa em 1440p. A sobra da placa vai para mais jobs em paralelo: mais fatias, IA, batedores e stills de checagem juntos.
- Stills isolados quase não usam GPU (o custo é carregar a página). A carga real é o render final: muitas fatias em paralelo e qualidade alta (dpr 2, mais subquadros).
- O Chromium usa a GPU NVIDIA: `--use-gl=angle --use-angle=gl-egl` + o vendor EGL da NVIDIA (renderizador conferido: "ANGLE (NVIDIA … RTX PRO 6000 …)").
- Ligar a G4 só com job e desligar no fim, conferindo. Nunca desligar com job de outra sessão (`T2_DONO`).

## 7. Onde está o código (este repositório)
- `producao3d/k16/cena/`:
  - `seekrieg/`: stage, navio, anat, nevoa, epoca, lapis, producao, film;
  - `g4_k16.py`, `g4_prod.py`, `prep_k16.mjs`.
- `producao3d/k16/ferramentas/`:
  - `frases.py`, `plano_k16.py`, `legendas_k16.py`, `g4_alinhar.py`;
  - `baixar_sketchfab.py` (o token fica no `.env` local).
- `producao3d/infra/fila_g4.py`
- `producao3d/learjet_prova/`: a prova do Learjet (céu em camadas, acabamento, atlas chapado).

---

## Registro de decisões (mais recente no fim)

| Data | Decisão |
|---|---|
| 04/11 | modelo pronto mais simples + atlas chapado (Learjet); céu em camadas 2.5D aprovado |
| 04/11 | acabamento por subquadros, grão, vinheta, 10 bits; marcadores oficiais; take explicativo; honeyspot de roteiro (8 princípios) |
| 04/11 | Kriegsmomente passa à stack nova; o console/PowerPoint fica descontinuado (mapas e imagens de época **continuam**) |
| 04/11 | título: abandonada a estrutura forçada do sócio; leitura da API do canal (Y técnico, concreto e novo) |
| 04/11 | auditoria da assinatura: cortes (PBR, relevo em costa plana, carta drapeada, mar realista, cordame, interior de máquina, texto extrudado); ajustes do Eduardo (mesmo obturador, vergas, 30 min de busca) |
| 04/11 | 3D = anatomia em palco neutro (nada de oceano/física); navio chega e sai, com zoom e troca de ângulo; névoa em camadas |
| 04/11 | fila paralela da G4 + render fatiado + meta de 80%; medidor por lote |
| 04/11 | lápis: o K16 vai com a fonte manuscrita; o padrão a partir do próximo vídeo é o traço à mão laranja do K15 (riscar, sublinhar, ✓, circular) |
| 04/11 | **toda decisão de pipeline é documentada aqui e sobe para o GitHub na hora** |
| 04/11 | modelos/teardown: estrutura do K15 (viewport creme, serifa itálica escrita progressivamente, linha-guia com ponto, gráfico a tinta) |
| 04/11 | creme = design system do Kriegsmomente (prioridade); o K16 termina no escuro, por exceção |
| 04/11 | 4 famílias integradas no motor (`producao.js`): anat, mapa (`mapa_vistas.js`: 43 vistas; fora de 47–60° N vira seta com rótulo), época 2.5D, lápis |
| 04/11 | fila: `set -o pipefail` (um `| tail` escondia falha de captura); build minificada → para depurar, `SIMS_DEBUG=1` |
| 04/11 | render final: `g4_prod.py video 24` = 24 fatias em paralelo, 1440p (dpr 1.6), 6 subquadros, 10 bits; o mudo vai para RENDER_MUDO_NAO_PUBLICAR |
| 04/11 | regra de fato: número na tela só do dossiê ("1.500 Kanonen?" removido) |
| 04/11 | render final K16: 12 min em 5,4 min (24 fatias); GPU com média de 58% de utilização e 35% de VRAM. Prioridade = mais tarefas simultâneas, não resolução (fica em 1440p) |
| 04/11 | **K16 entregue** (`D:/kriegschronik/k16_seekrieg/entrega/`). Medição e lições em `producao3d/k16/MEDICAO.md`; miniaturas por `ferramentas/miniaturas_k16.py` (o objeto do título + 2–4 palavras que acrescentam, sem repetir o título) |
| 04/11 | leitura óptica do K16 → DIRETIVA DO PRÓXIMO VÍDEO (topo do documento): creme, skill teardown inteira, objeto vivo, mecanismo com 2 números, kit/karten nos mapas, sem repetição, legendas por frase, título coerente, 8 bits |
