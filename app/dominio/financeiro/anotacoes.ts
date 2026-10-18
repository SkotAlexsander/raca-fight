/**
 * Anotar e lembrar (RA12): notas livres ligadas a pessoa, data ou valor;
 * lembretes com data, repetição e aviso antes ("vence o aluguel no dia 10",
 * "cobrar fulano", "renovar o seguro"); e tarefas com prazo.
 *
 * O ALERTA em si (notificação no celular do dono) sai do servidor, como os
 * outros avisos (`03-arquitetura/03-DECISOES-TECNICAS.md`, seção 3); aqui fica
 * o que aparece em cada dia.
 */

import type { DataISO, Id, InstanteISO } from '../tipos.ts';
import { competenciaDe, dataNaCompetencia, ehDataISO, somarDias, somarMeses, diasEntre } from './datas.ts';
import { normalizar } from './nomes.ts';
import type { DespesaFixa, Lembrete, Nota, Periodo, RepeticaoDoLembrete, Tarefa } from './tipos.ts';

export const NOTA_MAXIMA = 2000;
export const TITULO_MAXIMO = 120;
export const AVISAR_ANTES_MAXIMO = 60;

// ---------------------------------------------------------------------------
// Notas
// ---------------------------------------------------------------------------

export function validarNota(n: Nota): string[] {
  const erros: string[] = [];
  const t = n.texto.trim();
  if (!t) erros.push('Escreva a nota.');
  else if (t.length > NOTA_MAXIMA) erros.push(`A nota passa de ${NOTA_MAXIMA} caracteres.`);
  if (n.data && !ehDataISO(n.data)) erros.push('A data da nota não existe.');
  if (n.valorCentavos != null && !Number.isSafeInteger(n.valorCentavos)) erros.push('O valor da nota é inválido.');
  return erros;
}

const ordemDasNotas = (a: Nota, b: Nota) => Number(b.fixada) - Number(a.fixada) || Date.parse(b.criadaEm) - Date.parse(a.criadaEm);

/** As notas de uma pessoa, de um lançamento ou de um dia; fixadas primeiro, depois a mais nova. */
export function notasLigadas(notas: readonly Nota[], a: { pessoaId?: Id; lancamentoId?: Id; data?: DataISO }): Nota[] {
  return notas
    .filter((n) => !n.arquivada
      && (!a.pessoaId || n.pessoaId === a.pessoaId)
      && (!a.lancamentoId || n.lancamentoId === a.lancamentoId)
      && (!a.data || n.data === a.data))
    .sort(ordemDasNotas);
}

export function buscarNotas(notas: readonly Nota[], texto: string): Nota[] {
  const alvo = normalizar(texto);
  return notas.filter((n) => !n.arquivada && normalizar(n.texto).includes(alvo)).sort(ordemDasNotas);
}

// ---------------------------------------------------------------------------
// Lembretes
// ---------------------------------------------------------------------------

export function validarLembrete(l: Lembrete): string[] {
  const erros: string[] = [];
  const t = l.titulo.trim();
  if (!t) erros.push('Escreva o lembrete.');
  else if (t.length > TITULO_MAXIMO) erros.push(`O lembrete passa de ${TITULO_MAXIMO} caracteres.`);
  if (!ehDataISO(l.data)) erros.push('A data não existe.');
  if (l.hora != null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(l.hora)) erros.push('Hora inválida (use HH:MM).');
  if (!Number.isInteger(l.avisarDiasAntes) || l.avisarDiasAntes < 0 || l.avisarDiasAntes > AVISAR_ANTES_MAXIMO) {
    erros.push(`Avisar antes vai de 0 a ${AVISAR_ANTES_MAXIMO} dias.`);
  }
  if (l.diaDoMes != null && (!Number.isInteger(l.diaDoMes) || l.diaDoMes < 1 || l.diaDoMes > 31)) erros.push('Dia do mês vai de 1 a 31.');
  return erros;
}

/** A ocorrência seguinte. Mensal guarda o dia escolhido (31 → 28 em fevereiro → 31 em março). */
export function proximaData(data: DataISO, repeticao: RepeticaoDoLembrete, diaDoMes?: number): DataISO | null {
  switch (repeticao) {
    case 'nao_repete': return null;
    case 'semanal': return somarDias(data, 7);
    case 'mensal': return dataNaCompetencia(somarMeses(competenciaDe(data), 1), diaDoMes ?? Number(data.slice(8)));
    case 'anual': return dataNaCompetencia(somarMeses(competenciaDe(data), 12), Number(data.slice(8)));
  }
}

