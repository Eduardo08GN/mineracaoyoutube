# Handoff — canal Kriegsmomente (onboarding do agente do sócio)

> **Para o agente que está lendo:** este documento resume ~1 semana de trabalho entre o Eduardo e o agente dele (Claude, papel de "maestro") no canal alemão **Kriegsmomente** (24–31/10/2026). Ele traz a estratégia, o que funcionou e o que não funcionou, como produzimos os vídeos, as regras de título, miniatura e descrição, e como ler o canal pela API do YouTube.
>
> Use-o como contexto de partida. Os números do canal são de **31/10/2026, 15h**; atualize-os pela API (seção 9) antes de decidir qualquer coisa.
>
> **Nunca** escreva chave de API, senha ou token em arquivo versionado (nem neste repositório).

---

## 1. O canal em uma página

- **Canal:** Kriegsmomente — https://www.youtube.com/@Kriegsmomente (ID `[id de canal removido]`). É o canal do sócio, idioma alemão, público alemão, criado em 06/10/2025.
- **Formato:** documentário narrado em alemão (~15–18 min) com:
  - simulação 3D, mapas 3D sobre relevo real e pinturas de época em 2.5D (profundidade);
  - rodapé com contador de exércitos (dia a dia, hora a hora ou semana a semana);
  - narração por IA (Gemini TTS) e trilha instrumental por IA;
  - marca d'água só `@Kriegsmomente`, no canto inferior direito.
- **Escopo (decidido em 24/10):** 100% guerras prussianas.
  - **~65% Guerra Franco-Prussiana (1870–71)**, que é o que mais funciona.
  - **~35% Guerra Austro-Prussiana (1866).**
  - Os temas validados: canhões Krupp e armas da época, generais e comandantes, táticas, curiosidades, **tamanho dos exércitos**.
- **Regra fixa:** **1 vídeo por micronicho**. Nunca repetir um tema, a não ser que ele viralize.
  - Encerrados: superarmas e artilharia (Paris-Geschütz, Dicke Bertha, V3, Schwerer Gustav, artilharia à noite).
  - 1870/71: a guerra inteira dia a dia, Sedan, Chassepot × Dreyse, cerco de Paris.
  - 1866: Königgrätz e a guerra inteira dia a dia.
- **Divisão do trabalho até hoje:**
  - o Eduardo e o agente dele produzem os vídeos no PC do Eduardo;
  - **a publicação é manual** (Eduardo ou sócio), com o Teste A/B de título e miniatura do YouTube Studio;
  - o agente nunca publica sozinho.

---

## 2. Números do canal (31/10/2026, 15h, API)

3.980 inscritos · 50,7 mil views · 7 vídeos públicos.

| Publicado | Título (versão no ar) | Views | Likes | Coment. |
|---|---|---|---|---|
| 27/10 | **Warum verlor Frankreich 1870 – obwohl es das bessere Gewehr hatte?** | **41.727** | 264 | 18 |
| 24/10 | Warum die Dicke Bertha Festungen knackte, die als unbezwingbar galten | 6.045 | 47 | 2 |
| 30/10 | Deutsch-Französischer Krieg 1870: Die Schlacht bei Sedan – Stunde für Stunde, mit Armeegrößen | 2.783 | 28 | 3 |
| 25/10 | Warum Artilleriegranaten nachts zu kurz fallen – nachgerechnet | 1.443 | 13 | 0 |
| 26/10 | Im Inneren des Schweren Gustav: Das größte Geschütz der Welt – nachgerechnet | 993 | 6 | 0 |
| 29/10 | Im Inneren der Krupp-Kanone: Die Kanone, die 42 km hoch in die Stratosphäre schoss | 543 | 5 | 0 |
| 31/10 | Warum gewann Preußen 1870 gegen Frankreich – mit dem schlechteren Gewehr? | 24 (recém-publicado) | 4 | 0 |

**Leitura:**
- **O viral** (a guerra 1870/71 inteira "dia a dia, com tamanhos de exército", com título paradoxo) fez 33 mil em 3 dias e ~9 mil por dia em 31/10. Sozinho, é 82% do canal.
- **O viral puxa o resto:** a Bertha subiu de ~4 mil para 6 mil, e o Sedan, com "Deutsch-Französischer Krieg 1870:" no começo do título, fez 2,8 mil no 1º dia.
- **"Im Inneren der [arma]" não funciona:** 0,5–1 mil.

