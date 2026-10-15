# 01 · Persona: Carmen, a quiromasajista de Triana

> **Leia nesta ordem:** 01 (quem ela é) → 02 (como gerar a avatar no Google Vids) → 03 (como montar o vídeo longo)
> → 04 (a análise RMBC da VSL de referência e como adaptá-la para a Espanha).
>
> **A tarefa:** produzir uma VSL em espanhol da Espanha, estrelada por uma avatar realista gerada no Google Vids,
> para vender um **app de automassagem**. A VSL de referência é francesa (`D:\vsl_massagem\LS.mp4`, "Libération
> Sciatique"); a análise dela está no doc 04. O pipeline técnico já foi usado de ponta a ponta no canal
> "Mamaw Opal" (YouTube, out/2026) e está em `work/video/` (docs 02 e 03).

## Decisões já tomadas pelo Eduardo (não reabrir)

| Item | Decisão |
|---|---|
| Mercado | Espanha (espanhol peninsular) |
| Papel da avatar | Estrela da VSL (fala na câmera; não é só narradora) |
| Origem da persona | Andaluzia |
| Estilo visual | Realista |
| Geração de imagem e avatar | Google Vids (imagens: painel "Imagem"; falas: "Vídeo com IA"/Omni) |
| Voz | TTS do Google, na conta Google Ultra (ver doc 03, seção Voz) |
| Entregável vendido | Um app (a VSL termina chamando para ele) |

## Quem ela é

**Carmen Delgado Ruiz**, 58 anos (nasceu em 1968), de **Triana, Sevilla**.

- **Profissão:** quiromasajista titulada (formação em quiromasaje em Sevilla, 1990) e terapeuta manual, com
  gabinete próprio em Triana desde 1997. **34 anos de camilla.**
- **O que ela NÃO é:** médica, fisioterapeuta ou "doctora". Na Espanha, *fisioterapeuta* é profissão sanitária
  regulada; colocar esse título numa personagem fictícia é credencial falsa. Nada de jaleco de médico, estetoscópio
  ou "Dra.". Ela veste a **filipina/túnica branca de massagista**.
- **Por que ela convence sem diploma médico:** experiência de mãos (34 anos de camilla; um número de "espaldas"
  atendidas pode entrar no roteiro se o Eduardo aprovar e for coerente com a lore), linguagem simples, e o fato de
  ter sentido a dor na própria pele.

### A história (a "lore") — fixa, não inventar outra

1. **A avó Rocío** era a *sobadora* do bairro (tradição popular andaluza): as vizinhas iam à casa dela quando
   "se les montaba un nervio". Carmen, menina, olhava as mãos da avó.
2. **O pai, Manuel**, era estivador no porto de Sevilla. Chegava em casa com as costas destroçadas. Aos 14 anos
   Carmen massageava as costas dele toda noite na mesa da cozinha. Foi assim que ela descobriu que tinha "manos".
   Manuel morreu em 2009; ela fala dele com carinho.
3. **A formação e o gabinete:** curso de quiromasaje em 1990; gabinete em Triana desde 1997, numa salinha com
   azulejos, cheiro de óleo de amêndoas e um vaso de gerânios na janela.
4. **O ponto de virada (o "momento herói"):** em 2018, aos 50, depois de 28 anos inclinada sobre a camilla, a
   lombar dela travou no meio de uma sessão; ela ficou dobrada, sem conseguir se endireitar, com a cliente
   olhando. Quem cuidava de todo mundo não sabia cuidar de si.
5. **A descoberta:** nos meses seguintes ela testou em si mesma o que fazia nos clientes, adaptado para as
   próprias mãos, uma bola de tênis e a parede. Ficou com **uma rotina curta de automassagem** (o "mecanismo" da
   VSL: ver doc 04) que ela faz todo dia, em poucos minutos, e passou a ensinar aos clientes para fazerem em casa
   entre as sessões.
6. **Por que um app:** a agenda lotou, a lista de espera passou de meses, e clientes de fora de Sevilla pediam.
   A filha (Lucía) e um sobrinho que trabalha com tecnologia a convenceram a gravar tudo num app.

### Família e pessoas recorrentes (para cenas e histórias)

| id | Quem | Época/aparência |
|---|---|---|
| `carmen` | Carmen hoje, 58 | a âncora principal (prompt abaixo) |
| `carmen_joven` | Carmen aos 14–22 (1982–1990) | cabelo preto longo, magra, roupas dos anos 80 |
| `manuel` | o pai, estivador | 1980s, 45 anos, forte, camisa de trabalho, porto de Sevilla |
| `rocio` | a avó *sobadora* | 1970s, 70 anos, vestido preto, coque branco, casa de pátio em Triana |
| `antonio` | o marido, taxista aposentado | 60 anos, bigode grisalho, camisa polo |
| `lucia` | a filha, 34 | mora em Madri, cabelo castanho preso, roupa casual |
| `nenhum` | sem personagem fixo | mãos, objetos, ruas, a ponte de Triana, o rio |

### Personalidade e voz

- Calorosa, direta, com o humor andaluz contido. Frases curtas. Chama a pessoa de *cariño*, usa *mira*,
  *fíjate*, *te lo digo yo*. Conta casos de clientes **sem nome completo** ("una clienta mía, maestra de
  Dos Hermanas…").
- Ritmo de quem explica com as mãos: para, mostra, repete a ideia principal.
- Sotaque: **andaluz suave** nas falas da avatar (prompt do Omni). A narração por TTS sai em espanhol peninsular
  padrão; o sabor andaluz vem do vocabulário, não de forçar o sotaque.
- **Nunca** ataca médicos, fisioterapeutas ou remédios. O "vilão" é outro (doc 04): o dia a dia que ninguém
  ensina a cuidar, as soluções genéricas e passivas, a espera.

## A âncora visual (o retrato que fixa o rosto)

Gerar UMA vez no painel "Imagem" do Vids (doc 02), salvar em `ref/carmen.png` no projeto e nunca mais trocar: toda
cena com a Carmen é uma **edição** desse retrato.

Prompt (inglês, como o Vids responde melhor):

```
A realistic photo of a 58-year-old Spanish woman from Seville, Andalusia, sitting in her small massage therapy room
and looking at the camera with a warm, confident half smile. Dark brown hair with natural gray streaks pulled back in
a low bun, warm olive skin with real wrinkles and sun spots, dark brown eyes, small gold hoop earrings, strong
capable hands resting on her lap. She wears a simple white short-sleeved massage therapist tunic (not a doctor's lab
coat, no stethoscope, no name tag). Behind her: a massage table with a folded white towel, whitewashed walls with a
band of blue and white Andalusian tiles, a wooden shelf with amber glass bottles of massage oil, a window with a pot
of red geraniums. Soft natural window light, modern interview look, 16:9, shot at eye level, realistic skin texture,
natural facial asymmetry, no beauty filter, no text, no logos.
```

Depois de gerar, conferir no olho: mãos com 5 dedos, nada de jaleco médico, sem texto na parede. Se sair errado,
gerar de novo antes de qualquer outra coisa.

**Cenários fixos** (variar entre eles nas falas da avatar): o gabinete (o da âncora); a sala da casa dela (sofá,
mesinha, foto do pai na estante); o pátio andaluz com vasos de flores; a cozinha com azulejos.

## O que a Carmen pode e não pode dizer (vale para roteiro, legendas e imagens)

Isto não é enfeite: a VSL francesa de referência faz várias coisas que, na Espanha, são proibidas para publicidade
de produto com finalidade de saúde (Real Decreto 1907/1996, art. 4; Diretiva 2005/29/CE, anexo I, item 17) e que
derrubam anúncios no Meta e no YouTube. **Validar o texto final com um advogado espanhol antes de rodar tráfego.**

| Pode | Não pode |
|---|---|
| Falar de tensão, rigidez, desconforto, bem-estar, "sentirse más suelta" | Prometer **curar** ciática, hérnia, "deshinchar discos" ou qualquer doença |
| Contar a própria experiência como opinião ("a mí me cambió…") | Números de eficácia inventados ("en el 83 % de los casos") |
| Dizer que é complemento ("no sustituye a tu médico ni a tu fisio") | Dizer que evita cirurgia, que remédio é perigoso ou que o médico esconde algo |
| Depoimentos **reais** de usuários, com autorização | Depoimentos inventados apresentados como pessoas reais (a VSL francesa usa vários) |
| Dramatizações **rotuladas** como dramatização | Medo de cadeira de rodas/paralisia para empurrar a compra |
| Recomendar procurar médico diante de sinais de alarme (dor com perda de força, formigamento que piora, febre, perda de controle da bexiga) | Sugerir parar tratamento médico |

**IA à vista:** a Carmen é uma personagem gerada por IA. A Lei de IA da UE (art. 50, aplicável a partir de
agosto de 2026; confirmar a situação atual com o advogado) pede aviso quando um conteúdo realista é gerado por IA,
e as plataformas de anúncio também pedem. Pôr um aviso discreto e permanente na VSL ("Personaje e imágenes
generados con IA") e no texto do anúncio.
