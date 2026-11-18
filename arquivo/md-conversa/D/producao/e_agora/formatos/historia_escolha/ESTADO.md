# Estado da produção do reel 01 (passagem de bastão, 10/11)

Canal "E Agora?" (Instagram, sobrevivencialismo para brasileiros). Formato: história de escolha com boneco palito, 1080×1920, 30 fps.
Imagens paradas por IA (Qwen-Image-Edit na G4) + movimento por código (Remotion). Leia `CONTRATO.md` e `kit/README.md` antes.

## Pronto (escrito, NADA rodou ainda além de `ligar`)
- `reel_01/video.json`: roteiro em 27 planos, com `som` nos planos 01, 10, 16, 23.
- `reel_01/fila.json`: fila de imagens (fase 0 folha do personagem, fase 1 cenas e ícones, fase 2 variantes por edição).
- `kit/`: composição Remotion (nunca compilada; o `tsc` roda na etapa `render`).
- `g4/imagens.py`, `fiscal.py` (escolhe candidata, localiza pontos, folha de contato), `voz_pt.py` (cria a voz e narra), `som.py` (efeitos por código + mixagem).
- `g4/vm.sh` (lado da VM) e `g4/produzir.sh` (lado do PC, happy path).

## Como rodar (PC, Git Bash)
`cd g4 && bash produzir.sh ../reel_01 <etapa>`; dono da G4: `T2_DONO=e_agora_reel_01` (automático).
Ordem: `ligar`, `stack`, `voz`, `imagens 0`, `fiscal 0`, `imagens 1`, `fiscal 1`, `imagens 2`, `fiscal 2`, `som`, `still <t>`, `render`, `baixar`, `desligar`.
Batedor antes do lote: `imagens 1 07,17,23` + `fiscal 1 07,17,23`, folha ao Eduardo por SendUserFile.
`ver <etapa>` mostra o fim do log. Cada etapa grava `<etapa>.fim` (OK ou FALHOU) na VM.

## Onde parou
- PAUSADO pelo Eduardo em 10/11 01:53 (custo do reel alto). G4-1 desligada e conferida.
- Voz escolhida pelo Eduardo: candidata **A** (`VOZ_ESCOLHA=A`).
- Pronto no Drive: `t2_stacks/e_agora/historia_escolha/node_8e23e6294270.sqfs` (node_modules do kit; a próxima ligada monta sem npm).
- Corrigido: o `sync` do canal.py grava em `/content/t2/proj/<pai>_<pasta>` (vm.sh e produzir.sh já apontam para lá).
- Próximo passo ao retomar: `ligar`, `stack` (pesos e ambientes), `voz`, batedor de imagens.
- Estimativa medida antes de pausar: 3 a 4 h de G4 por reel (85 candidatas de imagem é o grosso). Para baratear: 2 candidatas em vez de 3, menos variantes, reaproveitar a folha do personagem.

## Riscos a conferir
1. Kit nunca compilado: corrigir os erros do `tsc`. Dúvida: `<Still>` com fps no `calculateMetadata`.
2. Voz: **só português brasileiro; sotaque de Portugal é PROIBIDO** (Eduardo, 10/11). A escolha automática não vale: mandar `voz/cand_*.wav` ao Eduardo e só narrar o reel com a voz aprovada (`VOZ_ESCOLHA=B bash produzir.sh ../reel_01 voz`). Se todas saírem com sotaque de Portugal, clonar de uma referência brasileira ou usar o Google Vids (perfil "12 Ivone").
3. Alinhamento de água, setas e trinca (vem de `pos.json`); posição dos cartões: conferir em stills.
4. `render.sh` trava se as metas falharem (`SEM_METAS=1` libera).

## Falta depois do render
- `reel_01/entrega/` só com o mp4 final com áudio (ffprobe), `post.txt` e `fuentes.md` (fato das hastes do encosto: Defesa Civil SP).
- Atualizar `CONTRATO.md` com o delta: cartão `notificacao` com `titulo`/`subtitulo`; `chave` em `troca`, `agua`, `setas`; `na_palavra` em `sirene`/`agua`; `cor` no carimbo; lista `som` por plano.
- Doc do happy path no repo (`docs/canais/e_agora/historia_escolha.md`), lições no BADPATHS, branch + PR.
- Flow e Google Vids estão no perfil Dolphin "12 Ivone" como reserva (Flow: só modelos gratuitos).
