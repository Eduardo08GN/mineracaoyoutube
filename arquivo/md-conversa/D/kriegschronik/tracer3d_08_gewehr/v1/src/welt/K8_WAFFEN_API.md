# K8 Waffen: componentes 3D parametrizados (vídeo 8, Kriegsmomente)

Cinco componentes de tela cheia (cada um monta `Leinwand` + câmera + luz + `LookAcab` e devolve `AbsoluteFill`). Todos são **função pura de `t`** (segundos locais da batida) e dos props: sem estado, sem relógio, sem `Math.random`. Rótulos em alemão (`Etikett` do `ui/basis`) como HTML sobre a cena, ancorados em pontos 3D com a mesma câmera da cena.

| Arquivo | Exporta |
|---|---|
| `k8_waffen_gewehr.tsx` | `GewehrNah`, `Duell2`, `gewehrKam`, `duellKam`, `ANKER`, `LIFT` |
| `k8_waffen_schnitt.tsx` | `VerschlussSchnitt`, `schnittZ`, `schnittKam` |
| `k8_waffen_mitrailleuse.tsx` | `Mitrailleuse8`, `mitrKam` |
| `k8_waffen_geschuetz.tsx` | `GeschuetzVergleich`, `geschuetzKam`, `kruppKeil` |
| `k8_waffen_modelle.tsx` | `GewehrModell`, `useGewehr` (glTF + ferrolho do Dreyse), `LAENGE` |
| `k8_waffen_basis.tsx` | `WBuehne` (palco de estúdio), `useWerkstoffe`/`useW` (PBR), `Etiketten3D`, câmeras (`umlauf`, `fahrtGerade`, `kamWahl`) |

Regras comuns: `kamera` aceita o **nome de um preset**, uma `KamDef` fixa (`{pos, ziel, fov}`) ou uma **função** `(t) => KamDef`. Os presets nunca param (fahrt linear + respiração; `kamTempo` multiplica a velocidade). Se a batida passar do `dauer` do preset, a câmera segue na mesma direção.
Rótulos: lista `etiketten` com `{an, text, sub?, em, ate?, dx?, dy?, cor?}`; `em`/`ate` em segundos locais; `an` é um nome de âncora ou um ponto `[x,y,z]` em metros.

## Origem e licença dos modelos (crédito só na descrição do vídeo, nunca na imagem)
- `dreyse` — "Dreyse needle gun -- free download", Andy Woodhead, **CC BY 4.0**, Sketchfab.
- `chassepot` — "Chassepot Needle-fire Rifle", Alexander Kirby, **CC BY 4.0**, Sketchfab (PBR 2K).
- `chassepot_w` (reserva, não usado por padrão) — "Chassepot 1866 rifle - free game asset", Andy Woodhead, **CC BY 4.0**.
- canhão de bronze 1815 (`public/maquete/bronze1815d/`, decimado 182 k → 29 k tris, sem Chain/Rope) — "British field cannon - 1815", Andy Woodhead, CC BY 4.0. **Usado** em `GeschuetzVergleich modell='gltf'` (rótulo "Bronze-Vorderlader (Typ)").
- `krupp1880` — "krupp 75mm 1880", Romania 100 - Marea Unire, CC BY 4.0, decimado 357 k → 59 k tris. **Usado** em `modell='gltf'` (rótulo "Krupp-Hinterlader (Typ)"; é o canhão de 1880, não o C/64).
- `mauser71` — "Gewehr 71", xnviro, CC BY 4.0 (sem textura; madeira/aço atribuídos por ilhas de triângulos + PBR no código).
- Tudo o mais é procedural (Mitrailleuse, Krupp C/64, La Hitte, corte do ferrolho). Texturas CC0 (Poly Haven: `brushed_concrete`, `green_metal_rust`, `muddy_tracks`; HDRI `overcast_soil`), flipbooks CC0 (Unity Labs: `Explosion01`, `FireBall01`, `WispySmoke01`).
- Linha de crédito pronta está em `public/maquete/LICENCAS.txt`.

(Os componentes estão detalhados abaixo.)

---

