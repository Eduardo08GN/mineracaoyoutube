# Kriegsmomente: monetização recusada, erros, correções e como auditar o outro canal

> **Para o Claude do Eduardo:** leia este arquivo inteiro antes de mexer em título, miniatura, descrição ou pauta de **qualquer** canal do nicho (Kriegsmomente, KriegsChronik e os próximos). Depois faça a **auditoria do KriegsChronik** (seção 6) e explique o resultado ao Eduardo em português, curto e simples, com a tradução ao lado de todo texto em alemão.
>
> Escrito em 14/11/2026 pela sessão do Lucas (sócio), que fez as correções no Studio do Kriegsmomente. Arquivos desta pasta:
> - `contestacao-monetizacao.md`: como contestar, roteiro do vídeo de contestação e texto pronto.
> - `inteligencia-titulos-miniaturas.md`: todos os testes A/B, o placar e as regras de título e miniatura (§1 a §15).
> - `miniaturas/antes/` e `miniaturas/depois/`: as miniaturas trocadas, com o nome igual ao ID do vídeo.

## 1. O que aconteceu

- **Recusa:** o pedido de monetização (Programa de Parcerias) foi recusado em 11/2026 com o motivo genérico "Violações das políticas de monetização do YouTube". O YouTube não diz qual vídeo nem qual política.
- **Prazos:**
  - nova inscrição só a partir de **12/02/2027**;
  - a contestação vai até **05/12/2026**, pelo chat do Studio (passo a passo em `contestacao-monetizacao.md`).
- **Nenhum vídeo tem aviso,** restrição ou reivindicação de direitos autorais. Então não foi direito autoral.
- **Causa mais provável** (é inferência nossa, o YouTube não confirma): **"conteúdo não original"**, a regra que antes se chamava "conteúdo repetitivo". O canal pareceu produção em massa.

## 2. Os erros (não repetir em nenhum canal)

| # | Erro | Como estava | Por que pesa na revisão |
|---|---|---|---|
| E1 | **Título num molde só** | Quase todos no formato "Warum … – obwohl …?" ("Por que … – mesmo tendo …?") | Grade de títulos idênticos = cara de fábrica |
| E2 | **Miniaturas com o mesmo layout** | Rosto de um lado e número grande em amarelo, branco ou vermelho do outro, em todos os vídeos | A grade do canal parecia gerada em série |
| E3 | **Rosto de IA na miniatura** | Rostos gerados por IA em quase todas | Junto com a voz e a música de IA, reforça a leitura de "automático" |
| E4 | **Metadados enganosos** (o mais grave) | Um vídeo sobre a **V-3** estava com o título e a descrição do canhão de Paris (Krupp, "42 km Stratosphäre") | Viola a política de metadados enganosos sozinho |
| E5 | **Sobras do pipeline na descrição** | "[LIZENZZEILE … ergänzen]", "KAPITEL (Schätzung, nach der Vertonung neu berechnen)", códigos de asset tipo "B070:", cabeçalho "BESCHREIBUNG" | O revisor vê na hora que o texto foi gerado e ninguém revisou |
| E6 | **Licença CC BY faltando** | O placeholder da linha de licenças nunca foi preenchido | Usa asset CC BY sem crédito, o que fere a licença |
| E7 | **Ritmo de fábrica** | 17 vídeos em cerca de 3 semanas | Reforça a "produção em massa" |
| E8 | **Fora do tema principal** | Bertha (1914), Schwerer Gustav (2ª Guerra) e artilharia em Verdun ("nachgerechnet"), num canal de 1866 e 1870/71 | O canal não tem uma identidade clara |
| E9 | **Seção "Sobre" genérica** | Não dizia quem faz, como pesquisa nem como usa a IA | O revisor lê o "Sobre" |
| E10 | **Pouca marca de autor** | Voz e música de IA, nenhuma opinião ou comentário próprio, abertura e fechamento parecidos | Falta prova de que há uma pessoa por trás |

