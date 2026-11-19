# Cofre de stacks da G4 (docs/g4-cofre-de-stacks.md): leva credenciais e scripts para a VM e puxa/grava pacotes .sqfs.
# 19/11: origem principal = dataset privado do HF (MrEddie10/g4-cofre, vm/cofre_hf.sh); o Drive (vm/cofre.sh, rclone) e reserva.
#   python cofre.py puxar <rel.sqfs>:<destino> [...]   (em paralelo)   |   python cofre.py gravar <pasta_vm> <rel.sqfs> [pesos]
# Tambem chamado pelo `canal.py ligar` quando T2_COFRE="<rel>:<destino>,..." esta definido (puxa em segundo plano).
import os, sys, threading
import canal
from canal import log

CONF = os.environ.get("T2_RCLONE_CONF", "D:/segredos/rclone_g4.conf")
AQUI = os.path.dirname(os.path.abspath(__file__))


def preparar_vm():
    if canal.G4N != "1" and "gravar" in sys.argv: raise SystemExit("COFRE: so a G4-1 grava no Drive Ultra")
    canal.subir(CONF, "/root/.config/rclone/rclone.conf")
    for s in ("cofre.sh", "cofre_hf.sh"): canal.subir(os.path.join(AQUI, "vm", s), f"/content/t2/vm/{s}")
    # token do HF (D:/segredos, nunca no repositorio): sem ele o HF limita a taxa dos downloads de pesos publicos
    hf = os.environ.get("HF_TOKEN_ARQ", "D:/segredos/hf_token.txt")
    if os.path.exists(hf): canal.subir(hf, "/root/.cache/huggingface/token")


def puxar(itens):
    preparar_vm(); saidas = {}
    def um(it):
        rel, dst = it.split(":", 1)
        out = canal.exec_vm(f"bash /content/t2/vm/cofre_hf.sh puxar {rel} {dst}", prazo=1800, estagnacao=900)
        if "COFRE_OK" not in out:   # reserva: o mesmo pacote no Drive
            log("ALERTA cofre: HF falhou para", rel, "; tentando o Drive")
            out = canal.exec_vm(f"bash /content/t2/vm/cofre.sh puxar {rel} {dst}", prazo=1800, estagnacao=900)
        saidas[rel] = out
    ths = [threading.Thread(target=um, args=(i,)) for i in itens]
    for t in ths: t.start()
    for t in ths: t.join()
    for rel, out in saidas.items(): log([l for l in out.splitlines() if l.startswith("COFRE_")][-1:] or f"COFRE sem resposta {rel}")
    return saidas


def gravar(pasta, rel, tipo=""):
    preparar_vm()
    out = canal.exec_vm(f"bash /content/t2/vm/cofre.sh gravar {pasta} {rel} {tipo}", prazo=3600, estagnacao=1200)   # Drive (reserva)
    n = rel.rsplit("/", 1)[-1]
    out += canal.exec_vm(f"bash /content/t2/vm/cofre_hf.sh gravar /content/img/{n} {rel}", prazo=3600, estagnacao=1200)   # HF (principal)
    log([l for l in out.splitlines() if l.startswith("COFRE_")][-1:]); return out


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    c, a = sys.argv[1], sys.argv[2:]
    if c == "puxar": puxar(a)
    elif c == "gravar": gravar(*a)
