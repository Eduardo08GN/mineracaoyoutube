import { useEffect, useState } from "react";
import { obter, type EstadoOp, type Oportunidade } from "../api";
import type { MIN } from "../estado";
import { CardOportunidade, Vazio } from "../componentes/base";
import { link } from "../rota";
import { ROTULO_OP } from "../textos";

const ORDENS = [["nota", "Nota"], ["views", "Views"], ["outlier", "Outlier"], ["recente", "Recentes"]] as const;
const ESTADOS: ("" | EstadoOp)[] = ["", "nova", "salva", "produzida", "descartada", "inviavel"];

export function Oportunidades({ m, garimpo }: { m: MIN; garimpo: number }) {
  const [lista, setLista] = useState<Oportunidade[] | null>(null);
  const [persona, setPersona] = useState("");
  const [estado, setEstado] = useState<"" | EstadoOp>("");
  const [ordem, setOrdem] = useState<string>("nota");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const q = new URLSearchParams({ persona, estado, ordem, garimpo: String(garimpo || 0) });
    obter<Oportunidade[]>(`/api/oportunidades?${q}`).then(setLista).catch((e) => m.avisar(String(e), "erro"));
  }, [persona, estado, ordem, garimpo, m.versaoOps, m.avisar]);

  const personasUsadas = m.catalogo?.personas ?? [];
  const b = busca.trim().toLowerCase();
  const vistas = (lista ?? []).filter((o) => !b || o.titulo.toLowerCase().includes(b) || o.titulos.some((t) => t.toLowerCase().includes(b)));

  return (
    <div className="tela">
      <div className="tela-topo">
        <div>
          <p className="eyebrow">Oportunidades</p>
          <h1>{garimpo ? <>Do garimpo <em>#{garimpo}</em></> : "Tudo o que o garimpo achou"}</h1>
        </div>
        {garimpo > 0 && <a className="btn btn-ghost btn-sm" href={link.oportunidades}>Ver todas</a>}
      </div>

      <div className="barra-filtros">
        <div className="filtros" role="group" aria-label="Estado">
          {ESTADOS.map((e) => (
            <button key={e || "todas"} className="filtro" aria-pressed={estado === e} onClick={() => setEstado(e)}>
              {e ? ROTULO_OP[e] : "Ativas"}
            </button>
          ))}
        </div>
        <div className="filtros-dir">
          <select className="campo campo-sm" value={persona} onChange={(e) => setPersona(e.target.value)} aria-label="Persona">
            <option value="">Todas as personas</option>
            {personasUsadas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <div className="seg" role="group" aria-label="Ordem">
            {ORDENS.map(([k, t]) => <button key={k} aria-pressed={ordem === k} onClick={() => setOrdem(k)}>{t}</button>)}
          </div>
          <input className="campo campo-sm" placeholder="Buscar título" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      {lista === null ? <p className="meta">Carregando…</p> : vistas.length ? (
        <div className="grade-ops">{vistas.map((o) => <CardOportunidade key={o.id} o={o} personas={m.catalogo?.personas} />)}</div>
      ) : (
        <Vazio titulo="Nada por aqui" texto="Mude os filtros ou rode um garimpo novo." />
      )}
    </div>
  );
}
