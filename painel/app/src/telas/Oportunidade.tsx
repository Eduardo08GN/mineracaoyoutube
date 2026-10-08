import { useEffect, useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, Flame, Languages, Play, RefreshCw, Trash2, Video } from "lucide-react";
import { abrirLink, CODIGOS, embed, enviar, linkVideo, obter, type DetalheOp, type EstadoOp } from "../api";
import type { MIN } from "../estado";
import { Girando, Nota, Vazio, VideoThumb, useAcao, Bandeira } from "../componentes/base";
import { PainelEquivalente } from "../componentes/equivalente";
import { link } from "../rota";
import { ano, compacto, dolares, duracao, nomePersona, numero, ROTULO_OP } from "../textos";

const SINAIS: [keyof DetalheOp["sinais"], string, string][] = [
  ["views", "Viral", "o vídeo foi grande de verdade"],
  ["outlier", "Outlier", "passou do tamanho do canal"],
  ["demanda", "Demanda", "ainda puxa views por ano"],
  ["lacuna", "Lacuna", "ninguém remakou com a persona"],
  ["encaixe", "Encaixe", "a persona cabe e vende produto"],
];

function Copiar({ texto, avisar }: { texto: string; avisar: MIN["avisar"] }) {
  const [ok, setOk] = useState(false);
  return (
    <button className="btn btn-quiet btn-icon-sm" aria-label="Copiar título" onClick={async () => {
      try {
        await navigator.clipboard.writeText(texto);
        setOk(true); window.setTimeout(() => setOk(false), 1500);
      } catch { avisar("Não consegui copiar.", "erro"); }
    }}>{ok ? <Check size={15} /> : <Copy size={15} />}</button>
  );
}

/** O video tocando na propria pagina: a capa primeiro (leve), o player so' no clique. */
function PlayerEmbutido({ id, thumb, titulo }: { id: string; thumb: string; titulo: string }) {
  const [tocando, setTocando] = useState(false);
  useEffect(() => setTocando(false), [id]);
  return (
    <div className="op-thumb yt-16x9">
      {tocando ? (
        <iframe src={embed(id)} title={titulo} allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      ) : (
        <button className="op-capa" onClick={() => setTocando(true)} aria-label="Tocar o vídeo original">
          {thumb && <img src={thumb} alt="" />}
          <span className="vthumb-play grande"><Play size={26} fill="currentColor" aria-hidden /></span>
        </button>
      )}
      <button className="op-play" onClick={() => abrirLink(linkVideo(id))}><ExternalLink size={14} aria-hidden />YouTube</button>
    </div>
  );
}

