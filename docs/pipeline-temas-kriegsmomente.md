# Pipeline de escolha de tema e título (canal alemão Kriegsmomente)

Este documento descreve como escolhemos **o tema e os títulos** de cada vídeo do Kriegsmomente, o canal alemão de história das guerras prussianas. Tudo sai de **leitura da API do YouTube** (YouTube Data API v3), não de palpite. Ele foi escrito para que outra pessoa, ou outro agente, consiga ler, reproduzir e criticar o método.

> Repositório público: aqui não há chave de API, ID de canal nem link privado. A chave fica no `.env` local, lida por `motor/config.py`, e o ID do canal fica na variável de ambiente `KRIEGSMOMENTE_CANAL_ID`.

---

## 1. A ideia em uma frase

**Um tema só entra se tiver demanda comprovada no mercado inglês, oferta fraca no mercado alemão, uma corrida ainda aberta, uma máquina ou engenharia no centro e um paradoxo verdadeiro que sustente o título no molde que viralizou no canal.**

Em ordem:

```
 Etapa 0  Escopo e regras do canal
 Etapa 1  Radar de demanda EN × oferta DE, por micronicho  (API)  → lacuna ("buraco") e score
 Etapa 2  Vetor de viralização do título no público DE      (API)  → lift por termo do título
 Etapa 3  Caça de outliers (vídeo que fez muitas vezes o tamanho do próprio canal)
 Etapa 4  Corrida do ouro: quantos clones e com que velocidade (janela de 90 dias)
 Etapa 5  Filtro tridimensional + regras do canal              → 1 tema
 Etapa 6  Títulos no molde que viralizou + descrição + 3 miniaturas (Teste A/B)
 Etapa 7  Previsão por alto (forecast) e registro
```

---

## 2. Arquivos

| Arquivo | Função |
|---|---|
| `ferramentas/radar_kriegsmomente/radar_prussia.py` | Primeiro radar do recorte prussiano (24/10/2026): demanda EN × oferta DE por tema, janela de 5 anos. |
| `ferramentas/radar_kriegsmomente/radar_prussia_1104.py` | Radar de 04/11/2026, só com micronichos **ainda abertos**. Os já feitos ficam de fora. |
| `ferramentas/radar_kriegsmomente/radar_maquinas_1104.py` | Radar de 04/11/2026 (tarde), só temas com **máquina ou engenharia no centro**, com a **corrida de 90 dias**. |
| `ferramentas/radar_kriegsmomente/vetor_prussia.py` | Vetor de viralização: qual termo do título puxa views no público alemão, mais os outliers. |
| `ferramentas/radar_kriegsmomente/radar_analise.py` | Funções compartilhadas: `termos()`, `relevante()` (casamento sem acento) e o filtro `ENTRETENIMENTO`. |
| `ferramentas/radar_kriegsmomente/radar_grafo.py` | `alemao(titulo)`: detecta título em alemão (a API nem sempre preenche o idioma). |
| `motor/youtube.py`, `motor/banco.py`, `motor/config.py` | Cliente da API (com controle de cota e cache em banco) e leitura das chaves do `.env`. |

**Como rodar** (Python 3.11+, chave da API no `.env`):

```bash
cd ferramentas/radar_kriegsmomente
set RADAR_SAIDA=D:/kriegschronik/radar_v2          # onde os CSVs vão parar (fora do repo)
set KRIEGSMOMENTE_CANAL_ID=<id do canal>            # só para o vetor_prussia.py
python radar_maquinas_1104.py                       # ~200 unidades de cota por tema
python vetor_prussia.py                             # ~5–6 mil unidades
```

**Cota:** cada busca custa 100 unidades. O radar faz 2 buscas por tema (EN e DE). A cota diária é de 110 mil unidades (várias chaves somadas), e o `motor/youtube.py` informa quanto sobrou antes e depois de cada rodada.

---

## 3. Etapa 0: escopo e regras do canal

- **Recorte (brief de 24/10/2026):** 100% guerras prussianas. A proporção é 65% Guerra Franco-Prussiana (1870–71) e 35% Guerra Austro-Prussiana (1866). Temas fora disso não entram, por mais demanda que tenham.
- **Um vídeo por micronicho.** Não repetimos micronicho, a não ser que o vídeo viralize. Por isso o radar de 04/11 já exclui o que foi feito: Sedan, Gravelotte, Paris, Mitrailleuse, Dreyse/Chassepot, Moltke, Königgrätz, 1866 geral, 1870 dia a dia, artilharia/Krupp, ferrovia e telégrafo (Emser Depesche).
- **Máquina no centro (desde 04/11/2026).** O tema precisa ter uma máquina, técnica ou inovação de engenharia que dê para explicar animada: couraçado, torpedo, balão, ponte de pontões, fuzil, telégrafo. A espinha do canal é **estratégia + engenharia**, com cálculo só como prova curta.
- **Ponto cego (01/11/2026).** Toda rodada inclui uma etapa sem tema prévio: caçar canal pequeno que estourou (10× as views em relação aos inscritos) e ler a página inicial do YouTube pelo navegador. É assim que se acha o que o radar por palavra-chave não vê.

