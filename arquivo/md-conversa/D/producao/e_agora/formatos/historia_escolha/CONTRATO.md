# Contrato do formato "história de escolha" (canal E Agora?)

Um vídeo = uma pasta (`reel_NN/`) servida ao Remotion como `--public-dir`. O kit (`kit/`) é neutro: lê `video.json` + `tempos.json` e monta tudo. Nada de texto dentro das imagens geradas; todo texto é do kit.

- Quadro: **1080×1920, 30 fps**. Composição `Video` (inteiro) e `Still` (1 quadro, prop `t` em segundos).
- Dados lidos por `fetch(staticFile(...))` em `calculateMetadata` (molde: `limpeza_avatar/remotion/src/Root.tsx`).
- Dependências: **só** as do `package.json` (remotion 4.0.537, react 19.2.0). Nada de pacote novo (a imagem `.sqfs` é por hash). Fontes locais em `kit/src/fontes/` (`.ttf`, licença OFL), carregadas por `FontFace` + `delayRender`.

## Pasta do vídeo
```
reel_01/
  video.json     planos (abaixo)
  tempos.json    {"palavras":[...], "inicios":[s...], "dur": s}   (sai da narração; 1 entrada por palavra da fala inteira)
  audio/final.wav  voz + efeitos já mixados (o kit só toca este arquivo; se prop audio=false, não toca)
  img/NN.png     still da cena (928×1664); NNb.png = variante (pose/estado B); ic_*.png = ícones 512×512
  pos.json       opcional {"NN": {"chave": [x, y]}} em fração 0–1 do quadro (vem do localizador da G4); sobrepõe x,y do video.json
```

## video.json
```jsonc
{
  "id": "reel_01", "fps": 30,
  "placar": {"agua": ["SOLA","MEIA RODA","PORTA","JANELA"], "risco": ["BAIXO","ALTO","CRÍTICO"]},
  "planos": [ { ...plano }, ... ]
}
```
A fala inteira é a concatenação de `plano.fala` na ordem. O plano começa no início da sua 1ª palavra e termina no início da 1ª palavra do plano seguinte (o último vai até `dur` + 0,6 s). `na_palavra` = palavra **dentro da fala do plano** (comparação sem acento, caixa nem pontuação; 1ª ocorrência; `"x#2"` = 2ª ocorrência). Sem `na_palavra` = início do plano.

### Plano tipo `cena`
```jsonc
{"n":"07","tipo":"cena","fala":"Na metade da roda, ela já consegue levar um carro inteiro.",
 "img":"img/07.png",
 "img_b":"img/07b.png", "troca":{"na_palavra":"levar","modo":"corte|fusao|raiox","x":0.5,"y":0.6,"raio":0.32},   // opcional
 "mov":{"tipo":"zoom_in|zoom_out|drift_e|drift_d|sobe|desce|parado","forca":1.0,"foco":[0.5,0.55]},
 "fx":[ {"tipo":"chuva","forca":1.0},
        {"tipo":"agua","de":0.80,"ate":0.62,"na_palavra":"metade","dur":1.6},     // linha d'água: y em fração (0=topo); sobe de→ate
        {"tipo":"setas","x":0.18,"y":0.5,"dir":"dir","n":4,"na_palavra":"empurra"},
        {"tipo":"trinca","x":0.7,"y":0.4,"na_palavra":"Bate"},
        {"tipo":"pisca","na_palavra":"morre"},                                     // luz falha e apaga (escurece o quadro em pulsos)
        {"tipo":"sirene"},                                                         // pulso vermelho/azul suave na borda
        {"tipo":"limpador"},                                                       // palheta varrendo por cima (para-brisa)
        {"tipo":"tremor","na_palavra":"morre","dur":0.5},
        {"tipo":"desliza","dx":0.06,"na_palavra":"levar","dur":1.8} ],            // empurra a imagem de lado (carro sendo levado)
 "dados":[ {"tipo":"etiqueta","texto":"MEIA RODA","x":0.62,"y":0.58,"na_palavra":"metade","chave":"roda"},
           {"tipo":"carimbo","texto":"MOTOR MORTO","na_palavra":"morre","cor":"perigo"},
           {"tipo":"anel","x":0.7,"y":0.4,"na_palavra":"canto","chave":"canto"} ],
 "placar":{"agua":1,"risco":1,"mostra":true}   // índice novo (anima a troca); vale daqui em diante. "mostra":false esconde
}
```

### Plano tipo `cartao` (fundo = `img` do plano de cena anterior, desfocada e escurecida, com zoom lento)
```jsonc
{"n":"04","tipo":"cartao","fala":"E agora: atravessa, ou dá a volta?",
 "cartao":{"tipo":"escolha","titulo":"E AGORA?","a":"ATRAVESSA","b":"DÁ A VOLTA","na_palavra_a":"atravessa","na_palavra_b":"volta","certa":"b"}}
// certa: opcional; se vier, a opção certa acende no fim do plano e a outra apaga
{"tipo":"barras","titulo":"...","itens":[{"rotulo":"PARADA","valor":0.25},{"rotulo":"CORRENDO","valor":1,"cor":"perigo","na_palavra":"correndo"}]}
{"tipo":"contador","de":60,"ate":0,"rotulo":"SEGUNDOS PRA SAIR","na_palavra":"segundo"}
{"tipo":"grade","itens":[{"img":"img/ic_cinto.png","rotulo":"SOLTA O CINTO","na_palavra":"cinto"},{"img":"...","rotulo":"...","riscado":true,"na_palavra":"bolsa"}]}
{"tipo":"frase","linhas":["Carro se recupera.","Você não."],"destaque":"Você não.","na_palavra":"Você"}
{"tipo":"notificacao","texto":"MANUAL","usuario":"você","rotulo":"Comenta","na_palavra":"Comenta"}
```
Barras: `valor` 0–1, **sem número na tela** (só rótulo). Cresce com mola.

## Sempre na tela
- **Placar** no topo (zona segura: 150–330 px do topo): ÁGUA (ícone de carrinho com nível), TEMPO (cronômetro mm:ss que corre desde o 1º `mostra`), RISCO (barra de 3 passos). Troca de valor = pulso + cor.
- **Legenda karaokê** (centro em ~72% da altura): grupos de 2–4 palavras tirados de `tempos.json`; quebra em pontuação; palavra falada agora em amarelo com leve escala; contorno escuro grosso. Nunca cobre o placar. Zona morta do Instagram: nada importante abaixo de 82% nem nos 120 px da direita na metade de baixo.
- **Transições:** corte seco entre planos, com "soco" de escala de 3 quadros (1,04→1) na entrada. Cartão entra com mola.

## Tema (`kit/src/tema.ts`, um por canal)
Cores: `noite #0E2A33`, `noite2 #143A45`, `agua #7A5A3A` (barrenta, translúcida no fx), `foco #FFD21F` (amarelo da capa), `perigo #E5352B`, `ok #35C46A`, `papel #F4EFE3`, `tinta #0B1418`. Fonte de título condensada pesada (Anton ou Barlow Condensed) e texto (Inter ou similar), OFL.

## Metas que o kit mede (`medir.ts`, imprime no console do render e grava `metas.json` via script node `medir.mjs`)
≥ 14 cortes/min; plano mediano ≤ 3,5 s; nenhum plano de cena > 4 s sem dado/fx/troca novo; cartões ≤ 45% do tempo; nenhuma `img` repetida.
