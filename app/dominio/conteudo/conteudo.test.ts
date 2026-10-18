import { test } from 'node:test';
import assert from 'node:assert/strict';
import { duracaoDaTecnica, linkDeVideoValido, perguntasEmOrdem, tecnicasVisiveis, validarPerguntaFrequente, type Tecnica } from './conteudo.ts';

const tecnica = (m: Partial<Tecnica>): Tecnica => ({ id: 't', academiaId: 'raca-fight', modalidadeId: 'muay-thai', titulo: 'Golpes básicos', nivel: 'iniciante', duracaoSegundos: 240, professorId: 'diego', data: '2026-10-01', aberta: false, estado: 'publicada', temMenor: false, ...m });

test('técnicas: o aluno ativo vê as publicadas; sem conta, só as abertas; a equipe vê os rascunhos (R21.2, R21.4)', () => {
  const ts = [tecnica({ id: 'pub' }), tecnica({ id: 'aberta', aberta: true, data: '2026-10-05' }), tecnica({ id: 'rascunho', estado: 'rascunho' }), tecnica({ id: 'arquivada', estado: 'arquivada' })];
  assert.deepEqual(tecnicasVisiveis(ts, { equipe: false, vinculoAtivo: true }).map((t) => t.id), ['aberta', 'pub']);
  assert.deepEqual(tecnicasVisiveis(ts, { equipe: false, vinculoAtivo: false }).map((t) => t.id), ['aberta']);
  assert.deepEqual(tecnicasVisiveis(ts, { equipe: true, vinculoAtivo: true }).map((t) => t.id).sort(), ['aberta', 'pub', 'rascunho']);
});

test('vídeo com menor só aparece com a autorização do responsável (R21.5)', () => {
  const ts = [tecnica({ id: 'kids', temMenor: true })];
  assert.deepEqual(tecnicasVisiveis(ts, { equipe: false, vinculoAtivo: true }), []);
  assert.equal(tecnicasVisiveis(ts, { equipe: false, vinculoAtivo: true }, () => true).length, 1);
});

test('Raça Responde: pergunta até 120, resposta até 600, em ordem (R22.3)', () => {
  assert.deepEqual(validarPerguntaFrequente({ pergunta: 'Preciso ter kimono?', resposta: 'Na aula experimental, não.' }), []);
  assert.deepEqual(validarPerguntaFrequente({ pergunta: ' ', resposta: 'x'.repeat(601) }), ['pergunta_vazia', 'resposta_longa']);
  assert.deepEqual(validarPerguntaFrequente({ pergunta: 'x'.repeat(121), resposta: '' }), ['pergunta_longa', 'resposta_vazia']);
  const ps = perguntasEmOrdem([{ id: 'b', academiaId: 'a', pergunta: 'B', resposta: 'b', ordem: 2 }, { id: 'a', academiaId: 'a', pergunta: 'A', resposta: 'a', ordem: 1 }]);
  assert.deepEqual(ps.map((p) => p.id), ['a', 'b']);
});

test('a duração e o link do vídeo (L30: o link, só https)', () => {
  assert.equal(duracaoDaTecnica(240), '4 min');
  assert.equal(duracaoDaTecnica(45), '45 s');
  assert.equal(linkDeVideoValido('https://www.instagram.com/reel/abc'), true);
  assert.equal(linkDeVideoValido('http://www.instagram.com/reel/abc'), false);
  assert.equal(linkDeVideoValido('javascript:alert(1)'), false);
});