---

## 4. Etapa 1: radar de demanda EN × oferta DE

**Pergunta:** este micronicho já provou demanda em inglês e ainda está mal servido em alemão?

**Entrada:** uma lista `T` de candidatos. Cada um tem `(guerra, tema, busca_EN, busca_DE, encaixe 0–2)`. O "encaixe" diz o quanto o tema rende cenas explicativas em 3D.

**Coleta (por tema):**
- `search.list` em inglês: `relevanceLanguage=en`, `regionCode=US`, `order=viewCount`, `publishedAfter` = 5 anos atrás, até 50 resultados.
- A mesma busca em alemão: `relevanceLanguage=de`, `regionCode=DE`.
- Depois `videos.list` (views, duração, idioma) e `channels.list` (inscritos).

**Limpeza (essencial para não medir lixo):**
- duração de pelo menos 240 s (fora Shorts e clipes);
- fora entretenimento (regex `ENTRETENIMENTO`: games, Lego, MrBeast etc.);
- **relevância no título**: o título precisa conter os termos da busca, comparando sem acento;
- vídeo "DE" é o que tem idioma `de` **ou** título detectado como alemão por `alemao()`. Vídeo em inglês que aparece na busca alemã **não** conta como oferta DE. Isso já enganou o radar uma vez: um vídeo em inglês com 158 mil views no top da busca alemã.

**Métricas por tema:**

| Campo | Significado |
|---|---|
| `en_med10` | Mediana de views dos 10 maiores vídeos EN relevantes. É a demanda comprovada. |
| `en_max`, `en_n` | Maior vídeo EN e quantos vídeos EN relevantes existem. |
| `de_med10`, `de_max`, `de_n` | O mesmo para o alemão. É a oferta existente. |
| `buraco` | `en_med10 / max(de_med10, 5000)`. Quanto o inglês rende acima do que o alemão já entrega. |
| `score` | `log10(en_med10 + 1) × log10(buraco + 1) × (1 + 0,5 × encaixe)`. |
| `de_90d`, `en_90d` | Vídeos publicados nos últimos 90 dias. É a corrida (Etapa 4). |

**Saídas:** `*_temas_*.csv` (um tema por linha, ordenado pelo score) e `*_top_videos_*.csv` (os 4 a 6 maiores vídeos de cada tema, com canal, inscritos, data e link). **Sempre leia o top de vídeos, não só o score.** O score é um filtro, não uma decisão.

**Exemplo (rodada de máquinas, 04/11/2026):**

| Tema | EN (mediana top 10) | Oferta DE real | Corrida 90 d (DE/EN) | Leitura |
|---|---|---|---|---|
| Guerra naval de 1870 (frota francesa × marinha prussiana) | 149 mil (vídeos de 462 mil e 208 mil; o de 208 mil é de set/2026) | ~0 (o "158 mil DE" era um vídeo em inglês) | 0 / 1 | buraco total em alemão; máquina no centro (couraçados, carvão) |
| Pickelhaube (por que o capacete tinha ponta) | 90 mil (outlier de 143 mil num canal de 4,7 mil inscritos, 30×) | só um quadro de entretenimento | 0 / 1 | ícone prussiano; engenharia fraca |
| Torpedo Whitehead (1866) | 419 mil + 167 mil num canal de 10,9 mil (15×, out/2026) | ~0 | 0 / 2 | máquina pura, mas austríaco e periférico |

---

## 5. Etapa 2: vetor de viralização do título (público alemão)

**Pergunta:** que palavra no título faz um vídeo alemão deste nicho render mais do que o tamanho do canal?

**Coleta:** cerca de 24 buscas em alemão sobre 1864/1866/1870–71, cada uma por `viewCount` e por `relevance`, desde 2021. Filtros: duração ≥ 240 s, título em alemão e termo histórico no título.

**Métrica:** `ratio = views / max(inscritos, 500)`, ou seja, quanto o vídeo rendeu em relação ao tamanho do canal. Para cada termo, compara a mediana do `ratio` dos vídeos **com** o termo contra a dos vídeos **sem** ele: `lift = mediana(com) / mediana(sem)`. Também mede views por dia e a % de outliers (`ratio ≥ 3`).

