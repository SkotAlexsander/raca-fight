/**
 * Exportar para o Excel em português (RA8.6): CSV em UTF-8 COM BOM (sem ele o
 * Excel do Windows lê com a página de código local e estraga o acento), `;`
 * como separador (a vírgula é o decimal no Brasil), CRLF e vírgula decimal.
 *
 * Texto que o Excel leria como fórmula (=, +, -, @, tabulação, CR) ganha um
 * apóstrofo na frente (OWASP, "CSV Injection"). Número que NÓS formatamos
 * (`{ centavos }`) não passa por isso: "-3500,00" tem de continuar número.
 * A importação desfaz o apóstrofo, para o que sai voltar igual.
 */

import type { Centavos } from '../tipos.ts';
import { formatarDataBR } from './datas.ts';
import { ROTULO_DA_FORMA, ROTULO_DA_SITUACAO, ROTULO_DO_TIPO } from './nomes.ts';
import type { Categoria, Lancamento, Modalidade, Pessoa } from './tipos.ts';

export type CelulaCSV = string | number | null | undefined | { centavos: Centavos };

const PERIGOSO = /^[=+\-@\t\r]/;

/** Centavos → "3500,00" / "-3500,00" (sem milhar e sem R$: o Excel lê como número). */
export function centavosParaCelula(c: Centavos): string {
  const abs = Math.abs(c);
  return `${c < 0 ? '-' : ''}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`;
}

function celula(c: CelulaCSV, sep: string): string {
  if (c == null) return '';
  let t: string;
  if (typeof c === 'object') t = centavosParaCelula(c.centavos);
  else if (typeof c === 'number') t = String(c).replace('.', ',');
  else t = PERIGOSO.test(c) ? `'${c}` : c;
  return t.includes(sep) || /["\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

export function gerarCSV(cabecalho: readonly string[], linhas: readonly (readonly CelulaCSV[])[], separador = ';'): string {
  const todas = [cabecalho, ...linhas].map((l) => l.map((c) => celula(c, separador)).join(separador));
  return `﻿${todas.join('\r\n')}\r\n`;
}

export const COLUNAS_DA_EXPORTACAO = [
  'Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Valor (±)', 'Forma de pagamento', 'Pessoa', 'Situação', 'Modalidade', 'Observação',
] as const;

/**
 * Os lançamentos como a planilha do dono: "Valor" sempre positivo com o
 * "Tipo" ao lado, e "Valor (±)" com a saída negativa, para a SOMA do Excel
 * dar o resultado direto.
 */
export function exportarLancamentos(
  lancamentos: readonly Lancamento[],
  ctx: { categorias: readonly Categoria[]; pessoas: readonly Pessoa[]; modalidades: readonly Modalidade[] },
): string {
  const nome = <T extends { id: string; nome: string }>(lista: readonly T[], id?: string) => (id ? lista.find((x) => x.id === id)?.nome ?? '' : '');
  const linhas = [...lancamentos]
    .filter((l) => !l.arquivado)
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((l) => [
      formatarDataBR(l.data), l.descricao, nome(ctx.categorias, l.categoriaId), ROTULO_DO_TIPO[l.tipo],
      { centavos: l.valorCentavos }, { centavos: l.tipo === 'saida' ? -l.valorCentavos : l.valorCentavos },
      l.formaDePagamento ? ROTULO_DA_FORMA[l.formaDePagamento] : '', nome(ctx.pessoas, l.pessoaId), ROTULO_DA_SITUACAO[l.situacao],
      (l.reparticao ?? []).map((p) => nome(ctx.modalidades, p.modalidadeId)).join(' + '), l.observacao ?? '',
    ]);
  return gerarCSV(COLUNAS_DA_EXPORTACAO, linhas);
}
