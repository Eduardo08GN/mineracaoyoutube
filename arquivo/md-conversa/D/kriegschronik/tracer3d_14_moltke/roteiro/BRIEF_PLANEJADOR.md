# Brief do planejador de batidas: vídeo 14 Kriegsmomente "Moltke mit 69 / 45 Tage" (Tracer3D 2.0)

Você transforma a narração em **batidas visuais**.

- **Projeto:** `D:\kriegschronik\tracer3d_14_moltke`, cópia do vídeo 13.
- **Prazo:** o vídeo sai nesta madrugada. Tempo-alvo de 40 min até o `plano.py` passar.
- **Formato:** idêntico ao dos vídeos 8 a 13. Valem as seções "Formato de saída", "Regras de qualidade" e "Mistura de famílias" de `D:\kriegschronik\tracer3d_08_gewehr\roteiro\BRIEF_PLANEJADOR.md`.
- **Geradores de referência:**
  - `roteiro/gerar_A.py` e `roteiro/gerar_B.py`, que são os do vídeo 13 e estão nesta pasta;
  - `v1/src/beats/k13_A.tsx` e `k13_B.tsx`;
  - o brief do 13 em `roteiro/_ref13/`.

Reescreva os geradores para este vídeo. **Confira que não há capítulo duplicado.**

## Leia
- **Roteiro:** `roteiro/skript_de.json` (14 capítulos, ~2.365 palavras).
- **Dossiê:** `roteiro/fakten.md`.
  - Use só números e rótulos de lá, com "ca." onde for aproximado.
  - Respeite o §10 (correções a evitar). Não ponha entre aspas, no nome de Moltke, "Getrennt marschieren, vereint schlagen".
  - A citação é "Kein Operationsplan reicht mit einiger Sicherheit über das erste Zusammentreffen mit der feindlichen Hauptmacht hinaus" (Über Strategie, 1871).
- **Kit:** `v1/src/kit/API.md` e as APIs de `kit/ui`, `kit/karten`, `kit/welt` e `kit/epoca` (cena `Gemaelde`).
- **Novos do vídeo 14, o ponto alto:** `v1/src/welt/K14_API.md`, saída do batedor 3D desta noite.
  - Os componentes são `Aufmarsch1870` (9 linhas, trens, relógio por dia, contador até ~300.000 no Tag 18, 4 linhas francesas) e `DreiArmeen1870` (as três armadas no arco Trier–Karlsruhe, com variantes de manobra e, se existir, o modo `Schwenk`).
  - Decisões e fraquezas estão em `roteiro/BATEDOR_3d_k14.md` e na folha `render/FOLHA_batedor_k14.jpg`.
- **Biblioteca já no projeto, que você deve reaproveitar:**
  - vídeo 7 (`beats/kessel.tsx`, `feuer.tsx`, `welt/k7_feuer_sedan.tsx`): **Sedan**, o cerco e o fogo;
  - vídeo 8 (`welt/K8_PRIVAT_API.md`): Gravelotte e St. Privat, para Metz e Mars-la-Tour;
  - vídeo 9 (`welt/K9_API.md`): `Batterie`, para os 774 contra 564 canhões em Sedan;
  - vídeo 10 (`K10_API.md`, com `FELDTELEGRAF` em `k10_A.tsx`);
  - vídeo 6 (`massen`, mobilização em massa);
  - os pacotes de terreno de `v1/src/cenas/pacotes.json` (`sedan_maas`, `metz_gravelotte`);
  - `Uniformen`.
- **Imagens de época:** `v1/public/geo/fotos/fotos.json`, com rótulo = `titulo_de`. Use Moltke, Napoleão III, Bismarck, Wilhelm I, Sedan, a rendição e Bazaine.
- **Clipes Unreal** (`welt/u3d_clip.tsx`, componente `UnrealClip`): **não use agora**. O maestro troca depois algumas batidas de época por clipes, se o batedor da Unreal for aprovado.

## Cenas inéditas
- Batidas com componentes `k14_*` usam `"dono": "INEDITO_k14"` (sem `cena`).
- Cada planejador escreve o seu `v1/src/beats/k14_<A|B>.tsx` (`export const K14_<A|B>: BeatMap = {...}`).
- Os dois registram em `v1/src/beats/index.ts` como `BEATS = {...K14_A, ...K14_B}`.
  - Edite com Edit, só a linha do `BEATS` e as importações correspondentes.
  - **Não deixe importações nem IDs do vídeo 13** (BADPATHS 3.4).
- Use `wortLokal` para ancorar as etapas na fala.

## Rodapé
Este é um vídeo "Tag für Tag" só no take inédito (cap. 09). **Sem rodapé diário global** (`"zaehler": false`). O relógio de dias fica dentro do `Aufmarsch1870`.

## Direção visual
O pedido do dono do canal é **mais cenas 3D EXPLICATIVAS** (como funciona, em movimento, com HUD). Cada cena abaixo é o coração do capítulo: **2 a 4 batidas seguidas**, câmeras e etapas diferentes, cortes a cada 4–8 s, ancoradas palavra a palavra.

