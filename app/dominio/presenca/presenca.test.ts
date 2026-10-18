import { test } from 'node:test';
import assert from 'node:assert/strict';
import { msNoFuso } from '../turmas/horario.ts';
import { aulasDoDia, type Aula } from '../turmas/turmas.ts';
import { gradeDaRacaFight } from '../turmas/grade-raca-fight.ts';
import {
  alunoAtivo,
  confirmadas,
  confirmarSemChamada,
  contarNaAula,
  contarPorModalidade,
  datasComPresenca,
  desfazerCheckin,
  diasSemPresenca,
  ErroDePresenca,
  estaSumido,
  fazerCheckin,
  fecharChamada,
  idDaPresenca,
  JANELA_PROPOSTA_L7,
  janelaDoCheckin,
  lancarPresencaRetroativa,
  montarChamada,
  presencasDesde,
  resolverPresenca,
  retirarPorCancelamento,
  retirarPresenca,
  ultimaPresenca,
  type Presenca,
} from './presenca.ts';

const FUSO = 'America/Sao_Paulo';
const PROF = { muayThai: 'diego', boxe: 'renato', jiuJitsu: 'marcio', mma: 'marcio', muayThaiKids: 'diego', jiuJitsuKids: 'marcio' };
const grade = gradeDaRacaFight({ academiaId: 'raca-fight', professores: PROF, duracaoDaAulaMinutos: 60 });
const aulaDe = (data: string, turmaId: string): Aula => aulasDoDia(grade, data, FUSO).find((a) => a.turmaId === turmaId)!;
const MT = aulaDe('2026-10-15', 'muay-thai-noite-1');
const as = (hora: string, data = '2026-10-15') => msNoFuso(data, hora, FUSO);
const em = (hora: string, data = '2026-10-15') => `${data}T${hora}:00-03:00`;
const checkin = (alunoId: string, hora = '19:41', aula = MT, existente?: Presenca | null) =>
  fazerCheckin({ aula, alunoId, modalidadeId: 'muay-thai', porId: alunoId, agoraMs: as(hora, aula.data), em: em(hora, aula.data), janela: JANELA_PROPOSTA_L7, existente });

test('a janela do check-in: abre 30 min antes e fecha 30 min depois do início (proposta L7, parâmetro)', () => {
  assert.deepEqual(janelaDoCheckin(MT, as('19:29'), JANELA_PROPOSTA_L7), { tipo: 'antes', abreEmMs: as('19:30'), abreAs: '19:30' });
  assert.equal(janelaDoCheckin(MT, as('19:30'), JANELA_PROPOSTA_L7).tipo, 'aberta');
  assert.deepEqual(janelaDoCheckin(MT, as('19:41'), JANELA_PROPOSTA_L7), { tipo: 'aberta', fechaEmMs: as('20:30'), fechaAs: '20:30' });
  assert.equal(janelaDoCheckin(MT, as('20:30'), JANELA_PROPOSTA_L7).tipo, 'aberta');
  assert.equal(janelaDoCheckin(MT, as('20:31'), JANELA_PROPOSTA_L7).tipo, 'fechada');
  // a academia pode mudar a janela: o domínio só recebe
  assert.equal(janelaDoCheckin(MT, as('19:41'), { minutosAntes: 10, minutosDepois: 10 }).tipo, 'antes');
  assert.equal(janelaDoCheckin({ ...MT, cancelada: true }, as('19:41'), JANELA_PROPOSTA_L7).tipo, 'fechada');
});

test('duas aulas seguidas têm duas janelas e duas presenças (R15.2)', () => {
  const segunda20 = aulaDe('2026-10-12', 'muay-thai-noite-1');
  const segunda21 = aulaDe('2026-10-12', 'muay-thai-noite-2');
  const a = checkin('lucas', '19:50', segunda20);
  const b = checkin('lucas', '20:45', segunda21);
  assert.notEqual(a.id, b.id);
  assert.equal(a.id, idDaPresenca(segunda20.id, 'lucas'));
});

