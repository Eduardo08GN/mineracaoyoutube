import { useCallback, useEffect, useRef, useState } from "react";
import { conectarEventos, obter, type Catalogo, type Estado, type Evento, type Garimpo } from "./api";

export interface Linha {
  hora: string;
  texto: string;
}

export interface Aviso {
  texto: string;
  id: number;
  tom?: "ok" | "erro" | "";
}

export interface MIN {
  estado: Estado | null;
  catalogo: Catalogo | null;
  garimpos: Garimpo[];
  registro: Linha[];
  aviso: Aviso | null;
  conectado: boolean;
  erro: string;
  /** muda quando as oportunidades mudam: quem lista recarrega */
  versaoOps: number;
  /** muda quando o radar muda */
  versaoRadar: number;
  fecharAviso: () => void;
  avisar: (texto: string, tom?: "ok" | "erro") => void;
}

const MAX_REGISTRO = 200;

function lerLinha(linha: string): Linha {
  const m = /^(\d\d:\d\d):\d\d\s+(.*)$/.exec(linha);
  return m ? { hora: m[1], texto: m[2] } : { hora: "", texto: linha };
}

export function useMinerador(): MIN {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [garimpos, setGarimpos] = useState<Garimpo[]>([]);
  const [registro, setRegistro] = useState<Linha[]>([]);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [conectado, setConectado] = useState(false);
  const [erro, setErro] = useState("");
  const [versaoOps, setVersaoOps] = useState(0);
  const [versaoRadar, setVersaoRadar] = useState(0);
  const pendente = useRef<number | undefined>(undefined);

  const recarregar = useCallback(async () => {
    try {
      const [e, gs, cat] = await Promise.all([
        obter<Estado>("/api/estado"),
        obter<Garimpo[]>("/api/garimpos"),
        obter<Catalogo>("/api/personas"),
      ]);
      setEstado(e);
      setGarimpos(gs);
      setCatalogo(cat);
      setErro("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }, []);

  // ⭐ o garimpo muda em rajadas (cada etapa grava): uma releitura por rajada
  const agendar = useCallback(() => {
    window.clearTimeout(pendente.current);
    pendente.current = window.setTimeout(recarregar, 300);
  }, [recarregar]);

  useEffect(() => {
    void recarregar();
    obter<string[]>("/api/registro").then((r) => setRegistro(r.map(lerLinha))).catch(() => undefined);
    const fechar = conectarEventos((ev: Evento) => {
      switch (ev.tipo) {
        case "estado":
          setEstado(ev);
          break;
        case "log":
          setRegistro((r) => [lerLinha(ev.linha), ...r].slice(0, MAX_REGISTRO));
          break;
        case "aviso":
          setAviso({ texto: ev.texto, id: Date.now(), tom: ev.tom });
          break;
        case "mudou":
          if (ev.o === "oportunidades") setVersaoOps((v) => v + 1);
          if (ev.o === "radar") { setVersaoRadar((v) => v + 1); setVersaoOps((v) => v + 1); }
          agendar();
          break;
      }
    }, (ok) => {
      setConectado(ok);
      if (ok) agendar();
    });
    // a cota anda durante o garimpo: o estado e' relido de tempos em tempos
    const relogio = window.setInterval(async () => {
      try {
        setEstado(await obter<Estado>("/api/estado"));
      } catch {
        /* o canal de eventos mostra a queda */
      }
    }, 5000);
    return () => {
      fechar();
      window.clearInterval(relogio);
      window.clearTimeout(pendente.current);
    };
  }, [recarregar, agendar]);

  return {
    estado, catalogo, garimpos, registro, aviso, conectado, erro, versaoOps, versaoRadar,
    fecharAviso: useCallback(() => setAviso(null), []),
    avisar: useCallback((texto: string, tom?: "ok" | "erro") => setAviso({ texto, id: Date.now(), tom }), []),
  };
}
