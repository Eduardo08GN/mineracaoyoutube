# Próxima mineração: novo formato para o canal teste ES (plano de 01/11/2026)

**Decisão do Eduardo (01/11):**
- a reconstrução 3D foi encerrada;
- o Segundo a Segundo volta a ser canal teste;
- fica o que já se ganhou: 209 inscritos e as horas assistidas (adiantam a monetização).

**Objetivo:** achar um formato com mediana alta no NOSSO canal, que é pequeno. A regra continua: "subir vídeo para ter poucas views está fora de cogitação".

## 0. O que os prints já mostram (semente)
| Formato | Canais (prints) | Sinal |
|---|---|---|
| **A. "What If" POV com boneco animado** (2ª pessoa, superpoder ou limite humano, 6–13 min) | Ifverse (49,6 mil, 16 vídeos), IFOLOGY (33,5 mil, 20), Ifinite (5,8 mil, 8) | 4,3 mi; 706 mil e 519 mil em ~1 semana; 793 mil em 7 dias num canal de 5,8 mil inscritos. Os três se copiam: **a onda EN já está em clones** |
| **B. Curta animado de disciplina/vício** ("\| An Animated Short Film", 2–5 min) | Day One Films (64 mil, 14), Monk Mode Films (8,3 mil → 15,3 mil entre um print e outro), Last Soul (7,4 mil, 6) | DISCIPLINE 4,6 mi; LUST VS LOVE 1,6 mi em 3 dias; 1 MINUTE 493 mil |
| C. Página animada de técnica de boxe (vertical, Instagram) | post no X de quem vende app | 3,7 mi em 33 dias. Short não conta hora assistida para monetizar; fica como perna 2 |
| D. Paint explainer mórbido (Maybe Smart) | já medido | ES já tem clones e os novos flopam (`../maybe_smart/RELATORIO.md`) |

**O ponto em comum:** canal novo, com menos de 20 vídeos e hit de milhões. É exatamente o tipo de canal que as minerações anteriores não pegavam.

**Hipóteses a testar:**
- **H1:** o ES ainda não tem clone de A e B, ou os clones ainda pegam.
- **H2:** os entrantes EN de 2026 ainda fazem mediana alta, ou seja, a janela ainda está aberta.
- **H3:** a produção cabe em 2 h na G4.

## 1. Rodadas (orçamento de ~20–25 mil unidades; rodar em 02/11, depois do reset da cota)
| Rodada | O que faz | Cota |
|---|---|---|
| **R0 Semente** | Pega os 7 canais dos prints + Maybe Smart: `channels.list` por handle, playlist de uploads e `videos.list`. Mede criação, data do 1º hit, dias até 100 mil, mediana, cadência e duração. **Extrai o vocabulário real** (títulos, tags, padrão da miniatura) para alimentar a R2 | ~60 |
| **R1 Varredura sem tema** | `videos.list chart=mostPopular` (1 unidade por página) em ES, MX, AR, CO, CL, PE e US, nas categorias 1, 22, 24, 27 e 28 + o `neutra.py` (q vazio, últimos 14 dias, Film & Animation e Entertainment). **Filtro "canal que estourou":** criado há ≤ 12 meses, < 100 mil inscritos e vídeo com ≥ 10× mais views que inscritos | ~4–5 mil |
| **R2 Corrida por formato** | Para até 6 formatos (A, B + os que saírem da R1): molde EN e ES com o vocabulário da R0, ordem por data e por views, últimos 60 dias. Mede: clones por semana de criação; mediana dos entrantes dos últimos 30 dias; **clones ES** (ES+MX+AR+CO), quantos e com que mediana. A expansão de canal é só pela playlist de uploads (1 unidade), **nunca search por canal** (foi esse o erro que custou 54 mil) | ~10–15 mil |
| **R3 Leitura do Início** | Pelo Chrome: rolar o Início e as Inscrições da conta do Eduardo + Studio → Tendências "O que as pessoas estão a ver". Anotar canais novos e cruzar com a R1. **Só leitura** | 0 |
| **R4 Veredito** | 3 dimensões (viral recente, estágio da corrida, ≤ 2 h na G4) + **previsão de mediana para um canal de 209 inscritos**, com faixa P25–P75 | 0 |
| R5 Batedor | Só do vencedor e com OK do Eduardo: 1 minuto do formato na G4, cronometrado | G4 |

## 2. Correções em relação às minerações anteriores
1. **Vocabulário vem dos dados** (canais semente + mostPopular), não da minha cabeça.
2. **Canal com menos de 10 vídeos não é descartado** por consistência. Ele é medido por "views ÷ inscritos" e pela velocidade até o 1º hit.
3. **Funil antes de expandir:** filtrar canais pela `channels.list` (1 unidade) e só então puxar uploads.
4. **O ES é sempre ES+MX+AR+CO.** Formato com narração tem buraco de idioma; formato mudo não tem (lição da cidade 3D).
5. **Economia de horas assistidas** entra no veredito. Exemplo: B tem ~3 min, então 1 mi de views ≈ 25 mil h; A tem ~10 min e gera ~3× mais horas por view.

## 3. Portão de recomendação (proposta)
Só recomendo um formato se cumprir as três condições:
- **ES:** no máximo 3 clones, ou clones ES de 2026 com mediana ≥ 50 mil;
- **EN:** pelo menos 2 entrantes de 2026 com mediana ≥ 100 mil nos 5 primeiros vídeos;
- **nosso canal:** previsão de mediana ≥ 20 mil com P25 ≥ 5 mil.

Se nada passar, a resposta é "nenhum", e não um formato forçado.

## 4. Entregáveis
`RELATORIO.md` nesta pasta, com:
- ranking top 3 com previsão;
- molde de título ES espelhado 1:1 do viral;
- estilo visual;
- plano do batedor.

O nome e o handle do canal se decidem depois do veredito (dá para renomear sem perder inscritos).

## 5. Fontes fora do YouTube (R3b, sem cota; adicionado em 01/11)
**Calibração:** cada fonte é testada contra o gabarito, que são os canais dos prints. Ifinite, Monk Mode, Last Soul e Maybe Smart: a fonte achou ou não?

1. **Rankings de crescimento por país** (grátis, só leitura): Playboard (ranking de crescimento por país e categoria: MX, ES, AR, CO, US) e Vidanalyze ("fastest growing" por país). Sem contornar Cloudflare.
2. **Ferramentas de outlier** (pagas, com teste grátis; o Eduardo cria a conta e eu opero logado no Chrome):
   - OutlierKit: Outlier Finder, vídeo 5–10× acima da base do canal;
   - NexLev: Niche Finder com filtro de canal novo faceless;
   - 1of10 e OverseerOS: Viral Channel Finder.
   Assinar só a que achar o gabarito.
3. **Comunidades de "YouTube automation"**, onde os prints nasceram:
   - X (posts com print de canal + views);
   - Reddit r/NewTubers e r/youtubeautomation;
   - Skool, onde o Day One Films tem link.
   O curso que ensina o formato é a origem da onda de clones. Formato ensinado = saturação em 4–6 semanas (sinal de alerta, não só de oportunidade).
4. **TikTok Creative Center e Reels:** criadores e hashtags em alta por país (ES/MX). Formato vertical que estoura costuma migrar para o YouTube longo depois. É sinal antecipado.
