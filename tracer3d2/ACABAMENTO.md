# Acabamento (Tracer3D 2.0): camada opcional de acabamento 3D, em 3 níveis de custo

Resolve o item 4 da `REFERENCIA_TRACER_PROJECT.md` (cenas inéditas com cara de maquete) reaproveitando os módulos do Eddie3D
(`Look`, `CeuFoto`, `Multidao3D`, `EZ-Tree`, `Flipbook`). Módulo: `modelo/v1/src/kit/acabamento/`. Assets: `<raiz>/assets\`.
Tudo determinístico (função pura de `t` e de semente). Nada de relógio.

## Regra de uso (para o planejador e para os agentes de cena inédita)

| Nível | Onde usar | O que liga |
|---|---|---|
| `leve` | **toda** cena 3D (kit e inéditas) | só pós-processo: AgX, LUT de época 1870, grão, vinheta, bloom só em emissivos (limiar 1,0) |
| `medio` | **padrão das inéditas externas** (terreno, estação, campo) | `leve` + N8AO, névoa de perspectiva aérea na cor do clima, céu HDRI fotográfico com luz de ambiente (IBL) e sol alinhado ao azimute da cena, detalhe PBR sobre o terreno (lama, grama, neve, pedra) |
| `heroi` | **no máximo ~6 batidas por vídeo**, escolhidas pelo planejador | `medio` + god rays, soldados com esqueleto (`SoldadosRig`), EZ-Tree no lugar de cones (`Arvores`), fumaça em flipbook com a luz do clima (`Fumaca`) |

Critério para `heroi`: batida em que o espectador olha para as figuras ou para as árvores por vários segundos, em média distância
(assalto, embarque, coluna na neve). Cena de mapa, gráfico, globo ou vista aérea alta: `leve` basta (ou nada).

## API

```tsx
import {BildAcab, Acabamento, materialPBR, SoldadosRig, escolherPerto, Arvores, Fumaca, nivelHeroi, nivelMedio} from '../kit/acabamento';

// 1) troca direta do `Bild` das inéditas: mesmas props + nivel/clima/chao/ao. nivel="off" devolve o Bild original.
<BildAcab nivel="medio" clima="entardecer" chao="grama" ao={false} kam={k} sonne={{azimut: 215, hoehe: 30}} perfil={PERFIL} schatten ...>
  ...cena...
