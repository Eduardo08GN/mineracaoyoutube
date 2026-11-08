# Ferramentas do formato "acidente com pessoa" (reels FB + coletânea YouTube)

Doc do formato: `docs/formato-acidentes-fb.md`.

## Na G4
Produção 100% por código (three.js), sem IA de imagem ou vídeo, desde 08/11: ver `docs/pipeline-reels-codigo.md`.

Ligar e desligar pela G4-2: `T2_G4=2 T2_DONO=<dono> python D:/tracer3d2/canal.py ligar|exec|subir|baixar`, e `T2_PAPEL=maestro ... desligar` só no fim. No Git Bash, `MSYS_NO_PATHCONV=1` (senão `/content/...` vira caminho do Windows e o `subir` falha calado).

## No PC
- `ocr_texto.py VIDEO SAIDA.tsv`: texto na tela a 2 fps (rapidocr), com a área e as caixas.
- `folha_estilo.py SAIDA.jpg`: folha lado a lado (referências + rotas), com HUD e legenda em código.
- `unzip_seguro.py ZIP PASTA`: extrai um zip não confiável recusando caminho absoluto ou `..`.
