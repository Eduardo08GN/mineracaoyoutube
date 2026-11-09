# Imagem da stack no Drive (G4 sem reinstalar)

**Regra do Eduardo (08/11/2026):** toda stack nova ou alterada vira automaticamente uma imagem `.sqfs` no Drive. A G4 monta essa imagem ao ligar e não reinstala `npm`, Chrome nem bibliotecas a cada sessão.

**Do Drive para a G4, nunca do PC (09/11):** imagem `.sqfs`, modelo e pesos chegam à G4 só a partir do Drive Ultra. É proibido subir imagem do PC para a G4 ou do PC para o Drive (o upload do PC é de ~2 MB/s; no vídeo da Doña Chayo de 09/11 isso custou ~1h40). Imagem nova é gerada na G4-1, que grava direto no Drive.

**Montagem só na G4 (08/11):** nada de `npm install`, empacotamento, checagem de tipos ou stills no PC. A G4 parte do `.sqfs`, instala só o que for novo e regrava a imagem no Drive Ultra. No PC fica só a edição do código.

## Por que
- Cada VM do Colab começa limpa.
- O `preparar.sh` reinstalava tudo a cada ligada: libs apt, `npm install` e Chrome for Testing. Isso levava minutos de G4 em todo job, de todas as sessões.
- Quando o `package.json` mudava, a espera piorava. No batedor de Tempe de 08/11, foi a maior parte do tempo de G4.

## Desenho
- **Chave:** `sha256(package.json + package-lock.json)`, 12 caracteres hex. A versão de Chrome do Remotion fica em `node_modules/.remotion`, então vai na mesma imagem.
- **Caminho por tenant:** `t2_stacks/<canal>/<formato>/node_<hash>.sqfs` (e `apt_<hash>.tar` com os `.deb`).
  - Canal e formato vêm de `T2_CANAL`/`T2_FORMATO` ou do `stack.json` do projeto.
  - Sem tenant, a imagem vai para `_sem_tenant/` com aviso.
- **Onde fica:**
  - **G4-1, conta Ultra:** a imagem mora SÓ no Drive dessa conta. A G4-1 monta o Drive (`T2_DRIVE=1`), lê e grava a imagem.
  - **G4-2:** o Drive da conta dela **nunca** recebe upload e nunca é montado. Ela baixa a imagem por link de leitura da conta Ultra (`gdown`).
  - **ID do link:** só no `.env` local (`T2_STACKS_<CANAL>_<FORMATO>_<HASH>`), nunca em doc ou no GitHub.
- **Na VM:** a imagem é copiada para o disco local e montada com `squashfuse` + `fuse-overlayfs` (gravável). Se algo falhar, o script cai no `npm install` de sempre.
- **Sem imagem do hash:** instala como hoje e gera o `.sqfs` em segundo plano.
  - Na G4-1, grava direto no Drive.
  - Na G4-2, não gera imagem: o job que precisar de imagem nova roda primeiro na G4-1, que grava no Drive. O `.sqfs` em `D:/t2_stacks/` serve só de cópia local, nunca de origem de upload.

## Arquivos
- `tracer3d2/vm/preparar_img.sh`, novo. Argumentos: `projeto canal formato id_node id_apt`. Imprime `PREP_SEG modo= origem= t_apt= t_node= t_chrome= total=`.
- `canal.py` (motor local, no D:): `T2_IMAGEM=1` liga o caminho novo; sem essa variável, roda o `preparar.sh` de sempre. O comando `coletar` baixa a imagem gerada.
- **Kriegsmomente e What If ES:** o `vm/preparar.sh` original segue intacto. A mudança é só aditiva e foi provada num job da sessão de reels antes de valer para os outros.

## Uso
```
T2_G4=2 T2_DONO=<dono> T2_IMAGEM=1 T2_CANAL=fb_que_pasaria_si T2_FORMATO=reels_noticia
python canal.py preparar <projeto>    # sem imagem: instala e gera node_<hash>.sqfs
python canal.py coletar               # baixa o .sqfs para D:/t2_stacks/<canal>/<formato>/
```

## Teste de 08/11 (G4-2)
- O formato `fb_que_pasaria_si/reels_noticia` gerou `node_849f29b4e40c.sqfs` (381 MB) em segundos depois da instalação. O download para o PC levou cerca de 80 s.
- A montagem a partir da imagem numa VM nova ainda não foi medida. Ela depende da imagem estar no Drive Ultra e do link de leitura.
- Um defeito apareceu no teste: o `preparar` subiu um segundo daemon de stills e deu `EADDRINUSE` na porta 8766 quando já havia um no ar. O daemon existente seguiu funcionando, mas o `preparar` precisa reaproveitar o daemon que já está rodando.

## Estado em 08/11 (congelado)
A imagem `node_849f29b4e40c.sqfs` (381 MB) está só no PC, em `D:/t2_stacks/fb_que_pasaria_si/reels_noticia/`. Ela não foi subida ao Drive Ultra porque os reels foram encerrados. As pendências abaixo valem quando a regra for aplicada aos outros formatos.

## Pendências
1. Subir `node_849f29b4e40c.sqfs` ao Drive Ultra, em `t2_stacks/fb_que_pasaria_si/reels_noticia/`: regenerar na G4-1 (que grava direto no Drive), nunca subir a cópia do PC.
2. O Eduardo compartilha a pasta `t2_stacks` como "qualquer pessoa com o link: leitor", e o ID vai para o `.env`.
3. Medir `PREP_SEG` numa VM nova com imagem contra sem imagem.
4. Corrigir o `EADDRINUSE`: o `preparar` deve reaproveitar o daemon de stills que já está no ar.
5. Depois de provado, gerar as imagens dos formatos do Kriegsmomente e do What If ES, entre jobs, com o OK do maestro.
