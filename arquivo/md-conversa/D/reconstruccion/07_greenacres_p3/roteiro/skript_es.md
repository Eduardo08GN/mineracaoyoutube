# Learjet de Palm Beach, parte 3: guion (ES), v2 (9 ajustes do suporte)

*Molde de 9 blocos + checklist de 15. Números escritos para a TTS. Fatos: `PAUTA_P3.md` (v2) e `dados/adsb/voo_final_calc_v2.csv`. Os tempos de cada bloco saem de `metricas_p3.py` (150 ppm).*

Cada bloco traz, abaixo do texto, a **DECLARAÇÃO DO TAKE**:
- **dims:** as dimensões cruzadas (dado, conceito, ilustração, espaço, tempo, narrativa), ≥ 3 nos blocos de mecanismo;
- **onde:** palco ou mundo;
- **componente;**
- **instrumento:** ≤ 3 grandezas + barra no objeto + relógio;
- **dêitica:** a frase que aponta para a tela, variada.

---

## 01. Abertura fria

Treinta y cinco mil pies sobre Florida. Un jet ejecutivo con nueve personas a bordo empieza a caer. Gira hacia la derecha, cada vez más inclinado, cada vez más rápido, y llega al suelo casi en vertical. En algún momento, una pieza de su cola se suelta y aparece después lejos, muy lejos del resto del avión. ¿Por qué perdió esa pieza en el aire? ¿Y qué ocurrió primero, la pieza o la caída? Los datos públicos de este vuelo cuentan más de lo que se ha contado.

> **TAKE 01 (herói, Blender na G4)**
> - **dims:** espaço (trilha real), tempo (relógio), narrativa (a pergunta do título), dado (altitude caindo).
> - **onde:** mundo; o Learjet com a pintura premium entre torres de Cb (VDB JangaFX) e luz de tempestade.
> - **componente:** `cena_learjet.py` modo `--anim`, câmera chase que vira órbita larga e trilha real em laranja atrás do avião.
> - **instrumento:** só o relógio (12:48:16 →) e a altitude no canto livre, pela máscara.
> - **dêitica:** nenhuma (abertura fria).
> - **Respeito:** o take corta ANTES do solo, em plano longo, com a trilha terminando num ponto sobre o mapa.

## 02. Lo nuevo

¿Qué apareció este martes? Los investigadores de la junta de seguridad del transporte de Estados Unidos encontraron la mayor parte del timón de profundidad izquierdo, en tres pedazos. El timón de profundidad es la parte móvil del ala pequeña de la cola, la que sube o baja el morro. Esos pedazos no estaban en el cráter. Estaban a entre dos y seis kilómetros. Un miembro de la junta lo llamó una prueba muy, muy significativa. Pero también dijo que todavía no saben si esa pieza hizo caer el avión, o si fue la caída la que la arrancó. Para acercarnos a esa respuesta, fuimos a buscar los datos completos del vuelo.

> **TAKE 02a (palco, explicação AiTelly)**
> - **dims:** conceito (o que é o timón de profundidad), ilustração (modelo por código), dado (3 pedaços), narrativa.
> - **onde:** palco "planta azul" com chão que reflete; cauda em T por código, uma cor por subsistema (deriva cinza-grafite, estabilizador azul, timón de profundidad laranja-sinal).
> - **componente:** `ModeloCaudaT` (novo, por código) + `RotuloChamada`.
> - **instrumento:** contador "pedazos: 3".
> - **dêitica:** "la parte móvil del ala pequeña de la cola": a câmera desce até a dobradiça e o timón esquerdo pisca e se separa em 3 pedaços.
>
> **TAKE 02b (mundo)**
> - **dims:** espaço (bairro real), dado (2–6 km), tempo (terça 03/11).
> - **onde:** mapa 3D de Greenacres (NAIP + OSM2World).
> - **componente:** `EsquemaNaCena`: o anel tracejado de 2 a 6 km nasce da cratera, sem ainda mostrar a trilha (ela entra no bloco 08).
> - **instrumento:** régua de distância no anel.
> - **dêitica:** "no estaban en el cráter": a câmera sobe do cráter até o anel.

