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
| 1.18 | Render inteiro empacou em 96% ("JOB_ESTAGNADO"), última faixa com erro `frame range ... is not inbetween` | Fim pedido (943,1 s) passava um quadro do fim da composição (28.292 quadros) | `canal.render` limita o último quadro a `int(dauer·fps) − 1`. Se acontecer: renderize **só a faixa** que falta (`npx remotion render bundle Video frames/pNN --frames=a-b`) e rode `reparar.py`; nunca o `render.sh` de novo | `canal.py` (render) |
| 1.19 | `garantir` religou a G4 "fora do ar" e o bundle dos stills quebrou com `Can't resolve '../cenas/_teste_*.json'` ou `EADDRINUSE 8766` | (a) agente em obra deixou import para arquivo ainda não sincronizado; (b) blip do proxy: a VM estava viva com o stills quente rodando | Agentes: import e arquivo de teste entram e saem juntos, `sync` antes de stills. Alinhamento/música não dependem dos stills (`rodada_g4.py` segue sem eles). Em `EADDRINUSE`, confira `/saude` e repita o pedido sem religar | `g4/rodada_g4.py`, briefs |
| 1.20 | Stills do vídeo 9 saíram do vídeo 8, sem erro | O daemon `stills_quente` é de **um** projeto; o batedor de áudio preparou o v8 e o `garantir` só olha `saude().stills` | Desde 30/10 `canal.stills` confere o projeto do daemon (`ps aux`) e repreparar se for outro. Duas sessões na mesma G4: avisar antes de `preparar` outro projeto | `canal.py` (stills) |
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

- **2.x (29/10, vídeo 8):** download do AI Studio saindo com 0 byte e o .wav caindo direto em D:\Downloads = outro cliente Playwright/CDP (o `canal.py garantir`/`renovar_cookies`) conectou no mesmo navegador e trocou o destino dos downloads. Mate só o PID do narrar.py e rode de novo; os takes já gerados ficam em D:\Downloads ("Generated Audio …") e podem ser aproveitados conferindo duração e alinhamento.

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
| 3.15 | "Poucos b-rolls" com o mesmo número de cortes da referência (vídeo 6) | 59% mapa, 8% imagem de época e 12 mapas seguidos; inéditas com cara de maquete | Linha MISTURA do `plano.py` (mapa no máximo 35%, 3D pelo menos 25%, época pelo menos 20%, no máximo 3 seguidas) e regras de acabamento | `ferramentas/plano.py`, `REFERENCIA_TRACER_PROJECT.md` |
| 3.16 | Agente de cena inédita travou a G4 ~1 h; `canal.py stills` sem resposta | `delayRender` de `useJsons` **dentro do canvas** com Suspense nunca era liberado (240 s por quadro) | Carregue JSON **fora** do `<Canvas>` (wrapper com `useDados`). Para depurar sem o proxy: `exec_vm` com `curl` direto no daemon | `beats/feuer.tsx` (vídeo 7) |
| 3.17 | 13 de 15 cenas `INEDITO_feuer` reprovadas: terreno escuro, canhões invisíveis no anel, lama como laje cinza, bandeira sem pano, poeira em blocos | Escopo grande demais para um agente (artilharia + cavalaria + aldeia + cidadela + chuva) e terreno do pacote escuro | Troca imediata por `Gemaelde` (pintura 2.5D) ou cena do kit, sem novo agente. Próximo vídeo: inédito 3D só onde o kit e a pintura não servem, no máximo ~6 batidas por agente, e `terreno.mat.hell` ≥ 1,5 nos pacotes | vídeo 7, `roteiro/troca_feuer.py` |
| 3.18 | `Flug` do kit escuro e sem atmosfera | Pacote `sedan_maas` com `hell` 0,9 (pensado para a luz antiga) | `hell` 1,8 no pacote; `Flug` tem `acab` (`leve` por padrão) | `cenas/pacotes.json`, `kit/welt/flug.tsx` |
| 3.12 | Cenas inéditas fracas (céu vazio, tela cinza, manequins) | Acabamento sob pressão | Revise a folha de contato do vídeo inteiro. Batida fraca pode ser trocada por cena do kit **sem novo agente**: escreva `cena` na batida, porque o kit tem prioridade sobre `BEATS` | `Video.tsx` (ordem kit > beats) |

