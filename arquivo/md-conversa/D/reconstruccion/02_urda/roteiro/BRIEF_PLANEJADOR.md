# Brief do planejador de batidas — vídeo 2 do canal "Segundo a Segundo" (Urda, 28/10/2026)

Você transforma a narração em **batidas visuais** escritas por um gerador Python (como no vídeo 1). Projeto: `D:\reconstruccion\02_urda`. Prazo curto: o vídeo sai em 31/10.

## Leia (só isto)
- `roteiro/skript_de.json` (texto de cada capítulo) e `roteiro/fakten.md` (fatos; use **só** números e rótulos que estão lá, com as escolhas "para o áudio").
- `v1/src/kit/maquete/API.md` (família maquete: `Maquete`, objetos, anotações, editorial `Dokument`/`Verlauf`/`Uhr`/`Zitat2`/`KarteWeiss`) — inclusive a seção nova **"Trens e via (Urda)"** (`TremAV`, `Via`, descarrilamento, `PostoControle`).
- **Modelo de gerador validado:** `D:\reconstruccion\01_tenerife\roteiro\gerar_batidas_A.py` (classe `Cap`, `add(indice_da_palavra, dono, bild, cena)`, âncoras `a(indice)` sempre derivadas do texto, nunca à mão; helpers `maq`, `estudio`, `uhr`, `cam`). Copie a estrutura; troque a geografia (Pista/747) por via/trens.
- Dados: `v1/public/geo/rota_madrid_urda.json` (rota real Atocha → PK 118,8, [[lon,lat]], 119 km, OSM ODbL) e `v1/public/geo/urda_real_hoehe_rg.png` + `urda_real_info.json` (relevo Copernicus para `KarteWeiss.relevo`; bbox no info). Ponto do choque: 39,4272 N, −3,8183 W. Madrid-Atocha: 40,4065 N, −3,6895 W.

## Saída
`roteiro/gerar_batidas_<LETRA>.py` (o seu gerador) → `roteiro/batidas_<cap>.json` (um por capítulo, formato `{"kapitel": {"<cap>": [{"wort","nr","dono","bild","cena"}]}}`). Depois `python ferramentas/plano.py` tem de rodar **sem ERROS**. Use o alinhamento real `voz/alinhamento.json` se existir, senão o provisório (`python ferramentas/alinhamento_provisorio.py`).

## Linguagem visual do canal (maquete branca)
- Tudo branco/cinza fosco; **azul `#2f6bff` = Iryo (o trem parado, vítima)**, **vermelho = AVE (o que bate)** — só nesses objetos-chave; LZB "vivo" em azul, LZB "caído" em vermelho no trecho.
- Manequins sem rosto; **sem nomes** de pessoas; **sem logos** de Renfe/Iryo (os nomes "AVE 2080" e "Iryo 6076" podem aparecer em rótulo).
- Relógio do evento (`uhr`) com "Miércoles 28 octubre 2026" nas batidas da linha do tempo (8:31, 8:36, 8:41, 8:48, 8:53).
- Áudios vazados: **só texto na tela** (`Zitat2` com `fonte: "Grabación publicada por la prensa"`), nunca como "voz"; o operador é "Centro de control · Atocha".
- Choque (cap. 13): respeitoso — câmera a média/longa distância, sem corpos, sem fogo (não houve), sem sangue; manequins só dentro de corte de carro se for indispensável.
- Créditos e licenças **nunca** na imagem (só na descrição). Sem marca "SIMULATION".

## Regras de qualidade
- Batidas de 1,5 a 10 s, média ~5 s. **Nada parado mais de 4 s**: câmera em trilho sempre, elementos entram com as palavras, números contam.
- **MISTURA** (linha impressa pelo `plano.py`): 3D ≥ 55%, cartão ≤ 30%, mapa ≤ 15%, nunca mais de 4 batidas seguidas da mesma família. **DINAMISMO**: ≤ 2 cartões seguidos.
- Fiel aos fatos: velocidade sempre "160–200 km/h (estimación)", pasajeros del AVE "~400", total "más de 500"; 69 muertos, "más de 200 heridos" (nota AITAT). Hipóteses do ASFA **não** aparecem como fato.
- Coordenadas sem documentação = rótulo "aprox.".

## Verificação (obrigatória)
1. `python ferramentas/plano.py` sem ERROS; MISTURA e DINAMISMO `ok`.
2. Stills na G4: `python D:/tracer3d2/canal.py stills D:/reconstruccion/02_urda/v1 <pasta> <seg...>` (até 16 por chamada; o segundo vem de `v1/src/plano.json`; a G4 arredonda ao quadro). **Antes**, `python D:/tracer3d2/canal.py saude` — se houver render inteiro de outra sessão rodando, espere. Folhas de contato a 480 px por quadro em `render/`. Corrija vazio, cortado, sobreposto, trem fora do quadro, rótulo em cima de rótulo.
3. Não desligue a G4 (o maestro cuida). Mate só processos que você abriu (por PID). Nada no C: (`TEMP=D:/tmp`).

## Entrega (curta)
Contagem de batidas por família, MISTURA/DINAMISMO, caminho das folhas e o que ainda está fraco.

## Trens: fidelidade (nota da AITAT) e limites do kit
- **AVE 2080 = `TremAV serie:"s103"`** (Velaro, 8 carros, vermelho no teto/faixa). **Iryo 6076 = `serie:"frecciarossa"`** (ETR 1000, 8 carros, azul). Nunca `s112`/`s102` (não são os trens do acidente). Sem `fonte:"glb"` (o glb é S-100).
- Os dois rumo a Sevilha, **mesma via (via 2)**; o Iryo parado diante do sinal de entrada E242 (PK 118+800); a estação/posto de Urda ~1 km adiante (PK 119,7).
- Numeração do kit: `carro_1` = carro do nariz. A AITAT numera ao contrário em cada trem: **AVE carro 8 (cabeça) = kit `carro_1`**, AVE carro 7 = kit `carro_2`; **Iryo carro 1 (cauda) = kit `carro_8`**, carros 2 e 3 = kit `carro_7`, `carro_6`.
- Descarrilamento oficial: **AVE** descarrila inteiro; kit `carro_1` cravado na cauda do Iryo e os dois **tombados ao pé do terraplén**; kit `carro_2` também desce o talude; kit `carro_3..8` ficam sobre a plataforma, fora dos trilhos (pequena guinada). **Iryo**: kit `carro_6,7,8` descem o talude; `carro_3..5` descarrilam na plataforma; `carro_1,2` (frente) ficam nos trilhos. Use `espalha`/`lado` para os carros não se atravessarem.
- Limites conhecidos (folha `render/FOLHA_batedor_trens.jpg`): em plano aéreo os trens ficam pequenos e branco no branco — use câmera mais baixa e teleobjetiva, `nebel` leve para matar o horizonte, e rótulos (`label`) "AVE 2080" / "Iryo 6076"; o laço LZB só lê a ≤ ~60 m de câmera (para planos aéreos, use `anot` `pfad`/`kreis` em vez da cor do cabo); PK sempre por `label` na âncora `pk_118`. O amassado parece tecido: no choque, corte antes do close do contato e mostre o resultado em plano médio.
- MISTURA desta família (impressa pelo `plano.py`): **3d ≥ 55, cartão ≤ 30, mapa ≤ 15**, sequência máxima 4.
