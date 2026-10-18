import { test } from 'node:test';
import assert from 'node:assert/strict';
import { definirAutorizacaoDeImagem, ErroDoDependente, idadeEmAnos, novoDependente, oQueOProfessorVe, podeAparecerEmAtletas, podeMostrarFoto, precisaSerDependente, primeiroNome } from './kids.ts';

const base = { id: 'pedro', responsavelId: 'carla', academiaId: 'raca-fight', nome: '  Pedro Nunes ', dataNascimento: '2017-04-09', hoje: '2026-10-15', em: '2026-10-15T10:00:00-03:00' };

test('o dependente nasce com a autorização de imagem DESLIGADA e a saúde escondida da equipe (R20.5, R20.6)', () => {
  const d = novoDependente({ ...base, saude: 'Asma leve' });
  assert.equal(d.nome, 'Pedro Nunes');
  assert.deepEqual(d.autorizacaoDeImagem, { ligada: false });
  assert.equal(d.saudeVisivelParaEquipe, false);
  assert.equal(podeMostrarFoto(d), false);
  assert.deepEqual(oQueOProfessorVe(d), { nome: 'Pedro' });
});

test('o responsável liga e desliga a autorização de imagem, com a data guardada', () => {
  const d = novoDependente(base);
  const ligada = definirAutorizacaoDeImagem(d, true, '2026-10-16T09:00:00-03:00');
  assert.deepEqual(ligada.autorizacaoDeImagem, { ligada: true, em: '2026-10-16T09:00:00-03:00' });
  assert.equal(podeMostrarFoto(ligada), true);
  const desligada = definirAutorizacaoDeImagem(ligada, false, '2026-10-17T09:00:00-03:00');
  assert.equal(podeMostrarFoto(desligada), false);
  assert.equal(desligada.autorizacaoDeImagem.em, '2026-10-17T09:00:00-03:00');
});

test('o menor só aparece em Atletas querendo E com a autorização do responsável (R18.6, R20.6)', () => {
  const d = novoDependente(base);
  assert.equal(podeAparecerEmAtletas(d, true), false);
  assert.equal(podeAparecerEmAtletas(definirAutorizacaoDeImagem(d, true, 'x'), true), true);
  assert.equal(podeAparecerEmAtletas(definirAutorizacaoDeImagem(d, true, 'x'), false), false);
});

test('com a saúde autorizada, o professor vê a restrição na chamada; nunca o telefone (R20.7)', () => {
  const d = { ...novoDependente({ ...base, saude: 'Alergia a amendoim' }), saudeVisivelParaEquipe: true };
  assert.deepEqual(oQueOProfessorVe(d), { nome: 'Pedro', saude: 'Alergia a amendoim' });
  assert.ok(!('telefone' in oQueOProfessorVe(d)));
});

test('o cadastro recusa nome vazio, nascimento no futuro e maior de idade', () => {
  assert.throws(() => novoDependente({ ...base, nome: '  ' }), (e: unknown) => e instanceof ErroDoDependente && e.codigo === 'nome_vazio');
  assert.throws(() => novoDependente({ ...base, dataNascimento: '2027-01-01' }), (e: unknown) => e instanceof ErroDoDependente && e.codigo === 'nascimento_futuro');
  assert.throws(() => novoDependente({ ...base, dataNascimento: '2008-10-15' }), (e: unknown) => e instanceof ErroDoDependente && e.codigo === 'maior_de_idade');
  assert.throws(() => novoDependente({ ...base, saude: 'x'.repeat(281) }), (e: unknown) => e instanceof ErroDoDependente && e.codigo === 'saude_longa');
});

test('até 15 sempre dependente; 16 e 17 seguem a regra que o Alex decidir (L27); 18, nunca', () => {
  assert.equal(precisaSerDependente('2011-01-01', '2026-10-15', 'conta_propria'), true);
  assert.equal(precisaSerDependente('2010-01-01', '2026-10-15', 'conta_propria'), false);
  assert.equal(precisaSerDependente('2010-01-01', '2026-10-15', 'dependente'), true);
  assert.equal(precisaSerDependente('2008-01-01', '2026-10-15', 'dependente'), false);
});

test('idade e primeiro nome', () => {
  assert.equal(idadeEmAnos('2017-10-16', '2026-10-15'), 8);
  assert.equal(idadeEmAnos('2017-10-15', '2026-10-15'), 9);
  assert.equal(primeiroNome('  Ana Paula Reis '), 'Ana');
});
