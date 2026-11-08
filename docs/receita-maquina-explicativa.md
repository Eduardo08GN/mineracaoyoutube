# Receita: máquina explicativa (vale para Kalem/Levha, teardown, machine-skill e Remotion)

Base: o artigo de Elvar sobre a skill teardown (X, 30/10/2026; github.com/elvarofficial/teardown, MIT, construída sobre whaleyxbt/claude-motion), que o Eduardo mandou em 04/11. Aqui fica o método, resumido; o artigo original traz os prompts completos.

1. **Referência antes de tudo.** Uma imagem real da máquina: corte de manual, foto, gravura de época (PD/CC0 no Kriegsmomente). Sem referência, o resultado sai um "brinquedo genérico"; com uma só, o modelo reconstrói peça por peça.
2. **O modelo primeiro.** O mecanismo inteiro é uma função pura de UMA entrada (curso, ângulo da manivela, tempo do sinal Morse), com números reais e conferidos à mão. A prova vai no relatório, e o número duvidoso é marcado com a fonte. Peça, mostrador, rótulo e linha do tempo leem dessa função; nada é animado à mão.
3. **O console.** Um número grande ao vivo; um gráfico que anda com a peça (é ele que segura o espectador); o mecanismo redesenhado em 2D a partir do mesmo modelo; rótulos com linha guia fina. Nenhum número digitado.
4. **O visual.** A máquina ocupa 60–70% do quadro; uma cor de acento para a peça que está trabalhando; a câmera em 3/4 quando de frente o mecanismo vira uma grade; peça clara ganha contorno de tinta ou chão mais escuro.
5. **O crítico.**
   - Um still em cada batida, lido.
   - As transições percorridas em passos de 0,2 s, procurando salto.
   - Colisão é corrigida com um número no bloco de parâmetros, nunca escondida pela câmera.
   - Os stills saem NA G4.
6. **O filme.** `render(t)` é função pura do tempo: cada quadro é capturado em sequência (sem gravador de tela) e passado ao ffmpeg em H.264 yuv420p com faststart. Depois, uma folha de contato de cada batida.
7. **O som.** Programado na mesma linha do tempo: cada clique cai no seu evento (no Kalem, pelo `olaylar.json`). O mix sai a −14 LUFS com pico verdadeiro abaixo de −1 dB. No Kriegsmomente não há música, só efeitos pontuais.