**O que NÃO foi problema:** as descrições não revelam a stack (GPU, Blender, programa de render). Mostram só "eigene 3D-Simulation" ("simulação 3D própria"), os créditos obrigatórios de assets e mapas e, nos vídeos de artilharia, as fórmulas. **Continue assim:** a descrição nunca cita GPU, G4, Colab, Blender, Remotion, Unreal ou outra ferramenta de produção.

## 3. O que foi corrigido no Kriegsmomente em 14/11/2026

- **"Sobre" reescrito:**
  - pesquisa própria com fontes;
  - 3D e mapas feitos pelo canal;
  - a IA aparece como ferramenta declarada (voz, música, apoio).
- **V-3 (`N8OcLzVyF5I`):**
  - título novo: "V-3: Die 130-Meter-Kanone, die London treffen sollte – und nie traf" ("V-3: o canhão de 130 metros que devia acertar Londres e nunca acertou");
  - descrição nova;
  - miniatura de mapa.
- **Descrições limpas** de todo placeholder, nota interna e código de asset.
- **Miniaturas novas, sem rosto de IA, com layout diferente em cada vídeo** (antes e depois em `miniaturas/`):
  - **Primeira rodada:** Moltke (calendário dos 45 dias + foto real), V-3 (mapa, "ZIEL: LONDON"), Gustav ("EINE GRANATE = 5 AUTOS", "uma granada = 5 carros") e artilharia ("NACHTS 125 M ZU KURZ", "à noite, 125 m curto demais").
  - **Segunda rodada:** a pedido do Lucas, as 6 do layout repetido. Cada uma usa uma cena do próprio vídeo (arma em 3D, mapa, cerco visto de cima, terreno 3D) e tem posição de texto, fonte e cor diferentes:

    | Vídeo | ID | Texto da miniatura nova | Tradução |
    |---|---|---|---|
    | MG / Mitrailleuse | `51B5BSiUdcw` | 25 LÄUFE / 1 KURBEL | 25 canos, 1 manivela |
    | Áustria 1866 | `L7Oiw3YYdOA` | 49 TAGE | 49 dias |
    | Dicke Bertha | `VEKnlU0RyRE` | 810 KG PRO GRANATE | 810 kg por granada |
    | Sedan | `YIWr3C169gk` | STUNDE FÜR STUNDE | hora a hora |
    | Garde | `16LEjF-CrjY` | 2,5 KM OFFENES FELD | 2,5 km de campo aberto |
    | Paris | `D95sJOpgchQ` | 132 TAGE EINGESCHLOSSEN | 132 dias cercada |
  - Mantida de propósito: a do vídeo viral (`x_ZH1mOqZ7k`, "949.337 MANN").
- **Títulos trocados** para quebrar o molde "Warum". Em todos foi usada uma opção que já tinha rodado no teste A/B:
  - **MG:** "Deutsch-Französischer Krieg 1870: Frankreichs Geheimwaffe mit 25 Läufen – und warum sie versagte" ("a arma secreta da França com 25 canos, e por que falhou"). Tinha 35,8%, a melhor do teste.
  - **Áustria:** "Preußen gegen Österreich 1866: Wie Moltke in 7 Wochen siegte – mit Eisenbahn und Zündnadelgewehr" ("como Moltke venceu em 7 semanas, com ferrovia e fuzil de agulha"). Tinha 36,1%, contra 37,5% do Warum.
  - **Paris:** "Wie Preußen 300.000 Franzosen in Paris einschloss – ohne einen einzigen Sturm" ("como a Prússia cercou 300 mil franceses em Paris sem um único assalto"). Tinha 28%; o Warum ganhou com 49,9%. **Acompanhar o CTR.**
  - **Moltke:** "Moltke mit 69: Wie er Napoleon III. in 45 Tagen besiegte" ("Moltke aos 69: como venceu Napoleão III em 45 dias"). O teste tinha dado empate.
- **Ainda pendente com o Eduardo:**
  1. Onde está o vídeo do canhão de Paris? Talvez nunca tenha subido.
  2. A linha de licenças CC BY do Krupp programado.
  3. Conferir os capítulos do Krupp depois da narração.

