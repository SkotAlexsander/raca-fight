/**
 * A grade "tipo Excel" dos lançamentos (RA4): editar direto na célula, colar
 * várias linhas copiadas do Excel e desfazer/refazer. A tela só desenha; o
 * que cada célula aceita mora aqui.
 */

import type { DataISO, Id, InstanteISO } from '../tipos.ts';
import { formatarDinheiro, lerDinheiro } from './dinheiro.ts';
import { formatarDataBR, lerDataDaPlanilha } from './datas.ts';
import { lerCSV } from './importacao.ts';
import { acharPorNome, lerForma, lerSituacao, lerTipo, ROTULO_DA_FORMA, ROTULO_DA_SITUACAO, ROTULO_DO_TIPO } from './nomes.ts';
import type { Categoria, Lancamento, Pessoa } from './tipos.ts';

export type ColunaDaGrade = 'data' | 'descricao' | 'categoria' | 'tipo' | 'valor' | 'forma' | 'pessoa' | 'situacao';

export const COLUNAS_DA_GRADE: readonly ColunaDaGrade[] = ['data', 'descricao', 'categoria', 'tipo', 'valor', 'forma', 'pessoa', 'situacao'];

export const ROTULO_DA_COLUNA: Record<ColunaDaGrade, string> = {
  data: 'Data', descricao: 'Descrição', categoria: 'Categoria', tipo: 'Tipo', valor: 'Valor',
  forma: 'Forma de pagamento', pessoa: 'Pessoa', situacao: 'Situação',
};

export interface ContextoDaGrade {
  categorias: readonly Categoria[];
  pessoas: readonly Pessoa[];
  hoje: DataISO;
}

/** O texto da célula (para mostrar e para copiar). */
export function textoDaCelula(l: Lancamento, coluna: ColunaDaGrade, ctx: ContextoDaGrade): string {
  switch (coluna) {
    case 'data': return formatarDataBR(l.data);
    case 'descricao': return l.descricao;
    case 'categoria': return ctx.categorias.find((c) => c.id === l.categoriaId)?.nome ?? '';
    case 'tipo': return ROTULO_DO_TIPO[l.tipo];
    case 'valor': return formatarDinheiro(l.valorCentavos, { semSimbolo: true });
    case 'forma': return l.formaDePagamento ? ROTULO_DA_FORMA[l.formaDePagamento] : '';
    case 'pessoa': return ctx.pessoas.find((p) => p.id === l.pessoaId)?.nome ?? '';
    case 'situacao': return ROTULO_DA_SITUACAO[l.situacao];
  }
}

export type ResultadoDaEdicao = { ok: true; lancamento: Lancamento } | { ok: false; erro: string };

const rotuloDoTipo = (t: Lancamento['tipo']) => (t === 'entrada' ? 'entrada' : 'saída');

/**
 * Trocar o tipo (pela coluna Tipo ou pelo "-20") numa linha com categoria do
 * OUTRO tipo tira a categoria: o que a pessoa acabou de dizer vale, e a linha
 * continua gravável. Antes (AO) a célula aceitava a briga e o repositório
 * recusava a linha inteira, com um aviso solto na tela.
 */
function comTipo(l: Lancamento, tipo: Lancamento['tipo'], mudanca: Partial<Lancamento>): ResultadoDaEdicao {
  const novo: Lancamento = { ...l, ...mudanca, tipo };
  if (l.tipo !== tipo) delete novo.categoriaId;
  return { ok: true, lancamento: novo };
}

