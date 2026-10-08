import { useMemo, useState } from "react";
import { ChevronDown, Gem, Pickaxe, Square } from "lucide-react";
import { CODIGOS, enviar, type Filtros, type Garimpo as G } from "../api";
import type { MIN } from "../estado";
import { Girando, Selo, useAcao } from "../componentes/base";
import { link } from "../rota";
import { nomePersona, numero, quando, saturacao, statusDoGarimpo } from "../textos";

// ⭐ sementes que viralizavam antes da era da IA: um ponto de partida, a pessoa troca
const SUGESTOES = [
  "how to pick a watermelon", "garden pests naturally", "bread from scratch", "save money on electricity",
  "raised bed garden", "cast iron skillet", "root cellar", "how to sharpen a knife", "survival skills",
  "homemade remedies", "canning vegetables", "keep chickens", "fix a leaky faucet", "grow tomatoes",
];

function custo(n: number, f: Filtros) {
  return n * 102 + f.remakes * 101;
}

function LinhaGarimpo({ g, m }: { g: G; m: MIN }) {
  const { rodando, rodar } = useAcao(m.avisar);
  const st = statusDoGarimpo(g.estado);
  const vivo = g.estado === "fila" || g.estado === "rodando";
  return (
    <div className="panel attn garimpo-linha">
      <Selo status={st} />
      <div className="attn-texto">
        <strong>#{g.id} · {nomePersona(g.persona, m.catalogo?.personas)} · {g.sementes.join(", ")}</strong>
        <p className="meta">
          {quando(g.criado)}<b>/</b>{g.achados} oportunidade(s)<b>/</b>{numero(g.cota)} unidades
          {g.etapa && <><b>/</b>{g.etapa}</>}
          {g.erro && <><b>/</b><span className="erro-txt">{g.erro}</span></>}
        </p>
      </div>
      <div className="attn-acoes">
        {vivo && (
          <button className="btn btn-stop btn-sm" disabled={!!rodando}
                  onClick={() => rodar("c", () => enviar(`/api/garimpos/${g.id}/cancelar`))}>
            {rodando ? <Girando /> : <Square size={13} aria-hidden />}Cancelar
          </button>
        )}
        {g.achados > 0 && (
          <a className="btn btn-ghost btn-sm" href={link.doGarimpo(g.id)}><Gem size={14} aria-hidden />Ver</a>
        )}
      </div>
    </div>
  );
}

