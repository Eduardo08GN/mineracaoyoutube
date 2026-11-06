# Radar de notícias quentes (por país)

Ferramenta: `ferramentas/radar_noticias/` (`radar.py` + `config.json`). Criado em 06/11/2026 a pedido do Eduardo, para o canal teste ES (Segundo a Segundo) e para a página do Facebook.

## Por que existe
Os próprios números do canal mostram que **só a notícia quente entrega**:
- **YouTube:** Urda fez 111 mil; o resto ficou abaixo de 800.
- **Facebook:** o Learjet fez 625 mil, 398 mil e 246 mil em 3 posts, um por ângulo. O evergreen fez de 2 a 3 mil.

O critério antigo era fraco. Ele media as **views de vídeos já publicados**, com uma lista de termos escrita à mão, ou seja, **oferta e não procura**:
- confundia buraco com falta de interesse;
- só achava o que estava no vocabulário;
- não separava país;
- gastava a cota do YouTube (100 unidades por busca).

## Arquitetura em 3 camadas
1. **Detecção, sem cota do YouTube**, por país (ES, MX, AR, CO, CL, PE, US):
   - **Google Trends: consultas em alta** (rising) de sementes como "accidente", "avión", "tren", "explosión", "rescate", "tragedia", "derrumbe" e "naufragio". Roda em duas propriedades: **Pesquisa do YouTube** (vale 2× no score) e web (para o Facebook, que não tem API de tendências). "Aumento repentino" (Breakout) vale o máximo.
   - **Trends "Em alta agora"** (RSS por país): mostra o volume aproximado ("200 mil+").
   - **Google News RSS por país:** quantas manchetes o evento tem (calor de mídia) e os fatos.
   - **Wikipédia:** artigos de acidente ou desastre mais vistos no dia anterior.
   - As consultas viram **eventos**. Cada chave é o que sobra tirando a semente e as palavras genéricas. As chaves se fundem quando têm um token específico em comum ou aparecem juntas em ≥ 2 manchetes. Um filtro tira esporte, política, filme e jogo.
   - O evento é classificado nos **perfis** `segundo` (mecanismo de acidente) e `caso_real` (sobrevivência, pessoa).
2. **Demanda calibrada:** o interesse na Pesquisa do YouTube do evento é medido **na mesma escala** de uma âncora conhecida, no último mês e no país:
   - **ES:** "accidente tren urda" (Urda = 111 mil no nosso canal);
   - **LatAm:** "accidente avion florida" (Learjet = 625 mil no FB, 925 mil no NOTICIAS ILUSTRADAS);
   - **US:** "florida plane crash".

   A saída é a razão de pico, por exemplo "0,4× Urda".
3. **Oferta (só para os candidatos do topo):** YouTube Data API com `regionCode` do país e últimos 7 dias. Mede quantos vídeos longos (≥ 4 min) já existem, o maior longo e o maior geral. Antes de decidir, conferir à mão se o líder EN dubla em ES (`yt-dlp -J`, ver `docs/BADPATHS.md` e a memória da dublagem).

## Como rodar
```
python -I -X utf8 ferramentas/radar_noticias/radar.py                   # 7 países, ~20–25 min, ~3 mil unidades de cota
python -I -X utf8 ferramentas/radar_noticias/radar.py --paises ES,MX --sem-oferta   # rápido, zero cota
```
- **Saída:** `D:/pesquisa_nichos/radar_quente/radar_AAAAMMDD_HHMM.md` + `.json` (bruto, fora do repositório).
- **Cadência sugerida:** a cada 2 h no horário de produção. Rodar sempre antes de escolher a pauta do dia.

## Como decidir com a saída
- **Vídeo YouTube (Segundo a Segundo):** perfil `segundo` ou `caso_real`, com razão de pico ≥ ~0,2× a âncora no país, e oferta com ≤ 3 vídeos longos em ES. Publicar em **até 24 h** com a chave do evento no começo do título (ver a memória do título com palavra-chave).
- **Facebook:** um post para cada ângulo e atualização, enquanto o evento tiver manchete nova. No FB, chegar alguns dias depois ainda rende.
- **Espinha do roteiro (caso real):** pessoa no centro, abertura no pior momento com um número, mecanismo explicado no 3D. A execução é a nossa (acabamento, HUD vivo, take único), nunca a do concorrente.

## Limites conhecidos
- O Google Trends **não tem API oficial aberta** (a oficial está em alfa, só por convite). O radar usa os endpoints do site com cookie, pausa de 2,5 s entre chamadas e repetição em caso de 429. Se o 429 persistir, rodar menos países por vez.
- O RSS "Em alta agora" traz só ~10 termos por país, quase todos de esporte. É sinal secundário.
- O GDELT ficou fora: deu 429 no batedor de 06/11.
- A razão contra a âncora é relativa. Um evento novo, de 1–2 dias, com pico alto, ainda pode ter pouca área: olhar também a data.
- A chave da YouTube API vem do `.env` local e nunca é impressa. Nada de chave, token ou ID neste repositório.

## Estado em 06/11 (1ª rodada)
- A rodada completa, 7 países, terminou em ~25 min. Com `--de-json` a coleta é reaproveitada e o agrupamento leva segundos (índice invertido de manchetes).
- **Top da 1ª rodada:** Learjet (Florida), Martorell (ES), Pachuca (MX), Ixtapaluca (MX, 25 manchetes), Iquitos (PE), Nepal.
- **Ajuste pendente:** a fusão por co-ocorrência em manchete ainda junta eventos que aparecem em listas de "tragédias" (Cruz del Sur + Urda + Angrois). A calibração contra a âncora só faz sentido para termos específicos; termo genérico ("avion cae") dá razões absurdas.
