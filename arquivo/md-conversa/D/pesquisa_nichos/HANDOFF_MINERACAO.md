# HANDOFF: mineração de nichos (30/10/2026)

Você continua a **mineração de nichos** do Eduardo enquanto outra sessão produz o vídeo da Babilônia. Leia este arquivo inteiro antes de agir. A memória (MEMORY.md) carrega as regras permanentes. As centrais:
- [[feedback-mineracao-bidimensional]]: a mineração agora é **tridimensional**;
- [[nicho-oceano-2d-descartado]]: os achados de hoje;
- [[historia-dark-estilos]], [[spanish3d]], [[feedback-g4-diferencial]], [[feedback-expandir-grafo-temas]], [[tracer-es-radar-2810]], [[reconstrucao-3d-es]].

## NÃO MEXA (é da outra sessão)

- **A G4:** não rode nada do `D:\tracer3d2\canal.py`. Ela está produzindo a Babilônia (Wan, música, render), e qualquer `ligar`, `garantir` ou `desligar` derruba a produção.
- **As pastas da produção:** `D:\babilonia_es` e o navegador/perfil Dolphin do AI Studio (narração).

## Quem é o Eduardo e o que ele quer

- Ele está na **fase de teste de nichos**:
  - produzimos um vídeo, ele posta e vê se o canal engrena;
  - o canal-teste em espanhol é o Segundo a Segundo, usado como laboratório;
  - vídeo que não engrena em 7 dias vira privado; o canal vira o do nicho quando um acerta.
- Escreve em português informal; quer respostas diretas, em português, com tabela quando ajuda.
- Corrige método e espera que eu aprenda. Hoje foram três correções:
  1. **Viés do ponto de partida:** buscar por moldes de título que eu mesmo escolho é enviesado. A **varredura neutra** (search sem palavra-chave, por semana × categoria × duração) achou 90% de canais diferentes.
  2. **Duas dimensões:** achar o viral não basta; é preciso medir a **corrida do ouro**.
  3. **Terceira dimensão:** **orçamento de produção ≤ 2 h por vídeo**, do roteiro ao mp4, com a nossa stack.
- O diferencial dele é a **G4** (RTX PRO 6000, 96 GB). Ranqueie formatos também pelo que só GPU forte faz em volume: ilustração rica + animação imagem→vídeo, 3D, simulação. Formato sem fala não tem buraco de idioma (o inglês atende o mundo); formato **narrado** tem.

## Ferramentas e dados (tudo em D:)

- **API do YouTube:** `motor/youtube.py` + `motor/config.py` do repo (`C:\Users\edlut\mineracaoyoutube\motor`).
  - **10 chaves** no `.env` (não versionado), cerca de 100 mil unidades por dia.
  - `search` = 100 unidades; `videos`, `channels` e `playlistItems` = 1 por 50 ids. Para `playlistItems`, faça `youtube.CUSTO.setdefault("playlistItems", 1)`.
- **Busca de clones sem gastar cota:** use a URL de busca pelo yt-dlp:
  ```
  yt-dlp --flat-playlist -J "https://www.youtube.com/results?search_query=..."
  ```
  `ytsearchdate` não funciona mais nesta versão.
- Para baixar vídeo e legenda: `yt-dlp --js-runtimes node`. A legenda costuma dar 429; repita com pausa.
- `D:\pesquisa_nichos\`:
  - `neutra.py <en|es>`: varredura neutra; 6 semanas × 9 categorias × 2 durações, cerca de 11 mil unidades por idioma;
  - `neutra_rel.py`;
  - `descoberta.py`: lente por moldes de título;
  - `estagio.py` e `estagio2.py`: clones por formato;
  - `bidim/`:
    - `etapa1.py`: demanda, filtros objetivos, canal ≤ 120 dias, views/dia, agrupamento TF-IDF;
    - `consultas.json`: consultas EN/ES de clones, **escritas à mão** (viés residual, a automatizar);
    - `etapa2.py`: corrida do ouro via yt-dlp + API, onda, tendência do pioneiro, palavras/min pela legenda;
    - `relatorio.py`;
  - `historia/`: mineração de canais dark de história (estilos, folhas de quadros, consistência pela mediana dos últimos 10 vídeos);
  - `cidades.py`, `apophis.py`: análises pontuais.
- `D:\pesquisa_oceano\`: o nicho oceano/predadores 2D.

## Achados de hoje (resumo)

- **Ritmo da corrida:** formato que estoura em EN ganha 40 a 70 clones em cerca de 6 semanas, com mediana abaixo de 200 views. O ES copia em **cerca de 1 semana a 1 mês**: o Apophis do Tracer Project saiu em 16/10 e já havia cópias em ES em 22/10.
- **Lotados:**
  - em EN: oceano 2D, zumbi/bunker, "what did ancient X do all day";
  - em EN e ES: "every rank"; "por qué ningún depredador ataca"; Apophis; cidade crescendo em 3D (CityEons é a 2ª onda, e ES nativo fracassa porque o formato não tem fala).
- **Candidatos que sobraram com as duas primeiras dimensões a favor:**
  - "X was weirder than you think" (Nils History, que tem **apresentador**), com ES vazio. Escolhido; o vídeo da Babilônia está saindo agora;
  - "iPhone users turn this off" (tecnologia), ES vazio;
  - megaengenharia ES (Ingeniería Monumental: mediana 6,9 mil, mas o pioneiro está caindo);
  - dublar sucessos EN para ES (modelo Flytrap Films Español);
  - drama animal narrado.
- **Estilos de história dark:** o palito IA virou commodity (clones de 2 a 12 mil). Runic (ilustração rica, mediana 167 mil), Smart Code Studios (103 mil) e La Historia del Mundo (ES, 55 mil) seguram.
- **Kriegsmomente (canal alemão do sócio):** o vídeo de 1870 ("Warum verlor Frankreich 1870 – obwohl es das bessere Gewehr hatte?") fez 33 mil em 3 dias; os outros têm menos de 4 mil.

## Próximos passos sugeridos (confirme com o Eduardo o que ele quer primeiro)

1. **Radar diário tridimensional:** varredura neutra **por dia** (corrige o recall: Depth Theory e Dummyology escaparam do top 50 semanal) em EN e ES, e se ele quiser DE e PT. A saída diária, por formato, traz:
   - demanda (canal < 90 dias, vídeo acima de 300 mil em menos de 14 dias);
   - corrida (clones em 30 dias, mediana, onda, pioneiro caindo);
   - buraco de idioma (narrado ou sem fala);
   - **estimativa de produção ≤ 2 h com a nossa stack**;
   - um veredito.
2. **Gerar automaticamente as consultas de clones** a partir do molde do título, tirando a escrita à mão.
3. **Teste no passado:** rodar sobre as últimas 8 semanas e medir se pega na 1ª semana as ondas conhecidas (CityEons, Depth Theory, Dummyology, Tracer Project, Ink Explainer, Ingeniería Monumental, Nils History).
4. Se ele pedir nicho novo, entregue os candidatos com as 3 notas e o veredito antes de recomendar. Nunca recomende só pela 1ª dimensão.

Regras gerais:
- Tudo no D: (`TEMP=D:/tmp`). Mate processos só pelo próprio PID.
- O repo `mineracaoyoutube` é **público**: nada de chave, e-mail ou caminho local nos commits. Commit só quando ele pedir, com o trailer `Co-Authored-By: Claude Opus 5.5 <[email removido]>`.