export function Oportunidade({ m, id }: { m: MIN; id: number }) {
  const [o, setO] = useState<DetalheOp | null>(null);
  const [erro, setErro] = useState("");
  const { rodando, rodar } = useAcao(m.avisar);

  useEffect(() => {
    obter<DetalheOp>(`/api/oportunidades/${id}`).then((r) => { setO(r); setErro(""); })
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)));
  }, [id, m.versaoOps]);

  if (erro) return <div className="tela"><Vazio titulo="Não achei essa oportunidade" texto={erro} /></div>;
  if (!o) return <div className="tela"><p className="meta">Carregando…</p></div>;

  const outros = CODIGOS.filter((c) => c !== o.idioma);
  const marcar = (estado: EstadoOp, texto: string) =>
    rodar(estado, async () => setO(await enviar<DetalheOp>(`/api/oportunidades/${id}/estado`, { estado })), texto);

  return (
    <div className="tela">
      <a className="btn btn-quiet btn-sm voltar" href={link.oportunidades}><ArrowLeft size={15} aria-hidden />Oportunidades</a>

      <div className="op-topo">
        <PlayerEmbutido id={o.video_id} thumb={o.thumb} titulo={o.titulo} />
        <div className="op-info">
          <p className="eyebrow"><Bandeira cod={o.idioma} /> {nomePersona(o.persona, m.catalogo?.personas)} · {o.tema || "tema a definir"} · {ROTULO_OP[o.estado]}</p>
          <h1 className="titulo-video">{o.titulo}</h1>
          <p className="meta">{o.canal}<b>/</b>{compacto(o.canal_info.inscritos)} inscritos<b>/</b>{ano(o.publicado)}<b>/</b>{duracao(o.duracao)}<b>/</b>semente “{o.semente}”</p>
          <div className="op-numeros">
            <div><span className="label">Nota</span><Nota nota={o.nota} grande /></div>
            <div><span className="label">Views</span><span className="num">{compacto(o.views)}</span></div>
            <div><span className="label">Outlier</span><span className="num">{o.outlier.toFixed(1).replace(".", ",")}x</span></div>
            <div><span className="label">Receita se repetir</span><span className="num accent">~{dolares(o.receita)}</span></div>
            <div><span className="label"><Flame size={11} aria-hidden /> Fome</span><span className="num">{o.fome >= 0 ? `${compacto(o.fome)}/ano` : "—"}</span></div>
          </div>
          <div className="row">
            {o.estado !== "salva" && <button className="btn btn-primary btn-sm" disabled={!!rodando} onClick={() => marcar("salva", "Salva.")}>Salvar</button>}
            {o.estado !== "produzida" && <button className="btn btn-ghost btn-sm" disabled={!!rodando} onClick={() => marcar("produzida", "Marcada como produzida.")}><Video size={14} aria-hidden />Produzi</button>}
            {o.estado !== "descartada" ? (
              <button className="btn btn-quiet btn-sm" disabled={!!rodando} onClick={() => marcar("descartada", "Descartada.")}><Trash2 size={14} aria-hidden />Descartar</button>
            ) : (
              <button className="btn btn-quiet btn-sm" disabled={!!rodando} onClick={() => marcar("nova", "Voltou para a lista.")}>Restaurar</button>
            )}
          </div>
        </div>
      </div>

      <section className="panel bloco">
        <div className="linha-titulo">
          <h3>Títulos para o remake</h3>
          <button className="btn btn-ghost btn-sm" disabled={!!rodando || !m.estado?.claude}
                  title={m.estado?.claude ? "" : "O Claude Code não está nesta máquina"}
                  onClick={() => rodar("r", () => enviar(`/api/oportunidades/${id}/reescrever`), "O Claude está escrevendo (leva uns 30 s).")}>
            {rodando === "r" ? <Girando /> : <RefreshCw size={14} aria-hidden />}{o.titulos.length ? "Reescrever" : "Escrever títulos"}
          </button>
        </div>
        {o.titulos.length ? (
          <ol className="titulos">
            {o.titulos.map((t, i) => <li key={i}><span>{t}</span><Copiar texto={t} avisar={m.avisar} /></li>)}
          </ol>
        ) : <p>Ainda sem títulos. Peça ao Claude.</p>}
        {o.angulo && (
          <div className="angulo">
            <span className="label">Ângulo do produto</span>
            <p>{o.angulo}</p>
          </div>
        )}
      </section>

      <section className="bloco-equiv">
        <div className="linha-titulo">
          <h2><Languages size={20} aria-hidden /> Em outros idiomas</h2>
          {outros.some((c) => !o.equivalentes[c]) && (
            <button className="btn btn-ghost btn-sm" disabled={!!rodando || !m.estado?.claude}
                    onClick={() => rodar("eq", () => enviar(`/api/oportunidades/${id}/equivalentes`,
                      { idiomas: outros.filter((c) => !o.equivalentes[c]) }), "Equivalências na fila (≈ 100 unidades por mercado).")}>
              {rodando === "eq" ? <Girando /> : <Languages size={14} aria-hidden />}
              Vestir em {outros.filter((c) => !o.equivalentes[c]).map((c) => c.toUpperCase()).join(", ")}
            </button>
          )}
        </div>
        {outros.some((c) => o.equivalentes[c]) ? (
          <div className="tres">
            {outros.filter((c) => o.equivalentes[c]).map((c) => (
              <PainelEquivalente key={c} e={o.equivalentes[c]!} nome={m.catalogo?.idiomas?.[c]?.nome ?? c}
                                 persona={m.catalogo?.personas.find((p) => p.id === o.equivalentes[c]!.persona)?.nome} />
            ))}
          </div>
        ) : <p className="meta">Ainda sem equivalências. Gere para ver o viral nativo e se alguém já faz com a persona lá.</p>}
      </section>

      <div className="duas">
        <section className="panel bloco">
          <h3>Por que essa nota</h3>
          <ul className="sinais">
            {SINAIS.map(([k, nome, dica]) => (
              <li key={k}>
                <div className="linha-meta"><span>{nome} <small className="meta">· {dica}</small></span><span className="meta">{Math.round(o.sinais[k] * 100)}</span></div>
                <div className="bar"><span style={{ width: `${o.sinais[k] * 100}%` }} /></div>
              </li>
            ))}
          </ul>
          <p className="meta">{numero(o.likes)} likes · {numero(o.comentarios)} comentários</p>
        </section>
        <section className="panel bloco">
          <h3>Remakes com a persona</h3>
          {o.n_remakes < 0 ? <p>Não checado neste garimpo (só as melhores são checadas, para poupar cota).</p> :
           o.n_remakes === 0 ? <p className="ok-txt">Ninguém remakou ainda depois de 2023. Lacuna aberta.</p> : (
            <div className="grade-thumbs">
              {o.remakes.map((r) => <VideoThumb key={r.id} v={r} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
