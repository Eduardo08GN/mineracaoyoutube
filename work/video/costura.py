# A COSTURA: transicoes de montador no lugar do corte seco (pedido do Eduardo, 09/10: "cortes secos e amadores").
# Regras (o que um montador de documentario faz, nao um "efeito em cada corte"):
#   corte   no meio do mesmo assunto: corte seco, na acao (continua a maioria dentro do b-roll)
#   fusao   troca de assunto no b-roll e entrada/saida do avatar: fusao curta (0,33-0,5 s)
#   papel   entrada e saida dos motion graphics e do CTA: mergulho no creme do papel antigo (0,67 s)
#   luz     troca de secao do roteiro: fusao com clarao de pelicula quente (light leak, 0,8 s)
# Tudo em QUADROS (30 fps) para nao escorregar a sincronia: cada transicao come d quadros do fim de A e do inicio
# de B; quem chama estende os planos/blocos (ou deixa respiro de silencio) para a duracao total nao mudar.
import json, os, subprocess

W, H, FPS = 1280, 720, 30                   # ⛔ (09/10) nada acima de 720p
VID = ["-c:v", "libx264", "-preset", "medium", "-crf", "22", "-maxrate", "4M", "-bufsize", "8M", "-pix_fmt", "yuv420p",
       "-r", str(FPS)]          # teto de 4 Mbps em 720p (~500 MB para 18 min) (o grao de filme sem teto passava de 80 Mbps)
SR = 48000                                  # 1600 amostras por quadro: o audio corta exato no quadro
CREME = (212, 113, 136)                     # #F1E4C6 em yuv420p (faixa limitada): Y, U, V
QUADROS = {"fusao": 12, "fusao_curta": 10, "papel": 20, "luz": 24}


def ff(*a):
    r = subprocess.run(["ffmpeg", "-v", "error", "-y", *a], capture_output=True, text=True)
    if r.returncode: raise SystemExit("ffmpeg: " + r.stderr[-800:])


def quadros(arq):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
                        "stream=nb_read_packets", "-of", "csv=p=0", arq], capture_output=True, text=True)
    return int(r.stdout.strip().split(",")[0])


def _grafo(tipo, n):
    """[0:v] = os n ultimos quadros de A, [1:v] = os n primeiros de B  ->  [v]"""
    d = n / FPS
    ab = "[0:v]setpts=PTS-STARTPTS,format=yuv420p,tpad=stop_mode=clone:stop=3[a];[1:v]setpts=PTS-STARTPTS,format=yuv420p[b];"
    if tipo in ("fusao", "fusao_curta"):
        return ab + f"[a][b]xfade=transition=fade:duration={d:.4f}:offset=0[v]"
    if tipo == "papel":
        # A -> creme -> B, com curva suave (o papel aparece inteiro so' no meio)
        c = f"if(eq(PLANE,0),{CREME[0]},if(eq(PLANE,1),{CREME[1]},{CREME[2]}))"
        s1, s2 = "(1-cos(PI*(2*P-1)))/2", "(1-cos(PI*(1-2*P)))/2"
        expr = f"if(gt(P,0.5),A*{s1}+{c}*(1-{s1}),B*{s2}+{c}*(1-{s2}))"
        return ab + f"[a][b]xfade=transition=custom:duration={d:.4f}:offset=0:expr='{expr}'[v]"
    if tipo == "luz":
        # fusao + um clarao ambar que atravessa o quadro (somado em "screen", pico no meio)
        luz = (f"gradients=s={W}x{H}:r={FPS}:d={d + 0.2:.3f}:n=3:c0=0xFFD9A0:c1=0xF08A3C:c2=0x000000:"
               f"x0=0:y0=0:x1={W}:y1={H}:speed=0.06:type=linear,format=gbrp[l];")
        env = f"pow(sin(PI*min(T/{d:.4f}\\,1)),1.5)"
        return (ab + luz + f"[a][b]xfade=transition=fade:duration={d:.4f}:offset=0,format=gbrp[x];"
                f"[x][l]blend=all_expr='A+B*0.9*{env}*(255-A)/255',format=yuv420p[v]")
    raise ValueError(tipo)