## 03. El vuelo completo

¿Cómo llegó este avión hasta ahí? Es domingo, primero de noviembre. El Learjet sale de Austin, en Texas, rumbo a las Bahamas, en un vuelo chárter. Cruza el golfo de México y entra en Florida por el oeste, a treinta y cinco mil pies. Delante tiene una línea de tormentas. La tripulación avisa al control de Miami de hielo ligero, que considera manejable, y de turbulencia moderada. El avión sube y baja unos doscientos metros, como un ascensor sin frenos. Afuera hace cuarenta y siete grados bajo cero. Piden subir, buscando aire más tranquilo, y el control lo autoriza. El avión empieza a subir. Y a las doce y cuarenta y ocho, empieza a bajar.

> **TAKE 03 (mundo, simulação contínua, take a: parte 1)**
> - **dims:** dado (ADS-B real), espaço (globo → Florida), tempo (relógio 40×), ilustração (avião + tormentas).
> - **onde:** mundo; globo com a trilha real Austin → Florida que se desenha, depois Florida com a cortina NEXRAD ao fundo.
> - **componente:** `TrilhaADSB` (dados do CSV) + painel vivo.
> - **instrumento:**
>   - painel: altitude, velocidade, temperatura externa;
>   - barra NO avião: "a la altura del avión: hielo ligero · turbulencia";
>   - relógio "40×".
> - **dêitica:** "como un ascensor sin frenos": o avião oscila ±200 m sobre uma régua vertical presa a ele.
> - **Texto do rádio:** só em legenda de texto, sem áudio real.

## 04. Segundo a segundo

Vamos a seguirlo segundo a segundo, con los puntos que el propio avión transmitía. Fíjate en el reloj: desde aquí va a tiempo real.

Al poco de empezar a bajar, el avión ya pasa su límite de Mach. Mach es la velocidad comparada con la del sonido. Este avión no debe pasar de ocho décimas de esa velocidad, porque a partir de ahí el aire sobre el ala empieza a comportarse de otra manera. Mira la aguja: la cruza aquí, todavía arriba del todo.

Entonces empieza a girar. Con la curva que dibujan los puntos, se puede estimar cuánto se inclinan las alas. Primero poco. Después mucho más. Más tarde, la tripulación diría por radio que iban inclinados sesenta grados, casi con un ala apuntando al suelo. Y aquí está lo traicionero, como principio general: en un giro coordinado, el peso se siente hacia el asiento, no de lado. Dentro de una nube, sin horizonte, una inclinación así puede pasar inadvertida hasta que los instrumentos la muestran.

Poco después, a unos treinta mil pies, cruza otra raya: su velocidad máxima de operación. Desde aquí, cada nudo de más se paga caro, porque la presión del aire crece con el cuadrado de la velocidad.

Y ahora, fíjate en el número que todo el mundo citó. El transponder marca treinta y dos mil seiscientos cuarenta pies por minuto, y se queda clavado. No es que el avión dejara de acelerar. Es el número más grande que ese campo puede escribir, como un velocímetro que llega al tope. Con la altura que siguió enviando, la caída real fue al menos un veinte por ciento más rápida, y probablemente más al final.

Después, la altitud de presión que transmite deja de cambiar, en ocho mil setecientos cincuenta pies. Fue el último dato que se publicó. Pero el GPS del avión siguió transmitiendo. El último punto está casi encima del cráter. Con los datos completos, desde que empezó a bajar hasta el suelo pasaron setenta y siete segundos.

