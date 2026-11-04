# Stack de produção 3D: baseline de longo prazo

Este é o **código-fonte do know-how** de produção dos vídeos com 3D: Segundo a Segundo (ES), Kriegsmomente (DE) e os canais que vierem. Ele registra **o que usamos, como, por que, o que já foi reprovado e o porquê**. É um documento vivo: **cada iteração que mudar a stack atualiza este arquivo e o registro do fim**.

- **Código de referência:** `producao3d/learjet_prova/` (a cena-prova do Learjet) e `producao3d/olho_g4/` (verificação visual na G4).
- **Escolha de tema e título** (canal alemão): ver `docs/pipeline-temas-kriegsmomente.md`.

---

## 1. Princípios (valem mais que qualquer ferramenta)

1. **O produto é a compreensão do espectador.** A ordem de investimento é: roteiro → desenho da informação → animação que demonstra → acabamento só até onde ajuda a entender (`CLAUDE.md`).
2. **Energia na composição, não no modelo.** O Reconstructed tira detalhe do avião e põe detalhe onde está a história: viaturas na cratera, rota se desenhando, números contando. Modelo pronto e congelado; o esforço vai para tomadas, enquadramento, movimento e atmosfera.
3. **Orçamento de detalhe:** detalhe vale tempo de tela × tamanho no quadro × importância na história. Plano geral (90% do vídeo): só silhueta certa, janelas escuras e motor escuro. Close detalhado: no máximo 1 ou 2 por vídeo, e só da peça que a narração explica. Se não é narrado e ocupa menos de 10% do quadro ou fica menos de 1,5 s na tela, não entra.
4. **Pronto antes de construir.** Antes de modelar, escrever shader ou montar cena, procurar pacote ou modelo pronto e livre (portão 1 do `CLAUDE.md`). Gerar à mão o que já existe pronto custa horas e sai pior.
5. **Harmonia acima de realismo.** Avião, céu, cidade e HUD na mesma família de cor, luz e contraste. "Desenho harmônico de alta qualidade", não ultrarrealismo.
6. **Tudo pesado roda na G4.** O PC só orquestra. Render, captura, preparo de modelo e juiz visual rodam na VM.
7. **Comparar com a referência quadro a quadro antes de mostrar**, com folha lado a lado mais o olho da G4 (seção 6).

---

## 2. Arquitetura

```
roteiro (frase por frase) ──► plano de tomadas (1 ângulo novo por frase, enquadramento, o que demonstra)
                                   │
       ┌───────────────────────────┼─────────────────────────────┐
       ▼                           ▼                             ▼
  TOMADAS 3D (teardown)      MAPAS / HUD / TEXTO           TRILHA DE DADOS
  three.js r186, render(t)   Remotion + GSAP               ADS-B real → JSON
  puro, capturado na G4      (montagem e cartões)          (altitude, descida, vel., rumo)
       │                           │                             │
       └──────────────► montagem Remotion ◄──────────────────────┘
                                   │
                    olho da G4 (régua + juiz) + folha lado a lado
                                   │
                        render final na G4 → entrega
```

- **Tomadas 3D:** skill **teardown** (elvarofficial/teardown, MIT). Cada cena é uma página three.js com `render(t)` função pura do tempo, capturada quadro a quadro por Playwright no Chromium da G4. Uma tomada de 30 s em 1080p sai em ~1 min.
- **Montagem, mapas, cartões e HUD de vídeo:** Remotion + GSAP (determinístico: timeline pausada com `seek` por quadro).
- **Mapas de rota:** em 2D escuro com a rota azul, no Remotion. Em 3D quebrou e não ganhou nada.

---

## 3. O avião (e qualquer objeto-herói)

**Modelo pronto, grátis, carregado por GLTF.** No Learjet usamos o **"Bombardier Learjet 45" do Sketchfab (KarimFatatry, CC-BY 4.0)**, o mesmo que o Reconstructed usa. O crédito ao autor vai na descrição do vídeo. Comprar não é necessário.

**Preparo (`prep.mjs`, gltf-transform, na G4):**
- Remover o interior (bancos, cabine de passageiros, toalete) e o trem de pouso. **Manter as portas do trem**: sem elas a barriga mostra um buraco. Manter a cabine de comando, que aparece pelo para-brisa.
- **Manter a textura de cor da fuselagem**, porque o para-brisa é a área transparente dela. No shader, usar **só o alfa**: onde é transparente, vira vidro escuro liso; a cor original (faixas da pintura) é descartada.
- Remover as outras texturas e deduplicar. **Cuidado:** o dedup funde materiais iguais e apaga o nome deles. Identifique as peças pelo **nome do nó**, nunca pelo nome do material.

