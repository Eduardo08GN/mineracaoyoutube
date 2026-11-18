# Crítica do minerador à varredura de descoberta (01/11/2026)

Conferi as afirmações centrais na própria API (~2,3 mil unidades). Scripts e saída em `minerador/`: `checa_doc.py`, `vestigium.py`.

## (a) Onde a varredura ainda está enviesada

1. **A localização mascara a oferta em ES (comprovado).**
   - Os vídeos PT/EN que "aparecem na busca ES" têm **título localizado em espanhol**:
     - Yungay: `localizations` = en-US, **es-US**, pt-BR;
     - Peraliya: en-US, **es-US**, pt-PT;
     - Lisbon (Arthur Revives the Past): 24 idiomas, **es** incluído.
   - O hispânico vê "LA TRAGEDIA DE YUNGAY" em espanhol, provavelmente com áudio dublado. A API não mostra faixas de áudio, então esse ponto é hipótese.
   - É o mesmo erro do radar de 28/10 com o Reconstructed.
   - **"Vazio em ES" só por título nativo não prova lacuna.** Essa concorrência já chega ao público ES.

2. **A medição da oferta ES voltou ao vocabulário nosso.**
   - A busca "la tragedia de … documental completo" é o molde PT traduzido. Ela não acha o molde nativo ES "<LUGAR AÑO>: El <fenómeno> que…".
   - O **VESTIGIUM | Historia Sepultada** (ES, 25 mil inscritos) faz exatamente esse formato desde jun/2026:

     | Vídeo | Duração | Views |
     |---|---|---|
     | Valdivia 1960 | 28 min | **1,43 mi** |
     | Cádiz 1755 | 48 min | 855 mil |
     | Galveston 1900 | 31 min | 756 mil |
     | Krakatoa 1883 | 31 min | 735 mil |
     | Armero 1985 | 26 min | 682 mil |

   - Só o Yungay já tem 4 vídeos ES nativos com mais de 1,3 mi: Resilentos (27 min, 1,38 mi), Abraham Prudencio, Rolando Pérez e Historias de historia.
   - O Pero eso es otra Historia (2,07 mi de inscritos) fez "Los 16 terremotos más destructivos" com **1,68 mi**.

3. **A consistência "últimos 50 uploads" pune quem pivotou e premia canal novo.**
   - O VESTIGIUM tem mediana de 34 mil nos últimos 50 longos, mas 5 hits de 0,68–1,43 mi concentrados em 3 semanas (jun–jul).
   - O Um Documentário (204 dias) nasceu já no formato.
   - **Sugestão:** medir a taxa de hit nos últimos 10 longos e por molde de título, não por canal inteiro.

4. **Os hits do Um Documentário são de ago–set**, fora da janela de 30 dias da busca sem q. Eles entraram pela expansão do canal, o que está certo. Mas a busca sem q, ordenada por views, ainda chega aos formatos por quem já ficou grande. **Formato nascendo agora (20–50 mil) segue invisível**, como o próprio relatório reconhece.

5. **O PT apareceu por vazamento e é o mercado mais quente**, mas não foi varrido. Dois cuidados:
   - **Oportunidade fora do escopo, para o Eduardo:** ele fala PT. O formato tem 115 mil inscritos em 204 dias e mediana de 607 mil.
   - **Já há clones em PT** (Sessão Documentário com Vajont, 501 mil, 1 mês depois). A corrida PT está no estágio de clones (hipótese).

6. **Classificação de domínio por palavra do título ("?") e filtro de anúncio por likes < 0,3%.** Os dois podem ter cortado justamente canais faceless de documentário longo, que têm engajamento baixo por natureza. Não medi o efeito, então fica como hipótese.

7. **O estilo visual dos documentários não foi lido.** Concorrentes próximos se declaram "reconstrução com IA" (Tom Reconstitui, Nick Historia Renacida). Se o Um Documentário for imagem cinematográfica de IA de 60 min, o apelo é emoção e paisagem, não maquete. Ler 2–3 vídeos a 20 fps antes de concluir que o nosso visual serve.

