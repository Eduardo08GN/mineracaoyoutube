# Teste de 10 planos: Tomiko em espanhol no formato "governanta" (08/11/2026)

## Objetivo
Provar que a IA local na G4, usada de forma inteligente e barata, chega a um vídeo natural no molde do canal "Mrs. Whitmore's Housekeeping". O vídeo deles: "11 Things You Only Notice in Upper Class Homes" (11:46, 23 mil views em 7 dias).

Diferenças da nossa versão:
- a apresentadora é a **Tomiko 55**, e não a senhora inglesa;
- a língua é o **espanhol** neutro;
- o tema é casa e limpeza, com hábitos de "casa bem cuidada".

**Não é produção.** São 10 planos de 4 s mais 1 folha lado a lado. O que se mede é o custo.

## Leia antes (em ordem)
1. `D:/tmp/consolida/docs/LEIA-PRIMEIRO.md`: regras de toda sessão.
2. `D:/pesquisa_nichos/leitura_modelo_Nfgd8L7dZQc/ANALISE.md`: o que foi medido no vídeo de referência (planos de 4,00 s, ~30 fps, câmera quase parada, mãos em POV, apresentadora com lip-sync, ~720p com halo de upscale, grão).
3. `D:/tmp/consolida/docs/g4-imagem-stack.md` e `D:/tracer3d2/canal.py` (funções `ligar`, `preparar`, `exec_vm`, `desligar`, e as notas sobre G4-1 × G4-2 na linha ~352).
4. `D:/mineracaoyoutube-instagram/docs/pipeline-tomiko-limpeza.md` §3: identidade da Tomiko 55.

## Referências locais
- Vídeo de referência: `D:/pesquisa_nichos/governanta_teste/ref/*.webm`.
- Foto da Tomiko 55: `D:/mineracaoyoutube-instagram/data/instagram/avatares/tomiko-casa-bdd9/foto.png`.
- Voz da Tomiko (timbre, em português): `D:/mineracaoyoutube-instagram/research_notes/voz/TOMIKO55_VOZ_OFICIAL_vids4.wav`.

## Tomiko (leia `D:/pesquisa_nichos/governanta_teste/TOMIKO.md`)
- **Versão:** a Tomiko 55, da limpeza.
- **Uniforme fixo:** lenço tenugui índigo com ondinhas brancas, camiseta branca, avental jeans índigo com sashiko e luvas amarelas.
- **Visual:** a sujeira tem cor saturada e a limpeza é extrema; ela age enquanto fala; respeite o orçamento de mãos.
- **Formato:** **16:9 horizontal** (é YouTube longo, não Reel). Troque o fechamento "vertical 9:16" por "16:9 handheld".
- **Voz:** não existe voz dela em espanhol. Gere a fala em espanhol num TTS local e converta para o timbre de `TOMIKO55_VOZ_OFICIAL_rouca2.wav` (rouca e grave) com o `normalizar_voz.py` (OpenVoice, `--tau 0.5`). Corte só os trechos com fala, porque o script vira chiado no silêncio.
- **Proibido:** vídeo para vídeo (Wan Animate) e MiniMax. Aqui é só imagem para vídeo e lip-sync a partir do retrato.

## Os 10 planos
| Tipo | Quantos | Rota |
|---|---|---|
| Mãos em POV com objeto (limpando, dobrando, polindo) | 6 | still de partida → Wan 2.2 I2V |
| Objeto ou cômodo | 2 | só still + movimento lento por ffmpeg (sem modelo de vídeo) |
| Tomiko falando para a câmera, em espanhol | 2 | retrato-âncora + lip-sync local (InfiniteTalk ou Wan 2.2 S2V; confira a licença antes) |

As falas e os prompts dos 10 planos vão num JSON curto (`planos.json`). Copie o tipo de plano e de luz do vídeo de referência, não o texto.

## Receita técnica (a "forma inteligente")
1. **Stills de partida:** Qwen-Image / Qwen-Image-Edit a partir da foto da Tomiko, sempre com as mesmas mãos, avental e luvas.
2. **Animação:** Wan 2.2 I2V 14B em **fp8**, com o LoRA lightx2v de **4 passos**, **480p**, **65 quadros** (~4 s a 16 fps).
3. **UM processo dono da GPU com o modelo carregado uma vez só**, consumindo a fila inteira (sem recarregar por clipe). Rode 2 a 4 workers em paralelo se couber nos 96 GB; meça a VRAM com `nvidia-smi`.
4. **Depois:**
   - RIFE para 30 fps;
   - Real-ESRGAN para 1080p;
   - **acabamento por ffmpeg:** grão leve, leve perda de nitidez, tremido de mão sutil, luz quente de dia.

   A meta é soar como vídeo de celular natural, **não ultrarrealista**.
5. **Voz em espanhol:** frase curta para os 2 planos falados. Tente Qwen3-TTS com o timbre da Tomiko em espanhol e grave a amostra. A voz ainda não está aprovada: é só para o lip-sync.

## G4 e imagem `.sqfs` (obrigatório)
- **Use a G4-1** (`T2_G4=1`, com `T2_DRIVE=1`, `T2_DONO=governanta_teste`). Se outra sessão estiver com job nela, use a G4-2 e grave a imagem no disco da VM. Avise no relatório que a cópia ao Drive ficou pendente.
- **Na 1ª ligada:**
  - instale e baixe tudo NA G4, nunca no PC;
  - gere a imagem `.sqfs` com ambiente e pesos;
  - grave em `MyDrive/t2_stacks/segundo_a_segundo/governanta/` (hash no nome).

  Na próxima ligada a G4 só monta a imagem.
- O link de leitura do Drive vai só para `D:/tracer3d2/.env`, nunca para doc ou git.
- **Se o Drive pedir autorização ("Permitir"), PARE e avise:** quem clica é o Eduardo.
- **Sentinela** (script + Monitor) emitindo só quando o estado mudar.
- Baixe cada saída ao PC na hora, em `D:/pesquisa_nichos/governanta_teste/saida/`.
- **No fim:** desligue a G4 e confira que desligou.
- Nada no C:.

## Critério de parada (definido antes)
- Mais de **2 min de G4 por clipe de 4 s** (já com o modelo carregado): pare e relate.
- Preparação inicial com mais de 60 min sem gerar nada: pare e relate.
- Erro opaco: na 2ª falha igual, leia a doc ou o issue antes de tentar de novo.

## Entrega
- **Arquivos em `D:/pesquisa_nichos/governanta_teste/saida/`:**
  - `teste_10planos.mp4`: os 10 planos concatenados, cerca de 40 s;
  - `folha_lado_a_lado.jpg`: 5 quadros nossos × 5 quadros do vídeo de referência, em tipos de plano equivalentes.
- **Os dois arquivos vão para o Eduardo por SendUserFile.** NÃO abra as imagens no seu contexto.
- **`RELATORIO.md` com:**
  - segundos de G4 por clipe (I2V, lip-sync, RIFE, ESRGAN);
  - VRAM por worker;
  - quantos workers em paralelo;
  - tempo de preparação: 1ª vez × com a imagem;
  - tamanho do `.sqfs` e onde ficou;
  - licenças;
  - o que falhou.
- **Resposta final ao maestro:** no máximo 10 linhas.
