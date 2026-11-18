# Guia de estilo "ilustrado" (unreal3d, desde 02/11/2026)

Vale para as cenas 3D do Kriegsmomente no Unreal. Substitui o "Schlachtgemälde" cobreado da DIRECAO_DE_ARTE.md,
que o Eduardo reprovou em 02/11: tom cobre monótono, contraluz, silhuetas pretas e nenhuma textura visível.

**Referência aprovada:** ilustração 3D estilizada, como o print "Humans gone for 10 years" (parque com prédios ao fundo).
- A aparência dele está aprovada como está. Não puxar para o realismo.
- Única mudança pedida: a paleta um pouco mais madura (tema de guerra, público mais velho), e só levemente.

## 1. O que faz esse visual (as três camadas precisam bater)

1. **Assets estilizados:**
   - copas de árvore em tufos pintados;
   - capim em cartões;
   - prédios de forma simples com textura pintada, sem foto;
   - poucos detalhes finos.
2. **Luz de dia:**
   - sol alto e de lado, com sombras macias que mostram o volume;
   - céu azul com nuvens;
   - névoa só para dar distância.
3. **Cor:** saturação por cor, não um tom único sobre a imagem inteira; contraste suave.

## 2. Luz (`comum.ceu_ilustrado`)

| Item | Valor | Por quê |
|---|---|---|
| Altura do sol | 40° (`sol_pitch=-40`) | sombras curtas e legíveis |
| Direção do sol | de trás e de lado em relação à câmera (`yaw = câmera + 65°`) | o lado iluminado fica de frente para a câmera |
| Cor do sol | 5900 K, quase branca | sem cobre |
| Céu | Sky Atmosphere + nuvens volumétricas + skylight em tempo real | céu azul com nuvens |
| Névoa | 0.0006, sem névoa volumétrica | só profundidade |
| Fumaça de pólvora | baixa (0.02), só ao fundo | nunca cobrir as figuras |
| Proibido | contraluz, pôr do sol, brasas, sépia | foi exatamente isso que deu o negativo cobreado |

## 3. Paleta madura (`comum.gradacao_ilustrada`)

- **Pós-processo:**
  - saturação 0.9;
  - contraste 1.04;
  - sombras levemente frias (0.95/0.99/1.06) e altas luzes levemente quentes (1.03/1.0/0.95);
  - grão 0.04, vinheta 0.18, sem aberração cromática.
- **Cores de referência (sRGB):**

| Papel | Cor | Hex |
|---|---|---|
| Farda prussiana (dunkelblau) | azul-marinho fechado | `#26304F` |
| Gola, punhos e listra prussianos | vermelho escarlate contido | `#A3302A` |
| Capote francês | azul-acinzentado | `#4A5670` |
| Calção e quepe franceses (garance) | vermelho garança | `#A82A24` |
| Campo de agosto (restolho) | ocre-palha | `#B89A5A` |
| Pasto e sebes | verde-oliva | `#5E6B34` |
| Árvores | verde-musgo + ocre | `#4F6230` / `#A8843A` |
| Pedra e reboco lorenos | creme-acinzentado | `#C9BCA2` |
| Telhado | telha envelhecida | `#8A4A32` |
| Céu | azul limpo com nuvens brancas | `#7FA6D6` |

- **Evitar:** rosa, amarelo-limão, laranja saturado e turquesa, que dão o ar infantil.
- Se um asset vier com essas cores, trocar a cor no material (`Tint`) ou usar a variação de folha mais sóbria do kit.

## 4. Peças realistas no meio do estilizado (`comum.mestre_ilustrado`, passo 3a)

O soldado do Woodhead é realista. Ele entra com o material `M_Ilustrado`:
- textura borrada: mip bias 2.5, o que tira o detalhe fino;
- cor puxada 30% para a média da peça (`paleta_woodhead.json`);
- relevo da normal a 30%;
- rugosidade 0.85 e especular 0.2;
- o prussiano recebe ainda um multiplicador dunkelblau na farda e na calça.

Na prévia local de 02/11 (`assets/mixamo/teste/estilo_lado4.png`):
- **Chapado a 0.55 apagou o vermelho** da gola, dos punhos e do calção. Ficou em 0.3.
- **No Unreal ainda não foi conferido**: precisa do batedor (passo 5).

## 5. Bibliotecas (todas com licença para uso comercial no YouTube)

| Biblioteca | Para quê | Licença | Custo | Tamanho |
|---|---|---|---|---|
| Quaternius **Stylized Nature MegaKit** (Standard) | árvores em tufos (7 tipos de folha), capim, arbustos, flores, pedras; inspirado no Ghibli | CC0 | grátis, 81 modelos | 99 MB |
| Quaternius **Medieval Village MegaKit** (Standard) | casas modulares de pedra e reboco, telhados, portas, janelas, adereços (vila lorena) | CC0 | grátis, 170 peças | 153 MB |
| Quaternius **Ultimate Crops Pack** | trigo e restolho (campos de agosto de 1870) | CC0 | grátis | a medir |
| Quaternius **Farm Buildings Pack** | celeiros e fazendas (Saint-Hubert, Moscou-Ferme) | CC0 | grátis | a medir |
| Quaternius **Fantasy Props MegaKit** | barris, caixotes, carroças, cercas (conferir) | CC0 | grátis | a medir |
| Sketchfab, licença CC0 ou CC-BY | canhão Krupp, carroça de munição, cavalo, igreja lorena estilizada | CC-BY = crédito só na descrição | grátis | caso a caso |
| Fab, pacotes grátis do mês | vila europeia estilizada, se aparecer | licença Fab padrão | grátis | caso a caso |

- **Versões Pro e Source:** a Pro custa $9,99 na itch.io (o site do autor diz que ela também é grátis, conferir na hora de baixar). A Source custa $14,99 e traz o shader de vento do capim e das folhas para o Unreal. Só compro com o ok do Eduardo.
- **Efeito pintado na imagem final (Kuwahara):** os pacotes prontos são pagos ($4 ou mais). Não é necessário para esse visual, porque o print de referência não usa. Se um dia for, dá para escrever o material à mão.

## 6. Regras

- **Planos:** primeiro plano com figuras e textura legíveis; fundo com profundidade por cor e névoa leve.
- **Soldados:** de frente ou de três-quartos para a luz, nunca recortados contra o sol.
- **Batedor:** todo asset novo passa primeiro por um still na G4, comparado lado a lado com a referência, antes da cena inteira.
- **Créditos:** CC0 não exige crédito; CC-BY só na descrição (`feedback-creditos-so-descricao`).
- **Fallback:** `U3D_ESTILO=cobre` volta a versão reprovada (`quadro_schlacht_cobre_0211.py`), só para comparação.
