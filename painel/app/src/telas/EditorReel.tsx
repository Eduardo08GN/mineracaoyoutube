import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, CircleAlert, ExternalLink, Film, RefreshCw, ScanSearch, Sparkles, TriangleAlert, X } from "lucide-react";
import { comSenha, enviar, obter, type EditorIG, type EstadoCur, type FlagQA, type TakeEditor, type VersaoTake } from "../api";
import type { MIN } from "../estado";
import { link } from "../rota";
import { Girando, useAcao } from "../componentes/base";

// O editor de curadoria de um Reel pronto: a timeline por take, o inspetor do take e as versoes de cada um.
// ⭐ (18/10, Eduardo) "voce so' aponta o erro e o resto e' automatico": salvar o defeito (etiqueta ou texto) manda o take
// para o corretor (Claude) e para o Veo alguns segundos depois; o QA escolhe a melhor das 2 versoes, ela entra no Reel e
// a montagem roda de novo. A outra versao fica no inspetor para trocar. So' o take que reprova duas vezes pede a pessoa.
// ⭐ Cada versao chega com o QA automatico (motor/instagram_qa.py): as flags aparecem com ⚠ na timeline e no inspetor,
// pre-marcam a etiqueta do defeito, e a pessoa confirma (vira defeito) ou dispensa.

const urlArq = (rid: string, qual: string, v: string | number = "") =>
  comSenha(`/api/instagram/reels/${encodeURIComponent(rid)}/arquivo/${encodeURIComponent(qual)}`, v);

const ROTULO_ESTADO: Record<EstadoCur, string> = {
  "": "sem revisão", defeito: "refaz em instantes", refazer: "refazendo…", refazendo: "refazendo…", escolher: "escolha a versão",
  aceito: "aceito", corrigido: "corrigido", precisa: "precisa de você",
};
const ROTULO_ORIGEM: Record<VersaoTake["origem"], string> = { roteiro: "roteiro", correcao: "correção", manual: "editado" };
const seg = (s: number) => `${s.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`;
const ocupadoTake = (t: TakeEditor) => t.cur.estado === "refazer" || t.cur.estado === "refazendo";
const versaoAtiva = (t: TakeEditor) => t.versoes.find((v) => v.v === t.v) ?? t.versoes[t.versoes.length - 1];
const abertas = (v?: VersaoTake): FlagQA[] => (v?.qa?.flags ?? []).filter((f) => !f.estado);
const pct = (x?: number) => (x == null ? "—" : `${x.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`);
const digitando = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement | null;
  return !!el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT" || el.tagName === "SELECT" || el.isContentEditable);
};

