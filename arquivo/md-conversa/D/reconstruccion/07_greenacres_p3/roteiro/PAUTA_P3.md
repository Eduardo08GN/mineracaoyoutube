# Learjet de Palm Beach, parte 3: pauta (03/11/2026, v2 com os 6 ajustes do suporte)

Canal: Segundo a Segundo (ES). Vídeo independente: recontar a espinha toda (molde de 9 blocos), com gancho de novidade. Primeiro vídeo inteiro sob `docs/plano-qualidade-3d.md` e com a régua de `docs/auditoria-v14b-vs-aitelly.md`.

## 0. Ajustes da revisão (v2), valem sobre o resto deste arquivo
1. **Vmo é limite de OPERAÇÃO**, não de projeto nem estrutural. A fala é "pasó su límite de operación a unos 30.000 pies; a unos 14.000, la presión del aire era el doble de la que admite ese límite".
2. **Mach recalculado** com a sondagem real de Miami (KMFL 12Z de 01/11 e 00Z de 02/11, interpolada para 17:49Z; ar ISA +5 a +13 °C; vento oeste fraco, 5–24 kt) e com o vento descontado: passa de **0,81 às 12:48:27 (~36.400 ft)**; **> 0,90 de 12:48:55 em diante**; picos de 0,94–0,99 em janelas curtas. Fala: "más del noventa por ciento de la velocidad del sonido, según nuestras cuentas". Mach sai do título. Arquivo: `dados/adsb/voo_final_calc_v2.csv` (instantes duplicados removidos).
3. **Razão de descida pela altitude BAROMÉTRICA** (a limpa): **~40.600 ft/min** de média entre 12:49:02 e 12:49:21, com picos de ~45.000 em janelas de 6 s. Fala: "al menos un veinte por ciento más rápida que el máximo que el transponder puede contar, y probablemente más al final". A GPS do fim é ruidosa (instantes repetidos) e não entra como número falado.
4. **N6 retirado como inferência.** Fica FATO + MÉTODO: o anel de 2,1–6,1 km em volta da cratera, sobre a trilha real, e "la junta va a cruzar dónde cayó cada pedazo con el viento y esta trayectoria para saber en qué segundo se soltó".
5. **Duração: 77 s**, do início da descida (12:48:16, pico de 35.450 ft barométricos) até o impacto (~12:49:33, último ponto GPS a 325 ft e ~45 m da cratera). Na parte 1 dissemos 84 s porque os dados publicados paravam em 8.750 ft e o impacto foi estimado em 12:49:35–45. O vídeo diz "con los datos completos, setenta y siete segundos".
6. **Títulos v2** (termo: "timón de profundidad", nunca "profundor"):
   - T1 (90 car.): "¿Por qué perdió una pieza de la cola en el aire el avión de Florida? Los datos del Learjet"
   - T2 (91 car.): "Accidente de avión en Florida: lo que realmente pasó en los últimos 77 segundos del Learjet"
   - T3 (80 car.): "La pieza que cayó a 6 km: los datos completos de la caída del Learjet de Florida"
   - Take d: faixa de 40–60° com o rótulo "estimada, supone viraje coordinado"; nunca o 63° do último ponto.
   - N9: **não citar as crianças** (Eduardo, 03/11).

## 1. O que há de novo desde a parte 2 (fechada em 02/11)

