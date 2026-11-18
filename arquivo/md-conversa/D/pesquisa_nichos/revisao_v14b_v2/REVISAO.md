# Revisão do v14b v2 entregue (Moltke, 18:06), 03/11/2026

**Método:** o mesmo medidor das referências (24 fps; câmera por correlação de fase; takes por correlação), mais a fração de "cartão escuro" (quadro com luminância < 40 e pouco detalhe, a 2 q/s) e as folhas: `quadros_hi.jpg`, `chk.jpg` e as do minerador.

## 1. Números contra as regras aprovadas e as referências
| Medida | v14b v2 | Regra aprovada | AiTelly (mediana de 10) |
|---|---|---|---|
| Imagem congelada | **0,0%** ✓ | 0% | 0,2% |
| Câmera parada | **36,7%** ✗ | ≤ 10% nos planos 3D | 5,2% |
| Takes distintos/min | 11,0 | — | 16,9 |
| Cartão escuro separado do 3D | **~24%**, 26 trechos ≥ 3 s, o maior com **24 s** (8:33) ✗ | ≤ 10% e ≤ 3 s cada | raro |
| Colorfulness | 17,4 | — | 29,8 |
| Cortes/min | 7,3 | — | 7,6 |

**O que melhorou:**
- o cerco de Sedan como take de mecanismo (terreno, anéis de alcance, contador 774 × 564, relógio 05:40 → 11:00, barra "im Feuer / außer Reichweite");
- a curva de chegada sobre o mapa dos trens (Tag 17, Vorhersage 300.000);
- o Gleisprofil;
- o roteiro novo.

## 2. Falhas (por gravidade)
1. **Cartões escuros vazios separados da cena** (a regra do gráfico dentro do take não pegou neles):
   - "Die Reservisten" quase vazio (4:31–4:53, ~22 s);
   - "Für jedes Regiment ein Fahrplan" com uma caixa só;
   - "Im Frieden festgelegt" com duas caixas;
   - "Bei der Truppe ankommen" com uma caixa e "Kochgeschirr";
   - Reservist → Depot (8:33, ~24 s);
   - linha do tempo da mobilização;
   - gráfico "Truppen am Rhein" vazio em 0 (9:24);
   - Befehlsweg;
   - "Der Weg bis ins Detail".

   É o anti-padrão "esquema que não se constrói, separado do 3D" que o princípio substituiu: uma dimensão só, ~24% do vídeo.
2. **Câmera parada em 36,7%**: os mapas, os cartões e a mesa ficam parados.
3. **Objetos do kit sem o tratamento de desenho:** trem azul de brinquedo, soldados em bloco com "X", mesa de comando com cubos azuis sobre argila cinza. Contorno + toon de 2–3 tons não foram aplicados.
4. **Texto sobreposto:**
   - "Tag 17" sobre "Tag 37";
   - "kein Fahrplan" fantasma por baixo;
   - "SchrittSchrittSchritt 3" encavalado (17:14);
   - cartão da citação cobrindo os blocos do mapa.
5. **Mesma base de mapa voltando** (Aufmarsch em 1:32, 7:36 e 11:13; mapa dos trens em 6:00 e 9:19). O agrupador automático marcou 8,9% de repetição, mas confunde cartões escuros parecidos; o que se vê a olho é a base repetida.
6. **"General Steinmetz · 74"**: ele nasceu em 27/12/1796, tinha **73** no verão de 1870. Já apontado na revisão do roteiro.
7. **Época em sequência no fim:** pinturas, fotos e medalha seguidas em 16:00–18:00.

## 3. Correção mais barata, em ordem de ganho por custo
1. **Trocar os cartões escuros por esquema sobre a cena viva:**
   - Reservist → Depot → Regiment → Zug vira a trilha desenhada sobre o diorama ou o mapa, com os ícones andando;
   - "Für jedes Regiment ein Fahrplan" e "Im Frieden festgelegt" viram rótulo com linha de chamada no trem;
   - o gráfico "Truppen am Rhein" vive no canto do mapa (já existe na versão do Tag 17);
   - o Befehlsweg vira o cavaleiro andando no terreno de Gravelotte com o relógio.

   Reaproveita a narração e o alinhamento.
2. Corrigir as sobreposições de texto, o Steinmetz (73) e o "Schritt".
3. **Câmera andando** em todo mapa e na mesa (dolly lento num eixo).
4. **Contorno + toon** nos objetos do kit (casca invertida + MeshToon).
5. Variar a base dos mapas repetidos (ângulo, recorte, hora do dia) e espaçar as imagens de época.
