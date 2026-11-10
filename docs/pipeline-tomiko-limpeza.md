# Pipeline de produção: Tomiko · Casa Limpa (nicho limpeza)

Memória de longo prazo do funil da Tomiko 55 no nicho de limpeza (desde 6/11/2026). Modelo: @cida.organizacasa
(canal do primo e sócio do Eduardo, direito de uso OK). Conta: @vovotomiko.

## 1. O funil

1. **Reel** 9:16 (~50 s) no Instagram e no Facebook, gancho de sujeira, receita caseira, resultado e CTA.
2. **CTA (igual ao da Cida):** "O que clareia ele está no meu guia. Comenta guia." e o take do Facebook "Tá me vendo pelo
   Facebook? Toca no meu nome e depois no link. O meu guia completo tá lá." (cards animados por cima).
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
| Voz | Converter cada take para a voz oficial com OpenVoice v2 (`D:\masaje-es\vsl-gatillo\voz\normalizar_voz.py <ref> <saida> takes... --tau 0.5`) | `research_notes/voz/TOMIKO55_VOZ_OFICIAL_vids4.wav` |
| Badge | Badge redonda da Tomiko (78% opaca, contorno 1 px) centrada no losango ✦ da marca d'água: (600, 1162) em 720x1280 | `research_notes/voz/badge_tomiko.png` |
| Montagem | Corte pela fala (Whisper), concat, legenda estilo 2, card seguir+comentar "GUIA" no take do CTA, card do Facebook em tela cheia no último take | `research_notes/montar_lencol.py` → `reel_lencol/final.mp4` |

### Regras dos prompts (feedback do Eduardo)
- **Efeito visual forte:** a sujeira tem cor muito saturada e chamativa (amarelo-mostarda quase laranja, "impossible to miss"),
  em close, com contraste sujeira × parte limpa. A limpeza é **extrema**: "spotless, snow-white like brand new, not a trace
  left". Espuma grossa de verdade. O fenômeno visual da limpeza é o protagonista.
- **Transformação pronunciada (10/11):** vale para toda cena em que algo é limpo, não só para o hook. Três estados
  no mesmo take, sem corte:
  1. **Antes:** sujeira extrema, escura e espalhada; nada limpo no 1º quadro.
  2. **Durante:** a cada passada da ferramenta fica uma faixa totalmente limpa, com borda nítida contra a sujeira
     ao lado. A mudança de cor acontece na hora, na frente da câmera (ex.: teto preto de mofo que fica branco atrás
     do rodo).
  3. **Depois:** o mesmo ponto impecável, sem resto nem sombra de mancha.

  Motivo: o contraste é a prova de que o mecanismo funciona. Se quem assiste não vê a diferença sem esforço, a
  receita parece fraca. Take com antes e depois parecidos, ou com limpeza gradual e apagada, é reprovado e refeito.
- **Copy visual (10/11), vale para qualquer nicho:** a imagem também é copy, e a meta é reter a atenção.
  - **Sintoma no máximo de intensidade.** A dor aparece pronunciada: mofo cobrindo a parede de cima a baixo, nunca
    um mofo pequeno e comum. Sintoma tímido é oportunidade perdida de hook e de retenção, e reprova o take.
  - **A persona reforça o hook nos 3 primeiros segundos:** olho arregalado, cara assustada, apontando para o
    problema, fala veemente (ordem direta, "agora"). Sintoma extremo, expressão e frase entram juntos no 1º segundo.
- **Hook de sujeira escondida, o "mecanismo único visual" (10/11):** segunda classe de hook, ao lado da
  transformação sujo → limpo. Aqui a transformação é invertida: o objeto parece limpo e a prova é a sujeira que sai
  dele. Medido num Reel de referência de 32,6 s (chuveiro com um saco de mistura preso; 36 mil curtidas, 8,5 mil
  comentários):
  - **Dispositivo inusitado:** um objeto fora do lugar que torna visível o que não se vê (o saco cheio de líquido
    pendurado no chuveiro). A pessoa para só para entender o que é aquilo.
  - **Sujeira em movimento:** as gosmas caem e se acumulam durante os 3 s do hook; não é foto de sujeira parada.
  - **Contraste de cor:** líquido âmbar e gosma preta contra azulejo branco, legível em miniatura.
  - **O fenômeno ocupa dois terços do quadro;** a persona fica pequena embaixo, olhando para a câmera e apontando.
  - **A fala nomeia o medo oculto:** "Olha o que estava escondido dentro desse chuveiro."
  - **Montagem:** take 1 (0–3,25 s) é o clímax antecipado; take 2 (até 13 s) são mãos em primeira pessoa montando
    a receita; take 3 (até 17 s) mostra o líquido transparente ficando sujo ("Olha isso!"); take 4 é a persona
    falando num take só de 15,7 s, com explicação, guia e CTA.
  - **Onde cabe:** coisas que parecem limpas e escondem sujeira (chuveiro, máquina de lavar, ralo, colchão, filtro).
