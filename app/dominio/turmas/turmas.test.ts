import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dataNoFuso, deslocamentoDoFuso, diaDaSemanaDe, diasEntre, escreverHora, instanteComFusoDaAcademia, lerHora, minutosNoFuso, msNoFuso, segundaDaSemana, somarDias } from './horario.ts';
import { aulaDaHora, aulaPeloId, aulasDoDia, aulasEntre, cancelarAula, ErroDaAula, idDaAula, lerIdDaAula, modalidadesParaEscolher, passarAula, podeFazerCheckinNaTurma, proximaAula, type QuemFazCheckin } from './turmas.ts';
import { CONTATO_RACA_FIGHT, gradeDaRacaFight } from './grade-raca-fight.ts';

const FUSO = 'America/Sao_Paulo';
const PROF = { muayThai: 'diego', boxe: 'renato', jiuJitsu: 'marcio', mma: 'marcio', muayThaiKids: 'diego', jiuJitsuKids: 'marcio' };
const grade = () => gradeDaRacaFight({ academiaId: 'raca-fight', professores: PROF, duracaoDaAulaMinutos: 60 });
const resumo = (data: string) => aulasDoDia(grade(), data, FUSO).map((a) => `${a.hora} ${a.turmaId}`);

test('o fuso da academia: Gravataí está a −3 h, sem horário de verão', () => {
  assert.equal(deslocamentoDoFuso(FUSO, Date.parse('2026-10-15T12:00:00Z')), -180);
  assert.equal(deslocamentoDoFuso(FUSO, Date.parse('2027-01-15T12:00:00Z')), -180);
  assert.equal(deslocamentoDoFuso('UTC', Date.parse('2026-10-15T12:00:00Z')), 0);
});

test('data e hora no fuso da academia, não no do aparelho', () => {
  // 01:00 UTC do dia 16 ainda é dia 15 em Gravataí (22:00)
  assert.equal(dataNoFuso(Date.parse('2026-10-16T01:00:00Z'), FUSO), '2026-10-15');
  assert.equal(minutosNoFuso(Date.parse('2026-10-16T01:00:00Z'), FUSO), 22 * 60);
  assert.equal(msNoFuso('2026-10-15', '20:00', FUSO), Date.parse('2026-10-15T23:00:00Z'));
  assert.equal(instanteComFusoDaAcademia(Date.parse('2026-10-15T23:00:00Z'), FUSO), '2026-10-15T20:00:00-03:00');
});

test('horas, dias e semanas', () => {
  assert.equal(lerHora('20:30'), 1230);
  assert.throws(() => lerHora('24:00'), RangeError);
  assert.throws(() => lerHora('8:00'), RangeError);
  assert.equal(escreverHora(1290), '21:30');
  assert.equal(escreverHora(1440 + 30), '00:30');
  assert.equal(diaDaSemanaDe('2026-10-15'), 'qui');
  assert.equal(diaDaSemanaDe('2026-10-18'), 'dom');
  assert.equal(somarDias('2026-10-31', 1), '2026-11-01');
  assert.equal(diasEntre('2026-10-01', '2026-10-15'), 14);
  assert.equal(segundaDaSemana('2026-10-15'), '2026-10-12');
  assert.equal(segundaDaSemana('2026-10-18'), '2026-10-12');
  assert.equal(segundaDaSemana('2026-10-12'), '2026-10-12');
});

test('a grade real: quinta NÃO tem Muay Thai às 21h (achado do AS)', () => {
  assert.deepEqual(resumo('2026-10-15'), ['09:00 boxe-manha', '19:00 muay-thai-kids', '20:00 mma', '20:00 muay-thai-noite-1', '21:00 boxe-noite']);
});

