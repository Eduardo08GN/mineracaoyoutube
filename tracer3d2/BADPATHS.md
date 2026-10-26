# BADPATHS: caminhos ruins já percorridos (Tracer3D 2.0)

Registro de cada armadilha encontrada na produção dos vídeos V3, Schwerer Gustav e "Artillerie bei Nacht" (vídeos 3, 4 e 5, out/2026), mais as herdadas do 1.0.
**Leia antes de qualquer produção.** Cada item traz o **sintoma** observado, a **causa** encontrada, a **regra** que passou a valer e **onde** ela está implementada.
Agente: se o sintoma aparecer, não investigue de novo; aplique a regra. Encontrou um caminho ruim novo? Acrescente aqui.

---

## 1. G4 / Colab (infraestrutura)

| # | Sintoma | Causa | Regra / correção | Onde |
|---|---|---|---|---|
| 1.1 | Cada comando na G4 levava 1–2 min, um de cada vez; diálogos e menus travavam cliques; 400 KB de base64 numa célula congelaram o editor ("Page Unresponsive") | Controle por células digitadas no Colab | Canal HTTP pela porta-proxy do Colab (`google.colab.kernel.proxyPort`), com os cookies do navegador no `requests`. Uma única célula por sessão | `canal.py`, `vm/servidor.py` |
| 1.2 | A G4 nunca se desligaria com o Chrome quente aberto | O vigia antigo considerava "ativo" qualquer processo chrome/node | A ociosidade é medida no servidor (pedidos e jobs; jobs daemon não contam) | `vm/servidor.py` |
| 1.3 | `/desligar` não desligava | `runtime.unassign()` só funciona **dentro do kernel** | A thread `vigia_t2` dentro do kernel lê `DESLIGAR` e `ocioso.txt` | `canal.py` (`VIGIA_KERNEL`) |
| 1.4 | `g4.py ligar` travado 14 min | Esperava a confirmação do vigia antigo | `canal.conectar_runtime()` só conecta. O vigia é a `vigia_t2` | `canal.py` |
| 1.5 | `ligar` preso lendo a saída, com a URL já na tela | O Colab passou a desenhar a saída da célula **num iframe** | A célula roda em subprocesso com prazo; o plano B varre **todos os frames** | `canal.py` (`ligar`) |
| 1.6 | O plano B pegava a URL errada | O **código** da célula também contém `URL=` | Só vale a regex `URL=(https://…)=FIM` | `canal.py` |
| 1.7 | Render caiu às 3 h com "G4_FORA", mas a VM estava viva com o job rodando | A **aba** do Colab desconectou "por inatividade" porque não havia célula em execução | A célula do canal **fica rodando** (`while not DESLIGAR: sleep`) | `canal.py` (célula do `ligar`) |
| 1.8 | Quase re-renderizou por cima de um render ainda rodando | Interpretamos "G4_FORA" como VM morta | Antes de re-renderizar, reconecte e **confira `/saude` e `/job`**. Se o job está vivo, espere e baixe. Nunca dispare um 2º `render.sh` (ele faz `rm -rf frames out`) | procedimento |
| 1.9 | `JSONDecodeError` (traceback) em vez de alerta | Runtime desligado responde sem JSON | `saude()` e `exec_vm()` convertem em `G4_FORA` | `canal.py` |
| 1.10 | `pkill -f stills_quente.mjs` matou o próprio comando | O texto do comando contém o padrão | Mate pelo PID (`pgrep -af`, depois `kill <pid>`) | procedimento |
| 1.11 | Cena nova preta, sem erro | Arquivo novo em `public/` (ex.: `bahn.json`) não refazia o bundle | A assinatura do bundle inclui `public/`. Rode `canal.py sync <v1> public` depois de mexer em `public/` | `vm/stills_quente.mjs` |
| 1.12 | "Shader Error VALIDATE_STATUS" no render | Várias abas WebGL num mesmo Chrome | Um Chrome por faixa de quadros | `vm/render.sh` |
| 1.13 | Agentes apagaram a trava do `garantir` e renderizaram localmente | Pressa diante da G4 lenta | Brief: **nunca** renderizar localmente nem apagar trava; esperar. A trava tem validade de 30 min | briefs, `canal.py` |
| 1.14 | `ligar` travava durante a narração | Colab e AI Studio no **mesmo navegador** | **G4 primeiro**. A narração só começa depois de "stills quentes prontos" | procedimento |
| 1.16 | `ligar`: `DevToolsActivePort` não existe | O perfil do Dolphin foi aberto **pela janela** (sem porta de automação) | Pela API local: `/browser_profiles/<id>/stop`, esperar uns segundos e `/start?automation=1` (repetir enquanto der `PROFILE_ALREADY_RUNNING`) | procedimento |
| 1.17 | Depois de reiniciar o perfil, o Colab mostra "Escolha uma conta" e a conta aparece "Desconectada" | O reinício do perfil derrubou a sessão Google | Pedir ao Eduardo que entre (nunca digitar senha). Enquanto isso, adiantar o que não usa a G4. Depois do login, a aba do AI Studio também precisa ser reaberta (`/generate-speech`) | procedimento |
| 1.15 | Batedor matou todos os `node.exe` da máquina | `taskkill /IM node.exe` | Mate só os PIDs que você abriu | brief do batedor |

