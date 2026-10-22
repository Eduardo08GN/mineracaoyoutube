# Pesquisa: como chegar na qualidade do What If Sim (21/10/2026)

Motivo: no lado a lado do vídeo 2 o Eduardo apontou textura de areia, nuvens, água, roda-gigante e bonecos inferiores, "boneco
caído", falta de ação ("descreve e não executa") e fogo/fumaça amadores. Seis agentes pesquisaram na web, cada um conferindo
licença comercial (canal monetizado), custo na GPU e encaixe no render quadro a quadro.

**Decisão do Eduardo:** atualizar a stack atual (three.js/R3F/Remotion na G4) só com assets gratuitos. Unreal/Unity depois.
Implementação em [STACK.md](STACK.md).

## 1. Fogo e fumaça
- O problema não era o shader: faltavam **texturas animadas de simulação** e **luz na fumaça**.
- **Unity Labs, 28 flipbooks CC0** (Houdini): chamas, chama pequena com canal de temperatura, bolas de fogo, explosões,
  nuvens de fumaça. Também em EXR HDR. → adotado.
- **JangaFX, VDBs CC0** feitos no EmberGen (Fire Plume, chaminé, pluma de fumaça em alta, implosão, explosões): renderizar no
  Blender na G4 com o sol da cena e montar flipbook (ou 6-way). → próximo passo.
- Motor: partículas próprias sem estado (função do quadro), soft particles por profundidade, normais derivadas do alfa.
- three.quarks (MIT) tem flipbook e soft particles, mas usa `Math.random` e `update(delta)` e pede three ≥ 0.182 → descartado.
- Descartados por licença: Shadertoy (CC BY-NC-SA), Unity Asset Store fora do Unity, trial do EmberGen (não comercial),
  drei `cloud.png` (sem licença).

## 2. Céu, água e terreno
- **HDRIs "Pure Sky" da Poly Haven (CC0)**: fundo + luz (IBL) + reflexo. Praia: `kloofendal_48d_partly_cloudy_puresky`;
  nublado: `kloofendal_overcast_puresky`; pôr do sol: `kloppenheim_06_puresky`. Fundo em 8k (JPG tonemapped), luz em 1–2k.
- Água: shader próprio com reflexo do HDRI, Fresnel, dois normal maps, cor por profundidade e espuma (ou `Water.js` do three).
- Chão: texturas PBR CC0 (Poly Haven `coast_sand_01`, `aerial_beach_*`; ambientCG grama/piso) + quebra de repetição
  (ruído de baixa frequência; hex-tiling do Mikkelsen, MIT).
- Névoa por altura/distância com a cor do horizonte; god rays só no pôr do sol.
- Descartados: Takram atmosphere/clouds (lento), oceanos FFT/WebGPU (pedem three r181+).

## 3. Personagens, props e ação
- **Quaternius Universal Base Characters + Universal Animation Library** (mesmo esqueleto de 65 ossos; CC0 no pacote, QAL v1.0
  para lançamentos novos). Grátis: 2 corpos + 43 clipes; completo ~US$ 30.
- Mixamo para poses que faltem (uso comercial ok, sem redistribuir arquivos).
- Animação determinística: `action.time` por quadro + `mixer.update(0)` (nunca `useAnimations` do drei).
- Multidão: SkinnedMesh clonado até ~150 pessoas; `InstancedMesh2` (MIT) para centenas.
- Ação: multidão pré-calculada com semente (fuga, separação), clipe pela velocidade; Rapier determinístico pré-calculado para
  destroços; fogo/carbonização por shader.
- Props CC0: Kenney (carros, barcos, cidade), Quaternius (docas, Downtown); roda-gigante, guarda-sóis, palmeiras, gaivotas e
  hotéis com varanda gerados por código.

## 4. O que o original usa
- O What If Sim é um canal novo (12 vídeos de 03 a 21/10/2026, quase um por dia), descrições com cara de IA, nenhuma ferramenta
  divulgada → pipeline automatizado com cenas-modelo e efeitos prontos. O visual serve tanto para Unreal quanto para Blender;
  não há prova de nenhum dos dois.
- Atenção à política do YouTube contra conteúdo "inauthentic" (produção em massa repetitiva, desde 15/07/2025): adaptação
  cultural e take inédito ajudam a diferenciar.

## 5. Unity (o Eduardo tem licença)
- Viável só em VM Windows persistente com GPU (AWS g6.2xlarge ~US$ 1/h): no Linux o Unity precisa de X real e o Recorder não
  grava em `-batchmode`.
- HDRP (céu, nuvens volumétricas, água), VFX Graph com fumaça 6-way (licença Companion: só dentro do Unity).
- Risco jurídico: o EULA do Asset Store proíbe usar os assets "as inputs" de IA sem consentimento do publisher.

## 6. Unreal (o Eduardo tem licença)
- Vídeo renderizado sem royalty; assets Fab Standard e "UE-Only" podem ser usados renderizando no UE.
- Assets que atacam exatamente as lacunas: Fire VDB Pack (grátis), Niagara Fluids, Fluid Flux (oceano, ~US$ 350), Beach City
  (~US$ 130), Megascans avulsos, MetaHuman Crowd (grátis), roda-gigante (grátis).
- Custo: não cabe no Colab (~45 GB de engine, disco efêmero) → máquina Linux alugada com volume persistente (RunPod/Vast,
  4090 ~US$ 0,35–0,75/h); render de 4–28 h por vídeo na L4 (Lumen); 2–4 semanas para a biblioteca de cenas-modelo.
- Etiqueta "NoAI" em muitos assets: mandar quadros para revisão por IA é zona cinzenta.

## 7. Comparativo final

| | three.js atualizado (escolhido) | Unreal 5 | Unity HDRP |
|---|---|---|---|
| Teto de qualidade | médio-alto (fogo/fumaça bons via flipbook) | o mais alto | alto |
| Render de 7 min | minutos na G4 | 4–28 h (L4) | 15 min–3,5 h |
| Infra | Colab como hoje | máquina alugada persistente | VM Windows persistente |
| Custo de assets | zero | US$ 0–500 por pacote de cenas | variável |
| Automação por agente | excelente (tudo código) | Python + MRQ (beta/experimental) | C# + Xvfb/Windows |
| Licença × IA | limpa (CC0/MIT) | zona cinzenta "NoAI" | cláusula "AI inputs" |
