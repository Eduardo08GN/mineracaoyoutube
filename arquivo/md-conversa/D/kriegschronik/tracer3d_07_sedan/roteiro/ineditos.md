# Cenas inéditas do vídeo 7 (Sedan): o que o kit não cobre

Use **só estes 3 temas** como `dono` (agrupados para 3 agentes). Antes de marcar inédito, veja se o kit resolve
(`Karte` com `sedan_maas`, `Flug` sobre o pacote `sedan_maas`, `Modell` com `KruppC64`/`LaHitte`, `Foto`, `Balken`, `Zeitleiste`...).
Receitas, provas e decisão do maestro: `BATEDOR_sedan.md`. Acabamento obrigatório: `D:\tracer3d2\ACABAMENTO.md` (`leve` em todo 3D, `medio` nas externas, `heroi` em ≤ 6 batidas no vídeo inteiro).

| `dono` | O que entra | Notas |
|---|---|---|
| `INEDITO_kessel` | O **anel do Kessel** contraindo sobre o relevo real do meandro (contornos de `geo/bewegungen_sedan.geojson`), setas de marcha com volume e sombra (Rechtsschwenk, XI./V. Korps por Donchery→Saint-Menges→Illy, Maasarmee pelo vale da Givonne), o **bloco do terreno em corte** (1–2 batidas), **pontes de pontões à noite** sobre o Maas, névoa matinal sobre o rio | Vista aérea/média. Nada de figura em close |
| `INEDITO_feuer` | **Massa de artilharia** nas cristas (Frénois, Illy, Givonne) com clarão curto e fumaça rolando; **cavalaria em carga** em Floing (média/longa distância, poeira); **Bazeilles em chamas** visto de cima ao amanhecer; **chuva e lama** do Lager des Elends na península de Iges; a **bandeira branca** sobre Sedan | `heroi` só aqui, no máximo ~6 batidas |
| `INEDITO_epoca` | **Pinturas e gravuras em 2.5D com paralaxe** (Depth Anything V2 Small), câmera lenta, fumaça/poeira por cima, rótulo "ZEITGENÖSSISCHE DARSTELLUNG · Maler, Jahr" (ou "ORIGINALFOTO 1870"). Também os **retratos** dos comandantes com leve paralaxe | Escreva no `bild` o **arquivo** de `geo/fotos/fotos.json` (nº ou nome), o enquadramento (início → fim) e o rótulo |

Família "época" (meta ≥ 20%): `INEDITO_epoca` e `Foto` do kit. Família "3D" (meta ≥ 25%): `welt`, `INEDITO_kessel`, `INEDITO_feuer`. Mapa (≤ 35%): `karten`.
Close de combate (Bazeilles, cargas, rendição) = **sempre pintura 2.5D**, nunca boneco 3D.
