import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, Clipboard, Image, Pause, Play, SkipForward, Upload } from "lucide-react";
import { enviar, obter, urlRetrato, type Persona, type PromptRetrato, type RetratosEstado } from "../api";
import type { MIN } from "../estado";
import { Girando, useAcao } from "../componentes/base";

export function Retratos({ m }: { m: MIN }) {
  const cat = m.catalogo;
  const [ret, setRet] = useState<RetratosEstado | null>(m.estado?.retrato ?? null);
  const [prompt, setPrompt] = useState<PromptRetrato | null>(null);
  const { rodando, rodar } = useAcao(m.avisar);

  const recarregar = useCallback(async () => {
    try {
      const e = await obter<{ retrato: RetratosEstado }>("/api/estado").then((r) => r.retrato);
      setRet(e);
    } catch { /* o aviso cuida */ }
  }, []);

  useEffect(() => {
    if (m.estado?.retrato) setRet(m.estado.retrato);
  }, [m.estado?.retrato]);

  useEffect(() => { recarregar(); }, [recarregar, m.versaoOps]);

  if (!cat) return <div className="tela"><p className="meta">Carregando...</p></div>;

  const personas = cat.personas;
  const feitos = ret?.feitos ?? 0;
  const total = ret?.total ?? personas.length;
  const ativo = ret?.ativo ?? false;
  const atual = ret?.atual ?? "";
  const semRetrato = personas.filter((p) => p.retrato === 0);

  const iniciar = () => rodar("iniciar", async () => {
    const r = await enviar<RetratosEstado>("/api/retratos/iniciar", { ids: null });
    setRet(r);
    m.avisar("Modo retrato iniciado. Copie o prompt, cole no Flow e baixe a imagem.", "ok");
  });

  const pular = () => rodar("pular", async () => {
    const r = await enviar<RetratosEstado>("/api/retratos/pular", {});
    setRet(r);
  });

  const parar = () => rodar("parar", async () => {
    const r = await enviar<RetratosEstado>("/api/retratos/parar", {});
    setRet(r);
  });

  const copiarPrompt = (pid: string) => rodar("copiar", async () => {
    const r = await obter<PromptRetrato>(`/api/personas/${encodeURIComponent(pid)}/prompt?copiar=1`);
    setPrompt(r);
    m.avisar("Prompt copiado para a área de transferência.", "ok");
  });

  return (
    <div className="tela">
      <div className="tela-topo">
        <div>
          <p className="eyebrow">Retratos das personas</p>
          <h1>Cada persona ganha <em>um rosto.</em></h1>
          <p className="lead">
            A imagem de cada persona no estilo do canal do Elias Yoder: retrato cinematico 16:9.
            Gere no Google Flow (Veo), baixe, e o Minerador guarda automaticamente.
            Arraste uma imagem para qualquer celula para inserir manualmente.
          </p>
        </div>
        <div className="tela-acoes">
          <span className="ret-progresso">{feitos}/{total}</span>
          {!ativo && semRetrato.length > 0 && (
            <button className="btn btn-sol" onClick={iniciar} disabled={!!rodando}>
              {rodando === "iniciar" ? <Girando /> : <Play size={14} fill="currentColor" aria-hidden />}
              Iniciar modo retrato
            </button>
          )}
          {ativo && (
            <>
              <button className="btn btn-quiet" onClick={pular} disabled={!!rodando}>
                <SkipForward size={14} aria-hidden />Pular
              </button>
              <button className="btn btn-quiet" onClick={parar} disabled={!!rodando}>
                <Pause size={14} aria-hidden />Parar
              </button>
            </>
          )}
        </div>
      </div>

      {ativo && ret && (
        <ModoAtivo ret={ret} prompt={prompt} copiarPrompt={copiarPrompt} personas={personas} />
      )}

      <div className="ret-grade">
        {personas.map((p) => (
          <CelulaPersona key={p.id} p={p} ativa={ativo && atual === p.id} copiarPrompt={copiarPrompt}
                         avisar={m.avisar} recarregar={recarregar} />
        ))}
      </div>
    </div>
  );
}

