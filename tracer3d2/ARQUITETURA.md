# Tracer3D 2.0

> **Antes de produzir, leia [BADPATHS.md](BADPATHS.md)**: sintoma → causa → regra de cada armadilha já encontrada.
> **E [REFERENCIA_TRACER_PROJECT.md](REFERENCIA_TRACER_PROJECT.md)**: a assinatura de edição da referência, a mistura de b-roll obrigatória e o padrão de acabamento.

Pipeline novo, construído **ao lado** do Tracer3D 1.0. Nada em `<tracer3d-1.0>` nem em `tracer3d/` do repo é alterado.
O 1.0 continua funcionando até o 2.0 provar, num vídeo inteiro, que entrega a mesma qualidade com menos tempo e tokens.

## Quem manda: o Opus é o maestro

| Papel | Quem | O que faz |
|---|---|---|
| **Maestro** | Opus (a conversa) | Decide tudo que afeta a qualidade: roteiro, física, plano de batidas, o que é cena inédita, aprovação de cada portão, revisão final. Define as regras que os executores seguem. |
| Contramestre | `esteira.py` (código) | Executa as etapas na ordem do grafo, em paralelo, com cache por hash. Aplica as regras do maestro (repetir, religar a G4, refazer upload) sem pedir licença. |
| Vigias | `vigia_ui.py`, daemon da VM | Observam G4, Colab e jobs; mandam o boletim ao maestro. |
| Operários | agentes Sonnet/Haiku | Só cenas inéditas e textos; contexto mínimo, API da biblioteca em cache. |

### Como o maestro é informado (pró-ativo, sem surdez)
- **Boletim a cada 5 min**: uma linha por estação (`voz OK 12/12 · g4 ON 3 min ocioso · stills 41/41 · render 62% · tokens 0,4 M`). Curto de propósito: chega sempre, custa pouco.
- **Alerta imediato** quando algo sai das regras (CAPTCHA, G4 sem GPU, job falhou 2x, prazo estourado).
- **Portão**: ao fim de cada etapa de qualidade a esteira **para e espera o OK do maestro** (roteiro, plano de batidas, prévia, mix, entrega).

## Camadas
1. **Canal G4 por HTTP** (`canal.py` ↔ `vm/servidor.py`): porta-proxy nativa do Colab (`google.colab.kernel.proxyPort`), autenticada pelos cookies da sessão Google do navegador, copiados para o `requests`. Uma única célula por sessão (a que sobe o servidor); todo o resto é HTTP. Sem Drive, sem pop-up de autorização, sem túnel de terceiros.
2. **Boot rápido**: sincronização por diferença (sha1) com 4 envios em paralelo; npm na VM em paralelo à subida do projeto.
3. **Stills quentes** (`vm/stills_quente.mjs`): Chrome aberto a sessão inteira, rebundle só quando `src/` muda. Sem fallback local para 3D.
4. **Desligamento**: o servidor decide (ocioso = sem pedidos e sem jobs; o Chrome quente não conta) e a thread `vigia_t2` **dentro do kernel** executa o `runtime.unassign` (fora do kernel ele não funciona). Ela também desliga se o servidor morrer (`ocioso.txt` parado há 20 min).
5. **Esteira** (`esteira.py`): DAG com cache, portões, tentativas, prazo, BOLETIM/ALERTA/PORTAO no stdout para o maestro escutar.

### Medido no batedor (24/10/2026, projeto da Bertha como banco de teste)
| | 1.0 | **2.0** |
|---|---|---|
| Comando na VM | 60–120 s, um por vez | **~0,2 s**, em paralelo |
| G4 desligada → stills prontos | ~15 min | **~2,5 min** (207 MB subidos em 97 s) |
| Stills | ~2 min por chamada (bundle + Chrome novos) | **~1 s por still**; rebundle 3 s |
| Render 600 quadros + download | — | 42 s + 3,7 s |
| Vazão do canal | — | subida 3 MB/s, descida 8 MB/s (pedaços de 16 MB) |
| Desligar | célula no Colab | `/desligar` → kernel derruba em <1 min, verificado |
6. **Biblioteca de cenas parametrizadas** (`kit/`, sessão 2): batida descrita em JSON renderiza sem agente escrever código.
7. **Roteamento de modelos**: Opus para fatos, física, roteiro e portões; Sonnet para plano JSON e cenas inéditas; Haiku/código para o resto.

## Sessão 2: biblioteca de cenas (feita em 24/10/2026)
- O projeto-modelo de todo vídeo novo fica em `modelo/v1`. É uma cópia da Bertha mais o kit, com o mesmo `node_modules` por junction. O vídeo novo nasce de uma cópia dele.
- O kit fica em `src/kit/` (índice em `src/kit/API.md`). As cenas em JSON ficam em `src/cenas/{ui,karten,welt}.json`.
- Custo de construção, feita uma vez só: 3 agentes Sonnet em paralelo, ~1,26 M tokens, ~40 min.
- Custo por vídeo: uma batida de UI em JSON tem ~1,6 mil caracteres (~450 tokens); os mapas usam modelos e ficam abaixo de 100 caracteres por batida. Um vídeo de 200 batidas sai por ~100 mil tokens de JSON, contra ~3,7 M gastos com código no vídeo 2.
- Render em trecho: `canal.py render <proj> <ini_s> <fim_s> <destino>`, com um Chrome por faixa. Vários Chromes são obrigatórios, porque várias abas WebGL num Chrome só dão "Shader Error VALIDATE_STATUS". Medido: capítulo de 111 s em 146 s.
- Brief dos agentes de código: `modelo/KIT_BRIEF.md`. O mesmo contrato vale para as cenas inéditas de cada vídeo.

