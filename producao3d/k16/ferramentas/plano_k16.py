# K16: plano de batidas a partir de roteiro/frases.json (tempo de cada frase do alinhamento).
# Uma batida por frase; frases > 7 s viram 2 batidas (B na metade, na palavra mais próxima). Cada batida declara:
#   fam   : 'anat' (anatomia do navio), 'mapa' (mapa escuro), 'epoca' (pintura/foto 2.5D), 'lapis' (escrita sobre documento)
#   take  : parâmetros da família (o motor da cena interpreta)
#   muda  : o que MUDA de estado durante a frase (obrigatório; sem isso a batida volta)
#   dims  : dimensões cruzadas (>= 2–3: objeto/lugar, ação, dado, tempo, causa→efeito)
#   mk    : marcadores [{tipo, ..., palavra}] que entram NA palavra (pipeline oficial)
import json, re
R = r"D:/kriegschronik/k16_seekrieg"
F = {f["id"]: f for f in json.load(open(f"{R}/roteiro/frases.json", encoding="utf-8"))}

A = lambda cam, muda, dims, **k: {"fam": "anat", "take": {"cam": cam, **k}, "muda": muda, "dims": dims}
M = lambda vista, muda, dims, **k: {"fam": "mapa", "take": {"vista": vista, **k}, "muda": muda, "dims": dims}
E = lambda img, muda, dims, **k: {"fam": "epoca", "take": {"img": img, **k}, "muda": muda, "dims": dims}
L = lambda doc, muda, dims, **k: {"fam": "lapis", "take": {"doc": doc, **k}, "muda": muda, "dims": dims}

