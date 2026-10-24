# Brief do planejador de batidas (Tracer3D 2.0, vídeo V3, canal Kriegsmomente)

Você transforma a narração em **batidas visuais**. Onde o kit cobre a cena, ela é escrita direto em **JSON**, sem código. Projeto: `<projetos>/tracer3d_03_v3`.

## Leia (só isto)
- `roteiro/skript_de.json`: o texto de cada capítulo.
- `roteiro/fakten.md`, `fisica/zahlen.json` e `fisica/formeln.md`: números e fórmulas. Use só números que estão ali. `fisica/bahn.json` tem as séries das trajetórias.
- `v1/src/kit/API.md` e as três APIs de família: `ui/API.md`, `karten/API.md` e `welt/API.md`.
- Dados do vídeo:
  - `geo/CREDITOS.md`;
  - `geo/manifest_v3.json`;
  - `v1/public/geo/` (`orte_v3.geojson`, `achsen_v3.geojson`, etc.);
  - `v1/src/cenas/pacotes.json`: os pacotes de terreno `canal`, `mimoyecques`, `mimoyecques_umland` e `luxemburgo`, que se usam por nome no `Flug`;
  - `v1/public/karten2/raster.json`;
  - `geo/fotos/fotos_v3.json`: só as fotos liberadas; nunca use `_nur_referenz`.
- Exemplos reais validados (formato de props): `<raiz>/modelo\v1\src\cenas\{ui,karten,welt}.json`, que reproduzem o vídeo da Bertha, e `dados/cenas_validacao_*.json` deste vídeo.
- `roteiro/ineditos.md`: o que o kit não cobre.

## Formato de saída: `roteiro/batidas_<capitulo>.json`, um arquivo por capítulo
```json
{"kapitel": {"04_mathematik_1": [
  {"wort": "Die", "nr": 1, "dono": "ui", "bild": "uma linha: o que se vê", "cena": {"comp": "Titel", "props": {...}}},
  {"wort": "Gasdruck", "nr": 1, "dono": "INEDITO_rohr", "bild": "descrição completa para o agente de código"}
]}}
```
- **`wort` + `nr`**: a batida começa na `nr`-ésima ocorrência **exata** do token, separado por espaço, **com a pontuação** (por exemplo `"London."` ≠ `"London"`). A primeira batida do capítulo usa o primeiro token. Tokens repetidos: conte `nr` direito.
- **`dono`**:
  - `ui`, `karten` ou `welt` quando há `cena` do kit;
  - `INEDITO_<tema>` quando precisa de código novo. Use poucos temas, agrupados: `INEDITO_rohr` (tubo com câmaras, projétil, ignição sequencial, blow-by), `INEDITO_bunker` (corte de Mimoyecques, Tallboy no calcário), `INEDITO_flugzeug` (Lancaster, Mustang, Liberator).
  - Antes de marcar inédito, veja se o kit resolve. Por exemplo, a curva de pressão é `Kurve` e a comparação de cargas é `Balken`.
- **`cena.props`**: tempos internos ancorados na fala com `{"wort": "...", "nach": 0}` (o kit acha a primeira ocorrência normalizada depois do início da batida mais `nach`).
- Se usar `_vorlagen`, escreva-as em `roteiro/vorlagen_<familia>_<A|B>.json` como `{"_vorlagen": {...}}`, com nomes prefixados pela sua letra (A ou B). O `plano.py` junta tudo.

## Regras de qualidade
- **Batidas de 1,5 a 12 s**, média de ~5 s. São ~190 a 210 no vídeo inteiro, então ~100 para cada planejador.
- **Ação em cena**: nada parado mais de 4 s. Elementos entram com as palavras, a câmera deriva, os números contam.
- **Variedade**: alterne famílias. Mapa e 3D carregam a geografia e a física; cartões só onde o número ou a fórmula é a estrela.
- **Sem marca "SIMULATION"**: o `@Kriegsmomente` já está no sequenciador. A linha de fonte (`Quelle`) vem dos créditos em `geo/CREDITOS.md`.
- **Fotos de arquivo**: só as liberadas em `fotos_v3.json`, com crédito.
- **Fiel aos fatos**: nada de rótulo ou número que não esteja em `fakten.md` ou `zahlen.json`. Coordenadas sem documentação são marcadas como aproximadas (`ca.`).

## Verificação (obrigatória)
1. `python ferramentas/plano.py`: tem que rodar sem ERROS. Ele usa um alinhamento provisório, então os tempos ainda vão mudar, mas as âncoras valem.
2. Stills na G4 para conferir as cenas do kit: `python <raiz>/canal.py stills <projetos>/tracer3d_03_v3/v1 <pasta> <seg...>`, pegando os segundos em `v1/src/plano.json`. Um still por batida do kit, no meio da batida, até 16 por chamada. Confira em **folhas de contato reduzidas** (480 px por quadro). Corrija o que estiver vazio, cortado, sobreposto ou feio.
3. As batidas `INEDITO_*` aparecem como cartão provisório; isso é esperado.

## Entrega (curta)
Contagem de batidas por dono, a lista das batidas `INEDITO_*` (id e uma linha cada), o caminho das folhas de contato e problemas do kit encontrados.
