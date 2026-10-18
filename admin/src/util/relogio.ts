/**
 * O relógio do Admin. O domínio nunca lê o relógio: o "hoje" entra sempre
 * como parâmetro, e é aqui que ele nasce.
 *
 * A data é a de Gravataí (America/Sao_Paulo), não a do computador: o dono
 * viajando continua vendo o dia da academia. `?hoje=AAAA-MM-DD` na URL fixa o
 * dia (testes, capturas e o PDF).
 */

import type { DataISO, InstanteISO } from '@dominio/tipos.ts';

export const FUSO_DA_ACADEMIA = 'America/Sao_Paulo';

function partes(d: Date): Record<string, string> {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_DA_ACADEMIA, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  return Object.fromEntries(f.formatToParts(d).map((p) => [p.type, p.value]));
}

function hojeFixo(): DataISO | null {
  try {
    const q = new URLSearchParams(globalThis.location?.search ?? '').get('hoje');
    return q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : null;
  } catch {
    return null;
  }
}

export function hojeNaAcademia(agora = new Date()): DataISO {
  const fixo = hojeFixo();
  if (fixo) return fixo;
  const p = partes(agora);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Instante com o fuso de Brasília escrito ("2026-10-15T10:42:00-03:00"). */
export function agoraNaAcademia(agora = new Date()): InstanteISO {
  const p = partes(agora);
  const hora = p.hour === '24' ? '00' : p.hour;
  const dia = hojeFixo() ?? `${p.year}-${p.month}-${p.day}`;
  return `${dia}T${hora}:${p.minute}:${p.second}-03:00`;
}

/** "10:42" de um instante. */
export function horaDe(instante: InstanteISO): string {
  return instante.slice(11, 16);
}