</BildAcab>
// 2) dentro de um Canvas próprio: <Acabamento nivel clima sol={{azimut, staerke, farbe}} perfil sonne himmel hemi env schatten mitte radius> ...cena... </Acabamento>
```

- `clima`: `nublado` (overcast_soil), `entardecer` (industrial_sunset), `inverno` (snow_field); tabela em `clima.ts` (HDRI, sol, névoa, tom
  da LUT, grão, chão, fumaça). O panorama gira (`rotParaAzimute`) para o sol do HDRI cair no azimute (`sonne.azimut`) da cena.
  No `medio`/`heroi` a elevação da luz vem do clima (`elevLuz`); `sol={{hoehe}}` força outra.
- `chao`: `'lama' | 'grama' | 'neve' | 'pedra' | false`. Aplica detalhe PBR em coordenadas de mundo sobre as malhas grandes (raio > 150 m)
  da cena (`DetalheNaCena`), sem tocar nos componentes de terreno. `chaoOpc={{forca, metros, normal, tinta}}`.
- `ao`: `{raio, forca}` ou **`false`**. Cena com `far` enorme (terreno de 40 km, `far: 40000`) deve usar `ao={false}`: o N8AO fica instável
  na faixa de profundidade e escurece o terreno.
- `materialPBR('lama' | 'grama' | 'neve' | 'pedra', {metros, tinta, rugosidade})`: `MeshStandardMaterial` novo (planos, plataformas, ruas).
  Uso JSX: `<primitive object={materialPBR('pedra', {metros: 3})} attach="material" />`.
- `<SoldadosRig kind="pr"|"fr" n t fig quais seed cadencia />`: mesmo contrato `fig(i)` do `Heer` (x, z, y, ry, sc, vis, gait, fall, sit, aim,
  grau). Troca direta: o rig recebe os `quais` mais próximos da câmera e o `Heer` recebe `fig` nulo para esses. `escolherPerto(figRef, n,
  [x, z], quantos)` escolhe o conjunto com um instante de referência fixo (estável no tempo). Uniformes: prussiano (azul-escuro, gola
  vermelha, Pickelhaube de couro com ponta e placa de latão) e francês (capote azul, calça garance, kepi); mochila, capote enrolado e
  fuzil presos aos ossos (`Head`, `spine_03`, `hand_r`). Clipes: `Walk_Formal_Loop` (marcha), `Pistol_Aim_Neutral` (aim), `Death01`
  (fall), `Sitting_Idle_Loop`, `Idle_Loop`. ~10 draw calls por soldado: **até ~60 por cena** (os de perto), o resto em bloco.
- `<Arvores clima t especie="conifera|folhosa|mista" n centro raio raioMin altura y evitar semente />` ou `lista={...}`: EZ-Tree
  instanciado (2 draw calls por variante), com neve no inverno. `sortearArvores(...)` devolve a lista (cacheie fora do render se a
  cena não tiver hooks após `return` antecipado).
- `<Fumaca clima tipo="polvora|locomotiva|poeira|incendio" emissores t forca />`: flipbook Unity Labs com cor e luz do clima.
- Exportados também: `perfilAcab`, `LookAcab` (cópia do `Look` + grão), `CeuFoto`, `lutEpoca`, `detalharChao`, `Floresta`.
- Depurar: `globalThis.__dbg = 'semCeu' | 'semDet' | 'semSol'` isola cada peça num still.

### Como ligar num projeto
1. `python <raiz>/assets/copiar.py <projeto v1> [hdri,tex,pessoas,vfx]` (cópia só do que o vídeo usa; `leve` não precisa de nada).
2. Copiar `modelo/v1/src/kit/acabamento/` para `<projeto>/src/kit/`. O módulo importa `welt/f_szene`, `welt/t_szene`, `welt/t_geschuetz`,
   `welt/t_vfx` e `look/Look` do projeto (iguais aos do modelo).
3. **`canal.py stills` só sincroniza `src/`**: depois de copiar assets rode `python canal.py sync <projeto>` (o `render` sincroniza tudo).
4. Nas cenas: `Bild` → `BildAcab nivel={...}` (o nível por batida vai no plano; na prova usei um `acab_nivel.ts` temporário).

## Prova no vídeo 6 (stills 1080p e custo na G4)

Batidas: `06_13` (assalto da Garde, `clima="entardecer"`, `chao="grama"`, `ao={false}`), `03_07` (estação, `nublado`, `grama`, AO raio 1,6;
plataforma com `materialPBR('pedra')`), `11_13` (Jura, `inverno`, `neve` com força 0,45, AO raio 3). Em `heroi`:
06_13 = 44 soldados prussianos + 14 franceses em esqueleto (de 216 figuras) + fumaça `polvora` do clima; 03_07 = 42 soldados de rig + 70 EZ-Trees no lugar dos 90
cones; 11_13 = 220 pinheiros EZ-Tree com neve junto da coluna.

**Antes/depois (stills 1920x1080 na G4):** `<raiz>/acabamento_folhas\FOLHA_antes_depois.jpg` (linhas: 06_13, 03_07 e 11_13, dois instantes cada;
colunas: entregue, leve, medio, heroi) e uma folha por batida (`06_13.jpg`, `03_07.jpg`, `11_13.jpg`). Stills originais em
`<projetos>/tracer3d_06_1870\v1\teste\acab_{off,leve,medio,heroi}\`. Leitura:
- 06_13: do bege liso para terra com textura sob céu de fim de tarde; no `heroi` os soldados da frente têm esqueleto, capacete e mochila.
- 03_07: gramado e plataforma de pedra PBR, nuvens fotográficas; no `heroi` árvores de verdade.
- 11_13: no `medio` o ganho é discreto (o terreno já tinha shader de neve com `snow_02`); o `heroi` troca os cones da frente por pinheiros com neve.

**Custo medido na G4** (render do trecho inteiro da batida, `canal.py render`, 24 Chromes em paralelo; segundos de parede incluindo o bundle de ~25 s e o
reparo de quadros; uma rodada por nível, então vale ±5%):

| Batida (duração) | entregue | leve | medio | heroi |
|---|---|---|---|---|
| 06_13 (4,9 s, 146 quadros) | 52 s | 54 s (+4%) | 51 s (-2%) | 56 s (+8%) |
| 03_07 (7,8 s, 232 quadros) | 87 s | 86 s (-1%) | 100 s (+15%) | 99 s (+14%) |
| 11_13 (9,0 s, 271 quadros) | 122 s | 123 s (+1%) | 132 s (+8%) | 150 s (+23%) |

Alvos: leve ≤ +10%, medio ≤ +35%, heroi ≤ +100% numa batida: **todos cumpridos com folga**. Como só as cenas 3D mudam e `heroi` fica em ≤ ~6 batidas,
o render inteiro do vídeo sobe poucos por cento (estimativa: leve em todas as 3D ≈ +2%, medio nas inéditas ≈ +10% nessas batidas), ou seja, bem abaixo de ~20 min na G4.
(Os mp4 mudos das medições ficaram em `teste/acab_render/MUDO_NAO_PUBLICAR_*.mp4`; não são para publicar.)

O vídeo 6 foi **restaurado**: `massen.tsx` e `paris.tsx` voltaram do `.bak_acab`, e o `acab_nivel.ts`, `src/kit/acabamento` e `public/acabamento` temporários foram removidos.
Só restam os stills e mp4 de prova em `teste/`.

## Licenças (só CC0, MIT ou Apache; cópia só do que é usado)
- Poly Haven (CC0): HDRI `overcast_soil_puresky`, `industrial_sunset_puresky`, `snow_field_puresky`; texturas `muddy_tracks`, `grass_path_2`, `snow_02`,
  `cobblestone_floor_01` (`assets/polyhaven/LICENCA.txt`).
- Quaternius (CC0): Universal Base Characters e Universal Animation Library, só `masc.gltf` + `anim.glb` (`assets/quaternius/LICENCA.txt`).
- Unity Labs (CC0): flipbooks Cloud01, Cloud02, WispySmoke01, Explosion01 (`assets/unitylabs/LICENCA.txt`).
- Código: EZ-Tree 1.1.0 (MIT), three, R3F, postprocessing (MIT), n8ao 2.0.1 (ISC, permissiva, já em uso no `Look` do projeto), Remotion (licença do canal).
- Créditos só na descrição (regra do canal): "Texturas/HDRI: Poly Haven (CC0) · Personagens: Quaternius (CC0) · VFX: Unity Labs (CC0)".
- `<raiz>/assets\copiar.py` junta as licenças em `public/acabamento/LICENCAS.txt`.

## Limites conhecidos e pendências
- Cada nível foi medido uma vez por batida: repetir se o planejador quiser números finos. O custo de `heroi` cresce com o número de soldados em rig
  (~10 draw calls cada) e com as árvores EZ (copas densas); `SoldadosRig` com 60 + 70 árvores ficou em +14% na estação.
- `SoldadosRig` herda a escala das figuras da cena (em 06_13 as figuras valem 1,7x, "1 figura = 100 homens"): os de esqueleto ficam gigantes junto
  das de bloco. Cenas realistas (escala 1) ficam melhores. Poses de queda (`Death01`) e de mira (`Pistol_Aim_Neutral`) são aproximações do clip.
- O céu usa o JPG tonemapped em 6k: de perto (fov 40-50°) fica um pouco macio e mostra faixas de nuvem esticadas. Para planos longos no horizonte, preferir `nublado`.
- Sol rasante apaga o terreno inteiro (sombra do mapa de sombras): por isso `elevLuz` do `entardecer` é 20° (o sol fotografado fica a 4°).
- God rays do `heroi` só no `entardecer` (força 0,3); não verificados isoladamente nos stills (o disco do sol fica atrás da câmera em 06_13).
- Jura (`11_13`): o ganho do `medio` é pequeno; o do `heroi` é a floresta. Terrenos com shader próprio (neve) recebem o detalhe PBR com força baixa.
- Texturas do chão suspendem o canvas até carregarem (senão o primeiro quadro sai com o detalhe preto); em `DetalheNaCena`.
- Não foi aplicado nada ao `kit/welt` (Bahn/Globus/Flug/Modell): usam outro `Leinwand`; para pôr `leve` neles trocar o `<Look>` por `<LookAcab perfil={perfilAcab('leve', clima, perfil)}>`.