**Lições dos testes A/B:**
- O "Warum … obwohl" **não ganha sempre**: perdeu em Sedan, na Garde e no MG.
- A estrutura "Deutsch-Französischer Krieg 1870: X" ganhou 2 vezes (Sedan e MG).
- Detalhes em `inteligencia-titulos-miniaturas.md`, §13 a §15.

## 4. Como mexer no Studio sem perder dado

- **Editar título ou miniatura APAGA o teste A/B daquele vídeo.** Antes:
  1. abrir "Abrir relatório do teste";
  2. anotar as 3 opções com a % de cada uma em `inteligencia-titulos-miniaturas.md`.
- **Sequência que funciona:**
  1. "Editar título" › "Continuar" (isso encerra o teste);
  2. clicar dentro do campo de título, ctrl+a e digitar;
  3. subir a miniatura;
  4. **Salvar**.
- **Se aparecer "Algo deu errado"** depois do "Continuar": recarregue a página. O teste já foi encerrado e a edição funciona.
- **Não apague vídeos antes da contestação.** O canal é avaliado do jeito que está. "Não listado" só depois, e com o OK do Eduardo.
- **Publicar é sempre manual,** feito pelo Eduardo.

## 5. Regras daqui pra frente (valem para todos os canais, desde o vídeo 1)

1. **Título:**
   - nenhuma estrutura de frase em mais de ~1 a cada 3 vídeos;
   - alternar pelo menos 4 estruturas: pergunta, número + desfecho, "Lugar Ano: …", cena ou citação;
   - comparar com os 10 últimos do canal antes de fechar;
   - no A/B: 1 opção com "Warum" + 2 com outra estrutura dizendo o mesmo de outro ângulo (regra do sócio).
2. **Miniatura:**
   - o layout muda de um vídeo para o outro: composição, cor dominante, tipo de imagem (objeto 3D, mapa, cena, pessoa real) e posição do texto;
   - de preferência, uma cena do próprio vídeo;
   - nada de rosto de IA como padrão.
3. **Descrição:**
   - escrita para aquele vídeo, com as fontes no fim;
   - créditos CC BY completos;
   - **varrer antes de publicar** por "[", "]", "Schätzung", "ergänzen", "TODO", "BESCHREIBUNG" e códigos de asset (ex.: "B070:");
   - não citar a stack (GPU, Colab, Blender, Remotion).
4. **Metadados batem com o vídeo:** confira o título e a descrição contra o arquivo e a transcrição (caso V-3).
5. **Ritmo:** de 2 a 3 vídeos por semana, não um por dia.
6. **Tema:** fiel ao tema principal do canal. Vídeo fora do tema vai para outro canal.
7. **Marca de autor em todo vídeo:**
   - análise ou opinião própria na narração;
   - abertura e fechamento diferentes;
   - um comentário fixado respondendo ao público.
