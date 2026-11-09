# Pipeline de produção: Tomiko · Casa Limpa (nicho limpeza)

Memória de longo prazo do funil da Tomiko 55 no nicho de limpeza (desde 6/11/2026). Modelo: @cida.organizacasa
(canal do primo e sócio do Eduardo, direito de uso OK). Conta: @vovotomiko.

## 1. O funil

1. **Reel** 9:16 (~50 s) no Instagram e no Facebook, gancho de sujeira, receita caseira, resultado e CTA.
2. **CTA (desde 8/11):** dois takes colados: "Comenta guia que eu te mando." + "E segue o meu perfil, tá? Senão o guia não
   chega até você." Só a animação do comentário "GUIA" no lugar da legenda; sem card de Facebook nem de perfil.
3. **Direct automático** (Youze, palavra GUIA) → link `https://receitasdatomiko.online/dm`.
4. **Landing** `receitasdatomiko.online` (raiz = Casa Limpa; `/receitas` = landing antiga de Okinawa). Gerada por
   `D:\low-ticket\Nicho Casa\Tomiko - Casa Limpa\ferramentas\landing_montar.py` + `gera_landing.py`. Publicar sempre a pasta
   `pagina/` inteira (o nginx tem /bio /dm /l /rl /rdm).
5. **Checkout** AutomaWeb (cadastrado pela sessão AutomaCheckout):
   - combo R$ 29,90 `fgf0fjffpq`;
   - só a casa R$ 19,90 `slhog30o2s`;
   - downsell no modal R$ 24,90 `826tfvqm9r`;
   - 3 order bumps SOS (Mofo, Sofá e Colchão, Manchas de Roupa) de R$ 7,90.
6. **Entregáveis** (PDFs em `guia\`):
   - Casa Limpa do Jeito da Tomiko (74 p.);
   - Lavanderia da Tomiko;
   - Método Kirei;
   - Planner da Casa Kirei;
   - os 3 SOS.
7. **Bio:** "Perfil gerado por IA · 🧽 Casa limpa sem gastar rios de dinheiro · 💧 Mofo, piso, panela: dicas caseiras
   simples · 👇 Acesse meu Guia" + `https://receitasdatomiko.online/bio`.

## 2. Produção do Reel (Google Vids, desde 7/11; o Flow saiu)

| Etapa | Como | Arquivo |
|---|---|---|
| Vídeo-base | Reel da Cida; baixar e transcrever (skill /watch); o Eduardo escolhe | `research_notes/reel_lencol_tomiko.md` (roteiro) |
| Roteiro | Fala fiel frase a frase, 1 take = 1 frase = 1 ação, ~9 takes de 10 s | idem |
| Prompts | Inglês, fala entre aspas em pt-BR, foto da Tomiko como @Imagem1 | `research_notes/prompts_vids_lencol.md` |
| Geração | Google Vids no Dolphin "12 Ivone", painel "Clipe de vídeo gerado com IA", modo **Criar**, Omni 720p 9:16 10 s; script Playwright por CDP, um take por vez (~2 min cada) | scratchpad `produzir_lencol.py` |
| Revisão | **O Eduardo revisa** cada take num player embutido na conversa; Claude não olha quadros (economia de tokens) e refaz o take apontado | — |
| Voz | Converter cada take para a voz oficial com OpenVoice v2 (`D:\masaje-es\vsl-gatillo\voz\normalizar_voz.py <ref> <saida> takes... --tau 0.5`) | `research_notes/voz/TOMIKO55_VOZ_OFICIAL_rouca2.wav` |
| Badge | Badge redonda da Tomiko (78% opaca, contorno 1 px) centrada no losango ✦ da marca d'água: (600, 1162) em 720x1280 | `research_notes/voz/badge_tomiko.png` |
| Hook | ~3–4 s do clímax visual do próprio take (a sujeira saindo) no início, com fala curta adaptada ao fenômeno ("Olha, gente, como sai tudo!"), tirada de um clipe extra só de áudio; cortar só a fala (o OpenVoice vira ruído em chiado) | `prompts_vids_*` último take |
| Velocidade | **Todo Reel sai acelerado 1,15x com jitter de ±5%** (cada take com velocidade sorteada entre ~1,09x e ~1,21x), vídeo e áudio juntos, sem mudar o tom | montagem |
| Montagem | Corte pela fala (Whisper), concat, legenda estilo 2, animação do comentário "GUIA" no CTA, legenda a 0,5 da escala | `research_notes/montar_lencol.py` → `reel_lencol/final.mp4` |

### Regras dos prompts (feedback do Eduardo)
- **Efeito visual forte:** a sujeira tem cor muito saturada e chamativa (amarelo-mostarda quase laranja, "impossible to miss"),
  em close, com contraste sujeira × parte limpa. A limpeza é **extrema**: "spotless, snow-white like brand new, not a trace
  left". Espuma grossa de verdade. O fenômeno visual da limpeza é o protagonista.
- **Ação junto com a fala:** ela faz a ação enquanto fala, desde o 1º segundo; nunca "faz e depois fala".
- **Orçamento de mãos:** mão que segura algo está ocupada; nunca "both hands" se uma está ocupada.
- **Voz no prompt:** parecida com a Zali: "a warm, wise, calm and caring voice of a Japanese-Brazilian woman, natural Brazilian
  Portuguese with a soft Paraná accent, never European Portuguese, talking to one friend. Speech clean, no background music, no sound effects."
- **Fechamento fixo:** "Full-frame vertical 9:16 handheld video, no phone or device frame visible. One single continuous shot,
  no cuts, no scene changes. No text, no music, no other speakers." Nunca escrever "smartphone".
- **Recusas:** o Vids recusou "Me segue e comenta GUIA que eu te mando…" e "toca… no link azul. O meu guia está lá." O CTA da
  Cida ("Comenta guia." / "…depois no link. O meu guia completo tá lá.") é o padrão.

## 3. Identidade da Tomiko 55
- Nipo-brasileira de 55 anos: lenço tenugui índigo com ondinhas brancas, camiseta branca, avental jeans índigo com
  quadrado de sashiko branco, luvas de borracha amarelas.
- Foto de referência: `data/instagram/avatares/tomiko-casa-bdd9/foto.png`; retrato "fotográfico" para a badge e para o perfil:
  `D:\Music\tomiko.jpg`.
- Cenário: segue o do vídeo-base, adaptado a uma casa brasileira simples (nada de cenário fixo).

## 4. O que foi testado e descartado
- **Flow / Veo 3.1 Lite:** freio de tráfego e inconsistência (3ª mão, objetos voando).
- **Vídeo→vídeo na G4** (Wan 2.2 Animate): lento (1,5 a 19 min por take) e com objetos inventados. O MiniMax H3 ficou fora
  pela licença.
- **Vozes descartadas:** Qwen3-TTS (artificial), vids4 e rouca2 do Vids. A oficial é a Zali (Gemini TTS).
- **Limite do Vids:** a conta 12 Ivone bate "Você atingiu seu limite"; a reserva é o perfil Dolphin PLACA DE VIDEO (PERFIL=903382646).
