# Cinematic Skill (cinematic-film), skill de terceiros guardada no repo

- **Origem:** https://github.com/Moh4696/cinematic-skill (commit `bf43556`, 09/11/2026), **licença MIT**. A cópia da skill fica em `ferramentas/skills_terceiros/cinematic-film/`, com o `LICENSE` original. Os exemplos `.webp` do repositório ficaram de fora.
- **Pedido do Eduardo (09/11):** guardar no nosso GitHub para consulta e reaproveitamento.

## O que é
Uma skill de agente que faz **filme narrado 100% por código**, sem vídeo gerado por IA. O resultado é **uma câmera contínua** que desliza sobre **um único "mundo" desenhado**: um painel grande com fotos, documentos, cartões, mapas com rota e números grandes. Cada carimbo, marca-texto ou número que conta cai **na palavra exata da narração**. O render é em Python + Skia, então sai igual toda vez, e uma voz nova re-cronometra o filme sozinha.

## Peças (scripts)
- **Roteiro e batidas:** `make_beats.py` gera a tabela de batidas para aprovação e checa cronologia, tamanho de frase e dígitos no texto falado.
- **Voz:**
  - `tts_say.py`: voz rascunho;
  - `split_takes.py`: corta takes longos em uma fala por linha;
  - `build_narration.py`: gera `narration.m4a` + `timing.json`, que é a base de todo o tempo do filme.
- **Imagens:**
  - `fetch_commons.py`: busca no Wikimedia Commons, guarda licença e crédito e recusa arquivo não livre;
  - `prep_assets.py`: dá um só tratamento a todas as imagens (P&B, sépia ou natural) e cria as texturas do painel;
  - `make_map.py`: projeta fronteiras de domínio público.
- **Motor e render:**
  - `engine.py`: câmera, spotlight, itens, mapas, "looks" (`wall`, `slate`, `studio`, `charcoal`, `blueprint`, `paper`) e acabamento de filme;
  - `render.py`: stills de autoconferência, folhas de contato, lista de cues e render MP4 paralelo com memória controlada.
- **Som:**
  - `build_sfx.py`: sintetiza os efeitos sonoros a partir dos cues, sem samples e sem licença;
  - `mix_soundtrack.py`: voz + efeitos + música opcional, com ducking e loudness.
- **Legenda:** `burn_captions.py`, com 4 estilos de legenda queimada + SRT.

Requisitos: Python 3.9+, `skia-python numpy pillow`, ffmpeg. Roda no CPU.

## Onde serve para nós
- **Kriegsmomente:**
  - a gramática "painel de evidências + câmera contínua + número na palavra" combina com o tema creme. Os looks `paper` ou `wall` com sépia se aproximam dos takes de época 2,5D e de cartão;
  - o `fetch_commons.py`, que filtra licença e gera os créditos, encaixa na regra "créditos só na descrição".
- **Canal ES e explicadores:** o look `blueprint` ou `paper` para "como funciona", com contador e seta na palavra.
- **Regra do dado na palavra:** é a mesma ideia do nosso `plano.py`, que amarra parâmetro a palavra. Aqui ela já vem pronta, com `timing.json`.

## Como usar
- **Primeiro o batedor:** antes de levar ao vídeo, rode um batedor curto (portão 1 e 2 do `CLAUDE.md`) e compare com o nosso kit Remotion. Não troque a stack congelada de um vídeo em produção.
- **Instalar como skill do agente:** copie `ferramentas/skills_terceiros/cinematic-film/` para a pasta de skills (ex.: `~/.claude/skills/`) ou rode `npx skills add Moh4696/cinematic-skill`.
- **Música:** nos canais sem música (Kriegsmomente), use só voz + `build_sfx`, sem score.
