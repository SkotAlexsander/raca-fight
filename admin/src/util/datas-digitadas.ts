/**
 * A data que o dono DIGITA numa gaveta (pagar, lembrar, adiar, tarefa,
 * aluno novo), num lugar só (AO, 16/10). Aceita o que a planilha aceita
 * (`lerDataDaPlanilha`: dd/mm/aaaa, d/m/aa, AAAA-MM-DD) e mais o atalho de
 * quem anota rápido:
 * - "hoje", "amanhã", "ontem";
 * - "20/10" sem ano: o ano de hoje;
 * - "20" sozinho: o dia 20 deste mês.
 *
 * Com `futuro` (lembrete, tarefa, adiar), o atalho sem ano ou sem mês vai
 * para a PRÓXIMA vez que o dia chega: "10/01" digitado em dezembro é janeiro
 * do ano que vem, não um lembrete que já nasce atrasado.
 */

import { competenciaDe, ehDataISO, lerDataDaPlanilha, somarDias, somarMeses } from '@dominio/financeiro/datas.ts';
import { normalizar } from '@dominio/financeiro/nomes.ts';
import type { DataISO } from '@dominio/tipos.ts';

export function lerDataDigitada(texto: string, hoje: DataISO, opcoes: { futuro?: boolean } = {}): DataISO | null {
  const t = normalizar(texto);
  if (!t) return null;
  if (t === 'hoje') return hoje;
  if (t === 'amanha') return somarDias(hoje, 1);
  if (t === 'ontem') return somarDias(hoje, -1);
  const soDia = /^(\d{1,2})$/.exec(t);
  if (soDia) {
    const dia = soDia[1]!.padStart(2, '0');
    const deste = `${competenciaDe(hoje)}-${dia}`;
    if (opcoes.futuro && ehDataISO(deste) && deste < hoje) {
      const seguinte = `${somarMeses(competenciaDe(hoje), 1)}-${dia}`;
      return ehDataISO(seguinte) ? seguinte : null;
    }
    return ehDataISO(deste) ? deste : null;
  }
  const semAno = /^(\d{1,2})\/(\d{1,2})$/.exec(t);
  if (semAno) {
    const ano = Number(hoje.slice(0, 4));
    const neste = lerDataDaPlanilha(`${t}/${ano}`);
    if (opcoes.futuro && neste && neste < hoje) return lerDataDaPlanilha(`${t}/${ano + 1}`);
    return neste;
  }
  return lerDataDaPlanilha(t);
}
