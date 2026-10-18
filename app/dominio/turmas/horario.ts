/**
 * A conta de data e hora da GRADE, sempre no fuso da ACADEMIA (R14.4), nunca
 * no do aparelho: o aluno que abre o app em viagem vê a aula das 20:00 de
 * Gravataí como 20:00. Os testes rodam também com `TZ=Asia/Tokyo` para provar.
 *
 * O deslocamento vem do `Intl` (Node e Hermes têm). Se o motor não souber o
 * fuso, vale a tabela curta abaixo (Brasil sem horário de verão desde 2019).
 *
 * Puro: nada lê o relógio; quem chama passa o instante em ms.
 */
import type { DataISO, DiaDaSemana, HoraDoDia, InstanteISO } from '../tipos.ts';
import { DIAS_DA_SEMANA } from '../tipos.ts';

const MINUTO_MS = 60_000;
const DIA_MS = 24 * 60 * MINUTO_MS;

/** Reserva para quando o `Intl` não conhece o fuso (minutos em relação ao UTC). */
const FUSOS_CONHECIDOS: Readonly<Record<string, number>> = {
  'America/Sao_Paulo': -180,
  'America/Manaus': -240,
  'America/Recife': -180,
  UTC: 0,
};

const formatadores = new Map<string, Intl.DateTimeFormat | null>();

function formatadorDe(fuso: string): Intl.DateTimeFormat | null {
  if (!formatadores.has(fuso)) {
    try {
      formatadores.set(
        fuso,
        new Intl.DateTimeFormat('en-US', { timeZone: fuso, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      );
    } catch {
      formatadores.set(fuso, null);
    }
  }
  return formatadores.get(fuso) ?? null;
}

/** Quantos minutos o fuso está do UTC naquele instante (Gravataí: −180). */
export function deslocamentoDoFuso(fuso: string, ms: number): number {
  const f = formatadorDe(fuso);
  if (f && typeof f.formatToParts === 'function') {
    try {
      const partes = f.formatToParts(new Date(ms));
      const v = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
      const comoUtc = Date.UTC(v('year'), v('month') - 1, v('day'), v('hour') % 24, v('minute'), v('second'));
      const minutos = Math.round((comoUtc - Math.floor(ms / 1000) * 1000) / MINUTO_MS);
      if (Number.isFinite(minutos)) return minutos;
    } catch {
      // cai na tabela
    }
  }
  return FUSOS_CONHECIDOS[fuso] ?? 0;
}

/** `HH:MM` → minutos desde a meia-noite. Lança com hora inválida. */
export function lerHora(hora: HoraDoDia): number {
  const m = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!m || +m[1] > 23 || +m[2] > 59) throw new RangeError(`hora inválida: ${hora}`);
  return +m[1] * 60 + +m[2];
}

/** Minutos desde a meia-noite → `HH:MM`. */
export function escreverHora(minutos: number): HoraDoDia {
  const m = ((minutos % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function exigirData(data: DataISO): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!m) throw new RangeError(`data inválida: ${data}`);
  return [+m[1], +m[2], +m[3]];
}

/** A data `AAAA-MM-DD` daquele instante no fuso da academia. */
export function dataNoFuso(ms: number, fuso: string): DataISO {
  return new Date(ms + deslocamentoDoFuso(fuso, ms) * MINUTO_MS).toISOString().slice(0, 10);
}

/** Minutos desde a meia-noite daquele instante no fuso da academia. */
export function minutosNoFuso(ms: number, fuso: string): number {
  const local = ms + deslocamentoDoFuso(fuso, ms) * MINUTO_MS;
  return Math.floor((((local % DIA_MS) + DIA_MS) % DIA_MS) / MINUTO_MS);
}

/** O instante (ms) de uma data e hora no fuso da academia. */
export function msNoFuso(data: DataISO, hora: HoraDoDia, fuso: string): number {
  const [a, m, d] = exigirData(data);
  const minutos = lerHora(hora);
  const comoUtc = Date.UTC(a, m - 1, d, 0, minutos);
  // duas voltas acertam o deslocamento perto de uma mudança de horário
  let ms = comoUtc - deslocamentoDoFuso(fuso, comoUtc) * MINUTO_MS;
  ms = comoUtc - deslocamentoDoFuso(fuso, ms) * MINUTO_MS;
  return ms;
}

/** Instante ISO com o fuso escrito (`2026-10-15T20:00:00-03:00`, R7.4). */
export function instanteComFusoDaAcademia(ms: number, fuso: string): InstanteISO {
  const desloc = deslocamentoDoFuso(fuso, ms);
  const local = new Date(ms + desloc * MINUTO_MS).toISOString().slice(0, 19);
  const sinal = desloc < 0 ? '-' : '+';
  const abs = Math.abs(desloc);
  return `${local}${sinal}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

/** O dia da semana de uma data (sem fuso: a data já é a do calendário da academia). */
export function diaDaSemanaDe(data: DataISO): DiaDaSemana {
  const [a, m, d] = exigirData(data);
  return DIAS_DA_SEMANA[new Date(Date.UTC(a, m - 1, d)).getUTCDay()]!;
}

export function somarDias(data: DataISO, dias: number): DataISO {
  const [a, m, d] = exigirData(data);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** Dias inteiros de `de` até `ate` (negativo se `ate` vem antes). */
export function diasEntre(de: DataISO, ate: DataISO): number {
  const [a1, m1, d1] = exigirData(de);
  const [a2, m2, d2] = exigirData(ate);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / DIA_MS);
}

/** A segunda-feira da semana da data (a semana da grade vai de segunda a domingo). */
export function segundaDaSemana(data: DataISO): DataISO {
  const indice = DIAS_DA_SEMANA.indexOf(diaDaSemanaDe(data));
  return somarDias(data, indice === 0 ? -6 : 1 - indice);
}
