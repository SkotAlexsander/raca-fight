import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CATEGORIAS, DESPESAS_FIXAS, FUNCIONARIOS, MATRICULAS, MODALIDADES, PESSOAS, PLANOS, cobrancaDeExemplo, lancamentoDeExemplo as l,
} from './exemplo.ts';
import { exportarAlunos, filtrarAlunos, filtrarFuncionarios, filtrarLancamentos, linhasDeAlunos, quantoEntrou } from './filtros.ts';
import {
  conversaoDoFunil, etapaDoInteressado, interessadosParaApagar, lembreteDeRetorno, matricularInteressado, mudarExperimental, retornosPendentes,
} from './funil.ts';
import {
  adiarLembrete, agendaDeLembretes, buscarNotas, concluirLembrete, concluirTarefa, lembreteDaDespesaFixa, lembretesDoDia,
  notasLigadas, proximaData, tarefasAbertas, validarLembrete, validarNota,
} from './anotacoes.ts';
import { resumoDoPainel } from './painel.ts';
import { periodoDoTrimestre } from './datas.ts';
import type { AulaExperimental, Interessado, Lembrete, Nota, Tarefa } from './tipos.ts';

const HOJE = '2026-10-15';
const cobrancas = [
  cobrancaDeExemplo({ id: 'k1', pessoaId: 'bruno', matriculaId: 'm-bruno', vencimento: '2026-09-10', valorCentavos: 15000 }),
  cobrancaDeExemplo({ id: 'k2', pessoaId: 'bruno', matriculaId: 'm-bruno', vencimento: '2026-10-10', valorCentavos: 15000 }),
  cobrancaDeExemplo({ id: 'k3', pessoaId: 'fernanda', alunoPessoaId: 'davi', matriculaId: 'm-davi', vencimento: '2026-09-10', valorCentavos: 11000 }),
  cobrancaDeExemplo({ id: 'k4', pessoaId: 'carla', matriculaId: 'm-carla', vencimento: '2026-10-05', valorCentavos: 22000, estado: 'paga', pagaEm: '2026-10-05' }),
];
const dados = { pessoas: PESSOAS, matriculas: MATRICULAS, planos: PLANOS, cobrancas };

