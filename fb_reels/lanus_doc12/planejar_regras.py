import json, sys, itertools
CAP = {"0": "68 MINUTOS", "1": "LA ESQUINA", "2": "09:44", "3": "LA MEZCLA JUSTA", "4": "LA LLAMADA", "5": "EL PROTOCOLO",
       "6": "10:52", "7": "17 HORAS", "8": "EL SALDO", "9": "ROSARIO 2013", "10": "QUÉ HACER", "C": "68 MINUTOS"}
HORA = {"0": "09:44", "1": "09:30", "2": "09:44", "3": "09:50", "4": "10:04", "5": "10:30", "6": "10:52", "7": "02:10", "8": "—", "9": "—", "10": "—", "C": "—"}
LOJAS = ["FIAMBRERÍA", "KIOSCO", "FARMACIA", "PANADERÍA", "ROPA", "DEPTOS"]

def regra(cap, txt):
    t = txt.lower()
    if "cinco" in t and "quince" in t: return {"tipo": "nuvem", "conc_ini": 0, "conc": 10, "lojas": LOJAS}
    if "menos del cinco" in t: return {"tipo": "nuvem", "conc_ini": 0, "conc": 3, "lojas": LOJAS}
    if "más del quince" in t: return {"tipo": "nuvem", "conc_ini": 10, "conc": 22, "lojas": LOJAS}
    if "sesenta y ocho minutos" in t: return {"tipo": "numero", "valor": 68, "rotulo": "MINUTOS", "nota": "09:44 → 10:52"}
    if "dos muertos" in t or "murieron" in t and cap == "8": return {"tipo": "saldo", "itens": [{"valor": "2", "rotulo": "MUERTOS"}, {"valor": "30", "rotulo": "HERIDOS"}, {"valor": "17 h", "rotulo": "DE FUEGO"}]}
    if "diecisiete horas" in t: return {"tipo": "numero", "valor": 17, "rotulo": "HORAS DE FUEGO", "nota": "10:52 → 02:10"}
    if "veintinueve autos" in t: return {"tipo": "comparacao", "itens": [{"valor": "3", "rotulo": "COMERCIOS"}, {"valor": "29", "rotulo": "AUTOS"}, {"valor": "3", "rotulo": "EXPLOSIONES"}]}
    if "treinta heridos" in t: return {"tipo": "comparacao", "itens": [{"valor": "30", "rotulo": "HERIDOS"}, {"valor": "7", "rotulo": "GRAVES"}, {"valor": "40–90%", "rotulo": "QUEMADURAS"}]}
    if "veinte dotaciones" in t: return {"tipo": "comparacao", "itens": [{"valor": "+20", "rotulo": "DOTACIONES"}, {"valor": "+10", "rotulo": "AMBULANCIAS"}]}
    if "veintidós" in t: return {"tipo": "numero", "valor": 22, "rotulo": "MUERTOS EN ROSARIO", "nota": "6 AGO 2013 · CALLE SALTA"}
    if "controlado" in t: return {"tipo": "cita", "texto": "“Controlado.”", "fonte": "SEGÚN EL MUNICIPIO DE LANÚS"}
    if "cuatro pasos" in t or "cortar el suministro" in t: return {"tipo": "lista", "titulo": "PROTOCOLO ANTE UNA FUGA", "itens": ["Cortar el suministro", "Alejar a la gente", "Eliminar toda chispa", "Avisar a los bomberos"]}
    if "no enciendas" in t: return {"tipo": "lista", "titulo": "SI HUELES GAS", "itens": ["No toques luces", "No toques timbres", "No uses el elevador", "No arranques el auto"]}
    if "no hubo bomberos" in t: return {"tipo": "lista", "titulo": "ANTES DE LA EXPLOSIÓN", "itens": ["Sin bomberos", "Sin vallas", "Sin evacuación"]}
    if "trueno" in t or "encuentra su chispa" in t: return {"tipo": "explosao", "hora": "10:52", "rotulo": "TRES EXPLOSIONES"}
    if "tuneladora" in t or "se rompe" in t or "golpea" in t: return {"tipo": "cano", "fase_ini": 0, "fase": 1}
    if "media presión" in t or "tuberías nuevas" in t: return {"tipo": "cano", "fase_ini": 0, "fase": 0.45}
    if "a las diez y cuatro" in t: return {"tipo": "relogio", "de": "09:44", "ate": "10:04", "eventos": [{"h": "09:44", "t": "Se rompe la tubería"}, {"h": "10:04", "t": "Llegan dos técnicos"}]}
    if "diez y veinte" in t: return {"tipo": "relogio", "de": "10:20", "ate": "10:50", "eventos": [{"h": "10:20", "t": "Comercios abiertos"}, {"h": "10:40", "t": "La nube crece"}]}
    if "prensar" in t or "dos y diez" in t: return {"tipo": "relogio", "de": "10:52", "ate": "02:10", "eventos": [{"h": "10:52", "t": "Explosión"}, {"h": "02:10", "t": "Fuga controlada"}]}
    if "esquina de coronel" in t or "remedios de escalada. partido" in t: return {"tipo": "mapa", "rotulo": "REMEDIOS DE ESCALADA", "sub": "BELTRÁN Y DEL VALLE IBERLUCEA"}
    if "metrogas" in t and cap in ("1", "4"): return {"tipo": "cita", "texto": "La empresa llamó a MetroGAS. No a los bomberos.", "fonte": "SEGÚN DEFENSA CIVIL DE LANÚS"} if cap == "4" else {"tipo": "titulo", "titulo": "UNA OBRA DE METROGAS"}
    if "olor" in t: return {"tipo": "nuvem", "conc_ini": 1, "conc": 6, "lojas": LOJAS}
    if "nueve y cuarenta y cuatro" in t: return {"tipo": "relogio", "de": "09:40", "ate": "09:44", "eventos": [{"h": "09:44", "t": "Rotura"}]}
    return None