**Material (receita atual, acetinado perolado):** `MeshStandardMaterial({color: '#c3c1bd', metalness: 0.35, roughness: 0.45, envMapIntensity: 1.1})`. Vidro: `{color: '#07090c', roughness: 0.06, envMapIntensity: 1.0}`.

**Luzes de navegação:** pontos emissivos nas pontas das asas (vermelha à esquerda, verde à direita), achados no próprio modelo pelo vértice de |z| máximo. É o detalhe barato que vende realismo.

**A peça da história** (no Learjet, o profundor esquerdo): peça nossa por cima do modelo, em 3 pedaços com pivô na articulação. Acende em vermelho (emissivo) quando é nomeada e se solta caindo, sincronizada com a fala.

---

## 4. Luz, céu e atmosfera

| Item | Receita | Por quê |
|---|---|---|
| Tonemap | `ACESFilmicToneMapping`, exposição 0,85 | contraste de cinema, sem estourar |
| Reflexo e fundo | HDRI do Poly Haven (CC0). Céu de tempestade com nuvens: `wasteland_clouds_puresky` (2k), como **fundo e reflexo** nas tomadas de céu. Encoberto `kloofendal_overcast_puresky` para a cidade | o avião reflete o céu em que está: degradê de cima para baixo e linha de brilho |
| Fundo vivo | `scene.backgroundRotation` girando com o tempo (o reflexo acompanha), `backgroundBlurriness` 0,12–0,3 | nuvem borrada correndo = movimento |
| Contraste | fundo escuro (`backgroundIntensity` 0,2–0,3) | o avião se destaca pelo reflexo, não por ser branco |
| Luz de contorno | `DirectionalLight` atrás do avião, oposta à câmera, intensidade ≤ 0,5 | desenha a linha de brilho nas bordas; acima disso estoura |
| Névoa no avião | `FogExp2` só nas tomadas de céu, k ≈ 0,006 (~30% a 100 m) | perspectiva atmosférica: o avião pequeno some no ar como no Reconstructed |
| AO de contato | **N8AO** (ISC) no lugar do GTAO | sombra nas junções asa-fuselagem e motor-cauda |
| Bloom | `UnrealBloomPass` com limiar alto (8,0) | só o que é emissivo brilha; o avião nunca vira halo |
| Correção de cor | `ShaderPass` próprio: saturação, contraste e tom por clima (céu cinza-azulado, cidade levemente quente) | une avião, céu e cidade numa família só |
| Anti-serrilhado | `SMAAPass` no fim | bordas limpas |

---

## 5. Movimento e composição (onde está o ganho)

- **Um ângulo novo por frase do roteiro.** O Reconstructed tem 149 tomadas distintas em 12 min, com só 3% repetidas. Biblioteca de enquadramentos: close do nariz e da janela, perfil, de cima, de trás, avião minúsculo no céu, mergulho visto de cima, cauda com a peça.
- **Regra dos terços:** avião fora do centro. Câmera **sempre** em movimento.
- **Turbulência com GSAP:** `CustomWiggle` (grátis desde a GSAP 3.13) numa timeline **pausada**, com `tl.seek(t)` em cada quadro. Rolagem, arfagem e altura tremem com frequências diferentes (wiggles 38/29/23, tipo `uniform`, determinístico). O mergulho treme forte (1,8° / 1,2° / 0,22 m) e o cruzeiro só respira.
- **Linhas de velocidade longas e quase paralelas** no sentido do fluxo de ar: do ponto de fuga do voo (projetado na tela) para fora. Não é chuva vertical 2D.
- **HUD de 5 números com dados reais** (estilo Reconstructed): SEGUNDO n/total, ALTITUD, VELOCIDAD VERTICAL, VELOCIDAD TERRESTRE, RUMBO. Rótulo pequeno espaçado e número grande. Os dados vêm do ADS-B público, interpolados quadro a quadro.
- **Detalhe só na cena da história:** cratera com fumaça, viaturas, rota se desenhando. Cidade = prédios do OSM2World (OSM, ODbL) com o telhado tirado da foto aérea NAIP (USGS, domínio público).

---

## 6. Verificação: o olho da G4

`producao3d/olho_g4/olho_g4.py`. Roda dentro da G4 e devolve **um JSON curto** por render, em vez de imagens.