describe('filtro total: cruza pessoas, planos e dinheiro', () => {
  const linhas = linhasDeAlunos(dados, HOJE);

  test('cada aluno com a situação, as modalidades e o que deve (o Kids pelo que a responsável deve por ele)', () => {
    const davi = linhas.find((x) => x.pessoa.id === 'davi')!;
    assert.equal(davi.situacao, 'matriculado');
    assert.deepEqual(davi.modalidadeIds, ['muay-thai']);
    assert.equal(davi.emAtrasoCentavos, 11000);
    assert.equal(davi.diasDeAtraso, 35);
    assert.equal(davi.pagadorPessoaIds[0], 'fernanda');
    assert.equal(linhas.find((x) => x.pessoa.id === 'otavio')!.situacao, 'trancado');
    assert.equal(linhas.some((x) => x.pessoa.id === 'fernanda'), false, 'responsável que não treina não é aluno');
  });

  test('"alunos de Muay Thai inadimplentes há mais de 30 dias"', () => {
    const r = filtrarAlunos(linhas, { modalidadeIds: ['muay-thai'], inadimplenteHaMaisDeDias: 30 });
    assert.deepEqual(r.map((x) => x.pessoa.id).sort(), ['bruno', 'davi']);
    assert.deepEqual(filtrarAlunos(linhas, { modalidadeIds: ['jiu-jitsu'], inadimplenteHaMaisDeDias: 30 }), []);
  });

  test('em dia, por plano, por desconto, por texto, por situação; vários critérios somam (E)', () => {
    assert.deepEqual(filtrarAlunos(linhas, { emDia: true, situacoes: ['matriculado'] }).map((x) => x.pessoa.id).sort(), ['carla', 'elisa', 'helena']);
    assert.deepEqual(filtrarAlunos(linhas, { planoIds: ['combo-2'] }).map((x) => x.pessoa.id), ['carla']);
    assert.deepEqual(filtrarAlunos(linhas, { motivosDeDesconto: ['familia'] }).map((x) => x.pessoa.id), ['elisa']);
    assert.deepEqual(filtrarAlunos(linhas, { texto: 'lima' }).map((x) => x.pessoa.id).sort(), ['davi', 'elisa']);
    assert.deepEqual(filtrarAlunos(linhas, { novosDesde: '2026-08-01' }).map((x) => x.pessoa.id), ['elisa']);
  });

  test('funcionários por função, modalidade e remuneração', () => {
    assert.deepEqual(filtrarFuncionarios(FUNCIONARIOS, PESSOAS, { funcoes: ['professor'] }, HOJE).map((f) => f.funcionario.id), ['f-gabriel', 'f-helena']);
    assert.deepEqual(filtrarFuncionarios(FUNCIONARIOS, PESSOAS, { modalidadeIds: ['jiu-jitsu'] }, HOJE).map((f) => f.funcionario.id), ['f-helena']);
    assert.deepEqual(filtrarFuncionarios(FUNCIONARIOS, PESSOAS, { tiposDeRemuneracao: ['fixo'], texto: 'igor' }, HOJE).map((f) => f.funcionario.id), ['f-igor']);
  });

  test('"quanto entrou de Jiu-Jitsu neste trimestre" (o combo conta só a parte do Jiu-Jitsu)', () => {
    const lancs = [
      l({ id: 'a', data: '2026-10-05', tipo: 'entrada', valorCentavos: 22000, reparticao: [{ modalidadeId: 'muay-thai', centavos: 11000 }, { modalidadeId: 'jiu-jitsu', centavos: 11000 }] }),
      l({ id: 'b', data: '2026-11-10', tipo: 'entrada', valorCentavos: 9900, reparticao: [{ modalidadeId: 'jiu-jitsu', centavos: 9900 }] }),
      l({ id: 'c', data: '2026-09-30', tipo: 'entrada', valorCentavos: 14000, reparticao: [{ modalidadeId: 'jiu-jitsu', centavos: 14000 }] }),
      l({ id: 'd', data: '2026-10-20', tipo: 'entrada', valorCentavos: 14000, situacao: 'pendente', reparticao: [{ modalidadeId: 'jiu-jitsu', centavos: 14000 }] }),
      l({ id: 'e', data: '2026-10-21', tipo: 'saida', valorCentavos: 50000, categoriaId: 'equipamento', descricao: 'Tatame novo' }),
    ];
    assert.equal(quantoEntrou(lancs, { periodo: periodoDoTrimestre(HOJE), modalidadeIds: ['jiu-jitsu'] }), 20900);
    assert.equal(quantoEntrou(lancs, { periodo: periodoDoTrimestre(HOJE) }), 31900);
    assert.deepEqual(filtrarLancamentos(lancs, { texto: 'tatame' }).map((x) => x.id), ['e']);
    assert.deepEqual(filtrarLancamentos(lancs, { valorMin: 14000, tipos: ['entrada'], situacoes: ['pago'] }).map((x) => x.id), ['a', 'c']);
    assert.deepEqual(filtrarLancamentos(lancs, { categoriaIds: ['equipamento'], periodo: { de: '2026-10-01', ate: '2026-10-31' } }).map((x) => x.id), ['e']);
  });

  test('exportar o resultado do filtro', () => {
    const csv = exportarAlunos(filtrarAlunos(linhas, { inadimplenteHaMaisDeDias: 30 }), { planos: PLANOS, modalidades: MODALIDADES, pessoas: PESSOAS });
    assert.ok(csv.startsWith('﻿Nome;Telefone;Situação;Planos;Modalidades;Responsável;Em atraso;Dias de atraso\r\n'));
    assert.ok(csv.includes('Davi Lima;;Matriculado;Muay Thai Kids;Muay Thai;Fernanda Lima;110,00;35'));
  });
});

