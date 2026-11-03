# Plano de qualidade dos canais 3D (DE e ES): versão fechada em revisão adversarial, 03/11/2026

**Origem:** o Eduardo pediu que o suporte e o minerador se reunissem, cruzassem todo o empirismo das leituras de referência e fechassem, em conversa adversarial, o plano mais inteligente e eficaz para chegar perto da qualidade de AiTelly, Reconstructed e do Short do Learjet. Decisão dele na mesma conversa: **nada retroage**. O v14b não ganha v3; o plano vale do próximo vídeo em diante, nos dois canais.

**Documentos de base:**
- `docs/principio-producao-multidimensional.md`: o porquê;
- `docs/acabamento-threejs.md`: bibliotecas e presets de acabamento;
- `docs/referencia-aitelly.md`: a referência de animação mais completa.

**Como foi fechado:** proposta v1 (suporte) → revisão adversarial com dados de produção (minerador) → tréplica (suporte) → esta versão. As divergências e como foram resolvidas estão na seção 6.

---

## 1. Diagnóstico (mesmo medidor a 24 fps em nós e nas referências)
| Medida | v14b v2 (DE) | Learjet p2 (ES) | AiTelly (mediana de 10) | Reconstructed | Short do Learjet |
|---|---|---|---|---|---|
| Takes distintos/min | 11,0 | ~8 | **16,9** | 12,3 | 1 take de 81 s |
| Repetição | base de mapa volta | 56% | 4,5% | 3% | 0% |
| Câmera parada | **36,7%** | 60,6% | **5,2%** | n/m | 23,9% |
| Cartão escuro separado do 3D | **~24%** (máx. 24 s) | 21% | raro | 22% (1 linha, ~5 s) | 0% |
| Colorfulness | 17 | — | 30 | 10–13 | — |
| Números falados/min | 2,25 | ~6 | 1,8 | — | — |

**Conclusão:**
- **O roteiro chegou ao nível das referências:** o v2 do vídeo 14 passou o checklist agregador.
- **A imagem não.** As três lacunas que explicam a diferença:
  - cartão separado da cena;
  - câmera parada;
  - objeto fechado que não explica.

  Nenhuma das três é de motor nem de realismo.
- **Causa do v14b** (pelo minerador):
  - faltava **componente** (o kit só tinha esquema 2D de fundo escuro; não existia "fluxo sobre a cena");
  - houve **erro de processo**: o render sincronizou antes de o batedor de acabamento ser integrado, então os trens saíram no kit antigo;
  - **~1 h 30 se perdeu em infraestrutura**: a G4 caiu 2× no vídeo, a subida levou 32 min e os stills locais travaram.

---

## 2. As mudanças, na ordem de execução
### M0. Infraestrutura (antes de tudo; devolve ~1 h por vídeo)
- **Cache de assets montado na G4** (Drive), para a subida do projeto cair de ~32 min para < 5 min (o Eduardo já pediu).
- **Stills sempre na G4** (`canal.py stills`). Nada de dois bundles locais em paralelo.
- **Janela única de G4 por vídeo:** a fila (stills dos novos → batedor → render → alinhamento) fica pronta **antes** de ligar; liga, roda tudo em sequência e desliga.
  - Respeita a regra do Eduardo de desligar a G4 sem job e evita a queda por ociosidade no meio do trabalho.
  - Respeita a G4 compartilhada: 1 render e 1 narração por vez.
- **Se o cache não baixar a subida para < 5 min**, o M0 sobe de prioridade e vira decisão do Eduardo (por exemplo, máquina própria).

### M1. Régua preditiva no plano + régua final a 24 fps
- **Preditiva** (no `plano.py`, custa segundos): calcula a partir das declarações de cada batida:
  - família;
  - preset de câmera (**"parado" proibido**);
  - duração de cartão;
  - **take único** por hash de (componente, ângulo, trecho de tempo).

  O plano não sai com a régua prevista fora da meta.
