# NOTAS da frente EUREKA (familias `dreyse` e `artilharia`)

K18 Königgrätz · 06/11/2026. Arquivos: `src/cenas/dreyse.tsx`, `src/cenas/dreyse/`, `src/cenas/artilharia.tsx`, `src/cenas/artilharia/`.
`npx tsc --noEmit -p .` passa. Stills de depuracao em `D:/tmp/k18_eureka/` (escala 0,5, porta 3105).

## O que foi feito

**Linguagem:** caderneta de engenheiro de 1866 sobre papel creme com grade quadriculada (a grade anda com a camera e torna o movimento legivel).
Desenho tecnico a tinta: secoes com hachura a 45 graus, linha de eixo traco-ponto, linha de ruptura ondulada ("Ausbruch"),
cotas com setas, aguadas de farda (azul Preussen, branco/vermelho Oesterreich). UMA cor de acento (`COR.acento`) so na peca que
trabalha: a agulha, a vareta, as raias, a cunha do Krupp, as celulas que medem a area, a palavra "Zündnadelgewehrfeuer".
Todo texto se escreve na palavra da fala (`palavras.ts`, gerado do `alinhamento.json`) e sai (ou vira lapis) quando a fala passa.
Nada de 3D: tudo SVG puro, funcao de (beat, t); muito leve por quadro.

**Metodo do telegrafo (K15):** um modelo, uma entrada, pecas por codigo com medida real.
- Fuzis: silhuetas laterais extraidas dos modelos 3D reais (Dreyse de Andy Woodhead e Lorenz de Nordic_Face, ambos CC BY 4.0;
  `dreyse/_ferramentas/extrai.py` rasteriza a malha por material e traca o contorno). Credito so na descricao do video.
- Corte do ferrolho do Dreyse com as cotas do K08 (`k8_waffen_schnitt.tsx`, cm -> mm): alma 15,4 mm, cartucho de papel com polvora
  atras, Zündpille na base do Treibspiegel, bala na frente (dossie 4.1; critica A8 corrigida: Zündpille, nao Zündhütchen).
- Soldados por codigo (`figura.tsx`): esqueleto 2D com IK de 2 ossos (a mao vai a vareta, ao ferrolho), poses de pe, ajoelhado e deitado;
  o fuzil e a silhueta real presa as maos.
- Area de frente (`frente()`): contada em celulas de 10 x 10 cm; a largura da figura e ajustada ate dar EXATAMENTE 75 / 45 / 15
  celulas = 0,75 / 0,45 / 0,15 m² (critica C.6). O 5x e o 3x nascem das copias do bloco "deitado" que voam para dentro das outras.
- Perfil do terreno REAL (DMR 5G do `DADOS`) na reta Lipa -> Sadowa (`artilharia/perfil.ts`), relevo 4x (escrito na tela).
- Canhoes: reparo = silhueta do "British field cannon 1815" (Andy Woodhead, CC BY 4.0) como TIPO de reparo de madeira; tubos por codigo
  (bronze 8 cm raiado; liso de 12 libras com bala esferica, critica A31; Krupp C/64 78,5 mm com cunha).

**Camera:** spline Hermite monotona (sem overshoot) em x, y e log(escala), em segundos do VIDEO. Cada capitulo e UMA folha:
o cap. 08 (b085..b099) e um so dolly continuo que atravessa 15 batidas sem corte; o cap. 06 (b053..b056) tambem. Nunca para.

## Batidas cobertas (23)

