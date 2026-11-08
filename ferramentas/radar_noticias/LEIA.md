# Radar de notícias quentes

O doc completo está em `docs/radar-noticias-quentes.md`.

```
python -I -X utf8 radar.py [--paises ES,MX,AR,CO,CL,PE,US] [--sem-oferta] [--max-oferta 12] [--saida D:/pesquisa_nichos/radar_quente]
```

- `config.json` guarda os países, as sementes por idioma, as âncoras de calibração (Urda, Learjet), os perfis (`segundo`, `caso_real`), o filtro "fora" (esporte, política, jogo) e as palavras genéricas.
- A chave da YouTube API vem do `.env` local, linha `YOUTUBE_API_KEYS=`, e nunca é impressa.
