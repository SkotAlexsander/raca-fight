/**
 * Apoio dos testes de `dados/` (P12, agente AM2): a presença de exemplo que
 * entra na fila no lugar do treino realizado, e a leitura dela no aparelho.
 * Só os testes usam este arquivo.
 */
import type { Id } from '../dominio/tipos.ts';
import type { Presenca } from '../dominio/presenca/presenca.ts';
import type { ArmazenamentoLocal } from './armazenamento/tipos.ts';
import { COLECAO_DE_PRESENCAS } from './fila.ts';

/** Uma presença de check-in, pendente, de `alunoId` na aula `aula` (o id é `aula|aluno`). */
export function presencaDeTeste(aula: string, alunoId: Id = 'ana', m: Partial<Presenca> = {}): Presenca {
  return {
    id: `${aula}|${alunoId}`,
    academiaId: 'raca-fight',
    aulaId: aula,
    turmaId: 'muay-thai-noite-1',
    data: '2026-10-14',
    alunoId,
    modalidadeId: 'muay-thai',
    origem: 'checkin',
    estado: 'pendente',
    registradaEm: '2026-10-14T19:41:00-03:00',
    registradaPorId: alunoId,
    atualizadaEm: '2026-10-14T19:41:00-03:00',
    atualizadaPorId: alunoId,
    pelaEquipe: false,
    ...m,
  };
}

/** As presenças guardadas no aparelho (a coleção `presencas`), de um aluno. */
export function presencasNoAparelho(arm: ArmazenamentoLocal, alunoId: Id): Presenca[] {
  return arm
    .colecao(COLECAO_DE_PRESENCAS)
    .map(([, v]) => v as Presenca)
    .filter((p) => p && typeof p === 'object' && p.alunoId === alunoId);
}