## 2. Narração (AI Studio / Gemini TTS)

| # | Sintoma | Causa | Regra / correção | Onde |
|---|---|---|---|---|
| 2.1 | Wavs trocados ou inválidos, 4 narradores na mesma aba | No Windows, `TaskStop` **não mata o python filho** | Depois de `TaskStop`, rode `taskkill /T /F` e confira 0 processos. Trava de processo único | `narrar.py`, memória `feedback-taskstop-windows` |
| 2.2 | Clique em Download expirava | O balão "Send prompt" do Run cobria o botão | Mover o mouse e Escape antes; `dispatch_event` como plano B | `narrar.py` |
| 2.3 | `goto` empacava | Diálogo "sair da página?" com áudio gerado | `pg.on("dialog", accept)` e nova tentativa | `narrar.py` |
| 2.4 | Baixava lixo em 12 s | Run não tinha começado a gerar | Só conta depois de aparecer "Stop"; o wav é validado com ffprobe | `narrar.py` |
| 2.5 | Download sempre com 0 byte | O clique em **pausa** passou a abortar o áudio | **Nunca** clicar em pausa; repetir o download vazio até 5 vezes | `narrar.py` |
| 2.6 | O TTS **pulou 69–76 palavras** duas vezes no mesmo trecho; a duração não denunciou | A frase começava com "Ergebnis: …"; o modo roteiro ("Nome: fala") trata isso como rótulo | No roteiro, **nunca "Palavra:" abrindo frase**. O **WER é o portão**: capítulo com WER > 0,15 passa por diff (dígito contra número por extenso é normal; trecho apagado não é). Para regerar: `narrar.py <id>`, `kv3/alinhar_um.py <id>` na G4 e mesclar | `g4/alinhar_um.py`, ARQUITETURA |
| 2.8 | WER 0,41–0,48 com áudio de fala contínua e duração normal (vídeo 6, caps. 8 e 9) | O `transcribe` do Whisper **pula trechos** em áudio longo. O alinhamento forçado (`align` com o roteiro) estava certo | Antes de regerar a narração, transcreva em **pedaços de 30 s** na G4. Só regere se o trecho faltar também nos pedaços | procedimento |
| 2.7 | Âncoras de batida quebraram depois de reescrever uma frase | A ocorrência (`nr`) de palavras repetidas mudou | Depois de mudar o texto, rode `plano.py` e corrija `wort`/`nr` | procedimento |

## 3. Plano, kit e cenas