P = {
 # 01 Vor Helgoland
 "01_01": M("europa_helgoland", "zoom da Europa até Helgoland; data 11.08.1870 escrita no mar", "lugar·tempo", mk=[{"tipo": "rotulo", "txt": "11. AUGUST 1870", "palavra": "August"}]),
 "01_02": M("helgoland", "7 + 4 ícones franceses fundeiam um a um", "lugar·dado·ação", mk=[{"tipo": "contador", "de": 0, "ate": 11, "palavra": "Sieben"}]),
 "01_03": M("helgoland_jade", "linha Helgoland→Wilhelmshaven se desenha; Watt aparece", "lugar·dado", mk=[{"tipo": "cota", "txt": "80 km", "palavra": "Kilometer"}], faixasJade=True),
 "01_03B": M("jade_wilhelmshaven", "zoom até Wilhelmshaven; anel no porto", "lugar·tempo", mk=[{"tipo": "anel", "lugar": "Wilhelmshaven", "palavra": "Wilhelmshaven"}]),
 "01_04": M("jade_wilhelmshaven", "5 ícones alemães acendem dentro do porto", "lugar·dado"),
 "01_05": M("jade_wilhelmshaven", "corte seco: '5' gigante no mar", "dado", mk=[{"tipo": "numero", "txt": "5", "palavra": "fünf"}]),
 "01_06": M("nordsee_contagem", "49 ícones franceses enchem o mar ao lado dos 5", "dado·comparação", mk=[{"tipo": "contador", "de": 5, "ate": 49, "palavra": "neunundvierzig"}]),
 "01_07": M("helgoland_jade", "a linha até Wilhelmshaven fica vazia e tracejada", "lugar·causa", mk=[{"tipo": "trilha", "estilo": "tracejada", "palavra": "angreifen"}]),
 "01_08": A("chega", "o couraçado chega e para no palco", "objeto·ação", chega=True),
 "01_09": A("perfil", "corte seco para o perfil parado", "objeto"),
 "01_10": M("helgoland_cherbourg", "trilha de volta a Cherbourg; datas 11.08 → 12.09", "lugar·tempo", mk=[{"tipo": "trilha", "estilo": "solida", "palavra": "Monat"}]),
 # 02 Drei Dinge
 "02_01": A("orbita", "câmera orbita o couraçado lentamente", "objeto·narrativa"),
 "02_02": L("lista", "lista de navios e canhões se escreve e é riscada", "dado·narrativa", linhas=["49 Panzerschiffe", "1.500 Kanonen?"], riscar=True),
 "02_03": M("cherbourg", "ícone de regimento em Cherbourg sai em direção à terra", "lugar·causa", mk=[{"tipo": "rotulo", "txt": "SOLDATEN", "palavra": "Soldaten"}]),
 "02_04": M("jade_faixas", "faixas de profundidade do Jade aparecem", "lugar·dado", faixasJade=True, mk=[{"tipo": "rotulo", "txt": "WASSER", "palavra": "Wasser"}]),
 "02_05": A("bunker", "o bunker de carvão acende", "objeto·dado", destaque="bunker", mk=[{"tipo": "rotulo", "txt": "KOHLE", "palavra": "Kohle"}]),
 "02_06": M("tres_simbolos", "os três símbolos acendem nos seus lugares; semanas correm", "lugar·tempo·narrativa"),
 # 03 Flotte auf dem Papier
 "03_01": E("frota_francesa", "zoom lento na fila de navios franceses", "época·objeto", foco="fila"),
 "03_02": M("silhuetas_49_5", "silhuetas: a fila francesa enche a tela", "dado·comparação", mk=[{"tipo": "contador", "de": 0, "ate": 49, "palavra": "neunundvierzig"}]),
 "03_03": M("silhuetas_49_5", "a fila alemã: cinco silhuetas curtas", "dado", mk=[{"tipo": "numero", "txt": "5", "palavra": "fünf"}]),
 "03_04": M("estaleiros", "cinco trilhas saem dos estaleiros, nenhuma da Alemanha", "lugar·causa"),
 "03_05": E("koenig_wilhelm", "paralaxe na foto do König Wilhelm; rótulo Themse", "época·objeto", mk=[{"tipo": "rotulo", "txt": "THEMSE · LONDON", "palavra": "Themse"}]),
 "03_06": M("estaleiros_londres", "duas trilhas de Londres a Wilhelmshaven", "lugar"),
 "03_07": E("friedrich_carl", "foto do Friedrich Carl; rótulo La Seyne", "época·objeto", mk=[{"tipo": "rotulo", "txt": "LA SEYNE · FRANKREICH", "palavra": "Frankreich"}]),
 "03_07B": M("estaleiros_franca", "trilhas de La Seyne e Bordeaux até o Jade", "lugar·ironia"),
 # 04 Panzerschiff
 "04_01": A("chega", "o couraçado chega ao palco", "objeto·ação", chega=True),
 "04_02": A("tres_quartos", "rótulo PROVENCE-KLASSE", "objeto", mk=[{"tipo": "rotulo", "txt": "PROVENCE-KLASSE", "palavra": "Provence"}]),
 "04_03": A("cinta", "zoom até a cinta laranja; fatia com a mão como escala", "objeto·dado·conceito", destaque="cinta", fatia=True, mk=[{"tipo": "rotulo", "txt": "PANZERGÜRTEL", "palavra": "Gürtel"}]),
 "04_04": A("bateria", "a fileira de canhões acende", "objeto", destaque="bateria", mk=[{"tipo": "rotulo", "txt": "BATTERIE", "palavra": "Kanonen"}]),
 "04_05": A("maquina", "a casa de máquinas acende no corte", "objeto", destaque="maquina", mk=[{"tipo": "rotulo", "txt": "DAMPFMASCHINE", "palavra": "Dampfmaschine"}]),
 "04_06": A("mastros", "câmera sobe pelos mastros com vergas", "objeto·ação", mk=[{"tipo": "rotulo", "txt": "3 MASTEN", "palavra": "Masten"}]),
 "04_07": A("perfil_lento", "perfil inteiro: vapor e vela no mesmo casco", "objeto·tempo"),
 "04_08": A("perfil_lento2", "câmera desce para a linha d'água", "objeto·narrativa"),
 "04_09": A("calado", "régua de 8,4 m se desenha abaixo d'água", "objeto·dado", destaque="vivas", regua=True, mk=[{"tipo": "regua", "txt": "8,4 m", "palavra": "acht"}]),
 "04_10": A("bunker", "bunker acende; 600 t", "objeto·dado", destaque="bunker", mk=[{"tipo": "numero", "txt": "600 t", "palavra": "sechshundert"}]),
 "04_11": A("perfil_marcas", "os dois marcadores (8,4 m e 600 t) ficam juntos no perfil", "dado·causa", regua=True),
 # 05 Plan
 "05_01": M("plano_baltico", "trilha tracejada do plano Cherbourg→Báltico se desenha", "lugar·plano", mk=[{"tipo": "trilha", "estilo": "tracejada", "palavra": "Seekrieg"}]),
 "05_02": M("plano_baltico", "corte seco: um '?' laranja na ponta da trilha", "narrativa"),
 "05_03": M("plano_kiel", "seta de desembarque na costa alemã", "lugar·ação"),
 "05_04": M("dinamarca", "a Dinamarca acende; Schleswig-Holstein perdido em 1864", "lugar·tempo·causa", mk=[{"tipo": "rotulo", "txt": "1864", "palavra": "achtzehnhundertvierundsechzig"}]),
 "05_04B": M("dinamarca", "40–50.000 escrito sobre a Dinamarca", "dado", mk=[{"tipo": "numero", "txt": "40–50.000", "palavra": "Armee"}]),
 "05_05": M("dinamarca_seta", "a seta Dinamarca→guerra fica cinza até haver desembarque", "causa→efeito"),
 "05_06": M("transportes", "transportes com soldados entram na trilha; sem eles nada se acende", "causa·dado"),
 # 06 Sieben statt vierzehn
 "06_01": A("orbita_escura", "a câmera para no casco escuro", "narrativa"),
 "06_02": L("calendario", "datas escritas: 14. Juli · 19. Juli Krieg", "tempo·dado", linhas=["14. Juli – Vorbereitung", "19. Juli – Kriegserklärung"]),
 "06_03": E("bouet", "retrato de Bouët-Willaumez; zoom no rosto", "época·pessoa", mk=[{"tipo": "rotulo", "txt": "BOUËT-WILLAUMEZ", "palavra": "Bouët-Willaumez"}]),
 "06_04": A("contorno14", "14 contornos tracejados de navios no palco", "dado·plano", mk=[{"tipo": "contador", "de": 0, "ate": 14, "palavra": "vierzehn"}]),
 "06_05": L("calendario", "'3 Schiffe · 16.000 Matrosen fehlen' escrito e sublinhado", "dado", linhas=["vorhanden: 3 Schiffe", "es fehlen: 16.000 Matrosen"]),
 "06_06": A("sai", "o couraçado sai do palco; 7 dos 14 contornos se preenchem", "objeto·dado·ação", sai=True),
 "06_07": L("carta_ordens", "'Ostsee · Elbe · Jade' escrito sobre a carta", "lugar·plano", linhas=["Ostsee · Elbe · Jade"]),
 "06_08": L("carta_ordens", "sublinha 'mit 7 Schiffen'", "dado", linhas=["Ostsee · Elbe · Jade", "mit 7 Schiffen"], sublinhar=[1]),
 "06_09": M("plymouth_jade", "trilha da esquadra alemã Plymouth→Wilhelmshaven, 16.07", "lugar·tempo", mk=[{"tipo": "rotulo", "txt": "16. JULI", "palavra": "sechzehnten"}]),
 # 07 Landungsarmee
 "07_01": M("baltico_e_franca", "a frota no Báltico; a câmera desliza para a fronteira", "lugar·tempo"),
 "07_02": M("fronteira", "duas barras de efetivo, a francesa menor", "dado·comparação"),
 "07_03": M("fronteira", "Weißenburg, Wörth, Spichern marcados um a um", "lugar·tempo", mk=[{"tipo": "rotulo", "txt": "WÖRTH", "palavra": "Wörth"}]),
 "07_04": M("fronteira", "a fronteira pulsa em laranja", "lugar·causa"),
 "07_05": M("divisao_cherbourg", "10.000 pontos saem de Cherbourg", "dado·ação", mk=[{"tipo": "contador", "de": 0, "ate": 10000, "palavra": "zehntausend"}]),
 "07_05B": M("divisao_chalons", "os pontos chegam a Châlons", "lugar·tempo"),
 "07_06": M("divisao_sedan", "os pontos seguem para Sedan", "lugar·ação"),
 "07_07": E("sedan", "pintura da capitulação; zoom nas tropas cercadas", "época·consequência", mk=[{"tipo": "rotulo", "txt": "2. SEPTEMBER", "palavra": "September"}]),
 "07_08": M("baltico_apaga", "a trilha de desembarque no Báltico se apaga", "causa→efeito"),
 "07_09": M("baltico_apaga", "corte seco: mar vazio", "narrativa"),
 "07_10": L("comissao", "a conclusão da comissão escrita e sublinhada", "fonte·causa", linhas=["Ohne Landungstruppen –", "nichts zu erreichen."], sublinhar=[0]),
 # 08 Zu tief
 "08_01": A("orbita", "a câmera gira até a proa", "objeto·pergunta"),
 "08_02": A("calado", "a régua de 8 m volta", "objeto·dado", destaque="vivas", regua=True),
 "08_03": M("costa_nordsee", "a costa alemã do Mar do Norte em close", "lugar"),
 "08_04": M("jade_faixas", "o Watt aparece em faixas", "lugar·dado", faixasJade=True, mk=[{"tipo": "rotulo", "txt": "WATTENMEER", "palavra": "Wattenmeer"}]),
 "08_05": M("jade_canal", "o canal estreito se desenha de Wangerooge ao porto; maré alta", "lugar·tempo", faixasJade=True),
 "08_06": A("calado_faixa", "réguas: 7 m a 9 m no casco", "objeto·dado", destaque="vivas", regua=True, mk=[{"tipo": "regua", "txt": "7–9 m", "palavra": "sieben"}]),
 "08_06B": M("jade_navio_para", "ícone do couraçado avança e PARA na borda do raso", "lugar·dado·causa→efeito", faixasJade=True),
 "08_07": M("jade_apaga", "faróis apagam, boias somem", "lugar·ação"),
 "08_08": M("kiel_barreira", "barreira de Friedrichsort, minas e baterias em Kiel", "lugar·objeto", mk=[{"tipo": "anel", "lugar": "Friedrichsort", "palavra": "Sperren"}]),
 "08_09": A("perfil", "procura no palco: nenhum barco raso ao lado", "objeto·ausência"),
 "08_10": A("perfil_vazio", "corte seco: palco vazio", "narrativa"),
 "08_11": E("arminius", "foto do Arminius", "época·objeto", mk=[{"tipo": "rotulo", "txt": "ARMINIUS · 4,5 m", "palavra": "Arminius"}]),
 "08_12": M("arminius_sund", "trilha Kiel→Sund colada à costa sueca", "lugar·ação", mk=[{"tipo": "trilha", "estilo": "solida", "palavra": "schlich"}]),
 "08_12B": M("arminius_elba", "a trilha chega à Elba sem ser vista", "lugar·tempo"),
 "08_13": M("jade_minas", "minas como pontos com anel no Jade", "lugar·objeto"),
 "08_14": M("jade_minas", "nenhum navio cruza os anéis", "causa"),
 # 08b Schiff gegen Festung
 "08b_01": A("orbita", "o couraçado gira", "objeto"),
 "08b_02": A("tres_quartos", "rótulo KOMPROMISS", "conceito", mk=[{"tipo": "rotulo", "txt": "KOMPROMISS", "palavra": "Kompromiss"}]),
 "08b_03": A("cinta", "cinta e bateria acendem; tiques de 'Tiefgang' e 'Tempo'", "objeto·conceito", destaque="cinta"),
 "08b_04": E("forte", "fortificação de época em paralaxe", "época·contraste"),
 "08b_05": E("forte", "zoom na muralha de terra", "época·conceito"),
 "08b_06": A("fatia", "a fatia da cinta ao lado de um bloco de terra", "conceito·comparação", fatia=True),
 "08b_07": A("calado", "destaque abaixo da linha d'água", "objeto·causa→efeito", destaque="vivas", regua=True),
 "08b_08": M("alsen", "anel de 3 km em Alsen; o ícone fica fora", "lugar·dado", mk=[{"tipo": "anel", "lugar": "Alsen", "txt": "3 km", "palavra": "Kilometern"}]),
 "08b_09": M("kiel_barreira", "a frota inteira de ícones para na barreira de Kiel", "lugar·causa"),
 # 09 Kohle ohne Hafen
 "09_01": M("bloqueio", "linhas de bloqueio no Mar do Norte e no Báltico", "lugar"),
 "09_02": M("bloqueio", "as linhas se fecham diante dos portos", "lugar·ação", mk=[{"tipo": "rotulo", "txt": "MITTE AUGUST", "palavra": "August"}]),
 "09_03": M("bloqueio_capturas", "pequenos navios mercantes capturados", "dado·ação"),
 "09_04": A("bunker", "o bunker acende", "objeto·causa", destaque="bunker"),
 "09_05": M("helgoland_britanica", "Helgoland com anel 'britisch – gesperrt'", "lugar·causa", mk=[{"tipo": "rotulo", "txt": "BRITISCH", "palavra": "britisch"}]),
 "09_06": M("dinamarca_costa", "costa oeste dinamarquesa: nenhum porto", "lugar·ausência"),
 "09_07": M("carvao_dunquerque", "trilha longa do carvão Dunquerque→Helgoland", "lugar·dado", mk=[{"tipo": "cota", "txt": "Hunderte Seemeilen", "palavra": "Seemeilen"}]),
 "09_07B": E("carvao_mar", "imagem de transferência de carvão no mar", "época·ação"),
 "09_08": A("bunker", "600 t no bunker", "objeto·dado", destaque="bunker", mk=[{"tipo": "numero", "txt": "600 t", "palavra": "sechshundert"}]),
 "09_09": L("diario_carvao", "diário: 600 → 480 → 360 …", "dado·tempo", linhas=["600 t", "480", "360", "240", "120"]),
 "09_10": L("diario_carvao", "'5–8 Tage' sublinhado", "dado", linhas=["600 t", "480", "360", "240", "120", "5–8 Tage"], sublinhar=[5]),
 "09_11": M("vendaval", "setas do vendaval de SW varrem o Mar do Norte", "lugar·tempo·clima", setas=True),
 "09_12": E("tempestade", "pintura de tempestade em paralaxe", "época·clima"),
 "09_13": M("alcance_encolhe", "anel de alcance do carvão encolhe até não chegar a Cherbourg", "dado·causa→efeito"),
 "09_14": M("volta_cherbourg", "trilha de volta a Cherbourg; meados de setembro", "lugar·tempo"),
 "09_15": M("volta_baltico", "a esquadra do Báltico também volta", "lugar·tempo"),
 "09_16": M("mar_vazio", "corte seco: mar vazio", "narrativa"),
 # 10 Matrosen von Paris
 "10_01": E("paris_cerco", "imagem do cerco de Paris", "época·lugar"),
 "10_02": E("marinheiros_forte", "marinheiros num forte", "época·pessoas"),
 "10_03": E("marinheiros_forte", "corte seco: zoom no canhão naval", "época·objeto"),
 "10_04": M("cherbourg_paris", "trilha Cherbourg→Paris; 10.000 · 170 contam", "lugar·dado", mk=[{"tipo": "contador", "de": 0, "ate": 10000, "palavra": "zehntausend"}]),
 "10_05": A("tripulacao", "marcadores de tripulação no navio caem pela metade", "objeto·dado", destaque="bateria"),
 "10_06": M("paris_fortes", "fortes do leste acendem: Romainville, Rosny", "lugar"),
 "10_06B": M("paris_fortes", "fortes do sul acendem: Ivry, Bicêtre, Montrouge", "lugar·dado"),
 "10_07": M("paris_fortes", "56.000 conta sobre Paris", "dado·tempo", mk=[{"tipo": "contador", "de": 0, "ate": 56000, "palavra": "sechsundfünfzigtausend"}]),
 "10_08": E("marinheiros_forte", "zoom lento nos canhões do forte", "época·conceito"),
 "10_09": M("paris_fortes", "a câmera recua: a frota está em Paris", "lugar·causa"),
 # 10b Und die fünf
 "10b_01": M("jade_wilhelmshaven", "os 5 ícones no Jade", "lugar"),
 "10b_02": E("koenig_wilhelm", "foto do König Wilhelm", "época·objeto"),
 "10b_03": M("jade_wilhelmshaven", "anel defensivo em volta do Jade", "lugar·plano"),
 "10b_04": M("jade_wilhelmshaven", "os 5 ícones ficam dentro do anel", "lugar·dado"),
 "10b_05": A("orbita_escura", "o casco escuro", "narrativa"),
 "10b_06": A("vivas_sujas", "obras vivas em destaque (bewachsen) e a máquina em alerta", "objeto·causa", destaque="vivas"),
 "10b_06B": A("maquina", "a casa de máquinas pisca", "objeto·causa", destaque="maquina"),
 "10b_07": M("surtidas", "duas surtidas saem do Jade e voltam: mar vazio", "lugar·tempo"),
 "10b_08": M("jade_cherbourg", "trilha tracejada Jade→Cherbourg se desenha", "lugar·plano"),
 "10b_09": L("calendario", "'28. Januar 1871' escrito; a trilha para", "tempo·causa", linhas=["28. Januar 1871 – Waffenstillstand"]),
 # 11 Das einzige Duell
 "11_01": M("nordsee_vazio", "o mapa inteiro sem nenhum combate de esquadras", "lugar·ausência"),
 "11_02": M("havana_globo", "globo: Wilhelmshaven→Havana", "lugar·dado", mk=[{"tipo": "cota", "txt": "8.000 km", "palavra": "Kilometer"}]),
 "11_02B": M("havana", "zoom em Havana; data 9. November 1870", "lugar·tempo"),
 "11_03": E("meteor_bouvet", "a pintura do duelo em paralaxe", "época·objeto", mk=[{"tipo": "rotulo", "txt": "METEOR · 350 t", "palavra": "Meteor"}]),
 "11_04": M("havana_porto", "regra das 24 h: um ícone sai, o relógio corre, o outro sai", "tempo·regra"),
 "11_05": E("meteor_bouvet", "zoom nos dois navios em combate", "época·ação"),
 "11_06": E("meteor_bouvet", "zoom nos mastros caindo", "época·ação", foco="mastros"),
 "11_07": E("meteor_bouvet", "zoom no vapor da caldeira", "época·causa", foco="caldeira"),
 "11_08": E("meteor_bouvet", "recuo para a pintura inteira", "época"),
 "11_09": A("comparacao", "Meteor minúsculo ao lado do couraçado (cota)", "objeto·comparação"),
 # 12 Gesichert
 "12_01": M("nordsee_contagem", "volta ao mapa da abertura", "lugar"),
 "12_02": M("nordsee_contagem", "49 e 5 com status 'gesichert'", "dado·fonte"),
 "12_03": M("divisao_sedan", "a trilha da divisão até Sedan", "lugar·causa"),
 "12_04": A("perfil_marcas", "régua 8,4 m e bunker vazio juntos", "objeto·causa", regua=True, destaque="bunker"),
 "12_05": L("calculo", "10× Schiffe → 5× Tonnage → 3× vor Ort", "dado·cálculo", linhas=["10× Schiffe", "5× Tonnage"]),
 "12_05B": L("calculo", "'15 gegen 5 vor der Küste' sublinhado", "dado", linhas=["10× Schiffe", "5× Tonnage", "15 gegen 5 vor Ort"], sublinhar=[2]),
 "12_06": M("baltico_incerto", "anel tracejado no Báltico: 'unbekannt'", "lugar·incerteza"),
 "12_07": M("baltico_incerto", "o anel pulsa", "incerteza"),
 "12_08": L("chevalier", "a frase de Chevalier (1873) escrita e sublinhada", "fonte·conceito", linhas=["zu stark, um nichts zu tun –", "zu schwach, um etwas Ernstes zu unternehmen"], sublinhar=[0, 1]),
 "12_09": M("helgoland_jade", "volta à abertura: a linha até Wilhelmshaven ainda vazia", "lugar·narrativa"),
 "12_10": M("tres_simbolos", "regimento, profundidade e carvão acendem", "causa·resposta"),
 "12_10B": A("sai", "o couraçado sai do palco", "objeto·fecho", sai=True),
 "12_11": E("sedan", "a pintura de Sedan (tela final)", "época·gancho"),
 "12_12": E("sedan", "tela final", "fecho"),
}

