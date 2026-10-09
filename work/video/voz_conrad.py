# A voz dos takes do avatar (Veo) levada para o timbre da narracao (Conrad + OpenVoice v2, tau 0.3 — o mesmo do p01_b),
# para o monge falar na camera com a MESMA voz que narra.
#   python work/video/voz_conrad.py <take.mp4> [...]   ->  work/video/voz/conrad/<nome>_conrad.wav
import os, subprocess, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(AQUI, "voz", "openvoice_v2")
SAIDA = os.path.join(AQUI, "voz", "conrad")
_TC = []


def _tc():
    if not _TC:
        import torch
        from openvoice.api import ToneColorConverter, OpenVoiceBaseClass
        tc = ToneColorConverter.__new__(ToneColorConverter)
        OpenVoiceBaseClass.__init__(tc, os.path.join(D, "converter", "config.json"), device="cpu")
        tc.watermark_model = None; tc.version = getattr(tc.hps, "_version_", "v1")
        tc.load_ckpt(os.path.join(D, "converter", "checkpoint.pth"))
        _TC.append((tc, torch.load(os.path.join(AQUI, "voz", "conrad_se.pth"))))
    return _TC[0]


def converter(mp4, tau=0.3):
    nome = os.path.splitext(os.path.basename(mp4))[0]
    saida = os.path.join(SAIDA, nome + "_conrad.wav")
    if os.path.exists(saida): return saida
    os.makedirs(SAIDA, exist_ok=True)
    w = os.path.join(SAIDA, nome + "_veo.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp4, "-vn", "-ac", "1", "-ar", "22050", w], check=True)
    tc, alvo = _tc()
    tc.convert(audio_src_path=w, src_se=tc.extract_se([w]), tgt_se=alvo, output_path=saida, tau=tau)
    return saida


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    for a in sys.argv[1:]: print(converter(a), flush=True)
