import { useState } from "react";
import { Check, KeyRound, X } from "lucide-react";
import { enviar } from "../api";
import type { MIN } from "../estado";
import { BarraCota, Girando, useAcao } from "../componentes/base";

export function Ajustes({ m }: { m: MIN }) {
  const e = m.estado;
  const [chave, setChave] = useState("");
  const [rpm, setRpm] = useState<string>("");
  const { rodando, rodar } = useAcao(m.avisar);
  if (!e) return <div className="tela"><p className="meta">Carregando…</p></div>;

  return (
    <div className="tela">
      <div>
        <p className="eyebrow">Ajustes</p>
        <h1>Ajustes</h1>
      </div>

      <section className="panel bloco">
        <h3>YouTube Data API</h3>
        <p>Chave atual: <code>{e.chave || "nenhuma"}</code>. Ela fica só no arquivo <code>.env</code> deste computador.</p>
        <form className="linha-campo" onSubmit={(ev) => {
          ev.preventDefault();
          void rodar("k", () => enviar("/api/ajustes", { chave }), "Chave salva.").then((ok) => ok && setChave(""));
        }}>
          <label className="input"><KeyRound size={15} aria-hidden />
            <input type="password" placeholder="cole uma chave nova" value={chave} onChange={(ev) => setChave(ev.target.value)} autoComplete="off" />
          </label>
          <button className="btn btn-ghost" disabled={chave.trim().length < 20 || !!rodando}>{rodando === "k" ? <Girando /> : null}Trocar</button>
        </form>
        <BarraCota cota={e.cota} />
      </section>

      <section className="panel bloco">
        <h3>Receita estimada</h3>
        <p>Quanto o AdSense paga por mil views no seu nicho (RPM). Os canais de persona para público americano 45+ ficam perto de $5. Muda a receita mostrada em cada oportunidade.</p>
        <form className="linha-campo" onSubmit={(ev) => {
          ev.preventDefault();
          void rodar("r", () => enviar("/api/ajustes", { rpm: Number(rpm.replace(",", ".")) }), "RPM salvo.").then((ok) => ok && setRpm(""));
        }}>
          <label className="input">$
            <input inputMode="decimal" placeholder={String(e.ajustes.rpm).replace(".", ",")} value={rpm} onChange={(ev) => setRpm(ev.target.value)} />
            por mil views
          </label>
          <button className="btn btn-ghost" disabled={!rpm.trim() || !!rodando}>{rodando === "r" ? <Girando /> : null}Salvar</button>
        </form>
      </section>

      <section className="panel bloco">
        <h3>Claude Code</h3>
        <p className={e.claude ? "ok-txt" : "erro-txt"}>
          {e.claude ? <><Check size={15} aria-hidden /> Achado nesta máquina. Ele escreve os títulos e classifica o tema.</> :
            <><X size={15} aria-hidden /> Não achado. Sem ele o garimpo roda, mas sem títulos reescritos.</>}
        </p>
      </section>

      <section className="panel bloco">
        <h3>Registro</h3>
        <ul className="registro">
          {m.registro.map((l, i) => <li key={i}><time>{l.hora}</time><span>{l.texto}</span></li>)}
        </ul>
      </section>
    </div>
  );
}