function ModoAtivo({ ret, prompt: promptProp, copiarPrompt, personas }:
  { ret: RetratosEstado; prompt: PromptRetrato | null; copiarPrompt: (pid: string) => void;
    personas: Persona[] }) {
  const p = personas.find((x) => x.id === ret.atual);
  const txt = ret.prompt || promptProp?.prompt || "";
  return (
    <div className="panel ret-ativo">
      <div className="ret-ativo-topo">
        <Camera size={20} aria-hidden />
        <div>
          <strong>Gerando: {p?.nome ?? ret.atual}</strong>
          <span className="meta">Faltam {(ret.restam ?? 0) + 1} de {ret.total}</span>
        </div>
      </div>
      <div className="ret-prompt-caixa">
        <pre className="ret-prompt">{txt}</pre>
        <button className="btn btn-sm btn-quiet" onClick={() => copiarPrompt(ret.atual!)}>
          <Clipboard size={13} aria-hidden />Copiar prompt
        </button>
      </div>
      <ol className="ret-passos">
        <li><strong>1.</strong> O prompt ja esta copiado na area de transferencia</li>
        <li><strong>2.</strong> Cole no Google Flow (conta do Dolphin Anty)</li>
        <li><strong>3.</strong> Baixe a imagem — o Minerador detecta o download e guarda</li>
        <li><strong>4.</strong> O proximo prompt e copiado automaticamente</li>
      </ol>
    </div>
  );
}

function CelulaPersona({ p, ativa, copiarPrompt, avisar, recarregar }:
  { p: Persona; ativa: boolean; copiarPrompt: (pid: string) => void;
    avisar: (t: string, tom?: "ok" | "erro") => void; recarregar: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const url = urlRetrato(p);

  const aoSoltar = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const ext = file.name.split(".").pop() || "png";
    const b64 = await fileToBase64(file);
    try {
      await enviar(`/api/personas/${encodeURIComponent(p.id)}/retrato`, { imagem: b64, ext });
      avisar(`Retrato de ${p.nome} guardado.`, "ok");
      recarregar();
    } catch (err) {
      avisar(err instanceof Error ? err.message : String(err), "erro");
    }
  }, [p.id, p.nome, avisar, recarregar]);

  const aoEscolher = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop() || "png";
    const b64 = await fileToBase64(file);
    try {
      await enviar(`/api/personas/${encodeURIComponent(p.id)}/retrato`, { imagem: b64, ext });
      avisar(`Retrato de ${p.nome} guardado.`, "ok");
      recarregar();
    } catch (err) {
      avisar(err instanceof Error ? err.message : String(err), "erro");
    }
  }, [p.id, p.nome, avisar, recarregar]);

  return (
    <div className={`ret-cel${ativa ? " ret-ativa" : ""}${p.retrato > 0 ? " ret-ok" : ""}${arrastando ? " ret-drop" : ""}`}
         onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
         onDragLeave={() => setArrastando(false)}
         onDrop={aoSoltar}>
      <div className="ret-img">
        {url ? (
          <img src={url} alt={p.nome} loading="lazy" />
        ) : (
          <div className="ret-sem">
            <Image size={24} aria-hidden />
          </div>
        )}
        {p.retrato > 0 && <span className="ret-badge"><Check size={11} strokeWidth={3} /></span>}
        {p.retrato > 0 && p.retrato_de !== p.id && <span className="ret-emprestada">emprestada</span>}
      </div>
      <strong className="ret-nome">{p.nome}</strong>
      <span className="ret-marca">{p.marca}</span>
      <div className="ret-btns">
        <button className="btn btn-xs btn-quiet" onClick={() => copiarPrompt(p.id)} title="Copiar prompt do retrato">
          <Clipboard size={12} aria-hidden />
        </button>
        <button className="btn btn-xs btn-quiet" onClick={() => inputRef.current?.click()} title="Enviar imagem">
          <Upload size={12} aria-hidden />
        </button>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
               onChange={aoEscolher} />
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