export function Garimpo({ m }: { m: MIN }) {
  const cat = m.catalogo;
  const [texto, setTexto] = useState("");
  const [persona, setPersona] = useState("amish");
  const [livre, setLivre] = useState("");
  const [avancado, setAvancado] = useState(false);
  const [f, setF] = useState<Filtros | null>(null);
  const filtros = f ?? cat?.filtros ?? null;
  const { rodando, rodar } = useAcao(m.avisar);

  const sementes = useMemo(() => texto.split(/\n|;/).map((s) => s.trim()).filter(Boolean), [texto]);
  const pid = persona === "__livre" ? livre.trim() : persona;
  const idiomas = (filtros?.idiomas ?? "").split(",").filter(Boolean);
  const gasto = filtros ? custo(sementes.length, filtros) + filtros.equivalentes * idiomas.length * 101 : 0;
  const livres = m.estado?.cota.livres ?? 0;

  const mudar = <K extends keyof Filtros>(k: K, v: Filtros[K]) => filtros && setF({ ...filtros, [k]: v });
  const alternarIdioma = (c: string) => {
    const novo = idiomas.includes(c) ? idiomas.filter((x) => x !== c) : [...idiomas, c];
    mudar("idiomas", novo.join(","));
  };
  const addSemente = (s: string) => setTexto((t) => (t.trim() ? `${t.trim()}\n${s}` : s));

  return (
    <div className="tela">
      <div>
        <p className="eyebrow">Garimpo</p>
        <h1>Novo garimpo</h1>
        <p className="lead">Escreva assuntos que viralizavam antes de 2022 (em inglês, um por linha). O Minerador acha os virais, mede o quanto passaram do canal, procura quem já remakou com a persona e pede ao Claude os títulos novos.</p>
      </div>

      <form className="panel bloco form-garimpo" onSubmit={(e) => {
        e.preventDefault();
        if (!sementes.length || !pid) return;
        void rodar("g", () => enviar("/api/garimpos", { sementes, persona: pid, filtros }), "Garimpo na fila.")
          .then((ok) => ok && setTexto(""));
      }}>
        <div className="campo-grupo">
          <label className="label" htmlFor="sementes">Sementes</label>
          <textarea id="sementes" className="campo" rows={5} value={texto} onChange={(e) => setTexto(e.target.value)}
                    placeholder={"how to pick a watermelon\ngarden pests naturally"} />
          <div className="sugestoes">
            {SUGESTOES.filter((s) => !sementes.includes(s)).slice(0, 10).map((s) => (
              <button key={s} type="button" className="filtro" onClick={() => addSemente(s)}>+ {s}</button>
            ))}
          </div>
        </div>

        <fieldset className="escolhas">
          <legend className="label">Persona</legend>
          <div className="personas">
            {cat?.personas.map((p) => {
              const sat = saturacao(p.saturacao);
              return (
                <label key={p.id} className="escolha persona-op">
                  <input type="radio" name="persona" value={p.id} checked={persona === p.id} onChange={() => setPersona(p.id)} />
                  <span className="escolha-texto"><strong>{p.nome}</strong><small>{p.quem}</small></span>
                  <span className={`sat sat-${sat.tom}`}>{sat.texto}</span>
                </label>
              );
            })}
            <label className="escolha persona-op">
              <input type="radio" name="persona" value="__livre" checked={persona === "__livre"} onChange={() => setPersona("__livre")} />
              <span className="escolha-texto"><strong>Outra</strong>
                <input className="campo campo-livre" placeholder="ex.: Navy SEAL, Japanese Grandpa" value={livre}
                       onFocus={() => setPersona("__livre")} onChange={(e) => setLivre(e.target.value)} /></span>
            </label>
          </div>
        </fieldset>

        <div className="idiomas-linha">
          <span className="idiomas-rotulo">Idiomas</span>
          <span className="idioma-chip fixo">EN</span>
          {CODIGOS.map((c) => (
            <button key={c} type="button" className="idioma-chip" aria-pressed={idiomas.includes(c)} onClick={() => alternarIdioma(c)}>
              {c.toUpperCase()}
            </button>
          ))}
          <span className="meta">as {filtros?.equivalentes ?? 0} melhores ganham título local, busca nativa e o vão de oferta em cada idioma</span>
        </div>

        <button type="button" className="btn btn-quiet btn-sm avancado-btn" aria-expanded={avancado} onClick={() => setAvancado(!avancado)}>
          <ChevronDown size={14} className={avancado ? "girado" : ""} aria-hidden />Filtros
        </button>
        {avancado && filtros && (
          <div className="duas quatro">
            <label className="campo-grupo"><span className="label">Viral antes de</span>
              <input className="campo" type="date" value={filtros.antes} onChange={(e) => mudar("antes", e.target.value)} /></label>
            <label className="campo-grupo"><span className="label">Views mínimas</span>
              <input className="campo" type="number" min={10000} step={100000} value={filtros.min_views}
                     onChange={(e) => mudar("min_views", Number(e.target.value))} /></label>
            <label className="campo-grupo"><span className="label">Checar remakes (top)</span>
              <input className="campo" type="number" min={0} max={30} value={filtros.remakes}
                     onChange={(e) => mudar("remakes", Number(e.target.value))} /></label>
            <label className="campo-grupo"><span className="label">Reescrever (top)</span>
              <input className="campo" type="number" min={0} max={40} value={filtros.reescrever}
                     onChange={(e) => mudar("reescrever", Number(e.target.value))} /></label>
            <label className="campo-grupo"><span className="label">FR/DE (top)</span>
              <input className="campo" type="number" min={0} max={10} value={filtros.equivalentes}
                     onChange={(e) => mudar("equivalentes", Number(e.target.value))} /></label>
          </div>
        )}

        <div className="turbo-acoes">
          <p className={`meta${gasto > livres ? " erro-txt" : ""}`}>
            {sementes.length} semente(s) · até {numero(gasto)} unidades · {numero(livres)} livres hoje
          </p>
          <button className="btn btn-primary" disabled={!sementes.length || !pid || !!rodando}>
            {rodando ? <Girando /> : <Pickaxe size={16} aria-hidden />}Garimpar
          </button>
        </div>
      </form>

      <section>
        <h2 className="linha-titulo">Garimpos</h2>
        {m.garimpos.length ? (
          <div className="lista-atencao">{m.garimpos.map((g) => <LinhaGarimpo key={g.id} g={g} m={m} />)}</div>
        ) : <p className="meta">Nenhum garimpo ainda.</p>}
      </section>
    </div>
  );
}
