import { useEffect, useState } from "react";
import { obter, type Matriz as M } from "../api";
import type { MIN } from "../estado";
import { Flame } from "lucide-react";
import { Rosto, Selo, Vazio } from "../componentes/base";
import { link } from "../rota";
import { compacto, saturacao, tomDaNota } from "../textos";

export function Matriz({ m }: { m: MIN }) {
  const [d, setD] = useState<M | null>(null);
  useEffect(() => {
    obter<M>("/api/matriz").then(setD).catch((e) => m.avisar(String(e), "erro"));
  }, [m.versaoOps, m.avisar]);
  if (!d) return <div className="tela"><p className="meta">Carregando…</p></div>;

  const usadas = d.personas.filter((p) => d.celulas.some((c) => c.persona === p.id));
  const temas = d.temas.filter((t) => d.celulas.some((c) => c.tema === t));
  const cel = (p: string, t: string) => d.celulas.find((c) => c.persona === p && c.tema === t);
  // ⭐ o ranking da fome: a persona com mais demanda por remake existente vem primeiro
  const ranking = d.personas.map((p) => ({ p, r: d.resumo[p.id] })).filter((x) => x.r && x.r.fome >= 0)
    .sort((a, b) => b.r.fome - a.r.fome);
  const maxFome = Math.max(1, ...ranking.map((x) => x.r.fome));

  return (
    <div className="tela">
      <div>
        <p className="eyebrow">Matriz</p>
        <h1>Persona × tema</h1>
        <p className="lead">Onde cada persona tem mais oportunidade boa. A cor é a melhor nota da célula; o número é quantas oportunidades há nela. A saturação vem do Radar.</p>
      </div>
      {ranking.length > 0 && (
        <section className="panel bloco">
          <div className="linha-titulo"><h3><Flame size={18} aria-hidden /> Fome por persona</h3>
            <span className="meta">views das melhores ÷ (1 + remakes já feitos com a persona)</span></div>
          <ol className="ranking-fome">
            {ranking.map(({ p, r }) => (
              <li key={p.id}>
                <a className="rf-capa" href={r.melhor_id ? link.oportunidade(r.melhor_id) : link.oportunidades}>
                  {r.capa ? <img src={r.capa} alt="" loading="lazy" /> : null}
                </a>
                <div className="rf-meio">
                  <div className="linha-meta"><strong className="com-rosto"><Rosto pid={p.id} personas={m.catalogo?.personas} tam={22} />{p.nome}</strong>
                    <span className="meta">{compacto(r.fome)} · {r.remakes} remake(s) em {r.checados} checada(s)</span></div>
                  <div className="bar"><span style={{ width: `${(r.fome / maxFome) * 100}%` }} /></div>
                </div>
                <Selo status={saturacao(p.saturacao)} />
              </li>
            ))}
          </ol>
        </section>
      )}

      {!usadas.length ? (
        <Vazio titulo="A matriz ainda está vazia" texto="Ela enche quando o Claude classifica os temas das oportunidades. Rode um garimpo." />
      ) : (
        <div className="panel matriz-caixa">
          <table className="matriz">
            <thead>
              <tr><th scope="col" className="matriz-th">Persona</th>{temas.map((t) => <th key={t} scope="col">{t}</th>)}</tr>
            </thead>
            <tbody>
              {usadas.map((p) => (
                <tr key={p.id}>
                  <th scope="row" className="matriz-th">
                    <div className="matriz-persona">
                      <Rosto pid={p.id} personas={m.catalogo?.personas} tam={40} />
                      <div className="matriz-persona-txt">
                        <strong title={p.nome}>{p.nome}</strong>
                        <span className={`sat sat-${saturacao(p.saturacao).tom}`}>{saturacao(p.saturacao).texto}</span>
                      </div>
                    </div>
                  </th>
                  {temas.map((t) => {
                    const c = cel(p.id, t);
                    return (
                      <td key={t}>
                        {c ? (
                          <span className={`celula nota-${tomDaNota(c.maxima)}`} title={`${c.n} oportunidade(s) · melhor ${Math.round(c.maxima)} · média ${Math.round(c.media)}`}>
                            <b>{Math.round(c.maxima)}</b><small>{c.n}</small>
                          </span>
                        ) : <span className="celula vazia">·</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
