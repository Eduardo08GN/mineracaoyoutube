# Brief do planejador de batidas — vídeo 13 Kriegsmomente: Die Mitrailleuse 1870 (Tracer3D 2.0)

Você transforma a narração em **batidas visuais**. Projeto: `D:\kriegschronik\tracer3d_13_mitrailleuse`, cópia do vídeo 11. **URGENTE: o vídeo sai amanhã.** Tempo-alvo: 35 min até o `plano.py` passar.

Formato idêntico ao dos vídeos 8 a 11. Valem as seções "Formato de saída", "Regras de qualidade" e "Mistura de famílias" de `D:\kriegschronik\tracer3d_08_gewehr\roteiro\BRIEF_PLANEJADOR.md`. Geradores de referência:
- `roteiro/gerar_A.py` e `roteiro/gerar_B.py` (os do vídeo 11, nesta pasta);
- `D:\kriegschronik\tracer3d_11_1866\v1\src\beats\k11_A.tsx`.

Reescreva os geradores para este vídeo. **Confira que não há capítulo duplicado.**

## Leia
- `roteiro/skript_de.json` e `roteiro/fakten.md`, que é o dossiê do vídeo 13.
  - Use só números e rótulos de lá; ponha "ca." onde for aproximado.
  - Respeite o §9 (correções a evitar).
  - Nada de "erstes Maschinengewehr der Welt" nem de baixas atribuídas só à mitrailleuse.
- `v1/src/kit/API.md` e as APIs de `kit/ui`, `kit/karten`, `kit/welt` e `kit/epoca` (cena `Gemaelde`).
- **Novos do vídeo 13, o ponto alto:** `v1/src/welt/K13_API.md`, com `Mitrailleuse` (câmeras `dreiviertel`/`verschluss`/`muendung`/`seite`; âncora `schussZeit`), `Reichweite` (props `mitrailleuse_m`, `krupp_m`, `abstand_m`; tempos `tZonen`/`tKrupp`/`tMitr`/`tLuecke`) e `Garbe` (`modus`: `beide`/`mitr`/`granate`).
  - Decisões e fraquezas em `BATEDOR_3d.md` e na folha `render/FOLHA_batedor_3d.jpg`.
  - No `Garbe` em `beide`, abra o `fov` para ~54 ou use os closes.
  - Passe os números reais do dossiê e `beispiel={false}`. Quando o número for exemplo, rotule "Beispiel".
- **Biblioteca já no projeto:**
  - vídeo 8 (armas, `K8_WAFFEN_API.md`: Dreyse e Chassepot em close; `k8_privat_basis` para St. Privat/Gravelotte);
  - vídeos 6 e 7 (1870: pacotes de terreno da França em `v1/src/cenas/pacotes.json`; Sedan, Metz);
  - vídeo 9 (`Armeen`, `Batterie`, `Stoss`);
  - `Uniformen`.
- **Imagens de época:** `v1/public/geo/fotos/fotos.json`, rótulo = `titulo_de`. Use as de 1870 (Gravelotte, St. Privat, Sedan, Napoleão III, Moltke, Krupp). Se faltar imagem da mitrailleuse, a cena 3D cobre.

## Cenas inéditas
Batidas com componentes `k13_*` usam `"dono": "INEDITO_k13"` (sem `cena`). Você escreve o componente no seu arquivo `v1/src/beats/k13_<A|B>.tsx`, do tipo `export const K13_<A|B>: BeatMap = {...}`.
- O batedor deixou `k13_A.tsx` só reexportando os componentes de `welt/`. **O planejador A** substitui esse arquivo pelo dele, mantendo as importações de `welt/k13_*`.
- **O planejador B** cria `k13_B.tsx`.
- Os dois registram em `v1/src/beats/index.ts` como `BEATS = {...K13_A, ...K13_B}`. **Não reintroduza IDs do vídeo 11** (BADPATHS 3.4).
- Use `wortLokal` para ancorar as etapas na fala.

## Rodapé
Não é um vídeo "Tag für Tag": **sem rodapé diário** (`"zaehler": false` ou omita, como nos vídeos 8 e 10).