## 1. `GewehrNah` — fuzil em close (`k8_waffen_gewehr.tsx`)

Fuzil glTF deitado em dois cavaletes de madeira sobre mesa de madeira escura; luz-chave quente com sombra, preenchimento frio, contraluz azul, HDRI `overcast_soil` só como reflexo, AO + bloom sutil + grão + LUT de época (`LookAcab`). Unidade: metro; cano = +x, boca em +x, y para cima.

| prop | tipo | significado |
|---|---|---|
| `t` | number | segundos locais |
| `modell` | `'dreyse' \| 'chassepot'` | qual fuzil (Dreyse 1,42 m; o modelo do Chassepot traz o **sabre-baioneta**: 1,95 m no total, fuzil sozinho ~1,25 m) |
| `kamera` | `'profil' \| 'verschluss' \| 'muendung' \| 'orbit' \| KamDef \| (t)=>KamDef` | `profil`: dolly lateral coronha→boca (14 s, fov 26→24); `verschluss`: close no ferrolho, órbita ~40° e aproximação (10 s); `muendung`: baixo sobre a mesa na boca, sobe devagar; `orbit`: volta completa em ~28 s |
| `kamTempo` | number | multiplica a velocidade do preset |
| `verschluss` | 0..1 | Dreyse e Chassepot (o Mauser não anima: as ilhas do ferrolho não se separam do modelo): 0 fechado; 0..0,4 o cabo gira 90°; 0,4..1 o cilindro recua |
| `rauch` | number (s) | instante do tiro: clarão + luz pontual na boca, fumaça de pólvora (flipbook CC0), recuo do fuzil; **Dreyse** solta ainda gás + faíscas pelo ferrolho (o vazamento) |
| `etiketten` | `{an, text, sub?, em, ate?, dx?, dy?, cor?}[]` | `an`: `'verschluss' \| 'muendung' \| 'kolben' \| 'korn' \| 'abzug' \| 'lauf' \| 'schloss' \| 'patrone'` ou `[x,y,z]` |
| `hinweis` | string | texto discreto embaixo à esquerda |
| `licht` | graus | azimute da luz-chave (padrão 38) |

Exemplos de uso (planos sugeridos):
```tsx
// P1 — "o fuzil prussiano": dolly lateral, rótulo do calibre
<GewehrNah t={t} modell="dreyse" kamera="profil"
  etiketten={[{an: 'muendung', text: 'Kaliber 15,4 mm', em: 2.0, ate: 6, dx: -180, dy: -140}]} />
// P2 — ferrolho abre nas palavras "Verschluss auf": gira (1,0 s) e recua (1,2 s)
<GewehrNah t={t} modell="dreyse" kamera="verschluss" verschluss={fase(t, tAuf, tAuf + 2.2)}
  etiketten={[{an: 'verschluss', text: 'Zündnadel-Verschluss', em: 0.6, dx: 160, dy: -150}]} />
// P3 — o tiro, com o vazamento de gás do Dreyse
<GewehrNah t={t} modell="dreyse" kamera="verschluss" rauch={tTiro} />
// P4 — Chassepot, boca e massa de mira
<GewehrNah t={t} modell="chassepot" kamera="muendung" etiketten={[{an: 'muendung', text: 'Kaliber 11 mm', em: 1.0, dx: 160, dy: -140}]} />
```

## 2. `Duell2` — os dois fuzis lado a lado + tabela (`k8_waffen_gewehr.tsx`)

Dreyse atrás (aparece "em cima" no quadro) e Chassepot à frente, câmera alta que desliza ao longo dos dois (`duellKam`, 12 s). A **tabela** em alemão cresce sobre o terço inferior: Kaliber (discos 15,4 × 11 mm em escala), Schuss pro Minute (barras 4–5 × 8–15), Wirksame Reichweite (régua 0–1 200 m: "ca. 500–600 m" × "ca. 900–1 200 m"). Cores: Dreyse azul `#58a0ff`, Chassepot vermelho `#ff5040`.

