import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clapperboard, ExternalLink, FileText, Film, ListTree, Pencil, Play, RefreshCw, Search, X } from "lucide-react";
import { abrirLink, capa, enviar, linkVideo, obter, type PerfilVideo, type PlanoVideo, type SecaoRoteiro, type TipoPlano, type Video } from "../api";
import type { MIN } from "../estado";
import { Bandeira, Girando, Rosto, Vazio, useAcao } from "../componentes/base";
import { link } from "../rota";
import { compacto, duracao, nomePersona, quando } from "../textos";

const TIPO: Record<TipoPlano, string> = { avatar: "Avatar", split: "Tela dividida", broll: "B-roll" };
const ELIAS: Record<TipoPlano, number> = { avatar: 10, split: 10, broll: 80 };
const CAMADA: Record<string, string> = { acao: "ação", objeto: "objeto", lugar: "lugar", epoca: "época", pessoas: "pessoas" };
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function Etapas({ v }: { v: Video }) {
  return (
    <ol className="etapas-video">
      {v.etapas.map((e, i) => (
        <li key={e.id} className={`ev-${e.estado}${v.trabalhando === e.id ? " ev-ativa" : ""}`}>
          <span className="ev-num">{v.trabalhando === e.id ? <Girando /> : e.estado === "pronta" ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
          <span>{e.nome}</span>
        </li>
      ))}
    </ol>
  );
}

function BotaoRefazer({ v, etapa, rotulo, rodar, rodando, claude }: {
  v: Video; etapa: string; rotulo: string; claude: boolean;
  rodar: ReturnType<typeof useAcao>["rodar"]; rodando: string;
}) {
  const ocupado = v.trabalhando === etapa || v.na_fila.includes(etapa);
  return (
    <button className="btn btn-ghost btn-sm" disabled={!!rodando || ocupado || !claude}
            onClick={() => rodar(etapa, () => enviar(`/api/videos/${encodeURIComponent(v.id)}/rodar`, { etapa }), `${rotulo}: na fila.`)}>
      {ocupado ? <Girando /> : <RefreshCw size={14} aria-hidden />}{ocupado ? "trabalhando…" : rotulo}
    </button>
  );
}

function Fonte({ v }: { v: Video }) {
  const f = v.fonte;
  const [ver, setVer] = useState(false);
  const mec = v.mecanismo;
  return (
    <div className="fonte-grade">
      <button className="fonte-capa" onClick={() => abrirLink(linkVideo(f.video_id))} aria-label="Abrir o viral no YouTube">
        <img src={f.thumb || capa(f.video_id, "hq")} alt="" />
        <span className="op-play"><ExternalLink size={14} aria-hidden />YouTube</span>
      </button>
      <div className="fonte-info">
        <span className="label">Viral fonte</span>
        <strong>{f.titulo}</strong>
        <span className="meta">{f.canal}<b>/</b>{compacto(f.views)} views{f.duracao ? <><b>/</b>{duracao(f.duracao)}</> : null}</span>
        {f.pronta && (
          <span className="meta">
            {f.sem_fala ? "sem fala (só imagem e música): o roteiro sai do título e da descrição" :
              `${compacto((f.texto || "").split(/\s+/).length)} palavras lidas · ${f.legenda}`}
          </span>
        )}
        {f.pronta && f.texto && (
          <button className="link-btn" onClick={() => setVer(!ver)}>{ver ? "esconder" : "ver"} o que se fala no original</button>
        )}
        {ver && <p className="fonte-texto">{f.texto?.slice(0, 4000)}{(f.texto?.length ?? 0) > 4000 ? "…" : ""}</p>}
      </div>
      {mec && (
        <div className="mecanismo">
          <span className="label">O mecanismo · {mec.itens} itens no remake</span>
          <p>{mec.resumo}</p>
          <ol>{mec.pontos.map((p, i) => <li key={i}>{p}</li>)}</ol>
          {mec.promessa && <p className="promessa"><b>Promessa:</b> {mec.promessa}</p>}
          {mec.lacunas.length > 0 && <p className="meta"><b>O monge pode acrescentar:</b> {mec.lacunas.join(" · ")}</p>}
        </div>
      )}
    </div>
  );
}

function Perfil({ v, m }: { v: Video; m: MIN }) {
  const [p, setP] = useState<PerfilVideo>(v.perfil);
  const { rodando, rodar } = useAcao(m.avisar);
  useEffect(() => setP(v.perfil), [v.perfil]);
  const campo = (k: keyof PerfilVideo, rotulo: string, longo = false) => (
    <label className="input">
      <span className="label">{rotulo}</span>
      {longo ? <textarea className="campo" rows={2} value={p[k]} onChange={(e) => setP({ ...p, [k]: e.target.value })} />
        : <input className="campo" value={p[k]} onChange={(e) => setP({ ...p, [k]: e.target.value })} />}
    </label>
  );
  const mudou = JSON.stringify(p) !== JSON.stringify(v.perfil);
  return (
    <details className="perfil-video">
      <summary><span className="com-rosto"><Rosto pid={v.persona} personas={m.catalogo?.personas} tam={24} /> Quem fala: <b>{v.perfil.nome}</b> · livro “{v.perfil.livro}” em {v.perfil.site}</span></summary>
      <div className="perfil-campos">
        {campo("nome", "Nome")}{campo("livro", "Livro")}{campo("site", "Site do livro")}{campo("tratamento", "Tratamento (Sie/du)")}
        {campo("apresentacao", "Como ele se apresenta", true)}{campo("companheiro", "Companheiro nas histórias (o papel da Esther)", true)}
        {campo("assinatura", "Frase de assinatura no fim", true)}{campo("despedida", "Despedida")}
      </div>
      <div className="row">
        <button className="btn btn-primary btn-sm" disabled={!mudou || !!rodando}
                onClick={() => rodar("pf", () => enviar(`/api/videos/${encodeURIComponent(v.id)}/perfil`, { campos: p }),
                  "Perfil salvo: vale para o próximo roteiro (reescreva para aplicar).")}>Salvar perfil</button>
        {mudou && <button className="btn btn-quiet btn-sm" onClick={() => setP(v.perfil)}>Desfazer</button>}
      </div>
    </details>
  );
}

function Secao({ v, s, m }: { v: Video; s: SecaoRoteiro; m: MIN }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(s.texto);
  const { rodando, rodar } = useAcao(m.avisar);
  useEffect(() => { setTexto(s.texto); setEditando(false); }, [s.texto]);
  const n = s.texto.split(/\s+/).filter(Boolean).length;
  return (
    <details className="secao-roteiro">
      <summary><span className="sr-num">{s.n}</span><b>{s.nome}</b><span className="meta">{n} palavras · ~{mmss(n / 2.2)}</span></summary>
      {editando ? (
        <>
          <textarea className="campo sr-edit" value={texto} onChange={(e) => setTexto(e.target.value)} rows={Math.min(24, 4 + Math.ceil(texto.length / 90))} />
          <div className="row">
            <button className="btn btn-primary btn-sm" disabled={!!rodando || texto.trim() === s.texto}
                    onClick={() => rodar("s", () => enviar(`/api/videos/${encodeURIComponent(v.id)}/secao`, { n: s.n, texto }),
                      "Seção salva. Os planos saíram: refaça a etapa Planos.")}>Salvar</button>
            <button className="btn btn-quiet btn-sm" onClick={() => { setTexto(s.texto); setEditando(false); }}><X size={14} aria-hidden />Cancelar</button>
          </div>
        </>
      ) : (
        <>
          <p className="sr-texto">{s.texto}</p>
          <button className="btn btn-quiet btn-sm" onClick={() => setEditando(true)}><Pencil size={13} aria-hidden />Editar</button>
        </>
      )}
    </details>
  );
}

function Planos({ v }: { v: Video }) {
  const [filtro, setFiltro] = useState<"" | TipoPlano>("");
  const [busca, setBusca] = useState("");
  const total = v.planos.reduce((a, p) => a + p.dur, 0);
  const vistos = useMemo(() => v.planos.filter((p) => (!filtro || p.tipo === filtro)
    && (!busca || (p.texto + " " + p.cena).toLowerCase().includes(busca.toLowerCase()))), [v.planos, filtro, busca]);
  const ir = (p: PlanoVideo) => document.getElementById(`plano-${p.n}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  return (
    <>
      <div className="proporcoes">
        {(["avatar", "split", "broll"] as TipoPlano[]).map((t) => (
          <div key={t} className={`prop prop-${t}`}>
            <span className="label">{TIPO[t]}</span>
            <span className="num">{v.proporcoes[t]}%</span>
            <span className="meta">Elias: ~{ELIAS[t]}% · {v.planos.filter((p) => p.tipo === t).length} planos</span>
          </div>
        ))}
        <div className="prop"><span className="label">Duração estimada</span><span className="num">{mmss(total)}</span>
          <span className="meta">{v.planos.length} planos · média {(total / Math.max(1, v.planos.length)).toFixed(1)} s</span></div>
      </div>
      <div className="linha-tempo" aria-label="Linha do tempo dos planos">
        {v.planos.map((p) => (
          <button key={p.n} className={`lt lt-${p.tipo}`} style={{ flexGrow: p.dur }} title={`${mmss(p.inicio)} · ${TIPO[p.tipo]} · ${p.texto.slice(0, 80)}`}
                  onClick={() => { setFiltro(""); setBusca(""); window.setTimeout(() => ir(p), 30); }} />
        ))}
      </div>
      <div className="filtros" role="group" aria-label="Tipo de plano">
        {([["", "Todos"], ["avatar", "Avatar"], ["split", "Tela dividida"], ["broll", "B-roll"]] as ["" | TipoPlano, string][]).map(([f, t]) => (
          <button key={f} className="filtro" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
            {t}<span>{f ? v.planos.filter((p) => p.tipo === f).length : v.planos.length}</span>
          </button>
        ))}
        <label className="busca-planos"><Search size={14} aria-hidden /><input className="campo" placeholder="procurar na fala ou na cena" value={busca} onChange={(e) => setBusca(e.target.value)} /></label>
      </div>
      <ol className="lista-planos">
        {vistos.map((p) => (
          <li key={p.n} id={`plano-${p.n}`} className={`lp lp-${p.tipo}`}>
            <span className="lp-tempo">{mmss(p.inicio)}<small>{p.dur}s</small></span>
            <span className="lp-chips">
              <span className={`chip chip-${p.tipo}`}>{TIPO[p.tipo]}</span>
              <span className={`chip chip-voz`}>{p.voz === "veo" ? "voz do Veo" : "MiniMax"}</span>
            </span>
            <span className="lp-meio">
              <span className="lp-fala">{p.texto}</span>
              {p.tipo !== "avatar" && (p.cena ? (
                <span className="lp-cena"><Film size={12} aria-hidden /> {p.cena}
                  {p.camada && <span className="chip chip-camada">{CAMADA[p.camada] ?? p.camada}</span>}
                  {p.busca && <span className="meta"> · busca “{p.busca}”</span>}</span>
              ) : <span className="lp-cena sem">sem cena</span>)}
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}

const NOME_TRANS: Record<string, string> = { fusao_curta: "fusões", papel: "mergulhos no papel", luz: "clarões de seção", fusao: "fusões" };

/** As etapas que rodam fora do painel (work/video): avatar, voz, b-roll, montagem — e o vídeo pronto. */
function ProducaoFeita({ v, m }: { v: Video; m: MIN }) {
  const pr = v.producao ?? {};
  const { rodando, rodar } = useAcao(m.avisar);
  const mt = pr.montagem;
  return (
    <div className="producao-feita">
      {mt && (
        <div className="pronto">
          <span className="label">Vídeo pronto</span>
          <strong>{mt.minutos.toFixed(1)} min · {mt.blocos} blocos · {mt.resolucao ?? "1920x1080"} · {mt.lufs} LUFS</strong>
          <span className="meta">{Object.entries(mt.transicoes).map(([k, n]) => `${n} ${NOME_TRANS[k] ?? k}`).join(" · ")} · montado {mt.feito}</span>
          <code className="caminho">{mt.arquivo}</code>
          <button className="btn btn-primary btn-sm" disabled={!!rodando}
                  onClick={() => rodar("abrir", () => enviar(`/api/videos/${encodeURIComponent(v.id)}/abrir`, {}), "Abrindo no player…")}>
            {rodando === "abrir" ? <Girando /> : <Play size={14} aria-hidden />}Assistir
          </button>
        </div>
      )}
      <dl className="pf-etapas">
        <div><dt>Avatar</dt><dd>{pr.avatar ? `${pr.avatar.takes} takes novos (${pr.avatar.entradas} entradas do monge) · ${pr.avatar.creditos} créditos · ${pr.avatar.modelo}` : "—"}</dd></div>
        <div><dt>Voz</dt><dd>{pr.voz ? `narração ${pr.voz.narracao} · takes ${pr.voz.takes}` : "—"}</dd></div>
        <div><dt>B-roll</dt><dd>{pr.broll ? `${pr.broll.trechos_limpos} trechos limpos (${pr.broll.fora} tirados no olho) · motion graphics: ${pr.broll.motion_graphics.join(", ")}` : "—"}</dd></div>
      </dl>
    </div>
  );
}

export function VideoProjeto({ m, id }: { m: MIN; id: string }) {
  const [v, setV] = useState<Video | null>(null);
  const [erro, setErro] = useState("");
  const { rodando, rodar } = useAcao(m.avisar);
  useEffect(() => {
    obter<Video>(`/api/videos/${encodeURIComponent(id)}`).then((r) => { setV(r); setErro(""); })
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)));
  }, [id, m.versaoProducao]);

  if (erro) return <div className="tela"><Vazio titulo="Não achei esse vídeo" texto={erro} /></div>;
  if (!v) return <div className="tela"><p className="meta">Carregando…</p></div>;
  const claude = !!m.estado?.claude;
  const est = Object.fromEntries(v.etapas.map((e) => [e.id, e.estado]));
  const props = { v, rodar, rodando, claude };

  return (
    <div className="tela">
      <a className="btn btn-quiet btn-sm voltar" href={link.producao}><ArrowLeft size={15} aria-hidden />Produção</a>
      <div className="video-topo">
        <div>
          <p className="eyebrow com-rosto"><Bandeira cod={v.idioma} /> <Rosto pid={v.persona} personas={m.catalogo?.personas} tam={26} /> {nomePersona(v.persona, m.catalogo?.personas)} · criado {quando(v.criado)}</p>
          <h1 className="titulo-video">{v.nome}</h1>
          {v.roteiro && <p className="meta">{compacto(v.roteiro.palavras)} palavras · ~{v.roteiro.minutos} min{v.planos.length ? ` · ${v.planos.length} planos` : ""}</p>}
        </div>
        <Etapas v={v} />
      </div>

      <section className="panel bloco">
        <div className="linha-titulo"><h3><Search size={18} aria-hidden /> 1. Fonte e mecanismo</h3><BotaoRefazer {...props} etapa="fonte" rotulo="Ler de novo" /></div>
        {est.fonte !== "pronta" && v.trabalhando !== "fonte" && !v.na_fila.includes("fonte") ? <p>Ainda não lida.</p> : null}
        {v.trabalhando === "fonte" && <p className="meta"><Girando /> Lendo o viral (sem legenda, o áudio é transcrito: leva uns minutos)…</p>}
        <Fonte v={v} />
      </section>

      <section className="panel bloco">
        <div className="linha-titulo"><h3><FileText size={18} aria-hidden /> 2. Roteiro</h3>
          {est.fonte === "pronta" && <BotaoRefazer {...props} etapa="roteiro" rotulo={v.roteiro ? "Reescrever" : "Escrever"} />}</div>
        <Perfil v={v} m={m} />
        {v.trabalhando === "roteiro" && <p className="meta"><Girando /> O Claude está escrevendo ~2.900 palavras em alemão (leva alguns minutos)…</p>}
        {v.roteiro ? (
          <>
            <div className="titulos-video">
              <div><span className="label">Títulos</span><ol>{v.roteiro.titulos.map((t, i) => <li key={i}>{t}</li>)}</ol></div>
              <div><span className="label">Miniatura</span><p><b>“{v.roteiro.miniatura.texto}”</b></p><p className="meta">objeto: {v.roteiro.miniatura.objeto}</p></div>
            </div>
            <div className="secoes-roteiro">{v.roteiro.secoes.map((s) => <Secao key={s.n} v={v} s={s} m={m} />)}</div>
          </>
        ) : est.fonte === "pronta" && v.trabalhando !== "roteiro" ? <p>Ainda sem roteiro.</p> : null}
      </section>

      <section className="panel bloco">
        <div className="linha-titulo"><h3><ListTree size={18} aria-hidden /> 3. Planos</h3>
          {est.roteiro === "pronta" && <BotaoRefazer {...props} etapa="planos" rotulo={v.planos.length ? "Refazer" : "Montar"} />}</div>
        {v.trabalhando === "planos" && <p className="meta"><Girando /> Cortando a narração e descrevendo as cenas…</p>}
        {v.planos.length ? <Planos v={v} /> : est.roteiro === "pronta" && v.trabalhando !== "planos" ?
          <p>Sem planos (o roteiro mudou ou ainda não foram montados).</p> : null}
      </section>

      <section className="panel bloco">
        <div className="linha-titulo"><h3><Clapperboard size={18} aria-hidden /> 4–7. Avatar, voz, b-roll e montagem</h3></div>
        {est.planos === "pronta" && (
          <div className="row etapas-video-botoes">
            <BotaoRefazer {...props} etapa="avatar" rotulo={est.avatar === "pronta" ? "4. Refazer takes" : "4. Gerar takes (Veo grátis)"} />
            <BotaoRefazer {...props} etapa="voz" rotulo="5. Voz" />
            <BotaoRefazer {...props} etapa="broll" rotulo={est.broll === "pronta" ? "6. Refazer b-roll" : "6. Buscar b-roll"} />
            {est.broll === "pronta" && <BotaoRefazer {...props} etapa="montagem" rotulo={est.montagem === "pronta" ? "7. Remontar" : "7. Montar o vídeo"} />}
          </div>
        )}
        {["avatar", "voz", "broll", "montagem"].includes(v.trabalhando) &&
          <p className="meta"><Girando /> Rodando: acompanhe o andamento no log (painel inicial).</p>}
        {v.producao && Object.keys(v.producao).length ? <ProducaoFeita v={v} m={m} /> :
          <p className="meta">Cada etapa roda o pipeline de vídeo (<code>work/video/projeto_video.py</code>) e grava o resultado aqui. O avatar usa o Flow no modelo grátis; o b-roll busca em YouTube, Rutube e Bilibili e passa pela revisão no olho antes da montagem.</p>}
      </section>

      {v.registro.length > 0 && (
        <section className="panel bloco">
          <h3>Registro</h3>
          <ul className="registro-video">{v.registro.slice(0, 12).map((r, i) => <li key={i}><span className="meta">{quando(r.t)}</span> {r.texto}</li>)}</ul>
        </section>
      )}
    </div>
  );
}
