# Passagem: Kriegsmomente (sessão nova, 29/10/2026)

Cole na sessão nova: **"Leia D:\tracer3d2\HANDOFF_kriegsmomente.md e continue a produção do Kriegsmomente."**

## Estado
- **Entregues:**
  - vídeo 6: 1870/71 dia a dia (viralizou);
  - vídeo 7: Sedan, em `D:\kriegschronik\tracer3d_07_sedan\entrega`.
- **Programado pelo Eduardo para 29/10:** o Paris-Geschütz ("Im Inneren der Krupp-Kanone…").
- **A/B concluídos:** venceu a pergunta "Warum" com contradição, pareada com rosto. A miniatura de simulação ficou em último nas duas vezes.
- **Pendente da sessão anterior:** trocar a miniatura 1 do vídeo 7 (simulação) por um rosto. Pedi o OK do Eduardo para gastar créditos do Flow e ainda não houve resposta.

## Leia primeiro
1. `D:\tracer3d2\ARQUITETURA.md`, `D:\tracer3d2\BADPATHS.md` (até 3.18), `D:\tracer3d2\ACABAMENTO.md`, `D:\tracer3d2\REFERENCIA_TRACER_PROJECT.md`.
2. `D:\kriegschronik\tracer3d_07_sedan\MEDICAO.md`: o último vídeo, os tempos e as lições.
3. Memórias carregadas sozinhas: `kriegsmomente-escopo-prussiano`, `kriegsmomente-vetor-titulo`, `feedback-miniaturas-guerra`, `feedback-broll-variedade-acabamento`, `feedback-estrategia-sobre-matematica`, `tracer3d-2`, `g4-multisessao`.

## Como começar um vídeo
1. Copie a estrutura do vídeo 7: projeto `v1` a partir de `tracer3d_07_sedan\v1`. Use `BEATS = {}` (só o import do `k6_waffen_geschuetz`) e cenas `{}`. Reaproveite `stunden.json`/`zaehler` se o vídeo for hora a hora.
2. Siga a sequência:
   - batedores de stack e de dados em paralelo;
   - roteiro (Opus) com `gerar_skript.py`;
   - `canal.py garantir` e depois a narração;
   - alinhamento, música e efeitos (`rodada_g4.py`);
   - planejadores A/B (épocas como `Gemaelde` em JSON);
   - no máximo ~6 inéditas 3D por agente;
   - folha de contato do vídeo inteiro;
   - render, mixagem, legendas, mux;
   - 3 pares título+miniatura numerados;
   - desligar a G4 e conferir.
3. O tema vem do vetor: duelo Preußen × Frankreich, número grande e pelo menos 1 título "Warum + contradição" com rosto.
