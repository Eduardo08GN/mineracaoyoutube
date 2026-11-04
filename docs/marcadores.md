# Pipeline oficial de marcadores, textos e destaques (04/11/2026)

*Aprovada pelo Eduardo em 04/11. Vale para todos os canais: Segundo a Segundo, Kriegsmomente e Chroniques. Aplica `docs/take-explicativo.md`: o marcador torna visível o abstrato **no objeto ou no lugar**. Das referências (AiTelly, Reconstructed) vem o princípio, não o visual.*

## 1. Princípio
O marcador é **o dado morando no espaço**. Ele:
- entra **na palavra** da narração e sai quando a ideia acaba;
- fica preso ao objeto ou ao lugar (a cota na cratera, a régua na queda, a seta no movimento), nunca solto num cartão;
- responde: "que abstrato desta frase este marcador torna visível?". Sem resposta, não entra.

## 2. Vocabulário (8 tipos)

| Tipo | Torna visível | Exemplo Segundo a Segundo | Exemplo Kriegsmomente |
|---|---|---|---|
| **Cota** (seta dupla + número) | tamanho, distância | largura da cratera | calibre, comprimento do cano |
| **Régua vertical** com marcas | altitude, queda, altura | "200 m por segundo" | altura de fortificação, trajetória |
| **Vetor** (seta no sentido do movimento) | velocidade, direção, força | o mergulho a 0,9 Mach | avanço de uma coluna, recuo da peça |
| **Anel / alcance** | raio, área, distância | 2–6 km da cratera | alcance do canhão, raio do telégrafo |
| **Trilha** (feita sólida, prevista tracejada) | rota, plano × realidade | Austin → Bahamas | marcha planejada × real, linhas férreas |
| **Rótulo com linha guia** | nomear uma peça ou lugar | "timón de profundidad" | "Verschluss", "Metz" |
| **Destaque de peça** (brilho seletivo, raio-X) | a peça da história | o estabilizador que se soltou | a culatra, o vagão, o fio |
| **Número gigante deitado no terreno** | o número do clímax | a velocidade no impacto | os dias de mobilização |

## 3. Como é feito (técnica)

| Camada | O quê | Ferramenta pronta |
|---|---|---|
| **3D no mundo** | cota, régua, vetor, anel, trilha, número no terreno | `troika-three-text` (MIT, texto SDF nítido, deitado, alinhado ou de frente para a câmera); `Line2`/`LineMaterial` (three addons) com tracejado; desenho progressivo pelo offset do tracejado |
| **Destaque** | brilho só na peça, raio-X do objeto | bloom seletivo (`threejs-bloom`, restaurando o material) + emissivo / fresnel por `onBeforeCompile`; `OutlinePass` quando precisar de contorno |
| **2D por cima** | HUD, rótulo com linha guia | SVG + GSAP **DrawSVG**; números com contagem e **ScrambleText**; texto com **SplitText**. Desde 2025 todos os plugins do GSAP são gratuitos e vêm no pacote `gsap` |
| **Mapa 2D** (Kriegsmomente) | o mesmo vocabulário | Remotion (`remotion-markup`, `remotion-maps`) |

**Regras de render:**
- Os marcadores 3D são desenhados **depois** da média de subquadros (o motion blur), com a câmera do instante central, numa cena própria. Assim ficam nítidos e com a perspectiva certa. O destaque de peça fica na cena principal, porque é material do objeto.
- A animação é toda por timeline GSAP pausada com `seek(t)`, para ser determinística (`render(t)` puro).
- Ordem dos passes: AO → bloom → SMAA → OutputPass → cor/grão. O SMAA vem antes da saída de cor (skill `threejs-postprocessing`).

## 4. Autoria declarativa (ninguém anima à mão)
Cada batida do plano declara os marcadores como dados. O tempo sai do alinhamento da voz (`alinhamento.json`: as âncoras são palavras).

```json
{"batida": "08_02", "marcadores": [
  {"tipo": "anel", "centro": "cratera", "raio_km": [2, 6], "texto": "2–6 km", "entra": "palabra:kilómetros", "sai": "fim_da_frase"},
  {"tipo": "destaque", "peca": "profundor_esq", "modo": "brilho", "entra": "palabra:timón"}
]}
```

## 5. Gramática visual (fixa por canal)
- **Uma fonte** condensada livre (OFL), em caixa alta, com espaçamento leve.
- **Paleta semântica de 3 cores:** branco para o dado, **laranja-sinal** para a peça ou o perigo, **azul-frio** para a trajetória. A cor diz o que o marcador é.
- **No máximo 2 marcadores** ao mesmo tempo; texto de até 4 palavras; número sempre traduzido ("200 m = la Torre Latinoamericana en 1 s").
- O marcador nunca cobre a peça que explica: a posição sai da máscara do objeto (`feedback-overlay-espaco-vazio`).
- **Entrada e saída:** desenho progressivo de 0,3–0,6 s; o número conta até o valor; a saída é um fade de 0,3 s. Nada de pulo, giro ou efeito de apresentação de slides.

## 6. Próximos passos
1. Batedor na G4: os 8 tipos na cena do Learjet (um still de cada) e a ordem dos passes corrigida.
2. Módulo `marcadores.js` no teardown: lê a lista da batida e anima pelo relógio.
3. O mesmo esquema no Remotion para os mapas do Kriegsmomente.
