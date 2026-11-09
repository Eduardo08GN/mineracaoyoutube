# Segundo a Segundo · formato "limpeza com avatar" (pipeline, 09/11/2026)

Vídeo em espanhol de 15–20 min em que uma especialista em limpeza (avatar de IA) ensina N costumes ou truques de limpeza que pouca gente faz certo. O molde de batida e de b-roll é o canal **Mrs. Whitmore's Housekeeping** (vídeo de referência: "11 Things You Only Notice in Upper Class Homes"). O vídeo 1 (Doña Chayo, 13 truques) saiu no molde antigo (batida Mamaw Opal); daqui em diante vale este documento.

> Repositório público: aqui não entram chaves, e-mails, IDs de canal, links do Drive nem de notebook. Credenciais e IDs ficam só no `.env` local.

---

## 0. Regras fixas do formato
- **Persona:** Doña Chayo (Rosario), 58 anos, de Puebla, México. Avental florido, trança grisalha, argolas de ouro, cozinha mexicana com talavera. Ambientação sempre hispânica.
- **Voz:** Qwen3-TTS, **voz D** (grave, rouca, ~68 anos). A referência fica em `limpeza_avatar/voz_canal/chayo_voz_D_ref.wav`. É a mesma voz na narração e no avatar.
- **Nada raso:** todo truque vem de pesquisa na web com fonte (§2). Truque genérico ou "dica de blog" não entra.
- **Sem política, sem violência.** Produtos perigosos (cloro, amoníaco) só com o aviso de segurança na fala e na descrição.
- **Créditos e fontes só na descrição**, nunca na imagem.
- **Pesado roda na G4.** Toda stack vira imagem `.sqfs` no Drive da conta Ultra (G4-1) **antes** de ligar as G4. A G4-2 lê por link só de leitura e nunca monta o Drive dela. **Nunca instalar do zero.**
- Publicação manual, do Eduardo.

## 1. Escolha do tema
- Tema e títulos vêm da sessão de **Mineração** (API do YouTube, modelando Mrs. Whitmore e medindo a corrida EN×ES). Nunca repetir micronicho.
- Saída: tema + 3 títulos para o Teste A/B, que espelham a forma do título viral de referência.

## 2. Pesquisa dos truques (o passo que dá valor ao vídeo)
Feito pelo maestro com agentes de pesquisa na web, antes de qualquer roteiro.
1. **Levantar 25–30 candidatos** para o tema em fontes confiáveis:
   - guias de universidades de extensão (EUA, Espanha, México);
   - CDC, EPA, USDA/FSIS e Secretaría de Salud;
   - fabricantes (instruções de uso e de diluição);
   - estudos e artigos técnicos (química de limpeza, microbiologia doméstica);
   - fóruns de profissionais de limpeza e de restauração, só para a ideia, que depois se confirma numa fonte forte.
2. **Filtrar** cada candidato por 4 critérios. Fica o que passa nos 4:
   - **útil na rotina** (a pessoa faz amanhã com o que tem em casa);
   - **pouco conhecido ou feito errado pela maioria** (tem o "ah, eu fazia ao contrário");
   - **tem um porquê explicável** para um leigo mais velho (química, tempo de contato, material);
   - **seguro**, sem mistura perigosa e sem dano a superfície.
3. **Fichar** cada truque que passou em `hacks_pesquisa.md`:
   - o erro comum e o jeito certo;
   - o porquê em 1 frase;
   - a quantidade, o tempo ou a medida exata (vira o "número grande" do HUD);
   - a ação de mãos que mostra o truque (vira o take de mãos);
   - o objeto da prancha;
   - a fonte com link (vai só para a descrição).
4. Escolher **N = 10 a 13** truques e ordenar do mais surpreendente para o mais prático, com um forte no fim.

## 3. Roteiro
- Fala no estilo da governanta: primeira pessoa, memória de quem trabalhou décadas em casas, frases curtas, autoridade calma, nada de "hoje vou te ensinar".
- **Estrutura:**
  - gancho (~1 min) com a promessa e o primeiro "erro que todo mundo comete";
  - N blocos, um por truque, com o capítulo igual ao título do truque;
  - fechamento (~1 min): recapitulação das regras e pedido de comentário ("¿cuál hacía al revés?").
- **Cada bloco** segue a batida do §5: gancho falado → erro comum → jeito certo + porquê → medida → regra curta (vira a tarja ✓).
- Frase = ação animável: cada frase precisa caber num take de mãos, numa prancha ou na fala do avatar.
- ~2.300–2.800 palavras. A entrega do roteiro inclui a lista de planos por frase (tipo de take + prompt).

## 4. Voz
- Qwen3-TTS Base clonando a voz D, best-of-3 por frase.
- QA com Whisper large-v3 (WER) + UTMOS; saída a −16 LUFS.
- Timestamps por palavra: cada take e cada elemento do HUD entra ancorado numa palavra.

## 5. Batida (molde da governanta, medido a 24 fps em 09/11)
Medição: 133 planos, 11,2 cortes/min, plano mediano 4,6 s.

