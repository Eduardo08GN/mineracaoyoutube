# Pipeline do Kriegsmomente (padrão K19/K20)

Decisão do Eduardo de 07/11/2026: o K19 (Krupp 1870) e o K20 (Mars-la-Tour) são "o vídeo perfeito". Todo vídeo novo do canal sai **com esta composição**. O que muda é a operação: os dois custaram ~30% do limite semanal do plano, e quase todo esse gasto foi descoberta e orquestração, não o vídeo em si. Este doc congela o resultado e define a rota barata para repeti-lo.

> O `docs/molde-kriegsmomente-barato.md` (molde "dark") fica como **alternativa de reserva**. O padrão é este.

## 1. Composição (não mudar sem pedido do Eduardo)
- **Duração:** 15–20 min, ~2.300–2.500 palavras em alemão, ~160 batidas.
- **Fatias por batida:**

| Tipo | Fatia | Como é feito |
|---|---|---|
| Cinematográfico | ~30% | Imagem de época em **colódio sépia** (Qwen-Image; Qwen-Image-Edit com referência real para uniforme e equipamento), versão creme e profundidade, push 2,5D **Mesa**, fumaça CC0, grão, número contando, texto com profundidade |
| Mapa | ~20% | Mapa 2D creme (kit do K18), sem relevo 3D |
| 3D / eureka | ~22% | 3D de **objeto** (culatra, espoleta, alça, trajetória) e ≥ 1 take eureka |
| Esquema a tinta | ~13% | Kit tinta (linha-guia com ponto, serifa itálica de época) |
| Época 2,5D | ~10% | Obra real em domínio público, créditos só na descrição |
| Cartão | ≤ 5% | Número em destaque |
| Terreno 3D | poucas batidas | Rodada 2 do batedor: sol baixo, sombra encaixada, N8AO e capim. **Sem repintura** |

- **Voz:** a voz **A** do Qwen3-TTS, clonada da referência fixa do canal, com melhor de 3 por frase. O QA usa Whisper com o áudio em array de 16 kHz, mais o UTMOS.
- **Áudio:** só voz e efeitos pontuais, **sem música**, −14 LUFS.
- **Regras do canal:**
  - tema creme;
  - câmera nunca parada mais de 4 s;
  - transição motivada;
  - nunca reaproveitar take;
  - legendas com até 17 caracteres por segundo;
  - overlay no espaço vazio;
  - créditos só na descrição;
  - .txt com 3 títulos (A/B) e descrição curta;
  - 3 miniaturas de tipos diferentes.
- **Títulos:** no vetor do canal ("Warum … – obwohl …?" com um detalhe técnico, "Preußen + número + verbo" e "Deutsch-Französischer Krieg 1870: …"). O gancho vai nos **primeiros ~60 caracteres**, porque a página inicial do celular corta o resto.

Receita técnica de cada peça: `docs/receita-k19-stack.md`. Projetos de referência: `D:/kriegschronik/k19_krupp/v1/` e `D:/kriegschronik/k20_marslatour/v1/`.

## 2. Fluxo do vídeo
| # | Etapa | Modelo | Saída |
|---|---|---|---|
| 1 | Tema pelo radar e títulos | Opus, curto | tema + 3 títulos |
| 2 | Dossiê com fonte por fato | Sonnet + busca | `dossie.md` |
| 3 | Roteiro DE com cada batida marcada pelo tipo | **Opus, uma vez** | `roteiro.md` |
| 4 | Crítica de fatos | Sonnet | correções aplicadas |
| — | **Portão A:** o Eduardo aprova roteiro e títulos | — | — |
| 5 | Narração com a voz A | script na G4 | `narracao.wav` + `tempos.json` |
| 6 | Lote de imagens cinematográficas em colódio + fiscal visual Qwen3-VL (com 1 refação automática) | script na G4 | `cine/final/` |
| 7 | Frentes de cena, uma por família, preenchendo os componentes do kit (contrato `tipos.ts` + `BRIEF_FRENTES.md`) | **Sonnet**; Opus só no 3D/eureka | `v1/src/` |
| — | **Portão B:** o Eduardo aprova uma folha de contato por família | — | — |
| 8 | Render, mux, legendas, miniaturas, ffprobe | script na G4 + Haiku | `entrega/` |
| 9 | Desligar e conferir a G4 | script | `saude` = G4_FORA |

