# Leitura ótica a 24 fps: What If Sim, "What If Earth Spun Faster and Couldn't Stop?" (05/11/2026)

O vídeo é de @whatifsim3d: 1,56 mi de views, 5,2 mil likes e 527 comentários, num canal de 5,1 mil inscritos e 23 vídeos. Dura 7:38.
- Os arquivos estão em `D:/tmp/ref_cql/`: o vídeo, `leitura24.txt`/`.json` e as folhas `folha_1..4.jpg`, uma a cada 6 s.
- A medição usou o mesmo script do Elapsed (`ler24.py`).
- **Esta é a referência de DINAMISMO do What If ES.** O Elapsed fica só como referência visual.

## Números

| | What If Sim | Elapsed | K17 v2 |
|---|---|---|---|
| movimento médio | **2,11** | 0,99 | 1,31 |
| quadros quase parados | **24%** | 44% | 46% |
| estrutura | ~10 cenas em **plano contínuo e longo** (162 s, 68 s, 120 s), sem corte seco, sempre com algo se mexendo | 40 planos fixos de ~14 s | 59 batidas |
| áudio | trilha contínua, **sem narração** (a legenda automática só inventa "Heat") | trilha e ambiente | voz e efeitos |

Os ~25 "cortes" que a régua marca entre 166 e 207 s não são cortes. São **dias e noites passando em segundos** (o brilho alterna 130/30): o próprio efeito que o roteiro descreve ("Sunrise to sunset: less than 3 hours").

## Por que ele é dinâmico

1. **A simulação nunca para dentro do plano:**
   - multidão de bonecos simples andando, tropeçando, flutuando;
   - mar subindo, fonte cuja água não desce, casa arrastada virando poeira, píer inclinando;
   - dia e noite acelerados, Terra girando, anel de detritos.
   - A câmera faz só dolly lento.
2. **Um único número manda em tudo:** "ONE DAY LASTS 24 h 00 m → 1 min", grande, no alto à esquerda. Embaixo, 2 ou 3 grandezas derivadas: "YOU WEIGH 180 LB → NOTHING", o lugar ("THE EQUATOR", "CANNON BEACH, OREGON", "SANTA MONICA") e uma comparação em dourado ("FASTER THAN SOUND → A RIFLE BULLET → THE SPACE STATION → ESCAPE VELOCITY").
3. **Lugares reconhecíveis que se repetem e pioram a cada visita:**
   - calçadão do equador;
   - Cannon Beach com a casa e o Haystack Rock;
   - a Terra vista do espaço;
   - Santa Monica com o píer;
   - a fonte.
   - O espectador volta ao mesmo lugar e vê a mudança. É a mesma lógica do Elapsed, com 5 cenários.
4. **Uma frase curta em serifa itálica por batida,** com causa e efeito em linguagem de leigo ("The oceans start sliding toward the equator.", "A step sends you flying.").
5. **Escalada até o absurdo cósmico,** seguida de um cartão honesto "Is any of this real?" (números reais e o que é palpite), da pergunta para os comentários e da ponte para o próximo vídeo ("Now watch what happens if you got heavier").

## Visual

- Engine em tempo real com pacotes prontos: palmeiras, calçadão, guarda-sóis, carros chapados, prédios low poly, bonecos low poly coloridos em multidão.
- Mar estilizado com espuma, nuvens e céu de pacote, globo com textura da NASA.
- Nada modelado à mão com detalhe: o valor está na simulação e no número.

## Stack corrigida para o What If ES narrado

| Camada | Ferramenta | Onde |
|---|---|---|
| Cenários | **Unreal 5 (pipeline `unreal3d`, motor via `.sqfs` no Drive) + bibliotecas do Fab já na conta**: Low Poly Nature Essentials, Stylized Nature Pack, Small Town, Large Low Poly Building, Modern Street Props, Flat Style Vehicles, Voxel Sand & Beach, guarda-sol, bola, pranchas, veleiro, Cozy Nature, StyleHex Forest, MW Landscape, Realistic Starter VFX | G4 |
| Simulação | multidão (bonecos low poly + Mass/Crowd ou agentes simples), água (plugin Water), Niagara (fonte, poeira, detritos), dia e noite acelerados (Sun Position / Sky Atmosphere), tudo dirigido por **um parâmetro** (ex.: duração do dia) num spec JSON | G4 |
| HUD, legenda, cartão final | Remotion: o número que manda, 2–3 grandezas derivadas, comparação em dourado, frase em itálico, "¿Algo de esto es real?" | G4 |
| Narração ES | AI Studio (Ultra). A frase da tela vira a fala, e a tela mantém a versão curta | AI Studio + G4 (alinhamento) |
| Trilha e efeitos | ACE-Step instrumental + Demucs; efeitos do MOSS | G4 |
| Régua | `ler24.py`: meta de movimento ≥ 2 e quadros parados ≤ 25%, lado a lado com o What If Sim | PC |

Adaptação ES:
- lugares hispânicos reconhecíveis (malecón de Guayaquil/Quito no equador, Acapulco, Malecón de La Habana, Valparaíso…);
- comparações locais;
- unidades métricas (kg, km/h).