1. **Régua de imagem:** p10/p50/p90 de luminância, contraste, saturação e % de branco estourado contra o quadro de referência. Estouro reprova direto.
2. **Juiz visual local:** **Qwen3-VL-8B-Instruct** (Apache-2.0), rubrica fixa (harmonia, não plástico, forma, peças soltas, para-brisa/janelas, exposição), 3 amostras e mediana, **limiar 0,8**. Calibrado em 04/11 com casos já julgados pelo Eduardo: o juiz é benevolente, então vale mais a **lista de defeitos** e a **ordem** entre versões do que a nota absoluta.
3. **Geometria:** `divine_eye` do img2threejs (silhueta contra a referência) quando o modelo for novo.
4. **Folha lado a lado** com o Reconstructed (ou a referência do vídeo) antes de mostrar ao Eduardo.

O modelo do juiz fica em `/content/modelos/qwen3vl8b` na VM, com cópia no Drive (`MyDrive/modelos/qwen3vl8b`). O Drive é montado pelo `colab.rodar(drive.mount)` mais o clicador de consentimento, com autorização do Eduardo.

---

## 7. Infraestrutura na G4 (armadilhas já pagas)

- **GPU no Chromium sem tela:** é preciso registrar o EGL da NVIDIA (`/usr/share/glvnd/egl_vendor.d/10_nvidia.json` apontando para `/usr/lib64-nvidia/libEGL_nvidia.so.0`, e remover o `50_mesa.json`), mais `LD_LIBRARY_PATH=/usr/lib64-nvidia` e as flags `--use-gl=angle --use-angle=gl-egl`. Sem isso cai no **llvmpipe/SwiftShader** (CPU). Confira a linha `gpu:` da captura.
- **npm `--no-save` apaga o que foi instalado antes** sem salvar. Instale tudo **numa chamada só** (`n8ao postprocessing gsap`).
- **Build embute os assets em base64** (`.glb`, `.hdr`, `.bin`, `.png` no `sims/build.mjs`). A página roda via `file://`, sem servidor.
- **Porteiro e dono:** todo comando de G4 leva `T2_DONO`; só o maestro desliga, e só se `porteiro.pode_desligar`. Desligar e **conferir** no fim (`/saude` não responde).
- **VM nova** (depois de desligar) precisa de preparo de novo: teardown, pacotes e modelos (`prep.mjs`), ~5 min.

---

## 8. Reprovado (não repetir)

| O que | Por que saiu |
|---|---|
| Maquete branca monocromática | o avião sumia na tela branca, amador |
| Learjet construído por código (lofts, trilhos de parâmetros) | horas de geometria para ficar atrás de um modelo grátis; "investimento grande para pouco resultado" |
| Pipeline img2threejs completo para o avião | rigoroso (23 portões), mas parou no esboço depois de horas; a rota é carregar o pronto |
| Nuvens volumétricas @takram (three-clouds/atmosphere) | realistas demais e estouradas, fora da harmonia |
| Clearcoat + estúdio sintético (RoomEnvironment) | "cano de PVC com resina" |
| Branco fosco sem reflexo | "gesso", sem vida |
| Alumínio metal 0,6 + contorno 1,3 + bloom baixo | cada quina vira um reflexo duro e o avião parece cheio de peças |
| Lente grande-angular colada no nariz | caricatura |
| Chuva 2D vertical | não tem relação com o movimento da câmera |
| Mapa de rota 3D sobre NAIP | quebrou; o Reconstructed usa 2D escuro com a rota azul |
| Diorama/mesa de comando low-poly (Kriegsmomente) | "amador", ilustra sem explicar |

---

## 9. Registro de iterações

| Data | Mudança | Resultado |
|---|---|---|
| 04/11/2026 | Learjet P3 jogado fora; prova nova no teardown (three.js) | avaliação: rota certa ("custo barato, rota simples, boa qualidade") |
| 04/11 | avião por código → img2threejs → **modelo pronto do Sketchfab** | o pronto venceu; para-brisa pelo alfa da textura; portas do trem fechadas |
| 04/11 | HDRI de tempestade + correção de cor + névoa + contorno + N8AO | harmonia com o Reconstructed; o mergulho empata |
| 04/11 | acetinado sem estouro (2ª análise do sócio) | "excesso de detalhe" some no close |
| 04/11 | turbulência GSAP + linhas de velocidade + HUD de 5 números | trecho de dinamismo do Reconstructed reproduzido |
| 04/11 | olho da G4 (régua + Qwen3-VL-8B) | verificação dentro da G4 em JSON curto |
| 04/11 | regra: energia na composição, orçamento de detalhe | próximo: biblioteca de tomadas e cena da cratera |
