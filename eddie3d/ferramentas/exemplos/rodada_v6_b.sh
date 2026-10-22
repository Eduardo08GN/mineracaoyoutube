export MSYS_NO_PATHCONV=1
# Video 6: codigo (src + public/madrid + LICENCAS) pelo painel; assets ja em /content/assets_v6.zip. Uso: bash rodada_v6_b.sh <rotulo> <quadros...>
R=$1; shift; Q="$*"
cd /d/whatif_es/06_spun_slower/v1 && rm -f ../pkg_v6.zip && python -c "
import zipfile,os
z=zipfile.ZipFile('../pkg_v6.zip','w',zipfile.ZIP_DEFLATED)
for f in ['package.json','package-lock.json','remotion.config.ts','tsconfig.json','public/LICENCAS.txt']: z.write(f,f)
for base in ['src','public/madrid']:
  for r,_,fs in os.walk(base):
    for f in fs:
      if '.tmp.' in f: continue
      p=os.path.join(r,f); z.write(p,p.replace(os.sep,'/'))
z.close()"
cd /d/whatif_es
timeout 1500 python -c "
import sys; sys.path.insert(0, r'D:\mineracaoyoutube\eddie3derramentas'); import colab; colab.subir_painel(sys.argv[1])" "D:/whatif_es/06_spun_slower/pkg_v6.zip" 2>&1 | grep -o "SUBIU_PAINEL.*" | tail -1
python g4.py rodar "exec 9>/content/v6.lock; flock -n 9 || exit 0; mkdir -p /content/v6/public && cd /content/v6 && rm -rf src && python3 -c \"import zipfile; zipfile.ZipFile('/content/assets_v6.zip').extractall('/content/v6/public'); zipfile.ZipFile('/content/pkg_v6.zip').extractall('/content/v6')\" && bash /content/vm_comum/preparar.sh /content/v6 && bash /content/vm_comum/stills.sh /content/v6 $R $Q"
for i in $(seq 1 60); do o=$(timeout 150 python g4.py ler /content/v6/status.txt 400 2>/dev/null); if echo "$o" | grep -q "STILLS_${R}_PRONTO\|STILLS_${R}_BUNDLE\|FALHOU"; then echo "$o" | grep -E "PREPARADO|npm|STILLS_${R}|FALHOU"; break; fi; sleep 30; done
python g4.py baixar /content/v6/st_$R.jpg 06_spun_slower/v1/teste/st_$R.jpg 2>&1 | tail -1