| prop | tipo | significado |
|---|---|---|
| `t` | number | |
| `kamera` | KamDef \| (t)=>KamDef | padrão = `duellKam` |
| `tabelle` | `{kaliber?, rate?, reichweite?}` | **instantes (s) em que cada linha cresce** (1,3 s); linha omitida não aparece |
| `verschluss` | `[dreyse, chassepot]` | posição do ferrolho |
| `titel` | boolean | nomes "Dreyse M/41 · Preußen · 15,4 mm" etc. (padrão true) |

```tsx
// P5 — "alcance, cadência, calibre": cada linha entra numa palavra
<Duell2 t={t} tabelle={{kaliber: tCal, rate: tCad, reichweite: tAlc}} />
```

## 3. `VerschlussSchnitt` — corte do mecanismo (`k8_waffen_schnitt.tsx`)

Corte longitudinal procedural (1 unidade = 1 cm, plano z = 0, boca em +x), PBR (aço com marcas, latão, papel, borracha, chumbo), luz de recorte azul, hachura analítica na superfície de corte. Rótulo "schematisch · Maße ca." embaixo à esquerda. Perfis derivados de `k6_waffen_gewehr.tsx`, mas com **abertura de carga** em cima da luva (o cartucho cai por ela), movimento completo e vazamento de gás.

`phase` 0..1 (o mesmo mapa nos dois fuzis):

| fase | o que acontece |
|---|---|
| 0 – 0,18 | o cartucho de papel cai na abertura de carga (ferrolho recuado, mola armada) |
| 0,18 – 0,40 | o ferrolho avança e empurra o cartucho para a câmara |
| 0,40 – 0,52 | armado (câmara fechada) |
| 0,52 – 0,78 | gatilho: a agulha acelera **através do papel e da pólvora** (Dreyse, agulha longa até o espoleta no meio do cartucho) / curta até o espoleta no fundo (Chassepot) |
| 0,78 | ignição (clarão, espoleta incandescente) |
| 0,78 – 1 | gás na câmara, projétil sai; **Dreyse**: o gás vaza para trás pela folga do ferrolho (seta de gás); **Chassepot**: o **anel de borracha** dilata radialmente e veda (brilha) |

| prop | tipo | significado |
|---|---|---|
| `t`, `phase` | number | `t` em s locais (câmera, rótulos), `phase` 0..1 comandado pelo maestro |
| `modell` | `'dreyse' \| 'chassepot'` | |
| `kamera` | `'gesamt' \| 'nadel' \| 'dicht' \| KamDef \| fn` | `gesamt`: toda a peça; `nadel`: câmera junto da agulha/espoleta; `dicht`: junto da folga do ferrolho/anel. Todas orbitam um pouco para dar profundidade |
| `kamTempo` | number | |
| `etiketten` | boolean (padrão true) | rótulos automáticos por fase: Papierpatrone, Nadel (lang / kurz), Zündsatz, "Verschluss nicht ganz dicht" (Dreyse); Patrone, Gummiring, Nadel, Zündsatz (Chassepot) |
| `hinweis` | boolean (padrão true) | "schematisch · Maße ca." |

```tsx
// P6 — Dreyse: a agulha atravessa a pólvora (fases 0,40..0,80 em ~6 s)
<VerschlussSchnitt t={t} modell="dreyse" phase={lerp(t, 0, 12, 0.0, 1.0)} kamera="gesamt" />
// P7 — Chassepot: o anel de borracha veda
<VerschlussSchnitt t={t} modell="chassepot" phase={0.78 + 0.22 * fase(t, 0, 4)} kamera="dicht" />
```
`schnittZ(phase, modell)` devolve o estado cinemático (posições da agulha, do cartucho, gás), caso uma cena queira ancorar algo.

## 4. `Mitrailleuse8` — Reffye (`k8_waffen_mitrailleuse.tsx`)

Procedural em metros: feixe 5×5 de 25 canos (placa de boca com 25 furos + canos), camisa de aço com cintas de bronze, caixa do ferrolho com **fenda de carga**, **placa de 25 cartuchos** de latão (entra por cima), manivela com manopla de madeira, lafete e rodas de raios com laca oliva e ferrugem (CC0 `green_metal_rust`), chão de terra. Flipbooks CC0 nas bocas: um draw call por efeito para as 25 salvas.

