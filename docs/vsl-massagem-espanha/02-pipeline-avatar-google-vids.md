# 02 · Pipeline da avatar no Google Vids

Como gerar, de graça e com o rosto consistente, (a) os retratos-âncora, (b) as imagens de cena com a personagem e
(c) os takes da avatar falando. Tudo isso já rodou de ponta a ponta no vídeo da Mamaw Opal (out/2026: 280 imagens,
34 takes). O código está em `work/video/`; este doc explica o que ele faz, o que é específico da Opal e o que mudar
para a Carmen (doc 01).

## Infraestrutura (leia antes de rodar qualquer coisa)

- **Navegador:** perfil do Dolphin Anty **"12 Ivone"** (id `869356248`), logado na conta do Google que tem o Vids.
  Os scripts NÃO abrem navegador próprio: conectam no Dolphin já aberto pela porta de depuração (CDP), lida de
  `%APPDATA%\dolphin_anty\browser_profiles\869356248\data_dir\DevToolsActivePort` (`ivone.conectar`).
- **Se a sessão do Google cair** (as abas mostram a tela "Escolher uma conta"): **pare e peça ao Eduardo para
  logar**. Não digite senha, não injete cookies.
- **Documentos do Vids usados:** um para imagens (`VIDS_DOC`, padrão em `vids_imagem.py`) e um para os takes do
  Omni (`VIDS_DOC_OMNI`, padrão em `headcast.py`). Para a Carmen, criar **dois documentos novos** no Vids da conta e
  passar os ids pelas variáveis de ambiente (assim o histórico de imagens da Opal não se mistura com o da Carmen).
