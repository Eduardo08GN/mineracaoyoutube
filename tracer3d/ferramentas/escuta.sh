#!/bin/bash
# Escuta do orquestrador (agente principal): repassa cada evento da sessao e o BACKLOG periodico dos vigias, e grita
# SILENCIO se nenhum log mudar por 150 s (silencio tambem e sinal). Uso: bash escuta.sh <log_sessao> <log_vigia_ui>
S=$1; V=$2; touch "$S" "$V"
( tail -n0 -F "$S" "$V" 2>/dev/null | grep -E --line-buffered "^[0-9]{2}:[0-9]{2}:[0-9]{2} (>>|   \.\.\.|pronto|progresso|stills|FALHOU|SESSAO|G4 desligada|ATENCAO|ALERTA|fechado|menu aberto|BACKLOG|vigia de UI)" ) &
while true; do
  sleep 30
  agora=$(date +%s); ms=$(stat -c %Y "$S" 2>/dev/null || echo 0); mv=$(stat -c %Y "$V" 2>/dev/null || echo 0)
  ult=$(( ms > mv ? ms : mv ))
  [ $(( agora - ult )) -gt 150 ] && echo "$(date +%H:%M:%S) SILENCIO: nenhum log mudou ha $(( agora - ult )) s"
  grep -q "SESSAO_OK\|SESSAO_FALHOU" "$S" 2>/dev/null && { sleep 5; echo "$(date +%H:%M:%S) escuta encerrada"; kill %1 2>/dev/null; exit 0; }
done
