# unreal3d: Unreal 5 na G4 como servidor de render sem tela (plano de 01/11/2026)

**Nome do pipeline:** unreal3d. **Pasta:** `D:/unreal3d`. **Não sobrescreve** Eddie3D, Tracer3D 1.0/2.0 nem Spanish3D: só lê deles. **1º alvo:** Kriegsmomente, vídeo 12 (Gravelotte).

**Ideia central:** não tratar o Unreal como programa de janela, e sim como **motor de render sem tela, comandado por código**, igual ao que já fazemos com o Blender.
- O Opus escreve a cena em Python (Editor Scripting + Sequencer).
- A G4 renderiza pelo Movie Render Queue em modo offscreen (Vulkan).
- O PC só orquestra.
- Ninguém abre o editor.

## Arquitetura
| Peça | Solução | Por quê |
|---|---|---|
| Motor | **Build Linux pré-compilada** da Epic (o Eduardo baixa uma vez, logado) → enxugada (sem Win/Mac, docs, templates, plugins inúteis) → **imagem squashfs (zstd) no Google Drive** | Sem compilar fonte, sem Docker. Uma imagem só, ~15–25 GB |
| Boot da sessão | `ue5_boot.sh`: copia o `.sqfs` do Drive para o disco local → `squashfuse` (só leitura) + overlay para escrita → variáveis de ambiente | Monta em minutos, não descompacta 80 GB por sessão |
| Shaders | **DDC persistente:** depois do 1º render, o cache derivado (Engine + projeto) vai para um tar no Drive e é restaurado em toda sessão | A compilação de shaders (30–60 min na 1ª vez) não se repete |
| GPU sem tela | `UnrealEditor-Cmd Projeto.uproject Mapa -game -MoviePipelineConfig=... -RenderOffscreen -Unattended -NoSplash -log` via Vulkan | Sem X/servidor gráfico; não é desktop remoto (fica dentro das regras do Colab) |
| Cena | **Spec JSON → script Python do editor** (`-ExecutePythonScript`): monta o nível, assets, luz, névoa e câmera, e põe keyframes no Sequencer | O Opus "modela" por código, de forma reprodutível e versionável |
| Assets | Fab/Megascans gratuitos (pacotes estilizados de natureza e cidade). O Eduardo resgata na conta Epic; o Launcher no PC só baixa (não roda o editor) | A RX550 não abre o editor, mas o Launcher baixa |
| Render | MRQ 1920x1080, TSR + 4–8 amostras temporais, Lumen de software, névoa volumétrica, DOF; saída PNG/EXR → tar → PC; texto e contador no Remotion | Qualidade de cinema sem resolução extra |
| Convivência | Todo comando com `T2_DONO`, 1 render por vez, preflight e sync em tar (porteiro) | Regras da G4 em duas sessões |

## Fases com portão (go/no-go)
0. **Eduardo, uma vez (~15 min):**
   - baixar o Unreal 5 para Linux (unrealengine.com/linux, precisa do login dele) direto no Google Drive;
   - resgatar 2–3 pacotes estilizados gratuitos no Fab.
1. **Teste de Vulkan na G4 (~30 min).**
   - Passos: `nvidia-smi`, `apt install libvulkan1 vulkan-tools`, `vulkaninfo`.
   - Se faltar a parte de usuário do driver: instalar o pacote NVIDIA da mesma versão, sem o módulo do kernel.
   - **Portão 1:** `vulkaninfo` enxerga a RTX PRO 6000.
2. **Imagem do motor (~1 h, uma vez):** descompactar, enxugar e gerar o `mksquashfs` para o Drive. Escrever o `ue5_boot.sh`. Meta: boot ≤ 5 min.
3. **Render "olá" (~1 h):**
   - projeto em branco por linha de comando;
   - script Python com céu, sol, névoa, um cubo e uma câmera de 5 s;
   - render offscreen.
   - **Portão 2:** sair um PNG correto, com tempo medido por quadro. Salvar o DDC.
4. **Batedor Elapsed (~2–3 h):**
   - 1 plano de 10 s com cidade + ponte + árvores estilizadas + Lumen + névoa;
   - contador no Remotion;
   - **lado a lado** com o quadro do Elapsed e com o batedor do Blender.
   - **Portão 3:** o Unreal precisa ganhar do Blender com folga, senão fica o Blender.
5. **Pipeline:** spec → Python → MRQ → tar → Remotion, com fila e porteiro.

## Riscos e saídas
| Risco | Saída |
|---|---|
| Vulkan sem a parte de usuário no Colab | Instalar o pacote NVIDIA na mesma versão sem o módulo do kernel. Se ainda falhar: o Blender fica sendo a stack |
| Disco ou velocidade do Drive | squashfs comprimido + cópia sequencial. Medir na fase 2 |
| 1ª compilação de shaders | DDC persistente no Drive |
| Licença | O Unreal é gratuito para conteúdo linear de criador com receita < US$ 1 mi/ano (sem royalty de jogo). Conferir no EULA vigente |
| Editar sem editor | Tudo por spec/código + stills de prévia em baixa resolução. Ajuste fino visual: iterar pelo still |

