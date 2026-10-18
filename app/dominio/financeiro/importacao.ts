/**
 * Importar a planilha atual (RA8): CSV com `;` ou `,`, vírgula decimal, datas
 * `dd/mm/aaaa`, e a grade que o leitor de XLSX devolve (células com número e
 * série de data). Nada é gravado sem a tela de conferência: cada linha volta
 * com rascunho, erros, avisos e se é repetida.
 *
 * Adaptado de `Valores/nucleo/importacao/tabela.ts` (`lerCSV`,
 * `detectarColunas`, `mapearLinhas`). Diferenças: o separador é contado FORA
 * das aspas; acha o cabeçalho abaixo de linhas de título; os papéis são os da
 * planilha de academia (entrada e saída em colunas separadas, tipo, situação,
 * forma, pessoa, modalidade); a linha com problema volta COM o erro em vez de
 * sumir; e as repetidas são marcadas.
 *
 * Ler o arquivo .xlsx em si fica fora do domínio (biblioteca na camada do
 * app); aqui entra a grade já lida.
 */

import type { Centavos, DataISO, Id, InstanteISO } from '../tipos.ts';
import { lerDinheiro } from './dinheiro.ts';
import { competenciaDe, lerDataDaPlanilha } from './datas.ts';
import { mesComMaiuscula, mesFechado } from './fechamento.ts';
import { repartirEntreModalidades } from './mensalidades.ts';
import { acharPorNome, lerForma, lerSituacao, lerTipo, normalizar } from './nomes.ts';
import type {
  Categoria, FechamentoDoMes, FormaDePagamento, Lancamento, Modalidade, ParteDaModalidade, PapelDaColuna, Pessoa,
  SituacaoDoLancamento, TipoDeLancamento,
} from './tipos.ts';

/** Uma célula como chega: texto do CSV, ou número/texto do XLSX. */
export type Celula = string | number | null | undefined;

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

/** Conta `;`, `,` e tabulação na primeira linha com conteúdo, FORA das aspas. */
export function detectarSeparador(texto: string): string {
  const t = texto.replace(/^﻿/, '');
  const conta: Record<string, number> = { ';': 0, ',': 0, '\t': 0 };
  let aspas = false;
  let viuConteudo = false;
  for (const ch of t) {
    if (ch === '"') aspas = !aspas;
    else if (!aspas && (ch === '\n' || ch === '\r')) {
      if (viuConteudo) break;
    } else if (!aspas && ch in conta) conta[ch] += 1;
    if (ch.trim()) viuConteudo = true;
  }
  const [melhor, n] = Object.entries(conta).sort((a, b) => b[1] - a[1])[0];
  return n > 0 ? melhor : ';';
}

/** CSV com aspas (inclusive aspas dobradas e quebra de linha dentro). Linhas vazias saem. */
export function lerCSV(texto: string, separador?: string): string[][] {
  const t = texto.replace(/^﻿/, '');
  const sep = separador ?? detectarSeparador(t);
  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = '';
  let aspas = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (aspas) {
      if (ch === '"') {
        if (t[i + 1] === '"') { campo += '"'; i++; } else aspas = false;
      } else campo += ch;
    } else if (ch === '"') aspas = true;
    else if (ch === sep) { linha.push(campo); campo = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && t[i + 1] === '\n') i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = '';
    } else campo += ch;
  }
  if (campo.length || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas.filter((l) => l.some((c) => c.trim() !== ''));
}

// ---------------------------------------------------------------------------
// Colunas
// ---------------------------------------------------------------------------

