# Plano de melhoria do próximo vídeo alemão (K18, Kriegsmomente), 05/11/2026

Este plano junta a crítica ao K17 v2 ("ponto fraco em praticamente tudo, inclusive a apresentação PowerPoint") e o que o vídeo 08 do What If ES provou na pipeline nova. Na régua de 24 fps, o 08 fez movimento 2,14 e 17% de quadros parados, sem piscar, com render inteiro em 3,7 min.

## 1. Diagnóstico do K17 v2 (medido)

| | K17 v2 | Vídeo 08 ES | Meta do K18 |
|---|---|---|---|
| Movimento médio | 1,31 | 2,14 | **≥ 2,5** |
| Quadros parados | 46% | 17% | **≤ 15%** |
| Cartões e fotos | 49% das batidas, **69% parados** | ~3% (só o fechamento) | **≤ 10%**, e nunca parados |
| Arquitetura | Remotion com cartões + clipes 3D colados | um mundo simulado contínuo + cenas de lugar | mundo simulado contínuo |

O "PowerPoint" vinha da arquitetura: cada batida era um slide (cartão, foto, mapa parado) com um clipe 3D entre eles. No 08, o dado mora DENTRO da cena e o mundo muda no plano.

## 2. As 10 mudanças

1. **Um mundo só, simulado, em vez de slides.** O campo de batalha (ou o teatro de guerra) vira uma cena 3D contínua em relevo real, a Copernicus GLO-30 assada na G4, no design system **creme** (atlas de papel, relevo sépia, tinta). Um parâmetro, a hora do dia ou o dia da campanha, move tudo: as unidades andam, as frentes avançam e os contadores correm, como o nível do mar no 08.
2. **Dado real calculado na G4, não digitado.** Dossiê de fontes (Generalstabswerk, Fontane, Wawro) → tabela de unidades por hora (posição, efetivo, baixas) → JSON. O HUD e a cena leem o mesmo dado. Toda conta derivada (cadência × homens × minutos) passa por um **crítico de fatos** antes da narração. O agente do 08 pegou 6,5 °C/km que não fechava; esse crítico vira etapa fixa.
3. **Fim do cartão parado.** A informação entra no take (instrumento vivo). Quando precisar de cartão, o fundo é o mundo em movimento. Imagens de época só em 2.5D com câmera andando e no máximo 10% do vídeo.
4. **HUD vivo e intuitivo** (crítica de 05/11 ao 08):
   - o número nasce no ponto do evento e voa para o painel;
   - o painel cresce no gancho e recolhe na ação;
   - os marcadores se escrevem a pena na palavra exata (régua, cota, seta de avanço que se desenha no relevo);
   - a câmera leva o olho até o rótulo;
   - a gramática varia entre batidas.
   - Escrita do K15: serifa itálica de época que se escreve, linha-guia com ponto, gráfico a tinta.
5. **Take eureka obrigatório, no padrão EXPLICAÇÃO CIENTÍFICA REVELADORA** (checklist de 6 pontos: fenômeno pouco conhecido, mecanismo inesperado, como e por quê em detalhe, analogia/conta/demonstração visual, conexão com algo maior, conhecimento real; narrativa de fascínio), com o mecanismo acontecendo e números vivos. Exemplo de molde: a peça que trabalha se abre no teardown e dois números ficam lado a lado (cadência, alcance, tempo de recarga), e a consequência aparece no mapa no mesmo take.
6. **Lugares que voltam piores.** De 2 a 4 locais da batalha em 3D (aldeia, bosque, ponte), com prontos do Fab e relevo real, visitados de novo a cada hora: fumaça, ruína, multidão em contagem.
7. **Gente em cena.** Na frente Fab/GitHub autônoma, buscar pacotes grátis de soldados do século XIX ou low poly com uniforme; multidão por instancing e número visível ("12.000 Mann").
8. **Som:** sem música (regra do canal). Voz + efeitos pontuais do MOSS presos aos eventos (salva de artilharia, sino da hora, galope) e tom de sala a −50 LUFS. Nada de silêncio digital.
9. **Ritmo e regras de take:**
   - 1 take por frase, nunca reaproveitado;
   - abertura com 3D em movimento nos 5 primeiros segundos e o gancho do título na tela;
   - mapa conta como mapa: o mundo único é a espinha, e as cenas de lugar, de máquina e de eureka quebram o ritmo a cada 15–20 s.
10. **Pipeline G4-first, como no 08:**
    - **Na G4, em paralelo:** dados, alinhamento, efeitos, render de 48 Chromes, mixagem com `loudnorm`, emenda do trecho com piscar.
    - **Agentes em paralelo por família de cena**, com iteração curta no PC; o julgamento é no render da G4.
    - **Regras de operação:** narração no AI Studio (voz alemã Riko) nunca junto com o `ligar` da G4; `garantir` em vez de um segundo `preparar`.
    - **Régua antes de entregar:** movimento, % de quadros parados, picos de piscar, movimento por família e folha a cada 10 s.

## 2b. Duração (Eduardo, 06/11)
- **15–20 min, sempre**, no Kriegsmomente. O K17 v2 saiu com 7:42; os que renderam têm 15–18 min.
- **Alvo do K18: ~17 min.**
  - roteiro de ~2.300 palavras em alemão (TTS a ~135 palavras/min);
  - ~160 batidas com take próprio;
  - 2 takes eureka: Dreyse × Lorenz e por que a artilharia melhor não bastou;
  - 3 a 4 lugares recorrentes.
- Conferir a duração no roteiro, antes da narração.

## 3. Tema e título (radar antes de escrever)

- **Escopo:** 65% 1870–71 e 35% 1866. Só 1 dos 12 vídeos foi de 1866, então o 1866 está atrasado na proporção.
- **Vetor:** "Warum verlor/siegte X – obwohl Y?" com **Y técnico, concreto e novo**. O Gewehr faz 5.636/dia; repetir o tipo de Y (Mitrailleuse) faz 682/dia.
- **Y já usados:** Gewehr, Maschinengewehr, doppelt so viele Soldaten, alle Königreiche, Krieg erklärt, 49 Panzerschiffe, Sprengkammern gebohrt.
- **Candidatos, a confirmar no radar da API** (demanda EN × oferta DE):
  - **Königgrätz 1866:** "Warum verlor Österreich bei Königgrätz – obwohl es die bessere Artillerie hatte?". O Y é técnico e novo, e o mundo simulado (três exércitos convergindo, hora a hora) é ideal. Eureka: Dreyse × Lorenz, recarga deitado contra recarga em pé.
  - **Mobilização por trem em 1870:** "Warum stand Preußen 1870 zuerst an der Grenze – obwohl Frankreich zuerst mobil machte?". Simulação de trens e dias, eureka de logística.
  - **Espoleta da artilharia em 1870:** a granada francesa de tempo só explodia em 2 distâncias fixas; a prussiana, de percussão, explodia no impacto. Eureka de engenharia pura.
- **Entrega:** 3 títulos A/B (paradoxo; perda + tempo; número + Preußen gegen Frankreich/Österreich), 3 miniaturas (simulação + número, rosto com susto + gancho, rosto + número), descrição curta.

## 4. Ordem de execução

1. Radar e escolha do tema.
2. Dossiê com fonte para cada número.
3. Roteiro (honeyspot + agregador).
4. Crítico de fatos.
5. Levantamento de prontos: Fab e GitHub autônomos, mais o levantamento de método.
6. Batedor do mundo creme simulado + HUD vivo + eureka, com stills mandados ao Eduardo.
7. Narração.
8. Produção com agentes por família.
9. Render, mixagem e régua na G4.
10. Entrega.
