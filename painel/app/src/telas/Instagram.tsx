import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen, Check, ChevronDown, Clapperboard, ChevronRight, Clipboard, ExternalLink, FolderGit2, ImagePlus, Play, Plus,
  RefreshCw, Sparkles, Trash2, Upload, X,
} from "lucide-react";
import {
  comSenha, enviar, obter, type AjustesIG, type AvatarIG, type CenaIG, type InstagramTudo, type ReelIG,
} from "../api";
import type { MIN } from "../estado";
import { Girando, useAcao } from "../componentes/base";
import { Atividade } from "./Painel";
import { LicoesIG } from "./Licoes";
import { link } from "../rota";

type Avisar = (t: string, tom?: "ok" | "erro") => void;

function lerArquivo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const extDe = (f: File) => (f.name.split(".").pop() || "png").toLowerCase();
const urlImg = (aid: string, qual: string, v: string | number) =>
  comSenha(`/api/instagram/avatares/${encodeURIComponent(aid)}/imagem/${encodeURIComponent(qual)}`, v);
const urlReel = (rid: string, qual: string, v: string | number) =>
  comSenha(`/api/instagram/reels/${encodeURIComponent(rid)}/arquivo/${encodeURIComponent(qual)}`, v);

const ROTULO_CENA: Record<CenaIG["estado"], string> = {
  pendente: "pendente", pronta: "para aprovar", aprovada: "aprovada", recusada: "recusada",
};

export function Instagram({ m }: { m: MIN }) {
  const [dados, setDados] = useState<InstagramTudo | null>(null);
  const [escolhido, setEscolhido] = useState("");
  const [criando, setCriando] = useState(false);
  const { rodando, rodar } = useAcao(m.avisar);

  const recarregar = useCallback(async () => {
    try {
      setDados(await obter<InstagramTudo>("/api/instagram"));
    } catch (e) {
      m.avisar(e instanceof Error ? e.message : String(e), "erro");
    }
  }, [m.avisar]);

  useEffect(() => { void recarregar(); }, [recarregar, m.versaoInstagram]);

  const avatar = useMemo(() => {
    if (!dados) return null;
    return dados.avatares.find((a) => a.id === escolhido) ?? dados.avatares[0] ?? null;
  }, [dados, escolhido]);

  if (!dados) return <div className="tela"><p className="meta">Carregando...</p></div>;

  const reels = dados.reels.filter((r) => !avatar || r.avatar === avatar.id);

  return (
    <div className="tela ig">
      <div className="tela-topo">
        <div>
          <p className="eyebrow">Instagram</p>
          <h1>Reels com o seu avatar, <em>no lar dele.</em></h1>
          <p className="lead">
            Suba a foto do avatar, aprove os cômodos do universo-lar e cole um Reel. A fala é adaptada para o idioma,
            cada take é gerado num cômodo do lar e o Reel sai montado em 9:16 com legenda.
          </p>
        </div>
        <div className="tela-acoes">
          <span className={`tag ${dados.gerador.ok ? "tag-fila" : "tag-voce"}`} title={dados.gerador.texto}>
            <span className="dot" aria-hidden />{dados.gerador.ok ? `gerador: ${dados.gerador.texto}` : "sem gerador"}
          </span>
        </div>
      </div>

      <ProducaoIG dados={dados} m={m} />

      {!dados.gerador.ok && (
        <div className="panel ig-alerta">
          <strong>Nenhum gerador de imagem e vídeo configurado.</strong>
          <p className="meta">{dados.gerador.texto}. O contrato do arquivo está em motor/instagram_backend.py.</p>
        </div>
      )}

      {dados.avatares.length > 0 && (
        <NovoLote avatares={dados.avatares} idiomas={dados.idiomas} legendas={dados.legendas ?? {}} avisar={m.avisar}
                  recarregar={recarregar} />
      )}

      {/* ⭐ (19/10) uma sub-aba por avatar (um por mercado), cada uma com o seu universo-lar e os seus Reels */}
      <nav className="ig-subabas" aria-label="Avatares">
        {dados.avatares.map((a) => (
          <button key={a.id} className="ig-subaba" aria-current={!criando && a.id === avatar?.id ? "page" : undefined}
                  onClick={() => { setEscolhido(a.id); setCriando(false); }}>
            <span aria-hidden>{BANDEIRA_IG[a.idioma] ?? ""}</span>{a.nome}
            <span className="meta">{dados.reels.filter((r) => r.avatar === a.id).length}</span>
          </button>
        ))}
        <button className="ig-subaba ig-subaba-nova" aria-current={criando || !dados.avatares.length ? "page" : undefined}
                onClick={() => setCriando(true)}><Plus size={14} aria-hidden />Novo avatar</button>
      </nav>

      <section className="ig-secao">
        {(criando || dados.avatares.length === 0) ? (
          <NovoAvatar avisar={m.avisar} personas={dados.personas ?? {}} jaTem={dados.avatares.map((a) => a.persona ?? "")}
                      cancelar={dados.avatares.length ? () => setCriando(false) : undefined}
                      criado={(a) => { setEscolhido(a.id); setCriando(false); void recarregar(); }} />
        ) : (
          avatar && <FichaAvatar a={avatar} avisar={m.avisar} recarregar={recarregar} />
        )}
      </section>

      {avatar && !criando && (
        <>
          <Pool a={avatar} avisar={m.avisar} recarregar={recarregar} rodando={rodando} rodar={rodar} />
          <section className="ig-secao">
            <div className="ig-secao-topo"><h2>Reels de {avatar.nome}</h2><span className="meta">{reels.length}</span></div>
            {reels.length === 0 && <p className="meta">Nenhum Reel ainda.</p>}
            <div className="ig-reels">
              {reels.map((r) => (
                <CartaoReel key={r.id} r={r} a={avatar} idiomas={dados.idiomas} temRepo={!!dados.ajustes.repo_dir}
                            avisar={m.avisar} recarregar={recarregar} />
              ))}
            </div>
          </section>
        </>
      )}

      <LicoesIG m={m} avatares={dados.avatares} idiomas={dados.idiomas} />

      <AjustesIgTela aj={dados.ajustes} publicados={dados.publicados} avisar={m.avisar} recarregar={recarregar} />
    </div>
  );
}

