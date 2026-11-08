# Olho da G4

Verificação visual dentro da G4. Devolve um JSON curto por render; o agente só abre a imagem quando algo reprova ou antes de mostrar ao Eduardo.

- Camada 1, geometria e silhueta: `divine_eye` do img2threejs (rodar à parte).
- Camada 2, régua de imagem: p10, p50 e p90, contraste, saturação e % estourado contra a referência. Estouro reprova sem chamar o juiz.
- Camada 3, juiz visual: Qwen3-VL-8B-Instruct (Apache-2.0), rubrica JSON, 3 amostras, mediana. Limiar 0,8, calibrado em 04/11.

Uso: `python -I olho_g4.py --ref ref.jpg --render a.png b.png [--rubrica r.json]`.
Modelo: `/content/modelos/qwen3vl8b`. Numa VM nova, copiar de `/content/drive/MyDrive/modelos/qwen3vl8b` (precisa do Drive montado) ou baixar do Hugging Face.
