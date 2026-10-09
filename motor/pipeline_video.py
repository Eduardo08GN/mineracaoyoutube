# -*- coding: utf-8 -*-
r"""O PIPELINE DE PRODUCAO DE VIDEO como ele roda hoje (09/10/2026), para a aba Producao mostrar e para quem
for produzir o proximo video seguir. Cada etapa: o que faz, o script que roda, e as REGRAS que valem (do
Eduardo e da leitura otica lado a lado com o Elias, docs/divergencias-edicao-fatia01.md).

    python motor/pipeline_video.py          imprime o pipeline

⭐ Este arquivo e' a fonte da verdade das regras de producao: regra nova do Eduardo entra AQUI (e no script que a
   aplica), com a data. A aba Producao le daqui (GET /api/videos/pipeline).
"""

ATUALIZADO = "09/10/2026"

ETAPAS = [
    {"id": "fonte", "nome": "Fonte", "onde": "painel (agente/estudio.py · motor/fonte.py)",
     "faz": "Lê o viral antigo (legenda ou áudio + Whisper) e o Claude tira o mecanismo: os itens, a promessa e o que o monge pode acrescentar.",
     "regras": []},
    {"id": "roteiro", "nome": "Roteiro", "onde": "painel (motor/roteiro.py)",
     "faz": "O Claude escreve ~2.600–2.900 palavras em alemão nas 14 seções medidas nos vídeos do Elias, com o perfil do Bruder Wendelin.",
     "regras": ["O perfil (nome, livro, site) é trocado no painel e reescrito no roteiro: nunca o nome de um monge real."]},
    {"id": "planos", "nome": "Planos", "onde": "painel (motor/roteiro.py)",
     "faz": "Corta a narração em planos de ~4 s (avatar, tela dividida, b-roll) nas proporções do Elias, com a cena de cada um.",
     "regras": ["⭐ (09/10) Nenhum plano abaixo de 2,2 s, nunca (nada de time-lapse picotado em cortes de 0,8 s). Tomada média de ~4,2 s (2,2 a 5,4 s); foto parada no máximo 3,6 s.",
                "Corte no vão entre duas palavras, sem esperar a frase acabar.",
                "⭐ (09/10) Variedade de escala e de assunto, como o Elias: alternar plano geral (horta, mosteiro, paisagem), médio (alguém trabalhando), fechado (mãos, folha, terra) e, de vez em quando, foto antiga em sépia. Nunca vários closes de vaso seguidos."]},
    {"id": "avatar", "nome": "Avatar", "onde": "work/video/gerar_avatar.py (Flow, conta da Ivone)",
     "faz": "Gera as falas do monge na câmera no Flow, modo Elementos com o personagem “Bruder Wendelin”, 16:9, 8 s, x1, no modelo grátis Veo 3.1 Lite [Lower Priority]. Cada take tem um plano (corpo inteiro em pé, andando e falando, sentado, trabalhando, três-quartos, contra-plongée, close) e um de 8 cenários do mosteiro.",
     "regras": [
         "⭐ (09/10) Modelo: o pipeline usa SEMPRE o grátis Veo 3.1 Lite [Lower Priority] (0 crédito no modo Elementos). Só quando o Eduardo pedir outro modelo: Veo 3.1 Lite, 1 take (x1) de 8 s (5 créditos). O Fast não é mais usado.",
         "⭐ (09/10) Takes dinâmicos: nada de só “do peito para cima, câmera parada”. Dois takes seguidos nunca repetem plano nem cenário. Pelo menos 4 em cada 10 são de corpo inteiro (em pé, andando e falando, sentado). Na montagem, o take aberto entra com o quadro inteiro, sem o recorte de punch-in.",
         "⭐ (09/10) O take do Veo com o avatar é precioso: os 8 s inteiros entram no vídeo. Antes da fala, o monge olhando para a câmera abre o plano dele. A fala é o plano do avatar, de perto. Depois da fala, o monge ouvindo vira o 1º plano da narração seguinte, em plano aberto. Só fica de fora uma frase errada que o Veo emende.",
         "Créditos só com autorização do Eduardo. No grátis, qualquer queda de saldo para tudo.",
         "Antes do Enter, conferir que a miniatura do personagem está DENTRO da caixa de comando e que o texto é o do take. O texto é digitado, não colado: colar apagou o anexo e saiu outro monge, pago.",
         "A fala não leva travessão (vira gaguejo) nem o nome do monge (recusa por “pessoa famosa”).",
         "⭐ (09/10) O avatar volta a cada 15–25 s no vídeo inteiro (tela cheia ou tela dividida), como o Elias. Nunca some por mais de ~25 s nas seções narradas. Fala avulsa curta (até ~15 palavras), com gesto variado.",
         "⭐ (09/10) Tela dividida vale, desde que bem enquadrada: o monge numa faixa de ~1/4 com o rosto inteiro e centrado (nada cortado), o b-roll nos ~3/4.",
         "Cada take passa pelo Whisper antes da montagem: fala errada, refaz ou usa só a parte certa.",
     ]},
    {"id": "voz", "nome": "Voz", "onde": "work/video/voz_wendelin.py · voz_conrad.py",
     "faz": "A narração sai da voz Conrad (edge-tts, grátis) com cache por frase. A voz de cada take do Veo é levada para o mesmo timbre (OpenVoice v2, tau 0,3): quem narra e quem fala na câmera soam como uma pessoa só.",
     "regras": ["⭐ (09/10) O ritmo de fala é o NOSSO (Conrad a -10%, ~130 palavras/min): não acelerar para os 157 do Elias.",
                "Quando a API do MiniMax tiver saldo, a voz clonada BruderWendelin01 substitui a Conrad (narração e takes)."]},
    {"id": "broll", "nome": "B-roll", "onde": "work/video/broll_terceiros.py · revisar_texto.py · revisar_olho.py",
     "faz": "Busca vídeos de terceiros por erva/assunto, recorta trechos com ação (portão de ação), passa o OCR reforçado e a revisão no olho, e gera os infográficos esquemáticos (work/video/gerar_infografos.py).",
     "regras": [
         "Trecho de até 8 s e no máximo 10% de cada vídeo de origem; sem áudio original.",
         "Sem rosto, sem texto, sem marca d'água (nem semitransparente). Se um trecho de uma fonte tem texto, a fonte INTEIRA sai.",
         "Revisão no olho de todo o banco (3 quadros por trecho): o filtro de rosto deixa passar perfil e gente agachada.",
         "⭐ (09/10) B-roll SEMPRE com ação: alguém fazendo alguma coisa (mãos regando, cortando, plantando, peneirando, colhendo, carregando). Planta parada com zoom lento NÃO entra: o portão de ação corta o trecho abaixo de 1% de ação do sujeito em vez de só avisar. Se falta trecho com ação, busca mais ou gera no Veo grátis; nunca completa com planta parada.",
         "⭐ (09/10) Infográficos: de vez em quando (1 a cada ~10 planos, ~45 s), em vez de b-roll de terceiros, entra um plano esquemático, ilustrativo e explicativo (corte do vaso com drenagem, raiz partida em quatro, rodízio de canteiros…). As imagens são geradas no Flow com os modelos de imagem grátis, no estilo de herbário antigo e sem texto, e entram com movimento lento de câmera.",
         "⭐ (09/10) Nunca a mesma imagem duas vezes no vídeo: nem o mesmo trecho, nem outra parte do mesmo trecho, nem a mesma cena de outro ângulo da mesma fonte em seguida. Banco acabou → busca mais fontes, infográfico ou Veo grátis; repetir não é opção.",
         "Conferir a espécie antes de etiquetar (alecrim não é tomilho). Buscar em alemão e em inglês.",
     ]},
    {"id": "montagem", "nome": "Montagem", "onde": "work/video/montar_completo.py · costura.py · render_mg.py",
     "faz": "Junta narração contínua, b-roll casado com a erva de cada frase, avatar, 3 blocos de motion graphics (o hack, “Das Warum”, o resumo das 12 ervas) e o CTA do livro, no visual vintage, com a costura de montador.",
     "regras": [
         "Corte seco só dentro do mesmo assunto (corte na ação). Fusão de 0,4 s quando a erva ou o assunto muda.",
         "Avatar ↔ narração: fusão curta; a voz entra inteira (J/L-cut, o som cruza só no silêncio).",
         "Entrada/saída dos motion graphics e do CTA: mergulho no creme do papel. Troca de seção: clarão de película âmbar.",
         "Recortes de motion graphics sempre de imagem real do tema, escolhidos no olho.",
         "⭐ (09/10) Recorte SEM contorno: nada da borda branca e dourada de “adesivo”, só o recorte limpo com sombra suave.",
         "⭐ (09/10) Movimento suave: os elementos flutuam devagar (ondas de 5–9 s, até 2 px), sem a tremida de stop-motion.",
         "⭐ (09/10) Sem pássaros/gaivotas de traço nos motion graphics: só desenho que explica o assunto.",
         "⭐ (09/10) Imagem natural e apagada, na linha do Elias (cara de câmera comum, cores contidas, pretos levantados, grão leve). Nada polido nem com cara de catálogo: claridade e saturação abaixo do original.",
         "O CTA do livro em planos curtos de ≤4,5 s com enquadramentos diferentes (como está).",
         "Leitura ótica a 1 fps do vídeo inteiro antes de entregar; áudio em −16 LUFS; teto de 16 Mbps na entrega.",
     ]},
    {"id": "miniatura", "nome": "Miniatura", "onde": "(ainda manual)",
     "faz": "A miniatura a partir do texto e do objeto que o roteiro propõe.", "regras": []},
]


def pipeline():
    return {"atualizado": ATUALIZADO, "etapas": ETAPAS}


if __name__ == "__main__":
    import sys
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    for i, e in enumerate(ETAPAS, 1):
        print(f"{i}. {e['nome']} — {e['onde']}\n   {e['faz']}")
        for r in e["regras"]: print("   ·", r)
