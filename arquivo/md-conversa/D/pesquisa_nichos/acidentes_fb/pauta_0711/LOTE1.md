# Lote 1: 4 reels da página "¿Qué Pasaría Si? 3D" (pauta de 07/11/2026, Opus)

Base: `candidatos.md`, nesta pasta, com casos, fontes e riscos. Molde: `docs/formato-acidentes-fb.md` (PR #5).
Critério da escolha: os mais quentes, com variedade de mecanismo no lote. Três casos de deriva no mar num lote de 4 deixariam a página monótona.

| # | Caso | Mecanismo (batida de código) | Por que entra |
|---|---|---|---|
| R1 | Kiribati: 9 saem para 1 h de lancha, 5 achados vivos ~100 dias depois a ~5.400 km | mapa do Pacífico com a rota da deriva e o contador de dias e km | o mais quente da semana (cobertura mundial e ES) |
| R2 | Navegante de 86 anos + cachorro, ~2 meses sem sinal, resgatado por cargueiro a ~460 mi de San Diego | EPIRB → satélite → avião → cargueiro desviando (cadeia de resgate) | ES confirmado, risco baixo, emocional (idoso + cachorro) |
| R3 | Diana Troncoso, 30 h sob os escombros do terremoto de Cali (Torres del Limonar) | corte do prédio em "panqueca" com o vão triangular onde ela ficou e o celular guiando a busca | hispana, com nome e pública; o gancho de hoje é o relato dela |
| R4 | Homem preso numa árvore no rio Salt (Tempe), ~12 h com a água subindo | corte do leito: nível da água subindo de 0 a 4 m e a árvore como ilha | físico e visual, sem morte; varia o lote (inundação súbita) |

**Reservas:**
- Pescadores de Limón (CR, com nome).
- Kiribati B, "cómo sobrevivieron", só depois de confirmar chuva, tartarugas e sinos.
- Cuevamur, só se o escalador sobreviver.

## Títulos (ES; o gancho nos primeiros ~60 caracteres)
**R1 Kiribati**
1. Salieron para un viaje de 1 hora. Los encontraron 100 días después
2. 5.400 km a la deriva: cómo una lancha cruzó medio Pacífico
3. ¿Por qué un viaje de 1 hora terminó a 5.400 km de casa?

**R2 Navegante**
1. 86 años, un perro y más de 2 meses sin señal en el Pacífico
2. Lo dieron por perdido en el mar. Una baliza lo cambió todo
3. ¿Cómo sobrevive un hombre de 86 años solo en el océano?

**R3 Diana (Cali)**
1. 30 horas bajo un edificio derrumbado: el celular que salvó a Diana
2. ¿Cómo se sobrevive 30 horas bajo los escombros?
3. El edificio cayó sobre ella. Un hueco de 1 metro la mantuvo viva

**R4 Tempe**
1. 12 horas atrapado en un árbol mientras el río crecía
2. El río estaba seco. A medianoche el agua subió 4 metros
3. ¿Por qué un río del desierto se llena de golpe?

## Portões de fato (o dossiê confirma antes do roteiro; se um número não se confirma, troque o título pelo seguinte)
- **R1:** 100 dias / 5.400 km / 9 → 5 vivos. Os 4 desaparecidos: "siguen sin ser encontrados", sem morte em tela; crianças só de costas ou de longe. Sem nomes (pediram privacidade).
- **R2:** número exato de dias sem contato (20/08 → resgate). O motivo do silêncio não foi explicado: não inventar; pode virar a pergunta final.
- **R3:** "30 horas" (as fontes dizem 29–36 h; usar a cifra do relato dela); confirmar se o "hueco de 1 metro" tem fonte, senão trocar pelo título 1 ou 2. Sem imagem de vítimas do terremoto; o foco é a sobrevivente e o resgate.
- **R4:** causa da subida da água (liberação de represa ou chuva) e altura (2,4–4,3 m). Se a causa não se confirmar, o título 3 fica fora e o mecanismo vira "por qué la madera mojada se parte".

## Ordem
1. Batedor curto pendente: o Eduardo escolhe a voz ES entre 3 candidatas, mais o teste fp8 × bf16 e o upscale. Mandar as folhas e os áudios a ele e esperar a escolha da voz. Não gerar o lote com voz não aprovada.
2. Dossiê dos 4 (Sonnet), roteiros dos 4 de uma vez (Opus), prompts.json (Sonnet).
3. Lote de 4 na G4-2 (`T2_G4=2`, `T2_DONO=acidentes_fb`), por script, com fiscal e download por bloco; desligar e conferir no fim.
4. Entrega: `entrega/` com o reel, o corpo sem o cartão final, o json e o .txt com os 3 títulos + a legenda curta do post + as fontes.