**Prontos e ainda NÃO publicados** (arquivos com o Eduardo; cada pasta `entrega/` tem o mp4, as 3 miniaturas, um `.txt` com os 3 títulos, a descrição curta e as tags, e um `.srt` em alemão):
- **Vídeo 9 (1866):** Königgrätz, hora a hora.
- **Vídeo 10 (1870/71):** o cerco de Paris, semana a semana.
- **Vídeo 11 (1866):** a guerra de 1866 inteira, dia a dia. Foi o primeiro com as cenas 3D explicativas (seção 6).

---

## 3. O que funcionou e o que não funcionou

### Funcionou
1. **O molde de título paradoxo:**
   > **Warum [verlor/fiel/scheiterte] [lado favorito] [ano] – obwohl es [a vantagem óbvia] hatte?**
   - Ex.: "Warum verlor Frankreich 1870 – obwohl es das bessere Gewehr hatte?" fez 41,7 mil, contra ≤ 6 mil dos demais.
   - A tensão vem da pergunta contraintuitiva: o lado mais forte perdeu. A guerra e o ano vão na frente, para a busca, e o título termina na vantagem concreta.
   - **O que carrega o viral é a estrutura sintática do título, não só o tema.** Ao copiar um viral (nosso ou de outro canal), copie a sintaxe.
2. **Nos 2 Testes A/B concluídos, venceu o "Warum + paradoxo" pareado com rosto:** vídeo 6, 37,6%; Bertha, 44,6%. Perderam o título descritivo/de formato e o "Wie … besiegte". A miniatura de simulação ficou em último nas duas vezes.
3. **O formato "a guerra inteira dia a dia, com tamanhos de exército":** é o formato EN validado ("Every Day with Army Sizes"), que não tinha oferta em alemão. O contador de exércitos no rodapé prende a retenção.
4. **O vetor do nicho, medido pela API** (257 vídeos DE sobre 1864/66/70–71 desde 2021, 142 canais; o "lift" é views/inscrito com o termo no título ÷ sem o termo):
   - **puxam:** número grande no título (2,5×), Moltke (1,9×), "Schlacht" (1,9×), palavra em CAIXA-ALTA de impacto (1,6×), Preußen (1,2×), Warum/Wie (1,2×), "Deutsch-Französisch" (1,16×);
   - **rendem menos:** "1866" sozinho (0,56×), Bismarck (0,6×), Kaiser/Reich/Reichsgründung (0,37×);
   - **fórmula dos outliers:** [Preußen] + [número] + [verbo de vitória] + [Franzosen/Österreich].
5. **Roteiro com estratégia e engenharia** (Moltke, ferrovia, telégrafo, armas) e números só como prova curta, com perspectiva alemã plausível e sem distorcer fatos.
6. **Pinturas de época em 2.5D** (domínio público, Wikimedia Commons) misturadas com 3D e mapas.

### Não funcionou
- Títulos de arma ("Im Inneren der …", "nachgerechnet") e temas fora do recorte prussiano (V3, Gustav, Verdun) ficaram em 0,5–6 mil.
- Título descritivo como título principal (ex.: "Stunde für Stunde"): só funciona como 3ª opção do A/B, ou com "Deutsch-Französischer Krieg 1870:" na frente.
- **Excesso de cartões 2D:** um vídeo com 58% de cartões ficou "slideshow". Regra: ≤ 40% de cartões e nunca mais de 2 seguidos.
- **Excesso de mapas** e animação 3D com acabamento baixo (low-poly em close). Regra de mistura na seção 6.
- **Descrição longa:** as primeiras tinham 6–13 mil caracteres, com lista de fontes e links (o YouTube aceita 5 mil). Agora é curta (seção 5).
- **Sobrevoo 3D genérico:** ilustra, mas não explica. O sócio e o Eduardo pediram **cenas 3D explicativas**: mostrar como a coisa funciona (seção 6).

---

## 4. Títulos e miniaturas (regras atuais)

- **3 pares fixos para o Teste A/B:** título 1 só com a miniatura 1, título 2 com a 2, título 3 com a 3.
  - **Título 1 é SEMPRE o paradoxo "Warum … – obwohl …?"**, com miniatura de **rosto** (soldado ou general em choque, com gancho curto em texto).
  - **Título 2:** número grande e/ou "Preußen gegen Frankreich/Österreich" + verbo de vitória, com miniatura de rosto + número.
  - **Título 3:** descritivo/de formato ("Deutsch-Französischer Krieg 1870/71: … – Tag für Tag, mit Armeegrößen"), com miniatura de simulação ou mapa.