- **Calibração:** a velocidade mínima de cada preset fica acima do limiar do medidor (zoom ≥ ~0,1% por quadro, deriva perceptível). Senão um "dolly lento" conta como parado.
- **Final** (24 fps, o mesmo medidor das referências): **conferência**, não descoberta. Se a preditiva errar por mais de 10 pontos percentuais em alguma medida no primeiro vídeo, a final volta a ser o gate principal.
- **Definição anti-jitter de "take distinto":** segmentos de ≥ 1,5 s com correlação < 0,93 entre si.

### M2. Esquema sobre a cena + câmera nunca parada (ataca os 24% e os 37%)
- **`EsquemaNaCena`** (componente novo, nos dois canais):
  - fluxo de caixas, setas e ícones desenhado **sobre o mapa, o terreno ou o diorama em movimento**, com os ícones **andando** pela trilha;
  - **rótulo com linha de chamada** preso ao ponto 3D.

  Substitui o cartão escuro explicativo. O cartão preto fica só como soco de 1 linha.
- **Presets de câmera:** dolly num eixo com easing, órbita lenta, travelling lateral, grua, segue-objeto, zoom no detalhe.
- **Gerador de ângulo** com take único por batida. "Take" conta também a mudança de câmera ou ação dentro da batida (é o que o medidor conta), então ≥ 12/min sai **sem dobrar o número de batidas**.

### M3. Acabamento de desenho integrado ANTES do render
- Contorno (casca invertida) + toon de 2–3 tons + sombra de contato em todo objeto do kit (`docs/acabamento-threejs.md` §3.1 e §3.4).
- **Regra de processo: nenhum render sem o batedor fechado e integrado ao projeto.**

### M4. Palco explicativo × mundo
- Presets de palco (planta técnica azul com grade, estúdio escuro com sombra de contato, grade holográfica, céu liso), onde o modelo explicativo abre sem concorrência.
- O mundo (terreno real + céu) situa.
- O plano alterna os dois.

### M5. Modelo explicativo com interior (corte / vista explodida / raio X)
- Três componentes genéricos:
  - **corte** (`clippingPlanes` + tampa colorida);
  - **vista explodida** (peças animadas no eixo);
  - **raio X** (casca Fresnel/arame + interior emissivo + bloom).
- **Modelagem paramétrica por código**, estilo desenho, uma cor por subsistema. Custo medido: **2–3 h de agente por modelo novo, uma vez só**; depois ele vive na biblioteca do canal como modelo (nunca como take reaproveitado).
- **Primeiros modelos:** culatra de cunha do Krupp (DE); cauda em T com o atuador do estabilizador (ES).
- **Por código (com referência):**

  | Canal | Mecanismos |
  |---|---|
  | DE | culatra Krupp, agulha do Dreyse (já feita em corte no v8), Mitrailleuse (v8), telégrafo e receptor de fita, trem de rodagem e bielas (médio), perfil de via e estação |
  | ES | cauda em T, tubo de pitot congelando, turbofan em corte (médio), truque de trem descarrilando |
- **Não dá por código:** figura humana e cavalo (usar os desenhados e rigados prontos), dano e deformação realistas, fumaça e fogo (flipbooks/VDB prontos).

### M6. Instrumento e dado dentro da cena (por demanda do tema)
- **Painel vivo** (já aprovado): ≤ 3 grandezas + barra amostrada + relógio com compressão.
- **Vista de instrumento:**
  - ES: horizonte artificial, radar, vista de sensor com retícula;
  - DE: telégrafo, binóculo, mapa de Estado-Maior com régua.
- **Prova reconstruída** quando houver fonte: ponto de vista recriado em 3D e, com licença, o quadro real ao lado.

---

