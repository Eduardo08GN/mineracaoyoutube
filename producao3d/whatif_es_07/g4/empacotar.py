# Empacota o batedor para a G4: um zip so com codigo + public (os GLB do Fab, pessoas, palmeiras, texturas, fontes).
# Uso (PC): python g4/empacotar.py  ->  D:/whatif_es/07_batedor_fab/pkg_07.zip
import os, zipfile
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
saida = os.path.join(RAIZ, 'pkg_07.zip')
z = zipfile.ZipFile(saida, 'w', zipfile.ZIP_DEFLATED)
for f in ['package.json', 'remotion.config.ts', 'tsconfig.json']:
    z.write(os.path.join(RAIZ, f), f)
for base in ['src', 'public']:
    for r, _, fs in os.walk(os.path.join(RAIZ, base)):
        for f in fs:
            p = os.path.join(r, f)
            z.write(p, os.path.relpath(p, RAIZ).replace(os.sep, '/'))
z.close()
print(saida, round(os.path.getsize(saida) / 1e6, 1), 'MB')
