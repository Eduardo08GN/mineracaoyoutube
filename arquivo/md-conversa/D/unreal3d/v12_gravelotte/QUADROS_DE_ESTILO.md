# Quadros de estilo, Kriegsmomente v12 (Gravelotte), unreal3d, 01/11/2026

| Quadro | Arquivo | Estado |
|---|---|---|
| **Moltkes Tisch** | `quadros/tisch_4k_2056.png` (3840×2160) | **Pronto para aprovar.** Mapa original de 1872 (Spezialkarte der Umgebungen von Metz, domínio público) com relevo e unidades impressas; peças de Kriegsspiel laqueadas azul/vermelho; lampião de época (Poly Haven CC0); luz de lampião em poça, fundo escuro |
| **Werkstatt** | `quadros/werkstatt_4k_2105.png` (3840×2160) | **Pronto para aprovar o look.** Dreyse (Andy Woodhead, CC BY) em estúdio escuro, aço oxidado, nogueira, latão envelhecido, luz de recorte. O modelo tem facetas em close (guarda-mato, bola do ferrolho): os closes do vídeo pedem um modelo de alta resolução ou o ferrolho modelado (já previsto no batedor) |
| **Schlachtgemälde** | `quadros/schlacht_previa_2200.png` (1280×720, prévia) | **Prova de composição e luz, não premium ainda.** Contraluz do pôr do sol, St. Privat na crista com a torre, colunas da Garde em silhueta com Pickelhaube e fuzil, fumaça e vila em chamas. Faltam: (1) as casas reais da Lorena (o escaneamento CC BY entrou, mas precisa de escala e posição; o import com Nanite derrubou o editor uma vez); (2) os soldados de 1870 rigados (hoje é o manequim do Unreal); (3) a postura de marcha (hoje é avanço agachado) |

**Comparação com o que já foi entregue:** `comparacao/FOLHA_comparacao.jpg` (Tracer3D 2.0, vídeo 1870 × unreal3d).

## Custo da noite
- **G4:** ligada ~2h20 (teste das 18:54 + sessão das 19:54 às 22:02), ≈ **21 unidades**. Desligada e conferida às 22:02.
- **Render:** cada quadro 4K saiu em **~15 s** de render (16 amostras temporais). A cena monta em ~20–40 s. O gargalo é ajustar, não renderizar.

## O que ficou pronto no pipeline
Tudo em `D:\unreal3d`:
- orquestrador da engine (`orquestra.py`);
- boot do Vulkan (`g4/boot.sh`);
- gerador de cena por código (`v12_gravelotte/ue/*.py`);
- render em 2 fases com vigia (`g4/quadro.sh`);
- download e reconexão (`quadros.py`).

As receitas e os erros da noite estão na memória `unreal3d`.

## Próximos passos (sugestão)
1. **O Eduardo aprova ou ajusta** Tisch e Werkstatt (paleta, luz, enquadramento).
2. **Batalha premium:**
   - rigar os soldados de 1870 do Woodhead (Mixamo, login Adobe do Eduardo, ou auto-rig na G4);
   - acertar as casas escaneadas;
   - fumaça VDB da JangaFX (CC0).
3. **Drive:** o clique de consentimento do `drive.mount` não funcionou. Sem o Drive, cada sessão rebaixa a engine (9 min com link novo da página da Epic) e refaz o preparo (~12 min).

## 02/11, madrugada: soldados de 1870 na batalha
- **Prévia:** `quadros/schlacht_previa_0410.png`. As colunas da Garde são o prussiano do Woodhead rigado, com a Pickelhaube real. Elas marcham rumo a St. Privat, vistas de costas contra o sol. A animação varia entre marcha, avanço atirando, assalto e marcha com fuzil baixo, e há caídos com as animações de morte.
- **Antes:** `quadros/schlacht_previa_0406.png`. Os soldados marchavam de lado (malha virada 90°), e os manequins de 01/11 tinham o mesmo erro.
- **Pendente, com decisão do Eduardo:**
  1. **Fuzil na mão.** A Dreyse e o Chassepot precisam de um socket com offset fixo, porque o editor sem tela não dá a pose da mão.
  2. **Luz.** A névoa e os bancos de fumaça deixam a cena chapada e põem os soldados na sombra. Os closes de lado (`0409`) e de frente (`0413`) saíram pretos, então ainda não deu para conferir a textura do uniforme no Unreal.
  3. **Casas.** As de St. Privat ainda são caixas.
- **G4:** ~1h15 nesta sessão (≈ 11 unidades), desligada às 04:15 e conferida.
