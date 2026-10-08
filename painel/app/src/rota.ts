import { useEffect, useState } from "react";
import { CODIGOS, type CodIdioma } from "./api";

export type Rota =
  | { tela: "painel" }
  | { tela: "garimpo" }
  | { tela: "oportunidades"; garimpo: number }
  | { tela: "oportunidade"; id: number }
  | { tela: "matriz" }
  | { tela: "radar" }
  | { tela: "ajustes" }
  | { tela: "idioma"; cod: CodIdioma }
  | { tela: "mapa" }
  | { tela: "retratos" };

function ler(): Rota {
  const [caminho, busca = ""] = window.location.hash.replace(/^#\/?/, "").split("?");
  const partes = caminho.split("/").filter(Boolean);
  const params = new URLSearchParams(busca);
  if (partes[0] === "oportunidades" && partes[1] && /^\d+$/.test(partes[1])) return { tela: "oportunidade", id: Number(partes[1]) };
  if (partes[0] === "oportunidades") return { tela: "oportunidades", garimpo: Number(params.get("garimpo") || 0) };
  if (partes[0] === "garimpo") return { tela: "garimpo" };
  if (partes[0] === "matriz") return { tela: "matriz" };
  if (partes[0] === "mapa") return { tela: "mapa" };
  if (partes[0] === "radar") return { tela: "radar" };
  if (partes[0] === "retratos") return { tela: "retratos" };
  if (partes[0] === "ajustes") return { tela: "ajustes" };
  if (partes[0] === "idioma" && CODIGOS.includes(partes[1] as CodIdioma)) return { tela: "idioma", cod: partes[1] as CodIdioma };
  return { tela: "painel" };
}

export function useRota(): Rota {
  const [rota, setRota] = useState<Rota>(ler);
  useEffect(() => {
    const mudou = () => {
      setRota(ler());
      document.querySelector("main")?.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", mudou);
    return () => window.removeEventListener("hashchange", mudou);
  }, []);
  return rota;
}

export const link = {
  painel: "#/",
  garimpo: "#/garimpo",
  oportunidades: "#/oportunidades",
  doGarimpo: (id: number) => `#/oportunidades?garimpo=${id}`,
  oportunidade: (id: number) => `#/oportunidades/${id}`,
  matriz: "#/matriz",
  mapa: "#/mapa",
  radar: "#/radar",
  retratos: "#/retratos",
  ajustes: "#/ajustes",
  idioma: (c: CodIdioma) => `#/idioma/${c}`,
};