**Planejador A (caps. 01–07):**
- **01, gancho em Sedan:**
  - `Batterie` ou a cena de Sedan do vídeo 7 em fogo, com HUD "SEDAN · 2. SEPTEMBER 1870";
  - Napoleão III (62) contra Moltke (69) em `Gemaelde`;
  - "Degen" sobre a imagem da rendição.
  - **Nada de cartão calmo.**
- **02, paradoxo:** "45 TAGE" em HUD sobre 3D (`Aufmarsch1870` em `uebersicht`); idades 62 / 73 / 69 em KPIs sobre 3D.
- **03, promessa:** uma prévia rápida de cada cena-chave (trens, três armadas, Sedan).
- **04, o Schweiger:** retrato de Moltke (`Gemaelde`) mais o mapa Parchim → Dänemark → Preußen; 1866 Königgrätz com `Armeen` do vídeo 9 em uma batida.
- **05, Denkschrift:** documento/papel (`ui`) **no máximo 2 seguidos**; depois `Aufmarsch1870` mostrando "sechs durchgehende Bahnlinien" e a previsão "Tag 18: ~300.000".
- **06, Bahn → `Aufmarsch1870`**, o centro do vídeo, com 3–4 batidas:
  - as linhas se desenhando;
  - os trens no ritmo da fala ("zwölf … achtzehn Züge");
  - "rund fünfzig … zwölf" em HUD (nach einer Schätzung);
  - telégrafo (`FELDTELEGRAF`) em uma batida.
- **07, drei Armeen → `DreiArmeen1870`:** as três etiquetas com efetivos (60.000 / 131.000 / 130.000, total 384.000) e as duas variantes de manobra.

**Planejador B (caps. 08–14):**
- **08, Frankreich:** `Aufmarsch1870` na câmera `'frankreich'` (4 linhas); "50 zu 12"; Marseille "9.000 Reservisten" em KPI sobre o mapa; Le Bœuf em `Gemaelde`.
- **09, take inédito** (o 18º dia): `Aufmarsch1870` com o relógio **sincronizado com a contagem falada** ("Tag eins … Tag fünf … Tag acht …"), o contador crescendo até ~300.000 e o fecho "VORHERGESAGT 300.000 · ERREICHT ca. 300.000".
- **10, a virada:** a citação em tipografia sobre 3D; Spicheren e Wörth (6/8) em mapa.
- **11, Metz:**
  - Mars-la-Tour e Gravelotte com as cenas do vídeo 8 (`k8_privat_*`);
  - o anel em volta de Metz em mapa (`metz_gravelotte`).
- **12, Schwenk:** `DreiArmeen1870` no modo `Schwenk` se existir; senão mapa com setas. Inclua o jantar em Bar-le-Duc (`Gemaelde`) e o telegrama.
- **13, Sedan:** a Zange com as cenas do vídeo 7 (`kessel`/`feuer`, Sedan); `Batterie` com "774 gegen 564".
- **14, a resposta:**
  - cada resposta com uma volta da cena explicativa correspondente (trens, armadas, Sedan); **nunca 3 cartões seguidos**;
  - fecho com imagem calma nos últimos ~12 s (end screen);
  - CTA para "Warum verlor Frankreich 1870 – obwohl es schon ein Maschinengewehr hatte?" (vídeo 13), mais o vídeo 12, Gravelotte.

**Regras para os dois:**
- **Mistura** (`plano.py`): mapa ≤ 35 %, 3D ≥ 25 %, época ≥ 20 %, no máximo 3 seguidas da mesma família.
- **Dinamismo:** `ui` ≤ 40 %, ≤ 2 seguidos; 3D ou mapa a cada ~15 s.
- **Cartões `ui`:** o texto aparece até 1 s depois do início da batida (BADPATHS 3.21).
- **Sem marca SIMULATION;** créditos nunca na imagem; `@Kriegsmomente` já está no sequenciador.

## Divisão
- **Planejador A:** caps. 01–07 (`roteiro/gerar_A.py`, `v1/src/beats/k14_A.tsx`).
- **Planejador B:** caps. 08–14 (`roteiro/gerar_B.py`, `v1/src/beats/k14_B.tsx`).
- Não toque nos arquivos do outro, exceto a linha do `BEATS` no `index.ts`.

## Verificação
1. `python ferramentas/plano.py` sem ERROS.
   - Se `voz/alinhamento.json` ainda não existir, rode `python ferramentas/alinhamento_provisorio.py` e regenere depois.
   - Grave `dur` por capítulo (BADPATHS 3.14).
2. **Stills na G4:** `python D:/tracer3d2/canal.py stills D:/kriegschronik/tracer3d_14_moltke/v1 <pasta> <seg...>`, até 16 por chamada, com `set T2_DONO=kriegsmomente_v14`.
   - Só se `canal.py saude` responder com a G4 no ar.
   - **Nunca** `garantir`, `ligar`, `desligar` ou `preparar`: a G4 é compartilhada.
   - Se mexer em `public/`, rode `canal.py sync`.
3. Tudo no D: (`TEMP=D:/tmp`); mate só processos seus (PID).

## Entrega (curta)
Contagem por família, MISTURA/DINAMISMO da sua parte, folhas e o que está fraco.
