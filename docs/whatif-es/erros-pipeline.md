# Trilha de erros do pipeline What If (ES): regras para não repetir

Canal em espanhol que modela o What If Sim, vídeo a vídeo. Stack: React Three Fiber + drei + Remotion, render na G4 do Colab
(RTX PRO 6000, 96 GB), painel e legendas em HTML, áudio gerado na G4. Cada item abaixo custou tempo ou unidades de GPU.
Antes de produzir um vídeo novo, ler esta lista inteira.

## 1. Operação da G4 (Colab)

| # | O que aconteceu | Regra |
|---|---|---|
| 1 | A G4 cobra parada (~8,9 unidades/h) e ficou ligada sem uso | Desligar SEMPRE ao fim (`g4.py desligar`) e conferir "Conectar/Reconectar" de volta. Desligar também em qualquer erro (`finally`). |
| 2 | O vigia (desliga após 20 min ociosa) subiu tarde: argumentos trocados na chamada | O vigia é o PRIMEIRO passo e é conferido ("vigia ativo") antes de enviar pacote ou disparar trabalho. |
| 3 | O vigia não via o render do navegador como atividade e derrubou a VM | A lista de processos ativos inclui `chrome`, `node`, `remotion`, `ffmpeg` e os scripts do pipeline. |
| 4 | Interface do Colab em português: o desligamento procurava botões em inglês e não desligou | `desligar()` usa `runtime.unassign()` por dentro da VM e depois o menu em PT/EN, clicando "Sim/Yes" por papel de botão. |
| 5 | Rodar qualquer célula depois do desligamento religou uma VM nova, sem vigia | Conferir `conectado()` antes de mandar célula. |
| 6 | Célula velha (o `unassign` da sessão anterior) rodou de novo e matou a VM recém-ligada | `limpar()` apaga as células e esvazia a última. Nunca deixar célula com código na fila. |
| 7 | Célula `!setsid nohup ... &` prendeu o kernel; a fila travou e a produção disparou DUAS vezes (dois renders escrevendo no mesmo arquivo) | Trabalho longo é disparado pelo TERMINAL da VM (`term.py`), nunca por célula. Antes de disparar, conferir que não há outro `producao.sh` rodando. |
| 8 | Upload pela janela do Colab travou | Pacote de código vai em base64 numa célula; texturas e modelos a VM baixa das fontes. |
| 9 | `.sh` gerado no Windows com CRLF: o bash não executou nada e a G4 ficou parada | Scripts para a VM saem com LF (`newline="\n"` ou `sed -i 's/\r$//'`). |
| 10 | `pkill -f`/`grep` pelo nome do script na mesma linha que o dispara acertou a própria linha | Esperar por arquivo de status, não por nome de processo. |
| 11 | A marca de fim estava dentro do base64 e a espera ia até o tempo limite | `rodar()` só põe token na marca se a marca estiver literalmente no código. |
| 12 | Imagem do Colab com Python 3.13 + CUDA 13: faster-whisper (CUDA 12) e torchao quebraram | Usar stable-ts; remover torchao antes de importar diffusers. |

## 2. Render (Remotion + three.js)