function NovoAvatar({ avisar, personas, jaTem, cancelar, criado }: {
  avisar: Avisar; personas: Record<string, { nome: string; idioma: string; cta: string }>; jaTem: string[];
  cancelar?: () => void; criado: (a: AvatarIG) => void;
}) {
  const livre = Object.keys(personas).find((k) => !jaTem.includes(k)) ?? "";
  const [persona, setPersona] = useState(livre);
  const [nome, setNome] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [previa, setPrevia] = useState("");
  const { rodando, rodar } = useAcao(avisar);
  const input = useRef<HTMLInputElement>(null);
  const ficha = personas[persona];

  useEffect(() => {
    if (!foto) { setPrevia(""); return; }
    const u = URL.createObjectURL(foto);
    setPrevia(u);
    return () => URL.revokeObjectURL(u);
  }, [foto]);

  const criar = () => rodar("criar", async () => {
    if (!foto && !ficha) throw new Error("escolha a foto de referência do avatar ou uma ficha pronta");
    const a = await enviar<AvatarIG>("/api/instagram/avatares", {
      nome: nome || ficha?.nome || "", persona, imagem: foto ? await lerArquivo(foto) : "", ext: foto ? extDe(foto) : "png",
    });
    criado(a);
  }, foto || !ficha ? "Avatar criado." : "Avatar criado: o retrato e os 8 cômodos estão sendo gerados no Flow.");

  return (
    <div className="panel ig-novo-avatar">
      <button type="button" className={`ig-foto ig-foto-vazia${previa ? " tem" : ""}`} onClick={() => input.current?.click()}
              aria-label="Escolher a foto do avatar">
        {previa ? <img src={previa} alt="" /> : <><ImagePlus size={22} aria-hidden /><span>{ficha ? "Foto (opcional)" : "Foto de referência"}</span></>}
      </button>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
             onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
      <div className="ig-form">
        <div className="campo-grupo">
          <span className="label">Ficha</span>
          <div className="seg" role="group" aria-label="Ficha do avatar">
            {Object.entries(personas).map(([k, p]) => (
              <button key={k} aria-pressed={persona === k} onClick={() => setPersona(k)}>
                {BANDEIRA_IG[p.idioma] ?? ""} {p.nome}
              </button>
            ))}
            <button aria-pressed={!persona} onClick={() => setPersona("")}>Sem ficha</button>
          </div>
          <p className="meta">
            {ficha ? `Descrição, voz, idioma, CTA “${ficha.cta}” e os 8 cômodos já preenchidos.${foto ? "" : " Sem foto, o retrato-âncora é gerado no Flow e os cômodos em seguida."}`
              : "Avatar do zero: suba a foto e preencha a ficha depois."}
          </p>
        </div>
        <label className="campo-grupo">
          <span className="label">Nome</span>
          <input className="campo" value={nome} placeholder={ficha?.nome ?? "Nome do avatar"} onChange={(e) => setNome(e.target.value)} />
        </label>
        <div className="ig-linha-botoes">
          <button className="btn btn-primary" onClick={criar} disabled={!!rodando || (!foto && !ficha)}>
            {rodando ? <Girando /> : <Check size={15} aria-hidden />}Criar avatar
          </button>
          {cancelar && <button className="btn btn-quiet" onClick={cancelar}>Cancelar</button>}
        </div>
      </div>
    </div>
  );
}