const CABECALHOS: [RegExp, PapelDaColuna][] = [
  [/^(valor \(±\)|valor ±|valor com sinal|valor \(\+\/-\))$/, 'valor_com_sinal'],
  [/^(data|dt|dia|data do pagamento|data de pagamento|data pagamento|pago em|vencimento|data de vencimento)$/, 'data'],
  [/^(forma|forma de pagamento|forma pagamento|meio|meio de pagamento|pagamento)$/, 'forma'],
  [/^(situacao|status|pago|paga|quitado|ok)$/, 'situacao'],
  [/^(descricao|historico|lancamento|item|referente|discriminacao|o que)$/, 'descricao'],
  [/^(entrada|entradas|receita|receitas|recebido|recebimentos|credito)$/, 'entrada'],
  [/^(saida|saidas|despesa|despesas|gasto|gastos|debito|pagamentos)$/, 'saida'],
  [/^(valor|valores|total|quantia|r\$|preco|valor \(r\$\))$/, 'valor'],
  [/^(tipo|natureza|e\/s|entrada\/saida|entrada ou saida)$/, 'tipo'],
  [/^(categoria|grupo|classificacao|plano de contas)$/, 'categoria'],
  [/^(pessoa|aluno|aluna|cliente|nome|funcionario|quem|fornecedor)$/, 'pessoa'],
  [/^(modalidade|luta|aula|turma)$/, 'modalidade'],
  [/^(observacao|obs|observacoes|nota)$/, 'observacao'],
];

function papelPeloCabecalho(cabecalho: string): PapelDaColuna | undefined {
  const n = normalizar(cabecalho);
  return CABECALHOS.find(([re]) => re.test(n))?.[1];
}

const textoDe = (c: Celula): string => (c == null ? '' : String(c)).trim();

/** A linha do cabeçalho entre as 10 primeiras (a que tem 2+ nomes conhecidos), ou -1. */
export function acharCabecalho(linhas: readonly Celula[][]): number {
  for (let i = 0; i < Math.min(10, linhas.length); i++) {
    const conhecidos = linhas[i].filter((c) => typeof c === 'string' && papelPeloCabecalho(c)).length;
    if (conhecidos >= 2) return i;
  }
  return -1;
}

export interface ColunaDetectada {
  indice: number;
  cabecalho: string;
  papel: PapelDaColuna;
  exemplo: string;
}

/** Papel de cada coluna: pelo cabeçalho; sem cabeçalho conhecido, pelo conteúdo. A tela deixa trocar. */
export function detectarColunas(linhas: readonly Celula[][], indiceDoCabecalho: number): ColunaDetectada[] {
  const cab = indiceDoCabecalho >= 0 ? linhas[indiceDoCabecalho] : [];
  const corpo = linhas.slice(indiceDoCabecalho + 1, indiceDoCabecalho + 31);
  const largura = Math.max(0, ...linhas.map((l) => l.length));
  const usados = new Set<PapelDaColuna>();
  const colunas: ColunaDetectada[] = [];
  for (let i = 0; i < largura; i++) {
    const cabecalho = textoDe(cab[i]);
    const valores = corpo.map((l) => l[i]).filter((c) => textoDe(c) !== '');
    let papel = papelPeloCabecalho(cabecalho);
    if (!papel && valores.length) {
      const fracao = (f: (c: Celula) => boolean) => valores.filter(f).length / valores.length;
      const ehData = (c: Celula) => lerDataDaPlanilha(c) != null && !(typeof c === 'string' && /,/.test(c));
      if (fracao(ehData) >= 0.6) papel = 'data';
      else if (fracao((c) => lerDinheiro(c) != null) >= 0.6) {
        papel = valores.some((c) => (lerDinheiro(c) ?? 0) < 0) ? 'valor_com_sinal' : 'valor';
      } else if (fracao((c) => /[a-zà-ú]{3,}/i.test(textoDe(c))) >= 0.5) papel = 'descricao';
    }
    if (!papel || (usados.has(papel) && papel !== 'ignorar')) papel = 'ignorar';
    usados.add(papel);
    colunas.push({ indice: i, cabecalho, papel, exemplo: valores.length ? textoDe(valores[0]) : '' });
  }
  return colunas;
}

// ---------------------------------------------------------------------------
// Conferência
// ---------------------------------------------------------------------------

