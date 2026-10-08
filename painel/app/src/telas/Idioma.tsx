import { useEffect, useState } from "react";
import { ArrowRight, Flame, Pickaxe } from "lucide-react";
import { NOME_IDIOMA, obter, type CodIdioma, type EquivalenteLista, type Oportunidade } from "../api";
import type { MIN } from "../estado";
import { CardOportunidade, Nota, Selo, SiglaIdioma, Vazio, VideoThumb, Bandeira } from "../componentes/base";
import { veredito } from "../componentes/equivalente";
import { link } from "../rota";
import { compacto, nomePersona } from "../textos";

type Aba = "nativas" | "equivalencias";

/** Um mercado: o que o garimpo nativo achou nele e o que veio de outros mercados vestido com a persona local. */
export function Idioma({ m, cod }: { m: MIN; cod: CodIdioma }) {
  const [aba, setAba] = useState<Aba>(cod === "en" ? "nativas" : "equivalencias");
  const [eqs, setEqs] = useState<EquivalenteLista[] | null>(null);
  const [nativas, setNativas] = useState<Oportunidade[] | null>(null);
  const [soAbertos, setSoAbertos] = useState(false);

  useEffect(() => { setAba(cod === "en" ? "nativas" : "equivalencias"); }, [cod]);
  useEffect(() => {
    setEqs(null); setNativas(null);
    obter<EquivalenteLista[]>(`/api/idiomas/${cod}`).then(setEqs).catch((e) => m.avisar(String(e), "erro"));
    obter<Oportunidade[]>(`/api/oportunidades?idioma=${cod}`).then(setNativas).catch(() => setNativas([]));
  }, [cod, m.versaoOps, m.avisar]);

  const vistas = (eqs ?? []).filter((e) => !soAbertos || e.aberto);
  const abertos = (eqs ?? []).filter((e) => e.aberto).length;
  const personas = m.catalogo?.personas ?? [];
  return (
    <div className="tela">
      <div className="tela-topo">
        <div>
          <p className="eyebrow"><Bandeira cod={cod} /> Mercado</p>
          <h1>{NOME_IDIOMA[cod]} · <em>{abertos} vão(s) aberto(s)</em></h1>
          <p className="lead">O garimpo nativo (virais antigos do próprio mercado, com as personas locais) e as melhores oportunidades dos outros mercados, vestidas com a persona local.</p>
        </div>
        <div className="seg" role="group" aria-label="O que mostrar">
          <button aria-pressed={aba === "nativas"} onClick={() => setAba("nativas")}>Garimpo nativo · {nativas?.length ?? 0}</button>
          <button aria-pressed={aba === "equivalencias"} onClick={() => setAba("equivalencias")}>Equivalências · {eqs?.length ?? 0}</button>
        </div>
      </div>

      {aba === "nativas" ? (
        nativas === null ? <p className="meta">Carregando…</p> : nativas.length ? (
          <div className="grade-ops">{nativas.map((o) => <CardOportunidade key={o.id} o={o} personas={personas} />)}</div>
        ) : (
          <Vazio titulo={`Nenhum garimpo nativo em ${NOME_IDIOMA[cod].toLowerCase()} ainda`}
                 texto="No Garimpo, escolha este mercado: as sementes, a busca e as personas passam a ser as locais.">
            <a className="btn btn-primary" href={link.garimpo}><Pickaxe size={16} aria-hidden />Garimpar aqui</a>
          </Vazio>
        )
      ) : (
        <>
          <div className="filtros">
            <button className="filtro" aria-pressed={!soAbertos} onClick={() => setSoAbertos(false)}>Todas<span>{eqs?.length ?? 0}</span></button>
            <button className="filtro" aria-pressed={soAbertos} onClick={() => setSoAbertos(true)}>Vão aberto<span>{abertos}</span></button>
          </div>
          {eqs === null ? <p className="meta">Carregando…</p> : vistas.length ? (
            <div className="lista-equiv">
              {vistas.map((e) => (
                <article key={`${e.op_id}-${e.idioma}`} className={`panel equiv-linha${e.aberto ? " is-aberto" : ""}`}>
                  <div className="equiv-capa">
                    {e.top[0] ? <VideoThumb v={e.top[0]} grande rotulo={<span className="selo-capa">viral nativo</span>} /> :
                      <div className="vthumb-vazio">sem viral nativo</div>}
                  </div>
                  <div className="equiv-corpo">
                    <div className="row">
                      <Nota nota={e.nota} />
                      <Selo status={veredito(e)} />
                      <span className="persona-local">
                        {e.persona ? nomePersona(e.persona, personas) : nomePersona(e.persona_origem, personas)}
                        {e.importada ? <em className="importada">importada</em> : null}
                      </span>
                    </div>
                    <h3 className="equiv-titulo-grande">{e.titulo || "—"}</h3>
                    <div className="de-onde">
                      <img src={e.thumb} alt="" loading="lazy" />
                      <div>
                        <span className="label">Original · {nomePersona(e.persona_origem, personas)} · {compacto(e.views)} views</span>
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
            <Vazio titulo={`Nenhuma equivalência em ${NOME_IDIOMA[cod].toLowerCase()} ainda`}
                   texto="O garimpo gera equivalências para as melhores oportunidades. Você também pode gerar na página de cada oportunidade." />
          )}
        </>
      )}
      <p className="meta"><SiglaIdioma cod={cod} /> RPM usado na receita: ${(cod === "en" ? m.estado?.ajustes.rpm : m.estado?.ajustes[`rpm_${cod}` as "rpm_fr"])?.toString().replace(".", ",")} por mil views (Ajustes)</p>
    </div>
  );
}
