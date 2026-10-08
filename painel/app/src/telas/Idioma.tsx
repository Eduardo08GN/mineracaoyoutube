import { useEffect, useState } from "react";
import { ArrowRight, Flame } from "lucide-react";
import { obter, type CodIdioma, type EquivalenteLista } from "../api";
import type { MIN } from "../estado";
import { Nota, Selo, SiglaIdioma, Vazio, VideoThumb } from "../componentes/base";
import { veredito } from "../componentes/equivalente";
import { link } from "../rota";
import { compacto, nomePersona } from "../textos";

const NOMES: Record<CodIdioma, string> = { fr: "Francês", de: "Alemão" };

export function Idioma({ m, cod }: { m: MIN; cod: CodIdioma }) {
  const [lista, setLista] = useState<EquivalenteLista[] | null>(null);
  const [soAbertos, setSoAbertos] = useState(false);
  useEffect(() => {
    setLista(null);
    obter<EquivalenteLista[]>(`/api/idiomas/${cod}`).then(setLista).catch((e) => m.avisar(String(e), "erro"));
  }, [cod, m.versaoOps, m.avisar]);

  const vistas = (lista ?? []).filter((e) => !soAbertos || e.aberto);
  const abertos = (lista ?? []).filter((e) => e.aberto).length;
  return (
    <div className="tela">
      <div className="tela-topo">
        <div>
          <p className="eyebrow"><SiglaIdioma cod={cod} /> Equivalências</p>
          <h1>{NOMES[cod]} · <em>{abertos} vão(s) aberto(s)</em></h1>
          <p className="lead">As melhores oportunidades do inglês, refeitas para quem fala {NOMES[cod].toLowerCase()}: título local, a busca que o nativo digita, o maior viral nativo e se alguém já faz com a persona por lá.</p>
        </div>
        <div className="filtros">
          <button className="filtro" aria-pressed={!soAbertos} onClick={() => setSoAbertos(false)}>Todas<span>{lista?.length ?? 0}</span></button>
          <button className="filtro" aria-pressed={soAbertos} onClick={() => setSoAbertos(true)}>Vão aberto<span>{abertos}</span></button>
        </div>
      </div>

      {lista === null ? <p className="meta">Carregando…</p> : vistas.length ? (
        <div className="lista-equiv">
          {vistas.map((e) => (
            <article key={`${e.op_id}-${e.idioma}`} className={`panel equiv-linha${e.aberto ? " is-aberto" : ""}`}>
              <div className="equiv-capa">
                {e.top[0] ? <VideoThumb v={e.top[0]} grande rotulo={<span className="selo-capa">viral nativo</span>} /> :
                  <div className="stage-vazio">sem viral nativo</div>}
              </div>
              <div className="equiv-corpo">
                <div className="row">
                  <Nota nota={e.nota} />
                  <Selo status={veredito(e)} />
                  <span className="meta">{nomePersona(e.persona, m.catalogo?.personas)}</span>
                </div>
                <h3 className="equiv-titulo-grande">{e.titulo || "—"}</h3>
                <div className="de-onde">
                  <img src={e.thumb} alt="" loading="lazy" />
                  <div>
                    <span className="label">Original em inglês · {compacto(e.views)} views</span>
                    <p>{e.original}</p>
                    {e.titulos[0] && <p className="meta">→ {e.titulos[0]}</p>}
                  </div>
                </div>
                <div className="equiv-numeros">
                  <div><span className="label">Viral nativo</span><span className="num">{compacto(e.demanda)}</span></div>
                  <div><span className="label">Novos 12m</span><span className="num">{e.oferta_recente}</span></div>
                  <div><span className="label">Com persona</span><span className={`num${e.com_persona ? " erro-txt" : " accent"}`}>{e.com_persona}</span></div>
                  <div><span className="label"><Flame size={11} aria-hidden /> Fome</span><span className="num">{compacto(e.fome)}</span></div>
                </div>
                <a className="btn btn-ghost btn-sm" href={link.oportunidade(e.op_id)}>Abrir oportunidade<ArrowRight size={14} aria-hidden /></a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Vazio titulo={`Nenhuma equivalência em ${NOMES[cod].toLowerCase()} ainda`}
               texto="O garimpo gera equivalências para as melhores oportunidades. Você também pode gerar na página de cada oportunidade." />
      )}
    </div>
  );
}