| 3.19 | Pista "flickando" (canal ES, Tenerife) | **z-fighting**: pista, pistas de rolagem e pátio a 4–10 cm do chão, com a câmera indo de 0,3 m a 6 km, mais o jitter da acumulação | Camadas separadas (pátio 0,06 m, pista de rolagem 0,22 m, pista 0,40 m), `polygonOffset` nos materiais e **near proporcional à distância do alvo** (`dist × 0,004`, entre 0,3 e 30 m) | `kit/maquete/modelos.ts`, `motor.ts` |
| 3.20 | Ilhas viraram triângulo e círculo no mapa | Relevo "estilizado" inventado pelo planejador; o `KarteWeiss` estica o PNG ao bbox | Só relevo real (Copernicus GLO-90, `geo/relevo_real.py`) e bbox do mapa = bbox do relevo | `01_tenerife/geo/relevo_real.py` |

- **3.x (29/10, vídeo 8):** `ln -s` no Git Bash NÃO cria link: copia a pasta (node_modules de GBs, travou a cópia). No Windows use `New-Item -ItemType Junction`. E a folha de contato: a G4 arredonda o tempo do still para o quadro (1/30 s) — procure o still mais próximo, não pelo nome exato.
- **3.y (29/10, vídeo 8):** cenas 3D de figuras em plano aberto (Garde subindo o glacis) leem vazias mesmo com milhares de instâncias; terreno de pacote visto do alto mostra a borda flutuando. No plano, prefira Gemaelde para combate humano e câmera baixa para o relevo.

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
| 5.8 | Música com voz/coro apesar de "[Instrumental]" | ACE-Step às vezes canta | Prompt com "no choir, no humming, no singing" e **Demucs na G4** (`g4/limpar_vocal.py`) antes do mix | `g4/limpar_vocal.py`, memória `feedback-musica-instrumental` |
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

- **1.21 (31/10, vídeo 10):** o agente batedor viu a G4 ligada e rodou `canal.py desligar` (apagou `t2_canal.json` no meio do `preparar` do maestro). Regra: todo brief de agente diz **nunca `ligar/garantir/desligar/preparar`**, inclusive o do batedor.
- **1.22 (31/10, vídeo 10):** `saude` respondeu `G4_FORA` (proxy sem JSON) com a VM viva há 78 min. Antes de concluir que caiu, `ligar` só reconecta o proxy (o `saude` seguinte mostra `uptime` alto) — não refazer `preparar` inteiro se `stills: true` e o daemon for do projeto.
- **5.9 (31/10, vídeo 10):** bombardeio e balões sem som: `efeitos_eventos.py` só reconhecia `const Bxx: React.FC` e pegava ids iguais da biblioteca (v6/v7). Agora lê entradas inline `'01_01': (b) =>` e só os arquivos que o `index.ts` importa.
- **3.21 (31/10, vídeo 10):** cartão `Zahl`/`Balken` ancorado numa palavra do fim da fala ficou 4–5 s vazio. Antes do render, stills de todo `ui` > 4 s em s+3 s; vazio = `em` cedo (0,3–0,6).
- **3.22 (03/11, vídeo 14, reprovado pelo Eduardo):** "repertório barato". Três cenas novas usavam a **mesma base** (mapa em relevo inclinado: `Aufmarsch1870`, `DreiArmeen1870`, `Schwenk1870`) em 69 batidas. O `plano.py` as contava como 3D, deu MISTURA ok (3D 45%), mas na tela eram **55% de mapa e 6% de 3D**. A biblioteca de objetos (Dreyse, Krupp, Mitrailleuse, Batterie, Sedan) quase não entrou, e as setas sobrepunham as pontas.
  - **Correção:** o `plano.py` classifica pela **base visual**. Componente com cara de mapa, ou declarado em `roteiro/bases_visuais.json`, conta como **mapa**.
  - **Nova linha REPERTORIO:** nenhum componente 3D acima de 15% do tempo nem em mais de 2 batidas seguidas, mais a porcentagem de objeto/mecanismo (`{"Comp": "objeto"}` no mesmo json).
  - **Meta:** 3 a 5 sequências de objeto em corte por vídeo (Blender na G4) e reaproveitamento da biblioteca.
  - **Setas e mapas:** perfect-arrows + `@remotion/paths` e a skill `remotion-maps` (levantamento de 03/11 em `docs/pacotes-por-canal.md`). Nada de seta feita à mão.

