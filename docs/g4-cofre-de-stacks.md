# Cofre de stacks da G4 (ligar e já ter o modelo)

**Adotado pelo Eduardo em 19/11/2026.** Estende `docs/g4-imagem-stack.md`. Esse doc resolve o ambiente (bibliotecas). Este resolve o resto: pesos dos modelos, acesso sem navegador e modelo carregado entre jobs.

## 1. O problema (incidente de 19/11)
Num batedor de 1 still na G4-1, o tempo foi quase todo de preparo, não de trabalho:
- **Drive travado:** o `ligar` com `T2_DRIVE=1` travou duas vezes depois do clique de consentimento, e o servidor nunca respondeu. Foram ~30 min perdidos até desistir do Drive.
- **Download de pesos:** sem a imagem do Drive, o job instalou o `diffusers` e baixou o Qwen-Image-Edit-2509 inteiro do Hugging Face (57,7 GB). Foram ~5 min antes da primeira imagem.
- **Recarga a cada script:** cada script carrega o modelo do zero (~1 min), mesmo que o anterior tenha acabado de usá-lo.

A causa é de arquitetura: a VM do Colab nasce vazia e apaga o disco ao desligar, e o plano não tem disco persistente. **"Deixar o modelo dentro da G4" não existe.** O que existe é trazer tudo de um lugar rápido, sem clique, já pronto para usar.

## 2. Princípio
A G4 é **descartável**. Tudo o que demora mora fora dela, num **cofre**, em pacotes prontos que se **montam**, sem instalar. Ligar a G4 = puxar os pacotes da stack do job e montar. Meta: **modelo pronto em 1–2 min depois do `/saude`**, sem nenhum clique.

## 3. As cinco peças

### 3.1 Cofre de artefatos (o que guardar)
Toda stack vira **dois pacotes**, cada um num arquivo só, com nome por hash:

| Pacote | Conteúdo | Nome |
|---|---|---|
| Ambiente | venv/node_modules/apt já instalados | `env_<hash>.sqfs` (o que já existe hoje) |
| Pesos | os arquivos do modelo (HF cache ou `models/` do ComfyUI) | `pesos_<modelo>_<hash>.sqfs` |

- **Caminho:** `t2_stacks/<canal>/<formato>/`, como em `g4-imagem-stack.md`. Pesos comuns a vários formatos ficam em `t2_stacks/_comum/pesos/`, para não duplicar 50 GB por canal.
- **Manifesto por formato** (`stack.json` do projeto), que diz o que o job precisa:
  ```json
  {"canal": "segundo_a_segundo", "formato": "limpeza_avatar",
   "pacotes": ["env_qwen_image_<hash>", "pesos_qwen_edit_2509_fp4_<hash>"]}
  ```
- **Hoje** os pesos do MiniMax já estão assim (`modelos_h3v2.sqfs`); os do Qwen e do TTS ainda vêm do HF a cada ligada. A regra passa a valer para todos.

### 3.2 Acesso sem navegador (como trazer)
A montagem do Drive pelo Colab (`drive.mount`) depende de um clique de consentimento no navegador, e é o ponto que trava. Ela sai do caminho principal.
- **Caminho principal: `rclone`** com token OAuth do Drive Ultra.
  - O Eduardo autoriza **uma única vez** (login dele; o agente não toca em senha).
  - O token fica **só no `.env` local** e é enviado à VM no `ligar`, nunca no repositório.
  - A VM baixa os pacotes direto do Drive, de datacenter para datacenter, com `rclone copy --transfers 8 --multi-thread-streams 8`, retomável.
- **G4-2:** usa o mesmo rclone, com **escopo só de leitura**. Isso cumpre a regra de que o Drive dela nunca é montado nem recebe upload.
- **Gravação no cofre:** só a G4-1 grava pacote novo (regra de 09/11: do Drive para a G4, nunca do PC).
- **`T2_DRIVE=1`** (montagem com clique) fica como reserva, não como padrão.
- **Plano B, se o Drive limitar a velocidade:** um bucket do Google Cloud Storage na mesma região da G4 (`europe-west4`). Custa poucos dólares por mês para ~100 GB, e só entra com o OK do Eduardo.

