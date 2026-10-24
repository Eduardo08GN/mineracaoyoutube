# Gera kv3/mapa_g4.json (musica por capitulo com os tempos reais dos wavs + biblioteca de efeitos) e copia voz e roteiro.
import json, os, shutil, wave
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); K = os.path.join(R, "g4", "kv3")
caps = json.load(open(os.path.join(R, "roteiro", "skript_de.json"), encoding="utf-8"))["kapitel"]
BASE = "documentary film score, instrumental, no vocals, no drum kit, subtle, sits under a narrator voice, "
CAP = {"01": "Crimea dawn 1942, vast and ominous, deep low brass drone, distant wind, slow building tension",
       "02": "minimal soft synth pulse and single piano notes, neutral and clean, slow",
       "03": "1930s industrial Germany, steady cello ostinato, cold metallic textures, measured, slow",
       "04": "analytical, clean pulsing synth arpeggio, light ticking, precise, medium tempo",
       "05": "heavy industrial machinery, slow deep percussion without drum kit, metallic resonances, massive, slow",
       "06": "long railway journey east, rhythmic low strings like a train, bleak steppe, melancholic, slow",
       "07": "rising tension, sustained strings swelling then falling, restrained, cinematic, slow",
       "08": "analytical, soft synth pulse and piano, contemplative, slow",
       "09": "war map briefing, low timpani rolls, dark brass swells, somber, slow",
       "10": "mystery and revelation, sparse piano, subtle suspense pads, curious, slow",
       "11": "memorial, solemn strings, quiet grief, slow",
       "12": "reflective epilogue, warm strings with subtle synth, sober ending, slow"}
EFE = [("s01", "colossal railway gun firing, gigantic deep boom, shockwave rolling over hills, long echo", 6, 3),
       ("s02", "enormous artillery shell impact on concrete fortress, deep crushing explosion, debris falling", 6, 3),
       ("s03", "heavy artillery shell rushing through the air, deep tearing whoosh", 4, 2),
       ("s04", "huge underground ammunition depot explosion, earth shaking roar, long rumble", 9, 2),
       ("s05", "steam locomotive and heavy freight train rolling on rails, rhythmic clatter", 20, 1),
       ("s06", "dry steppe wind in Crimea, insects, distant birds, open landscape", 20, 1),
       ("s07", "large construction site 1940s, shovels, hammering, distant engines, workers", 20, 1),
       ("s08", "heavy steel machinery clanking, hydraulic hiss, huge breech mechanism closing", 6, 2),
       ("s09", "distant continuous artillery barrage rumbling on the horizon", 20, 1),
       ("s10", "WWII dive bomber siren diving and bomb explosion in the distance", 6, 2),
       ("s11", "massive crane lifting heavy steel, chains rattling, metal groaning", 6, 2),
       ("s12", "Black Sea waves on a rocky shore, wind", 20, 1)]
t = 0.0; mus = []
for c in caps:
    with wave.open(os.path.join(R, "voz", c["id"] + ".wav")) as w: d = w.getnframes() / w.getframerate()
    mus.append({"id": "m" + c["id"][:2], "s": round(t, 2), "e": round(t + d, 2), "lufs": -30, "caption": BASE + CAP[c["id"][:2]]})
    t += d + 0.8
json.dump({"duracao": round(t - 0.8, 2), "musica": mus, "efeitos": [{"id": i, "prompt": p, "dur": d, "variantes": v} for i, p, d, v in EFE]},
          open(os.path.join(K, "mapa_g4.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
os.makedirs(os.path.join(K, "voz"), exist_ok=True)
for c in caps: shutil.copy(os.path.join(R, "voz", c["id"] + ".wav"), os.path.join(K, "voz"))
shutil.copy(os.path.join(R, "roteiro", "skript_de.json"), K)
print("mapa ok", round(t - 0.8, 1), "s,", len(mus), "musicas,", len(EFE), "efeitos")