> **TAKE 04 (mundo, BLOCO DE MECANISMO, simulação contínua em tempo real, ~150 s)**
> - **dims:** dado × conceito × espaço × tempo × ilustração (5).
> - **onde:** mundo; o voo real de 12:48:16 a 12:49:33, câmera de presets (chase → órbita lateral → grua), nunca parada.
> - **componente:** `TrilhaADSB` + `PainelVivo` + 4 instrumentos que entram e saem com a fala, nunca todos juntos.
> - **instrumento base:** altitude, Mach e razão de descida + relógio "tiempo real".
>
> **Sub-takes (um por parágrafo, take único cada):**
> - **04c, canto do caixão (take c):** gráfico altitude × velocidade no espaço livre. O ponto do avião anda e cruza a linha "Mach 0,81". Rótulo: "límite de Mach · 12:48:27".
>   - **Dêitica:** "Mira la aguja: la cruza aquí".
> - **04d, TAKE INÉDITO, horizonte (take d):**
>   - à direita, o avião na trilha real com o horizonte girando conforme o banco estimado (proa 099° → 290°);
>   - à esquerda, o boneco no assento com a seta do peso "lo que siente: hacia el asiento";
>   - rótulo "inclinación estimada por los datos · supone viraje coordinado", na faixa de 40 a 60°, nunca 63°.
>   - rótulo do boneco: "principio general · supone viraje coordinado".
>   - **Dêitica:** "hasta que los instrumentos la muestran" (o horizonte do painel acende).
> - **04e, barra de força (take e):** barra NO avião "presión del aire / límite de operación" sobe com v². Cruza 1× às 12:48:49 (~29.700 ft), com um pulso de cor.
>   - **Dêitica:** "cruza otra raya".
> - **04t, INÉDITO 2, o contador saturado:** dois contadores lado a lado sobre a trilha:
>   - "transponder", que trava em 32.640;
>   - "calculado con la altitud", que segue até ~40.600 de média, rotulado "al menos +20 %".
>   - **Dêitica:** "fíjate en el número que todo el mundo citó".
> - **04f, fim:** o altímetro de pressão congela em 8.750 (o número fica cinza), enquanto o ponto GPS segue até o último ponto sobre o mapa do bairro. Plano longo, corta antes do solo. Cartela de 1 linha "77 s · con los datos completos".

## 05. El número en algo que conocemos

¿Qué significa caer así? En los últimos veinte segundos, el avión bajaba unos doscientos metros cada segundo. Es la Torre Latinoamericana de Ciudad de México entera, con su antena, en un solo segundo. Y además avanzaba de lado. Sumando las dos cosas, según nuestras cuentas con los datos públicos, iba a más del noventa por ciento de la velocidad del sonido. Más rápido de lo que vuela un avión de pasajeros en crucero.

> **TAKE 05 (palco)**
> - **dims:** dado (200 m/s), ilustração (torre estilizada), conceito (escala), tempo (1 s).
> - **onde:** palco "estúdio escuro" com chão que reflete.
> - **componente:**
>   - torre estilizada por código (silhueta da Torre Latinoamericana, 204 m com a antena, sem logotipo);
>   - ponto que desce a altura da torre num tique de 1 s, repetido 3 vezes com a câmera em grua;
>   - depois, o vetor horizontal + vertical vira a seta resultante.
> - **instrumento:** "≈ 200 m cada segundo"; "más del 90 % de la velocidad del sonido · estimado".
> - **dêitica:** "en un solo segundo".

## 06. Cómo puede pasar

¿Cómo acaba así un avión que volaba tranquilo un minuto antes? Hay un principio que vale para cualquier jet con alas en flecha. Arriba, a treinta y cinco mil pies, el aire es tan fino que el margen entre ir demasiado lento y demasiado rápido se estrecha. Los pilotos lo llaman el rincón del ataúd.

Si el avión baja el morro y pasa su límite de Mach, aparece un efecto traicionero. Sobre el ala, el aire se acelera hasta superar la velocidad del sonido en una zona. Y el punto donde el ala empuja hacia arriba se desplaza hacia atrás. El resultado es que el morro tiende a bajar solo, y al bajar, el avión acelera más. Por eso este modelo lleva un sistema que corrige el morro automáticamente cerca de ese límite. Se llama compensador de Mach.

