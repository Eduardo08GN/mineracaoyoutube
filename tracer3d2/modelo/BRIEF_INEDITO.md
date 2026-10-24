# Brief dos agentes de cena inédita (V3, Tracer3D 2.0, canal Kriegsmomente)

Você escreve em código as poucas cenas que o kit não cobre. Projeto: `<projetos>/tracer3d_03_v3\v1` (Remotion 4 + R3F/three 0.180 + drei/postprocessing; `@dgreenheck/three-pinata` para fratura).

## Contrato
- Seu arquivo é **só** `src/beats/<tema>.tsx`, que exporta o mapa `<TEMA>: BeatMap = {'<id>': Componente}`, já registrado em `beats/index.ts`. Componentes auxiliares vão em `src/welt/v3_<tema>_*.tsx`, arquivos novos. **Não edite** kit, `cenas/*.json`, `Video.tsx` nem os módulos antigos; importe deles.
- `BeatProps = {t, d, s, id, kap}`: `t` é o tempo local em segundos e `d` a duração. A cena desenha a tela inteira. **Função pura de t**: sem estado, sem relógio, sem `Math.random` sem semente.
- Âncoras na fala: `wortLokal({s, kap}, 'Palavra', nach)` (em `src/tempo.ts`) dá o segundo local em que a palavra é falada. Faça as ações acontecerem nas palavras certas.
- Cada batida tem a descrição completa no campo `bild` de `src/plano.json` (e no `roteiro/batidas_<cap>.json`). Siga essa descrição; o texto falado está em `roteiro/skript_de.json`.

## Qualidade (o vídeo vive destas cenas 3D)
- Visual no nível dos vídeos entregues. Reaproveite o que já existe:
  - `src/look/Look.tsx`: pós-processamento, perfis de luz e atmosfera;
  - `src/welt/f_fort.tsx`, `f_schnitt.tsx` e `f_beton.tsx`: corte de fortificação, concreto e fratura no vídeo 2, ótimos modelos para o corte do bunker;
  - `src/welt/t_vfx.tsx` e `p_effekte.tsx`: explosões, fumaça e flipbooks;
  - `src/welt/m_*.tsx`: modelos procedurais de armas e transporte, como exemplo de modelagem;
  - `src/ui/basis.tsx` (cores `C`, fontes `F`, `Etikett`, `Hud`, `Chip`) para rótulos.
- **Ação em cena**: nada parado mais de 4 s. A câmera se move, e as coisas acontecem nas palavras.
- Escala e números certos: use `fakten.md`, `fisica/zahlen.json` e `fisica/bahn.json` (as séries `rohr_*` têm a pressão e a velocidade ao longo do tubo). O que for esquemático ou aproximado leva um rótulo discreto ("schematisch" / "ca.").
- A mesma geometria repetida em várias batidas (o tubo, o corte do bunker) é **um componente parametrizado**, usado com câmeras e estados diferentes por batida.
- Rótulos em alemão. Sem marca SIMULATION: a `@Kriegsmomente` já vem do sequenciador.
- Modelos 3D externos só se forem CC0. Registre a origem num comentário. Prefira geometria procedural.

## Verificação (obrigatória)
- Stills **só na G4**: `python <raiz>/canal.py stills <projetos>/tracer3d_03_v3/v1 <pasta> <seg...>` (segundos absolutos, de `plano.json`: `beats[].s` e `e`). Cada still leva ~1 s, aceita até 16 por chamada, e o rebundle leva 3 s. Se a G4 tiver caído, o comando religa sozinho. Espere; não renderize localmente.
- Confira pelo menos 2 instantes por batida (meio e perto do fim), em **folhas de contato reduzidas** (480 px por quadro).
- `cd <projetos>/tracer3d_03_v3/v1 && npx tsc --noEmit -p . 2>&1 | grep "src/beats/<tema>\|src/welt/v3_"` tem que sair limpo.

## Entrega (curta)
As batidas feitas, o caminho da folha de contato final e o que ficou aquém, se houver.
