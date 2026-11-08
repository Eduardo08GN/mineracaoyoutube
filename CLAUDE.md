# Regras fixas deste repositório (lidas em toda sessão)

Produção de vídeos para os canais do Eduardo: Kriegsmomente (DE), Segundo a Segundo (ES), Chroniques (FR) e outros. Pipelines: `tracer3d2/`, `eddie3d/`, `spanish3d/`, unreal3d (em `D:\unreal3d`) e `motor/`.

## Princípio (Eduardo, 03/11)
O produto é a **compreensão do espectador**, não a imagem bonita. A ordem de investimento é:
1. roteiro agregador;
2. desenho da informação (o dado dentro do take);
3. animação que demonstra;
4. acabamento, só até onde ajuda a entender.

Critério: "ajuda a entender?", nunca "parece real?". Cada take de mecanismo cruza ≥ 3 dimensões (dado, conceito, ilustração, espaço, tempo, narrativa). Detalhe em `D:/pesquisa_nichos/PRINCIPIO_PRODUCAO.md`.

## Portões (nunca pular)
1. **Pronto antes de construir: nunca reinventar a roda.** Antes de escrever qualquer shader, material, cena, nuvem, céu, mapa, seta, cidade, pós-processo, componente de UI ou ferramenta, rode o **levantamento de prontos** de `docs/BATEDOR.md`, passo 0. Ele tem três frentes, todas obrigatórias:
   - **Assets:** Fab, Sketchfab, CC0, VDBs.
   - **Código:** `gh search repos` com muitas variações de termo, npm/PyPI, grep.app, listas "awesome", extensões do Blender.
   - **Método:** tutoriais e making-ofs pela YouTube API, lendo as legendas, mais os créditos na descrição dos concorrentes. As ferramentas estão em `ferramentas/levantamento/`.

   Comece por `docs/pacotes-por-canal.md`. **O batedor prova peças prontas.** Construir à mão só o que o levantamento provar que não existe, registrando o porquê. (Caminho ruim repetido 4×, o último em 03/11: ver `docs/BADPATHS.md` #1.)
2. **Batedor sempre.** É assim em todo vídeo e em toda pipeline: o batedor prova o elemento novo em stills antes da produção. Com stack pronta, faça um batedor curto só do que é novo. A meta é **superar** a referência, não copiá-la.
3. **Referência lado a lado.** Ao imitar um canal de referência (por exemplo Elapsed, Reconstructed), compare sempre quadro a quadro com a referência antes de mostrar ao Eduardo.
4. **Doc antes de iterar.** Diante de um erro opaco de ferramenta externa, leia a doc, o FAQ ou o fórum antes da segunda tentativa.

## Operação
- **Repositório público:** nada de chave, token, e-mail, ID de canal ou link de notebook. Credenciais só no `.env` local.
- **Disco:** nada no C: (`TEMP=D:/tmp`).
- **G4 (Colab):**
  - **é o diferencial, e a stack é desenhada em volta dela.** O 3D-herói vai para o Blender Cycles na GPU, com recursos nativos e VDBs prontos. Upscale, interpolação e variações rodam por IA na G4. O Remotion fica com HUD, mapas e montagem. Não usar a G4 como um Chrome caro rodando WebGL. Antes de cada vídeo, tabela do que vai para a GPU;
  - ligue só com job;
  - desligue e confira no fim;
  - nunca desligue com job de outra sessão (`T2_DONO`);
  - a engine Unreal chega à G4 só pela imagem `.sqfs` no Drive.
- **Navegação:** dirija só o navegador de automação; o Chrome pessoal do Eduardo, só pedindo.
- **Publicação:** é manual, do Eduardo. Respostas no YouTube só com o texto aprovado.
- **Takes de animação:** nunca reaproveitar o mesmo take dentro do vídeo. Outro trecho, outra velocidade ou espelho do mesmo clipe também contam como reaproveitamento. Cada batida 3D tem um take renderizado próprio (regra de 03/11, vale a partir do vídeo seguinte à parte 2 do Learjet).
- **Áudio:** música só instrumental. No Kriegsmomente, **sem música** desde 03/11 (só voz e efeitos pontuais; comentários reclamaram) e sem ambiente contínuo.

## Design system do Kriegsmomente (canal alemão), decisão do Eduardo de 04/11
- **Tema CREME** (fundo de papel antigo), nunca o escuro.
- **A escrita do take do telégrafo do K15:** serifa itálica de época escrita na tela, linha-guia com ponto, gráficos a tinta.
- Vale para mapa, modelos e textos. Pipeline completa: `docs/PIPELINE.md` (branch `producao/stack-3d-baseline`). Leia antes de produzir.

## Onde está cada coisa
- **Stack do Segundo a Segundo:** `docs/segundo-a-segundo-stack.md`.
- **Tracer3D 2.0:** `tracer3d2/ARQUITETURA.md`, `tracer3d2/BADPATHS.md`, `tracer3d2/ACABAMENTO.md`.
- **Batedor (regra geral):** `docs/BATEDOR.md`. Para three.js, veja também `docs/whatif-es/BATEDOR.md`.
- **Caminhos ruins gerais:** `docs/BADPATHS.md`.
- **Pacotes prontos por canal:** `docs/pacotes-por-canal.md` (consultar antes de qualquer levantamento novo).
