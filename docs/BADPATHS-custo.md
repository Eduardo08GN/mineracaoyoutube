# Caminhos ruins de CUSTO (tempo e tokens)

Lista empírica, montada entre 23/10 e 07/11/2026 nos canais Kriegsmomente, Segundo a Segundo, What If ES e nos pilotos. Os caminhos ruins **técnicos** ficam em `docs/BADPATHS.md` e nos BADPATHS de cada pipeline. Este doc trata do que **queima orçamento**. Leia antes de mudar um pipeline, antes de abrir um canal novo e antes de aceitar uma técnica nova "só para testar".

**Régua de referência:** o K19 e o K20 (07/11) ficaram excelentes, mas custaram ~30% do limite semanal do Ultra e uma noite inteira. Quase todo o custo veio dos itens abaixo, não do vídeo em si.

---

## A. Tokens

### A1. Produzir dentro de uma conversa gigante
- **O que houve:** o K19/K20 foi produzido na mesma conversa da mineração, dos testes, da G4-2 e dos prints. O registro passou de 1,6 GB.
- **Por que custa:** o agente relê a conversa inteira a cada passo. Numa conversa longa, até um "ok, segue rodando" sai caro.
- **Regra:**
  - uma conversa nova e curta por vídeo, aberta com o doc do pipeline e o tema;
  - mineração, testes e infraestrutura ficam em conversas separadas.

### A2. Responder a cada aviso automático
- **O que houve:** monitores de job (batimento a cada 60 s) e agentes terminando geraram centenas de turnos, cada um com uma releitura completa só para dizer "segue rodando".
- **Regra:**
  - o job longo emite **um** aviso, no fim (sucesso ou falha);
  - o monitor filtra só os eventos que pedem ação;
  - aviso sem ação não ganha resposta longa.
- **Mas nunca sem vigia (07/11, lote 1 dos reels):** a G4-2 caiu e o pipeline ficou "cego e surdo" por horas. Todo job longo roda com um **sentinela** (script + Monitor) que checa a cada ~2 min a saúde da G4, o processo do job e o progresso do backlog, e que **emite só na mudança de estado**: queda, job morto, backlog parado há 10 min, erro, etapa concluída, fim. Silêncio quer dizer que está tudo andando. Na queda, ele relê a URL (`canal.py ligar`); com a VM viva, reanexa; se a VM morreu, religa e retoma por etapa, nunca do zero.

### A3. Fork de conversa longa
- **O que houve:** ~12 forks no K19/K20. Cada um herdou o contexto inteiro e rodou centenas de passos em Opus (300 a 500 mil tokens cada).
- **Regra:**
  - delegar com um **agente novo** e prompt autocontido, no modelo do nível certo;
  - fork só quando o contexto inteiro for indispensável, e nunca a partir de conversa longa.

### A4. Opus para tudo
- **O que houve:** downloads, folhas de contato e frentes de cena com contrato claro rodaram em Opus.
- **Regra:**

| Nível | Usar para |
|---|---|
| Haiku | Mecânico, conferido por script |
| Sonnet | Execução com contrato |
| Opus | Roteiro, crítica e revisão |

Na dúvida, o nível de cima (memória `feedback-sonnet-tarefas-simples`).

### A5. Ler imagens no contexto
- **O que houve:** folhas de contato, prints e telas do Colab foram abertos pelo agente. Cada imagem fica no histórico e é relida em todos os passos seguintes.
- **Regra:**
  - mandar a imagem ao Eduardo por SendUserFile sem abrir;
  - a decisão visual fica com o fiscal automático (Qwen3-VL na G4) e com o Eduardo;
  - abrir só quando a decisão depender disso, com recorte e escala reduzida.

### A6. Pesquisa pesada no vídeo
- **O que houve:** o K20 leu fontes primárias inteiras em 4 frentes paralelas.
- **Regra:** o dossiê fica em Sonnet com busca dirigida (fato → fonte). Fonte primária inteira só para o fato que sustenta o título.

### A7. Mensagens longas entre sessões e agentes
- **Regra:** contrato fixo no arquivo (`BRIEF_FRENTES.md`), e mensagem curta só com o delta.

---

## B. Tempo

