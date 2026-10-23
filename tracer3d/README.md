# Tracer3D

**Tracer3D** é o pipeline de **explicador narrado com simulação 3D e dados reais**: catástrofes e fenômenos ("e se um asteroide
caísse em…", supervulcão, bomba nuclear numa cidade, tsunami…) contados por uma voz, com a matemática na tela, mapas de dados reais
e cenas 3D-herói. Nasceu da engenharia reversa do canal Tracer Project
([pesquisa](../docs/pesquisa/tracer3d-2026-10/)) e do empirismo acumulado no **[Eddie3D](../eddie3d/)**.

## Convivência com o Eddie3D
- O Tracer3D é **independente** e **não sobrescreve nada** do Eddie3D: pasta, projetos, assets de saída e documentação próprios.
- Pode **ler e reaproveitar** a biblioteca do Eddie3D (`eddie3d/biblioteca/src`: look com névoa e god rays, flipbooks, céu físico,
  pessoas, árvores, palmeiras, chão molhado) e as ferramentas da G4 (`eddie3d/ferramentas`, `eddie3d/vm`) **sem alterá-las**.
  O que precisar de outro comportamento vira **cópia ou módulo novo em `tracer3d/`**.
- Melhorias gerais (ex.: um bug no upload da G4) são feitas no Eddie3D e o Tracer3D passa a usar; mudanças só do Tracer3D ficam aqui.

## Princípios (herdados do empirismo do Eddie3D — valem em toda produção)
1. **Leitura óptica a 10 fps + áudio** do vídeo de referência (quadros, folhas, OCR, transcrição, PANNs, loudness, ritmo de cortes).
2. **Identificação dos elementos** do vídeo (cenas, objetos, efeitos, cartões, mapas, câmera) com segundo de início e fim.
3. **Batedor** sempre: para cada elemento fraco ou inédito, varredura de repositórios e bibliotecas espertos no GitHub/npm e de
   dados/assets grátis com licença comercial ([BATEDOR.md](../docs/whatif-es/BATEDOR.md)).
4. **Take inédito de 1 minuto** em todo vídeo: um fato curioso e contraintuitivo, verificado em 2 fontes, mostrado em cena.
5. **Transferência cultural** quando o vídeo for para outra língua: lugares, unidades, referências e exemplos do público novo,
   mantendo a física (ex.: a cidade atingida, o vulcão, a costa do tsunami passam a ser do mundo hispânico).
6. **Melhoria esperta para superar a fonte**: ponderar custo baixo × valor alto (ex.: dado real no lugar de arte, um efeito-herói
   bem feito em vez de dez médios), nunca copiar.
7. **Tirar proveito da G4** (GPU do Colab): render em quadros com dezenas de navegadores, raymarching de nuvens e volumes, TTS e
   música/efeitos gerados lá; o PC só orquestra. Desligar a G4 quando não estiver renderizando.

## Etapas
```
tema (radar) → pesquisa e roteiro com números e fontes → física em código (equações, mapas de efeito, tempos)
  → narração TTS (voz em espanhol, licença comercial, na G4) → alinhamento palavra a palavra (tempo de cada cena)
  → cenas: cartões "LA MATEMÁTICA" (KaTeX), mapas de dados, 3D-herói (globo, terreno, fogo, nuvem, onda)
  → batedor → stills na G4 → render → mix (voz + cama + efeitos, −14 LUFS) → glitch → miniatura, Shorts, textos
```

## Stack planejada (a confirmar com o batedor do primeiro vídeo)
| Camada | Plano |
|---|---|
| Roteiro | pesquisa com fontes; números calculados em código e mostrados na tela (ex.: impacto: Collins, Melosh & Marcus 2005) |
| Voz | TTS open-source **com licença comercial** rodando na G4, em espanhol neutro: candidatos Kokoro (Apache 2.0), Piper (MIT), Chatterbox (MIT). **Evitar** modelos não comerciais (XTTS v2/CPML, pesos do F5-TTS) |
| Alinhamento | forced alignment da voz com o texto para cortar as cenas no tempo das palavras |
| Composição | Remotion 4 + three.js/R3F (mesma stack travada do Eddie3D) |
| 3D | globo com NASA Blue/Black Marble + atmosfera, relevo NOAA ETOPO / AWS Terrain Tiles, asteroide procedural, bola de fogo e cogumelo por raymarching, onda e tsunami — reaproveitando `eddie3d/biblioteca` |
| Mapas | Natural Earth (domínio público), OpenStreetMap (ODbL, com crédito), raios de efeito e frentes de onda calculados |
| Cartões | HTML/CSS + KaTeX: fórmulas, contadores, barras, comparações |
| Som | música e efeitos gerados na G4 (ACE-Step, MOSS) como no Eddie3D; cama sob a voz |
| Duração | 12–15 min (tempo de exibição e intervalos de anúncio) |

## Miniaturas (padrão dos canais de guerra, desde 23/10/2026)
Sempre **3 variantes para o Teste A/B** do YouTube, montadas com [`miniaturas/miniaturas_guerra.py`](miniaturas/miniaturas_guerra.py):
- **A — simulação:** quadro forte do vídeo + inset do momento-herói + número grande (ex.: „42 KM HOCH“).
- **B — rosto:** retrato fotorrealista de uma pessoa **fictícia** da época, susto expressivo olhando a ameaça + pergunta-gancho (ex.: „KEIN FLUGZEUG?“).
- **C — híbrida:** rosto + número-chave.

Rostos gerados no Google Flow (Nano Banana, 16:9, ×4, prompt com „no text, no flags, no insignia, no logos“); nunca figura histórica real nem símbolos.

## Onde está o buraco (radar de 23/10/2026)
Em espanhol há pouca oferta para: **humanos desaparecendo/colapso (~84×)**, **o Sol (~19×)**, **erupção de vulcão (~16×)**,
**simulação de impacto de asteroide (~15×)**, **supervulcão (~11×)**, **bomba nuclear em cidade (~8×)**, **asteroide atingindo a
Terra (~8×)**, tsunami (~6×). Português está vazio em quase todo o núcleo. Detalhes e títulos virais:
[docs/pesquisa/tracer3d-2026-10](../docs/pesquisa/tracer3d-2026-10/).

## Estado
- 23/10/2026: nome, princípios, engenharia reversa e radar documentados. Próximo: batedor da voz (teste dos TTS na G4) e o
  primeiro vídeo.
