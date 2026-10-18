/**
 * Revisão T, segunda parte (P10, 11/10/2026): o domínio das regras novas da
 * seção 12 de `03-REGRAS.md`. Na virada de luta (P12, agente AM2) saíram as
 * partes de treino (R12.1, R12.2, R12.5); a fila com dono (R12.3) continua,
 * agora com a PRESENÇA (check-in e chamada, R15.9) no lugar do treino realizado.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  type ItemDaFila,
  classificarErroDeEnvio,
  donoDaCarga,
  enfileirar,
  itensParaEnviar,
  registrarResultado,
  resolverPresenca,
} from './sincronizacao.ts';
import type { Presenca } from './presenca/presenca.ts';
import { CHAVE_DO_AVISO, TIPOS_DE_AVISO, PREFERENCIAS_DA_EQUIPE_PADRAO } from './avisos.ts';

const presenca = (m: Partial<Presenca> = {}): Presenca => ({
  id: 'mt@2026-10-11|ana',
  academiaId: 'raca-fight',
  aulaId: 'mt@2026-10-11',
  turmaId: 'muay-thai-noite-1',
  data: '2026-10-11',
  alunoId: 'ana',
  modalidadeId: 'muay-thai',
  origem: 'checkin',
  estado: 'pendente',
  registradaEm: '2026-10-11T19:41:00-03:00',
  registradaPorId: 'ana',
  atualizadaEm: '2026-10-11T19:41:00-03:00',
  atualizadaPorId: 'ana',
  pelaEquipe: false,
  ...m,
});

// ---------------------------------------------------------------------------
describe('R12.3 — sessão vencida não perde presença (fila com dono)', () => {
  const checkinDaAna = presenca();
  const item = (m: Partial<ItemDaFila> = {}): ItemDaFila =>
    ({ ...enfileirar({ id: 'f1', tipo: 'checkin', usuarioId: 'ana', carga: checkinDaAna, criadoEm: '2026-10-11T06:30:00-03:00' }), ...m });

  test('cada item guarda a conta de quem registrou, e ela tem de ser a dona da última ação', () => {
    assert.equal(item().usuarioId, 'ana');
    assert.equal(item().estado, 'pendente');
    assert.throws(() => enfileirar({ id: 'f2', tipo: 'checkin', usuarioId: 'bia', carga: checkinDaAna, criadoEm: '2026-10-11T06:30:00-03:00' }), /dono/);
    assert.throws(() => enfileirar({ id: 'f3', tipo: 'checkin', usuarioId: '', carga: checkinDaAna, criadoEm: '2026-10-11T06:30:00-03:00' }), /usuarioId/);
    // a chamada é do professor que a fechou; o check-in do dependente, do responsável
    const chamada = presenca({ estado: 'confirmada', pelaEquipe: true, atualizadaPorId: 'diego' });
    assert.equal(donoDaCarga('chamada', chamada), 'diego');
    assert.equal(enfileirar({ id: 'f4', tipo: 'chamada', usuarioId: 'diego', carga: chamada, criadoEm: '2026-10-11T20:05:00-03:00' }).usuarioId, 'diego');
    const doDependente = presenca({ alunoId: 'pedro', registradaPorId: 'carla', atualizadaPorId: 'carla' });
    assert.equal(enfileirar({ id: 'f5', tipo: 'checkin', usuarioId: 'carla', carga: doDependente, criadoEm: '2026-10-11T18:45:00-03:00' }).usuarioId, 'carla');
  });

  test('sessão vencida ou ausente: nada sobe, nada se apaga, e o app pede para entrar', () => {
    const fila = [item()];
    for (const sessao of [null, { usuarioId: 'ana', valida: false }]) {
      const r = itensParaEnviar(fila, sessao);
      assert.deepEqual(r.enviar, []);
      assert.equal(r.precisaEntrar, true);
      assert.deepEqual(r.esperandoOutraConta, [{ usuarioId: 'ana', quantos: 1 }]);
    }
    assert.equal(fila.length, 1);
  });

  test('outra conta no mesmo aparelho: a fila da primeira não sobe na conta errada', () => {
    const fila = [item(), item({ id: 'f2', criadoEm: '2026-10-11T07:00:00-03:00' }), { ...item({ id: 'f3' }), usuarioId: 'bia' }];
    const r = itensParaEnviar(fila, { usuarioId: 'bia', valida: true });
    assert.deepEqual(r.enviar.map((i) => i.id), ['f3']);
    assert.deepEqual(r.esperandoOutraConta, [{ usuarioId: 'ana', quantos: 2 }]);
    assert.equal(r.precisaEntrar, false);
  });

  test('envia na ordem em que foi registrado, pelo instante; o que falhou de vez não reenvia', () => {
    const fila = [
      item({ id: 'b', criadoEm: '2026-10-11T07:00:00-03:00' }),
      item({ id: 'a', criadoEm: '2026-10-11T09:30:00Z' }), // 06:30 -03:00: antes do "b"
      item({ id: 'c', estado: 'falhou' }),
    ];
    assert.deepEqual(itensParaEnviar(fila, { usuarioId: 'ana', valida: true }).enviar.map((i) => i.id), ['a', 'b']);
  });

  test('recusa com sessão vencida ou de outra conta é "entrar de novo", nunca "falhou" (o bug da arquitetura)', () => {
    const doItem = item();
    // a RLS recusa (42501) porque o cliente caiu para anônimo quando o token venceu
    assert.equal(classificarErroDeEnvio({ status: 403, codigo: '42501' }, doItem, null), 'sessao');
    assert.equal(classificarErroDeEnvio({ status: 403, codigo: '42501' }, doItem, { usuarioId: 'bia', valida: true }), 'sessao');
    assert.equal(classificarErroDeEnvio({ status: 401, codigo: 'PGRST301' }, doItem, { usuarioId: 'ana', valida: true }), 'sessao');
    // só com a sessão certa a recusa é de regra
    assert.equal(classificarErroDeEnvio({ status: 403, codigo: '42501' }, doItem, { usuarioId: 'ana', valida: true }), 'regra');
    assert.equal(classificarErroDeEnvio({ status: 400, codigo: '23514' }, doItem, { usuarioId: 'ana', valida: true }), 'regra');
    for (const erro of [{}, { status: 0 }, { status: 503 }, { status: 408 }, { status: 429 }]) {
      assert.equal(classificarErroDeEnvio(erro, doItem, { usuarioId: 'ana', valida: true }), 'rede', JSON.stringify(erro));
    }
  });

  test('o resultado: sessão mantém o item como está; rede soma a tentativa; regra marca falhou; nada muda o recebido', () => {
    const i = item();
    assert.deepEqual(registrarResultado(i, 'sessao', { status: 401, codigo: 'PGRST301' }), i);
    const rede = registrarResultado(i, 'rede', { status: 503 });
    assert.equal(rede.tentativas, 1);
    assert.equal(rede.estado, 'pendente');
    assert.equal(registrarResultado(i, 'regra', { status: 400, codigo: '23514' }).estado, 'falhou');
    assert.equal(i.tentativas, 0);
  });

  test('R15.9: a mesma presença nos dois lados — a ação da equipe vence; entre iguais, a mais recente pelo instante', () => {
    const doAluno = presenca({ atualizadaEm: '2026-10-11T20:30:00-03:00' });
    const doProfessor = presenca({ estado: 'retirada', pelaEquipe: true, atualizadaPorId: 'diego', atualizadaEm: '2026-10-11T20:05:00-03:00' });
    assert.equal(resolverPresenca(doAluno, doProfessor), doProfessor);
    const local = presenca({ atualizadaEm: '2026-10-11T08:00:00-03:00' }); // 11:00 Z
    const remoto = presenca({ atualizadaEm: '2026-10-11T10:30:00Z' });
    assert.equal(resolverPresenca(local, remoto), local);
    assert.throws(() => resolverPresenca(local, { ...remoto, id: 'outro' }), /mesma presença/);
  });
});

// ---------------------------------------------------------------------------
describe('avisos novos do P10 (R12.11, R12.13)', () => {
  test('resumo da semana ao dono, com chave própria ligada; vínculo encerrado ao aluno, na chave da academia', () => {
    assert.ok(TIPOS_DE_AVISO.includes('resumo_da_semana'));
    assert.ok(TIPOS_DE_AVISO.includes('vinculo_encerrado'));
    assert.equal(CHAVE_DO_AVISO.resumo_da_semana, 'resumo_da_semana');
    assert.equal(CHAVE_DO_AVISO.vinculo_encerrado, 'academia');
    assert.equal(PREFERENCIAS_DA_EQUIPE_PADRAO.resumoDaSemana, true);
  });
});
