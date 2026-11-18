# Auditoria completa do último vídeo alemão: v14b v2 (Moltke, 18:06), 03/11/2026

**Status: GUARDADA.** Por ordem do Eduardo, só vai para o minerador **depois** que ele terminar o vídeo do Learjet da Flórida (parte 3).

**Vídeo:**
- `warum_verlor_napoleon_moltke_45_tage_v2.mp4`, 1920×1080, 30 fps, 11,3 Mbps, AAC 48 kHz;
- entregue às 17:43 de 03/11 a pedido do Eduardo, sem passar pela régua de 8,5.

**Fontes desta auditoria:**
1. Leitura a 24 fps e segmentação dos 134 planos: `docs/auditoria-v14b-vs-aitelly.md` (repo) e `D:/pesquisa_nichos/revisao_v14b_v2/` (folhas lado a lado com o AiTelly).
2. Novo, nesta rodada:
   - áudio (EBU R128, silêncios);
   - sincronia das frases dêiticas × o que está na tela (`deiticas.jpg`);
   - legendas (`untertitel_de.srt`);
   - título, descrição e miniaturas (`thumbs.jpg`);
   - registro de produção (`MEDICAO*.md/jsonl`, `render/`).

---

## 1. Nota geral
| Camada | Nota | Por quê |
|---|---|---|
| Roteiro (texto) | **bom** | passou o checklist agregador: 2,25 números/min, 14 palavras/frase, termos definidos, regra de ouro |
| Áudio | **bom** | −14,1 LUFS, LRA 4,6 LU, true peak −1,1 dBTP, sem música (regra do DE), sem buraco de voz |
| Imagem | **fraca** | 28% de cartão escuro, 17% de mapa bege, 11% de época, 36,7% de câmera parada, objeto de brinquedo |
| Sincronia fala × imagem | **falha em 4 de 10 dêiticas** | a fala aponta para algo que não está na tela |
| Legendas | **rápidas demais** | 44% das legendas acima de 17 caracteres/s |
| Metadados | **2 erros** | a descrição diz "música KI-generiert" (não há música); licença da EOX a conferir |
| Processo | **3 falhas** | render antes do batedor integrado; juiz 1/12; MEDICAO do v14b não atualizada |

---

## 2. Imagem: as 11 categorias (resumo; detalhe plano a plano no doc do repo)
| Cód. | Falha | Medida / exemplos |
|---|---|---|
| F1 | Cartão escuro explicativo separado da cena | 28% do vídeo; 2:28 "Die Zange" 12,5 s, 4:05 12,4 s, 8:40 Reservist→Depot 24,4 s, 3:24, 7:43, 12:57, 17:02 |
| F2 | Foto/pintura parada por muito tempo | 4:28 foto 22,8 s; 12:35 Mars-la-Tour 31,8 s; 0:17 retrato |
| F3 | Mapa bege chapado, mesma base repetida | 17%; Aufmarsch 3×; 14:25 mapa quase vazio 11,1 s |
| F4 | Objeto de kit: brinquedo e argila, sem interior | mesa de cubos (3:56), locomotiva de brinquedo (5:55), Krupp low-poly (16:50) |
| F5 | Texto sobreposto ou fantasma | 1:52, 10:00 (Tag 17 sobre Tag 37), 17:14 (SchrittSchritt), 8:04, 9:45 |
| F6 | Instrumento em cartão escuro, fora da cena | 9:30 gráfico em 0 por 11,5 s; 16:15; 0:52 |
| F7 | Cor e luz apagadas | colorfulness 17 (AiTelly 28–30); Sedan cinza |
| F8 | Mesmo retrato e medalha repetidos | Moltke 10+ vezes, medalha 3×, calendário 2× |
| F9 | Final só de época | 15:52–18:06 |
| F10 | Fato errado na tela | "Steinmetz · 74" (tinha 73) |
| F11 | Planos longos sem ação | 44 planos > 8 s |