# ---- reequilíbrio (1º corte: mapa 54% do tempo, 11 seguidas): troca batidas de mapa por anatomia/época/lápis ----
P.update({
 "01_04": E("wilhelmshaven_1869", "porto de Wilhelmshaven em paralaxe; os 5 navios", "época·lugar", mk=[{"tipo": "rotulo", "txt": "WILHELMSHAVEN · 1869", "palavra": "Panzerflotte"}]),
 "01_07": A("frota49_5", "as 49 silhuetas ficam paradas, viradas para longe dos 5", "objeto·dado·narrativa", frota=[49, 5]),
 "03_02": A("frota49", "49 couraçados em fila enchem o palco", "objeto·dado", frota=[49, 0], mk=[{"tipo": "contador", "de": 0, "ate": 49, "palavra": "neunundvierzig"}]),
 "03_03": A("frota49_5", "do outro lado, só 5", "objeto·dado·comparação", frota=[49, 5], mk=[{"tipo": "numero", "txt": "5", "palavra": "fünf"}]),
 "03_06": E("kronprinz", "foto do Kronprinz; rótulo London", "época·objeto", mk=[{"tipo": "rotulo", "txt": "LONDON", "palavra": "London"}]),
 "05_02": A("orbita_escura", "a câmera para no casco escuro", "narrativa"),
 "05_05": L("plano_nota", "'Dänemark – nur nach einer Landung' escrito e sublinhado", "condição·causa", linhas=["Dänemark?", "– nur nach einer Landung"], sublinhar=[1]),
 "05_06": A("contorno14", "transportes tracejados ao lado do couraçado, vazios", "objeto·causa", mk=[{"tipo": "rotulo", "txt": "SOLDATEN?", "palavra": "Soldaten"}]),
 "07_01": E("frota_francesa", "a frota francesa a vapor (época)", "época·objeto"),
 "07_09": A("perfil_vazio", "corte seco: palco vazio", "narrativa"),
 "08_07": E("wangerooge", "farol/costa de época; a luz se apaga", "época·ação"),
 "08_14": A("perfil", "o couraçado parado longe da costa", "objeto·causa"),
 "08b_09": L("comissao", "'selbst die ganze Flotte' escrito", "fonte", linhas=["Kiel: selbst die ganze Flotte", "käme nicht durch."], sublinhar=[0]),
 "09_01": E("frota_francesa", "esquadra de bloqueio (época)", "época·objeto"),
 "09_15": E("tempestade", "navios de época voltando no mau tempo", "época·tempo"),
 "09_16": A("perfil_vazio", "corte seco: palco vazio", "narrativa"),
 "10_07": E("marinheiros_forte", "56.000 sobre a imagem dos fortes", "época·dado", mk=[{"tipo": "contador", "de": 0, "ate": 56000, "palavra": "sechsundfünfzigtausend"}]),
 "10b_01": E("wilhelmshaven_1869", "o porto de Wilhelmshaven", "época·lugar"),
 "10b_04": A("frota5", "as 5 silhuetas alemãs paradas", "objeto·dado", frota=[0, 5]),
 "11_01": A("frota49_5", "as duas frotas nunca se encontram", "objeto·ausência", frota=[49, 5]),
 "11_04": L("regra_24h", "'24 Stunden' escrito; relógio", "regra·tempo", linhas=["Regel des neutralen Hafens:", "24 Stunden Abstand"], sublinhar=[1]),
 "12_01": A("orbita", "o couraçado gira uma última vez", "narrativa"),
 "12_02": A("frota49_5", "49 e 5 com 'gesichert'", "dado·fonte", frota=[49, 5], mk=[{"tipo": "rotulo", "txt": "GESICHERT", "palavra": "Gesichert"}]),
 "12_07": E("frota_francesa", "a frota de época que nunca desembarcou", "época·incerteza"),
 "04_07": E("couracado_frances", "foto de época de um couraçado francês: vapor e velas", "época·objeto·tempo"),
 "07_02": L("efetivos", "efetivos escritos: Frankreich < Deutschland", "dado·comparação", linhas=["Frankreich: weniger Soldaten", "als die Deutschen"]),
})

