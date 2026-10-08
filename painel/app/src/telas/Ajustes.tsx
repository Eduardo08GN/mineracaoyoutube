import { useState } from "react";
import { AlertTriangle, ArrowUp, Check, KeyRound, Plus, Trash2, X } from "lucide-react";
import { CODIGOS, enviar, NOME_IDIOMA, type ChaveInfo, type CodIdioma, type Cota } from "../api";
import type { MIN } from "../estado";
import { BarraCota, Girando, useAcao, Bandeira } from "../componentes/base";

interface Resultado { mascara: string; ok: boolean; motivo: string }

function estadoDaChave(c: ChaveInfo) {
  if (c.motivo.startsWith("chave recusada")) return { tom: "no", texto: "recusada" };
  if (c.esgotada) return { tom: "voce", texto: "sem cota hoje" };
  if (c.em_uso) return { tom: "run", texto: "em uso" };
  return { tom: "fila", texto: "na fila" };
}

function LinhaChave({ c, i, m, total }: { c: ChaveInfo; i: number; m: MIN; total: number }) {
  const { rodando, rodar } = useAcao(m.avisar);
  const st = estadoDaChave(c);
  const pct = Math.min(100, (c.usadas / c.limite) * 100);
  return (
    <li className={`chave chave-${st.tom}`}>
      <span className="chave-ordem">{i + 1}</span>
      <KeyRound size={16} aria-hidden />
      <div className="chave-meio">
        <div className="linha-meta">
          <code>{c.mascara}</code>
          <span className={`tag tag-${st.tom}`}><span className="dot" aria-hidden />{st.texto}</span>
        </div>
        <div className={`bar${pct > 85 ? " quase" : ""}`}><span style={{ width: `${pct}%` }} /></div>
        <p className="meta">{c.usadas.toLocaleString("pt-BR")} / {c.limite.toLocaleString("pt-BR")} hoje{c.motivo && <><b>/</b><span className={c.motivo.includes("mesmo projeto") || c.motivo.startsWith("chave recusada") ? "erro-txt" : ""}>{c.motivo}</span></>}</p>
      </div>
      <div className="attn-acoes">
        {i > 0 && (
          <button className="btn btn-quiet btn-icon-sm" aria-label="Usar esta primeiro" title="Usar esta primeiro" disabled={!!rodando}
                  onClick={() => rodar("s", () => enviar(`/api/chaves/${c.id}/subir`))}><ArrowUp size={15} /></button>
        )}
        <button className="btn btn-quiet btn-icon-sm" aria-label="Remover chave" title="Remover" disabled={!!rodando || total === 1}
                onClick={() => rodar("r", () => enviar(`/api/chaves/${c.id}/remover`), "Chave removida.")}><Trash2 size={15} /></button>
      </div>
    </li>
  );
}