**Números contra as referências:**
| Medida | v14b v2 | AiTelly Gatling | Meta do plano |
|---|---|---|---|
| Cena (3D/mundo/objeto) | 45% | 85% | — |
| Câmera parada | 36,7% | 4% | ≤ 10% |
| Cartão escuro | 28% | 5% | ≤ 10%, ≤ 3 s |
| Takes distintos/min | 11 | 16 | ≥ 12 |
| Colorfulness | 17 | 28 | ~30 na explicação |

---

## 3. Sincronia: a fala aponta e a imagem não mostra (novo)
As 10 frases dêiticas da legenda, com o quadro no instante (`deiticas.jpg`):
| Instante | Fala | Na tela | Resultado |
|---|---|---|---|
| 2:03 | "die Armeegrößen beider Seiten laufen dabei im Bild mit" | só o contador alemão (53.000), o francês sumido sob o "kein Fahrplan" fantasma | ❌ falta um dos lados |
| 6:01 | "Schauen Sie auf das Gleisprofil" | o perfil começando a se desenhar | ✓ |
| 6:20 | "Im Bild fahren die Züge auf dem Doppelgleis ein… (o contador salta a cada 80 min)" | soldados parados na plataforma; sem contador | ❌ o contador prometido não existe |
| 9:36 | "Unten im Bild läuft ein Zähler…" | gráfico "Truppen am Rhein" no canto, dia 0 | ✓ |
| 9:47 | "Achten Sie auf die Kurve…" | curva ainda plana no dia 8, trem minúsculo visto de cima | ~ (a curva só sobe depois) |
| 10:12 | "Hier sehen Sie, wie der König in Mainz ankommt" | gráfico chegando a 300.000 sobre um vagão; **nenhum rei, nenhuma Mainz** | ❌ |
| 12:08 | "Schauen Sie auf das Schema… oben nur ein Ziel" | mesa do comando com o alvo no alto | ✓ |
| 13:02 | "Hier sehen Sie Auftragstaktik in einem einzigen Moment" (Gravelotte) | cartão escuro "Befehlsweg" com 2 caixas | ❌ cartão no lugar do momento |
| 15:20 | "Im Bild stehen zwei Zahlen, links die deutschen Geschütze, rechts die französischen" | painel com os números **um em cima do outro**, o francês ainda "…" | ❌ links/rechts errado, falta o francês |
| 15:26 | "Achten Sie auf den Balken darunter… die Ringe" | barra e anéis | ✓ |

**4 falhas claras e 1 parcial em 10.** A frase dêitica (item 15 do checklist) obriga a imagem: se a fala diz "olhe para X", X tem de estar na tela naquele segundo.

**Regra nova proposta:** na régua preditiva, toda dêitica vira um item de checagem. O plano tem de declarar o objeto/instrumento apontado na batida da frase, e o still do batedor no instante da frase prova que ele está lá.

---

## 4. Áudio (novo)
- Integrado **−14,1 LUFS**, LRA **4,6 LU** (−17,4 a −12,7), true peak −1,1 dBTP (registro do minerador). Dentro da meta.
- Sem música, como manda a regra do canal DE.
- Silêncios ≥ 1,5 s: só **16:33 (1,6 s)**, uma pausa entre blocos aceitável, e o final (4,2 s, cartão).
- Fala: ~142 palavras/min. Ok para o público mais velho.
- **Nada a corrigir no áudio.**

## 5. Legendas (novo)
- 312 legendas, sem sobreposição; um buraco de 3 s às 6:02.
- **137 de 312 (44%) acima de 17 caracteres/s** (mediana 16,7). Exemplos: 22,5 cps em "Als wir die Tage zum ersten Mal nachgezählt haben", 20,1 em "obwohl Frankreich selbst den Krieg erklärt hatte".
  - Para o público alemão mais velho, o limite confortável é ~15 cps; 17 é o teto usual.
  - **Correção:** quebrar em mais legendas curtas (2 linhas de ≤ 42) e dar duração mínima de 1,2 s.
- **12 legendas com menos de 1 s.**
- **4 linhas com mais de 42 caracteres.**

## 6. Título, descrição e miniaturas (novo)
- **Títulos:**
  - o título 1 está no molde paradoxo do canal ("Warum verlor Napoleon III. gegen einen 69-Jährigen – obwohl Frankreich den Krieg erklärt hatte?");
  - os 3 têm ≤ 100 caracteres. Ok.
