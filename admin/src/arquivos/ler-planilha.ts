/**
 * Ler a planilha do dono (RA8.1): CSV (texto) ou XLSX, e devolver a GRADE de
 * células que o domínio confere (`acharCabecalho`, `detectarColunas`,
 * `conferirImportacao`). A única parte do Admin com biblioteca de terceiro.
 *
 * XLSX: `read-excel-file` 9.3.10 (MIT), só leitura, carregada só quando o
 * arquivo é XLSX. NÃO o pacote `xlsx` 0.18.5 do npm (CVE-2023-30533 e
 * CVE-2024-22363). Decisão em docs/decisoes.md (15/10, AM1).
 *
 * O arquivo vem de fora e é lido no navegador do dono: há teto de tamanho e de
 * linhas, e nada dele é guardado (só o que virar lançamento).
 */

import { lerCSV, type Celula } from '@dominio/financeiro/importacao.ts';

export const TAMANHO_MAXIMO = 5 * 1024 * 1024;
export const LINHAS_MAXIMAS = 20000;

export type FormatoDoArquivo = 'csv' | 'xlsx';

export interface PlanilhaLida {
  nome: string;
  formato: FormatoDoArquivo;
  aba?: string;
  linhas: Celula[][];
}

export class ErroDeArquivo extends Error {
  override name = 'ErroDeArquivo';
}

/** Texto do CSV: UTF-8 (com ou sem BOM); se vier quebrado, tenta o Windows-1252 do Excel antigo. */
export function decodificarTexto(bytes: ArrayBuffer): string {
  const utf8 = new TextDecoder('utf-8').decode(bytes);
  if (!utf8.includes('�')) return utf8;
  try { return new TextDecoder('windows-1252').decode(bytes); } catch { return utf8; }
}

/** Uma célula do XLSX → o que o domínio entende (data vira AAAA-MM-DD). */
export function celulaDoXlsx(v: unknown): Celula {
  if (v == null) return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    return `${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, '0')}-${String(v.getUTCDate()).padStart(2, '0')}`;
  }
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'boolean') return v ? 'sim' : 'não';
  return String(v);
}

export async function lerPlanilha(arquivo: File): Promise<PlanilhaLida> {
  if (arquivo.size > TAMANHO_MAXIMO) throw new ErroDeArquivo('O arquivo passa de 5 MB. Exporte só o período que interessa.');
  const nome = arquivo.name;
  const ext = nome.toLowerCase().split('.').pop();
  if (ext === 'xls') throw new ErroDeArquivo('O formato .xls (Excel antigo) não é lido. No Excel, use "Salvar como" .xlsx ou CSV.');
  if (ext === 'xlsx') {
    const { readSheet } = await import('read-excel-file/browser');
    let dados: unknown[][];
    try {
      dados = (await readSheet(arquivo)) as unknown[][];
    } catch {
      throw new ErroDeArquivo('Não deu para ler este XLSX. Ele abre no Excel? Tente salvar de novo, ou em CSV.');
    }
    if (dados.length > LINHAS_MAXIMAS) throw new ErroDeArquivo(`A planilha tem mais de ${LINHAS_MAXIMAS} linhas.`);
    return { nome, formato: 'xlsx', aba: 'primeira aba', linhas: dados.map((l) => l.map(celulaDoXlsx)) };
  }
  if (ext === 'csv' || ext === 'txt' || arquivo.type.startsWith('text/')) {
    const texto = decodificarTexto(await arquivo.arrayBuffer());
    const linhas = lerCSV(texto);
    if (linhas.length > LINHAS_MAXIMAS) throw new ErroDeArquivo(`A planilha tem mais de ${LINHAS_MAXIMAS} linhas.`);
    return { nome, formato: 'csv', linhas };
  }
  throw new ErroDeArquivo('Use um arquivo .csv ou .xlsx.');
}