Quien sostiene ese morro es la cola. Este avión tiene la cola en forma de te. Arriba de la aleta va el estabilizador horizontal, y en su borde de atrás, el timón de profundidad, la pieza que apareció a kilómetros. En los Learjet, un actuador mueve el estabilizador entero para equilibrar el avión, y el timón de profundidad da el control fino.

Ahora mira la barra sobre la cola. Un poco más rápido es mucho más empuje. A unos catorce mil pies, la presión del aire era el doble de la que admite su límite de operación. Los aviones se prueban con margen por encima de ese límite. Lo que no se sabe es qué pasó dentro de ese margen.

> **TAKE 06a (palco, Prinzipskizze "principio general · no a escala")**
> - **dims:** conceito (rincón del ataúd), dado (as duas curvas), ilustração.
> - **onde:** palco "grade holográfica".
> - **componente:** `EsquemaNaCena`: as curvas de estol e de Mach se fecham com a altitude, e o avião vira um ponto preso entre elas.
> - **dêitica:** "el margen se estrecha".
>
> **TAKE 06b (palco, take f: ciclo do Mach tuck)**
> - **dims:** conceito × ilustração × dado (Mach no contador).
> - **componente:** asa em corte em raio X; a onda de choque nasce e a seta de sustentação desliza para trás; setas em ciclo sobre o PRÓPRIO avião (morro baixa → acelera → morro baixa); os contadores aceleram a cada volta.
> - **dêitica:** "el morro tiende a bajar solo".
>
> **TAKE 06c (palco, take g: 1º MODELO EXPLICATIVO ES)**
> - **dims:** conceito × ilustração × espaço (anatomia) × dado.
> - **componente:** `ModeloCaudaT` com vista explodida; o atuador do estabilizador em raio X (rótulo "actuador", em verde; sem afirmar motor); corte da articulação; uma cor por subsistema; rótulos com linha de chamada.
> - **dêitica:** "en su borde de atrás".
>
> **TAKE 06d (palco, take e sobre o modelo)**
> - **dims:** dado × conceito × ilustração.
> - **componente:** setas de pressão sobre a cauda que crescem com v²; barra "presión / límite de operación" de 1× a 2×, com o rótulo "a ~14.000 pies".
> - **dêitica:** "mira la barra sobre la cola".

## 07. El entorno

¿Y el tiempo? Esa mañana, el globo sonda que se lanza desde Miami midió un aire más cálido de lo normal a esa altura, y viento moderado del oeste allá arriba. A la hora del accidente, el radar meteorológico de Miami veía una línea de tormentas cruzando el sur de Florida, con cimas más altas que el avión. Fíjate en la cortina del radar. El avión vuela dentro de la zona donde el radar veía lluvia, por debajo de sus cimas. Y ese viento importa más de lo que parece, por lo que viene ahora.

> **TAKE 07 (mundo, take b: cortina NEXRAD como volume)**
> - **dims:** dado (KAMX real) × espaço × tempo × ilustração.
> - **componente:**
>   - cortina vertical do radar ao longo da trilha (dBZ em cor de sinal, legenda curta) com o avião dentro; rótulo do núcleo mais próximo e das cimas;
>   - antes: o globo sonda sobe numa coluna com o perfil de temperatura e as farpas de vento, rotulado "Miami, 7:00 h".
> - **instrumento:** barra NO avião "a la altura del avión: dentro de la zona de lluvia · bajo las cimas".
> - **dêitica:** "fíjate en la cortina del radar".

## 08. Lo que leen los investigadores

