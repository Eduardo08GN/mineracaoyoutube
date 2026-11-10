# creator-generalist e 67.js (CodePawl): referência

Pedido do Eduardo (10/11/2026): guardar no nosso GitHub. Os dois projetos têm **licença MIT** e são do mesmo autor (CodePawl). Ambos são muito novos (2–3 estrelas), então **use só depois de um batedor**.

## 1. creator-generalist: skills de 2D e 3D para agentes
- **Origem:** https://github.com/codepawl/creator-generalist (commit `85bb905`).
- **Cópia:** `ferramentas/skills_terceiros/creator-generalist/`, com o `LICENSE` original. As mídias grandes de exemplo ficaram de fora.
- **Como funciona:** antes de construir, o agente faz poucas perguntas (propósito, plataforma, formato e visual) e mostra uma prévia barata.

| Skill | O que faz | Uso para nós |
|---|---|---|
| `3d-generalist` (`/3dg`) | Shorts e peças 3D em Blender, three.js ou 67.js: corte animado, cena, personagem riggado; assets CC0/CC BY e checagem de qualidade antes da prévia | **Take de mecanismo** (culatra, espoleta, "como funciona por dentro") do Kriegsmomente e dos explicadores ES |
| `2d-generalist` (`/2dg`) | explicador estilo Vox/Johnny Harris: mapas, linha do tempo em escala real, gráficos, colagem de arquivo com textura de papel, tinta e meio-tom | **Mapas creme e esquemas a tinta** do Kriegsmomente. Ver `references/vox-modern-measured.md` e `maps-and-geodata-2d-3d.md` |
| `watch-video` | folhas de quadros, cortes, espectrograma, transcrição e "receita para refazer"; transforma um canal tutorial em skill | comparar com a nossa régua de 24 fps |
| `design-sound` | busca de sons por significado (CLAP); **foley gerado localmente a partir do vídeo mudo** (HunyuanVideo-Foley); mix com volume certo para cada plataforma | **efeitos pontuais** do Kriegsmomente e som dos clipes da G4 |
| `model-characters`, `sculpt-models`, `animate-characters`, `rig-characters`, `draw-and-paint-art`, `paint-stylized-backgrounds`, `use-3d-software`, `edit-video` | guias de ofício: Blender 5.x, Krita, Grease Pencil, Resolve, FFmpeg e exportação GLB/FBX | consulta |

## 2. 67.js: motor 3D dirigido por agente
- **Origem:** https://github.com/codepawl/67.js (commit `76510af`), pacote npm `@codepawlhq/67js`. **Não copiamos o código**, porque é um pacote; basta instalar quando for usar.
- **Como é:** um renderizador WebGL2 em que a cena é **dado puro** (geometria, matriz e material). O agente monta e muda a cena por um **servidor MCP** (`npx 67js-mcp`), confere por prévias PNG e renderiza stills ou MP4.
- **Módulos:** terreno, vegetação, personagens, líquido, veículos e exportação de mídia.
- **Proposta do autor:** "a capacidade do Blender com a leveza do three.js". Vitrine: https://67js.codepawl.com/showcase.html; guia para agentes: https://67js.codepawl.com/llms.txt.
- **Risco:** 2 estrelas e 14 problemas abertos. O nosso kit Remotion + three.js já está provado.

## Regra de uso
1. **Batedor curto antes de qualquer vídeo** (portões 1 e 2 do `CLAUDE.md`): corte 3D de mecanismo, mapa estilo Vox e foley local, comparados com o que já temos. Só entra no kit o que superar.
2. **Não trocar a stack congelada** de um vídeo em produção (ex.: K21).
3. **Instalar como skill do agente:** copie a pasta da skill para a pasta de skills (ex.: `~/.claude/skills/`) ou use o marketplace do próprio repositório.
