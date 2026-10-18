/**
 * Revisão AE (P11): a adesão da dieta que o personal lê (mapa, "Aluno Plus
 * (personal)"; texto 11 do AC: "1 de 35 refeições marcadas", nunca "3 %") e a
 * ordem de cada filtro da lista de Alunos com o selo "Sumiu esta semana" (R13.8).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import type { PlanoDeDieta, RefeicaoRegistrada } from './tipos.ts';
import { adesaoDaDieta, diasEntreDatas, motivosDoNaoSegui, ordenarPorFiltro, sumiuEstaSemana, type AlunoParaOrdenar } from './acompanhamento.ts';

const plano: PlanoDeDieta = {
  id: 'plano',
  alunoId: 'ana',
  academiaId: 'acad',
  personalId: 'julia',
  assinaturaId: 'ass',
  nome: 'Plano de outubro',
  inicio: '2026-09-01',
  estado: 'em_vigor',
  refeicoes: [1, 2, 3, 4, 5, 6].map((n) => ({ id: `r${n}`, planoId: 'plano', ordem: n, nome: `R${n}`, opcional: n === 6, itens: [] })),
  criadoEm: '2026-09-01T10:00:00-03:00',
  atualizadoEm: '2026-09-01T10:00:00-03:00',
} as PlanoDeDieta;

const marca = (refeicaoId: string, data: string, estado: RefeicaoRegistrada['estado'] = 'feita', motivo?: string): RefeicaoRegistrada => ({
  id: `${refeicaoId}-${data}`,
  alunoId: 'ana',
  academiaId: 'acad',
  planoId: 'plano',
  refeicaoId,
  data,
  estado,
  ...(motivo ? { motivo } : {}),
  registradaEm: `${data}T12:00:00-03:00`,
});

describe('diasEntreDatas', () => {
  test('conta dias de calendário, sem fuso', () => {
    assert.equal(diasEntreDatas('2026-10-01', '2026-10-11'), 10);
    assert.equal(diasEntreDatas('2026-10-11', '2026-10-11'), 0);
    assert.equal(diasEntreDatas('2026-02-28', '2026-03-01'), 1);
    assert.equal(diasEntreDatas('2026-10-12', '2026-10-11'), -1);
  });
});

describe('adesaoDaDieta', () => {
  test('5 refeições que contam × 7 dias = 35 planejadas; a opcional não conta (R3.7)', () => {
    const r = adesaoDaDieta(plano, [marca('r1', '2026-10-11'), marca('r6', '2026-10-11')], '2026-10-11', 7);
    assert.deepEqual(r, { marcadas: 1, planejadas: 35 });
  });
  test('"não segui" não é marcada como feita, e a marca fora da janela não entra', () => {
    const r = adesaoDaDieta(plano, [marca('r1', '2026-10-11', 'nao_segui'), marca('r2', '2026-10-04'), marca('r3', '2026-10-05')], '2026-10-11', 7);
    assert.deepEqual(r, { marcadas: 1, planejadas: 35 });
  });
  test('30 dias', () => {
    assert.equal(adesaoDaDieta(plano, [], '2026-10-11', 30).planejadas, 150);
  });
  test('plano que começou no meio da janela: só os dias de plano contam', () => {
    const r = adesaoDaDieta({ ...plano, inicio: '2026-10-09' }, [marca('r1', '2026-10-08'), marca('r1', '2026-10-09')], '2026-10-11', 7);
    assert.deepEqual(r, { marcadas: 1, planejadas: 15 });
  });
  test('sem plano: nada planejado', () => {
    assert.deepEqual(adesaoDaDieta(null, [marca('r1', '2026-10-11')], '2026-10-11', 7), { marcadas: 0, planejadas: 0 });
  });
});

describe('motivosDoNaoSegui', () => {
  test('os motivos escritos, do mais novo ao mais velho, dentro da janela', () => {
    const r = motivosDoNaoSegui([marca('r1', '2026-10-02', 'nao_segui', 'Viagem'), marca('r2', '2026-10-10', 'nao_segui', 'Almocei fora'), marca('r3', '2026-10-10', 'nao_segui'), marca('r4', '2026-08-01', 'nao_segui', 'Antigo')], '2026-10-11', 30);
    assert.deepEqual(r, [
      { data: '2026-10-10', refeicaoId: 'r2', motivo: 'Almocei fora' },
      { data: '2026-10-02', refeicaoId: 'r1', motivo: 'Viagem' },
    ]);
  });
});

describe('sumiuEstaSemana (R13.8)', () => {
  test('cruzou os 14 dias nos últimos 7: de 14 a 20 dias sem treinar', () => {
    assert.equal(sumiuEstaSemana({ diasSemTreinar: 13, diasDeVinculo: 400 }), false);
    assert.equal(sumiuEstaSemana({ diasSemTreinar: 14, diasDeVinculo: 400 }), true);
    assert.equal(sumiuEstaSemana({ diasSemTreinar: 20, diasDeVinculo: 400 }), true);
    assert.equal(sumiuEstaSemana({ diasSemTreinar: 21, diasDeVinculo: 400 }), false);
  });
  test('quem nunca treinou conta do dia em que entrou', () => {
    assert.equal(sumiuEstaSemana({ diasSemTreinar: null, diasDeVinculo: 15 }), true);
    assert.equal(sumiuEstaSemana({ diasSemTreinar: null, diasDeVinculo: 200 }), false);
  });
});

describe('ordenarPorFiltro (R13.8)', () => {
  const a = (nome: string, diasSemTreinar: number | null, diasDeVinculo: number, pedidoEm?: string): AlunoParaOrdenar => ({ nome, diasSemTreinar, diasDeVinculo, pedidoEm });
  const lista = [a('Bruno', 200, 900), a('Carla', 15, 300, '2026-10-09T10:00:00-03:00'), a('Ana', null, 30, '2026-10-02T10:00:00-03:00'), a('Davi', 40, 60)];
  const nomes = (l: AlunoParaOrdenar[]) => l.map((x) => x.nome);

  test('sumidos: quem sumiu há menos tempo primeiro (nunca treinou conta do vínculo)', () => {
    assert.deepEqual(nomes(ordenarPorFiltro('sumidos', lista)), ['Carla', 'Ana', 'Davi', 'Bruno']);
  });
  test('pediu treino: o pedido mais antigo primeiro', () => {
    assert.deepEqual(nomes(ordenarPorFiltro('pediuTreino', lista.filter((x) => x.pedidoEm))), ['Ana', 'Carla']);
  });
  test('pendentes: o pedido de entrada mais antigo (o maior vínculo) primeiro', () => {
    assert.deepEqual(nomes(ordenarPorFiltro('pendentes', lista)), ['Bruno', 'Carla', 'Davi', 'Ana']);
  });
  test('novos: o vínculo mais antigo primeiro', () => {
    assert.deepEqual(nomes(ordenarPorFiltro('novos', [a('Ana', 1, 30), a('Davi', 1, 60)])), ['Davi', 'Ana']);
  });
  test('todos, plus, sem treino: por nome, com acento no lugar certo', () => {
    assert.deepEqual(nomes(ordenarPorFiltro('todos', [a('Érica', 1, 1), a('Davi', 1, 1), a('Fábio', 1, 1)])), ['Davi', 'Érica', 'Fábio']);
  });
  test('empate: por nome', () => {
    assert.deepEqual(nomes(ordenarPorFiltro('sumidos', [a('Zeca', 20, 100), a('Bia', 20, 100)])), ['Bia', 'Zeca']);
  });
  test('não muda a lista que recebeu', () => {
    const copia = [...lista];
    ordenarPorFiltro('sumidos', lista);
    assert.deepEqual(lista, copia);
  });
});