### B1. Descoberta no meio da produção
- **O que houve:**
  - **Voz:** 3 candidatas.
  - **Take cinematográfico:** 2 estilos, um teste e um lote.
  - **Terreno:** 2 rodadas + repintura, depois abandonada pela rota barata.
  
  Tudo isso aconteceu durante o K19/K20.
- **Regra:**
  - a stack fica **congelada** antes do vídeo;
  - técnica nova roda num batedor em sessão própria e só entra no kit depois de aprovada;
  - o vídeo em produção nunca espera um teste.

### B2. Gerar variantes enquanto a escolha não vem
- **O que houve:** 49 e 52 imagens geradas em dois estilos, com o dobro de G4, à espera da escolha do Eduardo.
- **Regra:**
  - escolha de estilo é **portão antes do lote**, com uma folha de 6 imagens;
  - sem resposta, seguir com a recomendação e avisar, em vez de gerar tudo em dobro.

### B3. Frentes de cena começando tarde
- **O que houve:** as cenas do K19 (mapa, tinta, 3D) só começaram depois das imagens, com ~2 h perdidas.
- **Regra:** as frentes começam assim que o roteiro sai, **em paralelo** com a narração e com o lote de imagens.

### B4. Artefato só na VM
- **O que houve:**
  - o lote cinematográfico do K19 se perdeu duas vezes;
  - o render do Learjet se perdeu (212 quadros);
  - a repintura agendada e o primeiro lote de stills também.
- **Regra:**
  - **baixar cada bloco ao PC no marcador**;
  - render em lotes com retomada;
  - VM é rascunho, não armazenamento.

### B5. Reinstalar e baixar modelos a cada ligação da G4
- **O que houve:** venvs, os ~58 GB do Qwen-Image, os modelos de TTS etc. foram reinstalados a cada VM nova.
- **Regra:** imagem `.sqfs` no Drive com ambientes e pesos, copiada para todas as contas, como já se faz com a engine Unreal.

### B6. Erro opaco de ferramenta, tentado às cegas
- **O que houve:**
  - caminho `/content` virando caminho do Windows no Git Bash;
  - `tar` com `D:` sendo lido como host remoto;
  - PyAV × faster-whisper;
  - conflito de uv e pacotes no piloto v2v (~25 min);
  - `np.convolve` com janela longa (12 min travados).
- **Regra:**
  - na 2ª falha igual, ler a doc ou o fórum (portão 4);
  - corrigido, a correção vai **no script e no BADPATHS na hora**, para não reaparecer em outro canal.

### B7. Falso "G4 caiu"
- **O que houve:** a URL do proxy do Colab troca a cada ~1 h e parece queda. Isso quase gerou religação às cegas e reprocessamento.
- **Regra:**
  - antes de religar, `canal.py ligar` ou `reconectar` relê a URL e confere o `uptime`;
  - VM viva → reanexar ao job, nunca relançar.

### B8. Infraestrutura de navegador frágil
- **O que houve:**
  - proxy vencido no perfil Dolphin travou a automação;
  - perfil aberto pelo botão INICIAR ficou sem porta de automação;
  - Colab e AI Studio no mesmo navegador disputaram o foco;
  - aba velha com aviso de "sair da página".
- **Regra:**
  - perfis de G4 **sem proxy**, abertos por `dolphin_iniciar.py`;
  - um cliente de navegador por vez (porteiro);
  - nada de tarefa de outra operação no perfil da G4.

### B9. Matar processo pelo nome
- **O que houve:** um `taskkill` pelo nome do script derrubou os stills de outras frentes, porque o arquivo tinha o mesmo nome.
- **Regra:** encerrar só pelo PID ou pelo caminho completo.

### B10. Ociosidade desligando a G4 no meio da preparação
- **Regra:** preparar o lote no PC e só então ligar. Com a G4 ligada, cada minuto deve ter job (meta ≥ 70% de uso).

---

## C. Decisão de pipeline (os caminhos mais caros de todos)

### C1. Trocar a stack visual inteira sem prova lado a lado
- **O que houve:** cartoon técnico, maquete e palcos (03–04/11) foram aprovados e reprovados em 24 h. O UE5 "ilustrado" saiu com "cara de PS2". Reconstrução 3D foi descontinuada.
- **Regra:**
  - stack nova só entra depois de um batedor com still **lado a lado** com a referência e um vídeo nosso aprovado;
  - nunca no meio de um vídeo.

