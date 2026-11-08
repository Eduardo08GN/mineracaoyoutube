# Rodada 2 (r13): acabamento com pacotes prontos

Decisao do dono: so o modo barato. `cena/src/modo.json` fica com gi="barato". Stills finais: stills/A_crepusculo.jpg, B_meianoite.jpg, C_amanhecer.jpg e stills/folha_batedor.jpg (render cena/teste/r13_barato2). folha_modos.jpg nao feita (pt descartado).

## Diagnostico do path tracer (three-gpu-pathtracer 0.0.24, G4-2, Chrome headless angle-egl)
- Roda: 16 spp no estagio A = 8,5 s total (bundle 3 s); 8 spp no B = 5,6 s. GI real, sombra macia e contraluz funcionam; o still A saiu escuro e granulado (faltou exposicao e amostras).
- Trava: 48 spp (estagio A) nao voltou em 400 s. 64 spp (B) e 256 spp (A, B, C em paralelo) tambem travaram. 16 spp nos 3 estagios em paralelo e 16 spp em estagio unico logo apos reiniciar o daemon tambem travaram. Cada trava deixa o daemon de stills pendurado (GPU 0%, fila serial parada): precisa matar stills_quente e o Chrome na VM.
- Tempo medido: ~0,3 s/spp so em 8 e 16 spp, nao ha medida confiavel acima disso.
- Hipotese: perda de contexto/watchdog do WebGL (ou timeout do page) por laco longo de renderSample dentro de um unico delayRender; o laco ja cede ao navegador a cada 8 atualizacoes com setTimeout, mas sem requestAnimationFrame nem checagem de gl.isContextLost(). Paralelo de 3 contextos soma a pressao na GPU.
- Proximo passo: (1) logar gl.isContextLost() e o numero de amostras de tempos em tempos para o servidor da VM (nao ha console do Chrome com logLevel error); (2) acumular em varias chamadas curtas por requestAnimationFrame, tiles 4x4, um estagio por vez (PARALELO=1 no daemon); (3) so entao subir spp, com denoise. Alternativa: renderizar o pt em processo proprio (Chrome headless direto, sem o daemon) e so compor o HUD no Remotion.

## Modo barato (entregue)
- AccumulativeShadows + RandomizedLight + ContactShadows (drei) + n8ao + bloom/AgX/cor seletiva; agua em material fisico com normal map procedural. Water2 nao usado (incompativel com o pt; no barato a agua segue a mesma malha facetada).
- Ajuste de olho unico: estagio C com brilho -0,05 e contraste 0,18 (estava lavado).
- Segue fraco: agua do B parece chao preto liso com um reflexo; agua do C ainda branca e lisa (pouca textura de corrente); sem nevoa/profundidade de campo fisica no barato alem do bokeh do Look; chuva sem respingos. Receitas candidatas em D:/pesquisa_nichos/Threejs-Awesome-Graphics-Agent-Skills/skills/ (threejs-water-optics, threejs-precipitation-surfaces, threejs-exposure-color-grading), ainda nao aplicadas.
- Infra: cena/node_modules proprio (o compartilhado nao foi tocado); g4_stills.py com --spp/--gi e reinstalacao npm quando o package.json muda.

## Rodada final: agua e chuva (r14a-c, modo barato)
- Receita threejs-water-optics (rio raso) em WebGL via onBeforeCompile no material fisico: 7 bandas direcionais analiticas com vetor de onda cruzando a correnteza (cristas alongadas em +x), normal derivada da mesma soma, filtro por derivada (fwidth), espuma em faixas (stream lines) e aneis em volta do tronco.
- Receita threejs-precipitation-surfaces: aneis de respingo (300) so na superficie da agua B, na regiao da chuva.
- B: lama escura, reflexo da lua quebrado em glints, aneis de chuva visiveis. C: lama escura com textura de corrente; segue acinzentada (nevoa + dessaturacao da cor seletiva), nao marrom medio.
- Ainda sem animacao no still (fase fixa uPh), sem caustica; anel do tronco fica atras do homem no B.

## r15 (correcao do revisor r14, barato, 3 renders: r15a-c)
- B: agua sobe a 2,0 m (AGUA_B), homem pendurado no tronco acima da agua (quadrilY), camera a 3,1 m; ondas maiores, faixas de espuma, esteiras de espuma atras de barraca/troncos, chuva com hash mulberry32 (sem colunas), aneis 80 e pequenos, cabelo/barba escuros e cabeca baixa.
- C: camera mais perto, homem no galho, lama marrom com correntes e aneis de espuma em volta do tronco, sem listras de alta frequencia (lmin 1,3, normal map repeat 24).
- A: fov 63 e alvo mais alto: topo esquerdo livre para o bloco HORA. HUD: gradiente radial atras do titulo, legenda peso 800 com sombra forte.
- Segue fraco: B ainda com reflexo azul claro em facetas grandes no primeiro plano; C com copa ainda entrando no topo direito; agua C com pouco reflexo de ceu.

## r16 (revisor r15; barato; r16a-c)
- Os stills de r15 eram os arquivos certos; o defeito era a imagem (homem de pe, agua lisa, camera do C com a copa sobre o titulo).
- B: homem pendurado no tronco, bracos erguidos, pernas dobradas e pes acima da agua; luz de recorte quente/fria suave; malha de agua mais densa; aneis pequenos e esparsos.
- C: camera deslocada para a direita (alvo x -6,2): titulo sobre mesa/ceu, homem visivel no galho, lama marrom com espuma.
- Segue fraco: agua do B ainda com facetas largas e pouca correnteza visivel no primeiro plano; C com agua desfocada pelo DoF no primeiro plano.
