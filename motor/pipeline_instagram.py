# -*- coding: utf-8 -*-
r"""O PIPELINE DE PRODUCAO DOS REELS (aba Instagram) como ele roda hoje, para o painel mostrar e para quem for
produzir o proximo Reel seguir. Cada etapa: o que faz, onde roda, e as REGRAS do Eduardo que valem.

    python motor/pipeline_instagram.py          imprime o pipeline

⭐ Este arquivo e' a fonte da verdade das regras de producao dos Reels: regra nova do Eduardo entra AQUI (e no codigo
   que a aplica), com a data. A aba Instagram le daqui (GET /api/instagram/pipeline).
"""

ATUALIZADO = "26/10/2026"

ETAPAS = [
    {"id": "fonte", "nome": "Fonte", "onde": "agente/instagram.py (_etapa_fonte) · motor/instagram_qa.py",
     "faz": "Baixa o Reel de origem, transcreve com tempo por palavra e corta em takes de até 8 s. A leitura óptica mede a "
            "câmera de cada trecho.",
     "regras": [
         "⭐ (22/10) Leitura óptica a 10 fps: zoom, pan, tilt e balanço da mão de cada trecho, ignorando os cortes de cena. "
         "Trecho picado (2 ou mais cortes) fica com a câmera travada.",
     ]},
    {"id": "roteiro", "nome": "Roteiro", "onde": "motor/instagram_roteiro.py (regras_take, pedido_adaptacao)",
     "faz": "O Claude adapta cada take para o português do Brasil na boca do avatar, lendo os quadros da fonte, e "
            "escreve o quadro, o quadro final e o movimento de cada take.",
     "regras": [
         "⭐ (23/10) Cada take é uma ou mais frases COMPLETAS, terminadas em ponto, exclamação ou interrogação. Nunca "
         "partir uma frase entre takes (\"as bactérias boas\" | \"do intestino\" muda a entonação e atrapalha a "
         "compreensão): quando a fonte corta no meio, as palavras passam para o take vizinho. Sem repetir a mesma "
         "palavra em takes vizinhos (batendo, batendo). A ferramenta confere e devolve ao Claude.",
         "⭐ (20/10) A fala é a da fonte, frase a frase e na mesma ordem: só muda o jeito de dizer (português popular, "
         "unidades do Brasil: 400 °F = duzentos graus). Nada inventado, nada suavizado.",
         "(19/10) Português popular, nunca tradução literal (\"arroz de molho\", não \"arroz demolhado\").",
         "(19/10) Nunca cortar ingrediente nem quantidade (\"uma colher de alho em pó\").",
         "⭐ (20/10) Leve adaptação só no fechamento: o CTA da fonte vira uma fala curta da Tomiko (tradição, carinho), "
         "sem pedir nada; depois vem o take do CTA.",
         "⭐ (20/10) CTA fixo da Tomiko: \"Escreva eu quero, aqui embaixo e te mando o guia completo.\" Não diz DM, "
         "nem \"de graça\" (o livro é pago).",
         "⭐ (20/10) O Claude lê os quadros da fonte antes de descrever os objetos: copo é copo, nada de celular inventado.",
         "⭐ (26/10) A ação da fonte acontece no take: se a fonte (ou a fala) bate, polvilha, despeja ou mexe, a Tomiko "
         "faz isso de verdade, com o utensílio e o ingrediente já na mão desde o quadro inicial. Nunca só segurar a "
         "tigela e falar. O Claude vê a sequência de cada take da fonte (início, três quadros do meio e fim), e a "
         "ferramenta devolve ao Claude o take com ação em que ela termina igual começou.",
     ]},
    {"id": "quadros", "nome": "Quadros", "onde": "agente/instagram.py (_quadro_take, _quadro_fim_take) · Flow (imagem)",
     "faz": "Para cada take, o quadro de abertura (com a 2ª passada que reenquadra pela fonte) e o quadro final do "
            "passo, com a Tomiko no lugar da pessoa da fonte.",
     "regras": [
         "⭐ (23/10) A Tomiko aparece SEMPRE: rosto e ombros em todo take, mesmo quando a fonte só mostra mãos ou comida.",
         "⭐ (22/10) Ângulo e enquadramento da fonte: a 2ª passada reenquadra pela fonte (close continua close).",
         "⭐ (22/10) Ambiente por Reel (cozinha, varanda, quintal) ou o da fonte, refeito no mundo do avatar.",
         "(20/10) Orientação dos itens e da faca igual à fonte. ⭐ (23/10) Nada flutua: travessa apoiada na mesa.",
         "(19/10) Ação completa: o quadro final é o fim do passo da fonte. ⭐ (22/10) Tirado antes do corte de cena; só "
         "movimento forte de câmera força o enquadramento final.",
     ]},
    {"id": "gerar", "nome": "Geração", "onde": "motor/instagram_gerador.py · Flow (Veo)",
     "faz": "O Veo gera cada take indo do quadro de abertura ao final, com a fala, o movimento e a câmera.",
     "regras": [
         "Modelo grátis Veo 3.1 Lite. Créditos só com autorização do Eduardo.",
         "⭐ (20/10) O primeiro segundo é silêncio: o Veo não come a primeira palavra.",
         "⭐ (20/10) Objetos não trocam, não aparecem e não somem.",
         "⭐ (22/10) Câmera da fonte (\"fonte\") ou travada (\"fixa\"), escolhida no Reel.",
     ]},
    {"id": "curadoria", "nome": "Curadoria", "onde": "editor de curadoria (painel) · agente/instagram.py",
     "faz": "O Eduardo aponta o defeito do take; o Claude corrige e o Veo refaz.",
     "regras": [
         "⭐ (20/10) Refazer take = 4 versões; o Eduardo escolhe (o QA só sugere).",
     ]},
    {"id": "montagem", "nome": "Montagem", "onde": "motor/instagram_midia.py",
     "faz": "Apara cada take, monta 1080×1920 a -14 LUFS e queima a legenda.",
     "regras": [
         "(18/10) Legenda estilo 2, na posição mais baixa do Reel.",
         "⭐ (26/10) Legenda um pouco mais baixa: a base do cartão em 85% da altura (era 82%).",
         "(19/10) Velocidade 1,11× com ±5% de variação por take.",
         "⭐ (22/10) O corte não pega uma fusão que o Veo faça depois da fala.",
         "⭐ (23/10) Livro na mão no take final quando pedido (capa no avatar, Reel com livro).",
     ]},
]


def pipeline():
    return {"atualizado": ATUALIZADO, "etapas": ETAPAS}


if __name__ == "__main__":
    import sys
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    for i, e in enumerate(ETAPAS, 1):
        print(f"{i}. {e['nome']} — {e['onde']}\n   {e['faz']}")
        for r in e["regras"]: print("   ·", r)
