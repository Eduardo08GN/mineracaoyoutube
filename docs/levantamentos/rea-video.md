# rea-video: engenharia reversa de vídeo plano a plano

Repositório: https://github.com/JuneYaooo/rea-video · 11 mil ★ · Apache-2.0 · ativo (push em 19/11/2026). Lido em 19/11/2026.

## O que faz
- **Para cada plano**, diz se foi filmado, gerado por IA, 3D ou animação, código ou template, ou gravação de tela, e **como refazer**.
- **Duas saídas:**
  - relatório HTML/PDF, para gente;
  - **VIDEO.md** em camadas, para o agente. É um formato aberto: o agente lê só a camada que a pergunta pede.
- **Cobre também:**
  - legendas e textos (início e fim, cor, contorno, entrada), exportáveis em SRT/ASS;
  - figurinhas e picture-in-picture;
  - cortes: onde caem, a velocidade e se batem na música;
  - áudio: voz humana ou de IA, música de IA ou de biblioteca e o BPM, onde cai cada efeito;
  - o material que você terá de fornecer.
- Para vídeo feito em código ou template, entrega texto, layout e tempo de movimento **prontos para refazer como projeto Remotion**.
- **Opcional:** um modelo de visão de vídeo (Gemini ou Doubao) para separar melhor filmado de IA e de 3D, e um prompt reconstruído por plano.
- **Remake:** o repositório irmão `capsule-cinema` refaz o vídeo mantendo câmera, movimento, ritmo e transições, trocando só os elementos. Os exemplos foram feitos com **MiniMax H3 rodando em servidor próprio**.
- **Instalação:** diga ao agente "Install https://github.com/JuneYaooo/rea-video, then break down this video: <arquivo>". Precisa de ffmpeg e Python 3.10+.

## Comparação com o que temos
| | `regua24.py` (nossa) | rea-video |
|---|---|---|
| Cortes/min, câmera parada, takes, repetição, cor | ✅ medido, com portões calibrados | parcial |
| Classe do plano | 4 classes, por cor e luz | **filmado / IA / 3D / código / tela**, com evidência |
| Como refazer cada plano | ❌ | ✅ receita e prompt por plano |
| Legendas, textos, efeitos, BPM | ❌ | ✅ |
| Saída para o agente | JSON e CSV | VIDEO.md em camadas |

**Não substitui a régua.** Os nossos portões continuam sendo a métrica de aprovação. **Complementa:** a régua diz *quanto* a referência se mexe; o rea-video diz *como* cada plano foi feito.

## Uso proposto
1. **Leitura óptica de referência:** a `regua24.py` dá os números e o rea-video dá a receita por plano. É o Passo 0 de todo formato novo.
2. Instalar e rodar **na G4**, porque montar stack é trabalho da G4. Os vídeos vão para `/content/jobs/<dono>/`.
3. Como modelo de visão, tentar o Qwen3-VL da G4, se o rea-video aceitar endpoint compatível com a OpenAI.
4. **1º teste:** os 3 tutoriais de `docs/referencias/2026-11-19_documentarios-com-claude.md`, que já estão em `D:/pesquisa_nichos/ref_*`.

## Riscos
- Ler o relatório inteiro gasta token. Ler só a camada do VIDEO.md que a pergunta pede.
- O README avisa que há um token de cripto falso usando o nome do projeto.