- **O duelo explícito:** "Deutsch-Französischer Krieg 1870/71" em pelo menos 1 título, "Preußen" + "Frankreich/Franzosen" nos outros. Em 1866, sempre "Preußen gegen Österreich" + número, nunca "Deutscher Krieg"/"Bruderkrieg" sozinho.
- **Nunca** o enquadramento "Kaiserreich/Reichsgründung" no título.
- **Título com no máximo 100 caracteres** (limite do YouTube).
- **O paradoxo precisa ser verdadeiro e verificável.** O roteiro é escrito em cima dele; se o tema não tem paradoxo real, procure outro ângulo antes de escrever.
- **Miniaturas:** 1280×720; fonte Anton; texto grande à esquerda (branco, amarelo e vermelho) sobre gradiente escuro, imagem à direita. Os rostos são gerados por IA (pessoas fictícias), e a descrição avisa isso.

---

## 5. Descrição (regra do sócio, 31/10)

Curta, ~1.200 caracteres:
1. **4 linhas** com as palavras-chave do vídeo (guerra, ano, lugares, nomes);
2. **KAPITEL** (capítulos com tempos reais);
3. **1 linha de licenças**, só o que a licença EXIGE: modelos 3D CC BY, satélite Sentinel-2 da EOX (CC BY), relevo Copernicus, OpenStreetMap (ODbL) quando usado; mais "Stimme und Musik KI-generiert";
4. **3–5 hashtags.**

Sem lista de fontes, sem links por imagem (domínio público não exige crédito) e sem parágrafos longos. As tags do Studio vão à parte, com ≤ 500 caracteres. Créditos **nunca na imagem**, só na descrição, e nada de marca "SIMULATION" no vídeo.

---

## 6. Como produzimos um vídeo (pipeline "Tracer3D 2.0")

Roda no PC do Eduardo. O pesado (render, música, alinhamento) vai para uma GPU L4 no Google Colab, a "G4"; o PC só orquestra. Tempo atual: **~2 h 10 a 3 h por vídeo**. Depois da otimização de 31/10, a meta é ~1 h 45, ou ~1 h 15 com o dossiê do vídeo seguinte pronto de véspera.

| # | Etapa | Quem/como | Tempo |
|---|---|---|---|
| 1 | **Tema** | Radar da API (seção 9): buraco EN × DE, recorte 65/35, micronicho não repetido, paradoxo verificável | — |
| 2 | **Dossiê de fatos** (`fakten.md`) | Agente pesquisador: fontes primárias (Generalstabswerk prussiano 1867/1872–81 e o austríaco *Österreichs Kämpfe*, Moltke, Wagner), marcas [confirmado]/[1 fonte]/[div]/[NÃO CONFIRMADO]; série diária/semanal para o contador; "take inédito" (~1 min com um fato contraintuitivo pouco contado) | ~45 min, em paralelo com o 3 |
| 3 | **Batedor** | Agente que prova só os elementos visuais novos (componentes 3D, terreno, imagens de época), com stills e folha de contato | ~30 min |
| 4 | **Roteiro** | Maestro: 14 capítulos, ~2.200–2.300 palavras (~17–18 min). Estrutura: cold open em cena → paradoxo → promessa + "abonnieren Sie Kriegsmomente" → contexto → mecanismos (estratégia/engenharia) → batalhas → take inédito → balanço → resposta em 3–4 camadas → CTA para o vídeo viral. Números por extenso (TTS), sem dois-pontos | ~10 min |
| 5 | **Narração** | Gemini TTS no Google AI Studio (voz grave e calma de documentário em alemão), capítulo a capítulo | ~30 min |
| 6 | **Música** (em paralelo com a 5) | ACE-Step na G4, 2 variantes por capítulo; o Demucs escolhe a mais limpa e usa só a faixa sem voz. Prompt só positivo, só instrumental | ~10 min |
| 7 | **Alinhamento** | stable-ts large-v3 na G4: tempo de cada palavra; WER ≤ 0,15 | ~5 min |
| 8 | **Plano de cenas** | 2 agentes planejadores (caps. 1–7 e 8–14) em paralelo: ~170 "batidas" de 3–8 s ancoradas na palavra da fala | ~35 min |
| 9 | **Folha de contato e revisão** | 1 still por batida na G4; o maestro revisa tudo (vazio, cortado, número errado, cartão vazio > 4 s) | ~10 min |
| 10 | **Render** | Remotion + three.js na G4, 1080p30 | ~9 min |
| 11 | **Mixagem** | Voz + música + efeitos pelo evento da cena (tiros, canhões, mar, trens), −14 LUFS, pico −1 dBTP; legendas `.srt` em alemão | ~5 min |
| 12 | **Entrega** | ffprobe (tem áudio?), frames a cada 30 s, miniaturas, `.txt` | ~5 min |

