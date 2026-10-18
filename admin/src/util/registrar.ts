/**
 * O ÚNICO lugar do Admin que escreve no console (o ESLint proíbe `console`
 * no resto). Dado financeiro NUNCA vai para log (RA1.5): o que passa por aqui
 * sai redigido, e só o nome e o código do erro aparecem.
 *
 * O `app/dados/redigir.ts` é do app (agente AM2) e cuida do dado de saúde. Os
 * campos do dinheiro foram pedidos a ele no relatório AM1; até lá, esta lista
 * é a do Admin.
 */

export const REDIGIDO = '[redigido]';

/** Campos que nunca aparecem: valor, descrição, nota, lembrete, telefone, nome. */
const CAMPOS = new Set([
  'descricao', 'observacao', 'texto', 'titulo', 'detalhe', 'telefone', 'whatsapp', 'email', 'documento', 'nome',
  'mudancas', 'totais', 'porCategoria', 'remuneracao', 'descontos', 'reparticao', 'motivo', 'motivoDaReabertura',
]);

export function campoFinanceiro(nome: string): boolean {
  return CAMPOS.has(nome) || /(Centavos|PontosBase)$/.test(nome) || /^valor/i.test(nome) || /^aReceber/.test(nome);
}

export function redigir(valor: unknown, profundidade = 0): unknown {
  if (profundidade > 6) return REDIGIDO;
  if (Array.isArray(valor)) return valor.map((v) => redigir(v, profundidade + 1));
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.entries(valor as Record<string, unknown>).map(([k, v]) => [k, campoFinanceiro(k) ? REDIGIDO : redigir(v, profundidade + 1)]));
  }
  // número solto pode ser dinheiro; texto solto pode ser uma descrição
  if (typeof valor === 'number' || typeof valor === 'string') return REDIGIDO;
  return valor;
}

/** Erro → só o nome e o código; nunca a mensagem do servidor (pode conter a linha recusada). */
export function redigirErro(e: unknown): { nome: string; codigo?: string } {
  if (e && typeof e === 'object') {
    const o = e as { name?: unknown; code?: unknown };
    return { nome: typeof o.name === 'string' ? o.name : 'Erro', ...(typeof o.code === 'string' ? { codigo: o.code } : {}) };
  }
  return { nome: 'Erro' };
}

/** Avisa no console de desenvolvimento, sem dado. Em produção, nada. */
export function registrarErro(onde: string, e: unknown): void {
  if (!import.meta.env.DEV) return;
  // eslint-disable-next-line no-console
  console.warn(`[admin] ${onde}`, redigirErro(e));
}
