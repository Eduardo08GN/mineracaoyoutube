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
   - **GitHub e npm:** shaders, materiais e ferramentas de cena. Olhe licença, estrelas e atividade recente;
   - **como os grandes fazem:** o canal de referência (Elapsed, Reconstructed, Tracer…), com leitura óptica de quadros, mais posts, Reddit e fóruns.
3. **Saída obrigatória:** `LEVANTAMENTO_PRONTOS.md` na pasta do projeto, com uma tabela (elemento | opção pronta | licença e preço | engine e versão | tem demo? | decisão) e os 3 melhores no topo.
4. **Licença:** pegar asset em loja (aceitar licença na conta do Eduardo) só com a confirmação dele, item por item. Comprar, só com o OK do valor.
5. **Construir à mão** só o que o levantamento provar que não existe, e registrar o porquê.

## Passo 1: prova curta
- Monte a cena **a partir da demonstração do pacote** escolhido, com o mínimo de customização, e renderize 2 a 6 stills.
- **Compare lado a lado** com quadros da referência (mesmo tipo de plano). Liste as disparidades: luz, sombra, textura, câmera, cor, pós.
- **Decisão por elemento:** adotar, testar mais ou fora.

## Passo 2: registro
- Escreva `BATEDOR_<video>.md` com a tabela, as receitas curtas, assets e licenças, as fraquezas e o custo medido.
- Atualize o doc da stack, como `docs/segundo-a-segundo-stack.md` ou a `ARQUITETURA.md` da pipeline.