| beat | fase | o que a animacao demonstra (mudanca de estado) |
|---|---|---|
| b012 | deitado (cap. 02) | cronofotografia a tinta: o prussiano vai de pe -> ajoelhado -> deitado; poses passadas ficam a lapis; "er legte sich hin" se escreve em acento |
| b085 | apresenta | o Dreyse se desenha da coronha a boca; "Zündnadelgewehr" se escreve; a agulha aparece em transparencia (acento) dentro da culatra |
| b086 | mito | tres fumacas rapidas na boca; o recorte "man liest oft: … einfach schneller geschossen" |
| b087 | cadencia | "Das stimmt" = visto no recorte; mostrador de 1 minuto em 3 s: 3 tiros cheios + 2 tracejados (3 bis 5) contados pelo ponteiro; ao lado, a lapis, o estande (bis 12) |
| b088 | wagner | folha de rosto "The Campaign of Königgrätz, Arthur L. Wagner, 1889"; recua para a faixa do dia 3/7 (07:30-16:15); um cursor varre a batalha, cada tiro e um traco ligado a um de 10 homens; a media viva chega a "Ø 1,0 Schuss pro Mann" (esquematico, escrito); o minuto (3-5) e o dia (Ø 1) ficam no mesmo quadro |
| b089 | um_tiro | "Feuergeschwindigkeit allein?" escrito no recorte; o mito e riscado em acento no "nicht" |
| b090 | segredo | Lorenz em cima, Dreyse embaixo; os dois pontos de carga (boca x culatra) circulados com "?" |
| b091 | lorenz_vareta | janela de corte ao longo do cano do Lorenz: a bala entra pela boca e a vareta (acento) a empurra o cano inteiro ate a polvora; a camera acompanha a bala |
| b092 | lorenz_de_pe | austriaco de pe com a vareta subindo e descendo acima da cabeca; na palavra "knien", o ajoelhado (vareta ainda mais alta, braco esticado) |
| b093 | **agulha** | janela de corte na culatra: o cabo gira, o ferrolho recua, o cartucho cai pela janela, o ferrolho o empurra, a agulha (acento) atravessa TODA a polvora (cota "das ganze Pulver", "Zeitlupe") ate a Zündpille; clarao; a chama corre a carga de frente para tras; a bala parte; cota "15,43 mm" |
| b094 | deitado | o prussiano deitado abre o ferrolho e carrega; os dois austriacos viram lapis ao lado (mesmo chao) |
| b095 | **area** | os tres perfis giram (cartao) para a vista DE FRENTE; a area de cada um e contada em celulas de 10 cm (0,75 / 0,15 / 0,45 m²); o bloco de 15 celulas do deitado voa 5 vezes para dentro do em pe (5×) e 3 vezes para dentro do ajoelhado (3×) |
| b096 | contagem | caderno "Königinhof, 29. Juni 1866": tracos 5 + 1 tracejado (5–6) austriacos, 1 prussiano, "5–6 : 1"; cabeca com alvo "die meisten: Kopfschuss". Sem sinal de igual com o 5x (critica A11): a area ja saiu de quadro |
| b097 | trigal | campo de trigo cresce; o prussiano deitado some dentro da massa das espigas carregando; o austriaco ajoelhado; "Ihre Leute laden versteckt im Getreide." (sem aspas: e relato, critica A10) |
| b098 | maos | o austriaco se levanta acima da linha das espigas (linha tracejada vermelha); a mao treme e deixa um rastro (acento) |
| b099 | telegrama_benedek | telegrama "1. Juli 1866, 23 Uhr", arco 1. Juli -> 3. Juli ("zwei Tage vor"), "Benedek an den Kaiser"; a citacao do OeK se escreve linha a linha, "Zündnadelgewehrfeuer." em acento e sublinhado |
| b154 | fecho (cap. 14) | close no ferrolho do deitado (circulo), agulha em transparencia; a camera recua e mostra o austriaco de pe a lapis com as duas alturas tracejadas |
| b053 | raia | o bronze austriaco em Lipa; "Erstens"; janela de corte no tubo; cota "8 cm"; as raias (acento) se desenham em espiral da culatra a boca |
| b054 | giro | a granada alongada anda na alma e sai girando (faixas correndo + seta de giro); paralela, a mesma granada SEM giro capota (esquematico); o piao (Kreisel) gira ao lado |
| b055 | alcance | "potencias de dez": a camera recua da granada ate o vale inteiro (perfil real, Lipa -> Sadowa); o contador corre com a granada e para em 3.375 m alem da Bistritz; cupula tracejada do alcance |
| b056 | liso | da Bistritz, o liso prussiano de 12 libras: bala esferica, cupula de 1.500 m que nao chega a Lipa; 9 tubos, ⅓ lisos; barras 3.375 x 1.500 e "0,44 · kaum halb so weit" contando |
| b061 | paradoxo | bronze austriaco a tinta, o canhao prussiano ainda a lapis, "?" em acento, "paradox" |
| b062 | krupp | o Krupp se entinta: "Gussstahl", cota "78,5 mm", "Alfred Krupp"; planta da culatra: a cunha (acento) corre de lado e a granada entra por tras; barras na mesma escala 3.375 m x 3.500 m -> "≈ genauso weit (96 %)" |

## Problemas conhecidos / pedidos

