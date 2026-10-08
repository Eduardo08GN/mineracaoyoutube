# Minerador

Acha nichos quentes no YouTube do jeito que os canais de persona (o "Elias Yoder" Amish e cia.) acham:
**um vídeo que viralizou antes da era da IA + uma persona + um produto próprio no fim.**

O Minerador:
1. busca os virais antigos de cada semente (YouTube Data API, só vídeos antes de 2022);
2. mede o quanto passaram do tamanho do canal (outlier) e se ainda puxam views por ano;
3. procura quem já remakou com a persona (e calcula a **fome**: demanda ÷ oferta);
4. pede ao Claude Code desta máquina os títulos do remake (persona · lacuna de curiosidade · número grande), o tema e o ângulo do produto;
5. refaz as melhores em **francês e alemão**: título local, a busca que o nativo digita, o maior viral nativo e se alguém já faz com a persona lá;
6. o **Radar** acha canais-persona novos crescendo (o sinal de nicho quente — e de nicho lotando).

A interface é a mesma do OW Agente: janela do Windows (WebView2) + servidor local + painel React. Ver [ARQUITETURA.md](ARQUITETURA.md).

## Rodar

```bash
pip install fastapi uvicorn pywebview
python minerador.py
```

A chave da YouTube Data API vai no `.env` da raiz (`YOUTUBE_API_KEY=...`) ou em Ajustes no painel.

```bash
python minerador.py --autoteste
```

```bash
python minerador.py --navegador
```

O painel já vai montado em `painel/app/dist`. Para mexer nele: `cd painel/app && npm install && npm run dev`.

## Documentos

- [docs/referencia-elias-yoder.md](docs/referencia-elias-yoder.md) — o roteiro do canal Amish, quadro a quadro
- [docs/referencia-bigstepsmedia.md](docs/referencia-bigstepsmedia.md) — a fórmula e o pipeline dos canais de avatar
- [docs/fontes.md](docs/fontes.md) — quem olhar no X e os números de referência
- [docs/apostas.md](docs/apostas.md) — as 6 apostas fora da curva e o que o teste mostrou

## Regras

- ⛔ A chave da API mora só no `.env` (fora do git). O servidor só escuta em 127.0.0.1 e pede a senha da sessão.
- ⭐ Busca custa 100 unidades da cota diária (10.000): o que já foi buscado no dia vem do banco.
- ⭐ Cada garimpo tem dono: duas janelas (ou uma janela e um script) nunca rodam o mesmo garimpo.
