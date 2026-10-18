import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { DESPESAS_FIXAS, FUNCIONARIOS, cobrancaDeExemplo, lancamentoDeExemplo as l } from './exemplo.ts';
import { gerarDespesasFixasDoMes } from './despesas-fixas.ts';
import {
  compararPeriodos, evolucaoDoAno, previsaoDoMes, quantoEntrouPorModalidade, resultadoPorEvento, somarPor, totaisDoPeriodo,
} from './totais.ts';
import { calcularRemuneracaoDoMes } from './remuneracao.ts';

const OUT = { de: '2026-10-01', ate: '2026-10-31' };
const lancamentos = [
  l({ id: 'a', data: '2026-10-05', tipo: 'entrada', valorCentavos: 22000, categoriaId: 'mensalidades', formaDePagamento: 'pix', reparticao: [{ modalidadeId: 'muay-thai', centavos: 11000 }, { modalidadeId: 'jiu-jitsu', centavos: 11000 }] }),
  l({ id: 'b', data: '2026-10-10', tipo: 'entrada', valorCentavos: 15000, categoriaId: 'mensalidades', formaDePagamento: 'dinheiro', reparticao: [{ modalidadeId: 'muay-thai', centavos: 15000 }] }),
  l({ id: 'c', data: '2026-10-10', tipo: 'saida', valorCentavos: 350000, categoriaId: 'aluguel', formaDePagamento: 'pix', despesaFixaId: 'd-aluguel' }),
  l({ id: 'd', data: '2026-10-20', tipo: 'saida', valorCentavos: 45000, categoriaId: 'luz', situacao: 'pendente', despesaFixaId: 'd-luz' }),
  l({ id: 'e', data: '2026-10-22', tipo: 'entrada', valorCentavos: 30000, categoriaId: 'eventos-entrada', eventoId: 'ev-lomba' }),
  l({ id: 'f', data: '2026-10-23', tipo: 'saida', valorCentavos: 12000, categoriaId: 'eventos-saida', eventoId: 'ev-lomba' }),
  l({ id: 'g', data: '2026-09-10', tipo: 'entrada', valorCentavos: 40000, categoriaId: 'mensalidades' }),
  l({ id: 'h', data: '2026-10-11', tipo: 'entrada', valorCentavos: 99999, arquivado: true }),
];

describe('totais e resultado (regime de caixa: conta o que entrou e saiu de fato)', () => {
  test('o mês', () => {
    assert.deepEqual(totaisDoPeriodo(lancamentos, OUT), {
      entradas: 67000, saidas: 362000, resultado: -295000, entradasPendentes: 0, saidasPendentes: 45000, quantidade: 6,
    });
  });

  test('por categoria, por forma de pagamento', () => {
    const porCategoria = somarPor(lancamentos, OUT, (x) => x.categoriaId);
    assert.deepEqual(porCategoria.get('mensalidades'), { entradas: 37000, saidas: 0 });
    assert.deepEqual(porCategoria.get('luz'), undefined, 'pendente não entra no realizado');
    assert.deepEqual(somarPor(lancamentos, OUT, (x) => x.formaDePagamento).get('pix'), { entradas: 22000, saidas: 350000 });
  });

  test('quanto entrou por modalidade (o combo entra repartido)', () => {
    assert.deepEqual(Object.fromEntries(quantoEntrouPorModalidade(lancamentos, OUT)), { 'muay-thai': 26000, 'jiu-jitsu': 11000 });
  });

  test('resultado por evento', () => {
    assert.deepEqual(resultadoPorEvento(lancamentos).get('ev-lomba'), { entradas: 30000, saidas: 12000, resultado: 18000 });
  });

  test('comparação com o mês anterior', () => {
    const r = compararPeriodos(lancamentos, OUT, { de: '2026-09-01', ate: '2026-09-30' });
    assert.equal(r.entradas.diferenca, 27000);
    assert.equal(r.entradas.pontosBase, 6750);
    assert.equal(compararPeriodos([], OUT, OUT).entradas.pontosBase, null, 'sem base, sem percentual');
  });

  test('evolução de 12 meses', () => {
    const ev = evolucaoDoAno(lancamentos, '2026-10');
    assert.equal(ev.length, 12);
    assert.deepEqual(ev[0].competencia, '2025-11');
    assert.deepEqual(ev[10], { competencia: '2026-09', entradas: 40000, saidas: 0, resultado: 40000 });
    assert.equal(ev[11].resultado, -295000);
  });
});

