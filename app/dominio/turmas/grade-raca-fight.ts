/**
 * A GRADE REAL da Raça Fight Gravataí, como dado de exemplo (o cartaz
 * `02-design/referencias/raca-fight/fotos/raca-37.jpg`, transcrito em
 * `01-DADOS-REAIS.md` e em `01-especificacao/luta/00-LEIA-ME.md`).
 *
 * O que é real: dias, horas, modalidades, a Sexta OPEN (20h–22h) e o sábado
 * de competição (10h–12h), o endereço e o WhatsApp.
 *
 * O que é PARÂMETRO, porque é [decidir]:
 * - a duração das aulas de turma (L1): o cartaz não diz. Quem monta a grade passa;
 * - se o Muay Thai das 20h e o das 21h são turmas diferentes (L1): aqui são
 *   "noite 1" e "noite 2", a leitura do AJ, até a academia responder;
 * - a faixa de idade das turmas Kids (L14): fica vazia;
 * - os professores: os ids chegam de fora (nos exemplos, nomes fictícios).
 */
import type { Id } from '../tipos.ts';
import type { Horario, Turma } from './turmas.ts';

/** O contato da academia, como está no perfil público. */
export const CONTATO_RACA_FIGHT = {
  nome: 'Raça Fight Gravataí',
  nomeCurto: 'Raça Fight',
  frase: 'Treine com disciplina, técnica e respeito',
  endereco: 'Av. Alexandrino de Alencar, 593',
  cidade: 'Gravataí (RS)',
  whatsapp: '(51) 98196-2077',
  instagram: '@racafightgravatai',
} as const;

export interface ProfessoresDaGrade {
  muayThai: Id | null;
  boxe: Id | null;
  jiuJitsu: Id | null;
  mma: Id | null;
  muayThaiKids: Id | null;
  jiuJitsuKids: Id | null;
  /** Sexta OPEN: sem professor fixo, a escala é do Admin (R14.8). */
  open?: Id | null;
  competicao?: Id | null;
}

export interface EntradaDaGrade {
  academiaId: Id;
  professores: ProfessoresDaGrade;
  /** [decidir] L1: a duração de cada aula de turma, em minutos. Sem padrão de propósito. */
  duracaoDaAulaMinutos: number;
}

/** As modalidades das aulas abertas (todas as da academia). */
const TODAS = ['muay-thai', 'boxe', 'jiu-jitsu', 'luta-livre', 'mma'];

export function gradeDaRacaFight({ academiaId, professores, duracaoDaAulaMinutos }: EntradaDaGrade): Turma[] {
  if (!Number.isInteger(duracaoDaAulaMinutos) || duracaoDaAulaMinutos <= 0) throw new RangeError('a duração da aula (L1) é um inteiro de minutos maior que zero');
  const h = (turma: string, dia: Horario['dia'], inicio: string, duracao = duracaoDaAulaMinutos): Horario => ({ id: `${turma}-${dia}-${inicio.slice(0, 2)}`, dia, inicio, duracaoMinutos: duracao });
  const turma = (t: Omit<Turma, 'academiaId' | 'auxiliarIds' | 'capacidade' | 'ativa' | 'nivel'> & Partial<Turma>): Turma => ({
    academiaId,
    auxiliarIds: [],
    capacidade: null,
    ativa: true,
    nivel: 'todos',
    ...t,
  });
  return [
    turma({ id: 'muay-thai-manha', nome: 'Muay Thai — manhã', modalidadeIds: ['muay-thai'], publico: 'adulto', professorId: professores.muayThai, horarios: [h('muay-thai-manha', 'seg', '09:00'), h('muay-thai-manha', 'qua', '09:00')] }),
    turma({
      id: 'muay-thai-noite-1',
      nome: 'Muay Thai — noite 1',
      modalidadeIds: ['muay-thai'],
      publico: 'adulto',
      professorId: professores.muayThai,
      horarios: [h('muay-thai-noite-1', 'seg', '20:00'), h('muay-thai-noite-1', 'ter', '20:00'), h('muay-thai-noite-1', 'qua', '20:00'), h('muay-thai-noite-1', 'qui', '20:00')],
    }),
    turma({ id: 'muay-thai-noite-2', nome: 'Muay Thai — noite 2', modalidadeIds: ['muay-thai'], publico: 'adulto', professorId: professores.muayThai, horarios: [h('muay-thai-noite-2', 'seg', '21:00'), h('muay-thai-noite-2', 'qua', '21:00')] }),
    turma({ id: 'boxe-manha', nome: 'Boxe — manhã', modalidadeIds: ['boxe'], publico: 'adulto', professorId: professores.boxe, horarios: [h('boxe-manha', 'ter', '09:00'), h('boxe-manha', 'qui', '09:00')] }),
    turma({ id: 'boxe-noite', nome: 'Boxe — noite', modalidadeIds: ['boxe'], publico: 'adulto', professorId: professores.boxe, horarios: [h('boxe-noite', 'ter', '21:00'), h('boxe-noite', 'qui', '21:00')] }),
    turma({ id: 'jiu-jitsu-luta-livre', nome: 'Jiu-Jitsu / Luta Livre', modalidadeIds: ['jiu-jitsu', 'luta-livre'], publico: 'adulto', professorId: professores.jiuJitsu, horarios: [h('jiu-jitsu-luta-livre', 'seg', '20:00'), h('jiu-jitsu-luta-livre', 'qua', '20:00')] }),
    turma({ id: 'mma', nome: 'MMA', modalidadeIds: ['mma'], publico: 'adulto', professorId: professores.mma, horarios: [h('mma', 'ter', '20:00'), h('mma', 'qui', '20:00')] }),
    turma({ id: 'muay-thai-kids', nome: 'Muay Thai Kids', modalidadeIds: ['muay-thai'], publico: 'kids', professorId: professores.muayThaiKids, horarios: [h('muay-thai-kids', 'ter', '19:00'), h('muay-thai-kids', 'qui', '19:00')] }),
    turma({ id: 'jiu-jitsu-kids', nome: 'Jiu-Jitsu Kids', modalidadeIds: ['jiu-jitsu'], publico: 'kids', professorId: professores.jiuJitsuKids, horarios: [h('jiu-jitsu-kids', 'seg', '19:00'), h('jiu-jitsu-kids', 'qua', '19:00')] }),
    // as duas aulas especiais têm a duração no cartaz: 20h–22h e 10h–12h
    turma({ id: 'sexta-open', nome: 'Sexta OPEN', modalidadeIds: TODAS, publico: 'aberta', professorId: professores.open ?? null, horarios: [h('sexta-open', 'sex', '20:00', 120)] }),
    turma({ id: 'treino-de-competicao', nome: 'Treino de competição', modalidadeIds: TODAS, publico: 'competicao', exigencia: { tipo: 'so_atletas' }, professorId: professores.competicao ?? null, horarios: [h('treino-de-competicao', 'sab', '10:00', 120)] }),
  ];
}
