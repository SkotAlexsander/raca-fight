/**
 * Revisão T — segurança (P10, 11/10/2026). Achados confirmados da auditoria
 * (`docs/revisao/T-CODIGO.md`, seção 3). Escritos antes da correção.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  calcularIdade,
  formatarAltura,
  formatarCircunferencia,
  formatarData,
  formatarPercentualDecimos,
  formatarPeso,
  lerDataBrasileira,
  metrosParaMilimetros,
  quilosParaGramas,
} from './unidades.ts';
import { enfileirar, registrarResultado } from './sincronizacao.ts';
import type { Presenca } from './presenca/presenca.ts';

/** A mensagem do erro lançado por `f`. */
function mensagem(f: () => unknown): string {
  try {
    f();
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error('não lançou');
}

describe('S1: erro do domínio não carrega dado de saúde (R6.2: nunca em mensagem de erro)', () => {
  test('peso, altura, medida e gordura inválidos: o valor não aparece na mensagem', () => {
    for (const [f, valor] of [
      [() => formatarPeso(-72450), '72450'],
      [() => formatarAltura(-1755), '1755'],
      [() => formatarCircunferencia(-825), '825'],
      [() => formatarPercentualDecimos(-185), '185'],
      [() => quilosParaGramas(-72.45), '72.45'],
      [() => metrosParaMilimetros(-1.75), '1.75'],
    ] as const) {
      const m = mensagem(f);
      assert.ok(!m.includes(valor), `"${m}" repete ${valor}`);
      assert.match(m, /negativo|zero ou mais/);
    }
  });

  test('data de nascimento: nem a digitada nem a calculada aparecem na mensagem', () => {
    const m1 = mensagem(() => calcularIdade('2030-05-17', '2026-10-11'));
    assert.ok(!m1.includes('2030-05-17'), m1);
    const m2 = mensagem(() => lerDataBrasileira('31/02/1990'));
    assert.ok(!m2.includes('31/02/1990'), m2);
    const m3 = mensagem(() => formatarData('1990-02-31'));
    assert.ok(!m3.includes('1990-02-31'), m3);
    assert.match(m2, /não existe no calendário/);
  });
});

describe('S2: o erro guardado na fila é só status e código, nunca o "details" do Postgres', () => {
  test('a linha recusada (com nome, aula, motivo) não vai para ultimoErro', () => {
    const carga = { id: 'a@2026-10-11|ana', academiaId: 'a', aulaId: 'a@2026-10-11', turmaId: 't', data: '2026-10-11', alunoId: 'ana', modalidadeId: 'muay-thai', origem: 'checkin', estado: 'pendente', registradaEm: '2026-10-11T19:41:00-03:00', registradaPorId: 'ana', atualizadaEm: '2026-10-11T19:41:00-03:00', atualizadaPorId: 'ana', pelaEquipe: false } as Presenca;
    const item = enfileirar({ id: 'f', tipo: 'checkin', usuarioId: 'ana', carga, criadoEm: '2026-10-11T06:30:00-03:00' });
    const erro = { status: 400, codigo: '23514', mensagem: 'new row violates check constraint', detalhe: 'Failing row contains (t, ana, 72450, dor no joelho)' };
    const r = registrarResultado(item, 'regra', erro);
    assert.equal(r.ultimoErro, '400 23514');
    assert.equal(registrarResultado(item, 'rede', {}).ultimoErro, 'sem resposta');
  });
});
