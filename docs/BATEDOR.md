# Batedor: regra geral, para qualquer engine

O batedor existe para **ganhar agilidade sem perder qualidade e sem custo alto** de tempo e tokens. Ele começa procurando o que já existe pronto. Provar o que eu mesmo construí vem depois.

Vale para three.js/Remotion, Unreal, Blender, UI, áudio e ferramentas. Para three.js há detalhes extras em `docs/whatif-es/BATEDOR.md`.

## Passo 0: levantamento de prontos (portão; nada é construído antes)
1. **Liste os elementos** que o vídeo ou a stack precisa e que hoje saem fracos ou não existem. Exemplos: vegetação, céu, materiais, personagens, efeitos, pós-processo, tipografia.
2. **Para cada um, procure nesta ordem:**
   - **recursos nativos da engine ou biblioteca:**
     - UE5: Lumen, PCG, Water, Sky Atmosphere, Volumetric Cloud, presets e Content Examples;
     - three.js: drei, pmndrs/postprocessing e `@takram/three-*`;
   - **pacotes prontos com demonstração:**
     - Fab, Megascans;
     - CC0: Poly Haven, ambientCG, Kenney;
     - Sketchfab CC-BY;
     - Mixamo.

     Prefira os que trazem **mapa de demonstração já iluminado**: começar dele é o atalho;
   - **GitHub e npm (obrigatório, não opcional):**
     - `gh search repos` com **muitas** variações de termo, porque a busca é literal;
     - grep.app, listas "awesome", npm/PyPI, `extensions.blender.org`.

     Olhe licença, estrelas e atividade recente. Antes, confira o `package.json`: às vezes o pronto já está instalado;
   - **como os grandes fazem (obrigatório):**
     - tutoriais e making-ofs pela YouTube API, lendo as legendas com `ferramentas/levantamento/`;
     - créditos na descrição dos concorrentes (`yt_desc.py`);
     - leitura óptica de quadros do canal de referência;
     - posts, Reddit e fóruns.
   - **Rode em paralelo:** um agente para código e outro para método. Exemplo de saída: `docs/levantamentos/2026-11-03_*`.
3. **Saída obrigatória:** `LEVANTAMENTO_PRONTOS.md` na pasta do projeto, com uma tabela (elemento | opção pronta | licença e preço | engine e versão | tem demo? | decisão) e os 3 melhores no topo.
4. **Licença:**
   - **Pacote GRATUITO do Fab:** desde 05/11 o Eduardo me deu autonomia para buscar e trazer, em todo batedor, os pacotes grátis que agreguem ao vídeo. Ver a "Frente Fab autônoma" abaixo.
   - **Pacote PAGO ou de outra loja:** só com o OK do Eduardo, com o valor e o motivo.
   - **Senha e login:** nunca digito. Se a sessão do Fab ou do Launcher cair, peço para o Eduardo entrar.
5. **Construir à mão** só o que o levantamento provar que não existe, e registrar o porquê.

### Frente Fab autônoma (Eduardo, 05/11): roda em todo batedor, sem pedir
O salto do batedor 07 do What If ES veio de trocar modelagem por biblioteca pronta (`docs/pipeline-fab-g4.md`). Por isso, todo batedor procura pacote antes de modelar.
1. **Primeiro a biblioteca que já temos:** o catálogo `D:/whatif_es/assets/fab/catalogo.json` e as folhas de contato. Ele traz tamanho em metros, triângulos e animações de cada GLB. Se a peça já está lá, usar e seguir.
2. **Depois o Fab:** para cada elemento que falta (ou que sai fraco na folha do batedor), buscar em fab.com:
   - filtro *Free*;
   - formato GLB/glTF > FBX > Unity (este vira FBX), nessa ordem;
   - estilo coerente com o canal (low poly/estilizado no What If ES; época e papel no Kriegsmomente).
   - Até **30 min por elemento**. Se não achar, o elemento vai para "construir à mão", com o porquê registrado.
3. **Trazer:**
   - "Add to My Library" no navegador de automação, logado na conta do Fab;
   - download pelo Epic Launcher para `D:/EpicVault/VaultCache/FabLibrary/`;
   - converter com `producao3d/fab/fbx_para_glb.py` (Blender sem tela) e otimizar com `producao3d/fab/otimizar.mjs` (gltf-transform: textura ≤ 2k, escala em metros, origem no chão);
   - entrar no `catalogo.json` e numa folha de contato nova.
4. **Licença na hora de trazer:**
   - anotar uid, autor e licença em `CREDITOS.md`, conferindo em `fab.com/listings/<uid>` (CC-BY 4.0 ou Fab Standard);
   - crédito só na descrição do vídeo;
   - **arquivo bruto nunca vai para o repositório público** (o Fab Standard proíbe redistribuir).
5. **Registrar no `LEVANTAMENTO_PRONTOS.md` do batedor:** o que entrou, de onde, a licença e o que melhorou na folha.

## Passo 1: prova curta
- Monte a cena **a partir da demonstração do pacote** escolhido, com o mínimo de customização, e renderize 2 a 6 stills.
- **Compare lado a lado** com quadros da referência (mesmo tipo de plano). Liste as disparidades: luz, sombra, textura, câmera, cor, pós.
- **Decisão por elemento:** adotar, testar mais ou fora.

## Passo 2: registro
- Escreva `BATEDOR_<video>.md` com a tabela, as receitas curtas, assets e licenças, as fraquezas e o custo medido.
- Atualize o doc da stack, como `docs/segundo-a-segundo-stack.md` ou a `ARQUITETURA.md` da pipeline.