| # | Novidade | Fonte / grau | Uso |
|---|---|---|---|
| N1 | **Profundor esquerdo** (a superfície móvel presa ao estabilizador da cauda em T) achado em **3 pedaços, entre 1,3 e 3,8 milhas (2,1–6,1 km) da cratera**. Chapman (NTSB): "a very, very significant bit of evidence"; ainda não se sabe se a perda causou o descontrole ou se foi efeito das forças na queda. | NTSB, terça 03/11, via AVweb, IBTimes, CNN, Times Union **[OFICIAL]**. **Direção dos pedaços em relação à cratera: não divulgada** | **gancho do vídeo** |
| N2 | **Trilha ADS-B completa** (adsb.lol, ODbL, 1.028 pontos, hex A9AB17). A altitude **barométrica trava em 8.750 ft** às 12:49:23 (o "último dado" que a FAA e a parte 1 citaram); a **altitude GPS continua até 325 ft** às 12:49:32, **a ~45 m da cratera**. Impacto ≈ **12:49:33 EST**; queda de **77 s** (12:48:16 → 12:49:33). | adsb.lol `trace_full_a9ab17.json` **[NÃO OFICIAL, dado público]**; contas **[calc]** em `dados/adsb/voo_final_calc.csv` | espinha dos takes a, c, d, e, i |
| N3 | **A razão de descida real passou muito do teto do campo** (32.640 ft/min, saturado). Duas medidas independentes concordam: a barométrica dá **~40.000 ft/min** entre 12:49:00 e 12:49:21; a GPS, **~42.000–55.000 ft/min** no fim. | **[calc]** sobre ADS-B | corrige a parte 1 ("pode ter sido maior") |
| N4 | **Mach estimado**: passa de **0,81 (a Mmo) às 12:48:26**, 10 s após o início da queda, a 36.700 ft; **> 0,90 a partir de 12:48:47**; **~0,95–0,98 entre 19.000 e 10.000 ft**. Sem vento (desconhecido, ~20 kt → ±0,03). | **[calc]**; Mmo **0,81** e "Mach trim" no **TCDS EASA.IM.A.212, p. 10** **[OFICIAL]** | takes c, f |
| N5 | **Pressão do ar sobre a estrutura × limite de projeto** (Vmo **340 kt** indicados entre ~8.000 e 21.000 ft, **300 kt** abaixo, TCDS): cruza **1× às 12:48:49 (~30.000 ft)**; **~1,5× a 23.000 ft**; **~2× a 15.000 ft**; **> 3× nos últimos 8 s** (estimativa com altitude GPS). A parte 2 dizia "al menos un cuarto más". | **[calc]** sobre ADS-B + TCDS | take e |
| N6 | **A faixa do profundor coincide com o trecho da trilha** em que o avião estava a **2,1–6,1 km da cratera: 12:48:53 → 12:49:15, de ~28.600 a ~15.700 ft (GPS)**, justamente quando a pressão do ar passava de 1× a ~2× o limite. **Ressalva obrigatória**: peça leve plana e o vento a leva; a direção dos pedaços não foi divulgada; é coincidência de distância, não prova. | **[calc]** | take i + take inédito 2 |
| N7 | **Inclinação estimada pela curva da trilha** (fórmula do giro nivelado, banco ≈ atan(V·dψ/dt / g)): ~0° até 12:48:33, **~40° às 12:48:42**, **~50–55° às 12:48:55–12:49:00**, **~60° nos últimos 10 s**. Bate com a frase da tripulação "estamos inclinados sesenta grados" (texto, não áudio). Proa **099° → 290°** (191° de giro à direita). | **[calc, estimativa]**: a fórmula supõe curva nivelada; no mergulho é aproximação. Rótulo: "estimada por los datos" | take d (inédito) |
| N8 | O NTSB recebeu **vídeos de câmera de carro e vários relatos de testemunhas**; a cratera alagada foi estabilizada (poste removido na terça); acesso **a partir de quarta 04/11**, onde esperam achar componentes críticos sob a água; revisão dos registros de manutenção e da tripulação. Investigação **ERA27MA026**. Preliminar em ~30 dias. | NTSB via AVweb, The Watchers **[OFICIAL]** | bloco 8 (o que falta) |
| N9 | Tripulação: comandante + copiloto; 7 passageiros, entre eles **2 crianças**. Vítimas identificadas pela imprensa. | Aviation Week, CNN **[OFICIAL via imprensa]** | **regra do canal: sem nomes, sem idades, sem rostos**. **Não citar as crianças** (Eduardo, 03/11): na narração, só "nueve personas" |

**Já usados nas partes 1 e 2 (recontar curto, não repetir take):** cruzeiro a FL350 rumo leste, relatos de gelo claro e turbulência (texto), pedido de FL370, subida de +450 ft, mayday, overspeed, 60°, chárter Part 135 (Aurora Aviation / Upper Jets), herido en tierra, campo de restos 800 × 650 m, CVR instalado e cratera alagada, precedentes (Oklahoma 1981, Monterrey 2012, Filadélfia 2025), torres de 41–48 mil pés no radar de Miami.

**Fuso:** 01/11/2026 já era EST (UTC−5); o horário de verão terminou às 2h daquele domingo. The Watchers chama de "erro" o "EST"; o erro é deles.

## 2. Ângulo do vídeo

**"Los datos que nadie terminó de leer."** A imprensa parou no último número que o transponder mandou (8.750 ft, −32.640 ft/min). A trilha completa, pública, continua até 100 m do chão, e mostra três coisas em sequência: o avião passa do seu limite de Mach em 10 s; a força do aire passa do máximo de projeto aos 30.000 ft e chega ao dobro aos 15.000; e é justamente nessa faixa que o profundor, achado a até 6 km, pode ter se soltado. Fecha no "huevo o gallina" da parte 2, agora com régua: ou a peça falhou primeiro e derrubou o avião, ou o avião caiu primeiro e arrancou a peça. O que separa as duas é **o momento** do desprendimento, e é isso que o NTSB vai medir.

**Fato contraintuitivo (take inédito, ≥ 30 s):** a "caja negra" deste voo, na prática, são os pontos públicos do ADS-B, e eles dizem mais do que a imprensa leu: o número saturado escondia uma queda ~50% mais rápida.