**Resultado atual** (`vetor_termos.csv`, 04/11/2026, amostra DE):

| Termo no título | n | lift | % outlier |
|---|---|---|---|
| Schlacht | 47 | 1,88× | 36% |
| Moltke | 7 | 1,68× | 43% |
| CAIXA-ALTA de impacto | 39 | 1,35× | 33% |
| Deutsch-Französisch | 30 | 1,23× | 30% |
| número grande | 18 | 1,20× | 44% |
| nome de batalha | 46 | 1,15× | 28% |
| Preußen / preußisch | 103 | 1,14× | 30% |
| pergunta Warum / Wie | 70 | 1,10× | 29% |
| Frankreich / Franzosen | 77 | 0,96× | 34% |
| nome de arma | 31 | 0,93× | 32% |
| 1870 / 1871 | 83 | 0,89× | 24% |
| 1866 | 38 | 0,65× | 21% |
| Bismarck | 28 | 0,46× | 25% |
| Kaiser / Reich | 81 | 0,45× | 23% |

**Como ler:** número grande, Schlacht, Moltke, Preußen e CAIXA-ALTA ajudam. **Bismarck e Kaiser/Reich atrapalham**, porque o público alemão do nicho reage mal ao enquadramento "Reichsgründung". "1866" sozinho também rende pouco: em 1866 escreva sempre **"Preußen gegen Österreich" + número**.

---

## 6. Etapa 3: outliers

O `vetor_prussia.py` lista os 25 vídeos com maior `views / inscritos`. Um vídeo que fez **10× ou mais** o tamanho do canal é o sinal mais forte que existe, porque o assunto e o título levaram o vídeo para fora da base do canal.

**Caso real:** o vídeo 15 (Emser Depesche) tinha score **baixo** no radar (0,59), mas o vetor achou um outlier alemão de **118×** sobre a origem da guerra ("Der wahre Ursprung…"). O outlier venceu o score, e o tema foi escolhido.

---

## 7. Etapa 4: corrida do ouro

**Pergunta:** o molde ou tema ainda está no começo da corrida, ou já virou commodity?

**O que medimos em outros nichos:** um molde viral vira **40 a 70 clones em cerca de 6 semanas**, e o mercado espanhol copia o inglês em **cerca de 1 mês**. Por isso:
- `de_90d = 0` e `en_90d` subindo (ex.: um vídeo grande em set/2026) significa onda nova em inglês sem ninguém em alemão. **Entrar já.**
- `de_90d` alto e vários canais pequenos copiando o mesmo título significa corrida madura. **Descartar**, ou entrar só com um ângulo novo.

O radar de máquinas mede isso automaticamente pela data de publicação dos vídeos do top.

---

## 8. Etapa 5: filtro tridimensional e decisão

Só recomendamos um tema que passe nas **três** dimensões:

1. **Viral recente:** demanda provada em EN (`en_med10` alto, e de preferência um vídeo grande nos últimos 3 a 6 meses) ou um outlier DE.
2. **Corrida aberta:** pouca oferta DE (`de_n` e `de_med10` baixos, `de_90d` próximo de 0).
3. **Produção possível em até 2 h** de máquina por vídeo: o tema cabe na nossa produção (máquina no teardown, mapa, gravura).

E ainda nas regras do canal: recorte prussiano 65/35, micronicho inédito, **máquina no centro** e **um paradoxo real e verificável** (sem paradoxo, não há título 1).

**Checklist de decisão (preencher por candidato):**

| Critério | Sim/Não | Evidência (número e link) |
|---|---|---|
| No recorte (1870–71 ou 1866) | | |
| Micronicho inédito no canal | | |
| Máquina ou engenharia no centro | | |
| Demanda EN comprovada | | `en_med10`, maior vídeo e data |
| Oferta DE fraca | | `de_n`, `de_med10` (e conferir se os "DE" são mesmo alemães) |
| Corrida aberta | | `de_90d`, `en_90d` |
| Outlier no tema ou molde | | ratio e link |
| Paradoxo verdadeiro para o T1 | | fonte do fato |
| Produção em até 2 h | | |

---

## 9. Etapa 6: títulos, descrição e miniaturas

**Por que o molde do título 1 é fixo:** em 30/10/2026, *"Warum verlor Frankreich 1870 – obwohl es das bessere Gewehr hatte?"* tinha **33 mil views em 3 dias** (chegou a 41,7 mil em 31/10, 82% do canal). Todos os outros vídeos do canal ficaram entre 0,1 mil e 4 mil, inclusive um sobre o **mesmo tema 1870** com título descritivo. Nos Testes A/B do YouTube, a pergunta "Warum" com paradoxo venceu as duas vezes (37,6% e 44,6%). **A estrutura do título carrega o viral**, não só o tema.