/** Aplica o que a pessoa digitou numa célula. Erro = nada muda. */
export function editarCelula(l: Lancamento, coluna: ColunaDaGrade, texto: string, ctx: ContextoDaGrade): ResultadoDaEdicao {
  const t = texto.trim();
  const ok = (mudanca: Partial<Lancamento>): ResultadoDaEdicao => ({ ok: true, lancamento: { ...l, ...mudanca } });
  const sem = (campo: keyof Lancamento): ResultadoDaEdicao => {
    const copia = { ...l };
    delete copia[campo];
    return { ok: true, lancamento: copia };
  };
  switch (coluna) {
    case 'data': {
      // Na grade, "5/10" sem ano é o ano de hoje (na importação, não: lá a data tem de vir inteira).
      const comAno = /^\d{1,2}\/\d{1,2}$/.test(t) ? `${t}/${ctx.hoje.slice(0, 4)}` : t;
      const d = lerDataDaPlanilha(comAno);
      return d ? ok({ data: d }) : { ok: false, erro: 'Data inválida.' };
    }
    case 'descricao':
      if (!t) return { ok: false, erro: 'A descrição não pode ficar vazia.' };
      return t.length > 200 ? { ok: false, erro: 'A descrição passa de 200 caracteres.' } : ok({ descricao: t });
    case 'categoria': {
      if (!t) return sem('categoriaId');
      const vivas = ctx.categorias.filter((x) => !x.arquivada);
      // "Eventos" existe de entrada e de saída: no empate, vale a do tipo da linha (AO)
      const c = acharPorNome(vivas, t) ?? acharPorNome(vivas.filter((x) => x.tipo === l.tipo), t);
      return c ? ok({ categoriaId: c.id, tipo: c.tipo }) : { ok: false, erro: 'Categoria não encontrada.' };
    }
    case 'tipo': {
      const tipo = lerTipo(t);
      if (!tipo) return { ok: false, erro: 'Escreva entrada ou saída.' };
      return comTipo(l, tipo, {});
    }
    case 'valor': {
      const v = lerDinheiro(t);
      if (v == null || v === 0) return { ok: false, erro: 'Valor inválido.' };
      return v > 0 ? ok({ valorCentavos: v }) : comTipo(l, 'saida', { valorCentavos: -v });
    }
    case 'forma': {
      if (!t) return sem('formaDePagamento');
      const f = lerForma(t);
      return f ? ok({ formaDePagamento: f }) : { ok: false, erro: 'Forma de pagamento desconhecida.' };
    }
    case 'pessoa': {
      if (!t) return sem('pessoaId');
      const p = acharPorNome(ctx.pessoas, t);
      return p ? ok({ pessoaId: p.id }) : { ok: false, erro: 'Pessoa não encontrada (ou mais de uma com esse começo).' };
    }
    case 'situacao': {
      const s = lerSituacao(t);
      return s ? ok({ situacao: s }) : { ok: false, erro: 'Escreva pago ou pendente.' };
    }
  }
}

/**
 * Colar linhas copiadas do Excel (tabulação), a partir da coluna onde o
 * cursor está. Cada linha colada vira uma linha nova, com os erros por coluna.
 */
export function colarNaGrade(
  texto: string,
  colunaInicial: ColunaDaGrade,
  ctx: ContextoDaGrade & { academiaId?: Id; porId?: Id; em?: InstanteISO; gerarId?: () => Id },
): { linhas: { lancamento?: Lancamento; erros: string[] }[] } {
  const inicio = COLUNAS_DA_GRADE.indexOf(colunaInicial);
  const base = (): Lancamento => ({
    id: ctx.gerarId?.() ?? '', academiaId: ctx.academiaId ?? '', data: ctx.hoje, descricao: '', tipo: 'entrada', valorCentavos: 0,
    situacao: 'pago', origem: 'manual', criadoPor: ctx.porId ?? '', criadoEm: ctx.em ?? '', atualizadoEm: ctx.em ?? '',
  });
  const linhas = lerCSV(texto, '\t').map((celulas) => {
    let l = base();
    const erros: string[] = [];
    // A categoria vai por último (AO): o tipo e o "-90" que a linha diz valem,
    // e a categoria do outro tipo vira erro na coluna dela. Sem tipo dito, a
    // categoria puxa o tipo, como na célula.
    const pares = celulas.map((valor, j) => ({ valor, coluna: COLUNAS_DA_GRADE[inicio + j] }));
    const tipoDito = pares.some((p) => p.valor.trim() && (p.coluna === 'tipo' || (p.coluna === 'valor' && (lerDinheiro(p.valor) ?? 0) < 0)));
    for (const { valor, coluna } of [...pares.filter((p) => p.coluna !== 'categoria'), ...pares.filter((p) => p.coluna === 'categoria')]) {
      if (!coluna || !valor.trim()) continue;
      const tipoAntes = l.tipo;
      const r = editarCelula(l, coluna, valor, ctx);
      if (!r.ok) { erros.push(`Coluna ${ROTULO_DA_COLUNA[coluna]}: ${r.erro}`); continue; }
      if (coluna === 'categoria' && tipoDito && r.lancamento.tipo !== tipoAntes) {
        erros.push(`Coluna ${ROTULO_DA_COLUNA[coluna]}: "${valor.trim()}" é de ${rotuloDoTipo(r.lancamento.tipo)} e a linha é de ${rotuloDoTipo(tipoAntes)}.`);
        continue;
      }
      l = r.lancamento;
    }
    if (!l.descricao && !erros.length) erros.push('Coluna Descrição: falta a descrição.');
    if (!l.valorCentavos && !erros.some((e) => e.startsWith('Coluna Valor'))) erros.push('Coluna Valor: falta o valor.');
    return erros.length ? { erros } : { lancamento: l, erros };
  });
  return { linhas };
}