def _ss(q):
    """-ss que cai exatamente no quadro q (meio quadro antes: o seek preciso pega o primeiro pts >= ss)."""
    return ["-ss", f"{max(0.0, (q - 0.5) / FPS):.4f}"] if q > 0 else []


def costurar_video(partes, trans, saida, tmp, nome="c", vid_args=None):
    tmp = os.path.abspath(tmp)
    V = vid_args or VID                      # intermediario (dentro do bloco) ou entrega (entre blocos)
    """partes: [mp4]; trans[i]: (tipo, n_quadros) entre partes[i] e partes[i+1] (n=0 ou tipo 'corte' = corte seco).
    Duracao final = soma dos quadros - soma dos n. Grava saida (so' video)."""
    L = [quadros(p) for p in partes]
    tr = []
    for i, (tipo, n) in enumerate(trans):
        n = 0 if tipo == "corte" else int(n)
        n = min(n, L[i] // 3, L[i + 1] // 3)          # nunca come mais de 1/3 de um plano
        tr.append((tipo, n if n >= 4 else 0))
    segs = []
    for i, p in enumerate(partes):
        h = tr[i - 1][1] if i > 0 else 0
        t = tr[i][1] if i < len(tr) else 0
        seg = os.path.join(tmp, f"{nome}_n{i:03d}.mp4")
        ff(*_ss(h), "-i", p, "-frames:v", str(L[i] - h - t), "-an", *V, seg)
        segs.append(seg)
        if t:
            tseg = os.path.join(tmp, f"{nome}_t{i:03d}.mp4")
            ff(*_ss(L[i] - t), "-i", p, "-i", partes[i + 1], "-filter_complex", _grafo(tr[i][0], t), "-map", "[v]",
               "-frames:v", str(t), "-an", *V, tseg)
            segs.append(tseg)
    lst = os.path.join(tmp, nome + "_costura.txt")
    open(lst, "w").writelines(f"file '{s.replace(os.sep, '/')}'\n" for s in segs)
    ff("-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", saida)
    for s in segs: os.remove(s)
    return [q for _t, q in tr], L


def bordas_silencio(wav_ou_mp4, limiar_db=-40.0):
    """(silencio no inicio, silencio no fim) em segundos: onde a voz ainda nao comecou / ja' terminou."""
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", wav_ou_mp4, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                         capture_output=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    if not len(x): return 0.0, 0.0
    j = 160                                                          # janelas de 10 ms
    rms = np.sqrt(np.mean(x[: len(x) // j * j].reshape(-1, j) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    # limiar relativo a voz: o ambiente do take do Veo passa de -40 dB e era lido como fala (a transicao encolhia)
    limiar = max(limiar_db, float(np.percentile(db, 98)) - 22)
    alto = np.nonzero(db > limiar)[0]
    if not len(alto): return len(rms) / 100, len(rms) / 100
    return alto[0] / 100, (len(rms) - 1 - alto[-1]) / 100


def costurar_blocos(blocos, tipos, saida, tmp, loudnorm=True):
    tmp = os.path.abspath(tmp)
    """blocos: [mp4 com audio]; tipos[i]: tipo da transicao entre bloco i e i+1. A duracao de cada transicao e'
    limitada pelo silencio nas bordas (a fala de um bloco nunca se sobrepoe a do outro) e o audio cruza junto."""
    bordas = [bordas_silencio(b) for b in blocos]
    trans, curvas = [], []
    for i, tipo in enumerate(tipos):
        n = QUADROS.get(tipo, 0) if tipo != "corte" else 0
        fa, fb = int(bordas[i][1] * FPS), int(bordas[i + 1][0] * FPS)   # quadros de silencio: fim de A, inicio de B
        # o som cruza so' onde ha' silencio: os dois lados calados = os dois esmaecem; so' o fim de A calado = J-cut
        # (a voz de B entra inteira, a imagem ainda fundindo); so' o inicio de B calado = L-cut (a voz de A termina inteira)
        if n and min(fa, fb) >= n: c = ("qsin", "qsin")
        elif n and fa >= n: c = ("qsin", "nofade")
        elif n and fb >= n: c = ("nofade", "qsin")
        else:
            n = max(fa, fb) if n else 0
            c = ("qsin", "nofade") if fa >= fb else ("nofade", "qsin")
        trans.append((tipo, n if n >= 4 else 0)); curvas.append(c)
    vid = os.path.join(tmp, "costura_v.mp4")
    ns, L = costurar_video(blocos, trans, vid, tmp, "blk")
    # audio: cada bloco cortado/estendido para EXATAMENTE os seus quadros, cruzado nas transicoes.
    # ⛔ em numpy, bloco a bloco: a corrente de 44 acrossfade no ffmpeg travou (impasse de buffer, CPU parada)
    aud = os.path.join(tmp, "costura_a.wav")
    json.dump({"ns": ns, "L": L, "curvas": curvas}, open(os.path.join(tmp, "costura_trans.json"), "w"))
    mixar_audio(blocos, L, ns, curvas, aud, tmp)
    norm = ["-af", "loudnorm=I=-16:TP=-1.5:LRA=11"] if loudnorm else []
    ff("-i", vid, "-i", aud, "-map", "0:v", "-map", "1:a", "-c:v", "copy", *norm, "-ar", str(SR), "-c:a", "aac",
       "-b:a", "192k", "-shortest", "-movflags", "+faststart", saida)
    os.remove(vid)
    return list(zip(tipos, ns))


def tipo_entre(a, b):
    """A transicao entre dois blocos. a/b = (genero, secao_ini, secao_fim); genero: narr, fala, split, mg, cta."""
    if a[0] in ("mg", "cta") or b[0] in ("mg", "cta"): return "papel"
    if b[1] != a[2]: return "luz"
    if a[0] in ("fala", "split") or b[0] in ("fala", "split"): return "fusao_curta"
    return "fusao"


def _curva(nome, n, entra):
    import numpy as np
    x = (np.arange(n) + .5) / n
    if nome == "nofade": return np.ones(n)
    return np.sin(x * np.pi / 2) if entra else np.cos(x * np.pi / 2)


def mixar_audio(blocos, L, ns, curvas, saida, tmp):
    """Junta o audio dos blocos: cada um com exatamente L[i] quadros de som (1600 amostras/quadro), sobrepostos
    em ns[i] quadros com as curvas da transicao (qsin no lado calado, nofade no lado que fala)."""
    import numpy as np, wave
    pedacos = []
    for i, b in enumerate(blocos):
        n_am = L[i] * SR // FPS
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", b, "-vn", "-ac", "2", "-ar", str(SR), "-f", "s16le", "-"],
                             capture_output=True).stdout
        x = np.frombuffer(raw, np.int16).reshape(-1, 2).astype(np.float32)
        x = x[:n_am] if len(x) >= n_am else np.vstack([x, np.zeros((n_am - len(x), 2), np.float32)])
        pedacos.append(x)
    partes, cauda = [], pedacos[0]               # "cauda" = o bloco atual ainda sem a sobreposicao com o proximo
    for i, n in enumerate(ns):
        b = pedacos[i + 1]
        if n:
            k = n * SR // FPS
            c1, c2 = curvas[i] if i < len(curvas) else ("qsin", "qsin")
            partes.append(cauda[:-k])
            partes.append(cauda[-k:] * _curva(c1, k, False)[:, None] + b[:k] * _curva(c2, k, True)[:, None])
            cauda = b[k:]
        else:
            partes.append(cauda); cauda = b
    partes.append(cauda)
    out = np.clip(np.concatenate(partes), -32768, 32767).astype(np.int16)
    w = wave.open(saida, "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes()); w.close()
