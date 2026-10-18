/**
 * O repositório do MODO LOCAL: a academia de exemplo, no navegador.
 *
 * Faz o que o servidor faz, com as MESMAS funções do domínio: confere o mês
 * fechado (o gatilho do banco), valida a linha (o `check`), grava as várias
 * linhas de uma vez ou nenhuma (a transação) e escreve o histórico como o
 * gatilho escreveria. A tela não sabe se fala com este ou com o Supabase.
 */

import { cancelarCobranca, desfazerPagamento, marcarComoPaga, validarRegraDeAtraso } from '@dominio/financeiro/cobrancas.ts';
import { gerarDespesasFixasDoMes } from '@dominio/financeiro/despesas-fixas.ts';
import { fecharMes, mesComMaiuscula, mesFechado, podeAlterarLancamento, reabrirMes } from '@dominio/financeiro/fechamento.ts';
import { registroDeMudanca } from '@dominio/financeiro/historico.ts';
import { chaveDeRepeticao, desfazerImportacao, gravarImportacao } from '@dominio/financeiro/importacao.ts';
import { validarLancamento } from '@dominio/financeiro/lancamentos.ts';
import { gerarMensalidadesDoMes } from '@dominio/financeiro/mensalidades.ts';
import { validarTurma } from '@dominio/financeiro/grade-de-aulas.ts';
import { acharPorNome, normalizar } from '@dominio/financeiro/nomes.ts';
import type { AcaoDoHistorico, Categoria, Cobranca, Lancamento, RegrasDeCobranca } from '@dominio/financeiro/tipos.ts';
import type { DataISO, Id, InstanteISO } from '@dominio/tipos.ts';
import { ErroDeRegra } from '../tipos.ts';
import type { DadosDaAcademia, MudancaDeLinha, NomeDaTabela, PedidoDeImportacao, Repositorio, TabelasSimples } from '../tipos.ts';
import type { Armazenamento } from './armazenamento.ts';
import { DONO_ID, gerarExemplo } from './exemplo.ts';

const CHAVE_DA_TABELA = {
  pessoas: 'pessoas', funcionarios: 'funcionarios', matriculas: 'matriculas', planos: 'planos', categorias: 'categorias',
  despesas_fixas: 'despesasFixas', notas: 'notas', lembretes: 'lembretes', tarefas: 'tarefas', interessados: 'interessados',
  aulas_experimentais: 'experimentais', filtros_salvos: 'filtrosSalvos', modalidades: 'modalidades', turmas: 'turmas',
} as const satisfies Record<NomeDaTabela, keyof DadosDaAcademia>;

/** A categoria em que a cobrança paga entra (pelo nome da lista proposta; o dono pode trocar a linha depois). */
export function categoriaDaCobranca(c: Cobranca, categorias: readonly Categoria[]): Id | undefined {
  const nome = { mensalidade: 'Mensalidades', matricula: 'Taxas de matrícula', graduacao: 'Exames de graduação', evento: 'Eventos e campeonatos (entradas)', produto: 'Venda de produtos', avulsa: 'Outras entradas' }[c.tipo];
  return acharPorNome(categorias.filter((x) => x.tipo === 'entrada' && !x.arquivada), nome)?.id;
}

export interface OpcoesDoLocal {
  armazenamento: Armazenamento;
  hoje: () => DataISO;
  agora: () => InstanteISO;
  porId?: Id;
  gerarId?: () => Id;
  /** Simula a ida ao servidor, para a tela mostrar "Salvando…". */
  latenciaMs?: number;
}

