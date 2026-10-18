/**
 * Dinheiro em centavos e percentual em pontos-base.
 *
 * Adaptado de `Valores/nucleo/dominio/dinheiro.ts` (já testado lá), com três
 * mudanças: aceita o NÚMERO que vem de uma célula de XLSX (não só texto),
 * recusa valor fora do inteiro seguro e escreve o negativo com o sinal de
 * menos tipográfico ("−R$ 89,90"), como a tela de planilha mostra.
 *
 * `unidades.ts › formatarReais` continua servindo ao app do aluno (sem milhar,
 * sem negativo). Aqui é a planilha do dono: milhar e negativo existem.
 */

import type { Centavos } from '../tipos.ts';
import type { PontosBase } from './tipos.ts';

/** Arredondamento comercial: meio para cima, em módulo. */
export function arredondar(x: number): Centavos {
  return Math.sign(x) * Math.round(Math.abs(x) + Number.EPSILON) || 0;
}

/**
 * Texto ou número de planilha → centavos. `null` quando não é dinheiro ou é
 * ambíguo ("12,345"): a tela de conferência mostra a linha com erro, nunca
 * adivinha.
 *
 * - "R$ 1.234,56", "1234,56", "150", "-89,90", "(89,90)" → como o Brasil escreve;
 * - "89.90" (ponto com 1 ou 2 casas) → decimal, como o CSV de banco;
 * - "1.500" (ponto com 3 casas) → milhar;
 * - número (célula de XLSX) → reais.
 */
export function lerDinheiro(valor: string | number | null | undefined): Centavos | null {
  if (valor == null) return null;
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) return null;
    const c = arredondar(valor * 100);
    return Number.isSafeInteger(c) ? c : null;
  }
  let t = String(valor).trim().replace(/\s/g, '');
  if (!t) return null;
  let negativo = false;
  // extrato de banco: "150,00 D" é débito, "150,00 C" é crédito (AO, 16/10)
  const cd = /^(.*\d)([CD])$/i.exec(t);
  if (cd) {
    t = cd[1]!;
    if (cd[2]!.toUpperCase() === 'D') negativo = true;
  }
  // "+150,00" e "+ R$ 150,00": o sinal de mais do extrato
  t = t.replace(/^\+/, '');
  if (/^\(.*\)$/.test(t)) {
    negativo = true;
    t = t.slice(1, -1);
  }
  if (/[-−]/.test(t)) {
    negativo = true;
    t = t.replace(/[-−]/g, '');
  }
  t = t.replace(/^R\$/i, '').replace(/^BRL/i, '').replace(/^\+/, '');
  if (!/^\d[\d.,]*$/.test(t)) return null;
  const virgula = t.lastIndexOf(',');
  const ponto = t.lastIndexOf('.');
  let inteiro: string;
  let fracao = '';
  if (virgula > -1 && virgula > ponto) {
    inteiro = t.slice(0, virgula);
    fracao = t.slice(virgula + 1);
    if (/,/.test(inteiro)) return null; // "1,234,56"
    inteiro = inteiro.replace(/\./g, '');
  } else if (ponto > -1 && virgula === -1 && t.length - ponto - 1 !== 3) {
    inteiro = t.slice(0, ponto);
    fracao = t.slice(ponto + 1);
    if (/\./.test(inteiro)) return null; // "1.234.5"
  } else if (ponto > -1 && virgula > -1) {
    // "1,234.56": formato americano
    inteiro = t.slice(0, ponto).replace(/,/g, '');
    fracao = t.slice(ponto + 1);
  } else {
    inteiro = t.replace(/[.,]/g, '');
  }
  if (fracao.length > 2) return null;
  const centavos = Number(inteiro || '0') * 100 + Number((fracao + '00').slice(0, 2));
  if (!Number.isSafeInteger(centavos)) return null;
  return negativo ? -centavos : centavos;
}

/** 123456 → "R$ 1.234,56"; -8990 → "−R$ 89,90". */
export function formatarDinheiro(centavos: Centavos, opcoes: { semSimbolo?: boolean } = {}): string {
  if (!Number.isSafeInteger(centavos)) {
    throw new RangeError('centavos precisa ser inteiro seguro');
  }
  const negativo = centavos < 0;
  const abs = Math.abs(centavos);
  const inteiro = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const corpo = `${inteiro},${String(abs % 100).padStart(2, '0')}`;
  const texto = opcoes.semSimbolo ? corpo : `R$ ${corpo}`;
  return negativo ? `−${texto}` : texto;
}

/** Centavos × pontos-base, arredondado: 10 % (1000) de 15000 = 1500. Conta inteira até o fim. */
export function aplicarPontosBase(centavos: Centavos, pontosBase: PontosBase): Centavos {
  return arredondar((centavos * pontosBase) / 10000);
}

/** "10" → 1000; "2,5 %" → 250. `null` se não for percentual com até 2 casas. */
export function lerPontosBase(texto: string): PontosBase | null {
  const t = texto.trim().replace(/\s|%/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const [i, f = ''] = t.split('.');
  return Number(i) * 100 + Number((f + '00').slice(0, 2));
}

/** 250 → "2,5 %"; 1000 → "10 %". */
export function formatarPontosBase(pontosBase: PontosBase): string {
  const inteiro = Math.trunc(pontosBase / 100);
  const resto = Math.abs(pontosBase % 100);
  const fracao = resto === 0 ? '' : `,${String(resto).padStart(2, '0').replace(/0$/, '')}`;
  return `${inteiro}${fracao} %`;
}

export function somar(valores: Iterable<Centavos>): Centavos {
  let s = 0;
  for (const v of valores) s += v;
  return s;
}

/** Divide sem perder centavo: 10000 em 3 → [3334, 3333, 3333]. */
export function ratear(total: Centavos, partes: number): Centavos[] {
  if (!Number.isInteger(partes) || partes < 1) throw new RangeError('partes precisa ser inteiro ≥ 1');
  return repartirPorPesos(total, Array.from({ length: partes }, () => 1));
}

/**
 * Reparte um valor por pesos, sem perder centavo (maior resto): o combo de
 * R$ 250 com pesos 2:1 → 16667 + 8333. O centavo que sobra vai para quem
 * tinha o maior resto; no empate, para o primeiro.
 */
export function repartirPorPesos(total: Centavos, pesos: number[]): Centavos[] {
  const soma = pesos.reduce((s, p) => s + p, 0);
  if (!pesos.length || !(soma > 0) || pesos.some((p) => !(p >= 0))) {
    throw new RangeError('pesos precisam ser zero ou mais, com soma positiva');
  }
  const sinal = total < 0 ? -1 : 1;
  const abs = Math.abs(total);
  const exatos = pesos.map((p) => (abs * p) / soma);
  const partes = exatos.map(Math.floor);
  let falta = abs - partes.reduce((s, p) => s + p, 0);
  const ordem = exatos.map((e, i) => ({ i, resto: e - Math.floor(e) })).sort((a, b) => b.resto - a.resto || a.i - b.i);
  for (const { i } of ordem) {
    if (falta <= 0) break;
    partes[i] += 1;
    falta -= 1;
  }
  return partes.map((p) => sinal * p || 0);
}
