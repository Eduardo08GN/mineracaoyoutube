# Pipeline Fab + simulação + G4 (What If ES narrado), mapa de 05/11/2026

Este é o pipeline que deu o "salto de qualidade gigantesco", nas palavras do Eduardo em 05/11, no batedor 07 do What If ES. Este documento é a memória de longo prazo dele: o que é, por que funciona, como rodar, o que falta e quanto tempo economiza.
- O código está em `producao3d/whatif_es_07/`, `producao3d/fab/` e `producao3d/infra/`.
- As referências estão em `docs/referencias/whatifsim-24fps.md` (dinamismo) e `docs/referencias/elapsed-24fps.md` (só visual).

---

## 1. Por que deu o salto (os 5 insights)

1. **Biblioteca pronta no lugar de modelagem.** A ideia foi do Eduardo, depois que eu propus Blender à mão: o concorrente usa bibliotecas do Fab e skills prontas, não modela. Os 199 GLBs do Fab (cidade, praia, carros, natureza) resolveram o cenário de uma vez. A energia sai do modelo e vai para a simulação e para o número, como pedem `feedback-energia-na-composicao` e o portão 1 do `CLAUDE.md`.
2. **Medir a referência ANTES de construir.** O What If Sim foi lido a 24 fps com `ler24.py`. A medição mostrou que dinamismo não é câmera rápida: é o **mundo mudando dentro do plano**.
   - Elapsed: movimento 0,99 e 44% de quadros parados, e mesmo assim prende, porque o mundo muda.
   - What If Sim: movimento 2,11 e 24% parados.
3. **Um parâmetro só gera tudo.** A duração do dia (`p`) entra em `fisica.ts`, e dela saem peso, velocidade do chão, nível do mar, hora do Sol, a comparação dourada e a reação de cada boneco.
   - Os números do HUD são consequência, nunca digitados. O espectador sente a lógica.
   - Tudo é **função pura de (t, p)**: qualquer quadro sai igual em qualquer aba, e isso é o que permite renderizar em 48 Chromes paralelos.
4. **A informação dentro do take.** No mesmo plano entram:
   - rótulos presos ao objeto 3D;
   - o número-mestre com dígitos que rolam;
   - 2–3 grandezas derivadas;
   - a comparação dourada que troca girando;
   - a frase cinética palavra a palavra.

   Nada de cartão separado do lugar. Isso cumpre `feedback-instrumento-vivo` e `feedback-animacao-explica`.
5. **A G4 como máquina de iteração.** Dá para renderizar, medir e corrigir várias vezes no mesmo dia, e um clipe de 14 s (420 quadros) sai em **42 s**.

**Resultado medido** (régua de 24 fps):

| | Batedor 07 | What If Sim | K17 v2 |
|---|---|---|---|
| movimento médio | **4,13** | 2,11 | 1,31 |
| quadros parados | **0%** | 24% | 46% |

---

## 2. Arquitetura (camadas)

| Camada | O quê | Onde roda |
|---|---|---|
| **Biblioteca** | Pacotes do Fab da conta do Eduardo, baixados pelo Epic Launcher (`D:/EpicVault/VaultCache/FabLibrary/`). Conversão Unity/FBX → GLB (`producao3d/fab/fbx_para_glb.py`, Blender sem tela) e otimização (`otimizar.mjs`, gltf-transform: textura ≤ 2k, metros, origem no chão). Ficam em `D:/whatif_es/assets/fab/`, com `catalogo.json` (tamanho, triângulos, animações) e folhas de contato. Mais Quaternius (pessoas CC0) e palmeiras CC0 | PC (uma vez por pacote) |
| **Física / roteiro** | `src/fisica.ts` (o parâmetro `p` e as grandezas) e `src/roteiro.ts` (frases e planos). Uma entrada move o mundo, o HUD e a frase | código |
| **Mundo** | Remotion 4 + three 0.180 + R3F 9 + drei (pipeline Eddie3D): `src/mundo/` (malecón, pessoas, fonte, palmeiras, vfx, ambiente), comportamento por função pura em `dados.ts` | G4 |
| **Look** | `src/look/Look.tsx`: névoa, bloom, AgX e god rays | G4 |
| **HUD** | `src/hud/Hud.tsx`: odômetro (mecânica do Remocn `rolling-number`, MIT), grandezas derivadas, comparação dourada, rótulos ancorados no 3D e frase cinética. Fontes: Inter Tight com dígitos tabulares + Instrument Serif Italic (OFL) | G4 |
| **Render** | `canal.render` do Tracer3D 2.0 → `vm/render.sh`: P Chromes com uma aba cada, quadros JPEG e encode. **Padrão desde 05/11: P=48 e partida a cada 0,3 s** | G4 |
| **Régua** | `ler24.py`: movimento, % de parados, cortes e tipo de câmera (Farneback). Meta: movimento ≥ 2 e parados ≤ 25%; o batedor 07 fez 4,13 e 0% | PC |
| **Narração ES** | AI Studio (Ultra). A frase da tela vira a fala, e a tela guarda a versão curta | AI Studio + G4 (alinhamento) |
| **Som** | MOSS-SoundEffect na G4 (`uv pip install --python /content/moss_env/bin/python`); música só instrumental (ACE-Step + Demucs) | G4 |

