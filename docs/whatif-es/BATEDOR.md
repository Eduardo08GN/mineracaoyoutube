# Batedor — pesquisa de stack antes de cada vídeo (rotina obrigatória)

Pedido do Eduardo (22/10/2026): em toda produção, depois de ler o original, **identificar os elementos que a nossa stack ainda
não faz bem (ou nunca fez) e vasculhar GitHub, npm e a comunidade three.js atrás de repositórios e bibliotecas espertos e baratos**
que elevem a qualidade. Foi assim que o vídeo 5 ganhou árvores de verdade (EZ-Tree) e um buraco negro com lente gravitacional.
Esta página transforma isso em etapa fixa da pipeline.

## Onde entra na pipeline

```
leitura 10 fps + mapa de ações  →  BATEDOR  →  esqueleto (tempo/roteiro/Cena) + agentes por mundo  →  stills G4  →  render
```

O batedor roda **depois** do mapa de ações (precisa da lista de elementos) e **antes** de qualquer agente começar a modelar
(o achado muda como o mundo é construído).

## Passo a passo

1. **Inventário de elementos-herói.** A partir do mapa de ações e das folhas a 10 fps, listar tudo o que aparece em destaque:
   paisagens, objetos, efeitos (fogo, água, céu, espaço), personagens, câmera, HUD. Para cada um, marcar:
   - **já temos bom** (stack atual dá conta — citar o módulo);
   - **temos fraco** (existe, mas o dono do canal já reclamou ou fica abaixo do original);
   - **inédito** (nunca fizemos).
2. **Busca** só para "fraco" e "inédito", nesta ordem de fontes:
   - GitHub (busca por `three.js <elemento>`, `webgl <elemento> shader`, `r3f <elemento>`; ordenar por estrelas e por atualização);
   - npm (`npm view <pacote> version license peerDependencies time.modified`);
   - fórum do three.js (discourse.threejs.org, categoria Showcase/Resources), Codrops, Shadertoy (só para entender a técnica:
     o código do Shadertoy é CC BY-NC-SA por padrão — **não copiar**, reimplementar);
   - bancos de assets CC0: Poly Haven, ambientCG, Quaternius, Kenney, NASA (domínio público), Unity Labs/JangaFX (CC0).
3. **Critérios** (todos):
   - **licença comercial**: MIT, BSD, Apache, ISC, CC0, domínio público, CC-BY com crédito. Nada NC/ND; texturas que vêm junto
     de um repo MIT podem ter outra licença — conferir uma a uma;
   - **grátis** e **offline** (roda na G4 sem chamar serviço externo; assets embutidos ou baixáveis por URL pública);
   - compatível com a stack travada (three 0.180, R3F 9, Remotion 4) ou portável em < 1 h;
   - **determinístico**: tudo função do tempo do quadro (semente fixa, sem `Math.random`/relógio real); se a lib anima sozinha,
     precisa expor `update(t)` ou um uniform de tempo;
   - barato na GPU (alvo < 1,5 s por quadro na L4 com o resto da cena);
   - versão publicada há mais de 2 semanas.
4. **Prova rápida**: instalar (`npm install --save-exact` em `D:\whatif_es\stack`), um still local isolado e um na G4 antes de
   adotar. Se não passar em ~30 min, voltar ao plano B (fazer nosso, baseado na técnica que o repo ensinou).
5. **Wrapper próprio**: toda lib entra por um módulo nosso em `src/mundo/` (ex.: `arvores.tsx` sobre o EZ-Tree) que fixa a semente,
   amarra a animação ao `t` e expõe uma API simples para os agentes. Nunca usar a lib crua espalhada pelo código.
6. **Registro**: tabela `batedor.md` na pasta do vídeo (e cópia em `docs/whatif-es/videoNN/`) + licença em `public/LICENCAS.txt`
   + linha nova no `STACK.md` quando o achado vira padrão da stack.

## Formato do registro (`batedor.md` de cada vídeo)

| Elemento (segundo do original) | Situação | Candidato | Licença / versão | Prova | Decisão |
|---|---|---|---|---|---|
| ex.: árvores (6–116 s) | fraco | `@dgreenheck/ez-tree` | MIT, 1.1.0 (jan/2026) | still local ok, G4 ok | adotado via `arvores.tsx` |

## Casos que originaram a rotina (vídeo 5, 22/10/2026)

**Árvores — EZ-Tree.** O original usa árvores low-poly de bolha; as nossas eram esferas/cones e o Eduardo pediu algo melhor.
Busca: `three.js procedural tree` → [dgreenheck/ez-tree](https://github.com/dgreenheck/ez-tree) (MIT; npm `@dgreenheck/ez-tree`
1.1.0; three ≥ 0.167; cascas CC0 de Poly Haven/TextureCan; texturas embutidas no pacote → funciona offline na G4; RNG com semente;
vento por `update(t)`; presets Ash/Aspen/Oak/Pine em três tamanhos). Alternativas vistas: o "Procedural Instanced Forest" do fórum
do three.js (sem licença declarada → descartado), Quaternius Nature (CC0, mas low-poly). Wrapper `arvores.tsx`: cache por
(preset, semente), estações (cor, queda das folhas, neve nos galhos), crescimento Small→Medium→Large com dissolve, floresta
instanciada.

**Buraco negro com lente gravitacional.** Inédito para nós. Referências estudadas: implementações MIT de raymarching de
Schwarzschild em WebGL (ex.: o projeto blackhole-ts, MIT — **as imagens de fundo que acompanham esse tipo de repo costumam ser
CC-BY-NC e não podem ser usadas**). Decisão: shader próprio (`fim_buraco.tsx`) — geodésicas de luz pela forma newtoniana
equivalente (a = −3/2·h²·r/r⁵), disco fino com turbulência girando, Doppler (um lado mais brilhante), anel de fótons e a parte de
trás do disco aparecendo por cima e por baixo da sombra. Resultado na GPU: o quadro mais forte do vídeo.

**Outros achados do mesmo vídeo** (lista da varredura, nem todos usados):
- atmosfera física de Bruneton (BSD-3) → inspirou o céu com Rayleigh/Mie/ozônio calculado uma vez (`ceu.tsx`);
- stegu/webgl-noise (MIT) → ruído simplex/fbm portado para os shaders do cosmos;
- NASA SVS Deep Star Maps (domínio público) → candidato a fundo estelar;
- Kenney City Kits (CC0), Poly Haven (relógio, penhasco, neve, pinheiros), ambientCG (gelo, solo, rocha, lava) → texturas e
  props;
- THREE-CustomShaderMaterial e THREE.Terrain (MIT) → alternativas para terreno (fizemos o nosso no shader);
- simulação de Toomre (fusão de galáxias) assada offline → candidato para Andrômeda (fizemos por instâncias);
- acúmulo de subquadros para "pessoas fantasma" e shader de céu em longa exposição → técnicas, sem lib.

## Regra de ouro
Achado bom vira **padrão da stack** (linha no `STACK.md` + wrapper reutilizável), não fica preso a um vídeo.
