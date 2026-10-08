// A conversa com o servidor local do Minerador (agente/servidor.py).

export interface Cota {
  dia: string;
  usadas: number;
  limite: number;
  livres: number;
}

export type CodIdioma = "fr" | "de";
export const CODIGOS: CodIdioma[] = ["fr", "de"];

export interface InfoIdioma {
  nome: string;
  sigla: string;
}

export interface Atual {
  tipo: "garimpo" | "radar" | "equivalentes";
  id: number;
  persona: string;
  etapa: string;
}

export interface Estado {
  cota: Cota;
  atual: Atual | null;
  na_fila: number;
  chave: string;
  claude: boolean;
  ajustes: { rpm: number };
  contagem: Record<string, number>;
  idiomas: Partial<Record<CodIdioma, number>>;
}

export interface Persona {
  id: string;
  nome: string;
  marca: string;
  quem: string;
  saturacao: number;
}

export interface Filtros {
  antes: string;
  min_views: number;
  min_duracao: number;
  remakes: number;
  reescrever: number;
  remake_depois: string;
  equivalentes: number;
  idiomas: string;
}

export interface Catalogo {
  personas: Persona[];
  temas: string[];
  filtros: Filtros;
  idiomas: Record<CodIdioma, InfoIdioma>;
}

export type EstadoGarimpo = "fila" | "rodando" | "pronto" | "falhou" | "cancelado";

export interface Garimpo {
  id: number;
  criado: number;
  fim: number | null;
  sementes: string[];
  persona: string;
  filtros: Filtros;
  estado: EstadoGarimpo;
  etapa: string;
  achados: number;
  cota: number;
  erro: string;
}

export interface Remake {
  id: string;
  titulo: string;
  views: number;
  publicado: string;
  canal: string;
}

export type EstadoOp = "nova" | "salva" | "descartada" | "produzida";

export interface Oportunidade {
  id: number;
  video_id: string;
  persona: string;
  garimpo_id: number;
  semente: string;
  outlier: number;
  nota: number;
  n_remakes: number;
  remakes: Remake[];
  titulos: string[];
  tema: string;
  angulo: string;
  encaixe: number;
  estado: EstadoOp;
  titulo: string;
  canal: string;
  canal_id: string;
  publicado: string;
  views: number;
  likes: number;
  comentarios: number;
  duracao: number;
  thumb: string;
  inscritos: number | null;
  receita: number;
  /** views por ano ÷ (1 + remakes). -1 = remakes nao checados */
  fome: number;
  /** "fr,de" quando ja' tem equivalentes */
  idiomas_eq: string | null;
}

export interface VideoCurto {
  id: string;
  titulo: string;
  views: number;
  publicado: string;
  canal: string;
  thumb?: string;
}

export interface Equivalente {
  op_id: number;
  idioma: CodIdioma;
  titulo: string;
  consulta: string;
  persona_local: string;
  demanda: number;
  oferta_recente: number;
  com_persona: number;
  top: VideoCurto[];
  fome: number;
  aberto: boolean;
}

export interface EquivalenteLista extends Equivalente {
  persona: string;
  nota: number;
  titulos: string[];
  original: string;
  thumb: string;
  views: number;
}

export interface DetalheOp extends Oportunidade {
  canal_info: { nome: string; inscritos: number; n_videos: number; criado: string; thumb: string };
  sinais: Record<"views" | "outlier" | "demanda" | "lacuna" | "encaixe", number>;
  equivalentes: Partial<Record<CodIdioma, Equivalente>>;
}

export interface Celula {
  persona: string;
  tema: string;
  n: number;
  media: number;
  maxima: number;
}

export interface ResumoPersona {
  demanda: number;
  remakes: number;
  checados: number;
  n: number;
  capa: string;
  melhor: number;
  melhor_id?: number;
  fome: number;
}

export interface Matriz extends Catalogo {
  celulas: Celula[];
  resumo: Record<string, ResumoPersona>;
}

