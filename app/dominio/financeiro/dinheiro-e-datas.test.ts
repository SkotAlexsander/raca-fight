import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  aplicarPontosBase, formatarDinheiro, formatarPontosBase, lerDinheiro, lerPontosBase, ratear, repartirPorPesos, somar,
} from './dinheiro.ts';
import {
  competenciaDe, dataNaCompetencia, diasEntre, diasNoMes, lerDataDaPlanilha, mesesEntre, nomeDaCompetencia,
  periodoDaCompetencia, periodoDoAno, periodoDoTrimestre, somarDias, somarMeses, ultimasCompetencias,
} from './datas.ts';

describe('dinheiro em centavos (adaptado do Valores)', () => {
  test('lê o que a planilha brasileira escreve', () => {
    assert.equal(lerDinheiro('R$ 1.234,56'), 123456);
    assert.equal(lerDinheiro('150'), 15000);
    assert.equal(lerDinheiro('150,5'), 15050);
    assert.equal(lerDinheiro('1.500'), 150000, 'ponto com 3 dígitos é milhar');
    assert.equal(lerDinheiro('89.90'), 8990, 'ponto com 2 dígitos é decimal (CSV de banco)');
    assert.equal(lerDinheiro('-89,90'), -8990);
    assert.equal(lerDinheiro('(89,90)'), -8990, 'parêntese de contador é negativo');
    assert.equal(lerDinheiro('R$ 120,00'), 12000, 'espaço duro do Excel');
    assert.equal(lerDinheiro('1.234.567,89'), 123456789);
  });

  test('número que veio do XLSX vira centavos sem erro de ponto flutuante', () => {
    assert.equal(lerDinheiro(89.9), 8990);
    assert.equal(lerDinheiro(0.1 + 0.2), 30);
    assert.equal(lerDinheiro(1500), 150000);
  });

  test('recusa o ambíguo em vez de adivinhar', () => {
    assert.equal(lerDinheiro('12,345'), null, 'três casas depois da vírgula');
    assert.equal(lerDinheiro('abc'), null);
    assert.equal(lerDinheiro(''), null);
    assert.equal(lerDinheiro(null), null);
    assert.equal(lerDinheiro(Number.NaN), null);
    assert.equal(lerDinheiro('99999999999999999999'), null, 'fora do inteiro seguro');
  });

  test('formata com milhar e sinal', () => {
    assert.equal(formatarDinheiro(123456), 'R$ 1.234,56');
    assert.equal(formatarDinheiro(5), 'R$ 0,05');
    assert.equal(formatarDinheiro(-8990), '−R$ 89,90');
    assert.equal(formatarDinheiro(150000, { semSimbolo: true }), '1.500,00');
    assert.throws(() => formatarDinheiro(1.5), RangeError);
  });

  test('pontos-base: percentual sem vírgula no dado', () => {
    assert.equal(aplicarPontosBase(15000, 1000), 1500, '10 % de R$ 150');
    assert.equal(aplicarPontosBase(70900, 200), 1418, '2 % de R$ 709');
    assert.equal(aplicarPontosBase(333, 5000), 167, 'meio para cima');
    assert.equal(lerPontosBase('10'), 1000);
    assert.equal(lerPontosBase('2,5 %'), 250);
    assert.equal(lerPontosBase('0,333'), null, 'mais de duas casas');
    assert.equal(formatarPontosBase(250), '2,5 %');
    assert.equal(formatarPontosBase(1000), '10 %');
  });

  test('ratear e repartir não perdem centavo', () => {
    assert.deepEqual(ratear(10000, 3), [3334, 3333, 3333]);
    assert.equal(somar(ratear(10001, 7)), 10001);
    assert.deepEqual(repartirPorPesos(25000, [1, 1]), [12500, 12500]);
    assert.deepEqual(repartirPorPesos(25000, [2, 1]), [16667, 8333]);
    assert.equal(somar(repartirPorPesos(9999, [3, 3, 1])), 9999);
    assert.throws(() => repartirPorPesos(100, [0, 0]), RangeError);
  });
});

describe('datas e competência (sem fuso: tudo em texto e UTC)', () => {
  test('competência', () => {
    assert.equal(competenciaDe('2026-10-15'), '2026-10');
    assert.equal(somarMeses('2026-11', 3), '2027-02');
    assert.equal(somarMeses('2026-01', -1), '2025-12');
    assert.equal(mesesEntre('2026-10', '2027-01'), 3);
    assert.equal(diasNoMes('2028-02'), 29);
    assert.equal(dataNaCompetencia('2026-02', 31), '2026-02-28', '31 encurta');
    assert.equal(dataNaCompetencia('2026-04', 31), '2026-04-30');
    assert.equal(nomeDaCompetencia('2026-10'), 'outubro de 2026');
    assert.deepEqual(ultimasCompetencias('2026-02', 3), ['2025-12', '2026-01', '2026-02']);
  });

  test('dias', () => {
    assert.equal(somarDias('2026-12-31', 1), '2027-01-01');
    assert.equal(diasEntre('2026-10-01', '2026-10-31'), 30);
    assert.equal(diasEntre('2026-10-31', '2026-10-01'), -30);
  });

  test('períodos para o filtro: mês, trimestre, ano', () => {
    assert.deepEqual(periodoDaCompetencia('2026-02'), { de: '2026-02-01', ate: '2026-02-28' });
    assert.deepEqual(periodoDoTrimestre('2026-10-15'), { de: '2026-10-01', ate: '2026-12-31' });
    assert.deepEqual(periodoDoTrimestre('2026-02-01'), { de: '2026-01-01', ate: '2026-03-31' });
    assert.deepEqual(periodoDoAno('2026-05-05'), { de: '2026-01-01', ate: '2026-12-31' });
  });

  test('data da planilha: dd/mm/aaaa, d/m/aa, ISO e número de série do Excel', () => {
    assert.equal(lerDataDaPlanilha('05/10/2026'), '2026-10-05');
    assert.equal(lerDataDaPlanilha('5/10/26'), '2026-10-05');
    assert.equal(lerDataDaPlanilha('2026-10-05'), '2026-10-05');
    assert.equal(lerDataDaPlanilha(46300), '2026-10-05', 'série do Excel (dias desde 30/12/1899)');
    assert.equal(lerDataDaPlanilha('46300'), '2026-10-05');
    assert.equal(lerDataDaPlanilha('31/02/2026'), null, 'não existe');
    assert.equal(lerDataDaPlanilha('10/2026'), null, 'sem dia não é data');
    assert.equal(lerDataDaPlanilha(''), null);
    assert.equal(lerDataDaPlanilha('12,50'), null);
  });
});
