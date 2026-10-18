/**
 * Revisão AO (onda 4, 16/10/2026): os achados de dinheiro, importação e
 * planilha, cada um com o teste ANTES da correção. Nomes fictícios.
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { CATEGORIAS, MODALIDADES, PESSOAS, cobrancaDeExemplo, lancamentoDeExemplo as l } from './exemplo.ts';
import { lerDinheiro } from './dinheiro.ts';
import { lerDataDaPlanilha } from './datas.ts';
import { acharCabecalho, conferirImportacao, detectarColunas, lerCSV } from './importacao.ts';
import { colarNaGrade, editarCelula, editarLinhaInteira } from './grade.ts';
import { validarLancamento } from './lancamentos.ts';
import { descreverRegistro } from './historico.ts';
import { gradeDaSemana, horariosDoDia, validarTurma } from './grade-de-aulas.ts';
import type { Turma } from '../turmas/turmas.ts';
import { cobrancaPassaNoFiltro, filtrarAlunos, linhasDeAlunos } from './filtros.ts';

const CTX = { categorias: CATEGORIAS, pessoas: PESSOAS, modalidades: MODALIDADES, hoje: '2026-10-15', academiaId: 'raca-fight' };

const conferir = (texto: string, extra: { tipoPadrao?: 'entrada' | 'saida' } = {}) => {
  const linhas = lerCSV(texto);
  const cab = acharCabecalho(linhas);
  return conferirImportacao({
    linhas, indiceDoCabecalho: cab, colunas: detectarColunas(linhas, cab), categorias: CATEGORIAS, pessoas: PESSOAS,
    modalidades: MODALIDADES, existentes: [], hoje: '2026-10-15', ...extra,
  });
};

describe('AO — dinheiro como o extrato do banco escreve', () => {
  test('"+150,00" é 150 (o sinal de mais do extrato)', () => {
    assert.equal(lerDinheiro('+150,00'), 15000);
    assert.equal(lerDinheiro('+ R$ 1.234,56'), 123456);
  });

  test('"150,00 D" é débito (negativo) e "150,00 C" é crédito', () => {
    assert.equal(lerDinheiro('150,00 D'), -15000);
    assert.equal(lerDinheiro('1.500,00D'), -150000);
    assert.equal(lerDinheiro('150,00 C'), 15000);
  });

  test('continua recusando o que não é dinheiro', () => {
    assert.equal(lerDinheiro('12,345'), null);
    assert.equal(lerDinheiro('D'), null);
    assert.equal(lerDinheiro('+'), null);
    assert.equal(lerDinheiro('Dinheiro'), null);
  });
});

describe('AO — data com hora (extrato e sistema de cartão)', () => {
  test('dd/mm/aaaa hh:mm e hh:mm:ss', () => {
    assert.equal(lerDataDaPlanilha('05/10/2026 14:30'), '2026-10-05');
    assert.equal(lerDataDaPlanilha('05/10/2026 14:30:59'), '2026-10-05');
  });

  test('AAAA-MM-DDThh:mm e AAAA-MM-DD hh:mm', () => {
    assert.equal(lerDataDaPlanilha('2026-10-05T14:30:00'), '2026-10-05');
    assert.equal(lerDataDaPlanilha('2026-10-05 14:30'), '2026-10-05');
  });

  test('hora que não existe ou data que não existe continuam recusadas', () => {
    assert.equal(lerDataDaPlanilha('05/10/2026 25:00'), null);
    assert.equal(lerDataDaPlanilha('31/09/2026 10:00'), null);
  });
});

describe('AO — categoria e tipo nunca brigam na planilha', () => {
  const saida = l({ id: 's1', data: '2026-10-05', tipo: 'saida', valorCentavos: 9000, descricao: 'Viagem do campeonato' });
  const entrada = l({ id: 'e1', data: '2026-10-05', tipo: 'entrada', valorCentavos: 9000, descricao: 'Inscrição', categoriaId: 'mensalidades' });

  test('"eventos" acha a categoria do MESMO tipo da linha quando há uma de entrada e outra de saída', () => {
    const r1 = editarCelula(saida, 'categoria', 'eventos', CTX);
    assert.ok(r1.ok);
    assert.equal(r1.ok && r1.lancamento.categoriaId, 'eventos-saida');
    const r2 = editarCelula({ ...saida, tipo: 'entrada' }, 'categoria', 'eventos', CTX);
    assert.equal(r2.ok && r2.lancamento.categoriaId, 'eventos-entrada');
  });

  test('mudar o tipo de uma linha com categoria do outro tipo tira a categoria (antes ficava a briga e o banco recusava a linha)', () => {
    const r = editarCelula(entrada, 'tipo', 'saída', CTX);
    assert.ok(r.ok);
    assert.equal(r.ok && r.lancamento.tipo, 'saida');
    assert.equal(r.ok && r.lancamento.categoriaId, undefined);
    assert.deepEqual(r.ok ? validarLancamento(r.lancamento, CATEGORIAS) : ['erro'], []);
    // o mesmo tipo não mexe na categoria
    const r2 = editarCelula(entrada, 'tipo', 'entrada', CTX);
    assert.equal(r2.ok && r2.lancamento.categoriaId, 'mensalidades');
  });

  test('"-20" numa linha com categoria de entrada vira saída de 20, sem a categoria, e a linha continua válida', () => {
    const r = editarCelula(entrada, 'valor', '-20', CTX);
    assert.ok(r.ok && r.lancamento.tipo === 'saida' && r.lancamento.valorCentavos === 2000 && !r.lancamento.categoriaId);
    assert.deepEqual(r.ok ? validarLancamento(r.lancamento, CATEGORIAS) : ['erro'], []);
  });

  test('colar uma linha com categoria de entrada e tipo Saída volta com erro, sem lançamento', () => {
    const { linhas } = colarNaGrade('05/10\tViagem\tMensalidades\tSaída\t90,00', 'data', CTX);
    assert.equal(linhas[0]!.lancamento, undefined);
    assert.ok(linhas[0]!.erros.some((e) => /Mensalidades/.test(e)));
  });

  test('colar com a categoria de saída sem coluna de tipo continua puxando o tipo', () => {
    const { linhas } = colarNaGrade('05/10\tAluguel de outubro\tAluguel', 'data', { ...CTX });
    assert.ok(linhas[0]!.erros.some((e) => /Valor/.test(e)));
    const { linhas: l2 } = colarNaGrade('05/10\tAluguel de outubro\tAluguel\t\t3.500,00', 'data', CTX);
    assert.equal(l2[0]!.lancamento?.tipo, 'saida');
    assert.equal(l2[0]!.lancamento?.valorCentavos, 350000);
  });
});

describe('AO — a folha do celular (todos os campos de uma vez)', () => {
  const nova = l({ id: 'n1', data: '2026-10-15', tipo: 'entrada', valorCentavos: 0, descricao: '' });
  const base = { descricao: 'Bandagens', valor: '-20', data: '15/10/2026', tipo: 'Entrada', categoria: '', forma: '', pessoa: '', situacao: 'Pago' };

  test('"-20" vira saída mesmo com o seletor de tipo em "Entrada" (antes virava ENTRADA de 20)', () => {
    const r = editarLinhaInteira(nova, base, CTX);
    assert.ok(r.ok);
    assert.equal(r.ok && r.lancamento.tipo, 'saida');
    assert.equal(r.ok && r.lancamento.valorCentavos, 2000);
  });

  test('tipo "Saída" com categoria de entrada é erro no campo Categoria (antes a categoria trocava o tipo calada)', () => {
    const r = editarLinhaInteira(nova, { ...base, valor: '90', tipo: 'Saída', categoria: 'Mensalidades' }, CTX);
    assert.equal(r.ok, false);
    assert.equal(!r.ok && r.campo, 'categoria');
  });

  test('categoria do mesmo tipo passa, e falta de descrição é erro no campo certo', () => {
    const r = editarLinhaInteira(nova, { ...base, valor: '3500', tipo: 'Saída', categoria: 'Aluguel' }, CTX);
    assert.equal(r.ok && r.lancamento.categoriaId, 'aluguel');
    const r2 = editarLinhaInteira(nova, { ...base, descricao: '' }, CTX);
    assert.equal(!r2.ok && r2.campo, 'descricao');
  });
});

describe('AO — importar a planilhazinha de verdade', () => {
  test('sem coluna de descrição: a descrição vem da categoria e da pessoa, com aviso', () => {
    const r = conferir('Data;Aluno;Valor;Categoria\n01/10/2026;Bruno Almeida;150,00;Mensalidades\n02/10/2026;Pessoa Nova;120,00;Mensalidades');
    assert.equal(r.resumo.comErro, 0);
    assert.equal(r.linhas[0]!.rascunho?.descricao, 'Mensalidades — Bruno Almeida');
    assert.ok(r.linhas[0]!.avisos.some((a) => /descrição/i.test(a)));
    assert.equal(r.linhas[1]!.rascunho?.descricao, 'Mensalidades — Pessoa Nova');
  });

  test('descrição em branco numa linha também usa a categoria (antes: erro "Falta a descrição")', () => {
    const r = conferir('Data;Descrição;Valor;Categoria\n01/10/2026;;150,00;Mensalidades');
    assert.equal(r.linhas[0]!.rascunho?.descricao, 'Mensalidades');
  });

  test('sem descrição, sem categoria e sem pessoa continua erro', () => {
    const r = conferir('Data;Valor;Tipo\n01/10/2026;150,00;entrada');
    assert.ok(r.linhas[0]!.erros.includes('Falta a descrição.'));
  });

  test('"todas as linhas sem tipo são entradas": a planilha só de recebimentos entra sem coluna de tipo', () => {
    const texto = 'Data;Aluno;Valor\n01/10/2026;Bruno Almeida;150,00\n02/10/2026;Carla Souza;220,00';
    assert.equal(conferir(texto).resumo.comErro, 2);
    const r = conferir(texto, { tipoPadrao: 'entrada' });
    assert.equal(r.resumo.comErro, 0);
    assert.deepEqual(r.linhas.map((x) => x.rascunho?.tipo), ['entrada', 'entrada']);
    assert.equal(r.linhas[0]!.rascunho?.pessoaId, 'bruno');
  });

  test('o tipo padrão não passa por cima do que a linha diz (valor negativo, coluna de tipo, categoria)', () => {
    const r = conferir('Data;Descrição;Valor;Categoria\n01/10/2026;Aluguel;3500;Aluguel\n02/10/2026;Kimono;250;', { tipoPadrao: 'entrada' });
    assert.equal(r.linhas[0]!.rascunho?.tipo, 'saida');
    assert.equal(r.linhas[1]!.rascunho?.tipo, 'entrada');
    const r2 = conferir('Data;Descrição;Valor;Tipo\n02/10/2026;Estorno;50;saída', { tipoPadrao: 'entrada' });
    assert.equal(r2.linhas[0]!.rascunho?.tipo, 'saida');
    // coluna com negativo: o sinal manda (o positivo é entrada), o padrão não muda nada
    const r3 = conferir('Data;Descrição;Valor\n02/10/2026;Estorno;-50\n03/10/2026;Kimono;250', { tipoPadrao: 'saida' });
    assert.deepEqual(r3.linhas.map((x) => x.rascunho?.tipo), ['saida', 'entrada']);
  });

  test('linha de TOTAL na primeira coluna (sem descrição) sai, como a de total na descrição', () => {
    const r = conferir('Data;Descrição;Valor;Tipo\n01/10/2026;Mensalidade Bruno;150,00;entrada\nTOTAL;;150,00;\nSaldo do mês;;150,00;');
    assert.equal(r.resumo.lidas, 1);
    assert.equal(r.resumo.comErro, 0);
  });
});

describe('AO — filtro: as cobranças em aberto na planilha seguem o MESMO filtro das linhas', () => {
  const c = cobrancaDeExemplo({ id: 'c1', pessoaId: 'fernanda', alunoPessoaId: 'davi', vencimento: '2026-10-10', valorCentavos: 11000, descricao: 'Muay Thai Kids — outubro/2026' });
  const ctx = { nomeDaPessoa: (id?: string) => PESSOAS.find((p) => p.id === id)?.nome ?? '', categoriaId: 'mensalidades' };

  test('texto sem acento e sem caixa acha pelo nome do aluno e do responsável', () => {
    assert.equal(cobrancaPassaNoFiltro(c, { texto: 'DAVI' }, ctx), true);
    assert.equal(cobrancaPassaNoFiltro(c, { texto: 'fernanda' }, ctx), true);
    assert.equal(cobrancaPassaNoFiltro(c, { texto: 'otavio' }, ctx), false);
  });

  test('categoria "Mensalidades" mostra a mensalidade aberta (antes sumia); outra categoria esconde', () => {
    assert.equal(cobrancaPassaNoFiltro(c, { categoriaIds: ['mensalidades'] }, ctx), true);
    assert.equal(cobrancaPassaNoFiltro(c, { categoriaIds: ['aluguel'] }, ctx), false);
  });

  test('tipo, situação, forma, pessoa, valor e origem cruzam como nas linhas', () => {
    assert.equal(cobrancaPassaNoFiltro(c, { tipos: ['saida'] }, ctx), false);
    assert.equal(cobrancaPassaNoFiltro(c, { situacoes: ['pago'] }, ctx), false);
    assert.equal(cobrancaPassaNoFiltro(c, { situacoes: ['pendente'], tipos: ['entrada'] }, ctx), true);
    assert.equal(cobrancaPassaNoFiltro(c, { formas: ['pix'] }, ctx), false);
    assert.equal(cobrancaPassaNoFiltro(c, { pessoaIds: ['davi'] }, ctx), true);
    assert.equal(cobrancaPassaNoFiltro(c, { pessoaIds: ['bruno'] }, ctx), false);
    assert.equal(cobrancaPassaNoFiltro(c, { valorMin: 10000, valorMax: 12000 }, ctx), true);
    assert.equal(cobrancaPassaNoFiltro(c, { valorMin: 11001 }, ctx), false);
    assert.equal(cobrancaPassaNoFiltro(c, { origens: ['importacao'] }, ctx), false);
    assert.equal(cobrancaPassaNoFiltro(c, { origens: ['mensalidade'] }, ctx), true);
    assert.equal(cobrancaPassaNoFiltro({ ...c, estado: 'paga' }, {}, ctx), false);
  });
});

describe('AO — busca de aluno pelo telefone só com os números', () => {
  test('"5190000" acha "(51) 90000-0001"', () => {
    const linhas = linhasDeAlunos({ pessoas: PESSOAS, matriculas: [], planos: [], cobrancas: [] }, '2026-10-15');
    assert.deepEqual(filtrarAlunos(linhas, { texto: '5190000' }).map((x) => x.pessoa.id), ['bruno']);
    assert.deepEqual(filtrarAlunos(linhas, { texto: '51 90000' }).map((x) => x.pessoa.id), ['bruno']);
  });
});

// ---------------------------------------------------------------------------
// Pedidos do AU (integração, 16/10): histórico das tabelas novas e a grade de aulas
// ---------------------------------------------------------------------------

describe('AO/AU — o histórico das tabelas novas e do banco fala português', () => {
  const nomeDe = (id: string) => ({ dono: 'Alex', 'h-1': 'seg 20:00' } as Record<string, string>)[id] ?? 'alguém';
  const registro = (tabela: string, extra: Partial<import('./tipos.ts').RegistroDoHistorico> = {}) => ({
    id: 'r', academiaId: 'a', tabela, registroId: 'x', acao: 'criou' as const, mudancas: [], porId: 'dono', em: '2026-10-16T10:00:00-03:00', ...extra,
  });
  const NOVAS = ['vinculos', 'turmas', 'horarios', 'alunos_das_turmas', 'atletas', 'sistemas_de_graduacao', 'ajustes_de_aula', 'graduacoes', 'exames',
    'candidatos_do_exame', 'lutas', 'consentimentos_de_atleta', 'tecnicas', 'perguntas_frequentes', 'indicacoes', 'avisos_da_academia', 'perfis_profissionais', 'eventos'];

  test('cada tabela nova tem nome na frase (antes: "um registro de alunos das turmas")', () => {
    for (const t of NOVAS) {
      const [frase] = descreverRegistro(registro(t), { nomeDe });
      assert.doesNotMatch(frase!, /um registro de/, t);
    }
    assert.match(descreverRegistro(registro('turmas'), { nomeDe })[0]!, /^Alex criou a turma em 16\/10\/2026 às 10:00$/);
  });

  test('a ação "anulou" (graduação) tem verbo', () => {
    assert.match(descreverRegistro(registro('graduacoes', { acao: 'anulou' as never }), { nomeDe })[0]!, /^Alex anulou a graduação/);
  });

  test('o campo que vem do banco em snake_case ganha o rótulo e o formato (antes: "Valor centavos: 15000 → 16000")', () => {
    const linhas = descreverRegistro(registro('lancamentos', { acao: 'mudou', mudancas: [
      { campo: 'valor_centavos', de: 15000, para: 16000 }, { campo: 'horario_id', de: null, para: 'h-1' }, { campo: 'duracao_minutos', de: 60, para: 90 },
    ] }), { nomeDe });
    assert.ok(linhas.includes('Valor: R$ 150,00 → R$ 160,00'), linhas.join(' | '));
    assert.ok(linhas.includes('Horário: — → seg 20:00'), linhas.join(' | '));
    assert.ok(linhas.includes('Duração (minutos): 60 → 90'), linhas.join(' | '));
    assert.ok(linhas.every((l) => !/_/.test(l)), linhas.join(' | '));
  });
});

describe('AO/AU — a grade de aulas no Admin (turmas e horários, R14.2a)', () => {
  const turma = (extra: Partial<Turma> = {}): Turma => ({
    id: 't1', academiaId: 'a', nome: 'Muay Thai — noite', modalidadeIds: ['muay-thai'], publico: 'adulto', nivel: 'todos', professorId: null,
    auxiliarIds: [], horarios: [{ id: 'h1', dia: 'seg', inicio: '20:00', duracaoMinutos: 60 }], capacidade: null, ativa: true, ...extra,
  });

  test('a turma válida passa; nome, modalidade, hora, duração, capacidade e idade erradas dizem o motivo', () => {
    assert.deepEqual(validarTurma(turma()), []);
    assert.ok(validarTurma(turma({ nome: ' ' })).some((e) => /nome/i.test(e)));
    assert.ok(validarTurma(turma({ modalidadeIds: [] })).some((e) => /modalidade/i.test(e)));
    assert.ok(validarTurma(turma({ horarios: [{ id: 'h', dia: 'seg', inicio: '25:00', duracaoMinutos: 60 }] })).some((e) => /hora/i.test(e)));
    assert.ok(validarTurma(turma({ horarios: [{ id: 'h', dia: 'seg', inicio: '20:00', duracaoMinutos: 0 }] })).some((e) => /duração/i.test(e)));
    assert.ok(validarTurma(turma({ capacidade: 0 })).some((e) => /capacidade|lugares/i.test(e)));
    assert.ok(validarTurma(turma({ idadeMinima: 10, idadeMaxima: 6 })).some((e) => /idade/i.test(e)));
  });

  test('dois horários iguais na mesma turma é erro (seg 20:00 duas vezes)', () => {
    const t = turma({ horarios: [{ id: 'a', dia: 'seg', inicio: '20:00', duracaoMinutos: 60 }, { id: 'b', dia: 'seg', inicio: '20:00', duracaoMinutos: 60 }] });
    assert.ok(validarTurma(t).some((e) => /repetido/i.test(e)));
  });

  test('os horários de um dia, para marcar a aula experimental, com a turma e a modalidade (só as turmas ativas, na ordem da hora)', () => {
    const turmas = [
      turma(),
      turma({ id: 't2', nome: 'Boxe — manhã', modalidadeIds: ['boxe'], horarios: [{ id: 'h2', dia: 'seg', inicio: '09:00', duracaoMinutos: 60 }] }),
      turma({ id: 't3', nome: 'Fechada', ativa: false, horarios: [{ id: 'h3', dia: 'seg', inicio: '10:00', duracaoMinutos: 60 }] }),
      turma({ id: 't4', nome: 'Sexta OPEN', horarios: [{ id: 'h4', dia: 'sex', inicio: '20:00', duracaoMinutos: 120 }] }),
    ];
    // 2026-10-19 é segunda
    const dia = horariosDoDia(turmas, '2026-10-19');
    assert.deepEqual(dia.map((x) => x.horario.id), ['h2', 'h1']);
    assert.deepEqual(horariosDoDia(turmas, '2026-10-19', 'muay-thai').map((x) => x.horario.id), ['h1']);
    assert.equal(horariosDoDia(turmas, '2026-10-20').length, 0);
  });

  test('a semana: cada dia com as aulas em ordem, para a grade da tela', () => {
    const s = gradeDaSemana([turma(), turma({ id: 't2', nome: 'Boxe', horarios: [{ id: 'h2', dia: 'seg', inicio: '09:00', duracaoMinutos: 60 }, { id: 'h5', dia: 'qua', inicio: '09:00', duracaoMinutos: 60 }] })]);
    assert.deepEqual(s.seg.map((x) => x.horario.inicio), ['09:00', '20:00']);
    assert.equal(s.qua.length, 1);
    assert.equal(s.dom.length, 0);
  });
});
