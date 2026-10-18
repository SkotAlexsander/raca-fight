/**
 * Formatação só de tela. Dinheiro, data e mês vêm do domínio
 * (`formatarDinheiro`, `formatarDataBR`, `nomeDaCompetencia`); aqui ficam os
 * atalhos que a tela repete.
 */

import { formatarDinheiro, formatarPontosBase } from '@dominio/financeiro/dinheiro.ts';
import { nomeDaCompetencia } from '@dominio/financeiro/datas.ts';
import type { Variacao } from '@dominio/financeiro/totais.ts';

export const reais = (c: number) => formatarDinheiro(c);

/** "+R$ 1.424,00" / "−R$ 391,90" / "R$ 0,00". */
export function reaisComSinal(c: number): string {
  return c > 0 ? `+${formatarDinheiro(c)}` : formatarDinheiro(c);
}

/** "15/10" */
export const diaMes = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** "Outubro de 2026" */
export function mesTitulo(comp: string): string {
  const n = nomeDaCompetencia(comp);
  return n.charAt(0).toUpperCase() + n.slice(1);
}

/** "outubro" */
export const nomeDoMes = (comp: string) => nomeDaCompetencia(comp).split(' de ')[0];

/** "+6,2 %" ou "—" quando não há base (RA2.5). Uma casa, como o painel do AK. */
export function percentual(v: Variacao): string {
  if (v.pontosBase == null) return '—';
  const pb = Math.round(v.pontosBase / 10) * 10;
  const t = formatarPontosBase(Math.abs(pb)).replace(/(,\d)\d? %$/, '$1 %');
  return `${pb > 0 ? '+' : pb < 0 ? '−' : ''}${t}`;
}

export const iniciais = (nome: string) =>
  nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('');

export const primeiroNome = (nome: string) => nome.split(/\s+/)[0] ?? nome;

export const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
