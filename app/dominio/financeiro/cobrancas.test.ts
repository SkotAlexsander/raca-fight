import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { cobrancaDeExemplo } from './exemplo.ts';
import {
  calcularEncargos, cancelarCobranca, desfazerPagamento, listarInadimplentes, marcarComoPaga, situacaoDaCobranca,
  taxaDeInadimplencia, validarRegraDeAtraso,
} from './cobrancas.ts';

const EM = '2026-10-15T10:00:00-03:00';
const c = cobrancaDeExemplo({
  id: 'c1', pessoaId: 'carla', matriculaId: 'm-carla', vencimento: '2026-10-05', valorCentavos: 22000,
  reparticao: [{ modalidadeId: 'muay-thai', centavos: 11000 }, { modalidadeId: 'jiu-jitsu', centavos: 11000 }],
});

describe('situação da cobrança é calculada, nunca digitada', () => {
  test('a vencer, vence hoje, atrasada, paga, cancelada', () => {
    assert.deepEqual(situacaoDaCobranca(c, '2026-10-04'), { estado: 'a_vencer', diasDeAtraso: 0 });
    assert.deepEqual(situacaoDaCobranca(c, '2026-10-05'), { estado: 'vence_hoje', diasDeAtraso: 0 });
    assert.deepEqual(situacaoDaCobranca(c, '2026-11-04'), { estado: 'atrasada', diasDeAtraso: 30 });
    assert.equal(situacaoDaCobranca({ ...c, estado: 'paga', pagaEm: '2026-10-20' }, '2026-11-04').estado, 'paga');
    assert.equal(situacaoDaCobranca({ ...c, estado: 'cancelada' }, '2026-11-04').estado, 'cancelada');
  });
});

describe('multa e juros (só se a academia usar: a regra é [decidir])', () => {
  test('sem regra, sem encargo', () => {
    assert.deepEqual(calcularEncargos(22000, '2026-10-05', '2026-11-04', null), { multaCentavos: 0, jurosCentavos: 0, totalCentavos: 0, diasDeAtraso: 30 });
  });

  test('2 % de multa uma vez + 1 % ao mês pró-rata dia', () => {
    const regra = { multaPontosBase: 200, jurosAoMesPontosBase: 100, diasDeTolerancia: 0 };
    assert.deepEqual(calcularEncargos(22000, '2026-10-05', '2026-11-04', regra), { multaCentavos: 440, jurosCentavos: 220, totalCentavos: 660, diasDeAtraso: 30 });
    assert.deepEqual(calcularEncargos(22000, '2026-10-05', '2026-10-08', regra), { multaCentavos: 440, jurosCentavos: 22, totalCentavos: 462, diasDeAtraso: 3 });
    assert.equal(calcularEncargos(22000, '2026-10-05', '2026-10-05', regra).totalCentavos, 0);
  });

  test('tolerância: dentro dela, nada; depois, conta desde o vencimento', () => {
    const regra = { multaPontosBase: 200, jurosAoMesPontosBase: 100, diasDeTolerancia: 5 };
    assert.equal(calcularEncargos(22000, '2026-10-05', '2026-10-10', regra).totalCentavos, 0);
    assert.equal(calcularEncargos(22000, '2026-10-05', '2026-10-11', regra).jurosCentavos, 44, '6 dias');
  });

  test('regra acima do que a lei permite é recusada com o motivo', () => {
    assert.deepEqual(validarRegraDeAtraso({ multaPontosBase: 200, jurosAoMesPontosBase: 100, diasDeTolerancia: 3 }), []);
    const erros = validarRegraDeAtraso({ multaPontosBase: 1000, jurosAoMesPontosBase: 300, diasDeTolerancia: -1 });
    assert.equal(erros.length, 3);
    assert.match(erros[0], /2 %/);
  });
});