### 3.3 Montar, não instalar
- O pacote baixado é montado com `squashfuse` + `fuse-overlayfs` (gravável), como em `g4-imagem-stack.md`. Não há `pip install` nem `npm install` no caminho feliz.
- **Começa no `ligar`:** assim que o servidor responde, o `canal.py` lê o manifesto do job e dispara os downloads **em paralelo e em segundo plano**. O PC segue mandando os arquivos do projeto enquanto isso.
- **Fallback:** se o pacote não existir ou falhar, instala e baixa do HF como hoje, e grava o pacote novo no cofre ao final (só na G4-1).

### 3.4 Modelos enxutos
Menos bytes = menos espera e menos VRAM. Antes de empacotar os pesos, preferir a versão comprimida do modelo, **depois de um A/B de qualidade** contra a versão completa:
- **Qwen-Image-Edit-2509:** versão Nunchaku **FP4** (formato nativo da Blackwell, a nossa RTX PRO 6000) com **Lightning de 4 passos**, ~13 GB contra 40 GB do transformer completo, e 4 passos contra 28.
- **Regra:** o A/B usa os mesmos prompts e sementes de um job aprovado, e o Eduardo vê a folha lado a lado. Sem aprovação, o pacote é da versão completa.

### 3.5 Modelo quente
- **Servidor de inferência na VM:** um processo carrega o modelo **uma vez** e atende uma fila de pedidos pelo `canal.py`. Os scripts deixam de carregar o modelo cada um. O ComfyUI do MiniMax já funciona assim. O Qwen e o TTS passam a funcionar também.
- **Jobs em lote:** a orquestração agrupa os pedidos do mesmo modelo na mesma sessão, em vez de ligar a G4 para cada um.
- **Autodesligar:** a G4 desliga sozinha depois de **10 min sem fila**, desde que o porteiro não tenha reserva de outra sessão (`T2_DONO`). Isso cumpre a regra "G4 ligada só com job".

## 4. Fluxo de um job
```
ligar (sem clique) → /saude
   ├─ VM: rclone puxa env_*.sqfs + pesos_*.sqfs do manifesto (paralelo) → monta
   └─ PC: envia o projeto (tar por diferença)
servidor quente carrega o modelo uma vez
fila de pedidos → resultados baixados pelo canal
10 min sem fila → desliga (verificado)
```

## 5. Ordem de implementação
1. **rclone** no `ligar` (resolve o travamento do Drive). Depende da autorização única do Eduardo.
2. **Pesos no cofre + manifesto:** começar pelo Qwen-Image-Edit e pelo Qwen3-TTS, que hoje vêm do HF a cada ligada.
3. **A/B do Qwen FP4 Lightning** contra o completo.
4. **Servidor quente** do Qwen e **autodesligar** por fila vazia.

Cada passo é aditivo: sem pacote no cofre, o caminho antigo continua funcionando. Medir antes e depois com o mesmo job: tempo do `ligar` até o primeiro resultado.

## 6. Medições de 19/11 (G4-1)
| Etapa | Tamanho | Tempo |
|---|---|---|
| Ambiente do Qwen (`qwen_image_env.sqfs`) do Drive por rclone, sem clique | 3,9 GB | 15 s para baixar, <1 s para montar |
| Pesos do Qwen-Image-Edit-2509 do Hugging Face (caminho antigo) | 54 GB | 178 s |
| Pesos empacotados (`_comum/pesos/qwen_edit_2509.sqfs`, sem compressão) | 57,7 GB | gravação no Drive em andamento; falta medir a volta |

- Código: `tracer3d2/cofre.py`, `tracer3d2/vm/cofre.sh` e `tracer3d2/vm/pesos_qwen.sh`. No `ligar`, `T2_COFRE="<rel.sqfs>:<destino>,..."` puxa em segundo plano.
- O token do rclone fica fora do repositório (`T2_RCLONE_CONF`).
- O rclone avisa que o client_id compartilhado dele será aposentado em 2026: criar um client_id próprio no Google Cloud antes disso.
- O download do HF já é rápido (~300 MB/s). O ganho do pacote de pesos só se confirma se a volta do Drive for mais rápida que 178 s; se não for, os pesos continuam vindo do HF e o cofre fica só com os ambientes.

## 7. Regras que continuam valendo
- Token, ID de link e conta: só no `.env` local. Nada disso no GitHub.
- Do Drive para a G4, nunca do PC para a G4 nem do PC para o Drive.
- Nunca desligar a G4 com job de outra sessão (`T2_DONO`); `desligar` só com `T2_PAPEL=maestro`.
- Senha ou 2FA em qualquer tela: parar e avisar o Eduardo.
