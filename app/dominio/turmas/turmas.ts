/**
 * Turma, horário e aula (regras R14.2 a R14.9).
 *
 * - A **turma** é o grupo fixo; o **horário** é dia + hora + duração, no fuso
 *   da academia; a **aula** é um horário numa data.
 * - A aula EXISTE pela grade, sem ninguém criar (R14.4a): este módulo a gera
 *   sob demanda, com id determinístico `horario@data`. Só vira registro quando
 *   alguém faz check-in, a chamada ou a cancela (o `AjusteDeAula`).
 * - Cancelar e passar a substituto, só antes do início (R14.5).
 * - Quem pode fazer check-in (R14.6): a frase do motivo nunca fala de dinheiro.
 *
 * Puro: o relógio e o fuso chegam por parâmetro.
 */
import type { DataISO, DiaDaSemana, HoraDoDia, Id, InstanteISO } from '../tipos.ts';
import { diaDaSemanaDe, escreverHora, instanteComFusoDaAcademia, lerHora, msNoFuso, somarDias, dataNoFuso } from './horario.ts';

export type PublicoDaTurma = 'adulto' | 'kids' | 'competicao' | 'aberta';
export type NivelDaTurma = 'todos' | 'iniciante' | 'intermediario' | 'avancado';

export const NOME_DO_PUBLICO: Readonly<Record<PublicoDaTurma, string>> = { adulto: 'Adulto', kids: 'Kids', competicao: 'Competição', aberta: 'OPEN' };
export const NOME_DO_NIVEL_DA_TURMA: Readonly<Record<NivelDaTurma, string>> = { todos: 'todos os níveis', iniciante: 'iniciante', intermediario: 'intermediário', avancado: 'avançado' };

export interface Horario {
  id: Id;
  dia: DiaDaSemana;
  /** `HH:MM`, no fuso da academia. */
  inicio: HoraDoDia;
  /** Inteiro, em minutos. A duração real da Raça Fight é [decidir] L1. */
  duracaoMinutos: number;
}

export type ExigenciaDaTurma = { tipo: 'faixa_minima'; modalidadeId: Id; sistemaId: Id; nivelId: Id } | { tipo: 'so_atletas' };

export interface Turma {
  id: Id;
  academiaId: Id;
  nome: string;
  /** Uma ou mais (R14.3). Na aula aberta, as modalidades que contam ali. */
  modalidadeIds: Id[];
  publico: PublicoDaTurma;
  /** Kids: a faixa de idade é [decidir] L14; ausente = sem limite conhecido. */
  idadeMinima?: number;
  idadeMaxima?: number;
  nivel: NivelDaTurma;
  exigencia?: ExigenciaDaTurma;
  /** Nulo: sem professor fixo (a OPEN tem escala, R14.8). */
  professorId: Id | null;
  auxiliarIds: Id[];
  horarios: Horario[];
  /** Nulo = sem limite (L15). */
  capacidade: number | null;
  ativa: boolean;
}

export type MotivoDoCancelamento = 'feriado' | 'evento' | 'outro';

export const NOME_DO_MOTIVO_DO_CANCELAMENTO: Readonly<Record<MotivoDoCancelamento, string>> = { feriado: 'Feriado', evento: 'Evento', outro: 'Outro motivo' };

/** O que vira registro de uma aula sem presença: cancelada ou passada a outro professor (R14.5). */
export interface AjusteDeAula {
  aulaId: Id;
  academiaId: Id;
  tipo: 'cancelada' | 'substituto';
  motivo?: MotivoDoCancelamento;
  substitutoId?: Id;
  porId: Id;
  em: InstanteISO;
}

export interface Aula {
  id: Id;
  academiaId: Id;
  turmaId: Id;
  horarioId: Id;
  data: DataISO;
  dia: DiaDaSemana;
  /** `HH:MM` de início e de fim, no fuso da academia. */
  hora: HoraDoDia;
  horaDoFim: HoraDoDia;
  inicio: InstanteISO;
  fim: InstanteISO;
  inicioMs: number;
  fimMs: number;
  /** O professor da turma, ou o substituto se houver. */
  professorId: Id | null;
  substitutoId?: Id;
  cancelada: boolean;
  motivoDoCancelamento?: MotivoDoCancelamento;
}

export const idDaAula = (horarioId: Id, data: DataISO): Id => `${horarioId}@${data}`;

export function lerIdDaAula(aulaId: Id): { horarioId: Id; data: DataISO } | null {
  const m = /^(.+)@(\d{4}-\d{2}-\d{2})$/.exec(aulaId);
  return m ? { horarioId: m[1]!, data: m[2]! } : null;
}

