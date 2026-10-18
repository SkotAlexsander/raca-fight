/**
 * O relógio do cronômetro do aluno: o "agora" em ms que a faixa, o Modo
 * treino e o Cronômetro leem. Só anda enquanto o cronômetro RODA.
 *
 * Agente AB (P11): antes, ele mudava a cada 250 ms, e tudo o que lê o relógio
 * (o Modo treino inteiro, com a foto desfocada, o vidro e os campos)
 * redesenhava 4 vezes por segundo, embora o número na tela mude uma vez por
 * segundo. Agora o tique de 250 ms continua (para não atrasar a virada do
 * segundo), mas o "agora" só muda quando a LEITURA que a tela mostra muda: o
 * segundo, a fase, o estado ou o "acabando". O anel não perde nada: ele
 * anima sozinho entre as recalibrações (catálogo 4.3a).
 */
import { useEffect, useState } from 'react';
import { ler, type Cronometro, type LeituraDoCronometro } from '@/dominio/cronometro';

const TIQUE_MS = 250;

/** O que a tela mostra de uma leitura: se isto não mudou, não há o que redesenhar. */
export function chaveDaLeitura(l: LeituraDoCronometro): string {
  const fase = l.fase ? `${l.fase.tipo}-${l.fase.rodada}` : '';
  return `${l.estado}|${l.segundosNaTela}|${fase}|${l.acabando ? 1 : 0}`;
}

export function useRelogioDoCronometro(c: Cronometro | null): [number, (ms: number) => void] {
  const [agora, setAgora] = useState(() => Date.now());
  const rodando = c ? ler(c, agora).estado === 'rodando' : false;
  useEffect(() => {
    if (!rodando || !c) return;
    // vazia: o primeiro tique sempre acerta a tela com a leitura de agora (o estado pode ter ficado para trás)
    let chave = '';
    const t = setInterval(() => {
      const ms = Date.now();
      const nova = chaveDaLeitura(ler(c, ms));
      if (nova === chave) return;
      chave = nova;
      setAgora(ms);
    }, TIQUE_MS);
    return () => clearInterval(t);
  }, [rodando, c]);
  return [agora, setAgora];
}
