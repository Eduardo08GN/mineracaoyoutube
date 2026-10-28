# Família `epoca` do kit: `Gemaelde` (pintura / gravura / foto de época em 2.5D)

Equivalente do "REAL FOOTAGE" do Tracer Project. Conta como **época** no MISTURA do `plano.py` (≥ 20 % do vídeo).
Escreva a batida com `"dono": "epoca"` e `"cena": {...}` (vai para `src/cenas/epoca.json`). O `plano.py` também conta como época qualquer batida
cuja `cena.comp` seja `Gemaelde`, mesmo com outro `dono`.

```json
{"wort": "Bazeilles", "nr": 1, "dono": "epoca", "bild": "Neuville, Les dernières cartouches, close do combate",
 "cena": {"comp": "Gemaelde", "props": {
   "bild": "neuville_dernieres_cartouches", "ken": "push", "staerke": 0.6, "partikel": "rauch",
   "label": "ZEITGENÖSSISCHE DARSTELLUNG · Alphonse de Neuville, 1873",
   "kopf": {"titel": "Bazeilles", "sub": "Die letzten Patronen", "em": {"wort": "Patronen", "nach": 0}}}}}
```

## Props
| prop | tipo | padrão | o que faz |
|---|---|---|---|
| `bild` | string | obrigatório | nome do arquivo **sem extensão** em `public/geo/fotos/fotos.json` (a chave é o `arquivo` sem `.jpg`). Com `geo/tiefe/<bild>_p_*` = 2.5D com paralaxe; sem = Ken Burns simples (mapas, cartas, documentos) |
| `ken` | `push` \| `pull` \| `pan` | `push` | padrão do movimento. push: zoom 1,00 → 1,12 ao centro; pull: 1,12 → 1,00; pan: x 0,32 → 0,68 com zoom 1,12. Também define o sentido da varredura de paralaxe |
| `von`, `nach` | `{x, y, zoom}` | do `ken` | enquadramento inicial/final. `x`,`y` = centro na imagem (0..1, `y=0` no topo), `zoom` 1 = cover (a cena já tem 5 % de sobrevarredura embutida no modo cover). Campos omitidos vêm do `ken`. O centro é preso para a janela nunca sair da imagem (pan em imagem quase 16:9 anda pouco: use zoom ≥ 1,15) |
| `ab`, `bis`, `dauer` | Zeit, Zeit, s | 0, duração da batida | quando o movimento começa/termina (aceitam âncora `{"wort":...}`); `dauer` = comprimento do movimento em s (sobrepõe `bis`) |
| `staerke` | 0..1 | 0,6 | intensidade da paralaxe (deslocamento em profundidade e varredura da câmera). Acima de ~0,9 aparece o fundo inpintado. Sem profundidade é ignorada |
| `partikel` | `rauch` \| `staub` \| `regen` \| null | null | `rauch`: fumaça (WispySmoke, flipbook CC0) que sobe; `staub`: poeira (Cloud01) que se espalha; `regen`: riscas de chuva inclinadas. Ficam **na frente** da pintura. `partikelEm` (Zeit, padrão 0) = quando começam a entrar; `partikelStaerke` (padrão 1) |
| `label` | string \| `"auto"` \| null | null | rótulo pequeno em antiqua no canto superior esquerdo: `"ZEITGENÖSSISCHE DARSTELLUNG · Maler, Jahr"`, `"ORIGINALFOTO 1870"`, `"KARTE · ..."`. `"auto"` usa o `rotulo_vorschlag` do `fotos.json` (ATENÇÃO: alguns estão errados, ver abaixo). `labelEm` (padrão 0,4 s), `labelAus` (opcional) |
| `kopf` | `{titel, sub?, em?, aus?}` | — | legenda-manchete embaixo à esquerda (antiqua, com degradê escuro); `em` padrão 0,9 s |
| `modus` | `auto` \| `fuellen` \| `karte` | `auto` | `fuellen` = cover (1920×1080 sem barras). `karte` = figura inteira (88 % da altura) com sombra sobre o **fundo desfocado da própria imagem**. `auto` escolhe `karte` quando o cover cortaria mais de 28 % da altura (imagem mais estreita que ~1,28:1: retratos, Detaille) |
| `korn`, `vinheta` | número | 0,045; 0,5 | grão de filme e vinheta da camada `leve` (mesmas fórmulas do `LookAcab`; grão muda a cada quadro, determinístico) |

Tempos aceitam segundos locais ou `{"wort": "...", "nach": 0, "plus": 0}` como o resto do kit.

## Como funciona (para depurar)
- 2 camadas: frente = malha 300×(300·asp) deslocada em z pelo mapa (`_p_d.png`), com `discard` onde o gradiente de profundidade > 0,075; fundo = `_p_bgrgb.jpg`
  (primeiro plano inpintado) com `_p_bgd.png`, a −0,012. Câmera em varredura monótona (−A..+A durante o movimento) mais balanço vertical lento.
- Função pura de `t` (e do quadro, só para o grão). Não use `Math.random`.
- Imagens e mapas vêm de `public/geo/tiefe` e `public/geo/fotos`. **O índice é estático**: `src/kit/epoca/indice.json`. Se mexer em `tiefe/` ou `fotos.json`,
  rode `python ferramentas/epoca_indice.py` e `canal.py sync <v1> public src`.
- Créditos nunca na imagem (só na descrição).

## Limites
- Céu e nuvens de paisagem têm mapa quase plano: a paralaxe vira só empurrão.
- `staerke` > 0,9 mostra o fundo inpintado (borrado). Gravuras P&B de traço fino têm ruído no mapa.
- Imagens da `tiefe/` têm no máximo 1600 px: em cover 1080p ficam levemente macias (aceitável em pintura).
- Dados do `fotos.json` com problema (não usar `label: "auto"` nelas; escreva o rótulo à mão): ver lista na entrega da fase 1.
