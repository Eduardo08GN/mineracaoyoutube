# K18 Königgrätz (Kriegsmomente, 06/11/2026): vídeo longo por frentes paralelas

**Entregue:** 16:42, 1080p30, −14,1 LUFS, sem música.

**Régua 24 fps:**
- movimento médio 1,64;
- 4 % de meios-segundos parados;
- 0 flicker fora de corte.

## Método
1. Antes de soltar as frentes, o maestro deixa prontos:
   - o roteiro checado por crítico de fatos;
   - a narração (AI Studio) e o alinhamento na G4;
   - os dados reais: DMR 5G, plano prussiano de 1866 georreferenciado e unidades hora a hora;
   - o `plano.json` de batidas por família.
2. Contrato fixo, também antes das frentes:
   - `tipos.ts` (cena pura de beat/t/u);
   - kit `tinta/` com assinaturas fixas;
   - `BRIEF_FRENTES.md`;
   - bibliotecas no `package.json` do PROJETO.
3. Sete agentes em paralelo, um por família (campo, boemia, chao, lugar, eureka, tinta, epoca). Cada um entrega `NOTAS_<familia>.md` com as (beat, u) de vitrine.
4. Na G4:
   - profundidade (Depth Anything V2) das pinturas;
   - vitrine de 18 stills em 20 s;
   - render inteiro de 30.063 quadros em ~16 min, com o mix em paralelo;
   - efeitos MOSS-SoundEffect presos à palavra (`ton.py`).
5. No PC:
   - loudnorm em 2 passadas (TP −1,5);
   - SRT gerado de `legendas.json`;
   - 3 miniaturas;
   - descrição curta.

## Lições
- A vitrine de stills na G4 pegou a falta de bibliotecas antes do render: o `preparar.sh` agora compara o `package.json`.
- A frente mais fraca (chão: planos vazios) precisou de uma passada de acabamento, em vez de esperar o render.
- O maestro confere fatos nos rótulos das frentes ("20 Schritt" era de fonte única).