- Os stills locais variaram de 3 s a 80 s por quadro por causa da carga da maquina (varias frentes bundlando ao mesmo tempo).
  O conteudo e SVG puro; o custo real por quadro na G4 deve ficar bem abaixo de 1,5 s. A primeira montagem de cada aba recalcula
  a contagem de area (~0,2 s, depois cache) e o perfil do DEM (~0,1 s).
- O `remotion bundle` da CLI travou duas vezes copiando os 110 MB do `public` sob carga. Para depurar uso
  `dreyse/_ferramentas/bundle.mjs` (publicDir vazio + junction `bundle/public -> v1/public`, sem cache do webpack, que dava EPERM
  com as outras frentes) e `dreyse/_ferramentas/stills.mjs` (um navegador, varios stills, porta 3105). Nao afeta o render da G4.
- Vista de frente do ajoelhado: em vista frontal ele le como "homem mais baixo"; a virada de perfil -> frente e o rotulo "kniend" carregam a leitura.
- Wagner (b088): a distribuicao dos 10 tiros entre 10 homens e ilustrativa (escrito "schematisch"); o dado e so a media (~1).
- Posicao do liso prussiano em b056: posto na Bistritz (Sadowa) para mostrar a geometria 1.500 m x 3.375 m sobre o terreno real;
  o dossie fala de baterias "a leste da Bistritz", mas nao diz onde estavam as lisas. Escrito "Flugbahnen schematisch" na tela.
- Reparo dos canhoes = TIPO (modelo britanico de 1815), nunca legendado como M1863/C64; os tubos e as cotas sao os do dossie.
- O telegrama e desenhado aqui (familia dreyse). Se a frente "telegrama" tiver um formulario-padrao, vale unificar o visual.
- Regenerar `dreyse/palavras.ts` se a narracao mudar (rodar em `k18_koeniggraetz/`):
  `node -e "const p=require('./v1/src/plano.json'),a=require('./voz/alinhamento.json'),o={};for(const b of p.beats)if(b.familia==='dreyse'||b.familia==='artilharia'){const k=p.kapitel.find(x=>x.id===b.cap);o[b.id]=a[b.cap].palavras.filter(w=>k.s+w.s>=b.ini-0.05&&k.s+w.s<b.fim_fala+0.05).map(w=>[w.w.replace(/[.,:;!?]/g,''),+(k.s+w.s).toFixed(2),+(k.s+w.e).toFixed(2)])}require('fs').writeFileSync('v1/src/cenas/dreyse/palavras.ts','export const PAL: Record<string, [string, number, number][]> = '+JSON.stringify(o)+';
')"`
- Os tempos de todos os gestos vem de `pal(beat, palavra)`; as chaves de camera do cap. 08 e do cap. 06 estao em segundos absolutos
  do video (se o `plano.json` mudar os `ini`, ajustar as chaves em `cap08.tsx`, `cap06.tsx`, `krupp.tsx` e `avulsos.tsx`).

## Vitrine (3 melhores still)

1. **(b095, 0.98)**: area. Tres vistas de frente lado a lado; as celulas de 10 cm contadas, os blocos do deitado empilhados
   dentro do em pe (5x) e do ajoelhado (3x); 0,75 / 0,45 / 0,15 m² nascidos da contagem. Still local: `D:/tmp/k18_eureka/VITRINE_1_area.jpg`.
2. **(b093, 0.83)**: agulha. Corte do ferrolho: a agulha (acento) atravessou toda a polvora ("das ganze Pulver"), a Zündpille
   acende e a chama corre a carga de frente para tras; bala logo a frente. `D:/tmp/k18_eureka/VITRINE_2_agulha.jpg`.
3. **(b056, 0.97)**: liso. Perfil real Lipa -> Bistritz: a granada austriaca de 3.375 m cobre o vale; o liso prussiano de 1.500 m
   nao chega a Lipa; barras no chao e "0,44 · kaum halb so weit", ⅓ dos tubos lisos. `D:/tmp/k18_eureka/l2.jpg`.
   (Alternativa mais limpa: (b053, 0.985), as raias em espiral no corte do tubo de bronze com a cota de 8 cm.)

## Desempenho medido (local, 1080p, concurrency 1, maquina carregada)

30-60 quadros por trecho, incluindo a partida do navegador e a carga dos dados: agulha ~0,5 s/quadro, area ~0,35 s/quadro,
trigal ~0,8-1,6 s/quadro (maquina sob carga), alcance ~0,8 s/quadro. Folhas de quadros: `D:/tmp/k18_eureka/folha_*.jpg`.
