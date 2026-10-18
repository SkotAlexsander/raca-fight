/**
 * A regra da visão (03-DECISOES-TECNICAS.md, seção 1): a visão vem do VÍNCULO.
 * Veio de `dados/visao.test.ts` (agente X) com a regra, para o domínio
 * (agente AA, P11).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Vinculo } from './tipos.ts';
import { decidirDestino, visaoDoPapel } from './papel.ts';

const v = (id: string, papel: Vinculo['papel'], estado: Vinculo['estado'] = 'ativo', usuarioId = 'u'): Vinculo => ({ id, usuarioId, academiaId: 'a', papel, estado, desde: '2026-01-01' });

test('sem sessão: entrada', () => {
  assert.deepEqual(decidirDestino(null, [v('1', 'aluno')], null), { tipo: 'entrada' });
});

test('sem vínculo ativo: aluno sem academia (R8.4), nada trava', () => {
  assert.deepEqual(decidirDestino({ usuarioId: 'u' }, [v('1', 'aluno', 'pendente')], null), { tipo: 'visao', visao: 'aluno', vinculoId: null });
});

test('um vínculo: a visão do papel', () => {
  assert.deepEqual(decidirDestino({ usuarioId: 'u' }, [v('1', 'personal')], null), { tipo: 'visao', visao: 'academia', vinculoId: '1' });
  assert.deepEqual(decidirDestino({ usuarioId: 'u' }, [v('1', 'aluno'), v('2', 'dono', 'encerrado')], null), { tipo: 'visao', visao: 'aluno', vinculoId: '1' });
});

test('dois vínculos: o último escolhido, ou "Entrar como…"', () => {
  const vs = [v('1', 'aluno'), v('2', 'instrutor')];
  assert.deepEqual(decidirDestino({ usuarioId: 'u' }, vs, '2'), { tipo: 'visao', visao: 'academia', vinculoId: '2' });
  assert.deepEqual(decidirDestino({ usuarioId: 'u' }, vs, null), { tipo: 'escolher' });
  assert.deepEqual(decidirDestino({ usuarioId: 'u' }, vs, 'encerrado-ha-tempo'), { tipo: 'escolher' });
});

test('vínculo de outra conta no aparelho não conta', () => {
  assert.deepEqual(decidirDestino({ usuarioId: 'u' }, [v('1', 'dono', 'ativo', 'outra')], null), { tipo: 'visao', visao: 'aluno', vinculoId: null });
});

test('visaoDoPapel: só o aluno vai para a visão do aluno', () => {
  assert.equal(visaoDoPapel('aluno'), 'aluno');
  for (const p of ['recepcao', 'instrutor', 'personal', 'dono'] as const) assert.equal(visaoDoPapel(p), 'academia');
});

test('vínculo pendente de equipe não abre a visão da academia (F13.4)', () => {
  assert.deepEqual(decidirDestino({ usuarioId: 'u' }, [v('1', 'instrutor', 'pendente')], null), { tipo: 'visao', visao: 'aluno', vinculoId: null });
});

test('o último escolhido que foi encerrado cai para o único ativo que sobrou', () => {
  assert.deepEqual(decidirDestino({ usuarioId: 'u' }, [v('1', 'aluno'), v('2', 'personal', 'encerrado')], '2'), { tipo: 'visao', visao: 'aluno', vinculoId: '1' });
});

test('equipe de luta: o professor abre o Hoje; a recepção, o Hoje dela; o dono, "Abra o app Admin"', async () => {
  const { entradaDaEquipe } = await import('./papel.ts');
  assert.equal(entradaDaEquipe(new Set(['instrutor'])), 'professor');
  assert.equal(entradaDaEquipe(new Set(['recepcao'])), 'recepcao');
  assert.equal(entradaDaEquipe(new Set(['dono'])), 'admin');
  // o dono que dá aula entra como professor
  assert.equal(entradaDaEquipe(new Set(['dono', 'instrutor'])), 'professor');
  // com o Plus desligado, o personal é professor
  assert.equal(entradaDaEquipe(new Set(['personal'])), 'professor');
  assert.equal(entradaDaEquipe(new Set(['recepcao', 'instrutor'])), 'professor');
});