## Lições do vídeo 3 (V3, 24/10/2026): 3 h 20 min, ~27 % menos tokens que a Bertha
- **Subir a G4 antes da narração.** Colab e AI Studio no mesmo navegador travam um ao outro. O `canal.py ligar` agora só conecta o runtime; o vigia é a `vigia_t2` do kernel, sem o vigia antigo do `g4.py`.
- **G4 desligada por ociosidade devolve página sem JSON.** Isso conta como "fora do ar" (`G4_FORA`), e o `garantir` religa.
- **TaskStop no Windows não mata o python filho.** Use `taskkill /T /F` e trava de processo único em todo script de automação (narrar.py).
- **Tokens:** os planejadores (1,07 M) e as cenas inéditas (1,29 M) foram o grosso. Próximo passo:
  - planejador confere por checagem automática mais uma folha por capítulo, não por rodadas de stills;
  - inéditas só onde o roteiro exige;
  - modelos novos (tubo, bunker, aviões) vão para o kit.
- **Efeitos sonoros por regras sem LLM** (`ferramentas/efeitos.py`), e legendas pelas palavras alinhadas (`ferramentas/legendas.py`).

## Portão obrigatório: batedor de stack (desde 24/10/2026)
Ordem: plano de batidas → **batedor de stack** → agentes inéditos. É um portão: os agentes inéditos só começam depois do relatório `BATEDOR_<video>.md` aprovado pelo maestro.
- O batedor inventaria os elementos novos ou fracos do vídeo (as batidas `INEDITO_*` e o que o kit faz mal). Depois varre GitHub, npm, fórum three.js e bancos CC0 em busca de libs e assets que elevem a qualidade, com prova rápida, licença comercial, determinismo e compatibilidade com three 0.180.
- O batedor de dados (mapas, satélite, fotos) **não** substitui o batedor de stack.
- Na V3 ele foi pulado: o Lancaster ficou simplificado, Suffolk ficou borrado e as rachaduras saíram desenhadas à mão em vez de pinata.

## Narração: o alinhamento é o portão de qualidade (Gustav, 24/10/2026)
- O Gemini TTS **pulou 69–76 palavras** do capítulo 8, duas vezes no mesmo trecho, e a checagem de duração não pegou. O trecho começava com "Ergebnis: …". O TTS tem modo de roteiro ("Nome: fala"), e uma palavra solta seguida de dois-pontos no início de frase pode virar rótulo e sumir.
- **Regras:**
  - no roteiro, nada de "Palavra:" abrindo frase; use frase completa;
  - depois do alinhamento, todo capítulo com WER > 0,15 passa por diff contra o roteiro. Diferença de número escrito por extenso contra dígito é normal; trecho apagado não é.
  - Para regerar um capítulo, use `narrar.py <id>`, depois `kv3/alinhar_um.py <id>` na G4, e mescle o resultado.

## Dinamismo (feedback do Eduardo, 24/10/2026: a V3 ficou menos dinâmica que a Bertha)
A V3 teve 58% de cartões 2D (`ui`), contra 37% na Bertha. Regras do planejador:
- no máximo **40%** de batidas `ui` no vídeo;
- nunca mais de **2 cartões seguidos**;
- pelo menos **1 cena 3D ou mapa a cada ~15 s**.
Números e fórmulas entram por cima do 3D (HUD e rótulos na cena) sempre que der, em vez de cartão sobre fundo liso.

## Regras herdadas do 1.0 (continuam valendo)
Batedor sempre · G4 sempre desligada quando ociosa · entrega/ só com mp4 com áudio (ffprobe) · 3 miniaturas no teste A/B · sem marca SIMULATION · créditos de dados obrigatórios · nada no C: · repo público sem segredos.

## Ordem de construção
1. Infra: daemon + canal Drive + imagem quente + esteira + boletim. Teste: re-render da Bertha sem custo de agentes.
2. Biblioteca: ~12 componentes extraídos dos vídeos 1 e 2 + formato JSON das batidas. Teste: 2–3 capítulos da Bertha só a partir de JSON.
3. Vídeo 3 (Verdun/Douaumont) no 2.0, medindo tempo e tokens contra o vídeo 2.

## Vídeo 6 (1870/71 jeden Tag, 25/10/2026): 2 h 30, Sonnet ≈ 2,85 M, render inteiro em ~12 min
- **Contador global** (`modelo/opcional/zaehler.tsx`): HUD fixo embaixo, lê uma série diária (`tage.json`).
  - A data vem das batidas: `datum` (ISO), `lauf: true` (a data corre até a próxima batida datada) e `zaehler: false` (esconde).
  - O `plano.py` repassa esses campos.
  - Para usar: copie para `src/`, ponha a série em `src/tage.json` e monte `<Zaehler tv={tv} beat={b} />` no `Video.tsx`, antes do `<Kanal />`.
- **Fontes de época** (`modelo/opcional/epoche.ts`): carrega TTF de `public/fonts` com `delayRender`.
  - Old Standard TT (antiqua) para rótulos.
  - UnifrakturMaguntia (Fraktur) só em títulos.
- **Novidades do kit no projeto do vídeo 6:** `KruppC64` e `LaHitte` (`registraModelo`), multidões instanciadas (1 figura = 1.000 homens), trem de 1870, balão, neve do Jura.