- **1.23 (31/10, vídeo 11):** o proxy caiu no meio do `canal.baixar` do render (79%): um `/arq` voltou curto e o mp4 saiu sem `moov` (`BAIXAR_INCOMPLETO`). A VM estava viva (1.22): `ligar` reconectou e o download refeito **conferindo `len(content) == n` em cada pedaço, com repetição**, deu certo. O `baixar` do canal deve fazer essa conferência sempre.
- **1.24 (31/10, teste da migração):** `canal.py desligar` declarou "G4 desligada (verificado)" porque a aba do Colab já mostrava desconectado, mas a VM ainda respondeu `/saude` por ~40 s. Agora só vale "verificado" quando o próprio `/saude` deixa de responder (até 2 min; senão `DESLIGAR_NAO_CONFIRMADO`). Desligar exige `T2_PAPEL=maestro` e nenhuma reserva viva de outro dono no `porteiro.py` (fecha a 1.21). A 1.22 (proxy caído com VM viva) é tratada pelo `garantir`, que reconecta antes de religar; a 1.23 pelo `baixar`, que confere cada pedaço.
- **1.25 (31/10, Adamuz, canal ES):** o `desligar` do maestro (`T2_DONO=segundo_v03`) foi negado por `{'stills': '03_adamuz_v1'}` com nada rodando: a reserva de stills tem dono = projeto (1.20) e é grudenta (pid 0). Agora toda reserva guarda `por` = o `T2_DONO` de quem a pediu; o `desligar` trata como própria a reserva cujo dono **ou** `por` é o seu, e depois de desligar solta as grudentas dele (`porteiro.liberar_por`). A reserva de stills de **outra** sessão continua bloqueando o desligar.
- **1.26 (31/10, Angrois, canal ES):** `ligar` estourou o tempo no clique do `colab-connect-button` porque um `mwc-dialog.signed-out` ("Sua Conta do Google foi desconectada em outra guia") cobria a página. Isso acontece depois de trocar de conta noutra aba do mesmo Chrome, por exemplo no YouTube Studio. A sessão continuava válida: **recarregar a aba do Colab** fez o aviso sumir, e o `ligar` seguinte conectou. Correção sugerida: o `conectar_runtime` detecta esse diálogo e recarrega a aba antes de clicar. Se o aviso voltar, é login de verdade, e quem resolve é o Eduardo (nunca digitar senha).
- **1.27 (31/10, Angrois):** o `reparar.py` marcou **2.058 suspeitos** (nota > 150) num vídeo de trem em alta velocidade com chase e câmera colada, e **trocou 0**. Foram ~10 min de re-render à toa. Os suspeitos eram movimento rápido real, não glitch. Correção sugerida: se a primeira amostra de 50 suspeitos re-renderizados não trocar nenhum, parar o reparo.
- **5.10 (31/10, vídeo 11):** o parser inline do `efeitos_eventos.py` só aceitava arquivos `k10_` (cenas novas do vídeo 11 sem som). Agora aceita qualquer `k<N>_` importado pelo `index.ts`; cada componente novo precisa de um ramo próprio (tiros do `Ladezyklus`, choque do `Rammstoss`).
- **5.11 (31/10, vídeos 9–11):** a descrição passava de 12 mil caracteres (o YouTube aceita 5 mil) com lista de fontes e de links das imagens, e dois títulos passavam de 100 caracteres. Regra do sócio: 4 linhas + capítulos + 1 linha de licenças obrigatórias + 3–5 hashtags, gerada por `ferramentas/descricao_curta.py`, que confere os limites.

