import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GRAUS_POR_MODELO_KIDS, MODELO_LUTA_LIVRE_A_CONFIRMAR, sistemaIbjjfAdulto, sistemaIbjjfKids, sistemaLutaLivreAConfigurar, sistemaMuayThaiAConfigurar } from './sistemas.ts';
import {
  anularGraduacao,
  avaliarMinimos,
  datasDepoisDe,
  definirResultado,
  descreverGraduacao,
  ErroDeGraduacao,
  fecharExame,
  graduacaoAtual,
  graduacaoInicial,
  historicoDeGraduacao,
  idadeNoSistema,
  mesesEntre,
  passaAoAdultoEsteAno,
  prontosParaAvaliar,
  proximoPasso,
  registrarGraduacao,
  somarMeses,
  type Exame,
  type Graduacao,
} from './graduacao.ts';

const IBJJF = sistemaIbjjfAdulto('jiu-jitsu');
let n = 0;
const g = (m: Partial<Graduacao> & Pick<Graduacao, 'nivelId' | 'grau' | 'data'>): Graduacao => ({
  id: `g${(n += 1)}`,
  academiaId: 'raca-fight',
  alunoId: 'lucas',
  modalidadeId: 'jiu-jitsu',
  sistemaId: IBJJF.id,
  graduadoPorId: 'marcio',
  origem: 'promocao',
  registradaPorId: 'marcio',
  registradaEm: `${m.data}T20:00:00-03:00`,
  ...m,
});

test('IBJJF adulto: a régua, a idade e o tempo da federação, sem presença mínima (R16.3)', () => {
  assert.deepEqual(IBJJF.niveis.map((x) => x.nome), ['branca', 'azul', 'roxa', 'marrom', 'preta', 'vermelha e preta', 'vermelha e branca', 'vermelha']);
  const azul = IBJJF.niveis[1]!;
  assert.equal(azul.idadeMinima, 16);
  assert.deepEqual(azul.mesesMinimos, { meses: 24, origem: 'federacao' });
  assert.equal(IBJJF.niveis.find((x) => x.id === 'preta')!.grausMaximos, 6);
  assert.equal(IBJJF.niveis.find((x) => x.id === 'preta')!.idadeMinima, 19);
  assert.ok(IBJJF.niveis.every((x) => x.presencasMinimas === undefined), 'a IBJJF não exige número de aulas');
  assert.equal(IBJJF.contagemDaIdade, 'ano_civil');
  assert.equal(IBJJF.aConfigurar, false);
});

test('IBJJF kids: 13 faixas de 4 a 15 anos; o modelo de graus é parâmetro (L5), sem padrão', () => {
  const semModelo = sistemaIbjjfKids(null);
  assert.equal(semModelo.niveis.length, 13);
  assert.equal(semModelo.aConfigurar, true);
  assert.ok(semModelo.niveis.every((x) => x.grausMaximos === 0 && x.mesesMinimos === undefined));
  assert.equal(sistemaIbjjfKids('quadrimestral').niveis[0]!.grausMaximos, 2);
  assert.equal(sistemaIbjjfKids('mensal').niveis[3]!.grausMaximos, 11);
  assert.deepEqual(GRAUS_POR_MODELO_KIDS, { trimestral: 3, quadrimestral: 2, mensal: 11 });
  assert.equal(semModelo.niveis.find((x) => x.id === 'amarela')!.idadeMinima, 7);
  assert.equal(semModelo.niveis.find((x) => x.id === 'verde-e-preta')!.idadeMaxima, 15);
});

