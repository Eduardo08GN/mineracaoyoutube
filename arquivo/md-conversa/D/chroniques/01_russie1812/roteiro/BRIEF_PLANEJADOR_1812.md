# Brief do planejador de batidas: vídeo 1 do Chroniques Napoléoniennes Oubliées (Russie 1812, jour par jour, avec les effectifs)

Você transforma a narração em **batidas visuais**. Projeto: `D:\chroniques\01_russie1812`. O pipeline é o Tracer3D 2.0 do Kriegsmomente. O formato é idêntico ao do vídeo 6 (1870/71 jeden Tag): leia `roteiro/BRIEF_PLANEJADOR.md`, que é o brief do vídeo 6, nas seções "Formato de saída", "Dinamismo", "Regras de qualidade" e "Verificação"; elas valem aqui. Os exemplos de gerador estão em `D:\kriegschronik\tracer3d_06_1870\roteiro\gerar_B.py`.

## Leia
- `roteiro/skript_de.json`: o texto FRANCÊS dos 15 capítulos, a fonte das âncoras `wort` e `nr`.
- `roteiro/fakten.md`: use só números e rótulos que estão ali; "ca." no que for aproximado; respeite as marcas [div].
- `v1/src/API_1812.md`: **componentes novos deste vídeo**:
  - `Atlas1812` (câmeras `europe`, `korridor`, `ouest`, `smolensk_moscou`, `berezina`; transição verão→inverno; neve; marcas; escala);
  - `Minard` (homenagem animada ao gráfico de 1869);
  - `ColonneNeige1812`;
  - o contador.

  Mais `v1/src/kit/API.md` e as APIs `ui`, `karten`, `welt` e `epoca` (cena `Gemaelde` para as pinturas em 2.5D).
- Imagens de época: `v1/public/geo/fotos/fotos.json`, com 24 pinturas e gravuras em domínio público (Adam, Vereshchagin, Hess, Faber du Faur, Northen, Minard…); o rótulo é `rotulo_vorschlag`, em francês.
  - Antes de usar uma pintura em `Gemaelde`, confira se existe o mapa de profundidade. Se não houver, use `Gemaelde` sem profundidade ou peça ao maestro.
  - As que têm menos de 1200 px (f12_05, 06, 12, 16, 19, 23) só em plano parcial ou pequeno.

## Divisão
- **Planejador A:** capítulos `01_niemen` a `07_hecatombe` (8 capítulos, incluindo `04b_nations`).
- **Planejador B:** capítulos `08_smolensk` a `14_reponse` (7 capítulos).

Escreva em `roteiro/batidas_<capitulo>.json`. Se precisar de componente React por batida, use `v1/src/beats/fr_<A|B>.tsx`, exportando `FR_A`/`FR_B` (`BeatMap`), no estilo de `D:\kriegschronik\tracer3d_09_koeniggraetz\v1\src\beats\k9_A.tsx`. Junte no `v1/src/beats/index.ts`, removendo o que for do vídeo 1870. Os restos do vídeo 6 em `cenas/*.json`, `beats/` e `plano.json` são lixo: zere o que for 1870.

## Contador e datas (OBRIGATÓRIO)
- O contador (`v1/src/zaehler.tsx`) fica fixo embaixo a partir do capítulo 03.
- Campo `"datum": "1812-06-24"` nas batidas em que a narração muda de dia; a data nunca volta para trás.
- Campo `"lauf": true` para a data correr até a próxima batida datada, nas montagens de marcha e de retirada.
- Use `"zaehler": false` nas batidas com `Minard` em tela cheia ou com cartão grande embaixo.
- Datas-âncora: 24/06 (Niemen), 28/06 (Vilna), 23/07 (Mohilev), 28/07 (Vitebsk), 15–19/08 (Smolensk, Valoutina), 07/09 (Borodino), 14/09 (Moscou), 19/10 (saída), 24/10 (Maloïaroslavets), 3–9/11 (neve, Viazma), 15–18/11 (Krasnoï), 26–29/11 (Bérézina), 05/12 (Napoleão parte), ~14/12 (Niemen).

## Direção visual
- **Mistura** (linha MISTURA do `plano.py`): mapa ≤ 35 %, 3D ≥ 25 %, época ≥ 20 %, no máximo 3 seguidas da mesma família. **Dinamismo:** cartões `ui` ≤ 40 %, ≤ 2 seguidos, nada parado > 4 s.
- **Geografia e efetivos:** `Atlas1812`, com setas e a coluna avançando. Combate humano em plano aberto: `Gemaelde` (Adam em Borodino, Hess na Bérézina, Vereshchagin em Moscou e na retirada). 3D: `ColonneNeige1812` na retirada; ele está provado no terreno do Jura, então use câmera baixa e curta.
- **O `Minard` é o visual-assinatura.** Entra:
  - no fim do cap. 02 (o paradoxo: a faixa encolhendo);
  - em flashes curtos ao longo da ida;
  - no cap. 07, com o take inédito: a faixa já fina antes da neve, com o rótulo "182 000 le 15 août — moins de 10 000 tombés au combat";
  - inteiro no cap. 14, quando a narração cita Minard.
- **Take inédito (cap. 07 e cap. 14):** cartão ou HUD com "301 000 → 182 000 en 52 jours · moins de 10 000 au combat" (Clausewitz) e "≈ 60 000 en armes le 3 novembre" contra "le froid a commencé le 7" (29e Bulletin). A citação do boletim vai em `Zitat`.
- Sem marca SIMULATION. A marca `@ChroniquesNapoléoniennesOublié` já está no sequenciador. Créditos nunca na imagem.
- Todos os textos na tela em FRANCÊS, com espaço fino antes de ? ! : ;.

## Verificação
1. `python ferramentas/plano.py` sem ERROS. Use o alinhamento real, `voz/alinhamento.json`; os capítulos 02, 07, 10, 12, 13 e 14 estão sendo renarrados e o alinhamento deles será refeito. As âncoras `wort`/`nr` continuam valendo se o texto bater com o `skript_de.json`.
2. Stills na G4: `python D:/tracer3d2/canal.py stills D:/chroniques/01_russie1812/v1 <pasta> <seg...>`, até 16 por chamada, **só se `canal.py saude` responder com a G4 no ar**. No Git Bash, use **sempre** `MSYS_NO_PATHCONV=1`. Nunca `garantir`, `ligar` ou `desligar`.
   - Folhas de contato a 480 px em `render/FOLHA_<A|B>_*.jpg`.
   - No máximo 2 rodadas de stills por capítulo.
   - Corrija o que estiver vazio, cortado, sobreposto ou feio.
3. Tudo no D: (`TEMP=D:/tmp`); mate só processos seus, pelo PID.

## Entrega (curta)
Contagem por família, a linha MISTURA/DINAMISMO, as folhas e o que ficou fraco.