| # | O que aconteceu | Regra |
|---|---|---|
| 13 | O Chrome sem tela renderizou em SOFTWARE sem avisar (a primeira prova inteira) | Registrar o EGL da NVIDIA, `LD_LIBRARY_PATH=/usr/lib64-nvidia`, `--gl=angle-egl --chrome-mode=chrome-for-testing`. Conferir lendo `UNMASKED_RENDERER_WEBGL` dentro da composição (tem que dizer NVIDIA). O relatório `remotion gpu` diz "Disabled" mesmo funcionando: não confiar nele. |
| 14 | Render único usou 2 de 48 núcleos e 2% da GPU (captura e encoder em série) | `npx remotion bundle` uma vez e 12 renders em paralelo (`--frames=a-b --concurrency=4`), depois concat `-c copy`. Vídeo de 7:37 em 1080p: 113 s. |
| 15 | Arquivo final de 763 MB, pesado para baixar | Recomprimir na VM (`-crf 21`) antes de baixar. |
| 16 | Remotion 4.0.537 renderiza com `frameloop="never"`: `invalidate()` não desenha e o render travou esperando textura | Para texturas assíncronas: `delayRender` + `advance()` até o compositor desenhar. |
| 17 | Nuvens volumétricas (Takram) custaram 11 min de G4 por 20 s | Rota barata: tufos em billboard com seed fixa. Volumétrico só se o original comprovadamente usar. |
| 18 | Textura sRGB lida num ShaderMaterial saiu escura (a Terra preta) | Em shader próprio, textura de cor com `NoColorSpace` (o shader escreve direto na tela). Em material padrão, `SRGBColorSpace`. |
| 19 | `fog`/`color` presos a um `<group>` não valem para a cena | `attach="fog"`/`attach="background"` só como filho direto da raiz da cena. |
| 20 | Nada de `useFrame` próprio, `Math.random` ou relógio | Tudo calculado a partir do quadro (`useCurrentFrame`), com sementes fixas. |

## 3. Cena e direção

| # | O que aconteceu | Regra |
|---|---|---|
| 21 | Boneco deitado "andando" (pose e movimento sorteados separadamente) | Cada figurante tem UMA pose e o movimento sai dela. `validarElenco()` derruba o render se houver incoerência. |
| 22 | Bonecos e palmeiras colados na câmera | Figurantes a menos de 3,5 m da câmera somem. O caminho da câmera não passa por palmeiras e postes. |
| 23 | Palmeiras com curvatura absurda (fator multiplicado pela altura) | Curvatura em metros, não proporcional à altura. |
| 24 | Poeira do terremoto cobriu a tela inteira | Sprites de poeira com opacidade ≤ 0,35 e tamanho contido. |
| 25 | Partículas da fonte viraram um borrão perto da câmera | Tamanho de ponto limitado (escala ~190) e câmera a mais de 10 m. |
| 26 | Cena de Blender montada por código ficou pobre (dinossauros, Paris-Geschütz) | Antes de construir, partir da leitura óptica do original (10 fps) e da stack que ele usa. |

## 4. Áudio (o erro do vídeo 1)

| # | O que aconteceu | Regra |
|---|---|---|
| 27 | Não analisei o áudio do original: só medi o volume e vi que não havia voz | Ler o áudio como a imagem: classificador AudioSet (PANNs CNN14) a cada 2 s + espectrograma. Resultado vira o mapa de som (o que soa em cada capítulo). |
| 28 | Música única de 7min50 gerada de uma vez no ACE-Step saiu distorcida (corte a ~4 kHz e chiado de banda larga) | Música em faixas curtas por capítulo (20–90 s), como o original faz. Gerar 2+ versões e escolher por métrica de ruído. Nunca uma faixa longa. |
| 29 | Efeitos sonoros reduzidos a um ronco de ruído sintético | Efeitos onde o original tem (ondas, multidão, estrondos, sirenes, alarmes, água da fonte, rugido do paredão, ronco tectônico). Gerar com modelo de uso comercial (MOSS-SoundEffect v2, Apache 2.0) ou gravações CC0. |
| 30 | Licenças: MMAudio e TangoFlux (pesos não comerciais), HunyuanVideo-Foley (exclui UE/Reino Unido/Coreia) | Canal monetizado: só modelos e bibliotecas com uso comercial confirmado. |
| 31 | Mixagem sem hierarquia | Camadas com nível alvo (música -20 LUFS, efeitos conforme o original), música abaixando sob os efeitos, `alimiter` e `loudnorm` em duas passadas (-14 LUFS, -1,5 dBTP). |
| 32 | Entreguei sem conferir o áudio | Conferência antes de entregar: espectrograma por capítulo, picos, LUFS e etiquetas do classificador no vídeo novo comparadas às do original. |

## 6. Erros da rodada de áudio (21/10/2026)

