import { useEffect, useState } from "react";
import { ExternalLink, Radar as IconeRadar } from "lucide-react";
import { abrirLink, enviar, linkCanal, obter, type CanalRadar } from "../api";
import type { MIN } from "../estado";
import { Girando, Selo, Vazio, VideoThumb, useAcao } from "../componentes/base";
import { compacto, nomePersona, saturacao } from "../textos";

function dias(criado: string) {
  const d = Math.round((Date.now() - new Date(criado).getTime()) / 86400000);
  return d < 60 ? `${d} dias` : `${Math.round(d / 30)} meses`;
}

export function Radar({ m }: { m: MIN }) {
  const [persona, setPersona] = useState("amish");
  const [lista, setLista] = useState<CanalRadar[]>([]);
  const { rodando, rodar } = useAcao(m.avisar);
  const ocupado = m.estado?.atual?.tipo === "radar";

  useEffect(() => {
    obter<CanalRadar[]>(`/api/radar?persona=${encodeURIComponent(persona)}`).then(setLista).catch(() => undefined);
  }, [persona, m.versaoRadar]);

  const p = m.catalogo?.personas.find((x) => x.id === persona);
  return (
    <div className="tela">
      <div className="tela-topo">
        <div>
          <p className="eyebrow">Radar</p>
          <h1>Canais-persona <em>novos</em></h1>
          <p className="lead">Canais criados nos últimos 18 meses, com a persona no nome ou nos vídeos mais vistos dos últimos 6 meses. Muitos canais novos = persona lotando. Poucos e grandes = sinal de nicho quente ainda aberto.</p>
        </div>
      </div>

      <div className="barra-filtros">
        <select className="campo campo-sm" value={persona} onChange={(e) => setPersona(e.target.value)} aria-label="Persona">
          {m.catalogo?.personas.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
        </select>
        {p && <Selo status={saturacao(p.saturacao)} />}
        <button className="btn btn-primary btn-sm" disabled={!!rodando || ocupado}
                onClick={() => rodar("r", () => enviar("/api/radar", { persona }), "Radar na fila (≈ 200 unidades).")}>
          {rodando || ocupado ? <Girando /> : <IconeRadar size={15} aria-hidden />}Rodar radar
        </button>
      </div>

      {lista.length ? (
        <div className="grade-radar">
          {lista.map((c) => (
            <div key={c.id} className="panel canal-card">
              {c.video_id ? (
                <VideoThumb v={{ id: c.video_id, titulo: "Vídeo mais visto nos últimos 6 meses", views: c.video_views, publicado: "", canal: c.nome }} />
              ) : <div className="vthumb-vazio">sem vídeo recente no radar</div>}
              <div className="canal-linha">
              {c.thumb ? <img className="avatar" src={c.thumb} alt="" referrerPolicy="no-referrer" /> : <span className="avatar" />}
              <div className="attn-texto">
                <strong>{c.nome}</strong>
                <p className="meta">{compacto(c.inscritos)} inscritos<b>/</b>{c.n_videos} vídeos<b>/</b>
                  {compacto(Math.round(c.inscritos / Math.max(c.n_videos, 1)))} por vídeo<b>/</b>criado há {dias(c.criado)}</p>
                {c.descricao && <p className="desc">{c.descricao}</p>}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => abrirLink(linkCanal(c.id))}><ExternalLink size={14} aria-hidden />Canal</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Vazio titulo={`Nada no radar de ${nomePersona(persona, m.catalogo?.personas)}`} texto="Rode o radar para essa persona." />
      )}
    </div>
  );
}
