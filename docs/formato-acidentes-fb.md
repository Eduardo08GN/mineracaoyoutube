# Formato "acidente com pessoa": reels do FB + coletânea longa no YouTube (Segundo a Segundo)

Criado em 07/11/2026. Frente nova: reels de ~1:40 (1:30–1:50) de reconstrução 3D animada de acidente ou sobrevivência com pessoa (preso numa caverna, no mar, num poço), no molde da página que apareceu ao Eduardo como "crescendo rápido". Nossa dimensão a mais: **o tema vem do radar de notícia quente**, que é o que funcionou na página (Learjet 625 mil + 398 mil + 246 mil; evergreen 2–3 mil).

**Status (08/11):** molde de roteiro, ritmo e pauta oficiais; a produção passou a ser 100% código (seção 5).

**Fluxo:** cada reel vai para a página do FB do Segundo a Segundo ("¿Qué Pasaría Si? 3D"); a cada **12 reels prontos**, uma coletânea longa com vinhetas documentais vai para o canal do YouTube Segundo a Segundo, que só publica vídeo longo.

Material bruto, fora do repositório: `D:/pesquisa_nichos/acidentes_fb/` (`yt/`, `fb/`, `ref_noair/`, `lote1/`). A leitura anterior do mesmo nicho (06/11) está em `D:/pesquisa_nichos/toonverso_0611/leitura/ANALISE.md`.

## 1. Nicho (YouTube @Toonverso33, últimos 7 vídeos, lidos em 07/11)

**Proposta:** "histórias reais contadas com animação". Casos reais de sobrevivência e acidente com **uma pessoa ou um grupo pequeno no centro**, em 3D low-poly por código (three.js, bonecos simples, cenas em corte) e narração por IA em PT-BR. A página do FB com o mesmo nome é a "crescendo rápido" que apareceu ao Eduardo: 27 mil seguidores contra ~2 mil no YouTube. **O FB é o motor deles, o YouTube é o acervo.**

| Publicado | Título | Duração | Views (07/11) |
|---|---|---|---|
| 02/11 | O Cachalote Que Afundou um Navio de Propósito | 15:37 | 76.625 |
| 01/11 | A Única Sobrevivente: Caiu do Avião e Andou 11 Dias Pela Selva | 10:18 | 31.298 |
| 02/11 | O Último Minuto do Jato Que Caiu Perto da Casa do Trump | 16:03 | 9.325 |
| 29/10 | Presos a 700m no Chile: Como os 33 Mineiros Sobreviveram | 7:42 | 4.796 |
| 02/11 | Eles Tinham Só 12 Minutos de Ar a 480 Metros no Fundo do Mar | 11:16 | 2.888 |
| 05/11 | Orcas Afundaram o Barco Deles em Minutos. Era Só o Começo | 16:50 | 1.760 |
| 04/11 | Um Navio Passou do Lado Dele e Foi Embora | 24:54 | 1.627 |

Nenhum vídeo novo desde 05/11; os 7 são os mesmos da leitura de 06/11 (gabarito completo em `toonverso_0611/leitura/ANALISE.md`, seção 2).

**Temas:** preso num lugar fechado (mina, submarino, caverna), náufrago no mar, queda de avião com sobrevivente, ataque de animal. Quase todos **antigos** (1820, 1971, 1973, 2010); a exceção é o jato da Flórida, o único quente.

**Títulos:** número extremo + situação-limite ("Só 12 Minutos de Ar a 480 Metros", "Andou 11 Dias Pela Selva") ou ação inesperada ("Afundou um Navio de Propósito", "Passou do Lado Dele e Foi Embora"); "(Caso Real)" no fim.

