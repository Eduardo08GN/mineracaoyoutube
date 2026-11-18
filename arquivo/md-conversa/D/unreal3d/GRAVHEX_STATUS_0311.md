# Batedor gravhex (Gravelotte no estilo StyleHex), madrugada de 03/11/2026: estado e lições

**Resultado: não aprovado para produção.** Último still: `v12_gravelotte/quadros/gravhex_previa_0216.png` (vista 0) e `_0218.png` (vista 1, aérea).

- **O que já funciona:**
  - relevo real do DEM (line trace 5374 contra 5362 esperado);
  - árvores do StyleHex espalhadas;
  - estrada;
  - colunas de soldados;
  - flores no primeiro plano;
  - céu e nuvens do pacote.
- **O que falta:**
  - **Chão chapado cor de oliva:** o material MW/StyleHex do Landscape não aparece no relevo novo. Suspeita: o material do StyleHex depende do RVT e das camadas pintadas, que o import do heightmap zerou. O MW precisa de camadas/auto-material ligado.
  - **Estrada** em vermelho chapado (MI sem textura).
  - **Soldados minúsculos** na vista 0 e manchas na aérea: a câmera precisa ir para perto da coluna.
  - **VFX:** `na_sequencia` falhou (canal da partícula); só aparecem pufes pretos.
  - **Grama do pacote** some no relevo novo (o `grass.Enable 0` é só do editor; no `-game` ela depende das camadas).

## Lições (todas viraram código)
1. **Python via linha de comando:** com `-ExecutePythonScript`, o editor fecha no tick seguinte ao fim do script. Para fases com espera (`depois(n)`), use `unreal.EditorPythonScripting.set_keep_python_script_alive(True)` (doc Epic SetKeepPythonScriptAlive).
2. **Cópia de World:** `duplicate_asset` + `load_level` da cópia derruba o editor ("Old world not cleaned up by GC").
   - `EditorLoadingAndSavingUtils.save_map(mundo, outro_caminho)` **não** troca o mundo aberto: o `salvar()` gravava o original e o `-game` abria a cópia velha.
   - Solução: editar e renderizar o próprio World_Demo **na G4**. O `quadros.py` sobe o `.umap` intacto do disco local antes de cada run.
3. **Assert do Vulkan** `VulkanBindlessDescriptorManager … TypedBufferSRV` (SIGSEGV no quadro 206) ao salvar MaterialInstance com miniatura dentro do World_Demo (Landscape + RVT).
   - Solução: salvar as MI dos soldados no nível de partida, antes de abrir o mapa (`woodhead()` com `U3D_REUSA_MI=0`), e só reaproveitar dentro do mapa.
   - O `grass.Enable 0` sozinho não resolveu.
4. **Export logo após o import:** `landscape_export_heightmap_to_render_target` logo depois do import lê 0. Confira o relevo por line trace na colisão.
5. **`pgrep -f '/tmp/quadro.sh'` se acha a si mesmo** dentro do `bash -c`: o `aguardar_vm` ficava em laço. Use `pgrep -f '[/]tmp/quadro.sh'`.
6. **Névoa:** a do pacote é calibrada para ~500 m. Numa janela de 3,6 km lava tudo; densidade ×0,12.

## Próximo passo sugerido (antes de outro still)
Levantamento de prontos (CLAUDE.md, portão 1) para "Landscape com heightmap real + material de pacote estilizado":
- doc ou fórum de como reaplicar as camadas/RVT do StyleHex depois de importar heightmap;
- ou usar o **Landscape Auto Material do MW** com as camadas certas;
- ou partir de um pacote que traga um mapa de relevo aberto (campo de batalha, colinas), em vez de deformar o World_Demo da floresta.
