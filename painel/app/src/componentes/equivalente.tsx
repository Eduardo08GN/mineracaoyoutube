import { Check, Copy, Search } from "lucide-react";
import { useState } from "react";
import type { Equivalente } from "../api";
import { Selo, SiglaIdioma, VideoThumb } from "./base";
import { compacto } from "../textos";

export function veredito(e: Equivalente) {
  if (e.aberto) return { tom: "ok" as const, texto: "vão aberto" };
  if (e.com_persona > 0) return { tom: "no" as const, texto: `${e.com_persona} já com a persona` };
  return { tom: "fila" as const, texto: "demanda baixa" };
}

function CopiarTitulo({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button className="btn btn-quiet btn-icon-sm" aria-label="Copiar título" onClick={async () => {
      try { await navigator.clipboard.writeText(texto); setOk(true); window.setTimeout(() => setOk(false), 1500); } catch { /* sem area */ }
    }}>{ok ? <Check size={15} /> : <Copy size={15} />}</button>
  );
}

/** Um idioma de uma oportunidade: o titulo local, a busca nativa, os numeros e os virais nativos em capa. */
export function PainelEquivalente({ e, nome, persona }: { e: Equivalente; nome: string; persona?: string }) {
  return (
    <section className={`panel equiv${e.aberto ? " is-aberto" : ""}`}>
      <div className="equiv-topo">
        <SiglaIdioma cod={e.idioma} tom={e.aberto ? "aberto" : "fechado"} />
        <span className="label">{nome}</span>
        {persona && <span className="persona-local">{persona}{e.importada ? <em className="importada">importada</em> : null}</span>}
        <Selo status={veredito(e)} />
      </div>
      {e.titulo && <div className="equiv-titulo"><span>{e.titulo}</span><CopiarTitulo texto={e.titulo} /></div>}
      <p className="meta"><Search size={12} aria-hidden /> busca nativa: “{e.consulta}”{e.persona_local && <><b>/</b>persona: {e.persona_local}</>}</p>
      <div className="equiv-numeros">
        <div><span className="label">Viral nativo</span><span className="num">{compacto(e.demanda)}</span></div>
        <div><span className="label">Novos em 12 meses</span><span className="num">{e.oferta_recente}</span></div>
        <div><span className="label">Com a persona</span><span className={`num${e.com_persona ? " erro-txt" : " accent"}`}>{e.com_persona}</span></div>
        <div><span className="label">Fome</span><span className="num">{compacto(e.fome)}</span></div>
      </div>
      {e.top.length > 0 && (
        <div className="equiv-top">
          {e.top.slice(0, 3).map((v) => <VideoThumb key={v.id} v={v} />)}
        </div>
      )}
    </section>
  );
}