## (b) Lacuna real? Cabe no pipeline?

**Lacuna: parcial, não "vazio".**
- A demanda ES por "tragédia natural de lugar" está provada várias vezes: VESTIGIUM, Yungay nativo, Pero eso es otra Historia e os vídeos PT/EN localizados.
- **O que NÃO existe em ES:**
  - um canal **consistente** nesse formato (o VESTIGIUM é irregular);
  - **reconstrução 3D segundo a segundo** do mecanismo físico: os ES nativos são narração com arquivo/IA.
- Ou seja: o espaço é "formato provado com oferta irregular e sem o nosso diferencial". Não é um oceano vazio.

**Duração e produção:**
- Os hits ES nativos têm **26–31 min**, não 60 (Valdivia 28 min com 1,43 mi; Armero 26; Krakatoa 31; Resilentos/Yungay 27). **Não precisamos de 50–69 min.**
- Estimativa para 25 min, pelo nosso MEDICAO: roteiro de ~3.500 palavras, narração em 2 lotes no AI Studio, ~350–400 batidas (2 planejadores ou 4), render de ~25 min na G4 e mix. Total **~3,5–4 h**. Isso fura a regra de ≤ 2 h da mineração tridimensional.
- **Opções para o Eduardo:**
  1. versão de **18–20 min** em ~3 h;
  2. ≤ 2 h com 12–14 min (o nosso formato atual), mas aí não é o formato documentário;
  3. **aceitar a exceção de 4 h** para 1 vídeo/semana, se o primeiro provar.
- O kit cobre boa parte:
  - Terreno Copernicus (Huascarán/Yungay, Nevado del Ruiz/Armero);
  - VFX de poeira/fumaça;
  - manequins.
- O que falta é **fluxo de massa** (alud, lahar, onda). É o batedor de água/lava de 45–60 min que já está na lista. Um mesmo shader de "massa que desce pelo vale sobre o Terreno" serve a Yungay, Armero, Vajont e tsunami.

## (c) O que manter e o que cortar na implicação

| Item | Veredito | Por quê |
|---|---|---|
| What If sai | **manter** | Coordenada Crítica: 11 mil × 604 mil (§2); conversão 0,06–0,23% |
| Desastre natural **quente** explicado | **manter, e é o mais forte** | Nepal: 5,13 mi EN e 709/816 mil ES em 2–3 semanas; casa com o radar (sismo, riada, alud) e com a perna notícia |
| Evergreen "tragédia natural de lugar" | **manter, reenquadrado** | A oferta não é vazia: a concorrência é VESTIGIUM + localizados PT/EN. O diferencial é 3D do mecanismo + segundo a segundo + 25 min. **Começar por evento hispânico onde o líder PT/EN não está localizado ou não existe** (a conferir: Valparaíso 1906, Huaraz 1941, Chillán 1939, Ica 2007, Cumbre Vieja) e não por Yungay/Armero, que já estão ocupados |
| Engenharia de lugar hispânico ("por qué se hunde/no se cae") | **manter só como hipótese** | n = 3 hits em 2 canais. Falta a consistência do Sapiens Explica e do CONSTRUCTUM (taxa de hit nos últimos 10) antes de virar perna |
| Ricos Sin Suelo / "más grande del mundo" | **cortar** | estágio de clones |
| Fathom (investigação de desastre pouco conhecido) | **manter na reserva** | mediana de 149 mil com 1/mês em EN; em ES não medido. Casa com o take inédito |
| Perna máquina/transporte (Urda) | **manter** | a descoberta não a refuta. É o nosso único dado próprio (32,5 mil) |

**Próximos passos que proponho antes da v2 do PLANO_FINAL:**
1. ler 2–3 vídeos (Um Documentário, VESTIGIUM e um ES de Yungay) a 20 fps, para estilo e ritmo;
2. medir a oferta ES nativa + localizada para 10 eventos naturais hispânicos não cobertos pelo VESTIGIUM nem pelo Um Documentário;
3. medir a consistência dos canais de engenharia de lugar.