export interface CanalRadar {
  id: string;
  persona: string;
  nome: string;
  inscritos: number;
  n_videos: number;
  views: number;
  criado: string;
  thumb: string;
  descricao: string;
  video_id: string;
  video_views: number;
}

export type Evento =
  | ({ tipo: "estado" } & Estado)
  | { tipo: "log"; linha: string }
  | { tipo: "aviso"; texto: string; tom?: "ok" | "erro" | "" }
  | { tipo: "mudou"; o: "garimpos" | "oportunidades" | "radar" | "ajustes" };

// A senha da sessao chega na URL (?t=...). Guardada na aba e tirada da barra de endereco.
const token: string = (() => {
  const url = new URL(window.location.href);
  const daUrl = url.searchParams.get("t");
  let guardada: string | null = null;
  try {
    if (daUrl) sessionStorage.setItem("min-t", daUrl);
    guardada = sessionStorage.getItem("min-t");
  } catch {
    /* sem armazenamento: fica so' a da URL */
  }
  if (daUrl) {
    url.searchParams.delete("t");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }
  return daUrl ?? guardada ?? "";
})();

export const temSenha = token !== "";

export class ErroApi extends Error {
  status: number;
  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.status = status;
  }
}

export function obter<T>(caminho: string): Promise<T> {
  return pedir<T>(caminho, { headers: { "X-Token": token } });
}

export function enviar<T = unknown>(caminho: string, corpo?: unknown): Promise<T> {
  return pedir<T>(caminho, {
    method: "POST",
    headers: { "X-Token": token, "Content-Type": "application/json" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
}

async function pedir<T>(caminho: string, opcoes: RequestInit): Promise<T> {
  const r = await fetch(caminho, opcoes);
  if (!r.ok) {
    let msg = r.statusText;
    try {
      const corpo = await r.json();
      msg = corpo.detail ?? corpo.erro ?? msg;
    } catch {
      /* corpo sem JSON */
    }
    throw new ErroApi(r.status, msg);
  }
  return r.json() as Promise<T>;
}

/** O que a janela do aplicativo (agente/painel.py) oferece. Fora dela (navegador comum) nao existe. */
export interface Ponte {
  abrir_link(url: string): Promise<boolean>;
}

declare global {
  interface Window {
    pywebview?: { api?: Ponte };
  }
}

/** Abre um link do YouTube/X: pela janela (navegador padrao) ou numa aba nova. */
export function abrirLink(url: string) {
  const p = window.pywebview?.api;
  if (p) void p.abrir_link(url);
  else window.open(url, "_blank", "noopener,noreferrer");
}

/** A capa de qualquer video do YouTube pelo id (nao precisa da API). */
export const capa = (id: string, q: "mq" | "hq" = "mq") => `https://i.ytimg.com/vi/${encodeURIComponent(id)}/${q}default.jpg`;
export const embed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1`;

export const linkVideo = (id: string) => `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
export const linkCanal = (id: string) => `https://www.youtube.com/channel/${encodeURIComponent(id)}`;

/** Abre o canal de eventos e reconecta sozinho. Devolve a funcao que fecha. */
export function conectarEventos(
  aoEvento: (e: Evento) => void,
  aoConectar: (conectado: boolean) => void,
): () => void {
  let ws: WebSocket | null = null;
  let espera = 500;
  let fechado = false;
  let relogio: number | undefined;

  const abrir = () => {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${proto}://${window.location.host}/api/eventos?t=${encodeURIComponent(token)}`);
    ws.onopen = () => {
      espera = 500;
      aoConectar(true);
    };
    ws.onmessage = (m) => {
      try {
        aoEvento(JSON.parse(m.data) as Evento);
      } catch {
        /* mensagem quebrada: ignora */
      }
    };
    ws.onclose = () => {
      aoConectar(false);
      if (fechado) return;
      relogio = window.setTimeout(abrir, espera);
      espera = Math.min(espera * 2, 8000);
    };
  };
  abrir();
  return () => {
    fechado = true;
    window.clearTimeout(relogio);
    ws?.close();
  };
}
