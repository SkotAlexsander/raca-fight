/**
 * AS REGRAS DE COBRANÇA PROVISÓRIAS — o único lugar com esses números.
 *
 * A academia ainda não respondeu as perguntas A3, A6, A7, A8, A9 e A15
 * (`01-especificacao/admin/90-PERGUNTAS-PARA-O-ALEX.md`). Até lá, o Admin usa
 * a RECOMENDAÇÃO de cada pergunta, marcada como provisória. O dono troca tudo
 * em Ajustes › Regras de cobrança, e a troca vai ao histórico.
 *
 * Quando as respostas chegarem: mude aqui (vale para dados novos e para o
 * modo local) e, no Supabase, a linha de `regras_de_cobranca` da academia.
 */

import type { RegrasDeCobranca } from '@dominio/financeiro/tipos.ts';

export function regrasProvisorias(academiaId: string, em: string): RegrasDeCobranca {
  return {
    academiaId,
    // A7: recomendação = o mês cheio, vencendo no dia da matrícula
    primeiroMes: 'cheio',
    // A3: a recomendação (2 %, 1 % ao mês, 5 dias) só liga depois do contador; até lá, NÃO cobra
    atraso: null,
    // A6: gerar sozinho no dia 1 fica desligado até o Alex aprovar
    gerarSozinhoNoDia1: false,
    // A15: chamar de volta 3 dias depois da aula experimental
    diasParaRetornoDaExperimental: 3,
    // A8: 10 % de família é só exemplo; o Admin sugere, nunca aplica sozinho
    descontoFamilia: { tipo: 'percentual', pontosBase: 1000 },
    // A9 (= L26): "Traga um amiguinho", R$ 30,00 por 1 mês, para os dois (exemplo)
    descontoIndicacao: { tipo: 'valor', centavos: 3000, mesesDeDuracao: 1 },
    // L23: 180 dias sem movimento
    diasParaApagarInteressado: 180,
    // o WhatsApp do perfil da Raça Fight (dado público, 01-DADOS-REAIS.md)
    whatsappDaAcademia: '5551981962077',
    provisorio: true,
    atualizadoEm: em,
  };
}
