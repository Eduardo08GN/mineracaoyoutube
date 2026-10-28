# -*- coding: utf-8 -*-
r"""O PIPELINE DE PRODUCAO DOS REELS (aba Instagram) como ele roda hoje, para o painel mostrar e para quem for
produzir o proximo Reel seguir. Cada etapa: o que faz, onde roda, e as REGRAS do Eduardo que valem.

    python motor/pipeline_instagram.py          imprime o pipeline

⭐ Este arquivo e' a fonte da verdade das regras de producao dos Reels: regra nova do Eduardo entra AQUI (e no codigo
   que a aplica), com a data. A aba Instagram le daqui (GET /api/instagram/pipeline).
"""

ATUALIZADO = "27/10/2026"

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
         "⭐ (27/10) Encurtar: os takes de CTA do fim da fonte saem do roteiro (antes viravam uma fala de fechamento "
         "da Tomiko); o nosso take de CTA os substitui.",
         "⭐ (20/10) CTA fixo da Tomiko. Não diz DM, nem \"de graça\" (o livro é pago).",
         "⭐ (26/10) O CTA pede para seguir, para podermos mandar o material.",
         "⭐ (27/10) Promessa concreta e palavra única no CTA falado, e bem claro que sem seguir ela não consegue "
         "mandar: \"Me segue, senão eu não consigo te mandar as cento e cinquenta receitas. Comenta receitas aqui.\" "
         "(Fray: \"Sígueme, si no, no puedo enviarte el cuaderno del convento. Escribe huerta aquí abajo.\"). Sem CTA "
         "falado no meio do vídeo (o Eduardo vetou).",
         "⭐ (27/10) Legenda do post com o CTA na 1ª linha (as outras somem no \"mais\" do app).",
         "⭐ (27/10) A frase do CTA é um modelo com a palavra do Reel: \"…Comenta eu quero aqui.\" ou \"…Comenta receitas "
         "aqui.\", sempre com o \"senão eu não consigo te mandar\".",
         "⭐⭐ (27/10) Tomiko: ingrediente caro ou difícil de achar no Brasil vira o equivalente comum daqui, com a mesma "
         "função na receita (blueberries e cranberries viram uva-passa), igual na fala e na imagem.",
         "⭐ (20/10) O Claude lê os quadros da fonte antes de descrever os objetos: copo é copo, nada de celular inventado.",
         "⭐ (26/10) A ação da fonte acontece no take: se a fonte (ou a fala) bate, polvilha, despeja ou mexe, a Tomiko "
         "faz isso de verdade, com o utensílio e o ingrediente já na mão desde o quadro inicial. Nunca só segurar a "
         "tigela e falar. O Claude vê a sequência de cada take da fonte (início, três quadros do meio e fim), e a "
         "ferramenta devolve ao Claude o take com ação em que ela termina igual começou.",
         "⭐ (26/10) Fray Tomás (espanhol da Espanha): planta que só existe no Brasil vira a equivalente comum na "
         "Espanha e nos países hispânicos, com a mesma dica de cuidado, igual na fala e na imagem. Ele narra em "
         "primeira pessoa o que as mãos dele fazem.",
     ]},
    {"id": "quadros", "nome": "Quadros", "onde": "agente/instagram.py (_quadro_take, _quadro_fim_take) · Flow (imagem)",
     "faz": "Para cada take, o quadro de abertura (com a 2ª passada que reenquadra pela fonte) e o quadro final do "
            "passo, com a Tomiko no lugar da pessoa da fonte.",
     "regras": [
         "⭐ (23/10) A Tomiko aparece SEMPRE, mesmo quando a fonte só mostra mãos ou comida.",
         "⭐⭐ (27/10) Nada de Tomiko engessada: ela ocupa o lugar da pessoa da fonte, com a mesma pose, posição e "
         "distância (inclinada perto da câmera, curvada no forno, de lado). No close de mãos o rosto entra pela borda, "
         "sem a câmera recuar. Da foto dela vai só o recorte do rosto (rosto.png), para quem ela é; o retrato inteiro "
         "dava a mesma pose e o mesmo fundo a todos os quadros.",
         "⭐⭐ (27/10) O rosto dela fica sempre INTEIRO e visível no quadro (de frente ou três quartos; nunca de costas, "
         "cortado na borda ou atrás da tigela): sem o rosto no quadro o Veo inventava outra senhora. O recorte do rosto vai "
         "também no reenquadramento (nos closes o rosto saía mais velho e mais cheio). Quadro sem rosto detectado: fica a "
         "1ª passada ou sai uma passada a mais com o rosto à mostra.",
         "⭐⭐ (28/10) A mesma Tomiko em todos os takes: a referência do rosto é um painel com 10 vistas (rostos.png, da "
         "ficha de personagem) e todo quadro depois do take 1 leva o quadro do take 1 como âncora (a mesma mulher numa "
         "cena anterior). Com um recorte só, cada take saía uma pessoa diferente.",
         "⭐⭐ (27/10) O texto do quadro manda no que a comida e os itens são (o bolo com uva-passa, não o blueberry da "
         "imagem da fonte); da fonte vêm o lugar, o ângulo e onde as coisas estão. Óculos, joias e acessórios da pessoa "
         "da fonte nunca passam para a Tomiko.",
         "⭐ (26/10) Avatar em PRIMEIRA PESSOA (ficha com \"pov\", o Fray Tomás): a câmera são os olhos dele; só as "
         "mãos e os antebraços (as mangas do hábito) aparecem, nunca o rosto. No CTA a mão mostra a colheita para a "
         "câmera.",
         "⭐ (22/10) Ângulo e enquadramento da fonte: a 2ª passada reenquadra pela fonte (close continua close).",
         "⭐ (27/10) Só no take do CTA o quarto de cima do quadro fica só com fundo (o cartaz completo). Nos outros "
         "takes vale o enquadramento da fonte: forçar o mesmo plano em todo take fazia a troca de lugar parecer mágica.",
         "⭐⭐ (27/10) Ancoragem: sem câmera andando, o quadro final tem o MESMO enquadramento do inicial e muda só o "
         "resultado da ação (o fim da fonte só mostra o resultado). Câmera andando só quando o take tem um quadro final "
         "próprio; com a mesma imagem nas pontas, câmera travada. O ambiente do Reel nunca apaga o que o passo usa (o "
         "forno).",
         "⭐ (22/10) Ambiente por Reel (cozinha, varanda, quintal) ou o da fonte, refeito no mundo do avatar. ⭐ (27/10) "
         "O ambiente é só o estilo: o lugar de cada take (bancada, forno, tábua) vem da fonte, com a perspectiva dela.",
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
         "⭐ (26/10) Avatar em primeira pessoa: a voz narra em off (ninguém fala para a câmera) e as mãos seguem "
         "trabalhando depois da fala.",
         "⭐⭐ (27/10) Fusão (uma coisa virando outra, passe de mágica): a leitura óptica a 10 fps acha a mistura de "
         "quadros no take; o take com fusão é gerado de novo sozinho e fica a melhor versão. Zoom de edição da fonte "
         "(mais de 40%) não vira movimento de câmera.",
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
         "⭐ (27/10) Zona segura do Instagram: nada importante nos ~14% de cima nem nos ~35% de baixo. A legenda subiu "
         "para 70% da altura (era 85%); a faixa e o cartaz ficam no topo (5%), acima do rosto (o Eduardo preferiu o rosto livre).",
         "(19/10) Velocidade 1,11× com ±5% de variação por take.",
         "⭐ (22/10) O corte não pega uma fusão que o Veo faça depois da fala.",
         "⭐ (23/10) Livro na mão no take final quando pedido (capa no avatar, Reel com livro).",
         "⭐ (26/10) Cartaz do CTA em todos os avatares: \"ME SIGA E COMENTE!\" (no idioma do Reel), a palavra grande "
         "em amarelo e três setas vermelhas.",
         "⭐ (27/10) Faixa persistente do 2º segundo até o cartaz: \"💬 COMENTA RECEITAS / TE MANDO AS 150 RECEITAS\", "
         "pílula escura que desce e aparece, colada no topo (5% da altura), acima do rosto. O gancho fica limpo.",
         "⭐ (27/10) O cartaz entra no take de fechamento (o penúltimo): quem aparece de rosto vê só a palavra e as setas "
         "nesse take; o cartaz completo vem no take do CTA, com \"OU PEGA NO LINK NA BIO 👆\" embaixo das setas. As "
         "setas quicam.",
         "⭐ (26/10) No take do CTA a legenda sai menor (60%, 27/10: menos poluído com a capa e o cartaz); em quem aparece de rosto ela sobe para logo acima do livro (57% da altura), para não cobrir o título da capa.",
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
