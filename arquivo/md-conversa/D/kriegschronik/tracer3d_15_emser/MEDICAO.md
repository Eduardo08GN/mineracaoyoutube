# MEDICAO: Kriegsmomente 15, Emser Depesche

Registro vivo (§9.5 da auditoria v14b): etapas, horas e decisões. Atualizar a cada etapa e a cada refação.

| Hora (04/11) | Etapa | Resultado | Decisão |
|---|---|---|---|
| 00:40 | Pedido | Vem do Eduardo, pelo suporte: "iniciar o próximo vídeo alemão com toda a pipeline corrigida" e auditoria v14b §9 | — |
| 00:42 | Radar | `radar_prussia_1104.py` (micronichos abertos) + `vetor_prussia.py` (canal + outliers), ~16 mil unidades de cota | Emser Depesche: maior demanda DE entre os abertos; outlier "Der wahre Ursprung…" 118× |
| 00:45 | Pauta (agente) | `roteiro/PAUTA_15.md`: linha do tempo, os dois textos, idades, disputados | — |
| 00:46 | Projeto | Kit do Learjet P3 copiado sem a geo da Flórida, 192 MB; KANAL = Kriegsmomente | — |
| 00:46 | Portão 1 (prontos) | Tecla Morse do Smithsonian, CC0 (baixada). Registro Morse no Sketchfab (CC-BY, exige o login do Eduardo). DOP20 RLP com licença dl-de/by-2-0 | O escaneamento tem malha única e não anima: tecla e registro feitos por código, em cartoon técnico |
| 00:50–01:00 | Batedor 1 (G4) | 4 rodadas de stills: Telegrama (riscos, refluxo, palavras novas, contador) e TelegrafMorse (geral + close) | — |
| 01:01 | G4 | Desligada pelo maestro e verificada (só ligar com job) | — |
| ~01:03 | Revisão do suporte | Título 1 trocado para "…obwohl Preußen schon nachgegeben hatte?"; prova das 34 palavras; contorno; registro cru; mapa no chão; estado final literal | Tudo aceito. Kit vai para um agente; prova vai para a pauta |
| ~01:05 | Prova §2b | Com grafia normalizada: **30** palavras sem correspondência (não 34); **13** com conteúdo novo | A narração diz só o defensável |
| ~01:08 | Roteiro DE | 15 capítulos, 1.877 palavras, ~14,2 min; checagens ok; fato conferido linha a linha contra a pauta | Enviado ao suporte antes da TTS |
| ~01:10 | Revisão 2 do suporte | 3 erros de fato corrigidos (14/07 não era feriado em 1870; alianças publicadas em 1867; "Bad" Ems só em 1913) + 11 ajustes; roteiro com 1.932 palavras aprovado | Narração iniciada no AI Studio |
| ~01:14 | **Eduardo reprova a stack visual nova** | "horrível… confuso… inventou a roda" | Volta ao Tracer3D do 14b; só o roteiro novo fica; pouco mapa; agentes do kit novo parados |
| 01:18 | Nota | As horas com ~ foram estimadas depois do fato (o relógio real estava atrás do que eu tinha anotado); daqui em diante, hora pelo `date` | — |
| 01:20–03:00 | Narração + alinhamento | 15 wavs (AI Studio, voz Riko); stable-ts DE na G4, WER ≤6 % | — |
| 01:30–02:40 | Plano + takes | 2 planejadores, 134 batidas, 873,1 s; mapas no relevo Copernicus (EOX trocado); Remotion "Labor" + GSAP nos conceitos; 12 takes teardown do telégrafo na G4 (letra a pena IM Fell) | Pouco mapa; máquina = teardown |
| 02:50–03:02 | Entrega textual | `untertitel_de.srt` (1ª versão: 238 legendas; o 12,6 % era da régua interna com tolerância +0,05; pelo arquivo eram 22,7 % >17 cps e 17 blocos <1,2 s); títulos + descrição curta com licenças | — |
| 03:20–04:00 | Render completo (G4) | 26.193 quadros, 873,1 s; dois renders do mesmo projeto colidiram → trava `flock` no `render.sh` (BADPATHS) | — |
| 04:02 | Miniaturas | 3 (Lenbach PD ×2, quadro teardown + número) | — |
| 04:05–04:07 | Mix (G4) | Sem música; voz + 12 wavs teardown + 5 papéis = 17 eventos; −14,6 LUFS, TP −1,2 dBTP. A 1ª tentativa travou >12 min no `np.convolve` (janela de 12 mil amostras) → `uniform_filter1d`, 1,5 min | — |
| 04:07 | Mux | Cópia de fluxo → `entrega/warum_erklaerte_frankreich_1870_emser_depesche.mp4`; ffprobe: h264 1080p30, 26.193 quadros, AAC 48 kHz, 873,1 s nos dois fluxos | Entregue |
| 04:09 | G4 | Desligada pelo maestro (porteiro sem reservas), verificada: /saude não responde | — |
| 04:20 | Legendas v2 | Conferência do suporte (22,7 %). Corte por programação dinâmica + mira 16,8 cps; a régua passa a medir o arquivo (>17 estrito): **203 legendas, 9,4 % >17 cps (1 >20: 20,1), 0 <1,2 s, 0 linhas >42**, mediana 16,5 cps. O resto é a narração mais rápida que 17 cps | Substituído em entrega/ |
