# Ferramentas do formato "acidente com pessoa" (reels FB + coletânea YouTube)

Doc do formato: `docs/formato-acidentes-fb.md`.

## Na G4 (`vm/`, copiar para `/content/t2/acid_bat/vm/`)
- `inst.sh`: venv (torch cu128, diffusers, peft, etc.).
- `prompts.json`: estilo + K1 + edições + movimento por plano (o batedor de 07/11 é o exemplo).
- `img_a.py k1 | edit`: K1 com Qwen-Image (2 sementes) e as edições do K1 com Qwen-Image-Edit-2509 (personagem mantido). Processos separados para liberar a VRAM.
- `vid_a.py`: Wan 2.2 I2V A14B + LoRAs lightx2v 4 passos. Env: `W`, `H` (padrão 480×832), `KS` (planos), `SUF`.
- `rife.py` + `rife_arch.py` (Practical-RIFE, hzwer, MIT): 16 → 30 fps.
- `run.sh`: o lote inteiro com tempos em `tempos.log`; baixa o Qwen e o Wan em fases para caber nos 236 GB do disco.

Ligar e desligar pela G4-2: `T2_G4=2 T2_DONO=<dono> python D:/tracer3d2/canal.py ligar|exec|subir|baixar`, e `T2_PAPEL=maestro ... desligar` só no fim. No Git Bash, `MSYS_NO_PATHCONV=1` (senão `/content/...` vira caminho do Windows e o `subir` falha calado).

## No PC
- `ocr_texto.py VIDEO SAIDA.tsv`: texto na tela a 2 fps (rapidocr), com a área e as caixas.
- `folha_estilo.py SAIDA.jpg`: folha lado a lado (referências + rotas), com HUD e legenda em código.
- `unzip_seguro.py ZIP PASTA`: extrai um zip não confiável recusando caminho absoluto ou `..`.
