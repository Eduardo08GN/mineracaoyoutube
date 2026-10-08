import { useEffect, useState } from "react";
import { ArrowRight, Flame, Languages } from "lucide-react";
import { CODIGOS, NOME_IDIOMA, obter, urlRetrato, type CelulaMapa, type LinhaMapa, type Mapa as M, type Persona } from "../api";
import type { MIN } from "../estado";
import { Nota, Selo, Bandeira } from "../componentes/base";
import { link } from "../rota";
import { compacto, saturacao } from "../textos";

type Filtro = "todos" | "comuns" | "pares" | "exclusivos";

function Celula({ c, cod, personas }: { c: CelulaMapa | undefined; cod: string; personas?: Persona[] }) {
  if (!c) return <div className="mapa-cel vazia" aria-label={`não existe em ${cod}`}><span>—</span></div>;
  const capa = c.capa || c.equiv?.capa || "";
  const p = personas?.find((x) => x.id === c.persona.id);
  const rosto = p ? urlRetrato(p) : "";
  const destino = c.melhor_id ? link.oportunidade(c.melhor_id) : c.equiv?.op_id ? link.oportunidade(c.equiv.op_id) : undefined;
  const sat = saturacao(c.saturacao);
  const Conteudo = (
    <>
      <span className="mapa-capa">
        {rosto ? <img src={rosto} alt="" loading="lazy" /> : capa ? <img src={capa} alt="" loading="lazy" /> : <span className="mapa-sem">sem retrato</span>}
        {rosto && capa && <img className="mapa-video" src={capa} alt="" loading="lazy" title="a melhor oportunidade" />}
        {c.melhor >= 0 && <Nota nota={c.melhor} />}
        {!capa && <span className="mapa-sem-garimpo">ainda sem garimpo</span>}
      </span>
      <strong className="mapa-nome">{c.persona.nome}</strong>
      <span className={`sat sat-${sat.tom}`}>{sat.texto}</span>
      <span className="mapa-linhas">
        {c.n > 0 && <span><Flame size={11} aria-hidden /> {c.n} nativa(s){c.fome >= 0 ? ` · fome ${compacto(c.fome)}` : ""}</span>}
        {c.equiv && <span><Languages size={11} aria-hidden /> {c.equiv.n} equiv. · {c.equiv.abertos} aberto(s) · viral {compacto(c.equiv.melhor)}</span>}
      </span>
    </>
  );
  return destino ? <a className="mapa-cel" href={destino}>{Conteudo}</a> : <div className="mapa-cel">{Conteudo}</div>;
}

function Presenca({ l }: { l: LinhaMapa }) {
  return (
    <span className="presenca" aria-label={`existe em ${Object.keys(l.paises).join(", ")}`}>
      {CODIGOS.map((c) => <i key={c} className={l.paises[c] ? "on" : ""} title={NOME_IDIOMA[c]} />)}
    </span>
  );
}

/** O diagrama de Venn das personas em grade: cada arquetipo veste uma persona local em cada mercado. */
export function Mapa({ m }: { m: MIN }) {
  const [d, setD] = useState<M | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  useEffect(() => {
    obter<M>("/api/mapa").then(setD).catch((e) => m.avisar(String(e), "erro"));
  }, [m.versaoOps, m.versaoRadar, m.avisar]);
  if (!d) return <div className="tela"><p className="meta">Carregando…</p></div>;

  const conta = (f: Filtro) => d.arquetipos.filter((l) => passa(l, f)).length;
  const linhas = d.arquetipos.filter((l) => passa(l, filtro));
  return (
    <div className="tela">
      <div className="tela-topo">
        <div>
          <p className="eyebrow">Mapa de personas</p>
          <h1>A persona não se traduz, <em>se veste.</em></h1>
          <p className="lead">Cada linha é um arquétipo; cada coluna, um mercado. "A avó dos tempos difíceis" é a Depression-era Grandma nos EUA, a Mémé de l'Occupation na França, a Nachkriegs-Oma na Alemanha e a Abuela de la posguerra na Espanha. As exclusivas só existem num mercado — é onde a oferta costuma ser zero.</p>
        </div>
      </div>

      <div className="filtros" role="group" aria-label="Região do diagrama">
        {([["todos", "Todos"], ["comuns", "Comuns aos 4"], ["pares", "Em 2 ou 3 mercados"], ["exclusivos", "Exclusivos"]] as [Filtro, string][]).map(([f, t]) => (
          <button key={f} className="filtro" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>{t}<span>{conta(f)}</span></button>
        ))}
      </div>

      <div className="panel mapa">
        <div className="mapa-cabeca">
          <span className="label">Arquétipo</span>
          {CODIGOS.map((c) => <span key={c} className="mapa-pais"><Bandeira cod={c} />{NOME_IDIOMA[c]}</span>)}
        </div>
        {linhas.map((l) => (
          <div key={l.id} className="mapa-linha">
            <div className="mapa-arq">
              <strong>{l.nome}</strong>
              <span className={`regiao regiao-${l.comum}`}>{l.regiao}</span>
              <Presenca l={l} />
            </div>
            {CODIGOS.map((c) => <Celula key={c} c={l.paises[c]} cod={c} personas={m.catalogo?.personas} />)}
          </div>
        ))}
      </div>
      <p className="meta">Clique numa célula para abrir a melhor oportunidade dela. <a href={link.garimpo} className="link-btn">Garimpar uma persona <ArrowRight size={12} aria-hidden /></a></p>
      <div className="legenda-sat">
        <Selo status={{ tom: "ok", texto: "aberta" }} /><Selo status={{ tom: "voce", texto: "esquentando" }} />
        <Selo status={{ tom: "no", texto: "lotada" }} /><Selo status={{ tom: "fila", texto: "radar não rodou" }} />
      </div>
    </div>
  );
}

function passa(l: LinhaMapa, f: Filtro) {
  if (f === "comuns") return l.comum === CODIGOS.length;
  if (f === "pares") return l.comum > 1 && l.comum < CODIGOS.length;
  if (f === "exclusivos") return l.comum === 1;
  return true;
}