describe('funil: interessado → aula experimental → matrícula', () => {
  const int = (id: string, origem: Interessado['origem'], extra: Partial<Interessado> = {}): Interessado => ({
    id, academiaId: 'raca-fight', nome: id, ...(origem ? { origem } : {}), modalidadeIds: ['muay-thai'], contatoEm: '2026-10-01', ...extra,
  });
  const exp = (id: string, interessadoId: string, data: string, estado: AulaExperimental['estado']): AulaExperimental => ({
    id, academiaId: 'raca-fight', interessadoId, data, estado, marcadaPor: 'igor',
  });

  test('a etapa é calculada; a experimental só anda pelos caminhos do R19.3', () => {
    const ana = int('ana', 'instagram');
    assert.equal(etapaDoInteressado(ana, []), 'interessado');
    const marcada = exp('e1', 'ana', '2026-10-06', 'agendada');
    assert.equal(etapaDoInteressado(ana, [marcada]), 'experimental_agendada');
    const feita = mudarExperimental(marcada, 'compareceu');
    assert.equal(etapaDoInteressado(ana, [feita]), 'experimental_feita');
    assert.throws(() => mudarExperimental(marcada, 'matriculou'), /não passa/);
    assert.equal(etapaDoInteressado(ana, [exp('e2', 'ana', '2026-10-06', 'faltou')]), 'interessado', 'faltou: volta a ser só interessado');
    const m = matricularInteressado(ana, [feita], 'p-ana', '2026-10-08');
    assert.equal(m.interessado.pessoaId, 'p-ana');
    assert.equal(m.experimentais[0].estado, 'matriculou');
    assert.equal(etapaDoInteressado(m.interessado, m.experimentais), 'matriculado');
    assert.equal(etapaDoInteressado(ana, [mudarExperimental(feita, 'nao_seguiu')]), 'desistiu');
  });

  const interessados = [
    int('a', 'instagram', { matriculadoEm: '2026-10-05' }),
    int('b', 'instagram'),
    int('c', 'instagram'),
    int('d', 'whatsapp'),
    int('e', 'indicacao', { matriculadoEm: '2026-10-02', indicadoPorPessoaId: 'carla' }),
    int('f', 'whatsapp'),
    int('g', undefined),
    int('h', 'whatsapp', { contatoEm: '2026-08-01' }),
  ];
  const experimentais = [
    exp('xa', 'a', '2026-10-03', 'matriculou'),
    exp('xb', 'b', '2026-10-04', 'compareceu'),
    exp('xd', 'd', '2026-10-12', 'compareceu'),
    exp('xe', 'e', '2026-10-02', 'matriculou'),
    exp('xf', 'f', '2026-10-02', 'nao_seguiu'),
    exp('xg', 'g', '2026-10-20', 'agendada'),
  ];

  test('conversão por origem, contando quem chegou no período', () => {
    const r = conversaoDoFunil(interessados, experimentais, { de: '2026-10-01', ate: '2026-10-31' });
    assert.deepEqual(r.total, { contatos: 7, agendaram: 6, fizeramExperimental: 5, matricularam: 2, desistiram: 1, experimentalParaMatriculaPontosBase: 4000, contatoParaMatriculaPontosBase: 2857 });
    assert.equal(r.porOrigem.instagram.contatos, 3);
    assert.equal(r.porOrigem.indicacao.contatoParaMatriculaPontosBase, 10000);
    assert.equal(r.porOrigem.whatsapp.matricularam, 0);
    assert.equal(r.porOrigem.nao_informado.agendaram, 1);
  });

  test('retorno pendente: compareceu, não se matriculou, passou o prazo [decidir]', () => {
    assert.deepEqual(retornosPendentes(interessados, experimentais, HOJE, { diasDepois: 3 }).map((x) => x.interessado.id), ['b', 'd']);
    assert.deepEqual(retornosPendentes(interessados, experimentais, HOJE, { diasDepois: 5 }).map((x) => x.interessado.id), ['b']);
    const lem = lembreteDeRetorno(interessados[1], '2026-10-04', { diasDepois: 3, gerarId: () => 'r1', porId: 'dono', em: 'agora' });
    assert.equal(lem.data, '2026-10-07');
    assert.equal(lem.interessadoId, 'b');
    assert.equal(lem.titulo, 'Retorno da aula experimental: b');
  });

  test('quem não virou aluno sai do cadastro depois do prazo (R19.1, [decidir] L23)', () => {
    assert.deepEqual(interessadosParaApagar(interessados, experimentais, '2027-03-01', 180), ['h']);
    assert.deepEqual(interessadosParaApagar(interessados, experimentais, '2027-04-20', 180).sort(), ['b', 'c', 'd', 'f', 'g', 'h']);
  });
});

