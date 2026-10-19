import { useCallback, useEffect, useState } from "react";
import { Archive, Check, GraduationCap, Pencil, RotateCcw, Sparkles, X } from "lucide-react";
import { enviar, obter, type AvatarIG, type Licao, type LicoesIG } from "../api";
import type { MIN } from "../estado";
import { Girando, useAcao } from "../componentes/base";

// O painel Licoes da aba Instagram (motor/instagram_licoes.py): os casos da curadoria viram licoes que o Claude
// PROPOE; so' as aprovadas aqui mudam o roteiro (lint da palavra, regra do gesto) e o prompt do Veo. A tabela das
// taxas mostra, semana a semana, quantas versoes saem com cada defeito: a licao que nao baixa a taxa se aposenta.

const ROTULO_TIPO: Record<Licao["tipo"], string> = { palavra: "Palavra", gesto: "Gesto", prompt: "Prompt do Veo" };
const ROTULO_ACAO: Record<string, string> = {
  pegar: "pegar", levantar: "levantar", apontar: "apontar", tocar: "tocar", despejar: "despejar",
};

export function LicoesIG({ m, avatares, idiomas }: { m: MIN; avatares: AvatarIG[]; idiomas: Record<string, string> }) {
  const [dados, setDados] = useState<LicoesIG | null>(null);
  const [erro, setErro] = useState("");
  const { rodando, rodar } = useAcao(m.avisar);

  // ⛔ sem toast no erro: recarrega a cada evento da aba, e um servidor antigo (sem a rota) encheria a tela de avisos
  const recarregar = useCallback(async () => {
    try {
      setDados(await obter<LicoesIG>("/api/instagram/licoes"));
      setErro("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }, []);
  useEffect(() => { void recarregar(); }, [recarregar, m.versaoInstagram]);

  if (!dados) return erro ? <p className="meta">Lições indisponíveis ({erro}): reabra o Minerador.</p> : null;
  const por = (e: Licao["estado"]) => dados.licoes.filter((l) => l.estado === e);
  const propostas = por("proposta"), ativas = por("ativa");
  const antigas = [...por("aposentada"), ...por("recusada")];
  const destilar = () => rodar("destilar", async () => {
    await enviar("/api/instagram/licoes/destilar", {});
    await recarregar();
  }, "O Claude está lendo os casos novos: as lições propostas aparecem aqui para você aprovar.");
  const nomeEtq = (id: string) => dados.etiquetas.find((e) => e.id === id)?.nome ?? id;
  const cartao = (l: Licao) => (
    <CartaoLicao key={l.id} l={l} m={m} avatares={avatares} idiomas={idiomas} acoes={dados.acoes} nomeEtq={nomeEtq}
                 recarregar={recarregar} />
  );

  return (
    <section className="ig-secao lc" aria-label="Lições">
      <div className="ig-secao-topo">
        <h2>Lições</h2>
        <span className="meta">{ativas.length} ativa(s) · {propostas.length} para aprovar</span>
        <div className="ig-secao-acoes">
          {dados.destilando && <span className="tag tag-run"><span className="dot" aria-hidden />destilando</span>}
          <button className="btn btn-sm btn-quiet" onClick={destilar} disabled={!!rodando || dados.destilando || !dados.pendentes}
                  title={dados.pendentes ? "O Claude lê os casos novos da curadoria e propõe lições" : "Nenhum caso novo da curadoria"}>
            {rodando === "destilar" ? <Girando /> : <Sparkles size={14} aria-hidden />}
            Destilar {dados.pendentes ? `${dados.pendentes} caso(s) novo(s)` : "(nada novo)"}
          </button>
        </div>
      </div>
      <p className="meta lc-lead">
        Cada defeito apontado na curadoria fica registrado. O Claude transforma os casos em lições curtas, mas nada muda
        sozinho: só as lições que você aprova entram no roteiro e no prompt do Veo.
      </p>

      {dados.licoes.length === 0 && (
        <div className="panel lc-vazio">
          <GraduationCap size={18} aria-hidden />
          <p className="meta">Nenhuma lição ainda. Aponte defeitos no editor de curadoria e mande refazer: com 3 casos novos a
            destilação roda sozinha, ou use o botão acima.</p>
        </div>
      )}
      {propostas.length > 0 && <div className="lc-grupo"><span className="label">Para aprovar</span>{propostas.map(cartao)}</div>}
      {ativas.length > 0 && <div className="lc-grupo"><span className="label">Ativas</span>{ativas.map(cartao)}</div>}
      {antigas.length > 0 && (
        <details className="lc-antigas">
          <summary className="label">Aposentadas e recusadas ({antigas.length})</summary>
          <div className="lc-grupo">{antigas.map(cartao)}</div>
        </details>
      )}

      <Taxas t={dados.taxas} />
    </section>
  );
}

function CartaoLicao({ l, m, avatares, idiomas, acoes, nomeEtq, recarregar }: {
  l: Licao; m: MIN; avatares: AvatarIG[]; idiomas: Record<string, string>; acoes: string[]; nomeEtq: (id: string) => string;
  recarregar: () => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);
  const [c, setC] = useState({ texto: l.texto, regra: l.regra, palavra: l.palavra ?? "", trocar: l.trocar ?? "", ...l.escopo });
  const { rodando, rodar } = useAcao(m.avisar);
  const acao = (a: string, campos?: Record<string, unknown>, ok?: string) => rodar(a, async () => {
    await enviar(`/api/instagram/licoes/${encodeURIComponent(l.id)}`, { acao: a, campos });
    await recarregar();
  }, ok);
  const salvar = async () => {
    const campos: Record<string, unknown> = { texto: c.texto, regra: c.regra,
      escopo: { avatar: c.avatar, idioma: c.idioma, acao: c.acao } };
    if (l.tipo === "palavra") Object.assign(campos, { palavra: c.palavra, trocar: c.trocar });
    if (await acao("editar", campos, "Lição ajustada.")) setEditando(false);
  };
  const escopo = [
    l.escopo.idioma && (idiomas[l.escopo.idioma] ?? l.escopo.idioma),
    l.escopo.avatar && (avatares.find((a) => a.id === l.escopo.avatar)?.nome ?? l.escopo.avatar),
    l.escopo.acao && `ação: ${ROTULO_ACAO[l.escopo.acao] ?? l.escopo.acao}`,
  ].filter(Boolean) as string[];

  return (
    <article className={`panel lc-licao lc-${l.estado}`}>
      <div className="lc-topo">
        <span className={`tag lc-tipo-${l.tipo}`}>{ROTULO_TIPO[l.tipo]}</span>
        {(escopo.length ? escopo : ["vale para todos"]).map((e) => <span key={e} className="lc-chip">{e}</span>)}
        <span className="meta lc-n">{l.n} caso(s){l.etiquetas.length ? ` · ${l.etiquetas.map(nomeEtq).join(", ")}` : ""}</span>
      </div>

      {editando ? (
        <div className="lc-form">
          <label className="campo-grupo"><span className="label">Lição (o que você aprova)</span>
            <input className="campo" value={c.texto} onChange={(e) => setC({ ...c, texto: e.target.value })} /></label>
          {l.tipo === "palavra" && (
            <div className="lc-linha">
              <label className="campo-grupo"><span className="label">Palavra a evitar</span>
                <input className="campo" value={c.palavra} onChange={(e) => setC({ ...c, palavra: e.target.value })} /></label>
              <label className="campo-grupo"><span className="label">Trocar por (vazio = tirar)</span>
                <input className="campo" value={c.trocar} onChange={(e) => setC({ ...c, trocar: e.target.value })} /></label>
            </div>
          )}
          <label className="campo-grupo"><span className="label">{l.tipo === "palavra" ? "Por quê (inglês, vai para o Claude)" :
            l.tipo === "gesto" ? "Regra do movimento (inglês, vai para o Claude)" : "Frase do prompt (inglês, vai para o Veo)"}</span>
            <textarea className="campo" rows={2} value={c.regra} onChange={(e) => setC({ ...c, regra: e.target.value })} /></label>
          <div className="lc-linha">
            <label className="campo-grupo"><span className="label">Idioma</span>
              <select className="campo" value={c.idioma} onChange={(e) => setC({ ...c, idioma: e.target.value })}>
                <option value="">todos</option>
                {Object.entries(idiomas).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></label>
            <label className="campo-grupo"><span className="label">Avatar</span>
              <select className="campo" value={c.avatar} onChange={(e) => setC({ ...c, avatar: e.target.value })}>
                <option value="">todos</option>
                {avatares.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select></label>
            <label className="campo-grupo"><span className="label">Tipo de ação</span>
              <select className="campo" value={c.acao} onChange={(e) => setC({ ...c, acao: e.target.value })}>
                <option value="">todas</option>
                {acoes.map((a) => <option key={a} value={a}>{ROTULO_ACAO[a] ?? a}</option>)}
              </select></label>
          </div>
          <div className="ig-linha-botoes">
            <button className="btn btn-sm btn-primary" onClick={() => void salvar()} disabled={!!rodando}>
              {rodando === "editar" ? <Girando /> : <Check size={14} aria-hidden />}Salvar</button>
            <button className="btn btn-sm btn-quiet" onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <>
          <p className="lc-texto">{l.texto}</p>
          {l.tipo === "palavra" ? (
            <p className="lc-regra"><s>{l.palavra}</s> → {l.trocar ? <b>{l.trocar}</b> : <i>sai da fala</i>}
              {l.regra && <span className="meta"> · {l.regra}</span>}</p>
          ) : <p className="lc-regra lc-ingles">{l.regra}</p>}
        </>
      )}

      {l.efeito && <Efeito e={l.efeito} />}

      {!editando && (
        <div className="ig-linha-botoes">
          {l.estado === "proposta" && <>
            <button className="btn btn-sm btn-primary" onClick={() => void acao("aprovar", undefined, "Lição ativa: vale a partir do próximo roteiro e da próxima geração.")}
                    disabled={!!rodando}>{rodando === "aprovar" ? <Girando /> : <Check size={14} aria-hidden />}Aprovar</button>
            <button className="btn btn-sm btn-ghost" onClick={() => void acao("recusar")} disabled={!!rodando}>
              <X size={14} aria-hidden />Recusar</button>
          </>}
          {l.estado === "ativa" && (
            <button className="btn btn-sm btn-ghost" onClick={() => void acao("aposentar", undefined, "Lição aposentada: sai do roteiro e do prompt.")}
                    disabled={!!rodando}><Archive size={14} aria-hidden />Aposentar</button>
          )}
          {(l.estado === "aposentada" || l.estado === "recusada") && (
            <button className="btn btn-sm btn-ghost" onClick={() => void acao("reativar")} disabled={!!rodando}>
              <RotateCcw size={14} aria-hidden />Reativar</button>
          )}
          <button className="btn btn-sm btn-quiet" onClick={() => setEditando(true)}><Pencil size={14} aria-hidden />Ajustar</button>
        </div>
      )}
    </article>
  );
}

// antes x depois de uma licao, nas etiquetas dela: a taxa das versoes com o defeito
function Efeito({ e }: { e: NonNullable<Licao["efeito"]> }) {
  const pct = (x: { n: number; taxa: number | null }) => (x.taxa == null ? "—" : `${x.taxa}%`);
  const pouco = e.depois.n < 3;
  const melhor = e.antes.taxa != null && e.depois.taxa != null && !pouco ? Math.sign(e.antes.taxa - e.depois.taxa) : 0;
  return (
    <p className={`lc-efeito${melhor > 0 ? " lc-melhor" : melhor < 0 ? " lc-pior" : ""}`}>
      <span className="label">Defeito</span>
      antes <b>{pct(e.antes)}</b> <small>({e.antes.n} versões)</small> → com a lição <b>{pct(e.depois)}</b> <small>({e.depois.n})</small>
      {pouco && <small> · poucas versões ainda para julgar</small>}
      {melhor < 0 && <small> · não está ajudando: considere aposentar</small>}
    </p>
  );
}

// ⭐ uma so' cor (o vermelho de defeito), do claro ao escuro pela taxa; o numero vai na celula (e' uma tabela)
function Taxas({ t }: { t: LicoesIG["taxas"] }) {
  if (!t.semanas.length) return null;
  return (
    <div className="panel lc-taxas">
      <div className="ig-secao-topo">
        <span className="label">Taxa de defeito por etiqueta, por semana</span>
        <span className="meta">% das versões geradas com o defeito (apontado por você ou pelo QA e não dispensado)</span>
      </div>
      <div className="lc-tabela-rolo">
        <table className="lc-tabela">
          <thead>
            <tr><th scope="col">Etiqueta</th>{t.semanas.map((s) => <th key={s} scope="col">{s}</th>)}</tr>
          </thead>
          <tbody>
            {t.etiquetas.map((e) => (
              <tr key={e.id}>
                <th scope="row">{e.nome}</th>
                {e.taxas.map((x, i) => (
                  <td key={i} title={x == null ? `${t.semanas[i]}: nenhuma versão gerada` :
                    `${e.nome}, semana de ${t.semanas[i]}: ${x}% de ${t.versoes[i]} versão(ões)`}
                      style={x == null ? undefined : { background: `rgba(238, 122, 102, ${(0.08 + 0.62 * Math.min(1, x / 60)).toFixed(2)})` }}>
                    {x == null ? "·" : `${x}%`}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="lc-total"><th scope="row">versões geradas</th>{t.versoes.map((n, i) => <td key={i}>{n}</td>)}</tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
