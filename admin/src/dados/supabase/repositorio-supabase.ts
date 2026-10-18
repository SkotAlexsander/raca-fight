/**
 * O repositório SUPABASE: o mesmo contrato do local, falando com o banco.
 *
 * - Lê pelas tabelas (a RLS só devolve o que é do dono).
 * - Escreve várias linhas só por FUNÇÃO (`rpc`), que é uma transação.
 * - Sem rede, não grava nada e diz isso (sem fila offline, 05-ADMIN.md, seção 5).
 * - O erro do servidor nunca vai para a tela nem para o log como veio: vira
 *   uma frase pela palavra-código, e o registro leva só o código.
 *
 * Não foi rodado contra um projeto de verdade (não existe ainda): os testes
 * usam um cliente falso que confere as chamadas.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { gerarDespesasFixasDoMes } from '@dominio/financeiro/despesas-fixas.ts';
import { mesComMaiuscula } from '@dominio/financeiro/fechamento.ts';
import { gravarImportacao } from '@dominio/financeiro/importacao.ts';
import { gerarMensalidadesDoMes } from '@dominio/financeiro/mensalidades.ts';
import type { RegistroDoHistorico, RegrasDeCobranca } from '@dominio/financeiro/tipos.ts';
import type { Horario, Turma } from '@dominio/turmas/turmas.ts';
import type { Id, InstanteISO } from '@dominio/tipos.ts';
import { registrarErro } from '../../util/registrar.ts';
import { regrasProvisorias } from '../regras-provisorias.ts';
import { ErroDeRegra, ErroSemConexao, ErroSemPermissao } from '../tipos.ts';
import type { DadosDaAcademia, NomeDaTabela, Repositorio } from '../tipos.ts';
import { doBanco, paraBanco, paraCamel } from './mapear.ts';

const TABELAS = {
  modalidades: 'modalidades', planos: 'planos', pessoas: 'pessoas', funcionarios: 'funcionarios', matriculas: 'matriculas',
  cobrancas: 'cobrancas', lancamentos: 'lancamentos', categorias: 'categorias', despesasFixas: 'despesas_fixas', fechamentos: 'fechamentos',
  importacoes: 'importacoes', eventos: 'eventos', interessados: 'interessados', experimentais: 'aulas_experimentais', notas: 'notas',
  lembretes: 'lembretes', tarefas: 'tarefas', filtrosSalvos: 'filtros_salvos', historico: 'historico',
} as const;

/** A palavra-código que as funções do banco levantam → a frase da tela. */
const FRASES: Record<string, string> = {
  pagamento_parcial: 'Pagamento parcial não é aceito: o valor pago precisa ser o da cobrança.',
  ja_paga: 'Esta cobrança já está paga.',
  cancelada: 'Esta cobrança está cancelada.',
  nao_paga: 'Esta cobrança não está paga.',
  paga_nao_cancela: 'Cobrança paga não se cancela: desfaça o pagamento antes.',
  ja_fechado: 'Este mês já está fechado.',
  nao_fechado: 'Este mês não está fechado.',
  sem_motivo: 'Escreva o motivo para reabrir o mês.',
  categoria_de_outro_tipo: 'A categoria é de outro tipo (entrada ou saída).',
  reparticao_nao_soma: 'A repartição por modalidade não soma o valor.',
  nao_encontrada: 'Não encontrei este registro. Recarregue a tela.',
};

export function traduzirErro(e: unknown): Error {
  if (e instanceof ErroDeRegra || e instanceof ErroSemConexao || e instanceof ErroSemPermissao) return e;
  if (e instanceof TypeError) return new ErroSemConexao();
  const o = (e ?? {}) as { code?: string; message?: string; details?: string };
  if (o.code === '42501' || o.message === 'sem_permissao') return new ErroSemPermissao();
  if (o.message === 'mes_fechado') {
    const comp = /^\d{4}-\d{2}$/.test(o.details ?? '') ? o.details! : null;
    return new ErroDeRegra(comp ? `${mesComMaiuscula(comp)} está fechado. Reabra o mês para mudar.` : 'O mês está fechado. Reabra para mudar.');
  }
  if (o.message && FRASES[o.message]) return new ErroDeRegra(FRASES[o.message]!);
  if (o.code === '23505') return new ErroDeRegra('Já existe um registro igual.');
  if (o.code === '23514') return new ErroDeRegra('Algum valor está fora do permitido. Confira os campos.');
  return new ErroDeRegra('Não deu para gravar. Tente de novo.');
}

export interface OpcoesDoSupabase {
  cliente: SupabaseClient;
  academiaId: Id;
  agora: () => InstanteISO;
  gerarId?: () => Id;
  online?: () => boolean;
}