## Revisão crítica (01/11, depois da conversa)
1. **Fase 0 sem passar pelo PC.** O C: está cheio e subir 25–30 GB para o Drive é lento.
   - O Eduardo loga na Epic, inicia o download e cola para mim o **link assinado temporário** do arquivo.
   - A G4 baixa direto com `wget` e grava a imagem no Drive.
2. **Iteração rápida.** Abrir o Unreal a cada prévia custa 1–3 min, contra segundos no three.js.
   - Manter um **editor sem tela persistente** na G4, com o plugin **Remote Control** (API HTTP) e a execução remota de Python.
   - Mandar comandos e pegar o still em segundos, sem reabrir.
   - Entra nas fases 2–3.
3. **Os tamanhos são estimativa.** O "15–25 GB enxugado" não foi medido. O zip Linux tem ~25–30 GB e descompactado pode passar de 60 GB. Medir na fase 2.
4. **Assets do Fab:** pacotes no formato Unreal pedem o Launcher com "Add to project", que é incerto sem a engine instalada no PC e com o C: cheio. Preferir os itens que o Fab entrega em FBX/GLB, ou baixar na G4 por link assinado.
5. **Render por plano, retomável:** um job do MRQ por plano, idempotente. Assim a sessão do Colab e a fila da outra sessão não derrubam o vídeo inteiro.
6. **O custo em tokens e horas é palpite** até a fase 3 medir o tempo por quadro e o ciclo de prévia.
7. **Decidir o canal antes da infra.** O Kriegsmomente encaixa melhor (escopo fixo, reaproveita a biblioteca), mas o canal é do sócio.

## Revisão do Agente Suporte (01/11): incorporada. Completa em `REVISAO_suporte.md`
**Veredito:** é aposta de **qualidade**, não de eficiência. A G4 por vídeo **sobe**. O ganho real vem de dois lugares: iteração (editor persistente) e tokens (o Opus edita só a **spec JSON**; o gerador spec→Python é código fixo com presets, como no T2, onde caiu de ~3,7 M para ~100 mil).

**Mudanças no plano:**
1. **Ordem:** **Portão 1 ANTES da fase 0.** `vulkaninfo` + `df -h` + teste de mount na G4, sem a Unreal. O Eduardo só baixa os 30 GB se passar.
2. **Quadros ficam na G4:** o Remotion (já na G4) compõe lá e o PC baixa só o mp4. O canal mede 8 MB/s de descida: 8 mil PNG ≈ 24 GB ≈ 50 min.
3. **Um processo só:** o editor persistente renderiza a fila inteira, com retomada por `ok_<plano>.json`. Nada de 1 boot por plano.
4. **Drive:** o `drive.mount` pede pop-up OAuth a cada runtime (consentimento do Eduardo). O T2 foi desenhado sem Drive. Medir no portão 1. Alternativas: bucket GCS dele ou HF privado (conferir o EULA).
5. **Driver:** o pacote de usuário da NVIDIA precisa casar com o driver do host, que pode mudar entre sessões. O boot confere o `nvidia-smi` e busca o par certo, sem fixar na imagem.
6. **VRAM e porteiro:** criar o recurso `unreal_editor` no porteiro. O editor morre por ociosidade. Reaproveitar a vigia_t2 (o servidor não conta daemon como atividade).
7. **Medições no portão 2:** amostras 1/4/8 × aquecimento 0/16/32 (no estilizado, 1–2 com TSR podem bastar).
8. **DDC:** guardar só o incremental, preso à versão da engine.
9. **Assets Fab/Megascans** são "para uso com Unreal": não migram para o Blender.
10. **Portão 3 com 3 números:** qualidade, min de G4 por min de 3D e relógio total (regra das 2 h).

**Reaproveitar do T2 por import, sem editar nada lá:**
- `canal.exec_vm`;
- subir/baixar com conferência de pedaço e `sincronizar_tar`;
- ligar/garantir/reconectar;
- `porteiro.reserva` com T2_DONO/`liberar_por`;
- vigia_t2;
- `marca.etapa` → `MEDICAO_auto.jsonl` desde a fase 1;
- vigia_ativo e boletim em versão própria (quadros do MRQ por plano);
- `BADPATHS.md` próprio.
- **Não servem:** `stills_quente.mjs` e `render.sh`.

**Ordem nova:**
1. portão 1;
2. download;
3. "olá" já no formato final (editor persistente + fila retomável + intermediário na VM + Remotion na VM, tudo medido);
4. batedor contra o Blender com os 3 números.
