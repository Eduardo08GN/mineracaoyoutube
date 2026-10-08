import { temSenha } from "./api";
import { useMinerador } from "./estado";
import { useRota } from "./rota";
import { Lateral } from "./componentes/Lateral";
import { AvisoFlutuante, Vazio } from "./componentes/base";
import { Painel } from "./telas/Painel";
import { Garimpo } from "./telas/Garimpo";
import { Oportunidades } from "./telas/Oportunidades";
import { Oportunidade } from "./telas/Oportunidade";
import { Matriz } from "./telas/Matriz";
import { Radar } from "./telas/Radar";
import { Ajustes } from "./telas/Ajustes";
import { Idioma } from "./telas/Idioma";
import { Mapa } from "./telas/Mapa";
import { Retratos } from "./telas/Retratos";

export function App() {
  const m = useMinerador();
  const rota = useRota();

  let tela;
  if (!temSenha) {
    tela = <Vazio titulo="Abra pelo Minerador" texto="Este painel abre pelo atalho do Minerador, que traz a senha da sessão." />;
  } else if (m.erro && !m.estado) {
    tela = <Vazio titulo="Sem conexão com o Minerador" texto="Confira se o Minerador está aberto. O painel tenta de novo sozinho." />;
  } else if (rota.tela === "garimpo") tela = <Garimpo m={m} />;
  else if (rota.tela === "oportunidades") tela = <Oportunidades m={m} garimpo={rota.garimpo} />;
  else if (rota.tela === "oportunidade") tela = <Oportunidade m={m} id={rota.id} />;
  else if (rota.tela === "matriz") tela = <Matriz m={m} />;
  else if (rota.tela === "radar") tela = <Radar m={m} />;
  else if (rota.tela === "ajustes") tela = <Ajustes m={m} />;
  else if (rota.tela === "idioma") tela = <Idioma m={m} cod={rota.cod} />;
  else if (rota.tela === "mapa") tela = <Mapa m={m} />;
  else if (rota.tela === "retratos") tela = <Retratos m={m} />;
  else tela = <Painel m={m} />;

  return (
    <div className="app">
      <Lateral rota={rota} estado={m.estado} conectado={m.conectado} />
      <main>{tela}</main>
      <AvisoFlutuante aviso={m.aviso} fechar={m.fecharAviso} />
    </div>
  );
}