| Tipo de take | % do tempo | Duração | Como fazemos |
|---|---|---|---|
| **Mãos fazendo a ação** (primeira pessoa, ação mínima: apontar, segurar, pingar, girar, passar o pano) | ~50% | 4–5 s | Qwen-Image-Edit gera o primeiro quadro (mãos da Chayo, mesma manga/avental) → **MiniMax H3 sem áudio**, 0,4 MP, prompt de UMA ação simples |
| **Prancha esquemática** (papel creme, gravura colorida, título condensado, selos e caixas vermelhas com setas, linhas de chamada) | ~16% | 6–10 s | ilustração no Qwen-Image **sem nenhuma letra**, fundo liso; todo o texto e a animação no Remotion |
| **Avatar falando** em tela cheia | ~13% | ~5 s | MiniMax H3 R2V com a voz D, **0,4 MP** + granulado leve; **4 poses** por vídeo |
| **Ambiente sem pessoa** (cômodo, pátio, lavadero) | ~10% | ~4 s | Qwen-Image + movimento lento de câmera |
| **Tela dividida** (avatar \| ação) | ~4% | ~5 s | Remotion compõe dois takes |
| **Foto colada com fita** + etiqueta de papel rasgado, fundo desfocado | ~3% | ~6 s | Qwen-Image (estilo foto de época, sépia) + Remotion |
| **Avatar fazendo gesto com objeto** | ~1% | ~4 s | MiniMax com a pose em pé |
| **Círculo do avatar** no canto inferior direito, sobre prancha ou mãos | ~6 vezes | — | Remotion |

**Batida de cada truque:** avatar abre a dica → 3 a 6 takes de mãos/ambiente → prancha (meio da dica) → mãos + tarja de regra ✓ → avatar ou tela dividida fecha. O avatar nunca fica fora do quadro mais de ~70 s, e o círculo conta como presença.

**Fechamento:** prancha de recapitulação em letra manuscrita → prancha de pedido de comentário → takes de mãos → tarja final.

**Fora até existir:** o take do entregável (livro/guia com QR).

### Poses do avatar (4 por vídeo, variar entre vídeos)
Cada pose tem um retrato-âncora gerado no Qwen-Image-Edit a partir do rosto da Chayo. Exemplos:
- sentada à mesa da cozinha;
- em pé junto ao lavadero ou à janela, com a mão na cesta ou no balde;
- diante da prateleira de panos e produtos;
- de pé no pátio, entre vasos (para o fechamento).

## 6. HUD (Remotion, o vídeo inteiro)
- **Barra de 1 a N** no canto superior direito: quadradinhos bege; o atual em vermelho, os vistos com ✓ verde.
- **Tarja de regra:** faixa de papel rasgado embaixo, letra condensada preta + ✓ verde. Cerca de 1 por truque.
- **Número grande** com tracinho vermelho e legenda ("10 MIN / DE CONTACTO DEL CLORO"). 5 a 6 por vídeo.
- **Rótulo vermelho** pequeno sobre a peça na cena.
- **Recorte com contorno branco** e profundidade (objeto na frente, HUD por cima) para dar movimento.
- Os textos de tela vão em espanhol, curtos (≤ 5 palavras).
- **Base:** o kit Remotion creme do Kriegsmomente (`D:/producao/_motor/modelo/v1/src/kit`). Não existe template pronto de papel rasgado com fita (levantamento de 09/11).

## 7. Produção na G4 (as duas em paralelo, até ~80% de VRAM cada)
1. **Antes de ligar:** conferir que as imagens `.sqfs` estão no Drive Ultra (`t2_stacks/segundo_a_segundo/limpeza_avatar/`):
   - ComfyUI + MiniMax;
   - Qwen3-TTS;
   - Qwen-Image;
   - Remotion.

   Os pesos vêm do HF (~3 min).
2. Ligar a G4-1 com Drive (`T2_DRIVE=1`, o clique em "Permitir" está autorizado) e a G4-2 sem Drive, com `T2_DONO` do vídeo.
3. **Fila paralela:**
   - narração (TTS);
   - imagens Qwen (até 4 trabalhadores em 2 placas);
   - takes MiniMax: avatar com áudio e mãos sem áudio, divididos entre as placas por duração;
   - render Remotion.
4. **Vigia ativo** a cada 3 min nas duas placas:
   - alerta de parada após 15 min sem progresso;
   - quando o link do proxy expira (~2 h), roda `ligar` de novo; a VM continua viva.
5. **Desligar as duas G4 no fim** e conferir (`saude` = G4_FORA).

## 8. QA antes de montar
- **Takes falados:** Whisper palavra a palavra contra o roteiro; cortar logo depois da última palavra certa (o MiniMax enrola sílabas quando sobra duração).
- **Takes de mãos:** folha de contato; reprovar dedo extra, objeto que se transforma ou ação diferente da pedida, e refazer com outra semente.
- **Imagens:** sem texto inventado em rótulo (pedir "plain unlabeled"); identidade da Chayo igual à âncora.

## 9. Montagem, régua e entrega
- Remotion monta takes, HUD e pranchas ancorados nas palavras. O áudio sai só da narração, a −16 LUFS, sem música contínua.
- **Régua 24 fps** (`regua24.py`) no vídeo pronto, comparada com a governanta:
  - corte ~11/min;
  - plano mediano ≤ 5 s;
  - mãos em vídeo ≥ 40%;
  - pranchas 12–20%;
  - avatar 12–18%.
- **Comparação quadro a quadro** com a referência antes de mostrar ao Eduardo.
- **Entrega:** `entrega/` com o mp4 (conferido com ffprobe) + txt com:
  - 3 títulos;
  - descrição curta;
  - capítulos = os truques;
  - fontes;
  - aviso "personaje y voz generados con IA".

## Onde está cada coisa (PC)
- **Pesquisa e roteiro:** `D:/pesquisa_nichos/limpeza_es/`. Contém `hacks_pesquisa.md`, `roteiro_v1.md`, `MAPA_GOVERNANTA.md` e `ref/` (legendas e régua da referência).
- **Formato:** `D:/producao/segundo_a_segundo/formatos/limpeza_avatar/`. Contém `ferramentas/`, `minimax_vm/`, `qwen_batedor/` e `voz_canal/`. Cada vídeo fica em `chayo_NN/`.
- **Imagens da stack:** `D:/t2_stacks/segundo_a_segundo/limpeza_avatar/` (cópia local) e no Drive Ultra.
