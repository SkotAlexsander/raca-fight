/**
 * Ler e escrever os nomes que a planilha usa: categoria, pessoa, modalidade,
 * tipo, forma de pagamento e situação. Usado pela importação, pela grade e
 * pela exportação, para que o que sai volte igual.
 */

import type { Id } from '../tipos.ts';
import type { FormaDePagamento, SituacaoDoLancamento, TipoDeLancamento } from './tipos.ts';

/** Minúsculas, sem acento, sem pontuação nas pontas, espaços simples. */
export function normalizar(t: string): string {
  return t
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[?!:.]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Acha pelo nome: igual (sem acento e caixa) ou, se só um bater, pelo começo
 * do nome em fronteira de palavra ("Equipamento" → "Equipamento (tatame…)",
 * "bruno" → "Bruno Almeida"). Mais de um candidato = nenhum (não adivinha).
 */
export function acharPorNome<T extends { id: Id; nome: string }>(lista: readonly T[], texto: string): T | undefined {
  const alvo = normalizar(texto);
  if (!alvo) return undefined;
  const exatos = lista.filter((x) => normalizar(x.nome) === alvo);
  if (exatos.length === 1) return exatos[0];
  if (exatos.length > 1) return undefined;
  const comeco = lista.filter((x) => {
    const n = normalizar(x.nome);
    return n.startsWith(alvo) && /[\s(/-]/.test(n.charAt(alvo.length));
  });
  return comeco.length === 1 ? comeco[0] : undefined;
}

export function lerTipo(texto: string): TipoDeLancamento | null {
  const t = normalizar(texto);
  if (/^(entrada|entradas|receita|receitas|recebimento|recebido|credito|e|\+)$/.test(t)) return 'entrada';
  if (/^(saida|saidas|despesa|despesas|gasto|gastos|pagamento|debito|s|-)$/.test(t)) return 'saida';
  return null;
}

/** `null` = vazio (quem chama decide pelo dia); `undefined` = não entendi. */
export function lerSituacao(texto: string): SituacaoDoLancamento | null | undefined {
  const t = normalizar(texto);
  if (!t) return null;
  if (/^(pago|paga|pagos|ok|sim|s|x|✓|✔|quitado|quitada|recebido|recebida|feito)$/.test(t)) return 'pago';
  if (/^(pendente|nao|n|aberto|aberta|em aberto|a pagar|a receber|falta|atrasado|atrasada)$/.test(t)) return 'pendente';
  return undefined;
}

/** `undefined` = vazio; `null` = não entendi. */
export function lerForma(texto: string): FormaDePagamento | null | undefined {
  const t = normalizar(texto);
  if (!t) return undefined;
  if (/^pix/.test(t)) return 'pix';
  if (/^(dinheiro|especie|em especie|cash)$/.test(t)) return 'dinheiro';
  if (/debito/.test(t)) return 'cartao_debito';
  if (/(credito|cartao)/.test(t)) return 'cartao_credito';
  if (/^boleto/.test(t)) return 'boleto';
  if (/^(transferencia|ted|doc|deposito)/.test(t)) return 'transferencia';
  if (/^outr/.test(t)) return 'outro';
  return null;
}

export const ROTULO_DA_FORMA: Record<FormaDePagamento, string> = {
  pix: 'Pix', dinheiro: 'Dinheiro', cartao_credito: 'Cartão de crédito', cartao_debito: 'Cartão de débito',
  boleto: 'Boleto', transferencia: 'Transferência', outro: 'Outro',
};

export const ROTULO_DO_TIPO: Record<TipoDeLancamento, string> = { entrada: 'Entrada', saida: 'Saída' };

export const ROTULO_DA_SITUACAO: Record<SituacaoDoLancamento, string> = { pago: 'Pago', pendente: 'Pendente' };