As etapas 5 e 6 rodam juntas na G4, que deve ficar com ≥ 70% de uso. A 7 começa assim que o roteiro sai, **em paralelo** com a 5 e a 6, e não depois delas.

## 3. Regras de custo (por que o K19/K20 saiu caro e como evitar)
O agente relê a conversa inteira a cada passo. Numa conversa longa, até um passo pequeno fica caro. Os multiplicadores do K19/K20:
1. **Responder a cada aviso automático** de job ou agente: foram centenas de releituras completas.
2. **Forks de uma conversa gigante:** cada um carregou o histórico inteiro, em Opus.
3. **Imagens lidas no contexto,** que ficam no histórico para sempre.
4. **Descoberta no meio da produção:** testes de voz, estilo e terreno, e defeitos de ferramenta.

Por isso, a partir do K21:
- **Uma conversa nova e curta por vídeo,** aberta só com este doc e o tema. Nunca produzir na conversa de mineração e testes.
- **Nada de fork.** Agentes novos com prompt curto, no modelo do nível certo:

| Nível | Tarefas |
|---|---|
| Haiku | Mecânicas |
| Sonnet | Execução com contrato |
| Opus | Roteiro, crítica e revisão |

- **Jobs longos avisam só no fim,** com um único aviso de sucesso ou falha. Nada de monitor emitindo batimento para o agente responder.
- **O agente não lê imagens.** Folhas e stills vão ao Eduardo por SendUserFile, e a decisão visual fica com o fiscal Qwen3-VL e com o Eduardo.
- **A stack fica congelada.** Técnica nova é testada fora do vídeo, numa sessão própria, e só depois entra no kit.
- **Meta:** ≤ 1/5 dos tokens do K19, medida no K21.

## 4. Operação da G4 (lições do K19/K20)
- **Duas G4:**
  - G4-1, no perfil Ivone;
  - G4-2: `T2_G4=2`, perfil da conta 2. **Nunca deslogar essa conta.**
  
  Cada vídeo usa a sua G4, com o seu `T2_DONO`.
- **Perfis Dolphin sem proxy:** um proxy vencido travou o perfil da Ivone. Abrir com automação por `python D:/tracer3d2/dolphin_iniciar.py <id>`; o botão INICIAR do Dolphin abre **sem** a porta de automação.
- **Git Bash:**
  - sempre `export MSYS_NO_PATHCONV=1`, porque caminhos `/content/...` viravam caminhos do Windows;
  - para extrair no PC, usar `tar --force-local`.
- **Faster-whisper:** passar o áudio como array, porque o `decode_audio` quebra com o PyAV da G4.
- **"G4_FORA" com a máquina viva:** a URL do proxy do Colab troca a cada ~1 h. Rodar `canal.py ligar` relê a URL e encontra a mesma VM. O `canal.acompanhar` agora relê a URL sozinho.
- **Baixar cada bloco ao PC assim que fica pronto:** o lote cinematográfico do K19 se perdeu duas vezes por estar só na VM.
- **Encerrar processos só pelo PID ou pelo caminho completo,** nunca pelo nome. Um `taskkill` pelo nome derrubou stills de outras frentes.
- **Célula vazia em 0 s / CANAL_SEM_URL:** o runtime está em CPU ou preso. Trocar o tipo para G4, ou desconectar, excluir e religar.
- **Imagem `.sqfs` no Drive** com ambientes e pesos (Qwen-Image/Edit, Qwen3-TTS, Qwen3-VL, Depth Anything), copiada para a conta 2. Ainda pendente: evita reinstalar e baixar ~60 GB por vídeo.

## 5. Pendências antes do K21
1. Extrair do K19/K20 um **kit** (componentes por família + contrato + `BRIEF_FRENTES.md` padrão), para as frentes Sonnet só preencherem.
2. **Scripts únicos** para narração, lote cinematográfico com fiscal e download por bloco, e render + mux + entrega.
3. **Imagem `.sqfs`** no Drive das duas contas.
