# Tracer3D 2.0 / V3: sobe g4/kv3 pela HTTP do canal, roda alinhamento + musica + efeitos na G4 e baixa os resultados.
import os, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")); import canal
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); K = os.path.join(R, "g4", "kv3"); V = "/content/t2/kv3"
canal.garantir(os.path.join(R, "v1"))
for raiz, _, arqs in os.walk(K):
    for a in arqs:
        f = os.path.join(raiz, a); canal.subir(f, V + "/" + os.path.relpath(f, K).replace("\\", "/"))
canal.log("kv3 na VM; rodando alinhamento + musica + efeitos")
out = canal.exec_vm(f"cd {V} && rm -f status.txt && bash rodada.sh", prazo=3600, estagnacao=1500)
print(out[-800:])
for remoto, local in (("alinhamento.json", "voz/alinhamento.json"), ("musica.tar", "audio/musica.tar"), ("efeitos.tar", "audio/efeitos.tar")):
    try: canal.baixar(f"{V}/{remoto}", os.path.join(R, local)); canal.log("baixado", local)
    except SystemExit as e: canal.log("ALERTA falta", remoto, str(e)[:200])
print(canal.exec_vm(f"grep -h 'ALINHADO\|FALHOU\|Traceback' {V}/alinhar.log | tail -14; tail -3 {V}/musica.log {V}/efeitos.log", prazo=60))