export function EditorReel({ m, id }: { m: MIN; id: string }) {
  const [dados, setDados] = useState<EditorIG | null>(null);
  const [erro, setErro] = useState("");
  const [sel, setSel] = useState(1);
  const [tempo, setTempo] = useState(0);
  const player = useRef<HTMLVideoElement>(null);
  const { rodando, rodar } = useAcao(m.avisar);

  const recarregar = useCallback(async () => {
    try {
      setDados(await obter<EditorIG>(`/api/instagram/reels/${encodeURIComponent(id)}/editor`));
      setErro("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }, [id]);
  useEffect(() => { void recarregar(); }, [recarregar, m.versaoInstagram]);

  const takes = dados?.takes ?? [];
  const take = takes.find((t) => t.n === sel) ?? takes[0];
  const r = dados?.reel;
  const total = r?.duracao || takes.reduce((s, t) => s + (t.no_reel ? t.no_reel[1] - t.no_reel[0] : 0), 0) || 1;
  const remontando = !!r && (r.trabalhando === "montagem" || r.na_fila.includes("montagem"));
  const precisam = takes.filter((t) => t.cur.estado === "precisa" || t.cur.estado === "escolher").length;
  const refazendo = takes.filter(ocupadoTake).length;

  const irPara = useCallback((n: number) => {
    setSel(n);
    const t = takes.find((x) => x.n === n);
    if (t?.no_reel && player.current) player.current.currentTime = t.no_reel[0] + 0.01;
  }, [takes]);

  // ⭐ tocando, o take selecionado acompanha a agulha (como na timeline do CapCut)
  const aoTempo = () => {
    const v = player.current;
    if (!v) return;
    setTempo(v.currentTime);
    if (!v.paused) {
      const t = takes.find((x) => x.no_reel && v.currentTime >= x.no_reel[0] && v.currentTime < x.no_reel[1]);
      if (t && t.n !== sel) setSel(t.n);
    }
  };

  const post = (caminho: string, corpo: unknown, ok?: string) => rodar(caminho, async () => {
    await enviar(`/api/instagram/reels/${encodeURIComponent(id)}/${caminho}`, corpo);
    await recarregar();
  }, ok);

  // atalhos: ←/→ troca de take; espaco toca/pausa (fora dos campos de texto)
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (digitando(e) || e.ctrlKey || e.metaKey || e.altKey || !takes.length) return;
      const i = takes.findIndex((t) => t.n === sel);
      if (e.key === "ArrowRight" && i < takes.length - 1) { e.preventDefault(); irPara(takes[i + 1].n); }
      else if (e.key === "ArrowLeft" && i > 0) { e.preventDefault(); irPara(takes[i - 1].n); }
      else if (e.key === " " && player.current) {
        e.preventDefault();
        if (player.current.paused) void player.current.play(); else player.current.pause();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [takes, sel, irPara]);

  if (erro && !dados) {
    return (
      <div className="tela ed">
        <a className="btn btn-quiet voltar" href={link.instagram}><ArrowLeft size={16} aria-hidden />Instagram</a>
        <p className="meta erro-txt">{erro}</p>
      </div>
    );
  }
  if (!dados || !r || !take) return <div className="tela ed"><p className="meta">Carregando...</p></div>;

  return (
    <div className="tela ed">
      <a className="btn btn-quiet voltar" href={link.instagram}><ArrowLeft size={16} aria-hidden />Instagram</a>
      <div className="tela-topo">
        <div>
          <p className="eyebrow">Curadoria</p>
          <h1>Revise take a take, <em>refaça só o que falhou.</em></h1>
          <p className="meta ed-meta">
            {r.id}<b>·</b>{takes.length} takes<b>·</b>{r.duracao ? seg(r.duracao) : "sem montagem"}
            <b>·</b>{takes.filter((t) => t.cur.estado === "aceito").length} aceitos
          </p>
        </div>
        <div className="tela-acoes ed-acoes">
          {remontando && <span className="tag tag-run"><span className="dot" aria-hidden />remontando</span>}
          {refazendo > 0 && <span className="tag tag-run"><span className="dot" aria-hidden />{refazendo} refazendo</span>}
          {precisam > 0 && <span className="tag tag-voce">{precisam} precisa(m) de você</span>}
          {(dados.checando || r.trabalhando === "qa") && <span className="tag tag-run"><span className="dot" aria-hidden />checando</span>}
          {dados.sem_qa > 0 && !dados.checando && (
            <button className="btn btn-sm btn-quiet" onClick={() => post("qa", {}, "QA na fila: o whisper e a imagem de cada versão são checados.")}
                    disabled={!!rodando || dados.ocupado} title="Roda o QA automático nas versões que ainda não passaram por ele">
              <ScanSearch size={14} aria-hidden />Checar {dados.sem_qa} versão(ões)</button>
          )}
          <button className="btn btn-sm btn-quiet" onClick={() => post("rodar", { etapa: "montagem" }, "Montagem na fila.")}
                  disabled={!!rodando || remontando}><Film size={14} aria-hidden />Remontar</button>
          {r.final && <button className="btn btn-sm btn-quiet" onClick={() => post("abrir", {})}><ExternalLink size={14} aria-hidden />Abrir</button>}
        </div>
      </div>

      {dados.ocupado && <div className="panel ig-alerta"><strong>O Reel está no roteiro ou na geração.</strong>
        <p className="meta">A curadoria volta quando a etapa terminar.</p></div>}

      <div className="ed-palco">
        <div className="ed-player">
          {r.final ? (
            <video ref={player} src={urlArq(r.id, "final", r.montado ?? r.duracao ?? 0)} controls preload="metadata" playsInline
                   onTimeUpdate={aoTempo} onSeeked={aoTempo} />
          ) : <div className="ed-sem-video meta">Sem montagem ainda: rode a montagem.</div>}
        </div>
        <Inspetor key={take.n} rid={r.id} t={take} etiquetas={dados.etiquetas} ocupado={dados.ocupado} m={m} recarregar={recarregar} />
      </div>

      <Timeline rid={r.id} takes={takes} sel={take.n} total={total} tempo={tempo} irPara={irPara} />
      <p className="meta ed-dica">← → troca de take · espaço toca/pausa · aponte o erro: o take é refeito, o QA escolhe a versão e o Reel é remontado sozinho</p>
    </div>
  );
}

function Timeline({ rid, takes, sel, total, tempo, irPara }: {
  rid: string; takes: TakeEditor[]; sel: number; total: number; tempo: number; irPara: (n: number) => void;
}) {
  return (
    <section className="panel ed-timeline" aria-label="Linha do tempo dos takes">
      <div className="ed-trilha">
        {takes.map((t) => {
          const dur = t.no_reel ? t.no_reel[1] - t.no_reel[0] : total / takes.length;
          const ativa = versaoAtiva(t);
          const alertas = t.cur.estado === "" || t.cur.estado === "defeito" ? abertas(ativa) : [];
          return (
            <button key={t.n} className={`ed-bloco ed-${t.cur.estado || "neutro"}${t.n === sel ? " ed-sel" : ""}`}
                    style={{ flexGrow: dur, flexBasis: 0 }} onClick={() => irPara(t.n)}
                    title={`Take ${t.n}: ${ROTULO_ESTADO[t.cur.estado]}${alertas.map((f) => `\n⚠ ${f.motivo}`).join("")}`}>
              {ativa?.mini ? <img src={urlArq(rid, ativa.mini, ativa.v)} alt="" /> : <span className="ed-bloco-vazio" />}
              {alertas.length > 0 && (
                <span className="ed-alerta-qa" aria-label={`${alertas.length} alerta(s) do QA`}>
                  <TriangleAlert size={11} aria-hidden />{alertas.length}
                </span>
              )}
              <span className="ed-bloco-rot">
                <b>{t.n}</b>{t.cta && <i>CTA</i>}<span>{seg(dur)}</span>
                {t.versoes.length > 1 && <span className="ed-nver">v{t.v ?? 1}/{t.versoes.length}</span>}
              </span>
              <span className="ed-bloco-fala">{t.fala}</span>
              <span className="ed-faixa" aria-hidden />
            </button>
          );
        })}
        <span className="ed-agulha" style={{ left: `${Math.min(100, (tempo / total) * 100)}%` }} aria-hidden />
      </div>
    </section>
  );
}

function Inspetor({ rid, t, etiquetas, ocupado, m, recarregar }: {
  rid: string; t: TakeEditor; etiquetas: EditorIG["etiquetas"]; ocupado: boolean; m: MIN; recarregar: () => Promise<void>;
}) {
  const ativa = versaoAtiva(t);
  const precisa = t.cur.estado === "escolher" || t.cur.estado === "precisa";
  const novas = precisa ? t.versoes.filter((v) => v.v > (ativa?.v ?? 0)) : [];
  const [vista, setVista] = useState<number>(novas[0]?.v ?? ativa?.v ?? 1);
  const [defeito, setDefeito] = useState(t.cur.defeito ?? "");
  const [marcas, setMarcas] = useState<string[]>(t.cur.etiquetas ?? []);
  const [fala, setFala] = useState(t.fala);
  const [mov, setMov] = useState(t.movimento);
  const { rodando, rodar } = useAcao(m.avisar);
  const preso = ocupado || ocupadoTake(t);

  // o servidor manda de novo (outro take mudou, a montagem terminou): sem perder o que esta' sendo digitado
  useEffect(() => { setFala(t.fala); setMov(t.movimento); }, [t.fala, t.movimento]);
  useEffect(() => { if (t.cur.estado !== "defeito") { setDefeito(t.cur.defeito ?? ""); setMarcas(t.cur.etiquetas ?? []); } },
    [t.cur.estado, t.cur.defeito, t.cur.etiquetas]);
  useEffect(() => { if (novas[0]) setVista(novas[0].v); }, [t.cur.estado]); // eslint-disable-line react-hooks/exhaustive-deps

  const versao = t.versoes.find((v) => v.v === vista) ?? ativa;
  const editado = fala.trim() !== t.fala || mov.trim() !== t.movimento;
  const temDefeito = !!defeito.trim() || marcas.length > 0;
  const base = `/api/instagram/reels/${encodeURIComponent(rid)}`;

  const anotar = (texto: string, lista: string[]) => rodar("anotar", async () => {
    await enviar(`${base}/takes/${t.n}/anotar`, { defeito: texto, etiquetas: lista });
    await recarregar();
  });
  const alternar = (e: string) => {
    const sug = sugeridas.find((f) => f.etiqueta === e);
    if (sug && ativa && !marcas.includes(e)) { void revisarQA(ativa.v, sug, "confirmar"); return; }
    const lista = marcas.includes(e) ? marcas.filter((x) => x !== e) : [...marcas, e];
    setMarcas(lista);
    void anotar(defeito, lista);
  };
  const refazer = () => rodar("refazer", async () => {
    if (temDefeito) await enviar(`${base}/takes/${t.n}/anotar`, { defeito, etiquetas: marcas });
    await enviar(`${base}/refazer`, { takes: [{ n: t.n, ...(editado ? { fala: fala.trim(), movimento: mov.trim() } : {}) }] });
    await recarregar();
  }, temDefeito ? "Take na fila: o Claude usa a sua edição como intenção e o QA escolhe a melhor versão." :
     "Take na fila com a sua edição: o Veo gera 2 versões e o QA escolhe a melhor.");
  const aceitar = () => rodar("aceitar", async () => {
    await enviar(`${base}/takes/${t.n}/aceitar`, {});
    await recarregar();
  });
  // ⭐ a flag do QA: confirmar poe a etiqueta e o motivo no defeito (como o servidor faz); dispensar so' apaga a flag
  const sugeridas = preso || !(t.cur.estado === "" || t.cur.estado === "defeito") ? [] : abertas(ativa);
  const revisarQA = (v: number, f: FlagQA, acao: "confirmar" | "dispensar") => rodar(`qa-${f.etiqueta}`, async () => {
    await enviar(`${base}/takes/${t.n}/qa`, { v, etiqueta: f.etiqueta, acao });
    if (acao === "confirmar") {
      setMarcas((x) => (x.includes(f.etiqueta) ? x : [...x, f.etiqueta]));
      setDefeito((x) => (x.includes(f.motivo) ? x : `${x.trim() ? `${x.trim()}; ` : ""}(QA) ${f.motivo}`));
    }
    await recarregar();
  });
  const escolher = (v: number) => rodar("versao", async () => {
    await enviar(`${base}/takes/${t.n}/versao`, { v });
    await recarregar();
  }, `Versão ${v} no Reel: a montagem roda de novo sozinha.`);

  return (
    <section className="panel ed-inspetor" aria-label={`Take ${t.n}`}>
      <div className="ed-insp-topo">
        <h2>Take {t.n}</h2>
        {t.cta && <span className="tag tag-voce">CTA</span>}
        <span className={`tag ed-tag-${t.cur.estado || "neutro"}`}>
          {ocupadoTake(t) && <Girando />}{ROTULO_ESTADO[t.cur.estado]}
        </span>
        {t.no_reel && <span className="meta">no Reel {seg(t.no_reel[0])} → {seg(t.no_reel[1])}</span>}
      </div>

      {t.cur.estado === "corrigido" && (
        <p className="ed-aviso"><Sparkles size={14} aria-hidden />
          Corrigido sozinho: v{t.cur.auto?.v}, {t.cur.auto?.motivo}.{t.cur.correcao?.motivo ? ` ${t.cur.correcao.motivo}.` : ""} As outras
          versões ficam aqui se quiser trocar.
        </p>
      )}
      {precisa && (
        <p className="ed-aviso ed-aviso-voce"><CircleAlert size={14} aria-hidden />
          {t.cur.estado === "precisa" ? `Precisa de você: ${t.cur.motivo ?? "o QA reprovou as versões novas"}. ` : ""}
          Assista as versões novas e use uma, mantenha a atual, ou descreva melhor o erro para refazer.
        </p>
      )}
      {t.cur.estado === "defeito" && (
        <p className="ed-aviso"><RefreshCw size={14} aria-hidden />
          {t.cur.erro ? `A última tentativa falhou: ${t.cur.erro}. Salve o defeito de novo para tentar outra vez.` :
            "Defeito salvo: o take vai para refazer em instantes (se apontar outros takes agora, vão juntos)."}
        </p>
      )}
      {ocupadoTake(t) && (
        <p className="ed-aviso"><Girando />
          {t.cur.estado === "refazer" ? "Refazendo… na fila da curadoria." :
            (t.cur.tentativa ?? 1) > 1 ? "Refazendo… o QA reprovou a 1ª rodada; nova tentativa com o motivo." :
            "Refazendo… o Claude corrigiu o take e o Veo está gerando 2 versões."}
        </p>
      )}

      <div className="ed-insp-corpo">
        <div className="ed-preview">
          {versao?.existe ? (
            <video key={versao.arquivo} src={urlArq(rid, versao.arquivo, versao.criado)} controls autoPlay={vista !== ativa?.v}
                   poster={versao.mini ? urlArq(rid, versao.mini, versao.v) : undefined}
                   preload="metadata" playsInline />
          ) : <div className="ed-sem-video meta">vídeo não encontrado</div>}
          <div className="ed-versoes" role="listbox" aria-label="Versões do take">
            {t.versoes.map((v) => (
              <button key={v.v} role="option" aria-selected={v.v === vista} onClick={() => setVista(v.v)}
                      className={`ed-ver${v.v === vista ? " ed-ver-vista" : ""}${v.v === ativa?.v ? " ed-ver-ativa" : ""}${novas.some((x) => x.v === v.v) ? " ed-ver-nova" : ""}`}>
                {v.mini ? <img src={urlArq(rid, v.mini, v.v)} alt="" /> : <span className="ed-bloco-vazio" />}
                <span>v{v.v}</span>
                <small>{v.v === ativa?.v ? "no Reel" : ROTULO_ORIGEM[v.origem]}</small>
              </button>
            ))}
          </div>
          {versao && versao.v !== ativa?.v && (
            <div className="ed-versao-info">
              {versao.nota && <p className="meta">{versao.nota}</p>}
              <p className="ed-fala-versao">“{versao.fala}”</p>
              <button className="btn btn-sm btn-primary" onClick={() => escolher(versao.v)} disabled={!!rodando || preso}>
                {rodando === "versao" ? <Girando /> : <Check size={14} aria-hidden />}Usar a v{versao.v} no Reel
              </button>
            </div>
          )}
        </div>

        <div className="ed-campos">
          {versao && <CaixaQA v={versao} ativa={versao.v === ativa?.v} etiquetas={etiquetas} preso={preso}
                              rodando={rodando} revisar={revisarQA} />}
          <div className="campo-grupo">
            <span className="label">O que está errado neste take</span>
            <div className="ed-etiquetas">
              {etiquetas.map((e) => (
                <button key={e.id} aria-pressed={marcas.includes(e.id)} onClick={() => alternar(e.id)} disabled={preso}
                        className={`ed-etiqueta${marcas.includes(e.id) ? " ed-etiqueta-on" :
                          sugeridas.some((f) => f.etiqueta === e.id) ? " ed-etiqueta-sugerida" : ""}`}
                        title={sugeridas.find((f) => f.etiqueta === e.id)?.motivo ?? ""}>
                  {!marcas.includes(e.id) && sugeridas.some((f) => f.etiqueta === e.id) && <TriangleAlert size={12} aria-hidden />}
                  {e.nome}
                </button>
              ))}
            </div>
            <textarea className="campo" rows={3} value={defeito} disabled={preso}
                      placeholder="ex.: falou “forinho” em vez de “fofinho”; o pão some da mão no meio"
                      onChange={(e) => setDefeito(e.target.value)}
                      onBlur={() => defeito.trim() !== (t.cur.defeito ?? "") && void anotar(defeito, marcas)} />
          </div>
          <p className="ed-fala-atual"><span className="label">Fala</span>“{t.fala}”</p>
          {/* ⛔ (18/10) o defeito chegou a ser escrito no campo do movimento, que vai direto para o Veo: a edicao a mao
              fica recolhida, com o aviso, e com defeito apontado ela passa pelo corretor como intencao */}
          <details className="ed-mao" open={editado || undefined}>
            <summary className="label">Editar a fala ou o movimento à mão{editado ? " · editado" : ""}</summary>
            <p className="meta ed-mao-aviso">Isto não é para descrever o erro (use a caixa acima): é o texto que vai para o Veo.
              O movimento é em inglês. Com defeito apontado, o Claude usa a sua edição como intenção.</p>
            <label className="campo-grupo">
              <span className="label">Fala</span>
              <textarea className="campo" rows={2} value={fala} disabled={preso} onChange={(e) => setFala(e.target.value)} />
            </label>
            <label className="campo-grupo">
              <span className="label">Movimento (inglês)</span>
              <textarea className="campo" rows={3} value={mov} disabled={preso} onChange={(e) => setMov(e.target.value)} />
            </label>
            {t.quadro && <p className="meta">Quadro: {t.quadro}</p>}
            {editado && (
              <div className="ig-linha-botoes">
                <button className="btn btn-sm btn-primary" onClick={refazer} disabled={!!rodando || preso}>
                  {rodando === "refazer" ? <Girando /> : <RefreshCw size={14} aria-hidden />}Refazer com a minha edição
                </button>
                <button className="btn btn-sm btn-quiet" onClick={() => { setFala(t.fala); setMov(t.movimento); }}>Desfazer edição</button>
              </div>
            )}
          </details>
          <div className="ig-linha-botoes">
            <button className="btn btn-sm btn-ghost" onClick={aceitar} disabled={!!rodando || preso || t.cur.estado === "aceito"}>
              <Check size={14} aria-hidden />{precisa ? "Manter a atual" : "Aceitar take"}
            </button>
          </div>
          <p className="meta">
            Aponte o erro (etiqueta ou texto) e pronto: o Claude reescreve o take, o Veo gera 2 versões, o QA escolhe a melhor e o
            Reel é remontado. Tudo fica registrado para a ferramenta aprender.
          </p>
        </div>
      </div>
    </section>
  );
}


// o QA da versao vista: as flags (com confirmar/dispensar) e as medidas
function CaixaQA({ v, ativa, etiquetas, preso, rodando, revisar }: {
  v: VersaoTake; ativa: boolean; etiquetas: EditorIG["etiquetas"]; preso: boolean; rodando: string;
  revisar: (v: number, f: FlagQA, acao: "confirmar" | "dispensar") => Promise<boolean>;
}) {
  const qa = v.qa;
  if (!qa) return <p className="meta">QA: esta versão ainda não foi checada.</p>;
  const nome = (id: string) => etiquetas.find((e) => e.id === id)?.nome ?? id;
  const md = qa.medidas;
  const n = abertas(v).length;
  return (
    <div className={`ed-qa${n ? "" : " ed-qa-ok"}`}>
      <div className="ed-qa-topo">
        {n ? <TriangleAlert size={14} aria-hidden /> : <Check size={14} aria-hidden />}
        <span className="label">{n ? `QA: ${n} alerta(s) na v${v.v}` : `QA da v${v.v}: nada a apontar`}</span>
      </div>
      {qa.flags.length > 0 && (
        <ul>
          {qa.flags.map((f) => (
            <li key={f.etiqueta} className={f.estado ? "ed-qa-feita" : ""}>
              <span><b>{nome(f.etiqueta)}</b>: {f.motivo}{f.estado && ` · ${f.estado}`}</span>
              {!f.estado && (
                <span className="ed-qa-botoes">
                  {ativa && (
                    <button className="btn btn-sm btn-ghost" onClick={() => void revisar(v.v, f, "confirmar")} disabled={!!rodando || preso}
                            title="Vira defeito do take (etiqueta + motivo): o take é refeito sozinho">
                      {rodando === `qa-${f.etiqueta}` ? <Girando /> : <Check size={13} aria-hidden />}Confirmar</button>
                  )}
                  <button className="btn btn-sm btn-quiet" onClick={() => void revisar(v.v, f, "dispensar")} disabled={!!rodando}
                          title="O QA errou: a flag some (fica registrado para calibrar)"><X size={13} aria-hidden />Dispensar</button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="ed-qa-medidas">
        fala {md.fala_s != null ? seg(md.fala_s) : "—"} · câmera {pct(md.camera_pct)} · corte {pct(md.corte_pct)} · fim {pct(md.fim_pct)}
        {md.ouvido ? ` · ouvido: “${md.ouvido}”` : ""}{qa.erro ? ` · ${qa.erro}` : ""}
      </p>
    </div>
  );
}
