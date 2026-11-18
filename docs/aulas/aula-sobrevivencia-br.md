# Aula: conta de sobrevivencialismo BR (Instagram) — mapa do projeto

Escrita em 10/11/2026 para o agente Opus que vai tocar o projeto. Leia inteira antes do primeiro passo.
Complementa `docs/aulas/aula-historia-de-escolha.md` (o **visual**). Esta aula cobre **o quê, para quem, a copy falada e o funil**.

## 1. O que o Eduardo quer (em uma frase)
Uma conta nova de Instagram, de sobrevivencialismo para brasileiros, com Reels no formato "história de escolha" (stickman estilizado, peças animadas por código) e **fala muito melhor** que a da referência, terminando num gancho que leva ao infoproduto.

## 2. O funil
```
Reel (orgânico) → gancho final "comenta PALAVRA" → DM automática (Youze) → link do checkout (Kiwify) → e-book
```
- **Automação:** a DM por comentário é feita pelo Youze (sessão "AUTOMACAO YOUZE", pasta `MazyOS/automaweb`). Não é tarefa nossa; nós só entregamos o vídeo com a palavra-chave certa.
- **Produto:** o e-book **ainda não existe**; o Eduardo cria depois. No roteiro, use os marcadores `{PRODUTO}` e `{PALAVRA}`. Não invente nome, preço nem conteúdo do produto.
- **Modelo de produto observado:** guia de sobrevivência em crises, e-book de R$ 24,99, vendido por link na bio.
- **Publicação:** manual, do Eduardo.

## 3. A referência e o que já foi medido
- **Perfil:** @sobrevivencia_real (do primo do Eduardo; ~66 mil seguidores). Formato bom, fala fraca.
- **Material no disco:** `D:/producao/fb_que_pasaria_si/formatos/sobrevivencia_2d/`
  - `ref/ref1.mp4`: 1 reel baixado;
  - `medicao/ref_asr.json`: fala com tempo por palavra;
  - `medicao/regua_ref/`: régua a 24 fps;
  - `CONTRATO.md`, `entrega/RELATORIO.md`: as duas tentativas antigas (v1 reprovada, v2).
- **Medidas do reel 1:** 87 s, 13 planos, 8,3 cortes/min, plano mediano 6,5 s, **50% do tempo parado**, 4 planos acima de 8 s.

**Falta fazer:** só 1 reel foi baixado até agora. O pedido é estudar **pelo menos 3**. O `yt-dlp` não lista o perfil; é preciso o endereço de cada reel (pedir 3 links ao Eduardo ou abrir o perfil no navegador de automação, nunca no Chrome pessoal).

### Estrutura da fala do reel 1 (resumo, não copiar)
| Tempo | O que faz |
|---|---|
| 0–4 s | Abre com uma afirmação forte sobre as primeiras 72 horas |
| 4–24 s | Explica o porquê (resgate ocupado, estrada, telefone) e cita a "regra das 72 horas" |
| 24–40 s | Lista: água (com número) e comida |
| 40–51 s | **Venda no meio:** cita o guia e o link na bio, depois pede para não sair |
| 51–75 s | Lista: luz e rádio, primeiros socorros, a cabeça (técnica de parar e respirar) |
| 76–87 s | Pergunta ao espectador e pede para salvar e mandar à família |

### Por que a fala é fraca (diagnóstico)
1. **É uma lista, não uma história.** Ninguém vive nada; não há cena, pessoa nem decisão.
2. **Gancho genérico.** "Um desastre" não é nenhum desastre. Falta lugar, hora e consequência.
3. **A venda interrompe.** O pedido de compra aparece aos 40 s, antes do melhor conteúdo, e o vídeo precisa implorar para a pessoa ficar.
4. **Sem laço aberto de verdade.** O "item 5" é prometido, mas a entrega é um conselho comum.
5. **Nada de Brasil.** Sem enchente, apagão, deslizamento, preço em reais, Defesa Civil daqui.
6. **Final fraco para o funil.** "Salva e manda" gera alcance, mas não puxa ninguém para o produto.
7. **Imagem parada metade do tempo**, com planos de até 17 s.

Este diagnóstico vem de 1 reel. Confirme ou corrija com os outros 2.

## 4. A copy falada: o que melhorar
O Eduardo foi claro: **não é copy de página de vendas**. É a fala do vídeo que tem de prender. A venda fica só no fim.

