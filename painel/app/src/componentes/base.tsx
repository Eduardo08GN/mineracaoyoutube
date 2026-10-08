import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Check, ExternalLink, Flame, Play, X } from "lucide-react";
import { abrirLink, capa, embed, linkVideo, urlRetrato, type Cota, type Oportunidade, type Persona, type VideoCurto } from "../api";
import type { Aviso } from "../estado";
import { link } from "../rota";
import { ano, compacto, dolares, nomePersona, tomDaNota, type Status } from "../textos";

export function Selo({ status }: { status: Status }) {
  const icone =
    status.tom === "ok" ? <Check size={13} strokeWidth={2.4} aria-hidden /> :
    status.tom === "no" ? <X size={13} strokeWidth={2.4} aria-hidden /> :
    <span className="dot" aria-hidden />;
  return <span className={`tag tag-${status.tom}`}>{icone}{status.texto}</span>;
}

export function Nota({ nota, grande = false }: { nota: number; grande?: boolean }) {
  return (
    <span className={`nota nota-${tomDaNota(nota)}${grande ? " grande" : ""}`} title="Nota da oportunidade (0 a 100)">
      {Math.round(nota)}
    </span>
  );
}

export function Girando() {
  return <span className="spin" aria-hidden />;
}

/** Uma acao com "rodando" e o aviso de erro, igual ao useAcao do OW Agente. */
export function useAcao(avisar: (t: string, tom?: "ok" | "erro") => void) {
  const [rodando, setRodando] = useState("");
  const rodar = useCallback(async (nome: string, fn: () => Promise<unknown>, ok?: string) => {
    setRodando(nome);
    try {
      await fn();
      if (ok) avisar(ok, "ok");
      return true;
    } catch (e) {
      avisar(e instanceof Error ? e.message : String(e), "erro");
      return false;
    } finally {
      setRodando("");
    }
  }, [avisar]);
  return { rodando, rodar };
}

export function BarraCota({ cota }: { cota: Cota }) {
  const pct = Math.min(100, (cota.usadas / cota.limite) * 100);
  return (
    <div className="cota">
      <div className="linha-meta">
        <span className="label">Cota da API hoje</span>
        <span className="meta">{cota.usadas.toLocaleString("pt-BR")} / {cota.limite.toLocaleString("pt-BR")}</span>
      </div>
      <div className={`bar${pct > 85 ? " quase" : ""}`}><span style={{ width: `${pct}%` }} /></div>
      <p className="meta">{cota.livres.toLocaleString("pt-BR")} livres · ~{Math.floor(cota.livres / 100)} buscas · zera à meia-noite do Pacífico</p>
    </div>
  );
}

export function CardOportunidade({ o, personas }: { o: Oportunidade; personas?: Persona[] }) {
  const novo = o.titulos[0];
  return (
    <a className={`panel ocard${o.estado === "salva" ? " is-salva" : ""}`} href={link.oportunidade(o.id)}>
      <div className="thumb">
        {o.thumb ? <img src={o.thumb} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" /> :
          <div className="stage-vazio">sem capa</div>}
        <Nota nota={o.nota} />
        {o.idioma && o.idioma !== "en" && <span className="thumb-origem"><Bandeira cod={o.idioma} h={14} /></span>}
        {o.idiomas_eq && (
          <span className="thumb-idiomas">{o.idiomas_eq.split(",").sort().map((c) => <SiglaIdioma key={c} cod={c} />)}</span>
        )}
        <span className="thumb-views">{compacto(o.views)} views</span>
      </div>
      <div className="body">
        <div className="original">{o.titulo}</div>
        {novo ? (
          <div className="remake"><ArrowRight size={14} aria-hidden /><span>{novo}</span></div>
        ) : (
          <div className="remake vazio-remake">sem título reescrito ainda</div>
        )}
        <div className="meta">
          <Rosto pid={o.persona} personas={personas} tam={18} />{nomePersona(o.persona, personas)}<b>/</b>{o.outlier.toFixed(1).replace(".", ",")}x<b>/</b>{ano(o.publicado)}
          <b>/</b>{o.n_remakes < 0 ? "remake ?" : o.n_remakes === 0 ? "sem remake" : `${o.n_remakes} remake(s)`}
          <b>/</b>~{dolares(o.receita)}
        </div>
        {o.fome >= 0 && (
          <div className={`fome-linha${o.fome >= 500_000 ? " alta" : ""}`} title="Views por ano ÷ (1 + remakes com a persona)">
            <Flame size={13} aria-hidden />fome {compacto(o.fome)}/ano
          </div>
        )}
        {o.estado === "inviavel" && o.producao && (
          <div className="inviavel-linha"><X size={13} aria-hidden />{o.producao}</div>
        )}
      </div>
    </a>
  );
}