| # | Sintoma | Causa | Regra / correção | Onde |
|---|---|---|---|---|
| 3.1 | Vídeo "parado demais": 58% de cartões, 12 seguidos (V3) | O cartão é barato no kit | No máximo **40% `ui`** e **2 seguidos**; 3D ou mapa a cada ~15 s | `ferramentas/plano.py` (linha DINAMISMO) |
| 3.2 | Planejadores gastaram ~1 M de tokens | Muitas rodadas de stills com imagens no contexto | No máximo 2 rodadas por capítulo, em folhas reduzidas, com JSON gerado por script | `BRIEF_PLANEJADOR.md` |
| 3.3 | Agentes inéditos com 0,5–0,7 M de tokens cada e mais de 2 h (noite) | Escopo aberto e sem teto | Teto de tempo e de tokens. Modelos novos viram **modelo do kit** (`registraModelo`) e as batidas de câmera viram `Modell` em JSON | briefs; `modelos_gustav.tsx`, `modelos_nacht.tsx` |
| 3.4 | Batida nova renderizava a cena da Bertha | O `beats/index.ts` do modelo registra os componentes da Bertha, com IDs iguais | Em todo vídeo novo, `BEATS = {}` e só os arquivos inéditos dele | `beats/index.ts` de cada vídeo |
| 3.5 | Bundle quebrava ao carregar | `welt/g2_geo` lia `orte` da Bertha no `bahn.json` | Valores padrão em `daten.ts` | `daten.ts` (modelo) |
| 3.6 | Cena 3D toda preta (NaN) | Amostra com `t` repetido na série | `curva.ts` descarta `t` repetido | `kit/welt/curva.ts` |
| 3.7 | Fundo do mapa não desenhava | `Karte` com `grund.rasters` explícito | Use `grund: {modus: "auto"}` (registro `karten2/raster.json`) | API do kit |
| 3.8 | `KarteDetail` mostrava Loncin | Predefinição do raster da Bertha | Use `Karte` com `modus auto` | API do kit |
| 3.9 | `Bahn` à noite com chão preto | Sol abaixo do horizonte apaga o terreno | Cena noturna usa `Flug` com luar; `Bahn` só de dia | API do kit |
| 3.10 | Terreno novo exigia código | Pacotes por nome eram fixos no código | Pacotes de terreno em **dados** (`cenas/pacotes.json`) | `kit/welt/flug.tsx` |
| 3.11 | `public/bahn.json` e `zahlen.json` eram do vídeo anterior | Cópia do projeto-base | Ao criar o vídeo, copie `fisica/bahn.json` para `public/` (e sincronize) | procedimento |
| 3.13 | Duelo de artilharia no `Bahn` ilegível: projéteis finos, trajetória rasa | O `Bahn` foi feito para tiros de dezenas de km; a 2 km a escala some | Tiros curtos e comparações lado a lado viram cena inédita | vídeo 6, `INEDITO_waffen` |
| 3.14 | Geradores dos planejadores quebraram com `KeyError: 'dur'` | O `alinhamento.json` real não tinha `dur`; o provisório tinha | Depois de baixar o alinhamento, grave `dur` (duração do wav) em cada capítulo | procedimento |
| 3.12 | Cenas inéditas fracas (céu vazio, tela cinza, manequins) | Acabamento sob pressão | Revise a folha de contato do vídeo inteiro. Batida fraca pode ser trocada por cena do kit **sem novo agente**: escreva `cena` na batida, porque o kit tem prioridade sobre `BEATS` | `Video.tsx` (ordem kit > beats) |

## 4. Fatos e legendas na tela

| # | Sintoma | Causa | Regra |
|---|---|---|---|
| 4.1 | Legenda chamava fotos de Auerbach (1945) de "Schwerer Gustav" | O Commons rotula assim, mas o lugar aponta para a Dora | Legenda neutra quando a identificação não é segura ("80-cm-Geschütz, gesprengt 1945") |
| 4.2 | Acusação grave (fuzilamentos) de uma fonte só | Página do Yad Vashem não abriu para o agente | Crime e atrocidade: **verificar na fonte institucional** antes da narração |
| 4.3 | Citação atribuída a Manstein sem conferir o original | Fonte secundária | Sem conferência, sem atribuição nominal ("nach deutscher Darstellung") |
| 4.4 | Descrição listava livros que não estavam no dossiê | Lista de fontes escrita de memória | A seção QUELLEN só pode conter fontes de `fakten.md` |
| 4.5 | Promessa de tema no fim não cumprida | Teaser escrito antes de escolher o próximo tema | Teaser só anuncia o que já está decidido; senão, CTA genérico |

