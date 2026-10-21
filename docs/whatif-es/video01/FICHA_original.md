# Ficha técnica: "What If Earth Spun Faster and Couldn't Stop?" (What If Sim, cqlHrns32sg)

7:37 · 1080p30 · 423 mil views em 3 dias · áudio só música, -13,9 LUFS, sem narração
Leitura óptica: 4.570 quadros a 10 fps (ref/q10), métricas por segundo em ref/metricas.png

## Estrutura
- 16 capítulos de ~30 s. Cada capítulo é um plano contínuo de câmera lenta (drone, empurrão, órbita) e entre eles há fusão ou corte seco.
  A detecção de cena acha só 1 corte duro: o vídeo é quase todo plano-sequência.
- Contador principal "ONE DAY LASTS" cai sem parar: 24 h 00 m (0:04) → 21 h (1:00) → 16 h 42 (1:34) → 8 h 11 (2:20) → 4 h (3:00)
  → 2 h (3:28) → 1 h 40 (3:58) → 1 h 22 (5:08) → 1 h (5:36) → 48 min (5:50) → 30 min (6:16) → 10 min (6:44) → 1 min (7:14).
  Curva acelerando; reextrair os valores exatos por OCR do painel antes do roteiro final.
- Painel (canto superior esquerdo): rótulo pequeno espaçado · número grande serifado · linha "YOU WEIGH x LB" (· "THE GROUND FEELS TILTED 25°")
  · local · linha laranja "THE EQUATOR MOVES FASTER THAN <comparação>". Legenda: serifa itálica, centralizada, 1 frase por vez.
- Densidade de movimento: baixa e estável até 2:30. Picos de 2:33 a 4:23 (ciclo dia/noite acelerado, brilho e saturação oscilando),
  sobe de novo no fim (anel, crosta).

## Cenas (capítulo · cenário · ação · objetos)
| Tempo | Cenário | Ação principal | Objetos e efeitos |
|---|---|---|---|
| 0:00 | Terra com anel (prévia do final) | "In 7 minutes, this is Earth." | Esfera texturizada, anel de rochas instanciadas |
| 0:04 | Orla equatorial vista de drone | dia normal, câmera desce devagar | Calçadão com piso em lajota, fonte com jato de partículas, ~25 palmeiras, ~150 pessoas, carros, bancos, guarda-sóis, posto de salva-vidas, mar com espuma, barcos ao fundo |
| 0:29 | Praia ao nível do chão | o mar sobe a praia | Água rasa com cáusticas, guarda-sóis e cadeiras boiando, pessoas correndo, sombras de palmeira |
| 1:00 | Cannon Beach (Oregon) | o Pacífico recua | Haystack Rock low-poly facetado, casa de tijolo, estrada com faixa amarela, gente andando |
| 1:33 | Terra do espaço | os oceanos migram para o equador | Esfera com textura dia/noite (luzes das cidades), terminador |
| 2:02 | Oregon de novo | terremoto, a casa desmorona | Nuvem de poeira, casa em pedaços, gente caída na estrada |
| 2:33 | Cidade costeira de drone | dias passando em segundos | Prédios em caixa com janelas, avenida com carros, praia, ciclo dia/noite rápido, luzes acendendo |
| 3:00 | Calçadão à noite e de dia | você fica mais leve | Céu estrelado, fonte, multidão, mar |
| 3:29 | Santa Monica, píer | o chão "inclina" 25° | Píer com roda-gigante, postes, gente deitada, câmera inclinada |
| 3:58 | Fonte de baixo para cima | a água quase não cai | Milhares de partículas de água, céu azul, palmeiras |
| 4:23 | Orla de drone | ausência de peso | Objetos subindo |
| 4:53 | Orla | os oceanos chegam | Paredão de água com névoa, objetos e pessoas voando |
| 5:18 | Terra do espaço | achatamento, ar escapando | Esfera achatando, halo |
| 5:47 | Terra com anel | escape do equador | Anel de rochas instanciadas, Terra encolhendo |
| 6:16 | Terra derretida | a crosta se abre | Esfera laranja (magma) no meio dos detritos |
| 6:45 | Lua em primeiro plano | a Terra é um anel distante | Lua texturizada, disco de detritos |
| 7:15 | Telas de texto | "You started on a 24-hour day." / "Is any of this real?" / próximo vídeo | |

## A stack do criador, deduzida pela imagem (rota inteligente)
- **three.js / R3F renderizado quadro a quadro.** Nada de volumétrico pesado:
  - nuvens = tufos em billboard com base achatada (drei `<Clouds>`) sobre um céu com cirros (textura ou gradiente);
  - mar = shader `Water` com mapa de normais + espuma em faixa + cáusticas na água rasa;
  - palmeiras, pessoas, carros, rocha, píer = **modelos low-poly prontos** (estilo kits CC0), repetidos com instancing;
  - fonte, chuva de detritos, anel = partículas e instancing;
  - Terra = esfera com textura NASA dia/noite e halo;
  - ciclo dia/noite = cor do céu e da luz animadas.
- Render barato: um vídeo de 7 min por dia é compatível com cenas em tempo real (~10–20 min de GPU por vídeo).

## Ajuste da nossa stack (sem overengineering)
- **Mantém:** R3F + Remotion + G4 (angle-egl), painel/legenda em HTML, `elenco.mjs` (pose coerente).
- **Sai:** nuvens volumétricas da Takram (11 min por 20 s). Entram tufos billboard determinísticos (seed fixa, sem `useFrame`).
- **Fica, se for barata:** atmosfera e perspectiva aérea da Takram (pós-processo leve). Se não compensar, céu em gradiente com textura de cirros.
- **Entra:** biblioteca de assets low-poly CC0 em glTF (palmeira, pessoas com ciclo de caminhada, carros, prédio, rocha, guarda-sol,
  posto de salva-vidas), carregada uma vez e instanciada.
- **Entra:** trilha instrumental (ACE-Step na G4) e efeitos (terremoto, onda), mixados em -14 LUFS.

## Versão em espanhol
- Título: **¿Qué pasaría si la Tierra girara cada vez más rápido y no pudiera parar?** (variante curta para teste: "¿Y si la Tierra girara cada vez más rápido?")
- Painel: "UN DÍA DURA" · "24 h 00 min" · "PESAS 82 KG" · "EL ECUADOR" · "EL ECUADOR SE MUEVE MÁS RÁPIDO QUE EL SONIDO".
- Unidades métricas: 1.670 km/h no equador hoje · 343 m/s do som · ~28.000 km/h da ISS · 40.270 km/h de escape · Haystack Rock 72 m · Apolo 10 a 39.897 km/h.
- Física a recalcular para o painel: peso no equador = 82 kg × (1 − (24 h / T)² × 0,00346); fica zero em T ≈ 84 min.
