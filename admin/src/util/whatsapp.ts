/**
 * "Cobrar no WhatsApp" (RA5.5): abre o wa.me com o texto pronto. O Admin não
 * manda nada sozinho na v1. O texto não sai daqui para log nenhum.
 */

import { formatarDinheiro } from '@dominio/financeiro/dinheiro.ts';
import { formatarDataBR } from '@dominio/financeiro/datas.ts';
import type { DataISO } from '@dominio/tipos.ts';
import { primeiroNome } from './formatar.ts';

/** "(51) 98196-2077" → "5551981962077". Sem DDD ou curto demais: null. */
export function numeroDoWhatsapp(telefone?: string): string | null {
  const d = (telefone ?? '').replace(/\D/g, '');
  if (d.length === 10 || d.length === 11) return `55${d}`;
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d;
  return null;
}

export function mensagemDeCobranca(p: { nome: string; mes: string; vencimento: DataISO; centavos: number; academia: string; quantas?: number }): string {
  const oQue = p.quantas && p.quantas > 1 ? `${p.quantas} mensalidades da ${p.academia} estão em aberto` : `A mensalidade de ${p.mes} da ${p.academia} venceu em ${formatarDataBR(p.vencimento).slice(0, 5)}`;
  return `Olá, ${primeiroNome(p.nome)}! ${oQue}, no valor de ${formatarDinheiro(p.centavos)}. Se já pagou, desconsidere.`;
}

export function linkDoWhatsapp(numero: string, texto: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