**Regras visuais do plano:**
- **Mistura (% do tempo):** mapa ≤ 35%, 3D ≥ 25%, época ≥ 20%; no máximo 3 cenas seguidas da mesma família.
- **Dinamismo:** cartões ≤ 40%, nunca mais de 2 seguidos; 3D ou mapa a cada ~15 s; números como HUD por cima do 3D.
- **Cenas 3D explicativas (pedido de 31/10):** 3–5 por vídeo, mostrando como algo funciona, em movimento e com HUD. No vídeo 11:
  - os 5 trens prussianos contra 1 austríaco no Aufmarsch, com contador;
  - "getrennt marschieren, vereint schlagen" × as linhas interiores de Benedek;
  - Dreyse × Lorenz carregando lado a lado, com placar de tiros 3 : 1;
  - o abalroamento de Lissa.
- **Combate humano:** pintura de época 2.5D + mapa com setas, não 3D de figuras.
- **Música:** só instrumental.
- **Contador no rodapé:** valores entre datas documentadas são interpolados e marcados "ca.".

**Lições de produção (evitar):**
- Nenhum agente pode ligar ou desligar a GPU, só o maestro. Um agente desligou a G4 no meio de um vídeo.
- "G4 fora" muitas vezes era só o proxy: reconectar antes de religar.
- Downloads grandes precisam de conferência por pedaço.
- Cartão ancorado no fim da fala fica vazio.
- Teto de ~6 cenas 3D novas por agente: com 15, ele falhou em 13.
- Nunca afirmar velocidade, anedota ou citação sem fonte (ex.: "Wer ist dieser General von Moltke?" e "11,5 nós em Lissa" foram cortados).

---

## 7. Roteiro e fatos: as regras que pesam

- Todo número vem do dossiê. Aproximado leva "ca.", e quando as fontes divergem, diga.
- Perspectiva alemã **plausível**, sem distorcer. Não enquadrar como "Kaiserreich/Reichsgründung".
- **Estratégia e engenharia > matemática:** o cálculo entra só como prova curta.
- O **take inédito** (~1 min) é obrigatório: um fato contraintuitivo bem sustentado. Exemplos:
  - Paris: o bombardeio matou 97 civis × ~30.000 mortos a mais que no ano anterior;
  - 1866: Hannover venceu em Langensalza e deixou de existir 3 meses depois.
- **CTA final:** apontar para o vídeo viral ("Warum verlor Frankreich 1870 …").

---

## 8. Próximos vídeos (fila)

| # | Tema | Ano | Estado | Títulos propostos |
|---|---|---|---|---|
| 12 | **Gravelotte–St. Privat** (18/8/1870), hora a hora | 1870 | Dossiê pronto (no PC do Eduardo); paradoxo confirmado: perdas alemãs 20.159 × francesas 12.273 | 1) "Warum verlor Frankreich bei Gravelotte – obwohl es seine Stellungen den ganzen Tag hielt?" · 2) "Warum siegte Preußen bei Gravelotte – obwohl es 20.000 Mann verlor und Frankreich nur 12.000?" · 3) "Deutsch-Französischer Krieg 1870: Gravelotte–St. Privat – Stunde für Stunde, mit Armeegrößen" |
| 13 | **Mars-la-Tour** (16/8/1870): ~30.000 prussianos seguraram ~130.000 franceses | 1870 | Candidato forte. Radar: 1 vídeo DE de 182 mil (2023), nada recente | — |
| — | Metz (180.000 franceses rendidos) | 1870 | Sinal fraco no radar (só 1 vídeo DE, 394 views) | — |

Proporção depois do 11: 4 vídeos de 1870 × 2 de 1866 (≈ 65/35). **O próximo de 1866 só depois de mais 2 de 1870.**

Atenção: o "Garde perdeu 8.000 em 20 minutos" (St. Privat) **não tem fonte**. Foram 8.230 no dia inteiro, e o que as fontes dizem é "5 batalhões sem nenhum oficial em meia hora".

---

## 9. API do YouTube: chave, mineração e leitura do canal

### 9.1 A chave (cada um cria a sua; nunca compartilhar nem versionar)
1. Google Cloud Console → crie um projeto → "APIs e serviços" → ative **YouTube Data API v3**.
2. "Credenciais" → **Criar credencial → Chave de API**. Restrinja a chave à YouTube Data API v3.
3. **Cota: 10.000 unidades por dia, por projeto**, zerada à meia-noite do Pacífico (~4–5h em Brasília). Custos:
   - `search.list` = **100**;
   - `videos.list`, `channels.list`, `playlistItems.list` = **1** cada (até 50 IDs por chamada).
   - Para minerar mais, crie mais projetos (uma chave por projeto) e faça rodízio. Aqui usamos várias, em `YOUTUBE_API_KEYS=chave1,chave2,...`.
