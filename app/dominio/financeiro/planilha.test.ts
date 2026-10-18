import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { CATEGORIAS, MODALIDADES, PESSOAS, lancamentoDeExemplo as l } from './exemplo.ts';
import {
  acharCabecalho, conferirImportacao, desfazerImportacao, detectarColunas, detectarSeparador, gravarImportacao, lerCSV,
} from './importacao.ts';
import { exportarLancamentos, gerarCSV } from './exportacao.ts';
import { colarNaGrade, desfazer, editarCelula, pilhaVazia, refazer, registrarAcao, textoDaCelula } from './grade.ts';
import type { Lancamento } from './tipos.ts';

const CTX = { categorias: CATEGORIAS, pessoas: PESSOAS, modalidades: MODALIDADES, hoje: '2026-10-15', academiaId: 'raca-fight' };

/** Como uma planilhazinha de academia costuma ser: título, cabeçalho, linhas, total. */
const PLANILHA = [
  'Controle financeiro — outubro;;;;;',
  'Data;Descrição;Entrada;Saída;Categoria;Pago?',
  '01/10/2026;Mensalidade Bruno;150,00;;Mensalidades;sim',
  '05/10/2026;"Aluguel; sala";;R$ 3.500,00;Aluguel;ok',
  '06/10/2026;Luvas novas;;480;Equipamento;',
  '06/10/2026;Kimono vendido;250,00;;Kimonos;sim',
  '07/10/2026;Sem valor;;;;',
  '31/02/2026;Data errada;10,00;;Mensalidades;sim',
  '20/10/2026;Luz;;450,00;Luz;não',
  ';TOTAL;400,00;4.430,00;;',
].join('\r\n');

describe('ler o CSV (separador ; e ,, aspas, BOM)', () => {
  test('separador detectado fora das aspas', () => {
    assert.equal(detectarSeparador('a;b;c\n1;2;3'), ';');
    assert.equal(detectarSeparador('"Descrição, longa",Valor,Data\n'), ',');
    assert.equal(detectarSeparador('Data\tValor\n'), '\t');
  });

  test('aspas com separador, aspas dobradas e quebra de linha dentro', () => {
    const t = '﻿Data,Descrição,Valor\r\n02/10/2026,"PIX ""CARLA"", combo","220,00"\r\n03/10/2026,"linha\ncom quebra",10\r\n';
    assert.deepEqual(lerCSV(t), [
      ['Data', 'Descrição', 'Valor'],
      ['02/10/2026', 'PIX "CARLA", combo', '220,00'],
      ['03/10/2026', 'linha\ncom quebra', '10'],
    ]);
  });
});