export interface RascunhoDeLancamento {
  data: DataISO;
  descricao: string;
  tipo: TipoDeLancamento;
  valorCentavos: Centavos;
  categoriaId?: Id;
  /** Categoria que não existe: a tela oferece criar. */
  categoriaNova?: string;
  formaDePagamento?: FormaDePagamento;
  pessoaId?: Id;
  situacao: SituacaoDoLancamento;
  reparticao?: ParteDaModalidade[];
  observacao?: string;
}

export interface LinhaConferida {
  /** Linha no arquivo, começando em 1 (o que a pessoa vê no Excel). */
  numero: number;
  rascunho?: RascunhoDeLancamento;
  erros: string[];
  avisos: string[];
  /** Igual a um lançamento que já existe: não entra, a menos que a pessoa marque. */
  repetida: boolean;
}

const LINHA_DE_TOTAL = /^(total|totais|subtotal|soma|saldo|saldo final|saldo anterior|resultado)\b/;

/** Desfaz o apóstrofo que a exportação põe contra fórmula ("'=Aluguel" → "=Aluguel"). */
const tirarProtecao = (t: string) => (/^'[=+\-@]/.test(t) ? t.slice(1) : t);

export function chaveDeRepeticao(l: { data: DataISO; tipo: TipoDeLancamento; valorCentavos: Centavos; descricao: string }): string {
  return `${l.data}|${l.tipo}|${l.valorCentavos}|${normalizar(l.descricao)}`;
}

export function conferirImportacao(entrada: {
  linhas: readonly Celula[][];
  indiceDoCabecalho: number;
  colunas: readonly ColunaDetectada[];
  categorias: readonly Categoria[];
  pessoas: readonly Pessoa[];
  modalidades: readonly Modalidade[];
  existentes: readonly Lancamento[];
  hoje: DataISO;
  /** "Todas as linhas sem tipo são entradas" (ou saídas): a planilha só de recebimentos (AO). */
  tipoPadrao?: TipoDeLancamento;
}): { linhas: LinhaConferida[]; categoriasNovas: { nome: string; tipo: TipoDeLancamento }[]; resumo: { lidas: number; prontas: number; repetidas: number; comErro: number } } {
  const { linhas, indiceDoCabecalho, colunas, categorias, pessoas, modalidades, existentes, hoje } = entrada;
  const idx = (p: PapelDaColuna) => colunas.find((c) => c.papel === p)?.indice;
  const iData = idx('data'), iDesc = idx('descricao'), iValor = idx('valor'), iSinal = idx('valor_com_sinal');
  const iEntrada = idx('entrada'), iSaida = idx('saida'), iTipo = idx('tipo'), iCat = idx('categoria');
  const iForma = idx('forma'), iPessoa = idx('pessoa'), iSit = idx('situacao'), iMod = idx('modalidade'), iObs = idx('observacao');
  const corpo = linhas.slice(indiceDoCabecalho + 1);
  const valorDe = (l: readonly Celula[], i?: number) => (i == null ? null : lerDinheiro(l[i]));
  const valorColunaTemNegativo = iValor != null && corpo.some((l) => (valorDe(l, iValor) ?? 0) < 0);
  const jaExistem = new Set(existentes.filter((e) => !e.arquivado).map(chaveDeRepeticao));
  const vistas = new Map<string, number>();
  const novas = new Map<string, { nome: string; tipo: TipoDeLancamento }>();
  const saida: LinhaConferida[] = [];

  corpo.forEach((l, j) => {
    const numero = indiceDoCabecalho + 2 + j;
    const t = (i?: number) => (i == null ? '' : tirarProtecao(textoDe(l[i])));
    let descricao = t(iDesc);
    const ehTotal = (x: string) => LINHA_DE_TOTAL.test(normalizar(x));
    if (ehTotal(descricao) && !t(iData)) return;
    // o "TOTAL" na primeira coluna, sem data que valha e sem descrição (AO)
    const primeiroTexto = l.map(textoDe).find((c) => c !== '') ?? '';
    if (!descricao && ehTotal(primeiroTexto) && !lerDataDaPlanilha(iData == null ? null : l[iData])) return;
    if (l.every((c) => textoDe(c) === '')) return;
    const erros: string[] = [];
    const avisos: string[] = [];

    const data = lerDataDaPlanilha(iData == null ? null : l[iData]);
    if (!data) erros.push(iData == null ? 'Falta a coluna de data.' : `Data inválida: "${t(iData)}".`);
    if (!descricao) {
      // a planilhazinha "Data · Aluno · Valor" não tem descrição: usa a categoria e a pessoa (AO)
      const partes = [t(iCat), t(iPessoa)].filter(Boolean);
      if (partes.length) {
        descricao = partes.join(' — ').slice(0, 200);
        avisos.push(`Sem descrição na planilha: ficou "${descricao}".`);
      } else erros.push('Falta a descrição.');
    }

    // Valor e tipo
    let valor: Centavos | null = null;
    let tipo: TipoDeLancamento | null = null;
    const vEntrada = valorDe(l, iEntrada);
    const vSaida = valorDe(l, iSaida);
    if (vEntrada || vSaida) {
      if (vEntrada && vSaida) erros.push('Tem valor em Entrada e em Saída na mesma linha.');
      else if (vEntrada) { valor = vEntrada; tipo = 'entrada'; }
      else { valor = vSaida; tipo = 'saida'; }
    } else {
      const bruto = valorDe(l, iValor) ?? valorDe(l, iSinal);
      if (bruto != null && bruto !== 0) {
        valor = bruto;
        const tipoTexto = t(iTipo);
        const lido = tipoTexto ? lerTipo(tipoTexto) : null;
        if (tipoTexto && !lido) erros.push(`Tipo desconhecido: "${tipoTexto}".`);
        else if (lido) tipo = lido;
        else if (bruto < 0 || iSinal != null || valorColunaTemNegativo) tipo = bruto < 0 ? 'saida' : 'entrada';
      }
    }
    if (valor == null || valor === 0) {
      const tem = [iValor, iSinal, iEntrada, iSaida].some((i) => i != null && t(i) !== '');
      erros.push(tem ? 'Valor que não dá para ler.' : 'Falta o valor.');
    } else valor = Math.abs(valor);

    // Categoria (e o tipo por ela, quando nada mais disse)
    const catTexto = t(iCat);
    let categoriaId: Id | undefined;
    let categoriaNova: string | undefined;
    if (catTexto) {
      const doTipo = tipo ? categorias.filter((c) => c.tipo === tipo && !c.arquivada) : categorias.filter((c) => !c.arquivada);
      const c = acharPorNome(doTipo, catTexto);
      if (c) { categoriaId = c.id; tipo = tipo ?? c.tipo; }
      else categoriaNova = catTexto;
    }
    if (valor && !tipo && entrada.tipoPadrao) tipo = entrada.tipoPadrao;
    if (valor && !tipo) erros.push('Não dá para saber se é entrada ou saída: escolha a coluna de tipo.');
    if (categoriaNova && tipo) novas.set(`${normalizar(categoriaNova)}|${tipo}`, { nome: categoriaNova, tipo });

    // Situação
    let situacao: SituacaoDoLancamento = data && data > hoje ? 'pendente' : 'pago';
    if (iSit != null) {
      const s = lerSituacao(t(iSit));
      if (s === undefined) avisos.push(`Situação "${t(iSit)}" não reconhecida: ficou ${situacao}.`);
      else if (s) situacao = s;
    }

    // Forma, pessoa, modalidade, observação
    let forma: FormaDePagamento | undefined;
    if (iForma != null) {
      const f = lerForma(t(iForma));
      if (f === null) { forma = 'outro'; avisos.push(`Forma "${t(iForma)}" virou "outro".`); }
      else if (f) forma = f;
    }
    let pessoaId: Id | undefined;
    const observacoes: string[] = [];
    if (t(iPessoa)) {
      const p = acharPorNome(pessoas, t(iPessoa));
      if (p) pessoaId = p.id;
      else { avisos.push(`Pessoa não encontrada no cadastro: "${t(iPessoa)}".`); observacoes.push(`Pessoa na planilha: ${t(iPessoa)}`); }
    }
    let reparticao: ParteDaModalidade[] | undefined;
    if (t(iMod) && valor) {
      const achadas = t(iMod).split(/\s\+\s/).map((n) => acharPorNome(modalidades, n));
      if (achadas.every(Boolean)) {
        reparticao = repartirEntreModalidades(valor, achadas.map((m) => m!.id));
      } else avisos.push(`Modalidade não encontrada: "${t(iMod)}".`);
    }
    if (t(iObs)) observacoes.unshift(t(iObs));

    const linha: LinhaConferida = { numero, erros, avisos, repetida: false };
    if (!erros.length && data && valor && tipo) {
      linha.rascunho = {
        data, descricao, tipo, valorCentavos: valor,
        ...(categoriaId ? { categoriaId } : {}), ...(categoriaNova ? { categoriaNova } : {}),
        ...(forma ? { formaDePagamento: forma } : {}), ...(pessoaId ? { pessoaId } : {}),
        situacao, ...(reparticao ? { reparticao } : {}),
        ...(observacoes.length ? { observacao: observacoes.join(' · ') } : {}),
      };
      const chave = chaveDeRepeticao(linha.rascunho);
      linha.repetida = jaExistem.has(chave);
      const antes = vistas.get(chave);
      if (antes) avisos.push(`Igual à linha ${antes} do arquivo.`);
      else vistas.set(chave, numero);
    }
    saida.push(linha);
  });

  return {
    linhas: saida,
    categoriasNovas: [...novas.values()],
    resumo: {
      lidas: saida.length,
      prontas: saida.filter((l) => l.rascunho && !l.repetida).length,
      repetidas: saida.filter((l) => l.repetida).length,
      comErro: saida.filter((l) => l.erros.length).length,
    },
  };
}

/**
 * Grava as linhas prontas. As repetidas só entram se a pessoa marcou. A
 * categoria nova precisa ter sido criada antes (`categoriaIdPorNome`).
 */
export function gravarImportacao(
  linhas: readonly LinhaConferida[],
  opcoes: {
    academiaId: Id;
    importacaoId: Id;
    porId: Id;
    em: InstanteISO;
    gerarId: () => Id;
    categoriaIdPorNome?: Record<string, Id>;
    incluirRepetidas?: boolean;
  },
): Lancamento[] {
  const saida: Lancamento[] = [];
  for (const l of linhas) {
    if (!l.rascunho || (l.repetida && !opcoes.incluirRepetidas)) continue;
    const { categoriaNova, ...r } = l.rascunho;
    const categoriaId = r.categoriaId ?? (categoriaNova ? opcoes.categoriaIdPorNome?.[categoriaNova] : undefined);
    saida.push({
      ...r, ...(categoriaId ? { categoriaId } : {}),
      id: opcoes.gerarId(), academiaId: opcoes.academiaId, origem: 'importacao', importacaoId: opcoes.importacaoId,
      criadoPor: opcoes.porId, criadoEm: opcoes.em, atualizadoEm: opcoes.em,
    });
  }
  return saida;
}

/** Desfazer a importação inteira = arquivar as linhas dela. Mês fechado no meio impede. */
export function desfazerImportacao(
  lancamentos: readonly Lancamento[],
  importacaoId: Id,
  fechamentos: readonly FechamentoDoMes[],
): { ok: true; arquivar: Id[] } | { ok: false; motivo: string } {
  const dela = lancamentos.filter((l) => l.importacaoId === importacaoId && !l.arquivado);
  const fechado = dela.find((l) => mesFechado(competenciaDe(l.data), fechamentos));
  if (fechado) return { ok: false, motivo: `${mesComMaiuscula(competenciaDe(fechado.data))} está fechado. Reabra o mês para desfazer.` };
  return { ok: true, arquivar: dela.map((l) => l.id) };
}