### 4.1 Consulta obrigatória ao Copy Master
- **Feito em 10/11:** a base dele (`C:\Users\edlut\copymaster\conhecimento\`, arquivos 02, 03 e 04) foi lida e resumida em `guia-reel-01-sobrevivencia-br.md`, seção 1. Vale aquela tabela; a de 4.2 abaixo ficou como rascunho antigo.
- **Sessão:** "COPY Master" (pasta `C:\Users\edlut\copymaster`), para dúvidas novas.
- **O que pedir:** os princípios de Jon Benson e Stefan Georgi que servem a um vídeo curto falado, e como aplicar ao nosso caso. Mande junto a tabela e o diagnóstico da seção 3.
- **Formato da resposta:** peça um arquivo `.md` com no máximo 60 linhas, salvo no D:, e resposta curta por mensagem.
- **Cruzamento:** o molde final junta três fontes: Copy Master, o reel "história de escolha" (aula do visual) e os 3 reels da referência.

### 4.2 Ponto de partida (meu, a confirmar com o Copy Master)
| Princípio | De quem | Como entra no Reel |
|---|---|---|
| Quebra de padrão nos 3 primeiros segundos | Benson | Abrir no meio da cena, em segunda pessoa: lugar, hora, problema |
| Conexão antes da solução | Benson | A pessoa se reconhece: a casa, a família, o bairro |
| Problema grande, depois solução | Benson | Primeiro o que dá errado, depois o hack |
| Mecanismo único | Georgi | Todo hack vem com o **porquê** funciona; não é dica solta |
| Pesquisa antes da escrita | Georgi | Fatos e números de fonte brasileira, anotados |
| Uma ideia por vídeo | Georgi | Um cenário, uma decisão, um hack principal |
| Ver o futuro | Benson | Uma frase mostrando a família preparada |

### 4.3 Molde do roteiro (rascunho, 60–90 s)
1. **0–3 s, cena:** "São 2 da manhã. A água já está no seu tornozelo." Segunda pessoa, lugar brasileiro.
2. **3–12 s, aposta:** o que está em jogo e o relógio começa a contar.
3. **12–45 s, decisões:** 2 ou 3 escolhas. Em cada uma: o erro comum, o que acontece, o jeito certo e **por que funciona**. Um número a cada ~8 s.
4. **45–65 s, virada:** o hack menos óbvio (o "take eureka"), com o mecanismo mostrado.
5. **65–80 s, escolha final:** duas opções, a pessoa responde nos comentários.
6. **Últimos 5–8 s, gancho do produto:** "Isso é 1 dos {N} cenários do {PRODUTO}. Comenta {PALAVRA} que eu te mando." Uma frase, sem pressão falsa.

### 4.4 Regras da fala
- Frase curta, falada, português do Brasil do dia a dia. Nada de tom de palestra.
- Toda frase vira imagem: se não dá para animar, reescreva.
- Venda **só no fim**. Nada de "link na bio" no meio.
- Sem escassez inventada, sem medo exagerado, sem promessa de "salvar sua vida".
- Sem política.

## 5. Adaptação ao Brasil
- **Cenários:** enchente e alagamento, deslizamento, apagão longo, falta de água, onda de calor, vendaval, incêndio em casa, carro ilhado, trilha, picada de cobra, afogamento em rio e mar.
- **Detalhes:** bairro, laje, botijão de gás, caixa d'água, celular com pouca bateria, Pix sem sinal, 193 e 199, alerta da Defesa Civil por SMS.
- **Fontes:** Defesa Civil, Corpo de Bombeiros, Cemaden, Ministério da Saúde, Cruz Vermelha. Cada fato anotado em `fuentes.md` do vídeo.
- **Segurança:** dica errada machuca. Hack sem fonte confiável não entra.

## 6. O visual
É o da aula `aula-historia-de-escolha.md`: imagens em camadas, movimento por código, placar, cartões de dado e legenda karaokê. Não é imagem→vídeo.
- **Personagem próprio:** boneco nosso, outra cara, outra roupa, outra paleta. Não redesenhar o da referência.
- **Placar adaptado:** em vez de dinheiro e polícia, algo como TEMPO, ÁGUA e RISCO.
- **Metas (da aula):** ≥ 14 cortes/min, plano mediano ~3 s, nenhum take repetido, som sempre presente.

## 7. Ordem de trabalho
1. Ler `docs/LEIA-PRIMEIRO.md` e as duas aulas.
2. Conseguir 3 reels da referência; transcrever e medir (Haiku, por script).
3. Consultar o Copy Master com o diagnóstico.
4. Fechar o **molde de roteiro** e escrever o roteiro do vídeo 1 (Opus). Mostrar ao Eduardo.
5. Levantamento de prontos e **batedor de 3 planos** na G4 (seção L9 da aula do visual).
6. Só depois do batedor aprovado: `video.json` (Sonnet) e produção por script na G4.
7. Portões: régua a 24 fps, fiscal na G4, ffprobe, folha ao Eduardo.

## 8. O que não fazer
- Copiar roteiro, personagem ou frases do primo. A v1 antiga foi reprovada por seguir a referência.
- Vender no meio do vídeo.
- Produzir antes do batedor.
- Montar a stack no PC, salvar no C:, ou instalar do zero na G4 (imagem `.sqfs` do Drive).
- Colocar no repositório dados pessoais, links de checkout, chaves ou identificadores de conta.

## 9. Em aberto
| Item | Quem resolve |
|---|---|
| 3 links de reels da referência | Eduardo ou navegador de automação |
| Resposta do Copy Master | Agente (sessão "COPY Master") |
| Nome da conta, produto e palavra | Definidos em 10/11: ver `guia-reel-01-sobrevivencia-br.md`, seção 2.1 |
| Camadas: Qwen-Image-Layered ou BiRefNet | Batedor na G4 |
| Tema do vídeo 1 | Opus propõe 3, Eduardo escolhe |
