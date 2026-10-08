import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Check, Circle, Pickaxe } from "lucide-react";
import { obter, type Oportunidade } from "../api";
import type { Linha, MIN } from "../estado";
import { BarraCota, CardOportunidade, Vazio } from "../componentes/base";
import { link } from "../rota";
import { nomePersona } from "../textos";

function Atividade({ linhas }: { linhas: Linha[] }) {
  const visiveis = linhas.slice(0, 8);
  if (!visiveis.length) return <p className="meta feed-vazio">Nada aconteceu desde que o painel abriu.</p>;
  return (
    <ul className="feed">
      {visiveis.map((l, i) => {
        const ruim = /⚠|falhou|parou|acabou/i.test(l.texto);
        const bom = /terminou|reescreveu|gravadas|passaram|canal\(is\) novo/i.test(l.texto);
        return (
          <li key={i}>
            <time>{l.hora}</time>
            {ruim ? <AlertTriangle size={14} className="warn" aria-hidden /> :
             bom ? <Check size={14} className="ok" aria-hidden /> :
             <Circle size={8} className="neutro" aria-hidden />}
            <span>{l.texto}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function Painel({ m }: { m: MIN }) {
  const [top, setTop] = useState<Oportunidade[]>([]);
  useEffect(() => {
    obter<Oportunidade[]>("/api/oportunidades?ordem=nota").then((r) => setTop(r.slice(0, 6))).catch(() => undefined);
  }, [m.versaoOps]);
  const e = m.estado;
  const atual = e?.atual;
  const c = e?.contagem ?? {};
  return (
    <div className="tela">
      <div className="tela-topo">
        <div>
          <p className="eyebrow">Minerador de nichos</p>
          <h1>Virais antigos, <em>personas novas.</em></h1>
          <p className="lead">Ache o vídeo que já provou demanda antes da era da IA, reembale com uma persona e venda o seu produto no fim.</p>
        </div>
        <a className="btn btn-primary" href={link.garimpo}><Pickaxe size={16} aria-hidden />Novo garimpo</a>
      </div>

      <section className={`panel pilot${atual ? "" : " is-off"}`} aria-label="Agora">
        <div className="pilot-l">
          <div className="pilot-state">
            <span className="live" aria-hidden />
            <div>
              <h3>{atual ? (atual.tipo === "radar" ? "Radar procurando" : `Garimpo #${atual.id} rodando`) : "Parado"}</h3>
              <p>{atual ? `${nomePersona(atual.persona, m.catalogo?.personas)} · ${atual.etapa}` :
                e?.na_fila ? `${e.na_fila} na fila` : "Nenhum garimpo rodando. Comece um novo quando quiser."}</p>
            </div>
          </div>
          <div className="metrics">
            <div><span className="label">Novas</span><span className="num accent">{c.nova ?? 0}</span></div>
            <div><span className="label">Salvas</span><span className="num">{c.salva ?? 0}</span></div>
            <div><span className="label">Produzidas</span><span className="num">{c.produzida ?? 0}</span></div>
            <div><span className="label">Garimpos</span><span className="num">{m.garimpos.length}</span></div>
          </div>
          {e && <BarraCota cota={e.cota} />}
        </div>
        <div className="pilot-r">
          <span className="label">Atividade</span>
          <Atividade linhas={m.registro} />
        </div>
      </section>

      {e && !e.claude && (
        <div className="panel attn">
          <span className="ico-box"><AlertTriangle size={18} aria-hidden /></span>
          <div className="attn-texto">
            <strong>O Claude Code não foi achado nesta máquina</strong>
            <p>O garimpo funciona, mas os títulos não são reescritos e a nota fica sem o encaixe da persona.</p>
          </div>
        </div>
      )}

      <section>
        <div className="linha-titulo">
          <h2>As melhores até agora</h2>
          <a className="btn btn-quiet btn-sm" href={link.oportunidades}>Ver todas<ArrowRight size={14} aria-hidden /></a>
        </div>
        {top.length ? (
          <div className="grade-ops">{top.map((o) => <CardOportunidade key={o.id} o={o} personas={m.catalogo?.personas} />)}</div>
        ) : (
          <Vazio titulo="Nenhuma oportunidade ainda" texto="Rode o primeiro garimpo: escreva sementes (assuntos que viralizavam antes de 2022) e escolha uma persona.">
            <a className="btn btn-primary" href={link.garimpo}><Pickaxe size={16} aria-hidden />Começar</a>
          </Vazio>
        )}
      </section>
    </div>
  );
}