**Estrutura da narração** (~140 palavras/min, frases de ~12 palavras, data/lugar/número em toda virada):
1. **Gancho (0–25 s):** abertura fria no pior momento, com data, lugar e número extremo na 1ª frase; o desfecho numérico é revelado já ("sobravam 12 minutos de oxigênio"), então a pergunta vira **como**, não **se**.
2. **Tensão:** volta no tempo com elenco (nome + idade + um traço); "guarde essa informação" plantada cedo e paga no fim; primeiro aviso ignorado; parêntese de ciência para leigo a cada 2–3 min; batidas de luta com contador (horas, metros, recurso que acaba); tentativas que falham.
3. **Virada:** a falsa explicação negada ("todo mundo pensou: foi acidente. Não foi."), ou o resgate que chega com o número pago.
4. **Final:** epílogo humano (o que veio depois) + desmonte de mito + lição em lista ("não foi sorte, foram decisões"), CTA de comentário e gancho para o próximo.

**Duração:** longos de 8 a 25 min no YouTube (crescendo); reels de 1:30–2:45 no FB/IG, em série PARTE 1 / PARTE 2.

**O que muda para nós:** eles contam caso **antigo**; nós contamos o caso **quente da semana** (radar). Eles têm o desenho da história; o nosso acabamento e o HUD vivo são superiores (memória `nicho-caso-real-noticia`). Tirar a espinha, não copiar.

## 2. Leitura óptica de 7 reels da página de referência (24 fps, 07/11)

Baixados sem login com yt-dlp (a listagem da página pede login; o link de cada reel não). Medidos com `regua24.py` + OCR (`ocr_texto.py`, rapidocr) + faster-whisper. Bruto em `D:/pesquisa_nichos/acidentes_fb/fb/`.

| Reel | Data | Duração | Views (título do FB) | Cortes/min | Plano mediano | Câmera parada | Takes/min | Texto na tela |
|---|---|---|---|---|---|---|---|---|
| Jato que caiu perto da casa do Trump, P1 (**quente**) | 02/11 | 1:44 | **477 mil** | 12,7 | 4,6 s | **21%** | 19,6 | 100% |
| A garota que caiu do céu, P1 | 30/10 | 2:00 | **1,1 mi** | 13,0 | 4,0 s | **19%** | 17,6 | 100% |
| Presos a 480 metros, P1 | 01/11 | 1:51 | 127 mil | 8,7 | 5,8 s | 32% | 20,1 | 100% |
| "Vamos bater no chão", P2 | 02/11 | 1:51 | 122 mil | 12,5 | 4,6 s | 36% | 18,5 | 100% |
| Preso numa bolha de ar, P1 | 04/11 | 1:33 | 36 mil | 9,7 | 4,9 s | 36% | 31,7 | 100% |
| Parados a 100 metros, P2 | 03/11 | 1:47 | 17 mil | 4,5 | 10,0 s | 48% | 18,0 | 100% |
| Sozinha no oceano, P1 | 05/11 | 1:31 | 12 mil | 7,3 | 6,7 s | 32% | 21,1 | 100% |

**O que os números dizem:**
- **Os dois virais são os mais rápidos e os que menos param:** ~13 cortes/min, plano de ~4 s e só ~20% de câmera parada. O mais lento (4,5 cortes/min, 48% parado) é o pior. A régua de dinamismo do nosso reel vem daqui: **≥ 12 cortes/min, plano mediano ≤ 5 s, câmera parada ≤ 20%, repetição ≤ 5%**.
- **Narração (Whisper): 221–304 palavras por reel**, ~150–170 palavras/min, coerente com o molde de ~250 palavras.
- **Texto na tela 100% do tempo:** rótulo de lugar e data, nome + idade, HUD e legenda. O reel funciona sem som.
- **Duração real de 1:31 a 2:00; os virais têm 1:44–2:00.** O nosso alvo é **~1:40 (1:30–1:50)**.
- **O caso quente (jato da Flórida, o mesmo nosso Learjet) é o 2º mais visto:** confirma que notícia quente + molde de caso real é o motor, também para eles.
- **Série PARTE 1 / PARTE 2:** cada caso vira 2 reels com corte no pior ponto e "comenta PARTE 2". Funciona hoje, mas o FB rebaixa isca de engajamento (ver a seção 3, final).
- Selo "AI content" do FB nos reels deles, sem efeito visível no alcance.