describe('marcar como paga cria a linha da planilha', () => {
  const gerarId = () => 'l1';
  test('pagamento cheio: cobrança paga + lançamento de entrada com a repartição', () => {
    const r = marcarComoPaga(c, { data: '2026-10-06', forma: 'pix', categoriaId: 'mensalidades', porId: 'dono', em: EM, gerarId });
    assert.equal(r.cobranca.estado, 'paga');
    assert.equal(r.cobranca.lancamentoId, 'l1');
    assert.equal(r.lancamento.tipo, 'entrada');
    assert.equal(r.lancamento.valorCentavos, 22000);
    assert.equal(r.lancamento.origem, 'mensalidade');
    assert.equal(r.lancamento.cobrancaId, 'c1');
    assert.equal(r.lancamento.pessoaId, 'carla');
    assert.equal(r.lancamento.data, '2026-10-06');
    assert.deepEqual(r.lancamento.reparticao, c.reparticao);
  });

  test('pagou com multa: a repartição acompanha o valor pago', () => {
    const r = marcarComoPaga(c, { data: '2026-11-04', forma: 'dinheiro', valorPagoCentavos: 22660, categoriaId: 'mensalidades', porId: 'dono', em: EM, gerarId });
    assert.deepEqual(r.lancamento.reparticao!.map((p) => p.centavos), [11330, 11330]);
  });

  test('pagamento menor que o devido é recusado (parcial é [decidir])', () => {
    assert.throws(() => marcarComoPaga(c, { data: '2026-10-06', forma: 'pix', valorPagoCentavos: 10000, porId: 'dono', em: EM, gerarId }), /parcial/);
  });

  test('não paga duas vezes nem paga cancelada; desfazer e cancelar', () => {
    const paga = marcarComoPaga(c, { data: '2026-10-06', forma: 'pix', porId: 'dono', em: EM, gerarId }).cobranca;
    assert.throws(() => marcarComoPaga(paga, { data: '2026-10-06', forma: 'pix', porId: 'dono', em: EM, gerarId }), /já está paga/);
    const desfeita = desfazerPagamento(paga);
    assert.equal(desfeita.cobranca.estado, 'aberta');
    assert.equal(desfeita.cobranca.pagaEm, undefined);
    assert.equal(desfeita.lancamentoParaArquivar, 'l1');
    assert.throws(() => cancelarCobranca(paga), /paga/);
    const cancelada = cancelarCobranca(c);
    assert.throws(() => marcarComoPaga(cancelada, { data: '2026-10-06', forma: 'pix', porId: 'dono', em: EM, gerarId }), /cancelada/);
  });
});

describe('inadimplência', () => {
  const cobrancas = [
    c,
    cobrancaDeExemplo({ id: 'c2', pessoaId: 'carla', vencimento: '2026-09-05', valorCentavos: 22000 }),
    cobrancaDeExemplo({ id: 'c3', pessoaId: 'bruno', vencimento: '2026-10-10', valorCentavos: 15000 }),
    cobrancaDeExemplo({ id: 'c4', pessoaId: 'fernanda', vencimento: '2026-10-10', valorCentavos: 11000, estado: 'paga', pagaEm: '2026-10-09' }),
    cobrancaDeExemplo({ id: 'c5', pessoaId: 'otavio', vencimento: '2026-10-20', valorCentavos: 12000 }),
  ];

  test('agrupa por quem deve, com o atraso mais antigo, do maior atraso para o menor', () => {
    const r = listarInadimplentes(cobrancas, '2026-10-15');
    assert.deepEqual(r.map((i) => [i.pessoaId, i.totalCentavos, i.diasDoAtrasoMaisAntigo, i.cobrancaIds.length]), [
      ['carla', 44000, 40, 2],
      ['bruno', 15000, 5, 1],
    ]);
  });

  test('"há mais de N dias"', () => {
    assert.deepEqual(listarInadimplentes(cobrancas, '2026-10-15', { haMaisDeDias: 30 }).map((i) => i.pessoaId), ['carla']);
  });

  test('taxa do mês: o que venceu no mês e não foi pago, sobre o que venceu', () => {
    assert.deepEqual(taxaDeInadimplencia(cobrancas, '2026-10', '2026-10-15'), { vencidoCentavos: 48000, emAtrasoCentavos: 37000, pontosBase: 7708 });
    assert.deepEqual(taxaDeInadimplencia([], '2026-10', '2026-10-15'), { vencidoCentavos: 0, emAtrasoCentavos: 0, pontosBase: 0 });
  });
});