export function AvisoFlutuante({ aviso, fechar }: { aviso: Aviso | null; fechar: () => void }) {
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(fechar, 7000);
    return () => window.clearTimeout(t);
  }, [aviso, fechar]);
  if (!aviso) return null;
  const tom = aviso.tom === "erro" ? "erro" : aviso.tom === "ok" ? "ok" : "";
  return (
    <div className={`toast flutuante ${tom}`} role={tom === "erro" ? "alert" : "status"} key={aviso.id}>
      {tom === "ok" ? <Check size={18} aria-hidden /> : <AlertTriangle size={18} aria-hidden />}
      <p>{aviso.texto}</p>
      <button className="btn btn-quiet btn-icon-sm" onClick={fechar} aria-label="Fechar aviso">
        <X size={16} />
      </button>
    </div>
  );
}

export function Vazio({ titulo, texto, children }: { titulo: string; texto: string; children?: React.ReactNode }) {
  return (
    <div className="panel vazio">
      <h3>{titulo}</h3>
      <p>{texto}</p>
      {children}
    </div>
  );
}

/** O video do YouTube tocando dentro do painel (sem sair da janela). */
export function PlayerYT({ id, titulo, fechar }: { id: string; titulo: string; fechar: () => void }) {
  const caixa = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    caixa.current?.showModal();
  }, []);
  return (
    <dialog ref={caixa} className="player player-yt" onClose={fechar} onClick={(e) => e.target === caixa.current && fechar()}
            aria-label={titulo}>
      <div className="player-topo">
        <span className="label player-titulo">{titulo}</span>
        <span className="row">
          <button className="btn btn-quiet btn-sm" onClick={() => abrirLink(linkVideo(id))}><ExternalLink size={14} aria-hidden />YouTube</button>
          <button className="btn btn-quiet btn-icon-sm" onClick={fechar} aria-label="Fechar"><X size={18} /></button>
        </span>
      </div>
      <div className="yt-16x9">
        <iframe src={embed(id)} title={titulo} allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      </div>
    </dialog>
  );
}

/** A capa de um video com o play por cima: clique toca aqui dentro. */
export function VideoThumb({ v, grande = false, rotulo }: { v: VideoCurto; grande?: boolean; rotulo?: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button className={`vthumb${grande ? " grande" : ""}`} onClick={() => setAberto(true)} aria-label={`Tocar: ${v.titulo}`}>
        <span className="vthumb-img">
          <img src={v.thumb || capa(v.id)} alt="" loading="lazy" decoding="async" />
          <span className="vthumb-play"><Play size={grande ? 22 : 16} fill="currentColor" aria-hidden /></span>
          <span className="thumb-views">{compacto(v.views)} views</span>
          {rotulo}
        </span>
        <span className="vthumb-titulo">{v.titulo}</span>
        <span className="meta">{v.canal}{v.publicado && <><b>/</b>{ano(v.publicado)}</>}</span>
      </button>
      {aberto && <PlayerYT id={v.id} titulo={v.titulo} fechar={() => setAberto(false)} />}
    </>
  );
}

/** O rosto da persona (o retrato gerado no Flow) num circulo; sem retrato, as iniciais. */
export function Rosto({ pid, personas, tam = 28 }: { pid: string; personas?: Persona[]; tam?: number }) {
  const p = personas?.find((x) => x.id === pid);
  const url = p ? urlRetrato(p) : "";
  const iniciais = (p?.nome ?? pid).split(/[\s-]+/).filter(Boolean).map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span className="rosto" style={{ width: tam, height: tam, fontSize: Math.round(tam * 0.38) }} title={p?.nome ?? pid} aria-hidden>
      {url ? <img src={url} alt="" loading="lazy" decoding="async" /> : iniciais}
    </span>
  );
}

export function SiglaIdioma({ cod, tom }: { cod: string; tom?: "aberto" | "fechado" }) {
  return <span className={`sigla-idioma${tom ? ` ${tom}` : ""}`}>{cod.toUpperCase()}</span>;
}


/** A bandeira do mercado desenhada (o Windows nao desenha bandeira em emoji: viraria "US", "FR"). */
export function Bandeira({ cod, h = 14 }: { cod: string; h?: number }) {
  const w = Math.round(h * 1.5);
  const comum = { width: w, height: h, viewBox: "0 0 30 20", className: "bandeira-svg", "aria-hidden": true } as const;
  if (cod === "fr") return <svg {...comum}><rect width="10" height="20" fill="#0055A4" /><rect x="10" width="10" height="20" fill="#fff" /><rect x="20" width="10" height="20" fill="#EF4135" /></svg>;
  if (cod === "de") return <svg {...comum}><rect width="30" height="7" fill="#000" /><rect y="6.67" width="30" height="6.67" fill="#DD0000" /><rect y="13.33" width="30" height="6.67" fill="#FFCE00" /></svg>;
  if (cod === "es") return <svg {...comum}><rect width="30" height="20" fill="#AA151B" /><rect y="5" width="30" height="10" fill="#F1BF00" /></svg>;
  return (
    <svg {...comum}>
      <rect width="30" height="20" fill="#B22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => <rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#fff" />)}
      <rect width="13" height={(7 * 20) / 13} fill="#3C3B6E" />
    </svg>
  );
}