export function Ajustes({ m }: { m: MIN }) {
  const e = m.estado;
  const [colado, setColado] = useState("");
  const [resultado, setResultado] = useState<Resultado[]>([]);
  const [rpms, setRpms] = useState<Partial<Record<CodIdioma, string>>>({});
  const { rodando, rodar } = useAcao(m.avisar);
  if (!e) return <div className="tela"><p className="meta">Carregando…</p></div>;
  const chaves = e.cota.chaves ?? [];
  const nCopias = colado.split(/[\s,;]+/).filter((c) => c.length >= 20).length;
  const rpmAtual = (c: CodIdioma) => (c === "en" ? e.ajustes.rpm : e.ajustes[`rpm_${c}` as "rpm_fr"]);

  return (
    <div className="tela">
      <div>
        <p className="eyebrow">Ajustes</p>
        <h1>Ajustes</h1>
      </div>

      <section className="panel bloco">
        <div className="linha-titulo">
          <h3>Chaves da YouTube API · {chaves.length}</h3>
          <span className="meta">quando uma acaba, o Minerador passa sozinho para a próxima</span>
        </div>
        <BarraCota cota={e.cota as Cota} />
        <ol className="lista-chaves">
          {chaves.map((c, i) => <LinhaChave key={c.id} c={c} i={i} m={m} total={chaves.length} />)}
        </ol>

        <form className="colar-chaves" onSubmit={(ev) => {
          ev.preventDefault();
          void rodar("k", async () => {
            const r = await enviar<{ resultado: Resultado[] }>("/api/chaves", { chaves: [colado] });
            setResultado(r.resultado);
            if (r.resultado.some((x) => x.ok)) setColado("");
          });
        }}>
          <label className="label" htmlFor="novas-chaves">Adicionar chaves (uma por linha — pode colar várias)</label>
          <textarea id="novas-chaves" className="campo campo-chaves" rows={3} value={colado} autoComplete="off" spellCheck={false}
                    placeholder={"AIza…\nAIza…"} onChange={(ev) => setColado(ev.target.value)} />
          <div className="turbo-acoes">
            <p className="meta">Cada chave é testada com 1 unidade dela mesma antes de entrar. Ficam só no <code>.env</code> deste computador.</p>
            <button className="btn btn-primary btn-sm" disabled={!nCopias || !!rodando}>
              {rodando === "k" ? <Girando /> : <Plus size={15} aria-hidden />}Adicionar {nCopias > 1 ? `${nCopias} chaves` : "chave"}
            </button>
          </div>
          {resultado.length > 0 && (
            <ul className="resultado-chaves">
              {resultado.map((r, i) => (
                <li key={i} className={r.ok ? "ok-txt" : "erro-txt"}>{r.ok ? <Check size={14} aria-hidden /> : <X size={14} aria-hidden />}
                  <code>{r.mascara}</code> {r.motivo}</li>
              ))}
            </ul>
          )}
        </form>
        <p className="aviso-chaves"><AlertTriangle size={14} aria-hidden /> A cota é por projeto do Google Cloud: chaves do mesmo projeto dividem as mesmas 10 mil unidades (o Minerador avisa quando percebe). As regras da API do YouTube não permitem somar projetos para passar da cota — o risco de suspensão fica com cada conta.</p>
      </section>

      <section className="panel bloco">
        <h3>Receita estimada por mercado</h3>
        <p>Quanto o AdSense paga por mil views (RPM) em cada mercado. Muda a receita mostrada em cada oportunidade.</p>
        <form className="rpms" onSubmit={(ev) => {
          ev.preventDefault();
          const novos: Record<string, number> = {};
          for (const c of CODIGOS) {
            const v = rpms[c]?.trim();
            if (v) novos[c === "en" ? "rpm" : `rpm_${c}`] = Number(v.replace(",", "."));
          }
          void rodar("rpm", () => enviar("/api/ajustes", { rpms: novos }), "RPM salvo.").then((ok) => ok && setRpms({}));
        }}>
          {CODIGOS.map((c) => (
            <label key={c} className="input"><Bandeira cod={c} />{NOME_IDIOMA[c]} $
              <input inputMode="decimal" placeholder={String(rpmAtual(c)).replace(".", ",")} value={rpms[c] ?? ""}
                     onChange={(ev) => setRpms({ ...rpms, [c]: ev.target.value })} />
            </label>
          ))}
          <button className="btn btn-ghost" disabled={!Object.values(rpms).some((v) => v?.trim()) || !!rodando}>
            {rodando === "rpm" ? <Girando /> : null}Salvar
          </button>
        </form>
      </section>

      <section className="panel bloco">
        <h3>Claude Code</h3>
        <p className={e.claude ? "ok-txt" : "erro-txt"}>
          {e.claude ? <><Check size={15} aria-hidden /> Achado nesta máquina. Ele escreve os títulos (no idioma de cada mercado) e veste as personas locais.</> :
            <><X size={15} aria-hidden /> Não achado. Sem ele o garimpo roda, mas sem títulos reescritos.</>}
        </p>
      </section>

      <section className="panel bloco">
        <h3>Registro</h3>
        {m.registro.length ? (
          <ul className="registro">
            {m.registro.map((l, i) => <li key={i}><time>{l.hora}</time><span>{l.texto}</span></li>)}
          </ul>
        ) : <p className="meta">Nada aconteceu desde que a janela abriu.</p>}
      </section>
    </div>
  );
}