| # | O que aconteceu | Regra |
|---|---|---|
| 33 | Caminho `/content/au` passado pelo Git Bash virou `C:/Program Files/Git/content/au` | Rodar com `MSYS_NO_PATHCONV=1` (ou pelo PowerShell) sempre que passar caminho da VM como argumento. |
| 34 | Com o painel do terminal aberto, o texto das células ia para o terminal (célula do vigia rodou vazia) | Fechar o terminal antes de qualquer operação em célula; focar o `textarea` do editor antes de digitar. |
| 35 | Clique forçado na célula vazia acertou o link "gere código com IA" e abriu o aviso de privacidade da IA do Colab | Clicar no canto da célula e focar o `textarea`. Aviso de termos/privacidade: recusar ("Cancelar"), nunca aceitar em nome do usuário. |
| 36 | O "desconectado" era o aviso travando a tela: a VM seguia ligada (e cobrando) | Conferir pelo terminal (`hostname`) antes de concluir que a VM caiu. |
| 37 | No Colab, `uv pip install` ignora o venv ativo e instala no Python do sistema | Sempre `uv pip install --python /caminho/do/venv/bin/python`. |
| 38 | `torchaudio.save` (2.9) exige `torchcodec` e falhou depois de gerar | Gravar com `soundfile`. |
| 39 | Pacote de música ficou na VM sem ser baixado | Cada etapa empacota e é baixada assim que termina; só então desligar. |

## 7. Erros da madrugada de 21/10/2026 (vídeos 2, 3 e 4 e o flicker do vídeo 1)

| # | O que aconteceu | Regra |
|---|---|---|
| 40 | Flicker: em quadros soltos o céu saía preto, as mangas sumiam e os bonecos ficavam brancos (o Eduardo viu no vídeo 1) | Acontece com várias abas do Chrome disputando a GPU, sobretudo nos primeiros quadros de uma aba nova. Render em quadros JPEG com **32 Chromes de 1 aba** (`--concurrency=1`), detector de glitch (área grande que difere dos dois vizinhos, que são parecidos entre si) e re-render de cada suspeito **com 3 quadros de aquecimento antes**, ficando com a versão mais coerente (`vm_comum/render_seq.sh` + `reparar.py`). Depois, varrer o mp4 final com `glitch.py`. |
| 41 | Re-renderizar o quadro suspeito sozinho (`remotion still`) piorou: o quadro isolado é justamente o "primeiro quadro de aba nova" | Reparo sempre com aquecimento (`--frames=k-3..k`), nunca quadro isolado. |
| 42 | Detector com limiar baixo marcou perna andando, fogo e partícula como glitch (700+ suspeitos) | Limiar por área (>150 px em 192×108) e painel e legenda mascarados. Movimento legítimo vem em sequência de quadros; glitch é quadro isolado. |
| 43 | Download trouxe o arquivo errado (o vídeo 2 no lugar do vídeo 1): o texto novo caiu na célula do download anterior e o Colab baixou o velho primeiro | `g4.py baixar` limpa as células antes. Conferir o nº de quadros do arquivo baixado (`ffprobe -count_packets`). |
| 44 | Remotion bundle não segue symlink em `public/` (textura "Could not load") | Copiar as texturas (`cp`), nunca `ln -s`. `node_modules` em symlink funciona. |
| 45 | `ligar` travou: a célula antiga do `unassign` ficou na fila e a VM não reconectava sozinha | `g4.py ligar` limpa as células e clica no botão de conectar antes de mandar o vigia. |
| 46 | `freezeframes` do ffmpeg pede duas entradas | `-filter_complex "[0:v]split[a][b];[a][b]freezeframes=first=N:last=N:replace=N-1"` para trocar um quadro com glitch pelo anterior. |
| 47 | Planeta "sem oceanos" continuava com cara de mar: o halo azul da atmosfera e o fresnel pintavam o fundo cinza de azul | Ao secar, tirar o azul do fresnel e do halo junto com a cor da água. |
| 48 | Câmera a 190 m (Miami): em quadros alternados a areia sob o mar aparecia em dente de serra (briga de profundidade com near 0,5) | `near = max(0,5, altura_da_câmera / 40)` em toda cena de costa. |
| 49 | Vapor sobre o mar sumiu: sprites com `renderOrder` negativo são desenhados antes do mar transparente, que pinta por cima | Sprites sobre água com `renderOrder` maior que o do mar e base acima da linha d'água (senão o quadrado é cortado em diagonal). Textura de nuvem macia (`cloud.png`), nunca manchas que encostam na borda do canvas. |