- **Descrição:**
  - ❌ diz "Stimme und **Musik** KI-generiert", mas o vídeo não tem música. Corrigir para "Stimme KI-generiert".
  - ⚠️ "Satellitenbild **Sentinel-2 cloudless 2017** by EOX (**CC BY 4.0**…)": a página oficial de licença da EOX hoje fala em **CC BY-NC-SA 4.0** para uso não comercial e **licença comercial paga** para uso comercial. Só a versão de **2016** ficou conhecida como CC BY 4.0.
    - Conferir qual ano e qual licença valem para o mosaico usado. Se não for a de 2016 CC BY, um canal monetizado não pode usar.
    - Alternativas livres: mosaico próprio com Sentinel-2 bruto do Copernicus (licença aberta, inclusive comercial), Landsat (domínio público) ou ortofoto nacional aberta.
  - Capítulos, fontes e hashtags ok; ~1.200 caracteres, dentro da regra da descrição curta.
- **Miniaturas** (regra: simulação + número, rosto com susto + gancho, rosto + número):
  - **1** rosto (Napoleão III) + "Ein Kaiser in 45 Tagen besiegt – von einem 69-Jährigen?": ok.
  - **2** rosto (Moltke) + "69 Jahre / 45 Tage": ok.
  - **3** ❌ deveria ser **simulação + número**, mas usa o **mapa bege 2D** (o mesmo das falhas F3) com "104.000 Gefangene". É a mais fraca das três e não mostra a simulação. Trocar por um quadro 3D forte (o anel de Sedan com o painel 774 × 564) + o número.

## 7. Processo de produção (novo)
1. **Render antes do batedor integrado:** o render final começou às 17:11 e o batedor de acabamento só ficou pronto às ~17:30 (relato do minerador). Os trens saíram no kit antigo. A regra "nenhum render sem batedor integrado" nasceu daqui.
2. **Juiz: 1 de 12 stills ≥ 8,5**, e o vídeo foi entregue assim (a pedido do Eduardo, não é falha do agente). Registrar.
3. **MEDICAO do v14b não foi atualizada:** o `MEDICAO.md` da pasta ainda tem a linha do tempo do v14 original (00:53–02:35). A refação não tem registro de etapas, horas e decisões; só o `MEDICAO_auto.jsonl` (sync e render).
4. **Infraestrutura** (do `MEDICAO_auto` e do relato):
   - subida do projeto (sync) de **27,5 min** às 16:01–16:34;
   - ligar a G4, 4,6 min; render, 22,6 min;
   - ~1 h 30 perdida no dia em quedas e stills travados.

   É o M0 do plano.
5. **Régua só no fim:** não havia régua preditiva. Os 37% de câmera parada e os 28% de cartão só apareceram depois do render (hoje corrigido no plano).

## 8. O que já foi corrigido no sistema (não precisa repetir)
- Régua preditiva, EsquemaNaCena, presets de câmera, cartoon técnico, sistema de tipo com rótulos sem colisão, janela única de G4 com render em lotes: todos em teste no Learjet parte 3.
- Regras: nenhum render sem batedor integrado; gate em falha só com OK do Eduardo; nada retroage.

## 9. O que é NOVO para levar ao próximo vídeo alemão (o checklist desta auditoria)
1. **Dêitica ↔ imagem:** toda frase "Schauen/Achten Sie…/Hier sehen Sie…/Im Bild…" declara o elemento apontado, e o still no instante prova que ele está lá. Também "links/rechts" bater com o layout.
2. **Legendas ≤ 15–17 cps**, duração ≥ 1,2 s, linhas ≤ 42 caracteres. Checagem automática no `legendas.py`.
3. **Descrição sem afirmação falsa** (música) e **licença de cada mapa conferida na fonte oficial** (EOX).
4. **Miniatura 3 = simulação 3D + número**, nunca mapa 2D.
5. **MEDICAO atualizada em toda refação** (etapas, horas, decisões).
6. **Rosto e fato na tela conferidos contra o dossiê** (Steinmetz 73).