### Fórmula de roteiro e tela (do What If Sim, filosofia e não cópia)
- Simulação contínua dentro do plano, com câmera sempre andando.
- Um número-mestre ("UN DÍA DURA 24 h → 1 h 36 min") com 2–3 derivadas e a comparação em dourado.
- Lugares hispânicos reconhecíveis que **voltam piores** a cada visita (malecón de Salinas/Guayaquil, Acapulco, La Habana, Valparaíso).
- Uma frase curta de causa → efeito por batida, em linguagem de leigo.
- Escalada até o absurdo. No fim, "¿Algo de esto es real?" (o que é real e o que é palpite), uma pergunta para os comentários e a ponte para o próximo vídeo.
- Unidades métricas e comparações locais. Não copiar nome, layout de HUD nem tema do Elapsed.

---

## 3. G4: o que o benchmark provou (05/11)

Benchmark: render Remotion de 60 s (1.800 quadros). Script em `producao3d/infra/g4_bench.py`, saída em `D:/tmp/wgpu/bench.txt`.

| Chromes (P) | Partida entre Chromes | Tempo | GPU média / pico | VRAM pico | CPU média | Caiu no software |
|---|---|---|---|---|---|---|
| 24 | 2 s (antigo) | 96 s | 14% / 47% | 3,2 GB | 30% | 0 |
| **48** | **0,3 s (novo padrão)** | **67 s** | 25% / 94% | 11,3 GB | 49% | 0 |
| 96 | 0,2 s | 74 s | 20% / 79% | 16,2 GB | 56% | 0 |
| 32 | 0,3 s | 68 s | 22% / 80% | 10,6 GB | 46% | 0 |

**O que o benchmark mostrou:**
- O gargalo não era a placa. Era a **partida escalonada de 2 s** e, depois dela, o caminho da CPU: screenshot → JPEG → x264.
- Acima de 48 Chromes, mais Chromes deixam o render mais lento.
- A GPU média ficou em 25%, o que confirma que a placa ainda sobra.

**Próximo passo de arquitetura, ainda não medido:**
1. Encode por **NVENC** (a G4 tem h264, hevc e av1).
2. Captura crua de pixels direto para o encoder, em vez de screenshot JPEG.
3. Vários jobs ao mesmo tempo pela fila (`fila_g4.py`): render de um vídeo + batedor do próximo + IA. A meta de 80% vem do **número de tarefas**, não da resolução.
4. **Ilhas WebGPU** para os planos-herói (mar com arrebentação, partículas, multidão grande).
   - O WebGPU NVIDIA real no Chromium headless da G4 já está **provado**: libs NVIDIA isoladas + `nvidia_icd.json` + flags Vulkan (`eddie3d/vm/webgpu/teste_webgpu.sh`).
   - O three 0.180 `WebGPURenderer` precisa de `three.webgpu.js`, `three.tsl.js` e `three.core.js`.
   - O resto continua em WebGL, que é estável.

---

## 4. Levantamento de prontos já feito (efeitos e HUD)

O levantamento completo está em `docs/levantamentos/whatif-es-efeitos-hud-2026-11-05.md`. Em ordem de impacto ÷ custo:
- **Mar:** Ultra-Water (onda, espuma, nível), ou ilha WebGPU com TSL.
- **Céu e nuvens:** drei `<Clouds>` com seed e relógio de quadro; céu takram. Mais Sol e dia/noite acelerados pela hora em `fisica.ts`.
- **Raios de sol:** three-good-godrays 0.12.1.
- **Fumaça, fogo e explosão:** flipbooks VDB da JangaFX (EmberGen).
- **Multidão:** `@three.ez/instanced-mesh` 0.3.16 com o Quaternius UAL.
- **HUD:** Remocn (MIT) + Inter Tight com dígitos tabulares.
- **Skills three.js no GitHub:** clonadas para leitura em `D:/tmp/skills_threejs/`. Serviram de filosofia; nenhum código foi copiado sem licença.