## 3. Gates (metas por canal)
| Gate | Meta | Onde |
|---|---|---|
| Roteiro | checklist agregador de 15 itens; ≤ 4 números falados/min | antes da narração |
| Dimensões | ≥ 3 nas batidas de mecanismo | régua preditiva |
| Câmera parada | ≤ 10% nos planos 3D | preditiva + final |
| Cartão escuro | ≤ 10% do vídeo; nenhum trecho > 3 s | preditiva + final |
| Takes distintos | ≥ 12/min (rumo a 15), definição anti-jitter | preditiva + final |
| Repetição | ≤ 5%; take nunca reaproveitado | preditiva (hash) + final |
| Imagem congelada | 0% | final |
| Colorfulness | **DE ≥ 18 nos palcos explicativos** (sem meta em época/gravura); **ES ≥ 22** | final |
| Luz | mediana de luminância ≥ 100 nos planos abertos | batedor |
| Juiz | **calibrado nas referências:** 12 quadros de AiTelly, Reconstructed e do Short; meta = média delas − 0,5; no máximo 2 rodadas. Se o juiz der < 8 às próprias referências, a meta fixa de 8,5 cai | batedor |
| Falha em qualquer gate | não entrega sem **OK explícito do Eduardo**, com a lista do que falhou | entrega |

---

## 4. Custo por vídeo (medição de 03/11)
| Etapa | Hoje | Com o plano |
|---|---|---|
| Roteiro | 20 min | igual |
| Narração (AI Studio) | 25 min | igual |
| Alinhamento | 5 min de G4 | igual |
| Planejamento | 30 min | **+30–60 min** (declaração do take, presets, régua preditiva) |
| Render | 17,5 min de G4 | **+10–15 min de G4** (cena 3D custa mais por quadro que cartão) |
| Mux e embalagem | 15 min | igual |
| Infraestrutura perdida | ~1 h 30 | **−~1 h** com o M0 |
| Modelo explicativo novo | — | **+2–3 h**, só quando entrar um |

**O que se corta sem perder o salto:**
- rodadas de juiz (máx. 2);
- Blender (só exceção, 1–3 planos);
- stills de todas as batidas (só as novas e as de mecanismo).

---

## 5. Regras de processo
1. Nada retroage; o vídeo entregue não ganha nova versão sem pedido do Eduardo.
2. Nenhum render sem o batedor fechado e integrado.
3. Gate em falha só passa com OK explícito do Eduardo.
4. G4 numa janela única por vídeo, com a fila pronta; desligada sem job; 1 render e 1 narração por vez.
5. Material de terceiros só como referência de método (o AiTelly declara proteção de PI); sem áudio real de controle de tráfego.
6. Retenção por bloco no Studio depois de publicar decide se cada regra fica.

---

## 6. As divergências da revisão adversarial e como foram resolvidas
| Ponto | Proposta v1 (suporte) | Objeção (minerador, com dado) | Fechado |
|---|---|---|---|
| Infraestrutura | não havia | ~1 h 30 perdida no v14b (2 quedas, 32 min de subida, stills travando) | **M0 primeiro**; janela única de G4 para conciliar com a regra de desligar sem job |
| Régua | só a final, a 24 fps | descobrir 37% de câmera parada custou um render inteiro (17,5 min de G4) | **preditiva no plano** + final como conferência; calibração dos presets acima do limiar do medidor |
| Causa do v14b | "o planejador escolheu cartão?" | faltava componente (não havia esquema sobre a cena) + erro de processo (render antes do batedor) | **componente M2** + regra "nenhum render sem batedor integrado" |
| Cor | colorfulness ≥ 22 nos dois | conflita com o estilo DE aprovado (gravura dessaturada, acento só de facção) | **meta por canal e por palco** (DE ≥ 18 nos palcos; ES ≥ 22) |
| Juiz | ≥ 8,5 fixo | 3 rodadas no v14b, média 6,4 → 7,0, 1 de 12 passou | **calibrado nas referências**, meta = média − 0,5, máx. 2 rodadas |
| Takes ≥ 12/min | meta | cabe: G4 independe do número de takes; a definição precisa ser anti-jitter | mantido, com a definição de 1,5 s / 0,93 |
| Modelo por código | proposto | 2–3 h por modelo; humano, cavalo, dano e fumaça não dão por código | mantido com a lista do que dá e do que não dá |

**O que mudaria o plano:**
- o cache não baixar a subida para < 5 min;
- o juiz calibrado dar < 8 às próprias referências;
- a régua preditiva errar > 10 pontos no primeiro vídeo;
- a retenção por bloco não melhorar nos blocos de mecanismo.