const porData = (a: Lembrete, b: Lembrete) => a.data.localeCompare(b.data) || (a.hora ?? '').localeCompare(b.hora ?? '');

/** O que aparece hoje: os atrasados, os de hoje e os que avisam com antecedência. */
export function lembretesDoDia(lembretes: readonly Lembrete[], hoje: DataISO): { atrasados: Lembrete[]; hoje: Lembrete[]; emBreve: Lembrete[] } {
  const abertos = lembretes.filter((l) => !l.concluidoEm);
  return {
    atrasados: abertos.filter((l) => l.data < hoje).sort(porData),
    hoje: abertos.filter((l) => l.data === hoje).sort(porData),
    emBreve: abertos.filter((l) => l.data > hoje && diasEntre(hoje, l.data) <= l.avisarDiasAntes).sort(porData),
  };
}

/** Concluir: o que repete anda para a próxima ocorrência; o que não repete fecha. */
export function concluirLembrete(l: Lembrete, em: InstanteISO): Lembrete {
  const proxima = proximaData(l.data, l.repeticao, l.diaDoMes);
  return proxima ? { ...l, data: proxima, ultimaConclusaoEm: em } : { ...l, concluidoEm: em };
}

export function adiarLembrete(l: Lembrete, novaData: DataISO, hoje: DataISO): Lembrete {
  if (!ehDataISO(novaData) || novaData < hoje) throw new RangeError('não dá para adiar para o passado');
  return { ...l, data: novaData };
}

/** As ocorrências no período (para o calendário), com as repetições abertas. */
export function agendaDeLembretes(lembretes: readonly Lembrete[], periodo: Periodo): { lembreteId: Id; data: DataISO; titulo: string }[] {
  const saida: { lembreteId: Id; data: DataISO; titulo: string }[] = [];
  for (const l of lembretes) {
    if (l.concluidoEm) continue;
    let d: DataISO | null = l.data;
    let voltas = 0;
    while (d && d <= periodo.ate && voltas++ < 400) {
      if (d >= periodo.de) saida.push({ lembreteId: l.id, data: d, titulo: l.titulo });
      d = proximaData(d, l.repeticao, l.diaDoMes);
    }
  }
  return saida.sort((a, b) => a.data.localeCompare(b.data) || a.lembreteId.localeCompare(b.lembreteId));
}

/** "Vence o aluguel no dia 10": lembrete mensal pronto a partir da despesa fixa. */
export function lembreteDaDespesaFixa(
  d: DespesaFixa,
  opcoes: { hoje: DataISO; avisarDiasAntes: number; gerarId: () => Id; porId: Id; em: InstanteISO },
): Lembrete {
  let data = dataNaCompetencia(competenciaDe(opcoes.hoje), d.diaDeVencimento);
  if (data < opcoes.hoje) data = dataNaCompetencia(somarMeses(competenciaDe(opcoes.hoje), 1), d.diaDeVencimento);
  return {
    id: opcoes.gerarId(), academiaId: d.academiaId, titulo: `Vence: ${d.descricao}`, data, repeticao: 'mensal',
    diaDoMes: d.diaDeVencimento, avisarDiasAntes: opcoes.avisarDiasAntes, valorCentavos: d.valorCentavos, despesaFixaId: d.id,
    ...(d.pessoaId ? { pessoaId: d.pessoaId } : {}), criadoPor: opcoes.porId, criadoEm: opcoes.em,
  };
}

// ---------------------------------------------------------------------------
// Tarefas
// ---------------------------------------------------------------------------

/** Abertas: atrasadas primeiro, depois por prazo, as sem prazo no fim (a mais antiga antes). */
export function tarefasAbertas(tarefas: readonly Tarefa[], hoje: DataISO): { tarefa: Tarefa; atrasada: boolean }[] {
  return tarefas
    .filter((t) => !t.feitaEm)
    .sort((a, b) => {
      if (a.prazo && b.prazo) return a.prazo.localeCompare(b.prazo);
      if (a.prazo) return -1;
      if (b.prazo) return 1;
      return Date.parse(a.criadaEm) - Date.parse(b.criadaEm);
    })
    .map((tarefa) => ({ tarefa, atrasada: !!tarefa.prazo && tarefa.prazo < hoje }));
}

export function concluirTarefa(t: Tarefa, em: InstanteISO): Tarefa {
  return { ...t, feitaEm: em };
}

export function reabrirTarefa(t: Tarefa): Tarefa {
  const r = { ...t };
  delete r.feitaEm;
  return r;
}
