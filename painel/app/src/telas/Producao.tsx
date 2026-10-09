import { useEffect, useState } from "react";
import { Clapperboard, Flame, Play, Workflow } from "lucide-react";
import { enviar, obter, type Oportunidade, type Pipeline, type ResumoVideo } from "../api";
import type { MIN } from "../estado";
import { Bandeira, Girando, Nota, Rosto, Vazio, useAcao } from "../componentes/base";
import { link } from "../rota";
import { compacto, nomePersona, quando } from "../textos";

const ROTULO_ETAPA: Record<string, string> = {
  fonte: "lendo o viral", roteiro: "escrevendo o roteiro", planos: "montando os planos",
};

/** As 8 etapas em bolinhas: pronta, a fazer, bloqueada e as das fases seguintes. */
export function Trilha({ v }: { v: ResumoVideo }) {
  return (
    <span className="trilha" aria-label="Etapas do vídeo">
      {v.etapas.map((e) => (
        <i key={e.id} className={`trilha-${e.estado}${v.trabalhando === e.id ? " ativa" : ""}`} title={`${e.nome}: ${e.estado}`} />
      ))}
    </span>
  );
}

function CartaoVideo({ v, m }: { v: ResumoVideo; m: MIN }) {
  const prontas = v.etapas.filter((e) => e.estado === "pronta").length;
  return (
    <a className="panel vcard" href={link.video(v.id)}>
      <span className="vcard-capa">
        {v.thumb ? <img src={v.thumb} alt="" loading="lazy" /> : null}
        <span className="vcard-rosto"><Rosto pid={v.persona} personas={m.catalogo?.personas} tam={44} /></span>
        {v.trabalhando && <span className="vcard-trabalhando"><Girando /> {ROTULO_ETAPA[v.trabalhando] ?? v.trabalhando}</span>}
      </span>
      <span className="vcard-corpo">
        <span className="meta com-rosto"><Bandeira cod={v.idioma} /> {nomePersona(v.persona, m.catalogo?.personas)}<b>/</b>{quando(v.criado)}</span>
        <strong className="vcard-nome">{v.nome}</strong>
        <span className="meta">
          {v.palavras ? `${compacto(v.palavras)} palavras · ~${v.minutos} min` : "sem roteiro ainda"}
          {v.n_planos ? ` · ${v.n_planos} planos` : ""}
        </span>
        <span className="vcard-pe"><Trilha v={v} /><span className="meta">{prontas}/{v.etapas.length}</span></span>
      </span>
    </a>
  );
}

