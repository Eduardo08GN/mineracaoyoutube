import { Camera, Clapperboard, Gem, Globe2, Grid3x3, LayoutDashboard, Pickaxe, Radar, SlidersHorizontal } from "lucide-react";
import { CODIGOS, NOME_IDIOMA, type Estado } from "../api";
import { link, type Rota } from "../rota";
import { Bandeira } from "./base";

interface Props {
  rota: Rota;
  estado: Estado | null;
  conectado: boolean;
}

export function Lateral({ rota, estado, conectado }: Props) {
  const atual = (t: Rota["tela"][]) => (t.includes(rota.tela) ? "page" : undefined);
  const novas = estado?.contagem?.nova ?? 0;
  const rodando = estado?.atual;
  return (
    <aside className="side" aria-label="Navegação">
      <a className="lockup" href={link.painel} aria-label="Minerador — painel">
        <span className="logo-min" aria-hidden><Pickaxe size={18} strokeWidth={2.2} /></span>
        <span className="marca">
          <span className="wordmark">Minerador</span>
          <span className="ver">1.0</span>
        </span>
      </a>
      <nav>
        <a className="nav-i" href={link.painel} aria-current={atual(["painel"])}>
          <LayoutDashboard size={18} aria-hidden /><span>Painel</span>
        </a>
        <a className="nav-i" href={link.garimpo} aria-current={atual(["garimpo"])}>
          <Pickaxe size={18} aria-hidden /><span>Garimpo</span>
          {rodando && <span className="dot-vivo" aria-label="garimpando agora" />}
        </a>
        <a className="nav-i" href={link.oportunidades} aria-current={atual(["oportunidades", "oportunidade"])}>
          <Gem size={18} aria-hidden /><span>Oportunidades</span>
          {novas > 0 && <span className="count" aria-label={`${novas} novas`}>{novas}</span>}
        </a>
        <a className="nav-i" href={link.mapa} aria-current={atual(["mapa"])}>
          <Globe2 size={18} aria-hidden /><span>Mapa de personas</span>
        </a>
        <a className="nav-i" href={link.matriz} aria-current={atual(["matriz"])}>
          <Grid3x3 size={18} aria-hidden /><span>Matriz</span>
        </a>
        <a className="nav-i" href={link.radar} aria-current={atual(["radar"])}>
          <Radar size={18} aria-hidden /><span>Radar</span>
        </a>
        <a className="nav-i" href={link.producao} aria-current={atual(["producao", "video"])}>
          <Clapperboard size={18} aria-hidden /><span>Produção</span>
        </a>
        <a className="nav-i" href={link.retratos} aria-current={atual(["retratos"])}>
          <Camera size={18} aria-hidden /><span>Retratos</span>
          {estado?.retrato && <span className="conta-idioma">{estado.retrato.feitos}/{estado.retrato.total}</span>}
        </a>
        <a className="nav-i" href={link.ajustes} aria-current={atual(["ajustes"])}>
          <SlidersHorizontal size={18} aria-hidden /><span>Ajustes</span>
        </a>
      </nav>
      {/* ⭐ as mesmas oportunidades em outros idiomas, igual a aba de idiomas do OW Agente */}
      <nav className="nav-idiomas" aria-label="Idiomas">
        <span className="label nav-grupo">Mercados</span>
        {CODIGOS.map((c) => (
          <a key={c} className="nav-i" href={link.idioma(c)} aria-current={rota.tela === "idioma" && rota.cod === c ? "page" : undefined}
             title={`${estado?.nativas?.[c] ?? 0} nativas · ${estado?.idiomas?.[c] ?? 0} equivalências`}>
            <span className="sigla-nav" aria-hidden><Bandeira cod={c} h={11} /></span><span>{NOME_IDIOMA[c]}</span>
            <span className="conta-idioma">{(estado?.nativas?.[c] ?? 0) + (estado?.idiomas?.[c] ?? 0)}</span>
          </a>
        ))}
      </nav>
      <div className="foot">
        <span className="label">Cota de hoje</span>
        <div className="foot-leva">
          {estado ? `${estado.cota.livres.toLocaleString("pt-BR")} livres` : "—"}
        </div>
        <div className={`conexao ${conectado ? "on" : ""}`}>
          <span className="dot" aria-hidden />{conectado ? "Ao vivo" : "Reconectando…"}
        </div>
      </div>
    </aside>
  );
}