- **Coerência da copy visual e empilhamento de dimensões (10/11):** caso de estudo, um Reel de referência sobre
  escorpião no ralo (59,5 s, ~14 takes, 38 mil curtidas, 3,5 mil comentários). Viralizou mesmo com a lógica
  visual errada, o que mostra quanto espaço há para fazer melhor.
  - **O que estava errado:** escorpiões parados em volta do ralo (não acontece na vida real, e nada se mexe nos
    3 primeiros segundos); persona calma ao lado do perigo; ralo em cima de uma bancada, não no chão de uma casa;
    o líquido do hook (branco, derramado, com espuma) não é a receita (transparente, borrifada); e o efeito mostrado
    contradiz a promessa (os bichos andam para a mistura que deveria afastá-los).
  - **O que segurou o vídeo:** praga perigosa em quantidade no quadro zero, gancho de mito quebrado ("veneno comum
    não mata"), maquete em corte mostrando o bicho escondido na fresta, ritmo alto e capa do guia na tela na oferta.
  - **Regra 1, coerência:** a imagem tem de mostrar o que a fala afirma. O que o hook usa é o mesmo produto da
    receita; o efeito na tela é o efeito prometido; a cena acontece onde o problema acontece (chão da casa).
  - **Regra 2, herói e vilão:** o efeito ruim pertence ao inimigo. Se a fala diz que o veneno comum espalha os
    escorpiões, é o veneno comum que aparece espalhando; a nossa mistura aparece como barreira (o bicho chega, para
    e volta).
  - **Regra 3, empilhar dimensões:** antes de fechar o roteiro, conferir se o hook soma sintoma extremo, movimento,
    emoção da persona (olho arregalado, apontando, fala veemente), mito ou medo nomeado na fala e mecanismo visível.
    Dimensão que cabe e ficou de fora é oportunidade perdida.
  - **Cuidado:** em tema de risco à saúde (animal peçonhento), prometer prevenção (borrifar, tampar o ralo, vedar
    frestas), nunca eliminação; manter os avisos na legenda.
- **Caso da mancha: ideia forte, copy visual morna (10/11).** Reel da jaqueta manchada do colega (18/10, 34,5 s,
  45 mil curtidas, 17 mil comentários). Montagem medida: hook de 5,3 s, quatro soluções de ~5 s cada (café,
  canetinha, molho, caneta), fecho de 3 s e CTA de 7 s com "Comenta mancha".
  - **O que segurou o vídeo:** ação interrompida (alguém jogando a peça fora e a persona impedindo), a pergunta de
    perda ("Quanta roupa boa você já jogou fora por mancha?"), lista de utilidade com uma solução a cada 5 s, a mancha
    passando para o pano branco (prova visual) e CTA de uma palavra do tema.
  - **O que ficou morno:** primeiro segundo sem fala e em plano aberto; manchas só visíveis aos 3,5 s e pequenas;
    persona sem emoção; nenhum inimigo ou medo oculto; resultado final mostrado de longe; no take da caneta a fala
    (colher quente) diverge da legenda do post (álcool) e o rabisco não some na tela.
  - **Lista de conferência tirada do caso**, para todo Reel de lista:
    1. Sintoma em close no quadro zero, com a fala no segundo zero.
    2. O valor da perda dito na fala (preço da peça, tempo, dinheiro).
    3. Emoção da persona empilhada: olho arregalado, apontando, fala veemente.
    4. Um inimigo ou mito que explique o erro de quem assiste. Conferir a dica antes de afirmar.
    5. Curiosidade encadeada: anunciar no início que o último item surpreende.
    6. O melhor momento visual (a mancha saindo no pano, em macro) vai para o hook de 3 s.
    7. Fecho com antes e depois do mesmo ponto, em close.
    8. Cada efeito prometido acontece na tela, e a dica falada é a mesma da legenda.
    9. CTA com promessa: "Comenta [palavra] que eu te mando".
- **Ação junto com a fala:** ela faz a ação enquanto fala, desde o 1º segundo; nunca "faz e depois fala".
- **Orçamento de mãos:** mão que segura algo está ocupada; nunca "both hands" se uma está ocupada.
- **Voz no prompt:** "a low, warm, relaxed voice of a 55-year-old Brazilian woman from the countryside of São Paulo, slow and
  affectionate. Speech clean, no background music, no sound effects."
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
- **Voz do Qwen3-TTS:** soou artificial. A voz oficial é a amostra 4 do próprio Vids.