describe('conferir as colunas antes de gravar', () => {
  const linhas = lerCSV(PLANILHA);

  test('acha o cabeçalho abaixo do título e o papel de cada coluna', () => {
    const cab = acharCabecalho(linhas);
    assert.equal(cab, 1);
    assert.deepEqual(detectarColunas(linhas, cab).map((c) => c.papel), ['data', 'descricao', 'entrada', 'saida', 'categoria', 'situacao']);
  });

  test('sem cabeçalho, pelo conteúdo', () => {
    const sem = lerCSV('02/10/2026;Mensalidade Carla;220,00\n03/10/2026;Luz;-450,00');
    assert.equal(acharCabecalho(sem), -1);
    assert.deepEqual(detectarColunas(sem, -1).map((c) => c.papel), ['data', 'descricao', 'valor_com_sinal']);
  });

  test('cada linha conferida: pronta, com erro, categoria nova, total e vazia puladas', () => {
    const cab = acharCabecalho(linhas);
    const r = conferirImportacao({ linhas, indiceDoCabecalho: cab, colunas: detectarColunas(linhas, cab), existentes: [], ...CTX });
    assert.deepEqual(r.resumo, { lidas: 7, prontas: 5, repetidas: 0, comErro: 2 });
    const [mensalidade, aluguel, luvas, kimono, semValor, dataErrada, luz] = r.linhas;
    assert.deepEqual(mensalidade.rascunho, {
      data: '2026-10-01', descricao: 'Mensalidade Bruno', tipo: 'entrada', valorCentavos: 15000, categoriaId: 'mensalidades', situacao: 'pago',
    });
    assert.equal(aluguel.rascunho!.descricao, 'Aluguel; sala');
    assert.equal(aluguel.rascunho!.valorCentavos, 350000);
    assert.equal(aluguel.rascunho!.tipo, 'saida');
    assert.equal(luvas.rascunho!.situacao, 'pago', 'vazio no passado = pago');
    assert.equal(luvas.rascunho!.categoriaId, 'equipamento', 'nome parecido sem acento');
    assert.equal(kimono.rascunho!.categoriaNova, 'Kimonos');
    assert.deepEqual(r.categoriasNovas, [{ nome: 'Kimonos', tipo: 'entrada' }]);
    assert.equal(semValor.numero, 7);
    assert.match(semValor.erros[0], /valor/);
    assert.match(dataErrada.erros[0], /data/i);
    assert.equal(luz.rascunho!.situacao, 'pendente');
    assert.equal(r.linhas.length, 7, 'título, cabeçalho e TOTAL não viram linha');
  });

  test('repetida: igual a um lançamento que já existe (não entra por padrão)', () => {
    const cab = acharCabecalho(linhas);
    const existentes = [l({ id: 'x', data: '2026-10-01', tipo: 'entrada', valorCentavos: 15000, descricao: 'mensalidade  bruno' })];
    const r = conferirImportacao({ linhas, indiceDoCabecalho: cab, colunas: detectarColunas(linhas, cab), existentes, ...CTX });
    assert.equal(r.linhas[0].repetida, true);
    assert.equal(r.resumo.repetidas, 1);
  });

  test('coluna Tipo, valor com sinal, forma, pessoa e modalidade', () => {
    const t = lerCSV([
      'Data,Tipo,Valor,Forma,Aluno,Modalidade,Descrição',
      '02/10/2026,Receita,"220,50",Pix,carla souza,Muay Thai,Mensalidade',
      '03/10/2026,Despesa,"-80,00",Espécie,Fulano de Tal,,Lanche',
    ].join('\n'));
    const r = conferirImportacao({ linhas: t, indiceDoCabecalho: 0, colunas: detectarColunas(t, 0), existentes: [], ...CTX });
    const [a, b] = r.linhas;
    assert.equal(a.rascunho!.tipo, 'entrada');
    assert.equal(a.rascunho!.formaDePagamento, 'pix');
    assert.equal(a.rascunho!.pessoaId, 'carla');
    assert.deepEqual(a.rascunho!.reparticao, [{ modalidadeId: 'muay-thai', centavos: 22050 }]);
    assert.equal(b.rascunho!.tipo, 'saida');
    assert.equal(b.rascunho!.valorCentavos, 8000);
    assert.equal(b.rascunho!.formaDePagamento, 'dinheiro');
    assert.match(b.avisos.join(' '), /Fulano de Tal/);
  });

  test('células de XLSX: número e série de data', () => {
    const grade = [['Data', 'Descrição', 'Valor'], [46300, 'Mensalidade', 150], [46301, 'Aluguel', -3500]];
    const r = conferirImportacao({ linhas: grade, indiceDoCabecalho: 0, colunas: detectarColunas(grade, 0), existentes: [], ...CTX });
    assert.deepEqual(r.linhas.map((x) => [x.rascunho!.data, x.rascunho!.tipo, x.rascunho!.valorCentavos]), [
      ['2026-10-05', 'entrada', 15000], ['2026-10-06', 'saida', 350000],
    ]);
  });

  test('gravar e desfazer a importação inteira', () => {
    const cab = acharCabecalho(linhas);
    const r = conferirImportacao({ linhas, indiceDoCabecalho: cab, colunas: detectarColunas(linhas, cab), existentes: [], ...CTX });
    let n = 0;
    const gravados = gravarImportacao(r.linhas, {
      academiaId: 'raca-fight', importacaoId: 'imp1', porId: 'dono', em: 'agora', gerarId: () => `g${++n}`, categoriaIdPorNome: { Kimonos: 'cat-kimonos' },
    });
    assert.equal(gravados.length, 5);
    assert.ok(gravados.every((g) => g.origem === 'importacao' && g.importacaoId === 'imp1'));
    assert.equal(gravados[3].categoriaId, 'cat-kimonos');
    assert.deepEqual(desfazerImportacao(gravados, 'imp1', []), { ok: true, arquivar: ['g1', 'g2', 'g3', 'g4', 'g5'] });
  });
});

