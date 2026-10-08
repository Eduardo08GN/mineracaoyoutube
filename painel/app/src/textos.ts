import type { EstadoGarimpo, EstadoOp, Persona } from "./api";

export type Tom = "fila" | "run" | "voce" | "ok" | "no";

export interface Status {
  tom: Tom;
  texto: string;
}

export function statusDoGarimpo(e: EstadoGarimpo): Status {
  switch (e) {
    case "rodando": return { tom: "run", texto: "Garimpando" };
    case "pronto": return { tom: "ok", texto: "Pronto" };
    case "falhou": return { tom: "no", texto: "Parou" };
    case "cancelado": return { tom: "fila", texto: "Cancelado" };
    default: return { tom: "fila", texto: "Na fila" };
  }
}

export const ROTULO_OP: Record<EstadoOp, string> = {
  nova: "Nova", salva: "Salva", descartada: "Descartada", produzida: "Produzida",
};

/** A nota vira um tom: 70+ quente, 50+ morna, abaixo fria. */
export function tomDaNota(n: number): "quente" | "morna" | "fria" {
  return n >= 70 ? "quente" : n >= 50 ? "morna" : "fria";
}

/** 16000000 -> "16M" · 956000 -> "956 mil" */
export function compacto(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace(".", ",")} bi`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(".", ",")}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)} mil`;
  return String(n);
}

export function numero(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function dolares(n: number): string {
  return `$${compacto(n)}`;
}

/** 1133 -> "18:53" */
export function duracao(s: number): string {
  if (!s) return "";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export function ano(data: string): string {
  return data ? data.slice(0, 4) : "";
}

export function nomePersona(id: string, personas?: Persona[]): string {
  return personas?.find((p) => p.id === id)?.nome ?? id;
}

/** O nivel de saturacao (canais novos em 6 meses) em palavras. -1 = o radar ainda nao rodou. */
export function saturacao(n: number): Status {
  if (n < 0) return { tom: "fila", texto: "radar não rodou" };
  if (n <= 2) return { tom: "ok", texto: `aberta · ${n} canal(is)` };
  if (n <= 5) return { tom: "voce", texto: `esquentando · ${n} canais` };
  return { tom: "no", texto: `lotada · ${n} canais` };
}

export function quando(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