export function criarRepositorioSupabase(op: OpcoesDoSupabase): Repositorio {
  const s = op.cliente;
  const A = op.academiaId;
  const gerarId = op.gerarId ?? (() => crypto.randomUUID());
  const online = op.online ?? (() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  let ultimo: DadosDaAcademia | null = null;

  async function lerTudo<T>(tabela: string): Promise<T[]> {
    const saida: T[] = [];
    const pagina = 1000; // o PostgREST devolve no máximo 1000 por pedido
    for (let de = 0; ; de += pagina) {
      const { data, error } = await s.from(tabela).select('*').eq('academia_id', A).range(de, de + pagina - 1);
      if (error) throw error;
      saida.push(...(data as Record<string, unknown>[]).map((l) => doBanco<T>(l)));
      if (!data || data.length < pagina) return saida;
    }
  }

  async function carregar(): Promise<DadosDaAcademia> {
    try {
      const chaves = Object.keys(TABELAS) as (keyof typeof TABELAS)[];
      const listas = await Promise.all(chaves.map((k) => lerTudo<unknown>(TABELAS[k])));
      const d = Object.fromEntries(chaves.map((k, i) => [k, listas[i]])) as unknown as Omit<DadosDaAcademia, 'academia' | 'regras' | 'turmas'>;
      // a grade: no banco, `turmas` e `horarios` são tabelas separadas; no domínio, a turma leva os horários dela (AU)
      const [turmasDoBanco, horariosDoBanco] = await Promise.all([
        lerTudo<Turma>('turmas'),
        lerTudo<Horario & { turmaId: Id; ativo?: boolean }>('horarios'),
      ]);
      const turmas: Turma[] = turmasDoBanco.map((t) => ({
        ...t, professorId: t.professorId ?? null, capacidade: t.capacidade ?? null, auxiliarIds: t.auxiliarIds ?? [], modalidadeIds: t.modalidadeIds ?? [],
        horarios: horariosDoBanco.filter((h) => h.turmaId === t.id && h.ativo !== false).map(({ id, dia, inicio, duracaoMinutos }) => ({ id, dia, inicio, duracaoMinutos })),
      }));
      const [{ data: academia, error: e1 }, { data: regras, error: e2 }] = await Promise.all([
        s.from('academias').select('id, nome').eq('id', A).single(),
        s.from('regras_de_cobranca').select('*').eq('academia_id', A).maybeSingle(),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      // o histórico vem com os campos do banco: o domínio fala camelCase
      d.historico = (d.historico as RegistroDoHistorico[])
        .map((h) => ({ ...h, mudancas: (h.mudancas ?? []).map((m) => ({ ...m, campo: paraCamel(m.campo) })) }))
        .sort((a, b) => b.em.localeCompare(a.em));
      ultimo = {
        ...d,
        turmas,
        academia: academia as { id: Id; nome: string },
        regras: regras ? doBanco<RegrasDeCobranca>(regras) : regrasProvisorias(A, op.agora()),
      };
      return ultimo;
    } catch (e) {
      registrarErro('carregar', e);
      throw traduzirErro(e);
    }
  }

  async function escrever<R>(onde: string, fazer: () => Promise<R>): Promise<R> {
    if (!online()) throw new ErroSemConexao();
    try {
      return await fazer();
    } catch (e) {
      registrarErro(onde, e);
      throw traduzirErro(e);
    }
  }

  const rpc = async (nome: string, args: Record<string, unknown>) => {
    const { data, error } = await s.rpc(nome, args);
    if (error) throw error;
    return data as unknown;
  };

  const base = async () => ultimo ?? carregar();

  return {
    modo: 'supabase',
    carregar,

    gravarLancamentos: (mudancas) => escrever('gravar_lancamentos', async () => {
      await rpc('gravar_lancamentos', { p_academia: A, p_linhas: mudancas.map((m) => paraBanco(m.depois)) });
      return carregar();
    }),

    marcarComoPaga: (cobrancaId, p) => escrever('marcar_como_paga', async () => {
      await rpc('marcar_como_paga', { p_cobranca: cobrancaId, p_data: p.data, p_forma: p.forma, p_valor: p.valorPagoCentavos ?? null });
      return carregar();
    }),

    // o lote da família: uma função, uma transação (AU, 16/10; antes, uma chamada por cobrança)
    marcarComoPagas: (cobrancaIds, p) => escrever('marcar_como_pagas', async () => {
      await rpc('marcar_como_pagas', { p_cobrancas: cobrancaIds, p_data: p.data, p_forma: p.forma });
      return carregar();
    }),

    // matricular do funil: a pessoa, a matrícula, o interessado, a experimental e a indicação numa função só (AU).
    // O desconto de quem indicou ("traga um amiguinho") a função ainda não grava: vai depois, na matrícula dele.
    matricularInteressado: (p) => escrever('matricular_interessado', async () => {
      await rpc('matricular_interessado', {
        p_academia: A, p_interessado: p.interessado.id,
        p_pessoa: paraBanco({ ...p.pessoa, academiaId: A }), p_matricula: paraBanco({ ...p.matricula, academiaId: A }), p_cobrancas: [],
      });
      if (p.indicador) {
        const { error } = await s.from('matriculas').upsert(paraBanco({ ...p.indicador, academiaId: A }));
        if (error) throw error;
      }
      return carregar();
    }),

    desfazerPagamento: (cobrancaId) => escrever('desfazer_pagamento', async () => {
      await rpc('desfazer_pagamento', { p_cobranca: cobrancaId });
      return carregar();
    }),

    cancelarCobranca: (cobrancaId) => escrever('cancelar_cobranca', async () => {
      await rpc('cancelar_cobranca', { p_cobranca: cobrancaId });
      return carregar();
    }),

    gerarMensalidades: (competencia) => escrever('gerar_mensalidades', async () => {
      const d = await base();
      const resultado = gerarMensalidadesDoMes({
        competencia, matriculas: d.matriculas, planos: d.planos, existentes: d.cobrancas, primeiroMes: d.regras.primeiroMes, gerarId, em: op.agora(),
      });
      if (resultado.novas.length) await rpc('inserir_cobrancas', { p_academia: A, p_cobrancas: resultado.novas.map(paraBanco) });
      return { dados: await carregar(), resultado };
    }),

    gerarDespesasFixas: (competencia) => escrever('gerar_despesas', async () => {
      const d = await base();
      const ls = gerarDespesasFixasDoMes({ competencia, despesas: d.despesasFixas, lancamentos: d.lancamentos, porId: d.academia.id, em: op.agora(), gerarId });
      if (ls.length) await rpc('gravar_lancamentos', { p_academia: A, p_linhas: ls.map((l) => paraBanco({ ...l, criadoPor: undefined })) });
      return { dados: await carregar(), geradas: ls.length };
    }),

    fecharMes: (competencia) => escrever('fechar_mes', async () => {
      await rpc('fechar_mes', { p_academia: A, p_competencia: competencia });
      return carregar();
    }),

    reabrirMes: (competencia, motivo) => escrever('reabrir_mes', async () => {
      await rpc('reabrir_mes', { p_academia: A, p_competencia: competencia, p_motivo: motivo });
      return carregar();
    }),

    importar: (p) => escrever('importar', async () => {
      const d = await base();
      const categorias = p.categoriasNovas.map((c, i) => ({ id: gerarId(), nome: c.nome.slice(0, 60), tipo: c.tipo, ordem: d.categorias.length + i + 1 }));
      const categoriaIdPorNome = Object.fromEntries(categorias.map((c) => [c.nome, c.id]));
      const importacaoId = gerarId();
      const linhas = gravarImportacao(p.linhas, { academiaId: A, importacaoId, porId: '', em: op.agora(), gerarId, categoriaIdPorNome, incluirRepetidas: p.incluirRepetidas });
      const importacao = {
        id: importacaoId, arquivo_nome: p.arquivoNome, formato: p.formato,
        mapeamento: p.colunas.map((c) => ({ indice: c.indice, cabecalho: c.cabecalho, papel: c.papel })),
        linhas_lidas: p.linhas.length, linhas_gravadas: linhas.length, linhas_repetidas: p.linhas.filter((l) => l.repetida).length,
        linhas_com_erro: p.linhas.filter((l) => l.erros.length).length, estado: 'gravada',
      };
      await rpc('importar_lancamentos', {
        p_academia: A, p_importacao: importacao, p_categorias: categorias,
        p_linhas: linhas.map((l) => paraBanco({ ...l, criadoPor: undefined, criadoEm: undefined, atualizadoEm: undefined })),
      });
      return { dados: await carregar(), gravadas: linhas.length };
    }),

    desfazerImportacao: (id) => escrever('desfazer_importacao', async () => {
      await rpc('desfazer_importacao', { p_importacao: id });
      return carregar();
    }),

    salvar: (tabela: NomeDaTabela, registro) => escrever(`salvar_${tabela}`, async () => {
      if (tabela === 'turmas') {
        // a turma e os horários: o horário que saiu da tela fica INATIVO (nada se apaga no banco, AU)
        const { horarios, ...turma } = registro as Turma;
        const { error: e1 } = await s.from('turmas').upsert(paraBanco({ ...turma, academiaId: A }));
        if (e1) throw e1;
        const antes = ultimo?.turmas.find((t) => t.id === turma.id)?.horarios ?? [];
        const linhas = [
          ...horarios.map((h) => paraBanco({ id: h.id, academiaId: A, turmaId: turma.id, dia: h.dia, inicio: h.inicio, duracaoMinutos: h.duracaoMinutos, ativo: true })),
          ...antes.filter((h) => !horarios.some((x) => x.id === h.id))
            .map((h) => paraBanco({ id: h.id, academiaId: A, turmaId: turma.id, dia: h.dia, inicio: h.inicio, duracaoMinutos: h.duracaoMinutos, ativo: false })),
        ];
        if (linhas.length) {
          const { error: e2 } = await s.from('horarios').upsert(linhas);
          if (e2) throw e2;
        }
        return carregar();
      }
      const { error } = await s.from(tabela).upsert(paraBanco({ ...registro, academiaId: A }));
      if (error) throw error;
      return carregar();
    }),

    salvarRegras: (regras) => escrever('salvar_regras', async () => {
      const { error } = await s.from('regras_de_cobranca').upsert(paraBanco({ ...regras, academiaId: A, atualizadoEm: undefined }));
      if (error) throw error;
      return carregar();
    }),
  };
}