batidas, faltam = [], []
for fid, f in F.items():
    partes = [k for k in (fid, fid + "B") if k in P]
    if not partes: faltam.append(fid); continue
    if len(partes) == 2:
        ws = f["palavras"]; meio = (f["t0"] + f["t1"]) / 2
        corte = min(ws[1:], key=lambda w: abs(w["s"] - meio))["s"]
        tramos = [(f["t0"], corte), (corte, f["t1"])]
    else:
        tramos = [(f["t0"], f["t1"])]
    for k, (a, b) in zip(partes, tramos):
        d = P[k]
        mks = []
        for m in d.get("take", {}).pop("mk", []) if False else d["take"].get("mk", []):
            w = next((w for w in f["palavras"] if m.get("palavra", "").lower() in w["w"].lower()), None)
            mks.append({**{x: y for x, y in m.items() if x != "palavra"}, "t": round(w["s"] if w else a, 2), "palavra": m.get("palavra")})
        take = {x: y for x, y in d["take"].items() if x != "mk"}
        batidas.append({"id": k, "frase": fid, "texto": f["texto"], "t0": round(a, 2), "t1": round(b, 2), "fam": d["fam"], "take": take,
                        "muda": d["muda"], "dims": d["dims"], "mk": mks})
# o take visual cobre também a pausa até a próxima batida (sem buraco)
for i, b in enumerate(batidas):
    b["v0"] = 0.0 if i == 0 else batidas[i - 1]["v1"]
    b["v1"] = round(batidas[i + 1]["t0"] - 0.08, 2) if i + 1 < len(batidas) else round(b["t1"] + 2.5, 2)
json.dump({"fps": 24, "dur": batidas[-1]["v1"], "batidas": batidas}, open(f"{R}/roteiro/plano.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
from collections import Counter
c = Counter(b["fam"] for b in batidas); tot = sum(b["v1"] - b["v0"] for b in batidas)
print(len(batidas), "batidas ·", round(tot, 1), "s ·", round(len(batidas) / (tot / 60), 1), "batidas/min")
for fam in c: print(f"  {fam:<6} {c[fam]:>3} batidas · {sum(b['v1'] - b['v0'] for b in batidas if b['fam'] == fam) / tot:.0%} do tempo")
if faltam: print("SEM BATIDA:", faltam)
seq = max((sum(1 for _ in g) for _, g in __import__("itertools").groupby(b["fam"] for b in batidas)), default=0)
print("maior sequência da mesma família:", seq)