test('"Estou na aula" grava a presença pendente; fora da janela, recusa', () => {
  const p = checkin('lucas');
  assert.equal(p.estado, 'pendente');
  assert.equal(p.origem, 'checkin');
  assert.equal(p.pelaEquipe, false);
  assert.equal(p.data, '2026-10-15');
  assert.equal(p.atualizadaPorId, 'lucas');
  assert.throws(() => checkin('lucas', '19:00'), (e: unknown) => e instanceof ErroDePresenca && e.codigo === 'fora_da_janela' && /19:30/.test(e.message));
  assert.throws(() => checkin('lucas', '21:00'), (e: unknown) => e instanceof ErroDePresenca && e.codigo === 'fora_da_janela');
  assert.throws(() => checkin('lucas', '19:41', { ...MT, cancelada: true }), (e: unknown) => e instanceof ErroDePresenca && e.codigo === 'aula_cancelada');
});

test('uma presença por aula: o segundo toque não duplica; desfazer e marcar de novo reaproveita o id', () => {
  const p = checkin('lucas');
  assert.throws(() => checkin('lucas', '19:45', MT, p), (e: unknown) => e instanceof ErroDePresenca && e.codigo === 'ja_marcada');
  const desfeita = desfazerCheckin(p, 'lucas', em('19:42'));
  assert.equal(desfeita.estado, 'retirada');
  assert.equal(desfeita.motivoDaRetirada, 'desfeito_pelo_aluno');
  const de_novo = checkin('lucas', '19:50', MT, desfeita);
  assert.equal(de_novo.id, p.id);
  assert.equal(de_novo.estado, 'pendente');
  assert.equal(de_novo.registradaEm, p.registradaEm);
});

test('o responsável faz o check-in do dependente (R15.3)', () => {
  const kids = aulaDe('2026-10-15', 'muay-thai-kids');
  const p = fazerCheckin({ aula: kids, alunoId: 'pedro', modalidadeId: 'muay-thai', porId: 'carla', agoraMs: as('18:45'), em: em('18:45'), janela: JANELA_PROPOSTA_L7 });
  assert.equal(p.alunoId, 'pedro');
  assert.equal(p.registradaPorId, 'carla');
  assert.equal(p.atualizadaPorId, 'carla');
});

test('chamada esquecida: o pendente confirma sozinho às 23:59 do dia da aula, "sem chamada" (R15.5)', () => {
  const p = checkin('lucas');
  assert.equal(confirmarSemChamada(p, as('23:58'), FUSO).estado, 'pendente');
  const sozinha = confirmarSemChamada(p, as('23:59'), FUSO);
  assert.equal(sozinha.estado, 'confirmada');
  assert.equal(sozinha.semChamada, true);
  assert.equal(confirmarSemChamada(p, as('08:00', '2026-10-16'), FUSO).estado, 'confirmada');
  // a retirada não volta
  const retirada = desfazerCheckin(p, 'lucas', em('19:42'));
  assert.equal(confirmarSemChamada(retirada, as('08:00', '2026-10-16'), FUSO).estado, 'retirada');
});

test('o desfazer não vale depois que a equipe mexeu', () => {
  const p = checkin('lucas');
  const fechada = fecharChamada({ aula: MT, presencas: [p], presentes: new Set(['lucas']), modalidadeDe: () => 'muay-thai', porId: 'diego', em: em('20:05') }).mudadas[0]!;
  assert.throws(() => desfazerCheckin(fechada, 'lucas', em('20:06')), (e: unknown) => e instanceof ErroDePresenca && e.codigo === 'nao_pode_desfazer');
});

test('a chamada: três grupos e a mesma contagem do Hoje (achado do AS)', () => {
  const ps = [checkin('ana'), checkin('breno'), checkin('camila'), checkin('lucas')];
  const grupos = montarChamada(MT.id, ps, ['ana', 'breno', 'camila', 'lucas', 'davi', 'elisa'], [{ experimentalId: 'x1', nome: 'Igor', modalidadeId: 'muay-thai' }]);
  assert.equal(grupos.checkins.length, 4);
  assert.deepEqual(grupos.daTurmaSemCheckin, ['davi', 'elisa']);
  assert.equal(grupos.experimentais.length, 1);
  assert.equal(contarNaAula(MT.id, ps), grupos.checkins.length);
  // o desfeito pelo aluno volta para "sem check-in" e sai da contagem
  const comDesfeito = [...ps.slice(0, 3), desfazerCheckin(ps[3]!, 'lucas', em('19:50'))];
  assert.equal(contarNaAula(MT.id, comDesfeito), 3);
  assert.deepEqual(montarChamada(MT.id, comDesfeito, ['ana', 'breno', 'camila', 'lucas']).daTurmaSemCheckin, ['lucas']);
});

