/**
 * O relógio e o gerador de id do app, num lugar só (veio de `treino.ts`, que
 * saiu com a musculação no P12). O domínio puro recebe isto por parâmetro; só
 * a borda (dados, telas) usa o padrão.
 */
import type { Id, InstanteISO } from './tipos.ts';
import { instanteComFuso } from './unidades.ts';

export interface Ambiente {
  gerarId: () => Id;
  agora: () => InstanteISO;
}

let contador = 0;

/** UUID quando o motor tem `crypto.randomUUID`; senão, um id único o bastante para o aparelho. */
export function gerarId(): Id {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  contador += 1;
  return `id-${Date.now().toString(36)}-${contador.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Instante de agora com o fuso do aparelho (R7.4). */
export const AMBIENTE_PADRAO: Ambiente = { gerarId, agora: () => instanteComFuso(new Date()) };
