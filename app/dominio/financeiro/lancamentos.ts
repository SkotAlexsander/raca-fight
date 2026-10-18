/**
 * Uma linha da planilha: validação (RA4.2). A mesma função roda na tela
 * (antes de gravar a célula) e pode rodar numa Edge Function; quem protege de
 * verdade é o `check` do banco.
 */

import { ehDataISO } from './datas.ts';
import { FORMAS_DE_PAGAMENTO } from './tipos.ts';
import type { Categoria, Lancamento } from './tipos.ts';

export const DESCRICAO_MAXIMA = 200;
export const OBSERVACAO_MAXIMA = 500;

/** Os erros da linha, em frase para a tela. Vazio = pode gravar. */
export function validarLancamento(l: Lancamento, categorias?: readonly Categoria[]): string[] {
  const erros: string[] = [];
  if (!ehDataISO(l.data)) erros.push('A data não existe.');
  const descricao = l.descricao?.trim() ?? '';
  if (!descricao) erros.push('Escreva uma descrição.');
  else if (descricao.length > DESCRICAO_MAXIMA) erros.push(`A descrição passa de ${DESCRICAO_MAXIMA} caracteres.`);
  if (!Number.isSafeInteger(l.valorCentavos) || l.valorCentavos <= 0) erros.push('O valor precisa ser maior que zero.');
  if (l.tipo !== 'entrada' && l.tipo !== 'saida') erros.push('Escolha entrada ou saída.');
  if (l.situacao !== 'pago' && l.situacao !== 'pendente') erros.push('Escolha pago ou pendente.');
  if (l.formaDePagamento && !FORMAS_DE_PAGAMENTO.includes(l.formaDePagamento)) erros.push('Forma de pagamento desconhecida.');
  if (l.observacao && l.observacao.length > OBSERVACAO_MAXIMA) erros.push(`A observação passa de ${OBSERVACAO_MAXIMA} caracteres.`);
  if (categorias && l.categoriaId) {
    const c = categorias.find((x) => x.id === l.categoriaId);
    if (!c) erros.push('A categoria não existe.');
    else if (c.tipo !== l.tipo) erros.push(`A categoria "${c.nome}" é de ${c.tipo === 'entrada' ? 'entrada' : 'saída'}.`);
  }
  return erros;
}