**Os 3 títulos do Teste A/B:**

- **T1, sempre o paradoxo:** `Warum [verlor / scheiterte / blieb wirkungslos] [lado favorito] [ano] – obwohl [vantagem óbvia]?`
- **T2:** o duelo explícito com número, por exemplo `Deutsch-Französischer Krieg 1870: Wie Preußen … [número] …`
- **T3:** descritivo ou "hora a hora", com `Deutsch-Französischer Krieg 1870:` na frente. **Nunca** como principal.

**Regras para os três títulos:**
- "Deutsch-Französischer Krieg 1870" em pelo menos um título; Preußen e Frankreich/Franzosen nos outros.
- Número sempre que houver.
- **Sem** Bismarck, Kaiser ou Reich (lift 0,45–0,46×).
- Até 100 caracteres.
- Em 1866: "Preußen gegen Österreich" + número.
- O fato do paradoxo é conferido na pauta **antes** de ir para o título.

**Descrição curta** (`ferramentas/descricao_curta.py`): 4 linhas, capítulos, 1 linha de licenças/créditos, 3 a 5 hashtags, cerca de 1.200 caracteres. Os créditos ficam só na descrição, nunca na imagem.

**3 miniaturas, uma para cada título:**
1. rosto com gancho;
2. rosto com número;
3. a máquina em 3D com número.

Texto em 3 níveis: branco, amarelo `#f5c542` e uma linha vermelha.

---

## 10. Etapa 7: previsão por alto (forecast)

A previsão parte da base do próprio canal:

| Tipo de vídeo no canal | Faixa observada (30 dias) |
|---|---|
| Paradoxo "Warum … obwohl …" em tema 1870 com demanda | 33 a 42 mil (o único caso até agora) |
| 1870 com o duelo na frente ("Deutsch-Französischer Krieg 1870: …") | ~3 a 6 mil |
| Título descritivo ("Im Inneren der …", "Stunde für Stunde") | 0,1 a 4 mil |

**Regra de bolso:**
- tema que passa nas 3 dimensões + título no molde paradoxo: **8 a 25 mil views em 30 dias**, com teto acima de 40 mil se pegar a página inicial;
- tema sem demanda EN comprovada ou com título descritivo: **0,5 a 4 mil**.

A amostra do canal ainda é pequena, então a incerteza é alta. A previsão serve para **comparar candidatos entre si**, não como promessa.

---

## 11. Exemplo resolvido: proposta para o vídeo 16 (04/11/2026)

**Tema:** a guerra naval de 1870. A França tinha uma das maiores frotas de couraçados do mundo; a marinha prussiana era minúscula. Mesmo assim a frota francesa não mudou nada na guerra: o bloqueio foi inútil e os navios ficaram parados por calado, carvão e falta de tropas de desembarque.

- **Por que passa:** demanda EN comprovada (462 mil e 208 mil, este de set/2026), oferta DE real ≈ 0, corrida aberta (`de_90d` = 0), máquina no centro (couraçado, carvão, calado) e um paradoxo forte.
- **Títulos** (os números só entram depois de conferidos na pauta):
  - **T1:** *Warum blieb Frankreichs riesige Panzerflotte 1870 wirkungslos – obwohl sie Preußen zehnfach überlegen war?*
  - **T2:** *Deutsch-Französischer Krieg 1870: Wie Preußens winzige Marine die zweitgrößte Flotte der Welt ins Leere laufen ließ*
  - **T3:** *Preußen gegen Frankreich zur See 1870: Panzerschiffe, Kohle und eine Blockade ohne Wirkung*
- **Previsão:** 8 a 25 mil em 30 dias (molde paradoxo + buraco total em DE).

---

## 12. Limitações conhecidas

- A busca da API devolve no máximo 50 vídeos por consulta e é sensível à palavra exata. Uma busca estreita demais gera **falso zero**: vários temas da rodada de máquinas deram 0 por consulta específica demais. Quando o resultado der zero, refaça com uma busca mais larga antes de descartar.
- `relevanceLanguage` não garante o idioma, por isso existe o `alemao()` e a conferência manual do top.
- O score favorece demanda grande em inglês. Um outlier alemão forte (Etapa 3) pode e deve vencer o score.
- O canal tem poucos vídeos, então o vetor de título vem do **nicho alemão inteiro**, e a previsão por canal é grosseira.