function montarAula(turma: Turma, h: Horario, data: DataISO, fuso: string, ajustes: readonly AjusteDeAula[]): Aula {
  const id = idDaAula(h.id, data);
  const inicioMs = msNoFuso(data, h.inicio, fuso);
  const fimMs = inicioMs + h.duracaoMinutos * 60_000;
  const doDia = ajustes.filter((a) => a.aulaId === id);
  const cancelamento = doDia.filter((a) => a.tipo === 'cancelada').at(-1);
  const substituto = doDia.filter((a) => a.tipo === 'substituto').at(-1);
  return {
    id,
    academiaId: turma.academiaId,
    turmaId: turma.id,
    horarioId: h.id,
    data,
    dia: h.dia,
    hora: h.inicio,
    horaDoFim: escreverHora(lerHora(h.inicio) + h.duracaoMinutos),
    inicio: instanteComFusoDaAcademia(inicioMs, fuso),
    fim: instanteComFusoDaAcademia(fimMs, fuso),
    inicioMs,
    fimMs,
    professorId: substituto?.substitutoId ?? turma.professorId,
    ...(substituto?.substitutoId ? { substitutoId: substituto.substitutoId } : {}),
    cancelada: !!cancelamento,
    ...(cancelamento?.motivo ? { motivoDoCancelamento: cancelamento.motivo } : {}),
  };
}

const porInicio = (a: Aula, b: Aula) => a.inicioMs - b.inicioMs || a.turmaId.localeCompare(b.turmaId);

/** As aulas de uma data, pela grade das turmas ATIVAS, em ordem de hora. As canceladas vêm marcadas. */
export function aulasDoDia(turmas: readonly Turma[], data: DataISO, fuso: string, ajustes: readonly AjusteDeAula[] = []): Aula[] {
  const dia = diaDaSemanaDe(data);
  const aulas: Aula[] = [];
  for (const t of turmas) {
    if (!t.ativa) continue;
    for (const h of t.horarios) if (h.dia === dia) aulas.push(montarAula(t, h, data, fuso, ajustes));
  }
  return aulas.sort(porInicio);
}

/** As aulas de `de` até `ate` (inclusive). */
export function aulasEntre(turmas: readonly Turma[], de: DataISO, ate: DataISO, fuso: string, ajustes: readonly AjusteDeAula[] = []): Aula[] {
  const saida: Aula[] = [];
  for (let d = de; d <= ate; d = somarDias(d, 1)) saida.push(...aulasDoDia(turmas, d, fuso, ajustes));
  return saida;
}

/** A aula pelo id, se a grade ainda a gera. */
export function aulaPeloId(turmas: readonly Turma[], aulaId: Id, fuso: string, ajustes: readonly AjusteDeAula[] = []): Aula | null {
  const partes = lerIdDaAula(aulaId);
  if (!partes) return null;
  return aulasDoDia(turmas, partes.data, fuso, ajustes).find((a) => a.id === aulaId) ?? null;
}

/**
 * A próxima aula (a que ainda não acabou), não cancelada, entre as turmas do
 * filtro. Olha até `dias` à frente. Serve ao herói do Início do aluno.
 */
export function proximaAula(
  turmas: readonly Turma[],
  agoraMs: number,
  fuso: string,
  ajustes: readonly AjusteDeAula[] = [],
  filtro: (t: Turma) => boolean = () => true,
  dias = 7,
): Aula | null {
  const hoje = dataNoFuso(agoraMs, fuso);
  const escolhidas = turmas.filter(filtro);
  for (let i = 0; i <= dias; i += 1) {
    const aula = aulasDoDia(escolhidas, somarDias(hoje, i), fuso, ajustes).find((a) => !a.cancelada && a.fimMs > agoraMs);
    if (aula) return aula;
  }
  return null;
}

/**
 * A aula "da hora" de uma lista do dia (professor, Hoje): a que está
 * acontecendo; senão a próxima; senão a última que já passou.
 */
export function aulaDaHora(aulasDeHoje: readonly Aula[], agoraMs: number): Aula | null {
  const validas = aulasDeHoje.filter((a) => !a.cancelada);
  return validas.find((a) => a.inicioMs <= agoraMs && agoraMs < a.fimMs) ?? validas.find((a) => a.inicioMs > agoraMs) ?? validas.at(-1) ?? null;
}

export class ErroDaAula extends Error {
  readonly codigo: 'ja_comecou' | 'mesmo_professor' | 'cancelada';
  constructor(codigo: 'ja_comecou' | 'mesmo_professor' | 'cancelada', mensagem: string) {
    super(mensagem);
    this.codigo = codigo;
  }
}

/** R14.5: cancelar só antes do início. Os check-ins viram retirados (presenca.ts, R15.11). */
export function cancelarAula(aula: Aula, motivo: MotivoDoCancelamento, porId: Id, agoraMs: number, em: InstanteISO): AjusteDeAula {
  if (agoraMs >= aula.inicioMs) throw new ErroDaAula('ja_comecou', 'A aula já começou: não dá mais para cancelar.');
  if (aula.cancelada) throw new ErroDaAula('cancelada', 'Esta aula já está cancelada.');
  return { aulaId: aula.id, academiaId: aula.academiaId, tipo: 'cancelada', motivo, porId, em };
}

