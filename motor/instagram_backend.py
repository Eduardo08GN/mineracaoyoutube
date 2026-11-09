# -*- coding: utf-8 -*-
r"""INSTAGRAM BACKEND — o contrato do gerador de imagem e video da aba Instagram.

O pipeline nao sabe QUEM gera: ele carrega um arquivo .py (caminho em Ajustes da aba, campo "backend") que
expoe estas duas funcoes. Trocar de gerador e' trocar de arquivo; nada mais muda.

    def gerar_imagem(prompt: str, refs: list[str], destino: str, diz) -> str
        Uma imagem VERTICAL 9:16 gravada em `destino` (PNG). `refs` sao caminhos de imagens locais usadas como
        referencia, na ordem do prompt (1a = a pessoa/o comodo, 2a = o objeto). Devolve `destino`.

    def gerar_videos(pedidos: list[dict], pasta: str, modelo: str, diz) -> dict[str, str | None]
        Cada pedido: {"nome": "take_01", "prompt": str, "inicio": png, "fim": png} (quadro inicial e final,
        caminhos locais). Video VERTICAL 9:16 de ate' 8 s com audio, gravado em pasta/<nome>.mp4.
        `modelo` = "gratis" ou "pago" (o pago so' quando o Eduardo pedir). Devolve {nome: caminho} e None
        para o que falhou ou foi recusado (o pipeline refaz so' esses).

    `diz(texto)` manda uma linha para o registro do painel.
"""
import importlib.util, os

FUNCOES = ("gerar_imagem", "gerar_videos")
_cache = {}


class SemGerador(RuntimeError):
    pass


def carregar(caminho):
    """O modulo do gerador pelo caminho do .py (recarrega quando o arquivo muda)."""
    if not caminho:
        raise SemGerador("nenhum gerador configurado: em Ajustes da aba Instagram, aponte o arquivo .py do gerador")
    if not os.path.isfile(caminho):
        raise SemGerador(f"o arquivo do gerador não existe: {caminho}")
    chave = (os.path.abspath(caminho), os.path.getmtime(caminho))
    if chave not in _cache:
        spec = importlib.util.spec_from_file_location(f"gerador_instagram_{len(_cache)}", caminho)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        falta = [f for f in FUNCOES if not callable(getattr(mod, f, None))]
        if falta: raise SemGerador(f"o gerador {os.path.basename(caminho)} não tem: {', '.join(falta)}")
        _cache[chave] = mod
    return _cache[chave]
