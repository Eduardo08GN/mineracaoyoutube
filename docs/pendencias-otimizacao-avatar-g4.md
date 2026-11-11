# PENDÊNCIA: otimização da pipeline de avatar na G4 (tempo e tokens)

**Status:** pendente. Nada abaixo foi implementado. Aprovado pelo Eduardo em 11/11/2026 como direção. Vale para os formatos de avatar com MiniMax H3 na G4: limpeza da Chayo (ES), Pani Halina (PL) e os próximos.

**Contexto:** o desenho está certo (pesado na G4, PC só edita, stack em `.sqfs` no Drive). O custo escapa no que fica em volta da G4. Veja também `docs/BADPATHS-custo.md` (A1, A2, A4, B5).

## 1. Onde escapa hoje
1. **Agente como operador passo a passo.** Cada take lançado, conferido e refeito é um turno que relê a conversa inteira (BADPATHS-custo A1).
2. **Túnel do Colab frágil.** O link expira em ~2 h, e a G4 pode cair sem ninguém ver (10/11: ~1 h perdida no Stickman). Cada queda vira vários turnos.
3. **QA manual.** Reprovar take com fala errada ou dedo extra e pedir de novo é trabalho mecânico feito por agente caro.

## 2. Ajustes (pendências)

### P1. Script único de lote na VM, com retomada
- O agente escreve **só o JSON do lote**: roteiro, planos, prompts e configuração.
- A VM roda voz → imagens → takes → render em sequência, com o estado gravado em disco por item.
- Se a G4 cair: religa e continua do item onde parou, nunca do zero.
- A regra já existe no `CLAUDE.md` (`produzir_lote.py`), mas não achei o script nas pastas do motor onde procurei; para o formato de avatar, acho que ainda não foi escrito. **Escrever.**

### P2. QA automático dentro da VM, sem agente
- **Take falado:** Whisper contra o roteiro. Se errar, refaz com outra semente, até 3 vezes. Corta logo depois da última palavra certa.
- **Take de mãos e imagem:** o fiscal Qwen3-VL (já existe, `olho-g4`) dá nota. Abaixo do limiar, refaz.
- O agente lê **só o relatório final** com os itens que sobraram reprovados.
- **Princípio:** a VM precisa de script determinístico, não de agente. 90% das decisões são regras ("fala errada → refaz"). Modelo local só onde há olho (fiscal de imagem). O agente offline na G4 (gerente Qwen, 09/11) foi descontinuado por isso.

### P3. Sentinela por script, sem tokens
- Script + Monitor emite só em queda, job morto, backlog parado há 10 min, erro e fim (BADPATHS-custo A2).
- Na queda: `canal.py ligar` e retomada pelo P1.

### P4. Uma conversa nova e curta por vídeo
- O contrato fica no doc do formato e no roteiro.
- Sonnet executa, Opus só no roteiro e no veredito.

### P5. Gerar menos segundos nas mãos
- As mãos entram em câmera lenta de 0,4 a 0,5x na montagem.
- Gerar ~3 s e esticar para 6 a 7 s com interpolação de quadros (RIFE ou similar) na G4, em vez de gerar 9 s.
- **Hipótese a medir:** corta mais da metade do tempo de MiniMax das mãos. Os jobs da Chayo 2 estavam com `seg: 9`.

### P6. Upscale contra resolução nativa no avatar
- O custo cresce com os megapixels. O Eduardo pede **≥ 1,0 MP** nos takes de avatar (o degrau acima de 0,7).
- **Teste A/B:** 1,0 MP nativo contra 0,7 MP com upscale de vídeo na G4. Fica a mais rápida que o Eduardo aprovar na folha.

### P7. Pesos dentro da imagem de stack
- O formato de avatar ainda baixa os pesos do Hugging Face a cada ligada (~3 min ou mais). BADPATHS-custo B5 manda pôr os pesos na imagem `.sqfs` do Drive Ultra.
- Conferir se o `comfy_*.sqfs` (MiniMax) já está no Drive Ultra. Se não estiver, regerar na G4-1, nunca subir do PC.
- Fazer os links de leitura da pasta `t2_stacks` para a G4-2 (conta nova de 11/11) e pôr os IDs no `.env`. **Hoje não há nenhum.**

### P8. Reaproveitamento por canal a partir do vídeo 2
- Ficam congelados por canal: rosto-âncora, voz, poses, HUD e miniatura-molde.
- O batedor do vídeo 2 em diante cobre só o que é novo.

## 3. Configuração do MiniMax: a medir, não a chutar
- **Configuração da Chayo 2 (`chayo_02/mm_g1/jobs.json`):** `passos: 10`, `mp: 0.4`, `seg: 9`, voz clonada por `audio` de referência.
- Ainda não se sabe se 10 passos é o ideal nem como o tempo escala a 1,0 MP. **Ler a doc do modelo antes** (portão 4 do `CLAUDE.md`).
- **Batedor em grade** (~6 a 8 takes, ~40 min de G4), medindo tempo por take e qualidade de boca e rosto:

| Variável | Valores |
|---|---|
| Passos | 10 × 16 |
| Resolução | 0,7 MP × 1,0 MP × 0,7 MP + upscale |
| Duração | 5 s × 9 s |

A folha vai ao Eduardo, e a configuração vencedora vira o padrão do formato.

## 4. Voz em polonês (Pani Halina): risco a conferir
- Pelo que sabemos, o Qwen3-TTS (motor da Chayo) **pode não suportar polonês**. Confirmar na doc.
- Se não suportar: motor aberto com polonês na G4 (por exemplo XTTS-v2). Fazer o batedor com 3 candidatas e a aprovação do Eduardo.
- O MiniMax só sincroniza a boca com o áudio de referência; ele não é o problema.

## 5. Ordem de execução
1. Batedor de configuração do MiniMax (§3) + voz polonesa (§4).
2. P7 (pesos e links de leitura) + P1/P2/P3 (lote, QA e sentinela).
3. Vídeo 01 da Pani Halina numa conversa nova (P4), com o roteiro em `D:/producao/pani_halina/formatos/seguranca_avatar/video_01/roteiro.md`.