## 8. Erros da refação do vídeo 1 com o look cinematográfico (21/10/2026)

| # | O que aconteceu | Regra |
|---|---|---|
| 50 | Com o `EffectComposer` do `@react-three/postprocessing`, o primeiro quadro de cada aba (e todo still) saía preto | Ele só fica pronto alguns ciclos depois de montar. Usar compositor próprio, montado de forma síncrona (`look/Look.tsx`). |
| 51 | Shaders próprios ficaram lavados e o paredão sumiu depois do compositor | Eles escreviam cor já em sRGB; pelo compositor o buffer é linear. Terminar cada shader próprio com `pow(rgb, 2.2)`. |
| 52 | No PC (Chrome com SwiftShader), buffer HalfFloat saía preto | Detectar WebGL por software (`WEBGL_debug_renderer_info`) e usar buffer de 8 bits e sem AO só nesse caso. |
| 53 | Na G4 (HalfFloat), os capítulos da costa saíam pretos com o painel visível (orla, cidade até paredão); praia, Oregon e espaço normais | Algum pixel NaN/Inf da cena: o desfoque em mipmap do bloom espalha o NaN pela tela toda. Achado com stills de chaves `--props='{"dbg":"semBloom"}'`, `semAO`, `semFonte`, `fb8`. Regra: **passe de saneamento (NaN → 0, `clamp` 0..32) antes do bloom**. Antes do render longo, testar stills de cada mundo **na G4**, não só no PC. |
| 54 | Pacote em uma célula de 154 KB travou o navegador; em pedaços, a célula rodou duas vezes e duplicou o pedaço | `g4.py enviar_grande`: pedaços de 45 mil caracteres, cada um num arquivo próprio aberto com `'w'`. O editor do Colab reindenta laço colado: reconstruir numa linha só. |
| 55 | Dia e noite fora do ritmo do original | Ciclo tirado da luminância medida do original a 10 fps (`ciclo_original.json`), não de fórmula. |
| 56 | Cor diferente do original mesmo com cena parecida | LUT 3D de transferência de cor (MKL) dos nossos quadros para os do original, por mundo, com painel e legenda mascarados (`stack/lut_mkl.py`). |
| 57 | Gotas dos jatos andavam para trás a 7x a velocidade: fase `fract(t / vida)` com a vida mudando a cada quadro (gravidade caindo) | Fase integrada na CPU (`faseJato`: soma de dt/vida), passada como uniforme. Nunca dividir o tempo absoluto por um período que varia. |
| 58 | Paredão de água passava da borda de cima e, claro demais, parecia céu | Crista no terço de cima com céu acima dela; corpo verde-azulado escuro com estrias, crista branca. Conferir com quadro do original lado a lado. |

## 5. Ordem de produção de cada vídeo

1. Leitura óptica a 10 fps + leitura do áudio (classificador + espectrograma) → ficha técnica e mapa de som.
2. Cenas testadas no PC com quadros soltos em meia resolução.
3. G4: vigia → pacote → disparo pelo terminal → render em quadros (32 Chromes de 1 aba) + reparo de glitch + áudio em paralelo → encode → download (conferir nº de quadros) → desligar (conferido).
4. Conferência de imagem (folha de contato + `glitch.py`) e de áudio contra o original antes de entregar.

Scripts em `D:\whatif_es`: `analisar.py` (folhas a 10 fps, OCR das legendas, mapa de som), `g4.py`/`term.py` (G4), `vm_comum/render_seq.sh` + `reparar.py` (render sem flicker), `glitch.py` (varredura do mp4 final), `<video>/audio/mixar.py` (mixagem).