describe('despesas fixas que se repetem todo mês', () => {
  let n = 0;
  const gerarId = () => `df${++n}`;
  test('gera pendentes no vencimento, idempotente; luz vem pela média e marcada como estimada', () => {
    const historico = [
      l({ id: 'luz1', data: '2026-07-20', tipo: 'saida', valorCentavos: 40000, despesaFixaId: 'd-luz' }),
      l({ id: 'luz2', data: '2026-08-20', tipo: 'saida', valorCentavos: 50000, despesaFixaId: 'd-luz' }),
      l({ id: 'luz3', data: '2026-09-20', tipo: 'saida', valorCentavos: 48000, despesaFixaId: 'd-luz' }),
    ];
    const r = gerarDespesasFixasDoMes({ competencia: '2026-10', despesas: DESPESAS_FIXAS, lancamentos: historico, porId: 'dono', em: 'x', gerarId });
    assert.equal(r.length, 4);
    const luz = r.find((x) => x.despesaFixaId === 'd-luz')!;
    assert.equal(luz.valorCentavos, 46000);
    assert.equal(luz.estimado, true);
    assert.equal(luz.situacao, 'pendente');
    assert.equal(luz.data, '2026-10-20');
    assert.equal(r.find((x) => x.despesaFixaId === 'd-aluguel')!.valorCentavos, 350000);
    assert.equal(gerarDespesasFixasDoMes({ competencia: '2026-10', despesas: DESPESAS_FIXAS, lancamentos: [...historico, ...r], porId: 'dono', em: 'x', gerarId }).length, 0);
  });

  test('fora do período ou desligada não gera', () => {
    const d = [{ ...DESPESAS_FIXAS[0], ate: '2026-09' }, { ...DESPESAS_FIXAS[2], ativa: false }];
    assert.equal(gerarDespesasFixasDoMes({ competencia: '2026-10', despesas: d, lancamentos: [], porId: 'd', em: 'x', gerarId }).length, 0);
  });
});

describe('previsão do mês', () => {
  test('o que já entrou + o que falta receber − o que já saiu − o que falta pagar', () => {
    const cobrancas = [
      cobrancaDeExemplo({ id: 'c1', pessoaId: 'p', vencimento: '2026-10-25', valorCentavos: 15000 }),
      cobrancaDeExemplo({ id: 'c2', pessoaId: 'q', vencimento: '2026-10-05', valorCentavos: 11000 }),
      cobrancaDeExemplo({ id: 'c3', pessoaId: 'r', vencimento: '2026-09-05', valorCentavos: 9000 }),
      cobrancaDeExemplo({ id: 'c4', pessoaId: 's', vencimento: '2026-10-05', valorCentavos: 22000, estado: 'paga', pagaEm: '2026-10-05' }),
    ];
    const p = previsaoDoMes({ competencia: '2026-10', hoje: '2026-10-15', cobrancas, lancamentos, despesasFixas: DESPESAS_FIXAS });
    assert.equal(p.jaEntrou, 67000);
    assert.equal(p.aReceberNoMes, 26000);
    assert.equal(p.atrasadoDeMesesAnteriores, 9000);
    assert.equal(p.jaSaiu, 362000);
    // a luz pendente (45000) + as fixas ainda sem linha no mês (internet e salário); o aluguel já foi pago (linha "c")
    assert.equal(p.aPagarNoMes, 45000 + 12000 + 160000);
    assert.equal(p.resultadoPrevisto, 67000 + 26000 - 362000 - (45000 + 12000 + 160000));
  });
});

describe('remuneração do mês (salário e comissão)', () => {
  test('comissão sobre o que entrou da modalidade dele; fixo + comissão; fixo', () => {
    const [gabriel, helena, igor] = FUNCIONARIOS;
    assert.deepEqual(calcularRemuneracaoDoMes(gabriel, lancamentos, '2026-10'), { fixoCentavos: 0, baseDaComissaoCentavos: 26000, comissaoCentavos: 10400, porAulaCentavos: 0, totalCentavos: 10400 });
    assert.equal(calcularRemuneracaoDoMes(helena, lancamentos, '2026-10').totalCentavos, 80000 + 2200);
    assert.equal(calcularRemuneracaoDoMes(igor, lancamentos, '2026-10').totalCentavos, 160000);
  });

  test('por aula precisa do número de aulas', () => {
    const f = { ...FUNCIONARIOS[0], remuneracao: { tipo: 'por_aula' as const, valorPorAulaCentavos: 5000 } };
    assert.equal(calcularRemuneracaoDoMes(f, [], '2026-10', { aulasDadas: 12 }).totalCentavos, 60000);
    assert.throws(() => calcularRemuneracaoDoMes(f, [], '2026-10'), /aulas/);
  });
});
