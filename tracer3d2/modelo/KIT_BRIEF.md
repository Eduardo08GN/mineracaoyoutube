# Brief dos agentes do kit (Tracer3D 2.0, sessão 2)

## Objetivo
Transformar as cenas que se repetem nos vídeos 1 (Paris-Geschütz) e 2 (Dicke Bertha) em **componentes do kit**: cenas que um planejador descreve em **JSON** e que renderizam **sem ninguém escrever código**. Cada vídeo futuro só vai precisar de agente de código para o que for realmente inédito. A qualidade visual tem que ser **igual à dos vídeos entregues**, sem perda.

## Onde trabalhar
- Projeto-modelo: `<raiz>/modelo\v1`. É uma cópia da Bertha; o original em `<projetos>/...` **não pode ser tocado**.
- Seu código vai só em `src/kit/<familia>/`, seu JSON de validação só em `src/cenas/<familia>.json` e sua documentação só em `src/kit/<familia>/API.md`. Não edite arquivos fora disso (Video.tsx, kit/index.ts, tipos.ts e os módulos antigos são de leitura). Se precisar de algo de um módulo antigo, **importe** dele (`../../ui/basis`, `../../karten/basis`, `../../look/Look`, `../../welt/...`) ou copie o trecho para dentro do kit e generalize.
- Os dados novos que um componente precisar ficam em `public/` com nome genérico. Depois de adicionar, rode `python <raiz>/canal.py sync <raiz>/modelo/v1 public`.

## Contrato (`src/kit/tipos.ts`)
```ts
type KitProps<P> = {t: number; d: number; b: Beat; p: P};   // t local (s), d duração, b batida, p props do JSON
zeit(b, p.em, padrao)   // todo tempo nas props pode ser número ou {"wort": "Granate", "nach": 0, "plus": 0.2}
```
- Registre cada cena em `src/kit/<familia>/index.ts`: `export const KIT_<FAMILIA>: KitMap = {NomeDaCena: {C: Componente, doc: 'uma linha'}}`. Os nomes são em alemão curto, no padrão do projeto (`Formel`, `Balken`, `Karte`...).
- Para usar uma cena numa batida, escreva em `src/cenas/<familia>.json`: `{"04_07": {"comp": "Formel", "props": {...}}}`. O sequenciador dá prioridade ao kit sobre o componente antigo dessa batida.
- **Tudo é função pura de t**: sem estado, sem relógio, sem `Math.random` sem semente (use `zufall(saat)` de `karten/basis`).
- **Genérico de verdade**: nada de Bertha, Paris, Lüttich ou números fixos dentro do componente. Textos, dados, coordenadas, cores de destaque, câmera e arquivos vêm das props. Cores e fontes vêm de `C` e `F` (`ui/basis`), para que outro canal possa trocar o tema.
- **Ação em cena**: nenhuma cena fica parada mais de 4 s. Câmera com deriva lenta, elementos entrando em sequência ancorados nas palavras, contadores e linhas que se desenham. Se as props não derem âncoras, distribua as entradas pela duração `d`.
- **Padrões sensatos**: a cena tem que ficar bonita só com as props obrigatórias. As opcionais refinam.
- Sem marca d'água SIMULATION. Créditos de dados (linha `Quelle`) vêm de uma prop.

## API.md da sua família (o planejador lê só isto, então seja curto)
Para cada cena, até ~12 linhas: para que serve e quando usar; props com tipo, padrão e se é obrigatória; um exemplo JSON real. Nada de prosa.

## Validação (obrigatória)
1. Para cada batida da sua lista de validação, escreva a cena em JSON em `src/cenas/<familia>.json`, reproduzindo a batida original.
2. Referência: tire quadros do vídeo entregue `<projetos>/tracer3d_02_bertha\entrega\die_dicke_bertha_1914.mp4` nos mesmos segundos, com `ffmpeg -ss <seg> -i ... -frames:v 1 -vf scale=960:-1`. Os segundos absolutos de cada batida estão em `src/plano.json` (`beats[].s/e`).
3. Kit: gere os stills na G4 com `python <raiz>/canal.py stills <raiz>/modelo/v1 <pasta> <seg> [<seg> ...]`. Eles saem em `teste/<pasta>/`, levam ~1 s cada, aceitam até ~16 por chamada, e o rebundle leva 3 s. **Nunca renderize stills localmente.** Se a G4 tiver caído, o próprio comando religa e prepara sozinho; espere.
4. Compare em **folhas de contato reduzidas** (referência ao lado do kit; monte com PIL, 480 px de largura por quadro). Não abra imagens grandes uma por uma: isso gasta tokens.
5. Critério: mesma informação, mesmo nível de acabamento, mesma identidade visual. Não precisa ser idêntico pixel a pixel. Teste pelo menos 2 instantes por batida (meio e perto do fim) para ver o movimento.
6. Erros de tipo: `cd <raiz>/modelo/v1 && npx tsc --noEmit -p . 2>&1 | grep "src/kit\|src/cenas"`. Os erros antigos de `ui/u2_karten.tsx` e `welt/t_kap06.tsx` não são seus; ignore.

## Economia
Leia só os arquivos antigos de que precisa (comece pelos `*basis*` e pelos que desenham as batidas da sua lista: `beats/<DONO>.tsx` diz qual módulo desenha cada batida). Não leia o projeto inteiro. Use as folhas de contato para conferir.

## Entrega (resposta final, curta)
- As cenas do kit criadas (nome e uma linha cada).
- As batidas validadas e o resultado, com o caminho da folha de contato final.
- O que **não** dá para generalizar e continua precisando de agente de código.
- Tokens: escreva "ok". Nenhum relatório longo.