## 7. K21 (inverno 1870/71, 09–10/11/2026)

| # | Sintoma | Causa | Regra / correção | Onde |
|---|---|---|---|---|
| 7.1 | 36 de 162 frases "reprovadas" pela voz com o áudio certo | O `norm()` do QA não casa "100.000" (vira 100 000), ordinais ("28." contra "achtundzwanzigsten") nem nome francês dito à francesa (Toul/"Tul", Nogent) | Antes de refazer, retranscrever só as reprovadas (`voz/vm/asr_check.py`) e ler o texto; corrigir o `norm()` (tirar ponto de milhar, ordinal) no próximo vídeo | `k21_inverno/voz/vm/asr_check.py` |
| 7.2 | Render "travado": `JOB_ESTAGNADO há 900 s` e o resiliente desistiu | O `render.sh` não imprime nada até o fim, e as faixas 3D com espera de quadro (~6 s/quadro) passam de 15 min | O render segue vivo na VM: não relançar. Esperar `out/video_crf.mp4` com `pgrep` e baixar (`k21_inverno/esperar_render.sh`). Ao contar processos com `pgrep -fc` dentro do `bash -c`, ele conta a si mesmo (1 = nenhum) | `k21_inverno/esperar_render.sh` |
| 7.3 | Quadro só com papel, sem o 3D/textura, em render paralelo | O `ThreeCanvas` libera a captura antes de a árvore 3D/textura estabilizar | Componente que espera a cena estável (`eureka/refaz.tsx`, `epoca` `Redesenha`). Custa ~6 s por quadro 3D: medir antes do próximo vídeo e encurtar a espera | `k21_inverno/v1/src/cenas/eureka/refaz.tsx` |
| 7.4 | `canal.py desligar` caiu com `ReadTimeout` no `POST /desligar` | O `req` só trata `SystemExit`; a exceção do `requests` escapa antes de desconectar a aba | Rodar `desligar` de novo (confirma pela aba e pelo `/saude`); corrigir o `except` para pegar `requests.exceptions.RequestException` | `canal.py` `_desligar` |
| 7.5 | Mix a −16 LUFS com ganho maior; `alimiter` derrubava o integrado | Mono copiado para 2 canais soma +3 LU no medidor estéreo, e o `alimiter` com release longo baixa o nível inteiro | Alvo −17 no mono (= −14 no estéreo) e limitador de pico por envelope em numpy (`ton/mix_k21.py`), conferido com `ebur128=peak=true` no mp4 | `k21_inverno/ton/mix_k21.py` |
| 7.6 | Lote cine sem fiscal | O `cine/rodar_g4.sh` herdado não roda a etapa `olho` | Rodar `ETAPA=olho` e depois `rodar_refazer.sh`; 2ª refação dirigida só para defeito real (`rodar_refazer2.sh`). Nota zero em tudo com `defeitos: []` = o fiscal não leu a resposta, não é defeito | `k21_inverno/cine/` |
| 7.7 | Stills da família cine com "Could not load /public/cine/…" | `canal.py stills` sincroniza só `src` | Depois de importar imagens: `canal.py sync <v1> public` antes dos stills | procedimento |

---
Medições: Deutscher Krieg 1866 (vídeo 11, 2 h 12; itens 1.23, 5.10), Sedan (vídeo 7, 3 h 18, Sonnet ≈ 2,25 M; itens 1.18, 1.19, 3.16, 3.17), V3 (3 h 20, Opus 0,21 M + Sonnet 2,71 M), Gustav (2 h 51, 0,22 + 2,49), Artillerie bei Nacht (~4 h 40, 0,26 + ~3,0; ~1 h perdida nos itens 1.5, 1.7 e 2.5). O alvo é ~2 h 15 e ~1,5–1,8 M quando nenhum item desta lista se repete.
