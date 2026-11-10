# Miniaturas do Kriegsmomente (padrão novo, "mecanismo único")

Aprovado pelo Eduardo (novembro/2026). Referência de estilo: Mrs. Whitmore's Housekeeping. Vale para todo vídeo do canal; o primeiro a usar é o K21.

## Padrão
- 1280x720, JPG, menos de 2 MB. Três por vídeo, uma por título (arquivo casado: `tituloN_thumbN.jpg`).
- 2 miniaturas com ROSTO + 1 de CONTROLE (objeto + seta + texto, sem rosto).
- Rosto: soldado prussiano FICTÍCIO de 1870/71, fotorrealista, capote cinza-azulado, Pickelhaube ou quepe, no frio/neve, com susto expressivo e olhando para o objeto. Palavras do prompt: "startled, alarmed, gasping, wide eyes, hand to mouth" (nunca "terror" nem "fear"). Sem bandeira, insígnia, brasão ou texto na imagem gerada. Pedir o rosto num terço lateral, com fundo simples e desfocado, para compor.
- Objeto: um só mecanismo, tirado de um still do próprio vídeo (`v1/teste/<família>/`) e escolhido pela batida (ex.: B007 túnel, B049 locomotiva, B087 Erbswurst). Fica do lado oposto ao rosto, com SETA VERMELHA grossa (desenhada, contorno branco) apontando o detalhe.
- Texto de 2 a 3 palavras no TOPO, fonte Anton, amarelo #F2C14E ou branco, contorno e sombra pretos, acento vermelho (#D92828). Sem faixa creme e sem Impact. Nada do texto sobre o rosto (o texto do rosto-thumb fica na região do objeto).
- Rótulos e números laranja da tinta do vídeo que brigam com o título são apagados (inpaint, `tirar_laranja`).

## Rota Gemini (rostos)
1. Perfil de automação do Dolphin (nunca o Chrome pessoal; não deslogar nada). A porta CDP muda a cada abertura: ver `remote-debugging`/`down-port` nos processos `anty.exe` e testar `http://127.0.0.1:<porta>/json` (a porta de automação é a ligada ao `down-port`+2). Abrir/reiniciar perfil: `tracer3d2/dolphin_iniciar.py <id>` (pede o token da API do Dolphin, digitado só pelo Eduardo).
2. Reservar o recurso `navegador` no `tracer3d2/porteiro.py` com dono `k21` (em Python, `porteiro.reservar("navegador","k21",3600,pid=0)`, porque pela linha de comando a reserva morre com o processo) e liberar ao final.
3. `python D:/tmp/gemini_img.py <porta CDP> <prompt.txt> <saida.png>` grava `saida_0.png` (espera até 800 s). Se aparecer CAPTCHA/login, parar e avisar.
4. Prompts do K21: `D:/tmp/k21_thumbs/p1.txt` (Pickelhaube, jovem) e `p2.txt` (quepe, 40 anos), ambos com o soldado no terço direito, olhando para a esquerda.

## Script
`D:/kriegschronik/k21_inverno/miniaturas_v2.py` (funções `still`, `tirar_laranja`, `rosto`, `topo_escuro`, `texto_topo`, `seta`, `t1/t2/t3`). Modelos: `tracer3d/miniaturas/miniaturas_guerra.py` (Anton, cores) e `03_adamuz/dados/miniaturas/montar.py` (rosto, inset). Versões antigas (padrão creme/Impact): `entrega/_miniaturas_v1/`.
Uso: `python miniaturas_v2.py [1 2 3]`; os rostos esperados são `D:/tmp/k21_thumbs/rosto1_0.png` e `rosto2_0.png`.

## K21 (Preußens Winter vor Paris)
| Título | Arquivo | Conteúdo | Texto |
|---|---|---|---|
| T1 túnel / única ferrovia | `titulo1_thumb1.jpg` | rosto + túnel desabado com trem parado (B007) | NUR EINE BAHN? |
| T2 280 locomotivas | `titulo2_thumb2.jpg` | rosto + locomotiva (B049) | 280 LOKOMOTIVEN |
| T3 Erbswurst | `titulo3_thumb3.jpg` | CONTROLE: Erbswurst (B087) + seta | DIE ERBSWURST? |

## Resultado do teste A/B anterior
Rosto venceu 2/2; a simulação (3D sem rosto) ficou em último. Por isso o padrão novo tem 2 rostos e só 1 controle sem rosto.

## Estado (10/11/2026)
Só a T3 (controle) foi gerada. O perfil de automação 903382646 (porta 63452) fechou durante o trabalho e o perfil 869356248 (porta 65196, em uso com Colab) não aceitou a conexão do Playwright (timeout). Sem rostos, T1 e T2 ainda são as antigas.