## 3. Molde por segundo do reel (~100 s, ES, ~150 palavras/min ≈ 250 palavras)

Espinha do Toonverso (pior momento → quem → mecanismo → luta com contador → virada → pergunta), ritmo dos virais medidos e o checklist de fraquezas do Scenario. Uma batida a cada 3–5 s; cada batida traz um número, uma revelação ou uma mudança visível. ~25 planos de ~4 s.

| t (s) | Batida | Fala/legenda (exemplo: espeleólogo preso) | Imagem | HUD e marcadores |
|---|---|---|---|---|
| 0–3 | **Gancho no pior momento** | "Atrapado a 400 metros bajo tierra. El agua sube *20 cm por hora*." | clímax já animado (cena) | contador já correndo |
| 3–8 | **Promessa + reviravolta** | "Y el agua no era lo peor." | close no herói (cena) | — |
| 8–20 | **Quem, onde, quando** | nome, idade, um traço; lugar e data | entrada da caverna (cena) + mapa 2 s (Remotion) | rótulos `NOMBRE · 34 AÑOS`, `LUGAR · FECHA` |
| 20–45 | **Mecanismo** (por que ficou preso) | 2–3 fatos de ciência para leigo, cada número traduzido ("40 cm: menos que una maleta") | **corte em seção da cena** (nível exato vindo do `cena.json`) + 1–2 planos | **marcadores por cima em Remotion:** linha do nível da água subindo, régua, seta, cota |
| 45–72 | **Luta com contador** | recurso que acaba, tentativa que falha, decisão com custo | planos de câmera diferentes, um a cada 3–4 s | contador principal (ar, horas, metros) que **nunca morre** |
| 72–88 | **Virada** | o resgate ou a descoberta; o número do gancho é pago | cena (luzes, mergulhadores) + marcador se houver medida | contador congela ou inverte |
| 88–100 | **Fecho + pergunta** | 1 frase do que veio depois + pergunta que a pessoa responde pela própria vida ("¿Tú habrías esperado o nadado?") + "Síguenos para el próximo caso" | plano final calmo (cena) | cartão final com a pergunta |

**Regras do roteiro:**
- Gatilho (o problema) até 8 s. Número na 1ª frase.
- Frases de 4–12 palavras; data, lugar ou número em toda virada.
- Um herói de **uma cor** (jaqueta, capacete) em todo plano: âncora de identidade para o olho.
- Fato com fonte (notícia do dia + uma fonte primária). Caso quente em andamento: dizer só o confirmado ("según los rescatistas…").
- **Pergunta genuína em vez de "comenta PARTE 2".** Parte 2 só quando a própria notícia avança (o resgate, a causa), igual ao Learjet: **um reel por ângulo**.
- Fora: política, gore, vítima ferida em close, áudio real de rádio ou caixa-preta.
- Inteligente e dinâmico: nada de plano parado > 4 s sem mudança visível.

**Regras de texto (tudo em Remotion; o modelo nunca desenha texto):**
- **HUD monoespaçado** no alto à esquerda: rótulo em caixa alta espaçada + número grande (ex.: `AIRE RESPIRABLE` / `O₂ 15,8 %`), com segundo contador opcional à direita.
- **Legenda serifada** no terço de baixo da zona segura, 4–12 palavras, **uma palavra em destaque** na cor de acento. Troca seca, nunca crossfade.
- Rótulos `LUGAR · FECHA` e `NOMBRE · EDAD` em caixa alta pequena.
- Linha de honestidade quando houver reconstrução: `RECONSTRUCCIÓN · BASADA EN [fonte]`.
- Zona segura de Reels: x 65–1015, y 269–1248; nada em x ≥ 853 abaixo de y 1152.
- O contador nunca contradiz a legenda; número dito = número na tela no mesmo segundo.



## 4. Método: o nosso pipeline, mais os insights do Scenario