/** As melhores oportunidades produziveis de uma persona, com o botao de produzir. */
function Comecar({ m }: { m: MIN }) {
  const [persona, setPersona] = useState("kloster-moench");
  const [ops, setOps] = useState<Oportunidade[] | null>(null);
  const { rodando, rodar } = useAcao(m.avisar);
  useEffect(() => {
    setOps(null);
    obter<Oportunidade[]>(`/api/oportunidades?persona=${encodeURIComponent(persona)}&ordem=nota`)
      .then((r) => setOps(r.filter((o) => o.estado === "nova" || o.estado === "salva").slice(0, 8)))
      .catch((e) => m.avisar(String(e), "erro"));
  }, [persona, m.versaoOps, m.avisar]);
  const comOps = m.catalogo?.personas ?? [];
  const produzir = (o: Oportunidade) => rodar(`p${o.id}`, async () => {
    const v = await enviar<{ id: string }>("/api/videos", { op_id: o.id });
    window.location.hash = link.video(v.id);
  }, "Projeto criado: o Claude já está lendo o viral.");
  return (
    <section className="panel bloco">
      <div className="linha-titulo">
        <h3><Play size={18} aria-hidden /> Começar um vídeo</h3>
        <label className="sel-persona">
          <span className="label">Persona</span>
          <select className="campo" value={persona} onChange={(e) => setPersona(e.target.value)}>
            {comOps.map((p) => <option key={p.id} value={p.id}>{p.nome} ({p.idioma.toUpperCase()})</option>)}
          </select>
        </label>
      </div>
      {!ops ? <p className="meta">Carregando…</p> : !ops.length ? (
        <p className="meta">Nenhuma oportunidade produzível dessa persona. Garimpe primeiro.</p>
      ) : (
        <ul className="lista-comecar">
          {ops.map((o) => (
            <li key={o.id}>
              <a className="lc-capa" href={link.oportunidade(o.id)}>{o.thumb && <img src={o.thumb} alt="" loading="lazy" />}<Nota nota={o.nota} /></a>
              <span className="lc-meio">
                <strong>{o.titulo}</strong>
                <span className="meta">{compacto(o.views)} views<b>/</b>{o.canal}{o.fome >= 0 ? <><b>/</b><Flame size={11} aria-hidden /> fome {compacto(o.fome)}/ano</> : null}</span>
                {o.titulos[0] && <span className="lc-remake">→ {o.titulos[0]}</span>}
              </span>
              <button className="btn btn-primary btn-sm" disabled={!!rodando || !m.estado?.claude} onClick={() => produzir(o)}>
                {rodando === `p${o.id}` ? <Girando /> : <Clapperboard size={14} aria-hidden />}Produzir
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** O pipeline como roda hoje: cada etapa, onde roda e as regras que valem (motor/pipeline_video.py). */
function PipelineAtual({ m }: { m: MIN }) {
  const [p, setP] = useState<Pipeline | null>(null);
  useEffect(() => { obter<Pipeline>("/api/videos/pipeline").then(setP).catch((e) => m.avisar(String(e), "erro")); }, [m.avisar]);
  if (!p) return null;
  return (
    <section className="panel bloco pipeline">
      <div className="linha-titulo">
        <h3><Workflow size={18} aria-hidden /> O pipeline de produção</h3>
        <span className="meta">atualizado em {p.atualizado}</span>
      </div>
      <ol className="pipe-etapas">
        {p.etapas.map((e, i) => (
          <li key={e.id}>
            <details open={e.id === "avatar"}>
              <summary>
                <span className="pipe-num">{i + 1}</span>
                <b>{e.nome}</b>
                <span className="meta pipe-onde">{e.onde}</span>
                {e.regras.length > 0 && <span className="pipe-n">{e.regras.length} regra{e.regras.length > 1 ? "s" : ""}</span>}
              </summary>
              <p className="pipe-faz">{e.faz}</p>
              {e.regras.length > 0 && (
                <ul className="pipe-regras">
                  {e.regras.map((r, j) => <li key={j} className={r.startsWith("⭐") ? "nova" : ""}>{r.replace(/^⭐\s*/, "")}</li>)}
                </ul>
              )}
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Producao({ m }: { m: MIN }) {
  const [vs, setVs] = useState<ResumoVideo[] | null>(null);
  useEffect(() => {
    obter<ResumoVideo[]>("/api/videos").then(setVs).catch((e) => m.avisar(String(e), "erro"));
  }, [m.versaoProducao, m.avisar]);
  return (
    <div className="tela">
      <div className="tela-topo">
        <div>
          <p className="eyebrow">Produção</p>
          <h1>Do viral antigo ao vídeo, <em>no molde do Elias.</em></h1>
          <p className="lead">Cada vídeo parte de uma oportunidade: o Claude lê o viral original, tira o mecanismo, escreve o roteiro
            no molde medido nos 12 vídeos do Elias e corta a narração em planos de ~4 s. Depois vêm o avatar no Veo, a voz,
            o b-roll de terceiros revisado no olho e a montagem com a costura de montador, até o vídeo pronto.</p>
        </div>
      </div>
      {vs && vs.length > 0 && (
        <div className="grade-videos">{vs.map((v) => <CartaoVideo key={v.id} v={v} m={m} />)}</div>
      )}
      {vs && vs.length === 0 && <Vazio titulo="Nenhum vídeo ainda" texto="Escolha uma oportunidade abaixo para começar." />}
      <Comecar m={m} />
      <PipelineAtual m={m} />
    </div>
  );
}
