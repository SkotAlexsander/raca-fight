import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  alternarParticipacao,
  atletasVisiveis,
  consentimentoInicial,
  definirAparecerEmAtletas,
  eventosPassados,
  eventosVisiveis,
  lutasVisiveis,
  proximosEventos,
  textoDoResultado,
  tituloDaLuta,
  validarLinkDoEvento,
  type EventoDaAcademia,
  type Luta,
} from './eventos.ts';

const evento = (m: Partial<EventoDaAcademia>): EventoDaAcademia => ({ id: 'e', academiaId: 'raca-fight', nome: 'Noite de lutas', tipo: 'luta', modalidadeIds: ['muay-thai'], data: '2026-11-21', local: 'Lomba do Pinheiro', publico: 'aberto', criadoPorId: 'diego', criadoEm: 'x', ...m });
const luta = (m: Partial<Luta>): Luta => ({ id: 'l', academiaId: 'raca-fight', eventoId: 'e', atletaId: 'mateus', modalidadeId: 'muay-thai', adversario: 'Fábio Lemos', categoria: '60 kg', nivel: 'semi_pro', data: '2026-11-21', local: 'Lomba do Pinheiro', ...m });

test('o consentimento de Atletas nasce DESLIGADO e guarda a data (R18.6)', () => {
  const c = consentimentoInicial('mateus', 'raca-fight');
  assert.equal(c.ligado, false);
  const ligado = definirAparecerEmAtletas(c, true, '2026-10-15T10:00:00-03:00');
  assert.deepEqual(ligado, { alunoId: 'mateus', academiaId: 'raca-fight', ligado: true, em: '2026-10-15T10:00:00-03:00' });
  assert.deepEqual(atletasVisiveis([c]), []);
  assert.deepEqual(atletasVisiveis([ligado]), ['mateus']);
  // o menor sem a autorização do responsável não aparece
  assert.deepEqual(atletasVisiveis([ligado], () => false), []);
});

test('a luta de quem não está em Atletas só a equipe vê — nem anônima (R18.6)', () => {
  const lutas = [luta({ id: 'a', atletaId: 'mateus' }), luta({ id: 'b', atletaId: 'otavio' })];
  const consent = [definirAparecerEmAtletas(consentimentoInicial('mateus', 'raca-fight'), true, 'x'), consentimentoInicial('otavio', 'raca-fight')];
  assert.deepEqual(lutasVisiveis(lutas, consent, 'equipe').map((l) => l.id), ['a', 'b']);
  assert.deepEqual(lutasVisiveis(lutas, consent, 'aluno').map((l) => l.id), ['a']);
  assert.deepEqual(lutasVisiveis(lutas, consent, 'vitrine').map((l) => l.id), ['a']);
  // desligou: some na hora
  const desligou = [definirAparecerEmAtletas(consent[0]!, false, 'y'), consent[1]!];
  assert.deepEqual(lutasVisiveis(lutas, desligou, 'aluno'), []);
});

test('a vitrine vê só o evento aberto; próximos em ordem e passados do mais novo', () => {
  const es = [evento({ id: 'interno', publico: 'alunos', data: '2026-10-20' }), evento({ id: 'luta', data: '2026-11-21' }), evento({ id: 'velho', data: '2026-09-01' })];
  assert.deepEqual(eventosVisiveis(es, 'vitrine').map((e) => e.id), ['luta', 'velho']);
  assert.equal(eventosVisiveis(es, 'aluno').length, 3);
  assert.deepEqual(proximosEventos(es, '2026-10-15').map((e) => e.id), ['interno', 'luta']);
  assert.deepEqual(eventosPassados(es, '2026-10-15').map((e) => e.id), ['velho']);
});

test('link no evento: só https e só se a academia aceitar (L22, parâmetro)', () => {
  assert.equal(validarLinkDoEvento('', false), null);
  assert.equal(validarLinkDoEvento('https://inscricao.exemplo.com.br/x', true), null);
  assert.equal(validarLinkDoEvento('https://inscricao.exemplo.com.br/x', false), 'nao_aceito');
  assert.equal(validarLinkDoEvento('http://inscricao.exemplo.com.br', true), 'so_https');
  assert.equal(validarLinkDoEvento('javascript:alert(1)', true), 'so_https');
  assert.equal(validarLinkDoEvento('https://localhost', true), 'invalido');
});

test('"Vou participar" marca e desmarca (R18.3)', () => {
  assert.deepEqual(alternarParticipacao([], 'lucas'), ['lucas']);
  assert.deepEqual(alternarParticipacao(['lucas', 'ana'], 'lucas'), ['ana']);
});

test('o título e o resultado da luta, sem ranking (R18.4, R18.7)', () => {
  assert.equal(tituloDaLuta(luta({}), 'Mateus'), 'Mateus vs Fábio Lemos · 60 kg · semi-pró');
  assert.equal(textoDoResultado(luta({})), null);
  assert.equal(textoDoResultado(luta({ resultado: 'vitoria', como: 'pontos' })), 'Vitória por pontos');
  assert.equal(textoDoResultado(luta({ resultado: 'sem_resultado', como: 'decisao' })), 'Sem resultado');
});