test('Muay Thai e Luta Livre nascem "a configurar", sem régua inventada (L3, L4)', () => {
  const mt = sistemaMuayThaiAConfigurar('Kruang');
  assert.equal(mt.aConfigurar, true);
  assert.deepEqual(mt.niveis, []);
  assert.equal(mt.palavraDoNivel, 'Kruang');
  assert.equal(mt.palavraDoGrau, null);
  assert.equal(sistemaMuayThaiAConfigurar('Prajied').palavraDoNivel, 'Prajied');
  const ll = sistemaLutaLivreAConfigurar();
  assert.equal(ll.aConfigurar, true);
  assert.deepEqual(ll.niveis, []);
  assert.equal(MODELO_LUTA_LIVRE_A_CONFIRMAR[0], 'branca');
  // régua vazia: sem próximo passo e sem faixa inicial
  assert.equal(proximoPasso(mt, null), null);
  assert.equal(graduacaoInicial({ id: 'x', academiaId: 'a', alunoId: 'l', modalidadeId: 'muay-thai', sistema: mt, data: '2026-10-15', em: 'x' }), null);
});

test('o texto da graduação vem do sistema (R16.9)', () => {
  assert.equal(descreverGraduacao(IBJJF, 'branca', 2), 'Faixa branca, 2º grau');
  assert.equal(descreverGraduacao(IBJJF, 'azul', 0), 'Faixa azul');
  const mt = sistemaMuayThaiAConfigurar('Kruang', 'adulto', null, [{ id: 'amarelo', nome: 'amarelo', cores: ['#F2C230'], grausMaximos: 0 }]);
  assert.equal(descreverGraduacao(mt, 'amarelo', 0), 'Kruang amarelo');
  assert.equal(descreverGraduacao(mt, 'amarelo', 3), 'Kruang amarelo');
});

test('a idade da IBJJF é ano atual − ano de nascimento; a outra, a do aniversário (R16.5)', () => {
  assert.equal(idadeNoSistema('2010-12-30', '2026-01-02', 'ano_civil'), 16);
  assert.equal(idadeNoSistema('2010-12-30', '2026-01-02', 'aniversario'), 15);
  assert.equal(idadeNoSistema('2010-01-02', '2026-01-02', 'aniversario'), 16);
  assert.equal(passaAoAdultoEsteAno('2010-12-30', '2026-03-01'), true);
  assert.equal(passaAoAdultoEsteAno('2011-01-01', '2026-03-01'), false);
});

test('meses na faixa contados da data do registro no app (R16.7)', () => {
  assert.equal(mesesEntre('2026-03-12', '2026-10-15'), 7);
  assert.equal(mesesEntre('2026-03-16', '2026-10-15'), 6);
  assert.equal(somarMeses('2026-01-31', 1), '2026-02-28');
  assert.equal(somarMeses('2024-10-15', 24), '2026-10-15');
});

test('o próximo passo: o grau seguinte; no último grau, a faixa seguinte; no topo, nada', () => {
  assert.deepEqual(proximoPasso(IBJJF, null), { nivelId: 'branca', grau: 0 });
  assert.deepEqual(proximoPasso(IBJJF, { nivelId: 'branca', grau: 2 }), { nivelId: 'branca', grau: 3 });
  assert.deepEqual(proximoPasso(IBJJF, { nivelId: 'branca', grau: 4 }), { nivelId: 'azul', grau: 0 });
  assert.equal(proximoPasso(IBJJF, { nivelId: 'vermelha', grau: 0 }), null);
  assert.equal(proximoPasso(IBJJF, { nivelId: 'inexistente', grau: 0 }), null);
});

test('a atual é a mais recente não anulada; o histórico do aluno esconde a anulada (R16.13)', () => {
  const a = g({ nivelId: 'branca', grau: 1, data: '2026-01-10' });
  const b = g({ nivelId: 'branca', grau: 2, data: '2026-03-12' });
  const c = anularGraduacao(g({ nivelId: 'branca', grau: 3, data: '2026-05-01' }), 'marcio', 'registrada por engano', '2026-05-02T10:00:00-03:00');
  const todas = [c, a, b, g({ nivelId: 'branca', grau: 4, data: '2026-04-01', modalidadeId: 'luta-livre' })];
  assert.equal(graduacaoAtual(todas, 'lucas', 'jiu-jitsu')!.id, b.id);
  assert.deepEqual(historicoDeGraduacao(todas, 'lucas', 'jiu-jitsu').map((x) => x.grau), [1, 2]);
  assert.deepEqual(historicoDeGraduacao(todas, 'lucas', 'jiu-jitsu', true).map((x) => x.grau), [1, 2, 3]);
  assert.equal(c.anulada!.motivo, 'registrada por engano');
  assert.throws(() => anularGraduacao(a, 'marcio', '  ', 'x'), (e: unknown) => e instanceof ErroDeGraduacao && e.codigo === 'motivo_vazio');
  assert.equal(graduacaoAtual(todas, 'ana', 'jiu-jitsu'), null);
});