/**
 * A folha do celular: todos os campos de uma vez. A ordem importa (AO): o
 * tipo, depois o valor ("-20" é saída, mesmo com o seletor em "Entrada"), e
 * a categoria por último, que precisa ser do tipo que ficou. Antes a folha
 * aplicava valor → tipo → categoria, e "-20" virava ENTRADA de 20.
 */
export function editarLinhaInteira(
  l: Lancamento,
  textos: Partial<Record<ColunaDaGrade, string>>,
  ctx: ContextoDaGrade,
): { ok: true; lancamento: Lancamento } | { ok: false; campo: ColunaDaGrade; erro: string } {
  let atual: Lancamento = { ...l };
  // a categoria antiga não pode barrar a troca de tipo: ela volta a valer no fim, pelo campo dela
  delete atual.categoriaId;
  const ordem: ColunaDaGrade[] = ['data', 'descricao', 'tipo', 'valor', 'forma', 'pessoa', 'situacao', 'categoria'];
  for (const k of ordem) {
    const texto = textos[k];
    if (texto == null) continue;
    if (k === 'descricao' && !texto.trim()) return { ok: false, campo: k, erro: 'Falta a descrição.' };
    if (k === 'valor' && !texto.trim()) return { ok: false, campo: k, erro: 'Falta o valor.' };
    const tipoAntes = atual.tipo;
    const r = editarCelula(atual, k, texto, ctx);
    if (!r.ok) return { ok: false, campo: k, erro: r.erro };
    if (k === 'categoria' && r.lancamento.tipo !== tipoAntes) {
      return { ok: false, campo: k, erro: `A categoria é de ${rotuloDoTipo(r.lancamento.tipo)} e a linha é de ${rotuloDoTipo(tipoAntes)}.` };
    }
    atual = r.lancamento;
  }
  if (textos.categoria == null && l.categoriaId) atual.categoriaId = l.categoriaId;
  if (!atual.descricao) return { ok: false, campo: 'descricao', erro: 'Falta a descrição.' };
  if (!atual.valorCentavos) return { ok: false, campo: 'valor', erro: 'Falta o valor.' };
  return { ok: true, lancamento: atual };
}

// ---------------------------------------------------------------------------
// Desfazer / refazer
// ---------------------------------------------------------------------------

/** Uma ação da pessoa: uma ou várias linhas mudadas de uma vez (colar 20 linhas = 1 ação). */
export interface AcaoDaGrade {
  descricao: string;
  mudancas: { antes?: Lancamento; depois?: Lancamento }[];
}

export interface PilhaDeDesfazer {
  feitos: AcaoDaGrade[];
  desfeitos: AcaoDaGrade[];
}

export const LIMITE_DE_DESFAZER = 100;

export function pilhaVazia(): PilhaDeDesfazer {
  return { feitos: [], desfeitos: [] };
}

export function registrarAcao(p: PilhaDeDesfazer, acao: AcaoDaGrade): PilhaDeDesfazer {
  return { feitos: [...p.feitos, acao].slice(-LIMITE_DE_DESFAZER), desfeitos: [] };
}

const inverter = (a: AcaoDaGrade) => a.mudancas.map((m) => ({ antes: m.depois, depois: m.antes })).reverse();

/** Devolve o que aplicar (antes → depois) e a pilha nova; `null` se não há o que desfazer. */
export function desfazer(p: PilhaDeDesfazer): { pilha: PilhaDeDesfazer; aplicar: AcaoDaGrade['mudancas'] } | null {
  const acao = p.feitos.at(-1);
  if (!acao) return null;
  return { pilha: { feitos: p.feitos.slice(0, -1), desfeitos: [...p.desfeitos, acao] }, aplicar: inverter(acao) };
}

export function refazer(p: PilhaDeDesfazer): { pilha: PilhaDeDesfazer; aplicar: AcaoDaGrade['mudancas'] } | null {
  const acao = p.desfeitos.at(-1);
  if (!acao) return null;
  return { pilha: { feitos: [...p.feitos, acao], desfeitos: p.desfeitos.slice(0, -1) }, aplicar: acao.mudancas };
}
