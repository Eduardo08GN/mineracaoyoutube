# Happy path: avatar real e natural (22/11/2026)

O caminho que já deu certo para fazer um avatar de IA que pareça gente de verdade, do rosto à montagem. Junta o que foi aprendido na Mamaw Opal (Vids Omni, out/2026), na Doña Chayo (MiniMax H3 na G4, 09/11) e na leitura do Elias Yoder. Os docs de cada formato continuam valendo para o detalhe; este é o roteiro curto para o próximo avatar.

> Repositório público: nada de chave, e-mail, ID de canal, link do Drive ou de notebook aqui. Credenciais só no `.env` local.

**Docs de origem:**
- `docs/canais/segundo_a_segundo/limpeza_avatar.md`: rota MiniMax na G4.
- `docs/vsl-massagem-espanha/02-pipeline-avatar-google-vids.md`: rota Vids Omni.
- `docs/referencia-elias-yoder.md` e `docs/divergencias-edicao-fatia01.md`: como o avatar entra na edição.
- `docs/pendencias-otimizacao-avatar-g4.md`: o que falta automatizar.

---

## A regra que decide tudo

"Natural" não vem do modelo mais caro. Vem de cinco coisas:
1. **Rosto congelado:** uma âncora só por personagem, nunca regerado do zero.
2. **Voz que combina com o rosto:** idade, timbre e sotaque.
3. **Look de câmera comum:** foto de celular ou câmera caseira, nunca foto de catálogo.
4. **Falas curtas, cortadas na última palavra certa.**
5. **Pouco tempo de tela, bem distribuído:** de 10% a 18% do vídeo.

Avatar que fala muito tempo seguido, em luz de estúdio, saturado e com fundo desfocado, é o que entrega a IA.

---

## Passo 0. Persona (antes de qualquer imagem)
- **Ficha da persona:** nome, idade, cidade, profissão ou tradição, roupa fixa, 2 ou 3 objetos de assinatura e cenário fixo. Exemplos:
  - Chayo: 58 anos, Puebla, avental florido, trança grisalha, argolas, cozinha de talavera;
  - Opal: avó dos Apalaches, mesa da cozinha.
