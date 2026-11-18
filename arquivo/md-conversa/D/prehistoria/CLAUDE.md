# Canal pré-história POV — regras do projeto

Formato: "What If… and Couldn't Stop?" — plano-sequência 3D em primeira pessoa, HUD com contador que só escala,
legenda serifada itálica, **sem narração** (só trilha + efeitos). Público americano.

## Stack (decidida pelo Eduardo, 19/10/2026)
- Cena 3D: **Blender 4.2 (Eevee) por script** — `blender/cena.py` + `blender/tempo.py` (mesma linha do tempo de `src/tempo.ts`).
- Render: **G4 do Colab do Ultra** (conta [email removido], perfil Dolphin "12 Ivone"; RTX PRO 6000 96 GB). Não renderizar na placa local.
- HUD, legendas e som: **Remotion** local (`src/Final.tsx` + `src/Hud.tsx`), por cima de `public/fundo.mp4`.
- Assets: só CC0 (Kenney, Quaternius, Poly Haven) em `assets/`.

## Rodar um render (um comando, desliga sozinho)
```
python colab.py render D:\prehistoria\out\pacote.zip D:\prehistoria\out\resultado.zip
```
Depois: descompactar `resultado.zip` → `public/fundo.mp4` e `src/mamute.json` → `npx remotion render src/index.ts Final out/<nome>.mp4`.

## Regras que já custaram tempo (não repetir)
1. **G4 cobra parada (~8,9 unidades/h). Desligar SEMPRE** que não estiver renderizando — o `render_completo` desliga num
   `finally`; em qualquer pausa, `python colab.py desligar`. Conferir "0 active sessions".
2. **Nunca esperar processos com `pgrep -f <texto>`**: o próprio shell da célula contém o texto e o laço nunca termina.
   Usar `&` + `wait`.
3. **Não passar caminhos `/content/...` pelo Git Bash**: ele converte para `C:/Program Files/Git/content/...`.
   Chamar o `colab.py` pelo PowerShell (o script também desfaz isso em `_sem_git`).
4. **Upload pelo `files.upload()` pode deixar uma célula esperando arquivo** e travar a fila: conferir que a saída
   diz `SUBIU ['pacote.zip']` na célula NOVA; se travar, clicar "Cancel upload" ou Runtime → Interrupt.
5. **Eevee sem tela precisa do EGL da NVIDIA registrado** (`/usr/share/glvnd/egl_vendor.d/10_nvidia.json` →
   `/usr/lib64-nvidia/libEGL_nvidia.so.0`) e `LD_LIBRARY_PATH=/usr/lib64-nvidia`. Sinal de que está na GPU:
   48 amostras de um quadro 1080p em ~0,1 s (na CPU levava ~8 s).
7. **Células do Colab criadas por atalho de teclado erram o foco**: Ctrl+Enter já reexecutou a célula ANTERIOR (upload ou
   render antigo, que fez `rm -rf proj` e apagou um render pronto). Regra: trabalho longo vai pelo **terminal da VM**
   (`colab.py term`, com `nohup … &`), o caderno fica limpo (`limpar`) e nunca deixar célula de render/upload na fila.
8. **O terminal do Colab cai** ("[disconnected]"): `terminal()` reabre; leituras velhas não podem decidir nada.
9. **Toda espera do script usa marca única** (uuid) — saídas antigas em iframes enganavam a detecção.
10. **Vigia dentro da VM** (thread no kernel): 20 min sem Blender → `runtime.unassign()`. É a rede de segurança se a automação local cair.
6. **Dar status ao Eduardo a cada passo longo** e nunca deixar ele sem resposta durante esperas.
11. **Interface do Colab pode estar em PORTUGUES** ("Ambiente de execução", "Desconectar e excluir ambiente de execução", "Sim").
    `desligar()` usa `runtime.unassign()` por dentro da VM e depois o menu PT/EN, e confere o botão "Conectar/Reconectar".
12. **Rodar qualquer célula reconecta uma VM nova** (sem vigia, sem arquivos). Depois que o vigia desliga a G4, conferir
    `conectado()` antes de mandar célula; se precisar religar, o vigia é sempre a PRIMEIRA célula.
13. **Upload pela janela do Colab trava** com o perfil atual: pacote pequeno vai em base64 numa célula.
14. **Processo em segundo plano: `setsid nohup ... < /dev/null &`** — sem setsid, interromper a célula mata o processo.
15. **Nunca `pkill -f`/`grep` pelo nome do script na mesma linha que o dispara** (a própria linha casa o padrão). Esperar por arquivo de status.
16. **Imagem do Colab (out/2026): Python 3.13 + CUDA 13.** faster-whisper (CUDA 12) e torchao quebram; usar stable-ts e remover torchao.
17. **`limpar()` deixava a última célula com código velho** (era o `runtime.unassign()` do desligamento anterior) e ela rodou de novo
    logo depois de ligar a G4, matando a VM. Agora a última célula é esvaziada. E `rodar()` só põe token na marca se a marca
    estiver no código (código em base64 esconde a marca e a espera ia até o limite, com a G4 parada).
18. **Chrome sem tela na G4 (Remotion/three.js) só usa a GPU com o EGL da NVIDIA registrado + `LD_LIBRARY_PATH=/usr/lib64-nvidia`**
    e `--gl=angle-egl --chrome-mode=chrome-for-testing`. Sem isso o WebGL cai em software sem avisar (a v1 rodou assim).
    O relatório `npx remotion gpu` diz "WebGL: Disabled" mesmo com a GPU funcionando: testar com uma página que lê
    `UNMASKED_RENDERER_WEBGL` (tem que aparecer "NVIDIA RTX PRO 6000").
19. **Arquivo .sh gerado no Windows tem que sair com LF** (`newline="\n"`); com CRLF o bash da VM não roda nada e a G4 fica parada.
20. **Remotion 4.0.537 renderiza com `frameloop="never"` + `advance()`**: `invalidate()` não desenha; para esperar texturas
    assíncronas (Takram) usar `delayRender` + `advance()` até o compositor desenhar.
21. **Disparar trabalho longo pelo TERMINAL da VM, não por célula `!`**: a célula com `setsid nohup ... &` pode prender o kernel
    (fila de células trava, vigia não sobe). Status também pelo terminal (botão "Terminal" no rodapé; clicar pelo texto/posição).
22. **Vigia é SEMPRE o primeiro passo e é conferido** antes de enviar pacote ou disparar (`g4.py ligar` → "vigia ativo").
23. **Remotion na G4: renderizar em PARTES PARALELAS** (`npx remotion bundle` uma vez, depois 12 × `render --frames=a-b --concurrency=4`
    e concat `-c copy`). Um render único usa 2 de 48 núcleos e 2% da GPU (captura e encoder em série); em partes, 7:37 em 1080p
    saíram em 113 s. Recomprimir na VM (`-crf 21`) antes de baixar.