8. **Portão antes de pedir monetização:** olhar a grade do canal, com títulos e miniaturas lado a lado. Se parecer fábrica, corrigir antes de se inscrever (ver `docs/BADPATHS.md` #8).

## 6. Auditoria do KriegsChronik (tarefa para o Claude do Eduardo)

**Contexto:** o KriegsChronik é o outro canal alemão do mesmo nicho. Em 11/11 ele mudou para **catástrofes técnicas** (ver `docs/canais/kriegschronik/catastrofes-tecnicas.md` e `formato-ingenieur-doku.md`). Ele ainda não é monetizado, e não podemos deixar que repita os erros da seção 2. A mesma conta e o mesmo nicho tornam o risco maior.

### Passo 1. Levantar tudo
- Pela API ou pelo `yt-dlp` (o ID do canal está no `.env` local, nunca no repositório), puxe de cada vídeo:
  - título, data, views, duração e status (público, programado, não listado);
  - descrição completa;
  - miniatura atual;
  - teste A/B ativo, se houver.
- Puxe também o texto da seção "Sobre".
- Para conferir os metadados, compare o assunto do arquivo ou da legenda com o título.

### Passo 2. Montar as grades
- Folha de contato com **todas as miniaturas lado a lado**, mandada ao Eduardo por SendUserFile. O agente não analisa a imagem no contexto.
- Lista de **todos os títulos**, marcando a estrutura de cada um (Warum, Lugar Ano, número, pergunta…).

### Passo 3. Classificar cada vídeo
| Veredito | Quando |
|---|---|
| **MANTER** | Título numa estrutura que não passa de 1 a cada 3, layout da miniatura diferente dos vizinhos, sem rosto de IA, descrição limpa e metadados batendo com o vídeo |
| **TROCAR MINIATURA** | Mesmo layout de outras (rosto de um lado, número do outro), rosto de IA ou cópia do estilo do Kriegsmomente a ponto de os dois canais parecerem a mesma fábrica |
| **TROCAR TÍTULO** | A estrutura passa de 1 a cada 3 no canal, ou o título promete algo que o vídeo não mostra. Se houver A/B, prefira uma opção já testada |
| **LIMPAR DESCRIÇÃO** | Placeholder, nota interna, código de asset, crédito CC BY faltando ou menção à stack |
| **CORRIGIR METADADOS (urgente)** | O título ou a descrição falam de outro vídeo (caso V-3) |
| **AVALIAR NÃO LISTAR** | Vídeo de guerra que, depois do pivô, deixa o canal sem identidade, ou que repete o tema de um vídeo do Kriegsmomente. **Só com o OK do Eduardo.** Pese as views e as horas (ver §2 do doc do pivô) |

Confira também o seguinte:
- **Sobreposição entre os dois canais:** o mesmo tema, a mesma miniatura ou o mesmo roteiro no Kriegsmomente e no KriegsChronik é reaproveitamento.
- **"Sobre" do canal:** se estiver genérico, reescrever no molde do Kriegsmomente (quem faz, como pesquisa, IA declarada) e com o tema novo.

### Passo 4. Entregar ao Eduardo
- Uma **tabela em português**, com as colunas: vídeo, views, veredito, título atual (com tradução), título novo sugerido (com tradução) e ideia da miniatura nova.
- Primeiro os urgentes (metadados), depois as miniaturas, os títulos e as descrições.
- Mande os títulos para copiar num bloco de código simples.
- **Não troque nada no Studio sem o OK do Eduardo.** O `docs/BADPATHS.md` #8 diz que a troca não retroage sozinha.

### Passo 5. Aplicar (depois do OK)
- Siga a seção 4: registrar o A/B antes, salvar, conferir na lista de conteúdo do Studio.
- Guarde as miniaturas antigas num backup local.
- Registre o que mudou num doc `docs/canais/kriegschronik/auditoria-AAAA-MM-DD.md`.

### Passo 6. Daqui pra frente
- Todo vídeo novo do KriegsChronik passa pelo checklist da seção 7 antes de publicar.
- Antes de pedir monetização, faça o portão da grade (§5, item 8).

## 7. Checklist antes de publicar qualquer vídeo

- [ ] O título não repete a estrutura dos 2 últimos vídeos, e a estrutura não passa de 1 a cada 3 entre os 10 últimos.
- [ ] O layout da miniatura é diferente do vídeo anterior, sem rosto de IA como padrão.
- [ ] O título e a descrição batem com o conteúdo do arquivo.
- [ ] A descrição não tem "[", "]", "Schätzung", "ergänzen", "TODO", "BESCHREIBUNG" nem códigos de asset.
- [ ] Os créditos CC BY estão completos, e as fontes históricas estão no fim.
- [ ] A descrição não cita a stack (GPU, Colab, Blender, Remotion, Unreal).
- [ ] O vídeo está dentro do tema principal do canal.
- [ ] Há uma marca de autor (análise própria) e uma abertura diferente da dos outros vídeos.
- [ ] A data respeita o ritmo de 2 a 3 vídeos por semana.