test('a grade real: segunda e quarta têm Muay Thai às 9h, 20h e 21h, Jiu-Jitsu Kids às 19h e Jiu-Jitsu / Luta Livre às 20h', () => {
  for (const d of ['2026-10-12', '2026-10-14']) {
    assert.deepEqual(resumo(d), ['09:00 muay-thai-manha', '19:00 jiu-jitsu-kids', '20:00 jiu-jitsu-luta-livre', '20:00 muay-thai-noite-1', '21:00 muay-thai-noite-2']);
  }
  assert.deepEqual(resumo('2026-10-13'), ['09:00 boxe-manha', '19:00 muay-thai-kids', '20:00 mma', '20:00 muay-thai-noite-1', '21:00 boxe-noite']);
});

test('a grade real: Sexta OPEN das 20h às 22h, sábado de competição das 10h às 12h, domingo sem aula', () => {
  const sexta = aulasDoDia(grade(), '2026-10-16', FUSO);
  assert.equal(sexta.length, 1);
  assert.equal(sexta[0]!.turmaId, 'sexta-open');
  assert.equal(`${sexta[0]!.hora}–${sexta[0]!.horaDoFim}`, '20:00–22:00');
  const sabado = aulasDoDia(grade(), '2026-10-17', FUSO);
  assert.equal(`${sabado[0]!.hora}–${sabado[0]!.horaDoFim}`, '10:00–12:00');
  assert.equal(aulasDoDia(grade(), '2026-10-18', FUSO).length, 0);
  // 22 horários por semana no cartaz
  assert.equal(aulasEntre(grade(), '2026-10-12', '2026-10-18', FUSO).length, 22);
});

test('a duração das aulas é parâmetro (L1), sem padrão escolhido aqui', () => {
  assert.throws(() => gradeDaRacaFight({ academiaId: 'a', professores: PROF, duracaoDaAulaMinutos: 0 }), RangeError);
  const g90 = gradeDaRacaFight({ academiaId: 'a', professores: PROF, duracaoDaAulaMinutos: 90 });
  assert.equal(aulasDoDia(g90, '2026-10-15', FUSO).find((a) => a.turmaId === 'mma')!.horaDoFim, '21:30');
  // a faixa de idade das turmas Kids (L14) não foi inventada
  assert.equal(grade().find((t) => t.id === 'muay-thai-kids')!.idadeMinima, undefined);
});

test('o contato real da academia: o WhatsApp da aula experimental', () => {
  assert.equal(CONTATO_RACA_FIGHT.whatsapp, '(51) 98196-2077');
  assert.match(CONTATO_RACA_FIGHT.endereco, /Alexandrino de Alencar, 593/);
});

test('a aula tem id estável (horário@data) e instante com o fuso escrito', () => {
  const a = aulasDoDia(grade(), '2026-10-15', FUSO).find((x) => x.turmaId === 'muay-thai-noite-1')!;
  assert.equal(a.id, idDaAula('muay-thai-noite-1-qui-20', '2026-10-15'));
  assert.deepEqual(lerIdDaAula(a.id), { horarioId: 'muay-thai-noite-1-qui-20', data: '2026-10-15' });
  assert.equal(a.inicio, '2026-10-15T20:00:00-03:00');
  assert.equal(a.fim, '2026-10-15T21:00:00-03:00');
  assert.equal(aulaPeloId(grade(), a.id, FUSO)?.turmaId, 'muay-thai-noite-1');
  assert.equal(aulaPeloId(grade(), 'nada@2026-10-15', FUSO), null);
  assert.equal(lerIdDaAula('sem-data'), null);
});

test('a próxima aula: a de hoje se ainda não acabou; depois, a do próximo dia da turma', () => {
  const g = grade();
  const so = (id: string) => (t: { id: string }) => t.id === id;
  const quinta1941 = msNoFuso('2026-10-15', '19:41', FUSO);
  assert.equal(proximaAula(g, quinta1941, FUSO, [], so('muay-thai-noite-1'))!.data, '2026-10-15');
  // durante a aula ela ainda é "a próxima" (o check-in fica aberto até 30 min depois)
  assert.equal(proximaAula(g, msNoFuso('2026-10-15', '20:40', FUSO), FUSO, [], so('muay-thai-noite-1'))!.data, '2026-10-15');
  const depois = proximaAula(g, msNoFuso('2026-10-15', '21:30', FUSO), FUSO, [], so('muay-thai-noite-1'))!;
  assert.equal(depois.data, '2026-10-19');
  assert.equal(depois.hora, '20:00');
});

