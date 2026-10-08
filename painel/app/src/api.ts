// A conversa com o servidor local do Minerador (agente/servidor.py).

/** Uma chave da YouTube API (o painel nunca ve' a chave: so' o apelido e a mascara). */
export interface ChaveInfo {
  id: string;
  mascara: string;
  usadas: number;
  limite: number;
  livres: number;
  esgotada: boolean;
  motivo: string;
  em_uso: boolean;
}

export interface Cota {
  dia: string;
  usadas: number;
  limite: number;
  livres: number;
  chaves: ChaveInfo[];
}

/** Os 4 mercados: o idioma e' o pais. */
export type CodIdioma = "en" | "fr" | "de" | "es";
export const CODIGOS: CodIdioma[] = ["en", "fr", "de", "es"];
export const BANDEIRA: Record<CodIdioma, string> = { en: "🇺🇸", fr: "🇫🇷", de: "🇩🇪", es: "🇪🇸" };
export const NOME_IDIOMA: Record<CodIdioma, string> = { en: "Inglês (EUA)", fr: "Francês", de: "Alemão", es: "Espanhol" };

export interface InfoIdioma {
  nome: string;
  sigla: string;
  bandeira: string;
  lingua: string;
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
  ajustes: { rpm: number; rpm_fr: number; rpm_de: number; rpm_es: number };
  contagem: Record<string, number>;
  idiomas: Partial<Record<CodIdioma, number>>;
  nativas: Partial<Record<CodIdioma, number>>;
  retrato: RetratosEstado;
}

export interface Persona {
  id: string;
  nome: string;
  marca: string;
  quem: string;
  saturacao: number;
  idioma: CodIdioma;
  arquetipo: string;
  busca: string;
  retrato: number;
  retrato_de: string;
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
  arquetipos: Record<string, string>;
  sementes: Record<CodIdioma, string[]>;
  min_views: Record<CodIdioma, number>;
}

/** Uma celula do mapa: a persona local de um arquetipo num mercado. */
export interface CelulaMapa {
  persona: { id: string; nome: string; marca: string };
  saturacao: number;
  n: number;
  melhor: number;
  capa: string;
  melhor_id?: number;
  fome: number;
  equiv: { n: number; abertos: number; melhor: number; capa: string; op_id: number | null; titulo: string } | null;
}

export interface LinhaMapa {
  id: string;
  nome: string;
  regiao: string;
  comum: number;
  paises: Partial<Record<CodIdioma, CelulaMapa>>;
}

export interface Mapa {
  arquetipos: LinhaMapa[];
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

export type EstadoOp = "nova" | "salva" | "descartada" | "produzida" | "inviavel";

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
  /** o mercado de origem (o da persona) */
  idioma: CodIdioma;
  /** por que nao da' para refazer com avatar + b-roll gerado (so' nas inviaveis) */
  producao?: string;
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
  /** a persona local que veste a oportunidade naquele mercado */
  persona: string;
  importada: number;
}

export interface EquivalenteLista extends Equivalente {
  persona_origem: string;
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

export interface RetratosEstado {
  ativo: boolean;
  atual?: string;
  restam?: number;
  feitos: number;
  total: number;
  prompt?: string;
  pasta?: string;
}

export interface PromptRetrato {
  persona: string;
  prompt: string;
  copiado: boolean;
}

export type Evento =
  | ({ tipo: "estado" } & Estado)
  | { tipo: "log"; linha: string }
  | { tipo: "aviso"; texto: string; tom?: "ok" | "erro" | "" }
  | { tipo: "mudou"; o: "garimpos" | "oportunidades" | "radar" | "ajustes" | "retratos" | "producao"; id?: string };

// ── a aba Producao (agente/estudio.py) ──
export type EstadoEtapa = "pronta" | "pendente" | "bloqueada" | "futura";
export interface EtapaVideo { id: string; nome: string; estado: EstadoEtapa }

export interface ResumoVideo {
  id: string;
  nome: string;
  persona: string;
  idioma: CodIdioma;
  criado: number;
  op_id: number | null;
  thumb: string;
  palavras: number;
  minutos: number;
  n_planos: number;
  etapas: EtapaVideo[];
  trabalhando: string;
}

export type TipoPlano = "avatar" | "split" | "broll";
export interface PlanoVideo {
  n: number;
  secao: number;
  secao_nome: string;
  tipo: TipoPlano;
  voz: "veo" | "minimax";
  texto: string;
  palavras: number;
  dur: number;
  inicio: number;
  cena: string;
  camada: "" | "acao" | "objeto" | "lugar" | "epoca" | "pessoas";
  busca: string;
}

export interface SecaoRoteiro { n: number; nome: string; texto: string }

export interface PerfilVideo {
  nome: string;
  apresentacao: string;
  companheiro: string;
  linhagem: string;
  tratamento: string;
  livro: string;
  site: string;
  assinatura: string;
  despedida: string;
  cenario_avatar: string;
}

export interface Video {
  id: string;
  nome: string;
  persona: string;
  idioma: CodIdioma;
  criado: number;
  op_id: number | null;
  fonte: {
    video_id: string; titulo: string; canal: string; views: number; publicado: string; thumb: string;
    pronta?: boolean; texto?: string; legenda?: string; sem_fala?: boolean; duracao?: number; descricao?: string;
  };
  mecanismo?: { resumo: string; pontos: string[]; promessa: string; itens: number; lacunas: string[] };
  roteiro: { titulos: string[]; miniatura: { texto: string; objeto: string }; secoes: SecaoRoteiro[]; palavras: number; minutos: number } | null;
  planos: PlanoVideo[];
  registro: { t: number; texto: string }[];
  perfil: PerfilVideo;
  etapas: EtapaVideo[];
  proporcoes: Record<TipoPlano, number>;
  trabalhando: string;
  na_fila: string[];
}

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

/** A URL do retrato de uma persona (ou vazio se nao tem). */
export const urlRetrato = (p: Persona) =>
  p.retrato ? `/api/personas/${encodeURIComponent(p.retrato_de)}/retrato?v=${p.retrato}&t=${encodeURIComponent(token)}` : "";

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
