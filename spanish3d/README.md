# Spanish 3D

Pipeline do canal-teste em espanhol (laboratório de nichos do canal **Segundo a Segundo**). O formato é o explicador narrado e sem rosto, com **ilustração rica no estilo do Runic, animada do começo ao fim**. Cada etapa pesada roda na G4 (GPU do Colab), que é a nossa vantagem sobre os concorrentes: a maioria anima com zoom lento sobre imagem parada e paga crédito por imagem.

Primeiro vídeo: **"La antigua Babilonia era más extraña de lo que crees"**, modelado a partir de "Ancient Babylon Was Weirder Than You Think" (Nils History, 1,74 mi). Leitura e mapeamento da referência em [`../docs/pesquisa/nils-babylon-2026-10/`](../docs/pesquisa/nils-babylon-2026-10/README.md).

## Por que este pipeline existe

1. **Mineração bidimensional (30/10/2026).** O molde "X era más extraño de lo que crees" (história narrada) está **vazio em espanhol**, enquanto o inglês já está lotado. A janela só existe em formatos narrados, porque a língua é a barreira; formato sem fala não tem buraco de idioma.
2. **Estilo.** Entre os canais dark de história de 2025–26:
   - o palito "ink" feito por IA virou commodity: os clones têm mediana de 2 a 12 mil;
   - ilustração rica (Runic, mediana 167 mil) e IA cinematográfica com cartões em código (Smart Code Studios, 103 mil) seguram a mediana.
3. **G4.** Quem usa ferramenta web com crédito gera uma imagem por cena e a deixa parada. Nós geramos várias versões, escolhemos a melhor e animamos.

## Etapas e onde rodam

| # | Etapa | Onde | Ferramenta |
|---|---|---|---|
| 1 | Leitura da referência: legenda (roteiro), premissa do canal, molde do título. Leitura ótica a 20 fps só quando a referência tiver o mesmo formato visual | local | yt-dlp, API YouTube |
| 2 | Dossiê de fatos (fontes primárias e acadêmicas) + take inédito | agente | — |
| 3 | Roteiro em espanhol: adaptação cultural, explicação da ciência/mecânica de cada causa para leigo, gancho em 10 s, final que puxa outro vídeo | Opus | gerador de roteiro com checagem |
| 4 | Narração | Gemini TTS (AI Studio) até um batedor mostrar TTS aberto na G4 com a mesma qualidade | — |
| 5 | Alinhamento palavra a palavra | **G4** | stable-ts |
| 6 | Estilo próprio do canal | **G4** | LoRA de estilo treinada com o nosso material (não cópia do Runic) |
| 7 | Ilustrações (várias versões por cena, escolha automática + revisão no olho) | **G4** | Qwen-Image (Apache-2.0, sem login) |
| 8 | Personagens recorrentes consistentes (escriba, mercador, rei, aluno) | **G4** | Qwen-Image-Edit |
| 9 | Ilustração que se mexe (multidão, rio, fogo, fumaça, gestos) | **G4** | Wan 2.2 imagem→vídeo (Apache-2.0) |
| 10 | Fotos de museu e pinturas antigas em 2.5D (prova real) | **G4** | Depth Anything V2 + cena `Gemaelde` |
| 11 | Planos 3D de destaque (Portão de Ishtar, cidade vista do Eufrates, zigurate) | **G4** | three/Remotion (kit Tracer3D 2.0) |
| 12 | Cartões em código (tabuleta traduzida, artigo do código, mapas, números, contas) | **G4** | Remotion (kit ui) |
| 13 | Música instrumental por capítulo + limpeza de voz | **G4** | ACE-Step 1.5 (prompt só positivo) + Demucs |
| 14 | Efeitos guiados pelos eventos da cena | **G4** | MOSS + biblioteca |
| 15 | Mixagem, legenda, render final | **G4** | ffmpeg, Remotion |
| 16 | Miniaturas (3 para o Teste A/B), títulos fiéis ao molde, descrição com créditos | local | — |

## Regras do canal

- **Título fiel à estrutura sintática da referência.** O molde pode ser o que viralizou, não só o tema. Os 3 títulos do A/B mudam só a palavra (extraña / rara, crees / imaginas), nunca a estrutura.
- **Nunca "(Sin IA)".** A referência usa "(No AI)", mas nós usamos geração de imagem; a marca seria falsa.
- Adaptação cultural: referências dos EUA viram hispânicas, medidas métricas, humor da casa.
- Mais movimento e mais explicação que a referência:
  - cada curiosidade ganha o "por quê" mecânico, explicado para leigo;
  - nenhum plano parado por mais de 4 s;
  - pelo menos 1 take inédito (fato contraintuitivo que não está na referência).
- Música só instrumental; créditos e licenças só na descrição; sem marca SIMULATION.
- Batedor antes de produção sempre; o batedor da G4 mede tempo e qualidade de cada etapa nova.

## Estado

- [x] Leitura da referência e mapeamento (30/10/2026)
- [ ] Batedor G4: Qwen-Image (2 estilos), Qwen-Image-Edit (personagem), Wan 2.2 (3 planos), LoRA, tempo por etapa
- [ ] Dossiê, roteiro, narração
- [ ] Produção do vídeo 1
