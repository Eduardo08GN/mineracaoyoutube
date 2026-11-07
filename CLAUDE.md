# Regras fixas deste repositório (lidas em toda sessão)

Produção de vídeos para os canais do Eduardo: Kriegsmomente (DE), Segundo a Segundo (ES), Chroniques (FR) e outros. Pipelines: `tracer3d2/`, `eddie3d/`, `spanish3d/`, unreal3d (em `D:\unreal3d`) e `motor/`.

## Portões (nunca pular)
1. **Pronto antes de construir.** Antes de escrever qualquer shader, material, cena, vegetação, céu, pós-processo, componente de UI ou ferramenta, rode o **levantamento de prontos** de `docs/BATEDOR.md`, passo 0. Ele cobre pacotes (Fab, Megascans, CC0), recursos nativos da engine, GitHub e npm. Construir à mão só o que o levantamento provar que não existe. (Caminho ruim repetido 3×: ver `docs/BADPATHS.md` #1.)
2. **Batedor sempre.** É assim em todo vídeo e em toda pipeline: o batedor prova o elemento novo em stills antes da produção. Com stack pronta, faça um batedor curto só do que é novo.
3. **Referência lado a lado.** Ao imitar um canal de referência (por exemplo Elapsed, Reconstructed), compare sempre quadro a quadro com a referência antes de mostrar ao Eduardo.
4. **Doc antes de iterar.** Diante de um erro opaco de ferramenta externa, leia a doc, o FAQ ou o fórum antes da segunda tentativa.

## Operação
- **Repositório público:** nada de chave, token, e-mail, ID de canal ou link de notebook. Credenciais só no `.env` local.
- **Disco:** nada no C: (`TEMP=D:/tmp`).
- **G4 (Colab):**
  - ligue só com job;
  - desligue e confira no fim;
  - nunca desligue com job de outra sessão (`T2_DONO`);
  - a engine Unreal chega à G4 só pela imagem `.sqfs` no Drive.
- **Navegação:** dirija só o navegador de automação; o Chrome pessoal do Eduardo, só pedindo.
- **Publicação:** é manual, do Eduardo. Respostas no YouTube só com o texto aprovado.
- **Áudio:** música só instrumental. No Kriegsmomente, a música fica ~20 dB abaixo da voz e não há ambiente contínuo.

## Delegação e tokens (07/11, ver `docs/BADPATHS-custo.md`)
- **Modelo por nível:**

| Nível | Usar para |
|---|---|
| Haiku | Mecânico e conferível por script (baixar, extrair quadros, transcrever, medir, folha de contato, ffprobe) |
| Sonnet | Execução com contrato (dossiê, varredura de pauta, cenas e código a partir do kit) |
| Opus | Só julgamento (pauta final, roteiro, crítica, veredito) |

- **Agente novo, nunca fork:** cada agente recebe um prompt autocontido e curto (objetivo, arquivos a ler, saída num arquivo e resposta em ≤ 15 linhas). Fork só quando o contexto inteiro for indispensável, e nunca a partir de conversa longa.
- **Uma conversa nova e curta por vídeo ou lote:** mineração, testes e infraestrutura ficam em conversas separadas. Outra sessão recebe o contrato no doc e, por mensagem, só o delta.
- **Avisos:** job longo avisa uma vez, no fim. Aviso sem ação não ganha resposta longa.
- **Imagens:** o agente não lê imagens no contexto. Folhas vão ao Eduardo por SendUserFile; o veredito visual é do fiscal Qwen3-VL na G4 e do Eduardo.
- **G4 sem agente:** o lote roda por script único com retomada (`produzir_lote.py`); o agente só escreve o JSON do lote e lê o relatório.

## Onde está cada coisa
- **Stack do Segundo a Segundo:** `docs/segundo-a-segundo-stack.md`.
- **Tracer3D 2.0:** `tracer3d2/ARQUITETURA.md`, `tracer3d2/BADPATHS.md`, `tracer3d2/ACABAMENTO.md`.
- **Batedor (regra geral):** `docs/BATEDOR.md`. Para three.js, veja também `docs/whatif-es/BATEDOR.md`.
- **Caminhos ruins gerais:** `docs/BADPATHS.md`.
- **Pacotes prontos por canal:** `docs/pacotes-por-canal.md` (consultar antes de qualquer levantamento novo).
