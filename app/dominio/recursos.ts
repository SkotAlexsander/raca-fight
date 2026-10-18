/**
 * As chaves do que está LIGADO na v1 de luta (P12, agente AM2).
 *
 * O Plus (personal acompanhando pelo app) e a dieta ficam DESLIGADOS na v1:
 * são [decidir] L12 e L13 (`01-especificacao/luta/90-PERGUNTAS-PARA-O-ALEX.md`).
 * A especificação deles NÃO foi apagada. Com a chave desligada, as telas e as
 * rotas do Plus e da dieta não aparecem e o endereço volta ao começo.
 *
 * Ligar é uma decisão do Alex, não do código.
 */
export const RECURSOS = {
  /** L12: o Plus continua numa academia de luta? */
  plus: false,
  /** L13: a dieta continua (só com nutricionista)? */
  dieta: false,
} as const;

export type Recurso = keyof typeof RECURSOS;

export function recursoLigado(r: Recurso): boolean {
  return RECURSOS[r];
}