describe('exportar para o Excel em português', () => {
  test('BOM, ponto e vírgula, CRLF, vírgula decimal e aspas quando precisa', () => {
    const csv = gerarCSV(['Nome', 'Valor'], [['Ana; Bia', 1234.5], ['"Zé"', null]]);
    assert.equal(csv, '﻿Nome;Valor\r\n"Ana; Bia";1234,5\r\n"""Zé""";\r\n');
  });

  test('célula de texto que o Excel leria como fórmula vira texto (OWASP, injeção em CSV)', () => {
    const csv = gerarCSV(['Descrição'], [['=HYPERLINK("http://x")'], ['+1'], ['-2'], ['@SOMA'], ['Normal']]);
    assert.deepEqual(csv.split('\r\n').slice(1, 6), ['"\'=HYPERLINK(""http://x"")"', "'+1", "'-2", "'@SOMA", 'Normal']);
  });

  test('os lançamentos exportados voltam iguais pela importação', () => {
    const lancs: Lancamento[] = [
      l({ id: 'a', data: '2026-10-01', tipo: 'entrada', valorCentavos: 22050, descricao: 'Mensalidade; combo', categoriaId: 'mensalidades', formaDePagamento: 'pix', pessoaId: 'carla', reparticao: [{ modalidadeId: 'muay-thai', centavos: 22050 }] }),
      l({ id: 'b', data: '2026-10-10', tipo: 'saida', valorCentavos: 350000, descricao: '=Aluguel', categoriaId: 'aluguel', situacao: 'pendente' }),
    ];
    const csv = exportarLancamentos(lancs, CTX);
    assert.ok(csv.startsWith('﻿Data;Descrição;Categoria;Tipo;Valor;Valor (±);Forma de pagamento;Pessoa;Situação;Modalidade;Observação\r\n'));
    assert.ok(csv.includes('01/10/2026;"Mensalidade; combo";Mensalidades;Entrada;220,50;220,50;Pix;Carla Souza;Pago;Muay Thai;'));
    assert.ok(csv.includes(";Saída;3500,00;-3500,00;"));
    const linhas = lerCSV(csv);
    const r = conferirImportacao({ linhas, indiceDoCabecalho: 0, colunas: detectarColunas(linhas, 0), existentes: [], ...CTX });
    assert.deepEqual(r.linhas.map((x) => x.erros), [[], []]);
    assert.deepEqual(r.linhas.map((x) => x.rascunho), [
      { data: '2026-10-01', descricao: 'Mensalidade; combo', tipo: 'entrada', valorCentavos: 22050, categoriaId: 'mensalidades', formaDePagamento: 'pix', pessoaId: 'carla', situacao: 'pago', reparticao: [{ modalidadeId: 'muay-thai', centavos: 22050 }] },
      { data: '2026-10-10', descricao: '=Aluguel', tipo: 'saida', valorCentavos: 350000, categoriaId: 'aluguel', situacao: 'pendente' },
    ]);
  });
});

describe('grade tipo planilha: editar na célula, colar, desfazer', () => {
  const linha = l({ id: 'a', data: '2026-10-01', tipo: 'entrada', valorCentavos: 15000, descricao: 'Mensalidade', categoriaId: 'mensalidades' });

  test('edita a célula com o que a pessoa digita, ou devolve o erro sem mudar nada', () => {
    const v = editarCelula(linha, 'valor', '160,00', CTX);
    assert.equal(v.ok && v.lancamento.valorCentavos, 16000);
    const s = editarCelula(linha, 'valor', '-20', CTX);
    assert.ok(s.ok && s.lancamento.tipo === 'saida' && s.lancamento.valorCentavos === 2000, 'negativo vira saída');
    const d = editarCelula(linha, 'data', '5/10', CTX);
    assert.equal(d.ok && d.lancamento.data, '2026-10-05', 'sem ano, o ano de hoje (só na grade)');
    assert.deepEqual(editarCelula(linha, 'data', '31/02/2026', CTX), { ok: false, erro: 'Data inválida.' });
    const c = editarCelula(linha, 'categoria', 'aluguel', CTX);
    assert.equal(c.ok && c.lancamento.categoriaId, 'aluguel');
    assert.equal(c.ok && c.lancamento.tipo, 'saida', 'categoria de saída puxa o tipo');
    assert.equal(editarCelula(linha, 'categoria', 'Nada disso', CTX).ok, false);
    const p = editarCelula(linha, 'pessoa', 'bruno', CTX);
    assert.equal(p.ok && p.lancamento.pessoaId, 'bruno', 'começo do nome basta se só uma pessoa bate');
    assert.equal(textoDaCelula(linha, 'valor', CTX), '150,00');
    assert.equal(textoDaCelula(linha, 'categoria', CTX), 'Mensalidades');
  });

  test('colar várias linhas copiadas do Excel (tabulação)', () => {
    const r = colarNaGrade('02/10/2026\tMensalidade Carla\tMensalidades\tEntrada\t220,00\r\n03/10/2026\tLuz\tLuz\tSaída\txx\r\n', 'data', CTX);
    assert.equal(r.linhas.length, 2);
    assert.equal(r.linhas[0].lancamento!.valorCentavos, 22000);
    assert.deepEqual(r.linhas[1].erros, ['Coluna Valor: Valor inválido.']);
  });

  test('desfazer e refazer', () => {
    let pilha = pilhaVazia();
    const depois = { ...linha, valorCentavos: 16000 };
    pilha = registrarAcao(pilha, { descricao: 'Valor', mudancas: [{ antes: linha, depois }] });
    const d = desfazer(pilha)!;
    assert.deepEqual(d.aplicar, [{ antes: depois, depois: linha }]);
    const r = refazer(d.pilha)!;
    assert.deepEqual(r.aplicar, [{ antes: linha, depois }]);
    assert.equal(desfazer(pilhaVazia()), null);
    let cheia = pilhaVazia();
    for (let i = 0; i < 105; i++) cheia = registrarAcao(cheia, { descricao: String(i), mudancas: [] });
    assert.equal(cheia.feitos.length, 100);
    assert.equal(registrarAcao(d.pilha, { descricao: 'nova', mudancas: [] }).desfeitos.length, 0, 'ação nova apaga o refazer');
  });
});
