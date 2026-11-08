# Molde barato do Kriegsmomente (a partir do K21)

> **Status (07/11):** alternativa de reserva. O padrão do canal é `docs/pipeline-kriegsmomente.md` (composição do K19/K20).

Proposta de 07/11/2026, para o Eduardo aprovar. O K19 e o K20 custaram ~30% do limite semanal do Ultra e levaram uma noite inteira. A causa foi a estrutura: ~160 takes de 6 famílias, cada família construída por agente, e testes feitos no meio da produção. Este molde junta o truque dos canais dark, que é imagem por frase em movimento, às cenas-instrumento do Tracer, que são o nosso diferencial de compreensão.

**Meta por vídeo:** ≤ 1/10 dos tokens do K19 e 3–4 h de relógio, quase tudo G4 trabalhando sozinha.

## 1. Composição
| Camada | Fatia | O que é | Quem faz |
|---|---|---|---|
| **Dark** | ~70% | 1 imagem de época por frase (~250–300), sempre em movimento, com camadas de efeito | G4, por script |
| **Imagem viva** | dentro dos 70% | 20–30 clipes de 3–5 s (fumaça, fogo, bandeira, cavalo), por imagem → vídeo | G4, lote noturno |
| **Instrumento (Tracer)** | ~30% | 4–6 cenas contínuas que explicam o mecanismo: culatra, régua, alcance no mapa, número contando | Sonnet constrói, a partir do kit |
| **Mapa** | dentro dos 30% | Mapa de época (Commons/David Rumsey) com movimento e seta a tinta, em vez de terreno 3D | Componente do kit |

Regras do canal que continuam valendo:
- creme;
- sem música, só efeitos pontuais;
- câmera nunca parada mais de 4 s;
- nunca reaproveitar take (a imagem de cada frase é nova; a camada de efeito não conta como take);
- créditos só na descrição;
- legendas com até 17 caracteres por segundo.

## 2. Linguagem de câmera e montagem (por regra, sem decisão por take)
- **Movimento:** cada imagem recebe um, por rotação e pelo tom da frase:
  - aproximação lenta: tensão;
  - afastamento: escala e revelação;
  - panorâmica lateral: marcha e coluna;
  - parallax 2,5D por profundidade (Mesa): planos com primeiro plano claro;
  - câmera inclinada: caos do combate.
- **Transição:** uma a cada virada de bloco, com 4 tipos:
  - zoom que entra num detalhe e revela a próxima imagem;
  - corte por forma (roda → relógio, cano → luneta);
  - fumaça de pólvora;
  - tela dividida para comparar (França × Prússia).
- **Texto:** data carimbada, local com linha-guia, número contando, citação à máquina de escrever, todos componentes do Remotion alimentados por JSON.
- **Efeitos, uma biblioteca única CC0:**
  - grão de filme;
  - poeira e arranhões;
  - fumaça e brasas;
  - neblina;
  - vazamento de luz;
  - papel;
  - vinheta.
- **Som:** woosh na transição, estrondo grave na revelação, tiro e cavalo pontuais.

## 3. Fluxo e onde entra o LLM
| Passo | Quem | Saída |
|---|---|---|
| 1. Pesquisa e dossiê | Sonnet + busca | `dossie.md` com fonte por fato |
| 2. Roteiro + 3 títulos | **Opus, uma vez** | `roteiro.md` com cada frase marcada `DARK` ou `INSTR:n` |
| 3. Crítica de fatos | Sonnet | correções aplicadas |
| **Portão A** | Eduardo | aprova roteiro e títulos |
| 4. Plano | Sonnet, uma vez | `plano.json`: o prompt de imagem de cada frase DARK, os 20–30 clipes vivos, as marcas de tempo de cada cena-instrumento, o texto na tela |
| 5. Validador | script | confere fatias, duração, cps e regras; reprova antes de gastar G4 |
| 6. Cenas-instrumento | Sonnet, a partir do kit | 4–6 cenas parametrizadas |
| 7. `produzir.py plano.json` | **G4, sem agente** | narração (voz A) → imagens (Qwen-Image + Lightning de 8 passos, um estilo só) → fiscal visual (Qwen3-VL; reprovada volta à fila) → profundidade → clipes vivos (Wan 2.2) → render em paralelo → mixagem → legendas → 3 miniaturas → ffprobe |
| **Portão B** | Eduardo | aprova uma folha de contato |
| 8. Entrega | script | `entrega/` com mp4, .txt e miniaturas; G4 desligada e conferida |

## 4. Regras de custo
- Uma sessão curta por vídeo, aberta só com este doc e o resumo do tema. Nada de fork de conversa longa.
- Modelos por nível ([[feedback-sonnet-tarefas-simples]]):
  - Haiku: mecânico;
  - Sonnet: execução;
  - Opus: só o roteiro e a revisão final.
- Não ler imagens no contexto. Mandar folhas ao Eduardo sem abrir.
- Testes de estilo ou técnica nova acontecem fora do vídeo, numa sessão própria, e só entram no kit depois de aprovados.
- Sem rodadas extras: o fiscal automático decide o refazer.

## 5. Investimento único (antes do K21)
1. **Kit Remotion congelado:**
   - componente "sequência dark": imagem + movimento + transição + efeitos;
   - 4 transições;
   - textos;
   - mapa de época;
   - 3 a 4 modelos de cena-instrumento (régua, alcance, objeto 3D com destaque, número).
   
   Tudo extraído do que o K18, o K19 e o K20 já têm.
2. **`produzir.py`** com retomada por etapa e download por bloco, e as lições já aplicadas: `MSYS_NO_PATHCONV`, `tar --force-local`, Whisper com array de 16 kHz, URL do proxy relida.
3. **Imagem `.sqfs` no Drive** (e copiada para a conta da G4-2) com os ambientes e os pesos: Qwen-Image + Lightning, Qwen-Image-Edit, Qwen3-TTS, Wan 2.2, Depth Anything, Qwen3-VL. A G4 deixa de instalar e baixar ~60 GB a cada vez.
4. **Biblioteca de efeitos** e o **banco de referências reais** (uniformes, canhões, Commons), já com as licenças.

Custo estimado: ~1 dia de construção, uma vez só, em Sonnet, com revisão Opus no fim.