function FichaAvatar({ a, avisar, recarregar }: { a: AvatarIG; avisar: Avisar; recarregar: () => Promise<void> }) {
  const [aberta, setAberta] = useState(false);
  const [campos, setCampos] = useState({ descricao: a.descricao, prefixo: a.prefixo, voz: a.voz, quem: a.quem });
  const { rodando, rodar } = useAcao(avisar);
  const inFoto = useRef<HTMLInputElement>(null);
  const inLivro = useRef<HTMLInputElement>(null);

  useEffect(() => { setCampos({ descricao: a.descricao, prefixo: a.prefixo, voz: a.voz, quem: a.quem }); }, [a]);

  const subir = (qual: "foto" | "livro", f?: File | null) => f && rodar(qual, async () => {
    await enviar(`/api/instagram/avatares/${a.id}/imagem/${qual}`, { imagem: await lerArquivo(f), ext: extDe(f) });
    await recarregar();
  }, qual === "foto" ? "Foto trocada: os cômodos voltaram a pendente." : "Capa do livro guardada.");

  const salvar = () => rodar("salvar", async () => {
    await enviar(`/api/instagram/avatares/${a.id}`, { campos });
    await recarregar();
  }, "Ficha salva.");

  return (
    <div className="panel ig-ficha">
      <div className="ig-ficha-topo">
        <button type="button" className="ig-foto" onClick={() => inFoto.current?.click()} title="Trocar a foto">
          {a.foto ? <img src={urlImg(a.id, "foto", a.criado)} alt={a.nome} /> : <ImagePlus size={20} aria-hidden />}
          {rodando === "foto" && <span className="ig-foto-girando"><Girando /></span>}
        </button>
        <input ref={inFoto} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
               onChange={(e) => subir("foto", e.target.files?.[0])} />
        <button type="button" className="ig-foto ig-livro" onClick={() => inLivro.current?.click()}
                title={a.livro ? "Trocar a capa do livro" : "Subir a capa do livro (opcional)"}>
          {a.livro ? <img src={urlImg(a.id, "livro", Date.now() >> 16)} alt="Capa do livro" />
            : <><BookOpen size={18} aria-hidden /><span>Livro (opcional)</span></>}
          {rodando === "livro" && <span className="ig-foto-girando"><Girando /></span>}
        </button>
        <input ref={inLivro} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
               onChange={(e) => subir("livro", e.target.files?.[0])} />
        <div className="ig-ficha-info">
          <strong className="ig-nome">{a.nome}</strong>
          <p className="meta">{a.cenas.filter((c) => c.estado === "aprovada").length} de {a.cenas.length} cômodos aprovados</p>
          <button className="btn btn-sm btn-quiet" onClick={() => setAberta(!aberta)} aria-expanded={aberta}>
            {aberta ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}Ficha para os prompts
          </button>
        </div>
      </div>
      {aberta && (
        <div className="ig-form">
          {([
            ["descricao", "Descrição (prompt de imagem: traços e roupa)"],
            ["prefixo", "Prefixo do vídeo (curto, sem roupa nem cenário)"],
            ["voz", "Voz ({lingua} vira o idioma do Reel)"],
            ["quem", "Quem é (para o Claude adaptar a fala)"],
          ] as const).map(([k, rotulo]) => (
            <label key={k} className="campo-grupo">
              <span className="label">{rotulo}</span>
              <textarea className="campo" rows={k === "descricao" ? 4 : 2} value={campos[k]}
                        onChange={(e) => setCampos({ ...campos, [k]: e.target.value })} />
            </label>
          ))}
          <div className="ig-linha-botoes">
            <button className="btn btn-sm btn-primary" onClick={salvar} disabled={!!rodando}>
              {rodando === "salvar" ? <Girando /> : <Check size={14} aria-hidden />}Salvar ficha
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Pool({ a, avisar, recarregar, rodando, rodar }: {
  a: AvatarIG; avisar: Avisar; recarregar: () => Promise<void>; rodando: string;
  rodar: (nome: string, fn: () => Promise<unknown>, ok?: string) => Promise<boolean>;
}) {
  const [novo, setNovo] = useState(false);
  const [nome, setNome] = useState("");
  const [cena, setCena] = useState("");
  const pendentes = a.cenas.filter((c) => c.estado === "pendente" || c.estado === "recusada").length;

  const gerar = () => rodar("pool", async () => {
    await enviar(`/api/instagram/avatares/${a.id}/pool`, {});
    await recarregar();
  }, "Cômodos na fila do gerador.");

  const adicionar = () => rodar("cena", async () => {
    await enviar(`/api/instagram/avatares/${a.id}/cenas`, { nome, cena });
    setNome(""); setCena(""); setNovo(false);
    await recarregar();
  });

  return (
    <section className="ig-secao">
      <div className="ig-secao-topo">
        <h2>Universo-lar</h2>
        <span className="meta">um cômodo por Reel, em rodízio entre os aprovados</span>
        <div className="ig-secao-acoes">
          <button className="btn btn-sm btn-quiet" onClick={() => setNovo(!novo)}><Plus size={14} aria-hidden />Cômodo</button>
          <button className="btn btn-sm btn-primary" onClick={gerar} disabled={!!rodando || !pendentes || !a.foto}>
            {rodando === "pool" ? <Girando /> : <Sparkles size={14} aria-hidden />}Gerar {pendentes || ""} pendente{pendentes === 1 ? "" : "s"}
          </button>
        </div>
      </div>
      {novo && (
        <div className="panel ig-form ig-nova-cena">
          <label className="campo-grupo"><span className="label">Nome</span>
            <input className="campo" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Lavanderia" />
          </label>
          <label className="campo-grupo"><span className="label">O cômodo (em inglês, para o prompt de imagem)</span>
            <textarea className="campo" rows={2} value={cena} onChange={(e) => setCena(e.target.value)}
                      placeholder="Her small laundry room: a wooden rack with drying herbs, morning light..." />
          </label>
          <div className="ig-linha-botoes">
            <button className="btn btn-sm btn-primary" onClick={adicionar} disabled={!!rodando || !cena.trim()}>Adicionar</button>
          </div>
        </div>
      )}
      <div className="ig-pool">
        {a.cenas.map((c) => <CartaoCena key={c.id} a={a} c={c} avisar={avisar} recarregar={recarregar} />)}
      </div>
    </section>
  );
}

function CartaoCena({ a, c, avisar, recarregar }: { a: AvatarIG; c: CenaIG; avisar: Avisar; recarregar: () => Promise<void> }) {
  const { rodando, rodar } = useAcao(avisar);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(c.cena);
  const acao = (nome: string, texto?: string) => rodar(nome, async () => {
    await enviar(`/api/instagram/avatares/${a.id}/cenas/${c.id}`, { acao: nome, texto });
    setEditando(false);
    await recarregar();
  });
  const input = useRef<HTMLInputElement>(null);
  const [sobre, setSobre] = useState(false);
  const enviarImagem = (f?: File) => {
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { avisar("A imagem tem de ser PNG, JPG ou WEBP.", "erro"); return; }
    void rodar("imagem", async () => {
      const r = await enviar<AvatarIG>(`/api/instagram/avatares/${a.id}/cenas/${c.id}/imagem`,
        { imagem: await lerArquivo(f), ext: extDe(f) });
      await recarregar();
      avisar(r.aviso ? `Imagem guardada, mas ${r.aviso}.` : `Imagem de “${c.nome}” guardada: aprove se ficou boa.`,
        r.aviso ? "erro" : "ok");
    });
  };
  const tom = c.estado === "aprovada" ? "tag-ok" : c.estado === "recusada" ? "tag-no" : c.estado === "pronta" ? "tag-voce" : "tag-fila";
  return (
    <div className={`ig-cena ig-cena-${c.estado}${sobre ? " ig-cena-sobre" : ""}`}
         onDragOver={(e) => { if (!c.na_fila) { e.preventDefault(); setSobre(true); } }}
         onDragLeave={() => setSobre(false)}
         onDrop={(e) => { e.preventDefault(); setSobre(false); if (!c.na_fila) enviarImagem(e.dataTransfer.files?.[0]); }}>
      <div className="ig-cena-img">
        {c.tem ? <img src={urlImg(a.id, `cena-${c.id}`, c.v)} alt={c.nome} loading="lazy" />
          : <button type="button" className="ig-cena-vazia" onClick={() => input.current?.click()} disabled={c.na_fila}
                    title="Enviar a imagem deste cômodo">
              {c.na_fila ? <Girando /> : <><Upload size={20} aria-hidden /><span>Enviar imagem</span></>}
            </button>}
        {(c.na_fila || rodando === "imagem") && c.tem && <span className="ig-cena-girando"><Girando /></span>}
        {rodando === "imagem" && !c.tem && <span className="ig-cena-girando"><Girando /></span>}
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1}
             onChange={(e) => { enviarImagem(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="ig-cena-corpo">
        <strong title={c.cena}>{c.nome}</strong>
        <span className="ig-cena-linha">
          <span className={`tag ${tom}`}>{c.na_fila ? "gerando" : ROTULO_CENA[c.estado]}</span>
          {c.usos > 0 && <span className="meta">{c.usos} Reel{c.usos === 1 ? "" : "s"}</span>}
        </span>
        {editando ? (
          <>
            <textarea className="campo" rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} />
            <span className="ig-cena-botoes">
              <button className="btn btn-sm btn-primary" onClick={() => acao("editar", texto)} disabled={!!rodando}>Salvar</button>
              <button className="btn btn-sm btn-quiet" onClick={() => setEditando(false)}>Cancelar</button>
            </span>
          </>
        ) : (
          <span className="ig-cena-botoes">
            <button className="btn btn-icon-sm btn-ghost" onClick={() => acao("aprovar")}
                    disabled={!!rodando || c.na_fila || !c.tem || c.estado === "aprovada"}
                    title="Aprovar" aria-label="Aprovar"><Check size={14} /></button>
            <button className="btn btn-icon-sm btn-quiet" onClick={() => acao("recusar")}
                    disabled={!!rodando || c.na_fila || !c.tem || c.estado === "recusada"}
                    title="Recusar" aria-label="Recusar"><X size={14} /></button>
            <button className="btn btn-icon-sm btn-quiet" onClick={() => acao("refazer")} disabled={!!rodando || c.na_fila || !a.foto}
                    title="Gerar de novo" aria-label="Gerar de novo"><RefreshCw size={14} /></button>
            <button className="btn btn-icon-sm btn-quiet" onClick={() => input.current?.click()} disabled={!!rodando || c.na_fila}
                    title="Enviar a imagem deste cômodo (ou arraste para o cartão)" aria-label="Enviar imagem"><Upload size={14} /></button>
            <button className="btn btn-icon-sm btn-quiet" onClick={() => { setTexto(c.cena); setEditando(true); }}
                    title="Editar a descrição" aria-label="Editar a descrição"><Clipboard size={14} /></button>
            <button className="btn btn-icon-sm btn-quiet" onClick={() => acao("remover")} disabled={!!rodando || c.na_fila}
                    title="Remover" aria-label="Remover"><Trash2 size={14} /></button>
          </span>
        )}
      </div>
    </div>
  );
}

function ProducaoIG({ dados, m }: { dados: InstagramTudo; m: MIN }) {
  const agora = dados.producao?.agora ?? null;
  const reel = agora?.tipo === "reel" || agora?.tipo === "curadoria" || agora?.tipo === "qa"
    ? dados.reels.find((r) => r.id === agora.id) : undefined;
  const nomeCena = (r: ReelIG) =>
    dados.avatares.find((a) => a.id === r.avatar)?.cenas.find((c) => c.id === r.cena)?.nome ?? r.cena;
  const titulo = !agora ? "Parado" : agora.tipo === "reel" ? `Reel em ${agora.etapa.toLowerCase()}` :
    agora.tipo === "cena" ? "Gerando um cômodo" : agora.tipo === "curadoria" ? "Curadoria: refazendo takes" :
    agora.tipo === "qa" ? "QA: checando os takes" : agora.tipo === "licoes" ? "Destilando lições da curadoria" :
    "Subindo para o repositório";
  const detalhe = reel ? `${dados.idiomas[reel.idioma] ?? reel.idioma} · ${nomeCena(reel)} · ${reel.id}` :
    agora?.tipo === "cena" ? agora.id : dados.producao?.fila ? `${dados.producao.fila} na fila` :
    "Nada rodando. Produza um Reel embaixo quando quiser.";
  const linhas = m.registro.filter((l) => /instagram/i.test(l.texto))
    .map((l) => ({ ...l, texto: l.texto.replace(/^(⚠\s*)?instagram(\s*\([^)]*\))?:\s*/i, "$1") }));
  return (
    <section className={`panel pilot${agora ? "" : " is-off"}`} aria-label="Produção">
      <div className="pilot-l">
        <div className="pilot-state">
          <span className="live" aria-hidden />
          <div><h3>{titulo}</h3><p>{detalhe}</p></div>
        </div>
        <div className="metrics">
          <div><span className="label">Reels</span><span className="num">{dados.reels.length}</span></div>
          <div><span className="label">Prontos</span><span className="num accent">{dados.reels.filter((r) => r.final).length}</span></div>
          <div><span className="label">Na fila</span><span className="num">{dados.producao?.fila ?? 0}</span></div>
          <div><span className="label">Publicados</span><span className="num">{dados.reels.filter((r) => r.publicado).length}</span></div>
        </div>
      </div>
      <div className="pilot-r">
        <span className="label">Atividade</span>
        <Atividade linhas={linhas} vazio="Nada da aba Instagram desde que o painel abriu." />
      </div>
    </section>
  );
}

const BANDEIRA_IG: Record<string, string> = { pt: "🇧🇷", es: "🇲🇽", de: "🇩🇪", en: "🇺🇸", fr: "🇫🇷" };

/** ⭐⭐ (19/10) UM video-fonte -> um Reel por avatar (cada um no idioma e com o CTA dele). */
function NovoLote({ avatares, idiomas, legendas, avisar, recarregar }: {
  avatares: AvatarIG[]; idiomas: Record<string, string>; legendas: Record<string, string>; avisar: Avisar;
  recarregar: () => Promise<void>;
}) {
  const prontos = avatares.filter((a) => a.cenas.some((c) => c.estado === "aprovada"));
  const [url, setUrl] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [marcados, setMarcados] = useState<Record<string, boolean>>({});
  const [palavras, setPalavras] = useState<Record<string, string>>({});
  const [livro, setLivro] = useState(false);
  const [modelo, setModelo] = useState<"gratis" | "pago">("gratis");
  const [legenda, setLegenda] = useState(2);
  const { rodando, rodar } = useAcao(avisar);
  const input = useRef<HTMLInputElement>(null);
  const marcado = (a: AvatarIG) => marcados[a.id] ?? true;
  const palavra = (a: AvatarIG) => palavras[a.id] ?? a.cta ?? "";
  const escolhidos = prontos.filter(marcado);

  const produzir = () => rodar("lote", async () => {
    await enviar("/api/instagram/lotes", {
      itens: escolhidos.map((a) => ({ avatar: a.id, palavra: palavra(a).trim() })),
      url: arquivo ? "" : url.trim(), video: arquivo ? await lerArquivo(arquivo) : "",
      ext: arquivo ? extDe(arquivo) : "mp4", livro, modelo, legenda,
    });
    setUrl(""); setArquivo(null);
    await recarregar();
  }, `Lote na fila: ${escolhidos.length} Reel(s), um por avatar. Fonte, roteiro, geração e montagem rodam sozinhos.`);

  return (
    <section className="ig-secao">
      <div className="ig-secao-topo"><h2>Novo lote</h2><span className="meta">um vídeo-fonte vira um Reel por avatar</span></div>
      <div className="panel ig-form ig-novo-reel">
        <div className="ig-fonte">
          <label className="campo-grupo">
            <span className="label">Reel de origem</span>
            <input className="campo" value={arquivo ? arquivo.name : url} disabled={!!arquivo} inputMode="url"
                   placeholder="https://www.instagram.com/reel/..." onChange={(e) => setUrl(e.target.value)} />
          </label>
          <button className="btn btn-sm btn-quiet" onClick={() => (arquivo ? setArquivo(null) : input.current?.click())}>
            {arquivo ? <><X size={14} aria-hidden />Tirar o vídeo</> : <><Upload size={14} aria-hidden />ou enviar o mp4</>}
          </button>
          <input ref={input} type="file" accept="video/mp4,video/quicktime" className="sr-only"
                 onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
        </div>
        <div className="ig-lote-avatares">
          {avatares.map((a) => {
            const pronto = prontos.includes(a);
            return (
              <div key={a.id} className={`ig-lote-av${pronto && marcado(a) ? " on" : ""}${pronto ? "" : " off"}`}>
                <label className="ig-lote-check">
                  <input type="checkbox" checked={pronto && marcado(a)} disabled={!pronto}
                         onChange={(e) => setMarcados({ ...marcados, [a.id]: e.target.checked })} />
                  <span>{BANDEIRA_IG[a.idioma] ?? ""} {a.nome}</span>
                  <span className="meta">{idiomas[a.idioma] ?? a.idioma}</span>
                </label>
                {pronto ? (
                  <label className="campo-grupo">
                    <span className="label">CTA: comente</span>
                    <input className="campo" value={palavra(a)} placeholder="livro (vazio = link na bio)"
                           onChange={(e) => setPalavras({ ...palavras, [a.id]: e.target.value })} />
                  </label>
                ) : <p className="meta">{a.gerando_retrato ? "gerando o retrato…" : "aprove um cômodo do universo-lar"}</p>}
              </div>
            );
          })}
        </div>
        <div className="ig-opcoes">
          <label className="campo-grupo">
            <span className="label">Legenda</span>
            <select className="campo" value={legenda} onChange={(e) => setLegenda(Number(e.target.value))}>
              <option value={0}>Simples (branca)</option>
              {Object.entries(legendas).map(([k, v]) => <option key={k} value={k}>{k}. {v}</option>)}
            </select>
          </label>
          <div className="campo-grupo">
            <span className="label">Modelo do vídeo</span>
            <div className="seg" role="group" aria-label="Modelo">
              <button aria-pressed={modelo === "gratis"} onClick={() => setModelo("gratis")}>Grátis</button>
              <button aria-pressed={modelo === "pago"} onClick={() => setModelo("pago")}>Lite (pago)</button>
            </div>
          </div>
        </div>
        <div className="switch-linha">
          <div>
            <span className="label">Livro no CTA</span>
            <p className="meta">O último take termina com o avatar segurando o livro (só nos avatares com a capa do livro).</p>
          </div>
          <button type="button" className="switch" role="switch" aria-checked={livro} aria-label="Livro no CTA"
                  onClick={() => setLivro(!livro)} />
        </div>
        <div className="ig-linha-botoes">
          <button className="btn btn-primary" onClick={produzir}
                  disabled={!!rodando || !escolhidos.length || (!url.trim() && !arquivo)}>
            {rodando ? <Girando /> : <Play size={14} fill="currentColor" aria-hidden />}
            Produzir {escolhidos.length} Reel{escolhidos.length === 1 ? "" : "s"}
          </button>
          {!prontos.length && <span className="meta">Aprove pelo menos um cômodo de algum avatar.</span>}
        </div>
      </div>
    </section>
  );
}

function CartaoReel({ r, a, idiomas, temRepo, avisar, recarregar }: {
  r: ReelIG; a: AvatarIG; idiomas: Record<string, string>; temRepo: boolean; avisar: Avisar; recarregar: () => Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const { rodando, rodar } = useAcao(avisar);
  const cena = a.cenas.find((c) => c.id === r.cena);
  const ocupado = !!r.trabalhando || r.na_fila.length > 0;
  const pendente = r.etapas.find((e) => e.estado !== "pronta");
  const post = (caminho: string, corpo: unknown, ok?: string) => rodar(caminho, async () => {
    await enviar(`/api/instagram/reels/${r.id}/${caminho}`, corpo);
    await recarregar();
  }, ok);

  return (
    <div className="panel ig-reel">
      <div className="ig-reel-midia">
        {r.final ? <video src={urlReel(r.id, "final", r.duracao ?? 0)} controls preload="metadata" playsInline />
          : cena?.tem ? <img src={urlImg(a.id, `cena-${cena.id}`, cena.v)} alt="" />
          : <span className="ig-cena-vazia" />}
        {ocupado && <span className="ig-reel-girando"><Girando />{r.trabalhando ? r.etapas.find((e) => e.id === r.trabalhando)?.nome ?? r.trabalhando : "na fila"}</span>}
      </div>
      <div className="ig-reel-corpo">
        <span className="trilha" aria-label="Etapas do Reel">
          {r.etapas.map((e) => (
            <i key={e.id} className={`trilha-${e.estado === "bloqueada" ? "futura" : e.estado}${r.trabalhando === e.id ? " ativa" : ""}`}
               title={`${e.nome}: ${e.estado}`} />
          ))}
        </span>
        <strong>{idiomas[r.idioma] ?? r.idioma} · {cena?.nome ?? r.cena}</strong>
        <p className="meta">
          {new Date(r.criado * 1000).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
          {r.duracao ? <><b>·</b>{r.duracao} s</> : null}
          <b>·</b>{r.cta.tipo === "palavra" ? `comente ${r.cta.palavra}` : "link na bio"}{r.cta.livro ? " + livro" : ""}{r.legenda ? ` · legenda ${r.legenda}` : ""}
          {r.modelo === "pago" ? <><b>·</b>Lite pago</> : null}
        </p>
        {r.publicado && <span className={`tag ${r.publicado === "na fila" ? "tag-run" : r.publicado.startsWith("20") ? "tag-ok" : "tag-fila"}`}>
          <FolderGit2 size={12} aria-hidden />{r.publicado.startsWith("20") ? `no repo desde ${r.publicado}` : r.publicado}
        </span>}
        {r.registro[0] && <p className={`meta ig-ultimo${r.registro[0].texto.startsWith("⚠") ? " erro-txt" : ""}`}>{r.registro[0].texto}</p>}
        <div className="ig-reel-botoes">
          {pendente && !ocupado && (
            <button className="btn btn-sm btn-primary" onClick={() => post("rodar", { etapa: pendente.id })} disabled={!!rodando}>
              <Play size={13} fill="currentColor" aria-hidden />Continuar de {pendente.nome}
            </button>
          )}
          {r.takes.some((t) => t.video) && (
            <a className="btn btn-sm btn-ghost" href={link.curadoria(r.id)}><Clapperboard size={13} aria-hidden />Curadoria</a>
          )}
          {r.final && <button className="btn btn-sm btn-quiet" onClick={() => post("abrir", {})}><ExternalLink size={13} aria-hidden />Abrir</button>}
          {r.final && temRepo && (
            <button className="btn btn-sm btn-ghost" onClick={() => post("subir", {}, "Reel na fila do repositório.")} disabled={!!rodando}>
              <FolderGit2 size={13} aria-hidden />Subir pro repo
            </button>
          )}
          <button className="btn btn-sm btn-quiet" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>
            {aberto ? <ChevronDown size={13} aria-hidden /> : <ChevronRight size={13} aria-hidden />}Takes
          </button>
        </div>
        {aberto && <DetalheReel r={r} avisar={avisar} recarregar={recarregar} ocupado={ocupado} />}
      </div>
    </div>
  );
}

function DetalheReel({ r, avisar, recarregar, ocupado }: { r: ReelIG; avisar: Avisar; recarregar: () => Promise<void>; ocupado: boolean }) {
  const { rodando, rodar } = useAcao(avisar);
  const [edit, setEdit] = useState<{ n: number; fala: string; movimento: string } | null>(null);
  const salvar = () => edit && rodar("take", async () => {
    await enviar(`/api/instagram/reels/${r.id}/take`, edit);
    setEdit(null);
    await recarregar();
  }, "Take editado. Rode a geração de novo para refazer só ele.");
  const copiar = async () => {
    try { await navigator.clipboard.writeText(r.legenda_post); avisar("Legenda do post copiada.", "ok"); }
    catch { avisar("Não consegui copiar.", "erro"); }
  };
  const apagar = () => rodar("apagar", async () => {
    await enviar(`/api/instagram/reels/${r.id}/apagar`, {});
    await recarregar();
  }, "Reel apagado.");

  return (
    <div className="ig-detalhe">
      {r.takes.length === 0 && r.takes_origem.length > 0 && (
        <ol className="ig-takes">{r.takes_origem.map((t) => <li key={t.n}><span className="meta">{t.texto}</span></li>)}</ol>
      )}
      <ol className="ig-takes">
        {r.takes.map((t) => (
          <li key={t.n} className={t.video ? "ok" : ""}>
            {edit?.n === t.n ? (
              <div className="ig-form">
                <textarea className="campo" rows={2} value={edit.fala} onChange={(e) => setEdit({ ...edit, fala: e.target.value })} />
                <textarea className="campo" rows={2} value={edit.movimento} onChange={(e) => setEdit({ ...edit, movimento: e.target.value })} />
                <span className="ig-cena-botoes">
                  <button className="btn btn-sm btn-primary" onClick={salvar} disabled={!!rodando}>Salvar</button>
                  <button className="btn btn-sm btn-quiet" onClick={() => setEdit(null)}>Cancelar</button>
                </span>
              </div>
            ) : (
              <button className="ig-take" onClick={() => !ocupado && setEdit({ n: t.n, fala: t.fala, movimento: t.movimento })}
                      disabled={ocupado} title="Editar este take">
                <span className="ig-take-fala">{t.cta && <span className="tag tag-voce">CTA</span>}{t.fala}</span>
                <span className="meta">{t.movimento}</span>
              </button>
            )}
          </li>
        ))}
      </ol>
      {r.legenda_post && (
        <div className="ig-post">
          <pre>{r.legenda_post}</pre>
          <button className="btn btn-sm btn-quiet" onClick={copiar}><Clipboard size={13} aria-hidden />Copiar legenda</button>
        </div>
      )}
      <details className="ig-registro">
        <summary className="label">Registro</summary>
        <ul>{r.registro.map((x, i) => <li key={i} className="meta">{new Date(x.t * 1000).toLocaleTimeString("pt-BR")} {x.texto}</li>)}</ul>
      </details>
      <button className="btn btn-sm btn-stop" onClick={apagar} disabled={!!rodando || ocupado}><Trash2 size={13} aria-hidden />Apagar Reel</button>
    </div>
  );
}

function AjustesIgTela({ aj, publicados, avisar, recarregar }: {
  aj: AjustesIG; publicados: InstagramTudo["publicados"]; avisar: Avisar; recarregar: () => Promise<void>;
}) {
  const [c, setC] = useState(aj);
  const { rodando, rodar } = useAcao(avisar);
  useEffect(() => setC(aj), [aj]);
  const salvar = () => rodar("salvar", async () => {
    await enviar("/api/instagram/ajustes", { campos: c });
    await recarregar();
  }, "Ajustes salvos.");
  const limpar = () => rodar("limpar", async () => {
    await enviar("/api/instagram/repo/limpar", {});
  }, "Limpeza do repositório na fila.");

  return (
    <section className="ig-secao">
      <details className="panel ig-ajustes">
        <summary><h2>Ajustes</h2><span className="meta">gerador, repositório, cookies</span></summary>
        <div className="ig-form">
          <label className="campo-grupo"><span className="label">Arquivo .py do gerador (contrato em motor/instagram_backend.py)</span>
            <input className="campo" value={c.backend} placeholder="D:\...\meu_gerador.py" onChange={(e) => setC({ ...c, backend: e.target.value })} />
          </label>
          <label className="campo-grupo"><span className="label">Clone local do repositório dos Reels</span>
            <input className="campo" value={c.repo_dir} placeholder="D:\instagram-reels" onChange={(e) => setC({ ...c, repo_dir: e.target.value })} />
          </label>
          <div className="ig-opcoes">
            <label className="campo-grupo"><span className="label">Dias no repositório</span>
              <input className="campo" type="number" min={1} max={60} value={c.dias} onChange={(e) => setC({ ...c, dias: Number(e.target.value) })} />
            </label>
            <label className="campo-grupo"><span className="label">cookies.txt do Instagram (opcional)</span>
              <input className="campo" value={c.cookies} onChange={(e) => setC({ ...c, cookies: e.target.value })} />
            </label>
          </div>
          <div className="switch-linha">
            <div>
              <span className="label">Subir sozinho quando o Reel ficar pronto</span>
              <p className="meta">Os vídeos vão para a branch <code>videos</code>, refeita todo dia só com os dos últimos {c.dias} dias.</p>
            </div>
            <button type="button" className="switch" role="switch" aria-checked={c.auto_subir} aria-label="Subir sozinho"
                    onClick={() => setC({ ...c, auto_subir: !c.auto_subir })} />
          </div>
          <div className="ig-linha-botoes">
            <button className="btn btn-sm btn-primary" onClick={salvar} disabled={!!rodando}>
              {rodando === "salvar" ? <Girando /> : <Check size={14} aria-hidden />}Salvar
            </button>
            {aj.repo_dir && (
              <button className="btn btn-sm btn-quiet" onClick={limpar} disabled={!!rodando}>
                <RefreshCw size={13} aria-hidden />Limpar repositório agora
              </button>
            )}
            <span className="meta">{publicados.length} Reel(s) no repositório</span>
          </div>
        </div>
      </details>
    </section>
  );
}