test('atingiu os mínimos: graus da branca não têm mínimo na IBJJF (critério do professor)', () => {
  const atual = g({ nivelId: 'branca', grau: 2, data: '2026-03-12' });
  const av = avaliarMinimos({ sistema: IBJJF, atual, datasDasPresencas: ['2026-03-20', '2026-04-02'], hoje: '2026-10-15', nascimento: '1998-05-04' });
  assert.deepEqual(av.passo, { nivelId: 'branca', grau: 3 });
  assert.equal(av.temMinimos, false);
  assert.equal(av.cumpre, true);
  assert.equal(av.presencas, 2);
  assert.equal(av.meses, 7);
});

test('atingiu os mínimos: azul → roxa exige 2 anos na azul (federação)', () => {
  const azul4 = g({ nivelId: 'azul', grau: 4, data: '2024-07-10' });
  const cedo = avaliarMinimos({ sistema: IBJJF, atual: { ...azul4, data: '2025-10-01' }, datasDasPresencas: [], hoje: '2026-10-15', nascimento: '1990-01-01' });
  assert.equal(cedo.cumpre, false);
  assert.deepEqual(cedo.faltam, ['tempo']);
  assert.equal(cedo.origens.tempo, 'federacao');
  const pronto = avaliarMinimos({ sistema: IBJJF, atual: azul4, datasDasPresencas: [], hoje: '2026-10-15', nascimento: '1990-01-01' });
  assert.equal(pronto.cumpre, true);
  assert.equal(pronto.temMinimos, true);
  assert.equal(pronto.cumpreDesde, '2026-07-10');
});

test('atingiu os mínimos: presença mínima é da academia, quando ela definir (L19)', () => {
  const comAcademia = { ...IBJJF, niveis: IBJJF.niveis.map((x) => (x.id === 'branca' ? { ...x, presencasMinimas: 3 } : x)) };
  const branca4 = g({ nivelId: 'branca', grau: 4, data: '2026-01-10' });
  const falta = avaliarMinimos({ sistema: comAcademia, atual: branca4, datasDasPresencas: ['2026-02-01', '2026-02-03'], hoje: '2026-10-15', nascimento: '1990-01-01' });
  assert.deepEqual(falta.faltam, ['presencas']);
  assert.equal(falta.origens.presencas, 'academia');
  const ok = avaliarMinimos({ sistema: comAcademia, atual: branca4, datasDasPresencas: ['2026-02-01', '2026-02-03', '2026-02-05', '2026-02-07'], hoje: '2026-10-15', nascimento: '1990-01-01' });
  assert.equal(ok.cumpre, true);
  assert.equal(ok.cumpreDesde, '2026-02-05');
});

test('atingiu os mínimos: a idade da faixa seguinte (marrom aos 18 pela IBJJF)', () => {
  const roxa4 = g({ nivelId: 'roxa', grau: 4, data: '2024-01-01' });
  const jovem = avaliarMinimos({ sistema: IBJJF, atual: roxa4, datasDasPresencas: [], hoje: '2026-10-15', nascimento: '2009-02-01' });
  assert.deepEqual(jovem.faltam, ['idade']);
  const adulto = avaliarMinimos({ sistema: IBJJF, atual: roxa4, datasDasPresencas: [], hoje: '2026-10-15', nascimento: '2008-12-31' });
  assert.equal(adulto.cumpre, true);
  assert.equal(adulto.cumpreDesde, '2026-01-01');
});