| prop | tipo | significado |
|---|---|---|
| `t` | number | |
| `kamera` | `'muendung' \| 'seite' \| 'heck' \| 'platte' \| 'orbit' \| KamDef \| fn` | `muendung`: frente, baixa, aproxima-se dos 25 furos; `seite`: dolly lateral 14 s; `heck`: atrás, manivela em primeiro plano; `platte`: junto da placa de cartuchos; `orbit`: volta de ~30 s |
| `kurbel` | number (voltas) | rotação da manivela: 1 = uma volta completa; vale também para a rosca. Sem `kurbel` e com `salve`: gira ~1,6 volta/s enquanto a salva dura |
| `salve` | `{t0, dauer?}` | 25 tiros em sequência de `t0` (s) durante `dauer` s (padrão 4): clarão (Explosion01), fagulhas (FireBall01), fumaça (WispySmoke01), luz pontual, trepidação |
| `platte` | 0..1 | placa de cartuchos desce do alto até assentar (padrão 1 = assentada) |
| `etiketten` | `{an, ...}[]` | `an`: `'laeufe' \| 'kurbel' \| 'platte' \| 'rad' \| 'muendung' \| 'gehaeuse'` ou `[x,y,z]` |
| `hinweis` | string | |

```tsx
// P8 — "25 canos, uma manivela": placa entra, manivela gira, salva
<Mitrailleuse8 t={t} kamera="heck" platte={fase(t, 0, 1.6)} kurbel={kurbelVoltas(t)} etiketten={[{an: 'kurbel', text: 'Kurbel', em: 0.5}]} />
// P9 — a salva de frente
<Mitrailleuse8 t={t} kamera="muendung" salve={{t0: 1.0, dauer: 4}} etiketten={[{an: 'laeufe', text: '25 Läufe · Kaliber 13 mm', em: 0.4, dx: 180, dy: -160}]} />
```

## 5. `GeschuetzVergleich` — Krupp C/64 × canhão de bronze (`k8_waffen_geschuetz.tsx`)

Dois canhões de campanha lado a lado (bronze à esquerda em x = -3,4 m, Krupp à direita em x = +3,4 m, ambos com a boca para +x), terra com PBR, mesmo palco dos fuzis. Rótulos "Gussstahl · Hinterlader" (Krupp C/64) × "Bronze · Vorderlader" (La Hitte, schematisch).
- **Krupp**: aço PBR com marcas, boca oca, abertura traseira, cunha (Keilverschluss) que **desliza para o lado**; carrega por trás.
- **Bronze** (La Hitte): tubo procedural (bronze com pátina em ruído de mundo) com a mesma lafete; carrega pela boca: o **soquete** (Setzer) empurra o saco de pólvora e depois a granada (sem figura humana).

| prop | tipo | significado |
|---|---|---|
| `t` | number | |
| `kamera` | `'beide' \| 'gleit' \| 'krupp_keil' \| 'bronze_muendung' \| 'krupp' \| 'bronze' \| KamDef \| fn` | `beide`: plano aberto com leve avanço; `gleit`: desliza do bronze ao Krupp (14 s); `krupp_keil`: atrás da culatra do Krupp; `bronze_muendung`: na boca do bronze; `krupp`/`bronze`: órbitas |
| `ladenKrupp` | 0..1 | 0–0,2 cunha abre · 0,2–0,5 granada entra por trás · 0,5–0,68 cartucho · 0,68–0,9 cunha fecha. 0 e 1 = nada visível |
| `ladenBronze` | 0..1 | 0–0,1 saco de pólvora na boca · 0,1–0,32 soquete empurra · 0,32–0,42 soquete sai · 0,42–0,5 granada na boca · 0,5–0,72 soquete empurra · 0,72–0,85 soquete sai |
| `feuer` | `{krupp?, bronze?}` | instante do tiro: clarão, fumaça, recuo do tubo |
| `titel`, `titelEm` | | rótulos de título (padrão ligados, entram em `titelEm` s) |
| `etiketten` | `{an, ...}[]` | `an`: `'kruppKeil' \| 'kruppRohr' \| 'bronzeMuendung' \| 'bronzeRohr'` ou ponto |
| `nur` | `'krupp' \| 'bronze'` | desenha só um canhão (centrado em x = 0) |
| `elev` | graus | elevação do tubo (padrão 6) |