test('fechar a chamada: confirma o marcado, retira o desmarcado, cria quem veio sem celular (R15.4)', () => {
  const ps = [checkin('ana'), checkin('breno'), checkin('lucas')];
  const r = fecharChamada({ aula: MT, presencas: ps, presentes: new Set(['ana', 'lucas', 'davi']), modalidadeDe: () => 'muay-thai', porId: 'diego', em: em('20:10') });
  const por = new Map(r.mudadas.map((p) => [p.alunoId, p]));
  assert.equal(por.get('ana')!.estado, 'confirmada');
  assert.equal(por.get('ana')!.pelaEquipe, true);
  assert.equal(por.get('ana')!.origem, 'checkin');
  assert.equal(por.get('breno')!.estado, 'retirada');
  assert.equal(por.get('breno')!.motivoDaRetirada, 'nao_estava');
  assert.equal(por.get('davi')!.estado, 'confirmada');
  assert.equal(por.get('davi')!.origem, 'chamada');
  assert.equal(por.get('davi')!.registradaPorId, 'diego');
  assert.equal(r.presentes, 3);
  assert.equal(r.retirados, 1);
  // fechar de novo sem mudar nada não regrava ninguém
  const depois = ps.map((p) => por.get(p.alunoId) ?? p).concat(por.get('davi')!);
  const outra = fecharChamada({ aula: MT, presencas: depois, presentes: new Set(['ana', 'lucas', 'davi']), modalidadeDe: () => 'muay-thai', porId: 'diego', em: em('20:20') });
  assert.equal(outra.mudadas.length, 0);
});

test('o professor tira e a equipe devolve: a retirada pela equipe não reabre pelo aluno', () => {
  const p = checkin('breno');
  const tirada = fecharChamada({ aula: MT, presencas: [p], presentes: new Set(), modalidadeDe: () => 'muay-thai', porId: 'diego', em: em('20:10') }).mudadas[0]!;
  assert.throws(() => checkin('breno', '20:15', MT, tirada), (e: unknown) => e instanceof ErroDePresenca && e.codigo === 'retirada_pela_equipe');
  const devolvida = fecharChamada({ aula: MT, presencas: [tirada], presentes: new Set(['breno']), modalidadeDe: () => 'muay-thai', porId: 'diego', em: em('20:12') }).mudadas[0]!;
  assert.equal(devolvida.estado, 'confirmada');
  assert.equal(devolvida.origem, 'checkin');
});

test('retirar e lançar no passado: só a equipe, só até 7 dias (R15.5, R15.8)', () => {
  const p = checkin('lucas');
  assert.equal(retirarPresenca(p, 'diego', 'correcao', em('10:00', '2026-10-20'), as('10:00', '2026-10-22'), FUSO).estado, 'retirada');
  assert.throws(() => retirarPresenca(p, 'diego', 'correcao', 'x', as('10:00', '2026-10-23'), FUSO), (e: unknown) => e instanceof ErroDePresenca && e.codigo === 'fora_do_prazo');
  const retro = lancarPresencaRetroativa({ aula: MT, alunoId: 'davi', modalidadeId: 'muay-thai', porId: 'simone', em: em('09:00', '2026-10-17'), agoraMs: as('09:00', '2026-10-17'), fuso: FUSO });
  assert.equal(retro.origem, 'correcao');
  assert.equal(retro.estado, 'confirmada');
  assert.throws(() => lancarPresencaRetroativa({ aula: MT, alunoId: 'davi', modalidadeId: 'muay-thai', porId: 's', em: 'x', agoraMs: as('19:00'), fuso: FUSO }), (e: unknown) => e instanceof ErroDePresenca && e.codigo === 'aula_futura');
  assert.throws(() => lancarPresencaRetroativa({ aula: MT, alunoId: 'davi', modalidadeId: 'muay-thai', porId: 's', em: 'x', agoraMs: as('09:00', '2026-10-30'), fuso: FUSO }), (e: unknown) => e instanceof ErroDePresenca && e.codigo === 'fora_do_prazo');
});

