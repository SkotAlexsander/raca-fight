/**
 * O histórico em frase para a tela: liga o `descreverRegistro` do domínio aos
 * nomes que a tela conhece (pessoas, lançamentos, categorias, planos…).
 */

import { useMemo } from 'react';
import { descreverRegistro } from '@dominio/financeiro/historico.ts';
import type { RegistroDoHistorico } from '@dominio/financeiro/tipos.ts';
import type { DadosDaAcademia, Sessao } from '../dados/tipos.ts';

export function criarDescritor(d: DadosDaAcademia, sessao: Sessao) {
  const nomes = new Map<string, string>();
  for (const p of d.pessoas) nomes.set(p.id, p.nome);
  for (const c of d.categorias) nomes.set(c.id, c.nome);
  for (const p of d.planos) nomes.set(p.id, p.nome);
  for (const m of d.modalidades) nomes.set(m.id, m.nome);
  for (const l of d.lancamentos) nomes.set(l.id, l.descricao);
  for (const c of d.cobrancas) nomes.set(c.id, c.descricao);
  for (const x of d.despesasFixas) nomes.set(x.id, x.descricao);
  for (const i of d.importacoes) nomes.set(i.id, i.arquivoNome);
  nomes.set(sessao.usuarioId, sessao.nome);
  const competencia = new Map(d.fechamentos.map((f) => [f.id, f.competencia]));
  const nomeDe = (id: string) => nomes.get(id) ?? (id === 'sistema' ? 'O sistema' : 'Alguém');
  return (r: RegistroDoHistorico) => descreverRegistro(r, {
    nomeDe,
    nomeDoRegistro: (tabela, id) => (tabela === 'pessoas' || tabela === 'lancamentos' || tabela === 'cobrancas' || tabela === 'despesas_fixas' || tabela === 'importacoes' || tabela === 'categorias' || tabela === 'planos' ? nomes.get(id) : undefined),
    competenciaDe: (id) => competencia.get(id),
  });
}

export function useDescritor(d: DadosDaAcademia, sessao: Sessao) {
  return useMemo(() => criarDescritor(d, sessao), [d, sessao]);
}
