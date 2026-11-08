# Caminhos ruins (gerais): o que já deu errado e não se repete

Os de cada pipeline ficam no doc dela (como `tracer3d2/BADPATHS.md`). Aqui ficam os que atravessam pipelines.

## 1. Construir à mão o que já existe pronto (4 recorrências)
- **03/11, Kriegsmomente 14 e auditoria do Learjet:** setas, mapa em relevo, nuvem, céu e cidade feitos à mão no three.js. O Unreal ficou deformando um mapa de floresta.
  - O que já existia: perfect-arrows, `@remotion/paths`, a skill de mapas do Remotion, MapStage, VDBs CC0 da JangaFX, Blosm, LiDAR público.
  - Parte disso já estava instalada sem uso.
  - Os concorrentes (Reconstructed) usam modelo grátis do Sketchfab e dados públicos.
  - **Causa:** o levantamento cobriu só assets. Não houve busca de código (`gh search repos`) nem de método (tutoriais pela YouTube API).
  - **Correção:** as três frentes viraram obrigatórias no portão 1, e as ferramentas estão em `ferramentas/levantamento/`.
- **23/10, Dicke Bertha, e 24/10, V3 (Tracer3D 2.0):** pulei o batedor de stack com a desculpa de que a stack era reaproveitada.
- **02/11, unreal3d (Kriegsmomente) e Segundo a Segundo:** construí à mão o material "ilustrado", as casas peça por peça, a luz, a gradação e o espalhamento de plantas. No three.js, escrevi do zero uma nuvem volumétrica, quando já existe `@takram/three-clouds`.
  - **Resultado:** "cara de PS2", segundo o Eduardo, contra o Elapsed, feito por uma pessoa só em UE5 com a mesma engine.
  - **Causa:** o batedor foi usado para provar o meu código e não para achar o pronto. A regra estava escrita só para three.js e espalhada no D:, fora do repositório.
- **Correção:** o portão 1 do `CLAUDE.md` e o passo 0 de `docs/BATEDOR.md` (levantamento de prontos antes de qualquer construção).

## 2. Render sem convergência na UE5 dá "PS2"
- **02/11:** o render da Schlacht saía com aquecimento 0 (o parâmetro era ignorado), 2 amostras temporais e AA desligado.
- **Efeito:** sombras pretas sem rebote e serrilhado.
- **Regra:**
  - Lumen com aquecimento ≥ 64 quadros na prévia e ≥ 128 no final;
  - ≥ 8 amostras temporais na prévia e ≥ 32 no final.

## 3. Referências de altura diferentes na mesma cena
- **02/11:** o chão era um plano inclinado com centro em x = 250 m e altura 0, e os objetos usavam `z = x·tan 3°` (plano pela origem).
- **Efeito:** tudo flutuava ~13 m, e as sombras viravam "manchas pretas" no chão.
- **Regra:** uma única função de altura para o chão e para os objetos.

## 4. Desligamento automático com tarefa pendente
- **02/11:** a cadeia desligou a G4 segundos depois de o Drive montar, e a imagem da engine não foi gravada.
- **Regra:** com pendência (cópia ao Drive, conferência), a cadeia não tem `fim → desligar`. Quem confere e desliga é o maestro.