- **Estereótipo forte e coerente com o nicho** (governanta, avó, fazendeiro, mestre de ofício). O público reconhece em 1 segundo.
- **Ambientação cultural do país do público** (`whatif-es-adaptacao-e-take-inedito`).
- **Variedade entre canais:** rosto, cenário e miniatura não repetem o molde de outro canal (`docs/BADPATHS.md` #8).

## Passo 1. Retrato-âncora (uma vez por personagem)
- Gerar **um** retrato olhando para a câmera, peito para cima, luz de janela. Congelar em `<projeto>/ref/<persona>.png`.
- **Prompt de realismo** (vale para a âncora e para as cenas):
  > amateur smartphone photo, flat diffused window daylight, overcast soft light, deep focus, everything in focus, muted colors, neutral white balance, slight sensor noise, jpeg compression

  - Plano médio, **sem bokeh e sem golden hour**.
  - Terminar com "No text, no cards, no labels anywhere".
- **Pele com textura:** rugas, poros e marcas de idade compatíveis. Recusar pele de porcelana.
- **Poses:** derivar 4 âncoras de pose **editando a âncora** (Qwen-Image-Edit na G4 ou "Editar" no Vids), nunca descrevendo a pessoa de novo. Exemplos de pose:
  - sentada à mesa;
  - em pé junto à janela;
  - diante da prateleira;
  - ao ar livre (fechamento).
- **Aprovação do Eduardo** da âncora e das poses numa folha (SendUserFile) antes de produzir. A partir do vídeo 2, âncora, voz e poses ficam congeladas por canal.

**Armadilha resolvida:** editar a partir da *última* imagem faz o rosto derivar. Editar sempre a partir da âncora original.

## Passo 2. Voz
- **Voz fixa por canal**, escolhida pelo Eduardo entre 3 candidatas.
  - A voz precisa bater com a idade do rosto: voz aguda em avó foi reprovada (Chayo, 09/11). A vencedora era grave e rouca.
  - Salvar a referência em `voz_canal/<persona>_ref.wav`.
- **Motor:**
  - siga o que o canal já usa;
  - nos criativos, **Gemini TTS no AI Studio** (20/11: "narração do Qwen é ruim");
  - não assumir o Qwen3-TTS como padrão de canal novo: perguntar ao Eduardo;
  - narrar **antes** de ligar a G4, porque o AI Studio e o Colab dividem o perfil 12 Ivone.
- **Best-of-3 por frase**, com QA de Whisper (erro de palavra) e nota de naturalidade (UTMOS). Saída a −16 LUFS, com tempos por palavra.
- **Velocidade:** de 140 a 150 palavras/min. Em alemão foi pedido −3%, não −10%.
- **Sotaque conferido** pelo idioma do público (ex.: Carmen = espanhol da Espanha, andaluz suave).

## Passo 3. Takes falando (escolha a rota)

| Rota | Quando usar | Configuração que funcionou | Tempo por take |
|---|---|---|---|
| **MiniMax H3 R2V na G4** (padrão) | vídeo longo, muitas falas, sem cota | âncora da pose + `ref_audio` = a fala já narrada; **0,7 MP** (≥ 1,0 MP pedido, a testar); duração = duração da fala + ~0,3 s | ~5 min a 0,7 MP |
| **Vids Omni** (Dolphin "12 Ivone") | poucas falas, quando a G4 está ocupada | foto da âncora em "Ingredientes", fala **entre aspas, ao pé da letra**, ≤ 10 s (~22 palavras) | 2–5 min, com cota diária |

- **Falas curtas:** de 4 a 5 s, de 2 a 3 por bloco (abre, meio, fecha). Fala longa expõe a boca.
- **Gesto pequeno no pedido**: assentir, mão sobre a mesa, olhar de lado e voltar. Nada de gesto teatral. Variar o enquadramento entre as poses.
- **Ordem da produção:**
  - stack em `.sqfs` no Drive antes de ligar a G4; nunca instalar do zero;
  - reservar pelo porteiro (`T2_DONO`);
  - desligar e conferir no fim.

**Armadilhas resolvidas:**
- **Duração pedida maior que a fala:** o MiniMax enrola sílabas no fim. O corte vai no fim da última palavra certa (Whisper).
- **Omni com dois takes de mesma fala:** transcrever todos.
- **Estrela do Gemini no canto do Omni:** coberta pela logo do canal num círculo 100% opaco, com a posição medida de novo a cada lote.
- **Resolução baixa** (0,2 MP na Chayo 1): ficou ruim. O mínimo é 0,7 MP.

## Passo 4. QA dos takes (antes de montar)
1. **Whisper** palavra a palavra contra o roteiro: reprova fala trocada, palavra comida ou sílaba inventada; refaz com outra semente (até 3×).
2. **Folha de contato:** rosto igual à âncora, mesma roupa, nada de dedo extra, dente derretido, texto inventado ou objeto que se transforma. O veredito visual é do fiscal Qwen3-VL na G4 e do Eduardo; o agente não lê imagem.
3. **Sincronia:** a boca fecha nas consoantes p, b e m. Se descolar, refazer, não "consertar" na montagem.

## Passo 5. Pós e montagem (onde o realismo fecha)
- **Grade de câmera comum** no avatar e no b-roll, igual para os dois (senão o avatar "descola" da cena):
  ```
  eq=saturation=0.85:contrast=0.95,unsharp=5:5:0.4,noise=alls=7:allf=t+u
  ```
  - Recomprimir em crf 23–26.
  - A meta é medir saturação HSV de ~87 e b* de ~10 contra a referência.
  - Provar com 3 stills A/B antes da produção.
- **Enquadramento:**
  - avatar do peito para cima (punch-in de ~1,8x no rosto quando a fonte é plano médio);
  - na tela dividida, faixa de ~1/4 a 45% da largura colada ao rosto, sem cortar a cara.
- **Presença:**
  - avatar de 10 a 18% do tempo, mais nos 2 primeiros minutos;
  - depois, 1 vez a cada 1 a 2 min, por 4 a 6 s;
  - nunca mais de ~70 s fora do quadro (o círculo no canto conta).
  - Numa VSL, o avatar aparece bem mais.
- **Mesma faixa de áudio:** a voz do take falado é a narração. Nunca duas vozes diferentes para a mesma persona.
- **Nenhum take repetido**, nem espelhado nem em outra velocidade.
- Mãos e gestos em câmera lenta de ~0,4 a 0,6x, com interpolação.

## Passo 6. Entrega
- Régua 24 fps (`regua24.py`) e comparação quadro a quadro com a referência do formato antes de mostrar ao Eduardo.
- Marcar no YouTube como **conteúdo alterado ou sintético**. Na descrição: "personaje y voz generados con IA" (no idioma do canal). A persona é personagem, não se apresenta como pessoa real de uma comunidade real (risco visto no Elias Yoder).
- Publicação manual, do Eduardo.

---

## Checklist de 10 itens (rodar antes de mostrar)
1. Âncora aprovada; todas as poses editadas a partir dela.
2. A voz bate com a idade e o sotaque do rosto.
3. A melhor de 3 tomadas por frase, com QA de Whisper e UTMOS.
4. Takes falados de 0,7 MP ou mais, cortados na última palavra certa.
5. Nenhum take com fala errada, dedo extra ou texto inventado.
6. A mesma grade de cor, com grão, no avatar e no b-roll; sem bokeh e sem golden hour.
7. O avatar ocupa de 10 a 18% do tempo, em falas de 4 a 6 s.
8. Tela dividida com a faixa colada ao rosto.
9. Nenhum take reaproveitado.
10. Aviso de IA marcado no YouTube e na descrição.

## Pendências que encurtam este caminho
Detalhe em `docs/pendencias-otimizacao-avatar-g4.md`:
- script único de lote com retomada;
- QA automático dentro da VM;
- grade de passos e MP do MiniMax (10×16 passos, 0,7 × 1,0 MP × upscale);
- pesos dentro da `.sqfs`.