## 3. Títulos (molde do viral ES + "¿Por qué…?")

| # | Molde | Título | Car. |
|---|---|---|---|
| 1 | "¿Por qué…?" (arquétipo mais forte em ES) com tipo do evento + lugar no começo | **¿Por qué se rompió en el aire el avión de Florida? Los datos completos del Learjet de Palm Beach** | 96 |
| 2 | Viral do canal (Urda): "<tipo> en <lugar>: lo que realmente pasó con <x>" | **Accidente de avión en Florida: lo que realmente pasó en los últimos 77 segundos del Learjet** | 92 |
| 3 | Gancho de novidade + número | **La pieza que cayó a 6 km: el avión de Florida rozó la velocidad del sonido antes de romperse** | 95 |

O título 3 depende do Mach ~0,95 [calc]: se o revisor achar forte demais, trocar "rozó la velocidad del sonido" por "superó su límite al doble".

## 4. Vetos e cuidados
- Sem áudio real do controle ou da caixa-preta; frases só em texto, só as que AP + NBC + AIN repetem.
- Sem material de AiTelly, Reconstructed etc.; a "prova reconstruída" (take h) é recriação 3D própria do ponto de vista de um carro na Military Trail, sem quadro do dashcam.
- Respeito no impacto: plano médio/longo, sem vítimas, sem nomes, sem idades.
- Todo número [calc] com rótulo "estimado con datos públicos" na tela e a frase falada "según nuestras cuentas con los datos públicos" na primeira vez.
- Causa não declarada: nada de afirmar flutter ou falha estrutural; "Mach trim" e "Mach tuck" como mecanismo do tipo, não como causa.

## 5. Dados no disco
- `dados/adsb/trace_full_a9ab17.json`: trilha bruta (adsb.lol, ODbL: crédito na descrição).
- `dados/adsb/voo_final_calc.csv`: tempo, posição, altitudes, GS, rumo, vz, TAS, Mach, EAS, razão de pressão × limite, giro, banco estimado, distância à cratera.
- TCDS EASA.IM.A.212, p. 10: `D:/tmp/tcds/p10.png` (copiar para `dados/`).
- Radar NEXRAD KAMX (12 volumes) e topos: `../06_greenacres_p2/pesquisa/radar/`.

## 6. Fontes conferidas na revisão do roteiro (03/11)
- **"La mayor parte del timón de profundidad izquierdo, en tres pedazos":** AVweb ("most of the elevator was found in three pieces"), CNN ("majority of the aircraft's left elevator"). Tom Chapman é **membro do conselho do NTSB** (AVweb: "NTSB member Tom Chapman"): "un miembro de la junta" está correto.
- **Atuador do estabilizador horizontal no Learjet 60:** Duncan Aviation (abr/2023), "Bombardier Learjet horizontal stabilizer actuator": o atuador ajusta o estabilizador para o trim longitudinal; revisão a cada 600 h nos 20/30/55/60. **Motor elétrico, primário e secundário: não confirmado no 60**, por isso a fala diz só "un actuador". https://duncanaviation.aero/intelligence/2023/April/bombardier-learjet-horizontal-stabilizer-actuator
- **Radar "entre ecos, bajo sus cimas":** medição EET do KAMX da parte 2 (`../06_greenacres_p2/pesquisa/fakten_p2.md` §radar). Ecos de 41–48 mil ft a até 10 km da rota, 6–13 mil ft acima do FL350. Limites: feixe de ~2 km a 117 km do radar, EET a 18 dBZ, quantização de 1.000 ft. "Entró en la tormenta" NÃO se diz.
- **Vento em altitude:** sondagem KMFL, 5–24 kt de oeste/sudoeste entre 500 e 200 hPa: "viento moderado del oeste".
- **VDBs JangaFX:** CC0 (levantamento `docs/levantamentos/2026-11-03_repos_stack_3d.md`). Na descrição: crédito de cortesia "Nubes VDB: JangaFX (CC0)". Reconferir a página da licença antes do render.
- **Cimas do radar PERTO DA ROTA (correção do batedor de mundo, 03/11):** EET do KAMX de 12:40 a 12:51 a < 10 km da trilha real: máximo de **41–43 mil ft**. Os 48 mil só aparecem às 12:35, a oeste do trecho. Rótulo na tela: "cimas a 41–43 mil pies". A fala do bloco 07 não dá número.
- **Altitude no painel:** altitude de PRESSÃO (o número da aviação: FL350 = "treinta y cinco mil"). A GPS fica ~1.100–1.900 ft acima. Depois do congelamento barométrico (12:49:23), segue pelo GPS menos a diferença medida, com o sub "estimada por GPS".
