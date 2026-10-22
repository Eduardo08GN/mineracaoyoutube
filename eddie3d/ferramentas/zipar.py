# zipar.py <destino.zip> <base> <itens...>
import zipfile, os, sys
dest, base, itens = sys.argv[1], sys.argv[2], sys.argv[3:]
z = zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED)
for it in itens:
    p = os.path.join(base, it)
    if os.path.isfile(p): z.write(p, it); continue
    for r, ds, fs in os.walk(p):
        for f in fs:
            fp = os.path.join(r, f); z.write(fp, os.path.relpath(fp, base).replace(os.sep, '/'))
z.close(); print(dest, os.path.getsize(dest) // 1024, 'KB')