- **Primeira vez em cada documento:** o Vids mostra o diálogo de termos ("Criar conteúdo com imagens no
  Workspace"). Aceitar só com autorização do Eduardo no chat.
- Paralelizar abrindo o mesmo tipo de trabalho em **documentos diferentes** (até 3 rodaram juntos sem problema).
  Duas instâncias no mesmo documento se atrapalham.

## Passo 1 · Retrato-âncora

Uma imagem por personagem, gerada uma vez e congelada em `<projeto>/ref/<id>.png`.

```bash
python work/video/vids_imagem.py bruto "<prompt da âncora do doc 01>" "<projeto>/ref/carmen.png"
python work/video/headcast.py "<projeto>" ancoras      # gera as âncoras que faltam, a partir do dict ANCORAS
```

- `bruto` manda o texto como está (a âncora olha para a câmera). `gerar` acrescenta o estilo das cenas.
- O texto do pedido é o que identifica a âncora no **histórico do painel** depois (`_texto_ancora`). Não apague o
  histórico do documento: a edição das cenas parte dele.

## Passo 2 · Imagens de cena (uma por frase)

```bash
python work/video/headcast.py "<projeto>" planejar     # roteiro.md -> planos.json (o Claude escreve a cena de cada plano)
python work/video/headcast.py "<projeto>" imagens [n]  # gera as que faltam; retoma de onde parou
```

- **Cena com personagem:** o script abre o item da âncora no histórico, clica no 3º botão sobre a miniatura
  (**Editar**) e pede só o que muda ("same face, same hair, same clothes… <ação/lugar/enquadramento>"). Isso mantém
  o rosto. **Gerar do zero com a descrição da pessoa NÃO mantém o rosto.**
- **Cena sem personagem** (`ancora: "nenhum"`): gera direto com o estilo.
- Variáveis úteis: `HC_SO=personagens|nenhum` (divide o trabalho entre duas abas/documentos), `HC_ORDEM=tras`
  (um trabalhador do fim para o começo), `HC_LISTA=arquivo.json` (só esses números de plano).

## Passo 3 · Takes da avatar falando (Omni / "Vídeo com IA")

```bash
python work/video/headcast.py "<projeto>" avatar
```

- Cada fala vira um take de **até 10 s (~22 palavras)**; `falas_avatar()` corta a frase na última vírgula se
  passar disso. As falas ficam em `falas_avatar.json` e os takes em `avatar/aNN.mp4`.
- O script sobe a foto da âncora pelo botão **"Ingredientes"**, digita o pedido (`PEDIDO_OMNI`) com a fala
  **entre aspas, ao pé da letra**, clica **Gerar** e espera até 15 min pelo vídeo novo.
- Um take médio sai em 2–5 min. Rodar em background e conferir os primeiros 3 antes de soltar o resto.

### Conferência obrigatória dos takes (o Omni erra)

1. Transcrever cada take com o Whisper e comparar com o texto pedido. Já aconteceu de **dois takes saírem com a
   mesma fala** (a04/a05 da Opal): apagar e gerar de novo.
2. Olhar um frame de cada: rosto igual à âncora, roupa igual, sem texto inventado na tela.
3. Conferir o **idioma e o sotaque** (para a Carmen: espanhol da Espanha, andaluz suave).

## Marca d'água do Omni (o "losango")

Todo take do Omni sai com a estrela do Gemini no canto inferior direito. Na Opal ela ficava em **(1159, 619)** num
quadro 1280×720 (medido em vários takes: é sempre o mesmo lugar). Solução aprovada pelo Eduardo: **queimar a logo
do canal com um círculo opaco centrado exatamente sobre a estrela**, texto do nome centralizado embaixo do círculo.

- Medir de novo nos takes da Carmen antes de queimar (o lugar pode mudar se o Vids mudar): extrair um frame
  (`ffmpeg -ss 3 -i a10.mp4 -frames:v 1 f.png`), recortar o canto, aumentar brilho e contraste, achar o
  aglomerado claro sobre o fundo. **Não confiar no primeiro chute:** na Opal, os dois primeiros palpites estavam
  errados porque o fundo claro do balcão enganava a detecção.
- O círculo precisa ser **100 % opaco** (com 80 % a estrela aparecia por trás). O resto da logo pode ser
  semitransparente.
- Comando: `ffmpeg -i video.mp4 -i logo.png -filter_complex "[0:v][1:v]overlay=X:Y:format=auto" -c:v libx264 -crf 18 -preset fast -c:a copy video_com_logo.mp4`

## O que é específico da Opal no código e precisa virar Carmen

`headcast.py` foi escrito para a Opal. Antes de rodar para a Carmen, parametrizar (de preferência num arquivo de
persona dentro do projeto, sem duplicar o script):

| Onde | O que é da Opal | Trocar por |
|---|---|---|
| `ANCORAS` | 12 personagens da família da Opal | personagens da tabela do doc 01 |
| `_texto_ancora` | trecho fixo do prompt da Opal | trecho do prompt da âncora da Carmen |
| `ESTILO_ANCORA`, `vids_imagem.ABERTURA/TECNICA` | filmadora caseira de 2012 | **realista moderno** (luz natural de janela, câmera de entrevista atual); ver doc 03 |
| `PEDIDO_CENAS` | lore da Opal, Apalaches, contagem regressiva | lore da Carmen, Triana, estrutura da VSL (doc 04) |
| `PEDIDO_OMNI` + `GESTOS` | "76-year-old grandmother… Appalachian accent", mesa da cozinha | "58-year-old massage therapist from Seville… speaks Spanish from Spain with a soft Andalusian accent", cenários do doc 01 |
| `gerar_avatar` | foto `ref/opal.png` | `ref/carmen.png` |
| `recortar` | blocos `ID/TRUQUE/FECHO`, avatar a cada ~90 palavras | blocos da VSL; numa VSL a avatar aparece **muito mais** (doc 03) |

Regra do projeto: toda regra nova de produção também vai para `motor/pipeline_video.py` (aba Produção do
minerador), não só para o script.

## Armadilhas já resolvidas (não redescobrir)

| Sintoma | Causa | O que fazer |
|---|---|---|
| Painel parado em "Gerando…" | o Vids trava | `_ocioso`: espera 3 min e recarrega a página |
| O pedido novo sai misturado com o anterior | a caixa guarda o texto quando falha | `_limpar_caixa` antes de digitar |
| O rosto vai mudando a cada cena | edição partindo da ÚLTIMA imagem | `_sair_edicao` e editar sempre a partir da âncora original (o item mais antigo do histórico) |
| "Parece violar…" contado como recusa nova | mensagens antigas na tela | contar as mensagens antes de clicar e comparar depois |
| Imagem atrasada cai no plano seguinte | duas gerações em voo | só pedir a próxima com o painel ocioso |
| Texto/cartão aparece nas imagens | o modelo inventa | terminar o pedido com "No text, no cards, no labels anywhere." |
| Animação das imagens (Vids "Animar") | — | **não usar**: o Eduardo vetou (13/10). Imagem parada com zoom lento |