test('aula cancelada retira os check-ins com o motivo (R15.11)', () => {
  const ps = [checkin('ana'), checkin('lucas')];
  const r = retirarPorCancelamento(ps, MT.id, 'diego', em('19:45'));
  assert.equal(r.length, 2);
  assert.ok(r.every((p) => p.estado === 'retirada' && p.motivoDaRetirada === 'aula_cancelada'));
});

test('sem sinal: a ação da equipe vence o check-in; entre duas da equipe, a mais recente (R15.9)', () => {
  const doAluno = checkin('lucas', '19:41');
  const doProfessor = fecharChamada({ aula: MT, presencas: [doAluno], presentes: new Set(), modalidadeDe: () => 'muay-thai', porId: 'diego', em: em('20:05') }).mudadas[0]!;
  // o aluno toca de novo DEPOIS, sem sinal: mesmo assim vale o professor
  const alunoDepois = { ...doAluno, atualizadaEm: em('20:20') };
  assert.equal(resolverPresenca(alunoDepois, doProfessor).estado, 'retirada');
  assert.equal(resolverPresenca(doProfessor, alunoDepois).estado, 'retirada');
  const professorDepois = { ...doProfessor, estado: 'confirmada' as const, atualizadaEm: em('20:30') };
  assert.equal(resolverPresenca(doProfessor, professorDepois).estado, 'confirmada');
  // fusos diferentes não enganam: 20:30-03:00 é depois de 22:00-01:00 (= 20:00-03:00)
  const outroFuso = { ...doProfessor, estado: 'confirmada' as const, atualizadaEm: '2026-10-15T22:00:00-01:00' };
  assert.equal(resolverPresenca({ ...doProfessor, atualizadaEm: em('20:30') }, outroFuso).atualizadaEm, em('20:30'));
  assert.throws(() => resolverPresenca(doAluno, checkin('ana')), /mesma presença/);
});

test('frequência: por modalidade, desde a última graduação, última aula, ativo e sumido', () => {
  const jj = aulaDe('2026-10-12', 'jiu-jitsu-luta-livre');
  const ps: Presenca[] = [
    checkin('lucas', '19:50', aulaDe('2026-10-12', 'muay-thai-noite-1')),
    fazerCheckin({ aula: jj, alunoId: 'lucas', modalidadeId: 'jiu-jitsu', porId: 'lucas', agoraMs: as('19:50', '2026-10-12'), em: em('19:50', '2026-10-12'), janela: JANELA_PROPOSTA_L7 }),
    checkin('lucas'),
  ];
  assert.deepEqual([...contarPorModalidade(ps)], [['muay-thai', 2], ['jiu-jitsu', 1]]);
  assert.equal(presencasDesde(ps, 'muay-thai', '2026-10-12'), 1);
  assert.equal(presencasDesde(ps, 'muay-thai', null), 2);
  assert.equal(ultimaPresenca(ps), '2026-10-15');
  assert.equal(ultimaPresenca([]), null);
  assert.equal(diasSemPresenca('2026-10-06', '2026-10-15'), 9);
  assert.equal(diasSemPresenca(null, '2026-10-15'), null);
  assert.deepEqual([...datasComPresenca(ps, '2026-10-12', '2026-10-18')].sort(), ['2026-10-12', '2026-10-15']);
  // ativo conta só as confirmadas (as de hoje ainda pendentes não)
  assert.equal(alunoAtivo(ps, as('20:00'), FUSO), true); // as de segunda já confirmaram sozinhas
  assert.equal(confirmadas(ps, as('20:00'), FUSO).length, 2);
  assert.equal(alunoAtivo(ps, as('10:00', '2026-11-30'), FUSO), false);
  assert.equal(estaSumido({ ultima: '2026-10-01', desde: '2025-01-10', hoje: '2026-10-15' }), true);
  assert.equal(estaSumido({ ultima: '2026-10-02', desde: '2025-01-10', hoje: '2026-10-15' }), false);
  // o aluno novo (até 90 dias de vínculo) some com 7 dias
  assert.equal(estaSumido({ ultima: '2026-10-08', desde: '2026-09-01', hoje: '2026-10-15' }), true);
  assert.equal(estaSumido({ ultima: null, desde: '2026-10-10', hoje: '2026-10-15' }), false);
});