4. Guarde a chave **só** num `.env` local (fora do git, com `.env` no `.gitignore`).
5. **As 10 chaves do Eduardo** chegam por canal privado, nunca por este repositório, numa linha pronta `YOUTUBE_API_KEYS=…`: cole-a no seu `.env`. A cota é **compartilhada** com a mineração do Eduardo (as mesmas 10 chaves, ~100 mil unidades por dia no total). Prefira `videos`/`channels`/`playlistItems` (1 unidade) a `search` (100), use cache e combine com o Eduardo antes de rodadas grandes de radar. Se precisar de cota própria, crie chaves novas no seu Google Cloud (passos 1–3).

### 9.2 Ler o canal (barato: ~3 unidades)
```python
# pip install requests ; .env com YOUTUBE_API_KEY=...
import os, requests
K = os.environ["YOUTUBE_API_KEY"]; API = "https://www.googleapis.com/youtube/v3"
CID = "[id de canal removido]"   # Kriegsmomente
c = requests.get(f"{API}/channels", params={"part": "statistics,contentDetails", "id": CID, "key": K}).json()["items"][0]
print("inscritos", c["statistics"]["subscriberCount"], "views", c["statistics"]["viewCount"])
up = c["contentDetails"]["relatedPlaylists"]["uploads"]
ids = [i["contentDetails"]["videoId"] for i in requests.get(f"{API}/playlistItems",
       params={"part": "contentDetails", "playlistId": up, "maxResults": 50, "key": K}).json()["items"]]
for v in requests.get(f"{API}/videos", params={"part": "snippet,statistics", "id": ",".join(ids), "key": K}).json()["items"]:
    s = v["statistics"]; print(v["snippet"]["publishedAt"][:10], s.get("viewCount"), s.get("likeCount"), v["snippet"]["title"])
```
CTR, retenção, origem do tráfego e o resultado do Teste A/B **não** saem da Data API. Use o YouTube Studio ou a **YouTube Analytics API**, que exige OAuth da conta dona do canal (o sócio).

### 9.3 Mineração de temas (como escolhemos os vídeos)
- **Radar EN × DE por tema:** para cada tema candidato (ex.: "Battle of Gravelotte" / "Schlacht bei Gravelotte"), `search.list` com `order=viewCount` e `relevanceLanguage` en/de, numa janela de 3–5 anos.
  - Filtre a relevância no título (o termo precisa estar lá) e tire entretenimento e jogos.
  - Pegue a **mediana das views do top 10** em EN e em DE: **buraco = mediana EN ÷ mediana DE**, mais os outliers (views ÷ inscritos do canal).
  - ~200 unidades por tema.
  - O 1º radar do recorte prussiano (24/10) deu, por exemplo:
    - "Armeegrößen 1870": EN mediana 1,17 mi × DE 0 → buraco enorme, que virou o viral;
    - "Zündnadelgewehr": 31×;
    - Sedan, 5×;
    - cerco de Paris, 3,6×;
    - Königgrätz, 3,5×.
- **Vetor de título:** amostra larga de vídeos DE do nicho (busca por relevância e por views), medindo views/inscrito e views/dia com e sem cada termo no título → "lift" do termo (resultados na seção 3).
- **Antes de escrever o título:** autocompletar do YouTube (`suggestqueries.google.com/complete/search?client=firefox&ds=yt&hl=de&gl=de&q=<semente>`) e n-gramas dos títulos concorrentes ponderados por views.

---

## 10. Combinados com o Eduardo (resumo)

- Nada é publicado pelo agente; a publicação é manual.
- Créditos só na descrição; sem "SIMULATION"; música só instrumental; rostos de IA são pessoas fictícias.
- Não refazer vídeo já entregue sem pedido.
- Narração continua no AI Studio (custo zero na assinatura), sem API paga de TTS.
- Ao recomendar um vídeo, mostrar: o viral ou o buraco que o sustenta, o paradoxo verificável e os 3 títulos + miniaturas pareados.

*Gerado em 31/10/2026 pelo agente do Eduardo. Dúvidas sobre arquivos e pastas da produção: pergunte ao Eduardo. A produção roda no PC dele, e os caminhos `D:\…` citados nas conversas não existem no seu PC.*