### C2. Construir à mão o que existe pronto
- **O que houve:** nuvens, setas, mapas, cidades e terreno foram feitos à mão. São 5 recorrências (`docs/BADPATHS.md` #1).
- **Regra:** levantamento de prontos antes (Fab, GitHub/npm, **Hugging Face**, tutoriais). Construir só o que o levantamento provar que não existe.

### C3. Piloto de técnica cara sem critério de parada
- **O que houve:**
  - o v2v (troca de personagem com Wan Animate) levou ~1,5 h de piloto, com 19 min por take a 720p, e foi descontinuado;
  - o MiniMax H3 foi barrado pela licença depois de estudado.
- **Regra:**
  - antes do piloto: ler a **licença**, estimar o tempo por minuto de vídeo e definir o critério de parada (ex.: > 5 min de G4 por 10 s = parar);
  - o piloto mede isso em 1 take, antes de instalar o resto.

### C4. Perseguir fidelidade onde não aumenta a compreensão
- **O que houve:** horas em detalhe de modelo, acabamento de terreno e repintura. O Eduardo aprovou o vídeo com o terreno simples. E no terreno de mapa de época (07/11), segundo ele, **~80% do ganho de qualidade veio da linguagem de cinema** (sem borda da maquete, lente longa, névoa, profundidade de campo, rótulos de época), não de asset nem de modelo: técnica de enquadramento custa quase nada.
- **Regra:** o princípio do canal vale para o orçamento. Investir na ordem roteiro → desenho da informação → animação → acabamento, e o acabamento só até ajudar a entender.

### C5. Duplicar o trabalho em paralelo sem dividir o que é comum
- **Lição:** no K19/K20 a divisão funcionou: um batedor único da stack e duas sessões usando a mesma receita.
- **Regra:** o que é comum aos vídeos (voz, receita, kit) se resolve uma vez; o que é próprio de cada vídeo fica em paralelo.

### C6. Over-engineering por precisão (07/11, terreno)
- **O que houve:** para o terreno, propus relevo com exatidão (DEM real, tiles, `3d-tiles-renderer`, 6–10 h). O Eduardo cortou: precisão de relevo é ultrarrealismo e não é o 80/20; o público não percebe.
- **Resultado:** a rota simples (three.js nativo, ~150 linhas, mapa de época real sobre relevo **aproximado**, linguagem de cinema) ficou **melhor** que a complexa, com custo mínimo.
- **Regra:** antes de propor, perguntar: "o espectador nota a diferença e entende melhor por causa disso?" Se não, aproximar e investir no que é visível.

### C7. Formato novo sem teto de custo numa página sem receita (08/11, reels do FB)
- **O que houve:** os reels de acidente da página do FB, que ainda não é monetizada, passaram por três rotas em dois dias: IA por plano, código low-poly e o kit Polyfork. Cada rota teve o seu batedor, além de um lote de 4 reprovado inteiro. O custo de tokens e de tempo ficou alto demais para o retorno, e o formato foi pausado.
- **Regra:**
  - antes do batedor de um formato novo, defina o **teto de custo por peça** (tokens + G4 + horas) e o **retorno esperado** (monetização, audiência);
  - em canal ou página sem receita, só entra stack que já existe e é barata. Nada de stack nova até o canal dar sinal de retorno.

### Filosofia (Eduardo): atalho inteligente antes de força bruta
1. Usar algo **real e pronto** (dado público, mapa de época, obra, modelo existente) antes de criar.
2. Recurso **nativo e simples** (three.js puro, Remotion) antes de pacote pesado ou G4.
3. **Linguagem de cinema** (enquadramento, lente, luz, névoa, ritmo) antes de caprichar em asset.
4. Só então, se faltar, o pacote ou a G4.

---

## Checklist antes de mudar um pipeline (ou abrir um canal)
1. A mudança passou num batedor fora do vídeo, com lado a lado?
2. Existe pronto (levantamento das 4 fontes)?
3. Licença comercial ok?
4. Quanto custa por minuto de vídeo, em G4 e em tokens? Há critério de parada?
5. Ela ajuda o espectador a entender? O espectador nota a diferença? (sem over-engineering por precisão)
6. O vídeo vai rodar numa conversa nova e curta, com o modelo por nível, sem fork e sem ler imagens?
