import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen, Check, ChevronDown, ChevronRight, Clipboard, ExternalLink, FolderGit2, ImagePlus, Play, Plus,
  RefreshCw, Sparkles, Trash2, Upload, X,
} from "lucide-react";
import {
  comSenha, enviar, obter, type AjustesIG, type AvatarIG, type CenaIG, type InstagramTudo, type ReelIG,
} from "../api";
import type { MIN } from "../estado";
import { Girando, useAcao } from "../componentes/base";

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

      {!dados.gerador.ok && (
        <div className="panel ig-alerta">
          <strong>Nenhum gerador de imagem e vídeo configurado.</strong>
          <p className="meta">{dados.gerador.texto}. O contrato do arquivo está em motor/instagram_backend.py.</p>
        </div>
      )}

      <section className="ig-secao">
        <div className="ig-secao-topo">
          <h2>Avatar</h2>
          {dados.avatares.length > 0 && !criando && (
            <button className="btn btn-sm btn-quiet" onClick={() => setCriando(true)}><Plus size={14} aria-hidden />Novo avatar</button>
          )}
        </div>
        {(criando || dados.avatares.length === 0) ? (
          <NovoAvatar avisar={m.avisar} cancelar={dados.avatares.length ? () => setCriando(false) : undefined}
                      criado={(a) => { setEscolhido(a.id); setCriando(false); void recarregar(); }} />
        ) : (
          <>
            {dados.avatares.length > 1 && (
              <div className="seg" role="group" aria-label="Avatares">
                {dados.avatares.map((a) => (
                  <button key={a.id} aria-pressed={a.id === avatar?.id} onClick={() => setEscolhido(a.id)}>{a.nome}</button>
                ))}
              </div>
            )}
            {avatar && <FichaAvatar a={avatar} avisar={m.avisar} recarregar={recarregar} />}
          </>
        )}
      </section>

      {avatar && !criando && (
        <>
          <Pool a={avatar} avisar={m.avisar} recarregar={recarregar} rodando={rodando} rodar={rodar} />
          <NovoReel a={avatar} idiomas={dados.idiomas} avisar={m.avisar} recarregar={recarregar} />
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

      <AjustesIgTela aj={dados.ajustes} publicados={dados.publicados} avisar={m.avisar} recarregar={recarregar} />
    </div>
  );
}

