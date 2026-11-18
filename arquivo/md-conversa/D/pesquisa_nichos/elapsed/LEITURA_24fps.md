# Elapsed (@ElapsedYT): leitura a 24 fps, 01/11/2026

**Canal e vídeo:**
- Canal brasileiro (conta de 2016), 210 inscritos, 1 vídeo.
- "What if all Humans disappeared?" (daEwuzRM4H0): 9:52, publicado em 19/10/2026, 74 mil views em 13 dias (**~350× os inscritos**), 656 likes.
- Descrição: "All made by humans (me), in unreal 5!".

**Dados da leitura:**
- 14.204 quadros a 24 fps em `f24/`;
- folhas em `sheets/` (`ov*` = 1 quadro a cada 2 s; `seg_*` = 2 s a 24 fps);
- cortes em `cortes.txt`.

## Estrutura
| Bloco | Tempo | O que acontece |
|---|---|---|
| Gancho | 0–12 s | "This is your city." O contador "HUMANS ON EARTH 8.300.000.000" sobe ao vivo e então zera: "every human on Earth disappears. Everyone except you" |
| Horas/dias | 12–120 s | Rede elétrica, luzes se apagam, metrô inunda, usina nuclear desliga. Contador "HUMANS GONE FOR" + **"NEXT: [evento] in X"** |
| Anos/séculos | 120–360 s | Mato, ponte enferruja e cai (cabo a cabo), torres caem no rio, cidade vira morro, "As old as the Great Pyramid", última parede some |
| Milhões de anos | 360–480 s | Superfície sem nada nosso |
| Espaço | 480–570 s | Satélites mortos, lander e bandeira desbotada na Lua, Voyager com o disco de ouro, bolha de rádio, contador "DISTANCE FROM HOME" |
| Fecho | 570–592 s | Volta à Terra, árvore, pássaro: "Life goes on. With or without us." |

## Linguagem
- **Sem narração.** O YouTube não gerou legenda automática. A história está em **legenda serifada itálica** embaixo, mais música.
- **Planos longos:** 27 cortes em 592 s, média de ~21 s por plano.
- **A 24 fps quase nada se move:** câmera em dolly lento, mudança de luz e névoa, nível de água, escala do mato, uma queda de ponte simples.
- **O ritmo vem do contador** (o tempo dispara em cada plano) e do **"NEXT: … in X"**, que abre um laço a cada 15–20 s.
- **Visual:** diorama estilizado (árvores "pipoca" coloridas, low-poly limpo), luz global suave, névoa volumétrica, DOF, bloom, gradação teal/laranja. É Unreal 5 com Lumen e, pelo estilo, assets estilizados gratuitos (Fab/Megascans).

## Por que fica bom (em ordem de peso)
1. **Premissa testada:** "Life After People", formato evergreen enorme, em 2ª pessoa ("you").
2. **Dispositivo de retenção:** o contador acelerando + o próximo evento anunciado.
3. **Estética coesa de diorama**, um só ambiente reaproveitado o vídeo todo.
4. **Unreal 5:** Lumen, névoa e foliagem dão acabamento de cinema com pouco trabalho por plano.

**Custo real de produção:** 1 cenário + ~25 planos quase estáticos + keyframes simples. O pesado é montar o cenário uma vez.
