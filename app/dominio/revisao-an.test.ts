/**
 * Revisão AN (P12, onda 4): os achados de domínio da varredura de bugs do
 * app do aluno, do professor e da recepção. Cada teste foi escrito antes da
 * correção e falhava com o código de antes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { msNoFuso } from './turmas/horario.ts';
import { gradeDaRacaFight } from './turmas/grade-raca-fight.ts';
import { proximaAula, type AjusteDeAula } from './turmas/turmas.ts';
import { aulaDoCheckin, JANELA_PROPOSTA_L7, presentesDaChamada } from './presenca/presenca.ts';

const FUSO = 'America/Sao_Paulo';
const PROF = { muayThai: 'diego', boxe: 'renato', jiuJitsu: 'marcio', mma: 'marcio', muayThaiKids: 'diego', jiuJitsuKids: 'marcio' };
const grade = gradeDaRacaFight({ academiaId: 'raca-fight', professores: PROF, duracaoDaAulaMinutos: 60 });
// quem treina Muay Thai (noite 1, 20h) e Boxe (noite, 21h): terça e quinta têm as duas
const turmas = grade.filter((t) => t.id === 'muay-thai-noite-1' || t.id === 'boxe-noite');
const TERCA = '2026-10-13';
const as = (hora: string, data = TERCA) => msNoFuso(data, hora, FUSO);

test('AN-1: com o check-in do Muay Thai das 20h fechado, o herói já é o Boxe das 21h (a janela dele abriu às 20:30)', () => {
  // antes: proximaAula segura o Muay Thai até ele ACABAR (21h) e o Boxe não recebe check-in entre 20:30 e 21:00
  assert.equal(proximaAula(turmas, as('20:40'), FUSO)?.turmaId, 'muay-thai-noite-1');
  const a = aulaDoCheckin(turmas, as('20:40'), FUSO, JANELA_PROPOSTA_L7);
  assert.equal(a?.aula.turmaId, 'boxe-noite');
  assert.equal(a?.aula.hora, '21:00');
});

test('AN-1: dentro da janela do Muay Thai, o herói continua sendo ele', () => {
  assert.equal(aulaDoCheckin(turmas, as('20:10'), FUSO, JANELA_PROPOSTA_L7)?.aula.turmaId, 'muay-thai-noite-1');
  assert.equal(aulaDoCheckin(turmas, as('19:00'), FUSO, JANELA_PROPOSTA_L7)?.aula.turmaId, 'muay-thai-noite-1');
});

test('AN-1: depois da última aula do dia, vem a de amanhã', () => {
  const a = aulaDoCheckin(turmas, as('21:45'), FUSO, JANELA_PROPOSTA_L7);
  assert.equal(a?.aula.data, '2026-10-14');
});

test('AN-2: a aula de hoje cancelada não some calada: o herói diz qual foi', () => {
  const ajuste: AjusteDeAula = { aulaId: `muay-thai-noite-1-ter-20@${TERCA}`, academiaId: 'raca-fight', tipo: 'cancelada', motivo: 'outro', porId: 'diego', em: '2026-10-13T10:00:00-03:00' };
  const a = aulaDoCheckin(turmas, as('18:00'), FUSO, JANELA_PROPOSTA_L7, [ajuste]);
  assert.equal(a?.aula.turmaId, 'boxe-noite');
  assert.deepEqual(a?.canceladasHoje.map((x) => x.hora), ['20:00']);
});

test('AN-3: o check-in que chega com a chamada aberta entra marcado (antes virava "não estava na aula" ao fechar)', () => {
  // o professor desmarcou a Bia; depois disso o Caio fez check-in
  const presentes = presentesDaChamada({ checkins: ['ana', 'bia', 'caio'], marcadosAMao: new Set(['davi']), desmarcadosAMao: new Set(['bia']) });
  assert.deepEqual([...presentes].sort(), ['ana', 'caio', 'davi']);
});

test('AN-3: marcar de novo quem foi desmarcado volta a contar', () => {
  const presentes = presentesDaChamada({ checkins: ['ana'], marcadosAMao: new Set(['ana']), desmarcadosAMao: new Set() });
  assert.deepEqual([...presentes], ['ana']);
});
