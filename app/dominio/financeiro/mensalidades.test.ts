import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { MATRICULAS, PLANOS, cobrancaDeExemplo } from './exemplo.ts';
import {
  calcularDesconto, descontosDaIndicacao, gerarMensalidadesDoMes, repartirPorModalidade, sugerirDescontoFamilia,
} from './mensalidades.ts';
import type { Cobranca, Matricula } from './tipos.ts';

let n = 0;
const gerarId = () => `c${++n}`;
const EM = '2026-10-01T08:00:00-03:00';
const plano = (id: string) => PLANOS.find((p) => p.id === id)!;
const base = (m: Partial<Matricula> & Pick<Matricula, 'id' | 'planoId' | 'inicio'>): Matricula => ({
  academiaId: 'raca-fight', pessoaId: 'p', pagadorPessoaId: 'p', estado: 'ativa', diaDeVencimento: 10, descontos: [], ...m,
});

describe('repartir o valor entre as modalidades (combo)', () => {
  test('partes iguais sem peso; com peso, proporcional; soma sempre fecha', () => {
    assert.deepEqual(repartirPorModalidade(22000, plano('combo-2')), [
      { modalidadeId: 'muay-thai', centavos: 11000 }, { modalidadeId: 'jiu-jitsu', centavos: 11000 },
    ]);
    const comPeso = { ...plano('combo-2'), pesos: { 'muay-thai': 2, 'jiu-jitsu': 1 } };
    assert.deepEqual(repartirPorModalidade(22001, comPeso).map((p) => p.centavos), [14667, 7334]);
    assert.deepEqual(repartirPorModalidade(15000, plano('muay-thai-livre')), [{ modalidadeId: 'muay-thai', centavos: 15000 }]);
  });
});

describe('descontos (família, bolsista, atleta, indicação)', () => {
  test('somam, valem até a data e nunca passam do valor', () => {
    const r = calcularDesconto(11000, [
      { tipo: 'percentual', pontosBase: 1000, motivo: 'familia' },
      { tipo: 'valor', centavos: 2000, motivo: 'indicacao', ate: '2026-10-31' },
    ], '2026-10-10');
    assert.deepEqual(r, { descontoCentavos: 3100, motivos: ['familia', 'indicacao'] });
    assert.equal(calcularDesconto(11000, [{ tipo: 'valor', centavos: 2000, motivo: 'indicacao', ate: '2026-10-31' }], '2026-11-10').descontoCentavos, 0, 'venceu');
    assert.equal(calcularDesconto(11000, [{ tipo: 'valor', centavos: 50000, motivo: 'bolsista' }], '2026-10-10').descontoCentavos, 11000);
  });

  test('"Traga um amiguinho": os dois ganham, e cada desconto diz de onde veio', () => {
    const indicador = base({ id: 'm-ana', pessoaId: 'ana', planoId: 'muay-thai-livre', inicio: '2026-01-01' });
    const novo = base({ id: 'm-leo', pessoaId: 'leo', planoId: 'muay-thai-livre', inicio: '2026-10-15' });
    const r = descontosDaIndicacao({
      indicador, novo, desconto: { tipo: 'valor', centavos: 3000 }, ate: '2026-11-30', interessadoId: 'int-leo',
    });
    assert.deepEqual(r.indicador.descontos, [{ tipo: 'valor', centavos: 3000, motivo: 'indicacao', ate: '2026-11-30', origemPessoaId: 'leo', origemInteressadoId: 'int-leo' }]);
    assert.equal(r.novo.descontos[0].origemPessoaId, 'ana');
    assert.equal(indicador.descontos.length, 0, 'não muda a entrada');
    assert.throws(() => descontosDaIndicacao({ indicador, novo: indicador, desconto: { tipo: 'valor', centavos: 1 }, ate: '2026-11-30' }), /mesma pessoa/);
  });

  test('família: quem paga mais de uma matrícula ativa sem desconto de família aparece como sugestão', () => {
    const s = sugerirDescontoFamilia(MATRICULAS);
    assert.deepEqual(s, [{ pagadorPessoaId: 'fernanda', matriculaIds: ['m-davi', 'm-elisa'], semDescontoDeFamilia: ['m-davi'] }]);
  });
});

