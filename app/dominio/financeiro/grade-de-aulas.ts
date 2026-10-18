/**
 * A grade de aulas do lado do DONO (AO, 16/10, pedido do AU): o Admin cria e
 * muda as turmas e os horários (R14.2a), e a aula experimental é marcada
 * num HORÁRIO da grade, para aparecer na chamada do professor (que procura
 * por `horario_id` + data). A regra da aula (check-in, cancelar, passar) é do
 * domínio de turmas (`../turmas/turmas.ts`); aqui fica só o que o Admin
 * precisa para escrever a grade sem erro.
 */

import type { DataISO, DiaDaSemana, Id } from '../tipos.ts';
import { DIAS_DA_SEMANA } from '../tipos.ts';
import { diaDaSemanaDe } from '../turmas/horario.ts';
import type { Horario, Turma } from '../turmas/turmas.ts';

export const NOME_DO_DIA: Readonly<Record<DiaDaSemana, string>> = {
  dom: 'domingo', seg: 'segunda', ter: 'terça', qua: 'quarta', qui: 'quinta', sex: 'sexta', sab: 'sábado',
};

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Os erros da turma, em frase. Os limites são os do banco (`turmas`, `horarios`). */
export function validarTurma(t: Turma): string[] {
  const erros: string[] = [];
  const nome = t.nome.trim();
  if (!nome) erros.push('Escreva o nome da turma.');
  else if (nome.length > 80) erros.push('O nome passa de 80 caracteres.');
  if (!t.modalidadeIds.length) erros.push('Escolha pelo menos uma modalidade.');
  if (t.capacidade != null && (!Number.isInteger(t.capacidade) || t.capacidade < 1)) erros.push('A capacidade é de 1 lugar para cima (ou sem limite).');
  const idade = (n?: number) => n == null || (Number.isInteger(n) && n >= 0 && n <= 120);
  if (!idade(t.idadeMinima) || !idade(t.idadeMaxima)) erros.push('A idade vai de 0 a 120.');
  else if (t.idadeMinima != null && t.idadeMaxima != null && t.idadeMaxima < t.idadeMinima) erros.push('A idade máxima é menor que a mínima.');
  const vistos = new Set<string>();
  for (const h of t.horarios) {
    if (!DIAS_DA_SEMANA.includes(h.dia)) erros.push('Dia da semana inválido.');
    if (!HORA.test(h.inicio)) erros.push(`Hora inválida: "${h.inicio}" (use HH:MM).`);
    if (!Number.isInteger(h.duracaoMinutos) || h.duracaoMinutos < 1 || h.duracaoMinutos > 600) erros.push('A duração vai de 1 a 600 minutos.');
    const chave = `${h.dia} ${h.inicio}`;
    if (vistos.has(chave)) erros.push(`Horário repetido: ${NOME_DO_DIA[h.dia] ?? h.dia} às ${h.inicio}.`);
    vistos.add(chave);
  }
  return erros;
}

export interface AulaDaGrade { turma: Turma; horario: Horario }

const porHora = (a: AulaDaGrade, b: AulaDaGrade) => a.horario.inicio.localeCompare(b.horario.inicio) || a.turma.nome.localeCompare(b.turma.nome);

/** Os horários de um dia (das turmas ativas), na ordem da hora; com a modalidade, só as turmas dela. */
export function horariosDoDia(turmas: readonly Turma[], data: DataISO, modalidadeId?: Id): AulaDaGrade[] {
  const dia = diaDaSemanaDe(data);
  return turmas
    .filter((t) => t.ativa && (!modalidadeId || t.modalidadeIds.includes(modalidadeId)))
    .flatMap((turma) => turma.horarios.filter((h) => h.dia === dia).map((horario) => ({ turma, horario })))
    .sort(porHora);
}

/** A semana inteira, dia a dia, para a grade da tela. */
export function gradeDaSemana(turmas: readonly Turma[]): Record<DiaDaSemana, AulaDaGrade[]> {
  const s = Object.fromEntries(DIAS_DA_SEMANA.map((d) => [d, [] as AulaDaGrade[]])) as Record<DiaDaSemana, AulaDaGrade[]>;
  for (const turma of turmas) if (turma.ativa) for (const horario of turma.horarios) s[horario.dia]?.push({ turma, horario });
  for (const d of DIAS_DA_SEMANA) s[d].sort(porHora);
  return s;
}