export function criarRepositorioLocal(op: OpcoesDoLocal): Repositorio {
  const porId = op.porId ?? DONO_ID;
  const gerarId = op.gerarId ?? (() => crypto.randomUUID());
  let d: DadosDaAcademia | null = null;
  const esperar = () => (op.latenciaMs ? new Promise((r) => setTimeout(r, op.latenciaMs)) : Promise.resolve());

  async function atual(): Promise<DadosDaAcademia> {
    if (!d) d = (await op.armazenamento.ler()) ?? gerarExemplo(op.hoje());
    return d;
  }

  /**
   * Uma escrita por vez (AO, 16/10): duas escritas juntas (Enter rápido em
   * duas células, duplo clique em "Confirmar pagamento") liam a MESMA cópia e
   * a segunda apagava a primeira. Agora cada uma espera a anterior terminar e
   * lê os dados já com a mudança dela, como o banco faria com a transação.
   */
  let fila: Promise<unknown> = Promise.resolve();
  function mudar<R = void>(fazer: (novo: DadosDaAcademia, h: Historiador) => R): Promise<{ dados: DadosDaAcademia; r: R }> {
    const vez = fila.then(() => mudarAgora(fazer));
    fila = vez.catch(() => undefined);
    return vez;
  }

  /** Copia, aplica, guarda: se `fazer` lança, nada muda (a "transação"). */
  async function mudarAgora<R = void>(fazer: (novo: DadosDaAcademia, h: Historiador) => R): Promise<{ dados: DadosDaAcademia; r: R }> {
    await esperar();
    const base = await atual();
    const novo = structuredClone(base);
    const em = op.agora();
    const h: Historiador = (tabela, antes, depois, acao, motivo, mudancas) => {
      const r = registroDeMudanca({ tabela, academiaId: novo.academia.id, antes, depois, porId, em, gerarId, ...(acao ? { acao } : {}), ...(motivo ? { motivo } : {}) });
      if (r) novo.historico.unshift(mudancas ? { ...r, mudancas } : r);
    };
    const r = fazer(novo, h);
    d = novo;
    await op.armazenamento.gravar(novo);
    return { dados: novo, r };
  }

  const travado = (dados: DadosDaAcademia, antes: Lancamento | undefined, depois: Lancamento | undefined) => {
    const p = podeAlterarLancamento(antes, depois, dados.fechamentos);
    if (!p.pode) throw new ErroDeRegra(p.motivo);
  };

  const pagarOuErro = <T>(f: () => T): T => {
    try {
      return f();
    } catch (e) {
      if (e instanceof RangeError) {
        const m = e.message;
        if (/parcial/.test(m)) throw new ErroDeRegra('Pagamento parcial não é aceito: o valor pago precisa ser o da cobrança.');
        if (/já está paga/.test(m)) throw new ErroDeRegra('Esta cobrança já está paga.');
        if (/cancelada/.test(m)) throw new ErroDeRegra('Esta cobrança está cancelada.');
        if (/não está paga/.test(m)) throw new ErroDeRegra('Esta cobrança não está paga.');
        if (/desfaça o pagamento/.test(m)) throw new ErroDeRegra('Cobrança paga não se cancela: desfaça o pagamento antes.');
        throw new ErroDeRegra('Não deu para gravar: confira os dados.');
      }
      throw e;
    }
  };

  return {
    modo: 'local',

    async carregar() {
      await esperar();
      return atual();
    },

    async gravarLancamentos(mudancas: MudancaDeLinha[]) {
      const { dados } = await mudar((novo, h) => {
        for (const m of mudancas) {
          const antes = m.antes ? novo.lancamentos.find((l) => l.id === m.antes!.id) : undefined;
          travado(novo, antes, m.depois);
          if (!m.depois.arquivado) {
            const erros = validarLancamento(m.depois, novo.categorias);
            if (erros.length) throw new ErroDeRegra(erros[0]);
          }
        }
        for (const m of mudancas) {
          const i = novo.lancamentos.findIndex((l) => l.id === m.depois.id);
          const antes = i >= 0 ? novo.lancamentos[i] : undefined;
          const depois = { ...m.depois, atualizadoEm: op.agora() };
          if (i >= 0) novo.lancamentos[i] = depois;
          else novo.lancamentos.push(depois);
          h('lancamentos', antes, depois);
        }
      });
      return dados;
    },

    async marcarComoPaga(cobrancaId, p) {
      const { dados } = await mudar((novo, h) => {
        const i = novo.cobrancas.findIndex((c) => c.id === cobrancaId);
        if (i < 0) throw new ErroDeRegra('Cobrança não encontrada.');
        const c = novo.cobrancas[i]!;
        const r = pagarOuErro(() => marcarComoPaga(c, {
          ...p, ...(categoriaDaCobranca(c, novo.categorias) ? { categoriaId: categoriaDaCobranca(c, novo.categorias)! } : {}), porId, em: op.agora(), gerarId,
        }));
        travado(novo, undefined, r.lancamento);
        novo.cobrancas[i] = r.cobranca;
        novo.lancamentos.push(r.lancamento);
        h('cobrancas', c, r.cobranca);
        h('lancamentos', undefined, r.lancamento);
      });
      return dados;
    },

    async marcarComoPagas(cobrancaIds, p) {
      // todas numa "transação": se uma recusa, nenhuma fica paga (AU, AO)
      const { dados } = await mudar((novo, h) => {
        for (const cobrancaId of cobrancaIds) {
          const i = novo.cobrancas.findIndex((c) => c.id === cobrancaId);
          if (i < 0) throw new ErroDeRegra('Cobrança não encontrada.');
          const c = novo.cobrancas[i]!;
          const r = pagarOuErro(() => marcarComoPaga(c, {
            ...p, ...(categoriaDaCobranca(c, novo.categorias) ? { categoriaId: categoriaDaCobranca(c, novo.categorias)! } : {}), porId, em: op.agora(), gerarId,
          }));
          travado(novo, undefined, r.lancamento);
          novo.cobrancas[i] = r.cobranca;
          novo.lancamentos.push(r.lancamento);
          h('cobrancas', c, r.cobranca);
          h('lancamentos', undefined, r.lancamento);
        }
      });
      return dados;
    },

    async matricularInteressado(p) {
      const { dados } = await mudar((novo, h) => {
        if (!novo.planos.some((x) => x.id === p.matricula.planoId)) throw new ErroDeRegra('O plano não existe mais.');
        const i = novo.interessados.findIndex((x) => x.id === p.interessado.id);
        if (i < 0) throw new ErroDeRegra('Interessado não encontrado.');
        const guardar = <T extends { id: Id }>(lista: T[], tabela: string, x: T) => {
          const j = lista.findIndex((y) => y.id === x.id);
          const antes = j >= 0 ? lista[j] : undefined;
          if (j >= 0) lista[j] = x; else lista.push(x);
          h(tabela, antes as never, x as never);
        };
        guardar(novo.pessoas, 'pessoas', p.pessoa);
        guardar(novo.matriculas, 'matriculas', p.matricula);
        if (p.indicador) guardar(novo.matriculas, 'matriculas', p.indicador);
        for (const e of p.experimentais) guardar(novo.experimentais, 'aulas_experimentais', e);
        guardar(novo.interessados, 'interessados', p.interessado);
      });
      return dados;
    },

    async desfazerPagamento(cobrancaId) {
      const { dados } = await mudar((novo, h) => {
        const i = novo.cobrancas.findIndex((c) => c.id === cobrancaId);
        if (i < 0) throw new ErroDeRegra('Cobrança não encontrada.');
        const c = novo.cobrancas[i]!;
        const r = pagarOuErro(() => desfazerPagamento(c));
        if (r.lancamentoParaArquivar) {
          const j = novo.lancamentos.findIndex((l) => l.id === r.lancamentoParaArquivar);
          if (j >= 0) {
            const antes = novo.lancamentos[j]!;
            const depois = { ...antes, arquivado: true, atualizadoEm: op.agora() };
            travado(novo, antes, depois);
            novo.lancamentos[j] = depois;
            h('lancamentos', antes, depois);
          }
        }
        novo.cobrancas[i] = r.cobranca;
        h('cobrancas', c, r.cobranca);
      });
      return dados;
    },

    async cancelarCobranca(cobrancaId) {
      const { dados } = await mudar((novo, h) => {
        const i = novo.cobrancas.findIndex((c) => c.id === cobrancaId);
        if (i < 0) throw new ErroDeRegra('Cobrança não encontrada.');
        const c = novo.cobrancas[i]!;
        const r = pagarOuErro(() => cancelarCobranca(c));
        novo.cobrancas[i] = r;
        h('cobrancas', c, r);
      });
      return dados;
    },

    async gerarMensalidades(competencia) {
      const { dados, r } = await mudar((novo, h) => {
        const g = gerarMensalidadesDoMes({
          competencia, matriculas: novo.matriculas, planos: novo.planos, existentes: novo.cobrancas,
          primeiroMes: novo.regras.primeiroMes, gerarId, em: op.agora(),
        });
        for (const c of g.novas) { novo.cobrancas.push(c); h('cobrancas', undefined, c); }
        return g;
      });
      return { dados, resultado: r };
    },

    async gerarDespesasFixas(competencia) {
      const { dados, r } = await mudar((novo, h) => {
        if (mesFechado(competencia, novo.fechamentos)) throw new ErroDeRegra(`${mesComMaiuscula(competencia)} está fechado. Reabra o mês para gerar.`);
        const ls = gerarDespesasFixasDoMes({ competencia, despesas: novo.despesasFixas, lancamentos: novo.lancamentos, porId, em: op.agora(), gerarId });
        for (const l of ls) { novo.lancamentos.push(l); h('lancamentos', undefined, l); }
        return ls.length;
      });
      return { dados, geradas: r };
    },

    async fecharMes(competencia) {
      const { dados } = await mudar((novo, h) => {
        if (mesFechado(competencia, novo.fechamentos)) throw new ErroDeRegra(`${mesComMaiuscula(competencia)} já está fechado.`);
        const f = fecharMes({ id: gerarId(), academiaId: novo.academia.id, competencia, lancamentos: novo.lancamentos, cobrancas: novo.cobrancas, porId, em: op.agora(), fechamentos: novo.fechamentos });
        novo.fechamentos.push(f);
        h('fechamentos', undefined, f, 'fechou', undefined, [{ campo: 'competencia', de: undefined, para: competencia }]);
      });
      return dados;
    },

    async reabrirMes(competencia, motivo) {
      const { dados } = await mudar((novo, h) => {
        const i = novo.fechamentos.findIndex((f) => f.competencia === competencia && !f.reabertoEm);
        if (i < 0) throw new ErroDeRegra(`${mesComMaiuscula(competencia)} não está fechado.`);
        if (!motivo.trim()) throw new ErroDeRegra('Escreva o motivo para reabrir o mês.');
        const antes = novo.fechamentos[i]!;
        const depois = reabrirMes(antes, motivo, porId, op.agora());
        novo.fechamentos[i] = depois;
        h('fechamentos', antes, depois, 'reabriu', motivo.trim(), [{ campo: 'competencia', de: competencia, para: competencia }]);
      });
      return dados;
    },

    async importar(p: PedidoDeImportacao) {
      const { dados, r } = await mudar((novo, h) => {
        const categoriaIdPorNome: Record<string, Id> = {};
        for (const c of p.categoriasNovas) {
          const ja = novo.categorias.find((x) => x.tipo === c.tipo && normalizar(x.nome) === normalizar(c.nome));
          if (ja) { categoriaIdPorNome[c.nome] = ja.id; continue; }
          const nova: Categoria = { id: gerarId(), academiaId: novo.academia.id, nome: c.nome.trim().slice(0, 60), tipo: c.tipo, ordem: novo.categorias.length + 1, arquivada: false };
          novo.categorias.push(nova);
          categoriaIdPorNome[c.nome] = nova.id;
          h('categorias', undefined, nova);
        }
        const importacaoId = gerarId();
        // confere de novo as repetidas com o que existe AGORA (AO): a mesma
        // importação mandada duas vezes não grava duas vezes
        const existem = new Set(novo.lancamentos.filter((l) => !l.arquivado).map(chaveDeRepeticao));
        const conferidas = p.linhas.map((l) => (l.rascunho && !l.repetida && existem.has(chaveDeRepeticao(l.rascunho)) ? { ...l, repetida: true } : l));
        const linhas = gravarImportacao(conferidas, { academiaId: novo.academia.id, importacaoId, porId, em: op.agora(), gerarId, categoriaIdPorNome, incluirRepetidas: p.incluirRepetidas });
        for (const l of linhas) travado(novo, undefined, l);
        novo.lancamentos.push(...linhas);
        const imp = {
          id: importacaoId, academiaId: novo.academia.id, arquivoNome: p.arquivoNome, formato: p.formato,
          mapeamento: p.colunas.map((c) => ({ indice: c.indice, cabecalho: c.cabecalho, papel: c.papel })),
          linhasLidas: p.linhas.length, linhasGravadas: linhas.length, linhasRepetidas: conferidas.filter((l) => l.repetida).length,
          linhasComErro: p.linhas.filter((l) => l.erros.length).length, estado: 'gravada' as const, porId, em: op.agora(),
        };
        novo.importacoes.unshift(imp);
        h('importacoes', undefined, imp, 'importou', `${linhas.length} linhas de ${p.arquivoNome}`, []);
        return linhas.length;
      });
      return { dados, gravadas: r };
    },

    async desfazerImportacao(importacaoId) {
      const { dados } = await mudar((novo, h) => {
        const r = desfazerImportacao(novo.lancamentos, importacaoId, novo.fechamentos);
        if (!r.ok) throw new ErroDeRegra(r.motivo);
        const ids = new Set(r.arquivar);
        novo.lancamentos = novo.lancamentos.map((l) => (ids.has(l.id) ? { ...l, arquivado: true, atualizadoEm: op.agora() } : l));
        const i = novo.importacoes.findIndex((x) => x.id === importacaoId);
        if (i >= 0) {
          const antes = novo.importacoes[i]!;
          novo.importacoes[i] = { ...antes, estado: 'desfeita' };
          h('importacoes', antes, novo.importacoes[i], 'desfez_importacao', `${ids.size} linhas arquivadas`, []);
        }
      });
      return dados;
    },

    async salvar<T extends NomeDaTabela>(tabela: T, registro: TabelasSimples[T]) {
      const { dados } = await mudar((novo, h) => {
        if (tabela === 'turmas') {
          const erros = validarTurma(registro as TabelasSimples['turmas']);
          if (erros.length) throw new ErroDeRegra(erros[0]!);
        }
        const lista = novo[CHAVE_DA_TABELA[tabela]] as unknown as { id: Id }[];
        const i = lista.findIndex((x) => x.id === registro.id);
        const antes = i >= 0 ? lista[i] : undefined;
        if (i >= 0) lista[i] = registro;
        else lista.push(registro);
        h(tabela, antes as never, registro as never);
      });
      return dados;
    },

    async salvarRegras(regras: RegrasDeCobranca) {
      const { dados } = await mudar((novo, h) => {
        if (regras.atraso) {
          const erros = validarRegraDeAtraso(regras.atraso);
          if (erros.length) throw new ErroDeRegra(erros[0]);
        }
        if (!Number.isInteger(regras.diasParaRetornoDaExperimental) || regras.diasParaRetornoDaExperimental < 1 || regras.diasParaRetornoDaExperimental > 30) {
          throw new ErroDeRegra('Os dias para chamar de volta vão de 1 a 30.');
        }
        const antes = novo.regras;
        novo.regras = { ...regras, atualizadoEm: op.agora() };
        h('regras_de_cobranca', { ...antes, id: antes.academiaId }, { ...novo.regras, id: antes.academiaId });
      });
      return dados;
    },

    recomecarExemplo() {
      const vez = fila.then(async () => {
        await op.armazenamento.apagar();
        d = gerarExemplo(op.hoje());
        await op.armazenamento.gravar(d);
        return d;
      });
      fila = vez.catch(() => undefined);
      return vez;
    },
  };
}

type Historiador = (
  tabela: string,
  antes: ({ id: Id; arquivado?: boolean; arquivada?: boolean }) | undefined,
  depois: ({ id: Id; arquivado?: boolean; arquivada?: boolean }) | undefined,
  acao?: AcaoDoHistorico,
  motivo?: string,
  mudancas?: { campo: string; de: unknown; para: unknown }[],
) => void;

