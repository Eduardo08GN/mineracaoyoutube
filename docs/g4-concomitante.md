# G4 concomitante: várias conversas na mesma placa

**Adotado pelo Eduardo em 19/11/2026.** Complementa `docs/g4-cofre-de-stacks.md`. Código: `tracer3d2/g4.py`.

## 1. O problema
Cada conversa ligava, usava e desligava a G4 por conta própria. Em 19/11 isso deu:
- dois `canal.py ligar` ao mesmo tempo disputando a aba do Colab; um morreu e deixou um processo órfão;
- risco permanente de uma sessão desligar a G4 com o job de outra rodando;
- combinação por mensagem entre sessões ("pode usar", "não desligue").

## 2. Regra nova
**Sessão não liga nem desliga a G4.** Ela pede, roda e solta:
```
python g4.py pedir  --dono <dono> --vram <GB> [--g4 1|2|auto] [--cofre rel.sqfs:/destino,...]
python g4.py rodar  --dono <dono> "<comando>"
python g4.py soltar --dono <dono>
python g4.py status
```
- `pedir` registra a reserva, liga a G4 se estiver fora do ar e cria `/content/jobs/<dono>/`.
- `rodar` executa nessa pasta e renova a reserva a cada 60 s enquanto o comando roda.
- `soltar` libera a memória reservada para quem está na fila.

## 3. Peças
| Peça | Como funciona |
|---|---|
| **Reserva com validade** | `{dono, vram, ate}` em `D:/tmp/g4_reservas_<n>.json`. Vence sozinha (padrão 900 s) se a sessão morrer. |
| **Fila por memória de vídeo** | A soma das reservas vivas não passa de 90 GB (`T2_VRAM_TETO`). Quem não cabe espera (`--espera`, padrão 1 h) em vez de derrubar o job alheio. |
| **Ligar em voo único** | Só um processo liga; os outros esperam a mesma ligada e reaproveitam. Acaba a disputa pela aba do Colab. |
| **Pasta por dono** | Cada sessão trabalha em `/content/jobs/<dono>/`. Ninguém apaga arquivo de ninguém. |
| **Zelador** | `python g4.py zelador`, um por PC. Desliga a G4 quando não há reserva nova, nem reserva do porteiro antigo, nem job ou daemon rodando há 10 min (`--ocioso`). |
| **Pool** | `--g4 auto` escolhe a G4 que já está no ar e tem folga; senão a G4-1. A G4-2 segue sem montar Drive e sem gravar no cofre. |

## 4. Quanto reservar (`--vram`)
| Trabalho | GB |
|---|---|
| Render/stills Remotion + three.js | 8 |
| Blender (Cycles/EEVEE) | 12 |
| Qwen-Image-Edit-2509 completo (fp8) | 42 |
| MiniMax H3 V2 (ComfyUI) | 53 |
| Qwen3-TTS | 8 |

Medir com `nvidia-smi` no primeiro job de um formato novo e corrigir esta tabela.

## 5. Convivência com o fluxo antigo
- `canal.py` e o porteiro seguem funcionando. O zelador respeita as reservas do porteiro e os jobs em andamento, então uma sessão que ainda não migrou não é derrubada.
- Quem migrou não chama mais `canal.py ligar` nem `desligar`. Chamar `ligar` direto com a G4 no ar ou ligando é o caminho ruim de 19/11.
- `T2_DONO` continua sendo o nome da reserva; use `<canal>_<video>`.

## 6. Teste de 19/11 (G4-1 no ar)
- Duas reservas simultâneas (50 + 30 GB): aceitas.
- Terceira de 30 GB: barrada com `G4_FILA_PRAZO` (80/90 GB em uso).
- Dois `rodar` ao mesmo tempo, cada um na sua pasta: ok.
- `rodar` sem reserva: negado com `G4_SEM_RESERVA`.
- **Não testado ainda:** o zelador desligando sozinho, o ligar em voo único com duas sessões partindo da G4 desligada, e `--g4 auto` com a G4-2 no ar.

## 7. Próximos passos
1. Rodar o zelador de forma permanente e provar o autodesligar.
2. Servidores de modelo compartilhados (um Qwen, um MiniMax, um TTS carregados uma vez, atendendo todas as sessões).
3. Migrar `canal.py garantir/preparar/render` para pedirem reserva por baixo.
