# K19 e K20 em paralelo (Kriegsmomente, 06/11/2026)

Duas conversas, duas G4, dois vídeos alemães ao mesmo tempo. Decisão do Eduardo de 06/11.

| | K19 | K20 |
|---|---|---|
| Tema | Krupp-Kanonen 1870 (oferta recusada em 1868, aço de retrocarga × bronze de antecarga) | Mars-la-Tour / Todesritt von Bredow (16/08/1870) |
| Conversa | principal (maestro, supervisiona a outra) | conversa K20 |
| G4 | G4-1 (`T2_G4` ausente ou `1`) | G4-2 (`T2_G4=2`, perfil Dolphin da conta 2) |
| `T2_DONO` | `kriegsmomente_k19` | `kriegsmomente_k20` |
| Navegador | perfil da Ivone | perfil da G4-2 (Colab e AI Studio da conta 2) |

Títulos e dados de demanda: `D:/kriegschronik/radar_k19/RELATORIO.md` (§4 para o K19, plano B para o K20).

## Fase 1: batedor único da stack nova (dono: K19)
O que é novo nos dois vídeos é provado uma vez só, em stills, antes de qualquer produção:
1. **Take cinematográfico** no molde do Chernobyl (`D:/pesquisa_nichos/leitura_tesseract_chernobyl/ANALISE.md`):
   - imagem de época gerada na G4, push 2,5D contínuo, fumaça de pólvora, grão, texto com profundidade e número contando;
   - duas opções de estilo para o Eduardo escolher: colódio úmido sépia e óleo de época, puxadas para o creme.
2. **Acabamento do terreno e da animação 3D:**
   - fazer o levantamento de prontos antes (`docs/BATEDOR.md`, passo 0): Fab/Megascans já no disco, GitHub three.js leve (terreno, árvores, grama e casario instanciados) e bake na G4;
   - critério: o que agrega mais visual por menos custo, nunca construir à mão o que existe pronto;
   - fazer um still lado a lado com um take de época.
3. **Narração com Qwen3-TTS na G4:** uma voz alemã fixa do canal, melhor de N por frase, QA com Whisper e UTMOS.

O resultado vira a receita em `docs/receita-k19-stack.md`, que os dois vídeos seguem.

## Fase 1 em paralelo (dono: K20)
Dossiê e roteiro do Mars-la-Tour no método do K18:
- ~2.300 palavras DE, 15–20 min, ~160 batidas;
- cada batida marcada com o tipo de take, nas fatias da distribuição K19+:

| Tipo de take | Fatia |
|---|---|
| Cinematográfico | ~30% |
| Mapa | ~20% |
| 3D/eureka | ~22% |
| Esquema a tinta | ~13% |
| Época 2,5D | ~10% |
| Cartão | ≤ 5% |

- crítico de fatos;
- **nada de render antes da receita aprovada.**

## Regras de convivência
- Cada conversa liga, usa e desliga só a sua G4. Nunca mexer na G4 da outra.
- Não deslogar a conta da G4-2 em hipótese alguma; desligar só o runtime.
- Tema escuro em tudo que for aberto no navegador.
- O mesmo take nunca aparece nos dois vídeos, nem aparece duas vezes num vídeo.
- Projeto em pasta própria (`D:/kriegschronik/k19_*` e `D:/kriegschronik/k20_*`).
- Regras do canal valem: creme, sem música, créditos só na descrição, .txt com 3 títulos e descrição curta.
- A conversa K20 reporta ao maestro no fim de cada fase. Ela não entrega ao Eduardo sem a revisão do maestro.