¿Cómo se sabe en qué segundo se soltó una pieza? Mira este anillo. Son los lugares a entre dos y seis kilómetros del cráter, y sobre él pasa la trayectoria real del avión. Una pieza pesada sigue casi el camino del avión, como una piedra lanzada. Una pieza ligera y plana frena enseguida, planea, gira como una hoja, y el viento la empuja. Por eso los investigadores van a cruzar tres cosas: dónde cayó cada pedazo, el viento a cada altura y esta trayectoria. Con eso pueden calcular hacia atrás en qué punto, y en qué segundo, se separó. Si se soltó antes de la caída, pudo provocarla. Si se soltó durante la caída, fue la caída la que la arrancó.

Hay más pistas. La junta tiene vídeos de coches que pasaban por la avenida. Reconstruimos en tres dimensiones lo que veía un conductor desde allí, sin usar sus imágenes. El avión aparece en el cielo muy poco tiempo, casi en vertical. Y en el cráter, inundado por la lluvia, la junta espera entrar a partir de este miércoles. Ahí debería estar la grabadora de voz de la cabina, si sigue a bordo y se puede leer.

> **TAKE 08a (mundo, take i, método)**
> - **dims:** espaço × dado × conceito × tempo.
> - **componente:** o anel de 2,1–6,1 km sobre o mapa 3D; a trilha real passa por ele.
>   - Esquema lado a lado no espaço livre: peça pesada (arco balístico para a frente, quase pela trajetória) × peça leve (freia, plana, gira), com a seta do vento oeste moderado.
>   - Depois, 3 "linhas de cálculo" voltam do anel à trilha, sem ponto final marcado (não inferimos o segundo).
> - **dêitica:** "mira este anillo".
>
> **TAKE 08b (mundo, take h: prova reconstruída)**
> - **dims:** espaço × tempo × ilustração × narrativa.
> - **componente:** o ponto de vista de um carro na Military Trail recriado em 3D (rua, postes, céu de chuva, Céu 2.0). O avião cruza o quadro quase vertical por ~1 s, em plano longo, e o take corta antes do solo. Rótulo "recreación 3D · no es el vídeo original".
> - **dêitica:** "lo que veía un conductor".
>
> **TAKE 08c (mundo)**
> - **dims:** espaço × tempo × narrativa.
> - **componente:** a cratera alagada em plano longo, com o corte do terreno mostrando a água sobre o asfalto e o lugar provável da grabadora como ícone; rótulo "acceso: miércoles 4".

## 09. Lo confirmado, lo calculado, lo desconocido

Recapitulemos. Confirmado por la junta: el timón de profundidad izquierdo cayó lejos del cráter. Hay indicios de que el avión empezó a romperse antes del impacto. Y la tripulación habló de hielo, de turbulencia y de exceso de velocidad. Calculado por nosotros con datos públicos: pasó su límite de Mach casi al empezar a caer. Superó su velocidad máxima de operación a unos treinta mil pies. Y bajó más rápido de lo que su transponder podía contar. Desconocido: qué inició la caída, y si la cola falló antes o después.

La lección de este vuelo cabe en una frase: el número que se queda quieto en la pantalla no siempre es el que se quedó quieto en el cielo. Por eso, en cada accidente, los datos públicos de seguimiento ya forman parte de la investigación.

La junta publicará su informe preliminar en unas semanas. En este vuelo murieron nueve personas, y un conductor resultó herido en tierra. Nuestro recuerdo para sus familias. Y si quieres ver cómo se lee un campo de restos entero, el vídeo anterior está aquí.

> **TAKE 09 (mundo, órbita lenta de toda a trilha, nunca cartão separado)**
> - **dims:** dado × espaço × narrativa.
> - **componente:** `RotuloChamada` presos à trilha em 3 cores:
>   - verde "confirmado" no anel e na cauda;
>   - azul "calculado" nos pontos do Mach, da Vmo e do contador;
>   - cinza "desconocido" no começo da queda.
>   - A frase-regra entra como legenda de ação sobre o altímetro congelado (8.750 cinza) ao lado do ponto GPS que segue.
>   - Fim: céu limpo sobre o bairro, sem rostos, e o cartão do vídeo anterior no espaço livre.
> - **dêitica:** "el número que se queda quieto en la pantalla".