---

## 5. Fraquezas abertas do batedor 07 (próxima rodada)

- **Plano A lavado:** névoa demais e prédios cinza. Tirar névoa e dar cor por paleta do Flat Style.
- **Carros em escala de brinquedo:** 2,4 m de altura. Normalizar pelo `catalogo.json`, com ~1,5 m para carro de passeio.
- **Janelas apagadas à noite:** emissivo por máscara do atlas, aceso pela hora.
- **Mar sem arrebentação:** Ultra-Water ou ilha WebGPU.
- **God rays só no plano C:** no A, o Sol atrás da câmera virou um disco branco.
- **Licenças do Fab:** confirmar cada uma em `fab.com/listings/<uid>` antes de publicar.

---

## 6. Autonomia de pacotes no batedor

Desde 05/11, todo batedor roda a **Frente Fab autônoma** (`docs/BATEDOR.md`, passo 0):
1. olhar primeiro o catálogo que já temos;
2. buscar os pacotes grátis no Fab, até 30 min por elemento;
3. trazer, converter e catalogar;
4. registrar a licença e o crédito na descrição.

Pacote pago só com o OK do Eduardo, com o valor. Senha, nunca. Arquivo bruto do Fab nunca vai para o repositório público.

---

## 7. Orçamento de tempo: projeção do ganho em relação ao jeito antigo

**Base medida (datas do git e do transcript):**

| Vídeo | Jeito | Tempo |
|---|---|---|
| K16 Seekrieg | 1º na stack three.js, construindo mapa, época, lápis e motor | ~24 h (03/11 19h → 04/11 19h10) |
| Learjet P4 | peça por código (cauda em T) + 6 rodadas de batedor | ~2 h de produção (19:34 → 21:40), mais o batedor antes |
| K17 v1 + v2 | v1 por concatenação de clipes, reprovada; v2 refeita do zero | ~2 h + ~3 h = **~5 h** |
| Batedor 07 (novo) | Fab + simulação + G4 | **~1 h 20**, já com a ingestão única dos 199 GLBs |
| Render (60 s de vídeo) | 24 Chromes, partida de 2 s → 48 Chromes, 0,3 s | 96 s → 67 s (**−30%, medido**) |

**Projeção por etapa** (vídeo de ~8 min no molde novo; a média antiga é tirada de K17 e P4, sem o K16 atípico):

| Etapa | Antes | Agora (projeção) | Ganho |
|---|---|---|---|
| Roteiro, voz, alinhamento, legendas | ~1 h | ~1 h | 0% (não mudou) |
| Cenário e modelos | ~1,5 h (peça por código/à mão) | ~0,25 h (catálogo pronto) | ~−85% |
| Batedor | ~1 h (várias rodadas) | ~0,5 h (render de 42 s por clipe) | ~−50% |
| Render, mix e entrega | ~0,5 h | ~0,3 h | −30% medido no render; NVENC deve dar mais |
| Retrabalho por reprovação visual | ~1 h em média (K17 refeito, stacks revogadas em 03–04/11) | ~0,25 h | ~−75% |
| **Total** | **~5 h** | **~2,3 h** | **≈ −55%** |

**Leitura honesta:**
- O que está **medido**: o render (−30%) e a ingestão mais o batedor em 1 h 20.
- O resto é **projeção** e só se confirma no vídeo 1 completo. O registro de iterações abaixo vai anotar o tempo real.
- O ganho maior não é o render. É **não modelar** e **não refazer**.

---

## Registro de iterações

| Data | O quê | Medida |
|---|---|---|
| 05/11 | Leitura de 24 fps do What If Sim (dinamismo) e do Elapsed (só visual); stack corrigida para Fab + skills prontas | mov 2,11 / 24% e 0,99 / 44% |
| 05/11 | 199 GLBs do Fab convertidos e catalogados (Small Town, Flat Style Vehicles, Low Poly Nature, Voxel Beach…) | uma vez |
| 05/11 | WebGPU NVIDIA provado na G4 (headless, Vulkan) | — |
| 05/11 | Benchmark do render: partida de 2 s era o gargalo; novo padrão P=48 e 0,3 s | 96 s → 67 s por minuto de vídeo |
| 05/11 | Batedor 07 renderizado na G4: malecón, maré subindo, multidão viva, HUD moderno | 420 quadros em 42 s; mov 4,13; 0% parados |
| 05/11 | Eduardo: "salto de qualidade gigantesco". Frente Fab autônoma no batedor; documento criado | projeção de −55% no tempo por vídeo |