```tsx
// P10 — Krupp carrega por trás (nas palavras "Keil auf … Granate … Kartusche … zu")
<GeschuetzVergleich t={t} kamera="krupp_keil" nur="krupp" ladenKrupp={lin(t, tKeil, tZu)} />
// P11 — bronze carrega pela boca
<GeschuetzVergleich t={t} kamera="bronze_muendung" nur="bronze" ladenBronze={lin(t, tBeutel, tFertig)} />
// P12 — comparação aberta com os dois carregando e o tiro do Krupp antes
<GeschuetzVergleich t={t} kamera="gleit" ladenKrupp={lin(t, 1, 5)} ladenBronze={lin(t, 1, 9)} feuer={{krupp: 6}} />
```

## Limites conhecidos (honestos)
- Stills conferidos só com WebGL por software (SwiftShader): sem AO (N8AO) e com buffer de 8 bits; na G4 o look sai com AO e bloom completos. Custo em L4 **não medido**.
- `GewehrNah`: o ferrolho animado só existe no **Dreyse** (ilhas da malha de aço). Chassepot: o ferrolho também anima (ilhas 1062+982 da malha); o modelo vem com baioneta.
- `Mitrailleuse8` é procedural e ainda parece menos refinada que os fuzis (carro em blocos, clarões flipbook pequenos); cenas de salva leem melhor de lado/atrás que de frente.
- `GeschuetzVergleich`: a carga (Keil/Setzer) só existe no modelo procedural (`modell='prozedural'`); os glTF (`modell='gltf'`) são para médio/total.
- Âncoras `ANKER` (rótulos) são estimadas sobre o modelo normalizado, não medidas ao milímetro.
- Para stills locais use o harness em `D:/kriegschronik/batedor_tmp/gewehr/k8prova_waffen/` (`node run.mjs jobs.json`).


---

# Etapa 2 (batidas `src/beats/waffen.tsx`): o que foi acrescentado

`src/beats/waffen.tsx` exporta `WAFFEN: BeatMap` com as 21 batidas `INEDITO_waffen` (registrado em `beats/index.ts`: `{...PRIVAT, ...WAFFEN}`). Ações ancoradas com `wortLokal`.

## Novidades por componente
- **`GewehrNah`**: `modell` aceita `'mauser71'` (glTF "Gewehr 71" de xnviro, CC-BY, madeira + aço PBR, nivelado por regressão; **sem ferrolho animado**); o ferrolho do **Chassepot** agora anima; `rauch` aceita **lista** de instantes (um tiro por item; o Dreyse vaza gás em cada um); `auswurf: number[]` + `auswurfPapier` lançam cartuchos vazios (balística determinística). Rótulos movidos para fora da geometria.
- **`Duell2`**: `tabelle.leer` (tabela vazia visível desde esse instante, valores crescem nos instantes das linhas), `system` (canhão Krupp glTF + trilho + mapa tão atrás da mesa, para o dolly-out), `zurueck` 0..1 (os fuzis recuam e escurecem), `abdunkeln`, `chips` (rótulos 3D livres).
- **`VerschlussSchnitt`**: `umgebaut` 0..1 (Dreyse: anel de borracha voa do cabeçote-fantasma vermelho do Chassepot e encaixa; câmera `'umbau'`), `gummiGluehen` 0..1 (anel do Chassepot brilha em verde), `leckT0` (faíscas e nuvem de graxa do Dreyse), `zittern` (tremor de câmera no tiro), `etiketten` pode ser uma **lista por tempo** `{an:'papier'|'nadel'|'zuend'|'leck'|'ring'|'umring'|'ghost'|'kammer'|[x,y,z], text, sub, em, ate, dx, dy, cor}`.
- **`Mitrailleuse8`**: carro/rodas refeitos (aros de ferro, raios com chanfro, cubo em torno, madeira PBR olivácea, ferragens); `salve` aceita lista (várias salvas) e `dauer≈0,15` = os 25 de uma vez; `laeufeAn` 0..25 acende os canos na boca; `spuren` (rastros luminosos); clarões Explosion01 maiores, fumaça clara. `MitrKoerper` exportado.
- **`MitrFeld`** (`k8_waffen_feld.tsx`): `modus:'batterie'` (Mitrailleuse entre três La Hitte; `rueck` 0..1 recua a câmera; `lineal` 0..1 estende a régua até 2 000 m com marcas a cada 500 m e alvo minúsculo; `linealText`) e `modus:'ziel'` (vista da guarnição com silhuetas; `flug` 0..1 voa até o alvo seguindo a trilha; `staub` = instante dos impactos, pequenas nuvens de pó).
- **`GeschuetzVergleich`**: `modell:'gltf'` usa `KanonenModell` (Krupp 1880 e bronze 1815 decimados, PBR com aço/ bronze com pátina) para médio/total; `keilNur` 0..1 desliza só a cunha do Krupp procedural; `titelEmBronze`.
- **`KanonenModell`** (`k8_waffen_kanonen.tsx`): glTF dos dois canhões, cano +x, base y=0, centro x=0.

