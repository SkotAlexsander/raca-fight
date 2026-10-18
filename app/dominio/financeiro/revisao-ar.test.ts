/**
 * Os três problemas que o AR achou no domínio ao montar o PDF do admin
 * (`docs/revisao/AR-PDF-ADMIN.md`, seção 5) e o AK repetiu para o AM
 * (`docs/revisao/AK-ADMIN-TELAS.md`, seção 4). Escrito ANTES da correção
 * (agente AM1, 15/10/2026).
 *
 * 1. O painel comparava outubro até o dia 15 com setembro inteiro ("−30,94 %").
 * 2. O histórico dizia "fechou o fechamento" e mostrava nome de campo cru.
 * 3. A mensalidade saía "Boxe 2× — 2026-10".
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { CATEGORIAS, DESPESAS_FIXAS, FUNCIONARIOS, MATRICULAS, PESSOAS, PLANOS, lancamentoDeExemplo as l } from './exemplo.ts';
import { mesmoPeriodoDoMesAnterior, nomeDoMesComAno, periodoAteODia } from './datas.ts';
import { fecharMes, podeAlterarLancamento } from './fechamento.ts';
import { descreverRegistro } from './historico.ts';
import { gerarMensalidadesDoMes } from './mensalidades.ts';
import { resumoDoPainel } from './painel.ts';
import type { RegistroDoHistorico } from './tipos.ts';

const painel = (lancamentos: ReturnType<typeof l>[], competencia: string, hoje: string) =>
  resumoDoPainel({
    pessoas: PESSOAS, matriculas: MATRICULAS, planos: PLANOS, cobrancas: [], funcionarios: FUNCIONARIOS, lancamentos,
    despesasFixas: DESPESAS_FIXAS, categorias: CATEGORIAS, interessados: [], experimentais: [], lembretes: [], tarefas: [],
    competencia, hoje,
  });

describe('AR 1 — o painel compara o mesmo período, e o mês anterior fechado vem à parte', () => {
  test('os períodos: 1 a N do mês, e 1 a N do anterior (o dia que não existe encurta)', () => {
    assert.deepEqual(periodoAteODia('2026-10', '2026-10-15'), { de: '2026-10-01', ate: '2026-10-15' });
    assert.deepEqual(periodoAteODia('2026-09', '2026-10-15'), { de: '2026-09-01', ate: '2026-09-30' }, 'mês que já passou: inteiro');
    assert.deepEqual(periodoAteODia('2026-11', '2026-10-15'), { de: '2026-11-01', ate: '2026-11-01' }, 'mês que não começou: o dia 1');
    assert.deepEqual(mesmoPeriodoDoMesAnterior({ de: '2026-10-01', ate: '2026-10-15' }), { de: '2026-09-01', ate: '2026-09-15' });
    assert.deepEqual(mesmoPeriodoDoMesAnterior({ de: '2026-03-01', ate: '2026-03-31' }), { de: '2026-02-01', ate: '2026-02-28' });
    assert.deepEqual(mesmoPeriodoDoMesAnterior({ de: '2026-10-01', ate: '2026-10-31' }), { de: '2026-09-01', ate: '2026-09-30' });
  });

  test('no dia 15, o dia 20 do mês anterior fica fora da comparação, mas entra no mês anterior fechado', () => {
    const lancamentos = [
      l({ id: 'out', data: '2026-10-05', tipo: 'entrada', valorCentavos: 22000 }),
      l({ id: 'set-cedo', data: '2026-09-10', tipo: 'entrada', valorCentavos: 20000 }),
      l({ id: 'set-tarde', data: '2026-09-20', tipo: 'entrada', valorCentavos: 100000 }),
      l({ id: 'set-saida', data: '2026-09-25', tipo: 'saida', valorCentavos: 30000 }),
    ];
    const p = painel(lancamentos, '2026-10', '2026-10-15');
    assert.deepEqual(p.comparacao.periodoAtual, { de: '2026-10-01', ate: '2026-10-15' });
    assert.deepEqual(p.comparacao.periodoAnterior, { de: '2026-09-01', ate: '2026-09-15' });
    assert.equal(p.comparacao.entradas.anterior, 20000, 'só o que entrou de 1 a 15 de setembro');
    assert.equal(p.comparacao.entradas.diferenca, 2000);
    assert.equal(p.comparacao.entradas.pontosBase, 1000, '+10 %, não −80 %');
    assert.equal(p.comparacao.saidas.anterior, 0);
    assert.equal(p.comparacao.saidas.pontosBase, null, 'base zero: sem percentual');
    assert.equal(p.mesAnterior.competencia, '2026-09');
    assert.equal(p.mesAnterior.totais.entradas, 120000, 'setembro inteiro');
    assert.equal(p.mesAnterior.totais.resultado, 90000);
  });

  test('olhando um mês que já terminou, a comparação é mês inteiro contra mês inteiro', () => {
    const lancamentos = [
      l({ id: 'a', data: '2026-09-30', tipo: 'entrada', valorCentavos: 10000 }),
      l({ id: 'b', data: '2026-08-31', tipo: 'entrada', valorCentavos: 5000 }),
    ];
    const p = painel(lancamentos, '2026-09', '2026-10-15');
    assert.deepEqual(p.comparacao.periodoAtual, { de: '2026-09-01', ate: '2026-09-30' });
    assert.deepEqual(p.comparacao.periodoAnterior, { de: '2026-08-01', ate: '2026-08-31' }, 'mês inteiro contra mês inteiro, mesmo com 30 e 31 dias');
    assert.equal(p.comparacao.entradas.anterior, 5000);
    assert.equal(p.comparacao.entradas.pontosBase, 10000);
    assert.equal(p.mesAnterior.totais.entradas, 5000);
    assert.deepEqual(mesmoPeriodoDoMesAnterior({ de: '2026-10-01', ate: '2026-10-30' }), { de: '2026-09-01', ate: '2026-09-30' }, 'dia 30 de outubro: setembro até o 30, que é o mês todo');
  });
});

describe('AR 2 — o histórico em frase humana', () => {
  const base = { id: 'h', academiaId: 'a', porId: 'dono', em: '2026-10-03T18:12:00-03:00' } as const;
  const nomeDe = (id: string) => ({ dono: 'Alex', fernanda: 'Fernanda Lima', l1: 'Mensalidade — Davi' } as Record<string, string>)[id] ?? id;

  test('fechar e reabrir dizem o mês, nunca "fechou o fechamento"', () => {
    const fechou: RegistroDoHistorico = { ...base, tabela: 'fechamentos', registroId: 'f9', acao: 'fechou', mudancas: [{ campo: 'competencia', de: undefined, para: '2026-09' }] };
    const linhas = descreverRegistro(fechou, { nomeDe });
    assert.equal(linhas[0], 'Alex fechou setembro de 2026 em 03/10/2026 às 18:12');
    assert.equal(linhas.length, 1, 'a foto dos números não vira lista de campos');
    const reabriu: RegistroDoHistorico = { ...base, tabela: 'fechamentos', registroId: 'f9', acao: 'reabriu', motivo: 'Faltou a venda de luvas', mudancas: [{ campo: 'reabertoEm', de: undefined, para: '2026-10-04T09:00:00-03:00' }] };
    assert.deepEqual(descreverRegistro(reabriu, { nomeDe, competenciaDe: () => '2026-09' }), [
      'Alex reabriu setembro de 2026 em 03/10/2026 às 18:12',
      'Motivo: Faltou a venda de luvas',
    ]);
    const criouFechamento: RegistroDoHistorico = { ...base, tabela: 'fechamentos', registroId: 'f9', acao: 'criou', mudancas: [{ campo: 'competencia', de: undefined, para: '2026-09' }, { campo: 'totais', de: undefined, para: { entradas: 1 } }] };
    assert.equal(descreverRegistro(criouFechamento, { nomeDe })[0], 'Alex fechou setembro de 2026 em 03/10/2026 às 18:12', 'o gatilho grava "criou" no insert; a frase é a mesma');
  });

  test('nenhum nome interno de campo nem valor de código aparece', () => {
    const r: RegistroDoHistorico = {
      ...base, tabela: 'matriculas', registroId: 'm1', acao: 'mudou',
      mudancas: [
        { campo: 'trancadaAte', de: undefined, para: '2026-11-30' },
        { campo: 'trancadaDe', de: undefined, para: '2026-10-01' },
        { campo: 'diaDeVencimento', de: 10, para: 15 },
        { campo: 'pagadorPessoaId', de: 'dono', para: 'fernanda' },
        { campo: 'estado', de: 'ativa', para: 'trancada' },
        { campo: 'descontos', de: [], para: [{ tipo: 'percentual', pontosBase: 1000, motivo: 'familia' }] },
        { campo: 'isentarTaxaDeMatricula', de: undefined, para: true },
      ],
    };
    const linhas = descreverRegistro(r, { nomeDe });
    assert.deepEqual(linhas, [
      'Alex mudou a matrícula em 03/10/2026 às 18:12',
      'Trancada até: — → 30/11/2026',
      'Trancada desde: — → 01/10/2026',
      'Dia de vencimento: 10 → 15',
      'Quem paga: Alex → Fernanda Lima',
      'Estado: ativa → trancada',
      'Descontos: nenhum → família 10 %',
      'Isenta da taxa de matrícula: — → sim',
    ]);
    const cobranca: RegistroDoHistorico = {
      ...base, tabela: 'cobrancas', registroId: 'c1', acao: 'mudou',
      mudancas: [
        { campo: 'lancamentoId', de: undefined, para: 'l1' },
        { campo: 'valorPagoCentavos', de: undefined, para: 11000 },
        { campo: 'formaDePagamento', de: undefined, para: 'cartao_credito' },
        { campo: 'pagaEm', de: undefined, para: '2026-10-15' },
        { campo: 'algumCampoNovo', de: 'a_b', para: 'c_d' },
      ],
    };
    const l2 = descreverRegistro(cobranca, { nomeDe });
    assert.deepEqual(l2.slice(0, 5), [
      'Alex mudou a cobrança em 03/10/2026 às 18:12',
      'Lançamento: — → Mensalidade — Davi',
      'Valor pago: — → R$ 110,00',
      'Forma de pagamento: — → cartão de crédito',
      'Paga em: — → 15/10/2026',
    ]);
    for (const linha of [...linhas, ...l2]) {
      assert.doesNotMatch(linha, /[a-z][A-Z]/, `nome de campo cru em "${linha}"`);
      assert.doesNotMatch(linha, /_/, `valor de código cru em "${linha}"`);
    }
  });

  test('o registro diz qual coisa mudou, quando a tela sabe o nome', () => {
    const r: RegistroDoHistorico = { ...base, tabela: 'lancamentos', registroId: 'l1', acao: 'mudou', mudancas: [{ campo: 'valorCentavos', de: 22000, para: 24000 }] };
    assert.equal(descreverRegistro(r, { nomeDe, nomeDoRegistro: () => 'Aluguel da sala' })[0], 'Alex mudou o lançamento "Aluguel da sala" em 03/10/2026 às 18:12');
    const imp: RegistroDoHistorico = { ...base, tabela: 'importacoes', registroId: 'i1', acao: 'desfez_importacao', mudancas: [] };
    assert.equal(descreverRegistro(imp, { nomeDe, nomeDoRegistro: () => 'outubro.csv' })[0], 'Alex desfez a importação "outubro.csv" em 03/10/2026 às 18:12');
  });

  test('o aviso de mês fechado diz o mês por extenso', () => {
    const f = fecharMes({ id: 'f', academiaId: 'a', competencia: '2026-09', lancamentos: [], cobrancas: [], porId: 'dono', em: 'x' });
    const linha = l({ id: 'x', data: '2026-09-05', tipo: 'entrada', valorCentavos: 1 });
    const r = podeAlterarLancamento(linha, { ...linha, valorCentavos: 2 }, [f]);
    assert.equal(r.pode, false);
    assert.equal(!r.pode && r.motivo, 'Setembro de 2026 está fechado. Reabra o mês para mudar.');
  });
});

describe('AR 3 — a mensalidade com o mês por extenso', () => {
  test('"outubro/2026", nunca "2026-10"', () => {
    assert.equal(nomeDoMesComAno('2026-10'), 'outubro/2026');
    assert.equal(nomeDoMesComAno('2027-03'), 'março/2027');
    const r = gerarMensalidadesDoMes({
      competencia: '2026-10', matriculas: MATRICULAS, planos: PLANOS, existentes: [], primeiroMes: 'cheio', gerarId: (() => { let i = 0; return () => `c${++i}`; })(), em: 'x',
    });
    const bruno = r.novas.find((c) => c.matriculaId === 'm-bruno')!;
    assert.equal(bruno.descricao, 'Muay Thai livre — outubro/2026');
    for (const c of r.novas) assert.doesNotMatch(c.descricao, /\d{4}-\d{2}/);
  });
});
