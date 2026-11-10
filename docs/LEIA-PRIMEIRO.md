# LEIA PRIMEIRO: toda sessão ou agente novo começa aqui

Este doc existe porque as sessões novas começavam sem contexto e repetiam erros que já estavam resolvidos. Em 08/11, só nos reels do FB, isso aconteceu de três formas:
- a stack foi montada no PC em vez da G4;
- a água foi feita à mão, embora a receita pronta já estivesse baixada;
- um teste reprovado pelo próprio revisor foi mandado ao Eduardo.

Leitura obrigatória antes do primeiro passo. São ~5 minutos, que poupam horas.

## 0. Como começar
1. Leia **este arquivo**, o `CLAUDE.md`, o **doc do seu formato** (tabela abaixo), o **BADPATHS do pipeline** e o `docs/BADPATHS-custo.md`.
2. Antes de construir qualquer coisa, escreva em 3 linhas **o que você vai reaproveitar**: stack, kit, receita, cena já aprovada, script de G4. Para cada coisa que for fazer à mão, diga por que o pronto não serve (portão 1).
3. Se o seu formato não tem doc, ou o doc não responde, **pergunte ao maestro** (a sessão que te abriu) antes de inventar um caminho.
4. Trabalhe a partir do `main` atualizado. Regra nova que só existe num branch sem merge é invisível para a próxima sessão: ao terminar, avise o maestro de que há PR esperando o merge do Eduardo.

## 1. Mapa: formato → doc → código
| Canal / formato | Doc do formato | Código / stack | BADPATHS |
|---|---|---|---|
| Kriegsmomente (DE), vídeo longo | `docs/pipeline-kriegsmomente.md`, `docs/receita-k19-stack.md`, `docs/PIPELINE.md` | `tracer3d2/` | `tracer3d2/BADPATHS.md` |
| What If ES (Eddie3D) | `docs/whatif-es/STACK.md`, `docs/whatif-es/BATEDOR.md` | `eddie3d/` | `docs/whatif-es/erros-pipeline.md` |
| Segundo a Segundo (ES) | `docs/segundo-a-segundo-stack.md` | `spanish3d/` | `docs/BADPATHS.md` |
| FB ¿Qué Pasaría Si? 3D, reels de notícia/acidente (**PAUSADO 08/11 por custo**) | `docs/formato-acidentes-fb.md` + `docs/canais/fb_que_pasaria_si/reels_noticia.md` (bíblia: Polyfork, modo barato, água/chuva, HUD) | Remotion + R3F | `docs/BADPATHS.md` #5–7 |
| Tema e título do Kriegsmomente | `docs/pipeline-temas-kriegsmomente.md` | `ferramentas/radar_kriegsmomente/` | — |
| Mineração / radar de notícias | `docs/radar-noticias-quentes.md` | `ferramentas/radar_noticias/` | — |
| Organização por canal | `docs/arquitetura-tenants.md` | `D:/producao/<canal>/formatos/<formato>/` | — |
| Reels do Instagram (Tomiko Casa Limpa) | `docs/inteligencia-conteudo-inedito.md` (como escolher a fonte: ideia inédita, copy nova) + `docs/pipeline-tomiko-limpeza.md` (produção) | `motor/instagram_*.py`, branch `instagram` | — |
| Mineração de Reels para modelar (Instagram) | `docs/mineracao/README.md` (classes de busca: sintoma, praga, ofício...) | — | — |
| Imagem da stack na G4 | `docs/g4-imagem-stack.md` | `tracer3d2/vm/preparar_img.sh` | — |

Pacotes prontos já avaliados ficam em `docs/pacotes-por-canal.md`. Consulte esse doc antes de qualquer levantamento novo.