function NovoAvatar({ avisar, cancelar, criado }: { avisar: Avisar; cancelar?: () => void; criado: (a: AvatarIG) => void }) {
  const [nome, setNome] = useState("");
  const [tomiko, setTomiko] = useState(true);
  const [foto, setFoto] = useState<File | null>(null);
  const [previa, setPrevia] = useState("");
  const { rodando, rodar } = useAcao(avisar);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!foto) { setPrevia(""); return; }
    const u = URL.createObjectURL(foto);
    setPrevia(u);
    return () => URL.revokeObjectURL(u);
  }, [foto]);

  const criar = () => rodar("criar", async () => {
    if (!foto) throw new Error("escolha a foto de referência do avatar");
    const a = await enviar<AvatarIG>("/api/instagram/avatares", {
      nome: nome || (tomiko ? "Tomiko Hayashi" : ""), imagem: await lerArquivo(foto), ext: extDe(foto), tomiko,
    });
    criado(a);
  }, "Avatar criado.");

  return (
    <div className="panel ig-novo-avatar">
      <button type="button" className={`ig-foto ig-foto-vazia${previa ? " tem" : ""}`} onClick={() => input.current?.click()}
              aria-label="Escolher a foto do avatar">
        {previa ? <img src={previa} alt="" /> : <><ImagePlus size={22} aria-hidden /><span>Foto de referência</span></>}
      </button>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
             onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
      <div className="ig-form">
        <label className="campo-grupo">
          <span className="label">Nome</span>
          <input className="campo" value={nome} placeholder={tomiko ? "Tomiko Hayashi" : "Nome do avatar"}
                 onChange={(e) => setNome(e.target.value)} />
        </label>
        <div className="switch-linha">
          <div>
            <span className="label">Usar a ficha da Tomiko</span>
            <p className="meta">Descrição, voz e os 8 cômodos da chácara em Londrina já preenchidos.</p>
          </div>
          <button type="button" className="switch" role="switch" aria-checked={tomiko} aria-label="Usar a ficha da Tomiko"
                  onClick={() => setTomiko(!tomiko)} />
        </div>
        <div className="ig-linha-botoes">
          <button className="btn btn-primary" onClick={criar} disabled={!!rodando || !foto}>
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

function NovoReel({ a, idiomas, avisar, recarregar }: {
  a: AvatarIG; idiomas: Record<string, string>; avisar: Avisar; recarregar: () => Promise<void>;
}) {
  const [url, setUrl] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [idioma, setIdioma] = useState("pt");
  const [cta, setCta] = useState<"bio" | "palavra">("bio");
  const [palavra, setPalavra] = useState("");
  const [livro, setLivro] = useState(false);
  const [modelo, setModelo] = useState<"gratis" | "pago">("gratis");
  const { rodando, rodar } = useAcao(avisar);
  const input = useRef<HTMLInputElement>(null);
  const aprovadas = a.cenas.filter((c) => c.estado === "aprovada").length;

  useEffect(() => { if (!a.livro) setLivro(false); }, [a.livro]);

  const produzir = () => rodar("reel", async () => {
    await enviar("/api/instagram/reels", {
      avatar: a.id, idioma, url: arquivo ? "" : url.trim(), video: arquivo ? await lerArquivo(arquivo) : "",
      ext: arquivo ? extDe(arquivo) : "mp4", cta, palavra, livro, modelo,
    });
    setUrl(""); setArquivo(null);
    await recarregar();
  }, "Reel na fila: fonte, roteiro, geração e montagem rodam sozinhos.");

  return (
    <section className="ig-secao">
      <div className="ig-secao-topo"><h2>Novo Reel</h2></div>
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
        <div className="ig-opcoes">
          <label className="campo-grupo">
            <span className="label">Idioma</span>
            <select className="campo" value={idioma} onChange={(e) => setIdioma(e.target.value)}>
              {Object.entries(idiomas).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <div className="campo-grupo">
            <span className="label">CTA</span>
            <div className="seg" role="group" aria-label="CTA">
              <button aria-pressed={cta === "bio"} onClick={() => setCta("bio")}>Link na bio</button>
              <button aria-pressed={cta === "palavra"} onClick={() => setCta("palavra")}>Comente a palavra</button>
            </div>
          </div>
          {cta === "palavra" && (
            <label className="campo-grupo">
              <span className="label">Palavra</span>
              <input className="campo" value={palavra} placeholder="umeboshi" onChange={(e) => setPalavra(e.target.value)} />
            </label>
          )}
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
            <p className="meta">{a.livro ? "O último take termina com o avatar segurando o livro." : "Suba a capa do livro na ficha do avatar."}</p>
          </div>
          <button type="button" className="switch" role="switch" aria-checked={livro} aria-label="Livro no CTA"
                  disabled={!a.livro} onClick={() => setLivro(!livro)} />
        </div>
        <div className="ig-linha-botoes">
          <button className="btn btn-primary" onClick={produzir}
                  disabled={!!rodando || !aprovadas || (!url.trim() && !arquivo) || (cta === "palavra" && !palavra.trim())}>
            {rodando ? <Girando /> : <Play size={14} fill="currentColor" aria-hidden />}Produzir Reel
          </button>
          {!aprovadas && <span className="meta">Aprove pelo menos um cômodo do universo-lar.</span>}
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
        {ocupado && <span className="ig-reel-girando"><Girando />{r.trabalhando ? r.etapas.find((e) => e.id === r.trabalhando)?.nome : "na fila"}</span>}
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
          <b>·</b>{r.cta.tipo === "palavra" ? `comente ${r.cta.palavra}` : "link na bio"}{r.cta.livro ? " + livro" : ""}
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
