# Regras de cena (pipeline R3F + Remotion)

1. **Personagem tem UMA pose** (`andando`, `parado`, `deitado`, `na_agua`) definida em `src/elenco.mjs`.
   O movimento sai da pose. Nunca sortear "anda" e "deita" de forma independente
   (bug de 20/10: boneco deitado deslizando com as pernas balançando).
2. **Perna casada com a velocidade**: amplitude = asin(v / cadência / 2 / comprimento da perna). Assim os pés não patinam.
3. **`validarElenco()` roda antes do render e o derruba** se houver: pose com velocidade incoerente, gente fora
   do seu meio (areia/água), alguém atravessando a câmera ou figurantes sobrepostos. Teste: `node testar_elenco.mjs`.
4. Tudo dirigido pelo quadro (`useCurrentFrame`). Nada de `useFrame` com animação própria, `Math.random` ou relógio.
   As nuvens do drei falharam por isso; usar componentes que aceitem estado por quadro.
5. A v2 exige React 19 + R3F 9.8 + drei 10.7 + @react-three/postprocessing 3.2 + postprocessing 6.39, por causa da
   Takram (atmosfera física + nuvens volumétricas com sombra no chão) e do tone mapping AgX.
