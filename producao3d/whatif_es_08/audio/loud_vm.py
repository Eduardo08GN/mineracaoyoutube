# loudnorm em 2 passadas (-14 LUFS integrado, -1 dBTP) sobre mix.wav -> mix_final.wav e mix.m4a
import json, re, subprocess, sys
D = sys.argv[1]
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", f"{D}/mix.wav", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(re.findall(r"\{[^{}]*\}", r, re.S)[-1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
      f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=summary")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{D}/mix.wav", "-af", af, "-ar", "48000", f"{D}/mix_final.wav"], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{D}/mix_final.wav", "-c:a", "aac", "-b:a", "256k", f"{D}/mix.m4a"], check=True)
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", f"{D}/mix_final.wav", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
print("LOUD_OK", re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1], "LUFS | pico real", re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1], "dBTP", flush=True)
