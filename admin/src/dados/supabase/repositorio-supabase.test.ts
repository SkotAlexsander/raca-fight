/**
 * O repositório Supabase sem Supabase: um cliente falso confere que cada
 * intenção vira UMA chamada de função (a transação), com os nomes do banco, e
 * que sem rede nada é enviado. Não substitui rodar as migrações num projeto
 * de verdade (pendência no relatório AM1).
 */

import { describe, expect, test } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ErroDeRegra, ErroSemConexao, ErroSemPermissao } from '../tipos.ts';
import { doBanco, paraBanco, paraCamel, paraSnake } from './mapear.ts';
import { criarRepositorioSupabase, traduzirErro } from './repositorio-supabase.ts';

function clienteFalso(respostaRpc: { data?: unknown; error?: unknown } = { data: 1 }) {
  const chamadas: { rpc: string; args: unknown }[] = [];
  const consulta = (tabela: string) => {
    const c = {
      select: () => c, eq: () => c, range: async () => ({ data: tabela === 'lancamentos' ? [{ id: 'l1', academia_id: 'a', data: '2026-10-05', descricao: 'Luvas', tipo: 'entrada', valor_centavos: 19000, situacao: 'pago', origem: 'manual', estimado: false, arquivado: false, categoria_id: null, criado_por: 'u', criado_em: 'x', atualizado_em: 'x' }] : [], error: null }),
      single: async () => ({ data: { id: 'a', nome: 'Raça Fight Gravataí' }, error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
      upsert: async (linha: unknown) => { chamadas.push({ rpc: `upsert:${tabela}`, args: linha }); return { error: null }; },
    };
    return c;
  };
  const cliente = { from: consulta, rpc: async (nome: string, args: unknown) => { chamadas.push({ rpc: nome, args }); return respostaRpc; } } as unknown as SupabaseClient;
  return { cliente, chamadas };
}

describe('o repositório Supabase', () => {
  test('carrega as tabelas em camelCase, sem os nulos, e com as regras provisórias quando ainda não há linha', async () => {
    const { cliente } = clienteFalso();
    const r = criarRepositorioSupabase({ cliente, academiaId: 'a', agora: () => '2026-10-15T10:00:00-03:00' });
    const d = await r.carregar();
    expect(d.lancamentos[0]).toMatchObject({ id: 'l1', valorCentavos: 19000, descricao: 'Luvas' });
    expect('categoriaId' in d.lancamentos[0]!).toBe(false);
    expect(d.regras.provisorio).toBe(true);
    expect(d.academia.nome).toBe('Raça Fight Gravataí');
  });

  test('cada intenção é uma função do banco (uma transação)', async () => {
    const { cliente, chamadas } = clienteFalso();
    const r = criarRepositorioSupabase({ cliente, academiaId: 'a', agora: () => 'x', online: () => true });
    await r.marcarComoPaga('c1', { data: '2026-10-15', forma: 'pix' });
    await r.fecharMes('2026-09');
    await r.reabrirMes('2026-09', 'faltou a luva');
    await r.desfazerPagamento('c1');
    expect(chamadas.map((c) => c.rpc)).toEqual(['marcar_como_paga', 'fechar_mes', 'reabrir_mes', 'desfazer_pagamento']);
    expect(chamadas[0]!.args).toEqual({ p_cobranca: 'c1', p_data: '2026-10-15', p_forma: 'pix', p_valor: null });
    expect(chamadas[2]!.args).toEqual({ p_academia: 'a', p_competencia: '2026-09', p_motivo: 'faltou a luva' });
  });

  test('sem rede, nada vai ao servidor e a frase diz que nada foi gravado', async () => {
    const { cliente, chamadas } = clienteFalso();
    const r = criarRepositorioSupabase({ cliente, academiaId: 'a', agora: () => 'x', online: () => false });
    await expect(r.fecharMes('2026-09')).rejects.toBeInstanceOf(ErroSemConexao);
    await expect(r.fecharMes('2026-09')).rejects.toThrow('Sem conexão: nada foi gravado.');
    expect(chamadas).toHaveLength(0);
  });

  test('o erro do banco vira frase, sem a linha recusada nem o detalhe do servidor', () => {
    expect(traduzirErro({ message: 'mes_fechado', details: '2026-09', code: 'P0001' }).message).toBe('Setembro de 2026 está fechado. Reabra o mês para mudar.');
    expect(traduzirErro({ message: 'pagamento_parcial' })).toBeInstanceOf(ErroDeRegra);
    expect(traduzirErro({ code: '42501', message: 'permission denied for table lancamentos' })).toBeInstanceOf(ErroSemPermissao);
    const cru = traduzirErro({ code: 'XX000', message: 'Failing row contains (l1, 19000, Luvas…)' });
    expect(cru.message).not.toMatch(/19000|Luvas|Failing/);
    expect(traduzirErro(new TypeError('Failed to fetch'))).toBeInstanceOf(ErroSemConexao);
  });

  test('camelCase ↔ snake_case só no primeiro nível', () => {
    expect(paraSnake('gerarSozinhoNoDia1')).toBe('gerar_sozinho_no_dia1');
    expect(paraCamel('a_receber_em_aberto')).toBe('aReceberEmAberto');
    expect(paraBanco({ valorCentavos: 1, reparticao: [{ modalidadeId: 'm', centavos: 1 }], observacao: undefined })).toEqual({ valor_centavos: 1, reparticao: [{ modalidadeId: 'm', centavos: 1 }] });
    expect(doBanco({ pessoa_id: null, data_nascimento: '2010-01-01' })).toEqual({ dataNascimento: '2010-01-01' });
  });
});

describe('AO/AU — as funções novas do banco', () => {
  test('o lote é marcar_como_pagas, e matricular do funil é matricular_interessado (uma transação cada)', async () => {
    const { cliente, chamadas } = clienteFalso();
    const r = criarRepositorioSupabase({ cliente, academiaId: 'a', agora: () => 'x', online: () => true });
    await r.marcarComoPagas(['c1', 'c2'], { data: '2026-10-15', forma: 'pix' });
    const pessoa = { id: 'p1', academiaId: 'a', nome: 'Rafaela', ehAluno: true, ehFuncionario: false, criadaEm: 'x', atualizadaEm: 'x' };
    const matricula = { id: 'm1', academiaId: 'a', pessoaId: 'p1', pagadorPessoaId: 'p1', planoId: 'pl', inicio: '2026-10-15', estado: 'ativa' as const, diaDeVencimento: 15, descontos: [] };
    await r.matricularInteressado({ interessado: { id: 'i1', academiaId: 'a', nome: 'Rafaela', modalidadeIds: [], contatoEm: '2026-10-01' } as never, experimentais: [], pessoa, matricula });
    expect(chamadas.map((c) => c.rpc)).toEqual(['marcar_como_pagas', 'matricular_interessado']);
    expect(chamadas[0]!.args).toEqual({ p_cobrancas: ['c1', 'c2'], p_data: '2026-10-15', p_forma: 'pix' });
    expect(chamadas[1]!.args).toMatchObject({ p_academia: 'a', p_interessado: 'i1', p_pessoa: { id: 'p1', nome: 'Rafaela' }, p_matricula: { id: 'm1', plano_id: 'pl', dia_de_vencimento: 15 }, p_cobrancas: [] });
  });

  test('a turma grava a linha da turma e os horários na tabela deles, com turma_id', async () => {
    const { cliente, chamadas } = clienteFalso();
    const r = criarRepositorioSupabase({ cliente, academiaId: 'a', agora: () => 'x', online: () => true });
    await r.salvar('turmas', { id: 't1', academiaId: 'a', nome: 'Boxe', modalidadeIds: ['m'], publico: 'adulto', nivel: 'todos', professorId: null, auxiliarIds: [], capacidade: null, ativa: true, horarios: [{ id: 'h1', dia: 'ter', inicio: '21:00', duracaoMinutos: 60 }] });
    const turma = chamadas.find((c) => c.rpc === 'upsert:turmas')!.args as Record<string, unknown>;
    expect(turma).toMatchObject({ id: 't1', nome: 'Boxe', modalidade_ids: ['m'] });
    expect('horarios' in turma).toBe(false);
    expect(chamadas.find((c) => c.rpc === 'upsert:horarios')!.args).toEqual([{ id: 'h1', academia_id: 'a', turma_id: 't1', dia: 'ter', inicio: '21:00', duracao_minutos: 60, ativo: true }]);
  });
});