**Base (o que já temos e manda):** levantamento de prontos e batedor (`docs/BATEDOR.md`), recurso barato inteligente (camadas 2.5D, linguagem de cinema antes de asset), narração Qwen3-TTS na G4 com voz fixa e QA Whisper+UTMOS, Remotion para HUD, legenda e montagem, régua 24 fps e olho da G4 (Qwen3-VL) na auditoria, entrega só do mp4 com áudio (ffprobe). Modelo por nível: Haiku para tudo o que é mecânico e conferível por script (baixar, extrair quadros, transcrever, medir, folha de contato, ffprobe), Sonnet para execução com contrato (cenas, código do HUD), Opus só para julgamento (pauta, molde, crítica, recomendação de estilo).

**Passos de um reel:**
1. Pauta pelo radar (seção 6), com um fato e uma fonte por batida (dossiê Sonnet, busca dirigida).
2. Roteiro ES no molde da seção 3 (Opus).
3. Narração na G4, um arquivo por batida; a duração da batida sai da fala.
4. Imagens e planos pela rota aprovada na seção 5.
5. HUD, contador e legenda em Remotion, sobre os planos.
6. Auditoria: régua 24 fps + olho da G4 nos quadros a 2 fps + ffprobe; só então o mp4 vai para `entrega/`.

### Insights do Scenario (só o que a skill acrescenta)
A skill do Scenario MCP (pago) é **só referência**; ela não substitui o nosso pipeline. Lida em `D:/pesquisa_nichos/acidentes_fb/skill_scenario_extraida/`, só os `.md`; nenhum script dela foi executado. O que vale trazer:
1. **Log de uma frase por segundo** (`logic.md`), escrito do plano e de novo dos quadros finais. Frase absurda = falha de lógica; frase que não acrescenta = segundo morto.
2. **Regras de lógica:** nada reaparece depois de sair; sem morph (troca de lugar é corte ou movimento visível); causa antes do efeito; palavra e número na tela no mesmo segundo em que são ditos; identidade do herói fixa (uma cor só).
5. **Troca de texto seca,** sem crossfade (o "Signedd" de 1 quadro).
6. **Zona segura de Reels (1080×1920):** texto dentro de x 65–1015, y 269–1248, e nada em x ≥ 853 abaixo de y 1152.
7. **Sincronia voz × legenda:** cortar a voz só em silêncio medido, com corte seco; cada palavra a ≤ 0,04 s da legenda.
8. **Checklist de fraquezas do formato:** gatilho até 8 s; contador que nunca morre (passa a outro quando o primeiro acaba); um herói de uma cor; número traduzido para algo conhecido; final com pergunta que a pessoa responde pela própria vida.

## 5. Produção: 100% código (three.js na G4), zero IA visual (08/11)

Decisão do Eduardo de 08/11: o visual dos reels é feito **só por código**. Cena em three.js low-poly com kits CC0, um `cena.json` único que dirige a cena e o HUD, gramática de câmera, render com acabamento na G4. Nenhuma IA generativa de imagem ou vídeo, nem em fundo, textura ou miniatura. A IA fica só na voz (Qwen3-TTS) e na conferência dos quadros contra o `cena.json`. Arquitetura e números: `docs/pipeline-reels-codigo.md` (em batedor).

## 6. Fontes de tema quente

A dimensão a mais em relação ao Toonverso: **o caso é o da semana, não o de 1971.** Na página, só o quente entregou (Learjet 625 mil, 398 mil e 246 mil em três posts; evergreen 2–3 mil).

1. **Radar de notícias** (`docs/radar-noticias-quentes.md`, `ferramentas/radar_noticias/radar.py`), perfil **`caso_real`** (sobrevivência, pessoa no centro) e, em seguida, `segundo` (mecanismo de acidente):
   ```
   python -I -X utf8 ferramentas/radar_noticias/radar.py --paises ES,MX,AR,CO --sem-oferta
   ```
   Rápido, sem cota. Rodar no início de cada sessão de lote.