## 2. As regras que mais foram quebradas (com o incidente que as criou)
**G4 e máquina**
- **Pesado vai para a G4, inclusive montar a stack.** Isso cobre `npm install`, empacotar, checar tipos, stills, render, voz e música. No PC fica só a edição do código. *(08/11: 20 min de `npm install` no PC.)*
- **A G4 parte da imagem `.sqfs` da stack no Drive**, instala só o que for novo e regrava a imagem. Nunca reinstala tudo a cada ligada. *(Até 08/11, 4 min por ligada, 3× num único batedor.)*
- **Imagem de stack só vai do Drive para a G4, nunca do PC para a G4.** A imagem nasce na G4-1 e é gravada direto no Drive Ultra; a G4-2 lê do Drive pelo link. Nunca suba `.sqfs`, modelo ou pesos do PC (upload a ~2 MB/s). *(09/11, vídeo da Doña Chayo: ~1h40 perdidas subindo 3 imagens do PC.)*
- **Ligue a G4 só com job**, desligue no fim e confira que desligou. Nunca desligue com job de outra sessão (`T2_DONO`). Nunca deslogue a conta da G4-2. Um cliente de navegador por vez.
- **Job longo roda com sentinela** (script + Monitor) que só emite quando o estado muda: queda, job morto, backlog parado, erro, fim. *(07/11: G4 caiu e o pipeline ficou "cego e surdo".)*
- **Modo barato, sem path tracer.** *(08/11: 40 min de G4 travada com o `three-gpu-pathtracer`.)*
- **Nada no C:** (`TEMP=D:/tmp`). O repositório é público: nada de chave, token, e-mail, ID de canal, link de notebook ou link do Drive.

**Pronto antes de construir**
- Kit harmonizado em primeiro lugar (Polyfork, ou um pacote Fab da biblioteca do Eduardo): uma paleta, uma receita de luz, um sistema de texto. *(08/11: a mistura de Quaternius, EZ-Tree e terreno por código saiu "Frankenstein".)*
- As receitas de skills que já foram baixadas valem antes de qualquer shader próprio (ex.: `threejs-water-optics`). *(08/11: 10 rodadas de água à mão; a receita só entrou na 14ª.)*

**Qualidade e entrega ao Eduardo**
- **Assinatura de estilo vem do kit, não do motor.** Comece pela cena-demo de UM kit harmonizado (Polyfork ou pacote Fab), extraia luz, paleta, céu e sombra para `estilo/ASSINATURA.md` + `ref.png`, e monte a cena só com peças dessa família. O motor (plano, HUD, câmera, render) entra por baixo, sem trazer o "look" de outro projeto. Antes de mandar ao Eduardo, compare a paleta (k-means) e faça a folha lado a lado com o `ref.png`. *(08/11: misturamos o look foto do vídeo 08 com bonecos Polyfork = "Frankenstein sem assinatura".)*
- **Direção de arte antes de asset.** Primeiro a bíblia de estilo: referência aprovada, paleta, traço, luz e proporção do personagem. Só depois o levantamento, e cada asset entra só se combinar com ela. Nunca recomende um asset só porque é grátis ou popular. Personagem cru tipo Quaternius ou KayKit está **vetado** (cara de "PS2 mal feito"). *(08/11: recomendei Quaternius de novo, já reprovado no lote 1.)*
- **Batedor curto (~20 s), lado a lado com a referência**, antes de qualquer lote. O lote só sai com o OK do Eduardo. *(08/11: lote de 4 reels reprovado inteiro.)*
- **Nada reprovado pelo revisor interno vai para o Eduardo.** O construtor confere o arquivo final (abre, `ffprobe`, quadro do trecho corrigido) antes de dizer "corrigido". *(08/11: a rodada 15 disse que tinha corrigido, e a imagem mostrava outra coisa.)*
- **Revisores em paralelo**, não em série (construtor → revisor → construtor esperando um pelo outro).

**Roteiro e visual dos vídeos curtos**
- **O contexto vai na 1ª ou 2ª frase:** onde, quem, o quê (ex.: "No deserto do Arizona, nos EUA, um homem…"). A fala é corrida, de conversa, nunca uma lista de fatos soltos. Não use "se você caiu aqui agora", que gasta tempo.
- **Personagem:** nunca o boneco cru em close; de longe, em silhueta ou estilizado. **HUD:** o dado nasce na cena e voa para o canto, sem caixa fixa. **Texto:** só no espaço vazio, nunca no centro por cima do objeto. **Crédito:** só na descrição, nunca na imagem.
- **Reels do FB: zero IA generativa de imagem ou vídeo.** Tudo por código. *(08/11: a rota Qwen+Wan alucinou e foi revogada.)*

**Tokens**
- Use o modelo do nível certo (Haiku mecânico, Sonnet com contrato, Opus para julgamento). Agente novo com prompt curto, nunca fork. Não leia imagens no contexto: mande ao Eduardo por SendUserFile. Aviso só quando o estado mudar.

## 3. Ao terminar
- Lição nova vai **na hora** para o BADPATHS do pipeline e, se for geral, para este arquivo.
- Commit num branch com PR. Diga ao maestro e ao Eduardo que o PR precisa de merge para a próxima sessão ver.