describe('gerar as mensalidades do mês', () => {
  const gerar = (matriculas: Matricula[], competencia = '2026-10', extra: Partial<Parameters<typeof gerarMensalidadesDoMes>[0]> = {}) =>
    gerarMensalidadesDoMes({ competencia, matriculas, planos: PLANOS, existentes: [], primeiroMes: 'cheio', gerarId, em: EM, ...extra });

  test('a academia de exemplo em outubro: trancado e isento ficam de fora, Kids cobra a responsável', () => {
    const r = gerar(MATRICULAS);
    const porMatricula: Record<string, Cobranca> = Object.fromEntries(r.novas.map((c) => [c.matriculaId, c]));
    assert.equal(r.novas.length, 4);
    assert.equal(porMatricula['m-bruno'].valorCentavos, 15000);
    assert.equal(porMatricula['m-bruno'].vencimento, '2026-10-10');
    assert.equal(porMatricula['m-carla'].vencimento, '2026-10-05');
    assert.deepEqual(porMatricula['m-carla'].reparticao.map((p) => p.centavos), [11000, 11000]);
    assert.equal(porMatricula['m-davi'].pessoaId, 'fernanda', 'quem deve é a responsável');
    assert.equal(porMatricula['m-davi'].alunoPessoaId, 'davi');
    assert.equal(porMatricula['m-elisa'].valorCentavos, 9900, '10 % de família');
    assert.equal(porMatricula['m-elisa'].descontoCentavos, 1100);
    assert.deepEqual(
      r.puladas.map((p) => [p.matriculaId, p.motivo]).sort(),
      [['m-helena', 'isenta'], ['m-otavio', 'trancada']],
    );
  });

  test('é idempotente: rodar duas vezes não duplica, nem a que o dono cancelou', () => {
    const primeira = gerar(MATRICULAS);
    const cancelada = { ...primeira.novas[0], estado: 'cancelada' as const };
    const segunda = gerar(MATRICULAS, '2026-10', { existentes: [cancelada, ...primeira.novas.slice(1)] });
    assert.equal(segunda.novas.length, 0);
    assert.ok(segunda.puladas.filter((p) => p.motivo === 'ja_existe').length === 4);
  });

  test('vencimento no dia 31 encurta em fevereiro', () => {
    const r = gerar([base({ id: 'm', planoId: 'muay-thai-livre', inicio: '2026-01-01', diaDeVencimento: 31 })], '2026-02');
    assert.equal(r.novas[0].vencimento, '2026-02-28');
  });

  test('primeiro mês: as três regras [decidir] dão resultados diferentes', () => {
    const m = base({ id: 'm', planoId: 'muay-thai-livre', inicio: '2026-10-21', diaDeVencimento: 10, isentarTaxaDeMatricula: true });
    const cheio = gerar([m], '2026-10', { primeiroMes: 'cheio' }).novas[0];
    assert.equal(cheio.valorCentavos, 15000);
    assert.equal(cheio.vencimento, '2026-10-21', 'não vence antes de começar');
    const prop = gerar([m], '2026-10', { primeiroMes: 'proporcional' }).novas[0];
    assert.equal(prop.valorCentavos, 5323, '11 de 31 dias');
    const proximo = gerar([m], '2026-10', { primeiroMes: 'a_partir_do_proximo' });
    assert.equal(proximo.novas.length, 0);
    assert.equal(proximo.puladas[0].motivo, 'primeiro_mes');
    assert.equal(gerar([m], '2026-11', { primeiroMes: 'a_partir_do_proximo' }).novas[0].valorCentavos, 15000);
  });

  test('taxa de matrícula sai no primeiro mês, uma vez, como cobrança própria', () => {
    const m = base({ id: 'm', planoId: 'muay-thai-livre', inicio: '2026-10-01' });
    const out = gerar([m], '2026-10');
    assert.deepEqual(out.novas.map((c) => [c.tipo, c.valorCentavos]), [['mensalidade', 15000], ['matricula', 5000]]);
    assert.equal(gerar([m], '2026-11').novas.length, 1);
    assert.equal(gerar([m], '2026-10', { existentes: out.novas }).novas.length, 0);
  });

  test('trimestral cobra a cada 3 meses a partir do início; gratuito nunca cobra', () => {
    const m = base({ id: 'm', planoId: 'muay-thai-trimestral', inicio: '2026-09-01' });
    assert.equal(gerar([m], '2026-09').novas.length, 1);
    assert.equal(gerar([m], '2026-10').puladas[0].motivo, 'nao_e_mes_de_cobranca');
    assert.equal(gerar([m], '2026-12').novas[0].valorCentavos, 40500);
    const exp = base({ id: 'e', planoId: 'experimental', inicio: '2026-10-01' });
    assert.equal(gerar([exp]).puladas[0].motivo, 'gratuito');
  });

  test('encerrada, ainda não começou, plano que não existe', () => {
    const r = gerar([
      base({ id: 'enc', planoId: 'muay-thai-livre', inicio: '2026-01-01', fim: '2026-10-05', estado: 'encerrada' }),
      base({ id: 'fut', planoId: 'muay-thai-livre', inicio: '2026-11-03' }),
      base({ id: 'sem', planoId: 'nao-existe', inicio: '2026-01-01' }),
    ]);
    assert.deepEqual(r.puladas.map((p) => p.motivo), ['encerrada', 'fora_do_periodo', 'plano_inexistente']);
  });

  test('cobrança manual (graduação, evento) não bloqueia a mensalidade', () => {
    const m = base({ id: 'm', planoId: 'muay-thai-livre', inicio: '2026-01-01' });
    const exame = cobrancaDeExemplo({ id: 'x', pessoaId: 'p', matriculaId: 'm', tipo: 'graduacao', vencimento: '2026-10-10', valorCentavos: 8000 });
    assert.equal(gerar([m], '2026-10', { existentes: [exame] }).novas.length, 1);
  });
});