test('na preta, os graus têm tempo fixo da federação (3 anos até o 3º)', () => {
  const preta = g({ nivelId: 'preta', grau: 0, data: '2024-01-01' });
  assert.deepEqual(avaliarMinimos({ sistema: IBJJF, atual: preta, datasDasPresencas: [], hoje: '2026-10-15', nascimento: '1980-01-01' }).faltam, ['tempo']);
  assert.equal(avaliarMinimos({ sistema: IBJJF, atual: preta, datasDasPresencas: [], hoje: '2027-01-01', nascimento: '1980-01-01' }).cumpre, true);
});

test('a lista "Atingiram os mínimos": só quem cumpre; há mais tempo primeiro; sem mínimos, por presenças; NUNCA gradua (R16.11)', () => {
  const lista = prontosParaAvaliar([
    { aluno: 'sem-minimo-poucas', avaliacao: avaliarMinimos({ sistema: IBJJF, atual: g({ nivelId: 'branca', grau: 1, data: '2026-09-01' }), datasDasPresencas: ['2026-09-10'], hoje: '2026-10-15' }) },
    { aluno: 'falta-tempo', avaliacao: avaliarMinimos({ sistema: IBJJF, atual: g({ nivelId: 'azul', grau: 4, data: '2026-01-01' }), datasDasPresencas: [], hoje: '2026-10-15', nascimento: '1990-01-01' }) },
    { aluno: 'cumpre-recente', avaliacao: avaliarMinimos({ sistema: IBJJF, atual: g({ nivelId: 'azul', grau: 4, data: '2024-09-01' }), datasDasPresencas: [], hoje: '2026-10-15', nascimento: '1990-01-01' }) },
    { aluno: 'cumpre-antigo', avaliacao: avaliarMinimos({ sistema: IBJJF, atual: g({ nivelId: 'azul', grau: 4, data: '2024-01-01' }), datasDasPresencas: [], hoje: '2026-10-15', nascimento: '1990-01-01' }) },
    { aluno: 'sem-minimo-muitas', avaliacao: avaliarMinimos({ sistema: IBJJF, atual: g({ nivelId: 'branca', grau: 2, data: '2026-08-01' }), datasDasPresencas: ['2026-08-02', '2026-08-03', '2026-08-04'], hoje: '2026-10-15' }) },
    { aluno: 'no-topo', avaliacao: avaliarMinimos({ sistema: IBJJF, atual: g({ nivelId: 'vermelha', grau: 0, data: '2000-01-01' }), datasDasPresencas: [], hoje: '2026-10-15' }) },
  ]);
  assert.deepEqual(lista.map((c) => c.aluno), ['cumpre-antigo', 'cumpre-recente', 'sem-minimo-muitas', 'sem-minimo-poucas']);
  // avaliar não cria graduação nenhuma: só o registro do professor cria
  assert.ok(lista.every((c) => !('graduacao' in c)));
});

