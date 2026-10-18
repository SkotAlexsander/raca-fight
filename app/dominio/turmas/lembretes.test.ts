import { test } from 'node:test';
import assert from 'node:assert/strict';
import { msNoFuso } from './horario.ts';
import { aulasDoDia, cancelarAula } from './turmas.ts';
import { gradeDaRacaFight } from './grade-raca-fight.ts';
import { lembretesDeAula } from './lembretes.ts';
import { PREFERENCIAS_PADRAO } from '../avisos.ts';

const FUSO = 'America/Sao_Paulo';
const grade = gradeDaRacaFight({ academiaId: 'raca-fight', professores: { muayThai: 'd', boxe: 'r', jiuJitsu: 'm', mma: 'm', muayThaiKids: 'd', jiuJitsuKids: 'm' }, duracaoDaAulaMinutos: 60 });

test('o lembrete de aula nasce desligado (R22.4)', () => {
  assert.deepEqual(PREFERENCIAS_PADRAO.lembreteDeAula, { ligado: false, antecedenciaMinutos: 60, turmaIds: [] });
});

test('um lembrete por aula da turma escolhida, com a antecedência, sem nome de ninguém', () => {
  const l = lembretesDeAula({ turmas: grade, turmaIds: ['muay-thai-noite-1'], antecedenciaMinutos: 60, agoraMs: msNoFuso('2026-10-12', '08:00', FUSO), fuso: FUSO, dias: 6 });
  // segunda a quinta da semana: 4 aulas às 20h → lembretes às 19h
  assert.equal(l.length, 4);
  assert.equal(l[0]!.instanteMs, msNoFuso('2026-10-12', '19:00', FUSO));
  assert.equal(l[0]!.texto, 'Aula às 20:00, daqui a 1 h.');
  assert.equal(l[0]!.titulo, 'Muay Thai — noite 1');
  const dePedro = lembretesDeAula({ turmas: grade, turmaIds: ['jiu-jitsu-kids'], antecedenciaMinutos: 30, agoraMs: msNoFuso('2026-10-12', '08:00', FUSO), fuso: FUSO, dias: 1, deQuem: 'do Pedro' });
  assert.equal(dePedro[0]!.texto, 'Aula do Pedro às 19:00, daqui a 30 min.');
});

test('aula cancelada não lembra; o que cairia no silêncio é descartado, nunca movido', () => {
  const aula = aulasDoDia(grade, '2026-10-12', FUSO).find((a) => a.turmaId === 'muay-thai-noite-1')!;
  const ajuste = cancelarAula(aula, 'feriado', 'd', msNoFuso('2026-10-12', '08:00', FUSO), 'x');
  const l = lembretesDeAula({ turmas: grade, turmaIds: ['muay-thai-noite-1'], antecedenciaMinutos: 60, agoraMs: msNoFuso('2026-10-12', '08:00', FUSO), fuso: FUSO, dias: 0, ajustes: [ajuste] });
  assert.equal(l.length, 0);
  // a aula das 9h com 2 h de antecedência cairia às 7h: ainda fora do silêncio
  const manha = lembretesDeAula({ turmas: grade, turmaIds: ['muay-thai-manha'], antecedenciaMinutos: 120, agoraMs: msNoFuso('2026-10-11', '20:00', FUSO), fuso: FUSO, dias: 1 });
  assert.equal(manha.length, 1);
  // a das 9h com a antecedência maior que o permitido (se fosse 3 h, cairia às 6h, no silêncio)
  const cedo = lembretesDeAula({ turmas: grade, turmaIds: ['muay-thai-manha'], antecedenciaMinutos: 180, agoraMs: msNoFuso('2026-10-11', '20:00', FUSO), fuso: FUSO, dias: 1 });
  assert.equal(cedo.length, 0);
});

test('no máximo 3 lembretes locais por dia (R10.6)', () => {
  const l = lembretesDeAula({ turmas: grade, turmaIds: ['muay-thai-manha', 'jiu-jitsu-kids', 'muay-thai-noite-1', 'muay-thai-noite-2'], antecedenciaMinutos: 30, agoraMs: msNoFuso('2026-10-12', '06:00', FUSO), fuso: FUSO, dias: 0 });
  assert.equal(l.length, 3);
});