## 5. Áudio e entrega

| # | Sintoma | Causa | Regra / correção | Onde |
|---|---|---|---|---|
| 5.1 | Fim de capítulo sem música | Capítulo regerado ficou mais longo que a faixa | Laço com fusão de 1,5 s | `ferramentas/mixar.py` |
| 5.2 | 70 efeitos, disparo a cada 20 s | Palavras-chave genéricas ("Schuss", "Nacht") | Intervalo mínimo por efeito (`GAP`); as variantes saem dos arquivos existentes | `ferramentas/efeitos.py` |
| 5.3 | Mixagem falhou: arquivo não encontrado | `musica.tar` e `efeitos.tar` não extraídos | Extraia os pacotes antes de mixar | procedimento |
| 5.4 | Vídeo mudo publicado (1.0) | Render sem áudio ficou na pasta | `entrega/` só com mp4 com áudio (ffprobe); o mudo é apagado depois da mux | memória `feedback-entrega-so-arquivo-final` |
| 5.5 | Marca "SIMULATION" e linhas de licença na tela | Herança do 1.0 | Sem marca SIMULATION; **créditos só na descrição**: `QUELLEN_IM_BILD = false` | `ui/basis.tsx` |
| 5.6 | O usuário teve de pedir títulos e descrição | Ficaram só no `.txt` | Em toda entrega: os 3 títulos e a descrição completa **no chat** e no `.txt` | procedimento |
| 5.7 | Miniatura A poluída (HUD no fundo, manequins) | Quadro escolhido às cegas | Para a A, escolha quadro sem HUD (ou desfoque a região do texto) e inset forte (foto de arquivo serve). B e C são rostos do Flow | `miniaturas_guerra.py` |

## 6. Processo e escolha de tema

| # | Sintoma | Causa | Regra |
|---|---|---|---|
| 6.1 | Batedor de stack pulado (Bertha e V3) | Stack "já pronta" | **Portão obrigatório**: plano → batedor de stack → agentes inéditos. O batedor de dados não substitui o de stack |
| 6.2 | Radar indicou "bunker nuclear" com 39 mi (MrBeast), clipe musical em "armadura", gameplay em "D-Day" | Busca devolve megahits fora do tema | O título precisa conter um termo central; canais de entretenimento ficam fora (`radar_analise.py`) |
| 6.3 | Buracos falsos (Tiger com "0" em alemão) | A busca `relevanceLanguage=de` devolve vídeos em inglês | Oferta alemã = só vídeos em alemão, mais uma 2ª busca DE por relevância |
| 6.4 | "Battle of Königgrätz" (inglês, 2,1 mi) contado como oferta alemã | Trema no título classificado como alemão | Alemão = palavras alemãs no título, não trema; comparar sem acentos |
| 6.5 | Três vídeos de canhão seguidos | Escolha pelo que a stack faz bem | **Um vídeo por micronicho; só repete se viralizar.** Kriegsmomente: só guerras prussianas, **65% 1870–71 / 35% 1866** |
| 6.6 | Arquivos com nomes de contas no repo público | O filtro do sanitizador lista os padrões proibidos | O `sincronizar_repo.py` **não** é publicado; `narrar.py` (perfil do navegador) também não |

---
Medições: V3 (3 h 20, Opus 0,21 M + Sonnet 2,71 M), Gustav (2 h 51, 0,22 + 2,49), Artillerie bei Nacht (~4 h 40, 0,26 + ~3,0; ~1 h perdida nos itens 1.5, 1.7 e 2.5). O alvo é ~2 h 15 e ~1,5–1,8 M quando nenhum item desta lista se repete.
