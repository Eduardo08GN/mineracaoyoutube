# Brief do planejador de batidas — vídeo 9 Kriegsmomente: Königgrätz, 3. Juli 1866 (Tracer3D 2.0)

Você transforma a narração em **batidas visuais**. Projeto: `D:\kriegschronik\tracer3d_09_koeniggraetz`. Formato idêntico ao vídeo 8 (`D:\kriegschronik\tracer3d_08_gewehr\roteiro\BRIEF_PLANEJADOR.md` — leia as seções "Formato de saída", "Regras de qualidade" e "Mistura de famílias" de lá; valem aqui). Gerador de referência do vídeo 8: `D:\kriegschronik\tracer3d_08_gewehr\roteiro\gerar_A.py` / `gerar_B.py` (já copiados para cá como ponto de partida — reescreva para o vídeo 9).

## Leia
- `roteiro/skript_de.json` e `roteiro/fakten.md` (use só números/rótulos de lá; "ca." onde for aproximado; respeite as escolhas "para o áudio" e as citações NÃO confirmadas).
- `v1/src/kit/API.md` + `kit/ui/API.md`, `kit/karten/API.md`, `kit/welt/API.md`, `kit/epoca/API.md` (cena `Gemaelde`).
- **Novos do vídeo 9:** `v1/src/welt/K9_API.md` — `Armeen` (três armadas convergindo com relógio), `Stoss` (coluna austríaca à baioneta contra a linha prussiana no Swiepwald, com contador de baixas), `Batterie` (grande bateria Lipa–Chlum, `weit`/`kamm`/`nah`), `Uniformen`; pacote de terreno `koeniggraetz` em `v1/src/cenas/pacotes.json`; `v1/public/geo/orte_koeniggraetz.geojson`. Folha do batedor: `render/FOLHA_batedor_1866.jpg` (o `Batterie weit` é fraco: prefira `kamm` e `nah`).
- Imagens de época: `v1/public/geo/fotos/fotos.json` (Commons PD/CC0; ainda chegando algumas) — pinturas de Bleibtreu, Sell, Hünten, Sochor ("Batterie der Toten", Stresetitz), Bensa, Ottenfeld (artilharia na retirada), Heyden (marcha da II. Armee), Swiepwald (IR 27), planos de 1866, Benedek, Moltke. Profundidade 2.5D (`Gemaelde`) será gerada para TODAS pelo maestro; planeje com qualquer uma de `fotos.json` (rótulo = `rotulo_vorschlag`).

## Cenas inéditas (componentes k9 prontos)
Batidas com os componentes `Armeen`/`Stoss`/`Batterie`/`Uniformen` usam `"dono": "INEDITO_k9"` (sem `cena`) e você mesmo escreve o componente da batida no seu arquivo `v1/src/beats/k9_<A|B>.tsx` (`export const K9_<A|B>: BeatMap = {"05_03": (b) => <Armeen t={b.t} d={b.d} zeit={...} kamera="uebersicht" />, ...}`), no estilo de `D:\kriegschronik\tracer3d_08_gewehr\v1\src\beats\waffen.tsx` (use `wortLokal` para ancorar ações na fala). O `index.ts` já junta `K9_A` e `K9_B`. Rode `npx tsc --noEmit` (só erros novos importam; `basis_52` é antigo).

## Rodapé de números (campo `stand`) — OBRIGATÓRIO
`src/zaehler.tsx` (chaves): `kraefte`, `morgen`, `elf`, `swiep`, `kronprinz`, `verluste`, `gefangene`. Sugestão: cap. 01 escondido; 02 `morgen` em "Den ganzen Vormittag", `elf` em "Um elf Uhr"; 03 `morgen`; 04 `null`; 05 `kraefte`; 06 `null`; 07 `morgen`, `elf` em "Um elf Uhr"; 08 `swiep` em "Um elf Uhr"; 09 `morgen`; 10 `kronprinz`; 11 `kronprinz`; 12 `null`; 13 `verluste`, `gefangene` em "Mehr als die Hälfte"; 14 `null`. `"zaehler": false` em batidas com cartão grande embaixo.
Relógio do dia: use o `Uhr` do kit/ui ou o relógio do `Armeen` nas batidas da linha do tempo (7:30, 8:00, 10:00, 11:00, 11:15, 12:00, 13:30, 13:45, 14:30, 14:45, 15:30, 16:00, 23:00).

## Direção visual
- Mistura (linha MISTURA do `plano.py`): mapa ≤ 35 %, 3D ≥ 25 %, época ≥ 20 %, no máximo 3 seguidas da mesma família; DINAMISMO: cartões `ui` ≤ 40 %, ≤ 2 seguidos.
- Combate humano em plano aberto = `Gemaelde` (lição do vídeo 8), não 3D. 3D carrega geografia (Armeen, Flug sobre `koeniggraetz`), o Swiepwald (`Stoss`) e a artilharia (`Batterie kamm/nah`).
- O cap. 01 (Chlum, 14:45) e o 11 (Chlum fällt) devem rimar: mesmo enquadramento do campanário de Chlum (Flug/terreno + `Gemaelde` de Sochor para a "Batterie der Toten").
- Take inédito (cap. 13): contador grande "22.170 Gefangene · 12.879 unverwundet", depois "5 : 1 → 2,6 : 1" (cálculo, dizer "etwa zweieinhalb"), e a citação "verderblicher als die Schlacht" (Österreichisches Generalstabswerk 1868) em `Zitat`.
- Sem marca SIMULATION; créditos nunca na imagem; `@Kriegsmomente` já está no sequenciador.

## Verificação
1. `python ferramentas/plano.py` sem ERROS (o alinhamento real chega em breve em `voz/alinhamento.json`; antes disso rode `python ferramentas/alinhamento_provisorio.py`).
2. Stills na G4: `python D:/tracer3d2/canal.py stills D:/kriegschronik/tracer3d_09_koeniggraetz/v1 <pasta> <seg...>` (até 16 por chamada) — **só se `python D:/tracer3d2/canal.py saude` responder com a G4 no ar**; nunca `garantir`/`ligar`/`desligar`. Folhas de contato a 480 px em `render/FOLHA_<A|B>_*.jpg`. Corrija vazio, cortado, sobreposto, feio. Para os INEDITO_k9, 3 stills (início/meio/fim).
3. Tudo no D: (`TEMP=D:/tmp`); mate só processos seus (PID).

## Entrega (curta)
Contagem por família, MISTURA/DINAMISMO, folhas, o que está fraco.
