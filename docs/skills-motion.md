# Skills de motion design instaladas (19/11/2026)

Três skills de agente foram instaladas globalmente em `~/.claude/skills/`, com `npx skills add <repo> -g -a claude-code`. Elas valem em toda sessão do Claude Code. Motivo: o documentário do Lanús saiu com cara de slideshow; ver `docs/canais/fb_que_pasaria_si/doc-noticia-pipeline.md`.

| Skill | Repo | Tamanho | Para que usamos |
|---|---|---|---|
| `motionmaxxing` | Tejashmakwana/motionmaxxing (Apache-2.0) | 26 MB | **Juiz anti-slide.** Os portões `look.py` e `lint.mjs` reprovam os vícios de "slide deck que se mexe": rótulo no canto, título à esquerda com cartão, fade entre tudo, cartão final parado. Rodar no render do documentário antes de entregar. As curvas foram medidas de 53 recriações profissionais. |
| `reanimate` | NiazMorshed2007/reanimate (MIT) | 0,3 MB | **Copiar o ritmo de uma referência, com medida.** Grava a referência, recria, grava a cópia e compara tempo, easing e pixels em 2 a 5 rodadas. É a regra "referência lado a lado" automatizada. Pede Bun e Playwright e não foi testado no Windows: rodar na G4. |
| `huashu-art-motion` | alchaincyf/huashu-art-motion (MIT) | 74 MB | **Gramáticas de explicação.** São 9 gramáticas (quadro branco, divulgação científica com apresentador, etc.), 8 trechos parametrizados pela narração, código de referência de filme inteiro guiado pela voz e 36 estilos de arte. Base para os takes explicativos dos documentários narrados. |

## Como entram no pipeline do documentário de notícia
1. **Passo 0:** continua partindo do Kriegsmomente (K19/K20).
2. **Takes explicativos:** consultar primeiro as gramáticas do `huashu-art-motion`, antes de escrever diagrama do zero.
3. **Referência de ritmo** (K19, Silicon Up Close): `reanimate` na G4 mede e replica.
4. **Antes de entregar:** passar o render pelos portões do `motionmaxxing` e anexar o relatório. Reprovado volta.

## Avaliados e descartados no mesmo dia
- **Já estão na stack:** three.quarks, react-postprocessing, WhisperX, librosa, Remotion skills.
- **Baixo valor:** mg-styles-15, anidoodle, cinetic (feito para filme de produto; servem só as animações de texto dele), motion-design-skill, EffectCraft, Manim, Tweakpane, Openverse.
- **Fábricas de "drama curto com IA": Pixelle-Video, Jellyfish e waoowaoo.** Todas geram cena por IA de imagem e vídeo, uma imagem por frase mais TTS e música. Isso é o slideshow que o Eduardo reprovou, e tem risco de "conteúdo não original" (`docs/BADPATHS.md` #8). Não usar.

## Atualizar
```sh
npx skills add <repo> -g -a claude-code -y
```
Rode com `npm_config_cache=D:/tmp/npmcache` (nada no C:).