## Direção visual
O pedido do dono do canal é **mais cenas 3D EXPLICATIVAS** (como funciona, em movimento, com HUD). Cada cena abaixo é o coração do capítulo: **2 a 4 batidas seguidas**, câmeras e etapas diferentes, cortes a cada 4–8 s, ancoradas palavra a palavra.
- **04 → `Mitrailleuse`** (planejador A):
  - `verschluss` em "Ladeplatte … fünfundzwanzig Patronen";
  - `dreiviertel` em "Kurbel";
  - `muendung` no disparo cano a cano, com `schussZeit` sincronizado com a fala;
  - troca de placa;
  - "bis zu hundertfünfundzwanzig Schuss" em HUD.
- **08 → `Reichweite`** (planejador B): zonas crescendo; "präzise bis etwa tausend Meter" contra "über drei Kilometer"; a "Lücke". Números do dossiê nas props.
- **10 → `Garbe`** (B): primeiro `mitr`, depois `granate`, depois `beide` com o placar.
- **Também explicativo:**
  - 07 (doutrina): baterias de 6 em linha de artilharia, com `Batterie` do k9 ou mapa;
  - 09 (Krupp): Krupp em close ou `Batterie`, mais um mapa de Weißenburg/Wörth;
  - 11 (onde funcionou): mapa com os lugares acendendo um por um (Spicheren, Mars-la-Tour, Gravelotte, Le Bourget, Lisaine);
  - 12, take inédito: Coulmiers em mapa, mais a peça travando, reaproveitando `Mitrailleuse` com o ciclo parado se der, ou `Gemaelde`.
- **Cap. 01:** gancho na ravina da Mance (Gravelotte) com `Mitrailleuse` `muendung` disparando e HUD. **Nada de cartão calmo.**
- **Cap. 02:** o paradoxo, com "190" e "125 Schuss/min" em HUD sobre 3D.
- **Cap. 14:** as respostas, cada uma com uma volta da cena explicativa correspondente (nunca 3 cartões seguidos). Fecho com imagem calma nos últimos ~12 s (end screen) e o CTA para "Warum verlor Frankreich 1870 – obwohl es das bessere Gewehr hatte?".
- **Mistura** (`plano.py`): mapa ≤ 35 %, 3D ≥ 25 %, época ≥ 20 %, no máximo 3 seguidas da mesma família.
- **Dinamismo:** `ui` ≤ 40 %, ≤ 2 seguidos; 3D ou mapa a cada ~15 s.
- **Números grandes:** em HUD por cima do 3D sempre que der.
- **Cartões `ui`:** o texto aparece até 1 s depois do início da batida (BADPATHS 3.21).
- **Sem marca SIMULATION;** créditos nunca na imagem; `@Kriegsmomente` já está no sequenciador.

## Divisão
- **Planejador A:** caps. 01–07 (`roteiro/gerar_A.py`).
- **Planejador B:** caps. 08–14 (`roteiro/gerar_B.py`).
- Não toque nos arquivos do outro, exceto o `index.ts`, editado com Edit e só na linha do `BEATS`.

## Verificação
1. `python ferramentas/plano.py` sem ERROS.
   - O alinhamento real chega em `voz/alinhamento.json`. Até lá rode `python ferramentas/alinhamento_provisorio.py` e regenere depois (grave `dur` por capítulo, BADPATHS 3.14).
2. **Stills na G4:** `python D:/tracer3d2/canal.py stills D:/kriegschronik/tracer3d_13_mitrailleuse/v1 <pasta> <seg...>`, até 16 por chamada, com `set T2_DONO=kriegsmomente_v13`.
   - Só se `canal.py saude` responder com a G4 no ar.
   - **Nunca** `garantir`, `ligar`, `desligar` ou `preparar`.
   - Se mexer em `public/`, rode `canal.py sync`.
3. Tudo no D: (`TEMP=D:/tmp`); mate só processos seus (PID).

## Entrega (curta)
Contagem por família, MISTURA/DINAMISMO da sua parte, folhas e o que está fraco.