test('aula cancelada fica na grade marcada e a próxima pula ela', () => {
  const g = grade();
  const aula = aulasDoDia(g, '2026-10-15', FUSO).find((a) => a.turmaId === 'muay-thai-noite-1')!;
  const ajuste = cancelarAula(aula, 'feriado', 'diego', msNoFuso('2026-10-15', '10:00', FUSO), '2026-10-15T10:00:00-03:00');
  const doDia = aulasDoDia(g, '2026-10-15', FUSO, [ajuste]);
  assert.equal(doDia.find((a) => a.id === aula.id)!.cancelada, true);
  assert.equal(doDia.find((a) => a.id === aula.id)!.motivoDoCancelamento, 'feriado');
  const prox = proximaAula(g, msNoFuso('2026-10-15', '19:41', FUSO), FUSO, [ajuste], (t) => t.id === 'muay-thai-noite-1')!;
  assert.equal(prox.data, '2026-10-19');
});

test('cancelar e passar a aula só antes do início (R14.5)', () => {
  const aula = aulasDoDia(grade(), '2026-10-15', FUSO).find((a) => a.turmaId === 'mma')!;
  const durante = msNoFuso('2026-10-15', '20:05', FUSO);
  assert.throws(() => cancelarAula(aula, 'outro', 'marcio', durante, 'x'), (e: unknown) => e instanceof ErroDaAula && e.codigo === 'ja_comecou');
  assert.throws(() => passarAula(aula, 'diego', 'marcio', durante, 'x'), ErroDaAula);
  assert.throws(() => passarAula(aula, 'marcio', 'marcio', msNoFuso('2026-10-15', '10:00', FUSO), 'x'), (e: unknown) => e instanceof ErroDaAula && e.codigo === 'mesmo_professor');
  const ajuste = passarAula(aula, 'diego', 'marcio', msNoFuso('2026-10-15', '10:00', FUSO), '2026-10-15T10:00:00-03:00');
  const comSubstituto = aulasDoDia(grade(), '2026-10-15', FUSO, [ajuste]).find((a) => a.id === aula.id)!;
  assert.equal(comSubstituto.professorId, 'diego');
  assert.equal(comSubstituto.substitutoId, 'diego');
});

test('a aula da hora do professor: a que acontece, senão a próxima, senão a última', () => {
  const doDia = aulasDoDia(grade(), '2026-10-15', FUSO).filter((a) => a.professorId === 'diego');
  assert.equal(aulaDaHora(doDia, msNoFuso('2026-10-15', '19:52', FUSO))!.hora, '19:00');
  assert.equal(aulaDaHora(doDia, msNoFuso('2026-10-15', '20:10', FUSO))!.hora, '20:00');
  assert.equal(aulaDaHora(doDia, msNoFuso('2026-10-15', '23:00', FUSO))!.hora, '20:00');
  assert.equal(aulaDaHora(doDia, msNoFuso('2026-10-15', '06:00', FUSO))!.hora, '19:00');
  assert.equal(aulaDaHora([], 0), null);
});

const adulto = (m: Partial<QuemFazCheckin> = {}): QuemFazCheckin => ({ vinculoAtivo: true, ehDependente: false, atletaEm: [], ...m });
const DINHEIRO = /mensalidade|pagamento|pagar|atras|R\$|valor|débito|dívida/i;

