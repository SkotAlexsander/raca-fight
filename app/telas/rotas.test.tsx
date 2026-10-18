/**
 * As abas e as rotas do app da equipe (P12, agente AM2). A aba que a entrada
 * não tem some da barra E não abre pelo endereço (revisão AB, P11): a
 * recepção não abre Turmas nem Graduação; o professor não abre Experimentais;
 * o aviso para todos é do dono e da recepção.
 */
import type { PapelNaAcademia } from '@/dominio/tipos';
import { ABAS_DO_ALUNO, abasDaEquipePara, podeAbrirNaEquipe } from './rotas';

const de = (...p: PapelNaAcademia[]) => new Set<PapelNaAcademia>(p);

test('as cinco abas do aluno, com os nomes do Instagram (L32)', () => {
  expect(ABAS_DO_ALUNO.map((a) => a.rotulo)).toEqual(['Início', 'Horários', 'Treinos', 'Academia', 'Perfil']);
});

test('professor: Hoje · Turmas · Alunos · Graduação · Perfil; recepção: Hoje · Alunos · Experimentais · Perfil', () => {
  expect(abasDaEquipePara(de('instrutor')).map((a) => a.rotulo)).toEqual(['Hoje', 'Turmas', 'Alunos', 'Graduação', 'Perfil']);
  expect(abasDaEquipePara(de('recepcao')).map((a) => a.rotulo)).toEqual(['Hoje', 'Alunos', 'Experimentais', 'Perfil']);
  // o dono que dá aula entra como professor
  expect(abasDaEquipePara(de('dono', 'instrutor')).map((a) => a.rota)).toContain('graduacao');
});

test.each([
  ['/turmas', ['recepcao'], false],
  ['/turmas/mma', ['instrutor'], true],
  ['/graduacao', ['recepcao'], false],
  ['/graduacao', ['instrutor'], true],
  ['/experimentais', ['instrutor'], false],
  ['/experimentais/nova', ['recepcao'], true],
  ['/alunos/novo-aviso', ['recepcao'], true],
  ['/alunos/novo-aviso', ['instrutor'], false],
  ['/alunos/usuario-ana/graduar', ['recepcao'], false],
  ['/alunos/usuario-ana/graduar', ['instrutor'], true],
  ['/hoje', ['recepcao'], true],
  ['/hoje/aula/x', ['instrutor'], true],
  ['/perfil-da-equipe', ['instrutor'], true],
] as [string, PapelNaAcademia[], boolean][])('%s com %j: %s', (caminho, papeis, pode) => {
  expect(podeAbrirNaEquipe(de(...papeis), caminho)).toBe(pode);
});

test('o professor abre o aviso DA TURMA (com ?turma), nunca o aviso para todos (R22.1, L31)', () => {
  expect(podeAbrirNaEquipe(de('instrutor'), '/alunos/novo-aviso', { turma: 'mma' })).toBe(true);
  expect(podeAbrirNaEquipe(de('instrutor'), '/alunos/novo-aviso', { turma: '' })).toBe(false);
  expect(podeAbrirNaEquipe(de('instrutor'), '/alunos/avisos', { turma: 'mma' })).toBe(false);
  expect(podeAbrirNaEquipe(de('recepcao'), '/alunos/novo-aviso', { turma: 'mma' })).toBe(true);
});
