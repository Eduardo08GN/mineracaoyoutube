# Reconstructed: assinatura do canal, para levar ao espanhol (29/10/2026)

**Missão (Eduardo, 29/10/2026):** levar a assinatura do canal [Reconstructed](https://www.youtube.com/channel/UCdZhRs4wM7SgVXoP9WSW2yA) para um canal em espanhol.
Este é o breadcrumb da análise: método, números, assinatura visual, sonora e de roteiro, stack provável e o que muda para o espanhol.
O roteiro em detalhe (gancho, blocos, frases-modelo e títulos em espanhol) está em [ANALISE_ROTEIRO.md](ANALISE_ROTEIRO.md).
Transcrições, quadros e vídeos de terceiros **não** vão para o repositório: ficam só na máquina, em `D:\pesquisa_tracer\reconstructed\`.

## 1. Método
| Etapa | Como | Script |
|---|---|---|
| Inventário | YouTube Data API v3: uploads, descrições, tags, títulos localizados e **faixas de legenda** (`captions.list`) | [inventario.py](inventario.py) |
| Texto da fala | A API **não** entrega o conteúdo da legenda de canal de terceiros (`captions.download` exige OAuth do dono). O texto veio da legenda automática pública em EN e da legenda ES do canal, via yt-dlp | — |
| Leitura óptica | **20 fps** nos 24 vídeos (28.000+ quadros por hora de vídeo, a 96×54 para as métricas): cortes por histograma e diferença, movimento, quadros parados, brilho, saturação, paleta (k-means) e folha de contato com 1 quadro por plano a 320×180 | [ler20.py](ler20.py) |
| Áudio | Loudness EBU R128 (LUFS e LRA), silêncios e palavras por minuto pelas legendas | `ler20.py` |
| Roteiro | 13 vídeos longos: gancho, blocos, recursos, ética, voz, título×views e guia para o espanhol (agente) | [ANALISE_ROTEIRO.md](ANALISE_ROTEIRO.md) |

## 2. O canal em números (29/10/2026)
- **Origem e tamanho:** criado em 03/10/2026; 21,2 mil inscritos, 5,18 mi views e 24 vídeos (13 longos de 8–38 min e 11 shorts "(3D)" de 1–2 min).
- **Concentração:** flydubai (3,28 mi) + Six Flags (1,07 mi) = 84% das views. Os shorts flopam (≤ 8 mil).
- **Monetização:**
  - bloco de anúncios presente nos vídeos (o controle sem monetização não tem);
  - **patrocínio lido** (SaaS, com QR e "try it free for 14 days") e **Clube de Membros** ("early access", "Reconstructed Plus") com menos de 2 semanas de vida.
- **Multilíngue: o ponto mais importante para nós.**
  - Título, descrição, legenda e **áudio dublado** em ~17 idiomas, **inclusive espanhol** (dublagem automática do YouTube).
  - Um hispânico vê, por exemplo, "Lo que realmente pasó dentro de la cabina de flydubai" já dublado.
  - O radar de 28/10, que via o espanhol "vazio", media só títulos nativos. A concorrência real em ES é **essa dublagem automática** (ver §6).
- **Pauta:** 100% notícia da semana (avião, montanha-russa, ataque a aeroporto, navio, trem na Espanha, tiroteios, enchente, protestos).
  - Vence: **máquina + gente dentro + uma salvaguarda que falhou**.
  - Perde: tiroteio, protesto, geopolítica genérica.

## 3. Assinatura visual (20 fps)
| Medida (mediana) | Longos | Shorts |
|---|---|---|
| Plano mediano | **5,0 s** | 3,1 s |
| Cortes por minuto | 9,3 | 13,7 |
| Quadros quase parados (câmera lenta ou estática) | 75% | 61% |
| Loudness | **−14,3 LUFS** (todos entre −14,1 e −15,0) | −14,3 |
| Fala | **~154 wpm** (agente: 138–151 pelo texto limpo) | 176 wpm |

- **Dois modos de 3D:**
  1. **Editorial branco** (só no hit de 3,3 mi):
     - maquete toda branca ou cinza-clara, sem textura, sombra suave;
     - corte para dentro da cabine; manequins brancos sem rosto;
     - acento azul (rota, gráfico de altitude) e às vezes vermelho;
     - planos longos (mediana de 14,7 s) com câmera deslizando;
     - brilho médio de 205/255.
  2. **Low-poly colorido** (todos os outros):
     - cenário simples (parque, porto, trilho, cidade) com céu em gradiente e árvores simples;
     - o mesmo manequim branco; brilho de 40–110.
- **Camadas recorrentes:**
  - **manequins brancos sem rosto**, com cor só no objeto-chave (trava laranja na montanha-russa) ou no culpado;
  - **documentos e manchetes reais com trecho grifado em amarelo** (relatório da CPSC, Congressional Record, matérias);
  - **fotos reais legendadas** "(file photo)" com lugar e ano;
  - **mapa minimalista** branco ou preto (EUA à noite com pontos de luz, Península Ibérica com rota azul);
  - **relógio do evento** ("Sun 25 Oct 2026 · 5:30 p.m.", "08:21 SAUDI TIME");
  - **cartões de dado** (barra de distância "25 km at ~200 km/h", gráfico de altitude);
  - **cartão de citação** grande com o nome da testemunha;
  - instrumentos de cockpit (fita de altitude) desenhados como UI.
- **Miniatura:** maquete 3D com corte e manequins azul (vítima/herói) e vermelho (culpado), fundo escuro ou céu, e selo vermelho "HOW WAS THIS ALLOWED?". A frase está na miniatura, nunca no título.
- **Tipografia:** grotesca sans (estilo Inter/Söhne) para títulos e citações; mono pequena para rótulos e horários.

## 4. Assinatura sonora e de roteiro (resumo de [ANALISE_ROTEIRO.md](ANALISE_ROTEIRO.md))
- **Voz:** sintética. Cinco descrições declaram voz de IA. O ritmo é quase constante e as frases curtas (~11,5 palavras), com 21% delas trazendo número.
- **Áudio:** mix sempre em −14 LUFS. A cama musical é discreta (não medida com precisão; a fala domina).
- **Gancho (0–2 min, igual nos 13):**
  1. coordenada física e uma pessoa com vínculo;
  2. o corte e um "ninguém sabe por quê";
  3. a lista "esta é a história de…";
  4. as perguntas que devolvem o título.
- **Espinha:** cenário, linha do tempo segundo a segundo, reações, versão oficial, sistema que falhou (com precedente datado), "o que se sabe / o que não se sabe" e fecho em anel. Nenhum pedido de inscrição no final.
- **Fontes:** ~3 atribuições por minuto. A incerteza diz quem não respondeu. Suspeitos não são nomeados e não há imagem de vítima. A descrição funciona como dossiê de fontes datadas.

## 5. Stack provável (hipóteses)
- **3D em tempo real por código:** low-poly simples, céu em gradiente, manequim genérico, sombras de mapa direcional e o mesmo kit de cena reaproveitado entre vídeos.
  - É compatível com **three.js/Remotion** (como o Tracer Project) ou um motor de jogo leve.
  - Não é modelagem artesanal: os cenários são genéricos e os objetos-chave detalhados (cockpit, montanha-russa, trem).
- **Pipeline com agente de IA:** a descrição do hit vazou uma nota interna ("dossier.md §11"), e a voz é TTS. O canal nasceu na mesma semana do Tracer Project, com a mesma estética de "dossiê com dado real". **Hipótese:** mesmo operador ou mesmo kit.
- **Localização:** dublagem automática e títulos e legendas traduzidos pelo YouTube Studio (recursos nativos, custo zero).

## 6. O que muda para o canal em espanhol
- **A concorrência não é zero:** é a dublagem automática do Reconstructed. A análise da legenda ES mostra:
  - tradução condensada e às vezes ruim ("175 metros" no lugar de 175 pés);
  - **nenhuma pauta hispânica**; unidades e referências americanas; voz dublada genérica.
- **Onde um canal nativo vence:**
  1. **pauta hispânica** (o canal só fez um caso espanhol, o trem de 28/10, com 44 mil em 1 dia);
  2. **fontes locais** (CIAIAC, Aerocivil, JST da Argentina, imprensa local) e unidades métricas;
  3. **voz nativa** com tom de reportagem;
  4. **velocidade** em eventos de língua espanhola, onde ele chega tarde ou não chega.
- **Pauta perene com demanda medida em 28/10** (`D:\pesquisa_tracer\radar2\RELATORIO_RECONSTRUCAO.md`):
  - Chapecoense (simulação da Télam, 7,9 mi);
  - Armero (8,4 mi);
  - Metrô Línea 12 (4,9 mi, sem 3D);
  - Avianca 52 (1,5 mi em 3D de simulador);
  - Germanwings (1,1 mi); Spanair; Alvia; ARA San Juan; Tenerife 1977.
- **Ética e monetização:** copiar o cuidado dele (manequim sem rosto, sem vítima, sem nome de suspeito, "o que não sabemos") e evitar tiroteio e narco.
- **A não copiar:** o vazamento de nota interna na descrição e o aviso de IA intermitente. Declarar a voz sintética sempre.

## 7. Arquivos
- [inventario.py](inventario.py): inventário pela API.
- [ler20.py](ler20.py): leitura óptica a 20 fps e áudio.
- [ANALISE_ROTEIRO.md](ANALISE_ROTEIRO.md): análise do roteiro e guia para o espanhol.
- Local, fora do repositório: `D:\pesquisa_tracer\reconstructed\` (`inventario.json`, `a/<id>/analise.json`, `a/<id>/folha.jpg` e os vídeos baixados para análise).
