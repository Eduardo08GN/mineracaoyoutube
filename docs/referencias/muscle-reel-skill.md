# Claude muscle reel skill (Ernesto Lopez), referência

- **Origem:** https://ernesto-x-resources.vercel.app/r/muscle-skill, de Ernesto Lopez (@ErnestoSOFTWARE no X). A página só libera o download (`.zip`) para quem cola o link do post de origem.
- **Licença:** não informada na página. **Por isso não guardamos cópia do código no repo**, só esta descrição.
- **Status:** 09/11/2026, documentado a partir da página aberta pelo Eduardo. O conteúdo do zip ainda não foi lido. Quando o Eduardo baixar o `.zip` para o D:, completar a seção "Por dentro" e conferir a licença.

## O que faz
Uma skill do Claude que produz **reels verticais de treino de musculação em 3D**:
- uma figura 3D cinza executa cada exercício, e o **músculo trabalhado acende** (brilho laranja e vermelho);
- um **seletor de músculos** no topo (ex.: "TRICEPS") destaca o grupo da vez;
- a **voz fala o nome** de cada exercício ou músculo;
- o reel **termina na tela do app** do criador, com nome e logo definidos no config. "REPS" é um app inventado, de exemplo;
- **cada plano é gerado com IA:** Seedance 2.5 na plataforma Higgsfield. Depois a skill junta voz e música e **corta o reel inteiro a partir de um único arquivo de config**.

## Pipeline (pela página)
1. Config único: lista de exercícios e músculos, nome e logo do app.
2. O Claude escreve o prompt de cada plano e gera o vídeo no **Seedance 2.5 (Higgsfield)**.
3. Voz com o nome de cada exercício, mais música.
4. Montagem automática: seletor de músculo + planos + tela final do app.

## Avaliação para nós
- **Custo:** Seedance/Higgsfield é **pago por crédito**. Isso vai contra a regra de usar a G4 e recursos baratos, e contra o veto à IA visual paga nos reels (08/11). Para usar no nosso modelo, o equivalente seria rodar os planos no **MiniMax H3 na G4** (licenciado) ou fazê-los por código (three.js + figura rigada).
- **O que vale aprender:**
  - **o formato:** o objeto anônimo e neutro (figura cinza) com **a parte que importa acesa**. É o "tornar visível o abstrato" do nosso princípio de produção;
  - **o seletor fixo no topo**, que orienta o espectador;
  - **a tela final do produto**, um CTA de app;
  - **o reel inteiro saindo de um config**, que é a mesma ideia do nosso `plano.py`/contrato.
- **Onde caberia:**
  - um formato de reel educativo (corpo humano, "o que trabalha em cada movimento");
  - os takes de mecanismo dos nossos canais, que usam o mesmo truque de "acender a peça que trabalha".

## Por dentro (pendente)
Preencher depois de ler o zip: arquivos, formato do config, prompts usados no Seedance, ferramenta de montagem e licença.