## Mapa das batidas
| batida | componente / props principais |
|---|---|
| 01_12 | `Duell2` órbita (kamera função), `tabelle {leer, kaliber:'Waffen', rate:'Seiten', reichweite:'Detail'}` |
| 02_06 | `GewehrNah dreyse`, fahrtGerade cano→culatra, `verschluss` abre/fecha em 'hinten … lädt', rótulo HINTERLADER |
| 02_07 | `VerschlussSchnitt dreyse`, fase 0,40→0,78 (flash em 'trifft'), câmera gesamt→nadel |
| 02_09 | `GewehrNah dreyse` órbita baixa, 2 ciclos, `rauch` em 'schießt', rótulo LADEN IM LIEGEN |
| 03_01 / 03_02 | `GewehrNah chassepot` órbita; `muendung` + rótulos Konstrukteur |
| 03_05 | `VerschlussSchnitt chassepot dicht`, `gummiGluehen` em 'Gummi', DICHT em 'abdichtet' |
| 03_06 | `VerschlussSchnitt dreyse dicht`, `leckT0='zischt'`, `zittern`, GAS ENTWEICHT |
| 03_10 | `GewehrNah chassepot verschluss`: 4 ciclos, `auswurf`, `rauch[]`, contador 8–15 e bandoleira "105 PATRONEN" |
| 03_12 | `Duell2` câmera lateral, só a linha reichweite ('doppelt') + placa |
| 04_01 | `Duell2 duellKam` + '?' sobre o Dreyse |
| 04_07 | `VerschlussSchnitt dreyse umgebaut` + "Umbau nach Beck, ab 1869" |
| 05_03 | `Mitrailleuse8` muendung, `laeufeAn` + grade 5×5 |
| 05_04 | `Mitrailleuse8` heck→orbit, `kurbel`, `platte`, `salve {dauer 0,16}` |
| 05_05 | `Mitrailleuse8` orbit, 3 salvas, placas "Rund 100 Schuss pro Minute" / "30 Jahre vor seiner Zeit" |
| 05_10 / 05_11 | `MitrFeld batterie` / `ziel` |
| 06_08 | `GeschuetzVergleich gltf` (Gussstahl · statt Bronze · Hinterlader) → corte procedural com `keilNur` em 'Keilverschluss' |
| 09_02 | `GewehrNah chassepot`, `rauch` em 'zeigt' |
| 13_13 | `GewehrNah mauser71` órbita lenta (sem ferrolho animado), chip 'MAUSER M/71 · ENDE 1871', placa 'Mauser M/71 · 11 mm · Visier bis 1 600 m' em 'einundsiebzig' |
| 14_02 | `Duell2 system zurueck` + dolly-out |
