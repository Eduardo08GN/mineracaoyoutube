# Arquitetura por tenants: canal → formato

**Regra do Eduardo (08/11/2026):** produzimos formatos diferentes para canais diferentes. Nada fica "junto e misturado". O maestro aprovou a regra no mesmo dia.

## Princípio
- **Motor único e neutro.** Controle da G4, render, voz, régua a 24 fps e fiscal. Não leva nada específico de canal.
- **Cada formato de cada canal tem o que é seu:**
  - stack própria (`package.json`/lock);
  - bíblia de estilo (`BIBLIA_ESTILO.md`);
  - assets e licenças;
  - projetos de vídeo;
  - imagem da stack na G4 (ver [g4-imagem-stack.md](g4-imagem-stack.md)).
- **Peças comuns** (Look, base de HUD, carregador de assets) ficam em `_biblioteca/` e entram no formato por cópia ou dependência. O formato nunca edita a biblioteca no meio de um vídeo.

## Estrutura (D:)
```
D:/producao/
  _motor/              -> D:/tracer3d2              (junção)
  _biblioteca/         peças comuns
  _imagens_g4/         -> D:/t2_stacks              (junção; imagens .sqfs baixadas da G4-2)
  kriegsmomente/       formatos/doc_longo/          -> D:/kriegschronik
  segundo_a_segundo/   formatos/whatif_narrado/     -> D:/whatif_es
  chroniques/          formatos/                    (a mapear)
  fb_que_pasaria_si/   formatos/reels_noticia/      -> D:/pesquisa_nichos/acidentes_fb
```

No repositório, os pipelines antigos seguem com nome de ferramenta (`tracer3d2/`, `eddie3d/`, `spanish3d/`). A documentação de cada formato fica em `docs/canais/<canal>/<formato>.md`.

## Migração (combinada com o maestro)
1. **Hoje, só junções.** Nenhuma pasta foi movida. `D:/producao/...` aponta para os caminhos atuais, e as sessões em andamento continuam funcionando.
2. **A mudança física acontece num vídeo novo,** nunca no meio de um (regra de não retroagir). Um projeto novo já nasce em `D:/producao/<canal>/formatos/<formato>/`.
3. **A reorganização roda entre jobs** e não atrasa nenhum lote.

## Ao abrir um formato novo
1. Crie `D:/producao/<canal>/formatos/<formato>/` com `stack.json` (`{"canal": "...", "formato": "..."}`), `package.json` e `BIBLIA_ESTILO.md`.
2. Faça o levantamento de prontos (`docs/BATEDOR.md`, passo 0), começando por kits harmonizados (ver [pacotes-por-canal.md](pacotes-por-canal.md)).
3. No primeiro job na G4, a imagem da stack é gerada automaticamente.
4. Rode um batedor de stills, comparando lado a lado com a referência, e tenha o revisor independente aprovando antes de mostrar ao Eduardo.
