# Tempe × Polyfork: referência congelada (08/11/2026)

**Status:** a produção dos reels do FB foi ENCERRADA pelo Eduardo em 08/11. O custo de tokens e de tempo ficou alto demais para uma página ainda não monetizada. Esta pasta é só referência e não deve ser continuada sem uma decisão nova.

- **Estilo aprovado pelo revisor:** prova de direção com A 8, B 7 e C 8, nos `stills/` (`folha_batedor.jpg` traz os nossos stills em cima e o No Sleep embaixo).
- **Bíblia do formato:** `docs/canais/fb_que_pasaria_si/reels_noticia.md`. A imagem da stack está descrita em `docs/g4-imagem-stack.md`.
- **Código:** `cena/`, com Remotion 4 + R3F 9 + three 0.180 no modo barato.
  - Os três `.mjs` do Polyfork (`src/pf/`: hiker, lakeside-swing-tree e canvas-ridge-tent) **não estão aqui**, porque a licença não permite redistribuir.
  - Para rodar, baixe-os de novo com a chave grátis do Polyfork, que fica no `.env` local.
  - Os GLB vêm do CDN público (lista em `public/polyfork/CREDITOS.md`, no projeto original).
- **Contexto e diagnóstico:** `CONTRATO.md` (direção), `RELATORIO_R13.md` (rodadas, diagnóstico do path tracer, receitas de água e chuva) e `LEVANTAMENTO_ACABAMENTO.md` (pacotes three.js avaliados).
- **Original completo:** fora do repositório, em `D:/producao/fb_que_pasaria_si/formatos/reels_noticia/tempe_polyfork/`.
- **Estimativa para retomar mais barato:** transformar esta cena num molde parametrizado por JSON, uma vez só (~0,2–0,3 mi de tokens). Daí em diante, cada lote de 4 reels do mesmo mundo fica em ~0,2 mi.
