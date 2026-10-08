import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Gem, Pickaxe, Square } from "lucide-react";
import { CODIGOS, enviar, NOME_IDIOMA, type CodIdioma, type Filtros, type Garimpo as G, type Persona } from "../api";
import type { MIN } from "../estado";
import { Girando, Selo, useAcao, Bandeira } from "../componentes/base";
import { link } from "../rota";
import { nomePersona, numero, quando, saturacao, statusDoGarimpo } from "../textos";

const EXEMPLO: Record<CodIdioma, string> = {
  en: "how to pick a watermelon\ngarden pests naturally",
  fr: "recette de grand-mère\npotager facile",
  de: "omas rezepte\ngemüsegarten anlegen",
  es: "recetas de la abuela\nhuerto en casa",
};

/** O mesmo calculo do motor (garimpo.custo_estimado): buscas + remakes + equivalencias nos outros mercados. */
function custo(n: number, f: Filtros, destinos: number) {
  return n * 102 + f.remakes * 101 + f.equivalentes * destinos * 102;
}

function LinhaGarimpo({ g, m }: { g: G; m: MIN }) {
  const { rodando, rodar } = useAcao(m.avisar);
  const st = statusDoGarimpo(g.estado);
  const vivo = g.estado === "fila" || g.estado === "rodando";
  const p = m.catalogo?.personas.find((x) => x.id === g.persona);
  return (
    <div className="panel attn garimpo-linha">
      <Selo status={st} />
      <div className="attn-texto">
        <strong>#{g.id} · {p ? <Bandeira cod={p.idioma} /> : null} {nomePersona(g.persona, m.catalogo?.personas)} · {g.sementes.join(", ")}</strong>
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

function CartaoPersona({ p, ativa, escolher, arquetipo }: { p: Persona; ativa: boolean; escolher: () => void; arquetipo?: string }) {
  const sat = saturacao(p.saturacao);
  return (
    <label className="escolha persona-op">
      <input type="radio" name="persona" value={p.id} checked={ativa} onChange={escolher} />
      <span className="escolha-texto">
        <strong>{p.nome}</strong>
        {arquetipo && <span className="arq-tag">{arquetipo}</span>}
        <small>{p.quem}</small>
      </span>
      <span className={`sat sat-${sat.tom}`}>{sat.texto}</span>
    </label>
  );
}

export function Garimpo({ m }: { m: MIN }) {
  const cat = m.catalogo;
  const [mercado, setMercado] = useState<CodIdioma>("en");
  const [texto, setTexto] = useState("");
  const [persona, setPersona] = useState("amish");
  const [livre, setLivre] = useState("");
  const [avancado, setAvancado] = useState(false);
  const [f, setF] = useState<Filtros | null>(null);
  const filtros = f ?? cat?.filtros ?? null;
  const { rodando, rodar } = useAcao(m.avisar);

  const personas = (cat?.personas ?? []).filter((p) => p.idioma === mercado);
  // ⭐ trocar de mercado troca as personas, as sementes sugeridas e as views minimas de partida
  useEffect(() => {
    const primeira = (cat?.personas ?? []).find((p) => p.idioma === mercado);
    if (primeira && !personas.some((p) => p.id === persona)) setPersona(primeira.id);
    if (cat && filtros) setF({ ...filtros, min_views: cat.min_views[mercado] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mercado, cat]);

  const sementes = useMemo(() => texto.split(/\n|;/).map((s) => s.trim()).filter(Boolean), [texto]);
  const pid = persona === "__livre" ? livre.trim() : persona;
  const idiomas = (filtros?.idiomas ?? "").split(",").filter(Boolean);
  const destinos = idiomas.filter((c) => c !== mercado);
  const gasto = filtros ? custo(sementes.length, filtros, destinos.length) : 0;
  const livres = m.estado?.cota.livres ?? 0;

  const mudar = <K extends keyof Filtros>(k: K, v: Filtros[K]) => filtros && setF({ ...filtros, [k]: v });
  const alternarIdioma = (c: string) => {
    const novo = idiomas.includes(c) ? idiomas.filter((x) => x !== c) : [...idiomas, c];
    mudar("idiomas", novo.join(","));
  };
  const addSemente = (s: string) => setTexto((t) => (t.trim() ? `${t.trim()}\n${s}` : s));
  const comuns = personas.filter((p) => (cat?.personas ?? []).some((q) => q.arquetipo === p.arquetipo && q.idioma !== p.idioma));
  const exclusivas = personas.filter((p) => !comuns.includes(p));

  return (
    <div className="tela">
      <div className="tela-topo">
        <div>
          <p className="eyebrow">Garimpo</p>
          <h1>Novo garimpo</h1>
          <p className="lead">Escolha o mercado: a busca, as sementes, as personas e o idioma dos títulos passam a ser os dele. O Minerador acha os virais antigos, mede o quanto passaram do canal, procura quem já remakou com a persona e veste a oportunidade nos outros mercados.</p>
        </div>
      </div>

      <form className="panel bloco form-garimpo" onSubmit={(e) => {
        e.preventDefault();
        if (!sementes.length || !pid) return;
        void rodar("g", () => enviar("/api/garimpos", { sementes, persona: pid, filtros }), "Garimpo na fila.")
          .then((ok) => ok && setTexto(""));
      }}>
        <div className="mercados" role="radiogroup" aria-label="Mercado">
          {CODIGOS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={mercado === c} className="mercado" onClick={() => setMercado(c)}>
              <Bandeira cod={c} h={22} />
              <span><strong>{NOME_IDIOMA[c]}</strong><small>{(cat?.personas ?? []).filter((p) => p.idioma === c).length} personas</small></span>
            </button>
          ))}
        </div>

        <div className="campo-grupo">
          <label className="label" htmlFor="sementes">Sementes em {NOME_IDIOMA[mercado].toLowerCase()} (uma por linha)</label>
          <textarea id="sementes" className="campo" rows={4} value={texto} onChange={(e) => setTexto(e.target.value)}
                    placeholder={EXEMPLO[mercado]} />
          <div className="sugestoes">
            {(cat?.sementes[mercado] ?? []).filter((s) => !sementes.includes(s)).slice(0, 10).map((s) => (
              <button key={s} type="button" className="filtro" onClick={() => addSemente(s)}>+ {s}</button>
            ))}
          </div>
        </div>

        <fieldset className="escolhas">
          <legend className="label">Persona · arquétipos que existem em outros mercados</legend>
          <div className="personas">
            {comuns.map((p) => <CartaoPersona key={p.id} p={p} ativa={persona === p.id} escolher={() => setPersona(p.id)}
                                              arquetipo={cat?.arquetipos[p.arquetipo]} />)}
          </div>
        </fieldset>
        {exclusivas.length > 0 && (
          <fieldset className="escolhas">
            <legend className="label">Só neste mercado</legend>
            <div className="personas">
              {exclusivas.map((p) => <CartaoPersona key={p.id} p={p} ativa={persona === p.id} escolher={() => setPersona(p.id)} />)}
              {mercado === "en" && (
                <label className="escolha persona-op">
                  <input type="radio" name="persona" value="__livre" checked={persona === "__livre"} onChange={() => setPersona("__livre")} />
                  <span className="escolha-texto"><strong>Outra</strong>
                    <input className="campo campo-livre" placeholder="ex.: Navy SEAL, Japanese Grandpa" value={livre}
                           onFocus={() => setPersona("__livre")} onChange={(e) => setLivre(e.target.value)} /></span>
                </label>
              )}
            </div>
          </fieldset>
        )}

        <div className="idiomas-linha">
          <span className="idiomas-rotulo">Vestir também em</span>
          {CODIGOS.filter((c) => c !== mercado).map((c) => (
            <button key={c} type="button" className="idioma-chip" aria-pressed={idiomas.includes(c)} onClick={() => alternarIdioma(c)}>
              <Bandeira cod={c} h={11} /> {c.toUpperCase()}
            </button>
          ))}
          <span className="meta">as {filtros?.equivalentes ?? 0} melhores ganham a persona local, título nativo, busca nativa e o vão de oferta</span>
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
            <label className="campo-grupo"><span className="label">Vestir nos outros (top)</span>
              <input className="campo" type="number" min={0} max={10} value={filtros.equivalentes}
                     onChange={(e) => mudar("equivalentes", Number(e.target.value))} /></label>
          </div>
        )}

        <div className="turbo-acoes">
          <p className={`meta${gasto > livres ? " erro-txt" : ""}`}>
            {sementes.length} semente(s) · até {numero(gasto)} unidades · {numero(livres)} livres hoje em {m.estado?.cota.chaves?.length ?? 1} chave(s)
          </p>
          <button className="btn btn-primary" disabled={!sementes.length || !pid || !!rodando}>
            {rodando ? <Girando /> : <Pickaxe size={16} aria-hidden />}Garimpar em <Bandeira cod={mercado} h={12} />
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