test('quem faz check-in (R14.6): competição só atleta, Kids só dependente, modalidade da matrícula', () => {
  const g = grade();
  const t = (id: string) => g.find((x) => x.id === id)!;
  assert.deepEqual(podeFazerCheckinNaTurma(t('muay-thai-noite-1'), adulto()), { pode: true });
  const comp = podeFazerCheckinNaTurma(t('treino-de-competicao'), adulto());
  assert.equal(comp.pode, false);
  assert.equal(!comp.pode && comp.motivo, 'Esta turma é da equipe de competição. Fale com o seu professor.');
  assert.deepEqual(podeFazerCheckinNaTurma(t('treino-de-competicao'), adulto({ atletaEm: ['muay-thai'] })), { pode: true });
  assert.equal(podeFazerCheckinNaTurma(t('jiu-jitsu-kids'), adulto()).pode, false);
  assert.equal(podeFazerCheckinNaTurma(t('jiu-jitsu-kids'), adulto({ ehDependente: true, idade: 8 })).pode, true);
  assert.equal(podeFazerCheckinNaTurma(t('boxe-noite'), adulto({ modalidadesDaMatricula: ['muay-thai'] })).pode, false);
  assert.equal(podeFazerCheckinNaTurma(t('boxe-noite'), adulto({ modalidadesDaMatricula: ['boxe'] })).pode, true);
  // a OPEN é de qualquer adulto matriculado (R14.8)
  assert.equal(podeFazerCheckinNaTurma(t('sexta-open'), adulto({ modalidadesDaMatricula: ['boxe'] })).pode, true);
  assert.equal(podeFazerCheckinNaTurma(t('muay-thai-noite-1'), adulto({ vinculoAtivo: false })).pode, false);
});

test('a faixa de idade das turmas Kids, quando a academia definir, vale', () => {
  const kids = { ...grade().find((x) => x.id === 'jiu-jitsu-kids')!, idadeMinima: 6, idadeMaxima: 12 };
  assert.equal(podeFazerCheckinNaTurma(kids, adulto({ ehDependente: true, idade: 5 })).pode, false);
  assert.equal(podeFazerCheckinNaTurma(kids, adulto({ ehDependente: true, idade: 12 })).pode, true);
});

test('a exigência de faixa mínima compara o índice do nível', () => {
  const t = { ...grade().find((x) => x.id === 'jiu-jitsu-luta-livre')!, exigencia: { tipo: 'faixa_minima' as const, modalidadeId: 'jiu-jitsu', sistemaId: 'ibjjf', nivelId: 'roxa' } };
  const ordem = ['branca', 'azul', 'roxa'];
  const com = (nivel: string | null) => adulto({ indiceDoNivel: () => (nivel ? ordem.indexOf(nivel) : null), indiceExigido: (_s, n) => ordem.indexOf(n) });
  assert.equal(podeFazerCheckinNaTurma(t, com('azul')).pode, false);
  assert.equal(podeFazerCheckinNaTurma(t, com('roxa')).pode, true);
  assert.equal(podeFazerCheckinNaTurma(t, com(null)).pode, false);
});

test('nenhum motivo de check-in fala de dinheiro (R14.6a)', () => {
  const g = grade();
  const casos: QuemFazCheckin[] = [adulto({ vinculoAtivo: false }), adulto({ modalidadesDaMatricula: [] }), adulto(), adulto({ ehDependente: true, idade: 99 })];
  for (const turma of g) {
    for (const q of casos) {
      const r = podeFazerCheckinNaTurma({ ...turma, idadeMaxima: 15 }, q);
      if (!r.pode) assert.doesNotMatch(r.motivo, DINHEIRO, r.motivo);
    }
  }
});

test('a folha "Hoje você treina…": as modalidades da turma que o aluno tem', () => {
  const jj = grade().find((x) => x.id === 'jiu-jitsu-luta-livre')!;
  assert.deepEqual(modalidadesParaEscolher(jj, ['jiu-jitsu', 'luta-livre', 'muay-thai']), ['jiu-jitsu', 'luta-livre']);
  assert.deepEqual(modalidadesParaEscolher(jj, ['jiu-jitsu']), ['jiu-jitsu']);
  assert.deepEqual(modalidadesParaEscolher(jj, undefined), ['jiu-jitsu', 'luta-livre']);
  const open = grade().find((x) => x.id === 'sexta-open')!;
  assert.deepEqual(modalidadesParaEscolher(open, ['muay-thai', 'jiu-jitsu']), ['muay-thai', 'jiu-jitsu']);
});