/** R14.5: passar a aula a outro professor da modalidade, antes do início. */
export function passarAula(aula: Aula, substitutoId: Id, porId: Id, agoraMs: number, em: InstanteISO): AjusteDeAula {
  if (agoraMs >= aula.inicioMs) throw new ErroDaAula('ja_comecou', 'A aula já começou: não dá mais para passar.');
  if (aula.cancelada) throw new ErroDaAula('cancelada', 'Esta aula está cancelada.');
  if (substitutoId === aula.professorId) throw new ErroDaAula('mesmo_professor', 'Escolha outro professor.');
  return { aulaId: aula.id, academiaId: aula.academiaId, tipo: 'substituto', substitutoId, porId, em };
}

/** O que o app sabe do aluno para decidir o check-in numa turma (R14.6). Nada de dinheiro aqui, de propósito. */
export interface QuemFazCheckin {
  /** Vínculo `ativo` com a academia. */
  vinculoAtivo: boolean;
  /**
   * Modalidades que a matrícula libera (do Admin). Ausente = o Admin ainda não
   * existe: vale só o vínculo ativo (R14.6, item 2, provisório).
   */
  modalidadesDaMatricula?: readonly Id[];
  /** Dependente (criança sem conta, R20.1). */
  ehDependente: boolean;
  /** Idade em anos inteiros, se a data de nascimento é conhecida. */
  idade?: number;
  /** As modalidades em que o professor marcou o aluno como atleta (R14.9). */
  atletaEm: readonly Id[];
  /** A graduação atual por modalidade: índice do nível no sistema (para a exigência de faixa). */
  indiceDoNivel?: (modalidadeId: Id, sistemaId: Id) => number | null;
  indiceExigido?: (sistemaId: Id, nivelId: Id) => number | null;
}

export type ResultadoDoCheckinNaTurma = { pode: true } | { pode: false; motivo: string };

/**
 * R14.6: o check-in só aparece para quem cumpre TUDO. Quem não cumpre vê a
 * turma na grade, sem o botão, com o motivo em uma frase — nunca financeiro
 * (R14.6a: atraso não bloqueia; só a matrícula encerrada, que tira o vínculo).
 */
export function podeFazerCheckinNaTurma(turma: Turma, quem: QuemFazCheckin): ResultadoDoCheckinNaTurma {
  if (!quem.vinculoAtivo) return { pode: false, motivo: 'O check-in abre quando a academia confirmar a sua matrícula.' };
  if (turma.publico === 'kids') {
    if (!quem.ehDependente) return { pode: false, motivo: 'Turma Kids: o check-in é feito pelo responsável, na conta dele.' };
    if (quem.idade !== undefined && ((turma.idadeMinima !== undefined && quem.idade < turma.idadeMinima) || (turma.idadeMaxima !== undefined && quem.idade > turma.idadeMaxima))) {
      return { pode: false, motivo: 'A idade não está na faixa desta turma. Fale com a recepção.' };
    }
  }
  if (turma.publico === 'competicao' || turma.exigencia?.tipo === 'so_atletas') {
    if (!turma.modalidadeIds.some((m) => quem.atletaEm.includes(m))) return { pode: false, motivo: 'Esta turma é da equipe de competição. Fale com o seu professor.' };
  }
  if (turma.publico !== 'aberta' && turma.publico !== 'competicao' && quem.modalidadesDaMatricula) {
    if (!turma.modalidadeIds.some((m) => quem.modalidadesDaMatricula!.includes(m))) return { pode: false, motivo: 'Esta modalidade não está na sua matrícula. Fale com a recepção.' };
  }
  if (turma.exigencia?.tipo === 'faixa_minima') {
    const ex = turma.exigencia;
    const atual = quem.indiceDoNivel?.(ex.modalidadeId, ex.sistemaId) ?? null;
    const exigido = quem.indiceExigido?.(ex.sistemaId, ex.nivelId) ?? null;
    if (exigido !== null && (atual === null || atual < exigido)) return { pode: false, motivo: 'Esta turma pede uma faixa acima da sua. Fale com o seu professor.' };
  }
  return { pode: true };
}

/** As modalidades em que o aluno pode marcar presença numa aula (a folha "Hoje você treina…", R15.6, R14.8). */
export function modalidadesParaEscolher(turma: Turma, doAluno: readonly Id[] | undefined): Id[] {
  if (!doAluno || doAluno.length === 0) return [...turma.modalidadeIds];
  const comuns = turma.modalidadeIds.filter((m) => doAluno.includes(m));
  return comuns.length > 0 ? comuns : [...turma.modalidadeIds];
}