2. **Google Trends** (web, porque o FB não tem API de tendências) em ES, MX, AR e CO, sementes: *atrapado, rescate, cueva, mina, pozo, naufragio, desaparecido, sobrevivió, derrumbe, avalancha, accidente*. "Aumento repentino" pesa mais.
3. **Google News RSS por país:** quantas manchetes e qual é o **ângulo novo** do dia (resgate, peça achada, relato do sobrevivente).
4. **Mundo todo vale** (memória `feedback-eventos-mundo-todo`): resgate na Tailândia, mina na China, montanhista nos Andes, desde que a notícia circule em espanhol.

**Critério de pauta para o reel:**
- pessoa no centro e mecanismo explicável (por que ficou preso, por que a água subiu, por que o ar acaba);
- calor: manchete nova nas últimas 72 h no país (no FB, chegar dias depois ainda rende);
- **um reel por ângulo** enquanto a notícia vive (o caso, depois o resgate, depois "cómo sobrevivió");
- filtro: fora política, crime violento e gore; morte só com foco no mecanismo e não no sofrimento; sem áudio real de rádio ou caixa-preta; a vítima não é ridicularizada nem mostrada ferida.
- **Reserva evergreen:** quando o radar não tiver caso, refazer em espanhol um caso antigo forte (Tham Luang 2018, os 33 de Atacama 2010), mas só como complemento: a meta de seguidores vem do quente.

## 7. Produção em lote

Ver `docs/pipeline-reels-codigo.md`. Regras que continuam: preparar no PC antes de ligar a G4; sentinela sempre (emite só na mudança de estado); um aviso no fim; baixar cada bloco ao PC; modelo por nível; conversa nova e curta por lote.

## 8. Coletânea longa para o YouTube (a cada 12 reels)

O canal do YouTube Segundo a Segundo só publica vídeo longo. A cada **12 reels prontos**, uma coletânea de ~23 min:

| Bloco | Duração | O que é |
|---|---|---|
| Abertura | 20–30 s | montagem rápida dos 12 ganchos (1–2 s cada) + título da coletânea |
| Para cada caso: **vinheta documental** | 12–15 s | cartão "Caso 03 · La cueva de [lugar] · [fecha]", mapa com o ponto (código), narração curta ES de contexto ("Tailandia, 23 de junio de 2018. Doce chicos entran en una cueva…") e transição que costura o caso anterior no próximo, **sem corte seco** |
| Corpo do caso | ~95 s | o `reel_<caso>_corpo.mp4` (sem o cartão "Síguenos") |
| Fecho | 15–20 s | pergunta para os comentários + chamada para inscrever |

**Adaptação 9:16 → 16:9, sem refazer a G4:** o reel vertical fica no centro e o HUD **muda de layout** em Remotion (contador e rótulos numa coluna lateral; legenda na outra, com o mapa e a data do caso). Como o texto já é código, isso sai sem gerar imagem nova. Gerar tudo de novo em 16:9 só se a retenção pedir.

**Produção:** composição Remotion `Coletanea` que lê uma lista JSON (12 × `reel_<caso>.json` + corpo), gera as 12 vinhetas (TTS na G4) e renderiza na G4 (~20–30 min de render). Título pelo caso mais forte + número ("12 rescates imposibles…"); capítulos na descrição; créditos e fontes só na descrição. Custo estimado: ~150 mil tokens + ~45 min de G4.

## 9. Infra: armadilhas desta frente (07/11)
- **G4-2 com `CANAL_SEM_URL` e célula vazia rodando em 0 s:** um tooltip do Colab (`colab-callout[opened]`) engolia o clique. **Já corrigido no `D:/prehistoria/colab.py`, dentro do `aba()`** (07/11). Se o sintoma voltar, a outra causa conhecida é o runtime em CPU (`docs/pipeline-kriegsmomente.md` §4).
- **`canal.py subir` falhando calado no Git Bash:** `/content/...` vira caminho do Windows. Usar `MSYS_NO_PATHCONV=1`.
- **`desligar` com ReadTimeout no fim:** é a VM caindo durante a verificação. Confirmar com `canal.py saude` (G4_FORA) + `colab.conectado` = False.
- **Página do FB sem login:** a listagem de reels pede login no yt-dlp, mas o navegador de automação sem login mostra os links dos reels e cada link baixa com yt-dlp sem cookies.

