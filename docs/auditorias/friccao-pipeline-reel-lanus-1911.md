# Fricção do pipeline: prova de 20 s do reel de Lanús (19/11/2026)

O Eduardo pediu uma prova de 20 s do reel da explosão de gás em Lanús e deu 10 minutos. Aos 15 minutos ainda não havia vídeo. Este doc registra onde o tempo foi, o que já foi corrigido e o que falta para produzir rápido.

**Foco a partir daqui (Eduardo, 19/11):** produzir de forma inteligente, eficaz, rápida, prática e objetiva.

## 1. Onde o tempo foi

| # | O que aconteceu | Tempo | Causa |
|---|---|---|---|
| 1 | O maestro mandou fazer folha de stills + revisor Opus antes do render | previsão de ~1 h | Portão de batedor aplicado a uma prova que já era o batedor |
| 2 | O construtor escreveu a cena inteira à mão (esquina, cano, nuvem, clarão) | ~12 min | Não existe "mundo cidade" reutilizável; cada caso novo começa do zero |
| 3 | O construtor matou processos por nome e derrubou o `ligar` de outra sessão (G4-1) e o da G4-2 | ~7 min | Regra "nunca matar por nome" quebrada |
| 4 | Sobrou um `colab.rodar` órfão do `ligar` morto, disputando a aba do Colab com o `ligar` novo | junto com o 3 | O `ligar` não matava o filho ao morrer |
| 5 | O `ligar` esperou os 240 s do prazo com a VM já pronta | 4 min | `colab.rodar` não enxergava a marca `CANAL_PRONTO` na saída (ela estava no iframe) |
| 6 | A voz ficou para depois do render | prova saiu muda | Voz e render disputam a mesma G4 |

O que **não** foi problema: o ambiente da G4 subiu em 40 s (apt 13 s, node 24 s, Chrome 3 s), mesmo sem a imagem `.sqfs`, e o render de 20 s leva cerca de 1 minuto.

## 2. O que foi corrigido no mesmo dia

1. **`colab.rodar` lê também os iframes** ao procurar a marca (`eddie3d/ferramentas/colab.py`, função `rodar`). Antes, `saida()` parava no `.output` não vazio e nunca via a marca.
2. **`canal.py ligar` confere a página a cada 20 s** depois dos primeiros 40 s e segue assim que acha a URL da VM, em vez de esperar o prazo inteiro. Ao sair, mata o próprio runner pelo PID, para nunca deixar órfão. Esta correção está na cópia de trabalho local do `canal.py`; a cópia do repositório tem outro formato nesse trecho e ainda precisa receber o mesmo ajuste.

As duas correções ainda não foram testadas numa ligada real. O teste é a próxima ligada da G4.

## 3. Regras que saem daqui

- **Prova curta não tem portão de stills.** Prova de até 30 s vai direto ao render; o próprio vídeo é o batedor. Stills + revisor só antes de render longo.
- **Agente nunca mata processo por nome nem por padrão de linha de comando.** Só o PID que ele mesmo abriu. Vale para `python`, `node`, `ffmpeg` e para `canal.py`.
- **Um `ligar` por G4, de uma sessão só.** As sessões combinam quem liga; a outra só usa a G4 já no ar.
- **Prazo dado pelo Eduardo entra no contrato do agente desde o começo**, com a ordem do que cortar primeiro (revisor, voz, acabamento).

## 4. O que falta para produzir rápido

1. **Cenário pronto por tipo de acidente.** Hoje cada caso exige escrever a cena. Duas rotas:
   - **Mundos por código:** 4 ou 5 mundos reutilizáveis (rua de cidade, estrada, aeroporto, rio, prédio); o caso novo vira um arquivo de dados.
   - **Imagem ancorada (proposta do Eduardo, 19/11):** usar a foto real do caso como âncora no Google Flow, gerar uma imagem nova a partir dela e usar essa imagem no vídeo, com HUD e movimento em Remotion. A foto original não entra no vídeo, por direito autoral.
     Esta rota depende de duas regras antigas serem revistas pelo Eduardo: "reels do FB com zero IA generativa de imagem" (08/11) e "Flow descontinuado" (10/11).
2. **Voz em paralelo ao render**, ou gerada antes de ligar a cena.
3. **Imagem `.sqfs` da stack dos reels no Drive.** Ela existe só no PC; hoje a G4 instalou tudo de novo (40 s, aceitável, mas regrava a imagem a cada ligada).

## 5. Referência medida no mesmo dia

Vídeo "Why Is Nvidia's AI Chip So Hard to Copy?" (canal Silicon Up Close, 21:40, 83 mil views em 2 dias). O Eduardo levantou a hipótese de que esse formato, quase todo em Remotion com three.js pontual, sai bem mais barato que cena 3D completa. A leitura a 24 fps foi interrompida a pedido dele antes das folhas; os quadros medidos ficaram fora do repositório.

## 6. Lição do documentário de 12 min (19/11, Eduardo)
- O planejador v2 (`planejar2.py`) trocou as batidas de **mapa** por imagem e o vídeo saiu **sem nenhum take de localização**. No próximo vídeo entra sempre, mesmo em proporção pequena: um take de mapa no gancho ou no 1º capítulo (país → cidade → bairro → esquina) e outro quando o lugar volta à história. É barato e sai rápido.
- Os tipos explicativos aprovados (corte do cano, nuvem com a janela de 5–15%, relógio) ficam; a imagem 2.5D do Flow não substitui a explicação.
