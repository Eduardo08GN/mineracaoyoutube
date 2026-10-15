# Anima metade das imagens do modo headcast (uma sim, outra nao) no Google Vids, aba "Animar" (Omni, 10 s, gratis),
# para o video ter movimento como a Mama Pearline (~55% dos planos com movimento). A montagem usa o trecho do meio.
#   python work/video/animar_headcast.py <pasta do projeto> <id do documento do Vids> [frente|tras]
import json, os, sys, time
sys.path.insert(0, r"D:\tmp")
import anim, ivone
from playwright.sync_api import sync_playwright


def alvos(planos):
    """Uma imagem sim, outra nao, pela ordem dos planos de imagem."""
    ims = [p for p in planos if p["tipo"] in ("imagem", "split") and p.get("cena")]
    return [p for i, p in enumerate(ims) if i % 2 == 0]


def main(proj, doc, ordem="frente"):
    anim.DOC = doc
    planos = json.load(open(os.path.join(proj, "planos.json"), encoding="utf-8"))
    pasta = os.path.join(proj, "animacoes"); os.makedirs(pasta, exist_ok=True)
    lista = alvos(planos)
    if ordem == "tras": lista = lista[::-1]
    falhas = {}
    with sync_playwright() as p:
        pg = anim.aba(ivone.conectar(p))
        while True:                      # segue esperando as imagens que ainda vao sair (o gerador de imagem roda junto)
          pendentes = [pl for pl in lista if not os.path.exists(os.path.join(pasta, f"{pl['n']:04d}.mp4"))
                       and falhas.get(pl["n"], 0) < 2]
          prontas = [pl for pl in pendentes if os.path.exists(os.path.join(proj, "imagens", f"{pl['n']:04d}.png"))]
          if not pendentes or (not prontas and not os.environ.get("HC_ESPERAR")): break
          if not prontas: time.sleep(60); continue
          for pl in prontas:
            img = os.path.join(proj, "imagens", f"{pl['n']:04d}.png")
            arq = os.path.join(pasta, f"{pl['n']:04d}.mp4")
            trava = arq + ".lock"
            if os.path.exists(arq) or os.path.exists(trava): continue
            open(trava, "w").write(doc)
            try:
                anim.animar(pg, img, pl["cena"][:300], arq)
                print(f"{pl['n']:04d} animada", flush=True)
            except Exception as e:                                         # noqa: BLE001
                falhas[pl["n"]] = falhas.get(pl["n"], 0) + (2 if "termos" in str(e) else 1)
                print(f"{pl['n']:04d} FALHOU: {str(e)[:120]}", flush=True); time.sleep(20)
            finally:
                os.remove(trava)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    main(os.path.abspath(sys.argv[1]), sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "frente")