describe('anotar e lembrar', () => {
  const nota = (id: string, texto: string, extra: Partial<Nota> = {}): Nota => ({
    id, academiaId: 'raca-fight', texto, fixada: false, arquivada: false, criadaPor: 'dono', criadaEm: `2026-10-0${id.length}T10:00:00-03:00`, atualizadaEm: 'x', ...extra,
  });

  test('nota: valida, liga a pessoa/data/valor, busca sem acento, fixada primeiro', () => {
    assert.deepEqual(validarNota(nota('n', 'Combinou pagar dia 20', { valorCentavos: 15000 })), []);
    assert.equal(validarNota(nota('n', '   ')).length, 1);
    assert.equal(validarNota(nota('n', 'x'.repeat(2001))).length, 1);
    const notas = [nota('a', 'Bruno pediu para trancar', { pessoaId: 'bruno' }), nota('bb', 'Comprar luvas novas'), nota('ccc', 'Ligar para o Bruno', { pessoaId: 'bruno', fixada: true })];
    assert.deepEqual(notasLigadas(notas, { pessoaId: 'bruno' }).map((n) => n.id), ['ccc', 'a']);
    assert.deepEqual(buscarNotas(notas, 'LUVAS').map((n) => n.id), ['bb']);
    assert.deepEqual(buscarNotas(notas, 'bruno').map((n) => n.id), ['ccc', 'a']);
  });

  const lembrete = (id: string, data: string, extra: Partial<Lembrete> = {}): Lembrete => ({
    id, academiaId: 'raca-fight', titulo: id, data, repeticao: 'nao_repete', avisarDiasAntes: 0, criadoPor: 'dono', criadoEm: 'x', ...extra,
  });

  test('próxima data: mensal no dia 31 volta a 31 depois de fevereiro; anual em 29/02', () => {
    assert.equal(proximaData('2026-01-31', 'mensal', 31), '2026-02-28');
    assert.equal(proximaData('2026-02-28', 'mensal', 31), '2026-03-31');
    assert.equal(proximaData('2026-10-10', 'semanal'), '2026-10-17');
    assert.equal(proximaData('2028-02-29', 'anual'), '2029-02-28');
    assert.equal(proximaData('2026-10-10', 'nao_repete'), null);
  });

  test('o dia: atrasados, hoje, e os que avisam antes', () => {
    const r = lembretesDoDia([
      lembrete('aluguel', '2026-10-10', { repeticao: 'mensal', diaDoMes: 10 }),
      lembrete('cobrar', '2026-10-15'),
      lembrete('seguro', '2026-10-20', { avisarDiasAntes: 7 }),
      lembrete('longe', '2026-11-20', { avisarDiasAntes: 7 }),
      lembrete('feito', '2026-10-01', { concluidoEm: 'x' }),
    ], HOJE);
    assert.deepEqual([r.atrasados.map((x) => x.id), r.hoje.map((x) => x.id), r.emBreve.map((x) => x.id)], [['aluguel'], ['cobrar'], ['seguro']]);
  });

  test('concluir: o que repete anda para a próxima; o que não repete fecha. Adiar não vai para o passado', () => {
    const aluguel = lembrete('aluguel', '2026-10-10', { repeticao: 'mensal', diaDoMes: 10 });
    const c = concluirLembrete(aluguel, '2026-10-10T09:00:00-03:00');
    assert.equal(c.data, '2026-11-10');
    assert.equal(c.concluidoEm, undefined);
    assert.equal(c.ultimaConclusaoEm, '2026-10-10T09:00:00-03:00');
    assert.equal(concluirLembrete(lembrete('x', '2026-10-10'), 'agora').concluidoEm, 'agora');
    assert.equal(adiarLembrete(aluguel, '2026-10-17', HOJE).data, '2026-10-17');
    assert.throws(() => adiarLembrete(aluguel, '2026-10-14', HOJE), /passado/);
  });

  test('validar o lembrete e a agenda do mês com as repetições', () => {
    assert.deepEqual(validarLembrete(lembrete('ok', '2026-10-10', { hora: '09:30' })), []);
    assert.equal(validarLembrete(lembrete('', '2026-10-10', { hora: '25:00', avisarDiasAntes: 90 })).length, 3);
    const ag = agendaDeLembretes([lembrete('treino', '2026-10-03', { repeticao: 'semanal' }), lembrete('aluguel', '2026-10-10', { repeticao: 'mensal', diaDoMes: 10 })], { de: '2026-10-01', ate: '2026-10-31' });
    assert.deepEqual(ag.map((o) => `${o.data} ${o.lembreteId}`), [
      '2026-10-03 treino', '2026-10-10 aluguel', '2026-10-10 treino', '2026-10-17 treino', '2026-10-24 treino', '2026-10-31 treino',
    ]);
  });

  test('lembrete pronto a partir da despesa fixa ("vence o aluguel no dia 10")', () => {
    const lem = lembreteDaDespesaFixa(DESPESAS_FIXAS[0], { hoje: HOJE, avisarDiasAntes: 3, gerarId: () => 'L', porId: 'dono', em: 'agora' });
    assert.deepEqual([lem.data, lem.repeticao, lem.diaDoMes, lem.valorCentavos, lem.despesaFixaId], ['2026-11-10', 'mensal', 10, 350000, 'd-aluguel']);
  });

  test('tarefas: atrasadas primeiro, depois por prazo, sem prazo no fim', () => {
    const t = (id: string, prazo?: string, extra: Partial<Tarefa> = {}): Tarefa => ({ id, academiaId: 'a', titulo: id, ...(prazo ? { prazo } : {}), criadaPor: 'd', criadaEm: `2026-10-0${id.length}T00:00:00-03:00`, ...extra });
    const lista = [t('semprazo'), t('depois', '2026-10-30'), t('atrasada', '2026-10-01'), t('feita', '2026-10-01', { feitaEm: 'x' }), t('logo', '2026-10-16')];
    assert.deepEqual(tarefasAbertas(lista, HOJE).map((x) => [x.tarefa.id, x.atrasada]), [['atrasada', true], ['logo', false], ['depois', false], ['semprazo', false]]);
    assert.equal(concluirTarefa(lista[0], 'agora').feitaEm, 'agora');
  });
});

