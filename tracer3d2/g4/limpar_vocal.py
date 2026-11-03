"""Tira qualquer resto de voz das faixas de musica (ACE-Step as vezes canta ou faz coro mesmo com [Instrumental]).
Roda o Demucs (htdemucs, MIT) NA G4 e devolve so a parte instrumental (no_vocals), sobrescrevendo audio/pm/mNN.flac.
Pedido do Eduardo (29/10/2026): musica sempre so instrumental.  Uso: python limpar_vocal.py <pasta do video>"""
import glob, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")); import canal
R = sys.argv[1]; PM = os.path.join(R, "audio", "pm"); V = "/content/t2/vocal"
fs = sorted(glob.glob(os.path.join(PM, "m*.flac")))
canal.exec_vm(f"rm -rf {V} && mkdir -p {V}/in", prazo=60)
for f in fs: canal.subir(f, f"{V}/in/{os.path.basename(f)}")
out = canal.exec_vm(f"cd {V} && pip -q install demucs > pip.log 2>&1; python -m demucs --two-stems=vocals -n htdemucs -o sep in/*.flac > demucs.log 2>&1; "
                    f"for f in in/*.flac; do b=$(basename $f .flac); ffmpeg -v error -y -i sep/htdemucs/$b/no_vocals.wav -c:a flac out_$b.flac && echo OK $b; "
                    f"done; tail -3 demucs.log",
                    prazo=1800, estagnacao=900)
print(out[-600:])
out = canal.exec_vm(f"cd {V}/sep/htdemucs && for b in *; do "
                    f"v=$(ffmpeg -i $b/vocals.wav -af volumedetect -f null - 2>&1 | grep -o 'mean_volume: [-0-9.]*' | grep -o '[-0-9.]*$'); "
                    f"m=$(ffmpeg -i $b/no_vocals.wav -af volumedetect -f null - 2>&1 | grep -o 'mean_volume: [-0-9.]*' | grep -o '[-0-9.]*$'); echo VOCAL $b $v $m; done", prazo=300)
# 30/10/2026: medir o que o Demucs tirou. Voz a menos de LIMIAR dB abaixo da musica = a faixa CANTAVA de verdade (o Demucs tira, mas deixa
# buraco/artefato): avisar para regerar essa faixa com outra semente em vez de confiar so na separacao.
LIMIAR = 22.0   # 30/10: com a receita corrigida (gerar_musica_bat) a musica limpa fica 25-41 dB acima do stem de voz
ruins = []
for l in out.splitlines():
    p = l.split()
    if len(p) == 4 and p[0] == "VOCAL":
        try: dv = float(p[3]) - float(p[2])
        except ValueError: continue
        print(f"{p[1]}: voz {p[2]} dB, musica {p[3]} dB, folga {dv:.1f} dB" + ("  <-- TINHA VOZ: regerar" if dv < LIMIAR else ""))
        if dv < LIMIAR: ruins.append(p[1])
print("FAIXAS_COM_VOZ", ruins if ruins else "nenhuma")
for f in fs:
    b = os.path.basename(f)[:-5]
    canal.baixar(f"{V}/out_{b}.flac", f); print("limpo", b)