test('registrar a graduação: data não futura, grau na régua, observação até 140 (R16.6)', () => {
  const base = { id: 'n1', academiaId: 'raca-fight', alunoId: 'lucas', modalidadeId: 'jiu-jitsu', sistema: IBJJF, hoje: '2026-10-15', graduadoPorId: 'marcio', origem: 'promocao' as const, registradaPorId: 'marcio', em: '2026-10-15T21:00:00-03:00' };
  const ok = registrarGraduacao({ ...base, passo: { nivelId: 'branca', grau: 3 }, data: '2026-10-15', observacao: '  Boa base de guarda.  ' });
  assert.equal(ok.grau, 3);
  assert.equal(ok.observacao, 'Boa base de guarda.');
  assert.throws(() => registrarGraduacao({ ...base, passo: { nivelId: 'branca', grau: 1 }, data: '2026-10-16' }), (e: unknown) => e instanceof ErroDeGraduacao && e.codigo === 'data_futura');
  assert.throws(() => registrarGraduacao({ ...base, passo: { nivelId: 'branca', grau: 5 }, data: '2026-10-15' }), (e: unknown) => e instanceof ErroDeGraduacao && e.codigo === 'grau_invalido');
  assert.throws(() => registrarGraduacao({ ...base, passo: { nivelId: 'coral', grau: 0 }, data: '2026-10-15' }), (e: unknown) => e instanceof ErroDeGraduacao && e.codigo === 'nivel_desconhecido');
  assert.throws(() => registrarGraduacao({ ...base, passo: { nivelId: 'branca', grau: 1 }, data: '2026-10-15', observacao: 'x'.repeat(141) }), (e: unknown) => e instanceof ErroDeGraduacao && e.codigo === 'observacao_longa');
  // faixa trazida de outra academia (R16.8)
  const anterior = registrarGraduacao({ ...base, passo: { nivelId: 'azul', grau: 1 }, data: '2025-06-01', origem: 'anterior', academiaDeOrigem: 'Equipe de fora' });
  assert.equal(anterior.origem, 'anterior');
  assert.equal(anterior.academiaDeOrigem, 'Equipe de fora');
});

test('a faixa inicial na primeira presença: o primeiro nível, grau 0 (R16.4)', () => {
  const i = graduacaoInicial({ id: 'i1', academiaId: 'raca-fight', alunoId: 'lucas', modalidadeId: 'jiu-jitsu', sistema: IBJJF, data: '2026-10-15', em: '2026-10-15T20:00:00-03:00' })!;
  assert.equal(i.nivelId, 'branca');
  assert.equal(i.grau, 0);
  assert.equal(i.origem, 'inicial');
});

test('o exame: resultado de cada um e fechar cria as graduações dos aprovados (R16.12)', () => {
  const exame: Exame = { id: 'ex1', academiaId: 'raca-fight', modalidadeId: 'jiu-jitsu', sistemaId: IBJJF.id, data: '2026-10-17', hora: '10:00', local: 'Tatame', avaliadorIds: ['marcio'], candidatos: [{ alunoId: 'bianca' }, { alunoId: 'lucas' }, { alunoId: 'davi' }] };
  let e = definirResultado(exame, 'bianca', 'aprovado', { nivelId: 'roxa', grau: 0 });
  e = definirResultado(e, 'lucas', 'nao_aprovado');
  assert.throws(() => fecharExame({ exame: e, sistema: IBJJF, hoje: '2026-10-17', porId: 'marcio', em: 'x', gerarId: () => 'id' }), (x: unknown) => x instanceof ErroDeGraduacao && x.codigo === 'sem_resultado');
  e = definirResultado(e, 'davi', 'faltou');
  let i = 0;
  const r = fecharExame({ exame: e, sistema: IBJJF, hoje: '2026-10-17', porId: 'marcio', em: '2026-10-17T12:00:00-03:00', gerarId: () => `ge${(i += 1)}` });
  assert.equal(r.graduacoes.length, 1);
  assert.equal(r.graduacoes[0]!.alunoId, 'bianca');
  assert.equal(r.graduacoes[0]!.origem, 'exame');
  assert.equal(r.graduacoes[0]!.exameId, 'ex1');
  assert.ok(r.exame.fechadoEm);
  assert.throws(() => definirResultado(r.exame, 'davi', 'aprovado'), (x: unknown) => x instanceof ErroDeGraduacao && x.codigo === 'exame_fechado');
});

test('as presenças que contam para os mínimos são as DEPOIS da graduação', () => {
  assert.deepEqual(datasDepoisDe(['2026-03-12', '2026-03-20', '2026-03-01'], '2026-03-12'), ['2026-03-20']);
  assert.deepEqual(datasDepoisDe(['2026-03-12', '2026-03-01'], null), ['2026-03-01', '2026-03-12']);
});