describe('painel do dono', () => {
  test('pessoas, funcionários, dinheiro do mês, previsão, inadimplentes, comparação e 12 meses', () => {
    const lancamentos = [
      l({ id: 'a', data: '2026-10-05', tipo: 'entrada', valorCentavos: 22000, categoriaId: 'mensalidades' }),
      l({ id: 'b', data: '2026-10-10', tipo: 'saida', valorCentavos: 350000, categoriaId: 'aluguel', despesaFixaId: 'd-aluguel' }),
      l({ id: 'c', data: '2026-09-10', tipo: 'entrada', valorCentavos: 100000 }),
    ];
    const p = resumoDoPainel({
      ...dados, funcionarios: FUNCIONARIOS, lancamentos, despesasFixas: DESPESAS_FIXAS, categorias: CATEGORIAS,
      interessados: [], experimentais: [], lembretes: [], tarefas: [], competencia: '2026-10', hoje: HOJE,
    });
    assert.deepEqual(p.alunos, { matriculados: 5, trancados: 1, inativos: 0, novosNoMes: 0, total: 6 });
    assert.deepEqual(p.funcionarios, { total: 3, porFuncao: { professor: 2, recepcao: 1 } });
    assert.equal(p.mes.entradas, 22000);
    assert.equal(p.mes.resultado, -328000);
    assert.equal(p.comparacao.entradas.diferenca, -78000);
    assert.equal(p.inadimplentes.pessoas, 2);
    assert.equal(p.inadimplentes.centavos, 41000);
    assert.equal(p.evolucao.length, 12);
    assert.equal(p.previsao.aReceberNoMes, 15000);
  });
});
