import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { cobrancaDeExemplo, lancamentoDeExemplo as l } from './exemplo.ts';
import { fecharMes, mesFechado, podeAlterarLancamento, pendenciasAntesDeFechar, reabrirMes } from './fechamento.ts';
import { descreverRegistro, diferencas, filtrarHistorico, registroDeMudanca } from './historico.ts';
import { validarLancamento } from './lancamentos.ts';

const lancs = [
  l({ id: 'a', data: '2026-09-05', tipo: 'entrada', valorCentavos: 22000, categoriaId: 'mensalidades' }),
  l({ id: 'b', data: '2026-09-10', tipo: 'saida', valorCentavos: 350000, categoriaId: 'aluguel' }),
  l({ id: 'c', data: '2026-09-20', tipo: 'saida', valorCentavos: 45000, situacao: 'pendente' }),
];

describe('validar uma linha da planilha', () => {
  test('aceita a linha certa e diz o que falta na errada', () => {
    assert.deepEqual(validarLancamento(lancs[0]), []);
    const erros = validarLancamento({ ...lancs[0], valorCentavos: -5, data: '2026-02-30', descricao: ' ' });
    assert.equal(erros.length, 3);
    assert.ok(erros.some((e) => /valor/.test(e)));
    assert.equal(validarLancamento({ ...lancs[0], descricao: 'x'.repeat(201) }).length, 1);
  });
});

describe('fechamento do mês', () => {
  test('antes de fechar, a lista do que está pendurado', () => {
    const cobrancas = [cobrancaDeExemplo({ id: 'k', pessoaId: 'p', vencimento: '2026-09-10', valorCentavos: 15000 })];
    assert.deepEqual(pendenciasAntesDeFechar('2026-09', lancs, cobrancas, '2026-10-02'), [
      { tipo: 'lancamento_pendente', quantidade: 1, centavos: 45000 },
      { tipo: 'sem_categoria', quantidade: 1, centavos: 45000 },
      { tipo: 'cobranca_em_aberto', quantidade: 1, centavos: 15000 },
    ]);
    assert.deepEqual(pendenciasAntesDeFechar('2026-10', [], [], '2026-10-15'), [{ tipo: 'mes_nao_terminou', quantidade: 0, centavos: 0 }]);
  });

  test('fecha com a foto dos números; mês fechado trava a linha (nos dois lados de uma mudança de data)', () => {
    const f = fecharMes({ competencia: '2026-09', lancamentos: lancs, cobrancas: [], porId: 'dono', em: '2026-10-02T10:00:00-03:00', id: 'f9', academiaId: 'raca-fight' });
    assert.equal(f.totais.resultado, -328000);
    assert.deepEqual(f.porCategoria.aluguel, { entradas: 0, saidas: 350000 });
    assert.equal(mesFechado('2026-09', [f]), true);
    assert.equal(mesFechado('2026-10', [f]), false);
    const nova = l({ id: 'n', data: '2026-10-01', tipo: 'entrada', valorCentavos: 1 });
    assert.equal(podeAlterarLancamento(undefined, nova, [f]).pode, true);
    assert.equal(podeAlterarLancamento(lancs[0], { ...lancs[0], valorCentavos: 1 }, [f]).pode, false);
    assert.equal(podeAlterarLancamento(nova, { ...nova, data: '2026-09-30' }, [f]).pode, false, 'mover para dentro do mês fechado');
    assert.throws(() => fecharMes({ competencia: '2026-09', lancamentos: lancs, cobrancas: [], porId: 'd', em: 'x', id: 'f', academiaId: 'a', fechamentos: [f] }), /já está fechado/);
  });

  test('reabrir exige motivo e destrava', () => {
    const f = fecharMes({ competencia: '2026-09', lancamentos: lancs, cobrancas: [], porId: 'dono', em: 'x', id: 'f9', academiaId: 'raca-fight' });
    assert.throws(() => reabrirMes(f, '  ', 'dono', 'y'), /motivo/);
    const r = reabrirMes(f, 'Faltou lançar a venda de luvas', 'dono', 'y');
    assert.equal(mesFechado('2026-09', [r]), false);
  });
});

describe('histórico de tudo (quem mudou o quê e quando)', () => {
  test('diferenças campo a campo, ignorando o carimbo de atualização', () => {
    const antes = lancs[0];
    const depois = { ...antes, valorCentavos: 24000, atualizadoEm: 'outro', reparticao: [{ modalidadeId: 'mt', centavos: 1 }] };
    assert.deepEqual(diferencas(antes, depois), [
      { campo: 'reparticao', de: undefined, para: [{ modalidadeId: 'mt', centavos: 1 }] },
      { campo: 'valorCentavos', de: 22000, para: 24000 },
    ]);
  });

  test('registro: criou, mudou, arquivou; sem mudança, nada', () => {
    const base = { tabela: 'lancamentos', academiaId: 'raca-fight', porId: 'dono', em: '2026-10-15T10:00:00-03:00', gerarId: () => 'h1' };
    assert.equal(registroDeMudanca({ ...base, antes: undefined, depois: lancs[0] })!.acao, 'criou');
    assert.equal(registroDeMudanca({ ...base, antes: lancs[0], depois: { ...lancs[0], arquivado: true } })!.acao, 'arquivou');
    const r = registroDeMudanca({ ...base, antes: lancs[0], depois: { ...lancs[0], valorCentavos: 24000 } })!;
    assert.equal(r.acao, 'mudou');
    assert.equal(r.registroId, 'a');
    assert.equal(registroDeMudanca({ ...base, antes: lancs[0], depois: { ...lancs[0] } }), null);
  });

  test('descrição para a tela, com dinheiro e data formatados', () => {
    const r = { id: 'h', academiaId: 'a', tabela: 'lancamentos', registroId: 'a', acao: 'mudou' as const, porId: 'dono', em: '2026-10-15T10:00:00-03:00',
      mudancas: [{ campo: 'valorCentavos', de: 22000, para: 24000 }, { campo: 'data', de: '2026-09-05', para: '2026-09-06' }, { campo: 'situacao', de: 'pendente', para: 'pago' }] };
    assert.deepEqual(descreverRegistro(r, { nomeDe: () => 'Alex' }), [
      'Alex mudou o lançamento em 15/10/2026 às 10:00',
      'Valor: R$ 220,00 → R$ 240,00',
      'Data: 05/09/2026 → 06/09/2026',
      'Situação: pendente → pago',
    ]);
  });

  test('filtro do histórico: por registro, por pessoa, por período; mais novo primeiro', () => {
    const h = (id: string, em: string, porId = 'dono', registroId = 'a') => ({ id, academiaId: 'x', tabela: 'lancamentos', registroId, acao: 'mudou' as const, mudancas: [], porId, em });
    const lista = [h('1', '2026-10-01T10:00:00-03:00'), h('2', '2026-10-03T10:00:00-03:00', 'igor'), h('3', '2026-10-02T10:00:00-03:00', 'dono', 'b')];
    assert.deepEqual(filtrarHistorico(lista, {}).map((r) => r.id), ['2', '3', '1']);
    assert.deepEqual(filtrarHistorico(lista, { registroId: 'a' }).map((r) => r.id), ['2', '1']);
    assert.deepEqual(filtrarHistorico(lista, { porId: 'igor' }).map((r) => r.id), ['2']);
    assert.deepEqual(filtrarHistorico(lista, { de: '2026-10-02', ate: '2026-10-02' }).map((r) => r.id), ['3']);
  });
});
